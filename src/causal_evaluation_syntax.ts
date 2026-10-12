import { CAUSAL_LIMITS, parse_causal_document, type CausalDocument } from './causal_syntax'
import type { PrSat } from './types'

export type ParsedCausalEvaluation =
  | { kind: 'real', document: CausalDocument, expression: PrSat['RealExpr'] }
  | { kind: 'constraint', document: CausalDocument }

/** The existing causal parser remains authoritative for both input kinds. */
export const parse_causal_evaluation = (graph: string, source: string): ParsedCausalEvaluation => {
  if (typeof graph !== 'string' || typeof source !== 'string') throw new Error('The causal graph and evaluation input must be strings.')
  if (graph.length + source.length > CAUSAL_LIMITS.max_input_characters) {
    throw new Error(`Causal input is limited to ${CAUSAL_LIMITS.max_input_characters} characters.`)
  }
  const lines = source.split(/\r?\n/).map(line => line.split('#', 1)[0].trim()).filter(Boolean)
  if (lines.length !== 1) throw new Error('Enter exactly one expression or constraint to evaluate.')
  const active = lines[0]
  // The artificial outer equality must not repair malformed user parentheses.
  let depth = 0
  for (const character of active) {
    if (character === '(') depth++
    else if (character === ')' && --depth < 0) throw new Error('Syntax error: not a well-formed expression (unbalanced parentheses).')
  }
  if (depth !== 0) throw new Error('Syntax error: not a well-formed expression (unbalanced parentheses).')
  try {
    const document = parse_causal_document(graph, active)
    if (document.constraints.length === 1) return { kind: 'constraint', document }
  } catch { /* A real expression is parsed through an artificial equality below. */ }
  const document = parse_causal_document(graph, `(${active}) = 0`)
  const constraint = document.constraints[0]
  if (document.constraints.length !== 1 || constraint?.tag !== 'equal') throw new Error('Invalid causal evaluation expression.')
  return { kind: 'real', document, expression: constraint.left }
}
