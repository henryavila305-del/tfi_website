import { fail } from './domain.mjs';
import { oauthConfig } from './oauth.mjs';
import { createMembershipReader } from './billing.mjs';
export function localSandboxOptions(env={}) {
  const names=['WHOP_CLIENT_ID','WHOP_CLIENT_SECRET','WHOP_WEBHOOK_SECRET','WHOP_ACCOUNT_ID','WHOP_TRACKER_PRODUCT_ID','WHOP_ALL_ACCESS_PRODUCT_ID','WHOP_SANDBOX_API_KEY'];
  const configured=names.some(name=>!!env[name]);
  if(!configured)return {oauth:null,billing:null,readMembership:null};
  if(env.WHOP_SANDBOX!=='true')fail(503,'Explicit sandbox mode is required; no production credentials are supported');
  const origin=env.TFI_APP_ORIGIN||'http://127.0.0.1:4174';
  if(origin!=='http://127.0.0.1:4174')fail(503,'The local server only supports its isolated loopback origin');
  let oauth=null,billing=null,readMembership=null;
  if(env.WHOP_CLIENT_ID||env.WHOP_CLIENT_SECRET){
    if(!env.WHOP_CLIENT_ID||!env.WHOP_CLIENT_SECRET)fail(503,'Both sandbox OAuth settings are required');
    oauth=oauthConfig({environment:'sandbox',clientId:env.WHOP_CLIENT_ID,clientSecret:env.WHOP_CLIENT_SECRET,allowedOrigin:origin,redirectUri:origin+'/api/oauth/whop/callback'});
  }
  if(env.WHOP_WEBHOOK_SECRET||env.WHOP_ACCOUNT_ID||env.WHOP_TRACKER_PRODUCT_ID||env.WHOP_ALL_ACCESS_PRODUCT_ID){
    if(!/^ws_[A-Za-z0-9_-]{32,}$/.test(env.WHOP_WEBHOOK_SECRET||'')||!/^biz_[A-Za-z0-9]+$/.test(env.WHOP_ACCOUNT_ID||''))fail(503,'Sandbox billing settings are incomplete');
    const productPlans={};
    for(const [key,plan]of [['WHOP_TRACKER_PRODUCT_ID','tracker'],['WHOP_ALL_ACCESS_PRODUCT_ID','all_access']])if(env[key]){if(!/^prod_[A-Za-z0-9]+$/.test(env[key])||Object.hasOwn(productPlans,env[key]))fail(503,'Invalid or duplicate sandbox product mapping');productPlans[env[key]]=plan;}
    if(!Object.keys(productPlans).length)fail(503,'At least one eligible sandbox product is required');
    billing={environment:'sandbox',secret:env.WHOP_WEBHOOK_SECRET,accountId:env.WHOP_ACCOUNT_ID,productPlans};
    if(env.WHOP_SANDBOX_API_KEY)readMembership=createMembershipReader({environment:'sandbox',apiKey:env.WHOP_SANDBOX_API_KEY,accountId:env.WHOP_ACCOUNT_ID});
  }
  if(env.WHOP_SANDBOX_API_KEY&&!billing)fail(503,'Sandbox membership reads require billing configuration');
  return {oauth,billing,readMembership};
}
