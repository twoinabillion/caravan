const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function enter(min){const h=setup();h.run(`S.at='filmset';S.driving=null;S.day=4;S.min=${min};S.food=24;S.water=28;S.fatigue=60;S.party=[];S.used=[];globalThis.e=event('loc_filmset');G.openEvent(e);G.beginPresentation(e);G.save();G.load();`);return h;}
for(const min of [118,540,900,1260])test(`filmset ${min}: entry, sleep and meal remain truthful across time and reload`,()=>{
 const h=enter(min);assert.doesNotMatch(h.run('e.title'),/저녁|아침|밤/);assert.doesNotMatch(h.run('e.choices[0].label'),/하룻밤/);
 const entry=h.run('S.pendingPresentation.text');h.run('G.save();G.load();G.beginPresentation(e)');assert.equal(h.run('S.pendingPresentation.text'),entry);
 assert.deepEqual(h.json('e.choices[0].req'),{food:1});assert.deepEqual(h.json('e.choices[0].out[0].fx'),{time:600,sleeping:true,fatigue:-30,food:-1,moodAll:6,note:{type:'인물',title:'세트장 관리인',body:'가짜 마을을 오랫동안 쓸고 있는 사람. "가짜도 정성 들이면 사람을 살려."',links:['시대극 세트장']}});
 h.run('globalThis.before=S.day*1440+S.min;globalThis.r=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('r.ok'));assert.equal(h.run('S.day*1440+S.min-before'),600);assert.doesNotMatch(h.run('r.out.text'),/저녁상|하룻밤|다음 날 아침/);assert.match(h.run('r.out.text'),/잠들기 전에 차린 상/);
 const paid=h.run('JSON.stringify([S.food,S.water,S.fatigue,S.day,S.min,S.notes,S.pendingPresentation])');h.run('G.save();G.load();globalThis.replayed=G.resolvePresentedChoice(e,e.choices[0])');assert.equal(h.run('replayed.applied'),false);assert.equal(h.run('JSON.stringify([S.food,S.water,S.fatigue,S.day,S.min,S.notes,S.pendingPresentation])'),paid);
 h.run('G.queuePresentation(null)');assert.equal(h.run('S.pendingPresentation'),null);assert(h.run("G.canTravelTo('namwon').ok"));
});
test('filmset keeps a free alternative and historical paid supper prose',()=>{
 const h=enter(118);h.run('S.food=0');assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[0])).ok'),false);assert.equal(h.run('G.reqOk(G.choiceReq(e.choices[1])).ok'),true);
 h.run(`S.pendingPresentation={version:1,eventId:e.id,phase:'result',choiceIndex:0,outcomeIndex:0,text:'저녁상엔 노인이 담근 장아찌와 우리 식량이 합쳐졌다.',chips:[],view:{turns:[{kind:'narration',text:'이전 유료 결과'}],index:0}};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),'저녁상엔 노인이 담근 장아찌와 우리 식량이 합쳐졌다.');assert.equal(h.run('S.food'),0);
});
test('actual UI resolveChoice returns to fatal ending without rendering the uncompleted six-hour result',()=>{
 const h=setup(),ui=fs.readFileSync(require('node:path').join(__dirname,'../src/07-ui.js'),'utf8');
 h.run(`S.at='filmset';S.driving=null;S.day=14;S.min=1279;S.water=0;S.food=0;S.thirst=3;S.fatigue=100;globalThis.e=event('crisis_collapse2');G.openEvent(e);G.beginPresentation(e);globalThis.endingCalls=[];UI.showEnding=kind=>endingCalls.push(kind);globalThis.curEv=e;globalThis.curStory={};globalThis.clearStoryAuto=()=>{};globalThis.storyOutcomeIsQuiet=()=>false;globalThis.AMBI={result(){throw Error('fatal result audio/render must not run')}};globalThis.$=()=>{throw Error('fatal result DOM must not render')};`);
 h.run(ui.slice(ui.indexOf('  function resolveChoice(choice){'),ui.indexOf('  function closeEvent(){')));h.run('resolveChoice(e.choices[0])');
 assert.equal(h.run('S.ended'),true);assert.equal(h.run('S.endKind'),'thirst');assert.deepEqual(h.json('endingCalls'),['thirst']);assert.equal(h.run('S.min'),0);assert.equal(h.run('S.day'),15);assert.equal(h.run('S.pendingPresentation'),null);assert.equal(h.run('S.fatigue'),100);
});
