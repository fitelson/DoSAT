import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import type { DecisionWitness } from './causal_decision_solver'
import { render_decision_witness } from './causal_decision_results'

let dom: JSDOM
beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  vi.stubGlobal('document', dom.window.document)
})
afterEach(() => { dom.window.close(); vi.unstubAllGlobals() })

const witness = (): DecisionWitness => ({
  mechanisms: [
    { node: 'X', parents: {}, parameter: 'CausalP1', value: '(/ 1.0 2.0)' },
    { node: 'Y', parents: { X: true }, parameter: 'CausalP2', value: '(/ 1.0 2.0)' },
    { node: 'Y', parents: { X: false }, parameter: 'CausalP3', value: '(/ 1.0 4.0)' },
  ],
  queries: [{ source: 'Pr(Y | do(X))', defined: true, value: '(/ 1.0 2.0)' }],
  freeParameters: [],
  distributions: [
    { label: 'do(X=1)', intervention: [{ variable: 'X', value: true }], rows: [
      { assignment: { X: true, Y: true }, value: '(/ 1.0 2.0)' },
      { assignment: { X: false, Y: false }, value: '0.0' },
      { assignment: { X: true, Y: false }, value: '(/ 1.0 2.0)' },
      { assignment: { X: false, Y: true }, value: '0.0' },
    ] },
    { label: 'Observational', intervention: [], rows: [
      { assignment: { Y: false, X: false }, value: '(/ 3.0 8.0)' },
      { assignment: { X: false, Y: true }, value: '(/ 1.0 8.0)' },
      { assignment: { X: true, Y: false }, value: '(/ 1.0 4.0)' },
      { assignment: { Y: true, X: true }, value: '(/ 1.0 4.0)' },
    ] },
  ],
})
const table = (output: HTMLElement, id: string): HTMLTableElement => {
  const found = output.querySelector<HTMLTableElement>(`[data-testid="${id}"]`)
  if (!found) throw new Error(`Missing table ${id}`)
  return found
}
const rows = (element: HTMLTableElement): string[][] => [...element.querySelectorAll('tbody tr')].map(row => [...row.querySelectorAll('td')].map(cell => cell.textContent ?? ''))

describe('exact decision witness display', () => {
  test('keeps observational rows visible and pairs regime values with their assignments', () => {
    const output = render_decision_witness(witness(), false, 'X -> Y', '')
    const distribution = table(output, 'decision-distribution-table')
    expect(distribution.closest('details')).toBeNull()
    expect([...distribution.querySelectorAll('thead th')].map(cell => cell.textContent)).toEqual(['X', 'Y', 'Observational', 'do(X=1)'])
    expect(rows(distribution)).toEqual([
      ['⊥', '⊥', '3/8', '0'], ['⊥', '⊤', '1/8', '0'], ['⊤', '⊥', '1/4', '1/2'], ['⊤', '⊤', '1/4', '1/2'],
    ])
    expect(output.querySelectorAll('[data-testid="decision-distribution-table"]')).toHaveLength(1)
    expect(output.textContent).not.toContain('CausalP1')
  })

  test('places the submitted conclusion next to rendered probability terms and exact witness values', () => {
    const output = render_decision_witness(witness(), true, 'X -> Y', 'Pr(Y | do(X)) = 3/4')
    const section = output.querySelector('.decision-query-section')!
    const conclusion = section.querySelector('[data-testid="decision-submitted-conclusion"]')!
    expect(conclusion.querySelector('math')).not.toBeNull()
    expect(conclusion.textContent).toContain('3')
    expect(conclusion.textContent).toContain('4')
    const query = table(output, 'decision-query-table')
    expect(query.querySelector('tbody math')).not.toBeNull()
    expect(rows(query)[0][1]).toBe('1/2')
    expect(query.closest('.decision-query-section')).toBe(section)
    expect(output.textContent).toContain('fails the conclusion')
    expect(output.textContent).toContain('required definedness conditions')
    expect(output.textContent).not.toContain('CausalQuery')
  })

  test('retains undefined terms and arbitrary-size exact rational values', () => {
    const snapshot = witness()
    snapshot.queries = [
      { source: 'Pr(Y | do(~X), X)', defined: false },
      { source: 'Pr(X)', defined: true, value: '(/ 9007199254740993.0 18014398509481987.0)' },
    ]
    const output = render_decision_witness(snapshot, true, 'X -> Y', 'Pr(Y | do(~X), X)=1')
    expect(rows(table(output, 'decision-query-table')).map(row => row[1])).toEqual(['undefined (zero denominator)', '9007199254740993/18014398509481987'])
  })

  test('shows compound conclusions without adding a compound numerical truth evaluator', () => {
    const conclusion = 'Pr(Y | do(X)) = 3/4 v Pr(Y | do(X)) = 0'
    const output = render_decision_witness(witness(), true, 'X -> Y', conclusion)
    expect(output.querySelector('[data-testid="decision-submitted-conclusion"] math')).not.toBeNull()
    expect(output.textContent).not.toContain('Truth value')
    expect(output.textContent).not.toContain('CausalQuery')
    expect(rows(table(output, 'decision-query-table'))).toHaveLength(1)
  })

  test('makes the submitted conclusion formula a named keyboard-accessible scroll region', () => {
    const conclusion = '(Pr(Y | do(X)) = 3/4 v Pr(Y | do(X)) = 0) & Pr(Y | do(X)) > 3/4'
    const output = render_decision_witness(witness(), true, 'X -> Y', conclusion)
    const region = output.querySelector<HTMLElement>('[role="region"][aria-label="Submitted conclusion formula"]')!
    expect(region).not.toBeNull()
    expect(region.tabIndex).toBe(0)
    expect(region.classList.contains('decision-rendered-formula')).toBe(true)
    expect(region.querySelector('math')).not.toBeNull()
    expect(region.closest('[data-testid="decision-submitted-conclusion"]')).not.toBeNull()
    expect(rows(table(output, 'decision-query-table'))[0][1]).toBe('1/2')
    expect(rows(table(output, 'decision-distribution-table'))).toEqual([
      ['⊥', '⊥', '3/8', '0'], ['⊥', '⊤', '1/8', '0'], ['⊤', '⊥', '1/4', '1/2'], ['⊤', '⊤', '1/4', '1/2'],
    ])
  })

  test('keeps free real assignments visible while allowing mechanism details to collapse', () => {
    const snapshot = witness()
    snapshot.freeParameters = [
      { variable: 'a', value: '(- (/ 1.0 3.0))' },
      { variable: 'b', value: '(root-obj (+ (^ x 2) (- 2)) 2)' },
    ]
    const output = render_decision_witness(snapshot, false, 'X -> Y', '')
    const assignments = table(output, 'decision-real-table')
    expect(assignments.closest('details')).toBeNull()
    expect(rows(assignments)).toEqual([['a', '-1/3'], ['b', '(root-obj (+ (^ x 2) (- 2)) 2)']])
    const mechanisms = table(output, 'decision-mechanism-table')
    expect(mechanisms.closest('details')?.open).toBe(false)
    expect(rows(mechanisms)).toEqual([['X', 'none', '1/2'], ['Y', 'X=⊤', '1/2'], ['Y', 'X=⊥', '1/4']])
  })

  test('makes wide regime tables keyboard reachable and preserves each intervention label', () => {
    const snapshot = witness()
    snapshot.distributions.push({
      label: 'do(X=0, Y=1)', intervention: [{ variable: 'X', value: false }, { variable: 'Y', value: true }],
      rows: [
        { assignment: { X: true, Y: true }, value: '0' }, { assignment: { X: true, Y: false }, value: '0' },
        { assignment: { X: false, Y: true }, value: '1' }, { assignment: { X: false, Y: false }, value: '0' },
      ],
    })
    const output = render_decision_witness(snapshot, false, 'X -> Y', '')
    const distribution = table(output, 'decision-distribution-table')
    const scroller = distribution.parentElement!
    expect(scroller.classList.contains('causal-table-scroll')).toBe(true)
    expect(scroller.tabIndex).toBe(0)
    expect(scroller.getAttribute('role')).toBe('region')
    expect(scroller.getAttribute('aria-label')).toContain('observational and intervention')
    expect([...distribution.querySelectorAll('thead th')].map(cell => cell.textContent)).toEqual(['X', 'Y', 'Observational', 'do(X=1)', 'do(X=0, Y=1)'])
    expect(rows(distribution).map(row => row[4])).toEqual(['0', '1', '0', '0'])
  })

  test('preserves an unrenderable source safely instead of discarding an exact result', () => {
    const snapshot = witness()
    snapshot.queries = [{ source: '<img src=x onerror=alert(1)>', defined: true, value: '1.0' }]
    const output = render_decision_witness(snapshot, true, 'X -> Y', '<script>bad()</script>')
    expect(output.querySelector('img')).toBeNull()
    expect(output.querySelector('script')).toBeNull()
    expect(output.textContent).toContain('<script>bad()</script>')
    expect(rows(table(output, 'decision-query-table'))).toEqual([['<img src=x onerror=alert(1)>', '1']])
  })
})
