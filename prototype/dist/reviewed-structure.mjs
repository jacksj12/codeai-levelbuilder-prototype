import {clone,canonical,digest} from './transfer-core.mjs';

const tipTypes=new Set(['teachingTip','contentCorner','discussionGoal','assessmentOpportunity','ethicsOpportunity']);
const fail=message=>{throw Error(message);};
export function appendedSections(plan){
 return [...appendedActivities(plan).map(activityIndex=>({activityIndex,sectionIndex:0})),...plan.operations.filter(op=>op.kind==='append'&&op.path.length===3&&op.path[0]==='activities'&&op.path[2]==='sections').map(op=>({activityIndex:op.path[1],sectionIndex:op.before.length}))].sort((a,b)=>a.activityIndex-b.activityIndex||a.sectionIndex-b.sectionIndex);
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
 const allowed=['id','key','position','name','description','duration','remarks','tips','scriptLevels','progressionName','levels'];
 if(Object.keys(section).some(k=>!allowed.includes(k)))fail('A new section contains an unmapped native setting.');
 if(section.position!=null&&section.position!==position)fail('A new section has an unreviewed position.');
 if(section.levels!=null&&(!Array.isArray(section.levels)||section.levels.length))fail('A new section contains unmapped levels.');
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
 return [...review.changes,...(review.sectionAdditions||[]).filter(c=>c.section.scriptLevels.length).map(c=>({newSection:true,newActivity:Boolean(c.newActivity),activityIndex:c.activityIndex,activityId:c.activityId,sectionIndex:c.sectionIndex,section:c.section.name,progression:c.section.progressionName,addLevels:c.section.scriptLevels.map(sl=>({name:sl.levels[0].name,levelId:sl.levels[0].id,assessment:sl.assessment}))}))];
}

export function appendedActivities(plan){return plan.operations.filter(op=>op.kind==='append'&&op.path.length===1&&op.path[0]==='activities').map(op=>op.before.length);}
export function inNewActivity(op,indices){return op.path[0]==='activities'&&(op.path.length===1&&op.kind==='append'?indices.includes(op.before.length):indices.includes(op.path[1]));}
export function appendedCallouts(plan){const scopes=appendedSections(plan);return plan.operations.filter(op=>op.kind==='append'&&op.path.length===5&&op.path[4]==='callouts'&&!inAppendedSection(op,scopes)).map(op=>({activityIndex:op.path[1],sectionIndex:op.path[3],tipIndex:op.before.length}));}
export function tipPayload(tip){if(!tip||!tipTypes.has(tip.type)||typeof tip.markdown!=='string'||!tip.markdown.trim()||Object.keys(tip).some(k=>!['key','type','markdown'].includes(k)))fail('A new callout contains unmapped fields.');return {type:tip.type,markdown:tip.markdown};}
export function activityPayload(a,position){
 if(!a||a.id!=null||!/^activity-/.test(a.key||'')||Object.keys(a).some(k=>!['id','key','name','duration','position','activitySections'].includes(k))||typeof a.name!=='string'||a.position!=null&&a.position!==position)fail('A new activity contains unowned identity or unmapped settings.');
 const duration=a.duration===''||a.duration==null?null:Number(a.duration);if(duration!==null&&(!Number.isSafeInteger(duration)||duration<0))fail('New activity timing must be whole minutes.');
 return {name:a.name,duration,position,activitySections:[]};
}
function stripExtra(capture,scope){const copy=clone(capture);for(const root of [copy.live.activities,copy.protection.unmanagedActivities]){
 if(scope.tipIndex!=null){const tips=root[scope.activityIndex]?.activitySections[scope.sectionIndex]?.tips;if(tips?.length!==scope.tipIndex+1)fail('New callouts must be an exact suffix.');tips.pop();}
 else {if(root.length!==scope.activityIndex+1)fail('New activities must be an exact suffix.');root.pop();}
}return copy;}
export async function recoverExtraStructure(bridge,previous){
 const indices=appendedActivities(previous.plan),tips=appendedCallouts(previous.plan),scopes=[...tips,...indices.map(activityIndex=>({activityIndex}))].reverse();
 let current=await bridge({action:'read'});const initial=previous.initialCapture;
 const present=(c,s)=>s.tipIndex!=null?(c.live.activities[s.activityIndex]?.activitySections[s.sectionIndex]?.tips.length||0)>s.tipIndex:c.live.activities.length>s.activityIndex;
 const reduced=clone(previous);reduced.plan.operations=reduced.plan.operations.filter(op=>!inNewActivity(op,indices)&&!tips.some(s=>op.kind==='append'&&op.path.length===5&&op.path[1]===s.activityIndex&&op.path[3]===s.sectionIndex&&op.before.length===s.tipIndex));
 const strip=c=>{let copy=clone(c);for(const scope of scopes)if(present(copy,scope))copy=stripExtra(copy,scope);return copy;};
 if(reduced.stagedCapture)reduced.stagedCapture=strip(reduced.stagedCapture);reduced.reports=(reduced.reports||[]).map(r=>r.journal?{...r,journal:{...r.journal,capture:strip(r.journal.capture)}}:r);
 if(!scopes.some(s=>present(current,s)))return reduced;
 const known=[];for(const point of [initial,previous.stagedCapture,...(previous.reports||[]).map(r=>r.journal?.capture)].filter(Boolean)){let copy=clone(point);known.push(canonical(copy));for(const scope of scopes)if(present(copy,scope)){copy=stripExtra(copy,scope);known.push(canonical(copy));}}
 if(!known.includes(canonical(current)))fail('Outside edits or missing structural checkpoints prevent recovery.');
 for(const scope of scopes){if(!present(current,scope))continue;const {activityIndex:ai,sectionIndex:si,tipIndex:ti}=scope,expected=stripExtra(current,scope);
 const operation=ti!=null?{path:['activities',ai,'sections',si,'callouts',ti],expectedTip:clone(current.live.activities[ai].activitySections[si].tips[ti])}:{path:['activities',ai],createdKey:current.live.activities[ai].key};
 current=await bridge({action:ti!=null?'remove-created-callout':'remove-created-activity',mode:'unsaved-structure-staging',expectedCaptureDigest:await digest(current),operation});if(canonical(current)!==canonical(expected))fail('Structural recovery changed unrelated content.');
 }return reduced;
}
