'use strict';process.env.QA_TIME_PRODUCTION='1';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {setup,pay,state}=require('./fixtures/qa-cycle26-37-support/cycle31/story/time-scene/setup.cjs');
const dir=path.join(__dirname,'fixtures/qa-cycle91-jaeyi-address');
const baseline=require('./fixtures/qa-cycle91-jaeyi-address/baseline.json'),provenance=require('./fixtures/qa-cycle91-jaeyi-address/provenance.json');
const id='talk_jy_08',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function load(file='natural-entry.json',mode='reader'){
 const saved=JSON.parse(fs.readFileSync(dir+'/'+file));
 if(mode==='view-only'){saved.pendingPresentation.view=saved.pendingPresentation.reading.view;delete saved.pendingPresentation.reading;}
 if(mode==='text-only'){delete saved.pendingPresentation.reading;delete saved.pendingPresentation.view;delete saved.pendingPresentation.authoredView;}
 const h=setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));
 h.run(`globalThis.e=event('${id}'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)`);return h;
}
const mechanical=h=>({...state(h),...h.json('({known:S.known,used:S.used,knowledge:S.knowledge})')});
function present(h,eventId=id){
 h.run(`G.queuePresentation(null);globalThis.e=event('${eventId}');G.openEvent(e);G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);`);
 const before=h.json('({entry,info})');h.run('G.save()');assert(h.run('G.load()'));
 h.run("globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");assert.deepEqual(h.json('({entry,info})'),before);
 h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0});G.save()");const receipt=h.json('S.pendingPresentation');assert(h.run('G.load()'));assert.deepEqual(h.json('S.pendingPresentation'),receipt);
 return before;
}
function controlled({bond=12,lvl=2,pending=0,known=false}={}){
 const h=load();h.run(`S.pendingPresentation=null;S.party=['jaeyi'];S.used=[];S.notes=[];S.known=S.known.filter(k=>k!=='jaeyi_cache');S.comps.jaeyi={mood:60,bond:${bond},lvl:${lvl},pending:${pending},perks:${JSON.stringify(lvl===1?['jy_magpie']:['jy_magpie','jy_map'])}};delete S.flags.jaeyi_cache_opened;delete S.flags.jy_law;${known?"S.known.push('jaeyi_cache');":''}`);return h;
}
function expectReader(r,kind){
 assert(r.applied);assert.match(r.text,/첫 신발, 그림, 상장/);assert.match(r.text,/아빠는 저를 수집/);
 assert.deepEqual(r.turns.filter(t=>t.kind==='dialogue').map(t=>t.who),['jaeyi','jaeyi','jaeyi']);
 if(kind==='unrevealed')assert.match(r.text,/가게 되면 그때 말할게요/);
 else{assert.doesNotMatch(r.text,/가게 되면 그때 말할게요|좌표가 마음속에서 아직 정리 중/);assert.match(r.text,kind==='opened'?/같이 문을 열었죠/:/김천 인근/);}
}
function frozen(h){const receipt=h.json('S.pendingPresentation'),before=mechanical(h);h.run('G.save()');assert(h.run('G.load()'));assert.deepEqual(h.json('S.pendingPresentation'),receipt);const r=pay(h,0,0,false);assert(!r.applied);assert.equal(r.text,receipt.text);assert.deepEqual(mechanical(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);return r;}
const addressCount=h=>h.run("S.notes.filter(n=>n.title==='재이의 열쇠').length");

test('natural entry and paid blobs are immutable copies with preserved baseline SHA',()=>{
 for(const row of Object.values(provenance.natural))assert.equal(sha(fs.readFileSync(dir+'/'+row.file)),row.sha256);
 assert.equal(sha(fs.readFileSync(dir+'/baseline.json')),provenance.baselineSha256);
 const raw=JSON.parse(fs.readFileSync(dir+'/natural-result.json'));assert.match(raw.pendingPresentation.text,/그때 말할게요/);assert(raw.known.includes('jaeyi_cache'));assert(raw.comps.jaeyi.perks.includes('jy_story'));
});
test('natural unpaid reader survives load; its newly paid outcome agrees with the same-choice map reveal',()=>{
 const h=load();assert.deepEqual(h.json('entry'),baseline.entryTurns);assert.deepEqual(h.json('info'),baseline.entryInfo);
 const before=h.json('S.pendingPresentation');h.run('G.save()');assert(h.run('G.load()'));assert.deepEqual(h.json('S.pendingPresentation'),before);
 const r=pay(h,0);expectReader(r,'known');assert.deepEqual(state(h),baseline.naturalEntryPaid.state);assert.deepEqual(r.chips,baseline.naturalEntryPaid.result.chips);assert.deepEqual(r.info,baseline.naturalEntryPaid.result.info);
 assert.equal(h.run('S.comps.jaeyi.bond'),23);assert.equal(h.run('S.comps.jaeyi.lvl'),3);assert.equal(addressCount(h),1);
 assert.deepEqual(h.json('S.pendingPresentation.reading.history'),before.reading.view);frozen(h);
});
for(const bond of [12,13,14])test(`opened08 supplies stage3 and bond ${bond}+2 reveals the address before the paid reader`,()=>{
 const h=controlled({bond});assert(h.run("G.eventAvailable(event('talk_jy_08'),{typeFilter:'대화'})"));assert.equal(h.run("G.companionStoryStage('jaeyi')"),0);
 present(h);assert.equal(h.run("G.companionStoryStage('jaeyi')"),3);assert(!h.run("S.known.includes('jaeyi_cache')"));
 const before=h.json('[S.day,S.min,S.fuel,S.water,S.food,S.scrap,S.van]');expectReader(pay(h,0),'known');
 assert.equal(h.run('S.comps.jaeyi.bond'),bond+2);assert.equal(h.run('S.comps.jaeyi.lvl'),3);assert(h.run("S.comps.jaeyi.perks.includes('jy_story')"));assert(h.run("S.known.includes('jaeyi_cache')"));assert.equal(addressCount(h),1);assert.deepEqual(h.json('[S.day,S.min,S.fuel,S.water,S.food,S.scrap,S.van]'),before);frozen(h);
});
test('bond11 cannot enter08 through the public eligibility gate',()=>{const h=controlled({bond:11});assert(!h.run("G.eventAvailable(event('talk_jy_08'),{typeFilter:'대화'})"));assert(!h.run("G.eligible('대화').some(e=>e.id==='talk_jy_08')"));});
for(const bond of [12,19])test(`pending second perk keeps address private at ${bond}+2, and later perk choice cannot rewrite the old paid reader`,()=>{
 const h=controlled({bond,lvl:1,pending:2});present(h);expectReader(pay(h,0),'unrevealed');assert.equal(h.run('S.comps.jaeyi.bond'),bond+2);assert.equal(h.run('S.comps.jaeyi.pending'),2);assert(!h.run("S.known.includes('jaeyi_cache')"));assert.equal(addressCount(h),0);
 const receipt=h.json('S.pendingPresentation');h.run("G.choosePerk('jaeyi',0)");assert(h.run("S.known.includes('jaeyi_cache')"));assert(h.run("S.comps.jaeyi.perks.includes('jy_story')"));assert.equal(addressCount(h),1);assert.deepEqual(h.json('S.pendingPresentation'),receipt);const old=frozen(h);assert.match(old.text,/그때 말할게요/);
});
for(const dog of [false,true])test(`actual09 before08 reveals the address once and preserves list dog=${dog}`,()=>{
 const h=controlled();h.run(`S.dog=${dog}`);assert(h.run("G.eventAvailable(event('talk_jy_09'),{typeFilter:'대화'})"));present(h,'talk_jy_09');const list=pay(h,0);assert.equal(h.run('S.comps.jaeyi.bond'),14);assert(h.run("S.known.includes('jaeyi_cache')"));assert.equal(addressCount(h),1);
 assert.match(list.text,/세 번째부터 아홉 번째/);if(dog)assert.match(list.text,/보리 거요/);else assert.doesNotMatch(list.text,/보리 거요/);
 assert(h.run("G.eventAvailable(event('talk_jy_08'),{typeFilter:'대화'})"));present(h);assert.doesNotMatch(h.run('prose(e.text)'),/처음으로/);expectReader(pay(h,0),'known');assert.equal(h.run('S.comps.jaeyi.bond'),16);assert.equal(addressCount(h),1);frozen(h);
});
for(const perk of [false,true])test(`already-known cache with prior signature=${perk} is not narrated as unopened knowledge or completed visit`,()=>{
 const h=controlled({known:true});if(perk)h.run("S.comps.jaeyi.lvl=3;S.comps.jaeyi.perks.push('jy_story')");present(h);assert.doesNotMatch(h.run('prose(e.text)'),/처음으로|같이 열었던/);const r=pay(h,0);expectReader(r,'known');assert.doesNotMatch(r.text,/같이 문을 열었죠/);assert.equal(addressCount(h),0);frozen(h);
});
for(const legacy of [false,true])test(`actual completed warehouse is remembered by08 with ${legacy?'legacy exact note':'explicit completion flag'}`,()=>{
 const h=controlled({known:true});present(h,'loc_jaeyi_cache');const r=pay(h,0);assert(r.applied);assert(h.run('S.flags.jaeyi_cache_opened'));assert.equal(h.run("S.notes.find(n=>n.title==='고물상의 법').body"),'"나눠 써라." 창고는 이제 지나가는 모두의 것이다.');
 if(legacy)h.run('delete S.flags.jaeyi_cache_opened;G.save();G.load()');assert(h.run('D.jaeyiCacheOpened(S)'));
 present(h);assert.match(h.run('prose(e.text)'),/같이 열었던/);const before=h.json('[S.day,S.min,S.fuel,S.water,S.food,S.scrap,S.van,S.items]');expectReader(pay(h,0),'opened');assert.deepEqual(h.json('[S.day,S.min,S.fuel,S.water,S.food,S.scrap,S.van,S.items]'),before);frozen(h);
});
for(const falseProof of ['used','wrong-note','broad-flag'])test(`${falseProof} alone cannot turn warehouse knowledge into a completed visit`,()=>{
 const h=controlled({known:true});if(falseProof==='used')h.run("S.used.push('loc_jaeyi_cache')");if(falseProof==='wrong-note')h.run("S.notes.push({title:'고물상의 법',body:'아직 창고에 가지 않았다.',type:'사건',links:['재이']})");if(falseProof==='broad-flag')h.run('S.flags.jy_law=true');assert(!h.run('D.jaeyiCacheOpened(S)'));present(h);assert.doesNotMatch(h.run('prose(e.text)'),/같이 열었던/);const r=pay(h,0);expectReader(r,'known');assert.doesNotMatch(r.text,/같이 문을 열었죠/);
});
for(const mode of ['reader','view-only','text-only'])test(`natural old paid ${mode} preserves old words, notes and receipt without payment`,()=>{
 const h=load('natural-result.json',mode),old=baseline.oldPaid[mode];assert.deepEqual(state(h),old.state);assert.deepEqual(h.json('S.pendingPresentation'),old.receipt);const before=mechanical(h),r=pay(h,0,0,false);assert.deepEqual(r,old.result);assert(!r.applied);assert.match(r.text,/그때 말할게요/);assert.deepEqual(mechanical(h),before);assert.deepEqual(h.json('S.pendingPresentation'),old.receipt);
 h.run('G.save()');assert(h.run('G.load()'));assert.deepEqual(h.json('S.pendingPresentation'),old.receipt);assert.deepEqual(pay(h,0,0,false),old.result);assert.deepEqual(mechanical(h),before);
 if(mode==='reader'){assert.deepEqual(h.json('S.pendingPresentation.reading.history'),old.receipt.reading.history);assert.equal(h.run('S.pendingPresentation.reading.view.index'),old.receipt.reading.view.index);}if(mode==='text-only')assert(h.run('r.out.frozenTextOnly'));
});
test('08 gameplay eligibility, costs, rewards and speakers remain the previous contract',()=>{
 const h=load(),project=e=>({id:e.id,type:e.type,w:e.w,once:e.once,needsComp:e.needsComp,needBond:e.needBond,choices:e.choices.map(c=>({label:c.label,req:c.req||null,out:c.out.map(o=>({p:o.p,fx:o.fx,turnSpeakers:o.turnSpeakers}))}))});assert.deepEqual(project(h.json('e')),project(baseline.definition));
});
