import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generate,reconcileObjectives,objectivesEqual} from '../dist/core.mjs';
import {approvalBlockers,addFlag,approveDraft,renderLesson,previewText} from '../dist/review.mjs';
const fixture=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
const workspace=()=>({draft:generate(fixture),reviewed:['title'],baseline:null,conflicts:[],approved:false});

test('overall approval preserves edits and existing review marks without per-field checks',()=>{
 const s=workspace();s.draft.title='My edit';approveDraft(s);
 assert.equal(s.approved,true);assert.equal(s.baseline.title,'My edit');assert.deepEqual(s.reviewed,['title']);
 s.draft.title='later';assert.equal(s.baseline.title,'My edit');
});
test('flags need notes and remain blockers after editing until explicitly resolved',()=>{
 const s=workspace();approveDraft(s);
 assert.throws(()=>addFlag(s,'title','  ','a'),/Describe/);
 addFlag(s,'title','Fix heading','a');assert.equal(s.approved,false);
 assert.equal(approvalBlockers(s)[0].target,'title');assert.throws(()=>approveDraft(s),/blockers/);
 s.draft.title='Fixed';assert.equal(approvalBlockers(s).length,1);
 s.flags[0].resolved=true;approveDraft(s);assert.equal(s.flags[0].note,'Fix heading');
});
test('flags, conflicts and pending resource edits all block approval and survive storage',()=>{
 const s=workspace();addFlag(s,'resources','Wrong link','a');s.conflicts=[{}];s.resourceBuffer='{';
 assert.equal(approvalBlockers(s).length,3);assert.throws(()=>approveDraft(s),/blockers/);
 assert.deepEqual(approvalBlockers(JSON.parse(JSON.stringify(s))),approvalBlockers(s));
});
test('assembled preview includes edits, resources, every section, callouts and level metadata',()=>{
 const p=generate(fixture);p.sections[0].body='User edited guidance';
 const html=renderLesson(p,[['teacherOverview','Teacher overview']],(k,v)=>v);
 assert.ok(html.includes('User edited guidance'));
 assert.ok(!html.includes('data-edit-target='));
 assert.ok(!html.includes('data-insert-kind='));
 assert.ok(!html.includes('data-add-section='));
 assert.equal((html.match(/data-preview-id=/g)||[]).length,16);
 for(const r of p.resources){assert.ok(html.includes(r.type));assert.ok(html.includes(r.audience));}
 for(const s of p.sections){assert.ok(html.includes('data-flag-target="'+s.id+'"'));for(const c of s.callouts)assert.ok(html.includes(c.type));}
 assert.ok(html.includes('csp-unit1-lesson16-cfu3_27_28'));
});
test('preview escapes HTML and unsafe resource links',()=>{
 const p=generate(fixture);p.title='<script>alert(1)</script>';p.resources[0].url='javascript:alert(1)';
 const html=renderLesson(p,[],()=> '');assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));
 assert.equal(previewText('<img onerror="bad">'),'&lt;img onerror=&quot;bad&quot;&gt;');
});
test('objective reordering preserves the current text and does not count as a source update',()=>{
 assert.equal(objectivesEqual(['First','Second'],['Second','First']),true);
 assert.deepEqual(reconcileObjectives(['First','Second'],['First','Second'],['Second','First']),{value:['First','Second'],status:'unchanged'});
 assert.deepEqual(reconcileObjectives(['First','Second'],['Local','Second'],['Second','First']),{value:['Local','Second'],status:'kept'});
});
test('objective comparison detects missing, duplicate and edited text',()=>{
 assert.equal(objectivesEqual(['First','Second'],['First','First']),false);
 assert.equal(objectivesEqual(['First'],['first']),false);
 for(const incoming of [[],['First'],['First','Changed']])assert.equal(reconcileObjectives(['First','Second'],['First','Second'],incoming).status,'conflict');
 assert.equal(reconcileObjectives(['First','First'],['First','First'],['First']).status,'conflict');
 assert.equal(reconcileObjectives(['First'],['First'],['First','Second']).status,'updated');
});
