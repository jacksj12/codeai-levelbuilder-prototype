import {resourceRow} from './reviewed-shared.mjs';
import {objectiveReplacements} from './objective-mapping.mjs';
import {SANDBOX,objectivesEqual} from './core.mjs';
import {validDestination} from './destination.mjs';
import {approvalBlockers} from './review.mjs';

export const DESTINATION_ID=8898985;
export const TEXT_FIELDS=['teacherOverview','studentOverview','purpose','preparation','assessmentOpportunities'];
export const clone=value=>structuredClone(value);
export function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export async function digest(value){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value)));
 return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
const equal=(a,b)=>canonical(a)===canonical(b);
const text=(value,label)=>{if(typeof value!=='string')throw Error(label+' must be text.');return value;};
const array=(value,label)=>{if(!Array.isArray(value))throw Error(label+' must be a list.');return value;};
const minutes=(value,label)=>{if(value==null||value==='')return null;if(!Number.isFinite(value)||value<0)throw Error(label+' needs nonnegative minutes or a blank.');return value;};
export function normalizedDraft(draft){
 if(!draft?.frontMatter)throw Error('The package is missing front matter.');
 const f=draft.frontMatter,frontMatter={};
 for(const key of TEXT_FIELDS)frontMatter[key]=text(f[key],key);
 frontMatter.objectives=array(f.objectives,'Objectives').map(x=>text(x,'Objective'));
 frontMatter.vocabulary=array(f.vocabulary,'Vocabulary').map(v=>typeof v==='string'?v:text(v.word,'Vocabulary word')+': '+text(v.definition,'Vocabulary definition'));
 const activities=array(draft.activities,'Activities'),sections=array(draft.sections,'Sections');
 if(new Set(activities.map(a=>a.id)).size!==activities.length||new Set(sections.map(s=>s.id)).size!==sections.length)throw Error('Activity and section identities must be unique.');
 if(sections.some(s=>!activities.some(a=>a.id===s.activityId)))throw Error('Some sections have no activity. Resolve source grouping before transfer.');
 return {title:text(draft.title,'Title'),frontMatter,
  resources:array(draft.resources,'Resources').map(r=>({key:text(r.key,'Resource key'),name:text(r.name,'Resource name'),type:text(r.type,'Resource type'),audience:text(r.audience,'Resource audience'),url:text(r.url,'Resource URL')})),
  activities:activities.map(a=>({title:text(a.title,'Activity title'),duration:minutes(a.duration,'Activity'),sections:sections.filter(s=>s.activityId===a.id).map(s=>({
   title:text(s.title,'Section title'),duration:minutes(s.duration,'Section')||null,body:text(s.body,'Guidance'),remarks:Boolean(s.remarks),
   callouts:array(s.callouts,'Callouts').map(c=>({type:text(c.type,'Callout type'),body:text(c.body,'Callout text')})),
   progression:s.progression?{title:text(s.progression.title,'Progression title'),levels:array(s.progression.levels,'Levels').map(l=>({key:text(l.key,'Level name'),number:l.number,assessment:Boolean(l.assessment)}))}:null
  }))}))};
}
export function validateDestination(snapshot){
 if(snapshot?.schemaVersion!==1||snapshot.kind!=='browser-editor-snapshot'||!validDestination(snapshot.destination))throw Error('The destination snapshot does not match the assigned practice lesson.');
 if(!snapshot.lesson?.frontMatter||!Array.isArray(snapshot.lesson.activities)||!Array.isArray(snapshot.lesson.resources))throw Error('The destination snapshot is incomplete.');
 if(!Array.isArray(snapshot.catalog?.resources)||!Array.isArray(snapshot.catalog?.levels)||!Array.isArray(snapshot.blockers))throw Error('The destination is missing its mapping catalog or capture checks.');
 return snapshot;
}
export function packageProblems(pkg){
 const errors=[];
 if(!(pkg?.schemaVersion===1||[2,3,4].includes(pkg?.schemaVersion)&&pkg.publication?.schemaVersion===1)||!(pkg.sandbox===SANDBOX||/^https:\/\/levelbuilder-studio\.code\.org\/lessons\/[1-9]\d*\/edit$/.test(pkg.sandbox)))throw Error('Choose a review package for the assigned practice lesson.');
 if(canonical(pkg).length>8_000_000)throw Error('This package exceeds the 8 MB transfer-review limit. Replace embedded assets with verified HTTPS links.');
 if(pkg.status!=='approved-locally')errors.push('Approve this draft locally before transfer.');
 if(!Array.isArray(pkg.conflicts))errors.push('The package is missing revision-conflict information.');
 else errors.push(...approvalBlockers({draft:pkg.lesson,conflicts:pkg.conflicts,flags:pkg.review?.flags||[],resourceBuffer:pkg.review?.resourceBuffer}).map(b=>b.note));
 const proposed=normalizedDraft(pkg.lesson);
 if(!proposed.title.trim())errors.push('The lesson title is empty.');
 if(!pkg.baseline)errors.push('The approved baseline is missing.');
 else{
  const baseline=normalizedDraft(pkg.baseline);
  baseline.frontMatter.objectives.sort();const current=clone(proposed);current.frontMatter.objectives.sort();
  if(!equal(baseline,current))errors.push('The package differs from its approved baseline. Review and approve it again.');
 }
 return errors;
}
export const resourceEqual=(a,b)=>['name','type','audience','url'].every(k=>a[k]===b[k]);
export function readPath(root,path){return path.reduce((value,key)=>value?.[key],root);}
export function applyOperation(lesson,operation){
 if(!Array.isArray(operation.path)||operation.path.some(key=>['__proto__','prototype','constructor'].includes(key)))throw Error('Unsupported transfer location.');
 const path=operation.path,parent=readPath(lesson,path.slice(0,-1)),key=path.at(-1);
 if(!parent)throw Error('The target location no longer exists. Rebuild the comparison.');
 if(operation.kind==='append'){
  const list=readPath(lesson,path);if(!Array.isArray(list)||list.length!==operation.before.length)throw Error('The collection changed. Rebuild the comparison.');
  list.push(clone(operation.after));
 }else parent[key]=clone(operation.after);
}
export async function buildTransferPlan(pkg,snapshot,decisions={}){
 validateDestination(snapshot);
 const blockers=packageProblems(pkg).concat(snapshot.blockers),proposed=normalizedDraft(pkg.lesson),before=clone(snapshot.lesson),working=clone(before),operations=[],preserved=[];
 const packageDigest=await digest(pkg),destinationDigest=await digest(snapshot);
 // Map content by exact meaning, never by source database identities.
 const resourceKeys=new Map();
 for(const resource of proposed.resources){
  const matches=snapshot.catalog.resources.filter(r=>resourceEqual(resource,r));
  if(matches.length!==1){blockers.push(`Resources / ${resource.name}: ${matches.length?'ambiguous destination records':'no verified existing destination record'}. No shared record will be created.`);continue;}
  resourceKeys.set(resource.key,matches[0].markdownKey||matches[0].key);
 }
 const mapBody=(body,label)=>{
  if(/!\[[^\]]*\]\(data:/i.test(body))blockers.push(label+': embedded local images need a verified destination asset URL before transfer.');
  return body.replace(/\[r ([^\]\s]+)\]/g,(marker,key)=>{const mapped=resourceKeys.get(key);if(!mapped){blockers.push(label+': resource reference '+key+' has no destination mapping.');return marker;}return '[r '+mapped+']';});
 };
 for(const key of TEXT_FIELDS)proposed.frontMatter[key]=mapBody(proposed.frontMatter[key],key);
 for(const activity of proposed.activities)for(const section of activity.sections){
  section.body=mapBody(section.body,activity.title+' / '+(section.title||'Untitled section'));
  for(const callout of section.callouts)callout.body=mapBody(callout.body,'Callout / '+callout.type);
  for(const level of section.progression?.levels||[]){
   const matches=snapshot.catalog.levels.filter(l=>l.key===level.key&&l.verified===true);
   if(matches.length!==1)blockers.push('Levels / '+level.key+': a unique verified destination mapping is required.');
  }
 }
 async function propose(path,after,label,kind='set',record=null){
  const current=clone(readPath(working,path));
  if(kind==='set'&&(path.at(-1)==='objectives'?objectivesEqual(current,after):equal(current,after)))return;
  const op={kind,path,before:current,after:clone(after),label,...(record?{record:clone(record)}:{})};
  op.id=await digest(op);
  const occupied=kind==='set'&&current!==''&&current!==null&&current!==false&&!(Array.isArray(current)&&!current.length);
  const decision=decisions[op.id];
  if(occupied&&decision==='keep'){preserved.push({label,current,proposed:clone(after),reason:'Kept by reviewer'});return;}
  op.requiresDecision=occupied&&decision!=='replace';
  if(operations.length>=500)throw Error('This comparison exceeds the 500-action batch limit. Split the transfer into a smaller reviewed batch.');
  operations.push(op);
  applyOperation(working,op);
 }
 async function scalarFields(path,source,label,keys){for(const key of keys)await propose([...path,key],source[key],label+' / '+key);}
 await propose(['title'],proposed.title,'Lesson title');
 await scalarFields(['frontMatter'],proposed.frontMatter,'Front matter',TEXT_FIELDS);
 if(snapshot.raw?.kind!=='native-dom-capture')await propose(['frontMatter','vocabulary'],proposed.frontMatter.vocabulary,'Front matter / vocabulary');
 else for(const vocabulary of proposed.frontMatter.vocabulary){if(working.frontMatter.vocabulary.includes(vocabulary))continue;const matches=(snapshot.catalog.vocabularies||[]).filter(r=>r.word+': '+r.definition===vocabulary);if(matches.length!==1){blockers.push('Vocabulary / '+vocabulary+': a unique verified shared record is required.');continue;}await propose(['frontMatter','vocabulary'],vocabulary,'Associate vocabulary / '+matches[0].word,'append',matches[0]);}
 for(const vocabulary of before.frontMatter.vocabulary)if(!proposed.frontMatter.vocabulary.includes(vocabulary))preserved.push({label:'Vocabulary / '+vocabulary,reason:'Destination-only association retained'});
 const oldObjectives=working.frontMatter.objectives,newObjectives=proposed.frontMatter.objectives;
 if(pkg.objectiveMapping){
  try{for(const replacement of objectiveReplacements(pkg.objectiveMapping,snapshot.destination,snapshot.raw?.live?.objectives,newObjectives))await propose(['frontMatter','objectives',replacement.index],replacement.description,'Objective '+(replacement.index+1)+' / description');}
  catch(error){blockers.push(error.message);}
 }else if(!objectivesEqual(oldObjectives,newObjectives)){
  const removed=oldObjectives.map((description,index)=>({description,index})).filter(o=>!newObjectives.includes(o.description));
  const added=newObjectives.filter(description=>!oldObjectives.includes(description));
  // Only one uniquely identified text replacement can retain objective IDs and level tags without guessing.
  if(oldObjectives.length===newObjectives.length&&new Set(oldObjectives).size===oldObjectives.length&&new Set(newObjectives).size===newObjectives.length&&removed.length===1&&added.length===1&&added[0].trim())
   await propose(['frontMatter','objectives',removed[0].index],added[0],'Objective '+(removed[0].index+1)+' / description');
  else if(!removed.length&&new Set(oldObjectives).size===oldObjectives.length&&new Set(newObjectives).size===newObjectives.length&&added.every(description=>description.trim())){for(const description of added)await propose(['frontMatter','objectives'],description,'Add objective / '+description,'append');}
  else await propose(['frontMatter','objectives'],newObjectives,'Front matter / objectives');
 }
 for(const resource of proposed.resources){
  const mapped=snapshot.catalog.resources.filter(r=>resourceEqual(resource,r));
  if(mapped.length!==1)continue;
  if(!working.resources.some(r=>resourceEqual(resource,r))){if(!mapped[0].verifiedSharedRecord&&snapshot.raw?.kind==='native-dom-capture'){blockers.push('Resource / '+resource.name+': verify the shared record before association.');continue;}if(snapshot.raw?.saved?.resources.some(r=>r.isRollup)){blockers.push('Resource additions beside generated rollups require an ordering review.');continue;}await propose(['resources'],{...resourceRow(mapped[0]),destinationRecordId:null},'Associate resource / '+resource.name,'append',mapped[0].verifiedSharedRecord);}
 }
 for(const resource of before.resources)if(!proposed.resources.some(r=>resourceEqual(r,resource)))preserved.push({label:'Resource / '+resource.name,reason:'Destination-only association retained'});
 for(let ai=0;ai<proposed.activities.length;ai++){
  const activity=proposed.activities[ai],ap=['activities',ai];
  if(!working.activities[ai])await propose(['activities'],{title:'',duration:null,sections:[{title:'',duration:null,body:'',remarks:false,callouts:[],progression:null}]},'Add activity '+(ai+1),'append');
  await scalarFields(ap,activity,'Activity '+(ai+1),['title','duration']);
  for(let si=0;si<activity.sections.length;si++){
   const section=activity.sections[si],sp=[...ap,'sections',si],label='Activity '+(ai+1)+' / Section '+(si+1);
   if(!readPath(working,sp))await propose([...ap,'sections'],{title:'',duration:null,body:'',remarks:false,callouts:[],progression:null},'Add '+label,'append');
   await scalarFields(sp,section,label,['title','duration','body','remarks']);
   for(let ci=0;ci<section.callouts.length;ci++){
    if(!readPath(working,[...sp,'callouts',ci]))await propose([...sp,'callouts'],section.callouts[ci],label+' / Add '+section.callouts[ci].type,'append');
    else await scalarFields([...sp,'callouts',ci],section.callouts[ci],label+' / Callout '+(ci+1),['type','body']);
   }
   // A progression is a single reviewed association group; unknown destination settings remain outside it.
   if(section.progression){
    const existingProgression=readPath(working,[...sp,'progression']);
    // Retain association IDs and all hidden settings when only metadata changes.
    if(existingProgression&&equal(existingProgression.levels.map(l=>[l.key,l.number]),section.progression.levels.map(l=>[l.key,l.number]))){
     await propose([...sp,'progression','title'],section.progression.title,label+' / Progression title');
     for(let li=0;li<section.progression.levels.length;li++)await propose([...sp,'progression','levels',li,'assessment'],section.progression.levels[li].assessment,label+' / '+section.progression.levels[li].key+' / Assessment');
    }else await propose([...sp,'progression'],section.progression,label+' / Level associations');
   }
   const existing=readPath(before,sp);
   if(existing?.callouts.length>section.callouts.length)preserved.push({label:label+' / Extra destination callouts',reason:'Not removed'});
   if(existing?.progression&&!section.progression)preserved.push({label:label+' / Destination level associations',reason:'Not removed'});
  }
  if(before.activities[ai]?.sections.length>activity.sections.length)preserved.push({label:'Activity '+(ai+1)+' / Extra destination sections',reason:'Not removed'});
 }
 if(before.activities.length>proposed.activities.length)preserved.push({label:'Extra destination activities',reason:'Not removed'});
 const uniqueBlockers=[...new Set(blockers)];
 const plan={schemaVersion:1,kind:'browser-transfer-plan',destination:clone(snapshot.destination),packageDigest,destinationDigest,operations,preserved,blockers:uniqueBlockers,
  originalSnapshot:clone(snapshot),expectedLesson:working,remoteWrites:false,saveAllowed:false};
 plan.id=await digest(plan);
 return plan;
}
export async function validatePlan(plan){
 if(plan?.schemaVersion!==1||plan.kind!=='browser-transfer-plan'||plan.saveAllowed!==false||plan.remoteWrites!==false)throw Error('Invalid transfer plan.');
 validateDestination(plan.originalSnapshot);
 if(!equal(plan.destination,plan.originalSnapshot.destination))throw Error('The plan destination does not match its evidence.');
 const copy=clone(plan);delete copy.id;
 if(await digest(copy)!==plan.id)throw Error('The transfer plan changed. Rebuild the comparison.');
 if(await digest(plan.originalSnapshot)!==plan.destinationDigest)throw Error('The destination evidence changed. Rebuild the comparison.');
 if(plan.blockers.length||plan.operations.some(op=>op.requiresDecision))throw Error('Resolve every transfer blocker and content decision before staging.');
 return plan;
}
