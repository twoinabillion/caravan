const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle17/survival/repairs18-additional'),{setup,fixture,reader}=require(path.join(dir,'runtime.cjs'));
const base=require(path.join(dir,'before-events.json')),routes=require(path.join(dir,'routes.json')),legacy=require(path.join(dir,'legacy-index-final.json')),copies=require(path.join(dir,'copy-delta-final.json'));
const plain=x=>JSON.parse(JSON.stringify(x)),roles=t=>plain(t).filter(t=>!['narration','thought'].includes(t.kind)).map(t=>[t.kind,t.who]);
const state=h=>h.run('JSON.stringify([S.food,S.water,S.scrap,S.fuel,S.min,S.items,S.flags,S.notes,S.comps,S.stats])');
const role=(r,p)=>r.map(t=>{const o=typeof t==='string'?{who:t}:t;return [o.kind||'dialogue',o.who==='party_first'?(p[0]||'me'):o.who==='party_second'?(p[1]||p[0]||'me'):o.who]});
const rosters=[[],['parkss'],['minji','eunsu'],['eunsu','leo','minji'],['kangwoo','jaeyi','parkss']];
for(const [id,plan]of Object.entries(routes))test(id+' preserves real roles, all outcomes, eligible choice gates and unpaid/paid reload',()=>{
 for(const party of rosters){
  const h=fixture(id,false,party),ent=h.json('entryTurns');if(plan.entry)assert.deepEqual(roles(ent),role(plan.entry,party));
  const before=state(h);h.run('G.save();G.load()');assert.deepEqual(h.json('S.pendingPresentation.reading.view.turns'),ent);assert.equal(state(h),before);
  for(const [i,c]of base[id].choices.entries())for(let j=0;j<c.out.length;j++){
   const f=fixture(id,false,party),old=fixture(id,true,party);const req=`G.reqOk(G.choiceReq(e.choices[${i}])).ok&&G.reqVisible(G.choiceReq(e.choices[${i}]))`;
   assert.equal(f.run(req),old.run(req),id+' choice gate '+i);if(!f.run(req))continue;
   if(plan.entry)f.run("e.turnSpeakers=['passer_man'];");
   f.run(`globalThis.pickOld=G.pickOutcome;G.pickOutcome=(e,c)=>c.out[${j}];globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);G.pickOutcome=pickOld;`);assert(f.run('r.ok&&r.applied'));
   const turns=reader(f,i),want=plan[`${i}.${j}`];const frozen=legacy.find(s=>s.id===id&&s.i===i&&s.j===j);
   assert.deepEqual(roles(turns),want?role(want,party):roles(frozen.turns),id+':'+i+'.'+j+':'+party);
   assert(plain(turns).every(t=>t.name!=='???'&&!t.speakerUncertain));
   const paid=state(f);f.run(`G.capturePresentationView({eventId:e.id,phase:'outcome',turns,knownSpeaker,index:1});G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);`);
   assert.equal(f.run('r.applied'),false);assert.deepEqual(plain(reader(f,i)),plain(turns));assert.equal(state(f),paid);
  }
 }
});
for(const textOnly of [false,true])test('all old paid results preserve '+(textOnly?'text-only':'reader')+' output and never repay',()=>{
 for(const s of legacy){const save=JSON.parse(fs.readFileSync(path.join(dir,s.file),'utf8'));if(textOnly){save.pendingPresentation.reading=null;save.pendingPresentation.view=null;save.pendingPresentation.authoredView=null;}
  const outputs=[];for(const frozen of [true,false]){const h=setup(frozen);assert(h.run('G.load('+JSON.stringify(JSON.stringify(save))+')'));const before=state(h);
   h.run(`globalThis.e=G.presentationEvent('${s.id}');globalThis.knownSpeaker=${textOnly?'false':'!!S.pendingPresentation.reading.view.knownSpeaker'};globalThis.r=G.resolvePresentedChoice(e,e.choices[${s.i}]);`);
   assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),save.pendingPresentation.text);assert.equal(state(h),before);outputs.push(plain(reader(h,s.i)));}
  assert.deepEqual(outputs[1],outputs[0],s.file);
 }
});
test('bell family encounter takes the same 20 minutes and gives the same note without certifying future days',()=>{
 for(const min of [600,1200]){const h=fixture('ev_temple_bell',false,['parkss']);h.run(`S.min=${min};G.pickOutcome=(e,c)=>c.out[1];globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);`);
  assert(h.run('r.ok&&r.applied'));assert.equal(h.run('S.min'),min+20);assert.equal(h.run('r.out.text'),copies[0].new);assert.deepEqual(plain(h.json('r.out.fx')),base.ev_temple_bell.choices[0].out[1].fx);
  const turns=reader(h,0);assert.equal(turns.find(t=>t.kind==='dialogue').name,'생존자 가족');assert.doesNotMatch(h.run('r.out.text'),/며칠 뒤/);assert.match(h.run('r.out.text'),/절에서 내려오는 길에/);
 }
});
test('newsstand authored turns preserve every word and keep quoted labels inside narration',()=>{
 const norm=s=>s.replace(/[\s"“”]/g,'');for(const i of [0,1]){const h=fixture('ev_newsstand',false,['minji','parkss']);h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);`);const turns=reader(h,i);
  assert.equal(norm(turns.map(t=>t.text).join(' ')),norm(base.ev_newsstand.choices[i].out[0].text));
  const label=i===0?'재편성':'더 안전한 내일';assert(turns.some(t=>t.kind==='narration'&&t.text.includes('"'+label+'"')));assert(!turns.some(t=>t.kind==='dialogue'&&t.text===label));
 }
});
test('all 24 event definitions retain exact mechanics, gates, notes and prose except approved bell phrase',()=>{
 const h=setup(),clean=x=>JSON.parse(JSON.stringify(x,(k,v)=>['turnSpeakers','turns'].includes(k)?undefined:v));for(const [id,old]of Object.entries(base)){
  const now=h.json(`JSON.parse(JSON.stringify(G.presentationEvent('${id}'),(k,v)=>typeof v==='function'?v.toString():v))`);
  if(id==='ev_near_seoul_sign'){assert.equal(now.maxRemain,9);delete now.maxRemain;}
  for(const d of copies.filter(d=>d.id===id)){let o=now;for(const k of d.path.slice(0,-1))o=o[k];assert.equal(o[d.path.at(-1)],d.new);o[d.path.at(-1)]=d.old;}assert.deepEqual(clean(now),clean(old),id);
 }
});
test('Seoul current companions do not certify an earlier departure, with unchanged or reduced prior roster',()=>{
 for(const [earlier,current]of [[['minji'],['minji']],[['minji','leo'],['minji']],[['eunsu','minji','leo'],['eunsu','leo']]]){
  // Synthetic historical roster boundary, not a fabricated public dismissal action.
  const h=fixture('ev_near_seoul_sign',false,earlier);h.run(`S.party=${JSON.stringify(current)};G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);`);
  assert(h.run('r.ok&&r.applied'));const text=h.run('r.out.text');assert.equal(text,copies.find(d=>d.id==='ev_near_seoul_sign').new);assert.doesNotMatch(text,/손이 몇 개 빠졌|출발 때 있던 손/);assert.match(text,/길에서 만난 손들이 내 손 위로 포개졌다/);
  assert.deepEqual(plain(h.json('r.out.fx')),base.ev_near_seoul_sign.choices[0].out[0].fx);const turns=reader(h,0),paid=state(h);h.run('G.capturePresentationView({eventId:e.id,phase:"outcome",turns,knownSpeaker,index:1});G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);');assert.equal(h.run('r.applied'),false);assert.deepEqual(plain(reader(h,0)),plain(turns));assert.equal(state(h),paid);
 }
});
