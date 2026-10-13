# Automatic inline evaluation and layout corrections

This phase implements the user's explicit corrections to the preceding batch
release: editing a model-check row and batch Parse must evaluate automatically,
values/True/False belong beside the input, the conclusion must not be clipped,
and the entire DAG must be visible. Native evaluator, captured model, parser,
compiler and solver semantics remain unchanged.

A window-owned180ms timer debounces edits. Each accepted batch captures source
rows, a model callback and one abort signal. Calls remain serialized. Edits
abort/suppress old work and queue the latest valid checks; queued work starts
only after pending native work settles and its debounce expires. Cancellation
clears the queue; Clear, model clearing and unapplied drafts prevent queued work.
Model replacement revalidates retained rows and evaluates them in the new model.
No old value may appear for a newer source/model. Visibility toggles preserve
results. Reevaluate is an optional retry, not a required input step.

Syntax-invalid rows show their own error and are excluded from calls while valid
rows still evaluate. Undefined reals, guarded Boolean truth and returned errors
remain distinct. All eligible results are accepted atomically for the captured
version. Primary values replace the parsed-formula slot; term/formula details
remain expandable, including undefined terms behind guarded False. Budgets stay
64active lines/50000characters plus existing per-expression/snapshot limits.

The SVG scales within its complete existing cropped viewBox, so nodes/edges do
not run off the panel. Conclusion input height follows its content and width.
Only root conjunctions are flattened for display, each full clause parenthesized
and joined visibly with &, in original order. Nested disjunction, implication or
negation remain inside their original clause. Other root operators retain the
original renderer. This is presentation only; decision parsing/export is unchanged.
