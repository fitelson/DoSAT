# PrSATdo: causal probability satisfiability

Updated October 11, 2026. Phase 1 implements the first milestone discussed with
Branden: observational and hard-interventional probability constraints on a
user-specified acyclic graph of observed Boolean variables, with independent
private disturbances. **Phase 1 complete. Consensus phase gate: PASS (Opus 5.5 / xhigh; GPT-6.1 Sol / xhigh).**

## Use

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/causal.html`. The classical baseline remains at
`/index.html`; each interface links to the other. Three built-in examples cover
confounding, mediation, and intervention into an observationally absent parent
configuration. Problems can be saved/loaded as JSON; solver input can be saved
as SMT-LIB. Model display includes exact input probabilities, mechanism tables,
free real variables, and observational/requested intervention distributions.

Graph entries are edges or isolated variables, separated by newlines/semicolons:

```text
Z -> X; Z -> Y
```

Example constraint lines:

```text
Pr(Z) = 1/2
Pr(X | Z) = 3/4
Pr(X | ~Z) = 1/4
Pr(Y <-> Z) = 1
Pr(Y | X) = 3/4
Pr(Y | do(X=1)) = 1/2
```

`Pr(Y | do(X=1), Z)` observes Z in the intervention regime.
`Pr(Y | do(X=1, Z=0))` simultaneously sets X and Z. Assignments must be 0/1 to
declared variables. Ordinary `Pr(Y | X)` retains observational conditioning.
Constraints retain classical PrSAT arithmetic, exact numeric literals, and
logical combinations. One constraint per line; `#` begins a comment.

## Scope and representation

See [CAUSAL_SEMANTICS.md](CAUSAL_SEMANTICS.md) for the semantic definition,
normalization argument, and soundness/completeness representation proof.
The graph's edges are permitted causal influences; no faithfulness condition is
imposed. Every parent configuration has a CPT parameter, including configurations
with zero observational support. Every regime retains the same nonintervened
CPTs. Conditional probabilities require nonzero conditioning mass in that regime.
Undefined terms use the inherited PrSAT local-definedness semantics.

The positivity option constrains every CPT entry strictly between zero and one,
so the observational distribution is positive. Interventions still introduce
structural zeros. All witness numbers use raw exact Z3 numerals, including
rational numerators beyond JavaScript's safe integer range.

Limits: six graph variables, 64 constraint lines, 64 probability occurrences,
50,000 input characters, 4,096 characters/512 tokens per constraint line,
64 nested parentheses, and bounded AST/expanded solver size. A search time limit
can be set from 0.1 to 120 seconds. UNKNOWN or cancellation proves nothing.
A witness is one compatible model and need not be uniquely determined.

Phase 1 does not include hidden shared causes, cyclic/non-Boolean models,
cross-world counterfactuals, stochastic/propositional interventions, symbolic
do-calculus rule derivations, or ID/IDC identification. Those require subsequent
phase design and the same consensus review gate.

## Implementation map

- `src/causal_syntax.ts`: graph and intervention-aware probability input.
- `src/causal.ts`: shared CPT parameters and truncated-factorization compilation.
- `src/causal_ui.ts`: graph/constraint editing, lifecycle, model display and files.
- `src/causal_format.ts`: exact numeral display.
- `src/z3_integration.ts`: inherited solve wrapper plus exact expression evaluator.
- `causal.html`: causal entry point; Vite builds both causal and classical pages.
- `src/causal*.spec.ts`, `tests/causal.spec.ts`: semantic, solver and UI regressions.
- `graphify-out/`: regenerated code-only local knowledge graph.

## Verification and review

Run `npm run lint`, `npm run build`, and `npm test`. Browser tests use strict port
5174 and headless Chromium. Development/preview use strict loopback 5173/4173.
Port 5317 remains reserved for the original full-3.1 background service.

Current implementation tests cover confounding, backdoor adjustment, Simpson
reversal, mediation, interventions on ancestors, simultaneous and total
interventions, graph independences/colliders, impossible conditioning,
zero-support mechanisms, regularity, exact decimals/large rational witnesses,
input/expansion limits, saved files, and stale input/cancellation handling.
The original classical regression suite is retained. Final approval and counts are recorded in the phase checkpoint below.

Required workflow for every phase: implement, verify, run the consensus debate
skill with defaults (Opus 5.5 / xhigh and GPT-6.1 Sol / xhigh), resolve material
findings, rerun affected checks, obtain consensus recheck, then record an explicit
phase PASS before proceeding. Debates review the current phase changes and their
integration obligations; they do not audit unrelated untouched old code. See AGENTS.md. Reports/progress live in reviews/;
raw journals remain private. The earlier direct-Claude helper and diagnostics
are retained as superseded artifacts and do not fulfill this project's gate.

## Phase 1 repair checkpoint

The initial scoped consensus (`reviews/phase1_scoped_consensus.md`) reached
agreement on FAIL: F1 query-token juxtaposition/aliasing and F2 noninteger timeout
milliseconds. The mathematical representation was approved. Both repairs are now
implemented, with parser/compiler defenses and acceptance regressions. Minor
items M1/M2 received stronger permanent tests; M3 now explicitly distinguishes
solver search time from cancellable exact witness preparation. Unrelated old-code
observations remain outside this gate.

Repaired candidate checks: lint and build pass;747 active unit tests pass with
1 inherited skip and1 todo across18 files;32 headless Chromium tests pass.
See `reviews/PHASE1_REPAIRED_VERIFICATION.md`. The consensus recheck completed with explicit **Phase gate: PASS**:
[review transcript](reviews/phase1_recheck_consensus.md). Both required fixes were
independently verified. The recommended same-line query-alias regression was then
added without changing runtime implementation, and was verified to distinguish
an in-memory mutant lacking the delimiters. Latest full unit count:748 passed,
1 inherited skip,1 inherited todo; lint and TypeScript also pass. The32 browser
tests and production build passed on the identical runtime code. Phase2 has not
begun.

## Provenance and laptop handoff

Initial baseline commit: `724655b`, copied from the current working tree of
`../../PrSAT 3.0/PrSAT-main`, including its uncommitted code/configuration.
FORK_PROVENANCE.json records original hashes and source status;
BASELINE_VERIFICATION.md records the pre-causal baseline checks.
This folder has independent Git metadata and no remote. Deployment is disabled.
The original PrSAT source checkout was not changed by this phase.

All source, phase records, and model examples live in Dropbox. Read this file and
`../LAPTOP_SETUP.md` on the laptop; install dependencies there with `npm ci`.
The parent PrSAT.code-workspace includes this folder through a relative path.

## Review qualifications

The consensus records one unidentified failed unit run among the reviewers'
repeated full runs; the failing test and cause were not captured, so no attribution
is claimed. All captured clean recheck runs and the latest root run pass.
Remaining cosmetic limitations: error columns refer to substituted input, and
older unreferenced bundles are retained in dist/. Deployment remains disabled.
These were explicitly nonblocking in the phase consensus.
