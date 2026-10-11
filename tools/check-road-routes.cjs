// Read-only by default. --record updates mechanical geometry, never visual QA.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),crypto=require('node:crypto');
const {catalogue}=require('./road-route-plan.cjs');
const root=path.resolve(__dirname,'..'),file=path.join(root,'assets/ui/road-routes/manifest.json');
async function main(){
 const manifest=JSON.parse(fs.readFileSync(file,'utf8')),expected=catalogue().routes;
 if(manifest.routes.length!==expected.length||new Set(manifest.routes.map(r=>r.id)).size!==expected.length)throw Error('Graph coverage changed');
 const report={places:58,corridors:78,directions:156,generated:0,geometryPassed:0,visualApproved:0,missing:[],issues:[]};
 for(const route of expected){
   const entry=manifest.routes.find(r=>r.id===route.id);
   if(!entry||entry.from!==route.from||entry.to!==route.to||entry.km!==route.km)throw Error('Route differs from actual graph: '+route.id);
   if(!entry.master){report.missing.push(route.id);continue;}
   report.generated++;
   const asset=path.join(root,'assets/ui/road-routes',entry.file),bytes=fs.readFileSync(asset);
   if(crypto.createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Unrecorded asset change: '+entry.id);
   if(!fs.existsSync(path.join(root,entry.master)))throw Error('Missing master: '+entry.id);
   for(const ref of entry.provenance.references)if(!fs.existsSync(path.isAbsolute(ref)?ref:path.join(root,ref)))throw Error('Missing canonical reference: '+ref);
   const {data,info}=await sharp(asset).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let transparent=0,opaque=0,minimumGroundAlpha=255;
   for(let x=0;x<info.width;x++){
     transparent+=data[x*4+3]===0;const alpha=data[((info.height-1)*info.width+x)*4+3];minimumGroundAlpha=Math.min(minimumGroundAlpha,alpha);opaque+=alpha>=240;
   }
   const pass=info.width===1024&&info.height===576&&transparent===info.width&&opaque===info.width&&bytes.length<150000;
   if(pass)report.geometryPassed++;else report.issues.push({id:entry.id,width:info.width,height:info.height,transparent,opaque,minimumGroundAlpha});
   if(Object.values(entry.acceptance).every(Boolean))report.visualApproved++;
   if(process.argv.includes('--record')){
     entry.acceptance.geometry=pass;
     entry.geometry={transparentTopPixels:transparent,opaqueGroundPixels:opaque,minimumGroundAlpha,reinforcedMinimumAlpha:1-Math.pow(1-minimumGroundAlpha/255,2)};
   }
 }
 if(process.argv.includes('--record'))fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 if(report.issues.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
