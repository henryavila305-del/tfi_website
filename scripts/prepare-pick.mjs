import { readFile, open, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { recordPick, gradePick } from './public-picks.mjs';

// Operator-only preparation. This command never commits, deploys, or contacts a service.
const [action,...args]=process.argv.slice(2);
const path='content/public-picks.json', lockPath=path+'.lock';
let lock;
try {
  lock=await open(lockPath,'wx');
  const ledger=JSON.parse(await readFile(path,'utf8'));
  let next;
  if (action==='record' && args.length===1) next=recordPick(ledger,JSON.parse(await readFile(args[0],'utf8')));
  else if (action==='grade' && args.length===3) next=gradePick(ledger,...args);
  else throw new Error('Usage: node scripts/prepare-pick.mjs record PRIVATE_DRAFT_PATH | grade PICK_ID RESULT "PUBLIC_REASON"');
  const temporary=path+'.'+randomUUID()+'.tmp';
  try { await open(temporary,'wx').then(async f=>{try{await f.writeFile(JSON.stringify(next,null,2)+'\n');}finally{await f.close();}}); await rename(temporary,path); }
  finally { await unlink(temporary).catch(()=>{}); }
  console.log('Public content prepared locally. Preview and review the change before release. Nothing was published.');
} catch (error) { console.error(error.message); process.exitCode=1; }
finally { if(lock){await lock.close();await unlink(lockPath);} }
