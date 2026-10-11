import { describe, test } from 'vitest'
import { assert_parse_constraint } from './parser'
import { variables_in_constraints, TruthTable, translate, constraint_to_string, constraints_to_smtlib_lines, letter_string } from './pr_sat'

describe('exponent letter dropping repro', () => {
  test('2^Pr(B) = 2 alone', () => {
    const c = assert_parse_constraint('2^Pr(B) = 2')
    const vars = variables_in_constraints([c])
    console.log('SENTENCE LETTERS:', vars.sentence.map(letter_string))
    const tt = new TruthTable(vars)
    console.log('N STATES:', tt.n_states())
    const translated = translate(tt, [c])
    console.log('TRANSLATED:', translated.map((t) => constraint_to_string(t)))
    try {
      console.log('SMTLIB:', constraints_to_smtlib_lines(tt, tt.n_states() - 1, translated).join('\n'))
    } catch (e) {
      console.log('SMTLIB THREW:', (e as Error).message)
    }
  })

  test('Pr(A) > 0 & 2^Pr(B) = 2 mixed', () => {
    const c = assert_parse_constraint('Pr(A) > 0 & 2^Pr(B) = 2')
    const vars = variables_in_constraints([c])
    console.log('SENTENCE LETTERS:', vars.sentence.map(letter_string))
    const tt = new TruthTable(vars)
    console.log('N STATES:', tt.n_states())
    const translated = translate(tt, [c])
    console.log('TRANSLATED:', translated.map((t) => constraint_to_string(t)))
  })

  test('control: Pr(B)^2 = 1 (letter in base) works', () => {
    const c = assert_parse_constraint('Pr(B)^2 = 1')
    const vars = variables_in_constraints([c])
    console.log('SENTENCE LETTERS:', vars.sentence.map(letter_string))
    const tt = new TruthTable(vars)
    const translated = translate(tt, [c])
    console.log('TRANSLATED:', translated.map((t) => constraint_to_string(t)))
  })
})
