'use strict';process.env.QA_TIME_PRODUCTION='1';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {setup,pay,state,root}=require('./fixtures/qa-cycle26-37-support/cycle31/story/time-scene/setup.cjs');
const dir=path.join(__dirname,'fixtures/qa-cycle91-place-recruit-art'),{rows}=require('./fixtures/qa-cycle91-place-recruit-art/baseline.json');
const night=min=>min<330||min>=1170,sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function keys(old,min){return old.map(k=>{
 if(k==='recruit-parkss-task')return night(min)?'recruit-parkss-clinic-table-night-v1':k;
 if(k==='recruit-parkss-task-power'||k==='recruit-parkss-task-power-day-v1')return night(min)?'recruit-parkss-task-power':'recruit-parkss-task-power-day-v1';
 if(['recruit-leo-join','recruit-leo-join-decision'].includes(k))return `recruit-leo-join-waiting-${night(min)?'night':'day'}-v1`;
 if(k==='suwon-fortress')return night(min)?k:'event-suwon-fortress-day-v1';
 return k;
})}
function load(row,file=row.entryFile){const h=setup();assert(h.run(`G.load(${JSON.stringify(fs.readFileSync(path.join(dir,file),'utf8'))})`));h.run(`globalThis.e=event('${row.id}'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)`);return h}
function fresh(row,min){const h=load(row);h.run(`S.pendingPresentation=null;S.day=4;S.min=${min};S.food=60;S.water=60;S.fuel=60;S.scrap=60;S.items['의약품']=2;S.items['부품']=3;S.fatigue=10;G.beginPresentation(e);globalThis.entry=qaEntry(e),info=qaInfo(e,'event',[],entry);G.capturePresentationView({eventId:e.id,phase:'event',turns:entry,...info,index:0})`);return h}
for(const row of rows){
 test(row.id+' preserved fixtures and authored mechanics remain unchanged',()=>{
  assert.equal(sha(fs.readFileSync(path.join(dir,row.entryFile))),row.entrySha);
  const h=fresh(row,600);assert.deepEqual(h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))"),row.definition);
  for(const o of row.outcomes){assert.equal(sha(fs.readFileSync(path.join(dir,o.file))),o.sha256);const h=fresh(row,600),r=pay(h,o.ci);assert(r.applied);assert.equal(r.text,o.result.text);assert.deepEqual(r.turns,o.result.turns);assert.deepEqual(r.chips,o.result.chips);assert.deepEqual(state(h),o.state);}
 });
 for(const min of [329,330,1169,1170])for(const o of row.outcomes)test(`${row.id} ${min} choice${o.ci} entry/result clocks, history and reload`,()=>{
  const h=fresh(row,min);assert.deepEqual(h.json('info.sceneKeys'),keys(row.entryKeys,min));assert.deepEqual(h.json('info.sceneTime||null'),{day:4,min});const entryView=h.json('S.pendingPresentation.reading.view');h.run('G.save();G.load()');assert.deepEqual(h.json('S.pendingPresentation.reading.view'),entryView);
  const r=pay(h,o.ci),clock=h.json('({day:S.day,min:S.min})');assert(r.applied);assert.equal(r.text,o.result.text);assert.deepEqual(r.info.sceneKeys,keys(o.result.info.sceneKeys,clock.min));assert.deepEqual(r.info.sceneTime,clock);assert.deepEqual(h.json('S.pendingPresentation.reading.history'),entryView);
  for(let i=0;i<r.turns.length;i++)assert(r.info.sceneKeys.includes(h.run(`qaCut({eventId:e.id,phase:'outcome',turns,sceneKeys:info.sceneKeys},${i})`)));
  const before=state(h),reading=h.json('S.pendingPresentation.reading');h.run('G.save();G.load()');assert(!pay(h,o.ci).applied);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation.reading'),reading);
 });
 test(row.id+' naturally captured old entry keeps its displayed words and scene keys',()=>{const h=load(row);assert.deepEqual(h.json('entry'),row.entryTurns);assert.deepEqual(h.json('info.sceneKeys'),row.entryKeys);assert.deepEqual(h.json('S.pendingPresentation.reading.view'),row.entryView)});
 for(const o of [...row.outcomes,...(row.naturalPaid?[{...row.naturalPaid,ci:0}]:[])])for(const mode of ['reader','text-only'])test(`${row.id} ${o.file} ${mode} keeps old paid words and receipt`,()=>{
  assert.equal(sha(fs.readFileSync(path.join(dir,o.file))),o.sha256);const saved=JSON.parse(fs.readFileSync(path.join(dir,o.file)));if(mode==='text-only'){delete saved.pendingPresentation.view;delete saved.pendingPresentation.reading;delete saved.pendingPresentation.authoredView;}
  const h=setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));const before=state(h),history=mode==='reader'?h.json('S.pendingPresentation.reading.history'):null;
  h.run(`globalThis.e=event('${row.id}'),r=G.resolvePresentedChoice(e,e.choices[${o.ci}]),turns=qaResult(e,e.choices[${o.ci}],r.out),info=qaInfo(e,'outcome',[r.out.scenes,r.out.scene,e.choices[${o.ci}].scenes,e.choices[${o.ci}].scene,D.eventChoiceScenes?.[e.id]?.[${o.ci}]],turns)`);
  assert(h.run('r.ok&&!r.applied'));assert.equal(h.run('r.out.text'),o.result.text);assert.deepEqual(state(h),before);
  if(mode==='reader'){assert.deepEqual(h.json('info.sceneKeys'),o.result.info.sceneKeys);assert.deepEqual(h.json('S.pendingPresentation.reading.history'),history);assert.deepEqual(h.json('r.out.turns'),o.result.turns)}
  else assert(h.run('r.out.frozenTextOnly')); // Deleted frame metadata cannot prove an absent exact historical picture.
 });
}
const park=rows.find(r=>r.id==='rq_parkss_task');
for(const [start,ci,expectedDay,expectedMin]of [[1035,0,4,1215],[1300,1,5,70],[240,0,4,420]])test(`clinic treatment clock boundary ${start}/${ci}`,()=>{const h=fresh(park,start),entry=h.json('info.sceneKeys'),r=pay(h,ci);assert.equal(h.run('S.day'),expectedDay);assert.equal(h.run('S.min'),expectedMin);assert.deepEqual(r.info.sceneKeys,keys(['recruit-parkss-task'],expectedMin));assert.deepEqual(h.json('S.pendingPresentation.reading.history.sceneKeys'),entry)});
for(const min of [600,1200])test('pair conversation retains other locations fallback '+min,()=>{const row=rows.find(r=>r.id==='pair_leo_es_2'),h=fresh(row,min);h.run("S.at='jeonju';S.pendingPresentation=null;G.beginPresentation(e);entry=qaEntry(e);info=qaInfo(e,'event',[],entry)");const old=h.json('qaBaseKeys(e)');assert.deepEqual(h.json('info.sceneKeys'),old);assert(!old.includes('suwon-fortress'));});
for(const key of ['recruit-parkss-clinic-table-night-v1','recruit-leo-join-waiting-day-v1','recruit-leo-join-waiting-night-v1'])test(key+' approved delivery metadata',async()=>{const h=setup(),file=h.run(`D.scenes['${key}']`);assert.equal(file,'assets/scenes/'+key+'.webp');const m=await require('sharp')(path.join(root,file)).metadata();assert.deepEqual([m.width,m.height,m.format],[1024,576,'webp']);assert.match(h.run(`D.sceneAssetMeta['${key}'].status`),/runtime.crop.pending/i)});

const {buttons}=require('./fixtures/qa-cycle91-place-recruit-art/recruit-buttons.cjs');
const reunion=require('./fixtures/qa-cycle91-place-recruit-art/leo-reunion-baseline.json');
const leoRows=[rows.find(r=>r.id==='rq_leo_join'),{...reunion,id:'recruit_reunion_leo',outcomes:[{ci:0,file:reunion.paidFile,sha256:reunion.paidSha,result:reunion.result}]}];
test('Leo controlled reunion fixtures keep their recorded bytes',()=>{assert.equal(sha(fs.readFileSync(path.join(dir,reunion.entryFile))),reunion.entrySha);assert.equal(sha(fs.readFileSync(path.join(dir,reunion.paidFile))),reunion.paidSha)});
test('old reunion entry retains its recorded words and plate',()=>{const saved=JSON.parse(fs.readFileSync(path.join(dir,reunion.entryFile))),h=load(leoRows[1]);assert.equal(h.run('S.pendingPresentation.text'),saved.pendingPresentation.text);assert.deepEqual(h.json('info.sceneKeys'),saved.pendingPresentation.reading.view.sceneKeys);assert.deepEqual(h.json('S.pendingPresentation.reading'),saved.pendingPresentation.reading)});
for(const mode of ['reader','text-only'])test('old reunion paid '+mode+' retains receipt and historical text',()=>{const saved=JSON.parse(fs.readFileSync(path.join(dir,reunion.paidFile)));if(mode==='text-only'){delete saved.pendingPresentation.view;delete saved.pendingPresentation.reading;delete saved.pendingPresentation.authoredView}const h=setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));h.run("globalThis.e=event('recruit_reunion_leo'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");const before=state(h),receipt=h.json('S.pendingPresentation'),r=pay(h,0,0,false);assert(!r.applied);assert.equal(r.text,reunion.result.text);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);if(mode==='reader'){assert.deepEqual(r.info.sceneKeys,reunion.result.info.sceneKeys);assert.deepEqual(r.turns,reunion.result.turns)}else assert(h.run('r.out.frozenTextOnly'));h.run('G.save();G.load()');assert.deepEqual(h.json('S.pendingPresentation'),receipt);assert.deepEqual(state(h),before)});
for(const min of [329,330,1169,1170])test('Leo reunion also waits outside at '+min,()=>{const h=fresh(leoRows[1],min),want=`recruit-leo-join-waiting-${night(min)?'night':'day'}-v1`;assert.deepEqual(h.json('info.sceneKeys'),[want]);const r=pay(h,0);assert.deepEqual(r.info.sceneKeys,[want]);assert(!h.run("G.hasComp('leo')"));});
for(const row of leoRows)for(const legacy of [false,true])for(const which of ['current','restored'])for(const answer of ['yes','no'])test(`${row.id} ${legacy?'legacy':'fresh'} ${which} ${answer} uses actual offer callback`,()=>{
 const h=legacy?load(row,row.outcomes[0].file):fresh(row,600);buttons(h);pay(h,0);assert(!h.run("G.hasComp('leo')"));const party=h.json('S.party'),dog=h.run('S.dog'),notes=h.json('S.notes'),approach=h.run("S.recruitQ?.choice||S.recruitFarewells?.leo?.choice"),before=h.json('[S.food,S.water,S.fuel,S.scrap,S.day,S.min]');
 assert.equal(h.run(`qaClick(r.out,'${answer}','${which}')`),1);assert.equal(h.run('S.recruitQ'),null);assert.deepEqual(h.json('[S.food,S.water,S.fuel,S.scrap,S.day,S.min]'),before);
 if(answer==='yes'){assert.deepEqual(h.json('S.party'),[...party,'leo']);assert(h.run('S.dog'));assert.equal(h.run("G.doRecruit('leo')"),false);assert.equal(h.run("S.notes.filter(n=>n.title==='레오').length"),1);assert.equal(h.run('S.comps.leo.approach'),approach);assert.equal(h.run('S.recruitFarewells?.leo'),undefined)}
 else {assert.deepEqual(h.json('S.party'),party);assert(h.run('!!S.recruitFarewells.leo'));assert.equal(h.run('S.recruitFarewells.leo.choice'),approach);assert.equal(h.run('S.dog'),dog);assert.deepEqual(h.json('S.notes'),notes);assert.equal(h.run("G.declineRecruitOffer('leo')"),false)}
 assert(h.run('G.load()'));assert.equal(h.run("G.hasComp('leo')"),answer==='yes');if(answer==='no'){assert.equal(h.run('S.dog'),dog);assert.deepEqual(h.json('S.notes'),notes)}
});
for(const row of leoRows)for(const which of ['current','restored'])test(row.id+' full seats '+which+' keeps farewell reachable',()=>{const h=fresh(row,600);buttons(h);pay(h,0);h.run("S.party=['minji','parkss','eunsu'].slice(0,G.maxParty());globalThis.html=qaDecision('leo')");assert.match(h.run('html'),/data-r="yes"\s+disabled/);assert.match(h.run('html'),/data-r="no"/);const before=state(h);assert.equal(h.run(`qaClick(r.out,'yes','${which}',true)`),0);assert.equal(h.run("G.doRecruit('leo')"),false);assert.deepEqual(state(h),before);assert.equal(h.run(`qaClick(r.out,'no','${which}')`),1);assert.equal(h.run('S.recruitQ'),null)});
