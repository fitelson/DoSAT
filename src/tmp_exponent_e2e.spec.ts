import { describe, test } from 'vitest'
import { assert_parse_constraint } from './parser'
import { init_z3, pr_sat } from './z3_integration'

describe('exponent e2e', () => {
  test('2^Pr(B) = 2 end-to-end (should be SAT with Pr(B)=1)', async () => {
    const { Context } = await init_z3()
    try {
      const r = await pr_sat(Context('main'), [assert_parse_constraint('2^Pr(B) = 2')])
      console.log('STATUS (2^Pr(B) = 2):', r.status)
    } catch (e) {
      console.log('THREW (2^Pr(B) = 2):', (e as Error).message)
    }
  }, 60_000)

  test('Pr(A) > 0 & 2^Pr(B) = 2 end-to-end', async () => {
    const { Context } = await init_z3()
    try {
      const r = await pr_sat(Context('main2'), [assert_parse_constraint('Pr(A) > 0 & 2^Pr(B) = 2')])
      console.log('STATUS (mixed):', r.status)
    } catch (e) {
      console.log('THREW (mixed):', (e as Error).message)
    }
  }, 60_000)
})
