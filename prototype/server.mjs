import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const port=Number(process.env.PORT||4316);
const types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
http.createServer(async(req,res)=>{
 if(req.method!=='GET'){res.writeHead(405);return res.end('Read-only preview');}
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!target.startsWith(root)){res.writeHead(403);return res.end();}const data=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Lesson Studio: http://127.0.0.1:${port}\nServing: ${root}`));
