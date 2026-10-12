# B1/B2 scoped repair recheck

October 11, 2026. Initial completed audit reached consensus FAIL solely on these two validation/diagnostic issues; the exact evaluator, model fidelity, lifecycle, graph drawing and single-page packaging passed. See ../consensus.md and both detailed round1 reports. No new material disagreement remained.

B1: causal_evaluation_syntax now checks the original active source before its artificial equality wrapper. Running parentheses depth must never be negative and final depth must be zero. This prevents the wrapper from repairing malformed user text. Syntax and panel specs reject Pr(Y)) + (Pr(X), a) * (b and 1) / (0; the panel has aria-invalid=true, empty preview, disabled Evaluate and no callback dispatch. Native Chromium repeats the three rejections, then checks valid Pr(Y)+Pr(X) still evaluates exactly to1 in the countermodel.

B2: the main graph error classifier now treats a too-large node index as unsupported input. The closed graph parser is unchanged. Unit and browser tests use F9007199254740992 -> Y, requiring Unsupported, no not-a-DAG wording, cleared/hidden drawing and disabled Run. Existing cycle/self/malformed diagnostics remain covered. No source evaluator arithmetic, model capture, ownership or cancellation changes were made.

Verification:1,316passing unit tests(one inherited skip/todo each); both new Chromium regressions pass; previous90full pluslegacycase pass(93uniquebrowsercases including new2). TypeScript, lint, build and source whitespace PASS. Refreshed source snapshot27files; original solver/reduction/causalcompiler/parser unchanged. Code-only graph1094nodes2662edges78communities.

Fresh preserved package releases/DoSAT-1.0-2026-10-12T02-00-08-109Z-fea1c519:8files,oneHTML entry. Real local Apache serves copied bytes at http://127.0.0.1:4175/DoSAT/. Root200,5retired301redirects,isolation/worker/MIME headers,byteidentity PASS. 38packagebrowserchecks pass at320/390/1280includingallnineexamples,newmodelqueries,rational/algebraic/free-variable/legacy cases andbothrepairs. Screenshots,manifest and apache-verification.json inthisfolder. Earlier packages/probes preserved. No publication yet. Frozen for recheck.

Optional first-audit polish is unchanged and not part of these repairs. Native exact simplification can be slow; cooperative Cancel awaits settlement and does not promise a physical deadline. No dependency, old-math audit or performance experiment is requested.
