# Consensus debate — 2026-10-12 10:25

## Question
Perform the required scoped repair recheck of the DoSAT literature-example
candidate. The initial default-model consensus is ../consensus.md; the R1–R3
repair agreement is settled. Review ONLY those repairs and optional O1/O2
regression improvements, with their integration. The original numerical
illustrations, graphs, every displayed exact value, explicit Boolean background
qualifications, unchanged Simpson, legacy regression fixtures, and existing
compiler/solver/evaluator mathematics are CLOSED approved reference material.
Do not repeat the broad audit or prove every value again.

Read REPAIRS.md, current actual source/tests, frozen source-snapshot.json,
release-manifest.json, package-probe.json, and the captured unit results.
Verify R1's precise all-paths-through-L wording against the unchanged graph and
its independent literal regression. Verify R2's neutral initial status and test
capture BEFORE fixtures load. Verify R3's visible/collapsed fresh guide and
explicit Clear/placeholder/edit/Load coverage. Verify exact primary-value
equality and the positivity term's definedness assertion. Confirm the refreshed
bundle and source hashes and that numerical/backend files remain unchanged.
Keep the captured unchanged-evaluator WASM unit failure and subsequent isolated
and full passing reruns as a documented qualification; do not invent a cause or
open an unrelated runtime-repair project. If it materially blocks THIS delta,
explain a concrete connection and bounded current-phase check.

No source edits, push, publication, deletion, port 5317, recursive debates, other
model calls or delegation. Independent targeted checks are allowed; use strict
5173/4173/5174 only and clean up owned test servers. Return explicit Phase gate:
PASS or FAIL, with bounded material findings if any. Agreement on unresolved
repairs is FAIL. Both participants and synthesis must return a compressed report
of at most 40,000 output tokens preserving decisive evidence and qualifications.
Longer supporting material may go only in this review folder with its path.
At your first action create a participant checkpoint file here and append the
six fields at least every 15 active minutes: elapsed, tentative verdict, new
results, obstruction, next bounded step, token/cost figures. Use bounded tranches
and emit micro-reports before resuming if needed; follow the runner's streamed
CHECKPOINT and literal final VERDICT protocol. Reach consensus on the repaired
phase gate using the default Opus 5.5/xhigh and GPT-6.1 Sol/xhigh models.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 4m 15s (1 turns); Codex: 4m 51s (1 turns); total: 9m 05s

## Agreed answer
# DoSAT literature-example candidate: repair recheck

## Phase gate: **PASS**

R1–R3 are fixed and covered by tests, and O1 and O2 are built in. No numbers, graphs, premises or backend files changed. There are no material findings.

## R1: new wording for treatment–confounder feedback

- **The text** (`src/causal_decision_examples.ts:55`) now reads: "Every causal path from A to Y passes through L, which also confounds B's effect."
- **It matches the graph, which is unchanged:** `A -> L; L -> B; L -> Y; B -> Y`.
  - A has exactly two directed paths to Y: A→L→Y and A→L→B→Y. Both pass through L.
  - L causes both B and Y, so it confounds B's effect.
- **Premises and values are unchanged.** The three displayed values are still 1/2, 17/25 and 1/5. Comparing the preset exports shows that only this example's description changed.
- **The test checks against literal strings, not the example's data.** The menu test in `src/causal_decision_ui.spec.ts` selects example index 3, then checks that:
  - the graph is the literal string `'A -> L; L -> B; L -> Y; B -> Y'`;
  - the guide contains "Every causal path from A to Y passes through L";
  - the guide does not contain "part of A".
- **The built bundle has the new phrase once** and the old "mediates part" wording zero times.

## R2: neutral status when the page first loads

- **The fix** (`src/causal_decision_ui.ts:264–265`): the code loads the first preset with `setExample(0)`, then sets the status to `'Choose a decision problem.'`.
- **Nothing overwrites it afterwards.**
  - `refresh()` and the Z3-ready handler never write the status.
  - The busy callback only rewrites the "waiting for model evaluation" message.
- **The test records the status before any old test data loads.** In `beforeEach` the order is: import the module, `flush()`, record the problem state and what is displayed, and only then load `savedDecisionFixture(0)`.
  - The first test requires the status to be exactly `'Choose a decision problem.'`.
  - Without the reset on line 265, the status would read "Input changed; decide the current problem.", so the test would catch a regression.
- **The packaged app shows the same status in a real browser.** The package probe checks the exact status after "Z3 ready." on all 21 page loads.

## R3: guide on first load, and when it hides

- **First load:** the unit test checks the guide is visible and collapsed. In packaged Chromium at 1280, 390 and 320 px, `isVisible()` is true and there is no `open` attribute.
- **When it hides:** the lifecycle test re-selects an example before each step and checks the guide hides after:
  - a premise edit;
  - Clear;
  - choosing the placeholder entry;
  - Load.
- **Scope of the stored package probe:** it re-checks the first-load state, the placeholder and Clear in the built bundle. Hiding after an edit or Load is covered by the unit tests, which is what R3 required.
  - A separate check against the built package also confirmed the edit and Load cases at all three widths.
- **One overstatement in REPAIRS.md (not material):** it says the refreshed package probe "covers the same cases". The stored probe covers only first load, Clear and placeholder.

## O1: exact match on the displayed value

- **Both checks now need the whole value to match.** The browser test uses `toHaveText(expected)` on `.model-evaluation-value`, and the package probe uses `textContent === value`.
- **A wrong value that starts with the right digits can no longer pass.** The formatter outputs only `n/d` with nothing after it, so "-1/24" cannot pass for "-1/2" and "1/50" cannot pass for "1/5".
- **An old result left on screen cannot pass either.** Changing the input clears the output area (`invalidate` → `output.replaceChildren()`), so a repeated value such as M-bias's two "0"s has to be newly computed.

## O2: the positivity result is a real value

- **What the test checks:** the probability-term table is visible, has exactly one `tbody` row, and contains no "undefined" marker.
- **The "no undefined" check would catch a real problem.** When a term is undefined, the app displays "undefined (zero denominator)" (`causal_evaluation_ui.ts:97,115`), and the test would fail on that text.
- **So the "False" result is a real counterexample.** The query is a single equality whose only term is defined, so its value in the model differs from 1/2. It is not an effect of the guard against undefined terms.

## Hashes, unchanged backend, and the package

- **Source hashes:** all 16 hashes in `source-snapshot.json` match the working tree (8 changed source files and 8 core files).
  - Since the first candidate, only four files changed: the examples file, the UI module, the UI spec and the literature-examples spec.
- **Backend unchanged:** `git diff b59d782` is empty for:
  - `causal_syntax`
  - `causal`
  - `causal_decision`
  - `causal_decision_solver`
  - `causal_model_evaluator`
  - `causal_evaluation_syntax`
  - `causal_evaluation_ui`
  - `z3_integration`
  - `pr_sat`
  - `parser`
- **The package** (`releases/DoSAT-1.0-2026-10-12T14-09-05-409Z-ae1cbaaf`):
  - All 8 manifest entries match their sha256 hashes and byte counts.
  - The manifest inside the package is identical to the copy in the review folder.
  - `index.html` references `dosat-oqa7zYuo.js` and `dosat-Clc5QVqf.css`, which are identical to the files in `dist/`.
- **Rebuilt from current source:** separate rebuilds into a temporary folder produced HTML, JS and CSS byte-for-byte identical to the package.
- **Probe inputs:** `presets.json` is identical to the current `DECISION_EXAMPLES`. `package-probe.json` reports 21 cases and 45 exact comparisons, all passing with no errors.

## Test status

| Check | Result |
|---|---|
| UI unit spec (rerun) | 80/80 passed |
| Full unit suite (stored result and independent rerun) | 1,318 passed, 1 skipped, 1 todo (all inherited) |
| Evaluator spec on its own (stored) | 57/57 passed |
| Complete Chromium suite (stored report) | 103 passed; 0 unexpected, 0 flaky |
| Literature + decision Chromium specs (rerun on port 5174) | 54/54 passed |
| Package probe | 21 cases, 45 exact comparisons, all passed |
| TypeScript, lint, build, whitespace | passed |

## Qualification: one earlier WASM unit-test failure

- **What happened:** during the repair stage, one full unit run hit an uncaught WebAssembly "memory access out of bounds" error in the unchanged `causal_model_evaluator.spec.ts`. Async-call failures followed (26 failed, 1,292 passed).
- **What followed:** that spec then passed on its own (57/57). The full suite then passed cleanly, and passed again in an independent rerun.
- **Cause:** not established.
- **No concrete link to this change:**
  - The evaluator spec imports only `z3-solver` and unchanged core modules, and the evaluator itself is byte-identical to baseline.
  - The changed UI spec mocks `z3_integration`, so it never runs WASM.
- It is recorded as a qualification and does not block the gate. No runtime repair is opened in this phase.

## Not done, and not required

- Optional items O3–O5 are still unaddressed.
- There were no source edits, pushes, publication or deletions.
- Port 5317 was not touched. All test servers on 5173, 4173 and 5174 have been stopped.

Supporting evidence is in `reviews/literature_examples_2026-10-12T13-22-34Z/recheck_2026-10-12T14-08-02Z/` (`codex-recheck-review.md`, `claude-recheck-checkpoints.md`, `claude-recheck-chromium.log`).

## Claude  (verdict: AGREE, 4m 15s)
CHECKPOINT
elapsed: about 18 minutes
tentative_verdict: Phase gate PASS. R1–R3 are repaired, O1 and O2 are integrated, and there are no material findings.
new_results: NEW: All 16 snapshot hashes match the working tree, and the 8 core files are byte-identical to b59d782. A rebuild into a temp folder reproduces the packaged JS, CSS and HTML byte for byte. All 8 manifest hashes match. I reran the UI unit spec (80/80), the full unit suite (1,318 passed, 1 skipped, 1 todo) and the literature and decision Chromium specs (54/54, on port 5174). The stored report shows 103/103. The evaluator spec imports none of the changed files.
current_obstruction: none
next_bounded_step: done; waiting for Codex's independent review
token_cost: unavailable
END CHECKPOINT

## Phase gate: **PASS**

All three required repairs and both optional improvements are in place and covered by tests. No numbers, graphs, premises or backend files changed. My checkpoints are in `recheck_2026-10-12T14-08-02Z/claude-recheck-checkpoints.md` and my browser run log is `claude-recheck-chromium.log`.

### R1: new wording for treatment–confounder feedback
- **Text** (`src/causal_decision_examples.ts:55`): "Every causal path from A to Y passes through L, which also confounds B's effect."
- **It matches the graph.** The graph is `A -> L; L -> B; L -> Y; B -> Y`, so A has exactly two paths to Y: A→L→Y and A→L→B→Y. Both pass through L.
  - L is a common cause of B and Y (L→B and L→Y), so it does confound B's effect.
  - The graph, premises and the three values (1/2, 17/25, 1/5) are unchanged.
- **The regression is independent of the data object** (`src/causal_decision_ui.spec.ts`, menu test). It selects index 3, then asserts:
  - the graph is the literal string `'A -> L; L -> B; L -> Y; B -> Y'`;
  - the guide contains the literal phrase "Every causal path from A to Y passes through L";
  - the guide does not contain "part of A".
- **The package carries the new text.** The bundle contains the new phrase once and the old "mediates part" text zero times.

### R2: neutral status on first load
- **Fix** (`src/causal_decision_ui.ts:264–265`): `setExample(0)` runs first, then the status is set to `'Choose a decision problem.'`.
- **Nothing overwrites it afterwards.**
  - `refresh()` and the Z3-ready handler never write the status.
  - The busy callback only rewrites the "waiting for model evaluation" message.
- **The test captures the status before any fixture loads.** In `beforeEach`, the order is: import the module, then `flush()`, then capture the problem state and presentation, and only then load `savedDecisionFixture(0)`.
  - The first test asserts the status is exactly `'Choose a decision problem.'`.
  - Without the line-265 reset, the status would read "Input changed; decide the current problem." (the defect confirmed in round 1), and this assertion would fail.
- **It also holds in the real browser.** The package probe asserts the exact status after "Z3 ready." on all 21 page loads.

### R3: fresh guide and lifecycle coverage
- **Fresh load:** the unit test checks the guide is not hidden and not open. The package probe confirms `isVisible() === true` and no `open` attribute in real Chromium at 1280, 390 and 320 px.
- **Lifecycle:** the test steps through select → premise edit (hidden) → reselect → Clear (hidden) → reselect → placeholder (hidden) → reselect → Load (hidden).
- **Probe:** it repeats the placeholder and Clear checks in the built bundle.

### O1: exact equality on the displayed value
- **The tests now require an exact match.**
  - The e2e test uses `toHaveText(expected)` on `.model-evaluation-value`, which requires the full text, not a substring.
  - The probe uses `textContent === value`.
- **Wrong values can no longer pass.** The formatter emits only `n/d` with no decimal suffix, so "-1/24" can no longer pass for "-1/2", nor "1/50" for "1/5".
- **A stale result cannot pass either.** For example, M-bias shows "0" twice in a row. Filling the input fires `invalidate`, which runs `output.replaceChildren()`, so the old result is gone before the new one appears.

### O2: the positivity term is defined
- **What is asserted:** the term table is visible, has exactly one `tbody` row, and does not contain the text "undefined".
- **The negative check is meaningful.** The app's own marker for an undefined term is the lowercase "undefined (zero denominator)" (`causal_evaluation_ui.ts:97,115`), which the check would catch.
- **So "False" is a real countermodel value.** It is a single equality and its one term is defined, so the countermodel value differs from 1/2. It cannot be a definedness-guard artefact.

### Bundle, hashes and unchanged backend
- **Source hashes:** all 8 source and 8 core hashes in `source-snapshot.json` match. Compared with the first candidate, only four files changed: examples, UI, UI spec and literature spec.
- **No backend changes:** `git diff b59d782` over `causal_syntax`, `causal`, `causal_decision`, `causal_decision_solver`, `causal_model_evaluator`, `causal_evaluation_syntax`, `causal_evaluation_ui`, `z3_integration`, `pr_sat` and `parser` is empty.
- **Package** (`releases/DoSAT-1.0-2026-10-12T14-09-05-409Z-ae1cbaaf`):
  - All 8 manifest entries match their sha256 hashes and byte counts.
  - The manifest inside the package is identical to the one in the review folder.
  - `index.html` references `dosat-oqa7zYuo.js` and `dosat-Clc5QVqf.css`, and these are identical to the files in `dist/`.
- **Rebuild check:** an independent `vite build` into `/tmp` gives sha256 `704c691b…`, `39105252…` and `0e7494bf…`, the same as the package. The package therefore comes from the current source.
- **Probe inputs:** `presets.json` is identical to the current `DECISION_EXAMPLES` (checked by JSON comparison), and `package-probe.json` reports 21 cases and 45 evaluations, all passing with no errors.

### Test status
- **My reruns:**
  - UI unit spec: 80/80 passed.
  - Full unit suite: 33 files, 1,318 passed, 1 skipped, 1 todo.
  - Chromium literature and decision specs: 54/54 passed on port 5174. The server stopped afterwards, and nothing is listening on 5173, 4173 or 5174.
- **Stored recheck report:** 103 total, 103 expected, 0 unexpected, 0 flaky.

### The WASM unit failure (documented, not blocking)
- **No concrete connection to this delta.**
  - `causal_model_evaluator.spec.ts` imports only `z3-solver` and unchanged core modules (`causal`, `causal_syntax`, `causal_model_evaluator`, `causal_decision_solver` types), and the evaluator itself is byte-identical.
  - The changed UI spec mocks `z3_integration`, so it never runs WASM.
  - The evaluator spec passed on its own (57/57), and the full suite then passed twice: the stored rerun plus my own clean run.
- **Cause:** not established. It stays recorded as a qualification and does not block the gate.

### Non-material notes
- **REPAIRS.md wording:** it says "the refreshed package probe covers the same cases". The probe covers the fresh visible and collapsed state, the placeholder and Clear. Hiding after edits and after Load is tested only in jsdom, which is what R3 required.
- **Optional items still open:** O3–O5 are unaddressed, as permitted.

No source edits, push, publication or deletion took place. I did not touch port 5317 (a separate, pre-existing listener). My temporary outputs are only in `/tmp/claude-*`, plus two new files in this review folder: the checkpoints file and the browser run log.

VERDICT: AGREE

## Codex  (verdict: AGREE, 4m 51s)
CHECKPOINT
elapsed: about 4 minutes
tentative_verdict: Phase gate PASS; agreement with Claude
new_results: NEW: Independently verified frozen hashes, unchanged core and numerical data, reproducible package assets, 80 passing UI tests, 21 package cases with 45 exact comparisons, and guide lifecycle at three widths.
current_obstruction: none; documented WASM incident remains qualified
next_bounded_step: done; owned preview server stopped
token_cost: unavailable
END CHECKPOINT

**Phase gate: PASS.** I endorse Claude’s conclusion. No material findings remain within this repair scope.

- **R1:** The actual wording matches the unchanged graph. Its two directed A-to-Y paths, A→L→Y and A→L→B→Y, both pass through L; L also causes B and Y. The permanent regression independently anchors the literal graph and all-paths wording.
- **R2:** Startup resets the status to exactly “Choose a decision problem.” The test captures the fresh presentation after module initialization **before loading legacy fixtures**. Package checks confirm the message persists after Z3 readiness.
- **R3:** Tests explicitly assert initially visible, collapsed guidance and hiding after edit, Clear, placeholder selection and Load. My independent package checks confirm all these behaviors at 1280, 390 and 320 px.
- **O1/O2:** Comparisons target the primary `.model-evaluation-value` with exact equality. Positivity additionally requires a visible, one-row probability-term table with no undefined marker, establishing a defined False result.

All 16 frozen source hashes match. The eight named core files, plus parser and probability compiler, remain byte-identical to baseline. Comparing preset exports finds only feedback’s description changed. All eight release-manifest hashes and byte counts match; an independent rebuild reproduces the packaged HTML, JavaScript and CSS exactly.

My targeted checks passed: **80 UI tests**, **21 package cases / 45 evaluations**, and the three-width lifecycle checks. Captured results confirm **57 isolated evaluator tests**, **1,318 full unit tests** with one inherited skip and todo, and **103 expected Chromium results**, with zero unexpected or flaky results.

The WASM incident remains documented: one full attempt had memory-access and subsequent async failures (**26 failed, 1,292 passed**), followed by isolated and full passing reruns. Its cause is unknown. The evaluator and dependencies are unchanged; its spec imports none of the changed files, while the UI spec mocks native components. There is no concrete connection requiring a repair within this delta.

I agree with Claude’s documentation clarification: the stored package probe covers fresh state, Clear and placeholder; edit and Load are covered by permanent unit tests. My additional package check confirms those two cases too.

Evidence is in [codex-recheck-review.md](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/literature_examples_2026-10-12T13-22-34Z/recheck_2026-10-12T14-08-02Z/codex-recheck-review.md). No source edits or publication actions occurred; owned servers are stopped.

VERDICT: AGREE

