import {CALLOUT_TYPES,addCallout} from './editing.mjs';
import {SLIDE_MARKER,insertMarkdown,addLevel,addCodeDoc,addResource,addImage} from './insertions.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function insertionToolbar(section){
 return `<details class="content-options"><summary>Add content</summary><div class="insertion-toolbar" role="group" aria-label="Add content to ${esc(section.title||'teaching section')}">${['Level','Callout','Code Doc','Resource','Slide','Image'].map(kind=>`<button data-insert-kind="${kind}" data-insert-section="${esc(section.id)}"><span aria-hidden="true">⊕</span> ${kind}</button>`).join('')}</div><div class="section-insert"><button data-add-section="${esc(section.activityId)}" data-after-section="${esc(section.id)}">⊕ Activity Section</button></div></details>`;
}

export function installContentAuthoring({getDraft,canAddResource=()=>true,changed,openEditor,notice}){
 const $=selector=>document.querySelector(selector),selections=new Map();
 let pending=null;
 document.body.insertAdjacentHTML('beforeend',`<dialog id="content-dialog"><form method="dialog"><div class="dialog-head"><h2 id="content-heading">Add content</h2><button aria-label="Cancel content addition">×</button></div></form><div id="content-fields"></div><p id="content-error" role="alert"></p><button id="save-content" class="primary">Add to lesson draft</button></dialog>`);
 const remember=event=>{
  const el=event.target;
  if(el.matches?.('textarea[data-section][data-prop="body"]'))selections.set(el.dataset.section,{body:el.value,start:el.selectionStart,end:el.selectionEnd});
 };
 for(const event of ['select','keyup','pointerup','focusout'])document.addEventListener(event,remember,true);
 const input=(id,label,value='',type='text')=>`<label for="insert-${id}">${label}</label><input class="editor" id="insert-${id}" type="${type}" value="${esc(value)}">`;
 const text=(id,label)=>`<label for="insert-${id}">${label}</label><textarea class="editor" id="insert-${id}" rows="6"></textarea>`;
 const select=(id,label,values)=>`<label for="insert-${id}">${label}</label><select id="insert-${id}">${values.map(v=>`<option value="${esc(v.value??v)}">${esc(v.label??v)}</option>`).join('')}</select>`;
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-insert-kind]');if(!button)return;
  const kind=button.dataset.insertKind,id=button.dataset.insertSection,draft=getDraft();
  if(kind==='Resource'&&!canAddResource()){openEditor('resources');notice('Apply or discard the pending resource edits before inserting a resource.');return;}
  if(kind==='Slide'){
   insertMarkdown(draft,id,SLIDE_MARKER,selections.get(id));selections.delete(id);changed(id);openEditor(id);notice('Slide marker inserted in the guidance. Add the slide instruction beside it.');return;
  }
  pending={kind,id,selection:selections.get(id)};
  $('#content-heading').textContent='Add '+kind;
  $('#content-error').textContent='';
  let fields='';
  if(kind==='Callout')fields=select('callout-type','Callout type',CALLOUT_TYPES)+text('body','Callout text');
  if(kind==='Level'){
   const next=Math.max(0,...draft.sections.flatMap(s=>(s.progression?.levels||[]).map(l=>Number(l.number)||0)))+1;
   fields='<p>Add an existing Code.org level to this section. This local association still needs destination verification before transfer; no level is created remotely.</p>'+input('name','Level name')+input('number','Level number',next,'number')+input('url','Level link','','url')+'<label class="inline-check"><input id="insert-assessment" type="checkbox"> Assessment level</label>';
  }
  if(kind==='Code Doc')fields='<p>Use the code syntax and link from an existing Code.org programming expression. The live Code Doc catalog is not connected.</p>'+input('syntax','Code syntax')+input('url','Code documentation link','','url')+input('color','Code color (optional, for example #0094ca)');
  if(kind==='Resource')fields=select('resource','Resource',draft.resources.filter(r=>r.key).map(r=>({value:r.key,label:`${r.name} — ${r.type} — ${r.audience}`})).concat([{value:'__new__',label:'Add a new local resource'}]))+'<div id="new-resource-fields">'+input('resource-name','Resource name')+select('resource-type','Resource type',['Activity Guide','Answer Key','Slides','Handout','Video','Other'])+select('resource-audience','Resource audience',['Student','Teacher','Verified Teacher'])+input('resource-url','Resource link','','url')+'<p>Creates a record only in this browser draft. Shared Level Builder resource creation requires separate authorization.</p></div>';
  if(kind==='Image')fields='<p>Use an image link or choose a local PNG, JPEG or WebP file up to 2 MB. Local files stay in this draft; no image is uploaded to Level Builder.</p>'+input('url','Image link (or choose a file below)','','url')+'<label for="insert-image-file">Local image file</label><input id="insert-image-file" type="file" accept="image/png,image/jpeg,image/webp">'+input('alt','Image description')+'<label class="inline-check"><input id="insert-expandable" type="checkbox"> Expandable in Level Builder</label>';
  $('#content-fields').innerHTML=fields;
  if(kind==='Resource'){
   const toggle=()=>{$('#new-resource-fields').hidden=$('#insert-resource').value!=='__new__';};
   $('#insert-resource').onchange=toggle;toggle();
  }
  $('#content-dialog').showModal();$('#content-fields input:not([type="checkbox"]), #content-fields select, #content-fields textarea')?.focus();
 });
 $('#save-content').onclick=async()=>{
  if(!pending)return;
  const button=$('#save-content'),dialog=$('#content-dialog');button.disabled=true;
  // Read fields before any asynchronous image-file work.
  const operation=pending,{kind,id,selection}=operation,draft=getDraft(),value=key=>$('#insert-'+key)?.value||'';
  try{
   if(kind==='Callout')addCallout(draft,id,value('callout-type'),value('body'));
   if(kind==='Level')addLevel(draft,id,{name:value('name'),number:Number(value('number')),url:value('url'),assessment:$('#insert-assessment').checked});
   if(kind==='Code Doc')addCodeDoc(draft,id,{syntax:value('syntax'),url:value('url'),color:value('color').trim()},selection);
   if(kind==='Resource'){
    const key=value('resource');
    if(key==='__new__'){
     addResource(draft,id,{resource:{key:'local-resource-'+crypto.randomUUID(),name:value('resource-name').trim(),type:value('resource-type'),audience:value('resource-audience'),url:value('resource-url')}},selection);changed('resources');
    }else addResource(draft,id,{existingKey:key},selection);
   }
   if(kind==='Image'){
    const file=$('#insert-image-file').files[0],alt=value('alt'),expandable=$('#insert-expandable').checked;
    let url=value('url');
    if(file){
     if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2_000_000)throw Error('Choose a PNG, JPEG or WebP file smaller than 2 MB.');
     url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('The image could not be read.'));reader.readAsDataURL(file);});
     if(!dialog.open||pending!==operation)return;
    }
    addImage(draft,id,{url,alt,expandable},selection);
   }
   selections.delete(id);changed(id);pending=null;dialog.close();openEditor(id);notice(kind+' added to the local draft. Review it in the lesson preview.');
  }catch(error){$('#content-error').textContent=error.message;}
  finally{button.disabled=false;}
 };
 $('#content-dialog').addEventListener('close',()=>{pending=null;});
}
