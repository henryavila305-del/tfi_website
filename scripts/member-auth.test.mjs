import test from 'node:test';
import assert from 'node:assert/strict';
import {settings,session} from '../lib/member-auth.mjs';
import login from '../api/member-login.js';
import callback from '../api/member-callback.js';
import memberPicks from '../api/member-picks.js';
import logout from '../api/member-logout.js';
import {memberData} from '../lib/member-access.mjs';

const env={
  WHOP_MEMBERS_ENABLED:'true',WHOP_CLIENT_ID:'app_test',WHOP_CLIENT_SECRET:'synthetic-client-secret',
  WHOP_COMPANY_API_KEY:'synthetic-company-key',MEMBER_SESSION_SECRET:'synthetic-session-secret-at-least-32-characters',
  MEMBER_APP_URL:'https://preview.example.test',WHOP_PREMIUM_PRODUCT_ID:'prod_premium',
  WHOP_ALL_ACCESS_PRODUCT_ID:'prod_all',WHOP_SANDBOX:'true',
  SUPABASE_URL:'https://synthetic.supabase.co',SUPABASE_SECRET_KEY:'synthetic-database-secret'
};
Object.assign(process.env,env);
const response=()=>({
  headers:{},statusCode:200,
  setHeader(k,v){this.headers[k.toLowerCase()]=v;},
  getHeader(k){return this.headers[k.toLowerCase()];},
  status(n){this.statusCode=n;return this;},
  json(body){this.body=body;return this;},
  redirect(n,url){this.statusCode=n;this.location=url;return this;}
});
const cookies=res=>[res.getHeader('set-cookie')].flat().filter(Boolean).map(v=>v.split(';')[0]).join('; ');
async function flow(overrides={}) {
  const res=response(), cfg=settings();
  const s=await session({headers:{}},res,cfg,'__Host-tfi_oauth',600);
  Object.assign(s,{state:'synthetic-state',nonce:'synthetic-nonce',verifier:'synthetic-verifier',created:Date.now()},overrides);
  await s.save();
  return {method:'GET',headers:{cookie:cookies(res)},query:{code:'synthetic-code',state:'synthetic-state'}};
}
async function identity() {
  const res=response(),s=await session({headers:{}},res,settings());
  s.userId='user_test';s.signedInAt=Date.now();await s.save();
  return {method:'GET',headers:{cookie:cookies(res)},query:{tier:'all_access',userId:'user_attacker'}};
}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
function mock(t,fn) {const previous=globalThis.fetch;globalThis.fetch=fn;t.after(()=>{globalThis.fetch=previous;});}
function provider(claimChanges={}) {
  const claims={nonce:'synthetic-nonce',aud:env.WHOP_CLIENT_ID,sub:'user_test',exp:Math.floor(Date.now()/1000)+300,...claimChanges};
  return async url=>{
    if(url.endsWith('/oauth/token'))return json({access_token:'synthetic-token',id_token:'header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.signature'});
    if(url.endsWith('/oauth/userinfo'))return json({sub:'user_test'});
    throw Error('Unexpected provider URL');
  };
}
test('login uses sandbox, fresh state/nonce and S256; secrets stay out of redirect',async()=>{
  const one=response(),two=response();
  await login({method:'GET',headers:{}},one);await login({method:'GET',headers:{}},two);
  const a=new URL(one.location),b=new URL(two.location);
  assert.equal(a.origin,'https://sandbox-api.whop.com');
  assert.equal(a.searchParams.get('redirect_uri'),env.MEMBER_APP_URL+'/api/member-callback');
  assert.equal(a.searchParams.get('code_challenge_method'),'S256');
  assert.notEqual(a.searchParams.get('state'),b.searchParams.get('state'));
  assert.notEqual(a.searchParams.get('nonce'),b.searchParams.get('nonce'));
  assert(!one.location.includes(env.WHOP_CLIENT_SECRET));
  assert.match(String(one.getHeader('set-cookie')),/HttpOnly/);
  assert.match(String(one.getHeader('set-cookie')),/Secure/);
});
test('valid callback exchanges code server-side and creates an opaque identity session',async t=>{
  const calls=[];
  const p=provider();
  mock(t,async(url,options)=>{calls.push({url,options});return p(url);});
  const res=response();await callback(await flow(),res);
  assert.equal(res.location,'/members.html');
  const stored=await session({headers:{cookie:cookies(res)}},response(),settings());
  assert.equal(stored.userId,'user_test');
  assert.equal(stored.access_token,undefined);
  assert(!cookies(res).includes('synthetic-token'));
  const body=JSON.parse(calls[0].options.body);
  assert.equal(body.code_verifier,'synthetic-verifier');
  assert.equal(body.client_secret,env.WHOP_CLIENT_SECRET);
  assert.equal(calls[1].options.headers.Authorization,'Bearer synthetic-token');
});
test('forged, expired, future-dated and repeated-parameter callbacks do not reach Whop',async t=>{
  mock(t,async()=>{assert.fail('Whop must not be called');});
  for(const change of ['forged','expired','future','array','missing']) {
    const req=await flow(change==='expired'?{created:Date.now()-601000}:change==='future'?{created:Date.now()+60000}:{});
    if(change==='forged')req.query.state='attacker';
    if(change==='array')req.query.code=['one','two'];
    if(change==='missing')req.query.code='';
    const res=response();await callback(req,res);
    assert.equal(res.location,'/members.html?signin=expired');
  }
});
test('wrong nonce, audience, subject and expired claims cannot create a session',async t=>{
  const previous=console.error;console.error=()=>{};t.after(()=>{console.error=previous;});
  for(const changes of [{nonce:'wrong'},{aud:'app_other'},{sub:'user_other'},{exp:0},{exp:'9999999999'}]) {
    const fetchBefore=globalThis.fetch;globalThis.fetch=provider(changes);
    try {
      const res=response();await callback(await flow(),res);
      assert.match(res.location,/signin=failed/);
      assert(!(res.getHeader('set-cookie')||[]).some(v=>v.startsWith('__Host-tfi_member=')));
    } finally {globalThis.fetch=fetchBefore;}
  }
});
test('anonymous pick requests cannot use query-supplied identity or tier',async t=>{
  mock(t,async()=>{assert.fail('No external reads without identity');});
  const res=response();
  await memberPicks({method:'GET',headers:{},query:{userId:'user_test',tier:'all_access'}},res);
  assert.equal(res.statusCode,401);
  assert.equal(res.body.state,'signed_out');
  assert.equal(res.getHeader('cache-control'),'private, no-store');
  assert.equal(res.getHeader('vercel-cdn-cache-control'),'no-store');
});
test('Premium handler reads only Main Premium and strips stakes and unknown fields',async t=>{
  const requests=[];
  mock(t,async(input,options)=>{
    const url=new URL(typeof input==='string'?input:input.url);
    requests.push({url,options});
    if(url.hostname==='sandbox-api.whop.com')return json({has_access:url.pathname.endsWith('/prod_premium')});
    assert.equal(url.hostname,'synthetic.supabase.co');
    assert.equal(options.method,'GET');
    assert.equal(url.searchParams.get('category'),'in.("Main Premium")');
    return json([{id:'main',category:'Main Premium',selection:'synthetic main',units:5,private_note:'secret'},
      {id:'nba',category:'NBA Premium',selection:'synthetic nba'}]);
  });
  const res=response();await memberPicks(await identity(),res);
  assert.equal(res.statusCode,200);
  assert.equal(res.body.tier,'Premium');
  assert.deepEqual(res.body.picks.map(p=>p.id),['main']);
  assert(!JSON.stringify(res.body).includes('units'));
  assert(!JSON.stringify(res.body).includes('private_note'));
  assert(!JSON.stringify(res.body).includes('synthetic-database-secret'));
  assert.equal(requests.length,3);
});
test('All Access handler permits six Premium categories but excludes Ultimate and Play of the Day',async t=>{
  mock(t,async input=>{
    const url=new URL(typeof input==='string'?input:input.url);
    if(url.hostname==='sandbox-api.whop.com')return json({has_access:url.pathname.endsWith('/prod_all')});
    return json(['Main Premium','NBA Premium','NHL Premium','NFL Premium','NCAAF Premium','NCAAB Premium','Ultimate','Play of the Day'].map((category,id)=>({id,category})));
  });
  const res=response();await memberPicks(await identity(),res);
  assert.equal(res.statusCode,200);
  assert.equal(res.body.tier,'All Access');
  assert.equal(res.body.picks.length,6);
  assert.equal(res.body.categories.length,6);
});
test('revoked membership rechecks live and performs no database read',async t=>{
  let providerReads=0;
  mock(t,async input=>{
    const url=new URL(typeof input==='string'?input:input.url);
    assert.equal(url.hostname,'sandbox-api.whop.com');providerReads++;return json({has_access:false});
  });
  const res=response();await memberPicks(await identity(),res);
  assert.equal(res.statusCode,403);assert.equal(res.body.state,'no_access');assert.equal(providerReads,2);
  assert.equal(res.body.picks,undefined);
});
test('membership lookup failure fails closed before private reads',async t=>{
  mock(t,async input=>{
    const url=new URL(typeof input==='string'?input:input.url);
    assert.equal(url.hostname,'sandbox-api.whop.com');return json({error:'unavailable'},503);
  });
  const res=response();await memberPicks(await identity(),res);
  assert.equal(res.statusCode,503);assert.equal(res.body.picks,undefined);
});
test('truthy malformed grants never upgrade a Premium user',async()=>{
  const result=await memberData('user_test',{
    products:{premium:'prod_premium',all_access:'prod_all'},
    checkAccess:async(_,id)=>id==='prod_premium'?true:'true',readPicks:async()=>[]
  });
  assert.equal(result.body.tier,'Premium');
  assert.deepEqual(result.body.categories,['Main Premium']);
});
test('sign-out clears member and in-progress login cookies even when Whop is disabled',async()=>{
  delete process.env.WHOP_MEMBERS_ENABLED;
  try {
    const res=response();await logout({method:'POST',headers:{origin:env.MEMBER_APP_URL}},res);
    assert.equal(res.statusCode,200);
    assert.equal(res.getHeader('set-cookie').length,2);
    assert(res.getHeader('set-cookie').every(v=>v.includes('Max-Age=0')));
  } finally {Object.assign(process.env,env);}
});
test('cross-origin sign-out and unsupported methods do not clear cookies',async()=>{
  for(const req of [{method:'POST',headers:{origin:'https://attacker.example'}},{method:'GET',headers:{origin:env.MEMBER_APP_URL}}]) {
    const res=response();await logout(req,res);assert([403,405].includes(res.statusCode));
    assert.equal(res.getHeader('set-cookie'),undefined);
  }
});

