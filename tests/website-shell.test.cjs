const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../code/js/site.js'), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replace(/init\(\);\s*$/, '');

function element() {
  const attrs = new Map();
  const classes = new Set();
  const events = new Map();
  return {
    hidden: false, src: '/artwork',
    classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
    setAttribute: (k, v) => attrs.set(k, v),
    getAttribute: k => attrs.get(k),
    removeAttribute: k => attrs.delete(k),
    addEventListener: (name, fn) => events.set(name, fn),
    fire: name => events.get(name)?.()
  };
}

function fixture() {
  const nodes = Object.fromEntries(['frame', 'iframe', 'loader', 'error', 'reload'].map(k => [k, element()]));
  const timers = new Map();
  let id = 0;
  const context = vm.createContext({
    window: {
      setTimeout: (fn, delay) => { timers.set(++id, {fn, delay}); return id; },
      clearTimeout: timer => timers.delete(timer)
    },
    document: {}
  });
  vm.runInContext(source, context);
  const selectors = {'[data-artwork-frame]':'frame', '[data-artwork-iframe]':'iframe', '[data-artwork-loader]':'loader', '[data-artwork-error]':'error', '[data-reload-artwork]':'reload'};
  context.setupArtworkFrame({querySelector: s => nodes[selectors[s]]}, 'HARM');
  function tick(delay) {
    for (const [key, timer] of [...timers]) if (timer.delay === delay) {
      timers.delete(key); timer.fn();
    }
  }
  return {nodes, timers, tick};
}

test('a timed-out artwork can retry, load, and retry again', () => {
  const {nodes: n, tick, timers} = fixture();
  tick(18000);
  assert.equal(n.error.hidden, false);
  n.reload.fire('click');
  assert.equal(n.error.hidden, true);
  assert.equal(n.frame.getAttribute('aria-busy'), 'true');
  n.iframe.fire('load');
  tick(450);
  assert.equal(n.loader.hidden, true);
  assert.equal(n.frame.classList.contains('is-loaded'), true);
  assert.equal(timers.size, 0);
  n.reload.fire('click');
  tick(18000);
  assert.equal(n.error.hidden, false);
  n.iframe.fire('load');
  assert.equal(n.error.hidden, true);
  assert.equal(n.frame.getAttribute('aria-busy'), 'false');
});

test('retry clears the previous delayed loader dismissal', () => {
  const {nodes: n, tick} = fixture();
  n.iframe.fire('load');
  n.reload.fire('click');
  tick(450);
  assert.equal(n.loader.hidden, false);
  assert.equal(n.frame.classList.contains('is-loaded'), false);
});

test('an iframe error exposes retry and a late success removes the error', () => {
  const {nodes: n} = fixture();
  n.iframe.fire('error');
  assert.equal(n.error.hidden, false);
  assert.equal(n.loader.hidden, true);
  n.iframe.fire('load');
  assert.equal(n.error.hidden, true);
});

test('reduced motion and missing observer support never hide content', () => {
  for (const reduce of [false, true]) {
    const card = element();
    const context = vm.createContext({document: {querySelectorAll: () => [card]}, window: {matchMedia: () => ({matches: reduce})}});
    vm.runInContext(source, context);
    context.setupReveal();
    assert.equal(card.classList.contains('reveal-pending'), false);
  }
});
