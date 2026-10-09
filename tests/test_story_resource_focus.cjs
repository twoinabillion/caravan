// Real presentation helpers in a VM; these checks do not claim visual QA.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/07-ui.js','utf8');
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const keys={부품:'parts',고철:'scrap',연료:'fuel',물:'water',식량:'food',의약품:'meds',탄약:'ammo'};
function setup(){
 const ctx=vm.createContext({esc,stripTags:s=>s.replace(/<[^>]*>/g,''),
  D:{icons:Object.fromEntries(Object.values(keys).map(k=>[k,'/icons/'+k+'.png']))},
  speakerInfo:()=>({name:'',id:''}),speakerLaneKey:t=>t.who,
  G:{choiceReq:c=>c.req,reqVisible:()=>true,reqOk:req=>({ok:!req?.locked,t:'부품이 부족하다'}),
   reqCostText:req=>req?.cost||'',choiceForeseeable:c=>c.foreseeable||[],
   routeForecast:()=>({km:20,minutes:35,fuel:3,readiness:'출발 가능'}),durationLabel:n=>n+'분'}});
 vm.runInContext(fs.readFileSync('src/07h-story-pages.js','utf8'),ctx);
 for(const name of ['safeHtml','fmt','choiceActionLabel','storyResourceIcon','storyExpenseText','storyExpenseHtml','eventChoiceData',
  'storyElapsedChip','storyResourceChange','storyResourceHtml','storyNextStepHtml','storyOutcomeSummaryHtml','storyResultPageTurns','pagedStoryHtml']){
  const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+4);
  assert(start>=0&&end>start,name);vm.runInContext(source.slice(start,end),ctx);
 }
 return ctx;
}
test('all seven resource names reuse their own icon, while unknown resources keep text only',()=>{
 const c=setup();
 for(const [name,key] of Object.entries(keys)){
  assert(fs.existsSync('assets/icons/'+key+'.png'));
  const html=c.storyResourceHtml(c.storyResourceChange({t:name+' +2'}));
  assert(html.includes('/icons/'+key+'.png'));assert.match(html,/width="32" height="32" alt=""/);
  assert(html.includes(name));assert.match(html,/획득/);assert.match(html,/\+2/);
 }
 assert.equal(c.storyResourceChange({t:'호스 +1'}),null);
 assert.match(c.storyOutcomeSummaryHtml([{t:'호스 +1'}],[],{}),/호스 \+1/);
 assert.equal(c.storyResourceIcon('호스'),'');
 delete c.D.icons.parts;
 assert.doesNotMatch(c.storyResourceHtml(c.storyResourceChange({t:'부품 -1'})),/<img/);
});
test('signed actual deltas, units, zero capacity notes and unlimited-mode receipts retain their meaning',()=>{
 const c=setup(),cases=[
  ['부품 -1','−1','개','소모','loss'],['고철 +4','+4','','획득','gain'],
  ['연료 -2.5L','−2.5','L','소모','loss'],['물 0 · 적재 한도','0','','변화 없음','neutral'],
  ['탄약 −3발','−3','발','소모','loss'],['식량 ∞ · 테스트 소모 없음','∞','','소모 없음','neutral']
 ];
 for(const [text,amount,unit,label,tone] of cases){
  const chip={t:text},before=JSON.stringify(chip),row=c.storyResourceChange(chip);
  assert.equal(row.amount,amount);assert.equal(row.unit,unit);assert.equal(row.label,label);assert.equal(row.tone,tone);
  assert.equal(JSON.stringify(chip),before);
 }
 const html=c.storyResourceHtml(c.storyResourceChange({t:'물 +1 · 적재 한도 <script>x</script>'}));
 assert.match(html,/적재 한도 &lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
});
test('only duration-only metadata is hidden, never deadlines, narrative text or saved receipts',()=>{
 const c=setup();
 for(const text of ['20분 경과','1시간 경과','0.5시간 경과'])assert(c.storyElapsedChip({t:text}));
 for(const text of ['20분 뒤 문이 닫힌다','남은 시간 20분','20분 경과 후 다시 만나기'])assert(!c.storyElapsedChip({t:text}));
 assert.equal(c.storyExpenseText('부품 1개 · 시간 20분'),'부품 1개');
 assert.equal(c.storyExpenseText('시간 5분'),'');
 assert.equal(c.storyExpenseText('시간 1시간 · 물 2'),'물 2');
 assert.equal(c.storyExpenseText('마감까지 20분'),'마감까지 20분');
 const chips=[{t:'20분 경과'}],before=JSON.stringify(chips);
 assert.equal(c.storyOutcomeSummaryHtml(chips,[],{}).trim(),'');
 assert.equal(JSON.stringify(chips),before);
});
test('choice costs use 24px icons, preserve locks and routes, and leave combat metadata unchanged',()=>{
 const c=setup(),choice={label:'고친다',foreseeable:[{kind:'expense',label:'즉시',text:'부품 1개 · 시간 20분'},
  {kind:'lasting',label:'이후',text:'수리 기록이 남는다'}]},before=JSON.stringify(choice);
 const html=c.eventChoiceData({choices:[choice]}).html;
 assert.match(html,/width="24" height="24"/);assert.match(html,/소모 ·/);assert.match(html,/흔적 ·/);
 assert.doesNotMatch(html,/시간 20분/);assert.equal(JSON.stringify(choice),before);
 const combat=c.eventChoiceData({combat:{},choices:[choice]}).html;
 assert.match(combat,/즉시 · 부품 1개 · 시간 20분/);assert.doesNotMatch(combat,/story-resource-icon|흔적/);
 assert.match(c.eventChoiceData({choices:[{...choice,req:{locked:true}}]}).html,/disabled aria-disabled="true"/);
 const empty=c.eventChoiceData({choices:[{label:'기다린다',foreseeable:[{kind:'expense',text:'시간 5분'}]}]}).html;
 assert.doesNotMatch(empty,/choice-forecast|story-cost-item/);
 const route=c.eventChoiceData({id:'route_mid_fork',choices:[{label:'출발',out:[{fx:{routeChoice:'east'}}]}]}).html;
 assert.match(route,/20km · 35분 · 연료 약 3L/);
});
test('result and record views agree on resources without losing authored result text or next action',()=>{
 const c=setup(),state={turns:[{kind:'narration',text:'수리를 마쳤다.'}],readingPage:{cursor:{turn:0,offset:0}},
  resultChips:[{t:'20분 경과'},{t:'부품 -1'},{t:'물 +2'},{t:'차체 -4'},{t:'새 기록 · 버스 수리'}],
  questUpdates:[{kind:'main',title:'확인',next:'부두 단말에서 이송표를 확인한다.'}]};
 const before=JSON.stringify(state),rows=c.storyResultPageTurns(state),html=c.pagedStoryHtml(rows);
 assert.equal(rows.filter(r=>r.kind==='resource').length,2);
 assert(rows.filter(r=>r.kind==='resource').every(r=>r.atomic));
 for(const text of ['수리를 마쳤다.','부품','−1','물','+2','차체 -4','이송표를 확인한다.','남겨 둔 기록'])assert(html.includes(text));
 assert.doesNotMatch(html,/20분 경과/);assert.equal(JSON.stringify(state),before);
});
