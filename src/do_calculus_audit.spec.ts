import { beforeAll, describe, expect, test } from 'vitest'
import { d_separation } from './causal_graph'
import { check_do_step, parse_do_step, type DoRule, type DoStepInput } from './do_calculus'
import { compile_causal_document } from './causal'
import { parse_causal_document, parse_causal_graph, type CausalGraph, type Intervention } from './causal_syntax'
import { init_z3, WrappedSolver, type WrappedSolverResult } from './z3_integration'

type Groups = { x: string[], y: string[], z: string[], w: string[] }
let z3: Awaited<ReturnType<typeof init_z3>>
beforeAll(async () => { z3 = await init_z3() })

/** Independent directed reachability, using descendants rather than ancestor code. */
const reaches = (graph: CausalGraph, start: string, targets: Set<string>): boolean => {
  const pending = [start]
  const visited = new Set<string>()
  while (pending.length > 0) {
    const node = pending.pop()!
    if (targets.has(node)) return true
    if (visited.has(node)) continue
    visited.add(node)
    for (const child of graph.nodes) {
      if ((graph.parents[child] ?? []).includes(node)) pending.push(child)
    }
  }
  return false
}

/**
 * Independent d-separation oracle: enumerate simple undirected paths in the
 * original DAG and apply the collider/noncollider activation definition.
 * This uses neither moralization nor any implementation graph helper.
 */
const active_path_separated = (graph: CausalGraph, left: string[], right: string[], conditioned: string[]): boolean => {
  const evidence = new Set(conditioned)
  const targets = new Set(right)
  const colliderOpen = new Set(graph.nodes.filter(node => reaches(graph, node, evidence)))
  const neighbors = (node: string) => graph.nodes.filter(other =>
    (graph.parents[node] ?? []).includes(other) || (graph.parents[other] ?? []).includes(node),
  )
  const path_active = (path: string[]): boolean => {
    for (let index = 1; index < path.length - 1; index++) {
      const node = path[index]
      const collider = (graph.parents[node] ?? []).includes(path[index - 1]) &&
        (graph.parents[node] ?? []).includes(path[index + 1])
      if (collider ? !colliderOpen.has(node) : evidence.has(node)) return false
    }
    return true
  }
  const search = (path: string[]): boolean => {
    const node = path[path.length - 1]
    if (targets.has(node) && path_active(path)) return true
    for (const neighbor of neighbors(node)) {
      if (!path.includes(neighbor) && search([...path, neighbor])) return true
    }
    return false
  }
  return !left.some(node => search([node]))
}

const ordered_dags = (nodes: string[]): CausalGraph[] => {
  const possibleEdges: [string, string][] = []
  for (let parent = 0; parent < nodes.length; parent++) {
    for (let child = parent + 1; child < nodes.length; child++) possibleEdges.push([nodes[parent], nodes[child]])
  }
  return Array.from({ length: 2 ** possibleEdges.length }, (_, mask) => {
    const parents: Record<string, string[]> = Object.fromEntries(nodes.map(node => [node, []]))
    possibleEdges.forEach(([parent, child], bit) => {
      if ((mask & (1 << bit)) !== 0) parents[child].push(parent)
    })
    return { nodes: [...nodes], parents }
  })
}

const set_assignments = (nodes: string[], numberOfGroups: number): string[][][] => Array.from(
  { length: numberOfGroups ** nodes.length },
  (_, pattern) => {
    const groups: string[][] = Array.from({ length: numberOfGroups }, () => [])
    nodes.forEach((node, index) => groups[Math.floor(pattern / numberOfGroups ** index) % numberOfGroups].push(node))
    return groups
  },
)

const assignment_values = (nodes: string[]): Intervention[] => nodes.map(variable => ({ variable, value: true }))

/** Independent surgery oracle: filter directed edges by their target node. */
const remove_incoming = (graph: CausalGraph, nodes: string[]): CausalGraph => ({
  nodes: [...graph.nodes],
  parents: Object.fromEntries(graph.nodes.map(node => [node, nodes.includes(node) ? [] : [...(graph.parents[node] ?? [])]])),
})

const rule_three_oracle = (graph: CausalGraph, groups: Groups) => {
  const afterX = remove_incoming(graph, groups.x)
  const eligibleZ = groups.z.filter(node => !reaches(afterX, node, new Set(groups.w)))
  const modifiedGraph = remove_incoming(afterX, eligibleZ)
  return {
    eligibleZ,
    modifiedGraph,
    applicable: active_path_separated(modifiedGraph, groups.y, groups.z, [...groups.x, ...groups.w]),
  }
}

const solve = async (graphText: string, constraints: string, regular = false) => {
  const compiled = compile_causal_document(parse_causal_document(graphText, constraints), { regular })
  const solver = new WrappedSolver(z3, init_z3)
  const result = await solver.solve(compiled.smtlib, 15_000)
  return { compiled, result }
}

const require_sat = (result: WrappedSolverResult) => {
  expect(result.status).toBe('sat')
  if (result.status !== 'sat') throw new Error(`Expected SAT; got ${result.status}`)
  return result
}

describe('independent d-separation audit', () => {
  test('matches active-path enumeration on every ordered four-node DAG and disjoint nonempty endpoint sets', () => {
    let cases = 0
    for (const graph of ordered_dags(['A', 'B', 'C', 'D'])) {
      // A node is unused, in the left set, in the right set, or conditioned.
      for (const [, left, right, conditioned] of set_assignments(graph.nodes, 4)) {
        if (left.length === 0 || right.length === 0) continue
        const expected = active_path_separated(graph, left, right, conditioned)
        const actual = d_separation(graph, left, right, conditioned)
        if (actual.separated !== expected) {
          throw new Error(`d-separation mismatch: ${JSON.stringify({ graph, left, right, conditioned, expected, actual })}`)
        }
        cases++
      }
    }
    // 64 graphs times (4^4 - 2*3^4 + 2^4) admissible set assignments.
    expect(cases).toBe(7_040)
  })

  test('handles relabeling and node orders that are not topological', () => {
    let cases = 0
    for (const generated of ordered_dags(['Z2', 'X1', 'W', 'A'])) {
      const graph = { ...generated, nodes: ['A', 'W', 'X1', 'Z2'] }
      for (const [, left, right, conditioned] of set_assignments(graph.nodes, 4)) {
        if (left.length === 0 || right.length === 0) continue
        expect(d_separation(graph, left, right, conditioned).separated).toBe(active_path_separated(graph, left, right, conditioned))
        cases++
      }
    }
    expect(cases).toBe(7_040)
  })

  test('checks collider descendants and blocking across a six-node graph', () => {
    const graph = parse_causal_graph('A -> C; B -> C; C -> D; D -> E; A -> F; F -> E')
    const examples: [string[], string[], string[], boolean][] = [
      [['A'], ['B'], [], true],
      [['A'], ['B'], ['C'], false],
      [['A'], ['B'], ['D'], false],
      [['A'], ['B'], ['E'], false],
      [['B'], ['F'], [], true],
      [['B'], ['F'], ['E'], false],
      [['A'], ['B', 'D'], ['C', 'F'], false],
      [['A'], ['D'], ['C'], true],
    ]
    for (const [left, right, conditioned, expected] of examples) {
      expect(active_path_separated(graph, left, right, conditioned)).toBe(expected)
      expect(d_separation(graph, left, right, conditioned).separated).toBe(expected)
    }
  })
})

describe('independent Rule 3 surgery audit', () => {
  test('Rules 1 and 2 use their prescribed incoming and outgoing cuts on every four-node group assignment', () => {
    let cases = 0
    for (const graph of ordered_dags(['A', 'B', 'C', 'D'])) {
      for (const [, x, y, z, w] of set_assignments(graph.nodes, 5)) {
        if (y.length === 0 || z.length === 0) continue
        for (const rule of [1, 2] as DoRule[]) {
          const afterX = remove_incoming(graph, x)
          const modifiedGraph = rule === 1 ? afterX : {
            nodes: afterX.nodes,
            parents: Object.fromEntries(afterX.nodes.map(node => [node, afterX.parents[node].filter(parent => !z.includes(parent))])),
          }
          const expected = active_path_separated(modifiedGraph, y, z, [...x, ...w])
          const input: DoStepInput = { graph, rule, x: assignment_values(x), y: assignment_values(y), z: assignment_values(z), w: assignment_values(w) }
          const actual = check_do_step(input)
          if (actual.applicable !== expected || JSON.stringify(actual.modifiedGraph) !== JSON.stringify(modifiedGraph)) {
            throw new Error(`Rule ${rule} mismatch: ${JSON.stringify({ input, modifiedGraph, expected, actual })}`)
          }
          cases++
        }
      }
    }
    expect(cases).toBe(24_832)
  })

  test('matches directed-reachability and active-path oracles for every ordered four-node DAG and disjoint group assignment', () => {
    let cases = 0
    for (const graph of ordered_dags(['A', 'B', 'C', 'D'])) {
      // Every node is unused or assigned to exactly one of X,Y,Z,W.
      for (const [, x, y, z, w] of set_assignments(graph.nodes, 5)) {
        if (y.length === 0 || z.length === 0) continue
        const expected = rule_three_oracle(graph, { x, y, z, w })
        const input: DoStepInput = { graph, rule: 3, x: assignment_values(x), y: assignment_values(y), z: assignment_values(z), w: assignment_values(w) }
        const actual = check_do_step(input)
        if (actual.applicable !== expected.applicable ||
            JSON.stringify(actual.modifiedGraph) !== JSON.stringify(expected.modifiedGraph) ||
            JSON.stringify(actual.eligibleZ) !== JSON.stringify(expected.eligibleZ)) {
          throw new Error(`Rule 3 mismatch: ${JSON.stringify({ input, expected, actual })}`)
        }
        cases++
      }
    }
    // 64 graphs times (5^4 - 2*4^4 + 3^4) admissible group assignments.
    expect(cases).toBe(12_416)
  })

  test('a descendant of Z in W prevents deleting all incoming Z arrows', () => {
    const input = parse_do_step('A -> Z; A -> Y; Z -> W', 3, '', 'Y=1', 'Z=1', 'W=1')
    const step = check_do_step(input)
    expect(step.eligibleZ).toEqual([])
    expect(step.applicable).toBe(false)
    expect(step.modifiedGraph.parents.Z).toEqual(['A'])
  })

  test('computes W ancestry after removing arrows into X', () => {
    const input = parse_do_step('U -> Z; U -> Y; Z -> X; X -> W', 3, 'X=1', 'Y=1', 'Z=1', 'W=1')
    const step = check_do_step(input)
    expect(step.eligibleZ).toEqual(['Z'])
    expect(step.modifiedGraph.parents.X).toEqual([])
    expect(step.modifiedGraph.parents.Z).toEqual([])
    expect(step.applicable).toBe(true)
  })
})

describe('real-Z3 checks of do-calculus certificates', () => {
  test.each([
    ['X -> Z; Z -> W; W -> Y; X -> Y', 1, 'X=1', 'Y=1', 'Z=1', 'W=1'],
    ['W -> Z; W -> Y; Z -> Y', 2, '', 'Y=1', 'Z=1', 'W=1'],
    ['Z -> X; X -> Y', 3, 'X=1', 'Y=1', 'Z=1', ''],
    ['U -> Z; U -> Y; Z -> X; X -> W', 3, 'X=1', 'Y=1', 'Z=1', 'W=1'],
    ['A -> Y; A -> M; A -> Z; A -> W', 1, '', 'Y=1, M=0', 'Z=0', 'A=1, W=0'],
  ])('the certified equality for %s has no regular causal countermodel', async (graph, rule, x, y, z, w) => {
    const step = check_do_step(parse_do_step(String(graph), Number(rule), String(x), String(y), String(z), String(w)))
    expect(step.applicable).toBe(true)
    // Strict CPTs guarantee that these disjoint assignments' evidence is
    // possible in both regimes. Thus UNSAT is not caused by undefined ratios.
    const { result } = await solve(String(graph), `${step.lhs} != ${step.rhs}`, true)
    expect(result.status).toBe('unsat')
  })

  test('retains an exact causal counterexample when Rule 3 graphical conditions fail', async () => {
    const graphText = 'A -> Z; A -> Y; Z -> W'
    const step = check_do_step(parse_do_step(graphText, 3, '', 'Y=1', 'Z=1', 'W=1'))
    expect(step.applicable).toBe(false)
    const { compiled, result } = await solve(graphText, `
      Pr(A) = 1/2
      Pr(Z <-> A) = 1
      Pr(Y <-> A) = 1
      Pr(W <-> Z) = 1
      ${step.lhs} != ${step.rhs}
    `)
    const sat = require_sat(result)
    const lhs = compiled.queries.find(query => query.source === step.lhs)
    const rhs = compiled.queries.find(query => query.source === step.rhs)
    if (!lhs || !rhs) throw new Error('Missing generated probability queries')
    expect(await sat.evaluate_exact(lhs.expression)).toEqual({ defined: true, value: '(/ 1.0 2.0)' })
    expect(await sat.evaluate_exact(rhs.expression)).toEqual({ defined: true, value: '1.0' })
  })

  test('a failed graphical condition does not imply that the equality is false in every model', async () => {
    const graphText = 'Z -> Y'
    const step = check_do_step(parse_do_step(graphText, 3, '', 'Y=1', 'Z=1', ''))
    expect(step.applicable).toBe(false)
    // An allowed arrow need not carry an effect: both parent-conditioned Y
    // mechanisms can be equal while every mechanism remains strictly positive.
    const { compiled, result } = await solve(graphText, `
      Pr(Z) = 1/2
      Pr(Y | Z) = 1/2
      Pr(Y | ~Z) = 1/2
      ${step.lhs} = ${step.rhs}
    `, true)
    const sat = require_sat(result)
    for (const source of [step.lhs, step.rhs]) {
      const query = compiled.queries.find(candidate => candidate.source === source)
      if (!query) throw new Error(`Missing generated query ${source}`)
      expect(await sat.evaluate_exact(query.expression)).toEqual({ defined: true, value: '(/ 1.0 2.0)' })
    }
  })
})
