# IRIS Design Repository

This directory is the design and specification workspace for IRIS. It is intentionally isolated from the existing video-player application and does not replace or modify the application's runtime architecture.

## Status
- Design baseline: approved for repository capture
- Live IRIS activation: not performed by this commit
- Source of truth: versioned Git history plus the canonical specifications below
- Unknown: never treated as PASS

## Canonical documents
- MASTER_SPEC.md — consolidated architecture and invariants
- SCHEMAS.md — canonical record, decision, audit, failure, recovery, capability and change schemas
- LIFECYCLE.md — single lifecycle, states, transitions and terminal gate
- GOVERNANCE.md — 80/10/20 authority model and update authorization
- RECOVERY.md — failure, reconciliation, recovery and resume rules
- TESTING.md — isolated test system and validation model
- VALIDATION.md — structural scanner, gap/conflict/unknown rules
- EVOLUTION.md — user/IRIS/error-derived capability evolution
- RELEASE.md — design repository release and later import procedure

## Boundary
Existing application files remain untouched. IRIS design artifacts live only under \`IRIS-DESIGN/\` until an explicit, separately authorized import into a live system is performed.
