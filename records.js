const recordPicker = document.querySelector('.record-picker');
const recordSelect = document.querySelector('#record-category');
const recordPanels = [...document.querySelectorAll('.record-panel')];
function showRecord() {
  for (const panel of recordPanels) panel.hidden = panel.id !== recordSelect.value;
}
showRecord();
recordPicker.hidden = false;
recordSelect.addEventListener('change', showRecord);


// Optional read-only audited aggregate overlay. No private selections are fetched.
// Historical tables/charts remain untouched; on any failure keep the imported baseline.
async function loadAuditedRecordOverlay() {
  try {
    const response = await fetch('./verified-records.json', { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) return;
    const snapshot = await response.json();
    const { safePublicRecordSnapshot } = await import('./daily-card/public-record-adapter.mjs');
    const records = safePublicRecordSnapshot(snapshot);
    for (const panel of recordPanels) {
      const name = panel.querySelector('.record-heading h3')?.textContent?.trim();
      const current = records[name];
      if (!current) continue;
      const heading = panel.querySelector('.record-numbers strong');
      const rate = panel.querySelector('.record-numbers span');
      if (heading) heading.textContent = current.wins + '–' + current.losses;
      if (rate) rate.replaceChildren(document.createTextNode(current.winRate + '% '), Object.assign(document.createElement('small'), {textContent:'win rate'}));
      const note = panel.querySelector('.record-heading .note');
      if (note) note.textContent = 'Verified aggregate through ' + snapshot.throughDate + ' · historical chart/table below through 2026-11-08';
    }
  } catch {
    // Missing or invalid snapshot: preserve the existing published historical display.
  }
}
if (typeof fetch === 'function') void loadAuditedRecordOverlay();
