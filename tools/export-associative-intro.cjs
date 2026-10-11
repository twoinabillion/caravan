// Delivery-only normalization. Original generated masters remain untouched.
const fs=require('node:fs'),sharp=require('sharp');
const manifest=JSON.parse(fs.readFileSync('assets/intro/associative-v1/provenance.json','utf8'));
(async()=>{
  for(const entry of manifest.assets.filter(e=>e.delivery)){
    const source=await sharp(entry.master).metadata();
    if(source.width<1536||source.height<864)throw Error(entry.id+' insufficient master');
    const bytes=await sharp(entry.master).rotate().resize(1024,576,{fit:'cover',position:'centre'})
      .toColourspace('srgb').webp({quality:74,effort:6}).toBuffer();
    fs.writeFileSync(entry.delivery,bytes);
    console.log(entry.delivery,bytes.length,'bytes');
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
