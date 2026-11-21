import test from 'node:test';import assert from 'node:assert/strict';
import {createNotionService,notionPageId} from '../notion-service.mjs';
import {createPreviewServer} from '../server.mjs';
const id='123456781234123412341234567890ab';const response=data=>new Response(JSON.stringify(data));
function harness(fetchImpl,extra={}){const service=createNotionService({origin:'http://127.0.0.1:4316',clientId:'test-client',clientSecret:'test-secret',fetchImpl,...extra});const {value}=service.session('',true);return {service,value};}
async function signIn(service,value){const url=new URL(service.start(value));await service.callback(value,new URLSearchParams({state:url.searchParams.get('state'),code:'test-code'}));}
test('OAuth binds one-use state to its session and never exposes credentials in status',async()=>{
 let calls=0;const {service,value}=harness(async(url,options)=>{calls++;assert.equal(url,'https://api.notion.com/v1/oauth/token');assert.equal(options.redirect,'error');assert.equal(JSON.parse(options.body).code,'test-code');return response({access_token:'private-token',refresh_token:'private-refresh',workspace_name:'Test workspace'});});
 const link=new URL(service.start(value)),params=new URLSearchParams({state:link.searchParams.get('state'),code:'test-code'});
 await assert.rejects(service.callback(service.session('',true).value,params),/expired/);assert.equal(calls,0);await service.callback(value,params);await assert.rejects(service.callback(value,params),/expired/);
 assert.equal(service.status(value).connected,true);assert.ok(!JSON.stringify(service.status(value)).includes('private'));assert.equal(calls,1);service.disconnect(value);assert.equal(service.status(value).connected,false);
});
test('expired and denied authorization never exchange a code',async()=>{
 let clock=0;const {service,value}=harness(async()=>{throw Error('Must not exchange');},{now:()=>clock});let url=new URL(service.start(value));clock=600001;await assert.rejects(service.callback(value,new URLSearchParams({state:url.searchParams.get('state'),code:'code'})),/expired/);
 url=new URL(service.start(value));await assert.rejects(service.callback(value,new URLSearchParams({state:url.searchParams.get('state'),error:'access_denied'})),/cancelled/);
});
test('signed-in import reads complete pagination and nested children without any content writes',async()=>{
 const calls=[];const nested='abcdefab1234123412341234567890ab';
 const {service,value}=harness(async(url,options)=>{calls.push([url,options.method]);if(url.endsWith('/oauth/token'))return response({access_token:'private'});assert.equal(options.headers.Authorization,'Bearer private');
  if(url.includes('/pages/'))return response({last_edited_time:'same',properties:{Name:{type:'title',title:[{plain_text:'Real title'}]}}});
  if(url.includes('/blocks/'+nested))return response({results:[{type:'paragraph',paragraph:{rich_text:[{plain_text:'Nested content'}]}}],has_more:false});
  if(url.includes('start_cursor='))return response({results:[{id:nested,type:'column',has_children:true}],has_more:false});
  return response({results:[{type:'heading_2',heading_2:{rich_text:[{plain_text:'Teacher overview'}]}}],has_more:true,next_cursor:'page2'});
 });await signIn(service,value);const result=await service.importPage(value,'https://www.notion.so/Lesson-'+id);assert.equal(result.title,'Real title');assert.equal(result.fields.teacherOverview,'Nested content');assert.ok(calls.slice(1).every(([,method])=>method==='GET'));assert.ok(!JSON.stringify(result).includes('private'));
});
test('token refresh rotates credentials once and resumes a read',async()=>{
 let tokens=0;const {service,value}=harness(async(url,options)=>{
  if(url.endsWith('/oauth/token')){tokens++;return response({access_token:tokens===1?'old':'new',refresh_token:'refresh'+tokens});}
  if(options.headers.Authorization==='Bearer old')return new Response('',{status:401});
  if(url.includes('/pages/'))return response({last_edited_time:'same',properties:{}});
  return response({results:[{type:'heading_2',heading_2:{rich_text:[{plain_text:'Purpose'}]}},{type:'paragraph',paragraph:{rich_text:[{plain_text:'Read only'}]}}],has_more:false});
 });await signIn(service,value);assert.equal((await service.importPage(value,id)).fields.purpose,'Read only');assert.equal(tokens,2);
});
test('bad page URLs and incomplete pagination return no partial brief',async()=>{
 assert.throws(()=>notionPageId('https://evil.example/'+id),/Notion page/);assert.throws(()=>notionPageId('http://127.0.0.1/secret'),/complete/);
 const {service,value}=harness(async url=>url.endsWith('/oauth/token')?response({access_token:'token'}):url.includes('/pages/')?response({last_edited_time:'same'}):response({results:[],has_more:true,next_cursor:null}));await signIn(service,value);await assert.rejects(service.importPage(value,id),/pagination/);assert.equal(value.importing,false);
});
test('HTTP connection routes require a same-origin session and CSRF token',async()=>{
 const server=createPreviewServer({clientId:'test',clientSecret:'secret',fetchImpl:async()=>{throw Error('Unexpected network');}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const origin='http://127.0.0.1:'+server.address().port,response=await fetch(origin+'/api/notion/status'),state=await response.json(),cookie=response.headers.get('set-cookie').split(';')[0];assert.ok(response.headers.get('set-cookie').includes('HttpOnly'));
  const blocked=await fetch(origin+'/api/notion/start',{method:'POST',headers:{Cookie:cookie,Origin:'https://evil.example','X-Lesson-CSRF':state.csrf}});assert.equal(blocked.status,403);
  const missing=await fetch(origin+'/api/notion/start',{method:'POST',headers:{Cookie:cookie,Origin:origin}});assert.equal(missing.status,400);
  const allowed=await fetch(origin+'/api/notion/start',{method:'POST',headers:{Cookie:cookie,Origin:origin,'X-Lesson-CSRF':state.csrf}});assert.equal(allowed.status,200);assert.equal(new URL((await allowed.json()).url).hostname,'api.notion.com');
  const traversal=await fetch(origin+'/%2e%2e%2f.env');assert.equal(traversal.status,403);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('disconnect during a pending token exchange cannot reconnect the session',async()=>{
 let release;const pending=new Promise(resolve=>release=resolve);const {service,value}=harness(async()=>{await pending;return response({access_token:'private'});});const url=new URL(service.start(value));const job=service.callback(value,new URLSearchParams({state:url.searchParams.get('state'),code:'code'}));service.disconnect(value);release();await assert.rejects(job,/disconnected/);assert.equal(service.status(value).connected,false);
});
test('source changes during Notion import are rejected rather than returning a mixed revision',async()=>{
 let pageReads=0;const {service,value}=harness(async url=>{if(url.endsWith('/oauth/token'))return response({access_token:'private'});if(url.includes('/pages/'))return response({last_edited_time:String(++pageReads)});return response({results:[],has_more:false});});await signIn(service,value);await assert.rejects(service.importPage(value,id),/changed during import/);
});
test('unconfigured sign-in explains setup without creating an authorization request',()=>{const service=createNotionService({origin:'http://localhost:4316'}),{value}=service.session('',true);assert.equal(service.status(value).configured,false);assert.throws(()=>service.start(value),/client ID and secret/);});
