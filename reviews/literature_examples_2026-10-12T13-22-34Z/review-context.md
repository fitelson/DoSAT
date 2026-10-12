# DoSAT literature examples: completed candidate

User request: replace the current example menu with the six examples discussed
in this chat, retaining Simpson's paradox. Baseline: b59d782. The seven presets
are Berkson, M-bias, instrument bias amplification, treatment-confounder
feedback, front-door adjustment, positivity failure, and retained Simpson.

The first five are fixed-kernel SAT illustrations with exact evaluation recipes.
Positivity asks an underdetermined conclusion and produces a countermodel.
Simpson retains its exact graph, premises, conclusion and regularity choice.
All numerical data are constructed, not transcribed empirical literature data.
The supplied Boolean background causes are explicit graph nodes. In particular,
the front-door example illustrates its formula in a specified Boolean kernel,
and does not claim general latent-variable identification support.

Changed/new authored files and unchanged core hashes are frozen in
source-snapshot.json. Current preset inputs: src/causal_decision_examples.ts.
The UI reads them, applies each task/regularity choice (including the initial
Berkson SAT case), and presents collapsible descriptions, literature links,
expected decisions and expressions. Guidance hides after problem edits,
Clear, file Load or selecting the placeholder. Model-evaluator edits preserve it
because the underlying problem remains unchanged. Core math/parser/compiler,
solver, exact evaluator and packaging logic are unchanged.

Historical cases remain in tests/fixtures/decision_problems.ts. Existing solver
and lifecycle regressions load those via JSON instead of depending on menu
indices. New tests exercise the actual menu and all real runtime outcomes and
evaluation recipes; they also check containment at 320/390/1280px.

Actual verification:
- Typed lint PASS; TypeScript and production build PASS.
- Full units: 1,318 pass, one inherited skip and one todo (33 files).
- Full Chromium: 103 pass, one worker, strict port 5174, in 1.1 minutes.
- audit_examples.py independently enumerates Boolean kernels using Fraction,
  checks the exported graph edges and every premise, all 15 displayed values,
  two observationally identical positivity models with effects 0 and 1, and
  the retained Simpson rates. It imports none of the application code.
- Fresh code-only Graphify: 1,122 nodes, 2,708 edges, 69 communities.
- Initial browser attempt could not launch because the pinned Chromium was
  absent; the browser was installed and the entire suite then passed. This is
  an environment failure, not an application-test result.

Prepared website package:
releases/DoSAT-1.0-2026-10-12T13-30-47-782Z-13852b71 (eight files, one HTML entry).
The release manifest and current package probe are available for inspection.
No upload, push, deletion, family-wide change, dependency change, native-solver
change or use of port 5317 has occurred. No other test server remains on 5174.

Scope this review to the preset definitions, mathematical teaching claims,
their support/definedness and explicit-background-variable qualifications,
the guidance/default selection and state invalidation, and regression coverage.
Old compiler/solver/evaluator mathematics remain approved reference material.
