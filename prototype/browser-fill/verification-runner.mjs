import {readTransferRecord,writeTransferRecord} from '../dist/transfer-storage.mjs';
import {reviewedLevelGroups} from '../dist/reviewed-structure.mjs';
import {buildSaveReview} from '../dist/save-review.mjs';
import {runApprovedSave} from '../dist/approved-save.mjs';
import {readAssignedLevelUsage,findUnitLevelConflicts} from '../dist/native-level-usage.mjs';
import {readAssignedLesson} from '../api-companion/read-lesson.mjs';
import {clone,canonical} from '../dist/transfer-core.mjs';
import {runAcceptedNativeRehearsal,recoverNativeLevelCheck} from '../dist/native-level-verification.mjs';
import {createNativeTransport} from './native-transport.mjs';
import {prepareNativeTarget,verificationDestination} from './native-target.mjs';
import {runNativeStructureVerification,recoverNativeStructureCheck} from '../dist/native-structure-verification.mjs';
import {nativeEditorBridge} from '../dist/native-dom-adapter.mjs';
import {runNativeVerification,recoverNativeVerification} from '../dist/native-verification.mjs';
import {normalizeNativeCapture} from '../dist/transfer-native.mjs';
const status=document.getElementById('status'),report=document.getElementById('report'),download=document.getElementById('download');
let evidence,bridge,previous,targetState,latestKey='native-verification-latest';
let continueUpdates=true,revision;
const continuation=document.getElementById('continuation');
continuation.onclick=()=>{continueUpdates=!continueUpdates;continuation.textContent=continueUpdates?'Stop automatic continuation':'Resume automatic continuation';};
function saveReport(){
 const url=URL.createObjectURL(new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='native-automated-verification.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
download.onclick=saveReport;
function watchUpdates(){
 if(typeof revision!=='string')return;
 const poll=setInterval(async()=>{
  if(!continueUpdates)return;
  if(localStorage.getItem('native-verification-owner')!==new URL(location.href).hash.slice(1)){clearInterval(poll);status.textContent='A newer verification tab owns automatic checks.';return;}
  try{
   const next=(await(await fetch(chrome.runtime.getURL('browser-fill/automation-revision.json'),{cache:'no-store'})).json()).revision;
   if(typeof next==='string'&&next!==revision){
    clearInterval(poll);status.textContent='Tested companion update detected. Starting the next automatic check.';location.reload();
   }
  }catch{/* Keep the completed report available when the update marker is unreadable. */}
 },3000);
}

async function executeVerification(){
try{
 const token=new URL(location.href).hash.slice(1),key='native-verification-run-'+token;
 const serialized=localStorage.getItem(key);if(!serialized)throw Error('Open this check from the companion on your playground editor.');
 const run=JSON.parse(serialized);
 const selected=verificationDestination((await chrome.tabs.get(run.tabId)).url);if(canonical(selected)!==canonical(run.destination||null))throw Error('The selected verification destination changed. No checks were started.');
 latestKey='native-verification-latest-'+(selected?.id||8898985);previous=readTransferRecord(localStorage,latestKey);
 const owner=localStorage.getItem('native-verification-owner');
 if(owner&&owner!==token){status.textContent='Another verification tab owns this editor. No checks were started here.';return;}
 localStorage.setItem('native-verification-owner',token);
 const ownTab=await chrome.tabs.getCurrent();if(ownTab?.id)localStorage.setItem('native-verification-controller-tab',String(ownTab.id));
 if(!Number.isInteger(run.tabId)||Date.now()-run.createdAt>(run.started?8*60*60*1000:60000))throw Error('The verification launch expired. Open a fresh check from the companion.');
 run.started=true;localStorage.setItem(key,JSON.stringify(run));
 revision=(await(await fetch(chrome.runtime.getURL('browser-fill/automation-revision.json'),{cache:'no-store'})).json()).revision;
 targetState=await prepareNativeTarget(chrome.tabs,run.tabId);
 bridge=createNativeTransport(async encoded=>{
  const [result]=await chrome.scripting.executeScript({target:{tabId:run.tabId},injectImmediately:true,func:nativeEditorBridge,args:[JSON.stringify({...JSON.parse(encoded),...(run.destination?{destination:run.destination,practiceConfirmed:true}:{})})]});
  return result?.result;
 });
 // Access is limited to the tab authorized when the companion was opened;
 // the injected bridge separately enforces host, path, and lesson identity.
 if(revision.startsWith('approved-save-')){
  // Pre-dispatch validation failures may pick up a tested repair. Once an
  // attempt is persisted, continuation stops and any restart is readback-only.
  continuation.textContent='Stop automatic continuation before save';
  document.title='Lesson Studio approved save';
  document.getElementById('run-title').textContent='Approved four-link save';
  document.getElementById('run-description').textContent='Completing the save you approved: one existing level link in Test, Score, and Reflect, and three assessment links in Check for Understanding. The playground title and all other saved content are preserved.';
  document.getElementById('run-instructions').textContent='Keep this tab and the playground editor open. The original saved lesson is retained as a restore point. The save is sent at most once; its result is checked with a separate saved read.';
  const response=await fetch(chrome.runtime.getURL('browser-fill/local-save-job.json'),{cache:'no-store'});
  if(!response.ok)throw Error('The approved local save job is unavailable.');
  const job=await response.json();
  document.getElementById('save-review').textContent=(job.review.sectionAdditions||[]).map(c=>c.label+'\nAppend: '+JSON.stringify(c.section)).join('\n\n')+'\n'+(job.review.fieldChanges||[]).map(c=>c.label+'\nBefore: '+JSON.stringify(c.before)+'\nAfter: '+JSON.stringify(c.after)).join('\n\n')+'\n'+job.review.changes.map(c=>c.section+': '+c.addLevels.map(l=>l.name+(l.assessment?' (assessment)':'')).join(', ')).join('\n');
  const reader=createNativeTransport(async encoded=>{const [result]=await chrome.scripting.executeScript({target:{tabId:run.tabId},injectImmediately:true,func:readAssignedLesson,args:[encoded]});return result?.result;});
  const pkg=await(await fetch(chrome.runtime.getURL('browser-fill/accepted-rehearsal.json'),{cache:'no-store'})).json();
  evidence=await runApprovedSave(job,{
   readSaved:()=>reader({action:'read',returnRaw:true}),readEditor:()=>bridge({action:'read'}),send:request=>bridge(request),
   checkUsage:async review=>{
    const readUsage=createNativeTransport(async encoded=>{const [result]=await chrome.scripting.executeScript({target:{tabId:run.tabId},injectImmediately:true,func:readAssignedLevelUsage,args:[encoded]});return result?.result;});
    const usages=[];for(const level of reviewedLevelGroups(review).flatMap(c=>c.addLevels))usages.push(await readUsage({action:'read',levelId:level.levelId,name:level.name}));
    return findUnitLevelConflicts(review,usages);
   },
   recover:async()=>{
    const point=readTransferRecord(localStorage,'native-approved-save-staging');
    if(!point?.plan||!point.initialCapture)throw Error('No owned unsaved staging checkpoint is available. Outside edits were preserved.');
    await recoverNativeLevelCheck(bridge,point);
   },
   stage:()=>runAcceptedNativeRehearsal(bridge,pkg,{leaveStaged:true,onProgress:message=>{status.textContent=message;},onCheckpoint:async point=>{writeTransferRecord(localStorage,'native-approved-save-staging',point);}}),
   loadReceipt:async key=>readTransferRecord(localStorage,'native-approved-save-'+key),
   persist:async(key,value)=>{writeTransferRecord(localStorage,'native-approved-save-'+key,value);if(value.attempted){continueUpdates=false;continuation.hidden=true;}},
   checkpoint:async point=>{writeTransferRecord(localStorage,'native-approved-save-checkpoint',point);if(point.stage)writeTransferRecord(localStorage,'native-approved-save-staging',point.stage);},
   onProgress:message=>{status.textContent=message;}
  });
  continueUpdates=false;continuation.hidden=true;
  evidence.revision=revision;
  writeTransferRecord(localStorage,'native-approved-save-latest',evidence);
  status.textContent=evidence.status==='saved-and-verified'?'Approved save completed. Four level links and three assessment flags verified. All other saved content preserved. Report downloaded.':evidence.status==='save-rejected-unchanged'?'The server rejected the save. Saved lesson is unchanged. No retry will be sent. Report downloaded.':'Save not confirmed. No automatic retry will be sent. Report downloaded.';
  report.textContent=JSON.stringify({status:evidence.status,verification:evidence.verification,dispatch:evidence.dispatch,saveRetried:false},null,2);
  download.hidden=false;saveReport();return;
 }
 const reuse=revision.startsWith('save-review-')&&previous?.status==='passed-and-restored'&&previous.levels?.status==='passed-and-restored';
 if(reuse){
  status.textContent='Checking that the editor still matches the completed rehearsal.';
  const current=normalizeNativeCapture(await bridge({action:'read'})),original=normalizeNativeCapture(previous.levels.finalCapture);
  if(canonical(current.lesson)!==canonical(original.lesson)||canonical(current.nativeProtection)!==canonical(original.nativeProtection))throw Error('The editor changed after the completed rehearsal. Recompare before preparing a save review.');
  evidence=clone(previous);evidence.reusedRehearsal=true;evidence.sourceRehearsalRevision=previous.revision;
 }else{
 let recovery,structuralRecovery,levelRecovery;
 if(previous?.levels?.restored===false&&previous.levels.plan){status.textContent='Recovering earlier temporary level links.';levelRecovery=await recoverNativeLevelCheck(bridge,previous.levels);}
 if(previous?.structure?.restored===false&&previous.structure.plan){
  status.textContent='Recovering the earlier temporary test section before starting new checks.';
  structuralRecovery=await recoverNativeStructureCheck(bridge,previous.structure);
 }
 if(previous?.plan){
  status.textContent='Recovering the earlier temporary verification changes before starting new checks.';
  recovery=await recoverNativeVerification(bridge,previous);
 }
 evidence=await runNativeVerification(bridge,{onProgress:message=>{status.textContent=message;},onCheckpoint:checkpoint=>{writeTransferRecord(localStorage,latestKey,checkpoint);}});
 evidence.runnerVersion='native-accepted-levels-10';evidence.targetState=targetState;evidence.revision=revision;evidence.generatedAt=new Date().toISOString();if(recovery)evidence.recovery=recovery;if(structuralRecovery)evidence.structuralRecovery=structuralRecovery;if(levelRecovery)evidence.levelRecovery=levelRecovery;
 if(evidence.status==='passed-and-restored'){
  evidence.structure=await runNativeStructureVerification(bridge,{onProgress:message=>{status.textContent=message;},onCheckpoint:checkpoint=>{writeTransferRecord(localStorage,latestKey,{...evidence,restored:false,structure:checkpoint});}});
  if(evidence.structure.status!=='passed-and-restored'){evidence.status='blocked';evidence.restored=evidence.structure.restored;evidence.error=evidence.structure.error;evidence.restorationError=evidence.structure.restorationError;}
 }
 if(evidence.status==='passed-and-restored'&&!revision.startsWith('verification-release-')){
  const response=await fetch(chrome.runtime.getURL('browser-fill/accepted-rehearsal.json'),{cache:'no-store'});
  if(!response.ok)throw Error('The locally approved rehearsal package is unavailable.');
  const pkg=await response.json();
  evidence.levels=await runAcceptedNativeRehearsal(bridge,pkg,{onProgress:message=>{status.textContent=message;},onCheckpoint:checkpoint=>{writeTransferRecord(localStorage,latestKey,{...evidence,restored:false,levels:checkpoint});}});
  if(evidence.levels.status!=='passed-and-restored'){evidence.status='blocked';evidence.restored=evidence.levels.restored;evidence.error=evidence.levels.error;evidence.restorationError=evidence.levels.restorationError;}
 }
 if(revision.startsWith('verification-release-'))evidence.acceptedPackageCheck={status:'not-configured',reason:'The release default runs field and temporary-structure checks only. Private accepted-package rehearsal requires separate local configuration.'};
 }
 evidence.runnerVersion='selected-playground-check-15';evidence.companionVersion=chrome.runtime.getManifest().version;evidence.revision=revision;evidence.generatedAt=new Date().toISOString();
 if(evidence.status==='passed-and-restored'&&evidence.levels?.status==='passed-and-restored'){
  status.textContent='Reading the saved lesson again and preparing the proposed save. No write will be sent.';
  try{
   const reader=createNativeTransport(async encoded=>{const [result]=await chrome.scripting.executeScript({target:{tabId:run.tabId},injectImmediately:true,func:readAssignedLesson,args:[encoded]});return result?.result;});
   const fresh=await reader({action:'read',returnRaw:true});
   evidence.saveReview=await buildSaveReview(evidence.levels,fresh.lesson,{originalLessonJson:fresh.originalLessonJson});
   evidence.saveReviewFreshRead=true;
  }catch(error){evidence.saveReview={status:'blocked',error:error.message,saveAllowed:false,remoteWrites:false};}
 }

 try{
  writeTransferRecord(localStorage,latestKey,evidence);
  const state=(readTransferRecord(localStorage,'native-scalar-staging-v1')||{});
  const capture=evidence.levels?.finalCapture||evidence.structure?.finalCapture||evidence.finalCapture;
  if(capture){state.capture=capture;state.snapshot=normalizeNativeCapture(capture);}
  delete state.pkg;delete state.journal;state.decisions={};
  state.report={status:evidence.status,restored:evidence.restored,saved:false};
  writeTransferRecord(localStorage,'native-scalar-staging-v1',state);
 }catch{evidence.storageWarning='Local storage was unavailable; keep the downloaded report.';}
 report.textContent=JSON.stringify({status:evidence.status,fields:evidence.fields?.length||0,restored:evidence.restored,saved:false,structure:evidence.structure?{status:evidence.structure.status,callouts:evidence.structure.callouts,restored:evidence.structure.restored}:null,levels:evidence.levels?{status:evidence.levels.status,counts:evidence.levels.counts,restored:evidence.levels.restored}:null,skipped:evidence.skipped,error:evidence.error,restorationError:evidence.restorationError},null,2);
 status.textContent=evidence.status==='passed-and-restored'?(evidence.saveReview?.status==='ready-for-review'?'Save preview ready. Original values remain restored. No Save performed. Report downloaded.':evidence.saveReview?.status==='blocked'?'Rehearsal passed and restored. Save preview blocked: '+evidence.saveReview.error:'Automatic check passed. All original values restored. No Save performed. Report downloaded.'):'Verification stopped. '+(evidence.error||'')+' '+(evidence.restorationError||(evidence.restored?'Original values restored.':'Restoration was not confirmed.'));
 const reviewBox=document.getElementById('save-review');
 if(reviewBox)reviewBox.textContent=evidence.saveReview?.status==='ready-for-review'?(evidence.saveReview.sectionAdditions||[]).map(c=>c.label+'\nAppend: '+JSON.stringify(c.section)).join('\n\n')+'\n'+(evidence.saveReview.fieldChanges||[]).map(c=>c.label+'\nBefore: '+JSON.stringify(c.before)+'\nAfter: '+JSON.stringify(c.after)).join('\n\n')+'\n'+evidence.saveReview.changes.map(change=>'Add '+change.addLevels.length+' existing level link(s) to '+change.section+' ('+change.addLevels.filter(level=>level.assessment).length+' assessment).').join('\n')+'\nUnlisted lesson content and settings are retained. A live save remains disabled pending explicit approval and a fresh restaging check.':evidence.saveReview?.error||'Not prepared.';
 download.hidden=false;saveReport();
 if(!evidence.restored){
  continuation.textContent='Stop guarded recovery checks on tested updates';
 }
 // Watch only our bundled revision marker. No localhost or remote command
 // service, extra host permission, or downloaded code is involved.
 watchUpdates();
}catch(error){
 status.textContent='Verification stopped. '+error.message;
 // Recovery failures must remain inspectable without asking the user to read
 // status text or relay a screenshot. Keep the original recovery baseline.
 evidence={schemaVersion:1,kind:'native-automated-verification',status:'blocked',restored:false,saved:false,error:error.message,
  initialCapture:previous?.initialCapture,plan:previous?.plan,structure:previous?.structure,levels:previous?.levels,targetState,runnerVersion:'native-accepted-levels-10',revision,generatedAt:new Date().toISOString()};
 if(bridge)try{evidence.cleanupCapture=await bridge({action:'read'});}catch{}
 try{writeTransferRecord(localStorage,latestKey,evidence);}catch{}
 report.textContent=JSON.stringify({status:evidence.status,error:evidence.error,restored:false,saved:false},null,2);
 download.hidden=false;saveReport();watchUpdates();
}

}
await navigator.locks.request('lesson-studio-native-verification',{ifAvailable:true},async lock=>{
 if(!lock){status.textContent='Another verification tab is already running. No parallel edits were started.';return;}
 await executeVerification();
});
