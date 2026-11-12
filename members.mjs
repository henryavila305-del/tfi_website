import {scoreForPick} from './live-score-core.mjs';

const $=s=>document.querySelector(s);
const gate=$('#member-gate'), board=$('#member-board'), message=$('#member-message');
const cards=$('#member-cards'), filter=$('#member-category');
let picks=[], busy=false, generation=0, signedOut=false;
const el=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;return n;};

function lock(text,state='unavailable') {
  picks=[];
  cards.replaceChildren();
  board.hidden=true;
  gate.hidden=false;
  message.textContent=text;
  $('#member-refresh').hidden=false;
  $('#member-logout').hidden=state==='signed_out';
  $('#member-tier').textContent=state==='no_access'?'MEMBERSHIP NOT ACTIVE':'MEMBERS ACCESS';
  $('#member-updated').textContent='';
}
function render() {
  cards.replaceChildren();
  for(const p of picks.filter(p=>filter.value==='all'||p.category===filter.value)) {
    const card=el('article','');
    card.className='member-pick';
    card.dataset.result=p.status;
    card.dataset.id=p.id;
    card.append(el('small',p.game_date+' / '+p.category),el('h2',p.selection),el('p',p.pick_team+' vs '+p.opponent));
    const result=el('strong',String(p.status).toUpperCase());
    result.className='member-result';
    card.append(el('p','Posted odds: '+(p.odds>0?'+':'')+p.odds),result);
    const score=el('p','Checking game status.');
    score.className='member-score';
    card.append(score);
    cards.append(card);
  }
  $('#member-empty').hidden=cards.children.length>0;
}
async function scores() {
  const snapshot=picks;
  const keys=[...new Set(picks.map(p=>p.sport+':'+p.game_date))];
  await Promise.all(keys.map(async key=>{
    const [sport,date]=key.split(':');
    try {
      const r=await fetch('/api/scores?'+new URLSearchParams({sport,date}),{signal:AbortSignal.timeout(10000)});
      if(!r.ok)throw Error();
      const j=await r.json();
      if(snapshot!==picks)return;
      for(const p of picks.filter(p=>p.sport===sport&&p.game_date===date)) {
        const target=[...cards.children].find(a=>a.dataset.id===p.id)?.querySelector('.member-score');
        if(!target)continue;
        const s=scoreForPick(p,j.events);
        target.textContent=s?[
          s.completed?'FINAL':s.state==='in'?'LIVE':'GAME STATUS',
          s.detail,
          s.teamScore!==null&&s.opponentScore!==null?s.team+' '+s.teamScore+' – '+s.opponentScore+' '+s.opponent:''
        ].filter(Boolean).join(' · '):'Score unavailable';
      }
    } catch {
      if(snapshot!==picks)return;
      for(const p of snapshot.filter(p=>p.sport===sport&&p.game_date===date)) {
        const target=[...cards.children].find(a=>a.dataset.id===p.id)?.querySelector('.member-score');
        if(target)target.textContent='Score temporarily unavailable';
      }
    }
  }));
}
async function refresh() {
  if(busy||document.hidden||signedOut)return;
  busy=true;
  const ticket=++generation;
  try {
    const r=await fetch('/api/member-picks',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(25000)});
    const data=await r.json();
    if(ticket!==generation||signedOut||document.hidden)return;
    if(!r.ok){lock(data.error||'Member access unavailable.',data.state);return;}
    if(!Array.isArray(data.picks)||!Array.isArray(data.categories)||!['Premium','All Access'].includes(data.tier))throw Error();
    picks=data.picks;
    gate.hidden=true;
    board.hidden=false;
    $('#member-tier').textContent=data.tier;
    $('#member-refresh').hidden=false;
    $('#member-logout').hidden=false;
    $('#member-updated').textContent='Access checked '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
    const previous=filter.value;
    filter.replaceChildren(new Option('All included categories','all'));
    for(const name of data.categories)filter.add(new Option(name,name));
    filter.value=[...filter.options].some(o=>o.value===previous)?previous:'all';
    render();
    await scores();
  } catch {
    if(ticket===generation&&!signedOut&&!document.hidden)
      lock('Member access is temporarily unavailable. Please try again.');
  } finally {
    if(ticket===generation)busy=false;
  }
}
async function signOut() {
  // Invalidate pending pick/score responses before the network request finishes.
  generation++;
  busy=false;
  signedOut=true;
  lock('Signing out…','signed_out');
  try {
    const r=await fetch('/api/member-logout',{method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(10000)});
    if(r.ok)lock('You are signed out.','signed_out');
    else {signedOut=false;lock('Sign-out did not complete. Retry Sign out.');}
  } catch {
    signedOut=false;
    lock('Sign-out did not complete. Check your connection and retry Sign out.');
  }
}
filter.addEventListener('change',()=>{render();scores();});
$('#member-refresh').addEventListener('click',refresh);
$('#member-logout').addEventListener('click',signOut);
function suspend() {
  generation++;
  busy=false;
  lock('Checking member access.','signed_out');
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else refresh();});
window.addEventListener('pagehide',suspend);
window.addEventListener('pageshow',refresh);
const reason=new URLSearchParams(window.location.search).get('signin');
if(reason)$('#member-notice').textContent=reason==='unavailable'
  ?'Member sign-in is not connected on this preview yet.'
  :reason==='expired'
  ?'Your sign-in request expired. Please sign in again.'
  :'Whop sign-in could not finish. Please try again.';
refresh();
setInterval(refresh,30000);

