import {structureProblems} from './source-revisions.mjs';
import {validateSource} from './core.mjs';
export function workspaceBackup(state){return {kind:'lesson-studio-workspace',schemaVersion:1,createdAt:new Date().toISOString(),state:structuredClone(state)};}
export function readWorkspaceBackup(text){
 if(text.length>32000000)throw Error('Choose a workspace backup smaller than 32 MB.');
 const backup=JSON.parse(text);if(backup.kind!=='lesson-studio-workspace'||backup.schemaVersion!==1)throw Error('Choose a workspace backup, not a source or review package.');
 const s=backup.state;validateSource(s?.source);
 for(const lesson of [s.draft,s.generated,...(s.baseline?[s.baseline]:[])]){
  if(!lesson||typeof lesson.title!=='string'||!lesson.frontMatter)throw Error('The backup is missing lesson content.');
  for(const key of ['activities','sections','resources','warnings'])if(!Array.isArray(lesson[key]))throw Error('The backup has incomplete lesson lists.');
  if(structureProblems(lesson).length)throw Error('The backup has orphaned or duplicate teaching records.');
  if(!Array.isArray(lesson.frontMatter.objectives)||!Array.isArray(lesson.frontMatter.vocabulary))throw Error('The backup has incomplete front matter.');
  if(lesson.sections.some(x=>!x||typeof x.id!=='string'||typeof x.body!=='string'||!Array.isArray(x.callouts)))throw Error('The backup has an incomplete teaching section.');
 }
 for(const key of ['reviewed','flags','conflicts'])if(!Array.isArray(s[key]))throw Error('The backup is missing review history.');
 if(typeof s.approved!=='boolean'||(s.resourceBuffer!=null&&typeof s.resourceBuffer!=='string'))throw Error('The backup has invalid review state.');
 return structuredClone(s);
}
export function restoreWorkspace(storage,text,id){const state=readWorkspaceBackup(text),key='lesson-studio-workspace-'+id;if(storage.getItem(key)!==null)throw Error('This workspace already exists.');storage.setItem(key,JSON.stringify(state));return key;}
