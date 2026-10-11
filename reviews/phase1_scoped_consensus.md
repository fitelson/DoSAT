# Consensus debate — 2026-10-11 11:31

## Question
Perform the required consensus code-and-mathematics review of PrSATdo phase1. Use the consensus skill defaults selected by the runner: Claude Opus5.5/xhigh and GPT6.1Sol/xhigh. This exchange IS the requested phase gate; no recursive reviews/debates, model calls or delegation. Audit read-only: no implementation/doc edits, commits, deletions, pushes, deployments or service changes. Ordinary inspection and necessary tests are allowed. Do not use port5317; browser tests use strict5174 and only one test process at a time.

Project: /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus
Read PROJECT.md, AGENTS.md, CAUSAL_SEMANTICS.md, PHASE1_VERIFICATION.md and reviews/phase1_snapshot.json plus reviews/PHASE1_DELTA.md. Inspect the CURRENT PHASE changes and their tests; compare initial baseline724655b to establish the change boundary. Do not perform a general audit of untouched older code. Read preexisting code only where the current changes rely on its behavior. A finding in inherited code counts within this gate only if the new phase introduces or exposes a defect in its promised capability; otherwise label it out of scope and do not make it a gate blocker. Review the new semantic claim, rather than reopening settled classical probability semantics. This phase implements satisfiability of observational and hard-interventional probability constraints on supplied acyclic graphs of observed Boolean variables with independent private disturbances, using shared CPTs. ID/IDC identification, latent confounding and cross-world counterfactuals are outside this phase.

Review src/causal_syntax.ts, src/causal.ts, src/causal_ui.ts, src/causal_format.ts, the exact evaluator addition in src/z3_integration.ts, causal.html, build/browser configs, new causal tests; retained classical tests are an integration-regression check only, not an invitation to re-audit old code. Assess the soundness/completeness representation argument, normalization, intervention surgery, shared mechanisms, missing observational support, postintervention conditioning, zero-denominator/branch-local definedness, graph/query/identifier validation, exact numbers and exponents, resource bounds, lifecycle/cancellation/timeouts/reload/input/file races, model witness completeness and exactness, and independent test coverage. Be adversarial and give concrete reproductions/source locations for findings.

Current candidate checks: lint and build pass;716 active unit tests pass with1 inherited skip and1 todo across18 files;28 headless Chromium tests pass; production causal bundle smoke gives correct intervention1/2, no page errors, fits desktop/phone widths. No publishing. Earlier internal checks caught and fixed exact exponent rounding, cancelling during final evaluation, search gating during delayed Z3 reload, stale asynchronous file responses, and free-real witness omission. Independently check rather than accept those fixes.

Return a compressed report at most40000 output tokens (and within the runner's conservative40000-UTF8-byte delivery guard), preserving decisive proofs, counterexamples, qualifications and verdict. Follow the runner's six-field checkpoint/stream/session protocol. Include a scoped mathematical assessment, concrete numbered severity findings, checks actually performed, and explicit remaining phase boundaries.

Give an explicit separate **Phase gate: PASS** or **Phase gate: FAIL**. PASS requires a complete audit with no unresolved material issue within phase1. FAIL includes confirmed material findings or an incomplete audit. Consensus on FAIL/fixes is not approval to advance. Your normal final VERDICT: AGREE/DISAGREE indicates agreement with the best-supported review, not automatically phase approval. If corrections are needed, specify bounded concrete repairs and acceptance checks; root will implement and seek consensus recheck before starting phase2.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 13m 00s (2 turns); Codex: 5m 57s (1 turns); total: 18m 56s

## Agreed answer
# PrSATdo Phase 1 review: observational and hard-interventional causal satisfiability

## Phase gate: FAIL

The mathematics is correct. It is a sound and complete representation of the stated model class. Two implementation defects block the gate:

- **F1 (material):** malformed input is silently given a different meaning, which can produce a wrong SAT or a wrong UNSAT.
- **F2 (medium):** some valid time limits make every search fail.

Both repairs are small and well defined. Agreeing on this FAIL does not approve starting Phase 2. Root should implement the repairs, rerun the checks and get a consensus recheck first.

---

## 1. Scope and checks performed

**Change boundary.** The boundary is `git diff 724655b`, limited to the files listed in `reviews/PHASE1_DELTA.md`.
- **New causal files:** `src/causal_syntax.ts`, `src/causal.ts`, `src/causal_ui.ts`, `src/causal_format.ts`, `src/causal_style.css`, `causal.html`, the new unit specs and `tests/causal.spec.ts`.
- **Inherited files touched:**
  - a title/link change in `index.html` and `src/text_to_display.ts`;
  - the Vite multi-page input with `emptyOutDir:false`;
  - Playwright on strict port 5174 with `retries: 0`;
  - a relative URL in `tests/simple.spec.ts`;
  - the `evaluate_exact` addition in `src/z3_integration.ts`.
- **Classical code:** the retained classical tests were used only as an integration-regression check.

**Integrity.** `reviews/phase1_snapshot.json` lists 59 files. All 59 hashes matched the working tree both before and after the checks.

**Commands run:**

| Check | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest --run` | **716 passed, 1 skipped, 1 todo, 18 files.** The skip and todo are inherited. |
| Temporary `vite build` to `/tmp` | Both pages built. The hashed assets (e.g. `causal-37XYJW8w.js`) are byte-identical to the current `dist/`. |
| `npx playwright test --project chromium` | **28 passed** (9 causal, 19 classical). One process, strict port 5174. |
| Real-Z3 and timing probes | Run in a throwaway directory outside the repo. They cover F1, F2, symbolic normalization, exact algebraic evaluation and resource bounds. |

No implementation or documentation files were edited. Nothing was committed, deleted, pushed or deployed, and no service changed. Port 5317 was not used. Running the e2e suite only touched gitignored report directories.

---

## 2. Mathematical assessment (in scope, verified)

### 2.1 Truncated factorization and surgery (`src/causal.ts` ≈248–255)

For an intervention set *I* with imposed values *a*, and a complete row *x*:
- if *x* disagrees with *a* on *I*, the row gets the literal `0`;
- otherwise the row gets ∏_{i∉I} k_i(x), where k_i(x) = q_i(x_pa) if x_i = 1, and 1 − q_i(x_pa) if x_i = 0.

**Imposed parent values.** The mechanism key is built from the full row, so intervened parents enter retained mechanisms at their imposed values. This is Pearl's Markovian surgery (*Causality*, §3.2).

**Shared mechanisms.** One `mechanism_lookup` serves every regime, so all regimes share the same parameters. Interventions are canonicalized (≈244), so their order does not matter.

**Total intervention.** If every node is intervened on, the product is empty and the regime is the correct point mass.

### 2.2 Normalization

**Claim.** For any *I*, the masses of the rows consistent with the intervention sum to 1 as a polynomial identity in the q-parameters.

**Proof.**
1. Remove the incoming edges of the intervened nodes.
2. Pick a non-intervened node *t* that has no non-intervened children. Such a node exists because the graph is acyclic.
3. Sum over x_t. The factor of *t* contributes q_t(p) + (1 − q_t(p)) = 1. Node *t* appears in no other retained factor, since parents enter only their children's factors and *t* has no retained children.
4. Repeat. Intervened nodes have one value in the support, so their sum is trivial. What remains is the empty product, 1. ∎

**Consequences:**
- The `mass()` shortcut to `lit(1)` (≈278) is justified.
- No normalization equation is needed.
- The excluded rows are exactly the literal-0 rows. No retained product is identically zero, because its factors are distinct parameters or their complements.

**Independent probe** that bypasses the tautology shortcut:
- Graph `X -> Y; Y -> Z`, constraint `Pr(Z | do(Y=0)) + Pr(~Z | do(Y=0)) != 1`.
- Result: **UNSAT** in real Z3.

### 2.3 Representation theorem (both directions)

**Every parameter assignment gives a model.**
- For each node *i* and parent assignment *p*, draw an independent bit U_{i,p} ~ Bern(q_i(p)).
- Let U_i be the tuple (U_{i,p})_p and set f_i(p, U_i) = U_{i,p}.
- The disturbances of distinct nodes are independent. Evaluating in topological order gives a unique solution.
- U_i is independent of the disturbances that determine X_pa(i), so P(X_i = 1 | X_pa = p) = q_i(p).
- Replacing intervened equations by constants leaves the other equations and disturbances unchanged. This yields exactly the truncated products, in every regime at once.

**Every model gives a parameter assignment.**
- Given a Boolean acyclic SCM with independent private disturbances, set q_i(p) = P(f_i(p, U_i) = 1) for every *p*.
- This includes configurations with zero observational probability. The definition is valid there because U_i is independent of the ancestors' disturbances.
- Topological evaluation then reproduces the observational product and every truncated product.

**Joint faithfulness.** A single q generates all regimes simultaneously, so constraints that span several regimes are represented faithfully.

**Conclusion.** For supported input, SAT and UNSAT are exact for the class of Boolean acyclic SCMs with independent private disturbances and graph-restricted mechanisms, observational plus hard-interventional. This holds independently of whether Z3 terminates on a given search.

**Correct qualification.** The parameterization does not determine how potential outcomes are coupled across worlds. Cross-world counterfactuals are correctly excluded.

### 2.4 Unseen parent configurations

A configuration with observational probability zero keeps its own free mechanism parameter q_i(p). An intervention can then reveal that parameter. This is correct: such a parameter is a mechanism value, not an observational conditional probability.

### 2.5 Regularity

**Claim.** Requiring q_i(p) ∈ (0,1) for all *i, p* is *equivalent* to a strictly positive observational joint distribution.
- **Forward:** each row's mass is a product of factors that are all strictly positive.
- **Converse:** if every row is positive, every parent configuration has positive mass, and both child values occur with positive mass under it. So each q_i(p) lies strictly between 0 and 1.

The UI label is therefore accurate. Hard interventions still force incompatible rows to zero. These structural zeros are correctly allowed.

### 2.6 Conditioning after intervention and definedness

P^I(A | B) = P^I(A ∧ B) / P^I(B) (≈281–286).
- **Guards after substitution.** Denominator guards are generated after the causal masses are substituted (≈315). The inherited branch-local definedness semantics therefore applies to causal terms:
  - an atomic comparison, or its explicit negation, holds only if its terms are defined;
  - a disjunction can still hold through its other, defined branch;
  - this applies to ordinary division too.
- **Impossible conditions.** If the condition is impossible under the intervention, the denominator is the literal 0, and the guard `not (0 = 0)` correctly makes the atom false.
- **Undefined queries in witnesses.** `evaluate_exact` reports a query as undefined exactly when some denominator guard fails. That check does not depend on guard order.

### 2.7 Worked examples (recomputed by hand)

All numeric claims in `CAUSAL_SEMANTICS.md` and the solver specs check out:

| Example | Values |
|---|---|
| Confounding | P(Y\|X) = 3/4 vs P(Y\|do(X=1)) = 1/2 |
| Collider | P(X∧Y\|Z) = 1/3, P(X\|Z) = 2/3 |
| Simpson | 9/16, 7/16, 3/8, 5/8 |
| Mediation | 13/20, 7/20 |

The test oracle enumerates 4^n private-noise outcomes. It is a genuinely independent check, not the compiler checked against itself.

**Exact numbers.**
- Large rationals are formatted directly from Z3 numeral strings, never through JavaScript numbers.
- `Pr(X)^2 = 1/2` evaluates exactly to a `root-obj` numeral with no floating-point conversion.

---

## 3. Findings

### F1 — Material (high): probability placeholders merge with adjacent identifiers, so malformed input is silently given a different meaning

**Location:**
- `src/causal_syntax.ts:269` substitutes each `Pr(...)` occurrence with a placeholder such as `CausalQueryA`, with no delimiter.
- The reserved-prefix check (≈:86) runs on the raw text, before substitution.
- Downstream, `src/causal.ts:206` removes only exact query keys from the free variables, and ≈:292 looks up only exact names.

**Mechanism.** Writing a probability directly next to an identifier or another probability fuses the placeholder with the neighbouring text. The result is either a fresh free real variable or the name of a different query.

**Reproductions (real Z3):**

| Graph / input | Result | What actually happened |
|---|---|---|
| `X; Y` with `Pr(X & Y) != Pr(X)Pr(Y)` | **SAT** (spurious counterexample to independence) | `Pr(X)Pr(Y)` became the free real `CausalQueryBCausalQueryC`. Written as `Pr(X)*Pr(Y)` it is correctly **UNSAT**. Classical PrSAT rejects the string as a syntax error. |
| `Pr(X)x = 5` | **SAT** | free real `CausalQueryAx` |
| `Pr(X)P(Y) = 5` | **SAT** | unintended free variable |
| `Pr(X)e = 5` | **SAT** | unintended free variable |
| `Pr(X)A = 1/3`, then 26 lines of `Pr(X \| do(X=1)) = 1` | **UNSAT**, no free variables | `CausalQueryAA` silently resolved to the 27th query, so the first line was solved as 1 = 1/3 |

**Why it is material.** Phase 1 promises exact SAT/UNSAT for supported input. Here, input outside the language is accepted and given a wrong meaning, in both directions (wrong SAT and wrong UNSAT). The aliasing case gives no visible sign of the error.

**Required repair (both parts are needed):**
1. **Delimit every substitution**, for example by substituting `(CausalQueryX)`. Then `Pr(X)A` becomes `(CausalQueryA)A` and `Pr(X)Pr(Y)` becomes `(CausalQueryA)(CausalQueryB)`, and both are parse errors.
   - Delimiting is essential. A check that only rejects unmatched reserved names would not catch the aliasing case, because `CausalQueryAA` is an exact query key.
   - The parentheses do not interfere with the input limits. The 64-level nesting check runs on the raw text before substitution, and parenthesized expressions add no AST nodes, so the existing AST-equality tests still hold.
2. **Reject reserved identifiers that are not exact query keys.** Any identifier containing `CausalQuery` must be an exact key of the query map. Enforce this in `parse_causal_document`, and repeat the check in `compile_causal_document`, because the compiler can be called directly through its API.

**Acceptance checks:**
- Each of these is rejected as an invalid constraint:
  - `Pr(X & Y) != Pr(X)Pr(Y)`
  - `Pr(X)x = 5`
  - `Pr(X)P(Y) = 5`
  - `Pr(X)e = 5`
  - `Pr(X)A = 1/3` followed by 26 queries
- These still parse to unchanged ASTs: `Pr(X)*Pr(Y)`, `Pr(X)^2`, `-Pr(X)` and `~(Pr(X)=1/2)`.
- A compiler-API test shows that an AST containing an unmatched `CausalQuery…` variable is rejected.
- A real-Z3 regression keeps the correctly written independence check (graph `X; Y`, `Pr(X & Y) != Pr(X)*Pr(Y)`) at **UNSAT**.

### F2 — Medium (required): some valid time limits make every search fail

**Location.** `src/causal_ui.ts:142` passes `Number(timeout.value) * 1000` without rounding. `WrappedSolver` then calls `solver.set('timeout', ms)`. For a non-integer, z3-solver uses `params_set_double`, and Z3 rejects it with "Parameter timeout was given argument of type double, expected unsigned int".

**Reproductions (real Z3):**

| Seconds entered | Milliseconds computed | Result |
|---|---|---|
| 16.1 | 16100.000000000002 | Error |
| 32.2 | 32200.000000000004 | Error |
| 1.0005 | 1000.5 | Error |
| (rounded versions of the above) | integer | `Pr(X)=1/2` solves SAT |

The validator accepts 0.1–120 s. Ten of the 1,200 values on the 0.1 grid fail (16.1, 32.2, 32.3, 32.7, 64.1, 64.4, 64.6, 64.9, …), and so does any value off the grid, such as 1.0005.

**Severity.** The failure is safe: the UI shows "Error: …" and never a wrong verdict. But it breaks the promised configurable search-time capability.

**Required repair.** After validation, use `const milliseconds = Math.round(seconds * 1000)`.

**Acceptance checks:**
- A UI mock test shows that entering 16.1 passes the integer `16100` to `solve`.
- A real-Z3 solve with a rounded value returns sat.
- A deterministic timer-expiry regression shows the status reads "UNKNOWN — time limit reached."

### Non-blocking items (recommended)

- **M1 — vacuous e2e assertion.** `tests/causal.spec.ts:40–41` asserts `toContainText('1')` on a row whose source text, "Pr(Y | do(X=1))", already contains "1". It should assert on the value cell. The unit solver test does check the exact 3/4.
- **M2 — normalization test is short-circuited.** The real-Z3 test `Pr(X v ~X | do(Y=0)) != 1` goes straight to the tautology shortcut `lit(1)`. It never exercises the polynomial identity.
  - The symbolic probe in §2.2 shows the identity holds.
  - Add `Pr(Z | do(Y=0)) + Pr(~Z | do(Y=0)) != 1` (expect UNSAT) as a permanent test.
- **M3 — witness rendering runs outside the time limit.** The timer is cleared at `src/causal_ui.ts:145`, before `showModel`. The worst case measured was 2,207 exact evaluations in about 3.6 s (Node; 6-node complete DAG, 32 regimes). Rendering checks for cancellation and staleness correctly, so this is a UX point only.
- **M4 — reserved-name list is incomplete, but fails safely.** The free-variable list (`src/causal.ts:210`) misses SMT words such as `and`, `or` and `distinct`.
  - Z3 then raises a declaration error, which the UI shows as "Error:".
  - `pi`, `e`, `abs`, `div`, `root`, `ite` and `not` behave as ordinary variables (verified SAT with value 3).
  - The classical app behaves the same way. This is inherited naming behaviour and outside the gate.
- **M5 — observational fallbacks are used only through the API.** The `probability` and `given_probability` cases at `src/causal.ts:293–294` cannot be reached from parsed text.
  - They support legacy observational ASTs passed to the compiler API, and the test "supports legacy observational ASTs without independent state-mass variables" (`src/causal.spec.ts:232`) exercises them.
  - They are semantically correct and should stay.

---

## 4. Earlier fixes, re-checked independently

- **Exact exponent rounding.** Exponents must be spelled exactly and are bounded at 1024. The expansion-cost bound counts biconditional duplication and the guards. Exact evaluation keeps algebraic results in `root-obj` form.
- **Resource bounds.**
  - The parser runs in linear time up to depth 64.
  - A 16-way equivalence chain is rejected quickly.
  - A 6-node complete DAG with 64 queries compiles in about 11 ms.
  - The limits of 6 nodes and 64 probability occurrences are enforced, along with the input and expansion caps.
- **Cancellation during the last witness evaluation.** Cancellation is checked before and after each await, with a final check before rendering.
- **Search gating during a slow Z3 reload.** The `reinitializing` flag is set synchronously inside the init callback, before the UI's `finally` runs.
- **Stale file responses.** File loads are guarded by a token and a revision number.
- **Free-variable witnesses.** Free real variables appear under "Other real variables".
- **Exact witnesses.** Large rationals come straight from Z3 strings. Algebraic values keep Z3's `root-obj` notation. Undefined queries are reported separately.
- **Escaping.** All text is inserted with `append` or `textContent`, so there is no HTML injection.
- **Validation.** Graph, query and identifier validation were inspected and are adequate, apart from F1.

---

## 5. Outside Phase 1

These are not part of this gate, and `CAUSAL_SEMANTICS.md` states the boundaries accurately:
- ID/IDC identification and do-calculus rule derivations;
- latent confounders and correlated disturbances;
- cross-world counterfactuals;
- stochastic interventions and interventions on arbitrary propositions;
- cycles;
- non-Boolean variables;
- graphs with more than 6 nodes. This and the other size caps are implementation resource limits, not mathematical restrictions.

---

## 6. Required before Phase 2

1. Fix **F1**: delimit every substitution and reject unmatched reserved identifiers in both parser and compiler, with all F1 acceptance regressions, including the real-Z3 UNSAT independence check.
2. Fix **F2**: round milliseconds to an integer, with the integer-timeout UI assertion, the real-Z3 check and the timer-expiry regression.
3. Preferably also address M1 (value-cell assertion), M2 (symbolic normalization test) and, optionally, M3.
4. Rerun `npm run lint`, `npm run build`, the full unit suite and the full Chromium e2e suite (one process, strict port 5174), plus the new regressions.
5. Get a consensus recheck of the repaired candidate. Only a PASS on that recheck authorizes starting Phase 2.

**Phase gate: FAIL**

## Claude  (verdict: DISAGREE, 12m 36s)
CHECKPOINT
elapsed: ~27 min
tentative_verdict: Phase gate FAIL (one material input-soundness defect, one required timeout fix); the mathematics checks out
new_results: NEW: confirmed query-placeholder juxtaposition (wrong SAT and wrong UNSAT); confirmed non-integer timeout-ms Z3 failure; independently reproduced unit/lint/tsc/build/e2e counts; snapshot hashes match; representation, normalization and definedness arguments verified
current_obstruction: none
next_bounded_step: Codex cross-check of F1/F2 and the minor items; root implements repairs; consensus recheck
token_cost: unavailable
END CHECKPOINT

# Phase 1 review: observational and hard-interventional causal satisfiability

**Phase gate: FAIL.** The mathematics is correct. The implementation has one material input-soundness defect (F1) and one defect in a promised capability (F2). Both are easy to repair.

## Scope and integrity checks performed
- **Snapshot:** all 61 file hashes in `reviews/phase1_snapshot.json` match the working tree. The change boundary was taken from `git diff 724655b`. The inherited diffs are small: a title/link in `index.html` and `text_to_display.ts`, the Vite multi-page input, the Playwright port 5174 with `retries: 0`, the relative URL in `simple.spec.ts`, and the `evaluate_exact` addition in `z3_integration.ts`.
- **Commands I ran:**
  - `npm run lint` and `npx tsc` both exited 0.
  - `npx vitest --run`: **716 passed, 1 skipped, 1 todo, 18 files**.
  - `npx playwright test --project chromium`: **28 passed** on strict port 5174, one process.
  - `vite build` to `/tmp`: produced both pages. `causal-37XYJW8w.js` and the other hashed assets are identical to the current `dist/`.
- **Probes:** about 10 throwaway real-Z3 and timing probes. They live in `/tmp/prsatdo_audit` (node_modules is a symlink), outside the repo. No project files were edited. Running e2e only touched the gitignored report directories.

## Mathematical assessment (in scope, verified)
1. **Truncated factorization** (`causal.ts:248–255`).
   - A row inconsistent with the intervention gets the literal 0.
   - Otherwise the row gets ∏_{i∉I} k_i(x), where k_i is q_i(x_pa) or 1−q_i(x_pa).
   - The mechanism key uses the full row, so intervened parents enter at their imposed values. This is correct Pearl surgery.
   - The same `mechanism_lookup` serves every regime, so mechanisms are shared. Intervention order is canonicalized at `:244`.
2. **Normalization.** The rows consistent with the intervention sum to 1 as a polynomial identity. Proof: eliminate a non-intervened node that has no non-intervened children; its two factors sum to 1, and it appears in no other retained factor. Repeat.
   - This justifies the `mass()` shortcut to `lit(1)` (`:278`).
   - The excluded rows are exactly the literal-0 rows, and no retained product is identically zero, because its factors are distinct parameters or their complements.
3. **Representation, both directions.**
   - *Every parameter assignment gives a model:* use independent per-configuration bits U_{i,p} ~ Bern(q_i(p)) and set f_i = U_{i,pa}.
   - *Every model gives a parameter assignment:* put q_i(p) = P(f_i(p, U_i) = 1). This is valid for configurations with zero observational probability, because U_i is independent of the ancestors' disturbances.
   - A single q generates all regimes jointly, so cross-regime constraints are faithful.
   - Hence SAT and UNSAT are exact for the class of Boolean acyclic SCMs with independent disturbances. Coupling across counterfactual worlds is correctly declared out of scope.
4. **Regularity.** Requiring q ∈ (0,1) everywhere is *equivalent* to a strictly positive observational joint. If every row is positive, every parent configuration has positive mass and both values of each child do too. The UI label is therefore accurate. Hard interventions still create structural zeros, which is correct.
5. **Conditioning after intervention.** P^I(A | B) = P^I(A ∧ B) / P^I(B) (`:281–286`).
   - Guards are applied after substitution (`:315`), so the inherited branch-local definedness applies to the causal masses. An atomic comparison or its negation needs nonzero denominators; a disjunction can still be satisfied through its other branch.
   - An impossible condition gives the literal 0 as denominator, and the guard `not(0=0)` makes it false.
   - `evaluate_exact` reports a query as undefined exactly when some denominator guard fails. That check does not depend on the order of the guards.
6. **Worked examples.** I recomputed every numeric example in CAUSAL_SEMANTICS.md and the solver specs by hand: confounding 3/4 vs 1/2, collider 1/3 and 2/3, Simpson 9/16, 7/16, 3/8, 5/8, and mediation 13/20 and 7/20. All are correct, and the 4^n private-noise oracle is a genuinely independent check.

## Findings (most severe first)

**F1 — material: probability placeholders merge with adjacent identifiers, so malformed input is silently given a different meaning.**
- **Location:** `causal_syntax.ts:269` splices `CausalQueryA`-style names in with no delimiter. The reserved-prefix check at `:86` runs before substitution. Downstream, `causal.ts:206` removes only exact query keys from the free variables, and `:292` looks up only exact names.
- **Reproduced with real Z3:**
  - (a) Graph `X; Y` with `Pr(X & Y) != Pr(X)Pr(Y)` returns **SAT**, a spurious counterexample to independence. `Pr(X)Pr(Y)` became the fresh free real variable `CausalQueryBCausalQueryC`. With `*` it is correctly UNSAT. Classical PrSAT rejects the input as a syntax error.
  - (b) `Pr(X)x = 5` returns SAT through the free variable `CausalQueryAx`.
  - (c) **Silent aliasing:** `Pr(X)A = 1/3` followed by 26 lines of `Pr(X | do(X=1)) = 1` returns **UNSAT** with no free variables. `CausalQueryAA` was resolved to the 27th query, so the line was solved as 1 = 1/3.
- **Why it matters:** the phase promises that SAT and UNSAT are exact for supported input. Here, input outside the language is accepted and given a wrong meaning.
- **Repair:**
  - Reject, after parsing, any variable id that contains `CausalQuery` but is not an exact key of `probabilities`. Mirror that check in `compile_causal_document`.
  - Also delimit the substituted name, for example `(CausalQueryA)` or a name padded with spaces.
- **Acceptance:**
  - (a), (b), (c), plus `Pr(X)P(Y)` and `Pr(X)e`, all give "Invalid constraint".
  - `Pr(X)*Pr(Y)`, `Pr(X)^2`, `-Pr(X)` and `~(Pr(X)=1/2)` still parse to the same ASTs as before.
  - Add a real-Z3 regression for (a).

**F2 — medium, required: some valid time limits make every search fail.**
- **Location:** `causal_ui.ts:142` passes `Number(timeout.value) * 1000` unrounded. `WrappedSolver` then calls `solver.set('timeout', ms)`, and z3-solver uses `params_set_double` for non-integers.
- **Reproduced with real Z3:** `1000.5` and `2000.1000000000001` both throw "Parameter timeout was given argument of type double, expected unsigned int".
  - The input validation accepts 0.1–120. 10 of the 1,200 step values fail: 16.1, 32.2, 32.3, 32.7, 64.1, 64.4, 64.6, 64.9, …
  - Any value off the 0.1 step fails too, for example 1.0005.
  - The failure is safe (the UI shows "Error: …", never a wrong verdict), but the advertised 0.1–120 s capability is broken for these values.
- **Repair:** `const milliseconds = Math.round(seconds * 1000)`, using the already-validated seconds.
- **Acceptance:**
  - A UI mock test shows 16.1 passes the integer 16100 to `solve`.
  - A real-Z3 solve with the rounded value returns sat.
  - Add a test of the timeout path, where the timer fires and the status reads "UNKNOWN — time limit reached."

**Minor (do not block the gate; recommended):**
- **M1 — vacuous e2e check.** `tests/causal.spec.ts:40` asserts `toContainText('1')` on a row whose source text "Pr(Y | do(X=1))" already contains "1". Assert the value cell instead. (The unit solver test does check the exact 3/4.)
- **M2 — normalization test is short-circuited.** The real-Z3 normalization test (`causal_solver.spec.ts`, `Pr(X v ~X | do(Y=0)) != 1`) never exercises the polynomial identity, because the tautology goes straight to `lit(1)`. The numeric oracle does check row sums. Optionally add `Pr(Z | do(Y=0)) + Pr(~Z | do(Y=0)) != 1` expecting UNSAT.
- **M3 — witness rendering is outside the time limit.** The timer is cleared at `causal_ui.ts:145`, before `showModel`. Worst case I measured: 2,207 exact evaluations in about 3.6 s in Node (6-node complete DAG, 32 regimes). Rendering is cancellable and checks staleness correctly; this is only a UX point.
- **M4 — reserved-name list is incomplete (safe).** The free-variable list at `causal.ts:210` misses names like `and`, `or` and `distinct`. Z3 then raises a declaration error, which the UI reports as "Error:". `pi`, `e`, `abs`, `div`, `root`, `ite` and `not` behave as ordinary variables (verified SAT with value 3). The classical app behaves the same way, so this is not unsound and is out of scope.
- **M5 — dead fallback.** The observational fallbacks for `probability`/`given_probability` at `causal.ts:293–294` can't be reached from parsed input. They are semantically correct and harmless.

## Earlier fixes, independently re-checked
- **Exponent spelling:** the exact-spelling validation plus the bound of 1024 holds, and the expansion-cost bound counts both the biconditional duplication and the guards.
- **Bounds:** the parser runs in linear time up to depth 64. A 16-way equivalence chain is rejected quickly. A 6-node complete DAG with 64 queries compiles in about 11 ms.
- **Cancellation during the last evaluation:** checked before and after each await, with a final check before rendering.
- **Gating during a slow reload:** the `reinitializing` flag is set synchronously inside the init callback, before the UI's `finally` runs.
- **Stale file reads:** file loads are guarded by token and revision.
- **Free-variable witnesses:** shown in "Other real variables".
- **Exact values:** large rationals are formatted from Z3 strings; algebraic values keep Z3's `root-obj` notation.
- **Escaping:** all text is inserted with `append` or `textContent`, so there is no HTML injection.

## Outside this phase
ID/IDC identification and do-calculus rule derivations, latent confounders and correlated disturbances, counterfactuals across worlds, stochastic or propositional interventions, cycles, non-Boolean variables, and graphs with more than 6 nodes are all excluded. The documentation states these boundaries accurately.

## Recheck needed after repairs
Fix F1 and F2 with their acceptance tests, preferably together with M1–M3. Then rerun lint, build, the unit suite, the e2e suite and the new regressions, and get a consensus recheck before Phase 2.

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 5m 57s)
CHECKPOINT
elapsed: ~7 min
tentative_verdict: AGREE with the scoped FAIL review
new_results: NEW: independently reproduced F1 and F2 with real Z3; verified symbolic normalization without the tautology shortcut and exact algebraic evaluation; lint, TypeScript checking, unit tests, temporary production build and all 28 Chromium tests passed; all 59 snapshot hashes match
current_obstruction: none in the review; F1 and F2 remain implementation blockers
next_bounded_step: root repairs F1/F2, adds regressions, reruns checks and obtains consensus recheck
token_cost: unavailable
END CHECKPOINT

**Phase gate: FAIL**

I agree with Claude’s mathematical assessment and both required repairs. My completed scoped audit found no additional material blocker. Agreement on this FAIL does not authorize advancement to Phase 2.

1. **F1 — high severity: probability substitution changes malformed input’s meaning.** Confirmed at [causal_syntax.ts:269](/Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/src/causal_syntax.ts:269), with downstream treatment at [causal.ts:206](/Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/src/causal.ts:206).

   My real-Z3 probes reproduced:

   - Graph `X; Y`, constraint `Pr(X & Y) != Pr(X)Pr(Y)`: **SAT**, introducing `CausalQueryBCausalQueryC` as a free real variable. With explicit multiplication, the result is correctly **UNSAT**.
   - `Pr(X)x = 5`, `Pr(X)P(Y) = 5`, and `Pr(X)e = 5`: **SAT** through unintended free variables. The inherited parser rejects each original string.
   - `Pr(X)A = 1/3`, followed by 26 lines of `Pr(X | do(X=1)) = 1`: **UNSAT**, with no extra free variable. The merged identifier aliases the later query `CausalQueryAA`.

   **Repair refinement:** delimiting every substituted query is essential. A post-parse check that rejects reserved identifiers unless they exactly match a query key cannot catch the alias example. Parenthesized substitution, plus rejection of unmatched reserved identifiers in parsing and compilation, addresses both cases.

   Acceptance must reject all these malformed inputs while preserving explicit multiplication, integer powers, unary minus and constraint negation. Retain the valid independence check as a real-Z3 regression.

2. **F2 — medium severity: accepted time limits can prevent solving.** Confirmed at [causal_ui.ts:142](/Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/src/causal_ui.ts:142).

   My probes obtained:

   ```text
   16.1 seconds  → 16100.000000000002 milliseconds
   32.2 seconds  → 32200.000000000004 milliseconds
   1.0005 seconds → 1000.5 milliseconds
   ```

   Each unrounded value caused Z3’s “expected unsigned int” parameter error. Each rounded value successfully solved `Pr(X)=1/2`.

   Use `Math.round(seconds * 1000)` after validation. Add a UI assertion that 16.1 passes integer `16100`, a real-Z3 check, and a deterministic timer-expiry regression verifying `UNKNOWN — time limit reached.` This failure produces an error rather than a false satisfiability verdict, but it breaks the documented search-time capability.

The mathematical representation is sound and complete for the stated model class. The independent-disturbance definition and intervention surgery match [Pearl’s Markovian semantics](https://web.cs.ucla.edu/~kaoru/CAUSALITY-REPRINTED-W-CORRECTIONS-2013/causality-ch3-june2013.pdf). Independently checking the supplied argument:

- Every bounded CPT assignment has a structural realization using independent private tuples of Bernoulli bits.
- Every Boolean acyclic SCM with independent private disturbances supplies those CPT values, including parent configurations absent from observational support.
- The compiler uses the same mechanism parameters in every regime, removes precisely the intervened factors, and inserts imposed parent values into retained mechanisms.
- Normalization follows by eliminating terminal nonintervened nodes: each eliminated pair contributes `q+(1−q)=1`. Total intervention leaves the correct point mass.
- Conditioning uses the intervention distribution. Definedness guards follow substitution, preserving the stipulated branch-local semantics.
- Strict CPT bounds give a positive observational joint; intervention-induced structural zeros remain permitted.

My additional real-Z3 normalization probe,

```text
Graph: X -> Y; Y -> Z
Pr(Z | do(Y=0)) + Pr(~Z | do(Y=0)) != 1
```

returned **UNSAT** without invoking the tautology shortcut. Exact evaluation of `Pr(X)^2=1/2` returned a `root-obj` numeral without floating-point conversion.

I also inspected the graph/query validation, exact exponent checks, expansion bounds, witness construction, cancellation checks around evaluation awaits, reload gating, revision/token handling for file reads, and the new build/browser integration. The independent structural-noise oracle provides useful coverage beyond checking the compiler against itself.

Nonblocking refinements to Claude’s report:

- **M1:** confirmed; the assertion at `tests/causal.spec.ts:41` should target the value cell.
- **M2:** confirmed as a permanent-test weakness; the additional symbolic probe above passes.
- **M3:** rendering lies outside the search timer, but remains cancellable. This is a UX observation, not a required repair.
- **M4:** unsupported SMT names fail safely; the inherited naming behavior is not another gate blocker.
- **M5:** those fallbacks are unreachable from normal parsed input, but support legacy observational ASTs through the compiler API; `causal.spec.ts:232` tests that capability. They are not generally dead code.
- The supplied snapshot contains **59 files**, rather than 61; all hashes matched before and after my checks.

Checks actually performed: baseline diff against `724655b`; required documents and phase-source inspection; code-graph inspection; `npm run lint`; `npx tsc --noEmit`; **716 passing unit tests, one inherited skip and one todo**; temporary Vite production build producing both pages; **28 passing Chromium tests**, one process on strict 5174; and four additional probe groups outside the repository. No implementation or documentation edits, commits, deletions, deployments or permanent-service changes were made.

ID/IDC identification, rule derivations, latent confounding, correlated disturbances, cross-world counterfactuals, cycles, non-Boolean variables and stochastic/propositional interventions remain outside Phase 1. Fix F1/F2, add their acceptance regressions, rerun the checks, and obtain the required consensus recheck before advancing.

VERDICT: AGREE

## Claude  (verdict: AGREE, 24s)
CHECKPOINT
elapsed: ~32 min cumulative
tentative_verdict: Phase gate FAIL, by consensus; I endorse Codex's refined review
new_results: NEW: confirmed the snapshot lists 59 files (I miscounted 61); confirmed the observational fallbacks are exercised through the compiler API by the legacy-AST test in causal.spec.ts; agreed that delimiting the substituted query names is required and that a post-parse check alone is not enough
current_obstruction: none in the review; F1 and F2 block the gate until repaired
next_bounded_step: done for this review; root repairs F1 and F2, adds the acceptance regressions, reruns the checks, and requests a consensus recheck
token_cost: unavailable
END CHECKPOINT

**Phase gate: FAIL.** Codex and I agree on this, and agreeing on FAIL does not authorize starting Phase 2.

## Where I agree with Codex
- **The mathematics is sound.** We independently agree on:
  - both directions of the representation argument;
  - normalization by eliminating terminal non-intervened nodes;
  - hard-intervention surgery with mechanisms shared across all regimes;
  - mechanisms for parent configurations absent from observational support;
  - conditioning inside the intervention regime, with definedness guards applied after substitution;
  - regularity being equivalent to a strictly positive observational distribution.
- **Codex's extra normalization probe closes M2's coverage question.** It checked `Pr(Z | do(Y=0)) + Pr(~Z | do(Y=0)) != 1` with real Z3 and got UNSAT, without the tautology shortcut. That shows the symbolic identity holds in the generated SMT. M2 is still worth adding as a permanent test, but it does not block the gate.
- **F2 is unchanged.** Codex reproduced the same values (16.1, 32.2, 1.0005). The repair is still `Math.round(seconds * 1000)`, plus an integer-ms UI assertion, a real-Z3 check, and a test where the timer expires.

## Where I concede to Codex
1. **The F1 repair must delimit the substituted names.** My report listed delimiting as secondary, which was wrong. In my alias example, `CausalQueryAA` is an exact query key, so a check that rejects only unmatched `CausalQuery…` names would let it through. The required repair has two parts:
   - substitute each query in parentheses, as `(CausalQueryX)`;
   - also reject any `CausalQuery…` identifier that is not an exact key, both in `parse_causal_document` and in `compile_causal_document` (the compiler can be called directly).

   With parentheses, `Pr(X)A` becomes `(CausalQueryA)A`, and `Pr(X)Pr(Y)` becomes `(CausalQueryA)(CausalQueryB)`. Both are parse errors.

   The parentheses do not interfere with the input limits. The 64-level nesting check runs on the raw text before substitution, and parenthesized expressions add no AST nodes, so existing AST-equality tests still hold.

   Acceptance: the regressions must reject all of these:
   - `Pr(X & Y) != Pr(X)Pr(Y)`
   - `Pr(X)x = 5`
   - `Pr(X)P(Y) = 5`
   - `Pr(X)e = 5`
   - `Pr(X)A = 1/3` followed by 26 queries

   They must still accept `Pr(X)*Pr(Y)`, `Pr(X)^2`, `-Pr(X)` and `~(Pr(X)=1/2)` with unchanged ASTs. Keep a real-Z3 regression showing that the correctly written independence check is UNSAT.
2. **M5 should be reworded.** The `probability`/`given_probability` cases at `causal.ts:293–294` can't be reached from parsed text. They are reachable through the compiler API, and the test "supports legacy observational ASTs without independent state-mass variables" exercises them. They are correct and should stay.
3. **The snapshot has 59 files, not 61.** All 59 hashes match.

## Remaining items and boundaries (unchanged)
- M1, M3 and M4 are non-blocking:
  - **M1:** the e2e assertion should target the value cell.
  - **M3:** witness rendering runs outside the search timer but stays cancellable.
  - **M4:** names Z3 reserves fail with an error rather than a wrong verdict, and the classical app behaves the same way.
- These are outside Phase 1: ID/IDC identification, rule derivations, latent or correlated disturbances, cross-world counterfactuals, cycles, non-Boolean variables, stochastic or propositional interventions, and graphs with more than 6 nodes.
- Before Phase 2, root needs to fix F1 and F2 with their acceptance tests, rerun lint, build, the unit suite and the 28-test e2e suite (one process, port 5174), and get a consensus recheck.

VERDICT: AGREE

