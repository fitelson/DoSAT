# DoSAT vs PrSAT 3.0: interface-only review (consolidated after Codex round 1)

## 1. Verdict

**UI alignment: NOT ALIGNED.** DoSAT carries over PrSAT's control *concepts* (regularity, a time limit, Cancel, save/load) but none of PrSAT's interface structures:
- the dark header card;
- the bordered editor panel with its toolbar;
- one row per constraint with a rendered formula;
- the teal primary action with its options beside it and the status underneath;
- the visible ⊤/⊥ probability table.

This verdict covers the interface only. The mathematical Phase 3 PASS is closed and not reopened. This is a review, not approval of an unimplemented redesign.

### Confirmed measurements

Both participants checked these independently, in headless Chromium.

| | PrSAT | DoSAT |
|---|---:|---:|
| Initial action Y, 1280×900 / 390×900 | 374 / 425 (empty input) | 1423 / 1965 (default 4-premise example) |
| Controlled: PrSAT with DoSAT's same 4 premises as rows, batch closed | 547 / 701 | — |
| Viewport containing the action | first | second (desktop) / third (mobile) |
| Rendered fonts | Source Sans Pro SemiBold web font on Find Model (16px/600); secondary buttons Source Sans Pro 13.33px/500 | Body ".SF NS"; buttons Arial 13.33px. The live `decision.html` has no font `<link>`. `<button>` elements miss `style.css`'s `input[type=button]` rules. |
| Mobile document width with results | 445 (overflows) | 390 (contained) |

Checkboxes and number inputs are Arial 13.33px in both apps. Hiding every DoSAT help paragraph and the header prose (a CSS-injection test, not a redesign) only moved the action to 1040 / 1076.

## 2. Prioritized comparison

| Pri | PrSAT | DoSAT now | Impact | Change | Scope |
|---|---|---|---|---|---|
| P1 | Dark header, grey bordered panels, teal `.generate` action, web fonts | Plain form, browser-default buttons, no fonts loaded | Looks like a different app | Load the fonts as `causal.html` does; reuse `.header`, `.generic-input-block`, `.model-finder` and `.generate`; extend button styling to `button` elements | Presentation |
| P1 | Action, options, Cancel and status directly follow the editor | Help, search mode, time limit, validation and runtime text come before the action | Action sits 876 / 1264 px below PrSAT's for the same premises | Action panel directly after the editor | Presentation |
| P1 | Rows with ⌫ ⏎ ⓘ and rendered MathML; Enter splits a row, Up/Down move, Backspace merges; batch input with Parse | Full-width textareas, nothing rendered | The familiar workflow is missing, and users can't see how a `do()` term was read | Premise rows plus a single conclusion row, with a causal-aware renderer | Presentation, plus UI behavior (new renderer code; no solver change) |
| P1 | One task | Small "Question" select; in satisfiability mode the conclusion stays visible but disabled | The task is easy to miss; dead content | Entailment / Satisfiability radio group; hide the inactive conclusion but keep its draft | Presentation |
| P1 | A bad row's ⓘ shows "Syntax error (not a wff)." in place, and Run is disabled. Row inputs are named only "Enter constraint" (from the placeholder) and buttons "⌫" / "⏎" / "ⓘ". No live region. | One distant message with no role/live region and no `aria-invalid` or `aria-describedby`. Specific wording, but **wrong location**: textarea line 4 (after a blank line and a comment) and a bad conclusion are both reported as "Constraint line 2". | Errors are hard to find and misidentify their row | Inline errors naming Graph / Premise N / Conclusion; linked descriptions; announced summary near the action | UI validation |
| P2 | Load From File / Show Batch Input / Clear above the rows; Save to File / Copy to Clipboard below | Save problem, a native file picker and Save solver input sit below Run; no Clear, no Copy | Unfamiliar workflow; missing affordances | PrSAT placement and labels; "Clear premises"; Save, Load and Copy use the whole-problem v1 JSON; Save solver input moves to the results row; Examples go in the toolbar | Presentation plus UI behavior |
| P2 | No graph | 3-row graph textarea and help | Essential, but takes too much space | Compact graph editor that still accepts newlines and semicolons; ⓘ; adjacent variable summary | Presentation |
| P2 | Short Regular and Timeout controls | Long labels and help; Search mode select plus a disabled time field | Options dominate the path to Run | Compact controls with the structural-zero and deadline qualifications visible | Presentation |
| P2 | Visible ⊤/⊥ table with rendered values | Queries table, mechanisms table, then collapsed per-regime 0/1 tables | The model is less recognizable | Visible regime table; rendered queries; submitted conclusion beside its term values | Presentation (uses existing witness data) |
| P3 | Model view overflows on mobile; stale model shown dimmed | Contained on mobile; labelled fields; live status; results cleared on edit | DoSAT is better on these points | Keep containment, labels, announcements and clear-on-edit | Preserve |
| Later | Evaluate model panel, Decimals, Save table as image | None | Familiar features missing | Evaluate model needs separately scoped capability and lifecycle work. Decimals, image export, graph drawing and a run shortcut are optional presentation additions. | New capability (Evaluate) |

## 3. Minimal first alignment pass

```text
DARK HEADER: DoSAT 1.0
  A Decision Procedure for Do Calculus.
  Observed Boolean DAG · independent private disturbances
  Shared mechanisms across interventions · help / finder / step-checker links

EDITOR PANEL
  Task: (•) Check entailment  ( ) Satisfiability
  [Load From File] [Show Batch Input] [Clear premises] [Examples ▾]
  Causal graph: [Z -> X; Z -> Y] [ⓘ]   3 variables: Z, X, Y
  Premises (may be empty)            ("Constraints" in SAT mode)
    [⌫] [Pr(Z) = 1/2     ] [⏎] [ⓘ]  rendered formula
    [⌫] [Pr(X | Z) = 3/4 ] [⏎] [ⓘ]  rendered formula
  Conclusion (exactly one; logical combinations allowed)
    [Pr(Y | do(X)) = 3/4 ] [ⓘ]       rendered formula
    Required undefined terms can prevent the conclusion holding.
  [Save to File] [Copy to Clipboard]  (whole problem)

ACTION / RESULT PANEL
  [Check entailment]  [ ] Regular [ⓘ]  Positive observational rows;
                                       interventions can still force zeros.
                      [ ] Time limit: [30] seconds [ⓘ]
                      Off: no overall time limit. A deadline ends result
                      acceptance; cancellation and cleanup can take longer.
  [Cancel]  readiness / linked validation summary
  DOES NOT ENTAIL — a countermodel was found.        (announced)
  Submitted conclusion: Pr(Y | do(X)) = 3/4
  Witness value:        Pr(Y | do(X)) = 1/2
  [visible ⊤/⊥ regime table] [rendered input probabilities]
  [Other real variables — visible when present]
  [Shared causal mechanisms ▸]
  [Save solver input]
```

**Keep visible:**
- the task choice and a task-labelled run button;
- in entailment mode with no premises: "No premises: checks validity", with Run still enabled (do not copy PrSAT's disabled-on-empty Run);
- the exactly-one conclusion, which cannot grow a second row;
- the undefined-term qualification;
- the graph requirement and the independent-disturbance assumption;
- the regularity / structural-zero note;
- the deadline meaning;
- distinct SAT / UNSAT / ENTAILS / DOES NOT ENTAIL / INCONSISTENT PREMISES (with the vacuity explanation) / UNRESOLVED / Cancelled / error outcomes;
- settling feedback.

**Collapse:** extended syntax (row and graph ⓘ), solver internals (QF_NRA budget, NLSat), the long model-class prose, and the variable limit.

**Results:**
- The observational distribution is always visible.
- A few regimes go in side-by-side columns. Many regimes need contained scrolling or a clearly labelled selector.
- Keep exact values and "undefined (zero denominator)".
- Show the submitted conclusion beside its witness term values without implying an evaluator for arbitrary compound constraints.

**Batch and Clear:**
- Parse replaces premises only.
- Edited, unparsed batch text is visibly marked as not applied. Results are cleared and Run is disabled until Parse or Discard.
- Hiding the batch neither applies nor silently discards it.
- Clear premises keeps the graph, conclusion and options.
- Load From File applies the whole JSON problem directly.

**Reuse:**
- `decision.html`: font links.
- `style.css`: header, panels, toolbar, `.generate`, table conventions.
- `block_playground.ts`: the exported `split_input` and `generic_input_block`. The row and batch containers are private, and `generic_input_block` hard-wires text save/load, so either parameterize the handlers or compose around the private pieces.
- `display_logic.ts`: row and batch logic. Graph edits must re-validate every row. Keep PrSAT's pending-edit Run disable: tested, Find Model disables immediately on a keystroke.
- `prsat_to_html.ts`: extended by a causal-aware MathML renderer.
- `causal_decision_ui.ts`: keeps task dispatch, revisions, cancellation, guarded results and whole-problem persistence.
- `causal_decision_style.css`: compact layout and mobile stacking.

New editor, renderer and results modules are reasonable boundaries, not mandated filenames. Do not copy PrSAT's private table function or its live-model lifecycle.

## 4. UI acceptance checks

1. **Visual comparison.** Matched 1280 and 390 captures of both apps, initial and result states, with batch closed and open. Header, panels, teal action and formula previews are present. Fonts are verified as actually rendered (e.g. CDP `getPlatformFontsForNode`), not by `document.fonts.check`, which returned true on current DoSAT with no web font loaded.
2. **Reachability.**
   - The action immediately follows the editor at both widths.
   - The default example's action is visible without scrolling at 1280×900.
   - The action's top is no more than about 250px below PrSAT's for the same four premises as rows (measured 547 / 701, so roughly ≤800 / ≤950). Measure this; don't assume it.
3. **Familiar controls.**
   - Insert, delete, split, merge and Up/Down work on rows.
   - Every row input and button has an explicit, row-specific accessible name, not just "Enter constraint" or "⌫".
   - Focus is predictable.
   - Clear premises preserves the rest of the problem.
4. **Rendering.**
   - `do(X)`, `do(~X)`, `do(X, ~Z)`, `do(X=1)`, `Pr(Y | do(X), Z)`, arithmetic and the Simpson compound conclusion all render, with intervention and observation visually distinct.
   - A valid preview does not imply numerical definedness.
5. **Batch.**
   - Blank and comment lines are handled.
   - Parse / Discard work, and unapplied text blocks Run.
   - The conclusion stays exactly one.
   - No stale debounced or pending text is ever submitted.
6. **Task distinction and validity.**
   - Empty-premise entailment (back-door example) is enabled and returns ENTAILS.
   - The satisfiability-mode conclusion draft is preserved and never submitted.
   - The inconsistent-premises example shows INCONSISTENT PREMISES, never ENTAILS.
7. **Accessible validation.**
   - Inline errors name Graph / Premise N / Conclusion, with `aria-invalid` and `aria-describedby`, plus an announced summary.
   - Regression cases: physical line 4 after a blank line and a comment; a bad conclusion.
8. **Stale results and cancellation.**
   - Edits, cancellation and late completions never show or export a stale result.
   - UNRESOLVED, cancellation and settling messages are honest.
9. **Saved problems.**
   - Save, Load and Copy (loader-compatible JSON) round-trip task, graph, every premise (including none), the conclusion (also in satisfiability mode), Regular, mode and seconds.
   - Existing v1 files still load.
   - A malformed load leaves the current input unchanged.
10. **Mobile containment.** At 390px the page width stays 390 for batch, long formulas, every result state and wide tables. Table scroll containers are reachable by keyboard.
11. **Undefined display.** The undefined-conditioning countermodel still shows "undefined (zero denominator)". The failed conclusion is visible, with exact values and clear model / countermodel labels.
12. **Retained basics.** Zero page errors; labelled controls and live status are kept.

## 5. Inspected and uncertain

**Inspected:**
- All 10 PNGs and their capture JSON, the context file and the source snapshot (hashes match per Codex).
- The specified UI, rendering, parser and HTML entry files.
- Isolated headless Chromium probes outside the checkout:
  - Claude, in `/tmp/dosat-ui-review-bsKGwb/`: `probe.cjs` through `probe4.cjs`, logs and PNGs.
  - Codex, in its own temporary folder.
- No app, repo or server changes; port 5317 untouched.

**Untested or uncertain:**
- Safari, iOS, Firefox and a real screen reader.
- No redesign was built or measured. The 1040 / 1076 and +250px figures are estimates and targets.
- Whether algebraic witness values render cleanly.
- Graph-dependent row validation in `InputBlockLogic` has not been prototyped.
