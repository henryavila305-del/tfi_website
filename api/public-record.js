import {readPublicRecord} from '../lib/public-record.mjs';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
  if(req.url.includes('?'))return res.status(400).json({error:'No query options accepted'});
  try{return res.status(200).json(await readPublicRecord());}
  catch{return res.status(503).json({error:'Daily records are temporarily unavailable'});}
}
