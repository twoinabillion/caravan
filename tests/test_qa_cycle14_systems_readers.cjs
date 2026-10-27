'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const helper=require('../qa-artifacts/qa-cycle-20261026/cycle12/story/reader-runtime.cjs');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle14/systems/reader-fix');
const cases=require(dir+'/cases.json'),baseline=require(dir+'/audit-before.json').records,legacy=require(dir+'/legacy-readers.json');
const spoken=ts=>ts.filter(t=>t.kind!=='narration'&&t.kind!=='thought');
const projection=ts=>spoken(ts).map(t=>({who:t.who,kind:t.kind,...(t.name?{name:t.name}:{}),...(t.medium?{medium:t.medium}:{})}));
const want=routes=>routes.map(r=>typeof r==='string'?{who:r,kind:'dialogue'}:{kind:'dialogue',...r});
const state=h=>h.run('JSON.stringify([S.food,S.water,S.scrap,S.fuel,S.min,S.flags,S.items,S.notes,S.comps])');
// Cycle15 review removed an unearned three-day premise; retain the original
// all-scene baseline after asserting only this approved replacement exactly.
const jy04Old='재이의 전리품 자루가 터지기 직전이다. 짐칸 정리 얘기가 나온 지 사흘째다.';
const jy04New='재이의 전리품 자루가 터지기 직전이다. 짐칸을 정리하자는 얘기가 나왔다.';
function projectReviewedJy04Entry(id,turns){
 if(id==='talk_jy_04'){
  assert.equal(turns[0].kind,'narration');assert.equal(turns[0].text,jy04New);
  turns[0].text=jy04Old;
 }
 return turns;
}
function projectReviewedJy04Prose(id,raw){
 if(id==='talk_jy_04'){
  const tail='\n\n"버리는 게 제일 어려워요, 이 직업은."';
  assert.equal(raw.text,jy04New+tail);raw.text=jy04Old+tail;
 }
 return raw;
}
function fixture(id,i=0){const h=setup();h.run('(()=>{'+helper.code()+'})()');assert(h.run(`G.load(${JSON.stringify(fs.readFileSync(dir+'/'+id+'-'+i+'-entry.json','utf8'))})`));h.run(`globalThis.ev=event('${id}');globalThis.entry=qaEntry(ev);globalThis.knownSpeaker=!!entry.knownSpeaker`);return h;}
for(const c of cases)test(c.id+' uses the authored source in entry and every choice/outcome, including reload',()=>{
 const h=fixture(c.id);const old=baseline.find(x=>x.id===c.id);
 if(c.script?.text)assert.deepEqual(projection(h.json('qaNamed(entry)')),want(c.script.text));
 else if(c.authoredTurns){
  const entry=h.json('qaNamed(entry)'),doc=entry.filter(t=>t.kind==='record');
  assert.equal(doc.length,1);assert.equal(doc[0].name,'할아버지의 정비 수첩 — 마지막 장');
  assert.equal(doc[0].medium,'paper');assert.match(doc[0].text,/— 할아버지가$/);
  assert(!entry.some(t=>t.kind==='dialogue'||/^"|"$/.test(t.text)));
  assert.equal(entry.map(t=>t.text).join(' ').replace(/\s+/g,' ').trim(),h.run('prose(ev.text)').replace(/"/g,'').replace(/\s+/g,' ').trim());
 } else assert.deepEqual(h.json('qaNamed(entry)'),old.entry);
 for(const out of old.outcomes){
  h.run(`globalThis.c=ev.choices[${out.i}];globalThis.out=c.out[${out.j}]`);
  const ts=h.json('qaNamed(qaResult(ev,c,out,{knownSpeaker}))'),route=c.script?.choices?.[out.i+'.'+out.j];
  if(route)assert.deepEqual(projection(ts),want(route),c.id+'.'+out.i+'.'+out.j);
  else assert.deepEqual(ts,out.turns,c.id+'.'+out.i+'.'+out.j+' unchanged route');
 }
 for(let i=0;i<old.raw.choices.length;i++){
  const q=fixture(c.id,i);q.run(`globalThis.c=ev.choices[${i}];globalThis.r=G.resolvePresentedChoice(ev,c)`);assert(q.run('r.ok&&r.applied'));
  const turns=q.json('qaNamed(qaResult(ev,c,r.out,{knownSpeaker}))'),paid=state(q);
  q.run("G.capturePresentationView({eventId:ev.id,phase:'outcome',turns:qaResult(ev,c,r.out,{knownSpeaker}),knownSpeaker,index:0});G.save();G.load();globalThis.replay=G.resolvePresentedChoice(ev,c)");
  assert.equal(q.run('replay.applied'),false);assert.equal(state(q),paid);assert.deepEqual(q.json('qaNamed(qaResult(ev,c,replay.out,{knownSpeaker}))'),turns);
 }
});

test('all48 audited Jaeyi/Leo personal scenes preserve already-correct entry and alternate outcomes',()=>{
 const h=setup();h.run('(()=>{'+helper.code()+'})()');h.run("S.party=['jaeyi','leo'];S.food=20;S.water=24;S.scrap=40;S.min=600;for(const id of S.party)S.comps[id].bond=30;");
 for(const old of baseline.filter(r=>/^(talk_jy_|talk_leo_|talkr_jy_|talkr_leo_)/.test(r.id))){
  const changed=cases.find(c=>c.id===old.id);h.run(`globalThis.ev=event('${old.id}');globalThis.entry=qaEntry(ev)`);
  if(!changed?.script?.text)assert.deepEqual(projectReviewedJy04Entry(old.id,h.json('qaNamed(entry)')),old.entry,old.id+' entry');
  for(const out of old.outcomes)if(!changed?.script?.choices?.[out.i+'.'+out.j]){
   h.run(`globalThis.c=ev.choices[${out.i}];globalThis.out=c.out[${out.j}]`);
   assert.deepEqual(h.json('qaNamed(qaResult(ev,c,out,{knownSpeaker:!!entry.knownSpeaker}))'),out.turns,old.id+'.'+out.i+'.'+out.j);
  }
 }
});

test('all audited prose, gates, choices, costs, probabilities and effects remain unchanged',()=>{
 const h=setup(),clean=x=>JSON.parse(JSON.stringify(x,(k,v)=>k==='turnSpeakers'||k==='turns'?undefined:v));
 for(const old of baseline){const now=h.json(`JSON.parse(JSON.stringify(event('${old.id}'),(k,v)=>typeof v==='function'?v.toString():v))`);assert.deepEqual(clean(projectReviewedJy04Prose(old.id,now)),clean(old.raw),old.id);}
});

test('all23 frozen paid outcomes retain old reader identities without another payment',()=>{
 for(const old of legacy){const h=setup();h.run('(()=>{'+helper.code()+'})()');assert(h.run(`G.load(${JSON.stringify(fs.readFileSync(dir+'/'+old.id+'-'+old.i+'-paid.json','utf8'))})`));const before=state(h);h.run(`globalThis.ev=event('${old.id}');globalThis.c=ev.choices[${old.i}];globalThis.r=G.resolvePresentedChoice(ev,c)`);assert.equal(h.run('r.applied'),false);assert.equal(state(h),before);assert.deepEqual(h.json('qaNamed(qaResult(ev,c,r.out))'),old.result,old.id+'.'+old.i);}
});

test('legacy text-only outcomes retain frozen text and do not acquire the new routes',()=>{
 for(const old of legacy){const h=setup(),s=JSON.parse(fs.readFileSync(dir+'/'+old.id+'-'+old.i+'-paid.json','utf8'));delete s.pendingPresentation.view;delete s.pendingPresentation.reading;h.run('(()=>{'+helper.code()+'})()');assert(h.run(`G.load(${JSON.stringify(JSON.stringify(s))})`));const before=state(h);h.run(`globalThis.ev=event('${old.id}');globalThis.c=ev.choices[${old.i}];globalThis.r=G.resolvePresentedChoice(ev,c)`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.frozenTextOnly'),true);assert.equal(h.run('r.out.text'),s.pendingPresentation.text);assert.equal(state(h),before);assert.deepEqual(h.json('qaNamed(qaResult(ev,c,r.out))'),h.json('qaNamed(buildStoryTurns(r.out.text,ev,{frozenTextOnly:true,turnSpeakers:[]}))'));}
});

test('dog and actual-roster dynamic personal branches keep their authored voices',()=>{
 const h=setup();h.run('(()=>{'+helper.code()+'})()');
 for(const dog of [false,true])for(const party of [['jaeyi'],['leo'],['jaeyi','leo'],['minji','parkss','kangwoo','leo','jaeyi','eunsu']]){
  h.run(`S.dog=${dog};S.party=${JSON.stringify(party)}`);
  for(const [id,i,voices] of [['talk_leo_02',1,['leo']],['talk_jy_09',0,['jaeyi','me','jaeyi','jaeyi']],['talk_jy_20',1,['jaeyi','me','jaeyi','jaeyi','jaeyi']]]){
   h.run(`globalThis.ev=event('${id}');globalThis.c=ev.choices[${i}];globalThis.ent=qaEntry(ev)`);
   assert.deepEqual(spoken(h.json('qaNamed(qaResult(ev,c,c.out[0],{knownSpeaker:!!ent.knownSpeaker}))')).map(t=>t.who),voices,id);
  }
 }
});
