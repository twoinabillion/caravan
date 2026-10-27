const test=require('node:test'),assert=require('node:assert/strict');
const{setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const{cases,freeChoices}=require('./fixtures/qa-cycle-voluntary-costs.json');
const unit={scrap:'고철',food:'식량',water:'물',fuel:'연료'};
function fixture(c,stocks={}){const h=setup();h.run(`G.save();G.load();S.party=['minji','leo','eunsu','parkss','kangwoo','jaeyi'];S.dog=true;S.day=4;S.min=600;S._breakfastDay=S.day;S._lunchDay=S.day;S.food=12;S.water=16;S.fuel=30;S.scrap=20;S.flags.resistance_trial_done=true;Object.assign(S,${JSON.stringify(stocks)});globalThis.e=event(${JSON.stringify(c.id)});G.beginPresentation(e);G.save();G.load();rng=()=>0;`);return h;}
const paidState=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.van,S.fatigue,S.flags,S.items,S.comps,S.notes,S.pendingPresentation])');
for(const c of cases)test(`${c.id}:${c.index} rejects zero/short stocks, pays exact costs once, preserves authored effects`,()=>{
 const shape=fixture(c);assert.deepEqual(shape.json(`e.choices[${c.index}].out.map(o=>({p:o.p,fx:o.fx}))`),c.oldOutcomeMechanics);
 assert.deepEqual(shape.json(`G.choiceReq(e.choices[${c.index}])`),{...c.oldReq,...c.cost});
 for(const[resource,price]of Object.entries(c.cost)){
  const label=shape.run(`e.choices[${c.index}].label`);assert.match(label,new RegExp(unit[resource]+'.*'+price));
  for(const qty of [0,price-.5]){const h=fixture(c,{...c.cost,[resource]:qty}),before=paidState(h);assert.equal(h.run(`G.reqOk(G.choiceReq(e.choices[${c.index}])).ok`),false);assert.equal(h.run(`G.resolvePresentedChoice(e,e.choices[${c.index}]).ok`),false);assert.equal(paidState(h),before);}
 }
 const h=fixture(c,c.cost);h.run(`globalThis.result=G.resolvePresentedChoice(e,e.choices[${c.index}])`);assert(h.run('result.ok'));
 for(const resource of Object.keys(c.cost))assert.equal(h.run(`S.${resource}`),0);
 const before=paidState(h);h.run(`G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,e.choices[${c.index}])`);assert.equal(h.run('replay.applied'),false);assert.equal(paidState(h),before);
});
for(const c of cases)test(`${c.id}:${c.index} resumes a paid legacy receipt even with zero current funds`,()=>{
 const h=fixture(c,{scrap:0,food:0,water:0,fuel:0});h.run(`S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:${c.index},outcomeIndex:0,text:'이미 읽고 지불한 원문',chips:[{t:'기존 지급',c:'plus'}],view:{turns:[{kind:'narration',text:'이미 읽고 지불한 원문'}],index:0}};G.save();G.load();`);const before=paidState(h);
 h.run(`globalThis.result=G.resolvePresentedChoice(e,e.choices[${c.index}])`);assert.equal(h.run('result.applied'),false);assert.equal(h.run('result.out.text'),'이미 읽고 지불한 원문');assert.equal(paidState(h),before);
});
for(const c of freeChoices)test(`${c.id} retains a free no-reward exit with no crew, dog, parts or supplies`,()=>{
 const h=fixture(c,{party:[],dog:false,items:{},scrap:0,food:0,water:0,fuel:0});assert.equal(h.run('e.choices.length'),c.index+1);assert.deepEqual(h.json(`e.choices[${c.index}].out`),[{p:1,text:h.run(`e.choices[${c.index}].out[0].text`),fx:{}}]);
 assert(h.run(`G.reqOk(G.choiceReq(e.choices[${c.index}])).ok`));
 const before=h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.van,S.fatigue,S.flags,S.items,S.comps,S.notes])');h.run(`globalThis.result=G.resolvePresentedChoice(e,e.choices[${c.index}])`);assert(h.run('result.ok'));
 assert.equal(h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.van,S.fatigue,S.flags,S.items,S.comps,S.notes])'),before);
 h.run(`G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,e.choices[${c.index}])`);assert.equal(h.run('replay.applied'),false);h.run('G.queuePresentation(null)');assert.equal(h.run('S.pendingPresentation'),null);
});
test('a failed tasting still charges only the authored half price after the full-price entry check',()=>{
 const c=cases.find(x=>x.id==='lc_pohang_gwamegi'),h=fixture(c,{scrap:2});assert.equal(h.run('e.choices[0].label'),'도전한다 (고철 최대 2)');assert.deepEqual(h.json('e.choices[0].foreseeable'),{expense:'고철 1~2 · 맛보기 전에 2 필요'});h.run('rng=()=>.999;globalThis.result=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('result.ok'));assert.equal(h.run('S.scrap'),1);
});
