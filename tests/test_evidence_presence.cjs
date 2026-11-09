'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const file='src/07i-evidence-scenes.js';
function load(){assert(fs.existsSync(file),'dedicated evidence presence module exists');const e=vm.createContext({});vm.runInContext(fs.readFileSync('src/07h-story-pages.js','utf8')+'\n'+fs.readFileSync(file,'utf8')+'\nglobalThis.api=EvidenceScenes;',e);return e.api;}
const text='폐쇄된 요금소 제어실에서 기록지가 아직도 조금씩 밀려 나오고 있었다. 자동 명령 발행 03:12. 버스 출발 03:16. 사람 확인 03:23. 확인자 칸은 비어 있었다.';
const originalInspection={title:'요금소의 출력 기록지',items:[{id:'trace-bus-log',label:'운행 기록지',text:'기록',document:{kind:'printout',title:'운행 기록지',rows:[{label:'자동 명령 발행',value:'03:12'},{label:'버스 출발',value:'03:16'},{label:'사람 확인',value:'03:23'},{label:'확인자',value:'',blank:true}]}}]};
function state(body=text){return {eventId:'story_bridge_trace_gap',phase:'event',readerMode:'current',turns:[{kind:'narration',text:body}],inspection:originalInspection,readingPage:{cursor:{turn:0,offset:0},end:{turn:1,offset:0},mode:'read'},_page:{end:{turn:1,offset:0}}};}
test('physical evidence appears at its actual page, hides on back even after a larger high-water mark, and never rewrites state',()=>{
 const a=load(),s=state(),before=JSON.stringify(s);assert(a.current(s,'current'));assert.equal(JSON.stringify(s),before);
 s._page.end={turn:0,offset:5};assert.equal(a.current(s,'current'),null,'previous page cannot borrow the later high-water mark');
 s._page.end={turn:1,offset:0};assert(a.current(s,'current'));
});
test('review, inspection, memories, epilogues and paid results keep their original picture',()=>{
 const a=load();for(const mode of ['review','inspection']){const s=state();s.readerMode=mode;assert.equal(a.current(s,'current'),null);}
 for(const kind of ['memory','epilogue'])assert.equal(a.current(state(),kind),null);
 const paid=state();paid.phase='outcome';assert.equal(a.current(paid,'current'),null);
});
test('a historical source without the actual evidence facts never borrows new canonical values',()=>{
 const a=load();assert.equal(a.current(state(text.replace('03:23','시각 없음')),'current'),null);assert.equal(a.current({...state(),eventId:'unlisted'},'current'),null);
});
test('new documents become inspectable only after their own discovery; copy provenance stays explicit',()=>{
 const a=load(),e={id:'main_recovery_onboarding_first_road'},body='수원 북부 교환소의 보관 담당자가 남쪽 검문 단말에서 옮겨 온 종이띠 사본과 저장 모듈을 내놓았다. 부모님의 이송표와 앞 여덟 자리가 같은 발신 번호가 남아 있었다. 배급망이 바뀔 때마다 이송 대상을 다시 고른다는 규칙도 적혀 있었다.';
 const s={...state(body),eventId:e.id};s.readingPage.end={turn:0,offset:0};assert.equal(a.inspection(e,s),undefined);
 s.readingPage.end={turn:1,offset:0};const inspected=a.inspection(e,s);assert(inspected?.items.length);assert(JSON.stringify(inspected).includes('사본'));assert(!JSON.stringify(inspected).includes('원본을 확보'));
 const legacy={...s,phase:'outcome',history:null};assert.equal(a.inspection(e,legacy),undefined,'text-only paid result has no invented entry source');
});
test('preview markup is escaped, material-specific, keyboard native and has no nested controls',()=>{
 const a=load(),cue=a.current(state(),'current');const before=JSON.stringify(cue),html=a.previewHtml(cue);assert.match(html,/03:12/);assert.match(html,/03:16/);assert.match(html,/03:23/);assert.doesNotMatch(html,/<(?:button|input|a|script)\b/);assert.equal(JSON.stringify(cue),before);
 const bad={...cue,item:{...cue.item,document:{...cue.item.document,title:'<img onerror=x>',rows:[{label:'<script>',value:'<svg onload=x>'}]}}};assert.doesNotMatch(a.previewHtml(bad),/<(?:img|svg|script)\b/);
});
test('all declared examples are scoped explicit scenes and the module precedes UI in the builder',()=>{
 const a=load();assert.equal(a.eventIds.length,23);assert.equal(new Set(a.eventIds).size,23);
 const family=['parents_diversion_manifest','parents_separated_work','story_personal_cache','story_parent_route_shared','story_parent_route_guarded'].flatMap(id=>[id,'main_recovery_'+id]);
 assert(family.every(id=>a.eventIds.includes(id)));assert.equal(a.eventIds.filter(id=>!family.includes(id)).length,13);
 const b=fs.readFileSync('tools/build-html.mjs','utf8');assert(b.indexOf("'src/07i-evidence-scenes.js'")>=0);assert(b.indexOf("'src/07i-evidence-scenes.js'")<b.indexOf("'src/07-ui.js'"));
});
test('every configured scene resolves against real authored words, including opening present/memory/terminal cuts',()=>{
 const {STATIC_CONTENT_FILES,permanentEvents}=require('../tools/content-registry.cjs'),c=vm.createContext({console,setTimeout:()=>0,clearTimeout(){},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});for(const f of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(f,'utf8'),c);const D=vm.runInContext('D',c),s=JSON.parse(fs.readFileSync('qa-artifacts/first30-20261101-companion/save.json','utf8')),a=load();
 const rows=[];
 for(const id of a.eventIds){
  const e=id==='opening_failed_appeal'?D.openingPresence.find(e=>e.id===id):permanentEvents(D).find(e=>e.id===id);assert(e,id+' source exists');
  const turns=typeof e.turns==='function'?e.turns(s):e.turns||[{kind:'narration',text:typeof e.text==='function'?e.text(s):e.text}];let time='current',seen=[];
  for(let i=0;i<turns.length;i++){
   if(turns[i].timeKind)time=turns[i].timeKind;
   const st={eventId:id,phase:'event',readerMode:'current',turns,index:i,readingPage:{cursor:{turn:i,offset:0},end:{turn:i+1,offset:0},mode:'read'},_page:{end:{turn:i+1,offset:0}}};st.inspection=a.inspection(e,st);const found=a.current(st,time);
   if(time==='memory')assert.equal(found,null,id+' cannot paint current paper over childhood');
   if(found)seen.push(found.id);
   if(id==='opening_failed_appeal'&&i===6){assert.equal(found?.id,'appeal-rejection');assert(!a.previewHtml(found).includes('6,412'),'population has not appeared yet');}
   if(id==='opening_failed_appeal'&&i===7)assert.equal(found?.id,'appeal-population');
  }
  assert(seen.length,id+' has an actual source cue');rows.push([id,seen]);
 }
 assert.equal(rows.length,23);
});
