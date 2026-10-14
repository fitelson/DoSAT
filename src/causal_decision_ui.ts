import { el, tel } from './el'
import { compile_decision_problem, parse_decision_input, type DecisionProblemInput, type CompiledDecisionProblem } from './causal_decision'
import { CausalDecisionSolver, type CausalDecisionResult, type DecisionWitness } from './causal_decision_solver'
import { create_decision_editor } from './causal_decision_editor'
import { render_causal_conclusion } from './causal_to_html'
import { render_decision_witness } from './causal_decision_results'
import { validate_decision_fields } from './causal_decision_validation'
import { CausalModelEvaluator } from './causal_model_evaluator'
import { create_model_evaluation_panel } from './causal_evaluation_ui'
import { create_decision_graph_preview } from './causal_graph_preview'
import { DECISION_EXAMPLES as examples } from './causal_decision_examples'
import { init_z3 } from './z3_integration'
import { download } from './download'
import './style.css'
import './causal_style.css'
import './causal_decision_style.css'

const root = document.getElementById('app')!
const graph = tel('decision-graph', 'textarea', { id: 'decision-graph', rows: '1', spellcheck: 'false', 'aria-describedby': 'decision-graph-error decision-graph-nodes' }) as HTMLTextAreaElement
const graphPreview = create_decision_graph_preview()
const graphError = el('div', { id: 'decision-graph-error', class: 'error decision-field-error' })
const nodes = el('span', { id: 'decision-graph-nodes', class: 'decision-note' })
const conclusion = tel('decision-conclusion', 'textarea', { id: 'decision-conclusion', rows: '1', spellcheck: 'false', 'aria-describedby': 'decision-conclusion-error decision-definedness' }) as HTMLTextAreaElement
const conclusionError = el('div', { id: 'decision-conclusion-error', class: 'error decision-field-error' })
const conclusionPreview = el('div', { class: 'constraint decision-preview', tabindex: '0', role: 'region', 'aria-label': 'Conclusion preview' })
const conclusionInfo = tel('decision-conclusion-info', 'button', { type: 'button', 'aria-label': 'Syntax help for the conclusion', 'aria-expanded': 'false', 'aria-controls': 'decision-conclusion-help' }, 'ⓘ')
const conclusionHelp = el('p', { id: 'decision-conclusion-help', class: 'input-instructions' }, 'Enter one constraint. Arithmetic and logical combinations of constraints are allowed. Use do(X), do(~X) or simultaneous interventions; a rendered preview confirms parsing only, not definedness.')
conclusionHelp.hidden = true
const conclusionBlock = el('section', { class: 'decision-conclusion-block' },
  el('div', { class: 'decision-conclusion-heading' }, el('label', { for: 'decision-conclusion' }, 'Conclusion (exactly one constraint)'), conclusionInfo),
  el('div', { class: 'single-input decision-conclusion-row' }, conclusion, conclusionPreview, conclusionError),
  el('p', { id: 'decision-definedness', class: 'decision-note' }, 'Required undefined terms may prevent entailment.'), conclusionHelp)
const entailment = tel('decision-task-entailment', 'input', { type: 'radio', name: 'decision-task', id: 'decision-task-entailment', value: 'entailment', checked: 'true' }) as HTMLInputElement
const satisfiability = tel('decision-task-satisfiability', 'input', { type: 'radio', name: 'decision-task', id: 'decision-task-satisfiability', value: 'satisfiability' }) as HTMLInputElement
const taskValue = (): DecisionProblemInput['task'] => satisfiability.checked ? 'satisfiability' : 'entailment'
const mode = tel('decision-mode', 'input', { type: 'checkbox', id: 'decision-mode' }) as HTMLInputElement
const seconds = tel('decision-seconds', 'input', { type: 'number', min: '0.1', max: '120', step: '0.1', value: '30', 'aria-label': 'Time limit in seconds' }) as HTMLInputElement
const regular = tel('decision-regular', 'input', { type: 'checkbox', id: 'decision-regular' }) as HTMLInputElement
const sample = tel('decision-example', 'select', { 'aria-label': 'Examples' }) as HTMLSelectElement
sample.append(el('option', { value: '' }, 'Choose an example…'))
examples.forEach((example, index) => sample.append(el('option', { value: String(index) }, example.name)))
const exampleGuide = tel('decision-example-guide', 'details', { class: 'decision-help decision-example-guide' })
exampleGuide.hidden = true
const showExampleGuide = (index: number): void => {
  const example = examples[index]
  exampleGuide.replaceChildren()
  exampleGuide.hidden = !example
  if (!example) return
  exampleGuide.append(el('summary', {}, 'About this example'), el('p', {}, example.description),
    el('p', {}, 'Literature: ', el('a', { href: example.source.url, target: '_blank', rel: 'noopener noreferrer' }, example.source.title)),
    el('p', {}, `Expected decision: ${example.expectedStatus}. ${example.dataNote ?? 'The numerical data are constructed Boolean illustrations.'}`))
  if (example.evaluations.length) exampleGuide.append(el('p', {}, example.expectedStatus === 'ENTAILS'
    ? 'Exact values supporting the conclusion. For optional model checks, copy these expressions, choose Satisfiability, then Find Model and use Evaluate model:'
    : 'After obtaining a model, paste these expressions into Evaluate model:'),
    el('ul', {}, ...example.evaluations.map(item => el('li', {}, el('code', {}, item.expression),
      el('span', { class: 'decision-example-value' }, `Expected in this model: ${typeof item.value === 'boolean' ? (item.value ? 'True' : 'False') : item.value}.`)))))
}
const run = tel('decision-run', 'button', { type: 'button', class: 'generate', disabled: 'true' }, 'Check entailment') as HTMLButtonElement
const cancel = tel('decision-cancel', 'button', { type: 'button', disabled: 'true' }, 'Cancel') as HTMLButtonElement
const save = tel('decision-save', 'button', { type: 'button' }, 'Save to File') as HTMLButtonElement
const copy = tel('decision-copy', 'button', { type: 'button' }, 'Copy to Clipboard') as HTMLButtonElement
const saveSmt = tel('decision-save-smt', 'button', { type: 'button', disabled: 'true' }, 'Save solver input') as HTMLButtonElement
const load = tel('decision-load', 'input', { type: 'file', hidden: 'true', accept: '.json,application/json', 'aria-label': 'Load saved decision problem' }) as HTMLInputElement
const loadButton = tel('decision-load-button', 'button', { type: 'button' }, 'Load From File')
const batchButton = tel('decision-batch-toggle', 'button', { type: 'button' }, 'Show Batch Input')
const clearButton = tel('decision-clear', 'button', { type: 'button' }, 'Clear premises')
const validation = tel('decision-validation', 'div', { class: 'decision-validation', role: 'status', 'aria-live': 'polite' })
const runtime = tel('decision-runtime', 'span', { role: 'status' }, 'Loading Z3…')
const status = tel('decision-status', 'div', { role: 'status', 'aria-live': 'polite' }, 'Choose a decision problem.')
const results = tel('decision-results', 'div', { class: 'model-container' })
let solver: CausalDecisionSolver | undefined
let modelEvaluator: CausalModelEvaluator | undefined
const evaluationPanel = create_model_evaluation_panel(busy => {
  if (!busy && status.textContent === 'Input changed; waiting for model evaluation to settle…') status.textContent = 'Input changed; decide the current problem.'
  refresh()
})
let revision = 0, loadToken = 0
let running = false
let active: AbortController | undefined
let lastCompiled: CompiledDecisionProblem | undefined
const editor = create_decision_editor(() => invalidate())
const input = (): DecisionProblemInput => ({ graph: graph.value, premises: editor.getValue(), conclusion: taskValue() === 'entailment' ? conclusion.value : undefined, regular: regular.checked, task: taskValue() })
const timeLimit = (): number => {
  if (!mode.checked) return 0
  const value = Number(seconds.value)
  if (!Number.isFinite(value) || value < 0.1 || value > 120) throw new Error('Choose a time limit from 0.1 to 120 seconds.')
  return Math.round(value * 1000)
}
const linkError = (container: HTMLElement, label: string, target: string): void => container.append(el('a', { href: `#${target}` }, label), ' ')
const sizeTextarea = (field: HTMLTextAreaElement): void => {
  if (!field.scrollHeight) return
  field.style.height = 'auto'
  field.style.height = `${field.scrollHeight + 2}px`
}
const valid = (): boolean => {
  const fields = validate_decision_fields(input())
  graphError.textContent = fields.graphError ? (fields.graphError.includes('At most') || fields.graphError.includes('limited to') || fields.graphError.includes('too large') ? `Graph: Unsupported input. ${fields.graphError}` : `Graph: Syntax error: not a DAG. ${fields.graphError}`) : ''
  graphPreview.update(graph.value)
  graph.setAttribute('aria-invalid', String(!!fields.graphError))
  nodes.textContent = fields.nodes.length ? `${fields.nodes.length} variables: ${fields.nodes.join(', ')}` : 'A causal graph is required.'
  editor.setGraph(graph.value)
  editor.setErrors(fields.premiseErrors)
  conclusionError.textContent = fields.conclusionError ? `Conclusion: ${fields.conclusionError}` : ''
  conclusion.setAttribute('aria-invalid', String(!!fields.conclusionError))
  conclusionPreview.replaceChildren()
  if (taskValue() === 'entailment' && !fields.graphError && !fields.conclusionError) {
    try { conclusionPreview.append(render_causal_conclusion(graph.value, conclusion.value)) } catch { /* Field error above is authoritative. */ }
  }
  sizeTextarea(graph)
  sizeTextarea(conclusion)
  const nextValidation = el('div', {})
  if (fields.graphError) linkError(nextValidation, 'Fix the graph.', 'decision-graph')
  for (const index of fields.premiseErrors.keys()) linkError(nextValidation, `Fix ${taskValue() === 'entailment' ? 'Premise' : 'Constraint'} ${index + 1}.`, (editor.element.querySelector(`[data-testid="decision-premise-${index + 1}"]`) as HTMLInputElement).id)
  if (fields.conclusionError) linkError(nextValidation, 'Fix the conclusion.', 'decision-conclusion')
  if (fields.problemError) nextValidation.append(fields.problemError)
  let okay = fields.valid
  try { timeLimit() } catch (error) { nextValidation.append(error instanceof Error ? error.message : String(error)); okay = false }
  if (editor.pending()) { nextValidation.append(editor.element.dataset.batchOpen === 'true' ? 'Batch edits are unapplied. Parse or Discard them before running or saving.' : 'Batch edits are unapplied. Show Batch Input to Parse or Discard them.'); okay = false }
  if (okay) nextValidation.textContent = fields.premiseCount ? `${fields.premiseCount} ${taskValue() === 'entailment' ? (fields.premiseCount === 1 ? 'premise' : 'premises') : (fields.premiseCount === 1 ? 'constraint' : 'constraints')} ready.` : taskValue() === 'entailment' ? 'No premises: checks validity.' : 'No constraints: finds a model of the graph.'
  const signature = JSON.stringify([nextValidation.textContent, [...nextValidation.querySelectorAll('a')].map(link => link.getAttribute('href'))])
  if (validation.dataset.signature !== signature) { validation.replaceChildren(...nextValidation.childNodes); validation.dataset.signature = signature }
  return okay
}
const refresh = (): void => {
  conclusionBlock.hidden = taskValue() !== 'entailment'
  conclusion.disabled = taskValue() !== 'entailment'
  editor.setLabel(taskValue() === 'entailment' ? 'Premises (may be empty)' : 'Constraints (may be empty)')
  clearButton.textContent = taskValue() === 'entailment' ? 'Clear premises' : 'Clear constraints'
  seconds.disabled = !mode.checked
  run.textContent = taskValue() === 'entailment' ? 'Check entailment' : 'Find Model'
  batchButton.textContent = editor.element.dataset.batchOpen === 'true' ? 'Hide Batch Input' : 'Show Batch Input'
  batchButton.setAttribute('aria-expanded', String(editor.element.dataset.batchOpen === 'true'))
  const okay = valid()
  run.disabled = !okay || !solver || running || evaluationPanel.busy()
  save.disabled = !okay; copy.disabled = !okay
  cancel.disabled = !running || !active || active.signal.aborted
  saveSmt.disabled = !lastCompiled
}
const invalidate = (): void => {
  revision++; active?.abort(); evaluationPanel.clear(); results.replaceChildren(); lastCompiled = undefined; sample.value = ''; exampleGuide.hidden = true
  status.textContent = running ? 'Input changed; cancelling the previous decision…' : evaluationPanel.busy() ? 'Input changed; waiting for model evaluation to settle…' : 'Input changed; decide the current problem.'
  refresh()
}
for (const field of [graph, conclusion, entailment, satisfiability, mode, seconds, regular]) field.addEventListener('input', invalidate)
if (typeof ResizeObserver !== 'undefined') {
  for (const field of [graph, conclusion]) {
    let width = -1
    const observer = new ResizeObserver(entries => {
      const next = entries[0]?.contentRect.width ?? 0
      if (next !== width) { width = next; sizeTextarea(field) }
    })
    observer.observe(field)
  }
}
loadButton.addEventListener('click', () => load.click())
batchButton.addEventListener('click', () => { editor.toggleBatch(); refresh() })
clearButton.addEventListener('click', () => editor.clear())
conclusionInfo.addEventListener('click', () => { conclusionHelp.hidden = !conclusionHelp.hidden; conclusionInfo.setAttribute('aria-expanded', String(!conclusionHelp.hidden)) })
conclusion.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault() })
const setExample = (index: number): void => {
  const example = examples[index]
  if (!example) return
  graph.value = example.graph; editor.setValue(example.premises); conclusion.value = example.conclusion
  entailment.checked = example.task === 'entailment'; satisfiability.checked = !entailment.checked; regular.checked = example.regular
  invalidate(); sample.value = String(index); showExampleGuide(index)
}
sample.addEventListener('change', () => {
  if (sample.value === '') { exampleGuide.hidden = true; return }
  setExample(Number(sample.value))
})
const bindModel = (witness: DecisionWitness): void => {
  if (!modelEvaluator) return
  const evaluator = modelEvaluator, sourceGraph = graph.value
  try {
    const captured = evaluator.capture(sourceGraph, witness)
    evaluationPanel.show(sourceGraph, (source, signal) => evaluator.evaluate(captured, source, { abort_signal: signal }))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    evaluationPanel.show(sourceGraph, async () => ({ status: 'error', message: `Model evaluation unavailable: ${message}` }))
  }
}
const show = (output: CausalDecisionResult): void => {
  switch (output.status) {
    case 'sat': status.textContent = 'SAT — a compatible causal model was found.'; results.append(render_decision_witness(output.witness, false, graph.value, conclusion.value)); bindModel(output.witness); break
    case 'unsat': status.textContent = 'UNSAT — no compatible causal model satisfies the constraints.'; break
    case 'not-entailed': status.textContent = 'DOES NOT ENTAIL — a countermodel was found.'; results.append(render_decision_witness(output.witness, true, graph.value, conclusion.value)); bindModel(output.witness); break
    case 'entailed': status.textContent = 'ENTAILS — every compatible model of the premises satisfies the conclusion.'; results.append(el('p', {}, 'Searching for a model that satisfies the premises but fails the conclusion returned UNSAT. Premise consistency was not checked separately.')); break
    case 'unknown': status.textContent = `UNRESOLVED — ${output.reason}`; break
    case 'cancelled': status.textContent = 'Cancelled — no decision established.'; break
    case 'error': status.textContent = `Solver error: ${output.message}`; break
  }
}
run.addEventListener('click', () => { void (async () => {
  if (running || evaluationPanel.busy() || !solver || !valid()) return
  const version = revision, controller = new AbortController()
  active = controller; running = true; evaluationPanel.clear(); results.replaceChildren(); refresh()
  try {
    const compiled = compile_decision_problem(input())
    lastCompiled = compiled; refresh()
    status.textContent = compiled.task === 'entailment' ? 'Searching for a countermodel…' : 'Checking the constraints…'
    const output = await solver.decide(compiled, { timeout_ms: timeLimit(), abort_signal: controller.signal, on_stage: stage => {
      if (revision === version && !controller.signal.aborted) status.textContent = stage === 'counterexample' ? 'Searching for a countermodel…' : stage === 'witness' ? 'Preparing the exact model…' : 'Checking the constraints…'
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
const savedProblem = (): string => {
  const value = Number(seconds.value)
  return JSON.stringify({ version: 1, kind: 'DoSAT-decision', task: taskValue(), graph: graph.value, premises: editor.getValue(), conclusion: conclusion.value, regular: regular.checked, mode: mode.checked ? 'bounded' : 'complete', seconds: Number.isFinite(value) && value >= 0.1 && value <= 120 ? value : 30 }, null, 2)
}
save.addEventListener('click', () => { if (!save.disabled && valid()) download(savedProblem(), 'DoSAT-problem.json', 'application/json') })
copy.addEventListener('click', () => { void (async () => {
  if (copy.disabled || !valid()) return
  const version = revision
  try { await navigator.clipboard.writeText(savedProblem()); if (revision === version) status.textContent = 'Whole problem copied as DoSAT JSON.' }
  catch (error) { if (revision === version) status.textContent = `Copy failed: ${error instanceof Error ? error.message : String(error)}` }
})() })
saveSmt.addEventListener('click', () => {
  if (!lastCompiled) return
  const check = '\n(check-sat-using qfnra-nlsat)\n'
  const text = '; Complete NLSat reference check. The app first tries a time-capped QF_NRA strategy.\n' + (lastCompiled.task === 'entailment' ? lastCompiled.counterexampleSmt! : lastCompiled.premisesSmt) + check
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
      let data = value as Record<string, unknown>
      // Retired model-finder files become ordinary SAT problems on the single page.
      if (data.version === 1 && data.kind === undefined && data.task === undefined && typeof data.graph === 'string' && typeof data.constraints === 'string' && typeof data.regular === 'boolean') {
        data = { version: 1, kind: 'DoSAT-decision', task: 'satisfiability', graph: data.graph, premises: data.constraints, conclusion: '', regular: data.regular, mode: 'complete', seconds: 30 }
      }
      if (data.version !== 1 || data.kind !== 'DoSAT-decision' || (data.task !== 'satisfiability' && data.task !== 'entailment') || (data.mode !== 'complete' && data.mode !== 'bounded') || typeof data.graph !== 'string' || typeof data.premises !== 'string' || typeof data.conclusion !== 'string' || typeof data.regular !== 'boolean' || typeof data.seconds !== 'number' || !Number.isFinite(data.seconds) || data.seconds < 0.1 || data.seconds > 120) throw new Error('Expected a version 1 DoSAT decision problem with valid fields.')
      // Textareas normalize line endings. Validate exactly the representable text before any mutation.
      const loadedGraph = data.graph.replace(/\r\n?/g, '\n')
      const loadedPremises = data.premises.replace(/\r\n?/g, '\n')
      const loadedConclusion = data.conclusion.replace(/\r\n?/g, '\n')
      parse_decision_input({ graph: loadedGraph, premises: loadedPremises, conclusion: data.task === 'entailment' ? loadedConclusion : undefined, regular: data.regular, task: data.task })
      graph.value = loadedGraph; editor.setValue(loadedPremises); conclusion.value = loadedConclusion
      entailment.checked = data.task === 'entailment'; satisfiability.checked = !entailment.checked
      regular.checked = data.regular; mode.checked = data.mode === 'bounded'; seconds.value = String(data.seconds)
      invalidate()
    } catch (error) { if (token === loadToken && version === revision) status.textContent = `Load error: ${error instanceof Error ? error.message : String(error)}` }
    finally { if (token === loadToken) load.value = '' }
  })()
})
const help = (title: string, text: string): HTMLElement => el('details', { class: 'decision-help' }, el('summary', {}, title), el('p', {}, text))
root.append(el('main', { class: 'causal-ui decision-ui' },
  el('header', { class: 'header' }, el('h1', {}, 'DoSAT 1.0'), el('p', { class: 'decision-subtitle' }, 'A Decision Procedure for Do Calculus.'),
    el('nav', {}, el('a', { href: '#decision-help' }, 'Help'), ' · ', el('a', { href: 'https://github.com/fitelson/DoSAT' }, 'GitHub'))),
  el('section', { class: 'generic-input-block decision-input-panel', 'aria-label': 'Decision problem editor' },
    el('fieldset', { class: 'decision-task' }, el('legend', {}, 'Task'), el('label', {}, entailment, ' Check entailment'), el('label', {}, satisfiability, ' Satisfiability')),
    el('div', { class: 'decision-toolbar' }, loadButton, load, batchButton, clearButton, el('label', {}, 'Examples ', sample)),
    exampleGuide,
    el('div', { class: 'decision-graph-layout' }, el('div', { class: 'decision-graph-block' }, el('label', { for: 'decision-graph' }, 'Causal graph'), graph, nodes, graphError,
      help('ⓘ Graph syntax', 'Declare edges such as Z -> X; Z -> Y or isolated variables. Semicolons and newlines are supported. Acyclic graphs with up to eight observed Boolean variables are allowed. No latent confounders or cross-world counterfactuals.')), graphPreview.element),
    editor.element, conclusionBlock,
    el('div', { class: 'decision-toolbar decision-save-toolbar' }, save, copy, el('span', { class: 'decision-note' }, 'Save, Load and Copy use the whole problem.'))),
  el('section', { class: 'model-finder decision-action-panel', 'aria-label': 'Run decision and results' },
    el('div', { class: 'decision-run-line' }, run, cancel, runtime),
    el('div', { class: 'decision-options' },
      el('div', {}, el('label', {}, regular, ' Regular'), el('span', { class: 'decision-note' }, 'Positive observational rows; interventions can still force zeros.')),
      el('div', {}, el('label', {}, mode, ' Time limit: ', seconds, ' seconds'), el('span', { class: 'decision-note' }, 'Off: no overall limit. A deadline ends result acceptance; cancellation and cleanup can take longer.'))),
    validation, status, results, evaluationPanel.element, el('div', { class: 'decision-export' }, saveSmt)),
  el('section', { id: 'decision-help' },
    help('ⓘ Probability and do syntax', 'One premise per row; blank and # comment rows are ignored. Use Pr(Y | do(X)) or do(~X) for Boolean interventions, do(X, ~Z) for simultaneous interventions, and Pr(Y | do(X), Z) to observe Z after intervention. Numeric forms do(X=1) and do(X=0) are also supported. A rendered preview confirms parsing, not numerical definedness. Empty premises are allowed. Enter splits a premise; Up/Down move between rows; Backspace at its start merges with the previous row. Batch Parse replaces premises only.'),
    help('ⓘ Decision scope and solver', 'The supplied observed Boolean DAG defines a family of causal models with independent private disturbances and shared mechanisms across interventions. Every stage first tries a QF_NRA strategy with a budget of up to 60 seconds, then complete NLSat if needed. Finite resources may still prevent an answer. UNRESOLVED and cancellation establish no decision. Regular requires positive observational mechanisms; hard interventions may force zeros. Inconsistent premises entail vacuously. The app does not infer latent confounders, search for do-calculus derivations, or infer counterfactual values across worlds. New expressions can be evaluated in a returned model; that is a value in that model, not an entailment claim.')),
))
setExample(0)
status.textContent = 'Choose a decision problem.'
refresh()
void init_z3().then(value => { solver = new CausalDecisionSolver(value); modelEvaluator = new CausalModelEvaluator(value); runtime.dataset.z3Version = value.getVersionString(); runtime.textContent = 'Z3 ready.'; refresh() }).catch((error: unknown) => { runtime.textContent = `Z3 failed to load: ${error instanceof Error ? error.message : String(error)}`; refresh() })
