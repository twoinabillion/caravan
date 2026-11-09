'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
const id='main_command_companion_ledger';
const ids=['companion-command-family-order','companion-command-human-check','companion-command-uplink'];
function fixture(){
 const context=vm.createContext({console,setTimeout:()=>0,clearTimeout(){},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),context);
 vm.runInContext(fs.readFileSync('src/07h-story-pages.js','utf8')+'\n'+fs.readFileSync('src/07i-evidence-scenes.js','utf8')+'\nglobalThis.evidence=EvidenceScenes;',context);
 const D=vm.runInContext('D',context),event=D.events.find(e=>e.id===id),turns=event.turns({party:['parkss'],comps:{parkss:{lvl:3}}});
 const state=index=>({eventId:id,phase:'event',readerMode:'current',turns,index,sceneKeys:['saved-original-scene'],readingPage:{cursor:{turn:index,offset:0},end:{turn:index+1,offset:0},mode:'read'},_page:{end:{turn:index+1,offset:0}}});
 const data=()=>vm.runInContext('JSON.stringify(D,(_key,value)=>typeof value==="function"?String(value):value)',context);
 return {api:context.evidence,D,event,turns,state,data};
}
test('companion ledger exposes its own three documents from actual authored facts without civilian-copy claims',()=>{
 const f=fixture(),before=f.data(),s=f.state(f.turns.length-1),inspection=f.api.inspection(f.event,s);
 assert(inspection,'companion-route physical records exist');
 assert.deepEqual(Array.from(inspection.items,x=>x.id),ids);
 const docs=Array.from(inspection.items,x=>x.document),values=docs.map(x=>Array.from(x.rows,r=>r.value));
 assert.deepEqual(values,[['부모님의 이송표와 남산 집행선 일치','동료에게 직접 들은 이야기 · 여정 기록'],['','집행'],['남아 있음','남산 밖으로 나감','이 원본으로는 확인 불가']]);
 assert.equal(docs[1].rows[0].blank,true);
 assert(docs.every(x=>x.kind==='form'&&x.source.includes('북부 명령 기록 보관함')));
 assert(!/세 당사자|세 증언|서명|정정 완료|\d{2}:\d{2}|\d{4}-\d{2}-\d{2}/.test(JSON.stringify(inspection)));
 assert(!f.event.inspection,'the read-only presentation registry never adds authored inspection data');
 assert(f.D.events.find(x=>x.id==='main_command_ledger').inspection.items[0].document.rows[0].value.includes('세 당사자'));
 assert.equal(f.data(),before,'all authored D data/functions/words/scenes/costs remain unchanged');
});
test('companion ledger discovers each physical record on its actual page and back cannot show future props',()=>{
 const f=fixture();
 const positions=['발신 번호 — 부모님의 이송표와 남산 집행선 일치','인간 확인 — 빈칸','별도 상위 격리 조건'].map(text=>f.turns.findIndex(t=>t.text.startsWith(text)));
 assert(positions.every(index=>index>=0),'current authored records exist after all narrative refinements');
 for(let index=0;index<f.turns.length;index++){
  const visible=ids.filter((_id,i)=>positions[i]<=index);
  const s=f.state(index);s.inspection=f.api.inspection(f.event,s);
  assert.deepEqual(Array.from(s.inspection?.items||[],x=>x.id),visible,'discovered records at turn '+index);
  const found=f.api.current(s,'current');assert.equal(found?.id,positions.includes(index)?ids[positions.indexOf(index)]:undefined,'physical prop at turn '+index);
 }
 const back=f.state(0);back.readingPage.end={turn:f.turns.length,offset:0};back.inspection=f.api.inspection(f.event,back);
 assert.equal(back.inspection.items.length,3,'already discovered sources stay inspectable');assert.equal(f.api.current(back),null,'earlier page cannot borrow later discovery high-water');
 back.readingPage.cursor={turn:1,offset:0};back._page.end={turn:2,offset:0};assert.equal(f.api.current(back).id,ids[0]);
 back._page.end={turn:1,offset:0};assert.equal(f.api.current(back),null,'a cue beyond the actual page end stays hidden');
});
test('legacy facts, paid results and review/memory views retain their original scene and stored reader',()=>{
 const f=fixture(),legacy=f.state(f.turns.length-1);legacy.turns=[{kind:'narration',text:typeof f.event.readingRecord==='function'?f.event.readingRecord({party:['parkss'],comps:{parkss:{lvl:3}}}):f.event.readingRecord}];
 assert.equal(f.api.inspection(f.event,legacy),undefined,'old text-only reader has no new explicit authored record markers');
 const incomplete=f.state(f.turns.length-1);incomplete.turns=f.turns.map(t=>({...t,text:t.text.replace('이 원본으로는 확인 불가','자료 없음')}));incomplete.inspection=f.api.inspection(f.event,incomplete);assert(incomplete.inspection,'earlier actual records remain available');assert(!incomplete.inspection.items.some(x=>x.id===ids[2]),'missing authored fact is never filled from canonical values');
 const s=f.state(f.turns.length-2);s.inspection=f.api.inspection(f.event,s);
 for(const patch of [{phase:'outcome',history:s},{readerMode:'review'},{readerMode:'inspection'}]){const view={...s,...patch},before=JSON.stringify(view);assert.equal(f.api.current(view,'current'),null);assert.equal(JSON.stringify(view),before);}
 for(const time of ['memory','epilogue']){const before=JSON.stringify(s);assert.equal(f.api.current(s,time),null);assert.equal(JSON.stringify(s),before);}
 assert.equal(f.api.inspection(f.event,{...s,phase:'outcome',history:null}),undefined,'paid text without entry history does not acquire a new document');
});
