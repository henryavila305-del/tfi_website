import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {easternDate,validDate,sanitizeRows,readPublicFeed} from '../lib/public-feed.mjs';
import {createHandler} from '../api/public-feed.js';
const row=()=>({id:'00000000-0000-0000-0000-000000000001',sport:'NFL',category:'Top 3 #1',selection:'Synthetic team ML',odds:-150,game_date:'2026-11-08',status:'win'});
const config={supabaseUrl:'https://tksgilnmlhkcxgawdlzu.supabase.co',supabasePublishableKey:'sb_publishable_synthetic'};
test('ET date and public projection reject private categories and malformed data',()=>{
  assert.equal(easternDate(new Date('2026-11-09T02:00:00Z')),'2026-11-08');
  assert(!validDate('2026-02-30'));assert(!validDate('2026-11-08&select=*'));
  const safe=sanitizeRows([{...row(),privateNote:'must not escape'}],'2026-11-08');
  assert(!JSON.stringify(safe).includes('must not escape'));assert(!('privateNote' in safe[0]));
  for(const change of [{category:'Main Premium'},{status:'final'},{game_date:'2026-11-07'},{odds:-3}])assert.throws(()=>sanitizeRows([{...row(),...change}],'2026-11-08'));
  assert.throws(()=>sanitizeRows([row(),row()],'2026-11-08'));
});
test('feed requests fixed public config and public table using only an anonymous key',async()=>{
  const calls=[];
  const data=await readPublicFeed('2026-11-08',{fetchImpl:async(url,options)=>{calls.push({url,options});return Response.json(calls.length===1?config:[row()]);},now:()=>new Date('2026-11-09T02:00:00Z')});
  assert.equal(calls.length,2);assert.equal(calls[0].url,'https://tfi-live-tracker.vercel.app/api/config');
  const url=new URL(calls[1].url);assert.equal(url.pathname,'/rest/v1/tfi_public_feed');assert.equal(url.searchParams.get('game_date'),'eq.2026-11-08');
  assert.equal(calls[1].options.method,'GET');assert.equal(calls[1].options.redirect,'error');assert.equal(calls[1].options.headers.apikey,config.supabasePublishableKey);
  assert(!calls[1].options.headers.Authorization);assert.equal(data.items.length,1);
  assert(!JSON.stringify(data).includes(config.supabasePublishableKey));
  for(const bad of [{...config,supabaseUrl:'https://attacker.invalid'},{...config,supabasePublishableKey:'sb_secret_hidden'}, {...config,supabasePublishableKey:'x.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.x'}]){
    let count=0;await assert.rejects(readPublicFeed('2026-11-08',{fetchImpl:async()=>{count++;return Response.json(bad);}}));assert.equal(count,1);
  }
  await assert.rejects(readPublicFeed('2026-11-08',{fetchImpl:async()=>new Response('denied',{status:403})}));
  await assert.rejects(readPublicFeed('2026-11-08',{fetchImpl:async()=>new Response('x'.repeat(200001))}));
});
test('API denies writes and arbitrary query inputs; upstream errors are generic',async()=>{
  let calls=0;const handler=createHandler(async()=>{calls++;throw new Error('Private upstream details');});
  function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}};}
  for(const [method,url,expected] of [['POST','/api/public-feed',405],['GET','/api/public-feed?date=bad',400],['GET','/api/public-feed?table=tfi_picks',400],['GET','/api/public-feed?date=2026-11-08&date=2026-11-09',400]]){const res=response();await handler({method,url},res);assert.equal(res.code,expected);}
  assert.equal(calls,0);const res=response();await handler({method:'GET',url:'/api/public-feed?date=2026-11-08'},res);assert.equal(res.code,503);assert(!JSON.stringify(res.body).includes('Private'));assert.equal(res.headers['Cache-Control'],'no-store');
});
test('browser feed renders text safely, clears stale rows on failure and skips hidden polling',async()=>{
  const events={};let fetchCount=0;let fail=false;let interval;
  function node(){return {children:[],value:'',disabled:false,textContent:'',append(...v){this.children.push(...v);},replaceChildren(...v){this.children=v;},addEventListener(k,v){this[k]=v;}};}
  const input=node(),button=node(),status=node(),list=node();
  const root={querySelector:s=>s==='input'?input:s==='button'?button:s==='[role="status"]'?status:list};
  const document={hidden:false,querySelector:()=>root,createElement:()=>node(),addEventListener(k,v){events[k]=v;}};
  vm.runInNewContext(await readFile('feed.js','utf8'),{document,Intl,Date,AbortSignal,encodeURIComponent,setInterval:f=>{interval=f;},fetch:async()=>{fetchCount++;return {ok:!fail,json:async()=>({date:input.value,timezone:'America/New_York',retrievedAt:'2026-11-09T02:00:00Z',items:[{...sanitizeRows([row()],'2026-11-08')[0],eventDate:input.value,selection:'<img onerror=attack>'}]})};}});
  // Flush the finite fetch/json promise chain, without timers or network.
  for(let i=0;i<8;i++)await Promise.resolve();
  assert.equal(list.children.length,1);assert.equal(list.children[0].children[1].textContent,'<img onerror=attack>');
  document.hidden=true;await interval();assert.equal(fetchCount,1);
  document.hidden=false;fail=true;await button.click();assert.equal(list.children.length,0);assert(status.textContent.includes('unavailable'));
  assert.equal(button.disabled,false);assert.equal(input.disabled,false);
});
test('read-only live public source smoke check (one CI matrix job)',{skip:process.env.CI!=='true'||process.platform!=='linux'||Number(process.versions.node.split('.')[0])!==24},async()=>{
  // Public GETs only; no grader request, auth/session, writes, raw rows or keys in logs.
  const data=await readPublicFeed('2026-11-03');
  assert(data.items.length>0,'Expected existing dated public feed rows');
  assert(data.items.every(p=>['Top 3 #1','Top 3 #2','Top 3 #3'].includes(p.category)));
  console.log(`Read-only live source verified: ${data.items.length} sanitized public rows. No grading or database writes.`);
});
