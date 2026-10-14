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

Historical Phase 1 limits: six graph variables, 64 constraint lines, 64 probability occurrences,
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
`npm test` covers units plus the public-page browsers; see [TESTING.md](TESTING.md)
for when `test:e2e:legacy` is required and how to run all retained browser cases.

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

### Single public page now published

The canonical DoSAT 1.0 app is live at https://fitelson.org/DoSAT/. It includes the live valid-DAG preview, not-a-DAG errors and exact returned-model expression evaluation. All five former /dist/ entry routes redirect to this single page. Implementation0261b48 is pushed to public main; eight remote/six HTTPS files match, 38 live probe and two live Cancel/Edit/reuse checks pass. Backup directory is HTTP403. See [PUBLICATION.md](reviews/single_page_model_eval_2026-10-12T01-02-21Z/PUBLICATION.md). Gate PASS,1316units/93unique browsercases, source hashes unchanged. Earlier pending/FAIL and old URL notes are historical.

## Literature examples, October 12, 2026

The requested replacement menu has the six literature illustrations (Berkson,
M-bias, instrument bias amplification, treatment–confounder feedback, front-door,
and positivity failure), plus the retained Simpson example. Source data live in
src/causal_decision_examples.ts. Collapsible guidance gives literature links,
expected decisions and exact returned-model evaluations; it clears after problem
edits or a file load. Numerical inputs are constructed Boolean illustrations.
Front-door/instrument background causes are explicit graph nodes, not an extension
to latent-variable identification. The original compiler, solver and evaluator
are unchanged. Former menu cases remain regression fixtures.

Local checks: **1,318 units pass**, one inherited skip and one todo; **103 Chromium
cases pass**, including all seven presets, all 15 displayed evaluation results,
and 320/390/1280px containment. TypeScript/lint/build and authored whitespace pass.
Independent Fraction enumeration checks the specified kernels and every premise,
the exact displayed values, positivity countermodels and retained Simpson rates.
The first browser attempt could not launch because Playwright's pinned Chromium
was absent; after installing that browser, the complete suite passed.

The scoped default-model consensus gate is pending. Current evidence and review
artifacts: reviews/literature_examples_2026-10-12T13-22-34Z/. These presets have
not been pushed or published; the prior approved release remains live.

### Literature preset repair checkpoint

The initial scoped consensus agreed on FAIL for three bounded repairs: precise
all-paths-through-L wording, neutral startup status, and explicit guide-lifecycle
regressions. Those repairs are implemented, along with exact scalar assertions
and a positivity-term definedness check. All numerical inputs and recipes,
Simpson, and compiler/solver/evaluator sources remain unchanged.

The refreshed full suite passes 1,318 units and 103 Chromium cases; the rebuilt
eight-file package passes 21 scenario runs and 45 exact evaluations across three
widths, plus the startup and guide-clear checks. The repair recheck is running.
Read reviews/literature_examples_2026-10-12T13-22-34Z/recheck_2026-10-12T14-08-02Z/REPAIRS.md
for the candidate, preserved unit-failure qualification and subsequent passing
runs. Publication is still pending.

### Literature presets approved and published

The scoped repair recheck reached explicit **Phase gate: PASS** from both
Claude Opus 5.5/xhigh and GPT-6.1 Sol/xhigh. R1–R3 and the exact-value/definedness
regressions are closed. The seven-example menu is live at
https://fitelson.org/DoSAT/; Simpson's graph, premises and conclusion are unchanged.
The approved eight-file package matches all eight remote files and six public
HTTPS files. Cross-origin headers, WASM MIME, five legacy redirects and protected
backups pass. The actual live browser probe passes 21 scenario runs and 45 exact
evaluations across 320/390/1280px widths, with no browser errors.

Branden explicitly requested commit, push and upload on October 12. This source
release targets **fitelson/DoSAT main only**; the remaining family push freeze is
unchanged. Source, tests, currently referenced assets and curated review evidence
are included in this release. Raw journals, older bundles and existing unrelated
artifacts are preserved locally. Read
[FINAL_STATUS.md](reviews/literature_examples_2026-10-12T13-22-34Z/FINAL_STATUS.md)
and [PUBLICATION.md](reviews/literature_examples_2026-10-12T13-22-34Z/PUBLICATION.md).
The earlier running/FAIL/pending notes above are historical. The unexplained
unchanged-evaluator WASM unit failure remains documented; subsequent isolated,
full and independent reviewer runs pass.

## Explicit entailment conclusions and E/M/A Simpson table, October 12

Branden requested explicit conclusions for the first five literature presets,
then supplied an E/M/A table for Simpson and asked to use its probabilities and
variables in the open app. The open Chrome problem has been updated and its
conclusion returns ENTAILS. The local preset update gives all seven cases active
entailment conclusions; the first five and Simpson should ENTAIL, while the
unchanged positivity example should DOES NOT ENTAIL.

The first-five graphs, numerical premises, Regular settings and exact model
evaluation recipes are preserved. The instrument and front-door conclusions use
exact individual risk values after initial symbolic conclusions exposed high
solver resource costs. Their full adjustment expressions remain optional model
checks. ENTAILS returns no witness, so the guide explains the Satisfiability /
Find Model route to inspect those expressions. Save/Load preserves each active
conclusion. The compiler, solver, evaluator and parser sources are unchanged.

Simpson now has E -> M; E -> A; M -> A, with the supplied unsimplified ratios.
Its observational rates are 7/13 > 6/13; under that explicit DAG assumption,
intervention rates are 19/40 < 21/40. Counts alone do not determine the DAG.
The prior Simpson numbers remain historical regression inputs.

Current local verification and resource qualifications are recorded in
[CONCLUSIONS.md](reviews/entailment_presets_2026-10-12T18-57-44Z/CONCLUSIONS.md)
and [VERIFICATION.md](reviews/entailment_presets_2026-10-12T18-57-44Z/VERIFICATION.md).
The completed scoped consensus gate is PASS. The approved update is live at
https://fitelson.org/DoSAT/: eight remote/six HTTPS hashes match, and the fresh
full live run passes 21 scenarios and 45 evaluations. See
[FINAL_STATUS.md](reviews/entailment_presets_2026-10-12T18-57-44Z/FINAL_STATUS.md)
and [PUBLICATION.md](reviews/entailment_presets_2026-10-12T18-57-44Z/PUBLICATION.md)
for source delivery and preserved nonblocking qualifications.
DoSAT's existing commit/push/upload authorization continues for this fix, with
the other family repos frozen. Earlier statements that Simpson's inputs remain
unchanged describe the preceding release and are superseded by this request.

## Simpson admissions correction, October 12

This three-node candidate was reviewed but never published. It and the later
A-first draft are superseded by the user-selected Pearl-style model below.

Branden specified A = admission, E = applying to the easy department and M =
being male, then explicitly requested the graph/conclusion correction and
commit/push/upload. The local preset now uses M -> E; M -> A; E -> A, with E
as the applicant's choice and M as background. Equivalent root-M/E-given-M
premises preserve all eight supplied cell counts. The six-clause conclusion
checks the overall/within-department reversal, invariance of M under both E
choices and the higher admission probability under do(E) than do(~E).

Population choice rates are 31/40 and 9/40; for known M they are 3/4 and 1/5.
The old do(M) inequality is not entailed, and its left term is 7/13 in the
returned countermodel. The generic language still permits that hypothetical
intervention, but the preset does not present it as an applicant action.
The DAG is an explicit causally sufficient toy assumption, not a conclusion
about discrimination inferred from the table.

The other six presets and eleven backend/UI-runtime files are unchanged.
Verification, exact reconstruction and the scoped phase/publication status
are in reviews/admissions_simpson_2026-10-12T20-46-41Z/. The gate is pending;
the preceding release remains live until a final candidate passes. Earlier E->M and 19/40
statements are historical and superseded for this admissions interpretation.


## Pearl-style admissions and aptitude, October 12

The user selected Pearl's expanded admissions explanation: aptitude U and career
objectives Z, with M -> Z; U -> Z; M -> E; Z -> E; U -> A; E -> A. This adapts
Figure 4.9 without its direct M -> A arrow. U is unrecorded in the story but
explicitly specified as a Boolean node in the app; no latent-ID engine is added.
The constructed positive mechanisms preserve every supplied E/M/A cell after
summing over U and Z. The active conclusion separates the observed female
advantage within departments from zero gender effect with department held fixed.
Easy/hard intervention risks are 2/3 and 1/3. Unconditional gender effects can
still operate through department choice (7/13 versus 6/13).

This supersedes both unpublished three-node drafts. Source attribution,
department-fixing versus selection semantics, exact arithmetic, regressions and
publication records are in reviews/pearl_admissions_2026-10-12T21-37-55Z/.
The scoped default-model implementation gate passed after the exact-decimal
repair described below. Publication is recorded in the current release record.


## Constraint optimization implementation, October 12

Branden requested all four stages agreed in the Claude-Codex design debate,
plus original-predicate witness validation, followed by checks, commit, push and
upload. The completed design debate is
reviews/constraint_optimization_2026-10-12T22-05-42Z/consensus.md. This implements
inlining/exact folding/sharing, intervention-specific ancestral pruning,
guarded mechanism cancellation/support simplification, and bounded fraction
normalization. The selected default remains one polynomial encoding for the
60-second QF_NRA attempt and explicit NLSat fallback. Entailment directly checks
premises and failure of the guarded conclusion; there is no consistency preflight.
Original guarded metadata remains intact and is checked after SAT/countermodels.
The implementation gate passed after the exact-decimal repair; current evidence is in
reviews/constraint_implementation_2026-10-12T23-41-52Z/.

Branden additionally requested eight allowed variables. The shared causal graph
limit and compiler API now accept eight nodes and reject nine. Help and semantics
reflect up to 256 rows per regime; input/expansion budgets remain in force.

## Approved release, October 12, 2026

Both default-model implementation reviews are PASS: the exact-zero repair in
reviews/constraint_implementation_2026-10-12T23-41-52Z/recheck_2026-10-13T00-33-52Z/consensus.md
and the independently approved test cleanup in
reviews/test_suite_simplification_2026-10-13T00-47-28Z/implementation/consensus.md.
The reviewed executable is dosat-45ZXtgOV.js. After the cleanup, 1349 unit tests
pass (one inherited skip and one todo); 108 distinct browser cases passed across
the recorded runs. Routine browser checks now cover 59 public-page cases, with
49 retained legacy cases available separately. The 607-case semantic oracle,
480000 exact differential comparisons and adversarial boundary regressions remain.

The review isolated intermittent native Z3/WASM out-of-memory failures in both
pre-repair and repaired code, with no incorrect verdict observed. This is a
separate reliability follow-up; eight allowed variables do not guarantee that
every model fits the solver's memory budget. See the repair consensus for evidence.
Publication and live verification will be recorded in
reviews/constraint_implementation_2026-10-12T23-41-52Z/PUBLICATION.md.

## Batch model evaluation, October 12

Branden requested PrSAT's batch mode and verification of multiple constraints in
one returned model. Evaluate model now reuses the row editor in evaluation mode,
with independent batch Parse/Discard and Clear checks. Mixed real expressions
and Boolean constraints receive individual exact results. The immutable captured
model, definedness semantics, evaluator service and decision solver are unchanged.
One abort signal and one ownership interval cover the complete serialized batch;
no partial batch results survive cancellation or edits. Existing source budgets
bound the batch. Scope, verification and the required review are in
reviews/batch_model_evaluation_2026-10-13T01-57-53Z/. The completed default-model
implementation consensus is PASS. All 1357 units and 62 public-page browser
cases pass, as do lint, TypeScript/build and 99 actual prepared-package batch
checks across three widths. Publication is recorded in that folder's PUBLICATION.md.

## Automatic evaluation and layout corrections, October 12

Branden clarified that evaluations should run automatically and show values beside
rows, rather than typeset input awaiting an Evaluate click. Row edits and batch
Parse now trigger debounced exact evaluation; valid rows survive another row's
syntax error, and native work remains serialized until settlement. Details are
expandable. He also identified clipped conclusion text and DAG nodes. The full
graph now fits its panel; the conclusion input expands and top-level conjunctions
render on separate lines without splitting nested logic. This supersedes the
manual interaction from the preceding batch release. Current scoped verification
and the required review are in reviews/automatic_evaluation_layout_2026-10-13T02-15-05Z/.
The completed implementation consensus is PASS. Verification covers 1366 distinct
unit cases, 65 public browser cases and 99 automatic prepared-package checks at
three widths. Full input text and all graph nodes are visible; the widest
typeset clauses require horizontal scrolling on phones. Publication/live evidence
is recorded in that folder's PUBLICATION.md.

## Graph input sizing, October 12

Branden identified wrapped graph source text hidden by the fixed-height input.
The graph textarea now shares the conclusion's content sizing, on input/load and
width changes. This UI-only correction keeps the full source text visible without
changing its value, graph rendering or model semantics. Scope and verification:
reviews/graph_input_autosize_2026-10-13T02-30-42Z/.
The scoped default-model implementation review is PASS. Full checks pass 1366
units and 66 public browser cases, plus lint/TypeScript/build. The prepared
package passes six width transitions with source and returned-model preservation.
Publication/live evidence is recorded in that folder's PUBLICATION.md.

## Expression limits, October 13, 2026

Branden requested raising the 512-token limit so the complete independence
conclusion can be checked with Regular off. The shared expression budget is
now 2,048 tokens. The supplied 17-clause, division-free goal has 770 tokens,
1,291 characters and 67 probability occurrences; therefore the parser and
compiler probability-occurrence cap also rises from 64 to 128, using one
shared constant. The 4,096-character line cap, 64 constraint lines, nesting,
graph, total-input and expansion budgets remain unchanged. Mathematical,
solver and returned-model semantics are unchanged.

Boundary regressions cover the exact token/query limits and their overflow;
the full goal compiles with empty premises and nonregular bounds. All 1,368
units pass (one inherited skip and todo), lint/build pass, and all 67 public
Chromium cases pass, including full-goal entailment with no premises and
with Pr(U)=0. Review and publication evidence is in
reviews/expression_limits_2026-10-13T11-40-23-039Z/. The scoped default-model
consensus gate is pending. Existing publication authorization remains DoSAT-only.

### Expression-limit repair checkpoint

The initial consensus reached FAIL on malformed-prefix responsiveness; its
first raw-error finding was extended to a reproduced multi-second validation
freeze. The agreed R1–R4 repair adds a linear prefix-depth guard (128 per AST
root), preserves probability event roots and infix syntax, normalizes residual
recursion errors, and records that all input bounds apply together. The
compiler's depth limit remains 128. The old Phase 1 limits are labeled historical.

The final repair candidate passes 1,374 units (one inherited skip/todo), all
68 public Chromium cases, lint, TypeScript/build and whitespace. The final
package passes twelve verdict checks, both budget rejections and prompt prefix
error/recovery checks. The default-model scoped recheck is pending; records
are in reviews/expression_limits_2026-10-13T11-40-23-039Z/recheck_2026-10-13T12-13-26-209Z/.

### Expression limits approved

The completed default-model repair consensus gives explicit Phase gate: PASS.
R1–R4 are closed; source and final package hashes match. Read the recheck
FINAL_STATUS.md for 1374 units/68 browser cases, the full nonregular goal,
zero-support and false-clause evidence, and the measured nonblocking latency
qualification for contrived accepted nested input. The initial FAIL/pending
notes are historical. Authorized DoSAT-only commit/push/publication follows.

### Expression limits published and verified

Source e3d3adb is pushed to public DoSAT main and live at
https://fitelson.org/DoSAT/. All eight remote/six HTTPS file hashes match;
isolation headers, WASM MIME, five legacy redirects and backup protection pass.
The fresh live probe passes twelve verdict checks, both overflow errors and
prompt prefix rejection/toggle/recovery. The original full independence goal
is ENTAILED with Regular off, including zero support; those premises are SAT
and a false appended clause gives a countermodel. Read the current recheck
PUBLICATION.md and FINAL_STATUS.md. Initial FAIL/pending notes are historical.

## Header line removal, October 14, 2026

Branden requested removing the assumptions summary line beneath the subtitle.
Exactly that paragraph is removed from the public header. The prepared package
passes85 existing interface tests, lint/TypeScript/build and three-width header
checks. Branden explicitly waived a consensus requirement for this trivial change and
requested commit, push and upload. Verification records are in reviews/header_line_2026-10-14T18-00-01-870Z/.

### Header removal published

Source 631af60 is committed, pushed and live.8remote/6HTTPS hashes,
headers/redirects/backup protection and three-width live header checks pass.
See reviews/header_line_2026-10-14T18-00-01-870Z/PUBLICATION.md.

## Graph edge visibility, October 14, 2026

Branden identified U -> Y disappearing behind X and requested every path be
visible. Arrows now use clear column gutters and separate upper lanes for
long edges, with distinct node attachment points and smooth turns. Accepted
graphs and their semantics are unchanged. Direct verification covers1374 full
units on retry,119 final affected units, eight targeted browser cases, and15
final package graph/width combinations with independent path/ellipse sampling.
The initial evaluator timeout and passing isolated/full reruns are retained
in reviews/graph_edge_visibility_2026-10-14T18-16-47-074Z/final/VERIFICATION.md. This routine presentation
correction follows Branden’s direction to avoid debates for trivial UI fixes.
DoSAT-only commit/push/upload follows the direct checks.

### Graph visibility published

Source 6aa13d1 is pushed and live at https://fitelson.org/DoSAT/.
8remote/6HTTPS hashes, headers/redirects/backup protection and15 live graph/
width checks pass. The U -> Y arrow is visible above X; sampled arrows avoid
unrelated node ellipses. See reviews/graph_edge_visibility_2026-10-14T18-16-47-074Z/final/PUBLICATION.md.

## Original curves with more height, October 14, 2026

Branden preferred the original arrow style and requested added height. Single
quadratic curves and their original ellipse attachment are restored. Compact
row spacing/minimum height and arc room are increased; preview height cap is
360px. This supersedes the earlier gutter-routing presentation.119 affected
units, lint/TypeScript/build and15 built graph/width checks pass, including
U -> Y clearing X. Records are in reviews/curved_graph_height_2026-10-14T18-39-57-854Z/.

### Curved arrows published

Source 483be0a is pushed and live.8remote/6HTTPS hashes and15 live
graph/width checks pass; the old curved style has more vertical room and the
U -> Y curve stays clear of X. See reviews/curved_graph_height_2026-10-14T18-39-57-854Z/PUBLICATION.md.
