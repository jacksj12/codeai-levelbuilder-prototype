import {generate,SANDBOX} from './core.mjs';
import {clone,canonical,digest} from './transfer-core.mjs';

// Synthetic browser/server data. No authentication or remote writer exists here.
export function createDemo(source){
 const lesson=generate(source),destination={id:9000001,url:'https://levelbuilder-studio.code.org/lessons/9000001/edit'};
 const tips={'Teaching Tip':'teachingTip','Assessment Opportunity':'assessmentOpportunity','Content Corner':'contentCorner','Discussion Goal':'discussionGoal','Ethics Opportunity':'ethicsOpportunity'};
 const saved={id:destination.id,name:'Demo practice lesson — AI Lab',overview:lesson.frontMatter.teacherOverview,studentOverview:lesson.frontMatter.studentOverview,purpose:lesson.frontMatter.purpose,preparation:lesson.frontMatter.preparation,assessmentOpportunities:lesson.frontMatter.assessmentOpportunities,
 lockable:false,hasLessonPlan:true,creativeCommonsLicense:null,background:null,assessment:false,unplugged:false,
 objectives:lesson.frontMatter.objectives.map((description,i)=>({id:100+i,description,scriptLevelIds:[]})),resources:lesson.resources.map((r,i)=>({...r,id:200+i})),vocabularies:lesson.frontMatter.vocabulary.map((v,i)=>({id:300+i,key:'word-'+i,...(typeof v==='string'?{word:v,definition:''}:v)})),standards:[],opportunityStandards:[],programmingExpressions:[],jitPlConcepts:[],announcements:null,lessonPath:'/s/demo-practice-unit/lessons/1',preservedDemoSetting:'Keep this value',
 activities:lesson.activities.map((a,ai)=>({id:400+ai,name:a.title,duration:a.duration,activitySections:lesson.sections.filter(s=>s.activityId===a.id).map((s,si)=>({id:1000+ai*100+si,name:s.title,description:s.body,duration:s.duration,remarks:s.remarks,progressionName:s.progression?.title||'',tips:s.callouts.map(c=>({type:tips[c.type],markdown:c.body})),scriptLevels:[]}))}))};
 const fields={title:saved.name,teacherOverview:saved.overview,studentOverview:saved.studentOverview,purpose:saved.purpose,preparation:saved.preparation,assessmentOpportunities:saved.assessmentOpportunities};
 const unmanaged=clone(saved.activities);for(const a of unmanaged){delete a.name;delete a.duration;for(const s of a.activitySections)for(const k of ['name','description','duration','remarks'])delete s[k];}
 const capture={schemaVersion:1,kind:'native-dom-capture',readerVersion:'native-scalars-v1',destination,saved:clone(saved),blockers:[],remoteWrites:false,
 live:{fields,activities:clone(saved.activities),objectives:clone(saved.objectives),resources:lesson.resources,vocabularies:clone(saved.vocabularies)},
 protection:{bootstrap:clone(saved),unmanagedActivities:unmanaged,objectives:clone(saved.objectives),resources:lesson.resources,vocabularies:clone(saved.vocabularies),controls:[],otherTables:[]}};
 const names=[...new Set(lesson.sections.flatMap(s=>s.progression?.levels.map(l=>l.key)||[]))];
 return {destination,pkg:{schemaVersion:1,status:'approved-locally',sandbox:SANDBOX,lesson,baseline:clone(lesson),conflicts:[]},server:saved,editor:capture,mappings:names.map((key,i)=>({key,verified:true,destinationLevelId:700+i})),sendCount:0};
}
export function demoAdapter(state,persist){
 return {
  readSaved:async()=>({lesson:clone(state.server),originalLessonJson:JSON.stringify(state.server)}),
  checkUsage:async()=>({passed:true,conflicts:[]}),
  bridge:async request=>{
   if(request.action==='read')return clone(state.editor);
   if(await digest(state.editor)!==request.expectedCaptureDigest)throw Error('Demo editor changed outside this run.');
   if(request.action==='lookup-levels')return {kind:'native-level-mappings',capture:clone(state.editor),mappings:state.mappings.filter(m=>request.names.includes(m.key))};
   if(request.action==='save-approved-cleanup'){
    if(request.approval?.approved!==true)throw Error('Cleanup approval required.');
    const body=JSON.parse(request.review.request.body);if(canonical(JSON.parse(body.originalLessonData))!==canonical(state.server))throw Error('Demo saved baseline changed.');state.server.activities=JSON.parse(body.activities);state.cleanupSendCount=(state.cleanupSendCount||0)+1;persist();return {outcome:'response-received',ok:true,httpStatus:200,simulated:true};
   }
   if(request.action==='save-approved-review'){
    const body=JSON.parse(request.review.request.body);
    if(canonical(JSON.parse(body.originalLessonData))!==canonical(state.server))throw Error('Demo saved baseline changed.');
    state.server.activities=JSON.parse(body.activities);let id=10000;
    for(const a of state.server.activities)for(const s of a.activitySections)for(const sl of s.scriptLevels)sl.id=++id;
    state.sendCount++;persist();return {outcome:'response-received',ok:true,httpStatus:200,simulated:true};
   }
   const op=request.operation,ai=op.path[1],si=op.path[3];
   for(const activities of [state.editor.live.activities,state.editor.protection.unmanagedActivities]){
    const section=activities[ai].activitySections[si];
    if(request.action==='append-progression'){
     if(section.scriptLevels.length)throw Error('Demo progression is already occupied.');
     section.progressionName=op.after.title;section.scriptLevels=op.after.levels.map((l,i)=>({levels:[{id:state.mappings.find(m=>m.key===l.key).destinationLevelId,name:l.key}],assessment:l.assessment,activitySectionPosition:i+1}));
    }else if(request.action==='clear-owned-progression'){section.scriptLevels=[];section.progressionName=op.restoreProgressionName;}
    else throw Error('Unsupported demo action.');
   }
   persist();return clone(state.editor);
  }
 };
}
