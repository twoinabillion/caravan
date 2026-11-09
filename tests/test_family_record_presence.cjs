'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const H=require('./fixtures/qa-cycle103-eunsu-join/setup.cjs');
const ids=['parents_diversion_manifest','parents_separated_work','story_personal_cache','story_parent_route_shared','story_parent_route_guarded'];
function start(id,legacy=false){const h=H.setup();h.run(`S.pendingPresentation=null;S.party=[];S.driving=null;S.at=${JSON.stringify(id.startsWith('main_recovery_')?'suwon':'cheongju')};S.flags.parent_key_located=true;S.flags.parent_cache_shared=true;S.flags.parent_cache_guarded=true;delete S.flags.parent_key_found;S.items['부모님의 검증키']=0;globalThis.e=G.presentationEvent(${JSON.stringify(id)});G.beginPresentation(e);${legacy?'delete S.pendingPresentation.narrativeRevision;S.pendingPresentation.text=typeof e.text===\'function\'?e.text(S):e.text;':''}globalThis.entry=qaEntry(e);`);return h;}
function evidence(){const c=vm.createContext({});vm.runInContext(fs.readFileSync('src/07h-story-pages.js','utf8')+'\n'+fs.readFileSync('src/07i-evidence-scenes.js','utf8')+'\nglobalThis.api=EvidenceScenes;',c);return c.api;}
for(const base of ids)for(const recovery of [false,true]){
 const id=(recovery?'main_recovery_':'')+base;
 test(id+' shows the actual source, a personal response and no premature payment',()=>{
  const h=start(id);assert.equal(h.run('S.pendingPresentation.narrativeRevision'),/story_personal_cache|story_parent_route_/.test(id)?'story-rhythm-v1':'family-records-v1');
  const turns=h.json('entry'),words=turns.map(t=>t.text).join('\n');assert(turns.some(t=>t.kind==='record'));assert(turns.some(t=>t.who==='me'));assert.equal(h.run("S.items['부모님의 검증키']"),0);
  assert.doesNotMatch(words,/가족 이송 명령 작성자|보호 경로가 회수|검증키가 .*빠졌다/);
  if(recovery){assert.match(words,/수원 북부 교환소/);assert.doesNotMatch(words,/배차실 책상 밑에서.*나왔다|서진이|표식을 따라간 산지기 보관함에는/);}
  if(base==='parents_diversion_manifest'){assert.match(words,/부산행/);assert.match(words,/남산 기술 유지선/);assert.match(words,/중부 이송 기록 정리소/);}
  if(base==='parents_separated_work')assert.match(words,/같이.*일/);
  if(base==='story_personal_cache')assert.match(words,/마지막 두 장.*없음/);
  const before=h.run('JSON.stringify(S)');h.run('qaEntry(e)');assert.equal(h.run('JSON.stringify(S)'),before);
 });
 test(id+' physical record is page-bound, disappears on back and never enters old/paid readers',()=>{
  const h=start(id),api=evidence(),turns=h.json('entry'),index=turns.findIndex(t=>t.kind==='record'),e={id};assert(index>=0);
  const st={eventId:id,phase:'event',readerMode:'current',turns,index,readingPage:{cursor:{turn:index,offset:0},end:{turn:index+1,offset:0},mode:'read'},_page:{end:{turn:index+1,offset:0}}};
  st.inspection=api.inspection(e,st);const before=JSON.stringify(st),found=api.current(st);assert(found,id+' must paint its source');assert.equal(JSON.stringify(st),before);
  assert(!JSON.stringify(found).includes('03:12'),'no borrowed bus timing');
  if(recovery)assert.match(found.item.document.source,/수원|교환소/);
  st._page.end={turn:0,offset:0};st.readingPage.cursor={turn:0,offset:0};assert.equal(api.current(st),null);
  st.phase='outcome';assert.equal(api.current(st),null);
  const old=start(id,true),legacy={...st,phase:'event',turns:old.json('entry'),readingPage:{end:{turn:250,offset:0}}};assert.equal(api.inspection(e,legacy),undefined);
 });
 test(id+' each real choice pays once and freezes the result across save/reload',()=>{
  for(const ci of [0,1]){
   const h=start(id);h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${ci}]);`);assert(h.run('r.ok&&r.applied'));
   const saved=h.run('JSON.stringify(S.pendingPresentation)'),state=h.run('JSON.stringify([S.flags,S.items,S.notes,S.comps,S.day,S.min])');h.run('G.save();G.load();');assert.equal(h.run('JSON.stringify(S.pendingPresentation)'),saved);
   h.run(`globalThis.again=G.resolvePresentedChoice(e,e.choices[${ci}]);`);assert.equal(h.run('again.applied'),false);assert.equal(h.run('JSON.stringify([S.flags,S.items,S.notes,S.comps,S.day,S.min])'),state);assert.equal(h.run('again.out.text'),h.run('r.out.text'));
   if(base.startsWith('story_parent_route_'))assert.equal(h.run("S.items['부모님의 검증키']"),1);
  }
 });
 test(id+' unmarked historical paid readers and text-only receipts never acquire the new edition',()=>{
  for(const ci of [0,1])for(const textOnly of [false,true]){
   const h=start(id,true);h.run(`globalThis.r=G.resolvePresentedChoice(e,e.choices[${ci}]);`);assert(h.run('r.applied'));assert.equal(h.run('S.pendingPresentation.narrativeRevision'),undefined);
   const words=h.run('r.out.text'),paid=h.run('JSON.stringify([S.flags,S.items,S.notes,S.comps,S.day,S.min])');
   if(textOnly)h.run('delete S.pendingPresentation.authoredView;delete S.pendingPresentation.reading;delete S.pendingPresentation.view;');
   h.run(`G.save();G.load();globalThis.again=G.resolvePresentedChoice(e,e.choices[${ci}]);`);
   assert.equal(h.run('again.applied'),false);assert.equal(h.run('again.out.text'),words);assert.equal(h.run('JSON.stringify([S.flags,S.items,S.notes,S.comps,S.day,S.min])'),paid);assert.equal(h.run('S.pendingPresentation.narrativeRevision'),undefined);
   if(textOnly)assert.equal(h.run('again.out.frozenTextOnly'),true);
  }
 });
}
