// Delivery normalization only: no sharpening, recoloring, seam edits or warping.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root=path.resolve(__dirname,'..');
(async()=>{
 const version=Number(process.argv[2]);
 if(!Number.isInteger(version)||version<1)throw Error('Positive version required');
 const directory=path.join(root,'tools/design-drafts/scenery-seam-hd');
 const receipt=JSON.parse(fs.readFileSync(path.join(directory,`generation-v${version}.json`),'utf8'));
 const source=receipt.generatedSource,m=await sharp(source).metadata();
 if(!m.hasAlpha||m.width<1024||Math.abs(m.width/m.height-16/9)>.005)throw Error('Requires >=1024px wide 16:9 alpha source; never upscale');
 const assetDir=path.join(root,'assets/ui/road-connectors');fs.mkdirSync(assetDir,{recursive:true});
 const master=path.join(directory,`miryang-daegu-v${version}.png`);
 const file=path.join(assetDir,`miryang-daegu-v${version}.webp`);
 if(fs.existsSync(master)||fs.existsSync(file))throw Error('Refusing to overwrite a candidate');
 fs.copyFileSync(source,master);
 await sharp(master).resize({width:1024}).toColourspace('srgb').webp({quality:94,alphaQuality:100,effort:6}).toFile(file);
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let topClear=0,bottomOpaque=0;for(let x=0;x<info.width;x++){topClear+=data[x*4+3]===0;bottomOpaque+=data[((info.height-1)*info.width+x)*4+3]===255;}
 const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
 if(info.width!==1024||info.height!==576)throw Error('Proportional delivery must round to 1024x576');
 const report={...receipt,version,master:path.relative(root,master),actualMaster:[m.width,m.height],file:path.relative(root,file),delivery:[info.width,info.height],bytes:fs.statSync(file).size,sha256:hash(file),normalization:'Proportional width resize, sRGB WebP q94/alpha100; no art edits, no upsampling.',canonicalCities:['miryang','daegu'].map(id=>({id,file:`assets/ui/road-environment/${id}-v1.webp`,sha256:hash(path.join(root,`assets/ui/road-environment/${id}-v1.webp`))})),alpha:{topClear,bottomOpaque,width:info.width},gameEnabled:false,visualApproval:false};
 fs.writeFileSync(path.join(directory,`provenance-v${version}.json`),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({file:report.file,master:report.actualMaster,bytes:report.bytes,alpha:report.alpha}));
})().catch(error=>{console.error(error);process.exitCode=1;});
