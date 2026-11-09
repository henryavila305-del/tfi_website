import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { newLinkIntent, authorizeLink, oauthConfig, verifyLinkedUser } from '../oauth.mjs';
import { openStore } from '../store.mjs';
const now=Date.parse('2026-11-08T12:00:00Z');
const config={environment:'sandbox',clientId:'app_test',clientSecret:'synthetic-client-secret',allowedOrigin:'http://127.0.0.1:4174',redirectUri:'http://127.0.0.1:4174/api/oauth/whop/callback'};
const idToken=claims=>`provider-header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.provider-signature`;
test('sandbox authorization uses fresh PKCE, state and nonce and rejects production origins',()=>{
  const intent=newLinkIntent(),next=newLinkIntent(),url=new URL(authorizeLink(config,intent));
  assert.notEqual(intent.state,next.state);assert.notEqual(intent.verifier,next.verifier);assert.notEqual(intent.browser,next.browser);
  assert.equal(url.origin,'https://sandbox-api.whop.com');assert.equal(url.searchParams.get('state'),intent.state);assert.equal(url.searchParams.get('nonce'),intent.nonce);
  assert.equal(url.searchParams.get('code_challenge'),createHash('sha256').update(intent.verifier).digest('base64url'));assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  assert.equal(url.searchParams.get('scope'),'openid profile');assert(!url.href.includes(config.clientSecret));
  for(const patch of [{environment:'production'},{redirectUri:'https://www.thefavindex.com/api/oauth/whop/callback',allowedOrigin:'https://www.thefavindex.com'},{redirectUri:'https://staging.example/evil',allowedOrigin:'https://staging.example'},{redirectUri:'http://evil.example/api/oauth/whop/callback',allowedOrigin:'http://evil.example'}])assert.throws(()=>oauthConfig({...config,...patch}),{status:503});
});
test('server-only provider exchange validates nonce, audience, expiry and userinfo subject without returning tokens',async()=>{
  const intent=newLinkIntent(),requests=[];
  const transport=(claims={},user={sub:'user_test'})=>async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>url.endsWith('/token')?{access_token:'synthetic-access-token',refresh_token:'discard-this',id_token:idToken({sub:'user_test',nonce:intent.nonce,aud:config.clientId,exp:now/1000+60,...claims})}:user};};
  assert.deepEqual(await verifyLinkedUser(config,intent,'one-time-code',{fetchImpl:transport(),clock:()=>now}),{providerUserId:'user_test',environment:'sandbox'});
  assert.equal(requests[0].url,'https://sandbox-api.whop.com/oauth/token');const body=JSON.parse(requests[0].options.body);assert.equal(body.code_verifier,intent.verifier);assert.equal(body.redirect_uri,config.redirectUri);assert.equal(requests[0].options.redirect,'error');
  for(const claims of [{nonce:'wrong'},{aud:'app_wrong'},{exp:now/1000},{sub:'user_wrong'}])await assert.rejects(()=>verifyLinkedUser(config,intent,'code',{fetchImpl:transport(claims),clock:()=>now}),{status:502});
  await assert.rejects(()=>verifyLinkedUser(config,intent,'code',{fetchImpl:transport({}, {sub:'user_other'}),clock:()=>now}),{status:502});
  await assert.rejects(()=>verifyLinkedUser(config,intent,'code',{fetchImpl:async()=>{throw Error('synthetic provider secret must not leak');}}),e=>e.status===502&&!e.message.includes('secret'));
});
test('link intent is browser-bound, session-bound, single-use, expiring, and cannot transfer accounts',()=>{
  let clock=now;const store=openStore(':memory:',()=>clock);
  try{
    const alice=store.register({handle:'alice',password:'oauth-test-password'}),bob=store.register({handle:'bobby',password:'oauth-test-password'});
    const session=store.login({handle:'alice',password:'oauth-test-password'}),intent=newLinkIntent();store.beginOAuthLink(alice.id,session.token,intent);
    assert.throws(()=>store.consumeOAuthLink(intent.state,newLinkIntent().browser),{status:400});
    const callback=store.consumeOAuthLink(intent.state,intent.browser);assert.throws(()=>store.consumeOAuthLink(intent.state,intent.browser),{status:400});
    assert.deepEqual(store.completeOAuthLink(callback,'user_alice'),{linked:true});assert.equal(store.dashboard(alice.id).billingLinked,true);assert.equal(store.dashboard(alice.id).active,false);
    const bs=store.login({handle:'bobby',password:'oauth-test-password'}),bi=newLinkIntent();store.beginOAuthLink(bob.id,bs.token,bi);assert.throws(()=>store.completeOAuthLink(store.consumeOAuthLink(bi.state,bi.browser),'user_alice'),{status:409});
    const late=newLinkIntent();store.beginOAuthLink(alice.id,session.token,late);clock+=600001;assert.throws(()=>store.consumeOAuthLink(late.state,late.browser),{status:400});
    assert.throws(()=>store.beginOAuthLink(alice.id,session.token,newLinkIntent()),{status:401});
  }finally{store.close();}
});
test('logout cancels pending intent, including logout during provider exchange',()=>{
  const store=openStore(':memory:',()=>now);
  try{const user=store.register({handle:'tester',password:'oauth-test-password'});let session=store.login({handle:user.handle,password:'oauth-test-password'}),intent=newLinkIntent();store.beginOAuthLink(user.id,session.token,intent);store.logout(session.token);assert.throws(()=>store.consumeOAuthLink(intent.state,intent.browser),{status:400});
    session=store.login({handle:user.handle,password:'oauth-test-password'});intent=newLinkIntent();store.beginOAuthLink(user.id,session.token,intent);const callback=store.consumeOAuthLink(intent.state,intent.browser);store.logout(session.token);assert.throws(()=>store.completeOAuthLink(callback,'user_notlinked'),{status:401});assert.equal(store.dashboard(user.id).billingLinked,false);
  }finally{store.close();}
});
test('beta datastore rejects a production environment',()=>{assert.throws(()=>openStore(':memory:',()=>now,{environment:'production'}),{status:503});});
