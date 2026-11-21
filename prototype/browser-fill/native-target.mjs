export function verificationDestination(value){
 const url=new URL(value||'about:blank');
 if(url.origin==='https://levelbuilder-studio.code.org'&&url.pathname==='/lessons/8898984/edit'&&!url.search&&!url.hash)return {id:8898984,url:url.href};
 return null;
}
export async function prepareNativeTarget(tabs,tabId){
 const tab=await tabs.get(tabId),url=new URL(tab.url||'about:blank');
 const paths=['/courses/6-12-dev-playground/units/16/lessons/11/edit','/s/scottsdale-levelbuilder-exploration/lessons/11/edit','/lessons/8898985/edit'];
 if(url.origin!=='https://levelbuilder-studio.code.org'||(!verificationDestination(tab.url)&&!paths.includes(url.pathname.replace(/\/$/,''))))throw Error('The authorized editor tab is no longer the assigned playground. No checks were started.');
 if(tab.discarded)throw Error('The browser discarded the editor. Reopen it and recompare before starting another check; unsaved state cannot be assumed.');
 const before={title:tab.title,url:tab.url,status:tab.status,active:tab.active,discarded:tab.discarded,frozen:tab.frozen};
 await tabs.update(tabId,{active:true});
 return before;
}
