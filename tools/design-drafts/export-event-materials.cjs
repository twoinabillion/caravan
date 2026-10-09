// Mechanical delivery export only. Generated masters remain unchanged.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.join(__dirname,'event-materials');
const generated='/Users/sang/.codex/generated_images/01a04658-25c4-7233-a788-566416fa086d';
async function main(){
 fs.mkdirSync(path.join(root,'masters'),{recursive:true});
 for(const [id,file,width,height] of [
  ['frame','exec-85489bd4-a0f0-4651-934c-3245d9205fcc.png',800,1000],
  ['button','exec-147086ea-5138-4a3e-8f81-9419723d2c1a.png',960,180]
 ]){
  const master=path.join(root,'masters',id+'-v1.png');
  if(!fs.existsSync(master))fs.copyFileSync(path.join(generated,file),master);
  const delivery=path.join(root,id+'-v1.webp');
  await sharp(master).trim().resize(width,height,{fit:'fill'}).webp({quality:88,alphaQuality:100,effort:6}).toFile(delivery);
  const metadata=await sharp(delivery).metadata();
  if(!metadata.hasAlpha)throw new Error('Missing alpha: '+id);
  console.log(id,metadata.width,metadata.height,fs.statSync(delivery).size);
 }
}
main().catch(error=>{console.error(error);process.exitCode=1});
