// Mechanical delivery normalization. No source retouch, warping, alpha painting or upsampling.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const {root,dir,sha}=require('./road-hd-plan.cjs');
async function main(){
 const [id,receiptFile]=process.argv.slice(2),file=path.join(root,'assets/ui/road-connectors/manifest-hd.json');
 const p=JSON.parse(fs.readFileSync(file)),r=p.routes.find(r=>r.id===id);if(!r)throw Error('Unknown real route');
 const receipt=JSON.parse(fs.readFileSync(receiptFile));
 if(receipt.route!==id||receipt.prompt!==r.prompt||JSON.stringify(receipt.references)!==JSON.stringify(r.references))throw Error('Generation receipt/reference mismatch');
 const source=receipt.generatedSource,m=await sharp(source).metadata();
 const v=receipt.version||1,name=`${id}-v${v}`;
 fs.mkdirSync(path.join(dir,'masters'),{recursive:true});fs.mkdirSync(path.join(dir,'provenance'),{recursive:true});
 const master=path.join(dir,'masters',name+'.png'),asset=path.join(root,'assets/ui/road-connectors',name+'.webp');
 if(fs.existsSync(master)||fs.existsSync(asset))throw Error('Refuse to overwrite candidate');
 fs.copyFileSync(source,master);
 if(!m.hasAlpha||m.width<1536||Math.abs(m.width/m.height-16/9)>.018){
  r.rejectedCandidates=(r.rejectedCandidates||[]).concat({...receipt,master:path.relative(root,master),actualMaster:[m.width,m.height],reason:'Master must be >=1536px16:9alpha; no upscale'});
  fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');throw Error('Master geometry rejected; preserved for repair');
 }
 await sharp(master).resize({width:1024}).toColourspace('srgb').webp({quality:94,alphaQuality:100,effort:6}).toFile(asset);
 const {data,info}=await sharp(asset).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let topClear=0,bottomSolid=0,minGround=255;
 for(let x=0;x<1024;x++){topClear+=data[x*4+3]===0;bottomSolid+=data[((info.height-1)*1024+x)*4+3]===255;}
 for(let y=info.height-64;y<info.height;y++)for(let x=0;x<1024;x++)minGround=Math.min(minGround,data[(y*1024+x)*4+3]);
 const ridge=x=>{for(let y=0;y<info.height;y++)if(data[(y*1024+x)*4+3]>=192)return y;return info.height-1;};
 const measured={left:ridge(0),right:ridge(1023)},edgeDelta={left:measured.left-r.edgeRidge.left,right:measured.right-r.edgeRidge.right};
 const edgeProfiles={};
 for(const [i,side] of ['left','right'].entries()){
  const city=await sharp(path.join(root,r.canonicalCities[i].file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let sum=0,maxAbs=0,color=0,colors=0;
  for(let x=0;x<64;x++){
   const cx=i===0?960+x:x,ax=i===0?x:960+x;
   let cy=575;for(let y=0;y<576;y++)if(city.data[(y*1024+cx)*4+3]>=192){cy=y;break;}
   const d=ridge(ax)-cy;sum+=d*d;maxAbs=Math.max(maxAbs,Math.abs(d));
   for(let y=Math.max(cy,ridge(ax))+8;y<576;y+=8){
    const ca=(y*1024+cx)*4,aa=(y*1024+ax)*4;
    if(city.data[ca+3]>=240&&data[aa+3]>=240)for(let k=0;k<3;k++){color+=Math.abs(city.data[ca+k]-data[aa+k]);colors++;}
   }
  }
  edgeProfiles[side]={ridgeRms:Math.round(Math.sqrt(sum/64)*100)/100,ridgeMaxAbs:maxAbs,meanChannelDifference:colors?Math.round(color/colors*100)/100:null};
 }
 const geometry={delivery:[info.width,info.height],topClear,bottomSolid,minimumGroundAlpha:minGround,edgeRidge:measured,edgeDelta,edgeProfiles,strictSolidGround:bottomSolid===1024&&minGround===255};
 const productionGeometry=info.width===1024&&info.height===576&&topClear===1024&&geometry.strictSolidGround&&Math.max(...Object.values(edgeProfiles).map(e=>e.ridgeMaxAbs))<=3;
 const provenance={...receipt,master:path.relative(root,master),actualMaster:[m.width,m.height],file:path.relative(root,asset),sha256:sha(path.relative(root,asset)),bytes:fs.statSync(asset).size,normalization:'Proportional resize1024px, sRGB WebPq94 alpha100; preserved alpha/no retouch/no upscale',canonicalCities:r.canonicalCities,referenceInputs:r.referenceInputs,geometry,gameEnabled:false,visualApproval:false};
 fs.writeFileSync(path.join(dir,'provenance',name+'.json'),JSON.stringify(provenance,null,2)+'\n');
 if(r.file)r.previousCandidates=(r.previousCandidates||[]).concat({file:r.file,master:r.master,geometry:r.geometry,sha256:r.sha256,version:r.version});
 Object.assign(r,{version:v,file:provenance.file,master:provenance.master,sha256:provenance.sha256,bytes:provenance.bytes,provenance:`tools/design-drafts/scenery-hd/provenance/${name}.json`,status:'generated-needs-review',geometry,acceptance:{...r.acceptance,geometry:productionGeometry}});
 fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
 console.log(JSON.stringify({id,version:v,bytes:r.bytes,geometry,productionGeometry}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
