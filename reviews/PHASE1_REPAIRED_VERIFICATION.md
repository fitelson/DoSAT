# Phase 1 repaired candidate — October 11, 2026

- npm run lint: exit0.
- npm run build: exit0; both entry pages build.
- npm run test:unit:747 passed,1 inherited skipped,1 inherited todo;18 files.
- npm run test:e2e:32 passed, headless Chromium, serial, strict5174.
- git diff --check: exit0.
- Focused F1 parser/compiler tests96 pass; focused solver acceptance33 pass;
  UI lifecycle/search-limit tests16 pass.
- No implementation changes to the original source PrSAT3.0 checkout.
- No pushes/deployments and no use of the permanent port5317.

The repairs add31 passing unit cases and4 browser cases compared with the
initial716/28 candidate. Build notices for legacy script loading remain inherited.
Current source hashes are in phase1_repaired_snapshot.json. The earlier initial
snapshot remains preserved as phase1_snapshot.json.
