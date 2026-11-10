import {getIronSession} from 'iron-session';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
export function settings(){
 const env=process.env;
 if(env.WHOP_MEMBERS_ENABLED!=='true'||!/^app_/.test(env.WHOP_CLIENT_ID||'')||!env.WHOP_CLIENT_SECRET||!env.WHOP_COMPANY_API_KEY||!(env.MEMBER_SESSION_SECRET?.length>=32))throw Error('Members unavailable');
 const origin=new URL(env.MEMBER_APP_URL);if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash)throw Error('Invalid origin');
 return {origin:origin.origin,client:env.WHOP_CLIENT_ID,secret:env.WHOP_CLIENT_SECRET,password:env.MEMBER_SESSION_SECRET,base:env.WHOP_SANDBOX==='true'?'https://sandbox-api.whop.com':'https://api.whop.com'};
}
export function headers(res){res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');}
export function same(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export const random=()=>randomBytes(32).toString('base64url');
export const challenge=s=>createHash('sha256').update(s).digest('base64url');
export function session(req,res,cfg,name='__Host-tfi_member',ttl=3600){return getIronSession(req,res,{password:cfg.password,cookieName:name,ttl,cookieOptions:{httpOnly:true,secure:true,sameSite:'lax',path:'/'}});}
export async function whopJSON(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Whop unavailable');return r.json();}
