const CONFIG='https://tfi-live-tracker.vercel.app/api/config';
const DATABASE='https://tksgilnmlhkcxgawdlzu.supabase.co';
const CATEGORIES=new Set(['Top 3 #1','Top 3 #2','Top 3 #3']);
const SPORTS=new Set(['NFL','NBA','MLB','NHL','NCAAF','NCAAB','WNBA']);
export function easternDate(now=new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function validDate(value) {
  if(typeof value!=='string'||!/^20\d\d-\d\d-\d\d$/.test(value))return false;
  const date=new Date(value+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function publicKey(key) {
  if(typeof key!=='string'||key.length>4096)return false;
  if(/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))return true;
  try {const parts=key.split('.');return parts.length===3&&JSON.parse(Buffer.from(parts[1],'base64url').toString()).role==='anon';} catch{return false;}
}
async function json(response) {
  if(!response.ok)throw new Error('Feed unavailable');
  const reader=response.body?.getReader();
  if(!reader)throw new Error('Missing response body');
  let size=0;const chunks=[];
  try {for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>200000)throw new Error('Response too large');chunks.push(value);}}
  finally {await reader.cancel().catch(()=>{});}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function sanitizeRows(rows,date) {
  if(!Array.isArray(rows)||rows.length>100)throw new Error('Invalid feed');
  const ids=new Set();
  return rows.map(row=>{
    if(!row||typeof row!=='object'||!CATEGORIES.has(row.category)||!SPORTS.has(row.sport)||row.game_date!==date)throw new Error('Invalid public row');
    if(typeof row.id!=='string'||!/^[a-f0-9-]{36}$/i.test(row.id)||ids.has(row.id))throw new Error('Invalid public ID');ids.add(row.id);
    if(typeof row.selection!=='string'||!row.selection.trim()||row.selection.length>400)throw new Error('Invalid public selection');
    if(!Number.isInteger(row.odds)||Math.abs(row.odds)<100||Math.abs(row.odds)>100000)throw new Error('Invalid public odds');
    if(!['pending','win','loss','push','void'].includes(row.status))throw new Error('Invalid public result');
    // Project only these public fields; never forward database/config objects.
    return {id:row.id,sport:row.sport,category:row.category,selection:row.selection,odds:row.odds,eventDate:date,result:row.status};
  });
}
export async function readPublicFeed(date,{fetchImpl=fetch,now=()=>new Date()}={}) {
  if(!validDate(date))throw new Error('Invalid date');
  const signal=AbortSignal.timeout(12000);
  const options={method:'GET',redirect:'error',cache:'no-store',signal};
  const config=await json(await fetchImpl(CONFIG,options));
  if(config.supabaseUrl!==DATABASE||!publicKey(config.supabasePublishableKey))throw new Error('Invalid public configuration');
  const url=new URL('/rest/v1/tfi_public_feed',DATABASE);
  url.search=new URLSearchParams({select:'id,sport,category,selection,odds,game_date,status',game_date:`eq.${date}`,category:'in.("Top 3 #1","Top 3 #2","Top 3 #3")',order:'category.asc,id.asc',limit:'100'}).toString();
  const rows=await json(await fetchImpl(url.href,{...options,headers:{apikey:config.supabasePublishableKey}}));
  return {date,timezone:'America/New_York',retrievedAt:now().toISOString(),items:sanitizeRows(rows,date)};
}
