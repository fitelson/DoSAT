import { beforeAll, expect, test } from 'vitest'
import { compile_decision_problem, type DecisionProblemInput } from './causal_decision'
import { DECISION_EXAMPLES } from './causal_decision_examples'
import { CausalDecisionSolver } from './causal_decision_solver'
import { SmtBudget } from './causal_smt_budget'
import { init_z3 } from './z3_integration'
import type { S } from './s'

const compile = (premises: string, patch: Partial<DecisionProblemInput> = {}) => compile_decision_problem({ graph: 'X -> Y', premises, regular: false, task: 'satisfiability', ...patch })
let solver: CausalDecisionSolver
beforeAll(async () => { solver = new CausalDecisionSolver(await init_z3()) })

test.each([
  ['CE1 cancelled zero-support factor', 'Pr(X)=0\nPr(Y | X)=1/2', false, 'unsat'],
  ['CE2 impossible intervention evidence', 'Pr(Y | do(X), ~X)=1/2', true, 'unsat'],
  ['CE5 zero times undefined', 'Pr(X)=0\n0*(1/Pr(X))=0', false, 'unsat'],
  ['CE5b zero power of undefined', 'Pr(X)=0\nPr(Y | X)^0=1', false, 'unsat'],
  ['CE6 unused undefined arithmetic disjunct', 'Pr(Y)=1/2\nx=1\nx/(Pr(Y)-1/2)=3 v Pr(Y)=1/2', true, 'sat'],
] as const)('%s', async (_name, premises, regular, status) => {
  expect((await solver.decide(compile(premises, { regular }))).status).toBe(status)
})

test('CE4 undefined conclusion remains a countermodel after cancellation', async () => {
  const result = await solver.decide(compile('Pr(X)=0', { task: 'entailment', conclusion: 'Pr(Y | X)=1/2' }))
  expect(result).toMatchObject({ status: 'not-entailed', witness: { queries: expect.arrayContaining([{ source: 'Pr(Y | X)', defined: false }]) } })
})

test('whole-scope explicit negation still requires its unused disjunct to be defined', async () => {
  expect((await solver.decide(compile('Pr(X)=0\n~(Pr(Y | X)=1/2 & Pr(X)=1)'))).status).toBe('unsat')
  expect((await solver.decide(compile('Pr(X)=0\nPr(Y | X)=1/2 v Pr(X)=0'))).status).toBe('sat')
})

test('full-parent cancellation respects intervened children and descendant evidence', async () => {
  const premises = 'Pr(X)=1/2\nPr(Y | X)=1/2\nPr(Y | ~X)=1/2\nPr(Z | Y)=3/4\nPr(Z | ~Y)=1/4'
  const result = await solver.decide(compile(premises, { graph: 'X -> Y; Y -> Z', regular: true, task: 'entailment', conclusion: '(Pr(Y | do(Y), X)=1) & (Pr(Y | X & Z)=3/4)' }))
  expect(result.status).toBe('entailed')
})

test('ancestral pruning changes only solver expressions, retaining complete metadata', () => {
  const small = compile('Pr(Y | X)=1/2')
  const large = compile('Pr(Y | X)=1/2', { graph: 'X -> Y; Y -> Z; W' })
  expect(large.causal.variables.length).toBeGreaterThan(small.causal.variables.length)
  expect(large.causal.distributions[0].rows).toHaveLength(16)
  expect(large.causal.queries[0].expression).not.toEqual(small.causal.queries[0].expression)
  const assertion = large.premisesSmt.split('\n').slice(-1)[0]
  expect(assertion).not.toMatch(/p_Z_|p_W_/)
  expect(large.auxiliaryVariables).toEqual([])
})

test('identical arbitrary quotients share a total definition with local guards', () => {
  const result = compile('(a/b=1) v (a/b=2)')
  expect(result.auxiliaryVariables).toHaveLength(1)
  expect(result.premisesSmt).toContain('(or (= b 0) (= (* decision_aux_1 b) a))')
  expect(result.premisesSmt).not.toContain('(assert (not (= b 0)))')
})

test('optimized admissions meets the agreed encoding-size target', () => {
  const result = compile_decision_problem(DECISION_EXAMPLES[6])
  expect(result.variables).toHaveLength(14)
  expect(result.auxiliaryVariables).toEqual([])
  expect(result.counterexampleSmt!.length).toBeLessThan(5000)
  expect(result.causal.queries.length).toBeGreaterThan(14)
})

test('bounded repeated squaring and constant folding handle large exact powers', () => {
  const variable = compile('(x^32)^32=0')
  expect(variable.auxiliaryVariables).toHaveLength(10)
  expect(variable.premisesSmt.length).toBeLessThan(3000)
  const constant = compile(`(${'9'.repeat(100)}^1024)=x`)
  expect(constant.auxiliaryVariables).toHaveLength(10)
  expect(constant.premisesSmt.length).toBeLessThan(5000)
})

test('SMT cost estimates reject exponentially shared trees before serialization', () => {
  const budget = new SmtBudget(2000, ['x'])
  let tree: S = 'x'
  for (let i = 0; i < 30; i++) tree = ['*', tree, tree]
  expect(budget.cost(tree)).toBe(2001)
  expect(() => budget.render(tree)).toThrow(/SMT characters/)
  expect(() => compile('((x^1024)^1024)^1024=0')).toThrow(/SMT expression.*too large|SMT character/)
})

test('fraction normalization falls back safely when denominator growth is excessive', async () => {
  const factors = Array.from({ length: 10 }, () => 'Pr(Y | X)').join('*')
  const result = await solver.decide(compile(`Pr(X)=1/2\nPr(Y | X)=1/2\n${factors}=1/1024`, { graph: 'Z -> X; Z -> Y' }))
  expect(result.status).toBe('sat')
})

test('eight-node dense graph retains all 255 mechanisms and 256 observational rows', () => {
  const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const graph = nodes.flatMap((from, i) => nodes.slice(i + 1).map(to => `${from} -> ${to}`)).join('; ')
  const result = compile('', { graph })
  expect(result.causal.mechanisms).toHaveLength(255)
  expect(result.causal.distributions[0].rows).toHaveLength(256)
  expect(result.variables).toHaveLength(255)
})

test('eight-node decisions return complete witnesses and support new interventions', async () => {
  const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const input = compile(nodes.map(n => `Pr(${n})=1/2`).join('\n'), { graph: nodes.join('; '), regular: true })
  const result = await solver.decide(input)
  expect(result.status).toBe('sat')
  if (result.status !== 'sat') throw new Error('Expected a complete eight-node model.')
  expect(result.witness.distributions[0].rows).toHaveLength(256)
  expect(result.witness.mechanisms).toHaveLength(8)
  expect((await solver.decide(compile('', { graph: nodes.join('; '), regular: true, task: 'entailment', conclusion: '(Pr(H | do(A))=Pr(H)) & (Pr(A | do(A))=1)' }))).status).toBe('entailed')
  expect(() => compile('', { graph: `${nodes.join('; ')}; I` })).toThrow(/At most 8/)
})

// Literal.source is authoritative even when Number(source) underflows to zero.
const tiny = `0.${'0'.repeat(350)}1`
for (const regular of [false, true]) {
  test(`a nonzero decimal underflow is a real countermodel (regular=${regular})`, async () => {
    expect(Number(tiny)).toBe(0)
    const result = await solver.decide(compile(`Pr(X)=${tiny}`, { graph: 'X', regular, task: 'entailment', conclusion: `~(Pr(X)=${tiny})` }))
    expect(result.status).toBe('not-entailed')
    if (result.status !== 'not-entailed') throw new Error('Expected the exact tiny positive countermodel.')
    expect(result.witness.mechanisms[0].value).not.toBe('0.0')
  })
  test(`a nonconstant marginal retains exact underflow negation (regular=${regular})`, async () => {
    const premises = `Pr(Y | X)=${tiny}\nPr(Y | ~X)=${tiny}`
    expect((await solver.decide(compile(premises, { regular, task: 'entailment', conclusion: `~(Pr(Y)=${tiny})` }))).status).toBe('not-entailed')
  })
  test(`contradictory underflow premises remain UNSAT and entail vacuously (regular=${regular})`, async () => {
    const premises = `~(Pr(X)=${tiny})\nPr(X)=${tiny}`
    expect((await solver.decide(compile(premises, { graph: 'X', regular }))).status).toBe('unsat')
    expect((await solver.decide(compile(premises, { graph: 'X', regular, task: 'entailment', conclusion: 'Pr(X)=1/2' }))).status).toBe('entailed')
  })
  test(`underflow control phrasings preserve exact source values (regular=${regular})`, async () => {
    for (const conclusion of [`Pr(X)!=${tiny}`, `~(Pr(X)-${tiny}=0)`]) {
      expect((await solver.decide(compile(`Pr(X)=${tiny}`, { graph: 'X', regular, task: 'entailment', conclusion }))).status).toBe('not-entailed')
    }
  })
  test(`an impossible event can differ from an exact positive underflow (regular=${regular})`, async () => {
    expect((await solver.decide(compile(`~(Pr(X & ~X)=${tiny})`, { graph: 'X', regular }))).status).toBe('sat')
  })
}
test('zero-root and exact-zero spellings retain their distinct semantics', async () => {
  expect((await solver.decide(compile(`Pr(X)=0\n~(Pr(X)=${tiny})`, { graph: 'X' }))).status).toBe('sat')
  const nonregular = compile('', { graph: 'X', task: 'entailment', conclusion: '~(Pr(X)=0.000)' })
  expect(nonregular.conclusionSatisfaction).toEqual(['<', '0', 'p_X_root'])
  expect((await solver.decide(nonregular)).status).toBe('not-entailed')
  const regular = compile('', { graph: 'X', regular: true, task: 'entailment', conclusion: '~(Pr(X)=0.000)' })
  expect(regular.conclusionSatisfaction).toBe(true)
  expect((await solver.decide(regular)).status).toBe('entailed')
})
