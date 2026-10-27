'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {load,state,text}=require('./fixture.cjs'),baseline=require('./baseline.json'),delta=require('./copy-delta.json');
const draft=process.env.QA_HAN_SOURCE==='production'?'production':process.env.QA_HAN_DRAFT==='1';
for(const met of [false,true])for(const fixed of [false,true])test(`new entry explicitly locates the radio outside the van: met=${met} vehicleFixed=${fixed}`,()=>{
 const h=load({draft,fresh:true,met,fixed}),before=load({fresh:true,met,fixed});assert.match(text(h),/난간에 매달린 라디오/);assert.equal(h.run('!!S.flags.radio_fixed'),fixed);
 const expected=text(before).replace(met?delta.replacements[1].old:delta.replacements[0].old,met?delta.replacements[1].new:delta.replacements[0].new);assert.equal(text(h),expected);
 const voiced=h.json('qaNamed(entry)').filter(t=>t.kind==='radio');assert.equal(voiced.length,met?1:0);if(met){assert.equal(voiced[0].displayName,'우편부의 녹음');assert.match(voiced[0].text,/아직 임자를 못 찾았다고/);}
 const st=state(h),turns=h.json('qaNamed(entry)');h.run('G.capturePresentationView({eventId:e.id,phase:"event",turns:entry,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load()');assert.deepEqual(state(h),st);assert.deepEqual(h.json('qaNamed(qaEntry(e))'),turns);
});
test('accepted-letter branch still depends on postman_letter and keeps its exact recorded voice',()=>{
 for(const fixed of [false,true]){const h=load({draft,fresh:true,met:true,letter:true,fixed});assert.match(text(h),/난간에 매달린 라디오/);assert.match(text(h),/그쪽이 들고 갔다고/);assert(!text(h).includes('아직 임자를'));}
});
for(const ci of [0,1,2,3])test(`choice${ci}: current result keeps numeric effects, note/flag contract and independent reader routes`,()=>{
 const h=load({draft,fresh:true,letter:ci===0}),old=load({fresh:true,letter:ci===0});for(const env of [h,old]){env.run(`globalThis.c=e.choices[${ci}];globalThis.r=G.resolvePresentedChoice(e,c)`);assert(env.run('r.ok&&r.applied'));}
 assert.deepEqual(state(h),state(old));assert.deepEqual(h.json('r.chips'),old.json('r.chips'));
 const actual=h.json('qaNamed(qaResult(e,c,r.out,{knownSpeaker:entry.knownSpeaker}))'),expected=old.json('qaNamed(qaResult(e,c,r.out,{knownSpeaker:entry.knownSpeaker}))').map(t=>({...t,text:ci===0?t.text.replace(delta.replacements[2].old,delta.replacements[2].new):t.text}));assert.deepEqual(actual,expected);
 const paid=state(h);h.run('globalThis.turns=qaResult(e,c,r.out,{knownSpeaker:entry.knownSpeaker});G.capturePresentationView({eventId:e.id,phase:"outcome",turns,knownSpeaker:!!entry.knownSpeaker,index:0});G.save();G.load();globalThis.again=G.resolvePresentedChoice(e,c)');assert.equal(h.run('again.applied'),false);assert.deepEqual(state(h),paid);assert.deepEqual(h.json('qaNamed(qaResult(e,c,again.out))'),actual);
});
test('the normal old unpaid export stays frozen; it is not counted as a newly worded entry',()=>{
 const h=load({draft}),old=load();assert.deepEqual(h.json('qaNamed(entry)'),old.json('qaNamed(entry)'));assert(!text(h).includes('난간에 매달린 라디오'));const before=state(h);h.run('G.save();G.load()');assert.deepEqual(state(h),before);
});
test('all four frozen paid and text-only receipts retain old wording/readers without repayment',()=>{
 for(const row of baseline.legacy)for(const textOnly of [false,true]){const raw=JSON.parse(fs.readFileSync(__dirname+'/'+row.file));if(textOnly){delete raw.pendingPresentation.view;delete raw.pendingPresentation.reading;delete raw.pendingPresentation.authoredView;}const h=load({draft,raw:JSON.stringify(raw)}),before=state(h);h.run(`globalThis.c=e.choices[${row.choice}];globalThis.r=G.resolvePresentedChoice(e,c)`);assert.equal(h.run('r.applied'),false);assert.equal(h.run('r.out.text'),row.text);assert.deepEqual(state(h),before);assert.deepEqual(h.json('qaNamed(qaResult(e,c,r.out))'),textOnly?row.textOnly:row.turns);if(textOnly)assert(h.run('r.out.frozenTextOnly'));}
});
test('only three exact narrator strings change; every gate/index/effect and speech quote remains identical',()=>{
 const h=load({draft,fresh:true}),old=load({fresh:true}),expr="JSON.parse(JSON.stringify(e,(k,v)=>typeof v==='function'?v.toString():v))",now=h.json(expr),expected=old.json(expr);for(const r of delta.replacements)expected.text=expected.text.replace(r.old,r.new);expected.choices[0].out[0].text=expected.choices[0].out[0].text.replace(delta.replacements[2].old,delta.replacements[2].new);assert.deepEqual(now,expected);
});
