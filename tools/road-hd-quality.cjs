const path=require('node:path'),sharp=require('sharp');
const {root}=require('./road-hd-plan.cjs');
async function measure(file,r){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==1024||info.height!==576)throw Error('HD delivery must be1024x576');
 const ridge=x=>{for(let y=0;y<576;y++)if(data[(y*1024+x)*4+3]>=192)return y;return 575;};
 let topClear=0,bottomSolid=0,minGround=255;
 for(let x=0;x<1024;x++){topClear+=data[x*4+3]===0;bottomSolid+=data[(575*1024+x)*4+3]===255;}
 for(let y=512;y<576;y++)for(let x=0;x<1024;x++)minGround=Math.min(minGround,data[(y*1024+x)*4+3]);
 const edgeProfiles={};
 for(const [i,side] of ['left','right'].entries()){
  const city=await sharp(path.join(root,r.canonicalCities[i].file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let sum=0,maxAbs=0,color=0,colors=0;
  for(let x=0;x<64;x++){
   const cx=i===0?960+x:x,ax=i===0?x:960+x;
   let cy=575;for(let y=0;y<576;y++)if(city.data[(y*1024+cx)*4+3]>=192){cy=y;break;}
   const ay=ridge(ax),d=ay-cy;sum+=d*d;maxAbs=Math.max(maxAbs,Math.abs(d));
   for(let y=Math.max(cy,ay)+8;y<576;y+=8){
    const ca=(y*1024+cx)*4,aa=(y*1024+ax)*4;
    if(city.data[ca+3]>=240&&data[aa+3]>=240)for(let k=0;k<3;k++){color+=Math.abs(city.data[ca+k]-data[aa+k]);colors++;}
   }
  }
  edgeProfiles[side]={ridgeRms:Math.round(Math.sqrt(sum/64)*100)/100,ridgeMaxAbs:maxAbs,meanChannelDifference:colors?Math.round(color/colors*100)/100:null};
 }
 const edgeRidge={left:ridge(0),right:ridge(1023)};
 return {delivery:[1024,576],topClear,bottomSolid,minimumGroundAlpha:minGround,edgeRidge,
  edgeDelta:{left:edgeRidge.left-r.edgeRidge.left,right:edgeRidge.right-r.edgeRidge.right},edgeProfiles,strictSolidGround:bottomSolid===1024&&minGround===255};
}
function productionGeometry(g){return g.topClear===1024&&g.strictSolidGround&&Math.max(...Object.values(g.edgeProfiles).map(e=>e.ridgeMaxAbs))<=3;}
module.exports={measure,productionGeometry};
