# Claude round-1 review: DoSAT literature presets (delta from b59d782)

Phase gate (Claude, round 1): FAIL — bounded repair list R1–R3 below.

## Verified
- Frozen hashes: all 8 changed/new files and all 8 unchanged-core files match source-snapshot.json; `git diff b59d782` touches no core file.
- Menu = Berkson, M-bias, bias amplification, treatment–confounder feedback, front-door, positivity, Simpson. Simpson's task/graph/premises/conclusion/Regular are byte-identical to baseline.
- Legacy fixtures (tests/fixtures/decision_problems.ts) are textually identical to the nine removed baseline menu entries; e2e/unit tests now load them via JSON Load.
- Math, own Fraction script + hand derivation: all 15 values; Simpson 63/77 vs 75/65.
  Every SAT kernel is fully determined by its premises (each CPT entry stated; every parent configuration has positive mass, including Berkson's (x,y) cells at 1/4), so every displayed value is model-independent (entailed), not just a returned-model value.
- App-level (real Z3, node; claude-preset-check.spec.ts/.log): statuses sat×5 / not-entailed / entailed; all 15 evaluator outputs strictly equal the displayed strings; every probability term defined.
  Positivity: countermodel Pr(Y|do(X)) = 1, defined; premises + Pr(Y|do(X))=0 and =1 both SAT (non-identification); Regular on → inconsistent-premises (vacuous), so Regular off is required. Berkson with Regular on → UNSAT, as the description says.
- Guide lifecycle (jsdom; claude-guide-check.spec.ts/.log): default Berkson is SAT with Regular off, and its guide is visible but collapsed. Clear, the placeholder, Load and edits all hide it; evaluator edits preserve it; `[hidden]` is enforced by `display:none !important`.
- Links resolve: r350 (Berkson l.537, Simpson, front-door as §3.3.2 'mediating instrumental variable'), What If, arXiv 1408.0324 (Ding–Miratrix), PMLR r8/pearl10b (Pearl, bias-amplifying variables).
- Package: 8 manifest files, all sha256/bytes match; bundle contains current preset text (so any repair needs a rebuilt package).

## Repairs
R1 (material, teaching accuracy). src/causal_decision_examples.ts:55, feedback description: "L mediates part of A’s effect". Graph `A -> L; L -> B; L -> Y; B -> Y` has no A->Y (or A->B) edge; both causal paths A→L→Y and A→L→B→Y pass through L, so L mediates ALL of A's effect. Contrast front-door text, which correctly says "entire". Repair: reword (e.g. "Every causal path from A to Y passes through L, which also confounds B’s effect"), or add A -> Y with recomputed values. Recheck: rebuild, the audit stays unchanged under a wording-only fix, and repackage.
R2 (minor regression, first default). src/causal_decision_ui.ts:264. setExample(0) calls invalidate(), so a pristine page load reads "Input changed; decide the current problem." (baseline: "Choose a decision problem."). Repair: restore a neutral initial status after the startup setExample(0); add a unit assertion on the fresh-import status.
R3 (coverage). The claimed hiding on Clear and placeholder selection, and initial-guide visibility, have no regression test (unit test covers edit + Load only). Repair: add three assertions to the existing jsdom test (behaviour already correct per my check).

## Optional
O1 e2e/probe use substring matching (toContainText/includes): "-1/2" accepts "-1/24", "1/5" accepts "1/50". Prefer exact match on `.model-evaluation-value`.
O2 Positivity recipe checks only "False", and the panel help says False may reflect undefinedness; assert the term table shows a defined Pr(Y | do(X)), or add `Pr(Y | do(X))` as a "solver-chosen, not 1/2" recipe.
O3 Front-door source: Pearl 1995 Biometrika / Causality §3.3.2 is more canonical than r350.
O4 Time-limit/mode toggles also hide the guide (inherited invalidate resets the selection), even though the problem is unchanged.
O5 Feedback "joint treatment contrast": consider naming the g-formula Σ_l P(Y|a,b,l)P(l|a) = 3/4 vs 1/4.
