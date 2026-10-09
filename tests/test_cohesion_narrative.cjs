/* Run directly: node tests/test_cohesion_narrative.cjs. No generated build needed. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const root=path.resolve(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,'src',name),'utf8');
const context=vm.createContext({console,setTimeout:()=>0,clearTimeout:()=>{},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),rng:()=>0.5});
vm.runInContext(source('03-data.js')+'\nglobalThis.data=D;',context);
const D=context.data;
const event=id=>D.events.find(item=>item.id===id)||D.seoulStops.find(item=>item.id===id);
const json=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const gameplayHash=value=>crypto.createHash('sha256').update(JSON.stringify(value,(key,row)=>
  ['text','label','title','body','turns','readingRecord','turnSpeakers'].includes(key)?undefined:row)).digest('hex');
// Mechanics-only baselines from HEAD, independently compared to the working
// copy. Prose/register changes have separate speaker and reading assertions.
const choiceContracts={
  loc_mingyu:'10f5a225f39319870a8b652a83ca4fd9238e98155b83dceb1f01ac89893a39a8',
  pss_forgive:'4c0478bd21ef4d1d71cf6faa33585745d51dc76e0f5c2f2edb38ba11ae077de5',
  kw_base:'0f38c528e49175a632729406f22719dbe60c6f66456599f3b125bfa62b5f7436',
  leo_broadcast:'d2e9e7ef7d94a8dcb535a28002c8b4c7a4723a972d2e8f38919278a761b8536e',
  loc_jaeyi_cache:'538c1e1a3b776fd7d2024e9770f3a32f53689ae2767ef47852b595d77ec54478',
  es_backdoor:'e9ec44185c2ac32f4b10696164443c19bb3d271800a00442c3b2c3be269e5960',
  parents_father_last_log:'dc2bd8b34b27beb9f527b26273979a608864518977014ffcf9860df3c73b968f',
  parents_mother_reunion:'012ff6a3af21c83b8c6ae1b3ced5c50e8e5c57b06f2ec2a231b7acb072148bdb',
  main_transfer_testimony:'5aa292b66a6ba5798fe02cc064c4d24cfe2e58bd73186a79a9eb8689f357595a',
  main_command_ledger:'75cde25d80b4a52ca21f77e72e0f0abcec1a216c11bfc52cbbff8695c7db396c'
};

// A wrong authored role makes UI.storyTurns consume the quote as the wrong person.
// These literal routes cover every parsed quote in the six companion payoffs.
const payoffRoutes={
  loc_mingyu:{text:['mingyu'],out:[['mingyu','mingyu']]},
  pss_forgive:{text:[{who:'passer_man',name:'환자의 아들'}],out:[[
    {who:'passer_man',name:'환자의 아들'},{who:'passer_man',name:'환자의 아들'},
    {who:'passer_man',name:'환자의 아들'},{who:'passer_man',name:'환자의 아들'}]]},
  kw_base:{text:['kangwoo','me','kangwoo','kangwoo','kangwoo','kangwoo'],out:[[
    'kangwoo','kangwoo','kangwoo','kangwoo','me','kangwoo']]},
  leo_broadcast:{text:['leo','leo'],out:[[
    'leo','me','leo']]},
  loc_jaeyi_cache:{text:[{who:'record',kind:'record',name:'재이 아빠의 분필 글씨'}],out:[[
    'jaeyi','me','jaeyi','jaeyi',{who:'jaeyi',kind:'record',name:'재이의 분필 글씨'}]]},
  es_backdoor:{text:['eunsu'],out:[['me'],['me']]}
};
for(const [id,want] of Object.entries(payoffRoutes)){
  const actual=event(id);
  assert.deepEqual(json(actual.turnSpeakers),want.text,id+' opening quote roles');
  assert.deepEqual(json(actual.choices.map(choice=>choice.out.map(out=>out.turnSpeakers))),
    want.out.map(route=>[route]),id+' result quote roles');
  const projected={id,choices:json(actual.choices)};
  require('../tools/story-review-contract.cjs')([projected]);
  assert.equal(gameplayHash(projected.choices),choiceContracts[id],id+' branches and effects');
}

const intro=D.intro.find(page=>page.scene==='intro-cheollian-2026');
assert(intro.beats.length<=12,'the optional industrial history should be a short family conversation');
assert(intro.beats.some(turn=>turn.who==='player_child')&&intro.beats.some(turn=>turn.who==='grandfather'),
  'history stays in the child and grandfather viewpoint');
assert(typeof intro.readingRecord==='string'&&intro.readingRecord.includes('72시간')&&intro.readingRecord.includes('현장 봇'),
  'the complete historical lecture remains an optional record');
const introText=D.intro.map(page=>[page.text,...page.beats.map(turn=>turn.text)].join('\n')).join('\n');
assert(!/도윤[^\n]{0,80}(?:동생|유나[^\n]{0,20}동생)|열이 난 동생|품에 안긴 동생/.test(introText),
  '유나는 도윤의 누나로 stays consistent');
assert(introText.includes('유나 누나'));

for(const id of ['parents_father_last_log','parents_mother_reunion']){
  const item=event(id);
  assert.equal(item.readingRecord,item.text,id+' keeps the original prose');
  assert(Array.isArray(item.turns)&&item.turns.length>=4,id+' has explicit beat progression');
  for(const choice of item.choices){
    const out=choice.out[0], turns=out.turns({});
    assert.equal(out.readingRecord,out.text,id+' result keeps the original prose');
    assert(turns.length>=2,id+' result has explicit beats');
  }
  assert.equal(gameplayHash(item.choices),choiceContracts[id],id+' branches and effects');
}
assert(event('parents_father_last_log').turns.some(turn=>turn.kind==='record'&&turn.name==='남산 유지실 정비 기록'));
for(const choice of event('parents_mother_reunion').choices)
  assert(choice.out[0].turns({}).some(turn=>turn.who==='mother'),'mother owns her reunion line');

vm.runInContext(source('03j-camp-conversations.js'),context);
vm.runInContext(source('03k-main-evidence.js'),context);
const finaleContracts=new Map(['seoul_uplink_reveal','seoul_session_reset'].map(id=>{
  const item=event(id); return [id,{text:item.text,choices:item.choices,contract:JSON.stringify(item.choices)}];
}));

vm.runInContext(source('03m-finale-reading.js'),context);

const inspectionIds={
  main_transfer_testimony:['transfer-sunok','transfer-taemun','transfer-jia'],
  main_command_ledger:['command-family-order','command-human-check','command-uplink']
};
for(const [id,ids] of Object.entries(inspectionIds)){
  const item=event(id), inspection=item.inspection;
  assert.deepEqual(json(inspection.items.map(row=>row.id)),ids,id+' inspection ids');
  assert(inspection.title&&inspection.prompt&&inspection.items.every(row=>row.label&&row.text),id+' renderable inspection');
  assert(inspection.items.every(row=>!/<[^>]*>/.test(row.text)),id+' inspection is plain text');
  assert.equal(gameplayHash(item.choices),choiceContracts[id],id+' branches and effects');
}
const testimonyInspection=event('main_transfer_testimony').inspection;
assert(testimonyInspection.prompt.includes('고쳐 달라고 한'),
  'testimony inspection asks for corrections before the choice');
assert(testimonyInspection.items[0].text.includes('고쳐 달라고 했다'),
  'Sunok has requested a correction but has not completed it');
assert(!/(고쳤다|바로잡았다|덧썼다|서명했다)/.test(testimonyInspection.items.map(row=>row.text).join('\n')),
  'inspection does not reveal the completed correction/signature outcome');

const finaleState={flags:{core_transfer:true},party:['minji'],comps:{},stats:{km:430},day:8,notes:[],log:[],at:'seoul'};
for(const id of ['seoul_uplink_reveal','seoul_session_reset']){
  const item=event(id),before=JSON.stringify(finaleState),contract=finaleContracts.get(id);
  assert(item.turns(finaleState).length>0&&item.turns(finaleState).length<=6,id+' compact turns');
  const record=typeof contract.text==='function'?contract.text(finaleState):contract.text;
  assert.equal(item.readingRecord(finaleState),String(record).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,''),id+' original record');
  assert.strictEqual(item.text,contract.text,id+' gameplay text identity');
  assert.strictEqual(item.choices,contract.choices,id+' choice identity');
  assert.equal(JSON.stringify(item.choices),contract.contract,id+' effects unchanged');
  assert(item.choices[0].out[0].turns(finaleState).length<=4,id+' compact outcome');
  assert.equal(JSON.stringify(finaleState),before,id+' presentation is read-only');
}

context.S={party:['minji'],recruitQ:null,min:1210,campNight:0,day:4,at:'daegu',flags:{},comps:{minji:{}},
  lastCombatReport:{resultCode:'failure',objective:'보행기 전원을 안전하게 회수한다'},opening:null};
context.G={recruitApproach:()=>null,openingDecision:()=>null};
context.UI={modalOpen:()=>false,toast:()=>{},renderAll:()=>{}};
vm.runInContext(source('04e-engine-world.js'),context);
const failedState=JSON.stringify(context.S);
const failed=context.G.campContext('minji');
assert(failed.includes('해내지 못했다')&&!failed.includes('해냈다'),'failure is never remembered as success');
assert(!failed.includes('성공한 일처럼'),'failure recollection stays in the fiction');
assert.equal(JSON.stringify(context.S),failedState,'camp context generation is read-only');
context.S.lastCombatReport={resultCode:'success',objective:'보행기 전원을 안전하게 회수한다',
  keyMoment:'엄폐 이동 · 차단기 확보',costs:['연료 -2'],newInjuries:[]};
const success=context.G.campContext('minji');
assert(success.includes('하려던 일은 해냈다')&&success.includes('보행기'),'success keeps its concrete context');
assert(!success.includes('엄폐 이동 · 차단기 확보')&&!success.includes('연료 -2'),
  'mechanic labels and resource deltas stay out of the recollection');
assert(!success.includes('」을')&&!success.includes('」은'),'objective uses a fixed noun before its particle');
context.S.lastCombatReport={resultCode:'partial',objective:'중계기 전원을 끊는다',
  keyMoment:'우회 · 전원함 진입',costs:[],newInjuries:[]};
const partial=context.G.campContext('eunsu');
assert(partial.includes('다 끝내지는 못했다')&&partial.includes('중계기'),
  'partial result and its persisted moment remain distinct');
context.S.lastCombatReport={resultCode:'retreat',objective:'교량을 건넌다',
  keyMoment:'',costs:['차체 -4%'],newInjuries:[]};
const retreat=context.G.campContext('kangwoo');
assert(retreat.includes('끝내지 못한 채 물러났다')&&!retreat.includes('차체 -4%'),
  'retreat result and persisted cost remain distinct');
context.S.lastCombatReport={resultCode:'failure',objective:'길목을 확보한다',
  keyMoment:'',costs:[],newInjuries:[]};
const leoWithoutDog=context.G.campContext('leo');
assert(!/보리|개|짖/.test(leoWithoutDog),'camp context never invents a dog or its past action');
assert(!/상처|물통|사람 수|잃고 챙긴|신호/.test(leoWithoutDog),
  'camp context does not invent unsupported combat facts');
const frozen='그날 실패와 민지의 이야기를 이미 남겼다.';
context.S.party=['minji'];
context.S.campConversation={id:'camp_test_minji',night:0,cid:'minji',context:frozen,revisit:false,
  chapter:1,previousChoiceId:null,choiceId:null,chips:[],active:true};
context.S.campNight=0;
assert(context.G.campConversationEvent().text.startsWith(frozen),'persisted camp context stays frozen on reload');

console.log('Cohesion narrative PASS: payoff speakers, family beats, evidence inspections, camp context, compact finale, and untouched gameplay contracts.');
