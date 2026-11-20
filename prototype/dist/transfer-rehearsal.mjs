import {clone,normalizedDraft,DESTINATION_ID,readPath} from './transfer-core.mjs';
import {SANDBOX} from './core.mjs';

export function makeRehearsal(pkg){
 const draft=normalizedDraft(pkg.lesson);
 const resources=draft.resources.map((r,index)=>({...r,key:'destination-resource-'+(index+1),destinationRecordId:'rehearsal-resource-'+(index+1)}));
 const keys=[...new Set(draft.activities.flatMap(a=>a.sections.flatMap(s=>s.progression?.levels.map(l=>l.key)||[])))];
 return {schemaVersion:1,kind:'browser-editor-snapshot',mode:'local-rehearsal',destination:{id:DESTINATION_ID,url:SANDBOX},
  lesson:{title:'',frontMatter:{teacherOverview:'',studentOverview:'',purpose:'',preparation:'',assessmentOpportunities:'',objectives:[],vocabulary:[]},resources:[],activities:[]},
  catalog:{resources,levels:keys.map((key,index)=>({key,verified:true,destinationLevelId:'rehearsal-level-'+(index+1)}))},
  blockers:[],raw:{fixture:true,notice:'Synthetic destination catalog for local engineering rehearsal only.',unknownSetting:{preserve:'unchanged'}}};
}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountRehearsal(container,initial,onChange=()=>{}){
 let snapshot=clone(initial);
 const paths=[];
 function collect(value,path=[]){
  if(path.length)paths.push(path);
  if(value&&typeof value==='object')for(const key of Object.keys(value))collect(value[key],[...path,Array.isArray(value)?Number(key):key]);
 }
 function render(){
  paths.length=0;collect(snapshot.lesson);
  container.innerHTML=`<h3>Isolated local editor controls</h3><p>This is a test harness, not the native Level Builder interface. No remote destination is connected. The runner operates these controls and reads the resulting editor state.</p><label for="rehearsal-path">Editor location</label><select id="rehearsal-path">${paths.map(path=>`<option value="${esc(JSON.stringify(path))}">${esc(path.join(' / '))}</option>`).join('')}</select><label for="rehearsal-kind">Edit action</label><select id="rehearsal-kind"><option value="set">Set field</option><option value="append">Append record</option></select><label for="rehearsal-value">Editor value (JSON)</label><textarea id="rehearsal-value" rows="4"></textarea><button type="button" id="rehearsal-apply">Apply local editor change</button><p id="rehearsal-error" role="alert"></p><details><summary>Complete current local editor state</summary><pre id="rehearsal-snapshot">${esc(JSON.stringify(snapshot,null,2))}</pre></details>`;
  container.querySelector('#rehearsal-apply').onclick=()=>{
   try{
    const path=JSON.parse(container.querySelector('#rehearsal-path').value),value=JSON.parse(container.querySelector('#rehearsal-value').value),kind=container.querySelector('#rehearsal-kind').value;
    if(!paths.some(p=>JSON.stringify(p)===JSON.stringify(path)))throw Error('Unknown editor location.');
    if(kind==='append'){const list=readPath(snapshot.lesson,path);if(!Array.isArray(list))throw Error('Choose a collection.');list.push(value);}
    else readPath(snapshot.lesson,path.slice(0,-1))[path.at(-1)]=value;
    render();onChange(clone(snapshot));
   }catch(error){container.querySelector('#rehearsal-error').textContent=error.message;}
  };
 }
 render();
 const set=(node,value)=>{const proto=node instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLTextAreaElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));};
 return {mode:'local-dom-rehearsal',
  read:async()=>JSON.parse(container.querySelector('#rehearsal-snapshot').textContent),
  apply:async op=>{
   set(container.querySelector('#rehearsal-path'),JSON.stringify(op.path));set(container.querySelector('#rehearsal-kind'),op.kind);set(container.querySelector('#rehearsal-value'),JSON.stringify(op.after));
   container.querySelector('#rehearsal-apply').click();
   const error=container.querySelector('#rehearsal-error').textContent;if(error)throw Error(error);
   await new Promise(resolve=>setTimeout(resolve,0));
  }
 };
}
