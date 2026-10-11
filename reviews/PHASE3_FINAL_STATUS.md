# DoSAT 1.0: Phase 3 complete

A Decision Procedure for Do Calculus.

October 11, 2026. **Consensus phase gate: PASS.** The
[final scoped debate](phase3_final_recheck_consensus.md), using Claude Opus
5.5/xhigh and GPT-6.1 Sol/xhigh, approved G1/G2 repairs, Boolean intervention
shorthand, and the Simpson/back-door examples. Earlier mathematical, F1/F2 and
toolchain approvals stand with their qualifications. The approved 37-file
snapshot is [phase3_final_candidate_snapshot.json](phase3_final_candidate_snapshot.json).

## Settled behavior

The main interface decides causal satisfiability and semantic entailment for a
supplied observed Boolean DAG with independent private disturbances. Constraints
reduce to exact polynomial real arithmetic. Each stage has a finite QF_NRA
attempt, followed after settlement and release by explicit NLSat if needed.
An active unlimited run reaches that complete engine conditional on native
attempt settlement and sufficient resources. Cancel, timeout, error and UNKNOWN
never establish a theorem. Deadlines govern accepted verdicts, not physical
settlement or cleanup time.

Entailment checks consistency first and complements the guarded conclusion;
required undefined conclusion terms remain countermodels. Numeric literals and
witnesses remain exact. `do(X)`, `do(~X)` and mixed simultaneous assignments
are aliases for existing hard interventions. Compound interventions and repeated
or invalid variables remain rejected. Both famous presets are entailed:
Simpson's constructed reversal and the general positive-support back-door law.

## Final checks and nonblocking followups

- Full units: **1,041 pass**, one inherited skip and one todo, 26 files.
- Solver units: **63 pass**. The added S2 regression requires ERROR on witness
  failure after the local cap, no fallback, cleanup and successful reuse. The
  transform-only guard-deletion mutant fails it as intended. See
  [PHASE3_N2_REGRESSION.md](PHASE3_N2_REGRESSION.md).
- Full Chromium: **72 pass**, one worker, strict port 5174. The decision suite
  includes actual task-scheduled cancellation/input edits while a low-level
  check is pending, followed by reuse.
- Native Z3 5.1 replay: **607/607 match**. The independent semantic oracle and
  reduction proof remain unchanged; see [phase3_final_native_replay.json](phase3_final_native_replay.json).
- TypeScript 7.0.2, typed lint and production build pass.
- Refreshed postreview website package: **21/21 hashes match** and **30/30
  browser checks pass** across 320, 390 and 1280px. Actual engine 5.1.0, exact
  branding, all nine presets and all four Simpson rates are verified. See
  [phase3_postreview_release_manifest.json](phase3_postreview_release_manifest.json)
  and [phase3_postreview_release_probe.json](phase3_postreview_release_probe.json).

After consensus, only the extra test, neutral help wording and status records
changed. The runtime solver SHA256 remains
`9e2f6760a6e360d6b59da2d08c848d13d821f22efaa6dd7788de01f8c918d396`;
the polynomial compiler is unchanged. No new mathematical or lifecycle feature
was added after approval. The UI no longer describes the initial strategy as
universally faster. Both preview servers were stopped. Old files/packages and
private raw journals remain preserved; only reviewed, safe artifacts are public.

## Performance qualification

Keep three observations separate. The original fresh-context benchmark was
29.147s plain, 28.947s QF_NRA and 69.849s explicit NLSat. Controlled review
probes returned about 29.2s in three fresh contexts; a second use of one wrapper
without intervening cancellation reached its fast cap, then remained unresolved
in NLSat at 150s. Other controlled reused-context probes remained unresolved
at 240–296s. A new context in the same process recovered about 29.2s.
These demonstrate an instance-specific dependence on context history.

The older supplementary process stopped at 08:23 had no captured final engine
trace, so it remains unattributed. The controlled results are consistent with
that run but cannot explain it retrospectively. None establishes general
performance superiority. Context lifetime versus memory reclamation is future
work, rather than an unreviewed release change. Saving and reloading a problem
can obtain a fresh browser context; its effect depends on the problem.

## Publication and handoff

Public repository: https://github.com/fitelson/DoSAT.
Website target: https://fitelson.org/DoSAT/.
The repository was created after PASS; commit/push/upload and live verification
are complete. See [PHASE3_PUBLICATION.md](PHASE3_PUBLICATION.md): all 21 remote
checksums, 20 HTTPS files and 32 live browser checks pass, with actual Z3 5.1.0.
The release uses the new DoSAT directory only. Inherited PrSAT
deploy commands remain disabled, and port 5317 and original PrSAT checkouts
remain untouched.

Source, status, proof/semantics and reviewed Markdown are in the Dropbox project.
Read PROJECT.md, TOOLS.md and the parent LAPTOP_SETUP.md. Current tools are
Node 26.11.1, npm 12.2.0, main TypeScript 7.0.2, Vite 8.3.4, Vitest 5.0.3,
Playwright 1.64.0 and browser Z3 5.1.0 from z3-solver 5.2.0. Typed lint uses a
separate supported TypeScript 6.0.3 API. Dropbox sync and laptop state must be
verified on the laptop.

No Phase 4 work has begun. Later phases require the same scoped consensus gate.
The accepted model class excludes ID/IDC, latent, cyclic, non-Boolean and
cross-world extensions. Finite grids complement the proof; WebAssembly and
native Z3 are two runtimes of one solver, not independent algorithms.
