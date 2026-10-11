// Mechanical alternate deliveries from existing full-resolution corridor masters.
// No generation, art retouch, sharpening, alpha modification or column stretching.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const {root,dir,sha}=require('./road-hd-plan.cjs'),{measure,productionGeometry}=require('./road-hd-quality.cjs');
async function main(){
 const file=path.join(root,'assets/ui/road-connectors/manifest-hd.json'),p=JSON.parse(fs.readFileSync(file));
 const previous=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-routes/manifest.json')));
 const provenanceDir=path.join(dir,'provenance');fs.mkdirSync(provenanceDir,{recursive:true});
 for(const r of p.routes){
  if(r.nativeCandidate)continue;
  const old=previous.routes.find(n=>n.id===r.id);if(!old)throw Error('No source for real corridor '+r.id);
  const m=await sharp(path.join(root,old.master)).metadata(),w=Math.floor(m.width/2),h=Math.round(w*9/16);
  if(w<1024||h>m.height||!m.hasAlpha)throw Error('Native pixels insufficient '+r.id);
  const crop={left:Math.floor((m.width-w)/2),top:m.height-h,width:w,height:h};
  const asset=`assets/ui/road-connectors/${r.id}-native-v1.webp`;
  if(fs.existsSync(path.join(root,asset)))throw Error('Refuse to overwrite '+asset);
  await sharp(path.join(root,old.master)).extract(crop).resize({width:1024}).toColourspace('srgb').webp({quality:94,alphaQuality:100,effort:6}).toFile(path.join(root,asset));
  const geometry=await measure(path.join(root,asset),r),bytes=fs.statSync(path.join(root,asset)).size;
  const provenance=`tools/design-drafts/scenery-hd/provenance/${r.id}-native-v1.json`;
  const receipt={route:r.id,kind:'mechanical-native-master-crop',generation:old.provenance,
   sourceMaster:old.master,sourceSha256:sha(old.master),actualMaster:[m.width,m.height],crop,
   sourcePixelsPerViewport:w,delivery:[1024,576],file:asset,sha256:sha(asset),bytes,
   normalization:'Middle half at native resolution; bottom-aligned16:9crop; proportional downscale; sRGB WebPq94 alpha100. No retouch/alpha painting/sharpening/upscale/strip warp.',
   canonicalCities:r.canonicalCities,geometry,gameEnabled:false,visualApproval:false,
   limitations:['Existing high-resolution source is not a new generation.','Unretained historical prompts remain unretained; current planned prompt is not a historical receipt.','Crop may include a landmark and may mismatch canonical city ridges; requires per-file visual and edge review.']};
  fs.writeFileSync(path.join(root,provenance),JSON.stringify(receipt,null,2)+'\n');
  r.nativeCandidate={file:asset,bytes,sha256:receipt.sha256,sourceMaster:old.master,actualMaster:receipt.actualMaster,crop,sourcePixelsPerViewport:w,geometry,provenance,status:'derived-needs-review',acceptance:{...r.acceptance,geometry:productionGeometry(geometry)}};
  fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
  console.log(JSON.stringify({id:r.id,sourcePixelsPerViewport:w,bytes,productionGeometry:productionGeometry(geometry)}));
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
