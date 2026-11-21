import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {nativeEditorBridge} from '../dist/native-dom-adapter.mjs';
import {digest} from '../dist/transfer-core.mjs';

// Run the actual serialized extension function with a minimal editor DOM and
// fake HTTP responses. No browser, live request, or test-only production branch.
async function dispatch(response,{native=false,ambiguous=false,disabled=false,acknowledge=true,tamperTransport=false,delayed=false}={}){
 const destination={id:123,url:'https://levelbuilder-studio.code.org/lessons/123/edit'},saved={id:123,activities:[]},raw=JSON.stringify(saved);
 const names=['Title','Overview','Student Overview','Purpose','Preparation','Assessment Opportunities'];
 const labels=names.map(name=>({childNodes:[{nodeType:3,textContent:name}],querySelectorAll:()=>[{value:''}]}));
 const tables=[['Key','Name','Type','Audience','URL','Actions'],['Word','Definition','Actions']].map(headers=>({querySelector:s=>s==='thead'?{textContent:headers.join(' ')}:null,querySelectorAll:s=>s==='thead th'?headers.map(textContent=>({textContent})):[]}));
 const bootstrap={getAttribute:()=>raw};
 let clicks=0,notifyMutation=()=>{};
 const button={textContent:'Save and Keep Editing',disabled,getClientRects:()=>[{}],click:()=>{clicks++;if(acknowledge){const finish=()=>{document.body.textContent='Last saved at: synthetic saved time';button.disabled=false;notifyMutation();};if(delayed){button.disabled=true;setTimeout(finish,5);}else finish();}}};
 const document={body:{textContent:''},querySelector:s=>s==='script[data-lesson]'?bootstrap:s==='meta[name="csrf-token"]'?{content:'SYNTHETIC-SECRET'}:null,
  querySelectorAll:s=>s==='#edit-container button'?(ambiguous?[button,button]:[button]):s==='#edit-container label'?labels:s==='#edit-container table'?tables:s.includes('input[type="hidden"]')?[{value:'[]'}]:[]};
 let puts=0;
 const context=vm.createContext({document,location:new URL(destination.url),structuredClone,crypto,TextEncoder,MessageChannel,setTimeout,clearTimeout,MutationObserver:class{constructor(callback){notifyMutation=callback;}observe(){}disconnect(){notifyMutation=()=>{};}},DOMParser:class{parseFromString(){return {querySelector:()=>bootstrap};}},
  fetch:async(url,options)=>{if(options.method==='PUT'){puts++;return response;}return {ok:true,text:async()=>'<synthetic baseline>'};}});
 const bridge=vm.runInContext('('+nativeEditorBridge.toString()+')',context),base={destination,practiceConfirmed:true};
 const capture=await bridge({...base,action:'read'});assert.deepEqual(Array.from(capture.blockers),[]);
 const payload={originalLessonData:raw};for(const k of ['objectives','activities','resources','vocabularies','programmingExpressions','standards','opportunityStandards','jitPlConceptIds','announcements'])payload[k]='[]';
 const request={method:'PUT',url:'https://levelbuilder-studio.code.org/lessons/123',contentType:'application/json;charset=UTF-8',body:JSON.stringify(payload)};
 const review={kind:'native-save-review',...(native?{transport:'native-editor'}:{}),destination,expiresAt:Date.now()+60000,baselineDigest:await digest(saved),request};review.id=await digest(review);
 const semantic=Object.fromEntries(Object.entries(payload).map(([k,v])=>[k,JSON.parse(v)]));
 const approval={approved:true,approvedRequestDigest:await digest({method:request.method,url:request.url,contentType:request.contentType,payload:semantic,...(native?{transport:tamperTransport?'direct-api':'native-editor'}:{})})};
 let result;try{result=await bridge({...base,deadlineAt:Date.now()+100,action:'save-approved-review',mode:'explicit-approved-save',review,approval,expectedCaptureDigest:await digest(capture)});}catch(error){assert.equal(clicks,0);assert.equal(puts,0);throw error;}
 assert.equal(puts,native?0:1);if(native)assert.equal(clicks,1);return JSON.parse(JSON.stringify(result));
}
const json=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
test('serialized save bridge retains only allowlisted response identities and counts',async()=>{
 const result=await dispatch(json({id:123,secret:'DO-NOT-RETAIN',activities:[{id:1,activitySections:[{id:2,description:'PRIVATE',scriptLevels:[{id:3,assessment:true,levels:[{id:'4',name:'PRIVATE'}]}]}]}]}));
 assert.equal(result.responseSummary.lessonId,123);assert.equal(result.responseSummary.levelAssociations,1);
 assert.deepEqual(result.responseSummary.associations,[{sectionId:2,associationId:3,levelIds:[4],assessment:true}]);
 assert.doesNotMatch(JSON.stringify(result),/PRIVATE|DO-NOT-RETAIN|SYNTHETIC-SECRET/);
});
test('unexpected HTML, malformed JSON and invalid record shapes retain HTTP success without inventing lesson evidence',async()=>{
 for(const [response,kind] of [[new Response('<html>secret</html>'),'unexpected-response'],[new Response('{',{headers:{'Content-Type':'application/json'}}),'unreadable-json'],[json({id:true,activities:[]}),'unexpected-json'],[json({id:123,activities:[null]}),'unexpected-json'],[json({id:123,activities:[{activitySections:[{scriptLevels:[{levels:'bad'}]}]}]}),'unexpected-json']]){
  const result=await dispatch(response);assert.equal(result.httpStatus,200);assert.equal(result.outcome,'response-received');assert.deepEqual(result.responseSummary,{kind});
 }
});
test('response summaries bound association lists and disclose truncation',async()=>{
 const links=Array.from({length:205},(_,i)=>({id:i+1,assessment:false,levels:[{id:42}]}));
 const result=await dispatch(json({id:123,activities:[{activitySections:[{id:2,scriptLevels:links}]}]}));
 assert.equal(result.responseSummary.levelAssociations,205);assert.equal(result.responseSummary.associations.length,200);assert.equal(result.responseSummary.truncated,true);
});
test('rejected server response excludes authentication lines and never reports success',async()=>{
 const result=await dispatch(new Response('Conflict detected\nsession=secret',{status:409,headers:{'Content-Type':'text/plain'}}));
 assert.equal(result.outcome,'rejected');assert.equal(result.errorMessage,'Conflict detected');assert.equal(result.responseSummary,undefined);
});

test('native save invokes the exact editor control once with no companion PUT',async()=>{
 const result=await dispatch(null,{native:true});assert.equal(result.transport,'native-editor');assert.equal(result.outcome,'native-editor-acknowledged');assert.equal(result.saveRetried,false);
});
test('native save timeout retains an unknown attempt and never falls back to direct API',async()=>{
 const result=await dispatch(null,{native:true,acknowledge:false});assert.equal(result.outcome,'unknown');assert.equal(result.attempted,true);
});
test('ambiguous, disabled and changed-transport native approvals block before any save click',async()=>{
 for(const options of [{ambiguous:true},{disabled:true},{tamperTransport:true}])await assert.rejects(dispatch(null,{native:true,...options}),/unavailable|ambiguous|approved/);
});

test('native save observes asynchronous editor acknowledgement without sending an API fallback',async()=>{
 const result=await dispatch(null,{native:true,delayed:true});assert.equal(result.outcome,'native-editor-acknowledged');assert.equal(result.saveRetried,false);
});
