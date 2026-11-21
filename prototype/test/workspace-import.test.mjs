import test from 'node:test';import assert from 'node:assert/strict';import {prepareWorkspaceImport} from '../dist/workspace-import.mjs';
test('slow file imports preserve edits made while reading or verifying',async()=>{
 for(const phase of ['reading','verifying']){let state={draft:'Original'},release;const pending=new Promise(resolve=>release=resolve);
 const file={size:2,text:async()=>{if(phase==='reading')await pending;return '{}';}};
 const operation=async original=>{if(phase==='verifying')await pending;return {...original,draft:'Imported'};};
 const job=prepareWorkspaceImport(()=>state,file,operation);state.draft='Latest edit';release();await assert.rejects(job,/workspace changed/);assert.equal(state.draft,'Latest edit');}
});
test('stable imports produce a separate result and failed parsing retains workspace',async()=>{const state={draft:'Original'},file={size:2,text:async()=>'{}'};const result=await prepareWorkspaceImport(()=>state,file,s=>({...s,draft:'Imported'}));assert.equal(result.draft,'Imported');assert.equal(state.draft,'Original');await assert.rejects(prepareWorkspaceImport(()=>state,{...file,text:async()=>'{bad'},s=>s));assert.equal(state.draft,'Original');});
