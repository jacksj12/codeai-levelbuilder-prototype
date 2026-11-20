import {clone,digest,validatePlan} from './transfer-core.mjs';
import {applyOperation} from './transfer-core.mjs';

// Native writes are restricted to the reviewed scalar subset. No save adapter exists.
export async function stagePlan(plan,driver,{journal=null,maxOperations=250,signal,onProgress=()=>{}}={}){
 await validatePlan(plan);
 if(driver.mode==='native-unsaved-scalars'){
  if(typeof driver.preflight!=='function')throw Error('Native staging requires its capability preflight.');
  await driver.preflight(plan);
 }else if(driver.mode!=='local-dom-rehearsal')throw Error('Native staging is disabled for this adapter.');
 if(!Number.isInteger(maxOperations)||maxOperations<1||maxOperations>500)throw Error('Choose an operation limit from 1 to 500.');
 if(journal&&journal.planId!==plan.id)throw Error('This recovery record belongs to a different plan. Rebuild the comparison.');
 const states=[clone(plan.originalSnapshot)],fingerprints=[await digest(states[0])];
 for(const op of plan.operations){const next=clone(states.at(-1));applyOperation(next.lesson,op);states.push(next);fingerprints.push(await digest(next));}
 if(await digest(states.at(-1).lesson)!==await digest(plan.expectedLesson))throw Error('The plan does not reconstruct its expected result.');
 const current=await driver.read(),fingerprint=await digest(current),start=fingerprints.indexOf(fingerprint);
 if(start<0)throw Error('The destination changed outside this plan. Nothing was filled. Rebuild the comparison.');
 if(journal&&journal.completed>start)throw Error('The editor lost previously staged content. Rebuild the comparison rather than replaying blindly.');
 const result={schemaVersion:1,planId:plan.id,status:'interrupted',remoteWrites:false,saved:false,completed:start,total:plan.operations.length,
  recovered:start>(journal?.completed||0),items:plan.operations.map((op,index)=>({label:op.label,status:index<start?'already-present':'pending'})),
  preserved:clone(plan.preserved),nextLocation:plan.operations[start]?.label||null};
 let performed=0;
 for(let index=start;index<plan.operations.length;index++){
  if(signal?.aborted||performed>=maxOperations)break;
  const op=plan.operations[index];
  // Re-read everything before each action, including settings and mappings outside the edited fields.
  if(await digest(await driver.read())!==fingerprints[index]){result.status='blocked';result.reason='The destination changed during staging. No further actions were taken.';break;}
  try{
   await driver.apply(op);
   if(await digest(await driver.read())!==fingerprints[index+1])throw Error('Readback differs from the planned value.');
  }catch(error){result.status='blocked';result.reason=op.label+': '+error.message;break;}
  result.completed=index+1;performed++;result.items[index].status='filled';result.nextLocation=plan.operations[index+1]?.label||null;
  await onProgress(clone(result));
 }
 if(result.completed===plan.operations.length){result.status='staged-unsaved';result.nextLocation=null;}
 result.journal={schemaVersion:1,planId:plan.id,completed:result.completed};
 return result;
}
