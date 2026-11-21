import test from 'node:test';
import assert from 'node:assert/strict';
import {clone,buildTransferPlan} from '../dist/transfer-core.mjs';
import {SANDBOX} from '../dist/core.mjs';
import {normalizeNativeCapture} from '../dist/transfer-native.mjs';
import {buildSaveReview,validateSaveReview,verifySavedReadback,saveRequestDigest,validateStagedSaveReview} from '../dist/save-review.mjs';
import {runApprovedSave} from '../dist/approved-save.mjs';
import {findUnitLevelConflicts} from '../dist/native-level-usage.mjs';

async function evidence(){
 const saved={id:8898985,name:'Playground title',overview:'Keep overview',studentOverview:'',purpose:null,preparation:'',assessmentOpportunities:'',lockable:false,hasLessonPlan:true,creativeCommonsLicense:null,background:null,assessment:null,unplugged:null,
  objectives:[{id:30,description:'Keep objective',scriptLevelIds:[]}],resources:[{id:40,key:'slides',name:'Slides',type:'Slides',audience:'Teacher',url:'https://example.com/slides',markdownKey:'slides/unit'}],vocabularies:[{id:50,key:'word',word:'Word',definition:'Keep'}],standards:[{id:60,frameworkShortcode:'framework',shortcode:'one'}],opportunityStandards:[],programmingExpressions:[{id:70,programmingEnvironmentName:'Python',key:'print'}],jitPlConcepts:[{id:80}],announcements:null,unknownFutureSetting:{keep:true},
  activities:[{id:10,name:'Activity',position:1,duration:5,unknown:'preserve',activitySections:[{id:20,name:'Section',description:'Keep guidance',duration:null,remarks:null,progressionName:'Group',position:1,tips:null,scriptLevels:[],unknownSection:{keep:true}}]}]};
 const initial={schemaVersion:1,kind:'native-dom-capture',readerVersion:'native-scalars-v1',destination:{id:saved.id,url:SANDBOX},saved:clone(saved),blockers:[],remoteWrites:false,
  live:{fields:{title:saved.name,teacherOverview:saved.overview,studentOverview:'',purpose:'',preparation:'',assessmentOpportunities:''},activities:clone(saved.activities),objectives:clone(saved.objectives),resources:saved.resources.map(({key,name,type,audience,url})=>({key,name,type,audience,url})),vocabularies:clone(saved.vocabularies)},
  protection:{bootstrap:clone(saved),unmanagedActivities:[{id:10,position:1,unknown:'preserve',activitySections:[{id:20,position:1,progressionName:'Group',tips:[],scriptLevels:[],unknownSection:{keep:true}}]}],controls:[{label:'Unrelated',value:'Keep'}],otherTables:[],objectives:clone(saved.objectives),resources:[],vocabularies:clone(saved.vocabularies)}};
 const lesson={title:saved.name,frontMatter:{teacherOverview:saved.overview,studentOverview:'',purpose:'',preparation:'',assessmentOpportunities:'',objectives:['Keep objective'],vocabulary:['Word: Keep']},activities:[{id:'a',title:'Activity',duration:5}],sections:[{id:'s',activityId:'a',title:'Section',body:'Keep guidance',duration:null,remarks:false,callouts:[],progression:{title:'Group',levels:[{key:'Existing level',number:1,assessment:true}]}}],resources:saved.resources.map(({key,name,type,audience,url})=>({key,name,type,audience,url}))};
 const pkg={schemaVersion:1,status:'approved-locally',sandbox:SANDBOX,lesson,baseline:clone(lesson),conflicts:[]},snapshot=normalizeNativeCapture(initial);snapshot.catalog.levels.push({key:'Existing level',verified:true});
 const plan=await buildTransferPlan(pkg,snapshot),staged=clone(initial),links=[{key:'Existing level',activeId:'100',levels:[{id:'100',name:'Existing level'}],assessment:true,activitySectionPosition:1}];
 staged.live.activities[0].activitySections[0].scriptLevels=clone(links);staged.protection.unmanagedActivities[0].activitySections[0].scriptLevels=clone(links);
 return {saved,rehearsal:{status:'passed-and-restored',checksPassed:true,restored:true,plan,initialCapture:initial,stagedCapture:staged,finalCapture:clone(initial),counts:{activities:1,sections:1,callouts:0,resources:1,levels:1,assessments:1}}};
}
function savedResult(review){const result=clone(review.baseline);result.activities=JSON.parse(JSON.parse(review.request.body).activities);let id=900;for(const a of result.activities)for(const s of a.activitySections)for(const sl of s.scriptLevels)sl.id=++id;return result;}

test('save dry run retains complete destination data and changes only the reviewed new links',async()=>{
 const {saved,rehearsal}=await evidence(),before=JSON.stringify(saved),review=await buildSaveReview(rehearsal,saved,{now:1000,originalLessonJson:JSON.stringify(saved)}),body=JSON.parse(review.request.body),activities=JSON.parse(body.activities);
 assert.equal(review.saveAllowed,false);assert.equal(review.remoteWrites,false);assert.equal(review.requiresRestaging,true);assert.equal(review.changes.length,1);
 assert.equal(body.creativeCommonsLicense,null);assert.equal(body.assessment,null);assert.deepEqual(JSON.parse(body.originalLessonData),saved);
 assert.equal(activities[0].unknown,'preserve');assert.equal(activities[0].activitySections[0].remarks,null);assert.equal(activities[0].activitySections[0].tips,null);assert.equal(activities[0].activitySections[0].id,20);
 assert.equal(activities[0].activitySections[0].scriptLevels[0].id,undefined);assert.equal(activities[0].activitySections[0].scriptLevels[0].levels[0].id,'100');
 assert.deepEqual(JSON.parse(body.resources),['slides']);assert.deepEqual(JSON.parse(body.vocabularies),['word']);assert.deepEqual(JSON.parse(body.jitPlConceptIds),[80]);assert.equal(JSON.stringify(saved),before);
});

test('changed saved content, wrong destinations and incomplete collection mappings block preparation',async()=>{
 const {saved,rehearsal}=await evidence();
 await assert.rejects(buildSaveReview(rehearsal,{...saved,name:'Outside edit'}),/changed after the rehearsal/);
 await assert.rejects(buildSaveReview(rehearsal,{...saved,id:1}),/identity/);
 const missing=clone(saved);delete missing.resources[0].key;const copy=clone(rehearsal);copy.initialCapture.saved=clone(missing);copy.stagedCapture.saved=clone(missing);copy.finalCapture.saved=clone(missing);
 await assert.rejects(buildSaveReview(copy,missing));
});

test('save review digest, expiry and immediate fresh-baseline checks are mandatory',async()=>{
 const {saved,rehearsal}=await evidence(),review=await buildSaveReview(rehearsal,saved,{now:1000,originalLessonJson:JSON.stringify(saved)});
 await validateSaveReview(review,{freshSaved:saved,now:1001});
 await assert.rejects(validateSaveReview(review,{now:review.expiresAt+1}),/expired/);
 await assert.rejects(validateSaveReview(review,{freshSaved:{...saved,preparation:'Outside edit'},now:1001}),/changed after review/);
 const changed=clone(review);changed.request.body='{}';await assert.rejects(validateSaveReview(changed,{now:1001}),/review changed/);
});

test('server conflict JSON retains original property order across sorted extension-object transport',async()=>{
 const {saved,rehearsal}=await evidence(),raw=JSON.stringify(saved),transported=Object.fromEntries(Object.keys(saved).sort().map(key=>[key,saved[key]]));
 assert.notEqual(JSON.stringify(transported),raw);
 const review=await buildSaveReview(rehearsal,transported,{originalLessonJson:raw});assert.equal(JSON.parse(review.request.body).originalLessonData,raw);
 await assert.rejects(buildSaveReview(rehearsal,transported),/exact original server snapshot/);
});

test('saved readback accepts generated association ids and verifies original record preservation',async()=>{
 const {saved,rehearsal}=await evidence(),review=await buildSaveReview(rehearsal,saved,{originalLessonJson:JSON.stringify(saved)}),result=await verifySavedReadback(review,savedResult(review));
 assert.equal(result.passed,true);assert.equal(result.saveRetried,false);
});

test('saved readback flags wrong level records, lost assessment flags and unrelated setting changes',async()=>{
 const {saved,rehearsal}=await evidence(),review=await buildSaveReview(rehearsal,saved,{originalLessonJson:JSON.stringify(saved)}),actual=savedResult(review);
 actual.activities[0].activitySections[0].scriptLevels[0].levels[0].id='101';actual.activities[0].activitySections[0].scriptLevels[0].assessment=false;actual.unknownFutureSetting.keep=false;
 const result=await verifySavedReadback(review,actual);assert.equal(result.passed,false);assert.ok(result.mismatches.some(s=>s.includes('different level record')));assert.ok(result.mismatches.some(s=>s.includes('assessment flags')));assert.ok(result.mismatches.some(s=>s.includes('outside')));
});

test('incomplete saved responses and blank generated identities cannot pass readback',async()=>{
 const {saved,rehearsal}=await evidence(),review=await buildSaveReview(rehearsal,saved,{originalLessonJson:JSON.stringify(saved)});
 assert.equal((await verifySavedReadback(review,{id:8898985})).passed,false);
 const actual=savedResult(review);actual.activities[0].activitySections[0].scriptLevels[0].id='';assert.equal((await verifySavedReadback(review,actual)).passed,false);
});

test('approval binds complete semantic request while retaining the exact Rails snapshot',async()=>{
 const {saved,rehearsal}=await evidence(),review=await buildSaveReview(rehearsal,saved,{originalLessonJson:JSON.stringify(saved)});
 const reordered=clone(review),body=JSON.parse(reordered.request.body);body.originalLessonData=JSON.stringify(Object.fromEntries(Object.entries(saved).reverse()));reordered.request.body=JSON.stringify(body);
 assert.equal(await saveRequestDigest(review),await saveRequestDigest(reordered));
 body.name='Unapproved title';reordered.request.body=JSON.stringify(body);assert.notEqual(await saveRequestDigest(review),await saveRequestDigest(reordered));
 await validateStagedSaveReview(review,rehearsal.stagedCapture);
 const outside=clone(rehearsal.stagedCapture);outside.protection.controls[0].value='Outside edit';await assert.rejects(validateStagedSaveReview(review,outside),/Unreviewed settings/);
 const wrong=clone(rehearsal.stagedCapture);wrong.live.activities[0].activitySections[0].scriptLevels[0].levels[0].id='101';await assert.rejects(validateStagedSaveReview(review,wrong),/identity changed/);
});

async function approvedHarness(){
 const {saved,rehearsal}=await evidence(),review=await buildSaveReview(rehearsal,saved,{originalLessonJson:JSON.stringify(saved)}),key=await saveRequestDigest(review);
 const job={review,rehearsal,approval:{approved:true,approvedRequestDigest:key}},storage=new Map(),events=[];
 let server=clone(saved),editor=clone(rehearsal.initialCapture),sendCount=0;
 const dependencies={readSaved:async()=>({lesson:clone(server),originalLessonJson:JSON.stringify(server)}),readEditor:async()=>clone(editor),checkUsage:async()=>({passed:true,conflicts:[]}),
  stage:async()=>{events.push('stage');editor=clone(rehearsal.stagedCapture);return {...clone(rehearsal),status:'staged-unsaved'};},
  loadReceipt:async key=>storage.get(key),persist:async(key,value)=>{events.push(value.status);storage.set(key,clone(value));},checkpoint:async value=>{events.push(value.status);},
  send:async()=>{const receiptKey=key+(job.approval.attemptId?':'+job.approval.attemptId:'');assert.equal(storage.get(receiptKey)?.attempted,true);events.push('send');sendCount++;server=savedResult(review);return {ok:true};}};
 return {job,dependencies,storage,events,get sendCount(){return sendCount;},changeSaved:()=>{server.name='Outside saved title';},changeEditor:()=>{editor.live.fields.title='Outside unsaved title';},restoreEditor:()=>{editor=clone(rehearsal.initialCapture);}};
}

test('approved save checkpoints before dispatch and verifies independently, then never resends',async()=>{
 const h=await approvedHarness(),first=await runApprovedSave(h.job,h.dependencies);
 assert.equal(first.status,'saved-and-verified');assert.equal(h.sendCount,1);assert.ok(h.events.indexOf('dispatching')<h.events.indexOf('send'));assert.ok(first.restorePoint.originalLessonJson);
 const second=await runApprovedSave(h.job,h.dependencies);assert.equal(second.status,'saved-and-verified');assert.equal(h.sendCount,1);
});

test('HTTP 200 with unchanged saved baseline stays unconfirmed and readback-only across reloads',async()=>{
 const h=await approvedHarness();let sends=0;
 h.dependencies.send=async()=>{sends++;return {ok:true,httpStatus:200,outcome:'response-received',responseSummary:{kind:'lesson-summary',lessonId:h.job.review.destination.id,levelAssociations:0}};};
 const first=await runApprovedSave(h.job,h.dependencies);
 assert.equal(first.status,'save-not-confirmed');assert.equal(first.verification.baselineUnchanged,true);assert.equal(first.verification.passed,false);
 assert.equal(first.dispatch.responseSummary.levelAssociations,0);
 const again=await runApprovedSave(clone(h.job),h.dependencies);assert.equal(again.status,'save-not-confirmed');assert.equal(sends,1);assert.equal(again.saveRetried,false);
});

test('missing approval, changed server and outside editor edits block before staging or saving',async()=>{
 for(const scenario of ['approval','saved','editor']){
  const h=await approvedHarness();if(scenario==='approval')h.job.approval.approved=false;if(scenario==='saved')h.changeSaved();if(scenario==='editor')h.changeEditor();
  await assert.rejects(runApprovedSave(h.job,h.dependencies));assert.equal(h.sendCount,0);assert.equal(h.events.includes('stage'),false);
 }
});

test('ambiguous dispatched save is read back without a second write, including restart',async()=>{
 const h=await approvedHarness(),original=h.dependencies.send;
 h.dependencies.send=async request=>{await original(request);throw Error('transport timeout after commit');};
 const result=await runApprovedSave(h.job,h.dependencies);assert.equal(result.status,'saved-and-verified');assert.equal(result.dispatch.outcome,'unknown');
 await runApprovedSave(h.job,h.dependencies);assert.equal(h.sendCount,1);
 const stopped=await approvedHarness();let attempts=0;stopped.dependencies.send=async()=>{attempts++;throw Error('network failed');};
 assert.equal((await runApprovedSave(stopped.job,stopped.dependencies)).status,'save-not-confirmed');
 assert.equal((await runApprovedSave(stopped.job,stopped.dependencies)).status,'save-not-confirmed');assert.equal(attempts,1);
});

test('receipt persistence failure prevents dispatch and baseline changes during staging block saving',async()=>{
 const h=await approvedHarness();h.dependencies.persist=async()=>{throw Error('storage full');};await assert.rejects(runApprovedSave(h.job,h.dependencies),/storage full/);assert.equal(h.sendCount,0);
 const changed=await approvedHarness(),stage=changed.dependencies.stage;changed.dependencies.stage=async()=>{const result=await stage();changed.changeSaved();return result;};
 await assert.rejects(runApprovedSave(changed.job,changed.dependencies),/changed after review/);assert.equal(changed.sendCount,0);
});

test('interrupted unsaved staging recovers only through the guarded owner checkpoint before save',async()=>{
 const h=await approvedHarness();h.changeEditor();let recovered=0;
 h.dependencies.recover=async()=>{recovered++;h.restoreEditor();};
 assert.equal((await runApprovedSave(h.job,h.dependencies)).status,'saved-and-verified');assert.equal(recovered,1);assert.equal(h.sendCount,1);
 const outside=await approvedHarness();outside.changeEditor();outside.dependencies.recover=async()=>{throw Error('Outside edits prevent cleanup');};
 await assert.rejects(runApprovedSave(outside.job,outside.dependencies),/Outside edits/);assert.equal(outside.sendCount,0);
});

test('fresh unchecked remarks null and false are equivalent but checked remarks still block',async()=>{
 const h=await approvedHarness(),read=h.dependencies.readEditor;
 h.dependencies.readEditor=async()=>{const capture=await read();capture.live.activities[0].activitySections[0].remarks=false;return capture;};
 assert.equal((await runApprovedSave(h.job,h.dependencies)).status,'saved-and-verified');assert.equal(h.sendCount,1);
 const changed=await approvedHarness(),readChanged=changed.dependencies.readEditor;
 changed.dependencies.readEditor=async()=>{const capture=await readChanged();capture.live.activities[0].activitySections[0].remarks=true;return capture;};
 await assert.rejects(runApprovedSave(changed.job,changed.dependencies),/editor changed/);assert.equal(changed.sendCount,0);
});

test('server rejection with exact baseline readback reports unchanged rather than saved',async()=>{
 const h=await approvedHarness();let attempts=0;
 h.dependencies.send=async()=>{attempts++;return {ok:false,httpStatus:500,outcome:'rejected'};};
 const result=await runApprovedSave(h.job,h.dependencies);
 assert.equal(result.status,'save-rejected-unchanged');assert.equal(result.verification.saved,false);assert.equal(result.verification.baselineUnchanged,true);
 const restarted=await runApprovedSave(h.job,h.dependencies);assert.equal(restarted.status,'save-rejected-unchanged');assert.equal(attempts,1);
});

test('same-unit usage conflicts block before staging; other-unit reuse is allowed with exact evidence',async()=>{
 const h=await approvedHarness();h.dependencies.checkUsage=async()=>({passed:false,conflicts:[{name:'Existing level'}]});
 await assert.rejects(runApprovedSave(h.job,h.dependencies),/already used in the destination unit/);assert.equal(h.events.includes('stage'),false);assert.equal(h.sendCount,0);
 const review=clone(h.job.review);review.baseline.lessonPath='/s/playground/lessons/11';
 const usage={kind:'native-level-usage',levelId:'100',name:'Existing level',paths:['/s/source/lessons/16/levels/1']};
 assert.equal(findUnitLevelConflicts(review,[usage]).passed,true);
 usage.paths.push('/s/playground/lessons/10/levels/1');assert.equal(findUnitLevelConflicts(review,[usage]).conflicts.length,1);
 assert.throws(()=>findUnitLevelConflicts(review,[]),/Unique/);assert.throws(()=>findUnitLevelConflicts(review,[usage,usage]),/Unique/);
});

test('a user-authorized new attempt preserves the rejected receipt and still cannot resend itself',async()=>{
 const h=await approvedHarness(),key=h.job.approval.approvedRequestDigest;
 const rejected={requestDigest:key,attempted:true,dispatch:{outcome:'rejected',httpStatus:500},readback:clone(h.job.review.baseline),attemptedAt:'earlier'};
 h.storage.set(key,clone(rejected));h.job.previousAttempt=rejected;Object.assign(h.job.approval,{attemptId:'user-cleared-duplicates',retryAuthorizedByUser:true});
 assert.equal((await runApprovedSave(h.job,h.dependencies)).status,'saved-and-verified');assert.equal(h.storage.get(key).dispatch.outcome,'rejected');assert.equal(h.sendCount,1);
 await runApprovedSave(h.job,h.dependencies);assert.equal(h.sendCount,1);
 const bad=await approvedHarness();bad.job.previousAttempt={...rejected,requestDigest:bad.job.approval.approvedRequestDigest,dispatch:{outcome:'unknown'}};Object.assign(bad.job.approval,{attemptId:'unsafe',retryAuthorizedByUser:true});
 await assert.rejects(runApprovedSave(bad.job,bad.dependencies),/confirmed rejected/);assert.equal(bad.sendCount,0);
 delete bad.job.approval.retryAuthorizedByUser;await assert.rejects(runApprovedSave(bad.job,bad.dependencies),/explicit user authorization/);
});

test('a failed independent read can recover with readback only and clears its stale error',async()=>{
 const h=await approvedHarness(),read=h.dependencies.readSaved,send=h.dependencies.send;let offline=false;
 h.dependencies.send=async()=>{const result=await send();offline=true;return result;};
 h.dependencies.readSaved=async()=>{if(offline)throw Error('Temporary read failure');return read();};
 const first=await runApprovedSave(h.job,h.dependencies);assert.equal(first.status,'save-not-confirmed');assert.equal(first.readbackError,'Temporary read failure');
 offline=false;const next=await runApprovedSave(h.job,h.dependencies);assert.equal(next.status,'saved-and-verified');assert.equal(next.readbackError,undefined);assert.equal(h.sendCount,1);
});

test('new reviews bind native transport while legacy direct API reviews retain their digest',async()=>{
 const {saved,rehearsal}=await evidence();
 const native=await buildSaveReview(rehearsal,saved,{originalLessonJson:JSON.stringify(saved)}),api=await buildSaveReview(rehearsal,saved,{originalLessonJson:JSON.stringify(saved),transport:'direct-api'});
 assert.equal(native.transport,'native-editor');assert.notEqual(await saveRequestDigest(native),await saveRequestDigest(api));
 const old=clone(api);delete old.transport;assert.notEqual(await saveRequestDigest(old),await saveRequestDigest(native));
 await assert.rejects(buildSaveReview(rehearsal,saved,{originalLessonJson:JSON.stringify(saved),transport:'unknown'}),/Unsupported save transport/);
});
