import { compile_causal_document, type CompiledCausalProblem } from './causal'
import { CAUSAL_LIMITS, parse_causal_document, type CausalDocument } from './causal_syntax'
import { MAX_ABS_SOLVER_EXPONENT } from './pr_sat'
import { s_to_string, type S } from './s'
import type { PrSat } from './types'

type RealExpr = PrSat['RealExpr']
type Constraint = PrSat['Constraint']

export type DecisionTask = 'satisfiability' | 'entailment'

export interface DecisionProblemInput {
  graph: string
  premises: string
  conclusion?: string
  regular: boolean
  task: DecisionTask
}

export const DECISION_LIMITS = {
  max_auxiliary_variables: 20_000,
  max_smt_characters: 2_000_000,
} as const

export interface ParsedDecisionInput {
  task: DecisionTask
  regular: boolean
  document: CausalDocument
  premiseCount: number
}

export interface CompiledDecisionProblem {
  task: DecisionTask
  /** Joint metadata only: causal.smtlib also asserts the conclusion, if present. */
  causal: CompiledCausalProblem
  variables: string[]
  auxiliaryVariables: string[]
  /** Graph bounds, total polynomial definitions and the guarded premises. */
  premisesSmt: string
  /** The same theory with the Boolean complement of conclusion satisfaction. */
  counterexampleSmt?: string
  /** Already guarded Phase 1 satisfaction AST, for exact model inspection. */
  conclusionConstraint?: Constraint
  /** Division-free Boolean polynomial formula for conclusion satisfaction. */
  conclusionSatisfaction?: S
  premiseConstraints: Constraint[]
}

const compiled_problems = new WeakSet<CompiledDecisionProblem>()

const freeze_metadata = (value: unknown, visited = new Set<object>()): void => {
  if (typeof value !== 'object' || value === null || visited.has(value)) return
  visited.add(value)
  for (const child of Object.values(value)) freeze_metadata(child, visited)
  Object.freeze(value)
}

/** The solver accepts only this module's frozen, division-free SMT envelopes. */
export const is_compiled_decision_problem = (value: unknown): value is CompiledDecisionProblem =>
  typeof value === 'object' && value !== null && compiled_problems.has(value as CompiledDecisionProblem)

const constraint_lines = (source: string): string[] => source.split(/\r?\n/)
  .map(line => line.split('#', 1)[0].trim())
  .filter(line => line.length !== 0)

/** Validate and parse jointly, preserving one query namespace in both parts. */
export const parse_decision_input = (input: DecisionProblemInput): ParsedDecisionInput => {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('A decision problem must be an object.')
  }
  // Read once so even accessor-backed API inputs are compiled with exactly the
  // same values and regularity that passed validation.
  const { graph, premises: premiseText, conclusion: optionalConclusion, regular, task } = input
  if (typeof graph !== 'string' || typeof premiseText !== 'string' ||
      (optionalConclusion !== undefined && typeof optionalConclusion !== 'string')) {
    throw new Error('The graph, premises and optional conclusion must be strings.')
  }
  if (typeof regular !== 'boolean') throw new Error('Regularity must be a Boolean value.')
  if (task !== 'satisfiability' && task !== 'entailment') {
    throw new Error('Choose satisfiability or entailment as the decision task.')
  }
  const conclusion = optionalConclusion ?? ''
  // Check raw text before removing comments or blank lines. This prevents a large
  // apparently empty input from escaping the existing parser's resource bound.
  if (graph.length + premiseText.length + conclusion.length > CAUSAL_LIMITS.max_input_characters) {
    throw new Error(`Causal input is limited to ${CAUSAL_LIMITS.max_input_characters} characters.`)
  }
  const premises = constraint_lines(premiseText)
  const conclusions = constraint_lines(conclusion)
  if (task === 'entailment' && conclusions.length !== 1) {
    throw new Error('Entailment requires exactly one conclusion constraint line.')
  }
  if (task === 'satisfiability' && conclusions.length !== 0) {
    throw new Error('A satisfiability problem has premises only; omit the conclusion.')
  }
  const document = parse_causal_document(graph, [...premises, ...conclusions].join('\n'))
  return { task, regular, document, premiseCount: premises.length }
}

// Parsed numeric spelling, rather than its rounded JavaScript approximation,
// is authoritative. The existing causal compiler also validates this boundary.
const integer_exponent = (expression: RealExpr): number => {
  const literal = expression.tag === 'literal' ? expression
    : expression.tag === 'negative' && expression.expr.tag === 'literal' ? expression.expr
    : undefined
  if (literal === undefined) throw new Error('Exponentiation requires an integer literal exponent.')
  const sign = expression.tag === 'negative' ? -1 : 1
  const spelling = literal.source ?? String(literal.value)
  const match = /^([0-9]+)(?:\.0+)?$/.exec(spelling)
  if (match === null) throw new Error('Exponentiation requires an integer literal exponent.')
  const magnitude = BigInt(match[1])
  if (magnitude > BigInt(MAX_ABS_SOLVER_EXPONENT) || literal.value !== Number(magnitude)) {
    throw new Error(`Exponent magnitude must be at most ${MAX_ABS_SOLVER_EXPONENT}.`)
  }
  return sign * Number(magnitude)
}

/**
 * Conservative definitional extension by total polynomial relations.
 *
 * At a nonzero denominator the quotient auxiliary has its unique usual value.
 * At denominator zero it is unconstrained, so a definition cannot accidentally
 * exclude a model whose satisfied Boolean branch does not use that quotient.
 * Existing local definedness guards ensure that every observed defined term has
 * its usual value and every undefined guarded atom is false independently of
 * those arbitrary values. In particular, negating the already guarded conclusion
 * includes its undefined cases. No extra global denominator guards are added.
 */
class PolynomialLowering {
  readonly auxiliaryVariables: string[] = []
  readonly definitions: S[] = []
  private readonly occupied: Set<string>
  private readonly realMemo = new WeakMap<RealExpr, S>()
  private readonly constraintMemo = new WeakMap<Constraint, S>()
  private emittedCharacters = 0
  private ordinal = 0

  constructor(variables: string[]) { this.occupied = new Set(variables) }

  private fresh(): string {
    if (this.auxiliaryVariables.length >= DECISION_LIMITS.max_auxiliary_variables) {
      throw new Error(`Decision reduction is limited to ${DECISION_LIMITS.max_auxiliary_variables} auxiliary variables.`)
    }
    let name: string
    do { name = `decision_aux_${++this.ordinal}` } while (this.occupied.has(name))
    this.occupied.add(name)
    this.auxiliaryVariables.push(name)
    return name
  }

  private define(formula: S): void {
    this.emittedCharacters += s_to_string(formula, false).length
    if (this.emittedCharacters > DECISION_LIMITS.max_smt_characters) {
      throw new Error(`Decision reduction is limited to ${DECISION_LIMITS.max_smt_characters} SMT characters.`)
    }
    this.definitions.push(formula)
  }

  private operation(operator: '+' | '-' | '*', arguments_: S[]): S {
    const variable = this.fresh()
    this.define(['=', variable, [operator, ...arguments_]])
    return variable
  }

  private quotient(numerator: S, denominator: S): S {
    const variable = this.fresh()
    this.define(['or', ['=', denominator, '0'], ['=', ['*', variable, denominator], numerator]])
    return variable
  }

  private positive_power(base: S, exponent: number): S {
    if (exponent === 0) return '1'
    if (exponent === 1) return base
    const half = this.positive_power(base, Math.floor(exponent / 2))
    const square = this.operation('*', [half, half])
    return exponent % 2 === 0 ? square : this.operation('*', [square, base])
  }

  real(expression: RealExpr): S {
    const cached = this.realMemo.get(expression)
    if (cached !== undefined) return cached
    let result: S
    switch (expression.tag) {
      case 'literal': result = expression.source ?? String(expression.value); break
      case 'variable': result = expression.id; break
      case 'negative': result = this.operation('-', [this.real(expression.expr)]); break
      case 'plus': case 'minus': case 'multiply': {
        const operator = expression.tag === 'plus' ? '+' : expression.tag === 'minus' ? '-' : '*'
        result = this.operation(operator, [this.real(expression.left), this.real(expression.right)])
        break
      }
      case 'divide': result = this.quotient(this.real(expression.numerator), this.real(expression.denominator)); break
      case 'power': {
        const exponent = integer_exponent(expression.exponent)
        // Visit the base even for exponent zero. Its local definedness guards
        // are retained by Phase 1, so an undefined base does not become defined.
        const powered = this.positive_power(this.real(expression.base), Math.abs(exponent))
        result = exponent < 0 ? this.quotient('1', powered) : powered
        break
      }
      case 'probability': case 'given_probability': case 'state_variable_sum':
        throw new Error(`Untranslated expression '${expression.tag}' in decision reduction.`)
    }
    this.realMemo.set(expression, result)
    return result
  }

  constraint(constraint: Constraint): S {
    const cached = this.constraintMemo.get(constraint)
    if (cached !== undefined) return cached
    let result: S
    switch (constraint.tag) {
      case 'negation': result = ['not', this.constraint(constraint.constraint)]; break
      case 'conjunction': case 'disjunction': case 'conditional': case 'biconditional': {
        const operator = constraint.tag === 'conjunction' ? 'and'
          : constraint.tag === 'disjunction' ? 'or'
          : constraint.tag === 'conditional' ? '=>' : '='
        result = [operator, this.constraint(constraint.left), this.constraint(constraint.right)]
        break
      }
      default: {
        const operator = constraint.tag === 'less_than' ? '<'
          : constraint.tag === 'less_than_or_equal' ? '<='
          : constraint.tag === 'greater_than' ? '>'
          : constraint.tag === 'greater_than_or_equal' ? '>=' : '='
        const comparison: S = [operator, this.real(constraint.left), this.real(constraint.right)]
        result = constraint.tag === 'not_equal' ? ['not', comparison] : comparison
      }
    }
    this.constraintMemo.set(constraint, result)
    return result
  }
}

const emit_smt = (variables: string[], definitions: S[], constraints: S[]): string => {
  const lines: string[] = []
  let characters = 0
  const append = (expression: S): void => {
    const line = s_to_string(expression, false)
    characters += line.length + (lines.length === 0 ? 0 : 1)
    if (characters > DECISION_LIMITS.max_smt_characters) {
      throw new Error(`Decision reduction is limited to ${DECISION_LIMITS.max_smt_characters} SMT characters.`)
    }
    lines.push(line)
  }
  append(['set-logic', 'QF_NRA'])
  for (const variable of variables) append(['declare-fun', variable, [], 'Real'])
  for (const formula of [...definitions, ...constraints]) append(['assert', formula])
  return lines.join('\n')
}

/** Exact finite-DAG reduction for satisfiability and guarded-satisfaction entailment. */
export const compile_decision_problem = (input: DecisionProblemInput): CompiledDecisionProblem => {
  const parsed = parse_decision_input(input)
  const causal = compile_causal_document(parsed.document, { regular: parsed.regular })
  const boundsCount = causal.mechanisms.length * 2
  const premiseConstraints = causal.constraints.slice(boundsCount, boundsCount + parsed.premiseCount)
  const premisesAndBounds = causal.constraints.slice(0, boundsCount + parsed.premiseCount)
  const conclusionConstraint = parsed.task === 'entailment' ? causal.constraints[causal.constraints.length - 1] : undefined
  const lowering = new PolynomialLowering(causal.variables)
  const premises = premisesAndBounds.map(constraint => lowering.constraint(constraint))
  const conclusionSatisfaction = conclusionConstraint === undefined ? undefined : lowering.constraint(conclusionConstraint)
  const variables = [...causal.variables, ...lowering.auxiliaryVariables]
  const premisesSmt = emit_smt(variables, lowering.definitions, premises)
  const counterexampleSmt = conclusionSatisfaction === undefined ? undefined
    : emit_smt(variables, lowering.definitions, [...premises, ['not', conclusionSatisfaction]])
  const compiled: CompiledDecisionProblem = {
    task: parsed.task, causal, variables, auxiliaryVariables: lowering.auxiliaryVariables,
    premisesSmt, counterexampleSmt, conclusionConstraint, conclusionSatisfaction, premiseConstraints,
  }
  // Model rendering/evaluation may follow an awaited solver run. Keep the
  // associated query, mechanism and original AST metadata unchanged as well.
  freeze_metadata(compiled)
  compiled_problems.add(compiled)
  return compiled
}
