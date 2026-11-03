# Z3 5.3.3 publication verified

Published November 3, 2026, following the scoped consensus PASS. Runtime source
commit: d86ac2d, pushed to fitelson/DoSAT main. Existing target:
https://fitelson.org/DoSAT/.

The eight manifest-listed files were installed with protected backups and
atomic per-file replacement, with assets before the index. Prior hashed
bundles and the original public routes were retained. The administrative
release-manifest.json and private review stream journals were not uploaded.

Verification passed:

- All eight remote file hashes match the prepared package; all six directly
  served public files also match over HTTPS.
- HTTP 200, required COOP/COEP isolation, application/wasm MIME type, and 403
  protection for .release-backups are correct.
- All five legacy dist entry URLs redirect to the canonical DoSAT root.
- The actual live native engine is
  5.3.3.0 430d19e697e2ec9bad79ff210d41b4a7a5fcfa3e z3-5.3.3.
- Live causal SAT, exact frozen-model evaluation and interventional entailment
  pass with no page errors.
- For X -> Y, premises Pr(X)=1/3, Pr(Y|do(X))=2/3 and
  Pr(Y|do(~X))=1/4 yield exact Pr(Y)=7/18; the live app proves that consequence
  and returns UNSAT when Pr(Y)>7/18 is added.

See live-values.json for the stronger live probe. Complete manifests,
remote/HTTPS hashes, headers and raw test logs are retained in the shared hub:
PrSAT/upgrades/z3-5.3.3-2026-11-03/. Other public applications were published
to their own targets. Experimental PrSAT and HO remain local installations.
