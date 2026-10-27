const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const id='pair_leo_jy_1';
function fixture(at='jeonju'){
 const h=setup();
 h.run(`S.at=${JSON.stringify(at)};S.driving=null;S.day=4;S.min=600;S.party=['leo','jaeyi'];S.food=12;S.water=12;S.scrap=20;S.fatigue=0;S.flags.story_done=true;globalThis.e=event('${id}');`);
 return h;
}
test('busking can be discovered by actual settlement exploration and paid once',()=>{
 const h=fixture();
 assert(h.run(`G.nodeEvents('jeonju').some(ev=>ev.id==='${id}')`));
 // Isolate the already-eligible event from unrelated lottery candidates.
 h.run(`S.used=D.events.filter(ev=>ev.id!=='${id}').map(ev=>ev.id);UI.showEvent=ev=>G.beginPresentation(ev);`);
 assert.equal(h.run('G.explore()'),true);
 assert.equal(h.run('S.pendingPresentation.eventId'),id);
 assert.equal(h.run('S.at'),'jeonju');assert.equal(h.run('S.min'),720);
 const before=h.json('[S.food,S.scrap,S.min]');
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');
 assert.equal(h.run('r.applied'),true);assert.equal(h.run('S.min'),before[2]);
 assert.equal(h.run('S.food'),before[0]+1);assert.equal(h.run('S.scrap'),before[1]+4);
 assert.equal(h.run(`G.nodeEvents('jeonju').some(ev=>ev.id==='${id}')`),false);
});
test('busking is absent from the driving and stopped-outskirts discovery pools',()=>{
 const h=fixture('gimhae');
 assert.equal(h.run(`G.nodeEvents('gimhae').some(ev=>ev.id==='${id}')`),false);
 assert.equal(h.run(`G.eligible('대화').some(ev=>ev.id==='${id}')`),false);
 h.run("S.at=null;S.driving={from:'muju',to:'jeonju',gone:10,dist:60,road:'normal'}");
 assert.equal(h.run(`G.eligible().some(ev=>ev.id==='${id}')`),false);
});
test('settlement busking still requires both actual companions',()=>{
 const h=fixture();h.run("S.party=['leo']");
 assert.equal(h.run(`G.nodeEvents('jeonju').some(ev=>ev.id==='${id}')`),false);
 h.run("S.party=['jaeyi']");
 assert.equal(h.run(`G.nodeEvents('jeonju').some(ev=>ev.id==='${id}')`),false);
});
test('an already-open unpaid outskirts scene survives Continue and pays only once',()=>{
 const h=fixture('gimhae');
 // This represents an entry opened by the older unrestricted pool, not a new draw.
 h.run("G.beginPresentation(e);S.used.push(e.id);S.pendingPresentation.text='기존에 열린 버스킹 제안';G.save()");
 assert.equal(h.run('G.load()'),true);
 assert.equal(h.run('S.pendingPresentation.text'),'기존에 열린 버스킹 제안');
 const before=h.json('[S.food,S.scrap,S.min,S.at]');
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');
 assert.equal(h.run('r.ok'),true);assert.equal(h.run('r.applied'),true);
 assert.deepEqual(h.json('[S.food,S.scrap,S.min,S.at]'),[before[0]+1,before[1]+4,before[2],before[3]]);
 h.run('G.save();G.load()');const paid=h.run('JSON.stringify(S)');
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');
 assert.equal(h.run('r.applied'),false);assert.equal(h.run('JSON.stringify(S)'),paid);
});
test('a historical paid roadside result remains frozen under the settlement gate',()=>{
 const h=fixture('gimhae');
 h.run("S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'다음 정착지 장터에서 세 곡짜리 공연이 열렸다.',chips:[{t:'식량 +1',c:'plus'}]};G.save();G.load()");
 const before=h.run('JSON.stringify(S)');
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');
 assert.equal(h.run('r.ok'),true);assert.equal(h.run('r.applied'),false);
 assert.equal(h.run('r.out.text'),'다음 정착지 장터에서 세 곡짜리 공연이 열렸다.');
 assert.equal(h.run('JSON.stringify(S)'),before);
});
