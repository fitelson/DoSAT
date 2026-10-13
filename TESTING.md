# DoSAT testing workflow

The Claude-Codex testing-policy debate recommends reducing repeated execution
before reducing coverage. The unit suite takes about ten seconds; it includes
the independent 607-case semantic oracle, exact-number boundaries, intervention
support, partial-arithmetic and guarded-consequence regressions, and lifecycle
ownership checks. Keep these checks.

During iteration, run the affected unit files. After compiler changes, run the
full unit suite once on the final candidate:

```sh
npm run test:unit
```

The public-page browser suite is:

```sh
npm run test:e2e:dosat
```

The retired-page browser suite is:

```sh
npm run test:e2e:legacy
```

Before release, run units and public-page browsers once on the final candidate.
Include retired-page browsers when shared parser, translation, solver or causal
changes affect them. Preserve real browser coverage of editing/invalidation,
Save/Load, evaluation, accessibility, layout and cancellation/settlement/reuse.
npm test now runs units plus public-page browsers. npm run test:e2e:all retains
the full browser suite, including retired pages.

Large differential/fuzz/stress scripts under reviews/ are archived evidence,
not routine tests. Additional probes should target a changed contract or an
unresolved concern. The C1 decimal-underflow bug shows why distinct boundary
cases matter more than repeating large samples of ordinary literals.

The meaningful large-number assertion from src/tmp_repro_claim.spec.ts is now
in src/pr_sat.spec.ts. The original scratch files are preserved under
reference-tests/exponent-probes/ outside the normal glob. Five assertion-free
probe tests leave the routine count; all semantic, exact-number, C1 and lifecycle
coverage remains. Historical artifacts remain preserved.

Consensus: reviews/test_suite_simplification_2026-10-13T00-47-28Z/consensus.md.
