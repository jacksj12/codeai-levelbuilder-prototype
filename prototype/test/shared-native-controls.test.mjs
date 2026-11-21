import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {nativeEditorBridge} from '../dist/native-dom-adapter.mjs';
import {digest,canonical} from '../dist/transfer-core.mjs';
import {recoverSharedRehearsal} from '../dist/reviewed-shared.mjs';
import {normalizeNativeCapture} from '../dist/transfer-native.mjs';
import {runAcceptedNativeRehearsal} from '../dist/native-level-verification.mjs';
import {withReviewedReload} from '../browser-fill/reviewed-reload.mjs';

// Execute the serialized bridge against native-shaped tables and React Select events.
// These fixtures neither contact Level Builder nor claim installed-extension acceptance.
async function harness(kind='resources',mode='normal'){
 const destination={id:123,url:'https://levelbuilder-studio.code.org/lessons/123/edit'};
 const saved={id:123,name:'Native shared fixture',activities:[],objectives:[],resources:[],vocabularies:[]};
 const record=kind==='resources'?{id:800,key:'guide',markdownKey:'guide/course/version',name:'Evidence guide',type:'Handout',audience:'Student',url:'https://example.org/guide',downloadUrl:'',embeddabilityType:'embed_and_resource_dropdown',curriculumCategory:'',assessment:false,includeInPdf:false,isRollup:false}:{id:801,key:'evidence',markdownKey:'evidence/course/version',word:'Evidence',definition:'Support for a claim.',commonSenseMedia:false};
 const linked={resources:[],vocabularies:[]},calls=[];let selections=0,observers=0,course=77,visible=mode!=='collapsed';
 class Input{get value(){return this.pending||'';}set value(v){this.pending=v;}focus(){}dispatchEvent(){}}
 const input=new Input();input.getClientRects=()=>visible?[{}]:[];
 const fields=Object.fromEntries(['Title','Overview','Student Overview','Purpose','Preparation','Assessment Opportunities'].map(name=>[name,{value:''}]));
 fields.Title.value=saved.name;
 const labels=Object.entries(fields).map(([name,node])=>({childNodes:[{nodeType:3,textContent:name}],querySelectorAll:()=>[node]}));
 const headers={resources:['Key','Name','Type','Audience','URL','Actions'],vocabularies:['Word','Definition','Actions'],objectives:['Description','Levels','Actions']};
 const row=value=>({textContent:Object.values(value).join(' '),querySelectorAll:s=>s==='td'?[...Object.values(value), ''].map(textContent=>({textContent})):[]});
 const tables=Object.entries(headers).map(([name,head])=>({name,querySelector:s=>s==='thead'?{textContent:head.join(' ')}:null,querySelectorAll:s=>s==='thead th'?head.map(textContent=>({textContent})):s==='tbody tr'?(linked[name]||[]).map(row):[]}));
 const label=kind==='resources'?record.name+' - '+record.url:record.word+' - '+record.definition;
 const option={textContent:label,getClientRects:()=>[{}],dispatchEvent(event){assert.equal(event.type,'mousedown');selections++;if(mode!=='failed-click')linked[kind].push(kind==='resources'?Object.fromEntries(['key','name','type','audience','url'].map(k=>[k,record[k]])):{word:record.word,definition:record.definition});}};
 const roots=tables.map(table=>({id:'shared-'+table.name,querySelectorAll:s=>s==='table'?[table]:s==='.Select-input input'&&table.name===kind?[input]:s==='.Select-option'&&table.name===kind?(mode==='missing'?[]:mode==='ambiguous-options'?[option,option]:[option]):[]}));
 tables.forEach((table,i)=>table.parentElement=roots[i]);
 const originalOptionQuery=roots.find(r=>r.id==='shared-'+kind).querySelectorAll;
 roots.find(r=>r.id==='shared-'+kind).querySelectorAll=function(s){if(s==='.Select-option'&&mode==='outside-edit')fields.Overview.value='Keep outside edit';return originalOptionQuery(s);};
 const script={getAttribute:k=>k==='data-lesson'?JSON.stringify(saved):k==='data-unitforlesson'?JSON.stringify({courseVersionId:course}):null};
 const document={querySelector:s=>['script[data-lesson]','script[data-lesson][data-unitforlesson]'].includes(s)?script:null,querySelectorAll:s=>s==='#edit-container label'?labels:s==='#edit-container table'?tables:s==='#edit-container h2 button'?[{textContent:kind==='resources'?'Resources':'Vocabulary',click(){visible=true;}}]:s.includes('input[type="hidden"][name="objectives"]')?[{value:'[]'}]:s.includes('input[type="hidden"][name="activities"]')?[{value:'[]'}]:[]};
 const context=vm.createContext({document,location:new URL(destination.url),structuredClone,crypto,TextEncoder,URLSearchParams,MessageChannel,HTMLInputElement:Input,DOMParser:class{parseFromString(){return {querySelector:()=>script};}},Event:class{constructor(type){this.type=type;}},MouseEvent:class{constructor(type){this.type=type;}},MutationObserver:class{constructor(){}observe(){observers++;}disconnect(){observers--;}},setTimeout,clearTimeout,fetch:async(url,options)=>{calls.push({url,options});assert.ok(!options.method||options.method==='GET');return {ok:true,text:async()=>'<saved-fixture>',json:async()=>mode==='capped'?Array(40).fill(record):mode==='ambiguous-catalog'?[record,{...record,id:900,key:'different',...(kind==='resources'?{audience:'Teacher'}:{commonSenseMedia:true})}]:[record]};}});
 const bridge=vm.runInContext('('+nativeEditorBridge.toString()+')',context),base={destination,practiceConfirmed:true},initial=await bridge({...base,action:'read'});assert.equal(initial.blockers.length,0);
 const request={...base,action:'append-shared-association',mode:'unsaved-structure-staging',operation:{kind:'append',path:kind==='resources'?['resources']:['frontMatter','vocabulary'],record},expectedCaptureDigest:await digest(initial)};
 return {record,initial,linked,calls,request,fields,bridge:request=>bridge({...base,...request}),get selections(){return selections;},get observers(){return observers;},set course(v){course=v;},read:()=>bridge({...base,action:'read'}),call:overrides=>bridge({...request,...overrides})};
}

test('serialized shared controls associate exact resource and vocabulary records through one native option',async()=>{
 for(const kind of ['resources','vocabularies'])for(const mode of ['normal','collapsed']){
  const h=await harness(kind,mode),after=await h.call();assert.equal(h.selections,1);assert.equal(after.blockers.length,0);assert.equal(after.live[kind].length,1);assert.equal(h.observers,0);assert.deepEqual(after.saved,h.initial.saved);
  await assert.rejects(h.call({expectedCaptureDigest:await digest(after)}),/already associated/);assert.equal(h.selections,1);
  assert.ok(h.calls.every(c=>c.url.includes('/'+kind+'/search?')&&c.url.includes('courseVersionId=77')));
 }
});

test('serialized shared lookup preserves the editor and refuses stale scope, capture and capped searches',async()=>{
 const h=await harness();const mapping=await h.call({action:'lookup-shared-record',kind:'resources',record:h.record,courseVersionId:77});assert.equal(mapping.record.id,800);assert.equal(canonical(mapping.capture),canonical(h.initial));assert.equal(h.selections,0);
 await assert.rejects(h.call({action:'lookup-shared-record',kind:'resources',record:h.record,courseVersionId:88}),/scope/);
 h.fields.Overview.value='Outside edit';await assert.rejects(h.call(),/editor changed/);assert.equal(h.selections,0);
 const capped=await harness('resources','capped');await assert.rejects(capped.call(),/incomplete/);assert.equal(capped.selections,0);
});

test('ambiguous native options and outside edits stop before association and release observers',async()=>{
 for(const mode of ['ambiguous-options','outside-edit']){
  const h=await harness('resources',mode);await assert.rejects(h.call(),mode==='ambiguous-options'?/More than one/:/Outside edits/);assert.equal(h.selections,0);assert.equal(h.observers,0);
 }
 const missing=await harness('vocabularies','missing');await assert.rejects(missing.call({deadlineAt:Date.now()+40}),/did not return|expired/);assert.equal(missing.selections,0);assert.equal(missing.observers,0);
});

test('shared search refuses same-label records with distinct identities before using truncated native options',async()=>{
 for(const kind of ['resources','vocabularies']){const h=await harness(kind,'ambiguous-catalog');await assert.rejects(h.call(),/ambiguous|same label/);assert.equal(h.selections,0);}
});

test('failed shared selection never invents a staged record or reloads outside edits',async()=>{
 const h=await harness('vocabularies','failed-click'),after=await h.call();assert.equal(after.live.vocabularies.length,0);assert.equal(canonical(after),canonical(h.initial));
 let reloads=0;h.fields.Overview.value='Outside edit';const current=await h.read();
 await assert.rejects(recoverSharedRehearsal(async request=>{if(request.action==='read')return current;reloads++;throw Error('Must not reload');},{initialCapture:h.initial,stagedCapture:after,reports:[]}),/Outside edits/);assert.equal(reloads,0);
});

test('real serialized association rehearsal restores through independently authorized reload without destructive controls',async()=>{
 for(const kind of ['resources','vocabularies']){
  const h=await harness(kind),snapshot=normalizeNativeCapture(h.initial),lesson={title:snapshot.lesson.title,frontMatter:structuredClone(snapshot.lesson.frontMatter),activities:[],sections:[],resources:[]};
  if(kind==='resources')lesson.resources=[Object.fromEntries(['key','name','type','audience','url'].map(k=>[k,h.record[k]]))];else lesson.frontMatter.vocabulary=[h.record.word+': '+h.record.definition];
  const pkg={schemaVersion:1,sandbox:h.initial.destination.url,status:'approved-locally',conflicts:[],review:{flags:[]},lesson,baseline:structuredClone(lesson),sharedRecords:{courseVersionId:77,resources:kind==='resources'?[h.record]:[],vocabularies:kind==='vocabularies'?[h.record]:[]}};
  let reloads=0;const listeners=new Set(),tabs={get:async()=>({url:h.initial.destination.url,discarded:false}),onUpdated:{addListener:fn=>listeners.add(fn),removeListener:fn=>listeners.delete(fn)},reload:async()=>{reloads++;h.linked[kind].length=0;for(const fn of [...listeners])fn(1,{status:'complete'},{url:h.initial.destination.url});}};
  const bridge=withReviewedReload(h.bridge,{tabs,tabId:1,destination:h.initial.destination}),result=await runAcceptedNativeRehearsal(bridge,pkg);
  assert.equal(result.status,'passed-and-restored',JSON.stringify({error:result.error,restore:result.restorationError}));assert.equal(h.selections,1);assert.equal(reloads,1);assert.equal(canonical(await h.read()),canonical(h.initial));assert.equal(listeners.size,0);assert.ok(h.calls.every(c=>!c.options.method||c.options.method==='GET'));
 }
});
