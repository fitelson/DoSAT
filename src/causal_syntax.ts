import { parse_constraint, parse_sentence } from './parser'
import { free_real_variables_in_constraint_or_real_expr, letter_string } from './pr_sat'
import type { PrSat } from './types'

export interface CausalGraph {
  nodes: string[]
  parents: Record<string, string[]>
}

export interface Intervention {
  variable: string
  value: boolean
}

export interface CausalProbability {
  event: PrSat['Sentence']
  given?: PrSat['Sentence']
  intervention: Intervention[]
  source: string
}

export interface CausalDocument {
  graph: CausalGraph
  constraints: PrSat['Constraint'][]
  probabilities: Record<string, CausalProbability>
  source: string[]
}

/** Bounds cover the input as well as the later exponential graph enumeration. */
export const CAUSAL_LIMITS = {
  max_nodes: 8,
  max_constraints: 64,
  max_probabilities: 128,
  max_input_characters: 50_000,
  max_line_characters: 4_096,
  max_parenthesis_depth: 64,
  max_ast_depth: 128,
  max_tokens_per_line: 2_048,
} as const

const QUERY_PREFIX = 'CausalQuery'
const VARIABLE_PATTERN = /^[A-Z](?:[1-9][0-9]*)?$/

/** Reserved identifiers must refer to complete entries, never merged names. */
export const validate_causal_query_identifiers = (
  identifiers: Iterable<string>,
  probabilities: Record<string, CausalProbability>,
): void => {
  for (const id of identifiers) {
    if (id.includes(QUERY_PREFIX) && !Object.prototype.hasOwnProperty.call(probabilities, id)) {
      throw new Error(`Invalid constraint: reserved causal query identifier '${id}' does not name a probability query.`)
    }
  }
}

/** Match the existing sentence-letter convention without rounding indices. */
export const normalize_causal_variable = (name: string): string => {
  const trimmed = name.trim()
  if (!VARIABLE_PATTERN.test(trimmed)) {
    throw new Error(`Invalid causal variable "${trimmed}". Use a capital letter with an optional positive integer, such as X or X1.`)
  }
  const index = trimmed.length === 1 ? 0 : Number(trimmed.slice(1))
  if (!Number.isSafeInteger(index)) {
    throw new Error(`The index in causal variable "${trimmed}" is too large.`)
  }
  return `${trimmed[0]}${index === 0 ? '' : index}`
}

const strip_comment = (line: string): string => line.split('#', 1)[0].trim()

const check_input_length = (length: number): void => {
  if (length > CAUSAL_LIMITS.max_input_characters) {
    throw new Error(`Causal input is limited to ${CAUSAL_LIMITS.max_input_characters} characters.`)
  }
}

/** Apply lexical, parenthesis and unary-prefix bounds before recursive parsing. */
const check_expression_size = (source: string): void => {
  if (source.length > CAUSAL_LIMITS.max_line_characters) {
    throw new Error(`Each causal constraint or expression is limited to ${CAUSAL_LIMITS.max_line_characters} characters.`)
  }
  const tokens = source.match(/[A-Za-z]+[0-9]*|[0-9]+(?:\.[0-9]+)?|[^\s]/g) ?? []
  if (tokens.length > CAUSAL_LIMITS.max_tokens_per_line) {
    throw new Error(`Each causal constraint or expression is limited to ${CAUSAL_LIMITS.max_tokens_per_line} tokens.`)
  }
  let depth = 0
  for (const character of source) {
    if (character === '(') {
      depth += 1
      if (depth > CAUSAL_LIMITS.max_parenthesis_depth) {
        throw new Error(`Causal expressions are limited to ${CAUSAL_LIMITS.max_parenthesis_depth} nested parentheses.`)
      }
    } else if (character === ')') {
      depth -= 1
      if (depth < 0) throw new Error('Unexpected closing parenthesis.')
    }
  }
  if (depth !== 0) throw new Error('Missing closing parenthesis.')
  // Count a lower bound on AST depth without invoking the recursive grammar.
  // Parenthesized operands retain their surrounding prefixes; a probability's
  // event is a separate AST root in the compiler's input-depth validation.
  const savedPrefixDepth: number[] = []
  let prefixBase = 0, prefixRun = 0
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    const previous = tokens[index - 1] ?? ''
    const next = tokens[index + 1]
    const prefix = token === '~' || token === '¬' ||
      (token === '!' && next !== '=') ||
      (token === '-' && !/[A-Za-z0-9.)]$/.test(previous) && next !== '>')
    if (prefix) {
      prefixRun++
      if (prefixBase + prefixRun > CAUSAL_LIMITS.max_ast_depth) {
        throw new Error(`Causal expressions are too deeply nested (limit ${CAUSAL_LIMITS.max_ast_depth} unary prefix operators per AST root).`)
      }
    } else if (token === '(') {
      savedPrefixDepth.push(prefixBase)
      prefixBase = /^(Pr|P|p)$/.test(previous) ? 0 : prefixBase + prefixRun
      prefixRun = 0
    } else if (token === ')') {
      prefixBase = savedPrefixDepth.pop() ?? 0
      prefixRun = 0
    } else prefixRun = 0
  }
  if (source.includes(QUERY_PREFIX)) {
    throw new Error(`The prefix ${QUERY_PREFIX} is reserved for causal probability queries.`)
  }
}

export const parse_causal_graph = (graphText: string): CausalGraph => {
  check_input_length(graphText.length)
  const nodes: string[] = []
  const parents: Record<string, string[]> = {}
  const add_node = (name: string): string => {
    const node = normalize_causal_variable(name)
    if (!nodes.includes(node)) {
      nodes.push(node)
      parents[node] = []
      if (nodes.length > CAUSAL_LIMITS.max_nodes) {
        throw new Error(`At most ${CAUSAL_LIMITS.max_nodes} causal variables are supported in this version.`)
      }
    }
    return node
  }
  for (const [lineIndex, line] of graphText.split(/\r?\n/).entries()) {
    for (const declaration of strip_comment(line).split(';')) {
      if (!declaration.trim()) continue
      try {
        const edge = declaration.split(/->|→/)
        if (edge.length === 1) {
          add_node(edge[0])
        } else if (edge.length === 2) {
          const parent = add_node(edge[0])
          const child = add_node(edge[1])
          if (parent === child) throw new Error(`Self edge ${parent} -> ${child} is not allowed.`)
          if (!parents[child].includes(parent)) parents[child].push(parent)
        } else {
          throw new Error('Write one edge per declaration, such as X -> Y; Y -> Z.')
        }
      } catch (error) {
        throw new Error(`Graph line ${lineIndex + 1}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
  if (nodes.length === 0) throw new Error('Declare at least one causal variable in the graph.')
  // A DFS along parent links finds cycles, including those in disconnected components.
  const visited = new Set<string>()
  const visiting: string[] = []
  const visit = (node: string): void => {
    const cycleStart = visiting.indexOf(node)
    if (cycleStart !== -1) {
      throw new Error(`The causal graph must be acyclic; found cycle ${[...visiting.slice(cycleStart), node].join(' <- ')}.`)
    }
    if (visited.has(node)) return
    visiting.push(node)
    for (const parent of parents[node]) visit(parent)
    visiting.pop()
    visited.add(node)
  }
  for (const node of nodes) visit(node)
  return { nodes, parents }
}

const validate_sentence_variables = (graph: CausalGraph, sentence: PrSat['Sentence']): void => {
  switch (sentence.tag) {
    case 'value': return
    case 'letter': {
      if (!Number.isSafeInteger(sentence.index)) {
        throw new Error('Sentence-letter indices must be safe integers.')
      }
      const variable = letter_string(sentence)
      if (!graph.nodes.includes(variable)) {
        throw new Error(`Causal variable ${variable} is not declared in the graph.`)
      }
      return
    }
    case 'negation': return validate_sentence_variables(graph, sentence.sentence)
    default:
      validate_sentence_variables(graph, sentence.left)
      validate_sentence_variables(graph, sentence.right)
  }
}

const parse_causal_sentence = (graph: CausalGraph, source: string, role: string): PrSat['Sentence'] => {
  const result = parse_sentence(source.trim())
  if (!result[0]) throw new Error(`Invalid ${role}: ${result[1]}`)
  validate_sentence_variables(graph, result[1])
  return result[1]
}

/** Return the closing parenthesis matching source[opening]. */
const matching_parenthesis = (source: string, opening: number): number => {
  let depth = 0
  for (let index = opening; index < source.length; index += 1) {
    if (source[index] === '(') depth += 1
    else if (source[index] === ')') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  throw new Error('Missing closing parenthesis in probability query.')
}

const conditional_separator = (source: string): number | undefined => {
  let depth = 0
  let separator: number | undefined
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '(') depth += 1
    else if (source[index] === ')') depth -= 1
    else if (source[index] === '|' && depth === 0) {
      if (separator !== undefined) throw new Error('A probability query may contain only one conditioning bar |.')
      separator = index
    }
  }
  return separator
}

const parse_interventions = (graph: CausalGraph, source: string): Intervention[] => {
  if (!source.trim()) throw new Error('do(...) requires at least one assignment, such as do(X).')
  const intervention: Intervention[] = []
  for (const assignment of source.split(',')) {
    const explicit = /^\s*([A-Z](?:[1-9][0-9]*)?)\s*=\s*([01])\s*$/.exec(assignment)
    // These are hard Boolean assignments, not interventions on arbitrary
    // propositional formulas. Keep this grammar separate from sentence parsing.
    const literal = /^\s*(~)?\s*([A-Z](?:[1-9][0-9]*)?)\s*$/.exec(assignment)
    if (!explicit && !literal) {
      throw new Error(`Invalid intervention "${assignment.trim()}". do(...) accepts only literal assignments such as X, ~X, X=0 or X=1.`)
    }
    const variable = normalize_causal_variable(explicit ? explicit[1] : literal![2])
    if (!graph.nodes.includes(variable)) throw new Error(`Intervention variable ${variable} is not declared in the graph.`)
    if (intervention.some((entry) => entry.variable === variable)) {
      throw new Error(`Repeated intervention assignment for ${variable}; assign each variable only once.`)
    }
    intervention.push({ variable, value: explicit ? explicit[2] === '1' : literal![1] !== '~' })
  }
  return intervention
}

const parse_probability = (graph: CausalGraph, inner: string, source: string): CausalProbability => {
  const separator = conditional_separator(inner)
  const eventSource = separator === undefined ? inner : inner.slice(0, separator)
  const event = parse_causal_sentence(graph, eventSource, 'probability event')
  if (separator === undefined) return { event, intervention: [], source }
  const condition = inner.slice(separator + 1).trim()
  const doLead = /^do\s*\(/.exec(condition)
  if (!doLead) {
    const given = parse_causal_sentence(graph, condition, 'conditioning event')
    return { event, given, intervention: [], source }
  }
  const opening = condition.indexOf('(')
  const closing = matching_parenthesis(condition, opening)
  const intervention = parse_interventions(graph, condition.slice(opening + 1, closing))
  const tail = condition.slice(closing + 1).trim()
  if (!tail) return { event, intervention, source }
  if (!tail.startsWith(',')) {
    throw new Error('Place observational conditioning after the intervention with a comma, such as Pr(Y | do(X), Z).')
  }
  const given = parse_causal_sentence(graph, tail.slice(1), 'conditioning event after do(...)')
  return { event, given, intervention, source }
}

const query_name = (index: number): string => {
  let suffix = ''
  let ordinal = index + 1
  while (ordinal > 0) {
    ordinal -= 1
    suffix = String.fromCharCode(65 + ordinal % 26) + suffix
    ordinal = Math.floor(ordinal / 26)
  }
  return `${QUERY_PREFIX}${suffix}`
}

/** Replace probabilities with alphabetic variables accepted by the existing parser. */
const substitute_probabilities = (
  graph: CausalGraph,
  source: string,
  probabilities: Record<string, CausalProbability>,
): string => {
  check_expression_size(source)
  let substituted = ''
  let cursor = 0
  const probabilityLead = /\b(?:Pr|P|p)\s*\(/g
  let match: RegExpExecArray | null
  while ((match = probabilityLead.exec(source)) !== null) {
    const opening = probabilityLead.lastIndex - 1
    const closing = matching_parenthesis(source, opening)
    const ordinal = Object.keys(probabilities).length
    if (ordinal >= CAUSAL_LIMITS.max_probabilities) {
      throw new Error(`At most ${CAUSAL_LIMITS.max_probabilities} probability queries are supported in one causal document.`)
    }
    const name = query_name(ordinal)
    probabilities[name] = parse_probability(graph, source.slice(opening + 1, closing), source.slice(match.index, closing + 1))
    // Parentheses preserve token boundaries next to identifiers and queries.
    // Bare placeholders could merge into a free real or even another query key.
    substituted += source.slice(cursor, match.index) + `(${name})`
    cursor = closing + 1
    probabilityLead.lastIndex = cursor
  }
  return substituted + source.slice(cursor)
}

export const parse_causal_document = (graphText: string, constraintText: string): CausalDocument => {
  check_input_length(graphText.length + constraintText.length)
  const graph = parse_causal_graph(graphText)
  const constraints: PrSat['Constraint'][] = []
  const probabilities: Record<string, CausalProbability> = {}
  const source: string[] = []
  for (const [lineIndex, line] of constraintText.split(/\r?\n/).entries()) {
    const text = strip_comment(line)
    if (!text) continue
    if (constraints.length >= CAUSAL_LIMITS.max_constraints) {
      throw new Error(`At most ${CAUSAL_LIMITS.max_constraints} causal constraint lines are supported.`)
    }
    try {
      const substituted = substitute_probabilities(graph, text, probabilities)
      const result = parse_constraint(substituted)
      if (!result[0]) throw new Error(`Invalid constraint: ${result[1]}`)
      const identifiers = free_real_variables_in_constraint_or_real_expr({ tag: 'constraint', constraint: result[1] }, new Set<string>())
      validate_causal_query_identifiers(identifiers, probabilities)
      constraints.push(result[1])
      source.push(text)
    } catch (error) {
      const recursionOverflow = error instanceof Error &&
        (error instanceof RangeError || error.name === 'InternalError') && /call stack|too much recursion/i.test(error.message)
      const detail = recursionOverflow ? 'Causal expression is too deeply nested to parse; simplify it.'
        : error instanceof Error ? error.message : String(error)
      throw new Error(`Constraint line ${lineIndex + 1}: ${detail}`)
    }
  }
  return { graph, constraints, probabilities, source }
}

