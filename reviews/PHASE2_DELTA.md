# Phase 2 review boundary

Local phase1 checkpoint: `09da8582668175078b2bbebc5cef49e1e5d89347`.
Review new phase2 graph/rule/UI behavior and integration only. The phase1 parser,
compiler and solver are unchanged; their source is reference material where
needed for export integration. No general audit of untouched older code.

Phase2 additions: single-step Pearl Rules1–3 checker on observed Boolean DAGs;
ancestral-moral d-separation with certificates, correct graph surgery including
Rule3 Z(W), explicit definedness, graph diagrams, saved steps/counterexample files.
No latent confounding, mixed graphs, ID/IDC or automated derivation search.

## Files

- `src/causal_graph.ts`
- `src/causal_graph.spec.ts`
- `src/do_calculus.ts`
- `src/do_calculus.spec.ts`
- `src/do_calculus_audit.spec.ts`
- `src/do_calculus_ui.ts`
- `src/do_calculus_ui.spec.ts`
- `src/do_graph_view.ts`
- `src/do_calculus_style.css`
- `src/causal_ui.ts`
- `tests/do_calculus.spec.ts`
- `do_calculus.html`
- `vite.config.ts`
- `DO_CALCULUS_SEMANTICS.md`
- `PROJECT.md`
- `AGENTS.md`
- `README.md`
