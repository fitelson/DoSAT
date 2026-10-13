# Consensus debate — 2026-10-12 22:04

## Question
Review the completed PrSAT-style batch evaluator change. Require literal Phase gate: PASS or FAIL and final VERDICT: AGREE/DISAGREE. Material defects keep publication blocked. Scope only this phase's changed editor/UI/CSS and integration, not old mathematical or native Z3 memory issues.

Repo /Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus; base2a36af3. Actual frozen eight-file source snapshot, source-snapshot.json, SEMANTICS.md, VERIFICATION.md and approved candidate release-manifest.json are in reviews/batch_model_evaluation_2026-10-13T01-57-53Z. Changed runtime files: causal_decision_editor.ts,causal_evaluation_ui.ts,causal_decision_style.css. Tests:causal_evaluation_ui.spec.ts,tests/causal_decision.spec.ts. Default editor premise mode remains, evaluation mode namespaces rows/test IDs and renders real/constraint previews. Batch Parse/Discard/Clear,64active rows/50kchars, serial fixed-model calls, one abort signal/busy interval, all-or-nothing acceptance. Per-row real/boolean/undefined/error, subsequent rows after returned error, no native solver/backend changes. Existing model token/callback remains authoritative. User explicitly wants PrSAT batch mode and multiple constraints verified in a returned model; earlier commit/push/upload authorization persists only for DoSAT.

Checks completed: full1357unitpasses,1skip1todo,31files; focused146passes; all62publicChromiumcasespass including3newwidths/mixedbatch/copy-preservedwitness; lint and build/TypeScriptpass. Eight new unit cases address true/false/exact/undefined/error, drafts, second-row cancellation/draft/model-replacement busy settlement and oversized batches. 607-case semantic oracle reruns with fullunit. Reference UI/parser/compiler/solver/evaluator service unchanged, no legacy rerun warranted. Prepared executable dosat-CD1FS2oP.js/CSSdosat-CL0VEVXX.css; actual package/live probes handled by root.

Use up to10 targeted static reads and only a bounded focused probe if a concrete concern requires it. Do not rerun fullunits, browsermatrix or oldsolverstress. Aim for a completed <=800wordmicroreport within4minutes, synthesis<=350words. Independently inspect lifecycle, constraints/definedness/results mapping, budget/syntax, user-input rendering and baseline editor compatibility. Frozen sources and journals are not editable. Write only namespaced claude-/codex- reports/checkpoints in the review folder. No commits/push/uploads, delegation or recursive debates. Default models/efforts, streamed runner journals; reports max40000outputtokens. Create/reset your progress file at start and append six-field checkpoints using actual clock readings at least every15minutes; obey runner CHECKPOINT schema for completed reports. Root will resolve material findings and obtain repair recheck before publishing.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 2m 29s (1 turns); Codex: 1m 41s (1 turns); total: 4m 10s

## Agreed answer
## Phase gate: PASS

The batch evaluator change is ready to publish. Two independent code reviews found no material defects. Both reviews read the code without running anything. The test counts below come from VERIFICATION.md and were not rerun. No concrete concern came up, so no extra probe was run. Publication still waits on your package and live-site checks, which this review does not cover.

**Integrity:** All eight frozen files match `source-snapshot.json`, and so do the working copies. Compared with base `2a36af3`, only these files changed:
- `causal_decision_editor.ts`
- `causal_evaluation_ui.ts`
- `causal_decision_style.css`
- the two test files

The parser, compiler, evaluator service, solver and `causal_decision_ui.ts` are unchanged.

**Running a batch (`causal_evaluation_ui.ts:135-189`)**
- When you click Evaluate, the code takes one fixed copy of the checks, the evaluator callback, a version number and a single abort signal. It then evaluates the rows one at a time against the same returned model.
- It checks whether the run is still current before and after each callback, so no new row starts after a cancel.
- These actions all stop the run and throw away its results:
  - editing a row or the batch draft;
  - Parse, Discard or Clear;
  - replacing the model with `show()`;
  - editing the original problem with `clear()`.
- Cancel shows "cancelled; no value accepted".
- The panel stays busy until the callback that is currently running finishes. While it is busy, both Evaluate and Decide are disabled, so a new run can never overlap an old one.
- Results are drawn only after every row has finished, so you never see a partial batch.

**How each row's result is shown**
- A thrown or returned error, or an undefined value, appears in that row's own section, and the rows after it still run.
- An undefined real expression shows as "undefined (zero denominator)" and is never turned into False.
- A True/False result is the existing guarded truth value, and any undefined probability terms are listed with it.
- Section IDs and headings follow the row numbers ("Expression N").
- With only one check, the output keeps the original layout and test IDs.

**Limits and syntax errors**
- Parse refuses a batch over 64 active lines or 50,000 characters, and the checks already applied stay as they were.
- Validation also limits the graph plus the applied rows to 50,000 characters, and the parser's per-expression limits still apply.
- Syntax errors are labelled with their row, and Evaluate is blocked while a draft is pending.

**Displaying user text:** User text is inserted as plain text or through the existing MathML renderer, never as HTML, so it cannot inject markup.

**Default (premise) mode:** It keeps its test IDs, its raw value handling, the "Preview unavailable." fallback and its labels.

**Minor issues that do not block publication**
1. Two unused CSS rules remain: `.model-evaluation-controls` and `.model-evaluation-input`.
2. The two size checks measure different things. Parse counts the raw batch, including comments. Validation counts the graph plus the applied rows. So a batch can parse and then still be blocked, with a clear message. This errs on the safe side.
3. Editing the draft stops a run in progress even though the applied checks haven't changed. SEMANTICS.md documents this.
4. The 64 limit applies only to accepted active checks. It does not cap rows the user adds by hand, or the preview work for them. Validation rejects the excess checks.

## Claude  (verdict: AGREE, 2m 29s)
CHECKPOINT
elapsed: ~5 min (02:00:19 to 02:02:23 UTC)
tentative_verdict: Phase gate: PASS; VERDICT: AGREE
new_results: NEW: the three frozen runtime files have the same SHA-256 hashes as the working tree. I checked lifecycle and abort/busy handling, definedness-to-result mapping, budgets and syntax handling, user-input rendering and premise-mode compatibility by reading the code. I found no material defects and four non-material notes.
current_obstruction: none
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

## Phase gate: PASS

I found no material defects. I read the code but did not run any tests; the focused probe wasn't needed because no concrete concern came up. My progress file is `claude-checkpoints-batch.md`.

**Integrity.** The SHA-256 hashes of `causal_decision_editor.ts`, `causal_evaluation_ui.ts` and `causal_decision_style.css` in the working tree match `source-snapshot.json`. Against base `2a36af3`, the only changes are in these files plus the two spec files. The parser, compiler, evaluator service and `causal_decision_ui.ts` are unchanged.

**Lifecycle (`causal_evaluation_ui.ts:135-189`)**
- **One run, one model.** The Evaluate handler captures the evaluator, a version number, a copy of the check list and one `AbortController`. Rows run one at a time with `await`, and `current()` is checked before and after each callback, so a new row never starts after an abort.
- **Edits during a run.** Row edits, draft edits, Parse, Discard, Clear, `show()` (model replacement) and `clear()` (original-problem edit, via `causal_decision_ui.ts:133`) all go through `invalidate`. That bumps the version, aborts the run and empties the output. The pending callback then returns without results, and `finally` restores the readiness message.
- **Cancel.** Cancel aborts without bumping the version. The loop sees `aborted` and shows "cancelled; no value accepted", even if the callback threw or returned an error.
- **Busy state.** Busy stays on until the current callback settles. Evaluate is disabled while busy, and Decide is disabled through `evaluationPanel.busy()` (`causal_decision_ui.ts:127`). The service's own `this.busy` guard therefore can't be hit, because calls are serial.
- **All or nothing.** Results are collected in a local array and drawn only after every row finishes, so no partial batch is shown.

**Definedness and result mapping**
- Each row keeps its own outcome: an error (thrown or returned) or an undefined value appears in that row's section, and later rows still run.
- An undefined real expression shows "undefined (zero denominator)". It is never turned into False.
- A Boolean result shows the service's guarded truth value, with its probability-term table listing any undefined terms.
- Section IDs and headings use the editor row position, so they match the row labels "Expression N".
- With a single active check, the output keeps the original layout and test IDs (`model-evaluate-probabilities`).
- The new browser test confirms all eight expected values and that the witness HTML is unchanged.

**Budgets and syntax**
- Parse refuses to apply a batch with more than 64 active lines or more than 50,000 raw characters, and the applied checks stay unchanged.
- Validation also limits the graph plus the applied rows to 50,000 characters, so manual row edits can't get past the limits.
- The per-expression limits in `parse_causal_evaluation` still apply.
- Syntax errors are stored by row index. No parser message starts with "Premise N:" or "Constraint N:", so each error is correctly labelled "Expression N: …".
- `valid` requires that no draft is pending, and Evaluate double-checks `editor.pending()`.

**Rendering user input.** `el()` adds strings as text nodes. Errors use `textContent`, and the preview's `aria-label` is set as an attribute, so there is no HTML-injection path.

**Premise mode is unchanged.** It keeps its test IDs (`decision-premises`, `decision-parse`, `decision-premise-N`), raw `setValue(batch.value)`, the "Preview unavailable." fallback and its labels. The new `lines` computation is unused in premise mode.

**Non-material notes (not blocking)**
1. CSS that is no longer used remains: `.model-evaluation-controls` and `.model-evaluation-input`. This is cleanup only.
2. The two limit checks measure different things. Parse counts the raw batch, including comments but not the graph. Validation counts the graph plus the applied rows. A parsed batch can therefore still be blocked, with a clear message. This is conservative and never allows an over-budget evaluation.
3. Editing the draft aborts a run even though the applied checks haven't changed. `SEMANTICS.md` documents this.
4. Each keystroke re-parses up to 64 rows about three times. That cost is bounded by the budgets.

**Synthesis:** The batch evaluator meets `SEMANTICS.md` for lifecycle, definedness, budgets, rendering and compatibility. Publication of the DoSAT bundle `dosat-CD1FS2oP.js` with `dosat-CL0VEVXX.css` can go ahead once the root's package and live checks pass.

VERDICT: AGREE

## Codex  (verdict: AGREE, 1m 41s)
CHECKPOINT
elapsed: 79 seconds; 02:02:50–02:04:08 UTC
tentative_verdict: Phase gate: PASS; VERDICT: AGREE
new_results: NEW: all eight frozen files and working copies match source-snapshot.json; independent inspection found no material phase defects
current_obstruction: none
next_bounded_step: done; root handles separate package/live verification
token_cost: unavailable
END CHECKPOINT

Phase gate: PASS

I agree with Claude’s implementation verdict. The frozen changes satisfy the phase semantics:

- Applied sources and the evaluator callback are captured once. Serial calls share one abort signal; cancellation and invalidation suppress the entire batch and prevent subsequent calls.
- Busy ownership lasts until the pending callback settles. The main decision action remains blocked during that interval.
- Real undefinedness, guarded Boolean truth, and row errors retain distinct presentations. Later checks continue after individual errors, and results preserve editor row positions.
- Pending drafts block evaluation, oversized checks fail validation, syntax errors identify their rows, and default premise-mode behavior is preserved.
- User input is rendered through text nodes and the existing MathML renderer.

One correction to Claude’s performance note: 64 limits active checks accepted for evaluation; it does not strictly cap manually created rows or preview work. Validation rejects excess active checks. This is nonblocking.

I inspected the added lifecycle and browser assertions without rerunning tests. The reported passing counts remain supplied verification evidence; no concrete concern warranted a focused probe. Implementation PASS does not establish package or live-site verification, which remain separate root obligations.

The durable report is saved as `codex-review-batch.md` in the review folder.

VERDICT: AGREE



