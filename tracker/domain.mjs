export const PLANS = Object.freeze({ tracker: 1999, all_access: 3599 });
export function fail(status, message) { throw Object.assign(new Error(message), { status }); }
export function text(value, name, max = 160) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, `Invalid ${name}`);
  return value.trim();
}
export function oddsToDecimal(value, format) {
  const n = Number(value);
  if (!Number.isFinite(n)) fail(400, 'Invalid odds');
  if (format === 'american') {
    if (Math.abs(n) < 100 || Math.abs(n) > 100000 || !Number.isInteger(n)) fail(400, 'American odds must be integers of +100 or greater, or -100 or lower');
    return n > 0 ? 1 + n / 100 : 1 + 100 / -n;
  }
  if (format !== 'decimal' || n <= 1 || n > 1001) fail(400, 'Decimal odds must be greater than 1 and at most 1001');
  return n;
}
export function validatePick(input, now) {
  const sport = text(input.sport, 'sport', 8);
  if (!['NFL','NBA','MLB','NHL','NCAAF','NCAAB','OTHER'].includes(sport)) fail(400, 'Invalid sport');
  if (!['private','public'].includes(input.visibility)) fail(400, 'Choose private or public');
  const starts = Date.parse(input.startsAt);
  if (!Number.isFinite(starts)) fail(400, 'Invalid event start');
  if (starts > now + 366 * 86400000) fail(400, 'Event must start within one year');
  if (input.visibility === 'public' && starts <= now) fail(400, 'Public picks must be published before the event starts');
  const stake = Number(input.stake);
  if (!Number.isFinite(stake) || stake < .01 || stake > 10000 || Math.abs(stake * 100 - Math.round(stake * 100)) > .000001) fail(400, 'Stake must be 0.01–10000 units, at most two decimal places');
  return { sport, event: text(input.event,'event'), market: text(input.market,'market'), selection: text(input.selection,'selection'), decimalOdds: oddsToDecimal(input.odds, input.oddsFormat), stake, startsAt: new Date(starts).toISOString(), visibility: input.visibility, late: starts <= now };
}
export function profit(p) {
  if (p.result === 'win') return p.stake * (p.decimalOdds - 1);
  if (p.result === 'loss') return -p.stake;
  return 0;
}
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
export function summarize(picks) {
  const settled = picks.filter(p => ['win','loss','push'].includes(p.result));
  const wins = settled.filter(p=>p.result==='win').length;
  const losses = settled.filter(p=>p.result==='loss').length;
  const risked = settled.reduce((n,p)=>n+p.stake,0);
  const net = settled.reduce((n,p)=>n+profit(p),0);
  let running = 0;
  const curve = [...settled].sort((a,b)=>a.settledAt.localeCompare(b.settledAt)||a.id.localeCompare(b.id)).map(p=>({ at:p.settledAt, units:round(running += profit(p)) }));
  return { wins, losses, pushes:settled.length-wins-losses, pending:picks.filter(p=>p.result==='pending').length, voids:picks.filter(p=>p.result==='void').length, netUnits:round(net), riskedUnits:round(risked), roi:risked ? round(net/risked*100) : null, winPercentage:wins+losses ? round(wins/(wins+losses)*100) : null, curve };
}
