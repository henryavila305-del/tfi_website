
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
    requireValue(Object.keys(pick).sort().join('|') === [...fields, ...(pick.result === 'withdrawn' ? withdrawalFields : []), ...(Object.hasOwn(pick, 'corrections') ? ['corrections'] : [])].sort().join('|'), 'Unexpected or missing public fields');
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
    if (Object.hasOwn(pick, 'corrections')) {
      requireValue(Array.isArray(pick.corrections) && pick.corrections.length > 0 && pick.corrections.length <= 100, 'Use 1 to 100 correction records');
      const values = {odds:pick.odds, result:pick.result};
      let previousTime = Date.parse(pick.publishedAt);
      for (const correction of pick.corrections) {
        requireValue(correction && typeof correction === 'object' && !Array.isArray(correction), 'Correction must be an object');
        requireValue(Object.keys(correction).sort().join('|') === ['field','from','to','correctedAt','reason','publicApproved','approvalReference'].sort().join('|'), 'Unexpected or missing correction fields');
        requireValue(['odds','result'].includes(correction.field), 'Unsupported correction field');
        for (const key of ['reason','approvalReference']) {
          requireValue(typeof correction[key] === 'string' && correction[key].trim().length > 0 && correction[key].length <= 2000 && !/[<>\u0000-\u001f]/.test(correction[key]), 'Unsafe or missing correction ' + key);
        }
        requireValue(correction.publicApproved === true, 'Explicit correction approval required');
        requireValue(timestamp(correction.correctedAt) && Date.parse(correction.correctedAt) >= previousTime, 'Corrections must use ordered canonical UTC times at or after publication');
        previousTime = Date.parse(correction.correctedAt);
        requireValue(correction.from === values[correction.field] && correction.from !== correction.to, 'Correction must continue the recorded value chain and change the value');
        if (correction.field === 'odds') {
          requireValue(Number.isInteger(correction.to) && Math.abs(correction.to) >= 100 && Math.abs(correction.to) <= 100000, 'Use finite corrected American odds');
        } else {
          requireValue(pick.result !== 'withdrawn' && ['pending','win','loss','push','void'].includes(correction.to), 'Invalid grade correction; withdrawal uses its own approval record');
          requireValue(Date.parse(correction.correctedAt) >= Date.parse(pick.eventAt), 'Grade corrections cannot precede the event');
        }
        values[correction.field] = correction.to;
      }
    }
  }
  return picks;
}

// Derive the displayed grade without mutating the originally recorded result or odds.
export function effectivePublicResult(pick) {
  return (pick.corrections ?? []).filter(correction => correction.field === 'result').reduce((result, correction) => correction.to, pick.result);
}

// Counts reflect validated public records only; historical aggregates remain separate.
export function summarizePublicPicks(picks) {
  validatePublicPicks(picks);
  const wins = picks.filter(pick => effectivePublicResult(pick) === 'win').length;
  const losses = picks.filter(pick => effectivePublicResult(pick) === 'loss').length;
  return { wins, losses, winPercentage: wins + losses ? 100 * wins / (wins + losses) : null };
}


// Caller must supply a trusted prior snapshot. This validates retention, not baseline authenticity.
export function validatePublicPickTransition(previous, candidate) {
  validatePublicPicks(previous);
  validatePublicPicks(candidate);
  const nextById = new Map(candidate.map(pick => [pick.id, pick]));
  for (const prior of previous) {
    const next = nextById.get(prior.id);
    requireValue(next, 'Previously recorded pick cannot be deleted or renamed: ' + prior.id);
    for (const key of [...fields, ...(prior.result === 'withdrawn' ? withdrawalFields : [])]) {
      requireValue(next[key] === prior[key], 'Original public field cannot be rewritten: ' + prior.id + ' / ' + key);
    }
    const history = prior.corrections ?? [];
    const nextHistory = next.corrections ?? [];
    requireValue(nextHistory.length >= history.length, 'Prior corrections cannot be deleted: ' + prior.id);
    for (let index = 0; index < history.length; index++) {
      for (const key of Object.keys(history[index])) {
        requireValue(nextHistory[index][key] === history[index][key], 'Prior correction cannot be rewritten or reordered: ' + prior.id + ' / ' + index + ' / ' + key);
      }
    }
  }
  return candidate;
}
