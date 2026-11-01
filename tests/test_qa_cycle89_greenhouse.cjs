'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {setup,pay,state}=require('./fixtures/qa-cycle55-story/setup.cjs');
const definition=require('./fixtures/qa-cycle89-greenhouse/definition.json');
const newText='밀봉된 원두 두 봉. 여러 해 묵었지만— 커피는 커피다.\n\n원두는 밀봉된 채로 챙겼다. 다음 야영에서 나눠 마시기로 하고, 테이블 옆 의자에 잠깐 앉아 쉬었다. 유리 너머 잎이 흔들리는 동안 어깨에서 힘이 풀렸다.';
const newNote='온실 카페에서 밀봉 원두 두 봉을 챙겼다. 다음 야영에서 나눠 마시기로 하고 잠깐 앉아 쉬었다.';
for(const [ci,oi] of [[0,0],[0,1],[1,0]]){
 const old=require(`./fixtures/qa-cycle89-greenhouse/${ci}-${oi}.json`),changed=ci===0&&oi===0;
 test(`natural entry ${ci}.${oi} preserves effects and records only completed actions`,()=>{
  const h=setup();assert(h.run(`G.load(${JSON.stringify(old.entry)})`));h.run("globalThis.e=event('exp_greenhouse_cafe'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");
  const r=pay(h,ci,oi);assert(r.applied);assert.deepEqual(r.chips,old.result.chips);
  const expected=structuredClone(old.state);if(changed)expected.notes.find(n=>n.title==='여러 해 만의 커피').body=newNote;
  assert.deepEqual(state(h),expected);assert.equal(r.text,changed?newText:old.result.text);
  if(changed){assert.match(r.turns.map(t=>t.text).join('\n'),/다음 야영에서 나눠 마시기로/);assert.doesNotMatch(r.text,/커피가 내려졌다|다들 눈을 감고 마셨다/);}else assert.deepEqual(r.turns,old.result.turns);
  const save=h.run('G.exportSave()');assert(h.run(`G.load(${JSON.stringify(save)})`));const before=state(h);assert.equal(pay(h,ci,oi).applied,false);assert.deepEqual(state(h),before);
 });
 for(const kind of ['reader','text-only'])test(`old paid ${ci}.${oi} ${kind} preserves original words, receipt and notes`,()=>{
  const saved=JSON.parse(old.paid);if(kind==='text-only'){delete saved.pendingPresentation.view;delete saved.pendingPresentation.reading;delete saved.pendingPresentation.authoredView;}
  const h=setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));const before=state(h),receipt=h.json('S.pendingPresentation');
  h.run(`globalThis.e=event('exp_greenhouse_cafe'),r=G.resolvePresentedChoice(e,e.choices[${ci}])`);
  assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),old.result.text);assert.deepEqual(h.json('r.chips'),old.legacyReplayChips);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
  if(kind==='reader')assert.deepEqual(h.json('r.out.turns'),old.result.turns);else assert(h.run('r.out.frozenTextOnly'));
  if(changed){assert.match(h.run('r.out.text'),/그날 야영에서/);assert.match(before.notes.find(n=>n.title==='여러 해 만의 커피').body,/마셨다/);}
 });
}
test('only coffee outcome text and its note body change',()=>{
 const h=setup(),now=h.json("JSON.parse(JSON.stringify(event('exp_greenhouse_cafe'),(k,v)=>typeof v==='function'?v.toString():v))"),expected=structuredClone(definition);
 expected.choices[0].out[0].text=newText;expected.choices[0].out[0].fx.note.body=newNote;assert.deepEqual(now,expected);
});
