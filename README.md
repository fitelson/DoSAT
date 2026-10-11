# DoSAT 1.0

A Decision Procedure for Do Calculus.

Research workspace starting from the current PrSAT 3.0 code. Read
[PROJECT.md](PROJECT.md) for scope and [FORK_PROVENANCE.json](FORK_PROVENANCE.json)
for source provenance. The first causal model finder is available at `/causal.html`: Boolean acyclic
graphs, shared mechanisms, hard interventions, and regime-specific conditioning.
The single-step do-calculus checker is available at `/do_calculus.html`.
Automated derivations and latent confounding remain later phases.

## Phase 3 decision procedure

`/decision.html` adds causal satisfiability and entailment using exact polynomial
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
`npx --yes npm@12.2.0 ci` and `npm run dev`. Open `/decision.html` on the
strict development port 5173. See [TOOLS.md](TOOLS.md) for the TypeScript 7
compiler and separate compatible typed-lint toolchain.

Some hard queries become much slower when one Z3 context is reused. Controlled
review probes solved the six-node example in about 29 seconds with a fresh
context, while repeated use reached the finite cap and remained unresolved in
NLSat for several minutes. These are instance-specific observations. Save the
problem and reload the page to obtain a fresh context when useful; this does
not guarantee a particular runtime. See the review for details.

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
