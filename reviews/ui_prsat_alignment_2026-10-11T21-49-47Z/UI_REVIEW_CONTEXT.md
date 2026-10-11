# UI-only comparison evidence

User request: make DoSAT feel more similar to PrSAT; have Claude review just the interface.

Current source commit:9ad6e1d. No app code changed. The published mathematical/solver Phase3 PASS is outside this review.

Live reference: https://fitelson.org/PrSAT/dist/
Live current app: https://fitelson.org/DoSAT/dist/decision.html

All captures were made in fresh headless Chromium pages at1280x900 and390x900. No visible browser or preview was opened. Interactions only entered small examples in isolated pages; no server writes.

| Capture | Page height | Primary action Y | Screenshot |
|---|---:|---:|---|
| prsat-1280-initial | 900 | 374.3 | prsat-1280-initial.png |
| prsat-1280-model | 1136 | 630.4 | prsat-1280-model.png |
| prsat-390-initial | 900 | 425.5 | prsat-390-initial.png |
| prsat-390-model | 1343 | 732.8 | prsat-390-model.png |
| dosat-1280-initial | 1583 | 1423.1 | dosat-1280-initial.png |
| dosat-1280-countermodel | 2459 | 1423.1 | dosat-1280-countermodel.png |
| dosat-1280-model | 2301 | 1423.1 | dosat-1280-model.png |
| dosat-390-initial | 2201 | 1964.8 | dosat-390-initial.png |
| dosat-390-countermodel | 3180 | 1964.8 | dosat-390-countermodel.png |
| dosat-390-model | 2971 | 1964.8 | dosat-390-model.png |

PrSAT initial action is about374px down on desktop and425px on mobile; DoSAT initial action is about1423px and1965px. These are observed geometry, not a fabricated heuristic. PrSAT uses styled INPUT buttons, with Source Sans Pro16px; DoSAT uses BUTTON elements which currently compute as browser-default Arial13.33px. Individual constraints / live rendered math are present in PrSAT; DoSAT has full-width textareas and long help paragraphs. Inspect the images and source before making final recommendations.

The PrSAT390px model capture has445px document width; do not copy this overflow as a design requirement. Keep DoSAT responsive and retain accessibility improvements.

Each PNG has a same-name JSON with visible controls, geometry, headings, body text and tables. ui_capture_summary.json combines all10 captures. All captures report zero page errors. Source snapshot identifies the relevant immutable UI files.

Review scope: visual structure, entry workflow, controls, feedback, results hierarchy and familiarity; no algorithm benchmarks, formal-proof audit, dependency upgrades, code edits, publication, or repository changes. A redesign proposal can retain DoSAT-specific graph, task distinction and definedness/status qualifications while using PrSAT’s familiar editor/toolbar/table layout.
