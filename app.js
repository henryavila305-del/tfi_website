const toggle = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
const mobile = window.matchMedia('(max-width: 720px)');
function syncMenu() {
  toggle.hidden = !mobile.matches;
  toggle.setAttribute('aria-expanded', 'false');
  navigation.hidden = mobile.matches;
}
syncMenu();
mobile.addEventListener('change', syncMenu);
toggle.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  navigation.hidden = expanded;
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a') && mobile.matches) syncMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobile.matches && !navigation.hidden) { syncMenu(); toggle.focus(); }
});
document.querySelectorAll('[data-sport]').forEach(link => {
  link.addEventListener('click', () => {
    const sport = link.dataset.sport;
    document.querySelector('#sport-title').textContent = `${sport} · Public board`;
    document.querySelector('#sport-description').textContent = `No ${sport} free picks or verified results have been published. This preview has no connected live feed. Check the public board for future approved releases.`;
    document.querySelector('#sport-detail').focus({ preventScroll: true });
  });
});
document.querySelector('#year').textContent = new Date().getFullYear();
