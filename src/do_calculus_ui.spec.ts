import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { JSDOM } from 'jsdom'

const calls = vi.hoisted(() => ({ download: vi.fn() }))
vi.mock('./download', () => ({ download: calls.download }))
let dom: JSDOM
const node = <T extends HTMLElement>(id: string): T => dom.window.document.querySelector(`[data-testid="${id}"]`) as T
const flush = async () => { for (let n = 0; n < 12; n++) await Promise.resolve() }
const change = (id: string, value: string) => {
  const input = node<HTMLInputElement>(id)
  input.value = value
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
}
const select = (value: string) => {
  const input = node<HTMLSelectElement>('do-example')
  input.value = value
  input.dispatchEvent(new dom.window.Event('change'))
}
const load = (read: () => Promise<string>) => {
  const input = node<HTMLInputElement>('do-load-step')
  Object.defineProperty(input, 'files', { configurable: true, value: [{ size: 500, text: read }] })
  input.dispatchEvent(new dom.window.Event('change'))
}
const file = (overrides: Record<string, unknown> = {}) => JSON.stringify({ version: 1, kind: 'do-calculus-step', graph: 'Z -> Y', rule: 2, x: '', y: 'Y=1', z: 'Z=1', w: '', ...overrides })
const pending = () => {
  let resolve!: (text: string) => void
  let reject!: (error: Error) => void
  const promise = new Promise<string>((yes, no) => { resolve = yes; reject = no })
  return { resolve, reject, promise }
}

beforeEach(async () => {
  vi.resetModules(); vi.resetAllMocks()
  dom = new JSDOM('<div id="app"></div>')
  vi.stubGlobal('document', dom.window.document)
  await import('./do_calculus_ui')
})
afterEach(() => { dom.window.close(); vi.unstubAllGlobals() })

describe('do-calculus step interface', () => {
  test('certifies a step with explicit definedness and comparable graph diagrams', () => {
    node<HTMLButtonElement>('do-check').click()
    expect(node('do-status').textContent).toContain('Rule 2 applies')
    expect(node('do-results').textContent).toContain('Numerical definedness has not been checked')
    expect(node('do-definedness').textContent).toContain('Pr(Z) > 0')
    expect(node('do-original-graph').querySelectorAll('[data-edge]')).toHaveLength(1)
    expect(node('do-original-graph').querySelector('[data-edge]')?.getAttribute('data-cut')).toBe('true')
    expect(node('do-modified-graph').querySelectorAll('[data-edge]')).toHaveLength(0)
    expect(node<HTMLButtonElement>('do-export-challenge').disabled).toBe(false)
  })

  test('uncertified equality is not presented as false', () => {
    select('2')
    node<HTMLButtonElement>('do-check').click()
    expect(node('do-status').textContent).toContain('not certified')
    expect(node('do-results').textContent).toContain('may still hold in particular numerical models')
    expect(node('do-certificate-result').textContent).toContain('Remaining moral-graph path')
  })

  test('Rule 3 handles W ancestry after existing interventions', () => {
    select('4'); node<HTMLButtonElement>('do-check').click()
    expect(node('do-eligible-z').textContent).toContain('Z(W): ∅')
    expect(node('do-status').textContent).toContain('not certified')
    select('5'); node<HTMLButtonElement>('do-check').click()
    expect(node('do-eligible-z').textContent).toContain('Z(W): Z')
    expect(node('do-removed-edges').textContent).toContain('Z → X')
    expect(node('do-removed-edges').textContent).toContain('A → Z')
    expect(node('do-status').textContent).toContain('applies')
  })

  test('edits remove certificates and disable export; invalid graphs and overlaps disable checking', () => {
    node<HTMLButtonElement>('do-check').click()
    change('do-graph', 'Z -> Y; Y -> Z')
    expect(node('do-results').textContent).toBe('')
    expect(node<HTMLButtonElement>('do-check').disabled).toBe(true)
    expect(node<HTMLButtonElement>('do-export-challenge').disabled).toBe(true)
    const save = [...dom.window.document.querySelectorAll('button')].find(button => button.textContent === 'Save step')!
    expect(save.disabled).toBe(true)
    save.click()
    expect(calls.download).not.toHaveBeenCalled()
    expect(node('do-validation').textContent).toContain('acyclic')
    change('do-graph', 'Z -> Y')
    change('do-z', 'Y=1')
    expect(node('do-validation').textContent).toContain('overlap')
    expect(node<HTMLButtonElement>('do-check').disabled).toBe(true)
  })

  test('exports a compatible counterexample problem on the original graph', () => {
    node<HTMLButtonElement>('do-check').click()
    node<HTMLButtonElement>('do-export-challenge').click()
    const value = JSON.parse(calls.download.mock.calls[0][0])
    expect(value).toEqual({ version: 1, graph: 'Z -> Y', constraints: 'Pr(Y | do(Z=1)) != Pr(Y | Z)', regular: false })
  })

  test('successful load restores fields but rechecks rather than trusting a saved certificate', async () => {
    node<HTMLButtonElement>('do-check').click()
    load(async () => file({ graph: 'Y; Z', y: 'Y=0', z: 'Z=0', rule: 1, applicable: true }))
    await flush()
    expect(node<HTMLInputElement>('do-y').value).toBe('Y=0')
    expect(node('do-results').textContent).toBe('')
    expect(node<HTMLButtonElement>('do-export-challenge').disabled).toBe(true)
    node<HTMLButtonElement>('do-check').click()
    expect(node('do-equality').textContent).toBe('Pr(~Y | ~Z) = Pr(~Y)')
  })

  test.each([true, '2', 0, 4, 2.1])('rejects noncanonical saved rule %j without changing input', async rule => {
    load(async () => file({ rule }))
    await flush()
    expect(node('do-status').textContent).toContain('Load error')
    expect(node<HTMLInputElement>('do-graph').value).toBe('Z -> Y')
    expect(node<HTMLSelectElement>('do-rule').value).toBe('2')
  })

  test('manual edits supersede a pending saved file', async () => {
    const read = pending()
    load(() => read.promise)
    change('do-y', 'Y=0')
    read.resolve(file())
    await flush()
    expect(node<HTMLInputElement>('do-y').value).toBe('Y=0')
  })

  test('newer file selections win even when the older read resolves last', async () => {
    const older = pending(), newer = pending()
    load(() => older.promise); load(() => newer.promise)
    newer.resolve(file({ y: 'Y=0' })); await flush()
    older.resolve(file({ z: 'Z=0' })); await flush()
    expect(node<HTMLInputElement>('do-y').value).toBe('Y=0')
    expect(node<HTMLInputElement>('do-z').value).toBe('Z=1')
  })

  test('a stale file error cannot replace a newer result', async () => {
    const read = pending(); load(() => read.promise)
    change('do-y', 'Y=0'); node<HTMLButtonElement>('do-check').click()
    const message = node('do-status').textContent
    read.reject(new Error('older file failed')); await flush()
    expect(node('do-status').textContent).toBe(message)
  })
})
