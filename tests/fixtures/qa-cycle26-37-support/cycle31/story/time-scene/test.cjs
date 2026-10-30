const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup,open,pay,state,specs}=require('./setup.cjs'),legacy=require('./legacy.json');
const expected=(spec,min)=>min<330||min>=1170?spec.night:spec.day;
const boundary=[0,329,329.9,330,360,1140,1169,1169.9,1170,1439];
for(const spec of specs)test(`${spec.id}: ten boundaries select only the opt-in current scene and preserve the saved entry clock`,()=>{
 for(const min of boundary){const h=open(spec.id,min),keys=h.json('info.sceneKeys');assert.deepEqual(keys,[expected(spec,min)]);assert.deepEqual(h.json('info.sceneTime'),{day:9,min});assert.equal(h.run('G.isNight()'),min<330||min>=1170);assert.match(h.run('qaOrientation(e,info.sceneTime)'),new RegExp(String(Math.floor(min/60)).padStart(2,'0')+':'+String(Math.floor(min%60)).padStart(2,'0')));const original=h.json('S.pendingPresentation.reading');h.run('S.min=700;G.save();G.load();globalThis.restored={eventId:e.id,phase:"event"};G.restorePresentationView(restored)');assert.deepEqual(h.json('restored.sceneKeys'),keys);assert.deepEqual(h.json('restored.sceneTime'),{day:9,min});assert.deepEqual(h.json('S.pendingPresentation.reading'),original);assert.deepEqual(h.json("qaInfo(e,'event',[],entry).sceneKeys"),keys);}
});
for(const row of legacy)test(`${row.id}: every outcome retains mechanics, words/roles and new paid clock, then restores without repayment`,()=>{
 for(const out of row.outcomes){const h=open(row.id,1200),old=open(row.id,1200,true),a=pay(h,out.ci,out.oi),b=pay(old,out.ci,out.oi);assert.equal(a.applied,true);assert.equal(a.text,b.text);assert.deepEqual(a.turns,b.turns);assert.deepEqual(a.chips,b.chips);assert.deepEqual(state(h),state(old));assert.deepEqual(a.info.sceneKeys,[expected(row,h.run('S.min'))]);assert.deepEqual(a.info.sceneTime,{day:h.run('S.day'),min:h.run('S.min')});const paid=state(h),reading=h.json('S.pendingPresentation.reading');h.run('G.load()');const replay=pay(h,out.ci,out.oi);assert.equal(replay.applied,false);assert.deepEqual(replay.info,a.info);assert.deepEqual(state(h),paid);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);}
});
for(const [id,ci,start,end] of [['crisis_drowsy',0,300,420],['settlement_road_echo',0,1150,1185],['settlement_road_echo',1,1160,1175]])test(`${id}.${ci}: real ${end-start} minute effect switches new result while preserving entry history`,()=>{
 const spec=specs.find(s=>s.id===id),h=open(id,start),entryKey=h.run('info.sceneKeys[0]'),r=pay(h,ci);assert.equal(h.run('S.min'),end);assert.equal(entryKey,expected(spec,start));assert.deepEqual(r.info.sceneKeys,[expected(spec,end)]);assert.notEqual(entryKey,r.info.sceneKeys[0]);assert.deepEqual(h.json('S.pendingPresentation.reading.history.sceneKeys'),[entryKey]);assert.deepEqual(h.json('S.pendingPresentation.reading.history.sceneTime'),{day:9,min:start});
});
test('new payment before the first UI capture retains its phase clock on reload',()=>{
 const h=open('crisis_drowsy',300);pay(h,0,0,false);assert.deepEqual(h.json('S.pendingPresentation.sceneTime'),{day:9,min:420});h.run('S.min=1200;G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,c),turns=qaResult(e,c,r.out),resultInfo=qaInfo(e,"outcome",[],turns)');assert.equal(h.run('r.applied'),false);assert.deepEqual(h.json('resultInfo.sceneTime'),{day:9,min:420});assert.deepEqual(h.json('resultInfo.sceneKeys'),['event-crisis-exhaustion']);
});
for(const row of legacy)test(`${row.id}: old unpaid, every old paid and text-only view retain original keys with no guessed clock`,()=>{
 for(const item of [{file:row.entryFile,phase:'event'},...row.outcomes.map(o=>({...o,phase:'outcome'}))])for(const textOnly of [false,true]){
  const raw=JSON.parse(fs.readFileSync(__dirname+'/'+item.file));if(textOnly){delete raw.pendingPresentation.view;delete raw.pendingPresentation.reading;delete raw.pendingPresentation.authoredView;}
  const h=setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(raw))})`));const loaded=h.json('S.pendingPresentation');h.run(`G.save();globalThis.e=event('${row.id}'),turns=${item.phase==='event'?'qaEntry(e)':`qaResult(e,e.choices[${item.ci}],G.resolvePresentedChoice(e,e.choices[${item.ci}]).out)`},info=qaInfo(e,'${item.phase}',[],turns);`);const before=state(h);assert.deepEqual(h.json('info.sceneKeys'),row.keys);assert.equal(h.run('info.sceneTime'),undefined);assert.equal(h.run('qaOrientation(e,info.sceneTime)'),'저장된 장면');assert.deepEqual(state(h),before);if(item.phase==='outcome'){assert.equal(h.run(`G.resolvePresentedChoice(e,e.choices[${item.ci}]).applied`),false);assert.equal(h.run('S.pendingPresentation.text'),raw.pendingPresentation.text);}assert.deepEqual(h.json('S.pendingPresentation'),loaded);
 }
});
test('unregistered events, explicit foreign pictures, memory/epilogue markers and legacy stages stay outside time remapping',()=>{
 const h=open('talk_kw_16',600);h.run('S.pendingPresentation.reading=null');assert.deepEqual(h.json("qaInfo(e,'event',['generic-story'],[]).sceneKeys"),['generic-story']);
 assert.deepEqual(h.json("qaInfo({...e,storyOrigin:{kind:'memory'}},'event',[],[{kind:'narration',text:'옛날',timeKind:'memory'}]).sceneKeys"),['comp-talk-kangwoo-camp-v1']);
 assert.deepEqual(h.json("qaInfo(e,'event',[],[{kind:'narration',text:'다음 날',timeKind:'epilogue',scene:'comp-talk-kangwoo-camp-v1'}]).sceneKeys"),['comp-talk-kangwoo-camp-v1']);
 assert.deepEqual(h.json("qaBaseKeys(event('patrol_walker'))"),['combat-walker-watch-v1']);
 assert.equal(h.run("qaCut({eventId:'meet_hitchhiker',turns:[{},{},{}],sceneKeys:['recruit-leo-daein-market-v2','recruit-leo-meet-action']},2)"),'recruit-leo-meet-action');
 assert.deepEqual(h.json("qaMarker({eventId:'talk_kw_16',turns:[{timeKind:'memory',timeLabel:'내 기억 · 그날'}]},0,'지금 · 10:00')"),{kind:'memory',text:'내 기억 · 그날'});
 assert.deepEqual(h.json("qaMarker({eventId:'talk_kw_16',turns:[{timeKind:'epilogue',timeLabel:'후일담 · 다음 날'}]},0,'지금 · 10:00')"),{kind:'epilogue',text:'후일담 · 다음 날'});
});
test('all eight affected event definitions preserve the original mechanics and prose',()=>{
 const h=setup(),baseline=setup(true);for(const row of legacy)assert.deepEqual(h.json(`JSON.parse(JSON.stringify(event('${row.id}'),(k,v)=>typeof v==='function'?v.toString():v))`),baseline.json(`JSON.parse(JSON.stringify(event('${row.id}'),(k,v)=>typeof v==='function'?v.toString():v))`));
 if(process.env.QA_TIME_VERIFY_ISOLATED_COPY==='1')for(const p of fs.readdirSync(__dirname+'/baseline/src'))if(!['03g-scenes.js','04h-engine-presentation.js','07-ui.js'].includes(p))assert.equal(fs.readFileSync(__dirname+'/source/src/'+p,'utf8'),fs.readFileSync(__dirname+'/baseline/src/'+p,'utf8'),p);
});
test('an old unpaid entry can make a new choice: old history remains untimed while the new paid result gets its own clock',()=>{
 const row=legacy.find(r=>r.id==='crisis_drowsy'),h=setup();assert(h.run(`G.load(${JSON.stringify(fs.readFileSync(__dirname+'/'+row.entryFile,'utf8'))})`));h.run("S.min=300;globalThis.e=event('crisis_drowsy'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");assert.deepEqual(h.json('info.sceneKeys'),row.keys);assert.equal(h.run('info.sceneTime'),undefined);const r=pay(h,0);assert.deepEqual(r.info.sceneTime,{day:9,min:420});assert.deepEqual(r.info.sceneKeys,['event-crisis-exhaustion']);assert.deepEqual(h.json('S.pendingPresentation.reading.history.sceneKeys'),row.keys);assert.equal(h.run('S.pendingPresentation.reading.history.sceneTime'),undefined);
});
test('sceneTime validator rejects malformed clocks and never stamps non-opt-in events or old receipts',()=>{
 const h=setup();for(const bad of [null,{day:0,min:300},{day:1.5,min:300},{day:1,min:-1},{day:1,min:1440},{day:1,min:'300'}])assert.equal(h.run(`G.presentationSceneTime(${JSON.stringify(bad)})`),null);
 assert.deepEqual(h.json('G.presentationSceneTime({day:1,min:329.9})'),{day:1,min:329.9});
 h.run("S.pendingPresentation=null;globalThis.e=event('patrol_walker');G.beginPresentation(e)");assert.equal(h.run('S.pendingPresentation.sceneTime'),undefined);assert.equal(h.run('G.presentationView({turns:[{kind:"narration",text:"old"}],sceneKeys:["combat-walker-watch-v1"]}).sceneTime'),undefined);
});
test('nine actual candidate assets use verified paths and retain pending review status',async()=>{
 const crypto=require('node:crypto'),h=setup(),manifest=require('./art-manifest.json'),approved=require('../../../../qa-cycle43-budget/approved-delivery.json');assert.equal(manifest.length,9);
 for(const row of manifest){assert.equal(h.run(`D.scenes[${JSON.stringify(row.key)}]`),row.target);const meta=h.json(`D.sceneAssetMeta[${JSON.stringify(row.key)}]`);assert.equal(meta.size,row.size);const dim=await require('sharp')((process.env.QA_TIME_PRODUCTION==='1'?require('./setup.cjs').root:__dirname+'/source')+'/'+row.target).metadata();assert.equal(dim.width+'x'+dim.height,row.size);assert.match(meta.status,/pending/);const change=approved.find(x=>x.file===row.target);if(change)assert.equal(change.old.sha256,row.sha256,'preserve reviewed original hash');const expected=process.env.QA_TIME_PRODUCTION==='1'&&change?change.new.sha256:row.sha256;assert.equal(crypto.createHash('sha256').update(fs.readFileSync((process.env.QA_TIME_PRODUCTION==='1'?require('./setup.cjs').root:__dirname+'/source')+'/'+row.target)).digest('hex'),expected);assert(h.run(`D.sceneDescriptions[${JSON.stringify(row.key)}].length>0`));}
});
