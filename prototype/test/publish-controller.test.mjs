import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createDemo} from '../dist/demo-transfer.mjs';
import {preparePublication,verifyPublicationReceipt} from '../dist/publishing.mjs';
import {packageProblems} from '../dist/transfer-core.mjs';
import {savedReport} from '../dist/destination-revisions.mjs';
function screen(store=new Map()){
 const elements=new Map(),downloads=[];
 const node=()=>({disabled:false,hidden:false,textContent:'',value:'',dataset:{},children:[],append(...values){this.children.push(...values);},replaceChildren(){this.children=[];},click(){if(this.download)downloads.push(this.download);}});
 const get=id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id);};
 const context=vm.createContext({document:{getElementById:get,createElement:node},location:new URL('http://localhost/publish.html?publication=test'),history:{replaceState(){}},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},sessionStorage:{getItem:()=>null},crypto,URL,Blob,setTimeout:()=>{},preparePublication,verifyPublicationReceipt,packageProblems,savedReport});
 vm.runInContext(readFileSync(new URL('../dist/publish-app.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,''),context);return {get,store,downloads};
}
const file=value=>({target:{files:[{size:100,text:async()=>JSON.stringify(value)}]}});
function sample(){const state=createDemo({title:'Synthetic review',objectives:['Observe','Explain'],resources:[],slides:[{id:'a',number:1,notes:'Activity (5 minutes)'},{id:'s',number:2,notes:'Discuss'}]});state.pkg.lesson.frontMatter.objectives=['Explain clearly','Observe carefully'];state.pkg.baseline=structuredClone(state.pkg.lesson);return {pkg:state.pkg,report:{mode:'native',destination:state.destination,checkpoint:{status:'baseline-read',freshSaved:state.server}}};}
test('publication screen confirms explicit mappings, revokes stale downloads, and retains choices across reload',async()=>{
 const {pkg,report}=sample(),ui=screen();await ui.get('package').onchange(file(pkg));await ui.get('baseline').onchange(file(report));assert.equal(ui.get('download-package').disabled,true);assert.equal(ui.get('objective-review').hidden,false);
 const selects=ui.get('objective-mappings').children.map(label=>label.children[0]);selects[0].value='1';selects[0].onchange();selects[1].value='0';selects[1].onchange();await ui.get('confirm-objectives').onclick();assert.equal(ui.get('download-package').disabled,false);
 let saved=JSON.parse(ui.store.get('lesson-publication-test'));assert.equal(saved.preflight.handoff.schemaVersion,3);assert.equal(saved.preflight.handoff.objectiveMapping.targets.length,2);ui.get('download-package').onclick();assert.equal(ui.downloads.length,1);
 const changed=ui.get('objective-mappings').children[0].children[0];changed.value='0';changed.onchange();assert.equal(ui.get('download-package').disabled,true);ui.get('download-package').onclick();assert.equal(ui.downloads.length,1);
 const reload=screen(ui.store);assert.equal(reload.get('download-package').disabled,true);assert.equal(reload.get('objective-mappings').children[0].children[0].value,'0');await reload.get('confirm-objectives').onclick();assert.equal(reload.get('download-package').disabled,true);assert.match(reload.get('status').textContent,/need attention/);
});
test('replacing the approved package clears destination and mapping evidence',async()=>{
 const {pkg,report}=sample(),ui=screen();await ui.get('package').onchange(file(pkg));await ui.get('baseline').onchange(file(report));await ui.get('package').onchange(file(pkg));const saved=JSON.parse(ui.store.get('lesson-publication-test'));assert.equal(saved.report,undefined);assert.equal(saved.preflight,undefined);assert.equal(ui.get('objective-review').hidden,true);assert.equal(ui.get('download-package').disabled,true);
});
