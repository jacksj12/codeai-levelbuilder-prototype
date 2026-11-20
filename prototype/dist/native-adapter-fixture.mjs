import {runAcceptedNativeRehearsal} from './native-level-verification.mjs';
import {runNativeStructureVerification} from './native-structure-verification.mjs';
import {runNativeVerification} from './native-verification.mjs';
import {generate,SANDBOX} from './core.mjs';
import {clone,buildTransferPlan,canonical} from './transfer-core.mjs';
import {normalizeNativeCapture} from './transfer-native.mjs';
import {nativeEditorBridge,makeNativeScalarDriver} from './native-dom-adapter.mjs';
import {stagePlan} from './transfer-runner.mjs';
const $=selector=>document.querySelector(selector),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const draft=generate(await(await fetch('fixture.json')).json()),tipKeys={'Teaching Tip':'teachingTip','Assessment Opportunity':'assessmentOpportunity'};
let levelPosition=0;
const native={id:8898985,name:draft.title,overview:draft.frontMatter.teacherOverview,studentOverview:draft.frontMatter.studentOverview,purpose:'',preparation:draft.frontMatter.preparation,assessmentOpportunities:'',unknownSetting:{retain:true},
 resources:draft.resources.map((r,i)=>({...r,id:100+i,markdownKey:'resource-'+i})),vocabularies:[],objectives:draft.frontMatter.objectives.map((description,i)=>({id:300+i,key:'objective-'+i,description,scriptLevelIds:[400+i]})),
 activities:draft.activities.map((a,ai)=>({id:500+ai,key:String(500+ai),position:ai+1,name:a.title,duration:a.duration,unknownActivitySetting:'keep',activitySections:draft.sections.filter(s=>s.activityId===a.id).map((s,si)=>({id:600+ai*100+si,key:String(600+ai*100+si),position:si+1,name:s.title,duration:s.duration||'',description:s.body,remarks:s.remarks,unknownSectionSetting:'keep',tips:s.callouts.map((c,i)=>({key:'tip-'+i,type:tipKeys[c.type],markdown:c.body})),progressionName:s.progression?.title||'',scriptLevels:(s.progression?.levels||[]).map(l=>({id:700+levelPosition,position:++levelPosition,assessment:Boolean(l.assessment),variants:{retain:true},levels:[{id:800+levelPosition,name:l.key,url:'/levels/'+(800+levelPosition)+'/edit'}]}))}))}))};
if(new URL(location.href).searchParams.has('missing-levels'))for(const a of native.activities)for(const section of a.activitySections){section.scriptLevels=[];section.progressionName='';}
document.querySelector('script[data-lesson]').setAttribute('data-lesson',JSON.stringify(native));
let current=clone(native),savedCalls=0,plan,driver,journal,initialProtection;
const field=(label,key,tag='textarea')=>`<label>${label}<${tag} data-native-root="${key}">${tag==='textarea'?esc(current[key]):''}</${tag}></label>`;
const input=(label,key)=>`<label>${label}<input data-native-root="${key}" value="${esc(current[key])}"></label>`;
const table=(headers,rows)=>`<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
$('#edit-container').innerHTML=`<h1 id="fixture-native-title">Editing Lesson "${esc(current.name)}"</h1>${input('Title','name')}
 <h2><button data-panel="overview-panel">Overviews</button></h2><div class="native-panel" id="overview-panel" hidden>${field('Overview','overview')}${field('Student Overview','studentOverview')}</div>
 <h2><button data-panel="prep-panel">Purpose and Prep</button></h2><div class="native-panel" id="prep-panel" hidden>${field('Purpose','purpose')}${field('Preparation','preparation')}</div>
 <h2><button data-panel="assessment-panel">Assessment Opportunities</button></h2><div class="native-panel" id="assessment-panel" hidden>${field('Assessment Opportunities','assessmentOpportunities')}</div>
 <h2><button data-panel="activities-panel">Activities &amp; Levels</button></h2><div id="activities-panel">${current.activities.map((a,ai)=>`<div class="uitest-activity-card"><div><label>Activity:<input class="uitest-activity-name-input" data-ai="${ai}" data-ak="name" value="${esc(a.name)}"></label><label>Duration:<input class="uitest-activity-duration-input" data-ai="${ai}" data-ak="duration" value="${esc(a.duration)}"></label></div><div>${a.activitySections.map((s,si)=>`<div class="native-section"><div class="section-header"><label><span>Title:</span><input data-ai="${ai}" data-si="${si}" data-sk="name" value="${esc(s.name)}"><span>Duration:</span><input data-ai="${ai}" data-si="${si}" data-sk="duration" value="${esc(s.duration)}"></label><label>Remarks<input type="checkbox" data-ai="${ai}" data-si="${si}" data-sk="remarks" ${s.remarks?'checked':''}></label></div><textarea data-ai="${ai}" data-si="${si}" data-sk="description" rows="3">${esc(s.description)}</textarea><p>${s.tips.length} preserved callouts; ${s.scriptLevels.length} preserved level links.</p></div>`).join('')}</div></div>`).join('')}</div>
 ${table(['Key','Name','Type','Audience','URL','Actions'],current.resources.map(r=>[r.key,r.name,r.type,r.audience,r.url,'']))}${table(['Word','Definition','Actions'],[])}${table(['Description','Levels','Actions'],current.objectives.map(o=>[o.description,'Level tags retained','']))}${table(['Framework','Shortcode','Description','Actions'],[['Fixture','KEEP','Unrelated table','']])}
 <label>Unrelated native setting<input id="fixture-unrelated" value="retain this value"></label><input type="hidden" name="activities"><input type="hidden" name="objectives"><button type="button" id="fixture-save">Save and Close</button>`;
const sync=()=>{$('input[name="activities"]').value=JSON.stringify(current.activities);$('input[name="objectives"]').value=JSON.stringify(current.objectives);$('#fixture-native-title').textContent='Editing Lesson "'+current.name+'"';updateFixtureLevelPreview();};
sync();
document.addEventListener('click',event=>{const button=event.target.closest('[data-panel]');if(button)$('#'+button.dataset.panel).hidden=!$('#'+button.dataset.panel).hidden;if(event.target.id==='fixture-save')$('#save-attempts').textContent=String(++savedCalls);});
function update(event){const n=event.target;if(n.dataset.nativeRoot)current[n.dataset.nativeRoot]=n.value;
 else if(n.dataset.ak){current.activities[Number(n.dataset.ai)][n.dataset.ak]=n.dataset.ak==='duration'?(n.value===''?'':parseInt(n.value,10)):n.value;}
 else if(n.dataset.sk){const s=current.activities[Number(n.dataset.ai)].activitySections[Number(n.dataset.si)],key=n.dataset.sk;s[key]=key==='duration'?n.value:key==='remarks'?n.checked:n.value;}
 else return;sync();}
document.addEventListener('input',update);document.addEventListener('change',update);
const bridge=request=>nativeEditorBridge(JSON.stringify({...request,fixture:true}));
async function run(limit){
 for(const id of ['fixture-start','fixture-resume','fixture-rerun'])$('#'+id).disabled=true;
 try{
  const report=await stagePlan(plan,driver,{journal,maxOperations:limit});journal=report.journal;
  const capture=await bridge({action:'read'});if(canonical(capture.protection)!==canonical(initialProtection))throw Error('Unmanaged native evidence changed.');
  if(savedCalls!==0)throw Error('A Save control was invoked.');
  $('#fixture-results').textContent=JSON.stringify({status:report.status,completed:report.completed,total:report.total,recovered:report.recovered,saved:false,saveControlsInvoked:savedCalls,unmanagedEvidencePreserved:true,items:report.items},null,2);
  $('#fixture-resume').disabled=report.status==='staged-unsaved';$('#fixture-rerun').disabled=report.status!=='staged-unsaved';
 }catch(error){$('#fixture-results').textContent=error.message;}
}
$('#fixture-start').onclick=async()=>{
 try{
  const capture=await bridge({action:'read'});initialProtection=clone(capture.protection);const snapshot=normalizeNativeCapture(capture);
  const lesson=clone(draft);lesson.title+=' — scalar adapter test';lesson.frontMatter.teacherOverview+='\n\nLocal adapter verification.';lesson.activities[0].duration=6;lesson.sections[0].title='Adapter-tested section';lesson.sections[0].body+='\n\nPreserved original guidance plus a test paragraph.';lesson.sections[0].duration=7;lesson.sections[0].remarks=true;
  const pkg={schemaVersion:1,status:'approved-locally',sandbox:SANDBOX,lesson,baseline:clone(lesson),conflicts:[],engineeringFixture:true};
  const preliminary=await buildTransferPlan(pkg,snapshot);const decisions=Object.fromEntries(preliminary.operations.filter(op=>op.requiresDecision).map(op=>[op.id,'replace']));
  plan=await buildTransferPlan(pkg,snapshot,decisions);driver=makeNativeScalarDriver(snapshot,bridge);journal=null;await run(3);
 }catch(error){$('#fixture-results').textContent=error.message;}
};
$('#fixture-resume').onclick=()=>run(250);$('#fixture-rerun').onclick=()=>run(250);

$('#fixture-start').disabled=false;

$('#fixture-auto').onclick=async()=>{
 for(const id of ['fixture-auto','fixture-start','fixture-resume','fixture-rerun'])$('#'+id).disabled=true;
 const result=await runNativeVerification(bridge,{onProgress:message=>{$('#fixture-results').textContent=message;}});
 $('#fixture-results').textContent=JSON.stringify({status:result.status,fields:result.fields?.length,restored:result.restored,saved:result.saved,saveControlsInvoked:savedCalls,skipped:result.skipped,error:result.error,restorationError:result.restorationError},null,2);
 $('#fixture-auto').disabled=false;
};
$('#fixture-auto').disabled=false;

let createdSequence=0;
function decorateSection(area,ai,si){
 const root=area.parentElement;
 const trash=document.createElement('i');trash.className='fa-trash';trash.dataset.removeSection=si;trash.dataset.ai=ai;trash.textContent='Remove temporary section';root.firstElementChild.append(trash);
 for(const [ci,tip]of current.activities[ai].activitySections[si].tips.entries()){
  const span=document.createElement('span');span.setAttribute('data-tip','true');span.setAttribute('data-for','fixture-tip-'+ai+'-'+si+'-'+ci);const icon=document.createElement('i');icon.textContent='Edit '+tip.type;icon.dataset.editTip=ci;icon.dataset.ai=ai;icon.dataset.si=si;span.append(icon);root.append(span);
 }
 for(const text of ['Callout','Activity Section']){const button=document.createElement('button');button.type='button';button.textContent=text;button.dataset.ai=ai;button.dataset.si=si;if(text==='Activity Section')button.className='add-activity-section';else button.dataset.callout='true';root.append(button);}
}
for(const [ai,card]of [...document.querySelectorAll('.uitest-activity-card')].entries())for(const [si,area]of [...card.querySelectorAll('textarea')].entries())decorateSection(area,ai,si);
function fixtureStructuralEvent(event){
 const button=event.target;
 if(event.type==='mousedown'&&button.matches('button.add-activity-section')){
  const ai=Number(button.dataset.ai),si=current.activities[ai].activitySections.length,key='activitySection-'+(++createdSequence);
  current.activities[ai].activitySections.push({key,name:'',duration:'',description:'',remarks:false,tips:[],scriptLevels:[],progressionName:''});
  const root=document.createElement('div');root.className='native-section';root.innerHTML='<div class="section-header"><label><span>Title:</span><input data-ai="'+ai+'" data-si="'+si+'" data-sk="name" value=""><span>Duration:</span><input data-ai="'+ai+'" data-si="'+si+'" data-sk="duration" value=""></label><label>Remarks<input type="checkbox" data-ai="'+ai+'" data-si="'+si+'" data-sk="remarks"></label></div><textarea data-ai="'+ai+'" data-si="'+si+'" data-sk="description"></textarea>';
  button.parentElement.after(root);decorateSection(root.querySelector('textarea'),ai,si);sync();
 }
 if(event.type==='click'&&button.dataset.editTip!==undefined){
  const ai=Number(button.dataset.ai),si=Number(button.dataset.si),ci=Number(button.dataset.editTip),tip=current.activities[ai].activitySections[si].tips[ci],modal=document.createElement('div');modal.className='modal-content';
  modal.innerHTML='<h2>Add Callout</h2><select>'+['teachingTip','contentCorner','discussionGoal','assessmentOpportunity','ethicsOpportunity'].map(t=>'<option value="'+t+'">'+t+'</option>').join('')+'</select><textarea name="callout"></textarea><button type="button">Save and close</button>';
  modal.querySelector('select').value=tip.type;modal.querySelector('textarea').value=tip.markdown;
  const del=document.createElement('button');del.textContent='Delete';del.onclick=()=>{const confirm=document.createElement('div');confirm.setAttribute('role','alertdialog');confirm.setAttribute('aria-label','Delete Callout?');confirm.innerHTML='<h2>Delete Callout?</h2><p id="dsco-dialog-description">Remove this exact callout?</p><button>Delete</button>';confirm.querySelector('button').onclick=()=>{current.activities[ai].activitySections[si].tips.splice(ci,1);confirm.remove();modal.remove();button.parentElement.remove();sync();};modal.append(confirm);};modal.append(del);
  modal.querySelector('button').onclick=()=>{tip.type=modal.querySelector('select').value;tip.markdown=modal.querySelector('textarea').value;modal.remove();sync();};button.parentElement.append(modal);
 }
 if(event.type==='click'&&button.dataset.callout){
  const ai=Number(button.dataset.ai),si=Number(button.dataset.si),modal=document.createElement('div');modal.className='modal-content';modal.innerHTML='<h2>Add Callout</h2><select>'+['teachingTip','contentCorner','discussionGoal','assessmentOpportunity','ethicsOpportunity'].map(t=>'<option value="'+t+'">'+t+'</option>').join('')+'</select><textarea name="callout"></textarea><button type="button">Save and close</button>';
  modal.querySelector('button').onclick=()=>{current.activities[ai].activitySections[si].tips.push({key:'tip-'+createdSequence+'-'+current.activities[ai].activitySections[si].tips.length,type:modal.querySelector('select').value,markdown:modal.querySelector('textarea').value});modal.remove();refreshTipIcons(ai,si);sync();};button.parentElement.append(modal);
 }
 if(event.type==='mousedown'&&button.dataset.removeSection){
  const ai=Number(button.dataset.ai),si=Number(button.dataset.removeSection),modal=document.createElement('div');modal.className='modal-content';modal.innerHTML='<h2>Are you sure you want to remove this section?</h2><button type="button">Delete</button>';
  modal.querySelector('button').onclick=()=>{current.activities[ai].activitySections.splice(si,1);button.closest('.native-section').remove();sync();};button.parentElement.append(modal);
 }
}
document.addEventListener('mousedown',fixtureStructuralEvent);
document.addEventListener('click',fixtureStructuralEvent);
const structureButton=document.createElement('button');structureButton.id='fixture-structure';structureButton.textContent='Run native section and five callout check';document.querySelector('.actions').append(structureButton);
structureButton.onclick=async()=>{structureButton.disabled=true;const report=await runNativeStructureVerification(bridge,{onProgress:message=>{$('#fixture-results').textContent=message;}});$('#fixture-results').textContent=JSON.stringify({status:report.status,callouts:report.callouts,restored:report.restored,saved:report.saved,saveControlsInvoked:savedCalls,error:report.error,restorationError:report.restorationError},null,2);structureButton.disabled=false;};

const fixtureLevels=draft.sections.flatMap(s=>s.progression?.levels||[]).map((l,i)=>({id:12000+i,name:l.key,type:i?'FreeResponse':'Aichat',owner:'Fixture'}));
let levelAssociation=0;
function progressionControl(ai,si,root){
 const section=current.activities[ai].activitySections[si];let label=root.querySelector('.fixture-progression-title');
 if(!section.scriptLevels.length){label?.remove();return;}
 if(!label){label=document.createElement('label');label.className='fixture-progression-title';const caption=document.createElement('span');caption.textContent='Progression Title:';label.append(caption);const input=document.createElement('input');input.dataset.ai=ai;input.dataset.si=si;input.dataset.sk='progressionName';label.append(input);root.append(label);}
 label.querySelector('input').value=section.progressionName||'';
}
function nativeLevelModal(ai,si,root){
 const section=current.activities[ai].activitySections[si],modal=document.createElement('div');modal.className='modal-content';
 modal.innerHTML='<h2>Add Levels</h2><div class="uitest-level-dialog-content"><div class="fixture-level-filters"><label>By Name:<input class="uitest-add-level-name-input"></label><label>By Type:<select><option value="">All types</option></select></label><label>By Unit:<select><option value="">All scripts</option></select></label><label>By Owner:<select><option value="">Any owner</option></select></label><button type="button"><i class="fa-magnifying-glass"></i></button></div><table><thead><tr>'+['Actions','Name','Type','Owner','Last Updated'].map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody></tbody></table><div class="fixture-level-tokens"></div></div><button type="button" class="save-add-levels-button">Close and save</button>';
 function renderTokens(){
  const box=modal.querySelector('.fixture-level-tokens');box.replaceChildren();
  for(const sl of section.scriptLevels){const token=document.createElement('div'),name=document.createElement('span');name.className='uitest-level-token-name';const text=document.createElement('span');text.textContent=sl.levels[0].name;name.append(text);token.append(name);
   const remove=document.createElement('div');remove.innerHTML='<i class="fa-xmark"></i>';token.append(remove);
   name.onclick=()=>{sl.expand=!sl.expand;renderTokens();sync();};
   if(sl.expand){const label=document.createElement('label'),check=document.createElement('input'),span=document.createElement('span');check.type='checkbox';check.checked=Boolean(sl.assessment);span.textContent='Assessment';check.onclick=()=>{sl.assessment=check.checked;sync();};label.append(check,span);token.append(label);const usage=document.createElement('table');usage.innerHTML='<tbody><tr><td>Derived usage preview</td></tr></tbody>';token.append(usage);}
   remove.onmousedown=()=>{const confirm=document.createElement('div');confirm.className='modal-content';const p=document.createElement('p');p.textContent='Are you sure you want to remove the level named "'+sl.levels[0].name+'" from the script?';confirm.append(p);for(const caption of ['Cancel','Delete']){const button=document.createElement('button');button.textContent=caption;button.onclick=()=>{if(caption==='Delete'){section.scriptLevels.splice(section.scriptLevels.indexOf(sl),1);renderTokens();progressionControl(ai,si,root);sync();}confirm.remove();};confirm.append(button);}modal.append(confirm);};box.append(token);
  }
 }
 function search(){const query=modal.querySelector('input.uitest-add-level-name-input').value,body=modal.querySelector('tbody');body.replaceChildren();
  for(const level of fixtureLevels.filter(l=>!query||l.name.includes(query))){const row=document.createElement('tr'),actions=document.createElement('td'),add=document.createElement('button');add.innerHTML='<i class="fa-plus"></i>';add.disabled=section.scriptLevels.some(sl=>sl.levels[0].name===level.name);add.onclick=()=>{section.scriptLevels.push({key:'scriptLevel-'+(++levelAssociation),activeId:level.id,position:section.scriptLevels.length+1,levels:[{id:level.id,name:level.name}],assessment:false,expand:false});progressionControl(ai,si,root);renderTokens();sync();search();};actions.append(add);row.append(actions);for(const value of [level.name,level.type,level.owner,'Fixture']){const td=document.createElement('td');td.textContent=value;row.append(td);}body.append(row);}
 }
 modal.querySelector('.fa-magnifying-glass').parentElement.onclick=search;modal.querySelector('.save-add-levels-button').onclick=()=>modal.remove();root.append(modal);renderTokens();search();
}
for(const [ai,card]of [...document.querySelectorAll('.uitest-activity-card')].entries())for(const [si,area]of [...card.querySelectorAll('textarea')].entries()){
 const root=area.parentElement,button=document.createElement('button');button.type='button';button.className='uitest-open-add-level-button';button.textContent='Level';button.onclick=()=>nativeLevelModal(ai,si,root);root.append(button);progressionControl(ai,si,root);
}
const levelCheck=document.createElement('button');levelCheck.id='fixture-levels';levelCheck.textContent='Run accepted level transfer and restore';document.querySelector('.actions').append(levelCheck);
levelCheck.onclick=async()=>{levelCheck.disabled=true;const lesson=clone(draft),pkg={schemaVersion:1,status:'approved-locally',sandbox:SANDBOX,engineeringFixture:true,lesson,baseline:clone(lesson),conflicts:[]};const report=await runAcceptedNativeRehearsal(bridge,pkg,{onProgress:message=>{$('#fixture-results').textContent=message;}});$('#fixture-results').textContent=JSON.stringify({status:report.status,restored:report.restored,counts:report.counts,mappings:report.mappings?.length,error:report.error,restorationError:report.restorationError,saved:report.saved,saveControlsInvoked:savedCalls},null,2);levelCheck.disabled=false;};

function updateFixtureLevelPreview(){
 let table=document.getElementById('fixture-level-preview');const groups=current.activities.flatMap(a=>a.activitySections).filter(s=>s.scriptLevels.length);
 if(!groups.length){table?.remove();return;}
 if(!table){table=document.createElement('table');table.id='fixture-level-preview';document.querySelector('#edit-container').append(table);}
 table.innerHTML='<tbody>'+groups.map(s=>'<tr><td><a class="uitest-ProgressPill">'+s.scriptLevels.length+'</a></td><td>'+esc(s.name)+'</td></tr>').join('')+'</tbody>';
}

const calloutButton=document.createElement('button');calloutButton.id='fixture-edit-callout';calloutButton.textContent='Check existing callout edit and restore';document.querySelector('.actions').append(calloutButton);
calloutButton.onclick=async()=>{
 calloutButton.disabled=true;
 try{const lesson=clone(draft);lesson.sections[0].callouts[0]={type:'Ethics Opportunity',body:'Temporary reviewed callout text.'};const pkg={schemaVersion:1,status:'approved-locally',sandbox:SANDBOX,lesson,baseline:clone(lesson),conflicts:[],engineeringFixture:true};const report=await runAcceptedNativeRehearsal(bridge,pkg);$('#fixture-results').textContent=JSON.stringify({status:report.status,restored:report.restored,checksPassed:report.checksPassed,saved:report.saved,saveControlsInvoked:savedCalls,error:report.error,restorationError:report.restorationError},null,2);}catch(error){$('#fixture-results').textContent=error.message;}finally{calloutButton.disabled=false;}
};

function refreshTipIcons(ai,si){const root=document.querySelectorAll('.uitest-activity-card')[ai].querySelectorAll('textarea')[si].parentElement;for(const old of root.querySelectorAll('span[data-tip]'))old.remove();for(const [ci,tip]of current.activities[ai].activitySections[si].tips.entries()){const span=document.createElement('span');span.setAttribute('data-tip','true');span.setAttribute('data-for','fixture-tip-'+ai+'-'+si+'-'+ci);const icon=document.createElement('i');icon.textContent='Edit '+tip.type;Object.assign(icon.dataset,{editTip:ci,ai,si});span.append(icon);root.append(span);}}
const addActivity=document.createElement('button');addActivity.className='add-activity';addActivity.textContent='Activity';$('#activities-panel').append(addActivity);
addActivity.onmousedown=()=>{const ai=current.activities.length,key='activity-'+(++createdSequence),sk='activitySection-'+(++createdSequence);current.activities.push({key,position:ai+1,name:'',duration:'',activitySections:[{key:sk,position:1,name:'',duration:'',description:'',remarks:false,tips:[],scriptLevels:[],progressionName:'',levels:[]}]});const card=document.createElement('div');card.className='uitest-activity-card';card.innerHTML='<div><input class="uitest-activity-name-input" data-ai="'+ai+'" data-ak="name"><input class="uitest-activity-duration-input" data-ai="'+ai+'" data-ak="duration"><i class="fa-trash">Remove activity</i></div><div class="native-section"><div><input data-ai="'+ai+'" data-si="0" data-sk="name"><input data-ai="'+ai+'" data-si="0" data-sk="duration"><input type="checkbox" data-ai="'+ai+'" data-si="0" data-sk="remarks"></div><textarea data-ai="'+ai+'" data-si="0" data-sk="description"></textarea></div>';addActivity.before(card);decorateSection(card.querySelector('textarea'),ai,0);card.firstElementChild.querySelector('.fa-trash').onmousedown=()=>{const modal=document.createElement('div');modal.className='modal-content';modal.innerHTML='<h2>Are you sure you want to remove this activity?</h2><button>Delete</button>';modal.querySelector('button').onclick=()=>{current.activities.splice(ai,1);card.remove();modal.remove();sync();};card.append(modal);};sync();};
const completeStructure=document.createElement('button');completeStructure.textContent='Check new activities and existing-section callout';completeStructure.id='fixture-new-activities';document.querySelector('.actions').append(completeStructure);
completeStructure.onclick=async()=>{completeStructure.disabled=true;try{const lesson=clone(draft);lesson.sections[0].callouts.push({type:'Ethics Opportunity',body:'Appended callout with exact ownership.'});for(let i=0;i<2;i++){const id='new-activity-'+i;lesson.activities.push({id,title:'New activity '+i,duration:5});lesson.sections.push({id:'new-section-'+i,activityId:id,title:'Reflect',duration:null,body:'Discuss the evidence.',remarks:false,callouts:[{type:'Teaching Tip',body:'Use a specific example.'}],progression:null});}const pkg={schemaVersion:1,status:'approved-locally',sandbox:SANDBOX,lesson,baseline:clone(lesson),conflicts:[],engineeringFixture:true};const report=await runAcceptedNativeRehearsal(bridge,pkg);$('#fixture-results').textContent=JSON.stringify({status:report.status,restored:report.restored,checksPassed:report.checksPassed,saved:report.saved,saveControlsInvoked:savedCalls,error:report.error,restorationError:report.restorationError},null,2);}finally{completeStructure.disabled=false;}};
