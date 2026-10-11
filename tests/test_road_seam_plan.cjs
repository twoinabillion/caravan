const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {measure,seamPlan,smooth,W,STEP}=require('../tools/road-seam-plan.cjs');
const cities=require('../assets/ui/road-routes/cities.json'),routes=require('../assets/ui/road-routes/manifest.json').routes;
test('all 312 endpoint joins match city ridges, stay grounded and return to unchanged route terrain',async()=>{
 const measured=new Map();
 for(const file of [...cities.cities.map(n=>n.file),...routes.map(r=>'assets/ui/road-routes/'+r.file)]) measured.set(file,await measure(path.resolve(__dirname,'..',file)));
 let endpoints=0;
 for(const r of routes)for(const reverse of [false,true])for(const edge of ['right','left']){
  const id=edge==='right'?(reverse?r.to:r.from):(reverse?r.from:r.to);
  const city=measured.get(cities.cities.find(n=>n.id===id).file),route=measured.get('assets/ui/road-routes/'+r.file);
  const before=JSON.stringify([city,route]);
  const p=seamPlan(city,route,{edge,reverse});
  assert.equal(p.strips.length,W/STEP);
  for(const s of p.strips){
   assert(Number.isFinite(s.scale)&&s.scale>0);
   assert(Math.abs((1728*(1-s.scale))+1728*s.scale-1728)<1e-8,'baseline never moves');
   if((s.x+STEP/2)/W<=.08)assert(Math.abs(s.height-s.cityHeight)<1e-8,'one shared ridge throughout material overlap');
   if((s.x+STEP/2)/W>=.58)assert.equal(s.scale,1,'middle remains native, no endless deformation');
  }
  assert.equal(JSON.stringify([city,route]),before);
  assert.deepEqual(seamPlan(city,route,{edge,reverse}),p,'deterministic across reload');
  endpoints++;
 }
 assert.equal(endpoints,312);
});
test('spatial easing has fixed endpoints, finite monotone values and zero endpoint slope',()=>{
 assert.equal(smooth(-1),0);assert.equal(smooth(2),1);
 let previous=0;for(let i=0;i<=100;i++){const t=smooth(i/100);assert(t>=previous-1e-12);previous=t;}
 assert(smooth(.0001)<1e-9);assert(1-smooth(.9999)<1e-9);
});
