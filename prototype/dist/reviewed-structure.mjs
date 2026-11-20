import {clone,canonical,digest} from './transfer-core.mjs';

const tipTypes=new Set(['teachingTip','contentCorner','discussionGoal','assessmentOpportunity','ethicsOpportunity']);
const fail=message=>{throw Error(message);};
export function appendedSections(plan){
 return plan.operations.filter(op=>op.kind==='append'&&op.path.length===3&&op.path[0]==='activities'&&op.path[2]==='sections').map(op=>({activityIndex:op.path[1],sectionIndex:op.before.length}));
}
export function inAppendedSection(op,scopes){
 const p=op.path;return scopes.some(s=>p[0]==='activities'&&p[1]===s.activityIndex&&p[2]==='sections'&&(p.length===3&&op.kind==='append'&&op.before.length===s.sectionIndex||p.length>=5&&p[3]===s.sectionIndex));
}
export function isSupportedSectionOperation(op,scopes){
 if(!inAppendedSection(op,scopes))return false;
 return op.kind==='append'&&(op.path.length===3||op.path.length===5&&op.path[4]==='callouts')||op.kind==='set'&&op.path.length===5&&['title','body','duration','remarks','progression'].includes(op.path[4]);
}
// UI-generated keys are session-specific. New persisted IDs must come from the server.
export function sectionPayload(section,position){
 if(!section||section.id!=null||!/^activitySection-/.test(section.key||''))fail('A new section must have an owned temporary native identity.');
 const allowed=['id','key','position','name','description','duration','remarks','tips','scriptLevels','progressionName'];
 if(Object.keys(section).some(k=>!allowed.includes(k)))fail('A new section contains an unmapped native setting.');
 if(section.position!=null&&section.position!==position)fail('A new section has an unreviewed position.');
 if(!Array.isArray(section.scriptLevels))fail('A new section has incomplete level links.');
 if(section.progressionName!=null&&typeof section.progressionName!=='string')fail('A new section has an invalid progression title.');
 if(typeof section.name!=='string'||typeof section.description!=='string'||typeof section.remarks!=='boolean')fail('A new section has incomplete teaching fields.');
 const duration=section.duration===''||section.duration==null?null:Number(section.duration);
 if(duration!==null&&(!Number.isSafeInteger(duration)||duration<=0))fail('New-section timing must be blank or positive whole minutes.');
 if(!Array.isArray(section.tips)||section.tips.some(t=>!tipTypes.has(t.type)||typeof t.markdown!=='string'||!t.markdown.trim()||Object.keys(t).some(k=>!['key','type','markdown'].includes(k))))fail('A new callout has unmapped content or identity.');
 return {position,name:section.name,description:section.description,duration,remarks:section.remarks,tips:section.tips.map(t=>({type:t.type,markdown:t.markdown})),progressionName:section.progressionName??null,scriptLevels:section.scriptLevels.map((sl,i)=>newSectionLink(sl,i+1))};
}
export function stripNewSections(capture,scopes){
 const copy=clone(capture);
 for(const {activityIndex:ai,sectionIndex:si} of [...scopes].reverse()){
  for(const root of [copy.live.activities,copy.protection.unmanagedActivities]){
   if(root[ai]?.activitySections.length!==si+1)fail('New sections must be an exact append-only suffix.');
   root[ai].activitySections.pop();
  }
 }
 return copy;
}
// Recovery recognizes retained full captures, including generated keys and all settings.
export async function recoverAppendedSections(bridge,previous){
 const scopes=appendedSections(previous.plan),initial=previous.initialCapture;
 let current=await bridge({action:'read'});
 const reduced=clone(previous);reduced.plan.operations=reduced.plan.operations.filter(op=>!inAppendedSection(op,scopes));
 if(reduced.stagedCapture)reduced.stagedCapture=stripNewSections(reduced.stagedCapture,scopes);
 // Once every appended section is gone, the existing scalar/link recovery owns
 // validation of its intermediate restoration checkpoints.
 if(current.live.activities.length===initial.live.activities.length&&current.live.activities.every((a,i)=>a.activitySections.length===initial.live.activities[i].activitySections.length))return reduced;
 const evidence=[initial,previous.stagedCapture,...(previous.reports||[]).map(r=>r.journal?.capture)].filter(Boolean),known=[];
 for(const point of evidence){
  let copy=clone(point);known.push(canonical(copy));
  for(const scope of [...scopes].reverse()){
   const {activityIndex:ai,sectionIndex:si}=scope;
   if(copy.live.activities[ai]?.activitySections.length===si+1){copy=stripNewSections(copy,[scope]);known.push(canonical(copy));}
  }
 }
 if(!known.includes(canonical(current)))fail('Outside edits or missing section checkpoints prevent automatic recovery.');
 for(const scope of [...scopes].reverse()){
  const {activityIndex:ai,sectionIndex:si}=scope,sections=current.live.activities[ai].activitySections;
  if(sections.length<=si)continue;
  const section=sections[si];sectionPayload(section,si+1);
  const expected=stripNewSections(current,[scope]);
  current=await bridge({action:'remove-created-section',mode:'unsaved-structure-staging',expectedCaptureDigest:await digest(current),operation:{path:['activities',ai,'sections',si],createdKey:section.key}});
  if(canonical(current)!==canonical(expected))fail('Removing an owned unsaved section changed unrelated content.');
 }
 return reduced;
}

export function newSectionLink(link,position,{persisted=false}={}){
 if(!link||!persisted&&link.id!=null||link.levels?.length!==1||!Number.isSafeInteger(Number(link.levels[0].id))||Number(link.levels[0].id)<=0||typeof link.levels[0].name!=='string'||!link.levels[0].name.trim())fail('A new-section link has an invalid existing-level identity.');
 if(link.activitySectionPosition!==position||typeof link.assessment!=='boolean')fail('A new-section link has invalid order or assessment state.');
 if(link.activeId!=null&&String(link.activeId)!==String(link.levels[0].id))fail('A new-section link has a different active variant.');
 const flags=['bonus','challenge','instructor_in_training','show_ai_analysis'];
 if(flags.some(k=>Boolean(link[k]))||link.variants!=null)fail('New-section links contain unreviewed flags or variants.');
 return {levels:[{id:Number(link.levels[0].id),name:link.levels[0].name}],assessment:link.assessment,activitySectionPosition:position,bonus:false,challenge:false,instructor_in_training:false,show_ai_analysis:false,variants:null};
}
export function reviewedLevelGroups(review){
 return [...review.changes,...(review.sectionAdditions||[]).filter(c=>c.section.scriptLevels.length).map(c=>({newSection:true,activityIndex:c.activityIndex,activityId:c.activityId,sectionIndex:c.sectionIndex,section:c.section.name,progression:c.section.progressionName,addLevels:c.section.scriptLevels.map(sl=>({name:sl.levels[0].name,levelId:sl.levels[0].id,assessment:sl.assessment}))}))];
}
