import {headers} from '../lib/member-auth.mjs';

// Sign-out must still work when membership checks or provider credentials fail.
export default async function handler(req,res) {
  headers(res);
  if(req.method!=='POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'Method not allowed'});
  }
  try {
    const origin=new URL(process.env.MEMBER_APP_URL);
    if(origin.protocol!=='https:'||origin.username||origin.password||req.headers.origin!==origin.origin)
      return res.status(403).json({error:'Invalid origin'});
    res.setHeader('Set-Cookie',['__Host-tfi_member','__Host-tfi_oauth'].map(name=>
      name+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'));
    return res.status(200).json({ok:true});
  } catch {
    return res.status(503).json({error:'Sign-out unavailable. Please retry.'});
  }
}

