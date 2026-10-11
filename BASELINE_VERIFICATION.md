# Baseline verification — October 11, 2026

- Copied 68 existing files from the current PrSAT 3.0 working tree.
- All 35 application-source and test files match the source byte-for-byte.
- Original source-file hashes and Git status are unchanged after setup.
- `npm ci --no-audit --no-fund`: passed.
- `npm run build`: passed, including TypeScript compilation.
- `npm run test:unit`: 600 passed, 1 skipped, 1 todo across 13 passing test files.
- `npm run deploy`: intentional exit 1; no deployment target, build, or upload.
- All relative folder paths in the parent PrSAT.code-workspace resolve.

Browser end-to-end tests were not run for this copy/setup step. No causal
functionality has been implemented or tested. Build output retains the inherited
Vite notices about non-module Z3/service-worker scripts. npm reported two optional
fsevents install scripts awaiting approval; installation, build, and tests passed
without approving them.

This is an independent Git repository with an initial baseline commit and no
remote. The original PrSAT history and dirty working tree remain in the original
checkout; exact copied-file provenance is recorded in FORK_PROVENANCE.json.
