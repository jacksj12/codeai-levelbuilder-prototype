import {canonical,clone,normalizedDraft} from './transfer-core.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';
import {mergeGeneratedRevision} from './source-revisions.mjs';
import {verifySavedReadback} from './save-review.mjs';

export async function savedReport(report){
 if(report?.mode!=='native'||report.destination?.url!=='https://levelbuilder-studio.code.org/lessons/'+report.destination?.id+'/edit')throw Error('Choose a native practice-lesson report.');
 let saved;
 if(report.receipt){
  if(report.receipt.status!=='saved-and-verified')throw Error('This save report is not verified. Use a fresh baseline report.');
  const check=await verifySavedReadback(report.receipt.review,report.receipt.readback);if(!check.passed)throw Error('The saved report failed independent verification.');saved=report.receipt.readback;
 }else if(report.checkpoint?.status==='baseline-read'&&!report.preparationError)saved=report.checkpoint.freshSaved;
 if(!saved||saved.id!==report.destination.id)throw Error('The report has no complete saved lesson for this destination.');
 // A partial report must never masquerade as an intentional deletion.
 const identity=value=>(typeof value==='number'||typeof value==='string'&&/^[1-9]\d*$/.test(value))&&Number.isSafeInteger(Number(value))&&Number(value)>0;
 const text=value=>typeof value==='string'||value===null;
 if(!identity(saved.id)||typeof saved.name!=='string'||
 ['overview','studentOverview','purpose','preparation','assessmentOpportunities'].some(k=>!Object.hasOwn(saved,k)||!text(saved[k]))||
 ['activities','objectives','resources','vocabularies'].some(k=>!Array.isArray(saved[k])))throw Error('The saved report is incomplete. Export a fresh complete baseline.');
 if(saved.objectives.some(o=>!o||typeof o.description!=='string')||saved.vocabularies.some(v=>!v||typeof v.word!=='string'||typeof v.definition!=='string')||saved.resources.some(r=>!r||['key','name','type','audience','url'].some(k=>typeof r[k]!=='string')))throw Error('The saved report contains incomplete collection records.');
 for(const a of saved.activities){
  if(!a||!identity(a.id)||!Object.hasOwn(a,'duration')||typeof a.name!=='string'||!Array.isArray(a.activitySections))throw Error('The saved report contains an incomplete activity.');
  for(const section of a.activitySections){
   if(!section||!identity(section.id)||!Object.hasOwn(section,'duration')||!Object.hasOwn(section,'remarks')||!(section.remarks===null||typeof section.remarks==='boolean')||!Object.hasOwn(section,'name')||!text(section.name)||!Object.hasOwn(section,'description')||!text(section.description)||!Array.isArray(section.scriptLevels)||!(section.tips===null||Array.isArray(section.tips)))throw Error('The saved report contains an incomplete section.');
   if((section.tips||[]).some(tip=>!tip||typeof tip.type!=='string'||!Object.hasOwn(tip,'markdown')||!text(tip.markdown)))throw Error('The saved report contains an incomplete callout.');
   if(section.scriptLevels.some(link=>!link||typeof link.assessment!=='boolean'||!identity(link.id)||!Array.isArray(link.levels)||link.levels.some(level=>!identity(level.id)||typeof level.name!=='string')))throw Error('The saved report contains an incomplete level association.');
  }
 }
 const fields={title:saved.name,teacherOverview:saved.overview??'',studentOverview:saved.studentOverview??'',purpose:saved.purpose??'',preparation:saved.preparation??'',assessmentOpportunities:saved.assessmentOpportunities??''};
 const snapshot=normalizeNativeCapture({kind:'native-dom-capture',destination:report.destination,saved,blockers:[],live:{fields,activities:saved.activities,objectives:saved.objectives,resources:saved.resources,vocabularies:saved.vocabularies}});
 if(snapshot.blockers.length)throw Error(snapshot.blockers.join(' '));
 const ids=[];for(const a of saved.activities){if(!a.id)throw Error('A saved activity identity is missing.');ids.push('a:'+a.id);for(const s of a.activitySections){if(!s.id)throw Error('A saved section identity is missing.');ids.push('s:'+s.id);}}
 if(new Set(ids).size!==ids.length)throw Error('Saved activity or section identities are duplicated.');
 return {destination:clone(report.destination),saved:clone(saved),lesson:snapshot.lesson};
}
function comparable(lesson){
 const out=clone(lesson);delete out.title;out.frontMatter.objectives.sort();
 out.resources=out.resources.map(({key,name,type,audience,url})=>({key,name,type,audience,url}));return out;
}
export async function connectDestinationBaseline(state,report){
 if(state.conflicts.length)throw Error('Resolve revision conflicts before linking a destination baseline.');
 if(!state.baseline)throw Error('Approve the local lesson first to establish its comparison baseline.');
 const incoming=await savedReport(report),local=normalizedDraft(state.baseline);
 if(canonical(comparable(local))!==canonical(comparable(incoming.lesson)))throw Error('The saved lesson does not match the approved local baseline. No identities were guessed and no content was changed. Use a matching approved workspace and saved report.');
 const activities={},sections={};incoming.saved.activities.forEach((a,ai)=>{const localActivity=state.baseline.activities[ai];activities[a.id]=localActivity.id;const localSections=state.baseline.sections.filter(s=>s.activityId===localActivity.id);a.activitySections.forEach((s,si)=>sections[s.id]=localSections[si].id);});
 const next=clone(state);next.destinationRevision={destination:incoming.destination,saved:incoming.saved,lesson:clone(state.baseline),activities,sections};return next;
}
function project(incoming,base){
 const original=normalizedDraft(base.lesson);
 const retain=(before,after,raw)=>canonical(before)===canonical(after)?clone(raw):clone(after);
 const draft=clone(base.lesson);draft.frontMatter=clone(incoming.lesson.frontMatter);draft.resources=incoming.lesson.resources.map(({key,name,type,audience,url})=>({key,name,type,audience,url}));draft.resources=retain(original.resources,draft.resources,base.lesson.resources);for(const key of Object.keys(draft.frontMatter))draft.frontMatter[key]=retain(original.frontMatter[key],draft.frontMatter[key],base.lesson.frontMatter[key]);draft.activities=[];draft.sections=[];
 incoming.saved.activities.forEach((a,ai)=>{
  const id=base.activities[a.id]||'destination-'+incoming.destination.id+'-activity-'+a.id,old=base.lesson.activities.find(a=>a.id===id),normalized=incoming.lesson.activities[ai];
  draft.activities.push({...clone(old||{}),id,title:normalized.title,duration:normalized.duration,origin:old?.origin||'destination'});
  a.activitySections.forEach((s,si)=>{
   const sectionId=base.sections[s.id]||'destination-'+incoming.destination.id+'-section-'+s.id,previous=base.lesson.sections.find(s=>s.id===sectionId),content=normalized.sections[si];
   const oldIndex=base.lesson.activities.findIndex(a=>a.id===previous?.activityId),oldSectionIndex=base.lesson.sections.filter(s=>s.activityId===previous?.activityId).findIndex(s=>s.id===sectionId);
   const prior=original.activities[oldIndex]?.sections[oldSectionIndex];
   let changedLevelIdentity=false;
   if(content.progression&&previous?.progression){
    const savedBefore=base.saved.activities.flatMap(a=>a.activitySections).find(section=>section.id===s.id);
    const active=link=>link?.levels?.find(level=>String(level.id)===String(link.activeId))||link?.levels?.[0];
    content.progression.levels=content.progression.levels.map((level,index)=>{
     const currentNative=active(s.scriptLevels[index]);
     const matched=(savedBefore?.scriptLevels||[]).some(link=>String(active(link)?.id)===String(currentNative?.id)&&active(link)?.name===level.key);
     if(!matched)changedLevelIdentity=true;
     const oldLevel=previous.progression.levels.find(item=>item.key===level.key);
     return matched&&oldLevel?{...clone(oldLevel),...level}:level;
    });
   }
   if(prior)for(const key of Object.keys(content))if(key!=='progression'||!changedLevelIdentity)content[key]=retain(prior[key],content[key],previous[key]);
   draft.sections.push({...clone(previous||{slide:null,sourceNotes:'Imported from saved destination section '+s.id,changes:[],origin:'destination'}),...clone(content),id:sectionId,activityId:id});
  });
 });
 draft.duration=draft.activities.reduce((sum,a)=>sum+(a.duration||0),0);return draft;
}
export async function mergeDestinationReport(state,report){
 if(!state.destinationRevision)throw Error('Link a matching saved baseline before comparing destination revisions.');
 const incoming=await savedReport(report),base=state.destinationRevision;
 if(canonical(incoming.destination)!==canonical(base.destination))throw Error('This report belongs to another destination.');
 const projected=project(incoming,base),working={...clone(state),generated:clone(base.lesson)},result=mergeGeneratedRevision(working,projected);
 result.state.generated=clone(state.generated);result.state.source=clone(state.source);
 const activities={...base.activities},sections={...base.sections};incoming.saved.activities.forEach((a,ai)=>{activities[a.id]=projected.activities[ai].id;const children=projected.sections.filter(s=>s.activityId===activities[a.id]);a.activitySections.forEach((s,si)=>sections[s.id]=children[si].id);});
 result.state.destinationRevision={destination:incoming.destination,saved:incoming.saved,lesson:clone(projected),activities,sections};
 result.state.conflicts=result.state.conflicts.map(c=>({...c,origin:'destination',label:'Saved lesson / '+c.label}));
 // Destination settings outside the authored surface stay read-only and visible.
 const managed=new Set(['activities','overview','studentOverview','objectives','preparation','vocabularies','purpose','assessmentOpportunities','resources']);
 const outside=Object.keys(incoming.saved).filter(k=>!managed.has(k)&&canonical(base.saved[k])!==canonical(incoming.saved[k]));
 result.notices=outside.length?['Saved settings changed outside this draft: '+outside.join(', ')+'. They remain untouched in Level Builder.']:[];
 result.state.destinationRevision.notices=result.notices;return result;
}
