import { describe, expect, test } from 'vitest'
import {
  compile_decision_problem, DECISION_LIMITS, is_compiled_decision_problem,
  parse_decision_input, type DecisionProblemInput,
} from './causal_decision'
import { CAUSAL_LIMITS } from './causal_syntax'
import { MAX_ABS_SOLVER_EXPONENT } from './pr_sat'
import { s_to_string } from './s'

const input = (patch: Partial<DecisionProblemInput> = {}): DecisionProblemInput => ({
  graph: 'X', premises: '', regular: false, task: 'satisfiability', ...patch,
})
const compile = (premises: string, patch: Partial<DecisionProblemInput> = {}) => compile_decision_problem(input({ premises, ...patch }))
const entail = (conclusion: string, premises = '', patch: Partial<DecisionProblemInput> = {}) =>
  compile_decision_problem(input({ task: 'entailment', premises, conclusion, ...patch }))
const assert_polynomial = (smt: string): void => {
  expect(smt).toMatch(/^\(set-logic QF_NRA\)/)
  expect(smt).not.toMatch(/\((?:\/|\^|pow|div)\s/)
  expect(smt).not.toMatch(/\b(?:forall|exists)\b/)
}
const final_line = (smt: string): string => smt.split('\n').slice(-1)[0]

describe('causal decision input boundary', () => {
  test('empty premises mean the graph theory alone, including all mechanisms', () => {
    const compiled = compile('', { graph: 'X -> Y' })
    expect(compiled.premiseConstraints).toEqual([])
    expect(compiled.causal.mechanisms).toHaveLength(3)
    expect(compiled.causal.constraints).toHaveLength(6)
    expect(compiled.premisesSmt.match(/\(assert /g)).toHaveLength(6)
    expect(compiled.counterexampleSmt).toBeUndefined()
    assert_polynomial(compiled.premisesSmt)
  })

  test('regularity changes only graph bounds', () => {
    expect(compile('').premisesSmt).toContain('(assert (>= p_X_root 0))')
    const regular = compile('', { regular: true })
    expect(regular.premisesSmt).toContain('(assert (> p_X_root 0))')
    expect(regular.premisesSmt).toContain('(assert (< p_X_root 1))')
  })

  test('accessor-backed input uses exactly the regularity that passed validation', () => {
    let reads = 0
    const supplied = { ...input(), get regular() { return ++reads === 1 } }
    const compiled = compile_decision_problem(supplied)
    expect(reads).toBe(1)
    expect(compiled.premisesSmt).toContain('(assert (> p_X_root 0))')
  })

  test('joint parsing shares graph, probability registry and conclusion-only free reals', () => {
    const compiled = entail('Pr(Y | do(X=1)) = t', 'Pr(Y | X) = t', { graph: 'X -> Y' })
    expect(compiled.causal.queries.map(query => query.source)).toEqual(['Pr(Y | X)', 'Pr(Y | do(X=1))'])
    expect(compiled.causal.variables.filter(name => name === 't')).toHaveLength(1)
    expect(compiled.premiseConstraints).toHaveLength(1)
    expect(compiled.causal.constraints).toHaveLength(8)
    expect(compiled.causal.distributions.map(distribution => distribution.label)).toEqual(['Observational', 'do(X=1)'])
    assert_polynomial(compiled.premisesSmt)
    assert_polynomial(compiled.counterexampleSmt!)
  })

  test.each([
    ['Pr(Y | do(X))=1/2', 'Pr(Y | do(X=1))=1/2'],
    ['Pr(Y | do(~X))=1/2', 'Pr(Y | do(X=0))=1/2'],
    ['Pr(Y | do(X, ~Z))=1/2', 'Pr(Y | do(X=1, Z=0))=1/2'],
    ['Pr(Y | do(X=1, ~Z), ~Z)=1/2', 'Pr(Y | do(X=1, Z=0), ~Z)=1/2'],
  ])('literal interventions have byte-identical polynomial SAT encodings: %s', (shorthand, numeric) => {
    const abbreviated = compile(shorthand, { graph: 'X -> Y; Z -> Y' })
    const explicit = compile(numeric, { graph: 'X -> Y; Z -> Y' })
    expect(abbreviated.premisesSmt).toBe(explicit.premisesSmt)
    expect(abbreviated.causal.distributions).toEqual(explicit.causal.distributions)
    expect(abbreviated.causal.queries[0].expression).toEqual(explicit.causal.queries[0].expression)
    expect(abbreviated.causal.queries[0].source).not.toBe(explicit.causal.queries[0].source)
  })

  test('literal interventions have byte-identical joint entailment and counterexample encodings', () => {
    const abbreviated = entail('Pr(Y | do(X1, ~Z))=Pr(Y | X1 & ~Z)', 'Pr(Y | do(~X1, Z=0))=1/2', { graph: 'X1 -> Y; Z -> Y' })
    const explicit = entail('Pr(Y | do(X1=1, Z=0))=Pr(Y | X1 & ~Z)', 'Pr(Y | do(X1=0, Z=0))=1/2', { graph: 'X1 -> Y; Z -> Y' })
    expect(abbreviated.premisesSmt).toBe(explicit.premisesSmt)
    expect(abbreviated.counterexampleSmt).toBe(explicit.counterexampleSmt)
    expect(abbreviated.conclusionSatisfaction).toEqual(explicit.conclusionSatisfaction)
  })

  test('comments and blank lines do not split or weaken the one-conclusion boundary', () => {
    const parsed = parse_decision_input(input({ task: 'entailment', premises: '\n# no assumptions\n', conclusion: '# theorem\nPr(X) >= 0 # comment\n' }))
    expect(parsed.premiseCount).toBe(0)
    expect(parsed.document.source).toEqual(['Pr(X) >= 0'])
    expect(() => entail('')).toThrow(/exactly one/)
    expect(() => entail('# empty')).toThrow(/exactly one/)
    expect(() => entail('Pr(X) >= 0\nPr(X) <= 1')).toThrow(/exactly one/)
    expect(() => compile('', { conclusion: 'Pr(X)=1' })).toThrow(/premises only/)
    expect(() => compile('', { conclusion: '# inactive blank' })).not.toThrow()
  })

  test.each([
    null, [], 'bad', {},
    { ...input(), graph: 1 }, { ...input(), premises: [] },
    { ...input(), regular: 'false' }, { ...input(), task: 'prove' },
    { ...input(), conclusion: 0 },
  ])('rejects malformed public input %#', malformed => {
    expect(() => parse_decision_input(malformed as DecisionProblemInput)).toThrow()
  })

  test('rejects bad graphs and undeclared letters in either input part', () => {
    expect(() => compile('', { graph: 'X -> Y; Y -> X' })).toThrow(/acyclic/)
    expect(() => compile('Pr(Y)=0')).toThrow(/not declared/)
    expect(() => entail('Pr(Y | do(X=1))=0')).toThrow(/not declared/)
    expect(() => compile('', { graph: 'A; B; C; D; E; F; G' })).toThrow(/At most 6/)
  })

  test('retains the shared 64-line and 64-query budgets across the conclusion', () => {
    const line = 'Pr(X) >= 0'
    const compiled = entail(line, Array(63).fill(line).join('\n'))
    expect(compiled.causal.queries).toHaveLength(64)
    expect(compiled.premiseConstraints).toHaveLength(63)
    expect(() => entail(line, Array(64).fill(line).join('\n'))).toThrow(/At most 64/)
    const doubleQuery = 'Pr(X) = Pr(X)'
    expect(() => entail(doubleQuery, Array(32).fill(doubleQuery).join('\n'))).toThrow(/At most 64/)
  })

  test('bounds raw text before dropping apparently empty comments', () => {
    const exact = `#${'x'.repeat(CAUSAL_LIMITS.max_input_characters - 2)}`
    expect(() => compile(exact)).not.toThrow()
    expect(() => compile(`${exact}x`)).toThrow(/50000 characters/)
    expect(() => entail('0=0', exact)).toThrow(/50000 characters/)
  })

  test('keeps existing line, token, parenthesis and reserved-query validation', () => {
    expect(() => compile('x'.repeat(4_097))).toThrow(/4096 characters/)
    expect(() => compile(`${Array(260).fill('x').join('+')}=0`)).toThrow(/512 tokens/)
    expect(() => compile(`${'('.repeat(65)}x${')'.repeat(65)}=0`)).toThrow(/64 nested/)
    expect(() => compile('CausalQueryA=1')).toThrow(/reserved/)
    expect(() => compile('tPr(X)=1')).toThrow()
    expect(() => compile('Pr(X)Pr(X)=1')).toThrow()
  })
})

describe('division-free exact polynomial reduction', () => {
  test.each([
    'x+y=1', 'x-y!=0', 'x*y<1', '-x<=1', 'x/y>0', 'x/(y/z)>=0',
    'x^0=1', 'x^1=1', 'x^2=1', 'x^(-2)=1', '(x^32)^32=1',
    '(x=0)&(y=1)', '(x=0)v(y=1)', '(x=0)->(y=1)', '(x=0)<->(y=1)', '~(x=0)',
    'Pr(X | X)=1', 'Pr(X | do(X=1), ~X)=0',
  ])('emits only polynomial real operations for %s', source => {
    const compiled = compile(source)
    assert_polynomial(compiled.premisesSmt)
    expect(new Set(compiled.variables).size).toBe(compiled.variables.length)
    expect(compiled.auxiliaryVariables.every(name => !compiled.causal.variables.includes(name))).toBe(true)
    expect(compiled.premisesSmt.match(/\(declare-fun /g)).toHaveLength(compiled.variables.length)
  })

  test('total quotient definitions add no global nonzero-denominator assumption', () => {
    const compiled = compile('(1/x=0) v (Pr(X)=0)')
    expect(compiled.premisesSmt).toContain('(or (= x 0) (= (* decision_aux_1 x) 1))')
    const finalAssertion = final_line(compiled.premisesSmt)
    expect(finalAssertion).toContain('(or (and (not (= x 0))')
    expect(finalAssertion).toContain('(= p_X_root 0)')
    expect(compiled.premisesSmt).not.toContain('(assert (not (= x 0)))')
  })

  test('nested quotient definitions keep intermediate undefined values unconstrained', () => {
    const compiled = compile('(1/(x/y)=0) v (Pr(X)=0)')
    expect(compiled.premisesSmt).toContain('(or (= y 0) (= (* decision_aux_1 y) x))')
    expect(compiled.premisesSmt).toContain('(or (= decision_aux_1 0) (= (* decision_aux_2 decision_aux_1) 1))')
    expect(compiled.premisesSmt).not.toContain('(assert (not (= y 0)))')
  })

  test('a signed denominator is used in an equality rather than inequality cross-multiplication', () => {
    const compiled = compile('x/(-y)>1')
    expect(compiled.premisesSmt).toContain('(= decision_aux_1 (- y))')
    expect(compiled.premisesSmt).toContain('(= (* decision_aux_2 decision_aux_1) x)')
    expect(final_line(compiled.premisesSmt)).toContain('(> decision_aux_2 1)')
  })

  test('negative integer powers use a total reciprocal and retain a local base guard', () => {
    const compiled = compile('x^(-2)=1')
    expect(compiled.premisesSmt).toContain('(= decision_aux_1 (* x x))')
    expect(compiled.premisesSmt).toContain('(or (= decision_aux_1 0) (= (* decision_aux_2 decision_aux_1) 1))')
    expect(final_line(compiled.premisesSmt)).toContain('(not (= x 0))')
  })

  test('zero powers preserve guards on an undefined base', () => {
    const compiled = compile('(1/x)^0=1')
    expect(compiled.premisesSmt).toContain('(or (= x 0)')
    expect(final_line(compiled.premisesSmt)).toContain('(and (not (= x 0)) (= 1 1))')
  })

  test('large powers use repeated squaring rather than copying the base 1024 times', () => {
    const compiled = compile(`x^${MAX_ABS_SOLVER_EXPONENT}=0`)
    expect(compiled.auxiliaryVariables).toHaveLength(10)
    expect(compiled.premisesSmt.length).toBeLessThan(2_000)
    expect(compiled.variables).toContain('x')
    expect(DECISION_LIMITS.max_auxiliary_variables).toBeGreaterThan(compiled.auxiliaryVariables.length)
    expect(DECISION_LIMITS.max_smt_characters).toBeGreaterThan(compiled.premisesSmt.length)
  })

  test.each(['x^1.0000000000000001=0', 'x^0.5=0', 'x^y=0', `x^${MAX_ABS_SOLVER_EXPONENT + 1}=0`])(
    'rejects unsupported exact exponent %s before solver use', source => {
      expect(() => compile(source)).toThrow(/integer literal|Exponent magnitude/)
    },
  )

  test('exact input integer and decimal spellings survive JavaScript rounding', () => {
    for (const numeral of ['9007199254740993', '0.10000000000000001', `0.${'0'.repeat(350)}1`, '9'.repeat(350)]) {
      const compiled = compile(`x=${numeral}`)
      expect(compiled.premisesSmt).toContain(`(= x ${numeral})`)
      expect(compiled.premisesSmt).not.toMatch(/Infinity|NaN|[0-9]e[-+]/)
    }
  })

  test('an underflow denominator retains its exact nonzero numeral and tautological source guard', () => {
    const numeral = `0.${'0'.repeat(350)}1`
    const compiled = compile(`1/${numeral}>0`)
    expect(compiled.premisesSmt).toContain(`(or (= ${numeral} 0)`)
    expect(compiled.premisesSmt).toContain(`(not (= ${numeral} 0))`)
  })

  test('free real names similar to internal names are retained and do not collide', () => {
    const compiled = compile('decisionaux=2\npXroot=3\nx/decisionaux=1')
    expect(compiled.causal.variables).toContain('decisionaux')
    expect(compiled.causal.variables).toContain('pXroot')
    expect(compiled.causal.variables).toContain('p_X_root')
    expect(new Set(compiled.variables).size).toBe(compiled.variables.length)
  })
})

describe('entailment uses the complement of guarded satisfaction', () => {
  test('conclusion definitions do not assert the conclusion in the premises problem', () => {
    const compiled = entail('Pr(X)>3/4')
    expect(compiled.premiseConstraints).toEqual([])
    expect(final_line(compiled.premisesSmt)).toBe('(assert (<= p_X_root 1))')
    expect(final_line(compiled.counterexampleSmt!)).toBe('(assert (not (> p_X_root decision_aux_1)))')
    expect(compiled.causal.smtlib).toContain('(assert (> p_X_root (/ 3 4)))')
  })

  test('a conditional conclusion is negated outside its nonzero evidence guard', () => {
    const compiled = entail('Pr(X | X)=1', 'Pr(X)=0')
    const satisfaction = s_to_string(compiled.conclusionSatisfaction!, false)
    expect(satisfaction).toMatch(/^\(and \(not \(= p_X_root 0\)\)/)
    expect(final_line(compiled.counterexampleSmt!)).toBe(`(assert (not ${satisfaction}))`)
    expect(final_line(compiled.counterexampleSmt!)).not.toMatch(/^\(assert \(and/)
    expect(compiled.conclusionConstraint?.tag).toBe('conjunction')
  })

  test.each(['~(1/x=0)', '(1/x=0) v (x=0)', '(1/x=0)->(x=0)', '(1/x=0)<->(x=0)'])(
    'preserves the entire guarded compound conclusion before negating %s', conclusion => {
      const compiled = entail(conclusion)
      const final = final_line(compiled.counterexampleSmt!)
      expect(final).toBe(`(assert (not ${s_to_string(compiled.conclusionSatisfaction!, false)}))`)
      assert_polynomial(compiled.counterexampleSmt!)
    },
  )

  test('compiled SMT envelopes have trusted provenance and cannot be altered', () => {
    const compiled = entail('Pr(X)>=0')
    expect(is_compiled_decision_problem(compiled)).toBe(true)
    expect(is_compiled_decision_problem({ ...compiled })).toBe(false)
    expect(is_compiled_decision_problem(null)).toBe(false)
    expect(is_compiled_decision_problem(compiled.premisesSmt)).toBe(false)
    expect(Object.isFrozen(compiled)).toBe(true)
    expect(Object.isFrozen(compiled.variables)).toBe(true)
    expect(Object.isFrozen(compiled.auxiliaryVariables)).toBe(true)
    expect(Object.isFrozen(compiled.causal)).toBe(true)
    expect(Object.isFrozen(compiled.causal.queries)).toBe(true)
    expect(() => compiled.causal.queries.push({ source: 'malicious', expression: { tag: 'literal', value: 0 } })).toThrow(TypeError)
    expect(() => { compiled.premisesSmt = '(assert false)' }).toThrow(TypeError)
    expect(() => compiled.variables.push('malicious')).toThrow(TypeError)
  })
})
