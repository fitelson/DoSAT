CHECKPOINT
elapsed: about 4.0 minutes
tentative_verdict: Phase gate PASS; agree with Claude, no material findings
new_results: NEW: All 16 frozen hashes and 10 unchanged core files verified; only feedback description changed in seven presets; all 8 package hashes and byte counts match; independent rebuild reproduces HTML/JS/CSS; 80 UI unit tests pass; independent package probe 21 cases/45 exact evaluations passes; R1-R3 package lifecycle checks pass at 1280/390/320; captured 57-test isolated and 1318-test full unit reruns and 103-case Chromium report verified.
current_obstruction: none; unchanged-evaluator WASM incident remains documented with unknown cause and no concrete connection to this delta
next_bounded_step: done; owned strict-4173 preview server stopped, return scoped PASS
token_cost: unavailable
END CHECKPOINT

# Scoped repair recheck: Codex

**Phase gate: PASS. VERDICT: AGREE.** No material findings remain in R1-R3 or O1/O2 integration. The original numerical audit and older backend mathematics were not reopened.

## Repairs and regression improvements

- R1: Actual source says “Every causal path from A to Y passes through L, which also confounds B’s effect.” The unchanged graph is `A -> L; L -> B; L -> Y; B -> Y`. Its two directed A-to-Y paths pass through L, and L is a common cause of B and Y. The permanent UI test independently asserts the literal graph, the all-paths phrase, and absence of the old “part of A” wording.
- R2: `setExample(0)` is followed by the exact neutral status reset. Neither refresh nor the successful runtime initialization overwrites it. The unit beforeEach captures the fresh module presentation after import/flush and BEFORE loading savedDecisionFixture(0); the initial-state test asserts the exact neutral message.
- R3: Fresh guidance is explicitly visible and collapsed. The permanent lifecycle test explicitly covers premise editing, Clear, placeholder selection and Load, with reselection restoring guidance between cases. Independent package checks also verify all four hiding cases at 1280/390/320px.
- O1: Browser regressions use `toHaveText(expected)` on `.model-evaluation-value`; the package probe compares its textContent with `===`. Thus a numeric prefix cannot pass as the expected value. Evaluator input edits clear the previous output before evaluating, preventing stale repeated-value matches.
- O2: The positivity check requires exact False, a visible probability-term table, exactly one term row and absence of the actual lowercase undefined marker. The unchanged renderer labels any undefined term “undefined (zero denominator)”. This establishes a defined countermodel result for the sole probability term in this equality.

## Frozen candidate and integration

All 16 frozen source hashes match current files. The eight frozen core files plus pr_sat.ts and parser.ts are byte-identical to b59d782. Package/dependency/configuration and evaluator-test source have no baseline delta. Against the initial candidate snapshot, only examples, UI, UI spec and literature browser spec changed. Comparing the two seven-preset JSON exports finds only feedback's description changed; graphs, numeric premises, recipes and expected values are unchanged.

All eight manifest entries match release bytes and SHA-256. The package manifest equals the review manifest. The seven ordinary build assets match dist, and an independent Vite build into a new temporary folder reproduces the packaged HTML, JS and CSS byte for byte.

Independent checks: UI unit spec 80/80; prepared-package probe 21 cases/45 exact comparisons, no page errors; fresh state, literal feedback wording and edit/Clear/placeholder/Load lifecycle checks at three widths, no page errors. Captured isolated evaluator run is 57/57, captured full unit rerun is 1318 passed with one inherited skip and todo. The captured full Chromium report contains 103 expected, zero unexpected/flaky/skipped.

## Qualifications

The repair-stage full unit attempt's WASM “memory access out of bounds”, then async-call failures (26 failed, 1292 passed), stays documented in REPAIRS.md. Cause remains unknown. The unchanged evaluator spec imports no changed file; the changed UI spec mocks solver/evaluator/runtime initialization, and backend/dependency files are unchanged. The isolated evaluator and full passing reruns plus current package checks provide no concrete delta-specific blocker. No runtime cause or repair is inferred.

REPAIRS.md's “package probe covers the same cases” is broader than that stored probe: the permanent unit test covers edit and Load; stored probe covers fresh state, Clear and placeholder. The independent codex-recheck-lifecycle.log additionally confirms edit and Load in the package. This reporting precision does not leave an R3 repair unresolved.

Evidence: codex-recheck-checkpoints.md, codex-recheck-ui-unit.log, codex-recheck-build.log, codex-build-path.txt, codex-recheck-package-probe.json/.log and codex-recheck-lifecycle.log in this folder. No source edits, deletion, publication, push, model calls or delegation. Owned strict-4173 preview stopped; port 5317 was not used.
