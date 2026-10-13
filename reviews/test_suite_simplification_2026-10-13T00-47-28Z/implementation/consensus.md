# Consensus debate — 2026-10-12 21:02

## Question
Brief implementation gate for the user-approved test-workflow cleanup only. Proposed position: Phase gate PASS, because existing meaningful coverage is preserved and only assertion-free exploratory probes leave normal execution. Verify or challenge it; report literal Phase gate PASS/FAIL and final VERDICT AGREE/DISAGREE. A material defect means FAIL.

Repo /Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus. Folder reviews/test_suite_simplification_2026-10-13T00-47-28Z/implementation. Design consensus ../consensus.md; user explicitly approved implementing it. Seven actual files frozen in source-snapshot.json/source-snapshot/. package.json adds dosat(59 cases), legacy(49) and all(108) commands; normal test:e2e/npm test use current DoSAT. All browser cases remain available. Three scratch files are archived with import paths adjusted, original bodies retained. The >=1e21 decimal-serialization assertions move from tmp_repro_claim to descriptive pr_sat.spec test without logging. Two exponent files had no assertions of their advertised behavior; don't promote their variable-exponent experiments to DoSAT guarantees. TESTING.md documents when to run each lane; no semantic, C1, cancellation, evaluator, save/load or UI regression removed. Runtime app source/build is unchanged, as is the ongoing independent C1 repair gate.

Verification: ../unit-cleanup.log =1349 passes, one inherited skip,one todo, 31 files. Difference from1354 is five assertion-free probe declarations only; meaningful large-number test count is retained. ../lint-cleanup.log and types-cleanup.log pass. ../dosat-list.log lists59 tests/2files and ../legacy-list.log49tests/3files, exact partition of108. Prior actual59 public-page runs and49 unchanged legacy runs stand; don't rerun browsers solely for command selection. Check script naming/default behavior, preservation of meaningful assertions and archive import paths, and snapshot integrity. Legacy lane remains required if changed shared code affects retired pages. No application edit or dependency change.

Only needed scoped static reads, max8; no test execution, no stress probing, no broad reopening. Each report <=700 words, synthesis <=300; finish a completed microreport within3 minutes if possible, not a monolithic audit. Default models/efforts; no delegation or recursive debate. Don't edit sources/snapshots or publish. Namespaced claude-/codex- notes/checkpoints here only, six required fields and actual timestamps. Reports also obey40k-token ceiling. If PASS, VERDICT AGREE; if repairs needed, VERDICT DISAGREE. Root agent commits only after explicit scoped consensus PASS.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 3m 02s (2 turns); Codex: 1m 05s (1 turns); total: 4m 08s

## Agreed answer
**Phase gate PASS.** The test-workflow cleanup has no material defects. Six scoped files were read; no tests were run and nothing was edited.

**What was checked and holds:**
- **Snapshot:** all seven SHA-256 hashes match both the live files and the `source-snapshot/` copies.
- **Archive:** the three archived scratch files are byte-identical to their HEAD originals except for the import paths. Every imported name still exists. `reference-tests/` sits outside the vitest, Playwright, tsconfig and lint targets.
- **Large-number test:** the new `pr_sat.spec` test keeps all three checks: the parse succeeds, the output contains `10000000000000000000000`, and it does not contain `1e+22`. The logging is gone, and `return` became `throw`, which is stricter.
- **Unit count:** 1354 − 6 + 1 = 1349. The five tests lost overall all come from the two exponent files and contain no assertions.
- **Browser lanes:** the DoSAT lane (2 files, 59 cases) and the legacy lane (3 files, 49 cases) split all five spec files with no overlap. `test:e2e:all` still runs all 108.
- **Scope:** no application source or dependency changed.

**How to word the gate record:**
- Meaningful coverage is preserved, and only probes with no assertions leave the routine **unit** run.
- The default **browser** run (`npm test`) now covers only the public DoSAT pages. That narrowing is intended and user-approved. The 49 legacy cases are still available through `test:e2e:legacy` and `test:e2e:all`.
- The legacy lane must be run whenever a change to shared parser, translation, solver or causal code affects the retired pages. That includes the ongoing C1 repair.

**Required when recording the gate:** `PROJECT.md:94` still points to plain `npm test`. Add one sentence saying that `npm test` covers the unit tests plus the public-page browsers, and pointing to TESTING.md for when the legacy lane is required.

**Minor, not blocking:** because `test:e2e` now calls a second npm script, extra flags (like `--grep`) passed to it don't reach Playwright, and file arguments are added to the DoSAT list instead of replacing it. Call `test:e2e:dosat` or `playwright test` directly instead.

## Claude  (verdict: DISAGREE, 2m 27s)
CHECKPOINT
elapsed: about 3 minutes (2026-10-13T00:58:15Z to about 01:01Z)
tentative_verdict: Phase gate FAIL. One material defect, and it is easy to fix.
new_results: NEW: The snapshot, archive, large-literal migration, count arithmetic and lane partition all check out. One defect: the cleanup changes the default `npm test` so that it no longer runs the 49 legacy browser cases. That contradicts the design consensus and the proposal's own premise.
current_obstruction: The record doesn't show that the user approved narrowing `npm test` beyond what the consensus said.
next_bounded_step: Either restore `test:e2e` to the full suite, or record explicit user approval and update the gate wording in PROJECT.md. Then re-gate.
token_cost: unavailable
END CHECKPOINT

**Phase gate FAIL**

I used six scoped static reads. I ran no tests.

**Verified (passes)**
1. **Snapshot integrity:** all 7 sha256 hashes in `source-snapshot.json` match both the live files and the `source-snapshot/` copies.
2. **Archive fidelity:** each archived `tmp_*` file is byte-identical to its HEAD original apart from the import lines (`./x` → `../../src/x`).
   - Every imported symbol still exists: `assert_parse_constraint`, `init_z3`, `pr_sat`, `letter_string`, `s_to_string` and `eliminate_state_variable_index`.
   - `reference-tests/` falls outside vitest's `src/**/*.spec.ts`, Playwright's `testDir: './tests'`, the tsconfig `include` list and the eslint targets, so it can't affect the build or lint.
3. **Large-literal migration:** the new test in `src/pr_sat.spec.ts` keeps all three checks: the parse succeeds, the output contains `10000000000000000000000`, and it does not contain `1e+22`.
   - The `console.log` is gone.
   - `return` became `throw`, which is strictly stronger.
4. **Count:** six declarations were removed (2 + 3 + 1) and one was added, a net change of −5. That matches 1354 → 1349. The five lost declarations are all from the two `tmp_exponent_*` files, and none of them asserts anything.
5. **Partition:** `tests/` contains exactly five spec files. DoSAT has 2 files and 59 cases; legacy has 3 files and 49 cases. The regex-style CLI filters don't overlap (`tests/causal.spec.ts` can't match `causal_decision` or `causal_literature`), so together the two lanes cover the whole suite.
6. **Scope:** the only unstaged changes are `TESTING.md`, `package.json`, `src/pr_sat.spec.ts` and the three deletions. No dependencies or app source changed.

**Material defect: the default `npm test` was narrowed without authority**
- `"test:e2e"` changed from `playwright test --project=chromium` (108 cases) to `npm run test:e2e:dosat` (59 cases). As a result, `npm test` no longer runs 49 meaningful legacy browser regressions: `simple`, `causal` and `do_calculus`.
- **This contradicts the agreed design synthesis** (`../consensus.md`, the final section that ends in AGREE):
  - "Partition browser runs **without changing coverage**"
  - "Smallest next step: document the two browser commands. **Leave `npm test`**, all tests and historical artifacts **unchanged** initially."
  - The only "separately authorized cleanup" it names is archiving the `tmp_exponent_*` files.
  - "npm test = unit + dosat" appears only in one participant's intermediate report (line 93). The final synthesis overrode it.
- **It falsifies the proposal's own premise.** The proposal says "only assertion-free exploratory probes leave normal execution". In fact, 49 legacy cases with real assertions also leave normal execution. They are still reachable, but only on request.
- **The project's main verification instruction now means less.** `PROJECT.md:94` still says "Run `npm run lint`, `npm run build`, and `npm test`."
  - Agents read PROJECT.md first, so following it now silently skips the legacy pages.
  - Those pages share `parser`, `pr_sat` and `z3_integration`, which is exactly the code the ongoing C1 decimal repair touches.
  - The rule for when to run the legacy lane lives only in `TESTING.md`, and nothing in PROJECT.md, AGENTS.md, CLAUDE.md or README links to that file.

**Repair options (either one resolves the gate)**
- **(A, preferred: matches the consensus as written)**
  1. Restore `"test:e2e": "playwright test --project=chromium"`.
  2. Keep `test:e2e:dosat`, `test:e2e:legacy` and `test:e2e:all` as extra commands. `:all` then duplicates `test:e2e`, which is harmless.
  3. Rewrite TESTING.md's sentence "npm test now runs units plus public-page browsers" to say that `npm test` runs units plus all browser lanes, and that the two lanes are for iteration.
- **(B)** If the user did explicitly approve narrowing `npm test`:
  1. Record that approval in this folder.
  2. Change `PROJECT.md:94` to point to TESTING.md, stating that `npm test` covers only the public pages and that `test:e2e:legacy` is required when shared parser/translation/solver/causal code changes.

Either way, no browser rerun is needed just because a command was selected.

**Non-material notes (no repair required)**
- Because `test:e2e` now calls a second npm script, `npm run test:e2e -- --grep X` would have its flags consumed by npm, and any file arguments would be added to the fixed DoSAT file list instead of replacing it. Option A removes this problem.
- The archived probes can't be run with a plain `npx vitest reference-tests/...`, because vitest's `include` setting would filter them out. The README doesn't claim they can, so this is acceptable.
- The archive README's statement that "No mathematical regression was removed" is accurate for the unit suite.

Under the stated rule that "a material defect means FAIL", the gate fails. Everything else is sound, and option A is a one-line `package.json` revert plus one sentence in TESTING.md.

Notes: `implementation/claude-checkpoints.md`.

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 1m 05s)
CHECKPOINT
elapsed: 43 seconds; 2026-10-13T01:00:43Z–2026-10-13T01:01:26Z
tentative_verdict: Phase gate PASS
new_results: NEW: Independently confirmed all seven snapshot hashes, archive fidelity and exports, migrated assertions, lane partition and documented defaults.
current_obstruction: none
next_bounded_step: done; micro-report saved in implementation/codex-checkpoints.md
token_cost: unavailable
END CHECKPOINT

**Phase gate PASS**

I agree with your preservation checks, but disagree with the authorization objection. The current user instruction explicitly identifies the approved implementation scope: “normal test:e2e/npm test use current DoSAT.” The earlier design’s conservative initial recommendation does not override that subsequent authorization. A separate approval record is unnecessary for this review.

The implementation matches that scope:

- All seven live files and snapshot copies match their recorded hashes and byte counts.
- Archive bodies are unchanged apart from valid import adjustments.
- The permanent large-number regression preserves all three checks without logging.
- The five assertion-free declarations account exactly for 1354 → 1349.
- The two browser lanes partition all five files: 59 public-page cases and 49 legacy cases. `test:e2e:all` retains all 108.
- `TESTING.md` expressly documents the public-page default and requires legacy checks when shared-code changes affect retired pages. Tracked runtime sources and dependencies are unchanged.

Your wording objection is valid: **meaningful coverage remains available, but default browser execution narrows intentionally.** “Only assertion-free probes leave normal execution” should refer specifically to routine **unit** execution.

Linking `TESTING.md` from `PROJECT.md` belongs in the root agent’s required gate-recording handoff. The older generic instruction to run `npm test` does not make the explicitly approved default a material implementation defect.

No tests were executed, and no sources or snapshots were edited. No material repair is required.

VERDICT: AGREE

## Claude  (verdict: AGREE, 35s)
CHECKPOINT
elapsed: about 6 minutes (2026-10-13T00:58:15Z to about 01:04Z)
tentative_verdict: Phase gate PASS, with the corrected rationale below. VERDICT AGREE.
new_results: NEW: I withdraw my authorization objection. Line 93 of the design consensus proposed exactly this commit, including "keeping npm test = unit + dosat", and said it needed the user's approval. The gate question names that same scope as user-approved, so the narrower default is authorized. The PROJECT.md pointer becomes a required item when the root records the gate. It is not a defect in the implementation.
current_obstruction: none
next_bounded_step: done. The root records the gate with the corrected rationale and adds a link to TESTING.md from PROJECT.md:94.
token_cost: unavailable
END CHECKPOINT

**Phase gate PASS**

**I concede the authorization point.**
- Line 93 of `../consensus.md` proposed this exact commit, under the heading "Smallest justified next step (it needs the user's approval…)":
  - (a) add `test:e2e:dosat` and `test:e2e:legacy`, "keeping `npm test` = unit + dosat";
  - (b) move the 1e21 assertion and quarantine the `tmp_` files.
- The implementation matches both parts exactly.
- The final synthesis said "leave `npm test` unchanged initially". That was a debate with no authority to edit files describing its default smallest step. It did not forbid a change the user approved separately.
- The gate question states the narrower default as part of the approved scope. So my objection that the change exceeded its authority was wrong, and the change is not a material defect.

**What we agree on**
- **Snapshot:** all seven hashes match.
- **Archive:** file bodies are byte-identical apart from the import paths, and every imported symbol still exists.
- **Archive placement:** the archive sits outside vitest's `include`, Playwright's `testDir`, the tsconfig `include` and the lint targets.
- **Large-number test:** all three assertions survived without logging, and switching `return` to `throw` makes the test stronger.
- **Count:** 1354 − 6 + 1 = 1349, and the five net losses are all assertion-free probes.
- **Browser lanes:** the 59 DoSAT cases and 49 legacy cases split all five spec files exactly. `:all` still runs all 108, and all application source and dependencies are unchanged.

**Rationale for the gate record**
I accept Codex's refinement:
- Meaningful coverage is preserved.
- Only assertion-free probes leave routine **unit** execution.
- Default **browser** execution is intentionally narrowed to the public pages. The 49 legacy cases are still available through `test:e2e:legacy` and `test:e2e:all`.
- The legacy lane is required whenever shared parser, translation, solver or causal code changes in a way that affects the retired pages. This includes the ongoing C1 repair.

**Required item when the root records the gate (not a repair to this implementation)**
- `PROJECT.md:94` still tells readers to run "`npm test`" as the verification gate. Nothing in PROJECT.md, AGENTS.md, CLAUDE.md or README links to `TESTING.md`.
- When the root records this gate, it should add one sentence there: `npm test` covers units plus the public-page browsers; see TESTING.md for when `test:e2e:legacy` is required.
- Codex already places this in the root's gate handoff, and I agree with that placement.

**Minor, non-blocking**
`test:e2e` now chains to a second npm script. As a result, `npm run test:e2e -- --grep X` has its flags consumed by npm, and file arguments are added to the DoSAT file list instead of replacing it. The workaround is to call `test:e2e:dosat` or `playwright test` directly.

No tests were run, and no sources or snapshots were edited. My notes are in `implementation/claude-checkpoints.md` (round 2).

VERDICT: AGREE

