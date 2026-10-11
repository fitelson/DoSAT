# Consensus debate — 2026-10-11 19:01

## Question
Audit the completed DoSAT PrSAT-alignment UI implementation against the agreed first-pass design. This is the required scoped development-phase consensus gate, not another design-only review. Independently inspect actual new source, tests, witness rendering, production screenshots, and relevant integration. Evaluate faithful causal MathML, exact values, locations of graph/premise/conclusion errors including blank/comment physical rows, no stale solving/export from rows or pending batch, task switching, JSON roundtrips, accessibility, desktop/mobile layout, and continued cancellation/settlement guarantees. Existing mathematical Phase 3 PASS is closed; old source is reference only where the UI depends on it. Do not broaden to latent models, do-calculus completeness, old parser/solver audits, performance benchmarks, dependency upgrades, or optional Evaluate/Decimals/image/graph features.

Report concrete material issues with file locations, trigger, impact, bounded remedy and regression test; distinguish optional polish from blockers. If no blockers remain give explicit "Phase gate: PASS". If material defects remain give "Phase gate: FAIL" even if you agree on the repairs. Reach consensus on the current implementation verdict and decisive evidence. The returned report must be compressed to at most 40,000 output tokens, retaining all decisive arguments, counterexamples, qualifications and verdict. Write any longer details to a project review file and return its path. Do not modify implementation/test files or run recursive model calls/delegation. Follow the runner checkpoint and final VERDICT protocol.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 6m 51s (2 turns); Codex: 6m 37s (2 turns); total: 13m 28s

## Agreed answer
# DoSAT PrSAT-alignment UI implementation: phase-gate audit

## Verdict

**Phase gate: FAIL.** Most of the implementation follows the agreed first-pass design. Two groups of material defects remain, and none of the passing tests covers them.

- **Wrong verdicts or stale output:** none of the defects produces a wrong solver verdict, a stale solve or a stale export.
- **Rendered-preview workflow:** on mobile, it hides parsed formula content that the user cannot reach.
- **Load behaviour:** an accepted file can be applied in a form different from the one that was validated. In the premise case, this leaves the problem stuck in a pending-batch state that Discard cannot clear.

The closed Phase 3 mathematical PASS is unaffected.

## Verified conforming evidence

**Scope and tests**
- **Scope:** the hashes of all 14 files in `source-snapshot.json` match the files on disk. The reduction and runtime solver are unchanged from baseline `9ad6e1d`.
- **Tests:** all 84 UI unit tests pass (editor, renderer, results and UI specs). All 29 scoped Chromium tests pass, including:
  - cancellation during a pending native check;
  - settlement;
  - stale-result suppression;
  - reuse after cancellation.
- **Package probe** (`package-probe.json`, 31 checks):
  - all nine examples give their expected answers at 1280 px;
  - there are zero page errors;
  - cross-origin isolation is in place and Z3 loads;
  - the rendered font is confirmed as Source Sans Pro SemiBold;
  - Run's top edge is at about 761 px on desktop and 933 px at 390 px, inside the ≤800 / ≤950 px targets.

**Causal MathML** (`causal_to_html.ts`)
- The renderer reuses PrSAT's formula rendering. It replaces only the exact placeholder variables that the parser substitutes for causal probability terms.
- The `do(...)` assignments are rendered from the original text, in the parser's source order (`causal_syntax.ts:211-229`). So `do(X=1)` stays distinct from `do(X)`, and `do(~X)` and `do(X, ~Z)` render faithfully.
- `Pr(Y | do(X), Z)` puts the intervention and the observation in separate, distinctly styled groups. Negation uses `~` consistently with PrSAT.
- The preview is labelled as confirming parsing only, not that the probabilities are defined.

**Exact values and undefinedness** (`causal_decision_results.ts`)
- `format_exact_value` shows exact rationals and never rounds.
- Undefined conditional terms show as "undefined (zero denominator)".
- Regime columns are matched by variable assignment, not by row order.
- Witnesses are immutable plain snapshots, and there is no live evaluator.
- A countermodel shows the submitted conclusion next to the witness values.

**Physical-row errors**
- `validate_decision_fields` parses each physical line separately and indexes errors by physical line. The editor splits rows the same way.
- The `Constraint line N:` prefix is stripped and replaced with the physical row label.
- Screenshot `final-batch-error-390` shows "Premise 4: Causal variable Q is not declared" on the fourth physical row, after a blank row and a comment row. The "Fix Premise 4." link targets that row.
- Conclusion errors are prefixed "Conclusion:". Graph errors stop validation early and are linked.
- Each field gets `aria-invalid`, plus `aria-describedby` pointing at its help and error text.

**No stale solving or export**
- Every edit to a row, the batch box, the graph or the conclusion does all of the following synchronously, with no debounce:
  - increments the revision;
  - aborts any active run;
  - clears the results;
  - drops the compiled solver input.
- `valid()` returns false whenever `editor.pending()` is true. Run, Save and Copy all re-check validity when clicked.
- Saving solver input uses only the input compiled for the current revision.
- Witnesses render only if the revision is unchanged.

**Task switching**
- In satisfiability mode the conclusion is hidden, disabled and left out of `input()`, but it is preserved as a draft.
- `parse_decision_input` rejects a conclusion in satisfiability mode, so the draft cannot leak into a run.
- The Run label, heading, Clear and validation text all follow the selected task.

**JSON round trips**
- The saved format is identical to baseline v1: version, kind, task, graph, premises, conclusion, regular, mode, seconds.
- Load validates the whole file before applying it, apart from the F2 exception below.
- Older file reads are discarded when superseded by a newer read or a manual edit.
- Blank premises and blank physical rows survive the round trip.

**Cancellation and settlement**
- The run/cancel/finally logic is the same as the baseline:
  - the token check;
  - `cancel.disabled` while an abort is pending;
  - Run blocked until the previous run settles;
  - the settle and cancel status messages.
- The inherited tests were not weakened.

**Layout, accessibility and qualifications**
- At 320 px, wide regime tables scroll inside their own container and the page stays 320 px wide.
- Wide tables are scrollable regions that can be reached by keyboard (`tabindex=0`, `role=region`).
- Each row has its own accessible names ("Premise N", "Delete premise N", and so on).
- The task choice is a fieldset with a legend. The batch status and the validation summary are live regions.
- In Chromium, focus moves correctly from the validation links (covered by a passing browser test).
- These statements remain visible:
  - "No premises: checks validity." (Run stays enabled);
  - the structural-zero note;
  - what the deadline means;
  - the observed-graph and independent-disturbance assumptions;
  - the explanation of vacuous entailment from inconsistent premises;
  - the distinct UNRESOLVED, Cancelled and error states.

## Blocking defects

### Group A — Formula overflow on mobile (F1, F3)

#### F1 — Long premise previews are clipped and cannot be scrolled (new in this phase; blocker)

**Location:**
- `src/causal_decision_editor.ts:116` — the preview `<span class="constraint decision-preview">`;
- `src/causal_decision_style.css:39` — `max-width` / `overflow-x: auto` on the preview;
- `:65` — `overflow: hidden` on the editor panel;
- `:66-70` — the mobile rules that remove the `.decision-row` grid below 601 px.

**Mechanism:** below 601 px the row stops being a grid, so the preview stays an inline element. `max-width` and `overflow-x` have no effect on inline elements. The panel's `overflow: hidden` then silently clips everything past the row edge.

**Trigger and measurements:**

| Viewport | Premise | Display | Preview width | Preview right edge | Row right edge | Scrollable |
|---|---|---|---|---|---|---|
| 390 px | 16 `Pr(Z)` terms joined by `+`, then `=1` | inline | 1145 px | 1176 | 363 | No: client/scroll width 0/0, `scrollLeft` has no effect |
| 320 px | same | inline | 1145 px | 1176 | 293 | No |
| 1280 px | same | block | 526 px | — | — | Yes: client 526, scroll width 1207 |

A realistic case fails the same way. Enter the back-door identity `Pr(Y | do(X)) = Pr(Y | X & Z)*Pr(Z) + Pr(Y | X & ~Z)*Pr(~Z)` as premise 1 at 390 px:
- the 510 px preview is cut off after "…+ Pr";
- Run stays enabled;
- the document width stays 390 px.

**Impact:**
- The comparison, the right-hand side and the later `do()` terms of accepted input are invisible and cannot be reached on supported mobile widths.
- This defeats the purpose of the agreed rendered-preview row, which is to show how each causal term was parsed.
- It breaks acceptance check 10 (long formulas at 390 px).
- The package probe's page-width assertion cannot detect content clipped by `overflow: hidden`, which is why the tests pass.

#### F3 — The submitted conclusion in a countermodel overflows its container on mobile (repair with F1)

**Location:**
- `src/causal_decision_results.ts:82` — `div.decision-rendered-formula` in the submitted-conclusion block, which has `overflow-x: visible`;
- `src/style.css:271` — `.model-finder { overflow-x: auto }`.

**Trigger:** at 390 px:
1. Load example 8.
2. Change the conclusion to the incorrect back-door form ending in `*Pr(Z)`.
3. Run. The result is DOES NOT ENTAIL.

**Measured:**
- the formula box has client width 337 px and scroll width 496 px;
- the MathML ends near x = 523;
- the action panel becomes the horizontal scroller instead (client 356, scroll 506).

**Impact:**
- The formula can be reached only by scrolling the whole action panel sideways. That panel is not a focusable region, so the scroll cannot be done from the keyboard, and scrolling it moves Run, Cancel and the status out of view.
- This weakens acceptance checks 10 and 11, because the failed conclusion stays visible in every result state only by accident.

#### Bounded remedy for Group A

- Make every rendered-formula holder a block that fills the available width and scrolls itself: `display: block; max-width: 100%; min-width: 0; overflow-x: auto`. This applies to:
  - premise previews;
  - the conclusion preview;
  - `.decision-rendered-formula`.
- When a holder overflows, give it `tabindex=0`, `role=region` and an accessible name such as "Premise N preview" or "Submitted conclusion".
- Make no change to the parser or solver.

#### Regression tests for Group A (at 390 px and 320 px)

Use the back-door premise and the long failed conclusion. Assert that:
- document width ≤ viewport width;
- each formula holder has `scrollWidth > clientWidth`, and the holder itself is the scroll container;
- setting `scrollLeft`, or pressing ArrowRight on the focused region, brings the formula's right edge into view;
- the action panel does not scroll horizontally, and Run and Cancel stay inside the viewport.

### Group B — Loaded text is validated in one form and applied in another (F2; required repair)

**Location:**
- `src/causal_decision_ui.ts:187–191` — the load handler;
- `src/causal_decision_editor.ts:60–67`, `:109–113`, `:172–178`, `:187–191` — row and batch synchronization, `setValue`, `pending()` and Discard.

**Premise case (new in this phase):** load an otherwise ordinary v1 satisfiability file with graph `A` and premises `"Pr(A)\r=1/2"` (a lone carriage return, not CRLF).
- Validation accepts it as one line. The row input displays `Pr(A)=1/2`, but `row.value` keeps the `\r`.
- Assigning that value to the batch textarea turns the `\r` into `\n`. `pending()` is therefore true straight after Load.
- Run, Save and Copy are blocked with "Batch edits are unapplied…".
- **Discard does not resolve it.** After Show Batch Input → Discard, the same mismatch reappears.
- Editing the row does not resolve it either, because `mutate` only re-syncs the batch box when no draft existed before the edit.
- Parse turns the problem into two invalid rows, `Pr(A)` and `=1/2`.

This breaks two agreed invariants: Load applies the validated problem directly, and Discard always resolves a pending batch.

**Graph and conclusion cases (inherited from the baseline load code at roughly HEAD lines 150–152, closed by the same fix):**
- `conclusion: "Pr(A)\r=1/2"` passes validation as one line. The textarea then turns the `\r` into `\n`, so after Load the conclusion has two lines, the previous problem has been replaced, and Run is blocked with "Fix the conclusion."
- `graph: "A ->\rB"` behaves the same way and ends in "Fix the graph."
- Both can be recovered by editing, but they break acceptance check 9: an invalid load replaces the current problem.

**Severity:** this is an edge case in accepted file input. It produces no incorrect solver verdict. It does contradict the guarantees that loaded rows match what is visible and that Discard always clears a pending batch.

#### Bounded remedy for Group B

- In the load handler, convert `\r\n` and lone `\r` to `\n` in `graph`, `premises` and `conclusion` **before** calling `parse_decision_input` and before any change to the problem. Then apply exactly the text that was validated.
- For defence in depth, apply the same normalization in `editor.setValue`.
- With this fix, the premise fixture becomes the two lines `Pr(A)` and `=1/2`. They fail validation, so the load is rejected and the previous problem is kept, which matches how the baseline textarea treated the same text.
- An alternative is to reject lone-CR input outright before any change is made.
- Make no change to the parser or solver.

#### Regression tests for Group B

Load three fixtures, each with a lone CR in one field (premises, graph, conclusion). Each must either:
- be rejected with the previous problem fully intact, or
- be applied with the visible text, the applied value and the batch text all equal, and `pending()` false.

Keep the existing tests for CRLF, blank and comment physical rows, and ordinary round trips.

## Optional polish (not blocking)

1. **Live-region noise and grammar** (`causal_decision_ui.ts`, `valid()`). Every keystroke rebuilds the `role=status` validation region, and a single premise reads "1 premises ready." Fix: choose singular or plural correctly, and rewrite the text only when it changes.
2. **Hidden batch draft gives instructions the user can't follow directly** (`causal_decision_editor.ts`, `refreshBatch` / `toggleBatch`). The message says "Parse or Discard", but those buttons are inside the collapsed region. Run stays correctly blocked. Fix: add "Show Batch Input to…" to the message, or move the buttons next to the status.
3. **Enter in the conclusion box adds a second line.** Validation then correctly reports "Entailment requires exactly one conclusion constraint line." Fix: intercept Enter, or use a single-line input.
4. **No ⓘ button on the conclusion row**, unlike the design sketch. The definedness note and the global help already cover the content.
5. **Examples menu can mislead.** It keeps showing the last chosen example after Load, Clear or an edit, and choosing the same example again does nothing.
6. **Multi-line paste into one premise row is not split into rows.** The browser's input cleanup leaves one visible line, which is validated, so there is no hidden state. Not probed in a browser.
7. **Algebraic witness values would appear as raw `root-obj` text.** `format_exact_value` pretty-prints rationals only. No current example produces such a value, and this belongs to the optional presentation work.
8. **Save overwrites an out-of-range seconds value.** With the time limit off, an out-of-range seconds value is saved as 30. The field has no effect in that state.

One behaviour is unchanged from the baseline and outside this gate: a result that settles after Cancel is clicked, but before the abort takes effect, is still displayed. That result is accurate, not stale.

## Qualifications

- Not verified: Safari, Firefox, iOS Safari, real screen readers, and whether radio buttons fire `input` events outside Chromium.
- Probe scripts and captures from this audit were written to `/tmp/dosat-claude-r2/` (`probe*.cjs`, `long-390.png`, `backdoor-390.png`, `conclusion-390.png`) and `/tmp/dosat-codex-long-preview-20261011.png`. These are temporary diagnostics and may not persist.
- No implementation or test files were modified.

## Required next steps

1. Repair Group A (F1 and F3) in `causal_decision_editor.ts`, `causal_decision_results.ts` and `causal_decision_style.css`.
2. Repair Group B (F2) in `causal_decision_ui.ts` and `causal_decision_editor.ts`.
3. Add the regression tests above. Re-run the UI unit tests, the scoped Chromium suite and the package probe.
4. Run a scoped consensus recheck limited to these repairs and their effect on the verified invariants.

Agreement on these repairs does not approve the current implementation to advance.

**Phase gate: FAIL.**

## Claude  (verdict: DISAGREE, 3m 55s)
CHECKPOINT
elapsed: ~20 min
tentative_verdict: Phase gate: PASS. I found no blockers; nine optional polish items are listed below.
new_results: NEW: I read all five new UI modules and the integration in `causal_decision_ui.ts`, and checked the scope hashes. The four new UI spec files pass (84/84). I looked at the screenshots at 1280, 390 and 320 px and traced the stale-state, validation and settlement paths by hand. I found no material defect.
current_obstruction: none
next_bounded_step: Codex independently checks the same claims, especially the hidden-batch and live-region polish items and the settlement code shared with the baseline.
token_cost: unavailable
END CHECKPOINT

# Opening report (Claude): DoSAT PrSAT-alignment UI implementation gate

## Verdict
**Phase gate: PASS.** The implementation matches the agreed first-pass design in every area the gate asks about. Nothing below can produce a stale solve or export, a wrong result, or a misplaced error. Every finding is optional polish.

## What I checked

**Scope hashes**
- The hashes of all 14 files in `source-snapshot.json` match the files on disk.
- The reduction file (`3060d949…`) and the solver file (`9e2f6760…`) are unchanged.

**Tests**
- I ran `npx vitest --run` on the four new UI spec files (editor, renderer, results, UI): 84 passed.
- I did not re-run the 78 Chromium e2e tests or the package probe. I relied on `package-probe.json`, whose 31 checks include:
  - all nine examples giving their expected answers at 1280 px;
  - zero page errors;
  - cross-origin isolation, and Z3 5.1.0 loaded;
  - Source Sans Pro SemiBold confirmed as the rendered font through the browser's DevTools protocol;
  - Run's top edge at y≈761 at 1280 px.

**Screenshots** (`final-example-2-1280`, `final-batch-error-390`, `final-example-1-320`)
- The dark header, the grey bordered panels and the teal run button are all present.
- Each premise sits in its own row with ⌫ ⏎ ⓘ controls and a rendered formula.
- `do(X)` is drawn in a distinct colour.
- The ⊤/⊥ table of probabilities for each regime is visible, with exact values ("3/8", "1/2").
- The countermodel for example 2 shows "undefined (zero denominator)".
- At 320 px the wide regime table scrolls inside its own container, and the page stays 320 px wide.

## Evidence for each requirement

**1. Causal formula rendering (MathML)** — `causal_to_html.ts`
- The renderer reuses PrSAT's existing formula rendering, then replaces only the exact placeholder variables that the parser substitutes for causal probability terms.
- The `do(...)` assignments are rendered from the original text, and the parser keeps them in source order (`causal_syntax.ts:211-229`). As a result:
  - `do(X=1)` stays spelled "X = 1" and is distinct from `do(X)`;
  - `do(~X)` and `do(X, ~Z)` render faithfully.
- `Pr(Y | do(X), Z)` puts the intervention and the observation in separate groups with distinct classes.
- Negation uses `~` both inside events and inside `do(...)`, which is consistent with PrSAT (`prsat_to_html.ts:149`).
- The preview is labelled as confirming parsing only, not that the probabilities are defined (row help text and spec line 130).

**2. Exact values and undefined terms** — `causal_decision_results.ts`
- `format_exact_value` shows exact rationals and never rounds.
- Undefined terms are shown as "undefined (zero denominator)".
- Regime columns are matched up by variable assignment, not by row order.
- Witnesses are immutable snapshots, so no live evaluator exists.
- A countermodel shows the submitted conclusion next to the witness values, with no evaluator implied for compound formulas.

**3. Error locations, including blank and comment rows**
- `validate_decision_fields` parses each physical line on its own and indexes errors by physical line.
- The editor's rows split the text the same way.
- The `Constraint line N:` prefix that comes from parsing one line at a time is stripped, and the editor relabels errors with the physical row number.
- Screenshot `final-batch-error-390` shows "Premise 4: Causal variable Q is not declared" on the fourth physical row, after a blank row and a comment row. The summary link "Fix Premise 4." points at that row.
- The conclusion is validated separately, so its errors say "Conclusion:" (spec at line 290).
- Graph errors stop validation early and are linked (spec at line 300).
- Each field gets `aria-invalid`, plus `aria-describedby` pointing at its help and error text.

**4. No stale solving or export**
- Every keystroke in a premise row updates that row synchronously and invalidates the problem: the revision number goes up, any active run is aborted, results are cleared and the saved solver input is dropped. There is no debounce.
- Typing in the batch box invalidates the same way.
- `valid()` returns false whenever `editor.pending()` is true (the batch text differs from the applied rows). Run, Save to File and Copy therefore all re-check validity when clicked.
- Save solver input only uses the solver input compiled for the current revision.
- Witnesses are rendered only when the revision has not changed. Because every edit to the graph or conclusion bumps the revision, `graph.value` and `conclusion.value` at render time are exactly what was submitted.

**5. Task switching**
- The conclusion is hidden, disabled and left out of `input()` in satisfiability mode, but it is still saved.
- `parse_decision_input` rejects a conclusion in satisfiability mode, so a hidden draft cannot leak into a run.
- The labels for Run, the heading, Clear and the validation messages follow the selected task.

**6. JSON round trips**
- The saved format is the same as the baseline v1 format (`git show HEAD` line 131): version, kind, task, graph, premises, conclusion, regular, mode and seconds.
- Loading validates the whole file before applying anything, so a malformed file leaves the current problem unchanged.
- Older file reads are discarded when a newer one or a manual edit supersedes them.
- Blank premises and blank physical rows survive the round trip.

**7. Cancellation and settlement**
- The run, cancel and finally logic is the same as in the baseline file: the token check, `cancel.disabled` while an abort is pending, Run disabled until the old run settles, and the "waiting for the solver to settle" and "cancelling the previous decision" messages.
- The inherited e2e and unit settlement tests were not weakened (the status file says so, and the spec names are unchanged).

**8. Layout and accessibility**
- Run's top edge is at about 761 px on desktop and 933 px at 390 px, inside the agreed ≤800 / ≤950 targets.
- Wide tables scroll inside keyboard-focusable regions (`tabindex=0`, `role=region`).
- Each row has row-specific accessible names ("Premise N", "Delete premise N", and so on).
- The task choice is a fieldset with a legend.
- The batch status and the validation summary are live regions.

**9. Retained qualifications**
These all remain visible:
- no premises means a validity check ("No premises: checks validity.", with Run still enabled);
- the structural-zero note;
- what the deadline means;
- the observed-graph and independent-disturbance assumptions;
- the inconsistent-premises vacuity explanation;
- the distinct UNRESOLVED, Cancelled and error messages.

## Optional polish (none of these blocks the gate)

1. **Live-region noise and grammar** — `causal_decision_ui.ts`, `valid()`.
   - Trigger: any keystroke rebuilds the `role=status` validation region, and a single premise reads "1 premises ready." (visible in `final-example-2-1280`).
   - Impact: repeated screen-reader announcements, and a grammar slip.
   - Fix: choose singular or plural correctly, and only rewrite the text when it changes.
   - Test: one premise produces "1 premise ready."
2. **Hidden batch draft gives instructions the user can't follow directly** — `causal_decision_editor.ts`, `refreshBatch` / `toggleBatch`.
   - Trigger: hide the batch while it has unapplied text. The message says "Parse or Discard", but those buttons are inside the hidden region.
   - Impact: the user has to reopen the batch first. Run stays blocked, so this is not a staleness issue.
   - Fix: add "Show Batch Input to…" to the message, or keep Parse and Discard next to the status.
3. **Enter in the conclusion box adds a second line** — `causal_decision_ui.ts`, conclusion textarea.
   - Trigger: pressing Enter in the conclusion box.
   - Impact: validation then correctly reports "Entailment requires exactly one conclusion constraint line." The UI never offers a second conclusion row, so this is ergonomics, not correctness.
   - Fix: intercept Enter, or use a single-line input.
4. **No dedicated ⓘ button on the conclusion row**, unlike the design sketch. The definedness note and the global syntax help cover the content.
5. **Examples menu can mislead** — it keeps showing the last chosen example after a Load, Clear or edit, and choosing the same example again does nothing.
6. **Multi-line paste into one premise row is not split into rows.** The browser's input cleanup leaves one visible line, and that line is validated, so there is no hidden state. I did not probe this in a browser.
7. **Validation links only scroll.** The `#id` links scroll to the field but may not move focus in every browser. A click handler that focuses the target would make them more useful for keyboard users.
8. **Irrational witness values would show raw.** `format_exact_value` pretty-prints rationals only, so an algebraic `root-obj` value would appear as exact but raw SMT text. None of the examples produce one, and this falls under the optional presentation work.
9. **Save can overwrite an out-of-range seconds value.** With the time limit switched off, an out-of-range seconds value is saved as 30 (the field is disabled at that point). This is minor data loss on a field that has no effect.

One other behaviour is unchanged from the baseline and outside this gate's scope: a solver result that settles after Cancel is clicked but before the abort takes effect is still displayed. That is an accurate result, not a stale one.

## Untested by me
- Safari, Firefox, iOS and a real screen reader.
- Whether radio buttons fire `input` events outside Chromium.
- I did not re-run the e2e suite myself.

This is the opening turn, so there is no other answer to endorse yet. I am leaving the verdict open for Codex's independent check.

VERDICT: DISAGREE

## Codex  (verdict: DISAGREE, 5m 26s)
CHECKPOINT
elapsed: ~10 min
tentative_verdict: Phase gate: FAIL.
new_results: NEW: Independently verified all 14 snapshot hashes, 84/84 UI unit tests and 29/29 scoped Chromium tests. Reproduced two UI defects in the production package: clipped mobile premise previews and a loaded carriage-return premise trapped in pending-batch state.
current_obstruction: Both defects remain present; neither is covered by the passing tests.
next_bounded_step: Claude should independently reproduce these cases and reconcile the gate verdict.
token_cost: unavailable
END CHECKPOINT

I agree with most of your implementation assessment, but disagree with **Phase gate: PASS**. Two concrete defects require bounded repairs.

**F1 — Long premise previews are clipped on mobile.**

- **Location:** `src/causal_decision_editor.ts:116`, `src/causal_decision_style.css:39`, `:65`, and the mobile rules at `:70`.
- **Trigger:** At 390px, replace premise 1 with sixteen `Pr(Z)` terms joined by `+`, followed by `=1`. This is accepted input; Run remains enabled.
- **Observed:** The preview span has `display: inline`, width approximately **1145px**, and `clientWidth = scrollWidth = 0`. Setting its `scrollLeft` has no effect. Its row ends near x=363, while the preview ends near x=1176. The enclosing editor panel’s `overflow: hidden` clips the remainder, including the comparison and right-hand side. The same failure occurs at 320px; desktop previews scroll correctly.
- **Impact:** The page-width assertion passes while hiding meaningful parts of the parsed formula. This defeats the agreed rendered-preview workflow for supported mobile inputs.
- **Bounded remedy:** Make premise previews width-constrained block scroll containers on mobile, with keyboard access and an accessible name when appropriate.
- **Regression:** At 390px and 320px, enter a long valid arithmetic/causal premise. Assert contained document width **and** that the complete preview can be reached by horizontal scrolling, including through keyboard interaction.

The actual capture is [here](/tmp/dosat-codex-long-preview-20261011.png). This is more than spacing polish.

**F2 — Accepted JSON can create an undiscardable pending batch.**

- **Location:** `src/causal_decision_editor.ts:60–67`, `:109–113`, `:172–178`, `:187–191`; integration at `src/causal_decision_ui.ts:187–191`.
- **Trigger:** Load an otherwise ordinary v1 satisfiability problem with graph `A` and JSON premises `"Pr(A)\r=1/2"`—a lone carriage return, rather than CRLF.
- **Observed:** Validation accepts the file. The row input displays `Pr(A)=1/2`, but internal `row.value` retains `\r`. Assigning that value to the batch textarea normalizes it to `\n`. Consequently, `pending()` becomes true immediately after Load.
- **Impact:** Run, Save and Copy are blocked despite there being no user batch edit. **Discard cannot clear the condition:** it repeats the same normalization mismatch. Parse instead produces two invalid rows, `Pr(A)` and `=1/2`. The loaded problem therefore changes into a misleading, trapped editing state.
- **Bounded remedy:** Establish one representable canonical value before applying loaded rows, and validate that representation before changing the problem. Alternatively, reject unsupported lone-CR premise input before mutation. Keep the solver/parser unchanged.
- **Regression:** Load this v1 case and verify either a clear rejection preserving the previous problem, or consistent visible/applied/batch values with no phantom pending state. Also retain CRLF, blank/comment physical-row and ordinary roundtrip coverage.

This is an edge case in accepted file input; it does **not** demonstrate an incorrect solver verdict. It does contradict the unconditional claims that loaded rows match visible state and that Discard always resolves pending batch edits.

The rest of the decisive evidence supports your assessment:

- All snapshot hashes match; the reduction and runtime solver are unchanged from `9ad6e1d`.
- I independently ran **84 UI unit tests and 29 scoped Chromium tests**, all passing. The latter include cancellation during a pending native check, settlement, stale-result suppression and subsequent reuse.
- Production screenshots show the agreed PrSAT styling, exact regime tables and undefined-conditioning qualification. I reproduced the default action positions: **760.625px desktop / 932.594px at 390px**.
- The inspected rendering, exact arithmetic presentation, physical-row errors, task/draft distinction, ordinary JSON roundtrips and empty-premise validity behave as you describe.

Your grammar, hidden-batch wording, conclusion ergonomics and algebraic-value presentation observations remain optional polish. Chromium’s validation-link focus is positively covered by the passing browser test; broader browser and real screen-reader behavior remains unverified.

**Phase gate: FAIL.** The closed Phase 3 mathematical PASS remains unaffected. The UI gate needs these repairs, affected regressions and a scoped consensus recheck.

VERDICT: DISAGREE

## Claude  (verdict: AGREE, 2m 57s)
CHECKPOINT
elapsed: ~35 min total (about 15 min this round)
tentative_verdict: Phase gate: FAIL. I now agree with Codex.
new_results: NEW: I reproduced F1 and F2 myself in headless Chromium against the production package at `127.0.0.1:4173/dist/decision.html`. F1 also occurs with a realistic input: the back-door identity entered as a premise. F2 has the same cause in the loaded graph and conclusion fields, and those variants already existed in the baseline load code. I also found F3: on mobile, the submitted conclusion in a countermodel overflows its box. The only way to reach it is to scroll the whole results panel, and it has no keyboard-reachable scroll container.
current_obstruction: none
next_bounded_step: done. Repair F1+F3 and F2, add the regression tests below, then run a scoped recheck.
token_cost: unavailable
END CHECKPOINT

## I was wrong to give PASS

My first-round PASS relied on the package probe's page-width check, `documentWidth = 390`. That check cannot detect content hidden by `overflow: hidden`, so I withdraw the PASS. Codex's two findings are real; I reproduced both independently. Probe scripts and screenshots are in `/tmp/dosat-claude-r2/` (`probe*.cjs`, `long-390.png`, `backdoor-390.png`, `conclusion-390.png`).

## F1: long premise previews are cut off on mobile and cannot be scrolled (confirmed; blocker)

**Why it happens:** below 601 px wide, `.decision-row` is no longer a grid (`causal_decision_style.css:66-70`). The preview `<span class="constraint decision-preview">` from `causal_decision_editor.ts:116` therefore stays an inline element, and `max-width` / `overflow-x: auto` (`:39`) have no effect on inline elements. The editor panel then clips the overflow with `overflow: hidden` (`:65`).

**Measurements:**

| Viewport | Premise | Display | Preview width | Preview right edge | Row right edge | Scrollable? |
|---|---|---|---|---|---|---|
| 390 px | 16 `Pr(Z)` terms | inline | 1145 px | 1176 | 363 | No: client/scroll width 0/0, `scrollLeft` stays 0 |
| 320 px | 16 `Pr(Z)` terms | inline | 1145 px | 1176 | 293 | No (same) |
| 1280 px | 16 `Pr(Z)` terms | block | 526 px | — | — | Yes: client 526, scroll width 1207 |

- **Realistic case:** the back-door identity `Pr(Y | do(X)) = Pr(Y | X & Z)*Pr(Z) + Pr(Y | X & ~Z)*Pr(~Z)` as premise 1 at 390 px. The preview is 510 px wide and is cut off after "…+ Pr" (`backdoor-390.png`). Run stays enabled and the page width stays 390.
- **Why it blocks:** it breaks agreed acceptance check 10 ("long formulas" at 390 px) and the purpose of the design's rendering row, which is showing how a `do()` term was read. Nothing restores the hidden part of the formula.

## F3 (new; repair together with F1): the countermodel's submitted conclusion overflows on mobile

- **Location:** `causal_decision_results.ts`, the `div.decision-rendered-formula` inside the submitted-conclusion block. Its `overflow-x` is `visible`.
- **Trigger:** at 390 px, choose example 8, change the conclusion to the incorrect back-door form ending `*Pr(Z)`, and run. The result is DOES NOT ENTAIL.
- **Measured:** the formula box has client width 337 and scroll width 496, and the `math` element's right edge is at 523.
- **Why it is only partly hidden:** the action panel itself is `.model-finder { overflow-x: auto }` (`style.css:271`; client 356, scroll 506). Scrolling the whole panel sideways does reveal the formula. But that panel is not a keyboard-focusable region, and scrolling it moves Run/Cancel and the status out of view (`conclusion-390.png`).
- **Severity:** less severe than F1, because the formula can be reached. It weakens agreed checks 10 and 11, since the failed conclusion is visible for every result state only by accident.
- **Remedy:** use the same fix as F1.

**Bounded remedy for F1+F3:**
- Make every rendered-formula holder a block that fills the width and scrolls itself: the premise previews, the conclusion preview and `.decision-rendered-formula`. That means `display: block; max-width: 100%; min-width: 0; overflow-x: auto`.
- When a holder overflows, give it `tabindex=0`, `role=region` and an accessible name such as "Premise N preview" or "Submitted conclusion".
- Make no change to the solver or parser.

**Regression test, at 390 and 320 px:**
- Use the back-door premise and the long failed conclusion above.
- Assert all of the following: document width ≤ viewport; each formula holder has `scrollWidth > clientWidth`; setting `scrollLeft` (or pressing ArrowRight on the focused region) brings the formula's right edge into view; and Run stays inside the viewport width.

## F2: a lone carriage return in a loaded file (confirmed; required repair, low likelihood)

**Premise case (reproduced in Chromium at 390 px):** load a valid v1 satisfiability file with graph `A` and premises `"Pr(A)\r=1/2"`.
- The row displays `Pr(A)=1/2`, but the batch box holds `"Pr(A)\n=1/2"`.
- Run and Save are disabled, and the validation message reads "Batch edits are unapplied…".
- After Show Batch Input → Discard, nothing changes: Run and Save are still disabled and the same message remains.
- Editing the row does not clear the state either, because `mutate` only re-syncs the batch box when no draft existed before the edit.
- **Severity:** this trap is new in this phase. It breaks two agreed invariants: Load applies the problem directly, and Discard always resolves a pending batch.

**Same cause in the other loaded fields (my addition):**
- `conclusion: "Pr(A)\r=1/2"` passes validation as one line. The textarea then converts the `\r` to `\n`, so after Load the conclusion holds two lines, the previous problem is gone, and Run is blocked with "Fix the conclusion."
- `graph: "A ->\rB"` behaves the same way and ends with "Fix the graph."
- Both cases are recoverable by editing, but they break check 9: a load that should be rejected instead replaces the current problem.
- The graph and conclusion variants already existed in the baseline load code (`git show HEAD`, lines ~150-152), so they are not regressions. The rewritten load handler should still close them, because one fix covers all three fields.

**Remedy:** in the load handler, convert `\r\n` and lone `\r` to `\n` in `graph`, `premises` and `conclusion` before calling `parse_decision_input`, so the text that is validated is exactly the text that is applied. For defence in depth, do the same in `editor.setValue`. With this fix the premise example becomes the two lines `Pr(A)` and `=1/2`, which fail validation, so the load is rejected and the previous problem is kept. This matches how the baseline textarea treated the same text.

**Regression test:** load three fixtures, each with a lone CR in one field (premises, graph, conclusion). Each must either be rejected with the previous problem intact, or be applied with the visible text, the applied value and the batch text all equal and no pending batch. Keep the existing CRLF test, the blank/comment physical-row test and the ordinary round-trip test.

## Points of agreement and corrections
- The rest of my first-round evidence still stands, and Codex verified it independently:
  - scope hashes match;
  - 84/84 unit tests pass and Codex's 29/29 scoped Chromium tests pass, including cancellation, settlement, stale-result suppression and reuse;
  - Run's top edge sits at about 761 px on desktop and 933 px at 390 px;
  - the exact witness values and "undefined (zero denominator)" are shown;
  - errors land on the right physical row, and the task/draft distinction and empty-premise validity behave correctly.
- I withdraw polish item 7 as far as Chromium goes: Codex reports that a passing browser test already covers focus from the validation links.
- Polish items 1–6, 8 and 9 stay optional.
- The closed Phase 3 mathematical PASS is not affected. None of these findings produces a wrong solver verdict or a stale solve or export.

**Phase gate: FAIL.** Required repairs are F1 together with F3, and F2 covering all three loaded fields, each with the regression tests above, followed by a scoped consensus recheck.

VERDICT: AGREE

## Codex  (verdict: AGREE, 1m 11s)
CHECKPOINT
elapsed: ~11 min cumulative active work
tentative_verdict: Phase gate: FAIL; consensus reached.
new_results: NEW: Independently confirmed F3 in the production package and reproduced the lone-CR variants in graph, premises and conclusion.
current_obstruction: none for the audit; required repairs remain unimplemented.
next_bounded_step: done; repair the two groups below, run affected regressions, then obtain a scoped consensus recheck.
token_cost: unavailable
END CHECKPOINT

I endorse your revised verdict. **Phase gate: FAIL.** No material disagreement remains.

I independently confirmed F3 using the incorrect back-door conclusion at 390px: `.decision-rendered-formula` has client width **337px**, scroll width **496px**, and `overflow-x: visible`. Its MathML ends near x=523. The surrounding action panel becomes the horizontal scroller instead. This belongs with F1 in one bounded repair: give premise previews and submitted-conclusion formulas their own contained, named, keyboard-accessible scroll regions.

I also reproduced all three F2 fixtures. The graph and conclusion textareas normalize lone CR to LF after validation, replacing the previous problem with invalid displayed input. The premise variant additionally creates the undiscardable pending-batch state.

Your proposed normalization boundary is appropriate: normalize loaded text **before validation and before any mutation**, then apply exactly the validated representation. Keep graph/conclusion variants explicitly identified as inherited behavior addressed by this directly related load-integration repair; the new premise trap is the UI-phase regression.

The required repair groups are therefore:

- **F1 + F3:** contained formula scrolling in `causal_decision_editor.ts:116`, `causal_decision_results.ts:82` and `causal_decision_style.css`. Regressions at 390/320px must verify that the formula’s end is reachable by keyboard, its own container scrolls, and the action panel remains stationary and contained.
- **F2:** consistent loaded-text representation in `causal_decision_ui.ts:187–191` and `causal_decision_editor.ts:172–178`. Regressions must verify rejection without mutation or consistent application without phantom pending state, while preserving CRLF and physical blank/comment rows.

The passing **84 UI unit tests and 29 scoped Chromium tests**, snapshot verification, exact witness presentation, physical-row errors, task/draft distinction, empty-premise validity and cancellation/settlement evidence remain valid. Optional polish remains nonblocking. The closed Phase 3 mathematical PASS is unaffected.

Agreement on these repairs does not approve the current implementation to advance.

VERDICT: AGREE

