import { beforeAll, describe, expect, test } from 'vitest'
import { compile_causal_document } from './causal'
import { parse_causal_document } from './causal_syntax'
import { init_z3, model_assignment_output_to_string, WrappedSolver, WrappedSolverResult } from './z3_integration'

type Compiled = ReturnType<typeof compile_causal_document>
type SatResult = Extract<WrappedSolverResult, { status: 'sat' }>
let z3: Awaited<ReturnType<typeof init_z3>>

beforeAll(async () => { z3 = await init_z3() })

const solve = async (graph: string, constraints: string, regular = false, timeoutMs = 15_000) => {
  const compiled = compile_causal_document(parse_causal_document(graph, constraints), { regular })
  const solver = new WrappedSolver(z3, init_z3)
  const result = await solver.solve(compiled.smtlib, timeoutMs)
  return { compiled, result }
}

const require_sat = (result: WrappedSolverResult): SatResult => {
  expect(result.status).toBe('sat')
  if (result.status !== 'sat') throw new Error(`Expected SAT; got ${result.status}`)
  return result
}

const evaluate = async (compiled: Compiled, result: SatResult, expression: Compiled['queries'][number]['expression']) => {
  return await result.evaluate(compiled.evaluationTable, { tag: 'real_expr', real_expr: expression })
}

const query_value = async (compiled: Compiled, result: SatResult, source: string) => {
  const compact = (s: string) => s.replace(/\s/g, '')
  const query = compiled.queries.find((q) => compact(q.source) === compact(source))
  expect(query, `Missing query ${source}`).toBeDefined()
  if (!query) throw new Error(`Missing query ${source}`)
  const output = await result.evaluate_exact(query.expression)
  expect(output.defined).toBe(true)
  if (!output.defined || output.value === undefined) throw new Error(`Expected a defined query: ${source}`)
  // Keep exact numeral strings throughout; this also handles integers beyond
  // Number.MAX_SAFE_INTEGER without passing through JavaScript number values.
  return output.value.replace(/\.0\b/g, '').replace(/^\(\/ (\d+) (\d+)\)$/, '$1 / $2')
}

describe('Boolean acyclic causal satisfiability', () => {
  test('observational association differs from intervention in an exact confounding example', async () => {
    // Z is fair; X agrees with Z with probability 3/4; Y equals Z.
    // P(X)=1/2, P(Y & X)=3/8, hence P(Y|X)=3/4.
    // Intervening on X leaves Z and Y unchanged, hence P(Y|do(X=1))=1/2.
    const { compiled, result } = await solve('Z -> X; Z -> Y', `
      Pr(Z) = 1/2
      Pr(X | Z) = 3/4
      Pr(X | ~Z) = 1/4
      Pr(Y | Z) = 1
      Pr(Y | ~Z) = 0
      Pr(Y | X) = 3/4
      Pr(Y | do(X=1)) = 1/2
    `)
    const sat = require_sat(result)
    expect(await query_value(compiled, sat, 'Pr(Y | X)')).toBe('3 / 4')
    expect(await query_value(compiled, sat, 'Pr(Y | do(X=1))')).toBe('1 / 2')
  })

  test('an intervention and ordinary conditioning share the same child mechanism without confounding', async () => {
    const { result } = await solve('X -> Y', `
      Pr(Y | X) = 1/3
      Pr(Y | do(X=1)) != 1/3
    `, true)
    expect(result.status).toBe('unsat')
  })

  test('the Boolean backdoor adjustment formula follows from the supplied graph', async () => {
    const { result } = await solve('Z -> X; Z -> Y; X -> Y', `
      Pr(Y | do(X=1)) != Pr(Y | X & Z) * Pr(Z) + Pr(Y | X & ~Z) * Pr(~Z)
    `, true)
    expect(result.status).toBe('unsat')
  })

  test('a direct causal effect can reverse the sign of observational association', async () => {
    // X is selected predominantly when Z=1, but its causal effect is negative
    // within each stratum. Exact association and intervention values differ.
    const { compiled, result } = await solve('Z -> X; Z -> Y; X -> Y', `
      Pr(Z) = 1/2
      Pr(X | Z) = 3/4
      Pr(X | ~Z) = 1/4
      Pr(Y | X & Z) = 3/4
      Pr(Y | ~X & Z) = 1
      Pr(Y | X & ~Z) = 0
      Pr(Y | ~X & ~Z) = 1/4
      Pr(Y | X) = 9/16
      Pr(Y | ~X) = 7/16
      Pr(Y | do(X=1)) = 3/8
      Pr(Y | do(X=0)) = 5/8
    `)
    const sat = require_sat(result)
    expect(await query_value(compiled, sat, 'Pr(Y | X)')).toBe('9 / 16')
    expect(await query_value(compiled, sat, 'Pr(Y | ~X)')).toBe('7 / 16')
    expect(await query_value(compiled, sat, 'Pr(Y | do(X=1))')).toBe('3 / 8')
    expect(await query_value(compiled, sat, 'Pr(Y | do(X=0))')).toBe('5 / 8')
  })

  test('intervening on a descendant leaves an ancestor distribution unchanged', async () => {
    const { result } = await solve('X -> Y', `
      Pr(X) = 1/3
      Pr(X | do(Y=0)) != 1/3
    `)
    expect(result.status).toBe('unsat')
  })

  test('simultaneous interventions force both assignments while retaining the remaining mechanism', async () => {
    const { compiled, result } = await solve('X -> Y; Y -> Z', `
      Pr(X | do(X=1, Y=0)) = 1
      Pr(Y | do(X=1, Y=0)) = 0
      Pr(Z | do(Y=0)) = 1/4
      Pr(Z | do(X=1, Y=0)) = 1/4
    `)
    const sat = require_sat(result)
    expect(await query_value(compiled, sat, 'Pr(X | do(X=1, Y=0))')).toBe('1')
    expect(await query_value(compiled, sat, 'Pr(Y | do(X=1, Y=0))')).toBe('0')
    expect(await query_value(compiled, sat, 'Pr(Z | do(X=1, Y=0))')).toBe('1 / 4')
  })

  test('cutting a mediator blocks the influence of its ancestor', async () => {
    const { result } = await solve('X -> Y; Y -> Z', `
      Pr(Z | do(X=1, Y=0)) != Pr(Z | do(Y=0))
    `)
    expect(result.status).toBe('unsat')
  })

  test('simultaneous intervention order does not change the regime', async () => {
    const { result } = await solve('X -> Y; Y -> Z', `
      Pr(Z | do(X=1, Y=0)) != Pr(Z | do(Y=0, X=1))
    `)
    expect(result.status).toBe('unsat')
  })

  test('ordinary evidence after an intervention uses the intervened distribution', async () => {
    const { compiled, result } = await solve('Z -> Y; X -> Y', `
      Pr(Z) = 1/2
      Pr(Y | X & Z) = 3/4
      Pr(Y | X & ~Z) = 1/4
      Pr(Y | do(X=1), Z) = 3/4
      Pr(Y | do(X=1)) = 1/2
    `, true)
    const sat = require_sat(result)
    expect(await query_value(compiled, sat, 'Pr(Y | do(X=1), Z)')).toBe('3 / 4')
    expect(await query_value(compiled, sat, 'Pr(Y | do(X=1))')).toBe('1 / 2')
  })

  test.each([
    'Pr(Y | do(X=1), ~X) = 1/2',
    'Pr(Y | do(X=1), ~X) != 1/2',
    '~(Pr(Y | do(X=1), ~X) = 1/2)',
  ])('impossible post-intervention evidence cannot satisfy an atomic or negated comparison: %s', async (constraints) => {
    const { result } = await solve('X -> Y', constraints)
    expect(result.status).toBe('unsat')
  })

  test('a true disjunction survives an undefined conditional probability in its other branch', async () => {
    const { compiled, result } = await solve('X -> Y', `
      Pr(X | do(X=1)) = 1 v Pr(Y | do(X=1), ~X) = 1/2
    `)
    const sat = require_sat(result)
    const query = compiled.queries.find((q) => q.source.replace(/\s/g, '') === 'Pr(Y|do(X=1),~X)')
    expect(query).toBeDefined()
    if (!query) throw new Error('Missing conditional query')
    expect(await evaluate(compiled, sat, query.expression)).toEqual({ tag: 'div0' })
  })

  test('an observationally absent parent configuration retains a mechanism accessible to intervention', async () => {
    const { compiled, result } = await solve('X -> Y', `
      Pr(X) = 0
      Pr(Y) = 0
      Pr(Y | do(X=1)) = 3/4
    `)
    const sat = require_sat(result)
    expect(await query_value(compiled, sat, 'Pr(Y)')).toBe('0')
    expect(await query_value(compiled, sat, 'Pr(Y | do(X=1))')).toBe('3 / 4')
    const mechanism = compiled.mechanisms.find((m) => m.node === 'Y' && m.parents.X === true)
    expect(mechanism).toBeDefined()
    if (!mechanism) throw new Error('Missing Y mechanism at X=1')
    const output = await evaluate(compiled, sat, mechanism.expression)
    expect(output.tag).toBe('result')
    if (output.tag === 'result') expect(model_assignment_output_to_string(output.result)).toBe('3 / 4')
  })

  test('regular mechanisms allow the structural zero rows imposed by an intervention', async () => {
    const { compiled, result } = await solve('X -> Y', `
      Pr(X) = 1/2
      Pr(Y | X) = 1/3
      Pr(Y | ~X) = 2/3
      Pr(~X | do(X=1)) = 0
      Pr(Y | do(X=1)) = 1/3
    `, true)
    const sat = require_sat(result)
    expect(await query_value(compiled, sat, 'Pr(~X | do(X=1))')).toBe('0')
    expect(await query_value(compiled, sat, 'Pr(Y | do(X=1))')).toBe('1 / 3')
  })

  test('regularity excludes a deterministic observational mechanism', async () => {
    const { result } = await solve('X -> Y', 'Pr(X) = 0', true)
    expect(result.status).toBe('unsat')
  })

  test('disconnected roots are observationally independent', async () => {
    const { result } = await solve('X; Y', `
      Pr(X) = 1/2
      Pr(Y) = 1/2
      Pr(X & Y) != 1/4
    `)
    expect(result.status).toBe('unsat')
  })

  test('a chain enforces conditional independence given its mediator', async () => {
    const { result } = await solve('X -> Y; Y -> Z', `
      Pr(Z | X & Y) != Pr(Z | Y)
    `, true)
    expect(result.status).toBe('unsat')
  })

  test('conditioning on a collider permits dependence of its independent causes', async () => {
    // Independent fair X,Y with Z = X v Y give P(X&Y|Z)=1/3 and P(X|Z)=2/3.
    const { compiled, result } = await solve('X -> Z; Y -> Z', `
      Pr(X) = 1/2
      Pr(Y) = 1/2
      Pr(Z | X & Y) = 1
      Pr(Z | X & ~Y) = 1
      Pr(Z | ~X & Y) = 1
      Pr(Z | ~X & ~Y) = 0
      Pr(X & Y | Z) = 1/3
      Pr(X | Z) = 2/3
    `)
    const sat = require_sat(result)
    expect(await query_value(compiled, sat, 'Pr(X & Y | Z)')).toBe('1 / 3')
    expect(await query_value(compiled, sat, 'Pr(X | Z)')).toBe('2 / 3')
  })

  test('intervention probabilities preserve exact decimal arithmetic', async () => {
    const { result } = await solve('X -> Y', `
      Pr(Y | do(X=1)) = 0.1 + 0.2
      Pr(Y | do(X=1)) != 0.3
    `)
    expect(result.status).toBe('unsat')
  })

  test('intervention expressions preserve integers beyond JavaScript safe precision', async () => {
    const { result } = await solve('X', `
      Pr(X | do(X=1)) * 9007199254740993 = 9007199254740992
    `)
    expect(result.status).toBe('unsat')
  })

  test('exact model evaluation preserves a probability numerator beyond JavaScript safe precision', async () => {
    const { compiled, result } = await solve('X', `
      Pr(X) = 9007199254740993 / 18014398509481984
      Pr(X | do(X=1)) = 1
    `)
    const sat = require_sat(result)
    expect(await query_value(compiled, sat, 'Pr(X)')).toBe('9007199254740993 / 18014398509481984')
  })

  test('the retained mechanisms normalize every intervention distribution', async () => {
    const { result } = await solve('X -> Y; Y -> Z', `
      Pr(X v ~X | do(Y=0)) != 1
    `)
    expect(result.status).toBe('unsat')
  })

  test('complementary events normalize as a polynomial without the tautology shortcut', async () => {
    const { result } = await solve('X -> Y; Y -> Z', `
      Pr(Z | do(Y=0)) + Pr(~Z | do(Y=0)) != 1
    `)
    expect(result.status).toBe('unsat')
  })
})

describe('phase-one consensus repair acceptance', () => {
  test('explicit multiplication expresses independent root probabilities exactly', async () => {
    const { result } = await solve('X; Y', 'Pr(X & Y) != Pr(X)*Pr(Y)')
    expect(result.status).toBe('unsat')
  })

  test.each([
    'Pr(X & Y) != Pr(X)Pr(Y)',
    'Pr(X)x = 5',
    'Pr(X)P(Y) = 5',
    'Pr(X)e = 5',
  ])('omitted multiplication is rejected before reaching the solver: %s', (constraints) => {
    expect(() => parse_causal_document('X; Y', constraints)).toThrow(/Invalid constraint/)
  })

  test('adjacent text cannot alias the twenty-seventh probability query', () => {
    // Without delimited substitution, Pr(X)A becomes CausalQueryAA, which is
    // also the legitimate name of the twenty-seventh query below. That used
    // to silently change this malformed expression into the contradiction
    // Pr(X | do(X=1))=1/3, producing an unintended UNSAT result.
    const constraints = ['Pr(X)A = 1/3', ...Array(26).fill('Pr(X | do(X=1)) = 1')].join('\n')
    expect(() => parse_causal_document('X', constraints)).toThrow(/Invalid constraint/)
  })

  test.each([
    ['16.1', 16_100],
    ['32.2', 32_200],
    ['1.0005', 1_001],
  ])('real Z3 accepts the rounded timeout for %s seconds', async (seconds, expectedMilliseconds) => {
    const milliseconds = Math.round(Number(seconds) * 1000)
    expect(Number.isInteger(milliseconds)).toBe(true)
    expect(milliseconds).toBe(expectedMilliseconds)
    const { compiled, result } = await solve('X', 'Pr(X) = 1/2', false, milliseconds)
    const sat = require_sat(result)
    expect(await query_value(compiled, sat, 'Pr(X)')).toBe('1 / 2')
  })
})
