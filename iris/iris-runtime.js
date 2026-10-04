/* IRIS Runtime — standalone, dependency-free, fail-closed execution core. */
(function(root, factory){
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.IRIS = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function(){
  "use strict";
  const NORMAL = ["MISSION_CREATED","INITIALIZED","ASSESSED","PLANNED","AUTHORIZED","EXECUTING","CAPTURED","VERIFIED","DECIDED","TRANSITIONED","RECONCILED","TERMINAL_CHECKED","AUDITED","COMPLETE"];
  const EXCEPTIONAL = new Set(["FAILURE","BLOCKED","TIMEOUT","UNKNOWN","PARTIAL_SUCCESS","CRASHED","RESTARTING","DUPLICATE","CONFLICT","LATE_RESULT","CANCELLED"]);
  const NEXT = {
    MISSION_CREATED:["INITIALIZED"], INITIALIZED:["ASSESSED"], ASSESSED:["PLANNED"], PLANNED:["AUTHORIZED"],
    AUTHORIZED:["EXECUTING"], EXECUTING:["CAPTURED","FAILURE","BLOCKED","TIMEOUT","UNKNOWN","PARTIAL_SUCCESS","CRASHED","DUPLICATE","CONFLICT","LATE_RESULT","CANCELLED"],
    CAPTURED:["VERIFIED"], VERIFIED:["DECIDED"], DECIDED:["TRANSITIONED"], TRANSITIONED:["RECONCILED"],
    RECONCILED:["TERMINAL_CHECKED","EXECUTING"], TERMINAL_CHECKED:["AUDITED"], AUDITED:["COMPLETE"],
    FAILURE:["RECONCILED","BLOCKED","CANCELLED"], BLOCKED:["RECONCILED","CANCELLED"], TIMEOUT:["RECONCILED"],
    UNKNOWN:["RECONCILED"], PARTIAL_SUCCESS:["RECONCILED"], CRASHED:["RESTARTING"], RESTARTING:["RECONCILED"],
    DUPLICATE:["RECONCILED"], CONFLICT:["RECONCILED"], LATE_RESULT:["RECONCILED"], CANCELLED:[]
  };
  const terminalStates = new Set(["COMPLETE","CANCELLED"]);
  const now = () => new Date().toISOString();
  const uid = (p) => p + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,10);
  const clone = x => JSON.parse(JSON.stringify(x));
  class IrisError extends Error { constructor(code,msg){ super(msg); this.name="IrisError"; this.code=code; } }
  class Mission {
    constructor(input={}){
      this.id=input.mission_id || uid("mission");
      this.version=1; this.generation=1; this.state="MISSION_CREATED"; this.status="RUNNING";
      this.target=input.target ?? null; this.owner=input.owner ?? "IRIS"; this.authority=input.authority ?? "IRIS";
      this.evidence=[]; this.decisions=[]; this.failures=[]; this.recoveries=[]; this.audit=[]; this.records=[]; this.modules={};
      this.pendingSideEffects=[]; this.blockers=[]; this.conflicts=[]; this.events=[];
      this.created_at=now(); this.updated_at=this.created_at;
      this._write("MISSION_CREATED",{input:clone(input)});
    }
    _write(type,data={}){ const r={record_id:uid("rec"),record_type:type,mission_id:this.id,version:this.version,generation:this.generation,state:this.state,timestamp:now(),data:clone(data)}; this.records.push(r); this.audit.push({audit_id:uid("audit"),entity_id:this.id,entity_version:this.version,event_type:type,before_state:this.state,after_state:this.state,timestamp:r.timestamp}); this.updated_at=r.timestamp; return r; }
    transition(next,opts={}){
      if (terminalStates.has(this.state)) throw new IrisError("TERMINAL_LOCKED","Terminal state is immutable");
      if (!NEXT[this.state] || !NEXT[this.state].includes(next)) throw new IrisError("INVALID_TRANSITION",this.state+" -> "+next+" is not allowed");
      if (next==="COMPLETE") this.assertTerminal(opts);
      if (opts.guard === false) throw new IrisError("GUARD_FAILED","Transition guard failed");
      const before=this.state; this.state=next; this.version++; this._write("TRANSITION",{from:before,to:next,reason:opts.reason||null,evidence_refs:opts.evidence_refs||[]}); return this.snapshot();
    }
    addEvidence(e){ if(!e || !e.id) throw new IrisError("INVALID_EVIDENCE","Evidence requires a stable id"); const x={...clone(e),captured_at:now()}; this.evidence.push(x); this._write("EVIDENCE",{evidence_id:x.id}); return x; }
    decide(d){ if(!d || !d.evidence_refs || !d.evidence_refs.length) throw new IrisError("DECISION_WITHOUT_EVIDENCE","Decision requires evidence"); const x={decision_id:d.decision_id||uid("decision"),...clone(d),decided_at:now(),state_version:this.version}; this.decisions.push(x); this._write("DECISION",{decision_id:x.decision_id}); return x; }
    fail(f){ const x={failure_id:f?.failure_id||uid("failure"),event_id:f?.event_id||uid("event"),conditions:f?.conditions||null,action:f?.action||null,actual_result:f?.actual_result||null,failure_point:f?.failure_point||null,cause_status:f?.cause_status||"UNKNOWN",impact:f?.impact||null,evidence_refs:f?.evidence_refs||[],timestamp:now()}; this.failures.push(x); if(this.state==="EXECUTING") this.transition("FAILURE",{reason:"failure",evidence_refs:x.evidence_refs}); else this._write("FAILURE",x); return x; }
    reconcile(r={}){ const x={recovery_id:r.recovery_id||uid("recon"),strategy:r.strategy||"RECONCILE",attempt_no:r.attempt_no||0,reconciliation_refs:r.reconciliation_refs||[],result:r.result||"UNKNOWN",evidence_refs:r.evidence_refs||[],timestamp:now()}; this.recoveries.push(x); if(this.state!=="RECONCILED") this.transition("RECONCILED",{reason:"reconciliation",evidence_refs:x.evidence_refs}); else this._write("RECONCILIATION",x); return x; }
    recover(r={}){ if(this.state!=="RECONCILED") throw new IrisError("RECOVERY_REQUIRES_RECONCILIATION","Recovery requires RECONCILED state"); if(r.revalidated!==true) throw new IrisError("RECOVERY_NOT_REVALIDATED","Recovery requires explicit revalidation"); const x={...clone(r),recovery_id:r.recovery_id||uid("recovery"),timestamp:now()}; this.recoveries.push(x); this._write("RECOVERY",x); if(r.resume===true) this.transition("EXECUTING",{reason:"verified recovery"}); return x; }
    registerModule(m){ if(!m || !m.id || !m.contract) throw new IrisError("INVALID_MODULE","Module requires id and contract"); this.modules[m.id]=clone(m); this._write("MODULE_REGISTERED",{module_id:m.id}); return clone(m); }
    assertTerminal(opts={}){
      const checks={target_match:opts.target_match===true,final_verification_pass:opts.final_verification_pass===true,evidence_valid:opts.evidence_valid===true,decision_valid:opts.decision_valid===true,state_consistent:opts.state_consistent!==false,ownership_valid:opts.ownership_valid!==false,authorization_valid:opts.authorization_valid!==false,dependencies_valid:opts.dependencies_valid!==false,no_critical_failure:!this.failures.some(f=>f.impact==="CRITICAL"&&!f.resolved),no_unresolved_blocker:this.blockers.length===0,no_unknown_side_effect:this.pendingSideEffects.length===0,no_pending_recovery:opts.no_pending_recovery!==false,no_conflict:this.conflicts.length===0,no_pending_outbox:opts.no_pending_outbox!==false,audit_complete:opts.audit_complete===true};
      const failed=Object.keys(checks).filter(k=>!checks[k]); if(failed.length) throw new IrisError("TERMINAL_GATE_FAILED","Terminal gate failed: "+failed.join(",")); return checks;
    }
    complete(opts={}){ this.assertTerminal(opts); return this.transition("COMPLETE",{...opts,reason:"terminal gate passed"}); }
    snapshot(){ return clone({id:this.id,version:this.version,generation:this.generation,state:this.state,status:this.status,target:this.target,owner:this.owner,authority:this.authority,evidence:this.evidence,decisions:this.decisions,failures:this.failures,recoveries:this.recoveries,modules:this.modules,records:this.records,audit:this.audit}); }
  }
  return Object.freeze({version:"1.0.0",NORMAL_STATES:NORMAL,EXCEPTIONAL_STATES:Array.from(EXCEPTIONAL),createMission:(input)=>new Mission(input),Mission,IrisError});
});
