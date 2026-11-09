import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
import {validatePublicRecord,readPublicRecord} from '../lib/public-record.mjs';
function data(){return {version:1,timezone:'America/New_York',computedAt:new Date().toISOString(),records:['top3','premium','dog','play'].map((key,i)=>({key,baselineThrough:['2026-11-01','2026-11-01','2026-10-13','2026-10-30'][i],dailyTrackingFrom:'2026-11-08',coverageGapExcluded:true,wins:4,losses:2,pushes:1,pending:1,voids:0,winPercentage:4/6*100,series:[{date:'2026-07-12',wins:3,losses:2,pushes:0},{date:'2026-11-08',wins:4,losses:2,pushes:1}]}))};}
test('public aggregate proxy projects only coherent totals and historical series',async()=>{
  const input=data();input.records[0].privateSelection='not public';const safe=validatePublicRecord(input);assert(!JSON.stringify(safe).includes('not public'));
  for(const mutate of [d=>d.records[0].wins++,d=>d.records[0].winPercentage=100,d=>d.records[0].series[1].date='2026-07-12',d=>d.records[0].key='private',d=>d.records[0].dailyTrackingFrom='2026-11-01']){const bad=data();mutate(bad);assert.throws(()=>validatePublicRecord(bad));}
  let call;const read=await readPublicRecord(async(url,options)=>{call={url,options};return Response.json(data());});assert.equal(read.records.length,4);assert.equal(call.url,'https://tfi-live-tracker.vercel.app/api/public-records');assert.equal(call.options.method,'GET');assert.equal(call.options.redirect,'error');assert(!call.options.headers);
  await assert.rejects(readPublicRecord(async()=>new Response('hidden',{status:503})));
  await assert.rejects(readPublicRecord(async()=>new Response('x'.repeat(500001))));
});
test('daily graph updates totals and restores imported snapshots on unavailable source',async()=>{
  const make=(textContent='')=>({textContent,childNodes:[],children:[],setAttribute(){},append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;},cloneNode(){return make(this.textContent);}});
  const panels=Array.from({length:4},(_,i)=>{
    const elements={'h3':make('Record '+i),'.record-numbers strong':make('original total'),'.record-numbers span':make('original rate'),'.record-heading .note':make('original date'),'svg':make(),'tbody':make()};
    return {elements,childNodes:[make('original snapshot')],querySelector:s=>elements[s],replaceChildren(...v){this.restored=v;}};
  });
  const status=make();let interval,fail=false,requests=0;
  const document={hidden:false,querySelectorAll:()=>panels,querySelector:()=>status,createElement:()=>make(),createElementNS:()=>make(),addEventListener(){}};
  vm.runInNewContext(await readFile('daily-record.js','utf8'),{document,Date,Intl,AbortSignal,setInterval:f=>{interval=f;},fetch:async()=>{requests++;return {ok:!fail,json:async()=>data()};}});
  for(let i=0;i<8;i++)await Promise.resolve();
  assert.equal(panels[0].elements['.record-numbers strong'].textContent,'4–2–1');assert.equal(panels[0].elements['tbody'].children.length,2);assert(status.textContent.includes('gaps'));
  fail=true;await interval();assert(panels.every(p=>p.restored[0].textContent==='original snapshot'));assert(status.textContent.includes('unavailable'));
  document.hidden=true;await interval();assert.equal(requests,2);
});
