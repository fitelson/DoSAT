# Phase 2 bounded repair

Initial scoped consensus: FAIL, one required finding. Defaults were
claude-opus-5-5/xhigh and gpt-6.1-sol/xhigh. The complete mathematical,
graphical, definedness and integration audit is in phase2_consensus.md.

## F1: narrow-screen diagram containment

The mobile `1fr` grid track had an automatic minimum, letting an SVG stretch
its grid column and the entire page. Changed that one track to `minmax(0, 1fr)`.
No other runtime source changed after the initial review snapshot.

Four serial Chromium regressions cover all seven built-in examples and the
long-label graph `Z -> Y9007199254740991; Z -> W; W -> Y9007199254740991`.
Widths: 320, 360, 390 and 1280px, 32 example/viewport combinations. They assert
no document overflow, scroll-container containment, internal scrolling when
the SVG is wider, no page errors, and side-by-side desktop grid sections.
The first desktop assertion incorrectly aligned the boxes below unequal
headings/paragraphs; corrected to align the sections. The exact failure is
preserved in PHASE2_DESKTOP_ASSERTION_FAILURE.md. No runtime issue was involved.

A separate production-build probe passed the same 32 combinations on strict
loopback 4173 with zero page errors. Measurements are retained in
phase2_repaired_production_probe.json. Owned preview server stopped.

## Review evidence and boundaries

The original 17-file snapshot is preserved as phase2_initial_snapshot.json.
The repaired snapshot is captured separately for the recheck. Graph/rule/UI
logic, diagrams and semantic scope remain identical to the first review.
The first debate's native-Z3 sweep reported 54,216 successful cases over
three/four-node DAGs; the peer checked all indexed outcomes. This is reviewer
experimental evidence, not a committed portable regression or an exhaustive
six-node proof. The cited theorem and permanent independent graphical oracle
support the general bounded implementation.

Nonblocking recommendations remain recorded in the first transcript: a small
native-Z3 semantic sweep, relabeled rule-surgery enumeration, distinct SVG
accessible descriptions, old-browser arrowhead color fallback, and retained
unreferenced build files. None requires a mathematical or Phase 2 runtime repair.
Only current referenced new build assets will enter any checkpoint commit.

Review conduct qualification: one reviewer removed its own transient probe
from node_modules despite the read-only/no-deletion instruction. The report
records this; no project source or documentation was removed. The recheck prompt
requires every probe outside the checkout and forbids deletion of probes too.
Raw journals remain private, while Markdown reports are the shareable record.

Status: PASS. The default-model scoped repair recheck reached consensus, with
explicit Phase gate PASS from both participants. See phase2_recheck_consensus.md.
Both independently verified the snapshot, static checks, 17 affected browser
tests, 32 production cases, actual internal scrolling and regression failures
with the old CSS injected in memory. The runtime snapshot remained fixed.
