import assert from 'node:assert/strict';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fields(value,keys) {assert(value && typeof value==='object'&&!Array.isArray(value));assert(Object.keys(value).every(k=>keys.includes(k)),'Unknown field in public results');}
function text(value,max) {assert(typeof value==='string'&&value.trim().length>0&&value.length<=max);}
export function validateResults(document) {
  fields(document,['version','cards']);assert.equal(document.version,1);assert(Array.isArray(document.cards)&&document.cards.length<=1000);
  const ids=new Set();
  for(const card of document.cards) {
    fields(card,['id','eventDate','timezone','type','verification','publishedAt','selections']);
    assert(/^[a-z0-9-]{3,64}$/.test(card.id));assert(!ids.has(card.id));ids.add(card.id);
    assert(typeof card.eventDate==='string'&&/^\d{4}-\d\d-\d\d$/.test(card.eventDate));
    const date=new Date(card.eventDate+'T12:00:00Z');assert(Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===card.eventDate,'Invalid calendar date');
    assert.equal(card.timezone,'America/New_York');assert.equal(card.type,'historical_entry');assert.equal(card.verification,'user_reported');assert.equal(card.publishedAt,null,'Do not invent pre-event publication');
    assert(Array.isArray(card.selections)&&card.selections.length>0&&card.selections.length<=30);
    const selections=new Set();
    for(const p of card.selections) {
      fields(p,['id','audience','sport','selection','odds','stakeUnits','result','score']);
      assert(/^[a-z0-9-]{3,64}$/.test(p.id));assert(!selections.has(p.id));selections.add(p.id);
      assert.equal(p.audience,'public','Premium results must stay private');
      assert(['NFL','NBA','NHL','MLB','NCAAF','NCAAB','WNBA'].includes(p.sport));text(p.selection,160);
      assert(Number.isInteger(p.odds)&&Math.abs(p.odds)>=100&&Math.abs(p.odds)<=100000);
      assert(p.stakeUnits===null || (Number.isFinite(p.stakeUnits)&&p.stakeUnits>0&&p.stakeUnits<=100));
      assert(['Pending','Win','Loss','Push','Void'].includes(p.result));
      if(p.result==='Pending')assert.equal(p.score,null,'Pending entries must not present old snapshots as current scores');
      else text(p.score,120);
    }
  }
  return document;
}
export function renderResults(document) {
  validateResults(document);
  return [...document.cards].sort((a,b)=>b.eventDate.localeCompare(a.eventDate)).map(card=>{
    const counts={Win:0,Loss:0,Push:0,Void:0,Pending:0};for(const p of card.selections)counts[p.result]++;
    const date=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(card.eventDate+'T12:00:00Z'));
    return '<section class="dated-results" aria-labelledby="card-'+card.id+'"><div class="heading"><div><p class="eyebrow">HISTORICAL ENTRY / REPORTED RESULTS</p><h3 id="card-'+card.id+'">'+date+' · Eastern Time</h3></div><p class="card-record">'+counts.Win+' wins · '+counts.Loss+' losses'+(counts.Push?' · '+counts.Push+' pushes':'')+(counts.Void?' · '+counts.Void+' voids':'')+' · '+counts.Pending+' pending</p></div><p class="disclosure">Entered after games began or finished. Results supplied by TFI; not independently verified here. No pre-event publication time is claimed. This dated card is not a live scoreboard.</p><div class="published-picks">'+card.selections.map(p=>'<article class="public-pick"><p class="eyebrow">'+escape(p.sport)+' / PUBLIC</p><h4>'+escape(p.selection)+'</h4><p><strong>'+escape(p.odds>0?'+'+p.odds:p.odds)+'</strong> American odds · <strong>'+escape(p.result==='Pending'?'Awaiting final confirmation':p.result)+'</strong></p>'+(p.score?'<p>Reported final: '+escape(p.score)+'</p>':'<p>Final score has not been confirmed.</p>')+'<p class="note">'+(p.stakeUnits===null?'Stake not supplied':escape(p.stakeUnits)+'u')+'</p></article>').join('')+'</div><p class="note">Card totals cover only these public selections. Premium selections are excluded. Category membership was not supplied; this card has not been added to the imported historical graphs. Unknown stakes are not treated as 1u.</p></section>';
  }).join('');
}
