# DoSAT 1.0

A Decision Procedure for Do Calculus.

The single public app is [DoSAT 1.0](https://fitelson.org/DoSAT/), with one production entry, index.html. Read [PROJECT.md](PROJECT.md) and [FORK_PROVENANCE.json](FORK_PROVENANCE.json) for scope and provenance. The earlier model-finder, rule-checker and classical entry pages are preserved under reference-ui/ for development and regression tests; they are not published as separate apps. Old public URLs redirect to the single page.

## Phase 3 decision procedure

The main page provides causal satisfiability and entailment using exact polynomial
real arithmetic. Each stage tries Z3's QF_NRA strategy with a finite 60-second
budget, then falls back to explicit NLSat if needed. Default decision mode has no
overall time limit; cancellation or resource failure remains unresolved. Entailment includes
countermodels with required undefined conclusion terms and distinguishes
inconsistent premises. See DECISION_SEMANTICS.md. The required
[scoped consensus recheck](reviews/phase3_final_recheck_consensus.md) gives
**Phase gate: PASS**. Final checks: 1,041 unit tests and 72 Chromium tests pass;
native Z3 matches all 607 semantic audit cases. Requested deadlines govern
accepted verdicts; native interruption and cleanup can finish later.

Boolean interventions use `do(X)` and `do(~X)` to set X true or false.
Simultaneous interventions use `do(X, ~Y)`. Numeric forms such as `do(X=1)`
remain supported. `Pr(Y | do(X), Z)` conditions on Z in the intervened model.

Two built-in examples test Simpson's paradox and the back-door adjustment law.
For `Z -> X; Z -> Y; X -> Y`, let X mean treatment, Y recovery and Z severity.
The illustrative Simpson example gives observed recovery of 63% with treatment
versus 77% without treatment. Intervention gives 75% versus 65%. DoSAT checks
that the premises entail this reversal. These are constructed values, not a
claim about an empirical treatment study. The second example tests the general
adjustment identity with positive support and no numerical premises:

```text
Pr(Y | do(X)) = Pr(Y | X & Z)*Pr(Z) + Pr(Y | X & ~Z)*Pr(~Z)
```

See [Pearl's discussion](https://www.cs.ucla.edu/~kaoru/r385.pdf) for how the
causal graph resolves Simpson's paradox. Saved solver input uses explicit
`check-sat-using qfnra-nlsat` as a complete reference route; the application
also tries its finite QF_NRA optimization first.

Public repository: [fitelson/DoSAT](https://github.com/fitelson/DoSAT).
Live website: [DoSAT 1.0](https://fitelson.org/DoSAT/). The
[publication record](reviews/PHASE3_PUBLICATION.md) confirms uploaded checksums,
actual Z3 5.1.0 and successful live examples/cancellation.

For local development, clone `https://github.com/fitelson/DoSAT.git`, use
Node 26.11.1 and npm 12.2.0, then run
`npx --yes npm@12.2.0 ci` and `npm run dev`. Open `/` on the
strict development port 5173. See [TOOLS.md](TOOLS.md) for the TypeScript 7
compiler and separate compatible typed-lint toolchain.

Some hard queries become much slower when one Z3 context is reused. Controlled
review probes solved the six-node example in about 29 seconds with a fresh
context, while repeated use reached the finite cap and remained unresolved in
NLSat for several minutes. These are instance-specific observations. Save the
problem and reload the page to obtain a fresh context when useful; this does
not guarantee a particular runtime. See the review for details.

## PrSAT-style decision interface

The main editor has one premise per row with causal MathML previews, a single conclusion, and an explicit entailment/satisfiability choice. Enter splits a row, Up/Down moves between rows, and Backspace at the start merges with the previous row. Show Batch Input enables bulk editing; Parse applies those edits to premises only, while Discard restores the applied rows. Unapplied batch edits block Run and saving and invalidate previous results. Clear premises preserves the graph, conclusion and options.

Save to File, Load From File and Copy to Clipboard use the same version 1 whole-problem JSON, including empty premises and a retained inactive conclusion draft. SAT mode hides and ignores that draft. Empty-premise entailment tests validity. Graph, physical premise rows and conclusion errors are linked and announced near Run.

An exact model or countermodel shows a visible observational/intervention probability table with ⊤/⊥ assignments, rendered input terms and exact values. Countermodels display the submitted conclusion beside witness term values; undefined terms are marked explicitly. User-named real variables remain visible, with shared mechanisms in expandable details. A preview confirms parsing, not numerical definedness. Long formulas scroll in their own named keyboard regions. Loaded line endings are normalized before validation. The separate [UI consensus gate](reviews/ui_implementation_2026-10-11T22-41-54Z/UI_FINAL_STATUS.md) is PASS; latest checks are 1,123 passing unit tests and 81 passing Chromium tests.

## DAG preview and fixed-model evaluation

The supplied graph renders when it is accepted as a DAG; cyclic/malformed input clears the preview and reports "Syntax error: not a DAG" with the reason. Support limits are reported separately. The preview does not depend on probability-input validity.

After SAT or a countermodel, Evaluate model accepts a new probability, arithmetic expression or Boolean constraint, including new do regimes. It uses the returned model's complete shared kernel and assigned real variables with exact rational/algebraic arithmetic. It does not establish entailment or choose a new model. Unknown user variables give an error; undefined real expressions are marked explicitly. Constraint truth follows DoSAT's existing definedness guards, with undefined probability terms listed. Original-problem edits clear the model and evaluator; evaluation cancellation waits for native settlement. See [evaluation semantics](reviews/single_page_model_eval_2026-10-12T01-02-21Z/EVALUATION_SEMANTICS.md). Retired model-finder v1 saved files import as corresponding SAT problems; modern DoSAT JSON remains unchanged.

## Inherited PrSAT 3.0 README

## Contributors

- [Koissi Adjorlolo](https://github.com/imapersonman)
- [Claude](https://claude.ai/code) (AI pair programmer)
- [Codex](https://openai.com/codex/) (AI pair programmer)
- [Branden Fitelson](https://github.com/fitelson)

## Installation

### Requirements

- (Optional) [Visual Studio Code (VSCode)](https://code.visualstudio.com)
  - Any plain-text editor and terminal will do.
- [Node + NVM](https://nodejs.org/en/download)

### Steps
1. Open your terminal of choice (could be in VSCode).
2. Navigate to desired directory.
3. Run `git clone https://github.com/fitelson/PrSAT.git`.
4. Run `cd PrSAT`.
5. Run `npm install`.

## Running the development server

```
npm run dev
```

A link to PrSAT running locally will appear in your terminal.

## Phase 1 review

The [scoped consensus recheck](reviews/phase1_recheck_consensus.md) passed after
query-token and timeout fixes. Latest checks:748 active unit tests pass;32 browser
tests pass on the identical runtime;lint,TypeScript and build pass. Read PROJECT.md
for scope and qualifications. Later phases require the same consensus review gate.

## Phase 2 complete

The [do-calculus step checker](do_calculus.html) checks Pearl Rules1–3 with graph
surgery, d-separation certificates, and explicit definedness qualifications.
Run npm run dev and open /do_calculus.html. It can save steps and export an
inequality problem for the causal model finder. See DO_CALCULUS_SEMANTICS.md.
The [default-model consensus recheck](reviews/phase2_recheck_consensus.md) passed
after a mobile layout repair. Latest full checks: 862 unit tests and 49 browser
tests pass; lint, TypeScript and build pass. See PROJECT.md for scope and limits.
