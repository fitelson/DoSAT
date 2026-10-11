# DoSAT 1.0 hosting

Subtitle: **A Decision Procedure for Do Calculus.**

The published target is https://fitelson.org/DoSAT/; the primary application is /DoSAT/dist/decision.html. Public repository: https://github.com/fitelson/DoSAT. Branden authorized public creation, commit, push and publication on October 11. The original publication is recorded in reviews/PHASE3_PUBLICATION.md; the approved PrSAT-style UI release is recorded in reviews/ui_implementation_2026-10-11T22-41-54Z/UI_FINAL_STATUS.md.

- webpage/dosat.html becomes /DoSAT/index.html; four built entry pages are under /DoSAT/dist/.
- Keep the inherited classical dist/index.html for internal links and regressions.
- dist/.htaccess supplies COOP/COEP and the WebAssembly MIME type; stable Z3 assets revalidate.
- Upload current referenced build assets and stable Z3/COI files first, application HTML next, landing index last.
- Publish only after the current scoped consensus gate passes. The copied deploy command stays disabled; never run the inherited PrSAT target.
- Preserve remote files and older local releases/bundles. Do not clean directories as a release step.
- Verify remote file SHA256 and bytes, HTTPS bytes/headers, actual browser Z3 and live UI behaviors.

npm run prepare:release creates a fresh preserved package under releases/, including a checksum manifest. It does not deploy or delete anything. The latest approved UI package has 22 files and passes 37 headless package checks. Use the scoped publish.py helper in the UI review folder only after its PASS; it targets /home/fitelson/www/www/DoSAT exclusively. The server directory already exists from the first publication. Ports 5173/4173/5174 are strict local development/preview/test ports; 5317 is unrelated and must remain untouched.
