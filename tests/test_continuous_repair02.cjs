'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const H=require('./fixtures/qa-cycle103-eunsu-join/setup.cjs');
const fixture=name=>JSON.parse(fs.readFileSync(__dirname+'/fixtures/continuous-repair02/'+name+'.json'));
function fresh(mother=true){const h=H.setup();h.run(`S.pendingPresentation=null;S.at='seoul';S.driving=null;S.flags.mother_broadcast_ready=${mother};S.flags.core_transfer=true;S.flags.seoul_core_reached=true;globalThis.e=event('seoul_afterword_choice');G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})`);return h;}
test('new main return switches from Namsan to mother interior exactly at the authored arrival',()=>{
 const h=fresh();assert.equal(h.run('S.pendingPresentation.sceneRevision'),'afterword-return-v3');assert.deepEqual(h.json('info.sceneKeys'),['seoul-home-dawn-v2']);
 const r=H.pay(h,0);assert(r.applied);assert.deepEqual(r.info.sceneKeys,['seoul-home-dawn-v2','parents-mother-return-interior-v1']);
 const at=r.turns.findIndex(t=>t.scene==='parents-mother-return-interior-v1');assert(at>0);assert.match(r.turns[at].text,/수원 외곽 중계소/);
 for(let i=0;i<r.turns.length;i++)assert.equal(h.run(`qaCut({eventId:e.id,phase:'outcome',turns,sceneKeys:info.sceneKeys},${i})`),i<at?'seoul-home-dawn-v2':'parents-mother-return-interior-v1');
 assert(r.turns.every(t=>t.timeKind==='epilogue'));assert.deepEqual(h.json('S.pendingPresentation.reading.history.sceneKeys'),['seoul-home-dawn-v2']);
 const receipt=h.json('S.pendingPresentation'),state=H.state(h);h.run('G.save();G.load()');assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.equal(H.pay(h,0).applied,false);assert.deepEqual(H.state(h),state);
});
for(const mother of [false,true])for(const optional of [false,true])test(`only actual authored return markers enter new candidates mother=${mother} optional=${optional}`,()=>{
 const h=fresh(mother),r=H.pay(h,optional?1:0);assert.deepEqual(r.info.sceneKeys,mother&&!optional?['seoul-home-dawn-v2','parents-mother-return-interior-v1']:['seoul-home-dawn-v2']);
 if(!mother||optional)assert(!r.turns.some(t=>t.scene==='parents-mother-return-interior-v1'));
 assert.equal(h.run('S.flags.afterword_requested===true'),optional);assert.equal(h.run('S.flags.story_done===true'),!optional);
});
for(const mode of ['reader','view-only','text-only'])test(`natural v2 paid main ${mode} keeps its historical picture, words, record and payment`,()=>{
 const s=fixture('main-paid-v2');if(mode==='view-only'){s.pendingPresentation.view=s.pendingPresentation.reading.view;delete s.pendingPresentation.reading;}if(mode==='text-only'){delete s.pendingPresentation.reading;delete s.pendingPresentation.view;delete s.pendingPresentation.authoredView;}
 const h=H.setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(s))})`));const receipt=h.json('S.pendingPresentation'),state=H.state(h);
 h.run("globalThis.e=event('seoul_afterword_choice'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");const r=H.pay(h,0,0,false);
 assert.equal(r.applied,false);assert.equal(r.text,s.pendingPresentation.text);assert.deepEqual(r.info.sceneKeys,['seoul-home-dawn-v2']);assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.deepEqual(H.state(h),state);
});
test('natural unpaid v2 entry keeps its reader but a new payment gains the corrected return cut',()=>{
 const s=fixture('main-entry-v2'),h=H.setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(s))})`));const reading=h.json('S.pendingPresentation.reading');
 h.run("globalThis.e=event('seoul_afterword_choice'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);
 const r=H.pay(h,0);assert(r.applied);assert.equal(h.run('S.pendingPresentation.sceneRevision'),'afterword-return-v3');assert.deepEqual(r.info.sceneKeys,['seoul-home-dawn-v2','parents-mother-return-interior-v1']);
});
test('new return rendered without a prior entry still uses the canonical return interior',()=>{
 const h=fresh();h.run('S.pendingPresentation=null');const r=H.pay(h,0);assert(r.applied);assert(r.turns.some(t=>t.scene==='parents-mother-return-interior-v1'));assert(!r.turns.some(t=>t.scene==='parents-mother-reunion-v1'));
});
const particles={minji:'민지와',parkss:'박 선생과',leo:'레오와',jaeyi:'재이와',eunsu:'은수와',kangwoo:'강우와'};
for(const [cid,name] of Object.entries(particles))test(`future finale recall uses the correct companion particle for ${cid}`,()=>{
 const h=H.setup();h.run(`S.campMemories={[${JSON.stringify(cid)}]:{choiceId:D.campConversations[${JSON.stringify(cid)}].choices[0].id}};S.party=[${JSON.stringify(cid)}];S.comps[${JSON.stringify(cid)}].approach=Object.keys(D.recruitQuests[${JSON.stringify(cid)}].approaches)[0];`);
 const text=h.run('D.finaleJourneyRecall(S)');assert(text.includes(name+' 나눈 밤'));assert(text.includes(name+' 처음 손을 맞췄던'));
});
for(const mode of ['reader','view-only','text-only'])test(`natural paid Parkss night ${mode} never rewrites old prose or re-calls the source`,()=>{
 const s=fixture('night-paid-parkss');if(mode==='view-only'){s.pendingPresentation.view=s.pendingPresentation.reading.view;delete s.pendingPresentation.reading;}if(mode==='text-only'){delete s.pendingPresentation.reading;delete s.pendingPresentation.view;delete s.pendingPresentation.authoredView;}
 const h=H.setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(s))})`));const state=H.state(h),receipt=h.json('S.pendingPresentation');
 h.run("globalThis.e=event('seoul_night'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry);globalThis.calls=0;const paidOut=e.choices[S.pendingPresentation.choiceIndex].out[S.pendingPresentation.outcomeIndex];paidOut.text=paidOut.turns=paidOut.readingRecord=()=>{calls++;throw Error('paid source must remain frozen')};");
 const r=H.pay(h,s.pendingPresentation.choiceIndex,0,false);assert.equal(r.applied,false);assert.equal(h.run('calls'),0);assert.equal(r.text,s.pendingPresentation.text);assert.match(r.text,/박 선생와 나눈 밤/);assert.match(r.text,/박 선생와 처음 손을 맞췄던/);assert.deepEqual(H.state(h),state);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
});
