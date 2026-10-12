import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { render_causal_constraint, render_causal_evaluation, render_causal_probability } from './causal_to_html'

let dom: JSDOM
const graph = 'Z -> X; Z -> Y; X -> Y'

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  vi.stubGlobal('document', dom.window.document)
})
afterEach(() => {
  dom.window.close()
  vi.unstubAllGlobals()
})

describe('causal formula previews', () => {
  test.each([
    ['Pr(Y | do(X))', 'do(X)'],
    ['Pr(Y | do(~X))', 'do(~X)'],
    ['Pr(Y | do(X, ~Z))', 'do(X,~Z)'],
    ['Pr(Y | do(X=1, Z=0))', 'do(X=1,Z=0)'],
    ['Pr(Y | do(X, Z=0))', 'do(X,Z=0)'],
  ])('renders %s with its Boolean or numeric assignment spelling', (source, intervention) => {
    const math = render_causal_probability(graph, source)
    expect(math.localName).toBe('math')
    expect(math.querySelector('.causal-intervention')?.textContent).toBe(intervention)
    expect(math.getAttribute('aria-label')).toBe(source)
    expect(math.textContent).not.toContain('CausalQuery')
  })

  test('separates an intervention from observational conditioning', () => {
    const math = render_causal_probability(graph, 'Pr(Y | do(X), Z & ~X)')
    expect(math.querySelector('.causal-intervention')?.textContent).toBe('do(X)')
    expect(math.querySelector('.causal-observation')?.textContent).toBe('Z&~X')
    expect(math.textContent).toBe('Pr(Y|do(X),Z&~X)')
    expect(math.querySelectorAll('.causal-intervention')).toHaveLength(1)
    // In particular this valid preview does not claim the condition is defined.
    expect(math.textContent).not.toMatch(/defined|true|satisfied/)
  })

  test('renders ordinary probabilities, compound events and indexed variables', () => {
    const math = render_causal_constraint('X1; Y; Z', 'Pr(X1 & ~Y | Z) = Pr(X1)')
    expect(math.textContent).toBe('Pr(X1&~Y|Z)=Pr(X1)')
    expect(math.querySelectorAll('.causal-probability')).toHaveLength(2)
    expect(math.querySelectorAll('.causal-intervention')).toHaveLength(0)
  })

  test('preserves exact decimal and integer spelling in arithmetic previews', () => {
    const source = '0.1000000000000000000001 * Pr(Y|do(X)) + 9007199254740993 = 1.00000/2'
    const math = render_causal_constraint(graph, source)
    const literals = Array.from(math.querySelectorAll('mi'), node => node.textContent)
    expect(literals).toContain('0.1000000000000000000001')
    expect(literals).toContain('9007199254740993')
    expect(literals).toContain('1.00000')
    expect(math.querySelectorAll('mfrac')).toHaveLength(1)
    expect(math.textContent).not.toContain('CausalQuery')
  })

  test('renders logical combinations as one constraint with every causal query replaced', () => {
    const source = '(Pr(Y|do(X)) > Pr(Y|do(~X))) & (Pr(Y|X) < Pr(Y|~X))'
    const math = render_causal_constraint(graph, source)
    expect(math.querySelectorAll('.causal-probability')).toHaveLength(4)
    expect(math.querySelectorAll('.causal-intervention')).toHaveLength(2)
    expect(math.textContent).toContain('&')
    expect(math.textContent).not.toContain('CausalQuery')
    expect(math.getAttribute('aria-label')).toBe(source)
  })

  test('keeps free user variables intact alongside probability placeholders', () => {
    const math = render_causal_constraint(graph, 'Rate * Pr(Y|do(X)) = Alpha + Pr(Y)')
    expect(Array.from(math.querySelectorAll('mi'), node => node.textContent)).toContain('Rate')
    expect(Array.from(math.querySelectorAll('mi'), node => node.textContent)).toContain('Alpha')
    expect(math.querySelectorAll('.causal-probability')).toHaveLength(2)
  })

  test('replaces query identifiers beyond the first alphabetic suffix without leaking them', () => {
    const source = `${Array.from({ length: 30 }, () => 'Pr(Y|do(X))').join(' + ')} = 15`
    const math = render_causal_constraint(graph, source)
    expect(math.querySelectorAll('.causal-probability')).toHaveLength(30)
    expect(math.querySelectorAll('.causal-intervention')).toHaveLength(30)
    expect(math.textContent).not.toContain('CausalQuery')
  })

  test.each(['P(Y | do(X))', 'p(Y | do(X))'])('accepts the existing probability alias %s', source => {
    const math = render_causal_probability(graph, source)
    expect(math.textContent).toBe('Pr(Y|do(X))')
    expect(math.getAttribute('aria-label')).toBe(source)
  })

  test.each([
    'CausalQueryA = 0',
    'RatePr(Y) = 0',
    'Pr(Y)Pr(X) = 0',
  ])('rejects reserved or merged query namespace input: %s', source => {
    expect(() => render_causal_constraint(graph, source)).toThrow()
  })

  test('uses only MathML elements and text nodes, with no markup injection', () => {
    const math = render_causal_constraint(graph, 'Pr(Y|do(~X),Z) < 1/2')
    for (const node of [math, ...Array.from(math.querySelectorAll('*'))]) {
      expect(node.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML')
      expect(node.getAttributeNames().some(name => name.startsWith('on'))).toBe(false)
    }
    expect(() => render_causal_constraint(graph, 'Pr(Y) = <img src=x onerror=alert(1)>')).toThrow()
    expect(dom.window.document.querySelector('img')).toBeNull()
  })

  test('reports authoritative graph and causal syntax errors', () => {
    expect(() => render_causal_constraint('X -> Y; Y -> X', 'Pr(Y) = 1')).toThrow(/acyclic/)
    expect(() => render_causal_constraint('X', 'Pr(Y) = 1')).toThrow(/not declared/)
    expect(() => render_causal_constraint(graph, 'Pr(Y|do(X & Z)) = 1')).toThrow(/literal assignments/)
    expect(() => render_causal_constraint(graph, 'Pr(Y|do(X,~X)) = 1')).toThrow(/Repeated/)
  })

  test('allows blank and comment lines around a single constraint', () => {
    const math = render_causal_constraint(graph, '\n# comment\nPr(Y|do(X)) = 1/2 # tail\n')
    expect(math.getAttribute('aria-label')).toBe('Pr(Y|do(X)) = 1/2')
    expect(math.querySelectorAll('.causal-probability')).toHaveLength(1)
  })

  test.each(['', '# comment', 'Pr(Y)=1\nPr(X)=1'])('requires one preview constraint: %s', source => {
    expect(() => render_causal_constraint(graph, source)).toThrow(/exactly one/)
  })

  test.each(['Pr(Y) + 1', 'Pr(Y) = 0', 'Pr(Y)\nPr(X)', 'Pr(Y) # comment', 'Rate'])('requires one probability term: %s', source => {
    expect(() => render_causal_probability(graph, source)).toThrow()
  })

  test('does not round or certify a numerically undefined input probability', () => {
    const math = render_causal_probability('X', 'Pr(X|~X)')
    expect(math.textContent).toBe('Pr(X|~X)')
    expect(math.querySelector('.causal-observation')?.textContent).toBe('~X')
  })
})

describe('causal evaluation previews', () => {
  test('renders arithmetic with new mixed and simultaneous intervention queries', () => {
    const source = 'Pr(Y | do(X, ~Z), X) + 2*Pr(Y | do(X=0, Z=1))/Pr(X)'
    const math = render_causal_evaluation(graph, source)
    expect(math.localName).toBe('math')
    expect(math.getAttribute('aria-label')).toBe(source)
    expect(math.querySelectorAll('.causal-probability')).toHaveLength(3)
    expect(Array.from(math.querySelectorAll('.causal-intervention'), row => row.textContent)).toEqual(['do(X,~Z)', 'do(X=0,Z=1)'])
    expect(math.querySelector('.causal-observation')?.textContent).toBe('X')
    expect(math.querySelectorAll('mfrac')).toHaveLength(1)
    expect(math.textContent).not.toContain('CausalQuery')
  })

  test('keeps exact arithmetic literal spelling and user variables', () => {
    const source = '0.1000000000000000000001*Rate + Alpha^2 - 9007199254740993/1.00000'
    const math = render_causal_evaluation(graph, source)
    const identifiers = Array.from(math.querySelectorAll('mi'), node => node.textContent)
    expect(identifiers).toContain('0.1000000000000000000001')
    expect(identifiers).toContain('9007199254740993')
    expect(identifiers).toContain('1.00000')
    expect(identifiers).toContain('Rate')
    expect(identifiers).toContain('Alpha')
    expect(math.querySelectorAll('msup')).toHaveLength(1)
    expect(math.querySelectorAll('mfrac')).toHaveLength(1)
    expect(math.getAttribute('aria-label')).toBe(source)
  })

  test('renders compound constraints with the existing causal constraint adapter', () => {
    const source = '(Pr(Y|do(X)) = 1/2) v ~(Pr(Y|do(~X),Z) >= Rate)'
    const math = render_causal_evaluation(graph, source)
    const existing = render_causal_constraint(graph, source)
    expect(math.outerHTML).toBe(existing.outerHTML)
    expect(math.querySelectorAll('.causal-probability')).toHaveLength(2)
    expect(math.textContent).not.toContain('CausalQuery')
  })

  test.each(['1.00000', 'Rate', 'Pr(Y|do(X))'])('allows the real expression %s without requiring a comparison', source => {
    const math = render_causal_evaluation(graph, source)
    expect(math.getAttribute('aria-label')).toBe(source)
    expect(math.textContent).not.toContain('=0')
    expect(math.textContent).not.toContain('CausalQuery')
  })

  test.each([
    '# heading\n\nPr(Y|do(X)) + 1/2 # trailing comment\n',
    '# heading\n\nPr(Y|do(X)) = 1/2 # trailing comment\n',
  ])('ignores comments for rendering while retaining the submitted source label', source => {
    const math = render_causal_evaluation(graph, source)
    expect(math.getAttribute('aria-label')).toBe(source.trim())
    expect(math.querySelectorAll('.causal-probability')).toHaveLength(1)
    expect(math.textContent).not.toMatch(/heading|trailing comment|CausalQuery/)
  })

  test('replaces query identifiers beyond the first alphabetic suffix in real expressions', () => {
    const source = Array.from({ length: 30 }, () => 'Pr(Y|do(X))').join(' + ')
    const math = render_causal_evaluation(graph, source)
    expect(math.querySelectorAll('.causal-probability')).toHaveLength(30)
    expect(math.textContent).not.toContain('CausalQuery')
  })

  test.each([
    '', '# comment only', 'Pr(Y)\nPr(X)', 'Pr(Y)=1\nPr(X)=1',
    'Pr(Y); Pr(X)', 'Pr(Y|do(X & Z))', 'CausalQueryA + 1',
    'Pr(Y)Pr(X)', '<img src=x onerror=alert(1)>', 'Pr(Q)',
  ])('rejects unsafe, multiple, or invalid evaluation input %j', source => {
    expect(() => render_causal_evaluation(graph, source)).toThrow()
    expect(dom.window.document.querySelector('img')).toBeNull()
  })

  test('undefined conditioning is still syntactically renderable without a numerical verdict', () => {
    const math = render_causal_evaluation('X', 'Pr(X|~X) + Pr(X|do(~X),X)')
    expect(math.querySelectorAll('.causal-probability')).toHaveLength(2)
    expect(math.querySelector('.causal-intervention')?.textContent).toBe('do(~X)')
    expect(Array.from(math.querySelectorAll('.causal-observation'), row => row.textContent)).toEqual(['~X', 'X'])
    expect(math.textContent).not.toMatch(/undefined|defined|true|false|CausalQuery/)
  })

  test('the real expression DOM consists only of safe MathML', () => {
    const math = render_causal_evaluation(graph, 'Pr(Y|do(~X),Z) + Rate/2')
    for (const node of [math, ...Array.from(math.querySelectorAll('*'))]) {
      expect(node.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML')
      expect(node.getAttributeNames().some(name => name.startsWith('on'))).toBe(false)
    }
  })
})
