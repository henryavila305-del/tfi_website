import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const read = name => readFile(name,'utf8');
const source = await read('index.html');
const content = await read('content/public-picks.json');
execFileSync(process.execPath,['scripts/preview-public-picks.mjs'],{stdio:'inherit'});
const directory = 'work/pick-preview/';
const full = await read(directory+'full.html'), fallback = await read(directory+'full-no-script.html');
for (const html of [full,fallback]) {
  assert.match(html,/SYNTHETIC REVIEW ONLY/);
  assert.match(html,/PUBLIC PICKS · 6/);
  assert(!html.includes('AWAITING PUBLICATION'));
  assert.equal((html.match(/class="public-pick"/g)||[]).length,6);
  assert(html.includes('<dd>withdrawn</dd>'));
  assert(html.includes('Synthetic withdrawal only'));
  assert(html.includes('2026-11-01T12:30:00.000Z'));
  assert(html.includes('Win percentage: 50.0%'));
  assert(!html.includes('synthetic-withdrawal-reference'));
  assert(!html.includes('synthetic-only'),'Approval metadata must not render');
  // Static withdrawal details must remain available without scripts or keyboard-only focus traps.
  const withdrawalCard = html.match(/<article class="public-pick"[^>]*>[\s\S]*?<\/article>/g).find(card => card.includes('<dd>withdrawn</dd>'));
  assert(withdrawalCard, 'Withdrawal is retained as a visible article');
  const heading = withdrawalCard.match(/aria-labelledby="([^"]+)"/)[1];
  assert(withdrawalCard.includes('<h3 id="' + heading + '">'), 'Withdrawal article has its own visible heading');
  assert(!/aria-hidden|\bhidden\b|tabindex|<(?:a|button|input|select|textarea)\b/i.test(withdrawalCard), 'Static withdrawal content must not be hidden or introduce tab stops');
  assert.match(withdrawalCard, /<dt>Withdrawal reason<\/dt><dd>Synthetic withdrawal only[^<]+<\/dd>/);
  assert.match(withdrawalCard, /<dt>Withdrawn \(UTC\)<\/dt><dd><time datetime="2026-11-01T12:30:00.000Z">2026-11-01T12:30:00.000Z<\/time><\/dd>/);
  assert(withdrawalCard.indexOf('<dt>Result</dt>') < withdrawalCard.indexOf('<dt>Withdrawal reason</dt>'), 'Status precedes withdrawal evidence in reading order');
  assert(html.includes('Recorded odds: -110 → -105'));
  assert(html.includes('Result: win → loss'));
  assert(html.includes('Result: loss → win'));
  for(const reference of ['synthetic-correction-reference','synthetic-grade-reference','synthetic-recheck-reference']) assert(!html.includes(reference));
  assert(html.includes('<dt>American odds (original)</dt><dd>-110</dd>'));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,'Full page must have unique IDs');
  for (const [,refs] of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g))
    for(const id of refs.split(/\s+/)) assert(ids.includes(id),'Missing accessible target '+id);
  for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(id),'Broken full-page anchor '+id);
  for (const [,asset] of html.matchAll(/(?:href|src)="\.\/([^"]+)"/g)) await access(directory+asset);
  const historical = text => text.slice(text.indexOf('<section id="results"'),text.indexOf('<section id="sports"'));
  assert.equal(historical(html),historical(source),'Synthetic cards must not change historical records');
}
assert.equal((full.match(/<script\b/g)||[]).length,2);
assert(!/<script\b/.test(fallback),'Fallback must not depend on scripts');
assert.equal(await read('index.html'),source,'Preview must not edit website source');
assert.equal(await read('content/public-picks.json'),content,'Preview must not edit publication content');
assert.deepEqual(JSON.parse(content),[]);
console.log('Passed full-page fixture anchors/assets/ARIA, historical isolation, script-free fallback, and unchanged publication content.');
