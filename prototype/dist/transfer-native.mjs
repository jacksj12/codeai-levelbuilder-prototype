import {DESTINATION_ID,TEXT_FIELDS} from './transfer-core.mjs';
import {validDestination} from './destination.mjs';
import {SANDBOX} from './core.mjs';

// This function is serialized by the browser extension: keep it self-contained.
// It only reads DOM already on the page. It makes no requests and clicks no controls.
export function captureAssignedEditor(){
 const paths=['/courses/6-12-dev-playground/units/16/lessons/11/edit','/s/scottsdale-levelbuilder-exploration/lessons/11/edit','/lessons/8898985/edit'];
 if(location.origin!=='https://levelbuilder-studio.code.org'||!paths.includes(location.pathname.replace(/\/$/,'')))throw Error('Open the assigned practice lesson editor. Other destinations are refused.');
 const bootstrap=document.querySelector('script[data-lesson]');if(!bootstrap)throw Error('The native editor identity was not found.');
 const saved=JSON.parse(bootstrap.getAttribute('data-lesson'));if(saved.id!==8898985)throw Error('The native lesson identity does not match.');
 const blockers=[],fields={};
 const labels={title:'Title',teacherOverview:'Overview',studentOverview:'Student Overview',purpose:'Purpose',preparation:'Preparation',assessmentOpportunities:'Assessment Opportunities'};
 for(const [key,label] of Object.entries(labels)){
  const matches=[...document.querySelectorAll('label')].filter(el=>[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()===label);
  const input=matches.length===1?matches[0].querySelector(key==='title'?'input:not([type="checkbox"])':'textarea'):null;
  if(!input)blockers.push('Cannot uniquely read '+label+' from the deployed editor.');else fields[key]=input.value;
 }
 const hidden={};
 for(const key of ['activities','objectives']){
  const nodes=document.querySelectorAll('input[type="hidden"][name="'+key+'"]');
  if(nodes.length!==1)blockers.push('Cannot read current '+key+'.');else hidden[key]=JSON.parse(nodes[0].value);
 }
 const tables=[...document.querySelectorAll('table')].filter(table=>{
  const headers=[...table.querySelectorAll('thead th')].map(cell=>cell.textContent.trim());return ['Key','Name','Type','Audience','URL','Actions'].every((label,index)=>headers[index]===label);
 });
 let resources=[];
 if(tables.length!==1)blockers.push('Cannot uniquely read the current resource table.');
 else resources=[...tables[0].querySelectorAll('tbody tr')].map(row=>{const cells=[...row.querySelectorAll('td')];return {key:cells[0]?.textContent.trim(),name:cells[1]?.textContent.trim(),type:cells[2]?.textContent.trim(),audience:cells[3]?.textContent.trim(),url:cells[4]?.textContent.trim()};});
 if([...document.querySelectorAll('[role="dialog"],dialog[open]')].some(el=>el.getClientRects().length))blockers.push('Finish or cancel the open native editor dialog before capturing.');
 // Vocabulary editing and associations are deliberately not inferred from saved data.
 blockers.push('Native vocabulary and unknown-setting live-state mapping need verification before native staging.');
 return {schemaVersion:1,kind:'native-dom-capture',destination:{id:8898985,url:'https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11'},saved,live:{fields,activities:hidden.activities||[],objectives:hidden.objectives||[],resources},blockers,remoteWrites:false};
}
const tipNames={teachingTip:'Teaching Tip',contentCorner:'Content Corner',discussionGoal:'Discussion Goal',assessmentOpportunity:'Assessment Opportunity',ethicsOpportunity:'Ethics Opportunity'};
export function normalizeNativeCapture(capture){
 if(capture?.kind!=='native-dom-capture'||!validDestination(capture.destination))throw Error('Choose a capture of the assigned practice lesson.');
 const {saved,live}=capture,blockers=[...(capture.blockers||[])],catalog={resources:[],levels:[]};
 const nativeMinutes=(value,label)=>{
  if(value===''||value==null)return null;
  const number=typeof value==='string'&&/^(0|[1-9]\d*)$/.test(value)?Number(value):value;
  if(typeof number!=='number'||!Number.isSafeInteger(number)||number<0){blockers.push(label+' has invalid or non-whole-minute timing.');return value;}
  return number;
 };
 if(saved?.id!==capture.destination.id||!Array.isArray(saved.resources)||!Array.isArray(live.activities)||!Array.isArray(live.objectives)||!Array.isArray(live.resources))throw Error('The native capture is incomplete.');
 const frontMatter={};for(const key of TEXT_FIELDS){frontMatter[key]=live.fields[key]??'';if(typeof live.fields[key]!=='string')blockers.push('Current '+key+' was not captured.');}
 frontMatter.objectives=live.objectives.map(o=>o.description);
 frontMatter.vocabulary=(live.vocabularies||saved.vocabularies||[]).map(v=>v.word+': '+v.definition);
 if(capture.readerVersion==='native-scalars-v1'&&(!Array.isArray(live.vocabularies)||!capture.protection))blockers.push('Current vocabulary or unmanaged native settings were not captured.');
 for(const resource of live.resources){
  const savedRecord=saved.resources.find(r=>r.key===resource.key);
  catalog.resources.push({...resource,...(savedRecord?.markdownKey?{markdownKey:savedRecord.markdownKey}:{}),destinationRecordId:savedRecord?.id||null});
 }
 let position=0;
 const activities=live.activities.map(a=>({title:a.name??a.displayName??'',duration:nativeMinutes(a.duration,'Activity'),sections:(a.activitySections||[]).map(s=>{
  const levels=(s.scriptLevels||[]).map(sl=>{
   const active=sl.levels?.find(l=>String(l.id)===String(sl.activeId))||sl.levels?.[0];
   if(!active?.name){blockers.push('A native level could not be uniquely identified.');return {key:'Unmapped native level',number:++position,assessment:Boolean(sl.assessment)};}
   if((sl.levels||[]).length!==1)blockers.push('Native level variants require explicit mapping before transfer.');
   const level={key:active.name,number:++position,assessment:Boolean(sl.assessment)};
   catalog.levels.push({key:active.name,verified:true,destinationLevelId:active.id,destinationAssociationId:sl.id});return level;
  });
  return {title:s.name??s.displayName??'',duration:nativeMinutes(s.duration,'Section'),body:s.description??s.text??'',remarks:Boolean(s.remarks),
   callouts:(s.tips||[]).map(t=>({type:tipNames[t.type]||t.type,body:t.markdown||''})),progression:levels.length?{title:s.progressionName||'',levels}:null};
 })}));
 return {schemaVersion:1,kind:'browser-editor-snapshot',destination:structuredClone(capture.destination),mode:'native-read-only',
  lesson:{title:live.fields.title??'',frontMatter,resources:catalog.resources.map(r=>({...r})),activities},catalog,
  blockers:[...new Set(blockers)],...(capture.protection?{nativeProtection:structuredClone(capture.protection)}:{}),raw:structuredClone(capture)};
}
