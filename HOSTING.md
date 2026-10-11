# DoSAT 1.0 hosting

Subtitle: **A Decision Procedure for Do Calculus.**

Target proposed from Branden's October 11 naming/hosting request:
`https://fitelson.org/DoSAT/`. Follow the existing PrSAT arrangement:

- `webpage/dosat.html` becomes `/DoSAT/index.html`.
- The built application is under `/DoSAT/dist/`; its primary entry is
  `/DoSAT/dist/decision.html`.
- Preserve the inherited classical `dist/index.html` so existing internal links
  and classical regressions remain valid.
- Apache headers in `dist/.htaccess` enable cross-origin isolation for Z3's
  SharedArrayBuffer/worker runtime and set the WebAssembly MIME type.
- Upload only current referenced build assets plus stable Z3/COI runtime files.
  Do not upload node_modules, private journals, review diagnostics or stale bundles.
- Release only after Phase 3 is complete and its scoped consensus gate passes.
  Existing deploy commands remain disabled until an explicit scoped DoSAT
  publication command is prepared; never run the copied PrSAT deployment target.
- Preserve existing remote files; do not delete stale files as a release step.
  Compare uploaded files with local sources and verify the live headers and
  actual browser solver after publication.

The local landing page can be inspected at `/webpage/dosat.html` on the dev
server. The public repository https://github.com/fitelson/DoSAT was created
after the Phase 3 consensus PASS. Website publication is complete and verified;
see reviews/PHASE3_PUBLICATION.md. The final package's 21 remote file hashes,
20 HTTPS file hashes, headers, actual Z3 5.1.0 and 32 live browser checks match.

Read-only server check: SSH access to the existing web root succeeded;
`/home/fitelson/www/www/DoSAT` does not yet exist. No remote file was written.

`npm run prepare:release` builds and writes a fresh, preserved local release
under releases/. It contains the landing page, current referenced assets and
stable runtime files, with a checksum manifest. It performs no deployment and
never cleans existing directories. A candidate package was verified through
its landing-page launch link in headless Chromium; see phase3 release probe.
