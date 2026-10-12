import { beforeAll, describe, expect, test, vi } from 'vitest'
import { init, type Expr, type Z3HighLevel } from 'z3-solver'
import { compile_causal_document } from './causal'
import { parse_causal_document } from './causal_syntax'
import { CausalModelEvaluator, type CapturedCausalModel, type ModelEvaluationResult } from './causal_model_evaluator'
import type { DecisionWitness } from './causal_decision_solver'

let z3: Z3HighLevel
beforeAll(async () => { z3 = await init() })
const witness = (graph: string, value: (node: string, parents: Record<string, boolean>) => string, freeParameters: DecisionWitness['freeParameters'] = []): DecisionWitness => ({
  mechanisms: compile_causal_document(parse_causal_document(graph, '')).mechanisms.map((item, index) => ({ node: item.node, parents: { ...item.parents }, parameter: `old_namespace_${index}`, value: value(item.node, item.parents) })),
  freeParameters, queries: [], distributions: [],
})
const rationalFixture = (evaluator: CausalModelEvaluator): CapturedCausalModel => evaluator.capture('X -> Y', witness('X -> Y', (node, parents) => node === 'X' ? '(/ 1.0 4.0)' : parents.X ? '(/ 4.0 5.0)' : '(/ 1.0 5.0)'))
const exact = (result: ModelEvaluationResult): string => {
  expect(result).toMatchObject({ status: 'value', kind: 'real' })
  if (result.status !== 'value' || result.kind !== 'real') throw new Error('Expected exact real evaluation.')
  return result.value
}
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(ok => { resolve = ok })
  return { promise, resolve }
}

describe('fixed causal kernel evaluation', () => {
  let evaluator: CausalModelEvaluator, model: CapturedCausalModel
  beforeAll(() => { evaluator = new CausalModelEvaluator(z3); model = rationalFixture(evaluator) })
  test.each([
    ['Pr(Y)', '(/ 7.0 20.0)'],
    ['Pr(Y | do(X))', '(/ 4.0 5.0)'],
    ['Pr(Y | do(~X))', '(/ 1.0 5.0)'],
    ['Pr(Y | X)', '(/ 4.0 5.0)'],
    ['Pr(X | do(Y))', '(/ 1.0 4.0)'],
    ['Pr(X & ~Y | do(X, ~Y))', '1.0'],
    ['Pr(Y | do(X, ~Y))', '0.0'],
    ['Pr(Y | do(X), X)', '(/ 4.0 5.0)'],
    ['Pr(Y | do(~X), ~X)', '(/ 1.0 5.0)'],
    ['Pr(Y | do(X)) - Pr(Y | do(~X))', '(/ 3.0 5.0)'],
  ])('new expression %s agrees with its analytic value', async (source, expected) => {
    expect(exact(await evaluator.evaluate(model, source))).toBe(expected)
  })
  test('new regimes do not depend on old query/distribution tables', async () => {
    expect(model).not.toHaveProperty('queries')
    expect(model).not.toHaveProperty('distributions')
    const output = await evaluator.evaluate(model, 'Pr(Y | do(X)) + Pr(Y | do(~X))')
    expect(exact(output)).toBe('1.0')
    expect(output).toMatchObject({ probabilities: [{ source: 'Pr(Y | do(X))', defined: true, value: '(/ 4.0 5.0)' }, { source: 'Pr(Y | do(~X))', defined: true, value: '(/ 1.0 5.0)' }] })
  })
  test('the captured kernel survives mutations of the original witness', async () => {
    const original = witness('X -> Y', (node, parents) => node === 'X' ? '(/ 1 4)' : parents.X ? '(/ 4 5)' : '(/ 1 5)')
    const captured = evaluator.capture('X -> Y', original)
    original.mechanisms[1].value = '0'
    original.mechanisms[1].parents.X = !original.mechanisms[1].parents.X
    original.mechanisms.length = 0
    expect(Object.isFrozen(captured)).toBe(true)
    expect(Object.isFrozen(captured.mechanisms)).toBe(true)
    expect(Object.isFrozen(captured.mechanisms[0].parents)).toBe(true)
    expect(JSON.parse(JSON.stringify(captured))).toEqual(captured)
    expect(exact(await evaluator.evaluate(captured, 'Pr(Y | do(X))'))).toBe('(/ 4.0 5.0)')
  })
  test('a confounded three-node kernel gives the Simpson reversal under new interventions', async () => {
    const graph = 'Z -> X; Z -> Y; X -> Y'
    const captured = evaluator.capture(graph, witness(graph, (node, parents) => node === 'Z' ? '(/ 1 2)' : node === 'X' ? parents.Z ? '(/ 9 10)' : '(/ 1 10)' : parents.X ? parents.Z ? '(/ 3 5)' : '(/ 9 10)' : parents.Z ? '(/ 1 2)' : '(/ 4 5)'))
    expect(exact(await evaluator.evaluate(captured, 'Pr(Y | do(X))'))).toBe('(/ 3.0 4.0)')
    expect(exact(await evaluator.evaluate(captured, 'Pr(Y | X)'))).toBe('(/ 63.0 100.0)')
    expect(exact(await evaluator.evaluate(captured, 'Pr(Y | do(X), Z)'))).toBe('(/ 3.0 5.0)')
    expect(exact(await evaluator.evaluate(captured, 'Pr(Y | do(~X))'))).toBe('(/ 13.0 20.0)')
  })
  test('mechanisms are matched structurally rather than by old solver parameter names', async () => {
    const original = witness('X', () => '(/ 1 4)', [{ variable: 'p_X_root', value: '(/ 9 10)' }, { variable: 'a', value: '(/ 9 10)' }])
    original.mechanisms[0].parameter = 'p_X_root_1'
    const captured = evaluator.capture('X', original)
    // The old free name forced p_X_root_1; these new queries regenerate
    // p_X_root instead. A lookup by original parameter name would fail.
    expect(exact(await evaluator.evaluate(captured, 'Pr(X)'))).toBe('(/ 1.0 4.0)')
    expect(exact(await evaluator.evaluate(captured, 'Pr(X) + a'))).toBe('(/ 23.0 20.0)')
  })
  test('unassigned free variables are errors, including internal-looking mechanism names', async () => {
    expect(await evaluator.evaluate(model, 'a + Pr(Y)')).toMatchObject({ status: 'error', message: expect.stringContaining('Unassigned') })
    expect(await evaluator.evaluate(model, 'p_X_root')).toMatchObject({ status: 'error' })
  })
  test('large exact free reals and literal spelling are never rounded', async () => {
    const captured = evaluator.capture('X', witness('X', () => '(/ 1 2)', [{ variable: 'a', value: '9007199254740993.0' }]))
    expect(exact(await evaluator.evaluate(captured, 'a - 9007199254740992'))).toBe('1.0')
    expect(exact(await evaluator.evaluate(captured, '0.10000000000000001 - 1/10'))).toBe('(/ 1.0 100000000000000000.0)')
  })
  test('algebraic kernels and new query arithmetic remain exact', async () => {
    const root = '(root-obj (+ (* 2 (^ x 2)) (- 1)) 2)'
    const captured = evaluator.capture('X -> Y', witness('X -> Y', node => node === 'X' ? root : root))
    expect(exact(await evaluator.evaluate(captured, 'Pr(X)^2'))).toBe('(/ 1.0 2.0)')
    expect(exact(await evaluator.evaluate(captured, 'Pr(Y | do(~X))'))).toContain('root-obj')
    expect(await evaluator.evaluate(captured, 'Pr(Y | do(X))^2 = 1/2')).toMatchObject({ status: 'value', kind: 'constraint', value: true })
  })
  test('higher-degree algebraic free values need no retained model or new search', async () => {
    const captured = evaluator.capture('X', witness('X', () => '(/ 1 2)', [{ variable: 'a', value: '(root-obj (+ (^ x 3) (- 2)) 1)' }]))
    expect(exact(await evaluator.evaluate(captured, 'a^3'))).toBe('2.0')
  })
  test('a reordered graph and reversed snapshot rows retain the same parent mapping', async () => {
    const graph = 'Y; X; X -> Y'
    const original = witness(graph, (node, parents) => node === 'X' ? '(/ 1 4)' : parents.X ? '(/ 4 5)' : '(/ 1 5)')
    original.mechanisms.reverse()
    const captured = evaluator.capture(graph, original)
    expect(exact(await evaluator.evaluate(captured, 'Pr(Y | do(X))'))).toBe('(/ 4.0 5.0)')
  })
})

describe('undefined terms and guarded constraint satisfaction', () => {
  let evaluator: CausalModelEvaluator, model: CapturedCausalModel
  beforeAll(() => { evaluator = new CausalModelEvaluator(z3); model = evaluator.capture('X -> Y', witness('X -> Y', (node, parents) => node === 'X' ? '0' : parents.X ? '1' : '0')) })
  test('an off-support intervention still uses the specified unseen parent mechanism', async () => {
    expect(exact(await evaluator.evaluate(model, 'Pr(Y | do(X))'))).toBe('1.0')
  })
  test.each(['Pr(Y | X)', '0 * Pr(Y | X)', 'Pr(Y | X)^0', '1 / Pr(X)', 'Pr(X)^(-1)', '0/0', 'Pr(Y | do(~X), X)'])('required undefined term in %s yields undefined', async source => {
    expect(await evaluator.evaluate(model, source)).toMatchObject({ status: 'undefined' })
  })
  test.each([
    ['Pr(Y | X) = 1', false],
    ['~(Pr(Y | X) = 1)', false],
    ['(Pr(Y | X) = 1) v (Pr(X) = 0)', true],
    ['~((Pr(Y | X) = 1) v (Pr(X) = 0))', false],
    ['(Pr(Y | X) = 1) -> (Pr(X) = 0)', true],
    ['(Pr(Y | X) = 1) <-> (Pr(X) = 0)', false],
    ['(Pr(Y | X) = 1) <-> (Pr(Y | X) = 0)', true],
  ])('constraint %s has guarded satisfaction %s', async (source, expected) => {
    expect(await evaluator.evaluate(model, source)).toMatchObject({ status: 'value', kind: 'constraint', value: expected, probabilities: expect.arrayContaining([{ source: 'Pr(Y | X)', defined: false }]) })
  })
  test('a defined zero raised to zero remains one', async () => {
    expect(exact(await evaluator.evaluate(model, 'Pr(X)^0'))).toBe('1.0')
  })
})

describe('snapshot and expression validation', () => {
  test.each(['a', '(ite true 1 0)', '0)) (assert false)', '(+ 1 2)', '(/ 1 0)', '(root-obj (+ (^ y 2) (- 1)) 2)', '(root-obj (+ (^ x 2) (- 1)) 3)', '(root-obj (+ (^ x 1025) (- 1)) 1)', '9'.repeat(32_769)])('rejects unsafe exact snapshot value %s', value => {
    expect(() => new CausalModelEvaluator(z3).capture('X', witness('X', () => value))).toThrow()
  })
  test('missing, duplicated, and wrongly scoped mechanisms fail capture', () => {
    const evaluator = new CausalModelEvaluator(z3)
    const missing = witness('X -> Y', () => '(/ 1 2)'); missing.mechanisms.pop()
    expect(() => evaluator.capture('X -> Y', missing)).toThrow(/incomplete/)
    const duplicated = witness('X -> Y', () => '(/ 1 2)'); duplicated.mechanisms[2] = duplicated.mechanisms[1]
    expect(() => evaluator.capture('X -> Y', duplicated)).toThrow(/duplicate/)
    const wrongParents = witness('X -> Y', () => '(/ 1 2)'); wrongParents.mechanisms[1].parents = { Z: true }
    expect(() => evaluator.capture('X -> Y', wrongParents)).toThrow(/parent/)
  })
  test('out-of-range rational or algebraic mechanisms cannot be evaluated as causal models', async () => {
    const evaluator = new CausalModelEvaluator(z3)
    for (const value of ['(- (/ 1 10))', '(/ 11 10)', '(root-obj (+ (^ x 2) (- 2)) 2)']) {
      expect(await evaluator.evaluate(evaluator.capture('X', witness('X', () => value)), 'Pr(X)')).toMatchObject({ status: 'error', message: expect.stringContaining('outside') })
    }
  })
  test('captures belong to their creating evaluator and cannot be forged', async () => {
    const first = new CausalModelEvaluator(z3), second = new CausalModelEvaluator(z3)
    const captured = rationalFixture(first)
    expect(await second.evaluate(captured, 'Pr(Y)')).toMatchObject({ status: 'error' })
    expect(await first.evaluate({ ...captured }, 'Pr(Y)')).toMatchObject({ status: 'error' })
  })
  test.each(['Pr(Z)', 'Pr(Y | do(Z))', 'Pr(Y)^a', 'Pr(Y)^1.0000000000000001', 'Pr(Y)\nPr(X)', '#'+ ' '.repeat(50_001)])('invalid expression %s yields an error', async source => {
    const evaluator = new CausalModelEvaluator(z3)
    expect(await evaluator.evaluate(rationalFixture(evaluator), source)).toMatchObject({ status: 'error' })
  })
})

describe('evaluation ownership and cooperative cancellation', () => {
  test('capture, pre-abort, and unknown free variables need no native context', async () => {
    const Context = vi.fn(() => { throw new Error('Unexpected native work') })
    const evaluator = new CausalModelEvaluator({ Context } as unknown as Z3HighLevel)
    const captured = evaluator.capture('X', witness('X', () => '(/ 1 2)'))
    const abort = new AbortController(); abort.abort()
    expect(await evaluator.evaluate(captured, 'Pr(X)', { abort_signal: abort.signal })).toEqual({ status: 'cancelled' })
    expect(await evaluator.evaluate(captured, 'newparameter')).toMatchObject({ status: 'error', message: expect.stringContaining('Unassigned') })
    expect(Context).not.toHaveBeenCalled()
  })
  test('parsing solvers are released on parse failure without checking or obtaining a model', async () => {
    const release = vi.fn(), check = vi.fn(), model = vi.fn()
    const context = { Solver: vi.fn(function () { return { fromString: () => { throw new Error('Exact parser failed') }, release, check, model } }) }
    const evaluator = new CausalModelEvaluator({ Context: vi.fn(function () { return context }) } as unknown as Z3HighLevel)
    const captured = evaluator.capture('X', witness('X', () => '(/ 1 2)'))
    expect(await evaluator.evaluate(captured, 'Pr(X)')).toEqual({ status: 'error', message: 'Exact parser failed' })
    expect(release).toHaveBeenCalledOnce()
    expect(check).not.toHaveBeenCalled()
    expect(model).not.toHaveBeenCalled()
  })
  test('a cancelled pending simplification remains busy until settlement and then permits reuse', async () => {
    const native = new z3.Context('causal_model_evaluation'), pending = deferred<Expr<'causal_model_evaluation'>>()
    let firstExpression: Expr<'causal_model_evaluation'> | undefined, first = true
    const simplify = vi.fn((expression: Expr<'causal_model_evaluation'>) => {
      if (first) { first = false; firstExpression = expression; return pending.promise }
      return native.simplify(expression)
    })
    const proxy = new Proxy(native, { get(target, property, receiver) { return property === 'simplify' ? simplify : Reflect.get(target, property, receiver) } })
    const Context = vi.fn(function () { return proxy })
    const evaluator = new CausalModelEvaluator({ Context } as unknown as Z3HighLevel)
    const captured = evaluator.capture('X', witness('X', () => '(/ 1 2)')), abort = new AbortController()
    const running = evaluator.evaluate(captured, 'Pr(X)', { abort_signal: abort.signal })
    expect(simplify).toHaveBeenCalledOnce()
    abort.abort()
    expect(await evaluator.evaluate(captured, 'Pr(X)')).toEqual({ status: 'error', message: 'This model evaluator is already running.' })
    pending.resolve(await native.simplify(firstExpression!))
    expect(await running).toEqual({ status: 'cancelled' })
    expect(exact(await evaluator.evaluate(captured, 'Pr(X)'))).toBe('(/ 1.0 2.0)')
    expect(Context).toHaveBeenCalledOnce()
  })
  test('an abort during final numeral extraction cannot return an accepted value', async () => {
    const native = new z3.Context('causal_model_evaluation'), abort = new AbortController()
    let trigger = true
    const proxy = new Proxy(native, {
      get(target, property, receiver) {
        if (property !== 'simplify') return Reflect.get(target, property, receiver)
        return async (expression: Expr<'causal_model_evaluation'>) => {
          const result = await native.simplify(expression)
          if (!native.isArith(result) || !trigger) return result
          trigger = false
          return new Proxy(result, { get(object, member, itemReceiver) { return member === 'sexpr' ? () => { abort.abort(); return object.sexpr() } : Reflect.get(object, member, itemReceiver) } })
        }
      },
    })
    const evaluator = new CausalModelEvaluator({ Context: vi.fn(function () { return proxy }) } as unknown as Z3HighLevel)
    const captured = evaluator.capture('X', witness('X', () => '(/ 1 2)'))
    expect(await evaluator.evaluate(captured, '1+1', { abort_signal: abort.signal })).toEqual({ status: 'cancelled' })
    expect(exact(await evaluator.evaluate(captured, '1+1'))).toBe('2.0')
  })
})
