import {canonical,digest} from '../dist/transfer-core.mjs';
// Reload only after a native final capture/baseline check; never click vocabulary Delete.
export function withReviewedReload(edit,{tabs,tabId,destination,timeoutMs=15000}){
 return async request=>{
  if(request.action!=='reload-reviewed-editor')return edit(request);
  if(request.mode!=='restore-reviewed-rehearsal'||!request.initialCapture)throw Error('Reviewed restoration evidence is required.');
  const authorization=await edit({...request,action:'authorize-reviewed-reload'});
  if(authorization?.kind!=='reviewed-reload-authorization'||authorization.captureDigest!==request.expectedCaptureDigest||authorization.baselineDigest!==await digest(request.initialCapture.saved))throw Error('The editor reload was not authorized by current evidence.');
  const tab=await tabs.get(tabId);if(tab.url!==destination.url||tab.discarded)throw Error('The selected editor changed before restoration.');
  await new Promise((resolve,reject)=>{let timer,done=false;const finish=error=>{if(done)return;done=true;clearTimeout(timer);tabs.onUpdated.removeListener(listener);error?reject(error):resolve();};const listener=(id,change,updated)=>{if(id!==tabId)return;if(updated?.url&&updated.url!==destination.url)finish(Error('The editor navigated during restoration.'));else if(change.status==='complete')finish();};tabs.onUpdated.addListener(listener);timer=setTimeout(()=>finish(Error('Editor restoration timed out. Read the editor before taking further action.')),timeoutMs);Promise.resolve(tabs.reload(tabId)).catch(finish);});
  const restored=await edit({action:'read'});if(canonical(restored)!==canonical(request.initialCapture))throw Error('The reloaded editor differs from its original capture. No save was sent.');return restored;
 };
}
