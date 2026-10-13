import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { create_decision_graph_preview } from './causal_graph_preview'

let dom: JSDOM
let preview: ReturnType<typeof create_decision_graph_preview>
const svg = (): SVGElement | null => preview.element.querySelector('svg')
const nodeNames = (): string[] => [...preview.element.querySelectorAll('[data-node]')].map(node => node.getAttribute('data-node')!).sort()
const edgeNames = (): string[] => [...preview.element.querySelectorAll('[data-edge]')].map(edge => edge.getAttribute('data-edge')!).sort()
beforeEach(() => {
  dom = new JSDOM('<body></body>')
  vi.stubGlobal('document', dom.window.document)
  preview = create_decision_graph_preview()
  dom.window.document.body.append(preview.element)
})
afterEach(() => { dom.window.close(); vi.unstubAllGlobals() })

const graphCases = [
  { label: 'one directed edge', source: 'X -> Y', nodes: ['X', 'Y'], edges: ['X->Y'] },
  { label: 'newline declarations', source: 'Z -> X\nZ -> Y\nX -> Y', nodes: ['Z', 'X', 'Y'], edges: ['Z->X', 'Z->Y', 'X->Y'] },
  { label: 'semicolons and inline/full-line comments', source: 'Z -> X; Z -> Y # a common cause\n# ignored line\nX -> Y', nodes: ['Z', 'X', 'Y'], edges: ['Z->X', 'Z->Y', 'X->Y'] },
  { label: 'Unicode arrows', source: 'A → B; B → C', nodes: ['A', 'B', 'C'], edges: ['A->B', 'B->C'] },
  { label: 'duplicate edges and declarations', source: 'A -> B; A -> B; A; B', nodes: ['A', 'B'], edges: ['A->B'] },
  { label: 'isolated nodes', source: 'Z; A -> B; Q', nodes: ['Z', 'A', 'B', 'Q'], edges: ['A->B'] },
  { label: 'disconnected components', source: 'A -> B\nC -> D\nE', nodes: ['A', 'B', 'C', 'D', 'E'], edges: ['A->B', 'C->D'] },
  { label: 'six isolated nodes', source: 'A; B; C; D; E; F', nodes: ['A', 'B', 'C', 'D', 'E', 'F'], edges: [] },
  { label: 'six-node chain with a long direct edge', source: 'A -> B; B -> C; C -> D; D -> E; E -> F; A -> F', nodes: ['A', 'B', 'C', 'D', 'E', 'F'], edges: ['A->B', 'B->C', 'C->D', 'D->E', 'E->F', 'A->F'] },
  { label: 'maximum-safe integer indices', source: 'A9007199254740991 -> B9007199254740991; C9007199254740991; D9007199254740991; E9007199254740991; F9007199254740991',
    nodes: ['A9007199254740991', 'B9007199254740991', 'C9007199254740991', 'D9007199254740991', 'E9007199254740991', 'F9007199254740991'], edges: ['A9007199254740991->B9007199254740991'] },
]

describe('input causal DAG preview', () => {
  test('provides a named keyboard-reachable region and names the SVG as the input graph', () => {
    expect(preview.element.hidden).toBe(true)
    expect(preview.element.childElementCount).toBe(0)
    expect(preview.element.dataset.testid).toBe('decision-graph-preview')
    expect(preview.element.getAttribute('role')).toBe('region')
    expect(preview.element.getAttribute('aria-label')).toBe('Input graph preview')
    expect(preview.element.tabIndex).toBe(0)
    preview.update('X -> Y')
    expect(preview.element.hidden).toBe(false)
    expect(svg()?.getAttribute('aria-label')).toBe('Input causal DAG')
    expect(svg()?.getAttribute('role')).toBe('img')
    preview.element.focus()
    expect(dom.window.document.activeElement).toBe(preview.element)
  })

  test.each(graphCases)('renders exactly the supplied graph: $label', ({ source, nodes, edges }) => {
    preview.update(source)
    expect(preview.element.hidden).toBe(false)
    expect(svg()).not.toBeNull()
    expect(nodeNames()).toEqual([...nodes].sort())
    expect(edgeNames()).toEqual([...edges].sort())
    for (const group of preview.element.querySelectorAll('[data-node]')) {
      expect(group.querySelector('text')?.textContent).toBe(group.getAttribute('data-node'))
      expect(group.querySelector('ellipse')).not.toBeNull()
    }
    for (const edge of preview.element.querySelectorAll('[data-edge]')) {
      expect(edge.getAttribute('data-cut')).toBe('false')
      expect(edge.querySelector('title')?.textContent).not.toContain('removed')
    }
  })

  test.each([
    ['empty', ''], ['comments only', '  \n# no declarations'], ['self edge', 'A -> A'],
    ['cycle', 'A -> B; B -> A'], ['multi-edge declaration', 'A -> B -> C'],
    ['malformed variable', 'AB -> C'], ['malformed arrow', 'A - B'],
    ['nine nodes', 'A; B; C; D; E; F; G; H; I'], ['unsafe variable index', 'A9007199254740992'],
  ])('hides and clears the previous graph for invalid input: %s', (_label, source) => {
    preview.update('X -> Y')
    expect(svg()).not.toBeNull()
    expect(() => preview.update(source)).not.toThrow()
    expect(preview.element.hidden).toBe(true)
    expect(preview.element.childElementCount).toBe(0)
    expect(svg()).toBeNull()
    expect(nodeNames()).toEqual([])
    expect(edgeNames()).toEqual([])
  })

  test('restores a fresh current DAG after an invalid edit without retaining old edges', () => {
    preview.update('A -> B')
    preview.update('A -> A')
    preview.update('C -> D; E')
    expect(preview.element.hidden).toBe(false)
    expect(nodeNames()).toEqual(['C', 'D', 'E'])
    expect(edgeNames()).toEqual(['C->D'])
  })

  test('reuses the same SVG and avoids DOM mutations when valid source is unchanged', () => {
    const source = 'Z -> X; Z -> Y; X -> Y'
    preview.update(source)
    const original = svg()
    const observer = new dom.window.MutationObserver(() => {})
    observer.observe(preview.element, { attributes: true, childList: true, subtree: true })
    preview.update(source)
    expect(svg()).toBe(original)
    expect(observer.takeRecords()).toEqual([])
    observer.disconnect()
  })

  test('caches invalid source too, without repeating clearing or attribute mutations', () => {
    preview.update('A -> B')
    preview.update('A -> A')
    const observer = new dom.window.MutationObserver(() => {})
    observer.observe(preview.element, { attributes: true, childList: true, subtree: true })
    preview.update('A -> A')
    expect(preview.element.hidden).toBe(true)
    expect(preview.element.childElementCount).toBe(0)
    expect(observer.takeRecords()).toEqual([])
    observer.disconnect()
  })

  test('gives separate previews unique arrowhead marker IDs and matching local references', () => {
    const second = create_decision_graph_preview()
    dom.window.document.body.append(second.element)
    preview.update('A -> B; B -> C')
    second.update('X -> Y; Y -> Z')
    const firstMarker = preview.element.querySelector('marker')!
    const secondMarker = second.element.querySelector('marker')!
    expect(firstMarker.id).toBeTruthy()
    expect(secondMarker.id).toBeTruthy()
    expect(firstMarker.id).not.toBe(secondMarker.id)
    for (const [element, marker] of [[preview.element, firstMarker], [second.element, secondMarker]]) {
      for (const edge of element.querySelectorAll('[data-edge]')) {
        expect(edge.getAttribute('marker-end')).toBe(`url(#${marker.id})`)
      }
    }
  })

  test.each(graphCases)('has finite cropped bounds containing ellipses and all quadratic control points: $label', ({ source }) => {
    preview.update(source)
    const image = svg()!
    const viewBox = image.getAttribute('viewBox')!.trim().split(/\s+/).map(Number)
    expect(viewBox).toHaveLength(4)
    expect(viewBox.every(Number.isFinite)).toBe(true)
    const [left, top, width, height] = viewBox
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
    const right = left + width, bottom = top + height
    const inside = (x: number, y: number, margin: number): void => {
      expect(x - margin).toBeGreaterThanOrEqual(left - 1e-7)
      expect(x + margin).toBeLessThanOrEqual(right + 1e-7)
      expect(y - margin).toBeGreaterThanOrEqual(top - 1e-7)
      expect(y + margin).toBeLessThanOrEqual(bottom + 1e-7)
    }
    for (const node of image.querySelectorAll('ellipse')) {
      const cx = Number(node.getAttribute('cx')), cy = Number(node.getAttribute('cy'))
      const rx = Number(node.getAttribute('rx')), ry = Number(node.getAttribute('ry'))
      expect([cx, cy, rx, ry].every(Number.isFinite)).toBe(true)
      inside(cx - rx, cy - ry, 1)
      inside(cx + rx, cy + ry, 1)
    }
    for (const edge of image.querySelectorAll('[data-edge]')) {
      const path = edge.getAttribute('d')!
      expect(path).toMatch(/^M .+ Q /)
      const points = (path.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(Number)
      expect(points).toHaveLength(6)
      expect(points.every(Number.isFinite)).toBe(true)
      for (let index = 0; index < points.length; index += 2) inside(points[index], points[index + 1], 8)
    }
  })
})
