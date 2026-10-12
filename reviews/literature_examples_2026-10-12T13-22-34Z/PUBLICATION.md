# DoSAT literature presets — publication

Target: https://fitelson.org/DoSAT/.
Repository: https://github.com/fitelson/DoSAT, public main.
Branden explicitly requested commit, push and upload on October 12, 2026.
This release applies only to DoSAT; other PrSAT-family push restrictions remain.

The approved package is
`DoSAT-1.0-2026-10-12T14-09-05-409Z-ae1cbaaf`, with one HTML entry and eight files.
Its frozen [manifest](recheck_2026-10-12T14-08-02Z/release-manifest.json) preserves
the preparation-time status; this record supplies the completed publication
status. The scoped default-model repair consensus is PASS. The release commit
containing this record includes the frozen source/tests, currently referenced
generated assets and curated review/verification evidence.

Publication used the project-specific backup-preserving publisher in one SSH
session. All eight server files match the approved SHA-256 values and sizes;
all six publicly served files match over HTTPS. The root returns HTTP 200 with
the required COOP/COEP headers; WASM has application/wasm MIME. Five retired
entry routes return HTTP 301 to the canonical page. The backup directory returns
HTTP 403. Older bundles and overwritten-file backups are preserved.

The real live browser probe passes **21 scenario runs and 45 exact evaluations**
at 320, 390 and 1280px, covering every menu preset. It verifies neutral startup,
guide Clear/placeholder handling, exact values, positivity-term definedness and
containment, with no page errors. Source and generated files match the reviewed
snapshot. Simpson's original problem is unchanged.

Evidence:

- [Source snapshot](recheck_2026-10-12T14-08-02Z/source-snapshot.json)
- [Remote hashes](recheck_2026-10-12T14-08-02Z/remote-verification.json)
- [HTTPS/header/redirect checks](recheck_2026-10-12T14-08-02Z/live-http-verification.json)
- [Live browser probe](recheck_2026-10-12T14-08-02Z/live-probe.json)
- [Desktop capture](recheck_2026-10-12T14-08-02Z/berkson-1280.png)
- [390px capture](recheck_2026-10-12T14-08-02Z/berkson-390.png)
- [320px capture](recheck_2026-10-12T14-08-02Z/berkson-320.png)

Full validation and the preserved, unexplained unit-run qualification are in
[FINAL_STATUS.md](FINAL_STATUS.md). Markdown review records are shareable; raw
JSONL journals, local release packages and unrelated artifacts are excluded from
this source publication. No new dependency or service setup is required.
