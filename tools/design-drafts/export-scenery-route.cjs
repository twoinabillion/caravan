// Deterministic resizing/padding only. Scene creation/editing belongs to imagegen.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.join(__dirname,'scenery-route');
const source='/Users/sang/.codex/generated_images/01a04658-25c4-7233-a788-566416fa086d/exec-8972dceb-833a-469e-b65b-7825d7788737.png';
const master=path.join(root,'masters','miryang-daegu-v1.png');
const delivery=path.join(root,'miryang-daegu-v1.webp');
async function main(){
  fs.mkdirSync(path.dirname(master),{recursive:true});
  if(!fs.existsSync(master))fs.copyFileSync(source,master);
  if(fs.existsSync(delivery))throw new Error('Delivery already exists; use a new version.');
  const resized=await sharp(master).rotate().resize({width:1024}).toBuffer({resolveWithObject:true});
  if(resized.info.height>576)throw new Error('Terrain cannot fit canonical delivery without cropping.');
  await sharp(resized.data).extend({top:576-resized.info.height,bottom:0,left:0,right:0,background:{r:0,g:0,b:0,alpha:0}})
    .toColourspace('srgb').webp({quality:86,effort:6}).toFile(delivery);
  console.log(JSON.stringify({master,delivery,metadata:await sharp(delivery).metadata()}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
