const recordPicker = document.querySelector('.record-picker');
const recordSelect = document.querySelector('#record-category');
const recordPanels = [...document.querySelectorAll('.record-panel')];
function showRecord() {
  for (const panel of recordPanels) panel.hidden = panel.id !== recordSelect.value;
}
showRecord();
recordPicker.hidden = false;
recordSelect.addEventListener('change', showRecord);
