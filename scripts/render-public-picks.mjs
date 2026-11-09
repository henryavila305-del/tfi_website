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
  if (picks.length === 0) return template;
  const cards = picks.map(pick => {
    const text = key => escapeHtml(pick[key]);
    const odds = pick.odds > 0 ? '+' + pick.odds : String(pick.odds);
    return '<article class="public-pick"><h3>' + text('sport') + ' — ' + text('selection') + '</h3>'
      + '<dl><dt>Market</dt><dd>' + text('market') + '</dd><dt>American odds</dt><dd>' + odds + '</dd>'
      + '<dt>Published (UTC)</dt><dd><time datetime="' + text('publishedAt') + '">' + text('publishedAt') + '</time></dd>'
      + '<dt>Event (UTC)</dt><dd><time datetime="' + text('eventAt') + '">' + text('eventAt') + '</time></dd>'
      + '<dt>Result</dt><dd>' + text('result') + '</dd></dl><p>' + text('reasoning') + '</p></article>';
  }).join('\n');
  return template.slice(0, from) + '\n' + cards + '\n' + template.slice(to);
}
