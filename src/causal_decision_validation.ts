import { parse_decision_input, type DecisionProblemInput } from './causal_decision'
import { parse_causal_document, parse_causal_graph } from './causal_syntax'

export interface DecisionValidation {
  nodes: string[]
  graphError?: string
  premiseErrors: Map<number, string>
  conclusionError?: string
  problemError?: string
  premiseCount: number
  valid: boolean
}

const message = (error: unknown): string => error instanceof Error ? error.message : String(error)
const clean = (error: unknown): string => message(error).replace(/^Constraint line \d+:\s*/, '')

/** Field checks locate errors; the whole-problem parser remains authoritative. */
export const validate_decision_fields = (input: DecisionProblemInput): DecisionValidation => {
  const result: DecisionValidation = { nodes: [], premiseErrors: new Map(), premiseCount: 0, valid: false }
  try { result.nodes = parse_causal_graph(input.graph).nodes }
  catch (error) { result.graphError = message(error); return result }
  for (const [index, line] of input.premises.split(/\r?\n/).entries()) {
    if (!line.split('#', 1)[0].trim()) continue
    result.premiseCount++
    try { parse_causal_document(input.graph, line) }
    catch (error) { result.premiseErrors.set(index, clean(error)) }
  }
  if (input.task === 'entailment') {
    try { parse_decision_input({ ...input, premises: '' }) }
    catch (error) { result.conclusionError = clean(error) }
  }
  if (!result.premiseErrors.size && !result.conclusionError) {
    try { parse_decision_input(input); result.valid = true }
    catch (error) { result.problemError = message(error) }
  }
  return result
}
