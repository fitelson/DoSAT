import { el, tel } from './el'
import { parse_causal_document } from './causal_syntax'
import { compile_causal_document, type CompiledCausalProblem } from './causal'
import { init_z3, WrappedSolver, type WrappedSolverResult } from './z3_integration'
import { download } from './download'
import './style.css'
import './causal_style.css'

import { format_exact_value } from './causal_format'

const examples = [
  {
    name: 'Confounding: observation and intervention differ', graph: 'Z -> X\nZ -> Y', regular: false,
    constraints: 'Pr(Z) = 1/2\nPr(X | Z) = 3/4\nPr(X | ~Z) = 1/4\nPr(Y <-> Z) = 1\nPr(Y | X) = 3/4\nPr(Y | do(X=1)) = 1/2',
  },
  {
    name: 'Mediation through M', graph: 'X -> M\nM -> Y', regular: true,
    constraints: 'Pr(X) = 1/2\nPr(M | X) = 3/4\nPr(M | ~X) = 1/4\nPr(Y | M) = 4/5\nPr(Y | ~M) = 1/5\nPr(Y | do(X=1)) = 13/20\nPr(Y | do(X=0)) = 7/20',
  },
  {
    name: 'An intervention reaches an unobserved configuration', graph: 'X -> Y', regular: false,
    constraints: 'Pr(X) = 0\nPr(Y) = 0\nPr(Y | do(X=1)) = 1',
  },
]

const root = document.getElementById('app')!
const graphInput = tel('causal-graph', 'textarea', { id: 'causal-graph', rows: '4', spellcheck: 'false' }) as HTMLTextAreaElement
const constraintInput = tel('causal-constraints', 'textarea', { id: 'causal-constraints', rows: '9', spellcheck: 'false' }) as HTMLTextAreaElement
const regular = tel('causal-regular', 'input', { type: 'checkbox' }) as HTMLInputElement
const timeout = tel('causal-timeout', 'input', { type: 'number', min: '0.1', max: '120', step: '0.1', value: '30', 'aria-label': 'Search time limit in seconds' }) as HTMLInputElement
const find = tel('causal-find', 'button', { type: 'button', disabled: 'true' }, 'Find causal model') as HTMLButtonElement
const cancel = tel('causal-cancel', 'button', { type: 'button', disabled: 'true' }, 'Cancel') as HTMLButtonElement
const status = tel('causal-status', 'div', { role: 'status', 'aria-live': 'polite' }, 'Enter a causal graph and constraints.')
const z3Status = tel('causal-z3-status', 'div', { role: 'status' }, 'Loading Z3…')
const validation = tel('causal-validation', 'div', { class: 'causal-validation' })
const results = tel('causal-results', 'div', {})
const sample = tel('causal-example', 'select', { 'aria-label': 'Example' }) as HTMLSelectElement
examples.forEach((example, i) => sample.append(el('option', { value: String(i) }, example.name)))

let solver: WrappedSolver | undefined
let revision = 0
let running = false
let reinitializing = false
let loadToken = 0
let active: AbortController | undefined
let lastCompiled: CompiledCausalProblem | undefined

const validInputs = (): boolean => {
  try {
    const seconds = Number(timeout.value)
    if (!Number.isFinite(seconds) || seconds < 0.1 || seconds > 120) throw new Error('Choose a time limit from 0.1 to 120 seconds.')
    const parsed = parse_causal_document(graphInput.value, constraintInput.value)
    validation.textContent = `${parsed.graph.nodes.length} Boolean variables; ${parsed.constraints.length} constraints. All variables are observed; the graph assumes independent causal disturbances.`
    return true
  } catch (error) {
    validation.textContent = error instanceof Error ? error.message : String(error)
    return false
  }
}
const refresh = (): void => {
  const valid = validInputs()
  find.disabled = !valid || !solver || running || reinitializing
  cancel.disabled = !running || !active || active.signal.aborted
}
const invalidate = (): void => {
  revision++
  active?.abort()
  results.replaceChildren()
  lastCompiled = undefined
  status.textContent = running ? 'Input changed; cancelling the previous search…' : 'Input changed; find a model for the current constraints.'
  refresh()
}
for (const input of [graphInput, constraintInput, regular, timeout]) input.addEventListener('input', invalidate)
sample.addEventListener('change', () => {
  const selected = examples[Number(sample.value)]
  graphInput.value = selected.graph
  constraintInput.value = selected.constraints
  regular.checked = selected.regular
  invalidate()
})

const table = (headings: string[], rows: string[][], testId: string): HTMLElement => {
  const element = tel(testId, 'table', { class: 'causal-table' },
    el('thead', {}, el('tr', {}, ...headings.map(heading => el('th', { scope: 'col' }, heading)))),
    el('tbody', {}, ...rows.map(row => el('tr', {}, ...row.map(cell => el('td', {}, cell))))),
  )
  return el('div', { class: 'causal-table-scroll' }, element)
}

const showModel = async (compiled: CompiledCausalProblem, output: Extract<WrappedSolverResult, { status: 'sat' }>, version: number): Promise<void> => {
  const exact = async (expression: Parameters<typeof output.evaluate_exact>[0]): Promise<string> => {
    if (revision !== version) throw new Error('Input changed during model rendering.')
    if (active?.signal.aborted) throw new Error('Model rendering cancelled.')
    const result = await output.evaluate_exact(expression)
    if (revision !== version || active?.signal.aborted) throw new Error('Model rendering cancelled.')
    return result.defined && result.value !== undefined ? format_exact_value(result.value) : 'undefined (zero conditioning probability)'
  }
  const queryRows: string[][] = []
  for (const query of compiled.queries) queryRows.push([query.source, await exact(query.expression)])
  const mechanismRows: string[][] = []
  for (const mechanism of compiled.mechanisms) {
    const parentValues = Object.entries(mechanism.parents).map(([node, value]) => `${node}=${Number(value)}`).join(', ') || 'none'
    mechanismRows.push([mechanism.node, parentValues, await exact(mechanism.expression)])
  }
  const mechanismNames = new Set(compiled.mechanisms.map(mechanism => mechanism.parameter))
  const otherRows: string[][] = []
  for (const variable of compiled.variables.filter(name => !mechanismNames.has(name))) {
    otherRows.push([variable, await exact({ tag: 'variable', id: variable })])
  }
  const fragment = document.createDocumentFragment()
  fragment.append(el('h2', {}, 'A compatible causal model'))
  fragment.append(el('p', {}, 'These are values in one model satisfying the constraints. A displayed value need not be uniquely determined by the input.'))
  fragment.append(el('h3', {}, 'Input probabilities'), table(['Probability', 'Exact value'], queryRows, 'causal-query-table'))
  if (otherRows.length) fragment.append(el('h3', {}, 'Other real variables'), table(['Variable', 'Exact value'], otherRows, 'causal-real-table'))
  fragment.append(el('h3', {}, 'Shared mechanisms'), table(['Variable', 'Parent values', 'Probability of value 1'], mechanismRows, 'causal-mechanism-table'))
  for (const distribution of compiled.distributions) {
    const nodes = Object.keys(distribution.rows[0]?.assignment ?? {})
    const rows: string[][] = []
    for (const row of distribution.rows) rows.push([...nodes.map(node => String(Number(row.assignment[node]))), await exact(row.expression)])
    const details = el('details', compiled.distributions.length <= 3 ? { open: '' } : {},
      el('summary', {}, distribution.label), table([...nodes, 'Probability'], rows, 'causal-distribution-table'))
    fragment.append(details)
  }
  if (revision === version && !active?.signal.aborted) results.replaceChildren(fragment)
}

const solve = async (): Promise<void> => {
  if (running || reinitializing || !solver || !validInputs()) return
  const version = revision
  const controller = new AbortController()
  active = controller
  running = true
  refresh()
  results.replaceChildren()
  status.textContent = 'Searching for a causal model…'
  let timer: ReturnType<typeof setTimeout> | undefined
  let timedOut = false
  try {
    const parsed = parse_causal_document(graphInput.value, constraintInput.value)
    const compiled = compile_causal_document(parsed, { regular: regular.checked })
    lastCompiled = compiled
    // Z3's timeout parameter is an unsigned integer, including for decimal
    // seconds whose multiplication by 1000 has a floating-point remainder.
    const milliseconds = Math.round(Number(timeout.value) * 1000)
    timer = setTimeout(() => { timedOut = true; controller.abort() }, milliseconds)
    const output = await solver.solve(compiled.smtlib, milliseconds, controller.signal)
    if (timer) clearTimeout(timer)
    if (version !== revision) return
    if (output.status === 'sat') {
      status.textContent = 'Preparing exact model tables…'
      await showModel(compiled, output, version)
      if (version === revision) status.textContent = controller.signal.aborted ? 'Cancelled.' : 'SAT — a compatible causal model was found.'
    } else if (output.status === 'unsat') status.textContent = 'UNSAT — no model in the stated causal class satisfies all constraints.'
    else if (output.status === 'unknown') status.textContent = 'UNKNOWN — the solver did not settle the constraints within the time limit.'
    else if (output.status === 'cancelled') status.textContent = timedOut ? 'UNKNOWN — time limit reached.' : 'Cancelled.'
    else status.textContent = `Solver error: ${output.message}`
  } catch (error) {
    if (version === revision) status.textContent = controller.signal.aborted ? (timedOut ? 'UNKNOWN — time limit reached.' : 'Cancelled.') : `Error: ${error instanceof Error ? error.message : String(error)}`
  } finally {
    if (timer) clearTimeout(timer)
    active = undefined
    running = false
    if (version !== revision) status.textContent = 'Input changed; find a model for the current constraints.'
    refresh()
  }
}
find.addEventListener('click', () => { void solve() })
cancel.addEventListener('click', () => { active?.abort(); refresh() })

const save = el('button', { type: 'button' }, 'Save problem')
save.addEventListener('click', () => download(JSON.stringify({ version: 1, graph: graphInput.value, constraints: constraintInput.value, regular: regular.checked }, null, 2), 'PrSATdo-problem.json', 'application/json'))
const loadInput = el('input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Load saved causal problem' }) as HTMLInputElement
loadInput.addEventListener('change', () => {
  const token = ++loadToken
  void (async () => {
    const file = loadInput.files?.[0]
    if (!file) return
    const loadRevision = revision
    try {
      if (file.size > 100_000) throw new Error('Saved problem is too large (maximum 100 KB).')
      const data: unknown = JSON.parse(await file.text())
      if (revision !== loadRevision || token !== loadToken) return
      if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 || !('graph' in data) || typeof data.graph !== 'string' || !('constraints' in data) || typeof data.constraints !== 'string' || !('regular' in data) || typeof data.regular !== 'boolean') throw new Error('Expected a PrSATdo version 1 problem file.')
      graphInput.value = data.graph
      constraintInput.value = data.constraints
      regular.checked = data.regular
      invalidate()
    } catch (error) {
      if (revision === loadRevision && token === loadToken) status.textContent = `Load error: ${error instanceof Error ? error.message : String(error)}`
    } finally { if (token === loadToken) loadInput.value = '' }
  })()
})
const saveSmt = el('button', { type: 'button' }, 'Save solver input')
saveSmt.addEventListener('click', () => {
  if (lastCompiled) download(lastCompiled.smtlib + '\n(check-sat)\n(get-model)\n', 'PrSATdo.smt2', 'text/plain')
})

root.append(el('main', { class: 'causal-ui' },
  el('header', {}, el('h1', {}, 'PrSATdo'),
    el('p', {}, 'Probability constraints with causal interventions on Boolean variables.'),
    el('p', {}, 'Supply an acyclic graph with all variables observed. An arrow declares an allowed direct causal influence. This version finds compatible causal models; it does not perform symbolic do-calculus identification.'),
    el('a', { href: './index.html' }, 'Open classical PrSAT 3.0'),
    el('p', {}, el('a', { href: './do_calculus.html' }, 'Check a do-calculus step')),
    el('p', {}, el('a', { href: './decision.html' }, 'Decide causal satisfiability or entailment'))),
  el('label', {}, 'Load an example ', sample),
  el('label', { for: 'causal-graph' }, 'Causal graph'), graphInput,
  el('p', { class: 'causal-help' }, 'One edge or isolated variable per line; semicolons also separate entries. Example: Z -> X; Z -> Y. Up to six Boolean variables.'),
  el('label', { for: 'causal-constraints' }, 'Probability constraints'), constraintInput,
  el('p', { class: 'causal-help' }, 'One constraint per line. Use Pr(Y | do(X=1)) for an intervention, Pr(Y | do(X=1), Z) for observation after intervention, and Pr(Y | do(X=1, Z=0)) for simultaneous assignments. Ordinary Pr(Y | X) remains observational conditioning.'),
  el('label', {}, regular, ' Require a strictly positive observational distribution'),
  el('p', { class: 'causal-help' }, 'This requires every mechanism probability to lie strictly between 0 and 1. Interventions still force their assigned variables and therefore create zero-probability rows.'),
  validation, z3Status,
  el('div', { class: 'causal-controls' }, find, cancel, el('label', {}, 'Search time limit (seconds) ', timeout)),
  el('p', { class: 'causal-help' }, 'The time limit covers the solver search. Exact model-table preparation follows a successful search and can also be cancelled.'),
  el('div', { class: 'causal-controls' }, save, loadInput, saveSmt), status, results,
))
graphInput.value = examples[0].graph
constraintInput.value = examples[0].constraints
refresh()
void init_z3().then(value => {
  solver = new WrappedSolver(value, async () => {
    reinitializing = true
    z3Status.textContent = 'Reloading Z3 after cancellation…'
    refresh()
    try {
      const next = await init_z3()
      z3Status.textContent = 'Z3 ready.'
      return next
    } catch (error) {
      solver = undefined
      z3Status.textContent = `Z3 failed to reload: ${error instanceof Error ? error.message : String(error)}`
      throw error
    } finally {
      reinitializing = false
      refresh()
    }
  })
  z3Status.textContent = 'Z3 ready.'
  refresh()
}).catch((error: unknown) => {
  z3Status.textContent = `Z3 failed to load: ${error instanceof Error ? error.message : String(error)}`
})
