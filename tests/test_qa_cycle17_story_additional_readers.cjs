'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup:baseSetup}=require('../qa-artifacts/qa-cycle-20261026/cycle15/story/repair/setup.cjs'),helper=require('../qa-artifacts/qa-cycle-20261026/cycle12/story/reader-runtime.cjs');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle17/story/additional-readers'),specs=require(dir+'/cases.json'),old=require(dir+'/before.json'),frozen=path.resolve(dir,'../../source'),copy=require(dir+'/copy-delta.json');
const six=['minji','parkss','kangwoo','eunsu','leo','jaeyi'],setup=()=>process.env.QA_SOURCE_ROOT?baseSetup(process.env.QA_SOURCE_ROOT):baseSetup();
function init(h,party,seed=1){h.run('(()=>{'+helper.code()+'})()');h.run(`G.seedOverride=${seed};G.newGame('onroad','상혁','interactive');S.opening.completed=true;S.party=${JSON.stringify(party)};S.day=5;S.min=1200;S.food=25;S.water=25;S.scrap=50;S.fatigue=30;S.up.beehive=true;S.up.armor=true;S.flags.van_parts_named=true;S.flags.van_named=true;S.dog=true;S.items['부품']=10`);return h;}
const spoken=ts=>ts.filter(t=>!['narration','thought'].includes(t.kind)),mapped=(route,p)=>route.map(x=>x==='party_first'?p[0]||'me':x==='party_second'?p[1]||p[0]||'me':x);
const state=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.fuel,S.scrap,S.items,S.flags,S.notes,S.comps,S.fatigue,S.pursuit])');
for(const spec of specs){const rosters=[['minji'],['eunsu','jaeyi'],['kangwoo','parkss','leo']];
 for(const party of rosters)test(spec.id+' all entries/outcomes use current actors '+party.join('/'),()=>{
  const h=init(setup(),party),b=init(baseSetup(frozen),party);h.run(`globalThis.e=event('${spec.id}');globalThis.entry=qaEntry(e)`);b.run(`globalThis.e=event('${spec.id}');globalThis.entry=qaEntry(e)`);
  if(spec.entry)assert.deepEqual(spoken(h.json('qaNamed(entry)')).map(t=>t.who),mapped(spec.entry,party));else assert.deepEqual(h.json('qaNamed(entry)'),b.json('qaNamed(entry)'));
  const ev=old.events[spec.id];assert(party.length>=(ev.minParty||0));
  for(let i=0;i<ev.choices.length;i++)for(let o=0;o<ev.choices[i].out.length;o++){
   h.run(`globalThis.c=e.choices[${i}];globalThis.out=c.out[${o}]`);b.run(`globalThis.c=e.choices[${i}];globalThis.out=c.out[${o}]`);const actual=h.json('qaNamed(qaResult(e,c,out,{knownSpeaker:!!entry.knownSpeaker}))'),route=spec.choices[i+'.'+o];
   if(route)assert.deepEqual(spoken(actual).map(t=>t.who),mapped(route,party),spec.id+'.'+i+'.'+o);else assert.deepEqual(actual,b.json('qaNamed(qaResult(e,c,out,{knownSpeaker:!!entry.knownSpeaker}))'));
   if(spec.entry){h.run("e.turnSpeakers=['passer_worker']");assert.deepEqual(h.json('qaNamed(qaResult(e,c,out,{knownSpeaker:!!entry.knownSpeaker}))'),actual,'entry metadata must not leak into result');h.run('e.turnSpeakers='+JSON.stringify(spec.entry));}
  }
 });
}
test('exact reviewed metadata only; all prose gates probabilities notes effects choice order unchanged',()=>{
 const h=setup();for(const spec of specs){const actual=h.json(`JSON.parse(JSON.stringify(event('${spec.id}'),(k,v)=>typeof v==='function'?v.toString():v))`),expected=JSON.parse(JSON.stringify(old.events[spec.id]));for(const change of copy.filter(x=>x.id===spec.id)){let owner=expected;for(const k of change.path.slice(0,-1))owner=owner[k];owner[change.path.at(-1)]=change.new;}if(spec.entry)expected.turnSpeakers=spec.entry;for(const [key,route]of Object.entries(spec.choices)){const [i,o]=key.split('.').map(Number);expected.choices[i].out[o].turnSpeakers=route;}assert.deepEqual(actual,expected,spec.id);}
});
for(const row of old.legacy)test(row.id+'.'+row.i+'.'+row.o+' real payment and saved reader preserve new roles',()=>{
 const h=init(setup(),six,row.seed);h.run(`globalThis.e=event('${row.id}');G.beginPresentation(e);G.save();G.load();globalThis.ent=qaEntry(e);globalThis.c=e.choices[${row.i}];globalThis.res=G.resolvePresentedChoice(e,c);globalThis.reader=qaResult(e,c,res.out,{knownSpeaker:!!ent.knownSpeaker})`);assert(h.run('res.ok&&res.applied'));assert.equal(h.run('res.out.text'),copy.find(x=>x.id===row.id&&x.path[1]===row.i&&x.path[3]===row.o)?.new||row.text);const before=state(h),reader=h.json('qaNamed(reader)');h.run("G.capturePresentationView({eventId:e.id,phase:'outcome',turns:reader,knownSpeaker:!!ent.knownSpeaker,index:0});G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,c)");assert.equal(h.run('replay.applied'),false);assert.equal(state(h),before);assert.deepEqual(h.json('qaNamed(qaResult(e,c,replay.out))'),reader);
});
for(const textOnly of [false,true])test('all legacy paid outcomes preserve '+(textOnly?'text-only':'full-view')+' readers',()=>{
 for(const row of old.legacy){const h=setup();h.run('(()=>{'+helper.code()+'})()');const save=JSON.parse(fs.readFileSync(path.join(dir,row.file)));if(textOnly){delete save.pendingPresentation.view;delete save.pendingPresentation.reading;}assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));const before=state(h);h.run(`globalThis.e=event('${row.id}');globalThis.r=G.resolvePresentedChoice(e,e.choices[${row.i}])`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),row.text);assert.equal(state(h),before);assert.deepEqual(h.json(`qaNamed(qaResult(e,e.choices[${row.i}],r.out))`),textOnly?row.textOnly:row.reader);}
});
