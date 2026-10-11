import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import type { WrappedSolverResult } from './z3_integration'

const solverMocks = vi.hoisted(() => ({
  initialize: vi.fn<() => Promise<unknown>>(),
  solve: vi.fn<(_smtlib: string, _milliseconds: number, _signal?: AbortSignal) => Promise<WrappedSolverResult>>(),
  reinitialize: undefined as (() => Promise<unknown>) | undefined,
}))

vi.mock('./z3_integration', () => ({
  init_z3: solverMocks.initialize,
  WrappedSolver: class {
    constructor(_value: unknown, reinitialize: () => Promise<unknown>) {
      solverMocks.reinitialize = reinitialize
    }
    solve(smtlib: string, milliseconds: number, signal?: AbortSignal): Promise<WrappedSolverResult> {
      return solverMocks.solve(smtlib, milliseconds, signal)
    }
  },
}))

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

type ExactResult = { defined: boolean, value?: string }
const sat_output = (evaluate: (_expression: unknown) => Promise<ExactResult>): WrappedSolverResult => ({
  status: 'sat',
  evaluate_exact: evaluate,
  state_assignments: {},
  evaluate: async () => { throw new Error('The causal UI should use exact evaluation.') },
})

let dom: JSDOM
const node = <T extends HTMLElement>(testId: string): T => {
  const found = dom.window.document.querySelector(`[data-testid="${testId}"]`)
  if (!found) throw new Error(`Missing UI element ${testId}`)
  return found as T
}
const find = (): HTMLButtonElement => node('causal-find')
const cancel = (): HTMLButtonElement => node('causal-cancel')
const graph = (): HTMLTextAreaElement => node('causal-graph')
const constraints = (): HTMLTextAreaElement => node('causal-constraints')
const text = (testId: string): string => node(testId).textContent ?? ''
const flush = async (): Promise<void> => {
  // Only promises are involved in the mocked solver, init, and file reads.
  for (let turn = 0; turn < 20; turn += 1) await Promise.resolve()
}
const edit = (input: HTMLTextAreaElement | HTMLInputElement, value: string): void => {
  input.value = value
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
}
const simple_problem = (): void => {
  edit(graph(), 'X')
  edit(constraints(), 'Pr(X) = 1/2')
}
const snapshot = () => ({
  findDisabled: find().disabled,
  cancelDisabled: cancel().disabled,
  z3: text('causal-z3-status'),
  status: text('causal-status'),
  results: text('causal-results'),
})
const load = (read: () => Promise<string>, size = 100): HTMLInputElement => {
  const input = dom.window.document.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', { configurable: true, value: [{ size, text: read }] })
  input.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
  return input
}
const problem_file = (graphText: string, constraintText: string): string => JSON.stringify({
  version: 1, graph: graphText, constraints: constraintText, regular: false,
})
const start_ui = async (): Promise<void> => {
  await import('./causal_ui')
  await flush()
}

beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
  vi.useFakeTimers()
  solverMocks.reinitialize = undefined
  solverMocks.initialize.mockResolvedValue({})
  solverMocks.solve.mockResolvedValue({ status: 'unknown' })
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', { url: 'http://localhost/' })
  vi.stubGlobal('document', dom.window.document)
  vi.stubGlobal('window', dom.window)
})

afterEach(() => {
  dom.window.close()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('causal UI solver lifecycle', () => {
  test('disables search until asynchronous initialization completes', async () => {
    const initialization = deferred<unknown>()
    solverMocks.initialize.mockReturnValue(initialization.promise)
    await start_ui()
    expect(snapshot()).toMatchInlineSnapshot(`
      {
        "cancelDisabled": true,
        "findDisabled": true,
        "results": "",
        "status": "Enter a causal graph and constraints.",
        "z3": "Loading Z3…",
      }
    `)
    find().dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    expect(solverMocks.solve).not.toHaveBeenCalled()
    initialization.resolve({})
    await flush()
    expect(find().disabled).toBe(false)
    expect(text('causal-z3-status')).toBe('Z3 ready.')
  })

  test('keeps search disabled while a cancelled solver reloads, even after solve returns', async () => {
    await start_ui()
    simple_problem()
    const cancelled = deferred<WrappedSolverResult>()
    const reload = deferred<unknown>()
    solverMocks.initialize.mockReturnValueOnce(reload.promise)
    solverMocks.solve.mockImplementationOnce(async (_smtlib, _milliseconds, signal) => {
      signal?.addEventListener('abort', () => {
        void solverMocks.reinitialize?.()
        cancelled.resolve({ status: 'cancelled' })
      }, { once: true })
      return cancelled.promise
    })
    find().click()
    expect(find().disabled).toBe(true)
    expect(cancel().disabled).toBe(false)
    cancel().click()
    await flush()
    expect(snapshot()).toMatchInlineSnapshot(`
      {
        "cancelDisabled": true,
        "findDisabled": true,
        "results": "",
        "status": "Cancelled.",
        "z3": "Reloading Z3 after cancellation…",
      }
    `)
    // Programmatic events also hit the handler, bypassing the disabled button.
    find().dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    await flush()
    expect(solverMocks.solve).toHaveBeenCalledTimes(1)
    reload.resolve({})
    await flush()
    expect(find().disabled).toBe(false)
    expect(text('causal-z3-status')).toBe('Z3 ready.')
    find().click()
    await flush()
    expect(solverMocks.solve).toHaveBeenCalledTimes(2)
  })

  test('reinitialization failure leaves search disabled and exposes the failure', async () => {
    await start_ui()
    const reload = deferred<unknown>()
    solverMocks.initialize.mockReturnValueOnce(reload.promise)
    const reinitialization = solverMocks.reinitialize!().catch((error: unknown) => error)
    expect(find().disabled).toBe(true)
    reload.reject(new Error('worker reload failed'))
    await reinitialization
    await flush()
    expect(find().disabled).toBe(true)
    expect(text('causal-z3-status')).toBe('Z3 failed to reload: worker reload failed')
    find().dispatchEvent(new dom.window.MouseEvent('click'))
    expect(solverMocks.solve).not.toHaveBeenCalled()
  })

  test.each(['first', 'last'] as const)('cancellation during the %s exact evaluation does not display a model', async (pendingPosition) => {
    await start_ui()
    simple_problem()
    const pendingEvaluation = deferred<ExactResult>()
    let calls = 0
    // One input query, one mechanism, and two observational table rows.
    const pendingCall = pendingPosition === 'first' ? 1 : 4
    const evaluator = vi.fn(async () => {
      calls += 1
      return calls === pendingCall ? pendingEvaluation.promise : { defined: true, value: '(/ 1.0 2.0)' }
    })
    solverMocks.solve.mockResolvedValueOnce(sat_output(evaluator))
    find().click()
    await flush()
    expect(evaluator).toHaveBeenCalledTimes(pendingCall)
    expect(cancel().disabled).toBe(false)
    cancel().click()
    pendingEvaluation.resolve({ defined: true, value: '(/ 1.0 2.0)' })
    await flush()
    expect(text('causal-status')).toBe('Cancelled.')
    expect(text('causal-results')).toBe('')
    expect(text('causal-results')).not.toContain('compatible causal model')
    expect(find().disabled).toBe(false)
  })

  test('input edits abort an active solve and prevent the stale result from rendering', async () => {
    await start_ui()
    simple_problem()
    const output = deferred<WrappedSolverResult>()
    solverMocks.solve.mockReturnValueOnce(output.promise)
    find().click()
    const signal = solverMocks.solve.mock.calls[0][2]!
    edit(constraints(), 'Pr(X)=3/4')
    expect(signal.aborted).toBe(true)
    output.resolve(sat_output(async () => ({ defined: true, value: '(/ 1.0 2.0)' })))
    await flush()
    expect(snapshot()).toMatchInlineSnapshot(`
      {
        "cancelDisabled": true,
        "findDisabled": false,
        "results": "",
        "status": "Input changed; find a model for the current constraints.",
        "z3": "Z3 ready.",
      }
    `)
    expect(constraints().value).toBe('Pr(X)=3/4')
  })

  test('a completed model displays exact query and mechanism values', async () => {
    await start_ui()
    simple_problem()
    const evaluate = vi.fn(async () => ({ defined: true, value: '(/ 9007199254740993.0 18014398509481986.0)' }))
    solverMocks.solve.mockResolvedValueOnce(sat_output(evaluate))
    find().click()
    await flush()
    expect(text('causal-status')).toBe('SAT — a compatible causal model was found.')
    expect(text('causal-query-table')).toContain('Pr(X)9007199254740993/18014398509481986')
    expect(text('causal-mechanism-table')).toContain('9007199254740993/18014398509481986')
    expect(evaluate).toHaveBeenCalledTimes(4)
  })
})

describe('causal UI asynchronous problem loading', () => {
  test('an older file read cannot overwrite subsequent manual input edits', async () => {
    await start_ui()
    const fileRead = deferred<string>()
    load(() => fileRead.promise)
    edit(graph(), 'Y')
    edit(constraints(), 'Pr(Y)=1/3')
    fileRead.resolve(problem_file('X', 'Pr(X)=1/2'))
    await flush()
    expect(graph().value).toBe('Y')
    expect(constraints().value).toBe('Pr(Y)=1/3')
    expect(text('causal-status')).toBe('Input changed; find a model for the current constraints.')
  })

  test('an older file read cannot overwrite a newer successful file selection', async () => {
    await start_ui()
    const oldRead = deferred<string>()
    load(() => oldRead.promise)
    load(async () => problem_file('Y', 'Pr(Y)=3/4'))
    await flush()
    oldRead.resolve(problem_file('X', 'Pr(X)=1/2'))
    await flush()
    expect(graph().value).toBe('Y')
    expect(constraints().value).toBe('Pr(Y)=3/4')
    expect(find().disabled).toBe(false)
  })

  test('an older successful read cannot hide an error from a newer file selection', async () => {
    await start_ui()
    simple_problem()
    const oldRead = deferred<string>()
    load(() => oldRead.promise)
    load(async () => JSON.stringify({ version: 2 }))
    await flush()
    expect(text('causal-status')).toBe('Load error: Expected a PrSATdo version 1 problem file.')
    oldRead.resolve(problem_file('Y', 'Pr(Y)=3/4'))
    await flush()
    expect(graph().value).toBe('X')
    expect(constraints().value).toBe('Pr(X) = 1/2')
    expect(text('causal-status')).toBe('Load error: Expected a PrSATdo version 1 problem file.')
  })

  test('an older rejected read cannot overwrite a newer load error', async () => {
    await start_ui()
    const oldRead = deferred<string>()
    load(() => oldRead.promise)
    load(async () => '', 100_001)
    await flush()
    oldRead.reject(new Error('stale read failure'))
    await flush()
    expect(text('causal-status')).toBe('Load error: Saved problem is too large (maximum 100 KB).')
  })

  test('a stale read error cannot overwrite manual edit status', async () => {
    await start_ui()
    const oldRead = deferred<string>()
    load(() => oldRead.promise)
    edit(constraints(), 'Pr(Y)=1/3')
    oldRead.reject(new Error('read failed'))
    await flush()
    expect(text('causal-status')).toBe('Input changed; find a model for the current constraints.')
    expect(constraints().value).toBe('Pr(Y)=1/3')
  })
})

describe('causal UI search limits', () => {
  test.each([['16.1', 16100], ['32.2', 32200], ['1.0005', 1001]] as const)('converts accepted %s seconds to native integer milliseconds', async (seconds, expectedMilliseconds) => {
    await start_ui()
    simple_problem()
    edit(node<HTMLInputElement>('causal-timeout'), seconds)
    find().click()
    await flush()
    const milliseconds = solverMocks.solve.mock.calls[0][1]
    expect(milliseconds).toBe(expectedMilliseconds)
    expect(Number.isInteger(milliseconds)).toBe(true)
    expect(text('causal-status')).toContain('UNKNOWN')
  })

  test('timer expiry reports UNKNOWN rather than a causal verdict', async () => {
    await start_ui()
    simple_problem()
    edit(node<HTMLInputElement>('causal-timeout'), '0.1')
    solverMocks.solve.mockImplementationOnce((_smtlib, _milliseconds, signal) => new Promise(resolve => {
      signal?.addEventListener('abort', () => resolve({ status: 'cancelled' }), { once: true })
    }))
    find().click()
    await flush()
    expect(text('causal-status')).toBe('Searching for a causal model…')
    await vi.advanceTimersByTimeAsync(100)
    await flush()
    expect(text('causal-status')).toBe('UNKNOWN — time limit reached.')
    expect(text('causal-results')).toBe('')
    expect(find().disabled).toBe(false)
  })
})
