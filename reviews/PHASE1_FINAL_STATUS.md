# PrSATdo Phase 1 final status

**Phase gate: PASS.** The consensus debate skill ran with defaults
Claude Opus5.5/xhigh and GPT-6.1Sol/xhigh, scoped to phase1 changes and integration.
Initial scoped review: FAIL forF1 andF2. Both repairs were made, acceptance tests
added, and the subsequent scoped consensus recheck approved phase1 with no
unresolved material issue. Read phase1_recheck_consensus.md for both reports and
agreed synthesis; the protocol/progress files preserve exact settings and sessions.

## Verified delivery

- Boolean acyclic graphs with independent private disturbances, up to6 nodes.
- Shared CPT mechanisms for observational and hard-intervention regimes.
- Ordinary conditioning and conditioning after intervention; simultaneous do assignments.
- SAT/UNSAT/UNKNOWN, exact witness queries/CPTs/free reals/regime tables.
- Examples, saved problem files, solver input export, bounded/cancellable search.
- Original classical app preserved as a linked baseline; deployment disabled.

## Final checks

- lint and TypeScript: pass.
- build: pass for both entry pages.
- full unit suite:748 passed,1 inherited skipped,1 inherited todo,18 files.
- Chromium:32 passed, serial strict5174, on the identical reviewed runtime.
- Additional same-line query-27 regression: added after consensus recommendation,
  rejects repaired code and discriminates an in-memory mutant without delimiters.
  This follow-up changes only a test; runtime implementation still matches the
  approved repaired source snapshot.

No phase2 functionality has begun. Symbolic do-calculus/ID/IDC, hidden confounding
and cross-world counterfactuals remain later phases.

## Nonblocking qualifications preserved

One reviewer full-unit run failed once without preserving the failing test;
subsequent captured runs passed. The cause is unknown and is not attributed to
old timing code. Error columns use substituted text; older unreferenced build
assets remain retained. Raw journals stay private and are ignored by Git.

The workflow for future phases is in AGENTS.md: implement, verify, consensus
review usingdefaults scoped to the current phase, repair/recheck, then advance.
