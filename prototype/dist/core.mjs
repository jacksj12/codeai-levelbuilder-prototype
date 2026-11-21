export const SANDBOX='https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11';
export const canWrite=()=>false;
const icons=[['🎯','fa-solid fa-bullseye-arrow'],['💬','fa fa-comments'],['💡','fa fa-lightbulb-o'],['☑','fa fa-check-square-o'],['📄','fa fa-file-text-o'],['🔁','fa fa-refresh'],['💻','fa fa-desktop']];
export function convertNotes(input){
 let text=input.replace(/\r\n/g,'\n'); const changes=[];
 for(const [symbol,cls] of icons){
  text=text.replace(new RegExp(symbol+'\\uFE0F?','gu'),()=>{changes.push({kind:'icon',from:symbol,to:cls});return `<i class="${cls}" aria-hidden="true"></i>`;});
 }
 text=text.replace(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu,s=>{changes.push({kind:'removed',from:s,to:''});return '';});
 text=text.replace(/(<i[^>]*><\/i>\s*)(Goal of this activity|Discussion Goal|Do This|Discuss|Distribute|Circulate|Transition):/g,'$1**$2:**');
 text=text.replace(/^(Level \d+:)(.*)$/gm,'- **$1**$2');
 return {text:text.trim(),changes};
}
export function validateSource(x){
 if(!x||typeof x.title!=='string'||!x.title.trim())throw Error('Provide a lesson title.');
 if(!Array.isArray(x.slides)||!x.slides.length)throw Error('Provide at least one slide with speaker notes.');
 if(x.importWarnings!==undefined&&(!Array.isArray(x.importWarnings)||x.importWarnings.some(w=>typeof w!=='string')))throw Error('Import warnings must be a list of text.');
 const ids=new Set(); for(const s of x.slides){if(typeof s.id!=='string'||!s.id||ids.has(s.id))throw Error('Each slide needs a unique stable id.');ids.add(s.id);if(typeof s.notes!=='string'||!Number.isInteger(s.number))throw Error('Each slide needs a number and notes text.');}
 for(const k of ['teacherOverview','studentOverview','preparation','purpose','assessmentOpportunities'])if(x[k]!==undefined&&typeof x[k]!=='string')throw Error(`${k} must be text.`);
 for(const k of ['objectives','vocabulary','resources'])if(x[k]!==undefined&&!Array.isArray(x[k]))throw Error(`${k} must be a list.`);
 if(x.objectives?.some(o=>typeof o!=='string'))throw Error('Objectives must contain text.');
 for(const r of x.resources||[]){if(!r.name||!r.type||!r.audience)throw Error('Resources need name, type, and audience.');let u;try{u=new URL(r.url);}catch{throw Error('Resource URL must use https.');}if(u.protocol!=='https:')throw Error('Resource URL must use https.');if(r.type==='Answer Key'&&r.audience==='Student')throw Error('Answer Key resources cannot have Student audience.');}
 return x;
}
export function generate(source){
 validateSource(source); const activities=[],sections=[],warnings=[...(source.importWarnings||[])];let current;
 const ensureActivity=()=>{if(!current){current={id:'unassigned',title:'Unassigned activity',duration:0};activities.push(current);warnings.push('No activity heading found before the first content slide. Review grouping and timing.');}};
 for(const slide of source.slides){
  let notes=slide.notes.trim();if(!notes)continue;
  const heading=notes.match(/^([^\n]+?)\s*\((\d+)\s*min(?:ute)?s?\)\s*(?:\n|$)/i);
  if(heading&&notes.slice(heading[0].length).trim()===''){
   current={id:slide.id,title:heading[1].trim(),duration:Number(heading[2])};activities.push(current);continue;
  }
  ensureActivity();let title='',duration=null;
  if(heading){title=heading[1].trim();duration=Number(heading[2]);notes=notes.slice(heading[0].length).trim();}
  const pieces=notes.split(/^(Teaching Tip|Content Corner|Discussion Goal|Assessment Opportunity|Ethics Opportunity)\s*$/m), converted=convertNotes(pieces[0]);
  const callouts=[];for(let i=1;i<pieces.length;i+=2){const c=convertNotes(pieces[i+1]||'');callouts.push({type:pieces[i],body:c.text});converted.changes.push(...c.changes);}
  const progression=structuredClone(source.levelAssociations?.[slide.id]||null);
  if(/Lesson\s+\d+,?\s+Levels?\s+\d/i.test(notes)&&!progression)warnings.push(`Slide ${slide.number}: transition text needs confirmed level associations.`);
  sections.push({id:slide.id,activityId:current.id,slide:slide.number,title,duration,body:converted.text,remarks:false,callouts,progression,sourceNotes:slide.notes,changes:converted.changes});
 }
 for(const a of activities){const subtotal=sections.filter(s=>s.activityId===a.id).reduce((n,s)=>n+s.duration,0);if(subtotal>a.duration)warnings.push(`${a.title}: section timing exceeds activity timing.`);}
 for(const k of ['teacherOverview','studentOverview','preparation'])if(!source[k]?.trim())warnings.push(`${k} is missing. Add or explicitly review this field.`);
 if(!source.objectives?.length)warnings.push('No objectives supplied.');if(!source.resources?.length)warnings.push('No resource records supplied.');
 return {schemaVersion:1,title:source.title,course:source.course||'',frontMatter:{teacherOverview:source.teacherOverview||'',studentOverview:source.studentOverview||'',objectives:source.objectives||[],preparation:source.preparation||'',vocabulary:source.vocabulary||[],purpose:source.purpose||'',assessmentOpportunities:source.assessmentOpportunities||''},resources:structuredClone(source.resources||[]),activities,sections,duration:activities.reduce((n,a)=>n+a.duration,0),warnings};
}
export function objectivesEqual(a,b){
 return Array.isArray(a)&&Array.isArray(b)&&JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
}
export function reconcileObjectives(base,current,incoming){
 if(objectivesEqual(current,incoming))return {value:current,status:'unchanged'};
 if(objectivesEqual(base,incoming))return {value:current,status:'kept'};
 // Count occurrences: losing a duplicate still requires an explicit decision.
 const remaining=[...(incoming||[])];
 for(const objective of base||[]){const i=remaining.indexOf(objective);if(i<0)return {value:current,status:'conflict'};remaining.splice(i,1);}
 if(objectivesEqual(base,current))return {value:incoming,status:'updated'};
 return {value:current,status:'conflict'};
}
export function reconcile(base,current,incoming){
 const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(eq(current,incoming))return {value:current,status:'unchanged'};
 if(eq(base,incoming))return {value:current,status:'kept'};
 if(incoming==null&&current!=null)return {value:current,status:'conflict'};
 if(Array.isArray(base)&&Array.isArray(incoming)&&base.some(old=>!incoming.some(next=>eq(old,next))))return {value:current,status:'conflict'};
 if(eq(base,current))return {value:incoming,status:'updated'};
 return {value:current,status:'conflict'};
}
export function exportMarkdown(p){
 const f=p.frontMatter;let out=`# ${p.title}\n\nReview export — not a Level Builder import or published lesson.\n\n## Teacher overview\n${f.teacherOverview}\n\n## Student overview\n${f.studentOverview}\n\n## Objectives\n${f.objectives.map(o=>'- '+o).join('\n')}\n\n## Preparation\n${f.preparation}\n\n## Vocabulary\n${f.vocabulary.length?f.vocabulary.map(v=>typeof v==='string'?'- '+v:`- ${v.word}: ${v.definition}`).join('\n'):'None supplied'}\n\n## Purpose\n${f.purpose||'Not supplied'}\n\n## Assessment opportunities\n${f.assessmentOpportunities||'Not supplied'}\n\n## Resources\n`;
 for(const r of p.resources)out+=`- ${r.name} | ${r.type} | ${r.audience} | ${r.url}\n`;
 out+='\n## Teaching Guide\n';for(const a of p.activities){out+=`\n### ${a.title} (${a.duration} minutes)\n`;for(const s of p.sections.filter(s=>s.activityId===a.id)){out+=`\n#### ${s.title||'Untitled section'}${s.duration?` (${s.duration} minutes)`:''}\n${s.origin==='local'?'Source: added locally':'Source slide: '+s.slide}; Remarks: ${s.remarks?'yes':'no'}\n\n${s.body}\n`;for(const c of s.callouts)out+=`\n**${c.type}**\n${c.body}\n`;if(s.progression)out+=`\nProgression: ${s.progression.title}\n${s.progression.levels.map(l=>`- Level ${l.number}: ${l.key}${l.url?' | '+l.url:''}${l.assessment?' | Assessment':''}${l.mappingStatus==='unverified'?' | Destination verification needed':''}`).join('\n')}\n`;}}
 return out;
}
