
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePublicPicks, summarizePublicPicks } from './public-picks.mjs';
const picks = validatePublicPicks(JSON.parse(await readFile('content/public-picks.json', 'utf8')));
assert.equal(picks.length, 0, 'Public publication remains on hold; board must stay empty');
const sample = { id:'synthetic-test-only', sport:'NBA', selection:'Synthetic selection', market:'Synthetic market', odds:-110, publishedAt:'2026-11-01T12:00:00.000Z', eventAt:'2026-11-01T13:00:00.000Z', reasoning:'Synthetic validation fixture; never published.', result:'pending', publicApproved:true, approvalReference:'synthetic-test-only' };
assert.equal(validatePublicPicks([sample]).length, 1);
for (const patch of [
  {publicApproved:false}, {approvalReference:''}, {sport:'UNKNOWN'}, {odds:0}, {odds:Infinity},
  {publishedAt:'2026-02-30T12:00:00.000Z'}, {eventAt:sample.publishedAt},
  {selection:'<script>'}, {result:'unknown'}, {source_url:'private'}, {reasoning:''}
]) assert.throws(() => validatePublicPicks([{...sample,...patch}]));
for (const field of Object.keys(sample)) {
  const missing = {...sample}; delete missing[field]; assert.throws(() => validatePublicPicks([missing]));
}
assert.throws(() => validatePublicPicks([sample,sample]));
assert.throws(() => validatePublicPicks({}));
assert.throws(() => validatePublicPicks([null]));
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
assert.equal(config.git.deploymentEnabled, false, 'Automatic Vercel deployment stays disabled');
console.log('Passed public-pick contract, rejection cases, empty publication hold, and deployment hold.');

const withdrawn = {...sample, result:'withdrawn', withdrawnAt:'2026-11-01T12:30:00.000Z', withdrawalReason:'Synthetic reason & context', withdrawalApproved:true, withdrawalApprovalReference:'synthetic-withdrawal-approval'};
assert.equal(validatePublicPicks([withdrawn]).length, 1);
for (const field of ['withdrawnAt','withdrawalReason','withdrawalApproved','withdrawalApprovalReference']) {
  const missing = {...withdrawn}; delete missing[field]; assert.throws(() => validatePublicPicks([missing]));
}
for (const patch of [
  {withdrawalApproved:false}, {withdrawalApproved:'true'}, {withdrawalApprovalReference:''}, {withdrawalApprovalReference:'x'.repeat(2001)}, {withdrawalReason:'<script>'},
  {withdrawalReason:' '}, {withdrawalReason:'x'.repeat(2001)}, {withdrawalReason:'bad\u0001text'},
  {withdrawnAt:'2026-02-30T12:30:00.000Z'}, {withdrawnAt:'2026-11-01T12:30:00+00:00'},
  {withdrawnAt:'2026-11-01T11:59:59.000Z'}, {withdrawalApprovalReference:'<private>'},
  {result:'void'}, {result:'pending'}, {privateNotes:'not allowed'}
]) assert.throws(() => validatePublicPicks([{...withdrawn,...patch}]));
assert.deepEqual(summarizePublicPicks([]), {wins:0,losses:0,winPercentage:null});
assert.deepEqual(summarizePublicPicks([withdrawn]), {wins:0,losses:0,winPercentage:null});
const mixed = ['win','win','loss','pending','push','void'].map((result,i)=>({...sample,id:'synthetic-stat-'+i,result}));
assert.deepEqual(summarizePublicPicks([...mixed,withdrawn]), summarizePublicPicks(mixed));
assert.equal(summarizePublicPicks([...mixed,withdrawn]).winPercentage, 200 / 3);
assert.throws(() => summarizePublicPicks([{...withdrawn,withdrawalApproved:false}]));
console.log('Passed synthetic withdrawal approval, evidence, time ordering and win-percentage exclusion.');

const correction = {field:'odds',from:-110,to:-105,correctedAt:'2026-11-01T12:15:00.000Z',reason:'Synthetic recording error only',publicApproved:true,approvalReference:'synthetic-correction-approval'};
const corrected = {...sample,corrections:[correction]};
const snapshot = JSON.stringify(corrected);
assert.equal(validatePublicPicks([corrected]).length,1);
assert.deepEqual(summarizePublicPicks([corrected]),{wins:0,losses:0,winPercentage:null});
assert.equal(JSON.stringify(corrected),snapshot,'Validation and statistics must not mutate original odds/history');
assert.equal(corrected.odds,-110);
assert.equal(validatePublicPicks([{...corrected,corrections:[correction,{...correction,from:-105,to:105,correctedAt:'2026-11-01T12:20:00.000Z'}]}]).length,1);
for (const patch of [
  {field:'selection'}, {from:-115}, {to:-110}, {to:0}, {to:Infinity}, {to:'-105'},
  {publicApproved:false}, {publicApproved:'true'}, {approvalReference:''}, {reason:' '},
  {reason:'<script>'}, {reason:'x'.repeat(2001)}, {approvalReference:'<private>'},
  {correctedAt:'2026-11-01T11:00:00.000Z'}, {correctedAt:'2026-02-30T12:15:00.000Z'},
  {correctedAt:'2026-11-01T12:15:00+00:00'}, {privateNotes:'private'}
]) assert.throws(()=>validatePublicPicks([{...sample,corrections:[{...correction,...patch}]}]));
for (const key of Object.keys(correction)) {
  const missing={...correction}; delete missing[key];
  assert.throws(()=>validatePublicPicks([{...sample,corrections:[missing]}]));
}
for (const corrections of [null,{},[],[null],Array(101).fill(correction)])
  assert.throws(()=>validatePublicPicks([{...sample,corrections}]));
assert.throws(()=>validatePublicPicks([{...sample,corrections:[correction,{...correction,from:-105,to:105,correctedAt:'2026-11-01T12:10:00.000Z'}]}]));
const grade = {...correction,field:'result',from:'pending',to:'win',correctedAt:'2026-11-01T14:00:00.000Z'};
const graded = {...sample,corrections:[correction,grade]};
assert.deepEqual(summarizePublicPicks([graded]),{wins:1,losses:0,winPercentage:100});
assert.equal(graded.result,'pending','Original result remains recorded');
const revised = {...sample,corrections:[grade,{...grade,from:'win',to:'loss',correctedAt:'2026-11-01T15:00:00.000Z'}]};
assert.deepEqual(summarizePublicPicks([revised]),{wins:0,losses:1,winPercentage:0});
for(const to of ['pending','push','void']) assert.equal(summarizePublicPicks([{...sample,result:'win',corrections:[{...grade,from:'win',to}]}]).winPercentage,null);
for(const patch of [{to:'withdrawn'},{to:'unknown'},{correctedAt:'2026-11-01T12:30:00.000Z'}])
  assert.throws(()=>validatePublicPicks([{...sample,corrections:[{...grade,...patch}]}]));
assert.throws(()=>validatePublicPicks([{...withdrawn,corrections:[{...grade,from:'withdrawn'}]}]));
assert.equal(summarizePublicPicks([{...withdrawn,corrections:[correction]}]).winPercentage,null);
console.log('Passed synthetic correction chains, approval, canonical chronology, original-value preservation and corrected statistics.');
