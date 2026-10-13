import { s_to_string, type S } from './s'

/** Measure shared expression DAGs before serializing their potentially huge trees. */
export class SmtBudget {
  private readonly arrays = new WeakMap<S[], { id: number, cost: number, degree: number }>()
  private readonly atoms = new Map<S, { id: number, cost: number, degree: number }>()
  private readonly signatures = new Map<string, number>()
  private next = 0
  constructor(private readonly limit: number, private readonly variables: readonly string[]) {}
  private info(s: S): { id: number, cost: number, degree: number } {
    if (!Array.isArray(s)) {
      const known = this.atoms.get(s); if (known) return known
      const value = { id: ++this.next, cost: String(s).length, degree: typeof s === 'string' && (this.variables.includes(s) || s.startsWith('decision_aux_')) ? 1 : 0 }
      this.atoms.set(s, value); return value
    }
    const known = this.arrays.get(s); if (known) return known
    const children = s.map(x => this.info(x))
    const signature = children.map(x => x.id).join(',')
    let id = this.signatures.get(signature)
    if (id === undefined) { id = ++this.next; this.signatures.set(signature, id) }
    const degree = s[0] === '*' ? children.slice(1).reduce((a, b) => Math.min(1_000_000, a + b.degree), 0) : Math.max(0, ...children.slice(1).map(x => x.degree))
    const value = { id, degree, cost: Math.min(this.limit + 1, 2 + Math.max(0, s.length - 1) + children.reduce((a, b) => Math.min(this.limit + 1, a + b.cost), 0)) }
    this.arrays.set(s, value); return value
  }
  key(s: S): number { return this.info(s).id }
  cost(s: S): number { return this.info(s).cost }
  degree(s: S): number { return this.info(s).degree }
  render(s: S): string {
    if (this.cost(s) > this.limit) throw new Error(`Decision reduction is limited to ${this.limit} SMT characters.`)
    return s_to_string(s, false)
  }
}
