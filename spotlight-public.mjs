import {config} from './spotlight-config.mjs';
import {readSpotlight,renderPost} from './spotlight-core.mjs';
const art=document.querySelector('.cashed-art');
let current=null, busy=false;
async function refresh() {
  if (busy || document.hidden) return;
  busy=true;
  try {
    const row=await readSpotlight(config);
    const key=row?.enabled?row.post_id:null;
    if (key===current) return;
    current=key;
    if (!key) {location.reload(); return;}
    let host=document.querySelector('#featured-x-post');
    if (!host) {host=document.createElement('div');host.id='featured-x-post';host.className='featured-x-post';art.hidden=true;art.before(host);}
    document.querySelector('#cashed .status').textContent='FEATURED X POST';
    document.querySelector('.cashed-story>p:not(.eyebrow)').textContent='The featured results post from @thefavindex. Explore the full record for wins, losses and category history.';
    const full=document.querySelector('.cashed-story .text-link');
    full.href=row.post_url;full.textContent='OPEN ORIGINAL POST ON X ↗';
    await renderPost(host,row.post_url);
  } catch { /* Keep the last rendered post or archive graphic when the feed is unavailable. */ }
  finally {busy=false;}
}
refresh();
setInterval(refresh,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
