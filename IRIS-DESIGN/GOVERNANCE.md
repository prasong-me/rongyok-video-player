# Governance and Authority

## 80/10/20 model
- IRIS DOMAIN — 80%: autonomous operation within its defined authority.
- GOVERNANCE/CONTROL DOMAIN — 10%: cross-cutting structural authority, separate from both IRIS and User domains.
- USER DOMAIN — 20%: user-controlled data, structures and authority.

The percentages are domains, not additive resource shares.

## Governance scope
The 10% layer controls changes to the stable core, single lifecycle, global governance, authority boundaries, ownership boundaries, or changes that exceed IRIS's autonomous scope. It must not be used as a mechanism to inspect or edit private data merely because governance exists.

## Update authorization
The phrase “อัพเดทระบบ” is not sufficient by keyword alone. A valid update requires whole-sentence intent, context, scope and authorization validation. A mention, quotation or negation is not an update command.

The confirmation flow is:
DETECT → VALIDATE INTENT → SCOPE → PROPOSE CHANGE → PRESENT IMPACT/RISK/EVIDENCE → REQUEST FIXED CONFIRMATION → COMMIT → VERIFY → AUDIT

The fixed confirmation command is “อัพเดทระบบ”. No commit occurs from a discussion about the phrase.

## Atomic change
CURRENT VERSION → BASELINE → CANDIDATE → VALIDATE → AUTHORIZE → ATOMIC COMMIT → VERIFY → AUDIT → LOCK.
If validation or authorization fails, the current version remains active. A bad committed version is recoverable to the previous valid version.
