#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {existsSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

const root=process.cwd();
const sceneDir=join(root,'assets','scenes');
const portraitDir=join(root,'assets','portraits');
const hubExceptions=new Map([['miryang-market-hub.jpg',[960,1200]]]);
const imageFiles=readdirSync(sceneDir)
  .filter(name=>/\.(?:jpe?g|png|webp)$/i.test(name))
  .sort();
const failures=[];

function dimensions(file){
  const output=execFileSync('sips',['-g','pixelWidth','-g','pixelHeight',file],{encoding:'utf8'});
  const width=Number(output.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height=Number(output.match(/pixelHeight:\s*(\d+)/)?.[1]);
  return {width,height};
}

for(const name of imageFiles){
  const file=join(sceneDir,name);
  const actual=dimensions(file);
  const expected=hubExceptions.get(name)||[768,432];
  if(actual.width!==expected[0]||actual.height!==expected[1]){
    failures.push(`${name}: ${actual.width}x${actual.height}; expected ${expected[0]}x${expected[1]}`);
  }
}

const portraitFiles=existsSync(portraitDir)
  ?readdirSync(portraitDir).filter(name=>/\.(?:jpe?g|png|webp)$/i.test(name)).sort()
  :[];
for(const name of portraitFiles){
  const actual=dimensions(join(portraitDir,name));
  if(actual.width!==96||actual.height!==96){
    failures.push(`portraits/${name}: ${actual.width}x${actual.height}; expected optimized runtime portrait 96x96`);
  }
}

const uiContracts=new Map([
  ['assets/ui/cockpit-shell-v1.png',[853,1844]],
  ['assets/ui/caravan-exterior-v1.webp',[720,720]]
]);
for(const [relative,expected] of uiContracts){
  const file=join(root,relative);
  if(!existsSync(file)){ failures.push(`${relative}: missing`); continue; }
  const actual=dimensions(file);
  if(actual.width!==expected[0]||actual.height!==expected[1]){
    failures.push(`${relative}: ${actual.width}x${actual.height}; expected ${expected[0]}x${expected[1]}`);
  }
}

if(failures.length){
  console.error('Scene asset contract failed:');
  failures.forEach(line=>console.error(`- ${line}`));
  process.exit(1);
}

console.log(`Image asset contract passed: ${imageFiles.length} scenes, ${portraitFiles.length} portraits, ${uiContracts.size} driving UI assets checked.`);
