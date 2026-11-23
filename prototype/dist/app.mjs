import {prepareWorkspaceImport} from './workspace-import.mjs';
import {connectDestinationBaseline,mergeDestinationReport} from './destination-revisions.mjs';
import {importSourceFile,combineSourceImports} from './source-imports.mjs';
import {saveWorkspace} from './workspace-storage.mjs';
import {mergeSources,resolveSourceConflict} from './source-revisions.mjs';
import {workspaceBackup,restoreWorkspace} from './workspace-backup.mjs';
import {resourceEditor,updateResource,resourceDraft} from './resource-editor.mjs';
import {insertionToolbar,installContentAuthoring} from './content-ui.mjs';
import {addCallout,addSection,addActivity,moveRecord} from './editing.mjs';
import {approvalBlockers,addFlag,approveDraft,renderLesson,resourceList,previewText} from './review.mjs';
import {generate,reconcile,reconcileObjectives,objectivesEqual,exportMarkdown,SANDBOX,validateSource} from './core.mjs';
const $=s=>document.querySelector(s), clone=x=>structuredClone(x), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fixture=await(await fetch('./fixture.json')).json();
const workspaceId=new URL(location.href).searchParams.get('workspace');
let workspaceKey=workspaceId?'lesson-studio-workspace-'+workspaceId:'lesson-studio-v1';
let state,view='preview',activity='all',editTarget=null;
const fresh=()=>({source:clone(fixture),generated:generate(fixture),draft:generate(fixture),reviewed:[],flags:[],baseline:null,conflicts:[],approved:false});
let storedRevision=null;
try{storedRevision=localStorage.getItem(workspaceKey);state=JSON.parse(storedRevision);if(!state?.draft||!state?.source)state=fresh();}catch{state=fresh();}
state.flags??=[];
let storageWarning='';
const persist=()=>{try{const saved=saveWorkspace(localStorage,workspaceKey,state,storedRevision);workspaceKey=saved.key;storedRevision=saved.value;storageWarning='';if(saved.forked){const url=new URL(location.href);url.searchParams.set('workspace',saved.id);history.replaceState(null,'',url);storageWarning='Another tab changed this workspace. Your edits were saved in a separate recovery workspace; both versions are preserved.';notice('');}return true;}catch{storageWarning='Browser storage is full or unavailable. Export a backup to preserve your work.';notice('');return false;}};
function notice(s){$('#notice').textContent=[s,storageWarning].filter(Boolean).join(' ');}

function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const fields=[['teacherOverview','Teacher overview'],['studentOverview','Student overview'],['objectives','Objectives'],['preparation','Preparation'],['vocabulary','Vocabulary'],['purpose','Purpose'],['assessmentOpportunities','Assessment opportunities']];
const requiredIds=()=>['title',...fields.map(([k])=>k),'resources',...state.draft.activities.map(a=>'activity:'+a.id),...state.draft.sections.map(s=>s.id)];
const fieldText=(k,v)=>k==='objectives'?(v||[]).join('\n'):k==='vocabulary'?(v||[]).map(t=>typeof t==='string'?t:`${t.word}: ${t.definition}`).join('\n'):v||'';
const changed=key=>{state.reviewed=state.reviewed.filter(x=>x!==key);state.approved=false;persist();updateSummary();};
function reviewControl(id){return `<label class="review-toggle"><input type="checkbox" data-review="${esc(id)}" ${state.reviewed.includes(id)?'checked':''}> Reviewed</label>`;}
function preview(text){return previewText(text,state.draft.resources);}

const titles={preview:['Lesson preview','Read the assembled lesson, flag issues, and approve once.'],front:['Front matter','Keep the teacher and student experience distinct.'],guide:['Teaching Guide','Review source notes, transformations, and lesson-only guidance.'],resources:['Resources','Check each destination, type, and intended audience.'],revisions:['Revision review','Keep approved work. Resolve new changes deliberately.']};
function updateSummary(){
 // Editing invalidates review in state; keep visible checkboxes in sync too.
 document.querySelectorAll('[data-review]').forEach(el=>{el.checked=state.reviewed.includes(el.dataset.review);});
 const p=state.draft,done=requiredIds().filter(id=>state.reviewed.includes(id)).length,total=requiredIds().length;
 document.title=titles[view][0]+' · '+p.title+' · Lesson Studio';$('#title').textContent=p.title;$('#subtitle').textContent=`${p.course||'Lesson workspace'} · ${p.duration} minutes · source snapshot`;
 $('#metrics').innerHTML=`<div class="metric"><strong>${p.sections.length}</strong><span>Teaching sections</span></div><div class="metric"><strong>${p.resources.length}</strong><span>Linked resources</span></div><div class="metric"><strong>${p.sections.reduce((n,s)=>n+s.callouts.length,0)}</strong><span>Teaching callouts</span></div><div class="metric"><strong>${approvalBlockers(state).length}</strong><span>Issues to resolve before approval</span></div>`;
 $('#review-state').textContent=state.approved?'Approved locally':state.conflicts.length?`${state.conflicts.length} conflicts to resolve`:'Draft · review needed';$('#review-state').className='pill'+(state.approved?' approved':'');
 const blockers=approvalBlockers(state);
 $('#approve').disabled=blockers.length>0;
 $('#approve').textContent=state.approved?'Approved locally':'Approve complete lesson';
 let panel=$('#pending-review');
 if(!panel){panel=document.createElement('section');panel.id='pending-review';$('#metrics').after(panel);}
 const itemLabel=id=>{const section=p.sections.find(s=>s.id===id);return id==='title'?'Lesson title':id==='resources'?'Resources':fields.find(([k])=>k===id)?.[1]||(section?(section.origin==='local'?'Local section — ':'Slide '+section.slide+' — ')+(section.title||'Teaching section'):p.activities.find(a=>'activity:'+a.id===id)?.title||'Removed item');};
 panel.innerHTML='<h3>'+(blockers.length?blockers.length+(blockers.length===1?' approval blocker':' approval blockers'):state.approved?'Approved locally':'Ready for overall review')+'</h3><p>Individual review checkboxes are optional. Approval confirms you reviewed the complete lesson; it does not save remotely.</p>'+blockers.map(b=>'<div class="blocker"><span><strong>'+esc(b.note)+'</strong> — '+esc(b.target==='revisions'?'Revision review':itemLabel(b.target))+'</span><div class="actions"><button '+(b.target==='revisions'?'data-view="revisions"':'data-edit-target="'+esc(b.target)+'"')+'>Open location</button>'+(b.flagId?' <button data-resolve-flag="'+esc(b.flagId)+'">Mark resolved</button>':'')+'</div></div>').join('')+(state.flags.some(f=>f.resolved)?'<details><summary>Resolved issue history</summary>'+state.flags.filter(f=>f.resolved).map(f=>'<p>'+esc(f.note)+' — '+esc(itemLabel(f.target))+' <button data-edit-target="'+esc(f.target)+'">Open location</button><button data-reopen-flag="'+esc(f.id)+'">Reopen</button></p>').join('')+'</details>':'');
 $('#warnings').innerHTML=(state.source.deckUrl===fixture.deckUrl?'<div class="warning"><strong>Known source correction.</strong> The official lesson’s Slides resource points to the answer key. This draft uses the confirmed presentation link. Official materials are unchanged.</div>':'')+p.warnings.map(w=>`<div class="warning">${esc(w)}</div>`).join('');
 $('#nav').innerHTML=[['preview','Lesson preview',p.sections.length],['front','Front matter',7],['guide','Teaching Guide',p.sections.length],['resources','Resources',p.resources.length],['revisions','Revision review',state.conflicts.length]].map(([id,label,count])=>`<button data-view="${id}" class="${view===id?'active':''}"${view===id?' aria-current="page"':''}>${label}<span>${count}</span></button>`).join('');
}
function render(){
 updateSummary();const p=state.draft;
 $('#view-title').textContent=titles[view][0];$('#view-description').textContent=titles[view][1];
 if(view==='preview'){
 $('#content').innerHTML=renderLesson(p,fields,fieldText);
 }else if(view==='front'){
  $('#content').innerHTML=`<div class="card"><div class="card-head"><h3>Lesson title</h3>${reviewControl('title')}</div><div class="pane"><label for="lesson-title">Title</label><input id="lesson-title" class="editor" value="${esc(p.title)}"></div></div>`+fields.map(([k,label])=>`<article class="card"><div class="card-head"><h3>${label}</h3>${reviewControl(k)}</div><div class="compare"><div class="pane"><div class="pane-label">Notion brief · source</div><div class="source-text">${esc(fieldText(k,state.source[k]))||'<em>No content supplied. Review whether this is intentional.</em>'}</div></div><div class="pane"><div class="pane-label">Level Builder · editable draft</div><label for="field-${k}" class="muted">${k==='objectives'?'One objective per line':k==='vocabulary'?'One term and definition per line':label+' Markdown'}</label><textarea id="field-${k}" class="editor" data-field="${k}" rows="${k.includes('Overview')?7:4}">${esc(fieldText(k,p.frontMatter[k]))}</textarea><button data-copy-field="${k}">Copy field</button></div></div></article>`).join('');
 }else if(view==='guide'){
  $('#content').innerHTML=`<div class="actions"><button id="add-activity">Add activity</button></div><div class="section-nav"><button data-activity="all" class="${activity==='all'?'active':''}">All activities</button>${p.activities.map(a=>`<button data-activity="${esc(a.id)}" class="${activity===a.id?'active':''}">${esc(a.title)} · ${a.duration} min</button>`).join('')}</div>`+p.activities.filter(a=>activity==='all'||activity===a.id).map(a=>`<article class="card"><div class="card-head"><h3>${esc(a.title)} · activity settings</h3>${reviewControl('activity:'+a.id)}${moveControls('activities',a)}<button data-add-section="${esc(a.id)}">Add section</button></div><div class="pane row"><div><label>Activity title<input class="editor" data-activity-field="title" data-id="${esc(a.id)}" value="${esc(a.title)}"></label></div><div><label>Duration in minutes<input class="editor" type="number" min="0" data-activity-field="duration" data-id="${esc(a.id)}" value="${a.duration}"></label></div></div></article>`+p.sections.filter(s=>s.activityId===a.id).map(s=>sectionCard(s)).join('')).join('');
 }else if(view==='resources'){
  $('#content').innerHTML=`<article class="card"><div class="card-head"><h3>Edit resources</h3>${reviewControl('resources')}</div><div class="pane">${resourceEditor(p.resources,state.resourceBuffer)}<p id="resource-error" role="alert"></p><div class="actions"><button class="primary" id="apply-resources">Apply resource edits</button><button id="discard-resources">Discard pending edits</button></div></div></article>`;
 }else{
  $('#content').innerHTML=`<div class="card review-card"><h3>${state.baseline?'An approved baseline is saved in this browser.':'No approved baseline yet.'}</h3><p>Review the assembled lesson, then approve the draft to establish a local baseline. Approval does not publish. Import revised sources to compare against that baseline while retaining your edits.</p><p>Incoming source deletions and conflicting changes always need a decision. A field kept intentionally will not be flagged again for the same source snapshot.</p><p class="muted">Compare saved destination reports without changing Level Builder. Link a saved report that matches your approved local baseline, then compare later reports. Local edits and source edits remain part of the three-way comparison.</p></div><article class="card review-card"><h3>Saved lesson revisions</h3><p>${state.destinationRevision?'Linked to '+esc(state.destinationRevision.destination.url):'No saved destination baseline linked.'}</p><label>Link matching saved baseline <input id="destination-baseline-file" type="file" accept=".json,application/json"></label><label>Compare newer saved report <input id="destination-revision-file" type="file" accept=".json,application/json" ${state.destinationRevision?'':'disabled'}></label><p role="status" id="destination-revision-status">${esc((state.destinationRevision?.notices||[]).join(' '))}</p></article>`+(state.conflicts.length?state.conflicts.map((c,i)=>`<article class="card review-card"><h3>${esc(c.label)}</h3><div class="compare"><div class="pane diff-old"><div class="pane-label">Your current draft</div><pre>${esc(display(c.current))}</pre></div><div class="pane diff-new"><div class="pane-label">${c.origin==='destination'?'Saved destination':'Incoming source'}</div><pre>${esc(display(c.incoming))}</pre></div></div><div class="actions"><button data-resolve="keep" data-index="${i}">Keep current</button><button data-resolve="edit" data-index="${i}">Edit manually</button><button data-resolve="incoming" data-index="${i}">${c.incoming==null?'Remove explicitly':'Use incoming'}</button></div></article>`).join(''):'<div class="card empty">No unresolved revision conflicts.</div>');
 }
 if(editTarget&&view!=='preview'&&view!=='revisions'){
 document.querySelectorAll('#content [data-review]').forEach(el=>{if(el.dataset.review!==editTarget)el.closest('.card').hidden=true;});
 $('#content').classList.add('targeted-editor');$('#content').classList.remove('show-source');
 const sourceToggle=document.querySelector('#content .card:not([hidden]) .compare')?'<button id="toggle-source" aria-pressed="false">Show source comparison</button>':'';
 $('#content').insertAdjacentHTML('afterbegin','<div class="actions editor-toolbar"><button data-view="preview">Return to lesson preview</button>'+sourceToggle+'<button data-flag-target="'+esc(editTarget)+'">Flag an issue here</button></div>');
 }else $('#content').classList.remove('targeted-editor');

}
function moveControls(kind,record){const items=kind==='sections'?state.draft.sections.filter(s=>s.activityId===record.activityId):state.draft.activities,index=items.findIndex(x=>x.id===record.id);return `<div class="actions"><button data-move-kind="${kind}" data-move-id="${esc(record.id)}" data-direction="-1" ${index===0?'disabled':''} aria-label="Move ${esc(record.title||'section')} earlier">Move up</button><button data-move-kind="${kind}" data-move-id="${esc(record.id)}" data-direction="1" ${index===items.length-1?'disabled':''} aria-label="Move ${esc(record.title||'section')} later">Move down</button></div>`;}
function sectionCard(s){return `<article class="card"><div class="card-head"><div><h3>${esc(s.title||'Untitled section')}</h3><small>${s.origin==='local'?'Added locally':'Slide '+s.slide}${s.duration?' · '+s.duration+' min':''}</small></div>${reviewControl(s.id)}${moveControls('sections',s)}</div><div class="compare"><div class="pane"><div class="pane-label">${s.origin==='local'?'Local addition · no source slide':'Speaker notes · source slide '+s.slide}</div><div class="source-text">${esc(s.sourceNotes)}</div><div class="chips">${s.changes.map(c=>`<span class="chip">${esc(c.from)} ${c.kind==='removed'?'removed':'→ '+c.to}</span>`).join('')}</div></div><div class="pane"><div class="pane-label">Level Builder · editable draft</div><div class="row"><div><label>Section title<input class="editor" data-section="${esc(s.id)}" data-prop="title" value="${esc(s.title)}"></label></div><div><label>Minutes<input class="editor" type="number" min="0" data-section="${esc(s.id)}" data-prop="duration" value="${s.duration ?? ''}"></label></div></div><label class="inline-check"><input type="checkbox" data-section="${esc(s.id)}" data-prop="remarks" ${s.remarks?'checked':''}> Remarks <span class="muted">(rendering not yet verified)</span></label><label for="body-${esc(s.id)}">Teaching guidance · Markdown and icon HTML</label><textarea id="body-${esc(s.id)}" class="editor" rows="9" data-section="${esc(s.id)}" data-prop="body">${esc(s.body)}</textarea><button data-copy-section="${esc(s.id)}">Copy guidance</button><details><summary class="muted">Text preview (icons shown as markers)</summary><div class="preview">${preview(s.body)}</div></details>${s.callouts.map((c,i)=>`<div class="callout"><label for="callout-${esc(s.id)}-${i}">${esc(c.type)}</label><textarea id="callout-${esc(s.id)}-${i}" class="editor" rows="4" data-callout="${i}" data-section="${esc(s.id)}">${esc(c.body)}</textarea></div>`).join('')}${s.progression?`<div class="level"><strong>${esc(s.progression.title)}</strong><br>${s.progression.levels.map(l=>`Level ${l.number} · ${esc(l.key)}`).join('<br>')}<br><span class="muted">Preserved association metadata; not published.</span></div>`:''}${insertionToolbar(s)}</div></div></article>`;}
function display(v){return v==null?'Source removed this item':typeof v==='string'?v:JSON.stringify(v,null,2);}
function mergeSource(source){
 const result=mergeSources(state,source);state=result.state;
 persist();view=result.conflicts?'revisions':view;render();notice(`${result.updates} source updates applied. ${result.conflicts} conflicts need your decision. Local edits are preserved.`);
}
function openEditor(id){
 if(!requiredIds().includes(id)){notice('This item is no longer in the draft. Review its issue note and resolve or reopen it deliberately.');return;}
 editTarget=id;activity='all';view=id==='resources'?'resources':id.startsWith('activity:')||state.draft.sections.some(s=>s.id===id)?'guide':'front';render();$('#view-title').scrollIntoView({block:'start'});$('#content .card:not([hidden]) .editor')?.focus({preventScroll:true});
}
async function copy(text){try{await navigator.clipboard.writeText(text);notice('Copied to clipboard.');}catch{notice('Clipboard access unavailable. Select the text and copy it manually.');}}
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.view){const returnTo=b.dataset.view==='preview'?editTarget:null;view=b.dataset.view;editTarget=null;render();if(returnTo){const card=Array.from(document.querySelectorAll('[data-preview-id]')).find(el=>el.dataset.previewId===returnTo);card?.scrollIntoView({block:'start'});card?.focus({preventScroll:true});}else $('#view-title').focus();}
 if(b.dataset.addCallout||b.dataset.addSection){
  const sectionMode=Boolean(b.dataset.addSection);
  $('#addition-kind').value=sectionMode?'section':b.dataset.calloutType;
  $('#addition-target').value=sectionMode?b.dataset.addSection:b.dataset.addCallout;
  $('#addition-after').value=b.dataset.afterSection||'';
  $('#addition-heading').textContent=sectionMode?'Add teaching section':'Add '+b.dataset.calloutType.toLowerCase();
  $('#addition-section-fields').hidden=!sectionMode;
  $('#addition-title').value='';$('#addition-minutes').value='';$('#addition-body').value='';$('#addition-error').textContent='';
  $('#addition-dialog').showModal();(sectionMode?$('#addition-title'):$('#addition-body')).focus();
 }
 if(b.id==='add-activity'){$('#activity-title').value='';$('#activity-minutes').value='0';$('#activity-error').textContent='';$('#activity-dialog').showModal();}
 if(b.dataset.moveKind){try{if(moveRecord(state.draft,b.dataset.moveKind,b.dataset.moveId,Number(b.dataset.direction))){state.reviewed=[];changed(b.dataset.moveId);render();notice('Lesson order updated locally.');}}catch(error){notice(error.message);}}
 if(b.dataset.editTarget)openEditor(b.dataset.editTarget);
 if(b.dataset.flagTarget){$('#flag-target').value=b.dataset.flagTarget;$('#flag-note').value='';$('#flag-error').textContent='';$('#flag-dialog').showModal();}
 if(b.dataset.resolveFlag){state.flags.find(f=>f.id===b.dataset.resolveFlag).resolved=true;persist();render();notice('Issue marked resolved. Review the lesson before approving.');}
 if(b.dataset.reopenFlag){state.flags.find(f=>f.id===b.dataset.reopenFlag).resolved=false;state.approved=false;persist();render();}
 if(b.id==='toggle-source'){const show=$('#content').classList.toggle('show-source');b.setAttribute('aria-pressed',String(show));b.textContent=show?'Hide source comparison':'Show source comparison';}
 if(b.id==='discard-resources'){delete state.resourceBuffer;persist();render();notice('Pending resource edits discarded. Applied records retained.');}
 if(b.dataset.reviewJump){editTarget=null;const id=b.dataset.reviewJump;view=id==='resources'?'resources':id.startsWith('activity:')||state.draft.sections.some(s=>s.id===id)?'guide':'front';activity='all';render();const target=Array.from(document.querySelectorAll('[data-review]')).find(el=>el.dataset.review===id);target?.closest('.card')?.scrollIntoView({behavior:'smooth',block:'start'});target?.focus({preventScroll:true});}
 if(b.dataset.activity){activity=b.dataset.activity;render();}
 if(b.dataset.copyField)await copy(fieldText(b.dataset.copyField,state.draft.frontMatter[b.dataset.copyField]));
 if(b.dataset.copySection)await copy(state.draft.sections.find(s=>s.id===b.dataset.copySection).body);
 if(b.dataset.resolve){try{const i=Number(b.dataset.index),c=state.conflicts[i];state=resolveSourceConflict(state,i,b.dataset.resolve);persist();if(b.dataset.resolve==='edit'){editTarget=null;view=c.kind.startsWith('section')||c.kind.startsWith('activity')?'guide':c.key==='resources'?'resources':'front';}render();notice(b.dataset.resolve==='edit'?'Current content retained for editing.':'Conflict decision recorded.');}catch(error){notice(error.message);}}
 if(b.id==='apply-resources'){try{const resources=resourceDraft(state.draft.resources,state.resourceBuffer);validateSource({...state.source,resources});state.draft.resources=resources;delete state.resourceBuffer;changed('resources');render();notice('Resource edits applied. Review audience and destinations.');}catch(err){$('#resource-error').textContent=err.message;}}
});
document.addEventListener('input',e=>{
 const el=e.target;
 if(el.dataset.resourceField){state.resourceBuffer=updateResource(state.draft.resources,state.resourceBuffer,Number(el.dataset.resourceIndex),el.dataset.resourceField,el.value);changed('resources');$('#resource-error').textContent='';}
 if(el.id==='resource-json'){state.resourceBuffer=el.value;changed('resources');}
 if(el.id==='lesson-title'){state.draft.title=el.value;changed('title');}
 if(el.dataset.field){const k=el.dataset.field;const value=['objectives','vocabulary'].includes(k)?el.value.split('\n').filter(x=>x.trim()):el.value;const orderOnly=k==='objectives'&&objectivesEqual(state.draft.frontMatter[k],value);state.draft.frontMatter[k]=value;if(orderOnly)persist();else changed(k);}
 if(el.dataset.section){const s=state.draft.sections.find(s=>s.id===el.dataset.section);if(el.dataset.callout!==undefined)s.callouts[Number(el.dataset.callout)].body=el.value;else{const k=el.dataset.prop;s[k]=k==='remarks'?el.checked:k==='duration'?(el.value.trim()===''?null:Math.max(0,Number(el.value)||0)):el.value;}changed(s.id);}
 if(el.dataset.activityField){const a=state.draft.activities.find(a=>a.id===el.dataset.id);a[el.dataset.activityField]=el.dataset.activityField==='duration'?Math.max(0,Number(el.value)||0):el.value;state.draft.duration=state.draft.activities.reduce((n,a)=>n+a.duration,0);changed('activity:'+a.id);}
});
document.addEventListener('change',e=>{if(e.target.dataset.review){const id=e.target.dataset.review;state.reviewed=state.reviewed.filter(x=>x!==id);if(e.target.checked)state.reviewed.push(id);else state.approved=false;persist();updateSummary();}});
$('#sources').onclick=()=>{$('#source-input').value=JSON.stringify(state.source,null,2);$('#import-error').textContent='';$('#import-dialog').showModal();};
let importingSources=false;
$('#source-file').onchange=async e=>{
 const files=[...e.target.files];if(!files.length)return;
 importingSources=true;$('#generate').disabled=true;$('#source-file').disabled=true;$('#import-error').textContent='Reading source files…';
 try{const imports=await Promise.all(files.map(importSourceFile)),result=combineSourceImports(JSON.parse($('#source-input').value),imports);$('#source-input').value=JSON.stringify(result.source,null,2);$('#import-error').textContent=`Ready to compare: ${result.source.slides.length} slides; ${result.source.slides.filter(s=>s.notes.trim()).length} with notes. ${result.warnings.join(' ')}`;}
 catch(error){$('#import-error').textContent=error.message+' The source package and draft were not changed.';}
 finally{importingSources=false;$('#generate').disabled=false;$('#source-file').disabled=false;e.target.value='';}
};
$('#generate').onclick=()=>{if(importingSources)return;try{const source=JSON.parse($('#source-input').value);validateSource(source);mergeSource(source);$('#import-dialog').close();}catch(err){$('#import-error').textContent=err.message;}};
$('#download-source').onclick=()=>download('lesson-source-template.json',JSON.stringify(fixture,null,2),'application/json');
$('#save-activity').onclick=()=>{try{const id=addActivity(state.draft,{id:'local-activity-'+crypto.randomUUID(),title:$('#activity-title').value,duration:Number($('#activity-minutes').value)});changed('activity:'+id);$('#activity-dialog').close();openEditor('activity:'+id);notice('Activity added. Add teaching sections to complete it.');}catch(error){$('#activity-error').textContent=error.message;}};
$('#save-addition').onclick=()=>{try{
 const kind=$('#addition-kind').value,target=$('#addition-target').value;
 const id=kind==='section'?addSection(state.draft,{id:'local-section-'+crypto.randomUUID(),activityId:target,afterId:$('#addition-after').value,title:$('#addition-title').value,body:$('#addition-body').value,duration:$('#addition-minutes').value.trim()===''?null:Number($('#addition-minutes').value)}):addCallout(state.draft,target,kind,$('#addition-body').value);
 changed(id);$('#addition-dialog').close();openEditor(id);notice(kind==='section'?'Section added locally. Review it in the lesson preview.':'Callout added locally. Review it in the lesson preview.');
 }catch(err){$('#addition-error').textContent=err.message;}};
$('#save-flag').onclick=()=>{try{const target=$('#flag-target').value;addFlag(state,target,$('#flag-note').value,crypto.randomUUID());persist();render();$('#flag-dialog').close();
 // Saving rebuilds the preview and removes the original invoker. Focus its replacement.
 Array.from(document.querySelectorAll('[data-flag-target]')).find(button=>button.dataset.flagTarget===target)?.focus();
 notice('Issue saved. Use Open location to edit that item.');}catch(err){$('#flag-error').textContent=err.message;}};
$('#approve').onclick=()=>{try{approveDraft(state);persist();render();notice('Approved baseline saved locally. No Level Builder changes were made.');}catch(err){notice(err.message);}};
$('#export').onclick=()=>{$('#export-status').textContent=state.approved?'This draft is approved locally.':'This export is an unapproved draft. '+approvalBlockers(state).length+' approval blockers. Pending resource edits are included as notes in JSON, not applied lesson content.';$('#export-dialog').showModal();};
$('#md-export').onclick=()=>download('lesson-review.md',exportMarkdown(state.draft),'text/markdown');
const reviewPackage=()=>({schemaVersion:1,status:state.approved?'approved-locally':'draft',sandbox:SANDBOX,published:false,source:state.source,lesson:state.draft,baseline:state.baseline,conflicts:state.conflicts,review:{flags:state.flags,reviewed:state.reviewed,resourceBuffer:state.resourceBuffer??null}});
$('#transfer').onclick=()=>{try{sessionStorage.setItem('lesson-transfer-input',JSON.stringify(reviewPackage()));location.href='transfer.html';}catch{notice('The transfer package could not be passed to the review page. Export JSON and paste it there instead.');}};
$('#json-export').onclick=()=>download('lesson-review-package.json',JSON.stringify(reviewPackage(),null,2),'application/json');
$('#reset').onclick=()=>$('#reset-dialog').showModal();
$('#confirm-reset').onclick=()=>{state=fresh();persist();render();$('#reset-dialog').close();notice('Local workspace reset to the verified source snapshot.');};
installContentAuthoring({getDraft:()=>state.draft,canAddResource:()=>state.resourceBuffer==null,changed,openEditor,notice});
render();

$('#workspace-backup').onclick=()=>download('lesson-workspace-backup.json',JSON.stringify(workspaceBackup(state),null,2),'application/json');
$('#workspace-restore').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>32000000)throw Error('Choose a workspace backup smaller than 32 MB.');const id=crypto.randomUUID();restoreWorkspace(localStorage,await file.text(),id);const target=new URL(location.href);target.searchParams.set('workspace',id);location.href=target;}catch(error){notice('Backup was not opened. '+error.message+' Your current workspace is unchanged.');}finally{e.target.value='';}};

const pendingSourceId=new URL(location.href).searchParams.get('sourceImport');
if(pendingSourceId){try{const item=JSON.parse(localStorage.getItem('lesson-studio-pending-source-'+pendingSourceId));if(!item)throw Error('The imported deck is no longer available. Import it again from its Slides tab.');const result=combineSourceImports(state.source,[item]);$('#source-input').value=JSON.stringify(result.source,null,2);$('#import-error').textContent=`Imported ${item.kind==='brief'?'Notion brief':result.source.slides.length+' slides'}. ${result.warnings.join(' ')} Review the combined sources before generating.`;$('#import-dialog').showModal();}catch(error){notice(error.message);}}

let importingDestination=false;
document.addEventListener('change',async event=>{
 const input=event.target;if(!['destination-baseline-file','destination-revision-file'].includes(input.id))return;
 const file=input.files[0];if(!file)return;if(importingDestination){notice('Wait for the current saved report to finish loading.');input.value='';return;}importingDestination=true;input.disabled=true;
 try{
 if(input.id==='destination-baseline-file'){state=await prepareWorkspaceImport(()=>state,file,connectDestinationBaseline);persist();render();notice('Saved destination baseline linked. No local or remote content changed.');}
 else{const result=await prepareWorkspaceImport(()=>state,file,mergeDestinationReport);state=result.state;persist();render();notice(`${result.updates} saved-lesson updates applied locally; ${result.conflicts} conflicts require decisions. Level Builder is unchanged. ${result.notices.join(' ')}`);}
 }catch(error){notice(error.message);}finally{importingDestination=false;input.disabled=false;input.value='';}
});

if(location.protocol==='http:'&&['127.0.0.1','localhost'].includes(location.hostname)){const link=new URL('notion.html',location.href);if(workspaceId)link.searchParams.set('workspace',workspaceId);$('#notion-link').href=link.href;}

$('#publish').onclick=()=>{try{const pkg=reviewPackage(),problems=approvalBlockers(state);if(!state.approved||problems.length)throw Error('Review and approve the complete lesson before publishing.');sessionStorage.setItem('lesson-publication-input',JSON.stringify(pkg));location.href='publish.html';}catch(error){notice(error.message);}};
