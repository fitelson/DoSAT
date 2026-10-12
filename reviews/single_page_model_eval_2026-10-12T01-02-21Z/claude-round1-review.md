# Claude round-1 review — single-page DoSAT, DAG preview, fixed-model evaluation

Date: 2026-10-11 (America/New_York). Read-only review; there were no source, test, or package edits. Scratch probes were in /tmp/dosat_probe only.

## Tentative gate: FAIL. Two small blockers need a bounded repair and a recheck.

### B1. The evaluation parser accepts non-wffs through the artificial-equality wrapper
- Location: `src/causal_evaluation_syntax.ts:22`, which runs `parse_causal_document(graph, \`(${active}) = 0\`)` after the direct constraint parse fails.
- Trigger: `Pr(Y)) + (Pr(X)` or `a) * (b`. The direct parse fails on the unbalanced parentheses. The wrapper then supplies the missing outer parentheses, so the result parses as `equal` and passes the tag check.
- Verified in the real package (http://127.0.0.1:4175/DoSAT/, example 1 countermodel). `aria-invalid=false`, the preview shows `Pr(Y)+Pr(X)`, Evaluate is enabled, and the result is "Exact value in this model: 1". With a unit kernel, `Pr(X)) + (Pr(Y)` gives 41/63 and `a) * (b` gives 0.
- Impact: malformed text is presented as a valid expression and evaluated. That contradicts the claim that "the authoritative causal parser reads one active real expression", and it breaks the family's "Syntax error (not a wff)" contract.
  - The impact is limited. The value always matches the displayed preview.
  - Constraint-level injection is blocked by the `tag === 'equal'` check. I confirmed that the disjunction, conjunction and chained-equality forms are rejected.
- Bounded fix: before wrapping, reject `active` unless its parentheses are balanced and the running depth never goes negative. The wrapper's outer parentheses then enclose exactly `active`.
- Tests:
  - The syntax spec should reject `Pr(Y)) + (Pr(X)`, `a) * (b` and `1) / (0`.
  - The UI spec should show `aria-invalid=true`, a disabled Evaluate button and no preview.

### B2. A support limit is labelled "Syntax error: not a DAG"
- Location: `src/causal_decision_ui.ts:86`. The substring classifier treats only `At most` and `limited to` as unsupported input.
- Trigger: the graph `F9007199254740992 -> Y`. The variable name matches the grammar `[A-Z](?:[1-9][0-9]*)?`, but its index exceeds `Number.MAX_SAFE_INTEGER`.
- Verified in the package UI. The message reads `Graph: Syntax error: not a DAG. Graph line 1: The index in causal variable "F9007199254740992" is too large.`
- Impact: this directly violates the gate criterion "no wrong not-a-DAG claim for support limits". There is no soundness impact, because Run stays blocked either way.
- Bounded fix: also classify `too large` as unsupported input. A more robust alternative is positive classification: label only cycle, self-edge, grammar and empty-graph messages as not-a-DAG.
- Test: next to the six-node test in `causal_decision_ui.spec.ts`, assert /unsupported/i and the absence of "not a DAG".

## Optional / later polish (non-blocking)
- P1. Evaluation has no native interrupt or time bound.
  - Trigger: `(Pr(X)+Pr(Y))^1024` with an algebraic kernel (X = 1/√2). It ran for more than 90 s in Node and was killed; `^128` takes about 1 s. Rational kernels are fast (65 ms).
  - Effect: Cancel waits for the native call to settle, and the main Run stays disabled until then. Reloading the page is the only recovery.
  - This is documented ("Native interruption speed is not promised") and matches the solver's Off-mode posture.
  - Options: interrupt on abort (check that the context is still usable afterwards), compute powers by squaring, or add a soft evaluation time limit.
- P2. Large rationals display as raw s-expressions. Z3's `.sexpr()` wraps lines (`(/ 1.0\n   1340…096.0)`), so `format_exact_value` falls back to the raw form. The value is still exact; the fix is to normalise whitespace before formatting.
- P3. The `.htaccess` immutable-cache rule matches only `^index-…`, so the `dosat-*` hashed assets get no immutable caching. This is harmless and the naming drift predates this delta.
- P4. `dist/` is tracked and still contains stale `causal.html`, `decision.html` and `do_calculus.html`, because `emptyOutDir:false` keeps old build output. The release crawl from index.html excludes them. Deploy is disabled, but the stale pages are misleading if someone uploads `dist/` directly.
- P5. An empty graph is labelled "Syntax error: not a DAG". This is a deliberate, tested design choice; "A causal graph is required" would be more accurate.
- P6. Long-span arcs pass just above intermediate nodes. This is the existing layout, and the edges stayed distinguishable in the triangle, chain and diamond renders.
- P7. Two unit tests are timing-sensitive: `causal_decision_solver.spec` (six-node cancellation) and `z3_integration.spec` (cancel within timeout). They fail when two suites run concurrently and once failed in an isolated run. Neither file is in this delta; the suite passed 1309/1309 in 4 of 5 isolated runs.
- P8. Pressing Enter in the evaluation input does not run the evaluation.

## Verified PASS areas (independent evidence)
- Source snapshot: all 27 hashes match, and the approved decision solver/reduction and compiler/parser are unchanged. tsc and eslint pass on the delta, and the unit suite passes (1309, with 1 skip and 1 todo).
- Exact fidelity: I checked algebraic results by hand.
  - 1/Pr(X) = √2. Pr(X)/Pr(Y|do X) = √(3/2).
  - Pr(Y) = 1/√6 + 1/3 − 1/(3√2), which is a root of 81x⁴−108x³+18x²+12x−2 (≈0.50588).
  - b^-3 = √8; 1/b + 1/3 is a root of 9x²−6x−17; Pr(X)^1024 = 2^-512.
  - Rationals and decimal spellings are exact, and no floating-point conversion happens.
- Structural CPT mapping: mechanisms are keyed by the parent assignment in the order of the graph nodes, not by parameter spelling.
  - Reordered graphs and rows, user names that collide with internal names, and off-support interventions all work.
  - New regimes are compiled by the approved compiler, with intervened factors omitted and parameters shared.
- Free variables: names not in the snapshot are rejected with "Unassigned"; there is no completion. Snapshot values come from the solver's own `compiled.causal.variables`.
- Definedness:
  - Real-valued results are strict: any guard that does not reduce to literal true gives undefined. I checked `(1/a)*0`, `b/b`, `(a-a)^-2` and `Pr(Y|do(~Y),Y)`.
  - Constraints use the compiler's guarded constraint (the last element; bounds come first), giving scoped True/False. For example, `1/a=2` and `~(1/a=2)` are both False.
- Grammar and injection:
  - The exact-value grammar accepts only rationals and `root-obj` over x with degree/size/depth/token bounds. `(ite…)`, `0)) (assert false)` and names are rejected.
  - The compiler's `check_expanded_size` stops nested powers.
- Native lifecycle:
  - The parser Solver is released in a finally block, with no `check()` or `model()` call.
  - Extracted ASTs hold their own references. One lazy context is used.
  - `simplify` is not mutex-wrapped in z3-solver 5.2.0. The UI's busy gating prevents overlap with solver work.
- Cancellation and staleness: the generation, evaluator-identity and hidden guards hold; busy is released only after settlement; the final accept checks abort.
  - Problem edits, Load, Examples and Run all clear the panel and abort the evaluation, and Run stays blocked until settlement.
- End-to-end check in the package:
  - In the example 1 and 2 countermodels and the example 5 SAT model, every original premise evaluates True and each conclusion False. Example 2's conclusion is False through a guarded undefined term.
  - The witness HTML and verdict are unchanged after the evaluations.
- DAG preview:
  - Node and edge sets are exact, and markers have unique IDs.
  - The crop includes the ellipses and quadratic control hulls, plus an 8 px margin that covers the arrowheads.
  - The preview is cached, is a keyboard-scroll region, and is hidden for cycles, malformed input and limits. The six-node limit is labelled "Unsupported" (B2 is the exception).
- Package:
  - The live Apache server serves bytes identical to manifest b3ecf6ee: 8 files, 1 HTML.
  - Root and index.html return 200 with COOP/COEP and no-cache. The WASM MIME type is correct, and `Service-Worker-Allowed` is set on the worker.
  - All five retired routes (and the root-level variants) return 301 to https://fitelson.org/DoSAT/, with query strings preserved. There is no index.html loop.
- Legacy import: the `{version:1, graph, constraints, regular}` format is shared by model-finder saves and rule-checker counterexample exports. Both import as SAT problems, and validation happens before any mutation.
