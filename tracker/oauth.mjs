import { createHash, randomBytes } from 'node:crypto';
import { fail } from './domain.mjs';
const SANDBOX='https://sandbox-api.whop.com';
export function oauthConfig(config) {
  if(!config||config.environment!=='sandbox'||!/^app_[A-Za-z0-9]+$/.test(config.clientId||'')||typeof config.clientSecret!=='string'||!config.clientSecret)fail(503,'Sandbox account linking is not configured');
  let redirect;try{redirect=new URL(config.redirectUri);}catch{fail(503,'Invalid sandbox callback configuration');}
  const local=redirect.protocol==='http:'&&redirect.hostname==='127.0.0.1';
  if((redirect.protocol!=='https:'&&!local)||redirect.origin!==config.allowedOrigin||redirect.pathname!=='/api/oauth/whop/callback'||redirect.search||redirect.hash||redirect.username||redirect.password||['thefavindex.com','www.thefavindex.com','the-favorite-index.vercel.app'].includes(redirect.hostname))fail(503,'Use an isolated sandbox callback origin');
  return {...config,redirectUri:redirect.href};
}
export function newLinkIntent() {return {state:randomBytes(32).toString('base64url'),verifier:randomBytes(32).toString('base64url'),nonce:randomBytes(32).toString('base64url'),browser:randomBytes(32).toString('hex')};}
export function authorizeLink(config,intent) {
  const c=oauthConfig(config),query=new URLSearchParams({response_type:'code',client_id:c.clientId,redirect_uri:c.redirectUri,scope:'openid profile',state:intent.state,nonce:intent.nonce,code_challenge:createHash('sha256').update(intent.verifier).digest('base64url'),code_challenge_method:'S256'});
  return `${SANDBOX}/oauth/authorize?${query}`;
}
// Identity is obtained ONLY from the pinned HTTPS token exchange and userinfo response.
// The id_token is never accepted from the browser or used as a general JWT login token.
export async function verifyLinkedUser(config,intent,code,{fetchImpl=fetch,clock=Date.now}={}) {
  const c=oauthConfig(config);
  if(typeof code!=='string'||!code||code.length>4096||/[\x00-\x20]/.test(code))fail(400,'Invalid authorization code');
  async function request(path,options){
    let response;try{response=await fetchImpl(`${SANDBOX}/oauth/${path}`,{...options,redirect:'error',signal:AbortSignal.timeout(4000)});}catch{fail(502,'Sandbox identity verification unavailable');}
    if(!response.ok)fail(502,'Sandbox identity verification failed');
    try{return await response.json();}catch{fail(502,'Invalid sandbox identity response');}
  }
  const tokens=await request('token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'authorization_code',code,redirect_uri:c.redirectUri,client_id:c.clientId,client_secret:c.clientSecret,code_verifier:intent.verifier})});
  if(typeof tokens.access_token!=='string'||!tokens.access_token||tokens.access_token.length>16384||/[\r\n]/.test(tokens.access_token)||typeof tokens.id_token!=='string'||tokens.id_token.length>32768)fail(502,'Invalid sandbox token response');
  let claims;try{const parts=tokens.id_token.split('.');if(parts.length!==3)throw Error();claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));}catch{fail(502,'Invalid sandbox token response');}
  if(claims.nonce!==intent.nonce||!Number.isFinite(claims.exp)||claims.exp*1000<=clock()||!(claims.aud===c.clientId||(Array.isArray(claims.aud)&&claims.aud.includes(c.clientId))))fail(502,'Sandbox token correlation failed');
  const user=await request('userinfo',{headers:{Authorization:`Bearer ${tokens.access_token}`}});
  if(!/^user_[A-Za-z0-9]+$/.test(user.sub||'')||claims.sub!==user.sub)fail(502,'Sandbox identity mismatch');
  // Tokens, email and profile details are deliberately not persisted or returned.
  return {providerUserId:user.sub,environment:'sandbox'};
}
