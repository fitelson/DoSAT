# DoSAT 1.0 publication

October 11, 2026. **Published and verified.**

- Website: https://fitelson.org/DoSAT/
- Main application: https://fitelson.org/DoSAT/dist/decision.html
- Public repository: https://github.com/fitelson/DoSAT
- Default branch: `main`; local `do-calculus` tracks `origin/main`.
- Deployed implementation commit: `39b87fe96554e10750d1c8004407797dc62dc55a`.
- Title: **DoSAT 1.0**.
- Subtitle: **A Decision Procedure for Do Calculus.**

The repository was created after the scoped consensus PASS and final tests.
The implementation commit was pushed and its remote SHA confirmed. Current
assets and runtime files were uploaded before the entry pages; the landing
index was uploaded last. Only the new DoSAT directory was written. Original
PrSAT files and port 5317 were untouched. No file or artifact was deleted.

## Live verification

All **21 uploaded files** match the prepared release's SHA256 and byte size,
including `.htaccess`. All **20 publicly served files** also match over HTTPS.
Runtime headers provide COOP `same-origin` and COEP `require-corp`; WebAssembly
is served as `application/wasm`. Stable runtime assets revalidate. See
[remote verification](phase3_live_remote_verification.json) and
[HTTPS verification](phase3_live_http_verification.json).

Headless Chromium passes **30 live checks** at 320, 390 and 1280px through the
landing page: exact branding, actual Z3 **5.1.0**, all nine examples, all four
Simpson rates, no page errors and no horizontal overflow. The app is
cross-origin isolated. See [live probe](phase3_live_probe.json).

Two additional live task-scheduled actions during the six-node countermodel
search pass: Cancel and input edit settle correctly, enable Run, and allow a
new successful entailment check. Measured action-to-observed-settlement times
were about 2.78s and 2.74s on these instances, not universal bounds. See
[live controls](phase3_live_controls.json).

## Approved release and handoff

The [consensus recheck](phase3_final_recheck_consensus.md) gives explicit
**Phase gate: PASS**, with Opus 5.5/xhigh and GPT-6.1 Sol/xhigh. Final checks:
**1,041 passing units**, one inherited skip and one todo; **72 passing Chromium
tests**; **607/607 native semantic replay matches**; TypeScript, typed lint and
build pass. The added S2 regression and neutral help wording implement
nonblocking recommendations. Solver and polynomial reduction remain unchanged
from approval. See [final status](PHASE3_FINAL_STATUS.md).

Browser engine: Z3 5.1.0 from z3-solver 5.2.0. Project tools: Node 26.11.1,
npm 12.2.0, main TypeScript 7.0.2. Typed lint uses its supported private
TypeScript 6.0.3 API without weakening rules. Native audit Z3 is 5.1.0.

The model class is a supplied finite observed Boolean DAG with independent
private disturbances. Required undefined conclusion terms count as countermodels.
Cancel, error, timeout and UNKNOWN prove nothing. Physical settlement can exceed
a deadline. Context history can slow hard queries; controlled reuse probes,
the fresh-context benchmark and the untraced stopped run remain separate.
No general speed advantage or ID/IDC, latent, cyclic, non-Boolean or cross-world
extension is claimed.

Readable source, proofs/semantics, status and reviewed Markdown remain in Dropbox;
raw journals remain private. The parent PROJECT.md and LAPTOP_SETUP.md point
to the released version and reproducible tools. A fresh GitHub clone outside
Dropbox gives independent Git metadata. Sync and laptop state must be verified
there. Phase 4 has not started and requires the same scoped consensus gate.
