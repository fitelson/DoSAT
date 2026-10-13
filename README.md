# DoSAT 1.0

A Decision Procedure for Do Calculus.

The single public app is [DoSAT 1.0](https://fitelson.org/DoSAT/), with one production entry, index.html. Read [PROJECT.md](PROJECT.md) and [FORK_PROVENANCE.json](FORK_PROVENANCE.json) for scope and provenance. The earlier model-finder, rule-checker and classical entry pages are preserved under reference-ui/ for development and regression tests; they are not published as separate apps. Old public URLs redirect to the single page.

## Current decision procedure

The main page checks causal satisfiability and entailment using exact polynomial
real arithmetic over up to eight Boolean graph variables. Entailment directly
searches for premises together with failure of the guarded conclusion; no
separate premise-consistency search runs. Inconsistent premises entail vacuously,
and undefined required conclusion terms can supply countermodels. SAT checks the
active constraints directly. See [DECISION_SEMANTICS.md](DECISION_SEMANTICS.md).

Each query first tries Z3's QF_NRA strategy with a finite 60-second budget and
falls back to explicit NLSat if needed. The default has no overall time limit.
Cancellation, timeout or resource failure remains unresolved. Both engines
receive the same optimized polynomial input: ordinary arithmetic is inline,
constants stay exact, irrelevant graph factors are removed, and cancellation
and bounded fraction normalization retain the original definedness guards.
Returned SAT models and countermodels are validated against the original
constraints before their exact witnesses are displayed.

Boolean interventions use `do(X)` and `do(~X)` to set X true or false.
Simultaneous interventions use `do(X, ~Y)`. Numeric forms such as `do(X=1)`
remain supported. `Pr(Y | do(X), Z)` conditions on Z in the intervened model.

The seven presets cover Berkson selection, M-bias, instrument bias amplification,
treatment–confounder feedback, front-door adjustment, positivity failure and
Simpson admissions. The admissions case adapts Pearl's Figure 4.9 with explicit
aptitude U and career objectives Z, removing direct M->A. It preserves the
supplied E/M/A table. Choosing the easy department gives admission risk 2/3,
versus 1/3 for the hard department; fixing department makes gender causally
irrelevant to admission, despite the observed female advantage within each
selected department. Numbers are constructed mechanisms, not empirical effects
inferred from the table. No latent-variable identification engine is added.

The optimized admissions entailment has 14 causal parameters and no arithmetic
auxiliaries, using 3619 bytes instead of the former 73407 bytes and 718 reals.
The current verification and scoped review are recorded in
[VERIFICATION.md](reviews/constraint_implementation_2026-10-12T23-41-52Z/VERIFICATION.md).
The recorded checks pass 1349 unit tests and 108 distinct Chromium cases, including the independent
607-case semantic oracle and 480000 exact differential comparisons with zero
mismatches. Eight-node acceptance and ninth-node rejection are tested. Existing
source and expansion budgets still apply; graph size alone does not guarantee
that every input completes within a particular runtime.
See [TESTING.md](TESTING.md) for the public-page and retained legacy browser commands.
Intermittent native Z3/WASM memory failures remain a documented reliability follow-up.

Saved solver input contains one selected query with explicit
`check-sat-using qfnra-nlsat` as a complete reference route. The application
also tries its finite QF_NRA optimization first. Earlier core/UI phase review
records below are historical and remain preserved.

Public repository: [fitelson/DoSAT](https://github.com/fitelson/DoSAT).
Live website: [DoSAT 1.0](https://fitelson.org/DoSAT/). The
[publication record](reviews/PHASE3_PUBLICATION.md) confirms uploaded checksums,
actual Z3 5.1.0 and successful live examples/cancellation.

For local development, clone `https://github.com/fitelson/DoSAT.git`, use
Node 26.11.1 and npm 12.2.0, then run
`npx --yes npm@12.2.0 ci` and `npm run dev`. Open `/` on the
strict development port 5173. See [TOOLS.md](TOOLS.md) for the TypeScript 7
compiler and separate compatible typed-lint toolchain.

Earlier reviews recorded sensitivity to Z3 context reuse before the current
compiler optimization. Current measured instance timings are in the verification
record above; they are observations, not general runtime guarantees.

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
