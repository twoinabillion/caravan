// Delivery scaling only. Originals stay intact; no painted edits.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.join(__dirname,'opening-extra-pack');
async function main(){
 fs.mkdirSync(path.join(root,'masters'),{recursive:true});
 for(const [id,filename] of [
  ['fuel','exec-7b803924-842a-4424-8aba-29966e788f41.png'],
  ['repair','exec-b706cc51-be81-4dc7-9a9b-917979c8ff21.png'],
  ['provisions','exec-7d852287-de3e-4584-91d1-82865786124e.png']
 ]){
  const master=path.join(root,'masters',`${id}-v1.png`);
  if(!fs.existsSync(master))fs.copyFileSync(path.join('/Users/sang/.codex/generated_images/01a04658-25c4-7233-a788-566416fa086d',filename),master);
  const delivery=path.join(root,`${id}-v1.webp`);
  if(!fs.existsSync(delivery))await sharp(master).resize(1024,576,{fit:'cover'}).webp({quality:86}).toFile(delivery);
  console.log(id,await sharp(delivery).metadata());
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
