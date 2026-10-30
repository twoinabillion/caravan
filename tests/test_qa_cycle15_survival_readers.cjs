const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle15/survival/repairs16');
const {setup,fixture,reader}=require(path.join(dir,'runtime.cjs'));
const base=require(path.join(dir,'before-events.json')),copies=require(path.join(dir,'copy-delta.json'));
const legacy=require(path.join(dir,'legacy-index.json'));
const plain=x=>JSON.parse(JSON.stringify(x));
const roles=turns=>plain(turns).filter(t=>t.kind!=='narration').map(t=>[t.kind,t.who]);
const say=ids=>ids.map(id=>['dialogue',id]);
const state=h=>h.run('JSON.stringify([S.food,S.water,S.scrap,S.fuel,S.min,S.items,S.flags,S.notes,S.comps,S.stats])');
const expected={
 ev_comp_argument:{entry:['kangwoo','minji','kangwoo'],out:[['me','minji'],['me'],['me','kangwoo']]},
 comp_dialect:{entry:['minji','kangwoo','minji','kangwoo','minji','minji','kangwoo','minji'],out:[[],['minji','me','minji','me']]},
 ev_cinema_film:{entry:[],out:[[],[],['me']]},
 near_jinju_lantern:{entry:[],out:[['passer_elder','passer_elder','me','passer_elder','passer_elder','me','passer_elder'],[]]}
};
for(const [id,want] of Object.entries(expected)){
 test(id+' new entry and unpaid reload preserve actual reader',()=>{
  const h=fixture(id,false,['minji','kangwoo']);assert.deepEqual(roles(h.json('entryTurns')),say(want.entry));
  const before=state(h);h.run('G.save();G.load()');assert.deepEqual(roles(h.json('S.pendingPresentation.reading.view.turns')),say(want.entry));assert.equal(state(h),before);
 });
 for(const [i,w] of want.out.entries())test(id+' choice '+i+' speaks in its own context and paid reload is inert',()=>{
  const h=fixture(id,false,['minji','kangwoo']);
  // Entry scripts start at index zero; an outcome must explicitly own its role list.
  if(['ev_comp_argument','comp_dialect'].includes(id))h.run("e.turnSpeakers=['passer_man'];");
  h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);`);assert(h.run('r.ok&&r.applied'));
  const turns=reader(h,i);assert.deepEqual(roles(turns),say(w));
  assert(plain(turns).every(t=>t.name!=='???'&&!t.speakerUncertain));
  if(id==='near_jinju_lantern'&&i===0)assert(plain(turns).filter(t=>t.who==='passer_elder').every(t=>t.name==='등을 만드는 노인'));
  const before=state(h);h.run(`G.capturePresentationView({eventId:e.id,phase:'outcome',turns,knownSpeaker,index:1});G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);`);
  assert.equal(h.run('r.applied'),false);assert.deepEqual(plain(reader(h,i)),plain(turns));assert.equal(state(h),before);
 });
}
for(const party of [['minji','kangwoo'],['parkss','leo'],['eunsu','jaeyi'],['leo','minji','kangwoo']])test('dialect questioner and respondent are actual crew '+party.join(','),()=>{
 const h=fixture('comp_dialect',false,party),[a,b]=party;
 assert.deepEqual(roles(h.json('entryTurns')),say([a,b,a,b,a,a,b,a]));
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1]);');assert.deepEqual(roles(reader(h,1)),say([a,'me',a,'me']));
});
test('dialect participation keeps the quoted topic inside its complete narration paragraph',()=>{
 const h=fixture('comp_dialect',false,['minji','kangwoo']);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');
 const turns=plain(reader(h,0));assert.deepEqual(turns.map(t=>t.kind),['narration','narration','narration']);
 assert.equal(turns.map(t=>t.text).join('\n\n'),base.comp_dialect.choices[0].out[0].text);
});
for(const i of [1,2])for(const min of [390,1200])test('argument '+i+' reports the immediate reaction at '+min,()=>{
 const h=fixture('ev_comp_argument',false,['minji','kangwoo']);h.run(`S.min=${min};globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);`);
 assert(h.run('r.ok&&r.applied'));assert.equal(h.run('S.min'),min+(i===2?40:0));
 assert.doesNotMatch(h.run('r.out.text'),/며칠|그날 이후|그 뒤로/);
 assert.match(h.run('r.out.text'),/창밖/);assert.equal(h.run(`S.comps.${i===2?'kangwoo':'minji'}.mood`),77);
});
for(const min of [600,1200])test('cinema viewing is eligible in day or night and does not invent night '+min,()=>{
 const h=fixture('ev_cinema_film',false,['minji']);h.run(`S.at='daejeon';S.min=${min};S.dog=false;`);
 assert(h.run('G.eventAvailable(e,{mode:"local"})'));h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[1]);');
 assert(h.run('r.ok&&r.applied'));assert.equal(h.run('S.min'),min+70);assert.doesNotMatch(h.run('r.out.text'),/밤이었다/);
 // The 20:00 viewing crosses the existing 21:00 meal: +2 snacks, -1 meal.
 assert.equal(h.run('S.food'),min===1200?21:22);
});
for(const party of [[],['minji'],['minji','kangwoo','eunsu']])for(const dog of [false,true])test('lantern preserves roster gate and avoids invented participants '+party.length+'/'+dog,()=>{
 const h=fixture('near_jinju_lantern',false,party);h.run(`S.at='jinju';S.min=1200;S.dog=${dog};`);
 assert.equal(h.run('G.eventAvailable(e,{mode:"node",node:"jinju"})'),party.length>0);
 if(!party.length)return; // Zero crew remains excluded; old-open result compatibility is covered below.
 h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert(h.run('r.ok&&r.applied'));assert.equal(h.run('S.min'),1260);
 assert.doesNotMatch(h.run('r.out.text'),/등 다섯|개 발자국|플러스/);assert.match(h.run('r.out.text'),/우리가 만든 등들이/);
 assert.deepEqual(plain(h.json('r.out.fx')),base.near_jinju_lantern.choices[0].out[0].fx);
});
for(const textOnly of [false,true])test('all10 outcomes plus lantern 0/1/many crew and dog variants keep old '+(textOnly?'text-only':'reader')+' paid receipts',()=>{
 for(const s of legacy){
  const save=JSON.parse(fs.readFileSync(path.join(dir,s.file),'utf8'));
  if(textOnly){save.pendingPresentation.reading=null;save.pendingPresentation.view=null;save.pendingPresentation.authoredView=null;}
  const compared=[];
  for(const frozen of [true,false]){
   const h=setup(frozen);assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));
   const before=state(h);h.run(`globalThis.e=G.presentationEvent('${s.id}');globalThis.knownSpeaker=${textOnly?'false':'!!S.pendingPresentation.reading.view.knownSpeaker'};globalThis.r=G.resolvePresentedChoice(e,e.choices[${s.i}]);`);
   assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),save.pendingPresentation.text);assert.equal(state(h),before);
   if(textOnly)assert(h.run('r.out.frozenTextOnly'));
   compared.push(plain(reader(h,s.i)));
  }
  assert.deepEqual(compared[1],compared[0],s.file);
 }
});
test('all four event mechanics, notes and words match frozen15 apart from four approved sentences and role metadata',()=>{
 const h=setup();for(const [id,old] of Object.entries(base)){
  const now=plain(h.json(`JSON.parse(JSON.stringify(G.presentationEvent('${id}'),(k,v)=>typeof v==='function'?v.toString():v))`));
  for(const d of copies.filter(d=>d.id===id)){let o=now;for(const k of d.path.slice(0,-1))o=o[k];assert.equal(o[d.path.at(-1)],d.new);o[d.path.at(-1)]=d.old;}
  if(id==='comp_dialect'){
   h.run("S.party=['parkss','eunsu']");
   assert.equal(h.run("prose(G.presentationEvent('comp_dialect').choices[1].out[0].text)"),'"점수는요?" "안 매겨요." "왜요." "다 붙었어요. 어디 내려놔도 밥은 얻어먹겠더라고요."\n\n채점표는 끝내 안 나왔다.');
   h.run("S.party=['eunsu','parkss']");
   assert.equal(h.run("prose(G.presentationEvent('comp_dialect').choices[1].out[0].text)"),old.choices[1].out[0].text);
   now.choices[1].out[0].text=old.choices[1].out[0].text;
  }
  const clean=v=>JSON.parse(JSON.stringify(v,(k,v)=>['turnSpeakers','turns'].includes(k)?undefined:v));assert.deepEqual(clean(now),clean(old),id);
 }
});
