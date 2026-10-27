const test=require('node:test'),assert=require('node:assert/strict');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const contexts=[['loc_lake','lake',1,480],['loc_spring','spring',0,240],['loc_lighthouse','lighthouse',0,480]];
function enter(id,node,min,stocks={}){const h=setup();h.run(`S.at='${node}';S.driving=null;S.day=4;S.min=${min};S.food=${stocks.food??24};S.water=28;S.scrap=${stocks.scrap??10};S.fatigue=10;S.van=60;S.party=[];S.flags.armed_age=true;globalThis.e=event('${id}');G.openEvent(e);G.beginPresentation(e);G.save();G.load();`);return h;}
function replay(h,ci){const before=h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.scrap,S.van,S.fatigue,S.notes,S.pendingPresentation])');assert(h.run('G.save();G.load()'));assert.equal(h.run(`G.resolvePresentedChoice(e,e.choices[${ci}]).applied`),false);assert.equal(h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.scrap,S.van,S.fatigue,S.notes,S.pendingPresentation])'),before);}
for(const [id,node,ci,duration]of contexts)for(const min of [330,540,1098,1260])test(`${id}: entry/result remains truthful for ${min}, and receipt stays frozen`,()=>{
 const h=enter(id,node,min);const entry=h.run('S.pendingPresentation.text');h.run('G.save();G.load();G.beginPresentation(e)');assert.equal(h.run('S.pendingPresentation.text'),entry);
 h.run('globalThis.start=S.day*1440+S.min');h.run(`globalThis.result=G.resolvePresentedChoice(e,e.choices[${ci}])`);assert.equal(h.run('result.ok'),true);assert.equal(h.run('S.day*1440+S.min-start'),duration);
 assert.doesNotMatch(h.run('result.out.text'),/밤하늘|밤새|떠나는 아침|부부는 아침|달빛 아래|어둠 저편/);assert.doesNotMatch(h.run('JSON.stringify(S.notes)'),/온천의 밤|조용한 밤|보낸 하룻밤/);
 if(id==='loc_spring')assert.doesNotMatch(h.run('result.out.text'),/사방에서|수다/);
 replay(h,ci);h.run('G.queuePresentation(null)');assert.equal(h.run('S.pendingPresentation'),null);
});
const costs=[['loc_maehwa','maehwa',1,'scrap',3],['loc_tunnelbook','tunnelbook',1,'food',1],['loc_filmset','filmset',0,'food',1]];
for(const [id,node,ci,resource,cost]of costs)test(`${id}: no stock cannot pay, free alternative survives, exact stock can pay once`,()=>{
 const h=enter(id,node,1200,{[resource]:0});assert.equal(h.run(`G.reqOk(G.choiceReq(e.choices[${ci}])).ok`),false);const before=h.run('JSON.stringify(S)');assert.equal(h.run(`G.resolvePresentedChoice(e,e.choices[${ci}]).ok`),false);assert.equal(h.run('JSON.stringify(S)'),before);
 assert(h.json('e.choices.map(c=>G.reqOk(G.choiceReq(c)).ok)').some(Boolean));h.run(`S.${resource}=${cost};G.save();G.load()`);assert.equal(h.run(`G.reqOk(G.choiceReq(e.choices[${ci}])).ok`),true);h.run(`globalThis.p=G.resolvePresentedChoice(e,e.choices[${ci}])`);assert.equal(h.run('p.ok'),true);assert.equal(h.run(`S.${resource}`),0);replay(h,ci);
 const stale=enter(id,node,1200,{[resource]:cost});stale.run(`S.${resource}=0;G.save();G.load()`);assert.equal(stale.run(`G.resolvePresentedChoice(e,e.choices[${ci}]).ok`),false);
});
for(const [id,node,ci]of [...contexts,...costs])test(`${id}: legacy paid result never gets rewritten or charged by current gates`,()=>{
 const h=enter(id,node,540,{food:0,scrap:0});h.run(`S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:${ci},outcomeIndex:0,text:'이미 지불한 밤과 식량 기록',chips:[{t:'기존 지급',c:'plus'}],view:{turns:[{kind:'narration',text:'기존 기록'}],index:0}};G.save();G.load();globalThis.p=G.resolvePresentedChoice(e,e.choices[${ci}]);`);assert.equal(h.run('p.applied'),false);assert.equal(h.run('p.out.text'),'이미 지불한 밤과 식량 기록');assert.equal(h.run('S.pendingPresentation.view.index'),0);assert.equal(h.run('S.food'),0);assert.equal(h.run('S.scrap'),0);replay(h,ci);
});
test('the inhabited lighthouse stays inhabited after the paid arrival and on reload',()=>{
 const h=enter('loc_lighthouse','lighthouse',540);h.run("S.fuel=20;G.resolvePresentedChoice(e,e.choices[0]);G.queuePresentation(null);globalThis.e=event('ev_lighthouse_visit');G.openEvent(e);G.beginPresentation(e);G.save();G.load()");
 const entry=h.run('S.pendingPresentation.text');assert.match(entry,/부부/);assert.match(entry,/비상등/);assert.doesNotMatch(entry,/불은 꺼졌지만|마지막 장/);assert.equal(h.run('e.scene'),'lighthouse-lamp-room-v1');
 h.run('globalThis.result=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('result.ok'));assert.equal(h.run('S.fuel'),17);assert.match(h.run('result.out.text'),/비상등/);assert.doesNotMatch(h.run('result.out.text'),/오랜만에 등대가|사람이 있었다는/);replay(h,0);
 const copy=enter('ev_lighthouse_visit','lighthouse',1260);copy.run('globalThis.result=G.resolvePresentedChoice(e,e.choices[1])');assert.match(copy.run('result.out.text'),/베껴/);assert.doesNotMatch(copy.run('result.out.text'),/일지를 배낭에/);replay(copy,1);
});
test('Leo and Eunsu can write a radio appeal without previously meeting the DJ',()=>{
 const h=enter('pair_leo_es_2','cheonan',540);h.run("S.party=['leo','eunsu'];S.comps.eunsu.bond=12;S.used=[];S.notes=[];G.queuePresentation(null);G.beginPresentation(e)");
 assert.doesNotMatch(h.run('S.pendingPresentation.text'),/DJ 누나/);
 h.run('globalThis.result=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('result.ok'));assert.equal(h.run('S.flags.pilot_appeal'),true);assert.doesNotMatch(h.run('result.out.text'),/다시 만나면|DJ가 한 말|외웠어요|주파수는 매일 밤/);
 assert.deepEqual(h.json("buildStoryTurns(result.out.text,e,{turnSpeakers:result.out.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)"),['eunsu','leo','leo','eunsu','leo']);
 assert.equal(h.json("buildStoryTurns(result.out.text,e,{turnSpeakers:result.out.turnSpeakers}).filter(t=>t.kind==='record').map(t=>t.who)")[0],'record');replay(h,0);
});
for(const [id,node]of [['ev_lighthouse_visit','lighthouse'],['pair_leo_es_2','cheonan']])test(`${id}: legacy paid prose and notes are preserved`,()=>{
 const h=enter(id,node,540);h.run("S.notes=[{title:'지난 기록',body:'오래 꺼진 등대와 다시 만난 DJ'}];S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'지난 여정에서 읽은 그대로',chips:[],view:{turns:[{kind:'narration',text:'그대로'}],index:0}};G.save();G.load();globalThis.result=G.resolvePresentedChoice(e,e.choices[0])");
 assert.equal(h.run('result.applied'),false);assert.equal(h.run('result.out.text'),'지난 여정에서 읽은 그대로');assert.equal(h.run('S.notes[0].body'),'오래 꺼진 등대와 다시 만난 DJ');replay(h,0);
});
