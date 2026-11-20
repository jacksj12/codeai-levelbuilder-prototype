import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generate,reconcile,exportMarkdown} from '../dist/core.mjs';
import {CALLOUT_TYPES,addCallout} from '../dist/editing.mjs';
import {SLIDE_MARKER,insertMarkdown,addLevel,addCodeDoc,addResource,addImage} from '../dist/insertions.mjs';
import {insertionToolbar} from '../dist/content-ui.mjs';
import {renderLesson} from '../dist/review.mjs';
import {renderMarkdown} from '../dist/preview-markdown.mjs';
const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6dbsAAAAASUVORK5CYII=';
test('all six insertion controls have the reference order, plus activity-section insertion',()=>{
 const section=generate(source).sections[0],html=insertionToolbar(section);
 assert.deepEqual([...html.matchAll(/data-insert-kind="([^"]+)"/g)].map(m=>m[1]),['Level','Callout','Code Doc','Resource','Slide','Image']);
 assert.ok(html.includes('Activity Section'));
});
test('Callout supports all five documented Level Builder types without changing existing callouts',()=>{
 const draft=generate(source),s=draft.sections[0],before=structuredClone(s.callouts);
 for(const type of CALLOUT_TYPES)addCallout(draft,s.id,type,'Added '+type);
 assert.deepEqual(s.callouts.slice(0,before.length),before);
 assert.deepEqual(s.callouts.slice(before.length).map(c=>c.type),['Teaching Tip','Content Corner','Discussion Goal','Assessment Opportunity','Ethics Opportunity']);
});
test('text insertion honors a current selection and appends safely when that selection is stale',()=>{
 const draft=generate(source),s=draft.sections[0];s.body='Before SELECT after';
 insertMarkdown(draft,s.id,'inserted',{body:s.body,start:7,end:13});assert.equal(s.body,'Before inserted after');
 insertMarkdown(draft,s.id,'appended',{body:'outdated',start:0,end:8});assert.equal(s.body,'Before inserted after\n\nappended');
});
test('Slide inserts the actual marker while preview identifies it as a slide',()=>{
 const draft=generate(source),s=draft.sections[0],before=s.body;
 insertMarkdown(draft,s.id,SLIDE_MARKER);
 assert.ok(s.body.startsWith(before));assert.ok(s.body.endsWith(SLIDE_MARKER));
 assert.match(renderMarkdown(s.body),/\[Slide\]/);
 assert.ok(exportMarkdown(draft).includes(SLIDE_MARKER));
});
test('Level appends structured metadata without altering original associations or copying database ids',()=>{
 const draft=generate(source),s=draft.sections.find(s=>s.progression),before=structuredClone(s.progression.levels);
 const entry={name:'New level',number:5,url:'https://studio.code.org/s/example/lessons/1/levels/5',assessment:true};
 addLevel(draft,s.id,entry);
 assert.deepEqual(s.progression.levels.slice(0,-1),before);
 assert.deepEqual(s.progression.levels.at(-1),{key:'New level',number:5,url:entry.url,assessment:true,mappingStatus:'unverified'});
 const after=structuredClone(draft);assert.throws(()=>addLevel(draft,s.id,entry),/already/);assert.deepEqual(draft,after);
 assert.match(exportMarkdown(draft),/New level.*Assessment.*Destination verification needed/);
});
test('Code Doc inserts the supported programming-expression Markdown and renders a safe link',()=>{
 const draft=generate(source),s=draft.sections[0];
 addCodeDoc(draft,s.id,{syntax:'moveForward()',url:'https://studio.code.org/docs/ide/test',color:'#0094ca'});
 assert.ok(s.body.includes('[`moveForward()`(#0094ca)](https://studio.code.org/docs/ide/test)'));
 const html=renderMarkdown(s.body);assert.ok(html.includes('<code>moveForward()</code>'));assert.ok(html.includes('href="https://studio.code.org/docs/ide/test"'));
});
test('Resource references reuse existing records and identical new resources rather than duplicating records',()=>{
 const draft=generate(source),s=draft.sections[0],record=draft.resources[0],before=structuredClone(draft.resources);
 addResource(draft,s.id,{existingKey:record.key});assert.deepEqual(draft.resources,before);
 assert.ok(renderMarkdown(s.body,draft.resources).includes('AI Lab — Slides'));
 addResource(draft,s.id,{resource:{...record,key:'new-local-key'}});assert.deepEqual(draft.resources,before);
 const resource={key:'local-resource-test',name:'New handout',type:'Handout',audience:'Student',url:'https://example.com/handout'};
 addResource(draft,s.id,{resource});assert.equal(draft.resources.length,before.length+1);assert.ok(s.body.includes('[r local-resource-test]'));
 assert.ok(exportMarkdown(draft).includes('New handout | Handout | Student'));
});
test('Image supports HTTPS, local data and expandable Markdown with descriptions preserved',()=>{
 const draft=generate(source),s=draft.sections[0];
 addImage(draft,s.id,{url:'https://example.com/diagram.png',alt:'A lesson diagram'});
 addImage(draft,s.id,{url:png,alt:'A local test image',expandable:true});
 const html=renderMarkdown(s.body);assert.ok(html.includes('alt="A lesson diagram"'));assert.ok(html.includes('src="data:image/png;base64,'));
 assert.ok(s.body.includes('A local test image\n\n![expandable]('));
 assert.ok(exportMarkdown(draft).includes(png));
});
test('invalid links, images, resources and level fields reject without mutating the draft',()=>{
 const draft=generate(source),s=draft.sections[0],before=structuredClone(draft);
 const operations=[
  ()=>addLevel(draft,s.id,{name:'X',number:0,url:'https://studio.code.org/levels/1'}),
  ()=>addLevel(draft,s.id,{name:'X',number:5,url:'https://example.com/levels/1'}),
  ()=>addCodeDoc(draft,s.id,{syntax:'x',url:'javascript:alert(1)'}),
  ()=>addCodeDoc(draft,s.id,{syntax:'x',url:'https://example.com',color:'red;bad'}),
  ()=>addResource(draft,s.id,{existingKey:'missing'}),
  ()=>addResource(draft,s.id,{resource:{key:'bad',name:'Key',type:'Answer Key',audience:'Student',url:'https://example.com'}}),
  ()=>addImage(draft,s.id,{url:'data:image/svg+xml;base64,abcd',alt:'unsafe'}),
  ()=>addImage(draft,s.id,{url:'https://example.com/a.png',alt:''})
 ];
 for(const op of operations){assert.throws(op);assert.deepEqual(draft,before);}
});
test('new insertions survive storage, unchanged sources, assembled preview and Markdown',()=>{
 const base=generate(source),draft=structuredClone(base),s=draft.sections[0];
 addCodeDoc(draft,s.id,{syntax:'test()',url:'https://studio.code.org/docs/test'});
 addResource(draft,s.id,{existingKey:draft.resources[0].key});
 addImage(draft,s.id,{url:png,alt:'Test image'});
 const stored=JSON.parse(JSON.stringify(draft));
 assert.equal(reconcile(base.sections[0],stored.sections[0],base.sections[0]).status,'kept');
 const html=renderLesson(stored,[],()=> '');assert.ok(html.includes('<img class="lesson-image"'));assert.ok(html.includes('resource-reference'));
 assert.ok(exportMarkdown(stored).includes('test()'));
});
test('rich previews escape HTML, unknown resource references and hostile link attributes',()=>{
 const html=renderMarkdown('<script>alert(1)</script>\n![x](javascript:bad)\n[x](https://example.com/\"bad)\n[r missing]');
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('src="javascript:'));assert.ok(!html.includes('href="https://example.com/"bad'));
 assert.ok(html.includes('resource reference needs a matching record'));
});
