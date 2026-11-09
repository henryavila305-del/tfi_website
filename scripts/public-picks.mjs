
const fields = ['id','sport','selection','market','odds','publishedAt','eventAt','reasoning','result','publicApproved','approvalReference'];
const withdrawalFields = ['withdrawalReason','withdrawnAt','withdrawalApproved','withdrawalApprovalReference'];
const sports = ['NFL','NBA','MLB','NHL','NCAAF','NCAAB'];
function requireValue(condition, message) { if (!condition) throw new Error(message); }
function timestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
export function validatePublicPicks(picks) {
  requireValue(Array.isArray(picks), 'Public picks must be an array');
  const ids = new Set();
  for (const pick of picks) {
    requireValue(pick && typeof pick === 'object' && !Array.isArray(pick), 'Each pick must be an object');
    requireValue(Object.keys(pick).sort().join('|') === [...fields, ...(pick.result === 'withdrawn' ? withdrawalFields : [])].sort().join('|'), 'Unexpected or missing public fields');
    for (const key of ['id','selection','market','reasoning','approvalReference', ...(pick.result === 'withdrawn' ? ['withdrawalReason','withdrawalApprovalReference'] : [])]) {
      requireValue(typeof pick[key] === 'string' && pick[key].trim().length > 0 && pick[key].length <= 2000, 'Missing or oversized ' + key);
      requireValue(!/[<>\u0000-\u001f]/.test(pick[key]), 'Unsafe text in ' + key);
    }
    requireValue(/^[a-z0-9-]{1,80}$/.test(pick.id) && !ids.has(pick.id), 'Invalid or duplicate ID');
    ids.add(pick.id);
    requireValue(sports.includes(pick.sport), 'Unsupported sport');
    requireValue(Number.isInteger(pick.odds) && Math.abs(pick.odds) >= 100 && Math.abs(pick.odds) <= 100000, 'Use finite American odds');
    requireValue(timestamp(pick.publishedAt) && timestamp(pick.eventAt), 'Use valid canonical UTC timestamps');
    requireValue(Date.parse(pick.publishedAt) < Date.parse(pick.eventAt), 'Publication must precede event');
    requireValue(pick.publicApproved === true, 'Explicit public approval required');
    if (pick.result === 'withdrawn') {
      requireValue(pick.withdrawalApproved === true, 'Explicit withdrawal approval required');
      requireValue(timestamp(pick.withdrawnAt), 'Use valid canonical UTC withdrawal time');
      requireValue(Date.parse(pick.withdrawnAt) >= Date.parse(pick.publishedAt), 'Withdrawal cannot precede publication');
    }
    requireValue(['pending','win','loss','push','void','withdrawn'].includes(pick.result), 'Invalid result');
  }
  return picks;
}

// Counts reflect validated public records only; historical aggregates remain separate.
export function summarizePublicPicks(picks) {
  validatePublicPicks(picks);
  const wins = picks.filter(pick => pick.result === 'win').length;
  const losses = picks.filter(pick => pick.result === 'loss').length;
  return { wins, losses, winPercentage: wins + losses ? 100 * wins / (wins + losses) : null };
}
