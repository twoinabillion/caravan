'use strict';
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const book=path.join(__dirname,'design-drafts','people-catalog');
async function run(){
  const data=JSON.parse(fs.readFileSync(path.join(book,'catalog.json'),'utf8'));
  const checks=[];
  for(const person of data.people.filter(p=>p.status==='draft')){
    const file='masters/'+person.id+'-'+(person.version||'v1')+'.png';
    const input=sharp(path.join(book,file)),meta=await input.metadata();
    const {data:pixels,info}=await input.ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let alphaMin=255,alphaMax=0,edgeMax=0,minX=info.width,minY=info.height,maxX=-1,maxY=-1;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      const a=pixels[(y*info.width+x)*4+3];alphaMin=Math.min(alphaMin,a);alphaMax=Math.max(alphaMax,a);
      if(x===0||y===0||x===info.width-1||y===info.height-1)edgeMax=Math.max(edgeMax,a);
      if(a>=240){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    }
    checks.push({id:person.id,file,width:meta.width,height:meta.height,hasAlpha:meta.hasAlpha,alphaMin,alphaMax,edgeMax,opaqueBounds:[minX,minY,maxX,maxY],geometryPass:meta.width===1024&&meta.height===1536&&meta.hasAlpha&&alphaMin===0&&maxX>=0});
  }
  const result={schemaVersion:1,scope:'File geometry only; not identity, style, matte-edge approval or Studio visual QA.',checks};
  fs.writeFileSync(path.join(book,'geometry-checks.json'),JSON.stringify(result,null,2)+'\n');
  return {checked:checks.length,failed:checks.filter(c=>!c.geometryPass).map(c=>c.id),opaqueTouchesEdge:checks.filter(c=>c.edgeMax>=240).map(c=>c.id)};
}
if(require.main===module)run().then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={run};
