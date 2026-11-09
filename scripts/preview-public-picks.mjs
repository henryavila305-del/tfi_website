// Local synthetic review only. Never writes content/public-picks.json or dist.
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { renderPublicPicks } from './render-public-picks.mjs';
const directory = 'work/pick-preview';
await mkdir(directory, { recursive: true });
const sample = {id:'synthetic-card',sport:'NBA',selection:'Synthetic A & B — ' + 'LongSelection'.repeat(12),market:'Synthetic market only',odds:-110,publishedAt:'2026-11-01T12:00:00.000Z',eventAt:'2026-11-01T13:00:00.000Z',reasoning:'Synthetic example only. No real selection or performance claim. Long reasoning wraps across lines so the complete public explanation remains readable.',result:'pending',publicApproved:true,approvalReference:'synthetic-only'};
const template = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TFI synthetic card review</title><link rel="stylesheet" href="styles.css"><body><main id="top" class="wrap" style="max-width:1000px;padding:20px"><h1 style="font-size:32px;letter-spacing:0;line-height:1.3">Synthetic card review</h1><p>Test fixtures only — no real picks. No JavaScript.</p><a class="button" href="#after">Skip cards</a><!-- public-picks:start --><!-- public-picks:end --><p id="after" tabindex="-1">End of synthetic cards.</p><a class="button" href="#top">Back to start</a></main></body></html>';
await writeFile(directory+'/desktop.html', renderPublicPicks(template,['pending','win','loss','push','void'].map((result,i)=>({...sample,id:'synthetic-'+i,result}))));
await writeFile(directory+'/narrow.html', renderPublicPicks(template.replace('max-width:1000px','max-width:320px'),[sample]));
await copyFile('styles.css',directory+'/styles.css');
console.log('Local synthetic fixtures: '+directory+'/desktop.html and narrow.html. Open as local files; no deployment needed.');
