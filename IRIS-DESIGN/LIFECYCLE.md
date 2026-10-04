# Lifecycle and State Model

## Normal path
MISSION_CREATED → INITIALIZED → ASSESSED → PLANNED → AUTHORIZED → EXECUTING → CAPTURED → VERIFIED → DECIDED → TRANSITIONED → RECONCILED → TERMINAL_CHECKED → AUDITED → COMPLETE

## Exceptional states
FAILURE, BLOCKED, TIMEOUT, UNKNOWN, PARTIAL_SUCCESS, CRASHED, RESTARTING, DUPLICATE, CONFLICT, LATE_RESULT, CANCELLED.

## Transition rule
A transition is valid only when its guard passes, required evidence exists, authority is valid, ownership is valid, dependencies are valid, and the transition is recorded atomically with its audit event.

## Resume
RESUME is allowed only after persisted state is loaded, integrity is checked, pending side effects are reconciled, dependencies and permissions are revalidated, and a fresh decision authorizes continuation.

## Terminal preconditions
A terminal state cannot be entered merely because an action returned success. Final verification, evidence validation, decision validation, reconciliation, audit completeness and all critical preconditions must pass.
