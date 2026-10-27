const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle14/story/reader-fix');
const {setup}=require(path.join(dir,'setup.cjs')),specs=[...require(path.join(dir,'cases.json')),...require(path.join(dir,'pair-cases.json')),...require(path.join(dir,'clarity-cases.json'))],baseline={...require(path.join(dir,'before-events.json')),...require(path.join(dir,'before-pair-events.json')),...require(path.join(dir,'before-clarity-events.json'))};
const state=h=>h.run('JSON.stringify([S.food,S.water,S.fuel,S.scrap,S.min,S.day,S.flags,S.items,S.notes,S.comps])');
function prepare(id,party=['minji','eunsu']){const h=setup();h.run(`S.party=${JSON.stringify(party)};S.food=24;S.water=28;S.fuel=60;S.scrap=150;S.items['부품']=10;S.min=600;S.at='daejeon';globalThis.e=event('${id}');`);return h;}
function result(h){h.run("globalThis.ts=Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(r.out.text,e,{knownSpeaker:!!entry.knownSpeaker,frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:r.out.turnSpeakers})");return h.json('ts');}
function route(ts){return ts.filter(t=>['dialogue','radio','record'].includes(t.kind)).map(t=>[t.kind,t.who]);}
function want(rs){return rs.filter(r=>r.kind!=='narration').map(r=>typeof r==='string'?['dialogue',r]:[r.kind||'dialogue',r.who]);}
for(const spec of specs){
 if(spec.entry)test(spec.id+' entry and every outcome have independent routes',()=>{
  const h=prepare(spec.id);h.run('G.beginPresentation(e);G.save();G.load();globalThis.entry=Array.isArray(e.turns)&&e.turns.length?e.turns:buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:e.turnSpeakers})');
  assert.deepEqual(route(h.json('entry')),want(spec.entry));
  for(let i=0;i<h.run('e.choices.length');i++)for(let o=0;o<h.run(`e.choices[${i}].out.length`);o++){
   const key=i+'.'+o;assert(Object.hasOwn(spec.choices,key),key+' audited');
   h.run(`globalThis.out=e.choices[${i}].out[${o}];globalThis.normal=buildStoryTurns(prose(out.text),e,{knownSpeaker:!!entry.knownSpeaker,turnSpeakers:out.turnSpeakers});globalThis.changed=buildStoryTurns(prose(out.text),{...e,turnSpeakers:['passer_elder']},{knownSpeaker:!!entry.knownSpeaker,turnSpeakers:out.turnSpeakers});`);
   assert.deepEqual(h.json('changed'),h.json('normal'),key+' cannot inherit a later entry edit');
  }
 });
 for(const party of (spec.id.startsWith('pair_mj_')?[['minji',({kw:'kangwoo',jy:'jaeyi',es:'eunsu'})[spec.id.split('_')[2]]],[({kw:'kangwoo',jy:'jaeyi',es:'eunsu'})[spec.id.split('_')[2]],'minji']]:[['minji','eunsu'],['eunsu','minji']]))for(const [key,rs]of Object.entries(spec.choices))test(spec.id+'.'+key+' payment / '+party.join('+')+' / reload',()=>{
  const [i,o]=key.split('.'),h=prepare(spec.id,party);h.run(`e.choices[${i}].out=[e.choices[${i}].out[${o}]];G.beginPresentation(e);G.save();G.load();globalThis.entry=Array.isArray(e.turns)&&e.turns.length?e.turns:buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:e.turnSpeakers});globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}])`);assert(h.run('r.ok&&r.applied'));
  const ts=result(h);assert.deepEqual(route(ts),want(rs));
  for(const r of rs.filter(r=>r.name)){assert(ts.some(t=>t.who===r.who&&t.name===r.name),r.name);}
  const before=state(h);h.run(`S.pendingPresentation.view={turns:ts,index:1};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}])`);assert.equal(h.run('r.applied'),false);assert.deepEqual(result(h),ts);assert.equal(state(h),before);
 });
}
test('all historical paid views and text-only reads retain old words/identities and never repay',()=>{
 for(const spec of [...specs,{id:'loc_airfield',choices:{'1.0':[]}},{id:'pair_mj_es_2',choices:{'0.0':[]}}])for(const key of Object.keys(spec.choices))for(const textOnly of [false,true]){
  const [i]=key.split('.'),stem=path.join(dir,spec.id+'.'+key),save=JSON.parse(fs.readFileSync(stem+'-legacy-paid.json','utf8')),h=setup();if(textOnly)delete save.pendingPresentation.view;
  assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));const before=state(h);h.run(`globalThis.e=event('${spec.id}');globalThis.entry=[];globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}])`);assert.equal(h.run('r.applied'),false);
  assert.deepEqual(result(h),require(stem+(textOnly?'-old-textonly.json':'-old-reader.json')));assert.equal(state(h),before);
 }
});
test('all words/mechanics stay equal except three exact reviewed prose corrections',()=>{
 const h=setup();for(const [id,old]of Object.entries(baseline)){
  const now=JSON.parse(h.run(`JSON.stringify(event('${id}'),(k,v)=>k==='turnSpeakers'?undefined:typeof v==='function'?v.toString():v)`)),was=JSON.parse(JSON.stringify(old,(k,v)=>k==='turnSpeakers'?undefined:v));
  if(id==='pair_mj_es_2'){assert.equal(now.choices[0].out[0].fx.note.body,'교본에 없는 문장 — 몸과 연장을 챙기고, 신호 오는 날을 준비한다. 은수가 수첩에 남겼다.');now.choices[0].out[0].fx.note.body=was.choices[0].out[0].fx.note.body;}
  if(id==='loc_mungyeong'){assert(Array.isArray(now.turns));delete now.turns;}
  if(id==='loc_airfield'){assert.equal(now.choices[1].out[0].text,'케이블을 찾아 끊었다. 활주로를 따라 켜져 있던 유도등이 일제히 꺼졌다.\n\n뭘 기다리고 있었는지 몰라도, 이제 이 불빛을 따라오지는 못할 거다.\n\n끊은 케이블은 좋은 구리값이 됐다.');now.choices[1].out[0].text=was.choices[1].out[0].text;}
  if(id==='ev_comp_birthday'){assert.equal(now.choices[0].out[0].fx.note.body,'국을 끓이고 사탕을 초 대신 세워 민지 생일을 챙겼다. 시크한 척하던 눈가가 붉었다.');now.choices[0].out[0].fx.note.body=was.choices[0].out[0].fx.note.body;}
  assert.deepEqual(now,was,id);
 }
});
test('airfield cut-cable result works at morning, afternoon, night and after midnight with time unchanged',()=>{
 for(const min of [566,900,1320,90]){const h=prepare('loc_airfield');h.run(`S.min=${min};G.beginPresentation(e);G.save();G.load();globalThis.entry=[];globalThis.r=G.resolvePresentedChoice(e,e.choices[1])`);assert(h.run('r.ok&&r.applied'));assert.equal(h.run('S.min'),min);assert.match(h.run('r.out.text'),/유도등이 일제히 꺼졌다/);assert(!/어둠에 잠겼다|오늘 밤/.test(h.run('r.out.text')));const ts=result(h),before=state(h);h.run('S.pendingPresentation.view={turns:ts,index:0};G.save();G.load();r=G.resolvePresentedChoice(e,e.choices[1])');assert.equal(h.run('r.applied'),false);assert.deepEqual(result(h),ts);assert.equal(state(h),before);}
});
test('new birthday note matches the paid scene while old note archive remains frozen',()=>{
 const h=prepare('ev_comp_birthday');h.run('G.beginPresentation(e);globalThis.entry=[];globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('r.ok'));assert.match(h.run("S.notes.find(n=>n.title==='민지의 생일').body"),/사탕을 초 대신/);
 const old=require(path.join(dir,'ev_comp_birthday.0.0-legacy-paid.json'));assert.match(old.notes.find(n=>n.title==='민지의 생일').body,/성냥불 꽂은 초콜릿/);
});
test('all 48 personal events / 74 outcomes preserve words and unaffected actual-reader routes',()=>{
 const audit=require(path.join(dir,'full-reader-audit-before.json')),rows=audit.rows.filter(r=>/^(talk_mj_|talk_es_|talkr_mj_|talkr_es_)/.test(r.id));assert.equal(rows.length,48);assert.equal(rows.reduce((n,r)=>n+r.choices.length,0),74);
 const h=prepare('talk_mj_01');h.run('S.comps.minji.bond=40;S.comps.eunsu.bond=40');
 for(const row of rows){h.run(`globalThis.e=event('${row.id}');globalThis.entry=buildStoryTurns(prose(e.text),e,{turnSpeakers:e.turnSpeakers})`);
  if(!specs.find(s=>s.id===row.id)?.entry)assert.deepEqual(h.json('entry'),row.entry,row.id+' unchanged entry');
  const clean=v=>JSON.parse(JSON.stringify(v,(k,v)=>['turnSpeakers','turns'].includes(k)?undefined:v));
  const current=JSON.parse(h.run("JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v)"));
  if(row.id==='talk_es_01'){
   assert.equal(current.choices[0].out[0].fx.note.body,'단파로 들은 모르는 나라의 노래. 헤드폰 반쪽의 동맹.');
   assert.equal(row.event.choices[0].out[0].fx.note.body,'밤 단파로 들은 모르는 나라의 노래. 헤드폰 반쪽의 동맹.');
   current.choices[0].out[0].fx.note.body=row.event.choices[0].out[0].fx.note.body;
  }
  assert.deepEqual(clean(current),clean(row.event),row.id+' words/effects');
  for(const c of row.choices){if(specs.find(s=>s.id===row.id)?.choices[c.i+'.'+c.o])continue;
   h.run(`globalThis.out=e.choices[${c.i}].out[${c.o}];globalThis.ts=typeof out.turns==='function'?out.turns(S):Array.isArray(out.turns)&&out.turns.length?out.turns:buildStoryTurns(prose(out.text),e,{knownSpeaker:!!entry.knownSpeaker,speakers:out.speakers,turnSpeakers:out.turnSpeakers})`);
   assert.deepEqual(h.json('ts'),c.turns,row.id+'.'+c.i+'.'+c.o+' unchanged reader');
  }
 }
});
test('three reunion-dependent Minji branches retain their actual pre/post-reunion voices',()=>{
 const {root}=require(path.join(dir,'setup.cjs'));
 for(const id of ['talk_mj_06','talk_mj_08','talk_mj_10'])for(const reunited of [false,true]){
  const parse=h=>{h.run(`S.party=['minji','eunsu'];S.flags.mingyu_reunion=${reunited};globalThis.e=event('${id}');globalThis.entry=buildStoryTurns(prose(e.text),e,{turnSpeakers:e.turnSpeakers});globalThis.o=e.choices[0].out[0];globalThis.ts=typeof o.turns==='function'?o.turns(S):buildStoryTurns(prose(o.text),e,{knownSpeaker:!!entry.knownSpeaker,turnSpeakers:o.turnSpeakers})`);return h.json('ts');};
  assert.deepEqual(parse(setup()),parse(setup(path.join(root,'qa-artifacts/qa-cycle-20261026/cycle14/source'))),id+' reunion='+reunited);
 }
});
test('all ten Minji pair events preserve prose/FX and unaffected actual-reader routes',()=>{
 const audit=require(path.join(dir,'pair-reader-audit-before.json'));assert.equal(audit.rows.length,10);const h=prepare('pair_mj_es_1');
 for(const row of audit.rows){h.run(`globalThis.e=event('${row.id}');globalThis.entry=buildStoryTurns(prose(e.text),e,{turnSpeakers:e.turnSpeakers})`);
  const changed=specs.find(s=>s.id===row.id);if(!changed?.entry)assert.deepEqual(h.json('entry'),row.entry,row.id+' entry');
  const clean=v=>JSON.parse(JSON.stringify(v,(k,v)=>['turnSpeakers','turns'].includes(k)?undefined:v));
  const current=JSON.parse(h.run("JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v)"));
  if(row.id==='pair_mj_es_2')current.choices[0].out[0].fx.note.body=row.event.choices[0].out[0].fx.note.body;
  assert.deepEqual(clean(current),clean(row.event),row.id+' words/effects');
  for(const c of row.choices){if(changed?.choices[c.i+'.'+c.o])continue;
   h.run(`globalThis.out=e.choices[${c.i}].out[${c.o}];globalThis.ts=buildStoryTurns(prose(out.text),e,{knownSpeaker:!!entry.knownSpeaker,speakers:out.speakers,turnSpeakers:out.turnSpeakers})`);assert.deepEqual(h.json('ts'),c.turns,row.id+' result');
  }
 }
});
