// Fail-closed aggregate generator. Inputs come from a trusted, private audit pipeline.
// Never commit raw Premium picks or secrets. This module does not query Supabase.
const CATEGORIES=['Top 3','Premium / Max Bet','Dog of the Day','Play of the Day'];
const sourceCategory={'Top 3':'Top 3','Main Premium':'Premium / Max Bet','Dog of the Day':'Dog of the Day','Play of the Day':'Play of the Day'};
const baseline={
  'Top 3':{wins:149,losses:108,pushes:0},
  'Premium / Max Bet':{wins:64,losses:32,pushes:0},
  'Dog of the Day':{wins:35,losses:23,pushes:0},
  'Play of the Day':{wins:24,losses:31,pushes:2}
};
export const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T00:00:00Z'))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
export function generateAuditedPublicSnapshot({picks,baselineCutoff='2026-11-08',throughDate,audit}) {
 if(!audit || audit.baselineWorkbook!=='TFI_Record_Tracker_Updated_Nov8.xlsx' || audit.reconciled!==true || audit.approved!==true)
   throw new Error('Trusted source audit and approval required');
 if(baselineCutoff!=='2026-11-08'||!validDate(throughDate)||throughDate<baselineCutoff||!Array.isArray(picks)) throw new Error('Invalid date or picks');
 const records=structuredClone(baseline),ids=new Set(),seen=new Map();
 for(const p of picks) {
   if(!p.id||ids.has(p.id)) throw new Error('Duplicate or missing source ID');
   ids.add(p.id);
   if(!validDate(p.game_date)||p.game_date<=baselineCutoff||p.game_date>throughDate) throw new Error('Outside verified post-baseline window');
   if(!['win','loss','push','pending'].includes(p.status)) throw new Error('Invalid grade');
   if(p.status==='pending')continue;
   if(!p.auditMatched || p.auditMatched!==true) throw new Error('Pick has not been individually audited');
   if(!/^Top 3 #[123]$/.test(p.category)&&!Object.hasOwn(sourceCategory,p.category)&&!['NBA Premium','NHL Premium','NFL Premium','NCAAB Premium','NCAAF Premium'].includes(p.category)) throw new Error('Unknown category');
   const category=/^Top 3 #[123]$/.test(p.category)?'Top 3':sourceCategory[p.category];
   if(typeof p.wagerId!=='string'||!p.wagerId.trim()) throw new Error('Invalid wager identity: audited canonical wagerId required');
   const identity=p.wagerId;
   const prior=seen.get(identity);
   if(prior&&prior.status!==p.status)throw new Error('Conflicting wager grades');
   if(!prior)seen.set(identity,{status:p.status,categories:new Set()});
   const credits=seen.get(identity).categories;
   if(category&&!credits.has(category)) {
     credits.add(category);records[category][p.status==='win'?'wins':p.status==='loss'?'losses':'pushes']++;
   }
   if(p.featuredPlayOfDay===true) {
     if(!['Main Premium','NBA Premium','NHL Premium','NFL Premium','NCAAB Premium','NCAAF Premium'].includes(p.category))
       throw new Error('Play of the Day must be a Premium selection');
     if(!credits.has('Play of the Day'))records['Play of the Day'][p.status==='win'?'wins':p.status==='loss'?'losses':'pushes']++;
     credits.add('Play of the Day');
   }
 }
 return {audited:true,baselineReconciled:true,throughDate,records:Object.fromEntries(CATEGORIES.map(c=>[c,records[c]]))};
}
