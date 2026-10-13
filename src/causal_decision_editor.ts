import { el, tel } from './el'
import { render_causal_constraint } from './causal_to_html'
import { CAUSAL_LIMITS } from './causal_syntax'

export interface DecisionEditor {
  element: HTMLElement
  batch: HTMLTextAreaElement
  getValue(): string
  setValue(value: string): void
  setGraph(graph: string): void
  setLabel(label: string): void
  setErrors(errors: Map<number, string>): void
  setResults(results: Map<number, Node>): void
  pending(): boolean
  toggleBatch(): void
  clear(): void
}

interface Row {
  value: string
  element: HTMLElement
  input: HTMLInputElement
  remove: HTMLButtonElement
  newline: HTMLButtonElement
  info: HTMLButtonElement
  preview: HTMLElement
  error: HTMLElement
  help: HTMLElement
}

let nextEditor = 0

/** Applied rows and the unapplied batch draft deliberately have separate state. */
export const create_decision_editor = (onChange: () => void, mode: 'premises' | 'evaluation' = 'premises'): DecisionEditor => {
  const evaluation = mode === 'evaluation'
  const testPrefix = evaluation ? 'model-evaluate' : 'decision'
  const prefix = `decision-editor-${++nextEditor}`
  const initialLabel = evaluation ? 'Expressions and constraints in this returned model' : 'Premises (may be empty)'
  const heading = el('div', { class: 'decision-editor-label' }, initialLabel)
  const rowsContainer = el('div', { class: `split-input-block ${evaluation ? 'model-evaluation-rows' : 'decision-premise-rows'}` })
  const batch = tel(evaluation ? 'model-evaluate-batch' : 'decision-premises', 'textarea', {
    rows: '4', class: 'decision-batch-text', 'aria-label': evaluation ? 'Batch evaluation input' : 'Batch premise input',
    'aria-describedby': `${prefix}-batch-help ${prefix}-batch-status`,
  }) as HTMLTextAreaElement
  const batchHelp = el('p', { id: `${prefix}-batch-help`, class: 'decision-note' },
    evaluation ? 'One expression or constraint per line; blank lines and # comments are allowed. Parse replaces only these model checks.'
      : 'One premise per line; blank lines and # comments are allowed. Parse replaces the premises only.')
  const parse = tel(`${testPrefix}-parse`, 'button', { type: 'button' }, '⇩ Parse') as HTMLButtonElement
  const discard = tel(`${testPrefix}-discard-batch`, 'button', { type: 'button' }, 'Discard') as HTMLButtonElement
  const batchRegion = el('div', { class: 'batch-input decision-batch' }, batch, batchHelp,
    el('div', { class: 'decision-toolbar' }, parse, discard))
  batchRegion.hidden = true
  const batchStatus = tel(`${testPrefix}-batch-status`, 'p', {
    id: `${prefix}-batch-status`, class: 'decision-batch-status', role: 'status', 'aria-live': 'polite',
  })
  batchStatus.hidden = true
  const element = el('div', { class: 'generic-input-block decision-editor', 'data-batch-open': 'false' },
    heading, batchRegion, batchStatus, rowsContainer)
  let rows: Row[] = []
  let nextRow = 0
  let graph = ''
  let label = initialLabel
  let errors = new Map<number, string>()

  const singular = (): string => evaluation ? 'Expression' : /^constraints?/i.test(label) ? 'Constraint' : 'Premise'
  const getValue = (): string => rows.map(row => row.value).join('\n')
  const pending = (): boolean => batch.value !== getValue()
  const refreshBatch = (): void => {
    const unapplied = pending()
    batchStatus.textContent = unapplied
      ? `Batch changes are not applied. ${batchRegion.hidden ? 'Show Batch Input to ' : ''}Parse or Discard before running.`
      : ''
    batchStatus.hidden = !unapplied
    parse.disabled = !unapplied
    discard.disabled = !unapplied
  }
  const focusRow = (row: Row, position: number): void => {
    row.input.focus()
    const cursor = Math.min(Math.max(0, position), row.value.length)
    row.input.setSelectionRange(cursor, cursor)
  }
  const refreshRows = (): void => {
    rows.forEach((row, index) => {
      const name = `${singular()} ${index + 1}`
      row.element.dataset.testid = evaluation ? `model-evaluate-row-${index + 1}` : `decision-premise-row-${index + 1}`
      row.input.dataset.testid = evaluation ? `model-evaluate-input${index === 0 ? '' : `-${index + 1}`}` : `decision-premise-${index + 1}`
      if (evaluation) row.preview.dataset.testid = `model-evaluate-preview${index === 0 ? '' : `-${index + 1}`}`
      row.input.setAttribute('aria-label', name)
      row.preview.setAttribute('aria-label', `${name} ${evaluation ? 'result' : 'preview'}`)
      row.remove.setAttribute('aria-label', `Delete ${name.toLowerCase()}`)
      row.remove.disabled = rows.length === 1
      row.newline.setAttribute('aria-label', `Insert a row after ${name.toLowerCase()}`)
      row.info.setAttribute('aria-label', `Syntax help for ${name.toLowerCase()}`)
      const error = errors.get(index)
      row.error.textContent = error ? (/^(Premise|Constraint) \d+:/i.test(error) ? error : `${name}: ${error}`) : ''
      row.error.hidden = !error
      row.input.setAttribute('aria-invalid', error ? 'true' : 'false')
      row.input.setAttribute('aria-describedby', error ? `${row.help.id} ${row.error.id}` : row.help.id)
      row.preview.replaceChildren()
      const content = row.value.split('#', 1)[0].trim()
      if (!content) {
        if (row.value.trim().startsWith('#')) row.preview.textContent = 'Comment'
        return
      }
      if (evaluation) return
      try { row.preview.append(render_causal_constraint(graph, row.value)) }
      catch { if (!evaluation) row.preview.append(el('span', { class: 'decision-note' }, 'Preview unavailable.')) }
    })
  }
  const mutate = (change: () => void, structural = false): void => {
    const hadDraft = pending()
    change()
    errors = new Map()
    if (structural) rowsContainer.replaceChildren(...rows.map(row => row.element))
    if (!hadDraft) batch.value = getValue()
    refreshRows()
    refreshBatch()
    onChange()
  }
  const makeRow = (value: string): Row => {
    const id = `${prefix}-row-${++nextRow}`
    const remove = el('button', { type: 'button', class: 'close' }, '⌫') as HTMLButtonElement
    const input = el('input', { id: `${id}-input`, type: 'text', class: 'text', placeholder: evaluation ? 'Enter expression or constraint' : 'Enter constraint', autocomplete: 'off', spellcheck: 'false' }) as HTMLInputElement
    input.value = value
    const newline = el('button', { type: 'button', class: 'newline' }, '⏎') as HTMLButtonElement
    const info = el('button', { type: 'button', class: 'info', 'aria-expanded': 'false', 'aria-controls': `${id}-help` }, 'ⓘ') as HTMLButtonElement
    const preview = el('div', { class: 'constraint decision-preview', tabindex: '0', role: 'region' })
    const error = el('div', { id: `${id}-error`, class: 'error decision-field-error' })
    error.hidden = true
    const help = el('div', { id: `${id}-help`, class: 'input-instructions decision-row-help' },
      evaluation ? 'Evaluate probabilities, arithmetic, assigned real variables or Boolean constraints in this returned model. Use Pr(Y | do(X)) for interventions. Enter inserts a row; Up/Down move between rows. A preview describes syntax, not numerical definedness.'
        : 'Use Pr(Y | do(X)), Pr(Y | do(~X)), or Pr(Y | do(X, ~Z), Z). Numeric assignments such as do(X=1) also work. Combine constraints using ~, &, v, ->, and <->. A formula preview shows how the input was parsed; it does not establish that its conditioning probabilities are nonzero.')
    help.hidden = true
    const row: Row = { value, input, remove, newline, info, preview, error, help,
      element: el('div', { class: 'single-input decision-row' },
        el('div', { class: 'decision-row-controls' }, remove, input, newline, info), preview, error, help) }
    input.addEventListener('input', () => mutate(() => { row.value = input.value }))
    input.addEventListener('focus', () => row.element.classList.add('focused'))
    input.addEventListener('blur', () => row.element.classList.remove('focused'))
    input.addEventListener('keydown', event => {
      const index = rows.indexOf(row)
      const start = input.selectionStart ?? 0, end = input.selectionEnd ?? start
      if (event.key === 'Enter') {
        event.preventDefault()
        const next = makeRow(row.value.slice(end))
        mutate(() => {
          row.value = row.value.slice(0, start)
          input.value = row.value
          rows.splice(index + 1, 0, next)
        }, true)
        focusRow(next, 0)
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const next = rows[index + (event.key === 'ArrowUp' ? -1 : 1)]
        if (next) { event.preventDefault(); focusRow(next, end) }
      } else if (event.key === 'Backspace' && start === 0 && end === 0 && index > 0) {
        event.preventDefault()
        const previous = rows[index - 1], cursor = previous.value.length
        mutate(() => {
          previous.value += row.value
          previous.input.value = previous.value
          rows.splice(index, 1)
        }, true)
        focusRow(previous, cursor)
      }
    })
    remove.addEventListener('click', () => {
      const index = rows.indexOf(row)
      if (rows.length === 1) return
      const target = rows[index - 1] ?? rows[index + 1]
      mutate(() => { rows.splice(index, 1) }, true)
      focusRow(target, target.value.length)
    })
    newline.addEventListener('click', () => {
      const next = makeRow('')
      mutate(() => { rows.splice(rows.indexOf(row) + 1, 0, next) }, true)
      focusRow(next, 0)
    })
    info.addEventListener('click', () => {
      help.hidden = !help.hidden
      info.setAttribute('aria-expanded', String(!help.hidden))
    })
    return row
  }
  const setValue = (value: string): void => {
    // Match textarea newline normalization before deriving the applied rows.
    // Otherwise a lone CR is removed by a row input but changed to LF by batch,
    // leaving the displayed, applied and batch representations inconsistent.
    rows = value.replace(/\r\n?/g, '\n').split('\n').map(makeRow)
    errors = new Map()
    rowsContainer.replaceChildren(...rows.map(row => row.element))
    batch.value = getValue()
    refreshRows()
    refreshBatch()
  }
  batch.addEventListener('input', () => { refreshBatch(); onChange() })
  parse.addEventListener('click', () => {
    if (!pending()) return
    const lines = batch.value.split('\n').filter(line => line.split('#', 1)[0].trim())
    if (evaluation && (batch.value.length > CAUSAL_LIMITS.max_input_characters || lines.length > CAUSAL_LIMITS.max_constraints)) {
      batchStatus.textContent = `Model checks are limited to ${CAUSAL_LIMITS.max_constraints} expressions and ${CAUSAL_LIMITS.max_input_characters} characters. The batch was not applied.`
      batchStatus.hidden = false
      return
    }
    setValue(evaluation ? lines.join('\n') : batch.value)
    onChange()
    focusRow(rows[0], 0)
  })
  discard.addEventListener('click', () => {
    if (!pending()) return
    batch.value = getValue()
    refreshBatch()
    onChange()
    batch.focus()
  })
  setValue('')
  return {
    element, batch, getValue, setValue, pending,
    setGraph(value) { graph = value; refreshRows() },
    setLabel(value) { label = value; heading.textContent = value; batch.setAttribute('aria-label', `Batch ${singular().toLowerCase()} input`); refreshRows() },
    setErrors(value) { errors = new Map(value); refreshRows() },
    setResults(value) {
      if (!evaluation) return
      rows.forEach((row, index) => {
        row.preview.replaceChildren()
        const result = value.get(index)
        if (result) row.preview.append(result)
      })
    },
    toggleBatch() { batchRegion.hidden = !batchRegion.hidden; element.dataset.batchOpen = String(!batchRegion.hidden); refreshBatch() },
    clear() { setValue(''); onChange() },
  }
}
