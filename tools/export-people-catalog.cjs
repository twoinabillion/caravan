'use strict';
// Mechanical draft-only delivery export. Masters remain untouched.
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const root=path.join(__dirname,'design-drafts','people-catalog');
async function run(){
  const out=path.join(root,'previews');fs.mkdirSync(out,{recursive:true});
  const names=fs.readdirSync(path.join(root,'masters')).filter(n=>n.endsWith('.png'));
  let bytes=0;
  for(const name of names){
    const input=path.join(root,'masters',name),output=path.join(out,name.replace(/\.png$/,'.webp'));
    if(!fs.existsSync(output)||fs.statSync(output).mtimeMs<fs.statSync(input).mtimeMs){
      await sharp(input).resize({width:512,height:768,fit:'inside',withoutEnlargement:true}).webp({quality:86,alphaQuality:100}).toFile(output);
    }
    bytes+=fs.statSync(output).size;
  }
  return {exported:names.length,bytes};
}
if(require.main===module)run().then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={run};
