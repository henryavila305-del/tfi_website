
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePublicPicks, summarizePublicPicks, validatePublicPickTransition } from './public-picks.mjs';
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

const interleaved = {...sample, corrections:[
  {...correction},
  {...grade},
  {...correction,from:-105,to:105,correctedAt:'2026-11-01T14:30:00.000Z'},
  {...grade,from:'win',to:'push',correctedAt:'2026-11-01T15:00:00.000Z'}
]};
const interleavedSnapshot = JSON.stringify(interleaved);
for(const item of interleaved.corrections) Object.freeze(item);
Object.freeze(interleaved.corrections); Object.freeze(interleaved);
assert.deepEqual(summarizePublicPicks([interleaved]), {wins:0,losses:0,winPercentage:null});
assert.equal(JSON.stringify(interleaved),interleavedSnapshot,'Independent odds/grade chains must not mutate source');
assert.throws(()=>validatePublicPicks([{...interleaved,odds:-115}]), /value chain/);
assert.throws(()=>validatePublicPicks([{...interleaved,result:'loss'}]), /value chain/);
assert.throws(()=>validatePublicPicks([{...interleaved,corrections:[interleaved.corrections[0],interleaved.corrections[2],interleaved.corrections[1]]}]), /ordered/);
assert.equal(summarizePublicPicks([graded,{...sample,id:'independent-loss',result:'loss'}]).winPercentage,50);
console.log('Passed interleaved correction chains, frozen-source preservation, inconsistent base-value rejection and cross-pick statistics.');

const retained = JSON.parse(JSON.stringify(revised));
const appended = {...retained,corrections:[...retained.corrections,{...grade,from:'loss',to:'win',correctedAt:'2026-11-01T16:00:00.000Z'}]};
const retainedBytes = JSON.stringify(retained), appendedBytes = JSON.stringify(appended);
assert.equal(validatePublicPickTransition([retained],[appended])[0],appended);
assert.equal(validatePublicPickTransition([sample],[corrected])[0],corrected,'First correction may be appended');
assert.equal(validatePublicPickTransition([retained],[JSON.parse(retainedBytes)]).length,1,'Unchanged records are valid');
assert.equal(validatePublicPickTransition([],[sample]).length,1,'New synthetic records are allowed by the retention validator only');
assert.equal(validatePublicPickTransition([],[]).length,0);
assert.equal(JSON.stringify(retained),retainedBytes);
assert.equal(JSON.stringify(appended),appendedBytes);
assert.throws(()=>validatePublicPickTransition([retained],[]), /deleted or renamed/);
assert.throws(()=>validatePublicPickTransition([retained],[{...retained,id:'renamed'}]), /deleted or renamed/);
assert.throws(()=>validatePublicPickTransition([retained],[{...sample}]), /deleted/);
assert.throws(()=>validatePublicPickTransition([retained],[{...retained,corrections:retained.corrections.slice(0,1)}]), /deleted/);
for(const key of ['reason','approvalReference','correctedAt']) {
  const history = JSON.parse(JSON.stringify(retained.corrections));
  history[0][key] = key === 'correctedAt' ? '2026-11-01T14:01:00.000Z' : 'Changed prior evidence';
  assert.throws(()=>validatePublicPickTransition([retained],[{...retained,corrections:history}]), /rewritten/);
}
assert.throws(()=>validatePublicPickTransition([sample],[{...sample,odds:105}]), /Original public field/);
assert.throws(()=>validatePublicPickTransition([sample],[{...sample,result:'win'}]), /Original public field/);
for(const patch of [{selection:'New selection'},{market:'New market'},{reasoning:'Changed reason'},{approvalReference:'new-reference'},{eventAt:'2026-11-01T14:00:00.000Z'},{publishedAt:'2026-11-01T11:00:00.000Z'}])
  assert.throws(()=>validatePublicPickTransition([sample],[{...sample,...patch}]), /Original public field/);
const oddsRewrite = {...corrected,odds:-115,corrections:[{...correction,from:-115}]};
validatePublicPicks([oddsRewrite]); // A self-consistent rewrite passes single-snapshot validation.
assert.throws(()=>validatePublicPickTransition([corrected],[oddsRewrite]), /Original public field/);
const chainRewrite = {...corrected,corrections:[{...correction,to:105}]};
validatePublicPicks([chainRewrite]);
assert.throws(()=>validatePublicPickTransition([corrected],[chainRewrite]), /rewritten/);
assert.throws(()=>validatePublicPickTransition([withdrawn],[{...withdrawn,withdrawalReason:'Changed withdrawal reason'}]), /Original public field/);
assert.throws(()=>validatePublicPickTransition([sample],[{...sample,corrections:[{...correction,publicApproved:false}]}]));
assert.throws(()=>validatePublicPickTransition([{...sample,publicApproved:false}],[sample]), /approval/);
assert.equal(validatePublicPickTransition([sample,{...sample,id:'second-prior'}],[{...sample,id:'second-prior'},sample,{...sample,id:'new-third'}]).length,3,'Board order does not change correction order');
const reorderedKeys = {...retained,corrections:retained.corrections.map(item=>Object.fromEntries(Object.entries(item).reverse()))};
assert.equal(validatePublicPickTransition([retained],[reorderedKeys]).length,1,'JSON object key order is immaterial');
console.log('Passed snapshot retention, immutable originals, append-only correction prefixes and self-consistent tampering rejection.');

const sameTime = {...sample,corrections:[{...correction,correctedAt:grade.correctedAt},{...grade}]};
const reorderedHistory = {...sameTime,corrections:[sameTime.corrections[1],sameTime.corrections[0]]};
validatePublicPicks([reorderedHistory]);
assert.throws(()=>validatePublicPickTransition([sameTime],[reorderedHistory]), /rewritten or reordered/);
const frozenPrior = JSON.parse(JSON.stringify(retained)), frozenNext = JSON.parse(JSON.stringify(appended));
for(const pick of [frozenPrior,frozenNext]) { for(const item of pick.corrections) Object.freeze(item); Object.freeze(pick.corrections); Object.freeze(pick); }
assert.equal(validatePublicPickTransition(Object.freeze([frozenPrior]),Object.freeze([frozenNext])).length,1);

const {mkdtemp,writeFile,rm,link} = await import('node:fs/promises');
const {tmpdir} = await import('node:os');
const {join,resolve,dirname,basename} = await import('node:path');
const {spawnSync} = await import('node:child_process');
const historyDirectory = await mkdtemp(join(tmpdir(),'tfi-history-review-'));
const liveContentBefore = await readFile('content/public-picks.json','utf8');
try {
  const priorPath=join(historyDirectory,'prior.json'), nextPath=join(historyDirectory,'next.json');
  await writeFile(priorPath,JSON.stringify([retained]));
  await writeFile(nextPath,JSON.stringify([appended]));
  const run = args => spawnSync(process.execPath,['scripts/check-public-pick-history.mjs',...args],{encoding:'utf8'});
  assert.equal(run([priorPath,nextPath]).status,0);
  assert.match(run([nextPath,nextPath]).stderr,/distinct snapshot files/,'Self-comparison must not falsely certify history');
  assert.match(run([join(historyDirectory,'.','next.json'),nextPath]).stderr,/distinct snapshot files/);
  const aliasPath=join(historyDirectory,'candidate-alias.json');
  let hardLinkAvailable = true;
  try { await link(nextPath,aliasPath); } catch(error) {
    if (process.env.CI || !['EPERM','EACCES','ENOTSUP'].includes(error.code)) throw error;
    hardLinkAvailable = false;
    console.log('Local filesystem cannot create hard links; hard-link alias regression remains mandatory in CI.');
  }
  if (hardLinkAvailable) assert.match(run([aliasPath,nextPath]).stderr,/distinct snapshot files/,'Hard-link aliases must not bypass the distinct-file guard');
  await writeFile(nextPath,JSON.stringify([retained]));
  assert.equal(run([priorPath,nextPath]).status,0,'Distinct files with unchanged records remain valid');
  await writeFile(nextPath,'invalid JSON');
  assert.notEqual(run([priorPath,nextPath]).status,0,'Malformed candidate must fail');
  await writeFile(nextPath,JSON.stringify([appended]));
  const invalidPriorPath=join(historyDirectory,'invalid-prior.json');
  await writeFile(invalidPriorPath,'invalid JSON');
  assert.notEqual(run([invalidPriorPath,nextPath]).status,0,'Malformed prior snapshot must fail');
  await writeFile(invalidPriorPath,'{}');
  assert.notEqual(run([invalidPriorPath,nextPath]).status,0,'Invalid prior contract must fail');
  assert.notEqual(run([historyDirectory,nextPath]).status,0,'Directories are not snapshot files');
  assert.notEqual(run([]).status,0,'Missing explicit baseline must fail closed');
  assert.notEqual(run([join(historyDirectory,'missing.json'),nextPath]).status,0,'Missing baseline file must fail closed');
  await writeFile(nextPath,JSON.stringify([{...sample}]));
  assert.notEqual(run([priorPath,nextPath]).status,0,'CLI rejects deletion of earlier corrections');
  assert.equal(await readFile(priorPath,'utf8'),JSON.stringify([retained]),'Comparison must not edit baseline');
  assert.equal(await readFile(nextPath,'utf8'),JSON.stringify([{...sample}]),'Comparison must not edit candidate');
  assert.equal(await readFile('content/public-picks.json','utf8'),liveContentBefore);
} finally {
  assert.equal(dirname(resolve(historyDirectory)),resolve(tmpdir()));
  assert.match(basename(historyDirectory),/^tfi-history-review-/);
  await rm(historyDirectory,{recursive:true,force:true});
}
console.log('Passed correction reordering rejection, frozen snapshots and read-only CLI fail-closed behavior.');
