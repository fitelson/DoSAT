# Consensus debate — 2026-10-11 11:54

## Question
Perform the required consensus RECHECK of the repaired PrSATdo phase1 using the consensus skill defaults: Claude Opus5.5/xhigh and GPT6.1Sol/xhigh. This is the existing phase's repair gate, not a new development phase. No recursive reviews/debates, model calls or delegation. Work read-only. Do not edit/commit/delete/push/deploy or change services. Browser tests only one process on strict5174; never use5317.

Workspace /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus.
Read reviews/PHASE1_REPAIR_RESOLUTION.md, reviews/PHASE1_REPAIRED_VERIFICATION.md, reviews/phase1_repaired_snapshot.json, and the initial consensus transcript reviews/phase1_scoped_consensus.md. Its settled mathematical assessment and scoped issue list are context for the recheck. **Focus on the current phase repair delta and its integration obligations**, not unrelated older code, and do not restart a general audit of untouched classical PrSAT. Spot-check that the repairs preserve the established phase semantics.

Initial consensus reached FAIL solely for F1 placeholder-token juxtaposition/aliasing and F2 fractional native timeout milliseconds. Both peers independently reproduced these. The Boolean acyclic independent-disturbance CPT representation, normalization, shared intervention mechanisms, zero-support behavior, conditioning/regularity and phase boundaries were approved. No additional material blockers were found.

Recheck actual changes:
- src/causal_syntax.ts: every query substitution is parenthesized; shared validate_causal_query_identifiers rejects unmatched reserved IDs after parse.
- src/causal.ts: same validator at direct compiler API boundary.
- src/causal_ui.ts: Math.round of validated seconds*1000, explicit search-time wording and witness-preparation status.
- Regression additions in src/causal_syntax.spec.ts, src/causal.spec.ts, src/causal_solver.spec.ts, src/causal_ui.spec.ts and tests/causal.spec.ts.

Verify agreed acceptance cases including malformed omitted* expressions, aliases, the query-27 exact-key alias, valid explicit multiplication/powers/unaryminus/constraintnegation ASTs, compiler-direct reservedID rejection, realZ3 root independence UNSAT, rounding16.1→16100,32.2→32200,1.0005→1001 with correct native solves, timer expiry UNKNOWN not a causal verdict, exact browser value-cell assertion, and complementary-event polynomial normalization UNSAT. Ensure parser bounds and rendering cancellation/stale input behavior remain intact. M4 reserved names is inherited/safe/out of scope; M5 valid compiler API fallback stays.

Candidate checks completed: lint/build pass;747 active unit tests pass,1 inherited skip,1 inherited todo across18 files;all32 headless Chromium tests pass. You may run focused acceptance checks and integration checks needed to verify the repair; those counts are evidence, not a substitute for inspecting the fixes. Source snapshot is frozen during review.

Each participant returns a compressed report at most40000 output tokens and within the runner's conservative40000-UTF8-byte guard, preserving decisive arguments/reproductions and qualifications. Follow the runner's checkpoints and final VERDICT:AGREE/DISAGREE protocol. Include explicit **Phase gate: PASS** only if required repairs are complete and no unresolved material phase1 issue remains. FAIL means confirmed material finding or incomplete audit; agreement on FAIL never authorizes advancement. List checks actually performed and any remaining nonblocking limits. No phase2 functionality is being requested or reviewed.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 10m 37s (2 turns); Codex: 6m 02s (1 turns); total: 16m 40s

## Agreed answer
# PrSATdo Phase 1 repair recheck

## Phase gate: PASS

Both required repairs are in place: F1, where probability placeholders could merge with adjacent text, and F2, where timeouts were passed as fractional milliseconds. I confirmed each one by reading the code and testing it adversarially, not only by running the supplied test suite. The approved Phase 1 semantics are unchanged. No unresolved material Phase 1 issue remains.

One test gap is worth fixing before Phase 2 (N1, §6): no permanent test fails if the new parentheses are removed. It does not block the gate, because the code is correct; it only leaves room for a later edit to bring the bug back unnoticed.

## 1. What changed, and integrity of the snapshot

- **Changed files:**
  - code: `src/causal_syntax.ts`, `src/causal.ts`, `src/causal_ui.ts`;
  - tests: `src/causal_syntax.spec.ts`, `src/causal.spec.ts`, `src/causal_solver.spec.ts`, `src/causal_ui.spec.ts`, `tests/causal.spec.ts`;
  - docs: `PROJECT.md` and two new review documents.
- **Before the repair:**
  - the parser appended the bare placeholder name, with no delimiters;
  - the UI computed `Number(timeout.value) * 1000` without rounding.
- **Hashes:** all 61 hashes in `phase1_repaired_snapshot.json` match the working tree, both before and after the checks. `git status` was unchanged throughout, and `git diff --check` exits 0.
- **No changes made:** no workspace files were edited, committed, deleted, pushed or deployed. Probes, source mutants and build/browser artifacts all stayed outside the workspace.
  - Port 5317 and the permanent services were not touched.
  - The browser suite ran as a single process on strict port 5174.

## 2. F1 (placeholders merging with adjacent text): resolved

### How the repair works

- **Delimiting** (`causal_syntax.ts:281–283`). Every `Pr(...)`, `P(...)` or `p(...)` is now replaced by the parenthesized `(CausalQueryN)`, so a placeholder can no longer fuse with neighbouring identifiers, numerals or other placeholders.
- **Check after parsing** (`causal_syntax.ts:306–307`). After each line is parsed, the inherited real-variable collector gathers every identifier. It walks all node types, including `divide`, `power`, `negative` and the binary nodes. Any identifier containing `CausalQuery` that is not one of the document's own query keys is rejected.
- **Check at the compiler** (`causal.ts:202–205`). The same shared function, `validate_causal_query_identifiers`, runs on the free variables of every constraint passed directly to the compiler API. The existing check for the reserved prefix in raw text (`causal.ts:98`) remains as well.
- **Parser bounds are unaffected.** The new parentheses replace the ones from `Pr(...)` one for one:
  - nesting depth is unchanged;
  - token count falls (`Pr ( X )` is 4 tokens, `( CausalQueryA )` is 3);
  - no AST nodes are added.

### Agreed acceptance cases (all present, all pass)

- **Rejected as "Invalid constraint":**
  - `Pr(X & Y) != Pr(X)Pr(Y)`;
  - `Pr(X)x=5`, `Pr(X)P(Y)=5`, `Pr(X)e=5`, `Pr(X)(Y)=5`, `Pr(X) (Y)=5`.
- **Query-27 exact-key alias:** the 26-line version is rejected.
- **Valid forms still parse to the same ASTs:** `Pr(X)*Pr(Y)`, `Pr(X)^2`, `-Pr(X)`, `~(Pr(X)=1/2)`.
- **Calling the compiler directly:**
  - `CausalQueryAx`, `fooCausalQueryA`, `CausalQueryACausalQueryB` and `CausalQueryAA` are rejected;
  - an exact registered key is still accepted.
- **Real Z3, root independence:** `Pr(X & Y) != Pr(X)*Pr(Y)` on graph `X; Y` is UNSAT.
- **Browser:** malformed juxtaposition disables Find; the version with an explicit `*` returns UNSAT.

### Adversarial checks

**Hand-picked cases.** 44 juxtaposition variants went through both the causal parser and the classical `parse_constraint`. The causal parser accepted a string exactly when the classical parser did, and every string accepted by both gave the same AST.
- Rejected by both:
  - `2Pr(X)`, `2 Pr(X)`, `xPr(X)`, `Pr(X) x`, `x(Pr(X))`;
  - `(2)(Pr(X))`, `(Pr(X))(Pr(Y))`, `Pr(X)^2Pr(Y)`;
  - `Pr(X)=1/2Pr(Y)=1/2`, `Pr(X)1.5`, `Pr(X).5`.
- Accepted by both, with the same AST: `~Pr(X)=1/2`, `Pr(X)/Pr(Y)`, `Pr(X)>Pr(Y)`.

**Differential fuzz.** 300,000 random strings were generated (seed 12345) from a 43-token alphabet that includes merge-prone pieces: `Pr(X)Pr(Y)`, `Pr(X)A`, `P(Y|X)P(X)`, `CausalQ`+`uery`, `AA`, and bare `Pr`/`P`/`p`. For the classical parser, whitespace before `(` was normalized, because the causal syntax deliberately allows it.

| Outcome | Count |
|---|---|
| Whitespace-only, skipped (the causal parser treats blank input as an empty document) | 2,714 |
| Rejected by both parsers | 294,404 |
| Accepted by both, same AST and query order | 2,882 |
| Accepted only by the causal parser | **0** |
| Accepted only by the classical parser | **0** |
| AST mismatches | **0** |

**Aliasing, three ways (real Z3):**

| Form | Repaired code | Mutant without parentheses |
|---|---|---|
| Same line: `Pr(X)A + 26×Pr(X\|do(X=1)) = 1/3 + 26` | rejected as a parse error | **accepted; aliases query 27; UNSAT with no free variables** |
| 26 separate lines, alias on line 1 | rejected | rejected by the check after parsing |
| Alias on a late line (line 27) | rejected | rejected by the check after parsing |

The same-line expression written correctly, without the adjacent `A`, is SAT, with the first query exactly `1/3`.

### Mutation checks

The causal unit specs (147 tests) were rerun against mutated copies of `src/`:

| Mutation | Result |
|---|---|
| Remove `Math.round` | 3 UI tests fail |
| Remove the compiler check | 4 compiler-API tests fail |
| **Remove the parentheses** | **147/147 pass** |
| Remove the check after parsing | 147/147 pass |

Why each check behaves this way:
- **Parentheses.** The check after parsing runs line by line. In the existing 26-line alias test, `CausalQueryAA` is not yet a registered key when line 1 is checked, so that check rejects it on its own. The `Pr(X)Pr(Y)` unit and browser cases are caught the same way. Only the same-line form needs the parentheses, and no permanent test covers it (N1).
- **Check after parsing.** With the parentheses present, this check can never be triggered: the raw-text prefix check plus delimiting already cover every case. It is harmless defence in depth and has its own direct unit test.

## 3. F2 (fractional timeout milliseconds): resolved

- **Code.** `causal_ui.ts:144` reads `Math.round(Number(timeout.value) * 1000)`.
  - The input is validated to 0.1–120 s at `causal_ui.ts:51` immediately beforehand, with no `await` in between, so the value is always an integer in [100, 120000].
  - The same integer goes to the JavaScript timer and to the native `solver.set('timeout', …)` in `WrappedSolver` (`z3_integration.ts:925`).
- **UI mock tests.** `solve` receives exactly `16.1 → 16100`, `32.2 → 32200` and `1.0005 → 1001`, each asserted to be an integer.
- **Real Z3.** The test helper reproduces the same rounding and passes the result to `WrappedSolver.solve` (`causal_solver.spec.ts:15`). All three limits solve SAT with exact value `1/2`.
- **Browser.** For 16.1, 32.2 and 1.0005 s, the end-to-end tests fill in the time-limit field and get SAT, with the value cell showing `1/2`. Before the repair these inputs produced "Error", so these tests do detect the defect.
- **Timer expiry.** A deterministic test uses fake timers at 0.1 s and a mock solver that only finishes when aborted. It checks that:
  - the status reads exactly `UNKNOWN — time limit reached.`;
  - no witness tables are shown;
  - the search controls are re-enabled.
  
  If Z3's own timeout fires first, the separate status `UNKNOWN — the solver did not settle…` appears instead. Neither path ever reports SAT or UNSAT.

## 4. Minor items and integration requirements

- **M1:** the browser zero-support intervention test checks the value cell exactly: `tests/causal.spec.ts:41` uses `.getByRole('cell').nth(1)).toHaveText('1')`.
- **M2:** the complementary-event normalization test is permanent. `Pr(Z|do(Y=0)) + Pr(~Z|do(Y=0)) != 1` on `X->Y; Y->Z` is UNSAT with real Z3. Neither event covers every row, so `mass()` cannot take its literal-one shortcut, and the polynomial identity is actually exercised.
- **M3:** the only lifecycle change is a new status, "Preparing exact model tables…", set before `showModel`, plus updated label and help text.
  - Unchanged: the check for edits and cancellation before each exact evaluation, the final check before rendering, and the status handling in catch/finally.
  - Still passing: tests that cancel during the first and the last exact evaluation, tests where an edit aborts a run and its stale result is suppressed, and the gating that waits for the solver to reload.
- **M4:** the incomplete list of reserved names is inherited, fails safely, and stays out of scope.
- **M5:** the valid fallbacks for observational queries passed directly to the compiler API are retained, and the test for the older AST format passes.
- **Parser and compiler bounds (timed):**
  - nesting depth 63 around `Pr(X)` parses in 2.5 ms, and depth 64 is rejected by the existing limit;
  - the 512-token, 64-query and 4,096-character limits are enforced before parsing;
  - 64 queries on a complete 6-node graph compile in 11 ms.
- **Spot check of the approved semantics.** The compiler is unchanged apart from the validator call. The fuzz shows the substituted ASTs are exactly what the classical parser gives with each `Pr` replaced by its query variable. The browser tests for confounding, mediation, zero support, simultaneous intervention and exact numerals all pass.

## 5. Checks performed

| Check | Result |
|---|---|
| Inspection of the required records, repair code and new regression tests | Complete |
| Frozen snapshot hashes, before and after | All 61 match |
| `npm run lint`; `npx tsc --noEmit`; `git diff --check` | All pass |
| `npx vitest --run` | 747 passed, 1 inherited skip, 1 inherited todo, 18 files, in 12 of 13 full runs; the other run had one failure that was never identified (N3) |
| `npx vite build` to a temporary directory | Both pages build; every corresponding asset is byte-identical to the current `dist/`; `dist/causal.html` loads the repaired `causal-CbJUQ2it.js` |
| `npx playwright test --project chromium`, one worker, strict port 5174 | 32 passed (13 causal, 4 of them new; 19 classical) |
| Supplementary probes | 44 hand-picked juxtaposition cases; the 300,000-string differential fuzz; the alias variants with real Z3; 4 source mutations with the causal suite rerun on each; bounds timing; normalization and root-independence UNSAT checks |

## 6. Remaining limits (none blocking)

- **N1: no test isolates the parentheses.** Recommended test-only addition in `causal_syntax.spec.ts`, optionally with a real-Z3 version in `causal_solver.spec.ts`:
  ```ts
  const line = 'Pr(X)A + ' + Array(26).fill('Pr(X | do(X=1))').join(' + ') + ' = 1/3 + 26'
  expect(() => parse_causal_document('X', line)).toThrow(/Invalid constraint/)
  ```
  Optionally, also make the existing juxtaposition tests assert a parse error rather than a reserved-identifier error, so that the parentheses and the check after parsing are each tested on their own.
- **N2: error columns are off.** Parse-error column numbers refer to the internally substituted text. For example, `Pr(X)Pr(Y)` reports "At column 15" when the problem is at column 6. The offset predates the repair and is now slightly larger; it is cosmetic.
- **N3: one unidentified unit-test failure.** One of 13 full unit runs had a single failure that was not captured or traced to a test. All other runs passed with 747. Attributing it to the inherited, unchanged timing tests in `z3_integration.spec.ts` is a guess. No causal or repair test failed in any run whose results were captured.
- **N4: stale bundles in `dist/`.** Old files from earlier builds (`causal-37XYJW8w.js`, `causal-CaYCHx5P.js`) remain because the build uses `emptyOutDir: false`. Nothing references them, and deployment is disabled.
- **Out of scope for Phase 1, as before:**
  - ID/IDC identification;
  - latent confounding;
  - counterfactuals across worlds;
  - stochastic or propositional interventions;
  - cycles;
  - non-Boolean variables;
  - graphs with more than 6 nodes.

Phase 2 functionality was not reviewed.

**Phase gate: PASS.**

## Claude  (verdict: DISAGREE, 10m 15s)
CHECKPOINT
elapsed: ~25 min
tentative_verdict: Phase gate PASS. Both required repairs (F1, F2) are present, correct, and independently confirmed; one non-blocking test-coverage gap (N1) is recommended for follow-up.
new_results: NEW: all 61 repaired-snapshot hashes match, before and after my checks. Lint, tsc, unit (747/1 skip/1 todo, repeated 11×; one earlier run had an unidentified failure, see N3), e2e (32/32 on strict port 5174) and a /tmp build byte-identical to dist/ all pass. 44 hand-picked juxtaposition cases plus a 300,000-string differential fuzz: 0 strings accepted by the causal parser but not classical PrSAT, 0 AST differences. Mutation checks: the compiler validator and Math.round are guarded by the new tests, but removing the parentheses passes every permanent test. A same-line query-27 alias shows why that matters (N1). Parser bounds and the cancellation/stale-input paths are unchanged.
current_obstruction: none for the gate. N1 is a gap in regression protection, not a defect in the candidate.
next_bounded_step: Codex cross-checks, especially whether N1 blocks the gate; then a final verdict
token_cost: unavailable
END CHECKPOINT

# PrSATdo Phase 1 repair recheck

## Phase gate: PASS

Both required repairs are in place. I confirmed each one by reading the code and testing it adversarially, not only by running the supplied suite. The approved semantics are unchanged: the substituted text gives the same ASTs as before, the compiler did not change apart from the validator call, and normalization, intervention and timeout behaviour pass with real Z3. I found no unresolved material Phase 1 issue.

There is one gap I recommend fixing. **N1:** no permanent test fails if the new parentheses are removed. The code is correct today; a later edit could silently reintroduce the aliasing bug.

## 1. Repair boundary and integrity

- **What changed.** Comparing `phase1_snapshot.json` with `phase1_repaired_snapshot.json`, the changed files are:
  - `src/causal_syntax.ts`, `src/causal.ts`, `src/causal_ui.ts`;
  - five spec files: `src/causal_syntax.spec.ts`, `src/causal.spec.ts`, `src/causal_solver.spec.ts`, `src/causal_ui.spec.ts`, `tests/causal.spec.ts`;
  - `PROJECT.md`, plus two new review documents.
- **Pre-repair code.** I recovered the old versions from the initial review's Claude stream:
  - In the old `causal_syntax.ts`, line 269 was `substituted += … + name`. It is now `` `(${name})` `` (current line 283), and the new validator call has been added.
  - The old `causal_ui.ts` used `const milliseconds = Number(timeout.value) * 1000`.
- **Hashes.** All 61 snapshot hashes match the working tree, before and after my checks. `git status` is unchanged (12 modified, 24 untracked), and `git diff --check` exits 0.
- **No changes made.** I edited no workspace files and did not commit, push or deploy. All probes and mutants ran under `/tmp/prsatdo_recheck`. Port 5317 was already in use by an unrelated node process; I left it alone. Port 5174 was free, and the browser suite ran in one process.

## 2. F1 (probability placeholders merging with adjacent text): resolved

### What the code does now

- **Delimiting** (`causal_syntax.ts:281–283`). Every `Pr(...)`, `P(...)` or `p(...)` becomes `(CausalQueryN)`, so a placeholder can no longer fuse with neighbouring text.
- **Parse-time validator** (`:306–307`). After each line is parsed, it collects all real-variable ids with the inherited collector. That collector recurses through `divide`, `power`, `negative` and the binary nodes, so nothing is skipped. Any id containing `CausalQuery` that is not one of the document's own query keys is rejected.
- **Compiler validator** (`causal.ts:202–205`). The same check runs on the free variables of every constraint before anything else uses them. The old pre-substitution check for the reserved prefix in the raw text (`:98`) is still there.
- **Bounds.** The parentheses replace the parentheses of `Pr(...)` one for one. So:
  - nesting depth is unchanged;
  - the token count drops (`Pr ( X )` is 4 tokens, `( CausalQueryA )` is 3);
  - no AST nodes are added.

### Agreed acceptance cases

All are present and pass:
- These are rejected with "Invalid constraint":
  - `Pr(X & Y) != Pr(X)Pr(Y)`, `Pr(X)x=5`, `Pr(X)P(Y)=5`, `Pr(X)e=5`;
  - also `Pr(X)(Y)=5` and `Pr(X) (Y)=5`.
- The 26-line query-27 alias case is rejected.
- `Pr(X)*Pr(Y)`, `Pr(X)^2`, `-Pr(X)` and `~(Pr(X)=1/2)` still give the expected ASTs.
- Compiler-API tests reject `CausalQueryAx`, `fooCausalQueryA`, `CausalQueryACausalQueryB` and `CausalQueryAA`, while an exact key passed through the API is still accepted.
- With real Z3, `Pr(X & Y) != Pr(X)*Pr(Y)` on graph `X; Y` is UNSAT.
- The browser test shows the malformed input disables Find, and the version with `*` returns UNSAT.

### Independent adversarial checks

**Hand-picked cases.** I ran 44 juxtaposition variants through both the causal parser and the classical `parse_constraint`. The causal parser accepted a string exactly when the classical parser did, and where both accepted, the ASTs matched. Examples:
- rejected by both: `2Pr(X)`, `2 Pr(X)`, `xPr(X)`, `Pr(X) x`, `x(Pr(X))`, `(2)(Pr(X))`, `(Pr(X))(Pr(Y))`, `Pr(X)^2Pr(Y)`, `Pr(X)=1/2Pr(Y)=1/2`, `Pr(X)1.5`, `Pr(X).5`;
- accepted by both, with the same AST: `~Pr(X)=1/2`, `Pr(X)/Pr(Y)`, `Pr(X)>Pr(Y)`.

**Differential fuzz.** I generated 300,000 random strings from a 43-token alphabet that includes merge-prone pieces (`Pr(X)Pr(Y)`, `Pr(X)A`, `P(Y|X)P(X)`, `CausalQ`+`uery`, `AA`, bare `Pr`/`P`/`p`). Whitespace before `(` was normalized for the classical side, because the causal syntax deliberately allows it. Results:
- 2,882 strings accepted by both, all with matching canonical ASTs and query order;
- 294,404 rejected by both;
- **0** accepted only by the causal parser, **0** AST mismatches, **0** accepted only by the classical parser.

**Aliasing in three forms** (real Z3):

| Form | Repaired code | Mutant without parentheses |
|---|---|---|
| Same line: `Pr(X)A + 26×Pr(X\|do(X=1)) = 1/3 + 26` | rejected (parse error) | **accepted, UNSAT, no free variables** |
| 26 separate lines, alias on line 1 | rejected | rejected by the validator |
| Alias on a late line (line 27) | rejected | rejected by the validator |

### N1 (non-blocking, recommended): the parenthesization has no regression test

I ran the causal unit specs against mutated copies of `src/` in `/tmp` (147 tests):

| Mutation | Result |
|---|---|
| Remove `Math.round` | 3 UI tests fail |
| Remove the compiler validator | 4 compiler-API tests fail |
| **Remove the parentheses** | **147/147 pass** |
| Remove the parse-time validator | 147/147 pass |

**Why the parentheses mutation goes undetected.** The validator runs line by line. In the agreed 26-line alias test, `CausalQueryAA` is not yet a registered key when line 1 is checked, so the validator rejects it without any help from the parentheses. The `Pr(X)Pr(Y)` cases (unit and e2e) are also caught by the validator alone.

**What this means.** Only the same-line form needs the delimiter. The current code handles it correctly, but no test covers it. The resolution document says "parentheses also fix the exact-key 27th-query alias"; that is true of the code, but the permanent test does not exercise it.

**Why it is not blocking.** The code is correct, the agreed acceptance cases were met as written, and the gap was in our own acceptance specification.

**Recommended test-only addition.** Add one case in `causal_syntax.spec.ts`, and optionally a real-Z3 version in `causal_solver.spec.ts`:
```ts
const line = 'Pr(X)A + ' + Array(26).fill('Pr(X | do(X=1))').join(' + ') + ' = 1/3 + 26'
expect(() => parse_causal_document('X', line)).toThrow(/Invalid constraint/)
```
Optionally, also make the existing juxtaposition tests check that the error is a parse error and not a "reserved" error. Then the delimiter and the validator are tested independently.

The parse-time validator cannot be reached when the parentheses are present: the raw prefix check plus delimiting cover every case. It is harmless defence in depth and has its own direct unit test.

## 3. F2 (timeout milliseconds): resolved

- **Code.** `causal_ui.ts:144` now reads `Math.round(Number(timeout.value) * 1000)`. Input is validated to 0.1–120 s at `:51` immediately beforehand, with no await in between, so the value lies in [100, 120000] and is always an integer. The same value goes to the JavaScript timer and to the native `solver.set('timeout', …)` in `WrappedSolver` (`z3_integration.ts:925`).
- **UI mock tests.** They assert that `solve` receives exactly 16100, 32200 and 1001, and that each is an integer.
- **Real Z3.** The real-Z3 tests compute the same rounding themselves rather than calling the UI. The helper passes the value into `WrappedSolver.solve` (`causal_solver.spec.ts:15`), and all three solve SAT with exact value 1/2.
- **Browser.** For 16.1, 32.2 and 1.0005, the e2e tests fill the time-limit field and get SAT with the value cell showing `1/2`. Before the fix these values produced "Error", so these tests would have caught it.
- **Timer expiry.** A deterministic test uses fake timers at 0.1 s and a mock solver that only finishes on abort. It checks that the status reads exactly "UNKNOWN — time limit reached.", no result tables appear, and Find is re-enabled. If the native timeout fires first instead, the status is the separate "UNKNOWN — the solver did not settle…". Neither path ever reports SAT or UNSAT.

## 4. Minor items and integration duties

- **M1 (exact value-cell check).** Done: `tests/causal.spec.ts:41` uses `.getByRole('cell').nth(1)).toHaveText('1')`.
- **M2 (complementary-event normalization).** Done: `Pr(Z|do(Y=0)) + Pr(~Z|do(Y=0)) != 1` on `X->Y; Y->Z`.
  - Neither event covers every possible row, so `mass()` cannot take its `lit(1)` shortcut. The polynomial identity is actually exercised.
  - Real Z3 returns UNSAT.
- **M3 (search time vs. witness preparation).** The only lifecycle change is a new status, "Preparing exact model tables…", set before `showModel`, plus the label and help text. Everything else is unchanged:
  - the per-evaluation checks for edits and cancellation;
  - the final check before rendering;
  - the catch/finally status handling.
  
  The tests for cancelling during the first and the last exact evaluation, and for edits that abort a run and suppress its stale result, all pass.
- **M4 (incomplete reserved-name list).** Inherited from classical PrSAT and fails safely, so it stays out of scope. **M5 (observational fallbacks).** The compiler still uses them when called directly through the API, and its legacy-AST test passes.
- **Parser and compiler bounds** (timed):
  - depth 63 around `Pr(X)` parses in 2.5 ms, and depth 64 is rejected by the existing limit;
  - the 512-token, 64-query and 4,096-character limits are enforced before parsing;
  - 64 queries on a complete 6-node graph compile in 11 ms.
- **Spot check of the approved semantics.** The compiler did not change apart from the validator call. The fuzz shows that the substituted ASTs are exactly what the classical parser would produce with each `Pr` replaced by its query variable. The confounding, mediation, zero-support, simultaneous-intervention and exact-numeral browser tests all pass.

## 5. Checks I ran

| Check | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest --run` | 747 passed, 1 skipped, 1 todo, 18 files, in 11 of 12 runs. The other run had 1 unidentified failure (see N3). |
| `npx vite build` to `/tmp` | Both pages built. Every asset is byte-identical to the current `dist/`, and `dist/causal.html` loads the repaired `causal-CbJUQ2it.js`. |
| `npx playwright test --project chromium` | 32 passed: 13 causal tests (4 new) and 19 classical. One process, strict port 5174. |
| Probes | 44 hand-picked cases, the 300k differential fuzz, the aliasing variants with real Z3, 4 source mutations with the causal suite rerun on each, and bounds timing. |
| `git diff --check`; snapshot hashes | Clean; all 61 match before and after. |

## 6. Remaining non-blocking limits

- **N1.** Add the same-line alias test described in §2.
- **N2 (error columns).** Parse-error column numbers refer to the internally substituted text. For example, `Pr(X)Pr(Y)` reports "At column 15" when the problem is at column 6. The offset already existed before the repair and is now slightly larger; it is cosmetic.
- **N3 (unidentified unit-test failure).** One of 12 full unit runs had one failure that I did not capture. The other 11 runs all passed 747. The likeliest source is the inherited, unchanged timing tests in `z3_integration.spec.ts` (`run_solve_cancel_logic`, with a 20 ms tolerance and a `< 100 ms` bound), under CPU contention. Since it was not captured, I can't confirm that or rule out an intermittent failure elsewhere, but no causal or repair test failed in any of the 11 clean runs.
- **N4 (stale build files).** Older causal bundles (`causal-37XYJW8w.js`, `causal-CaYCHx5P.js`) remain in `dist/` because the build uses `emptyOutDir:false`. Nothing references them, and deploy is disabled.
- **Out of scope for Phase 1, as before.** ID/IDC identification, latent confounding, cross-world counterfactuals, stochastic or propositional interventions, cycles, non-Boolean variables, and graphs with more than 6 nodes.

**Phase gate: PASS.** I recommend adding the N1 test before Phase 2 work begins; it is a test-only change. I'm marking DISAGREE only because Codex has not yet cross-checked this, in particular whether N1 should block the gate. I am not disputing anything in the repair.

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 6m 02s)
CHECKPOINT
elapsed: ~5 min
tentative_verdict: AGREE; Phase gate PASS
new_results: NEW: independently confirmed all 61 frozen hashes, 747 passing unit tests, 32 passing Chromium tests, and 21 supplementary checks, including the same-line query-27 alias reproduction and polynomial normalization.
current_obstruction: none
next_bounded_step: done for this repair recheck
token_cost: unavailable
END CHECKPOINT

**Phase gate: PASS.** I agree that F1 and F2 are resolved. My completed recheck found no unresolved material Phase 1 issue.

F1’s two defenses are correctly integrated. Every probability substitution is parenthesized, and the shared validator rejects unmatched reserved identifiers both after parsing and at the direct compiler boundary. The identifier collector traverses arithmetic and constraint structure, including powers, division and negation. The required malformed inputs are rejected; explicit multiplication, integer powers, unary minus and constraint negation preserve their ASTs.

I independently confirmed Claude’s **N1**, including why it matters:

- The frozen parser rejects the same-line expression `Pr(X)A + 26 intervened queries = 1/3 + 26`.
- Removing only the parentheses in a temporary source copy makes that expression parse, alias query 27, and return **UNSAT** with no free real variables.
- The correctly written expression without the adjacent `A` remains **SAT**, with the first query exactly `1/3`.

The existing multi-line alias regression rejects the input through the validator before query 27 is registered. It therefore does not isolate the delimiter’s protection. A permanent same-line regression would improve coverage. **This is nonblocking:** the required implementation is present, and its behavior has now been independently exercised. Adding that regression is a recommendation, not another prerequisite for this PASS.

F2 is also complete. Validated seconds are rounded once, and the same integer goes to the JavaScript timer and native solver: `16.1 → 16100`, `32.2 → 32200`, `1.0005 → 1001`. The UI mock assertions, real-Z3 tests and browser solves all pass. The deterministic expiry test reports exactly `UNKNOWN — time limit reached.`, displays no witness and restores search controls.

The repairs preserve the established semantics. Real Z3 confirms root independence with explicit multiplication and complementary-event polynomial normalization as **UNSAT**. The normalization queries contain polynomial sums rather than literal-one shortcuts. Bounds checks pass, and cancellation during the first or last exact evaluation, stale-input suppression and solver-reload gating remain intact. M1 now targets the exact value cell; M3 accurately distinguishes search from cancellable witness preparation; M4 stays safely out of scope; M5’s valid compiler fallbacks remain.

Checks I actually performed:

| Check | Result |
|---|---|
| Required records, repair code and regression inspection | Complete |
| Frozen snapshot, before and after | All 61 hashes match |
| Lint; TypeScript `--noEmit`; `git diff --check` | Pass |
| Full unit suite | 747 pass, one inherited skip, one todo |
| Supplementary acceptance/bounds/alias/normalization checks | 21 pass |
| Headless Chromium, one worker, strict 5174 | All 32 pass |
| Temporary production build | Both pages build; all 11 corresponding `dist/` files are byte-identical |

One qualification to the supporting report: the unidentified failed unit run remains **unlocalized**; its attribution to inherited timing tests is conjectural. Also, the displayed fuzz categories total 297,286, so the remaining 2,714 cases need accounting before presenting that tally as exhaustive. Neither claim is needed for the gate conclusion.

No workspace files were edited, committed, deleted, pushed or deployed. Temporary probes and build/browser artifacts stayed outside the workspace. Port 5317 and permanent services were untouched. Phase 2 functionality was not reviewed.

VERDICT: AGREE

## Claude  (verdict: AGREE, 23s)
CHECKPOINT
elapsed: ~30 min
tentative_verdict: AGREE. Phase gate: PASS. N1 is a recommended addition, not a blocker.
new_results: NEW: accounted for the fuzz-tally gap Codex flagged. Re-running the same deterministic generator (seed 12345) shows 2,714 of the 300,000 strings were whitespace-only and skipped by `if (!s.trim()) continue`. That leaves 297,286 evaluated: 294,404 rejected by both parsers and 2,882 accepted by both with identical ASTs. I also accept Codex's correction that the cause of the failed unit run is unproven.
current_obstruction: none
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

## Response to Codex

I agree with Codex on every point that bears on the gate. Codex's two corrections to my supporting report are valid. I've settled one and conceded the other.

1. **The fuzz count.** Codex was right that the categories add up to only 297,286. The missing 2,714 strings were skipped before parsing because they were whitespace-only. The causal parser accepts blank input as a document with no constraints, so comparing those strings was meaningless. Re-running the same generator gives exactly 2,714 skipped and 297,286 kept. The tally is now complete: 300,000 generated, 2,714 blank and skipped, 294,404 rejected by both parsers, and 2,882 accepted by both. There were no strings accepted only by the causal parser, no AST mismatches, and none accepted only by the classical parser.

2. **The failed unit run (N3).** The one failing run was not traced to a specific test, and blaming the inherited timing tests in `z3_integration.spec.ts` is a guess. What I can actually support is narrower:
   - one of my twelve full runs had one failure, which I did not capture;
   - the other eleven passed with 747 tests;
   - Codex's own run also passed with 747;
   - the failing test was never identified.
   
   This does not block the gate: the repair tests passed in every run where results were captured. It is still worth noting as a limitation.

3. **N1.** Codex reproduced the same-line alias independently. With the frozen code it is rejected. With the parentheses removed it aliases the 27th query and returns UNSAT with no free variables. The same expression written correctly is SAT, with the first query equal to 1/3. We agree this is a gap in test coverage, not a defect in the repaired code: the original acceptance cases are met as written, and only the regression suite fails to isolate the parentheses. The recommendation stands: add a permanent same-line alias test, optionally with a real-Z3 variant, and assert a parse error in the juxtaposition tests so the parentheses and the validator are each tested on their own.

## Consensus answer

**Phase gate: PASS.**
- **F1:** every probability substitution is parenthesized, and the shared reserved-identifier validator runs both after parsing and at the compiler API boundary.
- **F2:** validated seconds are rounded to integer milliseconds once, and that same value goes to both the JavaScript timer and native Z3.

Both participants independently confirmed the following:
- all 61 frozen snapshot hashes match;
- lint, tsc and `git diff --check` pass;
- 747 unit tests pass;
- 32 headless Chromium tests pass on strict port 5174 with one worker;
- a temporary build is byte-identical to `dist/`;
- every agreed acceptance case passes;
- with real Z3, root independence and complementary-event normalization are both UNSAT;
- the parser bounds, cancellation and stale-input behavior are unchanged;
- the M1, M3, M4 and M5 dispositions hold.

**Non-blocking limits:**
- **N1:** add the same-line alias test.
- **N2:** parse-error column numbers refer to the substituted text rather than the user's input.
- **N3:** the one failed unit run remains unidentified.
- **N4:** stale bundles left over from earlier builds remain unreferenced in `dist/`.
- Out of scope, as before: ID/IDC identification, latent confounding, cross-world counterfactuals, stochastic or propositional interventions, cycles, non-Boolean variables, and graphs with more than 6 nodes.

No workspace files were edited, committed, pushed or deployed, and port 5317 was not used.

VERDICT: AGREE

