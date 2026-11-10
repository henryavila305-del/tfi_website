export const sports=Object.freeze({NBA:'basketball/nba',NHL:'hockey/nhl',NFL:'football/nfl',MLB:'baseball/mlb',NCAAF:'football/college-football',NCAAB:'basketball/mens-college-basketball'});
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
function matches(team,name){return [team.displayName,team.shortDisplayName,team.name,team.abbreviation].some(x=>x&&normalize(x)===normalize(name));}
export function scoreForPick(pick,events){
 const found=events.filter(e=>{const c=e.competitions?.[0]?.competitors||[];return c.length===2&&c.some(t=>matches(t.team||{},pick.pick_team))&&c.some(t=>matches(t.team||{},pick.opponent))&&(!pick.espn_event_id||String(e.id)===String(pick.espn_event_id));});
 if(found.length!==1)return null;
 const e=found[0],c=e.competitions[0].competitors,s=e.status||e.competitions[0].status||{},state=s.type?.state;
 const team=c.find(t=>matches(t.team||{},pick.pick_team)),opp=c.find(t=>matches(t.team||{},pick.opponent));
 if(!team||!opp||team===opp)return null;
 const score=x=>typeof x==='string'&&/^\d+$/.test(x)?Number(x):Number.isInteger(x)&&x>=0?x:null;
 return {state,completed:s.type?.completed===true,detail:s.type?.shortDetail||s.type?.detail||s.type?.description||'Status unavailable',clock:s.displayClock||'',period:s.period||0,start:e.date,team:pick.pick_team,opponent:pick.opponent,teamScore:state==='pre'?null:score(team.score),opponentScore:state==='pre'?null:score(opp.score)};
}
