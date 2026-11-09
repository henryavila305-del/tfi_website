import test from 'node:test';
import assert from 'node:assert/strict';
import { openStore } from '../store.mjs';
const start=Date.parse('2026-11-01T00:00:00Z');
const input={sport:'NFL',event:'A at B',market:'Moneyline',selection:'A',stake:1,odds:150,oddsFormat:'american',startsAt:new Date(start+3600000).toISOString(),visibility:'private'};
test('isolation, paid access, publication locks, corrections and expiry',()=>{
  let now=start;const store=openStore(':memory:',()=>now);
  try{
    const a=store.register({handle:'alice',password:'unique-test-password'}),b=store.register({handle:'bobby',password:'another-test-password'});
    assert.throws(()=>store.add(a.id,input),{status:403});
    store.grant('alice','tracker',now+86400000);store.grant('bobby','all_access',now+86400000);
    const privatePick=store.add(a.id,input);store.setProfile(a.id,true);
    assert.equal(store.publicRecord('alice').picks.length,0);
    assert.throws(()=>store.publish(b.id,privatePick.id),{status:404});
    assert.throws(()=>store.settle(b.id,privatePick.id,{result:'win',reason:'test'}),{status:404});
    assert.throws(()=>store.audit(b.id,privatePick.id),{status:404});
    assert.equal(store.dashboard(b.id).picks.length,0);
    store.publish(a.id,privatePick.id);assert.throws(()=>store.setProfile(a.id,false),{status:409});
    assert.throws(()=>store.settle(a.id,privatePick.id,{result:'win',reason:'test'}),{status:409});
    now+=3600001;
    const late=store.add(a.id,{...input,selection:'Private losing bet'});
    assert.throws(()=>store.publish(a.id,late.id),{status:409});
    store.settle(a.id,privatePick.id,{result:'win',reason:'Official final score, self reported'});
    assert.equal(store.publicRecord('alice').summary.netUnits,1.5);
    store.settle(a.id,privatePick.id,{result:'loss',reason:'Corrected mistaken grading'});
    const pub=store.publicRecord('alice');assert.equal(pub.summary.netUnits,-1);assert.equal(pub.picks.length,1);
    assert.equal(pub.picks[0].selection,'A');assert.equal(pub.picks[0].history.length,2);
    assert.equal(pub.picks[0].history[1].from,'win');assert(!JSON.stringify(pub).includes(a.id));assert(!JSON.stringify(pub).includes('Private losing bet'));
    assert.equal(store.audit(a.id,privatePick.id).length,4);
    now+=86400000;assert.equal(store.dashboard(a.id).active,false);assert.equal(store.publicRecord('alice').summary.losses,1);
    assert.throws(()=>store.settle(a.id,privatePick.id,{result:'win',reason:'expired'}),{status:403});
  }finally{store.close();}
});
test('opaque sessions authenticate, logout revokes and expiry fails closed',()=>{
  let now=start;const store=openStore(':memory:',()=>now);
  try{const u=store.register({handle:'tester',password:'long-test-password'});assert.throws(()=>store.login({handle:'tester',password:'wrong'}),{status:401});
    const session=store.login({handle:'tester',password:'long-test-password'});assert.equal(store.authenticate(session.token).id,u.id);store.logout(session.token);assert.throws(()=>store.authenticate(session.token),{status:401});
    const next=store.login({handle:'tester',password:'long-test-password'});now+=86400001;assert.throws(()=>store.authenticate(next.token),{status:401});
    assert.throws(()=>store.authenticate('forged-token'),{status:401});
  }finally{store.close();}
});
