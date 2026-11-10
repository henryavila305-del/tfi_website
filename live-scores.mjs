import {scoreForPick} from './live-score-core.mjs';
let busy=false,active=[];
const text=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el;};
async function refresh(){
 if(busy||document.hidden||!active.length)return;busy=true;
 const snapshot=active;
 try{
  const groups=[...new Set(snapshot.filter(Boolean).map(p=>`${p.sport}:${p.game_date}`))];
  const feeds=new Map(await Promise.all(groups.map(async key=>{const [sport,date]=key.split(':');try{const r=await fetch(`/api/scores?sport=${encodeURIComponent(sport)}&date=${encodeURIComponent(date)}`,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const j=await r.json();if(!Array.isArray(j.events))throw Error();return [key,j];}catch{return [key,null];}})));
  if(snapshot!==active)return;
  const cards=document.querySelectorAll('.completed-grid .ranked-pick');
  snapshot.forEach((pick,i)=>{
   if(!pick)return;const card=cards[i];if(!card)return;let host=card.querySelector('.live-score');if(!host){host=document.createElement('div');host.className='live-score';card.append(host);}
   const feed=feeds.get(`${pick.sport}:${pick.game_date}`),score=feed&&scoreForPick(pick,feed.events);
   host.replaceChildren();
   if(!score){host.append(text('small','LIVE SCORE UNAVAILABLE · RESULT GRADING IS SEPARATE'));return;}
   host.dataset.state=score.state;
   const state=score.completed?'FINAL':score.state==='in'?'LIVE':score.state==='pre'?'SCHEDULED':'GAME STATUS';
   host.append(text('b',`${state} · ${score.detail}`));
   if(score.teamScore!==null&&score.opponentScore!==null)host.append(text('span',`${score.team} ${score.teamScore} — ${score.opponentScore} ${score.opponent}`));
   if(score.state==='pre'&&score.start){const d=new Date(score.start);if(Number.isFinite(d.valueOf()))host.append(text('span',d.toLocaleString('en-US',{hour:'numeric',minute:'2-digit',timeZoneName:'short'})));}
   const updated=new Date(feed.updatedAt);host.append(text('small',`ESPN · Updated ${Number.isFinite(updated.valueOf())?updated.toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'}):'recently'} · refreshes every 30s`));
  });
 }finally{busy=false;}
}
export function updateLivePicks(picks){active=picks;refresh();}
setInterval(refresh,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
