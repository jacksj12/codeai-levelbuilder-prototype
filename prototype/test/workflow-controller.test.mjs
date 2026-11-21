import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readTransferRecord} from '../dist/transfer-storage.mjs';
import {createDemo} from '../dist/demo-transfer.mjs';
import vm from 'node:vm';

// Exercise the real screen handlers with a minimal DOM. These are controller
// checks, not browser rendering or authenticated native acceptance.
function screen(storage,run,overrides={}){
 const elements=new Map(),downloads=[],timers=[];
 const node=()=>({disabled:false,hidden:false,checked:false,textContent:'',children:[],
  classList:{toggle(){}},setAttribute(){},removeAttribute(){},append(n){this.children.push(n);},replaceChildren(){this.children=[];},
  click(){if(this.download)downloads.push(this.download);},parentElement:{lastChild:{textContent:''}}});
 const get=id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id);};
 const values={document:{getElementById:get,createElement:node,querySelectorAll:()=>[...elements.values()],addEventListener(){},hidden:false},
  location:new URL('http://127.0.0.1/workflow.html?run='+run),history:{replaceState(){}},localStorage:storage,
  navigator:{locks:{request:async(name,options,action)=>action({name})}},
  fetch:async()=>({json:async()=>JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)))}),
  setInterval:fn=>timers.push(fn),...overrides};
 const previous=new Map(Object.keys(values).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const [k,v]of Object.entries(values))Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});
 return {get,downloads,timers,restore(){for(const [k,v]of previous)if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}};
}
let serial=0;
async function load(storage,run,overrides){const ui=screen(storage,run,overrides);try{await import('../dist/workflow-app.mjs?controller-test='+ ++serial);return ui;}catch(error){ui.restore();throw error;}}
function storage(){const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}

test('broader screen demo prepares, saves once, reloads and rechecks without resend',async()=>{
 const store=storage(),run='controller-complete',key='reviewed-transfer-session-'+run;
 let ui=await load(store,run);
 try{
  await ui.get('load-structure-demo').onclick();await ui.get('prepare').onclick();
  let state=readTransferRecord(store,key);assert.equal(state.job.review.activityAdditions.length,2);assert.equal(state.checkpoint.stage.restored,true);assert.equal(state.demo.sendCount,0);
  ui.get('approve').checked=true;ui.get('approve').onchange();assert.equal(ui.get('save').disabled,false);
  await ui.get('save').onclick();state=readTransferRecord(store,key);
  assert.equal(state.receipt.status,'saved-and-verified');assert.equal(state.demo.sendCount,1);assert.equal(state.automaticRecheck,true);assert.ok(state.cleanupReview);assert.ok(ui.downloads.length);
 }finally{ui.restore();}
 ui=await load(store,run);
 try{await ui.get('check').onclick();const state=readTransferRecord(store,key);assert.equal(state.receipt.status,'saved-and-verified');assert.equal(state.demo.sendCount,1);assert.equal(ui.get('save').disabled,true);}finally{ui.restore();}
});

test('storage failure is reported, preserves an export and pauses every write control',async()=>{
 const store=storage(),ui=await load(store,'controller-storage');
 try{
  await ui.get('load-demo').onclick();await ui.get('prepare').onclick();
  store.setItem=()=>{throw Error('quota');};ui.get('approve').checked=true;
  await assert.doesNotReject(ui.get('save').onclick());
  assert.match(ui.get('status').textContent,/evidence could not be saved/);
  for(const id of ['save','prepare','save-cleanup','prepare-cleanup','new-demo'])assert.equal(ui.get(id).disabled,true,id);
  assert.equal(ui.get('download').disabled,false);assert.ok(ui.downloads.length);
  for(const tick of ui.timers)tick();assert.equal(ui.get('save').disabled,true);
  const before=ui.downloads.length;ui.get('download').onclick();assert.equal(ui.downloads.length,before+1);
  const state=readTransferRecord(store,'reviewed-transfer-session-controller-storage');assert.equal(state.demo.sendCount,0);
 }finally{ui.restore();}
});

test('failed durable attempt storage retains the in-memory attempt and never dispatches',async()=>{
 const store=storage(),run='controller-receipt',ui=await load(store,run),write=store.setItem;
 try{
  await ui.get('load-demo').onclick();await ui.get('prepare').onclick();
  store.setItem=(key,value)=>{if(key.includes('-receipt-'))throw Error('quota');write(key,value);};
  ui.get('approve').checked=true;await ui.get('save').onclick();
  const state=readTransferRecord(store,'reviewed-transfer-session-'+run);
  assert.equal(state.receipt.attempted,true);assert.equal(state.demo.sendCount,0);
  assert.match(ui.get('status').textContent,/evidence could not be saved/);assert.equal(ui.get('save').disabled,true);assert.ok(ui.downloads.length);
  await ui.get('save').onclick();assert.equal(readTransferRecord(store,'reviewed-transfer-session-'+run).demo.sendCount,0);
 }finally{ui.restore();}
});

test('storage failure after dispatch can reload and verify the durable attempt without resending',async()=>{
 const store=storage(),run='controller-after-dispatch',write=store.setItem;let receiptWrites=0,ui=await load(store,run);
 try{
  await ui.get('load-demo').onclick();await ui.get('prepare').onclick();
  store.setItem=(key,value)=>{if(key.includes('-receipt-')&&++receiptWrites===2)throw Error('quota after dispatch');write(key,value);};
  ui.get('approve').checked=true;await ui.get('save').onclick();
  const state=readTransferRecord(store,'reviewed-transfer-session-'+run);
  assert.equal(state.demo.sendCount,1);assert.equal(state.receipt.attempted,true);
  assert.match(ui.get('status').textContent,/evidence could not be saved/);assert.equal(ui.get('save').disabled,true);
 }finally{ui.restore();store.setItem=write;}
 ui=await load(store,run);
 try{
  await ui.get('check').onclick();const state=readTransferRecord(store,'reviewed-transfer-session-'+run);
  assert.equal(state.receipt.status,'saved-and-verified');assert.equal(state.demo.sendCount,1);assert.equal(ui.get('save').disabled,true);
 }finally{ui.restore();}
});

test('selected native baseline export needs no package and performs only confirmed exact-tab reads',async()=>{
 const store=storage(),run='native-baseline',destination={id:8898984,url:'https://levelbuilder-studio.code.org/lessons/8898984/edit'};
 const demo=createDemo(JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url))));
 demo.server.id=destination.id;demo.editor.saved.id=destination.id;demo.editor.destination=destination;demo.editor.protection.bootstrap.id=destination.id;
 const calls=[];let currentURL=destination.url;
 const ui=await load(store,run,{location:new URL('chrome-extension://test/browser-fill/workflow.html?run='+run+'#33'),chrome:{
  runtime:{getManifest:()=>({version:'0.10.5'})},
  tabs:{get:async id=>{assert.equal(id,33);return {id,url:currentURL,discarded:false};}},
  scripting:{executeScript:async({target,func,args})=>{
   assert.equal(target.tabId,33);const request=JSON.parse(args[0]);calls.push(request);
   assert.equal(request.action,'read');assert.deepEqual(request.destination,destination);assert.equal(request.practiceConfirmed,true);
   return [{result:structuredClone(func.name==='readAssignedLesson'?{lesson:demo.server,originalLessonJson:JSON.stringify(demo.server)}:demo.editor)}];
  }}
 }});
 try{
  await ui.get('read-baseline').onclick();assert.equal(calls.length,0);assert.match(ui.get('status').textContent,/Confirm/);
  ui.get('practice').checked=true;await ui.get('read-baseline').onclick();assert.equal(calls.length,2);
  const state=readTransferRecord(store,'reviewed-transfer-session-'+run);
  assert.equal(state.pkg,undefined);assert.equal(state.job,undefined);assert.equal(state.receipt,undefined);
  assert.equal(state.checkpoint.stagingStarted,false);assert.equal(state.checkpoint.freshSaved.id,8898984);assert.ok(ui.downloads.length);
  assert.match(ui.get('status').textContent,/No staging or save/);
  currentURL='https://levelbuilder-studio.code.org/lessons/8898985/edit';await ui.get('read-baseline').onclick();assert.equal(calls.length,2);assert.match(ui.get('status').textContent,/moved/);
 }finally{ui.restore();}
});

test('real serialized saved-reader errors remain visible beside baseline control and export without a capture',async()=>{
 const store=storage(),run='native-reader-error',editorURL='https://levelbuilder-studio.code.org/lessons/8898984/edit';
 let injections=0,release;
 const waiting=new Promise(resolve=>{release=resolve;});
 const ui=await load(store,run,{location:new URL('chrome-extension://test/browser-fill/workflow.html?run='+run+'#33'),chrome:{
  runtime:{getManifest:()=>({version:'0.10.5'})},tabs:{get:async()=>({id:33,url:editorURL,discarded:false})},
  scripting:{executeScript:async({func,args})=>{
   injections++;assert.equal(func.name,'readAssignedLesson');assert.equal(JSON.parse(args[0]).action,'read');
   await waiting;
   const result=await vm.runInNewContext('('+func.toString()+')(request)',{request:args[0],location:new URL(editorURL),
    fetch:async(url,options)=>{assert.equal(url,'/lessons/8898984/edit');assert.equal(options.method,'GET');return {ok:false,status:403};}});
   return [{result}];
  }}
 }});
 try{
  assert.match(ui.get('baseline-status').textContent,/0.10.5/);ui.get('practice').checked=true;
  const pending=ui.get('read-baseline').onclick();
  assert.match(ui.get('baseline-status').textContent,/Checking practice/);assert.equal(ui.get('read-baseline').textContent,'Reading baseline…');
  release();await pending;
  assert.equal(injections,1);assert.match(ui.get('baseline-status').textContent,/sign-in and permissions/);
  assert.equal(ui.get('read-baseline').disabled,false);assert.equal(ui.get('download-baseline').disabled,false);assert.ok(ui.downloads.length);
  const state=readTransferRecord(store,'reviewed-transfer-session-'+run);
  assert.equal(state.pkg,undefined);assert.equal(state.job,undefined);assert.equal(state.receipt,undefined);assert.equal(state.checkpoint,undefined);
  assert.match(state.preparationError,/sign-in/);assert.equal(state.destination.id,8898984);
 }finally{release();ui.restore();}
});

test('HTTP 200 failure screen retains exact evidence across reload and never resends or offers cleanup',async()=>{
 const store=storage(),run='controller-unchanged',key='reviewed-transfer-session-'+run;
 let ui=await load(store,run);
 try{
  await ui.get('load-failure-demo').onclick();await ui.get('prepare').onclick();
  ui.get('approve').checked=true;await ui.get('save').onclick();
  const state=readTransferRecord(store,key);assert.equal(state.receipt.status,'save-not-confirmed');assert.equal(state.receipt.verification.baselineUnchanged,true);assert.equal(state.demo.sendCount,1);assert.equal(state.cleanupReview,undefined);assert.ok(ui.downloads.length);
  assert.match(ui.get('report').children.map(n=>n.textContent).join(' '),/proposed changes are not present/);
  assert.equal(ui.get('save').disabled,true);assert.equal(ui.get('prepare-cleanup').disabled,true);
 }finally{ui.restore();}
 ui=await load(store,run);
 try{for(let i=0;i<3;i++)await ui.get('check').onclick();const state=readTransferRecord(store,key);assert.equal(state.demo.sendCount,1);assert.equal(state.receipt.status,'save-not-confirmed');assert.equal(state.receipt.saveRetried,false);assert.equal(ui.get('save').disabled,true);}finally{ui.restore();}
});


// Native companion controller checks use a simulated browser boundary. No live requests.
function sharedScreenHarness(store,run,{uncertain=false}={}){
 const demo=createDemo({title:'Shared controller fixture',objectives:['Explain evidence'],resources:[],slides:[{id:'a',number:1,notes:'Activity (5 minutes)'},{id:'s',number:2,notes:'Discuss evidence'}]});
 demo.pkg.lesson.resources=[{key:'guide',name:'Evidence guide',type:'Handout',audience:'Student',url:'https://example.org/guide'}];
 demo.pkg.lesson.frontMatter.vocabulary=[{word:'Evidence',definition:'Support for a claim.'}];demo.pkg.baseline=structuredClone(demo.pkg.lesson);
 const destination=demo.destination,catalog={resources:[],vocabularies:[]},calls=[];let posts=0;
 const key='reviewed-transfer-session-'+run;
 store.setItem(key,JSON.stringify({mode:'native',tabId:33,pkg:demo.pkg,destination,practiceConfirmed:true}));
 const overrides={location:new URL('chrome-extension://test/browser-fill/workflow.html?run='+run+'#33'),chrome:{
  runtime:{getManifest:()=>({version:'0.15.1'})},tabs:{get:async()=>({id:33,url:destination.url,discarded:false})},
  scripting:{executeScript:async({func,args})=>{
   const request=JSON.parse(args[0]);calls.push({bridge:func.name,action:request.action});let result;
   if(func.name==='sharedRecordBridge'){
    if(request.action==='context')result={destination,courseVersionId:77,saved:structuredClone(demo.server)};
    else if(request.action==='search')result=structuredClone(catalog[request.kind]);
    else if(request.action==='create'){
     assert.equal(request.approval.reviewId,request.review.id);assert.equal(request.approval.approved,true);posts++;
     if(uncertain)result={outcome:'unknown'};
     else {const record={id:800+posts,key:request.item.kind+'-'+posts,markdownKey:'record-'+posts+'/course/version',...structuredClone(request.item.intent),...(request.item.kind==='resources'?{isRollup:false}:{})};catalog[request.item.kind].push(record);result={outcome:'response-received',record};}
    }else throw Error('Unexpected shared action '+request.action);
   }else if(func.name==='readAssignedLesson')result={lesson:structuredClone(demo.server),originalLessonJson:JSON.stringify(demo.server)};
   else {assert.equal(request.action,'read');result=structuredClone(demo.editor);}
   return [{result}];
  }}
 }};
 return {demo,catalog,calls,key,overrides,get posts(){return posts;},load:()=>load(store,run,overrides)};
}

test('shared screen requires exact approval, retains creation across reload and rechecks without POST or lesson save',async()=>{
 const store=storage(),h=sharedScreenHarness(store,'shared-complete');let ui=await h.load();
 try{
  await ui.get('prepare-shared').onclick();assert.equal(ui.get('shared-panel').hidden,false);assert.equal(ui.get('create-shared').disabled,true);
  await ui.get('create-shared').onclick();assert.equal(h.posts,0);assert.match(ui.get('status').textContent,/approve/);
  const detail=ui.get('shared-review').children[2];detail.open=true;
  ui.get('approve-shared').checked=true;ui.get('approve-shared').onchange();assert.equal(ui.get('create-shared').disabled,false);
  for(const tick of ui.timers)tick();assert.equal(ui.get('shared-review').children[2],detail);assert.equal(detail.open,true);
  await ui.get('create-shared').onclick();assert.equal(h.posts,2);assert.equal(readTransferRecord(store,h.key).sharedReceipt.status,'shared-records-verified');assert.equal(ui.get('continue-shared').disabled,false);
  await ui.get('create-shared').onclick();assert.equal(h.posts,2);
 }finally{ui.restore();}
 ui=await h.load();
 try{assert.equal(ui.get('create-shared').disabled,true);await ui.get('check-shared').onclick();assert.equal(h.posts,2);assert.equal(ui.get('continue-shared').disabled,false);assert.ok(h.calls.every(c=>c.bridge==='sharedRecordBridge'||c.action==='read'));}finally{ui.restore();}
});

test('uncertain shared creation survives reload and read-only checks never create remaining records',async()=>{
 const store=storage(),h=sharedScreenHarness(store,'shared-uncertain',{uncertain:true});let ui=await h.load();
 try{await ui.get('prepare-shared').onclick();ui.get('approve-shared').checked=true;await ui.get('create-shared').onclick();assert.equal(h.posts,1);assert.equal(readTransferRecord(store,h.key).sharedReceipt.status,'creation-not-confirmed');assert.equal(ui.get('continue-shared').disabled,true);}finally{ui.restore();}
 ui=await h.load();
 try{for(let i=0;i<2;i++)await ui.get('check-shared').onclick();assert.equal(h.posts,1);assert.equal(ui.get('continue-shared').disabled,true);await ui.get('prepare-shared').onclick();ui.get('approve-shared').checked=true;await ui.get('create-shared').onclick();assert.equal(h.posts,1);}finally{ui.restore();}
});

test('replacing a package clears shared review and approval, retaining durable creation evidence',async()=>{
 const store=storage(),h=sharedScreenHarness(store,'shared-replace'),ui=await h.load();
 try{
  await ui.get('prepare-shared').onclick();ui.get('approve-shared').checked=true;await ui.get('create-shared').onclick();
  const retained=[...store.data.keys()].filter(k=>k.startsWith('native-shared-record-'));assert.equal(retained.length,2);
  ui.get('practice').checked=false;const pkg=structuredClone(h.demo.pkg);pkg.lesson.title='Replacement';pkg.baseline=structuredClone(pkg.lesson);
  ui.get('package-file').files=[{name:'replacement.json',size:100,text:async()=>JSON.stringify(pkg)}];await ui.get('package-file').onchange();
  const state=readTransferRecord(store,h.key);assert.equal(state.sharedReview,undefined);assert.equal(state.sharedApproval,undefined);assert.equal(state.sharedReceipt,undefined);assert.equal(ui.get('approve-shared').checked,false);
  for(const key of retained)assert.ok(store.data.has(key));await ui.get('create-shared').onclick();assert.equal(h.posts,2);
 }finally{ui.restore();}
});

test('shared controller refuses stale baselines and failed durable storage before creating',async()=>{
 for(const mode of ['baseline','storage']){
  const store=storage(),h=sharedScreenHarness(store,'shared-block-'+mode),ui=await h.load();
  try{await ui.get('prepare-shared').onclick();ui.get('approve-shared').checked=true;
   if(mode==='baseline')h.demo.server.overview='Outside saved change';
   else {const write=store.setItem;store.setItem=(key,value)=>{if(key.startsWith('native-shared-record-'))throw Error('quota');write(key,value);};}
   await ui.get('create-shared').onclick();assert.equal(h.posts,0);assert.match(ui.get('status').textContent,mode==='baseline'?/older saved baseline/:/evidence could not be saved/);
   if(mode==='storage'){assert.equal(ui.get('create-shared').disabled,true);assert.equal(ui.get('download').disabled,false);}
  }finally{ui.restore();}
 }
});


test('verified saves retire stale preparation and recovery labels while retaining history; uncertain saves keep recovery',async()=>{
 for(const verified of [true,false]){
  const store=storage(),run='verified-status-'+verified,key='reviewed-transfer-session-'+run;let ui=await load(store,run);
  try{
   await ui.get(verified?'load-demo':'load-failure-demo').onclick();await ui.get('prepare').onclick();
   const staged=readTransferRecord(store,key);staged.preparationError='Historical missing-record comparison';staged.needsRecovery=true;store.setItem(key,JSON.stringify(staged));
  }finally{ui.restore();}
  ui=await load(store,run);
  try{
   ui.get('approve').checked=true;await ui.get('save').onclick();const saved=readTransferRecord(store,key);
   assert.equal(saved.receipt.status,verified?'saved-and-verified':'save-not-confirmed');
   if(verified){assert.equal(saved.needsRecovery,false);assert.equal(saved.preparationError,undefined);assert.equal(saved.resolvedPreparationErrors[0].message,'Historical missing-record comparison');assert.equal(saved.resolvedPreparationErrors[0].resolvedByRequestDigest,saved.receipt.requestDigest);}
   else {assert.equal(saved.needsRecovery,true);assert.equal(saved.preparationError,'Historical missing-record comparison');}
   // Older successful reports also normalize on reload without dispatching again.
   saved.needsRecovery=true;saved.preparationError='Older retained label';store.setItem(key,JSON.stringify(saved));
  }finally{ui.restore();}
  ui=await load(store,run);
  try{await ui.get('check').onclick();const checked=readTransferRecord(store,key);assert.equal(checked.demo.sendCount,1);assert.equal(checked.needsRecovery,!verified);assert.equal(checked.preparationError,verified?undefined:'Older retained label');if(verified){assert.equal(checked.resolvedPreparationErrors.length,2);checked.cleanupReceipt={attempted:true,status:'save-not-confirmed'};checked.needsRecovery=true;store.setItem(key,JSON.stringify(checked));}}finally{ui.restore();}
  if(verified){ui=await load(store,run);try{await ui.get('prepare-shared').onclick();assert.equal(readTransferRecord(store,key).needsRecovery,true,'A historical successful transfer must not clear later cleanup recovery');}finally{ui.restore();}}
 }
});
