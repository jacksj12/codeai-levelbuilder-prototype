import {sharedKind,sharedAppendValid} from './reviewed-shared.mjs';
import {isObjectiveAppend} from './reviewed-objectives.mjs';
import {savedFieldPath,restoreFieldProtection} from './reviewed-fields.mjs';
import {clone,canonical,digest,validatePlan,applyOperation} from './transfer-core.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';
import {unsupportedNativeActions} from './native-dom-adapter.mjs';

const emptySection={title:'',duration:null,body:'',remarks:false,callouts:[],progression:null};
const calloutTypes=['Teaching Tip','Content Corner','Discussion Goal','Assessment Opportunity','Ethics Opportunity'];
export function unsupportedNativeTransferActions(plan){
 return plan.operations.filter(op=>{
  if(!unsupportedNativeActions({operations:[op]}).length)return false;
  if(sharedKind(op))return !sharedAppendValid(op);
  if(isObjectiveAppend(op))return !Array.isArray(op.before)||typeof op.after!=='string'||!op.after.trim()||op.after.length>100000;
  const p=op.path;
  if(op.kind==='append'&&p.length===1&&p[0]==='activities')return canonical(op.after)!==canonical({title:'',duration:null,sections:[emptySection]});
  if(op.kind==='set'&&p.length===5&&p[0]==='activities'&&Number.isInteger(p[1])&&p[1]>=0&&p[2]==='sections'&&Number.isInteger(p[3])&&p[3]>=0&&p[4]==='progression'){
   const group=op.after;return op.before!==null||typeof group?.title!=='string'||!Array.isArray(group.levels)||!group.levels.length||group.levels.length>8||new Set(group.levels.map(l=>l.key)).size!==group.levels.length||group.levels.some(l=>typeof l.key!=='string'||!l.key.trim()||typeof l.assessment!=='boolean'||!Number.isInteger(l.number)||l.number<1);
  }
  if(op.kind!=='append'||!Array.isArray(op.before)||p[0]!=='activities'||!Number.isInteger(p[1])||p[1]<0||p[2]!=='sections')return true;
  if(p.length===3)return canonical(op.after)!==canonical(emptySection);
  if(p.length===5&&Number.isInteger(p[3])&&p[3]>=0&&p[4]==='callouts')return !calloutTypes.includes(op.after?.type)||typeof op.after.body!=='string'||!op.after.body.trim()||op.after.body.length>100000;
  return true;
 });
}
function snapshot(capture){
 const value=normalizeNativeCapture(capture);
 if(value.blockers.length)throw Error(value.blockers.join(' '));
 if(capture.readerVersion!=='native-scalars-v1'||!value.nativeProtection)throw Error('Capture with the current native companion first.');
 return value;
}
function preserved(before,after,op){
 const protection=clone(after.nativeProtection),p=op.path;restoreFieldProtection(protection,before.nativeProtection,savedFieldPath(op));
 if(op.kind==='append'){
  const activity=protection.unmanagedActivities[p[1]];
  if(sharedKind(op))protection[sharedKind(op)].pop();
  else if(isObjectiveAppend(op))protection.objectives.pop();
  else if(p.length===1)protection.unmanagedActivities.pop();
  else if(p.length===3)activity.activitySections.pop();
  else activity.activitySections[p[3]].tips.pop();
 }else if(p.at(-1)==='progression'){
  const section=protection.unmanagedActivities[p[1]].activitySections[p[3]],original=before.nativeProtection.unmanagedActivities[p[1]].activitySections[p[3]];
  section.scriptLevels=clone(original.scriptLevels);if(Object.prototype.hasOwnProperty.call(original,'progressionName'))section.progressionName=original.progressionName;else delete section.progressionName;
 }
 return canonical(protection)===canonical(before.nativeProtection);
}

// Runs reviewed existing fields and append-only sections/callouts. Generated
// native identities are checkpointed from readback, never copied from source.
export async function stageNativeTransferPlan(plan,bridge,{journal=null,maxOperations=10,signal,onProgress=()=>{}}={}){
 await validatePlan(plan);
 const unsupported=unsupportedNativeTransferActions(plan);
 if(unsupported.length)throw Error('This native transfer cannot fill: '+unsupported.map(op=>op.label).join('; ')+'. No fields were changed.');
 if(!Number.isInteger(maxOperations)||maxOperations<1||maxOperations>500)throw Error('Choose from 1 to 500 actions.');
 snapshot(plan.originalSnapshot.raw);
 const completed=journal?.completed??0;
 if(!Number.isInteger(completed)||completed<0||completed>plan.operations.length||journal&&(journal.planId!==plan.id||!journal.capture))throw Error('The native checkpoint does not belong to this reviewed plan.');
 let capture=await bridge({action:'read'}),current=snapshot(capture);
 const checkpoint=journal?.capture||plan.originalSnapshot.raw;
 if(canonical(capture)!==canonical(checkpoint))throw Error('The editor changed or lost unsaved progress. Read / recompare before continuing; no actions were replayed.');
 const expected=clone(plan.originalSnapshot.lesson);
 for(const op of plan.operations.slice(0,completed))applyOperation(expected,op);
 if(canonical(current.lesson)!==canonical(expected))throw Error('The native checkpoint does not match its reviewed content.');
 const result={schemaVersion:1,kind:'native-transfer-report',planId:plan.id,status:'interrupted',completed,total:plan.operations.length,saved:false,remoteWrites:false,
  preserved:clone(plan.preserved),items:plan.operations.map((op,index)=>({label:op.label,status:index<completed?'already-present':'pending'}))};
 const checkpointReport=()=>{result.journal={schemaVersion:1,planId:plan.id,completed:result.completed,capture:clone(capture)};result.nextLocation=plan.operations[result.completed]?.label||null;};
 checkpointReport();let performed=0;
 for(let index=completed;index<plan.operations.length;index++){
  if(signal?.aborted||performed>=maxOperations)break;
  const op=plan.operations[index],before=current;
  const fresh=await bridge({action:'read'});
  if(canonical(fresh)!==canonical(capture)){result.status='blocked';result.reason='Outside changes detected. No further actions were taken.';break;}
  applyOperation(expected,op);
  const action=sharedKind(op)?'append-shared-association':isObjectiveAppend(op)?'append-objective':op.kind==='set'?(op.path.at(-1)==='progression'?'append-progression':'set-scalar'):op.path.length===1?'append-activity':op.path.length===3?'append-section':'append-callout';
  let nextCapture;
  try{
   nextCapture=await bridge({action,mode:action==='append-progression'?'unsaved-level-staging':op.kind==='set'?'unsaved-scalar-staging':'unsaved-structure-staging',operation:op,expectedCaptureDigest:await digest(capture)});
  }catch(error){
   // Lost acknowledgement is recoverable only if the entire planned next
   // checkpoint, including preserved native evidence, can be established.
   try{const observed=await bridge({action:'read'}),next=snapshot(observed);if(canonical(next.lesson)===canonical(expected)&&preserved(before,next,op)){nextCapture=observed;result.recovered=true;}}catch{}
   if(!nextCapture){result.status='blocked';result.reason=op.label+': '+error.message;if(error.nativeCapture)result.unverifiedCapture=error.nativeCapture;break;}
  }
  const next=snapshot(nextCapture);
  if(canonical(next.lesson)!==canonical(expected)||!preserved(before,next,op)){
   result.status='blocked';result.reason=op.label+': native readback or preserved evidence differs from the reviewed action.';result.unverifiedCapture=nextCapture;break;
  }
  capture=nextCapture;current=next;result.completed=index+1;performed++;result.items[index].status='filled';checkpointReport();await onProgress(clone(result));
 }
 if(result.completed===plan.operations.length)result.status='staged-unsaved';
 checkpointReport();return result;
}
