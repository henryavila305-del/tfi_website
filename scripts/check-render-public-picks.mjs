import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderPublicPicks } from './render-public-picks.mjs';
const template = await readFile('index.html', 'utf8');
const start = '<!-- public-picks:start -->', end = '<!-- public-picks:end -->';
const sample = { id:'synthetic-render-only', sport:'NBA', selection:'Synthetic A & B "quoted"', market:"Synthetic 'market'", odds:110, publishedAt:'2026-11-01T12:00:00.000Z', eventAt:'2026-11-01T13:00:00.000Z', reasoning:'Synthetic reasoning & evidence', result:'pending', publicApproved:true, approvalReference:'synthetic-approval-reference' };
assert.equal(renderPublicPicks(template, []), template, 'Empty state must be byte-for-byte preserved');
const rendered = renderPublicPicks(template, [sample]);
assert.equal(rendered.split(start)[0],template.split(start)[0].replace('AWAITING PUBLICATION','PUBLIC PICKS · 1'));
assert(!rendered.includes('AWAITING PUBLICATION'));
assert.equal(rendered.split(end)[1],template.split(end)[1]);
assert(rendered.includes('Synthetic A &amp; B &quot;quoted&quot;'));
assert(rendered.includes('Synthetic &#39;market&#39;'));
assert(rendered.includes('<dd>+110</dd>'));
assert(rendered.includes('aria-labelledby="public-pick-synthetic-render-only"'));
assert(rendered.includes('<h3 id="public-pick-synthetic-render-only">'));
assert(rendered.includes('<time datetime="' + sample.publishedAt + '">'));
assert(!rendered.includes(sample.approvalReference), 'Approval metadata must not render');
assert(!rendered.includes('No free picks published yet.'));
assert(!rendered.includes('<script src="./content/'));
for (const result of ['pending','win','loss','push','void']) {
  assert(renderPublicPicks(template,[{...sample,result,odds:-110}]).includes('<dd>' + result + '</dd>'));
}
assert.equal((renderPublicPicks(template,[sample,{...sample,id:'synthetic-second'}]).match(/class="public-pick"/g)||[]).length,2);
for (const broken of [template.replace(start,''),template + start, end + start, template.replace('<!-- public-picks:status -->',''), template + '<!-- public-picks:status-end -->']) assert.throws(()=>renderPublicPicks(broken,[]));
assert.throws(()=>renderPublicPicks(template,[{...sample,publicApproved:false}]));
assert.throws(()=>renderPublicPicks('<!-- public-picks:start --><!-- public-picks:status -->WAIT<!-- public-picks:status-end --><!-- public-picks:end -->',[]), /overlap/);
assert(renderPublicPicks(template,[sample,{...sample,id:'second-test'}]).includes('PUBLIC PICKS · 2'));
assert.throws(()=>renderPublicPicks(template,[{...sample,selection:'<script>alert(1)</script>'}]));
// Prevent accessible-name references from pointing at an existing page element.
for (const attribute of ['id="public-pick-synthetic-render-only"', "id='public-pick-synthetic-render-only'", 'id=public-pick-synthetic-render-only']) {
  assert.throws(()=>renderPublicPicks(template + '<div ' + attribute + '></div>',[sample]), /heading ID conflicts/);
}
// IDs inside the replaced slot do not survive and should not block valid rendering.
assert(renderPublicPicks(template.replace(start,start+'<div id="public-pick-synthetic-render-only"></div>'),[sample]).includes('PUBLIC PICKS · 1'));
console.log('Passed rendering, escaping, result labels, slot boundaries, empty fallback and accessible heading ID collision checks.');
