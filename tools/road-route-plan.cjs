// Authoring catalogue only. No game state, random encounters or distance changes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const data=()=>vm.runInNewContext(fs.readFileSync(path.join(root,'src/03-data.js'),'utf8')+';D');
const key=(a,b)=>[a,b].sort().join('--');
const bridges={
 'busan--yangsan':'dock warehouses thin into worn industrial yards and riverbank reeds, ending below the broken concrete overpass; no intact bridge',
 'busan--gimhae':'port storage yards gradually give way to a low river plain, field plots and abandoned airport fringe; cranes only at the dock end',
 'miryang--yangsan':'the broken overpass columns recede into low farm sheds, orchard rows and open paddies before the modest market roofs; the overpass is at Yangsan, not Miryang',
 'daegu--miryang':'low market roofs thin into orchard rows, farm sheds and open fields, then weathered apartments and the low broad fictional dome in the Daegu basin',
 'gangneung--pohang':'long east-coast shoreline, small fishing villages, wooded coastal slopes and sparse industrial yards; steelworks only at Pohang, no invented metropolis in the middle',
 'daegwallyeong--gangneung':'grassy high pass and distant wind turbines descend through wooded foothills into a low sandy east-coast settlement; wind turbines only at the high-pass end',
 'gangneung--sokcho':'sandy east-coast bays and small villages gradually become a working fishing port; no west-coast mudflat',
 'chungju--danyang':'river terraces and restrained limestone outcrops gradually broaden into a reservoir shoreline; no sea or port cranes',
 'seoul--suwon':'weathered urban fringe, allotment plots and increasingly dense Korean apartments leading to the distant Namsan ridge and small existing tower; fortress remains at Suwon end',
 'lighthouse--nonsan':'a west-coast low lighthouse headland gradually recedes through coastal field margins into the inland plain; no lighthouse in Nonsan',
 'gunsan--lighthouse':'old inner-port warehouses and small fishing hulls thin into low west-coast shore and lighthouse headland',
 'jinju--yeosu':'riverbank fields and modest villages gradually meet southern coastal inlets and harbour buildings; no sea at the Jinju endpoint',
 'suncheon--yeosu':'southern harbour buildings thin into low coastal fields and broad reed beds; no high cliffs or east-coast beach',
 'maehwa--suncheon':'reed-bed margins meet low villages and river orchards; restrained plum trees are trees, not a blanket of seasonless pink blossom',
 'damyang--gwangju':'market outskirts and allotment plots gradually meet low foothills and a bamboo grove; no towering screen-covering bamboo wall',
 'damyang--namwon':'bamboo margins thin into villages and open river-valley fields near the modest historic pavilion',
 'gimcheon--jaeyi_cache':'fields and low storage sheds continue into a secluded modest warehouse yard, not a futuristic bunker or new city',
 'mingyu_ridge--yeongdong':'vineyard rows thin into low wooded slopes and the small ridge signal point; no giant military tower',
 'cablecar--mungyeong':'historic pass foothills and wooded slopes lead toward a stopped small gondola suspended on cables in the distance; no moving cabin',
 'filmset--namwon':'ordinary river-valley fields and farm sheds separate the real pavilion village from a modest, weathered imitation period set; no monumental palace',
};
function connector(d,a,b){
 const explicit=bridges[key(a,b)];if(explicit)return explicit;
 const bios=[d.nodeBio[a],d.nodeBio[b]],road=d.edges.find(e=>key(e[0],e[1])===key(a,b))[3];
 if(bios.includes('coast'))return 'low coastal or harbour outskirts recede through fields and modest villages toward the other endpoint; sea confined to the coastal end unless both endpoints are coastal';
 if(bios.includes('lake'))return 'river or reservoir margins, low agricultural terraces and modest farm buildings connect the two actual endpoint silhouettes; water is not an ocean';
 if(bios.includes('bamboo'))return 'bamboo margins, small farm plots and restrained wooded foothills connect the endpoint terrain';
 if(bios.includes('mount')||road==='rough')return 'wooded Korean foothills, small valley fields and occasional low farm sheds connect the two places; low readable terrain, no huge ridge hiding a seam';
 if(bios.every(x=>x==='city'))return 'sparse weathered urban fringe and allotment fields separate the two actual city landmarks, with no new named middle city';
 return 'low field plots, orchard rows, modest farm sheds and gently wooded hills connect the two actual endpoint landscapes; dense buildings thin naturally before returning at the destination';
}
function catalogue(){
 const d=data();return {schemaVersion:1,styleId:'caravan-grounded-cinematic-v1',scope:'all real graph edges, both directions; illustrative terrain, not surveyed road geography',
   routes:d.edges.map(([a,b,km,road])=>({id:key(a,b),from:a,to:b,km,road,
     endpoints:[a,b].map(id=>({id,name:d.nodes[id].name,description:d.nodes[id].desc,bio:d.nodeBio[id],scenery:d.nodeScenery[id]||'',terrain:`assets/ui/road-environment/${id}-v1.webp`})),
     connector:connector(d,a,b),status:key(a,b)===key('miryang','daegu')?'draft-generated':'planned',file:`${key(a,b)}-v1.webp`,
     acceptance:{geometry:false,style:false,endpoints:false,crop360:false,crop480:false,motion:false,reverse:false,departure:false,arrival:false,eventResume:false,reload:false}}))};
}
function prompt(r){
 const c=JSON.parse(fs.readFileSync(path.join(root,'assets/visual-contract.json'),'utf8'));
 return `Create ONE continuous transparent terrain panorama for ${r.endpoints[0].name} -> ${r.endpoints[1].name}, one real ${r.km}km ${r.road} corridor in Seoul to 400km. References1-4 are mandatory canonical STYLE/WORLD references only: reproduce NO people, vehicles, captions or panels. Reference5 is the approved ultra-wide TERRAIN construction target, not geography to copy.\n${c.prompt.base}\nTECHNICAL: large master aim3072x1024 ultra-wide3:1 RGBA. Genuine transparent sky above silhouettes, roughly60% empty air. One uninterrupted side-view distant terrain, bottom40% continuous solid level ground at the same baseline. No baked sky, sun, clouds, foreground road, lanes, vehicles, people, weather or HUD. It is a live environment component, NOT an event painting, screenshot or collage. NO blue/green/white matte fringe along alpha edges.\nLEFT QUARTER: ${r.endpoints[0].name}; ${r.endpoints[0].description}; biome ${r.endpoints[0].bio}, distinctive terrain ${r.endpoints[0].scenery||'modest local landscape'}. RIGHT QUARTER: ${r.endpoints[1].name}; ${r.endpoints[1].description}; biome ${r.endpoints[1].bio}, distinctive terrain ${r.endpoints[1].scenery||'modest local landscape'}. These are authored fictional project silhouettes, not invitations to invent new landmarks. Keep complete principal landmark within its own quarter with margin. Day-neutral soft ambient light even if the place name mentions night. No named inhabitants.\nMIDDLE HALF: ${r.connector}. Preserve constant lens, eye level, terrain scale, ground baseline, continuous texture and ridge lines. No vertical seam, ghost buildings, stitched panels, huge foreground hill/tunnel covering the join. The geography connects gradually within ONE strip. It is illustrative geography, not a surveyed road. No Miryang market or Daegu dome unless one is actually an endpoint.\nEXCLUDE: ${c.prompt.negative}`;
}
module.exports={catalogue,prompt,key};
if(require.main===module){
 const c=catalogue();
 if(process.argv[2]==='--prompt'){
   const route=c.routes.find(r=>r.id===process.argv[3]);if(!route)throw Error('Unknown route');console.log(prompt(route));
 }
 else if(process.argv.includes('--json'))console.log(JSON.stringify(c,null,2));
 else console.log(JSON.stringify({places:58,corridors:c.routes.length,directions:c.routes.length*2,generated:c.routes.filter(r=>r.status==='draft-generated').length}));
}
