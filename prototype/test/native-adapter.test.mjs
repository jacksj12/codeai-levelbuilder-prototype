import test from 'node:test';
import assert from 'node:assert/strict';
import {clone,digest,buildTransferPlan,canonical} from '../dist/transfer-core.mjs';
import {SANDBOX} from '../dist/core.mjs';
import {normalizeNativeCapture} from '../dist/transfer-native.mjs';
import {makeNativeScalarDriver,unsupportedNativeActions,nativeEditorBridge} from '../dist/native-dom-adapter.mjs';
import {stagePlan} from '../dist/transfer-runner.mjs';
import {stageNativeTransferPlan,unsupportedNativeTransferActions} from '../dist/native-transfer-runner.mjs';
import {runAcceptedNativeRehearsal} from '../dist/native-level-verification.mjs';
import {runNativeVerification,recoverNativeVerification,verificationPlan} from '../dist/native-verification.mjs';
import {runNativeStructureVerification,recoverEmptyNativeSection,recoverNativeStructureCheck,buildNativeStructureCheckPlan} from '../dist/native-structure-verification.mjs';
function capture(){return {schemaVersion:1,kind:'native-dom-capture',readerVersion:'native-scalars-v1',fixture:true,destination:{id:8898985,url:SANDBOX},
 saved:{id:8898985,resources:[],vocabularies:[],futureSetting:{keep:true}},blockers:[],
 live:{fields:{title:'Native title',teacherOverview:'Original overview',studentOverview:'',purpose:'',preparation:'',assessmentOpportunities:''},vocabularies:[],resources:[],objectives:[],activities:[{id:10,name:'Activity',duration:5,activitySections:[{id:11,name:'',duration:'',description:'Original guidance',remarks:false,tips:[],scriptLevels:[]}]}]},
 protection:{bootstrap:{id:8898985,futureSetting:'keep'},unmanagedActivities:[{id:10,activitySections:[{id:11,scriptLevels:[],tips:[]}]}],controls:[{label:'Unknown control',value:'keep'}],otherTables:[{headers:['Standard'],rows:['keep']}],objectives:[],resources:[],vocabularies:[]}};}
function packageFor(c){const fields=c.live.fields,lesson={title:fields.title,frontMatter:{teacherOverview:fields.teacherOverview,studentOverview:'',purpose:'',preparation:'',assessmentOpportunities:'',objectives:[],vocabulary:[]},resources:[],activities:[{id:'a',title:'Activity',duration:5}],sections:[{id:'s',activityId:'a',title:'',duration:null,body:'Original guidance',remarks:false,callouts:[],progression:null}]};return {schemaVersion:1,status:'approved-locally',sandbox:SANDBOX,lesson,baseline:clone(lesson),conflicts:[]};}
async function approvedPlan(pkg,snapshot){pkg.baseline=clone(pkg.lesson);const first=await buildTransferPlan(pkg,snapshot);return buildTransferPlan(pkg,snapshot,Object.fromEntries(first.operations.filter(op=>op.requiresDecision).map(op=>[op.id,'replace'])));}
function bridgeFor(initial){let current=clone(initial),writes=0;return {get current(){return current;},get writes(){return writes;},call:async request=>{
 if(request.action==='read')return clone(current);
 assert.equal(request.action,'set-scalar');assert.equal(request.mode,'unsaved-scalar-staging');assert.equal(request.expectedCaptureDigest,await digest(current));writes++;
 const p=request.operation.path,value=request.operation.after;
 if(p[0]==='title')current.live.fields.title=value;
 else if(p[0]==='frontMatter')current.live.fields[p[1]]=value;
 else{const a=current.live.activities[p[1]];if(p.length===3)a[p[2]==='title'?'name':p[2]]=value===null?'':value;else a.activitySections[p[3]][{title:'name',duration:'duration',body:'description',remarks:'remarks'}[p[4]]]=value===null?'':p[4]==='duration'?String(value):value;}
 return clone(current);
 }};}

function levelBridge({missing=false}={}){
 const initial=capture();initial.live.activities[0].activitySections[0].progressionName='';initial.protection.unmanagedActivities[0].activitySections[0].progressionName='';
 let current=clone(initial),writes=0;
 return {initial,get current(){return current;},get writes(){return writes;},call:async request=>{
  if(request.action==='read')return clone(current);
  assert.equal(request.expectedCaptureDigest,await digest(current));
  if(request.action==='lookup-levels')return {kind:'native-level-mappings',capture:clone(current),mappings:missing?[]:request.names.map(key=>({key,verified:true,verification:'exact-native-picker-row'}))};
  const section=current.live.activities[0].activitySections[0],protectedSection=current.protection.unmanagedActivities[0].activitySections[0];writes++;
  if(request.action==='append-progression'){
   section.progressionName=request.operation.after.title;section.scriptLevels=request.operation.after.levels.map((l,i)=>({key:'scriptLevel-'+i,activeId:12000+i,levels:[{id:12000+i,name:l.key}],assessment:l.assessment}));
   protectedSection.progressionName=section.progressionName;protectedSection.scriptLevels=clone(section.scriptLevels);
  }else{assert.equal(request.action,'clear-owned-progression');section.scriptLevels=[];section.progressionName=request.operation.restoreProgressionName;protectedSection.scriptLevels=[];protectedSection.progressionName=section.progressionName;}
  return clone(current);
 }};
}
function levelPackage(initial){const pkg=packageFor(initial);pkg.lesson.title='Older approved title';pkg.lesson.sections[0].progression={title:'Reviewed progression',levels:[{key:'Existing Level A',number:1,assessment:false},{key:'Existing Level B',number:2,assessment:true}]};pkg.baseline=clone(pkg.lesson);return pkg;}

test('accepted native rehearsal verifies mappings, preserves destination naming, links flags, reruns, and restores',async()=>{
 const bridge=levelBridge(),result=await runAcceptedNativeRehearsal(bridge.call,levelPackage(bridge.initial));
 assert.equal(result.status,'passed-and-restored');assert.equal(result.counts.levels,2);assert.equal(result.counts.assessments,1);
 assert.equal(result.stagedCapture.live.fields.title,'Native title');assert.equal(result.reports.at(-1).items[0].status,'already-present');
 assert.equal(bridge.writes,2);assert.deepEqual(bridge.current,bridge.initial);
});

test('missing native exact-name mappings block the accepted rehearsal before association writes',async()=>{
 const bridge=levelBridge({missing:true}),result=await runAcceptedNativeRehearsal(bridge.call,levelPackage(bridge.initial));
 assert.equal(result.status,'blocked');assert.equal(result.restored,true);assert.equal(bridge.writes,0);
});

test('accepted native rehearsal refuses cleanup when an outside edit changes the original capture',async()=>{
 const bridge=levelBridge(),result=await runAcceptedNativeRehearsal(bridge.call,levelPackage(bridge.initial),{onProgress:message=>{if(message.startsWith('Restoring'))bridge.current.live.fields.title='Outside edit';}});
 assert.equal(result.status,'blocked');assert.equal(result.restored,false);assert.match(result.restorationError,/Outside changes/);assert.equal(bridge.current.live.fields.title,'Outside edit');assert.equal(bridge.writes,1);
});

function collectionBridge(initial,{loseCalloutAck=false}={}){
 const base=bridgeFor(initial);let added=0,writes=0,lost=false;
 return {get current(){return base.current;},get writes(){return writes+base.writes;},call:async request=>{
  if(!['append-section','append-callout'].includes(request.action))return base.call(request);
  assert.equal(request.expectedCaptureDigest,await digest(base.current));writes++;
  const p=request.operation.path,a=base.current.live.activities[p[1]],protectedActivity=base.current.protection.unmanagedActivities[p[1]];
  if(request.action==='append-section'){
   const key='activitySection-'+(++added);a.activitySections.push({key,name:'',description:'',duration:'',remarks:false,tips:[],scriptLevels:[]});protectedActivity.activitySections.push({key,tips:[],scriptLevels:[]});
  }else{
   const type={'Teaching Tip':'teachingTip','Content Corner':'contentCorner','Discussion Goal':'discussionGoal','Assessment Opportunity':'assessmentOpportunity','Ethics Opportunity':'ethicsOpportunity'}[request.operation.after.type];
   const tip={key:'new-tip-'+a.activitySections[p[3]].tips.length,type,markdown:request.operation.after.body};a.activitySections[p[3]].tips.push(tip);protectedActivity.activitySections[p[3]].tips.push(clone(tip));
   if(loseCalloutAck&&!lost){lost=true;throw Error('Lost acknowledgement');}
  }
  return clone(base.current);
 }};
}

async function structuralPlan(c){
 const pkg=packageFor(c);pkg.lesson.sections.push({id:'new',activityId:'a',title:'New section',duration:1,body:'New guidance',remarks:true,callouts:[{type:'Teaching Tip',body:'Reviewed tip'}],progression:null});
 return approvedPlan(pkg,normalizeNativeCapture(c));
}

test('reviewed native structural transfer checkpoints generated identities across resume and no-op rerun',async()=>{
 const c=capture(),plan=await structuralPlan(c),bridge=collectionBridge(c);
 assert.equal(unsupportedNativeTransferActions(plan).length,0);
 const first=await stageNativeTransferPlan(plan,bridge.call,{maxOperations:1});assert.equal(first.completed,1);assert.equal(first.status,'interrupted');
 const key=bridge.current.live.activities[0].activitySections[1].key;
 const completed=await stageNativeTransferPlan(plan,bridge.call,{journal:first.journal});assert.equal(completed.status,'staged-unsaved');
 const writes=bridge.writes,rerun=await stageNativeTransferPlan(plan,bridge.call,{journal:completed.journal});
 assert.equal(rerun.status,'staged-unsaved');assert.equal(bridge.writes,writes);assert.equal(bridge.current.live.activities[0].activitySections.length,2);assert.equal(bridge.current.live.activities[0].activitySections[1].key,key);
 assert.equal(bridge.current.live.activities[0].activitySections[0].id,11);
 assert.deepEqual(normalizeNativeCapture(bridge.current).lesson,plan.expectedLesson);
});

test('reviewed native transfer rejects unsupported later operations before any valid prefix',async()=>{
 const c=capture(),pkg=packageFor(c);pkg.lesson.title='Supported';pkg.lesson.frontMatter.vocabulary=['Unsupported: shared write'];const plan=await approvedPlan(pkg,normalizeNativeCapture(c)),bridge=collectionBridge(c);
 assert.ok(plan.blockers.some(b=>b.includes('verified shared record')));await assert.rejects(stageNativeTransferPlan(plan,bridge.call),/Resolve every transfer blocker/);assert.equal(bridge.writes,0);
});

test('native structural transfer recovers lost acknowledgement without duplicating a callout',async()=>{
 const c=capture(),plan=await structuralPlan(c),bridge=collectionBridge(c,{loseCalloutAck:true});
 const report=await stageNativeTransferPlan(plan,bridge.call);assert.equal(report.status,'staged-unsaved');assert.equal(report.recovered,true);assert.equal(bridge.current.live.activities[0].activitySections[1].tips.length,1);
});

test('native structural checkpoint refuses replay after reload loses generated unsaved identities',async()=>{
 const c=capture(),plan=await structuralPlan(c),bridge=collectionBridge(c),first=await stageNativeTransferPlan(plan,bridge.call,{maxOperations:1});
 const reloaded=collectionBridge(c);await assert.rejects(stageNativeTransferPlan(plan,reloaded.call,{journal:first.journal}),/lost unsaved progress/);assert.equal(reloaded.writes,0);
});

test('automated native check resumes, reruns without writes, and restores original evidence',async()=>{
 const initial=capture(),bridge=bridgeFor(initial),report=await runNativeVerification(bridge.call);
 assert.equal(report.status,'passed-and-restored');assert.equal(report.restored,true);
 assert.equal(report.reports[0].completed,1);assert.equal(report.reports[1].completed,12);
 assert.ok(report.reports[2].items.every(item=>item.status==='already-present'));
 assert.equal(bridge.writes,24);assert.deepEqual(bridge.current,initial);
});

test('structural automation adds five callouts and removes only its own new section',async()=>{
 const initial=capture(),bridge=bridgeFor(initial);let appends=0,removals=0;
 const call=async request=>{
  if(!['append-section','append-callout','remove-created-section'].includes(request.action))return bridge.call(request);
  assert.equal(request.expectedCaptureDigest,await digest(bridge.current));
  const c=bridge.current,activity=c.live.activities[0],protectedActivity=c.protection.unmanagedActivities[0];
  if(request.action==='append-section'){
   const section={key:'activitySection-1',name:'',duration:'',description:'',remarks:false,tips:[],scriptLevels:[]};
   activity.activitySections.push(section);protectedActivity.activitySections.push({key:section.key,tips:[],scriptLevels:[]});appends++;
  }else if(request.action==='append-callout'){
   const types={'Teaching Tip':'teachingTip','Content Corner':'contentCorner','Discussion Goal':'discussionGoal','Assessment Opportunity':'assessmentOpportunity','Ethics Opportunity':'ethicsOpportunity'};
   const tip={type:types[request.operation.after.type],markdown:request.operation.after.body};
   activity.activitySections.at(-1).tips.push(tip);protectedActivity.activitySections.at(-1).tips.push(clone(tip));appends++;
  }else{
   assert.equal(request.operation.createdKey,'activitySection-1');
   activity.activitySections.pop();protectedActivity.activitySections.pop();removals++;
  }
  return clone(c);
 };
 const result=await runNativeStructureVerification(call);
 assert.equal(result.status,'passed-and-restored');assert.equal(result.callouts.length,5);
 assert.equal(appends,6);assert.equal(removals,1);assert.deepEqual(bridge.current,initial);
});

test('complete automatic suite reports a skipped zero-minute field and preserves it exactly',async()=>{
 const c=capture();c.live.activities[0].activitySections[0].duration=0;const bridge=bridgeFor(c);
 const report=await runNativeVerification(bridge.call);
 assert.equal(report.status,'passed-and-restored');assert.equal(report.fields.length,11);
 assert.equal(report.skipped.length,1);assert.deepEqual(bridge.current,c);
});

test('native live numeric strings normalize to minutes while blank and zero stay distinct',()=>{
 const c=capture();c.live.activities[0].duration='5';c.live.activities[0].activitySections[0].duration='1';
 const s=normalizeNativeCapture(c);assert.equal(s.lesson.activities[0].duration,5);assert.equal(s.lesson.activities[0].sections[0].duration,1);
 c.live.activities[0].activitySections[0].duration='0';assert.equal(normalizeNativeCapture(c).lesson.activities[0].sections[0].duration,0);
 c.live.activities[0].activitySections[0].duration='01';assert.ok(normalizeNativeCapture(c).blockers.length);
});

test('recovery recognizes an applied string-valued timing checkpoint and restores the original blank',async()=>{
 const c=capture(),bridge=bridgeFor(c),initial=normalizeNativeCapture(c);
 const plan=await verificationPlan(initial,[{path:['title'],after:'Temporary title'},{path:['activities',0,'duration'],after:6},{path:['activities',0,'sections',0,'duration'],after:1}]);
 for(const op of plan.operations)await bridge.call({action:'set-scalar',mode:'unsaved-scalar-staging',operation:op,expectedCaptureDigest:await digest(bridge.current)});
 assert.equal(bridge.current.live.activities[0].activitySections[0].duration,'1');
 const recovery=await recoverNativeVerification(bridge.call,{plan,initialCapture:c});
 assert.equal(recovery.restored,true);assert.deepEqual(bridge.current,c);
});

test('recovery refuses an outside edit instead of overwriting it',async()=>{
 const c=capture(),bridge=bridgeFor(c),plan=await verificationPlan(normalizeNativeCapture(c),[{path:['title'],after:'Temporary title'}]);
 bridge.current.live.fields.title='Outside edit';
 await assert.rejects(recoverNativeVerification(bridge.call,{plan,initialCapture:c}),/outside the verification checkpoints/);
 assert.equal(bridge.writes,0);
});

test('structural recovery removes only a recognized empty generated section and retains outside content',async()=>{
 const initial=capture(),current=clone(initial);
 current.live.activities[0].activitySections.push({key:'activitySection-1',name:'',duration:'0',description:'',remarks:false,tips:[],scriptLevels:[]});
 current.protection.unmanagedActivities[0].activitySections.push({key:'activitySection-1',tips:[],scriptLevels:[]});
 let removed=0;
 const bridge=async request=>{if(request.action==='read')return clone(current);assert.equal(request.action,'remove-created-section');assert.equal(request.expectedCaptureDigest,await digest(current));removed++;return clone(initial);};
 assert.equal((await recoverEmptyNativeSection(bridge,{initialCapture:initial})).restored,true);assert.equal(removed,1);
 current.live.activities[0].activitySections.at(-1).description='Outside content';
 await assert.rejects(recoverEmptyNativeSection(bridge,{initialCapture:initial}),/will not delete/);assert.equal(removed,1);
});

test('automatic suite records its recovery baseline before the first native mutation',async()=>{
 const initial=capture(),bridge=bridgeFor(initial);let checkpoint;
 const result=await runNativeVerification(bridge.call,{onCheckpoint:value=>{assert.equal(bridge.writes,0);checkpoint=value;}});
 assert.equal(result.status,'passed-and-restored');assert.equal(checkpoint.status,'running');assert.equal(checkpoint.restored,false);assert.equal(checkpoint.plan.operations.length,12);assert.deepEqual(checkpoint.initialCapture,initial);
});

test('structural recovery recognizes a partially filled generated test section',async()=>{
 const initial=capture(),bridge=collectionBridge(initial),plan=await buildNativeStructureCheckPlan(normalizeNativeCapture(initial));
 const partial=await stageNativeTransferPlan(plan,bridge.call,{maxOperations:4});assert.equal(partial.completed,4);
 const call=async request=>{
  if(request.action!=='remove-created-section')return bridge.call(request);
  assert.equal(request.expectedCaptureDigest,await digest(bridge.current));
  bridge.current.live.activities[0].activitySections.pop();bridge.current.protection.unmanagedActivities[0].activitySections.pop();return clone(bridge.current);
 };
 const result=await recoverNativeStructureCheck(call,{initialCapture:initial,plan,createdKey:'activitySection-1'});
 assert.equal(result.restored,true);assert.deepEqual(bridge.current,initial);
});

test('automatic cleanup preserves outside edits instead of overwriting an unknown checkpoint',async()=>{
 const bridge=bridgeFor(capture());let injected=false;
 const report=await runNativeVerification(bridge.call,{onProgress:()=>{if(!injected){injected=true;bridge.current.live.fields.title='Outside edit';}}});
 assert.equal(report.status,'blocked');assert.equal(report.restored,false);
 assert.equal(bridge.current.live.fields.title,'Outside edit');assert.match(report.restorationError,/Outside changes/);
});

test('automated check restores a recognized partial state after a failed second write',async()=>{
 const initial=capture(),bridge=bridgeFor(initial);let failed=false;
 const call=async request=>{if(request.action==='set-scalar'&&request.operation.path[0]==='activities'&&!failed){failed=true;throw Error('Interrupted transport');}return bridge.call(request);};
 const report=await runNativeVerification(call);
 assert.equal(report.status,'blocked');assert.equal(report.restored,true);assert.deepEqual(bridge.current,initial);
});
test('native capability preflight rejects collections, associations and fractional timing',()=>{
 const valid=[['title'],['frontMatter','teacherOverview'],['activities',0,'title'],['activities',0,'sections',0,'body'],['activities',0,'sections',0,'remarks']].map(path=>({kind:'set',path,after:path.at(-1)==='remarks'?true:'New text'}));
 assert.equal(unsupportedNativeActions({operations:valid}).length,0);
 const bad=[{kind:'append',path:['activities'],after:{}},{kind:'set',path:['frontMatter','objectives'],after:[]},{kind:'set',path:['activities',0,'sections',0,'progression'],after:{}},{kind:'set',path:['activities',0,'duration'],after:1.5},{kind:'set',path:['activities',0,'sections',0,'duration'],after:0}];
 assert.equal(unsupportedNativeActions({operations:bad}).length,bad.length);
});
test('native driver shares bounded resume/readback while preserving immutable evidence and unknown properties',async()=>{
 const initial=capture(),snapshot=normalizeNativeCapture(initial),pkg=packageFor(initial);
 pkg.lesson.title='Reviewed native title';pkg.lesson.frontMatter.teacherOverview='Reviewed overview';pkg.lesson.sections[0].body+=' and a reviewed addition';pkg.lesson.sections[0].remarks=true;
 const plan=await approvedPlan(pkg,snapshot),bridge=bridgeFor(initial),driver=makeNativeScalarDriver(snapshot,bridge.call);
 const first=await stagePlan(plan,driver,{maxOperations:2});assert.equal(first.status,'interrupted');assert.equal(first.completed,2);
 const next=await stagePlan(plan,driver,{journal:first.journal});assert.equal(next.status,'staged-unsaved');
 const final=await driver.read();assert.deepEqual(final.lesson,plan.expectedLesson);assert.deepEqual(final.raw,initial);assert.deepEqual(final.nativeProtection,initial.protection);
 const writes=bridge.writes;await stagePlan(plan,driver,{journal:next.journal});assert.equal(bridge.writes,writes);
 assert.equal(canonical(bridge.current.protection),canonical(initial.protection));
});
test('unsupported native plan fails before any mutation, even if its scalar prefix is valid',async()=>{
 const c=capture(),snapshot=normalizeNativeCapture(c),pkg=packageFor(c);pkg.lesson.title='A valid scalar';pkg.lesson.frontMatter.objectives=['New objective'];
 const plan=await approvedPlan(pkg,snapshot),bridge=bridgeFor(c);await assert.rejects(stagePlan(plan,makeNativeScalarDriver(snapshot,bridge.call)),/does not yet support/);assert.equal(bridge.writes,0);
});
test('native outside edits to unrelated controls block staging without a write',async()=>{
 const c=capture(),snapshot=normalizeNativeCapture(c),pkg=packageFor(c);pkg.lesson.title='Reviewed change';const plan=await approvedPlan(pkg,snapshot),bridge=bridgeFor(c);
 bridge.current.protection.controls[0].value='Outside edit';await assert.rejects(stagePlan(plan,makeNativeScalarDriver(snapshot,bridge.call)),/changed outside/);assert.equal(bridge.writes,0);
});
test('native page reload losing unsaved fields is not blindly replayed from a later journal',async()=>{
 const c=capture(),snapshot=normalizeNativeCapture(c),pkg=packageFor(c);pkg.lesson.title='Reviewed title';const plan=await approvedPlan(pkg,snapshot),bridge=bridgeFor(c);
 const completed=await stagePlan(plan,makeNativeScalarDriver(snapshot,bridge.call));assert.equal(completed.completed,1);
 const reloaded=bridgeFor(c);await assert.rejects(stagePlan(plan,makeNativeScalarDriver(snapshot,reloaded.call),{journal:completed.journal}),/lost previously staged/);assert.equal(reloaded.writes,0);
});
test('a visible native zero-minute value requires an explicit reviewed clear to become blank',async()=>{
 const c=capture();c.live.activities[0].activitySections[0].duration=0;const snapshot=normalizeNativeCapture(c),pkg=packageFor(c);
 const unresolved=await buildTransferPlan(pkg,snapshot);const op=unresolved.operations.find(op=>op.path.at(-1)==='duration');assert.equal(op.before,0);assert.equal(op.after,null);assert.equal(op.requiresDecision,true);
 const plan=await approvedPlan(pkg,snapshot),bridge=bridgeFor(c),report=await stagePlan(plan,makeNativeScalarDriver(snapshot,bridge.call));assert.equal(report.status,'staged-unsaved');assert.equal(bridge.current.live.activities[0].activitySections[0].duration,'');
});
test('native capture blockers or absent current vocabulary evidence prevent writes',async()=>{
 const c=capture(),snapshot=normalizeNativeCapture(c),pkg=packageFor(c);pkg.lesson.title='Reviewed change';const plan=await approvedPlan(pkg,snapshot),bridge=bridgeFor(c);bridge.current.blockers.push('Finish the objective edit.');
 await assert.rejects(stagePlan(plan,makeNativeScalarDriver(snapshot,bridge.call)),/objective edit/);assert.equal(bridge.writes,0);
 const missing=capture();delete missing.live.vocabularies;assert.ok(normalizeNativeCapture(missing).blockers.length);
});
test('native bridge refuses other hosts, official lessons and forged fixture destinations',async()=>{
 const old=globalThis.location;
 try{for(const location of [{origin:'https://studio.code.org',pathname:'/s/csp/lessons/16/edit'},{origin:'https://levelbuilder-studio.code.org',pathname:'/lessons/123/edit'},{origin:'https://example.com',protocol:'https:',hostname:'example.com',pathname:'/native-adapter-fixture.html'}]){globalThis.location=location;await assert.rejects(nativeEditorBridge({action:'read',fixture:true}),/not the assigned/);}}
 finally{if(old===undefined)delete globalThis.location;else globalThis.location=old;}
});

test('injected bridge transports rejected-promise errors without treating them as captures',async()=>{
 const old=globalThis.location;
 try{
  globalThis.location={origin:'https://example.com',pathname:'/'};
  const result=await nativeEditorBridge({action:'read',transportErrors:true});
  assert.match(result.nativeBridgeError,/not the assigned sandbox/);
  assert.equal(result.kind,undefined);
  const encoded=await nativeEditorBridge(JSON.stringify({action:'read',transportErrors:true,operation:{before:null,after:null}}));
  assert.match(encoded.nativeBridgeError,/not the assigned sandbox/);
 }finally{if(old===undefined)delete globalThis.location;else globalThis.location=old;}
});
