# Z3 5.4.1 upgrade: phase gate PASS

Date: November 12, 2026. Scope: the exact `z3-solver` pin moves from 5.3.3 to
5.4.1, along with the official generated `z3-built.js`/`z3-built.wasm`, the
regenerated Vite output, and the engine-readiness assertion in
`tests/causal_decision.spec.ts`. No solver parameters, semantics, limits, UI,
or other dependencies changed. The engine reports
`5.4.1.0 145c0c51570a357cc558ce898ce77573ba9d4fbf z3-5.4.1`.

Checks: build and configured lint pass. Unit tests: 1374 passed, 1 skipped,
1 todo. DoSAT Chromium: 69 passed. The prepared package passed the actual-engine
probe: causal SAT, exact Pr(Y)=7/18 in the returned model, nontrivial entailment,
and contradictory UNSAT, with no page errors (`built-probes.json`).

The scoped default consensus gate (Claude Opus 5.5/xhigh vs. GPT-6.1 Sol/xhigh)
reached consensus: **Phase gate: PASS, no blocking findings** (`consensus.md`).
Both participants agreed on three non-blocking limitations:
- UNSAT and ENTAILS verdicts rely on the new engine's nonlinear arithmetic being
  correct, and are backed only by the regression and probe examples.
- The cache-revalidation rule in `.htaccess` does not make the upload atomic.
  A page opened mid-upload may need a reload after the upload finishes.
- The npm tarballs differ in their `package.json` version field as expected.

Publication was authorized by Branden on 2026-11-12, who asked for all PrSAT
versions, local and online, to be updated. Family evidence:
`PrSAT/upgrades/z3-5.4.1-2026-11-12/` in the shared workspace.
