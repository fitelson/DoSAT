# Codex independent scoped review

Phase gate: FAIL. Agreement with Claude's two required repairs, B1 and B2.
The prior compiler/parser and decision reduction/solver mathematical gates remain
closed. This review made no source, test, package, deployment or cleanup changes.

## Independently reproduced blockers

**B1, expression wrapper repairs malformed input.** At
`src/causal_evaluation_syntax.ts:22`, the artificial equality turns
`Pr(Y)) + (Pr(X)`, `a) * (b` and `1) / (0` into accepted real expressions.
In the actual Apache package, example 1's countermodel accepts the first trigger:
`aria-invalid=false`, Evaluate enabled, preview `Pr(Y)+Pr(X)`, exact result 1.
The preview and evaluation agree for this trigger, but the original input is
not a well-formed expression. Constraint-injection attempts tested in this round
were rejected; this finding is an input-validation failure, not a demonstrated
solver injection or wrong value for the displayed AST.

Bounded repair: before the fallback wrapper, require balanced parentheses and
a running depth that never becomes negative. Final depth alone is insufficient:
the reported examples have balanced counts but misplaced delimiters. Add syntax
rejections for all three triggers and UI assertions for an empty preview,
`aria-invalid=true` and disabled Evaluate. Preserve valid constraints, real
expressions, comments, exact literals and new interventions.

**B2, support limit falsely called not a DAG.** At
`src/causal_decision_ui.ts:86`, only `At most` and `limited to` distinguish
unsupported input. The package displays `F9007199254740992 -> Y` as
`Graph: Syntax error: not a DAG. Graph line 1: The index in causal variable
"F9007199254740992" is too large.` Its index exceeds the implementation's
safe-integer support; that does not make this directed graph cyclic. Run remains
blocked, so this is diagnostic accuracy, not acceptance of an invalid model.

Bounded repair: classify this exact support failure as unsupported input, without
changing the closed graph parser. Add a UI test requiring Unsupported, excluding
not a DAG, clearing the preview and disabling Run. Retain cycle/self-edge and
malformed-input diagnostics. A typed error classification is optional later
hardening; a scoped classification fix is sufficient for this gate.

## Independent verification

- All 27 frozen source SHA256 hashes match, before and after checks. Git diff
  against 109ec5b shows no changes in the four closed compiler/parser/reduction/
  solver modules.
- Six directly relevant unit files: 258 tests pass. Full unit suite: 1309 pass,
  one skip, one todo. TypeScript and lint pass.
- Twelve selected headless Chromium regressions pass, covering the single entry,
  graph recovery, dense six-node preview and keyboard scrolling at three widths,
  new interventions, guarded undefinedness, exact algebraic/free values,
  unknown-variable rejection, countermodels, evaluator containment and legacy
  import. Browser artifacts were directed to a fresh /tmp output directory.
- Additional browser-native probes use a two-parent kernel with reversed witness
  rows and reversed parent-object order. With X=0, Z=1/3 and Y CPT entries
  1/10, 2/10, 7/10, 9/10, independent factorization gives observational 2/15,
  do(X) 23/30, do(X,~Z) 7/10, and do(X) conditioned on Z 9/10. All four exact
  evaluator outputs agree, including observationally absent X=true rows.
- A mixed algebraic kernel has X=1/sqrt(2), Y(false-parent)=1/3 and
  Y(true-parent)=1/sqrt(3). The evaluator returns
  (Pr(X)/Pr(Y|do(X)))^2=3/2 and the exact marginal root of
  81t^4-108t^3+18t^2+12t-2; substitution into that polynomial returns exact zero.
- Source and actual installed binding inspection confirm the bounded numeric
  grammar, no new free-variable completion, instance-branded defensive snapshots,
  structural CPT keys, strict real definedness versus compiled Boolean guards,
  parser-Solver release in finally without check/model, independent extracted AST
  references, managed AST/vector/context finalizers and one lazy service context.
  Evaluator busy/generation/abort checks and main Run gating hold ownership until
  native settlement, suppress stale results and preserve the original witness.
- All eight local release-file hashes match the manifest; the package has only
  index.html. All six HTTP-accessible package files match their hashes under real
  Apache. Root/index return 200; COOP/COEP, WASM MIME, stable-file/HTML no-cache,
  and root worker Service-Worker-Allowed are correct. All five listed retired
  routes plus three root-level variants return 301 to the real canonical target.
  Redirects were inspected without following them.

## Nonblocking qualifications

Native evaluation cancellation is cooperative and has no promised wall-clock
bound. Slow algebraic simplification may keep Run disabled until settlement;
the observed long-running expression does not establish that it can never settle.
Raw exact formatting of long rational s-expressions, cache-rule naming, retained
old build artifacts outside the prepared package and Enter-to-evaluate are later
polish. No additional material current finding was identified.

The implementation cannot advance on agreement about this repair list. B1 and
B2 require repairs, affected verification, refreshed frozen/package evidence and
an explicit scoped consensus recheck PASS.

VERDICT: AGREE
