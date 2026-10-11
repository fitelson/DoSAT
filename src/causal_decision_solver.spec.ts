import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import type { Z3HighLevel } from 'z3-solver'
import { compile_decision_problem, type CompiledDecisionProblem } from './causal_decision'
import { CausalDecisionSolver, DEFAULT_FAST_ATTEMPT_MS, type DecisionEngine, type DecisionSession, type ExactDecisionValue } from './causal_decision_solver'
import { init_z3 } from './z3_integration'

const problem = (task: 'satisfiability' | 'entailment' = 'satisfiability'): CompiledDecisionProblem => compile_decision_problem({
  graph: 'X', premises: 'Pr(X) = 1/2', conclusion: task === 'entailment' ? 'Pr(X) > 0' : undefined, regular: false, task,
})
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail })
  return { promise, resolve, reject }
}
const fake = (status: 'sat' | 'unsat' | 'unknown' = 'sat') => {
  const session: DecisionSession = {
    load: vi.fn(), check: vi.fn().mockResolvedValue(status), reasonUnknown: vi.fn(() => 'incomplete mock search'),
    evaluateExact: vi.fn().mockResolvedValue({ defined: true, value: '(/ 1.0 2.0)' }), interrupt: vi.fn(), release: vi.fn(),
  }
  return session
}
const using = (...sessions: DecisionSession[]) => {
  const create = vi.fn(() => {
    const next = sessions.shift()
    if (!next) throw new Error('No mock session remains')
    return next
  })
  return { solver: new CausalDecisionSolver({} as Z3HighLevel, create), create }
}
const expectFastLoad = (session: DecisionSession, input: string): void => {
  expect(session.load).toHaveBeenCalledWith(input, expect.any(Number))
  const budget = vi.mocked(session.load).mock.calls[0][1]
  expect(Number.isInteger(budget)).toBe(true)
  expect(budget).toBeGreaterThan(0)
  expect(budget).toBeLessThanOrEqual(DEFAULT_FAST_ATTEMPT_MS)
}
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

describe('causal decision orchestration and ownership', () => {
  test('the native adapter matches PrSAT QF_NRA settings and reuses one context', async () => {
    const names: string[] = [], releases: ReturnType<typeof vi.fn>[] = []
    const context = {
      Solver: class {
        set = vi.fn()
        fromString = vi.fn()
        check = vi.fn().mockResolvedValue('unsat')
        reasonUnknown = vi.fn()
        release = vi.fn()
        constructor(name: string) { names.push(name); releases.push(this.release) }
      },
      interrupt: vi.fn(),
    }
    const Context = vi.fn(function () { return context })
    const solver = new CausalDecisionSolver({ Context } as unknown as Z3HighLevel)
    expect(await solver.decide(problem())).toEqual({ status: 'unsat' })
    expect(await solver.decide(problem())).toEqual({ status: 'unsat' })
    expect(Context).toHaveBeenCalledOnce()
    expect(names).toEqual(['QF_NRA', 'QF_NRA'])
    expect(releases).toHaveLength(2)
    releases.forEach(release => expect(release).toHaveBeenCalledOnce())
  })
  test('unbounded satisfiability returns an exact data snapshot and releases its session', async () => {
    const session = fake()
    const { solver } = using(session)
    const compiled = problem()
    const result = await solver.decide(compiled)
    expectFastLoad(session, compiled.premisesSmt)
    expect(result).toMatchObject({ status: 'sat', witness: { queries: [{ source: 'Pr(X)', defined: true, value: '(/ 1.0 2.0)' }], mechanisms: [{ node: 'X', value: '(/ 1.0 2.0)' }] } })
    expect(session.release).toHaveBeenCalledOnce()
    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
  })
  test('satisfiability UNSAT does not try to obtain a model', async () => {
    const session = fake('unsat')
    expect(await using(session).solver.decide(problem())).toEqual({ status: 'unsat' })
    expect(session.evaluateExact).not.toHaveBeenCalled()
    expect(session.release).toHaveBeenCalledOnce()
  })
  test('inconsistent premises are reported distinctly and skip the second stage', async () => {
    const session = fake('unsat')
    const { solver, create } = using(session)
    expect(await solver.decide(problem('entailment'))).toEqual({ status: 'inconsistent-premises' })
    expect(create).toHaveBeenCalledOnce()
    expect(session.evaluateExact).not.toHaveBeenCalled()
  })
  test('entailment checks consistency, then the exact compiled complement', async () => {
    const first = fake(), second = fake('unsat')
    const { solver } = using(first, second)
    const compiled = problem('entailment')
    expect(await solver.decide(compiled)).toEqual({ status: 'entailed' })
    expectFastLoad(first, compiled.premisesSmt)
    expectFastLoad(second, compiled.counterexampleSmt!)
    expect(first.evaluateExact).not.toHaveBeenCalled()
    expect(first.release).toHaveBeenCalledOnce()
    expect(second.release).toHaveBeenCalledOnce()
  })
  test('a satisfiable complement returns a countermodel', async () => {
    const first = fake(), second = fake()
    const result = await using(first, second).solver.decide(problem('entailment'))
    expect(result.status).toBe('not-entailed')
    expect(first.evaluateExact).not.toHaveBeenCalled()
    expect(second.evaluateExact).toHaveBeenCalled()
    expect(second.release).toHaveBeenCalledOnce()
  })
  test.each(['premises', 'counterexample'] as const)('unknown at %s remains unresolved', async (stage) => {
    const unknown = fake('unknown'), completeUnknown = fake('unknown')
    const { solver } = stage === 'premises' ? using(unknown, completeUnknown) : using(fake(), unknown, completeUnknown)
    expect(await solver.decide(problem('entailment'))).toEqual({ status: 'unknown', stage, reason: 'incomplete mock search' })
    expect(unknown.release).toHaveBeenCalledOnce()
    expect(completeUnknown.release).toHaveBeenCalledOnce()
  })
  test('pre-abort does no solver work', async () => {
    const abort = new AbortController(); abort.abort()
    const { solver, create } = using()
    expect(await solver.decide(problem(), { abort_signal: abort.signal })).toMatchObject({ status: 'cancelled', stage: 'premises' })
    expect(create).not.toHaveBeenCalled()
  })
  test('abort from the initial stage callback does no solver work', async () => {
    const abort = new AbortController()
    const { solver, create } = using()
    const result = await solver.decide(problem(), { abort_signal: abort.signal, on_stage: () => abort.abort() })
    expect(result.status).toBe('cancelled')
    expect(create).not.toHaveBeenCalled()
  })
  test('between-stage abort does not start a counterexample search', async () => {
    const first = fake(), abort = new AbortController()
    const { solver, create } = using(first)
    const result = await solver.decide(problem('entailment'), { abort_signal: abort.signal, on_stage: stage => { if (stage === 'counterexample') abort.abort() } })
    expect(result).toMatchObject({ status: 'cancelled', stage: 'counterexample' })
    expect(create).toHaveBeenCalledOnce()
    expect(first.release).toHaveBeenCalledOnce()
  })
  test('a queued counterexample-stage abort is delivered before the next native operation', async () => {
    const first = fake(), abort = new AbortController()
    const { solver, create } = using(first)
    const result = await solver.decide(problem('entailment'), {
      abort_signal: abort.signal,
      on_stage: stage => { if (stage === 'counterexample') queueMicrotask(() => abort.abort()) },
    })
    expect(result).toMatchObject({ status: 'cancelled', stage: 'counterexample' })
    expect(create).toHaveBeenCalledOnce()
    expect(first.release).toHaveBeenCalledOnce()
    expect(first.interrupt).not.toHaveBeenCalled()
  })
  test('interruption waits for the check to settle before release or subsequent reuse', async () => {
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), session = fake(), abort = new AbortController()
    session.check = vi.fn(() => check.promise)
    const { solver } = using(session, fake('unsat'))
    const running = solver.decide(problem(), { abort_signal: abort.signal })
    abort.abort()
    expect(session.interrupt).toHaveBeenCalledOnce()
    expect(session.release).not.toHaveBeenCalled()
    expect(await solver.decide(problem())).toMatchObject({ status: 'error', message: 'This decision solver is already running.' })
    check.resolve('unknown')
    expect((await running).status).toBe('cancelled')
    expect(session.release).toHaveBeenCalledOnce()
    expect(await solver.decide(problem())).toEqual({ status: 'unsat' })
  })
  test('a dropped first check interrupt is retried and never reaches a later run', async () => {
    vi.useFakeTimers()
    const intervals = vi.spyOn(globalThis, 'setInterval')
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), nextCheck = deferred<'sat' | 'unsat' | 'unknown'>(), session = fake(), later = fake('unsat'), abort = new AbortController()
    session.check = vi.fn(() => check.promise)
    later.check = vi.fn(() => nextCheck.promise)
    let attempts = 0
    session.interrupt = vi.fn(() => { if (++attempts === 2) check.resolve('unknown') })
    const { solver } = using(session, later)
    const running = solver.decide(problem(), { abort_signal: abort.signal })
    abort.abort()
    expect(session.interrupt).toHaveBeenCalledTimes(1)
    expect(session.release).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(await running).toMatchObject({ status: 'cancelled', stage: 'premises' })
    expect(session.interrupt).toHaveBeenCalledTimes(2)
    expect(session.release).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    const lateTick = intervals.mock.calls[0]?.[0]
    expect(typeof lateTick).toBe('function')
    const nextRun = solver.decide(problem())
    // Simulate a host callback already queued before clearInterval. It must not
    // reach the old session, whose reused native context now has a new check.
    if (typeof lateTick === 'function') lateTick()
    expect(session.interrupt).toHaveBeenCalledTimes(2)
    expect(later.interrupt).not.toHaveBeenCalled()
    nextCheck.resolve('unsat')
    expect(await nextRun).toEqual({ status: 'unsat' })
    await vi.advanceTimersByTimeAsync(1000)
    abort.abort()
    expect(session.interrupt).toHaveBeenCalledTimes(2)
    expect(later.interrupt).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('a dropped first witness interrupt is retried until evaluation settles', async () => {
    vi.useFakeTimers()
    const evaluation = deferred<ExactDecisionValue>(), session = fake(), later = fake('unsat'), abort = new AbortController()
    session.evaluateExact = vi.fn(() => evaluation.promise)
    let attempts = 0
    session.interrupt = vi.fn(() => { if (++attempts === 2) evaluation.resolve({ defined: true, value: '1.0' }) })
    const { solver } = using(session, later)
    const running = solver.decide(problem(), { abort_signal: abort.signal })
    await vi.advanceTimersByTimeAsync(0)
    expect(session.evaluateExact).toHaveBeenCalledOnce()
    abort.abort()
    expect(session.release).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(await running).toMatchObject({ status: 'cancelled', stage: 'witness' })
    expect(session.interrupt).toHaveBeenCalledTimes(2)
    expect(session.release).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    expect(await solver.decide(problem())).toEqual({ status: 'unsat' })
    await vi.advanceTimersByTimeAsync(1000)
    expect(later.interrupt).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('interrupt exceptions still allow a bounded retry and resource cleanup', async () => {
    vi.useFakeTimers()
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), session = fake(), abort = new AbortController()
    session.check = vi.fn(() => check.promise)
    let attempts = 0
    session.interrupt = vi.fn(() => {
      if (++attempts === 1) throw new Error('interrupt startup failed')
      check.resolve('unknown')
    })
    const running = using(session).solver.decide(problem(), { abort_signal: abort.signal })
    abort.abort()
    await vi.advanceTimersByTimeAsync(100)
    expect((await running).status).toBe('cancelled')
    expect(session.interrupt).toHaveBeenCalledTimes(2)
    expect(session.release).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('snapshot cancellation waits for exact evaluation and returns no partial witness', async () => {
    const evaluation = deferred<ExactDecisionValue>(), session = fake(), abort = new AbortController()
    session.evaluateExact = vi.fn(() => evaluation.promise)
    const running = using(session).solver.decide(problem(), { abort_signal: abort.signal })
    await vi.waitFor(() => expect(session.evaluateExact).toHaveBeenCalledOnce())
    abort.abort()
    expect(session.release).not.toHaveBeenCalled()
    evaluation.resolve({ defined: true, value: '1.0' })
    expect(await running).toMatchObject({ status: 'cancelled', stage: 'witness' })
    expect(session.release).toHaveBeenCalledOnce()
  })
  test('bounded expiry is UNKNOWN and awaits solver settlement', async () => {
    vi.useFakeTimers()
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), session = fake()
    session.check = vi.fn(() => check.promise)
    const running = using(session).solver.decide(problem(), { timeout_ms: 100 })
    await vi.advanceTimersByTimeAsync(100)
    expect(session.interrupt).toHaveBeenCalledOnce()
    expect(session.release).not.toHaveBeenCalled()
    check.resolve('unsat')
    expect(await running).toEqual({ status: 'unknown', stage: 'premises', reason: 'The decision time limit was reached.' })
    expect(session.release).toHaveBeenCalledOnce()
  })
  test('bounded expiry retries a dropped interrupt while preserving UNKNOWN', async () => {
    vi.useFakeTimers()
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), session = fake()
    session.check = vi.fn(() => check.promise)
    let attempts = 0
    session.interrupt = vi.fn(() => { if (++attempts === 2) check.resolve('sat') })
    const running = using(session).solver.decide(problem(), { timeout_ms: 50 })
    await vi.advanceTimersByTimeAsync(50)
    expect(session.interrupt).toHaveBeenCalledTimes(1)
    expect(session.release).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(await running).toEqual({ status: 'unknown', stage: 'premises', reason: 'The decision time limit was reached.' })
    expect(session.release).toHaveBeenCalledOnce()
    expect(session.evaluateExact).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('the counterexample stage uses the remaining whole-run time budget', async () => {
    vi.useFakeTimers()
    const first = fake(), second = fake('unsat')
    first.check = vi.fn(async () => { await vi.advanceTimersByTimeAsync(40); return 'sat' as const })
    const compiled = problem('entailment')
    expect(await using(first, second).solver.decide(compiled, { timeout_ms: 100 })).toEqual({ status: 'entailed' })
    expect(first.load).toHaveBeenCalledWith(compiled.premisesSmt, 100)
    expect(second.load).toHaveBeenCalledWith(compiled.counterexampleSmt, 60)
    expect(vi.getTimerCount()).toBe(0)
  })
  test.each([-1, 0.1, NaN, Infinity, 2_147_483_648])('invalid timeout %s does not start work', async (timeout_ms) => {
    const { solver, create } = using()
    expect(await solver.decide(problem(), { timeout_ms })).toMatchObject({ status: 'error' })
    expect(create).not.toHaveBeenCalled()
  })
  test('forged or replaced polynomial envelopes are rejected', async () => {
    const compiled = problem()
    const { solver, create } = using()
    expect(await solver.decide({ ...compiled, premisesSmt: '(set-logic ALL)' })).toMatchObject({ status: 'error', message: 'Expected a problem returned by compile_decision_problem.' })
    expect(create).not.toHaveBeenCalled()
  })
  test.each(['load', 'check', 'evaluateExact'] as const)('a %s exception is reported and resources are released', async (operation) => {
    const session = fake()
    if (operation === 'load') session.load = vi.fn(() => { throw new Error('load failed') })
    if (operation === 'check') session.check = vi.fn().mockRejectedValue(new Error('check failed'))
    if (operation === 'evaluateExact') session.evaluateExact = vi.fn().mockRejectedValue(new Error('evaluateExact failed'))
    expect(await using(session).solver.decide(problem())).toMatchObject({ status: 'error', stage: operation === 'evaluateExact' ? 'witness' : 'premises', message: `${operation} failed` })
    expect(session.release).toHaveBeenCalledOnce()
  })
  test('finished runs detach their abort listener', async () => {
    const session = fake('unsat'), abort = new AbortController()
    expect(await using(session).solver.decide(problem(), { abort_signal: abort.signal })).toEqual({ status: 'unsat' })
    abort.abort()
    expect(session.interrupt).not.toHaveBeenCalled()
  })
  test('release failure is an error and does not leave the wrapper busy', async () => {
    const session = fake('unsat')
    session.release = vi.fn(() => { throw new Error('release failed') })
    const { solver } = using(session, fake('unsat'))
    expect(await solver.decide(problem())).toMatchObject({ status: 'error', message: 'release failed' })
    expect(await solver.decide(problem())).toEqual({ status: 'unsat' })
  })
  test('an undefined probability is preserved in a countermodel snapshot', async () => {
    const second = fake()
    second.evaluateExact = vi.fn(async (expression): Promise<ExactDecisionValue> => expression.tag === 'divide' ? { defined: false } : { defined: true, value: '0.0' })
    const compiled = compile_decision_problem({ graph: 'X', premises: 'Pr(X) = 0', conclusion: 'Pr(X | X) = 1', regular: false, task: 'entailment' })
    const result = await using(fake(), second).solver.decide(compiled)
    expect(result).toMatchObject({ status: 'not-entailed', witness: { queries: expect.arrayContaining([{ source: 'Pr(X | X)', defined: false }]) } })
  })
  test.each(['sat', 'unsat'] as const)('fast UNKNOWN falls back to explicit complete search returning %s', async (status) => {
    const fast = fake('unknown'), complete = fake(status), engines: DecisionEngine[] = []
    const { solver, create } = using(fast, complete)
    const compiled = problem()
    const result = await solver.decide(compiled, { on_engine: engine => engines.push(engine) })
    expect(result.status).toBe(status)
    expect(engines).toEqual(['fast', 'complete'])
    expect(create.mock.calls).toEqual([['fast'], ['complete']])
    expectFastLoad(fast, compiled.premisesSmt)
    expect(complete.load).toHaveBeenCalledWith(compiled.premisesSmt, 0)
    expect(fast.release).toHaveBeenCalledOnce()
    expect(complete.release).toHaveBeenCalledOnce()
    expect(fast.evaluateExact).not.toHaveBeenCalled()
  })
  test('each entailment stage independently gets a finite fast attempt and complete fallback', async () => {
    const sessions = [fake('unknown'), fake(), fake('unknown'), fake('unsat')]
    const { solver, create } = using(...sessions)
    expect(await solver.decide(problem('entailment'))).toEqual({ status: 'entailed' })
    expect(create.mock.calls).toEqual([['fast'], ['complete'], ['fast'], ['complete']])
    sessions.forEach(session => expect(session.release).toHaveBeenCalledOnce())
    expect(sessions[1].evaluateExact).not.toHaveBeenCalled()
  })
  test('local fast expiry waits for settlement and release before complete fallback', async () => {
    vi.useFakeTimers()
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), fast = fake(), complete = fake('unsat')
    fast.check = vi.fn(() => check.promise)
    let attempts = 0
    fast.interrupt = vi.fn(() => { if (++attempts === 2) check.resolve('sat') })
    complete.load = vi.fn(() => expect(fast.release).toHaveBeenCalledOnce())
    const { solver, create } = using(fast, complete)
    const running = solver.decide(problem(), { fast_timeout_ms: 5 })
    await vi.advanceTimersByTimeAsync(5)
    expect(fast.interrupt).toHaveBeenCalledOnce()
    expect(fast.release).not.toHaveBeenCalled()
    expect(create).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(100)
    expect(await running).toEqual({ status: 'unsat' })
    expect(create.mock.calls).toEqual([['fast'], ['complete']])
    expect(fast.evaluateExact).not.toHaveBeenCalled()
    expect(complete.release).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('a rejected interrupted fast check still falls back after local expiry', async () => {
    vi.useFakeTimers()
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), fast = fake(), complete = fake('unsat')
    fast.check = vi.fn(() => check.promise)
    fast.interrupt = vi.fn(() => check.reject(new Error('native check interrupted')))
    complete.load = vi.fn(() => expect(fast.release).toHaveBeenCalledOnce())
    const { solver, create } = using(fast, complete)
    const running = solver.decide(problem(), { fast_timeout_ms: 5 })
    await vi.advanceTimersByTimeAsync(5)
    expect(await running).toEqual({ status: 'unsat' })
    expect(create.mock.calls).toEqual([['fast'], ['complete']])
    expect(fast.release).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('whole-run cancellation after local fast expiry never starts fallback', async () => {
    vi.useFakeTimers()
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), fast = fake(), abort = new AbortController()
    fast.check = vi.fn(() => check.promise)
    const { solver, create } = using(fast)
    const running = solver.decide(problem(), { fast_timeout_ms: 5, abort_signal: abort.signal })
    await vi.advanceTimersByTimeAsync(5)
    abort.abort()
    expect(fast.release).not.toHaveBeenCalled()
    check.resolve('unknown')
    expect((await running).status).toBe('cancelled')
    expect(create.mock.calls).toEqual([['fast']])
    expect(fast.release).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('the whole deadline during fast cleanup prevents fallback', async () => {
    vi.useFakeTimers()
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), fast = fake()
    fast.check = vi.fn(() => check.promise)
    let attempts = 0
    fast.interrupt = vi.fn(() => { if (++attempts === 2) check.resolve('unknown') })
    const { solver, create } = using(fast)
    const running = solver.decide(problem(), { fast_timeout_ms: 50, timeout_ms: 100 })
    await vi.advanceTimersByTimeAsync(100)
    expect(await running).toEqual({ status: 'unknown', stage: 'premises', reason: 'The decision time limit was reached.' })
    expect(create.mock.calls).toEqual([['fast']])
    expect(fast.release).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('fallback cancellation retries a dropped interrupt and leaves no callbacks on reuse', async () => {
    vi.useFakeTimers()
    const intervals = vi.spyOn(globalThis, 'setInterval')
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), fast = fake('unknown'), complete = fake(), next = fake('unsat'), abort = new AbortController()
    complete.check = vi.fn(() => check.promise)
    let attempts = 0
    complete.interrupt = vi.fn(() => { if (++attempts === 2) check.resolve('unknown') })
    const { solver, create } = using(fast, complete, next)
    const running = solver.decide(problem(), { abort_signal: abort.signal })
    await vi.advanceTimersByTimeAsync(0)
    expect(complete.check).toHaveBeenCalledOnce()
    abort.abort()
    expect(complete.release).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(await running).toMatchObject({ status: 'cancelled', stage: 'premises' })
    expect(complete.interrupt).toHaveBeenCalledTimes(2)
    expect(complete.release).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    const oldTick = intervals.mock.calls[0]?.[0]
    const later = solver.decide(problem())
    if (typeof oldTick === 'function') oldTick()
    expect(await later).toEqual({ status: 'unsat' })
    expect(create.mock.calls).toEqual([['fast'], ['complete'], ['fast']])
    expect(complete.interrupt).toHaveBeenCalledTimes(2)
    expect(next.interrupt).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('an already queued old fast-cap callback cannot interrupt the complete fallback', async () => {
    vi.useFakeTimers()
    const timers = vi.spyOn(globalThis, 'setTimeout')
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), fast = fake('unknown'), complete = fake(), later = fake('unsat')
    complete.check = vi.fn(() => check.promise)
    const { solver } = using(fast, complete, later)
    const running = solver.decide(problem())
    await vi.advanceTimersByTimeAsync(0)
    expect(complete.check).toHaveBeenCalledOnce()
    expect(complete.release).not.toHaveBeenCalled()
    const oldCap = timers.mock.calls.find(([, delay]) => delay === DEFAULT_FAST_ATTEMPT_MS)?.[0]
    expect(typeof oldCap).toBe('function')
    if (typeof oldCap === 'function') oldCap()
    expect(complete.interrupt).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    check.resolve('unsat')
    expect(await running).toEqual({ status: 'unsat' })
    expect(await solver.decide(problem())).toEqual({ status: 'unsat' })
    if (typeof oldCap === 'function') oldCap()
    expect(later.interrupt).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('fallback uses the remaining deadline and keeps pending handles until settlement', async () => {
    vi.useFakeTimers()
    const check = deferred<'sat' | 'unsat' | 'unknown'>(), fast = fake('unknown'), complete = fake()
    fast.check = vi.fn(async () => { await vi.advanceTimersByTimeAsync(20); return 'unknown' as const })
    complete.check = vi.fn(() => check.promise)
    let attempts = 0
    complete.interrupt = vi.fn(() => { if (++attempts === 2) check.resolve('unsat') })
    const compiled = problem(), { solver } = using(fast, complete)
    const running = solver.decide(compiled, { timeout_ms: 100 })
    await vi.advanceTimersByTimeAsync(0)
    expect(complete.load).toHaveBeenCalledWith(compiled.premisesSmt, 80)
    await vi.advanceTimersByTimeAsync(80)
    expect(complete.release).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(await running).toEqual({ status: 'unknown', stage: 'premises', reason: 'The decision time limit was reached.' })
    expect(complete.release).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('the fast search cap is cleared before exact witness extraction', async () => {
    vi.useFakeTimers()
    const evaluation = deferred<ExactDecisionValue>(), fast = fake()
    vi.mocked(fast.evaluateExact).mockImplementationOnce(() => evaluation.promise)
    const { solver, create } = using(fast)
    const running = solver.decide(problem(), { fast_timeout_ms: 1 })
    await vi.advanceTimersByTimeAsync(0)
    expect(fast.evaluateExact).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(100)
    expect(fast.interrupt).not.toHaveBeenCalled()
    evaluation.resolve({ defined: true, value: '(/ 1.0 2.0)' })
    expect((await running).status).toBe('sat')
    expect(create.mock.calls).toEqual([['fast']])
    expect(vi.getTimerCount()).toBe(0)
  })
  test('a witness error after the local fast deadline remains ERROR without fallback and permits reuse', async () => {
    vi.useFakeTimers()
    const fast = fake(), fallback = fake('unsat'), reuse = fake('unsat')
    fast.evaluateExact = vi.fn(async () => {
      await vi.advanceTimersByTimeAsync(2)
      throw new Error('Exact witness extraction failed after the local search deadline.')
    })
    let fastRuns = 0
    const create = vi.fn((engine: DecisionEngine) => engine === 'complete' ? fallback : fastRuns++ === 0 ? fast : reuse)
    const solver = new CausalDecisionSolver({} as Z3HighLevel, create)
    expect(await solver.decide(problem(), { fast_timeout_ms: 1 })).toEqual({
      status: 'error', stage: 'witness', message: 'Exact witness extraction failed after the local search deadline.',
    })
    expect(create.mock.calls).toEqual([['fast']])
    expect(fast.release).toHaveBeenCalledOnce()
    expect(fast.interrupt).not.toHaveBeenCalled()
    expect(fallback.load).not.toHaveBeenCalled()
    expect(fallback.release).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    expect(await solver.decide(problem(), { fast_timeout_ms: 1 })).toEqual({ status: 'unsat' })
    expect(create.mock.calls).toEqual([['fast'], ['fast']])
    expect(reuse.release).toHaveBeenCalledOnce()
    expect(fallback.load).not.toHaveBeenCalled()
    expect(fallback.release).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  test('an already queued fast-cap callback cannot interrupt an in-budget witness', async () => {
    vi.useFakeTimers()
    const timers = vi.spyOn(globalThis, 'setTimeout')
    const evaluation = deferred<ExactDecisionValue>(), fast = fake()
    vi.mocked(fast.evaluateExact).mockImplementationOnce(() => evaluation.promise)
    const { solver, create } = using(fast)
    const running = solver.decide(problem(), { fast_timeout_ms: 1 })
    await vi.advanceTimersByTimeAsync(0)
    expect(fast.evaluateExact).toHaveBeenCalledOnce()
    const oldCap = timers.mock.calls.find(([, delay]) => delay === 1)?.[0]
    expect(typeof oldCap).toBe('function')
    if (typeof oldCap === 'function') oldCap()
    expect(fast.interrupt).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    evaluation.resolve({ defined: true, value: '(/ 1.0 2.0)' })
    expect((await running).status).toBe('sat')
    expect(create.mock.calls).toEqual([['fast']])
    expect(vi.getTimerCount()).toBe(0)
  })
  test.each([0, -1, 0.1, NaN, Infinity, 2_147_483_648])('invalid fast cap %s is rejected before work', async fast_timeout_ms => {
    const { solver, create } = using()
    expect(await solver.decide(problem(), { fast_timeout_ms })).toMatchObject({ status: 'error' })
    expect(create).not.toHaveBeenCalled()
  })
  test('the complete fallback is explicit qfnra-nlsat and its tactic/context are reused', async () => {
    const engines: string[] = [], releases: ReturnType<typeof vi.fn>[] = []
    const makeSolver = (status: 'unsat' | 'unknown') => {
      const release = vi.fn(); releases.push(release)
      return { set: vi.fn(), fromString: vi.fn(), check: vi.fn().mockResolvedValue(status), reasonUnknown: vi.fn(() => 'fast unknown'), release }
    }
    const context = {
      Solver: vi.fn(function (logic: string) { engines.push(logic); return makeSolver('unknown') }),
      Tactic: vi.fn(function (name: string) { engines.push(name); return { solver: () => makeSolver('unsat') } }),
      interrupt: vi.fn(),
    }
    const Context = vi.fn(function () { return context })
    const solver = new CausalDecisionSolver({ Context } as unknown as Z3HighLevel)
    expect(await solver.decide(problem())).toEqual({ status: 'unsat' })
    expect(await solver.decide(problem())).toEqual({ status: 'unsat' })
    expect(Context).toHaveBeenCalledOnce()
    expect(engines).toEqual(['QF_NRA', 'qfnra-nlsat', 'QF_NRA'])
    expect(releases).toHaveLength(4)
    releases.forEach(release => expect(release).toHaveBeenCalledOnce())
  })
})

describe('native QF_NRA causal decisions', () => {
  let solver: CausalDecisionSolver
  beforeAll(async () => { solver = new CausalDecisionSolver(await init_z3()) })
  const run = (premises: string, conclusion?: string, graph = 'X', regular = false) => solver.decide(compile_decision_problem({ graph, premises, conclusion, regular, task: conclusion === undefined ? 'satisfiability' : 'entailment' }))

  test('exact rational witness and free parameter exceed floating-point precision safely', async () => {
    const result = await run('Pr(X) = 9007199254740993 / 18014398509481986\na = 9007199254740993')
    expect(result.status).toBe('sat')
    if (result.status !== 'sat') throw new Error('Expected SAT')
    expect(result.witness.queries).toContainEqual({ source: 'Pr(X)', defined: true, value: '(/ 1.0 2.0)' })
    expect(result.witness.freeParameters).toContainEqual({ variable: 'a', value: '9007199254740993.0' })
  })
  test('algebraic values remain exact root objects in the detached snapshot', async () => {
    const result = await run('Pr(X)^2 = 1/2')
    expect(result.status).toBe('sat')
    if (result.status !== 'sat') throw new Error('Expected SAT')
    expect(result.witness.mechanisms[0].value).toContain('root-obj')
    expect(result.witness.queries[0]).toMatchObject({ defined: true, value: expect.stringContaining('root-obj') })
    expect(await run('Pr(X) = 0\nPr(X) = 1')).toEqual({ status: 'unsat' })
    expect(result.witness.mechanisms[0].value).toContain('root-obj')
  })
  test('regular child mechanism entails its single-step do equality', async () => {
    expect(await run('', 'Pr(Y | do(X=1)) = Pr(Y | X)', 'X -> Y', true)).toEqual({ status: 'entailed' })
  })
  test('undefined conditional conclusion is a real countermodel, not vacuous entailment', async () => {
    const result = await run('Pr(X) = 0', 'Pr(X | X) = 1')
    expect(result).toMatchObject({ status: 'not-entailed', witness: { queries: expect.arrayContaining([{ source: 'Pr(X | X)', defined: false }]) } })
  })
  test('inconsistent premises are distinguished from a substantive entailment', async () => {
    expect(await run('Pr(X) = 0\nPr(X) = 1', 'Pr(X) > 0')).toEqual({ status: 'inconsistent-premises' })
  })
  test('a real context interrupted before witness extraction remains reusable', async () => {
    const abort = new AbortController()
    const result = await solver.decide(problem(), { abort_signal: abort.signal, on_stage: stage => { if (stage === 'witness') abort.abort() } })
    expect(result).toMatchObject({ status: 'cancelled', stage: 'witness' })
    expect((await run('Pr(X) = 1/2')).status).toBe('sat')
  })
  test('a counterexample-start microtask abort settles the six-node repro and permits reuse', async () => {
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F']
    const graph = nodes.flatMap((from, index) => nodes.slice(index + 1).map(to => `${from} -> ${to}`)).join('\n')
    const compiled = compile_decision_problem({ graph, premises: '', conclusion: 'Pr(F | do(A=1)) = Pr(F | A)', regular: true, task: 'entailment' })
    const abort = new AbortController()
    let cancelledAt: number | undefined
    const result = await solver.decide(compiled, {
      abort_signal: abort.signal,
      on_stage: stage => {
        if (stage === 'counterexample') queueMicrotask(() => { cancelledAt = performance.now(); abort.abort() })
      },
    })
    expect(result).toMatchObject({ status: 'cancelled', stage: 'counterexample' })
    if (cancelledAt === undefined) throw new Error('The counterexample cancellation microtask did not run.')
    expect(performance.now() - cancelledAt).toBeLessThanOrEqual(2000)
    expect(await run('Pr(X) = 0\nPr(X) = 1')).toEqual({ status: 'unsat' })
  }, 15_000)
  test('cancellation of an already running six-node native check settles and permits reuse', async () => {
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F']
    const graph = nodes.flatMap((from, index) => nodes.slice(index + 1).map(to => `${from} -> ${to}`)).join('\n')
    const compiled = compile_decision_problem({ graph, premises: '', conclusion: 'Pr(F | do(A=1)) = Pr(F | A)', regular: true, task: 'entailment' })
    const abort = new AbortController()
    let cancelledAt: number | undefined, cancelTimer: ReturnType<typeof setTimeout> | undefined
    try {
      const result = await solver.decide(compiled, {
        abort_signal: abort.signal,
        on_stage: stage => {
          if (stage === 'counterexample') cancelTimer = setTimeout(() => { cancelledAt = performance.now(); abort.abort() }, 50)
        },
      })
      expect(result).toMatchObject({ status: 'cancelled', stage: 'counterexample' })
      if (cancelledAt === undefined) throw new Error('The pending-check cancellation timer did not run.')
      expect(performance.now() - cancelledAt).toBeLessThanOrEqual(2000)
      expect(await run('Pr(X) = 0\nPr(X) = 1')).toEqual({ status: 'unsat' })
    } finally { if (cancelTimer !== undefined) clearTimeout(cancelTimer) }
  }, 15_000)
  test('a finite fast cap reaches a real explicit NLSat model and leaves the wrapper reusable', async () => {
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F']
    const graph = nodes.flatMap((from, index) => nodes.slice(index + 1).map(to => `${from} -> ${to}`)).join('\n')
    const compiled = compile_decision_problem({ graph, premises: 'Pr(F) = 1/2', regular: true, task: 'satisfiability' })
    const engines: DecisionEngine[] = []
    const result = await solver.decide(compiled, { fast_timeout_ms: 1, on_engine: engine => engines.push(engine) })
    expect(result.status).toBe('sat')
    expect(engines).toEqual(['fast', 'complete'])
    if (result.status !== 'sat') throw new Error('Expected an exact NLSat witness.')
    expect(result.witness.queries).toContainEqual({ source: 'Pr(F)', defined: true, value: '(/ 1.0 2.0)' })
    expect(await run('Pr(X) = 0\nPr(X) = 1')).toEqual({ status: 'unsat' })
  }, 15_000)
  test('a real explicit fallback can be cancelled while pending and reused afterward', async () => {
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F']
    const graph = nodes.flatMap((from, index) => nodes.slice(index + 1).map(to => `${from} -> ${to}`)).join('\n')
    const compiled = compile_decision_problem({ graph, premises: '', conclusion: 'Pr(F | do(A=1)) = Pr(F | A)', regular: true, task: 'entailment' })
    const abort = new AbortController(), engines: string[] = []
    let cancelledAt: number | undefined, cancelTimer: ReturnType<typeof setTimeout> | undefined
    try {
      const result = await solver.decide(compiled, {
        fast_timeout_ms: 1, abort_signal: abort.signal,
        on_engine: (engine, stage) => {
          engines.push(`${stage}:${engine}`)
          if (engine === 'complete' && stage === 'counterexample') cancelTimer = setTimeout(() => { cancelledAt = performance.now(); abort.abort() }, 50)
        },
      })
      expect(engines).toContain('counterexample:complete')
      expect(result).toMatchObject({ status: 'cancelled', stage: 'counterexample' })
      if (cancelledAt === undefined) throw new Error('The pending NLSat cancellation timer did not run.')
      expect(performance.now() - cancelledAt).toBeLessThanOrEqual(2000)
      expect(await run('Pr(X) = 0\nPr(X) = 1')).toEqual({ status: 'unsat' })
    } finally { if (cancelTimer !== undefined) clearTimeout(cancelTimer) }
  }, 15_000)
  test('the whole-run deadline settles a pending real explicit fallback as UNKNOWN', async () => {
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F']
    const graph = nodes.flatMap((from, index) => nodes.slice(index + 1).map(to => `${from} -> ${to}`)).join('\n')
    const compiled = compile_decision_problem({ graph, premises: '', conclusion: 'Pr(F | do(A=1)) = Pr(F | A)', regular: true, task: 'entailment' })
    const engines: string[] = []
    const result = await solver.decide(compiled, {
      fast_timeout_ms: 1, timeout_ms: 5000,
      on_engine: (engine, stage) => engines.push(`${stage}:${engine}`),
    })
    expect(engines).toContain('counterexample:complete')
    expect(result).toEqual({ status: 'unknown', stage: 'counterexample', reason: 'The decision time limit was reached.' })
    expect(await run('Pr(X) = 0\nPr(X) = 1')).toEqual({ status: 'unsat' })
  }, 15_000)
})
