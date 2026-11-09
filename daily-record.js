(() => {
  const panels=[...document.querySelectorAll('.record-panel')];
  const status=document.querySelector('#daily-record-status');if(panels.length!==4||!status)return;
  const originals=panels.map(p=>[...p.childNodes].map(n=>n.cloneNode(true)));
  const names=panels.map(p=>p.querySelector('h3').textContent);
  let busy=false;
  function node(tag,value){const n=document.createElement(tag);n.textContent=value;return n;}
  function svgElement(tag,attributes){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attributes))n.setAttribute(key,String(value));return n;}
  function draw(panel,record,i){
    const last=record.series.at(-1);
    panel.querySelector('.record-numbers strong').textContent=`${record.wins}–${record.losses}${record.pushes?'–'+record.pushes:''}`;
    panel.querySelector('.record-numbers span').textContent=`${record.winPercentage.toFixed(2)}% win rate`;
    panel.querySelector('.record-heading .note').textContent=`Latest included date: ${last.date} · ${record.pending} pending · ${record.voids} void · imported history + daily records`;
    const chart=panel.querySelector('svg');chart.replaceChildren();
    const title=svgElement('title',{id:`chart-title-${i}`});title.textContent=names[i]+' cumulative win percentage';chart.append(title);
    const desc=svgElement('desc',{id:`chart-desc-${i}`});desc.textContent='Imported baseline plus daily records from November 8. Dates between the imported cutoff and daily start are excluded. Full values in the table below.';chart.append(desc);
    for(const [y,label]of [[30,100],[120,50],[210,0]]){chart.append(svgElement('path',{d:`M50 ${y}H750`,stroke:'#343e32'}));const t=svgElement('text',{x:40,y:y+4,'text-anchor':'end'});t.textContent=label+'%';chart.append(t);}
    const start=Date.parse(record.series[0].date+'T12:00:00Z'),end=Date.parse(last.date+'T12:00:00Z'),span=Math.max(1,end-start);
    const points=record.series.filter(p=>p.wins+p.losses).map(p=>`${50+700*(Date.parse(p.date+'T12:00:00Z')-start)/span},${210-180*p.wins/(p.wins+p.losses)}`).join(' ');
    chart.append(svgElement('polyline',{points,fill:'none',stroke:'#c0ff59','stroke-width':3,'vector-effect':'non-scaling-stroke'}));
    for(const [x,date,anchor]of [[50,record.series[0].date,'start'],[750,last.date,'end']]){const t=svgElement('text',{x,y:245,'text-anchor':anchor});t.textContent=date;chart.append(t);}
    const body=panel.querySelector('tbody');body.replaceChildren();
    for(const p of record.series){const tr=document.createElement('tr');const date=node('th',p.date);date.scope='row';tr.append(date,...[p.wins,p.losses,p.pushes,(100*p.wins/(p.wins+p.losses)).toFixed(2)+'%'].map(v=>node('td',v)));body.append(tr);}
  }
  async function update(){
    if(busy||document.hidden)return;busy=true;
    try{
      const response=await fetch('/api/public-record',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(18000)});if(!response.ok)throw Error();const data=await response.json();
      if(data.version!==1||data.timezone!=='America/New_York'||data.records?.length!==4||!Number.isFinite(Date.parse(data.computedAt))||Math.abs(Date.now()-Date.parse(data.computedAt))>300000)throw Error();
      for(let i=0;i<4;i++){const r=data.records[i];if(r.key!==['top3','premium','dog','play'][i]||!Array.isArray(r.series)||!r.series.length||r.series.length>2000||typeof r.winPercentage!=='number')throw Error();}
      data.records.forEach((r,i)=>draw(panels[i],r,i));
      const checked=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(data.computedAt));
      status.textContent=`Daily records checked ${checked}. Imported baselines have different cutoff dates; the gaps before November 8 are excluded. Pending and void picks do not count as wins or losses. Category records overlap and must not be added together.`;
    }catch{panels.forEach((p,i)=>p.replaceChildren(...originals[i].map(n=>n.cloneNode(true))));status.textContent='Daily updates are unavailable or not enabled. The graphs show only the imported historical records and their original cutoff dates; today’s reported card has not been added automatically.';}
    finally{busy=false;}
  }
  setInterval(update,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});update();
})();
