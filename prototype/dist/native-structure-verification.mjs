import {clone,canonical,digest,readPath,applyOperation} from './transfer-core.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';
import {stageNativeTransferPlan} from './native-transfer-runner.mjs';

export async function recoverEmptyNativeSection(bridge,previous){
 const initial=previous?.initialCapture;
 if(!initial)throw Error('The original structural capture is missing.');
 const current=await bridge({action:'read'}),count=initial.live.activities[0]?.activitySections.length;
 const sections=current.live.activities[0]?.activitySections;
 if(!count||sections?.length!==count+1)throw Error('Recovery does not recognize a single appended section.');
 const section=sections[count],normalized=normalizeNativeCapture(current).lesson.activities[0].sections[count];
 if(!/^activitySection-/.test(section.key||'')||normalized.title||normalized.body||normalized.remarks||normalized.callouts.length||normalized.progression||![null,0].includes(normalized.duration))throw Error('The appended section is not an untouched native default; recovery will not delete its content.');
 const compare=clone(current);compare.live.activities[0].activitySections.pop();compare.protection.unmanagedActivities[0].activitySections.pop();
 if(canonical(compare)!==canonical(initial))throw Error('Outside edits prevent temporary section recovery.');
 const finalCapture=await bridge({action:'remove-created-section',mode:'unsaved-structure-staging',operation:{path:['activities',0,'sections',count],createdKey:section.key},expectedCaptureDigest:await digest(current)});
 if(canonical(finalCapture)!==canonical(initial))throw Error('Original structural capture did not match after recovery.');
 return {status:'restored',restored:true,saved:false,initialCapture:current,finalCapture};
}

export async function recoverNativeStructureCheck(bridge,previous){
 const initial=previous?.initialCapture;
 if(!initial||!previous.plan)throw Error('Structural recovery evidence is missing.');
 const current=await bridge({action:'read'});
 if(canonical(current)===canonical(initial))return {status:'restored',restored:true,saved:false,finalCapture:current};
 const index=initial.live.activities[0]?.activitySections.length,sections=current.live.activities[0]?.activitySections;
 if(!index||sections?.length!==index+1)throw Error('Structural recovery cannot recognize the appended test section.');
 const section=sections[index];
 if(!/^activitySection-/.test(section.key||'')||previous.createdKey&&section.key!==previous.createdKey)throw Error('The generated test section identity does not match.');
 const projection=clone(current);projection.live.activities[0].activitySections.pop();projection.protection.unmanagedActivities[0].activitySections.pop();
 if(canonical(projection)!==canonical(initial))throw Error('Outside edits prevent structural test recovery.');
 const expected=clone(normalizeNativeCapture(initial).lesson),known=[];
 for(const op of previous.plan.operations){applyOperation(expected,op);known.push(canonical(expected));}
 if(!known.includes(canonical(normalizeNativeCapture(current).lesson)))throw Error('The test section contains content outside known verification checkpoints.');
 const finalCapture=await bridge({action:'remove-created-section',mode:'unsaved-structure-staging',operation:{path:['activities',0,'sections',index],createdKey:section.key},expectedCaptureDigest:await digest(current)});
 if(canonical(finalCapture)!==canonical(initial))throw Error('Original structural state did not match after recovery.');
 return {status:'restored',restored:true,saved:false,initialCapture:current,finalCapture};
}


export async function buildNativeStructureCheckPlan(snapshot){
 const index=snapshot.lesson.activities[0]?.sections.length;if(!index)throw Error('The structural check needs an activity with an existing section.');
 const expected=clone(snapshot.lesson),operations=[];
 const add=async(path,after,label,kind='set')=>{const op={kind,path,before:clone(readPath(expected,path)),after:clone(after),label,requiresDecision:false};op.id=await digest(op);operations.push(op);applyOperation(expected,op);};
 await add(['activities',0,'sections'],{title:'',duration:null,body:'',remarks:false,callouts:[],progression:null},'Add temporary native section','append');
 for(const [key,value] of Object.entries({title:'Unsaved automatic section check',body:'Temporary native structural verification. This section will be removed automatically.',duration:1,remarks:true}))await add(['activities',0,'sections',index,key],value,'Temporary section / '+key);
 for(const type of ['Teaching Tip','Content Corner','Discussion Goal','Assessment Opportunity','Ethics Opportunity'])await add(['activities',0,'sections',index,'callouts'],{type,body:'Unsaved automatic '+type+' verification.'},'Temporary '+type,'append');
 const plan={schemaVersion:1,kind:'browser-transfer-plan',engineeringFixture:true,destination:clone(snapshot.destination),packageDigest:await digest({purpose:'user-authorized-temporary-native-structure-check',operations}),destinationDigest:await digest(snapshot),operations,preserved:[],blockers:[],originalSnapshot:clone(snapshot),expectedLesson:expected,remoteWrites:false,saveAllowed:false};plan.id=await digest(plan);return plan;
}

export async function runNativeStructureVerification(bridge,{onProgress=()=>{},onCheckpoint=()=>{}}={}){
 const result={schemaVersion:1,kind:'native-structure-verification',saved:false,remoteWrites:false,restored:false,callouts:[],reports:[]};
 let last,initial,sectionIndex,createdKey;
 try{
  initial=await bridge({action:'read'});const baseline=normalizeNativeCapture(initial);
  if(baseline.blockers.length)throw Error(baseline.blockers.join(' '));
  sectionIndex=baseline.lesson.activities[0]?.sections.length;
  result.initialCapture=clone(initial);last=initial;
  const plan=await buildNativeStructureCheckPlan(baseline);result.plan=plan;
  await onCheckpoint(clone({...result,status:'running'}));
  onProgress('Adding one temporary native section through the reviewed transfer runner.');
  const first=await stageNativeTransferPlan(plan,bridge,{maxOperations:1});result.reports.push(first);
  if(first.status!=='interrupted'||first.completed!==1)throw Error(first.reason||'The first structural checkpoint failed.');
  last=first.journal.capture;createdKey=last.live.activities[0].activitySections[sectionIndex].key;result.createdKey=createdKey;
  const resumed=await stageNativeTransferPlan(plan,bridge,{journal:first.journal,onProgress:report=>{last=report.journal.capture;onProgress('Verified '+report.completed+' of '+report.total+' section and callout actions.');}});result.reports.push(resumed);
  if(resumed.status!=='staged-unsaved')throw Error(resumed.reason||'Native structural resume failed.');
  last=resumed.journal.capture;
  const rerun=await stageNativeTransferPlan(plan,bridge,{journal:resumed.journal});result.reports.push(rerun);
  if(rerun.status!=='staged-unsaved'||rerun.items.some(item=>item.status!=='already-present'))throw Error('Native structural rerun did not recognize its existing changes.');
  result.callouts=normalizeNativeCapture(last).lesson.activities[0].sections[sectionIndex].callouts.map(c=>c.type);result.checksPassed=true;
 }catch(error){result.error=error.message;if(error.nativeCapture){result.errorCapture=error.nativeCapture;if(initial&&canonical(initial)===canonical(error.nativeCapture))result.restored=true;}result.checksPassed=false;}
 if(initial&&last&&createdKey){
  try{
   onProgress('Removing the temporary section and its callouts.');
   const fresh=await bridge({action:'read'});
   if(canonical(fresh)!==canonical(last))throw Error('Outside edits detected; temporary section cleanup was stopped.');
   result.finalCapture=await bridge({action:'remove-created-section',mode:'unsaved-structure-staging',operation:{path:['activities',0,'sections',sectionIndex],createdKey},expectedCaptureDigest:await digest(fresh)});
   result.restored=canonical(result.finalCapture)===canonical(initial);
   if(!result.restored)throw Error('Complete original native capture did not match after cleanup.');
  }catch(error){result.restorationError=error.message;}
 }else if(initial){
  try{const fresh=await bridge({action:'read'});result.errorCapture=fresh;result.restored=canonical(fresh)===canonical(initial);}catch{}
 }
 result.status=result.checksPassed&&result.restored?'passed-and-restored':'blocked';return result;
}
