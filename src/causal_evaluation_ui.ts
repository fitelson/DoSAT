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
    'Evaluate probabilities, arithmetic, assigned real variables, or Boolean constraints in this returned model. A parsed preview does not establish numerical definedness. The result does not establish entailment. Constraints use DoSAT\'s definedness guards: False may reflect an undefined probability term, which is listed with the result.')
  const error = el('div', { id: `${id}-error`, class: 'error decision-field-error' })
  error.hidden = true
  const run = tel('model-evaluate-run', 'button', { type: 'button', class: 'generate' }, 'Evaluate') as HTMLButtonElement
  const cancel = tel('model-evaluate-cancel', 'button', { type: 'button' }, 'Cancel evaluation') as HTMLButtonElement
  const status = tel('model-evaluate-status', 'p', {
    id: `${id}-status`, role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', class: 'decision-status',
  })
  const output = tel('model-evaluate-result', 'div', { class: 'model-evaluation-result' })
  const element = tel('model-evaluation', 'section', { class: 'model-evaluators generic-input-block decision-model-evaluation' },
    el('h3', {}, 'Evaluate model'),
    el('div', { class: 'decision-toolbar' }, batch, clear),
    editor.element, error, help,
    el('div', { class: 'model-evaluation-actions decision-toolbar' }, run, cancel), status, output)
  element.hidden = true
  let graph = ''
  let evaluator: ((source: string, signal: AbortSignal) => Promise<ModelEvaluationResult>) | undefined
  let valid = false
  let sources: { source: string, index: number }[] = []
  let generation = 0
  let working = false
  let active: { controller: AbortController } | undefined

  const refreshControls = (): void => {
    run.disabled = working || !evaluator || !valid || Boolean(element.hidden)
    cancel.disabled = !working || !active || active.controller.signal.aborted
  }
  const readiness = (): string => !evaluator ? 'No returned model is available.'
    : editor.pending() ? 'Batch edits are unapplied. Parse or Discard them before evaluating.'
      : !sources.length ? 'Enter an expression to evaluate in this model.'
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
        valid = sources.length > 0 && !errors.size && !editor.pending()
      }
    }
    editor.setErrors(errors)
    batch.textContent = editor.element.dataset.batchOpen === 'true' ? 'Hide Batch Input' : 'Show Batch Input'
    batch.setAttribute('aria-expanded', String(editor.element.dataset.batchOpen === 'true'))
  }
  const invalidate = (settlingMessage: string): void => {
    generation++
    active?.controller.abort()
    output.replaceChildren()
    validate()
    status.textContent = working ? settlingMessage : readiness()
    refreshControls()
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
  batch.addEventListener('click', () => { editor.toggleBatch(); validate() })
  clear.addEventListener('click', () => editor.clear())
  run.addEventListener('click', () => { void (async () => {
    if (working || !evaluator || !valid || element.hidden || editor.pending()) return
    const evaluate = evaluator, version = generation, submitted = sources.slice(), controller = new AbortController()
    const current = (): boolean => version === generation && evaluator === evaluate && !element.hidden
    active = { controller }
    output.replaceChildren()
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
          status.textContent = 'Evaluation cancelled; no value accepted.'
          return
        }
        results.push(result)
      }
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
    } catch (exception) {
      if (current()) {
        output.replaceChildren()
        if (controller.signal.aborted) status.textContent = 'Evaluation cancelled; no value accepted.'
        else showResult({ status: 'error', message: message_of(exception) })
      }
    } finally {
      active = undefined
      if (version !== generation && !element.hidden) status.textContent = readiness()
      setBusy(false)
    }
  })() })
  cancel.addEventListener('click', () => {
    if (!working || !active || active.controller.signal.aborted) return
    active.controller.abort()
    output.replaceChildren()
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
