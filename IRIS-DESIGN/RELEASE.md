# Design Release and Later Import

## Repository lifecycle
DRAFT → STRUCTURED → VALIDATING → GAP_FOUND → REPAIRING → VALIDATED → RELEASE_CANDIDATE → FROZEN → APPROVED_FOR_IMPORT → IMPORTED → VERIFIED → ACTIVE.

DRAFT ≠ ACTIVE.

## Release gate
A release candidate requires structural completeness PASS, no unresolved critical GAP/CONFLICT/UNKNOWN, invariant validation, terminal-gate validation, audit completeness and a reproducible change manifest.

## Import boundary
Import into a live IRIS system is a separate controlled transaction. The design repository can be edited without activating live behavior. Import must record baseline, candidate version, authorization, exact artifacts, verification results and rollback reference.

## Safety
Never overwrite unrelated application files to make IRIS fit the repository. Existing application content is preserved unless a separately authorized migration explicitly identifies a file as part of the target.
