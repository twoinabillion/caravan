'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {setup,pay,state,root}=require('./fixtures/qa-cycle55-story/setup.cjs');
const dir=path.join(__dirname,'fixtures/qa-cycle101-park-meal'),baseline=require('./fixtures/qa-cycle101-park-meal/baseline.json');
const raw=name=>fs.readFileSync(path.join(dir,name+'.json'),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const oldTitle='밥을 마저 먹는 사이',newTitle='조금 편해진 얼굴';
const oldBody='박 선생은 요즘 내가 밥을 끝까지 먹는다고 했다. 밤에 지나다닐 때도 조심하겠다고.';
const newBody='박 선생은 처음보다 어깨에 힘이 덜 들어간다고 했다. 밤에 지나다닐 때도 조심하겠다고.';
const revised=s=>s.replace('나는 식은 밥을 마저 먹었다.','나는 등받이에 몸을 기댔다.');
function open(name='entry',food){const h=setup();assert(h.run(`G.load(${JSON.stringify(raw(name))})`));if(food!==undefined)h.run(`S.food=${food}`);h.run("globalThis.e=event('talk_pss_15'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");return h;}
test('pre101 fixtures and actual100 source saves are immutable',()=>{
 for(const [file,hash]of Object.entries(require('./fixtures/qa-cycle101-park-meal/SHA256.json')))assert.equal(sha(fs.readFileSync(path.join(dir,file))),hash);
 for(const p of baseline.provenance)assert.equal(sha(fs.readFileSync(path.join(root,p.source))),p.sha256);
 const h=open(),actual=h.json("JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))"),expected=structuredClone(baseline.definition);
 const out=expected.choices[0].out[0];out.text=revised(out.text);out.fx.note.title=newTitle;out.fx.note.body=newBody;assert.deepEqual(actual,expected);
});
for(const food of[0,10])test(`new result with food${food} does not invent a current meal or change resource mechanics`,()=>{
 const h=open('entry',food),before=state(h),r=pay(h,0,0),after=state(h);assert(r.applied);assert.equal(r.text,revised(baseline.result.text));assert.match(r.text,/나는 등받이에 몸을 기댔다/);assert.doesNotMatch(r.text,/나는 식은 밥을 마저 먹었다/);
 assert.deepEqual(r.turns,baseline.result.turns.map(t=>({...t,text:revised(t.text)})));
 const expected=structuredClone(baseline.state);expected.food=food;const note=expected.notes.find(n=>n.title===oldTitle);assert(note);note.title=newTitle;assert.equal(note.body,oldBody);note.body=newBody;assert.deepEqual(after,expected);
 assert.equal(after.food,before.food);assert.equal(h.run('S.hunger'),1);assert.equal(h.run('S._breakfastDay'),13);
 assert.deepEqual(r.chips,baseline.result.chips.map(c=>({...c,t:c.t.replace(oldTitle,newTitle)})));
});
for(const name of['unseen','entry'])test(`old unpaid ${name} keeps entry and pays the corrected new outcome once`,()=>{
 const h=open(name),words=h.json('entry'),before=state(h),save=h.run('G.exportSave()');assert(h.run(`G.load(${JSON.stringify(save)})`));h.run("entry=qaEntry(e);info=qaInfo(e,'event',[],entry)");assert.deepEqual(h.json('entry'),words);assert.deepEqual(state(h),before);
 const r=pay(h,0,0);assert(r.applied);assert.equal(r.text,revised(baseline.result.text));const paid=state(h),receipt=h.json('S.pendingPresentation');assert(h.run(`G.load(${JSON.stringify(h.run('G.exportSave()'))})`));assert(!pay(h,0,0,false).applied);assert.deepEqual(state(h),paid);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
});
test('payment before first result frame freezes corrected words/note without repeat effects',()=>{
 const h=open();h.run('globalThis.first=G.resolvePresentedChoice(e,e.choices[0])');assert(h.run('first.ok&&first.applied'));const paid=state(h),receipt=h.json('S.pendingPresentation');assert(h.run(`G.load(${JSON.stringify(h.run('G.exportSave()'))})`));const r=pay(h,0,0,false);assert(!r.applied);assert.equal(r.text,revised(baseline.result.text));assert.deepEqual(state(h),paid);assert.deepEqual(h.json('S.pendingPresentation'),receipt);
});
for(const mode of['reader','view-only','text-only'])test(`old paid ${mode} preserves historical meal words, note and reward`,()=>{
 const saved=JSON.parse(raw('paid')),p=saved.pendingPresentation,oldNotes=structuredClone(saved.notes),view=p.reading?.view||p.view;
 if(mode==='view-only'){p.view=view;delete p.reading;}if(mode==='text-only'){delete p.reading;delete p.view;delete p.authoredView;}
 const h=setup();assert(h.run(`G.load(${JSON.stringify(JSON.stringify(saved))})`));h.run("globalThis.e=event('talk_pss_15'),entry=qaEntry(e),info=qaInfo(e,'event',[],entry)");const before=state(h),receipt=h.json('S.pendingPresentation'),r=pay(h,p.choiceIndex,p.outcomeIndex,false);
 assert(!r.applied);assert.equal(r.text,p.text);assert.match(r.text,/나는 식은 밥을 마저 먹었다/);assert.deepEqual(r.chips,p.chips);assert.deepEqual(h.json('S.notes'),oldNotes);assert.deepEqual(state(h),before);assert.deepEqual(h.json('S.pendingPresentation'),receipt);if(mode!=='text-only')assert.deepEqual(r.turns,view.turns);
});
