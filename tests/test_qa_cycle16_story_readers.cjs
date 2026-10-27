'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle16/story/repair'),{setup}=require(dir+'/setup.cjs'),old=require(dir+'/before.json'),helper=require('../qa-artifacts/qa-cycle-20261026/cycle12/story/reader-runtime.cjs');
function context(party=[]){const h=setup();h.run('(()=>{'+helper.code()+'})()');h.run(`S.party=${JSON.stringify(party)};S.food=20;S.water=20;S.scrap=30;S.fatigue=30;S.min=600;`);return h;}
const speech=ts=>ts.filter(t=>!['narration','thought'].includes(t.kind));
const financial=h=>h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.fatigue,S.items,S.flags,S.notes,S.comps])');
for(const party of [[],['leo'],['minji','eunsu']])test('seed warehouse self-reflection stays with the player for roster '+JSON.stringify(party),()=>{
 const h=context(party);h.run("globalThis.ev=event('ev_seed_warehouse');globalThis.entry=qaEntry(ev)");assert.deepEqual(h.json('qaNamed(entry)'),old.readers.ev_seed_warehouse.entry);
 for(const x of old.readers.ev_seed_warehouse.outcomes){h.run(`globalThis.c=ev.choices[${x.i}];globalThis.out=c.out[${x.o}]`);const now=h.json('qaNamed(qaResult(ev,c,out,{knownSpeaker:!!entry.knownSpeaker}))');if(x.i===0&&x.o===0){const ts=speech(now);assert.equal(ts.length,1);assert.equal(ts[0].who,'me');assert.equal(ts[0].kind,'dialogue');assert.equal(ts[0].text,'먹을 걸 줍는 것보다 이게 더 부자 된 기분이야.');}else assert.deepEqual(now,x.turns);}
});
for(const party of [[],['leo'],['minji','eunsu']])test('station sign and entire diary outcome are distinct written sources for roster '+JSON.stringify(party),()=>{
 const h=context(party);h.run("globalThis.ev=event('exp_station');globalThis.entry=qaEntry(ev);globalThis.c=ev.choices[0];globalThis.out=c.out[0]");
 const en=speech(h.json('qaNamed(entry)')),result=h.json('qaNamed(qaResult(ev,c,out,{knownSpeaker:!!entry.knownSpeaker}))'),rs=speech(result);
 assert.equal(en.length,1);assert.equal(en[0].kind,'record');assert.equal(en[0].name,'간이역 역명판');assert.match(en[0].text,/걷는 게 빠릅니다 — 역장$/);
 assert.equal(rs.length,1);assert.equal(rs[0].kind,'record');assert.equal(rs[0].name,'역장의 일지');assert.equal(rs[0].medium,'paper');assert.match(rs[0].text,/역은 기다리는 곳이니까\.$/);
 // An entry-only future title change must not leak into the outcome route.
 h.run("ev.turnSpeakers=[{who:'record',kind:'record',name:'다른 입장 문서'}]");assert.deepEqual(h.json('qaNamed(qaResult(ev,c,out,{knownSpeaker:!!entry.knownSpeaker}))'),result);
});
test('all event prose, choice order, gates, probabilities and effects are exactly retained',()=>{
 const h=context(),clean=x=>JSON.parse(JSON.stringify(x,(k,v)=>k==='turnSpeakers'?undefined:v));
 for(const id of Object.keys(old.events))assert.deepEqual(clean(h.json(`event('${id}')`)),clean(old.events[id]),id);
});
for(const x of old.legacy)test(x.prefix+' actual payment and new paid reload keep the same reader and effects',()=>{
 const h=context(['leo','eunsu']);h.run(`G.seedOverride=${x.seed};G.newGame('onroad','상혁','interactive');S.party=['leo','eunsu'];S.food=20;S.water=20;S.scrap=30;S.fatigue=30;globalThis.ev=event('${x.id}');G.beginPresentation(ev);G.save();G.load();globalThis.entry=qaEntry(ev);globalThis.c=ev.choices[${x.i}];globalThis.r=G.resolvePresentedChoice(ev,c);globalThis.turns=qaResult(ev,c,r.out,{knownSpeaker:!!entry.knownSpeaker})`);
 assert(h.run('r.ok&&r.applied'));assert.equal(h.run('r.out.text'),old.events[x.id].choices[x.i].out[x.o].text);const before=financial(h),turns=h.json('qaNamed(turns)');h.run("G.capturePresentationView({eventId:ev.id,phase:'outcome',turns,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load();globalThis.replay=G.resolvePresentedChoice(ev,c)");assert.equal(h.run('replay.applied'),false);assert.equal(financial(h),before);assert.deepEqual(h.json('qaNamed(qaResult(ev,c,replay.out))'),turns);
});
for(const textOnly of [false,true])test('all4 historical paid outcomes retain '+(textOnly?'frozen-text readers':'frozen-view readers')+' without new payment',()=>{
 for(const x of old.legacy){const save=JSON.parse(fs.readFileSync(path.join(dir,x.prefix+'-paid.json')));if(textOnly)delete save.pendingPresentation.view;const h=context();assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));const before=financial(h);h.run(`globalThis.ev=event('${x.id}');globalThis.c=ev.choices[${x.i}];globalThis.r=G.resolvePresentedChoice(ev,c)`);assert.equal(h.run('r.applied'),false);assert.equal(financial(h),before);assert.deepEqual(h.json('qaNamed(qaResult(ev,c,r.out))'),textOnly?x.textOnly:x.reader,x.prefix);}
});
test('scarecrow ambient remains a current visual impression without prior-day visit prerequisite',()=>{
 const h=context(),a=h.json("D.banter.find(x=>x.t.includes('허수아비'))");assert.equal(a.t,'지나친 허수아비가 백미러에서는 이쪽을 보는 듯했다. …기분 탓이다');a.t=old.ambient.t;assert.deepEqual(a,old.ambient);
});
