# AGENTS.md

## Development phase review gate

Before moving to the next development phase, run the **consensus debate skill**
with its defaults: **Claude Opus 5.5 / xhigh** and **GPT-6.1 Sol / xhigh**.
This workflow was requested by Branden on 2026-10-11 and applies to every phase
of this project. A standalone Claude consultation does not fulfill this gate.

**Scope every debate to the current phase.** Review the changes, new mathematical
claims, and integration obligations introduced in that phase. Existing code is
reference material only where a current change depends on its behavior. Do not
reopen a general audit of untouched older code or treat unrelated inherited
issues as phase findings. Any such observation should be clearly out of scope.

Give both participants the actual completed implementation, tests, precise
semantics/scope, verification results, and source snapshot. Review mathematical
faithfulness, soundness, exact arithmetic, input validation, resource/lifecycle
handling, integration and test coverage. Use the installed skill's authoritative
runner, streamed fsynced journals, stable resumable sessions, checkpoints, and
compressed-report protocol. Keep defaults unless Branden requests overrides.

Ask for an explicit **Phase gate: PASS or FAIL**. Agreement on a list of required
repairs is consensus on the review, not approval to advance. Fix material findings,
rerun affected checks, and obtain a consensus recheck of those fixes. An incomplete
audit, no-consensus outcome, or unresolved material finding keeps the gate open.
Record transcript, resolutions, verification, and gate status in reviews/ and
PROJECT.md for both tools and the laptop. Share Markdown transcripts; raw JSONL
journals are private diagnostics. No recursive debates or model delegation inside
the review. This gate is separate from publication; the fork remains local until
Branden requests otherwise.

## UI alignment phase, October 11

Implement the agreed first pass in reviews/ui_prsat_alignment_2026-10-11T21-49-47Z/UI_AGREED_DESIGN.md. Scope this gate to the UI delta from 9ad6e1d: row editing and batch state, causal MathML, exact witness presentation, task/draft distinction, JSON controls, validation/accessibility, and responsive PrSAT styling. The Phase 3 compiler and runtime solver are unchanged and their mathematical PASS remains closed. Arbitrary returned-model evaluation is a later capability. Before publication require explicit scoped consensus PASS and verify the prepared package and live site. The UI gate is PASS after the scoped repair recheck. Current status: reviews/ui_implementation_2026-10-11T22-41-54Z/UI_FINAL_STATUS.md; approved recheck: recheck_2026-10-11T23-04-19Z/consensus.md in that folder. Later code changes require their own scoped gate.

## Single-page, DAG preview and model evaluation phase

Current delta begins at approved publication 109ec5be9ee936b36a03009a920fd44eb52255e8. Branden requested a live DAG preview, not-a-DAG syntax errors, retirement of causal.html and do_calculus.html, one public DoSAT page, repository updates and new-expression evaluation in a returned model. Production has one entry, index.html, served directly at /DoSAT/; retired URLs redirect there. Earlier HTML entries are preserved only under reference-ui/ for provenance and tests. The decision reduction and solver remain unchanged.

The current phase gate is PASS after the B1/B2 recheck; see reviews/single_page_model_eval_2026-10-12T01-02-21Z/FINAL_STATUS.md. Read the EVALUATION_SEMANTICS.md in that folder. Evaluate a frozen complete shared kernel and assigned user variables, including new intervention regimes. Do not retain native Models, create a new satisfying model, silently complete missing user variables or use floating point. Real undefinedness and guarded Boolean satisfaction are distinct. Cancellation awaits native simplification settlement; main Run stays blocked until model evaluation settles. Scope the required default consensus gate to these changes and their integration, not a new audit of old mathematics.

## Batch model checks, October 12

The PrSAT-style evaluation row/batch editor phase is PASS after the scoped
default-model review in reviews/batch_model_evaluation_2026-10-13T01-57-53Z/consensus.md.
Read that folder's SEMANTICS.md and PUBLICATION.md for the current behavior and
release evidence. Batch checks use one captured model, serial callbacks and one
abort/busy ownership interval; no partial results survive cancellation or edits.
The decision solver and exact evaluator service are unchanged. Keep the ordinary
premise editor and evaluator namespaces separate. Existing limits apply to
accepted active checks, not to a strict cap on all manually created preview rows.

## Phase 2 scope

The later automatic-evaluation/layout corrections are PASS in
reviews/automatic_evaluation_layout_2026-10-13T02-15-05Z/consensus.md and supersede
the manual evaluation interaction. Read that folder's SEMANTICS.md/PUBLICATION.md.
Values belong beside the rows and update automatically; latest edits wait for
debounce and native settlement. Cancellation must suppress queued work. Conclusion
layout flattens only its root conjunction tree, preserving nested grouping.
The DAG fits its panel; the widest typeset conclusion clauses still scroll on
phones. Keep the decision/parser/evaluator-service semantics unchanged.

Phase2 adds single-step graphical checking of Pearl Rules1–3 using d-separation
in manipulated observed-variable DAGs. Read DO_CALCULUS_SEMANTICS.md. Graphical
applicability does not check numerical definedness; failed conditions leave an
equality uncertified. Rule3's Z(W) uses ancestry in G_bar(X). ID/IDC, latent
confounding and automated derivation search are outside this phase. The phase2
review baseline is local commit09da858; phase1 code is reference/integration
material only. Phase2 is complete and its scoped default-model consensus recheck
passed; see reviews/PHASE2_FINAL_STATUS.md. The same gate applies to Phase3.

## Phase 3 scope

Phase3 adds an audited SAT/entailment decision procedure, not derivation chains.
Read DECISION_SEMANTICS.md. Countermodels complement the already guarded
conclusion and include required undefined terms. Default solving uses a finite
60-second QF_NRA attempt per stage, then explicit NLSat with no overall time
limit; resource/timeout/cancellation outcomes prove
nothing. Scope the phase3 review to the delta from approved Phase2 commit
fa7d9bd0deccc2c01da04883c1ae55fb0d74a30c and the new obligations. The gate is
PASS; see reviews/PHASE3_FINAL_STATUS.md and phase3_final_recheck_consensus.md.
Do not reopen unrelated older code. Model class remains finite observed
Boolean DAGs with independent disturbances; ID/IDC and latent models are outside.
Boolean `do(X)` / `do(~X)` aliases preserve numeric hard-intervention semantics.
Deadline claims concern accepted verdicts, not physical settlement or cleanup.
Nonblocking followups added one permanent witness-error regression and neutral
help wording; no runtime solver or reduction change. Context-reuse performance
is instance dependent. A later phase requires a new scoped consensus gate.
Branden explicitly authorized public repository creation, commit, push and
publication on October 11. The new target is fitelson/DoSAT and /DoSAT/;
never execute inherited PrSAT deployment commands.

## Do-calculus research fork (2026-10-11)

Read PROJECT.md first. This is the independent PrSAT 3.0 do-calculus extension
workspace. Inherited documentation below describes the original baseline;
its production deployment instructions do not apply to this fork.
The first observed-Boolean-DAG causal satisfiability phase is implemented.
See PROJECT.md and CAUSAL_SEMANTICS.md for its exact scope. Do not push or deploy
without a later request. The family hub is ../PROJECT.md.
The copied production deploy command has been disabled. Development/preview
use strict loopback ports 5173/4173; never use permanent service port 5317.
The baseline graph was not copied; query the original graph read-only or build
a fresh code-only graph here when implementation begins.


This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What is PrSAT?

PrSAT (Probability Satisfiability) is a web-based tool for checking satisfiability of probabilistic constraints. Users enter constraints involving probabilities (e.g., `Pr(A) > Pr(B)`, `Pr(A|B) = 1/2`) and the tool uses the Z3 SMT solver to find a probability distribution satisfying all constraints, or reports UNSAT if none exists.

**Live deployment:** https://fitelson.org/PrSAT/

## Architecture

- **Frontend:** TypeScript + Vite, runs entirely in browser
- **Solver:** Z3 compiled to WebAssembly (z3-solver npm package)
- **Key constraint:** Z3 WASM requires SharedArrayBuffer, which needs cross-origin isolation headers

## Key Files

| File | Purpose |
|------|---------|
| `src/text_to_display.ts` | Main UI logic, input handling, result display |
| `src/z3_integration.ts` | Z3 solver interface, model parsing, evaluation |
| `src/pr_sat.ts` | Constraint translation, truth table generation |
| `src/parser.ts` | Parsing probability expressions |
| `src/block_playground.ts` | Constraint input block UI (Load, Save, Clear, Batch) |
| `webpage/index.html` | Project webpage (deployed to fitelson.org/PrSAT/) |
| `CHANGELOG.md` | Change history for local/fork changes |

## How It Works

1. User enters constraints like `Pr(A) > Pr(B)`, `Pr(A|B) = 1/2`
2. Parser converts to AST representation
3. Constraints translated to state variable sums (one variable `a_i` per truth table row)
4. One state variable eliminated (set equal to `1 - sum of others`) for efficiency
5. Z3 solves the resulting QF_NRA (quantifier-free nonlinear real arithmetic) problem
6. If SAT, model displayed as probability table with assignments

## State Variables

- Named `a_1, a_2, ...` (1-indexed) in display
- Internally 0-indexed
- Last variable eliminated: `a_n = 1 - (a_1 + ... + a_{n-1})`
- Each `a_i` represents probability of one row of the truth table

## Irrational Number Display

Z3 returns algebraic numbers as `root-obj` expressions (roots of polynomials).

- **Quadratic irrationals (degree 2):** Displayed as simplified `(-b ± √D) / 2a` form with decimal approximation
- **Higher degree:** Displayed as "Root #N of [polynomial]"

Simplification extracts perfect squares from radical, reduces by GCD.

## Build and Test Commands

```bash
npm run dev              # Local dev server at localhost:5173
npm run build            # TypeScript compile + Vite build
npx vitest --run         # Unit tests only (fast)
npm test                 # Unit + Playwright e2e tests (slower)
npx vitest --allowOnly   # Run single test (add .only to test)
npx playwright test --project chromium tests/simple.spec.ts  # Single e2e test
```

## Graphify Codebase Graph

- Code-only graph built 2026-06-27 at `graphify-out/`: 607 nodes, 1377 clustered edges, 36 communities, 0 LLM tokens.
- `.graphifyignore` keeps the graph code-only by excluding docs/PDFs, `node_modules/`, `dist/`, generated artifacts, JSON lock/data files, HTML pages, and bundled Z3 assets.
- Query from the repo root with `graphify query "..."`; inspect paths with `graphify path "A" "B"` and node neighborhoods with `graphify explain "X"`.
- After source edits, run `graphify update .` from the repo root to refresh the AST graph.

## Deployment Notes

- **GitHub repo:** `fitelson/PrSAT` (forked from `imapersonman/PrSAT`)
- **Live site:** https://fitelson.org/PrSAT/
- `npm run deploy` builds and uploads `dist/` to the server via scp
- Webpage (`webpage/` directory) deployed separately: `scp webpage/* fitelson@fitelson.org:/home/fitelson/www/www/PrSAT/`
- `dist/.htaccess` required for Apache servers (cross-origin isolation headers)
- iOS Safari requires proper COEP/COOP headers for SharedArrayBuffer

## Logical Connectives: Two Levels

The same connective symbols (`~`/`-`/`!`, `&`/`/\`, `v`/`\/`/`∨`, `->`/`>`/`→`, `<->`/`<>`/`↔`) parse at **two** levels and the parser disambiguates by context:

- **Sentence-level** (inside `Pr(...)`): join statements of propositional calculus. E.g. `Pr(A & B) = 1/4`, `Pr(A <-> B) = 1`.
- **Constraint-level** (outside `Pr(...)`): join whole probabilistic constraints into a single compound `Constraint`. E.g. `Pr(A) = 1/2 & Pr(B) = 1/2`, `~(Pr(A) = Pr(B))`, `(c1 & c2) <-> c3`.

Symbols are defined identically in `src/pr_sat.ts` (`possible_constraint_connectives` ≈ line 548, `possible_sentence_connectives` ≈ line 696). The constraint-level translation to Z3 lives in `constraint_to_bool` in `src/z3_integration.ts`. Compound metalinguistic constraints have always been supported — this enables single-input theorem-checking by entering the negation of a putative theorem and looking for UNSAT.

## Recent Work (2026-01/04)

- **2026-04-18:** Upgraded `z3-solver` 4.15.4 → 4.16.0 and refreshed bundled WASM assets
- **2026-04-18:** Documented the two-level connective overloading on the project webpage; fixed in-app help typo where `->`/`→`/`>` was labeled "biconditional"
- Added Contributors section to README (Koissi Adjorlolo, Codex, Branden Fitelson)
- Added `v` as disjunction symbol (in addition to `∨` and `\/`)
- Simplified syntax error message to "Syntax error (not a wff)." on button
- Added Clear button for constraint entry (resets to single empty input); removed redundant Clear from model evaluate heading
- Fixed division-by-zero detection in model evaluator
- Added "Save table as image" button
- Simplified timeout UI to single seconds field
- Consistent `a_i` naming throughout
- Simplified quadratic irrational display with decimal approximation
- iOS Safari compatibility fixes

## Common Tasks

**Adding a new feature to the UI:** Edit `src/text_to_display.ts`

**Changing how Z3 results are parsed:** Edit `src/z3_integration.ts`

**Modifying constraint translation:** Edit `src/pr_sat.ts`

**After changes:** Run `npm run build` to check for TypeScript errors, then `npx vitest --run` for quick tests.
