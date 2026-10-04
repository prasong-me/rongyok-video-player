# Test System

The test system is separate from production state and production completion.

## Test record
Test Definition → Scenario → Input → Expected Result → Actual Result → Assertion → Evidence → Report.

## Test classes
- Invariant tests
- State transition tests
- Boundary/authority tests
- Failure injection
- Recovery/resume tests
- Idempotency/duplicate tests
- Concurrency/version tests
- Late-result tests
- Persistence/crash tests
- Terminal-gate tests
- Resource/limit/stress tests
- Structural completeness tests

TEST PASS proves only that the test scenario passed. It does not become a production COMPLETE state.

## Required assertions
Unknown must fail closed. Every failure injection must have a defined recovery or explicit expected terminal outcome. Every critical lifecycle path must have test coverage before release candidate status.
