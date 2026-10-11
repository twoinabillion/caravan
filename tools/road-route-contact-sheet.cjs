// Read-only visual QA export. Never replaces a master or gameplay asset.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const manifest=require('../assets/ui/road-routes/manifest.json');
const dir=path.join(root,'tools/design-drafts/scenery-routes/inspection');
async function main(){
 fs.mkdirSync(dir,{recursive:true});
 const routes=manifest.routes.filter(r=>r.master),rows=6,width=1200,height=rows*265;
 for(let start=0;start<routes.length;start+=rows){
  const pieces=[];
  for(const [row,r]of routes.slice(start,start+rows).entries()){
   const label=Buffer.from(`<svg width="1200" height="30"><rect width="1200" height="30" fill="#1c252d"/><text x="12" y="21" fill="#ffffff" font-family="sans-serif" font-size="17">${start+row+1}. ${r.id} — ${r.from} → ${r.to}</text></svg>`);
   const art=await sharp(path.join(root,r.master)).resize({width}).flatten({background:'#7c94a5'}).png().toBuffer();
   // Full 3:1 strip scaled to 1200×400, then downscaled uniformly to fit
   // a 690×230 overview. Three actual viewport crops occupy the other side.
   const overview=await sharp(art).resize({width:690}).png().toBuffer();
   pieces.push({input:label,top:row*265,left:0},{input:overview,top:row*265+30,left:0});
   const metadata=await sharp(art).metadata();
   for(let beat=0;beat<3;beat++){
    const crop=await sharp(art).extract({left:beat*400,top:0,width:400,height:metadata.height}).resize({width:165}).png().toBuffer();
    pieces.push({input:crop,top:row*265+70,left:700+beat*166});
   }
  }
  const file=path.join(dir,`sheet-${String(start/rows+1).padStart(2,'0')}.png`);
  await sharp({create:{width,height,channels:3,background:'#26333d'}}).composite(pieces).png().toFile(file);
  console.log(path.relative(root,file));
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
