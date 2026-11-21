import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createNotionService} from './notion-service.mjs';
import {notionRoutes} from './notion-http.mjs';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
export function createPreviewServer({clientId=process.env.NOTION_CLIENT_ID,clientSecret=process.env.NOTION_CLIENT_SECRET,fetchImpl=fetch}={}){
 const routers=new Map();
 const server=http.createServer(async(req,res)=>{
  const port=server.address().port,allowed=['127.0.0.1:'+port,'localhost:'+port];
  const origin='http://'+req.headers.host;
  if(!allowed.includes(req.headers.host)){res.writeHead(403);return res.end('Use the local Lesson Studio address.');}
  if(!routers.has(origin))routers.set(origin,notionRoutes(createNotionService({origin,clientId,clientSecret,fetchImpl}),{origin}));
  const routes=routers.get(origin);
  try{
   if(req.headers.host!==new URL(origin).host){res.writeHead(403);return res.end('Use '+origin);}
   const url=new URL(req.url,origin);
   if(url.pathname==='/notion.html'&&url.hostname==='127.0.0.1'){url.hostname='localhost';res.writeHead(302,{Location:url.href});return res.end();}
   if(await routes(req,res,url))return;
   if(req.method!=='GET'){res.writeHead(405);return res.end('Use the application controls');}
   const pathname=decodeURIComponent(url.pathname),target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
   const relative=path.relative(root,target);if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);return res.end();}
   const data=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(data);
  }catch{if(!res.headersSent)res.writeHead(404);res.end('Not found');}
 });return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||4316);createPreviewServer().listen(port,'127.0.0.1',()=>console.log(`Lesson Studio: http://localhost:${port}\nServing: ${root}`));
}
