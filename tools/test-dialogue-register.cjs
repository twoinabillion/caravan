/* Authored text/voice contracts only; these checks are not screen or acting QA. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {STATIC_CONTENT_FILES,permanentEvents}=require('./content-registry.cjs');
const {archaicHumanRegister,hasInformalSentence,inspectAdultPlayerRegister}=require('./dialogue-register.cjs');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function setup(){
  const ctx=vm.createContext({console});
  for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
  return vm.runInContext('D',ctx);
}
const D=setup(),events=permanentEvents(D);
const event=id=>events.find(e=>e.id===id);
const quotes=t=>[...String(typeof t==='function'?t.toString():t||'').matchAll(/["“]([^"”\n]{2,})["”]/g)].length;
const turns=t=>typeof t==='function'?'dynamic':(t||[]).map(t=>({kind:t.kind,who:t.who}));

test('modernization preserves all 1039 event gates, costs, effects and chains',()=>{
  const omit=new Set(['text','body','title','label','turnSpeakers','turns','readingRecord','note','missionBrief']);
  const rows=events.map(e=>JSON.parse(JSON.stringify(e,(k,v)=>omit.has(k)?undefined:v)))
    .sort((a,b)=>a.id.localeCompare(b.id));
  assert.equal(rows.length,1039);
  require('./story-review-contract.cjs')(rows);
  assert.equal(hash(rows),'df40ae877d70b811a8079d3845132af9964ddb78e5e63660c48df06197ecf2a4');
});
test('quote roles retain the pre-edit corpus except the explicitly reviewed continuity fixes',()=>{
  const rows=events.map(e=>({id:e.id,q:quotes(e.text),speakers:e.turnSpeakers,turns:turns(e.turns),
    choices:(e.choices||[]).map(c=>({q:quotes(c.label),out:(c.out||[]).map(o=>({
      q:quotes(o.text),speakers:o.turnSpeakers,turns:turns(o.turns)}))}))}))
    .sort((a,b)=>a.id.localeCompare(b.id));
  // The upper-network reveal uses terminal records, not a sleeping core's
  // speech. Northern replacement prose owns its turns; untouched quotations
  // retain the original parser/role mapping. Check every exception before
  // projecting it onto the legacy hash, keeping all other events protected.
  for(const [id,beforeQ,beforeOut] of [
    ['seed_harvest',1,[3,1]],['seed_return',4,[2,2]],
    ['exp_coffee',1,[0]],['vanowner_coffee',2,[3]]]){
    const row=rows.find(row=>row.id===id);
    const expected={seed_harvest:[],seed_return:['passer_woman','me','passer_woman'],
      exp_coffee:[],vanowner_coffee:['passer_elder','passer_elder']}[id];
    assert.deepEqual(Array.from(row.speakers,s=>typeof s==='string'?s:s.who),expected);
    assert.equal(row.q,expected.length);row.q=beforeQ;row.speakers=undefined;
    for(const [i,c] of row.choices.entries())for(const out of c.out){
      const route=event(id).choices[i].out[0].turnSpeakers;
      assert.equal(out.q,id==='vanowner_coffee'?0:route.length);
      out.q=beforeOut[i];out.speakers=undefined;
    }
  }
  const price=rows.find(row=>row.id==='jaeyi_pricetag');
  assert.deepEqual(Array.from(price.speakers),['jaeyi','me','jaeyi','me']);
  assert.equal(price.q,4);price.speakers=undefined;
  assert.equal(price.choices[0].out[0].q,0);
  assert.deepEqual(Array.from(price.choices[0].out[0].speakers),['jaeyi','me','jaeyi','jaeyi','jaeyi']);
  price.choices[0].out[0].q=5;price.choices[0].out[0].speakers=undefined;
  const tag=rows.find(row=>row.id==='kangwoo_dogtag').choices[0].out[0];
  assert.equal(tag.q,0);
  assert.deepEqual(Array.from(tag.speakers),['kangwoo','kangwoo','me','kangwoo','kangwoo','kangwoo','me','kangwoo','me']);
  tag.q=9;tag.speakers=undefined;
  const lastshift=rows.find(row=>row.id==='eunsu_lastshift');
  assert.equal(lastshift.q,2);assert.deepEqual(Array.from(lastshift.speakers),['eunsu','eunsu']);
  assert.equal(lastshift.choices[0].out[0].q,6);
  assert.deepEqual(Array.from(lastshift.choices[0].out[0].speakers),['eunsu','me','eunsu','eunsu','eunsu','eunsu']);
  lastshift.speakers=undefined;lastshift.choices[0].out[0].speakers=undefined;
  const bag=rows.find(row=>row.id==='parkss_bag');
  assert.equal(bag.choices[1].q,0);
  assert.equal(event('parkss_bag').choices[1].label,'가방 이름표 이야기를 꺼낸다');
  bag.choices[1].q=1; // neutral prompt works before and after the reunion
  for(const [index,count] of [5,6].entries()){
    assert.equal(bag.choices[index].out[0].q,0);bag.choices[index].out[0].q=count;
  }
  const worldcup=rows.find(row=>row.id==='trace_worldcup_reply');
  for(const owner of [worldcup,worldcup.choices[0].out[0]]){
    assert.equal(owner.q,1);
    assert.deepEqual(JSON.parse(JSON.stringify(owner.speakers)),[{who:'passer_elder',name:'장터의 노인'}]);
    owner.speakers=undefined;
  }
  for(const [id,name] of [['world_resistance_supply_resentment','마을 주민'],
    ['world_tianyan_supporter_clinic','진료소장']]){
    const row=rows.find(row=>row.id===id);
    assert.equal(row.q,1);
    assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),[{who:'passer_man',name}]);
    row.speakers=undefined;
  }
  const reactionRoutes={minji:2,parkss:1,kangwoo:2,leo:2,jaeyi:2,eunsu:2};
  for(const [id,count] of Object.entries(reactionRoutes)){
    const row=rows.find(row=>row.id==='react_resist_'+id);
    assert.equal(row.q,count);assert.deepEqual(Array.from(row.speakers),Array(count).fill(id));
    row.speakers=undefined;
    for(const c of row.choices)for(const out of c.out)if(out.speakers){
      assert.deepEqual(Array.from(out.speakers),Array(out.q).fill(id));out.speakers=undefined;
    }
  }
  const photo=rows.find(row=>row.id==='jy_photo').choices[0].out[0];
  assert.equal(photo.q,0);photo.q=4; // dynamic variant verified through the real reader
  for(const id of ['jy_photo','leo_father_song','ev_eunsu_past','ev_jaeyi_solo','ev_eunsu_solo']){
    const row=rows.find(row=>row.id===id);
    assert.equal(row.speakers.length,row.q);
    for(const c of row.choices)for(const out of c.out){
      assert.equal(out.speakers.length,out.q);out.speakers=undefined;
    }
    row.speakers=undefined;
  }
  const broadcast=rows.find(row=>row.id==='leo_broadcast').choices[0].out[0];
  assert.equal(broadcast.q,3);assert.deepEqual(Array.from(broadcast.speakers),['leo','me','leo']);
  broadcast.q=4;broadcast.speakers=['leo','me','leo',{who:'record',kind:'record',name:'벽의 낙서'}];
  const reveal=rows.find(row=>row.id==='seoul_uplink_reveal');
  assert.equal(reveal.q,0);assert.deepEqual(Array.from(reveal.speakers),[]);
  assert.equal(reveal.choices[0].out[0].q,0);
  reveal.q=3;reveal.speakers=['me'];reveal.choices[0].out[0].q=2;
  for(const id of ['main_recovery_onboarding_first_road','main_recovery_story_personal_cache']){
    const row=rows.find(row=>row.id===id);
    for(const c of row.choices)for(const out of c.out){
      assert.equal(out.turns,'dynamic');assert.equal(out.q,0);out.turns=[];
    }
  }
  const video=rows.find(row=>row.id==='main_recovery_story_family_principle');
  assert.equal(video.q,12);assert.deepEqual(Array.from(video.speakers),
    ['father','mother','father','mother','father','mother','father','mother','father','mother','father','mother']);
  assert.deepEqual(video.turns,[]);
  video.speakers=undefined;
  video.turns=event(video.id).text.split('\n\n').map(()=>({kind:'narration',who:undefined}));
  const father=rows.find(row=>row.id==='parents_father_last_log');
  assert.equal(father.turns.length,7);
  assert.match(event(father.id).turns[0].text,/엄마.*화물차.*빠져나왔다/);
  father.turns.shift(); // reviewed extra escape beat; all other roles stay fixed
  assert.match(event(father.id).turns[3].text,/잠시 멎었지만.*코어는 남아 있었다/);
  father.turns.splice(2,1); // temporary line interruption is not control of the core
  const fatherCopy=rows.find(row=>row.id==='main_recovery_parents_father_last_log');
  assert.equal(fatherCopy.turns.length,3);
  assert.match(event(fatherCopy.id).turns[1].text,/화물차.*빠져나왔다/);
  fatherCopy.turns.splice(1,1); // the old single paragraph is now two causal beats
  const watch=rows.find(row=>row.id==='seoul_decision').choices[2].out[0];
  // The old function had two alternative second quotes (Eunsu / an unearned
  // Ghost contact). The supported outcome now consistently gives it to me.
  assert.equal(watch.q,4);assert.deepEqual(Array.from(watch.speakers),['me','me']);
  assert.equal(watch.turns,'dynamic');watch.q=5;
  // Naturalness pass keeps quote counts, but confirms consecutive lines that
  // the old alternating fallback attributed to the player. Assert each route
  // before projecting ONLY its new attribution onto the old corpus baseline.
  const naturalRoutes={
    comp_sick:{text:[],out:[['me'],['parkss'],[]]},
    comp_pss_night:{text:['parkss','me','parkss','parkss'],out:[['parkss','parkss','parkss'],['parkss','parkss']]},
    talk_pss_11:{text:['parkss','me','parkss'],out:[['parkss','me','parkss','parkss']]},
    pair_pss_leo_1:{text:['parkss','leo','parkss','leo','parkss'],out:[['leo','parkss','leo','leo','parkss','leo','parkss']]},
    pair_kw_leo_1:{text:['leo','kangwoo','leo','kangwoo','leo','kangwoo'],out:[['kangwoo','kangwoo','leo','kangwoo','leo','kangwoo','kangwoo']]},
    talk_leo_12:{text:[],out:[[{who:'record',kind:'record',name:'레오의 필담'}]]},
    talk_leo_15:{text:['leo'],out:[['leo']]},
    talk_jy_01:{text:['jaeyi','jaeyi'],out:[['me','jaeyi','jaeyi','me','jaeyi'],['jaeyi','jaeyi']]},
    talk_jy_04:{text:['jaeyi'],out:[['jaeyi','jaeyi','jaeyi','jaeyi'],['jaeyi']]},
    talk_jy_05:{text:['jaeyi','jaeyi'],out:[['jaeyi','jaeyi','jaeyi'],['jaeyi','jaeyi']]},
    talk_mj_11:{text:['minji'],out:[['minji','me','minji','minji']]},
    talk_mj_13:{text:['minji'],out:[['minji','minji','minji']]},
    talk_leo_19:{text:['leo','me','leo'],out:[['leo','me','leo','me'],['leo','me','leo']]},
    talk_pss_15:{text:['parkss','parkss'],out:[['parkss','parkss','parkss','me','parkss']]}
  };
  for(const [id,route] of Object.entries(naturalRoutes)){
    const row=rows.find(row=>row.id===id);
    assert.equal(row.q,route.text.length,id+' entry');
    assert.deepEqual(Array.from(row.speakers),route.text);row.speakers=undefined;
    assert.equal(row.choices.length,route.out.length,id+' choices');
    for(const [i,c] of row.choices.entries()){
      assert.equal(c.out.length,1,id+' outcomes');
      assert.equal(c.out[0].q,route.out[i].length,id+'.'+i);
      assert.deepEqual(JSON.parse(JSON.stringify(Array.from(c.out[0].speakers))),route.out[i]);c.out[0].speakers=undefined;
    }
  }
  // This pass confirms previously alternating voices, and resolves reunion
  // prose at presentation time. Do not replace the corpus baseline: validate
  // these precise exceptions, then project their old quote counts/roles only.
  const continuityRoutes={
    talk_mj_07:{out:[['minji','me','minji','minji','minji'],['minji']]},
    talk_es_07:{text:['eunsu'],out:[['eunsu','eunsu','eunsu']]},
    minji_toolbox:{text:[],out:[['minji','me','minji','minji','me','minji'],['minji','me','minji','minji']],dynamic:[0,1]},
    talk_mj_05:{text:['minji','minji'],out:[['me','minji','me','minji','minji'],['minji','minji']]},
    talk_mj_06:{text:[],out:[['minji','me','minji','minji'],['minji']],dynamic:[0]},
    talk_mj_08:{text:['me','minji'],out:[['minji','minji','me','minji','minji'],['minji']],dynamic:[0]},
    talk_mj_10:{text:['minji'],out:[['minji','me','minji','minji'],['minji']],dynamic:[0]},
    talk_pss_01:{text:['parkss'],out:[['parkss','me','parkss','parkss','parkss'],['parkss','me','parkss','parkss']]},
    talk_pss_02:{text:['parkss'],out:[['me','parkss','parkss'],['parkss','parkss']]},
    talk_es_09:{text:['eunsu','eunsu'],out:[['eunsu','eunsu','eunsu','me','eunsu']]},
    pair_mj_leo_2:{text:['leo'],out:[['minji','leo','minji','leo','minji']],dynamic:[0]},
    talk_leo_09:{text:['leo','leo'],out:[['leo','leo','me','leo','me','leo']]},
    talk_jy_09:{text:['jaeyi'],out:[['jaeyi','me','jaeyi','jaeyi']],dynamic:[0]}
  };
  for(const [id,route] of Object.entries(continuityRoutes)){
    const row=rows.find(row=>row.id===id);
    if(route.text){
      assert.equal(row.q,route.text.length,id+' entry');
      if(route.text.length){assert.deepEqual(Array.from(row.speakers),route.text);row.speakers=undefined;}
    }
    assert.equal(row.choices.length,route.out.length,id+' choices');
    for(const [i,c] of row.choices.entries()){
      assert.equal(c.out.length,1,id+' outcomes');
      assert.equal(c.out[0].q,route.dynamic?.includes(i)?0:route.out[i].length,id+'.'+i);
      assert.deepEqual(Array.from(c.out[0].speakers),route.out[i]);
      c.out[0].q=route.out[i].length;c.out[0].speakers=undefined;
    }
  }
  const nicknames=rows.find(row=>row.id==='talk_leo_02').choices[1].out[0];
  assert.equal(nicknames.q,0);assert.deepEqual(Array.from(nicknames.speakers),['leo']);
  nicknames.q=1; // existing Leo attribution is unchanged
  const signal=rows.find(row=>row.id==='comp_minji_radio');
  assert.equal(signal.q,0);assert.deepEqual(Array.from(signal.speakers),['minji']);
  signal.q=1;signal.speakers=undefined;
  for(const [index,route] of [['minji','me','minji','minji'],['minji']].entries()){
    const out=signal.choices[0].out[index];
    assert.equal(out.q,0);assert.deepEqual(Array.from(out.speakers),route);
    out.q=route.length;out.speakers=undefined;
  }
  assert.equal(hash(rows),'22a519e6302b890440e973e137b597b140365ab5cb7902abd3253bf194478595');
});
test('the register guard catches archaic humans, not dialects, nouns or formal reports',()=>{
  for(const text of ['누가 했소?','좋소.','내가 하겠소.','손대지 마시오.','구역이오.','그릇 사러 왔소?',
    '걷다 보면 나옵디다.','이상한 걸 물어봅디다.','차도 살아난답디다.','언젠가 얘기해줌세.'])
    assert(archaicHumanRegister.test(text),text);
  for(const text of ['레오. 장소는 진료소. 라디오도 켜.','어서 오이소! 마이 무으이소.',
    '자네, 이리 주게. 물은 마셨나?','…들어가십시오. 등은 제가 봅니다.',
    '안전 운행하십시오.','대장, 후방 확인.','확인한 건 없어요. 다시 들을게요.'])
    assert(!archaicHumanRegister.test(text),text);
});
test('age does not flatten personality or change companion address contracts',()=>{
  const v=D.companionVoices;
  assert.equal(v.minji.addresses.daonRegister,'반말');
  assert.equal(v.kangwoo.addresses.daonRegister,'반말');
  for(const id of ['leo','jaeyi','eunsu'])assert.equal(v[id].addresses.daonRegister,'해요체');
  assert.equal(v.parkss.addresses.daonRegister,'편한 반말·하게체');
  assert.match(D.campConversations.minji.line,/대장님.*들어 봐/);
  assert.match(D.campConversations.parkss.line,/자네.*주게/);
  assert.match(D.campConversations.kangwoo.line,/서연.*조용하네/);
  assert.match(D.campConversations.leo.line,/공연.*휴관/);
  assert.match(D.campConversations.jaeyi.line,/상자.*부품/);
  assert.match(D.campConversations.eunsu.line,/확신이 안 서요/);
  // Minji's first meeting remains polite; only the actual companion switches.
  assert.match(event('meet_scrapyard').text,/해봐요/);
  assert.match(event('comp_engine_sound').text,/들려\?/);
  assert.doesNotMatch(event('comp_engine_sound').text,/들려요|끊어져요/);
});
test('confirmed-pair banter respects its actual addressee',()=>{
  const lines=D.banter;
  assert(lines.some(x=>x.who==='minji'&&/은수 언니.*줘 봐요/.test(x.t)));
  assert(lines.some(x=>x.who==='minji'&&/레오 코.*점검해야겠어/.test(x.t)));
  assert(lines.some(x=>x.who==='kangwoo'&&/선생님.*못 보셨습니까/.test(x.t)));
  assert(lines.some(x=>x.who==='jaeyi'&&/주인은 여전히 대장님/.test(x.t)));
  for(const line of lines.filter(x=>x.who==='minji'))assert.doesNotMatch(line.t,/레오 씨/);
});
test('salvage decision ends on the guard’s actual words, not a detached attribution',()=>{
  const e=event('salvage_claim');
  assert.match(e.text,/언제부터 여기가 구역이었는데요\?/);
  assert.match(e.text,/남자는 웃지 않았다\. "규칙 없으면 다 뺏기니까\. 규칙 만들면 우리가 뺏고\."$/);
  assert.deepEqual(JSON.parse(JSON.stringify(e.choices.map(c=>c.req||null))),[{scrap:10},null,null]);
});
test('short road moments obey the same addressee register as the full conversations',()=>{
  for(const prefix of ['minji','kangwoo']){
    const e=event(`road_checkin_${prefix}_ridge_minji_kangwoo`);
    assert.match(e.turns.find(t=>t.who==='minji').text,/달라졌어요.*어때요/);
  }
  for(const prefix of ['minji','jaeyi']){
    const e=event(`road_checkin_${prefix}_market_minji_jaeyi`);
    assert.match(e.turns.find(t=>t.who==='minji').text,/것 같아요/);
    assert.match(e.turns.find(t=>t.who==='jaeyi').text,/걸까요/);
    assert.match(e.choices[0].out[0].turns.find(t=>t.who==='jaeyi').text,/거예요/);
  }
});
test('ordinary conversation keeps the agreed register without flattening purposeful formal speech',()=>{
  const chat=id=>D.chats.find(c=>c.id===id).lines;
  const parentKey=chat('thread-parent-key-minji').filter(([who])=>who==='me').map(([,t])=>t);
  assert.deepEqual(Array.from(parentKey),[
    '엄마 장치, 자꾸 열어 보고 싶어.','그래서 안 열고 있잖아.','그 정도로 못 믿을 사람은 아니야.'
  ]);
  assert.match(chat('daily-leo-eunsu-unfinished')[0][1],/끝부분은요/);
  assert.match(chat('daily-me-eunsu-offrecord')[7][1],/마음이 놓여요/);
  // A deliberately stiff objection is not a blanket -습니다 error.
  assert.match(chat('daily-kangwoo-eunsu-orders')[1][1],/명령입니까/);
  assert.match(chat('daily-me-leo-blanket')[3][1],/협상이 필요해요/);
});
test('generated request text is modern without losing the concrete offer',()=>{
  const source=fs.readFileSync('src/04e-engine-world.js','utf8');
  const start=source.indexOf('G.questDesc = (q)=>{'),end=source.indexOf('\nG.rollQuests',start);
  const G={};new Function('D','G',source.slice(start,end))(D,G);
  const base={to:'miryang',item:'약 상자',reward:7,need:{name:'퓨즈',qty:3},npc:'geumja'};
  for(const kind of ['deliver','express','procure','letter']){
    const text=G.questDesc({...base,kind});
    if(kind!=='procure')assert(text.includes(D.nodes.miryang.name));
    assert(!archaicHumanRegister.test(text),text);
    if(kind!=='letter')assert(text.includes('고철 7'));
  }
  assert.match(G.questDesc({...base,kind:'express'}),/이틀 안에/);
  assert.match(G.questDesc({...base,kind:'procure'}),/퓨즈 3개.*다시 오시면/);
  assert.equal(G.questDesc({...base,story:{prompt:'내일 다시 와요.'}}),'"내일 다시 와요."');
});

test('adult companion choices, confirmed player results and daily lines obey the same register',()=>{
  assert.deepEqual(inspectAdultPlayerRegister(D),[]);
  assert.match(event('talk_leo_19').choices[0].label,/끝까지 불러줘요/);
  assert.match(event('talk_leo_19').choices[0].out[0].text,/레오 씨가 새로 쓰면 되잖아요/);
  assert.match(event('talk_es_16').choices[1].out[0].text,/왜 안 써요/);
  assert.match(event('talk_kw_05').choices[1].out[0].text,/내가 놓고 잊었군/);
  for(const flags of [{},{mingyu_reunion:true}])
    assert.match(event('talk_mj_10').choices[0].out[0].text({flags}),/대장님/);
  // Jaeyi quoting her father is not Jaeyi dropping her own honorifics.
  assert.match(event('talk_jy_12').text,/아빠/);
});
test('the adult gate detects regressions in quoted options, body, results and daily speech',()=>{
  const fixture={events:[{id:'fixture',needsComp:'leo',
    text:'"지금은 왜 안 써?"',turnSpeakers:['me'],
    choices:[{label:'"보여줘"',out:[{text:'"뒤가 생기면 들려줘."',turnSpeakers:['me']}]}]}],
    chats:[{id:'daily-fixture',need:{comp:'jaeyi'},lines:[['me','보고 계속해.']]}]};
  assert.deepEqual(inspectAdultPlayerRegister(fixture).map(x=>x.scope),[
    'fixture.text.0','fixture.choice.0','fixture.out.0.0.0','daily-fixture.0']);
});
test('the gate does not turn fragments, reporting, Minji or AI questions into polite rewrites',()=>{
  for(const line of ['감도 양호, 노스 스타.','강우 씨?','저도요.','같이 갑니까?',
    "기왕이면 '사운드 엔지니어'로 올려줘요. 엔진 소리도 사운드니까."])
    assert(!hasInformalSentence(line),line);
  const fixture={events:[event('es_backdoor'),{id:'minji-fixture',needsComp:'minji',
    text:'"부푼 건 빼 놨지?"',turnSpeakers:['me'],choices:[{label:'"들어 봐"'}]},
    {id:'pair-fixture',needsComp:'leo',needsComp2:'minji',choices:[{label:'"민지야, 들어 봐"'}]}]};
  assert.deepEqual(inspectAdultPlayerRegister(fixture),[]);
  // The AI exception is path-specific, not a blanket exemption for Eunsu.
  fixture.events[0]={...fixture.events[0],choices:[...fixture.events[0].choices,{label:'"은수 씨, 보여줘"'}]};
  assert.equal(inspectAdultPlayerRegister(fixture)[0].scope,'es_backdoor.choice.2');
});
test('paired Minji dialogue keeps elder honorifics and joined-player informality',()=>{
  assert.match(event('pair_mj_jy_1').choices[0].out[0].text,/손이 없으면 눈이 뭘 봐요/);
  assert.match(event('pair_mj_jy_2').choices[0].out[0].text,/지금 만들고 있잖아요, 언니/);
  assert.match(event('pair_mj_es_1').choices[0].out[0].text,/잡음이 커졌잖아요/);
  assert.match(event('pair_mj_pss_1').choices[0].out[0].fx.note.body,/약사 겸 정비사/);
  for(const flags of [{},{mingyu_reunion:true}])
    assert.match(event('comp_minji_radio').text({flags}),/신호 보내기로 했/);
  const reaction=event('react_resist_minji');
  assert.match(reaction.text,/대장님, 느려져도 이 칸은 없애자/);
  assert.doesNotMatch(reaction.text,/시작해요|없애죠/);
  assert.equal(reaction.choices[0].out[0].text,'민지는 짧게 “좋아” 하고 표를 접었다. 이번에는 웃지 않았다.');
  assert.match(reaction.choices[1].out[0].text,/써야 해\./);
});
test('wrench and unfinished-song replies still respond to the revised preceding line',()=>{
  const chat=id=>D.chats.find(c=>c.id===id).lines;
  const wrench=chat('daily-me-jaeyi-wrench');
  assert.match(wrench[0][1],/볼트도 뭉개지겠어요/);
  assert.equal(wrench[1][1],'그래도 그건 못 버려요.');
  assert.match(wrench[4][1],/공구 칸.*빼요.*집어 들/);
  assert.match(wrench[5][1],/어디다/);
  assert.match(wrench[6][1],/안쪽 칸.*쓸 공구랑 안 섞이게/);
  assert.match(chat('daily-leo-eunsu-unfinished')[7][1],/가사로 써도 돼요/);
  assert.equal(chat('daily-leo-eunsu-unfinished')[8][1],'제가 부르지만 않으면요.');
  assert.match(chat('daily-leo-jaeyi-pick')[3][1],/우리 형이/);
  // The inherited pick refers to the already-authored brother, not Kangwoo.
  assert.match(event('react_resist_leo').text,/내 형도 이송표/);
});
test('the mechanic checks a dangerous cell was removed instead of forgetting what swelling means',()=>{
  const result=event('ev_parking_evs').choices[1].out[0].text;
  assert.match(result,/부푼 건 빼 놨지\?/);
  assert.match(result,/터질 수 있으니까 뺐지/);
  assert.doesNotMatch(result,/부풀면 어떻게/);
});
test('a conditional adult dialogue is checked even when the event can occur without companions',()=>{
  assert.match(event('signal_bait').choices[1].out[0].text,/녹음이에요\?/);
  const fixture={events:[{id:'conditional',choices:[{req:{comp:'eunsu'},out:[
    {text:'"녹음이에요." "녹음이야?"',turnSpeakers:['eunsu','me']}]}]}]};
  assert.equal(inspectAdultPlayerRegister(fixture)[0].scope,'conditional.out.0.0.1');
  assert.doesNotMatch(D.npcs.noah.greet0,/아저씨들/);
});
test('adult-directed questions outside confirmed speaker arrays keep their established register',()=>{
  // These addressees are established by the adjacent scene, not turnSpeakers.
  const farewell=event('deserter_farewell');
  assert.match(farewell.text,/달구지요\?/);
  assert(!hasInformalSentence(farewell.choices[0].label));
  const result=event('seoul_ruins').choices.find(c=>c.req?.comp==='eunsu').out[0].text;
  const questions=[...result.matchAll(/"([^"\n]*\?)"/g)].map(m=>m[1]);
  assert.equal(questions.length,2);
  for(const question of questions)assert(!hasInformalSentence(question),question);
});
