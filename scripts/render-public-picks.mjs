import { validatePublicPicks } from './public-picks.mjs';
const start = '<!-- public-picks:start -->';
const end = '<!-- public-picks:end -->';
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
export function renderPublicPicks(template, picks) {
  validatePublicPicks(picks);
  if (template.split(start).length !== 2 || template.split(end).length !== 2) throw new Error('Exactly one public-picks slot required');
  const from = template.indexOf(start) + start.length;
  const to = template.indexOf(end);
  if (to < from) throw new Error('Invalid public-picks slot order');
  const statusStart = '<!-- public-picks:status -->', statusEnd = '<!-- public-picks:status-end -->';
  if (template.split(statusStart).length !== 2 || template.split(statusEnd).length !== 2
    || template.indexOf(statusStart) > template.indexOf(statusEnd)) throw new Error('Exactly one ordered public-picks status slot required');
  const statusFromTemplate = template.indexOf(statusStart), statusToTemplate = template.indexOf(statusEnd) + statusEnd.length;
  if (!(statusToTemplate <= template.indexOf(start) || statusFromTemplate >= to + end.length)) throw new Error('Public-picks slots must not overlap');
  if (picks.length === 0) return template;
  const retained = template.slice(0, template.indexOf(start)) + template.slice(to + end.length);
  const retainedIds = new Set([...retained.matchAll(/\s+id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)].map(match => match[1] ?? match[2] ?? match[3]));
  for (const pick of picks) {
    if (retainedIds.has('public-pick-' + pick.id)) throw new Error('Public pick heading ID conflicts with the page: ' + pick.id);
  }
  const cards = picks.map(pick => {
    const text = key => escapeHtml(pick[key]);
    const odds = pick.odds > 0 ? '+' + pick.odds : String(pick.odds);
    return '<article class="public-pick" aria-labelledby="public-pick-' + text('id') + '"><h3 id="public-pick-' + text('id') + '">' + text('sport') + ' — ' + text('selection') + '</h3>'
      + '<dl><dt>Market</dt><dd>' + text('market') + '</dd><dt>American odds</dt><dd>' + odds + '</dd>'
      + '<dt>Published (UTC)</dt><dd><time datetime="' + text('publishedAt') + '">' + text('publishedAt') + '</time></dd>'
      + '<dt>Event (UTC)</dt><dd><time datetime="' + text('eventAt') + '">' + text('eventAt') + '</time></dd>'
      + '<dt>Result</dt><dd>' + text('result') + '</dd></dl><p>' + text('reasoning') + '</p></article>';
  }).join('\n');
  const populated = template.slice(0, from) + '\n' + cards + '\n' + template.slice(to);
  const statusFrom = populated.indexOf(statusStart) + statusStart.length;
  const statusTo = populated.indexOf(statusEnd);
  return populated.slice(0, statusFrom) + 'PUBLIC PICKS · ' + picks.length + populated.slice(statusTo);
}
