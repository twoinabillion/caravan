// Preserve approved masters/draft/v1. UI-sized export only; no alpha fill.
const sharp=require('sharp');
(async()=>{
  for(const [source,target,w,h] of [
    ['frame-v1.webp','event-reading-frame-v2.webp',320,400],
    ['button-v1.webp','event-material-button-v2.webp',480,90]
  ]){
    const result=await sharp('tools/design-drafts/event-materials/'+source).resize(w,h)
      .webp({quality:55,alphaQuality:100,effort:6}).toFile('assets/ui/'+target);
    console.log(target,result.width,result.height,result.size);
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
