// Deterministic delivery export only; all scene editing uses imagegen.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.join(__dirname,'story-scene-review');
const source='/Users/sang/.codex/generated_images/01a04658-25c4-7233-a788-566416fa086d/exec-aee25b24-801b-4def-ad0c-85de26860a0e.png';
const master=path.join(root,'masters','key-mounted-v1.png');
const delivery=path.resolve(__dirname,'../../assets/scenes/family-verification-key-mounted-v3.webp');
async function main(){
  fs.mkdirSync(path.dirname(master),{recursive:true});
  if(!fs.existsSync(master))fs.copyFileSync(source,master);
  // Refuse accidental replacement of a reviewed sibling.
  if(fs.existsSync(delivery))throw new Error('Delivery already exists; use a new version for revisions.');
  await sharp(master).rotate().resize(1024,576,{fit:'cover',position:'centre'})
    .toColourspace('srgb').webp({quality:86,effort:6}).toFile(delivery);
  console.log(JSON.stringify({master,delivery,metadata:await sharp(delivery).metadata()}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
