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
const sportLabels = [
  ['', 'All Sports'], ['NFL', 'NFL'], ['NBA', 'NBA'], ['NHL', 'NHL'],
  ['NCAAF', 'College Football'], ['NCAAB', 'College Basketball'], ['MLB', 'MLB'],
];
const sections = [['in', 'Live now'], ['pre', 'Upcoming'], ['post', 'Final'], ['other', 'Other game statuses']];
const clock = document.querySelector('#scoreboard-date');
const controls = document.querySelector('.scoreboard-controls');
const status = document.querySelector('#scoreboard-status');
const board = document.querySelector('#scoreboard-games');
const feeds = new Map();
const pageUrl = new URL(location.href);
const broadcast = pageUrl.searchParams.get('view') === 'broadcast';
const requestedSport = pageUrl.searchParams.get('sport')?.toUpperCase();
const selectedSport = leagues.includes(requestedSport) ? requestedSport : '';
const selectedLeagues = selectedSport ? [selectedSport] : leagues;
const gamesPerPage = 6;
let broadcastPage = 0;
let broadcastPageCount = 1;
let broadcastState = '';
let refreshing = false;
let previousScores = new Map();
if (broadcast) document.body.classList.add('score-broadcast');

if (selectedSport) {
  const title = sportLabels.find(([sport]) => sport === selectedSport)[1] + ' Live Scores';
  document.querySelector('.score-title').textContent = title;
  document.title = title + ' | The Favorite Index';
}

if (!broadcast) {
  const navigation = element('nav');
  navigation.setAttribute('aria-label', 'Scores by sport');
  Object.assign(navigation.style, { display: 'flex', flexWrap: 'wrap', gap: '8px' });
  for (const [sport, label] of sportLabels) {
    const url = new URL(pageUrl);
    if (sport) url.searchParams.set('sport', sport.toLowerCase());
    else url.searchParams.delete('sport');
    const link = element('a', label, 'button small outline');
    link.href = url.href;
    if (sport === selectedSport) {
      link.setAttribute('aria-current', 'page');
      Object.assign(link.style, { background: '#baff19', color: '#101610', borderColor: '#baff19' });
    }
    navigation.append(link);
  }
  controls.querySelector('label').replaceWith(navigation);

  const broadcastLink = controls.querySelector('a[href*="view=broadcast"]');
  const broadcastUrl = new URL(pageUrl);
  broadcastUrl.searchParams.set('view', 'broadcast');
  broadcastLink.href = broadcastUrl.href;
}

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function gameCard(sport, game, state, increases) {
  const card = element('li', '', 'scoreboard-game');
  card.dataset.state = state;
  const gameStatus = game.status ?? game.competitions[0].status;
  const detail = gameStatus?.type?.shortDetail || gameStatus?.type?.description || gameStatus?.displayClock;
  const start = displayTime.format(new Date(game.date)) + ' CT';
  const scheduled = state === 'pre';
  const header = element('div', '', 'score-game-status');
  header.append(element('b', sport), element('span', scheduled ? start : detail || start));
  card.append(header);
  const teams = game.competitions[0].competitors;
  for (const team of [...teams].sort((a, b) => Number(a.homeAway === 'home') - Number(b.homeAway === 'home'))) {
    const row = element('div', '', 'scoreboard-team');
    const tag = element('span', team.team?.abbreviation || (team.homeAway === 'home' ? 'HOME' : 'AWAY'), 'score-team-tag');
    tag.setAttribute('aria-hidden', 'true');
    row.append(tag, element('span', team.team?.displayName || team.team?.name || 'Team TBD', 'score-team-name'));
    if (broadcast && team.team?.logo) {
      const logo = element('img', '', 'score-team-logo');
      logo.alt = '';
      logo.hidden = true;
      logo.addEventListener('load', () => {
        tag.hidden = true;
        logo.hidden = false;
      }, { once: true });
      row.prepend(logo);
      logo.src = team.team.logo;
    }
    if (state !== 'pre' && /^\d+$/.test(String(team.score))) {
      const score = element('strong', String(team.score));
      if (increases.has(sport + ':' + game.id + ':' + team.homeAway)) score.classList.add('score-just-updated');
      row.append(score);
    }
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
  const missing = new Set();
  const timestamps = [];
  for (const [key, feed] of feeds) {
    const [sport] = key.split(':');
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

  const increases = new Set();
  if (broadcast) {
    const currentScores = new Map();
    for (const [id, { game, state, updatedAt }] of games) {
      if (state !== 'in' && state !== 'pre') continue;
      for (const team of game.competitions[0].competitors) {
        if (team.homeAway !== 'home' && team.homeAway !== 'away') continue;
        const key = id + ':' + team.homeAway;
        const previous = previousScores.get(key);
        if (!/^\d+$/.test(String(team.score)) || (previous && updatedAt <= previous.updatedAt)) {
          if (previous) currentScores.set(key, previous);
          continue;
        }
        const score = Number(team.score);
        if (state === 'in' && previous && score > previous.score) increases.add(key);
        currentScores.set(key, { score, updatedAt });
      }
    }
    previousScores = currentScores;
  }
  const allGames = [...games.values()];
  const groups = sections.map(([state, label]) => ({
    state, label,
    matches: allGames.filter(game => game.state === state)
      .sort((a, b) => Date.parse(a.game.date) - Date.parse(b.game.date)),
  }));
  const noGamesToday = selectedSport && !allGames.length && !missing.size && timestamps.length;
  let visibleGroups = groups.filter(group => group.matches.length || group.state === 'in');
  if (broadcast) {
    const mode = groups[0].matches.length ? 'live' : 'schedule';
    if (mode !== broadcastState) {
      broadcastState = mode;
      broadcastPage = 0;
    }
    const activeGroups = mode === 'live' ? [groups[0]] : groups.filter(group => group.matches.length);
    const pages = activeGroups.flatMap(group =>
      Array.from({ length: Math.ceil(group.matches.length / gamesPerPage) }, (_, page) => ({
        ...group,
        matches: group.matches.slice(page * gamesPerPage, (page + 1) * gamesPerPage),
      })));
    broadcastPageCount = Math.max(1, pages.length);
    broadcastPage %= broadcastPageCount;
    visibleGroups = [pages[broadcastPage] ?? groups[0]];
  }
  const fragment = document.createDocumentFragment();
  for (const { state, label, matches } of visibleGroups) {
    const section = element('section', '', 'scoreboard-group');
    const pageLabel = broadcast && broadcastPageCount > 1 ? ' · ' + (broadcastPage + 1) + ' / ' + broadcastPageCount : '';
    section.append(element('h2', label + pageLabel));
    if (matches.length) {
      const list = element('ul', '', 'scoreboard-grid');
      for (const { sport, game } of matches) list.append(gameCard(sport, game, state, increases));
      section.append(list);
    } else {
      section.append(element('p', missing.size ? 'No live games in the available scores.' : noGamesToday ? 'No games scheduled today.' : 'No games live right now.'));
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
    const keys = selectedLeagues.flatMap(sport => dateKeys.map(date => [sport, date]));
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

function startTicker(selector, endpoint, upcomingOnly = false) {
  const ticker = document.querySelector(selector);
  if (!ticker) return;
  const track = ticker.querySelector('.score-headlines-track');
  const button = ticker.querySelector('button');
  let previous = '';
  let lastSuccess = 0;

  button.addEventListener('click', () => {
    const paused = ticker.classList.toggle('is-paused');
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'Resume' : 'Pause';
  });

  function renderItems(headlines) {
    const incoming = JSON.stringify(headlines);
    if (incoming === previous) {
      ticker.hidden = !headlines.length;
      return;
    }
    previous = incoming;
    ticker.hidden = !headlines.length;
    if (!headlines.length) {
      track.replaceChildren();
      return;
    }
    const strip = element('ul', '', 'score-headlines-strip');
    let characters = 0;
    for (const { headline, league } of headlines) {
      const item = element('li');
      item.append(element('b', league), document.createTextNode(headline));
      strip.append(item);
      characters += headline.length + league.length + 8;
    }
    if (headlines.length === 1) {
      track.replaceChildren(strip);
    } else {
      const copy = strip.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.replaceChildren(strip, copy);
      track.style.setProperty('--headlines-duration', Math.max(24, characters / 14) + 's');
    }
  }

  let items = [];
  let expiryTimer;
  function renderUpcoming() {
    clearTimeout(expiryTimer);
    items = items.filter(item => item.startsAt > Date.now());
    renderItems(items);
    if (items.length) {
      const nextStart = Math.min(...items.map(item => item.startsAt));
      expiryTimer = setTimeout(renderUpcoming, Math.max(1, nextStart - Date.now()));
    }
  }

  async function refreshItems() {
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Ticker data unavailable');
      const { headlines } = await response.json();
      if (!Array.isArray(headlines)) throw new Error('Invalid ticker data');
      lastSuccess = Date.now();
      items = headlines;
      if (upcomingOnly) renderUpcoming();
      else renderItems(items);
    } catch {
      if (upcomingOnly) {
        items = [];
        renderUpcoming();
      } else if (Date.now() - lastSuccess > 30 * 60 * 1000) ticker.hidden = true;
    }
  }

  refreshItems();
  setInterval(refreshItems, upcomingOnly ? 2 * 60 * 1000 : 5 * 60 * 1000);
}

refresh();
setInterval(refresh, 10000);
if (broadcast) {
  startTicker('#score-headlines', '/api/headlines');
  startTicker('#score-player-props', '/api/player-props', true);
  setInterval(() => {
    if (document.hidden || broadcastPageCount < 2) return;
    broadcastPage = (broadcastPage + 1) % broadcastPageCount;
    render();
  }, 12000);
}
document.addEventListener('visibilitychange', refresh);
