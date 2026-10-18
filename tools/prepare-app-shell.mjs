import {copyFileSync,readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';

// Vite moves the game to index.html and hashes the manifest. Web manifest URLs
// resolve relative to the manifest, not the HTML: ship one root-owned app shell.
export function prepareAppShell(root,outDir){
 const index=resolve(outDir,'index.html');
 const html=readFileSync(index,'utf8').replace(/(<link\b[^>]*\brel="manifest"[^>]*\bhref=")[^"]+("[^>]*>)/,
  '$1./manifest.webmanifest$2');
 if(!html.includes('href="./manifest.webmanifest"'))throw Error('App manifest link not found');
 writeFileSync(index,html);
 const manifest=JSON.parse(readFileSync(resolve(root,'manifest.webmanifest'),'utf8'));
 manifest.start_url='./index.html';
 writeFileSync(resolve(outDir,'manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
 for(const icon of manifest.icons){
  const to=resolve(outDir,icon.src);mkdirSync(dirname(to),{recursive:true});copyFileSync(resolve(root,icon.src),to);
 }
 const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(dir,e.name)):[resolve(dir,e.name)]);
 const modules=walk(outDir).filter(p=>/\.(?:js|css|woff2)$/.test(p)&&!p.endsWith('/service-worker.js'))
  .map(p=>'./'+relative(outDir,p).split('\\').join('/')).sort();
 const shell=['./','./index.html','./manifest.webmanifest',...manifest.icons.map(i=>'./'+i.src),...modules];
 const worker=readFileSync(resolve(root,'service-worker.js'),'utf8')
  .replace(/const SHELL = \[[\s\S]*?\];/,`const SHELL = ${JSON.stringify([...new Set(shell)],null,2)};`)
  .replaceAll('./서울까지400km.html','./index.html');
 writeFileSync(resolve(outDir,'service-worker.js'),worker);
 return shell;
}

export function readGameBuild(text){
 return text.match(/\bconst\s+GAME_BUILD\s*=\s*(['"`])([^'"`]+)\1/)?.[2]||null;
}

// AIT relocates Vite's output under web/ while adding native bundles.
export function appShellDir(dist){
 for(const dir of [resolve(dist,'web'),dist])if(existsSync(resolve(dir,'index.html')))return dir;
 throw Error('Built app index.html not found; run build:web or build:toss first');
}
