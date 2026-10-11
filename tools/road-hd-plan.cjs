// HD connector authoring only. Never reads or changes a player save.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {catalogue}=require('./road-route-plan.cjs');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'tools/design-drafts/scenery-hd');
const contract=JSON.parse(fs.readFileSync(path.join(root,'assets/visual-contract.json')));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
function prompt(r){
 return `${contract.prompt.base}\n\nUse case: stylized-concept. Create ONE new high-resolution transparent terrain CONNECTOR component for ${r.endpoints[0].name} -> ${r.endpoints[1].name}, not a city replacement or an event painting.\nInput images1-4: required Caravan canonical style/world references ONLY. Do not copy their people/truck/UI. Input5: four-panel REFERENCE BOARD ONLY. Top-left is the untouched departure city; top-right untouched arrival city. Bottom-left is the approved HD texture/detail target. Bottom-right is a 1024x576 edge GUIDE: left64px is departure city's last64px; right64px arrival city's first64px. Middle blank is the new terrain to invent. Output only the new single terrain component, never the board/panels.\nTechnical: 16:9 RGBA master at least1536x864. Final entire component fits one screen, not a3-screen panorama. Same natural lens, side-view distant landscape scale, desaturated blue-gray grade and neutral diffuse ambient light as actual city edges and HD seed. No source blur, vertical stretching, extreme foreground mass, glossy photo or illustrated outlines.\nNative output edges: LEFT6.25percent must faithfully continue the guide's left terrain contour, silhouette height, colors, foliage, foreground density and baseline; RIGHT6.25percent must continue its right edge. Ridge y-coordinate from top at the first pixel must be about${r.edgeRidge?.left ?? 'the guide'} /576; last pixel about${r.edgeRidge?.right ?? 'the guide'} /576. Preserve shape and position instead of inventing a mountain step. No duplicate endpoint landmark in the connector; cities themselves are separately drawn.\nTerrain transition: ${r.connector}. Interpret this only as the corridor between actual edge silhouettes, not permission to paint entire endpoint cities or their principal landmarks. From ${r.endpoints[0].name}(${r.endpoints[0].bio}) toward ${r.endpoints[1].name}(${r.endpoints[1].bio}); keep water at actual coastal/lake ends, no invented middle city or giant dome/tower.\nAlpha: fully transparent AIR only above the organic mountain/roof/foliage silhouette. Every actual terrain/water/foreground pixel below it, especially bottommost128rows and all bottom-edge pixels, must be solid alpha255. NO transparent ground, lower-edge fade, atmospheric alpha haze, matte fringe or shadow beyond the image. Texture is visibly detailed but restrained, matching approved HD seed.\nEXCLUDE sky/sun/moon/clouds, roads/lanes, people, vehicles, weather, readable text, labels, captions, frames, margins, watermark, landmark clones, city mirroring, collage. ${contract.prompt.negative}`;
}
function plan(){return {schemaVersion:1,purpose:'one-screen-hd-road-connectors',styleId:contract.styleId,delivery:[1024,576],worldViewports:2.875,overlapSourcePx:64,sourcePixelsPerViewport:1024,enabled:false,directionApproval:{by:'Sang',date:'2026-10-10',scope:'HD visual direction and extend to all remaining corridors; not a blanket per-file acceptance'},routes:catalogue().routes.map(r=>({...r,version:1,status:'planned',file:null,acceptance:{geometry:false,style:false,endpoints:false,crop360:false,crop480:false,motion:false,reverse:false,departure:false,arrival:false,eventResume:false,reload:false}}))};}
async function prepare(){
 const sharp=require('sharp');fs.mkdirSync(path.join(dir,'references'),{recursive:true});
 const target='tools/design-drafts/scenery-seam-hd/miryang-daegu-v2.png';
 const seed=await sharp(path.join(root,target)).resize({width:1024}).png().toBuffer();
 const p=plan();
 for(const r of p.routes){
  const cityPaths=r.endpoints.map(e=>e.terrain);
  const left=await sharp(path.join(root,cityPaths[0])).extract({left:960,top:0,width:64,height:576}).png().toBuffer();
  const right=await sharp(path.join(root,cityPaths[1])).extract({left:0,top:0,width:64,height:576}).png().toBuffer();
  const guide=await sharp({create:{width:1024,height:576,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:left,left:0,top:0},{input:right,left:960,top:0}]).png().toBuffer();
  const {data,info}=await sharp(guide).raw().toBuffer({resolveWithObject:true});
  const ridge=x=>{for(let y=0;y<576;y++)if(data[(y*info.width+x)*4+3]>=192)return y;return 575;};
  r.edgeRidge={left:ridge(0),right:ridge(1023)};
  const reference=`tools/design-drafts/scenery-hd/references/${r.id}.png`;
  if(!fs.existsSync(path.join(root,reference)))await sharp({create:{width:2048,height:1152,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:path.join(root,cityPaths[0]),left:0,top:0},{input:path.join(root,cityPaths[1]),left:1024,top:0},{input:seed,left:0,top:576},{input:guide,left:1024,top:576}]).png().toFile(path.join(root,reference));
  r.references=contract.requiredReferences.concat(reference);
  r.canonicalCities=cityPaths.map((file,i)=>({id:r.endpoints[i].id,file,sha256:sha(file)}));
  r.referenceInputs=[...cityPaths,target].map(file=>({file,sha256:sha(file)}));
  r.prompt=prompt(r);
 }
 const file=path.join(root,'assets/ui/road-connectors/manifest-hd.json');
 if(fs.existsSync(file))throw Error('HD catalogue exists; refuse to overwrite progress');
 fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
 console.log(JSON.stringify({routes:p.routes.length,referenceBoards:p.routes.length,enabled:false}));
}
function edgePrompt(r){
 return `${contract.prompt.base}\n\nUse case: compositing. Images1–4 are canonical STYLE/WORLD references only, never people or truck to copy. Image5 is the EDIT TARGET: a1024x576 terrain gap template. Its LEFT64px strip is the exact final64px of canonical ${r.endpoints[0].name}; its RIGHT64px strip the exact first64px of canonical ${r.endpoints[1].name}. Fill ONLY missing center x64..959. Preserve both protected strips' contour height, geometry, color, texture scale and foreground density at proportional scale. Extend their actual contours smoothly through the center. Output only ONE continuous terrain component, never panels or the reference board.\nTechnical: transparent RGBA16:9 master at least1536x864. One screen of detailed terrain, NOT a3-screen panorama. Match natural detailed city textures without blurry resampling, vertical stretching, giant foreground mass or source blur. LEFT first ridge at${r.edgeRidge.left}/576 from TOP (${Math.round((576-r.edgeRidge.left)/576*100)}% canvas from BOTTOM), RIGHT last ridge at${r.edgeRidge.right}/576 from TOP (${Math.round((576-r.edgeRidge.right)/576*100)}% from BOTTOM). Do not lower the entire landscape or add a mountain step. Ground baseline and foreground density must remain fixed.\nMiddle corridor: ${r.connector}. This is the terrain BETWEEN ${r.endpoints[0].name} and ${r.endpoints[1].name}, not permission to reproduce the complete cities, clone their principal landmarks or introduce an intermediate city. Constant distant side-view perspective, restrained desaturated blue-gray diffuse light.\nAlpha: only AIR ABOVE the connected organic silhouette is transparent. Terrain, water and every bottommost128row pixel must be solid alpha255. NO ground haze alpha, lower-edge fade, transparent water, border glow or colored matte fringe. Preserve genuine transparency above the ridge.\nExclude sky, sun, moon, clouds, foreground roads/lanes, vehicles, characters, weather, text, frame, panels, watermark, mirrored cities. ${contract.prompt.negative}`;
}
async function prepareEdges(){
 const sharp=require('sharp'),file=path.join(root,'assets/ui/road-connectors/manifest-hd.json'),p=JSON.parse(fs.readFileSync(file));
 fs.mkdirSync(path.join(dir,'edge-guides'),{recursive:true});
 for(const r of p.routes){
  const guide=`tools/design-drafts/scenery-hd/edge-guides/${r.id}.png`;
  if(!fs.existsSync(path.join(root,guide))){
   const a=await sharp(path.join(root,r.canonicalCities[0].file)).extract({left:960,top:0,width:64,height:576}).png().toBuffer();
   const b=await sharp(path.join(root,r.canonicalCities[1].file)).extract({left:0,top:0,width:64,height:576}).png().toBuffer();
   await sharp({create:{width:1024,height:576,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:a,left:0,top:0},{input:b,left:960,top:0}]).png().toFile(path.join(root,guide));
  }
  r.references=contract.requiredReferences.concat(guide);r.prompt=edgePrompt(r);
  r.referenceInputs=r.canonicalCities.map(({file,sha256})=>({file,sha256})).concat({file:guide,sha256:sha(guide)});
 }
 fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');console.log(JSON.stringify({edgeGuides:p.routes.length,enabled:p.enabled}));
}
module.exports={root,dir,plan,prompt,edgePrompt,sha};
if(require.main===module)(process.argv.includes('--edge-guides')?prepareEdges():prepare()).catch(e=>{console.error(e);process.exitCode=1;});
