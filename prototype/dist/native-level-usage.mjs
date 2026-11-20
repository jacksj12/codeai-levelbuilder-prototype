import {reviewedLevelGroups} from './reviewed-structure.mjs';
// Serialized into the assigned editor. GET only; never submit the level forms.
export async function readAssignedLevelUsage(request={}){
 try{
  if(typeof request==='string')request=JSON.parse(request);
  const selected=request.destination;
 const destination=selected||{id:8898985,url:'https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11'};
 if(selected&&(request.practiceConfirmed!==true||!Number.isSafeInteger(selected.id)||selected.id<1||selected.url!=='https://levelbuilder-studio.code.org/lessons/'+selected.id+'/edit'))throw Error('Invalid selected destination.');
  const aliases=['/courses/6-12-dev-playground/units/16/lessons/11/edit','/s/scottsdale-levelbuilder-exploration/lessons/11/edit','/lessons/8898985/edit'];
  if(location.origin!=='https://levelbuilder-studio.code.org'||!(selected?location.href===selected.url:aliases.includes(location.pathname.replace(/\/$/,''))))throw Error('Open the assigned playground editor first.');
  if(JSON.parse(document.querySelector('script[data-lesson]')?.getAttribute('data-lesson')||'null')?.id!==destination.id)throw Error('The assigned lesson identity is missing.');
  const {levelId,name}=request;
  if(!/^\d+$/.test(String(levelId))||Number(levelId)<1||typeof name!=='string'||!name.trim())throw Error('An exact existing-level identity is required.');
  const response=await fetch('/levels/'+levelId+'/edit',{credentials:'same-origin',redirect:'error',cache:'no-store'});
  if(!response.ok)throw Error('Could not read existing level usage.');
  const doc=new DOMParser().parseFromString(await response.text(),'text/html');
  if(doc.querySelector('#level_name')?.getAttribute('value')!==name)throw Error('The returned level name does not match its approved identity.');
  if(!doc.querySelector('form.edit_level'))throw Error('The existing-level editor format changed.');
  const paths=[...doc.querySelectorAll('input.publishLevel[name="redirect"]')].map(n=>n.getAttribute('value'));
  if(paths.some(path=>!/^\/s\/[^/]+\/lessons\/\d+\/levels\//.test(path)))throw Error('An existing level usage path could not be interpreted.');
  return {kind:'native-level-usage',levelId:String(levelId),name,paths,readAt:Date.now(),remoteWrites:false};
 }catch(error){if(request.transportErrors===true)return {nativeBridgeError:String(error.message)};throw error;}
}

export function findUnitLevelConflicts(review,usages){
 if(!reviewedLevelGroups(review).flatMap(c=>c.addLevels).length)return {passed:true,unit:null,conflicts:[]};
 const match=review.baseline.lessonPath?.match(/^\/s\/([^/]+)\/lessons\/\d+$/);
 if(!match)throw Error('The destination unit identity could not be established.');
 const prefix='/s/'+match[1]+'/lessons/',wanted=reviewedLevelGroups(review).flatMap(c=>c.addLevels),conflicts=[];
 for(const level of wanted){
  const evidence=usages.filter(u=>u.kind==='native-level-usage'&&u.levelId===String(level.levelId)&&u.name===level.name&&Array.isArray(u.paths));
  if(evidence.length!==1)throw Error('Unique existing-unit usage evidence is required for '+level.name+'.');
  const paths=evidence[0].paths.filter(path=>path.startsWith(prefix));
  if(paths.length)conflicts.push({name:level.name,levelId:level.levelId,paths});
 }
 return {passed:conflicts.length===0,unit:match[1],conflicts};
}
