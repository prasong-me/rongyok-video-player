# IRIS Master Specification

## 1. Purpose
IRIS is a controlled, evidence-first work-execution architecture designed to execute a mission continuously, recover from abnormal conditions, preserve traceability, and stop only when terminal conditions are proven.

## 2. Stable Core
The stable core contains one lifecycle, central control, guards, transitions and verification. Details belong to extensible modules.

CONTROL = DECISION + GUARD + TRANSITION

Core input:
STATE + EVIDENCE + POLICY + AUTHORITY + RESOURCE/CONSTRAINT
→ DECISION → GUARD → TRANSITION → ACTION

A module must expose a contract, owner, lifecycle hooks, control points, result/evidence format and version compatibility. Internal implementation is not part of the core.

## 3. Single Lifecycle
CREATE → INITIALIZE → ASSESS → PLAN → AUTHORIZE → EXECUTE → CAPTURE → VERIFY → DECIDE → TRANSITION → RECONCILE → TERMINAL_CHECK → AUDIT → COMPLETE

Abnormal conditions may enter FAILURE, BLOCKED, TIMEOUT, UNKNOWN, PARTIAL_SUCCESS, CRASH, RESTART, DUPLICATE, CONFLICT, LATE_RESULT, INPUT_DRIFT, DEPENDENCY_DRIFT, PERMISSION_REVOCATION, CANCEL or EXTERNAL_SIDE_EFFECT. No abnormal path bypasses reconciliation, revalidation, decision, terminal gate and audit.

## 4. Invariants
- No orphan state or record.
- No silent failure, recovery or mutation.
- No unsupported decision or hidden transition.
- No unverified completion.
- UNKNOWN ≠ PASS.
- No infinite retry or no-progress loop.
- No stale evidence at terminal decision.
- No unresolved critical blocker, conflict, recovery or side effect.
- Recovery requires revalidation.
- Audit history is immutable.
- Completion must be reproducible from evidence.
- Tool use must be within declared scope and justified by the mission.

## 5. Terminal Gate
COMPLETE requires: target match; final verification PASS; valid evidence; valid decision; consistent state; valid ownership and authorization; valid dependencies; no critical failure; no unresolved blocker; no unknown side effect; no pending recovery; no conflict; no pending outbox; complete audit; terminal state locked.

## 6. Structural completeness
Every structure requires PURPOSE, OWNER, INPUT, OUTPUT, STATE, TRANSITION, GUARD, FAILURE_PATH, RECOVERY_PATH, RECONCILIATION_PATH, PERSISTENCE, AUDIT, SECURITY_BOUNDARY, VERSION and TERMINAL_CONDITION.

## 7. Provenance
Every proposed change records its source as USER_INITIATED, IRIS_INITIATED or ERROR_DERIVED. IDEA ≠ PROPOSAL ≠ AUTHORIZED CHANGE ≠ ACTIVE CAPABILITY.

## 8. Design/live separation
This repository is a design capture layer. A design commit does not activate live IRIS. Activation requires the governance and release procedure defined in RELEASE.md.
