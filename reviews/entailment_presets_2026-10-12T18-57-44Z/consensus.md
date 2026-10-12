# Consensus debate — 2026-10-12 15:46

## Question
Perform the required scoped DoSAT phase audit of the completed explicit-
entailment preset update and the user-supplied E/M/A Simpson replacement.
Baseline 55ff015823aec68673d1480c25f771b2abfae2f7. Read CONCLUSIONS.md,
VERIFICATION.md, source-snapshot.json, presets.json, package-probe.json and the
actual five changed source/test files. Review only this delta and its direct
integration. Do not reopen unrelated older compiler/solver/evaluator mathematics.

Check that the first five active conclusions correctly express the causal
phenomena, are defined, and are ENTAILED by every compatible kernel, not just
true in one witness. The old first-five graphs/premises/regularity/values are
byte-for-byte preserved; their numerical illustrations are closed approved
reference material. Verify the new comparative/equality claims and the kernel-
uniqueness justification. The instrument conclusion fixes eight individual risks
which entail the intended contrast ordering. Front-door formally checks only the
two exact intervention/observational probabilities; the full formula is retained
as an optional independently checked model-evaluation recipe, not formally
asserted as an identity in the conclusion. These reductions repair observed
resource failures of the preliminary long symbolic conclusions. Read the
preserved logs and CONCLUSIONS.md resource note; verify final responsiveness. Check optional evaluation guidance and actual browser
SAT inspection after ENTAILS (which returns no witness), default startup and
visible conclusion, and Save/Load preservation. Positivity is unchanged and
should DOES NOT ENTAIL. Check that the new Simpson variables/fractions reproduce
the supplied table and that the reversal concerns M versus A stratified by E.
The DAG is an explicit additional assumption, not inferred from the counts;
its intervened values are 19/40 and 21/40. Verify all cell/marginal arithmetic,
the compound conclusion, retained historical fixtures and responsive containment.

Compiler, solver, evaluator, parser and probability compiler are unchanged.
The captured first full unit run failed in two unchanged native solver tests
following a WASM memory-access exception; isolated 63 solver tests and the fresh
full suite pass. Preserve this qualification and its unknown cause. The prior
release also recorded intermittent unchanged WASM test failures. Do not invent
a causal diagnosis or start an unrelated backend repair project. If this blocks
THIS delta, identify its concrete connection and a bounded check.

Do not edit production source, push, upload, delete, use port 5317, call any other
model, delegate or invoke another debate. Independent checks are allowed; use
strict 5173/4173/5174 only and stop any owned servers. Output explicit Phase gate:
PASS or FAIL; unresolved material findings keep the gate FAIL. Both participants
and synthesis must return compressed reports of at most 40,000 output tokens,
preserving decisive evidence, qualifications and verdicts. Longer material may
go only in this review directory with its path. As your first action create a
participant checkpoint file here; append a six-field checkpoint at least every
15 active minutes: elapsed, tentative_verdict, new_results, current_obstruction,
next_bounded_step, token_cost (unavailable if unknown). Scope short bounded
checks and end a tranche with its checkpoint if work exceeds 15 minutes.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 15m 01s (2 turns); Codex: 7m 28s (1 turns); total: 22m 29s

## Agreed answer
# DoSAT phase audit: explicit-entailment presets and the E/M/A Simpson replacement

**Phase gate: PASS.** The audit found no unresolved material problems in this delta. Production source was not edited and nothing was published. The preview servers used for the audit were stopped, and ports 4173, 5173 and 5174 are free.

Evidence is in `reviews/entailment_presets_2026-10-12T18-57-44Z/`. That directory holds the checkpoint files, `codex-audit.md`, the browser probe scripts and their outputs (`claude-timing.mjs/.json`, `claude-extra.mjs/.json`), and the preserved failure logs.

## 1. The changes match the frozen snapshot

- **Hashes.** The five changed source/test files, the ten unchanged core files (compiler, solver, evaluator, parser, probability compiler) and the eight files of the prepared package all match `source-snapshot.json` by sha256.
- **Diff size.** Against 55ff015, the git diff touches only the five files (67 lines added, 30 removed).
- **Field-by-field comparison** of the baseline and current `DECISION_EXAMPLES`:
  - **First five presets:** only `task`, `conclusion` and `expectedStatus` changed. Graphs, premises, `regular`, descriptions, sources and evaluation recipes are byte-identical.
  - **Positivity:** identical to the baseline.
  - **Simpson:** the name, graph, premises, conclusion and description changed, and `dataNote` was added.
- **Exported data.** `presets.json` matches the source array.
- **Built bundle.** `dist/index.html` and the `dosat-8gDyIqcQ.js` bundle match the release package. The bundle contains the new conclusions and guide text.

## 2. The first five conclusions hold in every compatible model

**Why the model is unique.** In each preset, the premises fix every root probability and the conditional probability for every full combination of parent values:

| Preset | Conditionals fixed by the premises |
|---|---|
| M-bias | X\|U, Y\|V, Z\|U,V |
| Instrument | X\|U,Z, Y\|X,U |
| Treatment–confounder feedback | L\|A, B\|L, Y\|B,L |
| Front-door | X\|U, M\|X, Y\|M,U |
| Simpson | M\|E, A\|M,E |

- **Regular presets.** Every specified value lies strictly between 0 and 1. So every full assignment, and every parent context, has positive probability. Each premise conditional therefore equals its kernel parameter, which makes the kernel unique. Truncated factorization then fixes every do-quantity.
- **Berkson (not regular).** X and Y are independent roots at 1/2, so each of the four X/Y contexts has probability 1/4. The premise `Pr(S <-> (X v Y)) = 1` then forces S's deterministic mechanism in every context. That fixes the model, including all intervention probabilities.

**No verdict is vacuous.** Every conditioning event in every conclusion has positive probability in the unique model, so every term is defined. The UI shows "ENTAILS —" only after it has found the premises satisfiable; inconsistent premises take a separate INCONSISTENT PREMISES path.

**Exact values, from independent Fraction enumeration:**

| Preset | Exact values | Conclusion |
|---|---|---|
| Berkson | causal difference 0; selected difference −1/2 | entailed ✓ |
| M-bias | causal difference 0, marginal difference 0; conditioning on Z gives −1/24 | entailed ✓ |
| Instrument | eight risks: 3/5, 2/5, 33/50, 17/50, 51/80, 1/4, 3/4, 29/80 | entailed ✓ |
| Treatment–confounder feedback | observational 17/25 > interventional 1/2 > L-standardized 1/5 | entailed ✓ |
| Front-door | Pr(Y\|do(X)) = 11/20; Pr(Y\|X) = 7/10 | entailed ✓ |

**Instrument.** The eight risks give:
- a causal difference of 1/5 and an observational difference of 8/25;
- a difference of 31/80 in both Z strata. The Z-standardized difference is therefore 31/80 whatever Pr(Z) is.

So 1/5 < 8/25 < 31/80. The two biases are 3/25 and 3/16, both positive, so the ordering also shows that the absolute bias is amplified. Fixing eight individual risks, rather than writing weighted adjustment expressions, is what avoids products of conditional denominators.

**Front-door.** The formal conclusion asserts only the two probabilities, 11/20 and 7/10. The full front-door formula is kept as an optional model-evaluation recipe and independently evaluates to 11/20. Because the model is unique, that value holds in every compatible model. It is still not part of the formal conclusion. U remains an explicit Boolean node; nothing here claims general latent-variable identification.

**Positivity** is unchanged and still returns DOES NOT ENTAIL.

## 3. The resource repair works, and the presets now respond quickly

The preserved logs match the resource note in CONCLUSIONS.md:
- The first instrument draft, with weighted adjustment expressions, hit a WASM out-of-memory error.
- The first front-door draft, with the symbolic formula, ran past the 60 s browser assertion.
- The reduced instrument draft (`reduced-tests.log`) also ran past 60 s, still showing "Searching for a countermodel…". Front-door passed in 984 ms in that run.
- The final targeted tests passed in 15.7 s (instrument) and 1.0 s (front-door). These are whole-test durations, including the SAT inspection afterwards. In the full suite, the instrument test took 42.0 s.

Click-to-verdict times on the release-identical build (fresh pages, repeated runs, little variance, no page errors, all verdicts as expected):

| Preset | Verdict time | SAT inspection afterwards |
|---|---|---|
| Berkson | 14.15–14.38 s | 63 ms |
| M-bias | 0.68 s | — |
| Instrument | 14.48–14.91 s | 82–100 ms |
| Treatment–confounder feedback | 0.93 s | — |
| Front-door | 0.24 s | — |
| Positivity (DOES NOT ENTAIL) | 0.13 s | — |
| Simpson | 0.17 s | — |

These figures describe this machine and environment, not general runtime bounds.

In `tests/causal_literature_examples.spec.ts:24`, the ENTAILS assertion window went from 60 s to 90 s. VERIFICATION.md records this as a change to how long the test waits only. The app's default, its 60 s QF_NRA stage budget, the NLSat fallback and its timeout behaviour are unchanged.

## 4. Startup, guide, SAT inspection after ENTAILS, and Save/Load

- **Startup.** Berkson loads by default with:
  - its conclusion visible and Check entailment selected;
  - Regular off and the status "Choose a decision problem.";
  - no horizontal overflow at 390 px.
- **Guide and model inspection.** ENTAILS produces a proof verdict without a model. The guide therefore presents the listed numbers as supporting exact values and tells users to copy the expressions, choose Satisfiability, and run Find Model to inspect them.
  - With Satisfiability selected, the button reads Find Model and the conclusion is hidden.
  - Switching back to Check entailment restores the saved conclusion draft.
  - SAT inspection after ENTAILS worked for every preset.
- **Save/Load.** Real Save → download → edit → load round trips were run for all seven presets, plus separate spot checks of presets 0, 2, 4 and 6. Each saved file contains `task: "entailment"` and the exact conclusion. After loading, the conclusion is back and visible, with Check entailment selected. The unit tests also check that presets 0–4 keep an active, non-empty conclusion through the JSON round trip.
- **Cancel and reuse.** Cancelling a running Berkson check settled in 798 ms. A Simpson entailment check then succeeded on the same page.
- **Package probe.** `package-probe.json`: 21/21 scenarios and 45/45 exact optional evaluations pass at 320, 390 and 1280 px, with no page errors. An independent probe also passed all seven verdicts and 32 exact evaluations.

## 5. The E/M/A Simpson replacement

- **The supplied table is reproduced exactly.** In the E&M, E&~M, ~E&M and ~E&~M groups, the A/~A counts are 60/20, 40/10, 10/40 and 20/60. All eight joint cells out of 260 match (for example, E&M&A = 60/260 = 3/13, confirmed by browser evaluation). The preset keeps the unsimplified ratios so the table is recognizable.
- **Rates:**
  - Pr(A|M) = 70/130 = 7/13 and Pr(A|~M) = 60/130 = 6/13.
  - Pr(A|E) = 100/130 = 10/13 and Pr(A|~E) = 30/130 = 3/13.
  - Pr(A) = 130/260 = 1/2.
- **Where the reversal is.** Within each E stratum, M lowers the A rate by 1/20. So the reversal concerns M and A, stratified by E. The E–A association is positive overall and in both M strata, so the table contains no other reversal.
- **The DAG is an added assumption.** It is E → M, E → A, M → A, with Pr(E) = 1/2, Pr(M|E) = 80/130 and Pr(M|~E) = 50/130. Under it:
  - Pr(A|do(M)) = (3/4 + 1/5)/2 = 19/40
  - Pr(A|do(~M)) = (4/5 + 1/4)/2 = 21/40

  The guide says explicitly that the counts alone do not determine the DAG.
- **The conclusion** conjoins all seven rates and both comparisons, 7/13 > 6/13 and 19/40 < 21/40. The real browser regression returns ENTAILS. SAT inspection reproduces all seven rates and both −1/20 stratum differences.
- **Historical fixtures** for the old Simpson example remain in `tests/fixtures/decision_problems.ts` and the older spec files.
- **Layout** stays contained at 320, 390 and 1280 px (the literature tests check this; `scrollWidth` is 390 at 390 px). Desktop and mobile captures are preserved.

## 6. Qualifications to keep (none blocks this delta)

1. **WASM error in the first unit run.** The first full unit run failed two unchanged native-solver tests (cancellation/deadline) after a WASM "memory access out of bounds" in `ast_manager::delete_node`. The cause is unknown and is not diagnosed here.
   - The isolated 63-test solver run, a fresh full run and the final full run all pass (1,323 tests).
   - Those passes do not diagnose the cause or guarantee future reliability. The prior release also recorded intermittent WASM test failures in unchanged code.
   - No link to this delta was found. The solver spec does not import the presets, all solver hashes are unchanged, and every preset browser run finished without page errors.
2. **Intermittent navigation timeouts.** `page.goto` timed out once in the full suite, on the 1280 px dense-DAG case (it passed on a targeted rerun in 662 ms). It timed out once more in an independent probe and passed on retry. Both happened before any preset input; the cause is unknown. All 103 unique browser cases pass across runs.
3. **Default-preset latency.** Berkson, the default preset, now takes about 14–15 s to reach ENTAILS, against an almost instant SAT check in the baseline. Progress and Cancel are shown throughout. VERIFICATION.md now records this latency, the 60→90 s assertion change and the navigation incident.
4. **Wording issues:**
   - The guide calls the front-door formula's 11/20 an exact value "supporting the conclusion", although the formula is not part of the formal conclusion.
   - VERIFICATION.md refers ahead to `FINAL_STATUS.md` and `PUBLICATION.md`, which do not exist yet. The manifest state says publication requires a completed phase review.

None of these affects the correctness of the conclusions, the uniqueness argument, the Simpson arithmetic, responsiveness, or the preservation of graphs, premises, settings and evaluation recipes.

**Phase gate: PASS**

## Claude  (verdict: DISAGREE, 14m 26s)
CHECKPOINT
elapsed: ~28 min (started 2026-10-12T19:23Z)
tentative_verdict: Phase gate PASS. No material findings; four documentation and qualification items do not block.
new_results: NEW: I checked the hashes, the field-level diff against 55ff015, an independent exact Fraction enumeration, a kernel-uniqueness proof, timings from my own browser probe on the release-identical dist, Simpson SAT inspection and a real-download Save/Load round trip. Everything matches the claims. I found an undisclosed 60s→90s change to a test timeout and an undisclosed ~14 s Berkson verdict time.
current_obstruction: none
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

## Phase gate: **PASS**

My checkpoints are in `reviews/entailment_presets_2026-10-12T18-57-44Z/claude-checkpoints.md`. Probe scripts and outputs: `claude-timing.mjs/.json`, `claude-extra.mjs/.json`. The enumeration script is `/tmp/claude_audit/enum.py`. I edited no production source. The 4173 preview server I owned has been stopped, and ports 4173/5173/5174 are free.

### 1. Integrity of the delta
- All five changed files and all ten unchanged core files match `source-snapshot.json` byte for byte (sha256).
- The git diff touches only those five source/test files (67 lines added, 30 removed).
- I compared the baseline and current `DECISION_EXAMPLES` field by field using tsx:
  - In the first five presets, only `task`, `conclusion` and `expectedStatus` changed. Graphs, premises, `regular`, descriptions, sources and evaluations are byte-identical.
  - Positivity has no changes at all.
  - Simpson changed its name, graph, premises, conclusion and description, and gained `dataNote`.
- `presets.json` is identical to the source array.
- `dist/index.html` and `dosat-8gDyIqcQ.js` have the same hashes as the release package, and the bundle contains the new conclusions and guide text.

### 2. The five conclusions are entailed, not just true in one witness
**Uniqueness argument (I checked it independently).** In each preset the premises fix every root probability and the conditional for every full parent context:
- M-bias: X|U, Y|V, Z|U,V
- Instrument: X|U,Z, Y|X,U
- Treatment–confounder feedback (TCF): L|A, B|L, Y|B,L
- Front-door: X|U, M|X, Y|M,U
- Simpson: M|E, A|M,E

In the regular presets every specified value lies strictly between 0 and 1. So every full assignment has positive probability, every parent context has positive probability, and each premise conditional therefore equals its kernel parameter. The kernel is unique, and truncated factorization then fixes every do-quantity.

Berkson is the non-regular case. X and Y are independent roots at 1/2, so all four X/Y contexts have probability 1/4. `Pr(S <-> (X v Y)) = 1` therefore forces S's deterministic kernel in every context.

Every conditioning event in every conclusion has positive probability in the unique model, so all terms are defined. The UI shows "ENTAILS —" only after the premises are found satisfiable; there is a separate INCONSISTENT PREMISES path. So none of these verdicts holds vacuously.

**Exact values from my own Fraction enumeration:**

| Preset | Values | Conclusion |
|---|---|---|
| Berkson | causal difference 0; selected difference −1/2 | 0 and 1/2 < 1 ✓ |
| M-bias | 0, 0, −1/24 | ✓ |
| Instrument | all eight risks = 3/5, 2/5, 33/50, 17/50, 51/80, 1/4, 3/4, 29/80 | ✓ |
| TCF | 17/25 > 1/2 > 1/5 | ✓ |
| Front-door | Pr(Y\|do(X)) = 11/20; Pr(Y\|X) = 7/10; front-door formula = 11/20 | ✓ |

More detail on the instrument and front-door cases:
- **Instrument.** The eight risks give a causal difference of 1/5 and an observational difference of 8/25. Both Z-strata differences are 31/80, so the standardized difference is 31/80 for any Pr(Z), because Pr(Z) + Pr(~Z) = 1. The ordering 1/5 < 8/25 < 31/80 follows by arithmetic. Both biases are positive (3/25 < 3/16), so this is also amplification of their absolute size.
- **Front-door.** The formal conclusion asserts only the confounding gap, as disclosed. The description's front-door claim is still supported: the model is unique, so evaluating the formula in any SAT witness gives its value in every compatible model.

### 3. Resource repair and final responsiveness
The preserved logs match the resource note:
- The first instrument draft hit an out-of-memory error.
- The reduced draft (`reduced-tests.log`) failed at the 60 s assertion while still at "Searching for a countermodel…", and Front-door then passed in 984 ms.
- The final targeted run took 15.7 s and 1.0 s.

My probe used fresh pages on the release-identical build, three runs per preset. Times are from clicking the button to the verdict:

| Preset | Verdict time | Later SAT inspection |
|---|---|---|
| Berkson | 14.15 s | 63 ms |
| M-bias | 0.68 s | — |
| Instrument | 14.48 s | 82–100 ms |
| TCF | 0.93 s | — |
| Front-door | 0.24 s | — |
| Positivity (DOES NOT ENTAIL) | 0.13 s | — |
| Simpson | 0.17 s | — |

Times varied very little between runs. There were no page errors, and every verdict was the expected one.

### 4. Startup, guide, SAT inspection after ENTAILS, Save/Load
- **Startup:** the Berkson preset loads with its conclusion visible, Check entailment selected, Regular off, status "Choose a decision problem.", and no horizontal overflow at 390 px.
- **Guide:** for the ENTAILS presets the guide text matches the new wording. With Satisfiability selected the button reads "Find Model" and the conclusion is hidden; switching back to Check entailment brings back the saved conclusion draft.
- **Save/Load:** I ran a real Save → download → edit → load round trip for presets 0, 2, 4 and 6. The saved file has `task:"entailment"` and the exact conclusion. After loading, the conclusion is restored and visible and Check entailment is selected.
- **Existing evidence:** `package-probe.json` has 21/21 cases and 45/45 evaluations passing at 320, 390 and 1280 px with no errors. The unit tests check that presets 0–4 save and restore their conclusions.

### 5. The new Simpson preset
- The premises reproduce the supplied table exactly. All eight joint cell counts out of 260 match, for example E&M&A = 60/260 = 3/13, and a browser evaluation confirms this cell.
- Overall rates: Pr(A|M) = 7/13 and Pr(A|~M) = 6/13. Pr(A|E) = 10/13, Pr(A|~E) = 3/13 and Pr(A) = 1/2.
- Within each E stratum the M−A difference is −1/20. Under the assumed DAG E→M, E→A, M→A, Pr(A|do(M)) = 19/40 < Pr(A|do(~M)) = 21/40.
- The reversal is between M and A when stratified by E. The E–A association is positive overall and in both M strata, so the table contains no other reversal.
- The description says outright that the DAG is an assumption and that the counts do not determine it.
- Browser SAT inspection reproduces all seven rates and both −1/20 strata differences. The seven-rate entailment regression passes.
- The old Simpson example is still in `tests/fixtures/decision_problems.ts` and the older spec files.
- At 320, 390 and 1280 px, layout stays contained (the literature tests check this, and `scrollWidth` is 390 in my probe).

### 6. Unit-test qualification
The first full unit run failed two tests in `causal_decision_solver.spec.ts` (cancellation/deadline) after a WASM "memory access out of bounds" in `ast_manager::delete_node`. Its cause is unknown, and I am not diagnosing it. The isolated 63-test run, a fresh full run and the final full run all pass (1,323 tests).

This failure has no concrete link to this delta. The solver spec does not import the presets: only `causal_decision_ui.ts` and the literature spec do. All solver hashes are unchanged. Every preset browser run I did, and every recorded one, finished with no page errors.

### Items that do not block the gate (should be added to VERIFICATION/FINAL_STATUS)
1. **Undisclosed test timeout change.** The ENTAILS verdict timeout in `tests/causal_literature_examples.spec.ts:24` was raised from 60 s to 90 s. The initial and reduced versions used 60 s. It hides no failure, since clean runs take about 14.5 s. But in the full suite the instrument test took 42.0 s in total, so there is a sensitivity to the environment that should be recorded.
2. **Undisclosed Berkson latency.** Berkson, the default startup preset, now takes about 14 s to reach ENTAILS. The baseline SAT check was nearly instant. The UI shows progress and a Cancel button, so this is acceptable, but it is not mentioned alongside the 15.7 s / 1.0 s figures.
3. **Navigation timeout reproduced, intermittently.** In my first probe the fourth `page.goto` timed out at 30 s waiting for domcontentloaded, even though the server answered `curl` at once. 0 of the 18 later navigations failed. This matches the documented dense-DAG navigation qualification; it happens before any preset input, so it has no evident link to this delta. Keep it as a qualification.
4. **Small wording issues:**
   - The guide calls the front-door formula's 11/20 an "exact value supporting the conclusion", although the formula is not part of the conclusion.
   - VERIFICATION.md points to `FINAL_STATUS.md`/`PUBLICATION.md`, which do not exist yet. Presumably they come after the gate; the manifest state is "publication requires completed phase review".

None of these affects the correctness of the conclusions, kernel uniqueness, the Simpson arithmetic, responsiveness or the guarantees about which settings are preserved.

**Phase gate: PASS**

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 7m 28s)
CHECKPOINT
elapsed: 6.8 minutes
tentative_verdict: Phase gate PASS; agree with Claude’s substantive assessment.
new_results: NEW: Independently verified frozen hashes, preserved preset fields, exact arithmetic, seven browser verdicts, 32 evaluations, seven real Save/Load round trips, responsive containment, and startup cancellation/reuse.
current_obstruction: none
next_bounded_step: done; retain documented resource and timing qualifications in synthesis.
token_cost: unavailable
END CHECKPOINT

**Phase gate: PASS.** I endorse your conclusion. No unresolved material finding remains in this scoped delta.

My independent checks confirm:

- All five changed files match the snapshot. All ten core files also match the baseline. All eight prepared-package hashes match. First-five graphs, premises, regularity settings and evaluation recipes are preserved; positivity is identical.
- The conclusions hold in **every compatible kernel**. For the regular presets, every full-parent CPT entry and root probability is specified, with positive parent contexts. This uniquely fixes the probability kernel and its truncated intervention distributions. For Berkson, the independent positive roots give all four X/Y contexts positive mass; the probability-one selection biconditional fixes S in each. All conclusion terms are defined, and explicit compatible kernels establish satisfiable premises.
- Instrument’s eight risks imply \(1/5<8/25<31/80\). The biases are \(3/25<3/16\), both positive, establishing amplification of absolute bias. TCF gives \(17/25>1/2>1/5\). Front-door formally asserts only the two probabilities, \(11/20\) and \(7/10\); its optional recipe independently recovers \(11/20\).
- Simpson reproduces the eight counts: A/~A are 60/20, 40/10, 10/40 and 20/60 in the four E/M groups. Its five observational rates match. Each E stratum has difference −1/20; under the explicitly assumed DAG, intervention rates are \((3/4+1/5)/2=19/40\) and \((4/5+1/4)/2=21/40\). The compound conclusion correctly expresses the M–A reversal.
- The independent browser probe passed all seven expected verdicts, 32 exact evaluations and seven actual download/load round trips. Startup conclusions and all guides stayed contained at 320/390/1280px. No page errors occurred. Berkson cancellation settled in 798ms, followed by successful Simpson entailment on the same page.

Two refinements to your report:

1. Current **VERIFICATION.md now documents the 60→90-second assertion change**. This changes the test window; app deadlines and fallback semantics remain unchanged.
2. The recorded 15.7s/1.0s and full-suite instrument 42.0s are whole-test durations, including subsequent inspection. My click-to-verdict observations were Berkson 14.379s, instrument 14.905s and front-door 0.240s. Preserve the latency qualification without treating these as general runtime bounds.

I agree that the initial unchanged-solver WASM exception remains unexplained. The isolated 63-test run and later full-suite passes do not diagnose its cause or guarantee future reliability. No concrete connection to this delta was established. Likewise, preserve the navigation timeout and successful targeted rerun; describe coverage as all 103 unique cases passing across runs.

The front-door guide wording and downstream status-file pointers do not block this gate. Synthesis should retain the distinction between formal conclusions and optional numerical inspection.

Detailed evidence is in [codex-audit.md](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/entailment_presets_2026-10-12T18-57-44Z/codex-audit.md). The owned preview server is stopped; ports 4173/5173/5174 are free. No production source edits or publication actions occurred.

VERDICT: AGREE



## Claude  (verdict: AGREE, 36s)
CHECKPOINT
elapsed: ~32 min
tentative_verdict: Phase gate PASS. I agree with Codex.
new_results: NEW: VERIFICATION.md (modified 15:42 local) now records the 60→90 s assertion change, the 15.7 s isolated and 42.0 s full-suite instrument test durations, the roughly 14–15 s Berkson latency, and the navigation/unit-WASM qualifications. Both changed source files still match the snapshot hashes.
current_obstruction: none
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

## Response to Codex

**Phase gate: PASS.** I agree with Codex's assessment and accept both of its refinements. We disagree on nothing material.

**Refinement 1: the 60→90 s change is now documented.** I confirmed this myself. The "Browser assertion window" section of the current VERIFICATION.md says the change affects only how long the test waits. The app's unbounded default, its 60 s QF_NRA stage budget, the NLSat fallback and the timeout behaviour are all unchanged.

The stated reason is that a 60 s assertion can expire just as the existing stage hands over to the fallback. I read that as an account of how long the test needs to wait, not a diagnosis of the solver, and it fits the evidence: the reduced draft sat at "Searching for a countermodel…" for the whole 60 s window. The "First-reviewer nonblocking qualifications" section also records the Berkson and instrument latencies and the navigation incident I found. So my first two nonblocking items are now disclosed and closed.

**Refinement 2: whole-test times versus click-to-verdict times.** Agreed. The 15.7 s, 1.0 s and 42.0 s figures cover the whole test, including the later SAT inspection and evaluations. Our click-to-verdict measurements match closely:
- Berkson: 14.15 s (mine) and 14.38 s (Codex)
- Instrument: 14.48 s and 14.91 s
- Front-door: 0.24 s for both

These are figures for this instance and environment, not general runtime bounds.

## Shared answer for the synthesis

**What holds:**
- **Integrity.** All five changed files, all ten unchanged core files and the eight package files match their hashes. In the first five presets only `task`, `conclusion` and `expectedStatus` changed; the positivity preset is unchanged.
- **Entailment in every compatible kernel.** The premises fully specify the conditional probability tables, and every parent context has positive probability. So the kernel is unique, and truncated factorization fixes every do-quantity.
- **Berkson.** The independent roots give all four X/Y contexts mass 1/4, and the probability-1 biconditional then fixes S in each context.
- **No vacuous verdicts.** Every term in every conclusion is defined. "ENTAILS —" appears only after the premises have been found satisfiable.
- **Values.** Berkson gives 0 and −1/2. M-bias gives 0, 0 and −1/24.
- **Instrument.** The conclusion fixes eight risks, which imply 1/5 < 8/25 < 31/80. The two biases are 3/25 and 3/16, both positive.
- **Treatment–confounder feedback.** 17/25 > 1/2 > 1/5.
- **Front-door.** The conclusion formally asserts only 11/20 and 7/10. The full front-door formula is an optional model check that also gives 11/20. Because the model is unique, that check holds for every compatible model, but it is not part of the formal conclusion.
- **Simpson (E/M/A).**
  - The premises reproduce all eight cells: A/~A = 60/20, 40/10, 10/40 and 20/60.
  - The rates are 7/13, 6/13, 10/13, 3/13 and 1/2, and each E stratum has an M–A difference of −1/20.
  - Under the explicitly assumed DAG, the intervention rates are 19/40 < 21/40.
  - The only reversal in the table is M versus A, stratified by E. The historical Simpson fixtures are retained.
- **Browser checks.** The UI was tested at 320, 390 and 1280 px:
  - Every preset gave the expected verdict, with no page errors and no overflow at any width.
  - After ENTAILS, switching to Satisfiability and running Find Model allowed the values to be inspected.
  - At startup the Berkson conclusion is visible.
  - Real download/load round trips restored the problems (presets 0, 2, 4 and 6 in my probe; all seven in Codex's).
  - Cancelling Berkson and then reusing the same page worked.

**Qualifications to keep:**
1. **First full unit run.** It failed with a WASM memory-access exception in two unchanged native-solver tests. The cause is unknown. The isolated 63-test run and the two later full runs pass, but that does not establish future reliability. No concrete link to this delta was found.
2. **Intermittent `page.goto` navigation timeouts.** One occurred in the full suite (passed on targeted rerun) and one in my probe (passed on retry). The cause is unknown, and they happen before any preset input. All 103 unique browser cases pass across runs.
3. **Default-preset latency.** Berkson, the default preset, now takes about 14–15 s to reach a verdict, up from an almost instant SAT check in the baseline. Progress and Cancel are shown throughout.
4. **Wording nits that do not block the gate.** The guide calls the front-door formula's value "supporting the conclusion", although the formula is not part of the conclusion. VERIFICATION.md also refers forward to FINAL_STATUS.md and PUBLICATION.md, which do not exist yet.

None of these is material to this delta. Codex and I both stopped our owned servers, and ports 4173, 5173 and 5174 are free. Neither of us edited source or took any publication action.

**Phase gate: PASS**

VERDICT: AGREE

