#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compactScriptSource} from './compact-script-source.mjs';

export function checkBuildAndZoom(source,html,index){
 const declaration=source.match(/\bconst\s+GAME_BUILD\s*=\s*(['"`])([^'"`]+)\1\s*;/)?.[0];
 if(!declaration)throw new Error('source GAME_BUILD declaration missing');
 const expected=compactScriptSource(declaration,'game-build.js');
 if(!html.includes(expected))throw new Error('build string mismatch');
 for(const [name,doc] of [['game',html],['index',index]]){
  if(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0+)?\s*[,"';]/.test(doc))throw new Error(name+' restricts zoom');
 }
 return declaration;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const source=['04a-engine-core.js','04b-engine-crew.js','04c-engine-travel.js','04d-engine-director.js','04e-engine-world.js'].map(n=>read('src/'+n)).join('\n');
 const declaration=checkBuildAndZoom(source,read('서울까지400km.html'),read('index.html'));
 console.log('✅ shell guards ok · '+declaration);
}
