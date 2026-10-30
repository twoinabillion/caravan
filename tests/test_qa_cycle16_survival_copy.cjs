const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle16/survival/repairs17');
const {setup,fixture,reader}=require(path.join(dir,'runtime.cjs'));
const old=require(path.join(dir,'before.json')),delta=require(path.join(dir,'copy-delta.json'));
const plain=x=>JSON.parse(JSON.stringify(x));
const load=(h,file)=>assert(h.run('G.load('+JSON.stringify(fs.readFileSync(path.join(dir,file),'utf8'))+')'));
const state=h=>h.run('JSON.stringify([S.day,S.min,S.food,S.water,S.scrap,S.fuel,S.van,S.items,S.flags,S.notes,S.comps,S.stats,S.recruitQ])');
const oldCold='그는 버스를 잠그고 왕진 가방을 멨다.';
const newCold='그는 냉장 상자를 달구지 전원에 연결했다. 운반 중에도 상자 안을 차갑게 유지하기 위해서였다. 버스를 잠그고 왕진 가방을 멨다.';

test('natural unpaid meet_bus entry gives a cold-medicine note and the same recruitment receipt',()=>{
 const h=setup();load(h,'../attempt01/entry-162-meet_bus-export.json');
 assert.match(h.run('S.pendingPresentation.text'),/冷|냉장/);h.run("globalThis.e=G.presentationEvent('meet_bus');globalThis.knownSpeaker=false;globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);");
 assert(h.run('r.ok&&r.applied'));assert.equal(h.run('S.recruitQ.id'),'parkss');
 assert.equal(h.run("S.notes.find(n=>n.title==='박 선생').body"),delta[0].new);
 assert.equal(h.run('r.out.text'),old.meet_bus.choices[0].out[0].text.replace(oldCold,newCold));reader(h,0);
 const before=state(h);h.run("G.capturePresentationView({eventId:e.id,phase:'outcome',turns,knownSpeaker,index:0});G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);");assert.equal(h.run('r.applied'),false);assert.equal(state(h),before);
});
test('meet_bus refusal still creates no recruitment or medicine note',()=>{
 const h=setup();load(h,'../attempt01/entry-162-meet_bus-export.json');const before=state(h);
 h.run("globalThis.e=G.presentationEvent('meet_bus');globalThis.r=G.resolvePresentedChoice(e,e.choices[1]);");assert(h.run('r.ok&&r.applied'));assert.equal(h.run('S.recruitQ'),null);assert.equal(h.run('r.out.text'),old.meet_bus.choices[1].out[0].text);
 assert.equal(h.run("S.notes.some(n=>n.title==='박 선생')"),false);assert(before.length>0);
});
for(const textOnly of [false,true])test('legacy paid medicine note and receipt remain unchanged '+(textOnly?'without reader':'with reader'),()=>{
 const raw=JSON.parse(fs.readFileSync(path.join(dir,'old-meet-paid.json'),'utf8'));
 if(textOnly){raw.pendingPresentation.reading=null;raw.pendingPresentation.view=null;raw.pendingPresentation.authoredView=null;}
 const views=[];
 for(const frozen of [true,false]){
  const h=setup(frozen);assert(h.run('G.load('+JSON.stringify(JSON.stringify(raw))+')'));const before=state(h);
  h.run("globalThis.e=G.presentationEvent('meet_bus');globalThis.knownSpeaker=!!S.pendingPresentation.reading?.view?.knownSpeaker;globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);");
  assert.equal(h.run('r.applied'),false);assert.equal(state(h),before);assert.equal(h.run('r.out.text'),raw.pendingPresentation.text);
  assert.equal(h.run("S.notes.find(n=>n.title==='박 선생').body"),old.meet_bus.choices[0].out[0].fx.note.body);views.push(plain(reader(h,0)));
 }assert.deepEqual(views[1],views[0]);
});
function prepareEcho(h){h.run("S.pendingPresentation=null;G.startTravel('yangsan');S.stats.km=S.memories.choices.principle_words.dueKm;S.stats.events=S.memories.choices.principle_words.dueEvents;");assert(h.run('!!S.driving'));}
test('new paid choice snapshots the clarified sentence and emits it once after the existing distance gate',()=>{
 const h=fixture('story_family_principle',false,[]);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert(h.run('r.ok&&r.applied'));
 assert.equal(h.run('S.memories.choices.principle_words.echoLines[0][1]'),delta[1].new);
 prepareEcho(h);h.run('S.stats.km-=1');assert.equal(h.run('G.takeChoiceEcho()'),null);h.run('S.stats.km+=1;G.save();G.load();globalThis.echo=G.takeChoiceEcho()');
 assert.equal(h.run('echo.lines[0][1]'),delta[1].new);h.run('G.load()');assert.equal(h.run('G.takeChoiceEcho()'),null);
});
test('old paid echoLines retain the old words without reapplying the parent choice',()=>{
 const h=setup();load(h,'old-memory-paid.json');const before=state(h);
 h.run("globalThis.e=G.presentationEvent('story_family_principle');globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);");assert.equal(h.run('r.applied'),false);assert.equal(state(h),before);
 prepareEcho(h);h.run('G.save();G.load();globalThis.echo=G.takeChoiceEcho()');assert.equal(h.run('echo.lines[0][1]'),old.memory[0].lines[0][1]);h.run('G.load()');assert.equal(h.run('G.takeChoiceEcho()'),null);
});
function chatFixture(driving=true){const h=setup();h.run("S.flags.recruit_migration_v2=true;G.doRecruit('kangwoo');S.comps.kangwoo.bond=6;S.flags.massacre_known=true;globalThis.chat=D.chats.find(c=>c.id==='thread-massacre-kangwoo');D.chats=[chat];");if(driving)assert(h.run("G.startTravel('yangsan')"));return h;}
for(const driving of [true,false])test('first-day crew chat asks a present preference and plans tonight without laying a bed now '+driving,()=>{
 const h=chatFixture(driving);assert.equal(h.run('S.day'),1);assert.equal(h.run('!!S.driving'),driving);const before=state(h);
 h.run('globalThis.picked=G.pickChat()');assert.equal(h.run('picked.id'),'thread-massacre-kangwoo');
 assert.equal(h.run('picked.lines[1][1]'),delta[2].new);assert.equal(h.run('picked.lines[7][1]'),delta[3].new);
 assert.equal(state(h),before);h.run('G.load();S.day++');assert.equal(h.run('G.pickChat()'),null);
});
test('companion, massacre knowledge and bond6 remain necessary; once stamp persists from old save',()=>{
 for(const code of ["S.party=[]","S.flags.massacre_known=false","S.comps.kangwoo.bond=5"]){const h=chatFixture();h.run(code);assert.equal(h.run('G.pickChat()'),null);}
 const h=setup();load(h,'old-chat-seen.json');h.run("D.chats=[D.chats.find(c=>c.id==='thread-massacre-kangwoo')];S.day++;");const before=state(h);assert.equal(h.run('G.pickChat()'),null);assert.equal(state(h),before);
});
test('only four approved copy fields change; event effects, choices, probability, echo timing and chat gates remain exact',()=>{
 const h=setup(),now=plain(h.json("({meet_bus:G.presentationEvent('meet_bus'),memory:D.choiceMemories.story_family_principle,chat:D.chats.find(c=>c.id==='thread-massacre-kangwoo')})"));
 for(const d of delta){let o=now[d.collection==='events'?'meet_bus':d.collection==='chats'?'chat':'memory'];for(const k of d.path.slice(0,-1))o=o[k];assert.equal(o[d.path.at(-1)],d.new);o[d.path.at(-1)]=d.old;}
 assert.equal(now.meet_bus.choices[0].out[0].text,old.meet_bus.choices[0].out[0].text.replace(oldCold,newCold));now.meet_bus.choices[0].out[0].text=old.meet_bus.choices[0].out[0].text;
 assert.deepEqual(now,old);
});
