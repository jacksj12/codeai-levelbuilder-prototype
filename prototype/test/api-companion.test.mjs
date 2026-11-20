import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generate,SANDBOX} from '../dist/core.mjs';
import {comparePackage,DESTINATION_ID} from '../api-companion/adapter.mjs';
import {readAssignedLesson} from '../api-companion/read-lesson.mjs';
const source=JSON.parse(await readFile(new URL('../dist/fixture.json',import.meta.url)));
const lesson=generate(source);
const pkg={schemaVersion:1,sandbox:SANDBOX,status:'approved-locally',conflicts:[],lesson};
const snapshot={id:DESTINATION_ID,name:'Julian Playground - ChatGPT',activities:[{id:42,activitySections:[{id:8,scriptLevels:[{id:9}]}]}],resources:[],overview:'Keep this saved text',unknownFutureField:{retain:true}};
test('both delivery versions use the same full generated lesson',()=>{
 const result=comparePackage(pkg,snapshot);
 assert.deepEqual(result.reviewPackage.lesson,lesson);
 assert.equal(result.counts.proposedActivities,3);assert.equal(result.counts.proposedSections,10);
 assert.equal(result.changes.find(x=>x.field==='overview').current,'Keep this saved text');
 assert.equal(result.changes.find(x=>x.field==='overview').proposed,lesson.frontMatter.teacherOverview);
});
test('API comparison retains all existing records without mutating its inputs',()=>{
 const before=JSON.stringify(snapshot);const report=comparePackage(pkg,snapshot);
 assert.deepEqual(report.originalLessonData,snapshot);report.originalLessonData.activities.pop();
 assert.equal(JSON.stringify(snapshot),before);
 assert.equal(report.remoteWrites,false);
});
test('wrong destination and source packages are rejected',()=>{
 assert.throws(()=>comparePackage(pkg,{...snapshot,id:1}),/assigned lesson/);
 assert.throws(()=>comparePackage({...pkg,sandbox:'https://example.com'},snapshot),/assigned lesson/);
 assert.throws(()=>comparePackage(source,snapshot),/review package/);
});
test('approvals, conflicts, resource and level mapping remain explicit blockers',()=>{
 const report=comparePackage({...pkg,status:'draft',conflicts:[{}]},snapshot);
 assert.ok(report.blockers.some(x=>x.includes('approved locally')));
 assert.ok(report.blockers.some(x=>x.includes('conflicts')));
 assert.ok(report.blockers.some(x=>x.includes('resource mapping')));
 assert.ok(report.blockers.some(x=>x.includes('level mappings')));
 assert.ok(report.blockers.some(x=>x.includes('saving is disabled')));
});
test('connector refuses another lesson before making a request',async()=>{
 const old=globalThis.location;globalThis.location={origin:'https://levelbuilder-studio.code.org',pathname:'/courses/csp-dev-2027/units/1/lessons/16'};
 try{await assert.rejects(readAssignedLesson,/assigned Julian Playground/);}finally{if(old===undefined)delete globalThis.location;else globalThis.location=old;}
});
test('connector makes only an authenticated read and rejects unexpected returned identity',async()=>{
 const originals={location:globalThis.location,fetch:globalThis.fetch,DOMParser:globalThis.DOMParser};
 globalThis.location={origin:'https://levelbuilder-studio.code.org',pathname:'/s/scottsdale-levelbuilder-exploration/lessons/11/edit'};
 let returned=snapshot;
 globalThis.DOMParser=class{parseFromString(){return {querySelector:()=>({getAttribute:()=>JSON.stringify(returned)})};}};
 globalThis.fetch=async(url,options)=>{assert.equal(url,'/lessons/8898985/edit');assert.equal(options.method,'GET');assert.equal(options.credentials,'same-origin');assert.equal(options.redirect,'error');return {ok:true,text:async()=>'<html></html>'};};
 try{assert.deepEqual(await readAssignedLesson(),snapshot);const raw=await readAssignedLesson(JSON.stringify({returnRaw:true,transportErrors:true}));assert.deepEqual(raw.lesson,snapshot);assert.equal(raw.originalLessonJson,JSON.stringify(snapshot));returned={...snapshot,id:2};await assert.rejects(readAssignedLesson,/does not match/);assert.match((await readAssignedLesson({transportErrors:true})).nativeBridgeError,/does not match/);}finally{for(const [key,value]of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
