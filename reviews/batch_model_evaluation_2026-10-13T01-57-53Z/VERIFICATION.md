# Batch evaluator verification

Candidate base: 2a36af38f6634ec43e522c8ef71874cf8f62f296.
- Focused evaluator/editor/main-UI checks: 146 pass.
- Full final unit suite: 1357 pass, one inherited skip and one todo; 31 files.
- All 62 public-page Chromium cases pass. Three new cases check mixed batch
  values, true/false constraints, real undefinedness, guarded false with undefined
  terms, unknown real variables, later valid results, draft/Discard/row syntax,
  Clear/Enter, unchanged witness/export and layout at 320/390/1280 pixels.
- New deferred-callback units verify whole-batch suppression and retained busy
  ownership when cancellation, draft editing or model replacement interrupts row2.
- Oversized batches cannot replace applied checks. Existing single-expression,
  original-problem editing, cancellation/reuse and exact-value regressions pass.
- Lint and TypeScript/production build pass. The runtime package contains eight
  files and loads dosat-CD1FS2oP.js plus dosat-CL0VEVXX.css.
- Retired-page browsers need no rerun: only the DoSAT row editor/UI/CSS changed;
  parser/compiler/solver/evaluator service and reference-page code are untouched.

Logs and candidate hashes remain in this folder. The completed default-model
implementation consensus is **PASS**, in consensus.md. Actual prepared-package
verification passes 99 batch checks across three widths; see PACKAGE_VERIFICATION.md
and package-probe.json. Publication/live evidence is recorded in PUBLICATION.md.
