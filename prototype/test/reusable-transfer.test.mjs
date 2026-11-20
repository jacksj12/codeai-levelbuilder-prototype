import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectDestination} from '../dist/destination.mjs';
import {createDemo,demoAdapter} from '../dist/demo-transfer.mjs';
import {prepareTransfer,approveTransfer,executeTransfer} from '../dist/reusable-transfer.mjs';
import {clone,canonical} from '../dist/transfer-core.mjs';
import {nativeEditorBridge} from '../dist/native-dom-adapter.mjs';
import {readAssignedLesson} from '../api-companion/read-lesson.mjs';
import {readAssignedLevelUsage} from '../dist/native-level-usage.mjs';

const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
function harness(){
 const state=createDemo(source),storage=new Map();let checkpoint;
 const io={...demoAdapter(state,()=>{}),checkpoint:async p=>{checkpoint=clone(p);},loadCheckpoint:async()=>checkpoint,
  persist:async(k,v)=>storage.set(k,clone(v)),loadReceipt:async k=>storage.get(k)};
 return {state,io,storage};
}
test('destination selection requires explicit practice confirmation and an exact canonical HTTPS lesson editor',()=>{
 assert.deepEqual(selectDestination('https://levelbuilder-studio.code.org/lessons/123/edit',true),{id:123,url:'https://levelbuilder-studio.code.org/lessons/123/edit'});
 assert.throws(()=>selectDestination('https://levelbuilder-studio.code.org/lessons/123/edit',false),/Confirm/);
 for(const url of ['http://levelbuilder-studio.code.org/lessons/123/edit','https://code.org/lessons/123/edit','https://levelbuilder-studio.code.org/lessons/123/edit?other=1','https://levelbuilder-studio.code.org/lessons/0/edit','https://levelbuilder-studio.code.org/lessons/999999999999999999/edit'])assert.throws(()=>selectDestination(url,true));
});
test('injected adapters refuse a selected destination without confirmation before inspecting the browser',async()=>{
 for(const adapter of [nativeEditorBridge,readAssignedLesson,readAssignedLevelUsage])await assert.rejects(adapter({action:'read',destination:{id:123,url:'https://levelbuilder-studio.code.org/lessons/123/edit'}}),/Invalid selected destination/);
});
test('selected destination is pinned to the exact tab URL, including for saved reads',async()=>{
 const previous=globalThis.location;
 try{globalThis.location={origin:'https://levelbuilder-studio.code.org',href:'https://levelbuilder-studio.code.org/lessons/456/edit',pathname:'/lessons/456/edit',protocol:'https:'};
  for(const adapter of [nativeEditorBridge,readAssignedLesson,readAssignedLevelUsage])await assert.rejects(adapter({action:'read',practiceConfirmed:true,destination:{id:123,url:'https://levelbuilder-studio.code.org/lessons/123/edit'}}),/assigned|sandbox/);
 }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});
test('reusable pipeline prepares from supplied package and selected destination, restores, approves, saves and verifies once',async()=>{
 const h=harness(),original=canonical(h.state.editor),pkg=canonical(h.state.pkg);
 const prepared=await prepareTransfer(h.state.pkg,h.io);
 assert.equal(canonical(h.state.editor),original);assert.equal(canonical(h.state.pkg),pkg);assert.equal(prepared.approval,undefined);
 assert.equal(prepared.review.destination.id,9000001);assert.equal(prepared.review.request.url,'https://levelbuilder-studio.code.org/lessons/9000001');
 assert.equal(prepared.review.changes.flatMap(c=>c.addLevels).length,4);
 await assert.rejects(executeTransfer(prepared,h.io),/matching approval/);
 const job=await approveTransfer(prepared),receipt=await executeTransfer(job,h.io);
 assert.equal(receipt.status,'saved-and-verified');assert.equal(receipt.restorePoint.lesson.name,'Demo practice lesson — AI Lab');assert.equal(h.state.sendCount,1);
 await executeTransfer(JSON.parse(JSON.stringify(job)),h.io);assert.equal(h.state.sendCount,1);
});
test('unapproved or modified packages and stale editor baselines cannot start staging',async()=>{
 for(const mutate of [h=>h.state.pkg.status='draft',h=>h.state.pkg.lesson.title='Changed',h=>h.state.server.name='Changed on server']){
  const h=harness();mutate(h);const before=canonical(h.state.editor);await assert.rejects(prepareTransfer(h.state.pkg,h.io));assert.equal(canonical(h.state.editor),before);assert.equal(h.state.sendCount,0);
 }
});
test('existing unsaved content and settings are preserved and block preparation',async()=>{
 for(const mutate of [h=>h.state.editor.live.fields.teacherOverview='Outside unsaved edit',h=>h.state.editor.protection.controls.push({label:'Lockable',type:'checkbox',value:true})]){
  const h=harness();mutate(h);const before=canonical(h.state.editor);await assert.rejects(prepareTransfer(h.state.pkg,h.io),/unsaved/);assert.equal(canonical(h.state.editor),before);assert.equal(h.state.sendCount,0);
 }
});
test('different teaching content is rehearsed, restored, and included in exact review without saving',async()=>{
 const h=harness();h.state.pkg.lesson.sections[0].body='New guidance';h.state.pkg.baseline=clone(h.state.pkg.lesson);
 const before=canonical(h.state.editor),job=await prepareTransfer(h.state.pkg,h.io);assert.equal(job.review.fieldChanges[0].after,'New guidance');assert.equal(canonical(h.state.editor),before);assert.equal(h.state.sendCount,0);
});
test('a changed saved baseline after preparation cannot be approved into a different request',async()=>{
 const h=harness(),job=await approveTransfer(await prepareTransfer(h.state.pkg,h.io));h.state.server.name='Outside saved edit';await assert.rejects(executeTransfer(job,h.io),/changed/);assert.equal(h.state.sendCount,0);
});
test('ambiguous simulated transport outcome remains readback-only across restart',async()=>{
 const h=harness(),job=await approveTransfer(await prepareTransfer(h.state.pkg,h.io)),bridge=h.io.bridge;let sends=0;
 h.io.bridge=async request=>{if(request.action==='save-approved-review'){sends++;throw Error('Connection lost');}return bridge(request);};
 assert.equal((await executeTransfer(job,h.io)).status,'save-not-confirmed');assert.equal((await executeTransfer(clone(job),h.io)).status,'save-not-confirmed');assert.equal(sends,1);
});
test('receipt storage failure blocks the save dispatch',async()=>{
 const h=harness(),job=await approveTransfer(await prepareTransfer(h.state.pkg,h.io));h.io.persist=async()=>{throw Error('Storage unavailable');};
 await assert.rejects(executeTransfer(job,h.io),/Storage unavailable/);assert.equal(h.state.sendCount,0);
});

test('early baseline refusal retains read-only evidence and identifies the differing field',async()=>{const h=harness();h.state.editor.live.fields.teacherOverview='Outside work';let point;h.io.checkpoint=async p=>{point=clone(p)};const original=canonical(h.state.editor);await assert.rejects(prepareTransfer(h.state.pkg,h.io),/frontMatter \/ teacherOverview/);assert.equal(point.status,'baseline-read');assert.equal(point.stagingStarted,false);assert.equal(point.initialCapture.live.fields.teacherOverview,'Outside work');assert.equal(canonical(h.state.editor),original);assert.equal(h.state.sendCount,0);});
test('incomplete native capture reports its specific blocker before any staging',async()=>{const h=harness();h.state.editor.blockers=['Missing unique section controls'];let point;h.io.checkpoint=async p=>{point=p};await assert.rejects(prepareTransfer(h.state.pkg,h.io),/Missing unique section controls/);assert.equal(point.stagingStarted,false);assert.equal(h.state.sendCount,0);});
