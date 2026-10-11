import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import type { Solver } from 'z3-solver'
import { compile_decision_problem, type CompiledDecisionProblem } from './causal_decision'
import { parse_causal_document, type CausalDocument, type CausalGraph, type CausalProbability } from './causal_syntax'
import { init_z3 } from './z3_integration'
import type { PrSat } from './types'

type Rational = { n: bigint, d: bigint }
type Model = { cpt: Record<string, Rational>, free: Record<string, Rational> }
type Sentence = PrSat['Sentence']
type Expr = PrSat['RealExpr']
type Constraint = PrSat['Constraint']
type World = { assignment: Record<string, boolean>, mass: Rational }
const abs = (n: bigint): bigint => n < 0n ? -n : n
const gcd = (a: bigint, b: bigint): bigint => b === 0n ? a : gcd(b, a % b)
const rational = (n: bigint, d = 1n): Rational => {
  if (d === 0n) throw new Error('An undefined quotient has no rational value.')
  const sign = d < 0n ? -1n : 1n
  const factor = gcd(abs(n), abs(d))
  return { n: sign * n / factor, d: sign * d / factor }
}
const zero = rational(0n)
const one = rational(1n)
const half = rational(1n, 2n)
const add = (a: Rational, b: Rational): Rational => rational(a.n * b.d + b.n * a.d, a.d * b.d)
const neg = (a: Rational): Rational => rational(-a.n, a.d)
const sub = (a: Rational, b: Rational): Rational => add(a, neg(b))
const mul = (a: Rational, b: Rational): Rational => rational(a.n * b.n, a.d * b.d)
const quotient = (a: Rational, b: Rational): Rational | undefined => b.n === 0n ? undefined : rational(a.n * b.d, a.d * b.n)
const compare = (a: Rational, b: Rational): bigint => a.n * b.d - b.n * a.d
const owns = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key)
const exact_literal = (source: string): Rational => {
  const [integer, decimal = ''] = source.split('.')
  return rational(BigInt(`${integer}${decimal}`), 10n ** BigInt(decimal.length))
}
const smt_rational = (q: Rational): string => {
  const numerator = q.n < 0n ? `(- ${-q.n})` : String(q.n)
  return q.d === 1n ? numerator : `(/ ${numerator} ${q.d})`
}

const letter = (sentence: Extract<Sentence, { tag: 'letter' }>): string => `${sentence.id}${sentence.index === 0 ? '' : sentence.index}`
const sentence_value = (sentence: Sentence, assignment: Record<string, boolean>): boolean => {
  switch (sentence.tag) {
    case 'value': return sentence.value
    case 'letter': return assignment[letter(sentence)]
    case 'negation': return !sentence_value(sentence.sentence, assignment)
    case 'conjunction': return sentence_value(sentence.left, assignment) && sentence_value(sentence.right, assignment)
    case 'disjunction': return sentence_value(sentence.left, assignment) || sentence_value(sentence.right, assignment)
    case 'conditional': return !sentence_value(sentence.left, assignment) || sentence_value(sentence.right, assignment)
    case 'biconditional': return sentence_value(sentence.left, assignment) === sentence_value(sentence.right, assignment)
  }
}
const assignments = (nodes: string[]): Record<string, boolean>[] => Array.from({ length: 2 ** nodes.length }, (_, bits) =>
  Object.fromEntries(nodes.map((node, index) => [node, (bits & (1 << index)) !== 0])),
)
const mechanism_key = (graph: CausalGraph, node: string, assignment: Record<string, boolean>): string =>
  `${node}:${[...(graph.parents[node] ?? [])].sort().map(parent => `${parent}=${assignment[parent] ? 1 : 0}`).join(',')}`

/**
 * Independent causal oracle: enumerate a finite private disturbance tuple,
 * then solve its structural equations. This does not multiply factors along
 * observed/intervened worlds or call the compiler's probability helpers.
 */
const structural_worlds = (graph: CausalGraph, model: Model, query: CausalProbability): World[] => {
  const disturbances = graph.nodes.flatMap(node => assignments(graph.parents[node] ?? []).map(parents => ({
    key: mechanism_key(graph, node, parents), node, probability: model.cpt[mechanism_key(graph, node, parents)],
  })))
  if (disturbances.length > 8) throw new Error('Keep this independent finite oracle bounded to eight disturbance bits.')
  const interventions = new Map(query.intervention.map(item => [item.variable, item.value]))
  return assignments(disturbances.map(item => item.key)).map(bits => {
    let mass = one
    for (const item of disturbances) mass = mul(mass, bits[item.key] ? item.probability : sub(one, item.probability))
    const values: Record<string, boolean> = {}
    const pending = new Set(graph.nodes)
    while (pending.size > 0) {
      const next = [...pending].find(node => (graph.parents[node] ?? []).every(parent => owns(values, parent)))
      if (next === undefined) throw new Error('Independent structural oracle requires an acyclic graph.')
      values[next] = interventions.get(next) ?? bits[mechanism_key(graph, next, values)]
      pending.delete(next)
    }
    return { assignment: values, mass }
  })
}
const probability_value = (document: CausalDocument, model: Model, query: CausalProbability): Rational | undefined => {
  let numerator = zero
  let denominator = zero
  for (const world of structural_worlds(document.graph, model, query)) {
    if (query.given !== undefined && !sentence_value(query.given, world.assignment)) continue
    denominator = add(denominator, world.mass)
    if (sentence_value(query.event, world.assignment)) numerator = add(numerator, world.mass)
  }
  return quotient(numerator, denominator)
}
const real_value = (document: CausalDocument, model: Model, expression: Expr): Rational | undefined => {
  switch (expression.tag) {
    case 'literal': return exact_literal(expression.source ?? String(expression.value))
    case 'variable': return owns(document.probabilities, expression.id)
      ? probability_value(document, model, document.probabilities[expression.id]) : model.free[expression.id]
    case 'probability': return probability_value(document, model, { event: expression.arg, intervention: [], source: '' })
    case 'given_probability': return probability_value(document, model, { event: expression.arg, given: expression.given, intervention: [], source: '' })
    case 'state_variable_sum': throw new Error('Source oracle never evaluates compiler state sums.')
    case 'negative': {
      const value = real_value(document, model, expression.expr)
      return value === undefined ? undefined : neg(value)
    }
    case 'power': {
      const base = real_value(document, model, expression.base)
      const exponent = real_value(document, model, expression.exponent)
      if (base === undefined || exponent === undefined) return undefined
      if (exponent.d !== 1n) throw new Error('Audit inputs use signed integer exponents.')
      if (exponent.n < 0n && base.n === 0n) return undefined
      const magnitude = abs(exponent.n)
      const value = rational(base.n ** magnitude, base.d ** magnitude)
      return exponent.n < 0n ? quotient(one, value) : value
    }
    case 'divide': {
      const n = real_value(document, model, expression.numerator)
      const d = real_value(document, model, expression.denominator)
      return n === undefined || d === undefined ? undefined : quotient(n, d)
    }
    default: {
      const left = real_value(document, model, expression.left)
      const right = real_value(document, model, expression.right)
      if (left === undefined || right === undefined) return undefined
      return expression.tag === 'plus' ? add(left, right) : expression.tag === 'minus' ? sub(left, right) : mul(left, right)
    }
  }
}

const all_defined = (document: CausalDocument, model: Model, constraint: Constraint): boolean => {
  switch (constraint.tag) {
    case 'negation': return all_defined(document, model, constraint.constraint)
    case 'conjunction': case 'disjunction': case 'conditional': case 'biconditional':
      return all_defined(document, model, constraint.left) && all_defined(document, model, constraint.right)
    default: return real_value(document, model, constraint.left) !== undefined && real_value(document, model, constraint.right) !== undefined
  }
}
/** Independent implementation of the source satisfaction contract, not its guard AST. */
const satisfied = (document: CausalDocument, model: Model, constraint: Constraint): boolean => {
  switch (constraint.tag) {
    case 'negation': return all_defined(document, model, constraint.constraint) && !satisfied(document, model, constraint.constraint)
    case 'conjunction': return satisfied(document, model, constraint.left) && satisfied(document, model, constraint.right)
    case 'disjunction': return satisfied(document, model, constraint.left) || satisfied(document, model, constraint.right)
    case 'conditional': return !satisfied(document, model, constraint.left) || satisfied(document, model, constraint.right)
    case 'biconditional': return satisfied(document, model, constraint.left) === satisfied(document, model, constraint.right)
    default: {
      const left = real_value(document, model, constraint.left)
      const right = real_value(document, model, constraint.right)
      if (left === undefined || right === undefined) return false
      const difference = compare(left, right)
      switch (constraint.tag) {
        case 'equal': return difference === 0n
        case 'not_equal': return difference !== 0n
        case 'less_than': return difference < 0n
        case 'less_than_or_equal': return difference <= 0n
        case 'greater_than': return difference > 0n
        case 'greater_than_or_equal': return difference >= 0n
      }
    }
  }
}

let solver: Solver<'PrSATdo_independent_audit'>
const nativeCases: { label: string, smt: string, expected: 'sat' | 'unsat' }[] = []
beforeAll(async () => {
  const z3 = await init_z3()
  if (z3 === undefined) throw new Error('Z3 initialization failed.')
  const context = new z3.Context('PrSATdo_independent_audit')
  solver = new context.Tactic('qfnra-nlsat').solver()
  solver.set('timeout', 15_000)
})
afterAll(() => {
  solver?.release()
  // Opt-in cross-runtime replay: regular tests have no native-Z3 dependency.
  // Preserve full replay input and checked outputs; never clean up artifacts.
  const prefix = process.env.PRSATDO_NATIVE_AUDIT_PREFIX
  if (prefix === undefined) return
  const nativeBinary = process.env.PRSATDO_NATIVE_Z3 ?? '/opt/homebrew/bin/z3'
  const input = nativeCases.map(({ smt }) => `(reset)\n(set-option :timeout 15000)\n${smt}\n(check-sat-using qfnra-nlsat)`).join('\n')
  writeFileSync(`${prefix}.smt2`, input)
  const output = execFileSync(nativeBinary, ['-in'], { input, encoding: 'utf8', maxBuffer: 10_000_000, timeout: 120_000 })
  const actual = output.trim().split(/\r?\n/)
  expect(actual).toHaveLength(nativeCases.length)
  const report = nativeCases.map((item, index) => ({ label: item.label, expected: item.expected, actual: actual[index] }))
  writeFileSync(`${prefix}.json`, JSON.stringify({
    nativeBinary,
    nativeVersion: execFileSync(nativeBinary, ['-version'], { encoding: 'utf8' }).trim(),
    inputSha256: createHash('sha256').update(input).digest('hex'), cases: report.length,
    matches: report.filter(item => item.expected === item.actual).length, report,
  }, null, 2))
  expect(report.filter(item => item.expected !== item.actual)).toEqual([])
})

const pinned = (compiled: CompiledDecisionProblem, model: Model): string => {
  // The key uses mechanism parent metadata, so graph edge text is not needed.
  const assertions = compiled.causal.mechanisms.map(item => {
    const key = `${item.node}:${Object.keys(item.parents).sort().map(parent => `${parent}=${item.parents[parent] ? 1 : 0}`).join(',')}`
    if (!owns(model.cpt, key)) throw new Error(`Missing independent CPT assignment ${key}.`)
    return `(assert (= ${item.parameter} ${smt_rational(model.cpt[key])}))`
  })
  for (const [id, value] of Object.entries(model.free)) assertions.push(`(assert (= ${id} ${smt_rational(value)}))`)
  return assertions.join('\n')
}
const check_projection = async (compiled: CompiledDecisionProblem, model: Model, expected: boolean, label: string, counterexample = false): Promise<void> => {
  const input = counterexample ? compiled.counterexampleSmt : compiled.premisesSmt
  if (input === undefined) throw new Error('Missing consequence countermodel formula.')
  const smt = `${input}\n${pinned(compiled, model)}`
  const status = expected ? 'sat' : 'unsat'
  nativeCases.push({ label, smt, expected: status })
  solver.reset()
  solver.fromString(smt)
  expect(await solver.check(), label).toBe(status)
}
const check_unpinned = async (compiled: CompiledDecisionProblem, expected: boolean, label: string, counterexample = false): Promise<void> => {
  const smt = counterexample ? compiled.counterexampleSmt : compiled.premisesSmt
  if (smt === undefined) throw new Error('Missing unpinned consequence formula.')
  const status = expected ? 'sat' : 'unsat'
  nativeCases.push({ label, smt, expected: status })
  solver.reset()
  solver.fromString(smt)
  expect(await solver.check(), label).toBe(status)
}

const two_node_models = (): Model[] => {
  const grid = [zero, half, one]
  return grid.flatMap(x => grid.flatMap(y0 => grid.map(y1 => ({ cpt: { 'X:': x, 'Y:X=0': y0, 'Y:X=1': y1 }, free: {} }))))
}
const compile_sat = (graph: string, premises: string): CompiledDecisionProblem => compile_decision_problem({ graph, premises, regular: false, task: 'satisfiability' })
const compile_entailment = (graph: string, premises: string, conclusion: string): CompiledDecisionProblem =>
  compile_decision_problem({ graph, premises, conclusion, regular: false, task: 'entailment' })

describe('independent real-algebraic causal decision audit', () => {
  test('matches explicit disturbance semantics on 378 pinned compound and intervention cases', async () => {
    const formulas = [
      'Pr(Y | X) = 1/2',
      '~(Pr(Y | X) = 1/2)',
      'Pr(Y | X) = 1/2 v Pr(~X) = 1',
      '(Pr(Y | X) = 1/2) -> (Pr(Y) = 1/2)',
      '(Pr(Y | X) = 1/2) <-> (Pr(Y | ~X) = 1/2)',
      '~((Pr(Y | X) = 1/2) v (Pr(Y) = 1/2))',
      '~(~(Pr(Y | X) = 1/2))',
      'Pr(Y | do(X=1)) = Pr(Y | X)',
      'Pr(Y | do(X=0), X) = 1/2 v Pr(X | do(X=0)) = 0',
      'Pr(Y | do(X=1), X) = Pr(Y | do(X=1))',
      '(Pr(Y | X) = 1/2) <-> ~(Pr(Y | X) = 1/2)',
      '~((Pr(Y | X) = 1/2) & (Pr(X) = 0))',
      '~((Pr(Y | X) = 1/2) -> (Pr(Y) = 1/2))',
      '~((Pr(Y | X) = 1/2) <-> (Pr(Y | ~X) = 1/2))',
    ]
    let cases = 0
    for (const formula of formulas) {
      const document = parse_causal_document('X -> Y', formula)
      const compiled = compile_sat('X -> Y', formula)
      for (const model of two_node_models()) {
        const expected = document.constraints.every(c => satisfied(document, model, c))
        await check_projection(compiled, model, expected, `${formula}; model ${cases}`)
        cases++
      }
    }
    expect(cases).toBe(378)
  })

  test('complements satisfaction across 162 pinned consequence cases, including undefined conclusions', async () => {
    const conclusions = [
      'Pr(Y | X) = 1/2',
      '~(Pr(Y | X) = 1/2)',
      'Pr(Y | X) = 1/2 v Pr(X) = 0',
      '(Pr(Y | X) = 1/2) -> (Pr(Y | do(X=1)) = 1/2)',
      '(Pr(Y | X) = 1/2) <-> ~(Pr(Y | X) = 1/2)',
      '~((Pr(Y | do(X=1), ~X) = 1/2) v (Pr(X) = 1))',
    ]
    let cases = 0
    for (const conclusion of conclusions) {
      const document = parse_causal_document('X -> Y', conclusion)
      const compiled = compile_entailment('X -> Y', '', conclusion)
      for (const model of two_node_models()) {
        const expectedCountermodel = !satisfied(document, model, document.constraints[0])
        await check_projection(compiled, model, expectedCountermodel, `complement ${conclusion}; model ${cases}`, true)
        cases++
      }
    }
    expect(cases).toBe(162)
  })

  test('matches signed rational arithmetic and power definedness in 50 pinned cases', async () => {
    const formulas = [
      '1/a < 0', '1/a > 0', 'a^(-3) < 0', 'a^(-2) > 0',
      '1/(1/a) = a', 'a/(a*a) = 1/a',
      'a = 0 v 1/a = 1', '(1/a)^0 = 1',
      '~((1/a = 1) v (a = 0))', '(1/a = 1) -> (a = 1)',
    ]
    let cases = 0
    for (const formula of formulas) {
      const document = parse_causal_document('X', formula)
      const compiled = compile_sat('X', formula)
      for (const a of [-2n, -1n, 0n, 1n, 2n]) {
        const model: Model = { cpt: { 'X:': half }, free: { a: rational(a) } }
        await check_projection(compiled, model, satisfied(document, model, document.constraints[0]), `${formula}; a=${a}`)
        cases++
      }
    }
    expect(cases).toBe(50)
  })

  test('an undefined conclusion is a countermodel even though its source negation is impossible', async () => {
    const premises = 'Pr(X) = 0'
    const conclusion = 'Pr(Y | X) = 1/2'
    const model: Model = { cpt: { 'X:': zero, 'Y:X=0': half, 'Y:X=1': one }, free: {} }
    await check_projection(compile_entailment('X -> Y', premises, conclusion), model, true, 'undefined atomic countermodel', true)
    await check_projection(compile_sat('X -> Y', `${premises}\n~(${conclusion})`), model, false, 'source negation pitfall')
  })

  test('an absent observational parent configuration leaves intervention values free', async () => {
    const premises = 'Pr(X) = 0\nPr(Y) = 0'
    const conclusion = 'Pr(Y | do(X=1)) = 0'
    const model: Model = { cpt: { 'X:': zero, 'Y:X=0': zero, 'Y:X=1': rational(3n, 4n) }, free: {} }
    const document = parse_causal_document('X -> Y', `${premises}\n${conclusion}`)
    const queries = Object.values(document.probabilities)
    expect(probability_value(document, model, queries[queries.length - 1])).toEqual(rational(3n, 4n))
    await check_projection(compile_entailment('X -> Y', premises, conclusion), model, true, 'zero-support intervened mechanism countermodel', true)
  })

  test('shared mechanisms imply adjustment and expose confounded association countermodels', async () => {
    const graph = 'Z -> X; Z -> Y'
    const premises = 'Pr(Z) = 1/2\nPr(X | Z) = 3/4\nPr(X | ~Z) = 1/4\nPr(Y | Z) = 1\nPr(Y | ~Z) = 0'
    const model: Model = { cpt: { 'Z:': half, 'X:Z=0': rational(1n, 4n), 'X:Z=1': rational(3n, 4n), 'Y:Z=0': zero, 'Y:Z=1': one }, free: {} }
    await check_projection(compile_entailment(graph, premises, 'Pr(Y | do(X=1)) = 1/2'), model, false, 'confounded intervention exact half', true)
    await check_projection(compile_entailment(graph, premises, 'Pr(Y | X) = Pr(Y | do(X=1))'), model, true, 'association differs from intervention', true)
    const adjustment = 'Pr(Y | do(X=1)) = Pr(Y | X & Z)*Pr(Z) + Pr(Y | X & ~Z)*Pr(~Z)'
    await check_projection(compile_entailment(graph, premises, adjustment), model, false, 'adjustment through shared mechanisms', true)
  })

  test('inconsistent premises have no countermodel even for an undefined conclusion', async () => {
    const compiled = compile_entailment('X -> Y', 'Pr(X) = 0\nPr(X) = 1', 'Pr(Y | X) = 1/2')
    const model: Model = { cpt: { 'X:': zero, 'Y:X=0': zero, 'Y:X=1': one }, free: {} }
    await check_projection(compiled, model, false, 'inconsistent premise projection')
    await check_projection(compiled, model, false, 'inconsistent premise consequence complement', true)
  })

  test('defined exact coefficients survive values beyond JavaScript safe integer precision', async () => {
    const model: Model = { cpt: { 'X:': rational(9007199254740993n, 18014398509481984n) }, free: {} }
    await check_projection(compile_sat('X', 'Pr(X)*18014398509481984 = 9007199254740993'), model, true, 'large integer coefficient equality')
    await check_projection(compile_sat('X', 'Pr(X)*18014398509481984 = 9007199254740992'), model, false, 'adjacent unsafe integer inequality')
    await check_projection(compile_sat('X', '0.10000000000000001 = 0.1'), model, false, 'distinct decimal source coefficients')
  })

  test('settles six unpinned semantic consequences over real parameter values', async () => {
    // In X->Y, positive observational X makes its child conditional equal
    // the X=1 mechanism. These are universal parameter checks, not grid checks.
    await check_unpinned(compile_entailment('X -> Y', 'Pr(X) > 0', 'Pr(Y | X) = Pr(Y | do(X=1))'), false, 'positive-support action observation consequence', true)
    await check_unpinned(compile_entailment('X -> Y', 'Pr(X) = 0', 'Pr(Y | X) = Pr(Y | do(X=1))'), true, 'undefined action observation countermodel', true)
    // Positive mechanisms do not eliminate impossible evidence under do(X=1).
    const regular = compile_decision_problem({ graph: 'X -> Y', premises: '', conclusion: 'Pr(Y | do(X=1), ~X) = 1/2', regular: true, task: 'entailment' })
    await check_unpinned(regular, true, 'regular structural-zero evidence countermodel', true)
    await check_unpinned(compile_entailment('X', 'a > 0', '1/a > 0'), false, 'positive reciprocal consequence', true)
    await check_unpinned(compile_entailment('X', 'a < 0', 'a^(-3) < 0'), false, 'negative odd reciprocal consequence', true)
    await check_unpinned(compile_entailment('X', 'a^2 = 2\na > 0', '1/a < a'), false, 'algebraic reciprocal consequence', true)
  })
})
