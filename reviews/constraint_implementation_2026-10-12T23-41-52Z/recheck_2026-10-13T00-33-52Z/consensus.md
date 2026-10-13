# Consensus debate — 2026-10-12 21:13

## Question
Perform the required scoped implementation RECHECK of C1. The proposed position is: the repaired DoSAT implementation merits Phase gate: PASS, because its only material finding has been fixed exactly and verified. Independently endorse or reject that position. Say literal Phase gate: PASS or FAIL. If you endorse PASS, use VERDICT: AGREE; if a material repair is still needed, use VERDICT: DISAGREE. Agreement on repairs is not approval.

Repo: /Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus
Recheck folder: reviews/constraint_implementation_2026-10-12T23-41-52Z/recheck_2026-10-13T00-33-52Z
Original completed debate: ../consensus.md relative to this folder. It agreed FAIL solely on C1: inner.right.value===0 misclassified nonzero exact decimals which underflow in JavaScript, causing false ENTAILS and UNSAT/ERROR. Both participants agreed the architecture/design/other implementation evidence stands. The separate initial Claude PASS was withdrawn. No publication occurred.

Actual repair: one production line in src/causal_decision_optimization.ts replaces the rounded-value test with literal_q(inner.right).isZero(). The existing exact-source BigInt parser is authoritative. Every generated genuine zero guard remains handled the same way. Nonzero decimals follow the exact comparison path. No solver default, graph/model/preset, preflight, witness-validation or native lifecycle change. Node limit8 and Pearl admissions remain as previously reviewed.

Read REPAIRS.md, repair.diff, source-snapshot.json and the actual source/source-snapshot/. Verify the exact source is frozen; there are27 source/package files, including current README. All1354 unit tests pass (11 new permanent C1 tests), one inherited skip and one todo. Regresions cover regular/nonregular tiny countermodels, nonconstant marginal masses, zero root, impossible event, contradictory SAT/entailment, both control phrasings and exact-zero spelling0.000. Full unit run also reruns the independent607-case oracle. All59 affected Chromium tests pass, including2 new C1 tests with exact model evaluation. The earlier unchanged cases stand, for108 distinct browser cases total. Production differential rerun:27 scenarios/480000 exact comparisons/0 mismatches, including literal10^-351 and exact epsilon-valued probability parameters. Lint/types/build pass. Actual new package (release-manifest.json, release-path.txt) is eight files with dosat-45ZXtgOV.js. package-fixed-probe.json verifies42 admissions evaluations across1280/390/320 widths, Save/Load, negative control and8-node/new intervention/9-node rejection. package-underflow.json independently verifies correct tiny countermodel, exact model predicate, contradictory SAT=UNSAT and vacuous entailment=ENTAILS in both modes in the actual built browser bundle.

Scope this recheck to C1, the agreed required regression cases, source/package integrity, and whether this repair introduces a new material defect. The previous stages and mathematical audits are closed reference evidence; do not redo millions of random cases, the old400-pair audit or an omnibus review. Needed targeted checks may use ordinary tools, but must remain bounded. Return a completed compressed micro-report within15 minutes rather than one monolithic open-ended audit. If you need further work, state the exact remaining bounded obligation in that report. No recursive debates or model delegation. Both defaults must remain Claude Opus5.5/xhigh and GPT6.1Sol/xhigh.

Do not edit production/snapshot/existing evidence. Each participant may write only disjoint claude-* or codex-* files in this recheck folder. Create/reset a durable checkpoint file at start and append six-field checkpoints at least every15 minutes of active work, using actual clock readings; returned reports must also follow the runner CHECKPOINT protocol. Reports at most40000 output tokens; put longer evidence in a namespaced file. No commit, push or upload by either participant. The root agent will publish only after a completed explicit consensus PASS.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 27m 22s (1 turns); Codex: 3m 19s (1 turns); total: 30m 41s

## Agreed answer
# C1 recheck of the repaired DoSAT implementation

**Phase gate: PASS.** C1 is fixed exactly. The required regression tests exist and catch the bug when the old line is put back. The frozen source and the release package are intact. The repair adds no new material defect. This approval covers only the frozen C1 candidate and its package, not other changes in the working tree (see §5).

## 1. Source and package integrity

- **Source:** All 27 files listed in `source-snapshot.json` match on size and SHA-256, both in the working tree and in `source-snapshot/`. That folder holds exactly 27 files, including the current README.
- **Release package:** The directory named in `release-path.txt` holds the 8 manifest files plus `release-manifest.json`, and all 8 match their manifest hashes. `dist/index.html` loads `dosat-45ZXtgOV.js` (SHA-256 begins a8cdca18…).
- **No changes:** No production file, snapshot file or existing evidence file was edited, and nothing was published.

## 2. The repair is exact

- **What changed:** The repair changes one line in `src/causal_decision_optimization.ts`. Line 382 now tests `literal_q(inner.right).isZero()` instead of the rounded JavaScript value `inner.right.value === 0`.
- **How the zero test works:** `literal_q` / `Q.parse` turns the literal's original decimal text into an exact fraction of BigInts, so the zero test is exact.
- **Real zeros still take the shortcut.** The new condition fires only when the old one did and the literal is exactly zero. Every generated "not zero" guard (`pr_sat.ts:801`, `:809`, `:821`) uses a genuine zero, so all of them still take the same shortcut.
- **Tiny nonzero literals no longer do.** A literal that is positive but underflows to 0 in JavaScript, such as 10^-351, now goes through the existing exact comparison path. That removes the wrong ENTAILS, UNSAT and ERROR results.
- **No new parse failure on accepted input:**
  - The parser's number pattern, `/[0-9]+(\.[0-9]+)?/`, is the same pattern `Q.parse` accepts.
  - The parser keeps the source text, or drops it only when `String(value)` gives back the same string.
  - Generated literals are only `0` or `1`.
  - When the shortcut doesn't fire, the fallback comparison reads the same literal anyway, so the new test adds no new failure path for the accepted inputs and code paths examined.
  - This is not a universal guarantee about native solver failures; those are covered separately in §4.
- **Nothing else changed:** No solver default, graph, model, preset, preflight, witness-validation or native-lifecycle code changed. The 8-node limit and the Pearl admissions behaviour are as previously reviewed.

## 3. Regression tests

- **Unit tests:** `src/causal_decision_optimization.spec.ts` passes all 27 tests, including the 11 permanent C1 tests. They cover:
  - tiny countermodels, both regular and nonregular;
  - nonconstant marginal masses;
  - the zero-root case;
  - impossible-event masses;
  - contradictory premises (expected UNSAT) and vacuous entailment (expected ENTAILS);
  - both control phrasings;
  - the exact-zero spelling `0.000`.
- **Mutation check:** With only the old predicate restored (once in a throwaway copy and once by an in-memory transform), 9 of the 11 C1 tests fail. The 2 that still pass are the control phrasings (`!=` and `~(Pr − tiny = 0)`). They never reach the shortcut, so they pass under either predicate by design. The tests therefore catch the defect.
- **Browser tests:** The recorded Chromium run passes all 59 affected cases, including the 2 new C1 regressions at `tests/causal_decision.spec.ts:478`. Those regressions cover both modes and check the model exactly. Together with unchanged earlier cases, that makes 108 distinct browser cases.
- **Frozen bundle:** `package-underflow.json` and an independent recheck agree on the actual built bundle. In both regularity modes it:
  - returns DOES NOT ENTAIL with the correct tiny countermodel;
  - confirms that countermodel's exact predicate;
  - returns UNSAT for contradictory premises;
  - returns vacuous ENTAILS;
  - raises no page errors.
- **Package probe:** `package-fixed-probe.json` checks:
  - 42 admissions evaluations across widths 1280, 390 and 320;
  - Save/Load and a negative control;
  - 8-node acceptance, a new intervention, and 9-node rejection.
- **Production differential:** The recorded rerun covers 27 scenarios and 480,000 exact comparisons with 0 mismatches. It includes the literal 10^-351 and probability parameters set exactly to tiny epsilon values.

## 4. Out-of-memory flake (not C1, does not block)

Repeated runs of the optimizer spec file sometimes hang or return `'error'`:

| Version | Failed runs |
|---|---|
| After the repair | 4 of 45 |
| Before the repair (C1 tests omitted) | 13 of 52 |

- **Cause:** Every failure has the same cause. Z3's WebAssembly build aborts with "Cannot enlarge memory arrays to size 2838941696 bytes (OOM)" because its memory is capped at 2 GiB.
- **Where it happens:** In older tests that contain no tiny literals: full-parent cancellation, fraction normalization and the eight-node case.
- **No wrong answers:** No wrong verdict was ever seen. That fits the solver's rule that a failed or interrupted run is left unresolved and never reported as a theorem.
- **Follow-up:** This was already present before the repair and is a reliability problem in the native lifecycle. It should be logged as a separate follow-up. It does not block C1, and it does not show that native failures can never give a wrong answer.
- **Logs:** `claude-flaky-run-*.log` and `claude-prerepair-run-*.log` in the recheck folder.

## 5. Working-tree changes outside the frozen candidate

During the recheck, files outside the snapshot changed:

- `src/pr_sat.spec.ts` gained an unstaged test (modified at 00:54Z).
- Three committed `src/tmp_*.spec.ts` files were deleted.
- `package.json` test scripts were changed (outside the frozen manifest).

Because of this, a fresh full unit run now shows 31 files and 1349 tests, all passing. The recorded run showed 34 files and 1354 tests (one inherited skip and one todo). Test counts should be quoted with the specific recorded run they come from. Production `pr_sat.ts` and `parser.ts` are unchanged, and no snapshot file was touched. Before publishing, the publisher must account for these separate changes; this PASS does not cover them.

## Evidence files (recheck folder)

All in `reviews/constraint_implementation_2026-10-12T23-41-52Z/recheck_2026-10-13T00-33-52Z/`:

- `claude-recheck-report.md`
- `claude-checkpoints.md`
- `claude-flaky-run-*.log`
- `claude-prerepair-run-*.log`
- `codex-c1-response-report.md`

**Phase gate: PASS.**

## Claude  (verdict: AGREE, 27m 22s)
CHECKPOINT
elapsed: ~31 min (2026-10-13T00:42Z → ~01:13Z)
tentative_verdict: Phase gate: PASS
new_results: NEW: The source and package are frozen and their hashes match. The one-line repair is exact, and the C1 tests catch the bug: with the old line restored, 9 of the 11 fail. I also found a Z3-WASM out-of-memory flake. It already existed before the repair, it is not C1, and it never gave a wrong answer. Separately, someone changed the working tree outside the snapshot during this recheck.
current_obstruction: none for C1
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

**Phase gate: PASS.** C1 is fixed exactly, the required regression tests are in place and actually catch the bug, the source and package are intact, and the repair adds no new material defect.

**1. Source and package integrity.**
- **Source:** All 27 files listed in `source-snapshot.json` match on size and SHA-256, both in the working tree and in `source-snapshot/`, which holds exactly 27 files.
- **Release package:** The release directory named in `release-path.txt` holds the 8 manifest files plus `release-manifest.json`, and all 8 match their hashes. `dist/index.html` loads `dosat-45ZXtgOV.js`, whose SHA-256 is a8cdca18….

**2. The repair is exact and can't add a new error.**
- **Only true zeros take the shortcut now.** Line 382 now tests `literal_q(inner.right).isZero()`. `Q.parse` turns the literal's source text into an exact fraction of big integers. The new condition fires only when the old one would and the literal is exactly zero:
  - Every generated "not zero" guard (`pr_sat.ts:801`, `809`, `821`) uses a real zero, so it still takes the shortcut.
  - A tiny nonzero literal like 10^-351 now goes through the exact comparison.
- **It can't throw.** The parser's number pattern `/[0-9]+(\.[0-9]+)?/` is identical to the pattern `Q.parse` accepts. The parser either keeps that text or drops it only when `String(value)` gives back the same string. Generated literals are only 0 or 1. Also, if the shortcut doesn't fire, the fallback comparison reads the same literal anyway, so the repair adds no new failure path.

**3. The tests.**
- **Unit tests:** `causal_decision_optimization.spec.ts` passes 27 of 27, including the 11 new C1 tests.
- **Mutation check:** I put the old line back in a throwaway copy under /tmp. 9 of the 11 C1 tests then fail. The other 2 are the control phrasings (`!=` and `~(Pr−tiny=0)`), which never reach the shortcut, so they pass either way by design.
- **Browser tests:** The browser log shows both new C1 cases passing (`tests/causal_decision.spec.ts:478`, 59 passed in total). `package-underflow.json` shows correct results in both modes with no errors.

**4. Two side findings. Neither blocks C1, but both should be recorded.**
- **Out-of-memory flake (pre-existing).** I ran the spec file over and over:

  | Version | Failed runs |
  |---|---|
  | After the repair | 4 of 45 hung |
  | Before the repair (C1 tests left out) | 13 of 52 |

  The logs show the same cause every time. Z3's WebAssembly build aborts with "Cannot enlarge memory arrays to size 2838941696 bytes (OOM)", because its memory is capped at 2 GiB. This happens in older tests that contain no tiny literals (full-parent cancellation, fraction normalization, eight-node). After the abort, calls either return `'error'` or never finish. I never saw a wrong verdict. That fits the solver's rule that an interrupted or failed run is left unresolved, never reported as a theorem. It is a reliability problem in the solver's native lifecycle, not C1, so I recommend logging it as a follow-up rather than blocking on it. The logs are `claude-flaky-run-*.log` and `claude-prerepair-run-*.log`.
- **Working tree changed during the recheck.** Someone other than me changed files outside the snapshot during this recheck:
  - `src/pr_sat.spec.ts` gained an unstaged test (modified at 00:54Z).
  - Three committed `src/tmp_*.spec.ts` files were deleted.

  That is why a full unit run now shows 31 files and 1349 tests instead of the logged 34 files and 1354 tests; all of them pass. Production `pr_sat.ts` and `parser.ts` are unchanged, and no snapshot file was touched. The root agent should account for these changes before publishing.

Files are in the recheck folder:
- claude-recheck-report.md
- claude-checkpoints.md

VERDICT: AGREE

## Codex  (verdict: AGREE, 3m 19s)
CHECKPOINT
elapsed: 2 min 56 sec (2026-10-13 01:09:24–01:12:20 UTC)
tentative_verdict: Phase gate: PASS
new_results: NEW: Independently verified frozen hashes, passed all 27 optimizer tests, reproduced nine C1 failures with the old predicate restored in memory, and confirmed correct frozen-bundle browser results in both modes.
current_obstruction: none for C1
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

**Phase gate: PASS.** I endorse your scoped conclusion. No material C1 repair remains.

The production delta is exactly the required one-line correction. `literal_q(inner.right).isZero()` checks the exact BigInt numerator using the authoritative decimal source. Genuine zero guards retain their shortcut; nonzero underflow literals reach the existing exact comparison path. Accepted numeric syntax introduces no new parsing failure here.

My independent checks confirm:

- All **27 frozen entries** match both the snapshot and working tree. All **eight release files** match their manifest; the package loads `dosat-45ZXtgOV.js`.
- All **27 optimizer tests**, including the **11 C1 regressions**, pass.
- Restoring only the old predicate through an in-memory transform makes **nine C1 tests fail**. The two control-phrasing tests pass as expected.
- The actual frozen browser bundle correctly returns **DOES NOT ENTAIL**, verifies the tiny model’s exact predicate, returns **UNSAT** for contradictory premises, and returns vacuous **ENTAILS**, in both regularity modes, with no page errors.
- The recorded differential contains **480,000 comparisons across 27 scenarios, zero mismatches**, including exact epsilon-valued parameters.

I would narrow “can’t add a new error” to the accepted inputs and paths examined here. The pre-repair OOM evidence supports treating that issue as a separate reliability follow-up; it does not establish a universal guarantee about native failures.

Your working-tree qualification also stands. I additionally observed changed `package.json` test scripts outside the frozen manifest. This PASS covers the frozen C1 candidate and package; the publisher must account for those separate changes and tie test counts to their specific recorded runs.

Evidence: [codex-c1-response-report.md](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/constraint_implementation_2026-10-12T23-41-52Z/recheck_2026-10-13T00-33-52Z/codex-c1-response-report.md). No production or existing evidence was edited, and no publication occurred.

VERDICT: AGREE

