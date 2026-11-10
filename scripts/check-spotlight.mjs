import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parsePostUrl,readSpotlight} from '../spotlight-core.mjs';
const id='1234567890123456789';
for(const input of [`https://x.com/thefavindex/status/${id}?s=46&t=share`,`https://twitter.com/TheFavIndex/status/${id}`,`https://x.com/thefavindex/status/${id}/photo/1`]) assert.deepEqual(parsePostUrl(input),{post_id:id,post_url:`https://x.com/thefavindex/status/${id}`});
for(const input of ['javascript:alert(1)','http://x.com/thefavindex/status/'+id,'https://x.com.evil.test/thefavindex/status/'+id,'https://x.com@evil.test/thefavindex/status/'+id,'https://x.com/other/status/'+id,'https://x.com/thefavindex','https://x.com/thefavindex/status/1e20','https://x.com/thefavindex/status/'+id+'/untrusted','https://user:secret@x.com/thefavindex/status/'+id]) assert.throws(()=>parsePostUrl(input),input);
const cfg={url:'https://example.test',key:'public',slot:'cashed_preview'};
const original=globalThis.fetch;
try {
 globalThis.fetch=async()=>({ok:true,json:async()=>[]});assert.equal(await readSpotlight(cfg),null);
 globalThis.fetch=async()=>({ok:true,json:async()=>[{post_id:id,post_url:`https://x.com/thefavindex/status/${id}`,enabled:true,revision:1}]});assert.equal((await readSpotlight(cfg)).post_id,id);
 globalThis.fetch=async()=>({ok:true,json:async()=>[{post_id:'999999',post_url:`https://x.com/thefavindex/status/${id}`,enabled:true,revision:1}]});await assert.rejects(()=>readSpotlight(cfg));
 globalThis.fetch=async()=>({ok:false});await assert.rejects(()=>readSpotlight(cfg));
}finally{globalThis.fetch=original;}
const source=await readFile('post-admin.mjs','utf8');
assert(!/localStorage|sessionStorage|innerHTML/.test(source),'Credentials and tokens are not persisted or inserted into HTML');
assert(source.includes('&revision=eq.'),'Saving must detect stale edits');
console.log('Passed post URL normalization, hostile URL rejection, unavailable and malformed feeds, and save boundaries.');
