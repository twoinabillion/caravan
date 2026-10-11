const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const html = read('tools/design-drafts/scenery-seam-hd.html');
const css = read('tools/design-drafts/scenery-seam-hd.css');
const p = JSON.parse(read('tools/design-drafts/scenery-seam-hd/provenance-v2.json'));

test('HD candidate is registered, isolated and explicitly not an all-route/game approval', () => {
  const drafts = JSON.parse(read('tools/design-drafts/manifest.json')).drafts;
  const d = drafts.find(d => d.id === 'scenery-seam-hd-v1');
  assert.equal(d.file, 'scenery-seam-hd.html');
  assert.equal(d.recommended, false, 'historical hero remains available; current all-corridor draft owns recommendation');
  assert.equal(drafts.find(d => d.id === 'scenery-hd-all-v1').recommended, true);
  assert.equal(drafts.find(d => d.id === 'scenery-cities-v2').recommended, false);
  assert.doesNotMatch(html, /<script|\bonclick\s*=|localStorage|sessionStorage|\/game\?/i);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /전체 78구간/);
  assert.match(html, /게임·저장·현재 진행 미변경/);
  assert.equal(p.gameEnabled, false);
  assert.equal(p.visualApproval, false);
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert(fs.existsSync(path.resolve(root, 'tools/design-drafts', m[1].split('?')[0])), m[1]);
  }
});

test('canonical cities and provenance hashes remain intact; required references were attached', () => {
  assert.equal(p.tool, 'image_gen.imagegen');
  assert.match(p.prompt, /Fill ONLY/);
  const contract = JSON.parse(read('assets/visual-contract.json'));
  // The receipt preserves all four shared canonical references, plus the real endpoint template.
  for (const ref of ['visual-canon-2026-08-11.png', 'world-canon-2026-08-11.png', 'people-canon-2026-08-11.png', 'dalguji-technical-canon-2026-08-11.webp']) {
    assert(p.references.includes('assets/reference/' + ref), ref);
  }
  assert(contract);
  assert(p.references.includes('tools/design-drafts/scenery-seam-hd/edge-template.png'));
  for (const city of p.canonicalCities) assert.equal(hash(city.file), city.sha256, city.id);
  assert.equal(hash(p.file), p.sha256);
});

test('delivery is high-resolution proportional sRGB alpha, with unfinished ground opacity disclosed', async () => {
  const master = await sharp(path.join(root, p.master)).metadata();
  const delivery = await sharp(path.join(root, p.file)).metadata();
  assert.deepEqual([master.width, master.height], p.actualMaster);
  assert(master.width >= delivery.width && master.height >= delivery.height);
  assert.deepEqual([delivery.width, delivery.height], [1024, 576]);
  assert.equal(delivery.space, 'srgb');
  assert(delivery.hasAlpha);
  assert(delivery.width >= 480 * 2, 'no DPR2 upsampling at supported maximum width');
  const { data, info } = await sharp(path.join(root, p.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let bottomOpaque = 0, min = 255;
  for (let x = 0; x < info.width; x++) {
    assert.equal(data[x * 4 + 3], 0, 'transparent air, not a painted sky');
    bottomOpaque += data[((info.height - 1) * info.width + x) * 4 + 3] === 255;
  }
  for (let y = info.height - 64; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    min = Math.min(min, data[(y * info.width + x) * 4 + 3]);
  }
  assert.equal(bottomOpaque, p.alpha.bottomOpaque);
  assert(min >= 240, 'no transparent holes in foreground');
  assert(bottomOpaque < info.width, 'known non-solid alpha must not be relabeled production-ready');
  assert.equal(p.visualApproval, false);
});

test('one-screen terrain projection has no column warping, blur, time dissolve or mirrored city', () => {
  assert.equal((html.match(/class="hd-plate /g) || []).length, 3);
  assert.doesNotMatch(html, /<svg|preserveAspectRatio|scaleY\(/);
  assert.doesNotMatch(css, /!important|filter\s*:|opacity\s*:|scaleY\(|skew\(/);
  assert.match(css, /width:287\.5%/);
  assert.match(css, /width:34\.782608696%;height:auto/);
  assert.match(css, /mask-image:linear-gradient/);
  assert.equal((css.match(/scaleX\(-1\)/g) || []).length, 1);
  assert.match(css, /#hd-reverse:checked\) \.vehicle\{transform:scaleX\(-1\)/);
  for (const id of ['start', 'first', 'middle', 'last', 'end']) assert(html.includes(`id="hd-${id}"`));
  assert.match(css, /animation-play-state:paused/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert(!/id="hd-play"[^>]*checked/.test(html), 'motion opt-in');
});

test('overlap covers every camera position at320/360/480 in both directions, preserving endpoints', () => {
  const world = 2.875;
  const width = world * .34782608696;
  const bridge = world * .32608695652;
  const to = world * .65217391304;
  assert(Math.abs(width - 1) < 1e-10);
  assert(Math.abs(bridge - .9375) < 1e-10);
  assert(Math.abs(to - 1.875) < 1e-10);
  for (const W of [320, 360, 480]) for (const reverse of [false, true]) for (let i = 0; i <= 100; i++) {
    const progress = reverse ? 1 - i / 100 : i / 100;
    const camera = to * W * progress;
    const ranges = [[0, W], [bridge * W, (bridge + 1) * W], [to * W, (to + 1) * W]];
    let covered = camera;
    for (const [a, b] of ranges) if (a <= covered + 1e-7 && b >= covered) covered = Math.max(covered, b);
    assert(covered >= camera + W - 1e-7);
    if (progress === 0) assert.equal(camera, 0);
    if (progress === 1) assert(Math.abs(to * W - camera) < 1e-8);
  }
});
