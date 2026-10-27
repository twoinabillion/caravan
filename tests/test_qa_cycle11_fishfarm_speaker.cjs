const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const root=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle11/story');
const entry=fs.readFileSync(path.join(root,'new-visual-entry-replays/fishfarm/agent03/attempt01/normal-exp_fishfarm-entry.json'),'utf8');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'fishfarm-speaker-fix/before-event.json'),'utf8'));
function fixture(party){const h=setup();assert(h.run('G.load('+JSON.stringify(entry)+')'));h.run(`S.party=${JSON.stringify(party)};globalThis.e=event('exp_fishfarm');G.save();G.load();G.rollOut=outs=>outs[1];`);return h;}
function reader(h){h.run('globalThis.turns=Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(r.out.text,e,{frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:r.out.turnSpeakers})');return h.json('turns');}
const receiptState=h=>h.run('JSON.stringify([S.food,S.water,S.scrap,S.min,S.items,S.flags,S.notes,S.comps])');
for(const party of [[],['leo'],['minji','parkss']])test(`fishfarm release quote belongs to player, including result reload: ${party.join('+')||'solo'}`,()=>{
 const h=fixture(party),beforeFood=h.run('S.food');h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('r.ok&&r.applied'));
 const turns=reader(h),dialogue=turns.filter(t=>t.kind==='dialogue');
 assert.deepEqual(dialogue.map(t=>t.who),['me']);assert.equal(dialogue[0].text,'쟤는 이 수조의 주인이다.');assert.notEqual(dialogue[0].name,'???');assert(!dialogue[0].speakerUncertain);
 assert.equal(h.run('S.food'),beforeFood+2);assert.equal(h.run('S.min'),510);
 const paid=receiptState(h);h.run('S.pendingPresentation.view={turns,index:1};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');
 assert.equal(h.run('r.applied'),false);assert.deepEqual(reader(h),turns);assert.equal(receiptState(h),paid);
});
test('fishfarm old paid reader keeps historical speaker and never reapplies rewards',()=>{
 const h=setup(),paid=fs.readFileSync(path.join(root,'fishfarm-speaker-fix/legacy-paid.json'),'utf8'),old=JSON.parse(fs.readFileSync(path.join(root,'fishfarm-speaker-fix/before-actual-reader.json'),'utf8'));
 assert(h.run('G.load('+JSON.stringify(paid)+')'));const before=receiptState(h);h.run("globalThis.e=event('exp_fishfarm');globalThis.r=G.resolvePresentedChoice(e,e.choices[0])");
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),baseline.choices[0].out[1].text);assert.deepEqual(reader(h),old);assert.equal(receiptState(h),before);
});
test('text-only old paid fishfarm receipt does not adopt the new speaker route',()=>{
 const h=setup(),paid=JSON.parse(fs.readFileSync(path.join(root,'fishfarm-speaker-fix/legacy-paid.json'),'utf8'));
 paid.pendingPresentation.view=null;paid.pendingPresentation.reading=null;paid.pendingPresentation.authoredView=null;
 assert(h.run('G.load('+JSON.stringify(JSON.stringify(paid))+')'));const before=receiptState(h);h.run("globalThis.e=event('exp_fishfarm');globalThis.r=G.resolvePresentedChoice(e,e.choices[0])");
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.frozenTextOnly'),true);assert.equal(h.run('r.out.text'),baseline.choices[0].out[1].text);
 assert.equal(reader(h).find(t=>t.kind==='dialogue').who,'passer_man');assert.equal(receiptState(h),before);
});
test('fishfarm outcome text, probability, effects, gates and choice order are unchanged',()=>{
 const h=fixture([]),current=h.json('e');delete current.choices[0].out[1].turnSpeakers;assert.deepEqual(current,baseline);
 h.run('G.rollOut=outs=>outs[0];globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('S.food'),10);assert.equal(reader(h).filter(t=>t.kind==='dialogue').length,0);
});
