import type { CausalGraph } from './causal_syntax'

const NS = 'http://www.w3.org/2000/svg'
let diagramId = 0
const svgNode = (name: string, attrs: Record<string, string>, text?: string): SVGElement => {
  const node = document.createElementNS(NS, name)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
  if (text !== undefined) node.textContent = text
  return node
}

/** Positions come from the original DAG so cuts remain visually comparable. */
export const render_causal_graph = (
  graph: CausalGraph,
  roles: { x: string[], y: string[], z: string[], w: string[] },
  layoutGraph: CausalGraph = graph,
  highlightedEdges: [string, string][] = [],
  options: { compact?: boolean } = {},
): SVGElement => {
  const compact = options.compact === true
  const radiusY = compact ? 18 : 23
  const ranks = new Map<string, number>()
  const rank = (node: string): number => {
    const existing = ranks.get(node)
    if (existing !== undefined) return existing
    const parents = layoutGraph.parents[node] ?? []
    const value = parents.length ? 1 + Math.max(...parents.map(rank)) : 0
    ranks.set(node, value)
    return value
  }
  layoutGraph.nodes.forEach(rank)
  const maximum = Math.max(...ranks.values())
  const layers = Array.from({ length: maximum + 1 }, (_, level) => layoutGraph.nodes.filter(node => ranks.get(node) === level))
  const labelWidths = new Map(graph.nodes.map(node => [node, Math.max(compact ? 42 : 46, node.length * 8.6 + 22)]))
  const widest = Math.max(...labelWidths.values())
  const spacing = widest + (compact ? 64 : 95)
  const padding = widest / 2 + (compact ? 20 : 30)
  const spans = layoutGraph.nodes.flatMap(child => (layoutGraph.parents[child] ?? []).map(parent => ranks.get(child)! - ranks.get(parent)!))
  const arcPadding = Math.max(0, Math.max(1, ...spans) - 1) * 30
  const baseHeight = Math.max(compact ? 112 : 180, Math.max(...layers.map(layer => layer.length)) * (compact ? 56 : 88) + (compact ? 28 : 40))
  const height = baseHeight + 2 * arcPadding
  const width = Math.max(320, (layers.length - 1) * spacing + 2 * padding)
  const positions = new Map<string, { x: number, y: number }>()
  layers.forEach((layer, level) => layer.forEach((node, index) => positions.set(node, {
    x: padding + level * spacing, y: arcPadding + (index + 1) * baseHeight / (layer.length + 1),
  })))
  const id = `do-arrow-${diagramId++}`
  const svg = svgNode('svg', { viewBox: `0 0 ${width} ${height}`, width: String(width), height: String(height), role: 'img', 'aria-label': 'Directed causal graph', class: 'do-graph-svg' })
  const defs = svgNode('defs', {})
  const marker = svgNode('marker', { id, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' })
  marker.append(svgNode('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'context-stroke' }))
  defs.append(marker); svg.append(defs)
  for (const child of graph.nodes) {
    for (const parent of graph.parents[child] ?? []) {
      const from = positions.get(parent)!, to = positions.get(child)!
      const span = ranks.get(child)! - ranks.get(parent)!
      const control = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - Math.max(0, span - 1) * 30 }
      const startAngle = Math.atan2(control.y - from.y, control.x - from.x)
      const endAngle = Math.atan2(control.y - to.y, control.x - to.x)
      const radius = (node: string, angle: number) => 1 / Math.sqrt(Math.cos(angle) ** 2 / (labelWidths.get(node)! / 2) ** 2 + Math.sin(angle) ** 2 / radiusY ** 2)
      const startRadius = radius(parent, startAngle)
      const endRadius = radius(child, endAngle) + 4
      const x1 = from.x + startRadius * Math.cos(startAngle), y1 = from.y + startRadius * Math.sin(startAngle)
      const x2 = to.x + endRadius * Math.cos(endAngle), y2 = to.y + endRadius * Math.sin(endAngle)
      const cut = highlightedEdges.some(([a, b]) => a === parent && b === child)
      const path = svgNode('path', {
        d: `M ${x1} ${y1} Q ${control.x} ${control.y} ${x2} ${y2}`, fill: 'none',
        stroke: cut ? '#b23b3b' : '#34495e', 'stroke-width': '2', 'stroke-dasharray': cut ? '7 4' : '',
        'marker-end': `url(#${id})`, 'data-edge': `${parent}->${child}`, 'data-cut': String(cut),
      })
      path.append(svgNode('title', {}, `${parent} → ${child}${cut ? ' (removed for the rule test)' : ''}`))
      svg.append(path)
    }
  }
  for (const node of graph.nodes) {
    const point = positions.get(node)!
    const fill = roles.y.includes(node) ? '#d8ecff' : roles.z.includes(node) ? '#fff0b5' : roles.x.includes(node) ? '#eadcff' : roles.w.includes(node) ? '#d7f0df' : '#eef0f2'
    const group = svgNode('g', { 'data-node': node })
    group.append(svgNode('title', {}, node))
    group.append(svgNode('ellipse', { cx: String(point.x), cy: String(point.y), rx: String(labelWidths.get(node)! / 2), ry: String(radiusY), fill, stroke: '#34495e', 'stroke-width': '1.5' }))
    group.append(svgNode('text', { x: String(point.x), y: String(point.y + 5), 'text-anchor': 'middle', 'font-size': compact ? '14' : '15', fill: '#1e2527' }, node))
    svg.append(group)
  }
  return svg
}
