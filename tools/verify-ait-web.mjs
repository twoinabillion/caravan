#!/usr/bin/env node
/** Verify one built AIT against its dist files and source GAME_BUILD. */

import {createHash} from 'node:crypto';
import {readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {AITReader} from '@apps-in-toss/ait-format';
import {unzipSync} from 'fflate';

const projectRoot = path.resolve(process.argv[2] || '.');
const aitPath = path.resolve(projectRoot, process.argv[3] || 'caravan.ait');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(`AIT web verification: ${message}`); };

const reader = AITReader.fromBuffer(readFileSync(aitPath));
if (reader.formatVersion !== 1) fail(`expected format 1, got ${reader.formatVersion}`);
if (reader.appName !== 'caravan') fail(`expected app caravan, got ${reader.appName}`);

// Decode the payload once. AITReader.readEntry() would decompress the whole archive per call.
const unpacked = unzipSync(reader.readZipBlob());
const entries = reader.bundle.index;
if (entries.length !== reader.listEntries().length) fail('bundle index/listEntries length mismatch');
for (const entry of entries) {
  const bytes = unpacked[entry.name];
  if (!bytes) fail(`missing indexed entry ${entry.name}`);
  const actual = digest(bytes);
  if (actual !== entry.sha256Hex) fail(`${entry.name} index SHA mismatch: ${actual}`);
  if (BigInt(bytes.length) !== entry.uncompressedSize)
    fail(`${entry.name} size mismatch: ${bytes.length} != ${entry.uncompressedSize}`);
}

const webEntries = entries.filter(entry => entry.name.startsWith('web/'));
if (!webEntries.some(entry => entry.name === 'web/index.html')) fail('web/index.html is absent');
for (const entry of webEntries) {
  const distPath = path.resolve(projectRoot, 'dist', entry.name);
  if (!statSync(distPath).isFile()) fail(`fresh dist file is absent: dist/${entry.name}`);
  const distHash = digest(readFileSync(distPath));
  if (distHash !== entry.sha256Hex)
    fail(`${entry.name} differs from fresh dist: ${entry.sha256Hex} != ${distHash}`);
}

const html = new TextDecoder().decode(unpacked['web/index.html']);
const engine = ['04a-engine-core.js', '04b-engine-crew.js', '04c-engine-travel.js', '04d-engine-director.js', '04e-engine-world.js']
  .map(name => readFileSync(path.resolve(projectRoot, 'src', name), 'utf8')).join('\n');
const build = engine.match(/const GAME_BUILD = '([^']+)'/)?.[1];
if (!build) fail('source GAME_BUILD declaration is absent');
if (!html.includes(`const GAME_BUILD = '${build}'`))
  fail(`web/index.html does not contain source GAME_BUILD ${build}`);

const referencedAssets = new Set(
  [...html.matchAll(/(?:\.\/|\/)assets\/([^"'\s<>]+)/g)].map(match => `web/assets/${match[1]}`),
);
for (const name of referencedAssets) {
  if (!unpacked[name]) fail(`web/index.html references missing AIT entry ${name}`);
  if (!entries.some(entry => entry.name === name)) fail(`web/index.html reference is absent from bundle index: ${name}`);
}

console.log(JSON.stringify({
  ait: path.basename(aitPath),
  formatVersion: reader.formatVersion,
  appName: reader.appName,
  entryCount: entries.length,
  webEntryCount: webEntries.length,
  webIndexBytes: unpacked['web/index.html'].length,
  webIndexSha256: digest(unpacked['web/index.html']),
  gameBuild: build,
  allIndexHashesVerified: true,
  allWebEntriesMatchFreshDist: true,
  referencedWebAssetCount: referencedAssets.size,
  allReferencedWebAssetsIndexed: true,
}, null, 2));
