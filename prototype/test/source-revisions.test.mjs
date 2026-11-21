import test from 'node:test';
import assert from 'node:assert/strict';
import {generate} from '../dist/core.mjs';
import {mergeSources,resolveSourceConflict,structureProblems} from '../dist/source-revisions.mjs';
import {approvalBlockers} from '../dist/review.mjs';
const source=()=>({title:'Synthetic lesson',teacherOverview:'Teacher',studentOverview:'Student',preparation:'Prep',objectives:['One','Two'],resources:[],slides:[{id:'a',number:1,notes:'Activity (10 minutes)'},{id:'s',number:2,notes:'Original instruction'},{id:'b',number:3,notes:'Wrap (5 minutes)'},{id:'t',number:4,notes:'Reflect'}]});
const state=()=>{const s=source(),p=generate(s);return {source:s,generated:p,draft:structuredClone(p),baseline:structuredClone(p),reviewed:['title'],flags:[],conflicts:[],approved:true};};
test('source and local edits to different fields merge without a false conflict',()=>{
 const s=state();s.draft.sections[0].title='Local heading';const next=source();next.slides[1].notes='New source instruction';
 const result=mergeSources(s,next);assert.equal(result.conflicts,0);assert.equal(result.state.draft.sections[0].title,'Local heading');assert.equal(result.state.draft.sections[0].body,'New source instruction');assert.equal(s.draft.sections[0].body,'Original instruction');
});
test('same-field conflicts show base, current and incoming and keep decisions remain stable',()=>{
 const s=state();s.draft.sections[0].body='Local instruction';const next=source();next.slides[1].notes='New instruction';
 const result=mergeSources(s,next);assert.equal(result.conflicts,1);assert.equal(result.state.conflicts[0].base,'Original instruction');
 const kept=resolveSourceConflict(result.state,0,'keep');assert.equal(mergeSources(kept,next).conflicts,0);assert.equal(kept.draft.sections[0].body,'Local instruction');
});
test('deleted activities retain all children until one explicit grouped deletion and never orphan local guidance',()=>{
 const s=state();s.draft.sections.push({...structuredClone(s.draft.sections[0]),id:'local',origin:'local'});
 const next=source();next.slides=next.slides.slice(2);const result=mergeSources(s,next);
 assert.equal(result.conflicts,1);assert.equal(result.state.conflicts[0].kind,'activity-group');assert.equal(result.state.conflicts[0].current.sections.length,2);assert.deepEqual(structureProblems(result.state.draft),[]);
 const removed=resolveSourceConflict(result.state,0,'incoming');assert.deepEqual(removed.draft.sections.map(s=>s.id),['t']);assert.deepEqual(removed.draft.activities.map(a=>a.id),['b']);assert.equal(removed.draft.duration,5);
 const kept=resolveSourceConflict(result.state,0,'keep');assert.equal(mergeSources(kept,next).conflicts,0);assert.equal(kept.draft.sections.length,3);
});
test('blank front matter requires a deletion decision and objective reordering preserves approval',()=>{
 const s=state(),next=source();next.teacherOverview='';const result=mergeSources(s,next);assert.equal(result.conflicts,1);assert.equal(result.state.draft.frontMatter.teacherOverview,'Teacher');
 const removed=resolveSourceConflict(result.state,0,'incoming');assert.equal(removed.draft.frontMatter.teacherOverview,'');
 const reordered=source();reordered.objectives.reverse();const stable=mergeSources(s,reordered);assert.equal(stable.updates,0);assert.equal(stable.state.approved,true);
});
test('orphan drafts block approval and failed resolution leaves the original state intact',()=>{
 const s=state();s.draft.sections[0].activityId='missing';assert.ok(approvalBlockers(s).some(b=>b.note.includes('no activity')));
 const healthy=state();healthy.conflicts=[{kind:'root',key:'activities',incoming:[]}];assert.throws(()=>resolveSourceConflict(healthy,0,'incoming'),/no activity/);assert.equal(healthy.draft.activities.length,2);
});
test('source reordering is applied without dropping locally added records',()=>{
 const s=state(),next=source();next.slides.splice(1,0,{id:'n',number:5,notes:'New instruction'});
 const r=mergeSources(s,next);assert.equal(r.conflicts,0);assert.deepEqual(r.state.draft.sections.map(s=>s.id),['n','s','t']);assert.deepEqual(structureProblems(r.state.draft),[]);
});

test('local source order survives unchanged import with local records between source sections',()=>{
 const s=state();s.draft.sections.reverse();s.draft.sections.splice(1,0,{...structuredClone(s.draft.sections[0]),id:'local'});
 const result=mergeSources(s,source());assert.deepEqual(result.state.draft.sections.map(x=>x.id),['t','local','s']);assert.equal(result.updates,0);
});
test('new source activities are ordered before existing groups without losing local activities',()=>{
 const s=state();s.draft.activities.push({id:'local',title:'Local',duration:0});const next=source();next.slides.unshift({id:'new-activity',number:0,notes:'Introduction (2 minutes)'},{id:'new-section',number:8,notes:'Intro'});
 const result=mergeSources(s,next);assert.deepEqual(result.state.draft.activities.map(x=>x.id),['new-activity','a','b','local']);assert.deepEqual(result.state.draft.sections.map(x=>x.id),['new-section','s','t']);
});
