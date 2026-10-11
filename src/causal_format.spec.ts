import { describe, expect, it } from 'vitest'
import { format_exact_value } from './causal_format'

describe('causal exact value display', () => {
  it('preserves integer and rational numerals beyond JavaScript precision', () => {
    expect(format_exact_value('9007199254740993.0')).toBe('9007199254740993')
    expect(format_exact_value('(/ 9007199254740993.0 18014398509481984.0)')).toBe('9007199254740993/18014398509481984')
  })
  it('formats signs without approximating algebraic values', () => {
    expect(format_exact_value('(- (/ 1.0 3.0))')).toBe('-1/3')
    const root = '(root-obj (+ (^ x 2) (- 2)) 2)'
    expect(format_exact_value(root)).toBe(root)
  })
})
