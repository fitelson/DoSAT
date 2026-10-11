# Consensus debate — 2026-10-11 18:15

## Question
Review ONLY the DoSAT user interface against the user's expectation that it would be more similar to PrSAT. Use the consensus skill defaults: Claude Opus 5.5/xhigh and GPT-6.1 Sol/xhigh. Claude should lead the comparison, and Codex should independently check the observations and proposed design. No recursive debates, other model calls or delegation. Both reports must be compressed to at most40,000outputtokens and within the runner's40,000UTF8-byte guard, preserving decisive observations and qualifications. Follow the mandatory six-field CHECKPOINT and literal final VERDICT protocol.

Workspace: /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus.
Evidence folder: reviews/ui_prsat_alignment_2026-10-11T21-49-47Z.
Read UI_REVIEW_CONTEXT.md, ui_source_snapshot.json and relevant capture JSON. Visually inspect the PNG screenshots in the evidence folder: PrSAT and DoSAT at1280and390px, initial state and after a model/countermodel. At minimum inspect desktop initial/model and mobile initial/model of both apps. Use actual rendered images, not source alone. You may inspect either live UI with headless browser tools in isolated pages. Stay entirely in the background; no visible app/browser, PiP, previews or user-window manipulation.

PrSAT reference: https://fitelson.org/PrSAT/dist/. The currently deployed PrSAT3.0 interface is the primary comparison, not a hypothetical modern redesign or another app. Existing inherited classical UI source in this fork is a secondary reference and can show reusable components. Current DoSAT: https://fitelson.org/DoSAT/dist/decision.html. Current source commit9ad6e1d. Read only UI sources: src/causal_decision_ui.ts, causal_decision_style.css, causal_style.css and style.css; compare block_playground.ts, display_logic.ts, text_to_display.ts and prsat_to_html.ts only for editor/rendering/control/result behavior. Graphify code-only graph is available if helpful. Do not extract prose or images into it.

The user said: 'i was thinking the user interface would be more similar to prsat’s. pls have claude review just the user interface with this in mind.' This is a product/interaction review of the published UI, not implementation authorization in this turn. Do not edit application code, style files, dependencies, server files or repository state. Do not commit, push, deploy or delete any file, including temporary probes. New reviewer probes, browser captures and reports must stay in fresh temporary directories OUTSIDE checkout; preserve them. Never contact or touch permanent port5317, and stop only processes you start. No full solver test suite or long benchmarks are needed for this UI review.

Assess specific differences: layout/visual identity; per-constraint entry and live mathematical rendering; batch input; examples; graph entry; SAT versus entailment controls; file/clipboard/clear affordances; solve/options/status placement and reachability; model/countermodel tables; evaluation affordance; progressive disclosure of advanced information; mobile and keyboard/accessibility behavior. The capture records show initial actions at about374/425px in PrSAT versus1423/1965px in DoSAT, and computed button fonts differ. Confirm these rather than assuming. PrSAT's mobile model screenshot has horizontal overflow; retain responsive improvements rather than reproducing that defect.

Keep new requirements visible enough to prevent misuse: graph declaration and causal assumptions; explicit SAT/entailment distinction and exactly-one conclusion; empty premises allowed for validity; required undefined conclusion terms can be countermodels; inconsistent premises are distinct; error/UNKNOWN/cancel prove nothing; deadlines do not promise immediate physical settlement; interventions can create structural zeros even with regularity. Use these only to assess labels and interactions. The mathematical reduction and solver behavior were approved and are CLOSED for this review. Do not reopen a proof/algorithm audit or alter the prior Phase3 PASS. Do not suggest entailment by merely adding source negation as a constraint. Do not copy old nonempty-premise restrictions or native-model lifecycle into the new UI. A proposed Evaluate-model feature must be classified separately if it requires capability/lifecycle work beyond a presentation change.

Return a concise, self-contained UI review with:
1. An explicit UI alignment verdict (Aligned / Partially aligned / Not aligned), clearly distinct from the completed mathematical phase gate.
2. A prioritized comparison table: PrSAT behavior, current DoSAT behavior, observed impact, concrete proposed change, and whether it is presentation-only or a new capability.
3. A concrete minimal redesign around PrSAT's existing editor/toolbar/result structure while retaining DoSAT's graph and entailment functions. Include a plain-text layout sketch and likely reusable components/file boundaries. Explain what belongs near the primary action and what can move into collapsed help/advanced panels. Separate the first UI alignment pass from optional later features.
4. UI-specific acceptance checks for the eventual implementation (not another solver audit): visual comparison, familiar controls, rendering, empty-premise validity, task distinction, accessible validation, cancellation/stale-result feedback, saved problem completeness and mobile containment.
5. State what you actually inspected and any uncertainty. No vague generic advice, unsupported feature claims, or invented screenshot observations.

Agree only when the concrete review/design is settled between participants. This is a review result, not approval of an unimplemented redesign. Share reviewed Markdown; raw streamed journals remain private. No new development phase is being implemented during this request.

## Models
Claude: claude-opus-5-5/xhigh; Codex: gpt-6.1-sol/xhigh

## Outcome
CONSENSUS REACHED

Claude: 9m 57s (2 turns); Codex: 9m 04s (2 turns); total: 19m 01s

## Agreed answer
# DoSAT vs PrSAT 3.0: interface-only review

## 1. Verdict

**UI alignment: Not aligned.** This verdict covers only the interface. It does not reopen the mathematical/solver Phase 3 PASS, and it is a review, not approval of a redesign that hasn't been built.

DoSAT shares PrSAT's control *ideas*: a regularity option, a time limit, Cancel, and save/load. It has none of PrSAT's recognizable *structures*:
- the dark header card;
- the bordered editor panel with its toolbar;
- one row per constraint, each with a rendered formula;
- the teal primary button with options beside it and the status underneath;
- the visible ⊤/⊥ probability table.

### Measurements (headless Chromium, isolated pages)

| | PrSAT | DoSAT |
|---|---:|---:|
| Initial action Y, 1280×900 / 390×900 | 374.3 / 425.5 (empty input) | 1423.1 / 1964.8 (default 4-premise example) |
| Same test with DoSAT's four premises entered as PrSAT rows, batch closed | 547.3 / 700.8 | 876 / 1264 px lower |
| Screenful containing the action | first | second (desktop) / third (mobile) |
| Rendered fonts | Find Model: Source Sans Pro SemiBold web font, 16px/600. Other buttons: Source Sans Pro 13.33px/500 | Body ".SF NS"; buttons Arial 13.33px |
| Mobile page width with a result | 445 (scrolls sideways) | 390 (fits) |

- **Causes of the font mismatch.** The live `decision.html` has no font `<link>`, unlike `index.html` and `causal.html`. DoSAT also uses `<button>` elements, so PrSAT's `input[type=button]` rules in `style.css` never apply.
- **Checkboxes and number fields** are Arial 13.33px in *both* apps.
- **Removing help text alone doesn't fix it.** Hiding all DoSAT help and header text in a test page only moved the action to 1040 / 1076.
- **The four-premise comparison is not like-for-like.** DoSAT also needs graph and conclusion inputs, so the 876/1264 px gap measures the whole interface difference, not just wasted space.

## 2. Prioritized comparison

"Presentation" means no change to the decision procedure. It does not mean the work is trivial: the causal renderer, batch/Clear handling and Copy are real UI code.

| Pri | PrSAT behavior | Current DoSAT | Observed impact | Proposed change | Scope |
|---|---|---|---|---|---|
| P1 | Dark header, grey bordered panels, teal action button, web fonts | Plain heading and form, browser-default buttons, no web fonts | Looks like a different app | Load fonts as `causal.html` does. Reuse `.header`, `.generic-input-block`, `.model-finder` and `.generate`. Make the button rules apply to `button` | Presentation |
| P1 | Action, Regular/Timeout, Cancel and status sit directly under the editor | Five help paragraphs, search mode, time limit, validation and runtime text come before the action | Action is 876/1264 px further down for the same premises | Action panel directly after the editor | Presentation |
| P1 | Rows with ⌫ / input / ⏎ / ⓘ and a rendered formula beside each valid row. Enter splits a row, Up/Down move, Backspace at the start merges. "Show Batch Input" plus "⇩ Parse" | Full-width textareas, nothing rendered | Core PrSAT workflow missing; users can't check how a `do()` term was read | Premise rows plus a single conclusion row, with a renderer that understands causal terms | Presentation + UI behavior (new renderer and adapter, no solver change) |
| P1 | One task (Find Model) | Small "Question" dropdown. In satisfiability mode the conclusion box stays visible, disabled, and keeps its text | Task choice easy to miss; dead content adds height | Entailment / Satisfiability radio group. Hide the conclusion when inactive but keep its draft. Button label follows the task | Presentation |
| P1 | Bad row: "Syntax error (not a wff)." appears in place and Find Model is disabled. Find Model is also disabled as soon as a key is pressed, until the edit is checked. Inputs are named only "Enter constraint" (from the placeholder) and buttons only "⌫" / "⏎" / "ⓘ". Nothing is announced | One message at y≈1340, far from the fields: no live region, no `aria-invalid` / `aria-describedby`. The wording is specific, but the location is wrong: an error on line 4 (after a blank line and a comment) is reported as "Constraint line 2", and so is a bad conclusion | Errors are hard to find and point to the wrong row | Inline errors that keep DoSAT's wording and name Graph / Premise N / Conclusion, with linked descriptions and an announced summary near the action | UI validation |
| P2 | Load From File / Show Batch Input / Clear above the rows; Save to File / Copy to Clipboard below. The file picker is hidden | "Save problem", the browser's raw "Choose File / No file chosen" control, and "Save solver input" below Run. No Clear, no Copy | Unfamiliar file workflow; missing controls | PrSAT's labels and positions, plus Examples in the toolbar. "Clear premises". Save/Load/Copy use the whole-problem v1 JSON. "Save solver input" moves under the results, where PrSAT's "Save SMTLIB input" sits | Presentation + UI behavior (Copy, Clear) |
| P2 | No graph | 3-row graph textarea plus help; variable count appears only near the bottom | Essential but takes too much room | Compact graph field at the top of the editor (still accepts newlines and semicolons), ⓘ button, live summary next to it | Presentation |
| P2 | "Regular" checkbox; "Timeout: [60] seconds"; countdown while searching | Long regularity label with a help paragraph, a "Search mode" dropdown, and a time field greyed out in the default mode | Options dominate the path to Run | Compact Regular and Time-limit controls; the structural-zero and deadline notes stay visible (§3) | Presentation |
| P2 | Header links to the webpage and a demo; each row's "ⓘ How?" shows syntax | Two header paragraphs plus four always-visible help paragraphs, including solver internals (QF_NRA, NLSat) | Main cause of the distance to Run | Syntax into ⓘ buttons; internals into a collapsed panel; one-line qualifications stay visible | Presentation |
| P2 | "Constraints are SATisfiable!" right under the button; ⊤/⊥ table with rendered fractions; Evaluate model beside it | Bold status, "Input probabilities" table (raw text + exact value), "Shared causal mechanisms" table, then each regime's 0/1 table collapsed | Model is hard to recognize; distributions changed by interventions (including forced zeros) are hidden | Status in PrSAT's position with DoSAT's wording. Visible ⊤/⊥ regime table and rendered input probabilities. Submitted conclusion shown beside its witness values | Presentation (uses existing witness data) |
| P2 | No in-app examples | Nine examples at the top | Advantage for DoSAT | Keep; move into the toolbar | Presentation |
| P3 | Model view overflows on mobile. After an edit, the old model stays dimmed under "No up-to-date model to display" and its buttons still look active | Fits at 390px in all captures. Fields labelled, status announced, results cleared on edit ("Input changed; decide the current problem."). Tab order: two links, example, task, graph, premises, conclusion, regular, mode, run. Cmd/Ctrl+Enter does nothing | DoSAT is better on these points | Keep fitting on mobile, the labels, announcements and clear-on-edit. Adopt PrSAT's row keyboard behavior and its disable-while-editing | Preserve / UI behavior |
| Later | Evaluate model panel, Decimals toggle, Save table as image | None | Familiar features missing | Evaluate model needs separately scoped evaluation and lifecycle work. Decimals, image export, a graph drawing and a run shortcut are optional presentation additions | Evaluate = **new capability**; the rest = presentation |

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
                                        · independent disturbances assumed
  Premises (may be empty)            ("Constraints" in SAT mode)
    [⌫] [Pr(Z) = 1/2     ] [⏎] [ⓘ]  rendered formula
    [⌫] [Pr(X | Z) = 3/4 ] [⏎] [ⓘ]  rendered formula
    ...remaining premises...
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

**Keep visible, near the inputs and the action (these prevent misuse):**
- The task choice and a button labelled with the task.
- In entailment mode with no premises: "No premises: checks validity", and Run stays **enabled**.
- "Conclusion (exactly one)" as a single row: no ⏎ button, no batch input, never a second row.
- The note that an undefined required term can stop the conclusion from holding.
- The graph requirement and the independent-disturbance assumption.
- The regularity note that interventions can still force zeros.
- What the deadline means.
- DoSAT's distinct outcomes:
  - SAT and UNSAT;
  - ENTAILS and DOES NOT ENTAIL;
  - INCONSISTENT PREMISES, with its vacuity explanation;
  - UNRESOLVED;
  - "Cancelled — no decision established";
  - errors.
- "Waiting for the solver to settle" feedback during cancellation or after a deadline. An error, UNKNOWN or a cancel proves nothing, and the wording must not suggest otherwise.

**Move into ⓘ buttons or collapsed panels:**
- `do()` syntax (row ⓘ) and graph syntax (graph ⓘ);
- search-mode internals (QF_NRA budget, NLSat);
- the long model-class paragraph;
- the six-variable limit.

**Results:**
- The observational distribution is always visible.
- A few regimes can sit side by side as columns (Observational, do(X), …). Many regimes need scrolling inside the table box or a clearly labelled selector.
- Keep exact values and "undefined (zero denominator)".
- User-named real variables stay visible when present; the mechanisms table may start collapsed.
- The submitted conclusion is shown next to its witness term values. This uses existing witness data and must not suggest a general evaluator for arbitrary compound constraints.

**Batch and Clear:**
- Parse replaces the premises only.
- If batch text has been edited but not parsed, it is visibly marked "not applied", results are cleared, and Run stays disabled until Parse or Discard.
- Hiding the batch box neither applies nor silently discards it.
- Clear premises keeps the graph, conclusion and options.
- Load From File applies the whole JSON problem directly. PrSAT instead loads files into the batch box.

**Do not copy from PrSAT:**
- Disabling Run on empty input: empty-premise validity needs Run enabled.
- Saving only a plain list of constraints.
- Loading files through the batch box.
- The private table function, which is tied to PrSAT's `a_i` variables.
- The live native-model lifecycle.
- The dimmed out-of-date model.
- The mobile overflow.
- Any old rule that premises must be non-empty.

Entailment must never be presented or implemented as "add the negated conclusion as one more constraint."

**Reusable pieces and file boundaries:**
- `decision.html`: font links matching `causal.html` / `index.html`.
- `style.css`: header, panel, toolbar, `.generate` and table conventions; extend the button selectors to `button`.
- `block_playground.ts`:
  - `split_input` and `generic_input_block` are exported; the row and batch container functions are private.
  - `generic_input_block` hard-wires plain-text Save/Load. Either make those handlers configurable or build DoSAT's toolbar around the row and batch pieces.
  - The row component needs causal help text, DoSAT's specific errors, row-specific accessible names, and a conclusion mode.
- `display_logic.ts`: reuse the row and batch logic. Rows are checked against the graph's variables, so a graph edit must re-check every row. Keep PrSAT's disable-Run-while-editing behavior.
- `prsat_to_html.ts`: its MathML construction patterns, extended by a renderer that understands causal terms.
- `causal_decision_ui.ts`: keeps task dispatch, revision guards, cancellation, guarded result updates and whole-problem persistence; otherwise reduced to layout and wiring.
- `causal_decision_style.css`: task toggle, compact graph row, results stacking at ≤600px, table scrolling inside its own box.
- Suggested new modules (sensible boundaries, not required names):
  - `causal_to_html.ts` for the renderer;
  - `causal_decision_editor.ts` for row-by-row checking with the existing parser. The existing whole-problem check stays authoritative before a run.
  - `causal_decision_results.ts` for the regime table and rendered inputs.
- Keep the existing test IDs (`decision-run`, `decision-status`, …) or update the tests along with the interface.

**Optional later work, not in the first pass:**
- Evaluate model (new capability: arbitrary new causal queries, interventions and undefined cases need separately reviewed evaluation and lifecycle work);
- Decimals toggle;
- Save table as image;
- a countdown in time-limited mode, saying the solver may still be settling after the deadline;
- a drawn graph diagram;
- Ctrl/Cmd+Enter to run.

## 4. UI acceptance checks for the eventual implementation

1. **Visual comparison.**
   - Matched 1280 and 390 captures of both apps, initial and result states, with the batch box both closed and open.
   - The header card, grey panels, teal action button and formula previews are all present.
   - Confirm fonts from what the browser actually renders (e.g. CDP `getPlatformFontsForNode`), not `document.fonts.check`, which returned true on the current DoSAT with no web font loaded.
2. **Reachability.**
   - The action directly follows the editor at both widths.
   - With the default example at 1280×900, the action is visible without scrolling.
   - Target: the action's top is no more than about 250px below PrSAT's for the same four premises (PrSAT 547/701, so roughly ≤800/≤950). Measure it; don't assume it.
3. **Familiar controls.**
   - Exact labels: Load From File, Show/Hide Batch Input, Clear premises, Save to File, Copy to Clipboard, ⇩ Parse.
   - Insert, delete, split, merge and Up/Down navigation work on rows.
   - Every row input and button has its own explicit accessible name ("Premise 2", "Delete premise 2"), not just "Enter constraint" or "⌫".
   - Focus moves predictably.
   - Clear premises keeps the rest of the problem.
4. **Rendering.**
   - These all render, with interventions and observations visually distinct: `Pr(Y | do(X))`, `do(~X)`, `do(X, ~Z)`, `do(X=1)`, `Pr(Y | do(X), Z)`, arithmetic, and the Simpson example's compound conclusion.
   - Invalid rows show DoSAT's specific message inline.
   - A valid preview must not suggest the value is defined.
5. **Batch.**
   - Blank and comment lines are handled.
   - Parse and Discard work, and unapplied text blocks Run.
   - The conclusion stays exactly one; pasting several lines gives an "exactly one conclusion" error.
   - Stale pending or debounced text is never submitted.
6. **Task distinction and validity.**
   - Switching task shows or hides the conclusion and relabels the button.
   - Entailment with no premises (back-door example) runs and returns ENTAILS.
   - In satisfiability mode the conclusion is kept as a draft and never submitted.
   - The inconsistent-premises example shows INCONSISTENT PREMISES, never ENTAILS.
7. **Accessible validation.**
   - Inline errors name Graph / Premise N / Conclusion and use `aria-invalid` + `aria-describedby`.
   - A summary near the action is announced, and a disabled Run explains why.
   - Run can be reached by keyboard alone from the first field.
   - Regression cases: an error on line 4 after a blank line and a comment, and a bad conclusion.
8. **Stale results and cancellation.**
   - Any edit clears the result and disables "Save solver input".
   - Cancel shows "Cancelled — no decision established"; reaching the time limit shows UNRESOLVED; the settling message shows during cleanup.
   - Race test: start a run, edit, then let the old run finish. Nothing from the old run is shown or exportable.
9. **Saved problems are complete.**
   - Save, Load and Copy (JSON the loader accepts) round-trip the task, graph, every premise (including none), the conclusion (also in satisfiability mode), Regular, search mode and seconds.
   - Existing v1 files still load.
   - A malformed file shows an inline error and leaves the current input unchanged.
10. **Mobile containment.**
    - At 390px the page stays 390px wide with the batch box open, with long formulas, in every result state (model, countermodel, entailed, error) and with wide tables.
    - Table scroll boxes can be reached by keyboard.
11. **Undefined display.**
    - The "Undefined conditioning prevents entailment" countermodel still shows "undefined (zero denominator)" for Pr(A | B).
    - The failed conclusion is visible next to exact values, with clear model/countermodel labels.
12. **Basics kept.** Zero page errors in every capture; labelled controls and the live status remain.

## 5. What was inspected, and what is uncertain

**Inspected:**
- `UI_REVIEW_CONTEXT.md`, `ui_source_snapshot.json` (hashes match) and all ten capture JSONs.
- All ten PNGs, viewed directly: both apps at 1280 and 390, initial and model states, plus DoSAT's countermodel captures.
- The DoSAT UI source and its two style sheets, PrSAT's `style.css`, `block_playground.ts`, `display_logic.ts`, and the relevant parts of `text_to_display.ts` and `prsat_to_html.ts`.
- The DoSAT parsers (to see how error line numbers are counted) and the three HTML entry pages.
- Headless Chromium probes of both live apps in isolated pages. They covered:
  - fonts and the accessibility tree;
  - tab order and Cmd/Ctrl+Enter;
  - validation and line numbering;
  - empty premises and an empty or two-line conclusion;
  - undefined, inconsistent, entailed and satisfiable outputs;
  - expanded regime tables;
  - the help-hiding test;
  - PrSAT's empty-input and bad-row behavior, its dimmed out-of-date model, and its disable-while-editing;
  - the four-premise PrSAT comparison.

**Where things are:** probes, logs, extra screenshots (`prsat-{1280,390}-4rows.png`, stale/bad-row captures) and the full review are in `/tmp/dosat-ui-review-bsKGwb/`. A second independent review and its probes are at `/var/folders/h1/jv_lt9bj42dgghwf8b3khjpw0000gn/T/dosat-ui-codex-review-feltgr68/`. No application, repository or server state was changed, nothing was deleted, no visible browser was opened, and port 5317 was not touched.

**Uncertain:**
- Only headless Chromium on macOS was used. Safari, iOS, Firefox and a real screen reader are untested.
- No redesign was built or measured. The 1040/1076 figures come from a CSS-hiding test page, and ≤800/≤950 is a target.
- It hasn't been checked whether algebraic (irrational) witness values render cleanly.
- Re-checking every row whenever the graph changes, inside PrSAT's row logic (`InputBlockLogic`), has not been prototyped.
- PrSAT's inline "Syntax error" did not appear red in the captures despite its error styling (cosmetic).

## Claude  (verdict: DISAGREE, 7m 45s)
CHECKPOINT
elapsed: ~35 min
tentative_verdict: DoSAT's interface is NOT ALIGNED with PrSAT. This is a UI verdict only; the mathematical Phase 3 PASS is closed and untouched.
new_results: NEW: Checked all 10 screenshots and the capture metrics. Headless probes of both live apps found four things. (1) The live `decision.html` loads no web fonts: text renders as ".SF NS" and buttons as "Arial". (2) DoSAT's `<button>` elements miss PrSAT's `input[type=button]` styling. (3) DoSAT's "Constraint line N" error numbering is wrong: blank and comment lines and conclusion errors are miscounted. (4) Hiding all help text only moves the run button to y≈1040/1076.
current_obstruction: none; Codex still needs to check the observations and the proposed design independently.
next_bounded_step: Read Codex's check, settle any disputed rows or acceptance checks, then converge.
token_cost: unavailable
END CHECKPOINT

# DoSAT vs PrSAT: interface-only review (Claude, round 1)

The full report (about 21 KB, same content) is at `/tmp/dosat-ui-review-bsKGwb/CLAUDE_UI_REVIEW_round1.md`. The probe scripts, logs and four extra screenshots are in the same folder, outside the checkout. I changed no app, server or repository files and did not touch port 5317.

## 1. Verdict

**Not aligned.** DoSAT has none of PrSAT's signature structures:
- the dark header card;
- the bordered editor panel with its toolbar;
- one row per constraint, each showing the rendered formula;
- the teal primary button with Regular and Timeout beside it;
- the status line directly under the button;
- the ⊤/⊥ probability table with an Evaluate model panel next to it.

Only the control *concepts* carry over: the regularity option, the time limit, Cancel, and save/load.

## 2. Prioritized comparison

| # | PrSAT (observed) | DoSAT now (observed) | Impact | Proposed change | Type of change |
|---|---|---|---|---|---|
| P1-1 | The action button is at y=374 on desktop and 425 on mobile. Regular and Timeout sit to the right of the teal "Find Model" button; Cancel is below it, then the status. | The action button is at y=1423 / 1965 (confirmed in the capture data). Five help paragraphs plus the search mode and time limit come before it. When I hid all help and header text in a test page, the button only moved up to 1040 / 1076. | The main button is 3–5 screens down on a phone. Collapsing the help alone won't fix it. | A PrSAT-style action panel directly under the editor: teal button labelled by task, short options beside it, Cancel below, live status below that. | Presentation only |
| P1-2 | One row per constraint with delete, input, new-line and ⓘ buttons, and the rendered formula beside each valid row. Enter splits a row, Up/Down move between rows, Backspace at the start merges rows. "Show Batch Input" plus "⇩ Parse" for pasting. | Premises and conclusion are full-width text boxes. Nothing is rendered. | This is the core of how PrSAT feels. Users can't see how a `do()` term was read. | Reuse PrSAT's row editor for premises; make the conclusion a single row; add a renderer for causal terms. | Presentation (needs a new renderer and adapter, no solver change) |
| P1-3 | Loads Source Sans Pro and Source Code Pro as web fonts (confirmed on Find Model). Grey bordered panels and styled buttons. | The live `decision.html` has **no web-font link**, unlike `index.html` and `causal.html`. Text renders in the system font and buttons in 13.33px Arial. The buttons are `<button>` elements, so PrSAT's button styles (written for `input[type=button]`) never apply. No header card, no panels. | It looks like a different, unstyled app. | Add the font links. Reuse PrSAT's header, panel and primary-button styles, and make the button styles apply to DoSAT's buttons. | Presentation only |
| P1-4 | One task only (Find Model). | A small "Question" dropdown. In satisfiability mode the conclusion box stays visible, greyed out, and still holds its text. | The task choice is easy to miss, and the disabled box is clutter. | Two radio buttons at the top of the editor: "Check entailment" / "Find a model (satisfiability)". The conclusion block appears only for entailment, labelled "Conclusion (exactly one)". The run button's label follows the task. | Presentation only |
| P1-5 | A bad row shows "Syntax error (not a wff)." in place, and Find Model is disabled (tested). No accessibility labels or announcements. | One message at y≈1340, far from the fields, with no screen-reader announcement and no link to the faulty field. The messages are specific, which is good, but the **line numbers are wrong**. In tests, an error on line 4 (after a blank line and a comment) was reported as "Constraint line 2", and a bad *conclusion* was also reported as "Constraint line 2". Premises and conclusion are counted together, skipping blank lines. | Errors are hard to find and can point to the wrong line. | Show each error inline using DoSAT's specific wording, and name the part ("Premise 3", "Conclusion", "Graph"). Mark invalid fields for screen readers and add a short announced summary near the action. | Presentation only |
| P2-1 | No graph. | A 3-row graph box plus help; the variable count appears only near the bottom. | The graph is essential but takes too much room. | A compact "Causal graph" row at the top of the editor with an ⓘ button and a live summary, e.g. "3 observed variables: Z, X, Y · independent disturbances assumed". | Presentation only |
| P2-2 | Toolbar above the rows: Load From File, Show Batch Input, Clear. Below the rows: Save to File, Copy to Clipboard. The file picker itself is hidden. | A "Save problem" button, the browser's raw "Choose File / No file chosen" control, and "Save solver input". No Clear, no Copy. | File controls look unfamiliar, and Clear and Copy are missing. | Use PrSAT's labels and positions, with an Examples menu in the same row. Save, Load and Copy act on the **whole problem** (the existing JSON format). Move "Save solver input" under the results, where PrSAT's "Save SMTLIB input" sits. | Presentation; Copy is a small new UI function |
| P2-3 | "Regular" checkbox; "Timeout: [60] seconds"; a live countdown while searching. | A long regularity checkbox with its own help paragraph, a "Search mode" dropdown, and a time-limit field that is greyed out in the default mode. | Three controls plus help where PrSAT has two short ones. | Beside the button: "☐ Regular — observational rows positive; interventions can still force zeros" with ⓘ, and "☐ Stop after [30] s" with ⓘ (unchecked means the full decision procedure). | Presentation only |
| P2-4 | The header links to the PrSAT webpage and a demo; each row's "ⓘ How?" shows syntax help. | Two header paragraphs and four always-visible help paragraphs, including solver internals (QF_NRA, NLSat). | This is what pushes the inputs and button down (P1-1). | Move `do()` syntax into the row ⓘ, graph syntax into the graph ⓘ, and search internals into a collapsed panel. Keep the one-line warnings listed in §3 visible. | Presentation only |
| P2-5 | "Constraints are SATisfiable!" under the button. A ⊤/⊥ table with rendered fractions on the left, Evaluate model on the right, save buttons below. | A bold status, an "Input probabilities" table (raw text and exact value), a "Shared causal mechanisms" table, and each regime's full table hidden in a collapsed section using 0/1 rather than ⊤/⊥. | Results don't read like PrSAT results, and the intervened distributions (including zeros forced by interventions) are hidden. | Status in PrSAT's position, keeping DoSAT's precise wording. Main table in PrSAT style: ⊤/⊥ rows, with one probability column per regime (Observational, do(X), …). Beside it, the input probabilities with rendered terms, still saying "undefined" where applicable. Mechanisms table below. | Presentation only (all data is already in the result) |
| P2-6 | No examples in the app. | An examples menu at the top (9 examples). | An advantage of DoSAT. | Keep it, moved into the toolbar. | Presentation only |
| P3-1 | At 390px the model view is 445px wide, so the page scrolls sideways. | No sideways scrolling at 390px in any capture. | DoSAT is better here. | Keep it that way: stack result columns on narrow screens and let rendered formulas wrap under their row. | Presentation only |
| P3-2 | Rows support Enter/Up/Down/Backspace, but inputs have no accessible names and nothing is announced. | Fields are labelled and status changes are announced. Tab order from the top (tested): two links, example, task, graph, premises, conclusion, regular, mode, run. Cmd/Ctrl+Enter does nothing (tested). | Adopting PrSAT's editor must not lose DoSAT's accessibility. | PrSAT's row keyboard behavior, plus a name for each row ("Premise 2") and the announced status. Optional: Ctrl/Cmd+Enter to run. | Presentation only |
| P3-3 | After an edit, the old model stays dimmed under "No up-to-date model to display" (tested), and its buttons still look active. | After an edit, results are cleared and the status says "Input changed; decide the current problem." | DoSAT's approach is stricter, which suits a decision tool. | Keep clear-on-edit for the first pass. | No change |
| P3-4 | Evaluate model panel, with a Decimals toggle. | None. | A familiar PrSAT feature is missing. | **A later feature that needs new capability.** Evaluating arbitrary causal terms (including new interventions and undefined cases) against the result needs new evaluation logic, not just new display. Don't copy PrSAT's live-solver approach. A Decimals toggle and "Save table as image" are display-only but optional. | New capability (Evaluate); presentation (Decimals, image) |

**Correction to the context file:** only PrSAT's Find Model button is 16px and semibold. Its other buttons are Source Sans Pro at 13.33px. Checkboxes and number fields are 13.33px Arial in **both** apps.

## 3. Minimal redesign (first alignment pass)

```
┌─ DoSAT 1.0 ──────────────────────────────── dark header card ─┐
│ A Decision Procedure for Do Calculus.                          │
│ Acyclic graph of observed Boolean variables · independent      │
│ private disturbances · interventions share mechanisms.         │
│ Syntax help · Causal model finder · Do-calculus step checker   │
└────────────────────────────────────────────────────────────────┘
┌─ editor panel ─────────────────────────────────────────────────┐
│ (•) Check entailment   ( ) Find a model (satisfiability)       │
│ [Load From File] [Show Batch Input] [Clear] [Examples ▾]       │
│ Causal graph [Z -> X; Z -> Y      ] ⓘ  3 variables: Z, X, Y    │
│ Premises (may be empty)                                        │
│  [⌫][Pr(Z) = 1/2     ][⏎][ⓘ]  Pr(Z) = ½                        │
│  [⌫][Pr(X | Z) = 3/4 ][⏎][ⓘ]  Pr(X | Z) = ¾                    │
│ Conclusion (exactly one)                                       │
│  [Pr(Y | do(X)) = 1/2][ⓘ]  Pr(Y | do(X)) = ½                   │
│  If a required term is undefined, the conclusion fails.        │
│ [Save to File] [Copy to Clipboard]                             │
└────────────────────────────────────────────────────────────────┘
┌─ action + results panel ───────────────────────────────────────┐
│ [ Check entailment ]  ☐ Regular (interventions can still       │
│                         force zeros) ⓘ                         │
│                       ☐ Stop after [30] s ⓘ                    │
│ [Cancel]                                                       │
│ DOES NOT ENTAIL — a countermodel was found.  (announced)       │
│ ┌ Z X Y │ Observational │ do(X) ┐  ┌ Input probabilities ┐     │
│ │ ⊤ ⊤ ⊤ │       …       │   …   │  │ Pr(Z)          ½    │     │
│ └───────────────────────────────┘  │ Pr(Y | do(X))  ½    │     │
│                                    └─────────────────────┘     │
│ Shared causal mechanisms (Variable │ Parents │ Pr(=⊤))         │
│ [Save solver input] [Save to File]                             │
└────────────────────────────────────────────────────────────────┘
```

**Keep visible near the inputs and button** (to prevent misuse):
- the task radio buttons and the task-labelled run button;
- "Premises (may be empty)", with a hint such as "No premises: checks validity" when empty in entailment mode;
- "Conclusion (exactly one)" as a single row, with no new-line button and no batch input;
- the one-line note that an undefined required term makes the conclusion fail;
- the graph summary, including "independent disturbances assumed";
- the Regular note that interventions can still force zeros;
- DoSAT's status wording:
  - ENTAILS;
  - DOES NOT ENTAIL;
  - INCONSISTENT PREMISES, kept distinct and with its "holds vacuously" explanation;
  - UNRESOLVED;
  - "Cancelled — no decision established";
  - errors;
- "waiting for the solver to settle" while cancelling or after a time limit.

**Move into ⓘ buttons or collapsed panels:**
- `do()` and graph syntax;
- search-mode internals (QF_NRA budget, NLSat);
- the long model-class paragraph;
- the six-variable limit.

**Do not copy from PrSAT:**
- Disabling the button when the input is empty. PrSAT does this (tested); DoSAT's entailment button must stay enabled with no premises, because that is how validity is checked.
- Saving only the premises (PrSAT saves a plain constraint list). Save, Load and Copy must carry the whole problem.

**Reusable pieces and file layout:**
- `decision.html`: add the web-font links, copied from `causal.html`.
- `block_playground.ts`: reuse the per-row editor (`split_input`) and its keyboard behavior. Its full block component hard-wires PrSAT's plain-text Save/Load, so either make those handlers configurable or build DoSAT's toolbar around the row and batch pieces (these are not currently exported).
- `display_logic.ts`: reuse the row and batch logic. Because each row is checked against the graph's variables, editing the graph must re-check every row.
- New `causal_to_html.ts`: renders `Pr(… | do(…), …)` terms, plugging into PrSAT's existing formula renderer in `prsat_to_html.ts`.
- New `causal_decision_editor.ts`: checks one row at a time using the existing parser. The existing whole-problem check stays authoritative before a run.
- New `causal_decision_results.ts`: the ⊤/⊥ regime table and the rendered input-probabilities table. Reuse PrSAT's table CSS; its table-drawing function isn't exported and is tied to PrSAT's a_i variables.
- `causal_decision_ui.ts`: reduced to layout and wiring.
- `causal_decision_style.css`: the task toggle, graph row, and result layout that stacks at 600px and below.
- Keep the existing test IDs (`decision-run`, `decision-status`, …) or update the tests along with the interface.

**Later and optional (not in the first pass):**
- Evaluate model (needs new capability);
- Decimals toggle;
- Save table as image;
- a countdown in time-limited mode, with wording that the solver may still be settling after the deadline;
- a drawn graph diagram;
- Ctrl/Cmd+Enter to run;
- a dimmed out-of-date result, only if it is clearly labelled and can't be acted on.

## 4. Acceptance checks for the eventual implementation

1. **Visual comparison.** Capture both apps the same way at 1280 and 390 px, before and after a result. DoSAT should show the dark header card, grey bordered panels and teal main button. Fonts must be confirmed by what the browser actually renders: Source Sans Pro for text and buttons, Source Code Pro for row inputs. Don't rely on `document.fonts.check`; it reported success on the current DoSAT even though no web font is loaded.
2. **Reachability.**
   - Desktop (1280×900), default example: the run button is fully visible without scrolling.
   - Both widths: the gap from the last input row to the run button is at most 120 px, with no multi-line help text in between.
3. **Familiar controls.**
   - Exact labels: Load From File, Show/Hide Batch Input, Clear, Save to File, Copy to Clipboard, ⇩ Parse.
   - Each row has delete, new-line and ⓘ buttons.
   - Enter splits a premise row, Backspace at the start merges rows, and Up/Down move between rows.
   - Parse replaces the rows.
4. **Rendering.** A rendered formula appears beside every valid row for these inputs:
   - `Pr(Y | do(X))`
   - `do(~X)`
   - `do(X, ~Z)`
   - `do(X=1)`
   - `Pr(Y | do(X), Z)`
   - arithmetic
   - the compound conclusion in the Simpson example

   An invalid row shows DoSAT's specific message inline.
5. **Validity with no premises.** In "Check entailment" with one empty premise row and the back-door conclusion, the button is enabled and the result is ENTAILS. Inconsistent premises show INCONSISTENT PREMISES, never ENTAILS.
6. **Task distinction.**
   - Switching task shows or hides the conclusion and changes the button label.
   - Satisfiability never submits the conclusion.
   - Conclusion text survives switching back and forth, and is saved.
   - The conclusion can't gain a second row; pasting several lines gives "exactly one conclusion".
7. **Accessible validation.**
   - Every invalid field or row is marked for screen readers and linked to a message that names the visible part and row ("Premise 3", "Conclusion", "Graph").
   - Include a regression case with blank and comment lines plus a bad conclusion.
   - A short summary near the button is announced, and a disabled button explains why.
   - Every row has an accessible name.
   - Run is reachable by keyboard alone from the first field.
8. **Cancellation and stale results.**
   - Any edit clears the current result, disables "Save solver input", and the status says there is no current decision.
   - Cancel shows "Cancelled — no decision established"; reaching the time limit shows UNRESOLVED; the settling message appears while cleanup runs.
   - Race test: start a run, edit, and let the old run finish. Nothing from the old run appears.
9. **Saved problems are complete.**
   - Save and Copy round-trip:
     - the task;
     - the graph;
     - every premise row (including none);
     - the conclusion, even in satisfiability mode;
     - Regular;
     - the search mode;
     - the seconds.
   - Loading restores identical rows and rendering, and existing saved DoSAT files still load.
   - A bad file shows an inline error and leaves the current problem unchanged.
10. **Mobile containment.** At 390 px the page width stays 390 in the initial, batch-open, model, countermodel, entailed and error states. Wide tables scroll inside their own box and result columns stack.
11. **Undefined display.** The countermodel for the "Undefined conditioning prevents entailment" example still shows "undefined (zero denominator)" for Pr(A | B).
12. **No page errors** in any capture.

## 5. What I inspected, and what is uncertain

**Inspected:**
- The context, prompt, source snapshot and capture-script files, plus the control positions and fonts recorded for all 10 captures.
- All 10 screenshots, viewed directly: both apps at 1280 and 390, before and after a model, plus DoSAT's countermodel.
- The interface sources: DoSAT's UI file and its two style sheets, PrSAT's shared style sheet, PrSAT's row editor, the relevant parts of PrSAT's main display and formula-rendering files, the DoSAT parsers (for how error lines are counted), and the three HTML entry pages.
- Live headless-browser probes of both apps in isolated pages. They covered:
  - rendered fonts;
  - accessibility attributes;
  - tab order;
  - Cmd/Ctrl+Enter;
  - validation messages and line numbers;
  - empty premises;
  - an empty or two-line conclusion;
  - undefined, inconsistent, entailed and satisfiable outputs;
  - the expanded regime tables;
  - the help-hiding reachability estimate;
  - PrSAT's empty-input and bad-row behavior;
  - PrSAT's dimmed out-of-date result.

**Uncertain:**
- I tested only headless Chromium on macOS: no Safari, iOS, Firefox or screen reader.
- The 1040/1076 figures come from hiding text in a test page, not from measuring a redesign.
- I haven't checked whether every result value (for example, irrational numbers) renders cleanly as a formula or decimal.
- Checking each row against the graph in PrSAT's row logic is an implementation risk I haven't prototyped.
- PrSAT's inline "Syntax error" didn't appear red in my capture despite its error styling; this is cosmetic.

VERDICT: DISAGREE

## Codex  (verdict: DISAGREE, 7m 55s)
CHECKPOINT
elapsed: ~20 min
tentative_verdict: DISAGREE on specific design corrections; UI alignment verdict: Not aligned.
new_results: NEW: Independently inspected all ten screenshots and capture JSON, verified source-snapshot hashes, and reproduced geometry, rendered fonts, validation misidentification and empty-premise availability. Chromium’s accessibility tree corrects the claim that PrSAT inputs have no accessible names.
current_obstruction: Deadline wording, the countermodel sketch and batch/Clear behavior need agreement.
next_bounded_step: Claude should accept or challenge the refinements below; no implementation is authorized.
token_cost: unavailable
END CHECKPOINT

I agree with Claude’s central conclusion: **DoSAT is Not aligned with the deployed PrSAT 3.0 interface.** This is a UI verdict; the completed mathematical Phase 3 PASS remains closed.

PrSAT’s familiar structure is its dark header, bordered editor and action panels, individual constraint rows with mathematical previews, toolbar and prominent probability table. DoSAT’s long form, large textareas, extensive help and native buttons substantially change that interaction.

My independent checks confirm the central observations:

| Measurement | PrSAT | DoSAT |
|---|---:|---:|
| Initial action Y, 1280×900 | 374.3px | 1423.1px |
| Initial action Y, 390×900 | 425.5px | 1964.8px |
| Primary-action font | Source Sans Pro, 16px | Arial, 13.33px |
| Mobile model document width | 445px | 390px |

The initial inputs differ: PrSAT starts empty; DoSAT starts with four premises. These figures establish the current reachability problem, not a controlled estimate of redesign savings. At 390×900 DoSAT’s action is in the third viewport, rather than the unsupported “3–5 screens down.”

I need these corrections before endorsing the concrete proposal:

- **Replace “Stop after [30] s.”** Use an optional “Time limit: [30] seconds,” with visible wording: “Off: no overall time limit. The deadline ends result acceptance; cancellation and cleanup can take longer.” Strategy details can collapse; this qualification should remain near the action.
- **Correct the countermodel sketch.** It currently claims `Pr(Y | do(X)) = 1/2`, displays a witness value of `1/2`, and labels that a countermodel. Use the captured incorrect claim `= 3/4`, whose witness value is `1/2`.
- **Correct the accessibility claim.** Chromium names PrSAT’s row input “Enter constraint” from its placeholder. The verified weakness is the absence of explicit row-specific labels and linked/announced validation, rather than no accessible names.
- **Define batch and Clear semantics.** I propose “Clear premises,” preserving graph, conclusion and options. Parse replaces premises only. Edited batch text should be visibly unapplied; clear stale results and disable Run until Parse or Discard.
- **Clarify reuse.** `split_input` and `generic_input_block` are exported. Their internal row-container and batch-container functions are private. The exported row component still needs causal help, specific errors, accessibility and conclusion-control adaptations.

The refined comparison is:

| Priority | PrSAT behavior | Current DoSAT behavior | Observed impact | Proposed change | Scope |
|---|---|---|---|---|---|
| P1 | Dark header, grey panels, teal primary action | Plain heading/form, native grey buttons | Different visual identity | Reuse existing header/panel/colors; load fonts; style semantic buttons | Presentation |
| P1 | Action/options immediately follow editor; status underneath | Help, mode and runtime information precede distant action | Substantial scrolling | Put action/options/status directly after editor | Presentation |
| P1 | Individual constraint rows and rendered formulas | Textareas without mathematical previews | Familiar editing workflow absent | Premise rows plus one conclusion block; causal-aware previews | Presentation + UI behavior |
| P1 | One Find Model task | Small Question dropdown; disabled conclusion remains visible in SAT | Task distinction less prominent; unused content adds height | Entailment/SAT radio group; hide and preserve inactive conclusion | Presentation |
| P1 | Invalid row identified locally | Distant validation; physical premise line 4 and conclusion both reported as “Constraint line 2” | Errors misidentify their location | Inline Graph/Premise N/Conclusion errors and linked live summary | UI validation |
| P2 | Load/Batch/Clear above rows; Save/Copy below | Save problem, exposed file picker and solver export below Run; no Clear/Copy | Toolbar workflow differs | Familiar placement; Clear premises; complete-problem JSON Save/Load/Copy | Presentation + UI behavior |
| P2 | No graph or observed in-app examples | Required graph; nine examples | Useful additions occupy considerable space | Compact multiline-capable graph editor; adjacent summary; toolbar Examples | Presentation |
| P2 | Short Regular/Timeout controls | Long labels/help and separate search-mode controls | Options dominate the route to Run | Compact controls with visible structural-zero/deadline qualifications | Presentation |
| P2 | Visible ⊤/⊥ probability table with mathematical values | Queries, mechanisms, then collapsed distributions using 0/1 | Full model less recognizable | Visible regime table, rendered queries and nearby failed conclusion; mechanisms below | Presentation using existing witness data |
| P3 | Mobile model overflows | Supplied DoSAT captures remain contained | DoSAT has an advantage | Stack results and contain table scrolling | Preserve presentation |
| P3 | Familiar row keyboard operations; dimmed stale model | Labelled fields/live status; results cleared on edits | Copying wholesale could lose safeguards | Adapt row operations while retaining labels, announcements and clear-on-edit | UI behavior |
| Later | Evaluate model | Absent | Familiar feature missing | Separately scope arbitrary causal-query evaluation | New computational capability |

“Presentation” does not mean trivial implementation. The causal renderer requires new presentation code; batch, Clear and clipboard handling require UI behavior. They do not require changing the decision procedure.

A minimal first alignment pass would be:

```text
DARK HEADER: DoSAT 1.0
  A Decision Procedure for Do Calculus.
  Observed Boolean DAG · independent private disturbances
  Shared mechanisms across interventions · help/navigation

EDITOR PANEL
  Task: (•) Check entailment  ( ) Satisfiability
  [Load From File] [Show Batch Input] [Clear premises] [Examples ▾]

  Causal graph: [Z -> X; Z -> Y] [ⓘ]
    3 variables: Z, X, Y

  Premises (may be empty)
    [⌫] [Pr(Z) = 1/2     ] [⏎] [ⓘ]  rendered formula
    [⌫] [Pr(X | Z) = 3/4 ] [⏎] [ⓘ]  rendered formula
    ...remaining premises...

  Conclusion (exactly one; logical combinations allowed)
    [Pr(Y | do(X)) = 3/4 ] [ⓘ]       rendered formula
    Required undefined terms can prevent the conclusion holding.

  [Save to File] [Copy to Clipboard]  (whole problem)

ACTION / RESULT PANEL
  [Check entailment]   [ ] Regular [ⓘ]
                      Positive observational rows;
                      interventions can still force zeros.
                      [ ] Time limit: [30] seconds [ⓘ]
                      Off: no overall time limit.
                      Deadline ends acceptance; cleanup can take longer.
  [Cancel]  readiness / concise linked validation
  DOES NOT ENTAIL — a countermodel was found.  (announced)

  Submitted conclusion: Pr(Y | do(X)) = 3/4
  Witness term value:   Pr(Y | do(X)) = 1/2

  [visible ⊤/⊥ regime table] [rendered input probabilities]
  [Shared mechanisms and other real variables ▸]
  [Save solver input]
```

In entailment mode, empty premises should show “No premises: checks validity.” In SAT mode, label the rows “Constraints,” hide the conclusion and preserve its draft. The graph remains required. Compact graph entry must retain supported newline and semicolon declarations.

Keep task, assumptions, exactly-one conclusion, required undefined-term qualification, regularity/structural-zero distinction and deadline meaning visible. Collapse extended syntax, solver internals and full explanatory paragraphs. Preserve distinct SAT, UNSAT, ENTAILS, DOES NOT ENTAIL, INCONSISTENT PREMISES and UNRESOLVED outputs, including the vacuity explanation and cancellation/settling feedback.

Show at least the observational distribution without expansion. Small examples can compare regime columns directly; many-regime results need contained scrolling or a clearly labelled selector. Preserve exact values and undefined markers. Keep the failed conclusion beside its relevant values without implying an unimplemented evaluator for arbitrary compound constraints.

Likely reuse boundaries are:

- `decision.html`: font loading matching the other entry pages.
- `style.css`: existing header, editor, toolbar, action and table conventions, adapted to buttons.
- `block_playground.ts` / `display_logic.ts`: row and batch adapters, preserving empty-premise validity and explicit pending-edit state.
- `prsat_to_html.ts`: MathML construction patterns, extended through a causal-aware renderer.
- `causal_decision_ui.ts`: retain task dispatch, complete-problem persistence, revisions, cancellation and guarded result updates.
- `causal_decision_style.css`: compact graph/task layout and mobile containment.

Separate editor/renderer/result modules are reasonable implementation boundaries, not mandatory filenames. PrSAT’s private table function and native-model lifecycle should not be copied wholesale.

Evaluate-model stays outside the first pass: arbitrary new causal queries, interventions and undefined cases need separately reviewed capability/lifecycle work. Decimals, table-image export, graph drawing and Run shortcuts are optional later additions.

UI acceptance checks should cover:

1. Matched desktop/mobile comparisons with batch closed and open; actual rendered fonts, familiar panels, controls and formula previews.
2. Default desktop action visible without scrolling; action immediately after editor at both widths. Measure mobile placement rather than assuming it fits.
3. Row insert/delete/navigation, explicit accessible names and predictable focus. Clear premises preserves the rest of the problem.
4. Distinct intervention/observation rendering, numeric and simultaneous interventions, exact arithmetic and compound conclusions. Preview validity must not imply numerical definedness.
5. Blank/comment batch handling, Parse/Discard, exactly-one conclusion and prevention of stale debounced submissions.
6. Empty-premise validity, preserved SAT conclusion draft and distinct inconsistent-premise output, using existing examples as UI flows.
7. Inline errors identifying actual fields/rows, linked descriptions and announced summaries; include the verified line-4 and conclusion cases.
8. Edit/cancel/late-completion races: no stale result/export; honest UNRESOLVED, cancellation and settling messages.
9. Complete version-1 Save/Load/Copy round-trips, including empty premises, preserved conclusion and options. Copy produces loader-compatible JSON; malformed loads preserve current input.
10. Mobile containment for batch, long formulas, all result states and wide tables; keyboard access to contained scrolling.
11. Retained undefined-countermodel wording, visible failed conclusion, exact values and clear model/countermodel labels.
12. Zero page errors and retained labelled controls/live status.

I inspected all ten supplied PNGs and capture JSON, the context and source snapshot, the specified UI/rendering sources and HTML font-loading entries. Every snapshot hash matches. Fresh isolated headless Chromium probes reproduced the coordinates, fonts, validation errors, empty-premise availability and retained disabled SAT conclusion. I also checked Chromium’s accessibility tree.

I did not repeat Claude’s help-hiding experiment or live keyboard/stale-model probes. Safari, iOS, Firefox and an actual screen reader remain untested. No redesign was implemented or measured.

The full [Markdown review](/var/folders/h1/jv_lt9bj42dgghwf8b3khjpw0000gn/T/dosat-ui-codex-review-feltgr68/CODEX_UI_REVIEW_round1.md) and probes are preserved outside checkout. No application, repository or server changes were made; no files were deleted or visible windows opened; port 5317 was untouched.

The central review is settled. The specific corrections above still require Claude’s acceptance before I endorse the complete design.

VERDICT: DISAGREE

## Claude  (verdict: AGREE, 2m 13s)
CHECKPOINT
elapsed: ~55 min
tentative_verdict: The interface is NOT ALIGNED with PrSAT; I accept every correction Codex made, so the design is settled. This is separate from the closed mathematical Phase 3 PASS.
new_results: NEW: (1) Controlled measurement: PrSAT loaded with DoSAT's same four premises as rows puts Find Model at y=547 / 701. DoSAT's 1423 / 1965 is therefore 876 / 1264 px later for the same input. (2) Chromium's accessibility tree confirms Codex: PrSAT's row inputs are named "Enter constraint" from the placeholder, and the row buttons are named only "⌫", "⏎" and "ⓘ". (3) PrSAT already greys out Find Model the moment a key is pressed and keeps it off while the edit is pending (tested); the redesign should keep that.
current_obstruction: none
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

I accept all of Codex's corrections. The merged review is at `/tmp/dosat-ui-review-bsKGwb/CONSENSUS_UI_REVIEW_round2.md`. My probe scripts, logs and screenshots are in the same folder, outside the checkout, including the new `probe4.cjs` and `prsat-{1280,390}-4rows.png`.

## Codex's corrections

1. **Time-limit control.** Accepted: "☐ Time limit: [30] seconds". The line "Off: no overall time limit. A deadline ends result acceptance; cancellation and cleanup can take longer." stays visible next to the run button.
2. **Countermodel sketch.** Accepted; my sketch was wrong. A conclusion of `= 1/2` is the entailed example. The countermodel example must use the incorrect claim `Pr(Y | do(X)) = 3/4`, whose witness value is `1/2`. I also endorse showing the submitted conclusion next to its witness term values. This uses existing witness data and does not imply a general evaluator.
3. **Accessibility claim.** Accepted and checked. My earlier probe only looked at `aria-label` and `<label>` elements. The precise weakness in PrSAT is:
   - generic, non-row-specific names for the inputs;
   - symbol-only button names;
   - errors that are not linked to fields and not announced.
4. **Batch and Clear behavior.** Accepted:
   - The button is labelled "Clear premises" and keeps the graph, conclusion and options.
   - Parse replaces only the premises.
   - Batch text that has been edited but not parsed is marked as not applied; results are cleared and Run stays disabled until Parse or Discard.
   - Hiding the batch box neither applies nor silently discards it.
   - Load From File applies the whole saved problem directly, unlike PrSAT, which loads a file into the batch box.
5. **What can be reused.** Accepted. This matches what I wrote: `split_input` and `generic_input_block` are exported, the row and batch containers are private, and `generic_input_block` hard-wires plain-text save/load.
6. **How far down the run button is.** Accepted. "3–5 screens down" was wrong. It is in the second viewport on desktop and the third on mobile.
7. **Uncontrolled comparison.** Accepted. I resolved it with the controlled measurement above.

## My additions (Codex should confirm; they extend its answer rather than dispute it)

- **Reachability target.** The run button sits directly after the editor and is visible without scrolling at 1280×900. Its top is at most about 250 px below PrSAT's same-four-premise position, which works out to roughly ≤800 on desktop and ≤950 on mobile. This is a target to measure, not an assumption.
- **Other real variables** (user-named symbols) stay visible when present. The shared causal mechanisms can be collapsed by default, as in Codex's sketch.

## Agreed review

- **Verdict:** NOT ALIGNED, as a UI verdict only.
- **Confirmed by both of us:**
  - the run-button positions;
  - the rendered fonts and the missing font link in `decision.html`;
  - unstyled `<button>` elements;
  - error line numbers that point to the wrong place;
  - DoSAT's better mobile containment.
- **Comparison table:** P1 is visual identity, run-button placement, per-row entry with rendered formulas, the task distinction and inline validation. P2 is the toolbar, graph entry, compact options and the results table.
- **Layout:** Codex's sketch with the corrected countermodel.
- **Keep visible:** the task choice; "may be empty" premises with Run still enabled for validity; exactly one conclusion; the undefined-term note; graph and causal assumptions; the regularity and structural-zero note; what the deadline means; and all of DoSAT's distinct outcome messages, including the settling feedback.
- **First pass versus later:** Evaluate model is new capability and needs separately scoped evaluation and lifecycle work. Decimals, table-image export, graph drawing and a run shortcut are optional later additions.
- **Acceptance checks:** the 12 merged checks in the file. They cover:
  - visual comparison, with fonts verified as actually rendered rather than via `document.fonts.check`;
  - reachability;
  - familiar controls with row-specific accessible names;
  - rendering, where a valid preview does not imply the value is defined;
  - batch handling and stale pending text;
  - task distinction and validity with empty premises;
  - accessible validation, with the line-4 and bad-conclusion regressions;
  - stale results and cancellation races;
  - complete Save/Load/Copy of the whole problem;
  - mobile containment;
  - undefined-value display;
  - zero page errors.
- **Not covered by either of us:** Safari, iOS, Firefox and real screen readers; no redesign was built or measured.

No application, repository or server state was changed, and port 5317 was not touched.

VERDICT: AGREE

## Codex  (verdict: AGREE, 1m 09s)
CHECKPOINT
elapsed: ~23 min cumulative Codex work
tentative_verdict: AGREE; UI alignment verdict: Not aligned.
new_results: NEW: Read the merged Markdown, probe4 script/log and both new four-premise screenshots. They support the reported PrSAT action positions and immediate pending-edit disable behavior. Claude has accepted all material corrections.
current_obstruction: none
next_bounded_step: done
token_cost: unavailable
END CHECKPOINT

I endorse the [merged UI review](/tmp/dosat-ui-review-bsKGwb/CONSENSUS_UI_REVIEW_round2.md). No material disagreement remains.

The additional comparison supports PrSAT action positions of **547.3px desktop / 700.8px mobile** with the same four premise strings and batch closed. DoSAT’s action is approximately **876 / 1264px farther down**. DoSAT also requires graph and conclusion inputs, so this comparison measures the overall interface difference rather than isolating wasted spacing.

I accept both additions:

- The **approximately 800px desktop / 950px mobile** action-position targets are reasonable acceptance goals to measure during implementation. They are not demonstrated redesign results.
- **User-named real-variable assignments remain visible when present**, while shared mechanism details may collapse.

The settled first pass restores PrSAT’s header, editor rows, mathematical previews, toolbar, action panel and visible probability-table structure. It preserves DoSAT’s graph, task distinction, empty-premise validity, complete saved problems, precise outcomes, undefined-value qualifications, cancellation feedback and mobile containment. Pending edits block stale submissions; Evaluate-model remains a separately scoped capability.

**UI alignment: Not aligned.** The mathematical Phase 3 PASS is unchanged. This agreement approves the review and proposed direction, not an unimplemented redesign. No application, repository or server changes were made.

VERDICT: AGREE

