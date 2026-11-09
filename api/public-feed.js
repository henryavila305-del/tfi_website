import {easternDate,validDate,readPublicFeed} from '../lib/public-feed.mjs';
export function createHandler(read=readPublicFeed) {
  return async function handler(req,res) {
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
    const query=new URL(req.url,'https://www.thefavindex.com').searchParams;
    const date=query.get('date')??easternDate();
    if([...query.keys()].some(key=>key!=='date')||query.getAll('date').length>1||!validDate(date))return res.status(400).json({error:'Invalid date'});
    try{return res.status(200).json(await read(date));}
    catch{return res.status(503).json({error:'Public results are temporarily unavailable'});}
  };
}
export default createHandler();
