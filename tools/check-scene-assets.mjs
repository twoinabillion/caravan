#!/usr/bin/env node
import {existsSync,readFileSync,readdirSync} from 'node:fs';
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
  const data=readFileSync(file);

  if(data.length>=24&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){
    return {width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
  }

  if(data.length>=4&&data[0]===0xff&&data[1]===0xd8){
    const startOfFrame=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
    let offset=2;
    while(offset<data.length){
      if(data[offset]!==0xff){offset+=1;continue}
      while(offset<data.length&&data[offset]===0xff) offset+=1;
      const marker=data[offset++];
      if(marker===0xd8||marker===0xd9||marker===0x01||(marker>=0xd0&&marker<=0xd7)) continue;
      if(offset+2>data.length) break;
      const length=data.readUInt16BE(offset);
      if(length<2||offset+length>data.length) break;
      if(startOfFrame.has(marker)&&length>=7){
        return {width:data.readUInt16BE(offset+5),height:data.readUInt16BE(offset+3)};
      }
      offset+=length;
    }
  }

  if(data.length>=30&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP'){
    const format=data.toString('ascii',12,16);
    if(format==='VP8X'){
      return {width:data.readUIntLE(24,3)+1,height:data.readUIntLE(27,3)+1};
    }
    if(format==='VP8 '&&data.length>=30){
      return {width:data.readUInt16LE(26)&0x3fff,height:data.readUInt16LE(28)&0x3fff};
    }
    if(format==='VP8L'&&data.length>=25){
      const bits=data.readUInt32LE(21);
      return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
    }
  }

  throw new Error(`Unsupported or malformed image: ${file}`);
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

if(failures.length){
  console.error('Scene asset contract failed:');
  failures.forEach(line=>console.error(`- ${line}`));
  process.exit(1);
}

console.log(`Image asset contract passed: ${imageFiles.length} scenes and ${portraitFiles.length} portraits checked.`);
