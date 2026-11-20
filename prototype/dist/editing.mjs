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
