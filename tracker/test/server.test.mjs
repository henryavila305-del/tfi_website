import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { openStore } from '../store.mjs';
import { createTrackerServer } from '../server.mjs';
import { createHmac } from 'node:crypto';
import { BILLING_API_DATE, processBillingJob } from '../billing.mjs';
test('HTTP rejects CSRF, forged identity, direct database access and unpaid writes',async()=>{
  const store=openStore(':memory:'),server=createTrackerServer(store);server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(path,data,cookie='',origin=base)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify(data)});
  try{
    assert.equal((await fetch(base+'/api/dashboard')).status,401);
    assert.equal((await post('/api/register',{handle:'testuser',password:'long-test-password'},'','https://evil.example')).status,403);
    assert.equal((await post('/api/register',{handle:'testuser',password:'long-test-password'})).status,201);
    const login=await post('/api/login',{handle:'testuser',password:'long-test-password'});assert.equal(login.status,200);
    const cookie=login.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
    const account=await (await fetch(base+'/api/dashboard',{headers:{Cookie:cookie}})).json();assert.equal(account.active,false);
    assert.equal((await post('/api/picks',{userId:'forged',active:true},cookie)).status,403);
    assert.equal((await post('/api/webhooks/whop',{})).status,503);
    for(const path of ['/tracker/store.mjs','/.tracker-data/beta.sqlite','/tracker/grant-local.mjs','/api/grant'])assert.equal((await fetch(base+path,{headers:{Cookie:cookie}})).status,404);
    assert.equal((await post('/api/logout',{},cookie)).status,200);assert.equal((await fetch(base+'/api/dashboard',{headers:{Cookie:cookie}})).status,401);
    const ui=await fetch(base+'/tracker/');assert.equal(ui.status,200);assert.match(ui.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  }finally{await new Promise(r=>server.close(r));store.close();}
});
test('account to verified synthetic membership to published result works over HTTP without leaking private picks',async()=>{
  let now=Date.now();const config={secret:'ws_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',accountId:'biz_testaccount',productPlans:{prod_tracker:'tracker'}};
  const store=openStore(':memory:',()=>now),server=createTrackerServer(store,{billing:config});server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(path,data,cookie='')=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,Cookie:cookie},body:JSON.stringify(data)});
  const get=(path,cookie='')=>fetch(base+path,{headers:{Cookie:cookie}});
  try{
    const registered=await (await post('/api/register',{handle:'capper',password:'long-e2e-test-password'})).json();
    const login=await post('/api/login',{handle:'capper',password:'long-e2e-test-password'}),cookie=login.headers.get('set-cookie');
    assert.equal((await post('/api/profile',{enabled:true},cookie)).status,403);
    assert.equal((await post('/api/billing/link',{providerUserId:'user_buyer'},cookie)).status,404);
    // Test fixture stands in for a future verified OAuth identity callback. No HTTP linking endpoint exists.
    store.bindBillingIdentity(registered.user.id,'user_buyer');
    const event={id:'msg_e2e',type:'membership.activated',api_version:'v1',api_version_date:BILLING_API_DATE,account_id:config.accountId,data:{id:'mem_e2e',status:'active'}};
    const raw=JSON.stringify(event),timestamp=String(Math.floor(Date.now()/1000)),signature=createHmac('sha256',config.secret).update(`${event.id}.${timestamp}.${raw}`).digest('base64');
    const webhook=()=>fetch(base+'/api/webhooks/whop',{method:'POST',headers:{'Content-Type':'application/json','webhook-id':event.id,'webhook-timestamp':timestamp,'webhook-signature':`v1,${signature}`},body:raw});
    assert.equal((await webhook()).status,200);assert.equal((await (await webhook()).json()).duplicate,true);
    assert.equal((await (await get('/api/dashboard',cookie)).json()).active,false);
    await processBillingJob(store,config,async()=>({id:'mem_e2e',user_id:'user_buyer',account:{id:config.accountId},product_id:'prod_tracker',status:'active',updated_at:new Date(now).toISOString(),current_period_end:new Date(now+86400000).toISOString()}),()=>now);
    assert.equal((await post('/api/profile',{enabled:true},cookie)).status,200);
    const pick={sport:'NBA',event:'Example A at B',market:'Spread',selection:'A -2',stake:1,odds:-110,oddsFormat:'american',startsAt:new Date(now+60000).toISOString(),visibility:'public'};
    const pubResponse=await post('/api/picks',pick,cookie);assert.equal(pubResponse.status,201);const pub=await pubResponse.json();
    assert.equal((await post('/api/picks',{...pick,visibility:'private',selection:'Do not disclose'},cookie)).status,201);
    const visible=await (await get('/api/public/capper')).json();assert.equal(visible.picks.length,1);assert(!JSON.stringify(visible).includes('Do not disclose'));
    assert.equal((await post(`/api/picks/${pub.id}/edit`,{selection:'Changed'},cookie)).status,404);
    now+=60001;
    assert.equal((await post(`/api/picks/${pub.id}/settle`,{result:'loss',reason:'Self-reported final score'},cookie)).status,200);
    assert.equal((await (await get('/api/public/capper')).json()).summary.netUnits,-1);
    const exported=await get('/api/export',cookie);assert.equal(exported.status,200);assert.match(exported.headers.get('content-disposition'),/attachment/);
    const data=await exported.json();assert.equal(data.picks.length,2);assert.equal(data.picks.find(p=>p.id===pub.id).history.length,2);assert(!JSON.stringify(data).includes('password'));assert(!JSON.stringify(data).includes('token'));
    assert.equal((await get('/api/export')).status,401);
    now+=3600001;assert.equal((await post('/api/picks',pick,cookie)).status,403);assert.equal((await get('/api/export',cookie)).status,200);
  }finally{await new Promise(r=>server.close(r));store.close();}
});
