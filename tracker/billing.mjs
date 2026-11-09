import { createHmac, timingSafeEqual } from 'node:crypto';
import { fail } from './domain.mjs';
// Whop v1 dated API. Literal ws_ secret bytes, NOT base64-decoded.
// https://docs.whop.com/developer/guides/webhooks (verified 2026-11-08)
export const BILLING_API_DATE = '2026-08-21-1';
const membershipEvents = new Set(['membership.activated','membership.updated']);
export function verifyWhopEvent(raw, headers, config, now = Date.now()) {
  if(!config || typeof config.secret!=='string' || !/^ws_[A-Za-z0-9_-]{32,}$/.test(config.secret) || !/^biz_[A-Za-z0-9]+$/.test(config.accountId||'')) fail(503,'Billing receiver is not configured');
  if(typeof raw!=='string'||Buffer.byteLength(raw)>65536)fail(413,'Webhook body too large');
  const id=headers['webhook-id'], timestamp=headers['webhook-timestamp'], signatures=headers['webhook-signature'];
  if(typeof id!=='string'||!/^msg_[A-Za-z0-9_-]{1,160}$/.test(id)||typeof timestamp!=='string'||!/^\d{10}$/.test(timestamp)||typeof signatures!=='string'||signatures.length>2048)fail(400,'Invalid webhook headers');
  if(Math.abs(now-Number(timestamp)*1000)>300000)fail(400,'Webhook timestamp outside allowed window');
  const expected=createHmac('sha256',config.secret).update(`${id}.${timestamp}.${raw}`).digest();
  const valid=signatures.split(' ').some(part=>{
    if(!/^v1,[A-Za-z0-9+/]{43}=$/.test(part))return false;
    const candidate=Buffer.from(part.slice(3),'base64');
    return candidate.length===expected.length&&timingSafeEqual(candidate,expected);
  });
  if(!valid)fail(400,'Invalid webhook signature');
  let event;try{event=JSON.parse(raw);}catch{fail(400,'Invalid webhook JSON');}
  if(!event||event.id!==id||event.api_version!=='v1'||event.api_version_date!==BILLING_API_DATE||event.account_id!==config.accountId)fail(400,'Webhook account or API version mismatch');
  if(!membershipEvents.has(event.type))return {id,ignored:true};
  if(!/^mem_[A-Za-z0-9]+$/.test(event.data?.id||''))fail(400,'Invalid membership reference');
  // Never derive access from the supplied event snapshot. Queue only an opaque reference.
  return {id,membershipId:event.data.id,type:event.type,receivedAt:now};
}
export function membershipAccess(snapshot, config, now=Date.now()) {
  if(!snapshot||!/^mem_[A-Za-z0-9]+$/.test(snapshot.id||'')||!/^user_[A-Za-z0-9]+$/.test(snapshot.user_id||'')||snapshot.account?.id!==config.accountId)fail(400,'Membership identity mismatch');
  const plan=Object.hasOwn(config.productPlans||{},snapshot.product_id)?config.productPlans[snapshot.product_id]:null;
  const updatedAt=Date.parse(snapshot.updated_at);
  if(!Number.isFinite(updatedAt)||updatedAt>now+300000)fail(400,'Invalid membership version');
  const active=!!plan&&['tracker','all_access'].includes(plan)&&['active','trialing'].includes(snapshot.status);
  const ends=[snapshot.current_period_end,snapshot.expires_at].filter(x=>x!=null).map(Date.parse);
  if(ends.some(x=>!Number.isFinite(x)))fail(400,'Invalid access expiration');
  // Fail closed for absent billing periods. Reconcile at least hourly before this lease ends.
  const expires=active&&ends.length?Math.min(now+3600000,...ends):0;
  return {membershipId:snapshot.id,providerUserId:snapshot.user_id,plan:plan||null,expires:expires>now?expires:0,updatedAt};
}
export function createMembershipReader({apiKey,accountId,environment='sandbox',fetchImpl=fetch}) {
  if(environment!=='sandbox')fail(503,'This staging reader only supports the Whop sandbox');
  if(typeof apiKey!=='string'||!apiKey||!/^biz_[A-Za-z0-9]+$/.test(accountId||''))fail(503,'Membership reader is not configured');
  return async id=>{
    if(!/^mem_[A-Za-z0-9]+$/.test(id))fail(400,'Invalid membership reference');
    const response=await fetchImpl(`https://sandbox-api.whop.com/api/v1/memberships/${encodeURIComponent(id)}?account_id=${encodeURIComponent(accountId)}`,{headers:{Authorization:`Bearer ${apiKey}`,'Api-Version-Date':BILLING_API_DATE,Accept:'application/json'},signal:AbortSignal.timeout(4000),redirect:'error'});
    if(!response.ok)fail(503,'Unable to verify current membership');
    const snapshot=await response.json();if(snapshot.id!==id)fail(400,'Membership identity mismatch');return snapshot;
  };
}
export async function processBillingJob(store,config,readMembership,clock=Date.now) {
  const now=clock();
  const job=store.claimBillingJob(now);if(!job)return {processed:false};
  try{
    const snapshot=await readMembership(job.membershipId);
    if(snapshot.id!==job.membershipId)fail(400,'Membership identity mismatch');
    const access=membershipAccess(snapshot,config,clock());
    store.completeBillingJob(job.id,job.lease,access,clock());
    return {processed:true};
  }catch(error){store.retryBillingJob(job.id,job.lease,clock());throw error;}
}
