# Phase 2 complete — October 11, 2026

**Phase gate: PASS.** Required consensus defaults:
Claude Opus 5.5/xhigh and GPT-6.1 Sol/xhigh.

## Delivered

A single-step checker for Pearl's three do-calculus rules on observed Boolean
DAGs of up to six variables. It displays the proposed equality, rule-specific
graph surgery, Rule 3's Z(W), numerical definedness obligations, directed graph
diagrams and the ancestral-moral d-separation certificate. Steps can be saved
and loaded; an inequality challenge can be exported to the Phase 1 causal
model finder. Seven examples demonstrate both certified and uncertified steps.

Run `npm ci` on a new machine, then `npm run dev`. The checker is
`http://127.0.0.1:5173/do_calculus.html`; the causal model finder is `/causal.html`.

## Verification

- Lint, TypeScript and production build: pass. Source/document checks pass;
  preserved generated/review artifact whitespace is qualified below.
- Full units: 862 passed, 1 inherited skip, 1 inherited todo; 22 files.
- Full headless Chromium: 49 passed, serial strict 5174; 17 new Phase 2 cases.
- Permanent independent graphical oracle: 51,328 comparisons over ordered
  four-node DAGs, disjoint query/role sets and relabeled d-separation cases,
  plus targeted six-node examples.
- Seven actual-Z3 Phase 2 checks, including five certified inequalities UNSAT,
  the Rule 3 descendant-W counterexample SAT, and an uncertified equality
  satisfied by a particular regular model.
- Root production probe: 32 example/viewport combinations at
  320/360/390/1280px pass with zero page errors.

## Review and repair

[Initial scoped debate](phase2_consensus.md): FAIL for one mobile layout defect;
mathematics, graph logic, definedness and integration approved.
The mobile grid's automatic minimum allowed wide SVGs to enlarge the whole page.
One CSS line now uses `minmax(0, 1fr)`. Four browser regressions cover all seven
examples plus a long-label graph at three phone widths and one desktop width.

[Scoped repair recheck](phase2_recheck_consensus.md): explicit PASS from both
participants, consensus reached and synthesis completed successfully. Each
independently verified the fixed source hashes, lint/TypeScript/build, 17 affected
browser tests, and 32 production cases. Each demonstrated actual internal
scrolling in 46 boxes. A temporary copy of the regression with the old CSS
injected in memory fails at all three narrow widths and passes at 1280px.
No runtime source changed after this PASS. Project/status documents were then
updated to record the result.

Checkpoint staging exposed harmless whitespace in a generated parser message
string, the captured Playwright failure and the runner's Markdown trailing blank
lines. Full `git diff --cached --check` reports those preserved artifacts (exit 2).
The source/configuration/document check excluding these generated or verbatim
artifacts passes. They retain their original contents; no runtime repair follows.

Reviewed snapshot: `phase2_repaired_snapshot.json`. Original first-review
snapshot: `phase2_initial_snapshot.json`. Final documentary snapshot:
`phase2_final_snapshot.json`. Baseline: `09da858` (approved Phase 1 checkpoint).
Phase 1 parser, compiler and solver source remains byte-identical to baseline;
the integration delta is a navigation link and Vite's third entry page.

The first new desktop regression had an incorrect box-alignment assumption.
It was corrected to check the side-by-side grid sections, and the full browser
rerun passed 49/49. The exact failure is preserved in
`PHASE2_DESKTOP_ASSERTION_FAILURE.md`; no runtime defect was involved.

## Qualifications and remaining scope

Graphical certification applies WHERE both conditional terms are defined.
Numerical definedness is listed, not computed. Failure leaves the equality
uncertified; it does not prove that the equality is false. A displayed failure
path is in the derived moral graph, not asserted to be an active original-DAG
path. Settled UNSAT of an exported inequality excludes defined counterexamples
in the selected Phase 1 model class; UNKNOWN or cancellation proves nothing.

The initial reviewers' native-Z3 sweep found 54,216 expected SAT/UNSAT outcomes
over three/four-node DAGs, allowing zero-probability models. The peer checked all
indexed outcomes. This is reviewer experimental evidence, not a committed
portable test or an exhaustive six-node proof. General correctness relies on
the cited graphical theorem together with the independent permanent tests.
The scoped repair recheck did not repeat this sweep or audit untouched old code.

Nonblocking suggestions remain in the transcripts: a small native semantic
regression, relabeled rule-surgery enumeration, distinct SVG accessible labels,
old-browser arrowhead colour fallback, and stronger per-box scrolling assertions.
Unreferenced build files are retained and excluded from the new checkpoint.

Automatic derivation search, checked multi-step chains, ID/IDC, latent/mixed
models, cross-world counterfactuals, cyclic/non-Boolean models and non-hard
interventions are outside Phase 2. A later phase needs its own design,
implementation, verification and scoped default-model consensus gate.
Phase 3 has not begun.

## Dropbox handoff and conduct

PROJECT.md, AGENTS.md, README.md, the parent hub and LAPTOP_SETUP.md record this
checkpoint. Source, tests and Markdown review records are in Dropbox. Laptop
sync completion has to be checked on that machine; install dependencies locally.
The fork has independent Git metadata and no remote. Deployment is disabled.

Raw stream journals remain private diagnostics and are excluded from Git.
A first-review participant removed its own transient probe from node_modules,
contrary to the no-deletion instruction; this is disclosed in that transcript.
Neither participant changed/deleted checkout files in the recheck. Their probes
are retained outside the checkout. All owned servers stopped; permanent port
5317 and the original PrSAT 3.0 source were not changed by this phase.
