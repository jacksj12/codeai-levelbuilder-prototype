import {comparePackage} from './adapter.mjs';
import {readAssignedLesson} from './read-lesson.mjs';
const $=id=>document.getElementById(id);
let snapshot,pkg,report;
function node(tag,text,parent){const n=document.createElement(tag);n.textContent=text;parent.append(n);return n;}
function refresh(){
 report=null;$('download').disabled=true;$('result').replaceChildren();
 if(!snapshot||!pkg)return;
 try{
  report=comparePackage(pkg,snapshot);
  node('h2','Proposed text changes', $('result'));
  for(const change of report.changes){const a=node('article','',$('result'));node('h3',change.field,a);node('strong','Saved lesson',a);node('pre',change.current||'(empty)',a);node('strong','Proposed draft',a);node('pre',change.proposed||'(empty)',a);}
  node('p',`${report.counts.proposedActivities} proposed activities; ${report.counts.proposedSections} sections; ${report.counts.existingActivities} saved activities.`, $('result'));
  node('h2','Before saving can be supported',$('result'));const list=node('ul','',$('result'));for(const b of report.blockers)node('li',b,list);
  $('status').textContent='Comparison ready. Nothing was saved to Level Builder.';$('download').disabled=false;
 }catch(e){$('status').textContent=e.message;}
}
$('connect').onclick=async()=>{
 snapshot=null;refresh();$('connect').disabled=true;
 try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id)throw Error('No active browser tab.');
  const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:readAssignedLesson});
  if(!result?.result)throw Error('The assigned lesson could not be read.');snapshot=result.result;
  $('status').textContent=`Loaded saved lesson: ${snapshot.name}. Choose your review package.`;refresh();
 }catch(e){$('status').textContent=e.message;}finally{$('connect').disabled=false;}
};
$('package').onchange=async e=>{pkg=null;refresh();try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw Error('Choose a review package smaller than 2 MB.');pkg=JSON.parse(await file.text());$('status').textContent=snapshot?'Package loaded.':'Package loaded. Read the assigned lesson to compare.';refresh();}catch(e){$('status').textContent=e.message;}};
$('download').onclick=()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='levelbuilder-api-comparison.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
