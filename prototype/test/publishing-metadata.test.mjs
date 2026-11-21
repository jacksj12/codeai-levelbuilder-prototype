import {runAcceptedNativeRehearsal,recoverNativeLevelCheck} from '../dist/native-level-verification.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createDemo,demoAdapter} from '../dist/demo-transfer.mjs';
import {prepareTransfer,approveTransfer,executeTransfer} from '../dist/reusable-transfer.mjs';
import {preparePublication,validatePublicationBinding} from '../dist/publishing.mjs';
import {verifySavedReadback} from '../dist/save-review.mjs';
import {canonical,digest} from '../dist/transfer-core.mjs';
import {nativeEditorBridge} from '../dist/native-dom-adapter.mjs';
const clone=structuredClone;
const source={title:'Metadata review',objectives:['Observe','Explain'],resources:[],slides:[{id:'a',number:1,notes:'Activity (5 minutes)'},{id:'s',number:2,notes:'Discuss evidence'}]};
function setup(){
 const state=createDemo(clone(source)),section=state.pkg.lesson.sections[0];section.progression={title:'Saved group',levels:Array.from({length:4},(_,i)=>({key:'Saved level '+i,number:i+1,assessment:i>0}))};
 const records=section.progression.levels.map((l,i)=>({id:500+i,activitySectionPosition:i+1,assessment:l.assessment,levels:[{id:700+i,name:l.key}],bonus:false,customSetting:'Preserve'}));
 for(const root of [state.server,state.editor.saved,state.editor.protection.bootstrap,state.editor.live]){root.activities[0].activitySections[0].scriptLevels=clone(records);root.activities[0].activitySections[0].progressionName='Saved group';root.objectives[0].scriptLevelIds=[500];}
 state.editor.protection.unmanagedActivities[0].activitySections[0].scriptLevels=clone(records);state.editor.protection.unmanagedActivities[0].activitySections[0].progressionName='Saved group';state.editor.protection.objectives[0].scriptLevelIds=[500];
 state.pkg.baseline=clone(state.pkg.lesson);state.mappings=records.map(sl=>({key:sl.levels[0].name,verified:true,destinationLevelId:sl.levels[0].id}));
 const store=new Map();let checkpoint;const io={...demoAdapter(state,()=>{}),checkpoint:async c=>checkpoint=clone(c),loadCheckpoint:async()=>checkpoint,persist:async(k,v)=>store.set(k,clone(v)),loadReceipt:async k=>store.get(k)};
 const report={mode:'native',destination:state.destination,checkpoint:{status:'baseline-read',freshSaved:clone(state.server)}};return {state,io,report};
}
test('explicit multiple objective mappings preserve IDs and tags through publication, restoration and one save',async()=>{
 const {state,io,report}=setup(),initial=canonical(state.editor);state.pkg.lesson.frontMatter.objectives=['Explain with evidence','Observe carefully'];state.pkg.baseline=clone(state.pkg.lesson);
 const preflight=await preparePublication(state.pkg,report,{objectiveTargets:[{destinationId:100,sourceIndex:1},{destinationId:101,sourceIndex:0}]});assert.equal(preflight.status,'ready-for-companion-review');await validatePublicationBinding(preflight.handoff,state.destination,state.server);
 const job=await prepareTransfer(preflight.handoff,io);assert.equal(canonical(state.editor),initial);assert.equal(job.review.fieldChanges.length,2);
 const receipt=await executeTransfer(await approveTransfer(job),io);assert.equal(receipt.status,'saved-and-verified');assert.deepEqual(state.server.objectives.map(o=>[o.id,o.description,o.scriptLevelIds]),[[100,'Observe carefully',[500]],[101,'Explain with evidence',[]]]);assert.deepEqual(state.server.activities,report.checkpoint.freshSaved.activities);await executeTransfer(await approveTransfer(job),io);assert.equal(state.sendCount,1);
});
test('objective mapping refuses missing, duplicate, out-of-range, foreign and stale mappings before staging',async()=>{
 for(const targets of [[],[{destinationId:100,sourceIndex:0},{destinationId:101,sourceIndex:0}],[{destinationId:100,sourceIndex:0},{destinationId:100,sourceIndex:1}],[{destinationId:100,sourceIndex:0},{destinationId:101,sourceIndex:2}],[{destinationId:999,sourceIndex:0},{destinationId:101,sourceIndex:1}]]){const {state,report}=setup();state.pkg.lesson.frontMatter.objectives=['Changed A','Changed B'];state.pkg.baseline=clone(state.pkg.lesson);const result=await preparePublication(state.pkg,report,{objectiveTargets:targets});assert.equal(result.status,'blocked');assert.equal(state.sendCount,0);}
 const {state,io,report}=setup(),result=await preparePublication(state.pkg,report,{objectiveTargets:[{destinationId:100,sourceIndex:0},{destinationId:101,sourceIndex:1}]});delete result.handoff.publication;result.handoff.schemaVersion=1;result.handoff.objectiveMapping.baseline[0].scriptLevelIds=[];const initial=canonical(state.editor);await assert.rejects(prepareTransfer(result.handoff,io),/tags changed/);assert.equal(canonical(state.editor),initial);
});
test('existing progression title and flags publish without replacing any of four associations or other settings',async()=>{
 const {state,io,report}=setup(),initial=canonical(state.editor),p=state.pkg.lesson.sections[0].progression;p.title='Reviewed title';p.levels[0].assessment=true;p.levels[3].assessment=false;state.pkg.baseline=clone(state.pkg.lesson);
 const preflight=await preparePublication(state.pkg,report);assert.equal(preflight.status,'ready-for-companion-review');const job=await prepareTransfer(preflight.handoff,io);assert.equal(canonical(state.editor),initial);assert.equal(job.review.fieldChanges.length,3);assert.equal(job.review.changes.length,0);
 const receipt=await executeTransfer(await approveTransfer(job),io);assert.equal(receipt.status,'saved-and-verified');const restored=clone(state.server);restored.activities[0].activitySections[0].progressionName='Saved group';restored.activities[0].activitySections[0].scriptLevels[0].assessment=false;restored.activities[0].activitySections[0].scriptLevels[3].assessment=true;assert.deepEqual(restored,report.checkpoint.freshSaved);
 for(const mutate of [s=>s.scriptLevels[0].id=900,s=>s.scriptLevels[0].levels[0].id=999,s=>s.scriptLevels[0].customSetting='Changed',s=>s.scriptLevels.reverse(),s=>s.scriptLevels.pop()]){const bad=clone(receipt.readback);mutate(bad.activities[0].activitySections[0]);assert.equal((await verifySavedReadback(job.review,bad)).passed,false);}
 await executeTransfer(await approveTransfer(job),io);assert.equal(state.sendCount,1);
});
test('level replacement, reordering and removal remain blocked rather than inferred as metadata edits',async()=>{
 for(const change of [p=>p.levels.reverse(),p=>p.levels.pop(),p=>p.levels[0].key='Other level']){const {state,io}=setup(),initial=canonical(state.editor);change(state.pkg.lesson.sections[0].progression);state.pkg.baseline=clone(state.pkg.lesson);await assert.rejects(prepareTransfer(state.pkg,io));assert.equal(canonical(state.editor),initial);assert.equal(state.sendCount,0);}
});
function nativeFixture({callouts=false,wrongCallout=false}={}){
 const destination={id:123,url:'https://levelbuilder-studio.code.org/lessons/123/edit'},section={id:12,name:'Section',description:'Content',duration:null,remarks:false,tips:[],progressionName:'Group',scriptLevels:[{id:20,levels:[{id:30,name:'Level'}],assessment:false,bonus:true}]},activity={id:11,name:'Activity',duration:5,activitySections:[section]},saved={id:123,activities:clone([activity]),objectives:[],resources:[],vocabularies:[]};let open=false,remote=0,selected=null,tipType,tipBody;if(callouts){section.tips=[{key:'tip-a',type:'teachingTip',markdown:'Neighbor before'},{key:'tip-b',type:'discussionGoal',markdown:'Edit this'},{key:'tip-c',type:'contentCorner',markdown:'Neighbor after'}];saved.activities[0].activitySections[0].tips=clone(section.tips);}
 class Input{constructor(value,onChange=()=>{}){this.pending=value;this.onChange=onChange;}get value(){return this.pending;}set value(value){this.pending=value;}dispatchEvent(){this.onChange(this.pending);}}
 const calloutModal={getClientRects:()=>selected!==null?[{}]:[],querySelectorAll:s=>s==='h2'?[{textContent:'Add Callout'}]:s==='select'?[tipType]:s==='textarea[name="callout"]'?[tipBody]:s==='button'?[{textContent:'Save and close',click(){section.tips[selected].type=tipType.value;section.tips[selected].markdown=tipBody.value;selected=null;}}]:[]};
 const icons=()=>section.tips.map((tip,index)=>({getClientRects:()=>[{}],click(){selected=wrongCallout?0:index;tipType=new Input(section.tips[selected].type);tipBody=new Input(section.tips[selected].markdown);}}));
 const title=new Input('Group',value=>section.progressionName=value),check={checked:false,click(){this.checked=!this.checked;section.scriptLevels[0].assessment=this.checked;}},assessmentLabel={querySelector:s=>s==='span'?{textContent:'Assessment'}:check},token={querySelectorAll:()=>[{textContent:'Level'}],click(){},parentElement:{querySelectorAll:()=>[assessmentLabel]}},modal={getClientRects:()=>open?[{}]:[],querySelectorAll:s=>s==='h2'?[{textContent:'Add Levels'}]:s==='.uitest-level-token-name'?[token]:s==='button'?[{textContent:'Close and save',click(){open=false;}}]:[]};
 const header={querySelectorAll:s=>s.includes('not(')?[{value:'Section'},{value:''}]:[{checked:false}]},root={firstElementChild:header,querySelectorAll:s=>s==='span[data-tip][data-for] > i'?icons():s==='label'?[{childNodes:[{nodeType:3,textContent:'Progression Title:'}],querySelector:()=>title}]:s==='button.uitest-open-add-level-button'?[{click(){open=true;}}]:[]},area={value:'Content',parentElement:root},card={querySelectorAll:s=>s==='textarea'?[area]:s==='.uitest-activity-name-input'?[{value:'Activity'}]:s==='.uitest-activity-duration-input'?[{value:'5'}]:[]};
 const table=headers=>({querySelector:s=>s==='thead'?{textContent:headers.join(' ')}:null,querySelectorAll:s=>s==='thead th'?headers.map(textContent=>({textContent})):[]}),tables=[table(['Key','Name','Type','Audience','URL','Actions']),table(['Word','Definition','Actions']),table(['Description','Levels','Actions'])],labels=['Title','Overview','Student Overview','Purpose','Preparation','Assessment Opportunities'].map(name=>({childNodes:[{nodeType:3,textContent:name}],querySelectorAll:()=>[{value:''}]}));
 const document={querySelector:s=>s==='script[data-lesson]'?{getAttribute:()=>JSON.stringify(saved)}:null,querySelectorAll:s=>s==='#edit-container label'?labels:s==='#edit-container table'?tables:s==='.uitest-activity-card'?[card]:s.includes('input[type="hidden"][name="activities"]')?[{value:JSON.stringify([activity])}]:s.includes('input[type="hidden"][name="objectives"]')?[{value:'[]'}]:s.includes('.modal-content')?(open?[modal]:selected!==null?[calloutModal]:[]):[]};
 const context=vm.createContext({document,location:new URL(destination.url),structuredClone,crypto,TextEncoder,MessageChannel,HTMLInputElement:Input,HTMLTextAreaElement:Input,HTMLSelectElement:Input,Event:class{},fetch(){remote++;throw Error('No remote request allowed');}}),bridge=vm.runInContext('('+nativeEditorBridge.toString()+')',context);return {call:r=>bridge({destination,practiceConfirmed:true,...r}),get remote(){return remote;},section,check};
}
test('serialized native bridge edits existing title and assessment controls and restores exact capture',async()=>{
 const fixture=nativeFixture(),initial=await fixture.call({action:'read'});assert.deepEqual(Array.from(initial.blockers),[]);let capture=initial;
 const operations=[{kind:'set',path:['activities',0,'sections',0,'progression','title'],before:'Group',after:'New title'},{kind:'set',path:['activities',0,'sections',0,'progression','levels',0,'assessment'],before:false,after:true}];
 for(const operation of operations){capture=await fixture.call({action:'set-scalar',mode:'unsaved-scalar-staging',operation,expectedCaptureDigest:await digest(capture)});assert.equal(capture.blockers.length,0);}
 assert.equal(fixture.section.scriptLevels[0].id,20);assert.equal(fixture.section.scriptLevels[0].bonus,true);
 for(const operation of operations.reverse())capture=await fixture.call({action:'set-scalar',mode:'unsaved-scalar-staging',operation:{...operation,before:operation.after,after:operation.before},expectedCaptureDigest:await digest(capture)});
 assert.equal(canonical(capture),canonical(initial));assert.equal(fixture.remote,0);
});


test('serialized native callout targeting edits the second of three records and restores exactly',async()=>{
 const fixture=nativeFixture({callouts:true}),initial=await fixture.call({action:'read'});let capture=initial;const operations=[{kind:'set',path:['activities',0,'sections',0,'callouts',1,'body'],before:'Edit this',after:'Reviewed text'},{kind:'set',path:['activities',0,'sections',0,'callouts',1,'type'],before:'Discussion Goal',after:'Ethics Opportunity'}];
 for(const operation of operations)capture=await fixture.call({action:'set-scalar',mode:'unsaved-scalar-staging',operation,expectedCaptureDigest:await digest(capture)});
 assert.deepEqual(fixture.section.tips,[{key:'tip-a',type:'teachingTip',markdown:'Neighbor before'},{key:'tip-b',type:'ethicsOpportunity',markdown:'Reviewed text'},{key:'tip-c',type:'contentCorner',markdown:'Neighbor after'}]);
 for(const operation of operations.reverse())capture=await fixture.call({action:'set-scalar',mode:'unsaved-scalar-staging',operation:{...operation,before:operation.after,after:operation.before},expectedCaptureDigest:await digest(capture)});
 assert.equal(canonical(capture),canonical(initial));assert.equal(fixture.remote,0);
});
test('native callout dialog mismatch stops before changing any callout',async()=>{
 const fixture=nativeFixture({callouts:true,wrongCallout:true}),initial=await fixture.call({action:'read'}),before=clone(fixture.section.tips);
 await assert.rejects(fixture.call({action:'set-scalar',mode:'unsaved-scalar-staging',operation:{kind:'set',path:['activities',0,'sections',0,'callouts',1,'body'],before:'Edit this',after:'Reviewed text'},expectedCaptureDigest:await digest(initial)}),/does not match/);
 assert.deepEqual(fixture.section.tips,before);assert.equal(fixture.remote,0);
});

test('new objectives append without changing existing records, restore, save once, and survive sorted readback',async()=>{
 const {state,io,report}=setup(),initial=canonical(state.editor);state.pkg.lesson.frontMatter.objectives.push('Analyze','Reflect');state.pkg.baseline=clone(state.pkg.lesson);const preflight=await preparePublication(state.pkg,report);assert.equal(preflight.status,'ready-for-companion-review');const job=await prepareTransfer(preflight.handoff,io);assert.equal(canonical(state.editor),initial);assert.equal(job.review.objectiveAdditions.length,2);
 const receipt=await executeTransfer(await approveTransfer(job),io);assert.equal(receipt.status,'saved-and-verified');assert.deepEqual(state.server.objectives.slice(0,2),report.checkpoint.freshSaved.objectives);assert.deepEqual(state.server.activities,report.checkpoint.freshSaved.activities);
 const sorted=clone(receipt.readback);sorted.objectives.sort((a,b)=>a.description.localeCompare(b.description));assert.equal((await verifySavedReadback(job.review,sorted)).passed,true);
 for(const mutate of [s=>s.objectives.at(-1).id=s.objectives[0].id,s=>s.objectives.at(-1).scriptLevelIds=[500],s=>s.objectives.at(-1).extra='unreviewed',s=>s.objectives.pop()]){const bad=clone(receipt.readback);mutate(bad);assert.equal((await verifySavedReadback(job.review,bad)).passed,false);}
 await executeTransfer(await approveTransfer(job),io);assert.equal(state.sendCount,1);
});
test('objective append lost acknowledgement resumes from exact readback without duplicate records',async()=>{
 const {state,io}=setup(),initial=canonical(state.editor);state.pkg.lesson.frontMatter.objectives.push('Analyze');state.pkg.baseline=clone(state.pkg.lesson);const bridge=io.bridge;let lost=false;io.bridge=async request=>{const result=await bridge(request);if(request.action==='append-objective'&&!lost){lost=true;throw Error('Lost reply');}return result;};const job=await prepareTransfer(state.pkg,io);assert.equal(job.rehearsal.restored,true);assert.equal(canonical(state.editor),initial);assert.equal(state.sendCount,0);
});

test('new objective recovery preserves outside edits and resumes after those edits are resolved',async()=>{
 const {state,io}=setup(),initial=canonical(state.editor);state.pkg.lesson.frontMatter.objectives.push('Analyze');state.pkg.baseline=clone(state.pkg.lesson);
 const rehearsal=await runAcceptedNativeRehearsal(io.bridge,state.pkg,{leaveStaged:true});assert.equal(rehearsal.status,'staged-unsaved');const before=state.editor.live.fields.purpose;state.editor.live.fields.purpose='Outside edit';await assert.rejects(recoverNativeLevelCheck(io.bridge,rehearsal),/Outside edits/);assert.equal(state.editor.live.fields.purpose,'Outside edit');assert.equal(state.editor.live.objectives.length,3);
 state.editor.live.fields.purpose=before;await recoverNativeLevelCheck(io.bridge,rehearsal);assert.equal(canonical(state.editor),initial);assert.equal(state.sendCount,0);
});
