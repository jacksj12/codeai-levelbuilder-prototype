// Serialized into the user-selected Slides tab. Read-only, same-origin export.
export async function sourcePageExport(expectedUrl){
 const here=new URL(location.href),expected=new URL(expectedUrl),pattern=/^\/presentation\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]+)\/(?:edit|preview)(?:\/|$)/;
 const id=here.pathname.match(pattern)?.[1];
 if(here.origin!=='https://docs.google.com'||expected.origin!==here.origin||!id||expected.pathname.match(pattern)?.[1]!==id)throw Error('Return to the selected Google Slides deck before importing.');
 const response=await fetch('/presentation/d/'+id+'/export/pptx',{method:'GET',credentials:'same-origin',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Google could not export this deck. Check access or import a downloaded PowerPoint file.');
 if(!response.body)throw Error('Google returned an empty export.');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>32_000_000){await reader.cancel();throw Error('Presentation exceeds the 32 MB import limit.');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
 if(bytes[0]!==80||bytes[1]!==75)throw Error('Google returned a sign-in or error page instead of a presentation.');
 // Chrome scripting returns JSON-serializable values rather than ArrayBuffers.
 let encoded='';for(let i=0;i<bytes.length;i+=16384)encoded+=String.fromCharCode(...bytes.subarray(i,i+16384));
 return {kind:'google-slides-export',deckUrl:'https://docs.google.com/presentation/d/'+id+'/edit',name:document.title.replace(/ - Google Slides$/,'')+'.pptx',base64:btoa(encoded)};
}
