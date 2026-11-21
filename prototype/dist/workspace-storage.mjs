// Optimistic local persistence: retain both drafts when another tab changes the stored revision.
export function saveWorkspace(storage,key,state,expected,newId=()=>crypto.randomUUID()){
 const value=JSON.stringify(state),actual=storage.getItem(key);
 if(actual!==expected&&actual!==value){
  const id=newId(),forkKey='lesson-studio-workspace-'+id;
  if(storage.getItem(forkKey)!==null)throw Error('The recovery workspace already exists. Export a backup.');
  storage.setItem(forkKey,value);return {key:forkKey,value,id,forked:true};
 }
 storage.setItem(key,value);return {key,value,forked:false};
}
