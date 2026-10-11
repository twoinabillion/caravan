const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {catalogue}=require('../tools/road-route-plan.cjs');
const {routes}=catalogue();
const camera=vm.runInNewContext(fs.readFileSync(require.resolve('../src/05d-route-panorama.js'),'utf8')+';ROUTE_PANORAMA');
assert.equal(routes.length,78);assert.equal(new Set(routes.map(r=>r.id)).size,78);
let directions=0;
for(const route of routes)for(const reverse of [false,true]){
  const from=reverse?route.to:route.from,to=reverse?route.from:route.to;
  let previous=-1;
  for(let i=0;i<=100;i++){
    const leg={from,to,dist:route.km,gone:route.km*i/100},before=JSON.stringify(leg);
    const p=camera.position(leg,route,360);
    assert.equal(p.reverse,reverse);assert(p.travel>=previous);previous=p.travel;
    assert(Math.abs(p.travel-720*i/100)<1e-9);assert.equal(JSON.stringify(leg),before);
    assert.deepEqual(JSON.parse(JSON.stringify(camera.position(JSON.parse(before),route,360))),JSON.parse(JSON.stringify(p)),'reload has the exact same camera');
    assert(Math.abs(camera.position(leg,route,480).travel-p.travel*4/3)<1e-9);
  }
  const arrived=camera.stopped(to,{from,to},routes);
  const end=camera.position(arrived.leg,arrived.route,360);
  assert.equal(end.travel,720);assert.equal(end.reverse,reverse);assert.equal(end.id,route.id);
  directions++;
}
assert.equal(directions,156);
const r=routes[0],leg={from:r.from,to:r.to,dist:r.km,gone:r.km*.4};
assert.equal(camera.position({...leg,gone:-1},r,360).travel,0);
assert.equal(camera.position({...leg,gone:Infinity},r,360).travel,0);
assert.equal(camera.position({...leg,gone:r.km*2},r,360).travel,720);
assert.equal(camera.position({...leg,from:'unknown'},r,360),null);
assert.equal(camera.position(leg,r,0),null);
const calls=[],ctx={save(){calls.push('save')},restore(){calls.push('restore')},translate(...v){calls.push(['translate',...v])},scale(...v){calls.push(['scale',...v])},drawImage(...v){calls.push(['image',...v])}};
camera.paint(ctx,{naturalWidth:1024,naturalHeight:576},camera.position(leg,r,360),{W:360,H:260});
const images=calls.filter(c=>Array.isArray(c)&&c[0]==='image');
assert.equal(images.length,2);assert.equal(images[0][1],images[1][1],'reinforce the same terrain, never mix two scenes');
console.log('PASS 78 corridors /156 directions: continuous distance camera, reverse, pause/reload equivalence, arrival hold, responsive geometry. Not visual QA or cross-route handoff approval.');
