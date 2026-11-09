import assert from 'node:assert/strict';

const sports = ['NFL','NBA','MLB','NHL','NCAAF','NCAAB','WNBA'];
const categories = ['Top 3','Play of the Day','Dog of the Day'];
const results = ['Pending','Win','Loss','Push','Void'];
function fields(value, allowed) {
  assert(value && typeof value === 'object' && !Array.isArray(value),'Object required');
  assert(Object.keys(value).every(key=>allowed.includes(key)),'Unexpected field; private content is not allowed');
}
function text(value, max) { assert(typeof value==='string' && value.trim().length>0 && value.length<=max,'Invalid text'); }
function timestamp(value) {
  assert(typeof value==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value)),'UTC timestamp required');
  assert.equal(new Date(value).toISOString().replace('.000Z','Z'),value.replace('.000Z','Z'),'Invalid calendar date');
}
function draft(value) {
  fields(value,['id','audience','sport','category','selection','odds','stakeUnits','eventStart','reasoning']);
  assert.equal(value.audience,'public','Only explicitly public picks may enter this workflow. Premium stays private.');
  assert(typeof value.id==='string' && /^[a-z0-9][a-z0-9-]{2,63}$/.test(value.id),'Invalid ID');
  assert(sports.includes(value.sport),'Unsupported sport');
  assert(categories.includes(value.category),'Premium category is not accepted');
  text(value.selection,160); text(value.reasoning,1200);
  assert(Number.isInteger(value.odds) && Math.abs(value.odds)>=100 && Math.abs(value.odds)<=100000,'American odds required; spread is not odds');
  assert(Number.isFinite(value.stakeUnits) && value.stakeUnits>0 && value.stakeUnits<=100,'Invalid unit stake');
  timestamp(value.eventStart);
}
export function validateLedger(ledger) {
  fields(ledger,['version','picks']); assert.equal(ledger.version,1); assert(Array.isArray(ledger.picks) && ledger.picks.length<=5000);
  const ids=new Set();
  for (const pick of ledger.picks) {
    fields(pick,['id','audience','sport','category','selection','odds','stakeUnits','eventStart','reasoning','recordedAt','result','history']);
    const {recordedAt,result,history,...input}=pick; draft(input);timestamp(recordedAt);
    assert(Date.parse(recordedAt)<Date.parse(pick.eventStart),'Late records are not public picks');
    assert(!ids.has(pick.id),'Duplicate ID');ids.add(pick.id);
    assert(results.includes(result),'Invalid result');assert(Array.isArray(history),'History required');
    let previous='Pending', previousTime=Date.parse(recordedAt);
    for (const entry of history) {
      fields(entry,['from','to','at','reason']);timestamp(entry.at);text(entry.reason,500);
      assert.equal(entry.from,previous,'Broken correction history');
      assert(results.includes(entry.to) && entry.to!=='Pending' && entry.to!==entry.from,'Invalid grading transition');
      assert(Date.parse(entry.at)>=Date.parse(pick.eventStart) && Date.parse(entry.at)>=previousTime,'Invalid grading time');
      previous=entry.to;previousTime=Date.parse(entry.at);
    }
    assert.equal(result,previous,'Result must match retained history');
  }
  return ledger;
}
export function recordPick(ledger,input,now=new Date()) {
  validateLedger(ledger);draft(input);
  assert(Date.parse(input.eventStart)>now.getTime(),'Event has already started');
  assert(!ledger.picks.some(p=>p.id===input.id),'ID already exists; betting details are immutable');
  return validateLedger({...ledger,picks:[...ledger.picks,{...input,recordedAt:now.toISOString(),result:'Pending',history:[]}]});
}
export function gradePick(ledger,id,result,reason,now=new Date()) {
  validateLedger(ledger);text(reason,500);assert(results.includes(result)&&result!=='Pending','Invalid grade');
  const pick=ledger.picks.find(p=>p.id===id);assert(pick,'Unknown pick');
  assert(now.getTime()>=Date.parse(pick.eventStart),'Cannot grade before event starts');assert(result!==pick.result,'Result unchanged');
  return validateLedger({...ledger,picks:ledger.picks.map(p=>p.id===id?{...p,result,history:[...p.history,{from:p.result,to:result,at:now.toISOString(),reason}]}:p)});
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderPicks(ledger) {
  validateLedger(ledger);
  if (!ledger.picks.length) return '<div class="board"><div><span class="board-icon" aria-hidden="true">↗</span><h3>No free picks published yet.</h3><p>Approved public selections will appear here with odds, event time, reasoning and retained results.</p></div><aside><p class="eyebrow">PUBLIC PICKS ONLY</p><p>Premium selections remain in the member experience. No live score feed or automatic grading is connected.</p></aside></div>';
  return '<p class="disclosure">Manually recorded public picks. Results are self-reported. Recorded time is the preparation time, not independently verified website publication or proof of an executed bet. Event times are supplied by TFI. Odds may change.</p><div class="published-picks">'+[...ledger.picks].sort((a,b)=>b.eventStart.localeCompare(a.eventStart)||a.id.localeCompare(b.id)).map(p=>'<article class="public-pick"><p class="eyebrow">'+escape(p.sport)+' / '+escape(p.category)+'</p><h3>'+escape(p.selection)+'</h3><p><strong>'+escape(p.odds>0?'+'+p.odds:p.odds)+'</strong> American odds · '+escape(p.stakeUnits)+'u · <strong>'+escape(p.result)+'</strong></p><p>'+escape(p.reasoning)+'</p><p class="note">Event: <time datetime="'+p.eventStart+'">'+p.eventStart+'</time><br>Recorded: <time datetime="'+p.recordedAt+'">'+p.recordedAt+'</time></p>'+(p.history.length?'<details><summary>Result history ('+p.history.length+')</summary><ol>'+p.history.map(h=>'<li>'+escape(h.from)+' → '+escape(h.to)+' · '+escape(h.at)+'<br>'+escape(h.reason)+'</li>').join('')+'</ol></details>':'')+'</article>').join('')+'</div><p class="note">These picks are separate from the imported historical graphs. No automatic reconciliation or combined performance total is claimed.</p>';
}
export function renderPage(template,ledger) {
  assert.equal(template.split('<!-- PUBLIC_PICKS_START -->').length,2,'Missing start marker');
  assert.equal(template.split('<!-- PUBLIC_PICKS_END -->').length,2,'Missing end marker');
  return template.replace(/<!-- PUBLIC_PICKS_START -->[\s\S]*?<!-- PUBLIC_PICKS_END -->/,()=>'<!-- PUBLIC_PICKS_START -->'+renderPicks(ledger)+'<!-- PUBLIC_PICKS_END -->');
}
