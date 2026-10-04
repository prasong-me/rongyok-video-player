# Failure, Reconciliation, Recovery and Resume

## Mandatory failure record
A failure record contains event, conditions, attempted action, actual result, failure point, cause status, impact, evidence and related mission/state identifiers.

## Recovery path
FAILURE/UNKNOWN → RECONCILE → REVALIDATE → DECIDE → RECOVER/RETRY/ROLLBACK/ESCALATE → VERIFY → CONTINUE or TERMINAL_CHECK.

## Rules
1. Timeout is not proof of failure; external state must be reconciled.
2. Recovery never proves success by itself.
3. A retry must be idempotent or protected by a unique operation key.
4. Retry budget and no-progress guard prevent infinite loops.
5. Late results must carry generation/version identity and cannot overwrite newer state.
6. External side effects require explicit reconciliation.
7. Crash recovery begins from journaled state, not memory assumptions.
8. Recovery exhaustion produces an explicit terminal failure/escalation state rather than silent continuation.
9. Resume after blockage repeats validation of permissions, dependencies, evidence freshness and ownership.
