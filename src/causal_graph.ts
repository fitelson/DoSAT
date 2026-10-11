import { CAUSAL_LIMITS, normalize_causal_variable, type CausalGraph } from './causal_syntax'

export type DSeparationResult = {
  separated: boolean
  /** Inclusive ancestry of the two endpoints and conditioning set. */
  ancestors: string[]
  /** Undirected edges after restricting to the ancestral graph and moralizing. */
  moralEdges: [string, string][]
  conditioned: string[]
  /** Moral edges remaining after removing conditioned nodes. */
  remainingEdges: [string, string][]
  /** A path in the remaining moral graph; this is not a DAG active-path claim. */
  connectingPath?: string[]
}

/** Validate the complete finite graph representation supplied to graph operations. */
export const validate_causal_graph = (graph: CausalGraph): void => {
  if (graph === null || typeof graph !== 'object' || !Array.isArray(graph.nodes) ||
      graph.parents === null || typeof graph.parents !== 'object' || Array.isArray(graph.parents)) {
    throw new Error('Expected a causal graph with a nodes array and a parents record.')
  }
  if (graph.nodes.length === 0 || graph.nodes.length > CAUSAL_LIMITS.max_nodes) {
    throw new Error(`A causal graph must have between 1 and ${CAUSAL_LIMITS.max_nodes} nodes.`)
  }
  const known = new Set<string>()
  for (const node of graph.nodes) {
    if (typeof node !== 'string' || normalize_causal_variable(node) !== node) {
      throw new Error('Causal node identifiers must be canonical PrSAT sentence letters, such as X or X1.')
    }
    if (known.has(node)) throw new Error(`Duplicate causal node '${node}'.`)
    known.add(node)
  }
  for (const node of Object.keys(graph.parents)) {
    if (!known.has(node)) throw new Error(`Parent record names unknown causal node '${node}'.`)
  }
  for (const node of graph.nodes) {
    if (!Object.prototype.hasOwnProperty.call(graph.parents, node) || !Array.isArray(graph.parents[node])) {
      throw new Error(`Causal node '${node}' requires its own parents array, including [] for roots.`)
    }
    const unique = new Set<string>()
    for (const parent of graph.parents[node]) {
      if (typeof parent !== 'string' || !known.has(parent)) throw new Error(`Unknown parent '${String(parent)}' of '${node}'.`)
      if (unique.has(parent)) throw new Error(`Duplicate parent '${parent}' of '${node}'.`)
      if (parent === node) throw new Error(`Self edge '${node} -> ${node}' is not allowed.`)
      unique.add(parent)
    }
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (node: string): void => {
    if (visiting.has(node)) throw new Error('The causal graph must be acyclic.')
    if (visited.has(node)) return
    visiting.add(node)
    for (const parent of graph.parents[node]) visit(parent)
    visiting.delete(node)
    visited.add(node)
  }
  graph.nodes.forEach(visit)
}

const validate_nodes = (graph: CausalGraph, nodes: string[], role: string): Set<string> => {
  if (!Array.isArray(nodes)) throw new Error(`The ${role} set must be an array of causal node identifiers.`)
  const result = new Set<string>()
  for (const node of nodes) {
    if (typeof node !== 'string' || !graph.nodes.includes(node)) throw new Error(`Unknown causal node '${String(node)}' in the ${role} set.`)
    if (result.has(node)) throw new Error(`Duplicate causal node '${node}' in the ${role} set.`)
    result.add(node)
  }
  return result
}

/** Inclusive ancestors, returned in the original graph's node order. */
export const ancestors = (graph: CausalGraph, nodes: string[]): string[] => {
  validate_causal_graph(graph)
  const result = validate_nodes(graph, nodes, 'ancestry')
  const queue = [...result]
  for (let index = 0; index < queue.length; index++) {
    for (const parent of graph.parents[queue[index]]) {
      if (!result.has(parent)) {
        result.add(parent)
        queue.push(parent)
      }
    }
  }
  return graph.nodes.filter(node => result.has(node))
}

/** Delete specified incoming/outgoing arrows without changing the source graph. */
export const mutilate_graph = (
  graph: CausalGraph,
  cuts: { removeIncoming?: string[], removeOutgoing?: string[] } = {},
): CausalGraph => {
  validate_causal_graph(graph)
  if (cuts === null || typeof cuts !== 'object' || Array.isArray(cuts)) throw new Error('Graph cuts must be an options record.')
  const incoming = validate_nodes(graph, cuts.removeIncoming === undefined ? [] : cuts.removeIncoming, 'incoming-cut')
  const outgoing = validate_nodes(graph, cuts.removeOutgoing === undefined ? [] : cuts.removeOutgoing, 'outgoing-cut')
  return {
    nodes: [...graph.nodes],
    parents: Object.fromEntries(graph.nodes.map(node => [node, incoming.has(node) ? [] : graph.parents[node].filter(parent => !outgoing.has(parent))])),
  }
}

/**
 * Test d-separation by separation in the moralized ancestral graph.
 * The equivalence is Proposition 4 in Lauritzen, Causal inference from
 * graphical models, pp. 12–13:
 * https://people.csail.mit.edu/tdanford/discovering-causal-graphs-papers/lauritzen-causal-inference-graphical-models.pdf
 * Restrict to ancestors BEFORE marrying parents; then remove conditioned nodes.
 */
export const d_separation = (
  graph: CausalGraph,
  left: string[],
  right: string[],
  conditioned: string[],
): DSeparationResult => {
  validate_causal_graph(graph)
  const left_set = validate_nodes(graph, left, 'left endpoint')
  const right_set = validate_nodes(graph, right, 'right endpoint')
  const conditioned_set = validate_nodes(graph, conditioned, 'conditioning')
  for (const node of graph.nodes) {
    const count = Number(left_set.has(node)) + Number(right_set.has(node)) + Number(conditioned_set.has(node))
    if (count > 1) throw new Error(`D-separation endpoint and conditioning sets must be disjoint; '${node}' occurs in multiple sets.`)
  }
  const ancestral_nodes = ancestors(graph, [...left, ...right, ...conditioned])
  const ancestral_set = new Set(ancestral_nodes)
  const indices = new Map(graph.nodes.map((node, index) => [node, index]))
  const edge_map = new Map<string, [string, string]>()
  const add_edge = (first: string, second: string): void => {
    const pair: [string, string] = indices.get(first)! < indices.get(second)! ? [first, second] : [second, first]
    edge_map.set(`${indices.get(pair[0])}:${indices.get(pair[1])}`, pair)
  }
  for (const child of ancestral_nodes) {
    const parents = graph.nodes.filter(node => ancestral_set.has(node) && graph.parents[child].includes(node))
    for (const parent of parents) add_edge(parent, child)
    for (let first = 0; first < parents.length; first++) {
      for (let second = first + 1; second < parents.length; second++) add_edge(parents[first], parents[second])
    }
  }
  const moralEdges = [...edge_map.values()].sort((first, second) =>
    indices.get(first[0])! - indices.get(second[0])! || indices.get(first[1])! - indices.get(second[1])!)
  const remainingEdges = moralEdges.filter(([first, second]) => !conditioned_set.has(first) && !conditioned_set.has(second))
  const certificate = {
    ancestors: ancestral_nodes,
    moralEdges,
    conditioned: graph.nodes.filter(node => conditioned_set.has(node)),
    remainingEdges,
  }
  if (left_set.size === 0 || right_set.size === 0) return { separated: true, ...certificate }

  const adjacent = new Map(graph.nodes.map(node => [node, new Set<string>()]))
  for (const [first, second] of remainingEdges) {
    adjacent.get(first)!.add(second)
    adjacent.get(second)!.add(first)
  }
  // Multiple ordered sources and ordered neighbours produce a deterministic
  // shortest connecting path in the undirected graph used by the criterion.
  const queue = graph.nodes.filter(node => left_set.has(node))
  const previous = new Map<string, string | undefined>(queue.map(node => [node, undefined]))
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index]
    if (right_set.has(node)) {
      const path: string[] = []
      let current: string | undefined = node
      while (current !== undefined) {
        path.push(current)
        current = previous.get(current)
      }
      return { separated: false, ...certificate, connectingPath: path.reverse() }
    }
    for (const neighbour of graph.nodes) {
      if (adjacent.get(node)!.has(neighbour) && !previous.has(neighbour)) {
        previous.set(neighbour, node)
        queue.push(neighbour)
      }
    }
  }
  return { separated: true, ...certificate }
}
