// Delivery conversion only. All visual edits are made with imagegen.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const repo=path.resolve(__dirname,'../..');
const manifest=require('./story-scene-review/finale-provenance.json');
async function main(){
  for(const row of manifest.images){
    const master=path.join(repo,row.master),asset=path.join(repo,row.asset);
    if(fs.existsSync(asset))throw new Error('Refuse replacement: '+row.asset);
    fs.mkdirSync(path.dirname(master),{recursive:true});
    if(!fs.existsSync(master))fs.copyFileSync(row.source,master);
    const m=await sharp(master).metadata();
    if(m.width<1536||m.height<864)throw new Error('Master too small: '+row.id);
    await sharp(master).rotate().resize(1024,576,{fit:'cover',position:'centre'})
      .toColourspace('srgb').webp({quality:86,effort:6}).toFile(asset);
    console.log(JSON.stringify({id:row.id,master:[m.width,m.height],asset:row.asset,
      bytes:fs.statSync(asset).size}));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
