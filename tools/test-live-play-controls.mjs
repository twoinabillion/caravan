import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { attachPlayControls } from './live-play-controls.mjs';

function fixture({ standalone = false, ready = true } = {}) {
  const listeners = {}, clicks = {}, messages = [], calls = [];
  let value = { busy: false, frozen: false, pendingRevision: null }, confirmed = false, resolveApply;
  const win = { document: { referrer: 'http://127.0.0.1:4317/' },
    parent: { postMessage: data => messages.push(data) },
    addEventListener: (name, fn) => listeners[name] = fn, removeEventListener() {},
    setInterval: () => 1, clearInterval() {}, confirm: () => confirmed };
  if (standalone) win.parent = win;
  const game = { contentWindow: { caravanLiveControls: { ready: () => ready, infinite: () => true, restart: () => calls.push('restart') } }, addEventListener() {} };
  const toolbar = { hidden: false };
  const badge = { addEventListener: (_, fn) => clicks.apply = fn };
  const restart = { addEventListener: (_, fn) => clicks.restart = fn };
  const controls = attachPlayControls({ win, game, toolbar, badge, restart, state: () => value,
    apply: () => { calls.push('apply'); return new Promise(resolve => resolveApply = resolve); }, report: (...args) => calls.push(args) });
  const send = (data, extra = {}) => listeners.message({ source: win.parent, origin: 'http://127.0.0.1:4317', data, ...extra });
  const connect = () => send({ type: 'live-game-studio:play-connect', session: 'test' });
  const command = (action, serial = 1, extra = {}) => send({ type: 'live-game-studio:play-command', session: 'test', action, serial, ...extra });
  return { win, controls, toolbar, restart, calls, messages, send, connect, command, clicks,
    set: next => { value = { ...value, ...next }; controls.publish(); }, confirm: () => confirmed = true, resolve: () => resolveApply() };
}

test('toolbar moves out only after an authenticated parent handshake', () => {
  const f = fixture();
  assert.equal(f.toolbar.hidden, false);
  f.send({ type: 'live-game-studio:play-connect', session: 'wrong' }, { source: {} });
  f.send({ type: 'live-game-studio:play-connect', session: 'wrong' }, { origin: 'https://wrong.example' });
  assert.equal(f.toolbar.hidden, false);
  f.connect();
  assert.equal(f.toolbar.hidden, true);
  assert.equal(f.messages.at(-1).state.canRestart, true);
  assert.equal(f.messages.at(-1).state.infinite, true);
});

test('commands require a session; apply rejects duplicate, stale and overlapping commands', async () => {
  const f = fixture();
  f.command('restart'); assert.deepEqual(f.calls, []);
  f.connect(); f.command('apply'); f.command('apply'); f.command('restart', 2);
  assert.deepEqual(f.calls, ['apply']);
  assert.equal(f.messages.at(-1).state.busy, true);
  f.resolve(); await new Promise(resolve => setImmediate(resolve));
  f.command('restart', 2); f.command('restart', 3, { session: 'old' });
  assert.deepEqual(f.calls, ['apply']);
  f.command('restart', 3);
  assert.equal(f.calls.filter(call => call === 'restart').length, 1);
});

test('frozen/building state and absent game disable restart and reject commands', () => {
  for (const locked of [{ frozen: true }, { busy: true }]) {
    const f = fixture(); f.connect(); f.set(locked); f.command('restart'); f.command('apply', 2);
    assert.equal(f.restart.disabled, true); assert.deepEqual(f.calls, []);
  }
  const f = fixture({ ready: false }); f.connect(); f.command('restart');
  assert.equal(f.restart.disabled, true); assert.deepEqual(f.calls, []);
});

test('standalone fallback is outside the game, cancellation is safe and restart requires confirmation', () => {
  const f = fixture({ standalone: true }); f.connect();
  assert.equal(f.toolbar.hidden, false);
  f.clicks.restart(); assert.deepEqual(f.calls, []);
  f.confirm(); f.clicks.restart();
  assert.equal(f.calls.filter(call => call === 'restart').length, 1);
});

const source = fs.readFileSync(new URL('./dev-live.mjs', import.meta.url), 'utf8');
test('latest-code apply saves/captures once and blocks an overlapping request', async () => {
  let capture = 0, resolveStatus;
  const game = { src: '' };
  const script = source.slice(source.indexOf('  const applyRefresh='), source.indexOf('  const applyStyles='));
  const ctx = vm.createContext({ game, applying: false, checking: false, studioFrozen: false, pendingRevision: null, applyWhenReady: false,
    captureView: () => capture++, show() {}, playControls: { publish() {} }, console,
    fetch: () => new Promise(resolve => resolveStatus = resolve) });
  vm.runInContext(script + '\nthis.apply=applyRefresh;',ctx);
  const first = ctx.apply(); await ctx.apply();
  assert.equal(capture, 0);
  resolveStatus({ ok: true, json: async () => ({ revision: 'new' }) }); await first;
  assert.equal(capture, 1); assert.equal(game.src, '/game?caravan-live=1&rev=new');
  await ctx.apply(); assert.equal(capture, 1);
});

test('failed status fetch leaves game intact; a frozen scene cannot apply', async () => {
  const script = source.slice(source.indexOf('  const applyRefresh='), source.indexOf('  const applyStyles='));
  const game = { src: 'current' }, messages = [];
  let requests = 0;
  const ctx = vm.createContext({ game, applying: false, checking: false, studioFrozen: false, pendingRevision: null,
    captureView: () => assert.fail('must not capture/reload'), show: (...args) => messages.push(args), hide() {},
    playControls: { publish() {} }, console: { warn() {} }, fetch: async () => { requests++; throw Error('offline'); } });
  vm.runInContext(script + '\nthis.apply=applyRefresh;',ctx);
  await ctx.apply(); assert.equal(game.src,'current'); assert.equal(ctx.checking,false);
  assert.equal(messages.at(-1)[1],true);
  ctx.studioFrozen = true; await ctx.apply(); assert.equal(requests,1);
});

test('generated shell JavaScript parses, and fallback controls are siblings before the only game iframe', () => {
  const start = source.indexOf('function gameShell(){');
  const end = source.indexOf('\nasync function imageFiles');
  const html = vm.runInNewContext(source.slice(start,end) + '\ngameShell()', { buildRevision: 42 });
  const js = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/import .*?;\n/, '');
  assert.doesNotThrow(() => new vm.Script(js));
  assert.equal((html.match(/<iframe /g) || []).length, 1);
  assert.ok(html.indexOf('</div>') < html.indexOf('<iframe'));
  assert.ok(!fs.readFileSync(new URL('../src/02-dom.html',import.meta.url),'utf8').includes('intro-test-shortcut'));
});

test('refresh saves the current journey, captures a supported panel, and restores without restarting', () => {
  let saves = 0, stored, opened = 0;
  const doc = { getElementById: id => ({ classList: { contains: () => id === 'ovl-status' } }),
    querySelector: s => s === '#status-prop' ? { dataset: { toolSurface: 'bag' } } : { scrollTop: 18 },
    querySelectorAll: () => [{ textContent: '가방', click: () => opened++ }] };
  const script = source.slice(source.indexOf('  const viewKey='), source.indexOf('  const studioVisible='));
  vm.runInNewContext(script + '\ncaptureView();restoreView()', {
    game: { contentDocument: doc, contentWindow: { caravanLiveControls: { save: () => saves++ } } },
    sessionStorage: { setItem: (_, value) => stored = value, getItem: () => stored }, setTimeout: fn => fn(), console,
  });
  assert.equal(saves, 1); assert.equal(opened, 1);
  assert.deepEqual(JSON.parse(stored).open, ['ovl-status']);
});
