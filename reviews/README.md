# Phase review records

The required workflow is the **consensus debate skill with defaults**:
Claude Opus 5.5/xhigh and GPT-6.1 Sol/xhigh. Each review focuses on the changes,
new semantic claims, and integration obligations of the current development phase.
Untouched older code is reference material where needed, not a general audit target.

## Current phase 1 gate

- `PHASE1_CONSENSUS_PROMPT.md`: current scoped review question.
- `PHASE1_DELTA.md`: explicit change boundary from baseline724655b.
- `phase1_snapshot.json`: hashes supplied for the review candidate.
- `phase1_scoped_consensus.md`: initial scoped review (FAIL forF1/F2).
- `phase1_recheck_consensus.md`: completed repair recheck (PASS).
- `phase1_recheck_consensus.progress.md`: final durable progress/checkpoint log.
- Sibling `.protocol.json`: frozen defaults, sessions, deadlines and provenance.
- `PRODUCTION_SMOKE.md`: additional built-page browser verification.

The phase1 gate is **PASS**. The completed default-model recheck transcript is
[phase1_recheck_consensus.md](phase1_recheck_consensus.md). RequiredF1/F2 repairs
were independently approved; the recommendedN1 same-line regression was added
as a test-only follow-up and independently mutation-checked. See
[PHASE1_FINAL_STATUS.md](PHASE1_FINAL_STATUS.md). Agreement on findings needing repairs
is not permission to advance. Repairs require affected checks and consensus recheck.

## Superseded records retained

`phase1-claude-initial/` is a stopped standalone-Claude consultation. It does not
fulfill the gate. `phase1_consensus.*` is the initial debate stopped to apply the
explicit current-phase scope. Both stopped runs' diagnostics are preserved.
The old direct-Claude helper remains only for provenance; use the installed
consensus skill's runner for phase gates.

Raw `.jsonl` stream journals are private recovery diagnostics and should not be
shared as review reports. Read the Markdown transcripts instead.
