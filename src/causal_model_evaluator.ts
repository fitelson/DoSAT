import type { Arith, Bool, Context, Expr, Z3HighLevel } from 'z3-solver'
import { compile_causal_document } from './causal'
import { parse_causal_document, type CausalGraph } from './causal_syntax'
import { parse_causal_evaluation } from './causal_evaluation_syntax'
import { div0_conditions_in_real_expr, MAX_ABS_SOLVER_EXPONENT } from './pr_sat'
import type { DecisionWitness, ExactDecisionValue } from './causal_decision_solver'
import type { PrSat } from './types'

type RealExpr = PrSat['RealExpr']
type Constraint = PrSat['Constraint']
type EvalContext = Context<'causal_model_evaluation'>
type EvalArith = Arith<'causal_model_evaluation'>
type EvalBool = Bool<'causal_model_evaluation'>
type ProbabilityValues = ({ source: string } & ExactDecisionValue)[]

export type ModelEvaluationResult =
  | { status: 'value', kind: 'real', value: string, probabilities: ProbabilityValues }
  | { status: 'value', kind: 'constraint', value: boolean, probabilities: ProbabilityValues }
  | { status: 'undefined', reason: string, probabilities: ProbabilityValues }
  | { status: 'error', message: string }
  | { status: 'cancelled' }

export type CapturedCausalModel = Readonly<{
  graph: string
  mechanisms: readonly Readonly<{ node: string, parents: Readonly<Record<string, boolean>>, value: string }>[]
  freeParameters: readonly Readonly<{ variable: string, value: string }>[]
}>

export const CAUSAL_EVALUATION_LIMITS = {
  max_value_characters: 32_768,
  max_value_tokens: 4_096,
  max_value_depth: 64,
  max_snapshot_characters: 2_000_000,
  max_free_parameters: 4_096,
} as const

type NumericS = string | NumericS[]
type Rational = { numerator: bigint, denominator: bigint }
const numberToken = /^[0-9]+(?:\.[0-9]+)?$/

/** Only concrete rationals/algebraic roots are accepted, never SMT commands or names. */
const validate_exact_value = (source: string): void => {
  if (typeof source !== 'string' || !source.trim() || source.length > CAUSAL_EVALUATION_LIMITS.max_value_characters) {
    throw new Error('Invalid or oversized exact model value.')
  }
  const tokens = source.match(/[()]|[^\s()]+/g) ?? []
  if (tokens.length > CAUSAL_EVALUATION_LIMITS.max_value_tokens) throw new Error('Exact model value has too many tokens.')
  let cursor = 0
  const read = (depth: number): NumericS => {
    if (depth > CAUSAL_EVALUATION_LIMITS.max_value_depth) throw new Error('Exact model value is too deeply nested.')
    const token = tokens[cursor++]
    if (token === undefined || token === ')') throw new Error('Malformed exact model value.')
    if (token !== '(') return token
    const list: NumericS[] = []
    while (tokens[cursor] !== ')') {
      if (cursor >= tokens.length) throw new Error('Malformed exact model value.')
      list.push(read(depth + 1))
    }
    cursor++
    return list
  }
  const parsed = read(0)
  if (cursor !== tokens.length) throw new Error('Exact model value must be one numeric expression.')
  const rational = (value: NumericS): Rational | undefined => {
    if (typeof value === 'string') {
      if (!numberToken.test(value)) return undefined
      const [integer, fraction = ''] = value.split('.')
      return { numerator: BigInt(integer + fraction), denominator: 10n ** BigInt(fraction.length) }
    }
    if (value[0] === '-' && value.length === 2) {
      const inner = rational(value[1])
      return inner && { ...inner, numerator: -inner.numerator }
    }
    if (value[0] === '/' && value.length === 3) {
      const numerator = rational(value[1]), denominator = rational(value[2])
      if (!numerator || !denominator) return undefined
      if (denominator.numerator === 0n) throw new Error('Exact model value divides by zero.')
      return { numerator: numerator.numerator * denominator.denominator, denominator: numerator.denominator * denominator.numerator }
    }
    return undefined
  }
  const polynomial = (value: NumericS): { degree: number, size: number } => {
    if (value === 'x') return { degree: 1, size: 1 }
    if (rational(value)) return { degree: 0, size: JSON.stringify(value).length }
    if (!Array.isArray(value)) throw new Error('Algebraic roots may use only their bound polynomial variable x.')
    const [operator, ...args] = value
    if (operator === '^' && args.length === 2 && typeof args[1] === 'string' && /^[0-9]+$/.test(args[1])) {
      const exponent = Number(args[1])
      if (!Number.isSafeInteger(exponent) || exponent > MAX_ABS_SOLVER_EXPONENT) throw new Error('Algebraic exponent is too large.')
      const base = polynomial(args[0])
      const result = { degree: base.degree * exponent, size: Math.max(1, base.size * exponent) }
      if (result.degree > MAX_ABS_SOLVER_EXPONENT || result.size > CAUSAL_EVALUATION_LIMITS.max_value_characters) throw new Error('Algebraic polynomial expands beyond the supported bounds.')
      return result
    }
    if (!((operator === '+' || operator === '*') && args.length >= 2 || operator === '-' && (args.length === 1 || args.length === 2))) {
      throw new Error('Unsupported algebraic polynomial expression.')
    }
    const terms = args.map(polynomial)
    const result = { degree: operator === '*' ? terms.reduce((sum, term) => sum + term.degree, 0) : Math.max(...terms.map(term => term.degree)), size: terms.reduce((sum, term) => sum + term.size, 0) }
    if (result.degree > MAX_ABS_SOLVER_EXPONENT || result.size > CAUSAL_EVALUATION_LIMITS.max_value_characters) throw new Error('Algebraic polynomial expands beyond the supported bounds.')
    return result
  }
  const concrete = (value: NumericS): void => {
    if (rational(value)) return
    if (Array.isArray(value) && value[0] === '-' && value.length === 2) { concrete(value[1]); return }
    if (!Array.isArray(value) || value[0] !== 'root-obj' || value.length !== 3 || typeof value[2] !== 'string' || !/^[1-9][0-9]*$/.test(value[2])) {
      throw new Error('Expected an exact rational or algebraic root value.')
    }
    const description = polynomial(value[1]), index = Number(value[2])
    if (description.degree === 0 || !Number.isSafeInteger(index) || index > description.degree) throw new Error('Invalid algebraic root index or polynomial degree.')
  }
  concrete(parsed)
}

const signature = (graph: CausalGraph, node: string, parents: Readonly<Record<string, boolean>>): string => {
  const expected = graph.nodes.filter(name => (graph.parents[node] ?? []).includes(name))
  const names = Object.keys(parents)
  if (names.length !== expected.length || names.some(name => !expected.includes(name)) || expected.some(name => typeof parents[name] !== 'boolean')) {
    throw new Error(`Invalid captured parent assignment for ${node}.`)
  }
  return JSON.stringify([node, ...expected.map(name => parents[name])])
}

/** Evaluates one fixed shared kernel; no native Model or solver search is retained. */
export class CausalModelEvaluator {
  private context: EvalContext | undefined
  private busy = false
  private readonly captures = new WeakSet<CapturedCausalModel>()

  constructor(private readonly z3: Z3HighLevel) {}

  capture(graph: string, witness: DecisionWitness): CapturedCausalModel {
    const template = compile_causal_document(parse_causal_document(graph, ''))
    const causalGraph = parse_causal_document(graph, '').graph
    if (!witness || typeof witness !== 'object' || !Array.isArray(witness.mechanisms) || !Array.isArray(witness.freeParameters)) throw new Error('Expected an exact causal witness snapshot.')
    if (witness.mechanisms.length !== template.mechanisms.length || witness.freeParameters.length > CAUSAL_EVALUATION_LIMITS.max_free_parameters) throw new Error('The captured kernel is incomplete or the snapshot is too large.')
    const kernel = new Map<string, string>()
    let characters = graph.length
    const exact = (value: string): string => {
      validate_exact_value(value)
      characters += value.length
      if (characters > CAUSAL_EVALUATION_LIMITS.max_snapshot_characters) throw new Error('The captured snapshot is too large.')
      return value
    }
    for (const item of witness.mechanisms) {
      if (!item || typeof item !== 'object' || typeof item.node !== 'string' || !causalGraph.nodes.includes(item.node) || !item.parents || typeof item.parents !== 'object' || Array.isArray(item.parents)) throw new Error('Invalid captured causal mechanism.')
      const key = signature(causalGraph, item.node, item.parents)
      if (kernel.has(key)) throw new Error('The captured kernel contains a duplicate mechanism.')
      kernel.set(key, exact(item.value))
    }
    const mechanisms = template.mechanisms.map(item => {
      const value = kernel.get(signature(causalGraph, item.node, item.parents))
      if (value === undefined) throw new Error('The captured kernel is incomplete.')
      return Object.freeze({ node: item.node, parents: Object.freeze({ ...item.parents }), value })
    })
    const seen = new Set<string>()
    const freeParameters = witness.freeParameters.map(item => {
      if (!item || typeof item !== 'object' || typeof item.variable !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(item.variable) || ['true', 'false', 'Real', 'Bool', 'Int', 'let', 'forall', 'exists'].includes(item.variable)) throw new Error('Invalid captured free real variable.')
      if (seen.has(item.variable)) throw new Error('The snapshot contains a duplicate free real variable.')
      seen.add(item.variable)
      return Object.freeze({ variable: item.variable, value: exact(item.value) })
    })
    const captured = Object.freeze({ graph, mechanisms: Object.freeze(mechanisms), freeParameters: Object.freeze(freeParameters) })
    this.captures.add(captured)
    return captured
  }

  async evaluate(model: CapturedCausalModel, source: string, options: { abort_signal?: AbortSignal } = {}): Promise<ModelEvaluationResult> {
    const signal = options.abort_signal
    if (signal?.aborted) return { status: 'cancelled' }
    if (this.busy) return { status: 'error', message: 'This model evaluator is already running.' }
    if (!this.captures.has(model)) return { status: 'error', message: 'Expected a model captured by this evaluator.' }
    this.busy = true
    const cancelled = (): void => { if (signal?.aborted) throw new Error('Model evaluation cancelled.') }
    const accept = (result: ModelEvaluationResult): ModelEvaluationResult => { cancelled(); return result }
    try {
      const parsed = parse_causal_evaluation(model.graph, source)
      const compiled = compile_causal_document(parsed.document)
      const free = new Map(model.freeParameters.map(item => [item.variable, item.value]))
      const mechanismNames = new Set(compiled.mechanisms.map(item => item.parameter))
      const missing = compiled.variables.filter(name => !mechanismNames.has(name) && !free.has(name))
      if (missing.length) throw new Error(`Unassigned free real variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`)
      cancelled()
      this.context ??= new this.z3.Context('causal_model_evaluation')
      const ctx = this.context
      const simplify = async <T extends Expr<'causal_model_evaluation'>>(expression: T): Promise<Expr<'causal_model_evaluation'>> => {
        cancelled()
        // Cooperatively stop at boundaries; never release ownership or return a
        // result before an already-started native simplification has settled.
        const result = await ctx.simplify(expression)
        cancelled()
        return result
      }
      const concrete = new Map<string, EvalArith>()
      const readValue = (value: string): EvalArith => {
        const cached = concrete.get(value)
        if (cached) return cached
        cancelled()
        const parser = new ctx.Solver()
        try {
          // capture validated the complete grammar before SMT parsing. The one
          // declaration here is fixed, and no check()/model() is performed.
          parser.fromString(`(declare-const snapshot_value Real)(assert (= snapshot_value ${value}))`)
          const assertion = parser.assertions().get(0)
          const expression = assertion.arg(1)
          if (!ctx.isArith(expression)) throw new Error('Captured exact value is not real arithmetic.')
          concrete.set(value, expression)
          return expression
        } finally { parser.release() }
      }
      const kernel = new Map(model.mechanisms.map(item => [signature(parsed.document.graph, item.node, item.parents), item.value]))
      const values = new Map<string, EvalArith>()
      for (const mechanism of compiled.mechanisms) {
        const value = kernel.get(signature(parsed.document.graph, mechanism.node, mechanism.parents))
        if (value === undefined) throw new Error('The captured kernel is incomplete for this query.')
        const concreteValue = readValue(value)
        const bounded = await simplify(ctx.And(ctx.GE(concreteValue, 0), ctx.LE(concreteValue, 1)))
        if (!ctx.isTrue(bounded)) throw new Error(`Captured mechanism for ${mechanism.node} is outside [0, 1].`)
        values.set(mechanism.parameter, concreteValue)
      }
      for (const variable of compiled.variables.filter(name => !mechanismNames.has(name))) values.set(variable, readValue(free.get(variable)!))
      const queryBindings = new Map(Object.keys(parsed.document.probabilities).map((id, index) => [id, compiled.queries[index].expression]))
      const realMemo = new WeakMap<object, EvalArith>()
      const arithmetic = (expression: RealExpr): EvalArith => {
        const cached = realMemo.get(expression)
        if (cached) return cached
        let result: EvalArith
        switch (expression.tag) {
          case 'literal': result = ctx.Real.val(expression.source ?? expression.value); break
          case 'variable': {
            const query = queryBindings.get(expression.id)
            if (query) { result = arithmetic(query); break }
            const value = values.get(expression.id)
            if (!value) throw new Error(`Unassigned free real variable: ${expression.id}.`)
            result = value; break
          }
          case 'negative': result = ctx.Neg(arithmetic(expression.expr)); break
          case 'plus': result = ctx.Sum(arithmetic(expression.left), arithmetic(expression.right)); break
          case 'minus': result = ctx.Sub(arithmetic(expression.left), arithmetic(expression.right)); break
          case 'multiply': result = ctx.Product(arithmetic(expression.left), arithmetic(expression.right)); break
          case 'divide': result = ctx.Div(arithmetic(expression.numerator), arithmetic(expression.denominator)); break
          case 'power': {
            const exponent = expression.exponent.tag === 'literal' ? expression.exponent.value : expression.exponent.tag === 'negative' && expression.exponent.expr.tag === 'literal' ? -expression.exponent.expr.value : NaN
            if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > MAX_ABS_SOLVER_EXPONENT) throw new Error('Evaluation exponent must be a supported integer literal.')
            const base = arithmetic(expression.base)
            const product = Math.abs(exponent) === 0 ? ctx.Real.val(1) : ctx.Product(base, ...Array.from({ length: Math.abs(exponent) - 1 }, () => base))
            result = exponent < 0 ? ctx.Div(ctx.Real.val(1), product) : product
            break
          }
          default: throw new Error('Probability expressions must be translated by the causal compiler before evaluation.')
        }
        realMemo.set(expression, result)
        return result
      }
      const boolean = (constraint: Constraint): EvalBool => {
        switch (constraint.tag) {
          case 'negation': return ctx.Not(boolean(constraint.constraint))
          case 'conjunction': return ctx.And(boolean(constraint.left), boolean(constraint.right))
          case 'disjunction': return ctx.Or(boolean(constraint.left), boolean(constraint.right))
          case 'conditional': return ctx.Implies(boolean(constraint.left), boolean(constraint.right))
          case 'biconditional': return ctx.Eq(boolean(constraint.left), boolean(constraint.right))
          case 'equal': return ctx.Eq(arithmetic(constraint.left), arithmetic(constraint.right))
          case 'not_equal': return ctx.Not(ctx.Eq(arithmetic(constraint.left), arithmetic(constraint.right)))
          case 'less_than': return ctx.LT(arithmetic(constraint.left), arithmetic(constraint.right))
          case 'less_than_or_equal': return ctx.LE(arithmetic(constraint.left), arithmetic(constraint.right))
          case 'greater_than': return ctx.GT(arithmetic(constraint.left), arithmetic(constraint.right))
          case 'greater_than_or_equal': return ctx.GE(arithmetic(constraint.left), arithmetic(constraint.right))
        }
      }
      const translate = (expression: RealExpr): RealExpr => {
        switch (expression.tag) {
          case 'variable': return queryBindings.get(expression.id) ?? expression
          case 'literal': return expression
          case 'negative': return { ...expression, expr: translate(expression.expr) }
          case 'plus': case 'minus': case 'multiply': return { ...expression, left: translate(expression.left), right: translate(expression.right) }
          case 'divide': return { ...expression, numerator: translate(expression.numerator), denominator: translate(expression.denominator) }
          case 'power': return { ...expression, base: translate(expression.base), exponent: translate(expression.exponent) }
          default: throw new Error('Unexpected unparsed evaluation expression.')
        }
      }
      const defined = async (expression: RealExpr): Promise<boolean> => {
        for (const guard of div0_conditions_in_real_expr(expression)) {
          if (!ctx.isTrue(await simplify(boolean(guard)))) return false
        }
        return true
      }
      const probabilities: ProbabilityValues = []
      for (const query of compiled.queries) {
        probabilities.push(await defined(query.expression) ? { source: query.source, defined: true, value: (await simplify(arithmetic(query.expression))).sexpr() } : { source: query.source, defined: false })
      }
      if (parsed.kind === 'real') {
        const expression = translate(parsed.expression)
        if (!await defined(expression)) return accept({ status: 'undefined', reason: 'The expression requires division by zero or a probability conditional on zero evidence mass.', probabilities })
        return accept({ status: 'value', kind: 'real', value: (await simplify(arithmetic(expression))).sexpr(), probabilities })
      }
      const value = await simplify(boolean(compiled.constraints[compiled.constraints.length - 1]))
      if (!ctx.isTrue(value) && !ctx.isFalse(value)) throw new Error('Exact constraint evaluation did not reduce to a Boolean value.')
      return accept({ status: 'value', kind: 'constraint', value: ctx.isTrue(value), probabilities })
    } catch (error) {
      return signal?.aborted ? { status: 'cancelled' } : { status: 'error', message: error instanceof Error ? error.message : String(error) }
    } finally { this.busy = false }
  }
}
