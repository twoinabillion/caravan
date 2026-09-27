const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const ctx=vm.createContext({document:{readyState:'loading',addEventListener(){}},S:{at:'gimcheon',day:1,min:1312.632,flags:{},items:{부품:1},comps:{},party:[],quest:null},D:{nodes:{gimcheon:{name:'김천 갈림길'},cheongju:{name:'청주 방송국'},suwon:{name:'수원 외곽'},muju:{name:'무주 터널'}},comps:{minji:{name:'민지'},parkss:{name:'박 선생'},kangwoo:{name:'강우'},leo:{name:'레오'},jaeyi:{name:'재이'},eunsu:{name:'은수'}},npcs:{a:{name:'배달원'}},seoulMap:{stops:[{name:'한강 진입로'}]}},G:{departureSteps:()=>[],mainEvidenceOpportunity:()=>({target:'cheongju',cost:'열람 준비 30분 + 선택·후속 작업 10~30분'}),questActionPlan:()=>({label:'경로 보기'})},UI:{}});
 vm.runInContext(fs.readFileSync('src/07d-ui-quests.js','utf8')+';this.J=QuestJournal;this.Q=QuestLedgerUI;',ctx);return ctx;
}
const row={id:'main_namsan',kind:'main',status:'active',chapterId:'parents-separated-work',title:'이전 제목',why:'미래에 드러나는 비밀',next:'이전 조작 안내',expected:'아직 얻지 못한 보상',steps:[],progress:{have:1,need:14,label:'1/14'}};
test('current parents-work prose, separate real cost/target and spoiler exclusion',()=>{
 const c=setup(),before=JSON.stringify(c.S),j=c.J.entry(row),html=c.Q.card(row);
 assert.equal(j.title,'아빠와 엄마가 남긴 기록');assert.match(j.next,/같이 봐야 좀 알 것 같다/);
 assert.doesNotMatch(html,/미래에 드러나는 비밀|아직 얻지 못한 보상|분리 절차|증언 묶음/);
 assert.match(html,/class="quest-guide"[^>]*>청주 방송국 · 주변 탐색 · 열람 준비 30분 \+ 선택·후속 작업 10~30분/);
 assert.doesNotMatch(html.match(/class="quest-next">([^<]+)/)[1],/주변 탐색|30분/);
 assert.equal(JSON.stringify(c.S),before);assert.equal(row.title,'이전 제목');
 c.G.mainEvidenceOpportunity=()=>({target:'suwon',cost:'열람 준비 30분'});
 assert.match(c.J.entry(row).guide,/수원 외곽/);
});
test('all main stages use authored notes, known records only and partial reunion',()=>{
 const c=setup();
 for(const [key,copy] of Object.entries(c.J.main)){
   const chapter=Object.keys(c.J.chapters).find(k=>c.J.chapters[k]===key)||key;
   const input={...row,chapterId:chapter,steps:[{id:key,state:'upcoming',label:'미래 단서'}]};
   const j=c.J.entry(input);assert.equal(j.title,copy[0]);assert.equal(j.next,copy[1]);assert.equal(j.steps.length,0);
   const known=c.J.entry({...input,steps:[{id:key,state:'done'}]});assert.equal(known.steps[0].detail,copy[2]);
 }
 c.S.flags.mother_reunited=true;assert.match(c.J.entry({...row,chapterId:'mother-reunion'}).next,/다시 만났다/);
 c.G.mainEvidenceOpportunity=()=>null;
 for(const chapter of ['ending','seoul-0','seoul-1','road-to-seoul','prepare-관계','prepare-세계','prepare-진실','prepare-유산']){
   const j=c.J.entry({...row,chapterId:chapter,status:chapter==='ending'?'completed':'active'});
   assert(j.next);assert.doesNotMatch(j.next,/미래에 드러나는 비밀|아직 얻지 못한 보상/);
 }
});
test('legacy history never promotes old expected outcomes into facts',()=>{
 const c=setup(),old={...row,id:'main_history_parents-separated-work_1_gimcheon',chapterId:undefined,kind:'completed',status:'completed'};
 const original=JSON.stringify(old);assert.doesNotMatch(c.J.entry(old).expected,/분리 절차|증언 묶음|아직 얻지/);
 c.G.departureSteps=()=>[{id:'parents_work',done:true}];assert.match(c.J.entry(old).expected,/서로 기록을 보내고/);
 assert.equal(JSON.stringify(old),original);
 const local=c.J.entry({id:'completed_local_x',kind:'completed',status:'completed',expected:'고철 12개를 받았다.'});
 assert.match(local.expected,/맡았던 일은 끝/);assert.doesNotMatch(local.expected,/고철|12개/);assert.equal(local.receipt,'고철 12개를 받았다.');assert.equal(local.guide,'');
});
test('six companion task/road/night/ready/perk/completed states keep real next action',()=>{
 const c=setup();
 for(const id of Object.keys(c.D.comps)){
  const r={id:`companion_${id}`,kind:'companion',companion:id,status:'active',next:'야영 · 대화 · 유대 3 필요',steps:[]};
  for(const stage of ['task','road','follow','ready']){
   c.S.recruitQ={id,stage,target:'muju',roadDay:1};
   const j=c.J.entry(r);assert(j.next);assert(j.guide);assert.doesNotMatch(j.next,/퍼크|Lv\.|보상/);
   if(stage==='follow'){assert.match(j.next,/내일/);c.S.day=2;assert.match(c.J.entry(r).next,/같이 갈 생각/);c.S.day=1;}
  }
  c.S.recruitQ=null;c.S.comps[id]={pending:2};assert.match(c.J.entry(r).guide,/Lv\.2/);
  c.S.comps[id]={};assert.match(c.J.entry(r).next,/이야기를 더/);
  assert.equal(c.J.entry({...r,status:'completed'}).expected,c.J.companionRecords[id][2]);
 }
 assert.equal(c.J.withName('박 선생'),'박 선생과');
});
test('scribbles are authored and state-aware, not repeated on every record',()=>{
 const c=setup();assert.match(c.Q.card(row),/혼자서는 무리일 것 같다/);
 for(const [chapter,key]of Object.entries(c.J.chapters)){
  if(key==='parents_work')continue;
  const html=c.Q.card({...row,chapterId:chapter});
  assert.doesNotMatch(html,/quest-margin-aside|quest-dalguji-doodle/);
 }
 c.S.party=['minji'];assert.doesNotMatch(c.Q.card(row),/혼자서는/);
 c.S.party=[];c.S.recruitQ={id:'minji'};assert.doesNotMatch(c.Q.card(row),/혼자서는/);
 assert.doesNotMatch(c.Q.card({...row,status:'completed'}),/quest-margin-aside|quest-dalguji-doodle/);
});
test('sparse companion milestones do not disclose the wrong witnessed record',()=>{
 const c=setup(),j=c.J.entry({kind:'companion',companion:'minji',steps:[{state:'upcoming'},{state:'done'}]});
 assert.equal(j.steps.length,1);assert.equal(j.steps[0].label,c.J.companionRecords.minji[1]);
});
test('delivery, express, letter, procurement, overdue and follow-up retain quantities and destinations',()=>{
 const c=setup(),r={id:'q',kind:'local',status:'active',title:'약속',expected:'고철 30개',steps:[]};
 for(const kind of ['deliver','express','letter']){
   c.S.quest={ledgerId:'q',kind,item:'의약품',from:'gimcheon',to:'muju',npc:'a',due:3};
   const j=c.J.entry(r);assert.match(j.next,/무주 터널/);assert.match(j.guide,/게시판/);assert.doesNotMatch(j.next,/30개/);
   if(kind==='deliver') assert.match(j.eyebrow,/배달/);
   c.S.at='muju';assert.match(c.J.entry(r).next,/도착했으니/);c.S.at='gimcheon';
 }
 c.S.quest={ledgerId:'q',kind:'procure',from:'gimcheon',to:'gimcheon',need:{name:'부품',qty:3},due:3};
 assert.match(c.J.entry(r).next,/1개.*2개/);c.S.items.부품=4;assert.match(c.J.entry(r).next,/다 모았다/);
 c.S.day=4;assert.match(c.J.entry(r).next,/약속한 날을 넘겨 버렸네/);
 c.S.questFollowup={...c.S.quest,noExpiry:true};c.S.quest=null;
 assert.match(c.J.entry({...r,status:'available'}).next,/계속 맡을지는 그때 정하자/);
 assert.doesNotMatch(c.J.entry({...r,status:'available'}).next,/날을 넘겨/);
});
test('every main retrospective needs its own confirmed evidence, including legacy histories',()=>{
 const c=setup();
 for(const [key,copy] of Object.entries(c.J.main)){
  const chapter=Object.keys(c.J.chapters).find(id=>c.J.chapters[id]===key)||key;
  const history={...row,id:`main_history_${chapter}_1_gimcheon`,kind:'completed',status:'completed',chapterId:undefined};
  c.G.departureSteps=()=>[];
  assert.equal(c.J.entry(history).next,'다음 단서로 넘어갈 때 따라갔던 기록.');
  c.G.departureSteps=()=>[{id:key,done:true}];
  const known=c.J.entry(history);assert.equal(known.next,copy[2]);assert.equal(known.expected,copy[2]);
  assert.equal(known.guide,'');assert.equal(known.aside,null);
 }
});
test('six completed companion summaries use the right witnessed story without mutating it',()=>{
 const c=setup(),notes=[];
 for(const id of Object.keys(c.D.comps)){
  const input={kind:'companion',id:`companion_${id}`,companion:id,status:'completed',steps:[0,1,2].map(n=>({id:`${id}_${n+1}`,state:'done'}))};
  const before=JSON.stringify(input),note=c.J.entry(input);
  assert.equal(note.next,c.J.companionRecords[id][2]);
  assert.equal(note.steps.length,3);
  note.steps.forEach((step,n)=>assert.equal(step.label,c.J.companionRecords[id][n]));
  assert.equal(JSON.stringify(input),before);notes.push(note.next);
 }
 assert.equal(new Set(notes).size,6);
});
test('local completion wording uses saved type, never guesses from titles or adds punctuality',()=>{
 const c=setup(),texts=[];
 for(const kind of ['deliver','delivery','express','procure','letter','unknown']){
  const saved={id:`completed_local_${kind}_gimcheon_muju_3`,kind:'completed',status:'completed',title:'같은 제목',expected:'고철 12개를 받았다.'};
  const before=JSON.stringify(saved),note=c.J.entry(saved);
  assert.equal(note.receipt,saved.expected);assert.equal(note.expected,note.next);
  assert.equal(JSON.stringify(saved),before);assert.equal(note.guide,'');
  assert.doesNotMatch(note.next,/고철|12개|제시간|보상/);texts.push(note.next);
 }
 assert.equal(texts[0],texts[1]);assert.equal(new Set(texts).size,5);
 const unknown=c.J.entry({id:'old_receipt',kind:'completed',title:'긴급 편지 배달',expected:'보관된 원문'});
 assert.match(unknown.next,/맡았던 일은 끝/);assert.equal(unknown.receipt,'보관된 원문');
});
test('quantity, arrival and overdue notes follow actual state rather than arbitrary voice variants',()=>{
 const c=setup(),r={id:'q',kind:'local',status:'active',steps:[]};
 c.S.quest={ledgerId:'q',kind:'procure',need:{name:'물',qty:3},from:'gimcheon',to:'gimcheon',due:3};
 assert.match(c.J.entry(r).next,/아직 챙긴 건 없다.*3개/);
 c.S.items.물=2;assert.match(c.J.entry(r).next,/2개.*1개/);
 c.S.items.물=4;assert.match(c.J.entry(r).next,/다 모았다/);assert.doesNotMatch(c.J.entry(r).next,/-1/);
 for(const kind of ['deliver','express','letter']){
  c.S.quest={ledgerId:'q',kind,item:'의약품',npc:'a',from:'gimcheon',to:'muju',due:3};
  c.S.day=1;c.S.at='gimcheon';assert.doesNotMatch(c.J.entry(r).next,/도착했으니/);
  c.S.at='muju';assert.match(c.J.entry(r).next,/도착했으니/);assert.doesNotMatch(c.J.entry(r).next,/도착하면|에 가면/);
  c.S.driving={from:'gimcheon',to:'muju'};assert.doesNotMatch(c.J.entry(r).next,/도착했으니/);c.S.driving=null;
  c.S.day=4;const late=c.J.entry(r);assert.match(late.next,/약속한 날을 넘겨.*전달은 마저/);assert.doesNotMatch(late.next,/너무 늦지는/);
  c.S.quest.noExpiry=true;assert.doesNotMatch(c.J.entry(r).next,/약속한 날을 넘겨/);
 }
});
test('journal rendering leaves canonical snapshots and save/notification comparison intact',()=>{
 const c=setup();vm.runInContext(fs.readFileSync('src/04f-engine-quests.js','utf8'),c);
 c.G.openingPending=()=>false;
 c.G.mainQuestEntry=()=>row;c.G.companionQuestEntries=()=>[];c.G.localQuestEntries=()=>[];
 c.G.questLedgerSync();const before=JSON.stringify(c.S);
 for(let i=0;i<4;i++) c.Q.card(c.G.mainQuestEntry());
 assert.equal(JSON.stringify(c.S),before);
 c.G.questLedgerSync();assert.equal(JSON.stringify(c.S),before);
 const restored=JSON.parse(JSON.stringify(c.S));c.S=restored;
 assert.equal(c.J.entry(row).title,'아빠와 엄마가 남긴 기록');
 assert.equal(c.S.at,'gimcheon');assert.equal(c.S.min,1312.632);assert.equal(c.S.questLedger.updates.length,0);
});
