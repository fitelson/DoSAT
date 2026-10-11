# Phase 2 final verification — October 11, 2026

- npm run lint: exit0.
- npm run build: exit0, classical/causal/do-calculus entry pages built.
- Full unit suite:862 passed,1 inherited skipped,1 inherited todo,22 files.
- Headless Chromium:49 passed, serial strict5174 (17 new phase2 browser cases).
- Phase2 focused unit suites:114 pass (31 graph,55 rule,14 independent audit,
  14 interface tests). Final invalid-step save gating UI cases pass.
- Independent graphical comparisons:51,328 (enumeration scope in semantics doc).
- Actual-Z3 phase2 checks:7;five certified inequalities UNSAT,critical Rule3
  descendant-observation counterexample SAT with1/2 vs1,and an uncertified equality
  satisfied by a regular model,showing failure is not universal inequality.
- Long supported node IDs fit actual SVG text bounds in Chromium;edges are
  independently addressable and removed-arrow display is tested.
- Save/load validates inputs,ignores saved verdict claims,and guards stale file
  results/errors. Invalid steps cannot be saved or checked.
- Exported certified equality loads into phase1 and its inequality is UNSAT.
- Phase1 parser/compiler/solver source files exactly match09da858.
- git diff --check: exit0.
- After staging newly added files,full git diff --cached --check reports preserved
  generated/parser-message and verbatim review/captured-output whitespace (exit2).
  Source/config/docs check excluding those original artifacts passes;see final status.
- Code-only Graphify graph regenerated;no paper/prose extraction.
- F1 mobile layout repair:32 browser combinations pass (all seven examples and
  a long-label graph at320/360/390/1280px). No document overflow;diagrams fit
  their sections and scroll internally when needed;desktop columns remain.
- Separate production-build probe:the same32 combinations pass on strict4173
  with zero page errors. Measurements:phase2_repaired_production_probe.json.
  Owned preview server stopped.
- First repaired browser run:48/49 passed,with the new desktop test's incorrect
  box-alignment assumption. Corrected to test grid sections;full rerun49/49.
  Exact failure preserved in PHASE2_DESKTOP_ASSERTION_FAILURE.md.
- The initial consensus approved mathematics/integration but reached FAIL for
  mobile layout. Only runtime repair is the one-line CSS track minimum.
  Scoped default-model consensus recheck PASS;see phase2_recheck_consensus.md.

Current scope is graphical certification WHERE both conditional terms are defined;
numerical definedness is stated,not computed. A failed graphical condition does
not assert that the equality is false. Deployment remains disabled;port5317 and
permanent services were not touched. The required phase2 consensus gate passed.
