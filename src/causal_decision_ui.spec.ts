import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import type { CausalDecisionResult } from './causal_decision_solver'
const mocks = vi.hoisted(() => ({ init: vi.fn(), decide: vi.fn(), download: vi.fn() }))
vi.mock('./z3_integration', () => ({ init_z3: mocks.init }))
vi.mock('./causal_decision_solver', () => ({ CausalDecisionSolver: class { decide = mocks.decide } }))
vi.mock('./download', () => ({ download: mocks.download }))
let dom: JSDOM
const node = <T extends HTMLElement>(id: string): T => dom.window.document.querySelector(`[data-testid="${id}"]`) as T
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }
const change = (id: string, value: string) => { const input = node<HTMLInputElement>(id); input.value = value; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })) }
const pending = <T>() => { let resolve!: (value: T) => void, reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const load = (read: () => Promise<string>, size = 100) => { const field = node<HTMLInputElement>('decision-load'); Object.defineProperty(field, 'files', { configurable: true, value: [{ size, text: read }] }); field.dispatchEvent(new dom.window.Event('change')) }
const saved = (overrides: Record<string, unknown> = {}) => JSON.stringify({ version: 1, kind: 'DoSAT-decision', task: 'entailment', graph: 'A', premises: 'Pr(A)=1/2', conclusion: 'Pr(A)>0', regular: false, mode: 'complete', seconds: 30, ...overrides })
beforeEach(async () => {
  vi.resetModules(); vi.resetAllMocks(); mocks.init.mockResolvedValue({ getVersionString: () => '5.1.0' }); mocks.decide.mockResolvedValue({ status: 'entailed' })
  dom = new JSDOM('<div id="app"></div>'); vi.stubGlobal('document', dom.window.document)
  await import('./causal_decision_ui'); await flush()
})
afterEach(() => { dom.window.close(); vi.unstubAllGlobals() })

describe('decision interface', () => {
  test('defaults to an unbounded decision and exports both exact queries', async () => {
    expect(node('decision-runtime').dataset.z3Version).toBe('5.1.0')
    expect(node<HTMLInputElement>('decision-seconds').disabled).toBe(true)
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(mocks.decide.mock.calls[0][1].timeout_ms).toBe(0)
    expect(node('decision-status').textContent).toContain('ENTAILS')
    expect(node('decision-results').textContent).toContain('premises are satisfiable')
    node<HTMLButtonElement>('decision-save-smt').click()
    const text = mocks.download.mock.calls[0][0] as string
    expect(text.match(/\(check-sat-using qfnra-nlsat\)/g)).toHaveLength(2)
    expect(text).toContain('time-capped QF_NRA')
    expect(text).toContain('(reset)')
    expect(text).not.toMatch(/\(\/|\(\^/)
  })
  test('bounded time is an integer and rejected when outside the accepted range', async () => {
    change('decision-mode', 'bounded'); change('decision-seconds', '16.1')
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(mocks.decide.mock.calls[0][1].timeout_ms).toBe(16100)
    change('decision-seconds', '0')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
  })
  test('satisfiability ignores an inactive retained conclusion', async () => {
    change('decision-conclusion', 'not a valid constraint')
    change('decision-task', 'satisfiability')
    expect(node<HTMLTextAreaElement>('decision-conclusion').disabled).toBe(true)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
    mocks.decide.mockResolvedValue({ status: 'unsat' })
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(mocks.decide.mock.calls[0][0].task).toBe('satisfiability')
    expect(node('decision-status').textContent).toContain('UNSAT')
  })
  test('shows exact countermodel values and an undefined query', async () => {
    mocks.decide.mockResolvedValue({ status: 'not-entailed', witness: {
      mechanisms: [{ node: 'B', parents: {}, parameter: 'CausalP1', value: '0' }],
      queries: [{ source: 'Pr(A | B)', defined: false }, { source: 'Pr(A)', defined: true, value: '(/ 9007199254740993 18014398509481987)' }],
      freeParameters: [{ variable: 'a', value: '(/ 1 3)' }], distributions: [],
    } })
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(node('decision-status').textContent).toContain('DOES NOT ENTAIL')
    expect(node('decision-results').textContent).toContain('undefined (zero denominator)')
    expect(node('decision-results').textContent).toContain('9007199254740993/18014398509481987')
    expect(node('decision-results').textContent).toContain('1/3')
  })
  test.each([
    [{ status: 'inconsistent-premises' }, 'INCONSISTENT PREMISES', 'vacuously'],
    [{ status: 'unknown', stage: 'counterexample', reason: 'resource limit' }, 'UNRESOLVED', ''],
    [{ status: 'error', stage: 'premises', message: 'backend failed' }, 'Solver error', ''],
  ])('keeps outcome %j distinct', async (output, message, detail) => {
    mocks.decide.mockResolvedValue(output); node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(node('decision-status').textContent).toContain(message)
    if (detail) expect(node('decision-results').textContent).toContain(detail)
    expect(node('decision-results').querySelector('table')).toBeNull()
  })
  test('cancel waits for solver settlement and prevents a second concurrent run', async () => {
    const work = pending<CausalDecisionResult>(); mocks.decide.mockReturnValue(work.promise)
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
    node<HTMLButtonElement>('decision-cancel').click()
    expect(mocks.decide.mock.calls[0][1].abort_signal.aborted).toBe(true)
    expect(node('decision-status').textContent).toContain('Cancelling; waiting')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
    work.resolve({ status: 'cancelled', stage: 'premises', reason: 'user cancelled' }); await flush()
    expect(node('decision-status').textContent).toContain('Cancelled')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })
  test('edits cancel stale work, remove results and invalidate saved solver input', async () => {
    const work = pending<CausalDecisionResult>(); mocks.decide.mockReturnValue(work.promise)
    node<HTMLButtonElement>('decision-run').click(); await flush()
    change('decision-conclusion', 'Pr(Y)=0')
    expect(mocks.decide.mock.calls[0][1].abort_signal.aborted).toBe(true)
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
    work.resolve({ status: 'entailed' }); await flush()
    expect(node('decision-status').textContent).toContain('Input changed')
    expect(node('decision-results').textContent).toBe('')
  })
  test('load restores validated inputs and ignores saved answer claims', async () => {
    node<HTMLButtonElement>('decision-run').click(); await flush()
    load(async () => saved({ answer: 'entailed' })); await flush()
    expect(node<HTMLTextAreaElement>('decision-graph').value).toBe('A')
    expect(node('decision-results').textContent).toBe('')
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
  })
  test.each([{ task: 1 }, { mode: 'fast' }, { seconds: 121 }, { graph: 'A -> A' }, { conclusion: 'Pr(A)=0\nPr(A)=1' }, { regular: 1 }])('rejects malformed saved problem %j before changing inputs', async overrides => {
    load(async () => saved(overrides)); await flush()
    expect(node('decision-status').textContent).toContain('Load error')
    expect(node<HTMLTextAreaElement>('decision-graph').value).toContain('Z -> X')
  })
  test('manual edit supersedes pending load and stale load errors', async () => {
    const read = pending<string>(); load(() => read.promise)
    change('decision-conclusion', 'Pr(Y)=0')
    const message = node('decision-status').textContent
    read.reject(new Error('old file failed')); await flush()
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe('Pr(Y)=0')
    expect(node('decision-status').textContent).toBe(message)
  })
  test('newer selected file supersedes older read', async () => {
    const older = pending<string>(), newer = pending<string>()
    load(() => older.promise); load(() => newer.promise)
    newer.resolve(saved({ conclusion: 'Pr(A)=1/2' })); await flush()
    older.resolve(saved({ conclusion: 'Pr(A)=0' })); await flush()
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe('Pr(A)=1/2')
  })
  test('oversized file is rejected before reading and invalid inputs cannot be saved', async () => {
    const read = vi.fn(); load(read, 100_001); await flush()
    expect(read).not.toHaveBeenCalled()
    change('decision-graph', 'A -> A')
    node<HTMLButtonElement>('decision-save').click()
    expect(mocks.download).not.toHaveBeenCalled()
  })
})
