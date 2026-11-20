import {clone,canonical,digest,readPath,applyOperation,TEXT_FIELDS} from './transfer-core.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';
import {makeNativeScalarDriver,unsupportedNativeActions} from './native-dom-adapter.mjs';
import {stagePlan} from './transfer-runner.mjs';

// Explicit reversible engineering assignments; never curriculum approval.
export async function verificationPlan(snapshot,assignments){
 const working=clone(snapshot.lesson),operations=[];
 for(const {path,after} of assignments){
  const before=clone(readPath(working,path));
  if(before===undefined)throw Error('The verification target is missing.');
  if(canonical(before)===canonical(after))continue;
  const op={kind:'set',path:clone(path),before,after:clone(after),label:'Verification / '+path.join(' / '),requiresDecision:false};
  op.id=await digest(op);operations.push(op);applyOperation(working,op);
 }
 const plan={schemaVersion:1,kind:'browser-transfer-plan',engineeringFixture:true,destination:clone(snapshot.destination),packageDigest:await digest({purpose:'temporary-unsaved-verification',assignments}),destinationDigest:await digest(snapshot),operations,preserved:[],blockers:[],originalSnapshot:clone(snapshot),expectedLesson:working,remoteWrites:false,saveAllowed:false};
 if(unsupportedNativeActions(plan).length)throw Error('Verification contains an unsupported native action.');
 plan.id=await digest(plan);return plan;
}
function checked(capture){const snapshot=normalizeNativeCapture(capture);if(snapshot.blockers.length)throw Error(snapshot.blockers.join(' '));return snapshot;}
function changedMinutes(value){
 if(value!==null&&(!Number.isInteger(value)||value<0||value>10000))throw Error('Timing is unsuitable for bounded verification.');
 return (value??0)+1;
}
export async function recoverNativeVerification(bridge,previous){
 if(!previous?.plan||!previous.initialCapture)throw Error('Recovery evidence is missing.');
 const initial=checked(previous.initialCapture),capture=await bridge({action:'read'}),current=checked(capture);
 const prefix=clone(initial.lesson),known=[canonical(prefix)];
 for(const op of previous.plan.operations){applyOperation(prefix,op);known.push(canonical(prefix));}
 if(canonical(current.nativeProtection)!==canonical(initial.nativeProtection)||!known.includes(canonical(current.lesson)))throw Error('Recovery stopped: current content includes edits outside the verification checkpoints.');
 const plan=await verificationPlan(current,previous.plan.operations.map(op=>({path:op.path,after:op.before})).reverse());
 const report=await stagePlan(plan,makeNativeScalarDriver(current,bridge));
 const finalCapture=await bridge({action:'read'}),final=checked(finalCapture);
 const restored=canonical(final.lesson)===canonical(initial.lesson)&&canonical(final.nativeProtection)===canonical(initial.nativeProtection);
 if(!restored)throw Error(report.reason||'Recovery did not restore the original values.');
 return {status:'restored',report,initialCapture:capture,finalCapture,restored:true,saved:false};
}
export async function runNativeVerification(bridge,{onProgress=()=>{},onCheckpoint=()=>{},suite='all-existing-fields'}={}){
 const evidence={schemaVersion:1,kind:'native-automated-verification',suite,saved:false,remoteWrites:false,reports:[],restored:false,skipped:[]};
 let initial,plan;
 try{
  evidence.initialCapture=await bridge({action:'read'});initial=checked(evidence.initialCapture);
  if(!initial.lesson.activities.length)throw Error('Verification needs an existing activity.');
  if(!['all-existing-fields','title-and-timing'].includes(suite))throw Error('Unknown verification suite.');
  const assignments=[{path:['title'],after:initial.lesson.title+' [unsaved automated check]'},{path:['activities',0,'duration'],after:changedMinutes(initial.lesson.activities[0].duration)}];
  if(suite==='all-existing-fields'){
   const section=initial.lesson.activities[0].sections[0];if(!section)throw Error('The complete field check needs an existing section.');
   // Probe section timing before the rest of the suite so native failures stop early.
   if(section.duration===0)evidence.skipped.push('Section duration: literal zero cannot be restored by this adapter.');
   else assignments.push({path:['activities',0,'sections',0,'duration'],after:changedMinutes(section.duration)});
   assignments.push(...TEXT_FIELDS.map(key=>({path:['frontMatter',key],after:initial.lesson.frontMatter[key]+'\n\nUnsaved automatic verification.'})),{path:['activities',0,'title'],after:initial.lesson.activities[0].title+' [unsaved automated check]'},...['title','body'].map(key=>({path:['activities',0,'sections',0,key],after:section[key]+(key==='title'?' [unsaved automated check]':'\nUnsaved automatic verification.')})),{path:['activities',0,'sections',0,'remarks'],after:!section.remarks});
  }
  plan=await verificationPlan(initial,assignments);evidence.plan=plan;evidence.fields=plan.operations.map(op=>op.path);
  await onCheckpoint(clone({...evidence,status:'running'}));
  const driver=makeNativeScalarDriver(initial,bridge);
  const first=await stagePlan(plan,driver,{maxOperations:1});evidence.reports.push(first);
  if(first.status!=='interrupted'||first.completed!==1)throw Error(first.reason||'Bounded first step failed.');
  onProgress('First field verified; automatically resuming the remaining fields.');
  const resumed=await stagePlan(plan,driver,{journal:first.journal,onProgress:report=>onProgress('Verified '+report.completed+' of '+report.total+' temporary fields.')});evidence.reports.push(resumed);
  if(resumed.status!=='staged-unsaved')throw Error(resumed.reason||'Resume failed.');
  const rerun=await stagePlan(plan,driver,{journal:resumed.journal});evidence.reports.push(rerun);
  if(rerun.status!=='staged-unsaved'||rerun.items.some(item=>item.status!=='already-present'))throw Error('The repeat run did not recognize existing changes.');
  evidence.checksPassed=true;
 }catch(error){evidence.error=error.message;evidence.checksPassed=false;}
 // Only restore recognized checkpoints: outside edits are never overwritten.
 if(initial&&plan){
  try{
   onProgress('Restoring all original field values.');
   const current=checked(await bridge({action:'read'})),prefix=clone(initial.lesson),known=[canonical(prefix)];evidence.cleanupCapture=clone(current.raw);
   for(const op of plan.operations){applyOperation(prefix,op);known.push(canonical(prefix));}
   if(canonical(current.nativeProtection)!==canonical(initial.nativeProtection)||!known.includes(canonical(current.lesson)))throw Error('Outside changes detected. Automatic restoration was stopped to preserve them.');
   const restore=await verificationPlan(current,plan.operations.map(op=>({path:op.path,after:op.before})).reverse());
   evidence.restoration=await stagePlan(restore,makeNativeScalarDriver(current,bridge));
   evidence.finalCapture=await bridge({action:'read'});const final=checked(evidence.finalCapture);
   evidence.restored=canonical(final.lesson)===canonical(initial.lesson)&&canonical(final.nativeProtection)===canonical(initial.nativeProtection);
   if(!evidence.restored)throw Error('Original values could not be confirmed.');
  }catch(error){evidence.restorationError=error.message;}
 }
 evidence.status=evidence.checksPassed&&evidence.restored?'passed-and-restored':'blocked';return evidence;
}
