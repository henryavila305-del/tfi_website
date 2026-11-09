import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { openStore } from '../store.mjs';
import { createTrackerServer } from '../server.mjs';
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
    for(const path of ['/tracker/store.mjs','/.tracker-data/beta.sqlite','/tracker/grant-local.mjs','/api/grant'])assert.equal((await fetch(base+path,{headers:{Cookie:cookie}})).status,404);
    assert.equal((await post('/api/logout',{},cookie)).status,200);assert.equal((await fetch(base+'/api/dashboard',{headers:{Cookie:cookie}})).status,401);
    const ui=await fetch(base+'/tracker/');assert.equal(ui.status,200);assert.match(ui.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  }finally{await new Promise(r=>server.close(r));store.close();}
});
