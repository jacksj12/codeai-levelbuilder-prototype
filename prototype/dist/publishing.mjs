import {resourceRow} from './reviewed-shared.mjs';
import {validateSharedRecord} from './shared-records.mjs';
import {clone,canonical,digest,packageProblems,buildTransferPlan,validatePlan} from './transfer-core.mjs';
import {savedReport} from './destination-revisions.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';
import {savedFieldPath} from './reviewed-fields.mjs';
import {unsupportedNativeTransferActions} from './native-transfer-runner.mjs';
import {validateSaveReview,verifySavedReadback} from './save-review.mjs';
export async function validatePublicationBinding(pkg,destination,saved){
 if(!pkg.publication)return;
 const base=clone(pkg);delete base.publication;const binding=pkg.publication;
 if(binding.schemaVersion!==1||canonical(binding.destination)!==canonical(destination)||binding.packageDigest!==await digest(base))throw Error('This publication package belongs to another destination or its approved content changed. Prepare it again.');
 if(binding.baselineDigest!==await digest(saved))throw Error('The saved destination changed after the publication check. Read a new baseline and review the differences before staging.');
}
export async function preparePublication(pkg,report,{objectiveTargets}={}){
 const problems=packageProblems(pkg);if(problems.length)throw Error(problems.join(' '));
 const {destination,saved}=await savedReport(report),base=clone(pkg);delete base.publication;base.schemaVersion=1;base.sandbox=destination.url;
 if(objectiveTargets)base.objectiveMapping={schemaVersion:1,destinationId:destination.id,baseline:clone(saved.objectives),targets:clone(objectiveTargets)};
 const objectiveChoices={saved:saved.objectives.map(o=>({id:o.id,description:o.description,tagCount:o.scriptLevelIds?.length||0})),proposed:clone(base.lesson.frontMatter.objectives)};
 const snapshot=normalizeNativeCapture({kind:'native-dom-capture',destination,saved,blockers:[],live:{fields:{title:saved.name,teacherOverview:saved.overview??'',studentOverview:saved.studentOverview??'',purpose:saved.purpose??'',preparation:saved.preparation??'',assessmentOpportunities:saved.assessmentOpportunities??''},activities:saved.activities,objectives:saved.objectives,resources:saved.resources,vocabularies:saved.vocabularies}});
 snapshot.catalog.vocabularies=clone(saved.vocabularies);
 if(base.sharedRecords){for(const kind of ['resources','vocabularies'])for(const record of base.sharedRecords[kind]||[]){validateSharedRecord(kind,record);if(kind==='resources'){if(!snapshot.catalog.resources.some(r=>r.key===record.key))snapshot.catalog.resources.push({...resourceRow(record),markdownKey:record.markdownKey,destinationRecordId:record.id,verifiedSharedRecord:clone(record)});}else if(!snapshot.catalog.vocabularies.some(r=>r.key===record.key))snapshot.catalog.vocabularies.push(clone(record));}}
 const first=await buildTransferPlan(base,snapshot),decisions={};
 for(const operation of first.operations){if(operation.path.length===1&&operation.path[0]==='title')decisions[operation.id]='keep';else if(savedFieldPath(operation))decisions[operation.id]='replace';}
 const plan=await buildTransferPlan(base,snapshot,decisions),unsupported=unsupportedNativeTransferActions(plan);
 const checks=plan.blockers.filter(message=>message.startsWith('Levels / '));
 const blockers=[...plan.blockers.filter(message=>!checks.includes(message)),...unsupported.map(operation=>operation.label+': not supported by the native companion.'),...plan.operations.filter(operation=>operation.requiresDecision).map(operation=>operation.label+': an existing collection or progression needs a separate decision.')];
 base.schemaVersion=base.sharedRecords?4:base.objectiveMapping?3:2;
 const binding={schemaVersion:1,destination:clone(destination),baselineDigest:await digest(saved),packageDigest:await digest(base)};
 const handoff={...base,publication:binding};
 return {kind:'publication-preflight',objectiveChoices,destination,status:blockers.length?'blocked':!plan.operations.length&&!checks.length?'already-matches':'ready-for-companion-review',blockers:[...new Set(blockers)],checks,changes:plan.operations.map(({label,before,after})=>({label,before,after})),preserved:plan.preserved,existingLevels:saved.activities.flatMap(a=>a.activitySections).flatMap(s=>s.scriptLevels).length,handoff};
}
export async function verifyPublicationReceipt(handoff,report){
 if(report?.mode!=='native'||report.receipt?.status!=='saved-and-verified'||report.receipt.review?.preservationTest)throw Error('Choose the completed native publication report, not a demo or unchanged-save test.');
 if(canonical(report.pkg)!==canonical(handoff)||canonical(report.job?.pkg)!==canonical(handoff))throw Error('This receipt is for a different approved publication package.');
 const receipt=report.receipt,plan=report.job?.rehearsal?.plan;await validateSaveReview(receipt.review,{checkExpiry:false});await validatePlan(plan);
 if(plan.packageDigest!==await digest(handoff)||plan.id!==receipt.review.rehearsalPlanId||canonical(plan.expectedLesson)!==canonical(receipt.review.expectedLesson))throw Error('The receipt does not match the approved publication plan.');
 await validatePublicationBinding(handoff,receipt.review.destination,receipt.review.baseline);
 const verification=await verifySavedReadback(receipt.review,receipt.readback);if(!verification.passed)throw Error('Saved verification failed. Preserve the report; do not resend the save.');
 return {status:'saved-and-verified',destination:clone(receipt.review.destination),counts:clone(receipt.review.expectedCounts),reviewId:receipt.review.id,verifiedAt:new Date().toISOString(),remoteRequests:0};
}
