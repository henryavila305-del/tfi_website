// Local synthetic review only. Never writes content/public-picks.json or dist.
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { renderPublicPicks } from './render-public-picks.mjs';
const directory = 'work/pick-preview';
await mkdir(directory, { recursive: true });
const sample = {id:'synthetic-card',sport:'NBA',selection:'Synthetic A & B — ' + 'LongSelection'.repeat(12),market:'Synthetic market only',odds:-110,publishedAt:'2026-11-01T12:00:00.000Z',eventAt:'2026-11-01T13:00:00.000Z',reasoning:'Synthetic example only. No real selection or performance claim. Long reasoning wraps across lines so the complete public explanation remains readable.',result:'pending',publicApproved:true,approvalReference:'synthetic-only'};
const withdrawn = {...sample,id:'synthetic-withdrawn',result:'withdrawn',withdrawnAt:'2026-11-01T12:30:00.000Z',withdrawalReason:'Synthetic withdrawal only — ' + 'LongReason'.repeat(15),withdrawalApproved:true,withdrawalApprovalReference:'synthetic-withdrawal-reference'};
const corrections = [{field:'odds',from:-110,to:-105,correctedAt:'2026-11-01T12:15:00.000Z',reason:'Synthetic recording correction — ' + 'LongCorrectionReason'.repeat(12),publicApproved:true,approvalReference:'synthetic-correction-reference'}];
withdrawn.corrections = corrections;
const template = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TFI synthetic card review</title><link rel="stylesheet" href="styles.css"><body><main id="top" class="wrap" style="max-width:1000px;padding:20px"><h1 style="font-size:32px;letter-spacing:0;line-height:1.3">Synthetic card review</h1><p>Test fixtures only — no real picks. No JavaScript.</p><a class="button" href="#after">Skip cards</a><p><!-- public-picks:status -->AWAITING PUBLICATION<!-- public-picks:status-end --></p><!-- public-picks:start --><!-- public-picks:end --><p id="after" tabindex="-1">End of synthetic cards.</p><a class="button" href="#top">Back to start</a></main></body></html>';
await writeFile(directory+'/desktop.html', renderPublicPicks(template,[...['pending','win','loss','push','void'].map((result,i)=>({...sample,id:'synthetic-'+i,result})),withdrawn]));
await writeFile(directory+'/narrow.html', renderPublicPicks(template.replace('max-width:1000px','max-width:320px'),[withdrawn]));
await copyFile('styles.css',directory+'/styles.css');
// Full-page fixtures reuse the real template and assets, without changing production content.
const fullTemplate = (await readFile('index.html','utf8'))
  .replace('<body>', '<body><p role="note" style="padding:1rem;background:#c0ff59;color:#101210">SYNTHETIC REVIEW ONLY — no real picks; publication is blocked.</p>');
const fullPicks = [...['pending','win','loss','push','void'].map((result,i)=>({...sample,id:'synthetic-full-'+i,result})),withdrawn];
fullPicks[1].corrections = [...corrections,
  {field:'result',from:'win',to:'loss',correctedAt:'2026-11-01T14:00:00.000Z',reason:'Synthetic grade recording error',publicApproved:true,approvalReference:'synthetic-grade-reference'},
  {field:'result',from:'loss',to:'win',correctedAt:'2026-11-01T15:00:00.000Z',reason:'Synthetic grade recheck',publicApproved:true,approvalReference:'synthetic-recheck-reference'}];
const full = renderPublicPicks(fullTemplate,fullPicks);
await writeFile(directory+'/full.html',full);
await writeFile(directory+'/full-no-script.html',full.replace(/<script\b[^>]*><\/script>/g,''));
for (const asset of ['app.js','records.js','favicon.svg']) await copyFile(asset,directory+'/'+asset);
console.log('Full-page fixtures: '+directory+'/full.html and full-no-script.html.');
console.log('Local synthetic fixtures: '+directory+'/desktop.html and narrow.html. Open as local files; no deployment needed.');
