import { afterEach, beforeEach, describe, expect, test, vi, type Mock } from 'vitest'
import { JSDOM } from 'jsdom'
import { create_model_evaluation_panel, type ModelEvaluationPanel } from './causal_evaluation_ui'
import type { ModelEvaluationResult } from './causal_model_evaluator'

type Evaluate = (source: string, signal: AbortSignal) => Promise<ModelEvaluationResult>
let dom: JSDOM
let panel: ModelEvaluationPanel
let evaluator: Mock<Evaluate>
let busyChange: Mock<(busy: boolean) => void>
const node = <T extends HTMLElement>(id: string): T => panel.element.querySelector(`[data-testid="${id}"]`) as T
const input = (): HTMLInputElement => node('model-evaluate-input')
const change = (source: string): void => {
  input().value = source
  input().dispatchEvent(new dom.window.Event('input', { bubbles: true }))
}
const flush = async (): Promise<void> => { for (let index = 0; index < 12; index++) await Promise.resolve() }
const pending = (): { promise: Promise<ModelEvaluationResult>, resolve: (value: ModelEvaluationResult) => void, reject: (error: Error) => void } => {
  let resolve!: (value: ModelEvaluationResult) => void, reject!: (error: Error) => void
  const promise = new Promise<ModelEvaluationResult>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const value = (exact = '(/ 1 2)'): ModelEvaluationResult => ({ status: 'value', kind: 'real', value: exact, probabilities: [] })
const show = (): void => panel.show('X; Y; Z', evaluator)
const run = (): void => node<HTMLButtonElement>('model-evaluate-run').click()
beforeEach(() => {
  dom = new JSDOM('<body></body>')
  vi.stubGlobal('document', dom.window.document)
  evaluator = vi.fn<Evaluate>().mockResolvedValue(value())
  busyChange = vi.fn<(busy: boolean) => void>()
  panel = create_model_evaluation_panel(busyChange)
  dom.window.document.body.append(panel.element)
})
afterEach(() => { dom.window.close(); vi.unstubAllGlobals() })

describe('returned causal model evaluation panel', () => {
  test('starts hidden and cannot dispatch an evaluation without a returned model', async () => {
    expect(panel.element.hidden).toBe(true)
    expect(panel.busy()).toBe(false)
    change('Pr(Y | do(X))')
    run()
    await flush()
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    expect(evaluator).not.toHaveBeenCalled()
    expect(busyChange).not.toHaveBeenCalled()
    show()
    expect(panel.element.hidden).toBe(false)
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(false)
  })

  test('labels the expression, preview and live status explicitly', () => {
    show()
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    expect(node('model-evaluate-status').textContent).toContain('Enter an expression')
    const label = panel.element.querySelector('label')!
    expect(label.textContent).toBe('Evaluate new expression in this returned model')
    expect(label.getAttribute('for')).toBe(input().id)
    const preview = node('model-evaluate-preview')
    expect(preview.getAttribute('role')).toBe('region')
    expect(preview.tabIndex).toBe(0)
    expect(preview.getAttribute('aria-label')).toBe('Evaluation expression preview')
    expect(node('model-evaluate-status').getAttribute('role')).toBe('status')
    expect(node('model-evaluate-status').getAttribute('aria-live')).toBe('polite')
    expect(panel.element.textContent).toContain('does not establish entailment')
  })

  test.each([
    'Pr(Y | do(X))', 'Pr(Y | do(~X), Z)', 'q + Pr(Y | do(X=1, ~Z))',
    'Pr(Y | do(X)) = 1/2 & a > 0',
  ])('shows a live causal MathML preview without evaluating valid source %s', source => {
    show()
    change(source)
    expect(node('model-evaluate-preview').querySelector('math')).not.toBeNull()
    expect(input().getAttribute('aria-invalid')).toBe('false')
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(false)
    expect(node('model-evaluate-status').textContent).toContain('Ready')
    expect(evaluator).not.toHaveBeenCalled()
    expect(busyChange).not.toHaveBeenCalled()
  })

  test.each(['Pr(Q | do(X))', 'Pr(Y | do(X,X))', 'Pr(Y | do(X & Z))', 'Pr(Y) =>'])('links a specific syntax error and disables evaluation for %s', source => {
    show()
    change(source)
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    expect(node('model-evaluate-preview').querySelector('math')).toBeNull()
    expect(input().getAttribute('aria-invalid')).toBe('true')
    const error = panel.element.querySelector<HTMLElement>('.decision-field-error')!
    expect(error.hidden).toBe(false)
    expect(error.textContent).toContain('Evaluation expression:')
    expect(input().getAttribute('aria-describedby')?.split(' ')).toContain(error.id)
    expect(node('model-evaluate-status').textContent).toContain('Fix the evaluation expression')
    expect(evaluator).not.toHaveBeenCalled()
  })

  test('keeps blank input disabled without announcing a syntax error', () => {
    show()
    change('  ')
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    expect(input().getAttribute('aria-invalid')).toBe('false')
    expect(panel.element.querySelector<HTMLElement>('.decision-field-error')!.hidden).toBe(true)
  })

  test('evaluates the submitted source with an abort signal and preserves arbitrary-size exact values', async () => {
    show()
    change('Pr(Y | do(X))')
    evaluator.mockResolvedValue({ status: 'value', kind: 'real', value: '(/ 9007199254740993 18014398509481987)', probabilities: [
      { source: 'Pr(Y | do(X))', defined: true, value: '(/ 9007199254740993 18014398509481987)' },
    ] })
    run()
    expect(panel.busy()).toBe(true)
    await flush()
    expect(evaluator).toHaveBeenCalledTimes(1)
    expect(evaluator.mock.calls[0][0]).toBe('Pr(Y | do(X))')
    expect(evaluator.mock.calls[0][1]).toBeInstanceOf(AbortSignal)
    expect(node('model-evaluate-result').textContent).toContain('9007199254740993/18014398509481987')
    expect(node('model-evaluate-result').querySelector('.causal-intervention')).not.toBeNull()
    expect(node('model-evaluate-probabilities').textContent).toContain('in this model')
    expect(panel.busy()).toBe(false)
    expect(busyChange.mock.calls).toEqual([[true], [false]])
  })

  test('keeps exact algebraic root notation without approximating it', async () => {
    const exact = '(root-obj (+ (^ x 2) (- 2)) 2)'
    show()
    change('a')
    evaluator.mockResolvedValue(value(exact))
    run()
    await flush()
    expect(node('model-evaluate-result').textContent).toContain(exact)
  })

  test.each([true, false])('labels constraint truth %s only as truth in this model', async truth => {
    show()
    change('Pr(Y | do(X)) > 0')
    evaluator.mockResolvedValue({ status: 'value', kind: 'constraint', value: truth, probabilities: [] })
    run()
    await flush()
    expect(node('model-evaluate-result').textContent).toBe(`${truth ? 'True' : 'False'} in this model.`)
    expect(node('model-evaluate-status').textContent).toBe('Evaluated in this model.')
    expect(node('model-evaluate-result').textContent).not.toContain('ENTAIL')
  })

  test('explains guarded constraint failure and lists undefined terms without approximating them', async () => {
    show()
    change('~(Pr(Y | Z) > 0)')
    evaluator.mockResolvedValue({ status: 'value', kind: 'constraint', value: false, probabilities: [
      { source: 'Pr(Y | Z)', defined: false },
    ] })
    run()
    await flush()
    expect(panel.element.textContent).toContain('Constraints use DoSAT\'s definedness guards')
    expect(panel.element.textContent).toContain('False may reflect an undefined probability term')
    expect(node('model-evaluate-result').textContent).toContain('False in this model.')
    expect(node('model-evaluate-probabilities').textContent).toContain('undefined (zero denominator)')
    expect(node('model-evaluate-probabilities').textContent).not.toContain('NaN')
  })

  test('reports undefinedness and the relevant exact term values separately from truth', async () => {
    show()
    change('Pr(Y | do(X), Z)')
    evaluator.mockResolvedValue({ status: 'undefined', reason: 'The conditioning event has probability zero.', probabilities: [
      { source: 'Pr(Y | do(X), Z)', defined: false }, { source: 'Pr(Z | do(X))', defined: true, value: '0' },
    ] })
    run()
    await flush()
    expect(node('model-evaluate-result').textContent).toContain('undefined (zero denominator)')
    expect(node('model-evaluate-result').textContent).toContain('The conditioning event has probability zero.')
    expect(node('model-evaluate-result').textContent).not.toContain('False in this model')
    expect(node('model-evaluate-probabilities').querySelectorAll('tbody tr')).toHaveLength(2)
  })

  test('reports an unassigned free-variable backend error without inventing a value and supports retry', async () => {
    show()
    change('q')
    evaluator.mockResolvedValueOnce({ status: 'error', message: 'Real variable q was not assigned in this model.' })
    run()
    await flush()
    expect(node('model-evaluate-status').textContent).toContain('Evaluation error: Real variable q')
    expect(node('model-evaluate-result').textContent).toContain('was not assigned')
    expect(node('model-evaluate-result').textContent).not.toContain('Exact value')
    expect(input().value).toBe('q')
    change('Pr(Y)')
    expect(node('model-evaluate-result').textContent).toBe('')
    run()
    await flush()
    expect(node('model-evaluate-result').textContent).toContain('1/2')
    expect(evaluator).toHaveBeenCalledTimes(2)
  })

  test('holds busy until a source-invalidated native operation settles and prevents overlap', async () => {
    const work = pending()
    evaluator.mockReturnValueOnce(work.promise)
    show()
    change('Pr(Y | do(X))')
    run()
    expect(panel.busy()).toBe(true)
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    const signal = evaluator.mock.calls[0][1]
    change('Pr(Y | do(~X))')
    expect(signal.aborted).toBe(true)
    expect(panel.busy()).toBe(true)
    expect(busyChange.mock.calls).toEqual([[true]])
    node('model-evaluate-run').dispatchEvent(new dom.window.Event('click'))
    expect(evaluator).toHaveBeenCalledTimes(1)
    work.resolve(value('777'))
    await flush()
    expect(node('model-evaluate-result').textContent).toBe('')
    expect(node('model-evaluate-status').textContent).toBe('Ready to evaluate in this model.')
    expect(panel.busy()).toBe(false)
    expect(busyChange.mock.calls).toEqual([[true], [false]])
    run()
    await flush()
    expect(evaluator.mock.calls[1][0]).toBe('Pr(Y | do(~X))')
    expect(node('model-evaluate-result').textContent).toContain('1/2')
    expect(node('model-evaluate-result').textContent).not.toContain('777')
  })

  test('a syntax-invalid edit aborts old work and remains disabled after its settlement', async () => {
    const work = pending()
    evaluator.mockReturnValueOnce(work.promise)
    show()
    change('Pr(Y)')
    run()
    change('Pr(Q)')
    expect(evaluator.mock.calls[0][1].aborted).toBe(true)
    work.resolve(value('123'))
    await flush()
    expect(panel.busy()).toBe(false)
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    expect(input().getAttribute('aria-invalid')).toBe('true')
    expect(node('model-evaluate-result').textContent).toBe('')
    expect(node('model-evaluate-status').textContent).toContain('Fix the evaluation expression')
  })

  test('clear hides and aborts without signalling false busy before native settlement', async () => {
    const work = pending()
    evaluator.mockReturnValueOnce(work.promise)
    show()
    change('Pr(Y)')
    run()
    panel.clear()
    expect(panel.element.hidden).toBe(true)
    expect(evaluator.mock.calls[0][1].aborted).toBe(true)
    expect(panel.busy()).toBe(true)
    expect(busyChange.mock.calls).toEqual([[true]])
    expect(node('model-evaluate-result').textContent).toBe('')
    expect(node('model-evaluate-preview').childElementCount).toBe(0)
    work.resolve(value('999'))
    await flush()
    expect(panel.busy()).toBe(false)
    expect(busyChange.mock.calls).toEqual([[true], [false]])
    expect(panel.element.hidden).toBe(true)
    expect(node('model-evaluate-result').textContent).toBe('')
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    show()
    expect(input().value).toBe('Pr(Y)')
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(false)
    run()
    await flush()
    expect(node('model-evaluate-result').textContent).toContain('1/2')
  })

  test('a replacement model cannot start until the previous evaluator settles and never shows its value', async () => {
    const work = pending()
    evaluator.mockReturnValueOnce(work.promise)
    show()
    change('Pr(Y)')
    run()
    const replacement = vi.fn<Evaluate>().mockResolvedValue(value('(/ 3 4)'))
    panel.show('X -> Y; Z', replacement)
    expect(evaluator.mock.calls[0][1].aborted).toBe(true)
    expect(panel.busy()).toBe(true)
    expect(busyChange.mock.calls).toEqual([[true]])
    node('model-evaluate-run').dispatchEvent(new dom.window.Event('click'))
    expect(replacement).not.toHaveBeenCalled()
    work.resolve(value('987'))
    await flush()
    expect(panel.busy()).toBe(false)
    expect(node('model-evaluate-result').textContent).toBe('')
    run()
    await flush()
    expect(replacement).toHaveBeenCalledTimes(1)
    expect(node('model-evaluate-result').textContent).toContain('3/4')
    expect(node('model-evaluate-result').textContent).not.toContain('987')
  })

  test('replacement graph revalidates a retained draft before it can run', () => {
    show()
    change('Pr(Y | do(X))')
    panel.show('X', evaluator)
    expect(input().value).toBe('Pr(Y | do(X))')
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    expect(input().getAttribute('aria-invalid')).toBe('true')
    expect(node('model-evaluate-preview').querySelector('math')).toBeNull()
  })

  test('cancellation waits for settlement, suppresses a late value, and then permits reuse', async () => {
    const work = pending()
    evaluator.mockReturnValueOnce(work.promise)
    show()
    change('Pr(Y)')
    run()
    node<HTMLButtonElement>('model-evaluate-cancel').click()
    expect(evaluator.mock.calls[0][1].aborted).toBe(true)
    expect(node('model-evaluate-status').textContent).toContain('waiting for it to settle')
    expect(panel.busy()).toBe(true)
    expect(node<HTMLButtonElement>('model-evaluate-cancel').disabled).toBe(true)
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
    expect(busyChange.mock.calls).toEqual([[true]])
    work.resolve(value('456'))
    await flush()
    expect(node('model-evaluate-status').textContent).toBe('Evaluation cancelled; no value accepted.')
    expect(node('model-evaluate-result').textContent).toBe('')
    expect(panel.busy()).toBe(false)
    run()
    await flush()
    expect(node('model-evaluate-result').textContent).toContain('1/2')
  })

  test('source replacement suppresses an abort-time rejection and settles busy honestly', async () => {
    const work = pending()
    evaluator.mockReturnValueOnce(work.promise)
    show()
    change('Pr(Y)')
    run()
    change('Pr(X)')
    work.reject(new Error('Old native simplify failed during interruption'))
    await flush()
    expect(node('model-evaluate-status').textContent).toBe('Ready to evaluate in this model.')
    expect(node('model-evaluate-result').textContent).toBe('')
    expect(panel.busy()).toBe(false)
    expect(busyChange.mock.calls).toEqual([[true], [false]])
  })

  test('clear suppresses late backend failure after interruption', async () => {
    const work = pending()
    evaluator.mockReturnValueOnce(work.promise)
    show()
    change('Pr(Y)')
    run()
    panel.clear()
    work.reject(new Error('Late failure from cleared model'))
    await flush()
    expect(panel.element.hidden).toBe(true)
    expect(node('model-evaluate-status').textContent).not.toContain('Late failure')
    expect(node('model-evaluate-result').textContent).toBe('')
    expect(panel.busy()).toBe(false)
  })

  test('surfaces current synchronous or asynchronous evaluator failures and releases busy', async () => {
    show()
    change('Pr(Y)')
    evaluator.mockImplementationOnce(() => { throw new Error('Cannot reconstruct captured model') })
    run()
    await flush()
    expect(node('model-evaluate-status').textContent).toContain('Evaluation error: Cannot reconstruct')
    expect(panel.busy()).toBe(false)
    evaluator.mockRejectedValueOnce(new Error('Current native operation failed'))
    run()
    await flush()
    expect(node('model-evaluate-status').textContent).toContain('Evaluation error: Current native operation failed')
    expect(busyChange.mock.calls).toEqual([[true], [false], [true], [false]])
  })

  test('returned cancellation establishes no value and leaves the panel reusable', async () => {
    show()
    change('Pr(Y)')
    evaluator.mockResolvedValueOnce({ status: 'cancelled' })
    run()
    await flush()
    expect(node('model-evaluate-status').textContent).toContain('no value accepted')
    expect(node('model-evaluate-result').textContent).toBe('')
    expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(false)
    expect(panel.busy()).toBe(false)
  })

  test('evaluation edits affect only this component and never mutate surrounding witness/problem DOM', async () => {
    const witness = dom.window.document.createElement('div')
    witness.textContent = 'Original witness remains available'
    const problem = dom.window.document.createElement('input')
    problem.value = 'Pr(Y | do(X))=3/4'
    dom.window.document.body.append(witness, problem)
    show()
    change('Pr(Y)')
    run()
    await flush()
    change('Pr(X)')
    expect(witness.textContent).toBe('Original witness remains available')
    expect(problem.value).toBe('Pr(Y | do(X))=3/4')
    expect(node('model-evaluate-result').textContent).toBe('')
  })
})

test.each(['Pr(Y)) + (Pr(X)','a) * (b','1) / (0'])('malformed parentheses disable Evaluate without a preview: %s',async source=>{
 show();change(source)
 expect(input().getAttribute('aria-invalid')).toBe('true')
 expect(node<HTMLButtonElement>('model-evaluate-run').disabled).toBe(true)
 expect(node('model-evaluate-preview').querySelector('math')).toBeNull()
 expect(node('model-evaluate-preview').textContent).toBe('')
 run();await flush();expect(evaluator).not.toHaveBeenCalled()
})
