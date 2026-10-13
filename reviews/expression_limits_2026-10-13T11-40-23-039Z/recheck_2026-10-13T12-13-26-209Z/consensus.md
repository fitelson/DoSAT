# Consensus debate — 2026-10-13 08:33

## Question
Recheck the final bounded R1–R4 repair of DoSAT's expression-limit phase. Give explicit Phase gate: PASS or FAIL. The prior completed review ../consensus.md agreed FAIL because malformed minus chains at the larger token limit blocked synchronous validation for9s. All other functional aspects were approved.

Workspace:/Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus
Current frozen snapshot:source-snapshot.json. Full delta from80f6a16:change.diff, plus tests/fixtures/independence_conclusion.ts. REPAIRS.md and package-probe.json record verification.

Final runtime change: lexical token limit2048, shared probability cap128; fast token-based scan bounds prefix ancestors at128, carries prefixes through parentheses, treats probability event roots separately, excludes infix subtraction, arrow and != syntax. Shared AST depth value remains128; existing compiler full-depth checks are unchanged in value. Residual recognized RangeError/InternalError recursion exhaustion is normalized without claiming a measured AST depth. Other resource limits and all mathematical/solver/evaluator semantics are unchanged.

Focused repair verification:four pathological shapes (~2045, Pr(~2042 X), minus2045 with missing operand,100+100 prefixes across parentheses) reject promptly. Mixed infix operators and independent probability100+100 roots compile. At128 prefixes parsing succeeds and compiler full AST-depth check still rejects the oversized tree. New Chromium case checks prompt rejection, Regular toggle and recovery. Full goal still fits770tokens/67queries, is ENTAILED with empty premises and with Pr(U)=0, Regular off. Those zero-support premises are SAT and a false appended clause DOES NOT ENTAIL.

Final verification:1374 unit tests pass (one inherited skip and todo),68 public Chromium cases pass, lint/TypeScript/build/whitespace pass. Actual final package passes12 verdicts over three widths, new token/query overflow messages, prefix rejection/toggle and recovery with no errors/overflow. See measured prefixMilliseconds. Exact2048-token acceptance is for the tested additive shape; all independent bounds apply together.

Scope strictly to closure of R1–R4, new guard correctness/resource behavior, and integration with the two raised caps and the full goal. Untouched older mathematics/optimization are closed. Do not revisit settled severity classification. Use bounded targeted checks if needed; do not repeat full suites without a specific unresolved concern. Do not edit code, tests, fixture or frozen artifacts; do not start servers, commit, push, publish, spawn agents, call other models or invoke recursive debates. Do not delete any file or generated artifact. New diagnostic files may be written only inside this recheck folder and must be retained.

Give a concise decision-ready report, preferably under1200 words and always at most40000 output tokens, preserving decisive arguments, any genuine counterexample, qualifications and explicit Phase gate. Follow runner checkpoint/verdict protocol. Defaults remain Opus5.5/xhigh and GPT6.1Sol/xhigh. Agreement on unresolved repairs is FAIL, not approval.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 10m 34s (2 turns); Codex: 4m 29s (1 turns); total: 15m 03s

## Agreed answer
# Recheck of the R1–R4 expression-limit repair

**Phase gate: PASS.** R1 through R4 are implemented as agreed and verified. The blocking problem was a malformed minus chain at the 2,048-token limit, which froze synchronous validation for about 9.3 s. That input is now rejected in about 0.1–1.3 ms, in both reviewers' Chromium runs and in the package probe. No input was found that the new check rejects but the compiler would accept.

All ten frozen hashes match before and after both reviewers' probes. Nothing in the production code, tests, fixture or frozen files was changed. No servers, full test suites or publication steps were run. The evidence is kept in `reviews/expression_limits_2026-10-13T11-40-23-039Z/recheck_2026-10-13T12-13-26-209Z/`, in `claude-recheck/` and `codex-recheck/` (each has a `FINDINGS.md` plus probe scripts and raw outputs).

## R1: prefix-depth check before parsing — closed

**It matches the agreed design** (`src/causal_syntax.ts:99–124`):
- `~` and `¬` always count. `!` counts unless it is part of `!=`.
- `-` counts only when it does not follow an operand (`[A-Za-z0-9.)]`) and is not part of `->` or `<->`.
- Counts carry into a `(`, and the matching `)` restores the saved count.
- `Pr(`, `P(` and `p(` reset the count, because each probability event is a separate AST root.
- The limit is 128, the same `CAUSAL_LIMITS.max_ast_depth` constant the compiler uses.

**It never rejects input the compiler accepts.**
- Every token the check counts is a real AST ancestor of what follows it in the same root.
- Measured: the compiler accepts at most 126 `~` before `0=0`, and the check rejects only at 129.
- None of these were falsely rejected:
  - binary-minus chains, and chains of `->`, `<->` and `!=`;
  - `x<-1` and mixed infix aliases;
  - `p(`, `do(...)` and given-clauses with 120 nested prefixes;
  - two independent probability roots of 100 prefixes each;
  - `P` used as a graph letter.
- The model-evaluator path also compiles with the depth-128 check (`causal_model_evaluator.ts:178`), so the new check doesn't make it stricter.

**It limits the expensive re-parsing.**
- Only a leading `-` or `(` is ambiguous, so only those make the parser re-scan the rest of a line.
- Re-scans can only pile up across consecutive `-`/`(` tokens, and those are exactly what the check counts. So roughly 128 + 64 levels at most share one scan.
- Some shapes slip past the count (`-…x^(`, `-…x*(`). They are not ambiguous, parse in about 1 ms, and the compiler rejects them.
- This is a reading of the grammar, not a proof. It explains why no slower input turned up, but it does not rule one out.

**Timings in Chromium** (`validate_decision_fields`, which runs on every input event):

| Input | Current | Baseline 80f6a16 |
|---|---|---|
| Rejected shapes (2,045 `-`; 2,045 `~`; `Pr(` + 2,042 `~` + `X)`; 100+100 across a parenthesis) | ~0–1.3 ms | — |
| Slowest malformed line found that the check accepts | 2.35 s | 1.10 s |
| Slowest valid line found that the check accepts (parsed twice per event) | 4.69–4.73 s | 2.22 s |
| About 8.2k characters of the slowest premise lines found | 19.5 s | 35.0 s |

## R2: stack-overflow message — closed

When the stack runs out inside the parser, the error is recognized as a `RangeError` or `InternalError` with "call stack" or "too much recursion" in its message. The user then sees `Constraint line N: Causal expression is too deeply nested to parse; simplify it.` The message claims no measured AST depth, and the input is still rejected.

To confirm this, a probe exhausted most of the stack first so the overflow would land inside the parser. That happened in 42 of 521 runs, and each time the user saw the neutral message. A raw `RangeError` appeared only when the overflow landed in the probe's own wrapper code.

## R3: tests — closed

- The four malformed shapes reject within a 1 s timing bound.
- Infix syntax and the two independent 100+100 probability roots are accepted.
- At 128 prefixes, parsing succeeds and the compiler still rejects at depth 128.
- The new Chromium test would catch the freeze coming back: without the check, that input takes about 9 s, well over the test's 1,000 ms bound. The test also checks that the Regular toggle stays responsive and that the input recovers.
- Focused specs pass 193/193.
- Integration with the larger limits and the full goal:
  - The full goal is 770 tokens and 67 probability queries. It compiles with no premises and 14 mechanisms.
  - With Regular off, it gives ENTAILS with empty premises and with `Pr(U)=0`.
  - Those zero-support premises are SAT, so the entailment is not vacuous. The false appended clause gives DOES NOT ENTAIL.
  - These hold at 320, 390 and 1,280 px.
- The final package probe records rejections at 2,049 tokens and 129 queries, plus prompt prefix rejection, recovery, and no page errors or overflow.

## R4: documentation — closed

- `DECISION_SEMANTICS.md`, `CAUSAL_SEMANTICS.md`, `CHANGELOG.md` and the `check_expression_size` comment state the new limits (2,048 tokens per line, 128 probability occurrences) and describe the prefix check.
- They say the compiler's full AST-depth check is kept, and that all the independent resource limits apply together.
- None of them claim the prefix check guarantees full recursion safety.
- The old limits in `PROJECT.md` are labeled historical.
- The claim that exactly 2,048 tokens are accepted is limited to the additive shape that was tested.

## Qualifications (not blocking)

1. **PASS does not mean validation always stays responsive.** The slowest valid line found that the check accepts blocks validation for about 4.7 s in Chromium. That is about 2.1× the baseline's slowest line (2.22 s), in line with the ~2.6× residual the earlier review accepted when it made the tighter limit optional.
   - It is the slowest input measured, not a proven worst case.
   - The repair's own browser test covers only rejected inputs. This residual was measured during the recheck.
2. **The many-line comparison covers only the tested input shapes.** It shows those shapes got cheaper per character (19.5 s vs 35.0 s per ~8.2k characters). It does not prove that no whole problem got slower.
   - The 50,000-character total limit is unchanged.
   - The baseline already allowed freezes of over a minute spread across many premise lines.
3. **Optional later hardening:** debounce validation, move it off the main thread, or cap combined prefix-plus-parenthesis depth at 64. Any of these would bring single-line latency back to the baseline's level. None is needed to close R1–R4.

## Phase gate: PASS

R1–R4 are closed. The 9 s freeze from malformed minus chains is gone, the check never rejects input the compiler accepts, and the 2,048-token and 128-query limits work with the full goal. Solver, mathematical and evaluator behaviour is unchanged.

## Claude  (verdict: DISAGREE, 10m 13s)
CHECKPOINT
elapsed: ~25 min
tentative_verdict: Phase gate: PASS, with stated qualifications
new_results: NEW: All ten frozen hashes match. Measured in Chromium against the 80f6a16 baseline: the slowest input the guard still accepts takes ~2.35 s per parse and 4.73 s per input event when the line is valid; the baseline's slowest line takes 2.22 s. Spread over many lines, cost per character is now lower than the baseline's. No false rejections found. R2 confirmed by forcing a stack overflow inside the parser. Focused specs pass 193/193.
current_obstruction: none
next_bounded_step: done unless Codex contests whether the residual counts as closed
token_cost: unavailable
END CHECKPOINT

# Recheck of the R1–R4 repair (expression limits)

Evidence is in `reviews/expression_limits_2026-10-13T11-40-23-039Z/recheck_2026-10-13T12-13-26-209Z/claude-recheck/` (`FINDINGS.md`, probe scripts and raw outputs). I changed no production code, tests, fixture or frozen files.

## R1: prefix-depth check before parsing — closed

**It matches the agreed design** (`src/causal_syntax.ts:99–124`):
- `~` and `¬` always count. `!` counts unless it is part of `!=`.
- `-` counts only when it does not follow an operand (`[A-Za-z0-9.)]`) and is not part of `->` or `<->`.
- Counts carry through `(`, and `)` restores the saved count. `Pr(`, `P(` and `p(` reset it, because each probability event is a separate AST root.
- The limit is 128, the same constant the compiler uses.

**It never rejects input the compiler accepts.**
- Every token it counts is a real AST ancestor of what follows in the same root. A minus it misreads as unary only when it follows a connective (`v`) or a non-matching operand is still an ancestor of the operand that follows it.
- Measured: the compiler accepts at most 126 `~` before `0=0`, and the check rejects only at 129.
- None of these were falsely rejected:
  - binary-minus chains, `->`, `<->` and `!=` chains;
  - `x<-1`;
  - `p(`, `do(...)` and given-clauses with 120 nested prefixes;
  - `P` used as a graph letter.
- The model-evaluator path also compiles with the depth-128 check (`causal_model_evaluator.ts:178`), so the check doesn't narrow it either.

**It bounds the costly re-parsing.**
- Only `-` and `(` at the start of a constraint are ambiguous, so only they make the parser re-scan the rest of the line.
- For those re-scans to pile up, the `-` and `(` tokens must be consecutive. Any `=`, connective, `~` or operand cuts the outer re-scan short.
- Consecutive `-`/`(` sequences are exactly what the check counts, so at most about 128 + 64 levels share one scan.
- Some shapes slip past the count (`-…x^(`, `-…x*(`). They are not ambiguous, parse in about 1 ms, and the compiler rejects them.

**Timings in Chromium** (`validate_decision_fields`, which runs on every input event):

| Input | Current | Baseline 80f6a16 |
|---|---|---|
| Rejected shapes (2,045 `-`, `~`, `Pr(~…)`, 100+100 across a parenthesis) | ~1 ms | — |
| Worst malformed line the check accepts (64 `-`, 64 `-(`, filler, missing right-hand side) | 2.35 s | 1.10 s (`-`×509 + `=0`) |
| Worst valid line the check accepts (V2: same shape with `=0` inside the parentheses), parsed twice per event | **4.73 s** | 2.22 s (`-`×505 + `(1=0)`) |
| About 8.2k characters of worst-case premise lines | 19.5 s | **35.0 s** |

The removed regression was about 9.3 s for one malformed parse (≈8× baseline). The worst single line now costs about 2.1× the baseline's.

## R2: fallback message for stack overflow — closed

I recursed thousands of frames first so that the stack ran out inside the parser. In 42 of 521 probe runs it did, and each time the user saw `Constraint line 1: Causal expression is too deeply nested to parse; simplify it.` A raw `RangeError` appeared only when the overflow happened in my own wrapper frames. The message claims no measured depth.

## R3: tests — closed

- The four adversarial shapes reject with a 1 s timing bound.
- Infix syntax and two independent probability roots of 100 prefixes each are accepted.
- At 128 prefixes, parsing succeeds and the compiler still rejects at depth 128.
- The Chromium test would catch a return of the original problem: without the check, that input takes about 9 s, well over its 1,000 ms bound.
- Focused specs pass 193/193. The package probe records ENTAILS for the full goal with empty premises and with `Pr(U)=0`, both with Regular off; SAT for those zero-support premises; and DOES NOT ENTAIL for the false appended clause. It also records the 2,049-token and 129-query rejections.

## R4: documentation — closed

- `DECISION_SEMANTICS.md`, `CHANGELOG.md` and the `check_expression_size` comment describe the prefix check without claiming it guarantees full recursion safety.
- The old limits in `PROJECT.md` are labeled historical.
- The wording that 2,048 tokens were accepted exactly is limited to the shape that was tested.

## Qualifications (not blocking)

1. **The earlier ~2.9 s residual was an estimate for one parse.** A valid conclusion is parsed twice on every input event, so the real worst case for the code as built is about 4.7 s in Chromium. That is still about 2.1× the baseline's 2.2 s, in line with the ~2.6× ratio the earlier review accepted when it made the tighter cap optional. The repair's own browser test only covers rejected inputs; this residual was measured here, not by the implementer.
2. **Long freezes across many lines already existed.** Under the unchanged 50,000-character budget, the baseline already allowed freezes of over a minute through many premise lines. The repaired candidate costs less per character than the baseline (19.5 s vs 35.0 s per 8.2k characters), so the worst case for a whole problem got better, not worse.
3. **Optional later hardening:** debounce validation or move it off the main thread, or cap prefix plus parenthesis depth at 64. Either would bring single-line latency back to the baseline's level. Neither is needed to close R1–R4.

## Phase gate: PASS

R1–R4 are implemented as agreed and verified. The blocking freeze from a long malformed minus chain is gone (about 9.3 s down to about 1 ms). The worst input the check still accepts is within the residual range the earlier review accepted. The 2,048-token and 128-query limits work together with the full goal. I found no false rejection and no counterexample to the check's correctness.

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 4m 29s)
CHECKPOINT
elapsed: approximately 10 minutes this turn
tentative_verdict: Phase gate: PASS
new_results: NEW: Independently verified all ten frozen hashes; fresh server-free Chromium probes reject all four pathological shapes in 0–0.4 ms, preserve the specified accepted inputs, and reproduce the residual example at 4.69 s.
current_obstruction: none
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

**Phase gate: PASS.** I endorse closure of R1–R4.

- **R1:** The implemented scan matches the agreed conservative guard. It carries prefix counts through parentheses, resets for probability-event roots, excludes the specified infix syntax, and shares the compiler’s depth constant. All four adversarial shapes rejected promptly in my fresh Chromium bundle. Mixed infix aliases and independent 100+100 probability roots compiled successfully.
- **R2:** Recognized recursion exhaustion receives the neutral parsing-depth diagnostic. It neither claims a measured AST depth nor turns failure into acceptance. Source inspection and your retained forced-overflow evidence support closure.
- **R3:** At 128 prefixes, my probe confirmed parsing succeeds while compilation rejects the oversized AST. The original malformed-minus input validated in approximately 0.1 ms, followed by successful recovery. The full goal compiled with 67 queries, zero premises and 14 mechanisms. The existing focused-test, browser and final-package evidence covers the remaining integration obligations, including Regular off, zero support, nonvacuous SAT and the false appended clause.
- **R4:** The documentation records the raised caps and conservative pre-parser check while retaining the compiler’s complete AST-depth check and the independent resource bounds.

I would narrow two statements in your report. The approximately **4.7-second residual is a measured parse-accepted example**, not an established universal worst case. Likewise, the aggregate comparison establishes improvement for the tested families; it does not prove that every whole-document worst case improved.

Those qualifications do not change the gate. The prior review expressly required this 128-prefix repair and made the tighter cap optional. The implemented repair removes the reproduced nine-second malformed-chain regression and satisfies the agreed preservation and integration checks. PASS does not imply that synchronous validation always remains responsive.

All ten frozen hashes still match after my probes. No production code, tests, fixture or frozen artifacts were changed; no servers or full suites were started. My additional evidence is retained in [FINDINGS.md](/Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/expression_limits_2026-10-13T11-40-23-039Z/recheck_2026-10-13T12-13-26-209Z/codex-recheck/FINDINGS.md).

VERDICT: AGREE

## Claude  (verdict: AGREE, 21s)
CHECKPOINT
elapsed: ~30 min cumulative
tentative_verdict: Phase gate: PASS (agreed)
new_results: NONE: Codex's independent measurements match mine (4.69 s vs 4.73 s for the slowest accepted input found) and both its narrowing points are correct. All ten frozen hashes still match after both sets of probes.
current_obstruction: none
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

**Phase gate: PASS.** I agree with Codex and accept both of its corrections.

1. **The ~4.7 s figure is the slowest input we measured, not a proven worst case.** My argument that only `-` and `(` at the start of a constraint cause expensive re-parsing was a reading of the grammar, not a proof. It explains why my search for slower inputs found nothing above about 4.7 s, but it does not rule them out. Codex and I measured the same input at 4.69 s and 4.73 s.
2. **The many-line comparison covers only the input shapes I tested.** About 8.2k characters of worst-case premise lines took 19.5 s on the current code and 35.0 s on 80f6a16. That shows the change did not make those shapes worse. It does not prove that no whole problem got slower. The old 50,000-character total limit is unchanged, and the baseline already allowed freezes of over a minute through many lines.

## Final shared position

- **R1 (prefix-depth check) is closed.**
  - The check matches the agreed design and uses the compiler's depth limit of 128.
  - The original ~9 s malformed `-` chain is now rejected in about 0.1–1.3 ms, in both reviewers' Chromium runs and the package probe.
  - Neither reviewer found input that the check rejects but the compiler would accept: the compiler accepts at most 126 prefixes before a comparison, and the check rejects only at 129. Infix minus, arrows, `!=`, and separately counted probability-event, `do(...)` and given-clause roots are all accepted correctly.
- **R2 (stack-overflow message) is closed.** When the stack runs out inside the parser, the user sees the neutral "too deeply nested to parse" message, which claims no measured depth.
- **R3 (tests) is closed.**
  - The four malformed shapes reject quickly, the accepted cases still parse, and the compiler still rejects depth beyond 128.
  - The new Chromium test would catch a return of the ~9 s freeze.
  - The full goal fits within the 2,048-token and 128-query limits and gives ENTAILS with empty premises and with `Pr(U)=0`, with Regular off.
  - Those zero-support premises are SAT, and the false appended clause gives DOES NOT ENTAIL.
- **R4 (documentation) is closed.** The docs, changelog and code comment state the new limits and the check without claiming full recursion safety, and the old `PROJECT.md` limits are labeled historical.

## Qualifications

- **PASS does not mean validation always stays responsive.** Some valid lines the check accepts still block validation for about 4.7 s in Chromium, about 2.1× the 80f6a16 baseline's slowest valid line (2.22 s). The earlier review accepted this kind of leftover delay when it made the tighter limit optional.
- **Optional later hardening:** debounce validation, move it off the main thread, or cap combined prefix-plus-parenthesis depth at 64.

Evidence is kept in `recheck_2026-10-13T12-13-26-209Z/claude-recheck/` and `codex-recheck/`. No code, tests, fixture or frozen files were changed.

VERDICT: AGREE

