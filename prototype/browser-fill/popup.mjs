import {readTransferRecord,writeTransferRecord} from '../dist/transfer-storage.mjs';
import {verificationDestination} from './native-target.mjs';
import {sourcePageExport} from './source-page-export.mjs';
import {unzipOffice,presentationParts} from '../dist/source-imports.mjs';
import {createNativeTransport} from './native-transport.mjs';
import {stageNativeTransferPlan,unsupportedNativeTransferActions} from '../dist/native-transfer-runner.mjs';
import {nativeEditorBridge} from '../dist/native-dom-adapter.mjs';
import {normalizeNativeCapture} from '../dist/transfer-native.mjs';
import {buildTransferPlan,packageProblems,clone,digest,canonical} from '../dist/transfer-core.mjs';
const $=id=>document.getElementById(id);
$('open-transfer').onclick=async()=>{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(tab?.id)await chrome.tabs.create({url:chrome.runtime.getURL('browser-fill/workflow.html')+'#'+tab.id});};
let state={decisions:{},history:[]},plan=null,running=false,controller;
try{state=readTransferRecord(localStorage,'native-scalar-staging-v1')||state;}catch{}
state.decisions??={};state.history??=[];
let storageWarning='';
function notice(message){$('status').textContent=[message,storageWarning].filter(Boolean).join(' ');}
function persist(){try{writeTransferRecord(localStorage,'native-scalar-staging-v1',state);storageWarning='';}catch{storageWarning='Extension storage is unavailable. Download the current evidence before closing this popup.';notice('');}}
function node(tag,text,parent){const element=document.createElement(tag);element.textContent=text;parent.append(element);return element;}
const createEditorTransport=()=>createNativeTransport(async encoded=>{
 const [active]=await chrome.tabs.query({active:true,currentWindow:true});
 if(!active?.id||active.id!==state.tabId)throw Error('Return to the captured editor tab before resuming.');
 const [result]=await chrome.scripting.executeScript({target:{tabId:state.tabId},injectImmediately:true,func:nativeEditorBridge,args:[encoded]});
 return result?.result;
});
let transport=createEditorTransport();
const bridge=request=>transport(request);

async function refresh(){
 plan=null;$('stage').disabled=true;$('resolve-levels').disabled=running||!state.snapshot||!state.pkg||Boolean(state.report?.completed);$('download').disabled=!state.capture;$('plan').replaceChildren();
 $('capture-json').value=state.capture?JSON.stringify(state.capture,null,2):'';
 $('package-json').value=state.pkg?JSON.stringify(state.pkg,null,2):$('package-json').value;
 $('result').textContent=state.report?JSON.stringify(state.report,null,2):'';
 if(!state.snapshot||!state.pkg)return;
 try{
  plan=await buildTransferPlan(state.pkg,state.snapshot,state.decisions);
  const unsupported=unsupportedNativeTransferActions(plan),pending=plan.operations.filter(op=>op.requiresDecision);
  node('h2','Proposed native changes',$('plan'));
  node('p',`${plan.operations.length} actions; ${pending.length} content decisions; ${plan.preserved.length} preserved locations.`,$('plan'));
  const blockers=[...plan.blockers,...unsupported.map(op=>'Not supported by native transfer: '+op.label)];
  if(blockers.length){const list=node('ul','',$('plan'));for(const message of blockers)node('li',message,list);}
  for(const op of plan.operations){
   const card=node('article','',$('plan'));node('h3',op.label,card);node('strong','Current editor',card);node('pre',typeof op.before==='string'?op.before:JSON.stringify(op.before,null,2),card);node('strong','Approved draft',card);node('pre',typeof op.after==='string'?op.after:JSON.stringify(op.after,null,2),card);
   if(op.requiresDecision)for(const [decision,label] of [['keep','Keep current editor'],['replace','Use approved draft']]){const button=node('button',label,card);button.onclick=async()=>{if(running)return;state.decisions[op.id]=decision;delete state.journal;await refresh();persist();};}
  }
  $('stage').disabled=running||blockers.length>0||pending.length>0;
 }catch(error){notice(error.message);}
}
$('capture').onclick=async()=>{
 if(running)return;
 transport=createEditorTransport();
 $('capture').disabled=true;$('stage').disabled=true;
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id)throw Error('Open the assigned sandbox editor first.');
  state.tabId=tab.id;
  const capture=await bridge({action:'read'}),snapshot=normalizeNativeCapture(capture);
  if(state.report)state.history.push({capture:state.capture,report:state.report});
  state.capture=capture;state.snapshot=snapshot;state.decisions={};delete state.journal;delete state.report;
  await refresh();persist();notice(`Read ${snapshot.lesson.title||'the sandbox editor'}. ${snapshot.blockers.length} capture blockers. Saved content has not been changed.`);
 }catch(error){notice(error.message);}finally{$('capture').disabled=false;}
};
$('load-package').onclick=async()=>{
 if(running)return;
 try{
  if(state.report?.completed>0)throw Error('Read / recompare the current editor before loading a different package. Current staged fields will be preserved.');
  const pkg=JSON.parse($('package-json').value);packageProblems(pkg);state.pkg=pkg;state.decisions={};delete state.journal;delete state.report;await refresh();persist();notice('Review package loaded. Resolve all decisions and unsupported actions before staging.');
 }catch(error){notice(error.message);}
};
$('stage').onclick=async()=>{
 if(running||!plan||!state.snapshot)return;
 const limit=Number($('run-limit').value);if(!Number.isInteger(limit)||limit<1||limit>50){notice('Choose from 1 to 50 actions per native run.');return;}
 running=true;controller=new AbortController();$('stage').disabled=true;$('stop').disabled=false;$('capture').disabled=true;$('load-package').disabled=true;
 if(state.report)state.history.push({planId:plan.id,report:clone(state.report)});
 try{
  state.report=await stageNativeTransferPlan(plan,bridge,{journal:state.journal,maxOperations:limit,signal:controller.signal,onProgress:report=>{state.report=report;state.journal=report.journal;persist();$('result').textContent=JSON.stringify(report,null,2);}});
  state.journal=state.report.journal;persist();notice('Native run '+state.report.status+'. No remote save was performed.');
 }catch(error){state.report={...(state.report||{}),status:'blocked',reason:error.message,saved:false};persist();notice(error.message);}
 finally{running=false;$('stop').disabled=true;$('capture').disabled=false;$('load-package').disabled=false;await refresh();}
};
$('stop').onclick=()=>controller?.abort();
$('download').onclick=()=>{
 if(!state.capture)return;
 const evidence={schemaVersion:1,kind:'native-scalar-staging-evidence',capture:state.capture,snapshot:state.snapshot,plan,report:state.report||null,journal:state.journal||null,pkg:state.pkg||null,history:state.history,verification:state.verification||null,saved:false};
 const url=URL.createObjectURL(new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='native-scalar-staging-evidence.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
await refresh();

try{
 const revision=(await(await fetch(chrome.runtime.getURL('browser-fill/automation-revision.json'),{cache:'no-store'})).json()).revision;
 if(revision.startsWith('approved-save-')){
  $('verify').textContent='Complete approved four-link save';
  const explanation=$('verify').parentElement.nextElementSibling;
  explanation.textContent='Completes the four-link playground save already approved in chat, preserves a restore point, then verifies the saved lesson. A prior save attempt is checked without sending it again.';
  document.querySelector('.warning').textContent='The four-link save is explicitly approved for Julian Playground. Other staging controls still make unsaved changes only. Official lessons are refused.';
 }
}catch{/* Ordinary unsaved tools remain available without a local save job. */}


$('verify').onclick=async()=>{
 if(running)return;running=true;$('verify').disabled=true;notice('Checking the selected playground and opening the automatic check…');
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id)throw Error('Open the playground editor first.');
  const destination=verificationDestination(tab.url);
  const existing=Number(localStorage.getItem('native-verification-controller-tab'));
  if(Number.isInteger(existing)&&existing>0){
   let controller;try{controller=await chrome.tabs.get(existing);}catch{localStorage.removeItem('native-verification-controller-tab');localStorage.removeItem('native-verification-owner');}
   if(controller){const token=new URL(controller.url).hash.slice(1),run=JSON.parse(localStorage.getItem('native-verification-run-'+token)||'null');
    if(run?.tabId!==tab.id)throw Error('An earlier verification tab belongs to another lesson. Preserve its report and close that verification tab before starting here.');
    await chrome.tabs.update(existing,{active:true});notice('The existing check is open. Inspect its status; it was not restarted.');return;
   }
  }
  state.tabId=tab.id;transport=createEditorTransport();
  const capture=await bridge({action:'read',...(destination?{destination,practiceConfirmed:true}:{})});
  if(capture.blockers.length)throw Error(capture.blockers.join(' '));
  const token=crypto.randomUUID();localStorage.setItem('native-verification-run-'+token,JSON.stringify({tabId:tab.id,destination,createdAt:Date.now()}));
  await chrome.tabs.create({url:chrome.runtime.getURL('browser-fill/verification.html')+'#'+token});notice('Automatic verification opened in its own tab. The popup can close.');
 }catch(error){notice(error.message);}finally{running=false;$('verify').disabled=false;}
};

$('resolve-levels').onclick=async()=>{
 if(running||!state.snapshot||!state.pkg)return;
 running=true;$('resolve-levels').disabled=true;$('stage').disabled=true;
 try{
  if(state.report?.completed>0)throw Error('Read / recompare the current editor before verifying a new set of mappings.');
  const names=[...new Set(state.pkg.lesson.sections.flatMap(section=>(section.progression?.levels||[]).map(level=>level.key)))],mappings=[];
  for(const name of names){
   const lookup=await bridge({action:'lookup-levels',names:[name],expectedCaptureDigest:await digest(state.capture)});
   if(lookup.kind!=='native-level-mappings'||canonical(lookup.capture)!==canonical(state.capture))throw Error('Level lookup changed or failed to preserve the captured editor.');
   mappings.push(...lookup.mappings);notice('Verified '+mappings.length+' of '+names.length+' existing levels.');
  }
  for(const mapping of mappings)if(!state.snapshot.catalog.levels.some(level=>level.key===mapping.key))state.snapshot.catalog.levels.push(mapping);
  delete state.journal;persist();notice('Existing level mappings verified. Review all proposed changes before staging.');
 }catch(error){notice(error.message);}finally{running=false;await refresh();}
};

$('open-workspace').onclick=()=>chrome.tabs.create({url:chrome.runtime.getURL('dist/index.html')});
$('import-deck').onclick=async()=>{
 if(running)return;running=true;$('import-deck').disabled=true;notice('Exporting the selected Google Slides deck and speaker notes…');
 try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id)throw Error('Open the Google Slides deck first.');
 const [response]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:sourcePageExport,args:[tab.url]});const result=response?.result;
 if(result?.kind!=='google-slides-export')throw Error('No presentation export was returned.');
 const bytes=Uint8Array.from(atob(result.base64),c=>c.charCodeAt(0)),parsed=presentationParts(await unzipOffice(bytes),result.name);parsed.deckUrl=result.deckUrl;
 const id=crypto.randomUUID();localStorage.setItem('lesson-studio-pending-source-'+id,JSON.stringify(parsed));
 await chrome.tabs.create({url:chrome.runtime.getURL('dist/index.html')+'?sourceImport='+id});notice('Speaker notes imported. Review them in the lesson workspace. No source content was changed.');
 }catch(error){notice(error.message);}finally{running=false;$('import-deck').disabled=false;}
};
