import test from 'node:test';import assert from 'node:assert/strict';
import {createDemo,demoAdapter} from '../dist/demo-transfer.mjs';
import {preparePublication,validatePublicationBinding,verifyPublicationReceipt} from '../dist/publishing.mjs';
import {prepareTransfer,approveTransfer,executeTransfer} from '../dist/reusable-transfer.mjs';
const clone=structuredClone;
const source={title:'Synthetic lesson',teacherOverview:'Teacher',studentOverview:'Student',preparation:'Prep',objectives:['One'],resources:[],slides:[{id:'a',number:1,notes:'Activity (10 minutes)'},{id:'s',number:2,notes:'Original instruction'}]};
function setup(options={}){const demo=createDemo(source,options),report={mode:'native',destination:demo.destination,checkpoint:{status:'baseline-read',freshSaved:clone(demo.server)}};return {demo,report};}
test('publication detects already-matching lessons without requesting another save',async()=>{const {demo,report}=setup();const result=await preparePublication(demo.pkg,report);assert.equal(result.status,'already-matches');assert.equal(result.changes.length,0);});
test('publication binding rejects a changed package or saved baseline before any staging',async()=>{
 const {demo,report}=setup({teaching:true}),result=await preparePublication(demo.pkg,report);assert.equal(result.status,'ready-for-companion-review');assert.equal(result.handoff.schemaVersion,2,'Older companions must reject the new bound package format');await validatePublicationBinding(result.handoff,demo.destination,demo.server);
 const changed=clone(result.handoff);changed.lesson.title='Altered';await assert.rejects(validatePublicationBinding(changed,demo.destination,demo.server),/approved content changed/);
 const modified=clone(demo.server);modified.background='outside change';await assert.rejects(validatePublicationBinding(result.handoff,demo.destination,modified),/saved destination changed/);
 let staging=0;demo.server=modified;demo.editor.saved=clone(modified);demo.editor.protection.bootstrap=clone(modified);const io={...demoAdapter(demo,()=>{}),checkpoint:async()=>{}};const bridge=io.bridge;io.bridge=async r=>{if(r.action!=='read')staging++;return bridge(r);};await assert.rejects(prepareTransfer(result.handoff,io),/saved destination changed/);assert.equal(staging,0);
});
test('unsupported collection edits block publication rather than silently dropping objectives',async()=>{const {demo,report}=setup();demo.pkg.lesson.frontMatter.objectives.pop();demo.pkg.baseline=clone(demo.pkg.lesson);const result=await preparePublication(demo.pkg,report);assert.equal(result.status,'blocked');assert.ok(result.blockers.some(x=>/objectives/i.test(x)));});
test('publication handoff completes preparation, one save and independent receipt verification in simulation',async()=>{
 const {demo,report}=setup({teaching:true}),result=await preparePublication(demo.pkg,report),storage=new Map(),adapter=demoAdapter(demo,()=>{});
 const io={...adapter,checkpoint:async()=>{},persist:async(k,v)=>storage.set(k,clone(v)),loadReceipt:async k=>storage.get(k)};
 const job=await approveTransfer(await prepareTransfer(result.handoff,io)),receipt=await executeTransfer(job,io);assert.equal(receipt.status,'saved-and-verified');
 const completed={mode:'native',pkg:result.handoff,job,receipt};const verification=await verifyPublicationReceipt(result.handoff,completed);assert.equal(verification.status,'saved-and-verified');assert.equal(verification.remoteRequests,0);
 await executeTransfer(job,io);assert.equal(demo.sendCount,1);const tampered=clone(completed);tampered.receipt.readback.overview='Corrupted';await assert.rejects(verifyPublicationReceipt(result.handoff,tampered),/verification failed/);
 await assert.rejects(verifyPublicationReceipt(result.handoff,{...completed,mode:'demo'}),/not a demo/);
});
