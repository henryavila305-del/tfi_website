import test from 'node:test';
import assert from 'node:assert/strict';
import { localSandboxOptions } from '../config.mjs';
test('configuration is off by default, requires explicit sandbox mode and rejects incomplete settings',()=>{
  assert.deepEqual(localSandboxOptions(),{oauth:null,billing:null,readMembership:null});
  const oauth={WHOP_CLIENT_ID:'app_test',WHOP_CLIENT_SECRET:'synthetic-secret'};
  assert.throws(()=>localSandboxOptions(oauth),{status:503});assert.throws(()=>localSandboxOptions({...oauth,WHOP_SANDBOX:'false'}),{status:503});
  assert.throws(()=>localSandboxOptions({...oauth,WHOP_SANDBOX:'true',TFI_APP_ORIGIN:'https://www.thefavindex.com'}),{status:503});
  const opts=localSandboxOptions({...oauth,WHOP_SANDBOX:'true'});assert.equal(opts.oauth.environment,'sandbox');assert.equal(opts.billing,null);
  assert.throws(()=>localSandboxOptions({WHOP_CLIENT_ID:'app_test',WHOP_SANDBOX:'true'}),{status:503});
  assert.throws(()=>localSandboxOptions({WHOP_SANDBOX_API_KEY:'synthetic-key',WHOP_SANDBOX:'true'}),{status:503});
});
test('billing mapping does not infer products or accept the same product as two plans',()=>{
  const env={WHOP_SANDBOX:'true',WHOP_WEBHOOK_SECRET:'ws_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',WHOP_ACCOUNT_ID:'biz_test',WHOP_TRACKER_PRODUCT_ID:'prod_tracker'};
  assert.equal(localSandboxOptions(env).billing.productPlans.prod_tracker,'tracker');assert.equal(localSandboxOptions(env).readMembership,null);
  assert.throws(()=>localSandboxOptions({...env,WHOP_ALL_ACCESS_PRODUCT_ID:'prod_tracker'}),{status:503});
  assert.throws(()=>localSandboxOptions({...env,WHOP_TRACKER_PRODUCT_ID:''}),{status:503});
  assert.equal(typeof localSandboxOptions({...env,WHOP_SANDBOX_API_KEY:'synthetic-api-key'}).readMembership,'function');
});
