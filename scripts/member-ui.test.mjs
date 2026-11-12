import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=(await readFile(new URL('../members.mjs',import.meta.url),'utf8')).replace(/^import[^\n]+\n/,'');
const defer=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const reply=(status,data)=>({ok:status===200,status,json:async()=>data});
const active={tier:'Premium',categories:['Main Premium'],picks:[{
  id:'synthetic',category:'Main Premium',selection:'Synthetic selection',pick_team:'One',opponent:'Two',
  status:'pending',sport:'NBA',game_date:'2026-11-12',odds:-110
}]};
function harness(fetch) {
  const nodes=new Map(),events=new Map(),windowEvents=new Map();
  function make(tag='div',text='') {
    return {tag,hidden:false,textContent:text,children:[],dataset:{},handlers:{},value:'all',
      addEventListener(name,fn){this.handlers[name]=fn;},
      append(...values){this.children.push(...values);},
      replaceChildren(...values){this.children=values;},
      get options(){return this.children;},
      add(option){this.children.push(option);},
      querySelector(selector){return this.children.find(c=>'.'+c.className===selector);},
      querySelectorAll(selector){return this.children.filter(c=>'.'+c.className===selector);}
    };
  }
  const document={hidden:false,querySelector(selector){
    if(!nodes.has(selector))nodes.set(selector,make());return nodes.get(selector);
  },createElement:make,addEventListener(name,fn){events.set(name,fn);}};
  const window={location:{search:''},addEventListener(name,fn){windowEvents.set(name,fn);}};
  let timer;
  const context=vm.createContext({document,window,fetch,Option:function(text,value){this.textContent=text;this.value=value;},
    URLSearchParams,AbortSignal,Date,scoreForPick:()=>null,setInterval(fn){timer=fn;}});
  vm.runInContext(source+'\nglobalThis.controls={refresh,signOut};',context);
  return {nodes,document,events,windowEvents,timer,controls:context.controls};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('late successful pick response cannot restore content after sign-out',async()=>{
  const pending=defer();
  const h=harness(url=>url==='/api/member-logout'?Promise.resolve(reply(200,{ok:true})):pending.promise);
  await h.controls.signOut();
  pending.resolve(reply(200,active));
  await settle();
  assert.equal(h.nodes.get('#member-board').hidden,true);
  assert.equal(h.nodes.get('#member-cards').children.length,0);
  assert.equal(h.nodes.get('#member-message').textContent,'You are signed out.');
});
test('revoked membership removes visible picks and leaves sign-out available',async()=>{
  let revoked=false;
  const h=harness(async url=>url.startsWith('/api/scores')?reply(200,{events:[]}):
    revoked?reply(403,{state:'no_access',error:'Membership no longer active.'}):reply(200,active));
  await settle();
  assert.equal(h.nodes.get('#member-board').hidden,false);
  assert.equal(h.nodes.get('#member-cards').children.length,1);
  revoked=true;await h.controls.refresh();
  assert.equal(h.nodes.get('#member-cards').children.length,0);
  assert.equal(h.nodes.get('#member-board').hidden,true);
  assert.equal(h.nodes.get('#member-logout').hidden,false);
});
test('temporary failure clears previously authorized content',async()=>{
  let failure=false;
  const h=harness(async url=>{
    if(failure)throw Error('offline');
    return url.startsWith('/api/scores')?reply(200,{events:[]}):reply(200,active);
  });
  await settle();
  failure=true;await h.controls.refresh();
  assert.equal(h.nodes.get('#member-board').hidden,true);
  assert.equal(h.nodes.get('#member-cards').children.length,0);
  assert.match(h.nodes.get('#member-message').textContent,/temporarily unavailable/);
});
test('hiding and restoring the page requires fresh membership validation',async()=>{
  const next=defer();let checks=0;
  const h=harness(async url=>url.startsWith('/api/scores')?reply(200,{events:[]}):
    ++checks===1?reply(200,active):next.promise);
  await settle();
  h.document.hidden=true;h.events.get('visibilitychange')();
  assert.equal(h.nodes.get('#member-cards').children.length,0);
  h.document.hidden=false;h.events.get('visibilitychange')();
  assert.equal(h.nodes.get('#member-board').hidden,true);
  next.resolve(reply(401,{state:'signed_out',error:'Sign in again.'}));
  await settle();
  assert.equal(h.nodes.get('#member-board').hidden,true);
  assert.equal(h.nodes.get('#member-logout').hidden,true);
});
test('failed logout does not claim success and allows retry',async()=>{
  const h=harness(async url=>url==='/api/member-logout'?reply(503,{}):
    url.startsWith('/api/scores')?reply(200,{events:[]}):reply(200,active));
  await settle();await h.controls.signOut();
  assert.match(h.nodes.get('#member-message').textContent,/did not complete/);
  assert.equal(h.nodes.get('#member-logout').hidden,false);
  assert.equal(h.nodes.get('#member-cards').children.length,0);
});
test('empty active board keeps the categories included with the subscription',async()=>{
  const h=harness(async()=>reply(200,{tier:'All Access',categories:['Main Premium','NBA Premium'],picks:[]}));
  await settle();
  assert.equal(h.nodes.get('#member-board').hidden,false);
  assert.equal(h.nodes.get('#member-empty').hidden,false);
  assert.equal(h.nodes.get('#member-category').options.length,3);
});

