import { describe, expect, test } from 'vitest'
import { parse_causal_evaluation } from './causal_evaluation_syntax'

describe('single causal evaluation syntax', () => {
  test('real expressions preserve exact decimal spelling and new causal queries', () => {
    const parsed = parse_causal_evaluation('X -> Y', 'Pr(Y | do(~X)) + 0.10000000000000001')
    expect(parsed.kind).toBe('real')
    if (parsed.kind !== 'real' || parsed.expression.tag !== 'plus') throw new Error('Expected a real sum.')
    expect(parsed.expression.right).toMatchObject({ tag: 'literal', source: '0.10000000000000001' })
    expect(Object.values(parsed.document.probabilities)[0]).toMatchObject({ source: 'Pr(Y | do(~X))', intervention: [{ variable: 'X', value: false }] })
  })
  test('compound guarded constraints retain the authoritative document', () => {
    const parsed = parse_causal_evaluation('X -> Y', '(Pr(Y | X) = 1) v (Pr(X) = 0)')
    expect(parsed.kind).toBe('constraint')
    expect(parsed.document.constraints[0].tag).toBe('disjunction')
  })
  test('blank/comment lines may surround exactly one active input', () => {
    expect(parse_causal_evaluation('X', '# header\n\nPr(X) # tail\n').kind).toBe('real')
    expect(parse_causal_evaluation('X', '\n# header\nPr(X)=1\n').kind).toBe('constraint')
  })
  test.each(['', '# comment only', 'Pr(X)\nPr(X)', 'Pr(X)=0\nPr(X)=1'])('rejects non-single input %s', source => {
    expect(() => parse_causal_evaluation('X', source)).toThrow(/exactly one/)
  })
  test('raw length limits precede comment removal', () => {
    expect(() => parse_causal_evaluation('X', '#'+ ' '.repeat(50_001))).toThrow(/limited/)
  })
  test.each(['Pr(Z)', 'Pr(Y | do(X, ~X))', 'Pr(Y) garbage', 'Pr(Y)^('])('invalid evaluation input is rejected', source => {
    expect(() => parse_causal_evaluation('X -> Y', source)).toThrow()
  })
})

test.each(['Pr(Y)) + (Pr(X)', 'a) * (b', '1) / (0'])('rejects unbalanced original parentheses before wrapping: %s', source => {
  expect(() => parse_causal_evaluation('X; Y', source)).toThrow(/well-formed|parentheses/)
})
