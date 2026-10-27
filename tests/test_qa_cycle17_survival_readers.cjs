const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle17/survival/repairs18');
const {setup,fixture,reader}=require(path.join(dir,'runtime.cjs'));
const base=require(path.join(dir,'before-events.json')),delta=require(path.join(dir,'metadata-delta.json')),legacy=require(path.join(dir,'legacy-index.json'));
const plain=x=>JSON.parse(JSON.stringify(x));
const roles=turns=>plain(turns).filter(t=>!['narration','thought'].includes(t.kind)).map(t=>[t.kind,t.who]);
const say=ids=>ids.map(id=>['dialogue',id]);
const state=h=>h.run('JSON.stringify([S.food,S.water,S.scrap,S.fuel,S.min,S.items,S.flags,S.notes,S.comps,S.stats])');
const route=(r,party)=>r.map(t=>{const obj=typeof t==='string'?{who:t}:t;return [obj.kind||'dialogue',obj.who==='party_first'?(party[0]||'me'):obj.who==='party_second'?(party[1]||party[0]||'me'):obj.who];});
const rosters=[[],['minji'],['minji','leo'],['leo','minji','parkss'],['kangwoo','eunsu','jaeyi']];
for(const [id,d] of Object.entries(delta))test(id+' actual reader roles, all outcomes, unpaid/paid reload and reordered roster',()=>{
 for(const party of rosters){
  const h=fixture(id,false,party),beforeEntry=h.json('entryTurns');
  if(d.entry)assert.deepEqual(roles(beforeEntry),route(d.entry,party));
  const entryState=state(h);h.run('G.save();G.load()');assert.deepEqual(h.json('S.pendingPresentation.reading.view.turns'),beforeEntry);assert.equal(state(h),entryState);
  for(const [i,c] of base[id].choices.entries())for(let j=0;j<c.out.length;j++){
   const f=fixture(id,false,party);
   // Every result must own its routes rather than inherit the entry script.
   f.run(`e.turnSpeakers=['passer_man'];globalThis.realPick=G.pickOutcome;G.pickOutcome=(e,c)=>c.out[${j}];globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);G.pickOutcome=realPick;`);
   assert(f.run('r.ok&&r.applied'));const turns=reader(f,i);
   let expected=d.choices?.[`${i}.${j}`];
   if(id==='comp_van_name'&&i===0)expected=['me','party_first','me','party_second','party_first'];
   if(id==='exp_arcade'&&i===1)expected=['me'];
   assert(expected,`${id}:${i}.${j} requires its own expected route`);
   assert.deepEqual(roles(turns),route(expected,party),`${id}:${i}.${j}:${party}`);
   assert(plain(turns).every(t=>t.name!=='???'&&!t.speakerUncertain));
   if(id==='exp_arcade'&&i===0)assert.equal(turns.find(t=>t.kind==='dialogue').name,'에어하키 고수');
   if(id==='comp_radio_war'&&i===0){const t=turns.find(t=>t.kind==='record');assert.equal(t.name,'정착지 뉴스');assert.equal(t.medium,'radio');}
   if(id==='comp_van_name'&&i===0){assert(turns.some(t=>t.kind==='narration'&&t.text.includes('"달구지 1호"')));assert(!turns.some(t=>t.kind==='dialogue'&&t.text==='달구지 1호'));}
   if(id==='comp_ghost_story'&&i===0&&j===0)assert(turns.some(t=>t.kind==='narration'&&t.text.includes('"월요일 아침 지하철"')));
   const paidState=state(f);f.run(`G.capturePresentationView({eventId:e.id,phase:'outcome',turns,knownSpeaker,index:1});G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);`);
   assert.equal(f.run('r.applied'),false);assert.deepEqual(plain(reader(f,i)),plain(turns));assert.equal(state(f),paidState);
  }
 }
});
test('entry eligibility remains frozen17 for solo, one and reordered two/three crews',()=>{
 for(const party of rosters)for(const id of Object.keys(base)){
  const got=[];for(const frozen of [true,false]){const h=fixture(id,frozen,party);h.run("S.wx='clear';S.min=1200;S.water=1;S.pendingPresentation=null;");got.push(h.run('!!G.eventAvailable(e,{mode:"pool"})'));}assert.equal(got[1],got[0],id+'/'+party);
 }
});
for(const textOnly of [false,true])test('all old paid outcomes and old-open solo/many states retain '+(textOnly?'text-only':'reader')+' receipts',()=>{
 for(const s of legacy){
  const save=JSON.parse(fs.readFileSync(path.join(dir,s.file),'utf8'));
  if(textOnly){save.pendingPresentation.reading=null;save.pendingPresentation.view=null;save.pendingPresentation.authoredView=null;}
  const compared=[];
  for(const frozen of [true,false]){
   const h=setup(frozen);assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));const before=state(h);
   h.run(`globalThis.e=G.presentationEvent('${s.id}');globalThis.knownSpeaker=${textOnly?'false':'!!S.pendingPresentation.reading.view.knownSpeaker'};globalThis.r=G.resolvePresentedChoice(e,e.choices[${s.i}]);`);
   assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),save.pendingPresentation.text);assert.equal(state(h),before);
   if(textOnly)assert(h.run('r.out.frozenTextOnly'));compared.push(plain(reader(h,s.i)));
  }
  assert.deepEqual(compared[1],compared[0],s.file);
 }
});
test('all eleven definitions retain words, notes, costs, gates, probability, once and choice indices',()=>{
 const h=setup(),clean=v=>JSON.parse(JSON.stringify(v,(k,v)=>['turnSpeakers','turns'].includes(k)?undefined:v));
 for(const [id,old] of Object.entries(base)){
  const now=h.json(`JSON.parse(JSON.stringify(G.presentationEvent('${id}'),(k,v)=>typeof v==='function'?v.toString():v))`);
  if(id==='comp_snore'){
   assert.equal(now.choices[0].out[0].text,"S=>`차를 세운 김에 녹음을 틀었다. 잠이 덜 깬 두 사람이 스피커 쪽으로 몸을 기울였다.\\n\\n\"이거 트럭 지나가는 소리 아니야?\" \"${S.party?.[0]==='parkss'?'선생님 코에서 난 소리인데요.':'네 콧구멍에서 난 소리야.'}\"\\n\\n범인은 끝까지 부인했다. 다음 조수석은 지도 담당이라며 서로 등을 떠밀다가, 둘 다 웃어서 다시 녹음 버튼을 눌렀다.`");
   assert.equal(h.run("G.presentationEvent('comp_snore').choices[0].out[0].text({party:['eunsu','parkss']})"),old.choices[0].out[0].text);
   assert.equal(h.run("G.presentationEvent('comp_snore').choices[0].out[0].text({party:['parkss','eunsu']})"),old.choices[0].out[0].text.replace('네 콧구멍에서 난 소리야.','선생님 코에서 난 소리인데요.'));
   now.choices[0].out[0].text=old.choices[0].out[0].text;
  }
  if(id==='comp_water_fight'){
   assert.equal(now.choices[1].out[0].text,old.choices[1].out[0].text.replace('결국 반 통이 남았다.','남은 물은 나눠 마시기로 했다.'));
   now.choices[1].out[0].text=old.choices[1].out[0].text;
  }
  assert.deepEqual(clean(now),clean(old),id);
 }
});
test('authored van naming preserves every word and treats its added formal name as narration',()=>{
 const h=fixture('comp_van_name',false,['leo','minji']);h.run('globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');const turns=reader(h,0);
 const normalize=s=>s.replace(/[\s"“”]/g,'');assert.equal(normalize(turns.map(t=>t.text).join(' ')),normalize(base.comp_van_name.choices[0].out[0].text));
});
test('four actual normal frozen17 unpaid entries finish once and retain their paid reader on reload',()=>{
 const natural=[['exp_arcade',0,'survival/attempt01/entry-64-exp_arcade-export.json'],['wx_bigwash',0,'survival/attempt01/entry-456-wx_bigwash-export.json'],['comp_food_debate',0,'survival/attempt01/entry-563-comp_food_debate-export.json'],['comp_hometown',0,'story/agent03/attempt01/normal-unpaid-401-comp_hometown.json']];
 for(const [id,i,file] of natural){
  const save=JSON.parse(fs.readFileSync(path.join(dir,'../../',file),'utf8')),h=setup();assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));
  const oldView=h.json('S.pendingPresentation.reading?.view||null');assert.equal(h.run('S.pendingPresentation.eventId'),id);
  h.run(`globalThis.e=G.presentationEvent('${id}');globalThis.knownSpeaker=!!S.pendingPresentation.reading?.view?.knownSpeaker;G.save();G.load();`);
  assert.deepEqual(h.json('S.pendingPresentation.reading?.view||null'),oldView);
  h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);`);assert(h.run('r.ok&&r.applied'));const turns=reader(h,i);assert.deepEqual(roles(turns),route(delta[id].choices[`${i}.0`],save.party));
  const paidState=state(h);h.run(`G.capturePresentationView({eventId:e.id,phase:'outcome',turns,knownSpeaker,index:1});G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);`);assert.equal(h.run('r.applied'),false);assert.deepEqual(plain(reader(h,i)),plain(turns));assert.equal(state(h),paidState);
 }
});
