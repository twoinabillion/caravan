const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const flags=['trace_registry','trace_dialect','trace_theories','trace_route','trace_consent'];
function fixture(party=[]){const h=setup();h.run(`S.at='seoul';S.day=8;S.min=600;S.food=24;S.water=28;S.party=${JSON.stringify(party)};S.items={};S.flags=${JSON.stringify(Object.fromEntries(flags.map(k=>[k,true])))};S.used=[];S.notes=[];globalThis.e=event('seoul_core');G.beginPresentation(e);G.save();G.load();`);return h;}
function reader(h){h.run('globalThis.turns=Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(r.out.text,e,{frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:D.finaleSpeakers(e.id,3,S)||r.out.turnSpeakers})');return h.json('turns');}
function resolve(h){h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[3])');assert(h.run('r.ok'));return reader(h);}
test('natural five knowledge traces present their records without inventing physical relics',()=>{
 const h=fixture(['leo','parkss']),entry=h.run('S.pendingPresentation.text');h.run('G.save();G.load();G.beginPresentation(e)');assert.equal(h.run('S.pendingPresentation.text'),entry);
 const turns=resolve(h),text=turns.map(t=>t.text).join('\n');
 for(const name of ['세 겹의 이송표','서울말 시험','빈칸을 둘러싼 세 가설','이송로의 제사상','모두 동의'])assert(text.includes(name));
 assert.match(text,/수첩/);assert.doesNotMatch(text,/응원봉|네 컷 사진|길에서 주운 것|물병 옆|원래 쓰임이 끝난/);
 assert.deepEqual(turns.filter(t=>t.kind==='dialogue').map(t=>t.who),['me','me','me']);
 assert(h.run('S.flags.traces_presented'));assert.equal(h.run('S._chain'),'seoul_costs');assert.equal(h.run('S.min'),600);
});
for(const party of [[],['jaeyi']])for(const ownership of ['unseen','scrapped','kept','removed'])test(`core current relic ownership and actual reader: ${party.length?'Jaeyi':'solo'} / ${ownership}`,()=>{
 const h=fixture(party);if(ownership!=='unseen')h.run(`S.flags.trace_cortis=true;S.flags.cortis_${ownership==='scrapped'?'scrapped':'kept'}=true;S.items['청록 응원봉']=${ownership==='kept'?1:0};`);
 const turns=resolve(h),text=turns.map(t=>t.text).join('\n');
 assert.equal(text.includes('청록 응원봉도 수첩 옆에 내려놓았다'),ownership==='kept');
 assert.equal(text.includes('재이가'),!!party.length);
 assert.deepEqual(turns.filter(t=>t.kind==='dialogue').map(t=>t.who),[party.length?'jaeyi':'me','me','me']);
 const before=h.run('JSON.stringify([S.flags,S.items,S.food,S.water,S.min,S.notes,S.comps])');
 h.run('S.pendingPresentation.view={turns,index:2};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[3])');assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h),turns);assert.equal(h.run('JSON.stringify([S.flags,S.items,S.food,S.water,S.min,S.notes,S.comps])'),before);
});
test('both real photo choices preserve knowledge without claiming the family original was taken',()=>{
 for(const index of [0,1]){
  const h=fixture();h.run(`G.queuePresentation(null);globalThis.photo=event('trace_fourcuts');G.beginPresentation(photo);G.resolvePresentedChoice(photo,photo.choices[${index}]);G.queuePresentation(null);G.beginPresentation(e);`);
  assert(h.run('S.flags.trace_photostrip'));const turns=resolve(h),text=turns.map(t=>t.text).join('\n');
  assert.match(text,/네 칸의 가족/);assert.doesNotMatch(text,/네 컷 사진을 놓았다|물병 옆|사진을 꺼냈다/);
 }
});
test('all qualifying knowledge combinations list only acquired traces',()=>{
 const h=fixture(),traces=h.json('D.eraTraces');let checked=0;
 for(let mask=0;mask<1<<traces.length;mask++){
  const found=traces.filter((_,i)=>mask&(1<<i));if(found.length<5)continue;
  h.run(`S.flags=${JSON.stringify(Object.fromEntries(found.map(t=>[t.flag,true])))};`);
  const text=h.run('prose(e.choices[3].out[0].text)');assert(text.includes(found.map(t=>t.name).join(', ')+'.'));
  assert.doesNotMatch(text,/응원봉도 수첩 옆에 내려놓았다|물병 옆|네 컷 사진을 놓았다/);checked++;
 }
 assert.equal(checked,256);
});
test('choice gates and effects stay identical; old paid prose and reader remain frozen',()=>{
 const h=fixture();
 const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle7/story/core-before.json'),'utf8'));
 assert.deepEqual(h.json('e.choices.map(c=>({label:c.label,req:c.req,out:c.out.map(o=>({p:o.p,fx:o.fx}))}))'),baseline.mechanics);
 h.run(`S.flags={};S.items={};S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:3,outcomeIndex:0,text:${JSON.stringify(baseline.original)},chips:[],view:{turns:${JSON.stringify(baseline.turns)},index:2}};G.save();G.load();globalThis.before=JSON.stringify([S.flags,S.items,S.food,S.water,S.min,S.notes,S.comps]);globalThis.r=G.resolvePresentedChoice(e,e.choices[3]);`);
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),baseline.original);assert.deepEqual(reader(h),baseline.turns);assert.equal(h.run('JSON.stringify([S.flags,S.items,S.food,S.water,S.min,S.notes,S.comps])'),h.run('before'));
});
test('Jaeyi gift advice needs no Minji introduction and keeps its two actual reader lines',()=>{
 for(const party of [['jaeyi'],['jaeyi','parkss'],['jaeyi','minji']]){
  const h=setup();h.run(`S.party=${JSON.stringify(party)};S.flags={};S.used=[];S.notes=[];S.day=10;S.min=950;S.at='miryang';globalThis.e=event('talk_jy_05');G.beginPresentation(e);G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[1]);`);
  assert(h.run('r.ok'));assert.doesNotMatch(h.run('r.out.text'),/민지|민지 씨/);assert.match(h.run('r.out.text'),/고철.*부품/);
  const turns=h.json('buildStoryTurns(r.out.text,e,{turnSpeakers:r.out.turnSpeakers})');
  assert.deepEqual(turns.filter(t=>t.kind==='dialogue').map(t=>t.who),['jaeyi','jaeyi']);
  assert.deepEqual(h.json('e.choices[1].out[0].fx'),{mood:{jaeyi:2},moodAll:1});
  assert.deepEqual(h.json('e.choices.map(c=>c.label)'),['"받는 사람이 자기 돈으론 안 살 물건이요"','"고철이요. 실용적이잖아요"']);
  assert.equal(h.run('S.min'),950);
  const paid=h.run('JSON.stringify([S.comps,S.flags,S.notes,S.food,S.water,S.min])');
  h.run(`S.pendingPresentation.view={turns:${JSON.stringify(turns)},index:1};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[1]);`);
  assert.equal(h.run('r.applied'),false);assert.deepEqual(h.json('r.out.turns'),turns);assert.equal(h.run('JSON.stringify([S.comps,S.flags,S.notes,S.food,S.water,S.min])'),paid);
 }
});
test('historical paid gift advice retains its old text and reader without requiring Minji',()=>{
 const h=setup(),old='"무겁잖아요!" 재이가 웃었다. "민지 씨한테 줄 거면 좋아하겠네요. 아니, 그럴 거면 쓸 만한 부품으로 주고요." 재이는 자기 상자 안을 다시 들여다봤다.';
 h.run(`S.party=['jaeyi'];S.flags={};globalThis.e=event('talk_jy_05');globalThis.oldText=${JSON.stringify(old)};globalThis.oldTurns=buildStoryTurns(oldText,e,{turnSpeakers:e.choices[1].out[0].turnSpeakers});S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:1,outcomeIndex:0,text:oldText,chips:[],view:{turns:oldTurns,index:1}};G.save();G.load();globalThis.before=JSON.stringify([S.comps,S.flags,S.notes,S.food,S.water,S.min]);globalThis.r=G.resolvePresentedChoice(e,e.choices[1]);`);
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),old);assert.deepEqual(h.json('r.out.turns'),h.json('oldTurns'));assert.equal(h.run('JSON.stringify([S.comps,S.flags,S.notes,S.food,S.water,S.min])'),h.run('before'));
});
