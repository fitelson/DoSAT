import { afterEach, beforeEach, describe, expect, test, vi, type Mock } from 'vitest'
import { JSDOM } from 'jsdom'
import { create_decision_editor, type DecisionEditor } from './causal_decision_editor'

let dom: JSDOM
let editor: DecisionEditor
let changed: Mock<() => void>
const inputs = (): HTMLInputElement[] => [...editor.element.querySelectorAll<HTMLInputElement>('.single-input input')]
const rows = (): HTMLElement[] => [...editor.element.querySelectorAll<HTMLElement>('.single-input')]
const button = (id: string): HTMLButtonElement => editor.element.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!
const type = (field: HTMLInputElement | HTMLTextAreaElement, value: string): void => {
  field.value = value
  field.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
}
const key = (field: HTMLInputElement, value: string): KeyboardEvent => {
  const event = new dom.window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true })
  field.dispatchEvent(event)
  return event
}
beforeEach(() => {
  dom = new JSDOM('<body></body>')
  vi.stubGlobal('document', dom.window.document)
  changed = vi.fn<() => void>()
  editor = create_decision_editor(changed)
  editor.setGraph('X; Y; Z')
  dom.window.document.body.append(editor.element)
})
afterEach(() => { dom.window.close(); vi.unstubAllGlobals() })

describe('causal decision row editor', () => {
  test('keeps one empty placeholder for empty premises, without creating a constraint', () => {
    expect(inputs()).toHaveLength(1)
    expect(editor.getValue()).toBe('')
    expect(editor.pending()).toBe(false)
    expect(changed).not.toHaveBeenCalled()
    editor.setValue('Pr(X)=1/2\nPr(Y)=1/3')
    expect(inputs()).toHaveLength(2)
    expect(editor.getValue()).toBe('Pr(X)=1/2\nPr(Y)=1/3')
    expect(editor.batch.value).toBe(editor.getValue())
    expect(changed).not.toHaveBeenCalled()
  })

  test('applies a keystroke synchronously before notifying its caller and keeps focus', () => {
    const observed: string[] = []
    editor = create_decision_editor(() => observed.push(editor.getValue()))
    editor.setGraph('X')
    dom.window.document.body.append(editor.element)
    const input = inputs()[0]
    input.focus()
    type(input, 'Pr(X)=1/2')
    expect(observed).toEqual(['Pr(X)=1/2'])
    expect(editor.pending()).toBe(false)
    expect(dom.window.document.activeElement).toBe(input)
    expect(input.closest('.single-input')?.querySelector('math')).not.toBeNull()
  })

  test('Enter splits the selected range into two applied rows and focuses the new row', () => {
    editor.setValue('Pr(X)=1/2 Pr(Y)=1/3\nPr(Z)=0')
    const first = inputs()[0], untouchedId = inputs()[1].id
    first.focus()
    first.setSelectionRange(9, 10)
    expect(key(first, 'Enter').defaultPrevented).toBe(true)
    expect(editor.getValue()).toBe('Pr(X)=1/2\nPr(Y)=1/3\nPr(Z)=0')
    expect(dom.window.document.activeElement).toBe(inputs()[1])
    expect(inputs()[1].selectionStart).toBe(0)
    expect(inputs()[2].id).toBe(untouchedId)
    expect(editor.batch.value).toBe(editor.getValue())
    expect(changed).toHaveBeenCalledTimes(1)
  })

  test('Up and Down move between rows with a bounded cursor position', () => {
    editor.setValue('Pr(X)=1/2\nZ')
    inputs()[0].focus()
    inputs()[0].setSelectionRange(8, 8)
    expect(key(inputs()[0], 'ArrowDown').defaultPrevented).toBe(true)
    expect(dom.window.document.activeElement).toBe(inputs()[1])
    expect(inputs()[1].selectionStart).toBe(1)
    key(inputs()[1], 'ArrowUp')
    expect(dom.window.document.activeElement).toBe(inputs()[0])
    expect(inputs()[0].selectionStart).toBe(1)
    expect(key(inputs()[0], 'ArrowUp').defaultPrevented).toBe(false)
    expect(changed).not.toHaveBeenCalled()
  })

  test('Backspace at the start merges with the preceding row and keeps the junction cursor', () => {
    editor.setValue('Pr(X)\n=1/2')
    const last = inputs()[1]
    last.focus()
    last.setSelectionRange(0, 0)
    expect(key(last, 'Backspace').defaultPrevented).toBe(true)
    expect(editor.getValue()).toBe('Pr(X)=1/2')
    expect(inputs()).toHaveLength(1)
    expect(dom.window.document.activeElement).toBe(inputs()[0])
    expect(inputs()[0].selectionStart).toBe(5)
    expect(changed).toHaveBeenCalledTimes(1)
  })

  test('Backspace does not merge when text is selected', () => {
    editor.setValue('Pr(X)\n=1/2')
    inputs()[1].focus()
    inputs()[1].setSelectionRange(0, 1)
    expect(key(inputs()[1], 'Backspace').defaultPrevented).toBe(false)
    expect(editor.getValue()).toBe('Pr(X)\n=1/2')
    expect(changed).not.toHaveBeenCalled()
  })

  test('insert and delete controls preserve nearby focus and renumber accessible names', () => {
    editor.setValue('Pr(X)=1/2\nPr(Y)=1/3')
    rows()[0].querySelector<HTMLButtonElement>('.newline')!.click()
    expect(editor.getValue()).toBe('Pr(X)=1/2\n\nPr(Y)=1/3')
    expect(dom.window.document.activeElement).toBe(inputs()[1])
    expect(inputs()[2].getAttribute('aria-label')).toBe('Premise 3')
    expect(rows()[2].querySelector('.close')?.getAttribute('aria-label')).toBe('Delete premise 3')
    rows()[1].querySelector<HTMLButtonElement>('.close')!.click()
    expect(editor.getValue()).toBe('Pr(X)=1/2\nPr(Y)=1/3')
    expect(dom.window.document.activeElement).toBe(inputs()[0])
    expect(inputs()[1].getAttribute('aria-label')).toBe('Premise 2')
    expect(changed).toHaveBeenCalledTimes(2)
  })

  test('unapplied batch input immediately invalidates and stays pending when hidden', () => {
    editor.setValue('Pr(X)=1/2')
    editor.toggleBatch()
    expect(editor.element.dataset.batchOpen).toBe('true')
    type(editor.batch, 'Pr(Y)=1/3')
    expect(editor.pending()).toBe(true)
    expect(editor.getValue()).toBe('Pr(X)=1/2')
    expect(button('decision-parse').disabled).toBe(false)
    expect(changed).toHaveBeenCalledTimes(1)
    editor.toggleBatch()
    expect(editor.element.dataset.batchOpen).toBe('false')
    expect(editor.pending()).toBe(true)
    expect(editor.batch.value).toBe('Pr(Y)=1/3')
    const warning = editor.element.querySelector<HTMLElement>('[data-testid="decision-batch-status"]')!
    expect(warning.hidden).toBe(false)
    expect(warning.textContent).toContain('not applied')
    expect(warning.textContent).toContain('Show Batch Input to Parse or Discard')
    expect(warning.getAttribute('role')).toBe('status')
    editor.toggleBatch()
    expect(warning.textContent).not.toContain('Show Batch Input')
    expect(warning.textContent).toContain('Parse or Discard')
  })

  test('Parse replaces applied premises and preserves physical blanks and comments for errors', () => {
    editor.setValue('Pr(X)=1/2')
    const physical = 'Pr(X)=1/2\n\n# a comment\nPr(Q)=0\n'
    type(editor.batch, physical)
    button('decision-parse').click()
    expect(editor.getValue()).toBe(physical)
    expect(inputs()).toHaveLength(5)
    expect(editor.pending()).toBe(false)
    expect(dom.window.document.activeElement).toBe(inputs()[0])
    editor.setErrors(new Map([[3, 'Causal variable Q is not declared in the graph.']]))
    expect(inputs()[3].getAttribute('aria-invalid')).toBe('true')
    expect(rows()[3].querySelector('.decision-field-error')?.textContent).toBe('Premise 4: Causal variable Q is not declared in the graph.')
    const descriptionIds = inputs()[3].getAttribute('aria-describedby')!.split(' ')
    expect(descriptionIds.every(id => dom.window.document.getElementById(id))).toBe(true)
    expect(inputs()[0].getAttribute('aria-invalid')).toBe('false')
    expect(changed).toHaveBeenCalledTimes(2)
  })

  test('Discard restores batch text without replacing applied row identities', () => {
    editor.setValue('Pr(X)=1/2\nPr(Y)=1/3')
    const first = inputs()[0]
    type(editor.batch, 'Pr(Z)=0')
    button('decision-discard-batch').click()
    expect(editor.batch.value).toBe('Pr(X)=1/2\nPr(Y)=1/3')
    expect(editor.pending()).toBe(false)
    expect(inputs()[0]).toBe(first)
    expect(button('decision-discard-batch').disabled).toBe(true)
    expect(changed).toHaveBeenCalledTimes(2)
  })

  test('a pending batch draft survives row edits and can still be applied', () => {
    editor.setValue('Pr(X)=1/2')
    type(editor.batch, 'Pr(Z)=0')
    type(inputs()[0], 'Pr(Y)=1/3')
    expect(editor.getValue()).toBe('Pr(Y)=1/3')
    expect(editor.batch.value).toBe('Pr(Z)=0')
    expect(editor.pending()).toBe(true)
    button('decision-parse').click()
    expect(editor.getValue()).toBe('Pr(Z)=0')
    expect(editor.pending()).toBe(false)
  })

  test('task labels update every row and error without changing the applied input', () => {
    editor.setValue('Pr(X)=1/2\nPr(Y)=1/3')
    editor.setErrors(new Map([[1, 'A specific error.']]))
    editor.setLabel('Constraints (may be empty)')
    expect(inputs()[1].getAttribute('aria-label')).toBe('Constraint 2')
    expect(rows()[1].querySelector('.decision-preview')?.getAttribute('aria-label')).toBe('Constraint 2 preview')
    expect(rows()[1].querySelector('.decision-field-error')?.textContent).toBe('Constraint 2: A specific error.')
    expect(editor.batch.getAttribute('aria-label')).toBe('Batch constraint input')
    expect(editor.getValue()).toBe('Pr(X)=1/2\nPr(Y)=1/3')
    expect(changed).not.toHaveBeenCalled()
  })

  test('graph changes re-render every applied row against the current graph', () => {
    editor.setValue('Pr(Y | do(X))=1/2\nPr(Z)=1/3')
    expect(editor.element.querySelectorAll('math')).toHaveLength(2)
    editor.setGraph('X; Y')
    expect(rows()[0].querySelector('math')).not.toBeNull()
    expect(rows()[1].querySelector('math')).toBeNull()
    expect(rows()[1].textContent).toContain('Preview unavailable')
    editor.setGraph('X; Y; Z')
    expect(editor.element.querySelectorAll('math')).toHaveLength(2)
    expect(changed).not.toHaveBeenCalled()
  })

  test('row help expands with a row-specific name and qualifies numerical definedness', () => {
    const help = rows()[0].querySelector<HTMLElement>('.decision-row-help')!
    const info = rows()[0].querySelector<HTMLButtonElement>('.info')!
    expect(info.getAttribute('aria-label')).toBe('Syntax help for premise 1')
    expect(help.hidden).toBe(true)
    info.click()
    expect(info.getAttribute('aria-expanded')).toBe('true')
    expect(help.hidden).toBe(false)
    expect(help.textContent).toContain('does not establish')
    expect(changed).not.toHaveBeenCalled()
  })

  test('programmatic replacement discards an old draft silently; Clear notifies and retains graph', () => {
    editor.setValue('Pr(X)=1/2')
    type(editor.batch, 'Pr(Y)=1/3')
    changed.mockClear()
    editor.setValue('Pr(Z)=1/4')
    expect(editor.pending()).toBe(false)
    expect(editor.batch.value).toBe('Pr(Z)=1/4')
    expect(changed).not.toHaveBeenCalled()
    editor.clear()
    expect(editor.getValue()).toBe('')
    expect(inputs()).toHaveLength(1)
    expect(changed).toHaveBeenCalledTimes(1)
    type(inputs()[0], 'Pr(Z)=1/3')
    expect(rows()[0].querySelector('math')).not.toBeNull()
  })

  test.each(['\r\n', '\r', '\n'])('normalizes %j newlines consistently without losing physical blank/comment rows', separator => {
    const physicalRows = ['Pr(X)=1/2', '', '# a comment', 'Pr(Y)=1/3', '']
    editor.setValue(physicalRows.join(separator))
    const normalized = physicalRows.join('\n')
    expect(inputs().map(input => input.value)).toEqual(physicalRows)
    expect(editor.getValue()).toBe(normalized)
    expect(editor.batch.value).toBe(normalized)
    expect(editor.pending()).toBe(false)
    expect(button('decision-parse').disabled).toBe(true)
    expect(button('decision-discard-batch').disabled).toBe(true)
    expect(changed).not.toHaveBeenCalled()
    editor.setErrors(new Map([[3, 'An error on the fourth physical line.']]))
    expect(rows()[3].querySelector('.decision-field-error')?.textContent).toBe('Premise 4: An error on the fourth physical line.')
  })

  test('a lone CR inside a constraint becomes a physical newline consistently, rather than disappearing in visible input', () => {
    editor.setValue('Pr(X)\r=1/2')
    expect(inputs().map(input => input.value)).toEqual(['Pr(X)', '=1/2'])
    expect(editor.getValue()).toBe('Pr(X)\n=1/2')
    expect(editor.batch.value).toBe(editor.getValue())
    expect(editor.pending()).toBe(false)
    expect(rows().every(row => row.textContent?.includes('Preview unavailable'))).toBe(true)
    type(inputs()[1], '=1/3')
    expect(editor.batch.value).toBe(editor.getValue())
    expect(editor.pending()).toBe(false)
  })

  test('mixed CRLF and lone CR batch text applies with the same normalized displayed values', () => {
    editor.setValue('Pr(X)=1/2')
    type(editor.batch, 'Pr(Y)=1/3\r\n\r# a comment\r\nPr(Z)=1/4')
    expect(editor.pending()).toBe(true)
    button('decision-parse').click()
    const physicalRows = ['Pr(Y)=1/3', '', '# a comment', 'Pr(Z)=1/4']
    expect(inputs().map(input => input.value)).toEqual(physicalRows)
    expect(editor.getValue()).toBe(physicalRows.join('\n'))
    expect(editor.batch.value).toBe(editor.getValue())
    expect(editor.pending()).toBe(false)
  })

  test('previews are named keyboard-focusable block regions whose names track row insertion and deletion', () => {
    editor.setValue('Pr(X)=1/2\nPr(Y)=1/3')
    const preview = rows()[1].querySelector<HTMLElement>('.decision-preview')!
    expect(preview.tagName).toBe('DIV')
    expect(preview.getAttribute('role')).toBe('region')
    expect(preview.tabIndex).toBe(0)
    expect(preview.getAttribute('aria-label')).toBe('Premise 2 preview')
    preview.focus()
    expect(dom.window.document.activeElement).toBe(preview)
    rows()[0].querySelector<HTMLButtonElement>('.newline')!.click()
    expect(preview.getAttribute('aria-label')).toBe('Premise 3 preview')
    rows()[1].querySelector<HTMLButtonElement>('.close')!.click()
    expect(preview.getAttribute('aria-label')).toBe('Premise 2 preview')
    editor.setLabel('Constraints (may be empty)')
    expect(preview.getAttribute('aria-label')).toBe('Constraint 2 preview')
  })
})
