import type { ModelEvaluationResult } from './causal_model_evaluator'
import { format_exact_value } from './causal_format'
import { render_causal_evaluation, render_causal_probability } from './causal_to_html'
import { el, tel } from './el'
import { create_decision_editor } from './causal_decision_editor'
import { CAUSAL_LIMITS } from './causal_syntax'

export interface ModelEvaluationPanel {
  element: HTMLElement
  show(graph: string, evaluate: (source: string, signal: AbortSignal) => Promise<ModelEvaluationResult>): void
  clear(): void
  busy(): boolean
}

let nextPanel = 0
const message_of = (error: unknown): string => error instanceof Error ? error.message : String(error)

/** The callback owns evaluation; this component owns only serialized UI work. */
export const create_model_evaluation_panel = (onBusyChange: (busy: boolean) => void): ModelEvaluationPanel => {
  const id = `model-evaluation-${++nextPanel}`
  const editor = create_decision_editor(() => invalidate('Expressions changed; cancelling evaluation and waiting for it to settle…'), 'evaluation')
  const batch = tel('model-evaluate-batch-toggle', 'button', { type: 'button', 'aria-expanded': 'false' }, 'Show Batch Input')
  const clear = tel('model-evaluate-clear', 'button', { type: 'button' }, 'Clear checks')
  const help = el('p', { id: `${id}-help`, class: 'decision-note' },
    'Rows evaluate automatically in this returned model. Batch Parse applies and evaluates all checks. The result does not establish entailment. Constraints use DoSAT\'s definedness guards: False may reflect an undefined probability term, which is listed with the result.')
  const error = el('div', { id: `${id}-error`, class: 'error decision-field-error' })
  error.hidden = true
  const run = tel('model-evaluate-run', 'button', { type: 'button', class: 'generate' }, 'Reevaluate') as HTMLButtonElement
  const cancel = tel('model-evaluate-cancel', 'button', { type: 'button' }, 'Cancel evaluation') as HTMLButtonElement
  const status = tel('model-evaluate-status', 'p', {
    id: `${id}-status`, role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', class: 'decision-status',
  })
  const output = tel('model-evaluate-result', 'div', { class: 'model-evaluation-result' })
  const details = el('details', { class: 'model-evaluation-details' }, el('summary', {}, 'Probability terms and evaluation details'), output)
  const element = tel('model-evaluation', 'section', { class: 'model-evaluators generic-input-block decision-model-evaluation' },
    el('h3', {}, 'Evaluate model'),
    el('div', { class: 'decision-toolbar' }, batch, clear),
    editor.element, error, help,
    el('div', { class: 'model-evaluation-actions decision-toolbar' }, run, cancel), status, details)
  element.hidden = true
  let graph = ''
  let evaluator: ((source: string, signal: AbortSignal) => Promise<ModelEvaluationResult>) | undefined
  let valid = false
  let sources: { source: string, index: number }[] = []
  let syntaxErrors = new Map<number, string>()
  let generation = 0
  let working = false
  let active: { controller: AbortController } | undefined
  const view = element.ownerDocument.defaultView!
  let timer: number | undefined
  let queued = false
  const stopTimer = (): void => { if (timer !== undefined) view.clearTimeout(timer); timer = undefined }
  const schedule = (delay = 180): void => {
    stopTimer()
    queued = valid && !!evaluator && !element.hidden && !editor.pending()
    if (!queued) return
    timer = view.setTimeout(() => {
      timer = undefined
      if (!working && queued) void evaluateBatch()
    }, delay)
  }

  const refreshControls = (): void => {
    run.disabled = working || !evaluator || !valid || Boolean(element.hidden)
    cancel.disabled = !working || !active || active.controller.signal.aborted
  }
  const readiness = (): string => !evaluator ? 'No returned model is available.'
    : editor.pending() ? 'Batch edits are unapplied. Parse or Discard them before evaluating.'
      : !sources.length ? (syntaxErrors.size ? 'Fix the evaluation expressions before evaluating.' : 'Enter an expression to evaluate in this model.')
        : valid ? (sources.length === 1 ? 'Ready to evaluate in this model.' : `Ready to evaluate ${sources.length} expressions in this model.`)
          : 'Fix the evaluation expressions before evaluating.'
  const validate = (): void => {
    valid = false
    error.textContent = ''
    error.hidden = true
    const errors = new Map<number, string>()
    sources = editor.getValue().split('\n').map((source, index) => ({ source, index }))
      .filter(row => row.source.split('#', 1)[0].trim())
    if (evaluator) {
      if (sources.length > CAUSAL_LIMITS.max_constraints || graph.length + editor.getValue().length > CAUSAL_LIMITS.max_input_characters) {
        error.textContent = `Model checks are limited to ${CAUSAL_LIMITS.max_constraints} expressions and ${CAUSAL_LIMITS.max_input_characters} characters.`
        error.hidden = false
      } else {
        for (const row of sources) {
          try { render_causal_evaluation(graph, row.source) }
          catch (exception) { errors.set(row.index, message_of(exception)) }
        }
        sources = sources.filter(row => !errors.has(row.index))
        valid = sources.length > 0 && !editor.pending()
      }
    }
    syntaxErrors = errors
    editor.setErrors(errors)
    editor.setResults(new Map([...errors].map(([index, message]) => [index, el('span', { class: 'error' }, `Invalid expression: ${message}`)])))
    batch.textContent = editor.element.dataset.batchOpen === 'true' ? 'Hide Batch Input' : 'Show Batch Input'
    batch.setAttribute('aria-expanded', String(editor.element.dataset.batchOpen === 'true'))
  }
  const invalidate = (settlingMessage: string): void => {
    generation++
    active?.controller.abort()
    output.replaceChildren()
    editor.setResults(new Map())
    validate()
    status.textContent = working ? settlingMessage : readiness()
    refreshControls()
    schedule()
  }
  const setBusy = (value: boolean): void => {
    if (working === value) return
    working = value
    refreshControls()
    onBusyChange(value)
  }
  const showProbabilities = (target: HTMLElement, values: Extract<ModelEvaluationResult, { status: 'value' | 'undefined' }>['probabilities']): void => {
    if (!values.length) return
    const table = tel(target === output ? 'model-evaluate-probabilities' : `${target.dataset.testid}-probabilities`, 'table', { class: 'causal-table' },
      el('caption', {}, 'Probability term values in this model'),
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Probability'), el('th', { scope: 'col' }, 'Exact value'))),
      el('tbody', {}, ...values.map(value => {
        let formula: Node
        try { formula = render_causal_probability(graph, value.source) }
        catch { formula = el('code', {}, value.source) }
        return el('tr', {}, el('td', {}, formula),
          el('td', {}, value.defined ? format_exact_value(value.value) : 'undefined (zero denominator)'))
      })),
    )
    target.append(el('div', {
      class: 'causal-table-scroll', tabindex: '0', role: 'region', 'aria-label': 'Evaluation probability term values',
    }, table))
  }
  const showResult = (result: ModelEvaluationResult, target = output): void => {
    switch (result.status) {
      case 'value':
        status.textContent = 'Evaluated in this model.'
        target.append(el('p', { class: 'model-evaluation-value' }, result.kind === 'real'
          ? `Exact value in this model: ${format_exact_value(result.value)}`
          : `${result.value ? 'True' : 'False'} in this model.`))
        showProbabilities(target, result.probabilities)
        break
      case 'undefined':
        status.textContent = 'The expression is undefined in this model.'
        target.append(el('p', { class: 'error model-evaluation-value' }, 'undefined (zero denominator) in this model.'),
          el('p', { class: 'decision-note' }, result.reason))
        showProbabilities(target, result.probabilities)
        break
      case 'error':
        status.textContent = `Evaluation error: ${result.message}`
        target.append(el('p', { class: 'error' }, result.message))
        break
      case 'cancelled': status.textContent = 'Evaluation cancelled; no value accepted.'; break
    }
  }
  batch.addEventListener('click', () => {
    editor.toggleBatch()
    batch.textContent = editor.element.dataset.batchOpen === 'true' ? 'Hide Batch Input' : 'Show Batch Input'
    batch.setAttribute('aria-expanded', String(editor.element.dataset.batchOpen === 'true'))
  })
  clear.addEventListener('click', () => editor.clear())
  const evaluateBatch = async (): Promise<void> => {
    if (working || !evaluator || !valid || element.hidden || editor.pending()) return
    stopTimer(); queued = false
    const evaluate = evaluator, version = generation, submitted = sources.slice(), controller = new AbortController()
    const current = (): boolean => version === generation && evaluator === evaluate && !element.hidden
    active = { controller }
    output.replaceChildren()
    editor.setResults(new Map(submitted.map(row => [row.index, el('span', { class: 'decision-note' }, 'Evaluating…')])))
    status.textContent = 'Evaluating in this model…'
    setBusy(true)
    try {
      const results: ModelEvaluationResult[] = []
      for (const row of submitted) {
        if (controller.signal.aborted || !current()) return
        let result: ModelEvaluationResult
        try { result = await evaluate(row.source, controller.signal) }
        catch (exception) { result = { status: 'error', message: message_of(exception) } }
        if (!current()) return
        if (controller.signal.aborted || result.status === 'cancelled') {
          editor.setResults(new Map())
          status.textContent = 'Evaluation cancelled; no value accepted.'
          return
        }
        results.push(result)
      }
      const inline = new Map<number, Node>()
      for (const [index, message] of syntaxErrors) inline.set(index, el('span', { class: 'error' }, `Invalid expression: ${message}`))
      results.forEach((result, index) => {
        const text = result.status === 'value' ? (result.kind === 'real' ? format_exact_value(result.value) : result.value ? 'True' : 'False')
          : result.status === 'undefined' ? 'undefined (zero denominator)'
            : result.status === 'error' ? `Error: ${result.message}` : 'Cancelled'
        inline.set(submitted[index].index, el('span', { class: `model-evaluation-inline-value${result.status === 'error' || result.status === 'undefined' ? ' error' : ''}`, 'aria-label': `${text} in this model` }, text))
      })
      editor.setResults(inline)
      if (submitted.length === 1) showResult(results[0])
      else {
        let failures = 0
        results.forEach((result, index) => {
          const row = submitted[index]
          const target = tel(`model-evaluate-item-${row.index + 1}`, 'section', { class: 'model-evaluation-item' },
            el('h4', {}, `Expression ${row.index + 1}`),
            el('div', { class: 'decision-preview', tabindex: '0', role: 'region', 'aria-label': `Evaluated expression ${row.index + 1}` }, render_causal_evaluation(graph, row.source)))
          showResult(result, target)
          output.append(target)
          if (result.status === 'error' || result.status === 'undefined') failures++
        })
        status.textContent = `Evaluated ${results.length} expressions in this model.${failures ? ` ${failures} could not be evaluated; see their results.` : ''}`
      }
      if (syntaxErrors.size) status.append(` ${syntaxErrors.size} expression${syntaxErrors.size === 1 ? ' has' : 's have'} a syntax error.`)
    } catch (exception) {
      if (current()) {
        output.replaceChildren()
        editor.setResults(new Map())
        if (controller.signal.aborted) status.textContent = 'Evaluation cancelled; no value accepted.'
        else showResult({ status: 'error', message: message_of(exception) })
      }
    } finally {
      active = undefined
      if (version !== generation && !element.hidden) status.textContent = readiness()
      setBusy(false)
      if (queued && timer === undefined) schedule(0)
    }
  }
  run.addEventListener('click', () => { void evaluateBatch() })
  cancel.addEventListener('click', () => {
    if (!working || !active || active.controller.signal.aborted) return
    queued = false; stopTimer()
    active.controller.abort()
    output.replaceChildren()
    editor.setResults(new Map())
    status.textContent = 'Cancelling evaluation; waiting for it to settle…'
    refreshControls()
  })
  status.textContent = readiness()
  refreshControls()
  return {
    element,
    show(source, evaluate) {
      graph = source
      editor.setGraph(source)
      evaluator = evaluate
      element.hidden = false
      invalidate('Model changed; cancelling the previous evaluation and waiting for it to settle…')
    },
    clear() {
      evaluator = undefined
      graph = ''
      editor.setGraph('')
      element.hidden = true
      invalidate('Model cleared; cancelling evaluation and waiting for it to settle…')
    },
    busy: () => working,
  }
}
