import { sports } from '../live-score-core.mjs';

const maxAge = 48 * 60 * 60 * 1000;

async function latestHeadline([league, sport], now) {
  const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/news?limit=8`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('ESPN news unavailable');
  const { articles } = await response.json();
  if (!Array.isArray(articles)) throw new Error('Invalid ESPN news response');

  return articles
    .filter(article => article.type === 'HeadlineNews' && typeof article.headline === 'string')
    .map(article => ({
      league,
      headline: article.headline.replace(/\s+/g, ' ').trim(),
      published: Date.parse(article.published),
    }))
    .filter(item => item.headline && item.headline.length <= 220 && item.published <= now && item.published >= now - maxAge)
    .sort((a, b) => b.published - a.published)[0];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = Date.now();
  const results = await Promise.allSettled(Object.entries(sports).map(sport => latestHeadline(sport, now)));
  if (results.every(result => result.status === 'rejected')) {
    return res.status(503).json({ error: 'Headlines temporarily unavailable' });
  }

  const seen = new Set();
  const headlines = results.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : [])
    .sort((a, b) => b.published - a.published)
    .filter(({ headline }) => {
      const key = headline.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ league, headline }) => ({ league, headline }));

  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
  return res.status(200).json({ headlines });
}
