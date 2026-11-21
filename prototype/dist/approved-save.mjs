import {clone,canonical,digest} from './transfer-core.mjs';
import {buildSaveReview,saveRequestDigest,validateSaveReview,validateStagedSaveReview,verifySavedReadback} from './save-review.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';

function sameEditor(a,b){
 const left=normalizeNativeCapture(a),right=normalizeNativeCapture(b);
 return !left.blockers.length&&!right.blockers.length&&canonical(left.lesson)===canonical(right.lesson)&&canonical(left.nativeProtection)===canonical(right.nativeProtection);
}

// The receipt must be persisted before dispatch. An uncertain result can only
// be read back, never automatically sent a second time.
export async function runApprovedSave(job,{readSaved,readEditor,checkUsage,stage,send,loadReceipt,persist,recover,onProgress=()=>{},checkpoint=async()=>{}}){
 const {review:approved,rehearsal,approval}=job;
 await validateSaveReview(approved,{checkExpiry:false});
 const requestDigest=await saveRequestDigest(approved);
 if(approval?.approved!==true||approval.approvedRequestDigest!==requestDigest)throw Error('This request does not have matching approval.');
 const attemptId=approval.attemptId;
 if(attemptId){
  const prior=job.previousAttempt;
  if(!/^[a-z0-9-]{1,100}$/.test(attemptId)||!approval.retryAuthorizedByUser||prior?.requestDigest!==requestDigest||prior.dispatch?.outcome!=='rejected'||!prior.attempted||canonical(prior.readback)!==canonical(approved.baseline))throw Error('A new attempt requires explicit user authorization and a confirmed rejected, unchanged prior attempt.');
 }
 const receiptKey=requestDigest+(attemptId?':'+attemptId:'');
 let receipt=await loadReceipt(receiptKey);
 const verify=async()=>{
  const fresh=await readSaved(),result=await verifySavedReadback(receipt.review,fresh.lesson);
  const acknowledgementConfirmed=!receipt.review.preservationTest||receipt.dispatch?.outcome==='native-editor-acknowledged';
  const status=result.passed&&acknowledgementConfirmed?'saved-and-verified':result.baselineUnchanged&&receipt.dispatch?.outcome==='rejected'?'save-rejected-unchanged':'save-not-confirmed';
  receipt={...receipt,status,...(receipt.review.preservationTest?{nativeAcknowledgementConfirmed:acknowledgementConfirmed}:{}),verification:result,readback:fresh.lesson,checkedAt:new Date().toISOString()};
  delete receipt.readbackError;
  await persist(receiptKey,receipt);return receipt;
 };
 if(receipt?.attempted){onProgress('Checking the earlier save attempt without sending it again.');return verify();}
 onProgress('Checking the saved baseline and preserving a restore point.');
 const fresh=await readSaved();
 const review=await buildSaveReview(rehearsal,fresh.lesson,{originalLessonJson:fresh.originalLessonJson,transport:approved.transport??'direct-api',preservationTest:approved.preservationTest===true});
 if(await saveRequestDigest(review)!==requestDigest)throw Error('The refreshed request differs from the approved save.');
 const usage=await checkUsage(review);
 if(usage.passed!==true)throw Error('These levels are already used in the destination unit: '+usage.conflicts.map(c=>c.name).join(', ')+'. Create separately reviewed copies or use another unit; no save was sent.');
 let current=await readEditor();
 if(!sameEditor(current,rehearsal.initialCapture)&&recover){
  onProgress('Checking the saved restore point for an interrupted unsaved staging run.');
  await recover();current=await readEditor();
 }
 if(!sameEditor(current,rehearsal.initialCapture))throw Error('The editor changed since rehearsal. No save was sent.');
 await checkpoint({status:'before-staging',review,initialCapture:clone(current)});
 onProgress('Staging the approved changes in the selected lesson.');
 const staged=await stage();
 if(staged.status!=='staged-unsaved'||!staged.checksPassed)throw Error(staged.error||'Approved changes could not be staged.');
 await checkpoint({status:'staged-unsaved',review,stage:staged});
 await validateStagedSaveReview(review,staged.stagedCapture);
 const latest=await readSaved();await validateSaveReview(review,{freshSaved:latest.lesson});
 // The original server serialization is part of Rails' concurrency guard.
 if(JSON.parse(review.request.body).originalLessonData!==latest.originalLessonJson)throw Error('The server snapshot serialization changed before dispatch. No save was sent.');
 const ready=await readEditor();await validateStagedSaveReview(review,ready);
 receipt={schemaVersion:1,kind:'approved-native-save-receipt',requestDigest,...(attemptId?{attemptId,priorAttemptedAt:job.previousAttempt.attemptedAt}:{}),status:'dispatching',attempted:true,saveRetried:false,review,restorePoint:clone(latest),stagedCapture:ready,approval:clone(approval),attemptedAt:new Date().toISOString()};
 await persist(receiptKey,receipt);
 onProgress('Saving the approved changes once, then reading the saved lesson back.');
 try{receipt.dispatch=await send({action:'save-approved-review',mode:'explicit-approved-save',review,approval,expectedCaptureDigest:await digest(ready)});}
 catch(error){receipt.dispatch={outcome:'unknown',error:error.message};}
 await persist(receiptKey,receipt);
 try{return await verify();}catch(error){receipt={...receipt,status:'save-not-confirmed',readbackError:error.message};await persist(receiptKey,receipt);return receipt;}
}
