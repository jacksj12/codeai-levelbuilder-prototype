// Local authoring operations retain existing records and source identities.
export const CALLOUT_TYPES=['Teaching Tip','Content Corner','Discussion Goal','Assessment Opportunity','Ethics Opportunity'];
export function addCallout(draft,sectionId,type,body){
 const section=draft.sections.find(s=>s.id===sectionId);
 if(!section)throw Error('Choose an existing teaching section.');
 if(!CALLOUT_TYPES.includes(type))throw Error('Choose a supported callout type.');
 if(!body.trim())throw Error('Enter the callout text.');
 section.callouts.push({type,body:body.trim()});
 return section.id;
}
export function addSection(draft,{id,activityId,afterId,title,body,duration}){
 if(!draft.activities.some(a=>a.id===activityId))throw Error('Choose an existing activity.');
 if(!id||draft.sections.some(s=>s.id===id))throw Error('The section needs a unique identity.');
 if(!body.trim())throw Error('Enter the teaching guidance.');
 if(duration!==null&&(!Number.isFinite(duration)||duration<0))throw Error('Minutes must be blank or a nonnegative number.');
 const after=afterId?draft.sections.find(s=>s.id===afterId):null;
 if(afterId&&(!after||after.activityId!==activityId))throw Error('Choose a section in the same activity.');
 const section={id,activityId,title:title.trim(),body:body.trim(),duration,origin:'local',slide:null,remarks:false,callouts:[],progression:null,sourceNotes:'Added locally; no source slide.',changes:[]};
 const last=draft.sections.findLastIndex(s=>s.activityId===activityId);
 const index=after?draft.sections.indexOf(after)+1:last<0?draft.sections.length:last+1;
 draft.sections.splice(index,0,section);
 return section.id;
}

export function addActivity(draft,{id,title,duration}){
 if(!id||draft.activities.some(a=>a.id===id))throw Error('The activity needs a unique identity.');
 if(typeof title!=='string'||!title.trim())throw Error('Enter an activity title.');
 if(!Number.isFinite(duration)||duration<0)throw Error('Minutes must be a nonnegative number.');
 draft.activities.push({id,title:title.trim(),duration,origin:'local'});
 draft.duration=draft.activities.reduce((n,a)=>n+a.duration,0);return id;
}
export function moveRecord(draft,kind,id,direction){
 if(!['activities','sections'].includes(kind)||![-1,1].includes(direction))throw Error('Choose a valid move.');
 const records=draft[kind],record=records.find(r=>r.id===id);if(!record)throw Error('This item no longer exists.');
 const siblings=kind==='sections'?records.filter(r=>r.activityId===record.activityId):records;
 const index=siblings.indexOf(record),other=siblings[index+direction];if(!other)return false;
 const a=records.indexOf(record),b=records.indexOf(other);[records[a],records[b]]=[records[b],records[a]];return true;
}
