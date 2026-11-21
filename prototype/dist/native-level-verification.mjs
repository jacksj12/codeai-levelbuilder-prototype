import {sharedKind,recoverSharedRehearsal,resourceRow} from './reviewed-shared.mjs';
import {validateSharedRecord} from './shared-records.mjs';
import {isObjectiveAppend,recoverObjectiveAdditions} from './reviewed-objectives.mjs';
import {appendedActivities,appendedCallouts,inNewActivity,recoverExtraStructure,appendedSections,inAppendedSection,isSupportedSectionOperation,recoverAppendedSections} from './reviewed-structure.mjs';
import {savedFieldPath,liveFieldPath,fieldAt,putField,restoreFieldProtection} from './reviewed-fields.mjs';
import {clone,canonical,digest,buildTransferPlan,packageProblems,readPath} from './transfer-core.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';
import {stageNativeTransferPlan,unsupportedNativeTransferActions} from './native-transfer-runner.mjs';

export async function recoverNativeLevelCheck(bridge,previous){
 if(!previous?.initialCapture||!previous.plan)throw Error('The original level rehearsal checkpoint is missing.');
 if(previous.plan.operations.some(sharedKind))return recoverSharedRehearsal(bridge,previous);
 if(previous.plan.operations.some(isObjectiveAppend))return recoverNativeLevelCheck(bridge,await recoverObjectiveAdditions(bridge,previous));
 if(appendedActivities(previous.plan).length||appendedCallouts(previous.plan).length)return recoverNativeLevelCheck(bridge,await recoverExtraStructure(bridge,previous));
 if(appendedSections(previous.plan).length)return recoverNativeLevelCheck(bridge,await recoverAppendedSections(bridge,previous));
 const initial=previous.initialCapture;let current=await bridge({action:'read'});
 const scalarOps=previous.plan.operations.filter(op=>savedFieldPath(op));
 if(scalarOps.length){
  if(previous.stagedCapture){
   const checkpoint=clone(previous.stagedCapture),known=[canonical(checkpoint)];
   for(const op of [...scalarOps].reverse()){putField(checkpoint.live,liveFieldPath(op),fieldAt(initial.live,liveFieldPath(op)));restoreFieldProtection(checkpoint.protection,initial.protection,savedFieldPath(op));known.push(canonical(checkpoint));}
   for(const op of [...previous.plan.operations.filter(op=>op.path.at(-1)==='progression')].reverse()){
    const [,ai,,si]=op.path;
    for(const root of [checkpoint.live.activities,checkpoint.protection.unmanagedActivities]){root[ai].activitySections[si].scriptLevels=clone(initial.live.activities[ai].activitySections[si].scriptLevels);root[ai].activitySections[si].progressionName=initial.live.activities[ai].activitySections[si].progressionName;}
    known.push(canonical(checkpoint));
   }
   if(!known.includes(canonical(current)))throw Error('Outside changes prevent automatic teaching-transfer recovery.');
  }
  // Verify the complete capture, including unrelated data, before restoring fields.
  const projection=clone(current),normalized=normalizeNativeCapture(current).lesson;
  for(const op of scalarOps){
   const value=readPath(normalized,op.path);
   if(canonical(value)!==canonical(op.before)&&canonical(value)!==canonical(op.after))throw Error('Outside teaching edits prevent automatic recovery.');
   putField(projection.live,liveFieldPath(op),fieldAt(initial.live,liveFieldPath(op)));restoreFieldProtection(projection.protection,initial.protection,savedFieldPath(op));
  }
  // A read-only pass through existing level recovery validates link ownership.
  await recoverNativeLevelCheck(async request=>{
   if(request.action==='read')return clone(projection);
   if(request.action!=='clear-owned-progression')throw Error('Unexpected recovery projection action.');
   const [,ai,,si]=request.operation.path;
   for(const root of [projection.live.activities,projection.protection.unmanagedActivities]){
    root[ai].activitySections[si].scriptLevels=clone(initial.live.activities[ai].activitySections[si].scriptLevels);
    root[ai].activitySections[si].progressionName=initial.live.activities[ai].activitySections[si].progressionName;
   }
   return clone(projection);
  },{...previous,stagedCapture:null,plan:{...previous.plan,operations:previous.plan.operations.filter(op=>!savedFieldPath(op))}});
  for(const op of [...scalarOps].reverse()){
   const value=readPath(normalizeNativeCapture(current).lesson,op.path);if(canonical(value)===canonical(op.before))continue;
   current=await bridge({action:'set-scalar',mode:'unsaved-scalar-staging',expectedCaptureDigest:await digest(current),operation:{...op,before:op.after,after:op.before}});
  }
  previous={...previous,stagedCapture:null};
 }
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
  const snapshot=clone(original);snapshot.catalog.vocabularies=clone(result.initialCapture.saved.vocabularies||[]);
  if(pkg.sharedRecords){
   if(!Number.isSafeInteger(pkg.sharedRecords.courseVersionId)||pkg.sharedRecords.courseVersionId<1)throw Error('Shared-record scope is missing.');
   for(const kind of ['resources','vocabularies']){if(!Array.isArray(pkg.sharedRecords[kind])||pkg.sharedRecords[kind].length>40)throw Error('Shared-record mappings are incomplete.');for(const record of pkg.sharedRecords[kind]){
    validateSharedRecord(kind,record);const checked=await bridge({action:'lookup-shared-record',kind,record,courseVersionId:pkg.sharedRecords.courseVersionId,expectedCaptureDigest:await digest(result.initialCapture)});
    if(checked.kind!=='native-shared-mapping'||canonical(checked.record)!==canonical(record)||canonical(checked.capture)!==canonical(result.initialCapture))throw Error('The shared-record lookup changed or did not preserve the editor.');
    if(kind==='resources'){if(!snapshot.catalog.resources.some(r=>r.key===record.key))snapshot.catalog.resources.push({...resourceRow(record),markdownKey:record.markdownKey,destinationRecordId:record.id,verifiedSharedRecord:clone(record)});}
    else if(!snapshot.catalog.vocabularies.some(r=>r.key===record.key))snapshot.catalog.vocabularies.push(clone(record));
   }}
  }

  for(const mapping of result.mappings)if(!snapshot.catalog.levels.some(l=>l.key===mapping.key))snapshot.catalog.levels.push(mapping);
  const first=await buildTransferPlan(pkg,snapshot),decisions={};
  for(const op of first.operations){if(op.path.length===1&&op.path[0]==='title')decisions[op.id]='keep';else if(savedFieldPath(op))decisions[op.id]='replace';}
  const plan=await buildTransferPlan(pkg,snapshot,decisions);result.plan=plan;
  result.blockers=[...plan.blockers,...plan.operations.filter(op=>op.requiresDecision).map(op=>op.label+': existing content differs and needs an explicit keep/replace decision.'),...unsupportedNativeTransferActions(plan).map(op=>op.label+': this change is not supported by native transfer.')];
  if(result.blockers.length)throw Error('Preparation blocked by unresolved items: '+result.blockers.join(' '));
  if(plan.operations.some(op=>isObjectiveAppend(op)||sharedKind(op)?false:inNewActivity(op,appendedActivities(plan))||op.kind==='append'&&op.path.length===5&&op.path[4]==='callouts'?false:inAppendedSection(op,appendedSections(plan))?!isSupportedSectionOperation(op,appendedSections(plan)):op.path.at(-1)!=='progression'&&!savedFieldPath(op)))throw Error('This rehearsal supports teaching fields, appended sections with callouts, and existing-section level links; callout additions on existing sections and other collections need separate review.');
  await onCheckpoint(clone({...result,status:'running'}));
  onProgress('Rehearsing proposed teaching fields and level links without saving.');
  const partial=await stageNativeTransferPlan(plan,bridge,{maxOperations:1,onProgress:async report=>{await onCheckpoint(clone({...result,status:'running',reports:[...result.reports,report]}));}});result.reports.push(partial);
  if(!['interrupted','staged-unsaved'].includes(partial.status))throw Error(partial.reason||'Native level staging stopped.');
  const complete=await stageNativeTransferPlan(plan,bridge,{journal:partial.journal,maxOperations:500,onProgress:async report=>{await onCheckpoint(clone({...result,status:'running',reports:[...result.reports,report]}));}});result.reports.push(complete);if(complete.status!=='staged-unsaved')throw Error(complete.reason||'Native level resume stopped.');
  const rerun=await stageNativeTransferPlan(plan,bridge,{journal:complete.journal});result.reports.push(rerun);if(rerun.items.some(i=>i.status!=='already-present'))throw Error('Native level rerun did not recognize its existing links.');
  result.stagedCapture=await bridge({action:'read'});const lesson=normalizeNativeCapture(result.stagedCapture).lesson;
  if(canonical(lesson)!==canonical(plan.expectedLesson))throw Error('The staged native lesson differs from the accepted transfer plan.');
  const sections=lesson.activities.flatMap(a=>a.sections),levels=sections.flatMap(s=>s.progression?.levels||[]);
  result.counts={activities:lesson.activities.length,sections:sections.length,callouts:sections.reduce((n,s)=>n+s.callouts.length,0),resources:lesson.resources.length,levels:levels.length,assessments:levels.filter(l=>l.assessment).length};result.checksPassed=true;
 }catch(error){result.error=error.message;result.checksPassed=false;}
 if(result.checksPassed&&leaveStaged){result.status='staged-unsaved';result.leftStaged=true;return result;}
 if(result.initialCapture){
  try{
   if(result.plan){onProgress('Restoring original teaching fields, sections and level links after rehearsal.');const recovered=await recoverNativeLevelCheck(bridge,result);result.finalCapture=recovered.finalCapture;result.restored=true;}
   else{result.finalCapture=await bridge({action:'read'});result.restored=canonical(result.finalCapture)===canonical(result.initialCapture);}
  }catch(error){result.restorationError=error.message;}
 }
 result.status=result.checksPassed&&result.restored?'passed-and-restored':'blocked';return result;
}
