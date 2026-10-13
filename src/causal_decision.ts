import { compile_causal_document, type CompiledCausalProblem } from './causal'
import { CAUSAL_LIMITS, parse_causal_document, type CausalDocument } from './causal_syntax'
import { MAX_ABS_SOLVER_EXPONENT } from './pr_sat'
import type { S } from './s'
import { optimize_decision_input } from './causal_decision_optimization'
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
  /** Boolean polynomial with exact rational coefficients formula for conclusion satisfaction. */
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

/** The solver accepts only this module's frozen polynomial SMT envelopes. */
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

/** Exact finite-DAG reduction for satisfiability and guarded-satisfaction entailment. */
export const compile_decision_problem = (input: DecisionProblemInput): CompiledDecisionProblem => {
  const parsed = parse_decision_input(input)
  const causal = compile_causal_document(parsed.document, { regular: parsed.regular, smt_character_limit: DECISION_LIMITS.max_smt_characters })
  const boundsCount = causal.mechanisms.length * 2
  const premiseConstraints = causal.constraints.slice(boundsCount, boundsCount + parsed.premiseCount)
  const conclusionConstraint = parsed.task === 'entailment' ? causal.constraints[causal.constraints.length - 1] : undefined
  const optimized = optimize_decision_input(parsed, causal, DECISION_LIMITS, integer_exponent)
  const { variables, premisesSmt, counterexampleSmt } = optimized
  const conclusionSatisfaction = optimized.conclusionS
  const auxiliaryVariables = optimized.lowering.aux
  const compiled: CompiledDecisionProblem = {
    task: parsed.task, causal, variables, auxiliaryVariables,
    premisesSmt, counterexampleSmt, conclusionConstraint, conclusionSatisfaction, premiseConstraints,
  }
  // Model rendering/evaluation may follow an awaited solver run. Keep the
  // associated query, mechanism and original AST metadata unchanged as well.
  freeze_metadata(compiled)
  compiled_problems.add(compiled)
  return compiled
}
