# Z3 5.3.1 publication: verified

Runtime source commit `77b1bbe1967cd392b66d4fc1c26b93b9e45e82e1` is committed
and pushed to fitelson/DoSAT main. The scoped default-model consensus is PASS.
The public app remains https://fitelson.org/DoSAT/, with one index.html entry.

All 8 remote manifest files and 6 HTTPS public files match their local hashes
and byte counts. Root HTTP 200, COOP/COEP isolation, application/wasm MIME,
protected-backup HTTP 403 and all 5 legacy HTTP 301 redirects pass. Every
overwritten server file was backed up; older hashed bundles remain.

A fresh headless Chromium page over actual HTTPS captured loaded engine
`5.3.1.0 ac9156f97cb44e56472e1c841f7a2beb1e976b24 z3-5.3.1`, confirmed
cross-origin isolation, found a causal satisfying model, evaluated
`Pr(Y | do(~X))` as exact 0 in that model and proved the interventional goal.
There were no page errors. See the three dosat-*-verification/browser JSON
records here and release-manifest.json.

Prepublication: 1374 unit cases, 69 Chromium cases, lint and TypeScript/Vite
build pass. The exact dependency, runtime and implementation remain those
reviewed in consensus.md. Raw journals are private; unrelated old artifacts
and dirty work are retained. This record adds documentation only.
