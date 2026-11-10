export function parsePostUrl(input) {
  let url;
  try { url = new URL(String(input).trim()); } catch { throw new Error('Paste the full link copied from your X post.'); }
  const hosts = new Set(['x.com','www.x.com','twitter.com','www.twitter.com','mobile.twitter.com']);
  if (url.protocol !== 'https:' || !hosts.has(url.hostname.toLowerCase()) || url.username || url.password || url.port) throw new Error('Use an HTTPS link from x.com or twitter.com.');
  const match = url.pathname.match(/^\/thefavindex\/status\/([1-9]\d{5,24})(?:\/(?:photo|video)\/\d+)?\/?$/i);
  if (!match) throw new Error('Choose a public post from @thefavindex, not a profile or another account.');
  return {post_id:match[1],post_url:`https://x.com/thefavindex/status/${match[1]}`};
}

export async function timedFetch(url, options = {}, timeout = 12000) {
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeout);
  try { return await fetch(url, {...options,signal:control.signal}); }
  finally { clearTimeout(timer); }
}

export async function readSpotlight(config, token = null) {
  const headers = {apikey:config.key};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await timedFetch(`${config.url}/rest/v1/tfi_site_spotlight?slot=eq.${config.slot}&select=post_id,post_url,enabled,revision,updated_at`,{headers,cache:'no-store'});
  if (!response.ok) throw new Error('The saved post could not be loaded. Try again.');
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length > 1) throw new Error('Unexpected saved-post response.');
  if (!rows.length) return null;
  const row = rows[0], parsed = parsePostUrl(row.post_url);
  if (parsed.post_id !== row.post_id || typeof row.enabled !== 'boolean' || !Number.isSafeInteger(row.revision)) throw new Error('The saved post is invalid.');
  return row;
}

let widgetReady;
function loadWidgets() {
  if (window.twttr?.widgets?.createTweet) return Promise.resolve(window.twttr);
  if (!widgetReady) widgetReady = new Promise((resolve,reject) => {
    const timer = setTimeout(() => reject(new Error('X did not load.')),14000);
    const script = document.createElement('script');
    script.src = 'https://platform.x.com/widgets.js';
    script.async = true;
    script.onload = () => {clearTimeout(timer); window.twttr?.widgets?.createTweet ? resolve(window.twttr) : reject(new Error('X embeds are unavailable.'));};
    script.onerror = () => {clearTimeout(timer);reject(new Error('X embeds are blocked.'));};
    document.head.append(script);
  }).catch(error => {widgetReady = null;throw error;});
  return widgetReady;
}

export async function renderPost(container, input) {
  const post = parsePostUrl(input);
  container.replaceChildren();
  const message = document.createElement('p');
  message.className = 'post-note'; message.textContent = 'Loading the X post…';
  const target = document.createElement('div');
  const fallback = document.createElement('a');
  fallback.href = post.post_url; fallback.target='_blank'; fallback.rel='noopener noreferrer';
  fallback.className='text-link post-fallback';fallback.textContent='OPEN ORIGINAL POST ON X ↗';
  container.append(message,target,fallback);
  try {
    const x = await loadWidgets();
    if (!target.isConnected) return false;
    let timeout;
    const widget = await Promise.race([
      x.widgets.createTweet(post.post_id,target,{theme:'dark',dnt:true,conversation:'none',align:'center',width:550}),
      new Promise((_,reject) => { timeout=setTimeout(()=>reject(new Error('Post timed out.')),14000); })
    ]).finally(()=>clearTimeout(timeout));
    if (!widget) throw new Error('Post unavailable.');
    message.textContent='Original post from @thefavindex';
    return true;
  } catch {
    message.textContent='X could not display this post here. Open the original post below.';
    return false;
  }
}
