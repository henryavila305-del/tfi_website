(() => {
  const root=document.querySelector('#connected-feed');if(!root)return;
  const dateInput=root.querySelector('input');const refresh=root.querySelector('button');
  const status=root.querySelector('[role="status"]');const list=root.querySelector('.feed-items');
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
  dateInput.value=`${parts.year}-${parts.month}-${parts.day}`;
  const allowed=new Set(['Top 3 #1','Top 3 #2','Top 3 #3']);
  let pending=false;
  function text(tag,value){const node=document.createElement(tag);node.textContent=value;return node;}
  async function update(){
    if(pending||document.hidden)return;
    pending=true;refresh.disabled=true;dateInput.disabled=true;
    // Clear previously retrieved rows rather than show them as current on failure.
    list.replaceChildren();status.textContent='Checking public results…';
    const selected=dateInput.value;
    try {
      const response=await fetch(`/api/public-feed?date=${encodeURIComponent(selected)}`,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error();
      const data=await response.json();
      if(data.date!==selected||data.timezone!=='America/New_York'||!Array.isArray(data.items)||data.items.length>100||!Number.isFinite(Date.parse(data.retrievedAt)))throw new Error();
      const cards=data.items.map(p=>{
        if(!allowed.has(p.category)||p.eventDate!==selected||typeof p.selection!=='string'||p.selection.length>400||!Number.isInteger(p.odds)||!['pending','win','loss','push','void'].includes(p.result))throw new Error();
        const card=document.createElement('article');card.className='public-pick';
        card.append(text('p',`${p.sport} / ${p.category}`),text('h4',p.selection),text('p',`${p.odds>0?'+':''}${p.odds} American odds`),text('p',p.result==='pending'?'Pending — final grading not available':`Recorded result: ${p.result}`));
        return card;
      });
      list.replaceChildren(...cards);
      const checked=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(new Date(data.retrievedAt));
      status.textContent=(cards.length?'Public feed checked':'No connected public picks for this date')+` · ${selected} · Checked ${checked}.`;
    }catch{list.replaceChildren();status.textContent='Public feed unavailable. Dated reported cards below are separate snapshots; they have not been automatically updated.';}
    finally{pending=false;refresh.disabled=false;dateInput.disabled=false;}
  }
  refresh.addEventListener('click',update);dateInput.addEventListener('change',update);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
  setInterval(update,60000);update();
})();
