const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const manifest=JSON.parse(fs.readFileSync('assets/road-cues/manifest-v2.json'));
const ctx={G:{}};vm.runInNewContext(fs.readFileSync('src/05c-road-cue-kit.js','utf8').replace('__ROAD_KIT_MANIFEST__',JSON.stringify(manifest)),ctx);
const compose=(eventKey,kind,motif,people,extra={})=>ctx.G.roadCueKit.compose({eventKey,kind,scene:{motif,people,...extra}},100);
test('new named encounters use authored identities, empty piano never gains a performer',()=>{
 const piano=compose('meet_piano','people','piano',2);
 assert.equal(piano.layers.length,1);assert.equal(piano.primary,'road-piano');
 for(const [event,key] of [['meet_mapmaker','road-mapmaker'],['lib_meet','road-hanbyeol'],['deserter_meet','road-seoyeon'],['meet_florist','road-florist'],['meet_photographer','road-photographer']]){
  const p=compose(event,'people','',3),people=p.layers.filter(x=>x.person);
  assert.equal(people.length,1);assert.equal(people[0].key,key);assert.equal(people[0].y+people[0].height,0);
 }
 assert.equal(compose('lib_meet','vehicle','',2).layers[0].width,52);
 assert.equal(compose('meet_tailor','people','',2).layers[0].height,20.5*.74);
 // Portrait metadata does not spawn a remote radio speaker into the road.
 assert.equal(compose('resist_refusal_return','signal','',0),null);
});
test('coffee and other trucks share fixed width, adult feet on wheel baseline',()=>{
 for(const motif of ['coffee-van','food-truck','clinic-bus','film-vehicle']){
  const p=compose('', 'vehicle',motif,1),vehicle=p.layers.find(x=>!x.person),adult=p.layers.find(x=>x.person);
  assert.equal(vehicle.width,52);assert.equal(adult.height,20.5);assert.equal(adult.y+adult.height,0);
 }
});
test('authored named encounters retain distinct identities even when classifier picks animal',()=>{
 assert.equal(compose('ev_hunter_meat','animal','',1).layers[0].key,'road-hunter');
 assert.equal(compose('meet_trader_truck','vehicle','',3).layers.filter(x=>x.person)[0].key,'road-mansu');
 assert.equal(compose('ev_beekeeper','people','beekeeper',2).layers.length,1);
});
test('empty facilities have no invented staff; family children remain behind the truck',()=>{
 assert.equal(compose('ev_gasstation_tank','shelter','gas-station',2).layers.filter(x=>x.person).length,0);
 const p=compose('meet_family','vehicle','broken-vehicle',3,{children:2});
 assert.equal(p.layers[0].key,'road-child');assert.equal(p.layers[2].key,'broken-vehicle');assert.equal(p.layers.filter(x=>x.person).length,3);
});
