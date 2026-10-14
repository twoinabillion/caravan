const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'qa-first-hour.py'), 'utf8');

test('first-hour runner requires explicit isolated finite-resource URL and output', () => {
  assert.match(source, /p\.add_argument\('--url', required=True\)/);
  assert.match(source, /p\.add_argument\('--output', required=True\)/);
  assert.match(source, /browser\.new_context\(/);
  assert.match(source, /'rev' not in query and 'infinite-resources' not in query/);
  assert.match(source, /assert not s\['infinite'\]/);
  assert.match(source, /exist_ok=False/);
});

test('camp checks payment persistence, cancellation, exact morning, and next departure', () => {
  for (const token of ["'camp test requires earned checkpoint'", "'cancel-camp'", "'paid-camp-preparation'",
    "'camp-next-morning'", "'no next departure after camp'", "wake['min'] == 390", ".is_disabled()"])
    assert.ok(source.includes(token), token);
});

test('playthrough neither grants progress nor accelerates or skips reading', () => {
  for (const token of ['G.tick(', 'G.newGame(', 'G.applyFx(', 'G.seedOverride', 'UI.skipIntro(',
    'UI.finishStory(', 'UI.restoreQaView(', 'G.pickOutcome(', 'G.save()', 'G.trade(', 'G.explore(']) {
    assert.ok(!source.includes(token), token);
  }
  assert.ok(!/\bS\.[\w$]+\s*=/.test(source));
  assert.match(source, /'humanPlaytest': False/);
  assert.match(source, /'clockAccelerated': False/);
  assert.match(source, /'resourcesGranted': False/);
});

test('checks actual next controls, cancel costs, reload, and movement with fuel use', () => {
  for (const token of ['story has no next control', 'travel stalled', "page.keyboard.press('Escape')",
    "reload_stopped('yangsan-arrival')", "reload_stopped('miryang-arrival')",
    "initial['resources']['fuel'] > observe()['resources']['fuel']", 'resource_delta(before, after)']) {
    assert.ok(source.includes(token), token);
  }
  assert.match(source, /'choiceCount', 'usedCount'/);
  assert.match(source, /set\(before\['flags'\]\)\.issubset\(after\['flags'\]\)/);
  assert.match(source, /set\(after\['flags'\]\)-set\(before\['flags'\]\) <= \{'recruit_migration_v2'\}/);
});
