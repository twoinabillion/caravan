'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('./fixtures/qa-cycle55-story/setup.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8');
function section(a,b){const start=ui.indexOf(a),end=ui.indexOf(b,start);assert(start>=0&&end>start);return ui.slice(start,end)}
const model=section('    if(S.van<S.vanMax-5){','    if(!S.flags.radio_fixed){');
const modelHelpers=section('  function stayActionModel(','  function stayLabel(');
function fresh(van,box=false,saved=false){const h=setup();h.run(`S.pendingPresentation=null;S.at='busan';S.driving=null;S.day=3;S.min=600;S.food=20;S.water=20;S.fuel=40;S.scrap=30;S.fatigue=0;S.hunger=0;S.thirst=0;S.van=${van};S.vanMax=100;S.up={sidebox:${box}};S.items['부품']=2;S.party=[];S.ended=false;globalThis.qaMessages=[];UI.toast=t=>qaMessages.push(t);rng=()=>${saved?0:0.9};`);return h}
const snap=h=>h.json('({day:S.day,min:S.min,van:S.van,items:S.items,ended:S.ended})');
function preview(h){h.run(modelHelpers+'\nglobalThis.localActions=[];'+model);return h.json('localActions')}
for(const [van,label]of [[75.6799999999989,'24.3'],[90.13999999999916,'9.9'],[88.84000000000083,'11.2'],[91,'9'],[20,'35'],[64.999,'35']])test(`actual field repair ${van}: preview and completion show capped ${label}, exact state and cost persist`,()=>{
 const h=fresh(van),before=snap(h),rows=preview(h);assert.deepEqual(snap(h),before,'opening/canceling preview has no effect');assert.equal(rows.length,1);assert.equal(rows[0].chips.find(x=>x.label==='차체').value,'+'+label);
 assert(h.run('G.fieldRepair()'));assert.equal(h.run('S.van'),Math.min(100,van+35));assert.equal(h.run("S.items['부품']"),1);assert.equal(h.run('S.min'),700);assert(h.json('qaMessages').includes('🔧 부품으로 정비 완료 — 내구 +'+label));
 const paid=snap(h);assert(h.run('G.load()'));assert.deepEqual(snap(h),paid);assert(h.run("G.canTravelTo('yangsan').ok"));
});
for(const [van,label]of [[30,'45'],[88.123456789,'11.9']])for(const saved of [false,true])test(`sidebox ${van} saved=${saved}: actual gain and unchanged parts lottery`,()=>{
 const h=fresh(van,true,saved);assert.equal(preview(h)[0].chips.find(x=>x.label==='차체').value,'+'+label);assert(h.run('G.fieldRepair()'));assert.equal(h.run('S.van'),Math.min(100,van+45));assert.equal(h.run("S.items['부품']"),saved?2:1);assert(h.json('qaMessages').includes('🔧 부품으로 정비 완료 — 내구 +'+label+(saved?' · 🧰 부품 아낌':'')));assert.equal(h.run('S.min'),700);
});
for(const [van,parts,ended]of [[100,2,false],[98,2,false],[70,0,false],[70,2,true]])test(`unavailable repair ${van}/${parts}/${ended}: no charge, time, completion or mutation`,()=>{const h=fresh(van);h.run(`S.items['부품']=${parts};S.ended=${ended};`);const before=snap(h);assert.equal(h.run('G.fieldRepair()'),false);assert.deepEqual(snap(h),before);assert.deepEqual(h.json('qaMessages'),[])});
test('preview shows unavailable parts without inventing an applied gain',()=>{const h=fresh(91);h.run("S.items['부품']=0");const before=snap(h),row=preview(h)[0];assert(row.disabled);assert.deepEqual(row.chips,[{label:'부품',value:'필요',tone:'cost',icon:'parts'}]);assert.deepEqual(snap(h),before)});
test('fractional durability stays raw when not capped',()=>{const h=fresh(20.123456789);assert(h.run('G.fieldRepair()'));assert.equal(h.run('S.van'),55.123456789);const paid=snap(h);assert(h.run('G.load()'));assert.deepEqual(snap(h),paid)});
test('expanded hull capacity owns the limit instead of a hardcoded100',()=>{const h=fresh(126.25);h.run('S.vanMax=140');assert.equal(preview(h)[0].chips.find(x=>x.label==='차체').value,'+13.8');assert(h.run('G.fieldRepair()'));assert.equal(h.run('S.van'),140);assert(h.json('qaMessages').includes('🔧 부품으로 정비 완료 — 내구 +13.8'))});
test('fatal time keeps ending ownership and never emits a completion toast or resumes old controls',()=>{const h=fresh(91);h.run('S.min=1430;S.water=0;S.thirst=3;S._breakfastDay=S.day;S._lunchDay=S.day;');assert(h.run('G.fieldRepair()'));assert(h.run('S.ended'));assert(!h.json('qaMessages').some(t=>t.includes('정비 완료')));const ended=snap(h);assert.equal(h.run('G.fieldRepair()'),false);assert.deepEqual(snap(h),ended)});
