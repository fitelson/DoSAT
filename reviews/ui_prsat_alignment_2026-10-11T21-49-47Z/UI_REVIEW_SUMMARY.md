# DoSAT UI review against PrSAT

October 11, 2026. **UI alignment verdict: Not aligned.** Claude Opus 5.5/xhigh
reviewed the current interface; GPT-6.1 Sol/xhigh independently verified it.
They reached consensus on the assessment and redesign direction. This is an
interface review; the mathematical/solver Phase 3 PASS stands. No redesign was
implemented, and no application source or server file changed.

Read [UI_AGREED_DESIGN.md](UI_AGREED_DESIGN.md) for the concise settled design,
and [UI_CONSENSUS.md](UI_CONSENSUS.md) for the complete review transcript.
Original desktop/mobile screenshots, capture JSON and the matched four-premise
comparison are preserved in this folder. Raw stream journals stay private.

## Main findings

1. **The familiar editor is missing.** PrSAT uses individual constraint rows,
   live mathematical previews and batch input. DoSAT uses large textareas.
2. **The primary action is too far down.** With the same four premises, PrSAT's
   action is at about 547px desktop / 701px mobile; DoSAT's is at 1423px /
   1965px. DoSAT also requires graph and conclusion fields, so this measures
   the overall interface difference. Hiding help text alone does not fix it.
3. **Visual identity differs.** DoSAT's decision entry lacks the web-font link,
   and its button elements do not match the inherited input-button CSS.
   PrSAT's dark header, bordered panels and teal action are absent.
4. **Validation locations can mislead.** Blank/comment lines and the separate
   conclusion are counted together in messages such as "Constraint line 2".
   Errors need inline Graph/Premise/Conclusion labels and accessible summaries.
5. **Results lack PrSAT's table-first presentation.** Distributions are hidden
   in collapsed sections. Show an observational/regime probability table
   directly, with exact input values and the failed conclusion nearby.

## Agreed first UI pass

- Reuse PrSAT's header, panel, toolbar, row editor and mathematical-rendering
  conventions; add causal-aware rendering without changing the decision procedure.
- Keep a compact, explicit graph editor and an obvious SAT/entailment choice.
  Show one conclusion row for entailment; hide and preserve its draft in SAT.
- Place Run, Regular, optional Time limit, Cancel and status directly below
  the editor. Use deadline wording that allows later native settlement.
- Restore familiar Load/Batch/Save/Copy placement. Save/Load/Copy retain the
  whole version-1 problem. "Clear premises" preserves graph, conclusion and
  options; batch Parse replaces premises only. Pending batch edits block stale Run.
- Display the probability table and rendered query values. Keep user-named
  real-variable assignments visible; shared mechanism details may collapse.
- Preserve empty-premise validity, undefined-term qualifications, precise
  outcomes, stale-result clearing, live status and mobile containment.

Target action positions of approximately 800px desktop / 950px mobile are
implementation acceptance goals, not measured redesign results. Future checks
must compare the rendered pages, keyboard behavior, error locations, complete
saved problems, pending edits, every result state and wide-table containment.
Safari, iOS, Firefox and real screen readers were not tested.

An arbitrary Evaluate-model panel requires additional evaluation/lifecycle
capability and is outside this first presentation pass. Decimal display,
table-image export, graph drawing and a Run shortcut are optional later features.
The agreed direction is concrete, but the unbuilt redesign has no implementation
approval yet. Subsequent development retains the project's scoped consensus gate.
