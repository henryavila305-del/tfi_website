import {sports} from '../live-score-core.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','public, s-maxage=15, stale-while-revalidate=15');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 const {sport,date}=req.query;
 if(typeof sport!=='string'||!Object.hasOwn(sports,sport)||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))){return res.status(400).json({error:'Invalid sport or date'});}
 try{
  const reply=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sports[sport]}/scoreboard?dates=${date.replaceAll('-','')}&limit=500`,{signal:AbortSignal.timeout(8000)});
  if(!reply.ok)throw Error('Feed unavailable');
  const data=await reply.json();if(!Array.isArray(data.events))throw Error('Invalid feed');
  const events=data.events.map(e=>({id:e.id,date:e.date,status:e.status,competitions:(e.competitions||[]).slice(0,1).map(c=>({status:c.status,competitors:(c.competitors||[]).map(t=>({score:t.score,homeAway:t.homeAway,team:{displayName:t.team?.displayName,shortDisplayName:t.team?.shortDisplayName,name:t.team?.name,abbreviation:t.team?.abbreviation}}))}))}));
  return res.status(200).json({events,updatedAt:new Date().toISOString()});
 }catch{return res.status(503).json({error:'Scores temporarily unavailable'});}
}
