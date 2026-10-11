import { el, tel } from './el'
import { compile_decision_problem, parse_decision_input, type DecisionProblemInput, type CompiledDecisionProblem } from './causal_decision'
import { CausalDecisionSolver, type CausalDecisionResult, type DecisionWitness } from './causal_decision_solver'
import { init_z3 } from './z3_integration'
import { format_exact_value } from './causal_format'
import { download } from './download'
import './style.css'
import './causal_style.css'
import './causal_decision_style.css'

const examples = [
  { name: 'Observation differs from intervention', task: 'entailment', graph: 'Z -> X; Z -> Y', premises: 'Pr(Z) = 1/2\nPr(X | Z) = 3/4\nPr(X | ~Z) = 1/4\nPr(Y <-> Z) = 1', conclusion: 'Pr(Y | do(X)) = 1/2', regular: false },
  { name: 'An incorrect intervention claim', task: 'entailment', graph: 'Z -> X; Z -> Y', premises: 'Pr(Z) = 1/2\nPr(X | Z) = 3/4\nPr(X | ~Z) = 1/4\nPr(Y <-> Z) = 1', conclusion: 'Pr(Y | do(X)) = 3/4', regular: false },
  { name: 'Undefined conditioning prevents entailment', task: 'entailment', graph: 'A; B', premises: 'Pr(B) = 0', conclusion: 'Pr(A | B) = 0', regular: false },
  { name: 'Do-calculus exchange with positive support', task: 'entailment', graph: 'Z -> Y', premises: 'Pr(Z) > 0', conclusion: 'Pr(Y | do(Z)) = Pr(Y | Z)', regular: false },
  { name: 'Inconsistent premises', task: 'entailment', graph: 'A', premises: 'Pr(A) = 0\nPr(A) = 1', conclusion: 'Pr(A) = 1/2', regular: false },
  { name: 'A compatible intervened model', task: 'satisfiability', graph: 'X -> Y', premises: 'Pr(X) = 0\nPr(Y) = 0\nPr(Y | do(X)) = 1', conclusion: '', regular: false },
  { name: 'Impossible constraints', task: 'satisfiability', graph: 'A', premises: 'Pr(A) > 1', conclusion: '', regular: false },
  { name: 'Simpson’s paradox: treatment and recovery', task: 'entailment', graph: 'Z -> X; Z -> Y; X -> Y', premises: 'Pr(Z) = 1/2\nPr(X | Z) = 9/10\nPr(X | ~Z) = 1/10\nPr(Y | X & Z) = 3/5\nPr(Y | ~X & Z) = 1/2\nPr(Y | X & ~Z) = 9/10\nPr(Y | ~X & ~Z) = 4/5', conclusion: '(Pr(Y | X) < Pr(Y | ~X)) & (Pr(Y | do(X)) > Pr(Y | do(~X)))', regular: true },
  { name: 'Back-door adjustment identity', task: 'entailment', graph: 'Z -> X; Z -> Y; X -> Y', premises: '', conclusion: 'Pr(Y | do(X)) = Pr(Y | X & Z)*Pr(Z) + Pr(Y | X & ~Z)*Pr(~Z)', regular: true },
] as const
const root = document.getElementById('app')!
const graph = tel('decision-graph', 'textarea', { id: 'decision-graph', rows: '3', spellcheck: 'false' }) as HTMLTextAreaElement
const premises = tel('decision-premises', 'textarea', { id: 'decision-premises', rows: '6', spellcheck: 'false' }) as HTMLTextAreaElement
const conclusion = tel('decision-conclusion', 'textarea', { id: 'decision-conclusion', rows: '3', spellcheck: 'false' }) as HTMLTextAreaElement
const task = tel('decision-task', 'select', { id: 'decision-task' }, el('option', { value: 'entailment' }, 'Entailment'), el('option', { value: 'satisfiability' }, 'Satisfiability')) as HTMLSelectElement
const mode = tel('decision-mode', 'select', { id: 'decision-mode' }, el('option', { value: 'complete' }, 'Decision procedure (no time limit)'), el('option', { value: 'bounded' }, 'Search with a time limit')) as HTMLSelectElement
const seconds = tel('decision-seconds', 'input', { type: 'number', min: '0.1', max: '120', step: '0.1', value: '30', 'aria-label': 'Time limit in seconds' }) as HTMLInputElement
const regular = tel('decision-regular', 'input', { type: 'checkbox' }) as HTMLInputElement
const sample = tel('decision-example', 'select', { 'aria-label': 'Decision example' }) as HTMLSelectElement
examples.forEach((example, index) => sample.append(el('option', { value: String(index) }, example.name)))
const run = tel('decision-run', 'button', { type: 'button', disabled: 'true' }, 'Check entailment') as HTMLButtonElement
const cancel = tel('decision-cancel', 'button', { type: 'button', disabled: 'true' }, 'Cancel') as HTMLButtonElement
const save = tel('decision-save', 'button', { type: 'button' }, 'Save problem') as HTMLButtonElement
const saveSmt = tel('decision-save-smt', 'button', { type: 'button', disabled: 'true' }, 'Save solver input') as HTMLButtonElement
const load = tel('decision-load', 'input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Load saved decision problem' }) as HTMLInputElement
const validation = tel('decision-validation', 'div', { class: 'causal-validation' })
const runtime = tel('decision-runtime', 'div', { role: 'status' }, 'Loading Z3…')
const status = tel('decision-status', 'div', { role: 'status', 'aria-live': 'polite' }, 'Choose a decision problem.')
const results = tel('decision-results', 'div', {})
let solver: CausalDecisionSolver | undefined
let revision = 0, loadToken = 0
let running = false
let active: AbortController | undefined
let lastCompiled: CompiledDecisionProblem | undefined
const input = (): DecisionProblemInput => ({ graph: graph.value, premises: premises.value, conclusion: task.value === 'entailment' ? conclusion.value : undefined, regular: regular.checked, task: task.value as DecisionProblemInput['task'] })
const timeLimit = (): number => {
  if (mode.value === 'complete') return 0
  if (mode.value !== 'bounded') throw new Error('Choose a supported search mode.')
  const value = Number(seconds.value)
  if (!Number.isFinite(value) || value < 0.1 || value > 120) throw new Error('Choose a time limit from 0.1 to 120 seconds.')
  return Math.round(value * 1000)
}
const valid = (): boolean => {
  try {
    timeLimit()
    const parsed = parse_decision_input(input())
    validation.textContent = `${parsed.document.graph.nodes.length} observed Boolean variables; ${parsed.premiseCount} premises. Independent causal disturbances are assumed.`
    return true
  } catch (error) { validation.textContent = error instanceof Error ? error.message : String(error); return false }
}
const refresh = (): void => {
  conclusion.disabled = task.value !== 'entailment'
  seconds.disabled = mode.value !== 'bounded'
  run.textContent = task.value === 'entailment' ? 'Check entailment' : 'Decide satisfiability'
  const okay = valid()
  run.disabled = !okay || !solver || running
  save.disabled = !okay
  cancel.disabled = !running || !active || active.signal.aborted
  saveSmt.disabled = !lastCompiled
}
const invalidate = (): void => {
  revision++; active?.abort(); results.replaceChildren(); lastCompiled = undefined
  status.textContent = running ? 'Input changed; cancelling the previous decision…' : 'Input changed; decide the current problem.'
  refresh()
}
for (const field of [graph, premises, conclusion, task, mode, seconds, regular]) field.addEventListener('input', invalidate)
sample.addEventListener('change', () => {
  const example = examples[Number(sample.value)]
  if (!example) return
  graph.value = example.graph; premises.value = example.premises; conclusion.value = example.conclusion
  task.value = example.task; regular.checked = example.regular
  invalidate()
})
const table = (id: string, headings: string[], rows: string[][]): HTMLElement => el('div', { class: 'causal-table-scroll' }, tel(id, 'table', { class: 'causal-table' }, el('thead', {}, el('tr', {}, ...headings.map(value => el('th', { scope: 'col' }, value)))), el('tbody', {}, ...rows.map(row => el('tr', {}, ...row.map(value => el('td', {}, value)))))))
const showWitness = (witness: DecisionWitness, countermodel: boolean): void => {
  results.append(el('h2', {}, countermodel ? 'An exact countermodel' : 'A compatible causal model'), el('p', {}, countermodel ? 'This model satisfies the premises and fails the conclusion under the stated rules for undefined terms.' : 'This is one model satisfying the constraints; its values need not be uniquely determined.'))
  results.append(el('h3', {}, 'Input probabilities'), table('decision-query-table', ['Probability', 'Exact value'], witness.queries.map(query => [query.source, query.defined && query.value !== undefined ? format_exact_value(query.value) : 'undefined (zero denominator)'])))
  results.append(el('h3', {}, 'Shared causal mechanisms'), table('decision-mechanism-table', ['Variable', 'Parent values', 'Probability of value 1'], witness.mechanisms.map(mechanism => [mechanism.node, Object.entries(mechanism.parents).map(([name, value]) => `${name}=${Number(value)}`).join(', ') || 'none', format_exact_value(mechanism.value)])))
  if (witness.freeParameters.length) results.append(el('h3', {}, 'Other real variables'), table('decision-real-table', ['Variable', 'Exact value'], witness.freeParameters.map(parameter => [parameter.variable, format_exact_value(parameter.value)])))
  for (const distribution of witness.distributions) {
    const nodes = Object.keys(distribution.rows[0]?.assignment ?? {})
    results.append(el('details', {}, el('summary', {}, distribution.label), table('decision-distribution-table', [...nodes, 'Probability'], distribution.rows.map(row => [...nodes.map(name => String(Number(row.assignment[name]))), format_exact_value(row.value)]))))
  }
}
const show = (output: CausalDecisionResult): void => {
  switch (output.status) {
    case 'sat': status.textContent = 'SAT — a compatible causal model was found.'; showWitness(output.witness, false); break
    case 'unsat': status.textContent = 'UNSAT — no compatible causal model satisfies the constraints.'; break
    case 'not-entailed': status.textContent = 'DOES NOT ENTAIL — a countermodel was found.'; showWitness(output.witness, true); break
    case 'entailed': status.textContent = 'ENTAILS — every compatible model of the premises satisfies the conclusion.'; results.append(el('p', {}, 'The premises are satisfiable. Searching for a model that satisfies them but fails the conclusion returned UNSAT.')); break
    case 'inconsistent-premises': status.textContent = 'INCONSISTENT PREMISES — no compatible model satisfies the premises.'; results.append(el('p', {}, 'Entailment holds vacuously because there are no models of the premises. This does not establish the conclusion for a possible model.')); break
    case 'unknown': status.textContent = `UNRESOLVED — ${output.reason}`; break
    case 'cancelled': status.textContent = 'Cancelled — no decision established.'; break
    case 'error': status.textContent = `Solver error: ${output.message}`; break
  }
}
run.addEventListener('click', () => { void (async () => {
  if (running || !solver || !valid()) return
  const version = revision, controller = new AbortController()
  active = controller; running = true; results.replaceChildren(); refresh()
  try {
    const compiled = compile_decision_problem(input())
    lastCompiled = compiled; refresh()
    status.textContent = 'Checking the premises…'
    const output = await solver.decide(compiled, { timeout_ms: timeLimit(), abort_signal: controller.signal, on_stage: stage => {
      if (revision === version && !controller.signal.aborted) status.textContent = stage === 'counterexample' ? 'Searching for a countermodel…' : stage === 'witness' ? 'Preparing the exact model…' : 'Checking the premises…'
    } })
    if (revision === version) show(output)
  } catch (error) { if (revision === version) status.textContent = controller.signal.aborted ? 'Cancelled — no decision established.' : `Error: ${error instanceof Error ? error.message : String(error)}` }
  finally { active = undefined; running = false; if (revision !== version) status.textContent = 'Input changed; decide the current problem.'; refresh() }
})() })
cancel.addEventListener('click', () => {
  active?.abort()
  if (running) status.textContent = 'Cancelling; waiting for the solver to settle…'
  refresh()
})
save.addEventListener('click', () => {
  if (save.disabled || !valid()) return
  const value = Number(seconds.value)
  download(JSON.stringify({ version: 1, kind: 'DoSAT-decision', task: task.value, graph: graph.value, premises: premises.value, conclusion: conclusion.value, regular: regular.checked, mode: mode.value, seconds: Number.isFinite(value) && value >= 0.1 && value <= 120 ? value : 30 }, null, 2), 'DoSAT-problem.json', 'application/json')
})
saveSmt.addEventListener('click', () => {
  if (!lastCompiled) return
  const check = '\n(check-sat-using qfnra-nlsat)\n'
  const text = '; Complete NLSat reference checks. The app first tries a time-capped QF_NRA strategy.\n' + lastCompiled.premisesSmt + check + (lastCompiled.counterexampleSmt ? '\n(reset)\n' + lastCompiled.counterexampleSmt + check : '')
  download(text, 'DoSAT.smt2', 'text/plain')
})
load.addEventListener('change', () => {
  const token = ++loadToken, version = revision
  void (async () => {
    const file = load.files?.[0]
    if (!file) return
    try {
      if (file.size > 100_000) throw new Error('Saved problem exceeds 100 KB.')
      const value: unknown = JSON.parse(await file.text())
      if (token !== loadToken || version !== revision) return
      if (!value || typeof value !== 'object') throw new Error('Expected a saved decision problem.')
      const data = value as Record<string, unknown>
      if (data.version !== 1 || data.kind !== 'DoSAT-decision' || (data.task !== 'satisfiability' && data.task !== 'entailment') || (data.mode !== 'complete' && data.mode !== 'bounded') || typeof data.graph !== 'string' || typeof data.premises !== 'string' || typeof data.conclusion !== 'string' || typeof data.regular !== 'boolean' || typeof data.seconds !== 'number' || !Number.isFinite(data.seconds) || data.seconds < 0.1 || data.seconds > 120) throw new Error('Expected a version 1 DoSAT decision problem with valid fields.')
      parse_decision_input({ graph: data.graph, premises: data.premises, conclusion: data.task === 'entailment' ? data.conclusion : undefined, regular: data.regular, task: data.task })
      graph.value = data.graph; premises.value = data.premises; conclusion.value = data.conclusion
      task.value = data.task; regular.checked = data.regular; mode.value = data.mode; seconds.value = String(data.seconds)
      invalidate()
    } catch (error) { if (token === loadToken && version === revision) status.textContent = `Load error: ${error instanceof Error ? error.message : String(error)}` }
    finally { if (token === loadToken) load.value = '' }
  })()
})
root.append(el('main', { class: 'causal-ui decision-ui' },
  el('header', {}, el('h1', {}, 'DoSAT 1.0'), el('p', { class: 'decision-subtitle' }, 'A Decision Procedure for Do Calculus.'), el('p', {}, 'Decide causal satisfiability or whether premises entail a conclusion.'), el('p', {}, 'The model class is a supplied acyclic graph of observed Boolean variables with independent private disturbances. Interventions share the same causal mechanisms, so the do-calculus rules apply wherever their conditional terms are defined.'), el('nav', {}, el('a', { href: './causal.html' }, 'Open causal model finder'), ' · ', el('a', { href: './do_calculus.html' }, 'Check a do-calculus step'))),
  el('label', {}, 'Load an example ', sample),
  el('label', { for: 'decision-task' }, 'Question'), task,
  el('label', { for: 'decision-graph' }, 'Causal graph'), graph,
  el('p', { class: 'causal-help' }, 'One edge or isolated variable per declaration; semicolons or newlines separate declarations. Up to six Boolean variables.'),
  el('label', { for: 'decision-premises' }, 'Premises / constraints'), premises,
  el('p', { class: 'causal-help' }, 'One constraint per line. Empty premises are allowed. Use Pr(Y | do(X)) to set X true, Pr(Y | do(~X)) to set it false, or Pr(Y | do(X), Z) to observe Z after intervention. Simultaneous interventions use do(X, ~Z). Numeric assignments such as do(X=1) remain supported.'),
  el('label', { for: 'decision-conclusion' }, 'Conclusion (entailment only)'), conclusion,
  el('p', { class: 'causal-help' }, 'One constraint, including arithmetic and logical combinations. A conditional at zero evidence mass is undefined. Countermodels include cases where required undefined terms prevent the conclusion from holding.'),
  el('label', {}, regular, ' Require strictly positive observational mechanisms'),
  el('p', { class: 'causal-help' }, 'Every observational row then has positive probability. Interventions can still force some rows to have probability zero.'),
  el('label', { for: 'decision-mode' }, 'Search mode'), mode,
  el('p', { class: 'causal-help' }, 'Decision mode has no overall time limit. Each stage first tries a QF_NRA strategy with a budget of up to 60 seconds, then uses the complete NLSat procedure if needed. Finite resources can still prevent an answer. A time limit stops accepting results at the requested deadline; cancellation and cleanup can take longer to settle.'),
  el('label', {}, 'Time limit in seconds ', seconds), validation, runtime,
  el('div', { class: 'causal-controls' }, run, cancel), el('div', { class: 'causal-controls' }, save, load, saveSmt), status, results,
))
graph.value = examples[0].graph; premises.value = examples[0].premises; conclusion.value = examples[0].conclusion
refresh()
void init_z3().then(value => { solver = new CausalDecisionSolver(value); runtime.dataset.z3Version = value.getVersionString(); runtime.textContent = 'Z3 ready.'; refresh() }).catch((error: unknown) => { runtime.textContent = `Z3 failed to load: ${error instanceof Error ? error.message : String(error)}`; refresh() })
