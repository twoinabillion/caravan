const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/07d-ui-quests.js','utf8');
function setup(){
 const ledger={tracked:[],mainHistory:[]};
 const ctx=vm.createContext({document:{readyState:'loading',addEventListener(){}},S:{at:'gimcheon',min:1312.632},D:{nodes:{},comps:{}},G:{questActionPlan:()=>({label:'경로 보기'}),ensureQuestLedger:()=>ledger},UI:{}});
 vm.runInContext(source+';this.Q=QuestLedgerUI',ctx);
 return {Q:ctx.Q,ctx,ledger};
}
const main={id:'main_namsan',kind:'main',status:'active',eyebrow:'메인 스토리 · 2장',title:'부모님이 두 곳에서 이어 만든 절차를 찾는다',phase:'중부 기록망과 남산 유지선',next:'현재 가능한 다음 행동',expected:'아직 모르는 결말',why:'확인한 배경',steps:[{state:'done',label:'확인한 단서',detail:'기록 내용'},{state:'upcoming',label:'미래 스포일러'}]};
test('main card keeps real action and only known records; no future/reward leak',()=>{
 const {Q}=setup(),html=Q.card(main);
 assert.match(html,/data-quest-action="main_namsan" aria-label="경로 보기">경로 보기/);
 assert.match(html,/확인한 단서/);assert.match(html,/기록 내용/);
 assert.doesNotMatch(html,/미래 스포일러|아직 모르는 결말|data-quest-track/);
});
test('side tracking and completed results retain distinct contracts',()=>{
 const {Q}=setup();
 const side=Q.card({...main,id:'delivery',kind:'local',tracked:true,progress:{have:3,need:2,label:'3/2'}});
 assert.match(side,/data-quest-track="delivery">추적 해제/);
 assert.match(side,/width:100%/);assert.doesNotMatch(side,/아직 모르는 결말/);
 const complete=Q.card({...main,kind:'completed',status:'completed'});
 assert.match(complete,/아직 모르는 결말/);assert.doesNotMatch(complete,/data-quest-action|data-quest-track|quest-progress/);
});
test('text/attributes are escaped; duplicate recovery stays omitted',()=>{
 const {Q}=setup();const html=Q.card({...main,kind:'local',title:'<img onerror="bad">',id:'x" onclick="bad',recovery:main.next});
 assert.match(html,/&lt;img/);assert.match(html,/x&quot; onclick=&quot;bad/);
 assert.doesNotMatch(html,/class="quest-recovery"/);
});
test('unchanged HUD renders preserve cards, disclosure nodes and focus targets',()=>{
 const {Q,ctx}=setup();let writes=0;
 const list={querySelector:()=>null,set innerHTML(v){writes++;this.content=v}};
 const summary={},fallback={},buttons=['main','side','completed'].map(tab=>({dataset:{questTab:tab},classList:{toggle(){}},setAttribute(){}}));
 Q.root={querySelector:s=>s==='.quest-ledger-list'?list:s==='.quest-ledger-summary'?summary:fallback,querySelectorAll:()=>buttons};
 Q.syncAvailability=()=>false;Q.nativeGoalButton=()=>true;Q.isOpen=()=>true;Q.showUpdate=()=>{};
 ctx.G.questLedgerEntries=()=>[main];Q.render();Q.render();assert.equal(writes,1);
 assert.equal(summary.hidden,true);
 Q.tab='side';Q.render();assert.match(list.content,/아직 맡은 부탁은 없다/);assert.equal(writes,2);
 Q.render();assert.equal(writes,2);
 Q.tab='completed';Q.render();assert.match(list.content,/끝낸 일/);
});
test('tracked missions still sort first; only main history appears in main tab',()=>{
 const {Q,ctx,ledger}=setup();let content='';
 const summary={},list={querySelector:()=>null,set innerHTML(v){content=v}};
 Q.root={querySelector:s=>s==='.quest-ledger-list'?list:s==='.quest-ledger-summary'?summary:{},querySelectorAll:()=>[]};
 Q.syncAvailability=()=>false;Q.nativeGoalButton=()=>true;Q.isOpen=()=>true;Q.showUpdate=()=>{};
 ctx.G.questLedgerEntries=()=>[main,{...main,id:'a',kind:'local',title:'미추적',tracked:false}, {...main,id:'b',kind:'companion',title:'먼저 표시',tracked:true}];
 ledger.tracked=['b'];ledger.mainHistory=[{title:'이전 장',eyebrow:'메인 기록',phase:'완료'}];
 Q.tab='side';Q.render();assert.equal(summary.hidden,false);assert(content.indexOf('먼저 표시')<content.indexOf('미추적'));assert.doesNotMatch(content,/이전 장/);
 Q.tab='main';Q.render();assert.match(content,/이전 장/);assert.doesNotMatch(content,/미추적/);
});
test('presentation-only changes retain action, save, cancel and unread handlers',()=>{
 assert.match(source,/G\.questActionPlan\(actionButton\.dataset\.questAction\)/);
 assert.match(source,/UI\.openQuestAction\(action\)/);
 assert.match(source,/if\(result&&result\.ok\) this\.close\(false/);
 assert.match(source,/G\.clearQuestLedgerUpdates\(\);\s*G\.save\(\)/);
 assert.match(source,/event\.key==='Escape'&&this\.isOpen\(\)/);
 assert.match(source,/this\.returnFocus\.focus\(\)/);
 assert.doesNotMatch(source,/localStorage|G\.newGame|G\.travel\(/);
});
test('one bound paper-scroll owner, handwritten records and separate operational type',()=>{
 const css=fs.readFileSync('src/01b-quest-style.html','utf8');
 const all=fs.readFileSync('src/01-style.html','utf8');
 assert.match(css,/\.quest-notebook-cover\{grid-row:4;min-height:0/);
 assert.match(css,/\.quest-ledger-list\{height:100%;min-height:0;overflow:auto/);
 assert.doesNotMatch(all,/\.quest-ledger-list\s*[{>]/);
 assert.match(css,/\.quest-next,[^{]*\{[^}]*var\(--ql-hand\)/);
 assert.match(css,/\.quest-ledger-card h3,[^{]*\{[^}]*var\(--ql-hand\)/);
 assert.match(css,/\.quest-guide\{[^}]*var\(--sans\)/);
 assert.match(css,/html\.ui-large-text #quest-ledger/);
 assert.match(all,/__UI_JOURNAL_FONT__/);
 const build=fs.readFileSync('tools/build-html.mjs','utf8');
 assert.match(build,/CaravanJournalHand-Regular\.woff2/);
 assert.match(build,/const MAX_BYTES = 80_000_000/);
 assert.equal(fs.readFileSync('assets/fonts/CaravanJournalHand-Regular.woff2').subarray(0,4).toString(),'wOF2');
});
test('main action is reachable outside the paper, without duplicate buttons',()=>{
 const {Q,ctx}=setup();let paper='',toolContent='';
 const tools={set innerHTML(v){toolContent=v}},list={querySelectorAll:()=>[],set innerHTML(v){paper=v}};
 Q.root={querySelector:s=>s==='.quest-ledger-list'?list:s==='.quest-ledger-tools'?tools:{},querySelectorAll:()=>[]};
 Q.syncAvailability=()=>false;Q.nativeGoalButton=()=>true;Q.isOpen=()=>true;Q.showUpdate=()=>{};
 ctx.G.questLedgerEntries=()=>[main];Q.render();
 assert.doesNotMatch(paper,/data-quest-action/);assert.match(toolContent,/data-quest-action="main_namsan"/);
 Q.tab='side';Q.render();assert.match(toolContent,/길로 돌아가기/);
});
