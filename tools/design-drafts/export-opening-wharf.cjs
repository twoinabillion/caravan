// Delivery export only: scale canonical-reference-generated masters, no retouching.
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const root=path.join(__dirname,'opening-wharf');
async function main(){
  fs.mkdirSync(path.join(root,'masters'),{recursive:true});
  for(const [id,source] of [
    ['harbor','/Users/sang/.codex/generated_images/01a04658-25c4-7233-a788-566416fa086d/exec-38624deb-4bca-4b9f-9710-57fd7ed2e45b.png'],
    ['cargo','/Users/sang/.codex/generated_images/01a04658-25c4-7233-a788-566416fa086d/exec-745207c0-e378-482e-8b83-c2d7148728e9.png']
  ]){
    const master=path.join(root,'masters',`${id}-v1.png`);
    if(!fs.existsSync(master))fs.copyFileSync(source,master);
    await sharp(master).resize(1024,576,{fit:'cover',position:'centre'}).webp({quality:86}).toFile(path.join(root,`${id}-v1.webp`));
    console.log(id,await sharp(path.join(root,`${id}-v1.webp`)).metadata());
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
