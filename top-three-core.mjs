export function latestCard(rows) {
  if (!Array.isArray(rows)) throw new Error('Invalid public feed');
  const valid = rows.filter(p => /^Top 3 #[123]$/.test(p.category) && /^\d{4}-\d{2}-\d{2}$/.test(p.game_date) && typeof p.pick_team === 'string' && typeof p.opponent === 'string' && /^(moneyline|ml)$/i.test(p.bet_type) && Number.isInteger(p.odds) && Math.abs(p.odds)>=100 && ['pending','win','loss','push','void'].includes(p.status));
  const date = valid.map(p=>p.game_date).sort().at(-1);
  if (!date) return null;
  const picks = valid.filter(p=>p.game_date===date);
  if (new Set(picks.map(p=>p.category)).size!==picks.length) throw new Error('Duplicate ranks');
  return {date,picks:[3,2,1].map(rank=>picks.find(p=>p.category===`Top 3 #${rank}`)||null)};
}
export function cardSummary(picks) {
  const wins=picks.filter(p=>p?.status==='win').length;
  const losses=picks.filter(p=>p?.status==='loss').length;
  const pushes=picks.filter(p=>p?.status==='push').length;
  const complete=picks.every(p=>p && p.status!=='pending');
  return {complete,text:complete ? `${wins}–${losses}${pushes?`–${pushes}`:''}${wins===3?' SWEEP.':' FINAL.'}` : `${wins}–${losses} · IN PROGRESS`};
}
