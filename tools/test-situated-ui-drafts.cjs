const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const root = path.resolve(__dirname, '..');
const dir = path.join(__dirname, 'design-drafts');
const names = ['situated-talk', 'situated-record', 'situated-cabin'];
const pages = Object.fromEntries(names.map(name => [name, fs.readFileSync(path.join(dir, name + '.html'), 'utf8')]));
const css = fs.readFileSync(path.join(dir, 'situated-ui.css'), 'utf8');
const sheet = postcss.parse(css);
const source = fs.readFileSync(path.join(root, 'src/03-data.js'), 'utf8');
const camp = fs.readFileSync(path.join(root, 'src/03j-camp-conversations.js'), 'utf8');
const crew = fs.readFileSync(path.join(root, 'src/07-ui.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const ids = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const sections = html => [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*class="su-screen[^>]*>/g)];

test('all three separate drafts are registered; existing entries still resolve', () => {
  assert.equal(manifest.version, 1);
  assert.equal(new Set(manifest.drafts.map(row => row.id)).size, manifest.drafts.length);
  for (const name of names) {
    const rows = manifest.drafts.filter(row => row.id === name + '-v1');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].file, name + '.html');
    assert.match(rows[0].description, /게임·저장은 미변경/);
    assert.match(rows[0].description, /시각 검수.*미완료/);
  }
  for (const row of manifest.drafts) assert.ok(fs.existsSync(path.join(dir, row.file)), row.file);
});

test('no script, form, network, gameplay, storage or generated HTML coupling', () => {
  for (const html of Object.values(pages)) {
    assert.doesNotMatch(html, /<(?:script|iframe|object|embed|form)\b|\bon\w+\s*=|javascript:|https?:\/\//i);
    assert.doesNotMatch(html, /localStorage|sessionStorage|postMessage|fetch\(|\bG\.|서울까지400km\.html|\/api\//);
    assert.match(html, /default-src 'none'; style-src 'self'; img-src 'self'; form-action 'none'; base-uri 'none'/);
  }
  assert.doesNotMatch(css, /url\(|@import/);
  const build = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
  assert.doesNotMatch(build, /situated-/);
});

test('every link resolves locally and every route has a reversible next action', () => {
  for (const [name, html] of Object.entries(pages)) {
    assert.equal(new Set(ids(html)).size, ids(html).length, name);
    for (const [, ref] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const [file, fragment] = ref.split('#');
      const target = file ? path.resolve(dir, file) : path.join(dir, name + '.html');
      assert.ok(target.startsWith(root + path.sep), ref);
      assert.ok(fs.existsSync(target), ref);
      if (fragment) assert.ok(ids(fs.readFileSync(target, 'utf8')).includes(fragment), ref);
    }
    const screens = sections(html);
    assert.ok(screens.length >= 2, name);
    assert.equal((html.match(/class="su-screen[^\"]*\bsu-default\b/g) || []).length, 1);
    for (let i = 0; i < screens.length; i++) {
      const start = screens[i];
      const chunk = html.slice(start.index, screens[i + 1]?.index ?? html.length);
      assert.match(chunk, /<a class="su-primary"|<a class="su-choice"/, start[1]);
      assert.match(start[0], /tabindex="-1"/, 'native fragment focus target: ' + start[1]);
    }
    assert.match(html, /<label><input id="su-large" type="checkbox"> 큰 글씨<\/label>/);
    assert.doesNotMatch(html, /<button\b/); // No inert button-shaped controls.
  }
  assert.match(css, /\.su-stage:has\(> \.su-screen:target\) > \.su-screen\.su-default \{ display: none; \}/);
  assert.match(css, /\.su-stage > \.su-screen:target \{ display: flex;/);
});

test('markup has balanced semantic containers rather than silently nested screens', () => {
  const voids = new Set(['meta', 'link', 'img', 'input', 'br']);
  for (const [name, html] of Object.entries(pages)) {
    const stack = [];
    for (const [, closing, tag] of html.matchAll(/<(\/)?([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
      if (voids.has(tag)) continue;
      if (closing) assert.equal(stack.pop(), tag, name + ': ' + tag);
      else stack.push(tag);
    }
    assert.deepEqual(stack, [], name);
  }
});

test('conversation preserves actual dialogue and branches, with name revealed on self-introduction', () => {
  const html = pages['situated-talk'];
  const start = html.slice(html.indexOf('id="talk-start"'), html.indexOf('id="talk-name"'));
  assert.match(start, /su-speaker">소녀/);
  assert.doesNotMatch(start, /민지/);
  const named = html.slice(html.indexOf('id="talk-name"'), html.indexOf('id="talk-parts"'));
  assert.match(named, /su-speaker">민지/);
  for (const line of [
    '거기 생활차, 공회전 한 번만 더 해봐요. 연료관 쪽에서 새는 소리 나요.',
    '민지. 장날엔 여기 정비를 맡아요.',
    '오빠가 남긴 진단기가 울산 폐차장으로 넘어갔어요. 목소리가 남아 있을지도 몰라요.',
    '혼자서는 못 꺼내요. 거기까지 태워주면, 꺼낼 때 제가 손 신호 할게요.',
    '그럼 울산까지. 공구함은 제가 들고 탈게요.',
    '알겠어요. 전 여기서 다른 방법을 찾아볼게요.'
  ]) { assert.ok(source.includes(line), line); assert.ok(html.includes(line), line); }
  const parts = html.slice(html.indexOf('id="talk-parts"'), html.indexOf('id="talk-request"'));
  assert.match(parts, /챙긴 것　부품 \+1 · 고철 \+4/);
  assert.doesNotMatch(parts, /<details/);
  assert.match(source, /item:\{'부품':1\},scrap:4,flag:'minji_request_heard'/);
  assert.match(html, /성공 결과 한 가지만 재현/);
  assert.match(html, /situated-cabin\.html#cabin-guest/);
});

test('record uses current chosen branch, not classification branch or upcoming Gongju as goal', () => {
  const html = pages['situated-record'];
  const quote = '우리가 제안하는 것은 종료 장치가 아닙니다. 이유 공개, 인간 책임자의 서명, 당사자의 이의 제기. 예측과 실행 사이에 사람을 다시 놓는 일입니다.';
  const note = '엄마의 발표 원고를 복원했다. 천리안은 사람을 미래 파급으로 평가했고, 부모는 이유 공개·인간 서명·이의 제기를 되돌리려 했다.';
  for (const line of [quote, note]) { assert.ok(source.includes(line)); assert.ok(html.includes(line)); }
  assert.match(html, /수원에서 검증키 확인/);
  assert.match(html, /성곽 공동체 · 주변 탐색 · 준비 30분/);
  assert.match(html, /세종 → 공주 · 6km 남음/);
  assert.match(html, /DAY 3 · 11:26/);
  assert.doesNotMatch(html, /새 기록 ·|기억됨 ·|메인 스토리 갱신|◈|수원[^<]*꺼냈다/);
  assert.match(html, /음성 재생은 하지 않습니다/);
});

test('crew separates current empty party from hypothetical guest; camp effects only follow explicit action', () => {
  const html = pages['situated-cabin'];
  assert.match(html, /현재 동료는 없습니다/);
  assert.match(html, /야영 화면은 독립 가정/);
  assert.match(html, /공책 · 사이드 미션/);
  assert.doesNotMatch(html, /호감도|레벨|LV|새 동료|미션 완료|\b\d+\s*km\b/);
  const alone = html.slice(html.indexOf('id="cabin-alone"'), html.indexOf('id="cabin-guest"'));
  assert.match(alone, /passenger-seat-v1\.jpg/);
  assert.doesNotMatch(alone, /portraits\/minji/);
  const guest = html.slice(html.indexOf('id="cabin-guest"'), html.indexOf('id="cabin-promise"'));
  assert.doesNotMatch(guest, /passenger-seat-v1/);
  for (const line of ['손님 짐이라며 끈은 묶지 않았다. 울산에서 찾을 물건이 있다고 했다.', '손잡이를 놓았다가도 차가 흔들리면 다시 잡는다.']) {
    assert.ok(crew.includes(line)); assert.ok(guest.includes(line));
  }
  const action = html.slice(html.indexOf('id="cabin-camp"'), html.indexOf('id="cabin-listened"'));
  assert.match(action, /함께 듣기<\/span><span>15분/);
  assert.match(action, /href="#cabin-guest">지금은 쉬기/);
  assert.doesNotMatch(action, /15분 경과|고쳐 달라는 부탁 없이/);
  const after = html.slice(html.indexOf('id="cabin-after"'), html.indexOf('id="cabin-promise-after"'));
  const memory = '고쳐 달라는 부탁 없이, 한동안 같이 달구지의 소리를 들었다.';
  assert.ok(camp.includes(memory)); assert.ok(after.includes(memory));
  assert.match(after, /href="#cabin-promise-after"/); // Reading the promise must not reset the new memory.
  assert.match(html, /href="#cabin-after">덮고 민지에게 돌아가기/);
});

test('original reviewed artwork is used at its real ratio; portraits are not cropped', () => {
  const expected = {
    '../../assets/scenes/recruit-minji-meet-action.webp': [768, 432],
    '../../assets/scenes/story-family-principle-review-v1.webp': [1280, 720],
    '../../assets/upgrades/passenger-seat-v1.jpg': [1440, 480],
    '../../assets/portraits/minji.png': [128, 128]
  };
  for (const html of Object.values(pages)) {
    for (const [, src, width, height, alt] of html.matchAll(/<img src="([^"]+)" width="(\d+)" height="(\d+)" alt="([^"]+)"/g)) {
      assert.deepEqual([+width, +height], expected[src], src);
      assert.ok(alt.trim().length > 3);
    }
  }
  assert.doesNotMatch(css, /object-fit:\s*(?:cover|fill)|background-image|filter:|transform:/);
  assert.match(css, /\.su-art img \{ width: 100%; height: auto;/);
});

test('CSS parses, all authored selectors are isolated, and long text stays in document flow', () => {
  let rules = 0;
  sheet.walkRules(() => rules++);
  assert.ok(rules > 55);
  sheet.walkDecls(d => {
    assert.ok(!d.important, d.toString());
    assert.ok(!(d.prop.startsWith('overflow') && /hidden|clip/.test(d.value)), d.toString());
    assert.ok(!(d.prop === 'position' && /fixed|absolute|sticky/.test(d.value)), d.toString());
    assert.ok(!/^(?:max-height|max-block-size|line-clamp|-webkit-line-clamp)$/.test(d.prop), d.toString());
    if (d.prop === 'height') assert.ok(d.value === 'auto' || d.parent.selector === '.su-settings input', d.toString());
  });
  assert.match(css, /width: min\(100%, 480px\)/);
  assert.match(css, /word-break: keep-all; overflow-wrap: anywhere/);
  assert.match(css, /#su-large:checked\) \{ --su-font: 22px; --su-small: 17px;/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /:focus-visible/);
});

test('body, secondary, named speaker and primary action colors meet AA contrast', () => {
  const luminance = hex => hex.match(/../g).map(v => parseInt(v, 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const pairs = [
    ['eee9dd', '1c292c'], ['b8beb9', '1c292c'], ['e3be82', '1c292c'],
    ['eee9dd', '151c1f'], ['b8beb9', '151c1f'],
    ['eee9dd', '323930'], ['c7cbbd', '323930'],
    ['eee9dd', '282723'], ['c9c2b3', '282723'],
    ['2e4651', 'e9e1c7'], ['505e51', 'e9e1c7'],
    ['202b28', 'd9bc88'], ['fff7e6', '315649']
  ];
  for (const [fg, bg] of pairs) {
    const a = luminance(fg), b = luminance(bg);
    assert.ok((Math.max(a,b) + .05) / (Math.min(a,b) + .05) >= 4.5, fg + '/' + bg);
  }
});
