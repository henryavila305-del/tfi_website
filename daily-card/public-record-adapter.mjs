// Read-only public record adapter. Receives a pre-audited aggregate snapshot only.
// Never accept raw private picks in browser or expose a Supabase service key.
const PUBLIC_KEYS=['Top 3','Premium / Max Bet','Dog of the Day','Play of the Day'];
const isCount=n=>Number.isSafeInteger(n)&&n>=0;
export function safePublicRecordSnapshot(snapshot) {
  if(!snapshot || snapshot.audited!==true || !snapshot.records || !snapshot.baselineReconciled) {
    throw new Error('Unaudited records: keep historical website unchanged');
  }
  const result={};
  for(const name of PUBLIC_KEYS){
    const r=snapshot.records[name];
    if(!r||!isCount(r.wins)||!isCount(r.losses)||!isCount(r.pushes)) throw new Error('Invalid public aggregate: '+name);
    result[name]={wins:r.wins,losses:r.losses,pushes:r.pushes,winRate:(r.wins+r.losses)?(100*r.wins/(r.wins+r.losses)).toFixed(2):'0.00'};
  }
  return Object.freeze(result);
}
// Call only after the audit gate succeeds. The current production static record remains fallback.
export function renderVerifiedRecords(snapshot, documentRoot) {
  const records=safePublicRecordSnapshot(snapshot);
  for(const panel of documentRoot.querySelectorAll('[data-tfi-record-category]')){
    const key=panel.getAttribute('data-tfi-record-category');
    if(!Object.hasOwn(records,key)) continue;
    const r=records[key];
    const total=panel.querySelector('[data-tfi-record-total]');
    const rate=panel.querySelector('[data-tfi-record-rate]');
    if(total) total.textContent=r.wins+'–'+r.losses;
    if(rate) rate.textContent=r.winRate+'%';
  }
  return records;
}
