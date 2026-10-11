const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {catalogue,cityFrame,layout}=require('../tools/road-city-plan.cjs');
const root=path.resolve(__dirname,'..'),c=catalogue();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('all58 place owners and all78 route endpoints match the saved source/hash contract',()=>{
 assert.deepEqual(JSON.parse(read('assets/ui/road-routes/cities.json')),c);
 assert.equal(c.cities.length,58);assert.equal(c.routes.length,78);
 assert.equal(new Set(c.cities.map(n=>n.id)).size,58);
 for(const n of c.cities){
  assert.equal(n.orientation,'unmirrored');assert.equal(n.baseline,.72);
  assert.equal(n.sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,n.file))).digest('hex'));
 }
 for(const r of c.routes){assert.equal(r.fromCity,r.from);assert.equal(r.toCity,r.to);assert(cityFrame(c,r.from,360,260));assert(cityFrame(c,r.to,360,260));}
 assert.equal(c.enabled,false);assert.equal(c.visualApproved,false);
});
test('every incoming arrival equals every outgoing departure at every place, including reverse and reload',()=>{
 let directions=0,comparisons=0;
 for(const n of c.cities){
  const connected=c.routes.filter(r=>r.from===n.id||r.to===n.id);
  for(const incoming of connected)for(const outgoing of connected)for(const W of [320,360,480]){
   const previous=incoming.from===n.id?incoming.to:incoming.from;
   const next=outgoing.from===n.id?outgoing.to:outgoing.from;
   const arrival=layout(c,{from:previous,to:n.id,dist:incoming.km,gone:incoming.km},W,260);
   const departure=layout(c,{from:n.id,to:next,dist:outgoing.km,gone:0},W,260);
   assert.deepEqual({...arrival.to,x:arrival.to.x-arrival.travel},departure.from);
   assert.deepEqual(cityFrame(c,n.id,W,260),departure.from,'cancel/stopped keeps the same city');comparisons++;
  }
 }
 for(const r of c.routes)for(const reverse of [false,true]){
  const leg={from:reverse?r.to:r.from,to:reverse?r.from:r.to,dist:r.km,gone:0};
  let last=-1;
  for(let i=0;i<=100;i++){
   leg.gone=r.km*i/100;const before=JSON.stringify(leg),p=layout(c,leg,360,260);
   assert(p.travel>=last);last=p.travel;
   assert.deepEqual(layout(c,JSON.parse(before),360,260),p);
   assert.equal(JSON.stringify(leg),before);assert.equal(p.from.orientation,'unmirrored');assert.equal(p.to.orientation,'unmirrored');
   assert(Math.abs(p.travel-1080*i/100)<1e-9);
  }directions++;
 }
 assert.equal(directions,156);assert(comparisons>1000);
});
test('all routes and all places appear in an isolated script-free registered Studio draft',()=>{
 const html=read('tools/design-drafts/scenery-cities.html'),css=read('tools/design-drafts/scenery-cities.css');
 const entry=JSON.parse(read('tools/design-drafts/manifest.json')).drafts.find(n=>n.id==='scenery-cities-v2');
 assert.equal(entry.file,'scenery-cities.html');
 assert.equal((html.match(/class="city-route"/g)||[]).length,78);
 assert.equal((html.match(/class="city-junction"/g)||[]).length,58);
 assert.equal((html.match(/class="city-world"/g)||[]).length,156);
 assert(!/<script|\bonclick\s*=|localStorage|sessionStorage|\/game\?/i.test(html));
 for(const n of c.cities)assert(html.includes('../../'+n.file));
 const ids=new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]));
 for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(m[1].startsWith('#'))assert(ids.has(m[1].slice(1)),m[1]);
  else assert(fs.existsSync(path.resolve(root,'tools/design-drafts',m[1])),m[1]);
 }
 assert.match(css,/prefers-reduced-motion/);assert.match(css,/animation-play-state:paused/);
 assert(!/opacity\s*:/i.test(css),'no time-driven dissolve');
});
