# Phase 3 final candidate verification

October 11, 2026. The candidate implements the agreed G1/G2 repairs, Boolean
intervention shorthand, and the requested famous examples. The required final
consensus recheck is pending; publication has not occurred.

## Current checks

| Check | Result |
|---|---|
| Full units | 1,040 passed, one inherited skip and one todo, 26 files; 9.33 seconds |
| Full Chromium | 72 passed, one worker on strict port 5174; 47.6 seconds |
| Solver units | 62 passed, including actual forced fallback, pending-fallback cancellation/deadline and reuse |
| Compiler / independent audit / UI units | 61 / 9 / 19 passed; included in full units |
| Boolean alias parser | 99 parser cases pass; included in full units |
| TypeScript, typed lint, build | Pass with the current locked tools and all four entry pages |
| Native semantic replay | Z3 5.1 matches all 607 expected and previously reported verdicts |
| Prepared website | All 21 file sizes and SHA256 hashes match its manifest |
| Packaged-browser probe | 30 cases pass at 320, 390 and 1280px, with no page errors or overflow |

The Chromium suite includes 23 decision-interface cases and 49 retained
classical, causal and graphical-rule cases. New cases cover the Simpson
reversal, its four exact rates, the empty-premise back-door identity, and real
task-scheduled Cancel/input-edit actions with subsequent reuse. Test-only
response instrumentation observes a low-level check still pending at both
actions. These are distinct from the retained boundary-microtask tests.
The task cases took approximately 3.9 and 3.4 seconds in the full run,
including startup and reuse; their 10-second threshold concerns these instances,
not a universal physical cancellation limit.

## Mathematical and runtime evidence

The polynomial reduction is unchanged. Its independent suite has 601 pinned
checks and six unpinned checks, including the previously repaired negated
implication/biconditional cases. Native replay evidence is
[phase3_final_native_replay.json](phase3_final_native_replay.json), against the
preserved input with SHA256
`084561cd9ae6d887e3ec13d7fab6eeb3b87f37d77f67a8237440e816f8148a87`.

[PHASE3_SECOND_REPAIR_RESOLUTION.md](PHASE3_SECOND_REPAIR_RESOLUTION.md) explains
the finite QF_NRA attempt and explicit NLSat fallback, settlement ordering,
operation/attempt ownership, late cap callbacks, interrupted-check rejection,
and deadline qualifications. An expired fast result cannot establish a verdict;
whole-run cancellation or expiry prevents fallback. A cleared cap cannot
interrupt either a later attempt or witness extraction.

[phase3_hybrid_solver_native_probe.json](phase3_hybrid_solver_native_probe.json)
is explicitly **WebAssembly Z3 in Node**, not the system-native executable.
It records a forced-fallback exact SAT witness in about 415ms, a pending NLSat
cancellation settling about 13.7ms after abort, and a requested five-second
whole deadline settling as UNKNOWN in about 5.036s. Each completed probe reused
the same wrapper successfully. These are input-specific measurements.

The supplementary unlimited default-hybrid query on that reused context was
stopped unresolved after the owned diagnostic process had run 08:23. Its final
engine trace was buffered and unavailable. No verdict or speed benefit is
claimed for that run. It is distinct from the earlier controlled fresh-context
29.147s plain / 28.947s QF_NRA / 69.849s explicit-NLSat comparison in
[phase3_default_z3_benchmark.json](phase3_default_z3_benchmark.json).
Neither comparison implies universal performance superiority.

Boolean aliases normalize to the same interventions and byte-identical
polynomial SAT/countermodel formulas as numeric assignments. Compound
interventions, malformed or undeclared variables, and repeated assignments
remain rejected. The new Simpson data are constructed, not empirical:
observed recovery 63% versus 77%, intervention recovery 75% versus 65%.
The back-door identity uses the stated observed graph and positive support.

## Package and tools

Prepared package:
`releases/DoSAT-1.0-2026-10-11T20-19-43-667Z-494bdb94/`.
See [phase3_final_release_manifest.json](phase3_final_release_manifest.json)
and [phase3_final_release_probe.json](phase3_final_release_probe.json).
The probe launches through the landing page and verifies the exact product
title/subtitle, actual browser Z3 5.1.0, all nine example outcomes and the four
Simpson rates at all three widths. The application is cross-origin isolated.
The owned preview on port 4173 was stopped after the probe.

Current project tools: Node 26.11.1, npm 12.2.0, TypeScript 7.0.2,
Vite 8.3.4, Vitest 5.0.3, Playwright 1.64.0, ESLint 10.12.0 and
typescript-eslint 8.71.1. Typed lint uses its separate compatible TypeScript
6.0.3 API; the main compiler remains 7.0.2. Browser wrapper z3-solver 5.2.0
ships engine 5.1.0; the optional system-native executable is also 5.1.0.
The prior recheck independently verified these unchanged locks and zero
vulnerabilities in both package audits. No lint rule or peer check was weakened.

The code-only Graphify graph is refreshed: 953 nodes, 2,308 edges and 63
communities. Original PrSAT deployment targets and port 5317 are untouched.
Old bundles, packages and review records remain preserved. Raw model journals
remain private and ignored; a read-only release inventory found no credential
patterns or raw journals in tracked history or proposed public text.

## Gate and scope

A fresh default-model debate must review this frozen candidate's G1/G2 repairs,
notation and example integration, then give explicit PASS before publication.
Previous mathematical approval, F1/F2 acceptance and toolchain verification
stand with their qualifications. The current model class remains a supplied
finite observed Boolean DAG with independent private disturbances. Required
undefined conclusion terms remain countermodels. Finite resources, cancellation,
errors and UNKNOWN prove nothing; no physical runtime bound or ID/IDC, latent,
cyclic, non-Boolean or cross-world extension is claimed.
