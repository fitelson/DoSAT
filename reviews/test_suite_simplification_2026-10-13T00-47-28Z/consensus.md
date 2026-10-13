# Consensus debate — 2026-10-12 20:51

## Question
Have a BRIEF design debate about simplifying DoSAT testing. User asks: 'do we really need ALL of these tests? have a brief debate with Claude about how we might simplify the test suite.' This is a testing-policy recommendation only, not authority to delete tests or historical artifacts. Do not modify source, tests, configuration or publication state.

Repo /Users/fitelson/Dropbox/non-MUSIC/todo/PrSAT/do-calculus. Read INVENTORY.md here, package.json, vitest.config.ts, playwright.config.ts; inspect only a few relevant test files if needed. Current public product is one DoSAT page; reference-ui/ retains retired PrSAT classical, causal model-finder and graphical-rule pages. Current suite:1354 unit passes in~10 seconds,108 distinct browser cases in~1.5 minutes. The607-case independent semantic oracle runs inside ten unit tests. The480000-case production differential and the reviewers'10M randomized checks are ONE-OFF review scripts outside the normal src/ glob. The initial review took~30 minutes, dominated by extra probes; these are not permanent CI requirements.

The current optimizer repair recheck and authorized publication continue separately. C1 is an exact-positive-decimal underflow bug missed by millions of short-literal random samples, caught by one focused counterexample. It is fixed and covered by11 unit tests and2 browser cases; current tests cover partial arithmetic/whole-scope source negation, undefined conclusions, intervention support, exact/algebraic values, SMT provenance, cancellation/settlement/reuse, eight-node limits and Save/Load/evaluator behavior.

Proposed stance to endorse/challenge: retain a compact deterministic semantic spine (independent oracle + distinct adversarial boundaries), precise lifecycle tests and one critical real-browser flow; keep the cheap inherited unit suite for now rather than deleting wholesale, run affected checks during iteration, run one full relevant release check, and keep old-page/large random/stress probes optional and triggered by changes or an unresolved concern. Reduce repeated runs, formatting-only assertions and duplicated end-to-end numerical checks; preserve every historical artifact. Test count alone is not runtime or assurance.

Give concrete keep/combine/move/stop recommendations, identifying files/commands and the proof/behavior coverage each protects. Consider whether to partition current vs legacy browser tests, whether the607-case grid should stay, and where the new C1 tests duplicate coverage. Avoid generic slogans. Choose the smallest justified next step. Be candid about what should not be simplified after a soundness bug.

BRIEF bounds: no test execution, no new fuzzing/solver jobs, no browsing, maximum6 scoped reads, a completed report within3 minutes if possible. Each participant report at most700 words, final synthesis at most300 words, while also satisfying the40k-token ceiling. No recursive debates or model delegation. Default Claude Opus5.5/xhigh vs GPT6.1Sol/xhigh. Write a durable namespaced claude-/codex-checkpoints.md at start; use actual clock readings and six fields, append every15 minutes only if somehow still active. Namespaced notes in this folder only. End with literal VERDICT: AGREE/DISAGREE; if you endorse the proposed policy with minor refinements, use AGREE.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 1m 09s (1 turns); Codex: 1m 16s (1 turns); total: 2m 25s

## Agreed answer
**Recommendation: don't cut the test suite. Change how often each part runs. Only a few files actually need cleanup.** About 1354 quick unit tests (about 10 seconds) and 108 browser tests (about 1.5 minutes) aren't what made the first review take 30 minutes. The extra one-off probes and the repeated full runs did.

**Keep**
- **All 607 independent checks in `src/causal_decision_audit.spec.ts`.** This is the only check that doesn't reuse the app's own solver code. It covers interventions, partly-undefined arithmetic and guarded entailment, and it costs very little time.
- **All 13 tests added for the C1 bug.** That bug was a tiny positive decimal being treated as zero, and millions of random samples missed it. The 10 unit tests in `causal_decision_optimization.spec.ts` plus the exact-zero test cover different cases. The `causal_decision.spec.ts` test guards a separate layer, and the 2 browser cases check that the exact number reaches the screen. Merging the two browser cases could wait until later; it isn't worth doing during the current repair recheck.
- **The real-browser tests** for timing, cancellation, settling and reuse, and for editing, Save/Load and the evaluator. A single browser test that only checks numbers can't replace them.
- **The older unit tests** for the shared parser and translation code that DoSAT depends on.

**Split the browser runs.** Coverage stays the same:
- For the public DoSAT page:
  ```sh
  npx playwright test --project=chromium tests/causal_decision.spec.ts tests/causal_literature_examples.spec.ts
  ```
- For the retired `reference-ui/` pages:
  ```sh
  npx playwright test --project=chromium tests/simple.spec.ts tests/causal.spec.ts tests/do_calculus.spec.ts
  ```
  Run this one only when a change touches code those pages share with DoSAT.

**Merge or move (only with your approval)**
- Move the real ≥1e21 large-number assertion out of `tmp_repro_claim.spec.ts` into a properly named permanent test.
- Move the two `tmp_exponent_*` files, which check nothing, out of the folder the test runner picks up. Don't turn their examples into DoSAT guarantees, because DoSAT accepts fewer exponent forms than the old pages.
- Cut repeated per-example browser checks only after confirming the solver unit tests already cover each example's result.

**Stop**
- Rerunning the 480,000-case comparison and 10M random checks by default. Rerun them only when the optimizer or number handling changes.
- Rerunning unchanged full suites.
- Treating the test count as a measure of assurance.

**Smallest next step:** write down the two browser commands. Leave `npm test`, every test and every historical artifact as they are. Nothing was run or changed in this review.

## Claude  (verdict: AGREE, 1m 09s)
CHECKPOINT
elapsed: ~3 min (started 2026-10-13T00:48:45Z)
tentative_verdict: AGREE with the proposed stance, plus refinements
new_results: NEW: three of the five browser files test retired `reference-ui/` pages. `tmp_exponent_e2e` and `tmp_exponent_repro` contain no assertions. `tmp_repro_claim` holds a real guard against exponent notation for literals ≥1e21. The C1 bug is covered by 5×2 unit tests in `causal_decision_optimization.spec.ts`, one unit test in `causal_decision.spec.ts` and two browser cases.
current_obstruction: none
next_bounded_step: done; waiting for Codex
token_cost: unavailable
END CHECKPOINT

**Answer: endorse the proposed stance, with these refinements.** I made 5 scoped reads (configs, browser test titles and targets, the `tmp_*`/`s` specs, a C1 grep) and ran no tests. My notes are in `claude-checkpoints.md`.

**What the reads show**
- `vitest.config.ts` picks up every `src/**/*.spec.ts`, so the `tmp_*` scratch files count toward "1354 passes".
- `tmp_exponent_e2e.spec.ts` and `tmp_exponent_repro.spec.ts` (5 tests) only print to the console. The e2e file also catches errors and logs them, so neither file can fail. They inflate the count and protect nothing.
- `tmp_repro_claim.spec.ts` has a real assertion: SMT-LIB must not print a literal ≥1e21 as `1e+22`. This is the large-number counterpart of C1 (C1 is a tiny positive decimal parsed as zero). It is a soundness guard sitting in a file named like a throwaway.
- `tests/simple.spec.ts` targets `/reference-ui/classical.html`. `tests/causal.spec.ts` targets `reference-ui/causal.html`. `tests/do_calculus.spec.ts` targets `reference-ui/do_calculus.html`. Only `causal_decision.spec.ts` and `causal_literature_examples.spec.ts` test the public DoSAT page at `/`. `simple.spec.ts` already tags some cases `@slow`.

**Keep (do not simplify)**
1. **The 607-case oracle grid** (`src/causal_decision_audit.spec.ts`). It is the only check that does not share the production code path, and it costs a fraction of a ~10 s run. Shrinking it saves nothing. After C1, the lesson is the opposite: its pinned boundary set should include the literal edge cases (exact positive decimal underflow, ≥1e21 serialization) whenever the next real change touches it.
2. **All 11 C1 unit tests.** They are not redundant. They vary different things: the conclusion's form (countermodel, nonconstant marginal, contradictory premises entailing vacuously, control phrasings, impossible event versus positive underflow), with "regular" crossed on each. The single `causal_decision.spec.ts:210` test checks the literal and source-guard level. Random testing missed this class, so these focused tests are the only defence.
3. **The DoSAT lifecycle browser tests**: the "${timing}-scheduled ${action} … settles and allows reuse" cases, the batch/stale-input invalidation tests and Save/Load. Races, focus handling and worker settlement only show up in a real browser.
4. **The inherited `src/` unit suites** (`tag_map`, `display_logic`, `pr_sat`, `parser`, `z3_integration`). They are cheap and protect the shared parser and translation code that DoSAT depends on.

**Combine / move**
5. Move the `tmp_repro_claim` assertion into `src/pr_sat.spec.ts` under a descriptive name, and delete its `console.log`.
6. The two C1 browser cases are the only clear C1 duplication. "Regular" is a solver-level setting already crossed in the unit tests, so the browser layer only needs one case to show the exact source literal reaching the countermodel display. The saving is a few seconds, so this is optional and low priority. Don't spend review effort on it.
7. The parameterized "retained decision regression ${example}" and "literature preset: ${example.name}" loops may repeat end-to-end numerical checks. If unit-level solver specs already pin each preset's verdict (to be checked), cut the browser loops to one SAT/countermodel case and one entailed/UNSAT case. Keep layout containment checks at two widths, not every width.

**Move to a scheduled lane**
8. Split the browser commands: `test:e2e:dosat` runs the two DoSAT files, and `test:e2e:legacy` runs simple, causal and do_calculus against `reference-ui/`. Run legacy before release, or when shared modules change (`parser`, `pr_sat`, `z3_integration`, `causal*.ts`), because the retired pages still use the shared solver core. Do not delete them while `reference-ui/` is kept "for regressions". `@slow` cases go in the legacy or release lane.
9. The 480000-case differential and the 10M fuzz checks stay as archived review scripts with their results. Rerun them only when the optimizer or literal handling changes.

**Stop**
10. Retire the two assertion-free `tmp_exponent_*` files. Any real exponent behaviour they explored (`2^Pr(B)=2` being SAT; sentence letters not dropped from exponents) should become a one-line assertion in `pr_sat.spec.ts` first.
11. Stop quoting the pass count as evidence of assurance. Report two numbers instead: oracle cases checked and distinct boundary classes pinned.

**Smallest justified next step** (it needs the user's approval, since this debate grants no edit authority): one commit that (a) adds `test:e2e:dosat` and `test:e2e:legacy` scripts, keeping `npm test` = unit + dosat, and (b) moves the 1e21 assertion into `pr_sat.spec.ts` and quarantines the two assertion-free `tmp_` files. No coverage is lost, and every historical artifact stays.

**Minor observation, out of scope.** Playwright sets `retries: 0` with `trace: 'on-first-retry'`, so a trace is never recorded. `retain-on-failure` would make failures in the single release run diagnosable.

VERDICT: AGREE

## Codex  (verdict: AGREE, 1m 16s)
CHECKPOINT
elapsed: 46 seconds; 2026-10-13 00:49:55–00:50:41 UTC
tentative_verdict: AGREE with conservative refinements
new_results: NEW: verified browser partition, current commands, scratch assertions and distinct C1 coverage.
current_obstruction: none; timings and preset duplication were not remeasured.
next_bounded_step: done; recommendation only, recorded in codex-checkpoints.md.
token_cost: unavailable
END CHECKPOINT

I agree with the policy. **Simplify when we run tests before simplifying what they protect.** The reported ten-second unit suite and ninety-second browser suite do not explain the thirty-minute review; extra probes and repeated verification do.

- **Keep:** the complete 607-case grid in `src/causal_decision_audit.spec.ts`. Its independent semantic calculation checks interventions, partial arithmetic and guarded consequence. Ten test declarations conceal substantial coverage; shrinking it is unjustified.
- **Keep:** focused optimizer, exact-number, evaluator and cancellation/settlement/reuse regressions. Retain the cheap inherited parser/translation units. A single numerical browser smoke test cannot replace browser-specific editing, Save/Load, evaluation and lifecycle checks.
- **Keep C1 coverage now:** `causal_decision_optimization.spec.ts` contains ten parameterized underflow cases **plus an exact-zero/zero-root test**. The denominator-guard test in `causal_decision.spec.ts` protects another layer. The two browser cases overlap at the mathematical level, but test delivery through the UI. Collapsing them is optional later; the saving does not justify touching them during the repair recheck.

**Partition browser runs without changing coverage:**

```sh
npx playwright test --project=chromium tests/causal_decision.spec.ts tests/causal_literature_examples.spec.ts
```

```sh
npx playwright test --project=chromium tests/simple.spec.ts tests/causal.spec.ts tests/do_calculus.spec.ts
```

The first command covers public DoSAT; the second covers retired pages. During iteration, run affected checks. Before release, run units and current-page browsers once on the final candidate; include legacy browsers when changed shared code affects them.

**Combine/move:** consolidate repeated preset verdict checks only after confirming permanent solver-level coverage, retaining browser checks of preset loading and rendering. Preserve meaningful exact-display, accessibility and narrow-viewport assertions. Move `tmp_repro_claim`’s large-literal serialization assertion into a named permanent regression.

**Correction:** assertion-free `tmp_exponent_*` tests can fail on uncaught errors; they simply lack assertions establishing their advertised behavior. Archive them outside the normal glob in a separately authorized cleanup. Do not automatically turn variable-exponent examples into DoSAT promises: its supported exponent grammar is narrower.

**Stop:** routine reruns of archived massive differential/fuzz probes and repeated unchanged full suites. Target any additional probes to a changed contract or unresolved concern.

**Smallest next step:** document the two browser commands. Leave `npm test`, all tests and historical artifacts unchanged initially. No tests were executed or suite changes made.

VERDICT: AGREE

