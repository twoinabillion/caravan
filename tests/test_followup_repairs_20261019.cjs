/* Regressions from retained real-engine audits. Isolated fixtures, not UI QA. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
function setup(){
  const store=new Map(),messages=[],noop=()=>{};
  const ctx=vm.createContext({console,Date,URLSearchParams,location:{search:''},
    setTimeout:()=>0,clearTimeout:noop,document:{readyState:'loading',addEventListener:noop},
    window:{dispatchEvent:noop},CustomEvent:function(){},
    UI:new Proxy({modalOpen:()=>false,onArrive:()=>0,toast:t=>messages.push(t)},{get:(o,k)=>o[k]||noop}),
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  const run=code=>vm.runInContext(code,ctx);
  for(const p of STATIC_CONTENT_FILES)run(fs.readFileSync(p,'utf8'));
  for(const f of fs.readdirSync('src').filter(f=>/^04[a-h]-.*\.js$/.test(f)).sort())run(fs.readFileSync('src/'+f,'utf8'));
  const ui=fs.readFileSync('src/07-ui.js','utf8');
  run(ui.match(/  const stripTags=.*;/)[0]+ui.match(/  const playerSpeaker=.*;/)[0]+
    ui.slice(ui.indexOf('  function eventSpeakerCandidates('),ui.indexOf('  function prepareEventAudio(')));
  const journal=fs.readFileSync('src/07d-ui-quests.js','utf8');
  run(journal.slice(0,journal.indexOf('const QuestLedgerUI=')));
  run("let curStl='miryang';const ITEM_ICO={};"+ui.slice(ui.indexOf('  function marketFieldRows(){'),ui.indexOf('  function fieldBoardRow(')));
  run(`G.seedOverride=191995;G.newGame('onroad','상혁','interactive');S.opening.completed=true;
    globalThis.event=id=>D.events.find(e=>e.id===id)||D.seoulStops.find(e=>e.id===id);`);
  return {run,messages};
}
const letter=`S.at='suwon';S.day=4;S.min=390;G.acceptQuest({kind:'letter',from:'miryang',to:'suwon',npc:'gitae',due:6,reward:6});`;
test('follow-up prose changes retain original event gates, probabilities, costs and effects',()=>{
  const h=setup(),rows=h.run(`JSON.stringify(D.events.filter(e=>['cleaners_recall','talk_pss_17','ev_leo_solo'].includes(e.id)),
    (k,v)=>['text','label','turnSpeakers','turns','readingRecord','note'].includes(k)?undefined:v)`);
  // Independently captured before editing production files in this batch.
  assert.equal(crypto.createHash('sha256').update(rows).digest('hex'),'4c8af97c273dc9d2e8819873530f3cb21d96f1ee7141e370f43310ad8226dc0f');
});
test('hard deadline is disclosed in actual notebook projection, without changing accepted quest',()=>{
  const h=setup();h.run(letter+`globalThis.original=JSON.stringify(S.quest);globalThis.row=G.localQuestEntries()[0];`);
  assert.match(h.run('QuestJournal.entry(row).phase'),/기한 6일차까지.*넘기면 실패/);
  assert.doesNotMatch(h.run('QuestJournal.entry(row).phase'),/권장/);
  h.run('QuestJournal.entry(row);G.questActionPlan(row.id)');
  assert.equal(h.run('JSON.stringify(S.quest)'),h.run('original'));
  assert.equal(h.run('S.scrap'),24); // Inspecting does not hand in or pay.
});
test('deadline still permits day6 handoff and fails at actual day7 dawn; next board stays usable',()=>{
  const ontime=setup();ontime.run(letter+`S.day=6;globalThis.before=S.scrap;`);
  assert(ontime.run('G.checkQuest()'));assert.equal(ontime.run('S.scrap-before'),6);
  const late=setup();late.run(letter+`S.day=6;S.min=1430;S._breakfastDay=6;S._lunchDay=6;G.advance(11)`);
  assert.equal(late.run('S.day'),7);assert.equal(late.run('S.quest'),null);
  assert(late.messages.some(t=>/기한 초과.*실패/.test(t)));
  assert(late.run('G.save();G.load()'));assert.equal(late.run('S.quest'),null);
  assert.equal(late.run('G.checkQuest()'),false);assert(late.run('G.rollQuests().length>0'));
});
test('stale overdue journal offers status inspection, not guaranteed late handoff; no-expiry stays no-expiry',()=>{
  const h=setup();h.run(letter+`S.day=7;globalThis.row=G.localQuestEntries()[0]`);
  assert.match(h.run('row.next'),/처리 상태/);
  assert.match(h.run('QuestJournal.entry(row).next'),/약속한 날을 넘겨.*처리 상태/);
  assert.doesNotMatch(h.run('row.next+QuestJournal.entry(row).next'),/늦었어도 전달|전달을 마칠 수/);
  h.run('S.quest.noExpiry=true;globalThis.row=G.localQuestEntries()[0]');
  assert.match(h.run('QuestJournal.entry(row).phase'),/기한 없음/);
  assert.doesNotMatch(h.run('QuestJournal.entry(row).next'),/날을 넘겨/);
});
test('completion receipt includes the actual early bonus once, persists and projects through notebook',()=>{
  const h=setup();h.run(letter+`globalThis.before=S.scrap;G.checkQuest();globalThis.row=G.completedQuestEntries().find(r=>r.id.includes('local_letter_'));`);
  assert.equal(h.run('S.scrap-before'),10);assert.equal(h.run('row.expected'),'고철 10개를 받았다.');
  assert.equal(h.run('QuestJournal.entry(row).receipt'),'고철 10개를 받았다.');
  assert(h.run('G.save();G.load()'));assert.equal(h.run('G.checkQuest()'),false);
  assert.equal(h.run('S.scrap-before'),10);assert.equal(h.run('S.questLedger.completed.length'),1);
});
test('procurement and no-expiry story receipts match payment without changing consumption or reward rules',()=>{
  const h=setup();h.run(`S.at='suwon';S.day=4;S.items['부품']=3;
    G.acceptQuest({kind:'procure',from:'suwon',to:'suwon',due:10,reward:15,need:{name:'부품',qty:2}});
    globalThis.before=S.scrap;G.checkQuest();`);
  assert.equal(h.run('S.items["부품"]'),1);assert.equal(h.run('S.scrap-before'),19);
  assert.equal(h.run('S.questLedger.completed.at(-1).expected'),'고철 19개를 받았다.');
  h.run(`G.acceptQuest({kind:'express',from:'suwon',to:'suwon',item:'주파수표',due:103,noExpiry:true,reward:20});
    globalThis.before=S.scrap;G.checkQuest();`);
  assert.equal(h.run('S.scrap-before'),26);assert.equal(h.run('S.questLedger.completed.at(-1).expected'),'고철 26개를 받았다.');
});
test('old completion receipts are not silently rewritten or reimbursed on inspection/reload',()=>{
  const h=setup();h.run(`S.questLedger.completed.push({id:'completed_old',expected:'고철 6개를 받았다.',status:'completed'});
    globalThis.before=S.scrap;G.completedQuestEntries().forEach(r=>QuestJournal.entry(r));G.save();G.load();`);
  assert.equal(h.run('S.questLedger.completed.at(-1).expected'),'고철 6개를 받았다.');assert.equal(h.run('S.scrap'),h.run('before'));
});
test('ordinary checkpoint and real five-cart convoy memories remain distinct; old paid context stays frozen',()=>{
  const h=setup();
  const normal=h.run(`G.campReportMemory({threat:'자동 검문소',objective:'송신 전에 차단봉을 열고 기록 없이 통과한다',resultCode:'partial'})`);
  assert.match(normal,/자동 검문소.*다 끝내지는 못했다/);assert.doesNotMatch(normal,/수레/);
  assert.match(h.run(`G.campReportMemory({threat:'잠든 자동 검문소',objective:'다섯 수레를 기록 없이 통과시킨다',resultCode:'success'})`),/수레.*해냈다/);
  assert.equal(h.run(`G.campReadingContext({context:'검문소 앞에 늘어서 있던 수레들이 떠오른다. 다 끝내지는 못했다.'})`),'검문소 앞에 늘어서 있던 수레들이 떠오른다. 다 끝내지는 못했다.');
});
test('cleaners leave one van to the woman, and partial-outcome note matches her local exit',()=>{
  const h=setup(),success=h.run(`event('cleaners_recall').choices[0].out[0].text`);
  assert.match(success,/넷은.*걸어서 물러났다/);assert.match(success,/여자는.*승합차 문을 안에서 잠갔다/s);
  assert.doesNotMatch(success,/넷은.*승합차에 올랐다/);
  const partial=h.run(`event('cleaners_recall').choices[0].out[1].fx.note.body`);
  assert.match(partial,/차에서 내려.*들길/);assert.doesNotMatch(partial,/태우고 떠난|갈림길/);
});
test('Parkss chime is an immediate reaction, costs the same one scrap and does not complete a future day',()=>{
  const h=setup();h.run(`S.at='cheonan';S.min=390;S.party=['parkss'];globalThis.e=event('talk_pss_17');
    globalThis.before=[S.day,S.min,S.scrap];G.beginPresentation(e);globalThis.paid=G.resolvePresentedChoice(e,e.choices[0]);`);
  assert(h.run('paid.ok'));assert.equal(h.run('S.min'),390);assert.equal(h.run('S.scrap-before[2]'),-1);
  assert.match(h.run('paid.out.text'),/한 번 더 문을 여닫았다/);assert.doesNotMatch(h.run('paid.out.text'),/그날 하루/);
});
test('Bori first-meeting, tag and emotional callback share one origin and preserve actual quote roles',()=>{
  const h=setup();h.run(`S.party=['leo'];S.dog=true;S.flags.bori_tag_found=true;
    globalThis.e=event('ev_leo_solo');globalThis.roles=buildStoryTurns(e.text,e).filter(t=>t.kind==='dialogue').map(t=>t.who);`);
  assert(h.run(`G.eventAvailable(e,{mode:'local',node:'cheonan'})`));
  assert.match(h.run('e.text'),/공연.*앞에.*앉았어요/);assert.match(h.run('e.text'),/가족들 잃고/);
  assert.doesNotMatch(h.run('e.text+e.choices[0].out[0].fx.note.body'),/원래 우리 가족 개|폐허를 뚫고/);
  assert.equal(h.run('JSON.stringify(roles)'),JSON.stringify(['leo','leo','leo','leo']));
  for(const [index,route] of [[0,['me','leo','leo','me','leo','leo']],[1,['leo','leo']]]){
    const roles=h.run(`buildStoryTurns(e.choices[${index}].out[0].text,e,{turnSpeakers:e.choices[${index}].out[0].turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)`);
    assert.equal(JSON.stringify(roles),JSON.stringify(route));
  }
});
test('new finale memories use the proper Korean particle for each actual companion',()=>{
  const h=setup();
  for(const id of ['parkss','leo']){
    h.run(`S.party=['${id}'];globalThis.choice=D.campConversations['${id}'].choices[0];
      S.campMemories={['${id}']:{choiceId:choice.id,visits:1,home:choice.home}};`);
    const text=h.run(`event('seoul_night').choices[0].out[0].turns(S).map(t=>t.text).join(' ')`);
    assert.match(text,id==='parkss'?/박 선생과 함께/:/레오와 함께/);assert.doesNotMatch(text,/박 선생와/);
  }
});
test('paid historical chime result retains its old words after reload, without another cost',()=>{
  const h=setup();h.run(`S.party=['parkss'];globalThis.e=event('talk_pss_17');
    globalThis.old={...e,choices:e.choices.map(c=>({...c,out:c.out.map(o=>({...o,text:'그날 하루 조수석 문이 제일 바빴다.'}))}))};
    G.beginPresentation(old);globalThis.paid=G.resolvePresentedChoice(old,old.choices[0]);globalThis.scrap=S.scrap;
    G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,e.choices[0]);`);
  assert.equal(h.run('replay.applied'),false);assert.equal(h.run('S.scrap'),h.run('scrap'));
  assert.equal(h.run('replay.out.text'),'그날 하루 조수석 문이 제일 바빴다.');
});
test('actual market rows use bundles while actual purchases and calculated ration days stay unchanged',()=>{
  const h=setup();h.run(`S.at='miryang';globalThis.rows=marketFieldRows().supplyRows;
    globalThis.food=rows.find(r=>r.kind==='trade'&&r.group==='주행과 보급'&&r.label.includes('식량'));
    globalThis.before=S.food;globalThis.result=G.trade(curStl,food.index);`);
  assert.match(h.run('food.sub'),/1묶음을/);assert.doesNotMatch(h.run('food.sub'),/일치/);
  assert.match(h.run('rows.find(r=>r.kind==="bundle").sub'),/식량 2묶음/);
  assert(h.run('result.ok'));assert.equal(h.run('S.food-before'),1);assert.equal(h.run('G.dailyRationInfo().foodPerDay'),2);
  h.run(`S.at='daejeon';curStl='daejeon';globalThis.row=marketFieldRows().supplyRows.find(r=>r.kind==='sell')`);
  assert.match(h.run('row.label'),/식량 1묶음/);
  h.run('S.food=1;globalThis.blocked=G.sellToDemand(curStl)');assert.equal(h.run('blocked.ok'),false);
  assert.match(h.run('blocked.why'),/2묶음.*1묶음/);assert.doesNotMatch(h.run('blocked.why'),/이틀/);
  h.run('S.food=2;globalThis.sold=G.sellToDemand(curStl)');assert(h.run('sold.ok'));assert.equal(h.run('S.food'),1);
});
