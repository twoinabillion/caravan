// Labeled QA contact sheets only. Never feeds labels back into scene art.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const {root,dir}=require('./road-hd-plan.cjs');
async function main(){
 const p=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-connectors/manifest-hd.json'))),out=path.join(dir,'contact-sheets');fs.mkdirSync(out,{recursive:true});
 for(let n=0;n<p.routes.length;n+=8){
  const tiles=[];
  for(const [i,r] of p.routes.slice(n,n+8).entries()){
   if(!r.nativeCandidate)throw Error('Missing native candidate '+r.id);
   const g=r.nativeCandidate.geometry,label=`${r.id} | ridge ${g.edgeProfiles.left.ridgeMaxAbs}/${g.edgeProfiles.right.ridgeMaxAbs} | alpha ${g.minimumGroundAlpha}`;
   const thumb=await sharp(path.join(root,r.nativeCandidate.file)).resize({width:512}).png().toBuffer();
   const text=Buffer.from(`<svg width="512" height="36"><rect width="512" height="36" fill="#142129"/><text x="8" y="24" font-family="sans-serif" font-size="13" fill="#f0ead7">${label}</text></svg>`);
   const left=(i%4)*512,top=Math.floor(i/4)*324;tiles.push({input:text,left,top},{input:thumb,left,top:top+36});
  }
  await sharp({create:{width:2048,height:648,channels:4,background:'#8093a6'}}).composite(tiles).png().toFile(path.join(out,`native-${String(n/8+1).padStart(2,'0')}.png`));
 }
 console.log(JSON.stringify({sheets:Math.ceil(p.routes.length/8),routes:p.routes.length,kind:'QA, not game art or current-scene proof'}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
