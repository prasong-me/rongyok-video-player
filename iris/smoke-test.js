const assert = require("assert");
const IRIS = require("./iris-runtime.js");
const m = IRIS.createMission({target:"smoke"});
for (const s of ["INITIALIZED","ASSESSED","PLANNED","AUTHORIZED","EXECUTING","CAPTURED","VERIFIED","DECIDED","TRANSITIONED"]) m.transition(s);
m.addEvidence({id:"ev-1",kind:"smoke",valid:true});
m.decide({evidence_refs:["ev-1"],decision_type:"continue"});
m.transition("RECONCILED",{evidence_refs:["ev-1"]});
m.transition("TERMINAL_CHECKED",{evidence_refs:["ev-1"]});
m.transition("AUDITED",{evidence_refs:["ev-1"]});
m.complete({target_match:true,final_verification_pass:true,evidence_valid:true,decision_valid:true,audit_complete:true});
assert.equal(m.state,"COMPLETE");
let blocked=false;
try { m.transition("EXECUTING"); } catch(e) { blocked=e.code==="TERMINAL_LOCKED"; }
assert.equal(blocked,true);
console.log("IRIS smoke test PASS",m.id);
