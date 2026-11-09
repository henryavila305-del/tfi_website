import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, readdir, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
const workspace = await mkdtemp(join(tmpdir(),'tfi-build-review-'));
const originalContent = await readFile('content/public-picks.json','utf8');
const runBuild = () => spawnSync(process.execPath,['scripts/build.mjs'],{cwd:workspace,encoding:'utf8'});
try {
  await mkdir(join(workspace,'scripts'));
  await mkdir(join(workspace,'content'));
  for (const file of (await readdir('scripts')).filter(name=>name.endsWith('.mjs'))) await copyFile('scripts/'+file,join(workspace,'scripts',file));
  for (const file of ['index.html','styles.css','app.js','records.js','favicon.svg','vercel.json']) await copyFile(file,join(workspace,file));
  const sample={id:'synthetic-build-only',sport:'NBA',selection:'Synthetic selection',market:'Synthetic market',odds:-110,publishedAt:'2026-11-01T12:00:00.000Z',eventAt:'2026-11-01T13:00:00.000Z',reasoning:'Synthetic test only',result:'pending',publicApproved:true,approvalReference:'synthetic-test'};
  await writeFile(join(workspace,'content/public-picks.json'),JSON.stringify([sample]));
  const held=runBuild();
  assert.notEqual(held.status,0);
  assert.match(held.stderr,/Public publication remains on hold/);
  await assert.rejects(readFile(join(workspace,'dist/index.html')), {code:'ENOENT'});
  await writeFile(join(workspace,'content/public-picks.json'),'[]');
  await mkdir(join(workspace,'dist'));
  await writeFile(join(workspace,'dist/unreviewed.txt'),'test sentinel');
  const stale=runBuild();
  assert.notEqual(stale.status,0);
  assert.match(stale.stderr,/Unexpected build output: unreviewed.txt/);
  assert.equal(await readFile(join(workspace,'dist/unreviewed.txt'),'utf8'),'test sentinel');
  await assert.rejects(readFile(join(workspace,'dist/index.html')), {code:'ENOENT'});
  await rm(join(workspace,'dist/unreviewed.txt'));
  await mkdir(join(workspace,'dist/styles.css'));
  const wrongType=runBuild();
  assert.notEqual(wrongType.status,0);
  assert.match(wrongType.stderr,/Unexpected build output: styles.css/);
  await rmdir(join(workspace,'dist/styles.css')); // Empty directory: recursive removal is unnecessary.
  const built=runBuild();
  assert.equal(built.status,0,built.stderr);
  assert.deepEqual((await readdir(join(workspace,'dist'))).sort(),['app.js','favicon.svg','index.html','records.js','styles.css']);
  assert.equal(await readFile(join(workspace,'dist/index.html'),'utf8'),await readFile('index.html','utf8'));
  assert.equal(await readFile('content/public-picks.json','utf8'),originalContent,'Tests must not modify real publication content');
} finally {
  // Only remove the exact temporary fixture created above.
  assert.equal(dirname(resolve(workspace)),resolve(tmpdir()));
  assert.match(basename(workspace),/^tfi-build-review-/);
  await rm(workspace,{recursive:true,force:true});
}
console.log('Passed isolated direct-build publication hold, stale-output rejection and exact clean output.');
