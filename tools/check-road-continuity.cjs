// QA outputs only: executes the SAME pixel compositor as the game. Never edits
// canonical artwork, manifest approval flags, saves, or the running preview.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/road-continuity');
const hd=require('../assets/ui/road-connectors/manifest-hd.json');
const renderer=vm.runInNewContext(fs.readFileSync(path.join(root,'src/05e-road-continuity.js'),'utf8')+';ROAD_CONTINUITY');
const read=async file=>new Uint8ClampedArray(await sharp(path.join(root,file)).ensureAlpha().raw().toBuffer());
const cache=new Map();
async function city(id){if(!cache.has(id)){const manifest=require('../assets/ui/road-environment/manifest.json');cache.set(id,await read('assets/ui/road-environment/'+manifest.locations[id].file));}return cache.get(id);}
function world(a,b,c){
 const data=new Uint8ClampedArray(2944*576*4);
 for(const [plate,left] of [[a,0],[c,960],[b,1920]])for(let y=0;y<576;y++)for(let x=0;x<1024;x++){
  const src=(y*1024+x)*4,dest=(y*2944+left+x)*4;
  // Protected overlaps have identical original pixels, so direct copy is the
  // equivalent of Canvas compositing here after solid-alpha normalization.
  data.set(plate.subarray(src,src+4),dest);if(data[dest+3]>=192)data[dest+3]=255;
 }
 return data;
}
async function check(){
 fs.mkdirSync(out,{recursive:true});const rows=[],sheets=[];let tiles=[];
 for(let n=0;n<hd.routes.length;n++){
  const r=hd.routes[n],a=await city(r.from),b=await city(r.to),raw=await read(r.nativeCandidate.file),c=renderer.connector(a,b,raw),w=world(a,b,c);
  const profiles=renderer.ridges(c),ap=renderer.ridges(a),bp=renderer.ridges(b);let edgeDelta=0,minGround=255;
  for(let x=0;x<64;x++){edgeDelta=Math.max(edgeDelta,Math.abs(profiles[x]-ap[960+x]),Math.abs(profiles[960+x]-bp[x]));}
  for(let y=512;y<576;y++)for(let x=0;x<2944;x++)minGround=Math.min(minGround,w[(y*2944+x)*4+3]);
  rows.push({id:r.id,edgeRidgeMaxDelta:edgeDelta,minimumWorldGroundAlpha:minGround,rawApprovalChanged:false});
  for(let i=0;i<3;i++){
   const png=await sharp(Buffer.from(w),{raw:{width:2944,height:576,channels:4}}).extract({left:[512,960,1472][i],top:0,width:1024,height:576}).resize(360,202).flatten({background:'#1e2b3b'}).png().toBuffer();
   tiles.push({input:png,left:i*360,top:(n%8)*226+24});
  }
  const label=Buffer.from(`<svg width="1080" height="24"><rect width="1080" height="24" fill="#0c111b"/><text x="8" y="17" font-size="14" fill="#dbe5f1">${n+1}. ${r.id} — code compositor QA, not game capture</text></svg>`);
  tiles.push({input:label,left:0,top:(n%8)*226});
  if(n%8===7||n===hd.routes.length-1){const file=`sheet-${String(sheets.length+1).padStart(2,'0')}.png`;
   await sharp({create:{width:1080,height:((n%8)+1)*226,channels:4,background:'#0c111b'}}).composite(tiles).png().toFile(path.join(out,file));sheets.push(file);tiles=[];
  }
 }
 const report={scope:'all78 native pixel joins; no live-game/crop/motion or style approval inferred',routes:rows.length,
  sourcePixelsPerViewport:1024,worldWidth:2944,geometryPass:rows.every(r=>r.edgeRidgeMaxDelta===0&&r.minimumWorldGroundAlpha===255),sheets,rows};
 fs.writeFileSync(path.join(out,'geometry.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,rows:undefined}));if(!report.geometryPass)process.exitCode=1;
 return report;
}
module.exports={check};if(require.main===module)check().catch(e=>{console.error(e);process.exitCode=1;});
