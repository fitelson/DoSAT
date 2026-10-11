You are Claude performing Branden's required independent review of PrSATdo development phase 1. This call IS the requested review gate. Do not launch another review/debate, call another model, or delegate. Work read-only: inspect files and run necessary checks, but do not edit implementation/docs, commit, delete, push, deploy, or change services. Do not use port5317. Browser tests use strict5174; do not run another browser test process if one is active.

Workspace: /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus

Read PROJECT.md, AGENTS.md, CAUSAL_SEMANTICS.md, PHASE1_VERIFICATION.md and reviews/phase1_snapshot.json first. Inspect the actual implementation/tests, not just claims. Compare source against initial baseline commit724655b. Scope phase1: causal satisfiability for an input Boolean all-observed acyclic graph with independent private disturbances, shared CPT mechanisms, observational probabilities, hard interventions and conditioning within a regime. This is not an ID/IDC or symbolic do-calculus implementation. Hidden confounding/cross-world counterfactuals later.

Files: src/causal_syntax.ts, src/causal.ts, src/causal_ui.ts, src/causal_format.ts, src/z3_integration.ts changes, causal.html, Vite/Playwright entry config, src/causal*.spec.ts, tests/causal.spec.ts; review integration with inherited arithmetic and definedness semantics. Existing classical regression suite is retained.

Check mathematical faithfulness, soundness/completeness of the represented causal-model class, normalization, intervention surgery and shared CPTs, absent observational support, semantics of conditioning/zero denominators and branch-local definedness, graph/identifier/query validity, exact numbers and integer exponents, limits on parse/compile and SMT growth, SAT/UNSAT/UNKNOWN labels, witness exactness/completeness, cancellation/timeouts/reinitialization and stale input/file loads, and tests that independently detect wrong results. Inspect pure-representation proof and spot missing assumptions. Review workflow script scripts/claude_phase_review.py as a local review helper, but it must not recursively invoke review in this session.

During Codex internal verification three issues were found and fixed: decimal exponents close to an integer must be checked from exact literal source rather than rounded Number; Cancel during the last model evaluation must never display stale SAT tables; slow cancellation must disable Find until Z3 reload completes. Free real variables now display in witness; async file loads are request-token/revision guarded. Independently check fixes. Potential further concerns should be confirmed with a concrete case, not assumed away.

Give a compressed final report of at most40000 output tokens AND below40000 UTF-8 bytes. Preserve decisive proof steps, concrete reproduction cases, exact file/line locations, qualifications, coverage, and verdict. If the audit needs more space, state what was not covered and return compactly; do not edit project files in this read-only review.

The runner streams to an fsynced private journal, has a stable resumable session ID, checks activity at least every5 minutes, and performs bounded same-session no-thinking recovery after five consecutive silent intervals or a stopped transport. Emit useful checkpoints before extended silent work when possible. Every returned checkpoint must contain elapsed time, tentative verdict, genuinely new results, current obstruction, next bounded step, available token/cost data. Begin the final report with exactly one cumulative block:
CHECKPOINT
elapsed: <wall-clock estimate>
tentative_verdict: <approve phase1 / material findings / audit incomplete>
new_results: NEW: <decisive results> OR NONE: <why no progress>
current_obstruction: <concrete obstruction or none>
next_bounded_step: <next bounded check or done>
token_cost: <available figures or unavailable>
END CHECKPOINT

Then give: scoped verdict; numbered findings tagged blocker/serious/minor with exact source locations and concrete repro when possible; meaningful tests performed; mathematical assessment and qualifications; remaining phase boundaries. Do not praise or rubber-stamp. Approve only if no unresolved material issue within phase1. Any incomplete audit must state that explicitly and not approve.
End with exactly one final line:
VERDICT: AGREE
or
VERDICT: DISAGREE
AGREE means approve the scoped phase; DISAGREE means material findings remain or the audit is incomplete.
