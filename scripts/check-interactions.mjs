import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Exercise focus/state transitions without a browser. Browser observations are in QA.md.
const handlers = new Map();
const nodes = new Map();
const document = { activeElement: null };
function node(name) {
  const item = {
    hidden: false, textContent: '', dataset: {}, attributes: {},
    addEventListener(type, callback) { handlers.set(`${name}:${type}`, callback); },
    setAttribute(key, value) { this.attributes[key] = value; },
    getAttribute(key) { return this.attributes[key]; },
    focus() { document.activeElement = this; },
    contains(target) { return target === this || target === firstLink; },
    querySelector() { return firstLink; }
  };
  nodes.set(name, item);
  return item;
}
const toggle = node('.menu');
const navigation = node('#navigation');
const firstLink = node('first-link');
const picks = node('#picks');
const detail = node('#sport-detail');
node('#sport-title'); node('#sport-description'); node('#year');
const sport = node('sport'); sport.dataset.sport = 'NBA';
const mobile = { matches: true, addEventListener(type, callback) { handlers.set('resize', callback); } };
document.querySelector = selector => nodes.get(selector);
document.querySelectorAll = () => [sport];
document.addEventListener = (type, callback) => handlers.set(`document:${type}`, callback);
vm.runInNewContext(await readFile('app.js', 'utf8'), { document, window: { matchMedia: () => mobile }, Date });
assert.equal(navigation.hidden, true);
handlers.get('.menu:click')();
assert.equal(navigation.hidden, false);
assert.equal(toggle.getAttribute('aria-expanded'), 'true');
handlers.get('document:keydown')({ key: 'Escape' });
assert.equal(navigation.hidden, true);
assert.equal(document.activeElement, toggle);
mobile.matches = false; handlers.get('resize')();
assert.equal(document.activeElement, firstLink, 'Desktop resize must not leave focus on hidden Menu');
assert.equal(toggle.hidden, true);
mobile.matches = true; handlers.get('resize')();
assert.equal(document.activeElement, toggle, 'Mobile resize must not leave focus in hidden navigation');
handlers.get('.menu:click')();
handlers.get('#navigation:click')({ target: { closest: () => ({ getAttribute: () => '#picks' }) } });
assert.equal(document.activeElement, picks, 'Section selection must retain a visible focus destination');
assert.equal(navigation.hidden, true);
handlers.get('sport:click')();
assert.equal(document.activeElement, detail);
assert.match(nodes.get('#sport-title').textContent, /NBA/);
assert.match(nodes.get('#sport-description').textContent, /No NBA free picks or verified results/);
console.log('Passed simulated menu, Escape, breakpoint focus, section navigation, and sport status transitions.');
