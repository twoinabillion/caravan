// Deterministic export only: retain generator masters, trim alpha margins, resize.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../..');
const folder = path.join(root, 'assets/road-cues');
async function main() {
  const [id, source, heightText] = process.argv.slice(2);
  const supported = /^(coffee-vendor|checkpoint-worker|checkpoint-booth|market-cart|fuel-pump|delivery-bicycle|postman-standing|cart-trader|beekeeper-standing|road-(man|woman|child|elder|medic|worker|mansu|monk|barber|hunter|musician|refugee|food-truck|clinic-bus|cinema-truck|merchant-truck|cow|mapmaker|hanbyeol|mingyu|photographer|florist|tailor|seoyeon|sanjigi|kimcaptain|hayeosa|geumja|seojin|taesik|library-bus|mapmaker-sidecar|piano))-v1$/;
  if (!supported.test(id) && id !== 'road-hanbyeol-v2') throw Error('Unknown part');
  const height = Number(heightText);
  if (!Number.isInteger(height) || height < 256 || height > 768) throw Error('Invalid delivery height');
  const master = path.join(folder, 'masters', `${id}.png`);
  fs.mkdirSync(path.dirname(master), { recursive: true });
  if (fs.existsSync(master)) throw Error('Master already exists; version rather than overwrite');
  if (!(await sharp(source).metadata()).hasAlpha) throw Error('Source must have genuine alpha');
  const stats = await sharp(source).stats();
  if (stats.channels.at(-1).min !== 0 || stats.channels.at(-1).max < 240) throw Error('Invalid transparent cutout');
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * info.channels + info.channels - 1] > 8) {
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw Error('Empty alpha');
  const pad = 8;
  left = Math.max(0, left - pad); top = Math.max(0, top - pad);
  right = Math.min(info.width - 1, right + pad); bottom = Math.min(info.height - 1, bottom + pad);
  const crop = { left, top, width: right - left + 1, height: bottom - top + 1 };
  fs.copyFileSync(source, master);
  const output = path.join(folder, `cue-${id}.webp`);
  await sharp(source).extract(crop).resize({ height }).webp({ quality: 94, alphaQuality: 100 }).toFile(output);
  const metadata = await sharp(output).metadata();
  console.log(JSON.stringify({ id, master: path.relative(root, master), output: path.relative(root, output), crop, width: metadata.width, height: metadata.height, alpha: metadata.hasAlpha }));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
