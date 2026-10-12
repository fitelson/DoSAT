# DoSAT 1.0

A Decision Procedure for Do Calculus.

Updated October 11, 2026. **Phase 3 complete. Consensus phase gate: PASS
(Opus 5.5 / xhigh; GPT-6.1 Sol / xhigh).**
The PrSAT-style UI phase is also complete with scoped consensus **PASS**. Latest checks: 1,123 unit tests and 81 Chromium tests pass; the unchanged Phase 3 reduction/solver retain their 607-case native audit approval. See [UI_FINAL_STATUS.md](reviews/ui_implementation_2026-10-11T22-41-54Z/UI_FINAL_STATUS.md). Public repository: https://github.com/fitelson/DoSAT.
Website https://fitelson.org/DoSAT/ is published and verified. See
[PHASE3_PUBLICATION.md](reviews/PHASE3_PUBLICATION.md) for the commit and live checks.
Phase 1 implements the first milestone discussed with
Branden: observational and hard-interventional probability constraints on a
user-specified acyclic graph of observed Boolean variables, with independent
private disturbances. **Phase 1 complete. Consensus phase gate: PASS (Opus 5.5 / xhigh; GPT-6.1 Sol / xhigh).**

## Use

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/decision.html` for the main decision procedure.
The causal model finder is at `/causal.html`, the graphical rule checker at
`/do_calculus.html`, and the classical baseline at `/index.html`.
The model finder's three built-in examples cover
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
Pr(Y | do(X)) = 1/2
```

`Pr(Y | do(X), Z)` observes Z in the intervention regime.
`Pr(Y | do(X, ~Z))` simultaneously sets X true and Z false. Numeric assignments
such as `do(X=1, Z=0)` remain supported. Intervention variables must be declared.
Ordinary `Pr(Y | X)` retains observational conditioning.
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
- `causal.html`: causal entry point; Vite builds causal, classical and do-calculus pages.
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
tests and production build passed on the identical runtime code. Phase2 is described below.

## Phase 2: graphical do-calculus steps (complete)

Open `http://127.0.0.1:5173/do_calculus.html`, or follow the link from the causal
model finder. Phase2 checks one proposed application of Pearl's Rules1–3 against
the supplied observed-variable DAG. It shows the proposed equality, numerical
definedness obligations, deleted arrows, the graph used by the rule, and the
ancestral moral graph's d-separation certificate. A failed condition means this
rule does not certify the equality; it does not assert that the equality is false.

Enter Boolean assignment lists for the pairwise-disjoint groups X,Y,Z,W.
Y and Z are nonempty; X and W may be empty. All six-node/Boolean/observed-variable
limits remain. Numerical definedness is stated but not evaluated by the graphical
checker. Rule3 computes Z(W) after incoming-X deletion and retains incoming
arrows to Z nodes ancestral to W in that graph.

Save/load step files, or save the inequality as a counterexample problem that
loads directly in the phase1 model finder. Each load is validated and requires
checking again; saved verdicts are not trusted. Seven examples cover positive and
negative rule conditions, collider activation, and the special Rule3 ancestry.

See [DO_CALCULUS_SEMANTICS.md](DO_CALCULUS_SEMANTICS.md) for exact rules, theorem
references, certificate meaning, and independent verification. New implementation:
`src/causal_graph.ts`, `src/do_calculus.ts`, `src/do_calculus_ui.ts`,
`src/do_graph_view.ts`. Existing phase1 behavior is touched only by a navigation
link and the build's third entry page. Phase2 baseline commit: `09da858`.

Phase2 does not search for derivation sequences or implement ID/IDC. Hidden
confounding, mixed graphs, cross-world counterfactuals, non-Boolean/cyclic models,
and non-hard interventions remain later phases. **Phase2 consensus gate: PASS.**
The review must concern this phase's delta from09da858 and its new obligations.

The initial default-model debate (`reviews/phase2_consensus.md`) approved the
mathematical implementation and reached agreement on FAIL for one mobile layout
finding. The mobile grid now uses `minmax(0, 1fr)` so wide diagrams scroll inside
their boxes. Four browser regressions cover all seven examples and a long-label
graph at 320, 360, 390 and 1280px. See `reviews/PHASE2_REPAIR_RESOLUTION.md`.
The [scoped consensus recheck](reviews/phase2_recheck_consensus.md) passed after
both reviewers independently verified the repair, the 32-case production matrix,
and regression failures with the old CSS injected in memory. Latest full checks:
862 unit tests pass (1 inherited skip, 1 todo), 49 Chromium tests pass; lint,
TypeScript and build pass. See [PHASE2_FINAL_STATUS.md](reviews/PHASE2_FINAL_STATUS.md)
for the approved snapshot, qualifications and next-phase boundary.

## Phase 3: causal decision procedure (complete)

Branden redirected this phase on October 11 from derivation chains to a decision
procedure for causal satisfiability and entailment. The model class remains a
specified observed Boolean DAG with independent private disturbances. The
do-calculus rules hold through the shared-mechanism semantics.

The new path reduces constraints to polynomial real arithmetic. Each stage
tries the specialized QF_NRA solver with a finite 60-second budget, then falls
back to explicit NLSat if needed. Decision mode has no overall time limit; a bounded mode,
cancellation or finite-resource failure may leave a problem unsettled. Entailment
checks premise consistency and searches for failure of the already interpreted
conclusion, including undefined required terms. It does not substitute explicit
source negation for that semantic complement.

Public name: **DoSAT 1.0**. Subtitle: **A Decision Procedure for Do Calculus.**
Hosting target: `https://fitelson.org/DoSAT/`, with a landing page linking to
`dist/decision.html`, following the PrSAT layout. Release follows completion
and the phase review gate.

New interface: `/decision.html`. Existing model-finder and step-checker pages
remain available. Baseline: `fa7d9bd` (approved Phase 2). Phase 3 passed its
required scoped default-model consensus gate. See
DECISION_SEMANTICS.md and the phase3 records in reviews/ as they are completed.
The initial debate approved the reduction and required F1 cancellation and F2
negation-scope regression repairs. Those repairs passed recheck. The subsequent
QF_NRA optimization introduced G1 (termination guarantee) and G2 (cancellation
diagnosis and browser coverage); their repairs passed the final recheck. The release
uses the current Z3/toolchain versions, including TypeScript 7.0.2. The
[final scoped recheck](reviews/phase3_final_recheck_consensus.md) gives PASS.
Requested deadlines govern accepted verdicts, while
native interruption and cleanup can take additional time.

The main interface now accepts Boolean `do(X)` and `do(~X)` shorthand and
includes Simpson's paradox and a general back-door adjustment example. Both
numeric assignment forms remain supported. The Simpson data are illustrative:
observed recovery is 63% versus 77%; intervention recovery is 75% versus 65%.

The review's nonblocking S2 regression is now permanent and rejects the
guard-deletion mutant. UI help uses neutral strategy wording. Final unit count
is 1,041 (one inherited skip and one todo); 72 Chromium cases and 30 packaged
website checks pass. The reduction and runtime solver are unchanged from the
approved snapshot. See [PHASE3_FINAL_STATUS.md](reviews/PHASE3_FINAL_STATUS.md).
Controlled probes show that context history can slow the six-node example:
fresh contexts return in about 29 seconds, while reuse can take minutes.
The older untraced 08:23 diagnostic remains unattributed. No general speed
advantage is claimed; context lifetime and memory tradeoffs remain future work.

## Provenance and laptop handoff

Initial baseline commit: `724655b`, copied from the current working tree of
`../../PrSAT 3.0/PrSAT-main`, including its uncommitted code/configuration.
FORK_PROVENANCE.json records original hashes and source status;
BASELINE_VERIFICATION.md records the pre-causal baseline checks.
This folder has independent Git metadata and a public `origin` at
`https://github.com/fitelson/DoSAT.git`. The copied deployment command remains
disabled; the new DoSAT publication is scoped explicitly to its own directory.
The original PrSAT source checkout was not changed by this phase.

All source, phase records, and model examples live in Dropbox. Read this file and
`../LAPTOP_SETUP.md` on the laptop; install dependencies with npm 12.2.0 as
described in TOOLS.md. A fresh GitHub clone outside Dropbox has independent
Git metadata and includes the settled release.
The parent PrSAT.code-workspace includes this folder through a relative path.

## Review qualifications

The consensus records one unidentified failed unit run among the reviewers'
repeated full runs; the failing test and cause were not captured, so no attribution
is claimed. All captured clean recheck runs and the latest root run pass.
Remaining cosmetic limitations: error columns refer to substituted input, and
older unreferenced bundles are retained in dist/. The copied deployment command
remains disabled; DoSAT publication uses its own explicitly authorized target.
These were explicitly nonblocking in the phase consensus.

## UI-only review against PrSAT, October 11

At Branden's request, Claude reviewed the published interface against the live
PrSAT 3.0 UI. The default-model consensus review concluded **UI alignment:
Not aligned**. The mathematical/solver Phase 3 PASS remains unchanged.
Read [UI_REVIEW_SUMMARY.md](reviews/ui_prsat_alignment_2026-10-11T21-49-47Z/UI_REVIEW_SUMMARY.md)
and its linked agreed design/transcript. All 13 UI-source snapshot hashes stayed
unchanged; no application or server changes were made during this review.

The agreed first pass restores PrSAT's familiar row editor, live mathematical
previews, header/panels, toolbar, compact action/options and visible probability
table. It retains DoSAT's graph, task distinction, empty-premise validity,
complete saved problems, precise outcomes and mobile containment. Inline error
locations and pending batch-edit behavior need explicit handling. The new model
evaluator is a separate capability. This records a design direction, not an
implemented redesign; later development uses the same scoped review gate.

## UI alignment implementation, October 11

The requested first pass is implemented. The [implementation record](reviews/ui_implementation_2026-10-11T22-41-54Z/UI_IMPLEMENTATION_STATUS.md) lists the new editor/renderer/witness modules, behavioral obligations, frozen source hashes and package captures. Current verification: 1,106 passing unit tests (one inherited skip and one todo), 78 passing Chromium tests, TypeScript, lint and production build PASS. The prepared package passes 31 headless checks across three widths; actual Source Sans Pro SemiBold is rendered and Z3 remains 5.1.0. Main action Y meets the agreed desktop/390px targets; 320px remains contained but requires additional scrolling.

The required default-model scoped UI consensus gate is running. No updated files have been uploaded or pushed yet. Compiler and runtime solver hashes match the approved Phase 3 sources. Optional model evaluation, decimal mode, image export and graphical drawing remain outside this UI pass.

### UI audit repairs and recheck

The first implementation audit reached consensus **UI phase gate: FAIL**, with mobile formula clipping (F1/F3) and loaded-text normalization (F2) as the required repairs. Both groups are implemented and have real-browser regressions. See [REPAIRS.md](reviews/ui_implementation_2026-10-11T22-41-54Z/recheck_2026-10-11T23-04-19Z/REPAIRS.md). Current full verification is 1,123 passing unit tests, 81 passing Chromium tests, TypeScript/lint/build PASS, and 37 passing production-package checks. The recheck source snapshot is frozen; the default-model scoped recheck is running. No publication of the redesign yet. The older mathematical Phase 3 PASS remains unchanged.

### UI gate closed

The repair recheck reached explicit consensus **UI phase gate: PASS**. Source and release hashes match the frozen snapshot. The approved redesign is ready for the authorized commit/push/upload; [UI_FINAL_STATUS.md](reviews/ui_implementation_2026-10-11T22-41-54Z/UI_FINAL_STATUS.md) is the current record. Earlier running/FAIL notes above preserve the development history.

### UI published and verified

The approved redesign is live at https://fitelson.org/DoSAT/dist/decision.html. Implementation `4ed0dea8b55975aaa2fcc4784f5f1c44ab4c8908` is pushed to public main. All 22 remote files and 21 HTTPS files match the release manifest; headers and actual Z3 5.1.0 are correct. The 37-check live probe plus two Cancel/Edit/reuse checks pass. Read [PUBLICATION.md](reviews/ui_implementation_2026-10-11T22-41-54Z/PUBLICATION.md). The compiler/solver and mathematical Phase 3 PASS remain unchanged. Local review servers are stopped. Prior running/FAIL notes are historical; current UI gate and publication are complete.

## Single-page / DAG / returned-model evaluation phase

The user requested one public DoSAT page, removal of the duplicate model-finder and rule-checker pages, live DAG rendering with not-a-DAG errors, and evaluation of new expressions in returned models. These changes are implemented locally. The public app will be /DoSAT/ with one production index.html; old paths redirect and retired source entries remain under reference-ui/. The evaluator uses a frozen shared kernel and exact values, including new intervention regimes, with no new-model search or unassigned-variable completion. The original solver/reduction remain unchanged. Review records are in reviews/single_page_model_eval_2026-10-12T01-02-21Z/. The current scoped gate is pending, so the preceding published version remains live until approval.

Latest local verification: 1,309 unit tests pass (one inherited skip/todo each). All 90 existing/updated browser tests pass, plus the added legacy import browser case (91 unique cases). TypeScript, lint and build pass. Native Apache configuration and byte/header/redirect checks pass for the preserved eight-file, one-HTML package. Initial root-index redirect loop was caught and fixed before review. Source is being frozen for the default-model scoped consensus gate.

### Single-page/model-evaluation gate complete

The scoped default-model repair recheck gives **Phase gate: PASS**. Current record: [FINAL_STATUS.md](reviews/single_page_model_eval_2026-10-12T01-02-21Z/FINAL_STATUS.md). The approved eight-file package has one HTML entry; 1,316 units and 93 unique browser cases pass, with real Apache/package validation. Authorized commit/push/publication follows the gate. Previous pending/FAIL notes are historical.
