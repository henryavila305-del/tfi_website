import assert from 'node:assert/strict';
import {featurePlayOfDay,categoryRecords,publicRecordPayload,distinctWagerRecord,PREMIUM_CATEGORIES} from './records-phase2.mjs';
const base={date:'2026-11-11',picks:[]};
const pick=(category,selection,status,betType='spread',odds=-110)=>({
  category,selection,status,betType,odds,sport:'NCAAB',pickTeam:'Michigan',opponent:'Synthetic Opponent',gameDate:'2026-11-11'
});
const main=pick('Main Premium','Main synthetic selection','win','ML',-125);
main.pickTeam='Synthetic Main Team';main.opponent='Synthetic Main Opponent';
const card=featurePlayOfDay({...base,picks:[
  main,pick('NCAAB Premium','Michigan -3.5','win'),
  pick('NBA Premium','Synthetic NBA +4.5','loss'),
  pick('NHL Premium','Synthetic NHL ML','push'),
  pick('NFL Premium','Synthetic NFL -2.5','pending'),
  pick('NCAAF Premium','Synthetic NCAAF -6.5','loss')
]},'NCAAB Premium');
const internal=categoryRecords(card);
assert.equal(Object.keys(internal).length,6);
assert.deepEqual(internal['NCAAB Premium'],{wins:1,losses:0,pushes:0,pending:0});
const publicView=publicRecordPayload(card);
assert.deepEqual(Object.keys(publicView),['Top 3','Main Premium','Dog of the Day','Play of the Day']);
assert.deepEqual(publicView['Main Premium'],{wins:1,losses:0,pushes:0,pending:0});
assert.deepEqual(publicView['Play of the Day'],{wins:1,losses:0,pushes:0,pending:0});
assert(!JSON.stringify(publicView).includes('Michigan'));
assert(!JSON.stringify(publicView).includes('NCAAB Premium'));
assert.equal(distinctWagerRecord(card).wins,2);
// The featured Play of the Day is a reference, not a second wager row.
assert.equal(card.picks.length,6);
assert.throws(()=>featurePlayOfDay(card,'Unknown Premium'),/must reference/);
assert.throws(()=>featurePlayOfDay(card,'Top 3 #1'),/must reference/);
assert(PREMIUM_CATEGORIES.includes(card.featuredPlayOfDay));
const overlap=featurePlayOfDay({...card,picks:[...card.picks,pick('Top 3 #3','Michigan -3.5','win')]},'NCAAB Premium');
assert.equal(distinctWagerRecord(overlap).wins,2);
const conflict={...overlap,picks:overlap.picks.map(p=>p.category==='Top 3 #3'?{...p,status:'loss'}:p)};
assert.throws(()=>distinctWagerRecord(conflict),/Conflicting result/);
console.log('PASS: six Premium records, Main-only public Premium, featured Play of the Day, duplicate wager and privacy tests.');
