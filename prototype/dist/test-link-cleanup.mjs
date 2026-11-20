import {reviewedLevelGroups} from './reviewed-structure.mjs';
import {clone,canonical,digest} from './transfer-core.mjs';
import {verifySavedReadback,buildSavedLessonPayload,saveRequestDigest} from './save-review.mjs';
import {assertCleanSavedBaseline} from './reusable-transfer.mjs';
// Planning only: never deletes level records, sends requests, or changes the editor.
export async function planTestLinkCleanup(receipt,freshSaved){
 if(receipt?.kind!=='approved-native-save-receipt'||receipt.status!=='saved-and-verified'||!receipt.attempted||!receipt.verification?.passed)throw Error('Cleanup needs a verified saved test receipt.');
 const review=receipt.review;if(!reviewedLevelGroups(review).length)throw Error('This transfer added no test links to clean up. Teaching changes are retained.');
 const verified=await verifySavedReadback(review,receipt.readback);
 if(!verified.passed)throw Error('The receipt does not prove the saved test links.');
 if(freshSaved?.id!==review.destination.id)throw Error('Cleanup destination differs from the test receipt.');
 const result=clone(freshSaved),removals=[];
 for(const change of reviewedLevelGroups(review)){
  if(change.newSection){const activity=receipt.readback.activities[change.activityIndex];if(!change.newActivity&&activity.id!==change.activityId)throw Error('The new section activity identity changed.');change.sectionId=activity.activitySections[change.sectionIndex].id;}
  const find=lesson=>lesson.activities.flatMap(a=>a.activitySections).find(s=>s.id===change.sectionId);
  const before=change.newSection?{scriptLevels:[],progressionName:null}:find(review.baseline),recorded=find(receipt.readback),current=find(freshSaved),target=find(result);
  if(!before||!recorded||!current||before.scriptLevels.length)throw Error('Cleanup requires a recorded originally empty progression.');
  if(canonical(current.scriptLevels)!==canonical(recorded.scriptLevels)||current.progressionName!==recorded.progressionName)throw Error('The test links changed after saving. Cleanup needs a new review.');
  if(recorded.scriptLevels.length!==change.addLevels.length)throw Error('The recorded link ownership is incomplete.');
  removals.push({sectionId:change.sectionId,section:change.section,links:recorded.scriptLevels.map(sl=>({associationId:sl.id,levelId:sl.levels[0].id,name:sl.levels[0].name}))});
  target.scriptLevels=clone(before.scriptLevels);target.progressionName=before.progressionName;
 }
 const plan={schemaVersion:1,kind:'test-link-cleanup-plan',destination:clone(review.destination),baselineDigest:await digest(freshSaved),sourceRequestDigest:receipt.requestDigest,removals,expectedSaved:result,restorePoint:clone(freshSaved),requiresExactSaveApproval:true,remoteWrites:false};
 return {...plan,id:await digest(plan)};
}

export async function buildCleanupReview(sourceReceipt,fresh,{now=Date.now()}={}){
 const plan=await planTestLinkCleanup(sourceReceipt,fresh.lesson);
 if(typeof fresh.originalLessonJson!=='string'||canonical(JSON.parse(fresh.originalLessonJson))!==canonical(fresh.lesson))throw Error('The original saved snapshot is required.');
 const review={schemaVersion:1,kind:'native-cleanup-review',destination:plan.destination,sourceReceipt:clone(sourceReceipt),baseline:clone(fresh.lesson),baselineDigest:plan.baselineDigest,expectedSaved:plan.expectedSaved,removals:plan.removals,createdAt:now,expiresAt:now+600000,requiresExactSaveApproval:true,remoteWrites:false,
 request:{method:'PUT',url:'https://levelbuilder-studio.code.org/lessons/'+plan.destination.id,contentType:'application/json;charset=UTF-8',body:JSON.stringify(buildSavedLessonPayload(fresh.lesson,plan.expectedSaved,fresh.originalLessonJson))}};
 return {...review,id:await digest(review)};
}
export async function validateCleanupReview(review,{now=Date.now(),checkExpiry=true}={}){
 if(review?.kind!=='native-cleanup-review'||review.remoteWrites!==false||review.requiresExactSaveApproval!==true)throw Error('Invalid cleanup review.');
 const copy=clone(review);delete copy.id;if(await digest(copy)!==review.id)throw Error('Cleanup review changed. Prepare it again.');
 if(checkExpiry&&now>review.expiresAt)throw Error('Cleanup review expired. Prepare it again.');
 const raw=JSON.parse(review.request.body).originalLessonData;
 const rebuilt=await buildCleanupReview(review.sourceReceipt,{lesson:review.baseline,originalLessonJson:raw},{now:review.createdAt});
 if(canonical(rebuilt)!==canonical(review))throw Error('Cleanup differs from the receipt-owned changes.');
 return review;
}
export async function approveCleanup(review){await validateCleanupReview(review);return {approved:true,approvedRequestDigest:await saveRequestDigest(review),approvedAt:new Date().toISOString()};}
export function verifyCleanupReadback(review,saved){const passed=canonical(saved)===canonical(review.expectedSaved);return {passed,baselineUnchanged:canonical(saved)===canonical(review.baseline),mismatches:passed?[]:['Saved cleanup differs from the reviewed removal or unrelated content changed.']};}
function checkEditor(editor,sourceReceipt,saved){
 try{assertCleanSavedBaseline(editor,saved);}catch(error){if(!sourceReceipt.stagedCapture||canonical(editor)!==canonical(sourceReceipt.stagedCapture))throw error;}
}
export async function prepareCleanup(sourceReceipt,io){const fresh=await io.readSaved(),editor=await io.bridge({action:'read'});checkEditor(editor,sourceReceipt,fresh.lesson);return buildCleanupReview(sourceReceipt,fresh);}
export async function executeCleanup(review,approval,io){
 await validateCleanupReview(review,{checkExpiry:false});const requestDigest=await saveRequestDigest(review),key='cleanup:'+requestDigest;
 if(approval?.approved!==true||approval.approvedRequestDigest!==requestDigest)throw Error('Exact cleanup approval is required.');
 let receipt=await io.loadReceipt(key);
 const verify=async()=>{const fresh=await io.readSaved(),verification=verifyCleanupReadback(review,fresh.lesson);receipt={...receipt,status:verification.passed?'cleanup-saved-and-verified':'cleanup-not-confirmed',verification,readback:fresh.lesson,checkedAt:new Date().toISOString()};await io.persist(key,receipt);return receipt;};
 if(receipt?.attempted)return verify();
 await validateCleanupReview(review);const fresh=await io.readSaved();
 if(await digest(fresh.lesson)!==review.baselineDigest||fresh.originalLessonJson!==JSON.parse(review.request.body).originalLessonData)throw Error('Saved lesson changed. Prepare cleanup again.');
 const editor=await io.bridge({action:'read'});checkEditor(editor,review.sourceReceipt,fresh.lesson);
 receipt={schemaVersion:1,kind:'test-link-cleanup-receipt',status:'dispatching',attempted:true,saveRetried:false,requestDigest,review:clone(review),approval:clone(approval),restorePoint:clone(fresh),editorBeforeDispatch:clone(editor),attemptedAt:new Date().toISOString()};
 await io.persist(key,receipt);
 try{receipt.dispatch=await io.bridge({action:'save-approved-cleanup',mode:'explicit-approved-cleanup',review,approval,expectedCaptureDigest:await digest(editor)});}catch(error){receipt.dispatch={outcome:'unknown',error:error.message};}
 await io.persist(key,receipt);
 try{return await verify();}catch(error){receipt={...receipt,status:'cleanup-not-confirmed',readbackError:error.message};await io.persist(key,receipt);return receipt;}
}
