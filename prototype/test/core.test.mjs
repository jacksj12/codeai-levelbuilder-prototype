import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generate,convertNotes,reconcile,exportMarkdown,validateSource,canWrite} from '../dist/core.mjs';
const fixture=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
test('B1/B2 complete front matter with corrected resource audience and URL',()=>{
 const p=generate(fixture); assert.equal(p.frontMatter.objectives.length,3); assert.notEqual(p.frontMatter.teacherOverview,p.frontMatter.studentOverview);
 assert.deepEqual(p.frontMatter.vocabulary,[]);assert.equal(p.resources.length,3);
 assert.match(p.resources.find(r=>r.type==='Slides').url,/presentation\/d\//);
 assert.equal(p.resources.find(r=>r.type==='Answer Key').audience,'Verified Teacher');
});
test('A3/B3 14 slides become 3 activities and 10 sections without lost notes',()=>{
 const p=generate(fixture);assert.deepEqual(p.activities.map(a=>[a.title,a.duration]),[['Warm Up',5],['Activity',35],['Wrap Up',5]]);
 assert.equal(p.sections.length,10);assert.deepEqual(p.sections.map(s=>s.slide),[3,4,5,7,8,9,10,11,13,14]);
 assert.equal(p.duration,45);assert.deepEqual(p.sections.filter(s=>s.duration).map(s=>s.duration),[20,10,5]);
 assert.match(p.sections.at(-1).body,/real consequences/);
});
test('B4/B6 callouts stay attached, levels remain structured',()=>{
 const p=generate(fixture); const c=p.sections.flatMap(s=>s.callouts);
 assert.equal(c.filter(c=>c.type==='Teaching Tip').length,4);assert.equal(c.filter(c=>c.type==='Assessment Opportunity').length,2);
 assert.equal(p.sections.find(s=>s.slide===10).progression.levels[0].key,'csp-unit1-lesson16-library-chatbot_27_28');
 assert.deepEqual(p.sections.find(s=>s.slide===11).progression.levels.map(l=>l.number),[2,3,4]);
 assert.ok(p.sections.every(s=>!s.body.includes('Teaching Tip\n')));
});
test('A1/A2/A4 marker conversion preserves prose and emphasis; unsupported emoji logged',()=>{
 const r=convertNotes('☑️ Do This: Keep **this**.\n\n🦄 Keep this instruction.\n💬 Discuss: Why?');
 assert.match(r.text,/fa-check-square-o/); assert.match(r.text,/\*\*this\*\*/);assert.match(r.text,/Keep this instruction/); assert.ok(!r.text.includes('🦄'));assert.ok(r.changes.some(c=>c.kind==='removed'));
});
test('B9 three-way merge retains local edits and flags conflicting updates or deletions',()=>{
 assert.deepEqual(reconcile('old','local','old'),{value:'local',status:'kept'});
 assert.deepEqual(reconcile('old','old','new'),{value:'new',status:'updated'});
 assert.equal(reconcile('old','local','new').status,'conflict');
 assert.equal(reconcile('old','old',null).status,'conflict');
 assert.equal(reconcile(['approved'],['approved'],[]).status,'conflict');
});
test('B10 repeat unchanged generation is stable',()=>assert.deepEqual(generate(fixture),generate(fixture)));
test('B11 this prototype cannot write even to its sandbox',()=>{
 for(const u of ['https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11','https://levelbuilder-studio.code.org/courses/csp-dev-2027/units/1/lessons/16','https://levelbuilder-studio.code.org/s/csp-unit1-dev-27-28/lessons/16/edit'])assert.equal(canWrite(u),false);
});
test('B12 invalid input and teacher answer key in student resources are rejected',()=>{
 assert.throws(()=>validateSource({}),/title/);
 const bad=structuredClone(fixture);bad.resources[1].audience='Student';assert.throws(()=>validateSource(bad),/Answer Key/);
 bad.resources[1].audience='Verified Teacher';bad.resources[0].url='javascript:alert(1)';assert.throws(()=>validateSource(bad),/https/);
});
test('export includes whole lesson and is explicitly a review artifact',()=>{
 const out=exportMarkdown(generate(fixture)); for(const t of ['Student overview','Objectives','Preparation','Resources','Teaching Guide','Assessment Opportunity','Wrap Up','csp-unit1-lesson16-cfu3_27_28']) assert.ok(out.includes(t),t);
});
