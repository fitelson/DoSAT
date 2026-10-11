# Phase 3 independent semantic audit

This audit concerns the Phase 3 division-free reduction and consequence
operation, relative to Phase 2 checkpoint `fa7d9bd`. The old parser and causal
model compiler are reference dependencies; this is not a new general audit of
those modules.

The implementation proof and exact satisfaction convention are in
`DECISION_SEMANTICS.md`. The permanent independent tests are
`src/causal_decision_audit.spec.ts`.

## Oracle and scope

The oracle uses exact BigInt rational arithmetic and explicitly enumerates the
private disturbance tuple. It solves the structural equations under each
requested hard intervention and then sums event masses. It does not use the
causal compiler's row-product, event-mass, definedness, or expression-lowering
helpers. It evaluates source constraints directly, including whole-scope
definedness for explicit negation and the inherited guarded truth convention
for implication and biconditional.

One reused WebAssembly Z3 context and `qfnra-nlsat` solver tests the compiled
polynomial projection. The solver resets between cases and is released after
the file. Grid checks do not allocate models or another solver/context for
each case.

| Case family | Checks |
|---|---:|
| Fourteen compound/intervention constraints across 27 CPT valuations | 378 |
| Six conclusions' satisfaction complements across 27 CPT valuations | 162 |
| Ten signed arithmetic/power constraints across five real valuations | 50 |
| Undefined-negation pitfall | 2 |
| Unobserved parent configuration exposed by intervention | 1 |
| Confounding, exact intervention and adjustment | 3 |
| Inconsistent premises and their countermodel formula | 2 |
| Unsafe integer and distinct decimal coefficients | 3 |
| Unpinned consequences over all compatible real parameter values | 6 |
| **Total** | **607** |

The 27 CPT grid is `X -> Y` with `q_X`, `q_Y(X=0)`, and `q_Y(X=1)` each
chosen independently from `{0,1/2,1}`. The arithmetic grid uses
`a in {-2,-1,0,1,2}`. Larger graph examples use a specified rational valuation.
Six unpinned checks include positive-support action/observation exchange,
its failure through an undefined conclusion at zero support, impossible
post-intervention evidence under regularity, signed reciprocals, and
`a^2=2, a>0` implying `1/a<a`.

This is a finite implementation audit, not an exhaustive numerical verification
over six-node graphs or all real valuations. The general soundness and
completeness claim is supported by the explicit reduction proof.

## Reproduction and results

Ordinary portable check:

```sh
npx vitest --run src/causal_decision_audit.spec.ts
```

Initial candidate result: **9 tests passed**, with **553 matched semantic
expectations**. Its focused ESLint and full TypeScript checks passed.

The scoped consensus found two previously uncovered lowering branches inside
explicit source negation (F2). These permanent formulas are now included in
the 27-model grid:

```text
~((Pr(Y | X) = 1/2) -> (Pr(Y) = 1/2))
~((Pr(Y | X) = 1/2) <-> (Pr(Y | ~X) = 1/2))
```

They add 54 cases: the repaired suite has 378 source cases, 601 pinned cases,
and 607 total cases. With updated dependencies, **9 tests pass and all 607
semantic expectations match** under Vitest 5.0.3. The opted-in native replay
also matches **607/607**. The bundled WebAssembly runtime reports 5.1.0.

Fresh identity and two mutation copies of the permanent suite were run outside
the checkout. The identity passes all nine tests. Reversing implication fails
the new negated-implication formula at model 334 (expected SAT, actual UNSAT).
Replacing biconditional's Boolean equality by conjunction fails the new
negated-biconditional formula at model 360 (expected UNSAT, actual SAT). These
are semantic assertion failures, not setup failures. All copies, source hashes,
commands, and run logs remain in:

```text
/var/folders/h1/jv_lt9bj42dgghwf8b3khjpw0000gn/T/dosat-phase3-f2-permanent-eqzqu63v/
```

The retained directory's `mutation-results.json` records identity exit 0 and
both mutant exits 1; `source-provenance.json` records each copied source hash.

Native cross-runtime replay, using the current native Z3 5.1 binary explicitly:

```sh
PRSATDO_NATIVE_Z3=/opt/homebrew/bin/z3 \
  PRSATDO_NATIVE_AUDIT_PREFIX="$PWD/reviews/phase3_repaired_native_audit" \
  npx vitest --run src/causal_decision_audit.spec.ts
```

The opt-in replay sends all retained SMT problems through one native process
using `(check-sat-using qfnra-nlsat)`. The binary may be set with
`PRSATDO_NATIVE_Z3`; its default is `/opt/homebrew/bin/z3`. The report records
the executable path and its actual version. Ordinary tests require no native
installation.

Repaired replay result: **607/607 matches**, using
`/opt/homebrew/bin/z3`, **Z3 5.1.0 (64 bit)**. Its input SHA256 is
`084561cd9ae6d887e3ec13d7fab6eeb3b87f37d77f67a8237440e816f8148a87`.

The full replay input and checked output report are preserved:

- `phase3_repaired_native_audit.smt2`
- `phase3_repaired_native_audit.json`

The report records the complete input SHA256 and every expected/actual verdict.
The initial 553-case replay remains at
`phase3_native_audit_with_unpinned.{smt2,json}` with **553/553 matches** using
native **Z3 4.16.0**, build hash
`ddb49568d3520e99799e364fb22f35fc67d887b1`. An earlier 547-case replay is also
retained as `phase3_native_audit.*`; it predates addition of the six unpinned
checks. No audit artifacts were deleted.

The source/model semantic oracle is independent of the reduction. The native
and WebAssembly checks use separate installed runtimes of Z3; they are not
independent theorem-proving algorithms. The original native runtime was 4.16.0;
the repaired replay uses native 5.1.0 and the WebAssembly runtime also reports
5.1.0 (npm package `z3-solver` 5.2.0). The mathematical reduction
proof, the exact finite oracle, and cross-runtime replay provide different
forms of evidence.

The default-model consensus approved the mathematical reduction but requires
F1's cancellation repair and F2's permanent branch coverage before the phase
can pass. Lemma 2 now includes the requested innermost-undefined argument (N1).
The required repair recheck is owned by the parent task and remains a separate
review requirement.
