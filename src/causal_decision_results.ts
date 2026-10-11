import type { DecisionWitness } from './causal_decision_solver'
import { format_exact_value } from './causal_format'
import { parse_causal_graph } from './causal_syntax'
import { render_causal_constraint, render_causal_probability } from './causal_to_html'
import { el, math_el, tel } from './el'

type Distribution = DecisionWitness['distributions'][number]
type DistributionRow = Distribution['rows'][number]

const scroll_table = (label: string, table: HTMLElement): HTMLElement => el('div', {
  class: 'causal-table-scroll', tabindex: '0', role: 'region', 'aria-label': label,
}, table)

const exact_cell = (value: string): HTMLElement => el('td', { class: 'decision-exact-value' }, format_exact_value(value))

const value_table = (id: string, label: string, headings: string[], rows: (Node | string)[][]): HTMLElement => scroll_table(label,
  tel(id, 'table', { class: 'causal-table' },
    el('caption', {}, label),
    el('thead', {}, el('tr', {}, ...headings.map(heading => el('th', { scope: 'col' }, heading)))),
    el('tbody', {}, ...rows.map(row => el('tr', {}, ...row.map(value => el('td', {}, value))))),
  ),
)

/** Keep supplied text readable if a display adapter cannot render a term. */
const formula = (render: () => Node, source: string): Node => {
  try { return render() } catch { return el('code', { class: 'decision-formula-source' }, source) }
}

const assignment_key = (nodes: string[], row: DistributionRow): string => nodes.map(node => `${node}=${row.assignment[node] ? '1' : '0'}`).join(';')

/** Compare corresponding assignments even if different regime rows are reordered. */
const distribution_table = (graph: string, distributions: Distribution[]): HTMLElement => {
  const nodes = parse_causal_graph(graph).nodes
  const ordered = [...distributions.filter(distribution => distribution.intervention.length === 0),
    ...distributions.filter(distribution => distribution.intervention.length !== 0)]
  const assignments = new Map<string, DistributionRow>()
  const values = ordered.map(distribution => {
    const column = new Map<string, string>()
    for (const row of distribution.rows) {
      const key = assignment_key(nodes, row)
      if (!assignments.has(key)) assignments.set(key, row)
      column.set(key, row.value)
    }
    return column
  })
  const table = tel('decision-distribution-table', 'table', { class: 'causal-table decision-regime-table' },
    el('caption', {}, 'Exact row probabilities'),
    el('thead', {}, el('tr', {},
      ...nodes.map(node => el('th', { scope: 'col' }, math_el('math', {}, math_el('mi', { mathvariant: 'normal' }, node)))),
      ...ordered.map(distribution => el('th', { scope: 'col' }, distribution.label)),
    )),
    el('tbody', {}, ...[...assignments].map(([key, row]) => el('tr', { 'data-assignment': key },
      ...nodes.map(node => el('td', { title: `${node} = ${row.assignment[node] ? 'true' : 'false'}` },
        math_el('math', { 'aria-label': row.assignment[node] ? 'true' : 'false' }, math_el('mi', {}, row.assignment[node] ? '⊤' : '⊥')),
      )),
      ...values.map(column => {
        const value = column.get(key)
        return value === undefined ? el('td', {}, 'unavailable') : exact_cell(value)
      }),
    ))),
  )
  return el('section', { class: 'decision-distribution-section' },
    el('h3', {}, 'Row probabilities'),
    el('p', { class: 'decision-result-note' }, '⊤ = true; ⊥ = false. The regimes share the same causal mechanisms.'),
    scroll_table('Row probabilities across observational and intervention regimes', table),
  )
}

/** Render an immutable exact witness snapshot; no native model is retained. */
export const render_decision_witness = (witness: DecisionWitness, countermodel: boolean, graph: string, conclusion: string): HTMLElement => {
  const output = tel('decision-witness', 'section', { class: 'decision-witness' },
    el('h2', {}, countermodel ? 'An exact countermodel' : 'A compatible causal model'),
    el('p', {}, countermodel
      ? 'This model satisfies the premises and fails the conclusion under the stated rules for required undefined terms.'
      : 'This is one model satisfying the constraints; its values need not be uniquely determined.'),
  )
  if (witness.distributions.length) output.append(distribution_table(graph, witness.distributions))

  const queries = el('section', { class: 'decision-query-section' }, el('h3', {}, 'Input probabilities'))
  if (countermodel) queries.append(tel('decision-submitted-conclusion', 'div', { class: 'decision-conclusion-witness' },
    el('h4', {}, 'Submitted conclusion'),
    el('div', { class: 'decision-rendered-formula', tabindex: '0', role: 'region', 'aria-label': 'Submitted conclusion formula' },
      formula(() => render_causal_constraint(graph, conclusion), conclusion)),
    el('p', { class: 'decision-result-note' }, 'The witness fails this conclusion, including its required definedness conditions.'),
  ))
  if (witness.queries.length) queries.append(value_table('decision-query-table', countermodel ? 'Witness probability term values' : 'Input probability values',
    ['Probability', 'Exact value'], witness.queries.map(query => [
      formula(() => render_causal_probability(graph, query.source), query.source),
      query.defined ? format_exact_value(query.value) : 'undefined (zero denominator)',
    ]),
  ))
  if (witness.freeParameters.length) queries.append(el('h3', {}, 'Other real variables'),
    value_table('decision-real-table', 'Other real variable assignments', ['Variable', 'Exact value'],
      witness.freeParameters.map(parameter => [parameter.variable, format_exact_value(parameter.value)])),
  )
  if (countermodel || witness.queries.length || witness.freeParameters.length) output.append(queries)

  if (witness.mechanisms.length) output.append(el('details', { class: 'decision-mechanism-details' },
    el('summary', {}, 'Shared causal mechanisms'),
    value_table('decision-mechanism-table', 'Shared causal mechanism probabilities', ['Variable', 'Parent values', 'Probability of ⊤'],
      witness.mechanisms.map(mechanism => [mechanism.node,
        Object.entries(mechanism.parents).map(([node, value]) => `${node}=${value ? '⊤' : '⊥'}`).join(', ') || 'none',
        format_exact_value(mechanism.value)])),
  ))
  return output
}
