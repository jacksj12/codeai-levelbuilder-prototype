import test from 'node:test';import assert from 'node:assert/strict';import {readTransferRecord,writeTransferRecord} from '../dist/transfer-storage.mjs';
test('retained transfer evidence round-trips',()=>{const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};assert.equal(readTransferRecord(storage,'run'),null);const record={mode:'demo',receipt:{attempted:true}};writeTransferRecord(storage,'run',record);assert.deepEqual(readTransferRecord(storage,'run'),record);});
test('malformed retained records are untouched and fail closed',()=>{for(const raw of ['broken','null','[]','42']){let writes=0;assert.throws(()=>readTransferRecord({getItem:()=>raw,setItem:()=>writes++},'run'),/left untouched/);assert.equal(writes,0);}});
test('blocked reads and failed receipt writes explain recovery',()=>{assert.throws(()=>readTransferRecord({getItem(){throw Error('denied');}},'run'),/do not clear browser data/);assert.throws(()=>writeTransferRecord({setItem(){throw Error('quota');}},'receipt',{attempted:true}),/Do not clear browser data or start another save/);});

import {encodeTransferRecord,decodeTransferRecord} from '../dist/transfer-storage.mjs';
test('compact evidence round-trips and keeps repeated snapshots independently editable',()=>{
 const snapshot={body:'long teaching content '.repeat(100),records:[{id:1,name:'Original'}]};const state={before:structuredClone(snapshot),after:structuredClone(snapshot),other:[null,true,0,'']};
 const encoded=encodeTransferRecord(state),decoded=decodeTransferRecord(encoded);assert.deepEqual(decoded,state);assert.ok(encoded.length<JSON.stringify(state).length*.65);decoded.after.records[0].name='Changed';assert.equal(decoded.before.records[0].name,'Original');assert.deepEqual(decodeTransferRecord(JSON.stringify(state)),state);
});
test('compact evidence refuses circular references and retains special keys safely',()=>{
 assert.throws(()=>decodeTransferRecord('lesson-evidence-v1:'+JSON.stringify({nodes:[{a:[{r:0}]}],root:{r:0}})),/reference/);
 const original=JSON.parse('{"__proto__":{"polluted":true},"constructor":"value"}'),decoded=decodeTransferRecord(encodeTransferRecord(original));assert.deepEqual(decoded,original);assert.equal({}.polluted,undefined);
});
