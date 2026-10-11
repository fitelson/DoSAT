import {
  ancestors,
  d_separation,
  mutilate_graph,
  validate_causal_graph,
  type DSeparationResult,
} from './causal_graph'
import {
  CAUSAL_LIMITS,
  normalize_causal_variable,
  parse_causal_graph,
  type CausalGraph,
  type Intervention,
} from './causal_syntax'

export type DoRule = 1 | 2 | 3

export interface DoStepInput {
  graph: CausalGraph
  rule: DoRule
  x: Intervention[]
  y: Intervention[]
  z: Intervention[]
  w: Intervention[]
}

export interface DoStepResult {
  applicable: boolean
  lhs: string
  rhs: string
  modifiedGraph: CausalGraph
  removedEdges: [string, string][]
  /** Rule 3's Z(W), computed after cutting incoming edges to X. */
  eligibleZ: string[]
  separation: DSeparationResult
  conditionText: string
  graphLabel: string
  /** Each listed evidence mass must be strictly positive. */
  definedness: string[]
  counterexampleProblem: {
    version: 1
    graph: string
    constraints: string
    regular: boolean
  }
}

const GROUPS = ['x', 'y', 'z', 'w'] as const
type AssignmentGroup = typeof GROUPS[number]

const validate_rule = (rule: number): DoRule => {
  if (rule !== 1 && rule !== 2 && rule !== 3) {
    throw new Error('Choose do-calculus rule 1, 2, or 3.')
  }
  return rule
}

const validate_step = (input: DoStepInput): void => {
  if (!input || typeof input !== 'object') throw new Error('Expected a do-calculus step.')
  validate_rule(input.rule)
  validate_causal_graph(input.graph)
  const membership = new Map<string, AssignmentGroup>()
  for (const group of GROUPS) {
    const assignments = input[group]
    if (!Array.isArray(assignments)) throw new Error(`The ${group.toUpperCase()} group must be an assignment list.`)
    if ((group === 'y' || group === 'z') && assignments.length === 0) {
      throw new Error(`The ${group.toUpperCase()} group requires at least one assignment.`)
    }
    if (assignments.length > input.graph.nodes.length) {
      throw new Error(`The ${group.toUpperCase()} group contains too many assignments; each declared variable may occur only once.`)
    }
    for (const assignment of assignments) {
      if (!assignment || typeof assignment !== 'object' || typeof assignment.variable !== 'string' || typeof assignment.value !== 'boolean') {
        throw new Error(`Each ${group.toUpperCase()} assignment must name a variable and have a Boolean value.`)
      }
      const variable = normalize_causal_variable(assignment.variable)
      if (variable !== assignment.variable) throw new Error(`Use the canonical variable name ${variable} in the ${group.toUpperCase()} group.`)
      if (!input.graph.nodes.includes(variable)) throw new Error(`Variable ${variable} in the ${group.toUpperCase()} group is not declared in the graph.`)
      const previous = membership.get(variable)
      if (previous === group) throw new Error(`Repeated assignment for ${variable} in the ${group.toUpperCase()} group.`)
      if (previous !== undefined) {
        throw new Error(`The ${previous.toUpperCase()} and ${group.toUpperCase()} groups overlap at ${variable}; all four groups must be pairwise disjoint.`)
      }
      membership.set(variable, group)
    }
  }
}

const parse_assignments = (source: string, group: AssignmentGroup): Intervention[] => {
  if (source.length > CAUSAL_LIMITS.max_line_characters) {
    throw new Error(`The ${group.toUpperCase()} assignment list is limited to ${CAUSAL_LIMITS.max_line_characters} characters.`)
  }
  if (!source.trim()) return []
  return source.split(',').map((assignment) => {
    const match = /^\s*([A-Z](?:[1-9][0-9]*)?)\s*=\s*([01])\s*$/.exec(assignment)
    if (!match) {
      throw new Error(`Invalid ${group.toUpperCase()} assignment "${assignment.trim()}". Use assignments such as X=1, Y=0.`)
    }
    return { variable: normalize_causal_variable(match[1]), value: match[2] === '1' }
  })
}

export const parse_do_step = (
  graphText: string,
  rule: number,
  xText: string,
  yText: string,
  zText: string,
  wText: string,
): DoStepInput => {
  const input: DoStepInput = {
    graph: parse_causal_graph(graphText),
    rule: validate_rule(rule),
    x: parse_assignments(xText, 'x'),
    y: parse_assignments(yText, 'y'),
    z: parse_assignments(zText, 'z'),
    w: parse_assignments(wText, 'w'),
  }
  validate_step(input)
  return input
}

const ordered = (graph: CausalGraph, assignments: Intervention[]): Intervention[] => (
  graph.nodes.flatMap(variable => assignments.filter(assignment => assignment.variable === variable))
)

const event_text = (assignments: Intervention[]): string => assignments.map(({ variable, value }) => value ? variable : `~${variable}`).join(' & ')
const action_text = (assignments: Intervention[]): string => assignments.map(({ variable, value }) => `${variable}=${Number(value)}`).join(', ')

const probability_text = (event: Intervention[], actions: Intervention[], evidence: Intervention[]): string => {
  const conditioning = [
    ...(actions.length ? [`do(${action_text(actions)})`] : []),
    ...(evidence.length ? [event_text(evidence)] : []),
  ].join(', ')
  return `Pr(${event_text(event)}${conditioning ? ` | ${conditioning}` : ''})`
}

const directed_edges = (graph: CausalGraph): [string, string][] => (
  graph.nodes.flatMap(child => graph.nodes.filter(parent => graph.parents[child].includes(parent)).map(parent => [parent, child] as [string, string]))
)

const graph_text = (graph: CausalGraph): string => {
  const edges = directed_edges(graph)
  const connected = new Set(edges.flat())
  return [...edges.map(([parent, child]) => `${parent} -> ${child}`), ...graph.nodes.filter(node => !connected.has(node))].join('\n')
}

const set_text = (nodes: string[]): string => nodes.length ? `{${nodes.join(', ')}}` : '∅'

/**
 * Check one instance of Pearl's Causality, Theorem 3.4.1 (Rules 1–3).
 * https://web.cs.ucla.edu/~kaoru/CAUSALITY-REPRINTED-W-CORRECTIONS-2013/causality-ch3-june2013.pdf
 * The graphical condition is sufficient for equality where both terms are
 * defined. Its failure does not prove that the equality is false.
 */
export const check_do_step = (input: DoStepInput): DoStepResult => {
  validate_step(input)
  const { graph, rule } = input
  const x = ordered(graph, input.x)
  const y = ordered(graph, input.y)
  const z = ordered(graph, input.z)
  const w = ordered(graph, input.w)
  const xNodes = x.map(assignment => assignment.variable)
  const yNodes = y.map(assignment => assignment.variable)
  const zNodes = z.map(assignment => assignment.variable)
  const wNodes = w.map(assignment => assignment.variable)
  const graphBarX = mutilate_graph(graph, { removeIncoming: xNodes })
  let modifiedGraph = graphBarX
  let eligibleZ: string[] = []
  let graphLabel = 'G_bar(X)'
  if (rule === 2) {
    modifiedGraph = mutilate_graph(graphBarX, { removeOutgoing: zNodes })
    graphLabel = 'G_bar(X),underline(Z)'
  } else if (rule === 3) {
    // Pearl's Z(W) uses ancestry in G_bar(X), before the further Z surgery.
    const ancestorsOfW = new Set(ancestors(graphBarX, wNodes))
    eligibleZ = zNodes.filter(node => !ancestorsOfW.has(node))
    modifiedGraph = mutilate_graph(graphBarX, { removeIncoming: eligibleZ })
    graphLabel = 'G_bar(X),bar(Z(W))'
  }
  const conditioned = graph.nodes.filter(node => xNodes.includes(node) || wNodes.includes(node))
  const separation = d_separation(modifiedGraph, yNodes, zNodes, conditioned)
  const actionsXZ = ordered(graph, [...x, ...z])
  const evidenceZW = ordered(graph, [...z, ...w])
  const lhsActions = rule === 1 ? x : actionsXZ
  const lhsEvidence = rule === 1 ? evidenceZW : w
  const rhsEvidence = rule === 2 ? evidenceZW : w
  const lhs = probability_text(y, lhsActions, lhsEvidence)
  const rhs = probability_text(y, x, rhsEvidence)
  const definedness = [...new Set([
    ...(lhsEvidence.length ? [`${probability_text(lhsEvidence, lhsActions, [])} > 0`] : []),
    ...(rhsEvidence.length ? [`${probability_text(rhsEvidence, x, [])} > 0`] : []),
  ])]
  const removedEdges = directed_edges(graph).filter(([parent, child]) => !modifiedGraph.parents[child].includes(parent))
  const conditionText = `${set_text(yNodes)} ⟂ ${set_text(zNodes)} given ${set_text(conditioned)} in ${graphLabel}. ${separation.separated ? 'The rule certifies equality wherever both sides are defined.' : 'The graphical condition fails; this rule does not certify the equality.'}`
  return {
    applicable: separation.separated,
    lhs,
    rhs,
    modifiedGraph,
    removedEdges,
    eligibleZ,
    separation,
    conditionText,
    graphLabel,
    definedness,
    counterexampleProblem: {
      version: 1,
      graph: graph_text(graph),
      constraints: `${lhs} != ${rhs}`,
      regular: false,
    },
  }
}
