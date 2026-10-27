const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../qa-artifacts/qa-cycle-20261026/cycle15/story/repair');
const {setup}=require(path.join(dir,'setup.cjs')),before=require(path.join(dir,'before.json'));
const plain=v=>JSON.parse(JSON.stringify(v));
test('Jaeyi first packing talk does not invent three days after immediate recruitment',()=>{
 const h=setup();h.run("S.party=['jaeyi'];S.day=1;globalThis.e=event('talk_jy_04')");
 assert.equal(h.run('prose(e.text)'), '재이의 전리품 자루가 터지기 직전이다. 짐칸을 정리하자는 얘기가 나왔다.\n\n"버리는 게 제일 어려워요, 이 직업은."');
});
test('all Eunsu recruitment paths retain autonomy without reviving deleted coordinates',()=>{
 for(const choice of ['burn','manual','decoy',undefined]){const h=setup();h.run(`S.recruitQ={id:'eunsu',stage:'ready',choice:${JSON.stringify(choice)||'undefined'}};globalThis.e=event('rq_eunsu_join');G.beginPresentation(e)`);const text=h.run('S.pendingPresentation.text');assert(text.startsWith('은수는 수신기를 오래 듣는다. 잡음이 오가지만, 무엇을 하라는 승인음은 오지 않는다.'));assert.equal(text.slice(text.indexOf('\n\n')),before.rq_eunsu_join.text.slice(before.rq_eunsu_join.text.indexOf('\n\n')));h.run('G.save();G.load()');assert.equal(h.run('S.pendingPresentation.text'),text);}
});
test('authentication chat asks and confirms now without assuming a previous conversation',()=>{
 const h=setup();const c=h.json("D.chats.find(c=>c.lines.some(l=>l[1].includes('민지 인증')))");assert.deepEqual(c.lines.slice(0,3),[['jaeyi','민지 씨, 이거 정품인지 봐 줄래요?'],['minji','응, 각인하고 이음새 보니까 맞아요.'],['jaeyi','그럼 장부에 올릴게요. …민지 씨 감정이면 최고 등급이라.']]);assert.deepEqual(c.lines.slice(3),before.chat.lines.slice(3));assert.deepEqual(c.need,before.chat.need);
});
test('two entry-only copy edits preserve every choice, effect and actual paid reader',()=>{
 for(const id of ['talk_jy_04','rq_eunsu_join']){const h=setup();const now=h.json(`event('${id}')`);now.text=before[id].text;assert.deepEqual(now,before[id]);
  for(let i=0;i<now.choices.length;i++){h.run(`S.party=['minji','jaeyi'];globalThis.e=event('${id}');G.beginPresentation(e);G.save();G.load();globalThis.entry=buildStoryTurns(S.pendingPresentation.text,e,{turnSpeakers:e.turnSpeakers});globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);globalThis.ts=buildStoryTurns(r.out.text,e,{knownSpeaker:!!entry.knownSpeaker,turnSpeakers:r.out.turnSpeakers})`);assert(h.run('r.ok&&r.applied'));assert.deepEqual(h.json('ts'),require(path.join(dir,id+'.'+i+'-reader.json')));h.run('S.pendingPresentation=null');}
 }
});
test('historical paid and text-only results preserve their reader and cannot pay twice',()=>{
 for(const [id,indices]of [['talk_jy_04',[0,1]],['rq_eunsu_join',[0]]])for(const i of indices)for(const textOnly of [false,true]){const save=require(path.join(dir,id+'.'+i+'-paid.json')),copy=plain(save);if(textOnly)delete copy.pendingPresentation.view;const h=setup();assert(h.run('G.load('+JSON.stringify(JSON.stringify(copy))+')'));const state=h.run('JSON.stringify([S.food,S.water,S.scrap,S.flags,S.notes,S.comps])');h.run(`globalThis.e=event('${id}');globalThis.r=G.resolvePresentedChoice(e,e.choices[${i}]);globalThis.ts=Array.isArray(r.out.turns)&&r.out.turns.length?r.out.turns:buildStoryTurns(r.out.text,e,{frozenTextOnly:!!r.out.frozenTextOnly,turnSpeakers:r.out.frozenTextOnly?[]:r.out.turnSpeakers})`);assert.equal(h.run('r.applied'),false);assert.deepEqual(h.json('ts'),require(path.join(dir,id+'.'+i+(textOnly?'-textonly.json':'-reader.json'))));assert.equal(h.run('JSON.stringify([S.food,S.water,S.scrap,S.flags,S.notes,S.comps])'),state);}
});
