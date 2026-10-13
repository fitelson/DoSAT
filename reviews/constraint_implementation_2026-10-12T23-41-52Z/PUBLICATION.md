# Publication record

DoSAT's approved optimization, eight-variable limit, Pearl admissions case and
simplified test workflow are committed, pushed and live.

- Executable source commit: `f6e502596c8725daa6bef97511dac2ec3d18f14f` on public `fitelson/DoSAT` main.
  The remote branch was independently verified against local HEAD.
- Target: https://fitelson.org/DoSAT/; verified at 2026-10-13T01:47:04+00:00.
- Approved package: `releases/DoSAT-1.0-2026-10-13T00-30-37-562Z-c92dc641`.
  Entry bundle: `dosat-45ZXtgOV.js`, SHA-256
  `a8cdca18213bc0b9ba36288a810deaf94715e563bfde947934149c235fc663f2`.
- Default-model C1 repair recheck: **PASS**, in
  [repair consensus](recheck_2026-10-13T00-33-52Z/consensus.md).
  Separate user-approved test cleanup implementation: **PASS**, in
  [cleanup consensus](../test_suite_simplification_2026-10-13T00-47-28Z/implementation/consensus.md).
- All eight uploaded files match the approved manifest. Transport performed four
  swaps, preserving old files in the protected backup directory.
- All six public file hashes and byte counts match over HTTPS. The root returns
  200 with COOP/COEP isolation headers, WASM has the correct MIME type, all five
  retired routes redirect, and the backup directory returns 403.
- Fresh live Chromium checks pass at 1280, 390 and 320 pixels: the admissions
  preset ENTAILS, Save/Load preserves it, satisfiability returns an exact model,
  and all 42 admissions evaluations pass. The controlled female-advantage claim
  DOES NOT ENTAIL, with an exact zero difference in its countermodel.
- Eight-node SAT, a new intervention evaluation and ninth-node rejection pass
  at each width, adding three exact evaluations (45 total). No page errors or
  page overflow were observed. Actual Z3 version is 5.1.0 and cross-origin
  isolation is active. Desktop and narrow-phone captures were visually inspected.
- Live tiny-decimal checks pass in both regularity modes: exact countermodel,
  exact predicate validation, contradictory SAT -> UNSAT and vacuous ENTAILS.

Final local checks: 1349 unit passes (one inherited skip and one todo), 108
passing distinct Chromium cases across recorded runs, lint, TypeScript and build.
The independent 607-case semantic oracle and 480000 exact differential comparisons
pass. Routine browser commands cover 59 public cases; 49 retained legacy cases
remain required when changed shared code affects retired pages. See [TESTING.md](../../TESTING.md).

The admissions entailment body is 3619 bytes with 14 causal parameters and no
arithmetic auxiliaries, compared with 73407 bytes and 718 reals previously.
QF_NRA remains the default first stage with explicit NLSat fallback; there is
no premise-consistency preflight.

The review's intermittent native Z3/WASM out-of-memory failures occurred in
both pre-repair and repaired code, with no incorrect verdict observed in that
investigation. Both reviews passed with this separate reliability follow-up.
Graph size alone does not guarantee solver memory or runtime bounds.

Evidence in the repair folder: release-manifest.json, remote-verification.json,
live-http-verification.json, live-probe.json and live-underflow.json. Initial FAIL
records are preserved as historical evidence and are superseded by the approved
repair. Raw journals, private source material and unrelated artifacts remain local.
Other family branches and permanent port 5317 were untouched.
