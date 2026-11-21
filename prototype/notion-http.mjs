export function notionRoutes(service,{origin}){
 const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 return async(req,res,url)=>{
  if(!url.pathname.startsWith('/api/notion/'))return false;
  if(req.headers.host!==new URL(origin).host){reply(res,403,{error:'Use the local Lesson Studio address.'});return true;}
  const callback=url.pathname==='/api/notion/callback';
  if(!callback&&(req.headers.origin&&req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){reply(res,403,{error:'Open Lesson Studio directly.'});return true;}
  try{
   const {id,value}=service.session(req.headers.cookie,url.pathname==='/api/notion/status'&&req.method==='GET');
   if(!value)throw Error('Open Notion connection settings first.');
   if(url.pathname==='/api/notion/status'&&req.method==='GET'){res.setHeader('Set-Cookie',`lesson_notion=${id}; HttpOnly; SameSite=Lax; Path=/api/notion; Max-Age=28800`);reply(res,200,service.status(value));return true;}
   if(callback&&req.method==='GET'){
    try{await service.callback(value,url.searchParams);res.writeHead(303,{Location:'/notion.html?connected=1','Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();}
    catch{res.writeHead(303,{Location:'/notion.html?connection=failed','Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();}return true;
   }
   if(req.method!=='POST'){reply(res,405,{error:'Use the connection controls.'});return true;}
   if(req.headers.origin!==origin||req.headers['x-lesson-csrf']!==value.csrf)throw Error('This connection action expired. Reload the page and try again.');
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8000)throw Error('Request is too large.');}const data=raw?JSON.parse(raw):{};
   if(url.pathname==='/api/notion/start')reply(res,200,{url:service.start(value)});
   else if(url.pathname==='/api/notion/import')reply(res,200,await service.importPage(value,data.page));
   else if(url.pathname==='/api/notion/disconnect'){service.disconnect(value);reply(res,200,{connected:false});}
   else reply(res,404,{error:'Unknown connection action.'});
  }catch(error){reply(res,400,{error:error instanceof SyntaxError?'Unreadable request.':error.message});}return true;
 };
}
