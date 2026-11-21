import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDemo,demoAdapter} from '../dist/demo-transfer.mjs';
import {prepareTransfer,approveTransfer,executeTransfer} from '../dist/reusable-transfer.mjs';
import {clone,canonical} from '../dist/transfer-core.mjs';
import {verifySavedReadback,validateStagedSaveReview} from '../dist/save-review.mjs';
import {runAcceptedNativeRehearsal,recoverNativeLevelCheck} from '../dist/native-level-verification.mjs';
import {buildCleanupReview} from '../dist/test-link-cleanup.mjs';
import {findUnitLevelConflicts} from '../dist/native-level-usage.mjs';
const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
function harness({links=true}={}){
 const state=createDemo(source),storage=new Map();let checkpoint;
 for(const root of [state.server,state.editor.saved,state.editor.protection.bootstrap])root.purpose='Original purpose to clear';state.editor.live.fields.purpose='Original purpose to clear';
 if(!links)for(const s of state.pkg.lesson.sections)s.progression=null;
 Object.assign(state.pkg.lesson.frontMatter,{teacherOverview:'Reviewed **overview**',studentOverview:'Student guidance',purpose:'',preparation:'Prepare materials',assessmentOpportunities:'Observe reasoning'});
 Object.assign(state.pkg.lesson.activities[0],{title:'Investigate',duration:17});
 Object.assign(state.pkg.lesson.sections[0],{title:'Discuss',body:'Ask: what changed?\n\nKeep **evidence**.',duration:3,remarks:!state.editor.live.activities[0].activitySections[0].remarks});
 state.pkg.baseline=clone(state.pkg.lesson);
 const io={...demoAdapter(state,()=>{}),checkpoint:async p=>{checkpoint=clone(p);},loadCheckpoint:async()=>checkpoint,persist:async(k,v)=>storage.set(k,clone(v)),loadReceipt:async k=>storage.get(k)};
 return {state,io,get checkpoint(){return checkpoint;}};
}
test('mixed teaching transfer restores rehearsal, requires exact approval, saves once and verifies all fields',async()=>{
 const h=harness(),initial=canonical(h.state.editor),baseline=clone(h.state.server),job=await prepareTransfer(h.state.pkg,h.io);
 assert.equal(canonical(h.state.editor),initial);assert.equal(h.state.sendCount,0);assert.equal(job.review.fieldChanges.length,11);
 const body=JSON.parse(job.review.request.body);assert.equal(body.overview,'Reviewed **overview**');assert.equal(body.purpose,'');assert.equal(body.name,baseline.name);
 assert.deepEqual(JSON.parse(body.objectives),baseline.objectives);assert.deepEqual(JSON.parse(body.originalLessonData),baseline);
 await assert.rejects(executeTransfer(job,h.io),/approval/);
 const approved=await approveTransfer(job),receipt=await executeTransfer(approved,h.io);
 assert.equal(receipt.status,'saved-and-verified');assert.equal(h.state.server.activities[0].activitySections[0].remarks,!baseline.activities[0].activitySections[0].remarks);assert.equal(h.state.sendCount,1);
 await executeTransfer(approved,h.io);assert.equal(h.state.sendCount,1);
 const cleanup=await buildCleanupReview(receipt,await h.io.readSaved());
 assert.equal(cleanup.expectedSaved.overview,'Reviewed **overview**');assert.equal(cleanup.expectedSaved.activities[0].activitySections[0].description,'Ask: what changed?\n\nKeep **evidence**.');
});
test('teaching-only transfer needs no level usage identity and offers no empty cleanup save',async()=>{
 const h=harness({links:false});delete h.state.server.lessonPath;delete h.state.editor.saved.lessonPath;delete h.state.editor.protection.bootstrap.lessonPath;
 const job=await prepareTransfer(h.state.pkg,h.io);assert.equal(job.review.changes.length,0);assert.equal(findUnitLevelConflicts(job.review,[]).passed,true);
 const receipt=await executeTransfer(await approveTransfer(job),h.io);assert.equal(receipt.status,'saved-and-verified');assert.equal(h.state.sendCount,1);
 await assert.rejects(buildCleanupReview(receipt,await h.io.readSaved()),/no test links/);
});
test('readback rejects altered teaching fields, record identities, and unlisted settings',async()=>{
 const h=harness(),job=await prepareTransfer(h.state.pkg,h.io),receipt=await executeTransfer(await approveTransfer(job),h.io);
 for(const mutate of [s=>s.overview='Outside',s=>s.activities[0].id=99,s=>s.activities[0].activitySections[0].id=99,s=>s.lockable=true,s=>s.resources[0].url='https://example.com/changed']){
  const saved=clone(receipt.readback);mutate(saved);assert.equal((await verifySavedReadback(job.review,saved)).passed,false);
 }
 const staged=clone(receipt.stagedCapture);staged.live.fields.teacherOverview='Outside';await assert.rejects(validateStagedSaveReview(job.review,staged),/differs/);
});
test('unsupported objectives block the complete batch before any edits',async()=>{
 for(const mutate of [l=>l.frontMatter.objectives.pop()]){
  const h=harness();mutate(h.state.pkg.lesson);h.state.pkg.baseline=clone(h.state.pkg.lesson);const initial=canonical(h.state.editor);
  await assert.rejects(prepareTransfer(h.state.pkg,h.io),/unresolved|separate review/);assert.equal(canonical(h.state.editor),initial);assert.equal(h.state.sendCount,0);
 }
});
test('failed teaching rehearsal restores its owned prefix and retains a recovery checkpoint',async()=>{
 const h=harness(),initial=canonical(h.state.editor),bridge=h.io.bridge;let changed=0;
 h.io.bridge=async r=>{if(r.action==='set-scalar'&&r.operation.after==='Student guidance')throw Error('Injected unavailable control');const result=await bridge(r);if(r.action==='set-scalar')changed++;return result;};
 await assert.rejects(prepareTransfer(h.state.pkg,h.io),/unavailable control/);assert.equal(canonical(h.state.editor),initial);assert.ok(changed>=2);assert.equal(h.checkpoint.stage.restored,true);assert.equal(h.state.sendCount,0);
});
test('mixed staged recovery refuses outside changes and restores a known checkpoint without saving',async()=>{
 const h=harness(),initial=canonical(h.state.editor),staged=await runAcceptedNativeRehearsal(h.io.bridge,h.state.pkg,{leaveStaged:true});assert.equal(staged.status,'staged-unsaved');
 const owned=clone(h.state.editor);h.state.editor.live.fields.preparation='Outside';const outside=canonical(h.state.editor);
 await assert.rejects(recoverNativeLevelCheck(h.io.bridge,staged),/Outside/);assert.equal(canonical(h.state.editor),outside);
 h.state.editor=owned;await recoverNativeLevelCheck(h.io.bridge,staged);assert.equal(canonical(h.state.editor),initial);assert.equal(h.state.sendCount,0);
});
test('mixed recovery rejects altered level flags even when names still match',async()=>{
 const h=harness(),staged=await runAcceptedNativeRehearsal(h.io.bridge,h.state.pkg,{leaveStaged:true});
 const section=h.state.editor.live.activities.flatMap(a=>a.activitySections).find(s=>s.scriptLevels.length);section.scriptLevels[0].bonus=true;
 const outside=canonical(h.state.editor);await assert.rejects(recoverNativeLevelCheck(h.io.bridge,staged),/Outside/);assert.equal(canonical(h.state.editor),outside);
});
