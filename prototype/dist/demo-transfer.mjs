import {liveFieldPath,putField,nativeFieldValue,protectedFieldPath,savedFieldPath} from './reviewed-fields.mjs';
import {generate,SANDBOX} from './core.mjs';
import {clone,canonical,digest} from './transfer-core.mjs';

// Synthetic browser/server data. No authentication or remote writer exists here.
export function createDemo(source,{teaching=false,structure=false,complete=false,saveUnchanged=false}={}){
 const lesson=generate(source),destination={id:9000001,url:'https://levelbuilder-studio.code.org/lessons/9000001/edit'};
 const tips={'Teaching Tip':'teachingTip','Assessment Opportunity':'assessmentOpportunity','Content Corner':'contentCorner','Discussion Goal':'discussionGoal','Ethics Opportunity':'ethicsOpportunity'};
 const saved={id:destination.id,name:'Demo practice lesson — AI Lab',overview:lesson.frontMatter.teacherOverview,studentOverview:lesson.frontMatter.studentOverview,purpose:lesson.frontMatter.purpose,preparation:lesson.frontMatter.preparation,assessmentOpportunities:lesson.frontMatter.assessmentOpportunities,
 lockable:false,hasLessonPlan:true,creativeCommonsLicense:null,background:null,assessment:false,unplugged:false,
 objectives:lesson.frontMatter.objectives.map((description,i)=>({id:100+i,description,scriptLevelIds:[]})),resources:lesson.resources.map((r,i)=>({...r,id:200+i})),vocabularies:lesson.frontMatter.vocabulary.map((v,i)=>({id:300+i,key:'word-'+i,...(typeof v==='string'?{word:v,definition:''}:v)})),standards:[],opportunityStandards:[],programmingExpressions:[],jitPlConcepts:[],announcements:null,lessonPath:'/s/demo-practice-unit/lessons/1',preservedDemoSetting:'Keep this value',
 activities:lesson.activities.map((a,ai)=>({id:400+ai,name:a.title,duration:a.duration,activitySections:lesson.sections.filter(s=>s.activityId===a.id).map((s,si)=>({id:1000+ai*100+si,name:s.title,description:s.body,duration:s.duration,remarks:s.remarks,progressionName:s.progression?.title||'',tips:s.callouts.map(c=>({type:tips[c.type],markdown:c.body})),scriptLevels:[]}))}))};
 const fields={title:saved.name,teacherOverview:saved.overview,studentOverview:saved.studentOverview,purpose:saved.purpose,preparation:saved.preparation,assessmentOpportunities:saved.assessmentOpportunities};
 const unmanaged=clone(saved.activities);for(const a of unmanaged){delete a.name;delete a.duration;for(const s of a.activitySections)for(const k of ['name','description','duration','remarks'])delete s[k];}
 const capture={schemaVersion:1,kind:'native-dom-capture',readerVersion:'native-scalars-v1',destination,saved:clone(saved),blockers:[],remoteWrites:false,
 live:{fields,activities:clone(saved.activities),objectives:clone(saved.objectives),resources:clone(lesson.resources),vocabularies:clone(saved.vocabularies)},
 protection:{bootstrap:clone(saved),unmanagedActivities:unmanaged,objectives:clone(saved.objectives),resources:clone(lesson.resources),vocabularies:clone(saved.vocabularies),controls:[],otherTables:[]}};
 if(teaching){
  lesson.frontMatter.preparation='Prepare two contrasting examples and a place for students to record evidence.';
  lesson.activities[0].title='Investigate model decisions';lesson.activities[0].duration=12;
  lesson.sections[0].body='Ask students to compare the examples.\n\nDiscuss: **What evidence supports your prediction?**';
 }
 if(structure)lesson.sections.push({id:'demo-new-reflection',activityId:lesson.activities[0].id,title:'Evidence reflection',body:'Invite students to explain what changed their prediction.',duration:4,remarks:true,callouts:Object.keys(tips).map(type=>({type,body:'Sample '+type+' for the reflection.'})),progression:null});
 if(structure&&complete){
  const donor=lesson.sections.find(s=>s.progression),added=lesson.sections.at(-1);added.progression=clone(donor.progression);added.progression.title='Reflection level';donor.progression=null;
  lesson.sections[0].callouts[0]={type:'Ethics Opportunity',body:'Ask whose perspective is missing from the examples.'};
 }
 if(complete){saved.activities=saved.activities.slice(0,1);saved.activities[0].activitySections[0].tips=[];capture.saved=clone(saved);capture.live.activities=clone(saved.activities);capture.protection.bootstrap=clone(saved);capture.protection.unmanagedActivities=capture.protection.unmanagedActivities.slice(0,1);capture.protection.unmanagedActivities[0].activitySections[0].tips=[];}
 const names=[...new Set(lesson.sections.flatMap(s=>s.progression?.levels.map(l=>l.key)||[]))];
 return {saveUnchanged,destination,pkg:{schemaVersion:1,status:'approved-locally',sandbox:SANDBOX,lesson,baseline:clone(lesson),conflicts:[]},server:saved,editor:capture,mappings:names.map((key,i)=>({key,verified:true,destinationLevelId:700+i})),sendCount:0};
}
export function demoAdapter(state,persist){
 return {
  readSaved:async()=>({lesson:clone(state.server),originalLessonJson:JSON.stringify(state.server)}),
  checkUsage:async()=>({passed:true,conflicts:[]}),
  bridge:async request=>{
   if(request.action==='read')return clone(state.editor);
   if(await digest(state.editor)!==request.expectedCaptureDigest)throw Error('Demo editor changed outside this run.');
   if(request.action==='lookup-shared-record'){const record=(state.sharedRecords?.[request.kind]||[]).find(r=>canonical(r)===canonical(request.record));if(!record)throw Error('Shared record changed.');return {kind:'native-shared-mapping',record:clone(record),capture:clone(state.editor)};}
   if(request.action==='reload-reviewed-editor'){if(canonical(state.server)!==canonical(request.initialCapture.saved))throw Error('Saved baseline changed.');state.editor=clone(request.initialCapture);persist();return clone(state.editor);}
   if(request.action==='lookup-levels')return {kind:'native-level-mappings',capture:clone(state.editor),mappings:state.mappings.filter(m=>request.names.includes(m.key))};
   if(request.action==='save-approved-cleanup'){
    if(request.approval?.approved!==true)throw Error('Cleanup approval required.');
    const body=JSON.parse(request.review.request.body);if(canonical(JSON.parse(body.originalLessonData))!==canonical(state.server))throw Error('Demo saved baseline changed.');state.server.activities=JSON.parse(body.activities);state.cleanupSendCount=(state.cleanupSendCount||0)+1;persist();return {outcome:'response-received',ok:true,httpStatus:200,simulated:true};
   }
   if(request.action==='save-approved-review'){
    const body=JSON.parse(request.review.request.body);
    if(canonical(JSON.parse(body.originalLessonData))!==canonical(state.server))throw Error('Demo saved baseline changed.');
    if(state.saveUnchanged){state.sendCount++;persist();return {outcome:'response-received',ok:true,httpStatus:200,simulated:true,responseSummary:{kind:'lesson-summary',lessonId:state.server.id,levelAssociations:state.server.activities.flatMap(a=>a.activitySections).reduce((n,s)=>n+s.scriptLevels.length,0)}};}
    state.server.activities=JSON.parse(body.activities);state.server.objectives=JSON.parse(body.objectives);
    for(const kind of ['resources','vocabularies']){const catalog=[...state.server[kind],...(state.sharedRecords?.[kind]||[])];state.server[kind]=JSON.parse(body[kind]).map(key=>clone(catalog.find(r=>r.key===key)));}
    for(const key of ['name','overview','studentOverview','purpose','preparation','assessmentOpportunities'])state.server[key]=body[key];let id=10000,sectionId=20000,activityId=30000;
    for(const a of state.server.activities)if(a.id==null)a.id=++activityId;
    for(const a of state.server.activities)for(const s of a.activitySections)if(s.id==null)s.id=++sectionId;
    for(const a of state.server.activities)for(const s of a.activitySections)for(const sl of s.scriptLevels)if(sl.id==null)sl.id=++id;
    for(const [index,objective]of state.server.objectives.entries())if(objective.id==null){objective.id=40000+index;objective.key=crypto.randomUUID();}
    state.sendCount++;persist();return {outcome:'response-received',ok:true,httpStatus:200,simulated:true};
   }
   const op=request.operation,ai=op.path[1],si=op.path[3];
   if(request.action==='append-shared-association'){const kind=op.path[0]==='resources'?'resources':'vocabularies',r=op.record,row=kind==='resources'?{key:r.key,name:r.name,type:r.type,audience:r.audience,url:r.url}:{word:r.word,definition:r.definition};state.editor.live[kind].push(row);state.editor.protection[kind].push(clone(row));persist();return clone(state.editor);}
   if(request.action==='append-objective'){const record={key:'objective-'+(state.editor.live.objectives.length+1),description:op.after,scriptLevelIds:[]};state.editor.live.objectives.push(record);state.editor.protection.objectives.push(clone(record));persist();return clone(state.editor);}
   if(request.action==='remove-created-objective'){if(op.index!==state.editor.live.objectives.length-1||canonical(state.editor.live.objectives[op.index])!==canonical(op.expected)||op.expected.id!=null)throw Error('Unowned objective.');state.editor.live.objectives.pop();state.editor.protection.objectives.pop();persist();return clone(state.editor);}
   if(request.action==='set-scalar'){const value=nativeFieldValue(op);putField(state.editor.live,liveFieldPath(op),value);const p=protectedFieldPath(savedFieldPath(op));if(p)putField(state.editor.protection,p,value);persist();return clone(state.editor);}
   if(request.action==='append-activity'){
    const key='activity-'+(state.activityCounter=(state.activityCounter||0)+1),sk='activitySection-'+(state.sectionCounter=(state.sectionCounter||0)+1),section={key:sk,name:'',description:'',duration:null,remarks:false,tips:[],scriptLevels:[]};
    state.editor.live.activities.push({key,name:'',duration:null,position:state.editor.live.activities.length+1,activitySections:[section]});state.editor.protection.unmanagedActivities.push({key,position:state.editor.live.activities.length,activitySections:[{key:sk,tips:[],scriptLevels:[]}]});persist();return clone(state.editor);
   }
   if(request.action==='remove-created-activity'){if(ai!==state.editor.live.activities.length-1||state.editor.live.activities[ai].key!==op.createdKey||state.editor.live.activities[ai].id!=null)throw Error('Unowned activity.');state.editor.live.activities.pop();state.editor.protection.unmanagedActivities.pop();persist();return clone(state.editor);}
   if(request.action==='remove-created-callout'){const tips=state.editor.live.activities[ai].activitySections[si].tips;if(tips.length!==op.path[5]+1||canonical(tips.at(-1))!==canonical(op.expectedTip))throw Error('Unowned callout.');tips.pop();state.editor.protection.unmanagedActivities[ai].activitySections[si].tips.pop();persist();return clone(state.editor);}
   if(request.action==='append-section'){
    const key='activitySection-'+(state.sectionCounter=(state.sectionCounter||0)+1),section={key,name:'',description:'',duration:null,remarks:false,tips:[],scriptLevels:[]};
    state.editor.live.activities[ai].activitySections.push(section);state.editor.protection.unmanagedActivities[ai].activitySections.push({key,tips:[],scriptLevels:[]});persist();return clone(state.editor);
   }
   if(request.action==='remove-created-section'){
    const sections=state.editor.live.activities[ai].activitySections;if(si!==sections.length-1||sections[si].key!==op.createdKey||sections[si].id!=null)throw Error('Unowned demo section.');
    sections.pop();state.editor.protection.unmanagedActivities[ai].activitySections.pop();persist();return clone(state.editor);
   }
   if(request.action==='append-callout'){
    const types={'Teaching Tip':'teachingTip','Content Corner':'contentCorner','Discussion Goal':'discussionGoal','Assessment Opportunity':'assessmentOpportunity','Ethics Opportunity':'ethicsOpportunity'},tip={key:'tip-'+(state.tipCounter=(state.tipCounter||0)+1),type:types[op.after.type],markdown:op.after.body};
    state.editor.live.activities[ai].activitySections[si].tips.push(tip);state.editor.protection.unmanagedActivities[ai].activitySections[si].tips.push(clone(tip));persist();return clone(state.editor);
   }
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
