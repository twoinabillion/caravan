const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle13/story/reader-fix');
const cases=require(path.join(dir,'cases.json')),baseline=require(path.join(dir,'before-events.json'));
function fixture(spec,party){const h=setup();h.run(`S.party=${JSON.stringify(party)};S.food=20;S.water=24;S.scrap=40;S.items['할아버지의 봉투']=1;S.npcs.drhan.met=true;S.comps.jaeyi.bond=30;S.min=600;globalThis.e=event('${spec.id}');G.beginPresentation(e);G.save();G.load();`);return h;}
function reader(h,i){h.run(`globalThis.turns=Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(r.out.text,e,{frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:D.finaleSpeakers(e.id,${i},S)||r.out.turnSpeakers})`);return h.json('turns');}
const state=h=>h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.flags,S.items,S.notes,S.comps])');
for(const spec of cases){
 const owner=spec.id.startsWith('talk_jy')?'jaeyi':spec.id==='talkr_pss_1'?'parkss':null;
 for(const party of [owner?[owner]:[],['jaeyi','parkss']])test(`${spec.id}.${spec.i} real reader / ${party.join('+')||'solo'} and paid reload`,()=>{
  const h=fixture(spec,party);h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${spec.i}])`);assert(h.run('r.ok&&r.applied'));
  const turns=reader(h,spec.i),spoken=turns.filter(t=>['dialogue','radio','record'].includes(t.kind));
  assert.deepEqual(spoken.map(t=>[t.kind,t.who]),spec.route.map(r=>typeof r==='string'?['dialogue',r]:[r.kind||'dialogue',r.who]));
  spec.route.forEach((r,i)=>{if(r.name)assert.equal(spoken[i].name,r.name);if(r.medium)assert.equal(spoken[i].medium,r.medium);});
  assert(spoken.every(t=>t.name!=='???'&&!t.speakerUncertain));
  const paid=state(h);h.run(`S.pendingPresentation.view={turns,index:1};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${spec.i}])`);
  assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h,spec.i),turns);assert.equal(state(h),paid);
 });
}
test('legacy paid outcomes preserve old frozen reader and never repay',()=>{
 for(const spec of cases){const h=setup(),paid=fs.readFileSync(path.join(dir,spec.id+'-legacy-paid.json'),'utf8'),old=require(path.join(dir,spec.id+'-old-reader.json'));assert(h.run('G.load('+JSON.stringify(paid)+')'));const before=state(h);h.run(`globalThis.e=event('${spec.id}');globalThis.r=G.resolvePresentedChoice(e,e.choices[${spec.i}])`);assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h,spec.i),old);assert.equal(state(h),before);}
});
test('legacy text-only paid receipt does not borrow new source routes',()=>{
 for(const spec of cases){const h=setup(),paid=JSON.parse(fs.readFileSync(path.join(dir,spec.id+'-legacy-paid.json'),'utf8'));delete paid.pendingPresentation.view;assert(h.run('G.load('+JSON.stringify(JSON.stringify(paid))+')'));const before=state(h);h.run(`globalThis.e=event('${spec.id}');globalThis.r=G.resolvePresentedChoice(e,e.choices[${spec.i}])`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('!!r.out.frozenTextOnly'),true);assert.deepEqual(reader(h,spec.i),h.json('buildStoryTurns(r.out.text,e,{frozenTextOnly:true,turnSpeakers:[]})'));assert.equal(state(h),before);}
});
test('all authored event words, costs, gates, probabilities and effects remain equal',()=>{
 const h=setup();for(const id of Object.keys(baseline)){const now=JSON.parse(h.run(`JSON.stringify(event('${id}'),(k,v)=>k==='turnSpeakers'?undefined:typeof v==='function'?v.toString():v)`));const old=JSON.parse(JSON.stringify(baseline[id],(k,v)=>k==='turnSpeakers'?undefined:v));assert.deepEqual(now,old);}
});
test('roof work describes the repair during an existing storm without changing its cost/effects',()=>{
 const h=setup();h.run("S.at='jeonju';S.weather='storm';S.min=900");const now=h.json("D.stls.jeonju.field.actions.find(x=>x.id==='roof_tiles')"),old=require(path.join(dir,'before-roof.json'));
 assert.equal(now.desc,'공동 숙소 지붕의 깨진 기와를 갈고, 비가 들이칠 틈을 막아야 한다.');
 assert.deepEqual({...now,desc:old.desc},old);
});
test('cycle12 entry routes do not leak into any adjacent choice/outcome',()=>{
 const matrix={lc_busan_dried:[['passer_woman','me','passer_woman','me','passer_woman'],['passer_woman']],
  gw_daegwallyeong:[['sanjigi','sanjigi'],['sanjigi','sanjigi','me','sanjigi']],
  seoul_han:[['me'],[],['record','me'],['kangwoo','kangwoo']],
  npc_taeho_2:[['taeho','me','taeho','taeho','taeho']]};
 for(const [id,routes]of Object.entries(matrix)){
  const h=setup();h.run(`S.party=['minji','kangwoo'];S.npcs.taeho.met=true;S.flags.postman_met=true;S.flags.sea_route=true;globalThis.e=event('${id}');globalThis.entry=buildStoryTurns(prose(e.text),e,{turnSpeakers:D.finaleSpeakers(e.id,-1,S)||e.turnSpeakers});`);
  assert.equal(h.run('e.choices.length'),routes.length);
  routes.forEach((want,i)=>{const outCount=h.run(`e.choices[${i}].out.length`);assert.equal(outCount,1);h.run(`globalThis.out=e.choices[${i}].out[0];globalThis.ts=buildStoryTurns(prose(out.text),e,{knownSpeaker:!!entry.knownSpeaker,speakers:out.speakers,turnSpeakers:D.finaleSpeakers(e.id,${i},S)||out.turnSpeakers});`);const lines=h.json('ts.filter(t=>t.kind!=="narration")');assert.deepEqual(lines.map(t=>t.who),want,id+'.'+i);assert(lines.every(t=>t.kind===(id==='seoul_han'&&i===2&&t.who==='record'?'record':'dialogue')),id+'.'+i+' media');});
 }
});
