# Consensus debate — 2026-10-13 08:10

## Question
Review this completed DoSAT phase and give an explicit Phase gate: PASS or FAIL.

Workspace: /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus
Baseline: 80f6a16. Only current delta is in change.diff plus tests/fixtures/independence_conclusion.ts.
User requested: raise the 512-token limit so the previously supplied full, division-free independence conclusion can be submitted as one entailment goal with Regular off.

Implemented: CAUSAL_LIMITS.max_tokens_per_line 512 -> 2048, max_probabilities64 ->128. The goal has770 tokens,1291 characters and67 probability occurrences, so the second cap also had to increase. Compiler MAX_CAUSAL_PROBABILITIES now aliases the same parser constant. Source line character4096, combined lines64, parentheses64, graph8, source50000, AST20000/depth128, expansion and solver limits unchanged. No mathematical rules, compiler lowering, model evaluation or solver lifecycle changes.

Boundary regressions: exact2048 tokens parse,2049 reject before recursive parse;128 registry queries get unique alphabetic identifiers and129 reject;decision joint budget accepts128 across63 premises and one conclusion while65lines still reject. Compiler API129-query and129-occurrence checks remain covered. Full original17-equation goal compiles against empty premises with nonregular mechanism bounds.

Verification:187 focused units and1368 full units pass (one inherited skip and todo), lint, TypeScript/build, whitespace pass. All67 public Chromium cases pass, including the full nonregular goal with empty premises and Pr(U)=0. Actual eight-file prepared-package probe passes12 verdict checks over320/390/1280px: full goal ENTAILS, zero-support goal ENTAILS, zero-support premises SAT, false appended clause DOES NOT ENTAIL. It rejects2049 tokens and129 queries; no page errors or document overflow. package-probe.json and source-snapshot.json are evidence.

Scope review narrowly to these limit increases, API consistency, bounds, actual full goal and tests, documentation, resource implications. Untouched mathematics and optimization are reference only; do not reopen old code or model-class debates. Input acceptance remains the conjunction of all independent resource limits; exactly2048 tokens parsing does not imply every such AST passes compiler depth/cost bounds.

Do not edit production code, tests, fixture, package or frozen documents. Do not commit, push, publish, call other models, run recursive debates, spawn agents or create servers. Use ordinary read-only tools and bounded checks if useful; no full-suite repetition unless an actual unresolved concern requires it. If you find a material problem, give a concrete bounded repair. This is the implementation gate, not just design agreement. If approved, state Phase gate: PASS explicitly; otherwise Phase gate: FAIL with reasons.

Return a compressed final report at most40000 output tokens, preserving decisive arguments, qualifications and verdict. Follow runner checkpoint/report controls. Long supplementary material may go only in this review folder; keep journals private. Defaults must remain Claude Opus5.5/xhigh and GPT6.1 Sol/xhigh.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 12m 54s (3 turns); Codex: 10m 36s (2 turns); total: 23m 30s

## Agreed answer
# Expression-limit phase review (512 → 2,048 tokens; 64 → 128 probability occurrences)

## Phase gate: FAIL

The phase reaches its goal: the full division-free independence conclusion (770 tokens, 1,291 characters, 67 probability occurrences) can now be entered on one line and checked with Regular off. However, raising the token cap also lets a single malformed line freeze the page for about 9 seconds on every input event. Before the change, that line was rejected by the lexical bound and never reached the parser. That regression blocks approval. The repair is small (below), and a scoped recheck should then be enough.

## Blocking defect: a long run of prefix operators freezes the page

**Example input:** `'-'.repeat(2045) + '=0'`. It is 2,047 characters and 2,047 tokens with no parentheses, so it passes every check that runs before parsing:
- characters per line: 4,096 limit;
- tokens per line: now 2,048;
- parenthesis depth: 64.

**Measured in server-free Chromium (`validate_decision_fields`):**

| Malformed conclusion | Length | Validation time |
|---|---:|---:|
| `'-'.repeat(509)+'=0'` (close to the old 512 cap) | 511 | ≈1.09 s |
| `'-'.repeat(1000)+'=0'` | 1,002 | ≈4.2 s |
| `'-'.repeat(1500)+'=0'` | 1,502 | ≈9.1 s |
| `'-'.repeat(2045)+'=0'` | 2,047 | ≈9.1–9.3 s |
| `'-'.repeat(2045)+'1='` | 2,047 | ≈2.6 s |

Two independent Chromium runs reproduced the 2,047-character figure (9,128 ms and 9,310 ms). Node gives about 10.4 s. The page recovers afterwards with no uncaught page errors, but a 9-second synchronous stall in an input handler is not acceptable.

**Why it blocks the page.** Validation runs synchronously, without debounce, on every input event:
- `src/causal_decision_ui.ts:144` calls `invalidate()`, which calls `refresh()`, which calls `valid()` (line 133), which calls `validate_decision_fields(input())`.
- That re-parses every line on each change to the graph, conclusion, task, mode, seconds or Regular controls.
- Premise rows reach the same path through the editor callback.

**Why parsing is quadratic.** In `src/pr_sat.ts`, `-` means both constraint negation (`negation: ['~', '-', '!']`) and real unary minus. At each constraint-negation level, `ConstraintFactor` retries the comparison alternatives over the rest of the input before descending. Total cost is therefore roughly (levels × alternatives × suffix length), which is quadratic for a run of `-`. A `~` run has no such ambiguity, so it parses in linear time.

**Secondary symptom, same cause.** Prefix chains of about 2,045 symbols overflow the recursive parser's stack. The user sees "Constraint line 1: Maximum call stack size exceeded" instead of a nesting diagnostic. This happens for:
- `'~'.repeat(2045)+'0=0'`;
- `` `Pr(${'~'.repeat(2042)}X)=1` ``;
- `'-'.repeat(2045)+'1=0'`.

The 509 and 1,021 versions of the `~` chain are rejected cleanly with the compiler's depth-128 message. The overflow is caught by `parse_causal_document`'s line-level try/catch and does not reach the solver. Where it starts depends on the engine and JIT state; in cold Node it was about 1,563 for `~`.

**What the code promised.** The comment on `check_expression_size` (`src/causal_syntax.ts:76`) says the bounds exist to "Fail before sending excessively deep or long recursive input to PrSAT's parser". At 2,048 tokens, the lexical and parenthesis bounds alone no longer guarantee that.

**Two limits on these measurements:**
- The ≈1.1 s figure is the near-cap result for this one input family. It is not a proven worst case over every input the old 512-token limit allowed. The regression does not depend on that claim: the same family went from ≈1.1 s to ≈9.1–9.3 s, at a length that could not reach the parser before.
- Residual timings from the repair prototype support its design but do not prove a universal latency bound. The recheck should measure responsiveness directly in the browser.

## Required bounded repair

**R1. Linear-time prefix-depth check in `check_expression_size` (`src/causal_syntax.ts`), run before the recursive parser.**
- Count prefix negations that are AST ancestors of the current scan position:
  - `~` (and `¬`) always counts;
  - `!` counts unless the next non-space character is `=` (so `!=` is excluded);
  - `-` counts only if the previous non-space character does not end an operand (`[A-Za-z0-9.)]`) and the next non-space character is not `>`. This excludes binary minus, `->` and `<->`.
- Handle parentheses so the count accumulates across them:
  - `(` pushes the current base plus the pending prefix run;
  - `)` restores the saved base;
  - any other non-space operand character resets the pending run.
- `Pr(`, `P(` and `p(` reset the base to 0, because each probability event is a separate AST root under `check_input_size`.
- Reject when the count exceeds 128, the compiler's `MAX_INPUT_AST_DEPTH`.
- Safety: every counted operator is a strict AST ancestor within the same root, so the check never rejects input the compiler would accept.
- Prototype evidence (`claude-probe/guard.probe.ts`, function `prefix_depth`):
  - all 229 shipped example and fixture lines, plus the full goal, have prefix depth at most 1;
  - the 2,045-symbol `~`, `Pr(~…)` and `-` shapes are rejected in under 0.3 ms, as is a 100 + 100 run split across a parenthesis;
  - binary minus and the arrow operators are classified correctly;
  - `Pr(` resets the count.
- With the check in place, the slowest remaining contrived shape (128 prefix levels plus 64 parentheses plus filler) takes about 2.9 s. Capping prefix depth plus parenthesis depth at 64 would restore baseline-level latency (about 1 s) but would narrow previously accepted input, so it is optional.

**R2. Fallback for stack exhaustion.** In `parse_causal_document`'s catch block, map recursion errors to the message "Causal expression is too deeply nested to parse; simplify it." A recursion error here means a `RangeError` or `InternalError` whose message matches `/call stack|too much recursion/i`.
- Keep the compiler's separate depth-128 diagnostic. Stack exhaustion does not establish a measured AST depth, so this message should not claim one.
- This fallback improves the message only. It does not replace R1.

**R3. Tests.**
- Unit tests:
  - the three 2,045-symbol prefix shapes and the malformed `'-'.repeat(2045)+'=0'` line are rejected quickly (for example, in under 200 ms) with the new message and never with `/call stack/`;
  - nesting split across parentheses is rejected;
  - binary minus and `->`/`<->`/`!=` are not miscounted, for example `x - -1 = 0 -> 0=0 <-> -1 != 0` is accepted;
  - the count resets at `Pr(`;
  - a depth-128 `~` chain passes the check and is then decided by the compiler;
  - the full independence goal is still accepted.
- One Chromium test: fill the conclusion with `'-'.repeat(2045)+'=0'`, check that the field error appears, and check that toggling `decision-regular` takes effect within about 1 s.

**R4. Documentation.**
- Add the prefix-depth bound to the limits paragraph in `DECISION_SEMANTICS.md` and to the 2026-10-13 CHANGELOG entry.
- Reword the `check_expression_size` comment to describe lexical, parenthesis and conservative prefix-depth checks before parsing, as distinct from the compiler's complete AST-depth check.

After R1–R4, rerun the focused specs and the new Chromium case, then do a scoped re-gate. PASS is expected if those succeed.

## Parts of the phase that meet the gate

- **One shared constant for both probability checks.** `MAX_CAUSAL_PROBABILITIES = CAUSAL_LIMITS.max_probabilities` (`src/causal.ts:22`), so the parser registry check (`src/causal_syntax.ts:281`) and both compiler checks (distinct queries and occurrences, `src/causal.ts:73,89`) all use 128. No stray 64 or 512 for these limits remains in `src/`. The evaluator UI uses `max_constraints` and `max_input_characters`, not these limits.
- **Boundary test arithmetic is correct:**
  - 1,024 `x`s joined by `+`, then `=0`, is 2,049 tokens and 2,049 characters, so the token cap rejects it before the character cap applies;
  - `-` followed by 1,023 `1`s joined by `+`, then `=1`, is exactly 2,048 tokens and is accepted;
  - 128 `Pr(X)` on one line is 641 tokens, which is why that test moved to a single line to stay within 64 lines;
  - decision budget: 63 premises × 2 queries + 2 = 128 is accepted, 126 + 3 = 129 is rejected, and 65 lines are still rejected.
- **The full goal with Regular off.** It compiles with empty premises and nonregular mechanism bounds (14 mechanisms, all queries unconditional, polynomial counterexample SMT). Results:
  - empty premises: ENTAILS;
  - `Pr(U)=0`: ENTAILS (correct for product-form equalities);
  - the zero-support premises: SAT;
  - the goal with a false clause appended: DOES NOT ENTAIL, which shows the ENTAILS verdict is not vacuous.
  - These hold at 320, 390 and 1,280 px with no page errors. `compile_causal_document` runs before model evaluation, so the evaluator's recursion stays bounded by depth 128.
- **Other bounds are unchanged:** line characters 4,096, combined lines 64, parentheses 64, graph nodes 8, total source 50,000 characters, AST size 20,000 and depth 128, and the expansion and solver limits. Binary-chain shapes at about 2,048 tokens parse in a few milliseconds in Chromium and are then rejected cleanly by the compiler. Those shapes are constraint `&`/`v`/`<->`, sentence `&`/`->`/`<->`, and `^`/`*`/`+`.
- **The evidence matches the source.** All ten frozen source hashes match `source-snapshot.json`, and a rerun of the focused unit tests passed 187/187.

## Non-blocking notes

- `PROJECT.md:70–71` is the historical Phase-1 summary and still says "64 probability occurrences … 512 tokens". Mark it as "(Phase 1)" or point to the new section.
- `VERIFICATION.md` and the CHANGELOG should say that the exact-2,048-token acceptance applies to the tested input shape. Accepting input still requires every independent bound to hold, including the compiler's depth and cost bounds, so some 2,048-token inputs will still be rejected.
- Only Chromium was checked; the Firefox and WebKit Playwright binaries are not installed.

## Evidence and scope

Probe scripts and findings are in `reviews/expression_limits_2026-10-13T11-40-23-039Z/claude-probe/`. No production code, tests, fixture, package or frozen documents were changed. Nothing was committed, published or served on a persistent port.

**Phase gate: FAIL.** The only blocker is the ≈9 s synchronous validation freeze from one bounded malformed line, a regression introduced by this phase, plus the stack-overflow message that shares its cause. Apply R1–R4 and re-gate.

## Claude  (verdict: DISAGREE, 6m 20s)
CHECKPOINT
elapsed: ~25 min
tentative_verdict: Phase gate: FAIL. One narrow, low-severity regression introduced by 512 → 2048, with a small repair; everything else passes.
new_results: NEW: In real Chromium, prefix-negation chains of about 2,045 tokens now overflow the recursive parser's stack. The user sees "Constraint line 1: Maximum call stack size exceeded" instead of the compiler's depth-128 message. The 509 and 1,021 versions of the same inputs are rejected cleanly. All binary-chain shapes at 2,048 tokens parse and are then rejected cleanly by the compiler. Frozen hashes match, and the 187 focused unit tests pass when rerun.
current_obstruction: Should a raw engine stack-overflow message on pathological, already-unacceptable input block the gate? I say yes, as a small bounded repair, because the token bound was the stated guard against this.
next_bounded_step: Codex responds on severity. Then implement repair (a) below plus one regression, and re-gate.
token_cost: unavailable
END CHECKPOINT

## Report

### What checks out
- **The two caps share one constant.** `MAX_CAUSAL_PROBABILITIES = CAUSAL_LIMITS.max_probabilities` (`src/causal.ts:22`), so the parser's registry check (`src/causal_syntax.ts:281`) and both compiler checks (distinct queries and occurrences, `src/causal.ts:73,89`) all use 128. No other copy of 64 or 512 for these limits remains in `src/`. The evaluator UI uses `max_constraints` and `max_input_characters`, not these two.
- **The boundary tests are correct by arithmetic.**
  - 1,024 `x`s joined with `+`, then `=0`, is 2,049 tokens and 2,049 characters, so it is rejected by the token cap, not the character cap.
  - `-` followed by 1,023 `1`s joined with `+`, then `=1`, is exactly 2,048 tokens and is accepted.
  - 128 `Pr(X)` on one line is 641 tokens, so the change to one line was needed to stay within 64 lines.
  - In the decision tests, 63 premises × 2 queries + 2 = 128 is accepted; 126 + 3 = 129 is rejected; 65 lines are still rejected.
- **The full goal has one real sanity check.** The "false appended clause → DOES NOT ENTAIL" probe shows the ENTAILS verdict is not vacuous. Zero support (`Pr(U)=0`) also ENTAILS with Regular off, which is right for product-form equalities. `compile_causal_document` runs before every recursive model evaluation, so the evaluator's AST recursion stays bounded by depth 128.
- **No other resource problem showed up.** Expansion, solver, AST, nesting and character bounds are unchanged. In Chromium, every binary-chain shape parses in a few milliseconds at about 2,048 tokens: constraint `&`, `v`, `<->`; sentence `&`, `->`, `<->`; and `^`, `*`, `+`. The compiler then rejects each one cleanly.
- **The evidence matches the source.** Frozen hashes match `source-snapshot.json`, and the focused rerun gave 187/187.

### Material finding: the parser's recursion guard no longer holds for prefix chains
The comment on `check_expression_size` (`src/causal_syntax.ts:76`) says the token limit exists to "Fail before sending excessively deep or long recursive input to PrSAT's parser". The parser handles prefix operators by recursion, one level per operator: `CNot` → `ConstraintFactor`, `Not` → `SentenceFactor`, and `PREFIX` via `P.lazy`. At 512 tokens no input could get deep enough to matter. At 2,048 it can.

Results in actual Chromium (bundled source, `page.setContent`, no server):

| Input | Result |
|---|---|
| `'~'.repeat(2045)+'0=0'` | parse and `compile_decision_problem` both give "Constraint line 1: Maximum call stack size exceeded" |
| `` `Pr(${'~'.repeat(2042)}X)=1` `` | same |
| `'-'.repeat(2045)+'1=0'` | same |
| `~` chains of 509 and 1,021 | clean "too large or deeply nested (… depth 128)" |

In Node the first overflow for the `~` chain came at about 1,563 when cold, and the outcome changes with JIT warm-up. So the message users see depends on the engine and the JIT state.

How serious it is:
- There is no soundness, crash or hang problem. The error is caught inside `parse_causal_document`'s line-level try/catch and shown through `validate_decision_fields`, and it takes about 20 ms.
- Every affected input would be rejected anyway by the depth-128 limit.
- The defect is real and introduced by this phase. It is exactly the resource implication the scope asked about, and it breaks a guarantee the code comment states.
- `VERIFICATION.md`'s "Exact 2048-token parse succeeds" is true only for the shape tested.

### Bounded repair (pick (a); (b) is optional extra protection)
**(a) Required, about 6 lines plus 1 test.** In the catch block of `parse_causal_document` (`src/causal_syntax.ts`), turn engine recursion exhaustion into a clean depth error:
```ts
const is_recursion_overflow = (e: unknown): boolean =>
  e instanceof Error && (e instanceof RangeError || e.name === 'InternalError') && /call stack|too much recursion/i.test(e.message)
…
} catch (error) {
  const detail = is_recursion_overflow(error)
    ? `Causal expressions are too deeply nested (AST depth is limited to 128).`
    : error instanceof Error ? error.message : String(error)
  throw new Error(`Constraint line ${lineIndex + 1}: ${detail}`)
}
```
- Update the `check_expression_size` comment so it no longer claims the token cap alone guarantees recursion safety.
- Add a unit test over the three prefix shapes above, calling `compile_decision_problem(... conclusion: s ...)`. Assert it throws `/deeply nested/` and never `/call stack/`. The test is deterministic whether or not the stack actually overflows, because without an overflow the compiler throws its own depth-128 message.

**(b) Optional pre-parse guard.** Do this inside `check_expression_size`, before parsing.
- **What to count.** Track an accumulated prefix depth:
  - each open `(` saves the run of prefix operators immediately before it; `)` restores the saved value;
  - the current run is reset whenever an operand appears;
  - `~`, `!` and `¬` always count as prefix, except `!` before `=`;
  - `-` counts only if it does not follow an operand end (identifier, number or `)`) and is not followed by `>`.
- **When to reject.** Reject when the accumulated depth exceeds 128.
- **Why it is safe.** Every counted operator is an ancestor in the AST, so this never rejects an input the compiler would accept.
- **Why (a) is still needed.** The guard alone is not complete, because prefix runs can also build up through nested parentheses; (a) remains the catch-all.

**Not recommended: lowering the cap to 1,024.** The goal (770 tokens) would fit and Chromium handles 1,021, but that leaves only a 1.5× margin on stack sizes that vary by engine and JIT state.

### Minor, non-blocking
- `PROJECT.md:70–71` is the historical Phase-1 summary. It still says "64 probability occurrences … 512 tokens" (and an outdated "six graph variables"). The new section appended at the end documents the change, so a one-word "(Phase 1)" annotation would do.
- `VERIFICATION.md`/CHANGELOG should say that exact-2,048 acceptance is shape-dependent, and that depth limits (and, before repair (a), stack limits) also apply.

### Scope and housekeeping
- I made no edits to production code, tests, fixture, package or frozen documents. Probe scripts and `FINDINGS.md` are in `reviews/expression_limits_2026-10-13T11-40-23-039Z/claude-probe/`; I deleted the generated `bundle.js` because it can be rebuilt. No servers, commits or publishing.
- Firefox and WebKit binaries are not installed, so I could only check Chromium.

### Gate
**Phase gate: FAIL.** The only blocker is the parser stack-overflow regression above, and it is low severity: no soundness, crash or hang impact. Apply repair (a) with its regression test. Rerun the focused specs and the one new browser case, then re-gate; I expect PASS. Everything else in the phase meets the gate:
- the full nonregular goal: empty premises, zero support, and the false-clause check;
- consistency between the two caps;
- boundary tests;
- documentation;
- resource bounds for all non-prefix shapes.

VERDICT: DISAGREE

## Codex  (verdict: DISAGREE, 5m 52s)
CHECKPOINT
elapsed: ~10 minutes this turn
tentative_verdict: Phase gate: PASS; disagreement remains over whether the contained diagnostic defect is blocking
new_results: NEW: Independently reproduced Chromium prefix overflows, verified recovery and absence of page errors, confirmed all ten frozen source hashes, and checked the validation boundary. Malformed unary-minus input also showed increased parsing latency.
current_obstruction: Classification of the reported defect as material or nonblocking
next_bounded_step: Resolve that classification; no additional implementation audit is needed on present evidence
token_cost: unavailable
END CHECKPOINT

**My assessment: Phase gate: PASS.** I agree with your factual finding, but disagree that it requires FAIL. Consensus approval remains open while we disagree about its severity.

The overflow is real and reachable because of this phase. In an independent, server-free Chromium probe:

- The 2,048-token constraint-negation and sentence-negation cases produced the caught “Maximum call stack size exceeded” error.
- There were no page errors, and subsequently parsing and compiling `Pr(X)=1/2` succeeded.
- Arithmetic-prefix behavior varied with execution history, consistent with your JIT qualification.
- A malformed 2,046-token unary-minus expression took approximately 2.6 seconds for the paired parse and compile attempts. Thus, the short timings for well-formed prefix chains should not be generalized to malformed inputs.

The source confirms containment. `parse_causal_document` catches the exception; field validation records it; the UI disables Run for that validation failure. No solver invocation follows through this path.

**The decisive distinction is that every demonstrated overflow case already violates the retained AST-depth limit.** A chain of over 2,000 prefix operators cannot satisfy depth 128. These examples therefore do not demonstrate rejection of an input within the accepted fragment, acceptance beyond a resource bound, an incorrect verdict, or persistent application failure. The question expressly makes acceptance conditional on all independent bounds.

Your required repair (a) reinforces this classification: it changes the diagnostic without preventing recursion, reducing resource consumption, or changing rejection behavior. It is a sensible polish fix, but its small size does not itself make the existing defect material enough to block this phase.

I agree that the `check_expression_size` comment overstates what the lexical and parenthesis guards establish. I would recommend these **nonblocking** improvements:

- Describe those checks as lexical and parenthesis bounds, without implying complete protection against parser recursion exhaustion.
- Normalize recognized recursion-exhaustion errors to a useful message such as “Causal expression is too deeply nested to parse; simplify it.”
- Retain the compiler’s separate depth-128 diagnostic. Engine stack exhaustion alone does not establish a measured AST depth, so the parser message need not assert that measurement.

The exact-2,048-token test and verification statement concern the tested expression. Neither establishes universal parse acceptance for every expression of that token count. The explicit scope qualification already addresses that distinction.

I otherwise endorse your review: shared parser/compiler probability limits, boundary arithmetic, preservation of other bounds, full nonregular goal coverage, zero-support satisfiability, and the false-clause probe all support approval. I independently confirmed that all ten frozen source hashes match. I made no file changes and did not repeat the full suite.

Accordingly, I would record **PASS with a nonblocking parser-diagnostic follow-up**, rather than require repair and re-gating. A demonstrated failure on an input satisfying the retained bounds, an uncaught error, or a material responsiveness failure would change that judgment; the current evidence establishes none of those.

VERDICT: DISAGREE



## Claude  (verdict: DISAGREE, 6m 18s)
CHECKPOINT
elapsed: ~50 min cumulative
tentative_verdict: Phase gate: FAIL, now on responsiveness grounds that meet Codex's own stated criterion for changing its judgment
new_results: NEW: In Chromium, a malformed run of unary minus signs about 2,045 characters long blocks the main thread for about 9.3 s on every input event; at the old 512 cap the worst case was about 1.1 s. The cost is quadratic and caused by `-` serving as both constraint negation and real minus. A prototype O(n) prefix-depth guard rejects these shapes in under 0.3 ms and accepts all 229 shipped example and fixture lines plus the full goal.
current_obstruction: Codex classified the problem as non-blocking based on a 2.6 s measurement; my worse shapes measure about 9.3 s
next_bounded_step: Codex reviews the responsiveness evidence and the repair; both of us then agree on FAIL plus repair, or Codex identifies a flaw in the measurement
token_cost: unavailable
END CHECKPOINT

## Response to Codex

### Where I agree
- **Classification of the stack-overflow message.** Taken alone, it is a contained diagnostic defect. Every case I demonstrated is far beyond depth 128, the error is caught, the page recovers, and the solver never runs. On that point alone, PASS with a follow-up would be defensible.
- **Wording of the replacement message.** The parser's recursion-exhaustion message should not claim a measured AST depth. Your wording is better than mine: "Causal expression is too deeply nested to parse; simplify it."
- **Scope of the exact-2,048 test.** It covers the shape it tests; it is not a universal claim, and the question's scope note already makes that distinction.

### Where I disagree: your responsiveness observation becomes decisive under worse shapes
You said a material responsiveness failure would change your judgment. It does here.

**1. Validation is synchronous on every input event, with no debounce.** At `src/causal_decision_ui.ts:144`, every `input` event on the graph, conclusion, task radios, mode, seconds or Regular controls calls `invalidate()`. That calls `refresh()`, then `valid()` (line 133), then `validate_decision_fields(input())`, which re-parses each line. Premise rows reach the same path through the editor callback and also re-parse for the preview.

**2. Chromium measurements of `validate_decision_fields`** (server-free bundle, `browser3.mjs`):

| Malformed conclusion | 500 | **509 (max under the old 512 cap)** | 1,000 | 1,500 | **2,045** |
|---|---|---|---|---|---|
| `'-'.repeat(n)+'=0'` | 1,075 ms | **1,085 ms** | 4,173 ms | 9,065 ms | **9,310 ms** |
| `'-'.repeat(n)+'1='` | 302 | 308 | 1,171 | 2,546 | 2,623 |

A single pasted line of 2,048 characters therefore freezes the tab for about 9 s on every keystroke or toggle until it is fixed. That is roughly 8.6× the old worst case, and it is caused by this phase. Node gives the same results (10.4 s). The line passes every input bound before the parser runs: 2,047 characters, 2,047 tokens, no parentheses.

**3. Root cause.** In `src/pr_sat.ts`, `-` is a constraint-negation symbol (`negation: ['~', '-', '!']`) as well as real unary minus. At each `CNot` level, `ConstraintFactor` retries the six comparison alternatives over the remaining suffix before it descends. Cost is therefore about levels × 6 × suffix length, which is quadratic for a run. `~` is not ambiguous with real minus, which is why `~` chains stay linear (16 ms) and only overflow the stack.

**4. Calibration across shapes** (Node, 2,048 tokens): about 16 ms per nesting level.
- 64 parentheses alone: about 1.0 s. That bound is unchanged; it simply scales with the larger token budget.
- 64 prefix levels: about 1.0 s.
- 64 prefix plus 64 parentheses: about 2.0 s.
- 128 prefix plus 64 parentheses: about 2.9 s.

Your 2.6 s figure matches the "missing right-hand side" variant. The variant with no operand is the worst case.

### Concrete bounded repair (Phase gate FAIL until applied)
**R1. Add an O(n) prefix-depth guard in `check_expression_size`** (`src/causal_syntax.ts`), applied before the recursive parser. It is prototyped and tested in `claude-probe/guard.probe.ts` as `prefix_depth`.
- **Count:** prefix negations that are AST ancestors of the scan point.
  - `~` always counts.
  - `!` counts unless the next non-space character is `=`.
  - `-` counts only if the previous non-space character is not an operand end (`[A-Za-z0-9.)]`) and the next one is not `>`.
- **Parentheses:** `(` saves the base and adds the current run to it, except that `Pr(`/`P(`/`p(` resets the base to 0, because the probability's event is a separate AST root in `check_input_size`. `)` restores the saved base. Any other non-space character resets the run.
- **Reject** when the count exceeds 128 (`MAX_INPUT_AST_DEPTH`).
- **Soundness:** every counted operator is a strict AST ancestor in the same root, so this never rejects input the compiler would accept.
- **Evidence:**
  - all 229 shipped example and fixture lines plus the full goal have a maximum depth of 1;
  - the 2,045 `~`, `Pr(~…)` and `-` shapes, and a 100+100 split across a parenthesis, are rejected in under 0.3 ms;
  - binary minus, `->` and `<->` are classified correctly;
  - `Pr(` resets the count.
- **Effect:** the worst case drops from about 9–10 s to about 2.9 s, from 128 prefix levels plus 64 parentheses plus about 1,700 filler tokens. That shape is extremely contrived.
- **Optional tighter cap:** capping prefix depth plus parenthesis depth at 64 would restore baseline-equivalent latency (about 1 s), but it narrows inputs that were accepted before. I would not require it.

**R2. Keep the catch-all mapping** of `RangeError`/`InternalError` with "call stack" or "too much recursion" to "Causal expression is too deeply nested to parse; simplify it." This covers residual engine and JIT variance.

**R3. Tests.**
- **Units:** the three 2,045-prefix shapes reject with the guard message within a generous time limit (for example, under 200 ms), and never with `/call stack/`. A depth-128 `~` chain passes the guard and is then decided by the compiler. The full goal and an `x - -1 = 0 -> 0=0 <-> -1 != 0` line are accepted.
- **Browser:** one Chromium case. Fill the conclusion with `'-'.repeat(2045)+'=0'`, then assert the field error appears and that toggling Regular stays responsive (for example, `decision-regular` checked state updates within 1 s).

**R4. Docs.** Add the prefix-depth bound to the limits paragraph in `DECISION_SEMANTICS.md` and to the CHANGELOG entry. Reword the `check_expression_size` comment to describe lexical, parenthesis and prefix-depth bounds, not complete protection against recursion.

### Unchanged parts of my review
These all pass:
- the shared constant for both probability caps;
- the boundary arithmetic;
- the full nonregular goal, including the zero-support and false-clause checks;
- the frozen hashes;
- the focused unit tests (187/187).

The two non-blocking notes stand: the historical limits in `PROJECT.md:70–71`, and verification wording that should be specific to the tested shape.

**Phase gate: FAIL.** The reason is a regression introduced by this phase: about a 9 s synchronous freeze on every input event, from a single bounded 2,045-character line, compared with about 1.1 s at the old cap. The stack-overflow diagnostic is a secondary issue. R1–R4 are bounded and fix both; I expect a PASS after re-gating on the focused specs plus the one new browser case. All evidence and probes are in `reviews/expression_limits_2026-10-13T11-40-23-039Z/claude-probe/`. No production files were edited.

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 4m 44s)
CHECKPOINT
elapsed: approximately 5 minutes this turn
tentative_verdict: Phase gate: FAIL
new_results: NEW: Independently reproduced synchronous Chromium validation taking 1,089 ms for the near-old-cap input and 9,128 ms for the larger malformed input. Confirmed validation runs directly from input handlers.
current_obstruction: none for the review verdict; the candidate requires a pre-parser repair
next_bounded_step: Review complete; implement the bounded repair and obtain a scoped recheck
token_cost: unavailable
END CHECKPOINT

**Phase gate: FAIL.** I withdraw my previous PASS assessment. Your new evidence establishes the material responsiveness regression that I said would change my judgment.

I independently measured `validate_decision_fields` in server-free Chromium:

| Conclusion | Characters and tokens | Validation time |
|---|---:|---:|
| `'-'.repeat(509) + '=0'` | 511 | 1,089 ms |
| `'-'.repeat(2045) + '=0'` | 2,047 | 9,128 ms |

The page subsequently recovered, with no page errors, but recovery does not make a nine-second synchronous input-handler stall acceptable. The larger input previously failed the lexical limit before reaching the parser. It now reaches the ambiguous recursive parsing path, and the UI invokes that path synchronously when relevant controls change.

My earlier measurement used a different malformed suffix and underestimated this failure. The new measurement changes the classification from a contained diagnostic defect to a blocking responsiveness defect.

I endorse the bounded repair direction:

- **Reject excessive prefix nesting before recursive parsing.** The guard should conservatively count prefix ancestors, handle binary minus and arrow aliases, accumulate through parentheses, and respect the separate probability-event AST roots.
- **Keep recursion-error normalization as a fallback.** It improves diagnostics but cannot substitute for the early guard.
- **Verify early rejection and preservation of accepted input.** Cover the malformed minus case, the other prefix shapes, split nesting, operator disambiguation, probability-root separation, and the full nonregular goal. Add the Chromium responsiveness regression.
- **Document the guard accurately**, retaining the distinction between lexical limits, conservative pre-parser checks, and the compiler’s complete AST-depth check.

Two qualifications belong in the shared report. First, 1.1 seconds is the near-boundary result for this input family, not an established worst case over all baseline inputs. Second, the prototype’s residual timings do not establish a universal latency bound. Neither qualification weakens the reproduced blocker or requires a broader audit.

The prototype supports the repair design; it is not an implemented fix to the frozen candidate. Approval requires the actual repair, affected checks, and scoped consensus recheck. The other reviewed changes remain satisfactory: shared probability limits, boundary coverage, the full goal with Regular off, zero-support checks, and the false-clause probe.

No production files, tests, fixtures, packages, or frozen documents were changed.

VERDICT: AGREE

## Claude  (verdict: AGREE, 16s)
CHECKPOINT
elapsed: ~55 min cumulative
tentative_verdict: Phase gate: FAIL (consensus)
new_results: NONE: Codex independently reproduced the decisive freeze in Chromium (1,089 ms near the old cap, 9,128 ms for the new 2,047-character input) and withdrew PASS; nothing remains in dispute
current_obstruction: none
next_bounded_step: done for this gate; next, implement the repair and get a scoped recheck
token_cost: unavailable
END CHECKPOINT

## Agreed outcome

I agree with Codex's report and accept both of its qualifications:

1. **About 1.1 s is the near-old-cap figure for one input family**, not a proven worst case over every input the old 512-token limit allowed. The regression holds without that claim: the same family went from about 1.1 s to about 9.1–9.3 s in Chromium, reproduced by both of us. The 2,047-character input could not reach the parser before this change.
2. **My prototype's remaining timings are evidence for the repair's design, not a universal latency bound.** The recheck should therefore test responsiveness directly in the browser, not rely on calibrated estimates.

**Phase gate: FAIL.**

**Blocking reason:** raising the token cap from 512 to 2,048 lets a single bounded line freeze the page for about 9 s.
- An example is `'-'.repeat(2045)+'=0'`: 2,047 characters and 2,047 tokens, with no parentheses, so it passes every earlier input check.
- The parser's cost grows quadratically here because `-` is both constraint negation and real unary minus.
- `validate_decision_fields` re-runs this parse synchronously on every input event (`invalidate` → `refresh` → `valid()`).
- A secondary problem from the same cause: prefix chains of about 2,045 symbols surface the raw engine message "Maximum call stack size exceeded".

**Bounded repair, required before the recheck:**
- **R1. Pre-parser check.** Add a linear-time prefix-depth check in `check_expression_size` that runs before the recursive parser.
  - It counts prefix negations that are AST ancestors of each position.
  - `-` counts only when it does not follow an operand and is not part of `->` or `<->`; `!=` is excluded.
  - Counts accumulate through parentheses, and `Pr(`/`P(`/`p(` reset the count because each probability event is a separate AST root.
  - It rejects when the count exceeds 128, the compiler's depth limit, so it never rejects input the compiler would accept.
- **R2. Fallback message.** Map stack-overflow errors to "Causal expression is too deeply nested to parse; simplify it."
- **R3. Tests.**
  - Unit tests: the malformed minus shape, the other long prefix shapes, nesting split across parentheses, binary minus versus arrows, the reset at `Pr(`, a depth-128 boundary case, and the full goal still accepted.
  - One Chromium test showing the page stays responsive with the malformed minus line in the conclusion.
- **R4. Docs.** Document the new check in `DECISION_SEMANTICS.md` and the CHANGELOG. Reword the `check_expression_size` comment so it describes lexical, parenthesis and prefix-depth limits, not complete recursion protection.

**Everything else satisfies the gate:**
- the parser and compiler share one probability-limit constant;
- the boundary tests are arithmetically correct;
- the full goal with Regular off and empty premises entails, the zero-support case entails, and the false appended clause does not entail;
- all ten frozen file hashes match the snapshot;
- the 187 focused unit tests pass.

**Non-blocking:**
- `PROJECT.md:70–71` still lists the old Phase-1 limits.
- The verification wording should say the exact-2,048-token result applies to the tested input shape, not to every input of that length.

The evidence and probe scripts are in `reviews/expression_limits_2026-10-13T11-40-23-039Z/claude-probe/`. No production code, tests, fixture, package or frozen documents were changed.

VERDICT: AGREE

