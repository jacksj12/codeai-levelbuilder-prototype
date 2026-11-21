import {sharedKind,sharedAppendValid,resourceRow,vocabularyRow} from './reviewed-shared.mjs';
import {isObjectiveAppend,objectivePayload} from './reviewed-objectives.mjs';
import {appendedActivities,appendedCallouts,inNewActivity,activityPayload,tipPayload,appendedSections,inAppendedSection,sectionPayload,stripNewSections,newSectionLink} from './reviewed-structure.mjs';
import {savedFieldPath,liveFieldPath,fieldAt,putField,nativeFieldValue,restoreFieldProtection} from './reviewed-fields.mjs';
import {clone,canonical,digest,validatePlan} from './transfer-core.mjs';
import {validDestination} from './destination.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';

const ROOT_SETTINGS=['lockable','hasLessonPlan','creativeCommonsLicense','background','assessment','unplugged'];
const ROOT_TEXT=['name','overview','studentOverview','assessmentOpportunities','purpose','preparation'];
function assert(condition,message){if(!condition)throw Error(message);}
function records(value,label){assert(Array.isArray(value),'The saved '+label+' collection is missing.');return value;}
function keyList(value,label){const list=records(value,label).map(r=>{assert(typeof r.key==='string'&&r.key,'A saved '+label+' key is missing.');return r.key;});assert(new Set(list).size===list.length,'Saved '+label+' keys are ambiguous.');return list;}
function sourceSection(root,path){return root.activities[path[1]]?.activitySections[path[3]];}
function replaceGroup(root,path,source){
 const section=sourceSection(root,path);assert(section,'A destination section is missing.');
 section.scriptLevels=clone(source.scriptLevels);section.progressionName=source.progressionName;
}
function comparableLesson(lesson){const value=clone(lesson);value.frontMatter.objectives.sort();value.frontMatter.vocabulary.sort();value.resources=value.resources.map(resourceRow).sort((a,b)=>a.key.localeCompare(b.key));return value;}

// Pure preparation only. No networking, CSRF access, Save click or writer.
export async function buildSaveReview(rehearsal,freshSaved,{now=Date.now(),originalLessonJson,transport='native-editor',preservationTest=false}={}){
 assert(rehearsal?.status==='passed-and-restored'&&rehearsal.checksPassed===true&&rehearsal.restored===true,'A completed and restored accepted-package rehearsal is required.');
 assert(['native-editor','direct-api'].includes(transport),'Unsupported save transport.');
 const plan=rehearsal.plan;await validatePlan(plan);
 assert(validDestination(plan.destination),'Choose a valid reviewed practice destination.');
 const initial=rehearsal.initialCapture,staged=rehearsal.stagedCapture;
 assert(initial?.saved?.id===plan.destination.id&&staged?.saved?.id===plan.destination.id&&freshSaved?.id===plan.destination.id,'The saved lesson identity does not match the selected destination.');
 assert(canonical(freshSaved)===canonical(initial.saved)&&canonical(staged.saved)===canonical(initial.saved),'Saved content changed after the rehearsal. Read and review it again; no save was prepared.');
 assert(typeof originalLessonJson==='string'&&canonical(JSON.parse(originalLessonJson))===canonical(freshSaved),'The exact original server snapshot is required for its conflict check.');
 assert(canonical(initial)===canonical(rehearsal.finalCapture),'The rehearsal did not restore its complete original capture.');
 const normalized=normalizeNativeCapture(staged);assert(!normalized.blockers.length,normalized.blockers.join(' '));
 assert(canonical(normalized.lesson)===canonical(plan.expectedLesson),'The staged content does not match its reviewed transfer plan.');
 if(preservationTest){assert(transport==='native-editor'&&plan.operations.length===0&&canonical(staged)===canonical(initial),'Preservation tests must keep the entire editor unchanged and use the native save control.');}else assert(plan.operations.length>0,'There are no reviewed changes to save.');
 const scopes=appendedSections(plan),sectionAdditions=[],candidate=clone(freshSaved),changes=[],fieldChanges=[];
 const activityIndices=appendedActivities(plan),activityAdditions=[],calloutAdditions=[],tipScopes=appendedCallouts(plan);
 const projection=stripNewSections(staged,scopes),objectiveAdditions=[],sharedAdditions=[];
 for(const op of plan.operations.filter(sharedKind)){const kind=sharedKind(op);assert(sharedAppendValid(op),'The shared association differs from its verified record.');assert(!candidate[kind].some(r=>r.id===op.record.id||r.key===op.record.key),'A shared association is already present.');candidate[kind].push(clone(op.record));sharedAdditions.push({kind,record:clone(op.record),index:op.before.length});}
 for(const addition of [...sharedAdditions].reverse()){const {kind,index,record}=addition;const expected=kind==='resources'?resourceRow(record):vocabularyRow(record);assert(projection.live[kind].length===index+1&&canonical(projection.live[kind][index])===canonical(expected),'The staged shared association does not match its reviewed record.');projection.live[kind].pop();projection.protection[kind].pop();}

 for(const op of plan.operations.filter(isObjectiveAppend)){const index=op.before.length,objective=objectivePayload(staged.live.objectives[index]);assert(candidate.objectives.length===index&&objective.description===op.after,'New objectives must append exactly as reviewed.');candidate.objectives.push(objective);objectiveAdditions.push({index,objective});}
 for(const addition of [...objectiveAdditions].reverse()){assert(projection.live.objectives.length===addition.index+1,'Unexpected objective ordering.');projection.live.objectives.pop();projection.protection.objectives.pop();}

 for(const ai of activityIndices){assert(candidate.activities.length===ai,'New activities must append in order.');const activity=activityPayload(staged.live.activities[ai],ai+1);candidate.activities.push(activity);activityAdditions.push({activityIndex:ai,label:'New activity '+(ai+1),activity:clone(activity)});}
 for(const ai of [...activityIndices].reverse()){assert(projection.live.activities.length===ai+1,'Unexpected activity ordering.');projection.live.activities.pop();projection.protection.unmanagedActivities.pop();}
 for(const scope of [...tipScopes].reverse()){const {activityIndex:ai,sectionIndex:si,tipIndex:ti}=scope;for(const root of [projection.live.activities,projection.protection.unmanagedActivities]){assert(root[ai].activitySections[si].tips.length===ti+1,'Unexpected callout ordering.');root[ai].activitySections[si].tips.pop();}}
 for(const scope of tipScopes){const {activityIndex:ai,sectionIndex:si,tipIndex:ti}=scope,section=candidate.activities[ai].activitySections[si],tip=tipPayload(staged.live.activities[ai].activitySections[si].tips[ti]);if(section.tips===null)section.tips=[];assert(Array.isArray(section.tips)&&section.tips.length===ti,'Callouts must append in order.');section.tips.push(tip);calloutAdditions.push({...scope,sectionId:section.id,label:'Activity '+(ai+1)+' / Section '+(si+1)+' / New callout '+(ti+1),tip});}

 for(const {activityIndex:ai,sectionIndex:si} of scopes){
  const activity=candidate.activities[ai],native=staged.live.activities[ai];
  assert(activity&&native&&(activityIndices.includes(ai)||activity.id===native.id)&&si>=(freshSaved.activities[ai]?.activitySections.length||0)&&activity.activitySections.length===si,'New sections must append to a preserved existing activity.');
  const section=sectionPayload(native.activitySections[si],si+1);activity.activitySections.push(section);
  sectionAdditions.push({activityIndex:ai,activityId:activity.id??null,newActivity:activityIndices.includes(ai),sectionIndex:si,label:'Activity '+(ai+1)+' / New section '+(si+1),section:clone(section)});
 }
 for(const op of plan.operations){
  if(sharedKind(op)||isObjectiveAppend(op)||inNewActivity(op,activityIndices)||inAppendedSection(op,scopes)||op.kind==='append'&&op.path.length===5&&op.path[4]==='callouts')continue;
  const p=op.path,nativePath=savedFieldPath(op);
  if(nativePath){
   const livePath=liveFieldPath(op),before=fieldAt(freshSaved,nativePath),after=nativeFieldValue(op);
   assert(canonical(fieldAt(normalized.lesson,op.path))===canonical(op.after),'The staged native field differs from the reviewed value.');
   if(nativePath.length>1){
    for(const length of nativePath.length===3?[2]:[2,4])assert(fieldAt(freshSaved,nativePath.slice(0,length))?.id===fieldAt(staged.live,nativePath.slice(0,length))?.id,'A reviewed native record identity changed.');
   }
   putField(candidate,nativePath,after);putField(projection.live,livePath,fieldAt(initial.live,livePath));restoreFieldProtection(projection.protection,initial.protection,nativePath);
   fieldChanges.push({label:op.label,path:clone(nativePath),before:clone(before),after:clone(after)});continue;
  }
  assert(op.kind==='set'&&p.length===5&&p[0]==='activities'&&p[2]==='sections'&&p[4]==='progression'&&op.before===null,'This save review supports existing teaching fields and missing-level additions. Other records and collections need their own save mapping.');
  const before=sourceSection(initial.live,p),after=sourceSection(staged.live,p),saved=sourceSection(candidate,p);
  assert(before&&after&&saved&&before.id===saved.id&&after.id===saved.id,'A destination activity-section identity changed.');
  assert(!records(before.scriptLevels,'original level links').length&&!records(saved.scriptLevels,'saved level links').length,'Replacing an existing saved progression is not supported.');
  assert(after.scriptLevels.length===op.after.levels.length,'The reviewed level-link count changed.');
  for(const [i,sl]of after.scriptLevels.entries()){
   const level=sl.levels?.[0];assert(sl.id==null,'A new native association unexpectedly carries a persisted record ID.');
   assert(sl.levels?.length===1&&level?.id!=null&&level.name===op.after.levels[i].key&&Boolean(sl.assessment)===op.after.levels[i].assessment,'The native level mapping or assessment flag changed.');
   assert(Number.isInteger(sl.activitySectionPosition)&&sl.activitySectionPosition===i+1,'The native per-section level ordering is incomplete.');
  }
  replaceGroup(projection.live,p,before);
  const protectedBefore=initial.protection.unmanagedActivities[p[1]].activitySections[p[3]],protectedAfter=projection.protection.unmanagedActivities[p[1]].activitySections[p[3]];
  protectedAfter.scriptLevels=clone(protectedBefore.scriptLevels);protectedAfter.progressionName=protectedBefore.progressionName;
  // Begin with the full saved destination and replace only the approved group.
  replaceGroup(candidate,p,after);
  changes.push({activity:freshSaved.activities[p[1]].name,section:saved.name,sectionId:saved.id,progression:op.after.title,
   addLevels:after.scriptLevels.map(sl=>({name:sl.levels[0].name,levelId:sl.levels[0].id,assessment:Boolean(sl.assessment)}))});
 }
 assert(canonical(projection)===canonical(initial),'Unreviewed native content or settings changed during staging.');
 const payload=buildSavedLessonPayload(freshSaved,candidate,originalLessonJson);
 const sections=normalized.lesson.activities.flatMap(a=>a.sections),levels=sections.flatMap(s=>s.progression?.levels||[]);
 const expectedCounts={activities:normalized.lesson.activities.length,sections:sections.length,callouts:sections.reduce((n,s)=>n+s.callouts.length,0),resources:normalized.lesson.resources.length,levels:levels.length,assessments:levels.filter(l=>l.assessment).length};
 const review={schemaVersion:1,kind:'native-save-review',status:'ready-for-review',createdAt:now,expiresAt:now+10*60*1000,
  destination:clone(plan.destination),transport,...(preservationTest?{preservationTest:true}:{}),remoteWrites:false,saveAllowed:false,requiresUserApproval:true,requiresRestaging:true,
  baselineDigest:await digest(freshSaved),stagedDigest:await digest(staged),rehearsalPlanId:plan.id,changes,fieldChanges,sectionAdditions,activityAdditions,calloutAdditions,objectiveAdditions,sharedAdditions,
  request:{method:'PUT',url:'https://levelbuilder-studio.code.org/lessons/'+plan.destination.id,contentType:'application/json;charset=UTF-8',body:JSON.stringify(payload)},
  baseline:clone(freshSaved),baselineNativeProtection:clone(initial.protection),expectedLesson:clone(plan.expectedLesson),expectedCounts,
  preserved:{activityIds:freshSaved.activities.map(a=>a.id),sectionIds:freshSaved.activities.flatMap(a=>a.activitySections.map(s=>s.id)),resourceKeys:JSON.parse(payload.resources),vocabularyKeys:JSON.parse(payload.vocabularies)},
  limitation:'Review only until explicitly approved. Existing-level additions have prior live acceptance on the assigned playground; Teaching-field and new-section saves are locally tested, not live-accepted; other selected destinations require their own saved verification.'};
 review.id=await digest(review);return review;
}

export async function validateSaveReview(review,{freshSaved,now=Date.now(),checkExpiry=true}={}){
 assert(review?.kind==='native-save-review'&&review.saveAllowed===false&&review.remoteWrites===false,'Invalid dry-run save review.');
 const copy=clone(review);delete copy.id;assert(await digest(copy)===review.id,'The save review changed. Prepare it again.');
 assert(validDestination(review.destination)&&review.request.method==='PUT'&&review.request.url==='https://levelbuilder-studio.code.org/lessons/'+review.destination.id,'The save destination changed.');
 assert(!checkExpiry||now<=review.expiresAt,'This save review expired. Read and review the lesson again.');
 if(freshSaved)assert(freshSaved.id===review.destination.id&&await digest(freshSaved)===review.baselineDigest,'Saved content changed after review. Do not save or retry the old request.');
 return review;
}

export async function saveRequestDigest(review){
 const request=review.request||review,payload=JSON.parse(request.body);
 for(const key of ['objectives','activities','resources','vocabularies','programmingExpressions','standards','opportunityStandards','jitPlConceptIds','announcements','originalLessonData']){
  assert(typeof payload[key]==='string','Incomplete reviewed request field '+key+'.');payload[key]=JSON.parse(payload[key]);
 }
 return digest({method:request.method,url:request.url,contentType:request.contentType,payload,...(review.transport?{transport:review.transport}:{}),...(review.preservationTest?{preservationTest:true}:{})});
}

export async function validateStagedSaveReview(review,capture){
 await validateSaveReview(review);
 assert(capture?.saved?.id===review.destination.id&&await digest(capture.saved)===review.baselineDigest,'The staged editor baseline changed.');
 const normalized=normalizeNativeCapture(capture);assert(!normalized.blockers.length,normalized.blockers.join(' '));
 assert(canonical(comparableLesson(normalized.lesson))===canonical(comparableLesson(review.expectedLesson)),'The current staged editor differs from the approved result.');
 const protection=clone(capture.protection),requested=JSON.parse(JSON.parse(review.request.body).activities);
 for(const addition of [...(review.sharedAdditions||[])].reverse()){const {kind,index,record}=addition;const expected=kind==='resources'?resourceRow(record):vocabularyRow(record);assert(protection[kind].length===index+1&&canonical(capture.live[kind][index])===canonical(expected),'A shared association differs from the reviewed record.');protection[kind].pop();}
 for(const addition of [...(review.objectiveAdditions||[])].reverse()){assert(protection.objectives.length===addition.index+1&&canonical(objectivePayload(capture.live.objectives[addition.index]))===canonical(addition.objective),'A staged new objective differs from its review.');protection.objectives.pop();}
 for(const change of review.fieldChanges||[])restoreFieldProtection(protection,review.baselineNativeProtection,change.path);
 for(const c of review.activityAdditions||[]){const a=capture.live.activities[c.activityIndex];assert(canonical(activityPayload(a,c.activityIndex+1))===canonical(c.activity),'A new activity differs from its review.');}
 for(const c of [...(review.calloutAdditions||[])].reverse()){const s=capture.live.activities[c.activityIndex]?.activitySections[c.sectionIndex],p=protection.unmanagedActivities[c.activityIndex]?.activitySections[c.sectionIndex];assert(s?.id===c.sectionId&&p?.tips.length===c.tipIndex+1&&canonical(tipPayload(s.tips[c.tipIndex]))===canonical(c.tip),'A new callout differs from its review.');p.tips.pop();}
 for(const change of [...(review.sectionAdditions||[])].reverse()){
  const ai=change.activityIndex,si=change.sectionIndex,activity=capture.live.activities[ai];
  assert((change.newActivity||activity?.id===change.activityId)&&canonical(sectionPayload(activity.activitySections[si],si+1))===canonical(change.section),'A staged new section differs from its reviewed content.');
  assert(protection.unmanagedActivities[ai].activitySections.length===si+1,'Unexpected new-section ordering.');
  protection.unmanagedActivities[ai].activitySections.pop();
 }
 for(const change of review.changes){
  const ai=capture.live.activities.findIndex(a=>a.activitySections.some(s=>s.id===change.sectionId));
  assert(ai>=0,'A reviewed section is missing from the current editor.');
  const si=capture.live.activities[ai].activitySections.findIndex(s=>s.id===change.sectionId),section=capture.live.activities[ai].activitySections[si];
  const expected=requested.flatMap(a=>a.activitySections).find(s=>s.id===change.sectionId);
  assert(section.scriptLevels.length===expected.scriptLevels.length,'The staged link count changed.');
  for(const [i,sl]of section.scriptLevels.entries()){
   const wanted=expected.scriptLevels[i];assert(sl.id==null&&sl.levels?.length===1&&String(sl.levels[0].id)===String(wanted.levels[0].id),'A staged native level identity changed.');
   for(const key of ['assessment','bonus','challenge','instructor_in_training','show_ai_analysis'])assert(Boolean(sl[key])===Boolean(wanted[key]),'An unreviewed staged level flag changed.');
   assert(canonical(sl.variants??null)===canonical(wanted.variants??null),'The staged level variants changed.');
  }
  const original=review.baselineNativeProtection.unmanagedActivities[ai].activitySections[si];
  protection.unmanagedActivities[ai].activitySections[si].scriptLevels=clone(original.scriptLevels);protection.unmanagedActivities[ai].activitySections[si].progressionName=original.progressionName;
 }
 for(const c of [...(review.activityAdditions||[])].reverse()){assert(protection.unmanagedActivities.length===c.activityIndex+1,'Unexpected new activity order.');protection.unmanagedActivities.pop();}
 assert(canonical(protection)===canonical(review.baselineNativeProtection),'Unreviewed settings or native records changed before saving.');
 return true;
}

export async function verifySavedReadback(review,saved){
 await validateSaveReview(review,{checkExpiry:false});
 const mismatches=[];
 if(saved?.id!==review.destination.id)return {passed:false,mismatches:['The returned lesson identity is wrong.']};
 if(!['activities','resources','objectives','vocabularies'].every(key=>Array.isArray(saved[key]))||saved.activities.some(a=>!Array.isArray(a.activitySections)))return {passed:false,mismatches:['The saved response is incomplete; preservation cannot be verified.'],saved:true,saveRetried:false};
 const capture={schemaVersion:1,kind:'native-dom-capture',destination:review.destination,saved,blockers:[],live:{
  fields:{title:saved.name,teacherOverview:saved.overview||'',studentOverview:saved.studentOverview||'',purpose:saved.purpose||'',preparation:saved.preparation||'',assessmentOpportunities:saved.assessmentOpportunities||''},
  activities:saved.activities,objectives:saved.objectives,resources:saved.resources.map(r=>({key:r.key,name:r.name,type:r.type,audience:r.audience,url:r.url})),vocabularies:saved.vocabularies}};
 const normalized=normalizeNativeCapture(capture);
 if(normalized.blockers.length)mismatches.push(...normalized.blockers);
 if(canonical(comparableLesson(normalized.lesson))!==canonical(comparableLesson(review.expectedLesson)))mismatches.push('Saved lesson content, ordering or assessment flags differ from the reviewed result.');
 const requestedActivities=JSON.parse(JSON.parse(review.request.body).activities);
 const projection=clone(saved),newIds=new Set(review.baseline.activities.flatMap(a=>a.activitySections.flatMap(s=>s.scriptLevels.map(sl=>String(sl.id)))));
 // The server returns objectives sorted by description. Reconcile by persisted
 // identity so an approved text edit cannot turn a successful save into a false failure.
 const objectiveIds=review.baseline.objectives.map(o=>o.id),savedObjectiveIds=saved.objectives.map(o=>o.id);
 const addedObjectives=saved.objectives.filter(o=>!objectiveIds.includes(o.id)),expectedObjectives=review.objectiveAdditions||[];
 const objectiveKeys=saved.objectives.map(o=>o.key).filter(k=>typeof k==='string');if(new Set(objectiveKeys).size!==objectiveKeys.length)mismatches.push('Saved objective keys are duplicated.');
 if(new Set(savedObjectiveIds).size!==savedObjectiveIds.length||savedObjectiveIds.length!==objectiveIds.length+expectedObjectives.length||objectiveIds.some(id=>!savedObjectiveIds.includes(id)))mismatches.push('Saved objective identities are missing, duplicated or replaced.');
 else projection.objectives=objectiveIds.map(id=>clone(saved.objectives.find(o=>o.id===id)));
 if(addedObjectives.length!==expectedObjectives.length)mismatches.push('New saved objectives do not match the review.');
 for(const addition of expectedObjectives){const matches=addedObjectives.filter(o=>o.description===addition.objective.description);if(matches.length!==1){mismatches.push('A new objective is missing or duplicated.');continue;}const record=clone(matches[0]);if(!Number.isSafeInteger(record.id)||record.id<1)mismatches.push('A new objective has no valid saved identity.');delete record.id;if(Object.hasOwn(record,'key')){if(typeof record.key!=='string'||!record.key)mismatches.push('A new objective has an invalid saved key.');delete record.key;}if(canonical(record)!==canonical(addition.objective))mismatches.push('A new objective contains unreviewed tags or metadata.');}

 for(const kind of ['resources','vocabularies']){
  const wanted=[...review.baseline[kind],...(review.sharedAdditions||[]).filter(a=>a.kind===kind).map(a=>a.record)],actual=saved[kind];
  if(actual.length!==wanted.length||new Set(actual.map(r=>r.id)).size!==actual.length||new Set(actual.map(r=>r.key)).size!==actual.length||wanted.some(record=>!actual.some(r=>canonical(r)===canonical(record))))mismatches.push('Saved '+kind+' identities, content or metadata differ from the exact review.');
  else projection[kind]=clone(review.baseline[kind]);
 }
 const sectionIds=new Set(review.baseline.activities.flatMap(a=>a.activitySections.map(s=>String(s.id))));
 for(const change of [...(review.sectionAdditions||[])].reverse()){
  const activity=projection.activities[change.activityIndex],section=activity?.activitySections[change.sectionIndex];
  if(!section||!change.newActivity&&activity.id!==change.activityId||activity.activitySections.length!==change.sectionIndex+1){mismatches.push('A new section is missing, reordered or duplicated.');continue;}
  const id=String(section.id),raw=clone(section);delete raw.id;
  if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id))||sectionIds.has(id))mismatches.push('A new section has a missing, reused or duplicated saved identity.');
  sectionIds.add(id);
  if(!Array.isArray(raw.scriptLevels))mismatches.push('New-section saved links are incomplete.');
  else raw.scriptLevels=raw.scriptLevels.map((sl,index)=>{
   const id=String(sl.id);if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id))||newIds.has(id))mismatches.push('A new-section association has a missing, reused or duplicate identity.');else newIds.add(id);
   try{return newSectionLink(sl,index+1,{persisted:true});}catch(error){mismatches.push(error.message);return sl;}
  });
  if(canonical(raw)!==canonical(change.section))mismatches.push('A new section or its callouts differ from the exact reviewed structure.');
  activity.activitySections.pop();
 }
 const activityIds=new Set(review.baseline.activities.map(a=>String(a.id)));
 for(const c of [...(review.activityAdditions||[])].reverse()){
  const a=projection.activities[c.activityIndex],id=String(a?.id);if(!a||projection.activities.length!==c.activityIndex+1){mismatches.push('A new activity is missing or reordered.');continue;}
  if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id))||activityIds.has(id))mismatches.push('A new activity has a missing, reused or duplicate saved identity.');activityIds.add(id);
  const raw=clone(a);delete raw.id;if(canonical(raw)!==canonical(c.activity))mismatches.push('A new activity contains unreviewed fields.');projection.activities.pop();
 }
 for(const c of [...(review.calloutAdditions||[])].reverse()){const s=projection.activities[c.activityIndex]?.activitySections[c.sectionIndex];if(!s||s.id!==c.sectionId||s.tips.length!==c.tipIndex+1||canonical(s.tips[c.tipIndex])!==canonical(c.tip))mismatches.push('A new callout differs from its exact review.');else {s.tips.pop();if(!s.tips.length&&review.baseline.activities[c.activityIndex].activitySections[c.sectionIndex].tips===null)s.tips=null;}}
 for(const change of review.fieldChanges||[]){
  if(canonical(fieldAt(change.path[0]==='objectives'?projection:saved,change.path))!==canonical(change.after))mismatches.push('A saved teaching field differs from its exact reviewed value.');
  try{putField(projection,change.path,change.before);}catch{mismatches.push('A reviewed native field is missing.');}
 }
 for(const change of review.changes){
  let found;
  for(const activity of projection.activities||[])for(const section of activity.activitySections||[])if(section.id===change.sectionId)found=section;
  if(!found){mismatches.push('A reviewed section identity is missing.');continue;}
  const requested=requestedActivities.flatMap(a=>a.activitySections).find(s=>s.id===change.sectionId);
  if(found.scriptLevels?.length!==change.addLevels.length)mismatches.push('A saved progression has an unexpected number of levels.');
  for(const [index,sl]of (found.scriptLevels||[]).entries()){
   const validId=(typeof sl.id==='number'||typeof sl.id==='string'&&/^\d+$/.test(sl.id))&&Number.isSafeInteger(Number(sl.id))&&Number(sl.id)>0;
   if(!validId||newIds.has(String(sl.id)))mismatches.push('New saved association identities are missing or duplicated.');else newIds.add(String(sl.id));
   const wanted=requested?.scriptLevels[index];
   if(sl.levels?.length!==1||String(sl.levels?.[0]?.id)!==String(change.addLevels[index]?.levelId)||sl.activeId!=null&&String(sl.activeId)!==String(change.addLevels[index]?.levelId))mismatches.push('A saved link points to a different level record or variant.');
   if(!wanted||sl.activitySectionPosition!==wanted.activitySectionPosition)mismatches.push('A saved link has different per-section ordering.');
   for(const key of ['assessment','bonus','challenge','instructor_in_training','show_ai_analysis'])if(Boolean(sl[key])!==Boolean(wanted?.[key]))mismatches.push('A saved link has an unreviewed '+key+' flag.');
   if(canonical(sl.variants??null)!==canonical(wanted?.variants??null))mismatches.push('A saved link has unreviewed variants.');
  }
  const original=review.baseline.activities.flatMap(a=>a.activitySections).find(s=>s.id===change.sectionId);found.scriptLevels=clone(original.scriptLevels);found.progressionName=original.progressionName;
 }
 if(canonical(projection)!==canonical(review.baseline))mismatches.push('An existing record, setting or association changed outside the reviewed changes.');
 const passed=mismatches.length===0,baselineUnchanged=canonical(saved)===canonical(review.baseline);
 return {passed,mismatches:[...new Set(mismatches)],saved:passed?true:baselineUnchanged?false:null,baselineUnchanged,saveRetried:false};
}

export function buildSavedLessonPayload(freshSaved,candidate,originalLessonJson){
 const payload={};
 for(const key of [...ROOT_TEXT,...ROOT_SETTINGS]){assert(Object.prototype.hasOwnProperty.call(freshSaved,key),'Saved field '+key+' is missing.');payload[key]=clone(ROOT_TEXT.includes(key)?candidate[key]:freshSaved[key]);}
 const standards=records(freshSaved.standards,'standards'),opportunity=records(freshSaved.opportunityStandards,'opportunity standards'),expressions=records(freshSaved.programmingExpressions,'code definitions');
 for(const item of [...standards,...opportunity])assert(typeof item.frameworkShortcode==='string'&&typeof item.shortcode==='string','A saved standard mapping is incomplete.');
 for(const item of expressions)assert(typeof item.programmingEnvironmentName==='string'&&typeof item.key==='string','A saved code-definition mapping is incomplete.');
 const objectives=records(candidate.objectives,'objectives'),originalObjectives=records(freshSaved.objectives,'objectives');
 assert(objectives.length>=originalObjectives.length,'Objective removals need a separate collection review.');
 for(const [index,objective]of objectives.entries()){
  if(index>=originalObjectives.length){assert(typeof objective.description==='string'&&objective.description.trim()&&canonical(objective)===canonical({description:objective.description,scriptLevelIds:[]}),'A new objective contains unreviewed metadata.');continue;}
  const original=originalObjectives[index];
  assert(typeof objective.description==='string'&&canonical({...objective,description:original.description})===canonical(original),'Objective identity, tags or unreviewed metadata changed.');
 }
 payload.objectives=JSON.stringify(objectives);
 payload.activities=JSON.stringify(candidate.activities);
 for(const kind of ['resources','vocabularies']){assert(Array.isArray(candidate[kind])&&candidate[kind].length>=freshSaved[kind].length,'Shared-record removals need a separate review.');for(const [i,record]of freshSaved[kind].entries())assert(canonical(candidate[kind][i])===canonical(record),'An existing shared record changed.');}
 payload.resources=JSON.stringify(keyList(candidate.resources,'resources'));
 payload.vocabularies=JSON.stringify(keyList(candidate.vocabularies,'vocabulary'));
 payload.programmingExpressions=JSON.stringify(expressions);payload.standards=JSON.stringify(standards);payload.opportunityStandards=JSON.stringify(opportunity);
 payload.jitPlConceptIds=JSON.stringify(records(freshSaved.jitPlConcepts,'teaching concepts').map(c=>{assert(Number.isSafeInteger(c.id),'A saved teaching-concept identity is missing.');return c.id;}));
 assert(freshSaved.announcements===null||Array.isArray(freshSaved.announcements),'Saved announcements are incomplete.');payload.announcements=JSON.stringify(freshSaved.announcements);
 payload.originalLessonData=originalLessonJson;
 return payload;
}
