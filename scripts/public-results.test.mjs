import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateResults,renderResults} from './public-results.mjs';
import {renderPage} from './public-picks.mjs';
const source=JSON.parse(await readFile('content/public-results.json','utf8'));
test('dated owner-reported card retains unknown stakes and publication times',()=>{
  validateResults(source);
  assert.equal(source.cards.length,1);
  const card=source.cards[0];assert.equal(card.eventDate,'2026-11-08');assert.equal(card.timezone,'America/New_York');assert.equal(card.publishedAt,null);
  assert.deepEqual(card.selections.map(p=>p.result),['Win','Win','Win']);
  assert.deepEqual(card.selections.map(p=>p.score),['DEN 26-21 CAR','NYG 19-11 PHI','BOS 4-1 FLA']);
  assert(card.selections.every(p=>p.stakeUnits===null&&p.audience==='public'));
  const html=renderResults(source);assert(html.includes('3 wins · 0 losses · 0 pending'));
  assert(html.includes('November 8, 2026 · Eastern Time'));
  assert(!html.includes('Patriots'));assert(!html.includes('45–27'));
});
test('reject private fields, false publication, invalid dates and stale pending scores',()=>{
  for(const modify of [d=>d.cards[0].selections[0].audience='premium',d=>d.cards[0].privateNote='secret',d=>d.cards[0].publishedAt='2026-11-08T00:00:00Z',d=>d.cards[0].eventDate='2026-02-30',d=>{d.cards[0].selections[0].result='Pending';d.cards[0].selections[0].score='Old snapshot';}]) {
    const changed=structuredClone(source);modify(changed);assert.throws(()=>validateResults(changed));
  }
});
test('result cards escape text and preserve the entire historical section',async()=>{
  const changed=structuredClone(source);changed.cards[0].selections[0].selection='<img src=x onerror=attack>';
  assert(!renderResults(changed).includes('<img'));
  const template=await readFile('index.html','utf8');const page=renderPage(template,{version:1,picks:[]},source);
  assert(!page.includes('No free picks published yet'));
  assert.equal(page.slice(page.indexOf('<section id="results"')),template.slice(template.indexOf('<section id="results"')));
  for(const privateSelection of ['Cowboys','Golden Knights','Ducks ML','Pelicans','Broncos -3'])assert(!page.includes(privateSelection));
});
