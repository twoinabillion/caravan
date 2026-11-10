const test=require('node:test'),assert=require('node:assert/strict');
const {setup,pay,state}=require('./fixtures/qa-cycle55-story/setup.cjs');
const cases=[['jaeyi','shelf'],['parkss','record']];
function fresh(cid){
  const h=setup();
  h.run(`S.pendingPresentation=null;S.campConversation=null;S.campMemories={};S.campNight=8;
    S.day=5;S.min=600;S.driving=null;S.party=[${JSON.stringify(cid)}];S.recruitQ=null;
    S.water=20;S.food=20;S.scrap=20;S._campPlan={};G.prepareCamp('talk',${JSON.stringify(cid)});`);
  return h;
}
function view(h){h.run("globalThis.e=G.campConversationEvent(),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");}
const copy=(h,marker)=>{const saved=JSON.parse(h.run('G.exportSave()'));
  if(marker===undefined)delete saved.campConversation.copyRevision;else saved.campConversation.copyRevision=marker;
  const old=setup();assert(old.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));return old;};
for(const [cid,choice] of cases){
  test(`${cid}: new dialogue revision survives reload, only the first result branch changes`,()=>{
    const h=fresh(cid),old=copy(h);view(h);view(old);
    assert.notEqual(h.run(`e.choices.find(c=>c.id==='${choice}').out[0].text`),old.run(`e.choices.find(c=>c.id==='${choice}').out[0].text`));
    assert.equal(h.run('e.text'),old.run('e.text'));
    for(const row of h.json('e.choices')){
      const legacy=old.json(`e.choices.find(c=>c.id===${JSON.stringify(row.id)})`);
      if(row.id===choice)delete row.out[0].text,delete legacy.out[0].text;
      assert.deepEqual(row,legacy,'labels, speakers, costs and other outcomes stay intact');
    }
    const before=h.json('e.choices');assert(h.run(`G.load(${JSON.stringify(h.run('G.exportSave()'))})`));view(h);
    assert.deepEqual(h.json('e.choices'),before);
    for(const target of [h,old])target.run(`S.campConversation.chapter=2;S.campConversation.previousChoiceId='${cid==='parkss'?'share':'space'}';S.campConversation.choiceVisits={${cid==='parkss'?'share':'space'}:1};`);
    view(h);view(old);
    const next=h.run(`e.choices.find(c=>c.id==='${choice}').out[0].text`),legacy=old.run(`e.choices.find(c=>c.id==='${choice}').out[0].text`);
    if(cid==='parkss')assert.equal(next,legacy,'a later entry never borrows the first hand examination request');
    else assert.notEqual(next,legacy,'the shelf subject correction also applies after another choice');
  });
  test(`${cid}: revised and legacy replies cost the same, pay once and retain the saved reader`,()=>{
    const h=fresh(cid),old=copy(h);view(h);view(old);
    const ci=h.run(`e.choices.findIndex(c=>c.id==='${choice}')`);
    const result=pay(h,ci),legacy=pay(old,ci);
    assert(result.applied);assert(legacy.applied);assert.deepEqual(result.chips,legacy.chips);assert.deepEqual(state(h),state(old));
    const frozen=h.json('S.campConversation.reading'),saved=h.run('G.exportSave()'),before=state(h);
    assert(h.run(`G.load(${JSON.stringify(saved)})`));view(h);const replay=pay(h,ci);
    assert.equal(replay.applied,false);assert.equal(replay.text,result.text);assert.deepEqual(replay.turns,result.turns);
    assert.deepEqual(h.json('S.campConversation.reading'),frozen);assert.deepEqual(state(h),before);
  });
  test(`${cid}: old unanswered and unknown revisions retain the original result, including same-night reopen`,()=>{
    const h=fresh(cid),old=copy(h),unknown=copy(h,'unknown-future');view(old);view(unknown);
    const original=old.json('e.choices');assert.deepEqual(unknown.json('e.choices'),original);
    old.run(`G.prepareCamp('talk','${cid}')`);view(old);assert.deepEqual(old.json('e.choices'),original);
    assert.equal(old.run('S.campConversation.copyRevision'),undefined);
  });
  test(`${cid}: historical paid text remains authoritative even with a newer marker and no captured view`,()=>{
    const h=copy(fresh(cid));view(h);const ci=h.run(`e.choices.findIndex(c=>c.id==='${choice}')`),result=pay(h,ci);
    const saved=JSON.parse(h.run('G.exportSave()'));delete saved.campConversation.reading;saved.campConversation.copyRevision='camp-natural-flow-v1';
    assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));view(h);const replay=pay(h,ci);
    assert.equal(replay.applied,false);assert.equal(replay.text,result.text);
  });
}
