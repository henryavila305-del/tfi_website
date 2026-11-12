// Isolated reconciliation engine. No browser fetch, credentials, or production writes.
// The historical baseline MUST be independently audited before public display.
import { PREMIUM_CATEGORIES } from './records-phase2.mjs';
const statuses=new Set(['win','loss','push','pending']);
const summary=rows=>({wins:rows.filter(x=>x.status==='win').length,losses:rows.filter(x=>x.status==='loss').length,pushes:rows.filter(x=>x.status==='push').length,pending:rows.filter(x=>x.status==='pending').length});
const fail=m=>{throw new Error(m)};
const normalize=x=>String(x??'').trim().toLowerCase().replace(/\s+/g,' ');
export function reconcileRecords({historical,tracker,overlapIds,verifiedBaseline=false}) {
  if(!verifiedBaseline) fail('Historical baseline not audited; publication blocked');
  if(!Array.isArray(historical)||!Array.isArray(tracker)||!Array.isArray(overlapIds)) fail('Missing reconciliation inputs');
  const excluded=new Set(overlapIds);
  const known=new Set();
  const merged=[];
  for(const item of [...historical,...tracker.filter(x=>!excluded.has(x.id))]){
    if(!item.id||!item.category||!statuses.has(item.status)) fail('Invalid record');
    if(known.has(item.id)) fail('Duplicate record ID');
    known.add(item.id);merged.push(item);
  }
  const categories=Object.fromEntries(PREMIUM_CATEGORIES.map(c=>[c,summary(merged.filter(x=>x.category===c))]));
  const featured=merged.filter(x=>x.featuredPlayOfDay===true);
  for(const p of featured) if(!PREMIUM_CATEGORIES.includes(p.category)) fail('Featured Play of the Day must originate from Premium');
  const top=merged.filter(x=>/^Top 3 #[123]$/.test(x.category));
  const publicRecord={
    'Top 3':summary(top),
    'Premium / Max Bet':categories['Main Premium'],
    'Play of the Day':summary(featured),
    'Dog of the Day':summary(merged.filter(x=>x.category==='Dog of the Day'))
  };
  // No private pick details are included in the public payload.
  return {internalPremiumRecords:categories,publicRecord};
}
export function reconcileHistoricalBaseline({baseline,additions,verifiedBaseline=false}){
  if(!verifiedBaseline) fail('Historical baseline not audited; publication blocked');
  if(!baseline||!Array.isArray(additions)) fail('Missing baseline or additions');
  const seen=new Set();
  for(const p of additions){
    if(!p.id||seen.has(p.id)) fail('Duplicate or missing pick ID');
    seen.add(p.id);
    if(p.category!=='Main Premium'||!statuses.has(p.status)) fail('Non-Main Premium in public Premium calculation');
    if(!p.verifiedNotInBaseline) fail('Historical overlap unverified');
  }
  const delta=summary(additions);
  return {wins:baseline.wins+delta.wins,losses:baseline.losses+delta.losses,pushes:(baseline.pushes??0)+delta.pushes,pending:delta.pending};
}
