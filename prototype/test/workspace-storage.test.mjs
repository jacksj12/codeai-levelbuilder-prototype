import test from 'node:test';
import assert from 'node:assert/strict';
import {saveWorkspace} from '../dist/workspace-storage.mjs';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
test('concurrent workspace edits preserve both drafts in separate recoverable workspaces',()=>{
 const store=storage(),initial=saveWorkspace(store,'workspace',{title:'Original'},null);
 const other=saveWorkspace(store,'workspace',{title:'Other tab'},initial.value);
 const ours=saveWorkspace(store,'workspace',{title:'This tab'},initial.value,()=> 'recovered');
 assert.equal(ours.forked,true);assert.equal(store.getItem('workspace'),other.value);assert.equal(JSON.parse(store.getItem(ours.key)).title,'This tab');
 const again=saveWorkspace(store,ours.key,{title:'Continued'},ours.value);assert.equal(again.forked,false);assert.equal(store.getItem('workspace'),other.value);
});
test('same-content and sequential saves do not create redundant recovery workspaces',()=>{
 const store=storage(),first=saveWorkspace(store,'workspace',{a:1},null);
 assert.equal(saveWorkspace(store,'workspace',{a:1},null).forked,false);
 assert.equal(saveWorkspace(store,'workspace',{a:2},first.value).forked,false);
});
test('storage failure and recovery identity collision do not replace the other tab draft',()=>{
 const store=storage();store.setItem('workspace','other');store.setItem('lesson-studio-workspace-existing','retained');
 assert.throws(()=>saveWorkspace(store,'workspace',{a:1},null,()=> 'existing'),/already exists/);assert.equal(store.getItem('workspace'),'other');
 store.setItem=()=>{throw Error('Quota');};assert.throws(()=>saveWorkspace(store,'workspace',{a:1},null,()=> 'new'),/Quota/);assert.equal(store.getItem('workspace'),'other');
});
