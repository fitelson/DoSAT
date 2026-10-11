# Consensus debate — 2026-10-11 16:52

## Question
Run the required final Phase 3 repair recheck using the consensus skill defaults: Claude Opus 5.5/xhigh and GPT-6.1 Sol/xhigh. No recursive debates, other model calls or delegation. Both returned reports must be compressed to at most 40,000 output tokens and within the runner's 40,000-UTF8-byte guard. Follow the six-field CHECKPOINT and literal final VERDICT protocol.

Workspace: /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus.
Read PHASE3_SECOND_REPAIR_RESOLUTION.md, PHASE3_FINAL_CANDIDATE_VERIFICATION.md, phase3_final_candidate_snapshot.json, and the agreed G1/G2 findings in phase3_recheck_consensus.md. All are under reviews/. The prior frozen 32-file candidate is phase3_repaired_snapshot.json. Whole-phase baseline is approved Phase 2 commit fa7d9bd0deccc2c01da04883c1ae55fb0d74a30c.

Scope this recheck to G1/G2 repairs and the subsequent user-requested Boolean intervention shorthand and famous examples. The initial review approved the mathematical reduction; the first recheck accepted F1 operation ownership and F2 negation-scope tests, plus the current toolchain. Preserve those approvals and qualifications. Older implementation is reference only where this new delta depends on it. Do not reopen a broad old-code or toolchain audit. Publication and Phase 4 are outside this audit.

G1: each logical stage first tries Solver('QF_NRA') with its own finite default60,000ms cap and native timeout, counted against any whole-run deadline. If UNKNOWN or locally expired, it waits for settlement, clears cap/retry timers, releases handles, rechecks cancellation/deadline, then uses an explicit Tactic('qfnra-nlsat').solver() on the identical polynomial formula. Complete fallback is unlimited only when the whole run is unlimited; otherwise it gets residual time. Expired fast verdicts cannot settle the stage. Locally interrupted check rejection can take the same cleanup/fallback route; genuine errors stay unresolved. User stop or whole deadline never starts fallback. Review the actual cap identities, stale callbacks, witness phase, check errors, operation retry and release ordering. API test cap and on_engine observer support actual short forced-fallback probes. No native physical settlement ceiling is promised.

G2: documentation now identifies post-interrupt QF_NRA strategy traversal rather than attributing it solely to preprocessing. Deadline means accepted-verdict deadline, not physical return/cleanup bound. Existing boundary-microtask tests remain, and new task-scheduled Cancel/input-edit browser cases fire50ms later while a low-level check is observed pending, then verify cancellation and wrapper reuse. Test-only response routing instruments the binding call without adding production hooks. Thresholds apply only to those instances. UI shows Cancelling while safely waiting for settlement. The export now uses explicit `(check-sat-using qfnra-nlsat)` as a complete reference route, clearly documenting that it omits the app's fast attempt. Review new test coverage and the accuracy of claims, not an invented universal latency requirement.

Notation: a narrow parse_interventions change accepts do(X), do(~X), and mixed comma-separated literal/numeric assignment lists. They normalize to existing Boolean interventions. Compound Boolean formulas, undeclared/index-invalid variables and repeated assignments remain rejected. Source spelling remains display metadata. Permanent equivalence cases compare byte-identical SAT/countermodel encodings. Review new grammar and integration only; no general parser audit.

Examples: new Simpson preset uses Z->X,Z->Y,X->Y, X treatment,Y recovery,Z severity. Constructed observational premises imply63% versus77% recovery, but do(X)/do(~X) imply75% versus65%. It asks for the reversal; another regression verifies all four exact rates. New empty-premise back-door preset with regularity asks Pr(Y|do(X))=Pr(Y|X&Z)*Pr(Z)+Pr(Y|X&~Z)*Pr(~Z). Both should entail. These are an illustrative Boolean instance and a general graph law, not an empirical data claim or latent-confounding/ID extension.

Use bounded independent checks and meaningful relevant repros. Do not edit/create/delete checkout files or dependencies. Every new probe/build/cache/report must be in a fresh temporary directory OUTSIDE checkout; no node_modules probes or cleanup/deletion. Do not run npm ci/install in checkout. Temp builds use --emptyOutDir false. Vitest temporary config should be rooted at checkout against original tests. Playwright1.64 filenames precede --project=chromium; one serial headless process, strict5174, temporary output/report paths. Stop only servers you start; never contact or touch permanent5317. Raw journals remain private. Verify frozen source hashes before and after probes.

Give explicit Phase gate: PASS only when this scoped recheck is complete and no material issue remains. Otherwise FAIL with precise bounded repairs and acceptance. Agreement on repairs is not PASS. Preserve qualifications: supplied finite observed Boolean DAG with independent private disturbances; semantic complement includes undefined required conclusion terms; finite-resource/cancel/error/UNKNOWN outcomes prove nothing. No uniform physical time/memory/cancel bound. No ID/IDC, latent, cyclic, non-Boolean or cross-world extension. The active unlimited hybrid reaches NLSat conditional on budgeted native attempts settling/resources. Share reviewed Markdown only. Report fresh-context29/69 benchmark and later reused-context hybrid measurements separately; do not infer universal performance superiority.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 21m 23s (2 turns); Codex: 6m 46s (1 turns); total: 28m 09s

## Agreed answer
# DoSAT 1.0 Phase 3: final scoped repair recheck

**Phase gate: PASS.** This recheck covered the G1/G2 repairs, the Boolean intervention shorthand, and the Simpson and back-door examples. Nothing material remains.

- **G1 (hybrid solver path):** repaired. The record's argument that every stage eventually reaches the complete engine is now correct, with its stated conditions.
- **G2 (cancellation and deadlines):** repaired. The explanations and deadline wording are now accurate. New browser tests fire a real Cancel or input edit while a solver check is still running.
- **Boolean intervention shorthand:** narrow and correct. The shorthand produces byte-identical solver encodings to the numeric form.
- **Simpson and back-door presets:** mathematically correct, and both are entailed.

The earlier approvals still stand with their qualifications: the mathematical reduction, F1 operation ownership, F2 negation-scope tests, and the toolchain verification.

## 1. Scope and hygiene

- **Frozen sources:** all 37 hashes in `phase3_final_candidate_snapshot.json` matched before and after every probe.
- **Delta from the prior 32-file candidate:** 11 changed and 5 new files, exactly as declared. The compiler `src/causal_decision.ts` is unchanged, so the approved reduction is untouched.
- **Checkout untouched:**
  - `git status --porcelain` was identical before and after.
  - No dependency or `node_modules` content changed.
  - The only newer timestamps are `.DS_Store` (Finder) and the stat-cache refresh of `.git/index` caused by read-only `git status`/`git diff`.
- **Where probes ran:** every probe, build, cache and report lived in fresh temporary directories outside the checkout.
- **Processes and ports:** every process started for this recheck was stopped. Port 5174 was free afterwards, and port 5317 was never contacted. Raw journals stayed private, and only reviewed Markdown is shared.

## 2. Independent reproduction of the claimed checks

| Claim | Reproduced result |
|---|---|
| Full unit tests | 1,040 passed, one inherited skip, one todo, 26 files. Temporary config rooted at the checkout, original tests. |
| Per-file counts | Compiler 61, audit 9, solver 62, UI 19, syntax 99. All match. |
| Native semantic replay | Regenerated input SHA256 `084561cd…a87` is identical. Native Z3 5.1.0 matches 607/607. |
| TypeScript 7.0.2 and typed lint | `tsc --noEmit` is clean. Typed lint is clean on all changed source and test files. |
| Build and package | A fresh temporary build (`--emptyOutDir false`) matches all 20 packaged `dist` files byte for byte. All 21 manifest entries match in size and SHA256. The package `index.html` equals `webpage/dosat.html`. The bundled Z3 assets are byte-identical to `z3-solver`. |
| Chromium | 72/72 passed: one serial headless worker, strict port 5174, temporary output and report paths. |
| Real-task Cancel and edit cases | About 3.4 s each (3.37 / 3.39 s in a second run), including startup and reuse. Both assert that the low-level check was pending when the action fired. |

## 3. G1: hybrid routing and ownership

### Code review of `causal_decision_solver.ts`

- **Each attempt owns its cap.**
  - `checkAttempt` creates a new `attempt` object with its own `fastDeadline` and `fastTimer`.
  - The cap callback does nothing unless `activeAttempt === attempt && fastTimer !== undefined`.
  - An interrupt retry runs only if `(stopped || activeAttempt?.expired)` holds and the session and operation identities still match.
  - So an old cap cannot reach a later stage, the fallback, witness extraction, or a later run.
- **Budgets.**
  - The fast attempt's native timeout is the smaller of what remains of its local cap and what remains of the whole-run budget.
  - The complete fallback gets timeout 0 when the whole run is unlimited, and otherwise only the residual whole-run time.
  - In Z3 5.1, `scoped_timer.cpp` returns early when the timeout is 0, so 0 really means no timer.
- **Local cap ends before witness extraction.**
  - The local cap covers loading and search.
  - Loading is synchronous, and expiry is checked after it.
  - `clearFastTimer()` runs before witness extraction, so only the whole-run deadline covers extraction.
- **Settlement comes before release, and release before fallback.**
  - The fast session is released in `checkAttempt`'s `finally` block, after the awaited check has settled.
  - `checkStage` then rechecks cancellation and expiry, yields once, and rechecks again.
  - Only then does it create `Tactic('qfnra-nlsat').solver()` on the identical polynomial input string.
- **Expired results are discarded.** After a fast check returns, expiry is checked again, so a late SAT/UNSAT from an expired attempt never settles the stage. A probe where the clock passes the cap without the timer callback firing falls back as specified.
- **Error classification.**
  - A rejected check counts as "fast attempt expired" only when `checking && engine === 'fast' && fastExpired()`.
  - Genuine errors before local expiry stay ERROR.
  - Errors during witness extraction stay ERROR, because `checking` is false by then.
- **Whole-run stop.** User cancellation or whole-run expiry returns at the post-fast check, the pre-fallback check, or the attempt's own pre-check. Fallback never starts.

### Mutation testing

Thirteen mutants were applied to the solver in a temporary copy (no source edits). Each was run against the 62 solver tests.

- **Killed (8):**
  - removing the cap identity guard;
  - deleting the rejected-check fallback;
  - not clearing the cap before the witness;
  - not falling back on UNKNOWN;
  - not discarding expired late results;
  - dropping the residual-budget minimum;
  - dropping the expired-attempt retry condition;
  - using `QF_NRA` instead of NLSat for the fallback.
- **Equivalent or redundant (4):**
  - removing either the post-fast or the pre-fallback stop check (both are covered by the attempt's own pre-check);
  - swapping the order of the synchronous release and the session reset;
  - removing the extra yield before fallback.
- **Survived (1), "S2": removing `checking &&`.**
  - With that mutation, a genuine witness-extraction error after the local deadline would silently fall back instead of returning ERROR.
  - The current code is correct. Two separate temporary probes confirm it: such a rejection returns ERROR at stage `witness`, creates no fallback session, releases its handles and allows reuse. Those probes also kill S2.
  - This is a test-coverage gap only (N2 below).

### Real-engine evidence

All runs used WebAssembly Z3 5.1 in Node on the six-node identity `Pr(F|do(A=1)) = Pr(F|A)`. They are instance-specific measurements.

| Run | Route | Result |
|---|---|---|
| Fresh context, default hybrid (three runs) | fast path settled | entailed in 29.2 / 29.4 / 29.2 s |
| Fresh context, explicit NLSat (1 ms cap) | complete engine | entailed in 59.5 s |
| Reused context, 3 s cap firing during a pending `QF_NRA` check | settled 1.19 s after the cap, then NLSat started | NLSat still running at 296 s. External cancel settled in about 4 ms; reuse correct. |
| Same wrapper immediately after a fresh run, no interrupts | fast attempt reached its 60 s cap; fell back at 61.3 s | NLSat still running at 150 s. Cancel settled; reuse correct. |
| Reused context, default hybrid | fell back at 61.6 s | NLSat still running at 240 s. Cancel settled; reuse correct. |
| New context in the same process | fast path | entailed in 29.2 s |
| 300 ms cap, interruption observed during a pending fast check | fast check settled about 1,152 ms after the first interrupt; NLSat started only after that | Abort during the pending fallback settled about 11.2 ms later, returned CANCELLED; reuse returned UNSAT. |

What these runs establish:

- **The repaired path works on a real engine.** A local cap interrupts a running `QF_NRA` check. The check settles after about 1.15–1.6 s of strategy traversal. Handles are released, and explicit NLSat starts on the same input. Cancellation during the fallback settles promptly, and the wrapper keeps giving correct results on reuse.
- **The new mid-check probes fill a gap in the permanent tests.** The permanent real-engine tests use a 1 ms cap, which can expire before the check starts. The 3 s and 300 ms probes interrupt a check that is already running.
- **This instance shows a slowdown that depends on the context's history.**
  - A fresh context takes about 29 s.
  - Reusing the same wrapper, even without interrupts, reaches the fast cap, and NLSat stays unresolved for at least 150–296 s.
  - A new context in the same process recovers 29 s.
  - No lifecycle or ownership defect is implicated, and no stated guarantee is contradicted.
- **The older untraced 8 min 23 s reused-context run stays unattributed.** The new results are consistent with it but cannot attribute it after the fact.
- **The three sets of measurements stay separate:**
  - the fresh-context benchmark of 29.147 s plain, 28.947 s `QF_NRA` and 69.849 s explicit NLSat;
  - the reused-context measurements above;
  - the old unresolved run.

  None of them establishes general performance superiority for either engine.

### Claims match the code

The following sources all agree with the code:
- DECISION_SEMANTICS §Decidability and the second repair resolution;
- README, PROJECT.md and AGENTS.md;
- the landing page, the UI mode label and help text, and the solver comments.

Specifically, they:
- attribute completeness to explicit NLSat, not to the `QF_NRA` portfolio;
- state the conditional route: an active unlimited run reaches NLSat assuming the budgeted native attempts settle and resources suffice;
- claim neither forcible termination nor uniform bounds.

The adapter unit tests assert the engine sequence `['QF_NRA', 'qfnra-nlsat', 'QF_NRA']` with one reused tactic and context.

## 4. G2: cancellation explanation, deadlines and coverage

- **Explanation corrected.** Slow cancellation is now attributed to `or_else` continuing through the `QF_NRA` strategies after an interrupt, rather than to preprocessing. This is consistent with the tagged Z3 5.1 `qfnra_tactic.cpp` and `tactical.cpp` sources. The 2.8–2.9 s and 6.6–6.7 s figures are tied to their instances and machine.
- **Deadline meaning corrected.** The whole-run deadline governs which verdicts are accepted and blocks fallback. It does not bound physical return or cleanup time.
- **Boundary vs. task-scheduled tests.** The boundary-microtask tests are kept and labelled as covering a different path.
- **New task-scheduled browser cases.**
  - `setTimeout(act, 50)` fires after the stage's yield.
  - Test-only response routing wraps `Z3.solver_check_assumptions`; no production hook is added.
  - The tests assert that the countermodel stage's fast check is still pending when the action fires (`data-native-pending-at-action == 'true'`).
  - They then verify the final status within a 10 s threshold that applies to these instances only, and check reuse through example 0.
- **UI status.** While waiting for settlement, the UI shows "Cancelling; waiting for the solver to settle…" (unit-tested) or "Input changed; cancelling the previous decision…". Stage updates are suppressed after abort.
- **SMT export.**
  - The export starts with a comment saying the app first tries a time-capped `QF_NRA` strategy, then gives:
    - the premises followed by `(check-sat-using qfnra-nlsat)`;
    - `(reset)`;
    - the countermodel problem with fresh declarations, again followed by `(check-sat-using qfnra-nlsat)`.
  - This is the complete reference route. Its formulas are identical to the app's, but it omits the app's fast attempt and lifecycle wrapper.

## 5. Boolean intervention shorthand

- **Grammar change.** The diff from `fa7d9bd` touches only `parse_interventions` and its help messages.
  - The numeric-assignment regex is unchanged.
  - The new literal form `^\s*(~)?\s*VAR\s*$` accepts only `~` as negation.
  - The declared-variable, index-validity and repeated-assignment checks apply to both forms.
- **Permanent tests.** The 99 syntax cases cover the rejection cases `do(X&Z)`, `do(~(X))`, `do(~~X)`, `do(!X)`, `do(-X)`, `do(~X=0)` and `do(X,)`, along with repeated or contradictory assignments and index validity. They assert byte-identical SAT and countermodel encodings, including for mixed forms.
- **Additional probes (all behaved correctly).**
  - Accepted: `do( ~ X ,Z )`, `Pr(~Y|do(~X))`, `do(X), ~Z` (where `~Z` is ordinary evidence in the intervention regime), `do (X)`.
  - Rejected: `do(~X=1)`, `do(X=1=1)`, `do(X Z)`, `do(¬X)`, `do(~)`, `do(X)(Z)`, `do(X),`, `do(X,Y,~Y)`, `do(X), do(Z)`, `do(X ~Z)`, undeclared `do(T)`, `do(~ ~X)`.
- **Parser mutants.** Making the literal match always succeed fails 7 tests; accepting `!` or `-` fails 2.
- **Display only.** The original spelling is kept as display metadata. No stochastic, propositional or cross-world intervention semantics is introduced.

## 6. Examples

**Simpson preset** (graph Z→X, Z→Y, X→Y; X treatment, Y recovery, Z severity):

- Observational rates:
  - P(Y|X) = (0.27 + 0.045)/0.5 = 63/100
  - P(Y|¬X) = (0.025 + 0.36)/0.5 = 77/100
- Interventional rates:
  - P(Y|do(X)) = ½·3/5 + ½·9/10 = 3/4
  - P(Y|do(¬X)) = ½·1/2 + ½·4/5 = 13/20
- Treatment is better in both strata (0.6 > 0.5 and 0.9 > 0.8), so this is a genuine reversal.
- The data are constructed and illustrative, not empirical.

**Back-door preset.**
- With empty premises and regularity, positive support makes each observational stratum equal its mechanism. That entails Pr(Y|do(X)) = Pr(Y|X&Z)·Pr(Z) + Pr(Y|X&¬Z)·Pr(¬Z).
- It is a general law for this observed graph. It is not a latent-confounding or ID extension.

**Native Z3 5.1 on the exports** (premise check / countermodel check):

| Problem | Result | Reading |
|---|---|---|
| Simpson reversal | sat / unsat | entailed |
| Simpson, non-regular | sat / unsat | entailed (the premises already force interior parameters) |
| Simpson, all four exact rates | sat / unsat | entailed |
| Simpson, wrong rate `do(X)=63/100` | sat / sat | not entailed (control) |
| Back-door | sat / unsat | entailed |
| Back-door, `do(~X)` variant | sat / unsat | entailed |
| Naive `Pr(Y\|do(X)) = Pr(Y\|X)` | sat / sat | not entailed (control) |
| Back-door, non-regular | sat / sat | not entailed: undefined required conclusion terms count as countermodels (control) |
| Mediator graph X→Z→Y, X→Y | sat / sat | not entailed (control) |

In Chromium, example 7 (Simpson) and example 8 (back-door) are entailed, and the four-rate regression passes.

## 7. Non-blocking recommendations

- **N1. Context-reuse performance.**
  - Record the controlled measurements from §3 as instance-specific evidence: reuse slowed this instance from 29 s to "fast cap reached, NLSat unresolved for at least 150–296 s", while a new context recovers 29 s.
  - In the browser, a second hard run on the same page may therefore take minutes.
  - A later phase could weigh a fresh context per decision against the current finalizer-based context reclamation, including memory measurements.
  - There is no correctness impact.
- **N2. Make the S2 regression permanent.** After the local fast deadline, a witness-extraction error must return ERROR at stage `witness`, create no fallback session, release its handles and allow reuse. The temporary probes are ready templates.
- **N3. Neutral help wording.** Replace "Each stage first tries a *faster* strategy for up to 60 seconds" with neutral wording such as "a time-capped QF_NRA strategy", matching the landing page. The "faster" claim rests on one fresh-context instance and does not hold on reuse.
- **Optional.** Add a permanent real-engine test with a cap of a few hundred milliseconds, so a running fast check is actually interrupted before fallback. The 3 s and 300 ms probes have already confirmed this ordering.

## 8. Qualifications preserved

- **Model class:** a supplied finite observed Boolean DAG with independent private disturbances.
- **Undefinedness:** the semantic complement includes countermodels with undefined required conclusion terms.
- **Unresolved outcomes:** finite-resource, cancelled, error and UNKNOWN outcomes prove nothing.
- **No uniform bounds:** there is no uniform physical bound on time, memory or cancellation. A deadline governs which verdicts are accepted, not physical settlement.
- **Route to NLSat is conditional:** an active unlimited hybrid run reaches explicit NLSat only on condition that the budgeted native attempts settle and resources suffice.
- **Extensions:** no ID/IDC, latent, cyclic, non-Boolean or cross-world extension is claimed.
- **Evidence:** WebAssembly and native Z3 5.1 are two runtimes of one solver. Finite probes complement the reduction proof; they do not replace it.
- **Benchmarks:** the fresh-context 29/69 s benchmark, the later reused-context hybrid measurements, and the unattributed 8 min 23 s run are reported separately. No general performance superiority is inferred.
- **Out of scope:** publication and Phase 4.

## Evidence (reviewed Markdown, outside the checkout)

- `/tmp/dosat-p3f-claude-n9Fr38/EVIDENCE_INDEX.md`
- `/tmp/dosat-p3f-codex-fbhuq1xz/EVIDENCE.md`

## Claude  (verdict: DISAGREE, 20m 55s)
CHECKPOINT
elapsed: about 21 minutes of wall-clock time (16:23–16:44 EDT)
tentative_verdict: Phase gate PASS proposed. Codex's independent check is still pending.
new_results: NEW: I independently reproduced every claimed check. Mutation tests of the hybrid solver guards found one real test-coverage gap; the code itself is correct, which a probe outside the checkout confirms. Native Z3 checked the exports for both new presets plus four negative controls. Controlled WebAssembly probes explain why the root's reused-context run never finished: reusing one Z3 context slows both engines on this instance. A new context gives back the 29 s result. No lifecycle defect is involved.
current_obstruction: none material. Three non-blocking recommendations are listed below.
next_bounded_step: Codex verifies independently. If Codex finds nothing material, we confirm PASS.
token_cost: unavailable
END CHECKPOINT

# DoSAT 1.0 Phase 3: final scoped recheck (Claude, opening)

**Phase gate: PASS.**
- **G1 (hybrid solver path):** repaired correctly, with an accurate termination argument.
- **G2 (cancellation claims and coverage):** the records are corrected, and the new browser tests exercise real task-scheduled Cancel and edit actions.
- **Boolean intervention shorthand:** narrow and correct. It produces byte-identical solver encodings to the numeric form.
- **Simpson and back-door presets:** mathematically correct.

Three non-blocking items remain (§6). None affects soundness, the agreed G1/G2 acceptance criteria, or a stated guarantee.

The earlier approvals stand with their qualifications: the mathematical reduction, F1 operation ownership, F2 negation scope, and the toolchain.

## 1. Hygiene and scope

- **Frozen sources:** all 37 hashes in `phase3_final_candidate_snapshot.json` matched before and after the probes.
- **Delta from the prior 32-file candidate:** 11 changed and 5 new files, exactly as declared. `src/causal_decision.ts` (the compiler) is unchanged.
- **Checkout untouched:**
  - `git status --porcelain` was identical before and after.
  - Nothing new appeared in the `node_modules` caches.
  - Only `.DS_Store` (Finder) and `.git/index` are newer. The `.git/index` change is the stat-cache refresh that read-only `git status`/`git diff` performs; no content changed.
- **Temp directory:** all artifacts are in `/tmp/dosat-p3f-claude-n9Fr38/` (see `EVIDENCE_INDEX.md` there).
- **Processes and ports:** I stopped every process I started. Port 5174 is free afterwards, and port 5317 was never contacted. Raw journals stayed private.

## 2. Independent reproduction of the claimed checks

| Claim | My result |
|---|---|
| Full units | 1,040 passed, 1 skip, 1 todo across 26 files. Temp config rooted at the checkout, original tests. |
| Per-file counts | Compiler 61, audit 9, solver 62, UI 19, syntax 99. All match. |
| Native replay | Regenerated through the audit's opt-in prefix. Input SHA is `084561cd…a87` (identical), and native Z3 5.1.0 matches 607/607. |
| TypeScript 7.0.2 / typed lint | `tsc --noEmit` is clean. ESLint is clean on all 8 changed source and test files. |
| Build and package | Fresh temp build (`--emptyOutDir false`) matches 20/20 packaged `dist` files byte for byte. All 21 manifest entries match in size and SHA256. The package `index.html` equals `webpage/dosat.html`. The Z3 assets in `public/` are byte-identical to `z3-solver`. |
| Chromium | 72/72 on one worker, strict port 5174, temp output paths. The 23 decision cases include examples 7 (Simpson) and 8 (back-door) entailing, the four-rate Simpson regression, and the task-scheduled cancel and edit at 3.4 s each. |

## 3. G1: hybrid routing and ownership

I read every line of `causal_decision_solver.ts` (the routing, the per-attempt state and the error paths).

### Code review: each claim checks out

- **Separate cap per attempt.**
  - `checkAttempt` creates a new `attempt` object with its own `fastDeadline` and `fastTimer`.
  - The cap callback returns early unless `activeAttempt === attempt && fastTimer !== undefined`.
  - The interrupt retry tick requires `(stopped || activeAttempt?.expired)` and the same session and operation identity.
  - So an old cap can reach neither a later stage, nor the fallback, nor a later run.
- **Budgets.**
  - The fast attempt's native timeout is `min(fastDeadline − now, remaining whole-run time || fastTimeout)`.
  - The fallback gets `0` (unlimited) when the run is unlimited, otherwise only the residual time.
  - In Z3 5.1, `scoped_timer.cpp:80` returns early for `ms == 0`, so timeout 0 really means no timer.
  - The local cap covers load and search. `load` is synchronous, and `fastExpired()` is checked after it. `clearFastTimer()` runs before witness extraction, so the whole-run deadline alone covers extraction.
- **Settlement before fallback.**
  - The fast session is released in `checkAttempt`'s `finally`, after the awaited check settles.
  - `checkStage` then rechecks `stoppedResult()`, yields once, and rechecks again before creating the explicit NLSat solver (`Tactic('qfnra-nlsat').solver()`) on the identical `input` string.
  - An expired late SAT/UNSAT is discarded: `fastExpired()` is checked after the check returns. My probe in which the clock passes the cap without the timer callback running falls back as specified.
- **Errors.**
  - A rejected check is treated as `fast-expired` only when `checking && engine === 'fast' && fastExpired()`.
  - Genuine errors before expiry stay ERROR.
  - Witness errors stay ERROR, because `checking` is false by then.
- **Whole-run stop.** Cancel or expiry returns at `afterFast`, `beforeComplete`, or the attempt's `before` check. Fallback never starts.

### Mutation testing

I applied 13 transform-only mutants to the solver, with no source edits, and ran each against the 62 solver tests.

- **Killed (8):**
  - removing the cap identity guard (2 tests fail);
  - deleting the rejected-check fallback (1);
  - not clearing the cap before the witness (2);
  - not falling back on UNKNOWN (9);
  - not discarding expired late results (1);
  - dropping the residual-budget minimum (1);
  - dropping the expired-attempt retry condition (3);
  - fallback using `QF_NRA` instead of NLSat (1).
- **Equivalent or redundant (4):**
  - removing `afterFast` or `beforeComplete` (covered by `checkAttempt`'s own `before` check);
  - reordering `release` and the `activeSession` reset (synchronous);
  - removing the extra yield before fallback.
- **Real coverage gap (1), S2:** removing `checking &&` survives. Without it, a genuine witness-extraction error after the local deadline time would silently fall back instead of returning ERROR. The current code is correct: my temp probe returns `error` at stage `witness` with only the fast session created, and that probe kills S2. This is non-blocking item N2.

### Real-engine evidence (Node/WebAssembly Z3 5.1, six-node identity `Pr(F|do(A=1)) = Pr(F|A)`)

| Run | Engine route | Result |
|---|---|---|
| E1 / P1 / E4a: fresh context, default hybrid | fast path settled | entailed in 29.2 / 29.4 / 29.2 s |
| E3: fresh context, explicit NLSat (cap 1 ms) | complete | entailed in 59.5 s |
| P2: reused context, 3 s cap fired during the pending `QF_NRA` check | settled 1.19 s after the cap, then NLSat started | NLSat still running at 296 s. External cancel settled in about 4 ms, and reuse stayed correct. |
| E2: same wrapper immediately after E1 (no interrupts) | fast attempt missed the 60 s cap; fell back at 61.3 s | NLSat still running at 150 s. Cancel settled; reuse correct. |
| P3: reused context, default hybrid | fell back at 61.6 s | NLSat still running at 240 s. Cancelled; reuse correct. |
| E4b: **new** context in the same process | fast path | entailed in 29.2 s |

What these runs establish:
- **The repair works end to end on a real engine.** A local cap interrupting a running `QF_NRA` check settles (about 1.2–1.6 s of cascade), releases, and starts explicit NLSat on the same context. Later runs on that wrapper still return correct results.
- **The slowdown comes from reusing one Z3 context.** It is not caused by interrupts or by the wrapper's lifecycle code. E2 has no interrupts, and E4b, with a fresh context in the same process, recovers 29 s.
- **This explains the root's unresolved 8m23s run.** The record correctly declined to attribute it, and my runs now attribute it.
- **No guarantee or claim is contradicted.** The documents claim no performance, and the conditional reach-NLSat argument holds.
- **Benchmarks stay separate.** The fresh-context 29.147 / 28.947 / 69.849 s benchmark and these reused-context measurements are kept apart, and no universal performance superiority follows from either.

### Claims match the code

DECISION_SEMANTICS §Decidability, the second repair resolution, README lines 15–20 and 41–42, PROJECT.md, AGENTS.md, the landing page, the UI mode label and help text, and the solver comments all now:
- attribute completeness to explicit NLSat, not to the `QF_NRA` portfolio;
- state the conditional route ("assuming budgeted native attempts settle and resources suffice"); and
- do not claim forcible termination or uniform bounds.

The adapter unit tests assert `['QF_NRA', 'qfnra-nlsat', 'QF_NRA']` and one reused tactic and context.

## 4. G2: cancellation diagnosis, deadlines and coverage

- **Diagnosis corrected.** Post-interrupt `or_else` traversal of the `QF_NRA` strategies replaces the "preprocessing" explanation. The 2.8–2.9 s and 6.6–6.7 s figures are attributed to their instances and machine.
- **Deadline meaning corrected.** A deadline is now described as governing which verdicts are accepted, not physical return or cleanup time. The bounded overrun is documented.
- **Boundary vs. task actions.** The boundary-microtask tests are retained and labelled as a different path.
- **New task-scheduled tests.**
  - `setTimeout(act, 50)` fires after the stage's yield.
  - Route-only test instrumentation (no production hook) wraps `Z3.solver_check_assumptions`. Check #2 is the countermodel stage's fast check, and the test asserts `data-native-pending-at-action == 'true'`.
  - The tests then assert the final status within an instance-specific 10 s threshold, plus reuse via example 0.
  - Both pass, at 3.4 s each.
- **UI status.** It shows "Cancelling; waiting for the solver to settle…" (unit-tested) or "Input changed; cancelling the previous decision…", and on-stage updates are suppressed after abort.
- **Export.**
  - The export is `; Complete NLSat reference checks. The app first tries a time-capped QF_NRA strategy.`, followed by premises, `(check-sat-using qfnra-nlsat)`, `(reset)`, the countermodel problem, and `(check-sat-using qfnra-nlsat)`.
  - I rebuilt it exactly for 9 problems and ran native Z3 5.1. The results are in §5.

## 5. Notation and examples

### Notation
- **Grammar change.** The diff from `fa7d9bd` touches only `parse_interventions` and the help messages.
  - The explicit-assignment regex is unchanged.
  - The new literal form is `^\s*(~)?\s*VAR\s*$`, so only `~` is accepted.
  - The declared-variable and repeated-assignment checks apply to both forms.
- **Tests.** The 99 syntax cases cover `do(X&Z)`, `do(~(X))`, `do(~~X)`, `do(!X)`, `do(-X)`, `do(~X=0)`, `do(X,)`, the repeated and contradictory forms, and index validity. Byte-identical SAT and countermodel encodings, including mixed forms, are asserted.
- **My extra probes.** 18 more probes pass. Accepted: `do( ~ X ,Z )`, `Pr(~Y|do(~X))`, `do(X), ~Z`, `do (X)`. Rejected: `do(~X=1)`, `do(X=1=1)`, `do(X Z)`, `do(¬X)`, `do(~)`, `do(X)(Z)`, `do(X),`, `do(X,Y,~Y)`, `do(X), do(Z)`, `do(X ~Z)`, `do(T)` undeclared, `do(~ ~X)`.
- **Parser mutants.** Making a literal always true fails 7 tests; accepting `!` or `-` fails 2.

### Examples
- **Simpson arithmetic, checked by hand.**
  - P(Y|do(X)) = ½·0.6 + ½·0.9 = 0.75, and P(Y|do(~X)) = ½·0.5 + ½·0.8 = 0.65.
  - P(Y|X) = (0.27 + 0.045)/0.5 = 0.63, and P(Y|~X) = (0.025 + 0.36)/0.5 = 0.77.
  - Both strata favour treatment (0.6 > 0.5 and 0.9 > 0.8), so this is a genuine Simpson reversal.
- **Native Z3 export results (premise check / countermodel check):**

  | Problem | Result | Reading |
  |---|---|---|
  | Simpson | sat / unsat | entails |
  | Simpson, non-regular | sat / unsat | entails (the premises already force interior parameters) |
  | Simpson, four rates | sat / unsat | entails |
  | Simpson, wrong rate `do(X)=63/100` | sat / sat | not entailed (control) |
  | Back-door | sat / unsat | entails |
  | Back-door, `do(~X)` variant | sat / unsat | entails |
  | Naive `Pr(Y\|do(X)) = Pr(Y\|X)` | sat / sat | not entailed (control) |
  | Back-door, non-regular | sat / sat | not entailed: the undefined-term semantics at work (control) |
  | Mediator graph `X->Z->Y, X->Y` | sat / sat | not entailed (control) |

- **Wording.** The presets are described as an illustrative constructed instance and a general graph law. No empirical, latent or ID claim is made.

## 6. Non-blocking recommendations

- **N1. Context-reuse performance.**
  - Record the controlled attribution from §3: same-wrapper reuse took this instance from 29 s to "fast cap reached, NLSat unresolved for at least 150–296 s", while a new context recovers 29 s.
  - In the browser, the second hard run on one page may therefore take minutes.
  - A later phase could weigh a fresh context per decision against finalizer-only context reclamation (the reason for the current design), and measure memory.
  - There is no correctness impact.
- **N2. Permanent S2 regression.** Add a test that a witness-extraction error after the local fast deadline returns `error` at stage `witness`, with no fallback session created. My temp probe is a ready template.
- **N3. Help-text wording.** The UI help says "Each stage first tries a *faster* strategy for up to 60 seconds." That rests on one fresh-context instance, and E2 contradicts it on reuse. Use neutral wording such as "a time-capped QF_NRA strategy", matching the landing page.
- **Optional.** Add a permanent real-engine test with a cap of a few hundred ms, so the fast check is actually interrupted mid-check before fallback. The current real tests use a 1 ms cap, which can expire before the check begins; the interrupted-check ordering is covered by fake tests and by my P2, P3 and E2 runs.

## 7. Qualifications preserved

- **Model class:** a supplied finite observed Boolean DAG with independent private disturbances.
- **Undefinedness:** the semantic complement includes countermodels with undefined required conclusion terms.
- **Unresolved outcomes:** finite-resource, cancelled, error and UNKNOWN outcomes prove nothing.
- **No uniform bounds:** there is no uniform physical bound on time, memory or cancellation. An active unlimited run reaches explicit NLSat only on condition that the budgeted native attempts settle and resources suffice.
- **Extensions:** no ID/IDC, latent, cyclic, non-Boolean or cross-world extension is claimed.
- **Evidence:** WebAssembly and native Z3 5.1 are two runtimes of one solver, and finite probes complement the reduction proof rather than replace it.
- **Out of scope:** publication and Phase 4.

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 6m 46s)
CHECKPOINT
elapsed: about 7 minutes
tentative_verdict: AGREE; Phase gate PASS
new_results: NEW: Independently verified frozen hashes, full units and Chromium, 607 native replay verdicts, build/package equivalence, and four additional routing/error/example probes.
current_obstruction: none material
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

**Phase gate: PASS.** I endorse your scoped conclusion. G1/G2 are repaired; the Boolean shorthand and both examples are correct. The earlier mathematical, F1/F2 and toolchain approvals stand with their qualifications.

My independent verification agrees with yours:

| Check | Result |
|---|---|
| Frozen candidate | 37/37 hashes match before and after; Git status unchanged |
| Full units | 1,040 passed, one inherited skip and one todo |
| Full Chromium | 72 passed; serial headless execution on strict port 5174 |
| Native semantic replay | 607/607 match; regenerated input has the recorded SHA256 |
| TypeScript / scoped typed lint / temporary build | Pass |
| Prepared package | 21 manifest entries match; all 20 `dist` files equal the fresh build |

The task-scheduled Cancel and input-edit cases passed in approximately 3.37 and 3.39 seconds, including startup and reuse. Both asserted that the low-level check was pending at the action.

**G1’s ownership and routing are correct.** Each attempt owns its cap; interrupt retries additionally capture session and operation identities. Settlement precedes release and fallback. Expired fast verdicts are discarded, whole-run cancellation or expiry prevents fallback, and bounded fallback receives residual time. The cap clears before witness extraction; extraction errors remain ERROR.

I independently confirmed your S2 observation: a witness rejection after the local deadline returns ERROR at `witness`, creates no fallback session, releases its handles and permits reuse. Making this regression permanent is useful but nonblocking.

My additional real-engine probe used a **300 ms cap**, with instrumentation observing interruption during a pending fast check. The fast check settled approximately **1,152 ms after the first interrupt**; explicit NLSat then started with no preceding check pending. Abort during the pending fallback settled approximately **11.2 ms later**, returned CANCELLED, and subsequent wrapper reuse returned UNSAT. These are instance-specific WebAssembly measurements.

**G2’s corrected explanation and deadlines are accurate.** The tagged [portfolio source](https://github.com/Z3Prover/z3/blob/z3-5.1.0/src/tactic/smtlogics/qfnra_tactic.cpp) and [strategy-combinator source](https://github.com/Z3Prover/z3/blob/z3-5.1.0/src/tactic/tactical.cpp) support the distinction between an accepted-verdict deadline and later physical settlement. The explicit-NLSat export, reset between checks, UI cancellation status and real-task browser coverage satisfy the agreed repair.

**Notation and examples pass.** Literal and numeric interventions retain byte-identical polynomial encodings; malformed, compound, undeclared, invalid-index and repeated assignments remain rejected. For Simpson’s example,

\[
P(Y\mid X)=63/100,\quad P(Y\mid\neg X)=77/100,
\]
\[
P(Y\mid do(X))=(3/5+9/10)/2=3/4,\quad
P(Y\mid do(\neg X))=(1/2+4/5)/2=13/20.
\]

Positive support identifies each observational stratum with its corresponding mechanism, yielding the stated back-door sum. Native exports confirmed both presets and all four rates. Wrong-rate, nonregular undefined-term and mediator-graph controls returned countermodels.

I accept N1–N3 as nonblocking recommendations. One evidential qualification should remain: your controlled runs support **context-sensitive slowdown**, but the older untraced 08:23 run retains its unresolved, unattributed status. Keep it separate from the fresh-context 29/69 benchmark; neither establishes universal performance superiority.

All model-class, undefinedness and resource qualifications remain: finite observed Boolean DAGs with independent private disturbances; required undefined conclusion terms count as countermodels; cancellation, errors and UNKNOWN prove nothing. Reaching NLSat remains conditional on native settlement and resources. No uniform physical bounds or additional causal model classes are claimed.

[Reviewed Markdown evidence](/tmp/dosat-p3f-codex-fbhuq1xz/EVIDENCE.md). Checkout sources and dependencies were untouched; the owned server stopped, port 5317 was untouched, and raw journals remain private.

VERDICT: AGREE

## Claude  (verdict: AGREE, 28s)
CHECKPOINT
elapsed: about 24 minutes in total (16:23–16:47 EDT). This turn took about 3 minutes.
tentative_verdict: AGREE. The Phase gate is PASS.
new_results: NEW: All 37 frozen hashes still match after both participants' probes. Git status is unchanged and port 5174 is free. Codex's evidence file is present and agrees with every check I ran. I accept Codex's qualification about the old 08:23 run and withdraw my claim that I had attributed it.
current_obstruction: none
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

**Phase gate: PASS.** We agree on the outcome, the evidence and the non-blocking list.

## What I accept

- **Codex's 300 ms cap probe closes my "optional" gap.** The real tests use a 1 ms cap, which can expire before the check even starts. Codex's probe watched a fast check that was still pending get interrupted:
  - it settled about 1.15 s after the first interrupt;
  - explicit NLSat started only after that settlement;
  - cancelling the pending fallback settled in about 11.2 ms;
  - the wrapper then returned UNSAT on reuse.

  My P2, P3 and E2 runs showed the same order (1.2–1.6 s to settle, then NLSat). So the real-engine path through a mid-check cap is now shown by two independent runs. A permanent test for it is still a reasonable improvement, but it is not required.
- **The S2 gap is confirmed twice.** A witness-extraction error after the local deadline returns ERROR at stage `witness`. No fallback session is created, handles are released, and the wrapper can be reused. A permanent regression test is useful but non-blocking.
- **Codex's qualification about the old untraced run is correct.** In my opening I wrote that my runs "explain the root's unresolved 08:23 run" and "now attribute it". That overstated what the evidence supports. The correct statement is narrower:
  - My controlled runs show a slowdown that depends on context history for this six-node instance, and nothing more:
    - fresh context: 29.2 s, three times;
    - reusing the same wrapper with no interrupts in between (E2): the fast cap was reached, and NLSat had still not finished at 150 s;
    - a new context in the same process (E4b): 29.2 s again.
  - That is consistent with the old 08:23 run, but it cannot attribute an untraced run after the fact.
  - The record's choice to leave that run unattributed stands.
  - All three sets of numbers are kept separate: the fresh-context 29.147 / 28.947 / 69.849 s benchmark, my reused-context measurements, and the old run. None of them establishes general performance superiority for either engine.

## Shared answer

- **G1: repaired.**
  - Each attempt owns its cap; interrupt retries are tied to the session and operation that started them.
  - Settlement comes before release, and release before fallback.
  - Late verdicts from an expired fast attempt are discarded.
  - Cancellation or whole-run expiry prevents fallback. In bounded mode the fallback gets only the remaining time; in unlimited mode, timeout 0 really means no timer in Z3 5.1.
  - The cap is cleared before witness extraction, and extraction errors stay ERROR.
  - An active unlimited run reaches explicit NLSat only on condition that the earlier native attempts settle and resources suffice.
- **G2: repaired.**
  - The cause of slow cancels is now correctly given as the QF_NRA strategy traversal that continues after an interrupt.
  - The deadline is described as governing which verdicts are accepted, not physical return or cleanup time.
  - New task-scheduled Cancel and edit browser tests fire while the low-level check is observed pending, and verify reuse afterwards. Their thresholds apply only to the tested instances.
  - The UI shows "Cancelling" while it waits.
  - The export uses explicit `check-sat-using qfnra-nlsat` and documents the route difference.
- **Notation and examples: correct.**
  - The literal and numeric intervention forms produce byte-identical encodings, and the rejection cases hold.
  - Simpson rates are 63/100 versus 77/100 observed, and 3/4 versus 13/20 under intervention. The back-door identity is entailed under positive support.
  - Native exports confirm both presets. Negative controls (wrong rate, naive adjustment, non-regular support, mediator graph) give countermodels.
- **Non-blocking recommendations:**
  - **N1:** record the controlled context-reuse measurements as instance-specific evidence. A later phase could weigh a fresh context per run against context reclamation.
  - **N2:** make the S2 regression permanent.
  - **N3:** replace "a faster strategy" in the UI help with neutral wording.
  - **Optional:** add a permanent real-engine test with a short cap that interrupts a pending fast check.
- **Qualifications preserved:**
  - **Model class:** a supplied finite observed Boolean DAG with independent private disturbances.
  - **Undefinedness:** countermodels include undefined required conclusion terms.
  - **Unresolved outcomes:** finite-resource, cancelled, error and UNKNOWN outcomes prove nothing.
  - **Bounds:** there is no uniform physical bound on time, memory or cancellation.
  - **Extensions:** no ID/IDC, latent, cyclic, non-Boolean or cross-world extension is claimed.
- **Hygiene (both participants):**
  - All 37 hashes match.
  - The checkout and dependencies are untouched, and git status is unchanged.
  - The servers we owned are stopped; port 5317 was never touched.
  - Raw journals remain private, and only reviewed Markdown is shared.

VERDICT: AGREE

