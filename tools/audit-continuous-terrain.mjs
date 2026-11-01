// Candidate-only visual evidence. This tool NEVER marks art accepted or enables
// the production manifest. It uses the exact compositor used by the browser.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import joiner from './continuous-route-join.cjs';
import {routeFlows} from './landscape-atlas-data.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artRoot='assets/masters/route-continuity-v3';
const out=path.join(root,'qa-artifacts/route-continuity-v3/full-graph');
await fs.mkdir(out,{recursive:true});
const deliveries=JSON.parse(await fs.readFile(path.join(root,artRoot,'delivery-candidates.json')));
if(deliveries.missingNodes.length)throw Error('missing candidate cities');
const kinds=JSON.parse(await fs.readFile(path.join(root,artRoot,'route-kinds.json')));
const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/ui/road-environment/continuous-v3.json')));
const nodes=Object.fromEntries(deliveries.exports.filter(e=>e.group==='nodes').map(e=>[e.id,e]));
const corridors=Object.fromEntries(deliveries.exports.filter(e=>e.group==='corridors').map(e=>[e.id,e]));
const routes=manifest.routes.map(r=>({...r,kind:kinds[r.id]}));
if(Object.keys(nodes).length!==58||routes.length!==78||routes.some(r=>!corridors[r.kind]))throw Error('candidate coverage');
const registry={enabled:true,viewport:1024,width:2048,height:576,overlap:512,nodes:Object.fromEntries(Object.entries(nodes).map(([id,n])=>[id,{source:'http://qa.local/'+n.file}])),corridors:Object.fromEntries(Object.entries(corridors).map(([id,n])=>[id,{source:'http://qa.local/'+n.file}])),routes:routes.map(({id,from,to,km,kind})=>({id,from,to,km,kind}))};
await fs.writeFile(path.join(out,'registry-candidate.json'),JSON.stringify(registry));
const cache=new Map(),hash=b=>createHash('sha256').update(b).digest('hex');
async function pixels(item){
 if(cache.has(item.file))return cache.get(item.file);
 const bytes=await fs.readFile(path.join(root,item.file));if(hash(bytes)!==item.sha256)throw Error('candidate changed: '+item.file);
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==2048||info.height!==576)throw Error('delivery geometry');
 for(let i=3;i<data.length;i+=4)if(data[i]>=192)data[i]=255;
 cache.set(item.file,data);return data;
}
const report=[];
for(const r of routes){
 const [a,b,c]=await Promise.all([pixels(nodes[r.from]),pixels(corridors[r.kind]),pixels(nodes[r.to])]);
 const world=joiner.joinTilePixels(a,b,c),raw={width:5120,height:576,channels:4};
 for(const [node,offset]of [[a,512],[c,3584]])for(let y=0;y<576;y++){
  const actual=Buffer.from(world.buffer,world.byteOffset+(y*5120+offset)*4,4096),expected=node.subarray((y*2048+512)*4,(y*2048+1536)*4);
  if(!actual.equals(expected))throw Error('city core changed: '+r.id);
 }
 await sharp(world,{raw}).png({compressionLevel:3}).toFile(path.join(out,r.id+'-world.png'));
 await sharp(world,{raw}).resize(2560,288).flatten({background:'#99aab5'}).png().toFile(path.join(out,r.id+'-overview.png'));
 // Full native overlap and context, rather than a tiny downsampled seam.
 const joins=[];
 for(const [i,x]of [1280,2816].entries())joins.push({input:await sharp(world,{raw}).extract({left:x,top:0,width:1024,height:576}).flatten({background:'#99aab5'}).png().toBuffer(),left:i*1024,top:0});
 await sharp({create:{width:2048,height:576,channels:3,background:'#99aab5'}}).composite(joins).png().toFile(path.join(out,r.id+'-joins.png'));
 report.push({id:r.id,from:r.from,to:r.to,km:r.km,kind:r.kind,flow:routeFlows[r.id],fromSha256:nodes[r.from].sha256,toSha256:nodes[r.to].sha256,sha256:corridors[r.kind].sha256,joinSha256:hash(await fs.readFile(path.join(root,'tools/continuous-route-join.cjs'))),coreEquality:true,status:'candidate-unreviewed'});
}
for(let i=0;i<routes.length;i+=4){
 const batch=routes.slice(i,i+4),overview=[],joins=[];
 for(const [row,r]of batch.entries()){
  const label=Buffer.from(`<svg width="2560" height="32"><rect width="100%" height="100%" fill="#18232c"/><text x="12" y="23" font-size="20" fill="white">${r.id} / ${r.kind} — candidate</text></svg>`);
  overview.push({input:label,left:0,top:row*320},{input:path.join(out,r.id+'-overview.png'),left:0,top:row*320+32});
  joins.push({input:await sharp(label).resize(2048,26).png().toBuffer(),left:0,top:row*602},{input:path.join(out,r.id+'-joins.png'),left:0,top:row*602+26});
 }
 await sharp({create:{width:2560,height:batch.length*320,channels:3,background:'#18232c'}}).composite(overview).png().toFile(path.join(out,`sheet-${String(i/4+1).padStart(2,'0')}.png`));
 await sharp({create:{width:2048,height:batch.length*602,channels:3,background:'#18232c'}}).composite(joins).png().toFile(path.join(out,`joins-${String(i/4+1).padStart(2,'0')}.png`));
}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({candidateOnly:true,roads:report},null,2));
console.log(JSON.stringify({roads:report.length,cityCoreEqualities:report.length*2,sheets:Math.ceil(report.length/4),out}));
