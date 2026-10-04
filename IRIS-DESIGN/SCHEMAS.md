# Canonical Schemas

## Canonical Record
record_id, record_type, mission_id, parent_record_id, source, owner, authority, version, generation, timestamp, state, action, input_ref, output_ref, evidence_refs, decision_ref, failure_ref, recovery_ref, transition_ref, status, integrity_hash, created_at, updated_at.

## Decision
 decision_id, mission_id, state_version, evidence_refs, policy_ref, authority_ref, decision_type, rationale, guard_result, risk, dependencies, validity_window, decided_at, actor, integrity_hash.

## Audit
 audit_id, entity_id, entity_version, event_type, actor, authority, before_state, after_state, evidence_refs, decision_ref, timestamp, integrity_hash, previous_audit_hash.

## Failure
 failure_id, mission_id, event_id, state_version, conditions, action, actual_result, failure_point, cause_status, impact, evidence_refs, recovery_status, timestamp.

## Recovery
 recovery_id, failure_id, strategy, attempt_no, idempotency_key, preconditions, reconciliation_refs, revalidation_refs, result, evidence_refs, next_decision_ref, timestamp.

## Capability
 capability_id, name, source_type, source_record_refs, owner, scope, contract, inputs, outputs, lifecycle_hooks, control_points, version, validation_status, authorization_status, activation_status, evidence_refs.

## Change
 change_id, source_type, proposal, baseline_version, candidate_version, scope, impact, risk, evidence_refs, validation_result, authorization_result, commit_ref, rollback_ref, verification_result, audit_ref, status.

UNKNOWN is a valid status but never a passing assertion.
