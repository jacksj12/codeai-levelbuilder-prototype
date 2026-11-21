export function createNativeTransport(execute,{timeoutMs=15000}={}){
 if(!Number.isInteger(timeoutMs)||timeoutMs<1)throw Error('Invalid native timeout.');
 let paused=false;
 return async request=>{
  if(paused&&!['read','context','search'].includes(request.action))throw Error('Native writes are paused after a timeout. Recompare the current editor before resuming.');
  let timer;
  const encoded=JSON.stringify({...request,transportErrors:true,deadlineAt:Date.now()+Math.max(1,timeoutMs-1000)});
  try{
   const result=await Promise.race([execute(encoded),new Promise((_,reject)=>{timer=setTimeout(()=>{paused=true;reject(Error('The native operation timed out. Further writes are paused; keep the editor open for recovery.'));},timeoutMs);})]);
   if(result?.nativeBridgeError){const error=Error(result.nativeBridgeError);error.nativeCapture=result.diagnosticCapture;throw error;}
   if(!result)throw Error('The editor did not return verified readback.');
   return result;
  }finally{clearTimeout(timer);}
 };
}
