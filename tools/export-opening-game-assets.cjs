// Approved art, delivery-only resizing/compression. Keep every master and draft.
const sharp=require('sharp');
const plates=[
 ['opening-wharf/masters/harbor-v1.png','opening-wharf-v1.webp'],
 ['opening-extra-pack/masters/fuel-v1.png','opening-pack-fuel-v1.webp'],
 ['opening-extra-pack/masters/repair-v1.png','opening-pack-repair-v1.webp'],
 ['opening-extra-pack/masters/provisions-v1.png','opening-pack-provisions-v1.webp']
];
(async()=>{
 for(const [master,delivery] of plates){
  const result=await sharp('tools/design-drafts/'+master).resize(768,432,{fit:'cover'}).webp({quality:65,effort:6}).toFile('assets/scenes/'+delivery);
  console.log(delivery,result.width,result.height,result.size);
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
