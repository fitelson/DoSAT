# Phase 1 review findings and repairs

Initial scoped default-model consensus: FAIL, agreeing on F1/F2; mathematical
semantics/representation verified. Transcript: phase1_scoped_consensus.md.

## Required F1, resolved in candidate

Every probability substitution is parenthesized, preventing adjacent identifiers
or other probability substitutions from merging. Parser and compiler both call
validate_causal_query_identifiers to reject unmatched reserved query names.
This includes direct compiler API input. Parentheses also fix the exact-key
27th-query alias that a name whitelist alone cannot catch.

Permanent acceptance tests reject all agreed malformed strings and preserve
ASTs for explicit multiplication, integer powers, unary minus and constraint
negation. Real-Z3 tests prove root independence with explicit multiplication
and reject malformed juxtaposition before any solving.

## Required F2, resolved in candidate

The UI uses Math.round(Number(timeout.value)*1000) after validating seconds.
Mock tests assert literal16100,32200,1001 native millisecond values. Real-Z3 and
browser tests solve with all three accepted decimal/off-step time limits.
A deterministic timer test verifies UNKNOWN on timer expiry, no witness tables,
and restored search controls.

## Nonblocking items

- M1: browser zero-support intervention assertion targets the value cell exactly.
- M2: complementary-event normalization is a permanent polynomial UNSAT test.
- M3: UI label says search time limit; witness preparation has a separate status,
  is explicitly described as outside the search timer, and remains cancellable.
- M4: unrelated inherited reserved-name behavior remains out of scope; errors
  are reported safely rather than mistaken for a satisfiability verdict.
- M5: legacy observational compiler API fallbacks are valid and retained.

Repaired candidate verification is documented separately. Approval to proceed
requires the focused consensus recheck's explicit PASS.
