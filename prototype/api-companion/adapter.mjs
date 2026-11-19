export const DESTINATION_ID=8898985;
export const DESTINATION='https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11';
export function comparePackage(pkg,snapshot){
 if(snapshot?.id!==DESTINATION_ID)throw Error('This is not the assigned lesson.');
 if(pkg?.schemaVersion!==1||pkg.sandbox!==DESTINATION||!pkg.lesson?.frontMatter)throw Error('Choose a Lesson Studio review package for the assigned lesson.');
 const draft=pkg.lesson;
 for(const field of ['activities','sections','resources'])if(!Array.isArray(draft[field]))throw Error('The review package is incomplete.');
 const changes=[];
 const fields={title:'name',teacherOverview:'overview',studentOverview:'studentOverview',purpose:'purpose',preparation:'preparation',assessmentOpportunities:'assessmentOpportunities'};
 for(const [from,to] of Object.entries(fields)){
  const proposed=from==='title'?draft.title:draft.frontMatter[from];
  if(typeof proposed!=='string')throw Error('The review package has an invalid text field.');
  if(proposed!==(snapshot[to]||''))changes.push({field:to,current:snapshot[to]||'',proposed});
 }
 const blockers=[];
 if(pkg.status!=='approved-locally')blockers.push('The draft has not been approved locally.');
 if(!Array.isArray(pkg.conflicts)||pkg.conflicts.length)blockers.push('Revision conflicts must be resolved.');
 const existingResources=snapshot.resources||[];
 for(const r of draft.resources){
  if(!existingResources.some(x=>x.url===r.url&&x.name===r.name&&x.type===r.type&&x.audience===r.audience))blockers.push(`Destination resource mapping needed: ${r.name}`);
 }
 const linked=draft.sections.filter(s=>s.progression?.levels?.length);
 if(linked.length)blockers.push(`${linked.length} teaching sections need verified destination level mappings.`);
 if(draft.activities.length)blockers.push('Teaching Guide insertion and existing-activity preservation need a verified destination mapping.');
 if(draft.frontMatter.objectives?.length)blockers.push('Objective records need a verified destination mapping.');
 if(draft.frontMatter.vocabulary?.length)blockers.push('Vocabulary records need a verified destination mapping.');
 blockers.push('Remote saving is disabled in this comparison build.');
 return {version:'api-comparison-v1',destination:DESTINATION,destinationId:DESTINATION_ID,remoteWrites:false,changes,blockers,
  counts:{proposedActivities:draft.activities.length,proposedSections:draft.sections.length,existingActivities:(snapshot.activities||[]).length},
  originalLessonData:structuredClone(snapshot),reviewPackage:structuredClone(pkg)};
}
