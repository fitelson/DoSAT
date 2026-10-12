# DoSAT 1.0 hosting

The single public application is https://fitelson.org/DoSAT/.
The only production entry is index.html; the entire app, including its graph
preview and returned-model evaluator, is on that page. The former landing page
and auxiliary interfaces are preserved as local references under reference-ui/.

npm run prepare:release builds one entry and copies only its current referenced
assets, root Z3/COI runtime files, and root/compatibility .htaccess into a fresh
preserved release. Its manifest has pages=[index.html] and five retired /dist/
routes; those URLs redirect to the canonical root. Stable runtime filenames
revalidate, WASM has application/wasm MIME, and COOP/COEP isolation headers apply
at the root as well as compatibility paths. Do not add an index.html redirect
that also redirects Apache's internal directory-index request.

Publish only after the current scoped consensus gate passes. The helper in
reviews/single_page_model_eval_2026-10-12T01-02-21Z/publish.py uses one SSH session,
verifies all staged bytes, installs runtime/assets first, then root headers
without retirement redirects, the application index, and final redirects. This
keeps a usable application behind every newly installed redirect. Previous
changed files are preserved outside the web root under DoSAT-release-backups.
No cleanup or deletion occurs. Only /home/fitelson/www/www/DoSAT is the app target;
never run inherited PrSAT deploy commands.

Verify all remote hashes, public HTTPS bytes/headers, root status200, retired
301 redirects, actual Z3 and live examples/evaluation/lifecycle flows. Original
PrSAT and its permanent5317 service are unrelated. Local development uses strict
5173, browser tests5174, and package verification uses a private4175 Apache
instance. The copied generic npm deploy command stays disabled.

The preceding UI release is recorded in reviews/ui_implementation_2026-10-11T22-41-54Z/PUBLICATION.md.
The new single-page/model-evaluation phase is implemented locally and its gate
is pending; it is not yet published. Read the current PROJECT.md status.
