# Scoped repair candidate

The initial default-model consensus gave Phase gate FAIL, with R1–R3 as the
bounded repairs. All numerical values, the supplied kernels, unchanged Simpson
and regression fixtures, explicit-background-variable scope, and package
structure were approved. See ../consensus.md.

- **R1:** feedback now says “Every causal path from A to Y passes through L,
  which also confounds B’s effect.” Its graph, premises and values are unchanged.
  The UI regression independently anchors both that graph and the intended
  phrase rather than comparing the rendered text only to its data object.
- **R2:** startup restores the neutral “Choose a decision problem.” after loading
  the initial Berkson preset. The test captures the fresh module's presentation
  before loading any legacy regression fixture and checks the exact status.
- **R3:** fresh guidance is checked visible and collapsed. The existing lifecycle
  test now explicitly checks hiding after Clear and placeholder selection, as
  well as edits and Load. The refreshed package probe covers the same cases.
- **O1:** all recipe comparisons in the new browser suite and package probe use
  exact equality on the primary .model-evaluation-value element, preventing
  numeric-prefix false positives.
- **O2:** the positivity probe asserts that its probability-term table is visible,
  has the one queried term, and contains no undefined marker. Its False result
  therefore demonstrates a defined countermodel value, not undefinedness.

No numerical premise, query recipe or expected value changed. The parser,
compiler, decision solver and exact evaluator remain byte-identical to baseline.
No new feature, latent-variable support, dependency or publication change.

Current checks: UI units 80 PASS; complete units 1,318 PASS (one inherited skip
and todo); complete Chromium 103 PASS; TypeScript/lint/build/whitespace PASS.
Independent arithmetic audit again checks all seven kernels, every premise,
all 15 displayed values, positivity's two different effects with identical
observations, and retained Simpson rates. The new eight-file package is
releases/DoSAT-1.0-2026-10-12T14-09-05-409Z-ae1cbaaf. The source snapshot and
manifest are preserved here; package-probe.json records the rebuilt app.

One repair-stage full unit attempt had an uncaught WebAssembly “memory access
out of bounds” in the unchanged causal_model_evaluator.spec.ts, followed by
async-call failures (26 failed, 1,292 passed). Its 57 tests then passed in a fresh
isolated run, followed by a clean complete 1,318-test run. See evaluator-isolated.log
and unit-rerun.log. The cause was not established; no evaluator/runtime source
was changed. The first candidate's full run and all browser checks also passed.
This qualification is preserved rather than attributed to an unverified cause.
