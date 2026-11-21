import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {sharedRecordBridge} from '../dist/shared-record-bridge.mjs';
import {sharedIntent} from '../dist/shared-records.mjs';import {digest} from '../dist/transfer-core.mjs';
const destination={id:123,url:'https://levelbuilder-studio.code.org/lessons/123/edit'};
async function harness(kind='resources',markup='native'){
 const saved={id:123,name:'Preserve all content',activities:[]},intent=sharedIntent(kind,kind==='resources'?{name:'Evidence guide',type:'Handout',audience:'Student',url:'https://example.org/guide'}:{word:'Evidence',definition:'Support for a claim.'});
 const item={kind,intent,action:'create',record:null,key:await digest({kind,courseVersionId:77,intent})};const review={kind:'shared-record-review',schemaVersion:1,destination,courseVersionId:77,baselineDigest:await digest(saved),items:[item],expiresAt:Date.now()+10000};review.id=await digest(review);
 const calls=[],record={id:800,key:'evidence',markdownKey:'evidence/course/version',...intent,...(kind==='resources'?{isRollup:false}:{})};let fresh=structuredClone(saved),course=77,rows=[record];
 // Match deployed HTML: Haml unitForLesson becomes data-unitforlesson.
 const script=(value,scope)=>({getAttribute:k=>k==='data-lesson'?JSON.stringify(value):k==='data-unitforlesson'?(markup==='malformed'?'{':JSON.stringify(markup==='null'?null:{courseVersionId:scope})):null});
 const page=(value,scope)=>({querySelector:s=>s==='script[data-lesson][data-unitforlesson]'&&markup!=='missing'&&markup!=='kebab-only'?script(value,scope):s==='meta[name="csrf-token"]'?{content:'LOCAL-SECRET'}:null});
 const document=page(saved,77);
 const context=vm.createContext({document,location:new URL(destination.url),structuredClone,crypto,TextEncoder,URL,URLSearchParams,DOMParser:class{parseFromString(){return page(fresh,course);}},fetch:async(url,options)=>{calls.push({url,options});return {ok:true,status:200,text:async()=>'<fresh>',json:async()=>url.includes('/search?')?rows:record};}});
 const bridge=vm.runInContext('('+sharedRecordBridge.toString()+')',context),base={destination,practiceConfirmed:true};
 return {calls,record,review,item,call:request=>bridge({...base,...request}),create:()=>bridge({...base,action:'create',mode:'explicit-approved-shared-create',review,item,approval:{reviewId:review.id,approved:true}}),set fresh(v){fresh=v;},set course(v){course=v;},set rows(v){rows=v;}};
}
test('serialized shared-record bridge uses exact course scope, POST encoding and no lesson write',async()=>{for(const kind of ['resources','vocabularies']){const h=await harness(kind),context=await h.call({action:'context'});assert.equal(context.courseVersionId,77);const rows=await h.call({action:'search',kind,query:'Evidence',courseVersionId:77});assert.equal(rows[0].id,800);const result=await h.create();assert.equal(result.record.id,800);assert.doesNotMatch(JSON.stringify(result),/LOCAL-SECRET/);const posts=h.calls.filter(c=>c.options.method==='POST');assert.equal(posts.length,1);assert.equal(posts[0].url,'/'+kind);const payload=kind==='resources'?Object.fromEntries(new URLSearchParams(posts[0].options.body)):JSON.parse(posts[0].options.body);assert.equal(String(payload.courseVersionId),'77');if(kind==='resources')assert.equal(payload.includeInPdf,'false');assert.ok(h.calls.every(c=>!['DELETE','PATCH','PUT'].includes(c.options.method)));}});
test('serialized shared creation refuses changed baseline, scope, approval and expired reviews before POST',async()=>{for(const mode of ['baseline','scope','approval','expiry']){const h=await harness();if(mode==='baseline')h.fresh={id:123,name:'Outside changes'};if(mode==='scope')h.course=88;if(mode==='approval')h.review.id='changed';if(mode==='expiry'){h.review.expiresAt=1;const copy=structuredClone(h.review);delete copy.id;h.review.id=await digest(copy);}await assert.rejects(h.create());assert.equal(h.calls.filter(c=>c.options.method==='POST').length,0);}});
test('shared bridge refuses destructive actions, wrong scopes and truncated searches',async()=>{const h=await harness();for(const action of ['delete','patch','save'])await assert.rejects(h.call({action,kind:'vocabularies'}),/unavailable/);await assert.rejects(h.call({action:'search',kind:'resources',query:'Evidence',courseVersionId:88}),/scope/);h.rows=Array(40).fill(h.record);await assert.rejects(h.call({action:'search',kind:'resources',query:'Evidence',courseVersionId:77}),/incomplete/);assert.equal(h.calls.filter(c=>c.options.method).length,0);});

test('deployed course scope requires the exact native attribute and rejects missing or malformed evidence before any request',async()=>{
 for(const markup of ['missing','kebab-only','malformed','null']){
  const h=await harness('resources',markup);await assert.rejects(h.call({action:'context'}));await assert.rejects(h.create());assert.equal(h.calls.length,0);
 }
});
