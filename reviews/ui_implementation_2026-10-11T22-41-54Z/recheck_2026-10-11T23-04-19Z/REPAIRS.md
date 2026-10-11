# Scoped UI repair recheck

The completed first UI implementation audit reached consensus **Phase gate: FAIL** with two required repair groups. See ../consensus.md. Its verified conforming areas remain accepted; the mathematical Phase 3 PASS stays closed.

## F1 and F3: contained formula scrolling

Premise previews are now DIV blocks with width/max-width 100%, min-width 0 and overflow-x auto. Premise/Constraint N preview names follow physical row renumbering and task changes. The conclusion preview and submitted failed-conclusion formula have the same own-container style and named keyboard regions. All have tabindex=0/role=region. Broad action-panel scrolling no longer reveals hidden formula text; each formula's end is independently reachable. The original comparison and exact source are unchanged.

New real-Chromium tests at 390px and 320px use the back-door identity as a premise and an incorrect long back-door conclusion as a countermodel claim. They assert the own region has scrollWidth > clientWidth > 0, ArrowRight changes its scrollLeft, the last MathML leaf comes into view at the end, page width stays contained, the action panel does not scroll horizontally, and Run stays in the viewport width. The conclusion editor preview is covered too. The production package repeats these tests in probe.mjs and saves repaired-long-*.png.

## F2: validate representable loaded text before mutation

The load handler now converts CRLF and lone CR to LF in graph, premises and conclusion before parse_decision_input and before changing any field. The exact validated text is then applied. editor.setValue uses the same normalization before row creation, so row inputs, applied text and batch text agree. No parser, compiler, solver or saved format changed. The new premise phantom-pending bug and the directly related inherited graph/conclusion normalization cases are repaired together.

Tests reject embedded-CR fixtures in each field while preserving the complete previous problem, ready Run/Save/Copy and no pending batch. Valid CRLF and valid lone-CR line separators are normalized consistently; blank/comment/trailing physical rows and ordinary whole-problem roundtrips remain tested. Unit editor tests directly exercise mixed endings and the previous phantom-pending input. The package probe repeats all three bad loads and valid CRLF rows.

## Nonblocking polish applied

Readiness grammar is singular/plural correctly. Validation updates its live-region DOM only when the message or error link targets change; a MutationObserver regression checks unchanged readiness and unchanged errors. A hidden pending draft tells the user to Show Batch Input before Parse/Discard. Conclusion has a dedicated ⓘ help control; Enter no longer inserts an accidental second line. Examples uses a placeholder after edit/Load/Clear, so the same example can be selected again. Phone spacing between the last input and Run is tightened to approximately 120px at 390px, with a browser regression (<=125px tolerance) and unchanged visible definedness qualification.

Optional bulk paste directly into a row (batch remains available), prettier algebraic-root notation and inactive out-of-range time-field serialization remain outside these bounded repairs, as accepted nonblocking presentation followups. Arbitrary model evaluation remains a later capability.

## Verification

1,123 passing unit tests, one inherited skip and one todo; 81 passing Chromium tests on strict 5174, one worker; TypeScript, lint, build and diff whitespace PASS. The four scoped UI unit files have 101 passing tests. Production package probe has 37 passing checks, including nine examples at 320/390/1280px, real Source Sans Pro SemiBold, actual Z3 5.1.0, isolation, zero page errors, keyboard formula scrolling, and newline loads. New source hashes are in source-snapshot.json.

Fresh preserved package: releases/DoSAT-1.0-2026-10-11T23-04-37-259Z-2258cdcd, 22 files; release-manifest.json records exact assets. Served for headless review at http://127.0.0.1:4173/. No publication yet. Source is frozen for this recheck. Solver/reduction SHA256 still match the approved Phase 3 hashes. Code-only graph updated to 1,021 nodes, 2,483 edges and 61 communities. Nothing was deleted.
