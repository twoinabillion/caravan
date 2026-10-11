// One place owns one landscape. Routes may own intervening terrain, never cities.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function cityFrame(catalogue,node,width,height){
 const city=catalogue.cities.find(n=>n.id===node);
 if(!city||!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)return null;
 return {id:city.id,file:city.file,sha256:city.sha256,orientation:city.orientation,
  x:0,width,height:width*576/1024,baseline:height*city.baseline};
}
function layout(catalogue,leg,width,height){
 if(!leg)return null;
 const route=catalogue.routes.find(r=>r.id===[leg.from,leg.to].sort().join('--'));
 if(!route||leg.from===leg.to||!Number.isFinite(leg.dist)||leg.dist<=0)return null;
 const from=cityFrame(catalogue,leg.from,width,height),to=cityFrame(catalogue,leg.to,width,height);
 if(!from||!to)return null;
 const progress=Math.max(0,Math.min(1,Number.isFinite(leg.gone)?leg.gone/leg.dist:0));
 return {route:route.id,progress,travel:3*width*progress,worldWidth:4*width,
  from:{...from,x:0},to:{...to,x:3*width},connector:{x:width,width:2*width,reverse:leg.from!==route.from}};
}
function catalogue(){
 const D=vm.runInNewContext(fs.readFileSync(path.join(root,'src/03-data.js'),'utf8')+';D');
 const env=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-environment/manifest.json'),'utf8'));
 const cities=Object.keys(D.nodes).map(id=>{
  const file=`assets/ui/road-environment/${env.locations[id]?.file}`;
  if(!env.locations[id]?.file)throw Error('Missing canonical place: '+id);
  return {id,name:D.nodes[id].name,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),orientation:'unmirrored',baseline:.72};
 });
 return {schemaVersion:1,purpose:'shared-road-city-endpoints',enabled:false,
  composition:'static-world-strip-v2',visualApproved:false,
  cities,routes:Array.from(D.edges,([from,to,km])=>({id:[from,to].sort().join('--'),from,to,km,fromCity:from,toCity:to}))};
}
if(require.main===module){
 const result=catalogue();
 fs.writeFileSync(path.join(root,'assets/ui/road-routes/cities.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({places:result.cities.length,corridors:result.routes.length,directions:result.routes.length*2,enabled:result.enabled}));
}
module.exports={catalogue,cityFrame,layout};
