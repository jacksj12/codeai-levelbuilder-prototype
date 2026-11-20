import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

test('extension and demo entry points ship their local dependency graph with an unarmed manifest',()=>{
 const root=fileURLToPath(new URL('../',import.meta.url)),manifest=JSON.parse(readFileSync(path.join(root,'manifest.json'),'utf8'));
 assert.equal(manifest.manifest_version,3);assert.match(manifest.version,/^\d+\.\d+\.\d+$/);
 assert.deepEqual(manifest.permissions,['activeTab','scripting']);assert.equal(manifest.host_permissions,undefined);
 const revision=JSON.parse(readFileSync(path.join(root,'browser-fill/automation-revision.json'),'utf8')).revision;
 assert.match(revision,/^verification-release-/,'The distributed extension must not arm a personal save job.');
 // Historical opt-in modes require private ignored evidence, deliberately absent
 // from the clone. They are not dependencies of the distributed default mode.
 const privateFiles=new Set(['browser-fill/accepted-rehearsal.json','browser-fill/local-save-job.json']);
 const seen=new Set(),queue=[manifest.action.default_popup,'dist/workflow.html'];
 const enqueue=(owner,ref,base=path.dirname(owner))=>{
  if(!ref||/^(?:[a-z]+:|#|\/)/i.test(ref))return;
  const resolved=path.resolve(root,base,ref.split(/[?#]/)[0]),relative=path.relative(root,resolved).replaceAll('\\','/');
  assert.ok(!relative.startsWith('../'),owner+' escapes package root: '+ref);
  if(!privateFiles.has(relative))queue.push(relative);
 };
 while(queue.length){
  const file=queue.shift();if(seen.has(file))continue;seen.add(file);
  assert.ok(statSync(path.join(root,file),{throwIfNoEntry:false})?.isFile(),'Missing packaged dependency: '+file);
  const text=readFileSync(path.join(root,file),'utf8');
  if(file.endsWith('.html'))for(const match of text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g))enqueue(file,match[1]);
  if(file.endsWith('.mjs')){
   for(const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)["'](\.{1,2}\/[^"']+)["']/g))enqueue(file,match[1]);
   for(const match of text.matchAll(/chrome\.runtime\.getURL\(\s*["']([^"']+)["']/g))enqueue(file,match[1],'.');
  }
 }
 assert.ok(seen.has('browser-fill/workflow.html'));assert.ok(seen.has('browser-fill/verification.html'));
 assert.ok(seen.has('dist/workflow-app.mjs'));assert.ok(seen.has('api-companion/read-lesson.mjs'));
 assert.ok(statSync(path.join(root,'dist/fixture.json')).isFile());
});
