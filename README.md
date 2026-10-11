# PrSAT do-calculus extension

Research workspace starting from the current PrSAT 3.0 code. Read
[PROJECT.md](PROJECT.md) for scope and [FORK_PROVENANCE.json](FORK_PROVENANCE.json)
for source provenance. The first causal model finder is available at `/causal.html`: Boolean acyclic
graphs, shared mechanisms, hard interventions, and regime-specific conditioning.
The single-step do-calculus checker is available at `/do_calculus.html`.
Automated derivations and latent confounding remain later phases.

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
