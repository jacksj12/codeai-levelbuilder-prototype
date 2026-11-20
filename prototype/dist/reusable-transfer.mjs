import {clone,canonical,packageProblems} from './transfer-core.mjs';
import {buildSaveReview,saveRequestDigest,validateSaveReview} from './save-review.mjs';
import {runApprovedSave} from './approved-save.mjs';
import {runAcceptedNativeRehearsal,recoverNativeLevelCheck} from './native-level-verification.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';

export function assertCleanSavedBaseline(editor,saved){
 const snapshot={kind:'native-dom-capture',destination:editor.destination,saved,blockers:[],live:{
  fields:{title:saved.name,teacherOverview:saved.overview||'',studentOverview:saved.studentOverview||'',purpose:saved.purpose||'',preparation:saved.preparation||'',assessmentOpportunities:saved.assessmentOpportunities||''},
  activities:saved.activities,objectives:saved.objectives,vocabularies:saved.vocabularies,resources:saved.resources.map(({key,name,type,audience,url})=>({key,name,type,audience,url}))
 }};
 const current=normalizeNativeCapture(editor),baseline=normalizeNativeCapture(snapshot);
 current.lesson.frontMatter.objectives.sort();baseline.lesson.frontMatter.objectives.sort();
 if(current.blockers.length||canonical(current.lesson)!==canonical(baseline.lesson))throw Error('The editor contains unsaved content or incomplete fields. Preserve those edits and save or discard them yourself before preparing a transfer.');
 const settings={Lockable:'lockable','Has Lesson Plan':'hasLessonPlan',Assessment:'assessment','Unplugged Lesson':'unplugged',Background:'background','Creative Commons Image':'creativeCommonsLicense'};
 for(const control of editor.protection?.controls||[]){
  const key=settings[control.label];if(!key)continue;
  const expected=control.type==='checkbox'?Boolean(saved[key]):saved[key]??(key==='creativeCommonsLicense'?'Creative Commons BY-NC-SA':'');
  if(control.value!==expected)throw Error('The editor has an unsaved '+control.label+' setting. Preserve that edit before preparing a transfer.');
 }
}

export async function prepareTransfer(pkg,io){
 const problems=packageProblems(pkg);if(problems.length)throw Error(problems.join(' '));
 const source=clone(pkg),fresh=await io.readSaved();
 const editor=await io.bridge({action:'read'});
 if(canonical(editor.saved)!==canonical(fresh.lesson))throw Error('The open editor has an older saved baseline. Preserve any unsaved edits, then reopen the editor and compare again.');
 assertCleanSavedBaseline(editor,fresh.lesson);
 await io.checkpoint({status:'before-rehearsal',initialCapture:editor});
 const rehearsal=await runAcceptedNativeRehearsal(io.bridge,source,{onProgress:io.onProgress,onCheckpoint:point=>io.checkpoint({status:'rehearsing',stage:point})});
 await io.checkpoint({status:rehearsal.status,stage:rehearsal});
 if(rehearsal.status!=='passed-and-restored')throw Error([rehearsal.error,rehearsal.restorationError].filter(Boolean).join(' ')||'Rehearsal did not finish and restore.');
 const latest=await io.readSaved();
 const review=await buildSaveReview(rehearsal,latest.lesson,{originalLessonJson:latest.originalLessonJson});
 const usage=await io.checkUsage(review);if(!usage.passed)throw Error('Levels already used in this unit: '+usage.conflicts.map(c=>c.name).join(', '));
 return {schemaVersion:1,kind:'reviewed-transfer-job',pkg:source,rehearsal,review};
}
export async function approveTransfer(job){
 await validateSaveReview(job.review);
 return {...clone(job),approval:{approved:true,approvedRequestDigest:await saveRequestDigest(job.review),approvedAt:new Date().toISOString()}};
}
export function executeTransfer(job,io){
 return runApprovedSave(job,{...io,readEditor:()=>io.bridge({action:'read'}),send:request=>io.bridge(request),
  stage:()=>runAcceptedNativeRehearsal(io.bridge,job.pkg,{leaveStaged:true,onProgress:io.onProgress,onCheckpoint:point=>io.checkpoint({status:'staging',stage:point})}),
  recover:async()=>{const point=await io.loadCheckpoint();if(!point?.stage)throw Error('No owned staging checkpoint is available. Outside edits were preserved.');return recoverNativeLevelCheck(io.bridge,point.stage);}
 });
}
