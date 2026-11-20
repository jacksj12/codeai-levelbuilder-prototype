import {clone,canonical,digest,buildTransferPlan,packageProblems,readPath} from './transfer-core.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';
import {stageNativeTransferPlan,unsupportedNativeTransferActions} from './native-transfer-runner.mjs';

export async function recoverNativeLevelCheck(bridge,previous){
 if(!previous?.initialCapture||!previous.plan)throw Error('The original level rehearsal checkpoint is missing.');
 const initial=previous.initialCapture;let current=await bridge({action:'read'});
 const operations=previous.plan.operations.filter(op=>op.path.at(-1)==='progression');
 if(previous.stagedCapture){
  const checkpoint=clone(previous.stagedCapture),known=[canonical(checkpoint)];
  for(const op of [...operations].reverse()){
   const [,ai,,si]=op.path;
   for(const root of ['live','protection']){
    const activities=root==='live'?checkpoint.live.activities:checkpoint.protection.unmanagedActivities;
    const original=root==='live'?initial.live.activities:initial.protection.unmanagedActivities;
    activities[ai].activitySections[si].scriptLevels=clone(original[ai].activitySections[si].scriptLevels);
    activities[ai].activitySections[si].progressionName=original[ai].activitySections[si].progressionName;
   }
   known.push(canonical(checkpoint));
  }
  if(!known.includes(canonical(current)))throw Error('Outside changes prevent automatic cleanup of the staged level links.');
 }
 const projection=clone(current);
 for(const op of operations){
  const [,ai,,si]=op.path,section=current.live.activities[ai].activitySections[si],original=initial.live.activities[ai].activitySections[si];
  const actual=(section.scriptLevels||[]).map(sl=>({key:sl.levels?.length===1?sl.levels[0].name:null,assessment:Boolean(sl.assessment)}));
  if(actual.length>op.after.levels.length||actual.some((l,i)=>l.key!==op.after.levels[i].key||l.assessment!==op.after.levels[i].assessment&&!(i===actual.length-1&&l.assessment===false)))throw Error('Outside level changes prevent automatic rehearsal cleanup.');
  for(const object of [projection.live.activities[ai].activitySections[si],projection.protection.unmanagedActivities[ai].activitySections[si]]){object.scriptLevels=clone(original.scriptLevels);object.progressionName=original.progressionName;}
 }
 if(canonical(projection)!==canonical(initial))throw Error('Outside changes prevent level rehearsal cleanup.');
 for(const op of [...operations].reverse()){
  const [,ai,,si]=op.path,section=current.live.activities[ai].activitySections[si];if(!section.scriptLevels.length)continue;
  const fresh=await bridge({action:'read'});if(canonical(fresh)!==canonical(current))throw Error('Outside edits detected during level cleanup.');
  current=await bridge({action:'clear-owned-progression',mode:'unsaved-level-staging',expectedCaptureDigest:await digest(current),operation:{path:op.path,expectedLevels:section.scriptLevels.map(sl=>({key:sl.levels[0].name,assessment:Boolean(sl.assessment)})),restoreProgressionName:initial.live.activities[ai].activitySections[si].progressionName||''}});
 }
 if(canonical(current)!==canonical(initial))throw Error('Original native capture did not match after level cleanup.');
 return {status:'restored',restored:true,saved:false,finalCapture:current};
}

export async function runAcceptedNativeRehearsal(bridge,pkg,{onProgress=()=>{},onCheckpoint=()=>{},leaveStaged=false}={}){
 const result={schemaVersion:1,kind:'accepted-native-rehearsal',saved:false,remoteWrites:false,restored:false,reports:[]};
 try{
  const problems=packageProblems(pkg);if(problems.length)throw Error(problems.join(' '));
  result.initialCapture=await bridge({action:'read'});const original=normalizeNativeCapture(result.initialCapture);if(original.blockers.length)throw Error(original.blockers.join(' '));
  const names=[...new Set(pkg.lesson.sections.flatMap(s=>(s.progression?.levels||[]).map(l=>l.key)))];
  onProgress('Verifying the approved level names through the native existing-level picker.');
  result.mappings=[];
  for(const name of names){
   const lookup=await bridge({action:'lookup-levels',names:[name],expectedCaptureDigest:await digest(result.initialCapture)});
   if(lookup.kind!=='native-level-mappings'||canonical(lookup.capture)!==canonical(result.initialCapture))throw Error('Existing-level lookup did not preserve the original editor.');
   result.mappings.push(...lookup.mappings);onProgress('Verified '+result.mappings.length+' of '+names.length+' existing level mappings.');
  }
  const snapshot=clone(original);
  for(const mapping of result.mappings)if(!snapshot.catalog.levels.some(l=>l.key===mapping.key))snapshot.catalog.levels.push(mapping);
  const first=await buildTransferPlan(pkg,snapshot),decisions={};
  for(const op of first.operations)if(op.path.length===1&&op.path[0]==='title')decisions[op.id]='keep';
  const plan=await buildTransferPlan(pkg,snapshot,decisions);result.plan=plan;
  result.blockers=[...plan.blockers,...plan.operations.filter(op=>op.requiresDecision).map(op=>op.label+': existing content differs and needs an explicit keep/replace decision.'),...unsupportedNativeTransferActions(plan).map(op=>op.label+': this change is not supported by native transfer.')];
  if(result.blockers.length)throw Error('Preparation blocked by unresolved items: '+result.blockers.join(' '));
  if(plan.operations.some(op=>op.path.at(-1)!=='progression'))throw Error('This rehearsal only stages the missing level links; other proposed changes need separate review.');
  await onCheckpoint(clone({...result,status:'running'}));
  onProgress('Staging the approved level links without saving.');
  const partial=await stageNativeTransferPlan(plan,bridge,{maxOperations:1});result.reports.push(partial);
  if(!['interrupted','staged-unsaved'].includes(partial.status))throw Error(partial.reason||'Native level staging stopped.');
  const complete=await stageNativeTransferPlan(plan,bridge,{journal:partial.journal});result.reports.push(complete);if(complete.status!=='staged-unsaved')throw Error(complete.reason||'Native level resume stopped.');
  const rerun=await stageNativeTransferPlan(plan,bridge,{journal:complete.journal});result.reports.push(rerun);if(rerun.items.some(i=>i.status!=='already-present'))throw Error('Native level rerun did not recognize its existing links.');
  result.stagedCapture=await bridge({action:'read'});const lesson=normalizeNativeCapture(result.stagedCapture).lesson;
  if(canonical(lesson)!==canonical(plan.expectedLesson))throw Error('The staged native lesson differs from the accepted transfer plan.');
  const sections=lesson.activities.flatMap(a=>a.sections),levels=sections.flatMap(s=>s.progression?.levels||[]);
  result.counts={activities:lesson.activities.length,sections:sections.length,callouts:sections.reduce((n,s)=>n+s.callouts.length,0),resources:lesson.resources.length,levels:levels.length,assessments:levels.filter(l=>l.assessment).length};result.checksPassed=true;
 }catch(error){result.error=error.message;result.checksPassed=false;}
 if(result.checksPassed&&leaveStaged){result.status='staged-unsaved';result.leftStaged=true;return result;}
 if(result.initialCapture){
  try{
   if(result.plan){onProgress('Restoring the original empty level links after the accepted-package rehearsal.');const recovered=await recoverNativeLevelCheck(bridge,result);result.finalCapture=recovered.finalCapture;result.restored=true;}
   else{result.finalCapture=await bridge({action:'read'});result.restored=canonical(result.finalCapture)===canonical(result.initialCapture);}
  }catch(error){result.restorationError=error.message;}
 }
 result.status=result.checksPassed&&result.restored?'passed-and-restored':'blocked';return result;
}
