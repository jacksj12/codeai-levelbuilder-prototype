import {randomBytes} from 'node:crypto';
import {notionBlocks} from './dist/source-imports.mjs';
const nonce=()=>randomBytes(32).toString('hex');
const VERSION='2026-03-11';
export function notionPageId(value){
 let text=String(value||'').trim();
 if(text.startsWith('https://')){const url=new URL(text);if(!['notion.so','www.notion.so','notion.com','www.notion.com','app.notion.com'].includes(url.hostname)&&!url.hostname.endsWith('.notion.site'))throw Error('Choose a Notion page URL.');text=url.pathname.split('/').filter(Boolean).at(-1)||'';}
 const id=text.match(/(?:^|-)([a-f\d]{32}|[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12})$/i)?.[1];
 if(!id)throw Error('Paste the complete Notion page URL or page ID.');return id.replaceAll('-','');
}
export function createNotionService({origin,clientId='',clientSecret='',fetchImpl=fetch,now=Date.now}={}){
 const sessions=new Map(),redirectUri=origin+'/api/notion/callback';
 const configured=Boolean(clientId&&clientSecret);
 function session(cookie='',create=false){
  for(const [key,item]of sessions)if(item.expires<=now())sessions.delete(key);
  let id=cookie.match(/(?:^|;\s*)lesson_notion=([a-f\d]{64})(?:;|$)/)?.[1],value=sessions.get(id);
  if(!value&&create){if(sessions.size>=1000)throw Error('Too many local sign-in sessions. Restart the local server.');id=nonce();value={csrf:nonce(),expires:now()+8*60*60*1000};sessions.set(id,value);}
  return {id,value};
 }
 async function jsonRequest(url,options){
  let response;try{response=await fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw Error('Notion could not be reached. Try again; the draft is unchanged.');}
  if(!response.ok){const error=Error(response.status===401?'Notion sign-in expired. Connect again.':response.status===403||response.status===404?'Notion could not read that page. Check that it is shared with this connection.':response.status===429?'Notion is busy. Wait briefly and retry the import.':'Notion returned an error. The draft is unchanged.');error.status=response.status;throw error;}
  const reader=response.body.getReader();let length=0,chunks=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>4_000_000){await reader.cancel();throw Error('Notion response exceeds the import limit.');}chunks.push(value);}}finally{reader.releaseLock();}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('Notion returned an unreadable response.');}
 }
 async function token(body){
  const data=await jsonRequest('https://api.notion.com/v1/oauth/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(clientId+':'+clientSecret).toString('base64'),'Content-Type':'application/json','Notion-Version':VERSION},body:JSON.stringify(body)});
  if(typeof data.access_token!=='string'||!data.access_token)throw Error('Notion did not return a valid connection.');return data;
 }
 function start(value){if(!configured)throw Error('Notion sign-in needs the app client ID and secret configured on this local server.');value.pending={state:nonce(),expires:now()+600000};const url=new URL('https://api.notion.com/v1/oauth/authorize');for(const [key,item]of Object.entries({client_id:clientId,redirect_uri:redirectUri,response_type:'code',owner:'user',state:value.pending.state}))url.searchParams.set(key,item);return url.href;}
 async function callback(value,params){
  const pending=value?.pending;if(!pending||pending.expires<now()||params.get('state')!==pending.state)throw Error('This sign-in link expired or belongs to another browser. Start sign-in again.');delete value.pending;const generation=value.generation||0;
  if(params.has('error'))throw Error('Notion sign-in was cancelled. Your draft is unchanged.');
  const code=params.get('code');if(!code||code.length>2000)throw Error('Notion returned no valid sign-in code.');
  const data=await token({grant_type:'authorization_code',code,redirect_uri:redirectUri});if((value.generation||0)!==generation)throw Error('Notion was disconnected during sign-in.');value.auth={access:data.access_token,refresh:data.refresh_token,workspace:data.workspace_name||'Notion workspace'};
 }
 async function read(value,path){
  if(!value.auth)throw Error('Connect to Notion before importing a page.');
  const get=()=>jsonRequest('https://api.notion.com/v1/'+path,{method:'GET',headers:{Authorization:'Bearer '+value.auth.access,'Notion-Version':VERSION}});
  try{return await get();}catch(error){if(error.status!==401||!value.auth?.refresh)throw error;
   if(!value.refreshing)value.refreshing=token({grant_type:'refresh_token',refresh_token:value.auth.refresh}).then(data=>{if(!value.auth)throw Error('Notion was disconnected.');value.auth={...value.auth,access:data.access_token,refresh:data.refresh_token||value.auth.refresh};}).finally(()=>delete value.refreshing);
   await value.refreshing;return get();
  }
 }
 async function importPage(value,input){
  if(value.importing)throw Error('A Notion import is already running.');value.importing=true;
  try{const id=notionPageId(input),page=await read(value,'pages/'+id);let count=0,bytes=0,requests=0;const visited=new Set();
   async function children(parent,depth=0){
    if(depth>32||visited.has(parent))throw Error('The Notion page has unsupported nesting.');visited.add(parent);let cursor='',items=[];const cursors=new Set();
    do{if(++requests>200)throw Error('The Notion page needs too many requests. Import a smaller brief.');const data=await read(value,'blocks/'+parent+'/children?page_size=100'+(cursor?'&start_cursor='+encodeURIComponent(cursor):''));
     if(!Array.isArray(data.results))throw Error('Notion returned incomplete page content.');bytes+=JSON.stringify(data).length;if(bytes>2_000_000)throw Error('The Notion brief exceeds the import limit.');
     for(const block of data.results){if(++count>10000)throw Error('The Notion page has too many blocks.');if(block.has_children)block.children=await children(notionPageId(block.id),depth+1);items.push(block);}
     cursor=data.has_more?data.next_cursor:'';if(data.has_more&&(!cursor||cursors.has(cursor)))throw Error('Notion pagination is incomplete.');if(cursor)cursors.add(cursor);
    }while(cursor);return items;
   }
   const results=await children(id),latest=await read(value,'pages/'+id);if(page.last_edited_time!==latest.last_edited_time)throw Error('The Notion page changed during import. Retry to read one complete revision.');
   const brief=notionBlocks({results});const title=Object.values(page.properties||{}).find(property=>property.type==='title')?.title;
   if(Array.isArray(title))brief.title=title.map(t=>t.plain_text??t.text?.content??'').join('');
   return {...brief,sourceUrl:'https://www.notion.so/'+id,importedAt:new Date(now()).toISOString()};
  }finally{value.importing=false;}
 }
 return {configured,redirectUri,session,start,callback,importPage,disconnect:value=>{value.generation=(value.generation||0)+1;delete value.auth;delete value.pending;},status:value=>({configured,connected:Boolean(value.auth),workspace:value.auth?.workspace||null,csrf:value.csrf,redirectUri})};
}
