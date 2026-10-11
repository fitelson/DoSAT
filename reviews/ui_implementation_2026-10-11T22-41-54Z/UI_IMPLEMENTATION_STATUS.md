# DoSAT UI alignment implementation

October 11, 2026. Implementation complete; UI consensus gate pending.

Baseline: public commit `9ad6e1de01188135b8507a45ab43c4c56fa0c7fd`.
The preceding UI-only debate found the interface NOT ALIGNED and agreed the first pass in ../ui_prsat_alignment_2026-10-11T21-49-47Z/UI_AGREED_DESIGN.md. The user explicitly requested its implementation. This work is a UI phase; Phase 3 mathematical approval remains closed.

Implemented dark PrSAT header/web fonts, bordered editor and action panels, teal primary button, individual premise rows with safe causal MathML and synchronous split/merge/navigation, compact graph, task radios with hidden retained SAT conclusion, batch Parse/Discard with pending-state gating, whole-problem v1 JSON Save/Load/Copy, Clear premises preserving other fields, linked physical-row/field validation and ARIA. Results show exact visible observational/intervention row probabilities with ⊤/⊥, rendered input terms, submitted failed conclusion, visible user real variables, and expandable mechanisms. Empty-premise validity remains supported. Deadline and structural-zero qualifications remain visible. Extended help is expandable. New model evaluation is outside this pass.

Verification: 1,106 passing unit tests, one inherited skip and one todo; 78 passing Chromium tests on strict port 5174 with one worker; TypeScript 7.0.2, typed lint, and build pass. An initial concurrent unit/browser run missed an inherited wall-clock cancellation test's 20 ms tolerance by about 31 ms; the unchanged full unit suite passed when rerun separately. No tolerance or old solver test was weakened.

Prepared package: releases/DoSAT-1.0-2026-10-11T22-44-34-358Z-89eddbcf. It contains 22 current files. The 31-check headless package probe passes: nine examples at 320/390/1280px, actual Z3 5.1.0, isolation, fonts, overflow, and new batch/error/clear/task flows. See package-probe.json and final-*.png (private diagnostic journals are excluded). Default action Y is about 761px desktop and 933px at 390px; both meet the agreed 800/950 targets. At 320px it is about 1062px, with no horizontal overflow; no first-viewport claim is made at that width.

Solver SHA256 unchanged: 9e2f6760a6e360d6b59da2d08c848d13d821f22efaa6dd7788de01f8c918d396.
Reduction SHA256 unchanged: 3060d949f5783101e745f9d16adf3c486e0f845a45a6f213a5ee330130bd7349.

Code-only Graphify refreshed: 1,013 nodes, 2,475 edges, 64 communities. Existing releases, stale bundles, and diagnostic artifacts are preserved. Only current referenced assets will be published after a scoped UI PASS.

Additional layout check: conclusion-input bottom to Run is about 104px desktop and 151px at 390px. The total action target passes, but phone spacing can be tightened toward the agreed roughly 120px gap in the repair pass. No source changed during review.
