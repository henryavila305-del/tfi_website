import { summarize, profit } from './domain.mjs';
const $=s=>document.querySelector(s);
const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
let state=null,local=false,publicView=false,demo=false;
const fmt=n=>n===null?'—':Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
const date=s=>new Date(s).toLocaleString();
async function api(path,data){const response=await fetch(path,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Request failed');return result;}
function message(text,error=false){$('#message').textContent=text;$('#message').className=error?'error':'';}
async function perform(button,fn){button.disabled=true;try{await fn();}catch(e){message(e.message,true);}finally{button.disabled=false;}}
async function dashboard(){state=await api('/api/dashboard');publicView=false;$('#auth').hidden=true;$('#logout').hidden=false;render();}
function chart(picks){const summary=summarize(picks),host=$('#chart');host.replaceChildren();if(!summary.curve.length){host.append(make('p','Your graph starts after a pick is graded.','muted'));return;}
  const values=[0,...summary.curve.map(p=>p.units)],low=Math.min(...values),high=Math.max(...values),range=high-low||1;
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 600 200');svg.setAttribute('role','img');svg.setAttribute('aria-label',`Cumulative net units over ${summary.curve.length} settled picks, ending at ${fmt(summary.netUnits)} units. The ledger contains each result.`);svg.classList.add('chart-svg');
  const y=n=>175-(n-low)/range*150;
  for(const level of [low,high]){const line=document.createElementNS(ns,'line');for(const[k,v]of Object.entries({x1:15,x2:585,y1:y(level),y2:y(level),class:'chart-grid'}))line.setAttribute(k,v);svg.append(line);}
  const zero=document.createElementNS(ns,'line');for(const[k,v]of Object.entries({x1:15,x2:585,y1:y(0),y2:y(0),class:'chart-zero'}))zero.setAttribute(k,v);svg.append(zero);
  const line=document.createElementNS(ns,'polyline');line.setAttribute('points',values.map((n,i)=>`${15+i/(values.length-1)*570},${y(n)}`).join(' '));line.setAttribute('class','chart-line');svg.append(line);host.append(svg,make('p',`Range: ${fmt(low)} to ${fmt(high)} units · Latest: ${fmt(summary.netUnits)} units`,'muted'));
}
function render(){
  $('#workspace').hidden=false;$('#owner-controls').hidden=publicView;$('#record-label').textContent=publicView?'FREE PUBLIC PROFILE':'PRIVATE WORKSPACE';
  $('#record-title').textContent=publicView?`@${state.handle} · Published picks record`:`@${state.user.handle} · Your record`;
  $('#access').textContent=demo?'SYNTHETIC EXAMPLE':publicView?'SELF-REPORTED':state.active?'BETA ACCESS ACTIVE':'READ ONLY · MEMBERSHIP REQUIRED';
  const filter=$('#filter').value,picks=state.picks.filter(p=>filter==='all'||p.sport===filter),s=summarize(picks);
  const metrics=$('#metrics');metrics.replaceChildren();
  for(const[label,value,detail]of [['Net units',fmt(s.netUnits),`${picks.length} picks · ${s.pending} pending`],['ROI',s.roi===null?'—':`${fmt(s.roi)}%`,`${fmt(s.riskedUnits)} units settled stake`],['Win percentage',s.winPercentage===null?'—':`${fmt(s.winPercentage)}%`,`${s.wins} wins / ${s.losses} losses`],['Other outcomes',`${s.pushes} / ${s.voids}`,'Pushes / voids']]){const tile=make('div',undefined,'metric');tile.append(make('span',label),make('strong',value),make('span',detail));metrics.append(tile);}
  chart(picks);const breakdown=$('#breakdown');breakdown.replaceChildren();
  for(const sport of [...new Set(picks.map(p=>p.sport))]){const sub=summarize(picks.filter(p=>p.sport===sport)),row=make('div',undefined,'sport-row');row.append(make('strong',sport),make('span',`${fmt(sub.netUnits)} u · ${sub.wins}W–${sub.losses}L`));breakdown.append(row);}
  if(!picks.length)breakdown.append(make('p','No picks in this view.','muted'));
  if(!publicView){$('#enable-profile').hidden=state.profileEnabled;$('#enable-profile').disabled=!state.active||demo;$('#profile-link').hidden=!state.profileEnabled;$('#profile-link').href=`/tracker/?profile=${encodeURIComponent(state.user.handle)}`;for(const el of $('#pick-form').elements)el.disabled=!state.active||demo;}
  const ledger=$('#ledger');ledger.replaceChildren();
  if(!picks.length)ledger.append(make('p','No picks yet. Your record starts with your first saved selection.','muted'));
  for(const p of picks){const row=make('article',undefined,'pick'),head=make('div',undefined,'pick-head');head.append(make('span',`${p.sport} · ${p.publishedAt?'PUBLISHED':'PRIVATE'}${p.late?' · LATE ENTRY':''}`,'chip'),make('strong',`${p.result.toUpperCase()}${p.result==='pending'?'':` · ${fmt(profit(p))} u`}`));row.append(head,make('h3',p.selection),make('p',`${p.event} · ${p.market}`),make('p',`${fmt(p.decimalOdds)} decimal odds · ${fmt(p.stake)} units · Starts ${date(p.startsAt)}`,'muted'),make('p',p.publishedAt?`Published ${date(p.publishedAt)} · Self-reported`:`Saved ${date(p.createdAt)} · Private`,'muted'));
    if(p.history?.length){const detail=make('details'),list=make('ol',undefined,'history');detail.append(make('summary','Result history'));for(const h of p.history)list.append(make('li',`${date(h.at)} · ${h.action}: ${h.from} → ${h.to} · ${h.reason}`));detail.append(list);row.append(detail);}
    if(!publicView&&!demo&&state.active){const actions=make('div',undefined,'actions');
      if(!p.publishedAt&&p.result==='pending'&&Date.parse(p.startsAt)>Date.now()){const publish=make('button','Publish permanently');publish.addEventListener('click',()=>perform(publish,async()=>{await api(`/api/picks/${p.id}/publish`,{});await dashboard();message('Pick published. All outcomes will remain in the public record.');}));actions.append(publish);}
      const audit=make('button','View audit history');audit.addEventListener('click',()=>perform(audit,async()=>{const rows=await api(`/api/picks/${p.id}/audit`);let detail=row.querySelector('.audit');if(!detail){detail=make('ol',undefined,'audit history');row.append(detail);}detail.replaceChildren(...rows.map(r=>make('li',`${date(r.at)} · ${r.action}${r.data.reason?` · ${r.data.reason}`:''}`)));}));actions.append(audit);row.append(actions);
      if(Date.parse(p.startsAt)<=Date.now()){const form=make('form',undefined,'grading'),label=make('label','Result'),select=make('select');select.name='result';for(const result of ['win','loss','push','void']){const o=make('option',result);o.value=result;select.append(o);}label.append(select);const reasonLabel=make('label',p.publishedAt?'Grading source / reason · visible publicly':'Grading source / correction reason'),reason=make('input');reason.name='reason';reason.required=true;reason.maxLength=500;reasonLabel.append(reason);const button=make('button',p.result==='pending'?'Grade pick':'Record correction');form.append(label,reasonLabel,button);form.addEventListener('submit',e=>{e.preventDefault();perform(button,async()=>{await api(`/api/picks/${p.id}/settle`,Object.fromEntries(new FormData(form)));await dashboard();message('Result saved with an audit entry.');});});row.append(form);}
    }
    ledger.append(row);
  }
}
$('#filter').addEventListener('change',render);
$('#account').addEventListener('submit',e=>{e.preventDefault();const button=e.submitter;perform(button,async()=>{const input=Object.fromEntries(new FormData(e.target));if(button.value==='register'){await api('/api/register',input);message('Test account created. Sign in next. New accounts have no paid access; no billing occurred.');e.target.elements.password.value='';return;}await api('/api/login',input);e.target.reset();await dashboard();message('Signed in.');});});
$('#logout').addEventListener('click',e=>perform(e.target,async()=>{await api('/api/logout',{});state=null;$('#workspace').hidden=true;$('#auth').hidden=false;$('#logout').hidden=true;message('Signed out.');}));
$('#enable-profile').addEventListener('click',e=>perform(e.target,async()=>{await api('/api/profile',{enabled:true});await dashboard();message('Your public profile is enabled. Private picks stay private.');}));
$('#pick-form').addEventListener('submit',e=>{e.preventDefault();perform(e.submitter,async()=>{const data=Object.fromEntries(new FormData(e.target));data.startsAt=new Date(data.startsAt).toISOString();await api('/api/picks',data);e.target.reset();await dashboard();message('Pick saved. Betting details are now locked.');});});
function example(){
  const base={market:'Moneyline',decimalOdds:2,stake:1,visibility:'public',verification:'self-reported',late:false};
  return [['NFL','Example football A','win'],['NBA','Example basketball B','loss'],['NFL','Example football C','win'],['NHL','Example hockey D','push'],['NBA','Example basketball E','pending']].map(([sport,event,result],i)=>({...base,id:`example-${i}`,sport,event,selection:`Illustrative selection ${i+1}`,result,createdAt:`2026-10-${10+i}T10:00:00Z`,publishedAt:`2026-10-${10+i}T10:00:00Z`,startsAt:`2026-10-${10+i}T18:00:00Z`,settledAt:result==='pending'?null:`2026-10-${10+i}T22:00:00Z`,history:[]}));
}
async function start(){
  try{const r=await api('/api/health');local=r.mode==='isolated-local-beta';}catch{}
  const profile=new URLSearchParams(location.search).get('profile');
  if(!local){demo=true;publicView=true;state={handle:'example_capper',picks:example()};$('#mode').textContent='DESIGN PREVIEW · All picks and results below are synthetic examples. No accounts, payments, saved records, or live services are connected here.';render();return;}
  $('#mode').textContent='ISOLATED LOCAL BETA · Data stays on this computer. No payment is taken. Manual results are self-reported; no live feed is connected.';
  if(profile){publicView=true;try{state=await api(`/api/public/${encodeURIComponent(profile)}`);render();}catch(e){message(e.message,true);}return;}
  try{await dashboard();}catch{$('#auth').hidden=false;}
}
start();
