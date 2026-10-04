# IRIS Runtime — Active Core

This is the first executable IRIS core captured in the repository. It is standalone and dependency-free. It does not modify the existing Rongyok player application.

## Use

Browser:

```html
<script src="../iris/iris-runtime.js"></script>
<script>
const mission = IRIS.createMission({ target: "example" });
mission.transition("INITIALIZED");
// continue through the guarded lifecycle
</script>
```

Node/CommonJS:

```js
const IRIS = require('./iris/iris-runtime.js');
const mission = IRIS.createMission({ target: 'example' });
```

## Safety properties
- Single lifecycle and explicit transition table.
- Terminal state is locked.
- UNKNOWN is not PASS.
- Decisions require evidence references.
- Recovery requires reconciliation and explicit revalidation.
- Terminal completion is fail-closed behind a gate.
- Failure records preserve event/action/result/failure point/impact/evidence.
- Modules require an id and contract.
- No external dependencies and no automatic integration with the existing application.

## Activation boundary
The runtime is active as an executable library in this repository. Existing application runtime remains unchanged. Integration into the application's execution path is a separate controlled change.
