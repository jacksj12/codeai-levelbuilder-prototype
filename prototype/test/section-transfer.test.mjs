import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDemo,demoAdapter} from '../dist/demo-transfer.mjs';
import {prepareTransfer,approveTransfer,executeTransfer} from '../dist/reusable-transfer.mjs';
import {clone,canonical} from '../dist/transfer-core.mjs';
import {verifySavedReadback,validateStagedSaveReview,saveRequestDigest} from '../dist/save-review.mjs';
import {runAcceptedNativeRehearsal,recoverNativeLevelCheck} from '../dist/native-level-verification.mjs';
import {buildCleanupReview} from '../dist/test-link-cleanup.mjs';
const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
const types=['Teaching Tip','Content Corner','Discussion Goal','Assessment Opportunity','Ethics Opportunity'];
function harness(){
 const state=createDemo(source),storage=new Map();let checkpoint;
 state.pkg.lesson.frontMatter.preparation='Prepare a follow-up discussion.';
 for(const [index,activity]of state.pkg.lesson.activities.slice(0,2).entries())state.pkg.lesson.sections.push({id:'new-'+index,activityId:activity.id,title:'Reflection '+index,body:'Explain your evidence.',duration:index?null:4,remarks:true,callouts:types.map(type=>({type,body:'Review '+type})),progression:null});
 state.pkg.baseline=clone(state.pkg.lesson);
 const io={...demoAdapter(state,()=>{}),checkpoint:async p=>{checkpoint=clone(p);},loadCheckpoint:async()=>checkpoint,persist:async(k,v)=>storage.set(k,clone(v)),loadReceipt:async k=>storage.get(k)};
 return {state,io,get checkpoint(){return checkpoint;}};
}
test('append-only section transfer rehearses, restores, binds exact approval, saves and verifies generated identities once',async()=>{
 const h=harness(),initial=canonical(h.state.editor),job=await prepareTransfer(h.state.pkg,h.io);
 assert.equal(canonical(h.state.editor),initial);assert.equal(job.review.sectionAdditions.length,2);assert.equal(h.state.sendCount,0);
 for(const addition of job.review.sectionAdditions){assert.equal(addition.section.tips.length,5);assert.equal(addition.section.id,undefined);assert.equal(addition.section.key,undefined);assert.equal(addition.section.tips[0].key,undefined);}
 await assert.rejects(executeTransfer(job,h.io),/approval/);
 const approved=await approveTransfer(job),receipt=await executeTransfer(approved,h.io);assert.equal(receipt.status,'saved-and-verified');assert.equal(h.state.sendCount,1);
 await executeTransfer(approved,h.io);assert.equal(h.state.sendCount,1);
 const cleanup=await buildCleanupReview(receipt,await h.io.readSaved());assert.equal(cleanup.expectedSaved.activities[0].activitySections.at(-1).name,'Reflection 0');
});
test('fresh rehearsal keys do not change the exact request digest',async()=>{
 const h=harness(),first=await prepareTransfer(h.state.pkg,h.io),second=await prepareTransfer(h.state.pkg,h.io);
 assert.notEqual(first.rehearsal.stagedCapture.live.activities[0].activitySections.at(-1).key,second.rehearsal.stagedCapture.live.activities[0].activitySections.at(-1).key);
 assert.equal(await saveRequestDigest(first.review),await saveRequestDigest(second.review));
});
test('saved section verification rejects absent, reused and duplicate ids, altered callouts and unknown settings',async()=>{
 const h=harness(),job=await prepareTransfer(h.state.pkg,h.io),receipt=await executeTransfer(await approveTransfer(job),h.io);
 for(const mutate of [s=>delete s.activities[0].activitySections.at(-1).id,s=>s.activities[0].activitySections.at(-1).id=s.activities[0].activitySections[0].id,s=>s.activities[1].activitySections.at(-1).id=s.activities[0].activitySections.at(-1).id,s=>s.activities[0].activitySections.at(-1).tips[0].markdown='Outside',s=>s.activities[0].activitySections.at(-1).unknown='extra',s=>s.activities[0].activitySections.push(clone(s.activities[0].activitySections.at(-1)))]){
  const saved=clone(receipt.readback);mutate(saved);assert.equal((await verifySavedReadback(job.review,saved)).passed,false);
 }
});
test('restaging refuses new-section content or settings outside exact review',async()=>{
 const h=harness(),job=await prepareTransfer(h.state.pkg,h.io),staged=await runAcceptedNativeRehearsal(h.io.bridge,h.state.pkg,{leaveStaged:true});
 const good=staged.stagedCapture;await validateStagedSaveReview(job.review,good);
 for(const mutate of [c=>c.live.activities[0].activitySections.at(-1).description='Outside',c=>c.live.activities[0].activitySections.at(-1).unknown=true,c=>c.live.activities[0].activitySections.at(-1).id=123]){
  const current=clone(good);mutate(current);await assert.rejects(validateStagedSaveReview(job.review,current));
 }
});
test('unverified new-section levels block the complete batch before staging',async()=>{
 for(const mutate of [l=>l.sections.at(-1).progression={title:'Levels',levels:[{key:'Unknown',number:1,assessment:false}]}]){
  const h=harness();mutate(h.state.pkg.lesson);h.state.pkg.baseline=clone(h.state.pkg.lesson);const before=canonical(h.state.editor);
  await assert.rejects(prepareTransfer(h.state.pkg,h.io));assert.equal(canonical(h.state.editor),before);assert.equal(h.state.sendCount,0);
 }
});
test('interrupted section filling removes only its checkpoint-owned append and restores earlier teaching changes',async()=>{
 const h=harness(),before=canonical(h.state.editor),bridge=h.io.bridge;
 h.io.bridge=async r=>{if(r.action==='append-callout'&&r.operation.after.type==='Discussion Goal')throw Error('Injected callout interruption');return bridge(r);};
 await assert.rejects(prepareTransfer(h.state.pkg,h.io),/interruption/);assert.equal(canonical(h.state.editor),before);assert.equal(h.checkpoint.stage.restored,true);
});
test('section recovery refuses outside content and resumes after a removal acknowledgement is lost',async()=>{
 const h=harness(),before=canonical(h.state.editor),staged=await runAcceptedNativeRehearsal(h.io.bridge,h.state.pkg,{leaveStaged:true}),owned=clone(h.state.editor);
 h.state.editor.live.activities[0].activitySections.at(-1).description='Outside work';const outside=canonical(h.state.editor);
 await assert.rejects(recoverNativeLevelCheck(h.io.bridge,staged),/Outside/);assert.equal(canonical(h.state.editor),outside);
 h.state.editor=owned;const bridge=h.io.bridge;let lost=false;
 const interrupted=async r=>{const result=await bridge(r);if(r.action==='remove-created-section'&&!lost){lost=true;throw Error('Lost removal acknowledgement');}return result;};
 await assert.rejects(recoverNativeLevelCheck(interrupted,staged),/Lost/);
 await recoverNativeLevelCheck(bridge,staged);assert.equal(canonical(h.state.editor),before);assert.equal(h.state.sendCount,0);
});

test('recovery resumes interrupted scalar restoration after all new sections are already removed',async()=>{
 const h=harness();h.state.pkg.lesson.frontMatter.studentOverview='Changed overview';h.state.pkg.baseline=clone(h.state.pkg.lesson);
 const before=canonical(h.state.editor),staged=await runAcceptedNativeRehearsal(h.io.bridge,h.state.pkg,{leaveStaged:true}),bridge=h.io.bridge;let calls=0;
 const interrupted=async r=>{if(r.action==='set-scalar'&&++calls===2)throw Error('Interrupted scalar recovery');return bridge(r);};
 await assert.rejects(recoverNativeLevelCheck(interrupted,staged),/Interrupted/);
 await recoverNativeLevelCheck(bridge,staged);assert.equal(canonical(h.state.editor),before);assert.equal(h.state.sendCount,0);
});

test('multiple new sections in one activity preserve append order without requiring level changes',async()=>{
 const h=harness();for(const s of h.state.pkg.lesson.sections)s.progression=null;
 const additional=clone(h.state.pkg.lesson.sections.at(-2));additional.id='third-new';additional.title='Second reflection';h.state.pkg.lesson.sections.push(additional);h.state.pkg.baseline=clone(h.state.pkg.lesson);
 const before=canonical(h.state.editor),job=await prepareTransfer(h.state.pkg,h.io);assert.equal(canonical(h.state.editor),before);assert.equal(job.review.sectionAdditions.length,3);assert.equal(job.review.changes.length,0);
 const receipt=await executeTransfer(await approveTransfer(job),h.io);assert.equal(receipt.status,'saved-and-verified');assert.equal(h.state.server.activities[0].activitySections.at(-1).name,'Second reflection');
});
