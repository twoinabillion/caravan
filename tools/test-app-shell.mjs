import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {prepareAppShell,readGameBuild,appShellDir} from './prepare-app-shell.mjs';

test('packaged app owns valid root manifest, icons, module precache and offline index',()=>{
 const out=mkdtempSync(resolve(tmpdir(),'caravan-app-shell-'));
 mkdirSync(resolve(out,'assets'));
 writeFileSync(resolve(out,'index.html'),'<link rel="manifest" href="./assets/manifest-old.webmanifest">');
 writeFileSync(resolve(out,'assets/runtime.js'),'/* fixture */');
 const shell=prepareAppShell(resolve(import.meta.dirname,'..'),out);
 const manifest=JSON.parse(readFileSync(resolve(out,'manifest.webmanifest')));
 assert.equal(manifest.start_url,'./index.html');
 for(const path of shell)assert(existsSync(resolve(out,path)),path);
 assert(shell.includes('./assets/runtime.js'));
 assert(!shell.some(p=>p.includes('서울까지400km.html')));
 assert(readFileSync(resolve(out,'service-worker.js'),'utf8').includes("caches.match('./index.html')"));
 assert(readFileSync(resolve(out,'index.html'),'utf8').includes('href="./manifest.webmanifest"'));
 assert.equal(JSON.parse(readFileSync(resolve(import.meta.dirname,'../manifest.webmanifest'))).start_url,'./서울까지400km.html',
  'single-file/Pages packaging is unchanged');
});
test('build marker comparison tolerates minifier whitespace/quotes but rejects stale/missing markers',()=>{
 for(const q of ["'",'"','`'])assert.equal(readGameBuild(`const GAME_BUILD=${q}build-v1${q};`),'build-v1');
 assert.equal(readGameBuild("const GAME_BUILD = 'build-v1';"),'build-v1');
 assert.notEqual(readGameBuild("const GAME_BUILD='old';"),'build-v1');assert.equal(readGameBuild('const OTHER=1'),null);
});
test('Toss owns its package lifecycle, not a nested service-worker update/reload',()=>{
 assert.match(readFileSync(resolve(import.meta.dirname,'../src/07-ui.js'),'utf8'),
  /if\('serviceWorker' in navigator && location\.protocol!=='file:'&&!tossRuntime\)/);
});
test('release validation finds the web entry after AIT relocates the Vite output',()=>{
 const out=mkdtempSync(resolve(tmpdir(),'caravan-app-entry-'));
 assert.throws(()=>appShellDir(out),/index.html not found/);
 writeFileSync(resolve(out,'index.html'),'web');assert.equal(appShellDir(out),out);
 mkdirSync(resolve(out,'web'));writeFileSync(resolve(out,'web/index.html'),'ait');
 assert.equal(appShellDir(out),resolve(out,'web'));
});
