import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import type { CausalDecisionResult, DecisionWitness } from './causal_decision_solver'
import type { ModelEvaluationResult } from './causal_model_evaluator'
import { savedDecisionFixture } from '../tests/fixtures/decision_problems'
const mocks = vi.hoisted(() => ({ init: vi.fn(), decide: vi.fn(), download: vi.fn(), clipboard: vi.fn(), capture: vi.fn(), evaluate: vi.fn() }))
vi.mock('./z3_integration', () => ({ init_z3: mocks.init }))
vi.mock('./causal_decision_solver', () => ({ CausalDecisionSolver: class { decide = mocks.decide } }))
vi.mock('./causal_model_evaluator', () => ({ CausalModelEvaluator: class { capture = mocks.capture; evaluate = mocks.evaluate } }))
vi.mock('./download', () => ({ download: mocks.download }))
let dom: JSDOM
const node = <T extends HTMLElement>(id: string): T => dom.window.document.querySelector(`[data-testid="${id}"]`) as T
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }
const change = (id: string, value: string) => { const input = node<HTMLInputElement>(id); input.value = value; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })) }
const checked = (id: string, value: boolean) => { const input = node<HTMLInputElement>(id); input.checked = value; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })) }
const task = (value: 'entailment' | 'satisfiability') => checked(`decision-task-${value}`, true)
const premises = (value: string) => {
  const wasOpen = node('decision-batch-toggle').getAttribute('aria-expanded') === 'true'
  if (!wasOpen) node<HTMLButtonElement>('decision-batch-toggle').click()
  change('decision-premises', value)
  node<HTMLButtonElement>('decision-parse').click()
  if (!wasOpen) node<HTMLButtonElement>('decision-batch-toggle').click()
}
const rowValues = () => Array.from(dom.window.document.querySelectorAll<HTMLInputElement>('.decision-premise-rows input'), row => row.value).join('\n')
const problemState = () => ({
  graph: node<HTMLTextAreaElement>('decision-graph').value,
  premises: rowValues(),
  conclusion: node<HTMLTextAreaElement>('decision-conclusion').value,
  entailment: node<HTMLInputElement>('decision-task-entailment').checked,
  satisfiability: node<HTMLInputElement>('decision-task-satisfiability').checked,
  regular: node<HTMLInputElement>('decision-regular').checked,
  bounded: node<HTMLInputElement>('decision-mode').checked,
  seconds: node<HTMLInputElement>('decision-seconds').value,
  batch: node<HTMLTextAreaElement>('decision-premises').value,
  pendingBatch: !node('decision-batch-status').hidden,
  batchOpen: node('decision-batch-toggle').getAttribute('aria-expanded'),
  example: node<HTMLSelectElement>('decision-example').value,
})
let initialProblem: ReturnType<typeof problemState>
let initialPresentation: { status: string | null, guideHidden: boolean, guideOpen: boolean }
const pending = <T>() => { let resolve!: (value: T) => void, reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const load = (read: () => Promise<string>, size = 100) => { const field = node<HTMLInputElement>('decision-load'); Object.defineProperty(field, 'files', { configurable: true, value: [{ size, text: read }] }); field.dispatchEvent(new dom.window.Event('change')) }
const saved = (overrides: Record<string, unknown> = {}) => JSON.stringify({ version: 1, kind: 'DoSAT-decision', task: 'entailment', graph: 'A', premises: 'Pr(A)=1/2', conclusion: 'Pr(A)>0', regular: false, mode: 'complete', seconds: 30, ...overrides })
const modelWitness = (exact = '(/ 1 2)'): DecisionWitness => ({
  mechanisms: [{ node: 'A', parents: {}, parameter: 'CausalP1', value: exact }],
  queries: [{ source: 'Pr(A)', defined: true, value: exact }],
  freeParameters: [{ variable: 'Rate', value: '(/ 1 3)' }],
  distributions: [{ label: 'Observational', intervention: [], rows: [
    { assignment: { A: false }, value: exact === '(/ 1 4)' ? '(/ 3 4)' : '(/ 1 2)' },
    { assignment: { A: true }, value: exact },
  ] }],
})
const returnedModel = async (status: 'sat' | 'not-entailed' = 'sat'): Promise<DecisionWitness> => {
  load(async () => saved({ task: status === 'sat' ? 'satisfiability' : 'entailment', premises: 'Pr(A)=1/2\nRate=1/3', conclusion: 'Pr(A)=3/4' })); await flush()
  const witness = modelWitness()
  mocks.decide.mockResolvedValue({ status, witness })
  node<HTMLButtonElement>('decision-run').click(); await flush()
  return witness
}
beforeEach(async () => {
  vi.resetModules(); vi.resetAllMocks(); mocks.init.mockResolvedValue({ getVersionString: () => '5.1.0' }); mocks.decide.mockResolvedValue({ status: 'entailed' })
  dom = new JSDOM('<div id="app"></div>'); vi.stubGlobal('document', dom.window.document)
  vi.stubGlobal('navigator', { clipboard: { writeText: mocks.clipboard } }); mocks.clipboard.mockResolvedValue(undefined)
  mocks.capture.mockImplementation((graph: string, witness: DecisionWitness) => Object.freeze({
    graph, mechanisms: structuredClone(witness.mechanisms), freeParameters: structuredClone(witness.freeParameters),
  }))
  mocks.evaluate.mockResolvedValue({ status: 'value', kind: 'real', value: '(/ 1 2)', probabilities: [] })
  await import('./causal_decision_ui'); await flush()
  initialProblem = problemState()
  initialPresentation = {
    status: node('decision-status').textContent,
    guideHidden: Boolean(node('decision-example-guide').hidden),
    guideOpen: node<HTMLDetailsElement>('decision-example-guide').open,
  }
  load(async () => JSON.stringify(savedDecisionFixture(0))); await flush()
})
afterEach(() => { dom.window.close(); vi.unstubAllGlobals() })

describe('decision interface', () => {
  test('the initial literature example is Berkson with its conclusion and required entailment setting', () => {
    expect(initialProblem.graph).toBe('X -> S; Y -> S')
    expect(initialProblem.premises).toBe('Pr(X) = 1/2\nPr(Y) = 1/2\nPr(S <-> (X v Y)) = 1')
    expect(initialProblem.satisfiability).toBe(false)
    expect(initialProblem.entailment).toBe(true)
    expect(initialProblem.conclusion).toBe('(Pr(Y | do(X)) = Pr(Y | do(~X))) & (Pr(Y | X & S) < Pr(Y | ~X & S))')
    expect(initialProblem.regular).toBe(false)
    expect(initialProblem.example).toBe('0')
    expect(initialPresentation.status).toBe('Choose a decision problem.')
    expect(initialPresentation.guideHidden).toBe(false)
    expect(initialPresentation.guideOpen).toBe(false)
  })
  test('the menu contains the six literature cases and Simpson, and guidance is invalidated by edits', async () => {
    const sample = node<HTMLSelectElement>('decision-example')
    expect(Array.from(sample.options, option => option.text)).toEqual([
      'Choose an example…', 'Berkson’s paradox: selection creates an association',
      'M-bias: a harmful pretreatment adjustment', 'Bias amplification: controlling an instrument',
      'Treatment–confounder feedback', 'Front-door adjustment',
      'Positivity failure: an unseen treatment branch', 'Simpson’s paradox: E, M and A',
    ])
    sample.value = '3'; sample.dispatchEvent(new dom.window.Event('change'))
    expect(node<HTMLTextAreaElement>('decision-graph').value).toBe('A -> L; L -> B; L -> Y; B -> Y')
    expect(node('decision-example-guide').textContent).toContain('Every causal path from A to Y passes through L')
    expect(node('decision-example-guide').textContent).not.toContain('part of A')
    sample.value = '1'; sample.dispatchEvent(new dom.window.Event('change'))
    const guide = node('decision-example-guide')
    expect(guide.hidden).toBe(false)
    expect(guide.textContent).toContain('-1/24')
    expect(guide.querySelector('a')?.getAttribute('href')).toBe('https://arxiv.org/abs/1408.0324')
    change('decision-premise-1', 'Pr(U)=1/3')
    expect(guide.hidden).toBe(true)
    sample.value = '1'; sample.dispatchEvent(new dom.window.Event('change'))
    expect(guide.hidden).toBe(false)
    node<HTMLButtonElement>('decision-clear').click()
    expect(guide.hidden).toBe(true)
    sample.value = '1'; sample.dispatchEvent(new dom.window.Event('change'))
    expect(guide.hidden).toBe(false)
    sample.value = ''; sample.dispatchEvent(new dom.window.Event('change'))
    expect(guide.hidden).toBe(true)
    sample.value = '1'; sample.dispatchEvent(new dom.window.Event('change'))
    expect(guide.hidden).toBe(false)
    load(async () => saved()); await flush()
    expect(guide.hidden).toBe(true)
  })
  test.each([0, 1, 2, 3, 4])('preset %i saves and restores an active nonempty entailment conclusion', async index => {
    const sample = node<HTMLSelectElement>('decision-example')
    sample.value = String(index); sample.dispatchEvent(new dom.window.Event('change'))
    const original = node<HTMLTextAreaElement>('decision-conclusion').value
    expect(original.length).toBeGreaterThan(0)
    expect(node<HTMLInputElement>('decision-task-entailment').checked).toBe(true)
    expect(node<HTMLTextAreaElement>('decision-conclusion').disabled).toBe(false)
    expect(node<HTMLTextAreaElement>('decision-conclusion').closest('section')?.hidden).toBe(false)
    expect(node('decision-example-guide').textContent).toContain('Expected decision: ENTAILS')
    expect(node('decision-example-guide').textContent).toContain('choose Satisfiability, then Find Model')
    node<HTMLButtonElement>('decision-save').click()
    const payload = JSON.parse(mocks.download.mock.calls[0][0]) as { task: string, conclusion: string }
    expect(payload.task).toBe('entailment'); expect(payload.conclusion).toBe(original)
    change('decision-conclusion', 'Pr(A)>0')
    load(async () => JSON.stringify(payload)); await flush()
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe(original)
    expect(node<HTMLInputElement>('decision-task-entailment').checked).toBe(true)
  })
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
    checked('decision-mode', true); change('decision-seconds', '16.1')
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(mocks.decide.mock.calls[0][1].timeout_ms).toBe(16100)
    change('decision-seconds', '0')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
  })
  test('satisfiability ignores an inactive retained conclusion', async () => {
    change('decision-conclusion', 'not a valid constraint')
    task('satisfiability')
    expect(node<HTMLTextAreaElement>('decision-conclusion').disabled).toBe(true)
    expect(node<HTMLTextAreaElement>('decision-conclusion').closest('section')?.hidden).toBe(true)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
    mocks.decide.mockResolvedValue({ status: 'unsat' })
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(mocks.decide.mock.calls[0][0].task).toBe('satisfiability')
    expect(mocks.decide.mock.calls[0][0].counterexampleSmt).toBeUndefined()
    expect(mocks.decide.mock.calls[0][0].conclusionConstraint).toBeUndefined()
    expect(node('decision-status').textContent).toContain('UNSAT')
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe('not a valid constraint')
    task('entailment')
    expect(node<HTMLTextAreaElement>('decision-conclusion').closest('section')?.hidden).toBe(false)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
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
    change('decision-premise-4', 'Pr(Y <-> Z)=0')
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

  test.each(['parse', 'discard'] as const)('unapplied batch text clears results and solver export until %s', async action => {
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(node('decision-results').textContent).not.toBe('')
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(false)
    const previous = rowValues(), conclusion = node<HTMLTextAreaElement>('decision-conclusion').value
    node<HTMLButtonElement>('decision-batch-toggle').click()
    change('decision-premises', 'Pr(Z) = 1/3')
    expect(rowValues()).toBe(previous)
    expect(node('decision-results').textContent).toBe('')
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
    expect(node<HTMLButtonElement>('decision-save').disabled).toBe(true)
    expect(node<HTMLButtonElement>('decision-copy').disabled).toBe(true)
    expect(node('decision-validation').textContent).toContain('unapplied')
    node<HTMLButtonElement>(action === 'parse' ? 'decision-parse' : 'decision-discard-batch').click()
    expect(rowValues()).toBe(action === 'parse' ? 'Pr(Z) = 1/3' : previous)
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe(conclusion)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
    expect(node('decision-results').textContent).toBe('')
  })

  test('hiding an unapplied batch preserves its draft and continues to block Run', () => {
    const previous = rowValues()
    node<HTMLButtonElement>('decision-batch-toggle').click()
    change('decision-premises', 'Pr(Z)=1/3')
    node<HTMLButtonElement>('decision-batch-toggle').click()
    expect(node<HTMLTextAreaElement>('decision-premises').closest('.decision-batch')?.hasAttribute('hidden')).toBe(true)
    expect(node<HTMLTextAreaElement>('decision-premises').value).toBe('Pr(Z)=1/3')
    expect(rowValues()).toBe(previous)
    expect(node('decision-batch-status').hidden).toBe(false)
    expect(node('decision-batch-status').textContent).toContain('not applied')
    expect(node('decision-validation').textContent).toContain('Show Batch Input')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
    node<HTMLButtonElement>('decision-run').click()
    expect(mocks.decide).not.toHaveBeenCalled()
    node<HTMLButtonElement>('decision-batch-toggle').click()
    node<HTMLButtonElement>('decision-discard-batch').click()
    expect(node<HTMLTextAreaElement>('decision-premises').value).toBe(previous)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })

  test('pending batch edits cancel live work and suppress its late result', async () => {
    const work = pending<CausalDecisionResult>(); mocks.decide.mockReturnValue(work.promise)
    node<HTMLButtonElement>('decision-run').click(); await flush()
    node<HTMLButtonElement>('decision-batch-toggle').click()
    change('decision-premises', 'Pr(Z)=1/3')
    expect(mocks.decide.mock.calls[0][1].abort_signal.aborted).toBe(true)
    expect(node('decision-status').textContent).toContain('Input changed; cancelling')
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
    work.resolve({ status: 'entailed' }); await flush()
    expect(node('decision-results').textContent).toBe('')
    expect(node('decision-status').textContent).toContain('Input changed')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
  })

  test('Clear premises preserves graph, conclusion, task and options', () => {
    checked('decision-regular', true); checked('decision-mode', true); change('decision-seconds', '16.1')
    const previousGraph = node<HTMLTextAreaElement>('decision-graph').value
    const previousConclusion = node<HTMLTextAreaElement>('decision-conclusion').value
    node<HTMLButtonElement>('decision-clear').click()
    expect(rowValues()).toBe('')
    expect(node<HTMLTextAreaElement>('decision-graph').value).toBe(previousGraph)
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe(previousConclusion)
    expect(node<HTMLInputElement>('decision-task-entailment').checked).toBe(true)
    expect(node<HTMLInputElement>('decision-regular').checked).toBe(true)
    expect(node<HTMLInputElement>('decision-mode').checked).toBe(true)
    expect(node<HTMLInputElement>('decision-seconds').value).toBe('16.1')
    expect(node('decision-validation').textContent).toContain('No premises: checks validity')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })

  test.each(['entailment', 'satisfiability'] as const)('Copy and Save round-trip the entire %s problem with empty premises', async selectedTask => {
    load(async () => saved({ premises: '', task: selectedTask, conclusion: selectedTask === 'entailment' ? 'Pr(A)>0' : 'retained inactive conclusion', regular: true, mode: 'bounded', seconds: 12.3 })); await flush()
    node<HTMLButtonElement>('decision-copy').click(); await flush()
    const copied = mocks.clipboard.mock.calls[0][0] as string
    const expected = { version: 1, kind: 'DoSAT-decision', task: selectedTask, graph: 'A', premises: '', conclusion: selectedTask === 'entailment' ? 'Pr(A)>0' : 'retained inactive conclusion', regular: true, mode: 'bounded', seconds: 12.3 }
    expect(JSON.parse(copied)).toEqual(expected)
    node<HTMLButtonElement>('decision-save').click()
    expect(JSON.parse(mocks.download.mock.calls[0][0] as string)).toEqual(expected)
    expect(node('decision-status').textContent).toContain('Whole problem copied')
    task('satisfiability'); change('decision-conclusion', 'replacement draft'); checked('decision-regular', false); checked('decision-mode', false); change('decision-seconds', '30')
    load(async () => copied); await flush()
    expect(rowValues()).toBe('')
    expect(node<HTMLTextAreaElement>('decision-graph').value).toBe('A')
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe(expected.conclusion)
    expect(node<HTMLInputElement>(`decision-task-${selectedTask}`).checked).toBe(true)
    expect(node<HTMLInputElement>('decision-regular').checked).toBe(true)
    expect(node<HTMLInputElement>('decision-mode').checked).toBe(true)
    expect(node<HTMLInputElement>('decision-seconds').value).toBe('12.3')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })

  test('clipboard failure leaves the problem unchanged and reports the failure', async () => {
    const previous = rowValues()
    mocks.clipboard.mockRejectedValue(new Error('clipboard denied'))
    node<HTMLButtonElement>('decision-copy').click(); await flush()
    expect(node('decision-status').textContent).toContain('Copy failed: clipboard denied')
    expect(rowValues()).toBe(previous)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })

  test('a completed clipboard write does not overwrite feedback for a later edit', async () => {
    const copying = pending<void>(); mocks.clipboard.mockReturnValue(copying.promise)
    node<HTMLButtonElement>('decision-copy').click(); await flush()
    change('decision-premise-1', 'Pr(Z)=1/3')
    const message = node('decision-status').textContent
    copying.resolve(); await flush()
    expect(node('decision-status').textContent).toBe(message)
    expect(node('decision-status').textContent).not.toContain('Whole problem copied')
  })

  test('whole-problem Load applies directly and replaces an unapplied batch draft', async () => {
    node<HTMLButtonElement>('decision-batch-toggle').click()
    change('decision-premises', 'unapplied invalid draft')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
    load(async () => saved({ premises: '' })); await flush()
    expect(node<HTMLTextAreaElement>('decision-graph').value).toBe('A')
    expect(rowValues()).toBe('')
    expect(node<HTMLTextAreaElement>('decision-premises').value).toBe('')
    expect(node('decision-batch-status').hidden).toBe(true)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe('Pr(A)>0')
  })

  test('physical premise 4 is named correctly after blank and comment rows', () => {
    premises('Pr(Z)=1/2\n\n# comment\nPr(Q)=0')
    const invalid = node<HTMLInputElement>('decision-premise-4')
    expect(invalid.getAttribute('aria-label')).toBe('Premise 4')
    expect(invalid.getAttribute('aria-invalid')).toBe('true')
    expect(node<HTMLInputElement>('decision-premise-1').getAttribute('aria-invalid')).toBe('false')
    const errorId = invalid.getAttribute('aria-describedby')!.split(' ').find(id => id.endsWith('-error'))!
    expect(dom.window.document.getElementById(errorId)?.textContent).toMatch(/^Premise 4:.*Q.*not declared/)
    expect(node('decision-validation').textContent).toContain('Fix Premise 4.')
    expect(node('decision-validation').textContent).not.toContain('Constraint line 2')
    expect(node('decision-validation').getAttribute('role')).toBe('status')
    expect(node('decision-validation').querySelector('a')?.getAttribute('href')).toBe(`#${invalid.id}`)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
  })

  test('a bad conclusion is labelled and linked as Conclusion rather than a premise line', () => {
    change('decision-conclusion', 'Pr(Q)=0')
    expect(node<HTMLTextAreaElement>('decision-conclusion').getAttribute('aria-invalid')).toBe('true')
    expect(dom.window.document.getElementById('decision-conclusion-error')?.textContent).toMatch(/^Conclusion:.*Q.*not declared/)
    expect(node('decision-validation').textContent).toContain('Fix the conclusion.')
    expect(node('decision-validation').querySelector('a')?.getAttribute('href')).toBe('#decision-conclusion')
    expect(node<HTMLInputElement>('decision-premise-1').getAttribute('aria-invalid')).toBe('false')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
  })

  test('graph errors are linked and graph edits revalidate every premise', () => {
    change('decision-graph', 'A -> A')
    expect(node<HTMLTextAreaElement>('decision-graph').getAttribute('aria-invalid')).toBe('true')
    expect(dom.window.document.getElementById('decision-graph-error')?.textContent).toContain('Graph:')
    expect(node('decision-validation').querySelector('a')?.getAttribute('href')).toBe('#decision-graph')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
    change('decision-graph', 'A')
    expect(node<HTMLTextAreaElement>('decision-graph').getAttribute('aria-invalid')).toBe('false')
    for (let index = 1; index <= 4; index++) expect(node<HTMLInputElement>(`decision-premise-${index}`).getAttribute('aria-invalid')).toBe('true')
    expect(node('decision-validation').textContent).toContain('Fix Premise 4.')
    change('decision-graph', 'Z -> X; Z -> Y')
    for (let index = 1; index <= 4; index++) expect(node<HTMLInputElement>(`decision-premise-${index}`).getAttribute('aria-invalid')).toBe('false')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })

  test('empty-premise entailment compiles a validity question and keeps the conclusion', async () => {
    load(async () => JSON.stringify(savedDecisionFixture(8))); await flush()
    expect(rowValues()).toBe('')
    expect(node('decision-validation').textContent).toContain('No premises: checks validity')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
    node<HTMLButtonElement>('decision-run').click(); await flush()
    const compiled = mocks.decide.mock.calls[0][0]
    expect(compiled.task).toBe('entailment')
    expect(compiled.premiseConstraints).toHaveLength(0)
    expect(compiled.conclusionConstraint).toBeDefined()
    expect(compiled.counterexampleSmt).toBeDefined()
    expect(node('decision-status').textContent).toContain('ENTAILS')
  })

  test('a direct row edit clears old results and its current text is immediately saved', async () => {
    node<HTMLButtonElement>('decision-run').click(); await flush()
    change('decision-premise-1', 'Pr(Z)=1/3')
    expect(node('decision-results').textContent).toBe('')
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
    node<HTMLButtonElement>('decision-save').click()
    expect((JSON.parse(mocks.download.mock.calls[0][0] as string) as { premises: string }).premises.split('\n')[0]).toBe('Pr(Z)=1/3')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })

  test.each([
    { graph: 'A ->\rB' },
    { premises: 'Pr(A)\r=1/2' },
    { conclusion: 'Pr(A)\r=1/2' },
  ])('normalizes then rejects a lone-CR embedded token before changing any problem state: %j', async overrides => {
    checked('decision-regular', true); checked('decision-mode', true); change('decision-seconds', '16.1')
    const before = problemState()
    load(async () => saved(overrides)); await flush()
    expect(node('decision-status').textContent).toContain('Load error')
    expect(problemState()).toEqual(before)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
    expect(node<HTMLButtonElement>('decision-parse').disabled).toBe(true)
    expect(node<HTMLButtonElement>('decision-discard-batch').disabled).toBe(true)
    expect(node('decision-batch-status').hidden).toBe(true)
    expect(node('decision-validation').textContent).not.toContain('unapplied')
  })

  test.each(['\r\n', '\r'])('valid saved line breaks %j load, validate, and save consistently with blank and comment rows', async newline => {
    const graphText = `A;${newline}B`
    const premiseText = `${newline}# comment${newline}Pr(A)=1/2${newline}${newline}Pr(B)=1/3${newline}`
    const conclusionText = `${newline}# claim${newline}Pr(A)>0${newline}`
    load(async () => saved({ graph: graphText, premises: premiseText, conclusion: conclusionText })); await flush()
    const normalized = (text: string) => text.replace(/\r\n?/g, '\n')
    expect(node<HTMLTextAreaElement>('decision-graph').value).toBe(normalized(graphText))
    expect(rowValues()).toBe(normalized(premiseText))
    expect(node<HTMLTextAreaElement>('decision-premises').value).toBe(normalized(premiseText))
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe(normalized(conclusionText))
    expect(node('decision-batch-status').hidden).toBe(true)
    expect(node<HTMLButtonElement>('decision-parse').disabled).toBe(true)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
    expect(node('decision-validation').textContent).toBe('2 premises ready.')
    node<HTMLButtonElement>('decision-save').click()
    expect(JSON.parse(mocks.download.mock.calls[0][0] as string)).toEqual({
      version: 1, kind: 'DoSAT-decision', task: 'entailment', graph: normalized(graphText),
      premises: normalized(premiseText), conclusion: normalized(conclusionText), regular: false,
      mode: 'complete', seconds: 30,
    })
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(mocks.decide.mock.calls[0][0].premiseConstraints).toHaveLength(2)
    expect(node('decision-status').textContent).toContain('ENTAILS')
  })

  test('unchanged readiness leaves the validation live-region DOM untouched', async () => {
    const validation = node('decision-validation')
    const before = Array.from(validation.childNodes)
    const mutations = vi.fn()
    const observer = new dom.window.MutationObserver(mutations)
    observer.observe(validation, { childList: true, characterData: true, subtree: true })
    change('decision-conclusion', 'Pr(Y | do(X)) = 0'); await flush()
    expect(validation.textContent).toBe('4 premises ready.')
    Array.from(validation.childNodes).forEach((child, index) => expect(child).toBe(before[index]))
    expect(mutations).not.toHaveBeenCalled()
    expect(observer.takeRecords()).toHaveLength(0)
    observer.disconnect()
  })

  test('unchanged error links retain node identity and do not reannounce on every keystroke', async () => {
    change('decision-premise-1', 'Pr(Q)=0')
    const validation = node('decision-validation')
    const before = Array.from(validation.childNodes)
    const originalLink = validation.querySelector('a')
    const mutations = vi.fn()
    const observer = new dom.window.MutationObserver(mutations)
    observer.observe(validation, { childList: true, characterData: true, subtree: true })
    change('decision-premise-1', 'Pr(Q)=1'); await flush()
    expect(validation.textContent).toContain('Fix Premise 1.')
    expect(validation.querySelector('a')).toBe(originalLink)
    Array.from(validation.childNodes).forEach((child, index) => expect(child).toBe(before[index]))
    expect(mutations).not.toHaveBeenCalled()
    expect(observer.takeRecords()).toHaveLength(0)
    observer.disconnect()
  })

  test('readiness uses a singular label for one premise or constraint', async () => {
    load(async () => saved()); await flush()
    expect(node('decision-validation').textContent).toBe('1 premise ready.')
    task('satisfiability')
    expect(node('decision-validation').textContent).toBe('1 constraint ready.')
  })

  test('the conclusion has linked toggled syntax help and Enter keeps its single constraint', () => {
    const info = node<HTMLButtonElement>('decision-conclusion-info')
    const help = dom.window.document.getElementById(info.getAttribute('aria-controls')!)!
    const conclusion = node<HTMLTextAreaElement>('decision-conclusion')
    const before = conclusion.value
    const count = dom.window.document.querySelectorAll('[data-testid="decision-conclusion"]').length
    expect(info.getAttribute('aria-label')).toMatch(/conclusion/i)
    expect(info.getAttribute('aria-expanded')).toBe('false')
    expect(help.hidden).toBe(true)
    info.click()
    expect(info.getAttribute('aria-expanded')).toBe('true')
    expect(help.hidden).toBe(false)
    expect(help.textContent).toContain('do(')
    expect(help.textContent).toMatch(/logical|combine/i)
    info.click()
    expect(info.getAttribute('aria-expanded')).toBe('false')
    expect(help.hidden).toBe(true)
    const enter = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    conclusion.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(conclusion.value).toBe(before)
    expect(dom.window.document.querySelectorAll('[data-testid="decision-conclusion"]')).toHaveLength(count)
  })

  test('Examples uses a placeholder after edits, Clear and Load so the same example can be restored', async () => {
    const sample = node<HTMLSelectElement>('decision-example')
    expect(sample.querySelector('option[value=""]')).not.toBeNull()
    sample.value = '1'; sample.dispatchEvent(new dom.window.Event('change'))
    const example = problemState()
    expect(sample.value).toBe('1')
    change('decision-premise-1', 'Pr(Z)=1/3')
    expect(sample.value).toBe('')
    sample.value = '1'; sample.dispatchEvent(new dom.window.Event('change'))
    expect(rowValues()).toBe(example.premises)
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe(example.conclusion)
    expect(sample.value).toBe('1')
    node<HTMLButtonElement>('decision-clear').click()
    expect(sample.value).toBe('')
    sample.value = '1'; sample.dispatchEvent(new dom.window.Event('change'))
    expect(rowValues()).toBe(example.premises)
    expect(sample.value).toBe('1')
    load(async () => saved()); await flush()
    expect(sample.value).toBe('')
    const loaded = problemState()
    sample.dispatchEvent(new dom.window.Event('change'))
    expect(problemState()).toEqual(loaded)
    sample.value = '1'; sample.dispatchEvent(new dom.window.Event('change'))
    expect(rowValues()).toBe(example.premises)
    expect(node<HTMLTextAreaElement>('decision-graph').value).toBe(example.graph)
    expect(node<HTMLTextAreaElement>('decision-conclusion').value).toBe(example.conclusion)
    expect(sample.value).toBe('1')
  })

  test('the input graph preview is an accessible SVG containing every directed edge', () => {
    const preview = node('decision-graph-preview')
    expect(preview.getAttribute('role')).toBe('region')
    expect(preview.getAttribute('aria-label')).toBe('Input graph preview')
    const svg = preview.querySelector('svg')!
    expect(svg).not.toBeNull()
    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toBe('Input causal DAG')
    expect(Array.from(svg.querySelectorAll('[data-node]'), value => value.getAttribute('data-node')).sort()).toEqual(['X', 'Y', 'Z'])
    expect(Array.from(svg.querySelectorAll('[data-edge]'), value => value.getAttribute('data-edge')).sort()).toEqual(['Z->X', 'Z->Y'])
    expect(svg.querySelectorAll('[data-cut="true"]')).toHaveLength(0)
  })

  test('graph edits preserve isolated nodes and draw only the declared edges', () => {
    const previous = node('decision-graph-preview').querySelector('svg')
    change('decision-graph', 'Z -> X; A; B')
    const svg = node('decision-graph-preview').querySelector('svg')!
    expect(svg).not.toBeNull()
    expect(svg).not.toBe(previous)
    expect(Array.from(svg.querySelectorAll('[data-node]'), value => value.getAttribute('data-node')).sort()).toEqual(['A', 'B', 'X', 'Z'])
    expect(Array.from(svg.querySelectorAll('[data-edge]'), value => value.getAttribute('data-edge'))).toEqual(['Z->X'])
    expect(node<HTMLInputElement>('decision-premise-4').getAttribute('aria-invalid')).toBe('true')
    expect(node<HTMLTextAreaElement>('decision-graph').getAttribute('aria-invalid')).toBe('false')
  })

  test.each([
    'X -> Y; Y -> X',
    'X -> Y; Y -> Z; Z -> X',
    'X -> X',
    'X ->',
    'X -> Y -> Z',
    'X _ Y',
    '',
    '# no variables',
  ])('a non-DAG input %j clears the prior preview, result, and export with a syntax error', async source => {
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(node('decision-results').textContent).not.toBe('')
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(false)
    expect(node('decision-graph-preview').querySelector('svg')).not.toBeNull()
    change('decision-graph', source)
    expect(node('decision-graph-preview').querySelector('svg')).toBeNull()
    expect(dom.window.document.getElementById('decision-graph-error')?.textContent).toContain('Syntax error: not a DAG')
    expect(node<HTMLTextAreaElement>('decision-graph').getAttribute('aria-invalid')).toBe('true')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
    expect(node('decision-results').textContent).toBe('')
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
    node<HTMLButtonElement>('decision-save-smt').click()
    expect(mocks.download).not.toHaveBeenCalled()
  })

  test('the six-node graph resource limit is unsupported input rather than a non-DAG claim', () => {
    change('decision-graph', 'A; B; C; D; E; F; G')
    const message = dom.window.document.getElementById('decision-graph-error')?.textContent ?? ''
    expect(message).toMatch(/unsupported/i)
    expect(message).toMatch(/six|6/)
    expect(message).not.toContain('not a DAG')
    expect(node('decision-graph-preview').querySelector('svg')).toBeNull()
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
  })

  test('valid graph drawing remains visible when a premise or conclusion is invalid', () => {
    const svg = node('decision-graph-preview').querySelector('svg')
    change('decision-premise-1', 'Pr(Q)=0')
    expect(node<HTMLInputElement>('decision-premise-1').getAttribute('aria-invalid')).toBe('true')
    expect(node('decision-graph-preview').querySelector('svg')).toBe(svg)
    change('decision-conclusion', 'Pr(Q)=1')
    expect(node<HTMLTextAreaElement>('decision-conclusion').getAttribute('aria-invalid')).toBe('true')
    expect(node('decision-graph-preview').querySelector('svg')).toBe(svg)
    expect(node<HTMLTextAreaElement>('decision-graph').getAttribute('aria-invalid')).toBe('false')
    expect(svg?.querySelectorAll('[data-node]')).toHaveLength(3)
  })

  test('unrelated premise edits keep the same cached graph SVG without preview DOM mutations', async () => {
    const preview = node('decision-graph-preview'), svg = preview.querySelector('svg')
    const mutations = vi.fn()
    const observer = new dom.window.MutationObserver(mutations)
    observer.observe(preview, { childList: true, subtree: true, attributes: true, characterData: true })
    change('decision-premise-1', 'Pr(Z)=1/3'); await flush()
    expect(preview.querySelector('svg')).toBe(svg)
    expect(mutations).not.toHaveBeenCalled()
    expect(observer.takeRecords()).toHaveLength(0)
    observer.disconnect()
  })

  test('Examples and a valid file Load redraw the graph including isolates', async () => {
    const sample = node<HTMLSelectElement>('decision-example'), preview = node('decision-graph-preview')
    const original = preview.querySelector('svg')
    sample.value = '2'; sample.dispatchEvent(new dom.window.Event('change'))
    const example = preview.querySelector('svg')!
    expect(example).not.toBe(original)
    expect(Array.from(example.querySelectorAll('[data-node]'), value => value.getAttribute('data-node')).sort()).toEqual(['U', 'X', 'Y', 'Z'])
    expect(example.querySelectorAll('[data-edge]')).toHaveLength(4)
    load(async () => saved({ graph: 'A -> B; C' })); await flush()
    const loaded = preview.querySelector('svg')!
    expect(loaded).not.toBe(example)
    expect(Array.from(loaded.querySelectorAll('[data-node]'), value => value.getAttribute('data-node')).sort()).toEqual(['A', 'B', 'C'])
    expect(Array.from(loaded.querySelectorAll('[data-edge]'), value => value.getAttribute('data-edge'))).toEqual(['A->B'])
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })

  test('correcting a graph syntax error replaces it with a fresh valid preview', () => {
    const preview = node('decision-graph-preview'), original = preview.querySelector('svg')
    change('decision-graph', 'Z -> X; X -> Z')
    expect(preview.querySelector('svg')).toBeNull()
    change('decision-graph', 'Z -> X; Z -> Y')
    expect(preview.querySelector('svg')).not.toBeNull()
    expect(preview.querySelector('svg')).not.toBe(original)
    expect(dom.window.document.getElementById('decision-graph-error')?.textContent).toBe('')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })

  test('a live graph edit redraws immediately, cancels solver work, and rejects its late verdict', async () => {
    const work = pending<CausalDecisionResult>(); mocks.decide.mockReturnValue(work.promise)
    node<HTMLButtonElement>('decision-run').click(); await flush()
    const preview = node('decision-graph-preview'), original = preview.querySelector('svg')
    change('decision-graph', 'Z -> X; Y')
    const svg = preview.querySelector('svg')!
    expect(svg).not.toBe(original)
    expect(Array.from(svg.querySelectorAll('[data-node]'), value => value.getAttribute('data-node')).sort()).toEqual(['X', 'Y', 'Z'])
    expect(Array.from(svg.querySelectorAll('[data-edge]'), value => value.getAttribute('data-edge'))).toEqual(['Z->X'])
    expect(mocks.decide.mock.calls[0][1].abort_signal.aborted).toBe(true)
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
    work.resolve({ status: 'entailed' }); await flush()
    expect(node('decision-status').textContent).toContain('Input changed')
    expect(node('decision-results').textContent).toBe('')
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
    expect(mocks.decide).toHaveBeenCalledTimes(1)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })

  test('the main app navigation contains no retired auxiliary-page links', () => {
    const links = Array.from(dom.window.document.querySelectorAll<HTMLAnchorElement>('header nav a'), anchor => anchor.getAttribute('href') ?? '')
    expect(links).toContain('#decision-help')
    expect(links.some(href => /github\.com\/fitelson\/DoSAT/.test(href))).toBe(true)
    expect(links.join(' ')).not.toMatch(/causal\.html|do_calculus\.html/)
    expect(dom.window.document.querySelectorAll('a[href*="causal.html"], a[href*="do_calculus.html"]')).toHaveLength(0)
  })

  test.each(['sat', 'not-entailed'] as const)('a %s witness exposes evaluation and binds its graph and snapshot exactly once', async status => {
    expect(node('model-evaluation').hidden).toBe(true)
    const witness = await returnedModel(status)
    expect(node('model-evaluation').hidden).toBe(false)
    expect(mocks.capture).toHaveBeenCalledTimes(1)
    expect(mocks.capture).toHaveBeenCalledWith('A', witness)
    expect(mocks.evaluate).not.toHaveBeenCalled()
    const captured = mocks.capture.mock.results[0].value
    change('model-evaluate-input', 'Pr(A | do(~A))')
    node<HTMLButtonElement>('model-evaluate-run').click(); await flush()
    expect(mocks.evaluate).toHaveBeenCalledTimes(1)
    expect(mocks.evaluate.mock.calls[0][0]).toBe(captured)
    expect(mocks.evaluate.mock.calls[0][1]).toBe('Pr(A | do(~A))')
    expect(mocks.evaluate.mock.calls[0][2].abort_signal).toBeInstanceOf(AbortSignal)
    expect(captured.graph).toBe('A')
    expect(captured.mechanisms[0].value).toBe('(/ 1 2)')
    expect(captured.freeParameters[0].value).toBe('(/ 1 3)')
    expect(node('model-evaluate-result').textContent).toContain('Exact value in this model: 1/2')
  })

  test.each([
    { status: 'unsat' },
    { status: 'entailed' },
    { status: 'inconsistent-premises' },
    { status: 'unknown', stage: 'premises', reason: 'resource limit' },
    { status: 'cancelled', stage: 'premises', reason: 'user cancelled' },
    { status: 'error', stage: 'premises', message: 'backend failed' },
  ])('outcome %j has no evaluable returned model', async outcome => {
    mocks.decide.mockResolvedValue(outcome)
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(node('model-evaluation').hidden).toBe(true)
    expect(mocks.capture).not.toHaveBeenCalled()
    change('model-evaluate-input', 'Pr(Y | do(X))')
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    node<HTMLButtonElement>('model-evaluate-run').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    expect(mocks.evaluate).not.toHaveBeenCalled()
  })

  test('editing and evaluating a new expression preserves the original problem, witness, verdict and export', async () => {
    await returnedModel('not-entailed')
    const originalProblem = problemState(), originalStatus = node('decision-status').textContent
    const originalWitness = node('decision-results').firstChild
    const originalHTML = node('decision-results').innerHTML
    node<HTMLButtonElement>('decision-save-smt').click()
    const originalExport = mocks.download.mock.calls[0][0]
    change('model-evaluate-input', 'Rate + Pr(A | do(A))')
    expect(node('model-evaluate-preview').querySelector('math')).not.toBeNull()
    expect(problemState()).toEqual(originalProblem)
    expect(node('decision-results').firstChild).toBe(originalWitness)
    expect(node('decision-results').innerHTML).toBe(originalHTML)
    expect(node('decision-status').textContent).toBe(originalStatus)
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(false)
    node<HTMLButtonElement>('model-evaluate-run').click(); await flush()
    expect(node('decision-results').firstChild).toBe(originalWitness)
    expect(node('decision-status').textContent).toBe(originalStatus)
    expect(mocks.capture).toHaveBeenCalledTimes(1)
    node<HTMLButtonElement>('decision-save-smt').click()
    expect(mocks.download.mock.calls[1][0]).toBe(originalExport)
  })

  test('pending model evaluation blocks even a dispatched original Run event until settlement', async () => {
    await returnedModel()
    const work = pending<ModelEvaluationResult>(); mocks.evaluate.mockReturnValue(work.promise)
    change('model-evaluate-input', 'Pr(A | do(A))')
    node<HTMLButtonElement>('model-evaluate-run').click(); await flush()
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
    node<HTMLButtonElement>('decision-run').click()
    node<HTMLButtonElement>('decision-run').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    await flush()
    expect(mocks.decide).toHaveBeenCalledTimes(1)
    expect(mocks.capture).toHaveBeenCalledTimes(1)
    work.resolve({ status: 'value', kind: 'real', value: '1', probabilities: [] }); await flush()
    expect(node('model-evaluate-result').textContent).toContain('Exact value in this model: 1')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
  })

  test('a source-problem change clears the model, aborts evaluation, blocks Run through settlement and rejects the late value', async () => {
    await returnedModel()
    const work = pending<ModelEvaluationResult>(); mocks.evaluate.mockReturnValue(work.promise)
    change('model-evaluate-input', 'Pr(A)')
    node<HTMLButtonElement>('model-evaluate-run').click(); await flush()
    const captured = mocks.evaluate.mock.calls[0][0], signal = mocks.evaluate.mock.calls[0][2].abort_signal as AbortSignal
    change('decision-graph', 'A; B')
    expect(signal.aborted).toBe(true)
    expect(node('model-evaluation').hidden).toBe(true)
    expect(node('model-evaluate-result').textContent).toBe('')
    expect(node('decision-results').textContent).toBe('')
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
    expect(captured.graph).toBe('A')
    expect(captured.mechanisms[0].value).toBe('(/ 1 2)')
    node<HTMLButtonElement>('decision-run').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await flush()
    expect(mocks.decide).toHaveBeenCalledTimes(1)
    work.resolve({ status: 'value', kind: 'real', value: '987654321', probabilities: [] }); await flush()
    expect(node('model-evaluation').hidden).toBe(true)
    expect(node('model-evaluate-result').textContent).toBe('')
    expect(node('decision-status').textContent).toContain('Input changed')
    expect(node<HTMLButtonElement>('decision-run').disabled).toBe(false)
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(true)
  })

  test('a subsequent returned model binds a fresh snapshot and accepts only its own evaluations', async () => {
    await returnedModel()
    const oldCaptured = mocks.capture.mock.results[0].value
    const work = pending<ModelEvaluationResult>(); mocks.evaluate.mockReturnValueOnce(work.promise)
    change('model-evaluate-input', 'Pr(A)')
    node<HTMLButtonElement>('model-evaluate-run').click(); await flush()
    change('decision-premise-1', 'Pr(A)=1/4')
    work.resolve({ status: 'value', kind: 'real', value: '987654321', probabilities: [] }); await flush()
    const newerWitness = modelWitness('(/ 1 4)')
    mocks.decide.mockResolvedValue({ status: 'sat', witness: newerWitness })
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(node('model-evaluation').hidden).toBe(false)
    expect(mocks.capture).toHaveBeenCalledTimes(2)
    const newCaptured = mocks.capture.mock.results[1].value
    expect(newCaptured).not.toBe(oldCaptured)
    expect(newCaptured.mechanisms[0].value).toBe('(/ 1 4)')
    mocks.evaluate.mockResolvedValue({ status: 'value', kind: 'real', value: '(/ 1 4)', probabilities: [] })
    node<HTMLButtonElement>('model-evaluate-run').click(); await flush()
    expect(mocks.evaluate.mock.calls[1][0]).toBe(newCaptured)
    expect(node('model-evaluate-result').textContent).toContain('Exact value in this model: 1/4')
    expect(node('model-evaluate-result').textContent).not.toContain('987654321')
    expect(node('decision-status').textContent).toContain('SAT')
  })

  test('a new original decision immediately hides the previous model evaluator', async () => {
    await returnedModel()
    const work = pending<CausalDecisionResult>(); mocks.decide.mockReturnValue(work.promise)
    node<HTMLButtonElement>('decision-run').click(); await flush()
    expect(node('model-evaluation').hidden).toBe(true)
    expect(node('decision-results').textContent).toBe('')
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    work.resolve({ status: 'unsat' }); await flush()
    expect(node('model-evaluation').hidden).toBe(true)
    expect(node('decision-status').textContent).toContain('UNSAT')
    expect(mocks.capture).toHaveBeenCalledTimes(1)
  })

  test('a model capture error is reported by evaluation without replacing the SAT verdict or witness', async () => {
    mocks.capture.mockImplementation(() => { throw new Error('model snapshot incomplete') })
    await returnedModel()
    const originalWitness = node('decision-results').firstChild, originalStatus = node('decision-status').textContent
    expect(originalStatus).toContain('SAT')
    expect(node('model-evaluation').hidden).toBe(false)
    change('model-evaluate-input', 'Pr(A)')
    node<HTMLButtonElement>('model-evaluate-run').click(); await flush()
    expect(node('model-evaluate-status').textContent).toContain('Evaluation error: Model evaluation unavailable: model snapshot incomplete')
    expect(node('decision-status').textContent).toBe(originalStatus)
    expect(node('decision-results').firstChild).toBe(originalWitness)
    expect(node<HTMLButtonElement>('decision-save-smt').disabled).toBe(false)
    expect(mocks.evaluate).not.toHaveBeenCalled()
  })
})


test('imports a retired PrSATdo v1 file as the same causal SAT problem', async () => {
  load(async () => JSON.stringify({ version: 1, graph: 'A -> B', constraints: 'Pr(A)=0\nPr(B | do(A))=1', regular: false, answer: 'sat' })); await flush()
  expect(node<HTMLTextAreaElement>('decision-graph').value).toBe('A -> B')
  expect(node<HTMLInputElement>('decision-task-satisfiability').checked).toBe(true)
  expect(rowValues()).toBe('Pr(A)=0\nPr(B | do(A))=1')
  expect(node('decision-conclusion')).toBeDefined()
  expect(node('model-evaluation').hidden).toBe(true)
  expect(node('decision-results').textContent).toBe('')
  node<HTMLButtonElement>('decision-save').click()
  const value=JSON.parse(mocks.download.mock.calls[0][0])
  expect(value).toMatchObject({kind:'DoSAT-decision',task:'satisfiability',graph:'A -> B',premises:'Pr(A)=0\nPr(B | do(A))=1',conclusion:'',regular:false})
  node<HTMLButtonElement>('decision-run').click(); await flush()
  expect(mocks.decide.mock.calls[0][0].task).toBe('satisfiability')
})

test('a malformed retired problem is rejected before replacing current inputs', async () => {
  const before=problemState()
  load(async()=>JSON.stringify({version:1,graph:'A -> A',constraints:'Pr(A)=0',regular:false}));await flush()
  expect(node('decision-status').textContent).toContain('Load error')
  expect(problemState()).toEqual(before)
})

test('an unsafe integer node index is unsupported, not falsely diagnosed as non-DAG', () => {
 change('decision-graph','F9007199254740992 -> Y')
 expect(dom.window.document.getElementById('decision-graph-error')?.textContent).toContain('Unsupported')
 expect(dom.window.document.getElementById('decision-graph-error')?.textContent).not.toContain('not a DAG')
 expect(node('decision-graph-preview').hidden).toBe(true)
 expect(node('decision-graph-preview').querySelector('svg')).toBeNull()
 expect(node<HTMLButtonElement>('decision-run').disabled).toBe(true)
})
