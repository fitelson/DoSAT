import { validate_causal_query_identifiers, type CausalDocument, type CausalGraph, type CausalProbability, type Intervention } from './causal_syntax'
import type { PrSat } from './types'
import {
  constraint_builder,
  constraint_to_smtlib,
  free_real_variables_in_constraint_or_real_expr,
  guard_div0_conditions_in_constraint,
  letter_string,
  MAX_ABS_SOLVER_EXPONENT,
  real_expr_builder,
  recursively_evaluate_sentence,
  TruthTable,
} from './pr_sat'
import { s_to_string, type S } from './s'

type Sentence = PrSat['Sentence']
type RealExpr = PrSat['RealExpr']
type Constraint = PrSat['Constraint']

export const MAX_CAUSAL_NODES = 6
export const MAX_CAUSAL_PROBABILITIES = 64
const MAX_INPUT_AST_NODES = 20_000
const MAX_INPUT_AST_DEPTH = 128
// The inherited emitter expands integer powers and Boolean equivalences. Bound
// that expanded output as well as the input, before allocating S-expressions.
const MAX_EXPANDED_SMT_UNITS = 1_000_000

export type CausalMechanism = {
  node: string
  parents: Record<string, boolean>
  parameter: string
  expression: RealExpr
}

export type CausalDistribution = {
  label: string
  intervention: Intervention[]
  rows: { assignment: Record<string, boolean>, expression: RealExpr }[]
}

export type CompiledCausalProblem = {
  smtlib: string
  evaluationTable: TruthTable
  mechanisms: CausalMechanism[]
  queries: { source: string, expression: RealExpr }[]
  distributions: CausalDistribution[]
  /** Bounds and user constraints, after substitution and definedness guards. */
  constraints: Constraint[]
  variables: string[]
}

const { lit, vbl, plus, minus, multiply, divide } = real_expr_builder
const { gt, gte, lt, lte } = constraint_builder

type Ast = Sentence | RealExpr | Constraint

const ast_children = (ast: Ast): Ast[] => {
  switch (ast.tag) {
    case 'value': case 'letter': case 'literal': case 'variable': case 'state_variable_sum': return []
    case 'negation': return ['sentence' in ast ? ast.sentence : ast.constraint]
    case 'negative': return [ast.expr]
    case 'probability': return [ast.arg]
    case 'given_probability': return [ast.arg, ast.given]
    case 'power': return [ast.base, ast.exponent]
    case 'divide': return [ast.numerator, ast.denominator]
    default: return [ast.left, ast.right]
  }
}

const check_input_size = (document: CausalDocument): void => {
  const probabilities = Object.values(document.probabilities)
  if (probabilities.length > MAX_CAUSAL_PROBABILITIES) {
    throw new Error(`At most ${MAX_CAUSAL_PROBABILITIES} causal probability expressions are supported.`)
  }
  const stack: { ast: Ast, depth: number }[] = [
    ...document.constraints.map(ast => ({ ast, depth: 1 })),
    ...probabilities.flatMap(p => [p.event, ...(p.given === undefined ? [] : [p.given])].map(ast => ({ ast, depth: 1 }))),
  ]
  let count = 0
  let occurrences = 0
  while (stack.length > 0) {
    const item = stack.pop()!
    if (++count > MAX_INPUT_AST_NODES || item.depth > MAX_INPUT_AST_DEPTH) {
      throw new Error(`Causal input is too large or deeply nested (limit ${MAX_INPUT_AST_NODES} AST nodes and depth ${MAX_INPUT_AST_DEPTH}).`)
    }
    if (item.ast.tag === 'probability' || item.ast.tag === 'given_probability' ||
        (item.ast.tag === 'variable' && Object.prototype.hasOwnProperty.call(document.probabilities, item.ast.id))) {
      if (++occurrences > MAX_CAUSAL_PROBABILITIES) {
        throw new Error(`At most ${MAX_CAUSAL_PROBABILITIES} probability occurrences are supported in causal constraints.`)
      }
    }
    for (const ast of ast_children(item.ast)) stack.push({ ast, depth: item.depth + 1 })
  }
}

const validate_graph = (graph: CausalGraph): void => {
  if (graph.nodes.length === 0 || graph.nodes.length > MAX_CAUSAL_NODES) {
    throw new Error(`A causal graph must have between 1 and ${MAX_CAUSAL_NODES} Boolean nodes.`)
  }
  const nodes = new Set(graph.nodes)
  if (nodes.size !== graph.nodes.length) throw new Error('Causal graph contains duplicate nodes.')
  for (const node of graph.nodes) {
    if (!/^[A-Z](?:[1-9][0-9]*)?$/.test(node) || (node.length > 1 && !Number.isSafeInteger(Number(node.slice(1))))) {
      throw new Error(`Invalid causal node '${node}'. Use PrSAT sentence letters, such as X or X1.`)
    }
  }
  for (const [node, parents] of Object.entries(graph.parents)) {
    if (!nodes.has(node)) throw new Error(`Parent list names undeclared node '${node}'.`)
    if (new Set(parents).size !== parents.length) throw new Error(`Duplicate parents for '${node}'.`)
    for (const parent of parents) {
      if (!nodes.has(parent)) throw new Error(`Parent '${parent}' is not in the causal graph.`)
    }
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (node: string): void => {
    if (visiting.has(node)) throw new Error('Causal graph must be acyclic.')
    if (visited.has(node)) return
    visiting.add(node)
    for (const parent of graph.parents[node] ?? []) visit(parent)
    visiting.delete(node)
    visited.add(node)
  }
  graph.nodes.forEach(visit)
}

const assignments = (nodes: string[]): Record<string, boolean>[] => Array.from(
  { length: 2 ** nodes.length },
  (_, bits) => Object.fromEntries(nodes.map((node, index) => [node, (bits & (1 << (nodes.length - index - 1))) !== 0])),
)

// Balanced trees keep the original recursive emitter shallow even when all
// sixty-four valuations contribute to a probability.
const combine = (expressions: RealExpr[], operation: (left: RealExpr, right: RealExpr) => RealExpr, identity: number): RealExpr => {
  if (expressions.length === 0) return lit(identity)
  if (expressions.length === 1) return expressions[0]
  const middle = Math.floor(expressions.length / 2)
  return operation(combine(expressions.slice(0, middle), operation, identity), combine(expressions.slice(middle), operation, identity))
}

const exact_integer_exponent = (expression: RealExpr): number => {
  const literal = expression.tag === 'literal' ? expression : expression.tag === 'negative' && expression.expr.tag === 'literal' ? expression.expr : undefined
  if (literal === undefined) throw new Error('Exponentiation in solver input requires an integer literal exponent.')
  const sign = expression.tag === 'negative' ? -1 : 1
  let magnitude: number
  if (literal.source !== undefined) {
    // The legacy AST retains exact decimal spelling alongside a JS approximation.
    // A noninteger such as 1.0000000000000001 can round to the integer 1. Validate
    // the spelling before the inherited emitter/evaluator uses the numeric field.
    const match = /^([0-9]+)(?:\.0+)?$/.exec(literal.source)
    if (match === null) throw new Error('Exponentiation in solver input requires an integer literal exponent.')
    const exact = BigInt(match[1])
    if (exact > BigInt(MAX_ABS_SOLVER_EXPONENT)) {
      const abbreviated = literal.source.length > 80 ? `${literal.source.slice(0, 80)}...` : literal.source
      throw new Error(`Exponent magnitude must be at most ${MAX_ABS_SOLVER_EXPONENT}; received ${sign < 0 ? '-' : ''}${abbreviated}.`)
    }
    magnitude = Number(exact)
    if (literal.value !== magnitude) throw new Error('Integer exponent source does not agree with its numeric AST value.')
  } else {
    if (!Number.isSafeInteger(literal.value)) throw new Error('Exponentiation in solver input requires an integer literal exponent.')
    magnitude = literal.value
    if (Math.abs(magnitude) > MAX_ABS_SOLVER_EXPONENT) {
      throw new Error(`Exponent magnitude must be at most ${MAX_ABS_SOLVER_EXPONENT}; received ${sign * magnitude}.`)
    }
  }
  return sign * magnitude
}

const check_expanded_size = (constraints: Constraint[]): void => {
  const costs = new WeakMap<object, number>()
  const cost = (ast: Ast): number => {
    const cached = costs.get(ast)
    if (cached !== undefined) return cached
    const children = ast_children(ast)
    let result = 1 + children.reduce((total, child) => total + cost(child), 0)
    if (ast.tag === 'variable') result += ast.id.length
    if (ast.tag === 'literal') result += (ast.source ?? ast.value.toString()).length
    if (ast.tag === 'power') {
      const exponent = exact_integer_exponent(ast.exponent)
      result += Math.abs(exponent) * cost(ast.base)
    }
    if (result > MAX_EXPANDED_SMT_UNITS) {
      throw new Error('Causal constraints expand to an SMT expression that is too large; simplify nested powers or Boolean equivalences.')
    }
    costs.set(ast, result)
    return result
  }
  let total = 0
  for (const constraint of constraints) {
    total += cost(constraint)
    if (total > MAX_EXPANDED_SMT_UNITS) throw new Error('Causal constraints expand to an SMT expression that is too large; reduce the number or size of constraints.')
  }
}

/** Compile one finite observed-DAG model, with shared mechanisms in every regime. */
export const compile_causal_document = (document: CausalDocument, options: { regular?: boolean } = {}): CompiledCausalProblem => {
  validate_graph(document.graph)
  check_input_size(document)
  const { graph } = document
  const occupied = new Set<string>(Object.keys(document.probabilities))
  const free = new Set<string>()
  for (const constraint of document.constraints) {
    free_real_variables_in_constraint_or_real_expr({ tag: 'constraint', constraint }, free)
  }
  validate_causal_query_identifiers(free, document.probabilities)
  for (const id of free) occupied.add(id)
  for (const id of Object.keys(document.probabilities)) free.delete(id)
  // Parsed inputs use ordinary identifiers. Reject malformed API-supplied names
  // before they can become SMT-LIB commands or collide with reserved constants.
  for (const id of free) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(id) || ['true', 'false', 'Real', 'Bool', 'Int', 'let', 'forall', 'exists'].includes(id)) {
      throw new Error(`Unsupported free real variable name '${id}'.`)
    }
  }
  const mechanisms: CausalMechanism[] = []
  const mechanism_lookup = new Map<string, RealExpr>()
  const parent_names = new Map(graph.nodes.map(node => [node, graph.nodes.filter(parent => (graph.parents[node] ?? []).includes(parent))]))
  const mechanism_key = (node: string, assignment: Record<string, boolean>): string => `${node}:${parent_names.get(node)!.map(parent => assignment[parent] ? '1' : '0').join('')}`
  for (const node of graph.nodes) {
    const parents = parent_names.get(node)!
    for (const parent_assignment of assignments(parents)) {
      const bits = parents.map(parent => parent_assignment[parent] ? '1' : '0').join('')
      const base = `p_${node}_${bits || 'root'}`
      let parameter = base
      let suffix = 1
      while (occupied.has(parameter)) parameter = `${base}_${suffix++}`
      occupied.add(parameter)
      const expression = vbl(parameter)
      mechanisms.push({ node, parents: parent_assignment, parameter, expression })
      mechanism_lookup.set(mechanism_key(node, parent_assignment), expression)
    }
  }

  const all_assignments = assignments(graph.nodes)
  const distributions: CausalDistribution[] = []
  const distribution_lookup = new Map<string, CausalDistribution>()
  const get_distribution = (intervention: Intervention[]): CausalDistribution => {
    const values = new Map<string, boolean>()
    for (const item of intervention) {
      if (!graph.nodes.includes(item.variable)) throw new Error(`Intervention variable '${item.variable}' is not in the causal graph.`)
      if (typeof item.value !== 'boolean') throw new Error(`Interventions assign Boolean values to '${item.variable}'.`)
      if (values.has(item.variable)) throw new Error(`Repeated intervention assignment to '${item.variable}'.`)
      values.set(item.variable, item.value)
    }
    const canonical = graph.nodes.filter(node => values.has(node)).map(variable => ({ variable, value: values.get(variable)! }))
    const key = canonical.map(item => `${item.variable}=${item.value ? 1 : 0}`).join(', ')
    const cached = distribution_lookup.get(key)
    if (cached !== undefined) return cached
    const rows = all_assignments.map(assignment => {
      if (canonical.some(item => assignment[item.variable] !== item.value)) return { assignment, expression: lit(0) }
      const factors = graph.nodes.filter(node => !values.has(node)).map(node => {
        const expression = mechanism_lookup.get(mechanism_key(node, assignment))!
        return assignment[node] ? expression : minus(lit(1), expression)
      })
      return { assignment, expression: combine(factors, multiply, 1) }
    })
    const distribution: CausalDistribution = { label: key.length === 0 ? 'Observational' : `do(${key})`, intervention: canonical, rows }
    distribution_lookup.set(key, distribution)
    distributions.push(distribution)
    return distribution
  }
  const observational = get_distribution([])

  const validate_sentence = (sentence: Sentence): void => {
    const stack = [sentence]
    while (stack.length > 0) {
      const current = stack.pop()!
      if (current.tag === 'letter' && !graph.nodes.includes(letter_string(current))) {
        throw new Error(`Probability uses sentence letter '${letter_string(current)}' that is not in the causal graph.`)
      }
      stack.push(...ast_children(current) as Sentence[])
    }
  }
  const mass = (distribution: CausalDistribution, event: Sentence): RealExpr => {
    validate_sentence(event)
    const active_rows = distribution.rows.filter(row => row.expression.tag !== 'literal' || row.expression.value !== 0)
    const rows = active_rows.filter(row => recursively_evaluate_sentence(letter => row.assignment[letter_string(letter)], event))
    // Normalization holds identically, including fully intervened regimes.
    if (rows.length === active_rows.length) return lit(1)
    return combine(rows.map(row => row.expression), plus, 0)
  }
  const compile_probability = (probability: CausalProbability): RealExpr => {
    const distribution = get_distribution(probability.intervention)
    if (probability.given === undefined) return mass(distribution, probability.event)
    const numerator = mass(distribution, { tag: 'conjunction', left: probability.event, right: probability.given })
    return divide(numerator, mass(distribution, probability.given))
  }
  const query_expressions = new Map(Object.entries(document.probabilities).map(([id, probability]) => [id, compile_probability(probability)]))
  const queries = Object.entries(document.probabilities).map(([id, probability]) => ({ source: probability.source, expression: query_expressions.get(id)! }))
  const translate_real = (expression: RealExpr): RealExpr => {
    switch (expression.tag) {
      case 'literal': return expression
      case 'variable': return query_expressions.get(expression.id) ?? expression
      case 'probability': return mass(observational, expression.arg)
      case 'given_probability': return compile_probability({ event: expression.arg, given: expression.given, intervention: [], source: '' })
      case 'state_variable_sum': throw new Error('State-variable sums are not input to the causal compiler.')
      case 'negative': return { ...expression, expr: translate_real(expression.expr) }
      case 'power': return { ...expression, base: translate_real(expression.base), exponent: translate_real(expression.exponent) }
      case 'divide': return { ...expression, numerator: translate_real(expression.numerator), denominator: translate_real(expression.denominator) }
      default: return { ...expression, left: translate_real(expression.left), right: translate_real(expression.right) }
    }
  }
  const translate_constraint = (constraint: Constraint): Constraint => {
    switch (constraint.tag) {
      case 'negation': return { ...constraint, constraint: translate_constraint(constraint.constraint) }
      case 'conjunction': case 'disjunction': case 'conditional': case 'biconditional':
        return { ...constraint, left: translate_constraint(constraint.left), right: translate_constraint(constraint.right) }
      default: return { ...constraint, left: translate_real(constraint.left), right: translate_real(constraint.right) }
    }
  }
  const bounds = mechanisms.flatMap(({ expression }) => options.regular
    ? [gt(expression, lit(0)), lt(expression, lit(1))]
    : [gte(expression, lit(0)), lte(expression, lit(1))])
  // Guard after full substitution. A global denominator guard would incorrectly
  // rule out a satisfied disjunction whose other branch has undefined probability.
  const constraints = [...bounds, ...document.constraints.map(constraint => guard_div0_conditions_in_constraint(translate_constraint(constraint)))]
  check_expanded_size(constraints)
  const variables = [...mechanisms.map(mechanism => mechanism.parameter), ...free]
  const lines: S[] = [
    ['set-logic', 'QF_NRA'],
    ...variables.map(id => ['declare-fun', id, [], 'Real'] as S),
    ...constraints.map(constraint => ['assert', constraint_to_smtlib(constraint)] as S),
  ]
  return {
    smtlib: lines.map(line => s_to_string(line, false)).join('\n'),
    evaluationTable: new TruthTable({ real: variables, sentence: [] }),
    mechanisms, queries, distributions, constraints, variables,
  }
}
