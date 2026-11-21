import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeTransport} from '../browser-fill/native-transport.mjs';
import {prepareNativeTarget,verificationDestination} from '../browser-fill/native-target.mjs';

test('native transport preserves nullable fields and gives each injection a deadline',async()=>{
 let received;
 const transport=createNativeTransport(async encoded=>{received=JSON.parse(encoded);return {kind:'capture'};});
 await transport({action:'set-scalar',operation:{before:null,after:null}});
 assert.equal(received.operation.before,null);assert.equal(received.operation.after,null);
 assert.equal(received.transportErrors,true);assert.ok(received.deadlineAt>Date.now());
});

test('native transport timeout pauses later writes while retaining read-only recovery',async()=>{
 let requests=0;
 const transport=createNativeTransport(async encoded=>{requests++;return JSON.parse(encoded).action==='read'?{kind:'capture'}:new Promise(()=>{});},{timeoutMs:5});
 await assert.rejects(transport({action:'set-scalar'}),/timed out/);
 await assert.rejects(transport({action:'set-scalar'}),/writes are paused/);
 assert.deepEqual(await transport({action:'read'}),{kind:'capture'});assert.equal(requests,2);
});

test('native transport reports the injected error and its diagnostic capture',async()=>{
 const transport=createNativeTransport(async()=>({nativeBridgeError:'Native guard blocked',diagnosticCapture:{kind:'capture'}}));
 await assert.rejects(transport({action:'read'}),error=>error.message==='Native guard blocked'&&error.nativeCapture.kind==='capture');
});

test('automatic target activation refuses unknown and discarded tabs',async()=>{
 let updates=0;const tabs={get:async()=>({url:'https://example.com'}),update:async()=>{updates++;}};
 await assert.rejects(prepareNativeTarget(tabs,1),/no longer the assigned/);assert.equal(updates,0);
 tabs.get=async()=>({url:'https://levelbuilder-studio.code.org/s/scottsdale-levelbuilder-exploration/lessons/11/edit',discarded:true});
 await assert.rejects(prepareNativeTarget(tabs,1),/discarded/);assert.equal(updates,0);
});

test('automatic target activation selects only the assigned existing editor without reloading',async()=>{
 let change;const tabs={get:async()=>({url:'https://levelbuilder-studio.code.org/lessons/8898985/edit',frozen:true,discarded:false}),update:async(id,options)=>{change={id,options};}};
 const state=await prepareNativeTarget(tabs,42);assert.equal(state.frozen,true);assert.deepEqual(change,{id:42,options:{active:true}});
});

test('automatic verification accepts the current owned playground without expanding to official lessons',async()=>{
 const url='https://levelbuilder-studio.code.org/lessons/8898984/edit';assert.deepEqual(verificationDestination(url),{id:8898984,url});
 for(const value of ['https://levelbuilder-studio.code.org/lessons/123/edit',url+'?other=1','https://example.com/lessons/8898984/edit'])assert.equal(verificationDestination(value),null);
 let activated=false;await prepareNativeTarget({get:async()=>({url}),update:async()=>{activated=true;}},1);assert.equal(activated,true);
});
