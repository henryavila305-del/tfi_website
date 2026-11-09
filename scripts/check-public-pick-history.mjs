// Read-only comparison. Explicit, distinct snapshot files are mandatory.
import { open, realpath } from 'node:fs/promises';
import { validatePublicPickTransition } from './public-picks.mjs';
const paths = process.argv.slice(2);
if (paths.length !== 2) throw new Error('Usage: node scripts/check-public-pick-history.mjs <trusted-prior.json> <candidate.json>');
const handles = [];
try {
  for (const path of paths) handles.push(await open(path, 'r'));
  const metadata = await Promise.all(handles.map(handle => handle.stat({bigint:true})));
  if (!metadata.every(info => info.isFile())) throw new Error('History snapshots must be regular files');
  const resolved = await Promise.all(paths.map(path => realpath(path)));
  const sameIdentity = metadata[0].ino !== 0n && metadata[0].dev === metadata[1].dev && metadata[0].ino === metadata[1].ino;
  if (resolved[0] === resolved[1] || sameIdentity) throw new Error('Trusted prior and candidate must be distinct snapshot files; self-comparison cannot verify retention');
  const [previous, candidate] = await Promise.all(handles.map(async handle => JSON.parse(await handle.readFile('utf8'))));
  validatePublicPickTransition(previous, candidate);
  console.log('Passed public-pick history retention against the supplied prior snapshot; no files changed.');
} finally {
  for (const handle of handles) await handle.close();
}
