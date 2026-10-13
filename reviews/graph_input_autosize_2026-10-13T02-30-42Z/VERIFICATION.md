# Graph input sizing verification

Base7deb216. Only runtime changes: generalize the existing conclusion autosizer
for both textareas, observe each field's width, and apply the graph's border-box/
overflow/resize CSS. No parser, graph renderer, evaluator, solver or model change.

Full1366unitpasses,1inheritedskip,1todo;66publicChromiumcasespass. One new regression
checks six resize transitions at1280/1024/900/390/320/1280px, explicit line breaks,
source-value preservation and shrinking after a short edit. Lint/TypeScript/build
pass. The initial build caught a test-only replaceAll call unsupported by the
configured TypeScript library; regex replacement fixed it. No application repair
was needed for that diagnostic. Candidate dosat-DzVDdA2r.js / dosat-DsZ54EQU.css,
eight-file package. The actual package passes six width transitions, source/model
preservation, explicit lines and shrinking after a short edit, with no page errors
or document overflow. Mid-width and phone captures were visually inspected.
The completed default-model consensus is **PASS**, in consensus.md. Publication
and fresh live evidence are recorded in PUBLICATION.md.
