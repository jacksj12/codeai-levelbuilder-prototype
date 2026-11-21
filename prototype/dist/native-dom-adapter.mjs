import {clone,digest,canonical,TEXT_FIELDS} from './transfer-core.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';

// Serialized into the active tab. Only the explicit approved-save branch may
// send a write; ordinary staging never invokes remote Save.
export async function nativeEditorBridge(request={action:'read'}){
 let diagnosticCapture;
 try{
 if(typeof request==='string')request=JSON.parse(request);
 const checkDeadline=()=>{if(Number.isFinite(request.deadlineAt)&&Date.now()>request.deadlineAt)throw Error('The native operation expired before the next change. No further control was changed.');};
 const settle=()=>new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=()=>{channel.port1.close();channel.port2.close();resolve();};channel.port2.postMessage(null);});
 const selected=request.destination;
 const destination=selected||{id:8898985,url:'https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11'};
 if(selected&&(request.practiceConfirmed!==true||!Number.isSafeInteger(selected.id)||selected.id<1||selected.url!=='https://levelbuilder-studio.code.org/lessons/'+selected.id+'/edit'))throw Error('Invalid selected destination.');
 const aliases=['/courses/6-12-dev-playground/units/16/lessons/11/edit','/s/scottsdale-levelbuilder-exploration/lessons/11/edit','/lessons/8898985/edit'];
 const fixture=request.fixture===true&&location.protocol==='http:'&&['127.0.0.1','localhost'].includes(location.hostname)&&location.pathname==='/native-adapter-fixture.html'&&document.querySelector('script[data-native-adapter-fixture="true"]');
 if(!fixture&&(location.origin!=='https://levelbuilder-studio.code.org'||!(selected?location.href===selected.url:aliases.includes(location.pathname.replace(/\/$/,'')))))throw Error('This is not the assigned sandbox editor. Official and unknown lessons are refused.');
 const labels={title:'Title',teacherOverview:'Overview',studentOverview:'Student Overview',purpose:'Purpose',preparation:'Preparation',assessmentOpportunities:'Assessment Opportunities'};
 const labelNode=label=>{
  const matches=[...document.querySelectorAll('#edit-container label')].filter(el=>[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()===label);
  if(matches.length!==1)throw Error('Cannot uniquely locate '+label+'.');return matches[0];
 };
 const fieldNode=key=>{const nodes=labelNode(labels[key]).querySelectorAll(key==='title'?'input:not([type="checkbox"])':'textarea');if(nodes.length!==1)throw Error('Missing or ambiguous editor field '+labels[key]+'.');return nodes[0];};
 const tableFor=headers=>{
  const tables=[...document.querySelectorAll('#edit-container table')].filter(t=>{const actual=[...t.querySelectorAll('thead th')].map(c=>c.textContent.trim());return actual.length===headers.length&&actual.every((h,i)=>h===headers[i]);});
  if(tables.length!==1)throw Error('Cannot uniquely read the '+headers.join('/')+' table.');return tables[0];
 };
 function sharedSearchRoot(table){let root=table.parentElement;while(root&&root.id!=='edit-container'){const tables=root.querySelectorAll('table'),inputs=root.querySelectorAll('.Select-input input');if(tables.length===1&&inputs.length===1)return root;if(tables.length>1)break;root=root.parentElement;}return null;}
 function read(){
  const bootstrap=document.querySelector('script[data-lesson]');if(!bootstrap)throw Error('Lesson identity evidence is missing.');
  const saved=JSON.parse(bootstrap.getAttribute('data-lesson'));if(saved.id!==destination.id)throw Error('The sandbox lesson identity does not match.');
  const blockers=[],fields={},managed=new Set();
  for(const key of Object.keys(labels))try{const node=fieldNode(key);fields[key]=node.value;managed.add(node);}catch(error){blockers.push(error.message);}
  const hidden={};
  for(const key of ['activities','objectives']){
   const nodes=document.querySelectorAll('#edit-container input[type="hidden"][name="'+key+'"]');
   try{if(nodes.length!==1)throw Error('missing or ambiguous');const value=JSON.parse(nodes[0].value);if(!Array.isArray(value))throw Error('not a list');hidden[key]=value;}catch{blockers.push('Current '+key+' serialization is unavailable. Do not substitute saved content for it.');hidden[key]=[];}
  }
  let resources=[],vocabularies=[];
  try{resources=[...tableFor(['Key','Name','Type','Audience','URL','Actions']).querySelectorAll('tbody tr')].map(row=>{const cells=[...row.querySelectorAll('td')];if(cells.length!==6)throw Error('Unexpected resource row.');return {key:cells[0].textContent.trim(),name:cells[1].textContent.trim(),type:cells[2].textContent.trim(),audience:cells[3].textContent.trim(),url:cells[4].textContent.trim()};});}catch(error){blockers.push(error.message);}
  try{vocabularies=[...tableFor(['Word','Definition','Actions']).querySelectorAll('tbody tr')].map(row=>{const cells=[...row.querySelectorAll('td')];if(cells.length!==3)throw Error('Unexpected vocabulary row.');return {word:cells[0].textContent.trim(),definition:cells[1].textContent.trim()};});}catch(error){blockers.push(error.message);}
  if([...document.querySelectorAll('[role="dialog"],[role="alertdialog"],dialog[open],.modal-content')].some(el=>el.getClientRects().length))blockers.push('Finish or cancel the open editor dialog first.');
  const objectiveTables=[...document.querySelectorAll('#edit-container table')].filter(t=>t.querySelector('thead')?.textContent.includes('Description')&&t.querySelector('thead')?.textContent.includes('Levels'));
  if(objectiveTables.some(t=>t.querySelector('tbody tr > td:first-child textarea,tbody tr > td:first-child input:not([type="checkbox"]),tbody tr > td:first-child [contenteditable="true"]')))blockers.push('Finish or cancel the inline objective edit first.');
  const cards=[...document.querySelectorAll('.uitest-activity-card')];
  if(cards.length!==hidden.activities.length)blockers.push('Activity controls do not match current serialized activities.');
  hidden.activities.forEach((activity,index)=>{
   const card=cards[index],areas=card?.querySelectorAll('textarea');
   if(areas?.length!==(activity.activitySections||[]).length){blockers.push('Section controls do not match activity '+(index+1)+'.');return;}
   const name=card.querySelectorAll('.uitest-activity-name-input'),duration=card.querySelectorAll('.uitest-activity-duration-input');
   if(name.length!==1||duration.length!==1||name[0].value!==(activity.name??activity.displayName??'')||duration[0].value!==String(activity.duration??''))blockers.push('An activity field has uncommitted or ambiguous state.');
   (activity.activitySections||[]).forEach((section,si)=>{
    const area=areas[si],header=area.parentElement.firstElementChild,inputs=header?.querySelectorAll('input:not([type="checkbox"])'),checks=header?.querySelectorAll('input[type="checkbox"]');
    if(inputs?.length!==2||checks?.length!==1||inputs[0].value!==(section.name??section.displayName??'')||inputs[1].value!==String(section.duration??'')||checks[0].checked!==Boolean(section.remarks)||area.value!==(section.description??section.text??''))blockers.push('A section field has uncommitted or ambiguous state.');
   });
  });
  for(const headers of [['Key','Name','Type','Audience','URL','Actions'],['Word','Definition','Actions']]){try{const root=sharedSearchRoot(tableFor(headers));if(root)for(const input of root.querySelectorAll('.Select-input input'))managed.add(input);}catch{}}
  // Protect all unrelated entity properties, associations, current controls and tables.
  // Known scalar changes are represented in the normalized lesson instead.
  const unmanagedActivities=structuredClone(hidden.activities);
  for(const activity of unmanagedActivities){delete activity.name;delete activity.displayName;delete activity.duration;for(const section of activity.activitySections||[]){for(const key of ['name','displayName','duration','description','text','remarks'])delete section[key];}}
  const controls=[...document.querySelectorAll('#edit-container input,#edit-container select,#edit-container textarea')].filter(node=>!managed.has(node)&&!node.closest('.uitest-activity-card')&&!['hidden','password','file'].includes(node.type)&&!/(auth|token|secret|session|password)/i.test(node.name||''))
   .map(node=>({tag:node.tagName,type:node.type,name:node.name||'',label:node.closest('label')?[...node.closest('label').childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim():'',value:node.type==='checkbox'||node.type==='radio'?node.checked:node.value}));
  // Headerless tables inside a level token are derived usage previews. Their
  // underlying associations/settings are protected in unmanagedActivities.
  const otherTables=[...document.querySelectorAll('#edit-container table')].filter(table=>{if(!table.querySelector('thead')&&table.querySelector('.uitest-ProgressPill'))return false;if(table.querySelector('thead'))return true;let parent=table.parentElement;while(parent&&!parent.classList.contains('uitest-activity-card')){if([...parent.children].some(n=>n.classList.contains('uitest-level-token-name')))return false;parent=parent.parentElement;}return true;}).map(table=>({headers:[...table.querySelectorAll('thead th')].map(c=>c.textContent.trim()),rows:[...table.querySelectorAll('tbody tr')].map(row=>row.textContent.trim())})).filter(t=>!['Key|Name|Type|Audience|URL|Actions','Word|Definition|Actions','Description|Levels|Actions'].includes(t.headers.join('|')));
  return {schemaVersion:1,kind:'native-dom-capture',readerVersion:'native-scalars-v1',fixture:Boolean(fixture),destination:structuredClone(destination),saved,
   live:{fields,activities:hidden.activities,objectives:hidden.objectives,resources,vocabularies},
   protection:{bootstrap:saved,unmanagedActivities,objectives:structuredClone(hidden.objectives),resources:structuredClone(resources),vocabularies:structuredClone(vocabularies),controls,otherTables},blockers,remoteWrites:false};
 }
 const stable=value=>Array.isArray(value)?'['+value.map(stable).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}':JSON.stringify(value);
 const fingerprint=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stable(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');
 if(request.action==='read')return read();
 if(request.action==='authorize-reviewed-reload'){
  if(request.mode!=='restore-reviewed-rehearsal'||request.initialCapture?.saved?.id!==destination.id)throw Error('Invalid rehearsal restore point.');const current=read();if(current.blockers.length||await fingerprint(current)!==request.expectedCaptureDigest||stable(current.saved)!==stable(request.initialCapture.saved))throw Error('Outside edits prevent editor restoration.');
  const response=await fetch('/lessons/'+destination.id+'/edit',{credentials:'same-origin',redirect:'error',cache:'no-store'});if(!response.ok)throw Error('Saved baseline verification failed before restoration.');const doc=new DOMParser().parseFromString(await response.text(),'text/html'),saved=JSON.parse(doc.querySelector('script[data-lesson]')?.getAttribute('data-lesson')||'null');if(stable(saved)!==stable(request.initialCapture.saved))throw Error('The saved lesson changed. Preserve the editor instead of reloading.');checkDeadline();if(await fingerprint(read())!==request.expectedCaptureDigest)throw Error('Outside edits appeared during restoration checks.');return {kind:'reviewed-reload-authorization',captureDigest:request.expectedCaptureDigest,baselineDigest:await fingerprint(saved)};
 }

 checkDeadline();
 if(request.action==='save-approved-review'||request.action==='save-approved-cleanup'){
  const cleanup=request.action==='save-approved-cleanup';
  if(fixture||request.mode!==(cleanup?'explicit-approved-cleanup':'explicit-approved-save')||request.approval?.approved!==true)throw Error('Explicit approval for this playground save is required.');
  const review=request.review,copy=structuredClone(review);delete copy.id;
  if(review.kind!==(cleanup?'native-cleanup-review':'native-save-review')||await fingerprint(copy)!==review.id||Date.now()>review.expiresAt||review.destination.id!==destination.id||review.destination.url!==destination.url)throw Error('The approved review is invalid or expired.');
  const req=review.request;
  if(req.method!=='PUT'||req.url!=='https://levelbuilder-studio.code.org/lessons/'+destination.id||req.contentType!=='application/json;charset=UTF-8')throw Error('The approved save target changed.');
  const payload=JSON.parse(req.body),semantic=structuredClone(payload);
  for(const key of ['objectives','activities','resources','vocabularies','programmingExpressions','standards','opportunityStandards','jitPlConceptIds','announcements','originalLessonData'])semantic[key]=JSON.parse(semantic[key]);
  const approvedDigest=await fingerprint({method:req.method,url:req.url,contentType:req.contentType,payload:semantic,...(review.transport?{transport:review.transport}:{}),...(review.preservationTest?{preservationTest:true}:{})});
  if(approvedDigest!==request.approval.approvedRequestDigest)throw Error('The request does not match the user-approved save.');
  const current=read();if(current.blockers.length||await fingerprint(current)!==request.expectedCaptureDigest)throw Error('The editor changed before saving.');
  const fresh=await fetch('/lessons/'+destination.id+'/edit',{credentials:'same-origin',redirect:'error',cache:'no-store'});
  if(!fresh.ok)throw Error('The final saved-baseline check failed.');
  const doc=new DOMParser().parseFromString(await fresh.text(),'text/html'),raw=doc.querySelector('script[data-lesson]')?.getAttribute('data-lesson');
  if(!raw||raw!==payload.originalLessonData||await fingerprint(JSON.parse(raw))!==review.baselineDigest)throw Error('Saved content changed. The save was blocked.');
  if(cleanup){
   const source=review.sourceReceipt,sourceReview=source?.review,sourceCopy=structuredClone(sourceReview||{});delete sourceCopy.id;
   if(source?.status!=='saved-and-verified'||source.attempted!==true||source.verification?.passed!==true||sourceReview?.destination.id!==destination.id||await fingerprint(sourceCopy)!==sourceReview.id)throw Error('Cleanup ownership evidence is invalid.');
   const freshSaved=JSON.parse(raw),expected=structuredClone(freshSaved),seen=new Set();
   const groups=[...sourceReview.changes,...(sourceReview.sectionAdditions||[]).filter(c=>c.section.scriptLevels.length).map(c=>{
    const activity=source.readback.activities[c.activityIndex];if(!c.newActivity&&activity.id!==c.activityId)throw Error('Cleanup section activity changed.');
    return {newSection:true,sectionId:activity.activitySections[c.sectionIndex].id,addLevels:c.section.scriptLevels.map(sl=>({levelId:sl.levels[0].id,assessment:sl.assessment}))};
   })];
   if(!Array.isArray(review.removals)||!review.removals.length||review.removals.length!==groups.length)throw Error('Cleanup scope is incomplete.');
   for(const removal of review.removals){
    if(seen.has(removal.sectionId))throw Error('Duplicate cleanup section.');seen.add(removal.sectionId);
    const find=lesson=>lesson.activities.flatMap(a=>a.activitySections).find(s=>s.id===removal.sectionId);
    const change=groups.find(c=>c.sectionId===removal.sectionId),original=change?.newSection?{scriptLevels:[],progressionName:null}:find(sourceReview.baseline),recorded=find(source.readback),current=find(freshSaved),target=find(expected);
    if(!original||!recorded||!current||!change||original.scriptLevels.length||stable(current.scriptLevels)!==stable(recorded.scriptLevels)||current.progressionName!==recorded.progressionName||recorded.scriptLevels.length!==change.addLevels.length)throw Error('Saved test links changed or ownership is incomplete.');
    for(const [i,link]of recorded.scriptLevels.entries())if(!link.id||link.levels?.length!==1||String(link.levels[0].id)!==String(change.addLevels[i].levelId)||Boolean(link.assessment)!==Boolean(change.addLevels[i].assessment))throw Error('Cleanup link identity differs from the saved test.');
    target.scriptLevels=structuredClone(original.scriptLevels);target.progressionName=original.progressionName;
   }
   if(stable(expected)!==stable(review.expectedSaved)||stable(semantic.activities)!==stable(expected.activities))throw Error('Cleanup includes unreviewed content changes.');
   const allowed=['name','overview','studentOverview','assessmentOpportunities','purpose','preparation','lockable','hasLessonPlan','creativeCommonsLicense','background','assessment','unplugged','objectives','activities','resources','vocabularies','programmingExpressions','standards','opportunityStandards','jitPlConceptIds','announcements','originalLessonData'];
   if(Object.keys(semantic).length!==allowed.length||Object.keys(semantic).some(k=>!allowed.includes(k)))throw Error('Unexpected cleanup request fields.');
   for(const k of allowed.slice(0,12))if(stable(semantic[k])!==stable(freshSaved[k]))throw Error('Cleanup changes unrelated lesson fields.');
   const collections={objectives:freshSaved.objectives,resources:freshSaved.resources.map(r=>r.key),vocabularies:freshSaved.vocabularies.map(r=>r.key),programmingExpressions:freshSaved.programmingExpressions,standards:freshSaved.standards,opportunityStandards:freshSaved.opportunityStandards,jitPlConceptIds:freshSaved.jitPlConcepts.map(r=>r.id),announcements:freshSaved.announcements};
   for(const [k,v]of Object.entries(collections))if(stable(semantic[k])!==stable(v))throw Error('Cleanup changes unrelated collections.');
  }
  if(!cleanup&&review.transport==='native-editor'){
   // Use the deployed editor's own serializer and authenticated save handler.
   // The durable attempt is already recorded. Never fall back to an API send.
   const buttons=[...document.querySelectorAll('#edit-container button')].filter(b=>b.textContent.trim()==='Save and Keep Editing'&&b.getClientRects().length);
   if(buttons.length!==1||buttons[0].disabled)throw Error('The native Save and Keep Editing control is unavailable or ambiguous. No save was clicked.');
   const button=buttons[0],savedMarker=()=>document.body.textContent.match(/Last saved at:[^\n\r]*/)?.[0]||'',beforeMarker=savedMarker();
   checkDeadline();if(await fingerprint(read())!==request.expectedCaptureDigest)throw Error('The editor changed before the native save.');
   return await new Promise(resolve=>{
    let observer,timer,finished=false;
    const finish=outcome=>{if(finished)return;finished=true;observer?.disconnect();clearTimeout(timer);resolve({kind:'native-save-result',attempted:true,transport:'native-editor',outcome,saveRetried:false});};
    const inspect=()=>{if(!button.disabled&&savedMarker()!==beforeMarker)finish('native-editor-acknowledged');};
    observer=new MutationObserver(inspect);observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true});
    timer=setTimeout(()=>finish('unknown'),Math.max(1,Math.min(10000,(request.deadlineAt??Date.now()+10000)-Date.now())));
    try{button.click();inspect();}catch{finish('unknown');}
   });
  }
  const csrf=document.querySelector('meta[name="csrf-token"]')?.content;
  if(!csrf)throw Error('The editor sign-in token is unavailable.');
  checkDeadline();if(await fingerprint(read())!==request.expectedCaptureDigest)throw Error('The editor changed during the final check.');
  // The controller persisted the attempt before this call. Never retry here.
  try{
   const response=await fetch('/lessons/'+destination.id,{method:'PUT',credentials:'same-origin',redirect:'error',headers:{'Content-Type':req.contentType,'Accept':'application/json','X-Requested-With':'XMLHttpRequest','X-CSRF-Token':csrf},body:req.body});
   let errorMessage,responseSummary;
   if(response.ok){
    // Keep only allowlisted lesson identities/counts, never an HTML page,
    // arbitrary JSON, response headers, or authentication/session fields.
    responseSummary={kind:'unexpected-response'};
    if((response.headers.get('Content-Type')||'').includes('application/json')){
     try{
      const data=await response.json();
      const numeric=value=>(typeof value==='number'||typeof value==='string'&&/^\d+$/.test(value))&&Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null;
      if(numeric(data?.id)&&Array.isArray(data.activities)&&data.activities.every(a=>a&&Array.isArray(a.activitySections)&&a.activitySections.every(s=>s&&Array.isArray(s.scriptLevels)&&s.scriptLevels.every(sl=>sl&&Array.isArray(sl.levels)&&sl.levels.every(l=>l&&numeric(l.id)))))){
       const sections=data.activities.flatMap(a=>a.activitySections),links=sections.flatMap(s=>s.scriptLevels.map(sl=>({sectionId:numeric(s.id),associationId:numeric(sl.id),levelIds:sl.levels.slice(0,20).map(l=>numeric(l.id)),assessment:sl.assessment===true})));
       responseSummary={kind:'lesson-summary',lessonId:numeric(data.id),activities:data.activities.length,sections:sections.length,levelAssociations:links.length,associations:links.slice(0,200),truncated:links.length>200||sections.some(s=>s.scriptLevels.some(sl=>sl.levels.length>20))};
      }else responseSummary={kind:'unexpected-json'};
     }catch{responseSummary={kind:'unreadable-json'};}
    }
   }
   if(!response.ok){
    const contentType=response.headers.get('Content-Type')||'',text=await response.text();
    if(contentType.includes('text/plain'))errorMessage=text;
    else if(contentType.includes('application/json')){try{const value=JSON.parse(text);errorMessage=typeof value.error==='string'?value.error:typeof value.message==='string'?value.message:'The server returned an error response.';}catch{errorMessage='The server returned an unreadable error response.';}}
    else{const errorDoc=new DOMParser().parseFromString(text,'text/html');errorMessage=errorDoc.querySelector('h1')?.textContent||errorDoc.title||'The server returned an error page.';}
    // Retain the explanation, never an HTML page or authentication fields.
    errorMessage=errorMessage.split('\n').filter(line=>!/(csrf|token|secret|password|session|authorization|cookie)/i.test(line)).join('\n').trim().slice(0,2000)||'The server rejected the save.';
   }
   return {kind:'native-save-result',attempted:true,httpStatus:response.status,ok:response.ok,outcome:response.ok?'response-received':'rejected',...(responseSummary?{responseSummary}:{}),...(errorMessage?{errorMessage}:{})};
  }catch(error){return {kind:'native-save-result',attempted:true,outcome:'unknown',error:String(error.message)};}
 }
 if(['lookup-shared-record','append-shared-association'].includes(request.action)){
  const before=read();if(before.blockers.length||await fingerprint(before)!==request.expectedCaptureDigest)throw Error('The editor changed before shared-record lookup or association.');
  const op=request.operation,kind=request.kind||(op?.path[0]==='resources'?'resources':'vocabularies'),record=request.record||op?.record;
  if(!['resources','vocabularies'].includes(kind)||!record||!Number.isSafeInteger(record.id)||!record.key)throw Error('The shared-record identity is missing.');
  const script=document.querySelector('script[data-lesson][data-unitforlesson]'),unit=JSON.parse(script?.getAttribute('data-unitforlesson')||'null');if(!Number.isSafeInteger(unit?.courseVersionId)||unit.courseVersionId<1||request.action==='lookup-shared-record'&&unit.courseVersionId!==request.courseVersionId)throw Error('The native course scope differs from the shared-record review.');
  const query=kind==='resources'?record.name:record.word;if(typeof query!=='string'||query.trim().length<3||query.length>255)throw Error('Shared records require a searchable name.');
  checkDeadline();const response=await fetch('/'+kind+'/search?'+new URLSearchParams({query,limit:'40',courseVersionId:String(unit.courseVersionId)}),{credentials:'same-origin',redirect:'error',cache:'no-store',headers:{'X-Requested-With':'XMLHttpRequest'}});if(!response.ok)throw Error('Shared-record verification failed.');const records=await response.json();if(!Array.isArray(records)||records.length>=40||records.filter(r=>stable(r)===stable(record)).length!==1)throw Error('The shared record changed or its search is incomplete.');
  // React Select shows labels, not identities, and may return only seven options.
  // A unique visible option cannot distinguish same-label records outside that window.
  const sharedLabel=value=>kind==='resources'?value.name+' - '+value.url:value.word+' - '+value.definition;
  if(records.filter(value=>sharedLabel(value)===sharedLabel(record)).length!==1)throw Error('Shared-record search is ambiguous: several records have the same label.');
  if(request.action==='lookup-shared-record'){const after=read();if(stable(after)!==stable(before))throw Error('The editor changed during shared-record lookup.');return {kind:'native-shared-mapping',record,capture:after};}
  if(request.mode!=='unsaved-structure-staging'||op.kind!=='append'||!(kind==='resources'?stable(op.path)==='["resources"]':stable(op.path)==='["frontMatter","vocabulary"]'))throw Error('Only reviewed new associations are supported.');
  const table=tableFor(kind==='resources'?['Key','Name','Type','Audience','URL','Actions']:['Word','Definition','Actions']),root=sharedSearchRoot(table),inputs=root?.querySelectorAll('.Select-input input');if(inputs?.length!==1)throw Error('The native shared-record search control is ambiguous.');
  if(kind==='resources'?before.live.resources.some(r=>r.key===record.key):before.live.vocabularies.some(v=>v.word===record.word&&v.definition===record.definition))throw Error('This shared record is already associated.');
  if(!inputs[0].getClientRects().length){const panel=kind==='resources'?'Resources':'Vocabulary',headings=[...document.querySelectorAll('#edit-container h2 button')].filter(b=>b.textContent.trim()===panel);if(headings.length!==1)throw Error('The shared-record panel is ambiguous.');headings[0].click();}
  if(!inputs[0].getClientRects().length||inputs[0].disabled)throw Error('The shared-record search is unavailable.');
  checkDeadline();inputs[0].focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(inputs[0],query);inputs[0].dispatchEvent(new Event('input',{bubbles:true}));inputs[0].dispatchEvent(new Event('change',{bubbles:true}));
  const label=kind==='resources'?record.name+' - '+record.url:record.word+' - '+record.definition;
  const option=await new Promise((resolve,reject)=>{let observer,timer;const finish=(error,value)=>{observer?.disconnect();clearTimeout(timer);error?reject(error):resolve(value);};const inspect=()=>{try{checkDeadline();const options=[...root.querySelectorAll('.Select-option')].filter(n=>n.getClientRects().length&&n.textContent.trim()===label);if(options.length>1)finish(Error('More than one native search option matches this record.'));else if(options.length===1)finish(null,options[0]);}catch(error){finish(error);}};observer=new MutationObserver(inspect);observer.observe(root,{childList:true,subtree:true,attributes:true,characterData:true});timer=setTimeout(()=>finish(Error('The native shared-record search did not return the reviewed option.')),Math.max(1,Math.min(10000,(request.deadlineAt||Date.now()+10000)-Date.now())));inspect();});
  if(stable(read())!==stable(before))throw Error('Outside edits appeared before adding the shared association.');checkDeadline();option.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();return read();
 }
 if(['lookup-levels','append-progression','clear-owned-progression'].includes(request.action)){
  const before=read();if(before.blockers.length)throw Error(before.blockers.join(' '));
  if(await fingerprint(before)!==request.expectedCaptureDigest)throw Error('The editor changed before level lookup or linking.');
  const path=request.operation?.path||['activities',0,'sections',0,'progression'],ai=path[1],si=path[3];
  if(path.length!==5||path[0]!=='activities'||path[2]!=='sections'||path[4]!=='progression'||!Number.isInteger(ai)||!Number.isInteger(si)||ai<0||si<0)throw Error('Unsupported level location.');
  const activity=before.live.activities[ai],section=activity?.activitySections[si],card=[...document.querySelectorAll('.uitest-activity-card')][ai],area=card?.querySelectorAll('textarea')[si],root=area?.parentElement;
  if(!section||!root)throw Error('The native section for level lookup is missing.');
  const modalFor=()=>[...document.querySelectorAll('.modal-content')].find(n=>n.getClientRects().length&&[...n.querySelectorAll('h2')].some(h=>h.textContent.trim()==='Add Levels'));
  const wait=predicate=>new Promise((resolve,reject)=>{
   let observer,timer;
   const finish=(error,value)=>{observer?.disconnect();clearTimeout(timer);error?reject(error):resolve(value);};
   const inspect=()=>{try{checkDeadline();const value=predicate();if(value)finish(null,value);}catch(error){finish(error);}};
   observer=new MutationObserver(inspect);observer.observe(document.body,{childList:true,subtree:true,attributes:true,characterData:true});
   timer=setTimeout(()=>finish(Error('The native level picker did not return an exact match before its deadline.')),Math.max(1,(request.deadlineAt||Date.now()+11000)-Date.now()));inspect();
  });
  const setControl=(node,value)=>{const proto=node.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));};
  const closePicker=async()=>{const modal=modalFor();if(modal){const buttons=[...modal.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Close and save');if(buttons.length!==1)throw Error('The level picker close control is ambiguous.');buttons[0].click();await settle();}};
  const openPicker=async()=>{
   checkDeadline();const buttons=root.querySelectorAll('button.uitest-open-add-level-button');if(buttons.length!==1)throw Error('The native level picker is ambiguous.');buttons[0].click();
   return wait(()=>{const modal=modalFor();return modal?.querySelector('input.uitest-add-level-name-input')?modal:null;});
  };
  const search=async(modal,name)=>{
   const input=modal.querySelector('input.uitest-add-level-name-input'),filters=input.parentElement.parentElement,selects=filters.querySelectorAll('select');
   if(selects.length!==3)throw Error('Unexpected native level filters.');
   for(const select of selects)if(select.value!=='')setControl(select,'');setControl(input,name);await settle();
   const searchIcons=filters.querySelectorAll('.fa-magnifying-glass');if(searchIcons.length!==1)throw Error('The native level search is ambiguous.');checkDeadline();searchIcons[0].closest('button').click();
   return wait(()=>{
    const table=[...modal.querySelectorAll('table')].find(t=>[...t.querySelectorAll('thead th')].map(n=>n.textContent.trim()).join('|')==='Actions|Name|Type|Owner|Last Updated');
    if(!table)return null;
    const rows=[...table.querySelectorAll('tbody tr')].filter(row=>row.querySelectorAll('td')[1]?.textContent.trim()===name);
    if(rows.length>1)throw Error('More than one existing level exactly matches '+name+'.');
    if(!rows.length){if(modal.textContent.includes('There are no levels matching the search you entered.'))throw Error('No existing level exactly matches '+name+'.');return null;}
    if([...modal.querySelectorAll('button')].some(b=>/^\d+$/.test(b.textContent.trim())&&b.textContent.trim()!=='1'))throw Error('The exact level search has multiple result pages; a unique mapping cannot be established.');
    return rows[0];
   });
  };
  const titleNode=()=>{const labels=[...root.querySelectorAll('label')].filter(n=>[...n.childNodes].filter(c=>c.nodeType===3||c.nodeType===1&&c.tagName==='SPAN').map(c=>c.textContent).join('').trim()==='Progression Title:');if(labels.length!==1||labels[0].querySelectorAll('input').length!==1)throw Error('The progression title is ambiguous.');return labels[0].querySelector('input');};
  const names=request.action==='lookup-levels'?request.names:request.action==='append-progression'?request.operation?.after?.levels?.map(l=>l.key):request.operation?.expectedLevels?.map(l=>l.key);
  if(!Array.isArray(names)||!names.length||names.length>8||new Set(names).size!==names.length||names.some(n=>typeof n!=='string'||!n.trim()||n.length>250))throw Error('Choose up to eight distinct exact level names.');
  const mappings=[];
  try{
   if(request.action==='lookup-levels'){
    for(const name of names){const modal=await openPicker(),row=await search(modal,name),cells=row.querySelectorAll('td');mappings.push({key:name,verified:true,verification:'exact-native-picker-row',type:cells[2].textContent.trim(),owner:cells[3].textContent.trim()});await closePicker();}
   }else if(request.action==='append-progression'){
    const proposed=request.operation.after;
    if(request.mode!=='unsaved-level-staging'||request.operation.before!==null||(section.scriptLevels||[]).length||typeof proposed.title!=='string'||proposed.levels.some(l=>typeof l.assessment!=='boolean'))throw Error('Only a reviewed empty progression can receive new existing-level links.');
    for(const level of proposed.levels){
     const modal=await openPicker(),row=await search(modal,level.key),plus=row.querySelectorAll('td:first-child .fa-plus');
     if(plus.length!==1||plus[0].closest('button')?.disabled)throw Error('The exact existing level cannot be uniquely added.');
     checkDeadline();plus[0].closest('button').click();await settle();
     const tokens=[...modal.querySelectorAll('.uitest-level-token-name')].filter(n=>[...n.querySelectorAll('span')].some(s=>s.textContent.trim()===level.key));
     if(tokens.length!==1)throw Error('The new native level token is ambiguous.');tokens[0].click();await settle();
     const expanded=[...modal.querySelectorAll('.uitest-level-token-name')].filter(n=>[...n.querySelectorAll('span')].some(s=>s.textContent.trim()===level.key));if(expanded.length!==1)throw Error('The expanded level token is ambiguous.');
     const labels=[...expanded[0].parentElement.querySelectorAll('label')].filter(n=>n.querySelector('span')?.textContent.trim()==='Assessment');
     if(labels.length!==1)throw Error('The new level Assessment control is ambiguous.');const check=labels[0].querySelector('input[type="checkbox"]');if(!check||check.disabled)throw Error('The new level Assessment control is unavailable.');
     checkDeadline();if(check.checked!==level.assessment)check.click();await settle();await closePicker();
    }
    checkDeadline();setControl(titleNode(),proposed.title);await settle();
   }else{
    if(request.mode!=='unsaved-level-staging'||typeof request.operation.restoreProgressionName!=='string')throw Error('Level cleanup requires its original progression title.');
    const actual=(section.scriptLevels||[]).map(sl=>({key:sl.levels?.[0]?.name,assessment:Boolean(sl.assessment)}));
    if(stable(actual)!==stable(request.operation.expectedLevels.map(l=>({key:l.key,assessment:l.assessment}))))throw Error('Level cleanup does not match its exact owned links.');
    const savedIds=new Set((before.saved.activities||[]).flatMap(a=>(a.activitySections||[]).flatMap(s=>(s.scriptLevels||[]).map(sl=>String(sl.id)))));
    if(section.scriptLevels.some(sl=>sl.id!=null&&savedIds.has(String(sl.id))))throw Error('Cleanup will not unlink saved native associations.');
    setControl(titleNode(),request.operation.restoreProgressionName);await settle();
    for(const name of [...names].reverse()){
     const modal=await openPicker(),tokens=[...modal.querySelectorAll('.uitest-level-token-name')].filter(n=>[...n.querySelectorAll('span')].some(s=>s.textContent.trim()===name));
     if(tokens.length!==1)throw Error('The owned level token is ambiguous during cleanup.');const x=tokens[0].parentElement.querySelectorAll('.fa-xmark');if(x.length!==1)throw Error('The owned level unlink control is ambiguous.');
     checkDeadline();x[0].parentElement.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();
     const confirms=[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length&&b.textContent.trim()==='Delete');
     if(confirms.length!==1||!document.body.textContent.includes('Are you sure you want to remove the level named "'+name+'" from the script?'))throw Error('The native unlink confirmation does not name the owned level.');
     checkDeadline();confirms[0].click();await settle();await closePicker();
    }
   }
  }finally{await closePicker();diagnosticCapture=read();}
  const after=diagnosticCapture,projection=structuredClone(after);
  if(request.action==='append-progression'){
   const changed=after.live.activities[ai].activitySections[si],actual=(changed.scriptLevels||[]).map(sl=>({key:sl.levels?.length===1?sl.levels[0].name:null,assessment:Boolean(sl.assessment)}));
   if(stable(actual)!==stable(request.operation.after.levels.map(l=>({key:l.key,assessment:l.assessment})))||changed.progressionName!==request.operation.after.title)throw Error('Native level names, ordering, assessment flags or progression title did not match.');
  }
  if(request.action==='clear-owned-progression'){
   const changed=after.live.activities[ai].activitySections[si];if(changed.scriptLevels.length||changed.progressionName!==request.operation.restoreProgressionName)throw Error('Original empty progression did not match after cleanup.');
  }
  if(request.action!=='lookup-levels')for(const capture of [projection.live.activities[ai].activitySections[si],projection.protection.unmanagedActivities[ai].activitySections[si]]){
   const original=capture===projection.live.activities[ai].activitySections[si]?before.live.activities[ai].activitySections[si]:before.protection.unmanagedActivities[ai].activitySections[si];
   capture.scriptLevels=structuredClone(original.scriptLevels);if(Object.prototype.hasOwnProperty.call(original,'progressionName'))capture.progressionName=original.progressionName;else delete capture.progressionName;
  }
  if(stable(projection)!==stable(before))throw Error('Unrelated native content changed during level lookup or linking.');
  if(after.blockers.length)throw Error(after.blockers.join(' '));
  return request.action==='lookup-levels'?{kind:'native-level-mappings',capture:after,mappings}:after;
 }
 if(['append-activity','remove-created-activity','remove-created-callout'].includes(request.action)){
  if(request.mode!=='unsaved-structure-staging')throw Error('Explicit structural mode is required.');
  const before=read();if(before.blockers.length||await fingerprint(before)!==request.expectedCaptureDigest)throw Error('The editor changed before structural action.');
  const op=request.operation,p=op?.path,ai=p?.[1],si=p?.[3];let after;
  const choose=(root,text)=>{const matches=[...root.querySelectorAll('button')].filter(b=>b.getClientRects().length&&b.textContent.trim()===text);if(matches.length!==1)throw Error('Ambiguous '+text+' control.');return matches[0];};
  const confirm=async title=>{const dialogSelector='.modal-content,[role="dialog"],[role="alertdialog"],dialog[open]',dialogs=[...document.querySelectorAll(dialogSelector)].filter(n=>n.getClientRects().length&&([...(n.querySelectorAll('h2'))].some(h=>h.closest(dialogSelector)===n&&title.test(h.textContent.trim()))||title.test(n.getAttribute('aria-label')||'')));if(dialogs.length!==1)throw Error('Structural removal confirmation is ambiguous.');const immediate=read();if(stable(immediate.live)!==stable(before.live)||stable(immediate.saved)!==stable(before.saved)||stable(immediate.protection)!==stable(before.protection))throw Error('Outside edits appeared before structural removal.');checkDeadline();choose(dialogs[0],'Delete').click();await settle();};
  if(request.action==='append-activity'){
   const empty={title:'',duration:null,sections:[{title:'',duration:null,body:'',remarks:false,callouts:[],progression:null}]};
   if(p?.length!==1||p[0]!=='activities'||op.kind!=='append'||op.before?.length!==before.live.activities.length||stable(op.after)!==stable(empty))throw Error('Only a reviewed blank activity may be appended.');
   const buttons=document.querySelectorAll('button.add-activity');if(buttons.length!==1)throw Error('Activity insertion control is ambiguous.');checkDeadline();buttons[0].dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();after=read();diagnosticCapture=after;
   const a=after.live.activities.at(-1),section=a?.activitySections?.[0];if(after.live.activities.length!==before.live.activities.length+1||a.id!=null||!/^activity-/.test(a.key||'')||a.name||a.duration||a.activitySections.length!==1||section.id!=null||!/^activitySection-/.test(section.key||'')||section.name||section.description||section.duration||section.remarks||section.tips?.length||section.scriptLevels?.length)throw Error('New native activity is not the expected blank structure.');
   const projection=structuredClone(after);projection.live.activities.pop();projection.protection.unmanagedActivities.pop();if(stable(projection)!==stable(before))throw Error('Activity insertion changed unrelated content.');
  }else if(request.action==='remove-created-activity'){
   const a=before.live.activities[ai],card=document.querySelectorAll('.uitest-activity-card')[ai];if(p?.length!==2||p[0]!=='activities'||ai!==before.live.activities.length-1||!a||a.id!=null||a.key!==op.createdKey||!/^activity-/.test(a.key||''))throw Error('Only the exact owned last unsaved activity can be removed.');
   const trash=card?.firstElementChild?.querySelectorAll('.fa-trash');if(trash?.length!==1)throw Error('Activity removal control is ambiguous.');checkDeadline();trash[0].dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();await confirm(/^Are you sure you want to remove /);after=read();const expected=structuredClone(before);expected.live.activities.pop();expected.protection.unmanagedActivities.pop();if(stable(expected)!==stable(after))throw Error('Activity removal changed unrelated content.');
  }else{
   const ti=p?.[5],section=before.live.activities[ai]?.activitySections[si],tip=section?.tips?.[ti],saved=before.saved.activities[ai]?.activitySections[si];
   if(p?.length!==6||p[0]!=='activities'||p[2]!=='sections'||p[4]!=='callouts'||!Number.isInteger(ti)||ti<0||ti!==section?.tips.length-1||ti<(saved?.tips?.length||0)||stable(tip)!==stable(op.expectedTip))throw Error('Only the exact appended unsaved callout may be removed.');
   const area=document.querySelectorAll('.uitest-activity-card')[ai]?.querySelectorAll('textarea')[si],icons=area?.parentElement.querySelectorAll('span[data-tip][data-for] > i');if(icons?.length!==section.tips.length)throw Error('Callout removal controls are ambiguous.');checkDeadline();icons[ti].click();await settle();
   const dialogs=[...document.querySelectorAll('.modal-content')].filter(n=>n.getClientRects().length&&[...n.querySelectorAll('h2')].some(h=>h.textContent.trim()==='Add Callout'));if(dialogs.length!==1)throw Error('Callout editor did not open uniquely.');const modal=dialogs[0];if(modal.querySelector('select')?.value!==tip.type||modal.querySelector('textarea[name="callout"]')?.value!==tip.markdown)throw Error('Callout removal target changed.');
   const immediate=read();if(stable(immediate.live)!==stable(before.live)||stable(immediate.saved)!==stable(before.saved))throw Error('Outside edits prevent callout removal.');checkDeadline();choose(modal,'Delete').click();await settle();await confirm(/^Delete Callout\?/);after=read();const expected=structuredClone(before);expected.live.activities[ai].activitySections[si].tips.pop();expected.protection.unmanagedActivities[ai].activitySections[si].tips.pop();if(stable(expected)!==stable(after))throw Error('Callout removal changed unrelated content.');
  }
  if(after.blockers.length)throw Error(after.blockers.join(' '));return after;
 }
 if(['append-section','append-callout','remove-created-section'].includes(request.action)){
  if(request.mode!=='unsaved-structure-staging')throw Error('Structural staging requires its explicit mode.');
  const before=read();if(before.blockers.length)throw Error(before.blockers.join(' '));
  if(await fingerprint(before)!==request.expectedCaptureDigest)throw Error('Native editor changed before the structural action.');
  const path=request.operation?.path,ai=path?.[1],si=path?.[3];
  if(path?.[0]!=='activities'||!Number.isInteger(ai)||ai<0||path[2]!=='sections')throw Error('Unsupported structural location.');
  const activity=before.live.activities[ai],card=[...document.querySelectorAll('.uitest-activity-card')][ai];
  if(!activity||!card)throw Error('The structural activity no longer exists.');
  const sections=activity.activitySections;
  const choose=(root,text)=>{const nodes=[...root.querySelectorAll('button')].filter(b=>b.textContent.trim()===text);if(nodes.length!==1)throw Error('Cannot uniquely locate '+text+'.');return nodes[0];};
  const setControl=(node,value)=>{const proto=node.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:node.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));};
  let after;
  if(request.action==='append-section'){
   const empty={title:'',duration:null,body:'',remarks:false,callouts:[],progression:null};
   if(path.length!==3||request.operation.kind!=='append'||stable(request.operation.after)!==stable(empty)||request.operation.before?.length!==sections.length)throw Error('Only a reviewed empty section may be appended.');
   const buttons=card.querySelectorAll('button.add-activity-section');
   if(buttons.length!==sections.length||!buttons.length)throw Error('Native section insertion controls are ambiguous.');
   checkDeadline();buttons[buttons.length-1].dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();after=read();diagnosticCapture=after;
   const inserted=after.live.activities[ai]?.activitySections?.[sections.length];
   if(after.live.activities[ai]?.activitySections?.length!==sections.length+1||!inserted||inserted.name||inserted.description||inserted.remarks||inserted.duration||(inserted.tips||[]).length||(inserted.scriptLevels||[]).length)throw Error('Native section creation readback was unexpected.');
   const compare=structuredClone(after);compare.live.activities[ai].activitySections.pop();compare.protection.unmanagedActivities[ai].activitySections.pop();
   if(stable(compare)!==stable(before))throw Error('Unrelated native content changed while adding a section.');
  }else{
   if(!Number.isInteger(si)||si<0||!sections[si])throw Error('The structural section no longer exists.');
   const area=card.querySelectorAll('textarea')[si],root=area?.parentElement;
   if(!root)throw Error('The structural section controls are missing.');
   if(request.action==='append-callout'){
    const types={'Teaching Tip':'teachingTip','Content Corner':'contentCorner','Discussion Goal':'discussionGoal','Assessment Opportunity':'assessmentOpportunity','Ethics Opportunity':'ethicsOpportunity'},callout=request.operation.after;
    if(path.length!==5||path[4]!=='callouts'||request.operation.kind!=='append'||request.operation.before?.length!==(sections[si].tips||[]).length||!types[callout?.type]||typeof callout.body!=='string'||!callout.body.trim()||callout.body.length>100000)throw Error('The proposed callout is invalid.');
    checkDeadline();choose(root,'Callout').click();await settle();
    const modals=[...document.querySelectorAll('.modal-content')].filter(n=>n.getClientRects().length&&[...n.querySelectorAll('h2')].some(h=>h.textContent.trim()==='Add Callout'));
    if(modals.length!==1)throw Error('The native Add Callout form did not open uniquely.');
    const modal=modals[0],selects=modal.querySelectorAll('select'),areas=modal.querySelectorAll('textarea[name="callout"]');
    if(selects.length!==1||areas.length!==1)throw Error('Unexpected native callout fields.');
    checkDeadline();setControl(selects[0],types[callout.type]);setControl(areas[0],callout.body);const immediate=read();if(stable(immediate.live)!==stable(before.live)||stable(immediate.saved)!==stable(before.saved))throw Error('Outside edits appeared before adding the callout.');checkDeadline();choose(modal,'Save and close').click();await settle();after=read();
    const tips=after.live.activities[ai]?.activitySections[si]?.tips||[],tip=tips.at(-1);
    if(tips.length!==(sections[si].tips||[]).length+1||tip?.type!==types[callout.type]||tip?.markdown!==callout.body)throw Error('Native callout creation readback did not match.');
    const compare=structuredClone(after);compare.live.activities[ai].activitySections[si].tips.pop();compare.protection.unmanagedActivities[ai].activitySections[si].tips.pop();
    if(stable(compare)!==stable(before))throw Error('Unrelated native content changed while adding a callout.');
   }else{
    const section=sections[si],savedIds=new Set((before.saved.activities||[]).flatMap(a=>(a.activitySections||[]).map(s=>String(s.id))));
    if(path.length!==4||si!==sections.length-1||section.key!==request.operation.createdKey||!/^activitySection-/.test(section.key||'')||savedIds.has(String(section.id)))throw Error('Cleanup may remove only the last newly created unsaved section.');
    const trash=root.firstElementChild?.querySelectorAll('.fa-trash');if(trash?.length!==1)throw Error('New section cleanup control is ambiguous.');
    checkDeadline();trash[0].dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();
    const modals=[...document.querySelectorAll('.modal-content')].filter(n=>n.getClientRects().length&&[...n.querySelectorAll('h2')].some(h=>/^Are you sure you want to remove /.test(h.textContent.trim())));
    if(modals.length!==1)throw Error('New section cleanup confirmation is ambiguous.');
    checkDeadline();choose(modals[0],'Delete').click();await settle();after=read();
    const compare=structuredClone(before);compare.live.activities[ai].activitySections.pop();compare.protection.unmanagedActivities[ai].activitySections.pop();
    if(stable(compare)!==stable(after))throw Error('Original native state did not match after new section cleanup.');
   }
  }
  if(after.blockers.length)throw Error(after.blockers.join(' '));return after;
 }
 if(['append-objective','remove-created-objective'].includes(request.action)){
  const before=read();if(before.blockers.length||request.mode!=='unsaved-structure-staging'||await fingerprint(before)!==request.expectedCaptureDigest)throw Error('The editor changed before objective staging.');
  const table=tableFor(['Description','Levels','Actions']),op=request.operation;
  const expand=()=>{const headings=[...document.querySelectorAll('#edit-container h2 button')].filter(b=>b.textContent.trim()==='Objectives');if(headings.length===1)headings[0].click();};
  if(request.action==='append-objective'){
   if(op?.kind!=='append'||stable(op.path)!=='["frontMatter","objectives"]'||stable(op.before)!==stable(before.live.objectives.map(o=>o.description))||typeof op.after!=='string'||!op.after.trim()||op.after.length>100000)throw Error('The proposed new objective is invalid.');
   const buttons=[...document.querySelectorAll('#edit-container button')].filter(b=>b.textContent.trim()==='Create New Objective');if(buttons.length!==1||buttons[0].disabled)throw Error('The new objective control is unavailable.');if(!buttons[0].getClientRects().length)expand();checkDeadline();buttons[0].dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();
   const row=table.querySelectorAll('tbody tr')[before.live.objectives.length],inputs=row?.querySelectorAll('td:first-child input[type="text"]'),save=row?.querySelectorAll('.fa-check');if(inputs?.length!==1||save?.length!==1||inputs[0].value!=='')throw Error('The new objective row did not open uniquely.');
   checkDeadline();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(inputs[0],op.after);inputs[0].dispatchEvent(new Event('input',{bubbles:true}));inputs[0].dispatchEvent(new Event('change',{bubbles:true}));await settle();
   const immediate=read(),record=immediate.live.objectives.at(-1),project=structuredClone(immediate);project.live.objectives.pop();project.protection.objectives.pop();project.blockers=[];if(stable(project)!==stable(before)||record?.id!=null||record?.description!==''||stable(record.scriptLevelIds)!=='[]')throw Error('Outside edits appeared while creating the objective.');
   checkDeadline();save[0].parentElement.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();return read();
  }
  const record=before.live.objectives[op?.index];if(!Number.isInteger(op?.index)||op.index!==before.live.objectives.length-1||op.index<before.saved.objectives.length||record?.id!=null||stable(record)!==stable(op.expected))throw Error('Only the exact appended unsaved objective may be removed.');
  const row=table.querySelectorAll('tbody tr')[op.index],remove=row?.querySelectorAll('.unit-test-remove-objective');if(remove?.length!==1)throw Error('The new objective removal control is ambiguous.');if(!row.getClientRects().length)expand();checkDeadline();remove[0].dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();const after=read(),expected=structuredClone(before);expected.live.objectives.pop();expected.protection.objectives.pop();if(stable(after)!==stable(expected))throw Error('Objective cleanup changed unrelated content.');return after;
 }
 if(request.action!=='set-scalar'||request.mode!=='unsaved-scalar-staging')throw Error('Unsupported native action. Saving and collection mutations are unavailable.');
 const current=read();if(current.blockers.length)throw Error(current.blockers.join(' '));
 if(await fingerprint(current)!==request.expectedCaptureDigest)throw Error('Native editor changed before the action. Nothing was filled.');
 const op=request.operation,path=op?.path;
 if(op?.kind!=='set'||!Array.isArray(path)||path.some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Only existing scalar fields are supported.');
 if(path[0]==='activities'&&path[2]==='sections'&&path[4]==='progression'&&[path[1],path[3]].every(n=>Number.isInteger(n)&&n>=0)&&(path.length===6&&path[5]==='title'||path.length===8&&path[5]==='levels'&&Number.isInteger(path[6])&&path[6]>=0&&path[7]==='assessment')){
  const card=document.querySelectorAll('.uitest-activity-card')[path[1]],section=current.live.activities[path[1]]?.activitySections[path[3]],root=card?.querySelectorAll('textarea')[path[3]]?.parentElement;
  if(!root||!section?.scriptLevels?.length)throw Error('The existing progression is missing.');
  if(path.length===6){
   const labels=[...root.querySelectorAll('label')].filter(n=>[...n.childNodes].filter(c=>c.nodeType===3||c.nodeType===1&&c.tagName==='SPAN').map(c=>c.textContent).join('').trim()==='Progression Title:');
   const input=labels.length===1?labels[0].querySelector('input'):null;
   if(!input||input.value!==op.before||(section.progressionName||'')!==op.before||typeof op.after!=='string'||op.after.length>100000||input.disabled||input.readOnly)throw Error('The progression title differs from its review.');
   checkDeadline();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,op.after);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));await settle();return read();
  }
  const record=section.scriptLevels[path[6]],name=record?.levels?.length===1?record.levels[0].name:null;
  if(!name||section.scriptLevels.filter(sl=>sl.levels?.some(l=>l.name===name)).length!==1||record.assessment!==op.before||typeof op.after!=='boolean')throw Error('The reviewed level association is ambiguous or changed.');
  const buttons=root.querySelectorAll('button.uitest-open-add-level-button');if(buttons.length!==1||buttons[0].disabled)throw Error('The native level editor is unavailable.');
  checkDeadline();buttons[0].click();await settle();
  const dialogs=[...document.querySelectorAll('.modal-content')].filter(n=>n.getClientRects().length&&[...n.querySelectorAll('h2')].some(h=>h.textContent.trim()==='Add Levels'));if(dialogs.length!==1)throw Error('The native level editor did not open uniquely.');
  const modal=dialogs[0],tokens=[...modal.querySelectorAll('.uitest-level-token-name')].filter(n=>[...n.querySelectorAll('span')].some(s=>s.textContent.trim()===name));if(tokens.length!==1)throw Error('The existing level token is ambiguous.');
  checkDeadline();tokens[0].click();await settle();
  const labels=[...tokens[0].parentElement.querySelectorAll('label')].filter(n=>n.querySelector('span')?.textContent.trim()==='Assessment'),check=labels.length===1?labels[0].querySelector('input[type="checkbox"]'):null;
  if(!check||check.disabled||check.checked!==op.before)throw Error('The saved assessment flag differs from the reviewed control.');
  const immediate=read();if(stable(immediate.live)!==stable(current.live)||stable(immediate.saved)!==stable(current.saved))throw Error('Outside edits appeared before changing the assessment flag.');
  checkDeadline();check.click();await settle();const close=[...modal.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Close and save');if(close.length!==1)throw Error('The level editor close control is ambiguous.');checkDeadline();close[0].click();await settle();return read();
 }
 if(path.length===3&&path[0]==='frontMatter'&&path[1]==='objectives'&&Number.isInteger(path[2])&&path[2]>=0){
  const objective=current.live.objectives[path[2]];
  if(!objective||objective.description!==op.before||typeof op.after!=='string'||!op.after.trim()||op.after.length>100000)throw Error('The objective differs from the reviewed replacement.');
  const table=tableFor(['Description','Levels','Actions']),row=table.querySelectorAll('tbody tr')[path[2]];
  if(!row||row.children[0]?.textContent.trim()!==op.before.trim())throw Error('The objective row does not match its captured record.');
  if(!row.getClientRects().length){const buttons=[...document.querySelectorAll('#edit-container h2 button')].filter(b=>b.textContent.trim()==='Objectives');if(buttons.length!==1)throw Error('Objective panel is ambiguous.');buttons[0].click();}
  const edits=row.querySelectorAll('.fa-pen-to-square');if(edits.length!==1)throw Error('Objective edit control is ambiguous.');
  checkDeadline();edits[0].parentElement.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();
  const inputs=row.querySelectorAll('td:first-child input[type="text"]'),save=row.querySelectorAll('.fa-check');
  if(inputs.length!==1||save.length!==1||inputs[0].value!==op.before)throw Error('Objective edit did not open with the reviewed value.');
  const node=inputs[0];checkDeadline();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(node,op.after);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));await settle();
  const immediate=read();if(stable(immediate.live)!==stable(current.live)||stable(immediate.saved)!==stable(current.saved))throw Error('Outside edits appeared during objective editing.');
  checkDeadline();save[0].parentElement.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,buttons:1}));await settle();return read();
 }
 if(path.length===7&&path[0]==='activities'&&path[2]==='sections'&&path[4]==='callouts'&&[path[1],path[3],path[5]].every(n=>Number.isInteger(n)&&n>=0)&&['type','body'].includes(path[6])){
  const types={'Teaching Tip':'teachingTip','Content Corner':'contentCorner','Discussion Goal':'discussionGoal','Assessment Opportunity':'assessmentOpportunity','Ethics Opportunity':'ethicsOpportunity'};
  const tip=current.live.activities[path[1]]?.activitySections[path[3]]?.tips?.[path[5]],key=path[6]==='body'?'markdown':'type',before=key==='type'?types[op.before]:op.before,after=key==='type'?types[op.after]:op.after;
  if(!tip||tip[key]!==before||typeof after!=='string'||after.length>100000)throw Error('The existing callout differs from the reviewed change.');
  const card=document.querySelectorAll('.uitest-activity-card')[path[1]],root=card?.querySelectorAll('textarea')[path[3]]?.parentElement,icons=root?.querySelectorAll('span[data-tip][data-for] > i');
  if(!icons||icons.length!==current.live.activities[path[1]].activitySections[path[3]].tips.length)throw Error('Existing callout controls could not be uniquely mapped.');
  if(!icons[path[5]].getClientRects().length){
   const headings=[...document.querySelectorAll('#edit-container h2 button')].filter(b=>b.textContent.trim()==='Activities & Levels');if(headings.length===1)headings[0].click();
   if(card?.children[1]?.hidden)card.querySelector('.fa-chevron-right')?.click();
  }
  if(!icons[path[5]].getClientRects().length)throw Error('The existing callout control is hidden. No callout was changed.');
  checkDeadline();icons[path[5]].click();await settle();
  const modals=[...document.querySelectorAll('.modal-content')].filter(n=>n.getClientRects().length&&[...n.querySelectorAll('h2')].some(h=>h.textContent.trim()==='Add Callout'));
  if(modals.length!==1)throw Error('The existing callout editor did not open uniquely.');
  const modal=modals[0],selects=modal.querySelectorAll('select'),areas=modal.querySelectorAll('textarea[name="callout"]'),buttons=[...modal.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Save and close');
  if(selects.length!==1||areas.length!==1||buttons.length!==1||selects[0].value!==tip.type||areas[0].value!==tip.markdown)throw Error('The opened callout does not match its captured type and text.');
  const node=key==='type'?selects[0]:areas[0],proto=key==='type'?HTMLSelectElement.prototype:HTMLTextAreaElement.prototype;
  checkDeadline();Object.getOwnPropertyDescriptor(proto,'value').set.call(node,after);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));await settle();
  const immediate=read();if(stable(immediate.live)!==stable(current.live)||stable(immediate.saved)!==stable(current.saved))throw Error('Outside edits appeared while the callout dialog was open. No callout was saved.');
  checkDeadline();buttons[0].click();await settle();return read();
 }
 let node,value,sectionDuration=false;
 if(path.length===1&&path[0]==='title'){node=fieldNode('title');value=current.live.fields.title;}
 else if(path.length===2&&path[0]==='frontMatter'&&Object.keys(labels).includes(path[1])&&path[1]!=='title'){node=fieldNode(path[1]);value=current.live.fields[path[1]];}
 else if(path[0]==='activities'&&Number.isInteger(path[1])&&path[1]>=0){
  const card=[...document.querySelectorAll('.uitest-activity-card')][path[1]],activity=current.live.activities[path[1]];
  if(!card||!activity)throw Error('The activity no longer exists.');
  if(path.length===3&&['title','duration'].includes(path[2])){
   node=card.querySelector(path[2]==='title'?'.uitest-activity-name-input':'.uitest-activity-duration-input');value=path[2]==='title'?(activity.name??activity.displayName??''):(activity.duration===''?null:activity.duration);
  }else if(path.length===5&&path[2]==='sections'&&Number.isInteger(path[3])&&path[3]>=0&&['title','duration','body','remarks'].includes(path[4])){
   const area=card.querySelectorAll('textarea')[path[3]],section=activity.activitySections[path[3]],root=area?.parentElement;
   if(!area||!section||!root)throw Error('The section no longer exists.');
   const header=root.firstElementChild,inputs=header?.querySelectorAll('input:not([type="checkbox"])');
   if(inputs?.length!==2)throw Error('Unexpected native section header.');
   if(path[4]==='title'){node=inputs[0];value=section.name??section.displayName??'';}
   if(path[4]==='duration'){node=inputs[1];value=section.duration===''||section.duration==null?null:section.duration;sectionDuration=true;}
   if(path[4]==='body'){node=area;value=section.description??section.text??'';}
   if(path[4]==='remarks'){const checks=header.querySelectorAll('input[type="checkbox"]');if(checks.length!==1)throw Error('Remarks control is ambiguous.');node=checks[0];value=Boolean(section.remarks);}
  }
 }
 if(!node)throw Error('The reviewed native control could not be located: '+path.join(' / ')+'.');
 const numeric=path.at(-1)==='duration',check=node.type==='checkbox';
 // The reader already verifies that DOM and serialized state agree. Compare
 // against that same control here, using one blank-minute interpretation.
 const controlValue=check?node.checked:numeric?(node.value===''?null:Number(node.value)):node.value;
 if(stable(controlValue)!==stable(op.before))throw Error(numeric?'The timing value changed: expected '+stable(op.before)+', found '+stable(controlValue)+'.':'The native field changed before the reviewed action.');
 if(numeric&&op.after!==null&&(!Number.isInteger(op.after)||op.after<0))throw Error('Native duration controls require whole minutes or a blank.');
 if(check?typeof op.after!=='boolean':!numeric&&typeof op.after!=='string')throw Error('The proposed scalar value has the wrong type.');
 if(sectionDuration&&op.after===0)throw Error('Untimed native sections must use a blank, not zero.');
 // Expand only presentation controls; they do not change lesson content.
 if(!node.getClientRects().length){
  const panel=path[0]==='frontMatter'?({teacherOverview:'Overviews',studentOverview:'Overviews',purpose:'Purpose and Prep',preparation:'Purpose and Prep',assessmentOpportunities:'Assessment Opportunities'}[path[1]]):'Activities & Levels';
  const headings=[...document.querySelectorAll('#edit-container h2 button')].filter(b=>b.textContent.trim()===panel);if(headings.length===1)headings[0].click();
  const card=node.closest('.uitest-activity-card');if(card?.children[1]?.hidden)card.querySelector('.fa-chevron-right')?.click();
 }
 if(!node.getClientRects().length||node.disabled||node.readOnly)throw Error('The native control is hidden or not editable. No field was changed.');
 checkDeadline();
 if(check){if(node.checked!==op.after)node.click();}
 else{const proto=node.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,op.after===null?'':String(op.after));node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));}
 await settle();
 return read();
 }catch(error){
  // Chrome otherwise drops rejected injected promises' messages from result.
  if(request.transportErrors===true)return {nativeBridgeError:String(error?.message||error),action:request.action,...(diagnosticCapture?{diagnosticCapture}:{})};
  throw error;
 }
}

export function unsupportedNativeActions(plan){
 return plan.operations.filter(op=>{
  const p=op.path;if(op.kind!=='set')return true;
  if(p.length===1&&p[0]==='title')return false;
  if(p.length===3&&p[0]==='frontMatter'&&p[1]==='objectives'&&Number.isInteger(p[2])&&p[2]>=0)return typeof op.after!=='string'||!op.after.trim()||op.after.length>100000;
  if(p.length===2&&p[0]==='frontMatter'&&TEXT_FIELDS.includes(p[1]))return false;
  if(p[0]==='activities'&&Number.isInteger(p[1])&&p[1]>=0){
   if(p[2]==='sections'&&Number.isInteger(p[3])&&p[3]>=0&&p[4]==='progression'){if(p.length===6&&p[5]==='title')return typeof op.after!=='string'||op.after.length>100000;if(p.length===8&&p[5]==='levels'&&Number.isInteger(p[6])&&p[6]>=0&&p[7]==='assessment')return typeof op.after!=='boolean';}
   if(p.length===7&&p[2]==='sections'&&Number.isInteger(p[3])&&p[3]>=0&&p[4]==='callouts'&&Number.isInteger(p[5])&&p[5]>=0)return p[6]==='body'?typeof op.after!=='string'||op.after.length>100000:p[6]!=='type'||!['Teaching Tip','Content Corner','Discussion Goal','Assessment Opportunity','Ethics Opportunity'].includes(op.after);
   if(p.length===3&&['title','duration'].includes(p[2]))return p[2]==='duration'&&op.after!==null&&!Number.isInteger(op.after);
   if(p.length===5&&p[2]==='sections'&&Number.isInteger(p[3])&&p[3]>=0&&['title','duration','body','remarks'].includes(p[4]))return p[4]==='duration'&&op.after!==null&&(!Number.isInteger(op.after)||op.after===0);
  }
  return true;
 });
}
export function makeNativeScalarDriver(initialSnapshot,bridge){
 let lastCapture=null;
 return {mode:'native-unsaved-scalars',
  preflight:async plan=>{
   if(initialSnapshot.mode!=='native-read-only'||initialSnapshot.raw?.readerVersion!=='native-scalars-v1'||!initialSnapshot.nativeProtection)throw Error('Capture the current native editor with the scalar adapter first.');
   const unsupported=[...unsupportedNativeActions(plan),...plan.operations.filter(op=>op.path.length===7&&op.path[4]==='callouts')];if(unsupported.length)throw Error('Native staging does not yet support these locations: '+unsupported.map(op=>op.label).join('; ')+'. No native fields were filled.');
   if(canonical(plan.originalSnapshot)!==canonical(initialSnapshot))throw Error('The native adapter belongs to a different captured editor state.');
  },
  read:async()=>{
   lastCapture=await bridge({action:'read'});const current=normalizeNativeCapture(lastCapture);
   if(current.blockers.length)throw Error(current.blockers.join(' '));
   // Immutable original evidence stays in the journal; fresh unmanaged state is protected separately.
   current.raw=clone(initialSnapshot.raw);current.catalog=clone(initialSnapshot.catalog);return current;
  },
  apply:async op=>{if(!lastCapture)throw Error('Read the editor before staging.');lastCapture=await bridge({action:'set-scalar',mode:'unsaved-scalar-staging',operation:op,expectedCaptureDigest:await digest(lastCapture)});}
 };
}
