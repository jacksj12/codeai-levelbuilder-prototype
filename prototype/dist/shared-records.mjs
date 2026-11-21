import {clone,canonical,digest,packageProblems} from './transfer-core.mjs';
import {validDestination} from './destination.mjs';
const resourceFields=['name','type','audience','url'];
export function sharedMeaning(kind,record){return kind==='resources'?Object.fromEntries(resourceFields.map(k=>[k,record[k]])):{word:record.word,definition:record.definition,commonSenseMedia:Boolean(record.commonSenseMedia)};}
export function sharedIntent(kind,value){
 if(!['resources','vocabularies'].includes(kind))throw Error('Unknown shared record kind.');
 if(kind==='vocabularies'&&typeof value==='string'){const split=value.indexOf(': ');if(split<1)throw Error('New vocabulary needs a word and definition.');value={word:value.slice(0,split),definition:value.slice(split+2)};}
 const content=sharedMeaning(kind,value),label=kind==='resources'?content.name:content.word;
 if(typeof label!=='string'||label.length>255||label.trim().length<3||!/[a-z0-9]{3}/i.test(label))throw Error('Shared record names need a searchable word of at least three characters and at most 255 characters.');
 if(kind==='resources'){
  if(!['Student','Teacher','Verified Teacher'].includes(content.audience)||typeof content.type!=='string'||!content.type.trim()||content.type.length>100)throw Error('Check the resource type and audience.');
  let url;try{url=new URL(content.url);}catch{throw Error('Resources need an HTTPS link.');}if(url.protocol!=='https:'||url.username||url.password||content.url.length>255)throw Error('Resources need an HTTPS link of at most 255 characters without credentials.');
  if(content.type==='Answer Key'&&content.audience==='Student')throw Error('Answer keys must remain teacher-only.');
  return {...content,downloadUrl:'',embeddabilityType:'embed_and_resource_dropdown',curriculumCategory:'',includeInPdf:false,assessment:false};
 }
 if(typeof content.definition!=='string'||!content.definition.trim()||content.definition.length>60000)throw Error('Vocabulary needs a nonempty definition of at most 60000 characters.');return content;
}
export function validateSharedRecord(kind,record){
 const keys=kind==='resources'?['id','key','markdownKey','name','url','downloadUrl','audience','type','embeddabilityType','curriculumCategory','assessment','includeInPdf','isRollup']:['id','key','markdownKey','word','definition','commonSenseMedia'];
 if(!record||Object.keys(record).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(record,k))||!Number.isSafeInteger(record.id)||record.id<1||typeof record.key!=='string'||!record.key||typeof record.markdownKey!=='string'||!record.markdownKey)throw Error('The shared-record response is incomplete or contains unknown metadata.');
 const booleanFields=kind==='resources'?['assessment','includeInPdf','isRollup']:['commonSenseMedia'];for(const field of keys.filter(k=>!['id',...booleanFields].includes(k)))if(typeof record[field]!=='string')throw Error('The shared-record response has invalid text fields.');for(const field of booleanFields)if(typeof record[field]!=='boolean')throw Error('The shared-record response has invalid flags.');return record;
}
export function sharedMatches(kind,intent,rows){
 if(!Array.isArray(rows)||rows.length>=40)throw Error('Shared-record search is incomplete. Use a more specific resource name or vocabulary word.');
 const matches=rows.filter(record=>canonical(sharedMeaning(kind,record))===canonical(sharedMeaning(kind,intent))).map(record=>validateSharedRecord(kind,record));
 if(matches.length>1)throw Error('Multiple shared records match exactly. Resolve the duplicate records before publishing.');return matches;
}
export async function prepareSharedReview(pkg,io){
 const errors=packageProblems(pkg);if(errors.length)throw Error(errors.join(' '));
 const context=await io.context();if(!validDestination(context.destination)||!Number.isSafeInteger(context.courseVersionId)||context.courseVersionId<1||context.saved?.id!==context.destination.id)throw Error('The destination course scope is missing.');
 const items=[];
 for(const [kind,values]of [['resources',pkg.lesson.resources],['vocabularies',pkg.lesson.frontMatter.vocabulary]])for(const value of values){const intent=sharedIntent(kind,value);if(items.some(i=>i.kind===kind&&canonical(i.intent)===canonical(intent)))continue;if(items.length>=40)throw Error('Review at most 40 shared records at a time.');const rows=await io.search(kind,intent,context),matches=sharedMatches(kind,intent,rows);items.push({kind,intent,action:matches.length?'reuse':'create',record:matches[0]||null,key:await digest({kind,courseVersionId:context.courseVersionId,intent})});}
 const review={kind:'shared-record-review',schemaVersion:1,destination:clone(context.destination),courseVersionId:context.courseVersionId,baselineDigest:await digest(context.saved),packageDigest:await digest(pkg),items,expiresAt:Date.now()+600000};review.id=await digest(review);return review;
}
export async function validateSharedReview(review,{checkExpiry=true}={}){const copy=clone(review);delete copy.id;if(review?.kind!=='shared-record-review'||review.schemaVersion!==1||!validDestination(review.destination)||await digest(copy)!==review.id||!Array.isArray(review.items)||review.items.length>40||!Number.isSafeInteger(review.courseVersionId)||review.courseVersionId<1||checkExpiry&&Date.now()>review.expiresAt)throw Error('The shared-record review changed or expired. Prepare it again.');for(const item of review.items){if(canonical(sharedIntent(item.kind,item.intent))!==canonical(item.intent)||item.key!==await digest({kind:item.kind,courseVersionId:review.courseVersionId,intent:item.intent})||!['create','reuse'].includes(item.action))throw Error('The shared-record intent changed.');if(item.action==='reuse')validateSharedRecord(item.kind,item.record);}return review;}
export async function executeSharedReview(review,approval,io,{readOnly=false}={}){
 await validateSharedReview(review,{checkExpiry:false});if(approval?.reviewId!==review.id||approval.approved!==true)throw Error('Approve this exact shared-record review first.');
 const result={kind:'shared-record-receipt',schemaVersion:1,review:clone(review),items:[],status:'checking',lessonSaved:false};
 for(const item of review.items){
  let attempt=await io.load(item.key),context=await io.context();if(context.courseVersionId!==review.courseVersionId||canonical(context.destination)!==canonical(review.destination)||await digest(context.saved)!==review.baselineDigest)throw Error('The lesson or its course scope changed. No further shared records were created.');
  let matches=sharedMatches(item.kind,item.intent,await io.search(item.kind,item.intent,context));
  if(item.action==='reuse'&&(!matches.length||canonical(matches[0])!==canonical(item.record)))throw Error('A reviewed shared record changed. Prepare a new review.');
  if(attempt?.attempted){if(attempt.key!==item.key||canonical(attempt.intent)!==canonical(item.intent)||attempt.courseVersionId!==review.courseVersionId)throw Error('Retained shared-record attempt evidence does not match.');if(matches.length&&attempt.returnedId&&matches[0].id!==attempt.returnedId)matches=[];}
  else if(!matches.length&&!readOnly){
   await validateSharedReview(review);attempt={kind:'shared-record-attempt',key:item.key,intent:clone(item.intent),courseVersionId:review.courseVersionId,attempted:true,attemptedAt:new Date().toISOString(),reviewId:review.id,status:'dispatching'};
   await io.persist(item.key,attempt); // Persist before the only POST. Never retry an uncertain creation.
   try{const response=await io.create(review,item,approval);attempt={...attempt,dispatch:response.outcome,...(response.record?{returnedId:validateSharedRecord(item.kind,response.record).id}:{}),status:'checking'};}catch(error){attempt={...attempt,dispatch:'unknown',error:String(error.message),status:'checking'};}
   await io.persist(item.key,attempt);matches=sharedMatches(item.kind,item.intent,await io.search(item.kind,item.intent,context));if(matches.length&&attempt.returnedId&&matches[0].id!==attempt.returnedId)matches=[];
  }
  if(matches.length&&item.action==='create'&&Object.entries(item.intent).some(([key,value])=>canonical(matches[0][key])!==canonical(value)))throw Error('The created shared record settings differ from the reviewed settings. Recheck with a new review.');
  const checked={key:item.key,kind:item.kind,status:matches.length?'record-verified':'creation-not-confirmed',record:matches[0]||null,attempted:Boolean(attempt?.attempted),ownership:'not-assumed'};if(attempt)await io.persist(item.key,{...attempt,...checked});result.items.push(checked);io.onProgress?.(checked);if(!matches.length){result.status='creation-not-confirmed';return result;}
 }
 result.status='shared-records-verified';return result;
}
export async function bindSharedRecords(pkg,receipt){
 if(receipt?.status!=='shared-records-verified')throw Error('Verify every shared record before continuing the lesson review.');await validateSharedReview(receipt.review,{checkExpiry:false});if(await digest(pkg)!==receipt.review.packageDigest)throw Error('The lesson package changed after shared-record review.');
 const base=clone(pkg);delete base.publication;base.schemaVersion=4;base.sandbox=receipt.review.destination.url;base.sharedRecords={courseVersionId:receipt.review.courseVersionId,resources:[],vocabularies:[]};
 if(!Array.isArray(receipt.items)||receipt.items.length!==receipt.review.items.length||new Set(receipt.items.map(i=>i.key)).size!==receipt.items.length)throw Error('The shared-record receipt is incomplete.');
 for(const item of receipt.items){const reviewed=receipt.review.items.find(i=>i.key===item.key&&i.kind===item.kind);if(!reviewed||item.status!=='record-verified'||canonical(sharedMeaning(item.kind,item.record))!==canonical(sharedMeaning(item.kind,reviewed.intent))||reviewed.action==='reuse'&&canonical(item.record)!==canonical(reviewed.record))throw Error('A shared record does not match its review.');base.sharedRecords[item.kind].push(clone(validateSharedRecord(item.kind,item.record)));}
 base.publication={schemaVersion:1,destination:clone(receipt.review.destination),baselineDigest:receipt.review.baselineDigest,packageDigest:await digest(base)};return base;
}
