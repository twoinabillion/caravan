/* Retained natural-play findings, reproduced in isolated actual engine fixtures. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
const baseline=require('../qa-artifacts/ten-persona-repairs-20261020/before.json');
test('persona repair keeps every observed event gate, probability, cost and effect',()=>{
 const h=setup();assert.deepEqual(h.json(`JSON.parse(JSON.stringify(${JSON.stringify(baseline.ids)}.map(id=>event(id)),(k,v)=>['text','label','turnSpeakers','turns','readingRecord','note','storyOrigin'].includes(k)?undefined:v))`),baseline.mechanics);
});
const lethal=`S.at='yangsan';S.day=7;S.min=1430;S._breakfastDay=7;S._lunchDay=7;S.water=0;S.food=12;S.thirst=3;S.van=60;S.wx='rain';S.wxNext='rain';`;
test('death stops advance exactly at midnight and blocks the rest of camp',()=>{
 const h=setup();h.run(lethal+'G.camp();');
 assert.deepEqual(h.json('({day:S.day,min:S.min,water:S.water,food:S.food,van:S.van,thirst:S.thirst,ended:S.ended})'),{day:8,min:0,water:0,food:12,van:60,thirst:3,ended:true});
 assert(!h.messages.some(x=>/빗물받이|아침 식사|야영으로 하루/.test(x)));
 const state=h.run('JSON.stringify(S)');h.run('G.advance(600);G.camp();');assert.equal(h.run('JSON.stringify(S)'),state);
});
test('advance death stops effect tail, relationship checks, notes and chains',()=>{
 const h=setup();h.run(lethal+`globalThis.e={...event('talk_pss_18'),id:'talk_pss_18',choices:[{label:'진단',out:[{p:1,text:'과거 결과',fx:{time:60,fatigue:-5,flag:'must_not_happen',item:{'종료뒤물건':1},chain:'seoul_costs',note:'종료 뒤 기록'}}]}]};G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);`);
 assert(h.run('S.ended'));assert.equal(h.run('!!S.flags.must_not_happen'),false);assert.equal(h.run('S.items["종료뒤물건"]||0'),0);
 assert.equal(h.run('S.notes.some(n=>n.body==="종료 뒤 기록")'),false);assert.equal(h.run('S.pendingPresentation'),null);
});
test('water reacquired before midnight allows the existing breakfast to drink, without free supply or early thirst reset',()=>{
 const h=setup();h.run(lethal+`S.water=2;G.advance(10,{sleeping:true});`);
 assert.equal(h.run('S.ended'),false);assert.equal(h.run('S.thirst'),3);assert.equal(h.run('S.water'),2);
 h.run('G.advance(390,{sleeping:true});');assert.equal(h.run('S.min'),390);assert.equal(h.run('S.thirst'),0);assert.equal(h.run('S.water'),1);
 h.run('G.save();G.load()');assert.equal(h.run('S.water'),1);
});
test('insufficient current water still ends at midnight; normal camp and next action continue',()=>{
 const no=setup();no.run(lethal+`S.party=['minji','kangwoo'];S.water=1;G.camp();`);assert(no.run('S.ended'));
 const ok=setup();ok.run(`S.at='yangsan';S.min=1200;S.thirst=0;S.water=10;S.food=10;G.camp();`);
 assert.equal(ok.run('S.ended'),false);assert.equal(ok.run('S.min'),390);assert(ok.run('G.save();G.load()'));assert(ok.run('G.exploreStatus().ok'));
});
test('every present dissent is heard, through real reader quote roles, including mixed rosters',()=>{
 for(const party of [[],['eunsu'],['kangwoo'],['jaeyi'],['eunsu','kangwoo','jaeyi']]){
  const h=setup();h.run('S.party='+JSON.stringify(party));
  const roles=h.json(`buildStoryTurns(event('seoul_costs').text(S),event('seoul_costs'),{turnSpeakers:D.finaleSpeakers('seoul_costs',-1,S)}).filter(t=>t.kind==='dialogue').map(t=>t.who)`);
  assert.deepEqual(roles,party);
 }
});
test('decision readers and foreseeable costs warn of the actual objector; same penalty once after reload',()=>{
 const h=setup();h.run(`S.party=['eunsu','kangwoo','jaeyi'];S.at='seoul';for(const id of S.party)S.comps[id].mood=80;S.flags.main_relay_confirmed=true;S.flags.seoul_costs_seen=true;`);
 const turns=h.json(`event('seoul_decision').turns(S)`);assert(turns.some(t=>/강우.*보존/.test(t.text)));
 assert(h.json(`G.choiceForeseeable(event('seoul_decision').choices[2])`).some(t=>/강우.*유대.*6/.test(t.text)));
 h.run(`globalThis.e=event('seoul_decision');globalThis.before=S.comps.kangwoo.bond;G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[2]);`);
 assert(h.run('p.ok'));assert.equal(h.run('S.comps.kangwoo.bond-before'),-6);
 assert(h.run('G.save();G.load()'));assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[2]).applied'),false);assert.equal(h.run('S.comps.kangwoo.bond-before'),-6);
});
test('journal distinguishes the restored video from the acquired separation pages',()=>{
 const h=setup();h.run(`S.flags.parent_principle_found=true;globalThis.row={kind:'main',id:'main_namsan',status:'active',chapterId:'verification-key'};`);
 assert.match(h.run('QuestJournal.entry(row).next'),/영상/);assert.doesNotMatch(h.run('QuestJournal.entry(row).next'),/설명서를 찾았으니/);
 h.run('S.flags.parent_key_found=true');assert.match(h.run('QuestJournal.entry(row).next'),/검증키.*꺼냈/);
});
test('three dialogue entries and outcomes preserve exact intended voices and spoken medium',()=>{
 const h=setup();h.run(`S.party=['minji','parkss','leo'];`);
 for(const [id,entry,out] of [
  ['pair_mj_pss_1',['minji','minji','parkss','minji','parkss','minji'],['minji','parkss','minji','parkss','minji','parkss','minji','minji','parkss']],
  ['pair_pss_leo_2',['leo'],['parkss','leo','parkss','leo','parkss','leo']],
  ['talk_pss_18',['parkss'],['parkss','me','parkss','parkss']]]){
  h.run('globalThis.e=event('+JSON.stringify(id)+')');
  assert.deepEqual(h.json(`buildStoryTurns(e.text,e).filter(t=>t.kind==='dialogue').map(t=>t.who)`),entry);
  assert.deepEqual(h.json(`buildStoryTurns(e.choices[0].out[0].text,e,{turnSpeakers:e.choices[0].out[0].turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)`),out);
 }
});
test('zero-time talks no longer certify a future night/day, and retain their actual effects',()=>{
 for(const [id,party] of [['pair_mj_pss_1',['minji','parkss']],['pair_pss_leo_2',['parkss','leo']],['talk_pss_18',['parkss']]]){
  const h=setup();h.run(`S.party=${JSON.stringify(party)};S.min=510;globalThis.e=event('${id}');G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);`);
  assert(h.run('p.ok'));assert.equal(h.run('S.min'),510);assert.doesNotMatch(h.run('p.out.text'),/다음 날 민지|그날 밤 두 번|그날은 일찍 잤다/);
 }
});
test('adjacent alternatives keep the grandmother, the decipherer and the praised driver distinct',()=>{
 const h=setup();h.run(`S.party=['parkss','minji'];`);
 for(const [id,choice,expected] of [['talk_pss_18',1,['me','parkss','me','parkss','parkss']],['talk_mj_15',0,['minji','minji','me','minji']],['near_mungyeong_omija',1,['passer_woman']]]){
  h.run(`globalThis.e=event('${id}');globalThis.out=e.choices[${choice}].out[0];`);
  assert.deepEqual(h.json(`buildStoryTurns(prose(out.text),e,{turnSpeakers:out.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)`),expected);
 }
});
test('completion notes and ledger both record actual bonus reward without reimbursing legacy notes',()=>{
 const h=setup();h.run(`S.at='suwon';S.day=4;S.items['부품']=3;G.acceptQuest({kind:'procure',from:'suwon',to:'suwon',due:10,reward:19,need:{name:'부품',qty:2}});globalThis.before=S.scrap;G.checkQuest();`);
 assert.equal(h.run('S.scrap-before'),23);assert.match(h.run('S.notes.at(-1).body'),/고철 23/);assert.match(h.run('S.questLedger.completed.at(-1).expected'),/고철 23/);
 h.run(`G.addNote({type:'사건',title:'옛 기록',body:'사례 고철 19.'});G.save();G.load();`);assert.equal(h.run('S.notes.at(-1).body'),'사례 고철 19.');assert.equal(h.run('G.checkQuest()'),false);
});
test('solo Omija contains only the introduced grandmother and the player, with the same price and medicine',()=>{
 const h=setup();h.run(`S.party=[];globalThis.meds=S.items['의약품'];globalThis.e=event('near_mungyeong_omija');G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);`);
 assert(h.run('p.ok'));assert.equal(h.run('S.scrap'),22);assert.equal(h.run('S.items["의약품"]-meds'),1);
 assert.doesNotMatch(h.run('p.out.text'),/잔을 돌렸|서로 다른 표정|난 단맛인데/);
 const roles=h.json(`buildStoryTurns(p.out.text,e,{turnSpeakers:p.out.turnSpeakers}).filter(t=>t.kind==='dialogue').map(t=>t.who)`);
 assert(roles.every(x=>['me','passer_woman'].includes(x)));
});
test('solo Suncheon does not invent answering companions and still costs 120 minutes',()=>{
 const h=setup();h.run(`S.party=[];S.min=450;globalThis.e=event('loc_suncheon');G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[0]);`);
 assert.equal(h.run('S.min'),570);assert.doesNotMatch(h.run('p.out.text'),/시베리아 맞아요|아마래|우린 서울도/);
});
test('stars and driving recollections do not invent current night or an immediate recent drive',()=>{
 const h=setup();h.run('S.min=538;S.day=20');
 assert.doesNotMatch(h.run(`prose(event('talk_es_05').choices[0].out[0].text)`),/지금은 진짜 별|목을 젖혀 북두칠성을 찾았다/);
 assert.match(h.run(`prose(event('talk_es_05').choices[0].out[0].text)`),/밤|별/);
 assert.doesNotMatch(h.run(`prose(event('talk_mj_15').text)`),/아까|험한 고개를 넘은 날/);
});
test('camp incidents reuse approved memory provenance, persisted reading and historical frozen receipts',()=>{
 const h=setup();for(const id of ['camp_thief','camp_dogs','camp_scan','camp_visitor']){
  h.run(`globalThis.e=event('${id}');globalThis.turns=buildStoryTurns(e.text,e);`);
  assert.equal(h.run('e.storyOrigin.kind'),'memory');assert.match(h.run('turns[0].timeLabel'),/지난밤/);
  h.run(`G.beginPresentation(e);G.capturePresentationView({eventId:e.id,phase:'event',turns,index:0});G.save();G.load();`);
  assert.equal(h.run('S.pendingPresentation.reading.view.turns[0].timeKind'),'memory');
  h.run('S.pendingPresentation=null');
 }
});
test('zero-food theft does not claim stolen food, keeps actual floor loss and frozen replay',()=>{
 const h=setup();h.run(`S.food=0;S.scrap=1;globalThis.e=event('camp_thief');G.beginPresentation(e);globalThis.p=G.resolvePresentedChoice(e,e.choices[2]);`);
 assert.equal(h.run('S.food'),0);assert.equal(h.run('S.scrap'),0);assert.doesNotMatch(h.run('p.out.text'),/식량 약간이 사라졌다/);
 h.run('G.save();G.load()');assert.equal(h.run('G.resolvePresentedChoice(e,e.choices[2]).out.text'),h.run('p.out.text'));
});
test('small clarifications retain lab evidence, exact watch time, explicit radio actor and local tool source',()=>{
 const h=setup();assert.doesNotMatch(h.run(`prose(event('ev_chunrian_lab').choices[0].out[1].text)`),/남은 건.*서버랙.*뿐/);
 assert.doesNotMatch(h.run(`D.stls.suwon.field.actions.find(a=>a.id==='wall_watch').result`),/한 시간/);
 assert.doesNotMatch(h.run(`event('exp_radiostation').choices[0].out[0].text`),/누가/);
 for(const i of [0,1])assert.match(h.run(`event('water_toll').choices[2].out[${i}].text`),/우물.*(?:놓|기대|파이프)/);
 assert(h.run(`G.reqOk(G.choiceReq(event('water_toll').choices[2])).ok`));
});
test('seeds are still seeds, present food/parts acquire a cause and partial recovery does not promise them',()=>{
 const h=setup();assert.match(h.run(`event('ev_seed_warehouse').choices[0].out[0].text`),/저장식/);assert.match(h.run(`event('ev_seed_warehouse').choices[0].out[0].text`),/부품/);
 assert.doesNotMatch(h.run(`event('ev_seed_warehouse').choices[0].out[1].text`),/저장식|부품/);
});
test('fatigue receipts use actual clamped delta, including zero and time-before-effect; old chips stay frozen',()=>{
 const h=setup();for(const [start,effect,expected] of [[0,-5,0],[2,-5,-2],[20,-5,-5],[99,5,1],[100,5,0]]){
  h.run(`S.fatigue=${start};globalThis.chips=G.applyFx({fatigue:${effect}});`);
  assert.equal(h.run('chips[0].t'),'피로 '+(expected>0?'+':'')+expected);
 }
 h.run(`S.fatigue=0;globalThis.chips=G.applyFx({time:10,fatigue:-5});`);assert.match(h.run('chips.at(-1).t'),/피로 -0\.45/);
});
test('temporary Kangwoo guest is recognized without falsely completing recruitment',()=>{
 const h=setup();h.run(`S.party=['minji'];S.recruitQ={id:'kangwoo',stage:'ready'};`);
 assert.doesNotMatch(h.run(`event('cell_dome_meet').choices[0].out[0].text(S)`),/북쪽 길에서 만나면/);
 assert.equal(h.run('S.party.includes("kangwoo")'),false);
});
test('unhanded Namsan letter is explicitly still a promise, not invented delivery or item consumption',()=>{
 const h=setup();h.run(`S.items['남산행 편지']=1;globalThis.t=D.finaleReturnTurns(S);`);
 assert(h.json('t').some(t=>/편지/.test(t.text)&&/아직|남아/.test(t.text)));
 assert.equal(h.run('S.items["남산행 편지"]'),1);
 h.run(`delete S.items['남산행 편지'];`);assert(!h.json('D.finaleReturnTurns(S)').some(t=>/편지/.test(t.text)));
});
test('text-only legacy result remains frozen with no additional resource or time charge',()=>{
 const h=setup();h.run(`S.party=['parkss'];globalThis.e=event('talk_pss_18');globalThis.old={...e,choices:[{...e.choices[0],out:[{...e.choices[0].out[0],text:'그래도 그날은 일찍 잤다.',turns:null}]}]};G.beginPresentation(old);G.resolvePresentedChoice(old,old.choices[0]);globalThis.state=JSON.stringify([S.scrap,S.day,S.min,S.fatigue]);G.save();G.load();globalThis.replay=G.resolvePresentedChoice(e,e.choices[0]);`);
 assert.equal(h.run('replay.applied'),false);assert.equal(h.run('replay.out.text'),'그래도 그날은 일찍 잤다.');assert.equal(h.run('JSON.stringify([S.scrap,S.day,S.min,S.fatigue])'),h.run('state'));
});
test('fatal choice cannot play result audio or touch the event after showEnding replaces it',()=>{
 const h=setup(),ui=fs.readFileSync('src/07-ui.js','utf8'),start=ui.indexOf('  function resolveChoice(choice){');
 h.run(`let curStory=null,curEv={};function clearStoryAuto(){}function storyOutcomeIsQuiet(){return false;}
   G.resolvePresentedChoice=()=>{S.ended=true;curEv=null;return {ok:true,applied:true,out:{},chips:[]};};
   globalThis.audioCalls=0;const AMBI={result(){audioCalls++}};`+ui.slice(start,ui.indexOf('\n  function ',start+10)));
 h.run('resolveChoice({})');assert.equal(h.run('audioCalls'),0);
});
test('old fatigue chips stay historical after reload instead of being recalculated at the new cap',()=>{
 const h=setup();h.run(`S.fatigue=0;globalThis.e=event('ev_truck_cafe');G.beginPresentation(e);G.resolvePresentedChoice(e,e.choices[0]);
  S.pendingPresentation.chips=[{t:'피로 -5',c:'plus'}];G.save();G.load();globalThis.r=G.resolvePresentedChoice(e,e.choices[0]);`);
 assert.equal(h.run('r.applied'),false);assert.deepEqual(h.json('r.chips'),[{t:'피로 -5',c:'plus'}]);assert.equal(h.run('S.fatigue'),0);
});
