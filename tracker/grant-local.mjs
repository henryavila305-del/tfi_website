// Operator-only local beta access. Never exposed through HTTP or used as payment proof.
import { openStore } from './store.mjs';
import { fileURLToPath } from 'node:url';
const [handle,plan,days]=process.argv.slice(2);
if(!handle||!['tracker','all_access'].includes(plan)||!Number.isInteger(Number(days))||Number(days)<1||Number(days)>30)throw new Error('Usage: node tracker/grant-local.mjs HANDLE tracker|all_access DAYS (1–30)');
const store=openStore(fileURLToPath(new URL('../.tracker-data/beta.sqlite',import.meta.url)));
try{store.grant(handle,plan,Date.now()+Number(days)*86400000);console.log('Local beta access granted. No billing occurred.');}finally{store.close();}
