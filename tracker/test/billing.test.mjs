import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyWhopEvent, membershipAccess, processBillingJob, createMembershipReader, BILLING_API_DATE } from '../billing.mjs';
import { openStore } from '../store.mjs';
const now=Date.parse('2026-11-08T12:00:00Z');
const config={secret:'ws_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',accountId:'biz_testaccount',productPlans:{prod_tracker:'tracker',prod_bundle:'all_access'}};
function delivery(id='msg_test1',overrides={}){
  const event={id,type:'membership.activated',api_version:'v1',api_version_date:BILLING_API_DATE,account_id:config.accountId,data:{id:'mem_test1'},...overrides};
  const raw=JSON.stringify(event),timestamp=String(now/1000);
  const signature=createHmac('sha256',config.secret).update(`${id}.${timestamp}.${raw}`).digest('base64');
  return {raw,headers:{'webhook-id':id,'webhook-timestamp':timestamp,'webhook-signature':`v1,${signature}`}};
}
const snapshot=(overrides={})=>({id:'mem_test1',user_id:'user_alice',account:{id:config.accountId},product_id:'prod_tracker',status:'active',updated_at:new Date(now).toISOString(),current_period_end:new Date(now+86400000).toISOString(),expires_at:null,...overrides});
test('webhook authentication rejects tampering, stale/future timestamps, wrong business and version',()=>{
  const d=delivery();assert.equal(verifyWhopEvent(d.raw,d.headers,config,now).membershipId,'mem_test1');
  assert.throws(()=>verifyWhopEvent(d.raw+' ',d.headers,config,now),{status:400});
  for(const offset of [-300001,300001])assert.throws(()=>verifyWhopEvent(d.raw,d.headers,config,now+offset),{status:400});
  for(const overrides of [{account_id:'biz_other'},{api_version_date:'2025-01-01'},{id:'msg_other'}]){const x=delivery('msg_test1',overrides);assert.throws(()=>verifyWhopEvent(x.raw,x.headers,config,now),{status:400});}
  assert.throws(()=>verifyWhopEvent(d.raw,d.headers,null,now),{status:503});
  const unknown=delivery('msg_unknown',{type:'new.future_event'});assert.equal(verifyWhopEvent(unknown.raw,unknown.headers,config,now).ignored,true);
  assert.throws(()=>verifyWhopEvent(d.raw,{'webhook-id':'msg_test1','webhook-timestamp':'NaN','webhook-signature':'v1,x'},config,now),{status:400});
});
test('membership access allows only approved products and bounded current access',()=>{
  assert.equal(membershipAccess(snapshot(),config,now).expires,now+3600000);
  assert.equal(membershipAccess(snapshot({product_id:'prod_bundle'}),config,now).plan,'all_access');
  for(const status of ['canceled','expired','paused','past_due','banned','unknown'])assert.equal(membershipAccess(snapshot({status}),config,now).expires,0);
  assert.equal(membershipAccess(snapshot({product_id:'prod_picksonly'}),config,now).expires,0);
  assert.equal(membershipAccess(snapshot({current_period_end:null}),config,now).expires,0);
  assert.equal(membershipAccess(snapshot({cancel_at_period_end:true,current_period_end:new Date(now+60000).toISOString()}),config,now).expires,now+60000);
  assert.throws(()=>membershipAccess(snapshot({account:{id:'biz_wrong'}}),config,now),{status:400});
});
test('billing jobs deduplicate, verify latest state, isolate identities, revoke and reconcile',async()=>{
  let clock=now;const store=openStore(':memory:',()=>clock);
  try{
    const alice=store.register({handle:'alice',password:'billing-test-pass'}),bob=store.register({handle:'bobby',password:'billing-test-pass'});
    store.bindBillingIdentity(alice.id,'user_alice');store.bindBillingIdentity(bob.id,'user_bob');
    assert.throws(()=>store.bindBillingIdentity(bob.id,'user_alice'),{status:409});
    const d=delivery(),event=verifyWhopEvent(d.raw,d.headers,config,clock);
    assert.equal(store.enqueueBilling(event).duplicate,false);assert.equal(store.enqueueBilling(event).duplicate,true);
    assert.equal(store.dashboard(alice.id).active,false);
    await processBillingJob(store,config,async()=>snapshot(),()=>clock);
    assert.equal(store.dashboard(alice.id).active,true);assert.equal(store.dashboard(bob.id).active,false);
    assert.equal((await processBillingJob(store,config,async()=>{throw Error('must not run');},()=>clock)).processed,false);
    const revoke=delivery('msg_revoke',{type:'membership.updated'});store.enqueueBilling(verifyWhopEvent(revoke.raw,revoke.headers,config,clock));
    await processBillingJob(store,config,async()=>snapshot({status:'canceled',updated_at:new Date(now+1000).toISOString()}),()=>clock);
    assert.equal(store.dashboard(alice.id).active,false);
    const stale=delivery('msg_stale');store.enqueueBilling(verifyWhopEvent(stale.raw,stale.headers,config,clock));
    await processBillingJob(store,config,async()=>snapshot(),()=>clock);assert.equal(store.dashboard(alice.id).active,false);
    clock+=2000;assert.equal(store.enqueueReconciliation(clock),1);assert.equal(store.enqueueReconciliation(clock),0);
    await processBillingJob(store,config,async()=>snapshot({status:'active',updated_at:new Date(now+2000).toISOString()}),()=>clock);
    assert.equal(store.dashboard(alice.id).active,true);
    clock+=3600001;assert.equal(store.dashboard(alice.id).active,false);
  }finally{store.close();}
});
test('API failures retry without granting access and worker leases fence expired processors',async()=>{
  let clock=now;const store=openStore(':memory:',()=>clock);
  try{
    const u=store.register({handle:'tester',password:'billing-test-pass'});store.bindBillingIdentity(u.id,'user_alice');
    store.enqueueBilling({id:'msg_retry',membershipId:'mem_test1',type:'membership.updated',receivedAt:clock});
    await assert.rejects(()=>processBillingJob(store,config,async()=>{throw Error('outage');},()=>clock));
    assert.equal(store.dashboard(u.id).active,false);assert.equal(store.claimBillingJob(clock),null);
    clock+=60001;const first=store.claimBillingJob(clock);assert.equal(store.claimBillingJob(clock),null);
    clock+=30001;const second=store.claimBillingJob(clock);assert.notEqual(first.lease,second.lease);
    assert.throws(()=>store.completeBillingJob(first.id,first.lease,membershipAccess(snapshot(),config,clock),clock),{status:409});
    store.completeBillingJob(second.id,second.lease,membershipAccess(snapshot(),config,clock),clock);
    assert.equal(store.dashboard(u.id).active,true);
  }finally{store.close();}
});
test('membership HTTP reader pins API date, encodes IDs, prevents redirects and checks response identity',async()=>{
  let request;
  const reader=createMembershipReader({apiKey:'synthetic-test-key',accountId:config.accountId,fetchImpl:async(url,options)=>{request={url,options};return {ok:true,json:async()=>snapshot()};}});
  assert.equal((await reader('mem_test1')).id,'mem_test1');assert.equal(request.options.headers['Api-Version-Date'],BILLING_API_DATE);assert.equal(request.options.redirect,'error');
  assert.match(request.url,/^https:\/\/sandbox-api.whop.com\/api\/v1\/memberships\/mem_test1\?account_id=biz_testaccount$/);
  assert.throws(()=>createMembershipReader({apiKey:'test',accountId:config.accountId,environment:'production'}),{status:503});
  await assert.rejects(()=>reader('../other'),{status:400});
  const bad=createMembershipReader({apiKey:'synthetic-test-key',accountId:config.accountId,fetchImpl:async()=>({ok:false,status:403})});await assert.rejects(()=>bad('mem_test1'),{status:503});
});
