import {buildTransferPlan,clone,normalizedDraft,packageProblems} from './transfer-core.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';
import {makeRehearsal,mountRehearsal} from './transfer-rehearsal.mjs';
import {stagePlan} from './transfer-runner.mjs';
const $=selector=>document.querySelector(selector),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={},plan=null,driver=null,running=false,controller;
try{state=JSON.parse(localStorage.getItem('lesson-transfer-v1'))||{};}catch{}
state.decisions??={};
let storageWarning='';
const notice=message=>{$('#transfer-notice').textContent=[message,storageWarning].filter(Boolean).join(' ');};
function persist(){try{localStorage.setItem('lesson-transfer-v1',JSON.stringify(state));storageWarning='';}catch{storageWarning='Storage is unavailable. Download the comparison and recovery report before leaving.';notice('');}}
const display=value=>typeof value==='string'?value:JSON.stringify(value,null,2);
function packageSummary(){
 const draft=normalizedDraft(state.pkg.lesson);
 $('#package-summary').textContent=`Loaded package: ${draft.title}; ${draft.activities.length} activities; ${draft.activities.reduce((n,a)=>n+a.sections.length,0)} sections. ${packageProblems(state.pkg).length?'Approval problems must be resolved before staging.':'Approved baseline verified.'}`;
 $('#blank-rehearsal').disabled=false;
}
function renderReport(){
 const report=state.report;
 $('#transfer-results').innerHTML=report?`<h3>${esc(report.status)}</h3><p>${report.completed} / ${report.total} actions previously acknowledged.${report.currentStateVerified===false?' Current editor verification failed; recompare it before continuing.':' Current run verified.'} Saved remotely: no.</p>${report.reason?`<p role="alert">${esc(report.reason)}</p>`:''}${report.nextLocation?`<p>Next location: ${esc(report.nextLocation)}</p>`:''}<details><summary>Every action and its location</summary><ul>${report.items.map(item=>`<li>${esc(item.status)} — ${esc(item.label)}</li>`).join('')}</ul></details>`:'';
}
async function rebuild(){
 if(!state.pkg||!state.initialSnapshot)return;
 plan=await buildTransferPlan(state.pkg,state.initialSnapshot,state.decisions);
 const pending=plan.operations.filter(op=>op.requiresDecision);
 $('#transfer-plan').innerHTML=`<h2>3. Review proposed changes</h2><p>${plan.operations.length} proposed actions; ${pending.length} content decisions; ${plan.preserved.length} preserved locations. ${state.initialSnapshot.mode==='local-rehearsal'?'Destination: synthetic local rehearsal.':'Destination: native page capture, read-only.'}</p>`
  +(plan.blockers.length?`<div class="warning"><h3>Transfer blockers</h3><ul>${plan.blockers.map(message=>`<li>${esc(message)}</li>`).join('')}</ul></div>`:'<p>No mapping or approval blockers.</p>')
  +plan.operations.map(op=>`<details class="${op.requiresDecision?'unresolved':''}" ${op.requiresDecision?'open':''}><summary>${esc(op.label)}${op.requiresDecision?' — decision required':''}</summary><div class="change-values"><div><strong>Current destination</strong><pre>${esc(display(op.before))}</pre></div><div><strong>${op.kind==='append'?'Append record':'Approved draft'}</strong><pre>${esc(display(op.after))}</pre></div></div>${op.requiresDecision?`<div class="actions"><button data-decision="keep" data-operation="${op.id}">Keep destination</button><button data-decision="replace" data-operation="${op.id}">Use approved draft</button></div>`:''}</details>`).join('')
  +(plan.preserved.length?`<details><summary>Preserved destination content and intentional differences</summary><ul>${plan.preserved.map(item=>`<li>${esc(item.label)} — ${esc(item.reason)}</li>`).join('')}</ul></details>`:'');
 $('#stage-transfer').disabled=running||state.initialSnapshot.mode!=='local-rehearsal'||plan.blockers.length>0||pending.length>0;
 $('#download-transfer').disabled=false;$('#recompare-transfer').disabled=running||!driver;renderReport();
}
function mount(){
 const root=$('#rehearsal-editor');root.hidden=state.initialSnapshot?.mode!=='local-rehearsal';
 if(!root.hidden)driver=mountRehearsal(root,state.workingSnapshot||state.initialSnapshot,snapshot=>{state.workingSnapshot=snapshot;persist();});else driver=null;
}
$('#load-package').onclick=async()=>{
 if(running)return;
 try{
  if(state.report?.completed>0)throw Error('A staged rehearsal is already retained. Download its report and explicitly start a new comparison before replacing the package.');
  const pkg=JSON.parse($('#transfer-package').value);packageProblems(pkg);
  state={pkg,decisions:{}};plan=null;driver=null;$('#rehearsal-editor').hidden=true;packageSummary();persist();
  $('#transfer-plan').innerHTML='<h2>3. Review proposed changes</h2><p>Choose destination evidence next.</p>';notice('Review package loaded without changing the lesson workspace.');
 }catch(error){notice(error.message);}
};
$('#new-comparison').onclick=()=>{
 if(running)return;
 if(!confirm('Start a new transfer comparison? This clears only this transfer rehearsal and recovery record. Download its report first to keep a backup. The lesson workspace is unaffected.'))return;
 state={decisions:{}};plan=null;driver=null;persist();location.reload();
};
$('#blank-rehearsal').onclick=async()=>{
 try{
  if(running||state.report?.completed>0)throw Error('A staged rehearsal is already retained. Resume it or explicitly start a new comparison.');
  state.initialSnapshot=makeRehearsal(state.pkg);state.workingSnapshot=clone(state.initialSnapshot);state.decisions={};delete state.journal;delete state.report;
  mount();await rebuild();persist();notice('Isolated local rehearsal created. The catalog is synthetic and does not verify native mappings.');
 }catch(error){notice(error.message);}
};
$('#load-capture').onclick=async()=>{
 try{
  if(!state.pkg)throw Error('Load the approved review package first.');
  if(running||state.report?.completed>0)throw Error('Download the retained rehearsal report and start a new comparison before replacing destination evidence.');
  state.initialSnapshot=normalizeNativeCapture(JSON.parse($('#transfer-capture').value));state.decisions={};delete state.workingSnapshot;delete state.journal;delete state.report;
  mount();await rebuild();persist();notice('Native page comparison prepared. Native filling and saving are disabled.');
 }catch(error){notice(error.message);}
};
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-decision]');if(!button||running)return;
 state.decisions[button.dataset.operation]=button.dataset.decision;delete state.report;delete state.journal;
 await rebuild();persist();
});
$('#stage-transfer').onclick=async()=>{
 if(running||!plan||!driver)return;
 state.history??=[];if(state.report)state.history.push({planId:plan.id,report:clone(state.report)});
 running=true;controller=new AbortController();$('#stop-transfer').disabled=false;$('#stage-transfer').disabled=true;
 for(const id of ['load-package','new-comparison','blank-rehearsal','load-capture'])$('#'+id).disabled=true;
 try{
  const report=await stagePlan(plan,driver,{journal:state.journal,maxOperations:Number($('#operation-limit').value),signal:controller.signal,
   onProgress:report=>{state.report=report;state.journal={schemaVersion:1,planId:plan.id,completed:report.completed};$('#transfer-progress').textContent=`${report.completed} / ${report.total}: ${report.items[report.completed-1].label}`;persist();}});
  state.report=report;state.journal=report.journal;persist();notice(report.status==='staged-unsaved'?'Local staging verified. Nothing was saved remotely.':'Staging stopped. The report identifies the next location or blocker.');
 }catch(error){state.report={...(state.report||{completed:0,total:plan.operations.length,items:plan.operations.map(op=>({label:op.label,status:'pending'}))}),status:'blocked',reason:error.message,currentStateVerified:false};persist();notice(error.message);}
 finally{running=false;$('#stop-transfer').disabled=true;for(const id of ['load-package','new-comparison','blank-rehearsal','load-capture'])$('#'+id).disabled=false;await rebuild();}
};
$('#recompare-transfer').onclick=async()=>{
 if(running||!driver)return;
 try{const current=await driver.read();state.history??=[];if(state.report)state.history.push({planId:plan.id,report:state.report,initialSnapshot:state.initialSnapshot});state.initialSnapshot=current;state.workingSnapshot=clone(current);state.decisions={};delete state.report;delete state.journal;await rebuild();persist();notice('Comparison rebuilt from the current local editor. Its existing edits are retained, and prior reports remain in the download.');}catch(error){notice(error.message);}
};
$('#stop-transfer').onclick=()=>controller?.abort();
$('#download-transfer').onclick=()=>{
 if(!plan)return;
 const data={schemaVersion:1,plan,report:state.report||null,journal:state.journal||null,currentEditor:state.workingSnapshot||null,pkg:state.pkg,decisions:state.decisions,history:state.history||[]};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='lesson-transfer-review.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
try{
 const incoming=sessionStorage.getItem('lesson-transfer-input');
 if(incoming&&!state.pkg){$('#transfer-package').value=incoming;notice('The lesson workspace supplied a review package. Load it to verify approval before transfer.');}
 if(state.pkg){$('#transfer-package').value=JSON.stringify(state.pkg,null,2);packageSummary();mount();await rebuild();notice('Retained transfer comparison restored. The destination will be re-read before staging resumes.');}
}catch(error){notice(error.message);}
