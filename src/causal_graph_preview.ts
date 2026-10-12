import { parse_causal_graph } from './causal_syntax'
import { render_causal_graph } from './do_graph_view'
import { tel } from './el'

/** Crop layout whitespace without clipping nodes, arrows or their control hulls. */
const crop_graph = (svg: SVGElement): void => {
  const xs: number[] = [], ys: number[] = []
  for (const ellipse of svg.querySelectorAll('ellipse')) {
    const cx = Number(ellipse.getAttribute('cx')), cy = Number(ellipse.getAttribute('cy'))
    const rx = Number(ellipse.getAttribute('rx')), ry = Number(ellipse.getAttribute('ry'))
    xs.push(cx - rx, cx + rx); ys.push(cy - ry, cy + ry)
  }
  for (const edge of svg.querySelectorAll('[data-edge]')) {
    const values = (edge.getAttribute('d')?.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) ?? []).map(Number)
    for (let index = 0; index < values.length; index += 2) { xs.push(values[index]); ys.push(values[index + 1]) }
  }
  const margin = 8
  const x = Math.min(...xs) - margin, y = Math.min(...ys) - margin
  const width = Math.max(...xs) - x + margin, height = Math.max(...ys) - y + margin
  svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
  svg.setAttribute('width', String(width)); svg.setAttribute('height', String(height))
}

/** Graph-only preview: probability syntax and numerical support do not gate it. */
export const create_decision_graph_preview = (): { element: HTMLElement, update(source: string): void } => {
  const element = tel('decision-graph-preview', 'div', {
    class: 'decision-graph-preview', role: 'region', tabindex: '0', 'aria-label': 'Input graph preview',
  })
  element.hidden = true
  let current: string | undefined
  return { element, update(source) {
    if (source === current) return
    current = source; element.replaceChildren(); element.hidden = true
    let graph
    try { graph = parse_causal_graph(source) } catch { return }
    const svg = render_causal_graph(graph, { x: [], y: [], z: [], w: [] }, graph, [], { compact: true })
    svg.setAttribute('aria-label', 'Input causal DAG')
    crop_graph(svg); element.append(svg); element.hidden = false
  } }
}
