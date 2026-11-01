// Deterministic delivery export, never a visual acceptance step.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const masterRoot='assets/masters/route-continuity-v3';
const deliveryRoot='assets/ui/road-studies/continuous-v3';
const hash=b=>createHash('sha256').update(b).digest('hex');
const jobs=JSON.parse(await fs.readFile(path.join(root,masterRoot,'production-jobs.json')));
let previous=[];try{previous=JSON.parse(await fs.readFile(path.join(root,masterRoot,'delivery-candidates.json'))).exports;}catch{}
const exports=[];
for(const group of ['nodes','corridors']){
 const entries=await fs.readdir(path.join(root,masterRoot,group));
 const selected=new Map();
 for(const file of entries){const m=file.match(/^(.*)-master-v(\d+)\.png$/);if(m&&(!selected.has(m[1])||+m[2]>selected.get(m[1]).version))selected.set(m[1],{file,version:+m[2]});}
 for(const [id,{file}]of [...selected].sort(([a],[b])=>a.localeCompare(b))){
  const source=path.join(masterRoot,group,file);
  const bytes=await fs.readFile(path.join(root,source)),meta=await sharp(bytes).metadata();
  if(meta.width<2048||meta.height<683||!meta.hasAlpha)throw Error('native alpha/size contract: '+source);
  const prior=previous.find(e=>e.source===source&&e.sourceSha256===hash(bytes));
  if(prior){try{if(hash(await fs.readFile(path.join(root,prior.file)))===prior.sha256){exports.push(prior);continue;}}catch{}}
  // Resize down, preserving the authored 3:1 frame, then remove unused sky.
  const resized=await sharp(bytes).resize(2048,683,{fit:'fill',withoutEnlargement:true}).png().toBuffer();
  const out=await sharp(resized).extract({left:0,top:107,width:2048,height:576}).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
  const dest=path.join(deliveryRoot,group,id+'.webp');
  await fs.mkdir(path.dirname(path.join(root,dest)),{recursive:true});
  await fs.writeFile(path.join(root,dest),out);
  exports.push({id,group,source,sourceSha256:hash(bytes),file:dest,sha256:hash(out),width:2048,height:576,x:512,status:'candidate-unreviewed'});
 }
}
const available=new Set(exports.filter(e=>e.group==='nodes').map(e=>e.id));
const report={exports,missingNodes:jobs.filter(j=>!available.has(j.id)).map(j=>j.id)};
await fs.writeFile(path.join(root,masterRoot,'delivery-candidates.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({nodes:available.size,corridors:exports.length-available.size,missingNodes:report.missingNodes.length}));
