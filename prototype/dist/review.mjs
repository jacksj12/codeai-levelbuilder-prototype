import {structureProblems} from './source-revisions.mjs';
import {renderMarkdown} from './preview-markdown.mjs';
// Local review rules. No network requests or destination writes.
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function approvalBlockers(state){
 return [
  ...structureProblems(state.draft).map(note=>({target:'guide',note})),
  ...(state.flags||[]).filter(f=>!f.resolved).map(f=>({target:f.target,note:f.note,flagId:f.id})),
  ...(state.conflicts.length?[{target:'revisions',note:`${state.conflicts.length} source conflicts need a decision`}]:[]),
  ...(state.resourceBuffer!=null?[{target:'resources',note:'Apply or discard pending resource edits'}]:[])
 ];
}
export function addFlag(state,target,note,id){
 if(!note.trim())throw Error('Describe what needs to change.');
 state.flags??=[];
 state.flags.push({id,target,note:note.trim(),resolved:false});
 state.approved=false;
}
export function approveDraft(state){
 if(approvalBlockers(state).length)throw Error('Resolve the listed approval blockers first.');
 state.baseline=structuredClone(state.draft);
 state.approved=true;
}
export const previewText=(text,resources=[])=>renderMarkdown(text,resources);

export function resourceList(resources){
 const esc=escapeHtml;
 return resources.map(r=>`<div class="resource"><h3>${esc(r.name)} — ${esc(r.type)}</h3><p>${esc(r.audience)}</p><a href="${esc(/^https:\/\//.test(r.url)?r.url:'#')}" target="_blank" rel="noopener">${esc(r.url)}</a></div>`).join('');
}
export function renderLesson(p,fields,fieldText){
 const esc=escapeHtml;
 const card=(id,title,body)=>`<article class="card lesson-preview" tabindex="-1" data-preview-id="${esc(id)}"><div class="card-head"><h3>${esc(title)}</h3><div class="actions"><button data-flag-target="${esc(id)}" aria-label="Flag an issue: ${esc(title)}">Flag an issue</button></div></div><div class="pane">${body}</div></article>`;
 const text=value=>`<div class="preview">${previewText(value,p.resources)||'<em>No content supplied.</em>'}</div>`;
 return '<p>Assembled from your current draft. Markdown support is limited and icons are markers; this approximates Level Builder. Flag issues as you read, then approve the complete lesson.</p>'
  +card('title','Lesson title',text(p.title))
  +fields.map(([key,label])=>card(key,label,key==='objectives'?`<ul>${p.frontMatter.objectives.map(o=>`<li>${previewText(o)}</li>`).join('')}</ul>`:text(fieldText(key,p.frontMatter[key])))).join('')
  +card('resources','Resources',resourceList(p.resources))
  +'<h2>Teaching Guide</h2>'
  +p.activities.map(a=>card('activity:'+a.id,`${a.title} · ${a.duration} minutes`,'<p>Activity timing</p>')
   +p.sections.filter(s=>s.activityId===a.id).map(s=>card(s.id,s.title||'Untitled section',
    `<p class="muted">${s.origin==='local'?'Added locally':'Slide '+esc(s.slide)}${s.duration!=null?` · ${esc(s.duration)} minutes`:''}${s.remarks?' · Remarks':''}</p>`
    +text(s.body)
    +s.callouts.map(c=>`<aside class="callout"><h4>${esc(c.type)}</h4>${text(c.body)}</aside>`).join('')
    +(s.progression?`<div class="level"><strong>${esc(s.progression.title)}</strong>${s.progression.levels.map(l=>`<div>Level ${esc(l.number)} · ${esc(l.key)}${l.url?` — <a href="${esc(/^https:\/\//.test(l.url)?l.url:'#')}" target="_blank" rel="noopener">Open level</a>`:''}${l.assessment?' · Assessment':''}${l.mappingStatus==='unverified'?' · Destination verification needed':''}</div>`).join('')}</div>`:''))).join('')).join('');
}
