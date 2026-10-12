# Claude scoped B1/B2 recheck (2026-10-11)

**Phase gate: PASS.** No current blockers. Probe scripts are in `/tmp/dosat-b1b2-claude/`, outside the repository. I made no source, test or package edits.

## Provenance
- All 27 source-snapshot hashes match, both before and after my runs. Against the first-audit snapshot, exactly 6 files changed: `causal_evaluation_syntax.ts` and its spec, `causal_decision_ui.ts` and its spec, `causal_evaluation_ui.spec.ts`, and `tests/causal_decision.spec.ts`. The evaluator and panel runtime (`causal_model_evaluator.ts`, `causal_evaluation_ui.ts`), the graph preview, `causal_syntax.ts`, `causal.ts` and the solver are byte-identical to the original snapshot.
- Release `fea1c519` has 8 manifest files plus the manifest itself. Every size and SHA-256 matches, and the in-package manifest is byte-identical to the review copy.
- I rebuilt the frozen source with `vite build --outDir /tmp/...`. It reproduces `dosat-BICYPzhr.js` (570d1353…), `dosat-t4OSGF_A.css` and `index.html` byte-for-byte.
- Apache on 4175 serves bytes identical to the manifest for every non-`.htaccess` file.
  - Root returns 200, and the 5 retired routes return 301 to `https://fitelson.org/DoSAT/`.
  - The wasm and worker have the expected COOP/COEP/CORP headers, MIME types and `Service-Worker-Allowed`.
  - Qualification: the Apache temp docroot also holds two stale, unreferenced bundles (`dosat-CXlEYkTM.js`, `dosat-bE50lwpQ.js`). `index.html` loads only the new bundle, so served behaviour equals the package. This is not blocking.

## B1 (`causal_evaluation_syntax.ts:17-23`)
- The parser scans the original `active` text after comment stripping and before any parse. It rejects depth < 0 and a final depth ≠ 0, and it runs before both the direct parse and the `(${active}) = 0` wrapper.
- The preview (`render_causal_evaluation`) and the backend (`causal_model_evaluator.evaluate`, which parses before creating the Z3 context) share this one parser. Malformed text therefore cannot reach Z3.
- Probes:
  - 11 malformed inputs all throw the unbalanced-parentheses error. 7 of them were accepted by a reconstruction of the pre-repair function.
  - 16 valid inputs keep the same kind: real, constraint, do, `do(X), Z`, conditional/guarded, free variables, a power, and a trailing `#` comment containing `)`.
  - Fuzz test: 40,000 random token strings. On every well-parenthesized input, new behaviour equals old behaviour; every other input is rejected. 22 unbalanced inputs that the old code accepted are now rejected.
- Apache Chromium, at 1280 and 320 px:
  - All 8 malformed inputs show `aria-invalid=true`, a disabled Evaluate button and an empty preview with no `<math>` element.
  - A forced handler click (with `disabled` removed) yields no result, and the status stays at "Fix the evaluation expression…".
  - 8 valid inputs evaluate exactly: 1, 1/2, 1/2, 3/4, False, True, 1 and 1. There are no page errors.

## B2 (`causal_decision_ui.ts:86`)
- `too large` has been added to the Unsupported classifier. The closed parser is unchanged.
- In Chromium, `F9007199254740992 -> Y` and `X -> F99999999999999999999` show "Graph: Unsupported input…". In both cases the drawing goes from a visible SVG to hidden with no SVG, Run is disabled and `aria-invalid=true`.
- The cycle, self-edge, `X ->`, `X _ Y`, empty and comment-only cases keep "Syntax error: not a DAG".
- The safe maximum `F9007199254740991` still draws, and restoring the original graph re-enables Run.

## Tests
- `tsc` passes.
- The full unit suite gives 1316 passed, 1 skipped and 1 todo.
- The 5 affected specs give 216/216.
- The two new Chromium regressions and the existing cycle-preview test pass on the source dev server (loopback 5174, list reporter, output in /tmp).

## Optional polish (not blocking)
1. **Text echoed back from user input can trip the string classifier.** `too large -> Y` and `At most -> Y` are labelled "Unsupported input". The detail still correctly reads "Invalid causal variable…", Run stays disabled, and no verdict is affected. "At most" and "limited to" already worked this way at the first audit, and that audit deferred typed classification. A bounded later fix is a typed error code, or matching only the parser's own message templates.
2. **One browser assertion is loose.** `toContainText('Exact value in this model: 1')` would also match `1/2`. The actual output is exactly 1.
3. **`emptyOutDir: false` leaves stale bundles.** Old bundles remain in `dist/` and in the Apache temp docroot. Release packaging is clean.
