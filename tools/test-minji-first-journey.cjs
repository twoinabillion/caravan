/* Isolated authored-content/engine tests. Never opens or writes the live save. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES,permanentEvents}=require('./content-registry.cjs');
const read=f=>fs.readFileSync(f,'utf8');
const html=read('tools/design-drafts/minji-first-journey.html');
const css=read('tools/design-drafts/minji-first-journey.css');
function setup(){
  const c=vm.createContext({console,G:{},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
  for(const f of STATIC_CONTENT_FILES)vm.runInContext(read(f),c);
  c.data=vm.runInContext('D',c);
  c.S={day:3,party:['minji'],stats:{km:100,events:2},memories:{choices:{},pending:[],history:[]},driving:null};
  vm.runInContext(read('src/04b-engine-crew.js'),c);
  Object.assign(c.G,{ensureNarrativeState(){},qualityChoiceRemember(){},qualityChoiceEcho(){},save(){},hasComp:id=>c.S.party.includes(id)});
  return c;
}
test('first journey is a registered, script-free draft separate from gameplay',()=>{
  const {drafts}=JSON.parse(read('tools/design-drafts/manifest.json'));
  assert.equal(new Set(drafts.map(d=>d.id)).size,drafts.length);
  assert.equal(drafts.find(d=>d.id==='minji-first-journey-v1').file,'minji-first-journey.html');
  assert.match(html,/default-src 'none'/);
  assert.doesNotMatch(html,/<script\b|\bon\w+\s*=|localStorage|sessionStorage|javascript:|<iframe\b|<form\b/i);
  assert.doesNotMatch(read('tools/build-html.mjs'),/minji-first-journey/);
  assert.match(html,/기존 공식 초상/);
  assert.doesNotMatch(css,/!important|animation:/);
});
test('six scenes require explicit consent and a method before showing its consequences',()=>{
  const stages=[...html.matchAll(/<option value="([a-z]+)"/g)].map(m=>m[1]);
  assert.deepEqual(stages,['meet','purpose','task','road','camp','morning']);
  for(const stage of stages)assert(css.includes(`option[value="${stage}"]:checked`));
  assert.match(html,/id="mj-undecided" checked/);
  assert.match(css,/not\(:has\(#mj-accept:checked\)\) .mj-accepted-scenes\{display:none\}/);
  assert.match(html,/id="mj-method-none" checked/);
  assert.match(css,/:has\(#mj-method-none:checked\) .mj-after-task\{display:none\}/);
  for(const method of ['winch','pulley','shield']){
    assert.match(html,new RegExp(`id="mj-${method}"`));
    assert(css.includes(`:has(#mj-${method}:checked) .mj-branch-${method}`));
    assert.equal((html.match(new RegExp(`class="[^"]*mj-branch-${method}"`,'g'))||[]).length,4);
  }
  assert.match(html,/거절하고 혼자 가는 길도 유효한 선택/);
  const request=html.match(/<div class="mj-request">([\s\S]*?)<\/div>/)[1];
  assert.match(request,/오빠가 남긴 진단기/);
  assert.match(request,/목소리가 남아 있을지도/);
  assert.doesNotMatch(request,/<details/); // essential motivation is not an optional disclosure
  assert.match(html,/지금 살아 있다는 응답을 받은 것은 아닙니다/);
  assert.match(html,/대화를 하지 않았다는 이유로 합류를 막거나/);
  assert.match(css,/:focus-visible/);
});
test('draft preserves the three existing task costs and requirements',()=>{
  const c=setup(),e=permanentEvents(c.data).find(e=>e.id==='rq_minji_task');
  const mechanics=e.choices.map(ch=>({req:ch.req||{},fx:{time:ch.out[0].fx.time,van:ch.out[0].fx.van,...(ch.out[0].fx.scrap?{scrap:ch.out[0].fx.scrap}:{}),recruitChoice:ch.out[0].fx.recruitChoice}}));
  assert.deepEqual(JSON.parse(JSON.stringify(mechanics)),[
    {req:{up:'winch'},fx:{time:45,van:2,recruitChoice:'winch'}},
    {req:{scrap:4},fx:{time:90,van:-3,scrap:-4,recruitChoice:'pulley'}},
    {req:{},fx:{time:50,van:-12,recruitChoice:'shield'}}]);
  for(const phrase of ['윈치 장착 필요 · 45분','고철 4 · 90분','50분 · 차체 손상 위험','45분 / 차체 +2','90분 / 고철 −4 / 차체 −3','50분 / 차체 −12'])assert(html.includes(phrase));
});
test('family callback remembers the corrected 80km promise without changing its gate or effects',()=>{
  const c=setup(),e=permanentEvents(c.data).find(e=>e.id==='meet_family'),choice=e.choices[1],out=choice.out[0];
  assert.match(out.text,/80\. 짐 실었으니까 80/);
  assert.equal(choice.req.comp,'minji');
  assert.equal(out.fx.fuel,8);assert.equal(out.fx.moodAll,4);
  const def=c.data.choiceMemories.meet_family[1];
  assert.equal(def.afterKm,16);assert.equal(def.lines[1][1],'팔십 킬로라고 했지.');
});
test('corrected callback survives serialization, waits for driving and Minji, and plays only once',()=>{
  const c=setup(),e=permanentEvents(c.data).find(e=>e.id==='meet_family');
  c.G.rememberChoice(e,e.choices[1],e.choices[1].out[0]);
  c.G.rememberChoice(e,e.choices[1],e.choices[1].out[0]);
  assert.equal(c.S.memories.pending.length,1);
  c.S=JSON.parse(JSON.stringify(c.S));
  c.S.stats.km=116;c.S.stats.events=3;
  assert.equal(c.G.takeChoiceEcho(),null); // stopped
  c.S.driving={};c.S.party=[];
  assert.equal(c.G.takeChoiceEcho(),null); // no phantom companion
  assert.equal(c.S.memories.pending.length,1);
  c.S.party=['minji'];
  const echo=c.G.takeChoiceEcho();assert.equal(echo.lines[1][1],'팔십 킬로라고 했지.');
  c.S=JSON.parse(JSON.stringify(c.S));
  assert.equal(c.G.takeChoiceEcho(),null);
  assert.equal(c.S.memories.choices.family_repaired.echoed,true);
});
