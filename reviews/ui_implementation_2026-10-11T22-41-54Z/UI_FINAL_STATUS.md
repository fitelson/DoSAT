# DoSAT PrSAT-style UI: approved release

October 11, 2026. **UI phase gate: PASS.** The default-model scoped [consensus recheck](recheck_2026-10-11T23-04-19Z/consensus.md) approved the repaired implementation with Claude Opus 5.5/xhigh and GPT-6.1 Sol/xhigh. There are no current blockers. The closed mathematical Phase 3 PASS remains unchanged.

## Delivered interface

PrSAT header/fonts/panels/teal action; individual premise rows and safe causal MathML; keyboard split/merge/navigation; compact graph; clear entailment/satisfiability task choice and hidden retained conclusion draft; batch Parse/Discard with visible pending-state gating; whole-problem v1 JSON Save/Load/Copy; Clear preserving the other fields; linked physical-row/field validation and ARIA; compact options with definedness, structural-zero and deadline qualifications.

Exact models/countermodels show visible observational/intervention ⊤/⊥ tables, rendered query values, submitted failed conclusions, user real variables and expandable mechanisms. Long formulas have contained named keyboard scroll regions. Loaded CR/CRLF text is normalized before validation and mutation. All outcomes remain distinct; empty-premise validity and cancellation/settlement ownership are preserved.

## Review and verification

The initial [implementation audit](consensus.md) failed on mobile formula clipping and loaded-text representation. Both repair groups and their tests are recorded in [REPAIRS.md](recheck_2026-10-11T23-04-19Z/REPAIRS.md). The subsequent consensus PASS closes those blockers. Earlier bad and repaired captures remain available; raw model journals remain private.

Root verification: **1,123 passing unit tests**, one inherited skip and one todo; **81 passing Chromium tests** (strict port 5174, one worker); TypeScript, typed lint, build and whitespace checks PASS. The **37-check production-package probe** passes nine examples at 320/390/1280px, actual Source Sans Pro SemiBold, Z3 5.1.0, isolation, zero page errors, keyboard/formula containment and normalized file loads. Both reviewers independently reached formula ends using only the keyboard and confirmed live-result/export/pending-draft preservation on rejected loads. Their [JSON evidence](recheck_2026-10-11T23-04-19Z/independent-probes/probe.json) and [spacing supplement](recheck_2026-10-11T23-04-19Z/independent-probes/supplement.json) are now preserved in Dropbox, beyond the temporary paths in the transcript.

Default Run top: about 767px desktop / 930px at 390px. The 320px layout stays contained but takes more scrolling. Compiler and runtime solver SHA256 match the approved Phase 3 sources. Code-only Graphify refreshed to 1,021 nodes, 2,483 edges, 61 communities. No file, artifact or old bundle was deleted.

## Release

Approved package: releases/DoSAT-1.0-2026-10-11T23-04-37-259Z-2258cdcd, **22 current files**, with [checksum manifest](recheck_2026-10-11T23-04-19Z/release-manifest.json). Target https://fitelson.org/DoSAT/; application https://fitelson.org/DoSAT/dist/decision.html. Published and verified. Implementation commit **4ed0dea8b55975aaa2fcc4784f5f1c44ab4c8908** was pushed to public origin/main. All **22 remote files** and **21 HTTPS files** match the approved checksums/byte sizes; COOP/COEP and WASM MIME are correct. The live **37-check probe** and **two task-scheduled Cancel/Edit/reuse checks** pass. See [PUBLICATION.md](PUBLICATION.md). Only current referenced assets and stable runtime files are included; original PrSAT and port 5317 are unrelated.

## Qualifications and later work

Verification is Chromium-only; Safari, Firefox, iOS Safari and real screen readers remain untested. Optional followups include making permanent tests keyboard-only to the end, reducing fitting-preview tab stops, compact whole-problem wording on phones, IME handling, multi-line conclusion display, bulk paste into a row, algebraic-root presentation and inactive invalid seconds serialization. These are nonblocking in the approved recheck. Arbitrary model evaluation, decimals/image export and graph drawing remain outside this pass. Finite resources and context history can affect difficult queries; no runtime-performance improvement is claimed.

## Preserved transport recovery

The first per-file SSH upload timed out before any application HTML changed. A retry over one persistent SSH connection skipped unchanged files, uploaded six changed/new files in asset-before-HTML order, preserved previous changed files, and verified all 22 remote hashes. A separate SSH re-read was unavailable; the successful connection's post-upload checks provide the remote verification record, followed by independent HTTPS checks. No file was deleted. Temporary local Vite servers were stopped after verification; the live site is independent of them.
