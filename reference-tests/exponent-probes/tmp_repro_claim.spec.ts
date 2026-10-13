import { test, expect } from 'vitest'
import { parse_constraint } from '../../src/parser'
import { TruthTable, translate, enrich_constraints, eliminate_state_variable_index, constraints_to_smtlib_lines, variables_in_constraints } from '../../src/pr_sat'
import { s_to_string } from '../../src/s'

test('repro: literal >= 1e21 serializes in exponent notation', () => {
  const parsed = parse_constraint('Pr(A) < 10000000000000000000000')
  expect(parsed[0]).toEqual(true)
  if (!parsed[0]) return
  const constraints = [parsed[1]]
  const tt = new TruthTable(variables_in_constraints(constraints))
  const translated = translate(tt, constraints)
  const index_to_eliminate = tt.n_states() - 1
  const enriched = enrich_constraints(tt, index_to_eliminate, true, translated)
  const [, elim] = eliminate_state_variable_index(tt.n_states(), index_to_eliminate, enriched)
  const lines = constraints_to_smtlib_lines(tt, index_to_eliminate, elim)
  const smtlib = lines.map((s) => s_to_string(s, false)).join('\n')
  console.log('=== SMTLIB ===\n' + smtlib + '\n==============')
  expect(smtlib).toContain('10000000000000000000000')
  expect(smtlib).not.toContain('1e+22')
})
