#!/usr/bin/env node
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';

const root=process.cwd();
const strict=process.argv.includes('--strict');
const contract=JSON.parse(readFileSync(join(root,'assets','visual-contract.json'),'utf8'));
const sceneDir=join(root,'assets','scenes');
const introDir=join(root,'assets','intro');
const upgradeDir=join(root,'assets','upgrades');
const portraitDir=join(root,'assets','portraits');
const visual=contract.assets;
const portraitSizes=new Set(visual.portrait.allowedDeliveryEdges);
const imagePattern=/\.(?:jpe?g|png|webp)$/i;
const failures=[];
const warnings=[];

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

for(const relative of contract.requiredReferences){
  if(!existsSync(join(root,relative))) failures.push(`required style reference missing: ${relative}`);
}

const near=(value,target,tolerance)=>Math.abs(value-target)<=tolerance;
const allowedSceneSizes=new Set(visual.cinematicScene.allowedDelivery.map(size=>size.join('x')));
const sceneGroups=[
  {label:'scenes',dir:sceneDir},
  {label:'intro',dir:introDir},
  {label:'upgrades',dir:upgradeDir}
].filter(group=>existsSync(group.dir));
let sceneCount=0;

for(const group of sceneGroups){
 for(const name of readdirSync(group.dir).filter(name=>imagePattern.test(name)).sort()){
  sceneCount+=1;
  const file=join(group.dir,name);
  const actual=dimensions(file);
  const isArrival=group.label==='scenes'&&/^arrival-.*\.webp$/i.test(name);
  const isHub=group.label==='scenes'&&/^miryang-market-hub\.(?:jpe?g|webp)$/i.test(name);
  const isUpgrade=group.label==='upgrades';
  const ratio=actual.width/actual.height;
  const valid=isArrival
    ?actual.width>=visual.arrivalScene.minimum[0]&&actual.height>=visual.arrivalScene.minimum[1]
      &&ratio>=visual.arrivalScene.aspectRatioRange[0]&&ratio<=visual.arrivalScene.aspectRatioRange[1]
    :isHub
      ?actual.width>=visual.settlementHub.minimum[0]&&actual.height>=visual.settlementHub.minimum[1]
        &&ratio>=visual.settlementHub.aspectRatioRange[0]&&ratio<=visual.settlementHub.aspectRatioRange[1]
      :isUpgrade
        ?visual.upgradeCard.allowedDelivery.some(([width,height])=>actual.width===width&&actual.height===height)
      :actual.width>=visual.cinematicScene.minimum[0]&&actual.height>=visual.cinematicScene.minimum[1]
        &&(near(ratio,visual.cinematicScene.aspectRatio,visual.cinematicScene.aspectTolerance)
          ||near(ratio,visual.legacyLandscapeScene.aspectRatio,visual.legacyLandscapeScene.aspectTolerance));
  if(!valid){
    const expected=isArrival?'portrait arrival contract'
      :isHub?'portrait settlement-hub contract'
      :isUpgrade?'vehicle upgrade-card contract':'16:9 cinematic scene contract';
    failures.push(`${group.label}/${name}: ${actual.width}x${actual.height}; expected ${expected}`);
  }else if(!isArrival&&!isHub&&!isUpgrade){
    if(near(ratio,visual.legacyLandscapeScene.aspectRatio,visual.legacyLandscapeScene.aspectTolerance)){
      warnings.push(`${group.label}/${name}: legacy 3:2 frame ${actual.width}x${actual.height}`);
    }else if(!allowedSceneSizes.has(`${actual.width}x${actual.height}`)){
      warnings.push(`${group.label}/${name}: non-canonical 16:9 delivery size ${actual.width}x${actual.height}`);
    }
    if(statSync(file).size>visual.cinematicScene.maximumRecommendedBytes){
      warnings.push(`${group.label}/${name}: ${statSync(file).size} bytes exceeds recommended scene budget`);
    }
  }
 }
}

const portraitFiles=existsSync(portraitDir)
  ?readdirSync(portraitDir).filter(name=>/\.(?:jpe?g|png|webp)$/i.test(name)).sort()
  :[];
for(const name of portraitFiles){
  const actual=dimensions(join(portraitDir,name));
  if(actual.width!==actual.height||!portraitSizes.has(actual.width)){
    failures.push(`portraits/${name}: ${actual.width}x${actual.height}; expected square 96, 128, or 256px portrait`);
  }
}

if(failures.length){
  console.error(`Visual contract ${contract.styleId} failed:`);
  failures.forEach(line=>console.error(`- ${line}`));
  process.exit(1);
}

if(warnings.length){
  console.warn(`Visual contract legacy warnings: ${warnings.length}`);
  warnings.slice(0,10).forEach(line=>console.warn(`- ${line}`));
  if(warnings.length>10) console.warn(`- ... ${warnings.length-10} more; use --strict after legacy migration`);
  if(strict) process.exit(1);
}

console.log(`Visual contract ${contract.styleId} passed: ${sceneCount} scene-class assets and ${portraitFiles.length} portraits checked.`);
