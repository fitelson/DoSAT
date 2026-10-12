# Consensus debate — 2026-10-11 21:55

## Question
Run the required development-phase consensus audit with explicit Phase gate: PASS/FAIL. Review ONLY the completed current delta: exact evaluation of new expressions in the returned shared-kernel causal model, valid-only live DAG preview/error handling, and one-page production packaging/redirects/legacy import integration. Independently inspect actual code/tests/package evidence. Evaluate exact numeric and algebraic fidelity, structural CPT mapping across query namespaces and new intervention regimes, free-variable provenance/no arbitrary completion, scoped Boolean definedness vs real undefinedness, numeric grammar/injection/resource bounds, native parser-Solver ownership/managed context/AST lifecycle, cancellation settlement/serialization and stale result suppression, model/task edit invalidation and original witness preservation. Verify DAG edge/node fidelity and bounds/cache/keyboard containment, no wrong not-a-DAG claim for support limits, and single-entry release/root-worker/isolation/retired-route correctness. Old mathPASS and untouched backend source are CLOSED; no broad old-code audit or new performance/dependency work.

Identify concrete material current issues with trigger/location/impact and bounded fix/test; separate optional later polish. Agreement on a repair list is FAIL until repaired/rechecked. If no blockers remain give explicit Phase gate: PASS. Both participants and synthesis must return compressed reports of at most40000outputtokens, preserving decisive arguments/counterexamples/qualifications/verdict; write longer details to a projectreviewfile and return its path. Use the runner's checkpoints and literal final VERDICT protocol. No model delegation/recursive calls or source edits. Reach consensus on the completed implementation gate.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 16m 32s (2 turns); Codex: 6m 34s (1 turns); total: 23m 06s

## Agreed answer
# Phase gate: FAIL

This covers only the completed delta since `109ec5b`. Two small blockers break criteria the review was required to check:
- the evaluation input parser accepts some malformed input;
- one support limit is reported as "not a DAG".

Neither one produces an unsound verdict, and both have small, local fixes. Everything else in the delta passes. The gate stays FAIL until both are fixed and rechecked.

## Blockers

### B1. The evaluation input parser accepts unbalanced parentheses
- **Location:** `src/causal_evaluation_syntax.ts:22`. If the direct parse fails, the input is wrapped as `(${active}) = 0` and parsed again.
- **Trigger:** inputs such as `Pr(Y)) + (Pr(X)`, `a) * (b` and `1) / (0`. The wrapper supplies the missing outer parentheses, so the text parses as an equation and passes the `tag === 'equal'` check.
- **Seen in the package UI** (Apache package, example 1 countermodel), for `Pr(Y)) + (Pr(X)`:
  - the field is not marked invalid;
  - the preview shows `Pr(Y)+Pr(X)`;
  - Evaluate is enabled and returns "Exact value in this model: 1".
- **Impact:** malformed text is accepted, previewed and evaluated. This breaks the authoritative-parser guarantee and the family's "Syntax error (not a wff)" contract.
- **Limits of the impact:**
  - the computed value always matches the preview;
  - constraint-level injection was not demonstrated, because the `equal` tag check rejects disjunction, conjunction and chained-equality forms.
- **Fix:** before the fallback wrapper, reject input unless its parentheses balance overall **and** the running depth never goes negative.
  - Checking overall balance alone is not enough, because `Pr(Y)) + (Pr(X)` balances overall.
  - With both conditions, the wrapper's outer parentheses enclose exactly the user's input.
- **Tests:**
  - The syntax spec rejects all three triggers above.
  - A UI spec asserts that the field has `aria-invalid="true"`, the preview is empty and Evaluate is disabled.

### B2. A support limit is labelled "Syntax error: not a DAG"
- **Location:** `src/causal_decision_ui.ts:86`. The classifier treats a message as unsupported input only if it contains `At most` or `limited to`.
- **Trigger:** the graph `F9007199254740992 -> Y`. The name fits the variable grammar, but its index is above `Number.MAX_SAFE_INTEGER`.
- **Seen in the package UI:** `Graph: Syntax error: not a DAG. … index … is too large.`
- **Impact:** this breaks the required invariant "no wrong not-a-DAG claim for support limits". Run stays blocked, so nothing unsound happens.
- **Fix:** in this classifier only, label the safe-integer index failure (the "too large" message) as "Unsupported input". The closed graph parser does not need to change. A typed error classification would be sturdier and can come later.
- **Tests:**
  - A UI test next to the six-node limit test requires "Unsupported", excludes "not a DAG", and checks that the preview is cleared and Run is disabled.
  - The existing cycle, self-edge and malformed-graph tests keep their current wording.

## What the recheck must cover
1. Both fixes and their new tests pass, along with the affected unit specs and Chromium cases.
2. TypeScript and lint pass, and the full unit suite still passes.
3. The source-snapshot hash set is refreshed.
4. The release package and manifest are rebuilt.
5. A native Apache check of the new package's bytes, headers and redirects passes.
6. A scoped consensus recheck returns an explicit **Phase gate: PASS**.

## Areas that pass

**Baseline integrity**
- All 27 frozen source hashes match.
- The closed modules (decision solver, reduction, causal compiler and parser) are unchanged since the baseline.
- TypeScript and ESLint pass.
- The unit suite passes: 1309 tests, plus one skipped and one todo.
- 12 focused headless Chromium tests pass.

**Exact numbers**
- Rational results stay exact, and nothing is converted to floating point.
- Algebraic results were checked by hand:
  - 1/Pr(X) = √2;
  - Pr(X)/Pr(Y|do X) = √(3/2);
  - Pr(Y) is a root of 81x⁴−108x³+18x²+12x−2 (≈0.50588), and substituting it back gives exactly zero;
  - b⁻³ = √8;
  - Pr(X)¹⁰²⁴ = 2⁻⁵¹².

**Mechanism mapping across queries and interventions**
- Each mechanism is looked up by node and parent assignment, not by parameter name.
- This holds with reordered snapshot rows, reversed parent-key order, user names that collide with internal ones, and interventions into parent configurations never seen observationally.
- Multi-parent probes agree with an independent factorization.

**Free variables**
- Variables missing from the returned model are rejected.
- No arbitrary values are filled in.

**Definedness**
- Real expressions are strictly undefined whenever a needed term is undefined: `(1/a)*0`, `b/b` and `(a-a)^-2` are all undefined.
- Constraints use the compiler's guarded form, so True/False means satisfaction in this model. For example, `1/a=2` and `~(1/a=2)` are both False when `1/a` is undefined.

**Model-value grammar, injection and size bounds**
- Model values must be rationals or bounded `root-obj` forms.
- `(ite…)` and `0)) (assert false)` are rejected.
- Nested powers are stopped by the compiler's size check.

**Native lifecycle**
- The parser's solver is always released and never runs `check()` or `model()`.
- One managed context is reused, and AST lifetimes are managed.
- z3-solver's `simplify` has no mutex, but the UI's busy gating prevents it from overlapping solver work.

**Cancellation and stale results**
- A result is accepted only after its native call settles.
- Busy status is released only on settlement.
- Results from a superseded evaluation are suppressed.

**Invalidation and witness preservation**
- Problem edits, Load, Examples and Run all clear the evaluation panel, abort any evaluation, and keep Run blocked until it settles.
- Editing an evaluation expression leaves the original witness, verdict and export unchanged.
- In the package, every original premise evaluates True and every conclusion False in the example 1 and 2 countermodels and the example 5 model.

**DAG preview**
- It shows exactly the declared nodes and edges.
- The crop is conservative, the preview is cached, and it sits in a keyboard-scrollable region.
- It is hidden for cycles, malformed input and support limits; B2 is only about the error label.

**Package and routes**
- The live Apache bytes match the manifest: 8 files, one HTML entry.
- The root service worker and the cross-origin isolation, MIME and no-cache headers are correct.
- Every retired route, including the root-level ones, returns 301 to `https://fitelson.org/DoSAT/`.
- The root `index.html` does not loop.

**Legacy import**
- Old model-finder saves and rule-checker counterexample exports share one `{version, graph, constraints, regular}` format.
- Both import as satisfiability problems.
- Files are validated before any state changes.

## Optional later polish (not blocking)
1. **Slow evaluations can't be interrupted.** `(Pr(X)+Pr(Y))^1024` over an algebraic model was still running after 90 s; `^128` takes about 1 s. This does not show the call never finishes, but there is no time bound. Cancellation is documented as waiting for the native call to finish. Possible remedies are interrupt-on-abort, exponentiation by squaring, or a soft time limit.
2. **Long rationals display as raw s-expressions,** because Z3 wraps its output across lines. The values are still exact; normalising whitespace before formatting fixes this.
3. **`dosat-*` assets are never long-cached.** The `.htaccess` rule only matches `index-*`. This predates the delta.
4. **Old pages remain in the tracked `dist/`:** `causal.html`, `decision.html` and `do_calculus.html`. The release package already excludes them.
5. **An empty graph is labelled "not a DAG".** This is a deliberate, tested choice.
6. **Long arcs pass close above intermediate nodes** in the DAG preview, but stay distinguishable.
7. **Two old, untouched specs are timing-sensitive:** solver cancellation and cancel-within-timeout. They can fail under concurrent load; repeated standalone runs passed.
8. **Enter doesn't run Evaluate** in the evaluation input.

No source, test or package files were changed during this review.

Detailed evidence is in `reviews/single_page_model_eval_2026-10-12T01-02-21Z/`:
- `claude-round1-review.md`
- `codex-round1-review.md`

**Phase gate: FAIL**, until B1 and B2 are repaired and a scoped recheck passes.

## Claude  (verdict: DISAGREE, 16m 05s)
CHECKPOINT
elapsed: ~45 min
tentative_verdict: Phase gate: FAIL until 2 small blockers (B1, B2) are repaired and rechecked. Everything else in the delta passes.
new_results: NEW: confirmed 2 small blockers in the real package UI (evaluation parser accepts non-wffs; a support limit is labelled "not a DAG"). Independently verified exactness, CPT mapping, definedness, lifecycle, end-to-end model fidelity, DAG preview, Apache bytes/headers/redirects, and legacy import. Full detail is in reviews/single_page_model_eval_2026-10-12T01-02-21Z/claude-round1-review.md
current_obstruction: B1 and B2 still need source fixes and tests, then a recheck.
next_bounded_step: Codex cross-checks B1/B2 and the PASS areas; after repair, recheck both fixes and their tests.
token_cost: unavailable
END CHECKPOINT

## Verdict: Phase gate FAIL (two small blockers; everything else passes)

**Phase gate: FAIL.** Two low-severity issues are blockers because they break criteria named in the brief. Both have small fixes. The math core, lifecycle and packaging all pass.

### B1. The evaluation parser accepts unbalanced input
- **Where:** `src/causal_evaluation_syntax.ts:22`. If the direct parse fails, the input is wrapped as `(${active}) = 0` and parsed again.
- **Trigger:** `Pr(Y)) + (Pr(X)` or `a) * (b`. The wrapper supplies the missing outer parentheses, so the text parses as an equation and passes the tag check.
- **Seen in the package UI** (example 1 countermodel): the field is not flagged invalid, the preview shows `Pr(Y)+Pr(X)`, Evaluate is enabled, and it returns "Exact value in this model: 1".
- **Impact:** malformed text is shown and evaluated as a valid expression. This breaks the "authoritative parser" claim and the family's "Syntax error (not a wff)" contract. The damage is limited:
  - the value always matches the preview;
  - constraint-level injection is still blocked by the `tag === 'equal'` check (disjunction, conjunction and chained-equality forms are rejected).
- **Fix:** before wrapping, reject input whose parentheses are unbalanced or whose running depth goes negative.
- **Tests:** reject `Pr(Y)) + (Pr(X)`, `a) * (b` and `1) / (0` in the syntax spec. The UI spec should show the field invalid, Evaluate disabled and no preview.

### B2. A support limit is labelled "Syntax error: not a DAG"
- **Where:** `src/causal_decision_ui.ts:86`. The classifier only treats messages containing `At most` or `limited to` as unsupported input.
- **Trigger:** the graph `F9007199254740992 -> Y`. The name fits the variable grammar, but its index is above `Number.MAX_SAFE_INTEGER`.
- **Seen in the package UI:** `Graph: Syntax error: not a DAG. … index … is too large.`
- **Impact:** this breaks the stated invariant "no wrong not-a-DAG claim for support limits". Run stays blocked, so nothing unsound happens.
- **Fix:** also treat `too large` as unsupported. A sturdier option is to call only cycle, self-edge, grammar and empty-graph errors "not a DAG".
- **Test:** add a case next to the six-node test asserting "unsupported" and no "not a DAG".

### Areas that passed independent checks
- **Baseline:**
  - All 27 source hashes match, and the old solver, reduction, compiler and parser are unchanged.
  - `tsc` and `eslint` pass.
  - The unit suite passes (1309, one skip, one todo).
- **Exact values:** I checked the algebraic results by hand.
  - 1/Pr(X)=√2; Pr(X)/Pr(Y|do X)=√(3/2).
  - Pr(Y) is a root of 81x⁴−108x³+18x²+12x−2 (≈0.50588).
  - b⁻³=√8; Pr(X)¹⁰²⁴=2⁻⁵¹².
  - Rationals stay exact and nothing is converted to floating point.
- **CPT mapping:** mechanisms are matched by node and parent assignment, not by parameter name. Reordered rows, colliding user names and interventions into unseen configurations all work.
- **Free variables:** names not in the returned model are rejected. Nothing is filled in arbitrarily.
- **Undefinedness:**
  - Real expressions are strict: `(1/a)*0`, `b/b` and `(a-a)^-2` are undefined.
  - Constraints use the compiler's guarded form, so `1/a=2` and `~(1/a=2)` are both False.
- **Injection and limits:** model values must be rationals or `root-obj` forms within size bounds. `(ite…)` and `0)) (assert false)` are rejected, and nested powers are stopped by the compiler's size check.
- **Native lifecycle:**
  - The parsing solver is always released and never runs `check()` or `model()`.
  - One context is reused.
  - z3-solver's `simplify` is not mutex-protected, but the UI's busy gating prevents overlap with solver work.
- **Cancellation and stale results:**
  - Stale results are suppressed.
  - Busy is released only after the native call settles.
  - Problem edits, Load, Examples and Run all clear the panel and keep Run blocked until it settles.
- **End-to-end in the package:** in the example 1 and 2 countermodels and the example 5 model, every original premise evaluates True and every conclusion False. The witness and verdict are unchanged afterwards.
- **DAG preview:**
  - It shows exactly the declared nodes and edges.
  - The crop is conservative, the preview is cached, and it is a keyboard-scrollable region.
  - It is hidden for cycles, malformed input and limits.
- **Package:**
  - The live Apache bytes match the manifest (8 files, one HTML page).
  - Isolation, MIME and no-cache headers are correct.
  - All retired routes, including the root-level ones, return 301 to `https://fitelson.org/DoSAT/`, and there is no `index.html` loop.
- **Legacy import:** old model-finder saves and rule-checker counterexample exports share the same `{version, graph, constraints, regular}` format. Both import as SAT problems, and files are validated before anything changes.

### Later polish (not blocking)
1. **Evaluation can't be interrupted.** `(Pr(X)+Pr(Y))^1024` with an algebraic model ran over 90 s without finishing (`^128` takes about 1 s). Cancel waits for it to finish and Run stays blocked; the only way out is reloading the page. This limit is documented. It could be eased by interrupting on abort, computing powers by squaring, or adding a soft time limit.
2. **Large rationals show as raw s-expressions** because Z3 wraps long output across lines. The values are still exact; normalising whitespace before formatting fixes it.
3. **Content-hashed `dosat-*` assets are never long-cached,** because the `.htaccess` rule only matches `index-*`. This predates the delta.
4. **Stale pages remain in the tracked `dist/`.** `causal.html`, `decision.html` and `do_calculus.html` are still there; the release package excludes them.
5. **Empty-graph wording.** It is labelled "not a DAG", which is a deliberate, tested choice.
6. **Long-span arcs** pass close above intermediate nodes but stay distinguishable.
7. **Two old, untouched specs are timing-sensitive** (solver cancellation and cancel-within-timeout). They failed when two test runs were concurrent and once in a standalone run. Repeated standalone runs all passed.
8. **Enter doesn't trigger Evaluate** in the evaluation input.

I made no changes to source, tests or packages; scratch probes were only in `/tmp`. The full report is in `reviews/single_page_model_eval_2026-10-12T01-02-21Z/claude-round1-review.md`.

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 6m 34s)
CHECKPOINT
elapsed: ~7 min this round
tentative_verdict: AGREE with Claude; Phase gate: FAIL
new_results: NEW: independently reproduced B1/B2 in the Apache package; verified frozen hashes, 1309 unit tests, 12 focused Chromium tests, exact multi-parent/algebraic probes, lifecycle integration and package responses.
current_obstruction: B1 and B2 remain unrepaired.
next_bounded_step: Repair both findings, rerun affected checks, refresh frozen/package evidence and obtain a scoped consensus recheck.
token_cost: unavailable
END CHECKPOINT

**Phase gate: FAIL.** I agree with Claude’s two blockers and found no additional material issue.

- **B1 — malformed evaluation input is accepted.** At `src/causal_evaluation_syntax.ts:22`, the fallback wrapper accepts `Pr(Y)) + (Pr(X)`, `a) * (b` and `1) / (0`. In the Apache package, the first trigger enables Evaluate, previews `Pr(Y)+Pr(X)` and returns 1. This is a validation failure; I found no demonstrated constraint injection. Require balanced parentheses **and nonnegative running depth** before wrapping. Balanced counts alone would miss these examples. Add parser rejection tests and UI assertions requiring an invalid field, empty preview and disabled Evaluate.

- **B2 — a support limit is falsely labelled “not a DAG.”** At `src/causal_decision_ui.ts:86`, `F9007199254740992 -> Y` produces that diagnosis because “too large” is missing from the support-limit classifier. Run remains blocked, but the message violates an explicit gate criterion. Classify this failure as unsupported input and test the wording, cleared preview and disabled Run. A scoped classifier repair suffices; changing the closed graph parser is unnecessary.

My independent checks support the remaining approval:

- All 27 frozen hashes match; the four closed compiler/parser/reduction/solver modules have no baseline delta.
- TypeScript, lint, all **1,309 unit tests**, and **12 focused headless Chromium tests** pass.
- Additional native-browser probes confirm multi-parent CPT mapping with reversed snapshot rows and parent-key order, including previously unsupported observational configurations. Exact results agree with independent factorization.
- Mixed algebraic probes return the expected exact quotient and quartic marginal; substituting the marginal into its polynomial yields exact zero.
- Source and binding inspection support exact substitution, rejection of unassigned variables, scoped Boolean guards versus real undefinedness, parser-Solver release, managed AST lifetimes, settlement-aware serialization, stale-result suppression and original-witness preservation.
- Package hashes, its single HTML entry, Apache isolation/MIME/worker headers, retired redirects and root `index.html` behavior all check out.

One qualification to Claude’s optional performance observation: a simplification still running after 90 seconds does not establish that it will never settle. Cancellation is documented as cooperative and settlement-dependent; that limitation does not add a blocker here.

The detailed evidence is saved in [codex-round1-review.md](</Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/single_page_model_eval_2026-10-12T01-02-21Z/codex-round1-review.md>). Agreement on these repairs leaves the gate **FAIL until repaired and rechecked**.

VERDICT: AGREE

## Claude  (verdict: AGREE, 27s)
CHECKPOINT
elapsed: ~50 min total (~5 min this round)
tentative_verdict: Phase gate: FAIL until B1 and B2 are repaired and an explicit scoped recheck passes. Codex and I agree on this.
new_results: NEW: read Codex's round-1 review file. There is no conflict on the blockers, their fixes, the polish items or what the recheck must cover. I accept Codex's two refinements (running depth for B1, a narrowly scoped classifier fix for B2).
current_obstruction: B1 and B2 are not yet repaired, so the gate cannot pass until they are fixed and rechecked.
next_bounded_step: done for this audit. Next is repair outside this review: fix both, run the affected unit and Chromium checks, refresh the source snapshot, release package and Apache evidence, then do a scoped consensus recheck.
token_cost: unavailable
END CHECKPOINT

## Consensus: Phase gate FAIL — fix two blockers, then recheck

I accept Codex's report and its two refinements:

1. **B1 fix needs the running-depth check.** Codex is right that checking only that the parentheses balance overall is not enough. `Pr(Y)) + (Pr(X)` balances overall but still gets through, because the depth drops below zero partway. My proposed fix already checked both conditions; the agreed fix spells this out: overall balance and a depth that never goes negative. With both, the wrapper's outer parentheses enclose exactly the user's input.
2. **The 90-second run is not proof that evaluation never finishes.** I concede the wording. All I showed is that `(Pr(X)+Pr(Y))^1024` over an algebraic model was still running at 90 s, with no promised time bound. Cancellation is documented as waiting for the native call to finish, so this stays optional polish, not a blocker.

I also agree that B2 can be fixed narrowly in `src/causal_decision_ui.ts`. Classify the "index … too large" failure as unsupported input and leave the closed graph parser alone. A typed error classification is optional later hardening.

### Agreed repair list (gate stays FAIL until rechecked)

**B1** — `src/causal_evaluation_syntax.ts:22`
- **Fix:** before the `(${active}) = 0` fallback, reject input unless its parentheses balance overall and the depth never goes negative.
- **Tests:**
  - The syntax spec rejects `Pr(Y)) + (Pr(X)`, `a) * (b` and `1) / (0`.
  - The UI spec shows `aria-invalid=true`, an empty preview and a disabled Evaluate button.

**B2** — `src/causal_decision_ui.ts:86`
- **Fix:** label the safe-integer index failure (`F9007199254740992 -> Y`) as "Unsupported input". Do not call it "Syntax error: not a DAG".
- **Tests:**
  - The UI test requires "Unsupported", excludes "not a DAG", and checks that the preview is cleared and Run is disabled.
  - Existing cycle, self-edge and malformed-input diagnostics keep their current wording.

### What the recheck must cover
- The affected unit specs and Chromium cases.
- A refreshed source-snapshot hash set.
- A rebuilt release package and manifest.
- A native Apache byte, header and redirect check on the new package.
- A scoped consensus recheck that returns an explicit **Phase gate: PASS**.

### Agreed as passing
- **Exact values:** rational and algebraic results are exact, with no floating-point conversion.
- **Mechanism (CPT) mapping:** mechanisms are matched by node and parent assignment across query names and new interventions, including configurations never seen observationally.
- **Free variables:** names missing from the returned model are rejected; nothing is filled in.
- **Undefinedness:** constraints use the scoped guards, so True/False is satisfaction in this model; real expressions are strictly undefined when any required term is.
- **Model-value grammar, injection and size bounds:** all hold.
- **Native lifecycle:** the parsing solver is released without `check()` or `model()`, and the context and expression objects are managed correctly.
- **Cancellation:** results are accepted only after the native call settles, and stale results are suppressed.
- **Invalidation and witness preservation:** problem edits clear the panel and abort evaluation; evaluation edits leave the original witness, verdict and export unchanged.
- **DAG preview:** exact nodes and edges, conservative crop, caching and keyboard-scroll region, apart from B2.
- **Package:** single entry, root service worker, isolation headers, retired-route redirects and legacy import all check out.

### Optional polish (not blocking)
- Cancelling a slow algebraic evaluation waits for it to finish, with no time bound.
- Long rational values show as raw expressions instead of fractions.
- The long-cache rule in `.htaccess` doesn't match the `dosat-*` asset names.
- Old HTML pages remain in the tracked `dist/` (the release package excludes them).
- An empty graph is still labelled "not a DAG".
- Long arcs pass close above intermediate nodes.
- Two old, untouched timing-sensitive specs can fail under load.
- Pressing Enter doesn't run Evaluate.

Details: `claude-round1-review.md` and `codex-round1-review.md` in `reviews/single_page_model_eval_2026-10-12T01-02-21Z/`.

VERDICT: AGREE

