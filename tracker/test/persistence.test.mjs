import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../store.mjs';
import { processBillingJob } from '../billing.mjs';
test('records, public correction history, identity links and billing deduplication survive restart',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'tfi-store-test-')),path=join(dir,'test.sqlite');let store;
  let now=Date.parse('2026-11-08T12:00:00Z');const clock=()=>now;
  try{
    store=openStore(path,clock);const owner=store.register({handle:'persistent',password:'new-test-password'});
    store.grant(owner.handle,'tracker',now+86400000);store.setProfile(owner.id,true);store.bindBillingIdentity(owner.id,'user_persistent');
    const p=store.add(owner.id,{sport:'NFL',event:'Synthetic persistence event',market:'Moneyline',selection:'Team A',stake:1,odds:2,oddsFormat:'decimal',startsAt:new Date(now+1000).toISOString(),visibility:'public'});
    now+=2000;store.settle(owner.id,p.id,{result:'win',reason:'Original fixture'});store.settle(owner.id,p.id,{result:'loss',reason:'Correction fixture'});
    const event={id:'msg_persistent',membershipId:'mem_persistent',type:'membership.updated',receivedAt:now};store.enqueueBilling(event);
    const session=store.login({handle:owner.handle,password:'new-test-password'});
    store.close();store=openStore(path,clock);
    assert.equal(store.authenticate(session.token).id,owner.id);assert.equal(store.enqueueBilling(event).duplicate,true);
    const record=store.publicRecord(owner.handle);assert.equal(record.summary.netUnits,-1);assert.equal(record.picks[0].history.length,2);assert.equal(store.exportRecord(owner.id).picks[0].history.length,3);
    await processBillingJob(store,{accountId:'biz_test',productPlans:{prod_test:'tracker'}},async()=>({id:'mem_persistent',user_id:'user_persistent',account:{id:'biz_test'},product_id:'prod_test',status:'active',updated_at:new Date(now).toISOString(),current_period_end:new Date(now+86400000).toISOString()}),clock);
    store.close();store=openStore(path,clock);assert.equal((await processBillingJob(store,{},async()=>{throw Error('duplicate work');},clock)).processed,false);
    assert.equal(store.enqueueBilling(event).duplicate,true);
  }finally{store?.close();rmSync(dir,{recursive:true,force:true});}
});
