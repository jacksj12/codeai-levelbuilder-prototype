import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDemo,demoAdapter} from '../dist/demo-transfer.mjs';
import {prepareTransfer,approveTransfer,executeTransfer} from '../dist/reusable-transfer.mjs';
import {clone,canonical} from '../dist/transfer-core.mjs';
import {verifySavedReadback,validateStagedSaveReview} from '../dist/save-review.mjs';
import {reviewedLevelGroups} from '../dist/reviewed-structure.mjs';
import {findUnitLevelConflicts} from '../dist/native-level-usage.mjs';
import {runAcceptedNativeRehearsal,recoverNativeLevelCheck} from '../dist/native-level-verification.mjs';
import {prepareCleanup,approveCleanup,executeCleanup} from '../dist/test-link-cleanup.mjs';
const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
function harness(){
 const state=createDemo(source,{structure:true}),storage=new Map();let checkpoint;
 const donor=state.pkg.lesson.sections.find(s=>s.progression),section=state.pkg.lesson.sections.at(-1);section.progression=clone(donor.progression);section.progression.title='New reflection levels';section.progression.levels[0].assessment=true;donor.progression=null;
 state.pkg.baseline=clone(state.pkg.lesson);
 const io={...demoAdapter(state,()=>{}),checkpoint:async p=>{checkpoint=clone(p);},loadCheckpoint:async()=>checkpoint,persist:async(k,v)=>storage.set(k,clone(v)),loadReceipt:async k=>storage.get(k)};
 return {state,io};
}
test('new-section levels are reviewed, saved once and included in receipt-owned cleanup without removing the section',async()=>{
 const h=harness(),before=canonical(h.state.editor),job=await prepareTransfer(h.state.pkg,h.io);assert.equal(canonical(h.state.editor),before);
 const groups=reviewedLevelGroups(job.review);assert.equal(groups.flatMap(g=>g.addLevels).length,4);assert.equal(groups.filter(g=>g.newSection).length,1);
 assert.equal(job.review.sectionAdditions[0].section.scriptLevels[0].id,undefined);
 const approved=await approveTransfer(job),receipt=await executeTransfer(approved,h.io);assert.equal(receipt.status,'saved-and-verified');assert.equal(h.state.sendCount,1);
 await executeTransfer(approved,h.io);assert.equal(h.state.sendCount,1);
 const cleanup=await prepareCleanup(receipt,h.io);assert.equal(cleanup.removals.flatMap(r=>r.links).length,4);
 const result=await executeCleanup(cleanup,await approveCleanup(cleanup),h.io);assert.equal(result.status,'cleanup-saved-and-verified');assert.equal(h.state.cleanupSendCount,1);
 const section=h.state.server.activities[0].activitySections.at(-1);assert.equal(section.name,'Evidence reflection');assert.equal(section.tips.length,5);assert.equal(section.scriptLevels.length,0);
});
test('usage preflight catches conflicts for a level inside a new section',async()=>{
 const h=harness(),job=await prepareTransfer(h.state.pkg,h.io),groups=reviewedLevelGroups(job.review),newId=groups.find(g=>g.newSection).addLevels[0].levelId;
 const usages=groups.flatMap(g=>g.addLevels).map(l=>({kind:'native-level-usage',levelId:String(l.levelId),name:l.name,paths:l.levelId===newId?['/s/demo-practice-unit/lessons/8/levels/1']:[]}));
 const result=findUnitLevelConflicts(job.review,usages);assert.equal(result.passed,false);assert.equal(result.conflicts[0].levelId,newId);assert.equal(h.state.sendCount,0);
});
test('new-section saved readback rejects changed level identity, flags, order and missing association ids',async()=>{
 const h=harness(),job=await prepareTransfer(h.state.pkg,h.io),receipt=await executeTransfer(await approveTransfer(job),h.io);
 for(const mutate of [sl=>sl.levels[0].id=999,sl=>sl.assessment=false,sl=>sl.bonus=true,sl=>sl.activitySectionPosition=2,sl=>delete sl.id,sl=>sl.variants={}]){
  const saved=clone(receipt.readback);mutate(saved.activities[0].activitySections.at(-1).scriptLevels[0]);assert.equal((await verifySavedReadback(job.review,saved)).passed,false);
 }
});
test('new and existing section associations cannot reuse one saved identity',async()=>{
 const h=harness(),job=await prepareTransfer(h.state.pkg,h.io),receipt=await executeTransfer(await approveTransfer(job),h.io),saved=clone(receipt.readback);
 const links=saved.activities.flatMap(a=>a.activitySections.flatMap(s=>s.scriptLevels));links[1].id=links[0].id;
 assert.equal((await verifySavedReadback(job.review,saved)).passed,false);
});
test('restaging protects new-section level flags and recovers only owned unsaved sections',async()=>{
 const h=harness(),before=canonical(h.state.editor),job=await prepareTransfer(h.state.pkg,h.io),stage=await runAcceptedNativeRehearsal(h.io.bridge,h.state.pkg,{leaveStaged:true});
 await validateStagedSaveReview(job.review,stage.stagedCapture);
 const outside=clone(stage.stagedCapture);outside.live.activities[0].activitySections.at(-1).scriptLevels[0].challenge=true;
 await assert.rejects(validateStagedSaveReview(job.review,outside),/flags/);
 await recoverNativeLevelCheck(h.io.bridge,stage);assert.equal(canonical(h.state.editor),before);assert.equal(h.state.sendCount,0);
});
