import {config} from './spotlight-config.mjs';
import {parsePostUrl,timedFetch,readSpotlight,renderPost} from './spotlight-core.mjs';
const $=id=>document.getElementById(id);
let token=null,expiresAt=0,current=null,previewed=null,busy=false;
const say=text=>{$('message').textContent=text;};
function lock(){token=null;expiresAt=0;previewed=null;$('post-editor').hidden=true;$('post-login').hidden=false;$('post-preview').replaceChildren();$('post-url').value='';}
function headers(){return {apikey:config.key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'};}
function requireSession(){if(!token || Date.now()>=expiresAt){lock();throw new Error('Your session expired. Sign in again.');}}
async function loadCurrent(){current=await readSpotlight(config,token);$('current-post').textContent=current?.enabled?'Currently featured: '+current.post_url:'Currently showing the archive graphic.';if(current)$('post-url').value=current.post_url;}
function controls(disabled){$('post-url').disabled=disabled;for(const id of ['preview-post','save-post','show-archive','sign-out'])$(id).disabled=disabled; if(!disabled)$('save-post').disabled=!previewed;}
$('post-login').addEventListener('submit',async event=>{
 event.preventDefault();$('sign-in').disabled=true;say('Signing in…');
 try{
  const response=await timedFetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})});
  $('password').value='';const data=await response.json();
  if(!response.ok || !data.access_token || !data.user?.id)throw new Error('Sign-in failed. Check your TFI administrator credentials.');
  token=data.access_token;expiresAt=Date.now()+(data.expires_in||3600)*1000;
  const admin=await timedFetch(config.url+'/rest/v1/tfi_admins?select=user_id&user_id=eq.'+encodeURIComponent(data.user.id),{headers:headers(),cache:'no-store'});
  const rows=await admin.json();
  if(!admin.ok || !Array.isArray(rows) || rows.length!==1)throw new Error('This account is not a TFI administrator.');
  await loadCurrent();$('post-login').hidden=true;$('post-editor').hidden=false;say('Paste a public results post, preview it, then save.');
 }catch(error){lock();say(error.name==='AbortError'?'Connection timed out. Try signing in again.':error.message);}finally{$('password').value='';$('sign-in').disabled=false;}
});
$('post-url').addEventListener('input',()=>{previewed=null;$('save-post').disabled=true;});
$('preview-post').addEventListener('click',async()=>{
 if(busy)return;
 try{requireSession();const post=parsePostUrl($('post-url').value);previewed=null;busy=true;controls(true);say('Loading your selected post…');const shown=await renderPost($('post-preview'),post.post_url);
  const now=parsePostUrl($('post-url').value);if(now.post_id!==post.post_id)throw new Error('The link changed. Preview the new link before saving.');
  previewed=post;say(shown?'Check this is your intended results post, then save.':'X could not embed it here. Check the original-post link before saving.');
 }catch(error){say(error.message);}finally{busy=false;controls(false);}
});
async function save(payload){
 requireSession();
 const endpoint=config.url+'/rest/v1/tfi_site_spotlight';
 const isUpdate=!!current;
 const query=isUpdate?'?slot=eq.'+config.slot+'&revision=eq.'+current.revision:'';
 const body=isUpdate?payload:{slot:config.slot,...payload};
 const response=await timedFetch(endpoint+query,{method:isUpdate?'PATCH':'POST',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify(body)});
 if(response.status===401){lock();throw new Error('Your session expired. Sign in again.');}
 if(response.status===409){await loadCurrent();throw new Error('Another window changed the featured post. Review it and try again.');}
 if(!response.ok)throw new Error('Post was not saved. Your account may lack access. Try again.');
 const rows=await response.json();
 if(!Array.isArray(rows)||rows.length!==1){await loadCurrent();throw new Error('The saved post changed in another window. Review it and try again.');}
 current=await readSpotlight(config,token);
 if(!current || current.enabled!==payload.enabled || current.post_url!==payload.post_url)throw new Error('Save could not be verified. Refresh before trying again.');
 $('current-post').textContent=current.enabled?'Currently featured: '+current.post_url:'Currently showing the archive graphic.';
}
$('post-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 try{requireSession();const post=parsePostUrl($('post-url').value);if(!previewed||previewed.post_id!==post.post_id)throw new Error('Preview this link before saving.');busy=true;controls(true);say('Saving…');await save({...post,enabled:true});say('Saved. The Cashed window now uses this X post. Open pages refresh within one minute.');}
 catch(error){say(error.name==='AbortError'?'Save timed out. Reload to check the current post before trying again.':error.message);previewed=null;}
 finally{busy=false;controls(false);}
});
$('show-archive').addEventListener('click',async()=>{
 if(busy)return;
 try{requireSession();if(!current){say('The archive graphic is already showing.');return;}busy=true;controls(true);await save({post_id:current.post_id,post_url:current.post_url,enabled:false});say('Archive graphic restored. The previous post link is retained.');}
 catch(error){say(error.message);}finally{busy=false;controls(false);}
});
$('sign-out').addEventListener('click',async()=>{const access=token;lock();say('Signed out.');if(access)try{await timedFetch(config.url+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:config.key,Authorization:`Bearer ${access}`}});}catch{}});
window.addEventListener('pagehide',()=>{token=null;});
