# Literature example candidate verification

October 12, 2026. Baseline b59d782; source hashes are in source-snapshot.json.

- Full Vitest: **1,318 passed**, one inherited skip and one todo, 33 files.
- Full Chromium Playwright: **103 passed**, one worker, strict port 5174,
  1.1 minutes. Report: playwright-report-run2/. All previous solver/lifecycle
  inputs remain regression fixtures; the ten added cases exercise the seven
  actual presets and their guidance at three widths.
- TypeScript, typed ESLint, production build and authored whitespace PASS.
- Independent audit_examples.py: seven graph/kernel checks, every supplied
  premise, all **15 exact displayed evaluation values**, observationally identical
  positivity kernels with intervention probabilities 0 and 1, and the retained
  Simpson rates PASS. Uses Fraction enumeration rather than application code.
- Prepared eight-file package: all seven actual presets solved at each of
  320/390/1280px, with all **45 evaluation executions** passing. There were
  **21 scenario runs**, no page errors, no page overflow, exact seven-option
  menu content, source links and browser Z3 5.1.0/isolation checks. See
  package-probe.json; screenshots are berkson-{320,390,1280}.png.
- Eight parser/compiler/solver/evaluator files are byte-identical to baseline.
  The compiled package and authored source remain frozen for review.
- Code-only Graphify refreshed to 1,122 nodes, 2,708 edges and 69 communities.

The initial Playwright attempt could not launch its missing pinned Chromium.
It produced no application assertions. Installed the matching Playwright
Chromium/headless shell and FFmpeg, then reran the entire suite into new output
directories. Earlier failure artifacts are retained. No package dependency or
machine default was changed. The package preview server was stopped after QA.

Publication is separate from the mathematical phase gate. No push or upload has
occurred. The current live application still has the prior approved presets.
