import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDemo,demoAdapter} from '../dist/demo-transfer.mjs';
import {prepareTransfer,approveTransfer,executeTransfer} from '../dist/reusable-transfer.mjs';
import {clone,canonical} from '../dist/transfer-core.mjs';
import {verifySavedReadback,validateStagedSaveReview} from '../dist/save-review.mjs';
import {runAcceptedNativeRehearsal,recoverNativeLevelCheck} from '../dist/native-level-verification.mjs';
const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
function harness(){
 const state=createDemo(source),storage=new Map();let checkpoint;
 state.pkg.lesson.sections[0].callouts[0]={type:'Ethics Opportunity',body:'Consider who benefits from this decision.'};state.pkg.baseline=clone(state.pkg.lesson);
 const io={...demoAdapter(state,()=>{}),checkpoint:async p=>{checkpoint=clone(p);},loadCheckpoint:async()=>checkpoint,persist:async(k,v)=>storage.set(k,clone(v)),loadReceipt:async k=>storage.get(k)};
 return {state,io};
}
test('existing callout type and text are exactly reviewed, restored, approved and saved once',async()=>{
 const h=harness(),before=canonical(h.state.editor),job=await prepareTransfer(h.state.pkg,h.io);assert.equal(canonical(h.state.editor),before);
 assert.equal(job.review.fieldChanges.length,2);assert.equal(job.review.fieldChanges[0].before,'teachingTip');assert.equal(job.review.fieldChanges[0].after,'ethicsOpportunity');
 await assert.rejects(executeTransfer(job,h.io),/approval/);const approved=await approveTransfer(job),receipt=await executeTransfer(approved,h.io);assert.equal(receipt.status,'saved-and-verified');assert.equal(h.state.sendCount,1);
 assert.equal(h.state.server.activities[0].activitySections[0].tips[0].markdown,'Consider who benefits from this decision.');await executeTransfer(approved,h.io);assert.equal(h.state.sendCount,1);
});
test('callout verification rejects altered text, type and unrelated metadata',async()=>{
 const h=harness(),job=await prepareTransfer(h.state.pkg,h.io),receipt=await executeTransfer(await approveTransfer(job),h.io);
 for(const mutate of [t=>t.markdown='Outside',t=>t.type='contentCorner',t=>t.unknown=true]){const saved=clone(receipt.readback);mutate(saved.activities[0].activitySections[0].tips[0]);assert.equal((await verifySavedReadback(job.review,saved)).passed,false);}
 const staged=clone(receipt.stagedCapture);staged.protection.unmanagedActivities[0].activitySections[0].tips[0].key='Outside';await assert.rejects(validateStagedSaveReview(job.review,staged),/Unreviewed/);
});
test('existing callout recovery preserves outside changes and restores owned edits',async()=>{
 const h=harness(),before=canonical(h.state.editor),stage=await runAcceptedNativeRehearsal(h.io.bridge,h.state.pkg,{leaveStaged:true}),owned=clone(h.state.editor);
 h.state.editor.live.activities[0].activitySections[0].tips[0].markdown='Outside';const outside=canonical(h.state.editor);await assert.rejects(recoverNativeLevelCheck(h.io.bridge,stage),/Outside/);assert.equal(canonical(h.state.editor),outside);
 h.state.editor=owned;await recoverNativeLevelCheck(h.io.bridge,stage);assert.equal(canonical(h.state.editor),before);
});
test('intentional blank callout text is explicit while unknown callout types block preparation',async()=>{
 const h=harness();h.state.pkg.lesson.sections[0].callouts[0].body='';h.state.pkg.baseline=clone(h.state.pkg.lesson);const job=await prepareTransfer(h.state.pkg,h.io);assert.equal(job.review.fieldChanges.at(-1).after,'');
 h.state.pkg.lesson.sections[0].callouts[0].type='Unknown';h.state.pkg.baseline=clone(h.state.pkg.lesson);const before=canonical(h.state.editor);await assert.rejects(prepareTransfer(h.state.pkg,h.io));assert.equal(canonical(h.state.editor),before);
});
