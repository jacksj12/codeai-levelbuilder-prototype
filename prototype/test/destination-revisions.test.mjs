import test from 'node:test';import assert from 'node:assert/strict';
import {createDemo} from '../dist/demo-transfer.mjs';import {savedReport,connectDestinationBaseline,mergeDestinationReport} from '../dist/destination-revisions.mjs';import {mergeSources,resolveSourceConflict} from '../dist/source-revisions.mjs';
const clone=structuredClone;
async function harness(){const source={title:'Synthetic',teacherOverview:'Teacher',studentOverview:'Student',preparation:'Prep',objectives:['One'],resources:[],slides:[{id:'a',number:1,notes:'Activity (10 minutes)'},{id:'s',number:2,notes:'Original instruction'},{id:'b',number:3,notes:'Wrap (5 minutes)'},{id:'t',number:4,notes:'Reflect'}]};const demo=createDemo(source);const lesson=demo.pkg.lesson;const report={mode:'native',destination:demo.destination,checkpoint:{status:'baseline-read',freshSaved:demo.server}};const state={source,generated:clone(lesson),draft:clone(lesson),baseline:clone(lesson),reviewed:[],flags:[],conflicts:[],approved:true};return {state:await connectDestinationBaseline(state,report),report};}
test('destination imports merge independent edits locally and remain stable on repeat and source refresh',async()=>{const {state,report}=await harness(),before=clone(report);state.draft.sections[0].title='Local heading';report.checkpoint.freshSaved.activities[0].activitySections[0].description='Saved edit';const result=await mergeDestinationReport(state,report);assert.equal(result.conflicts,0);assert.equal(result.state.draft.sections[0].title,'Local heading');assert.equal(result.state.draft.sections[0].body,'Saved edit');assert.equal((await mergeDestinationReport(result.state,report)).updates,0);assert.equal(mergeSources(result.state,state.source).state.draft.sections[0].body,'Saved edit');assert.equal(state.draft.sections[0].body,'Original instruction');assert.equal(before.checkpoint.freshSaved.activities[0].activitySections[0].description,'Original instruction');});
test('same-field destination conflict retains local content until explicit resolution',async()=>{const {state,report}=await harness();state.draft.sections[0].body='Local';report.checkpoint.freshSaved.activities[0].activitySections[0].description='Remote';const result=await mergeDestinationReport(state,report);assert.equal(result.conflicts,1);assert.equal(result.state.draft.sections[0].body,'Local');assert.equal(result.state.conflicts[0].origin,'destination');const kept=resolveSourceConflict(result.state,0,'keep');assert.equal((await mergeDestinationReport(kept,report)).conflicts,0);});
test('destination deletion preserves activity and local children pending decision',async()=>{const {state,report}=await harness();state.draft.sections.push({...clone(state.draft.sections[0]),id:'local'});report.checkpoint.freshSaved.activities.shift();const result=await mergeDestinationReport(state,report);assert.equal(result.conflicts,1);assert.equal(result.state.draft.sections.length,3);assert.equal(result.state.conflicts[0].kind,'activity-group');});
test('destination baseline rejects mismatches and unverified saves',async()=>{const {state,report}=await harness();report.checkpoint.freshSaved.overview='Mismatch';await assert.rejects(connectDestinationBaseline(state,report),/does not match/);report.receipt={status:'save-not-confirmed'};await assert.rejects(mergeDestinationReport(state,report),/not verified/);});
test('unchanged destination does not disturb approval',async()=>{const {state,report}=await harness();const result=await mergeDestinationReport(state,report);assert.equal(result.updates,0);assert.equal(result.conflicts,0);assert.equal(result.state.approved,true);});
test('new saved identities are stable and do not duplicate sections',async()=>{const {state,report}=await harness();const a=report.checkpoint.freshSaved.activities[0];a.activitySections.push({...clone(a.activitySections[0]),id:99999,name:'Added',description:'New guidance'});const result=await mergeDestinationReport(state,report);assert.equal(result.conflicts,0);assert.equal(result.state.draft.sections.length,3);assert.equal((await mergeDestinationReport(result.state,report)).state.draft.sections.length,3);});
test('duplicate identities and a different destination are refused without altering local content',async()=>{const {state,report}=await harness(),before=clone(state);report.checkpoint.freshSaved.activities[0].activitySections.push(clone(report.checkpoint.freshSaved.activities[0].activitySections[0]));await assert.rejects(mergeDestinationReport(state,report),/duplicated/);assert.deepEqual(state,before);report.checkpoint.freshSaved.activities[0].activitySections.pop();report.destination={id:9000002,url:'https://levelbuilder-studio.code.org/lessons/9000002/edit'};report.checkpoint.freshSaved.id=9000002;await assert.rejects(mergeDestinationReport(state,report),/another destination/);});
test('unmanaged saved settings are reported without replacing draft content',async()=>{const {state,report}=await harness();report.checkpoint.freshSaved.lockable=true;const result=await mergeDestinationReport(state,report);assert.equal(result.updates,0);assert.match(result.notices[0],/lockable/);assert.deepEqual(result.state.draft,state.draft);});

test('partial saved evidence cannot silently clear fields or remove protected levels',async()=>{
 for(const mutate of [r=>delete r.overview,r=>delete r.vocabularies,r=>delete r.activities[0].activitySections[0].scriptLevels,r=>r.activities[0].id='__proto__']){
  const {state,report}=await harness(),before=clone(state);mutate(report.checkpoint.freshSaved);await assert.rejects(mergeDestinationReport(state,report),/incomplete/);assert.deepEqual(state,before);
 }
});

test('unchanged saved resources preserve local source metadata and approval',async()=>{
 let {state,report}=await harness();const resource={key:'guide',name:'Guide',type:'Activity Guide',audience:'Student',url:'https://example.com/guide',sourceNote:'Approved source evidence'};
 for(const lesson of [state.baseline,state.generated,state.draft])lesson.resources=[clone(resource)];
 report.checkpoint.freshSaved.resources=[{...resource,id:88}];state=await connectDestinationBaseline(state,report);
 const result=await mergeDestinationReport(state,report);assert.equal(result.updates,0);assert.equal(result.conflicts,0);assert.deepEqual(result.state.draft.resources,[resource]);assert.equal(result.state.approved,true);
});

test('moving a saved section across activities retains its local identity and callout provenance',async()=>{
 let {state,report}=await harness();const callout={type:'Teaching Tip',body:'Keep evidence',sourceNote:'Original note'};
 for(const lesson of [state.baseline,state.generated,state.draft])lesson.sections[0].callouts=[clone(callout)];
 report.checkpoint.freshSaved.activities[0].activitySections[0].tips=[{type:'teachingTip',markdown:'Keep evidence'}];state=await connectDestinationBaseline(state,report);
 const saved=report.checkpoint.freshSaved;saved.activities[1].activitySections.push(saved.activities[0].activitySections.shift());
 const result=await mergeDestinationReport(state,report),moved=result.state.draft.sections.find(s=>s.id===state.draft.sections[0].id);
 assert.equal(result.conflicts,0);assert.equal(moved.activityId,state.draft.activities[1].id);assert.deepEqual(moved.callouts,[callout]);assert.equal(moved.sourceNotes,state.draft.sections[0].sourceNotes);
});

test('saved assessment edits retain verified level metadata only for the same native identity',async()=>{
 let {state,report}=await harness();const progression={title:'Practice',levels:[{key:'original',number:1,assessment:false,url:'https://example.com/level',mappingStatus:'verified'}]};
 for(const lesson of [state.baseline,state.generated,state.draft])lesson.sections[0].progression=clone(progression);
 const savedSection=report.checkpoint.freshSaved.activities[0].activitySections[0];savedSection.progressionName='Practice';savedSection.scriptLevels=[{id:700,assessment:false,levels:[{id:800,name:'original'}]}];state=await connectDestinationBaseline(state,report);
 savedSection.scriptLevels[0].assessment=true;const result=await mergeDestinationReport(state,report);assert.equal(result.conflicts,0);const level=result.state.draft.sections[0].progression.levels[0];assert.equal(level.assessment,true);assert.equal(level.url,progression.levels[0].url);
 savedSection.scriptLevels[0].levels[0].id=801;savedSection.scriptLevels[0].assessment=false;const replaced=await mergeDestinationReport(state,report);assert.equal(replaced.state.draft.sections[0].progression.levels[0].url,undefined);
});

test('native null section titles and descriptions remain explicit blanks rather than missing evidence',async()=>{
 const {report}=await harness();const section=report.checkpoint.freshSaved.activities[0].activitySections[0];section.name=null;section.description=null;section.tips=null;section.remarks=null;
 const result=await savedReport(report);assert.equal(result.lesson.activities[0].sections[0].title,'');assert.equal(result.lesson.activities[0].sections[0].body,'');delete section.name;await assert.rejects(savedReport(report),/incomplete section/);
});

test('native numeric-string level identities remain valid while malformed IDs are refused',async()=>{
 const {report}=await harness();const section=report.checkpoint.freshSaved.activities[0].activitySections[0];section.scriptLevels=[{id:'397418',assessment:false,levels:[{id:'104255',name:'Original'}]}];
 const result=await savedReport(report);assert.equal(result.lesson.activities[0].sections[0].progression.levels[0].key,'Original');section.scriptLevels[0].id='1e6';await assert.rejects(savedReport(report),/incomplete level/);
});

test('missing callout text or assessment flags cannot become implicit deletions',async()=>{
 const {report}=await harness(),section=report.checkpoint.freshSaved.activities[0].activitySections[0];section.tips=[{type:'teachingTip'}];await assert.rejects(savedReport(report),/incomplete callout/);section.tips=[];section.scriptLevels=[{id:70,levels:[{id:80,name:'Original'}]}];await assert.rejects(savedReport(report),/incomplete level/);
});
