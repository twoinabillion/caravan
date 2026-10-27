'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle18/systems/repair');
const base=path.resolve(dir,'../..'),{setup}=require(dir+'/setup.cjs');
const legacy=require(dir+'/legacy-manifest.json');
const resources=h=>h.json('({day:S.day,min:S.min,food:S.food,water:S.water,fuel:S.fuel,scrap:S.scrap,items:S.items,van:S.van,fatigue:S.fatigue,flags:S.flags,comps:S.comps,npcs:S.npcs,quest:S.quest})');
function letter(h,name){h.run(`D.npcs.noah.name=${JSON.stringify(name)};S.at='miryang';S.day=4;S.min=390;G.acceptQuest({kind:'letter',from:'miryang',to:'daejeon',npc:'noah',due:6,reward:6});S.at='daejeon';G.save();G.load();`);}
for(const [name,want] of [['노아','노아가'],['김정훈','김정훈이'],['Leo','Leo가']])test(`letter completion uses the existing name-particle policy for ${name}, pays once, and survives reload`,()=>{
  const h=setup(),old=setup(true);letter(h,name);letter(old,name);
  const before=resources(h);assert.equal(h.run('G.checkQuest()'),true);assert.equal(old.run('G.checkQuest()'),true);
  assert.equal(h.run("S.notes.findLast(n=>n.title.startsWith('편지 완료:')).body"),`${want} 편지를 두 번 읽었다. 답장은 없었다. 눈가가 대신 답했다. 사례 고철 10.`);
  assert.deepEqual(resources(h),resources(old));assert.equal(h.run('S.scrap')-before.scrap,10);
  assert.equal(h.run('S.npcs.noah.att')-before.npcs.noah.att,18);assert.equal(h.run('S.npcs.noah.met'),true);
  assert.equal(h.run('S.day'),before.day);assert.equal(h.run('S.min'),before.min);
  const paid=resources(h),notes=h.json('S.notes'),completed=h.json('S.questLedger.completed');
  assert.equal(h.run('G.checkQuest()'),false);assert.equal(h.run('G.load()'),true);
  assert.equal(h.run('G.checkQuest()'),false);assert.deepEqual(resources(h),paid);assert.deepEqual(h.json('S.notes'),notes);assert.deepEqual(h.json('S.questLedger.completed'),completed);
});
test('the actual frozen18 delivered letter retains its old text and award on load and repeated handoff',()=>{
  const h=setup(),raw=fs.readFileSync(base+'/survival/attempt01/entry-331-exp_glasshouse-export.json','utf8');
  const old=JSON.parse(raw).notes.find(n=>n.body.includes('노아이(가) 편지를 두 번 읽었다'));
  assert(old);assert.equal(h.run(`G.load(${JSON.stringify(raw)})`),true);
  const before=resources(h);assert.deepEqual(h.json(`S.notes.find(n=>n.id===${JSON.stringify(old.id)})`),old);
  h.run('G.save();G.load()');assert.equal(h.run('G.checkQuest()'),false);assert.deepEqual(resources(h),before);
  assert.deepEqual(h.json(`S.notes.find(n=>n.id===${JSON.stringify(old.id)})`),old);
});
test('ready companion guidance requires stopping only while actually travelling, for all six companions',()=>{
  const h=setup();h.run("S.recruitQ=null;S.used=[];S.party=Object.keys(D.comps);S.party.forEach(id=>Object.assign(S.comps[id],{lvl:0,pending:0,bond:100}));G.ensureQuestLedger();");
  for(const driving of [null,{from:'busan',to:'miryang',km:1}]){
    h.run(`S.driving=${JSON.stringify(driving)}`);const before=h.run('JSON.stringify(S)');
    const rows=h.json('G.companionQuestEntries()');assert.equal(rows.length,6);
    for(const row of rows)assert.equal(row.next,`${driving?'정차한 뒤 ':''}${row.title}에게 말을 걸어 다음 이야기를 듣는다.`);
    assert.equal(h.run('JSON.stringify(S)'),before);
  }
});
test('recruitment, perk selection, bond work and completed stories retain their existing next actions',()=>{
  for(const mode of ['recruit','perk','bond','complete']){
    const current=setup(),old=setup(true);
    for(const h of [current,old]){
      h.run("S.at='miryang';S.party=['minji'];S.recruitQ=null;S.used=[];Object.assign(S.comps.minji,{lvl:0,pending:0,bond:0});");
      if(mode==='recruit')h.run("S.party=[];S.recruitQ={id:'minji',target:'miryang',stage:'task'}");
      if(mode==='perk')h.run('S.comps.minji.pending=1');
      if(mode==='complete')h.run("S.comps.minji.lvl=3;S.used=D.events.filter(e=>e.once&&e.needsComp==='minji').map(e=>e.id)");
    }
    assert.deepEqual(current.json('G.companionQuestEntries()'),old.json('G.companionQuestEntries()'),mode);
  }
});
for(const f of legacy){
  test(`${f.id} normal unpaid entry creates a current stopped guide with unchanged effects and a stable paid reload`,()=>{
    const h=setup(),old=setup(true),raw=fs.readFileSync(base+'/'+f.source,'utf8');
    for(const env of [h,old]){assert.equal(env.run(`G.load(${JSON.stringify(raw)})`),true);assert.equal(env.run('S.driving'),null);env.run(`globalThis.e=event('${f.id}');globalThis.c=e.choices[0];globalThis.r=G.resolvePresentedChoice(e,c)`);assert.equal(env.run('r.ok&&r.applied'),true);}
    const updates=h.json('S.pendingPresentation.reading.updates').filter(r=>/에게 말을 걸어/.test(r.next));
    assert(updates.length>0);for(const row of updates)assert.doesNotMatch(row.next,/정차한 뒤/);
    assert.deepEqual(resources(h),resources(old));assert.equal(h.run('r.out.text'),old.run('r.out.text'));assert.deepEqual(h.json('r.chips'),old.json('r.chips'));
    const paid=resources(h),reading=h.json('S.pendingPresentation.reading');assert.equal(h.run('G.load()'),true);
    assert.equal(h.run('G.resolvePresentedChoice(e,c).applied'),false);assert.deepEqual(resources(h),paid);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);
  });
  test(`${f.id} frozen18 paid guide, reader view and text-only legacy variants remain historical without repayment`,()=>{
    for(const textOnly of [false,true]){
      const h=setup(),s=JSON.parse(fs.readFileSync(dir+'/'+f.file));
      if(textOnly){delete s.pendingPresentation.view;delete s.pendingPresentation.reading.view;}
      assert.equal(h.run(`G.load(${JSON.stringify(JSON.stringify(s))})`),true);
      const before=resources(h),reading=h.json('S.pendingPresentation.reading');
      assert(reading.updates.some(row=>/정차한 뒤 .*에게 말을 걸어/.test(row.next)));
      h.run(`globalThis.e=event('${f.id}');globalThis.c=e.choices[0];globalThis.r=G.resolvePresentedChoice(e,c);globalThis.restored={eventId:e.id,phase:'outcome',turns:[{kind:'narration',text:'new'}]};G.restorePresentationView(restored);`);
      assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),f.text);assert.deepEqual(h.json('r.chips'),f.chips);
      assert.deepEqual(h.json('restored.questUpdates'),reading.updates);if(!textOnly)assert.deepEqual(h.json('restored.turns'),reading.view.turns);
      h.run('G.save();G.load()');assert.deepEqual(resources(h),before);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);
    }
  });
}
