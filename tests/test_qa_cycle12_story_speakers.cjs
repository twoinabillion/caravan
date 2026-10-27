const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle12/story/speaker-fixes');
const baseline=JSON.parse(fs.readFileSync(path.join(dir,'before-events.json'),'utf8'));
function fixture(id,party=[]){const h=setup();h.run(`S.party=${JSON.stringify(party)};S.food=20;S.water=24;S.scrap=40;S.npcs.taeho.met=true;S.flags.postman_met=true;S.flags.sea_route=true;S.items['남산행 편지']=1;S.min=600;globalThis.e=event('${id}');G.beginPresentation(e);G.save();G.load();`);return h;}
function reader(h,i){h.run(`globalThis.turns=Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(r.out.text,e,{frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:D.finaleSpeakers(e.id,${i},S)||r.out.turnSpeakers})`);return h.json('turns');}
const state=h=>h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.flags,S.items,S.notes,S.comps])');
const cases=[['npc_taeho_2',0,['taeho','me','taeho','taeho','taeho']],['lc_busan_dried',0,['passer_woman','me','passer_woman','me','passer_woman']],['lc_busan_dried',1,['passer_woman']],['seoul_base',3,['me']],['seoul_han',3,['kangwoo','kangwoo']],['gw_daegwallyeong',0,['sanjigi','sanjigi']],['gw_daegwallyeong',1,['sanjigi','sanjigi','me','sanjigi']]];
cases.push(['seoul_han',0,['me']],['seoul_han',2,['me']]);
for(const [id,i,want]of cases)for(const party of id==='seoul_han'?[['kangwoo'],['minji','kangwoo']]:[[],['minji','kangwoo']])test(`${id}.${i} actual new reader and paid reload / ${party.join('+')||'solo'}`,()=>{
 const h=fixture(id,party);h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}])`);assert(h.run('r.ok&&r.applied'));const turns=reader(h,i),dialogue=turns.filter(t=>t.kind==='dialogue');assert.deepEqual(dialogue.map(t=>t.who),want);assert(dialogue.every(t=>t.name!=='???'&&!t.speakerUncertain));
 if(id==='lc_busan_dried')assert(dialogue.filter(t=>t.who==='passer_woman').every(t=>t.name==='자갈치 아지매'));
 if(id==='gw_daegwallyeong')assert(dialogue.filter(t=>t.who==='sanjigi').every(t=>t.name==='산지기'));
 if(id==='seoul_han'&&i===2)assert.deepEqual(turns.filter(t=>t.kind==='record').map(t=>[t.who,t.name]),[['record','김 선장의 해도']]);
 const paid=state(h);h.run(`S.pendingPresentation.view={turns,index:1};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}])`);assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h,i),turns);assert.equal(state(h),paid);
});
test('entry voices distinguish the introduced woman, known Taeho, recorded postman and carved memorial',()=>{
 for(const [id,want]of [['lc_busan_dried',[['dialogue','passer_woman']]],['npc_taeho_2',[['dialogue','taeho']]],['seoul_han',[['radio','postman']]],['gw_daegwallyeong',[['record','record'],['dialogue','sanjigi']]]]){
  const h=fixture(id);const turns=h.json("buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:D.finaleSpeakers(e.id,-1,S)||e.turnSpeakers})");assert.deepEqual(turns.filter(t=>t.kind!=='narration').map(t=>[t.kind,t.who]),want);
  if(id==='seoul_han'){h.run('S.flags.postman_met=false');assert.equal(h.json("buildStoryTurns(prose(e.text),e,{turnSpeakers:D.finaleSpeakers(e.id,-1,S)||e.turnSpeakers})").filter(t=>t.kind==='radio'||t.kind==='dialogue').length,0);}
 }
});
test('historical paid outcomes keep their frozen old reader and never repay',()=>{
 for(const [id,i]of cases){const h=setup(),paid=fs.readFileSync(path.join(dir,id+'-'+i+'-legacy-paid.json'),'utf8'),old=JSON.parse(fs.readFileSync(path.join(dir,id+'-'+i+'-old-reader.json'),'utf8'));assert(h.run('G.load('+JSON.stringify(paid)+')'));const before=state(h);h.run(`globalThis.e=event('${id}');globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}])`);assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h,i),old);assert.equal(state(h),before);}
});
test('authored text, probabilities, effects, gates and choices stay exactly equal',()=>{
 const h=setup();for(const id of Object.keys(baseline)){
  const value=JSON.parse(h.run(`JSON.stringify(event('${id}'),(k,v)=>k==='turnSpeakers'?undefined:typeof v==='function'?v.toString():v)`));
  const old=JSON.parse(JSON.stringify(baseline[id],(k,v)=>k==='turnSpeakers'?undefined:v));
  if(id==='seoul_han'){
   assert.equal(value.text,old.text
    .replace('다리 한복판에서 라디오가 저 혼자 켜졌다. 잡음뿐이다.','다리 한복판, 난간에 매달린 라디오가 저 혼자 켜졌다. 잡음뿐이다.')
    .replace('다리 한복판에서 라디오가 켜졌다. 우편부의 목소리다(녹음이었다).','다리 한복판, 난간에 매달린 라디오가 켜졌다. 우편부의 목소리다(녹음이었다).'));
   assert.equal(value.choices[0].out[0].text,old.choices[0].out[0].text.replace('라디오가 지직, 하고 꺼졌다. 대답처럼.','난간의 라디오가 지직, 하고 꺼졌다. 대답처럼.'));
   value.text=old.text;
   value.choices[0].out[0].text=old.choices[0].out[0].text;
  }
  assert.deepEqual(value,old);
 }
});
