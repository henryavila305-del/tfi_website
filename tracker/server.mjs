import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { openStore } from './store.mjs';
import { fail } from './domain.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const publicFiles=new Map([
  ['/','index.html'],['/index.html','index.html'],['/styles.css','styles.css'],['/app.js','app.js'],['/favicon.svg','favicon.svg'],
  ['/tracker/','tracker/index.html'],['/tracker','tracker/index.html'],['/tracker/ui.css','tracker/ui.css'],['/tracker/ui.mjs','tracker/ui.mjs'],['/tracker/domain.mjs','tracker/domain.mjs']
]);
const types={html:'text/html',css:'text/css',mjs:'text/javascript',js:'text/javascript',svg:'image/svg+xml'};
const tokenFrom=req=>/\btfi_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1];
async function body(req) {
  if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'JSON required');
  let size=0,parts=[];
  for await(const chunk of req){size+=chunk.length;if(size>16384)fail(413,'Request too large');parts.push(chunk);}
  try{const parsed=JSON.parse(Buffer.concat(parts).toString());if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))fail(400,'JSON object required');return parsed;}catch{fail(400,'Invalid JSON object');}
}
export function createTrackerServer(store) {
  const attempts=new Map();
  return http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    res.setHeader('Cache-Control','no-store');
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
    try {
      const expectedHost=`127.0.0.1:${res.socket.localPort}`;
      if(req.headers.host!==expectedHost)fail(403,'Local preview only: use the printed 127.0.0.1 address');
      const url=new URL(req.url,`http://${expectedHost}`),path=url.pathname;
      if(!['GET','POST'].includes(req.method))fail(405,'Method not allowed');
      if(req.method==='POST'&&req.headers.origin!==`http://${expectedHost}`)fail(403,'Same-origin request required');
      if(path==='/api/health'&&req.method==='GET')return send(200,{mode:'isolated-local-beta',payments:false,liveFeed:false});
      if(req.method==='POST'&&['/api/register','/api/login'].includes(path)){
        const key=req.socket.remoteAddress, now=Date.now();
        let attempt=attempts.get(key);if(!attempt||attempt.until<=now){attempt={n:0,until:now+60000};attempts.set(key,attempt);}
        if(++attempt.n>10)fail(429,'Too many attempts; wait one minute');
        const input=await body(req);
        if(path==='/api/register')return send(201,{user:store.register(input)});
        const result=store.login(input);res.setHeader('Set-Cookie',`tfi_session=${result.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);return send(200,{user:result.user});
      }
      if(path.startsWith('/api/public/')&&req.method==='GET')return send(200,store.publicRecord(decodeURIComponent(path.slice('/api/public/'.length))));
      if(path.startsWith('/api/')){
        const token=tokenFrom(req),user=store.authenticate(token);
        if(path==='/api/dashboard'&&req.method==='GET')return send(200,store.dashboard(user.id));
        if(path==='/api/logout'&&req.method==='POST'){await body(req);store.logout(token);res.setHeader('Set-Cookie','tfi_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(200,{ok:true});}
        if(path==='/api/profile'&&req.method==='POST')return send(200,store.setProfile(user.id,(await body(req)).enabled));
        if(path==='/api/picks'&&req.method==='POST')return send(201,store.add(user.id,await body(req)));
        const match=/^\/api\/picks\/([a-f0-9-]{36})\/(publish|settle|audit)$/.exec(path);
        if(match){const [,id,action]=match;
          if(action==='audit'&&req.method==='GET')return send(200,store.audit(user.id,id));
          if(req.method==='POST'&&action==='publish'){await body(req);return send(200,store.publish(user.id,id));}
          if(req.method==='POST'&&action==='settle')return send(200,store.settle(user.id,id,await body(req)));
        }
        fail(404,'Not found');
      }
      const file=publicFiles.get(path);
      if(req.method!=='GET'||!file)fail(404,'Not found');
      const content=await readFile(resolve(root,file));res.writeHead(200,{'Content-Type':`${types[file.split('.').pop()]}; charset=utf-8`});res.end(content);
    }catch(e){send(e.status||500,{error:e.status?e.message:'Unable to process request'});}
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await mkdir(resolve(root,'.tracker-data'),{recursive:true});
  const store=openStore(resolve(root,'.tracker-data/beta.sqlite'));
  const server=createTrackerServer(store);
  server.listen(4174,'127.0.0.1',()=>console.log('Isolated local beta: http://127.0.0.1:4174/tracker/'));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{store.close();process.exit(0);}));
}
