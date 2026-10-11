# Phase 1 candidate verification — October 11, 2026

- `npm run lint`: passed (exit0).
- `npm run build`: passed (exit0); both classical index.html and causal.html built.
- `npm run test:unit`: 716 passed,1 skipped,1 todo;18 passing files.
- `npm run test:e2e`:28 passed, Chromium headless on strict5174.
- Python phase-review helper imports the installed durable runner successfully;
  `python3 -m py_compile scripts/claude_phase_review.py`: passed.
- Local code-only Graphify graph regenerated; no semantic/API extraction used.
- Existing source PrSAT3.0 checkout and its tests were not edited during this phase.
- All original tracked baseline distribution assets were retained alongside new
  generated assets; Vite now uses emptyOutDir:false to preserve them.

Independent checks include finite private-disturbance enumeration for generated
CPT distributions;23 real-Z3 semantic regressions;12 mocked UI lifecycle/file-load
regressions;9 causal browser tests plus19 retained classical browser tests.

Before final candidate validation, verification found and fixed exact exponent
rounding, cancellation during the last witness-evaluation await, slow Z3 reload
search gating, stale async file responses, and omitted free-real-variable witness
values. Regression tests exercise these cases.

Inherited Vite notices for non-module Z3/service-worker scripts persist; they do
not prevent either page building or browser tests passing. The one unit skip and
one todo are inherited from the classical baseline. Deployment remains disabled.

Consensus debate review with the skill defaults is the required phase gate; see reviews/ for report and resolution.
This candidate has not yet passed that external review.
