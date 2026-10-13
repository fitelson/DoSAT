// Guard-preserving solver-only optimization; original witness metadata is retained.
// Optimized DoSAT solver-input compiler:
//  (1) ancestral (barren-node) marginalization + constant-kernel extraction per mass
//  (2) guarded common-factor cancellation for conditional masses
//  (3) factor-wise definedness guards simplified modulo mechanism bounds B
//  (4) exact rational constant folding, Boolean constant propagation
//  (5) inline polynomial emission; auxiliaries only for structurally distinct quotients
//  (6) bounded fraction normalization and cross-multiplication of guarded mass ratios
import type { CompiledCausalProblem } from './causal'
import type { ParsedDecisionInput } from './causal_decision'
import { SmtBudget } from './causal_smt_budget'
import { guard_div0_conditions_in_constraint, letter_string, recursively_evaluate_sentence } from './pr_sat'
import type { S } from './s'
import type { PrSat } from './types'
import type { Intervention } from './causal_syntax'

type Sentence = PrSat['Sentence']
type RealExpr = PrSat['RealExpr']
type Constraint = PrSat['Constraint']

// ---------- exact rationals ----------
const gcd = (a: bigint, b: bigint): bigint => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a }
export class Q {
  readonly n: bigint; readonly d: bigint
  constructor(n: bigint, d: bigint = 1n) {
    if (d === 0n) throw new Error('Q zero denominator')
    if (d < 0n) { n = -n; d = -d }
    const g = gcd(n, d) || 1n
    this.n = n / g; this.d = d / g
  }
  static parse(text: string): Q {
    const m = /^([0-9]+)(?:\.([0-9]+))?$/.exec(text)
    if (!m) throw new Error(`literal ${text}`)
    const frac = m[2] ?? ''
    return new Q(BigInt(m[1] + frac), 10n ** BigInt(frac.length))
  }
  add(o: Q) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d) }
  sub(o: Q) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d) }
  mul(o: Q) { return new Q(this.n * o.n, this.d * o.d) }
  div(o: Q) { return new Q(this.n * o.d, this.d * o.n) }
  neg() { return new Q(-this.n, this.d) }
  cmp(o: Q) { const x = this.n * o.d - o.n * this.d; return x < 0n ? -1 : x > 0n ? 1 : 0 }
  isZero() { return this.n === 0n }
  pow(k: number) { let r = new Q(1n); for (let i = 0; i < k; i++) r = r.mul(this); return r }
  toS(): S {
    const a = this.n < 0n ? -this.n : this.n
    const body: S = this.d === 1n ? `${a}` : ['/', `${a}`, `${this.d}`]
    return this.n < 0n ? ['-', body] : body
  }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}` }
}
const ZERO = new Q(0n), ONE = new Q(1n)
export const literal_q = (e: Extract<RealExpr, { tag: 'literal' }>): Q => Q.parse(e.source ?? String(e.value))

// ---------- AST helpers ----------
const lit = (value: number): RealExpr => ({ tag: 'literal', value })
const vbl = (id: string): RealExpr => ({ tag: 'variable', id })
const mul2 = (left: RealExpr, right: RealExpr): RealExpr => ({ tag: 'multiply', left, right })
const add2 = (left: RealExpr, right: RealExpr): RealExpr => ({ tag: 'plus', left, right })
const balanced = (xs: RealExpr[], op: (a: RealExpr, b: RealExpr) => RealExpr, id: number): RealExpr =>
  xs.length === 0 ? lit(id) : xs.length === 1 ? xs[0] : op(balanced(xs.slice(0, xs.length >> 1), op, id), balanced(xs.slice(xs.length >> 1), op, id))

const sentence_letters = (s: Sentence, out = new Set<string>()): Set<string> => {
  switch (s.tag) {
    case 'value': break
    case 'letter': out.add(letter_string(s)); break
    case 'negation': sentence_letters(s.sentence, out); break
    default: sentence_letters(s.left, out); sentence_letters(s.right, out)
  }
  return out
}

type Kernel = { node: string, value: boolean, param: string }
const kernel_key = (k: Kernel) => `${k.value ? '' : '~'}${k.param}`
const kernel_expr = (k: Kernel): RealExpr => k.value ? vbl(k.param) : { tag: 'minus', left: lit(1), right: vbl(k.param) }
const kernel_s = (k: Kernel): S => k.value ? k.param : ['-', '1', k.param]

/** c * M, where c is a product of constant kernels and M a sum of kernel products. */
export type MassInfo = { zero: boolean, constant: Kernel[], rows: Kernel[][], key: string }
export const massInfo = new WeakMap<RealExpr, MassInfo>()

type OptOptions = { prune: boolean, cancel: boolean, positivity: boolean, dedupe: boolean, fnf?: boolean }
const ALL: OptOptions = { prune: true, cancel: true, positivity: true, dedupe: true, fnf: true }

export const optimize_decision_input = (parsed: ParsedDecisionInput, causal: CompiledCausalProblem,
  limits: { max_auxiliary_variables: number, max_smt_characters: number }, exponent: (e: RealExpr) => number) => {
  const opts = ALL
  const graph = parsed.document.graph
  const parents = new Map(graph.nodes.map(n => [n, graph.nodes.filter(p => (graph.parents[n] ?? []).includes(p))]))
  const children = new Map(graph.nodes.map(n => [n, graph.nodes.filter(c => parents.get(c)!.includes(n))]))
  const mech = new Map<string, string>()
  for (const m of causal.mechanisms) mech.set(`${m.node}|${parents.get(m.node)!.map(p => m.parents[p] ? 1 : 0).join('')}`, m.parameter)
  const kernel = (node: string, val: (n: string) => boolean): Kernel =>
    ({ node, value: val(node), param: mech.get(`${node}|${parents.get(node)!.map(p => val(p) ? 1 : 0).join('')}`)! })

  const massCache = new Map<string, RealExpr>()
  const mass = (I: Map<string, boolean>, event: Sentence): RealExpr => {
    const L = sentence_letters(event)
    // Ancestral set in the mutilated graph (intervened nodes have no parents and no factor).
    let A: string[]
    if (opts.prune) {
      const set = new Set<string>(), stack = [...L].filter(n => !I.has(n))
      while (stack.length) { const n = stack.pop()!; if (set.has(n)) continue; set.add(n); for (const p of parents.get(n)!) if (!I.has(p)) stack.push(p) }
      A = graph.nodes.filter(n => set.has(n))
    } else A = graph.nodes.filter(n => !I.has(n))
    const all: Record<string, boolean>[] = []
    for (let bits = 0; bits < 2 ** A.length; bits++) {
      const row: Record<string, boolean> = {}
      A.forEach((n, i) => { row[n] = (bits & (1 << (A.length - i - 1))) !== 0 })
      for (const [n, v] of I) row[n] = v
      all.push(row)
    }
    let rows = all.filter(r => recursively_evaluate_sentence(l => r[letter_string(l)], event))
    const info: MassInfo = { zero: rows.length === 0, constant: [], rows: [], key: '' }
    if (rows.length === 0) { const e = lit(0); massInfo.set(e, info); return e }
    if (rows.length === all.length) { const e = lit(1); return e } // normalization identity (also baseline)
    const context = new Map(I)
    let active = [...A]
    if (opts.prune) {
      for (let changed = true; changed;) {
        changed = false
        for (const X of [...active]) {
          const terminal = !children.get(X)!.some(c => active.includes(c))
          const flip = (r: Record<string, boolean>) => ({ ...r, [X]: !r[X] })
          const rk = (r: Record<string, boolean>) => active.map(n => r[n] ? 1 : 0).join('')
          const keys = new Set(rows.map(rk))
          if (terminal && rows.every(r => keys.has(rk(flip(r))))) { // Rule B: barren, sums to one
            active = active.filter(n => n !== X)
            // project onto the remaining active coordinates
            const uniq = new Map<string, Record<string, boolean>>()
            for (const r of rows) uniq.set(active.map(n => r[n] ? 1 : 0).join(''), r)
            rows = [...uniq.values()]
            changed = true; break
          }
          const fixed = (n: string) => context.has(n) || rows.every(r => r[n] === rows[0][n])
          if (fixed(X) && parents.get(X)!.every(fixed)) { // Rule F: constant kernel factor
            const v = (n: string) => context.has(n) ? context.get(n)! : rows[0][n]
            info.constant.push(kernel(X, v))
            context.set(X, rows[0][X])
            active = active.filter(n => n !== X)
            changed = true; break
          }
        }
      }
    }
    const v = (r: Record<string, boolean>) => (n: string) => context.has(n) ? context.get(n)! : r[n]
    info.rows = rows.map(r => active.map(n => kernel(n, v(r))))
    info.constant.sort((a, b) => kernel_key(a) < kernel_key(b) ? -1 : 1)
    info.key = JSON.stringify(info.rows.map(r => r.map(kernel_key)).sort())
    const expr = balanced([...info.constant.map(kernel_expr), balanced(info.rows.map(r => balanced(r.map(kernel_expr), mul2, 1)), add2, 0)], mul2, 1)
    massInfo.set(expr, info)
    return expr
  }
  const cachedMass = (intervention: Intervention[], event: Sentence): RealExpr => {
    const I = new Map(intervention.map(i => [i.variable, i.value]))
    const key = JSON.stringify([[...I].sort(), event])
    let e = massCache.get(key)
    if (!e) { e = mass(I, event); massCache.set(key, e) }
    return e
  }
  const probability = (event: Sentence, given: Sentence | undefined, intervention: Intervention[]): RealExpr => {
    if (given === undefined) return cachedMass(intervention, event)
    return { tag: 'divide', numerator: cachedMass(intervention, { tag: 'conjunction', left: event, right: given }), denominator: cachedMass(intervention, given) }
  }
  const queries = new Map(Object.entries(parsed.document.probabilities).map(([id, p]) => [id, probability(p.event, p.given, p.intervention)]))
  const tr = (e: RealExpr): RealExpr => {
    switch (e.tag) {
      case 'literal': return e
      case 'variable': return queries.get(e.id) ?? e
      case 'probability': return probability(e.arg, undefined, [])
      case 'given_probability': return probability(e.arg, e.given, [])
      case 'state_variable_sum': throw new Error('svs')
      case 'negative': return { ...e, expr: tr(e.expr) }
      case 'power': return { ...e, base: tr(e.base), exponent: tr(e.exponent) }
      case 'divide': return { ...e, numerator: tr(e.numerator), denominator: tr(e.denominator) }
      default: return { ...e, left: tr(e.left), right: tr(e.right) }
    }
  }
  const trc = (c: Constraint): Constraint => {
    switch (c.tag) {
      case 'negation': return { ...c, constraint: trc(c.constraint) }
      case 'conjunction': case 'disjunction': case 'conditional': case 'biconditional': return { ...c, left: trc(c.left), right: trc(c.right) }
      default: return { ...c, left: tr(c.left), right: tr(c.right) }
    }
  }
  const guarded = parsed.document.constraints.map(c => guard_div0_conditions_in_constraint(trc(c)))
  const lowering = new Lowering(parsed.regular, opts, causal.variables, limits, exponent)
  const premises = guarded.slice(0, parsed.premiseCount).map(c => lowering.constraint(c))
  const conclusion = parsed.task === 'entailment' ? lowering.constraint(guarded[guarded.length - 1]) : undefined
  const bounds: S[] = causal.mechanisms.flatMap(m => parsed.regular
    ? [['<', '0', m.parameter], ['<', m.parameter, '1']] : [['<=', '0', m.parameter], ['<=', m.parameter, '1']])
  const variables = [...causal.variables, ...lowering.aux]
  const emit = (asserts: (S | boolean)[]) => {
    const lines: string[] = ['(set-logic QF_NRA)', ...variables.map(v => `(declare-fun ${v} () Real)`)]
    const estimated = lines.reduce((n, line) => n + line.length + 1, 0) + asserts.reduce<number>((n, a) => n + (a === true ? 0 : lowering.budget.cost(a) + 10), 0)
    if (estimated > limits.max_smt_characters) throw new Error('Decision reduction exceeds the SMT character limit.')
    for (const a of asserts) { if (a === true) continue; lines.push(`(assert ${a === false ? 'false' : lowering.budget.render(a as S)})`) }
    const text = lines.join('\n'); if (text.length > limits.max_smt_characters) throw new Error('Decision reduction exceeds the SMT character limit.'); return text
  }
  const base = [...bounds, ...lowering.definitions, ...premises]
  return {
    regular: parsed.regular, causal, guarded, premiseCount: parsed.premiseCount, lowering,
    premisesS: premises, conclusionS: conclusion, bounds, variables,
    premisesSmt: emit(base),
    counterexampleSmt: conclusion === undefined ? undefined : emit([...base, conclusion === true ? false : conclusion === false ? true : ['not', conclusion]]),
  }
}

// ---------- lowering ----------
type Low = { s: S, q?: Q }
const isQ = (l: Low): l is { s: S, q: Q } => l.q !== undefined
const C = (q: Q): Low => ({ s: q.toS(), q })

class Lowering {
  aux: string[] = []
  definitions: S[] = []
  quotientDefs: { r: string, num: S, den: S }[] = []
  private quotients = new Map<string, string>()
  private ordinal = 0
  readonly budget: SmtBudget
  private readonly realMemo = new WeakMap<RealExpr, Low>()
  constructor(readonly regular: boolean, readonly opts: OptOptions, private readonly occupied: string[],
    private readonly limits: { max_auxiliary_variables: number, max_smt_characters: number },
    private readonly exponent: (e: RealExpr) => number) { this.budget = new SmtBudget(limits.max_smt_characters, occupied) }
  private fresh() { if (this.aux.length >= this.limits.max_auxiliary_variables) throw new Error('Decision reduction exceeds the auxiliary-variable limit.'); let n: string; do { n = `decision_aux_${++this.ordinal}` } while (this.occupied.includes(n)); this.aux.push(n); return n }

  /** Mass-type expression: product of kernels times a nonempty sum of kernel products; nonnegative on B. */
  private massS(info: MassInfo, dropKernels: string[] = [], dropSum = false): { s: S, factors: number } {
    const drop = [...dropKernels]
    const ks = info.constant.filter(k => { const i = drop.indexOf(kernel_key(k)); if (i >= 0) { drop.splice(i, 1); return false } return true })
    const factors: S[] = ks.map(kernel_s)
    if (!dropSum && info.rows.length > 0 && !(info.rows.length === 1 && info.rows[0].length === 0)) {
      const terms = info.rows.map(r => r.length === 0 ? '1' : r.length === 1 ? kernel_s(r[0]) : ['*', ...r.map(kernel_s)] as S)
      factors.push(terms.length === 1 ? terms[0] : ['+', ...terms])
    }
    return { s: factors.length === 0 ? '1' : factors.length === 1 ? factors[0] : ['*', ...factors], factors: factors.length }
  }

  /** Guarded cancellation: N/D -> N'/D' valid wherever D != 0. Returns den undefined for polynomial. */
  private massQuotient(e: Extract<RealExpr, { tag: 'divide' }>): { num: S, den?: S } | undefined {
    const n = massInfo.get(e.numerator), d = massInfo.get(e.denominator)
    if (!this.opts.cancel || !n || !d) return undefined
    if (d.zero) return { num: '0' }     // guard is literally false; value irrelevant
    if (n.zero) return { num: '0' }     // 0/D = 0 where D != 0
    const nk = n.constant.map(kernel_key), dk = d.constant.map(kernel_key)
    const common = nk.filter(k => { const j = dk.indexOf(k); if (j >= 0) { dk.splice(j, 1); return true } return false })
    const sameSum = n.key === d.key
    const num = this.massS(n, common, sameSum)
    const den = this.massS(d, common, sameSum)
    return den.factors === 0 ? { num: num.s } : { num: num.s, den: den.s }
  }

  private quotientAux(num: S, den: S, massDen: boolean): S {
    const key = `${this.budget.key(num)}|${this.budget.key(den)}`
    const cached = this.opts.dedupe ? this.quotients.get(key) : undefined
    if (cached) return cached
    const r = this.fresh()
    // On B a regular mass denominator is strictly positive, so the total relation's first disjunct is false.
    this.definitions.push(massDen && this.regular && this.opts.positivity ? ['=', ['*', r, den], num] : ['or', ['=', den, '0'], ['=', ['*', r, den], num]])
    this.quotients.set(key, r)
    this.quotientDefs.push({ r, num, den })
    return r
  }

  real(e: RealExpr): Low {
    const known = this.realMemo.get(e); if (known) return known
    const value = this.lowerReal(e); this.realMemo.set(e, value); return value
  }
  private lowerReal(e: RealExpr): Low {
    switch (e.tag) {
      case 'literal': return C(literal_q(e))
      case 'variable': return { s: e.id }
      case 'negative': { const x = this.real(e.expr); return isQ(x) ? C(x.q.neg()) : { s: ['-', x.s] } }
      case 'plus': case 'minus': {
        const info = massInfo.get(e)
        if (info && !info.zero) return { s: this.massS(info).s }
        const a = this.real(e.left), b = this.real(e.right)
        if (isQ(a) && isQ(b)) return C(e.tag === 'plus' ? a.q.add(b.q) : a.q.sub(b.q))
        if (isQ(b) && b.q.isZero()) return a
        if (e.tag === 'plus' && isQ(a) && a.q.isZero()) return b
        return { s: [e.tag === 'plus' ? '+' : '-', a.s, b.s] }
      }
      case 'multiply': {
        const info = massInfo.get(e)
        if (info && !info.zero) return { s: this.massS(info).s }
        const a = this.real(e.left), b = this.real(e.right)
        if (isQ(a) && isQ(b)) return C(a.q.mul(b.q))
        // 0 * t = 0 is valid inside a guarded block: t's definedness guard is a separate conjunct.
        if ((isQ(a) && a.q.isZero()) || (isQ(b) && b.q.isZero())) return C(ZERO)
        if (isQ(a) && a.q.cmp(ONE) === 0) return b
        if (isQ(b) && b.q.cmp(ONE) === 0) return a
        return { s: ['*', a.s, b.s] }
      }
      case 'divide': {
        const mq = this.massQuotient(e)
        if (mq) return mq.den === undefined ? (mq.num === '0' ? C(ZERO) : { s: mq.num }) : { s: this.quotientAux(mq.num, mq.den, true) }
        const n = this.real(e.numerator), d = this.real(e.denominator)
        if (isQ(d)) return d.q.isZero() ? C(ZERO) /* guard false */ : isQ(n) ? C(n.q.div(d.q)) : { s: ['*', ONE.div(d.q).toS(), n.s] }
        return { s: this.quotientAux(n.s, d.s, massInfo.has(e.denominator) && !massInfo.get(e.denominator)!.zero) }
      }
      case 'power': {
        const signed = this.exponent(e.exponent), k = Math.abs(signed)
        const b = this.real(e.base)
        if (k === 0) return C(ONE) // Original base-definedness guards remain.
        const canFold = isQ(b) && Math.max(b.q.n.toString(2).length, b.q.d.toString(2).length) * k <= 16384
        const pos: Low = canFold ? C(b.q.pow(k)) : { s: this.positivePower(b.s, k) }
        if (signed >= 0) return pos
        if (isQ(pos)) return pos.q.isZero() ? C(ZERO) : C(ONE.div(pos.q))
        return { s: this.quotientAux('1', pos.s, false) }
      }
      default: throw new Error(`untranslated ${e.tag}`)
    }
  }

  private positivePower(base: S, exponent: number): S {
    if (exponent === 0) return '1'
    if (exponent === 1) return base
    const half = this.positivePower(base, Math.floor(exponent / 2))
    const square = this.fresh(); this.definitions.push(['=', square, ['*', half, half]])
    if (exponent % 2 === 0) return square
    const result = this.fresh(); this.definitions.push(['=', result, ['*', square, base]])
    return result
  }

  /** Guarded fraction normal form: factor lists; denominators are reduced mass denominators
   *  (positive wherever the enclosing guards and B hold). Every step is an identity where those
   *  denominators are nonzero; structurally identical factors cancel. Bounded by MAX_DEN factors. */
  private fracF(e: RealExpr): { n: S[], d: S[] } | undefined {
    const MAX_DEN = 8
    const fs = (x: S): S[] => Array.isArray(x) && x[0] === '*' ? x.slice(1) as S[] : x === '1' ? [] : [x]
    const cancel = (n: S[], d: S[]) => {
      const dn = [...d], nn: S[] = []
      for (const f of n) { const i = dn.findIndex(g => this.budget.key(g) === this.budget.key(f)); if (i >= 0) dn.splice(i, 1); else nn.push(f) }
      return dn.length > MAX_DEN ? undefined : { n: nn, d: dn }
    }
    if (!has_division(e)) { const v = this.real(e); return { n: isQ(v) && v.q.cmp(ONE) === 0 ? [] : fs(v.s), d: [] } }
    switch (e.tag) {
      case 'divide': { const mq = this.massQuotient(e); return mq ? cancel(fs(mq.num), mq.den ? fs(mq.den) : []) : undefined }
      case 'negative': { const a = this.fracF(e.expr); return a && { n: [['-', prodS(a.n)]], d: a.d } }
      case 'multiply': { const a = this.fracF(e.left), b = this.fracF(e.right); return a && b ? cancel([...a.n, ...b.n], [...a.d, ...b.d]) : undefined }
      case 'plus': case 'minus': {
        const a = this.fracF(e.left), b = this.fracF(e.right); if (!a || !b) return undefined
        const op = e.tag === 'plus' ? '+' : '-'
        const key = (xs: S[]) => xs.map(x => this.budget.key(x)).sort().join('|')
        if (key(a.d) === key(b.d)) return { n: [[op, prodS(a.n), prodS(b.n)]], d: a.d }
        return cancel([[op, prodS([...a.n, ...b.d]), prodS([...b.n, ...a.d])]], [...a.d, ...b.d])
      }
      default: return undefined
    }
  }

  private compare(op: string, l: RealExpr, r: RealExpr): S | boolean {
    if (this.opts.fnf && this.opts.cancel) {
      const a = this.fracF(l), b = this.fracF(r)
      if (a && b) {
        const ls = prodS([...a.n, ...b.d]), rs = prodS([...b.n, ...a.d])
        if (this.budget.cost(ls) <= 64000 && this.budget.cost(rs) <= 64000 && this.budget.degree(ls) <= 64 && this.budget.degree(rs) <= 64) return this.budget.key(ls) === this.budget.key(rs) ? ['<=', '>=', '='].includes(op) : [op, ls, rs]
      }
    }
    const a = this.real(l), b = this.real(r)
    if (isQ(a) && isQ(b)) { const c = a.q.cmp(b.q); return op === '<' ? c < 0 : op === '<=' ? c <= 0 : op === '>' ? c > 0 : op === '>=' ? c >= 0 : c === 0 }
    if (this.budget.key(a.s) === this.budget.key(b.s)) return ['<=', '>=', '='].includes(op)
    return [op, a.s, b.s]
  }

  /** Factor-wise guard for D != 0 where D is a mass expression; simplified modulo B. */
  private massNonzero(info: MassInfo): S | boolean {
    if (info.zero) return false
    if (this.regular) return true
    const parts: S[] = info.constant.map(k => k.value ? ['<', '0', k.param] : ['<', k.param, '1'])
    if (!(info.rows.length === 1 && info.rows[0].length === 0)) {
      if (info.rows.length === 1) for (const k of info.rows[0]) parts.push(k.value ? ['<', '0', k.param] : ['<', k.param, '1'])
      else parts.push(['<', '0', this.massS({ ...info, constant: [] }).s])
    }
    return parts.length === 0 ? true : parts.length === 1 ? parts[0] : ['and', ...parts]
  }

  constraint(c: Constraint): S | boolean {
    switch (c.tag) {
      case 'negation': {
        const inner = c.constraint
        if (this.opts.positivity && inner.tag === 'equal' && inner.right.tag === 'literal' && literal_q(inner.right).isZero() && massInfo.has(inner.left)) {
          return this.massNonzero(massInfo.get(inner.left)!)
        }
        return not(this.constraint(inner))
      }
      case 'conjunction': return and(this.constraint(c.left), this.constraint(c.right))
      case 'disjunction': return or(this.constraint(c.left), this.constraint(c.right))
      case 'conditional': return or(not(this.constraint(c.left)), this.constraint(c.right))
      case 'biconditional': { const a = this.constraint(c.left), b = this.constraint(c.right); return typeof a === 'boolean' ? (a ? b : not(b)) : typeof b === 'boolean' ? (b ? a : not(a)) : ['=', a, b] }
      default: {
        const op = c.tag === 'less_than' ? '<' : c.tag === 'less_than_or_equal' ? '<=' : c.tag === 'greater_than' ? '>' : c.tag === 'greater_than_or_equal' ? '>=' : '='
        const x = this.compare(op, c.left, c.right)
        return c.tag === 'not_equal' ? not(x) : x
      }
    }
  }
}
const has_division = (e: RealExpr): boolean => {
  switch (e.tag) {
    case 'divide': return true
    case 'power': return has_division(e.base) || (e.exponent.tag === 'negative')
    case 'negative': return has_division(e.expr)
    case 'literal': case 'variable': return false
    case 'plus': case 'minus': case 'multiply': return has_division(e.left) || has_division(e.right)
    default: return true
  }
}
const not = (a: S | boolean): S | boolean => typeof a === 'boolean' ? !a : Array.isArray(a) && a[0] === 'not' ? a[1] : ['not', a]
const and = (a: S | boolean, b: S | boolean): S | boolean => a === false || b === false ? false : a === true ? b : b === true ? a
  : ['and', ...(Array.isArray(a) && a[0] === 'and' ? a.slice(1) : [a]), ...(Array.isArray(b) && b[0] === 'and' ? b.slice(1) : [b])]
const or = (a: S | boolean, b: S | boolean): S | boolean => a === true || b === true ? true : a === false ? b : b === false ? a
  : ['or', ...(Array.isArray(a) && a[0] === 'or' ? a.slice(1) : [a]), ...(Array.isArray(b) && b[0] === 'or' ? b.slice(1) : [b])]

const prodS = (xs: S[]): S => xs.length === 0 ? '1' : xs.length === 1 ? xs[0] : ['*', ...xs]
