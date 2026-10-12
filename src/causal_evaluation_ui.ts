import type { ModelEvaluationResult } from './causal_model_evaluator'
import { format_exact_value } from './causal_format'
import { render_causal_evaluation, render_causal_probability } from './causal_to_html'
import { el, tel } from './el'

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
  const input = tel('model-evaluate-input', 'input', {
    id: `${id}-input`, type: 'text', class: 'text model-evaluation-input',
    placeholder: 'Pr(Y | do(X)), a real expression, or a constraint', autocomplete: 'off', spellcheck: 'false',
    'aria-describedby': `${id}-help ${id}-error ${id}-status`, 'aria-invalid': 'false',
  }) as HTMLInputElement
  const help = el('p', { id: `${id}-help`, class: 'decision-note' },
    'Evaluate probabilities, arithmetic, assigned real variables, or Boolean constraints in this returned model. A parsed preview does not establish numerical definedness. The result does not establish entailment. Constraints use DoSAT\'s definedness guards: False may reflect an undefined probability term, which is listed with the result.')
  const error = el('div', { id: `${id}-error`, class: 'error decision-field-error' })
  error.hidden = true
  const preview = tel('model-evaluate-preview', 'div', {
    class: 'constraint decision-preview model-evaluation-preview', tabindex: '0', role: 'region',
    'aria-label': 'Evaluation expression preview',
  })
  const run = tel('model-evaluate-run', 'button', { type: 'button', class: 'generate' }, 'Evaluate') as HTMLButtonElement
  const cancel = tel('model-evaluate-cancel', 'button', { type: 'button' }, 'Cancel evaluation') as HTMLButtonElement
  const status = tel('model-evaluate-status', 'p', {
    id: `${id}-status`, role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', class: 'decision-status',
  })
  const output = tel('model-evaluate-result', 'div', { class: 'model-evaluation-result' })
  const element = tel('model-evaluation', 'section', { class: 'model-evaluators generic-input-block decision-model-evaluation' },
    el('h3', {}, 'Evaluate model'),
    el('label', { for: input.id }, 'Evaluate new expression in this returned model'),
    el('div', { class: 'model-evaluation-controls' }, input),
    preview, error, help,
    el('div', { class: 'model-evaluation-actions decision-toolbar' }, run, cancel), status, output)
  element.hidden = true
  let graph = ''
  let evaluator: ((source: string, signal: AbortSignal) => Promise<ModelEvaluationResult>) | undefined
  let valid = false
  let generation = 0
  let working = false
  let active: { controller: AbortController } | undefined

  const refreshControls = (): void => {
    run.disabled = working || !evaluator || !valid || Boolean(element.hidden)
    cancel.disabled = !working || !active || active.controller.signal.aborted
  }
  const readiness = (): string => !evaluator ? 'No returned model is available.'
    : !input.value.trim() ? 'Enter an expression to evaluate in this model.'
      : valid ? 'Ready to evaluate in this model.' : 'Fix the evaluation expression before evaluating.'
  const validate = (): void => {
    valid = false
    preview.replaceChildren()
    error.textContent = ''
    error.hidden = true
    input.setAttribute('aria-invalid', 'false')
    if (!evaluator || !input.value.trim()) return
    try { preview.append(render_causal_evaluation(graph, input.value)); valid = true }
    catch (exception) {
      error.textContent = `Evaluation expression: ${message_of(exception)}`
      error.hidden = false
      input.setAttribute('aria-invalid', 'true')
    }
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
  const showProbabilities = (values: Extract<ModelEvaluationResult, { status: 'value' | 'undefined' }>['probabilities']): void => {
    if (!values.length) return
    const table = tel('model-evaluate-probabilities', 'table', { class: 'causal-table' },
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
    output.append(el('div', {
      class: 'causal-table-scroll', tabindex: '0', role: 'region', 'aria-label': 'Evaluation probability term values',
    }, table))
  }
  const showResult = (result: ModelEvaluationResult): void => {
    switch (result.status) {
      case 'value':
        status.textContent = 'Evaluated in this model.'
        output.append(el('p', { class: 'model-evaluation-value' }, result.kind === 'real'
          ? `Exact value in this model: ${format_exact_value(result.value)}`
          : `${result.value ? 'True' : 'False'} in this model.`))
        showProbabilities(result.probabilities)
        break
      case 'undefined':
        status.textContent = 'The expression is undefined in this model.'
        output.append(el('p', { class: 'error model-evaluation-value' }, 'undefined (zero denominator) in this model.'),
          el('p', { class: 'decision-note' }, result.reason))
        showProbabilities(result.probabilities)
        break
      case 'error':
        status.textContent = `Evaluation error: ${result.message}`
        output.append(el('p', { class: 'error' }, result.message))
        break
      case 'cancelled': status.textContent = 'Evaluation cancelled; no value accepted.'; break
    }
  }
  input.addEventListener('input', () => invalidate('Expression changed; cancelling evaluation and waiting for it to settle…'))
  run.addEventListener('click', () => { void (async () => {
    if (working || !evaluator || !valid || element.hidden) return
    const evaluate = evaluator, version = generation, source = input.value, controller = new AbortController()
    active = { controller }
    output.replaceChildren()
    status.textContent = 'Evaluating in this model…'
    setBusy(true)
    try {
      const result = await evaluate(source, controller.signal)
      if (version !== generation || evaluator !== evaluate || element.hidden) return
      if (controller.signal.aborted) status.textContent = 'Evaluation cancelled; no value accepted.'
      else showResult(result)
    } catch (exception) {
      if (version === generation && evaluator === evaluate && !element.hidden) {
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
      evaluator = evaluate
      element.hidden = false
      invalidate('Model changed; cancelling the previous evaluation and waiting for it to settle…')
    },
    clear() {
      evaluator = undefined
      graph = ''
      element.hidden = true
      invalidate('Model cleared; cancelling evaluation and waiting for it to settle…')
    },
    busy: () => working,
  }
}
