# DoSAT 1.0 Phase 3 review boundary

Baseline: approved Phase 2 commit fa7d9bd0deccc2c01da04883c1ae55fb0d74a30c.
User redirected Phase 3 to a semantic decision procedure for causal SAT and
entailment. Derivation chains, ID/IDC and latent model classes are outside scope.

New core: causal_decision.ts (exact polynomial reduction),
causal_decision_solver.ts (explicit complete qfnra-nlsat, ownership/lifecycle),
causal_decision_ui.ts and CSS, decision.html, their unit and browser tests,
independent causal_decision_audit.spec.ts and DECISION_SEMANTICS.md.

Old runtime changes are two navigation links (causal_ui.ts/do_calculus_ui.ts)
and Vite's fourth entry page. Old causal compiler/parser, PrSAT math and legacy
solver remain byte-identical to baseline. CAUSAL_SEMANTICS.md receives a necessary
entailment-usage correction: explicit source negation can exclude undefined
countermodels. It now points to the new procedure.

User naming: DoSAT 1.0, subtitle exactly A Decision Procedure for Do Calculus.
Thread renamed. New landing page webpage/dosat.html, scoped release-preparation
script, npm identity/version, HOSTING.md and source/hub/laptop instructions.
Target https://fitelson.org/DoSAT/ with landing index and dist/decision.html,
following PrSAT's arrangement. This exchange reviews preparation only, not a
remote deployment. Legacy deploy command remains disabled. No remote writes.

Reviews must focus only on this phase's delta and dependencies needed to check
new claims. No general re-audit of untouched prior code, no Phase 4 work.
