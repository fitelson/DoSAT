# Codex B1/B2 scoped recheck

Phase gate: PASS. No current blocker remains. I endorse Claude's repaired-implementation PASS. Earlier evaluator core, lifecycle, new-regime mathematics and single-page architecture remain accepted and closed.

## Scope and provenance

Read PROJECT.md, the initial consensus findings, REPAIRS.md, the 27-file source snapshot, release manifest, package probe and Apache verification. Used the existing code-only graph read-only to locate parser/preview/evaluator connections. No source, test, package, deployment or deletion action was performed. Only this report and probe artifacts under /tmp were written.

All 27 source hashes matched before and after execution. Exactly six files differ from the first review snapshot: evaluation syntax and its spec, decision UI and its spec, evaluation UI spec, and browser decision spec. Evaluator and evaluation panel runtime, graph preview, causal parser/compiler and solver remain unchanged.

All eight release files matched manifest size and SHA-256; the in-package manifest equals the review copy. All six public files were fetched from real Apache at http://127.0.0.1:4175/DoSAT/ and matched the package bytes. Root/index returned 200. All five manifest retirement routes returned 301 to https://fitelson.org/DoSAT/. Cross-origin isolation headers, JS/CSS/HTML/WASM MIME types and service-worker scope were confirmed. The private .htaccess files were checked locally, not requested over HTTP.

An isolated Vite build under /tmp reproduced the release's JavaScript, CSS and HTML byte for byte. No prepared package was overwritten.

## B1

The original active source is scanned after comment removal and before either parser call. Every ')' decrements depth and rejects a negative prefix immediately; final depth must equal zero. The fallback's synthetic parentheses can therefore no longer repair a malformed source.

The preview renderer uses this parser. Panel validation clears the preview first, leaves valid=false on rejection, sets aria-invalid=true and disables Evaluate. The click handler independently checks valid. Backend evaluation invokes the same parser before compilation/context creation.

Independent probes rejected eleven malformed inputs, including all three specified triggers and both negative-prefix/net-zero and unfinished-opening cases. Sixteen valid parser cases retained their expected real/constraint kind: observational and Boolean/numeric interventions, conditioning within an intervention regime, arithmetic/free variables/powers, guarded Boolean combinations and parentheses in comments. Syntactically valid undefined expressions still parse.

Using a valid captured model and an instrumented Context constructor, all eleven malformed inputs returned syntax errors with zero backend Context calls. In actual Apache Chromium at 1280 and 320 px, all eleven were invalid, had empty preview/no MathML, disabled Evaluate and empty output. Removing disabled and dispatching click still produced no evaluation/result. Valid recovery was then exercised in each viewport, including an exact first-paragraph equality to "Exact value in this model: 1" rather than a substring check that could accept 1/2.

A zero-support returned model separately preserved real undefinedness and guarded Boolean outcomes: Pr(Y|X) undefined; Pr(Y|do(X)) exactly 1; Pr(Y|X)=1 and its explicit negation both False; their disjunction with Pr(X)=0 True. These are integration checks of unchanged semantics, not a new mathematical audit.

## B2

The graph error classifier now recognizes the parser's "too large" support message. The authoritative parser is unchanged. Apache checks in both viewports covered two unsafe index forms; each was Unsupported with no not-a-DAG label, aria-invalid=true, cleared/hidden SVG and disabled Run. Cycle, self-edge, incomplete arrow, malformed separator, empty and comment-only graphs retained Syntax error: not a DAG. The largest safe index and a normal graph recovered drawing and Run.

I reproduced Claude's optional "too large -> Y" echo-classification edge. The broad string classifier can mislabel this invalid identifier as Unsupported. Its detail remains Invalid causal variable, drawing is cleared and Run is blocked. This does not defeat either required repair, and typed/template-specific errors remain optional polish. PASS does not claim universal correctness of the existing string-based classifier.

## Verification

- TypeScript --noEmit: PASS.
- Five focused specs: 231 PASS.
- Full unit suite: 1316 PASS, one inherited skip and one todo across 33 files.
- Permanent source-app Chromium tests: both new repair regressions and existing cycle-preview regression PASS (3/3), using source port 5173 and temporary output/configuration.
- Independent Apache browser probe: 42 evaluation checks plus 22 graph checks at 1280/320; zero page errors.
- Fresh build and final source/package hash checks: PASS.
- Existing supplied 38-check package record and 93-unique-browser verification record were inspected; I do not claim to have rerun all those browser cases in this scoped recheck.

Probe script, JSON results, temporary build and test configuration/output are preserved at /tmp/dosat-b1b2-codex-20261012T0230/. An initial probe wait used the wrong expected status string; it was corrected to the actual "Evaluated in this model." and the completed rerun passed. No product defect was involved.

Both requested repairs are complete. No bounded repair/test request remains. Publication is outside this participant recheck.

VERDICT: AGREE
