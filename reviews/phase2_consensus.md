# Consensus debate — 2026-10-11 13:02

## Question
Perform the required consensus review of PrSATdo development Phase2 with the skill defaults: Claude Opus5.5/xhigh and GPT6.1Sol/xhigh. This exchange IS the phase review gate. No recursive debates/reviews,other model calls or delegation. Work read-only: no implementation/doc edits,commits,deletions,pushes,deployments or service changes. Necessary checks/probes are allowed; use temporary locations for probes/build artifacts. Browser tests only one process on strict5174; never use the permanent5317 service.

Workspace /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus.
Review baseline09da8582668175078b2bbebc5cef49e1e5d89347 (approved phase1 checkpoint).
Read reviews/PHASE2_DELTA.md,reviews/PHASE2_VERIFICATION.md,reviews/phase2_snapshot.json,DO_CALCULUS_SEMANTICS.md and the Phase2 section of PROJECT.md. Focus ONLY on this phase's changes,new mathematical claims,and integration obligations. Do not reopen unrelated untouched old-code issues. The phase1 parser,CPT compiler and Z3 solver are unchanged; inspect them only where needed to verify the new exports/tests. Earlier code is reference material,not the subject of a general audit.

Phase2 implements a single-step checker for Pearl's Rules1–3 on acyclic graphs of up to6 observed Boolean variables with independent private disturbances. Inputs are pairwise-disjoint assignment groups X,Y,Z,W;Y/Z nonempty,X/W optional. It certifies graphical applicability WHERE both conditional probabilities are defined;it explicitly does not check numerical definedness. Failure leaves an equality uncertified rather than proving it false. NoID/IDC,latent confounding,mixed graphs,cross-world counterfactuals or automated derivation search.

Check the exact rules against primary Pearl Theorem3.4.1. Rule1 uses G_barX;Rule2 G_barX,underlineZ (outgoingZ cut);Rule3 G_barX,barZ(W) with Z(W)=Z minus ancestors(W) computed in G_barX BEFORE the furtherZ surgery. Each checks Y d-separated fromZ given X∪W. Pay special attention to W-descendant conditioning and ancestry after X intervention.

New files: src/causal_graph.ts (+spec),src/do_calculus.ts (+spec),src/do_calculus_audit.spec.ts,src/do_calculus_ui.ts (+spec),src/do_graph_view.ts,src/do_calculus_style.css,do_calculus.html,tests/do_calculus.spec.ts and semantics doc. Integration changes are only a link in src/causal_ui.ts and Vite third entry page,plus project status/instructions. Assess ancestor restriction BEFORE moralization,collider/descendant activation,setwise queries,correct incoming/outgoing cuts,pure source preservation,validation/bounds/canonical indexes,definedness obligations and phase1-compatible formulas/challenge exports,UI stale certificates and asynchronous load races,saved schema/invalid save handling,diagram edge deletion/direction/labels/accessibility,truthful failure wording and test coverage.

Graph certificates record ancestry,moral edges,conditioned nodes and remaining edges. A failure path is expressly in the derived MORAL graph,not asserted to be an active causal DAG path. Diagrams keep original layout positions,highlight removed edges,and support long canonical node names. The checker runs synchronously on small graphs and does not call Z3 itself; exported inequality problems are solved through phase1 guards in the existing model finder.

Candidate verification: lint/build/typecheck pass;862 active unit tests pass with1 inherited skip and1 todo in22 files;45 headless Chromium tests pass (13 new phase2 plus32 retained integration cases),strict5174 serial. Independent audit compares simple active-path enumeration (no moralization) with the graph engine and independently constructs rule surgeries:51,328 graphical comparisons across all64 ordered4-node DAGs,all disjoint role sets,and relabelled/nontopological storage,plus6-node examples. Seven real-Z3 phase2 checks include5 certified inequalities UNSAT, the critical Rule3 descendant-W counterexample SAT with1/2 vs1, and an uncertified equality holding in a regular model. Exact enumeration scope/counts are in semantics doc; these tests complement the cited graph theorem rather than claiming an exhaustive6-node proof.

Preserve/qualify confidence carefully. Check primary reference conditions,oracle independence,coverage at API boundary and zero-probability semantics. Confirm the exported != requires both terms defined and that UNSAT interpretation is stated correctly. Investigate concrete phase2 issues,not speculative old-code repairs. Test failures should be captured precisely before broad repeated runs.

Both participants must return compressed reports at most40000 output tokens and within the runner's conservative40000-UTF8-byte guard,preserving decisive arguments,concrete repros,qualifications,tests actually performed and verdict. Follow runner's complete six-field CHECKPOINT and final VERDICT:AGREE/DISAGREE protocol.
Give explicit **Phase gate: PASS** only if the scoped phase audit is complete and no unresolved material issue remains. FAIL includes material findings or incomplete audit. Consensus on a repair list is not approval to advance. For failures specify bounded repairs and acceptance tests;root will fix/recheck before Phase3. Identify any nonblocking recommendations separately. Phase3 is not requested or reviewed in this exchange.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 25m 07s (2 turns); Codex: 5m 41s (1 turns); total: 30m 48s

## Agreed answer
# Phase 2 review of PrSATdo: single-step do-calculus checker

## Verdict

**Phase gate: FAIL.** One problem remains: on screens 700px wide or narrower, the whole page scrolls sideways when the diagrams should scroll inside their own boxes. A one-line CSS change fixes every case we measured. The rules, graph surgery, d-separation, definedness handling, exported formulas, saving and loading, and the result wording are all correct. If the repair below passes its tests, a scoped recheck should be all that is needed before PASS. Agreeing on this repair list does not approve moving to Phase 3.

## What was verified

### Files and scope
- All 17 files listed in `reviews/phase2_snapshot.json` still match their SHA-256 hashes.
- Two existing files changed relative to the approved Phase 1 checkpoint `09da858`:
  - `src/causal_ui.ts` gained a link to the new page.
  - `vite.config.ts` gained a third entry page.
- The Phase 1 parser, compiler and solver files are byte-identical to `09da858`: `causal.ts`, `causal_syntax.ts`, `z3_integration.ts`, `pr_sat.ts` and `parser.ts`.
- `git diff --check` passes.

### The rules match Pearl's Theorem 3.4.1
Checked against Pearl, *Causality*, Theorem 3.4.1, pp. 85–86. Page 86 begins between Rule 2 and Rule 3, so the page range "85–86" is correct.

| Rule | Equality the code produces | Graph it tests |
|---|---|---|
| 1 | `P(y|do(x),z∧w) = P(y|do(x),w)` | X's incoming arrows removed |
| 2 | `P(y|do(x,z),w) = P(y|do(x),z∧w)` | X's incoming arrows removed, then Z's outgoing arrows removed |
| 3 | `P(y|do(x,z),w) = P(y|do(x),w)` | X's incoming arrows removed, then incoming arrows removed only for the nodes in Z(W) |

- **Z(W):** the code computes it as Z minus the ancestors of W, taken in the graph after the X surgery and before any Z surgery. This matches Pearl's wording: "the set of Z-nodes that are not ancestors of any W-node in G_X̄."
  - The code counts each node as its own ancestor. This is harmless because the groups are disjoint.
  - When W is empty, every Z node is in Z(W).
- **Every rule** tests whether Y is d-separated from all of Z given X∪W. Removed edges are de-duplicated.
- **Inputs are never modified:** surgery builds new edge arrays, and a spec test confirms the original graph is untouched.

### d-separation
- **Method:** the code keeps only the ancestors of the relevant nodes (each node counting as its own ancestor), *then* connects co-parents, removes the conditioned nodes, and searches for a connecting path. This is the criterion in Lauritzen's Proposition 4 (printed p. 13; the related Corollary 1 is on p. 12), so the citation "pp. 12–13" is acceptable.
- **Colliders:** a collider becomes active only when it or one of its descendants is conditioned on, because only then does it enter the restricted graph.
- **Failure certificate:** when separation fails, the reported path is a path in the derived moral graph. The UI labels it "Remaining moral-graph path" and does not present it as an active causal path.
- **Rejected inputs:**
  - overlapping groups, including when one endpoint set is empty
  - names that are not in canonical form
  - unknown or repeated variables
  - an empty Y or Z
  - values that are not Boolean
  - cycles
  - more than 6 nodes
  - input over 4096 characters

### Definedness and zero-probability models
- **Why the rules hold without assuming positivity:** add a root F_Z to the model to represent intervening on Z. The graph condition then implies that Y is independent of F_Z given X, W (and Z where relevant). This holds for every distribution that factorizes over the DAG, so each equality holds wherever the listed evidence probabilities are positive.
- **The listed definedness conditions are the right ones.** Rule 1 also lists `P(w|do x)>0`, which already follows from `P(z∧w|do x)>0`. That is redundant but correct.
- **The exported `lhs != rhs` problem:** Phase 1's `guard_div0_conditions_in_constraint` turns it into "every denominator is nonzero, and lhs ≠ rhs."
  - Probability masses are nonnegative, so "nonzero" means "positive."
  - A SAT result is therefore a counterexample in which both sides are defined.
  - A settled UNSAT result rules out any defined counterexample in the chosen model class.
- The graph certificate does not compute numerical support and does not give values to undefined conditional probabilities. The documentation and UI say exactly this.

### Independent semantic sweep with native Z3
- **Method:** each case ran `check_do_step`, then `counterexampleProblem`, then Phase 1's `parse_causal_document` and `compile_causal_document({regular:false})`, then SMT-LIB to `/usr/local/bin/z3`. The setting `regular:false` allows zero-probability models.
- **Results:**

| Scope | Cases | Certified steps whose inequality is UNSAT | Uncertified steps whose inequality is SAT |
|---|---:|---:|---:|
| All 8 three-node DAGs, every role assignment and value vector, all 3 rules | 4,032 | 2,380/2,380 | 1,652/1,652 |
| All 64 four-node DAGs × 194 role assignments × 3 rules, one value vector each | 37,248 | 19,221/19,221 | 18,027/18,027 |
| Four-node graphs with renamed variables stored out of topological order (about 34% sample) | 12,936 | 6,637/6,637 | 6,299/6,299 |

- No solver returned unknown or timed out.
- All 54,216 results were checked a second time against their case indexes. Nothing was missing and nothing mismatched.
- **Limits of this evidence:**
  - It covers graphs of at most 4 nodes. It supports the cited theorem but does not prove the six-node case exhaustively.
  - "Every tested uncertified step had a counterexample" is an observation. The checker does not claim it, and the UI correctly says an uncertified equality "may still hold."

### The independent audit and mutation testing
- **The audit's oracle is independent of the implementation:**
  - its own reachability function
  - its own arrow-removal function
  - enumeration of simple undirected paths, with collider and descendant tests (Pearl Def. 1.2.3, pp. 16–17)
  - no moralization and no implementation helpers
- **Counts check out:** 4⁴−2·3⁴+2⁴ = 110 and 5⁴−2·4⁴+3⁴ = 194. Then 64·110 = 7,040; 64·194 = 12,416 per rule; 3·12,416 = 37,248; and 2·7,040 + 37,248 = 51,328.
- **Mutation testing (on a temporary copy of `src`):** all five planted bugs were caught.

| Planted bug | Unit tests that failed |
|---|---:|
| Z(W) computed from ancestry in the original graph | 4 |
| No ancestor restriction before moralization | 10 |
| Rule 2 removes Z's incoming arrows instead of outgoing | 6 |
| Rule 3 removes incoming arrows for all of Z | 6 |
| X left out of the conditioning set | 4 |

### Test runs
- `eslint --max-warnings=0` and `tsc --noEmit` both pass.
- A production build to a temporary directory passes, and its asset hashes match those referenced by `dist/do_calculus.html`.
- **Unit tests:** the focused Phase 2 suites give 114 passed (31 graph, 55 rule, 14 audit, 14 interface). The full unit suite gives 862 passed, 1 inherited skip and 1 inherited todo, across 22 files.
- **Browser tests:** Playwright Chromium, run as one serial process on strict port 5174, gives 45/45 passed, including all 13 Phase 2 cases. Port 5174 was released afterward, and port 5317 was never touched.

### UI behaviour
- **No stale results:** every input change, example choice and file load calls `invalidate()`, which bumps the revision, clears the current result, and disables export. The checker runs synchronously, so an out-of-date certificate cannot be shown.
- **File loading:**
  - A token-and-revision guard discards superseded loads and suppresses their late errors.
  - The 100 KB size limit is checked before the file is read.
  - The file's kind, version and rule are checked strictly.
  - Every field goes through `parse_do_step` before any input is replaced.
  - Saved verdict claims are ignored.
- **Saving:** Save is disabled while the input is invalid.
- **Diagrams:**
  - Removed edges are drawn dashed and carry `data-cut`.
  - The modified graph reuses the original layout.
  - Arrowhead marker IDs are unique per render, and arrowheads point at the child.
  - Long canonical names fit inside their boxes.
  - All text is inserted with `textContent`, so there is no injection path.
- **Failure wording** is accurate throughout.

## Blocking finding: the page scrolls sideways on narrow screens

**Location:** `src/do_calculus_style.css:10`, inside `@media (max-width:700px)`, where `.do-assignment-grid, .do-diagrams` use `grid-template-columns: 1fr`.

**Cause:** a plain `1fr` column has an `auto` minimum width, so a fixed-width SVG stretches the column past the screen edge. `.do-graph-scroll` then ends up as wide as the SVG (`clientWidth == scrollWidth`), so its internal scrolling never engages and the whole page scrolls instead. The desktop rule already uses `minmax(0,1fr)` and is unaffected.

**Page width after Check** (`documentElement.scrollWidth`):

| Case | 320px screen | 360px screen | 390px screen |
|---|---:|---:|---:|
| Default example | 342 | 360 (no overflow) | 390 (no overflow) |
| Rule 3 ancestry-after-X example | 551 | 551 | 551 |
| Long-label graph `Z -> Y9007199254740991; Z -> W; W -> Y9007199254740991` | 777 | 777 | 777 |

- Several other built-in examples reach 410px at 360 and 390.
- At 720, 1024 and 1280px the layout is correct.

**Severity:** layout only, with no effect on correctness. It is still in scope: the diagrams are a Phase 2 deliverable, the stylesheet clearly intends a single-column mobile layout, and the root project's own finding (`reviews/PHASE2_ROOT_LAYOUT_FINDING.md`) asked for it to be fixed before closing the phase.

**Fix, already tested by injection:** changing only that line to `grid-template-columns: minmax(0, 1fr)` removed the page overflow for all 7 examples and the long-label graph at 320, 360 and 390px. The diagrams still scrolled inside their boxes, the 1280px layout was unchanged, and no page errors occurred.

The root project's broader proposal also passes and is acceptable but optional:
- `.do-diagrams>section{min-width:0}`
- `.do-graph-scroll{max-width:100%;box-sizing:border-box}`
- `.do-ui select{box-sizing:border-box}`

## Repairs required before PASS

1. **CSS:** in the `@media (max-width:700px)` rule, change `.do-assignment-grid, .do-diagrams` to `grid-template-columns: minmax(0, 1fr)`. The extra containment rules are optional.
2. **Browser regression:** add serial Chromium tests on strict port 5174 at 320, 360 and 390px. Cover all 7 examples plus the long-label graph above. After Check, each case must meet all of these:
   - `document.documentElement.scrollWidth <= window.innerWidth`
   - every `.do-graph-scroll` fits within its parent's width
   - `scrollWidth > clientWidth` whenever the SVG is wider than its box, so scrolling stays inside the box
   - no page errors

   Also add a 1280px sanity check showing the desktop layout is unchanged.
3. **Re-verify:** re-run lint, TypeScript, the build, the full unit suite (862 plus any new tests) and the full Chromium suite (45 plus the new cases), serially on 5174. Then update `reviews/PHASE2_VERIFICATION.md` with the mobile results, refresh `reviews/phase2_snapshot.json`, and get an explicit **PASS** from a scoped consensus recheck before Phase 3.

## Recommendations (not blocking)

1. **Small semantic regression:** keep a quick, complete small-graph check, such as the 3-node sweep of 4,032 cases (about 5 s with native Z3 across 8 processes), or reuse a single WASM solver.
   - Creating a new `WrappedSolver` for every solve inside one vitest process ran out of WASM memory after 221 solves.
   - That is a property of the Phase 1 test harness, not a Phase 2 obligation. The current 7-solve audit is unaffected.
2. **Rule audit on renamed graphs:** run the rule-surgery enumeration on graphs with renamed variables stored out of topological order. At present only the d-separation enumeration does this, although the semantic sweep sampled it.
3. **Diagram accessibility:** both SVGs currently share the label `aria-label="Directed causal graph"`, and `role=img` hides the per-edge `<title>`s. Give the original and modified diagrams distinct labels that list their edges and the removed arrows. Text equivalents already exist elsewhere on the page.
4. **Stale build files:** `dist/assets/doCalculus-BUUT_s_k.js` and `dist/assets/doCalculus-C6THQ9JH.js` are leftovers that nothing references, because the build uses `emptyOutDir:false`. Leave them out of any commit.
5. **Arrowhead colour (cosmetic):** the `fill: context-stroke` arrowheads draw black in older browsers, including on red removed edges.

## Review conduct

- No source or documentation files were edited. All probes, builds and Playwright output went to temporary directories.
- One temporary probe file was placed briefly under `node_modules/` so it could resolve `playwright`. It was deleted after each run and is confirmed gone.
- The files `reviews/PHASE2_ROOT_LAYOUT_FINDING.md`, `PHASE2_PRODUCTION_SMOKE.md` and `phase2_layout_proposal_probe.json` were written by the root project, not by this review.

## Claude  (verdict: DISAGREE, 24m 43s)
CHECKPOINT
elapsed: ~45 min wall-clock
tentative_verdict: Phase gate FAIL, with one bounded in-scope UI repair. The mathematics, the checker, the exports and the tests pass; no mathematical repair is needed.
new_results: NEW: (1) Rules 1–3 match Pearl Thm 3.4.1 (pp. 85–86) word for word. (2) A native-Z3 semantic sweep with zero-probability models allowed covered 54,216 rule instances (all 3-node cases, all 4-node role/rule cases, a relabeled sample). Every certified step's exported `!=` came back UNSAT and every uncertified one SAT. (3) The audit killed all five planted mutants. (4) Lint, TypeScript, build, 862 unit tests and 45/45 Chromium tests pass. (5) I reproduced the root's mobile-overflow finding, and it is wider than reported. A one-line CSS fix resolves every measured case.
current_obstruction: An unresolved in-scope UI defect. At viewports ≤700px the page scrolls sideways instead of the diagrams scrolling inside their boxes (up to 777px of page width at a 390px viewport).
next_bounded_step: Root applies the mobile grid-track fix, adds a narrow-viewport Playwright regression, re-runs the suites, then a scoped recheck.
token_cost: unavailable
END CHECKPOINT

# Phase 2 consensus review (Claude, opening)

## Bottom line
- **Phase gate: FAIL.** One blocker remains: a narrow-viewport layout defect in the new UI. I reproduced it and a bounded fix exists.
- The mathematical core is correct, and I found no other material issue:
  - rules and surgery
  - Z(W)
  - d-separation
  - definedness
  - exported formulas
  - zero-probability semantics
  - async/save/load handling
  - truthful wording
- If the repair below passes its acceptance tests, I expect to support PASS on recheck.

## What I checked

**Integrity**
- All 17 files in `phase2_snapshot.json` match their SHA-256 hashes.
- Comparing against `09da858`, the only tracked source change is `src/causal_ui.ts` (+2/−1, the link). `vite.config.ts` gains a third entry.
- `git diff 09da858` is empty for the Phase 1 sources: `causal.ts`, `causal_syntax.ts`, `z3_integration.ts`, `pr_sat.ts`, `parser.ts`.

**Primary sources** (PDFs downloaded to `/tmp`, text extracted)
- **Pearl Thm 3.4.1:**
  - Rule 1 uses G_X̄; Rule 2 uses G_X̄Z̲; Rule 3 uses G_X̄,Z(W)‾.
  - The text reads "Z(W) is the set of Z-nodes that are not ancestors of any W-node in G_X̄."
  - Page 86 starts between Rule 2 and Rule 3, so "pp. 85–86" is correct.
- **Pearl Def. 1.2.3** (pp. 16–17) matches the audit oracle.
- **Lauritzen:**
  - Prop. 4 (d-separation ⇔ separation in (D_An(A∪B∪S))^m) is on printed p. 13.
  - Corollary 1 (the ancestral-moral directed Markov property) is on p. 12.
  - The citation "pp. 12–13" is acceptable.

**Code against the theorem** (`do_calculus.ts`, `causal_graph.ts`)
- Formulas:
  - Rule 1: lhs `P(y|do(x),z∧w)`, rhs `P(y|do(x),w)`.
  - Rule 2: `P(y|do(x,z),w)` vs `P(y|do(x),z∧w)`.
  - Rule 3: `P(y|do(x,z),w)` vs `P(y|do(x),w)`.
- The conditioning set is X∪W, and Y is tested against all of Z.
- Rule 3: `eligibleZ = Z \ ancestors(graphBarX, W)`, computed before the Z cut. Ancestry is inclusive, which is harmless because the groups are disjoint. With empty W, every Z node is eligible.
- Rule 2 cuts outgoing Z edges after the incoming-X cut. Removed edges are de-duplicated.
- d-separation:
  - Restricts to inclusive ancestors before moralizing, marries parents within that set, then drops conditioned nodes and runs BFS.
  - Disjointness is validated even when an endpoint set is empty.
  - Inputs are not mutated: `mutilate_graph` builds fresh arrays, and the spec mutates the result to prove isolation.
- Validation at the API boundary rejects:
  - noncanonical names
  - unknown or repeated variables
  - overlaps
  - empty Y/Z
  - non-Boolean values
  - cycles
  - more than 6 nodes
  - strings longer than 4096 characters

**Zero-probability semantics**
- Soundness without positivity: in the augmented model with an F_Z root, the d-separation implies Y ⊥ F_Z | X,(Z),W. That independence holds for every distribution that factorizes over the DAG.
- So the equality holds wherever both of these are positive:
  - P(F=f, evidence | do x)
  - the two definedness masses the checker lists
- Those listed masses are exactly the needed obligations. Rule 1 also lists P(w|do x)>0, which follows from P(z∧w|do x)>0; this is redundant but correct.
- Exported `lhs != rhs`: in `pr_sat.ts`, `guard_div0_conditions_in_constraint` wraps a `not_equal` atom as (all denominators ≠ 0) ∧ (lhs ≠ rhs).
- Consequences:
  - A SAT result is a counterexample in which both sides are defined.
  - An UNSAT result with `regular:false` rules out any defined counterexample in the non-strict class.
- The doc and UI wording are correct.

**Semantic sweep** (native `/usr/local/bin/z3`)
- Method: `check_do_step` → `counterexampleProblem` → Phase 1 `parse_causal_document` → `compile_causal_document({regular:false})` → SMT-LIB → native Z3. Scripts and logs are in `/tmp/prsatdo_probe`.
- **3-node:** all 8 ordered DAGs × every disjoint X/Y/Z/W assignment (Y, Z nonempty) × every value vector × 3 rules = 4,032 instances.
  - Certified ⇒ UNSAT in 2,380/2,380 (by rule: 544, 928, 908).
  - Uncertified ⇒ SAT in 1,652/1,652.
- **4-node:** all 64 DAGs × 194 role assignments × 3 rules (37,248), each with one pseudo-random value vector.
  - Certified ⇒ UNSAT in 19,221/19,221.
  - Uncertified ⇒ SAT in 18,027/18,027.
- **4-node relabeled, non-topological storage** (`Z2,X1,W,A` stored as `A,W,X1,Z2`), ~34% sample: 12,936 instances.
  - Certified ⇒ UNSAT in 6,637/6,637.
  - Uncertified ⇒ SAT in 6,299/6,299.
- Zero unknowns or timeouts.
- This exercises, end to end and beyond the 7 shipped Z3 checks:
  - the generated formulas, including negative literals and multi-variable groups
  - export round-tripping
  - the guards
  - soundness with zero-probability models allowed
- Qualification: the sweep only covers n ≤ 4. "Uncertified ⇒ SAT" is an observation, not a claim of the phase, and the UI rightly does not claim it.

**Audit independence and sensitivity**
- The oracle uses its own `reaches`, `remove_incoming`, and an enumeration of simple undirected paths with collider/descendant tests. It uses no moralization and no implementation helpers.
- Arithmetic checks: 4⁴−2·3⁴+2⁴=110, 5⁴−2·4⁴+3⁴=194, 7,040×2+37,248=51,328.
- Mutation run (temporary copy of `src`):

| Mutant | Unit tests killed |
|---|---|
| Z(W) ancestry computed in the original graph | 4 |
| No ancestral restriction before moralizing | 10 |
| Rule 2 cuts incoming instead of outgoing Z edges | 6 |
| Rule 3 cuts all of Z | 6 |
| Conditioning omits X | 4 |

- All five mutants were killed.

**Test runs**
- Focused suites: 114 pass (31 graph / 55 rule / 14 audit / 14 interface), matching the verification report.
- Full unit suite: 862 passed, 1 skipped, 1 todo, 22 files.
- `eslint --max-warnings=0` and `tsc --noEmit` pass.
- `vite build --outDir /tmp/...` passes; its asset hashes are identical to the ones referenced by `dist/do_calculus.html`.
- Playwright Chromium on strict 5174, one serial process with output redirected to `/tmp`: 45/45 pass, including all 13 Phase 2 cases.
- Port 5174 was released afterward. Port 5317 was never touched.

**UI**
- Every input, example and load path calls `invalidate()`, which:
  - bumps `revision`
  - clears `current` and the results
  - disables export
- The checker is synchronous, so no stale certificate can be shown.
- Loading a file:
  - token and revision guards discard superseded loads and suppress stale errors
  - the 100 KB size check runs before the file is read
  - kind, version and rule are checked strictly, and all fields go through `parse_do_step` before any input is replaced
  - saved verdict claims are ignored
- Save is disabled while the input is invalid.
- Diagrams:
  - The original graph shows cut edges dashed, with `data-cut`.
  - The modified graph uses the original layout.
  - Marker IDs are unique per render.
  - Arrowheads sit at the child end.
- All text goes through `textContent`, so there is no injection path.
- Wording is truthful throughout: "not certified … may still hold"; the d-separation path is labeled "Remaining moral-graph path".

## Blocking finding: page-wide horizontal overflow on narrow screens

- **Source:** the root filed this as `reviews/PHASE2_ROOT_LAYOUT_FINDING.md`. I reproduced it independently in headless Chromium on a dev server on 5174 (probe in `/tmp/prsatdo_layout`).
- **Measurements:** document `scrollWidth` after Check, with the current CSS:
  - **390px:** examples 1, 4 and 6 give 410. Example 5 (Rule 3 ancestry-after-X) gives **551**. A long-label graph (`Z -> Y9007199254740991; Z -> W; W -> Y9007199254740991`) gives **777**.
  - **360px:** the same widths.
  - **320px:** even the default example gives 342.
- **Effect:** `.do-graph-scroll` reports clientWidth == scrollWidth == the SVG's width, so the intended scrolling inside the diagram box never engages. The whole page scrolls sideways instead.
- **Desktop and tablet** (720, 1024, 1280) are fine: the containers clip and scroll as designed.
- **Root cause:** the `@media (max-width:700px)` rule sets `grid-template-columns: 1fr`. A plain `1fr` track has an `auto` minimum, so the fixed-width SVG forces the track wider than the screen. The desktop rule uses `minmax(0,1fr)` and is not affected.
- **Severity:** layout only; no correctness impact. It is still in scope:
  - the diagrams are a Phase 2 deliverable
  - the stylesheet explicitly intends a single-column mobile layout
  - the root asked for this to be resolved before closure

**Bounded repair**
- In `src/do_calculus_style.css`, change the mobile rule to `grid-template-columns: minmax(0, 1fr)`.
- I verified that this one-line change gives document width equal to the viewport for all 8 cases at both 390 and 320, with the diagrams scrolling inside their boxes.
- The root's broader CSS also passes at 390, 360 and 320:
  - `.do-diagrams>section{min-width:0}`
  - `.do-graph-scroll{max-width:100%;box-sizing:border-box}`
  - `.do-ui select{box-sizing:border-box}`
- Either version is acceptable.

**Acceptance tests**
1. Add a Playwright case at viewports 320, 360 and 390. For each of the 7 examples plus the long-label graph, after Check:
   - `documentElement.scrollWidth <= innerWidth`
   - each `.do-graph-scroll` has `clientWidth <=` its parent's width
   - when the SVG is wider than its box, `scrollWidth > clientWidth`
   - no page errors
2. Add a desktop (1280) sanity check showing the layout is unchanged.
3. Re-run, serially on strict 5174:
   - lint, TypeScript and build
   - the full unit suite (expect 862 plus any new tests)
   - the full Chromium suite (45 plus the new cases)
4. Update `PHASE2_VERIFICATION.md` with the mobile results and refresh the snapshot hashes.

## Nonblocking recommendations
1. **Small-graph semantic regression:** keep a fast regression like my 3-node sweep (4,032 instances, about 5 seconds with native Z3 on 8 processes), or reuse one WASM solver.
   - Harness note: creating a `new WrappedSolver(z3, init_z3)` per solve in one vitest process aborted with a Z3-WASM out-of-memory error after 221 solves.
   - This is a Phase 1 harness property. The current 7-solve audit is unaffected.
2. **Rule-checker enumeration order:** the rule enumeration uses topological storage order only; only d-separation has the relabeled test. Add a relabeled/non-topological rule enumeration. My sample covered it semantically.
3. **SVG accessibility:** both SVGs have the same `aria-label` ("Directed causal graph"), and `role=img` hides the edge `<title>`s. Give each diagram a distinct label that lists its edges and the removed arrows. Text equivalents do already exist elsewhere on the page.
4. **Stale build assets:** `dist/assets/doCalculus-BUUT_s_k.js` and `doCalculus-C6THQ9JH.js` are left over from earlier builds (`emptyOutDir:false`) and nothing references them. Don't commit them.
5. **Arrowhead colour:** the marker uses `fill: context-stroke`. Older engines draw black arrowheads, including on red cut edges. Cosmetic.

## Read-only note
I made no source or doc edits. Probes, builds and Playwright output went to `/tmp`. To let one Node probe resolve `playwright`, I briefly placed it as `node_modules/.prsatdo_probe.mjs` and deleted it after each run; it is confirmed gone. The new `reviews/` files (`PHASE2_ROOT_LAYOUT_FINDING.md`, `PHASE2_PRODUCTION_SMOKE.md`, `phase2_layout_proposal_probe.json`) were written by the root, not by me. The snapshot hashes still match.

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 5m 41s)
CHECKPOINT
elapsed: approximately 10 minutes this response
tentative_verdict: AGREE with Phase gate FAIL for the single responsive-layout defect
new_results: NEW: Independently reproduced the overflow and verified the one-line CSS proposal across 32 browser cases; 114 focused tests, lint, TypeScript and a temporary production build pass. Verified all 54,216 peer native-Z3 results against their indexes, with no missing results or mismatches.
current_obstruction: The reviewed source still contains the defective mobile grid track.
next_bounded_step: Root applies the bounded repair, adds responsive browser regressions, verifies the repaired snapshot and obtains a scoped consensus recheck.
token_cost: unavailable
END CHECKPOINT

I agree with your substantive findings. **Phase gate: FAIL**, with one required layout repair. No mathematical repair is indicated.

The implemented conditions match [Pearl’s Theorem 3.4.1, pp. 85–86](https://web.cs.ucla.edu/~kaoru/CAUSALITY-REPRINTED-W-CORRECTIONS-2013/causality-ch3-june2013.pdf): incoming-X removal for all rules, outgoing-Z removal for Rule 2, and incoming removal only for Rule 3’s eligible Z nodes. Eligibility is computed using W ancestry **after the X surgery and before the Z surgery**. Every rule tests Y against the whole Z group, conditioned on X∪W.

The d-separation implementation restricts to inclusive ancestors before moralization, then removes conditioned nodes and checks connectivity, as required by [Lauritzen’s Proposition 4](https://people.csail.mit.edu/tdanford/discovering-causal-graphs-papers/lauritzen-causal-inference-graphical-models.pdf). The audit oracle independently enumerates paths and tests collider activation using forward reachability. Its enumeration counts and stated scope are accurate.

I also endorse the definedness interpretation. The exported `!=` atom receives denominator guards after causal substitution, requiring both probability expressions to be defined. With nonnegative probability masses, those nonzero guards enforce positive evidence mass. SAT supplies a defined counterexample; settled UNSAT excludes defined counterexamples in the selected model class. Graphical certification neither evaluates numerical support nor assigns values to undefined conditionals.

I independently reproduced the blocker in [src/do_calculus_style.css:10](/Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/src/do_calculus_style.css:10):

| Viewport | Default example | Ancestry-after-X example | Long-label graph |
|---|---:|---:|---:|
| 320px | 342px document width | 551px | 777px |
| 360px | 360px | 551px | 777px |
| 390px | 390px | 551px | 777px |

Injecting only `grid-template-columns: minmax(0, 1fr)` into the mobile rule eliminated document overflow for all seven examples and the long-label graph at all three narrow widths. Diagram scrolling remained contained; the eight 1280px cases were unchanged. No page errors occurred. Measurements are preserved in [layout.json](/var/folders/h1/jv_lt9bj42dgghwf8b3khjpw0000gn/T/prsatdo-codex-reply-IV0zgX/layout.json).

The required repair and acceptance criteria are therefore bounded:

1. Replace the mobile `1fr` track with `minmax(0, 1fr)`. Your additional containment styles are optional if the minimal change passes.
2. Add serial Chromium regressions at 320, 360 and 390px covering all examples and the long-label graph: no document overflow, contained diagram widths, internal scrolling when needed, and no page errors. Include a 1280px sanity check.
3. Verify the repaired candidate, refresh its snapshot and verification record, and obtain an explicit consensus PASS on recheck.

Two confidence qualifications remain appropriate. Your 54,216 semantic checks supplement the theorem; they do not establish an exhaustive six-node result. Likewise, “every tested uncertified instance admitted a counterexample” remains an experimental observation, rather than a guarantee made by the checker.

Distinct diagram accessibility descriptions and relabeled rule-surgery regressions remain nonblocking recommendations. The experimental WASM harness exhaustion does not create a Phase 2 repair obligation.

My checks were read-only for project files. All 17 snapshot hashes still match, the five relevant Phase 1 source files match `09da858`, and `git diff --check` passes. Browser work used one headless process on strict 5174, which was released afterward; port 5317 was untouched. I did not independently rerun your full 862-test or 45-case suites.

VERDICT: AGREE

## Claude  (verdict: AGREE, 24s)
CHECKPOINT
elapsed: ~50 min cumulative (~5 min this turn)
tentative_verdict: Codex and I agree that Phase gate is FAIL because of one bounded responsive-layout repair; the mathematics needs no repair.
new_results: NEW: Codex's narrow-viewport measurements reproduce my overflow figures and its full-index check of my native-Z3 outcomes, so we now have two independent confirmations. I ran no new probes this turn; no material disagreement is left.
current_obstruction: The reviewed source still has the `1fr` mobile grid track in `src/do_calculus_style.css`, and it stays unrepaired until the root fixes it.
next_bounded_step: done for this round. The root applies the repair, adds the regression tests, refreshes the snapshot and verification record, and asks for a scoped recheck.
token_cost: unavailable
END CHECKPOINT

## Consensus: **Phase gate: FAIL**, with a single bounded repair

**Where we agree**
- **Rules match Pearl's theorem.** All three rules match Pearl Theorem 3.4.1 (pp. 85–86):
  - Every rule removes arrows into X.
  - Rule 2 also removes arrows out of Z.
  - Rule 3 removes arrows into Z only for the nodes in Z(W). Z(W) is computed from W's ancestry after the X surgery and before any Z surgery.
  - Every rule tests whether Y is d-separated from all of Z given X∪W.
- **d-separation is implemented correctly.** It first restricts to ancestors, then moralizes, removes the conditioned nodes, and checks connectivity, as in Lauritzen Proposition 4.
- **The audit's path oracle is independent of the implementation.** Its counts (7,040 / 12,416 / 37,248 / 51,328) and its stated scope are accurate.
- **Definedness is handled correctly.** Phase 1 guards each side of the exported `lhs != rhs`. A SAT result is a counterexample in which both sides are defined. A settled UNSAT result rules out any defined counterexample in the chosen model class. The graphical certificate neither evaluates numerical support nor assigns values to undefined conditionals, and the documentation says so accurately.
- **The UI behaves correctly apart from layout.** Invalidation, async load races, the save/load schema, the gating of invalid saves, and the failure wording all hold up.
- **The one blocker** is in the mobile media query, `src/do_calculus_style.css:10`:
  - The single-column track is `1fr`, which has an `auto` minimum. The fixed-width SVG therefore widens the track, so the whole page scrolls sideways instead of the diagram box scrolling.
  - Codex and I independently measured the same widths:

    | Case | 320px viewport | 360px viewport | 390px viewport |
    |---|---|---|---|
    | Default example | 342px | no overflow | no overflow |
    | Ancestry-after-X example | 551px | 551px | 551px |
    | Long-label graph | 777px | 777px | 777px |

  - Changing the track to `minmax(0, 1fr)` fixes every measured case, keeps the diagram scrolling inside its box, and leaves the 1280px layout unchanged.

**Refinements**
- In my opening, "360px: the same widths" meant examples 1, 4, 5, 6 and the long-label graph. At 360px the default example does not overflow, as Codex's table shows. This does not change the finding.
- The extra CSS rules (`min-width:0` on the diagram sections, `max-width:100%` on the scroll containers, and `box-sizing` on the selects) were the root's proposal, not mine. Both of us agree they are optional if the one-line fix passes.
- On test coverage, the two sets of runs complement each other:
  - I ran the full unit suite (862 passed, 1 skipped, 1 todo) and the full Chromium suite (45/45, serial, strict 5174).
  - Codex ran the 114 focused tests, lint, TypeScript and a temporary build, and checked all 54,216 Z3 outcomes against their indexes.
- I accept Codex's two qualifications on confidence:
  - The 54,216 semantic checks cover graphs of at most 4 nodes. They support the theorem but do not prove the six-node case exhaustively.
  - "Every tested uncertified instance had a counterexample" is an observation from the tests. The checker does not promise it.

**Required repair and acceptance tests**
1. In the `@media (max-width:700px)` rule, change `.do-assignment-grid, .do-diagrams` to `grid-template-columns: minmax(0, 1fr)`. The containment rules are optional.
2. Add serial Chromium tests on strict 5174 at 320, 360 and 390px. Cover all 7 examples plus a long-label graph, such as `Z -> Y9007199254740991; Z -> W; W -> Y9007199254740991`. After Check, each case must satisfy:
   - `documentElement.scrollWidth <= innerWidth`;
   - each `.do-graph-scroll` fits inside its parent;
   - `scrollWidth > clientWidth` whenever the SVG is wider than its box;
   - no page errors.

   Add one 1280px sanity case.
3. Re-run lint, TypeScript, the build, the full unit suite and the full Chromium suite. Then update `PHASE2_VERIFICATION.md`, refresh `phase2_snapshot.json`, and get an explicit PASS from a scoped consensus recheck. Agreeing on this repair list does not approve advancing to Phase 3.

**Nonblocking recommendations** (both of us)
- Add a small exhaustive semantic regression, for example the 3-node sweep of 4,032 instances. Use native Z3 or a single reused WASM solver; creating a new WASM solver for every solve in one process ran out of memory after 221 solves. That is a Phase 1 harness property, not a Phase 2 obligation.
- Run the rule-surgery enumeration on relabeled, non-topologically ordered graphs too.
- Give the original and modified diagrams distinct `aria-label`s that list their edges and the removed arrows.
- Exclude the unreferenced stale `dist/assets/doCalculus-BUUT_s_k.js` and `doCalculus-C6THQ9JH.js` from any commit.
- The `context-stroke` arrowhead colour falls back in older browsers; this is cosmetic.

VERDICT: AGREE

