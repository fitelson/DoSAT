# Consensus debate — 2026-10-12 19:01

## Question
# Debate: simplify DoSAT's Z3 constraint sets

The user requests a Claude-Codex debate on simplifying the constraints sent to
Z3, and specifically notes that PrSAT has a very simple constraint generator.
Produce a concrete, sound optimization design, not a general audit.

Workspace: /Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus.
Baseline published commit: 0f519c08d0f478be001b3cfe31142389ed6056f9.
The current uncommitted phase adds a Pearl-style admissions/aptitude preset and,
at the user's explicit request, removes the entailment consistency preflight.
Entailment now directly searches premises AND Boolean failure of the already
guarded conclusion. SAT checks the active premise constraints.
Default engine remains QF_NRA-first, with a 60-second budgeted attempt and the
existing explicit complete NLSat fallback. Do not change engine defaults.
The user requested killing running solver jobs while working on optimization.
All our native solver/server jobs have been stopped and termination verified.

## Concrete performance case

Current full input:
reviews/pearl_direct_entailment_2026-10-12T21-55-28Z/Simpson-Pearl-entailment.smt2
has 73,407 bytes, 14 CPT mechanism variables and 704 arithmetic auxiliaries
(718 reals total). The corresponding SAT input has 40,654 bytes, 14 mechanisms
and 384 auxiliaries (398 total).
It is a five-event graph with fourteen specified positive mechanisms, not
hundreds of causal events. The first arithmetic alias is 1 - p_Z_10.

The default direct-entailment browser run reached a WebAssembly out-of-memory
abort around the 2 GiB memory limit; no native verdict was established. Its
UI remained searching. The server's tool output and RESOURCE_EVIDENCE.md record
that concrete event. Do not rerun that unoptimized huge solver input.

src/causal_decision.ts PolynomialLowering allocates a new real for every +,-,*
operation, every guarded total quotient and repeated-squaring step.
Memoization uses object identity (WeakMap), not structural equivalence.
src/causal.ts constructs row products across all graph variables before summing
events. It does not generally prune irrelevant ancestors or simplify conditional
probabilities given a node's parents.
The inherited PrSAT generator is src/pr_sat.ts around lines 1020 and1285-1419.
Compare its direct arithmetic emission rather than assuming it must inherit
DoSAT's auxiliary-per-operation representation. Its current stable sibling is
/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT 3.0/PrSAT-main/src/pr_sat.ts.
That sibling is read-only and remains under the family push freeze.

## Nonnegotiable semantic obligations

Preserve the observed Boolean DAG model, all private-disturbance/Markov
constraints, shared mechanisms across hard interventions, exact source numerals,
arbitrary-precision arithmetic and all input/resource validation.
The causal matrix is not a free joint probability distribution: interventions
must use the same mechanism kernels.

Keep the existing partial-arithmetic satisfaction rules in DECISION_SEMANTICS.md.
In particular, division by zero in an unused disjunct must not exclude a model.
Explicit source negation has whole-scope definedness guards. Entailment negates
the already guarded satisfaction predicate and must retain undefined conclusion
countermodels; it must not append fresh global denominator guards.
No naive cancellation of x/x at x=0, sign-blind inequality multiplication,
or dropping definedness for zero powers/zero products.
Regular observational positivity does not remove all zero-support evidence
under interventions. Parent-CPT shortcuts must preserve support/definedness.

Retain detached exact witnesses and the returned-model evaluator's original
query semantics and assignments. Solver input optimizations must preserve
projection to the original mechanism/user variables. An arbitrary auxiliary
at an undefined quotient is not an extra causal mechanism.
The current polynomial lowering proof and 607-case independent oracle are
reference evidence, not an invitation to reopen unrelated old code.

## Questions to resolve

1. Can the QF_NRA path use PrSAT-style direct guarded arithmetic with far fewer
   or no explicit arithmetic auxiliaries, while retaining a polynomial complete
   fallback? What proof obligations and counterexamples govern this approach?
2. Which optimizations should happen before lowering: exact constant folding,
   structural DAG sharing, ancestor pruning / variable elimination, algebraic
   factor cancellation justified by normalization, full-parent conditional
   simplification, or elimination of trivial definitional aliases?
3. Which changes safely reduce both size and solver cost? Fewer variables alone
   is not an adequate performance conclusion. Preserve a bounded representation
   for large products, nested divisions and powers.
4. Recommend the smallest staged implementation and permanent regressions.
   Give a soundness argument for every accepted rewrite, qualifications for
   assumptions, rejected alternatives, and bounded benchmark acceptance criteria.
   Distinguish measured results from expectations.

Return a decision-ready compressed recommendation and an explicit design
verdict (recommended design is sound / requires repairs / unresolved).
This is a design debate, not the implementation's publication gate.
No code has been optimized yet.

## Work and durability rules

No production/source edits, no new servers, no unbounded solver runs, no full
general audit, no recursive debate or calls to other models, and no subagents.
Only write prototypes/evidence in your reserved participant directory:
prototypes/claude or prototypes/codex under this debate folder.
Small bounded pure-compilation checks and solver checks are permitted, with
explicit native timeout at most10 seconds and external wall limit at most20.
Record version, exact test input, output, size and time. A timeout/OOM is no
mathematical result.

At the start create/reset your own claude-checkpoints.md or codex-checkpoints.md
in this folder. Append a six-field checkpoint at least every15 minutes of work:
elapsed time, tentative verdict, new results, obstruction, next bounded step,
available token/cost figures. Use the runner's required checkpoint/verdict
protocol as well. Each returned report must be at most40,000 output tokens;
put longer detail in your reserved project files and return a compact path.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 35m 46s (3 turns); Codex: 17m 05s (2 turns); total: 52m 51s

## Agreed answer
# Simplifying DoSAT's Z3 constraint sets

**Design verdict: the design below is sound, with the qualifications stated.** No code has been changed yet, and no `src/` file was edited.

PrSAT-style inline guarded arithmetic is the main fix. It cuts the Simpson entailment input from 718 reals to 32. Every input that previously timed out, returned UNKNOWN or ran out of memory now settles in milliseconds.

Three further rewrites shrink inputs another 5–10× and usually reduce solve time:
- pruning each probability to its ancestors;
- cancelling shared mechanism factors while keeping their guards;
- a bounded fraction normal form.

One polynomial encoding goes to both the 60-second QF_NRA attempt and the explicit NLSat fallback, and engine defaults are unchanged. Every rewrite rests on one invariant: each arithmetic term sits inside a conjunction that contains its own definedness guards.

## Measured results

All runs used native Z3 5.0.0 with `-T:10 -memory:2048` and a 20 s external limit, or Node-hosted z3-solver 5.2.0 WASM with a 10 s solver timeout and a 20 s external limit. The unoptimized Simpson input was never run. A timeout or UNKNOWN is a resource result, not a mathematical one.

**Simpson entailment input:**

| Encoding | Size | Reals | Auxiliaries |
|---|---|---|---|
| Current | ≈73 KB | 718 | 704 |
| Stage A (inline) | 41,514 bytes (body) | 32 | 18 quotients |
| Stage C | ≈3.9 KB | 18 | 4 |

- The SAT-only Simpson body after Stage A is 24,041 bytes.
- At Stage C all 14 premises become linear pins such as `(= p_Z_00 (/ 1 16))`.
- On the dense 6-node stress input, Stage A is 84 KB against 159 KB for the current encoding.

**Round 1 solve times (single runs):**

| Input | Current encoding | Stage A | Stage C |
|---|---|---|---|
| Simpson entailment, native / WASM | not run | 14 / 90 ms | 5 / 34 ms |
| Berkson entailment, native / WASM | timeout / UNKNOWN at 10 s | 6 / 51 ms | 5 / 43 ms |
| Bias-amplification entailment, native / WASM | timeout / UNKNOWN at 10 s | 8 / 59 ms | 4 / 34 ms |
| 6-node front-door identity, native / WASM | timeout at 10 s (335 MB) / UNKNOWN | 134 / 636 ms | 59 / 278 ms |

**Round 2, matched pairs:** 33 pairs × 4 engine modes × 3 repeats, medians, with per-input SHA-256 hashes. Within each pair, only the quotient representation differs. Times are milliseconds; S1 and S3 are the inputs after Stage A and Stage C.

| Benchmark | Engine | S1 polynomial | S1 native `/` | S3 polynomial | S3 native `/` | Stage D polynomial |
|---|---|---|---|---|---|---|
| Simpson | WASM fast | 90 | 172 | — | — | — |
| H5 (6-node front-door) | WASM fast | 631 | 1059 | 263 | 75 | **40** |
| H5 | native default | — | — | 57 | 11 | **6** |
| N5 (6-node mediated) | WASM fast | — | — | 70 | 106 | **62** |
| N5 | native default | — | — | 9 | 14 | — |
| H1 | WASM fast | — | — | 57 | 53 | **39** |

- Stage D takes H5 from 18 reals and 4 auxiliaries to 14 reals and none.
- Some rows still keep quotients after Stage D: bias amplification, front-door, and three synthetic cases. On those, polynomial and native `/` tie within ±2 ms on all four engine modes.

**Verdict agreement.** Every settled verdict agrees across all encodings, stages and engines. The inputs were:
- the 7 presets;
- 3 partial-arithmetic stress cases;
- 5 front-door/backdoor identities;
- 5 unpinned Simpson-reversal inequalities;
- a dense 6-node graph;
- the 6 pinned counterexamples.

**Exact differential test.** It ran 432,000 checks (20 problems × 5 stages) with 0 mismatches. It compares the guarded satisfaction predicate of each stage's lowered formula, evaluated exactly in BigInt rationals, against the original.

**Native-division equivalence.** Eight bounded symbolic checks were all UNSAT, meaning no assignment separates native `/` from the total-quotient relation. They covered nested division, unused undefined disjuncts, explicit negation, and undefined-conclusion countermodels.

**Powers.** A squaring chain, inline copies, one auxiliary and `define-fun` used the same memory and timed out identically at exponents 64 and 1024, because Z3 rewrites all four to the same form. A bounded text representation therefore limits file size, not solver cost.

## 1. Direct guarded arithmetic and the complete fallback

**Answer: yes.** The QF_NRA path can use PrSAT-style inline arithmetic and keep a complete polynomial fallback.

Stage A removes every auxiliary for `+`, `−`, `×` and unary minus, and folds numeral-only arithmetic exactly. It keeps:
- one auxiliary per structurally distinct quotient `(n, d)`, constrained by the existing total relation `(or (= d 0) (= (* r d) n))`;
- the repeated-squaring chain for powers.

The output is still polynomial, so the complete NLSat fallback is unchanged. One existing test, `assert_polynomial`, must also accept `(/ p q)` when both arguments are numerals.

**Diagnosis on one case (not a general theorem).** On Berkson, Z3's equation solving solved for a mechanism (`p_X_root := 1 − aux_17`) instead of the auxiliary. Separately, memoizing by object identity creates duplicate aliases for structurally identical subterms.

**Proof obligations:**
- **PO1 – guard coverage.** Every arithmetic term sits in a conjunction that contains the nonzero guard of every division and negative-power base inside it. This holds for:
  - atoms (`with_definedness`);
  - explicit negation (`D_all ∧ ¬R`, the whole-scope guard);
  - guard terms themselves, because the guards of a denominator's own subterms sit in the same conjunction.
- **Local rewrite lemma (from PO1).** Replacing a term by one equal to it wherever its guards and the mechanism bounds B hold leaves the guarded satisfaction formula unchanged on B. B is a top-level conjunct of both the SAT formula and the countermodel formula, so equivalence on B is enough.
- **PO2 – inlining.** `∃y(y = t ∧ φ(y)) ⇔ φ(t)`, so the existing lowering lemmas carry over with a term in place of a fresh variable. Projection onto the original mechanism and user variables is unchanged.
- **PO3 – merging identical quotients.** They agree wherever d ≠ 0. At d = 0 the auxiliary's value never affects satisfaction, because the guard d ≠ 0 is false in every block that uses it. An arbitrary auxiliary value at an undefined quotient is therefore not an extra causal mechanism.

**Native `/` is sound but only an option.**
- **Soundness argument.**
  - At nonzero denominators, SMT division agrees with real division.
  - At zero its value is unspecified, but it cannot affect the guarded predicate: the innermost undefined operation makes its own guard false, including the whole-scope guard for explicit negation.
  - Induction over the Boolean structure then covers disjunction, implication, the biconditional, and the complement of the guarded conclusion.
  - Repeated `x/0` occurrences share one function interpretation (congruence), and that cannot restrict satisfaction either.
- **Why it is not the default.**
  - It projects onto the same original variables as the total-quotient relations, so it could feed the fast attempt.
  - NLSat completeness would still come only from the polynomial fallback.
  - After Stage D, it tied or lost on every matched input.
  - Adopt it for the fast attempt only if the production benchmark matrix shows a consistent win. If adopted, both inputs must come from one immutable representation authenticated by the compiler.

## 2. Rewrites before lowering

| Candidate | Decision | Soundness argument / qualification |
|---|---|---|
| Exact constant folding | **Accept (PO4)** | Uses BigInt rationals and keeps source numerals exact. Guards are generated from the unfolded AST *before* folding, so `0·(1/Pr(X))` and `Pr(Y\|X)^0` keep their definedness guards (CE5, CE5b). |
| Ancestor pruning / variable elimination | **Accept (PO5)**, in the solver input only | Sum only over ancestors of the event's letters in the graph with the intervened nodes' incoming edges removed. Each non-ancestor, taken sinks first, sums out as k + (1 − k) = 1. That is an identity over all reals, so it holds inside guards and outside the bounds. Constant mechanism factors are then pulled out of the row sum. Rows of zero mass stay a literal 0, so impossible post-intervention evidence keeps a false guard. |
| Guarded factor cancellation | **Accept (PO6)** | Cancel common mechanism factors, and a shared sum when both sides have the same structural key, but always keep `D ≠ 0` in the same conjunction. Never cancel x/x at x = 0 or cancel before guards are generated (CE1). |
| Full-parent conditional shortcut | **Accept, as a special case of PO6** | `Pr_I(x \| pa) → k_x(pa)` is valid only for an unintervened child with exact full-parent evidence, keeping the regime-specific guard `Pr_I(pa) ≠ 0`. Counterexample for an intervened child: `Pr(Y \| do(Y), X) = 1` when defined, though the CPT entry may be 1/2. Contradictory intervention evidence stays undefined (CE2). Descendant evidence is never dropped: on `X → Y → Z`, `Pr(Y \| X, Z)` stays the quotient k_Y·k_Z / Σ. Deriving everything from masses in the graph with the intervened nodes' parent edges removed gives all of this automatically. |
| Factor-wise guards and simplification by bounds | **Accept (PO7, PO8)** | Over the reals a product is nonzero exactly when each factor is. On B: q ≠ 0 becomes q > 0, 1 − q ≠ 0 becomes q < 1, and a nonempty mass sum M ≠ 0 becomes M > 0. Under regularity these guards fold to true, and a quotient whose denominator is a *mass* drops its `d = 0` disjunct. A *user-written* arithmetic denominator keeps that disjunct (CE6). Regularity of the observed probabilities does not make every conditional on interventional evidence defined (CE2). |
| Guarded fraction normal form | **Accept (Stage D, PO11)** | See §3. |
| Trivial definitional aliases (e.g. `1 − p_Z_10`) | **Disappear under Stage A** | Covered by PO2. |
| Structural DAG sharing | **Accept for quotients only** | Covered by PO3. Text-level `define-fun`/`let` sharing is deferred: Z3 already shares identical subterms internally, and the power experiment showed no cost difference. |
| General GCD cancellation, broader variable elimination | **Defer** | No measured need, and harder to prove. |

**PO9 – entailment.** Each accepted rewrite preserves the guarded conclusion on B, so the Boolean negation of that conclusion is preserved too. Undefined conclusions remain countermodels, and no global denominator guard is ever added (CE4).

**PO10 – witnesses.** The ancestral mass builder is solver-only. The existing `distributions` and `queries` still build the detached exact witness, so the evaluator's original query semantics and assignments are unchanged.

## 3. Changes that reduce both size and solver cost

- **Stage A is the dominant reduction.** All four previously failing inputs go from 10 s timeouts, UNKNOWN or out-of-memory to millisecond solves.
- **Stages B and C** cut size another 5–10× and roughly halve time on the larger inputs.
- **Stage D (guarded fraction normal form).** It fixes a cost that variable count alone hides.
  - **The H5 problem.** H5's front-door formula multiplies `Pr(Y | X & M)` by `Pr(X)`. After cancellation, the mass of `Pr(X)` is exactly the quotient's reduced denominator. Yet the S3 polynomial emitter still kept four `r·d = n` auxiliaries, each then multiplied by `d`.
  - **What Stage D does.** It applies only to comparisons whose sides are built from polynomials and *mass* quotients. It represents each side as numerator and denominator factor lists, then:
    - cancels structurally identical factors;
    - combines fractions over a common denominator;
    - cross-multiplies the comparison.
  - **Fallback.** It falls back to Stage C's quotient auxiliaries beyond a cap of 8 denominator factors, and always for user-written arithmetic quotients.
  - **Soundness (PO11).** Every denominator factor is a reduced mass denominator D′ with original D = c·D′. The guard D ≠ 0 in the same conjunction gives D′ ≠ 0, and B gives D′ ≥ 0, so D′ > 0 wherever the comparison matters. On that region:
    - (a) cancelling a factor shared with a denominator is valid, because the factor is nonzero;
    - (b) a/b ± c/d = (ad ± cb)/(bd);
    - (c) (a/b) op (c/d) ⇔ a·d op c·b, because b and d are positive;
    - (d) structurally identical sides give the reflexive truth value.

    Where source arithmetic is undefined, its kept guard makes the block false, which preserves explicit negation and entailment's complement. Guards are never rewritten.
  - **Resource qualification.** The 8-factor cap bounds only denominator growth, not numerator degree, expression size or solver cost: adding fractions multiplies each numerator by the other side's denominator. Production Stage D must therefore:
    - keep numerators in factored form;
    - estimate each comparison's size and degree early, against the existing whole-input budgets (the expansion limit, the 2,000,000-character limit and the 20,000-auxiliary limit, all still hard errors);
    - fall back to Stage C when the estimate exceeds them.

    The fallback is the already-proven Stage C encoding.
- **Bounded representation is kept.** This means repeated-squaring chains for powers and structurally shared quotient auxiliaries for nested divisions, plus selective aliases where text cost justifies them. Shorter text does not guarantee cheaper nonlinear solving, and the power result above is specific to those inputs.

## 4. Staged implementation

1. **Stage A (smallest, required).**
   - Lowering in `PolynomialLowering`:
     - inline `+ − ×` and unary minus;
     - fold numerals exactly, after guards are generated;
     - share quotient auxiliaries by structural key;
     - keep total quotient relations and squaring chains.
   - **Witness check**, after a SAT result or a countermodel and under the existing cancellation and settlement ownership:
     - evaluate the *original* guarded premises exactly and require each to be true;
     - for a countermodel, also require the guarded conclusion to be false;
     - unused undefined disjuncts pass;
     - on failure, report an unresolved/error result, never SAT and never an UNSAT certificate;
     - it is not a consistency preflight.
2. **Stage B.** Add a solver-only ancestral mass builder in `causal.ts` that pulls out constant mechanism factors.
3. **Stage C.** Add guarded mechanism-factor cancellation, factor-wise guards simplified by the bounds, and the mass-denominator quotient relation without its `d = 0` disjunct.
4. **Stage D.** Add the bounded guarded fraction normal form, with an early size check and fallback to Stage C.

Through every stage, keep these unchanged:
- QF_NRA first with its 60-second attempt, then explicit NLSat;
- all mechanisms and user assignments, and the mechanism kernels shared across interventions;
- the private-disturbance/Markov constraints;
- exact numerals and all input and resource validation.

**Rejected alternatives:**
- sign-blind inequality multiplication, or cross-multiplying any denominator not proven positive;
- cancelling or folding before guards are generated;
- global denominator guards in entailment;
- dropping the `d = 0` disjunct for user-written denominators;
- treating regularity as making every conditional defined;
- dropping descendant evidence in parent shortcuts.

Native `/` is admissible but deferred, as explained in §1.

**Permanent regressions:**
- The exact differential test, run against the production lowering at each stage.
- The independent 607-case causal oracle and its native replay. The differential test complements the oracle and does not replace it.
- The pinned counterexample inputs as unit tests. Current and optimized encodings already agree on each:
  - **CE1:** nonregular `Pr(X)=0, Pr(Y|X)=1/2` is UNSAT. Cancelling without the guard would make it SAT.
  - **CE2:** regular `Pr(Y|do(X),~X)=1/2` is UNSAT. Assuming regularity makes every conditional defined would make it SAT.
  - **CE4:** `Pr(X)=0` does not entail `Pr(Y|X)=1/2`; a countermodel exists. Global guards would wrongly report that the entailment holds.
  - **CE5 / CE5b:** `0*(1/Pr(X))=0` and `Pr(Y|X)^0=1` with `Pr(X)=0` are UNSAT. Folding before guards would make them SAT.
  - **CE6:** `x/(Pr(Y)−1/2)=3 v Pr(Y)=1/2` with `Pr(Y)=1/2, x=1` is SAT. Dropping the user-denominator `d = 0` disjunct would make it UNSAT.
- A test that two occurrences of `Pr(Y|X)` share one quotient auxiliary.
- Intervention-support and full-parent qualification tests, covering the intervened child and descendant evidence.
- Tests of the representation limits and the Stage D fallback.
- Tests that witness validation and the evaluator keep the original assignments.
- Regression checks of fallback and cancellation behaviour.
- No stage may make a preset input larger than the current encoding.

**Acceptance criteria for each stage.** These apply to the 7 presets plus the 10 identity and inequality benchmarks:
- every verdict matches its expected value;
- native runs settle in ≤ 1 s, and WASM fast and complete runs in ≤ 2 s;
- the differential test reports 0 mismatches;
- the 607-case oracle passes;
- Simpson entailment is ≤ 45 KB and ≤ 40 reals after Stage A, and ≤ 5 KB and ≤ 20 reals after Stages C and D;
- the browser Simpson run finishes with ENTAILS and no out-of-memory abort, and witness-validation cost is measured.

**Measured versus expected:**
- **Measured:** all sizes, timings, verdicts and differential results above. They come from native Z3 5.0.0 and Node-hosted z3-solver 5.2.0 WASM. Round 2 used three repeats with medians and hashes; round 1 timings were single runs.
- **Expected but not measured:**
  - browser memory and timing, including Simpson without out-of-memory;
  - the cost of witness validation;
  - generalization beyond these inputs.

These belong to implementation acceptance, which is a separate gate from publication.

**Evidence** (all under `reviews/constraint_optimization_2026-10-12T22-05-42Z/prototypes/`):
- `claude/REPORT.md` and `claude/REPORT_ROUND2.md`;
- the prototype compiler `claude/opt.ts`, with tests `opt.spec.ts`, `ce.spec.ts` and `stress.spec.ts`;
- results and hashes: `matched-results.json`, `s5-results.json`, `s5-matched-results.json`, `hashes*.txt`;
- the inputs that were run, in `claude/out/`;
- `codex/REPORT.md` and `codex/REPORT_ROUND2.md`, with `compare-results.json`, `guard-miters.json` and the matched H5 inputs.

## Claude  (verdict: DISAGREE, 27m 31s)
CHECKPOINT
elapsed: ~60 min wall-clock
tentative_verdict: the recommended staged design is sound. Stage A is the smallest and is required: inline lowering plus a witness certificate. Stage B prunes to ancestors. Stage C cancels shared mechanism factors while keeping each guard, and splits guards into factors that the mechanism bounds simplify. Three alternatives are deferred or rejected: cross-multiplication, direct `/` emission, and GCD/`define-fun` sharing.
new_results: NEW: I built a prototype compiler with four stages and an exact differential test: 345,600 checks with 0 mismatches. Bounded native Z3 5.0.0 and WASM z3-solver 5.2.0 runs cover 26 inputs plus 6 counterexample inputs. Stage A alone settles every baseline timeout or UNKNOWN in milliseconds.
current_obstruction: none. The browser-level Simpson run is not measured here; it belongs to the implementation phase.
next_bounded_step: answer Codex's objections in round 2
token_cost: unavailable
END CHECKPOINT

**Answer:** the design is sound, staged A → B → C. Stage A alone resolved every slowdown I could measure, including the Simpson input that ran out of memory. All evidence is in `prototypes/claude/`: `REPORT.md`, the prototype `opt.ts`, the test `opt.spec.ts`, raw JSON/logs, and every `out/*.smt2` input that was run. No `src/` file was edited. The unoptimized Simpson inputs were not run.

## Measured results

Every solver run was bounded: `-T:10 -memory:2048` with a 20 s external limit for native runs, and a 10 s solver timeout with 20 s external for WASM.

**Simpson entailment input size (bytes / reals):**

| Encoding | Bytes | Reals | Auxiliaries |
|---|---|---|---|
| Current | 73,045 | 718 | 704 |
| Stage A (inline) | 31,964 | 32 | 18 quotients |
| Stage C | 3,939 | 18 | 4 |
| Cross-multiplication (deferred) | 3,619 | 14 | 0 |

At Stage C all 14 premises become linear pins such as `(= p_Z_00 (/ 1 16))`.

**Solve times:**

| Input | Current encoding | Stage A | Stage C |
|---|---|---|---|
| Simpson entailment, native | not run | 14 ms | 5 ms |
| Simpson entailment, WASM | not run | 90 ms | 34 ms |
| Berkson entailment, native | timeout at 10 s | 6 ms | 5 ms |
| Berkson entailment, WASM | UNKNOWN at 10 s | 51 ms | 43 ms |
| Bias-amplification entailment, native | timeout at 10 s | 8 ms | 4 ms |
| Bias-amplification entailment, WASM | UNKNOWN at 10 s | 59 ms | 34 ms |
| 6-node front-door identity, native | timeout at 10 s (335 MB) | 134 ms | 59 ms |
| 6-node front-door identity, WASM | UNKNOWN at 10 s | 636 ms | 278 ms |

- **Agreement:** every settled answer agrees across all encodings and both engines. The inputs were the 7 presets, 3 partial-arithmetic stress cases, 5 front-door/backdoor identities, 5 unpinned Simpson-reversal inequalities, a dense 6-node graph, and 6 counterexamples.
- **No regressions:** no stage made any benchmark slower.
- **Direct `/` emission (PrSAT style)** works on both engines but was always slower than Stage A.
- **Powers:** four encodings (squaring chain, inline copies, one auxiliary, `define-fun`) used identical memory and timed out identically at exponents 64 and 1024. Z3 rewrites them all to the same form. A bounded text representation therefore limits file size, not solver cost.

## 1. Direct guarded arithmetic

Yes. Stage A removes every auxiliary for `+`, `-`, `*` and unary minus. It keeps one auxiliary per structurally distinct quotient `(n, d)`, with the existing relation `(or (= d 0) (= (* r d) n))`, and the squaring chain for powers. Numeral-only arithmetic is folded exactly with BigInt rationals.

The output is still a polynomial formula, so the complete NLSat fallback is unchanged. One test needs adjusting: `assert_polynomial` should accept `(/ p q)` with numeral arguments only.

On Berkson, I saw that Z3's equation solving solved for the mechanism (`p_X_root := 1 - aux_17`) instead of the auxiliary. The object-identity memoization also creates duplicate aliases. This is a diagnosis of one case, not a general theorem.

Proof obligations:
- **PO2:** `∃y(y = t ∧ φ(y)) ⇔ φ(t)`, so the existing Lemma 1 and Lemma 2 carry over with "term" in place of "variable".
- **PO3:** merging identical quotients is sound. They agree when d ≠ 0, and Lemma 2 says the value at d = 0 never affects satisfaction.

## 2. Rewrites before lowering

Every rewrite rests on one invariant, PO1 (guard coverage). Each arithmetic term occurrence sits in a conjunction that contains the nonzero guard of every division and negative-power base inside it. This holds for atoms (`with_definedness`), for explicit negation (`D_all ∧ ¬R`), and for guard terms, because the guards of a denominator's own subterms sit in the same conjunction.

From this, a local rewrite lemma follows. Replacing a term by one equal to it wherever its guards and the mechanism bounds B hold leaves the satisfaction formula unchanged on B.

Decision on each candidate rewrite:
- **Exact constant folding:** accept (PO4). Guards are generated from the unfolded AST before lowering.
- **Ancestor pruning:** accept (PO5). Sum only over ancestors of the event's letters in the graph with intervened nodes' incoming edges removed, then factor out mechanism factors that are constant across rows. Because q + (1 − q) = 1, this is a polynomial identity over all reals, so it is valid inside guards too.
  - Zero-row masses stay literal 0, so impossible post-intervention evidence keeps a false guard.
- **Guarded cancellation:** accept (PO6). Cancel common mechanism factors, and the shared sum when both sides have the same structural key, while keeping `D ≠ 0`.
  - Full-parent conditionals are the special case `Pr_I(x | pa) → k_x(pa)`, with the guard `Pr_I(pa) ≠ 0` kept.
- **Factor-wise guards:** accept (PO7, PO8). Over the reals, a product is nonzero iff each factor is.
  - On B: `q ≠ 0 → q > 0`, `1 − q ≠ 0 → q < 1`, and a nonempty mass sum `M ≠ 0 → M > 0`.
  - With regularity, these guards become `true`, and a quotient with a mass denominator drops its `d = 0` disjunct.
  - B is a top-level conjunct of both the SAT and the countermodel formula, so equivalence on B suffices.
- **Entailment:** PO9. Each rewrite preserves the guarded conclusion on B, so its Boolean negation is preserved too. No global guard is added.
- **Trivial aliases:** they disappear under Stage A.
- **General GCD cancellation and variable elimination:** deferred; no measured need.
- **DAG sharing:** accepted for quotients only. Z3 already shares identical subterms internally, so text-level sharing (`define-fun`, `let`) is deferred.

## 3. Size and cost

- Stage A gives the dominant cost reduction.
- Stages B and C cut size by another 5–10× and roughly halve time on the larger inputs.
- Cross-multiplication is sound only for reduced mass denominators, which are positive under guard plus B. It gained ≤ 1 ms and raises degree, so I defer it.
- Inline text stays bounded. On the dense 6-node stress, Stage A was 84 KB against 159 KB for the current encoding. The existing expansion limit and the 2,000,000-character and 20,000-auxiliary limits remain hard errors.

## 4. Staged plan and regressions

- **Stage A:** change `PolynomialLowering` as above, and add a witness certificate. After SAT, evaluate the original guarded premises in the model and require each to be `true`. For a countermodel, also require the guarded conclusion to be `false`. Otherwise report an error, never SAT.
- **Stage B:** a solver-only ancestral mass builder in `causal.ts`. The existing `distributions` and `queries` stay for the witness, so its exact assignments and query semantics are unchanged (PO10).
- **Stage C:** guarded cancellation and factor-wise guards.

**Pinned counterexamples** (current and optimized encodings give the same answer on each):
- **CE1:** nonregular `Pr(X)=0, Pr(Y|X)=1/2` is UNSAT. Cancelling without the guard would make it SAT.
- **CE2:** regular `Pr(Y|do(X),~X)=1/2` is UNSAT. "Regularity makes every conditional defined" would wrongly make it SAT.
- **CE4:** `Pr(X)=0` does not entail `Pr(Y|X)=1/2`. Adding global guards would wrongly report ENTAILS.
- **CE5:** `0*(1/Pr(X))=0` and `Pr(Y|X)^0=1` with `Pr(X)=0` are UNSAT. Folding before generating guards would make them SAT.
- **CE6:** `x/(Pr(Y)-1/2)=3 v Pr(Y)=1/2` with `Pr(Y)=1/2, x=1` is SAT. Dropping the `d = 0` disjunct for a user-written denominator would make it UNSAT.

**Rejected:** sign-blind cross-multiplication, cancellation before guards, and direct `/` emission. Direct `/` would split the encoding between the two engines and rest NLSat completeness on Z3's internal handling of division by zero.

**Permanent regressions:**
- The exact differential test (§2.3 of the report), run against the production lowering at each stage.
- The 607-case oracle and its native replay.
- CE1–CE6 as unit tests.
- A test that two occurrences of `Pr(Y|X)` share one quotient auxiliary.
- No stage may make a preset input larger than the current encoding.

**Acceptance per stage** (7 presets plus the 10 identity and inequality benchmarks):
- Every verdict matches its expected value.
- Native runs settle in ≤ 1 s, and WASM fast and complete runs in ≤ 2 s.
- Simpson entailment has ≤ 40 reals / 35 KB after Stage A and ≤ 20 reals / 5 KB after Stage C.
- The differential test reports 0 mismatches.
- The Simpson browser run finishes ENTAILS without running out of memory. This is not measured here; it belongs to the implementation phase.

**Measured versus expected:** everything above was measured on native Z3 5.0.0 and on z3-solver 5.2.0 WASM under Node. Browser memory and timing, and generalization beyond these inputs, are expectations.

**Design verdict: the recommended design is sound** (Stages A–C with the stated qualifications). Codex has not yet reviewed it.

VERDICT: DISAGREE

## Codex  (verdict: DISAGREE, 13m 44s)
CHECKPOINT
elapsed: ~11 min of active work in the completed research tranche; recovery report only
tentative_verdict: DISAGREE on rejecting native division; qualified A–C optimizations are sound
new_results: NONE: no new research in this recovery tranche; decisive completed results are preserved below
current_obstruction: Claude’s encoding recommendation and precise size/performance claims require revision
next_bounded_step: Claude should address the matched encoding comparison and correct the evidence; this tranche is complete
token_cost: unavailable
END CHECKPOINT

I endorse the mathematical core of A–C: inline ordinary polynomial operations, fold exact constants without losing original guards, prune irrelevant ancestors, and cancel shared factors while preserving support and definedness. I do not endorse rejecting native `/` for the default QF_NRA attempt.

The decisive result is a **matched comparison after identical optimizations**. I changed only quotient representation in your optimized inputs, retaining all terms, bounds, guards, and other rewrites.

| Input | Polynomial WASM fast / complete | Native `/` WASM fast / complete |
|---|---:|---:|
| Simpson A | 89 / 96 ms | 167 / 175 ms |
| Simpson C | 31 / 32 ms | 33 / 35 ms |
| Six-node front-door A | 626 / 628 ms | 1040 / 1076 ms |
| Six-node front-door C | 264 / 266 ms | **77 / 78 ms** |

For front-door C, native default time also fell from 57.8 ms to 11.0 ms. All 32 matched native/WASM checks returned UNSAT. Native Z3 was 5.0.0; Node-hosted z3-solver was 5.2.0. Every check used a solver/native limit of 10 seconds and external wall limit of 20 seconds. These are single-run measurements, not statistical guarantees or browser results. The unoptimized Simpson input was not run.

This evidence shows that the preferred representation can change after pruning and cancellation. It defeats a categorical rejection of direct arithmetic.

Direct division also has a soundness argument independent of fallback completeness. At nonzero denominators, SMT division agrees with ordinary real division. At zero, its unspecified value cannot affect the retained guarded satisfaction predicate: an innermost undefined operation makes its guard false, including the whole-scope guard for explicit source negation. Boolean induction then covers disjunction, implication, biconditional, and the complement of the guarded conclusion. Repeated zero divisions sharing a function interpretation cause no restriction on satisfaction.

Your total quotient relations have the same projection onto original mechanism/user variables. Therefore the existing budgeted QF_NRA attempt may receive native arithmetic while explicit NLSat receives the optimized polynomial encoding. **Completeness remains attached to the polynomial fallback.** Eight bounded symbolic mismatch checks—including nested division, unused disjuncts, explicit negation and undefined conclusion countermodels—were UNSAT and support this argument.

Two qualifications remain necessary:

- The full-parent shortcut requires an **unintervened child**, exact full-parent evidence, and nonzero regime-specific support. On `X -> Y`, `Pr(Y | do(Y), X)=1` when defined, while the original CPT may be 1/2. Contradictory intervention evidence remains undefined; descendant evidence cannot be discarded.
- Keep structural sharing and bounded representation before serialization. Use repeated-squaring chains and selective aliases when justified by text cost. Shorter text does not guarantee cheaper nonlinear solving; the power experiment is instance-specific.

The evidence also needs correction. Current Simpson A is **41,514 body bytes**, rather than 31,964; SAT A is 24,041 rather than 18,293. Thus its proposed 35 KB ceiling fails the current prototype. The logs also contain millisecond-scale timing increases and one direct-division improvement, so “no benchmark became slower” and “direct division was always slower” are overly strong. The 345,600 differential checks complement, rather than replace, the independent 607-case causal oracle.

The smallest staged recommendation remains A → B → C. Uniform polynomial output is a sound first patch. After common rewrites, retain native emission as a candidate for the default fast attempt and polynomial emission for complete fallback. Confirm the choice with the bounded production regression matrix. Both inputs should derive from one immutable, compiler-authenticated representation, preserving original witnesses, assignments and query semantics.

Add exact witness validation of original guarded satisfaction, with existing cancellation and settlement ownership. This must permit unused undefined disjuncts and must not become a consistency preflight. Failed validation yields an unresolved/error result; it cannot justify an unsound rewrite or certify UNSAT.

Browser Simpson behavior and full witness costs remain unmeasured. They belong to implementation acceptance, alongside the existing oracle, partial-arithmetic counterexamples, representation limits, fallback and cancellation regressions.

Supporting inputs, hashes, outputs and reasoning are preserved in [prototypes/codex/REPORT.md](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/constraint_optimization_2026-10-12T22-05-42Z/prototypes/codex/REPORT.md).

**Design verdict:** the qualified optimization core and paired-emitter design are sound. Claude’s current recommendation requires revision before agreement.

VERDICT: DISAGREE

## Claude  (verdict: DISAGREE, 7m 42s)
CHECKPOINT
elapsed: ~95 min wall-clock (about 35 min this round)
tentative_verdict: Stages A–D sound with one polynomial encoding for both engines. Native `/` in the fast attempt is also sound; it is now an option adopted only if benchmarks show a consistent win, not a rejected alternative.
new_results: NEW: 33 matched pairs × 4 engines × 3 repeats. At S1 the polynomial encoding wins; at S3 the results are mixed (H5 favours `/`, N5 favours polynomial). A new Stage D (guarded fraction normal form) closes the H5 gap: WASM fast 263 / 75 / 40 ms for S3 polynomial, S3 `/` and D polynomial. Differential: 432,000 exact checks, 0 mismatches. Where D still leaves quotients, polynomial and `/` tie within ±2 ms.
current_obstruction: none
next_bounded_step: Codex confirms Stage D and that the fast attempt uses polynomial input by default, with native `/` gated on the benchmark matrix
token_cost: unavailable
END CHECKPOINT

**Answer:** Codex was right that native `/` cannot be rejected outright, and right on every evidence correction. The H5 gap that motivated native `/` turned out to be a missing guarded cancellation in the polynomial emitter. With that cancellation added (Stage D), the polynomial encoding was as fast as native `/` or faster on every benchmark I measured. I now recommend one polynomial encoding for both engines and keep native `/` as a sound option gated on benchmarks. New material is in `prototypes/claude/REPORT_ROUND2.md`; per-input SHA-256 hashes are in `matched-results.json`, `s5-results.json` and `s5-matched-results.json`.

## Where I agree with Codex

- **Simpson sizes.** I verified the correction. After Stage A the entailment body is 41,514 bytes and the SAT body 24,041. My 31,964 / 18,293 came from an earlier prototype configuration that already dropped the `d = 0` disjunct using the mechanism bounds. The Stage A ceiling becomes ≤ 45 KB and ≤ 40 reals.
- **Overstated claims.** "No stage increased time" and "direct `/` was always slower" were too strong; the differences were millisecond single-run noise. My round-1 logs also lacked per-run hashes. All round-2 tables are hashed, repeated 3 times, and report the median.
- **Native `/` soundness.** Codex's argument is the same guard-coverage argument as my PO1–PO3. A value at a zero denominator never affects the guarded satisfaction predicate, including Z3's congruence for repeated `x/0`. The paired-emitter design is sound, and I withdraw "rejected".
- **Full-parent qualifications.** I agree: the child must be unintervened, the evidence must be the exact full parent assignment, support must be regime-specific, and descendant evidence cannot be dropped. My prototype has no special-case shortcut; it derives everything from masses in the graph with intervened nodes' parent edges removed. So `Pr(Y | do(Y), X)` becomes 1 when defined. With descendant evidence on `X -> Y -> Z`, `Pr(Y | X, Z)` stays the quotient (k_Y·k_Z) / sum rather than k_Y. The `W & X | Y` premise in the differential test covers the descendant case.
- **Witness check.** It evaluates the original guarded predicate, so unused undefined disjuncts still pass. It runs only after SAT or a countermodel, so it is not a consistency preflight. A failure yields an error, never SAT and never an UNSAT certificate.
- **The 607-case oracle** must still be rerun; my differential test complements it.
- **Representation limits.** Keep the squaring chains for powers, and use selective aliases where text cost justifies them.

## Where the evidence changes the recommendation

**1. Broad matched replication.** Each pair uses an identical optimized input with only the quotient representation changed.

- At S1, polynomial was faster or tied everywhere. Simpson WASM fast was 90 ms polynomial vs 172 ms `/`; H5 was 631 vs 1059 ms.
- At S3 most pairs tie, with two exceptions pointing in opposite directions:

| Benchmark at S3 | Polynomial | Native `/` |
|---|---|---|
| H5, WASM fast | 263 ms | 75 ms |
| H5, native default | 57 ms | 11 ms |
| N5 (6-node mediated), WASM fast | 70 ms | 106 ms |
| N5, native default | 9 ms | 14 ms |

The S3 evidence therefore establishes no general preference.

**2. Why H5 was slow.** Its front-door formula multiplies `Pr(Y | X & M)` by `Pr(X)`. After the shared mechanism factor cancels, the mass of `Pr(X)` is exactly the quotient's reduced denominator. The S3 polynomial emitter kept four quotient auxiliaries of the form `r·d = n`, each then multiplied by `d`.

**3. New Stage D: guarded fraction normal form.** It replaces the earlier cross-multiplication stage. It applies only to comparisons whose two sides are built from polynomials and mass quotients:

- Represent each side as numerator and denominator factor lists.
- Cancel structurally identical factors.
- Add fractions over a common denominator.
- Cross-multiply the comparison, which is safe because both denominators are positive.

There is a cap of 8 denominator factors; beyond it, and for any user-written arithmetic quotient, it falls back to Stage C's quotient auxiliary.

| Benchmark | Engine | S3 polynomial | S3 native `/` | Stage D polynomial |
|---|---|---|---|---|
| H5 | WASM fast | 263 ms | 75 ms | **40 ms** |
| H5 | native default | 57 ms | 11 ms | **6 ms** |
| N5 | WASM fast | 70 ms | 106 ms | **62 ms** |
| H1 | WASM fast | 57 ms | 53 ms | **39 ms** |

- H5 drops from 18 reals and 4 auxiliaries to 14 reals and 0 auxiliaries.
- On the rows where Stage D still keeps quotients (bias amplification, front-door, and three synthetic cases), polynomial and `/` tie within ±2 ms on all four engines.
- All verdicts agree on every engine.
- The exact differential test now covers 20 problems × 5 stages: 432,000 checks, 0 mismatches.

**Why Stage D is sound.** Every denominator in a factor list is a reduced mass denominator D′. The original denominator is D = c·D′, and its guard D ≠ 0 sits in the same conjunction, so D′ ≠ 0. On the mechanism bounds D′ ≥ 0, so D′ > 0. On the region where the guards and bounds hold:

- (a) cancelling a factor shared with a denominator is valid, because that factor is nonzero;
- (b) a/b ± c/d = (ad ± cb)/(bd);
- (c) (a/b) op (c/d) ⇔ a·d op c·b, because b, d > 0;
- (d) structurally identical sides give the reflexive truth value.

The local rewrite lemma then gives equivalence of each guarded constraint on the bounds, and entailment's Boolean complement is preserved with it. Guards are never touched. The factor cap bounds degree and text size.

## Proposed consensus answer

- **Encoding.** One authenticated guarded representation feeds both the 60-second QF_NRA attempt and the NLSat fallback, using a single polynomial encoding. Engine defaults are unchanged.
- **Stages:**
  - **A:** inline `+ − ×`; structurally shared quotient auxiliaries; exact folding; squaring chains; witness check.
  - **B:** pruning to ancestors in the graph with intervened nodes' parent edges removed; constant mechanism factors pulled out.
  - **C:** guarded cancellation of shared mechanism factors; guards split by factor and simplified using the mechanism bounds; the regular quotient relation without its `d = 0` disjunct.
  - **D:** guarded fraction normal form.
- **Native `/` for the fast attempt:** sound and admissible, but adopt it only if the bounded production matrix shows a consistent win over the Stage D input. After Stage D it currently does not.
- **Acceptance criteria:**
  - Stage A: ≤ 45 KB and ≤ 40 reals for Simpson entailment.
  - Stage C/D: ≤ 5 KB and ≤ 20 reals.
  - Each stage: native runs settle in ≤ 1 s, WASM runs in ≤ 2 s, and the differential test shows 0 mismatches.
  - The 607-case oracle is rerun and CE1–CE6 are kept as permanent regressions.
- **Not yet measured:** the browser Simpson run (no out-of-memory abort, ENTAILS) and the cost of the witness check belong to implementation acceptance.

**Design verdict:** the revised design is sound. It differs from Codex's position only in the default fast-path encoding, and the new matched evidence supports the polynomial default.

VERDICT: DISAGREE

## Codex  (verdict: AGREE, 3m 21s)
CHECKPOINT
elapsed: ~14 min cumulative active work; ~3 min this round
tentative_verdict: AGREE; the revised A–D design is sound
new_results: NEW: reviewed Stage D’s implementation and proof; verified 95 benchmark-record hashes and three-repeat records, matched verdict agreement, and 432,000 differential checks with zero mismatches
current_obstruction: none for the design; production and browser acceptance remain future work
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

I endorse the revised recommendation, including **one polynomial encoding for both engines by default**. The new evidence resolves the encoding disagreement: native `/` remains sound and admissible, while Stage D gives a simpler default with competitive measured performance.

Stage D’s proof is sound. Every denominator factor comes from a reduced mass denominator. The retained original guards imply that factor is nonzero, and the mechanism bounds imply nonnegativity; therefore it is positive wherever the comparison matters. Cancellation, common-denominator arithmetic and cross-multiplication consequently preserve the comparison there. Where source arithmetic is undefined, its retained guard makes the relevant block false. This preserves explicit negation’s whole-scope semantics and entailment’s Boolean complement, including undefined conclusion countermodels.

I verified the preserved benchmark hashes and repeated results. The H5 WASM fast medians—263 ms for C polynomial, 75 ms for C native division, and 40 ms for D polynomial—support adopting D. They establish an instance-specific improvement, with broader generalization still subject to the production matrix.

One resource qualification belongs in the final wording: **the eight-factor cap controls denominator growth, not total numerator degree, expression size or solver cost**. Our already agreed whole-expression budgets must remain in force, with early cost checks and fallback to C. Keep numerators factored, retain squaring chains and use selective aliases where representation cost warrants them.

The agreed implementation sequence is:

1. **A:** inline ordinary polynomial operations; exact folding and structural sharing; total quotient relations; bounded powers; original-predicate witness validation.
2. **B:** solver-only ancestral pruning and constant-factor extraction.
3. **C:** guarded mechanism-factor cancellation and support-aware guard simplification.
4. **D:** bounded guarded fraction normalization.

Preserve all original mechanisms and user assignments, shared intervention kernels, original query semantics and detached exact witnesses. Keep QF_NRA first with its existing 60-second attempt, followed by explicit NLSat. Witness validation checks whole guarded satisfaction after a satisfying result; it does not restore a consistency preflight or certify UNSAT.

Production acceptance still requires the independent 607-case oracle, differential checks, partial-arithmetic and intervention regressions, representation limits, witness/evaluator checks, and fallback/cancellation verification. Retain the corrected Simpson targets: A ≤45 KB/40 reals; C/D ≤5 KB/20 reals. Browser Simpson behavior and witness-validation costs remain unmeasured.

My agreement and verification are recorded in [prototypes/codex/REPORT_ROUND2.md](/Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus/reviews/constraint_optimization_2026-10-12T22-05-42Z/prototypes/codex/REPORT_ROUND2.md).

**Design verdict: the recommended revised design is sound.** No material disagreement remains. Implementation and publication gates remain separate.

VERDICT: AGREE

## Claude  (verdict: AGREE, 33s)
CHECKPOINT
elapsed: ~100 min wall-clock
tentative_verdict: AGREE. The revised four-stage design (A–D) is sound and uses one polynomial encoding for both engines by default. Native `/` is sound but is adopted only if benchmarks show a consistent win.
new_results: NEW: I accepted Codex's qualification that the cap on denominator factors bounds only the denominator, not numerator size, degree or solver cost. Production Stage D needs an early size check against the existing whole-input budgets and a fallback to Stage C. This is recorded in `prototypes/claude/REPORT_ROUND2.md`.
current_obstruction: none for the design. The browser Simpson run and the cost of witness validation remain for implementation acceptance.
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

I agree with Codex. Its one remaining qualification is correct, and it does not change the design.

**The factor cap does not bound numerator size.** When two fractions with different denominators are added, each numerator is multiplied by the other side's denominator: (ad + cb)/(bd). The numerators grow, so the cap of eight denominator factors bounds neither total degree, expression size nor solver cost. Production Stage D should therefore:
- keep numerators in factored form;
- estimate each comparison's size and degree early, against the existing limits on SMT characters and expanded cost;
- fall back to Stage C's quotient auxiliaries when the estimate exceeds those limits.

This changes only resource handling. The proof is unaffected: every step is an identity wherever the guards and mechanism bounds hold, and the fallback is the already-proven Stage C encoding.

## Consensus answer

**Encoding.** One authenticated guarded representation produces one polynomial input. That input goes to the existing 60-second QF_NRA attempt and then to the explicit NLSat fallback; engine defaults are unchanged. Native `/` in the fast attempt is sound, because the guards make the value at a zero denominator unobservable. It is adopted only if the production benchmark matrix shows a consistent win over the Stage D input. In the measurements so far, Stage D tied or beat native `/` on every input.

**Stages, smallest first:**
1. **A:** inline the polynomial operations, fold numerals exactly, share structurally identical quotients, and keep the squaring chains for powers.
   - Also add validation of the original guarded predicate after a satisfying result. It is not a preflight and does not certify UNSAT.
   - On Simpson this alone goes from 718 reals to 32, and the entailment check runs in about 15 ms natively and 90 ms in WASM.
2. **B:** for the solver input only, sum each probability over the ancestors of its letters, with intervened nodes' parent edges removed. Pull out mechanism factors that are constant across rows.
3. **C:** cancel shared mechanism factors only while the original guard stays. Split each nonzero guard into per-factor conditions and simplify them using the mechanism bounds. Impossible post-intervention evidence remains a false guard even under regularity.
4. **D:** the guarded fraction normal form, with the size limits above.

**Qualifications:**
- **Full-parent shortcut:** applies only to an unintervened child, with exact full-parent evidence and support specific to the intervention. Descendant evidence is never dropped.
- **Witnesses:** they keep using the original queries, distributions and assignments.
- **Rejected rewrites:** sign-blind multiplication, cancelling before guards are generated, and global denominator guards in entailment.

**Acceptance and regressions:**
- Rerun the 607-case independent oracle.
- Keep the exact differential test: 432,000 checks with 0 mismatches in the prototype.
- Keep the six counterexamples as permanent tests.
- Size targets for the Simpson entailment input: at most 45 KB and 40 reals after Stage A, and at most 5 KB and 20 reals after Stages C and D.
- Every benchmark must settle in ≤ 1 s with native Z3 and ≤ 2 s in WASM.

**Measured versus expected:** all timings are from native Z3 5.0.0 and Node-hosted z3-solver 5.2.0 WASM, with per-input hashes. The browser Simpson run (no out-of-memory abort, result ENTAILS) and the cost of witness validation have not been measured.

**Design verdict: the recommended design is sound.**

VERDICT: AGREE

