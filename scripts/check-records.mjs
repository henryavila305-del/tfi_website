import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const html = await readFile('index.html', 'utf8');
const expected = [
  { name:'Top 3', w:137, l:99, p:0 },
  { name:'Premium / Max Bet', w:60, l:29, p:0 },
  { name:'Dog of the Day', w:35, l:23, p:0 },
  { name:'Play of the Day', w:24, l:31, p:2 }
];
const panels = [...html.matchAll(/<article class="record-panel"[\s\S]*?<\/article>/g)].map(m => m[0]);
assert.equal(panels.length,4);
for (let i=0;i<panels.length;i++) {
  const panel=panels[i], target=expected[i];
  const rows=[...panel.matchAll(/<tr><th scope="row">([^<]+)<\/th><td>(\d+)<\/td><td>(\d+)<\/td><td>(\d+)<\/td><td>([\d.]+)%<\/td><\/tr>/g)];
  assert(rows.length>1);
  let previous='';
  for (const row of rows) {
    const date=row[1].slice(0,10); assert(date>previous); previous=date;
    const [w,l]=row.slice(2,4).map(Number);
    assert.equal(row[5],(100*w/(w+l)).toFixed(2),'Win percentage must exclude pushes');
  }
  assert.deepEqual(rows.at(-1).slice(2,5).map(Number),[target.w,target.l,target.p]);
  assert(panel.includes(target.name));
  const coordinates=[...panel.match(/<polyline points="([^"]+)"/)[1].matchAll(/([\d.]+),([\d.]+)/g)];
  assert.equal(coordinates.length,rows.length);
  assert(coordinates.every(m=>Number(m[1])>=50&&Number(m[1])<=750&&Number(m[2])>=30&&Number(m[2])<=210));
}
const select={value:'record-panel-0',addEventListener(event,handler){this.change=handler;}};
const picker={hidden:true};
const nodes=expected.map((_,i)=>({id:`record-panel-${i}`,hidden:false}));
vm.runInNewContext(await readFile('records.js','utf8'), {document:{querySelector:s=>s==='.record-picker'?picker:select,querySelectorAll:()=>nodes}});
assert.equal(picker.hidden,false);
for (const selected of nodes) {
  select.value=selected.id;select.change();
  assert.deepEqual(nodes.filter(n=>!n.hidden).map(n=>n.id),[selected.id]);
}
assert.match(html,/self-reported historical imports/);
assert.match(html,/Net units and ROI are not presented/);
assert.match(html,/Premium overlaps Top 3 on ten entries/);
assert(!/TFI_Record_Tracker|source_chat|source_url|source_verified|tracker-ledger-row|bonus-parlay-row/.test(html),'Private import metadata must not ship');
console.log('Passed four reconciled record tables, percentage arithmetic, chart bounds and category switching.');
