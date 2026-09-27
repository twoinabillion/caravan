const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../tools/dev-live.mjs'), 'utf8');
const handler = source.slice(source.indexOf("  window.addEventListener('message',event=>{"), source.indexOf("  window.addEventListener('beforeunload',captureView);"));

test('a screen with absent optional panels still reports the scene and applied revisions', () => {
  const doc = { querySelector: (s) => s === '#app' ? { dataset: { screen: 'game' } } : null,
    getElementById: () => null, querySelectorAll: () => [], activeElement: null, title: 'Test game' };
  const win = { eval: () => '{"day":3}', location: { href: 'http://127.0.0.1:4318/game?rev=build-1' }, innerWidth: 390, innerHeight: 700 };
  const collectSource = source.slice(source.indexOf('  const studioVisible='), source.indexOf('  const setStudioFrozen='));
  const result = vm.runInNewContext(`${collectSource}\ncompactStudioContext()`, {
    game: { contentDocument: doc, contentWindow: win }, window: { location: { href: 'http://127.0.0.1:4318/' } },
    studioFrozen: false, pendingRevision: 'build-3', styleRevision: 'build-2', applying: false, URL,
  });
  assert.equal(result.screen, 'game');
  assert.equal(result.game.day, 3);
  assert.equal(result.live.loadedRevision, 'build-1');
  assert.equal(result.live.styleRevision, 'build-2');
  assert.equal(result.live.pendingRevision, 'build-3');
  assert.equal(result.surfaces.length, 0);
});

test('Studio can read the current scene without pausing, resuming or changing gameplay', () => {
  let receive; const replies = []; const mutations = [];
  const parent = { postMessage: (message, origin) => replies.push({ message, origin }) };
  const context = { screen: 'game', game: { day: 3 }, frozen: false };
  vm.runInNewContext(handler, {
    window: { addEventListener: (_, fn) => { receive = fn; } }, parent,
    compactStudioContext: () => context, setStudioFrozen: (value) => mutations.push(value),
    setTimeout: (fn) => fn(),
  });
  receive({ source: {}, origin: 'http://127.0.0.1:4317', data: { type: 'live-game-studio:context', requestId: 'wrong' } });
  assert.equal(replies.length, 0);
  receive({ source: parent, origin: 'http://127.0.0.1:4317', data: { type: 'live-game-studio:context', requestId: 'request-1' } });
  assert.equal(replies.length, 1);
  assert.equal(replies[0].message.type, 'live-game-studio:context');
  assert.equal(replies[0].message.requestId, 'request-1');
  assert.equal(replies[0].message.context.game.day, 3);
  assert.equal(replies[0].origin, 'http://127.0.0.1:4317');
  assert.deepEqual(mutations, []);
  context.frozen = true;
  receive({ source: parent, origin: 'http://127.0.0.1:4317', data: { type: 'live-game-studio:context', requestId: 'request-2' } });
  assert.equal(replies[1].message.context.frozen, true);
  assert.deepEqual(mutations, []);
});
