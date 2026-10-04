# Structural Validation

## Scanner result
PASS / GAP / CONFLICT / UNKNOWN.

UNKNOWN never counts as PASS.

## Completeness predicate
ALL_STRUCTURES_IDENTIFIED
AND ALL_STRUCTURES_HAVE_OWNER
AND ALL_STRUCTURES_HAVE_CONTRACT
AND ALL_BOUNDARIES_HAVE_CONTRACT
AND ALL_TRANSITIONS_HAVE_GUARDS
AND ALL_FAILURES_HAVE_PATHS
AND ALL_RECOVERIES_HAVE_REVALIDATION
AND ALL_UNKNOWNS_HAVE_RECONCILIATION
AND ALL_SIDE_EFFECTS_HAVE_RECONCILIATION
AND ALL_TERMINAL_STATES_HAVE_PRECONDITIONS
AND ALL_CRITICAL_PATHS_HAVE_AUDIT
AND ALL_REQUIRED_PATHS_HAVE_TEST_COVERAGE
AND NO_UNRESOLVED_CONFLICT
AND NO_UNRESOLVED_UNKNOWN
AND NO_UNOWNED_STRUCTURE
AND NO_UNOWNED_BOUNDARY

## Scan behavior
The scanner must report the exact object/path, violated predicate, evidence, severity, owner and required repair. A missing fact is UNKNOWN, not an inferred PASS.

## Boundary checks
Every boundary has ownership, contract, validation, versioning, failure handling, recovery, reconciliation and audit requirements.
