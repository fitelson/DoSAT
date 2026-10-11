# Phase 3 N2 regression

The permanent test advances past the local fast deadline during exact witness extraction and throws a distinctive error. It requires ERROR at the witness stage, only the fast session, no fallback, released handles, cleared timers, and successful reuse after the error.

Verification: TypeScript and scoped lint status 0; 63 solver tests passed. Runtime solver SHA256 remains 9e2f6760a6e360d6b59da2d08c848d13d821f22efaa6dd7788de01f8c918d396. Only the test file changed.

The S2 mutation removes `checking &&` through a Vite transform in a retained directory outside the checkout. No runtime source file was edited or replaced. The new test rejects the mutant: it returns UNSAT instead of the required witness ERROR. Mutation process status 1 is the expected result. Configuration and original log are retained in /tmp/dosat-n2-s2-mutation-20261011-1656/. The decisive output is reproduced below for Dropbox readers.

```text

 RUN  v5.0.3 /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus

 ❯ src/causal_decision_solver.spec.ts (63 tests | 1 failed | 62 skipped) 9ms
   ❯ causal decision orchestration and ownership (52)
     × a witness error after the local fast deadline remains ERROR without fallback and permits reuse 8ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/causal_decision_solver.spec.ts > causal decision orchestration and ownership > a witness error after the local fast deadline remains ERROR without fallback and permits reuse
AssertionError: expected { status: 'unsat' } to deeply equal { status: 'error', …(2) }

- Expected
+ Received

  {
-   "message": "Exact witness extraction failed after the local search deadline.",
-   "stage": "witness",
-   "status": "error",
+   "status": "unsat",
  }

 ❯ src/causal_decision_solver.spec.ts:498:68
    496|     const create = vi.fn((engine: DecisionEngine) => engine === 'compl…
    497|     const solver = new CausalDecisionSolver({} as Z3HighLevel, create)
    498|     expect(await solver.decide(problem(), { fast_timeout_ms: 1 })).toE…
       |                                                                    ^
    499|       status: 'error', stage: 'witness', message: 'Exact witness extra…
    500|     })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 62 skipped (63)
   Start at  16:56:12
   Duration  200ms (transform 67%, import 23%, tests 9%, worker 1%)


```
