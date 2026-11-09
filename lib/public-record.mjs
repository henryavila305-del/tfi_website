const KEYS=['top3','premium','dog','play'];
export function validatePublicRecord(data) {
  if(data?.version!==1||data.timezone!=='America/New_York'||!Number.isFinite(Date.parse(data.computedAt))||!Array.isArray(data.records)||data.records.length!==4)throw Error('Invalid public record');
  const records=data.records.map((r,i)=>{
    if(r.key!==KEYS[i]||r.baselineThrough!==['2026-11-01','2026-11-01','2026-10-13','2026-10-30'][i]||r.dailyTrackingFrom!=='2026-11-08'||r.coverageGapExcluded!==true||!Array.isArray(r.series)||r.series.length<1||r.series.length>2000)throw Error('Invalid category');
    for(const key of ['wins','losses','pushes','pending','voids'])if(!Number.isSafeInteger(r[key])||r[key]<0)throw Error('Invalid count');
    let previous='',last={wins:0,losses:0,pushes:0};
    const series=r.series.map(p=>{
      if(typeof p.date!=='string'||!/^20\d\d-\d\d-\d\d$/.test(p.date)||new Date(p.date+'T12:00:00Z').toISOString().slice(0,10)!==p.date||p.date<=previous)throw Error('Invalid series date');
      for(const key of ['wins','losses','pushes'])if(!Number.isSafeInteger(p[key])||p[key]<last[key])throw Error('Invalid cumulative series');
      previous=p.date;last=p;return {date:p.date,wins:p.wins,losses:p.losses,pushes:p.pushes};
    });
    for(const key of ['wins','losses','pushes'])if(r[key]!==last[key])throw Error('Inconsistent totals');
    const percentage=r.wins+r.losses?100*r.wins/(r.wins+r.losses):null;
    if(typeof r.winPercentage!=='number'||!Number.isFinite(r.winPercentage)||Math.abs(r.winPercentage-percentage)>1e-9)throw Error('Inconsistent rate');
    return {key:r.key,baselineThrough:r.baselineThrough,dailyTrackingFrom:r.dailyTrackingFrom,coverageGapExcluded:true,wins:r.wins,losses:r.losses,pushes:r.pushes,pending:r.pending,voids:r.voids,winPercentage:percentage,series};
  });
  // Reconstruct a minimal aggregate response. Never forward extra upstream fields.
  return {version:1,timezone:'America/New_York',computedAt:data.computedAt,records};
}
export async function readPublicRecord(fetchImpl=fetch) {
  const response=await fetchImpl('https://tfi-live-tracker.vercel.app/api/public-records',{method:'GET',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Record unavailable');
  const reader=response.body?.getReader();if(!reader)throw Error('Missing body');const chunks=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>500000)throw Error('Response too large');chunks.push(value);}}
  finally{await reader.cancel().catch(()=>{});}
  return validatePublicRecord(JSON.parse(Buffer.concat(chunks).toString('utf8')));
}
