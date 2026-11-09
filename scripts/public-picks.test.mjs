import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recordPick, gradePick, validateLedger, renderPicks, renderPage } from './public-picks.mjs';
const blank=()=>({version:1,picks:[]});
const input=()=>({id:'synthetic-test-one',audience:'public',sport:'NBA',category:'Top 3',selection:'Synthetic team ML',odds:-150,stakeUnits:1,eventStart:'2030-01-02T20:00:00Z',reasoning:'Synthetic test only.'});
const before=new Date('2030-01-02T19:00:00Z'),after=new Date('2030-01-02T23:00:00Z');
test('public-only allowlist and valid prices; no hidden private fields',()=>{
  for(const change of [{audience:'premium'},{category:'Premium'},{odds:-3},{odds:0},{stakeUnits:0},{eventStart:'2030-01-02T20:00:00'},{eventStart:'2030-02-30T20:00:00Z'},{secret:'private'}]) assert.throws(()=>recordPick(blank(),{...input(),...change},before));
  const ledger=recordPick(blank(),input(),before);assert.equal(ledger.picks.length,1);
  assert.throws(()=>validateLedger({...ledger,privatePicks:[]}));
});
test('reject late entry and duplicate IDs; grading preserves immutable bet and loss',()=>{
  assert.throws(()=>recordPick(blank(),input(),after));
  assert.throws(()=>recordPick(blank(),input(),new Date(input().eventStart)));
  const recorded=recordPick(blank(),input(),before);assert.throws(()=>recordPick(recorded,input(),before));
  assert.throws(()=>gradePick(recorded,input().id,'Win','Too early',before));
  const lost=gradePick(recorded,input().id,'Loss','Operator checked final result',after);
  const corrected=gradePick(lost,input().id,'Push','Correction after reviewing final margin',new Date('2030-01-03T01:00:00Z'));
  assert.equal(lost.picks[0].result,'Loss');assert.equal(corrected.picks[0].history[1].from,'Loss');
  for(const key of Object.keys(input()))assert.deepEqual(corrected.picks[0][key],input()[key]);
  assert.throws(()=>validateLedger({...corrected,picks:[{...corrected.picks[0],history:[]}]}));
});
test('escape public content and correction reasons; no script execution from text',()=>{
  let ledger=recordPick(blank(),{...input(),selection:'<script>alert(1)</script>',reasoning:'<img onerror="attack">'},before);
  ledger=gradePick(ledger,input().id,'Loss','<svg onload="attack">',after);
  const html=renderPicks(ledger);
  assert(!html.includes('<script>'));assert(!html.includes('<img'));assert(!html.includes('<svg'));
  assert(html.includes('&lt;script&gt;'));assert(html.includes('Loss'));assert(html.includes('Result history (1)'));
  assert(html.includes('not independently verified website publication'));
});
test('empty content stays empty; rendering preserves historical section and checks markers',async()=>{
  const template=await readFile('index.html','utf8');
  const rendered=renderPage(template,recordPick(blank(),input(),before));
  assert(renderPicks(blank()).includes('No free picks published yet'));
  assert(rendered.includes('Synthetic team ML'));
  assert.equal(rendered.slice(rendered.indexOf('<section id="results"')),template.slice(template.indexOf('<section id="results"')));
  assert.throws(()=>renderPage('<html></html>',blank()));
  const literal=renderPage(template,recordPick(blank(),{...input(),reasoning:'Literal $& and $` remain text'},before));
  assert(literal.includes('Literal $&amp; and $` remain text'));
  assert.deepEqual(validateLedger(JSON.parse(await readFile('content/public-picks.json','utf8'))),blank(),'No real or synthetic picks ship by default');
});
