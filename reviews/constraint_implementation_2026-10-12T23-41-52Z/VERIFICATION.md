# Implementation verification

## Approved candidate

The initial candidate below failed C1 and was never published. The repaired
candidate's completed default-model recheck is **PASS** in
recheck_2026-10-13T00-33-52Z/consensus.md. Its approved eight-file package is
releases/DoSAT-1.0-2026-10-13T00-30-37-562Z-c92dc641, loading dosat-45ZXtgOV.js.
The separately user-approved test cleanup also obtained implementation PASS in
../test_suite_simplification_2026-10-13T00-47-28Z/implementation/consensus.md.

The repaired candidate passed 1354 unit tests before cleanup; the final cleanup
run passed 1349 (one inherited skip and one todo), removing only five
assertion-free probes. Meaningful large-number coverage was preserved.
All 108 distinct Chromium cases passed across the recorded affected/legacy runs;
the normal public-page lane contains 59 and the retained legacy lane 49.
Lint, TypeScript and production build pass. The 607-case semantic oracle passed,
and the final exact differential audit passed 480000 comparisons in 27 scenarios
with zero mismatches. Eleven unit and two browser regressions cover C1; restoring
the old exact-zero predicate fails nine of those unit cases.

The actual approved bundle passed admissions checks at 1280/390/320 pixels,
Save/Load, exact model evaluation, negative controls, eight-node acceptance and
ninth-node rejection. Both regularity modes passed the tiny-decimal countermodel,
contradictory SAT and vacuous-entailment probes. The reviewed source and all eight
package hashes are recorded in the repair folder.

Repeated native review runs exposed intermittent Z3/WASM out-of-memory failures
in both pre-repair and repaired code. No incorrect verdict was observed in that
investigation. Both reviewers scoped this as a separate reliability follow-up,
not an unresolved C1 defect; see the recheck consensus for the qualification.

Current publication and live evidence are recorded in PUBLICATION.md.

## Historical initial candidate

Current source is frozen in source-snapshot.json and source-snapshot/. The prepared
release is releases/DoSAT-1.0-2026-10-12T23-52-54-351Z-a675e587 (eight files).

- All 1343 unit tests pass; one inherited skip and one todo remain. See unit-eight-final.log.
- The independent disturbance-based oracle reruns 607 pinned/unpinned native cases
  in causal_decision_audit.spec.ts. No semantic mismatch.
- production-differential.json: 20 scenarios, 432000 exact guarded-constraint
  comparisons against original metadata, 0 mismatches. Original guards, boundary
  masses, arbitrary signed user variables and two arbitrary zero-quotient values
  are included. This checks the production optimizer, not just the design prototype.
- The independent Fraction admissions audit passes all 32 rows, eight supplied
  cells, 14 positive mechanisms, eight conclusion clauses, 14 optional expressions
  and selection versus fixing. See MATHEMATICS.md and independent-arithmetic.json.
- All 106 distinct Chromium cases pass: 105 in browser-eight.log and the new eight-node
  case in browser-eight-recheck.log after correcting the test's error-panel selector.
  The earlier export assertion was corrected to allow literal rational coefficients;
  variable division remains forbidden. Failures and reruns are retained.
- Lint, TypeScript and production build pass (lint-eight-final.log, build-release-eight.log).
- Actual prepared package: package-eight-probe.json/log, with Save/Load, primary
  entailment, SAT witness, 42 exact admissions evaluations and negative controlled
  gender-effect countermodel across 1280/390/320px. Eight-node SAT/new intervention
  and ninth-node rejection are checked. No page errors or horizontal page overflow.
- Preview screenshots are preserved and visually inspected. The DAG scrolls within
  its bounded panel as designed; inputs and results remain contained.
- metrics.json separates native compilation/parsing/search/validation/witness costs,
  three repetitions each. Simpson entailment body 3619 bytes / 14 reals / 0 auxiliaries;
  SAT body 1474 bytes. Prior entailment 73407 bytes / 718 reals / 704 auxiliaries.
  Warm native entailment search around 2 ms; original SAT validation around 69 ms;
  validation and complete detached witness around 173 ms in this observed instance.
  The final eight-variable package checks Simpson in 110-148 ms and returns
  its SAT witness in 146-169 ms across the three widths.
  These are observed instance timings, not general deadlines or memory guarantees.
- Default QF_NRA budget 60000 ms and unbounded overall remain; no consistency preflight.
- The eight-node complete DAG compiles 255 mechanisms / 256 rows. Higher polynomial
  complexity can still hit the existing independent input/expansion limits.

Original candidate phase gate: FAIL (C1 exact-zero literal classification).
See consensus.md and recheck_2026-10-13T00-33-52Z/ for repair and recheck.
This failed candidate was not published; the approved replacement is identified above.
