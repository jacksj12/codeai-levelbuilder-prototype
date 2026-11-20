import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generate,SANDBOX} from '../dist/core.mjs';
import {clone,buildTransferPlan,applyOperation,digest,packageProblems,normalizedDraft} from '../dist/transfer-core.mjs';
import {makeRehearsal} from '../dist/transfer-rehearsal.mjs';
import {stagePlan} from '../dist/transfer-runner.mjs';
import {captureAssignedEditor,normalizeNativeCapture} from '../dist/transfer-native.mjs';
const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
function approved(){const lesson=generate(source);return {schemaVersion:1,sandbox:SANDBOX,status:'approved-locally',published:false,lesson,baseline:clone(lesson),conflicts:[],review:{flags:[],resourceBuffer:null}};}
function memoryDriver(snapshot,hook=()=>{}){let current=clone(snapshot),calls=0;return {mode:'local-dom-rehearsal',read:async()=>clone(current),apply:async op=>{calls++;applyOperation(current.lesson,op);await hook(current,calls);},get current(){return current;},get calls(){return calls;}};}

test('approved package is used directly and edited content is never regenerated',async()=>{
 const pkg=approved();pkg.lesson.sections[0].body='Approved user edit';pkg.baseline=clone(pkg.lesson);
 const original=clone(pkg),snapshot=makeRehearsal(pkg),plan=await buildTransferPlan(pkg,snapshot);
 assert.deepEqual(pkg,original);assert.equal(plan.blockers.length,0);
 assert.equal(plan.expectedLesson.activities[0].sections[0].body,'Approved user edit');
 assert.equal(plan.expectedLesson.activities.length,3);assert.equal(plan.expectedLesson.activities.flatMap(a=>a.sections).length,10);
 assert.equal(plan.saveAllowed,false);assert.equal(plan.remoteWrites,false);
});
test('legacy zero section durations retain the editor blank-minute meaning while activity zero is retained',()=>{
 const pkg=approved();pkg.lesson.sections[0].duration=0;pkg.lesson.activities[0].duration=0;
 const normalized=normalizedDraft(pkg.lesson);assert.equal(normalized.activities[0].sections[0].duration,null);assert.equal(normalized.activities[0].duration,0);
});
test('approval, unresolved issues, pending resources and stale baselines block all staging',async()=>{
 for(const mutate of [p=>p.status='draft',p=>p.conflicts.push({}),p=>p.review.flags.push({target:'title',note:'Fix title',resolved:false}),p=>p.review.resourceBuffer='{',p=>p.lesson.title='Unapproved edit']){
  const pkg=approved();mutate(pkg);const plan=await buildTransferPlan(pkg,makeRehearsal(pkg)),driver=memoryDriver(plan.originalSnapshot);
  assert.ok(plan.blockers.length);await assert.rejects(stagePlan(plan,driver),/blocker|decision/);assert.equal(driver.calls,0);
 }
});
test('wrong destination, malformed package and orphan groups are rejected',async()=>{
 const pkg=approved(),snapshot=makeRehearsal(pkg);
 await assert.rejects(buildTransferPlan(pkg,{...snapshot,destination:{...snapshot.destination,id:1}}),/destination/);
 await assert.rejects(buildTransferPlan({...pkg,sandbox:'https://example.com'},snapshot),/assigned/);
 const orphan=clone(pkg);orphan.lesson.sections[0].activityId='missing';assert.throws(()=>packageProblems(orphan),/grouping/);
 const bad=clone(pkg);bad.lesson.frontMatter.teacherOverview=null;assert.throws(()=>normalizedDraft(bad.lesson),/text/);
});
test('nonempty values require explicit exact-content decisions, with kept content reported',async()=>{
 const pkg=approved(),snapshot=makeRehearsal(pkg);snapshot.lesson.title='Existing destination title';
 let plan=await buildTransferPlan(pkg,snapshot);const conflict=plan.operations.find(op=>op.path[0]==='title');assert.equal(conflict.requiresDecision,true);
 await assert.rejects(stagePlan(plan,memoryDriver(snapshot)),/decision/);
 plan=await buildTransferPlan(pkg,snapshot,{[conflict.id]:'keep'});assert.equal(plan.expectedLesson.title,snapshot.lesson.title);assert.ok(plan.preserved.some(item=>item.reason==='Kept by reviewer'));
 const replaced=await buildTransferPlan(pkg,snapshot,{[conflict.id]:'replace'});assert.equal(replaced.expectedLesson.title,pkg.lesson.title);assert.equal(replaced.operations[0].requiresDecision,false);
 snapshot.lesson.title='Changed since decision';const fresh=await buildTransferPlan(pkg,snapshot,{[conflict.id]:'replace'});assert.ok(fresh.operations.find(op=>op.path[0]==='title').requiresDecision);
});
test('intentional blanks do not silently clear destination content',async()=>{
 const pkg=approved(),snapshot=makeRehearsal(pkg);snapshot.lesson.frontMatter.purpose='Keep this purpose';
 const plan=await buildTransferPlan(pkg,snapshot),op=plan.operations.find(op=>op.path.at(-1)==='purpose');
 assert.equal(op.after,'');assert.equal(op.requiresDecision,true);
});
test('missing and ambiguous resources or level mappings and embedded local assets are blockers',async()=>{
 for(const change of [s=>s.catalog.resources.pop(),s=>s.catalog.resources.push(clone(s.catalog.resources[0])),s=>s.catalog.levels[0].verified=false]){
  const pkg=approved(),snapshot=makeRehearsal(pkg);change(snapshot);const plan=await buildTransferPlan(pkg,snapshot);assert.ok(plan.blockers.length);
 }
 const pkg=approved();pkg.lesson.sections[0].body='![local](data:image/png;base64,abcd)';pkg.baseline=clone(pkg.lesson);
 assert.ok((await buildTransferPlan(pkg,makeRehearsal(pkg))).blockers.some(b=>b.includes('asset URL')));
});
test('resource markers map to destination keys without duplicate shared records or source database identities',async()=>{
 const pkg=approved();pkg.lesson.sections[0].body='Use [r '+pkg.lesson.resources[0].key+']';pkg.baseline=clone(pkg.lesson);
 const snapshot=makeRehearsal(pkg),plan=await buildTransferPlan(pkg,snapshot);
 assert.equal(plan.expectedLesson.activities[0].sections[0].body,'Use [r destination-resource-1]');
 assert.equal(plan.expectedLesson.resources.length,3);
 assert.ok(plan.operations.filter(op=>op.path[0]==='resources').every(op=>op.kind==='append'));
 assert.equal(JSON.stringify(plan.expectedLesson).includes(pkg.lesson.sections[0].id),false);
});
test('bounded interruption, journal restore and a repeated complete run do not duplicate anything',async()=>{
 const pkg=approved(),snapshot=makeRehearsal(pkg),plan=await buildTransferPlan(pkg,snapshot),driver=memoryDriver(snapshot);
 const first=await stagePlan(plan,driver,{maxOperations:9});assert.equal(first.status,'interrupted');assert.equal(first.completed,9);assert.ok(first.nextLocation);
 const second=await stagePlan(plan,driver,{journal:JSON.parse(JSON.stringify(first.journal))});assert.equal(second.status,'staged-unsaved');assert.deepEqual(driver.current.lesson,plan.expectedLesson);
 const calls=driver.calls,third=await stagePlan(plan,driver,{journal:second.journal});assert.equal(third.status,'staged-unsaved');assert.equal(driver.calls,calls);assert.ok(third.items.every(item=>item.status==='already-present'));
 assert.deepEqual(driver.current.raw,snapshot.raw);assert.deepEqual(driver.current.catalog,snapshot.catalog);
 assert.equal(driver.current.lesson.activities.flatMap(a=>a.sections).flatMap(s=>s.callouts).length,6);
});
test('a crash after a DOM action but before journal acknowledgement recovers by readback',async()=>{
 const pkg=approved(),snapshot=makeRehearsal(pkg),plan=await buildTransferPlan(pkg,snapshot),driver=memoryDriver(snapshot,(_state,calls)=>{if(calls===1)throw Error('Simulated interruption after mutation');});
 const first=await stagePlan(plan,driver);assert.equal(first.status,'blocked');assert.equal(first.completed,0);
 const recovered=await stagePlan(plan,driver,{journal:first.journal});assert.equal(recovered.recovered,true);assert.equal(recovered.status,'staged-unsaved');assert.deepEqual(driver.current.lesson,plan.expectedLesson);
});
test('outside edits, wrong journals, tampered plans and native drivers fail closed',async()=>{
 const pkg=approved(),snapshot=makeRehearsal(pkg),plan=await buildTransferPlan(pkg,snapshot),driver=memoryDriver(snapshot);
 driver.current.raw.unknownSetting.preserve='Outside edit';await assert.rejects(stagePlan(plan,driver),/changed outside/);assert.equal(driver.calls,0);
 await assert.rejects(stagePlan(plan,memoryDriver(snapshot),{journal:{planId:'different',completed:0}}),/different plan/);
 const changed=clone(plan);changed.operations[0].after='Tampered';await assert.rejects(stagePlan(changed,memoryDriver(snapshot)),/plan changed/);
 await assert.rejects(stagePlan(plan,{...memoryDriver(snapshot),mode:'native-dom'}),/Native staging is disabled/);
});
test('unexpected mid-run readback stops before subsequent actions and preserves the report location',async()=>{
 const pkg=approved(),snapshot=makeRehearsal(pkg),plan=await buildTransferPlan(pkg,snapshot),driver=memoryDriver(snapshot,state=>{state.raw.unknownSetting.preserve='Concurrent edit';});
 const result=await stagePlan(plan,driver);assert.equal(result.status,'blocked');assert.equal(driver.calls,1);assert.ok(result.reason.includes(plan.operations[0].label));
});
test('objective alphabetical order is equivalent; missing and duplicated objectives require decisions',async()=>{
 const pkg=approved(),snapshot=makeRehearsal(pkg),first=await buildTransferPlan(pkg,snapshot);snapshot.lesson=clone(first.expectedLesson);
 snapshot.lesson.frontMatter.objectives.reverse();let plan=await buildTransferPlan(pkg,snapshot);assert.equal(plan.operations.length,0);
 snapshot.lesson.frontMatter.objectives[0]=snapshot.lesson.frontMatter.objectives[1];plan=await buildTransferPlan(pkg,snapshot);assert.ok(plan.operations.some(op=>op.path.at(-1)==='objectives'&&op.requiresDecision));
});
test('extra destination activities, sections, callouts and unrelated settings are preserved',async()=>{
 const pkg=approved(),snapshot=makeRehearsal(pkg),first=await buildTransferPlan(pkg,snapshot);snapshot.lesson=clone(first.expectedLesson);
 snapshot.lesson.activities.push({title:'Extra activity',duration:3,sections:[],futureSetting:'keep'});
 snapshot.lesson.activities[0].sections.push({title:'Extra section',duration:null,body:'Keep',remarks:false,callouts:[],progression:null});
 snapshot.lesson.activities[0].sections[0].callouts.push({type:'Teaching Tip',body:'Destination-only note'});
 snapshot.lesson.activities[0].sections[0].callouts[0].unknownSetting='retain';
 snapshot.lesson.resources.push({key:'extra',name:'Destination extra resource',type:'Handout',audience:'Student',url:'https://example.com/extra'});
 const plan=await buildTransferPlan(pkg,snapshot);assert.equal(plan.operations.length,0);assert.equal(plan.preserved.length,4);
 assert.deepEqual(plan.expectedLesson,snapshot.lesson);assert.equal(await digest(snapshot),plan.destinationDigest);
});
test('native DOM reader rejects another host or lesson before inspecting content or requesting anything',()=>{
 const old=globalThis.location;globalThis.location={origin:'https://levelbuilder-studio.code.org',pathname:'/lessons/123/edit'};
 try{assert.throws(()=>captureAssignedEditor(),/Other destinations/);}finally{if(old===undefined)delete globalThis.location;else globalThis.location=old;}
});
test('native normalization retains complete capture evidence and blocks unsupported live-state assumptions',()=>{
 const capture={schemaVersion:1,kind:'native-dom-capture',destination:{id:8898985,url:SANDBOX},saved:{id:8898985,resources:[],vocabularies:[],future:{keep:true}},
  live:{fields:{title:'Native',teacherOverview:'unsaved',studentOverview:'',purpose:'',preparation:'',assessmentOpportunities:''},objectives:[{description:'Objective',id:50}],resources:[],activities:[{id:1,name:'Activity',duration:5,activitySections:[{id:2,name:'Section',duration:'',description:'Unsaved guidance',remarks:false,tips:[{type:'teachingTip',markdown:'Tip'}],scriptLevels:[]}]}]},blockers:['Live-state mapping needs verification.']};
 const snapshot=normalizeNativeCapture(capture);assert.equal(snapshot.mode,'native-read-only');assert.equal(snapshot.lesson.frontMatter.teacherOverview,'unsaved');assert.equal(snapshot.lesson.activities[0].sections[0].duration,null);
 assert.equal(snapshot.lesson.activities[0].sections[0].callouts[0].type,'Teaching Tip');assert.deepEqual(snapshot.raw,capture);assert.equal(snapshot.blockers.length,1);
});
