import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clone,canonical} from '../dist/transfer-core.mjs';
import {createDemo,demoAdapter} from '../dist/demo-transfer.mjs';
import {prepareTransfer,approveTransfer,executeTransfer} from '../dist/reusable-transfer.mjs';
import {planTestLinkCleanup,prepareCleanup,approveCleanup,executeCleanup,validateCleanupReview} from '../dist/test-link-cleanup.mjs';
const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
async function fixture(){
 const state=createDemo(source),store=new Map();let checkpoint;
 const io={...demoAdapter(state,()=>{}),checkpoint:async p=>checkpoint=clone(p),loadCheckpoint:async()=>checkpoint,persist:async(k,v)=>store.set(k,clone(v)),loadReceipt:async k=>clone(store.get(k))};
 const original=clone(state.server),job=await approveTransfer(await prepareTransfer(state.pkg,io)),receipt=await executeTransfer(job,io);
 assert.equal(receipt.status,'saved-and-verified');return {state,store,io,receipt,original};
}
test('cleanup removes only four test associations, verifies, and rechecks without resending',async()=>{
 const h=await fixture(),before=canonical(h.state.server),review=await prepareCleanup(h.receipt,h.io);
 assert.equal(review.removals.flatMap(x=>x.links).length,4);assert.equal(canonical(h.state.server),before);
 const approval=await approveCleanup(review),receipt=await executeCleanup(review,approval,h.io);
 assert.equal(receipt.status,'cleanup-saved-and-verified');assert.equal(h.state.cleanupSendCount,1);assert.equal(canonical(h.state.server),canonical(h.original));assert.equal(h.state.mappings.length,4);
 await executeCleanup(review,approval,h.io);assert.equal(h.state.cleanupSendCount,1);
 assert.equal(canonical(receipt.restorePoint.lesson),before);
});
test('cleanup preserves unrelated saved changes while refusing changed owned links',async()=>{
 const h=await fixture();h.state.server.preparation='New outside preparation';const review=await prepareCleanup(h.receipt,h.io);assert.equal(review.expectedSaved.preparation,'New outside preparation');
 const section=h.state.server.activities.flatMap(a=>a.activitySections).find(s=>s.scriptLevels.length);section.scriptLevels[0].assessment=!section.scriptLevels[0].assessment;
 await assert.rejects(planTestLinkCleanup(h.receipt,h.state.server),/changed after/);
});
test('cleanup rejects missing ownership, wrong destination and outside unsaved edits',async()=>{
 const h=await fixture();await assert.rejects(planTestLinkCleanup({...h.receipt,status:'save-not-confirmed'},h.state.server),/verified saved/);
 await assert.rejects(planTestLinkCleanup(h.receipt,{...h.state.server,id:1}),/destination/);
 h.state.editor.live.fields.title='Outside unsaved work';await assert.rejects(prepareCleanup(h.receipt,h.io),/unsaved/);
 assert.equal(h.state.cleanupSendCount,undefined);
});
test('cleanup rejects tampered requests, expired reviews and missing exact approval',async()=>{
 const h=await fixture(),review=await prepareCleanup(h.receipt,h.io),changed=clone(review);changed.request.body='{}';
 await assert.rejects(validateCleanupReview(changed),/changed/);await assert.rejects(validateCleanupReview(review,{now:review.expiresAt+1}),/expired/);
 await assert.rejects(executeCleanup(review,{approved:true,approvedRequestDigest:'wrong'},h.io),/approval/);assert.equal(h.state.cleanupSendCount,undefined);
});
test('fresh baseline drift and failed durable writes prevent cleanup dispatch',async()=>{
 const h=await fixture(),review=await prepareCleanup(h.receipt,h.io),approval=await approveCleanup(review);
 h.state.server.name='Changed after approval';await assert.rejects(executeCleanup(review,approval,h.io),/Saved lesson changed/);h.state.server.name=review.baseline.name;
 await assert.rejects(executeCleanup(review,approval,{...h.io,persist:async()=>{throw Error('Storage unavailable');}}),/Storage/);assert.equal(h.state.cleanupSendCount,undefined);
});
test('ambiguous cleanup response is verified without a second dispatch',async()=>{
 const h=await fixture(),review=await prepareCleanup(h.receipt,h.io),approval=await approveCleanup(review),bridge=h.io.bridge;
 h.io.bridge=async request=>{const result=await bridge(request);if(request.action==='save-approved-cleanup')throw Error('Response lost');return result;};
 const result=await executeCleanup(review,approval,h.io);assert.equal(result.status,'cleanup-saved-and-verified');assert.equal(result.dispatch.outcome,'unknown');await executeCleanup(review,approval,h.io);assert.equal(h.state.cleanupSendCount,1);
});
test('readback failure retains attempt and next execution only reads',async()=>{
 const h=await fixture(),review=await prepareCleanup(h.receipt,h.io),approval=await approveCleanup(review),read=h.io.readSaved;
 h.io.readSaved=async()=>{if(h.state.cleanupSendCount)throw Error('Read unavailable');return read();};
 assert.equal((await executeCleanup(review,approval,h.io)).status,'cleanup-not-confirmed');h.io.readSaved=read;
 assert.equal((await executeCleanup(review,approval,h.io)).status,'cleanup-saved-and-verified');assert.equal(h.state.cleanupSendCount,1);
});
