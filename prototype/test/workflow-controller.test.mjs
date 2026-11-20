import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readTransferRecord} from '../dist/transfer-storage.mjs';
import {createDemo} from '../dist/demo-transfer.mjs';

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
