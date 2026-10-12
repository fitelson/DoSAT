/** Historical regression inputs; these are not public menu presets. */
export const legacyDecisionExamples = [
  { name: 'Observation differs from intervention', task: 'entailment', graph: 'Z -> X; Z -> Y', premises: 'Pr(Z) = 1/2\nPr(X | Z) = 3/4\nPr(X | ~Z) = 1/4\nPr(Y <-> Z) = 1', conclusion: 'Pr(Y | do(X)) = 1/2', regular: false },
  { name: 'An incorrect intervention claim', task: 'entailment', graph: 'Z -> X; Z -> Y', premises: 'Pr(Z) = 1/2\nPr(X | Z) = 3/4\nPr(X | ~Z) = 1/4\nPr(Y <-> Z) = 1', conclusion: 'Pr(Y | do(X)) = 3/4', regular: false },
  { name: 'Undefined conditioning prevents entailment', task: 'entailment', graph: 'A; B', premises: 'Pr(B) = 0', conclusion: 'Pr(A | B) = 0', regular: false },
  { name: 'Do-calculus exchange with positive support', task: 'entailment', graph: 'Z -> Y', premises: 'Pr(Z) > 0', conclusion: 'Pr(Y | do(Z)) = Pr(Y | Z)', regular: false },
  { name: 'Inconsistent premises', task: 'entailment', graph: 'A', premises: 'Pr(A) = 0\nPr(A) = 1', conclusion: 'Pr(A) = 1/2', regular: false },
  { name: 'A compatible intervened model', task: 'satisfiability', graph: 'X -> Y', premises: 'Pr(X) = 0\nPr(Y) = 0\nPr(Y | do(X)) = 1', conclusion: '', regular: false },
  { name: 'Impossible constraints', task: 'satisfiability', graph: 'A', premises: 'Pr(A) > 1', conclusion: '', regular: false },
  { name: 'Simpson’s paradox: treatment and recovery', task: 'entailment', graph: 'Z -> X; Z -> Y; X -> Y', premises: 'Pr(Z) = 1/2\nPr(X | Z) = 9/10\nPr(X | ~Z) = 1/10\nPr(Y | X & Z) = 3/5\nPr(Y | ~X & Z) = 1/2\nPr(Y | X & ~Z) = 9/10\nPr(Y | ~X & ~Z) = 4/5', conclusion: '(Pr(Y | X) < Pr(Y | ~X)) & (Pr(Y | do(X)) > Pr(Y | do(~X)))', regular: true },
  { name: 'Back-door adjustment identity', task: 'entailment', graph: 'Z -> X; Z -> Y; X -> Y', premises: '', conclusion: 'Pr(Y | do(X)) = Pr(Y | X & Z)*Pr(Z) + Pr(Y | X & ~Z)*Pr(~Z)', regular: true },
] as const

export const savedDecisionFixture = (index: number) => {
  const example = legacyDecisionExamples[index]
  if (!example) throw new Error("Unknown regression fixture")
  return { version: 1, kind: "DoSAT-decision", task: example.task, graph: example.graph, premises: example.premises, conclusion: example.conclusion, regular: example.regular, mode: "complete", seconds: 30 }
}
