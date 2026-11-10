import {WhopClient,WhopEnvironment} from '@whop/sdk';
import {settings,headers,session} from '../lib/member-auth.mjs';
import {memberData} from '../lib/member-access.mjs';
export default async function handler(req,res){headers(res);if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{const cfg=settings(),s=await session(req,res,cfg);
 const result=await memberData(s.userId,{products:{premium:process.env.WHOP_PREMIUM_PRODUCT_ID,all_access:process.env.WHOP_ALL_ACCESS_PRODUCT_ID},checkAccess:async(id,resource_id)=>{const whop=new WhopClient({token:process.env.WHOP_COMPANY_API_KEY,environment:process.env.WHOP_SANDBOX==='true'?WhopEnvironment.Sandbox:WhopEnvironment.Production});const r=await whop.users.checkAccess({id,resource_id});return r.has_access===true;},readPicks:async(allowed)=>{
 const url=new URL(process.env.SUPABASE_URL);if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||!process.env.SUPABASE_SECRET_KEY)throw Error('Database unavailable');
 const start=new Date();start.setUTCDate(start.getUTCDate()-7);
 const params=new URLSearchParams({select:'id,sport,category,pick_team,opponent,bet_type,selection,odds,game_date,espn_event_id,status',category:'in.("'+allowed.join('","')+'")',game_date:'gte.'+start.toISOString().slice(0,10),order:'game_date.desc,category.asc',limit:'100'});
 const r=await fetch(url.origin+'/rest/v1/tfi_picks?'+params,{headers:{apikey:process.env.SUPABASE_SECRET_KEY,Authorization:'Bearer '+process.env.SUPABASE_SECRET_KEY},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Picks unavailable');return r.json();}});
 return res.status(result.status).json(result.body);
 }catch{return res.status(503).json({error:'Member access is temporarily unavailable. No private picks have been loaded.'});}}
