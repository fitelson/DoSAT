# Phase 3 second repair: engine routing and cancellation qualifications

This record addresses G1 and G2 from
`phase3_recheck_consensus.md`, which reached consensus on **FAIL**. The first
review's mathematical approval stands. F1's operation ownership/retry repair
and F2's permanent negation-scope regressions were accepted. G1/G2 concern the
subsequent change from explicit NLSat to `Solver('QF_NRA')` and its associated
claims and cancellation evidence.

The original review, recheck, first repair resolution, and browser repair
records remain unchanged as historical evidence. This new record supersedes
their unsupported QF_NRA completeness assertion and their description of
post-interrupt portfolio delay as early preprocessing. It does not change the
causal model class, guarded satisfaction semantics, exact polynomial reduction,
or consequence proof.

## G1: what the recheck established

The tagged Z3 5.1 QF_NRA implementation is a strategy portfolio. An uncapped
SMT member precedes its final unrestricted NLSat member. That SMT core may
itself invoke NLSat, but only after other refinement steps stop making
progress. NLSat's complete decision procedure therefore does not prove that
the surrounding portfolio always reaches it. This is a missing termination
justification, not a demonstrated input on which the old constructor runs
forever. Settled SAT/UNSAT answers and mathematical decidability of the
polynomial problem were not refuted. See the
[Z3 5.1 QF_NRA source](https://github.com/Z3Prover/z3/blob/z3-5.1.0/src/tactic/smtlogics/qfnra_tactic.cpp)
and [nonlinear refinement source](https://github.com/Z3Prover/z3/blob/z3-5.1.0/src/math/lp/nla_core.cpp).

The chosen repair is the review's hybrid option: retain the useful PrSAT-style
performance attempt under a finite budget, then use explicit complete NLSat
when that attempt does not settle the stage.

## Hybrid routing and ownership

Each applicable stage has its own requested finite fast-attempt budget:
premise consistency, followed by countermodel search when appropriate.
`DEFAULT_FAST_ATTEMPT_MS` is 60,000 milliseconds. A positive programmatic
`fast_timeout_ms` can select a different value. In bounded mode each attempt
receives the smaller of this local budget and the remaining whole-run budget.
The local budget covers loading/search, and ends before exact witness
extraction; the whole-run deadline continues to cover extraction.

An in-budget definitive result may settle the stage. A local cap requests
interruption of its own pending operation and waits for settlement; an UNKNOWN
response has already settled. In either case the application clears that
operation's cap timer and retry timer and releases its solver/model handles.
After rechecking whole-run cancellation and expiry, an active run starts a
fresh explicit `qfnra-nlsat` solver on the same polynomial input. The fallback
has timeout zero in unlimited mode, or only the remaining whole-run budget in
bounded mode. A late definitive result from an expired fast attempt is ignored.
An unresolved response from explicit NLSat remains UNKNOWN. If a native check
rejects in response to local fast-cap interruption, it is also an expired fast
attempt and may fall back after settlement/release. Genuine errors before that
local expiry and errors during witness extraction remain ERROR.

Whole-run cancellation or expiry prevents fallback. A cap belongs to its own
attempt, rather than to a later stage, fallback, or later use of the wrapper.
Operation-scoped interrupt retries and settlement-before-release ownership
remain in force. No pending solver, model or context is reused while its native
operation is still settling.

For an active unlimited run, conditional on budgeted native attempts settling
and sufficient resources, each needed stage either settles early or reaches
the explicit complete engine. This is the implementation's route to the
mathematical decision procedure. It is not an assertion that a timeout forcibly
terminates a native operation or that physical hardware supplies unlimited
time and memory.

The SMT export explicitly uses `(check-sat-using qfnra-nlsat)` as the complete
reference route. Its polynomial formulas are the same, while it omits the
application's fast attempt and lifecycle wrapper. Export and in-app timings
need not agree. The two entailment checks are separated by reset and fresh
declarations. `DECISION_SEMANTICS.md` now distinguishes this reference route
from the hybrid application.

## G2: corrected cancellation and deadline interpretation

When interruption arrives during a QF_NRA portfolio check, `or_else` can
continue through remaining strategies after catching their cancellation
failures. The recheck's native trace recorded 208 NLSat tactic entries and two
SMT tactic starts after a timeout. See the
[Z3 strategy-combinator source](https://github.com/Z3Prover/z3/blob/z3-5.1.0/src/tactic/tactical.cpp).
This produces post-interrupt settlement delay, rather than merely a delay
before native search starts.

The recheck measured approximately 2.8–2.9 seconds between a real Chromium
Cancel click/input edit and settlement on its six-node example, and 6.6–6.7
seconds on a larger admitted problem. Its direct explicit-NLSat probes avoided
the observed cascade. These are measurements on those instances and that
machine. They do not imply a universal physical bound for either engine.

The earlier MutationObserver tests exercised a queued microtask delivered by
the boundary yield before native work began. Their submillisecond action-to-
status measurements are valid for that path, but do not establish latency for
a real task-scheduled user action after native work starts. A boundary yield
still avoids unnecessary queued work; it does not remove portfolio cleanup
delay once that work is running.

A positive whole-run deadline suppresses settled mathematical verdicts after
expiry and prevents fallback. It does not physically bound the time until the
in-flight operation settles and its handles can be safely released. The UI
may remain occupied while this safe settlement occurs. Timeouts return
UNKNOWN and user cancellation returns CANCELLED; neither proves a theorem.
Using explicit NLSat after the finite fast attempt addresses eventual complete
search, not an absolute cancellation-latency guarantee.

## Boolean intervention notation

The additional notation request is implemented as shorthand for the existing
hard Boolean assignments. `do(X)` means `do(X=1)`; `do(~X)` means `do(X=0)`;
`do(X, ~Z)` means `do(X=1, Z=0)`. Numeric and literal entries can be mixed.
The parser preserves original query spelling while producing the same
intervention objects and polynomial formulas. All variables must be declared;
duplicate assignments, contradictory assignments and arbitrary propositional
formulas inside `do(...)` are rejected. Ordinary observation after the
intervention comma remains ordinary evidence in that intervention regime.

This is notation for the existing model class. It introduces no stochastic,
propositional or cross-world intervention semantics. The title remains
**DoSAT 1.0**, and the subtitle remains **A Decision Procedure for Do Calculus.**

## Verification and gate

Final focused backend verification passes **62 tests** in 7.55 seconds,
including actual forced fallback, pending explicit-NLSat cancellation/reuse,
whole-run expiry, and the two queued-cap callback guards. TypeScript and scoped
typed lint pass. Owned source hashes are preserved in
`phase3_hybrid_solver_snapshot.json`.

The backend's engine probes run WebAssembly Z3 in Node, not the separate native
`/opt/homebrew/bin/z3` executable. Completed measurements are preserved in
`phase3_hybrid_solver_native_probe.json`, whose contents identify the runtime as
**WebAssembly Z3 5.1 in Node**, not system-native Z3:

| Completed probe | Observed result |
|---|---|
| Forced real fallback model | SAT in 414.66 ms total; exact `Pr(F)=1/2`; reuse UNSAT |
| Cancel pending explicit NLSat fallback | CANCELLED; 13.72 ms from abort to settlement; reuse UNSAT |
| Requested whole deadline during fallback | UNKNOWN after 5,036.13 ms for a requested 5,000 ms; reuse UNSAT |

These measurements concern those inputs and that machine. A supplementary
default-hybrid query on the same reused context remained unresolved. The root
authorized stopping its owned probe process after **8 minutes 23 seconds of
process elapsed time**, with exit status 143. Its buffered engine trace was
unavailable, so this record does not attribute the unresolved work to a
particular engine or infer a verdict. The report preserves that qualification;
the earlier partial JSON is retained as well.

The earlier fresh-context 29/69-second comparison is a separate one-instance
measurement and must not be substituted for this unresolved reused-context
query. No general performance superiority or universal latency bound follows
from either experiment. Full integration verification and the consensus gate
remain open.

Required evidence includes per-stage fast/fallback adapter and lifecycle tests,
fallback cancellation and whole-run expiry with pending-handle ownership,
the 607-case independent semantic audit and native replay, actual Chromium
Cancel/input-edit actions after native work has started with subsequent reuse,
notation equivalence and validation tests, full checks and a fresh release
package. The old boundary tests remain useful but are not the new real-task
coverage. Timing acceptance thresholds must be tied to the tested inputs.

A fresh default-model consensus recheck remains required after the repairs and
verification. Agreement on the previous repair list did not close the gate.
