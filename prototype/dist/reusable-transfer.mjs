import {validatePublicationBinding} from './publishing.mjs';
import {clone,canonical,digest,packageProblems} from './transfer-core.mjs';
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
 if(current.blockers.length)throw Error('The editor has incomplete fields: '+current.blockers.join(' ')+' No staging was attempted.');
 const differences=[];const compare=(a,b,path=[])=>{if(canonical(a)===canonical(b))return;if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))compare(a[k],b[k],[...path,k]);}else differences.push(path.join(' / '));};compare(current.lesson,baseline.lesson);
 if(differences.length)throw Error('The editor has unsaved differences at: '+differences.slice(0,8).join('; ')+(differences.length>8?'; and '+(differences.length-8)+' more':'')+'. No staging was attempted. Download the report before changing or reloading the lesson.');
 const settings={Lockable:'lockable','Has Lesson Plan':'hasLessonPlan',Assessment:'assessment','Unplugged Lesson':'unplugged',Background:'background','Creative Commons Image':'creativeCommonsLicense'};
 for(const control of editor.protection?.controls||[]){
  const key=settings[control.label];if(!key)continue;
  const expected=control.type==='checkbox'?Boolean(saved[key]):saved[key]??(key==='creativeCommonsLicense'?'Creative Commons BY-NC-SA':'');
  if(control.value!==expected)throw Error('The editor has an unsaved '+control.label+' setting. Preserve that edit before preparing a transfer.');
 }
}

export async function readTransferBaseline(io){
 io.onProgress?.('Reading fresh saved lesson data…');
 const fresh=await io.readSaved();
 io.onProgress?.('Reading the open editor without changing it…');
 const editor=await io.bridge({action:'read'});
 await io.checkpoint({status:'baseline-read',initialCapture:editor,freshSaved:fresh.lesson,stagingStarted:false});
 if(canonical(editor.saved)!==canonical(fresh.lesson))throw Error('The open editor has an older saved baseline. Preserve any unsaved edits, then reopen the editor and compare again.');
 io.onProgress?.('Baseline captured. Checking for unsaved differences…');
 assertCleanSavedBaseline(editor,fresh.lesson);
 return {fresh,editor};
}

export async function prepareTransfer(pkg,io){
 const problems=packageProblems(pkg);if(problems.length)throw Error(problems.join(' '));
 const source=clone(pkg),{editor,fresh}=await readTransferBaseline(io);
 await validatePublicationBinding(source,editor.destination,fresh.lesson);
 await io.checkpoint({status:'before-rehearsal',initialCapture:editor});
 const rehearsal=await runAcceptedNativeRehearsal(io.bridge,source,{onProgress:io.onProgress,onCheckpoint:point=>io.checkpoint({status:'rehearsing',stage:point})});
 await io.checkpoint({status:rehearsal.status,stage:rehearsal});
 if(rehearsal.status!=='passed-and-restored')throw Error([rehearsal.error,rehearsal.restorationError].filter(Boolean).join(' ')||'Rehearsal did not finish and restore.');
 const latest=await io.readSaved();
 const review=await buildSaveReview(rehearsal,latest.lesson,{originalLessonJson:latest.originalLessonJson});
 const usage=await io.checkUsage(review);if(!usage.passed)throw Error('Levels already used in this unit: '+usage.conflicts.map(c=>c.name).join(', '));
 return {schemaVersion:1,kind:'reviewed-transfer-job',pkg:source,rehearsal,review};
}
export async function preparePreservationTest(io){
 const {fresh,editor}=await readTransferBaseline(io),snapshot=normalizeNativeCapture(editor);
 const plan={schemaVersion:1,kind:'browser-transfer-plan',destination:clone(snapshot.destination),packageDigest:await digest({purpose:'explicit-unchanged-native-save-test'}),destinationDigest:await digest(snapshot),operations:[],preserved:['Complete saved lesson, existing levels and all settings'],blockers:[],originalSnapshot:clone(snapshot),expectedLesson:clone(snapshot.lesson),remoteWrites:false,saveAllowed:false};plan.id=await digest(plan);
 const rehearsal={status:'passed-and-restored',checksPassed:true,restored:true,plan,initialCapture:clone(editor),stagedCapture:clone(editor),finalCapture:clone(editor)};
 const review=await buildSaveReview(rehearsal,fresh.lesson,{originalLessonJson:fresh.originalLessonJson,preservationTest:true});
 return {schemaVersion:1,kind:'reviewed-transfer-job',rehearsal,review};
}

export async function approveTransfer(job){
 await validateSaveReview(job.review);
 return {...clone(job),approval:{approved:true,approvedRequestDigest:await saveRequestDigest(job.review),approvedAt:new Date().toISOString()}};
}
export function executeTransfer(job,io){
 return runApprovedSave(job,{...io,readEditor:()=>io.bridge({action:'read'}),send:request=>io.bridge(request),
  stage:()=>job.review.preservationTest?io.bridge({action:'read'}).then(stagedCapture=>({status:'staged-unsaved',checksPassed:true,stagedCapture})):runAcceptedNativeRehearsal(io.bridge,job.pkg,{leaveStaged:true,onProgress:io.onProgress,onCheckpoint:point=>io.checkpoint({status:'staging',stage:point})}),
  recover:async()=>{const point=await io.loadCheckpoint();if(!point?.stage)throw Error('No owned staging checkpoint is available. Outside edits were preserved.');return recoverNativeLevelCheck(io.bridge,point.stage);}
 });
}
