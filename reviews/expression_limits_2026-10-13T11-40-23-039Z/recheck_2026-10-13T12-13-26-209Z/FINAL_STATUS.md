# Expression-limit phase: PASS

The completed default Opus5.5/xhigh–GPT6.1Sol/xhigh repair recheck gives explicit Phase gate: PASS. R1–R4 are closed; the initial FAIL is historical and was not published. Source and final eight-file package hashes still match the frozen candidate.

Limits:2048 tokens per constraint/expression;128 probability occurrences per document, shared with compiler API. Other bounds and mathematical/solver/evaluator semantics are unchanged. The original17-clause goal (770tokens/67queries) is accepted and ENTAILED with Regular off, including Pr(U)=0. Zero-support premises are SAT; a false appended clause produces a countermodel.

Verification:1374 unit tests pass, one inherited skip and todo;68 public Chromium cases pass;lint,TypeScript/build and whitespace pass. Actual package passes12 verdict checks across320/390/1280px, token/query overflows and prefix rejection/toggle/recovery, with no page errors or overflow. The malformed2045-minus regression is rejected promptly; the package rejection/toggle measurement is1.32ms.

Qualification:validation is synchronous, and a contrived accepted nested line measured about4.7s in independent Chromium probes. This is not a universal upper bound. The reviewers accept this residual within the agreed repair scope; later debounce/worker work is optional. No guarantee of universally fast parsing is made.

Source delivery/publication is recorded in PUBLICATION.md after completion. Raw journals and unselected diagnostics remain private; old files and bundles are retained.
