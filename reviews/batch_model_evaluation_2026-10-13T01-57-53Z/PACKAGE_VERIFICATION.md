# Prepared package verification

All eight prepared files match the release manifest. The immutable review source
hashes still match. The actual built page loads dosat-CD1FS2oP.js and passes 99
batch checks across 1280/390/320 pixels: 14 admissions values, 14 matching Boolean
constraints and one false constraint per width, plus four display checks.
Primary admissions entailment and SAT model pass. Batch draft/hide/Discard,
second-row syntax validation and unchanged original witness/export pass.
No page errors or document overflow; actual Z3 5.1.0 and isolation are active.
Desktop/narrow-phone evaluator captures were visually inspected. Per-row results
are readable and long formulas scroll inside their named regions.

These observations supplement VERIFICATION.md without changing the frozen code.
See package-probe.json and the locally retained package-probe.mjs/captures.
