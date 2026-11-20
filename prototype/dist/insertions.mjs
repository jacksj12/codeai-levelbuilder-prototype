import {validateSource} from './core.mjs';
export const SLIDE_MARKER='<i class="fa-solid fa-rectangle-list" aria-hidden="true"></i> ';
export function sectionFor(draft,id){
 const section=draft.sections.find(s=>s.id===id);
 if(!section)throw Error('Choose an existing teaching section.');
 return section;
}
export function httpsUrl(value){
 let url;try{url=new URL(value);}catch{throw Error('Enter a complete HTTPS link.');}
 if(url.protocol!=='https:'||url.username||url.password)throw Error('Enter an HTTPS link without account credentials.');
 return url.href.replace(/\(/g,'%28').replace(/\)/g,'%29');
}
export function insertMarkdown(draft,id,text,selection){
 const section=sectionFor(draft,id),body=section.body;
 if(selection&&selection.body===body&&Number.isInteger(selection.start)&&Number.isInteger(selection.end)&&selection.start>=0&&selection.end>=selection.start&&selection.end<=body.length){
  section.body=body.slice(0,selection.start)+text+body.slice(selection.end);
 }else section.body=body+(body&&!body.endsWith('\n')?'\n\n':'')+text;
 return id;
}
export function addLevel(draft,id,{name,number,url,assessment=false}){
 const section=sectionFor(draft,id),key=name.trim();
 if(!key)throw Error('Enter the level name.');
 if(!Number.isInteger(number)||number<1)throw Error('Enter a positive whole level number.');
 const link=httpsUrl(url);
 if(!['studio.code.org','levelbuilder-studio.code.org'].includes(new URL(link).hostname))throw Error('Use a Code.org level link.');
 const levels=section.progression?.levels||[];
 if(levels.some(l=>l.key===key||l.number===number||l.url===link))throw Error('That level name, number or link is already in this section.');
 const progression=section.progression||{title:section.title||'Linked levels',levels:[]};
 progression.levels.push({key,number,url:link,assessment:Boolean(assessment),mappingStatus:'unverified'});
 section.progression=progression;
 return id;
}
export function addCodeDoc(draft,id,{syntax,url,color=''},selection){
 const label=syntax.trim();
 if(!label||/[`\n\r]/.test(label))throw Error('Enter code syntax on one line without backticks.');
 if(color&&!/^#[a-f\d]{6}$/i.test(color))throw Error('Code color must be a six-digit hex color or blank.');
 return insertMarkdown(draft,id,'[`'+label+'`'+(color?'('+color+')':'')+']('+httpsUrl(url)+')',selection);
}
export function addResource(draft,id,{existingKey,resource},selection){
 sectionFor(draft,id);
 let record;
 if(existingKey){record=draft.resources.find(r=>r.key===existingKey);if(!record)throw Error('Choose an existing resource.');}
 else{
  if(!resource||!/^[-\w]+$/.test(resource.key||''))throw Error('The resource needs a unique local identity.');
  record={...resource,url:httpsUrl(resource.url)};
  validateSource({title:'Resource validation',slides:[{id:'validation',number:1,notes:''}],resources:[record]});
  const duplicate=draft.resources.find(r=>['name','type','audience','url'].every(k=>r[k]===record[k]));
  if(duplicate)record=duplicate;
  else if(draft.resources.some(r=>r.key===record.key))throw Error('A different resource already uses that identity.');
 }
 if(!/^[-\w]+$/.test(record.key||''))throw Error('This resource needs a valid key before it can be inserted.');
 // Prepare all validation before changing either collection or guidance.
 if(!draft.resources.includes(record))draft.resources.push(record);
 insertMarkdown(draft,id,`[r ${record.key}]`,selection);
 return id;
}
export function addImage(draft,id,{url,alt,expandable=false},selection){
 if(!alt?.trim())throw Error('Describe the image for readers who cannot see it.');
 if(/[\[\]\n\r]/.test(alt))throw Error('Keep the image description on one line without brackets.');
 const link=/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(url)?url:httpsUrl(url);
 if(link.startsWith('data:')&&link.length>2_800_000)throw Error('Choose an image smaller than 2 MB.');
 // Level Builder uses the expandable alt marker. Keep the description as nearby text in that case.
 const markdown=expandable?`${alt.trim()}\n\n![expandable](${link})`:`![${alt.trim()}](${link})`;
 return insertMarkdown(draft,id,markdown,selection);
}
