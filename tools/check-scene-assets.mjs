#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
import {join} from 'node:path';

const root=process.cwd();
const sceneDir=join(root,'assets','scenes');
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

if(failures.length){
  console.error('Scene asset contract failed:');
  failures.forEach(line=>console.error(`- ${line}`));
  process.exit(1);
}

console.log(`Scene asset contract passed: ${imageFiles.length} files checked.`);
