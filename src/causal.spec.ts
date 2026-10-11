import { describe, expect, test } from 'vitest'
import { compile_causal_document, MAX_CAUSAL_NODES, MAX_CAUSAL_PROBABILITIES } from './causal'
import { parse_causal_document, type CausalDocument, type CausalGraph, type CausalProbability, type Intervention } from './causal_syntax'
import { constraint_builder, real_expr_builder, sentence_builder, MAX_ABS_SOLVER_EXPONENT } from './pr_sat'
import type { PrSat } from './types'

type RealExpr = PrSat['RealExpr']
type Constraint = PrSat['Constraint']
const { letter, val, not, and } = sentence_builder
const { lit, vbl, power, neg, pr } = real_expr_builder
const { eq, cor, cnot, ciff } = constraint_builder

const evaluate_real = (expression: RealExpr, values: Record<string, number>): number => {
  switch (expression.tag) {
    case 'literal': return expression.value
    case 'variable': {
      const value = values[expression.id]
      if (value === undefined) throw new Error(`Missing value for ${expression.id}`)
      return value
    }
    case 'negative': return -evaluate_real(expression.expr, values)
    case 'plus': return evaluate_real(expression.left, values) + evaluate_real(expression.right, values)
    case 'minus': return evaluate_real(expression.left, values) - evaluate_real(expression.right, values)
    case 'multiply': return evaluate_real(expression.left, values) * evaluate_real(expression.right, values)
    case 'divide': return evaluate_real(expression.numerator, values) / evaluate_real(expression.denominator, values)
    case 'power': return evaluate_real(expression.base, values) ** evaluate_real(expression.exponent, values)
    default: throw new Error(`Untranslated expression: ${expression.tag}`)
  }
}

const evaluate_constraint = (constraint: Constraint, values: Record<string, number>): boolean => {
  switch (constraint.tag) {
    case 'negation': return !evaluate_constraint(constraint.constraint, values)
    case 'conjunction': return evaluate_constraint(constraint.left, values) && evaluate_constraint(constraint.right, values)
    case 'disjunction': return evaluate_constraint(constraint.left, values) || evaluate_constraint(constraint.right, values)
    case 'conditional': return !evaluate_constraint(constraint.left, values) || evaluate_constraint(constraint.right, values)
    case 'biconditional': return evaluate_constraint(constraint.left, values) === evaluate_constraint(constraint.right, values)
    default: {
      const left = evaluate_real(constraint.left, values)
      const right = evaluate_real(constraint.right, values)
      switch (constraint.tag) {
        case 'equal': return left === right
        case 'not_equal': return left !== right
        case 'less_than': return left < right
        case 'less_than_or_equal': return left <= right
        case 'greater_than': return left > right
        case 'greater_than_or_equal': return left >= right
      }
    }
  }
}

const make_document = (graph: CausalGraph, probabilities: CausalProbability[] = [], constraints: Constraint[] = []): CausalDocument => ({
  graph,
  probabilities: Object.fromEntries(probabilities.map((p, index) => [`q${index}`, p])),
  constraints,
  source: [],
})
const query = (event: PrSat['Sentence'], intervention: Intervention[] = [], given?: PrSat['Sentence']): CausalProbability => ({
  event, intervention, given, source: `query ${JSON.stringify({ event, intervention, given })}`,
})

const graph: CausalGraph = { nodes: ['Z', 'X', 'Y'], parents: { Z: [], X: ['Z'], Y: ['Z', 'X'] } }
const cpt: Record<string, number> = { 'Z:': 0.5, 'X:0': 0.25, 'X:1': 0.75, 'Y:00': 0, 'Y:01': 0.25, 'Y:10': 0.5, 'Y:11': 1 }
const assignment_key = (nodes: string[], assignment: Record<string, boolean>): string => nodes.map(node => assignment[node] ? '1' : '0').join('')

// Independent numerical oracle: enumerate the 4^n equally likely independent
// noise assignments in a structural causal model. Each Boolean mechanism is a
// threshold on its own four-valued noise. Interventions replace the equation.
const structural_distribution = (graph: CausalGraph, probabilities: Record<string, number>, intervention: Intervention[]): Map<string, number> => {
  const order: string[] = []
  const add = (node: string): void => {
    if (order.includes(node)) return
    for (const parent of graph.parents[node] ?? []) add(parent)
    order.push(node)
  }
  graph.nodes.forEach(add)
  const forced = new Map(intervention.map(item => [item.variable, item.value]))
  const distribution = new Map<string, number>()
  const cases = 4 ** graph.nodes.length
  for (let index = 0; index < cases; index++) {
    const assignment: Record<string, boolean> = {}
    for (let offset = 0; offset < order.length; offset++) {
      const node = order[offset]
      const parent_bits = graph.nodes.filter(parent => (graph.parents[node] ?? []).includes(parent)).map(parent => assignment[parent] ? '1' : '0').join('')
      const noise = Math.floor(index / 4 ** offset) % 4
      assignment[node] = forced.get(node) ?? noise < 4 * probabilities[`${node}:${parent_bits}`]
    }
    const key = assignment_key(graph.nodes, assignment)
    distribution.set(key, (distribution.get(key) ?? 0) + 1 / cases)
  }
  return distribution
}

const mechanism_values = (compiled: ReturnType<typeof compile_causal_document>, probabilities = cpt): Record<string, number> => Object.fromEntries(
  compiled.mechanisms.map(mechanism => [mechanism.parameter, probabilities[`${mechanism.node}:${Object.values(mechanism.parents).map(value => value ? '1' : '0').join('')}`]]),
)

describe('Boolean causal compilation', () => {
  test('matches independent structural-noise enumeration observationally and under simultaneous interventions', () => {
    const compiled = compile_causal_document(make_document(graph, [
      query(letter('Y')),
      query(letter('Y'), [{ variable: 'X', value: true }]),
      query(letter('Y'), [{ variable: 'Y', value: false }]),
      query(and(letter('X'), not(letter('Y'))), [{ variable: 'Y', value: false }, { variable: 'X', value: true }]),
    ]))
    const values = mechanism_values(compiled)
    for (const distribution of compiled.distributions) {
      const oracle = structural_distribution(graph, cpt, distribution.intervention)
      const computed = distribution.rows.map(row => evaluate_real(row.expression, values))
      expect(computed.reduce((total, p) => total + p, 0)).toBeCloseTo(1, 14)
      for (const [index, row] of distribution.rows.entries()) {
        expect(computed[index]).toBeCloseTo(oracle.get(assignment_key(graph.nodes, row.assignment)) ?? 0, 14)
      }
    }
  })

  test('uses shared mechanisms and distinguishes intervention from conditioning', () => {
    const compiled = compile_causal_document(make_document(graph, [
      query(letter('Y'), [], letter('X')),
      query(letter('Y'), [{ variable: 'X', value: true }]),
    ]))
    const values = mechanism_values(compiled)
    expect(evaluate_real(compiled.queries[0].expression, values)).toBe(0.8125)
    expect(evaluate_real(compiled.queries[1].expression, values)).toBe(0.625)
    values.p_Y_11 = 0
    expect(evaluate_real(compiled.queries[0].expression, values)).toBe(0.0625)
    expect(evaluate_real(compiled.queries[1].expression, values)).toBe(0.125)
    expect(compiled.mechanisms).toHaveLength(7)
    expect(new Set(compiled.variables).size).toBe(compiled.variables.length)
  })

  test('empty interventions are observational and order-equivalent interventions reuse one regime', () => {
    const intervention = [{ variable: 'X', value: true }, { variable: 'Y', value: false }]
    const compiled = compile_causal_document(make_document(graph, [query(letter('X')), query(letter('Y'), []), query(letter('Y'), intervention), query(letter('Y'), [...intervention].reverse())]))
    expect(compiled.distributions).toHaveLength(2)
    expect(compiled.distributions[0].intervention).toEqual([])
    expect(compiled.queries[2].expression).toEqual(compiled.queries[3].expression)
  })

  test('forces intervened variables without changing their ancestors or disconnected roots', () => {
    const local_graph: CausalGraph = { nodes: ['Z', 'X', 'Y', 'W'], parents: { Z: [], X: ['Z'], Y: ['X'], W: [] } }
    const compiled = compile_causal_document(make_document(local_graph, [
      query(letter('X'), [{ variable: 'X', value: true }]),
      query(not(letter('X')), [{ variable: 'X', value: true }]),
      query(letter('Z')),
      query(letter('Z'), [{ variable: 'X', value: true }]),
      query(letter('W')),
      query(letter('W'), [{ variable: 'X', value: true }]),
    ]))
    const values = mechanism_values(compiled, { 'Z:': 0.25, 'X:0': 0.75, 'X:1': 1, 'Y:0': 0, 'Y:1': 0.5, 'W:': 0.75 })
    const result = compiled.queries.map(q => evaluate_real(q.expression, values))
    expect(result).toEqual([1, 0, 0.25, 0.25, 0.75, 0.75])
  })

  test('retains mechanisms for parent configurations having zero observational probability', () => {
    const local_graph: CausalGraph = { nodes: ['X', 'Y'], parents: { X: [], Y: ['X'] } }
    const compiled = compile_causal_document(make_document(local_graph, [query(letter('Y')), query(letter('Y'), [{ variable: 'X', value: true }])]))
    const values = mechanism_values(compiled, { 'X:': 0, 'Y:0': 0.25, 'Y:1': 0.75 })
    expect(evaluate_real(compiled.queries[0].expression, values)).toBe(0.25)
    expect(evaluate_real(compiled.queries[1].expression, values)).toBe(0.75)
    expect(compiled.evaluationTable.variables.real).toContain('p_Y_1')
  })

  test('allows every variable to be intervened on, producing a point mass', () => {
    const interventions = graph.nodes.map(variable => ({ variable, value: true }))
    const compiled = compile_causal_document(make_document(graph, [query(and(letter('X'), letter('Y')), interventions)]))
    expect(evaluate_real(compiled.queries[0].expression, mechanism_values(compiled))).toBe(1)
    const rows = compiled.distributions[1].rows.map(row => evaluate_real(row.expression, mechanism_values(compiled)))
    expect(rows).toEqual([0, 0, 0, 0, 0, 0, 0, 1])
  })

  test('regularity means strictly positive observational CPT entries, with forced rows still zero', () => {
    const document = make_document({ nodes: ['X'], parents: { X: [] } }, [query(letter('X'), [{ variable: 'X', value: true }])])
    const regular = compile_causal_document(document, { regular: true })
    const ordinary = compile_causal_document(document)
    expect(regular.constraints.map(c => c.tag)).toEqual(['greater_than', 'less_than'])
    expect(ordinary.constraints.map(c => c.tag)).toEqual(['greater_than_or_equal', 'less_than_or_equal'])
    expect(regular.constraints.every(c => evaluate_constraint(c, { p_X_root: 0.5 }))).toBe(true)
    expect(regular.constraints.every(c => evaluate_constraint(c, { p_X_root: 0 }))).toBe(false)
    expect(ordinary.constraints.every(c => evaluate_constraint(c, { p_X_root: 0 }))).toBe(true)
    expect(regular.distributions[1].rows.map(row => evaluate_real(row.expression, { p_X_root: 0.5 }))).toEqual([0, 1])
  })

  test('conditionals use evidence within the intervention regime', () => {
    const compiled = compile_causal_document(make_document(graph, [query(letter('Y'), [{ variable: 'X', value: true }], letter('Z'))]))
    expect(evaluate_real(compiled.queries[0].expression, mechanism_values(compiled))).toBe(1)
  })

  test('substitutes probability placeholders before branch-local denominator guards', () => {
    const query_ast = query(letter('Y'), [{ variable: 'X', value: false }], letter('X'))
    const left = eq(vbl('q0'), lit(0))
    const compiled = compile_causal_document(make_document(graph, [query_ast], [cor(eq(lit(1), lit(1)), left), left, cnot(left)]))
    const values = mechanism_values(compiled)
    const user_constraints = compiled.constraints.slice(2 * compiled.mechanisms.length)
    expect(user_constraints.map(c => evaluate_constraint(c, values))).toEqual([true, false, false])
    expect(compiled.smtlib).not.toContain('q0')
  })

  test('negative powers inherit zero-base definedness and exponent limits', () => {
    const document = make_document({ nodes: ['X'], parents: { X: [] } }, [query(letter('X'), [{ variable: 'X', value: false }])], [eq(power(vbl('q0'), neg(lit(1))), lit(1))])
    const compiled = compile_causal_document(document)
    expect(evaluate_constraint(compiled.constraints[2], { p_X_root: 0.5 })).toBe(false)
    document.constraints = [eq(power(vbl('q0'), lit(MAX_ABS_SOLVER_EXPONENT + 1)), lit(1))]
    expect(() => compile_causal_document(document)).toThrow('Exponent magnitude must be at most')
    document.constraints = [eq(power(vbl('q0'), vbl('x')), lit(1))]
    expect(() => compile_causal_document(document)).toThrow('requires an integer literal exponent')
  })

  test('rejects exact fractional exponent decimals that round to positive or negative integers', () => {
    for (const exponent of ['1.0000000000000001', '0.99999999999999999', '-1.0000000000000001', '-0.99999999999999999']) {
      const document = parse_causal_document('X', `Pr(X)^(${exponent}) = 1/2`)
      expect(() => compile_causal_document(document)).toThrow('requires an integer literal exponent')
    }
  })

  test('accepts exact integer exponent spellings with zero decimal fractions', () => {
    const positive = compile_causal_document(parse_causal_document('X', 'Pr(X)^1.0000 = 1/2'))
    expect(evaluate_constraint(positive.constraints[2], { p_X_root: 0.5 })).toBe(true)
    const negative = compile_causal_document(parse_causal_document('X', 'Pr(X)^(-1.0000) = 2'))
    expect(evaluate_constraint(negative.constraints[2], { p_X_root: 0.5 })).toBe(true)
    expect(evaluate_constraint(negative.constraints[2], { p_X_root: 0 })).toBe(false)
  })

  test('bounds exact huge integer exponent sources, including nonfinite JS approximations', () => {
    for (const exponent of ['9007199254740993', '9'.repeat(400), '-9007199254740993', `-${'9'.repeat(400)}`]) {
      const document = parse_causal_document('X', `Pr(X)^(${exponent}) = 1/2`)
      expect(() => compile_causal_document(document)).toThrow('Exponent magnitude must be at most 1024')
    }
  })

  test('supports legacy observational ASTs without independent state-mass variables', () => {
    const compiled = compile_causal_document(make_document({ nodes: ['X'], parents: { X: [] } }, [], [eq(pr(letter('X')), vbl('x'))]))
    expect(compiled.variables).toEqual(['p_X_root', 'x'])
    expect(compiled.smtlib).toContain('(assert (= p_X_root x))')
    expect(compiled.smtlib).not.toContain('a_')
    expect(compiled.smtlib).not.toContain('check-sat')
    expect(compiled.evaluationTable.n_letters()).toBe(0)
  })

  test('makes CPT parameter names collision-safe against free real variables', () => {
    const compiled = compile_causal_document(make_document({ nodes: ['X'], parents: { X: [] } }, [], [eq(vbl('p_X_root'), lit(1))]))
    expect(compiled.mechanisms[0].parameter).toBe('p_X_root_1')
    expect(compiled.variables).toEqual(['p_X_root_1', 'p_X_root'])
    expect(compiled.evaluationTable.variables.real).toEqual(compiled.variables)
  })

  test('parsed mixtures of observation, intervention and free real arithmetic compile', () => {
    const document = parse_causal_document('Z -> X\nZ -> Y\nX -> Y', 'Pr(Y) = x\nPr(Y | do(X=1)) < Pr(Y | X)\nPr(Y | do(X=1), Z) = 1')
    const compiled = compile_causal_document(document)
    expect(compiled.queries).toHaveLength(4)
    expect(compiled.distributions).toHaveLength(2)
    expect(compiled.variables).toContain('x')
    expect(compiled.smtlib).not.toContain('CausalQuery')
  })

  test.each(['CausalQueryAx', 'fooCausalQueryA', 'CausalQueryACausalQueryB', 'CausalQueryAA'])('rejects an unmatched reserved query identifier supplied directly through the compiler API: %s', (id) => {
    const document = parse_causal_document('X', 'Pr(X)=1/2')
    document.constraints = [eq(vbl(id), lit(5))]
    expect(() => compile_causal_document(document)).toThrow(/reserved causal query identifier.*does not name a probability query/)
  })

  test('compiler API preserves exact reserved query keys instead of treating them as free reals', () => {
    const document = parse_causal_document('X', 'Pr(X)=1/2')
    document.constraints = [eq(vbl('CausalQueryA'), lit(0.5))]
    const compiled = compile_causal_document(document)
    expect(compiled.variables).toEqual(['p_X_root'])
    expect(compiled.smtlib).toContain('(assert (= p_X_root 0.5))')
    expect(compiled.smtlib).not.toContain('CausalQuery')
  })

  test('rejects cyclic graphs, undeclared probabilities and malformed interventions', () => {
    expect(() => compile_causal_document(make_document({ nodes: ['X', 'Y'], parents: { X: ['Y'], Y: ['X'] } }))).toThrow('acyclic')
    expect(() => compile_causal_document(make_document(graph, [query(letter('W'))]))).toThrow('not in the causal graph')
    expect(() => compile_causal_document(make_document(graph, [query(letter('X'), [{ variable: 'W', value: true }])]))).toThrow('not in the causal graph')
    expect(() => compile_causal_document(make_document(graph, [query(letter('X'), [{ variable: 'X', value: true }, { variable: 'X', value: false }])]))).toThrow('Repeated intervention')
  })

  test('supports safe indexed sentence letters', () => {
    const compiled = compile_causal_document(make_document({ nodes: ['X1', 'Y'], parents: { X1: [], Y: ['X1'] } }, [query(letter('X', 1), [{ variable: 'X1', value: true }])]))
    expect(evaluate_real(compiled.queries[0].expression, { p_X1_root: 0.25, p_Y_0: 0.75, p_Y_1: 0.5 })).toBe(1)
    expect(compiled.mechanisms[0].parameter).toBe('p_X1_root')
  })

  test('bounds graph size and probability occurrences before expansion', () => {
    expect(() => compile_causal_document(make_document({ nodes: Array.from({ length: MAX_CAUSAL_NODES + 1 }, (_, index) => String.fromCharCode(65 + index)), parents: {} }))).toThrow('between 1 and 6')
    expect(() => compile_causal_document(make_document(graph, Array.from({ length: MAX_CAUSAL_PROBABILITIES + 1 }, () => query(letter('Y')))))).toThrow('At most 64')
    expect(() => compile_causal_document(make_document(graph, [query(letter('Y'))], Array.from({ length: MAX_CAUSAL_PROBABILITIES + 1 }, () => eq(vbl('q0'), lit(0)))))).toThrow('At most 64 probability occurrences')
  })

  test('bounds deeply nested input and exponential SMT power/equivalence output', () => {
    let sentence = val(true)
    for (let index = 0; index < 129; index++) sentence = not(sentence)
    expect(() => compile_causal_document(make_document(graph, [query(sentence)]))).toThrow('deeply nested')
    const enormous_power = power(power(vbl('x'), lit(1024)), lit(1024))
    expect(() => compile_causal_document(make_document(graph, [], [eq(enormous_power, lit(1))]))).toThrow('SMT expression that is too large')
    let equivalence = eq(vbl('x'), lit(1))
    for (let index = 0; index < 20; index++) equivalence = ciff(equivalence, eq(lit(1), lit(1)))
    expect(() => compile_causal_document(make_document(graph, [], [equivalence]))).toThrow('SMT expression that is too large')
  })
})
