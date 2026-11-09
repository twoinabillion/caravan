'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function setup(){
 const noop=()=>{},heard=[],radios=[],store=new Map();
 const UI=new Proxy({modalOpen:()=>false,playChat:c=>heard.push(c),speak:b=>heard.push(b),playRadio:()=>radios.push(true)},{get:(o,k)=>o[k]||noop});
 const context=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:noop,clearTimeout:noop,document:{readyState:'loading',addEventListener:noop},window:{dispatchEvent:noop},CustomEvent:function(){},UI,SND:new Proxy({},{get:()=>noop}),localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
 const run=s=>vm.runInContext(s,context),json=s=>JSON.parse(run('JSON.stringify('+s+')'));
 for(const file of [...require('../tools/content-registry.cjs').STATIC_CONTENT_FILES,...fs.readdirSync(root+'/src').filter(f=>/^04[a-h]-.*\.js$/.test(f)).sort().map(f=>'src/'+f)])run(fs.readFileSync(root+'/'+file,'utf8'));
 // This is a focused fixture, never a fresh persona journey.
 run("G.seedOverride=2801;G.newGame('onroad','리듬검사','skip');S.party=['minji','kangwoo'];S.day=3;G.ensureNarrativeState();");
 return {run,json,heard,radios};
}
test('long road chats play fully once, then a short honest continuation across save/reload',()=>{
 const h=setup();h.run("D.chats=[D.chats.find(c=>c.id==='daily-me-minji-hands')]");
 const original=h.json('D.chats[0].lines');assert(original.length>4);
 assert.deepEqual(h.json('G.pickChat().lines'),original);
 assert.equal(h.run('G.pickChat()'),null,'same-day chat stays exhausted');
 h.run('S.day++;G.save();G.load(G.exportSave())');
 const repeat=h.json('G.pickChat().lines');assert(repeat.length<=3);assert.notDeepEqual(repeat,original);
 assert.deepEqual(h.json('D.chats[0].lines'),original,'authored first conversation is immutable');
});
test('anonymous legacy brake conversation recalls its previous practical advice and awards pair affinity once',()=>{
 const h=setup();h.run("globalThis.brake=D.chats[25];D.chats=D.chats.filter(c=>c===brake);");
 const original=h.json('D.chats[0].lines');h.run('G.pickChat()');const relation=h.run("G.relation('minji','kangwoo')");
 h.run('S.day++');const repeat=h.json('G.pickChat().lines');assert(repeat.length<=3);assert.notDeepEqual(repeat,original);
 assert.equal(h.run("G.relation('minji','kangwoo')"),relation);
});
test('old seen ledger skips exhausted long vignettes while one-line ambient remains eligible',()=>{
 const h=setup();h.run("D.chats=[{id:'legacy-long',lines:[['minji','a'],['me','b'],['minji','c'],['me','d']]},{id:'short',lines:[['minji','한마디']]}];S._crewChatSeen={'daily:legacy-long':{day:1,km:12}};rng=()=>0;");
 assert.equal(h.run('G.pickChat().id'),'short');
});
test('the actual old anonymous pair ledger at index25 resumes with a continuation and no new pair reward',()=>{
 const h=setup();h.run("D.chats=D.chats.map((c,i)=>i===25?c:{...c,need:{comp:'absent'}});S.relations.seenChats['chat:25']=true;G.save();G.load(G.exportSave())");
 const before=h.run("G.relation('minji','kangwoo')");
 const reply=h.json('G.pickChat().lines');assert(reply.length<=3);assert.match(reply[0][1],/브레이크/);
 assert.equal(h.run("G.relation('minji','kangwoo')"),before);
});
test('a continuation cannot introduce a passenger who is absent now',()=>{
 const h=setup();h.run("D.chats=[D.chats.find(c=>c.id==='daily-me-minji-hands')];G.pickChat();S.day++;S.party=[]");
 assert.equal(h.run('G.pickChat()'),null);
});
test('father record creates one finite persisted quiet interval only when paid for the first time',()=>{
 const h=setup();h.run("G.applyFx({flag:'father_fate_known'})");
 assert.equal(h.run('G.roadStoryQuietRemaining()'),12);
 h.run('G.save();G.load(G.exportSave());G.resetDriveTimers()');assert.equal(h.run('G.roadStoryQuietRemaining()'),12);
 h.run('G.consumeRoadStoryQuiet(4)');assert.equal(h.run('G.roadStoryQuietRemaining()'),8);
 h.run('G.save();G.load(G.exportSave());G.resetDriveTimers()');assert.equal(h.run('G.roadStoryQuietRemaining()'),8);
 h.run("G.applyFx({flag:'father_fate_known'})");assert.equal(h.run('G.roadStoryQuietRemaining()'),8,'same paid flag cannot re-arm silence');
 h.run('G.consumeRoadStoryQuiet(100)');assert.equal(h.run('G.roadStoryQuietRemaining()'),0);
 h.run('S.ended=true;G.applyFx({flag:"father_fate_known"})');assert.equal(h.run('G.roadStoryQuietRemaining()'),0);
});
test('quiet actual driving keeps travel moving and leaves choice echoes unconsumed',()=>{
 const h=setup();h.run("G.applyFx({flag:'father_fate_known'});S.driving={from:'busan',to:'miryang',dist:100,gone:0,road:'normal',slots:[],si:0};globalThis.echoCalls=0;G.takeChoiceEcho=()=>{echoCalls++;return {lines:[['minji','평소 잡담']]}};rng=()=>0;");
 const foodBefore=h.run('S.food');
 h.run('G.tick(10)');assert.equal(h.run('echoCalls'),0);assert.deepEqual(h.heard,[]);assert.equal(h.run('G.roadStoryQuietRemaining()'),2);assert(h.run('S.driving.gone')>0);assert(h.run('S.food')<foodBefore,'scheduled breakfast still pays its normal food cost');
 h.run('G.tick(31)');assert(h.run('echoCalls')>0,'normal conversation resumes after silence expires');
});
test('unknown or malformed quiet state does not mute a legacy journey indefinitely',()=>{
 const h=setup();assert.equal(h.run('G.roadStoryQuietRemaining()'),0);
 for(const value of ['{remaining:"forever"}','{remaining:-5}','{remaining:Infinity}','null']){h.run('S.roadStoryQuiet='+value);assert.equal(h.run('G.roadStoryQuietRemaining()'),0);}
});
test('a useful radio transmission remains available while ordinary driving chatter is quiet',()=>{
 const h=setup();h.run("S.driving={from:'busan',to:'miryang',dist:100,gone:0,road:'normal',slots:[],si:0};S.flags.radio_fixed=true;D.chats=[];D.banter=[];G.takeChoiceEcho=()=>null;G.tick(29);");
 assert.equal(h.radios.length,0);h.run("G.applyFx({flag:'father_fate_known'});G.tick(2)");
 assert.equal(h.run('G.roadStoryQuietRemaining()'),10);assert.equal(h.radios.length,1);
});
