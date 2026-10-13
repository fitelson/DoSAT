import { describe, expect, test } from 'vitest'
import { ancestors, d_separation, mutilate_graph, validate_causal_graph } from './causal_graph'
import { parse_causal_graph, type CausalGraph } from './causal_syntax'

const graph = (source: string): CausalGraph => parse_causal_graph(source)

describe('validated causal graph operations', () => {
  test('accepts finite acyclic graphs, indexed nodes and isolated components', () => {
    expect(() => validate_causal_graph(graph('A -> B; B -> C; D; X1 -> Y9007199254740991'))).not.toThrow()
  })

  test.each([
    { nodes: [], parents: {} },
    { nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], parents: { A: [], B: [], C: [], D: [], E: [], F: [], G: [], H: [], I: [] } },
    { nodes: ['X', 'X'], parents: { X: [] } },
    { nodes: ['X'], parents: { X: ['X'] } },
    { nodes: ['X', 'Y'], parents: { X: ['Y'], Y: ['X'] } },
    { nodes: ['X', 'Y'], parents: { X: [], Y: ['X', 'X'] } },
    { nodes: ['X'], parents: { X: ['Y'] } },
    { nodes: ['X'], parents: { X: [], Y: [] } },
    { nodes: ['X'], parents: {} },
    { nodes: ['X0'], parents: { X0: [] } },
    { nodes: ['X01'], parents: { X01: [] } },
    { nodes: [' X'], parents: { ' X': [] } },
    { nodes: ['x'], parents: { x: [] } },
    { nodes: ['XX'], parents: { XX: [] } },
    { nodes: ['X9007199254740993'], parents: { X9007199254740993: [] } },
  ])('rejects malformed/noncanonical/non-DAG representation %j', invalid => {
    expect(() => validate_causal_graph(invalid as CausalGraph)).toThrow()
  })

  test('rejects invalid runtime field types and inherited parent arrays', () => {
    const invalid: unknown[] = [null, {}, { nodes: 'X', parents: { X: [] } }, { nodes: ['X'], parents: null }, { nodes: ['X'], parents: [] }, { nodes: ['X'], parents: { X: 'Y' } }, { nodes: [1], parents: { 1: [] } }, { nodes: ['X'], parents: Object.create({ X: [] }) }]
    for (const item of invalid) expect(() => validate_causal_graph(item as CausalGraph)).toThrow()
  })

  test('returns inclusive ancestor sets in graph order regardless of endpoint or parent order', () => {
    const source: CausalGraph = { nodes: ['Y', 'X', 'Z', 'W'], parents: { Y: ['Z', 'X'], X: ['Z'], Z: [], W: [] } }
    expect(ancestors(source, ['Y'])).toEqual(['Y', 'X', 'Z'])
    expect(ancestors(source, ['W', 'X'])).toEqual(['X', 'Z', 'W'])
    expect(ancestors(source, [])).toEqual([])
    expect(() => ancestors(source, ['X', 'X'])).toThrow('Duplicate')
    expect(() => ancestors(source, ['A'])).toThrow('Unknown')
  })

  test('incoming and outgoing cuts delete the requested arrows and preserve all node/parent source arrays', () => {
    const source = graph('Z -> X; X -> Y; Z -> Y')
    const snapshot = structuredClone(source)
    const incoming = mutilate_graph(source, { removeIncoming: ['X'] })
    expect(incoming.parents).toEqual({ Z: [], X: [], Y: ['X', 'Z'] })
    const outgoing = mutilate_graph(source, { removeOutgoing: ['X'] })
    expect(outgoing.parents).toEqual({ Z: [], X: ['Z'], Y: ['Z'] })
    const both = mutilate_graph(source, { removeIncoming: ['X'], removeOutgoing: ['Z'] })
    expect(both.parents).toEqual({ Z: [], X: [], Y: ['X'] })
    const same = mutilate_graph(source, { removeIncoming: ['X'], removeOutgoing: ['X'] })
    expect(same.parents).toEqual({ Z: [], X: [], Y: ['Z'] })
    for (const result of [incoming, outgoing, both, same, mutilate_graph(source)]) {
      expect(result.nodes).not.toBe(source.nodes)
      expect(result.parents).not.toBe(source.parents)
      for (const node of source.nodes) expect(result.parents[node]).not.toBe(source.parents[node])
      validate_causal_graph(result)
    }
    incoming.parents.Y.push('Z')
    incoming.nodes.reverse()
    expect(source).toEqual(snapshot)
  })

  test('cuts work against a frozen source and do not depend on topological node order', () => {
    const source: CausalGraph = { nodes: ['Y', 'X', 'Z'], parents: { Y: ['Z', 'X'], X: ['Z'], Z: [] } }
    Object.freeze(source)
    Object.freeze(source.nodes)
    Object.freeze(source.parents)
    Object.values(source.parents).forEach(Object.freeze)
    expect(mutilate_graph(source, { removeOutgoing: ['Z'] }).parents).toEqual({ Y: ['X'], X: [], Z: [] })
  })

  test('rejects unknown and repeated cut nodes and malformed set arrays', () => {
    const source = graph('X -> Y')
    expect(() => mutilate_graph(source, { removeIncoming: ['Z'] })).toThrow('Unknown')
    expect(() => mutilate_graph(source, { removeOutgoing: ['X', 'X'] })).toThrow('Duplicate')
    expect(() => mutilate_graph(source, { removeIncoming: null as unknown as string[] })).toThrow('array')
    expect(() => mutilate_graph(source, null as unknown as {})).toThrow('options record')
  })
})

describe('ancestral moral graph d-separation', () => {
  test('a chain is blocked by its middle node', () => {
    const source = graph('X -> M; M -> Y')
    const active = d_separation(source, ['X'], ['Y'], [])
    expect(active.separated).toBe(false)
    expect(active.connectingPath).toEqual(['X', 'M', 'Y'])
    const blocked = d_separation(source, ['X'], ['Y'], ['M'])
    expect(blocked).toEqual({ separated: true, ancestors: ['X', 'M', 'Y'], moralEdges: [['X', 'M'], ['M', 'Y']], conditioned: ['M'], remainingEdges: [] })
  })

  test('a common-cause fork is blocked by its root', () => {
    const source = graph('Z -> X; Z -> Y')
    expect(d_separation(source, ['X'], ['Y'], []).connectingPath).toEqual(['X', 'Z', 'Y'])
    expect(d_separation(source, ['X'], ['Y'], ['Z']).separated).toBe(true)
    const intervened = mutilate_graph(source, { removeIncoming: ['X'] })
    expect(d_separation(intervened, ['X'], ['Y'], []).separated).toBe(true)
  })

  test('a collider is blocked until conditioned on, with the parent marriage shown in the certificate', () => {
    const source = graph('X -> C; Y -> C')
    const blocked = d_separation(source, ['X'], ['Y'], [])
    expect(blocked.ancestors).toEqual(['X', 'Y'])
    expect(blocked.moralEdges).toEqual([])
    expect(blocked.separated).toBe(true)
    const opened = d_separation(source, ['X'], ['Y'], ['C'])
    expect(opened.separated).toBe(false)
    expect(opened.ancestors).toEqual(['X', 'C', 'Y'])
    expect(opened.moralEdges).toEqual([['X', 'C'], ['X', 'Y'], ['C', 'Y']])
    expect(opened.remainingEdges).toEqual([['X', 'Y']])
    // X--Y is a moral marriage edge, not an arrow or active path in the DAG.
    expect(opened.connectingPath).toEqual(['X', 'Y'])
    expect(source.parents.Y).not.toContain('X')
  })

  test('conditioning on a collider descendant activates the collider, but conditioning on an unrelated node does not', () => {
    const source = graph('X -> C; Y -> C; C -> D; W')
    expect(d_separation(source, ['X'], ['Y'], []).separated).toBe(true)
    expect(d_separation(source, ['X'], ['Y'], ['W']).separated).toBe(true)
    const opened = d_separation(source, ['X'], ['Y'], ['D'])
    expect(opened.separated).toBe(false)
    expect(opened.ancestors).toEqual(['X', 'C', 'Y', 'D'])
    expect(opened.connectingPath).toEqual(['X', 'Y'])
  })

  test('conditioning on a descendant does not itself block a noncollider chain', () => {
    const source = graph('X -> M; M -> Y; M -> D')
    expect(d_separation(source, ['X'], ['Y'], ['D']).connectingPath).toEqual(['X', 'M', 'Y'])
    expect(d_separation(source, ['X'], ['Y'], ['M', 'D']).separated).toBe(true)
  })

  test('parent marriage is restricted to the ancestral graph, never through an irrelevant common child', () => {
    const source = graph('A -> X; A -> C; B -> C; B -> Y')
    const result = d_separation(source, ['X'], ['Y'], [])
    expect(result.separated).toBe(true)
    expect(result.ancestors).not.toContain('C')
    expect(result.moralEdges).not.toContainEqual(['A', 'B'])
    expect(d_separation(source, ['X'], ['Y'], ['C']).separated).toBe(false)
  })

  test('disconnected components remain separated and empty endpoints are vacuously separated', () => {
    const source = graph('X -> M; Y -> Z')
    expect(d_separation(source, ['X'], ['Y'], []).separated).toBe(true)
    expect(d_separation(source, [], ['Y'], ['X']).separated).toBe(true)
    expect(d_separation(source, ['X'], [], ['Y']).separated).toBe(true)
    expect(d_separation(source, [], [], []).ancestors).toEqual([])
    expect(d_separation(source, [], [], ['M']).ancestors).toEqual(['X', 'M'])
  })

  test('multiple endpoints, edge order and shortest certificate are deterministic in graph order', () => {
    const source: CausalGraph = { nodes: ['Y', 'A', 'B', 'X'], parents: { Y: ['X'], A: [], B: ['A'], X: [] } }
    const first = d_separation(source, ['X', 'A'], ['Y', 'B'], [])
    const reordered = d_separation(source, ['A', 'X'], ['B', 'Y'], [])
    expect(first).toEqual(reordered)
    expect(first.moralEdges).toEqual([['Y', 'X'], ['A', 'B']])
    expect(first.connectingPath).toEqual(['A', 'B'])
    expect(d_separation(source, ['X'], ['Y', 'B'], ['A']).conditioned).toEqual(['A'])
  })

  test('an outgoing cut removes mediation while an incoming cut preserves the downstream path', () => {
    const source = graph('Z -> X; X -> M; M -> Y')
    expect(d_separation(mutilate_graph(source, { removeOutgoing: ['X'] }), ['X'], ['Y'], []).separated).toBe(true)
    expect(d_separation(mutilate_graph(source, { removeIncoming: ['X'] }), ['X'], ['Y'], []).separated).toBe(false)
    expect(source.parents.X).toEqual(['Z'])
    expect(source.parents.M).toEqual(['X'])
  })

  test('validates unknown, duplicate and overlapping endpoint/conditioning sets even in vacuous cases', () => {
    const source = graph('X -> Y; Z')
    expect(() => d_separation(source, ['A'], ['Y'], [])).toThrow('Unknown')
    expect(() => d_separation(source, ['X', 'X'], ['Y'], [])).toThrow('Duplicate')
    expect(() => d_separation(source, ['X'], ['Y', 'Y'], [])).toThrow('Duplicate')
    expect(() => d_separation(source, ['X'], ['Y'], ['Z', 'Z'])).toThrow('Duplicate')
    expect(() => d_separation(source, ['X'], ['X'], [])).toThrow('disjoint')
    expect(() => d_separation(source, ['X'], ['Y'], ['X'])).toThrow('disjoint')
    expect(() => d_separation(source, [], ['Y'], ['Y'])).toThrow('disjoint')
  })
})
