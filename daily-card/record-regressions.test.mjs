import assert from 'node:assert/strict';
import { generateAuditedPublicSnapshot as generate } from './generate-aggregate.mjs';
import { safePublicRecordSnapshot } from './public-record-adapter.mjs';
const audit={baselineWorkbook:'TFI_Record_Tracker_Updated_Nov8.xlsx',reconciled:true,approved:true};
const row={id:'a',wagerId:'same-wager',game_date:'2026-11-09',category:'Main Premium',status:'win',auditMatched:true,featuredPlayOfDay:true};
const input={picks:[row],throughDate:'2026-11-11',audit};
for(const date of ['2026-02-30','2026-13-01','2026-11-1',undefined]) {
  assert.throws(()=>generate({...input,throughDate:date}),/Invalid/);
  assert.throws(()=>safePublicRecordSnapshot({...generate(input),throughDate:date}),/date/);
}
assert.throws(()=>generate({...input,baselineCutoff:'2026-11-02'}),/Invalid/);
assert.throws(()=>generate({...input,picks:[{...row,wagerId:undefined}]}),/identity/);
assert.throws(()=>generate({...input,picks:[{...row,category:'Typo Premium'}]}),/Unknown/);
const duplicate={...row,id:'b'};
const safe=generate({...input,picks:[row,duplicate]});
assert.equal(safe.records['Premium / Max Bet'].wins,65);
assert.equal(safe.records['Play of the Day'].wins,25);
assert.throws(()=>generate({...input,picks:[row,{...duplicate,status:'loss'}]}),/Conflicting/);
const ranked=generate({...input,picks:[row,{...duplicate,category:'Top 3 #1',featuredPlayOfDay:false}]});
assert.equal(ranked.records['Top 3'].wins,150);
assert.equal(ranked.records['Premium / Max Bet'].wins,65);
assert.throws(()=>safePublicRecordSnapshot({...safe,baselineReconciled:'yes'}),/Unaudited/);
console.log('PASS: calendar dates, fixed cutoff, ranked Top 3, shared wager deduplication, conflicting grades and strict audit gate');
