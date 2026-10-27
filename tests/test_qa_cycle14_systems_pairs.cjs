'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs'),helper=require('../qa-artifacts/qa-cycle-20261026/cycle12/story/reader-runtime.cjs');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle14/systems/reader-fix'),cases=require(dir+'/pair-cases.json'),before=require(dir+'/pair-audit-before.json').records,legacy=require(dir+'/pair-legacy-readers.json');
const speech=ts=>ts.filter(t=>t.kind!=='narration'&&t.kind!=='thought'),state=h=>h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.flags,S.items,S.notes,S.comps])');
function start(id,full){const h=setup();h.run('(()=>{'+helper.code()+'})()');h.run(`globalThis.ev=event('${id}');S.party=${full?"['minji','parkss','kangwoo','leo','jaeyi','eunsu']":"[ev.needsComp,ev.needsComp2]"};for(const id of S.party)S.comps[id].bond=30;S.food=20;S.water=24;S.scrap=40;S.min=600;G.beginPresentation(ev);G.save();G.load();globalThis.entry=qaEntry(ev);globalThis.knownSpeaker=!!entry.knownSpeaker;`);return h;}
for(const c of cases)for(const full of [false,true])test(c.id+' actual pair/all-crew reader keeps every entry and outcome source / '+full,()=>{
 const h=start(c.id,full),old=before.find(r=>r.id===c.id),entry=h.json('qaNamed(entry)');
 if(c.script.text)assert.deepEqual(speech(entry).map(t=>t.who),c.script.text);
 else assert.deepEqual(entry,old.entry);
 for(const o of old.outcomes){h.run(`globalThis.c=ev.choices[${o.i}];globalThis.out=c.out[${o.j}]`);const ts=h.json('qaNamed(qaResult(ev,c,out,{knownSpeaker}))');assert.deepEqual(speech(ts).map(t=>t.who),c.script.choices[o.i+'.'+o.j]);assert(speech(ts).every(t=>t.kind==='dialogue'));}
 h.run('globalThis.c=ev.choices[0];globalThis.r=G.resolvePresentedChoice(ev,c)');assert(h.run('r.ok&&r.applied'));const turns=h.json('qaNamed(qaResult(ev,c,r.out,{knownSpeaker}))'),paid=state(h);
 h.run("G.capturePresentationView({eventId:ev.id,phase:'outcome',turns:qaResult(ev,c,r.out,{knownSpeaker}),knownSpeaker,index:0});G.save();G.load();globalThis.replay=G.resolvePresentedChoice(ev,c)");assert.equal(h.run('replay.applied'),false);assert.equal(state(h),paid);assert.deepEqual(h.json('qaNamed(qaResult(ev,c,replay.out,{knownSpeaker}))'),turns);
});
test('museum donation remains a plan and the independent conversation note has no fabricated ordinal',()=>{
 const h=start('pair_leo_jy_2');h.run('globalThis.r=G.resolvePresentedChoice(ev,ev.choices[0])');assert.match(h.run('r.out.text'),/전시할 물건 두 점을 정했다/);assert.match(h.run('r.out.fx.note.body'),/기증 예정/);assert.doesNotMatch(h.run('r.out.fx.note.body'),/소장 확정/);
 const q=start('pair_jy_es_2');assert.equal(q.run("!!S.flags.pilot_appeal"),false);q.run('globalThis.r=G.resolvePresentedChoice(ev,ev.choices[0])');assert.doesNotMatch(q.run('r.out.fx.note.body'),/2호/);assert.match(q.run('r.out.fx.note.body'),/교본 밖의 문장/);
});
test('all6 pair prose and mechanics retain everything except the reviewed label and plan/note deltas',()=>{
 const h=setup(),clean=x=>JSON.parse(JSON.stringify(x,(k,v)=>k==='turnSpeakers'?undefined:v));
 for(const old of before){const expected=JSON.parse(JSON.stringify(old.raw)),spec=cases.find(c=>c.id===old.id);for(const [a,b]of spec?.textReplacements||[]){assert(expected.choices[0].out[0].text.includes(a));expected.choices[0].out[0].text=expected.choices[0].out[0].text.replace(a,b);}for(const [a,b]of spec?.noteReplacements||[]){assert(expected.choices[0].out[0].fx.note.body.includes(a));expected.choices[0].out[0].fx.note.body=expected.choices[0].out[0].fx.note.body.replace(a,b);}assert.deepEqual(clean(h.json(`JSON.parse(JSON.stringify(event('${old.id}'),(k,v)=>typeof v==='function'?v.toString():v))`)),clean(expected),old.id);}
});
test('all prior pair paid and text-only receipts retain their historical text and payment',()=>{
 for(const old of legacy)for(const textOnly of [false,true]){const h=setup(),s=JSON.parse(fs.readFileSync(dir+'/'+old.id+'-old-paid.json','utf8'));h.run('(()=>{'+helper.code()+'})()');if(textOnly){delete s.pendingPresentation.view;delete s.pendingPresentation.reading;}assert(h.run(`G.load(${JSON.stringify(JSON.stringify(s))})`));const prev=state(h);h.run(`globalThis.ev=event('${old.id}');globalThis.c=ev.choices[0];globalThis.r=G.resolvePresentedChoice(ev,c)`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),s.pendingPresentation.text);assert.equal(state(h),prev);if(!textOnly)assert.deepEqual(h.json('qaNamed(qaResult(ev,c,r.out))'),old.result);else{assert(h.run('r.out.frozenTextOnly'));assert.deepEqual(h.json('qaNamed(qaResult(ev,c,r.out))'),h.json('qaNamed(buildStoryTurns(r.out.text,ev,{frozenTextOnly:true,turnSpeakers:[]}))'));}}
});
test('the already-correct pilot letter pair keeps entry, result and unsubmitted note',()=>{
 const h=start('pair_leo_es_2'),old=before.find(r=>r.id==='pair_leo_es_2');assert.deepEqual(h.json('qaNamed(entry)'),old.entry);h.run('globalThis.c=ev.choices[0]');assert.deepEqual(h.json('qaNamed(qaResult(ev,c,c.out[0],{knownSpeaker}))'),old.outcomes[0].turns);assert.match(h.run('c.out[0].fx.note.body'),/아직 전달하지는 못했다/);
});
