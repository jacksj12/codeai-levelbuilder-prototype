import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generate,reconcile,exportMarkdown} from '../dist/core.mjs';
import {addCallout,addSection} from '../dist/editing.mjs';
import {renderLesson} from '../dist/review.mjs';
const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));

test('added tips and assessment opportunities survive unchanged-source reconciliation, preview and export',()=>{
 const base=generate(source),draft=structuredClone(base),id=draft.sections[0].id;
 addCallout(draft,id,'Teaching Tip','A locally authored tip.');
 addCallout(draft,id,'Assessment Opportunity','A locally authored assessment.');
 const result=reconcile(base.sections[0],draft.sections[0],generate(source).sections[0]);
 assert.equal(result.status,'kept');assert.equal(result.value.callouts.length,base.sections[0].callouts.length+2);
 const html=renderLesson(draft,[],()=> '');const markdown=exportMarkdown(draft);
 for(const text of ['A locally authored tip.','A locally authored assessment.']){assert.ok(html.includes(text));assert.ok(markdown.includes(text));}
 assert.deepEqual(draft.sections.slice(1),base.sections.slice(1));
});
test('inserted section keeps activity membership, order, blank timing and provenance through storage and export',()=>{
 const draft=generate(source),originalIds=draft.sections.map(s=>s.id),after=draft.sections[0];
 addSection(draft,{id:'local-section-test',activityId:after.activityId,afterId:after.id,title:'New guidance',body:'Keep this new material.',duration:null});
 const restored=JSON.parse(JSON.stringify(draft));
 assert.equal(restored.sections[1].id,'local-section-test');assert.equal(restored.sections[1].duration,null);
 assert.deepEqual(restored.sections.filter(s=>s.id!=='local-section-test').map(s=>s.id),originalIds);
 assert.equal(reconcile(null,restored.sections[1],null).status,'kept');
 assert.match(exportMarkdown(restored),/New guidance\nSource: added locally/);
 assert.ok(renderLesson(restored,[],()=> '').includes('Keep this new material.'));
 assert.equal(restored.duration,45);
});
test('invalid additions do not mutate lesson content',()=>{
 const draft=generate(source),before=structuredClone(draft),first=draft.sections[0];
 for(const [target,type,body] of [['missing','Teaching Tip','text'],[first.id,'Unknown','text'],[first.id,'Teaching Tip','  ']])assert.throws(()=>addCallout(draft,target,type,body));
 const valid={id:'new',activityId:first.activityId,afterId:first.id,title:'New',body:'Text',duration:null};
 for(const changes of [{activityId:'missing'},{id:first.id},{afterId:draft.sections.at(-1).id},{duration:-1},{duration:NaN},{body:' '}])assert.throws(()=>addSection(draft,{...valid,...changes}));
 assert.deepEqual(draft,before);
});
