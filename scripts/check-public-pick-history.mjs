// Read-only comparison. Explicit paths are mandatory; never invent an empty baseline.
import { readFile } from 'node:fs/promises';
import { validatePublicPickTransition } from './public-picks.mjs';
const paths = process.argv.slice(2);
if (paths.length !== 2) throw new Error('Usage: node scripts/check-public-pick-history.mjs <trusted-prior.json> <candidate.json>');
const [previous, candidate] = await Promise.all(paths.map(async path => JSON.parse(await readFile(path, 'utf8'))));
validatePublicPickTransition(previous, candidate);
console.log('Passed public-pick history retention against the supplied prior snapshot; no files changed.');
