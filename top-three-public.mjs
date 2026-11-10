import {updateLivePicks} from './live-scores.mjs';
import {config} from './spotlight-config.mjs';
import {latestCard,cardSummary} from './top-three-core.mjs';
const board=document.querySelector('.completed-board');
const templates=[...board.querySelectorAll('.ranked-pick')].map(p=>p.cloneNode(true));
const check=templates[0].querySelector('.result-pill svg').cloneNode(true);
const logos={'Dallas Mavericks':['nba','dal'],'New York Islanders':['nhl','nyi'],'Buffalo Bills':['nfl','buf'],'Denver Broncos':['nfl','den'],'New York Giants':['nfl','nyg'],'Boston Bruins':['nhl','bos'],'Minnesota Wild':['nhl','min'],'Oklahoma City Thunder':['nba','okc'],'Colorado Avalanche':['nhl','col']};
let busy=false;
async function refresh() {
  if(busy || document.hidden)return;
  busy=true;
  try {
    const fields='sport,category,pick_team,opponent,bet_type,odds,game_date,status';
    const response=await fetch(`${config.url}/rest/v1/tfi_public_feed?select=${fields}&order=game_date.desc&limit=60`,{headers:{apikey:config.key},cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('Public feed unavailable');
    const card=latestCard(await response.json());
    if(!card)throw new Error('No public card');
    const date=new Date(`${card.date}T12:00:00Z`);
    const label=date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
    const summary=cardSummary(card.picks);
    const nodes=card.picks.map((pick,i)=>{
      const el=templates[i].cloneNode(true);
      el.className='ranked-pick';
      const badge=el.querySelector('.team-badge');badge.replaceChildren();
      const pill=el.querySelector('.result-pill');pill.replaceChildren();
      if(!pick){el.querySelector('.pick-copy>span').textContent='AWAITING PUBLICATION';el.querySelector('h2').textContent='COMING SOON';el.querySelector('.pick-copy p').textContent='';return el;}
      const logo=logos[pick.pick_team];
      if(logo){const img=document.createElement('img');img.src=`https://a.espncdn.com/i/teamlogos/${logo[0]}/500/${logo[1]}.png`;img.alt='';img.width=58;img.height=58;img.addEventListener('error',()=>{badge.textContent=pick.pick_team.split(' ').map(s=>s[0]).join('');},{once:true});badge.append(img);}else badge.textContent=pick.pick_team.split(' ').map(s=>s[0]).join('');
      el.querySelector('.pick-copy>span').textContent=`${pick.sport} / VS ${pick.opponent}`;
      el.querySelector('h2').textContent=pick.pick_team;
      el.querySelector('.pick-copy strong').textContent=pick.odds>0?`+${pick.odds}`:String(pick.odds);
      if(pick.status==='win')pill.append(check.cloneNode(true));
      if(pick.status==='loss'){const cross=document.createElement('b');cross.textContent='×';cross.className='loss-mark';cross.setAttribute('aria-hidden','true');pill.append(cross);}
      const status=document.createElement('span');status.textContent=pick.status.toUpperCase();pill.append(status);pill.dataset.result=pick.status;
      return el;
    });
    board.querySelector('.completed-grid').replaceChildren(...nodes);
    updateLivePicks(card.picks);
    board.setAttribute('aria-label',`${label} Top 3`);
    const tag=board.querySelector('.date-tag');tag.replaceChildren(document.createTextNode(date.toLocaleDateString('en-US',{weekday:'long',timeZone:'UTC'}).toUpperCase()),document.createElement('br'));
    const dateText=document.createElement('strong');dateText.textContent=date.toLocaleDateString('en-US',{month:'short',day:'2-digit',timeZone:'UTC'}).toUpperCase();tag.append(dateText);
    board.querySelector('.board-context').textContent=`LATEST PUBLIC CARD · ${card.date.slice(0,4)} / ALL SPORTS`;
    board.querySelector('.sweep>span').textContent=summary.complete?'EVERY RESULT RECORDED.':'RESULTS UPDATE AFTER GRADING.';
    board.querySelector('.sweep strong').textContent=summary.text;
    board.querySelector('.board-disclosure').textContent=`${label} · ${summary.complete?'Completed selections, not current picks.':'Published selections; pending results are not counted as wins.'} Synced from the public tracker.`;
  } catch {board.querySelector('.board-disclosure').textContent+=''; /* Preserve the last clearly dated card on network failure. */}
  finally {busy=false;}
}
refresh();setInterval(refresh,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
