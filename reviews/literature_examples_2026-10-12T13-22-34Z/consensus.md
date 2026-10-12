# Consensus debate — 2026-10-12 10:05

## Question
Run the required scoped development-phase consensus review of this completed
DoSAT preset replacement. Use the default Opus 5.5/xhigh and GPT-6.1 Sol/xhigh.
Read the actual completed code, frozen source hashes, tests, independent exact
arithmetic evidence and prepared-package probe. Independently verify that these
seven presets are the requested six literature illustrations plus the unchanged
Simpson case; the supplied causal graphs and premises support every teaching
claim and exact displayed value; task and Regular choices are faithful; and
front-door/instrument examples honestly use explicit Boolean background nodes
without claiming a new latent-variable identification engine. Verify positivity
as non-identification, not undefinedness or an assumed intervention value.
Distinguish a returned-model value from an entailment claim. Inspect the compact
guidance, source links, first default, and clearing after edits/Load/Clear/blank
selection. Check that legacy regression fixtures preserve prior solver and
lifecycle coverage while new tests exercise all new presets and recipes.

Scope ONLY the delta from b59d782 and its integration obligations. Old unrelated
mathematics, compiler, solver, evaluator, packaging and dependency upgrades are
closed except where a current preset depends on their documented behavior.
Do not edit source, publish, push, delete, or use port 5317. Independent targeted
checks are allowed. Coordinate your own dev/test server cleanup; use only strict
5173/4173/5174 and do not run simultaneous browser suites. Do not start recursive
debates, call another model or delegate work to agents.

Give explicit Phase gate: PASS or FAIL. A repair list is FAIL until fixed and
rechecked. Report any material finding with trigger, location, consequence and
a bounded repair/regression; keep optional improvements separate. Return a
compressed report of at most 40,000 output tokens preserving decisive math,
counterexamples, evidence, qualifications and verdict. Write longer material
only into this review folder and return its path.

At your first research action, create your own participant checkpoint file in
this review folder (claude-checkpoints.md or codex-checkpoints.md). Append a
brief six-field checkpoint at least every 15 active minutes until completion:
elapsed time, tentative verdict, genuinely new results, obstruction, next bounded
step and available token/cost figures. Use bounded tranches with a micro-report
before resuming if work might exceed 15 minutes. Also follow the runner-owned
streamed CHECKPOINT schema and literal final VERDICT protocol. Reach consensus
on the completed implementation's phase gate.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 21m 38s (2 turns); Codex: 7m 52s (1 turns); total: 29m 30s

## Agreed answer
# DoSAT literature-example preset replacement: phase review

## Phase gate: **FAIL**

The gate fails on one wrong teaching claim (R1), one first-load status regression (R2) and missing regression tests (R3). Everything else checked out: the preset set, the maths, the Regular choices, the honesty about background nodes, the positivity reasoning, how the guide clears, the legacy fixtures and the package. The phase passes once R1–R3 are fixed, the app is rebuilt and repackaged, and the recheck succeeds.

## 1. Verified (no defect)

### Integrity and scope
- **Hashes:** all 16 hashes in `source-snapshot.json` match the working tree.
- **Core unchanged:** `git diff b59d782` touches none of the eight core files (`causal_syntax`, `causal`, `causal_decision`, `causal_decision_solver`, `causal_model_evaluator`, `causal_evaluation_syntax`, `causal_evaluation_ui`, `z3_integration`). They are byte-identical to the baseline.
- **Prepared package** (`releases/DoSAT-1.0-2026-10-12T13-30-47-782Z-13852b71`):
  - All 8 manifest entries match their sha256 hashes and byte counts, and there is exactly one HTML entry.
  - The bundle embeds the current preset text, so any repair needs a rebuild and a new package.

### Menu composition
- The seven presets are the six requested ones plus Simpson: Berkson, M-bias, instrument bias amplification, treatment–confounder feedback, front-door adjustment and positivity failure.
- Simpson's task, graph, premises, conclusion and Regular setting are identical to the baseline.

### Legacy coverage
- `tests/fixtures/decision_problems.ts` is textually identical to the nine baseline menu entries that were removed.
- The existing end-to-end and unit regressions now load these through JSON Load, with the same inputs and default time-limit settings. Solver and lifecycle coverage are therefore preserved without depending on menu positions.

### Exact arithmetic
All 15 displayed values were recomputed by hand and by Fraction-based Boolean enumeration that imports no application code. The real Z3 path in the app gives exactly the same strings, and each value was checked by strict equality.

| Preset | Task / outcome | Displayed evaluations |
|---|---|---|
| Berkson | SAT | 0; −1/2 |
| M-bias | SAT | 0; 0; −1/24 |
| Instrument amplification | SAT | 1/5; 8/25; 31/80 |
| Treatment–confounder feedback | SAT | 1/2; 17/25; 1/5 |
| Front-door | SAT | 11/20; 7/10; 11/20 |
| Positivity failure | DOES NOT ENTAIL | False |
| Simpson (retained) | ENTAILS | observational 63%/77%; intervention 75%/65% |

Key derivations:
- **Berkson:** P(Y|X∧S)=1/2 and P(Y|¬X∧S)=1, so the difference is −1/2. Unconditionally, X and Y are independent, so the difference is 0.
- **M-bias:** the difference is −1/24 within each Z stratum and also after standardising over Z, while the unadjusted contrast is 0.
- **Feedback:** P(Y|do(A,B))=3/4 and P(Y|do(¬A,¬B))=1/4, a difference of 1/2. The observational rates are 84/100 and 16/100, a difference of 17/25. Standardising by P(L) gives 1/5.
- **Front-door:** the formula gives 11/20, matching the interventional value 11/20; the observational value is 7/10.
- **Simpson:** the observational and interventional rates match the baseline.

Every recipe denominator is positive, so every displayed term is defined.

### Returned-model value versus entailment
- In every SAT preset, the premises fix every mechanism entry, and every parent configuration has positive probability. For Berkson, the four (x, y) cells each have probability 1/4, which forces S's mechanism.
- The premises therefore fix a unique shared kernel (the conditional probability tables) and unique resulting distributions under each intervention. They do not fix a unique structural-noise representation or any coupling across worlds.
- So the displayed values follow from the premises. The SAT run and the evaluator still only report values in the model that was returned, and "Expected in this model" is the accurate wording.

### Positivity is non-identification
- The premises fix P(X)=0 and set the X=false outcome branch to 1/2. They leave the X=true branch t free in [0,1].
- Models with t=0 and t=1 have the same observational distribution but different values of Pr(Y|do(X)).
- Under do(X) the denominator is 1, so the term is defined. In the returned countermodel, Pr(Y|do(X))=1.
- Adding either Pr(Y|do(X))=0 or Pr(Y|do(X))=1 to the premises stays satisfiable. This is non-identification, not undefinedness and not an assumed intervention value.

### Regular choices
- Regular **must** be off for positivity. With Regular on, the premises become inconsistent and entailment would hold vacuously.
- Berkson with Regular on is UNSAT, as its description says.
- Each preset's task and Regular choice is applied faithfully, including the initial Berkson SAT case.

### Background-variable honesty
- In the front-door and instrument examples, U is an explicit Boolean graph node, and the descriptions say so.
- Front-door is presented as illustrating its formula in a specified Boolean kernel, where M mediates the *entire* effect. It explicitly disclaims general latent-variable identification, and no new identification engine is claimed.

### Guide and lifecycle
- Berkson is the first default, with SAT and Regular off. Its guide is visible but collapsed.
- Problem edits, Clear, file Load and selecting the placeholder all hide the guide. Edits in the model evaluator keep it, because the problem is unchanged.
- `.decision-ui [hidden]{display:none !important}` makes the hiding real.
- Content stays within the page at 320, 390 and 1280 px.

### Sources
All links return HTTP 200 and point to the right works:
- Pearl r350 (Berkson; Simpson; front-door in §3.3.2 as a "mediating instrumental variable").
- Hernán–Robins, *What If*.
- Ding–Miratrix, arXiv 1408.0324.
- Pearl, PMLR r8/pearl10b, on bias-amplifying variables.

All numerical data are constructed illustrations, not transcribed empirical data, and the guide is correctly qualified on this point.

### Test status
- The changed UI unit suite passes all 80 tests.
- The stored full Chromium report records 103 expected results, with 0 unexpected and 0 flaky.

## 2. Repair list

### R1: a teaching claim the graph contradicts (blocking)
- **Trigger:** selecting "Treatment–confounder feedback".
- **Location:** `src/causal_decision_examples.ts:55`.
- **Problem:** the description says "L mediates *part* of A's effect". The graph is `A -> L; L -> B; L -> Y; B -> Y`, with no A→Y or A→B edge. Both causal paths from A, A→L→Y and A→L→B→Y, pass through L, so L mediates *all* of A's effect.
- **Quantitative witness:** P(Y|do(A)) − P(Y|do(¬A)) = 54/80 − 26/80 = 7/20. Holding L and B fixed, changing A has no effect in any of the four configurations. The joint-treatment contrast of 1/2 includes B's direct effect and is not A's own effect.
- **Consequence:** the graph does not support a displayed teaching claim, which fails the review's central requirement.
- **Repair:** change the text to something like "Every causal path from A to Y passes through L, which also confounds B's effect." Keep the graph, premises and values unchanged. (The alternative is to add `A -> Y` and recompute every value.)
- **Regression:** assert the intended claim directly. The existing tests compare the guide against the same description object it renders from, so they only show the text is passed through.

### R2: wrong status on first page load (minor integration defect)
- **Location:** `src/causal_decision_ui.ts:264`.
- **Problem:** startup `setExample(0)` calls `invalidate()`. An untouched first page load therefore reads "Input changed; decide the current problem." The baseline showed "Choose a decision problem." This was confirmed in jsdom and in the bundled string.
- **Repair:** set a neutral status after the startup `setExample(0)`.
- **Regression:** a unit test that checks the status on a fresh load.

### R3: guide behaviours with no regression tests
- **Problem:** the unit test covers hiding only after edits and Load. Nothing tests that the initial guide is visible and collapsed, or that it hides after Clear and after selecting the placeholder. These behaviours currently work.
- **Repair:** add those assertions to the existing jsdom lifecycle test.

### Recheck after repair
1. Rebuild and generate a new package. The current package embeds the R1 text.
2. Refresh `source-snapshot.json`.
3. Run a scoped recheck of R1–R3, the unit tests, and a single non-parallel Chromium run on a strict port (5173, 4173 or 5174).

## 3. Optional improvements (not blocking)

- **O1:** the end-to-end test and package probe compare values with `toContainText`/`includes`. A wrong "-1/24" would pass an expected "-1/2", and "1/50" would pass "1/5". Match `.model-evaluation-value` exactly.
- **O2:** the positivity recipe shows only "False", and the panel's help says False can come from an undefined term. Assert that the term table shows a defined Pr(Y|do(X)), or present it as a solver-chosen value different from 1/2.
- **O3:** cite a more canonical source for front-door: Pearl 1995 (*Biometrika*) or *Causality* §3.3.2.
- **O4:** toggling the time limit hides the guide through the inherited `invalidate()`, even though the problem is unchanged.
- **O5:** state the feedback g-formula in the guide: Σ_l P(Y|a,b,l)·P(l|a).

## 4. Evidence and process

The supporting material is in `reviews/literature_examples_2026-10-12T13-22-34Z/`:
- `claude-round1-report.md` and `codex-round1-report.md`
- `claude-preset-check.spec.ts` / `.log` (Z3 run through the app, strict equality)
- `claude-guide-check.spec.ts` / `.log` (guide lifecycle in jsdom)
- `claude-checkpoints.md` and `codex-checkpoints.md`

No source edits, publishing, pushing or deletion took place, and port 5317 was not used. The review's preview server is stopped, and no test processes remain.

## Claude  (verdict: DISAGREE, 21m 12s)
CHECKPOINT
elapsed: ~40 min
tentative_verdict: Phase gate FAIL, with three bounded repairs (R1–R3)
new_results: NEW: All hashes match and the core is unchanged. I recomputed all 15 displayed values and the Simpson rates independently, and the real Z3 path in the app matches each value exactly. Positivity is non-identification rather than undefinedness. One teaching claim is contradicted by its graph (R1). The first page load now shows a wrong status message (R2). Two of the claimed guide-hiding behaviours have no tests (R3).
current_obstruction: none
next_bounded_step: Codex responds; after the repairs, recheck R1–R3, rebuild and repackage
token_cost: unavailable
END CHECKPOINT

## Phase gate: **FAIL**

The maths, the regularity settings and the lifecycle code are sound. Three bounded repairs are still needed. The full report is at `reviews/literature_examples_2026-10-12T13-22-34Z/claude-round1-report.md`, and my checkpoints are in `claude-checkpoints.md`.

### Verified

- **Frozen hashes.** All 16 hashes in `source-snapshot.json` match the working tree. `git diff b59d782` touches no core file.
- **Menu.** The seven presets are the six requested ones plus Simpson. Simpson's task, graph, premises, conclusion and Regular setting are identical to the baseline.
- **Legacy fixtures.** `tests/fixtures/decision_problems.ts` is textually identical to the nine removed baseline menu entries. The old e2e and unit tests now load them through JSON Load, with the same inputs and the default time-limit settings.
- **Hand and script arithmetic.** I checked all 15 values by hand and with my own Fraction enumeration script (no app code). These include:
  - Berkson: P(Y|X∧S)=1/2 and P(Y|¬X∧S)=1, so the difference is −1/2.
  - M-bias: −1/24 in both Z strata, and also when standardised over Z.
  - Feedback: do(A,B)=3/4 and do(¬A,¬B)=1/4. The observational rates are 84/100 and 16/100, a difference of 17/25. The P(L)-standardised value is 1/5.
  - Front-door: 11/20 and 7/10.
  - Simpson: 63/77 observed versus 75/65 under intervention.
- **The displayed values are entailed, not just values in one model.** Every SAT preset states every mechanism entry, and every parent configuration has positive probability. For Berkson the four (x,y) cells each have probability 1/4, which forces S's mechanism. So the model is unique, and "Expected in this model" can never be contradicted by a different returned model.
- **App-level run with real Z3** (my own Node check; `claude-preset-check.spec.ts`/`.log` in the review folder):
  - The statuses are five SAT, one DOES NOT ENTAIL and one ENTAILS.
  - All 15 evaluator outputs are strictly equal to the displayed strings, and every probability term is defined.
- **Positivity.**
  - The countermodel's value for Pr(Y|do(X)) is 1, and it is defined.
  - Adding Pr(Y|do(X))=0 or Pr(Y|do(X))=1 to the premises is satisfiable either way. That is non-identification, not undefinedness or an assumed value.
  - With Regular on, the premises become inconsistent and entailment would hold vacuously, so leaving Regular off is required.
  - Berkson with Regular on is UNSAT, as its description says.
- **Front-door and instrument wording is honest.** U is an explicit graph node, and the descriptions say so; there is no claim of latent-variable identification. Front-door correctly says M mediates the *entire* effect.
- **Guide lifecycle** (jsdom check; `claude-guide-check.spec.ts`/`.log`):
  - Berkson is the first default, with SAT and Regular off, and its guide is visible but collapsed.
  - Clear, selecting the placeholder, Load and problem edits all hide the guide. Edits in Evaluate model keep it.
  - The `.decision-ui [hidden]{display:none !important}` rule makes hiding real.
- **Source links** all return HTTP 200 and the right works:
  - r350 covers Berkson (line 537), Simpson, and front-door in §3.3.2 (as a "mediating instrumental variable").
  - The What If book.
  - arXiv 1408.0324 (Ding–Miratrix).
  - PMLR r8/pearl10b ("On a Class of Bias-Amplifying Variables…").
- **Package.** All 8 manifest entries match their sha256 and byte counts, and there is one HTML entry. The bundle contains the current preset text, so any repair needs a rebuild and a new package.

### Material findings (repair list)

**R1 — wrong teaching claim (blocking).**
- **Trigger:** selecting "Treatment–confounder feedback".
- **Location:** `src/causal_decision_examples.ts:55`.
- **Problem:** the description says "L mediates *part* of A's effect". The graph `A -> L; L -> B; L -> Y; B -> Y` has no A→Y or A→B edge. Both causal paths, A→L→Y and A→L→B→Y, pass through L, so L mediates *all* of A's effect, both observationally and under do(A,B). This breaks the requirement that the graph support every teaching claim.
- **Repair:** reword it, e.g. "Every causal path from A to Y passes through L, which also confounds B's effect". Alternatively, add `A -> Y` and recompute the values.
- **Recheck:** the existing tests read `example.description` and will pick up the new text; then rebuild and repackage.

**R2 — first-load status regression (minor, but part of the first-default integration).**
- **Location:** `src/causal_decision_ui.ts:264`.
- **Problem:** `setExample(0)` calls `invalidate()`. On a fresh page load the status therefore reads "Input changed; decide the current problem." The baseline showed "Choose a decision problem." I confirmed this in jsdom and in the bundled string.
- **Repair:** set a neutral status after the startup `setExample(0)`, and add a unit test that checks the status on a fresh load.

**R3 — missing regression coverage.**
- **Problem:** the review context says guidance hides after Clear and after selecting the placeholder, but the unit test covers only edits and Load. Nothing tests that the initial guide is visible.
- **Repair:** add those three checks to the existing jsdom test. The behaviour is already correct, per my check.

### Optional improvements (not gating)

- **O1:** The e2e test and package probe compare values with `toContainText`/`includes`. A wrong result of "-1/24" would pass an expected "-1/2", and "1/50" would pass "1/5". Use an exact match on `.model-evaluation-value`. My strict-equality check covers the current values.
- **O2:** The positivity recipe only shows "False", and the panel's help text says False can come from an undefined term. Assert that the term table shows a defined Pr(Y|do(X)), or add it as a "solver-chosen, ≠ 1/2" recipe.
- **O3:** A more standard citation for front-door would be Pearl 1995 (Biometrika) or *Causality* §3.3.2.
- **O4:** Toggling the time limit also hides the guide, through the inherited `invalidate`, although the problem hasn't changed.
- **O5:** The feedback guide could state the correct g-formula, Σ_l P(Y|a,b,l)P(l|a), which gives 3/4 − 1/4.

No source edits, publishing, pushing, deletion or use of port 5317. I ran no browser suite or server, and no test processes are left running.

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 7m 52s)
CHECKPOINT
elapsed: ~6 min
tentative_verdict: Phase gate FAIL; agreement with Claude’s repair/recheck plan
new_results: NEW: Independently verified frozen hashes, unchanged fixtures/Simpson, all 15 exact values and defined denominators, and the prepared bundle’s seven runtime outcomes and guidance lifecycle; 80 UI unit tests pass
current_obstruction: R1 teaching error remains; R2 startup wording and R3 regression assertions remain unrepaired
next_bounded_step: Implementation owner repairs R1–R3, refreshes the package, and obtains scoped recheck
token_cost: unavailable
END CHECKPOINT

**Phase gate: FAIL.** I agree with Claude’s conclusion and bounded repair plan. R1 is the decisive material finding; R2 and R3 are smaller integration repairs.

My independent report and evidence are in [codex-round1-report.md](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/literature_examples_2026-10-12T13-22-34Z/codex-round1-report.md).

I independently confirmed:

- All 16 frozen hashes match; the eight named core files match baseline bytes.
- The nine legacy fixtures are textually unchanged. Simpson preserves its graph, premises, conclusion, task and Regular setting.
- Fraction enumeration derived from the actual exported premises reproduces every displayed value, with positive recipe denominators.
- The prepared package’s eight hashes and byte counts match; it has one HTML entry.
- My browser probe of that package produced all seven expected decisions and all 15 results using **strict equality**, and verified containment at 320/390/1280px.
- Initial guidance is visible and collapsed. Edit, Load, Clear and blank selection hide it; evaluator edits preserve it.
- The changed UI unit suite passes all 80 tests. The stored successful full Chromium report records 103 expected results, zero unexpected or flaky results.

The exact values are:

| Preset | Displayed evaluations |
|---|---|
| Berkson | 0; −1/2 |
| M-bias | 0; 0; −1/24 |
| Instrument amplification | 1/5; 8/25; 31/80 |
| Treatment–confounder feedback | 1/2; 17/25; 1/5 |
| Front-door | 11/20; 7/10; 11/20 |
| Positivity failure | False |
| Simpson | Observational 63%/77%; intervention 75%/65% |

The literature links support these constructed illustrations: [Pearl’s overview](https://ftp.cs.ucla.edu/pub/stat_ser/r350.pdf), [Ding–Miratrix](https://arxiv.org/abs/1408.0324), [Pearl on bias amplification](https://proceedings.mlr.press/r8/pearl10b.html), and [Hernán–Robins](https://miguelhernan.org/whatifbook). The explicit Boolean background-node qualifications are honest; the front-door example expressly disclaims general latent-variable identification.

For positivity, the premises fix \(P(X)=0\) and the \(X=false\) outcome branch at \(1/2\), while leaving the \(X=true\) branch \(t\) arbitrary in \([0,1]\). Models with \(t=0\) and \(t=1\) have identical observational distributions but different intervention probabilities. Under \(do(X)\), the denominator is 1. This establishes non-identification through a **defined** probability. Regular off is necessary.

I would sharpen Claude’s “unique model” statement to **unique shared kernel and resulting regime distributions**. These premises do not fix a unique structural-noise representation or cross-world coupling. The five SAT tasks and evaluator outputs remain correctly presented as model results; their displayed values are also mathematically forced by the specified kernels.

The repairs are well bounded:

1. **R1, blocking:** Selecting feedback displays “L mediates part of A’s effect” at `src/causal_decision_examples.ts:55`. Both A-to-Y paths pass through L. My independent calculation gives total A effect \(7/20\), entirely mediated by L. Replace the sentence with Claude’s suggested graph-faithful wording; preserve the graph and numbers. Add an explicit assertion for the intended claim, since comparing guidance against its own description object only checks rendering.
2. **R2, minor:** Startup `setExample(0)` at `src/causal_decision_ui.ts:264` produces “Input changed” before any user edit. Set a neutral startup status and assert it.
3. **R3, coverage:** Add permanent assertions for initially visible collapsed guidance and hiding after Clear/blank selection. These behaviors currently work.

Exact-match recipe assertions and an explicit positivity-definedness assertion remain useful nonblocking improvements. My independent probe establishes the current results despite the existing substring comparisons.

No additional material finding emerged. No source changes or publication actions occurred. My strict-port preview server is stopped; no review test processes remain.

VERDICT: AGREE

## Claude  (verdict: AGREE, 25s)
CHECKPOINT
elapsed: ~50 min
tentative_verdict: Phase gate FAIL, with repairs R1–R3; Codex and I agree
new_results: NEW: Codex's total-effect figure checks out: 7/20 for A, all of it through L (my arithmetic: 54/80 − 26/80). I accept Codex's narrower uniqueness wording and its point that the R1 regression test should assert the intended claim directly.
current_obstruction: none
next_bounded_step: done. Once the repairs are made, recheck R1–R3, rebuild, repackage and refresh the frozen hashes.
token_cost: unavailable
END CHECKPOINT

## Phase gate: **FAIL**

Codex and I have reached consensus on the gate and on the three repairs. Codex's report reached the same findings independently. Its browser probe of the prepared package used strict equality and confirmed all 7 decisions and all 15 values; my own check in the app with Z3 agrees.

**Codex refinements I accept:**

1. **"Unique model" is too strong.** What the premises fix uniquely is the shared kernel (the conditional probability tables) and the distributions it produces under each intervention. They do not fix the underlying noise representation or any coupling across worlds. The displayed values follow from the premises; the SAT run and the evaluator still only report values in the returned model, and the guide's "Expected in this model" wording is accurate.
2. **R1 has a quantitative witness.** Intervening on A changes Y by P(Y|do(A)) − P(Y|do(¬A)) = 54/80 − 26/80 = 7/20, which I recomputed. Holding L and B fixed, changing A has no effect in any of the four configurations, so all of A's effect runs through L. The joint-treatment contrast of 1/2 also includes B's direct effect and should not be read as A's own effect.
3. **R1's regression test must check the claim itself.** The current tests compare the guide against the same description object it renders from, so they only show that the text is transported. The new assertion should check the intended statement directly.

**Repair list:**

- **R1 (blocking).**
  - **Location:** `src/causal_decision_examples.ts:55`.
  - **Problem:** the feedback guide says "L mediates part of A's effect", but every path from A to Y passes through L.
  - **Fix:** reword to "Every causal path from A to Y passes through L, which also confounds B's effect." Keep the graph, premises and values unchanged.
- **R2 (minor).**
  - **Location:** `src/causal_decision_ui.ts:264`.
  - **Problem:** an untouched first page load says "Input changed; decide the current problem."
  - **Fix:** show a neutral status at startup, and add a test that asserts it.
- **R3 (coverage).** Add permanent tests that the initial guide is visible and collapsed, and that it hides after Clear and after choosing the blank menu entry. All of these already work correctly.
- **Recheck.** Rebuild, make a new package, refresh `source-snapshot.json`, and run a scoped recheck.

**Optional, not blocking:**

- **O1:** check evaluation results by exact match rather than substring.
- **O2:** assert directly that Pr(Y|do(X)) is defined in the positivity countermodel.
- **O3:** cite a more canonical source for front-door.
- **O4:** toggling the time limit currently hides the guide even though the problem is unchanged.
- **O5:** state the g-formula in the feedback guide.

My evidence is in the review folder: `claude-round1-report.md`, `claude-preset-check.spec.ts`/`.log`, `claude-guide-check.spec.ts`/`.log` and `claude-checkpoints.md`. No review processes or servers are still running.

VERDICT: AGREE

