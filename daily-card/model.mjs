// Isolated daily-card domain model. No network, database, or production writes.
export const CATEGORIES = ['Top 3 #3','Top 3 #2','Top 3 #1','Main Premium','NBA Premium','NHL Premium','NFL Premium','NCAAF Premium'];
const premium = category => category.includes('Premium');
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const normalized = value => String(value).trim().toLowerCase().replace(/\s+/g,' ');
export function wagerKey(pick) {
  return [pick.gameDate,pick.sport,normalized(pick.pickTeam),normalized(pick.opponent),normalized(pick.betType),normalized(pick.selection),pick.odds].join('|');
}
export function validateCard(card, now = new Date()) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(card.date),'Invalid card date');
  assert(Array.isArray(card.picks),'Missing picks');
  assert(card.picks.length === new Set(card.picks.map(p=>p.category)).size,'Duplicate category');
  for (const pick of card.picks) {
    assert(CATEGORIES.includes(pick.category),'Unknown category');
    assert(pick.gameDate===card.date,'Date mismatch');
    assert(pick.sport && pick.pickTeam && pick.opponent && pick.betType && pick.selection,'Incomplete pick');
    assert(Number.isInteger(pick.odds) && Math.abs(pick.odds)>=100,'Invalid American odds');
    assert(!Number.isNaN(Date.parse(pick.startsAt)),'Missing valid start time');
    if (premium(pick.category) && !card.historical) {
      assert(Date.parse(pick.startsAt)-now.getTime()>=7200000,'Premium requires two-hour lead');
    }
  }
  const top = card.picks.filter(p=>p.category.startsWith('Top 3'));
  assert(top.length===0 || top.length===3,'Top 3 requires three ranked selections');
  assert(new Set(top.map(p=>[p.gameDate,p.sport,...[normalized(p.pickTeam),normalized(p.opponent)].sort()].join('|'))).size===top.length,'Top 3 must use separate games');
  return {valid:true,duplicates:duplicates(card)};
}
export function duplicates(card) {
  const groups = new Map();
  for (const pick of card.picks) {
    const key=wagerKey(pick);
    groups.set(key,[...(groups.get(key)||[]),pick.category]);
  }
  return [...groups.entries()].filter(([,categories])=>categories.length>1).map(([key,categories])=>({key,categories}));
}
export function createDraft(card, now=new Date()) {
  validateCard(card,now);
  return {...card,state:'draft',createdAt:now.toISOString(),approvedAt:null,publishedAt:null};
}
export function approve(draft, adminId, now=new Date()) {
  assert(draft.state==='draft','Only drafts may be approved');
  assert(adminId,'Admin identity required');
  validateCard(draft,now);
  return {...draft,state:'approved',approvedBy:adminId,approvedAt:now.toISOString()};
}
export function publish(approved, now=new Date()) {
  assert(approved.state==='approved','Approval required');
  validateCard(approved,now);
  assert(!approved.historical,'Historical fixture must not be published');
  return {...approved,state:'published',publishedAt:now.toISOString()};
}
export function grade(card, results) {
  assert(['approved','published','draft'].includes(card.state),'Invalid card state');
  return {...card,picks:card.picks.map(p=>{
    const status=results[p.category];
    assert(status===undefined || ['win','loss','push','pending'].includes(status),'Invalid grade');
    return {...p,status:status??p.status??'pending'};
  })};
}
export function report(card) {
  const summarize=picks=>({win:picks.filter(p=>p.status==='win').length,loss:picks.filter(p=>p.status==='loss').length,push:picks.filter(p=>p.status==='push').length,pending:picks.filter(p=>!p.status||p.status==='pending').length});
  const unique=[...new Map(card.picks.map(p=>[wagerKey(p),p])).values()];
  return {publishedSelections:summarize(card.picks),distinctWagers:summarize(unique),topThree:summarize(card.picks.filter(p=>p.category.startsWith('Top 3'))),premiums:summarize(card.picks.filter(p=>premium(p.category))),duplicates:duplicates(card)};
}
// The existing public feed only accepts Top 3. Never send Premium through this projection.
export function publicProjection(card) {
  assert(card.state==='published','Unpublished card');
  return card.picks.filter(p=>p.category.startsWith('Top 3')).map(({category,sport,pickTeam,opponent,betType,selection,odds,gameDate,status})=>({category,sport,pickTeam,opponent,betType,selection,odds,gameDate,status:status??'pending'}));
}
