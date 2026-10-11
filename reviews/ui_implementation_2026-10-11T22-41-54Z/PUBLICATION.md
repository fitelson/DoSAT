# DoSAT PrSAT-style UI publication

October 11, 2026. **Published and verified.**

- Application: https://fitelson.org/DoSAT/dist/decision.html
- Landing page: https://fitelson.org/DoSAT/
- Public repository: https://github.com/fitelson/DoSAT
- Implementation commit: `4ed0dea8b55975aaa2fcc4784f5f1c44ab4c8908`, pushed to `main` and remote SHA confirmed.
- UI consensus gate: **PASS**, Claude Opus 5.5/xhigh and GPT-6.1 Sol/xhigh; [recheck](recheck_2026-10-11T23-04-19Z/consensus.md).
- Approved package: `DoSAT-1.0-2026-10-11T23-04-37-259Z-2258cdcd`; [manifest](recheck_2026-10-11T23-04-19Z/release-manifest.json).

All 22 remote files match SHA256 and bytes, including .htaccess; all 21 publicly served files also match over HTTPS. Runtime isolation headers are COOP same-origin and COEP require-corp; WASM is application/wasm. See [remote](live-remote-verification.json) and [HTTPS](live-http-verification.json) records.

The [37-check live probe](live-probe.json) passes at 320/390/1280px through the landing page: nine examples, actual Z3 5.1.0, Source Sans Pro SemiBold, isolation, no page errors or page overflow, keyboard-accessible formula ends, pending batch/physical errors/clear/task flows, and CR/CRLF file handling. Two further [live controls](live-controls.json) act 50ms after countermodel search starts: Cancel and an input edit settle, restore usable Run and allow a new successful entailment check. Observed settlement is about 2.92/2.91 seconds on these instances, not a universal physical deadline.

Root checks: 1,123 passing units (one inherited skip and one todo), 81 passing Chromium tests, TypeScript/lint/build PASS. Compiler and runtime solver are unchanged from mathematical Phase 3 approval. Only the DoSAT target was written. A per-file SSH timeout was recovered with one persistent connection, preserving old changed files, publishing assets before HTML, and verifying all 22 files on that connection. An extra SSH re-read failed; the post-upload remote hashes plus independent HTTPS verification are the evidence. No deletion or cleanup occurred. Current-source manifests/probes and reviewed Markdown/captures are in Dropbox and GitHub; private raw journals, local packages, superseded diagnostics and stale unreferenced bundles remain excluded from publication.
