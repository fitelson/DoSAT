# PrSAT do-calculus extension

Created October 11, 2026. Branden's objective is to investigate extending the main
PrSAT 3.0 application to Pearl-style do-calculus and causal interventions.
This initial step creates the separate workspace; implementation and the precise
causal model class remain to be decided.

## Baseline

Copied the current working tree of `../../PrSAT 3.0/PrSAT-main`, including
uncommitted source, tests, configuration, and bundled assets. FORK_PROVENANCE.json
records the source commit, local status, and copied-file SHA-256 values.
The source directory was left unchanged. This fork has independent Git metadata
and no publication remote. Dependencies, generated graphs, and scratch/output
folders were not copied.

Initial setup changes are limited to package identity, documentation, a disabled
production deploy command, and explicit loopback/strict development ports.
Application source and tests retain the source checkout's contents.

## First design session

Decide what causal model information users supply, how interventions are
represented, and what the application should decide or compute. Distinguish an
intervention-aware satisfiability engine from a symbolic do-calculus derivation
or identification engine. Establish scope before changing parser or solver.
There is no claim that the current probability-table representation already
supports causal inference.

Inherited entry points, located through the source Graphify graph:

- `src/parser.ts`: input parsing.
- `src/types.ts`: shared representations.
- `src/pr_sat.ts`: probability constraints and SMT translation.
- `src/z3_integration.ts`: Z3 integration and model evaluation.
- `src/text_to_display.ts`: user interface.

## Local use

```sh
npm ci
npm run build
npm run test:unit
npm run dev
```

Development binds to loopback at strict port 5173; preview uses strict 4173.
Port 5317 belongs to the existing full-3.1 background service. Run only one family
app on a shared development/test port at a time. `npm run deploy` deliberately
fails because this research fork has no deployment target.

## Laptop handoff

This folder lives inside the shared Dropbox PrSAT hub and has its own `.git`
directory, with no absolute-path Git worktree pointer. Read this file and
`../LAPTOP_SETUP.md` after sync. Install laptop dependencies with `npm ci`.
The parent PrSAT.code-workspace includes this folder through a relative path.
