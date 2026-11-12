import {settings,headers,session,random,challenge} from '../lib/member-auth.mjs';
export default async function handler(req,res){headers(res);if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{const cfg=settings(),s=await session(req,res,cfg,'__Host-tfi_oauth',600);s.state=random();s.nonce=random();s.verifier=random();s.created=Date.now();await s.save();const q=new URLSearchParams({response_type:'code',client_id:cfg.client,redirect_uri:cfg.origin+'/api/member-callback',scope:'openid profile',state:s.state,nonce:s.nonce,code_challenge:challenge(s.verifier),code_challenge_method:'S256'});return res.redirect(302,cfg.base+'/oauth/authorize?'+q);}
 catch{return res.redirect(302,'/members.html?signin=unavailable');}}

