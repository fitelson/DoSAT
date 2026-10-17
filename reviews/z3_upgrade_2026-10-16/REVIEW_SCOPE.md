# Completed Z3 5.3.1 upgrade: pre-publication gate

Baseline DoSAT fa5b406310d7cae1cdb56ca00d7ea09265231446. Source /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus. Evidence /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/upgrades/z3-5.3.1-2026-10-17T01-24-54Z.

User authorized update, commit, push, upload all maintained PrSAT variants. HO explicitly stays local; experimental3.1 remains permanent local. Current gate ONLY DoSAT Z3 upgrade/integration.

Changes: exact z3-solver5.3.1 package/lock pin (only root and Z3 lock entries changed); public/dist JS+WASM byte-identical to official npm5.3.1; tests/causal_decision.spec.ts readiness assertion5.1.0->5.3.1; rebuilt dist index/applicationbundle via TypeScript/Vite retaining old bundles. No parser/compiler/solver/model-evaluator, tactics, semantics, limits, UI, or graph changes. Mocked5.1.0 UI unit case intentionally unchanged to test forwarding arbitrary runtimeversion.

Official release https://github.com/Z3Prover/z3/releases/tag/z3-5.3.1 dated2026-10-15. npm AND actualengine5.3.1, full5.3.1.0 ac9156f97cb44e56472e1c841f7a2beb1e976b24 z3-5.3.1. JSsha2569838f5428af10edaa56cf28fe490c502eab7e54050821effa9a31eb022b6ec6b; WASMsha256dadc8051d994f42664f4400ff9d1bd87fb11d2150fac9de49597f20cd84a6fcc.

Passed: TypeScript/Vite build, configuredESLint, fullDoSATunits,69Chromiumtests (causal_decision+literature examples). Built package tested with onlymanifestfiles over ephemeral isolatedloopback: actualloadedfullengine5.3.1.0, crossOriginIsolatedtrue, causalSAT, exactreturnedmodel Pr(Y|do(~X))=0, interventionalentailment, nopageerrors. Allninefamilybuilds and actualengine/SAT/UNSAT/exactmodelpackage probespass; sixmaintainedappunit suitespass. HOlongboundedresearchunitsongoing; notpartofDoSATgate. Sharedfamilycontractsbeingchecked.

Pendingaftergate: commit/push, backup-preservingnondeleting uploadto https://fitelson.org/DoSAT/; assets/runtimebeforeindex, remote+HTTPSbytehashes, isolation/MIME/legacyredirectchecks, actualHTTPSengine/solve/evaluation. Singlepublicindex maintained. NoexternalpublishHO/experimental. Preserve dirtywork and oldbundles.

Fullunitlog:
```

 RUN  v5.0.3 /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/do-calculus


 Test Files  31 passed (31)
      Tests  1374 passed | 1 skipped | 1 todo (1376)
   Start at  21:33:55
   Duration  28.42s (tests 90%, import 9%, transform 1%)

    Isolate  31 workers spawned · ~108ms startup each (spawn + environment, per file)
             at least ~3.23s faster with isolate: false — reuses workers across files instead of one per file


```

Chromiumfinaloutput:
```
tests/causal_decision.spec.ts:571:1 › malformed evaluation parentheses cannot be repaired by the adapter (543ms)
  ✓  53 [chromium] › tests/causal_decision.spec.ts:584:1 › oversized node indices are support errors with no DAG drawing (311ms)
  ✓  54 [chromium] › tests/causal_decision.spec.ts:594:3 › exact positive decimal underflow yields a countermodel (regular=false) (587ms)
  ✓  55 [chromium] › tests/causal_decision.spec.ts:594:3 › exact positive decimal underflow yields a countermodel (regular=true) (654ms)
  ✓  56 [chromium] › tests/causal_decision.spec.ts:610:39 › admissions conclusion and entire DAG remain visible at 320px (1.5s)
  ✓  57 [chromium] › tests/causal_decision.spec.ts:610:39 › admissions conclusion and entire DAG remain visible at 390px (1.5s)
  ✓  58 [chromium] › tests/causal_decision.spec.ts:610:39 › admissions conclusion and entire DAG remain visible at 1280px (1.5s)
[WebServer] 9:41:26 PM [vite] (client) [Unhandled error] Error: ResizeObserver loop completed with undelivered notifications.
[WebServer]  > ../../../../../../../../../@vite/client:363:50
[WebServer] 
[WebServer] 9:41:26 PM [vite] (client) [Unhandled error] Error: ResizeObserver loop completed with undelivered notifications.
[WebServer]  > ../../../../../../../../../@vite/client:363:50
[WebServer] 
[WebServer] 9:41:26 PM [vite] (client) [Unhandled error] Error: ResizeObserver loop completed with undelivered notifications.
[WebServer]  > ../../../../../../../../../@vite/client:363:50
[WebServer] 
  ✓  59 [chromium] › tests/causal_decision.spec.ts:639:1 › graph input grows for wrapped text, explicit lines, and window resizing (557ms)
  ✓  60 [chromium] › tests/causal_literature_examples.spec.ts:7:3 › literature preset: Berkson’s paradox: selection creates an association (728ms)
  ✓  61 [chromium] › tests/causal_literature_examples.spec.ts:7:3 › literature preset: M-bias: a harmful pretreatment adjustment (1.0s)
  ✓  62 [chromium] › tests/causal_literature_examples.spec.ts:7:3 › literature preset: Bias amplification: controlling an instrument (889ms)
  ✓  63 [chromium] › tests/causal_literature_examples.spec.ts:7:3 › literature preset: Treatment–confounder feedback (990ms)
  ✓  64 [chromium] › tests/causal_literature_examples.spec.ts:7:3 › literature preset: Front-door adjustment (855ms)
  ✓  65 [chromium] › tests/causal_literature_examples.spec.ts:7:3 › literature preset: Positivity failure: an unseen treatment branch (567ms)
  ✓  66 [chromium] › tests/causal_literature_examples.spec.ts:7:3 › literature preset: Simpson’s paradox: admissions and aptitude (2.0s)
  ✓  67 [chromium] › tests/causal_literature_examples.spec.ts:51:3 › literature guidance and DAGs stay contained at 320px (803ms)
  ✓  68 [chromium] › tests/causal_literature_examples.spec.ts:51:3 › literature guidance and DAGs stay contained at 390px (3.0s)
  ✓  69 [chromium] › tests/causal_literature_examples.spec.ts:51:3 › literature guidance and DAGs stay contained at 1280px (801ms)

  69 passed (54.3s)

```

Other evidence: built-browser-probes.json, probe-packages.mjs, manifests-final.json under /Users/fitelson/Library/CloudStorage/Dropbox/non-MUSIC/todo/PrSAT/upgrades/z3-5.3.1-2026-10-17T01-24-54Z.
