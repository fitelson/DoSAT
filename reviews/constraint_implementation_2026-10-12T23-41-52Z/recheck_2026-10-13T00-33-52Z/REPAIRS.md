# C1 repair

The completed implementation debate agreed FAIL on one material issue:
line382 classified a literal as zero from its rounded JavaScript value.
An accepted decimal equal to10^-351 has Number(source)=0 while remaining an
exact positive rational. This produced false ENTAILS and wrong UNSAT/ERROR results.

The repair is one production line: use literal_q(inner.right).isZero().
Every generated genuine zero guard still takes the same shortcut. A written
nonzero underflow literal follows the exact comparison path. The rest of the
approved design and implementation are unchanged.

Eleven permanent unit tests cover regular/nonregular false entailment, nonconstant
marginal masses, contradictory SAT and vacuous entailment, both control phrasings,
impossible-event masses, the zero-root case and exact zero spelling0.000.
Two actual-browser regressions cover both modes and exact model evaluation.

All1354 unit tests pass (one inherited skip and one todo). The independent607-case
oracle reruns successfully. All59 affected Chromium cases pass, including both
new regressions; together with unchanged prior tests,108 distinct cases pass.
The production differential rerun has480000 exact comparisons, including C1 decimal
inputs and exact epsilon-valued model parameters, with0 mismatches.
Lint, TypeScript and rebuilt release pass. Package probes verify42 admissions
expressions across3 widths, Save/Load, negative control and eight-node acceptance /
ninth-node rejection. The rebuilt artifact is dosat-45ZXtgOV.js.

The original failed candidate and all journals/bundles remain preserved.
No solver default, preflight, mathematical model or publication target changed.
The separate initial PASS was withdrawn after C1; only the new scoped recheck can
approve publication. Cosmetic spacing noted in the old report was already corrected.
