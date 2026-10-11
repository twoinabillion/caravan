// Deterministic delivery normalization/provenance, not an image editor.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),crypto=require('node:crypto');
const {catalogue,prompt}=require('./road-route-plan.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/ui/road-routes');
const masterDir=path.join(root,'tools/design-drafts/scenery-routes/masters');
const manifestFile=path.join(dir,'manifest.json');
const references=JSON.parse(fs.readFileSync(path.join(root,'assets/visual-contract.json'),'utf8')).requiredReferences
 .concat('tools/design-drafts/scenery-route/masters/miryang-daegu-v1.png');
async function main(){
 if(process.argv[2]==='--init'){
   fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(masterDir,{recursive:true});
   if(fs.existsSync(manifestFile))throw Error('Catalogue exists; refusing to replace progress.');
   fs.writeFileSync(manifestFile,JSON.stringify({...catalogue(),enabled:false,purpose:'live-road-route-components',delivery:[1024,576],crop:[0,235,1024,341],references},null,2)+'\n');
   console.log('Initialized78 distinct corridors /156 directions; no gameplay enabled.');return;
 }
 const id=process.argv[2],source=process.argv[3];
 const versionArg=process.argv.find(a=>a.startsWith('--version='));
 const version=versionArg?Number(versionArg.split('=')[1]):1;
 if(!Number.isInteger(version)||version<1)throw Error('Positive integer version required');
 const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 const entry=manifest.routes.find(r=>r.id===id);if(!entry)throw Error('Unknown route');
 if(!source||!fs.existsSync(source))throw Error('Generated master required');
 const file=id+'-v'+version+'.webp';
 const master=path.join(masterDir,id+'-v'+version+'.png'),delivery=path.join(dir,file);
 if(fs.existsSync(master)||fs.existsSync(delivery))throw Error('Use a versioned sibling; never overwrite accepted output');
 const metadata=await sharp(source).metadata();
 if(!metadata.hasAlpha||metadata.width<2048||Math.abs(metadata.width/metadata.height-3)>.02){
   entry.rejectedCandidates=(entry.rejectedCandidates||[]).concat({source,actualMaster:[metadata.width,metadata.height],hasAlpha:metadata.hasAlpha,reason:'Master must be large3:1 RGBA'});
   fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
   throw Error('Master must be large3:1 RGBA');
 }
 const receiptArg=process.argv.find(a=>a.startsWith('--receipt='));
 const receipt=receiptArg?JSON.parse(fs.readFileSync(receiptArg.slice('--receipt='.length),'utf8')):null;
 if(receipt&&(!receipt.prompt||!Array.isArray(receipt.references)||receipt.generatedSource!==source))throw Error('Receipt must match this generation');
 if(entry.master){
   entry.previousCandidates=(entry.previousCandidates||[]).concat({file:entry.file,master:entry.master,sha256:entry.sha256,bytes:entry.bytes,provenance:entry.provenance,geometry:entry.geometry,acceptance:entry.acceptance});
 }
 fs.copyFileSync(source,master);
 const resized=await sharp(master).rotate().resize({width:1024}).toColourspace('srgb').toBuffer({resolveWithObject:true});
 await sharp(resized.data).extend({top:576-resized.info.height,bottom:0,left:0,right:0,background:{r:0,g:0,b:0,alpha:0}})
   .webp({quality:86,effort:6}).toFile(delivery);
 const buffer=fs.readFileSync(delivery);
 entry.acceptance=Object.fromEntries(Object.keys(entry.acceptance).map(k=>[k,false]));
 Object.assign(entry,{file,status:'generated-needs-visual-review',master:path.relative(root,master),actualMaster:[metadata.width,metadata.height],
   crop:[0,576-resized.info.height,1024,resized.info.height],bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),
   provenance:{tool:'image_gen.imagegen',generatedSource:source,references:receipt?.references||references,prompt:receipt?.prompt||(prompt(entry)+'\nThe entire bottommost strip of solid terrain MUST be fully opaque alpha255 across the whole width, even where water is shown; only air above the terrain silhouette is transparent.'),normalization:'Proportional resize, transparent top padding, sRGB WebP q86. No scene editing.'}});
 const {data,info}=await sharp(delivery).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let transparent=0,opaque=0;
 let minimumGroundAlpha=255;
 for(let x=0;x<info.width;x++){
   transparent+=data[x*4+3]===0;
   const alpha=data[((info.height-1)*info.width+x)*4+3];minimumGroundAlpha=Math.min(minimumGroundAlpha,alpha);opaque+=alpha>=240;
 }
 // The road renderer reinforces the SAME texture twice. alpha240 then leaves
 // <0.35% sky bleed, while actual holes and low-alpha water still fail.
 entry.geometry={transparentTopPixels:transparent,opaqueGroundPixels:opaque,minimumGroundAlpha,reinforcedMinimumAlpha:1-Math.pow(1-minimumGroundAlpha/255,2)};
 entry.acceptance.geometry=transparent===info.width&&opaque===info.width&&buffer.length<150000;
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
 require('./build-road-route-review.cjs');
 console.log(JSON.stringify({id,file:path.relative(root,delivery),bytes:buffer.length,geometry:entry.acceptance.geometry,actualMaster:entry.actualMaster}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
