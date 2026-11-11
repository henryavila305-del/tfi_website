// Phase 2: category-specific records and a single featured Premium as Play of the Day.
// Pure model: no persistence, secrets, external APIs, or production writes.
import { wagerKey } from './model.mjs';

export const PREMIUM_CATEGORIES = Object.freeze([
  'Main Premium','NBA Premium','NHL Premium','NFL Premium','NCAAB Premium','NCAAF Premium'
]);
export const PUBLIC_RECORD_CATEGORIES = Object.freeze([
  'Top 3','Main Premium','Dog of the Day','Play of the Day'
]);
const assert = (condition,message) => { if(!condition) throw new Error(message); };
const summarize = picks => ({
  wins:picks.filter(p=>p.status==='win').length,
  losses:picks.filter(p=>p.status==='loss').length,
  pushes:picks.filter(p=>p.status==='push').length,
  pending:picks.filter(p=>!p.status||p.status==='pending').length
});
export function validatePremiumCard(card) {
  assert(card && Array.isArray(card.picks),'Missing card picks');
  const cats = card.picks.map(p=>p.category);
  assert(cats.length===new Set(cats).size,'Duplicate category slot');
  for (const p of card.picks) {
    assert(PREMIUM_CATEGORIES.includes(p.category)||p.category.startsWith('Top 3')||p.category==='Dog of the Day','Unsupported category');
  }
  const featured=card.featuredPlayOfDay;
  if (featured!==undefined && featured!==null) {
    assert(PREMIUM_CATEGORIES.includes(featured),'Play of the Day must reference a Premium category');
    assert(card.picks.some(p=>p.category===featured),'Featured Premium selection not found');
  }
  return true;
}
export function featurePlayOfDay(card, premiumCategory) {
  const updated={...card,featuredPlayOfDay:premiumCategory};
  validatePremiumCard(updated);
  return updated;
}
export function categoryRecords(card) {
  validatePremiumCard(card);
  return Object.fromEntries(PREMIUM_CATEGORIES.map(category=>[
    category,summarize(card.picks.filter(p=>p.category===category))
  ]));
}
export function publicRecords(card) {
  validatePremiumCard(card);
  const featured=card.picks.find(p=>p.category===card.featuredPlayOfDay);
  return {
    'Top 3':summarize(card.picks.filter(p=>p.category.startsWith('Top 3'))),
    'Main Premium':summarize(card.picks.filter(p=>p.category==='Main Premium')),
    'Dog of the Day':summarize(card.picks.filter(p=>p.category==='Dog of the Day')),
    'Play of the Day':summarize(featured?[featured]:[])
  };
}
// This intentionally returns records ONLY. No selections or private Premium breakdowns.
export function publicRecordPayload(card) {
  const records=publicRecords(card);
  return Object.fromEntries(PUBLIC_RECORD_CATEGORIES.map(k=>[k,records[k]]));
}
export function distinctWagerRecord(card) {
  validatePremiumCard(card);
  const seen=new Map();
  for (const p of card.picks) {
    const key=wagerKey(p);
    if (seen.has(key)) {
      assert(seen.get(key).status===p.status,'Conflicting result for the same wager');
    } else seen.set(key,p);
  }
  return summarize([...seen.values()]);
}
