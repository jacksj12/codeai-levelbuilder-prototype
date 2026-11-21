import {generate,reconcile,reconcileObjectives} from './core.mjs';
const clone=x=>structuredClone(x);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function structureProblems(draft){
 const activities=draft.activities||[],sections=draft.sections||[];
 return [...(new Set(activities.map(a=>a.id)).size!==activities.length?['Duplicate activity identities.']:[]),
 ...(new Set(sections.map(s=>s.id)).size!==sections.length?['Duplicate section identities.']:[]),
 ...sections.filter(s=>!activities.some(a=>a.id===s.activityId)).map(s=>'Section '+s.id+' has no activity.')];
}
function put(state,c,value){
 const p=state.draft;
 if(c.kind==='order'){const records=p[c.key],byId=new Map(records.map(r=>[r.id,r]));p[c.key]=[...value.filter(id=>byId.has(id)).map(id=>byId.get(id)),...records.filter(r=>!value.includes(r.id))];}
 else if(c.kind==='front')p.frontMatter[c.key]=clone(value);
 else if(c.kind==='root')p[c.key]=clone(value);
 else if(c.kind==='section-field'){const s=p.sections.find(s=>s.id===c.key);if(!s)throw Error('The section no longer exists.');s[c.field]=clone(value);}
 else if(c.kind==='activity-field'){const a=p.activities.find(a=>a.id===c.key);if(!a)throw Error('The activity no longer exists.');a[c.field]=clone(value);}
 else if(c.kind==='activity-group'){
  if(value===null){p.sections=p.sections.filter(s=>s.activityId!==c.key);p.activities=p.activities.filter(a=>a.id!==c.key);}
 }else if(c.kind==='section'){
  const i=p.sections.findIndex(s=>s.id===c.key);if(value===null){if(i>=0)p.sections.splice(i,1);}else if(i>=0)p.sections[i]=clone(value);else p.sections.push(clone(value));
 }else throw Error('Unknown revision decision.');
 p.duration=p.activities.reduce((n,a)=>n+a.duration,0);
}
export function mergeSources(state,source){const result=mergeGeneratedRevision(state,generate(source));result.state.source=clone(source);return result;}
export function mergeGeneratedRevision(state,next){
 if(state.conflicts.length)throw Error('Resolve the current source conflicts before importing another revision.');
 const out=clone(state),base=state.generated,removedGroups=new Set(base.activities.filter(a=>!next.activities.some(b=>b.id===a.id)).map(a=>a.id));
 let updates=0;const conflicts=[];
 function merge(c,old,current,incoming){
  // Clearing authored text is a deletion, even when represented by an empty string.
  const clearing=typeof old==='string'&&old.trim()&&typeof incoming==='string'&&!incoming.trim()&&current!==incoming;
  const result=clearing?{status:'conflict',value:current}:c.kind==='front'&&c.key==='objectives'?reconcileObjectives(old,current,incoming):reconcile(old,current,incoming);
  if(result.status==='conflict')conflicts.push({...c,base:clone(old),current:clone(current),incoming:clone(incoming)});
  else{put(out,c,result.value);if(result.status==='updated')updates++;}
 }
 for(const k of Object.keys(next.frontMatter))merge({kind:'front',key:k,label:k},base.frontMatter[k],out.draft.frontMatter[k],next.frontMatter[k]);
 for(const k of ['title','course','resources'])merge({kind:'root',key:k,label:k},base[k],out.draft[k],next[k]);
 for(const incoming of next.activities){
  const old=base.activities.find(a=>a.id===incoming.id),current=out.draft.activities.find(a=>a.id===incoming.id);
  if(!current){if(!old){out.draft.activities.push(clone(incoming));updates++;}continue;}
  for(const field of ['title','duration'])merge({kind:'activity-field',key:incoming.id,field,label:incoming.title+' / '+field},old?.[field]??null,current[field],incoming[field]);
 }
 const ids=new Set([...base.sections,...out.draft.sections,...next.sections].map(s=>s.id));
 for(const id of ids){
  const old=base.sections.find(s=>s.id===id)||null,current=out.draft.sections.find(s=>s.id===id)||null,incoming=next.sections.find(s=>s.id===id)||null;
  if(!incoming&&current&&removedGroups.has(current.activityId))continue;
  if(!old||!current||!incoming){merge({kind:'section',key:id,label:'Teaching section / '+id},old,current,incoming);continue;}
  for(const field of ['activityId','title','duration','body','remarks','callouts','progression'])merge({kind:'section-field',key:id,field,label:(current.title||'Slide '+current.slide)+' / '+field},old[field],current[field],incoming[field]);
  const merged=out.draft.sections.find(s=>s.id===id);for(const field of ['slide','sourceNotes','changes'])merged[field]=clone(incoming[field]);
 }
 for(const id of removedGroups){const activity=out.draft.activities.find(a=>a.id===id);if(activity)conflicts.push({kind:'activity-group',key:id,label:'Remove activity and its sections / '+activity.title,current:{activity:clone(activity),sections:clone(out.draft.sections.filter(s=>s.activityId===id))},incoming:null});}
 // Compare the relative order of shared identities. Retain local additions at their anchors.
 for(const key of ['activities','sections']){
  const records=out.draft[key],current=records.map(r=>r.id),incoming=next[key].map(r=>r.id),old=base[key].map(r=>r.id);
  const shared=old.filter(id=>current.includes(id)&&incoming.includes(id));
  const filtered=ids=>ids.filter(id=>shared.includes(id));
  const localMoved=!same(filtered(current),filtered(old)),sourceMoved=!same(filtered(incoming),filtered(old));
  function anchored(primary,extras){const result=primary.filter(id=>current.includes(id));let anchor=null;for(const id of extras){if(result.includes(id)){anchor=id;continue;}const i=anchor===null?0:result.indexOf(anchor)+1;result.splice(i,0,id);anchor=id;}return result;}
  const proposed=anchored(incoming,current.filter(id=>!incoming.includes(id)||old.includes(id)));
  if(localMoved&&sourceMoved&&!same(filtered(current),filtered(incoming)))conflicts.push({kind:'order',key,label:key+' order',base:old,current,incoming:proposed});
  else{
   // A source insertion can be applied while preserving an independently reordered draft.
   let selected=localMoved?current.filter(id=>!incoming.includes(id)||old.includes(id)):proposed;
   if(localMoved){for(let i=0;i<incoming.length;i++){const id=incoming[i];if(selected.includes(id)||!current.includes(id))continue;const previous=incoming.slice(0,i).reverse().find(x=>selected.includes(x));selected.splice(previous===undefined?0:selected.indexOf(previous)+1,0,id);}}
   if(!same(selected,current)){put(out,{kind:'order',key},selected);updates++;}
  }
 }
 out.generated=clone(next);out.draft.warnings=clone(next.warnings);out.draft.duration=out.draft.activities.reduce((n,a)=>n+a.duration,0);out.conflicts=conflicts;
 if(updates||conflicts.length){out.approved=false;out.reviewed=[];}
 if(structureProblems(out.draft).length)throw Error('Source revision would create orphaned or duplicate records. Original draft retained.');
 return {state:out,updates,conflicts:conflicts.length};
}
export function resolveSourceConflict(state,index,choice){
 if(!['keep','incoming','edit'].includes(choice))throw Error('Choose Keep, Edit or incoming content.');
 const out=clone(state),c=out.conflicts[index];if(!c)throw Error('This revision decision no longer exists.');
 if(choice==='incoming')put(out,c,c.incoming);
 const problems=structureProblems(out.draft);if(problems.length)throw Error(problems.join(' ')+' Keep this change until its activity is restored.');
 out.conflicts.splice(index,1);out.approved=false;out.reviewed=[];return out;
}
