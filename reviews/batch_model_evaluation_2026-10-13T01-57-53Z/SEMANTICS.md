# Batch checks in one returned model

This phase adds rows and batch editing to DoSAT's existing fixed-model evaluator.
It changes no parser, compiler, solver, exact arithmetic or model-snapshot code.
The decision editor's default premise mode is preserved; evaluation mode has
separate test IDs, row-container classes, labels, previews and help.

Applied rows and an unapplied batch draft remain separate. Parse replaces only
model checks; blank lines and comments are accepted. Pending drafts disable
Evaluate even when batch input is hidden. Discard restores applied checks; Clear
checks preserves the original problem, model, verdict and export. Syntax errors
are row-specific and block the batch. The existing 64-active-line/50000-character
budgets apply to the batch; per-expression parser budgets remain authoritative.

Evaluate freezes the applied sources and evaluator callback, then calls that
callback serially with one AbortSignal. Every call uses the same captured model.
Individual returned errors/undefined values are rendered in their own result,
with later valid checks still evaluated. Boolean truth is the existing guarded
constraint truth, not an entailment claim; required undefined terms can produce
False and are listed. An undefined real expression is not converted to False.

Results are accepted as one complete batch. Cancel, row edits, draft edits,
Parse/Discard/Clear, model replacement and original-problem edits abort and
suppress older results. No next row starts after cancellation. Busy ownership
continues until the current native callback settles; a new decision/evaluation
cannot overlap. Toggling visibility alone leaves applied checks and results intact.
There is no new satisfiability search or kernel completion during evaluation.

The user requested batch/multiple checks, not a change to model semantics.
Inherited solver memory behavior and old proof audits are outside this phase.
