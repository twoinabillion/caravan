'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const H=require('./fixtures/qa-cycle103-eunsu-join/setup.cjs');
const fixture=name=>JSON.parse(fs.readFileSync(__dirname+'/fixtures/continuous-repair01/'+name+'.json'));
function fresh(id,min=1012.3){const h=H.setup();h.run(`S.pendingPresentation=null;S.at='daegu';S.driving=null;S.day=5;S.min=${min};globalThis.e=event(${JSON.stringify(id)});G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);`);return h;}
test('afterword entry and newly paid optional result consistently depict next-day dawn',()=>{
 const h=fresh('seoul_afterword_choice');assert.equal(h.run('S.pendingPresentation.narrativeRevision'),'story-rhythm-v1');
 assert.match(h.run('prose(e.text)'),/다음 날 새벽/);assert(h.json('entry').every(t=>t.timeKind==='epilogue'&&t.timeLabel.includes('새벽')));
 const before=h.run('S.day*1440+S.min'),r=H.pay(h,1);assert(r.applied);assert.equal(h.run('S.day*1440+S.min'),before);
 for(const [i,t] of r.turns.entries()){
  assert.equal(t.timeKind,'epilogue');assert.match(t.timeLabel,/후일담/);
  const marker=h.json(`qaMarker({phase:'outcome',turns},${i},'지금 · 서울 · 11:44')`);
  assert.equal(marker.kind,'epilogue');assert.doesNotMatch(marker.text,/지금|11:44/);
 }
 const receipt=h.json('S.pendingPresentation');h.run('G.save();G.load()');assert.deepEqual(h.json('S.pendingPresentation'),receipt);
 assert.equal(H.pay(h,1).applied,false);assert.equal(h.run('G.queuePresentation()'),'seoul_uplink_reveal');
});
test('queued afterword transition starts the new dawn edition before evaluating entry text',()=>{
 const h=H.setup();h.run("S.pendingPresentation={version:1,eventId:'seoul_afterword_choice',phase:'transition'};globalThis.e=event('seoul_afterword_choice');G.beginPresentation(e)");
 assert.equal(h.run('S.pendingPresentation.narrativeRevision'),'story-rhythm-v1');assert.match(h.run('S.pendingPresentation.text'),/다음 날 새벽/);
});
for(const mode of ['reader','text-only'])test(`previous timing edition afterword ${mode} keeps dawn without adopting the new family callback`,()=>{
 const h=fresh('seoul_afterword_choice');
 // Model an entry from the timing edition, before the later family update.
 h.run("S.pendingPresentation.narrativeRevision='afterword-timing-v2';S.pendingPresentation.text=prose(e.text);entry=qaEntry(e);info=qaInfo(e,'event',[],entry);S.flags.intro_family_helped=true;S.flags.doyun_family_status_known=true");
 if(mode==='reader')h.run("G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:1})");
 h.run('G.save();G.load()');const receipt=h.json('S.pendingPresentation'),state=H.state(h);
 h.run('G.beginPresentation(e);entry=qaEntry(e);info=qaInfo(e,\'event\',[],entry)');
 assert.equal(h.run('S.pendingPresentation.narrativeRevision'),'afterword-timing-v2');
 assert.match(h.run('prose(e.text)'),/다음 날 새벽/);assert(h.json('entry').every(t=>t.timeLabel==='후일담 · 다음 날 새벽, 남산'));
 assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.deepEqual(H.state(h),state);
 const r=H.pay(h,0);assert(r.applied);
 assert.equal(r.turns.find(t=>t.kind==='radio'&&t.who==='passer_woman').name,'하진 · 부산 부두');
 const paid=h.json('S.pendingPresentation'),balance=H.state(h);h.run('G.save();G.load()');
 assert.equal(H.pay(h,0).applied,false);assert.deepEqual(h.json('S.pendingPresentation'),paid);assert.deepEqual(H.state(h),balance);
});
for(const phase of ['entry','paid'])for(const mode of ['reader','text-only'])test(`natural v1 afterword ${phase}/${mode} retains old receipt and words`,()=>{
 const s=fixture(`afterword-${phase}-v1`),h=H.setup();
 if(mode==='text-only'){delete s.pendingPresentation.reading;delete s.pendingPresentation.view;delete s.pendingPresentation.authoredView;}
 assert(h.run(`G.load(${JSON.stringify(JSON.stringify(s))})`));
 const receipt=h.json('S.pendingPresentation'),state=H.state(h);h.run("globalThis.e=event('seoul_afterword_choice');globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");
 if(phase==='entry'){assert.match(h.run('prose(e.text)'),/아침빛/);assert(h.json('entry').every(t=>t.timeLabel==='후일담 · 다음 날 아침'));}
 else{const r=H.pay(h,1,0,false);assert.equal(r.applied,false);assert.equal(r.text,s.pendingPresentation.text);assert(r.turns.every(t=>!t.timeKind));assert.deepEqual(H.state(h),state);}
 assert.deepEqual(h.json('S.pendingPresentation'),receipt);
});
for(const min of [329.9,330,1012.3,1169.9,1170])for(const id of ['cell_dome_meet','npc_taeho_2'])test(`${id} new clocked ${min} uses matching HD dome`,()=>{
 const h=fresh(id,min),key=min<330||min>=1170?'event-daegu-dome-night-v2':'event-daegu-dome-day-v1';
 assert.equal(h.run('S.pendingPresentation.sceneRevision'),'dome-light-v2');assert.deepEqual(h.json('info.sceneKeys'),[key]);assert.deepEqual(h.json('info.sceneTime'),{day:5,min});
 const r=H.pay(h,0);assert(r.applied);assert(r.info.sceneKeys.every(k=>k===key));
 const receipt=h.json('S.pendingPresentation'),state=H.state(h);h.run('G.save();G.load()');assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.equal(H.pay(h,0).applied,false);assert.deepEqual(H.state(h),state);
});
for(const phase of ['entry','paid'])for(const mode of ['reader','text-only'])test(`natural unmarked dome ${phase}/${mode} keeps historical keys`,()=>{
 const s=fixture(`dome-${phase}-unmarked`),h=H.setup();if(mode==='text-only'){delete s.pendingPresentation.reading;delete s.pendingPresentation.view;delete s.pendingPresentation.authoredView;}
 assert(h.run(`G.load(${JSON.stringify(JSON.stringify(s))})`));const receipt=h.json('S.pendingPresentation'),state=H.state(h);
 h.run("globalThis.e=event('cell_dome_meet'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");
 const r=phase==='paid'?H.pay(h,0,0,false):{info:h.json('info')};assert.deepEqual(r.info.sceneKeys,['daegu-dome']);if(phase==='paid')assert.equal(r.applied,false);
 assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.deepEqual(H.state(h),state);
});
for(const nid of ['taeho','sera','mansu'])test(`ephemeral ${nid} small-talk uses current dome light without a receipt or effects`,()=>{
 const h=H.setup();h.run("S.pendingPresentation=null;S.at='daegu';S.day=5;S.min=1012.3;S.driving=null;");const state=H.state(h);
 for(const [min,key] of [[1012.3,'event-daegu-dome-day-v1'],[1170,'event-daegu-dome-night-v2']]){
  h.run(`S.min=${min};globalThis.local={id:'local_chat_${nid}',type:'대화',localConversation:true,locEvent:'daegu'};globalThis.info=qaInfo(local,'event',[],[{kind:'dialogue',who:'${nid}',text:'소문'}]);`);
  assert.deepEqual(h.json('info.sceneKeys'),[key]);assert.deepEqual(h.json('info.sceneTime'),{day:5,min});assert.equal(h.run('S.pendingPresentation'),null);
 }
 h.run('S.min=1012.3');assert.deepEqual(H.state(h),state);
 for(const origin of ['memory','video']){h.run(`local.storyOrigin={kind:'${origin}'};info=qaInfo(local,'event',[],[{kind:'narration',text:'그날'}])`);assert.deepEqual(h.json('info.sceneKeys'),['daegu-dome']);assert.equal(h.run('info.sceneTime'),undefined);}
 h.run("delete local.storyOrigin;info=qaInfo(local,'event',[],[{kind:'narration',text:'그날',timeKind:'epilogue'}])");assert.deepEqual(h.json('info.sceneKeys'),['daegu-dome']);assert.equal(h.run('info.sceneTime'),undefined);
 h.run("delete local.localConversation;info=qaInfo(local,'event',[],[])");assert.deepEqual(h.json('info.sceneKeys'),['daegu-dome']);assert.equal(h.run('info.sceneTime'),undefined);
});
for(const min of [600,1200])for(const paid of [false,true])test(`old clocked taeho ${min}/${paid?'paid':'entry'} stays on its unversioned selector`,()=>{
 const h=fresh('npc_taeho_2',min);h.run('delete S.pendingPresentation.sceneRevision');
 const key=min<1170?'event-daegu-dome-day-v1':'daegu-dome';
 h.run("entry=qaEntry(e);info=qaInfo(e,'event',[],entry)");assert.deepEqual(h.json('info.sceneKeys'),[key]);
 // Construct the prior paid owner with its prior selector. Paying an old
 // unanswered entry today intentionally creates a new, current result receipt.
 if(paid){h.run('globalThis.newVariant=D.eventSceneTimeVariants.npc_taeho_2;D.eventSceneTimeVariants.npc_taeho_2=newVariant.legacy');H.pay(h,0);h.run('D.eventSceneTimeVariants.npc_taeho_2=newVariant;delete S.pendingPresentation.view;delete S.pendingPresentation.reading;delete S.pendingPresentation.authoredView');}
 const receipt=h.json('S.pendingPresentation'),state=H.state(h);
 if(paid)assert.deepEqual(H.pay(h,0,0,false).info.sceneKeys,[key]);
 else h.run("entry=qaEntry(e);info=qaInfo(e,'event',[],entry)");
 assert.deepEqual(h.json('info.sceneKeys'),[key]);assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.deepEqual(H.state(h),state);
});
test('ephemeral local dialogue never stamps an invalid live clock',()=>{
 const h=H.setup();h.run("S.pendingPresentation=null;S.at='daegu';S.driving=null;globalThis.local={id:'local_chat_taeho',type:'대화',localConversation:true,locEvent:'daegu'};");
 for(const [day,min] of [[0,600],[5,-1],[5,1440],[5,NaN]]){
  h.run(`S.day=${day};S.min=${String(min)};globalThis.info=qaInfo(local,'event',[],[])`);
  assert.deepEqual(h.json('info.sceneKeys'),['daegu-dome']);assert.equal(h.run('info.sceneTime'),undefined);assert.equal(h.run('S.pendingPresentation'),null);
 }
});
