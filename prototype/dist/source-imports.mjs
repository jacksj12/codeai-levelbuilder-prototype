import {validateSource} from './core.mjs';
const MAX=32_000_000;
const decode=new TextDecoder('utf-8',{fatal:true});
export async function unzipOffice(input){
 const bytes=new Uint8Array(input),v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length>MAX)throw Error('Presentation must be smaller than 32 MB.');
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0||end+22+v.getUint16(end+20,true)!==bytes.length)throw Error('Choose a complete PowerPoint presentation.');
 const count=v.getUint16(end+10,true),size=v.getUint32(end+12,true),offset=v.getUint32(end+16,true);
 if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||count!==v.getUint16(end+8,true)||count>4000||offset+size!==end)throw Error('Unsupported presentation archive.');
 const parts=new Map(),names=new Set();let p=offset,total=0;
 for(let i=0;i<count;i++){
  if(p+46>end||v.getUint32(p,true)!==0x02014b50)throw Error('Invalid presentation directory.');
  const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),crc=v.getUint32(p+16,true),compressed=v.getUint32(p+20,true),length=v.getUint32(p+24,true),n=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),at=v.getUint32(p+42,true);
  const name=decode.decode(bytes.subarray(p+46,p+46+n));p+=46+n+extra+comment;
  if(p>end||flags&1||![0,8].includes(method)||names.has(name)||!name||name.includes('\0')||name.startsWith('/')||name.split('/').includes('..')||name.includes('\\'))throw Error('Unsupported or unsafe presentation entry.');
  if(at+30>offset||v.getUint32(at,true)!==0x04034b50)throw Error('Invalid presentation entry.');
  const from=at+30+v.getUint16(at+26,true)+v.getUint16(at+28,true);
  if(from+compressed>offset)throw Error('Truncated presentation entry.');
  const localName=decode.decode(bytes.subarray(at+30,at+30+v.getUint16(at+26,true)));
  if(localName!==name||v.getUint16(at+6,true)!==flags||v.getUint16(at+8,true)!==method)throw Error('Presentation entry headers disagree.');
  if(!(flags&8)&&(v.getUint32(at+14,true)!==crc||v.getUint32(at+18,true)!==compressed||v.getUint32(at+22,true)!==length))throw Error('Presentation entry sizes or checksums disagree.');
  names.add(name);
  // Ignore images and other binary media; only parse the bounded XML relationships and notes.
  if(!/\.(xml|rels)$/.test(name))continue;
  total+=length;if(length>4_000_000||total>MAX)throw Error('Presentation text exceeds the import limit.');
  const raw=bytes.subarray(from,from+compressed);let out;
  if(method===0)out=raw;else{
   const reader=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),chunks=[];let got=0;
   try{while(true){const {done,value}=await reader.read();if(done)break;got+=value.length;if(got>length||got>4_000_000){await reader.cancel();throw Error('Presentation expands beyond its declared size.');}chunks.push(value);}}finally{reader.releaseLock();}
   out=new Uint8Array(got);let j=0;for(const chunk of chunks){out.set(chunk,j);j+=chunk.length;}
  }
  let check=0xffffffff;for(const b of out){check^=b;for(let bit=0;bit<8;bit++)check=(check>>>1)^((check&1)?0xedb88320:0);}check=(check^0xffffffff)>>>0;
  if(out.length!==length||check!==crc)throw Error('Presentation failed its integrity check.');
  const text=decode.decode(out);if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('External XML entities are unsupported.');parts.set(name,text);
 }
 if(p!==end)throw Error('Invalid presentation directory length.');return parts;
}
const entities=s=>s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,k)=>k[0]==='#'?String.fromCodePoint(k[1].toLowerCase()==='x'?parseInt(k.slice(2),16):Number(k.slice(1))):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[k]));
const attr=(s,key)=>entities(s.match(new RegExp('(?:^|\\s)'+key+'=["\\\']([^"\\\']*)["\\\']'))?.[1]||'');
function rels(parts,file){const slash=file.lastIndexOf('/'),dir=file.slice(0,slash+1),xml=parts.get(dir+'_rels/'+file.slice(slash+1)+'.rels')||'';return [...xml.matchAll(/<Relationship\s+([^>]+)\/?\s*>/g)].map(m=>{const a=m[1],target=attr(a,'Target');return {id:attr(a,'Id'),type:attr(a,'Type'),external:attr(a,'TargetMode')==='External',target:new URL(target,'https://office.invalid/'+dir).pathname.slice(1)};});}
export function presentationParts(parts,name='Presentation'){
 const xml=parts.get('ppt/presentation.xml');if(!xml)throw Error('This file is not a PowerPoint presentation.');
 const relationships=rels(parts,'ppt/presentation.xml'),ids=[...xml.matchAll(/<p:sldId\s+([^>]+)\/?\s*>/g)];if(!ids.length)throw Error('Presentation has no slides.');
 const slides=ids.map((m,i)=>{
  const id=attr(m[1],'id'),link=relationships.find(r=>r.id===attr(m[1],'r:id')&&!r.external&&r.type.endsWith('/slide'));
  if(!id||!link||!parts.has(link.target))throw Error('Presentation has an unresolved slide.');
  const notesLink=rels(parts,link.target).find(r=>!r.external&&r.type.endsWith('/notesSlide'));
  let notes='';if(notesLink){const notesXml=parts.get(notesLink.target);if(!notesXml)throw Error('Presentation has missing speaker notes.');
   const shapes=[...notesXml.matchAll(/<p:sp(?:\s[^>]*)?>([\s\S]*?)<\/p:sp>/g)];
   const bodies=shapes.filter(m=>/<p:ph\b[^>]*\btype=["']body["']/.test(m[1]));
   notes=bodies.flatMap(shape=>[...shape[1].matchAll(/<a:p(?:\s[^>]*)?>([\s\S]*?)<\/a:p>/g)].map(p=>[...p[1].matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>|<a:br\s*\/?\s*>/g)].map(t=>t[1]===undefined?'\n':entities(t[1])).join(''))).join('\n').trim();
  }
  // Exporters can renumber slide IDs. Bind fallback identity to notes too, so
  // an edited/replaced slide requires a revision decision instead of inheriting another slide's levels.
  let hash=14695981039346656037n;for(const byte of new TextEncoder().encode(notes)){hash^=BigInt(byte);hash=BigInt.asUintN(64,hash*1099511628211n);}
  return {id:'pptx-'+id+'-'+hash.toString(16),number:i+1,notes};
 });
 if(new Set(slides.map(s=>s.id)).size!==slides.length)throw Error('Presentation has duplicate slide identities.');
 if(!slides.some(s=>s.notes.trim()))throw Error('No speaker notes found. Export the original deck as PowerPoint with notes.');
 return {kind:'slides',title:name.replace(/\.pptx$/i,''),slides,warnings:slides.filter(s=>!s.notes).map(s=>'Slide '+s.number+' has no speaker notes.')};
}
export function slidesJson(data){
 if(typeof data.presentationId!=='string'||!/^[-\w]+$/.test(data.presentationId)||!Array.isArray(data.slides)||!data.slides.length||data.slides.length>2000)throw Error('Choose a Google Slides presentation response.');
 if(data.slides.some(s=>!s||typeof s.objectId!=='string'||!s.objectId.trim())||new Set(data.slides.map(s=>s.objectId)).size!==data.slides.length)throw Error('The Slides response has missing or duplicate slide identities.');
 for(const slide of data.slides){
  const page=slide.slideProperties?.notesPage;if(!page)continue;
  const elements=page.pageElements||[];if(!Array.isArray(elements))throw Error('The Slides notes are incomplete.');
  const matches=elements.filter(e=>e.objectId===page.notesProperties?.speakerNotesObjectId);
  if(matches.length>1)throw Error('The Slides response has ambiguous speaker notes.');
  const runs=matches[0]?.shape?.text?.textElements||[];
  if(!Array.isArray(runs)||runs.some(run=>!run||(run.textRun&&typeof run.textRun.content!=='string')))throw Error('The Slides notes contain invalid text.');
 }
 const slides=data.slides.map((s,i)=>{const page=s.slideProperties?.notesPage,id=page?.notesProperties?.speakerNotesObjectId,shape=page?.pageElements?.find(e=>e.objectId===id)?.shape;
  return {id:s.objectId,number:i+1,notes:(shape?.text?.textElements||[]).map(e=>e.textRun?.content||'').join('').trim()};});
 if(!slides.some(s=>s.notes))throw Error('The Slides response does not include speaker notes.');
 return {kind:'slides',title:data.title||'Presentation',deckUrl:'https://docs.google.com/presentation/d/'+encodeURIComponent(data.presentationId)+'/edit',slides,warnings:slides.filter(s=>!s.notes).map(s=>'Slide '+s.number+' has no speaker notes.')};
}
const fields={'overview (teacher)':'teacherOverview','overview (student)':'studentOverview','links':'resources','vocab':'vocabulary','teacher overview':'teacherOverview','overview':'teacherOverview','student overview':'studentOverview','objectives':'objectives','learning objectives':'objectives','preparation':'preparation','purpose':'purpose','vocabulary':'vocabulary','assessment opportunities':'assessmentOpportunities','resources':'resources','resource links':'resources','course':'course'};
export function notionMarkdown(markdown){
 if(markdown.length>2_000_000)throw Error('Brief must be smaller than 2 MB.');
 const result={kind:'brief',fields:{},warnings:[]};let key=null,keyDepth=0,lines=[];
 markdown=markdown.replace(/<\/?(?:column|columns|callout|p)\b[^>]*>/gi,'').replace(/<\/?b>/gi,'**').replace(/<\/?i>/gi,'*');

 function flush(){if(!key)return;const text=lines.join('\n').trim();if(['objectives','vocabulary'].includes(key))result.fields[key]=/^(n\/?a|none|not applicable)[.!]?$/i.test(text.replace(/^[-*+]\s+/,''))?[]:text.split('\n').map(s=>s.replace(/^\s*(?:[-*+] |\d+[.)] )/,'').trim()).filter(s=>s&&!/^Students will be able to:?$/i.test(s));
  else if(key==='resources'){
   const resources=[];let audience='Student';for(const line of lines){if(/verified teacher|teacher resources|for the teachers/i.test(line))audience='Verified Teacher';else if(/student resources|for the students/i.test(line))audience='Student';for(const m of line.matchAll(/\[((?:\\.|[^\]\\])+)\]\((https:\/\/[^\s)]+)\)/g)){const type=/answer key|exemplar/i.test(line)?'Answer Key':/slides|presentation/i.test(line)?'Slides':/activity guide|worksheet/i.test(line)?'Activity Guide':'Other';resources.push({key:'import-'+resources.length,name:m[1].replace(/\\([\[\]])/g,'$1').trim(),url:m[2],type,audience:type==='Answer Key'?'Verified Teacher':audience});}}
   result.fields.resources=resources;if(text&&!resources.length)throw Error('Resources need Markdown links with HTTPS destinations.');
  }else result.fields[key]=text;lines=[];
 }
 for(const line of markdown.replace(/\r\n/g,'\n').split('\n')){const heading=line.match(/^(#{1,6})\s+(.+?)\s*#*$/);if(heading){const label=heading[2].replace(/\*\*/g,'').replace(/:$/,'').trim(),mapped=fields[label.toLowerCase()];if(mapped){flush();if(Object.hasOwn(result.fields,mapped))throw Error('Duplicate brief section: '+label);key=mapped;keyDepth=heading[1].length;lines=[];continue;}if(heading[1]==='#'&&!result.title){flush();key=null;result.title=label;continue;}if(key==='resources'&&/^(teacher resources|student resources)$/i.test(label)){lines.push(label);continue;}if(key&&heading[1].length>keyDepth){lines.push(line);continue;}if(heading){flush();key=null;lines=[];result.warnings.push('Unmapped brief heading: '+label);continue;}}if(key)lines.push(line);}flush();
 if(!Object.keys(result.fields).length)throw Error('No brief sections recognized. Use headings such as Teacher overview, Objectives, Preparation and Resources.');return result;
}
export function notionBlocks(data){
 if(data.has_more||data.next_cursor)throw Error('Notion export is incomplete. Include all pages of blocks.');
 const blocks=data.results||data.blocks;if(!Array.isArray(blocks))throw Error('Choose a Notion blocks export.');
 const lines=[];let count=0;
 function walk(items,depth=0){
  if(depth>32||!Array.isArray(items))throw Error('Notion block nesting is unsupported. Export the brief as Markdown.');
  for(const b of items){
   if(++count>10000||!b||typeof b.type!=='string')throw Error('Notion export has too many or invalid blocks.');
   const value=b[b.type]||{},heading=/^heading_[123]$/.test(b.type);
   const text=(value.rich_text||[]).map(t=>{
    let content=t.plain_text??t.text?.content??'';const url=t.href??t.text?.link?.url,a=t.annotations||{};
    if(!heading){
     if(a.code)content='`'+content.replace(/`/g,'\\`')+'`';
     else{if(a.bold)content='**'+content+'**';if(a.italic)content='*'+content+'*';if(a.strikethrough)content='~~'+content+'~~';}
    }
    if(url){let parsed;try{parsed=new URL(url);}catch{throw Error('Notion link has an invalid destination.');}
     if(parsed.protocol!=='https:')throw Error('Notion links need HTTPS destinations.');
     content='['+content.replace(/([\[\]])/g,'\\$1')+']('+parsed.href.replace(/\(/g,'%28').replace(/\)/g,'%29')+')';
    }return content;
   }).join('');
   if(heading)lines.push('#'.repeat(Number(b.type.slice(-1)))+' '+text);
   else if(['paragraph','bulleted_list_item','numbered_list_item','quote','callout','toggle'].includes(b.type))lines.push((b.type.endsWith('list_item')?'- ':'')+text);
   else if(!['divider','column_list','column'].includes(b.type))throw Error('Unsupported Notion block '+b.type+'. Export the brief as Markdown to preserve it.');
   const children=b.children||value.children;
   if(b.has_children&&!Array.isArray(children))throw Error('Notion export is missing child blocks.');
   if(children)walk(children,depth+1);
  }
 }
 walk(blocks);return notionMarkdown(lines.join('\n\n'));
}
export async function importSourceFile(file){
 if(file.size>MAX)throw Error('Source file must be smaller than 32 MB.');
 if(/\.pptx$/i.test(file.name))return presentationParts(await unzipOffice(await file.arrayBuffer()),file.name);
 const text=await file.text();if(text.length>2_000_000)throw Error('Text source must be smaller than 2 MB.');
 if(/\.(md|markdown)$/i.test(file.name))return notionMarkdown(text);
 let data;try{data=JSON.parse(text);}catch{throw Error('Choose source JSON, a Notion Markdown export, or a PowerPoint deck.');}
 if(data.kind==='lesson-studio-brief'){
  const brief=data.brief,allowed=new Set(Object.values(fields));
  if(data.schemaVersion!==1||brief?.kind!=='brief'||!brief.fields||Object.keys(brief.fields).some(key=>!allowed.has(key))||!Array.isArray(brief.warnings)||brief.warnings.some(w=>typeof w!=='string'))throw Error('The exported Notion brief is invalid.');
  validateSource({title:brief.title||'Imported brief',slides:[{id:'validation',number:1,notes:'Validation'}],...brief.fields});return structuredClone(brief);
 }
 if(data.presentationId)return slidesJson(data);if(data.object==='list'||data.blocks)return notionBlocks(data);validateSource(data);return {kind:'source',source:data,warnings:[]};
}
export function combineSourceImports(base,imports){
 let source=structuredClone(base),warnings=[],types=new Set();for(const item of imports){if(types.has(item.kind))throw Error('Choose only one file of each source type.');types.add(item.kind);warnings.push(...(item.warnings||[]));
  if(item.kind==='source'){if(imports.length!==1)throw Error('Import a complete source package separately.');source=structuredClone(item.source);}
  else if(item.kind==='slides'){const oldIds=new Set(source.slides.map(s=>s.id)),newIds=new Set(item.slides.map(s=>s.id));if(source.levelAssociations&&Object.keys(source.levelAssociations).some(id=>!newIds.has(id)))warnings.push('Some previous level mappings do not match these slide identities. Existing draft content is retained for revision review; confirm mappings for the imported slides.');if(!item.slides.some(s=>oldIds.has(s.id)))warnings.push('This deck uses different slide identities. Previous sections will require explicit deletion decisions.');source.slides=structuredClone(item.slides);if(item.deckUrl)source.deckUrl=item.deckUrl;}
  else if(item.kind==='brief'){Object.assign(source,structuredClone(item.fields));if(item.title)source.title=item.title;}else throw Error('Unsupported source type.');
 }
 source.importWarnings=[...new Set(warnings)];validateSource(source);return {source,warnings:source.importWarnings};
}
