import test from 'node:test';
import assert from 'node:assert/strict';
import {addActivity,addSection,moveRecord,CALLOUT_TYPES} from '../dist/editing.mjs';
import {generate,exportMarkdown} from '../dist/core.mjs';
import {mergeSources} from '../dist/source-revisions.mjs';
test('added activities and section ordering survive source refresh and export',()=>{
 const source={title:'Test',slides:[{id:'a',number:1,notes:'Start (1 minute)'},{id:'s',number:2,notes:'Existing'}]},draft=generate(source),generated=structuredClone(draft);
 addActivity(draft,{id:'local',title:'Practice',duration:5});
 for(const id of ['first','second'])addSection(draft,{id,activityId:'local',title:id,body:id,duration:0});
 assert.equal(moveRecord(draft,'sections','second',-1),true);assert.equal(moveRecord(draft,'sections','second',-1),false);
 moveRecord(draft,'activities','local',-1);assert.equal(draft.duration,6);
 const result=mergeSources({draft,generated,source,conflicts:[],reviewed:[],approved:false},source).state.draft;
 assert.deepEqual(result.activities.map(x=>x.id),['local','a']);assert.deepEqual(result.sections.map(x=>x.id),['s','second','first']);
 assert.ok(exportMarkdown(result).indexOf('Practice')<exportMarkdown(result).indexOf('Start'));assert.equal(result.sections[1].duration,0);
});
test('invalid activity and ordering operations preserve authored content',()=>{
 const draft={activities:[],sections:[],duration:0};assert.throws(()=>addActivity(draft,{id:'x',title:'',duration:1}));assert.throws(()=>addActivity(draft,{id:'x',title:'X',duration:-1}));assert.deepEqual(draft.activities,[]);
 addActivity(draft,{id:'x',title:'X',duration:0});assert.throws(()=>addActivity(draft,{id:'x',title:'Duplicate',duration:0}));assert.throws(()=>moveRecord(draft,'sections','missing',1));assert.equal(draft.activities.length,1);
});
test('all five source callout types become structured callouts in order',()=>{
 const lesson=generate({title:'Test',slides:[{id:'s',number:1,notes:'Guidance\n'+CALLOUT_TYPES.map(type=>type+'\nText for '+type).join('\n')}]});
 assert.deepEqual(lesson.sections[0].callouts.map(c=>c.type),CALLOUT_TYPES);assert.equal(lesson.sections[0].body,'Guidance');
});
