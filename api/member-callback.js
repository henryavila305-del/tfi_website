import {settings,headers,session,same,whopJSON} from '../lib/member-auth.mjs';
export default async function handler(req,res){headers(res);if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 let stage='configuration';
 try{const cfg=settings(),flow=await session(req,res,cfg,'__Host-tfi_oauth',600);const {code,state}=req.query;
 if(typeof code!=='string'||!same(state,flow.state)||!flow.verifier||!Number.isFinite(flow.created)||Date.now()-flow.created>600000){flow.destroy();return res.status(400).json({error:'Sign-in expired. Start again.'});}
 const verifier=flow.verifier,nonce=flow.nonce;flow.destroy();
 stage='token_exchange';
 const token=await whopJSON(cfg.base+'/oauth/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'authorization_code',code,code_verifier:verifier,client_id:cfg.client,client_secret:cfg.secret,redirect_uri:cfg.origin+'/api/member-callback'})});
 stage='token_response';
 if(typeof token.access_token!=='string'||typeof token.id_token!=='string')throw Error('Invalid tokens');
 // The token is obtained directly from Whop over TLS, never accepted from the browser.
 stage='identity_validation';
 const claims=JSON.parse(Buffer.from(token.id_token.split('.')[1],'base64url').toString());
 if(!same(claims.nonce,nonce)||!(claims.exp>Date.now()/1000)||!(claims.aud===cfg.client||Array.isArray(claims.aud)&&claims.aud.includes(cfg.client)))throw Error('Invalid identity');
 stage='user_info';
 const user=await whopJSON(cfg.base+'/oauth/userinfo',{headers:{Authorization:'Bearer '+token.access_token}});
 stage='user_validation';
 if(!/^user_[a-zA-Z0-9]+$/.test(user.sub||'')||user.sub!==claims.sub)throw Error('Invalid user');
 stage='session_save';
 const member=await session(req,res,cfg);member.userId=user.sub;member.signedInAt=Date.now();await member.save();return res.redirect(302,'/members.html');
 }catch(error){console.error('TFI member callback failed', {stage, upstreamStatus:Number.isInteger(error?.upstreamStatus)?error.upstreamStatus:null, upstreamCode:error?.upstreamCode||'unclassified'});return res.redirect(302,'/members.html?signin=failed&step='+stage);}}
