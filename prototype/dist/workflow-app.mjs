import {prepareSharedReview,executeSharedReview,bindSharedRecords} from './shared-records.mjs';
import {saveDiagnostics} from './save-diagnostics.mjs';
import {reviewedLevelGroups} from './reviewed-structure.mjs';
import {prepareCleanup,approveCleanup,executeCleanup} from './test-link-cleanup.mjs';
import {reviewWindow} from './transfer-status.mjs';
import {readTransferRecord,writeTransferRecord,compactLegacyEvidence} from './transfer-storage.mjs';
import {clone} from './transfer-core.mjs';
import {selectDestination} from './destination.mjs';
import {readTransferBaseline,prepareTransfer,preparePreservationTest,approveTransfer,executeTransfer} from './reusable-transfer.mjs';
import {createDemo,demoAdapter} from './demo-transfer.mjs';
import {recoverNativeLevelCheck} from './native-level-verification.mjs';
import {saveRequestDigest} from './save-review.mjs';

const $=id=>document.getElementById(id),native=location.protocol==='chrome-extension:';
const url=new URL(location.href);let runId=url.searchParams.get('run');
if(!runId){runId=crypto.randomUUID();url.searchParams.set('run',runId);history.replaceState(null,'',url);}
const key='reviewed-transfer-session-'+runId;
let state={mode:native?'native':'demo',tabId:Number(location.hash.slice(1))},busy=false,baselineReading=false,io,startupError='',evidenceError='';
try{state=readTransferRecord(localStorage,key)||state;if(state.mode!==(native?'native':'demo'))throw Error('This run belongs to a different mode. Reopen it in its original browser context.');}catch(error){startupError=error.message;state={mode:native?'native':'demo',tabId:Number(location.hash.slice(1))};}
function persistRecord(recordKey,value){
 try{writeTransferRecord(localStorage,recordKey,value);}catch(error){evidenceError=error.message;throw error;}
}
const persist=()=>persistRecord(key,state);
function settleVerifiedSaveState(){
 if(state.cleanupReceipt?.attempted||state.receipt?.status!=='saved-and-verified')return;
 state.needsRecovery=false;
 if(state.preparationError){
  state.resolvedPreparationErrors??=[];
  state.resolvedPreparationErrors.push({message:state.preparationError,resolvedByRequestDigest:state.receipt.requestDigest});
  delete state.preparationError;
 }
}
const status=message=>{$('status').textContent=message;if(baselineReading)$('baseline-status').textContent=message;};
const el=(tag,text,parent)=>{const n=document.createElement(tag);n.textContent=text;parent.append(n);return n;};
function progress(step){for(let i=1;i<=4;i++){const node=$('step-'+i);node.classList.toggle('active',i===step);if(i===step)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');}}
function updateReviewWindow(){
 const window=reviewWindow(state.job?.review),note=$('review-expiry');
 if(note){note.hidden=!!state.receipt;note.textContent=state.receipt?'':window.text;}
 if(window.expired&&!state.receipt)$('approve').checked=false;
 const cleanupExpired=reviewWindow(state.cleanupReview).expired;if(cleanupExpired)$('approve-cleanup').checked=false;
 $('save-cleanup').disabled=busy||!state.cleanupReview||cleanupExpired||!$('approve-cleanup').checked||!!state.cleanupReceipt?.attempted||!!startupError;
 $('approve').disabled=busy||window.expired||!!state.receipt||!!startupError;
 $('save').disabled=busy||!$('approve').checked||!state.job||window.expired||!!state.receipt||!!startupError;
}

function fieldDisplay(change,value){
 if(value===null||value==='')return '(blank)';
 const names={teachingTip:'Teaching Tip',contentCorner:'Content Corner',discussionGoal:'Discussion Goal',assessmentOpportunity:'Assessment Opportunity',ethicsOpportunity:'Ethics Opportunity'};
 return change.path.at(-1)==='type'?(names[value]||String(value)):String(value);
}
function render(){
 $('selection').hidden=!state.pkg;$('lesson-name').textContent=state.pkg?.lesson.title||'';
 $('destination-name').textContent=state.destination?(native?'Live practice destination: ':'Synthetic demo destination: ')+state.destination.url:'';
 $('load-failure-demo').hidden=!!state.demo;$('load-demo').hidden=!!state.demo;$('load-teaching-demo').hidden=!!state.demo;$('load-structure-demo').hidden=!!state.demo;$('new-demo').hidden=!state.demo;
 $('prepare').disabled=busy||!!state.receipt||!!state.needsRecovery;
 $('prepare-preservation').disabled=busy||!!state.job||!!state.receipt||!!state.needsRecovery;
 $('read-baseline').disabled=busy||!!state.job||!!state.receipt||!!state.needsRecovery;
 $('read-baseline').textContent=baselineReading?'Reading baseline…':'Read baseline only and download report';
 $('read-baseline').setAttribute('aria-busy',String(baselineReading));
 if(native&&!baselineReading&&(state.job||state.receipt||state.needsRecovery))$('baseline-status').textContent='This run retains a review, save attempt, or staging recovery. Open a fresh reusable screen from the practice editor to read a new baseline without replacing this evidence.';
 $('download-baseline').disabled=busy||!state.checkpoint&&!state.preparationError;
 $('review-actions').hidden=!state.job||!!state.receipt||!!state.needsRecovery;
 $('save').disabled=busy||!$('approve').checked||!state.job;
 $('check').hidden=!state.receipt?.attempted||!!state.cleanupReceipt?.attempted;$('check').disabled=busy;
 $('recover').hidden=!state.needsRecovery||!!state.receipt?.attempted;$('recover').disabled=busy;
 $('download').disabled=!state.job&&!state.checkpoint&&!state.preparationError&&!state.sharedReview;
 $('new-demo').disabled=busy;
 for(const id of ['load-failure-demo','load-demo','load-teaching-demo','load-structure-demo','package-file','destination','practice'])$(id).disabled=busy||native&&!!state.job||!!state.needsRecovery;
 $('changes').replaceChildren();
 if(state.job){
  const review=state.job.review,levels=reviewedLevelGroups(review).flatMap(c=>c.addLevels),summary=el('div','',$('changes'));summary.className='summary';
  for(const [value,label]of [[review.preservationTest?review.expectedCounts.levels:levels.length,review.preservationTest?'preserved level links':'existing level links'],[review.preservationTest?review.expectedCounts.assessments:levels.filter(l=>l.assessment).length,review.preservationTest?'preserved assessments':'assessments'],[0,'new level copies']]){const item=el('div','',summary);el('strong',value,item);el('span',label,item);}
  if(review.preservationTest)el('p','Preservation test: save this lesson unchanged. Zero additions, removals, or text edits. All '+review.expectedCounts.levels+' existing levels and '+review.expectedCounts.assessments+' assessment flags must remain identical. Success requires native save acknowledgement and complete independent readback equality.',$('changes'));
  el('p','Destination title: '+review.baseline.name,$('changes'));
  el('p',review.transport==='native-editor'?'Save method: the native editor’s Save and Keep Editing control, followed by independent saved verification.':'Save method: direct API request (legacy review).',$('changes'));
  const table=el('table','',$('changes'));el('caption','Reviewed level links',table);const head=el('tr','',el('thead','',table));for(const text of ['Section','Level group','Existing level','Assessment'])el('th',text,head).setAttribute('scope','col');
  const body=el('tbody','',table);for(const c of reviewedLevelGroups(review))for(const l of c.addLevels){const row=el('tr','',body);el('td',c.section||c.activity,row);el('td',c.progression||'(untitled)',row);el('td',l.name,row);el('td',l.assessment?'Yes':'No',row);}
  if(review.sharedAdditions?.length){el('h3','Resource and vocabulary associations',$('changes'));for(const change of review.sharedAdditions)el('p','Associate '+(change.kind==='resources'?change.record.name:change.record.word)+' · existing record '+change.record.id,$('changes'));el('p','Existing associations and shared metadata are retained. No shared record is edited or deleted.',$('changes'));}
  if(review.objectiveAdditions?.length){el('h3','New objectives',$('changes'));for(const c of review.objectiveAdditions){el('p','Add objective: '+c.objective.description,$('changes'));}el('p','Existing objective identities and level tags are retained. New objectives have no level tags.',$('changes'));}
  if(review.activityAdditions?.length){el('h3','New activities',$('changes'));for(const c of review.activityAdditions){const d=el('details','',$('changes'));el('summary',c.label+': '+c.activity.name,d);el('p','Before: no activity. After: '+c.activity.name+' · '+(c.activity.duration??'Untimed')+' minutes. Sections are listed below.',d);}}
  if(review.calloutAdditions?.length){el('h3','New callouts on existing sections',$('changes'));for(const c of review.calloutAdditions){const d=el('details','',$('changes'));el('summary',c.label,d);el('p','Before: no callout at this appended position.',d);el('p','Type: '+c.tip.type,d);el('pre',c.tip.markdown,d);}}
  if(review.sectionAdditions?.length){
   el('h3','New sections and callouts',$('changes'));
   const names={teachingTip:'Teaching Tip',contentCorner:'Content Corner',discussionGoal:'Discussion Goal',assessmentOpportunity:'Assessment Opportunity',ethicsOpportunity:'Ethics Opportunity'};
   for(const change of review.sectionAdditions){
    const details=el('details','',$('changes')),s=change.section;el('summary','Add '+(s.name||'untitled section')+' to Activity '+(change.activityIndex+1),details);
    el('p','Before: no section at this appended position. Existing sections stay in place.',details);
    el('p','After: section '+(change.sectionIndex+1)+' · '+(s.duration===null?'Untimed':s.duration+' minutes')+' · Remarks '+(s.remarks?'on':'off'),details);
    el('pre',s.description||'(blank teaching text)',details);
    if(s.scriptLevels.length)el('p','Level group: '+s.progressionName+' · '+s.scriptLevels.length+' reviewed existing level link(s), listed above.',details);
    for(const tip of s.tips){el('h4',names[tip.type],details);el('pre',tip.markdown,details);}
   }
   el('p','Reusable companion section/callout saves have simulation coverage; the full automatic live path remains unverified. All existing sections remain preserved.',$('changes'));
  }
  if(review.fieldChanges?.length){
   el('h3','Teaching text and lesson structure',$('changes'));
   for(const change of review.fieldChanges){const details=el('details','',$('changes'));el('summary',change.label,details);el('p','Before',details);el('pre',fieldDisplay(change,change.before),details);el('p','After',details);el('pre',fieldDisplay(change,change.after),details);}
   el('p','Reusable companion teaching saves have simulation coverage; the full automatic live path remains unverified. Review every before-and-after value before approving.',$('changes'));
  }
  el('p','Preserved: destination title, unlisted teaching content, settings, resources, objectives, vocabulary, and existing record identities. Original editor restored after rehearsal.',$('changes'));
  const expiryNote=el('p','',$('changes'));expiryNote.id='review-expiry';expiryNote.setAttribute('aria-live','polite');
 }else el('p','Prepare a fresh comparison to see exactly what would change.',$('changes'));
 $('report').replaceChildren();
 if(state.receipt){
  const r=state.receipt,p=el('p',state.cleanupReceipt?.attempted?'Historical transfer receipt. See cleanup below for the current saved result.':r.status==='saved-and-verified'?(native?'Saved and independently verified.':'Simulated save verified. No live lesson was changed.'):r.status,$('report'));if(r.status==='saved-and-verified')p.className='success';
  el('p','Save requests sent: '+(native?'at most one for this approved request':state.demo.sendCount+' simulated')+'. Automatic retries: none.',$('report'));
  if(r.status==='saved-and-verified'&&!state.cleanupReceipt?.attempted)el('p','All reviewed changes match. Unlisted content and settings are preserved. Restore point retained.',$('report'));
  for(const message of saveDiagnostics(r).messages)el('p',message,$('report'));
  for(const message of r.verification?.mismatches||[])el('p',message,$('report'));
  if(state.automaticRecheck)el('p','Automatic readback-only recheck completed. No second save was sent.',$('report'));
  if(native&&r.verification?.passed&&!state.cleanupReceipt?.attempted)el('p','Before manual editing, preserve any outside unsaved edits and reopen the lesson to synchronize its saved baseline.',$('report'));
 }else{el('p',state.checkpoint?(state.checkpoint.stagingStarted===false?'Baseline: '+state.checkpoint.status+'. No staging or save attempted.':'Rehearsal: '+state.checkpoint.status+'. No save attempted.'):'No save attempted.',$('report'));
  const stage=state.checkpoint?.stage;
  if(stage?.blockers?.length){el('h3','What needs attention',$('report'));const list=el('ul','',$('report'));for(const blocker of stage.blockers)el('li',blocker,list);}
  if(stage?.restored===true)el('p','Original editor restored. No lesson save was attempted.',$('report'));
 }
 progress(state.receipt?4:state.job?3:state.pkg?2:1);
 updateReviewWindow();
 renderCleanup();
 renderShared();
 if(evidenceError){
  for(const control of document.querySelectorAll('button,input'))control.disabled=true;
  $('download').disabled=false;
  $('download-baseline').disabled=false;
  status(evidenceError+' Download the current run report before reloading this same run.');
  $('status').setAttribute('role','alert');
 }
}
function sharedLocked(){return busy||!!state.job||!!state.receipt||!!state.needsRecovery;}
let sharedRenderedId,sharedExpiryNote;
function renderShared(){
 $('shared-panel').hidden=!native||!state.pkg;
 const locked=sharedLocked(),review=state.sharedReview,expired=review&&Date.now()>review.expiresAt;
 $('prepare-shared').disabled=locked;
 $('shared-actions').hidden=!review;
 $('approve-shared').disabled=locked||!review||expired||!!state.sharedApproval;
 $('create-shared').disabled=locked||!review||expired||!!state.sharedApproval||!$('approve-shared').checked;
 $('check-shared').disabled=locked||!review||!state.sharedApproval;
 $('continue-shared').disabled=locked||state.sharedReceipt?.status!=='shared-records-verified';
 const list=$('shared-review');
 // Approval and expiry updates must keep open details and keyboard focus intact.
 if(sharedRenderedId!==(review?.id||null)){
  sharedRenderedId=review?.id||null;sharedExpiryNote=null;list.replaceChildren();
  if(review){el('p','Course version '+review.courseVersionId+' · '+review.destination.url,list);sharedExpiryNote=el('p','',list);
   for(const item of review.items){const d=el('details','',list);el('summary',(item.action==='reuse'?'Reuse: ':'Create: ')+(item.kind==='resources'?item.intent.name:item.intent.word),d);if(item.kind==='resources'){for(const field of ['type','audience','url'])el('p',field+': '+item.intent[field],d);if(item.action==='create')el('p','Shown in resource dropdowns; no download URL, PDF inclusion, assessment flag or curriculum category.',d);}else el('p',item.intent.definition,d);if(item.record)el('p','Existing record '+item.record.id+' · all shared settings retained.',d);}
  }
 }
 if(sharedExpiryNote)sharedExpiryNote.textContent=expired?'Review expired. Check shared records again before creating anything.':'Creation approval expires at '+new Date(review.expiresAt).toLocaleTimeString()+'.';
 $('shared-status').textContent=state.sharedReceipt?(state.sharedReceipt.status==='shared-records-verified'?'Every shared record is verified. Continue to the separate lesson review; the lesson has not been saved.':'Creation is not confirmed. Recheck reads only; it cannot create or resend records.'):state.sharedApproval?'An approved creation run is retained. Recheck records before continuing.':'No shared-record creation attempted.';
}
async function sharedIO(){
 io=await makeIO();if(!io.sharedBridge)throw Error('Shared-record creation is available only in the native companion.');
 return {context:()=>io.sharedBridge({action:'context'}),search:(kind,intent,context)=>io.sharedBridge({action:'search',kind,query:kind==='resources'?intent.name:intent.word,courseVersionId:context.courseVersionId}),
 create:(review,item,approval)=>io.sharedBridge({action:'create',mode:'explicit-approved-shared-create',review,item,approval}),
 load:async digest=>readTransferRecord(localStorage,'native-shared-record-'+digest),persist:async(digest,value)=>{persistRecord('native-shared-record-'+digest,value);state.sharedProgress=value;persist();},onProgress:result=>status(result.status==='record-verified'?'Shared record verified. The lesson remains unchanged.':'Creation is uncertain. No repeat request will be sent.')};
}
$('prepare-shared').onclick=()=>run(async()=>{
 if(!native||!state.pkg||state.job||state.receipt||state.needsRecovery)throw Error('Load a package in a fresh, restored practice run first.');
 state.destination=selectDestination($('destination').value,$('practice').checked);state.practiceConfirmed=true;persist();const shared=await sharedIO();await readTransferBaseline(io);
 state.sharedReview=await prepareSharedReview(state.pkg,shared);delete state.sharedReceipt;delete state.sharedApproval;$('approve-shared').checked=false;persist();
 if(state.sharedReview.items.every(i=>i.action==='reuse')){state.sharedApproval={reviewId:state.sharedReview.id,approved:true};persist();state.sharedReceipt=await executeSharedReview(state.sharedReview,state.sharedApproval,shared,{readOnly:true});persist();}
 status('Shared records checked. Review each item before creating missing records. The lesson has not been saved.');
});
$('approve-shared').onchange=renderShared;
$('create-shared').onclick=()=>run(async()=>{
 if(!native||state.job||state.receipt||state.needsRecovery||state.sharedApproval||!$('approve-shared').checked)throw Error('Review and approve shared-record creation first.');
 const shared=await sharedIO();await readTransferBaseline(io);state.sharedApproval={reviewId:state.sharedReview?.id,approved:true};persist();state.sharedReceipt=await executeSharedReview(state.sharedReview,state.sharedApproval,shared);persist();downloadReport();status('Shared-record result retained. The lesson still requires its separate review and save.');
});
$('check-shared').onclick=()=>run(async()=>{if(!native||state.job||state.receipt||state.needsRecovery||!state.sharedApproval)throw Error('No shared-record run is available for recheck.');state.sharedReceipt=await executeSharedReview(state.sharedReview,state.sharedApproval,await sharedIO(),{readOnly:true});persist();status('Shared records rechecked. No creation or lesson-save request was sent.');});
$('continue-shared').onclick=()=>run(async()=>{if(!native||state.job||state.receipt||state.needsRecovery)throw Error('Start a fresh restored review first.');state.pkg=await bindSharedRecords(state.pkg,state.sharedReceipt);persist();await prepareReview();});
async function makeIO(){
 let adapter;
 if(native){
  const [{createNativeTransport},{nativeEditorBridge},{readAssignedLesson},{readAssignedLevelUsage,findUnitLevelConflicts}]=await Promise.all([import('../browser-fill/native-transport.mjs'),import('./native-dom-adapter.mjs'),import('../api-companion/read-lesson.mjs'),import('./native-level-usage.mjs')]);
  const destination=clone(state.destination),tabId=state.tabId;
  const transport=func=>createNativeTransport(async encoded=>{
   const tab=await chrome.tabs.get(tabId);if(tab.url!==destination.url||tab.discarded)throw Error('The selected editor moved or was discarded. Reopen and review it again.');
   const [result]=await chrome.scripting.executeScript({target:{tabId},injectImmediately:true,func,args:[encoded]});return result?.result;
  });
  const {withReviewedReload}=await import('../browser-fill/reviewed-reload.mjs');
  const {sharedRecordBridge}=await import('./shared-record-bridge.mjs'),shared=transport(sharedRecordBridge);
  const rawEdit=transport(nativeEditorBridge),edit=withReviewedReload(request=>rawEdit(bound(request)),{tabs:chrome.tabs,tabId,destination}),read=transport(readAssignedLesson),usage=transport(readAssignedLevelUsage);
  const bound=request=>({...request,destination,practiceConfirmed:state.practiceConfirmed===true});
  adapter={sharedBridge:request=>shared(bound(request)),bridge:request=>edit(bound(request)),readSaved:()=>read(bound({action:'read',returnRaw:true})),checkUsage:async review=>{
   const usages=[];for(const level of reviewedLevelGroups(review).flatMap(c=>c.addLevels))usages.push(await usage(bound({action:'read',levelId:level.levelId,name:level.name})));return findUnitLevelConflicts(review,usages);
  }};
 }else adapter=demoAdapter(state.demo,persist);
 const prefix=native?'native-approved-save-':key+'-receipt-';
 return {...adapter,onProgress:status,loadReceipt:async digest=>readTransferRecord(localStorage,prefix+digest),
  persist:async(digest,receipt)=>{if(receipt.kind==='test-link-cleanup-receipt')state.cleanupReceipt=receipt;else state.receipt=receipt;settleVerifiedSaveState();persistRecord(prefix+digest,receipt);persist();},
  checkpoint:async point=>{state.checkpoint=point;state.needsRecovery=point.stage?.restored===false;persist();$('download').disabled=false;},loadCheckpoint:async()=>state.checkpoint};
}
async function run(action,{baseline=false}={}){
 if(busy||startupError||evidenceError){if(baseline)$('baseline-status').textContent=evidenceError||startupError||'Another operation is running. Wait for it to finish.';return;}
 busy=true;baselineReading=baseline;if(baseline)status('Checking practice confirmation and access to the selected editor…');render();
 try{await navigator.locks.request(native?'lesson-studio-native-verification':key,{ifAvailable:true},async lock=>{if(!lock)throw Error('Another run is using this editor. Wait for it to finish.');await action();});}
 catch(error){state.preparationError=error.message;try{persist();}catch{/* Keep the in-memory report available when storage is unavailable. */}status(evidenceError||error.message);if(baseline||state.checkpoint||state.receipt||evidenceError)downloadReport();}
 finally{busy=false;baselineReading=false;render();}
}
$('load-demo').onclick=()=>run(async()=>{
 const source=await(await fetch('fixture.json')).json();state.demo=createDemo(source);state.pkg=state.demo.pkg;state.destination=state.demo.destination;persist();io=await makeIO();status('Demo lesson loaded. Read the synthetic destination to review the four missing links.');
});
$('load-teaching-demo').onclick=()=>run(async()=>{
 const source=await(await fetch('fixture.json')).json();state.demo=createDemo(source,{teaching:true});state.pkg=state.demo.pkg;state.destination=state.demo.destination;persist();io=await makeIO();status('Teaching demo loaded. Prepare the review to inspect teaching text, activity title and timing, plus four missing links.');
});
$('load-structure-demo').onclick=()=>run(async()=>{
 const source=await(await fetch('fixture.json')).json();state.demo=createDemo(source,{teaching:true,structure:true,complete:true});state.pkg=state.demo.pkg;state.destination=state.demo.destination;persist();io=await makeIO();status('Structure demo loaded. Review two new activities, appended sections, a new callout on an existing section, teaching changes, and four total links.');
});
$('load-failure-demo').onclick=()=>run(async()=>{
 if(native)throw Error('Failure simulation is available only in the isolated local demo.');
 const source=await(await fetch('fixture.json')).json();state.demo=createDemo(source,{saveUnchanged:true});state.pkg=state.demo.pkg;state.destination=state.demo.destination;persist();io=await makeIO();status('Failure demo loaded. A simulated HTTP 200 will leave the saved baseline unchanged. Prepare and approve to test verification and no-resend recovery.');
});
$('new-demo').onclick=()=>{const next=new URL(location.href);next.searchParams.delete('run');location.href=next;};
$('package-file').onchange=()=>run(async()=>{
 const file=$('package-file').files[0];if(!file)return;if(file.size>8_000_000)throw Error('Choose a review package smaller than 8 MB.');
 const pkg=JSON.parse(await file.text());const {packageProblems}=await import('./transfer-core.mjs');const problems=packageProblems(pkg);if(problems.length)throw Error(problems.join(' '));
 state.pkg=pkg;delete state.job;delete state.sharedReview;delete state.sharedReceipt;delete state.sharedApproval;$('approve-shared').checked=false;$('package-name').textContent=file.name;persist();if($('practice').checked)await prepareReview();else status('Package loaded. Confirm your practice destination to automatically prepare the review.');
});
$('read-baseline').onclick=()=>run(async()=>{
 if(!native||state.job||state.receipt||state.needsRecovery)throw Error('Start a fresh native transfer run before reading a baseline.');
 state.destination=selectDestination($('destination').value,$('practice').checked);state.practiceConfirmed=true;persist();
 io=await makeIO();await readTransferBaseline(io);delete state.preparationError;persist();downloadReport();
 status('Fresh baseline read. Report download requested; if it did not appear, use Download baseline report below. No staging or save was attempted. Level mappings and unit conflicts have not been checked.');
},{baseline:true});
$('prepare-preservation').onclick=()=>run(async()=>{
 if(state.job||state.receipt||state.needsRecovery)throw Error('Start a fresh run for the preservation test.');
 if(native){state.destination=selectDestination($('destination').value,$('practice').checked);state.practiceConfirmed=true;}else if(!state.demo)throw Error('Load an isolated demo first.');
 io=await makeIO();state.job=await preparePreservationTest(io);state.needsRecovery=false;$('approve').checked=false;persist();status('Preservation review ready. No fields were changed. Review the unchanged lesson, then approve one native save.');
});
async function prepareReview(){
 const ownTab=native?await chrome.tabs.getCurrent():null;
 try{
 if(native){state.destination=selectDestination($('destination').value,$('practice').checked);state.practiceConfirmed=true;const tab=await chrome.tabs.get(state.tabId);if(tab.url!==state.destination.url||tab.discarded)throw Error('Open the exact selected editor in the original tab, then launch this screen from its companion.');await chrome.tabs.update(state.tabId,{active:true});}
 delete state.job;delete state.receipt;$('approve').checked=false;persist();io=await makeIO();
 state.job=await prepareTransfer(state.pkg,io);state.needsRecovery=false;persist();status('Review ready. Original editor restored; nothing saved. Inspect every proposed change before approving.');
 }finally{if(ownTab?.id){try{const editor=await chrome.tabs.get(state.tabId);if(editor.active)await chrome.tabs.update(ownTab.id,{active:true});}catch{}}}
}
$('prepare').onclick=()=>run(prepareReview);
$('practice').onchange=()=>{if($('practice').checked&&state.pkg&&!state.job&&!state.receipt)run(prepareReview);};
$('approve').onchange=render;
$('save').onclick=()=>run(async()=>{
 if(!$('approve').checked||!state.job)throw Error('Review and explicitly approve the displayed changes first.');
 state.job=await approveTransfer(state.job);persist();io??=await makeIO();
 state.receipt=await executeTransfer(state.job,io);persist();if(state.receipt.status==='saved-and-verified'){status('Save verified. Automatically checking retained evidence without resending.');const retained=await io.loadReceipt(await saveRequestDigest(state.job.review));if(!retained?.attempted)throw Error('Saved receipt is unavailable. No second save will be attempted.');state.receipt=await executeTransfer(state.job,io);state.automaticRecheck=true;persist();}if(state.receipt.status==='saved-and-verified'&&reviewedLevelGroups(state.job.review).length){try{await prepareCleanupReview();}catch(error){state.cleanupPreparationError=error.message;persist();}}downloadReport();status(state.receipt.status==='saved-and-verified'?(native?'Save completed, verified, and rechecked without resending. Run report downloaded automatically.':'Demo completed: reviewed changes verified, with unlisted content preserved.'):'Save is not confirmed. No automatic retry will be sent.');
});
$('check').onclick=()=>run(async()=>{
 if(state.cleanupReceipt?.attempted)throw Error('Use the cleanup recheck for the current saved result.');io??=await makeIO();const receipt=await io.loadReceipt(await saveRequestDigest(state.job.review));if(!receipt?.attempted)throw Error('No persisted attempt exists to check.');
 state.receipt=await executeTransfer(state.job,io);persist();status('Saved result checked again. No request was resent.');
});
$('recover').onclick=()=>run(async()=>{
 if(state.receipt?.attempted)throw Error('A save was attempted; only saved readback is available.');io??=await makeIO();
 await recoverNativeLevelCheck(io.bridge,state.checkpoint.stage);state.needsRecovery=false;delete state.job;persist();status('This run’s unsaved changes were restored. Prepare a fresh review.');
});
function downloadReport(){const blob=URL.createObjectURL(new Blob([JSON.stringify({...state,companionVersion:native?chrome.runtime.getManifest().version:null,notice:native?'Private transfer evidence: retain locally.':'SIMULATED DEMO — not live save evidence.'},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=blob;a.download=(native?'reviewed-transfer-':'demo-transfer-')+runId+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(blob),1000);}
$('download').onclick=downloadReport;
$('download-baseline').onclick=downloadReport;
function renderCleanup(){
 const source=state.cleanupSource||state.receipt,review=state.cleanupReview,receipt=state.cleanupReceipt;
 $('prepare-cleanup').disabled=busy||source?.status!=='saved-and-verified'||!!receipt?.attempted;
 $('cleanup-file').disabled=busy||!!receipt?.attempted;
 $('cleanup-review').replaceChildren();
 if(review){el('p','Destination: '+review.baseline.name,$('cleanup-review'));el('p',review.destination.url,$('cleanup-review'));const list=el('ul','',$('cleanup-review'));for(const removal of review.removals)for(const link of removal.links)el('li','Unlink '+link.name+' from '+(removal.section||'teaching section'),list);el('p','Existing content and settings will be preserved. Only these test-created associations are removed.',$('cleanup-review'));}
 if(review&&!receipt?.attempted)el('p',reviewWindow(review).text,$('cleanup-review'));
 $('cleanup-actions').hidden=!review||!!receipt?.attempted;
 $('check-cleanup').hidden=!receipt?.attempted;$('check-cleanup').disabled=busy;
 $('next-transfer').hidden=receipt?.status!=='cleanup-saved-and-verified';
 if(state.cleanupPreparationError&&!review)$('cleanup-status').textContent=state.cleanupPreparationError;
 if(receipt)$('cleanup-status').textContent=receipt.status==='cleanup-saved-and-verified'?(native?'Cleanup saved and verified.':'Simulated cleanup verified. No live lesson was changed.')+' The underlying levels were retained. Recovery report downloaded. '+(state.cleanupSyncNote||''):'Cleanup is not confirmed. Recheck saved data only; do not resend.';
 updateReviewWindow();
}
$('cleanup-file').onchange=()=>run(async()=>{
 const file=$('cleanup-file').files[0];if(!file)return;if(file.size>32000000)throw Error('Cleanup report must be smaller than 32 MB.');const report=JSON.parse(await file.text()),receipt=report.receipt;
 if(receipt?.kind!=='approved-native-save-receipt'||receipt.status!=='saved-and-verified')throw Error('Choose a report from a verified successful test save.');
 state.cleanupSource=receipt;delete state.cleanupReview;delete state.cleanupReceipt;persist();await prepareCleanupReview();
});
async function prepareCleanupReview(){
 const source=state.cleanupSource||state.receipt;if(!source)throw Error('Choose a verified test report first.');
 if(native){const destination=selectDestination($('destination').value,$('practice').checked);if(destination.id!==source.review.destination.id)throw Error('Open the practice lesson that owns these test links before preparing cleanup.');state.destination=destination;state.practiceConfirmed=true;}
 io=await makeIO();state.cleanupReview=await prepareCleanup(source,io);delete state.cleanupPreparationError;delete state.cleanupReceipt;$('approve-cleanup').checked=false;persist();$('cleanup-panel').open=true;$('cleanup-status').textContent='Cleanup review ready. Nothing has been removed.';status('Review the exact test-link removals. Cleanup has not been saved.');
}
$('prepare-cleanup').onclick=()=>run(prepareCleanupReview);
$('approve-cleanup').onchange=updateReviewWindow;
$('save-cleanup').onclick=()=>run(async()=>{
 if(!$('approve-cleanup').checked)throw Error('Approve the displayed cleanup first.');state.cleanupApproval=await approveCleanup(state.cleanupReview);persist();io??=await makeIO();state.cleanupReceipt=await executeCleanup(state.cleanupReview,state.cleanupApproval,io);persist();
 if(state.cleanupReceipt.status==='cleanup-saved-and-verified'){state.cleanupReceipt=await executeCleanup(state.cleanupReview,state.cleanupApproval,io);persist();await synchronizeCleanedEditor();}
 downloadReport();status(state.cleanupReceipt.status==='cleanup-saved-and-verified'?'Test links removed and independently verified. Automatic recheck sent no second cleanup save. Report downloaded.':'Cleanup is not confirmed. No automatic retry will be sent.');
});
$('check-cleanup').onclick=()=>run(async()=>{if(!state.cleanupReceipt?.attempted)throw Error('No cleanup attempt exists.');io??=await makeIO();state.cleanupReceipt=await executeCleanup(state.cleanupReview,state.cleanupApproval,io);persist();downloadReport();status('Cleanup checked without resending.');});
async function synchronizeCleanedEditor(){
 if(!native)return;
 try{const current=await io.bridge({action:'read'});const {canonical}=await import('./transfer-core.mjs');if(canonical(current)!==canonical(state.cleanupReceipt.editorBeforeDispatch)){state.cleanupSyncNote='Editor has outside changes. Preserve them before reopening; automatic refresh was skipped.';persist();return;}await chrome.tabs.reload(state.tabId);state.cleanupSyncNote='Editor refreshed after verified cleanup.';persist();}catch{state.cleanupSyncNote='Saved cleanup is verified. Reopen the editor after preserving any outside edits.';persist();}
}
$('next-transfer').onclick=()=>{const next=new URL(location.href);next.searchParams.delete('run');location.href=next;};

if(native){$('demo-controls').hidden=true;$('native-controls').hidden=false;$('workspace-link').hidden=true;$('mode-note').textContent='Live companion · only use an owned practice lesson. Preparation temporarily stages and restores supported teaching fields and links. Saving requires your separate exact-request approval.';try{const tab=await chrome.tabs.get(state.tabId);$('destination').value=state.destination?.url||tab.url||'';}catch{status('Open this screen from the native companion on your practice editor.');}$('practice').checked=state.practiceConfirmed===true;}
else{$('save').textContent='Approve and simulate save';$('approve').parentElement.lastChild.textContent=' I reviewed these exact changes and approve the simulated save to this demo destination.';}
if(!startupError&&native){try{
 state.storageCompaction={charactersReclaimed:compactLegacyEvidence(localStorage),recordsDeleted:0};
 if(state.job&&!state.receipt){const retained=readTransferRecord(localStorage,'native-approved-save-'+await saveRequestDigest(state.job.review));if(retained?.attempted){state.receipt=retained;state.recoveredDurableAttempt=true;}}
 }catch(error){startupError=error.message;}}
try{if(!startupError){settleVerifiedSaveState();render();if(state.cleanupReceipt?.attempted)status('Cleanup run restored. Recheck cleanup to read the current saved result without resending.');else if(state.receipt)status('Retained run restored. You can check the saved result without sending again.');}}catch{startupError='Saved transfer data is incomplete or incompatible. The original data has been retained. Transfer is paused; preserve this run before recovery.';}
if(startupError){status(startupError);$('status').setAttribute('role','alert');for(const control of document.querySelectorAll('button,input'))control.disabled=true;}
if(native){if(startupError)$('baseline-status').textContent=startupError;else if(!state.job&&!state.receipt&&!state.needsRecovery)$('baseline-status').textContent='Companion '+chrome.runtime.getManifest().version+' · '+(state.preparationError||'Confirm the practice lesson, then read its baseline. No package is needed.');}


if(!startupError){setInterval(()=>{if(!evidenceError){updateReviewWindow();renderShared();}},15000);document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!evidenceError)updateReviewWindow();});}
