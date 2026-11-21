import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createDemo,demoAdapter} from '../dist/demo-transfer.mjs';import {preparePreservationTest,approveTransfer,executeTransfer} from '../dist/reusable-transfer.mjs';import {clone,canonical,digest} from '../dist/transfer-core.mjs';import {buildSaveReview,saveRequestDigest} from '../dist/save-review.mjs';
const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
function harness({acknowledge=true}={}){
 const state=createDemo(source,{saveUnchanged:true}),storage=new Map();let reads=0,writes=0;
 const links=Array.from({length:4},(_,i)=>({id:80+i,activitySectionPosition:i+1,assessment:i>0,levels:[{id:90+i,name:'original-'+i}]}));
 for(const root of [state.server,state.editor.saved,state.editor.protection.bootstrap]){root.activities[0].activitySections[0].scriptLevels=clone(links);root.activities[0].activitySections[0].progressionName='Original four';}
 for(const root of [state.editor.live,state.editor.protection.unmanagedActivities?{activities:state.editor.protection.unmanagedActivities}:null]){root.activities[0].activitySections[0].scriptLevels=clone(links);root.activities[0].activitySections[0].progressionName='Original four';}
 const adapter=demoAdapter(state,()=>{}),io={...adapter,checkpoint:async()=>{},loadCheckpoint:async()=>null,persist:async(k,v)=>storage.set(k,clone(v)),loadReceipt:async k=>storage.get(k),bridge:async request=>{
  if(request.action==='read'){reads++;return adapter.bridge(request);}
  if(request.action==='save-approved-review'){writes++;assert.ok([...storage.values()].some(r=>r.attempted),'attempt must be durable before dispatch');await adapter.bridge(request);return {outcome:acknowledge?'native-editor-acknowledged':'unknown',transport:'native-editor',attempted:true};}
  throw Error('Preservation test must never edit native fields: '+request.action);
 }};return {state,storage,io,counts:()=>({reads,writes})};
}
test('unchanged-save test preserves all four original links and uses the actual guarded controller exactly once',async()=>{
 const h=harness(),before=canonical(h.state.server),editor=canonical(h.state.editor),job=await preparePreservationTest(h.io);
 assert.equal(job.review.preservationTest,true);assert.equal(job.review.transport,'native-editor');assert.equal(job.review.expectedCounts.levels,4);assert.equal(job.review.expectedCounts.assessments,3);assert.equal(job.rehearsal.plan.operations.length,0);assert.equal(h.counts().writes,0);
 const approved=await approveTransfer(job);const receipt=await executeTransfer(approved,h.io);assert.equal(receipt.status,'saved-and-verified');assert.equal(receipt.nativeAcknowledgementConfirmed,true);assert.equal(receipt.verification.baselineUnchanged,true);assert.equal(canonical(h.state.server),before);assert.equal(canonical(h.state.editor),editor);
 for(let i=0;i<3;i++)assert.equal((await executeTransfer(approved,h.io)).status,'saved-and-verified');assert.equal(h.counts().writes,1);
});
test('unchanged readback without native acknowledgement cannot falsely pass dispatch validation or resend',async()=>{
 const h=harness({acknowledge:false}),job=await approveTransfer(await preparePreservationTest(h.io));const result=await executeTransfer(job,h.io);assert.equal(result.status,'save-not-confirmed');assert.equal(result.verification.passed,true);assert.equal(result.nativeAcknowledgementConfirmed,false);
 assert.equal((await executeTransfer(job,h.io)).status,'save-not-confirmed');assert.equal(h.counts().writes,1);
});
test('preservation mode rejects ordinary empty reviews, API transport, and changed editor content',async()=>{
 const h=harness(),job=await preparePreservationTest(h.io),raw=JSON.stringify(h.state.server);
 await assert.rejects(buildSaveReview(job.rehearsal,h.state.server,{originalLessonJson:raw}),/no reviewed changes/);
 await assert.rejects(buildSaveReview(job.rehearsal,h.state.server,{originalLessonJson:raw,preservationTest:true,transport:'direct-api'}),/Preservation tests/);
 const normal=clone(job.review);delete normal.preservationTest;assert.notEqual(await saveRequestDigest(normal),await saveRequestDigest(job.review));
 const approved=await approveTransfer(job);h.state.editor.live.fields.preparation='Outside edit';await assert.rejects(executeTransfer(approved,h.io),/checkpoint|editor changed/i);assert.equal(h.counts().writes,0);
});
test('a changed assessment flag after dispatch fails exact preservation verification',async()=>{
 const h=harness(),job=await approveTransfer(await preparePreservationTest(h.io)),bridge=h.io.bridge;
 h.io.bridge=async r=>{const result=await bridge(r);if(r.action==='save-approved-review')h.state.server.activities[0].activitySections[0].scriptLevels[1].assessment=false;return result;};
 const receipt=await executeTransfer(job,h.io);assert.equal(receipt.status,'save-not-confirmed');assert.equal(receipt.verification.passed,false);assert.equal(h.counts().writes,1);
});
