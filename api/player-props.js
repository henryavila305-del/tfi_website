import { sports } from '../live-score-core.mjs';

const source = 'https://dknetwork.draftkings.com/draftkings-sportsbook-player-props/';
const leagues = { NFL: source, NBA: source + '?tb_edate=today&tb_eg=42648&tb_view=2', NHL: source + '?tb_edate=today&tb_eg=42133&tb_view=2' };
const easternDate = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: '2-digit', day: '2-digit' });
const centralTime = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' });
const entities = { amp: '&', apos: "'", quot: '"', nbsp: ' ', minus: '−', rsquo: '’', lsquo: '‘', ndash: '–', mdash: '—', lt: '<', gt: '>' };

function cellText(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (all, name) => {
    if (!name.startsWith('#')) return entities[name.toLowerCase()] ?? all;
    const point = name.toLowerCase().startsWith('#x') ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1));
    return point <= 0x10ffff ? String.fromCodePoint(point) : all;
  }).replace(/\s+/g, ' ').trim();
}

const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function matchesTeam(side, team) {
  return [team?.displayName, team?.shortDisplayName, team?.name].filter(Boolean)
    .some(name => normalize(side).endsWith(normalize(name)));
}

export function upcomingProps(html, events, league, now) {
  const date = easternDate.format(now);
  const games = events.filter(event => {
    const type = event.status?.type;
    const startsAt = Date.parse(event.date);
    return startsAt > now && easternDate.format(startsAt) === date
      && type?.state === 'pre' && (!type.name || type.name === 'STATUS_SCHEDULED');
  });
  for (const [, table] of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    const rows = Array.from(table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi), ([, row]) =>
      Array.from(row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi), ([, cell]) => cellText(cell)));
    const header = rows.findIndex(row => row.join('|').toLowerCase() === 'event|event date|market|betslip line|odds');
    if (header === -1) continue;
    const props = [];
    const seen = new Set();
    for (const [event, eventDate, market, line, rawOdds] of rows.slice(header + 1)) {
      const sides = event?.split(/\s+@\s+/);
      const odds = rawOdds?.replace('−', '-');
      if (sides?.length !== 2 || !eventDate?.startsWith(date + ',') || !market || !line || !/^[+-]\d{2,5}$/.test(odds ?? '')) continue;
      const matching = games.filter(game => {
        const teams = game.competitions?.[0]?.competitors ?? [];
        return matchesTeam(sides[0], teams.find(team => team.homeAway === 'away')?.team)
          && matchesTeam(sides[1], teams.find(team => team.homeAway === 'home')?.team);
      });
      if (matching.length !== 1) continue;
      const [game] = matching;
      const key = [game.id, market, line].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const startsAt = Date.parse(game.date);
      props.push({ league, startsAt, headline: [market, line, odds, event, centralTime.format(startsAt) + ' CT'].join(' · ') });
      if (props.length === 3) break;
    }
    return props;
  }
  throw new Error('Ranked props table unavailable');
}

async function leagueProps(league, page, now) {
  const [month, day] = easternDate.format(now).split('/');
  const year = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' }).format(now);
  const date = year + month + day;
  const signal = AbortSignal.timeout(6000);
  const [rankings, schedule] = await Promise.all([
    fetch(page, { signal }),
    fetch('https://site.api.espn.com/apis/site/v2/sports/' + sports[league] + '/scoreboard?dates=' + date, { signal }),
  ]);
  if (!rankings.ok || !schedule.ok) throw new Error('Source unavailable');
  const [html, { events }] = await Promise.all([rankings.text(), schedule.json()]);
  if (!Array.isArray(events)) throw new Error('Schedule unavailable');
  return upcomingProps(html, events, league, now);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = Date.now();
  const results = await Promise.allSettled(Object.entries(leagues).map(([league, page]) => leagueProps(league, page, now)));
  if (results.every(result => result.status === 'rejected')) {
    return res.status(503).json({ error: 'Player props temporarily unavailable' });
  }
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  return res.status(200).json({ headlines: results.flatMap(result => result.status === 'fulfilled' ? result.value : []) });
}
