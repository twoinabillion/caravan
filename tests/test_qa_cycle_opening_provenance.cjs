const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('../qa-artifacts/ten-persona-repairs-20261020/setup.cjs');
function opening(appeal){
 const h=setup();h.run("G.seedOverride=262101;G.newGame('onroad','상혁','interactive');globalThis.openingTrace=[];");
 for(let guard=0;guard<10;guard++){
  const e=h.json('G.openingPending()');assert(e);
  if(e.id==='opening_farewell')return h;
  const ids={opening_workshop:'pack_workshop',opening_bus_repair:'hose_bypass',opening_failed_appeal:appeal,opening_parents_module:'trace_diagram',opening_departure:'leave_key'};
  h.run(`globalThis.e=G.openingPending();globalThis.result=G.resolveOpeningChoice(e.id,${JSON.stringify(ids[e.id]||e.choices[0].id)});openingTrace.push({id:e.id,choice:result.choice?.id,text:result.out?.text,min:S.min});`);assert(h.run('result.ok'));
  h.run('G.save();G.load();G.continueOpening(e.id)');
 }
 throw Error('opening did not reach farewell');
}
for(const appeal of ['copy_receipt','record_names'])test(`real opening ${appeal} reaches farewell without inventing or relocating a copy`,()=>{
 const h=opening(appeal);assert.equal(h.run('G.openingDecision("opening_failed_appeal").choiceId'),appeal);
 const turns=h.json('G.openingPending().turns'),text=turns.map(t=>t.text).join('\n');assert.doesNotMatch(text,/도윤은.*사본.*올려/);
 assert.match(text,/도윤.*이송표/);const before=h.run('JSON.stringify([S.min,S.items,S.food,S.water,S.notes])');
 assert(h.run("G.resolveOpeningChoice('opening_farewell','begin_road').ok"));assert.equal(h.run('JSON.stringify([S.min,S.items,S.food,S.water,S.notes])'),before);
 h.run("G.save();G.load();G.continueOpening('opening_farewell')");assert(h.run('S.opening.completed'));
});
test('a previously captured farewell transcript and cursor remain frozen through reload',()=>{
 const h=opening('record_names');h.run("G.capturePresentationView({eventId:'opening_farewell',phase:'event',turns:[{kind:'narration',text:'도윤은 가족의 이송표 사본을 조수석 수첩 위에 올려놓았다.'},{kind:'dialogue',who:'me',text:'할아버지, 다녀올게.'}],index:1,sceneKeys:['intro-departure-conversation-v4']});G.save();G.load();globalThis.state={eventId:'opening_farewell',phase:'event'};G.restorePresentationView(state);");assert.equal(h.run('state.index'),1);assert.match(h.run('state.turns[0].text'),/사본/);assert.equal(h.run('state.turns[1].who'),'me');
});
test('farewell image accessibility text does not claim dawn after a longer morning opening',()=>{
 const h=opening('record_names');assert(h.run('S.min')>=540);const ui=fs.readFileSync('src/07-ui.js','utf8'),start=ui.indexOf('  function sceneFrameHtml('),end=ui.indexOf('\n  function ',start+4);
 h.run("globalThis.esc=s=>String(s);globalThis.sceneFormat=()=> 'place';");h.run(ui.slice(start,end));const html=h.run("sceneFrameHtml(['intro-departure-conversation-v4'],'부두의 작별')");assert.match(html,/<img/);assert.doesNotMatch(html,/새벽|일출/);
});
module.exports={opening};
