# Consensus debate — 2026-10-12 20:29

## Question
Review the completed current DoSAT phase. Give explicit Phase gate: PASS or FAIL, with material findings and exact counterexamples if any. Agreement on repairs is not PASS. This is the required implementation/publication gate after the completed optimization design debate; do not rerun that design debate or reopen untouched old phases.

Repository: /Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus
Review folder: reviews/constraint_implementation_2026-10-12T23-41-52Z
Published baseline: 0f519c08d0f478be001b3cfe31142389ed6056f9
Frozen actual source: source-snapshot.json and source-snapshot/ in this folder.

User requests implemented:
1. Pearl Figure 4.9-style admissions Simpson preset, preserving the supplied E/M/A table, with explicit aptitude U and career objectives Z, and no direct M->A arrow. See MATHEMATICS.md, independent-arithmetic.json, presets.json. Constructed positive Boolean mechanisms, not Pearl's numerical data, no latent-ID engine. Controlled gender effect holds with joint do(M,E); conditioning after do(M) remains selection. Prior three-node drafts are superseded.
2. Direct single-query entailment: premises AND NOT(original guarded conclusion). No premise consistency preflight. SAT checks the active constraints directly. Vacuous entailment is labeled accurately. Default 60 s QF_NRA-first and unbounded overall/NLSat remain unchanged; one selected query in SMT export.
3. All agreed optimization stages: inline polynomial arithmetic/exact rational folding/structural total-quotient sharing/bounded powers; solver-only intervention-specific ancestral pruning and constant kernel extraction; guard-preserving cancellation and support simplification; bounded fraction normalization with an eight-denominator-factor cap AND whole-expression cost/degree gates/fallback. See DECISION_SEMANTICS.md. Same polynomial encoding for both solver engines; integer-rational coefficients are allowed, variable division is eliminated.
4. Validate returned SAT models and countermodels against original mechanism bounds and guarded source premises/conclusion before exposing exact detached witnesses. No consistency preflight; failed certification is ERROR. Preserve cancellation/deadline settlement ownership and original metadata.
5. Raise causal graph node limit to 8 (parser/compiler/graph checking and help), with up to 256 rows per regime, and reject 9. The existing source/AST/expanded-SMT/resource budgets remain. No sibling PrSAT changes or service changes.

Scope: mathematical preservation/projection modulo mechanism bounds, exact arithmetic/partiality and explicit negation scope, intervention support and causal semantics, resource limits before expansion/serialization, SMT provenance, original-predicate validation, cancellation/fallback/context reuse, 8-node integration, preset/table/conclusion faithfulness and saved input/export/evaluator behavior. Compare actual changes to the baseline; old runtime/model-evaluator code is reference only where a current change depends on it. Existing unresolved inherited WASM portfolio/resource limitations remain qualified in DECISION_SEMANTICS.md. Do not expand this into an omnibus review of unrelated older code.

Verification: read VERIFICATION.md. 1343 unit passes (one inherited skip and one todo); independent 607-case native semantic oracle; 432000 production exact differential comparisons, zero mismatches; CE1,CE2,CE4,CE5,CE5b,CE6 permanent regressions; signed/zero quotient, whole-scope negation, algebraic witness, cancellation during original validation and reuse; 8-node dense255-mechanism/256-row and complete native witness tests; lint/types/build; 106 distinct Chromium cases with focused assertion-selector repair rerun; actual eight-file package probe across 1280/390/320 widths, 42 admissions exact evaluations, Save/Load, negative controlled-gender claim, and eight-node/new-intervention/ninth-node rejection. Timing metrics separately measure compilation/parsing/search/original validation/complete witness work. Reviewed package manifest preserved.

Use ordinary read-only source/shell tools for needed checks. Do not edit production, published/source-snapshot artifacts, or existing evidence. Each reviewer may write only namespaced files under this review folder: claude-* versus codex-*. Create/reset your own durable checkpoint file at start; append at least every 15 minutes of active work with elapsed time, tentative verdict, genuinely new results, obstruction, next bounded step, token/cost figures if available. Prefer bounded checks; do not launch unbounded solver jobs. Preserve every diagnostic. No recursive debates or model delegation. Returned reports at most 40000 output tokens; put longer evidence in a namespaced file and report its path. End with the runner-required VERDICT line; also state literal Phase gate: PASS or FAIL in the body.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 30m 14s (2 turns); Codex: 3m 04s (2 turns); total: 33m 18s

## Agreed answer
# DoSAT implementation/publication gate — final answer

## Phase gate: FAIL

One bug blocks this phase: the optimizer can report a false **ENTAILS** (a wrong theorem). Agreeing on the repair below does not make this a PASS. A scoped recheck is still needed after the fix. Publication is not approved, and source 0f519c0 stays live.

## C1 — the optimizer treats an exact nonzero decimal as zero

**Where:** `src/causal_decision_optimization.ts:382`. The frozen snapshot and the working tree are identical here.

```ts
case 'negation': {
  const inner = c.constraint
  if (this.opts.positivity && inner.tag === 'equal' && inner.right.tag === 'literal'
      && inner.right.value === 0 && massInfo.has(inner.left)) {
    return this.massNonzero(massInfo.get(inner.left)!)
  }
  ...
```

**Root cause:**
- The shortcut rewrites `~(mass = 0)` as "this mass is nonzero."
- It decides "the literal is 0" using the literal's JavaScript `number` (`.value`), not its exact value.
- The parser keeps the exact source spelling of a decimal, but `.value` can round to `0` when the decimal is nonzero.
- So `~(mass = ε)` is rewritten as `mass ≠ 0` even though ε is not zero.

**Exact counterexample (false ENTAILS):**

| Item | Value |
|---|---|
| Graph | single node `X` |
| Task | entailment |
| ε (literal input spelling) | `0.` followed by **350 zeros** followed by `1`, i.e. exactly 10⁻³⁵¹. `Number(ε) === 0`. |
| Premise | `Pr(X)=ε` |
| Conclusion | `~(Pr(X)=ε)` |
| Modes | both `regular=false` and `regular=true` |
| Correct answer | **DOES NOT ENTAIL** |
| Production answer | **ENTAILS** |

ε must be typed as that decimal. Writing it as an arithmetic expression does not trigger the shortcut.

**Why ENTAILS is wrong:**
- Setting the mechanism q = ε satisfies the premise and the mechanism bounds in either mode.
- Under that assignment the conclusion is fully defined and false.
- So a countermodel exists.

**What the optimizer actually emits for the countermodel query:**
- Non-regular mode: q = ε ∧ ¬(q > 0). The SMT contains `(assert (not (< 0 p_X_root)))`.
- Regular mode: the conclusion becomes the literal `false`, i.e. `(assert false)`.

Both are UNSAT, so the run reports ENTAILS. The original guarded encoding of the same problem is SAT. Validation against the original constraints only runs after a SAT result, so it never sees this case and the wrong theorem is reported silently.

**Control phrasings** (same graph, premise and ε, non-regular mode) both correctly return "not entailed":
- `Pr(X)!=ε`
- `~(Pr(X)-ε=0)`

**Second symptom of the same bug (wrongly reported as ERROR):**
- **Satisfiability** of `~(Pr(X)=ε)` together with `Pr(X)=ε` should be **UNSAT**, but returns **ERROR**.
- **Entailment** from those same contradictory premises to the conclusion `Pr(X)=1/2` should be vacuous **ENTAILS**, but returns **ERROR**.
- In both cases the optimized query finds a model, and validation against the original constraints correctly rejects it. The failure is loud rather than silent, but these still need regression tests.
- This is shown for that conclusion. It is not a claim that every conclusion produces ERROR.

**Scope of the defect:**
- Line 382 is the only place where the new optimizer makes a semantic decision from a literal's rounded `number` value.
- The inherited guard code has a similar `.value === 0` test, but it only adds a redundant guard that is then lowered exactly, so it does no harm.
- The existing randomized differentials missed C1 because their generators used only short literals (`0`, `1`, `1/2`, `1/3`, `2`). They never produced a decimal that rounds to zero.

**Evidence** (in `reviews/constraint_implementation_2026-10-12T23-41-52Z/`):
- `codex-underflow-false.json` and `codex-underflow-true.json`: full input spellings, formulas, and bounded native results showing the original encoding is SAT while production says ENTAILS.
- `codex-report.md`: the reproducible probe and full finding.
- `claude-underflow.spec.ts` and `claude-underflow.json`: reproduction through the production compiler and solver, both modes, the controls, and the second symptom.
- `codex-round2.json`, `.md`, `.log`: independent confirmation of the ERROR results.
- `claude-report.md` (Round 2 section).

## What is required before a PASS

1. **Repair:** decide zero from the exact source value, e.g. `literal_q(inner.right).isZero()`, instead of `inner.right.value === 0`.
2. **Permanent regression tests:**
   - the C1 countermodel in both regular and non-regular mode (expect DOES NOT ENTAIL);
   - satisfiability of `~(Pr(X)=ε)` with `Pr(X)=ε` (expect UNSAT);
   - entailment from those contradictory premises to `Pr(X)=1/2` (expect vacuous ENTAILS);
   - the two control phrasings, `Pr(X)!=ε` and `~(Pr(X)-ε=0)`;
   - an exact-zero spelling such as `0.000` (it should still take the nonzero shortcut);
   - the zero-root case.
3. **Rerun** the affected unit tests, the differential checks (with the literal generator extended to cover decimals that round to zero), and the browser checks.
4. **Explicit scoped consensus recheck** of the repair.

## Verified and unaffected by C1, within the scope tested

These results stand only for the inputs they actually exercised. They do not override C1.

- **Single-query entailment:**
  - Only premises ∧ ¬(original guarded conclusion) is checked; there is no consistency preflight.
  - The vacuity wording is accurate: "Premise consistency was not checked separately."
  - Export contains one query with one `check-sat-using qfnra-nlsat`.
  - Engine defaults are unchanged: 60 s QF_NRA first, unbounded overall/NLSat.
- **Validation against the original constraints:**
  - Original mechanism bounds and guarded premises are checked, and a countermodel must make the guarded conclusion false, before any exact witness is shown.
  - Failed validation returns ERROR.
  - Validation runs inside `awaitOperation` with stop checks first, so cancellation is reported as cancelled, not as a validation failure.
- **Optimizer rewrites (apart from C1):**
  - Each rewrite is either an exact polynomial identity or exact wherever the guards and bounds hold. This covers ancestral pruning, barren-node elimination, fixed-node constant kernels, quotient cancellation, and multiplying by nonnegative, guard-nonzero denominator factors.
  - Denominator guards always stay with their own atom or the whole negated scope.
  - Randomized exact differential on 2–8-node graphs: 10,700+ scenarios, about 10.3M comparisons, 0 mismatches.
  - Native Z3 on 400 random problems, optimized vs. direct original encoding: 0 disagreements. Ten pure-NLSat 4 s timeouts all resolved under the app's QF_NRA-first strategy with matching verdicts.
  - Production matrix: 39/39 settle in ≤26 ms with identical verdicts.
- **8-node integration:**
  - The limit is consistent across the parser, compiler, graph checker and help text, and a 9th node is rejected.
  - A dense 8-node graph (255 mechanisms) runs end to end with validated complete witnesses: 1, 5 and 17 regimes took about 1.6, 3.3 and 7.6 s under Node WASM.
- **Admissions preset:**
  - An independent Fraction calculation reproduces the supplied counts 60, 20, 40, 10, 10, 40, 20, 60.
  - Each of the 14 premises equals its CPT parameter.
  - All 8 conclusion clauses and all 14 listed evaluations are exact, and there is no M→A edge.
- **Integrity:**
  - Unit tests: 1343 passed, 1 skipped, 1 todo.
  - The 34 snapshot files match the working tree.
  - The 8 release-manifest hashes match.
  - A fresh build reproduces `dosat-CtGY0ufx.js` byte for byte.

**Non-blocking notes:**
- `README.md` was edited after the snapshot. The edit is documentation only and outside the release package. Any commit must keep `dist/index.html` together with `dist/assets/dosat-CtGY0ufx.js`.
- Witness extraction cost for the worst case (about 65 regimes × 256 rows) has not been measured. It is bounded and cancellable.
- The eight-node browser case was rerun on its own after a fix to the test's selector only.
- `VERIFICATION.md` has cosmetic missing spaces (e.g. "all32", "body3619").

**Phase gate: FAIL** because of C1. The repair, the regressions, the affected reruns and an explicit scoped recheck are required before PASS or publication.

## Claude  (verdict: DISAGREE, 28m 58s)
CHECKPOINT
elapsed: ~75 min wall-clock
tentative_verdict: Phase gate: PASS. No material defect and no counterexample found.
new_results: NEW: independent randomized exact differential of the production optimizer against the original guarded AST: 0 mismatches in 10,700+ scenarios and ~10.3M comparisons, including 6–8-node graphs. Native Z3 verdict comparison on 400 random problems (optimized vs. direct original encoding): 0 disagreements. Production SMT matrix: 39/39 inputs settle in ≤26 ms. Dense 8-node (255-mechanism) SAT runs end-to-end with complete validated witnesses. Independent Fraction check of the admissions preset is exact. Unit suite, snapshot hashes, release manifest and byte-identical rebuild all confirmed.
current_obstruction: none
next_bounded_step: done unless Codex raises a concrete counterexample
token_cost: unavailable
END CHECKPOINT

## Phase gate: PASS

I found no material defect and no counterexample. Every claim below I checked independently.

### Mathematical preservation (stages A–D) — checked by argument and by testing
**Argument from the code:** each rewrite in `src/causal_decision_optimization.ts` is either an exact polynomial identity, or an identity wherever the original guards and the mechanism bounds B hold:
- **Always-valid identities:**
  - Pruning to ancestors in the intervened graph.
  - Rule B: a barren terminal node is closed under flipping, and its kernels sum to 1.
  - Rule F: a node fixed in every row, with fixed parents, becomes a constant factor.
  - Literal 0/1 masses match the original `mass()` exactly.
- **Valid where the guards hold:**
  - `massQuotient` cancels only identical kernels and identical sums.
  - `fracF` and `compare` multiply only by reduced mass-denominator factors. These are nonnegative on B and nonzero under the guard.
  - `massNonzero` splits each guard into per-factor conditions.
- **Why the guards are always in scope:** `guard_div0_conditions_in_constraint` conjoins every denominator guard with its own atom, or with the whole negated scope. So no cross-multiplied atom is observable without its guards, even in nested-denominator guards.
- **Regular mode:** the unconditional `r·den = num` relies on den > 0 under the strict bounds. Non-mass quotients and negative powers keep total relations.

**Randomized testing** (`claude-random-differential.spec.ts`), on graphs of 2–8 nodes:
- **Inputs:** nested `~`, `&`, `v`, `->`, `<->`; `+ - * /`; powers including negative ones; plain, conditional, `do()` and `do()`-plus-evidence queries; free reals. Both strictly regular values and non-regular boundary values {0, 1}. Three arbitrary values for quotient auxiliaries at zero denominators.
- **Results:** 10,700+ scenarios and ~10.3M exact comparisons, with 0 mismatches.

**Native Z3** (`claude-z3-pairs*`):
- 400 random problems through the production `compile_decision_problem`, compared with the direct original guarded encoding.
  - 0 disagreements.
  - 10 optimized runs timed out at 4 s under pure NLSat. All 10 resolve within 15 s under the app's first-stage QF_NRA strategy, with matching verdicts.
- The production matrix (7 presets + 13 synthetic, both tasks): 39/39 inputs settle natively in ≤26 ms, and the direct and production verdicts are identical.

### Solver behaviour
- **Single-query entailment:** the run checks only premises plus the negated guarded conclusion; there is no preflight.
- **Accurate vacuity wording:** the ENTAILS message adds "Premise consistency was not checked separately."
- **Model validation before witnesses:** `validateOriginal` checks the original bounds and guarded premises, and requires the guarded conclusion to be false for a countermodel.
  - It runs inside `awaitOperation`, and stop checks come before the validity test, so a cancellation reports as cancelled rather than as a validation failure.
  - A failed validation returns ERROR.
- **Export:** it contains one query with one `check-sat-using qfnra-nlsat`. The engine defaults are unchanged.

### 8-node integration
- The limit of 8 is consistent across syntax, causal compilation, graph checking and the help text. The do-calculus rule checker is polynomial-time.
- A dense 8-node graph (255 mechanisms) runs end-to-end with validated complete witnesses. Times under Node WASM:

| Regimes | Witness rows | Time |
|---|---|---|
| 1 | 256 | 1.6 s |
| 5 | 1,280 | 3.3 s |
| 17 | 4,352 | 7.6 s |

### Admissions preset
- **Exact recomputation:** a separate Fraction calculation reproduces the supplied counts 60, 20, 40, 10, 10, 40, 20, 60.
- **Premises and CPT parameters:** each of the 14 premises equals its CPT parameter, because it conditions on the full parent set.
- **Conclusion and evaluations:** all 8 conclusion clauses and all 14 listed evaluations are exact, and there is no M→A edge.

### Integrity
- Unit tests: 1343 passed, 1 skipped, 1 todo.
- All 34 snapshot files match the working tree.
- The release manifest's 8 files have 0 hash mismatches.
- A fresh build to `/tmp` reproduces `dosat-CtGY0ufx.js` byte for byte (sha256 fa21b48c…).

### Non-blocking notes
1. **Post-snapshot edit:** `README.md` was edited at 20:02, after the 19:54 snapshot, and another actor has now staged the index. The edit is documentation only, accurate, and outside the release package. Any commit must keep `dist/index.html` together with `dist/assets/dosat-CtGY0ufx.js`.
2. **Witness cost scaling:** extraction grows with regimes × 256 rows, and the worst case of about 65 regimes is unmeasured. It is bounded, cancellable, and already described as instance-specific timing.
3. **Re-run after a test fix:** the eight-node browser case was re-run alone after a fix to the test's selector only. That is acceptable.
4. **Cosmetic:** `VERIFICATION.md` is missing spaces, e.g. "all32" and "body3619".

The full report is in `reviews/constraint_implementation_2026-10-12T23-41-52Z/claude-report.md`, with checkpoints in `claude-checkpoints.md`.

VERDICT: DISAGREE

## Codex  (verdict: DISAGREE, 2m 15s)
CHECKPOINT
elapsed: ~14 min
tentative_verdict: Phase gate: FAIL.
new_results: NEW: Reproduced false ENTAILS results in both regular and nonregular modes; the original countermodel encoding returns SAT. Frozen source and prepared-package hashes match.
current_obstruction: The new optimizer misclassifies an exact nonzero decimal as zero.
next_bounded_step: Repair exact-zero classification, add regressions, and obtain a scoped consensus recheck.
token_cost: unavailable
END CHECKPOINT

**Phase gate: FAIL.** I agree with the single-query architecture and original-predicate validation, but a concrete soundness counterexample prevents endorsing your PASS.

The new shortcut at [causal_decision_optimization.ts:382](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/constraint_implementation_2026-10-12T23-41-52Z/source-snapshot/src/causal_decision_optimization.ts:382) tests `inner.right.value === 0`. Accepted literals retain their exact source spelling when their JavaScript approximation rounds to zero. Consequently, this shortcut can rewrite `~(mass = ε)` as `mass != 0` even when ε is nonzero.

The exact counterexample is:

- Graph: `X`
- Task: entailment
- Premise: `Pr(X)=ε`
- Conclusion: `~(Pr(X)=ε)`
- ε’s input spelling: `0.` followed by **350 zeros** followed by `1`, giving exactly \(10^{-351}\).
- Both `regular=false` and `regular=true` reproduce the defect.

Use the actual decimal spelling; an arithmetic expression for ε does not trigger this shortcut.

The mechanism \(q=\varepsilon\) satisfies the premise and either set of mechanism bounds, while falsifying the fully defined conclusion. The correct answer is **DOES NOT ENTAIL**.

The optimizer instead produces:

- Nonregular: \(q=\varepsilon \land \neg(q>0)\).
- Regular: the countermodel conclusion becomes literal `false`.

Both formulas are UNSAT, and the production runtime returns **ENTAILS**. Original-predicate validation cannot catch this because it runs only after SAT.

I independently reproduced **original SAT versus production ENTAILS** using bounded native checks. Complete input spellings, formulas, and results are preserved in [codex-underflow-false.json](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/constraint_implementation_2026-10-12T23-41-52Z/codex-underflow-false.json) and [codex-underflow-true.json](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/constraint_implementation_2026-10-12T23-41-52Z/codex-underflow-true.json). The reproducible probe and full finding are documented in [codex-report.md](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/constraint_implementation_2026-10-12T23-41-52Z/codex-report.md).

The required repair is an exact-source zero test, such as `literal_q(inner.right).isZero()`. Add regressions for this countermodel in both modes, the zero-root case, and contradictory premises using the same decimal. Then rerun affected checks and obtain an explicit scoped consensus recheck.

Your differential results remain useful, but their tested inputs missed this literal boundary. Agreement on this repair does not constitute PASS.

VERDICT: DISAGREE



## Claude  (verdict: AGREE, 1m 16s)
CHECKPOINT
elapsed: ~90 min wall-clock
tentative_verdict: Phase gate: FAIL. I agree with Codex.
new_results: NEW: I reproduced Codex's false ENTAILS in both regular and non-regular mode, through the production compiler and solver. Two control phrasings give the correct answer. I found a second symptom of the same bug: a truly unsatisfiable problem returns ERROR. I also confirmed that line 382 is the only place where the new optimizer makes a semantic decision from a literal's rounded number value. Evidence: `claude-underflow.spec.ts` / `.json`, and the Round 2 section of `claude-report.md`.
current_obstruction: none
next_bounded_step: done. Repair this bug, add the regressions, then run a scoped recheck.
token_cost: unavailable
END CHECKPOINT

## Phase gate: FAIL

I withdraw my PASS. Codex's counterexample holds.

### Reproduction
I used ε = `0.` followed by 350 zeros then `1`, which is exactly 10⁻³⁵¹. `Number(ε)` is 0 in JavaScript.

| Graph | Premise | Conclusion | Mode | Production result | Correct |
|---|---|---|---|---|---|
| X | `Pr(X)=ε` | `~(Pr(X)=ε)` | non-regular | **ENTAILED** | does not entail |
| X | `Pr(X)=ε` | `~(Pr(X)=ε)` | regular | **ENTAILED** | does not entail |
| X | `Pr(X)=ε` | `Pr(X)!=ε` (control) | non-regular | not entailed ✓ | not entailed |
| X | `Pr(X)=ε` | `~(Pr(X)-ε=0)` (control) | non-regular | not entailed ✓ | not entailed |

- **Why the ENTAILS is wrong:** setting the mechanism to ε satisfies the premise and both kinds of bounds, and makes the fully defined conclusion false.
- **What the optimizer emits instead:** the countermodel query ends with `(assert (not (< 0 p_X_root)))` in non-regular mode, and with `(assert false)` in regular mode.
- **Why validation misses it:** the query is unsatisfiable, and validation only runs after a satisfiable result. So the wrong theorem is reported silently.

### Second symptom
The same bug also breaks unsatisfiable problems:
- **Satisfiability:** `~(Pr(X)=ε)` together with `Pr(X)=ε` is truly unsatisfiable, but it returns **ERROR**. The optimized query finds a model, and validation then rejects it.
- **Entailment from contradictory premises:** the same thing happens. It returns ERROR where the vacuous ENTAILS is correct.

Validation turns these cases into a loud failure rather than a wrong answer, but they still need regression tests.

### Root cause and scope
- **The bug:** `src/causal_decision_optimization.ts:382` decides whether the right-hand side is zero with `inner.right.value === 0`. That is the rounded JavaScript number, not the exact source value.
- **No other instance in the new optimizer:** I searched it for literal-value checks. Line 382 is the only one that drives a semantic decision.
- **A similar old check is harmless:** the inherited guard code has its own `.value === 0` test, but it only adds a redundant guard, and that guard is lowered exactly.
- **Why my earlier testing missed it:** my random generators used only short literals (`0`, `1`, `1/2`, `1/3`, `2`). They never produced a decimal that rounds to zero.

### Required before a PASS
- **Repair:** test the exact value, e.g. `literal_q(inner.right).isZero()`.
- **Regressions:**
  - the countermodel above, in both modes;
  - the unsatisfiable satisfiability case;
  - contradictory premises using the same decimal;
  - the two control phrasings;
  - an exact-zero spelling such as `0.000`, which should still take the shortcut.
- **Then:** rerun the affected unit, differential and browser checks, and get an explicit scoped recheck. Agreeing on this repair is not itself a PASS.

### What still stands from my first review
These parts are unaffected by the bug, and Codex agrees on the first two:
- the single-query architecture;
- validation against the original constraints;
- the release hashes and byte-identical rebuild;
- the preset arithmetic;
- the 8-node integration;
- my random differential results, which remain valid for the literals they actually generated.

VERDICT: AGREE

## Codex  (verdict: AGREE, 49s)
CHECKPOINT
elapsed: ~16 min cumulative active review
tentative_verdict: Phase gate: FAIL; consensus reached.
new_results: NEW: Independently confirmed ERROR for contradictory premises in both satisfiability and entailment. Source hashes still match the frozen snapshot.
current_obstruction: C1 remains unresolved; repair and scoped recheck are required.
next_bounded_step: Done for this review.
token_cost: unavailable
END CHECKPOINT

**Phase gate: FAIL.** I endorse your revised answer. No material disagreement remains.

The decisive finding is C1: testing the rounded `literal.value` misclassifies an exact nonzero decimal as zero, producing false **ENTAILS** results in both regularity modes. The required repair must determine zero from the exact source value.

I also independently confirmed your secondary symptom. With ε spelled as `0.` followed by 350 zeros and `1`, the contradictory premises `~(Pr(X)=ε)` and `Pr(X)=ε` return **ERROR**:

- Satisfiability should return **UNSAT**.
- Entailment with conclusion `Pr(X)=1/2` should return vacuous **ENTAILS**.

That explicit conclusion makes the second example reproducible; it is not a claim that every conclusion produces ERROR. Evidence is preserved in [codex-round2.json](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/constraint_implementation_2026-10-12T23-41-52Z/codex-round2.json).

Your remaining verification evidence stands within its tested scope. The exact-zero repair, agreed regressions, affected checks, and an explicit scoped consensus recheck are required before PASS. This agreement closes the review with **FAIL**, not approval to publish.

VERDICT: AGREE

