import { describe, expect, test } from 'vitest'
import { parse_causal_document, parse_causal_graph } from './causal_syntax'
import { assert_parse_sentence } from './parser'
import { check_do_step, parse_do_step, type DoRule, type DoStepInput } from './do_calculus'

const step = (
  graph: string,
  rule: DoRule,
  x = '',
  y = 'Y=1',
  z = 'Z=1',
  w = '',
) => check_do_step(parse_do_step(graph, rule, x, y, z, w))

describe('do-calculus rule 1', () => {
  test('deletes an observation blocked by the remaining observed evidence', () => {
    const result = step('Z -> W; W -> Y', 1, '', 'Y=1', 'Z=0', 'W=1')
    expect(result.applicable).toBe(true)
    expect(result.lhs).toBe('Pr(Y | ~Z & W)')
    expect(result.rhs).toBe('Pr(Y | W)')
    expect(result.definedness).toEqual(['Pr(~Z & W) > 0', 'Pr(W) > 0'])
    expect(result.modifiedGraph).toEqual(parse_causal_graph('Z -> W; W -> Y'))
    expect(result.removedEdges).toEqual([])
    expect(result.eligibleZ).toEqual([])
    expect(result.separation.conditioned).toEqual(['W'])
  })

  test('fails the graphical condition on a direct dependence', () => {
    const result = step('Z -> Y', 1)
    expect(result.applicable).toBe(false)
    expect(result.separation.connectingPath).toBeDefined()
    expect(result.conditionText).toContain('does not certify the equality')
    expect(result.conditionText).not.toContain('equality is false')
    expect(result.lhs).toBe('Pr(Y | Z)')
    expect(result.rhs).toBe('Pr(Y)')
    expect(result.definedness).toEqual(['Pr(Z) > 0'])
  })

  test('cuts incoming edges to X before checking separation', () => {
    const result = step('Z -> X; X -> Y', 1, 'X=1')
    expect(result.applicable).toBe(true)
    expect(result.removedEdges).toEqual([['Z', 'X']])
    expect(result.modifiedGraph.parents).toEqual({ Z: [], X: [], Y: ['X'] })
    expect(result.separation.conditioned).toEqual(['X'])
    expect(result.lhs).toBe('Pr(Y | do(X=1), Z)')
    expect(result.rhs).toBe('Pr(Y | do(X=1))')
  })

  test('observing a collider can make a previously valid rule fail', () => {
    expect(step('Y -> W; Z -> W', 1).applicable).toBe(true)
    const conditioned = step('Y -> W; Z -> W', 1, '', 'Y=1', 'Z=1', 'W=1')
    expect(conditioned.applicable).toBe(false)
    expect(conditioned.separation.moralEdges).toContainEqual(['Y', 'Z'])
  })
})

describe('do-calculus rule 2', () => {
  test('exchanges an action for observation after removing outgoing edges from Z', () => {
    const result = step('Z -> Y', 2)
    expect(result.applicable).toBe(true)
    expect(result.lhs).toBe('Pr(Y | do(Z=1))')
    expect(result.rhs).toBe('Pr(Y | Z)')
    expect(result.modifiedGraph.parents).toEqual({ Z: [], Y: [] })
    expect(result.removedEdges).toEqual([['Z', 'Y']])
    expect(result.eligibleZ).toEqual([])
    expect(result.definedness).toEqual(['Pr(Z) > 0'])
  })

  test('a common cause prevents exchange unless it is conditioned on', () => {
    expect(step('W -> Z; W -> Y', 2).applicable).toBe(false)
    const controlled = step('W -> Z; W -> Y', 2, '', 'Y=1', 'Z=1', 'W=0')
    expect(controlled.applicable).toBe(true)
    expect(controlled.lhs).toBe('Pr(Y | do(Z=1), ~W)')
    expect(controlled.rhs).toBe('Pr(Y | ~W & Z)')
    expect(controlled.definedness).toEqual(['Pr(~W | do(Z=1)) > 0', 'Pr(~W & Z) > 0'])
  })

  test('combines X incoming and Z outgoing surgery without duplicate removed edges', () => {
    const result = step('A -> X; Z -> X; Z -> Y', 2, 'X=0')
    expect(result.applicable).toBe(true)
    expect(result.removedEdges).toEqual([['A', 'X'], ['Z', 'X'], ['Z', 'Y']])
    expect(result.modifiedGraph.parents).toEqual({ A: [], X: [], Z: [], Y: [] })
    expect(result.lhs).toBe('Pr(Y | do(X=0, Z=1))')
    expect(result.rhs).toBe('Pr(Y | do(X=0), Z)')
    expect(result.definedness).toEqual(['Pr(Z | do(X=0)) > 0'])
  })
})

describe('do-calculus rule 3', () => {
  test('deletes an action on a descendant of Y', () => {
    const result = step('Y -> Z', 3)
    expect(result.applicable).toBe(true)
    expect(result.eligibleZ).toEqual(['Z'])
    expect(result.removedEdges).toEqual([['Y', 'Z']])
    expect(result.lhs).toBe('Pr(Y | do(Z=1))')
    expect(result.rhs).toBe('Pr(Y)')
    expect(result.definedness).toEqual([])
  })

  test('cannot delete an action on a direct cause of Y', () => {
    const result = step('Z -> Y', 3)
    expect(result.applicable).toBe(false)
    expect(result.eligibleZ).toEqual(['Z'])
    expect(result.removedEdges).toEqual([])
  })

  test('retains incoming edges to a Z node that is an ancestor of W', () => {
    const result = step('Y -> Z; Z -> W', 3, '', 'Y=1', 'Z=1', 'W=1')
    expect(result.eligibleZ).toEqual([])
    expect(result.removedEdges).toEqual([])
    expect(result.modifiedGraph.parents.Z).toEqual(['Y'])
    expect(result.applicable).toBe(false)
    expect(result.definedness).toEqual(['Pr(W | do(Z=1)) > 0', 'Pr(W) > 0'])
  })

  test('computes Z(W) after cutting incoming edges to X, rather than in the original graph', () => {
    const result = step('Y -> Z; Z -> X; X -> W', 3, 'X=1', 'Y=1', 'Z=0', 'W=1')
    expect(result.eligibleZ).toEqual(['Z'])
    expect(result.removedEdges).toEqual([['Y', 'Z'], ['Z', 'X']])
    expect(result.modifiedGraph.parents).toEqual({ Y: [], Z: [], X: [], W: ['X'] })
    expect(result.applicable).toBe(true)
    expect(result.lhs).toBe('Pr(Y | do(Z=0, X=1), W)')
    expect(result.rhs).toBe('Pr(Y | do(X=1), W)')
    expect(result.definedness).toEqual(['Pr(W | do(Z=0, X=1)) > 0', 'Pr(W | do(X=1)) > 0'])
  })

  test('computes eligible nodes individually for a multivariable Z set', () => {
    const result = step('Y -> Z1; Z1 -> W; Y -> Z2', 3, '', 'Y=1', 'Z1=1, Z2=0', 'W=1')
    expect(result.eligibleZ).toEqual(['Z2'])
    expect(result.removedEdges).toEqual([['Y', 'Z2']])
    expect(result.modifiedGraph.parents.Z1).toEqual(['Y'])
    expect(result.applicable).toBe(false)
  })

  test('allows an empty eligible Z set when Y is still separated', () => {
    const result = step('Z -> W; Y', 3, '', 'Y=1', 'Z=1', 'W=1')
    expect(result.eligibleZ).toEqual([])
    expect(result.applicable).toBe(true)
  })
})

describe('do-calculus step representations', () => {
  test.each([1, 2, 3] as const)('preserves zero assignment values for every group under rule %i', (rule) => {
    const input = parse_do_step('X; Y; Z; W', rule, 'X=0', 'Y=0', 'Z=0', 'W=0')
    const result = check_do_step(input)
    expect(result.applicable).toBe(true)
    const expected = rule === 1
      ? ['Pr(~Y | do(X=0), ~Z & ~W)', 'Pr(~Y | do(X=0), ~W)']
      : rule === 2
        ? ['Pr(~Y | do(X=0, Z=0), ~W)', 'Pr(~Y | do(X=0), ~Z & ~W)']
        : ['Pr(~Y | do(X=0, Z=0), ~W)', 'Pr(~Y | do(X=0), ~W)']
    expect([result.lhs, result.rhs]).toEqual(expected)
    const parsed = parse_causal_document(result.counterexampleProblem.graph, result.counterexampleProblem.constraints)
    expect(Object.values(parsed.probabilities).every(probability => JSON.stringify(probability.event) === JSON.stringify(assert_parse_sentence('~Y')))).toBe(true)
    expect(Object.values(parsed.probabilities)[0].intervention.every(assignment => !assignment.value)).toBe(true)
    expect(result.definedness.length).toBe(2)
    expect(() => parse_causal_document(result.counterexampleProblem.graph, result.definedness.join('\n'))).not.toThrow()
  })

  test('formats joint Y and Z assignments with canonical graph order', () => {
    const result = step('X; Y1; Y2; Z1; Z2; W', 2, 'X=1', 'Y2=1, Y1=0', 'Z2=1, Z1=0', 'W=0')
    expect(result.lhs).toBe('Pr(~Y1 & Y2 | do(X=1, Z1=0, Z2=1), ~W)')
    expect(result.rhs).toBe('Pr(~Y1 & Y2 | do(X=1), ~Z1 & Z2 & ~W)')
    expect(result.eligibleZ).toEqual([])
    expect(result.counterexampleProblem.regular).toBe(false)
    expect(result.counterexampleProblem.constraints).toBe(`${result.lhs} != ${result.rhs}`)
    expect(() => parse_causal_document(result.counterexampleProblem.graph, result.counterexampleProblem.constraints)).not.toThrow()
  })

  test('exports the original causal graph and retains every isolated node', () => {
    const result = step('A; Z -> Y; W', 2)
    const exported = parse_causal_document(result.counterexampleProblem.graph, result.counterexampleProblem.constraints)
    expect(new Set(exported.graph.nodes)).toEqual(new Set(['A', 'Z', 'Y', 'W']))
    expect(exported.graph.parents.Y).toEqual(['Z'])
    expect(result.modifiedGraph.parents.Y).toEqual([])
    expect(result.counterexampleProblem).toMatchObject({ version: 1, regular: false })
  })

  test('checks without mutating graphs, assignments, or caller-owned arrays', () => {
    const input = parse_do_step('Y -> Z; Z -> X; X -> W', 3, 'X=1', 'Y=0', 'Z=1', 'W=0')
    const before = JSON.stringify(input)
    const result = check_do_step(input)
    expect(JSON.stringify(input)).toBe(before)
    result.modifiedGraph.parents.W.push('Y')
    expect(JSON.stringify(input)).toBe(before)
  })
})

describe('do-calculus step validation', () => {
  test.each([0, 4, NaN, 1.5])('rejects unsupported rule %s', (rule) => {
    expect(() => parse_do_step('Y; Z', rule, '', 'Y=1', 'Z=1', '')).toThrow(/rule 1, 2, or 3/)
  })

  test.each([
    ['', 'Z=1', /Y group requires/],
    ['Y=1', '', /Z group requires/],
    ['Y', 'Z=1', /Invalid Y assignment/],
    ['Y=2', 'Z=1', /Invalid Y assignment/],
    ['Y=true', 'Z=1', /Invalid Y assignment/],
    ['Y=1.0', 'Z=1', /Invalid Y assignment/],
    ['Y=1,', 'Z=1', /Invalid Y assignment/],
    ['Y0=1', 'Z=1', /Invalid Y assignment/],
    ['Y01=1', 'Z=1', /Invalid Y assignment/],
    ['Y9007199254740993=1', 'Z=1', /too large/],
    ['Y=1, Y=1', 'Z=1', /Repeated assignment/],
    ['Y=1, Y=0', 'Z=1', /Repeated assignment/],
    ['U=1', 'Z=1', /not declared/],
  ])('rejects malformed or absent assignment lists (%s, %s)', (y, z, error) => {
    expect(() => parse_do_step('X; Y; Z; W', 1, '', y, z, '')).toThrow(error)
  })

  test('accepts whitespace and canonical indexed variables in assignment lists', () => {
    const input = parse_do_step('X1; Y2; Z3; W4', 2, ' X1 = 0 ', '\tY2 = 1\t', 'Z3=0', ' W4=1 ')
    expect(input.x).toEqual([{ variable: 'X1', value: false }])
    expect(input.y).toEqual([{ variable: 'Y2', value: true }])
    expect(check_do_step(input).lhs).toBe('Pr(Y2 | do(X1=0, Z3=0), W4)')
  })

  const pairs = [['x', 'y'], ['x', 'z'], ['x', 'w'], ['y', 'z'], ['y', 'w'], ['z', 'w']] as const
  test.each(pairs)('rejects overlap between %s and %s via the compiler-independent API', (first, second) => {
    const input = parse_do_step('X; Y; Z; W', 1, 'X=1', 'Y=1', 'Z=1', 'W=1')
    input[second] = input[first].map(assignment => ({ ...assignment, value: false }))
    expect(() => check_do_step(input)).toThrow(/pairwise disjoint/)
  })

  test.each([
    { y: [] },
    { z: [] },
    { x: undefined },
    { w: [{ variable: 'Q', value: true }] },
    { y: [{ variable: 'Y', value: 1 }] },
    { z: [{ variable: 'Z', value: 'false' }] },
    { w: [{ variable: ' W ', value: false }] },
    { x: [{ variable: 'X0', value: true }] },
    { y: [{ variable: 'Y', value: true }, { variable: 'Y', value: true }] },
    { rule: 4 },
  ])('rejects malformed API inputs even when callers bypass text parsing: %j', (overrides) => {
    const input = parse_do_step('X; Y; Z; W', 1, 'X=1', 'Y=1', 'Z=1', 'W=1')
    const malformed = { ...input, ...overrides } as unknown as DoStepInput
    expect(() => check_do_step(malformed)).toThrow()
  })

  test('validates DAG structure and phase-1 limits for direct callers', () => {
    const input = parse_do_step('Y; Z', 1, '', 'Y=1', 'Z=1', '')
    input.graph = { nodes: ['Y', 'Z'], parents: { Y: ['Z'], Z: ['Y'] } }
    expect(() => check_do_step(input)).toThrow(/acyclic|cycle/)
    input.graph = { nodes: ['A', 'B', 'C', 'D', 'E', 'Y', 'Z'], parents: { A: [], B: [], C: [], D: [], E: [], Y: [], Z: [] } }
    expect(() => check_do_step(input)).toThrow(/6/)
  })

  test('bounds assignment strings before splitting large input', () => {
    expect(() => parse_do_step('Y; Z', 1, '', 'Y=1'.repeat(2_000), 'Z=1', '')).toThrow(/4096 characters/)
  })
})
