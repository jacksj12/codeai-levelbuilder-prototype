import test from 'node:test';import assert from 'node:assert/strict';import {deflateRawSync} from 'node:zlib';import vm from 'node:vm';
import {unzipOffice,presentationParts,notionMarkdown,notionBlocks,slidesJson,importSourceFile,combineSourceImports} from '../dist/source-imports.mjs';
import {sourcePageExport} from '../browser-fill/source-page-export.mjs';
import {generate} from '../dist/core.mjs';
const base=()=>({title:'Existing',teacherOverview:'Keep me',slides:[{id:'old',number:1,notes:'Original'}],levelAssociations:{old:{levels:[]}}});
const xmlParts=()=>new Map([
 ['ppt/presentation.xml','<p:presentation><p:sldIdLst><p:sldId id="9" r:id="second"/><p:sldId id="8" r:id="first"/></p:sldIdLst></p:presentation>'],
 ['ppt/_rels/presentation.xml.rels','<Relationships><Relationship Id="first" Type="office/slide" Target="slides/slide1.xml"/><Relationship Id="second" Type="office/slide" Target="slides/slide2.xml"/></Relationships>'],
 ['ppt/slides/slide1.xml','<p:sld/>'],['ppt/slides/slide2.xml','<p:sld/>'],
 ...[1,2].flatMap(i=>[[`ppt/slides/_rels/slide${i}.xml.rels`,`<Relationships><Relationship Id="notes" Type="office/notesSlide" Target="../notesSlides/notesSlide${i}.xml"/></Relationships>`],[`ppt/notesSlides/notesSlide${i}.xml`,`<p:notes><p:sp><p:nvSpPr><p:nvPr><p:ph type="body"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>Notes ${i} &amp; evidence</a:t></a:r></a:p><a:p><a:r><a:t>Next line</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:ph type="sldNum"/><a:p><a:r><a:t>99</a:t></a:r></a:p></p:sp></p:notes>`]])]);
function zip(parts,{compressed=true}={}){const chunks=[],central=[];let at=0;for(const [name,text]of parts){const bytes=Buffer.from(text),n=Buffer.from(name),body=compressed?deflateRawSync(bytes):bytes;let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}crc=(crc^0xffffffff)>>>0;
 const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(compressed?8:0,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(body.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(n.length,26);
 const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(compressed?8:0,10);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(body.length,20);entry.writeUInt32LE(bytes.length,24);entry.writeUInt16LE(n.length,28);entry.writeUInt32LE(at,42);central.push(entry,n);chunks.push(local,n,body);at+=local.length+n.length+body.length;}
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(parts.size,8);end.writeUInt16LE(parts.size,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(at,16);return Buffer.concat([...chunks,directory,end]);}
test('PowerPoint imports notes in presentation relationship order, retaining stable IDs and excluding slide-number placeholders',async()=>{
 for(const compressed of [true,false]){const result=presentationParts(await unzipOffice(zip(xmlParts(),{compressed})),'Deck.pptx');assert.deepEqual(result.slides.map(s=>s.id.split('-').slice(0,2).join('-')),['pptx-9','pptx-8']);assert.equal(result.slides[0].notes,'Notes 2 & evidence\nNext line');assert.equal(result.title,'Deck');}
});
test('truncated, unsafe, corrupted and entity-bearing archives fail without partial imports',async()=>{
 const archive=zip(xmlParts());await assert.rejects(unzipOffice(archive.subarray(0,-1)));await assert.rejects(unzipOffice(zip(new Map([['../notes.xml','x']]))),/unsafe/);
 const corrupted=zip(new Map([['notes.xml','hello']]),{compressed:false});corrupted[39]^=1;await assert.rejects(unzipOffice(corrupted),/integrity/);
 await assert.rejects(unzipOffice(zip(new Map([['notes.xml','<!DOCTYPE a>']]))),/entities/);assert.throws(()=>presentationParts(new Map()),/not a PowerPoint/);
 const missing=xmlParts();missing.delete('ppt/notesSlides/notesSlide1.xml');assert.throws(()=>presentationParts(missing),/missing speaker/);
});
test('Notion Markdown imports distinct front matter, objective lists, vocabulary and audience-safe resource records',()=>{
 const brief=notionMarkdown('# New lesson\n\n## Teacher overview\nTeacher **guidance**\n\n## Student overview\nStudent text\n## Objectives\n- First\n- Second\n## Vocabulary\nn/a\n## Resources\n### Teacher resources\n- [Exemplar](https://example.com/key) — Answer Key\n### Student resources\n- [Activity guide](https://example.com/guide)\n## Assessment opportunities\nCheck evidence');
 const result=combineSourceImports(base(),[brief]);assert.equal(result.source.title,'New lesson');assert.deepEqual(result.source.objectives,['First','Second']);assert.deepEqual(result.source.vocabulary,[]);assert.equal(result.source.resources[0].audience,'Verified Teacher');assert.equal(result.source.resources[1].audience,'Student');assert.equal(generate(result.source).frontMatter.assessmentOpportunities,'Check evidence');assert.equal(base().title,'Existing');
});
test('brief parsing rejects duplicate sections and incomplete Notion pagination or child blocks',()=>{
 assert.throws(()=>notionMarkdown('## Objectives\n- One\n## Objectives\n- Two'),/Duplicate/);
 assert.throws(()=>notionBlocks({has_more:true,results:[]}),/incomplete/);assert.throws(()=>notionBlocks({results:[{type:'toggle',has_children:true,toggle:{rich_text:[]}}]}),/child blocks/);
 assert.throws(()=>notionBlocks({results:[{type:'image'}]}),/Unsupported/);
 const rich=content=>[{plain_text:content}];const result=notionBlocks({results:[{type:'heading_2',heading_2:{rich_text:rich('Preparation')}},{type:'paragraph',paragraph:{rich_text:rich('Prepare materials')}}]});assert.equal(result.fields.preparation,'Prepare materials');
});
test('Slides API imports speaker notes and combined partial imports preserve unrelated source fields with mapping warnings',()=>{
 const deck=slidesJson({presentationId:'deck',title:'Deck',slides:[{objectId:'stable',slideProperties:{notesPage:{notesProperties:{speakerNotesObjectId:'notes'},pageElements:[{objectId:'notes',shape:{text:{textElements:[{textRun:{content:'Start (5 minutes)\n'}}]}}}]}}}]});
 const combined=combineSourceImports(base(),[deck,notionMarkdown('## Student overview\nNew student text')]);assert.equal(combined.source.teacherOverview,'Keep me');assert.equal(combined.source.studentOverview,'New student text');assert.ok(combined.warnings.some(w=>w.includes('level mappings')));assert.equal(combined.source.slides[0].id,'stable');assert.throws(()=>combineSourceImports(base(),[deck,deck]),/one file/);
});
test('file dispatch accepts supported files and rejects malformed JSON without modifying the base',async()=>{
 const file={name:'brief.md',size:20,text:async()=> '## Purpose\nExplain'};assert.equal((await importSourceFile(file)).fields.purpose,'Explain');
 await assert.rejects(importSourceFile({...file,name:'bad.json',text:async()=>'{'}),/Choose source/);
 await assert.rejects(importSourceFile({...file,size:33_000_000}),/32 MB/);
 const result=await importSourceFile({name:'deck.pptx',size:100,arrayBuffer:async()=>zip(xmlParts())});assert.equal(result.slides.length,2);
});
test('serialized signed-in deck export only reads the selected presentation and rejects sign-in HTML',async()=>{
 const url='https://docs.google.com/presentation/d/selected/edit';let calls=0;
 const context=vm.createContext({URL,location:new URL(url),document:{title:'Deck - Google Slides'},AbortSignal,Uint8Array,btoa,fetch:async(path,options)=>{calls++;assert.equal(path,'/presentation/d/selected/export/pptx');assert.equal(options.method,'GET');assert.equal(options.credentials,'same-origin');return new Response(zip(xmlParts()));}});
 const fn=vm.runInContext('('+sourcePageExport.toString()+')',context);const result=await fn(url);assert.equal(result.name,'Deck.pptx');assert.equal(presentationParts(await unzipOffice(Buffer.from(result.base64,'base64'))).slides.length,2);
 await assert.rejects(fn('https://docs.google.com/presentation/d/other/edit'),/selected/);assert.equal(calls,1);
 context.fetch=async()=>new Response('<html>Sign in</html>');await assert.rejects(fn(url),/sign-in/);
});

test('actual Notion-style column markup and aliases preserve exactly three objectives and resource audiences',()=>{
 const text='<columns>\n<column>\n### Overview (Teacher)\n<b>Question</b>\n<p>Teacher explanation</p>\n### Overview (Student)\nStudent explanation\n</column>\n<column>\n### Objectives\n<p>Students will be able to:</p>\n- One\n- Two\n- Three\n### Links\nFor the teachers\n- [Deck](https://example.com/deck) - slides\n- [\\[EXEMPLAR\\] Guide](https://example.com/key)\nFor the students\n- [Activity Guide](https://example.com/guide)\n### Vocab\n- n/a\n### Link to levels\nhttps://example.com/levels\n</column>\n</columns>';
 const result=notionMarkdown(text);assert.equal(result.fields.teacherOverview,'**Question**\nTeacher explanation');assert.equal(result.fields.objectives.length,3);assert.deepEqual(result.fields.vocabulary,[]);assert.deepEqual(result.fields.resources.map(r=>r.audience),['Verified Teacher','Verified Teacher','Student']);assert.equal(result.fields.resources[1].name,'[EXEMPLAR] Guide');assert.ok(result.warnings.some(w=>w.includes('Link to levels')));
 const merged=combineSourceImports(base(),[result]);assert.ok(generate(merged.source).warnings.some(w=>w.includes('Link to levels')));
});
test('changed notes cannot silently reuse a renumbered PowerPoint slide identity',()=>{
 const parts=xmlParts(),before=presentationParts(parts);parts.set('ppt/notesSlides/notesSlide2.xml',parts.get('ppt/notesSlides/notesSlide2.xml').replace('Notes 2','Different slide'));
 const after=presentationParts(parts);assert.notEqual(before.slides[0].id,after.slides[0].id);assert.equal(before.slides[1].id,after.slides[1].id);
});

test('Notion block imports preserve formatting inside complete nested columns',()=>{
 const blocks=[{type:'column_list',has_children:true,children:[{type:'column',has_children:true,children:[{type:'heading_2',heading_2:{rich_text:[{plain_text:'Teacher overview'}]}},{type:'paragraph',paragraph:{rich_text:[{plain_text:'Important',annotations:{bold:true}},{plain_text:' guidance',annotations:{italic:true}}]}}]}]}];
 const result=notionBlocks({results:blocks});assert.equal(result.fields.teacherOverview,'**Important*** guidance*');
 blocks[0].children[0].children.push({type:'paragraph',paragraph:{rich_text:[{plain_text:'Unsafe',href:'javascript:alert(1)'}]}});assert.throws(()=>notionBlocks({results:blocks}),/HTTPS/);
});
test('Notion links retain literal brackets and URL parentheses without truncation',()=>{
 const result=notionBlocks({results:[{type:'heading_2',heading_2:{rich_text:[{plain_text:'Resources'}]}},{type:'paragraph',paragraph:{rich_text:[{plain_text:'[EXEMPLAR] Guide',href:'https://example.com/guide(v2)'}]}}]});assert.equal(result.fields.resources[0].name,'[EXEMPLAR] Guide');assert.equal(result.fields.resources[0].url,'https://example.com/guide%28v2%29');assert.equal(result.fields.resources[0].audience,'Verified Teacher');
});

test('nested brief headings retain their teaching content while unrelated peers remain warnings',()=>{
 const result=notionMarkdown('## Teacher overview\nOpening\n### Facilitation\nKeep this explanation\n#### Example\nKeep this example\n## Internal tracking\nNot teaching content\n## Preparation\nMaterials');
 assert.equal(result.fields.teacherOverview,'Opening\n### Facilitation\nKeep this explanation\n#### Example\nKeep this example');assert.equal(result.fields.preparation,'Materials');assert.ok(result.warnings.some(w=>w.includes('Internal tracking')));assert.ok(!result.fields.teacherOverview.includes('Not teaching'));
});

test('Slides rejects missing or duplicate identities and malformed note text before merging',()=>{
 const slide={objectId:'a',slideProperties:{notesPage:{notesProperties:{speakerNotesObjectId:'n'},pageElements:[{objectId:'n',shape:{text:{textElements:[{textRun:{content:'Teaching'}}]}}}]}}};
 for(const slides of [[{...slide,objectId:''}],[slide,structuredClone(slide)]])assert.throws(()=>slidesJson({presentationId:'deck',slides}),/identities/);
 const broken=structuredClone(slide);broken.slideProperties.notesPage.pageElements[0].shape.text.textElements[0].textRun.content={unreadable:true};assert.throws(()=>slidesJson({presentationId:'deck',slides:[broken]}),/invalid text/);
 const ambiguous=structuredClone(slide);ambiguous.slideProperties.notesPage.pageElements.push(ambiguous.slideProperties.notesPage.pageElements[0]);assert.throws(()=>slidesJson({presentationId:'deck',slides:[ambiguous]}),/ambiguous/);
});

test('PowerPoint rejects conflicting entry headers and duplicate ignored media names',async()=>{
 const archive=zip(new Map([['notes.xml','Text']]),{compressed:false});archive[30]='x'.charCodeAt(0);await assert.rejects(unzipOffice(archive),/headers disagree/);
 const sizes=zip(new Map([['notes.xml','Text']]),{compressed:false});sizes.writeUInt32LE(99,22);await assert.rejects(unzipOffice(sizes),/sizes or checksums/);
 const duplicate={size:2,*[Symbol.iterator](){yield ['image.png','A'];yield ['image.png','B'];}};await assert.rejects(unzipOffice(zip(duplicate)),/unsafe/);
});

test('signed-in Notion brief exports can be imported into a separate extension workspace',async()=>{
 const brief=notionMarkdown('## Teacher overview\nSigned-in content'),data={kind:'lesson-studio-brief',schemaVersion:1,brief},file={name:'brief.json',size:200,text:async()=>JSON.stringify(data)};
 assert.deepEqual(await importSourceFile(file),brief);brief.fields.levelAssociations={unexpected:true};await assert.rejects(importSourceFile(file),/invalid/);
});
