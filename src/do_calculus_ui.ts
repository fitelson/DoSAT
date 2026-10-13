import { el, tel } from './el'
import { parse_do_step, check_do_step, type DoStepResult } from './do_calculus'
import { render_causal_graph } from './do_graph_view'
import { download } from './download'
import './style.css'
import './causal_style.css'
import './do_calculus_style.css'

const examples = [
  { name: 'Rule 2: replace observation by intervention', rule: 2, graph: 'Z -> Y', x: '', y: 'Y=1', z: 'Z=1', w: '' },
  { name: 'Rule 1: delete a blocked observation', rule: 1, graph: 'Z -> W\nW -> Y', x: '', y: 'Y=1', z: 'Z=1', w: 'W=1' },
  { name: 'Rule 2: a common cause blocks exchange', rule: 2, graph: 'A -> Z\nA -> Y', x: '', y: 'Y=1', z: 'Z=1', w: '' },
  { name: 'Rule 3: delete an irrelevant intervention', rule: 3, graph: 'A -> Z\nA -> Y', x: '', y: 'Y=1', z: 'Z=1', w: '' },
  { name: 'Rule 3: observing a descendant changes the test', rule: 3, graph: 'A -> Z\nA -> Y\nZ -> W', x: '', y: 'Y=1', z: 'Z=1', w: 'W=1' },
  { name: 'Rule 3: compute ancestry after the existing intervention', rule: 3, graph: 'A -> Z\nA -> Y\nZ -> X\nX -> W', x: 'X=1', y: 'Y=1', z: 'Z=1', w: 'W=1' },
  { name: 'Rule 1: conditioning opens a collider path', rule: 1, graph: 'Y -> C\nZ -> C\nC -> W', x: '', y: 'Y=1', z: 'Z=1', w: 'W=1' },
]
const root = document.getElementById('app')!
const graph = tel('do-graph', 'textarea', { id: 'do-graph', rows: '4', spellcheck: 'false' }) as HTMLTextAreaElement
const rule = tel('do-rule', 'select', { id: 'do-rule' }) as HTMLSelectElement
for (const [value, label] of [[1, '1 — insert/delete observations'], [2, '2 — exchange actions and observations'], [3, '3 — insert/delete actions']] as const) rule.append(el('option', { value: String(value) }, label))
const fields = Object.fromEntries(['x', 'y', 'z', 'w'].map(key => [key, tel(`do-${key}`, 'input', { id: `do-${key}`, type: 'text', spellcheck: 'false' })])) as Record<'x' | 'y' | 'z' | 'w', HTMLInputElement>
const check = tel('do-check', 'button', { type: 'button' }, 'Check rule step') as HTMLButtonElement
const validation = tel('do-validation', 'div', { role: 'status' })
const status = tel('do-status', 'div', { role: 'status', 'aria-live': 'polite' }, 'Choose a rule step to check.')
const results = tel('do-results', 'div', {})
const sample = tel('do-example', 'select', { 'aria-label': 'Do-calculus example' }) as HTMLSelectElement
examples.forEach((example, index) => sample.append(el('option', { value: String(index) }, example.name)))
const exportChallenge = tel('do-export-challenge', 'button', { type: 'button', disabled: 'true' }, 'Save counterexample problem') as HTMLButtonElement
let current: DoStepResult | undefined
let revision = 0
let loadToken = 0
const step = () => parse_do_step(graph.value, Number(rule.value), fields.x.value, fields.y.value, fields.z.value, fields.w.value)
const refresh = (): void => {
  try {
    step()
    validation.textContent = 'Assignments are valid and pairwise disjoint. The check concerns the supplied observed-variable DAG.'
    check.disabled = false
  } catch (error) {
    validation.textContent = error instanceof Error ? error.message : String(error)
    check.disabled = true
  }
  exportChallenge.disabled = current === undefined
  saveStep.disabled = check.disabled
}
const invalidate = (): void => {
  revision++
  current = undefined
  results.replaceChildren()
  status.textContent = 'Input changed; check the current rule step.'
  refresh()
}
for (const field of [graph, rule, ...Object.values(fields)]) field.addEventListener('input', invalidate)
const setExample = (index: number): void => {
  const example = examples[index]
  graph.value = example.graph
  rule.value = String(example.rule)
  for (const key of ['x', 'y', 'z', 'w'] as const) fields[key].value = example[key]
  invalidate()
}
sample.addEventListener('change', () => setExample(Number(sample.value)))

const list = (values: string[]): string => values.length ? values.join(', ') : '∅'
const edgeText = (edges: [string, string][], arrow: string): string => edges.length ? edges.map(([a, b]) => `${a} ${arrow} ${b}`).join('; ') : 'none'
const show = (): void => {
  try {
    const input = step()
    const result = check_do_step(input)
    current = result
    const roles = Object.fromEntries((['x', 'y', 'z', 'w'] as const).map(key => [key, input[key].map(item => item.variable)])) as { x: string[], y: string[], z: string[], w: string[] }
    const summary = result.applicable
      ? `Rule ${input.rule} applies under its graphical condition.`
      : `Rule ${input.rule} is not certified by its graphical condition.`
    status.textContent = summary
    const certificate = result.separation
    const content = el('section', {},
      el('h2', {}, 'Proposed equality'),
      tel('do-equality', 'div', { class: 'do-equality' }, `${result.lhs} = ${result.rhs}`),
      el('p', {}, result.applicable
        ? 'This rule certifies the equality wherever the displayed conditional probabilities are defined. Numerical definedness has not been checked.'
        : 'This graphical test does not certify the proposed equality. The equality may still hold in particular numerical models.'),
      el('h3', {}, 'Definedness obligations'),
      tel('do-definedness', 'ul', {}, ...(result.definedness.length
        ? result.definedness.map(condition => el('li', {}, condition))
        : [el('li', {}, 'Both displayed probabilities are unconditional within their regimes.')])),
      el('h3', {}, 'Graphical check'),
      tel('do-condition', 'p', {}, result.conditionText),
      el('p', {}, result.graphLabel),
      tel('do-removed-edges', 'p', {}, `Removed directed edges: ${edgeText(result.removedEdges, '→')}`),
    )
    if (input.rule === 3) content.append(tel('do-eligible-z', 'p', {}, `Z(W): ${list(result.eligibleZ)}. These changed variables are not ancestors of any W-variable after incoming edges to X have been removed.`))
    content.append(el('div', { class: 'do-diagrams' },
      el('section', {}, el('h3', {}, 'Original graph'), el('p', { class: 'causal-help' }, 'Red dashed arrows are removed for this rule test.'), tel('do-original-graph', 'div', { class: 'do-graph-scroll' }, render_causal_graph(input.graph, roles, input.graph, result.removedEdges))),
      el('section', {}, el('h3', {}, 'Graph used by the rule'), tel('do-modified-graph', 'div', { class: 'do-graph-scroll' }, render_causal_graph(result.modifiedGraph, roles, input.graph))),
    ))
    content.append(el('p', { class: 'causal-help' }, 'Node colors: outcome Y blue; changed Z yellow; existing intervention X purple; other observation W green.'))
    const details = el('details', {}, el('summary', {}, 'Inspect the d-separation certificate'),
      tel('do-ancestors', 'p', {}, `Ancestral set: ${list(certificate.ancestors)}`),
      el('p', {}, `Moral edges: ${edgeText(certificate.moralEdges, '—')}`),
      el('p', {}, `Conditioned variables removed: ${list(certificate.conditioned)}`),
      el('p', {}, `Remaining edges: ${edgeText(certificate.remainingEdges, '—')}`),
      tel('do-certificate-result', 'p', {}, certificate.separated
        ? 'No remaining undirected path joins the outcome and changed-variable sets: d-separated.'
        : `Remaining moral-graph path: ${certificate.connectingPath?.join(' — ')}.`),
      el('p', { class: 'causal-help' }, 'This certificate uses the ancestral moral graph: retain ancestors of the queried and conditioned variables, join co-parents, make edges undirected, and remove conditioned variables. Its edges may join co-parents.'),
    )
    content.append(details)
    results.replaceChildren(content)
    refresh()
  } catch (error) {
    current = undefined
    results.replaceChildren()
    status.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`
    refresh()
  }
}
check.addEventListener('click', show)
exportChallenge.addEventListener('click', () => {
  if (current) download(JSON.stringify(current.counterexampleProblem, null, 2), 'PrSATdo-counterexample.json', 'application/json')
})
const saveStep = el('button', { type: 'button' }, 'Save step') as HTMLButtonElement
saveStep.addEventListener('click', () => {
  if (!check.disabled) download(JSON.stringify({ version: 1, kind: 'do-calculus-step', graph: graph.value, rule: Number(rule.value), x: fields.x.value, y: fields.y.value, z: fields.z.value, w: fields.w.value }, null, 2), 'PrSATdo-step.json', 'application/json')
})
const loadStep = tel('do-load-step', 'input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Load saved do-calculus step' }) as HTMLInputElement
loadStep.addEventListener('change', () => {
  const token = ++loadToken
  const version = revision
  const file = loadStep.files?.[0]
  if (!file) return
  void (async () => {
    try {
      if (file.size > 100_000) throw new Error('Saved step exceeds 100 KB.')
      const data: unknown = JSON.parse(await file.text())
      if (token !== loadToken || version !== revision) return
      if (!data || typeof data !== 'object' || !('kind' in data) || data.kind !== 'do-calculus-step' || !('version' in data) || data.version !== 1 || !('graph' in data) || typeof data.graph !== 'string' || !('rule' in data) || typeof data.rule !== 'number' || ![1, 2, 3].includes(data.rule)) throw new Error('Expected a PrSATdo version 1 do-calculus step file.')
      const readString = (key: string): string => {
        const value: unknown = Reflect.get(data, key)
        if (typeof value !== 'string') throw new Error('Expected string assignment fields x, y, z and w.')
        return value
      }
      const values = { graph: data.graph, rule: data.rule, x: readString('x'), y: readString('y'), z: readString('z'), w: readString('w') }
      // Validate before replacing the user's input or accepting a saved claim.
      parse_do_step(values.graph, Number(values.rule), values.x, values.y, values.z, values.w)
      graph.value = values.graph; rule.value = String(values.rule)
      for (const key of ['x', 'y', 'z', 'w'] as const) fields[key].value = values[key]
      invalidate()
    } catch (error) {
      if (token === loadToken && version === revision) status.textContent = `Load error: ${error instanceof Error ? error.message : String(error)}`
    } finally { if (token === loadToken) loadStep.value = '' }
  })()
})
root.append(el('main', { class: 'causal-ui do-ui' },
  el('header', {}, el('h1', {}, 'PrSATdo: do-calculus step checker'),
    el('p', {}, 'Check one application of Pearl’s three rules on an observed-variable acyclic causal graph. The graphical condition applies uniformly to values where both displayed conditionals are defined.'),
    el('p', {}, 'This phase checks proposed rule steps. Automatic identification and graphs with latent confounding are later work.'),
    el('a', { href: './causal.html' }, 'Open causal model finder'),
    el('p', {}, el('a', { href: './decision.html' }, 'Decide causal satisfiability or entailment'))),
  el('label', {}, 'Example ', sample),
  el('label', { for: 'do-graph' }, 'Causal graph'), graph,
  el('p', { class: 'causal-help' }, 'Edges or isolated variables, separated by newlines or semicolons. Up to eight observed Boolean variables.'),
  el('label', { for: 'do-rule' }, 'Rule'), rule,
  el('div', { class: 'do-assignment-grid' },
    ...([['x', 'Existing interventions X (optional)'], ['y', 'Outcome assignments Y'], ['z', 'Changed assignments Z'], ['w', 'Other observations W (optional)']] as const).map(([key, label]) => el('div', {}, el('label', { for: `do-${key}` }, label), fields[key])),
  ),
  el('p', { class: 'causal-help' }, 'Use assignments such as X=1, M=0. Y and Z must be nonempty, and all four variable groups must be pairwise disjoint.'),
  validation, el('div', { class: 'causal-controls' }, check, saveStep, loadStep, exportChallenge), status, results,
  el('p', { class: 'causal-help' }, 'The counterexample file loads in the causal model finder. Its unequal-probability constraint requires both terms to be defined. Check premise consistency before interpreting an UNSAT counterexample search as a consequence.'),
  el('p', {}, 'Reference: ', el('a', { href: 'https://web.cs.ucla.edu/~kaoru/CAUSALITY-REPRINTED-W-CORRECTIONS-2013/causality-ch3-june2013.pdf', target: '_blank', rel: 'noreferrer' }, 'Pearl, Causality, Chapter 3, Theorem 3.4.1')),
))
setExample(0)
