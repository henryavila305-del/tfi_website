import { sports } from './live-score-core.mjs';

const zone = 'America/Chicago';
const dayFormat = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
const hourFormat = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', hourCycle: 'h23' });

function centralDate(date) {
  const parts = Object.fromEntries(dayFormat.formatToParts(date).map(({ type, value }) => [type, value]));
  return [parts.year, parts.month, parts.day].join('-');
}
const displayDate = new Intl.DateTimeFormat('en-US', { timeZone: zone, dateStyle: 'full' });
const displayTime = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeStyle: 'short' });
const leagues = Object.keys(sports);
const sections = [['in', 'Live now'], ['pre', 'Upcoming'], ['post', 'Final'], ['other', 'Other game statuses']];
const clock = document.querySelector('#scoreboard-date');
const league = document.querySelector('#scoreboard-league');
const status = document.querySelector('#scoreboard-status');
const board = document.querySelector('#scoreboard-games');
const feeds = new Map();
let refreshing = false;

for (const sport of leagues) league.add(new Option(sport, sport));
league.disabled = false;
league.addEventListener('change', render);

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function gameCard(sport, game, state) {
  const card = element('li', '', 'scoreboard-game');
  card.dataset.state = state;
  const gameStatus = game.status ?? game.competitions[0].status;
  const detail = gameStatus?.type?.shortDetail || gameStatus?.type?.description || gameStatus?.displayClock;
  const start = displayTime.format(new Date(game.date)) + ' CT';
  const scheduled = state === 'pre';
  card.append(element('p', sport + ' · ' + (scheduled ? start : detail || start)));
  const teams = game.competitions[0].competitors;
  for (const team of [...teams].sort((a, b) => Number(a.homeAway === 'home') - Number(b.homeAway === 'home'))) {
    const row = element('div', '', 'scoreboard-team');
    row.append(element('span', team.team?.displayName || team.team?.name || 'Team TBD'));
    if (state !== 'pre' && /^\d+$/.test(String(team.score))) row.append(element('strong', String(team.score)));
    card.append(row);
  }
  return card;
}

function render() {
  const now = new Date();
  const today = centralDate(now);
  clock.dateTime = today;
  clock.textContent = displayDate.format(now);
  const games = new Map();
  const selected = league.value ? [league.value] : leagues;
  const missing = new Set();
  const timestamps = [];
  for (const [key, feed] of feeds) {
    const [sport] = key.split(':');
    if (!selected.includes(sport)) continue;
    if (feed.failed) missing.add(sport);
    if (feed.updatedAt) timestamps.push(Date.parse(feed.updatedAt));
    for (const game of feed.events ?? []) {
      const date = new Date(game.date);
      if (!Number.isFinite(date.valueOf()) || !Array.isArray(game.competitions?.[0]?.competitors)) continue;
      const type = (game.status ?? game.competitions[0].status)?.type;
      const state = type?.state === 'in' ? 'in' : type?.completed ? 'post'
        : type?.name === 'STATUS_SCHEDULED' || (type?.state === 'pre' && !type.name) ? 'pre' : 'other';
      if (centralDate(date) !== today && state !== 'in') continue;
      const id = sport + ':' + game.id;
      const previous = games.get(id);
      if (!previous || Date.parse(feed.updatedAt) >= previous.updatedAt) {
        games.set(id, { sport, game, state, updatedAt: Date.parse(feed.updatedAt) });
      }
    }
  }

  const fragment = document.createDocumentFragment();
  for (const [state, label] of sections) {
    const matches = [...games.values()].filter(game => game.state === state);
    if (!matches.length && state !== 'in') continue;
    const section = element('section', '', 'scoreboard-group');
    section.append(element('h2', label));
    if (matches.length) {
      const list = element('ul', '', 'scoreboard-grid');
      matches.sort((a, b) => Date.parse(a.game.date) - Date.parse(b.game.date));
      for (const { sport, game } of matches) list.append(gameCard(sport, game, state));
      section.append(list);
    } else {
      section.append(element('p', missing.size ? 'No live games in the available scores.' : 'No games live right now.'));
    }
    fragment.append(section);
  }
  board.replaceChildren(fragment);
  const validTimes = timestamps.filter(Number.isFinite);
  const updated = validTimes.length ? 'Scores checked at ' + displayTime.format(Math.min(...validTimes)) + ' CT.' : '';
  const unavailable = missing.size ? 'Updates unavailable for ' + [...missing].join(', ') + '. Any displayed scores for those leagues may be delayed.' : '';
  const message = [updated, unavailable].filter(Boolean).join(' ') || 'Loading scores…';
  if (status.textContent !== message) status.textContent = message;
}

async function refresh() {
  if (refreshing || document.hidden) return;
  refreshing = true;
  try {
    const now = new Date();
    const centralDay = centralDate(now);
    const midnight = Date.parse(centralDay + 'T00:00:00Z');
    const dateKeys = [centralDay];
    const hour = Number(hourFormat.format(now));
    if (hour < 6) dateKeys.unshift(new Date(midnight - 86400000).toISOString().slice(0, 10));
    if (hour >= 23) dateKeys.push(new Date(midnight + 86400000).toISOString().slice(0, 10));
    const keys = leagues.flatMap(sport => dateKeys.map(date => [sport, date]));
    await Promise.all(keys.map(async ([sport, date]) => {
      const key = sport + ':' + date;
      try {
        const response = await fetch('/api/scores?' + new URLSearchParams({ sport, date, coverage: 'full' }), { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Scores unavailable');
        const data = await response.json();
        if (!Array.isArray(data.events) || !Number.isFinite(Date.parse(data.updatedAt))) throw new Error('Invalid response');
        feeds.set(key, data);
      } catch {
        feeds.set(key, { ...feeds.get(key), failed: true });
      }
    }));
    const current = new Set(keys.map(parts => parts.join(':')));
    for (const key of feeds.keys()) if (!current.has(key)) feeds.delete(key);
    render();
  } finally {
    refreshing = false;
  }
}

refresh();
setInterval(refresh, 10000);
document.addEventListener('visibilitychange', refresh);
