import { parse_causal_document } from './causal_syntax'
import type { CausalDocument, CausalProbability } from './causal_syntax'
import { parse_causal_evaluation } from './causal_evaluation_syntax'
import { math_el } from './el'
import { constraint_to_html, real_expr_to_html } from './prsat_to_html'
import type { PrSat } from './types'

/** Reuse PrSAT's sentence rendering without making its private renderer public. */
const sentence_html = (sentence: PrSat['Sentence']): MathMLElement => {
  const probability = real_expr_to_html({ tag: 'probability', arg: sentence }, false)
  // The ordinary probability renderer returns Pr, (, the sentence, ).
  const rendered = probability.children.item(2)
  if (!rendered) throw new Error('The probability preview could not be rendered.')
  return rendered as MathMLElement
}

const intervention_html = (query: CausalProbability): MathMLElement => {
  const row = math_el('mrow', { class: 'causal-intervention' },
    math_el('mi', { mathvariant: 'normal' }, 'do'), math_el('mo', {}, '('))
  // Only the already validated source controls presentation here. Keeping its
  // assignment spelling makes do(X=1) visibly distinct from the do(X) alias.
  const source = /\bdo\s*\(([^()]*)\)/.exec(query.source)?.[1]
  if (source === undefined) throw new Error('The intervention preview could not be rendered.')
  const assignments = source.split(',')
  query.intervention.forEach((assignment, index) => {
    if (index > 0) row.append(math_el('mo', {}, ','))
    if (assignments[index].includes('=')) {
      row.append(math_el('mi', { mathvariant: 'normal' }, assignment.variable),
        math_el('mo', {}, '='), math_el('mn', {}, assignment.value ? '1' : '0'))
    } else {
      if (!assignment.value) row.append(math_el('mo', {}, '~'))
      row.append(math_el('mi', { mathvariant: 'normal' }, assignment.variable))
    }
  })
  row.append(math_el('mo', {}, ')'))
  return row
}

const probability_html = (query: CausalProbability): MathMLElement => {
  const row = math_el('mrow', { class: 'causal-probability' },
    math_el('mo', { lspace: '0', rspace: '0' }, 'Pr'),
    math_el('mo', {}, '('), sentence_html(query.event))
  if (query.intervention.length > 0 || query.given) {
    row.append(math_el('mo', {}, '|'))
    if (query.intervention.length > 0) row.append(intervention_html(query))
    if (query.given) {
      if (query.intervention.length > 0) row.append(math_el('mo', {}, ','))
      row.append(math_el('mrow', { class: 'causal-observation' }, sentence_html(query.given)))
    }
  }
  row.append(math_el('mo', {}, ')'))
  return row
}

const replace_query_variables = (math: MathMLElement, document: CausalDocument): MathMLElement => {
  // CausalQuery identifiers are reserved by the authoritative parser. Replace
  // exact variable nodes only, never substrings of user names or text markup.
  for (const variable of math.querySelectorAll('mi')) {
    const identifier = variable.textContent ?? ''
    if (Object.prototype.hasOwnProperty.call(document.probabilities, identifier)) {
      variable.replaceWith(probability_html(document.probabilities[identifier]))
    }
  }
  return math
}

/** A parsed preview describes syntax; it does not certify defined probabilities. */
export const render_causal_constraint = (graph: string, source: string): MathMLElement => {
  const document = parse_causal_document(graph, source)
  if (document.constraints.length !== 1) {
    throw new Error('Enter exactly one causal constraint for this preview; logical combinations are allowed.')
  }
  const math = constraint_to_html(document.constraints[0], true)
  math.setAttribute('aria-label', document.source[0])
  return replace_query_variables(math, document)
}

/** Preview one causal arithmetic expression or constraint, without evaluating it. */
export const render_causal_evaluation = (graph: string, source: string): MathMLElement => {
  const parsed = parse_causal_evaluation(graph, source)
  const math = parsed.kind === 'constraint'
    ? render_causal_constraint(graph, parsed.document.source.join('\n'))
    : replace_query_variables(real_expr_to_html(parsed.expression, true), parsed.document)
  math.setAttribute('aria-label', source.trim())
  return math
}

/** Render one complete input probability term, for exact witness query tables. */
export const render_causal_probability = (graph: string, source: string): MathMLElement => {
  const document = parse_causal_document(graph, `${source} = 0`)
  const constraint = document.constraints[0]
  const probabilities = Object.values(document.probabilities)
  if (document.constraints.length !== 1 || constraint.tag !== 'equal'
    || constraint.left.tag !== 'variable' || constraint.right.tag !== 'literal'
    || constraint.right.value !== 0 || probabilities.length !== 1
    || !Object.prototype.hasOwnProperty.call(document.probabilities, constraint.left.id)
    || probabilities[0].source.trim() !== source.trim()) {
    throw new Error('Enter exactly one complete causal probability term, such as Pr(Y | do(X)).')
  }
  return math_el('math', { 'aria-label': source.trim() }, probability_html(probabilities[0]))
}
