# Phase 1 repair acceptance plan

The first Claude report identified two in-scope required repairs. The current
consensus debate is independently checking them before the reviewed snapshot is
changed. The gate remains open.

## F1: generated probability-token boundaries

Delimit every substituted query token, and reject reserved query-prefixed variable
names that do not match registered queries (including at the compiler API boundary).
Reject adjacent probabilities/identifiers, including aliases and the query-27
aliasing case. Preserve explicit multiplication, powers, negation and valid
intervention syntax. Add parser and actual-Z3 regressions distinguishing invalid
juxtaposition from correctly UNSAT root-independence challenges.

## F2: time-limit conversion

Round validated seconds to integer milliseconds before setting the native solver
parameter and starting the JS timer. Test16.1s ->16100ms, off-step values, a real
Z3 solve with that limit, and the UI timer's UNKNOWN result/cancellation path.

## Minor verification improvements

Check the exact browser value cell instead of matching a digit already present in
the query label. Add a complementary-event normalization UNSAT test that exercises
expanded CPT mass expressions. Distinguish search-time limit from witness-table
preparation in UI labels/status; retain cancellation during witness preparation.

After consensus settles the findings: apply repairs, rerun lint/build/unit/browser
checks, update the candidate hashes, and obtain consensus recheck with the same
default models/efforts before Phase2. No unrelated old-code audit is authorized
by this repair plan.
