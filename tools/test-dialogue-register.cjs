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
  // Cycle23: five approved copy fragments; quote counts/routes and mechanics do not change.
  const cycle23Copy=[{"id":"ev_eunsu_solo","path":["choices",1,"out",0,"text"],"value":"은수에게 무전 감청과 배급 관리를 맡겼다. 은수는 종이를 펴고 주파수 당번표와 배급표를 짰다. 줄이 자로 그은 듯 반듯했다.\n\n\"이런 건 제 전공이에요. …전공이라기보단 그냥 하던 일인데. 아무튼요.\"\n\n표를 적재함 벽에 붙이자 다들 자기 이름부터 찾았다. 물 당번이 누구냐던 질문에 은수가 표의 한 칸을 짚었다."},{"id":"comp_water_fight","path":["choices",1,"out",0,"text"],"value":"내 몫을 돌렸다. 잠시 침묵.\n\n그러자 하나둘 \"나도 반만\" \"나도\"— 남은 물은 나눠 마시기로 했다.\n\n목은 마른데 마음은 이상하게 든든하다."},{"id":"seoul_han","path":["text"],"isFunction":true,"value":"(S)=>{\n   const f=S.flags||{};\n   const voice=!f.postman_met\n     ? '다리 한복판, 난간에 매달린 라디오가 저 혼자 켜졌다. 잡음뿐이다. 누군가 여기까지 오고 멈췄다는 것만 알겠다.'\n     : '다리 한복판, 난간에 매달린 라디오가 켜졌다. 우편부의 목소리다(녹음이었다).\\n\\n\"생활차— 아니, 달구지 만나면 전해요. '\n       +(f.postman_letter?'남산행 편지, 그쪽이 들고 갔다고. ':'남산행 편지, 아직 임자를 못 찾았다고. ')\n       +'나는 여기까지밖에 못 갔어요. 나머지는 부탁해요.\"';\n   return '하나 남은 다리. 난간에 누가 매달아 둔 것들이 바람에 흔들린다— 리본, 신발 한 짝, 코팅한 사진들. 건너간 사람들이 남긴 표식이다.\\n\\n'+voice;\n }"},{"id":"seoul_han","path":["choices",0,"out",0,"text"],"value":"조수석 서랍의 편지를 꺼내 품에 옮겼다. 우편부의 여러 해가 이 손에서 마무리된다.\n\n\"끝까지 갈게요.\" 아무도 없는 다리에 대고 말했다. 난간의 라디오가 지직, 하고 꺼졌다. 대답처럼."}];
  for(const spec of cycle23Copy){
    let value=event(spec.id);for(const key of spec.path)value=value[key];
    assert.equal(spec.isFunction?value.toString():value,spec.value,spec.id+' exact cycle23 copy');
  }
  assert.equal(event('exp_oilmill').choices[0].out[0].text,'참기름 두 병. 액체 황금이다.\n\n다음 식사 때 통조림 비빔밥에 참기름 한 바퀴를 두를 생각에, 전원이 국적을 되찾은 표정을 지었다.');
  // Cycle22 systems: introduced mechanic and the young man at the market.
  for(const [ci,route] of [[0,['deokgu','deokgu','deokgu']],[1,['me',{who:'passer_man',name:'밀양 청년'},{who:'passer_man',name:'밀양 청년'},'me',{who:'passer_man',name:'밀양 청년'}]]]){
    const authored=event('npc_deokgu_2').choices[ci].out[0],row=rows.find(r=>r.id==='npc_deokgu_2').choices[ci].out[0];
    assert.deepEqual(JSON.parse(JSON.stringify(authored.turnSpeakers)),route,'exact Deokgu outcome roles');
    assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),route);row.speakers=undefined;
  }
  // Cycle22: independently reviewed librarian, Parkss and player voices.
  const cycle22Routes=[{"id":"loc_tunnelbook","path":["choices",0,"out",0,"turnSpeakers"],"route":[{"who":"passer_man","name":"터널의 사서"},"me",{"who":"passer_man","name":"터널의 사서"},{"who":"passer_man","name":"터널의 사서"},{"who":"passer_man","name":"터널의 사서"},{"who":"passer_man","name":"터널의 사서"}]},{"id":"loc_tunnelbook","path":["choices",1,"out",0,"turnSpeakers"],"route":[{"who":"passer_man","name":"터널의 사서"},"me",{"who":"passer_man","name":"터널의 사서"},{"who":"passer_man","name":"터널의 사서"}]},{"id":"loc_tunnelbook","path":["turnSpeakers"],"route":[{"who":"passer_man","name":"터널의 사서"}]},{"id":"ev_parkss_past","path":["choices",0,"out",0,"turnSpeakers"],"route":["me","parkss","me","parkss"]},{"id":"ev_parkss_past","path":["choices",1,"out",0,"turnSpeakers"],"route":["me","parkss","me","parkss"]},{"id":"ev_parkss_past","path":["choices",2,"out",0,"turnSpeakers"],"route":["parkss","me","parkss"]},{"id":"ev_parkss_past","path":["turnSpeakers"],"route":["parkss","parkss"]},{"id":"ev_atm_cash","path":["choices",0,"out",0,"turnSpeakers"],"route":["me"]}];
  for(const spec of cycle22Routes){
    let authored=event(spec.id),row=rows.find(r=>r.id===spec.id);
    for(const k of spec.path.slice(0,-1)){authored=authored[k];row=row[k];}
    assert.deepEqual(JSON.parse(JSON.stringify(authored.turnSpeakers)),spec.route,spec.id+' exact cycle22 route');
    assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.route);row.speakers=undefined;
  }
  assert.equal(event("ev_parkss_past")["choices"][1]["out"][0]["text"],"\"정류소 아이들이 고비를 넘길 때 선생님이 곁에 계셨잖아요. 지금도 이렇게 곁에 계시고요.\"\n\n박 선생이 시선을 들었다. \"…그 얼굴들은 기억이 나는군.\"\n\n\"돌려보낸 얼굴만 세지 말고, 살린 얼굴도 좀 세요.\"\n\n박 선생이 약병을 상자에 돌려놓았다. \"그래. 그 장부도 빼먹으면 안 되겠지.\"","ev_parkss_past exact cycle22 copy");
  assert.equal(event("ev_parkss_past")["choices"][2]["out"][0]["text"],"말없이 물을 끓여 차 한 잔을 건넸다. 박 선생이 두 손으로 잔을 감쌌다.\n\n\"…차에 약이라도 탔나?\"\n\n\"선생님 약통엔 없는 거예요.\"\n\n박 선생이 피식 웃었다. \"입은 살아 있군.\" 더 묻지 않고 찻잔을 채웠다. 박 선생의 어깨가 조금 내려갔다.","ev_parkss_past exact cycle22 copy");
  assert.equal(event("comp_snore")["choices"][0]["out"][0]["text"].toString(),"S=>`차를 세운 김에 녹음을 틀었다. 잠이 덜 깬 두 사람이 스피커 쪽으로 몸을 기울였다.\\n\\n\"이거 트럭 지나가는 소리 아니야?\" \"${S.party?.[0]==='parkss'?'선생님 코에서 난 소리인데요.':'네 콧구멍에서 난 소리야.'}\"\\n\\n범인은 끝까지 부인했다. 다음 조수석은 지도 담당이라며 서로 등을 떠밀다가, 둘 다 웃어서 다시 녹음 버튼을 눌렀다.`","comp_snore exact cycle22 copy");
  assert.equal(event("talk_es_01")["choices"][0]["out"][0]["fx"]["note"]["body"],"단파로 들은 모르는 나라의 노래. 헤드폰 반쪽의 동맹.","talk_es_01 exact cycle22 copy");
  // Cycle19: four reviewed result roles; prose corrections retain quote counts.
  for(const [id,ci,route] of [
    ['exp_printshop',0,[{who:'record',kind:'record',name:'활판 한 장',medium:'paper'}]],
    ['ev_waterpark',1,['party_first']],
    ['crisis_nofuel',1,[{who:'passer_merchant',name:'만물상 상인'}]],
    ['crisis_nofuel2',1,[{who:'passer_merchant',name:'만물상 상인'}]]
  ]){
    const out=rows.find(row=>row.id===id).choices[ci].out[0];
    assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),route,id+' exact cycle19 result role');
    out.speakers=undefined;
  }
  // The old raw quote counter also counted HTML class="ai" as one quotation.
  assert.equal(event('signal_bait').text,'라디오에서 여자 목소리가 반복된다.\n\n"…차량 고장. 아이 둘. 좌표 보냅니다. 물이 없어요…"\n\n같은 문장이 정확히 같은 간격으로 여덟 번.\n\n잡음이 섞였다.\n\n"…차량 고장. 아이 둘. 좌표 보냅니다. 물이 없어요…"\n\n아홉 번째에도 억양이 똑같았다. 사람이 지치면 목소리가 변한다. 이 목소리는 변하지 않는다.\n\n녹음이거나, 아니면 지친 적이 없는 사람이다.');
  const cycle19Bait=rows.find(row=>row.id==='signal_bait');
  assert.equal(cycle19Bait.q,2);cycle19Bait.q=3;
  // Cycle17: exact reviewed crew routes; separate copy corrections retain quote counts.
  const cycle17PhotoCopy=[{"id":"comp_polaroid","path":["text"],"old":"사진관에서 챙긴 즉석카메라. 필름이 아직 남아 있다.\n\n창밖 풍경이 유난히 좋은 오후다. 한 장 쓸까?","new":"사진관에서 챙긴 즉석카메라. 필름이 아직 남아 있다.\n\n창밖 풍경이 눈에 들어온다. 한 장 쓸까?"},{"id":"comp_polaroid","path":["choices",0,"out",0,"text"],"old":"노을과 폐허와 도로가 한 장에 담겼다. 세상이 망가진 방식조차 가끔은 아름답다는 게 억울했다.\n\n사진 뒷면에 날짜와 위치를 적어 상자에 넣었다. 여행의 물성이 하나 늘었다.","new":"하늘과 폐허와 도로가 한 장에 담겼다. 세상이 망가진 방식조차 가끔은 아름답다는 게 억울했다.\n\n사진 뒷면에 날짜와 위치를 적어 상자에 넣었다. 여행의 물성이 하나 늘었다."},{"id":"comp_polaroid","path":["choices",0,"out",0,"fx","note","body"],"old":"노을과 폐허와 도로. 망가진 방식조차 가끔 아름다워서 억울했다.","new":"하늘과 폐허와 도로. 망가진 방식조차 가끔 아름다워서 억울했다."},{"id":"comp_polaroid","path":["choices",1,"out",0,"text"],"old":"찰칵 소리에 깬 피사체가 격노했다. 사진 속 얼굴은 처참했고, 그래서 전원이 손을 들어 명작 판정을 내렸았다.\n\n선바이저의 가족사진 옆에 나란히 꽂혔다.","new":"찰칵 소리에 깬 피사체가 격노했다. 사진 속 얼굴은 처참했고, 그래서 전원이 손을 들어 명작 판정을 내렸다.\n\n선바이저의 가족사진 옆에 나란히 꽂혔다."},{"id":"exp_photostudio","path":["choices",0,"out",0,"text"],"old":"배경지 앞에 다 같이 섰다. 어색하게. 누가 시키지도 않았는데 제일 좋은 옷매무새로.\n\n찰칵. 위이잉—\n\n사진이 흔들리며 나왔다. 못 나온 사람이 반, 눈 감은 사람이 반. 다시 찍자는 사람은 없었다. 이게 우리니까.\n\n사진은 조수석 선바이저에 꽂았다. 달구지의 가족사진이다.","new":"배경지 앞에 다 같이 섰다. 어색하게. 누가 시키지도 않았는데 제일 좋은 옷매무새로.\n\n찰칵. 위이잉—\n\n사진이 흔들리며 나왔다. 못 나온 사람이 반, 눈 감은 사람이 반. 다시 찍자는 사람은 없었다. 이게 우리니까.\n\n사진은 조수석 선바이저에 꽂았다. 달구지의 가족사진이다. 카메라와 남은 필름도 함께 챙겼다."}];
  for(const change of cycle17PhotoCopy){let value=event(change.id);for(const key of change.path)value=value[key];assert.equal(value,change.new,change.id+' exact photo copy');}
  assert.equal(event('ev_near_seoul_sign').choices[0].out[0].text,'차를 세우고 부산에서 여기까지 함께 넘어온 얼굴들을 봤다.\n\n"…여기까지 왔네." 누군가 말했다.\n\n"뭐라고?"\n\n"여기까지 왔다고."\n\n"…어."\n\n길에서 만난 손들이 내 손 위로 포개졌다. 두려움은 그대로 둔 채 다시 시동을 걸었다.');
  const cycle17Copy=[{"id":"crisis_battery","path":["choices",0,"out",0,"text"],"old":"전원 하차. \"하나, 둘, 셋!\"\n\n내리막까지 30m를 밀었다. 클러치를 붙이자 엔진이 부르릉 살아났다. 운전석에 올라탄 뒤에야 할아버지 수첩의 문장이 떠올랐다. 「밀어서도 걸리는 차를 타라.」\n\n대답할 숨은 없었다. 범퍼에 기대 한동안 웃기만 했다.","new":"전원 하차. \"하나, 둘, 셋!\"\n\n내리막까지 30m를 밀고 나는 운전석에 올라탔다. 동료들이 뒤에서 한 번 더 밀자 클러치를 붙였고, 엔진이 부르릉 살아났다. 할아버지 수첩의 문장이 떠올랐다. 「밀어서도 걸리는 차를 타라.」\n\n동료들은 대답할 숨도 없었다. 범퍼에 기대 한동안 웃다가 다시 올라탔다."},{"id":"comp_cloudgame","path":["choices",0,"out",0,"text"],"old":"다음 구름, 그다음 구름으로 연장전이 이어졌다. 드래곤은 이견이 없었고, 세탁기는 삼 대 일이었다.\n\n그다음 것에서 누가 \"할아버지 옆모습\"이라고 했다. 반박이 안 나왔다.\n\n그 뒤로 꽤 오래 아무도 다음 구름을 고르지 않았다.","new":"다음 구름, 그다음 구름으로 연장전이 이어졌다. 드래곤은 이견이 없었고, 세탁기는 표가 갈렸다.\n\n그다음 것에서 누가 \"할아버지 옆모습\"이라고 했다. 반박이 안 나왔다.\n\n그 뒤로 꽤 오래 아무도 다음 구름을 고르지 않았다."}];
  for(const change of cycle17Copy){let value=event(change.id);for(const key of change.path)value=value[key];assert.equal(value,change.new,change.id+' exact cycle17 copy');}
  const cycle17StoryRoutes=[
    {"id":"vg_crossing","choices":{"0.0":[]},"entry":[{"who":"record","kind":"record","name":"건널목 안내문","medium":"written"}]},
    {"id":"ev_carousel_park","choices":{"0.0":[],"1.0":[]},"entry":[{"who":"record","kind":"record","name":"매표소 안내문","medium":"written"}]},
    {"id":"ev_milestone_cairn","choices":{"0.0":[{"who":"record","kind":"record","name":"내가 돌에 적은 소원","medium":"written"}],"1.0":["party_first"]},"entry":[{"who":"record","kind":"record","name":"돌에 적힌 소원","medium":"written"},{"who":"record","kind":"record","name":"돌에 적힌 소원","medium":"written"},{"who":"record","kind":"record","name":"돌에 적힌 소원","medium":"written"}]},
    {"id":"roadbeat_100_divide","choices":{"0.0":[],"1.0":[{"who":"record","kind":"record","name":"함께 되짚은 천리안의 회유","medium":"memory","timeKind":"memory","timeLabel":"조금 전 들은 회유 · 함께 되짚는 말"}]}},
    {"id":"wx_dust_vendor","choices":{"0.0":[{"who":"passer_man","name":"방독면 장수"},"me",{"who":"passer_man","name":"방독면 장수"},"me",{"who":"passer_man","name":"방독면 장수"}],"1.0":[{"who":"passer_man","name":"방독면 장수"}]},"entry":[{"who":"passer_man","name":"방독면 장수"}]},
    {"id":"meet_theater","choices":{"0.0":["me"],"1.0":[]},"entry":[{"who":"passer_worker","name":"극단 단원"}]},
    {"id":"lc_daegu_makchang","choices":{"0.0":["me",{"who":"passer_woman","name":"막창집 사장님"},"me",{"who":"passer_woman","name":"막창집 사장님"},{"who":"passer_woman","name":"막창집 사장님"},{"who":"passer_woman","name":"막창집 사장님"}]},"entry":[{"who":"passer_woman","name":"막창집 사장님"}]},
    {"id":"lc_mokpo_hongeo","choices":{"0.0":["party_first",{"who":"passer_woman","name":"목포 아짐"}],"1.0":[{"who":"passer_woman","name":"목포 아짐"}]},"entry":[{"who":"passer_woman","name":"목포 아짐"},"me",{"who":"passer_woman","name":"목포 아짐"}]},
    {"id":"meet_runner","choices":{"0.0":[{"who":"passer_man","name":"달리는 사람"},{"who":"passer_man","name":"달리는 사람"},"me",{"who":"passer_man","name":"달리는 사람"},"me",{"who":"passer_man","name":"달리는 사람"}],"1.0":["party_first"]}},
    {"id":"meet_stargazer","choices":{"0.0":[{"who":"passer_man","name":"천문 관측자"},"me",{"who":"passer_man","name":"천문 관측자"},"me",{"who":"passer_man","name":"천문 관측자"},{"who":"passer_man","name":"천문 관측자"}],"1.0":[]},"entry":[{"who":"passer_man","name":"천문 관측자"},{"who":"passer_man","name":"천문 관측자"}]},
    {"id":"kids_escort","choices":{"0.0":[{"who":"passer_child","name":"막내"},"me",{"who":"passer_child","name":"큰애"},"me",{"who":"passer_merchant","name":"국밥집 주인"},{"who":"passer_child","name":"큰애"}]},"entry":[{"who":"passer_child","name":"큰애"}]},
    {"id":"meet_welldigger","choices":{"0.0":["me",{"who":"passer_man","name":"우물을 파는 남자"},"me",{"who":"passer_man","name":"우물을 파는 남자"},"me"],"1.0":[{"who":"passer_man","name":"우물을 파는 남자"}]},"entry":[{"who":"passer_man","name":"우물을 파는 남자"},{"who":"passer_man","name":"우물을 파는 남자"}]},
    {"id":"ev_wandering_musician","choices":{"0.0":[],"1.0":[{"who":"passer_man","name":"떠돌이 악사"}],"2.0":[]},"entry":[{"who":"passer_man","name":"떠돌이 악사"}]},
    {"id":"ev_rooftop_farm","choices":{"0.0":[{"who":"passer_elder","name":"옥상 밭의 노인"},{"who":"passer_elder","name":"옥상 밭의 노인"}],"1.0":["jaeyi",{"who":"passer_elder","name":"옥상 밭의 노인"}]}},
    {"id":"ev_kids_playing_school","choices":{"0.0":["me",{"who":"passer_child","name":"학생 역의 아이들"}],"1.0":[{"who":"passer_child","name":"학생 역의 아이들"}],"2.0":[]},"entry":[{"who":"passer_child","name":"선생님 역의 아이"},{"who":"passer_child","name":"학생 역의 아이들"},{"who":"passer_child","name":"선생님 역의 아이"}]},
    {"id":"ev_claw_truck","choices":{"0.0":["me",{"who":"passer_worker","name":"인형뽑기 트럭 주인"}],"0.1":["me",{"who":"passer_worker","name":"인형뽑기 트럭 주인"},"me"],"1.0":[{"who":"passer_worker","name":"인형뽑기 트럭 주인"},{"who":"passer_worker","name":"인형뽑기 트럭 주인"}]},"entry":[{"who":"passer_worker","name":"인형뽑기 트럭 주인"},{"who":"passer_worker","name":"인형뽑기 트럭 주인"}]},
    {"id":"roadcrew_washout","choices":{"0.0":[{"who":"passer_worker","name":"도윤"},{"who":"passer_elder","name":"순임"},{"who":"passer_worker","name":"도윤"},{"who":"passer_elder","name":"순임"}],"1.0":[{"who":"passer_elder","name":"순임"}],"2.0":[{"who":"passer_elder","name":"순임"}]},"entry":[{"who":"passer_elder","name":"순임"}]},
    {"id":"roadcrew_sign","choices":{"1.0":[{"who":"passer_worker","name":"도윤"},{"who":"passer_elder","name":"순임"}]},"entry":[{"who":"passer_worker","name":"도윤"}]},
    {"id":"ev_road_piano","choices":{"0.1":["party_first"]}},
    {"id":"ev_fireflies","choices":{"0.0":["party_first","me","party_first","party_first"],"1.0":["eunsu"]},"entry":["party_first"]},
    {"id":"ev_cosmos_road","choices":{"0.0":["party_first"],"1.0":["party_first"]}},
    {"id":"ev_observatory","choices":{"0.0":["party_first"]}},
    {"id":"ev_arcade","choices":{"0.0":["party_first","me","party_first","me","party_first","me"],"1.1":["me"]}},
    {"id":"ev_autumn_valley","choices":{"0.0":["party_first"]}},
    {"id":"ev_reed_sunset","choices":{"1.0":["party_first"]}},
    {"id":"ev_dawn_mist","choices":{"0.0":["party_first"]}},
    {"id":"ev_barley_field","choices":{"0.0":["party_first"],"1.0":["me"]}},
    {"id":"ev_ferris_wheel","choices":{"1.0":["party_first"]}},
    {"id":"ev_meteor_shower","choices":{"0.0":["party_first","me","party_first","me"],"1.0":["party_first"]},"entry":["party_first"]},
    {"id":"ev_pc_cafe","choices":{"2.0":["me"]}},
    {"id":"ev_temple_bell","choices":{"0.0":["me","party_first","party_first"],"0.1":[{"who":"passer_refugee","name":"생존자 가족"}],"1.0":["me"]}},
    {"id":"ev_waterfall","choices":{"0.0":["party_first"],"1.0":[]},"entry":["party_first"]},
    {"id":"ev_laundromat","choices":{"0.0":["party_first"]}},
    {"id":"ev_train_depot","choices":{"1.0":["party_first"]}},
    {"id":"ev_frost_morning","choices":{"0.0":["party_first"],"1.0":["party_first"]}},
    {"id":"ev_rainbow","choices":{"1.0":["party_first"]}},
    {"id":"ev_dolmen","choices":{"0.0":["party_first","me","party_first","me"]}},
    {"id":"ev_milkyway","choices":{"1.0":["party_first"]}},
    {"id":"ev_snow_pines","choices":{"0.0":["party_first"],"1.0":["party_first"]}},
    {"id":"ev_near_seoul_sign","choices":{"0.0":["party_first","me","party_first","me"],"1.0":["me","party_first","party_first","me","party_first","me","party_first"]}},
    {"id":"ev_roadside_shrine","choices":{"0.0":["me"],"1.0":["me"]}},
    {"id":"exp_brewery","choices":{"1.0":["party_first"]}},
    {"id":"exp_postoffice","choices":{"0.0":["party_first","me","party_first"]}},
    {"id":"vg_shootingstar","choices":{"0.0":["party_first"]},"entry":["party_first"]},
    {"id":"exp_comicroom","choices":{"0.0":["party_first"]}},
    {"id":"vg_traincross","choices":{"0.0":["party_first"]}},
    {"id":"vg_priceboard","choices":{"0.0":["party_first"]}},
    {"id":"wx_worms","choices":{"0.0":["party_first"]}},
    {"id":"exp_chalkwall","choices":{"1.0":["party_first","me","party_first"]}},
    {"id":"vg_northglow","choices":{"0.0":["party_first"]}},
    {"id":"crisis_rockfall","choices":{"0.0":["party_first"],"0.1":["me"]}},
    {"id":"crisis_hose","choices":{"0.0":["party_first"]}},
    {"id":"vg_moonriver","choices":{"0.0":["party_first"]}},
    {"id":"exp_kiln","choices":{"0.0":["party_first"]}},
    {"id":"exp_hanji","choices":{"0.0":["party_first","party_first"]}},
    {"id":"ai_tunnellights","choices":{"0.0":["me"]}},
    {"id":"near_miryang_ice","choices":{"0.0":["me"]}},
    {"id":"near_yeosu_camellia","choices":{"0.0":["party_first"]}},
    {"id":"vg_seoulline","choices":{"0.0":["party_first"]}},
    {"id":"crisis_boar","choices":{"0.0":["party_first"],"1.0":["me"]}},
    {"id":"crisis_battery","choices":{"0.0":["me"]}},
    {"id":"vg_ivy","choices":{"0.0":["party_first"]}},
    {"id":"exp_selfwash","choices":{"0.0":["party_first"]}},
    {"id":"ev_migratory_birds","choices":{"0.0":["party_first"]}},
    {"id":"exp_arcade","choices":{"0.0":[{"who":"passer_elder","name":"에어하키 고수"}]}},
    {"id":"wx_bigwash","choices":{"0.0":[]},"entry":["party_first"]},
    {"id":"comp_food_debate","choices":{"0.0":["party_first","party_second","party_first","party_second","me"],"1.0":["party_first"]},"entry":["party_first"]},
    {"id":"comp_hometown","choices":{"0.0":["party_first","me","party_second","party_first"]},"entry":["party_first","party_second","party_first","party_second"]},
    {"id":"comp_water_fight","choices":{"0.0":["party_first","me","party_first","me","party_second"],"1.0":["party_first","party_second"],"2.0":[]}},
    {"id":"comp_ghost_story","choices":{"0.1":[],"1.0":[]},"entry":["party_first"]},
    {"id":"comp_van_name","choices":{"1.0":[]},"entry":["party_first","me","party_first"]},
    {"id":"comp_radio_war","choices":{"0.0":[{"kind":"record","who":"radio","name":"정착지 뉴스","medium":"radio"}],"1.0":["party_first"]}},
    {"id":"comp_storm_count","choices":{"0.0":["party_first","party_first","me","party_first","me","party_first"],"1.0":[]},"entry":["party_first"]},
    {"id":"comp_snore","choices":{"0.0":["party_first","me"],"1.0":[]}},
    {"id":"comp_dj_night","choices":{"0.0":[],"1.0":["party_first","party_second","me","party_second","me"]},"entry":["party_first","party_second","party_first","party_second","party_first"]},
    {"id":"comp_cloudgame","choices":{"0.0":[],"1.0":["party_first","me","party_first"]},"entry":["party_first","me","party_first","party_second","party_first","me"]},
    {"id":"comp_whatif","choices":{"0.0":["party_first","party_second","party_first"],"1.0":["party_first","me","party_first"]},"entry":["party_first","me","party_first"]},
    {"id":"comp_brake","choices":{"0.0":["me","party_first"]}},
    {"id":"van_receipt","choices":{"0.0":["me"]}},
    {"id":"comp_cookoff","choices":{"0.0":[],"1.0":["me"]},"entry":["party_first"]},
    {"id":"comp_shadow","choices":{"0.0":[]},"entry":["party_first"]},
    {id:'comp_diary_read',entry:['party_first'],choices:{'0.0':['party_first','party_second','party_first','party_second','party_first','party_second','me']}},
    {id:'up_beehive_swarm',choices:{'0.1':['me']}},
    {id:'comp_van_pride',entry:['party_first'],choices:{'0.0':['me']}},
    {id:'ev_group_feast',choices:{'1.0':['me']}},
    {id:'up_armor_argument',entry:['party_first'],choices:{'0.0':[],'1.0':[]}}
  ];
  for(const spec of cycle17StoryRoutes){
    const row=rows.find(r=>r.id===spec.id);
    if(spec.entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.entry,spec.id+' entry');row.speakers=undefined;}
    for(const [key,speakers]of Object.entries(spec.choices)){
      const [i,o]=key.split('.').map(Number),out=row.choices[i].out[o];
      assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),speakers,spec.id+'.'+key);out.speakers=undefined;
    }
  }
  {
    const ghost=event('comp_ghost_story').choices[0].out[0].turns;
    assert.deepEqual(JSON.parse(JSON.stringify(ghost)),[{"kind":"narration","text":"군대 얘기, 고시원 얘기, 새벽 편의점 얘기가 이어졌다."},{"kind":"narration","text":"우승은 \"월요일 아침 지하철\"을 묘사한 사람에게 돌아갔다. 반론이 없었다. 다들 그게 제일 무서웠고— 조금은, 아주 조금은 그리웠다."}]);
    const row=rows.find(r=>r.id==='comp_ghost_story').choices[0].out[0];
    assert.deepEqual(row.turns,ghost.map(t=>({kind:t.kind,who:t.who})));row.turns=[];
    const van=event('comp_van_name').choices[0].out[0].turns,vanRow=rows.find(r=>r.id==='comp_van_name').choices[0].out[0];
    assert.equal(vanRow.turns,'dynamic');assert.equal(hash(van.toString()),'b8e8da9b57f2983b9e8f47f843460f59785c02da336842732b3037b7acf1db48');
    for(const party of [['minji','kangwoo'],['eunsu','jaeyi'],['parkss','leo','minji']]){
      assert.deepEqual(Array.from(van({party})).filter(t=>t.kind==='dialogue').map(t=>t.who),['me',party[0],'me',party[1],party[0]]);
    }
    vanRow.turns=[];
  }
  for(const [i,digest]of [[0,"40c828c0b4bae0058c39533dbe898d16cf575fc89b3004ed106e09c92c74b2b2"],[1,"36e5a6a1eda4921edb26d43a3e10ff9d0e553535d7a0000991b2234c70f47813"]]){
    const authored=event('ev_newsstand').choices[i].out[0].turns,row=rows.find(r=>r.id==='ev_newsstand').choices[i].out[0];
    assert.equal(row.turns,'dynamic');assert.equal(hash(authored.toString()),digest);
    for(const party of [['minji'],['leo','kangwoo']])assert.deepEqual(Array.from(authored({party})).filter(t=>t.kind==='dialogue').map(t=>t.who),i===0?[party[0],'me']:[party[0],'me',party[0]]);
    row.turns=[];
  }
  assert.equal(event('ev_temple_bell').choices[0].out[1].text,"종소리가 너무 멀리 퍼졌다. 절에서 내려오는 길에, 그 소리를 듣고 찾아온 생존자 가족을 만났다. \"종소리 나는 쪽에 사람 있을 줄 알았어요.\" 뜻밖의 인연이 됐다.");
  assert.equal(event('lc_mokpo_hongeo').choices[0].out[0].text,"한 입에 눈물, 또 한 입에 기침. 그런데…\"어? 이거 은근…?\"\n\n결국 한 사람이 접시를 비웠다. 아짐이 박수를 쳤다. \"인자 목포 사람 다 됐네!\"\n\n합격자에겐 막걸리 반 잔, 불합격자에겐 김치가 위로로 지급됐다.");
  // Cycle16 natural-reader audit: player reflection, written sources and named roles.
  const cycle16ReaderRoutes=[
    {id:'ev_seed_warehouse',choices:{'0.0':['me']}},
    {id:'exp_station',entry:[{who:'record',kind:'record',name:'간이역 역명판'}],
      choices:{'0.0':[{who:'record',kind:'record',name:'역장의 일지',medium:'paper'}]}},
    {id:'ev_salt_farmer',entry:[{who:'passer_worker',name:'염전 사내'}],choices:{
      '0.0':['me',{who:'passer_worker',name:'염전 사내'},{who:'passer_worker',name:'염전 사내'}],
      '1.0':[{who:'passer_worker',name:'염전 사내'},{who:'passer_worker',name:'염전 사내'}]}}
  ];
  for(const spec of cycle16ReaderRoutes){
    const row=rows.find(r=>r.id===spec.id);
    if(spec.entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.entry,spec.id+' entry');row.speakers=undefined;}
    for(const [key,speakers]of Object.entries(spec.choices)){
      const [i,o]=key.split('.').map(Number),out=row.choices[i].out[o];
      assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),speakers,spec.id+'.'+key);out.speakers=undefined;
    }
  }
  assert.equal(event('gp_envelope').choices[1].out[0].text,
    '봉투를 수첩 뒤에 도로 꽂았다. 남산 보고 열라면, 남산 보고 연다.\n\n수첩을 덮고도 시선이 다시 뒷표지로 갔다. 봉투를 꽂은 자리가 살짝 불룩했다.');
  assert.equal(event('meet_bus').choices[0].out[0].fx.note.body,
    '전주 서문의 진료 버스를 지키던 전직 약사. 구미 쪽 진료소로 따뜻해지기 전에 약을 옮겨야 한다.');
  assert.equal(D.choiceMemories.story_family_principle[0].lines[0][1],
    '예측은 명령이 아니다. 외워 두기만 했던 문장이 이제야 부모님 목소리로 들렸다.');
  const massacreChat=D.chats.find(c=>c.id==='thread-massacre-kangwoo');
  assert.equal(massacreChat.lines[1][1],'문 쪽이 더 편해요?');
  assert.equal(massacreChat.lines[7][1],'오늘 밤 내 자리는 문 반대편에 펴고, 가운데 통로는 비워 두기로 했다.');
  const cycle14SystemsAndPairs=[{"id":"talk_leo_05","choices":[{"i":0,"o":0,"speakers":["leo","leo","leo"]}]},{"id":"talk_jy_07","choices":[{"i":0,"o":0,"speakers":["jaeyi","jaeyi","jaeyi"]}],"entry":["jaeyi","me","jaeyi"]},{"id":"talk_leo_13","choices":[{"i":0,"o":0,"speakers":["me","leo","leo","leo"],"oldSpeakers":["leo","me","leo","leo"]}]},{"id":"talkr_jy_1","choices":[{"i":0,"o":0,"speakers":["jaeyi","jaeyi","jaeyi"]},{"i":1,"o":0,"speakers":["jaeyi","me","jaeyi","jaeyi"]}]},{"id":"talk_jy_11","choices":[{"i":0,"o":0,"speakers":["jaeyi","jaeyi","jaeyi","me","jaeyi","jaeyi"]}]},{"id":"talk_leo_18","choices":[{"i":0,"o":0,"speakers":["leo","me","leo","me","leo","leo"]},{"i":1,"o":0,"speakers":["leo","leo","me","leo"]}],"entry":["leo","leo","leo"]},{"id":"talk_leo_20","choices":[{"i":0,"o":0,"speakers":[{"who":"me","kind":"dialogue"},{"who":"leo","kind":"dialogue"},{"who":"me","kind":"dialogue"},{"who":"leo","kind":"dialogue"}]},{"i":1,"o":0,"speakers":["leo","leo","me","leo"]}],"entry":["leo","leo","leo"]},{"id":"talk_jy_17","choices":[{"i":0,"o":0,"speakers":["jaeyi","jaeyi","jaeyi","me","jaeyi"]},{"i":0,"o":1,"speakers":["jaeyi","me","jaeyi","jaeyi"]},{"i":1,"o":0,"speakers":["jaeyi","jaeyi","me","jaeyi"]}]},{"id":"talk_jy_20","choices":[{"i":0,"o":0,"speakers":[{"who":"jaeyi","kind":"dialogue"},{"who":"jaeyi","kind":"dialogue"},{"who":"jaeyi","kind":"dialogue"}]},{"i":1,"o":0,"speakers":["jaeyi","me","jaeyi","jaeyi","jaeyi"],"oldSpeakers":["jaeyi","me","jaeyi","jaeyi","jaeyi"]}]},{"id":"talk_jy_21","choices":[{"i":0,"o":0,"speakers":["jaeyi","jaeyi","me","jaeyi"],"oldSpeakers":["jaeyi","jaeyi","me","jaeyi"]},{"i":1,"o":0,"speakers":["jaeyi","me","jaeyi","jaeyi","jaeyi"]}]},{"id":"ev_jaeyi_law","choices":[{"i":0,"o":0,"speakers":["jaeyi","jaeyi"]},{"i":1,"o":0,"speakers":["me","jaeyi"]}],"entry":["me","jaeyi","jaeyi"]},{"id":"lc_suwon_galbi","choices":[{"i":0,"o":0,"speakers":[{"who":"passer_guard","name":"문지기"},{"who":"passer_guard","name":"문지기"},"me"]},{"i":1,"o":0,"speakers":[]}],"entry":[{"who":"passer_guard","name":"문지기"},{"who":"passer_guard","name":"문지기"},"me",{"who":"passer_guard","name":"문지기"}]},{"id":"gp_note1","choices":[{"i":0,"o":0,"speakers":[]}],"entry":[{"who":"record","kind":"record","name":"할아버지의 정비 수첩","medium":"paper"}]},{"id":"gp_note2","choices":[{"i":0,"o":0,"speakers":[]}],"entry":[{"who":"record","kind":"record","name":"할아버지의 정비 수첩","medium":"paper"},{"who":"record","kind":"record","name":"어릴 적 내가 남긴 낙서","medium":"paper"}]},{"id":"pair_mj_kw_2","entry":["minji","minji","kangwoo","minji","kangwoo"],"choices":[{"i":0,"o":0,"speakers":["kangwoo","minji","kangwoo","minji","kangwoo","minji","minji","kangwoo"]}]},{"id":"pair_mj_jy_1","entry":["jaeyi","jaeyi","minji","jaeyi"],"choices":[{"i":0,"o":0,"speakers":["jaeyi","minji","jaeyi","minji","jaeyi","jaeyi"]}]},{"id":"pair_mj_jy_2","entry":["jaeyi"],"choices":[{"i":0,"o":0,"speakers":["minji","jaeyi","minji","jaeyi","minji","minji","jaeyi","minji","jaeyi"]}]}];
  for(const spec of cycle14SystemsAndPairs){
    const row=rows.find(r=>r.id===spec.id);
    if(spec.entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.entry,spec.id+' entry');row.speakers=spec.oldEntry;}
    for(const c of spec.choices){const out=row.choices[c.i].out[c.o];assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),c.speakers,spec.id+'.'+c.i+'.'+c.o);out.speakers=c.oldSpeakers;}
  }
  {
    const row=rows.find(r=>r.id==='gp_note3'),authored=event('gp_note3').turns;
    assert.equal(hash(authored),'e97f1b4dc3bcd356b0b22ecf47b26d3599dbf346afbf7b5f9b3790b39192fe6d');
    assert.deepEqual(row.turns,authored.map(t=>({kind:t.kind,who:t.who})));row.turns=[];
  }
  const cycle14SurvivalRoutes=[{"id":"talk_pss_03","choices":[{"i":1,"o":0,"speakers":["parkss","parkss","parkss"]}]},{"id":"talk_pss_06","choices":[{"i":0,"o":0,"speakers":["parkss","me","parkss","parkss","parkss","parkss"]}]},{"id":"talk_pss_07","choices":[{"i":0,"o":0,"speakers":["parkss","parkss","me","parkss","parkss"]},{"i":1,"o":0,"speakers":["parkss","parkss","me","parkss","parkss"]}]},{"id":"talk_pss_08","choices":[{"i":0,"o":0,"speakers":["parkss","parkss","parkss","me","parkss","parkss","parkss"]}]},{"id":"talk_pss_10","choices":[{"i":0,"o":0,"speakers":[{"kind":"record","who":"record","name":"박 선생의 처방전","medium":"paper"},"parkss"]}]},{"id":"talk_kw_05","choices":[{"i":0,"o":0,"speakers":["kangwoo","kangwoo","me","kangwoo","kangwoo"]}]},{"id":"talkr_pss_3","choices":[{"i":0,"o":0,"speakers":["me","parkss","me","parkss","parkss"]}]},{"id":"talkr_kw_1","choices":[{"i":1,"o":0,"speakers":["kangwoo","kangwoo"]}]},{"id":"talkr_kw_2","choices":[{"i":0,"o":0,"speakers":["me","kangwoo","me","kangwoo","kangwoo"]}]},{"id":"talk_kw_12","choices":[{"i":0,"o":0,"speakers":["kangwoo","me","kangwoo","kangwoo","kangwoo"]}]},{"id":"talk_kw_13","choices":[{"i":0,"o":0,"speakers":["kangwoo","me","kangwoo","kangwoo","kangwoo"]}]},{"id":"talk_kw_14","choices":[{"i":0,"o":0,"speakers":["kangwoo","me","kangwoo","me","kangwoo","kangwoo"]}]},{"id":"talk_pss_16","choices":[{"i":0,"o":0,"speakers":["parkss","parkss","me","parkss","parkss"]}]},{"id":"talk_pss_17","choices":[{"i":0,"o":0,"speakers":["parkss","parkss","me","parkss","parkss"]}]},{"id":"talk_pss_19","choices":[{"i":0,"o":0,"speakers":["parkss","me","parkss","me"]}],"entry":["parkss","parkss","parkss"]},{"id":"talk_pss_20","choices":[{"i":0,"o":0,"speakers":["parkss","parkss"]},{"i":1,"o":0,"speakers":["parkss","me","parkss","parkss"]}],"entry":["parkss","parkss"]},{"id":"talk_pss_21","choices":[{"i":0,"o":0,"speakers":["parkss","me","parkss","me","parkss"]},{"i":1,"o":0,"speakers":["parkss","parkss","me","parkss"]}],"entry":["parkss","parkss"]},{"id":"talk_kw_17","choices":[{"i":0,"o":0,"speakers":["kangwoo","me","kangwoo","kangwoo"]},{"i":1,"o":0,"speakers":["kangwoo","me","kangwoo"]}],"entry":["kangwoo","kangwoo"]},{"id":"talk_kw_21","choices":[{"i":1,"o":0,"speakers":["kangwoo","me","kangwoo"]}]},{"id":"exp_woodshop","choices":[{"i":1,"o":0,"speakers":[{"kind":"thought","who":"me"}]}]},{"id":"exp_bowling","choices":[{"i":1,"o":0,"speakers":[{"kind":"thought","who":"me"}]}]},{"id":"comp_birthday","choices":[{"i":0,"o":0,"speakers":[]},{"i":1,"o":0,"speakers":["party_first"]}],"entry":["party_first"]},{"id":"pair_pss_kw_1","choices":[{"i":0,"o":0,"speakers":["parkss","kangwoo","parkss","kangwoo","parkss","parkss","kangwoo","parkss","kangwoo"]}]},{"id":"pair_kw_leo_2","choices":[{"i":0,"o":0,"speakers":["kangwoo","kangwoo","kangwoo","leo","kangwoo","leo","kangwoo"]}]},{"id":"han_bridge","choices":[{"i":1,"o":0,"speakers":["kangwoo","kangwoo"]}]},{"id":"pair_pss_kw_2","choices":[{"i":0,"o":0,"speakers":["parkss","kangwoo","parkss","kangwoo","parkss","kangwoo","parkss","parkss","kangwoo","parkss","kangwoo"]}]},{"id":"pair_pss_jy_1","choices":[{"i":0,"o":0,"speakers":["parkss","jaeyi","parkss","jaeyi","parkss","jaeyi"]}]},{"id":"pair_pss_jy_2","choices":[{"i":0,"o":0,"speakers":["parkss","parkss","jaeyi"]}],"entry":["jaeyi"]},{"id":"pair_kw_jy_1","choices":[{"i":0,"o":0,"speakers":["kangwoo","jaeyi","jaeyi","kangwoo","kangwoo"]}]},{"id":"pair_kw_jy_2","choices":[{"i":0,"o":0,"speakers":["jaeyi","jaeyi","kangwoo","jaeyi","kangwoo","jaeyi"]}],"entry":["jaeyi","jaeyi","kangwoo","jaeyi","kangwoo","jaeyi"]},{"id":"pair_kw_es_1","choices":[{"i":0,"o":0,"speakers":["eunsu","kangwoo","eunsu","kangwoo","eunsu","kangwoo","kangwoo","eunsu"]}]},{"id":"pair_kw_es_2","choices":[{"i":0,"o":0,"speakers":["eunsu","eunsu","kangwoo","eunsu","kangwoo"]}],"entry":["eunsu","kangwoo","eunsu","kangwoo","kangwoo","kangwoo"]}];
  for(const spec of cycle14SurvivalRoutes){
    const row=rows.find(r=>r.id===spec.id);
    if(spec.entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.entry,spec.id+' entry');row.speakers=spec.oldEntry;}
    for(const c of spec.choices){const out=row.choices[c.i].out[c.o];assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),c.speakers,spec.id+'.'+c.i+'.'+c.o);out.speakers=c.oldSpeakers;}
  }
  const cycle14SurvivalCopy=[{"id":"talk_kw_18","path":["choices",1,"out",0,"text"],"old":"\"…날짜는 모르겠습니다.\" 강우가 물병 쪽을 봤다. \"내 몫의 물이 같은 자리에 놓여 있더군요. 그걸 보고부터는.\"\n\n\"물이요? 물이 왜…\"\n\n대답은 없었다. 그다음부터는 물병을 아무 데나 놓지 않았다. 늘 강우 손이 닿는 같은 자리에 뒀다.","new":"\"…날짜는 모르겠습니다.\" 강우가 물병 쪽을 봤다. \"내 몫의 물이 같은 자리에 놓여 있더군요. 그걸 보고부터는.\"\n\n\"물이요? 물이 왜…\"\n\n대답은 없었다. 물병을 강우 손이 닿는 자리로 옮겨 놓았다. 앞으로도 이 자리에 두겠다고 마음먹었다."},{"id":"talk_pss_17","path":["choices",1,"out",0,"text"],"old":"\"기억나지. 감기약 사러 온 신혼부부. 마지막 손님도 기억나.\" 박 선생이 잠깐 말을 멈췄다.\n\n\"…마지막 손님 얘긴 다음에 하지.\"\n\n\"네.\"\n\n\"오늘은 첫 손님 날씨였어. 맑았거든.\" 그러고는 창문을 조금 내렸다. 그 얘기는 거기서 더 안 나갔다.","new":"\"기억나지. 감기약 사러 온 신혼부부. 마지막 손님도 기억나.\" 박 선생이 잠깐 말을 멈췄다.\n\n\"…마지막 손님 얘긴 다음에 하지.\"\n\n\"네.\"\n\n\"첫 손님이 온 날은 맑았어.\" 그러고는 창문을 조금 내렸다. 그 얘기는 거기서 더 안 나갔다."},{"id":"talk_pss_17","path":["choices",0,"out",0,"fx","note","body"],"old":"조수석 문에 놋쇠 종을 달았다. 박 선생 30년 약국의 차임벨이 이사 왔다.","new":"조수석 문에 작은 종을 달았다. 박 선생 30년 약국의 차임벨이 이사 왔다."},{"id":"pair_pss_jy_2","path":["choices",0,"out",0,"text"],"old":"박 선생이 잠깐 멈췄다가, 파스를 붙여주며 말했다.\n\n\"아빠 같은 소리, 해줄 사람이 있어야 하는 나이야, 너는.\"\n\n재이가 대꾸를 못 했다. 대꾸 대신 눈이 빨개져서, 박 선생은 못 본 척 파스를 한 장 더 붙였다. \"한 장은 서비스.\"\n\n그날 이후 재이는 박 선생을 가끔 \"쌤\"이라고 부른다. 아빠라고는 안 부르지만, 그 언저리 어딘가의 호칭이다.","new":"박 선생이 잠깐 멈췄다가, 파스를 붙여주며 말했다.\n\n\"아빠 같은 소리, 해줄 사람이 있어야 하는 나이야, 너는.\"\n\n재이가 대꾸를 못 했다. 대꾸 대신 눈이 빨개져서, 박 선생은 못 본 척 파스를 한 장 더 붙였다. \"한 장은 서비스.\"\n\n재이가 손목을 감싸 쥐고 작게 말했다. \"쌤, 고마워요.\" 아빠라고는 안 불렀지만, 그 언저리 어딘가의 호칭이었다."},{"id":"pair_pss_es_1","path":["title"],"old":"박선생×은수 — 새벽 두 시 클럽","new":"박선생×은수 — 잠 못 드는 밤 클럽"},{"id":"pair_pss_es_1","path":["text"],"old":"새벽. 불면의 밤. 깨어 있는 사람이 둘이었다.\n\n\"자네도 못 자나.\" \"…선생님도요.\"\n\n보리차 두 잔이 나왔다. 클럽 창립이다.","new":"잠이 오지 않는 밤. 깨어 있는 사람이 둘이었다.\n\n\"자네도 못 자나.\" \"…선생님도요.\"\n\n보리차 두 잔이 나왔다. 클럽 창립이다."},{"id":"pair_pss_es_1","path":["choices",0,"out",0,"fx","note","title"],"old":"새벽 두 시 클럽","new":"잠 못 드는 밤 클럽"}];
  for(const change of cycle14SurvivalCopy){
    let value=event(change.id);for(const key of change.path)value=value[key];assert.equal(value,change.new,change.id+' exact authored copy');
  }
  {
    const out=rows.find(r=>r.id==='pair_pss_jy_2').choices[0].out[0];
    assert.equal(out.q,3);out.q=2; // Former one-character quoted nickname became a complete spoken reply.
  }
  // Cycle15: explicit reader routes and independently reviewed current-action copy.
  const cycle15ReaderRoutes=[{"id":"ev_comp_argument","entry":["kangwoo","minji","kangwoo"],"choices":{"0.0":["me","minji"],"1.0":["me"],"2.0":["me","kangwoo"]}},{"id":"comp_dialect","entry":["party_first","party_second","party_first","party_second","party_first","party_first","party_second","party_first"],"choices":{"1.0":["party_first","me","party_first","me"]}},{"id":"ev_cinema_film","choices":{"2.0":["me"]}},{"id":"near_jinju_lantern","choices":{"0.0":[{"who":"passer_elder","name":"등을 만드는 노인"},{"who":"passer_elder","name":"등을 만드는 노인"},"me",{"who":"passer_elder","name":"등을 만드는 노인"},{"who":"passer_elder","name":"등을 만드는 노인"},"me",{"who":"passer_elder","name":"등을 만드는 노인"}]}},{"id":"ev_container_port","entry":[{"who":"record","kind":"record","name":"정부 봉인 스티커","medium":"paper"}],"choices":{"0.0":[],"0.1":[],"1.0":[]}}];
  for(const spec of cycle15ReaderRoutes){
    const row=rows.find(r=>r.id===spec.id);
    if(spec.entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.entry,spec.id+' entry');row.speakers=undefined;}
    for(const [key,speakers] of Object.entries(spec.choices||{})){
      const [i,o]=key.split('.').map(Number),out=row.choices[i].out[o];
      assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),speakers,spec.id+'.'+key);out.speakers=undefined;
    }
  }
  const cycle15Copy=[{"id":"ev_comp_argument","path":["choices",1,"out",0,"text"],"old":"\"이번엔 속도가 중요해. 강우 방식으로 가자.\" 민지가 입을 다물었다. 검문소는 무사히 뚫었지만, 민지의 침묵이 며칠 갔다.","new":"\"이번엔 속도가 중요해. 강우 방식으로 가자.\" 민지가 입을 다물었다. 검문소는 무사히 뚫었지만, 민지는 창밖만 바라봤다."},{"id":"ev_comp_argument","path":["choices",2,"out",0,"text"],"old":"\"안전이 먼저야. 돌아가자.\" 강우가 헛웃음을 지었다. \"…뭐, 대장이 그렇다면.\" 돌아가는 길은 멀었지만 아무도 다치지 않았다. 강우가 며칠 말이 없었다.","new":"\"안전이 먼저야. 돌아가자.\" 강우가 헛웃음을 지었다. \"…뭐, 대장이 그렇다면.\" 돌아가는 길은 멀었지만 아무도 다치지 않았다. 강우는 더 말하지 않고 창밖을 봤다."},{"id":"ev_cinema_film","path":["choices",1,"out",0,"text"],"old":"민지가 예비 전력으로 영사기를 살렸다. 캄캄한 상영관에 빛이 쏘아지고— 오래된 영화가 스크린에 흘렀다.\n\n팝콘까지 튀겨 진짜 극장처럼 봤다. 대사 반쯤 끊기고 화면이 튀어도, 다들 넋을 잃고 봤다. 여러 해 만의 영화관. 잊지 못할 밤이었다.","new":"민지가 예비 전력으로 영사기를 살렸다. 캄캄한 상영관에 빛이 쏘아지고— 오래된 영화가 스크린에 흘렀다.\n\n팝콘까지 튀겨 진짜 극장처럼 봤다. 대사 반쯤 끊기고 화면이 튀어도, 다들 넋을 잃고 봤다. 여러 해 만의 영화관. 잊지 못할 시간이었다."},{"id":"near_jinju_lantern","path":["choices",0,"out",0,"text"],"old":"\"축제 때 등 만들던 사람이에요.\" 노인이 한지와 대살을 내밀었다. \"혼자 띄우면 등이고, 여럿이 띄우면 축제지.\"\n\n\"이거 어느 쪽이 앞이에요?\"\n\n\"앞뒤는 없어요. 불만 안 닿으면 돼요.\"\n\n서툰 손으로 하나씩 만들어 강에 놓았다. 우리 등 다섯(플러스 개 발자국 찍힌 것 하나)이 노인의 등들과 합류해 하류로 흘렀다.\n\n\"소원은 적었어요?\" \"네.\" \"그럼 됐네요. 강이 배달해 주니까.\"","new":"\"축제 때 등 만들던 사람이에요.\" 노인이 한지와 대살을 내밀었다. \"혼자 띄우면 등이고, 여럿이 띄우면 축제지.\"\n\n\"이거 어느 쪽이 앞이에요?\"\n\n\"앞뒤는 없어요. 불만 안 닿으면 돼요.\"\n\n서툰 손으로 하나씩 만들어 강에 놓았다. 우리가 만든 등들이 노인의 등들과 합류해 하류로 흘렀다.\n\n\"소원은 적었어요?\" \"네.\" \"그럼 됐네요. 강이 배달해 주니까.\""},{"id":"talk_jy_04","path":["text"],"old":"재이의 전리품 자루가 터지기 직전이다. 짐칸 정리 얘기가 나온 지 사흘째다.\n\n\"버리는 게 제일 어려워요, 이 직업은.\"","new":"재이의 전리품 자루가 터지기 직전이다. 짐칸을 정리하자는 얘기가 나왔다.\n\n\"버리는 게 제일 어려워요, 이 직업은.\""},{"id":"rq_eunsu_join","path":["text"],"old":"은수는 수신기를 오래 듣는다. 좌표는 남아 있지만, 무엇을 하라는 승인음은 오지 않는다.\n\n\"서울까지 가면 이런 신호를 더 많이 만나겠죠. …더 많이 만날 거예요. 그건 짐작이고.\"\n\n\"그래서 은수 씨가 필요해요. 같이 갈래요?\"\n\n은수는 수신기를 끄고 헤드폰을 벗는다. 이번에는 화면 대신 나를 본다.\n\n\"갈게요. 다만 관제센터에서 일했다는 이유로 바로 믿지는 마세요. 이상하면 묻고, 내가 모른다고 하면 같이 확인해요.\"\n\n\"결정도 같이 하고요.\"\n\n그제야 은수가 장비 가방을 닫는다. 닫고 나서, 고정 끈을 내민다.\n\n\"좋아요. 그럼 수신기는 여기 묶어도 돼요?\"","new":"은수는 수신기를 오래 듣는다. 잡음이 오가지만, 무엇을 하라는 승인음은 오지 않는다.\n\n\"서울까지 가면 이런 신호를 더 많이 만나겠죠. …더 많이 만날 거예요. 그건 짐작이고.\"\n\n\"그래서 은수 씨가 필요해요. 같이 갈래요?\"\n\n은수는 수신기를 끄고 헤드폰을 벗는다. 이번에는 화면 대신 나를 본다.\n\n\"갈게요. 다만 관제센터에서 일했다는 이유로 바로 믿지는 마세요. 이상하면 묻고, 내가 모른다고 하면 같이 확인해요.\"\n\n\"결정도 같이 하고요.\"\n\n그제야 은수가 장비 가방을 닫는다. 닫고 나서, 고정 끈을 내민다.\n\n\"좋아요. 그럼 수신기는 여기 묶어도 돼요?\""},{"id":"exp_radioshop","path":["choices",0,"out",0,"text"],"old":"진공관, 배선, 콘덴서. 오래된 장비를 살릴 수 있는 귀한 부품들이다.\n\n계산대 아래에 굴러다니던 고철도 챙겼다. \"수리비는 형편껏\" 팻말은 그 자리에 뒀다.","new":"배선, 콘덴서. 오래된 장비를 살릴 수 있는 귀한 부품들이다.\n\n계산대 아래에 굴러다니던 고철도 챙겼다. \"수리비는 형편껏\" 팻말은 그 자리에 뒀다."}];
  for(const change of cycle15Copy){
    let value=event(change.id);for(const key of change.path)value=value[key];assert.equal(value,change.new,change.id+' exact cycle15 copy');
  }
  {
    const out=rows.find(r=>r.id==='comp_dialect').choices[0].out[0],authored=event('comp_dialect').choices[0].out[0].turns;
    assert.equal(hash(authored),'5255e3ceb035d68c79c18c1f2b961c208d51c5926e9935003c6adc1447cba127');
    assert.deepEqual(out.turns,authored.map(t=>({kind:t.kind,who:t.who})));out.turns=[];
  }
  // Cycle14 systems pair audit: exact role/copy changes, retaining earlier reviewed routes.
  const cycle14SystemsPairs=[{"id":"pair_leo_jy_1","choices":[{"i":0,"o":0,"speakers":["jaeyi","jaeyi","leo","jaeyi","leo","jaeyi"]}]},{"id":"pair_leo_jy_2","choices":[{"i":0,"o":0,"speakers":["leo","jaeyi","jaeyi","leo","leo","jaeyi","jaeyi","leo"]}]},{"id":"pair_leo_es_1","choices":[{"i":0,"o":0,"speakers":["eunsu","eunsu","leo","eunsu"],"oldSpeakers":["eunsu","eunsu","leo","eunsu"]}],"entry":["leo","leo","eunsu","leo"]},{"id":"pair_jy_es_1","choices":[{"i":0,"o":0,"speakers":["eunsu","jaeyi","eunsu","jaeyi"]}]},{"id":"pair_jy_es_2","choices":[{"i":0,"o":0,"speakers":["eunsu","eunsu","jaeyi","jaeyi","eunsu","jaeyi"]}],"entry":["jaeyi","jaeyi","eunsu","jaeyi","eunsu"]}];
  for(const spec of cycle14SystemsPairs){
    const row=rows.find(r=>r.id===spec.id);
    if(spec.entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.entry,spec.id+' pair entry');row.speakers=spec.oldEntry;}
    for(const c of spec.choices){const out=row.choices[c.i].out[c.o];assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),c.speakers,spec.id+'.'+c.i+'.'+c.o);out.speakers=c.oldSpeakers;}
  }
  const cycle14SystemsPairCopy=[{"id":"pair_leo_jy_2","path":["choices",0,"out",0,"text"],"old":"\"하모니카 기증할게요. 관람객이 불어볼 수 있게요. 물건은 쓰여야 사니까.\"\n\n재이가 얼마간 있다 답했다. \"…그럼 저는 창고 열쇠요. 옆에 걸어둘게요.\"\n\n\"전시명은요?\"\n\n\"전시명은—\"\n\n둘이 동시에 말했다. \"'잘 부는 노래 하나면 충분하다'.\" \"'줍는 순간 물건이 된다'.\"\n\n\"…….\"\n\n\"…둘 다 걸죠.\"\n\n전시명이 두 줄인 코너가 기획됐다. 개관일은 안 정했고, 소장품은 두 점이 됐다.","new":"\"하모니카 기증할게요. 관람객이 불어볼 수 있게요. 물건은 쓰여야 사니까.\"\n\n재이가 얼마간 있다 답했다. \"…그럼 저는 창고 열쇠요. 옆에 걸어둘게요.\"\n\n\"전시명은요?\"\n\n\"전시명은—\"\n\n둘이 동시에 말했다. \"'잘 부는 노래 하나면 충분하다'.\" \"'줍는 순간 물건이 된다'.\"\n\n\"…….\"\n\n\"…둘 다 걸죠.\"\n\n전시명이 두 줄인 코너가 기획됐다. 개관일은 안 정했고, 전시할 물건 두 점을 정했다."},{"id":"pair_leo_jy_2","path":["choices",0,"out",0,"fx","note","body"],"old":"소장 확정: 하모니카(체험형)+창고 열쇠. 전시명 두 줄(아빠가 둘이라서).","new":"기증 예정: 하모니카(체험형)+창고 열쇠. 전시명 두 줄(아빠가 둘이라서)."},{"id":"pair_jy_es_1","path":["choices",0,"out",0,"text"],"old":"즉석 협약이 체결됐다. 보통 물건 박물관 별관, 「보통 소리 전시관」. 초대 관장은 은수.\n\n소장 목록 1호부터 정했다. 빗소리 잡음, 새벽 주파수, 그리고 \"달구지 엔진 소리(2번 실린더 포함)\".\n\n\"입장료는요?\"\n\n\"소리 하나 기부요. 자기가 좋아하는 소리.\"\n\n\"그건 어떻게 받아요? 담아 올 통이 있어야 하잖아요.\"\n\n\"…받는 방법은 개관 전까지 생각할게요.\"\n\n개관 전까지 생각할 게 아직 많았다.","new":"즉석 협약이 체결됐다. 보통 물건 박물관 별관, 「보통 소리 전시관」. 초대 관장은 은수.\n\n소장 목록 1호부터 정했다. 빗소리 잡음, 새벽 주파수, 그리고 「달구지 엔진 소리(2번 실린더 포함)」.\n\n\"입장료는요?\"\n\n\"소리 하나 기부요. 자기가 좋아하는 소리.\"\n\n\"그건 어떻게 받아요? 담아 올 통이 있어야 하잖아요.\"\n\n\"…받는 방법은 개관 전까지 생각할게요.\"\n\n개관 전까지 생각할 게 아직 많았다."},{"id":"pair_jy_es_2","path":["choices",0,"out",0,"fx","note","body"],"old":"못 찾는 동안은 잃어버린 게 아니라 보관 중. 창고 이론의 위로. 교본 외 문장 2호.","new":"못 찾는 동안은 잃어버린 게 아니라 보관 중. 창고 이론의 위로. 교본 밖의 문장."}];
  for(const change of cycle14SystemsPairCopy){
    let value=event(change.id);for(const key of change.path)value=value[key];assert.equal(value,change.new,change.id+' exact pair copy');
  }
  {
    const out=rows.find(r=>r.id==='pair_jy_es_1').choices[0].out[0];
    assert.equal(out.q,4);out.q=5; // Inline catalogue item now uses corner brackets, not dialogue marks.
  }
  // Reviewed clarity choices, kept separate from confirmed natural-reader defects.
  {
    const row=rows.find(r=>r.id==='talk_mj_19');
    assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),['minji','minji']);row.speakers=undefined;
    for(const [i,speakers] of [[0,['minji','minji','me','minji']],[1,['minji','me','minji']]]){
      assert.deepEqual(JSON.parse(JSON.stringify(row.choices[i].out[0].speakers)),speakers);
      row.choices[i].out[0].speakers=undefined;
    }
    const out=rows.find(r=>r.id==='talk_kw_05').choices[1].out[0];
    assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),['kangwoo','me','kangwoo','kangwoo','me','kangwoo','kangwoo']);out.speakers=undefined;
  }
  // Cycle14: explicit natural-reader findings and the separately recorded 48-event personal audit.
  const cycle14StoryReaderRoutes=[{"id":"route_ridge_anchor","choices":[{"i":0,"o":0,"speakers":[]},{"i":0,"o":1,"speakers":[]},{"i":1,"o":0,"speakers":["me"]},{"i":1,"o":1,"speakers":["me"]},{"i":2,"o":0,"speakers":[]},{"i":2,"o":1,"speakers":[]}],"entry":[{"who":"passer_man","name":"아래의 남자"},"me",{"who":"passer_man","name":"아래의 남자"}]},{"id":"route_ridge_extract","choices":[{"i":0,"o":0,"speakers":[{"who":"passer_child","name":"구조된 아이"}]},{"i":0,"o":1,"speakers":[{"who":"passer_woman","name":"발목을 다친 여자"}]},{"i":0,"o":2,"speakers":[{"who":"passer_woman","name":"발목을 다친 여자"}]},{"i":1,"o":0,"speakers":[]},{"i":1,"o":1,"speakers":[{"who":"passer_woman","name":"발목을 다친 여자"}]},{"i":1,"o":2,"speakers":[{"who":"passer_woman","name":"발목을 다친 여자"}]}],"entry":[{"who":"passer_woman","name":"발목을 다친 여자"},"me","me",{"who":"passer_woman","name":"발목을 다친 여자"},"me"]},{"id":"loc_mungyeong","choices":[{"i":0,"o":0,"speakers":[]}]},{"id":"talk_es_13","choices":[{"i":0,"o":0,"speakers":["eunsu","me","eunsu","eunsu","eunsu"]}]},{"id":"pair_mj_es_1","choices":[{"i":0,"o":0,"speakers":[{"kind":"narration","who":"sys"},{"kind":"narration","who":"sys"},{"kind":"narration","who":"sys"},"eunsu","minji","eunsu","minji","eunsu"]}],"entry":["eunsu","minji","eunsu","eunsu"]},{"id":"talkr_es_3","choices":[{"i":0,"o":0,"speakers":["eunsu","eunsu","me","eunsu","eunsu"]}]},{"id":"comp_tire_class","choices":[{"i":0,"o":0,"speakers":["minji","me","minji","me","minji"]}]},{"id":"ev_comp_birthday","choices":[{"i":0,"o":0,"speakers":["me","minji","me","minji","minji","minji"]}]},{"id":"talk_mj_02","choices":[{"i":0,"o":0,"speakers":["minji","minji","minji"]},{"i":1,"o":0,"speakers":["minji","minji"]}]},{"id":"talk_mj_18","choices":[{"i":1,"o":0,"speakers":["minji","minji","me","minji","me","minji","minji"]}]},{"id":"talk_es_10","choices":[{"i":0,"o":0,"speakers":["eunsu","eunsu","me","eunsu","eunsu"]}]},{"id":"talk_es_16","choices":[{"i":1,"o":0,"speakers":["eunsu","eunsu","eunsu","eunsu","me","eunsu"]}]},{"id":"talk_es_17","choices":[{"i":0,"o":0,"speakers":["eunsu","eunsu","eunsu"]}]}];
  for(const spec of cycle14StoryReaderRoutes){
    const row=rows.find(r=>r.id===spec.id);
    if(spec.entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.entry,spec.id+' entry');row.speakers=spec.oldEntry;}
    for(const c of spec.choices){
      const out=row.choices[c.i].out[c.o];assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),c.speakers,spec.id+'.'+c.i+'.'+c.o);
      out.speakers=c.oldSpeakers;
    }
  }
  {
    const row=rows.find(r=>r.id==='loc_mungyeong'),authored=event('loc_mungyeong').turns;
    assert.equal(hash(authored),'119f13f56ac4addc08c5c12ef074a5a47135d2c72b7ddc0c26d53a93bec5c443');
    assert.deepEqual(row.turns,authored.map(t=>({kind:t.kind,who:t.who})));
    row.turns=[];
  }
  // Free exits added after reviewed voluntary-cost gates contain no new dialogue.
  // Cycle12 actual-reader evidence: only these new source/speaker routes are
  // projected onto their previously unspecified metadata; text and counts remain guarded.
  const cycle12ReaderRoutes=[{"id":"lc_busan_dried","entry":[{"who":"passer_woman","name":"자갈치 아지매"}],"choices":[{"i":0,"o":0,"speakers":[{"who":"passer_woman","name":"자갈치 아지매"},"me",{"who":"passer_woman","name":"자갈치 아지매"},"me",{"who":"passer_woman","name":"자갈치 아지매"}]},{"i":1,"o":0,"speakers":[{"who":"passer_woman","name":"자갈치 아지매"}]}]},{"id":"npc_taeho_2","choices":[{"i":0,"o":0,"speakers":["taeho","me","taeho","taeho","taeho"]}]},{"id":"seoul_base","choices":[{"i":3,"o":0,"speakers":["me"]}]},{"id":"seoul_han","choices":[{"i":0,"o":0,"speakers":["me"]},{"i":2,"o":0,"speakers":[{"kind":"record","who":"record","name":"김 선장의 해도"},"me"]},{"i":3,"o":0,"speakers":["kangwoo","kangwoo"]}]},{"id":"gw_daegwallyeong","entry":[{"kind":"record","who":"record","name":"대관령 위령비"},{"who":"sanjigi","name":"산지기"}],"choices":[{"i":0,"o":0,"speakers":[{"who":"sanjigi","name":"산지기"},{"who":"sanjigi","name":"산지기"}]},{"i":1,"o":0,"speakers":[{"who":"sanjigi","name":"산지기"},{"who":"sanjigi","name":"산지기"},"me",{"who":"sanjigi","name":"산지기"}]}]},{"id":"camp_visitor","entry":["me",{"who":"passer_elder","name":"걷는 노인"},{"who":"passer_elder","name":"걷는 노인"}],"choices":[{"i":1,"o":0,"speakers":[{"who":"passer_elder","name":"걷는 노인"}]},{"i":0,"o":0,"speakers":[{"who":"passer_elder","name":"걷는 노인"},"me",{"who":"passer_elder","name":"걷는 노인"},{"who":"passer_elder","name":"걷는 노인"}]}]},{"id":"route_mid_fork","choices":[{"i":1,"o":0,"speakers":["me"]},{"i":0,"o":0,"speakers":["me"]}]},{"id":"talk_mj_16","choices":[{"i":0,"o":0,"speakers":["me","minji"]}]},{"id":"talk_mj_21","entry":["minji","minji"],"choices":[]},{"id":"talk_mj_18","choices":[{"i":0,"o":0,"speakers":["minji","me","minji","minji","minji","me","minji"]}]},{"id":"talk_bori_03","entry":["leo","leo","me","leo"],"choices":[{"i":0,"o":0,"speakers":["leo","me","leo","me","leo"]}]},{"id":"talk_pss_12","choices":[{"i":1,"o":0,"speakers":["me","parkss","me","parkss"]}]},{"id":"seoul_base","choices":[{"i":2,"o":0,"speakers":["me","me","minji","minji","me","minji"]}]},{"id":"lc_daejeon_bakery","choices":[{"i":0,"o":1,"speakers":[{"kind":"record","who":"record","name":"내가 남긴 분필 답글","medium":"paper"}]}]},{"id":"gp_envelope","choices":[{"i":0,"o":0,"speakers":[{"kind":"record","who":"record","name":"할아버지의 쪽지","medium":"paper"}]}]},{"id":"near_geochang_actor","entry":[{"who":"passer_man","name":"연습 중인 배우"}],"choices":[]}];
  const cycle12SystemsReaderRoutes=[
    {id:'npc_jaepil_2',choices:[{i:0,o:0,speakers:['jaepil','jaepil','me','jaepil','jaepil']}]},
    {id:'npc_miyoung_2',entry:['me'],choices:[
      {i:0,o:0,speakers:['miyoung','miyoung','me','miyoung','miyoung']},
      {i:1,o:0,speakers:['miyoung','miyoung']}]},
    {id:'exp_arcade',choices:[{i:1,o:0,speakers:['me']}]},
    {id:'lc_jeonju_bibim',entry:Array(2).fill({who:'passer_woman',name:'비빔밥 요리사'}),
      choices:[{i:0,o:0,speakers:['me',{who:'passer_woman',name:'비빔밥 요리사'}]}]},
    {id:'salvage_claim',choices:[{i:0,o:0,speakers:[
      {who:'passer_man',name:'남자'},'me',{who:'passer_man',name:'남자'},
      {who:'passer_worker',name:'옆의 사람'},{who:'passer_man',name:'남자'}]}]},
    {id:'cell_ghost_meet',entry:[{who:'radio',kind:'radio',name:'통신국 스피커'},
      {who:'radio',kind:'radio',name:'유령 통신원'}],choices:[
      {i:0,o:0,speakers:Array(4).fill({who:'radio',kind:'radio',name:'유령 통신원'})}]},
  ];
  for(const spec of [...cycle12ReaderRoutes,...cycle12SystemsReaderRoutes]){
    const row=rows.find(r=>r.id===spec.id);
    if(spec.entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.entry,spec.id+' entry route');row.speakers=undefined;}
    for(const c of spec.choices){
      const out=row.choices[c.i].out[c.o];
      assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),c.speakers,spec.id+'.'+c.i+'.'+c.o);
      out.speakers=undefined;
    }
  }
  // Cycle13: new actual-reader speaker/source metadata; all source prose stays guarded.
  const cycle13ReaderRoutes=[
    {
      "id": "talk_jy_16",
      "choices": [
        {
          "i": 1,
          "o": 0,
          "speakers": [
            "jaeyi",
            "jaeyi",
            "me",
            "jaeyi",
            "jaeyi"
          ]
        }
      ]
    },
    {
      "id": "talk_jy_08",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "jaeyi",
            "jaeyi",
            "jaeyi"
          ]
        }
      ]
    },
    {
      "id": "npc_drhan_2",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "drhan",
            "drhan",
            "me",
            "drhan"
          ]
        }
      ]
    },
    {
      "id": "cleaners_recall",
      "choices": [
        {
          "i": 1,
          "o": 0,
          "speakers": [
            {
              "who": "passer_man",
              "name": "회수조 선두"
            },
            {
              "who": "passer_man",
              "name": "회수조 선두"
            },
            {
              "who": "passer_man",
              "name": "회수조 선두"
            }
          ]
        }
      ]
    },
    {
      "id": "exp_ricemill",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            {
              "kind": "record",
              "who": "record",
              "name": "내가 남긴 방앗간 쪽지",
              "medium": "paper"
            }
          ]
        }
      ]
    },
    {
      "id": "talk_jy_02",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "jaeyi",
            "jaeyi",
            "jaeyi",
            "jaeyi"
          ]
        }
      ]
    },
    {
      "id": "talkr_pss_1",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "parkss",
            "parkss",
            "parkss",
            "me",
            "parkss"
          ]
        }
      ]
    },
    {
      "id": "seoul_base",
      "choices": [
        {
          "i": 1,
          "o": 0,
          "speakers": [
            {
              "kind": "record",
              "who": "record",
              "name": "할아버지의 쪽지",
              "medium": "paper"
            },
            {
              "kind": "record",
              "who": "record",
              "name": "할아버지의 쪽지",
              "medium": "paper"
            }
          ]
        }
      ]
    },
    {
      "id": "talk_jy_18",
      "entry": [
        "jaeyi",
        "jaeyi",
        "jaeyi"
      ],
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "jaeyi",
            "jaeyi",
            "me",
            "jaeyi",
            "jaeyi",
            "jaeyi"
          ]
        },
        {
          "i": 1,
          "o": 0,
          "speakers": [
            "jaeyi",
            "me",
            "jaeyi"
          ]
        }
      ]
    },
    {
      "id": "talk_jy_03",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "jaeyi",
            "jaeyi",
            "jaeyi"
          ]
        }
      ]
    },
    {
      "id": "talkr_es_1",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "eunsu",
            "me",
            "eunsu",
            "eunsu"
          ]
        }
      ]
    },
    {
      "id": "seoul_ruins",
      "choices": [
        {
          "i": 1,
          "o": 0,
          "speakers": [
            "eunsu",
            "me",
            "eunsu",
            "eunsu",
            "me",
            "eunsu",
            "eunsu"
          ]
        }
      ]
    },
    {
      "id": "talkr_leo_3",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "leo"
          ]
        }
      ]
    }
  ];
  // Explicit outcome isolation for earlier entry routes; these preserve the
  // already-correct rendering and are not five additional natural findings.
  cycle13ReaderRoutes.push(
    {id:'camp_visitor',choices:[{i:0,o:1,speakers:[]}]},
    {id:'near_geochang_actor',choices:[
      {i:0,o:0,speakers:[{who:'passer_man',name:'연습 중인 배우'}]},
      {i:1,o:0,speakers:[]}]},
    {id:'talk_mj_21',choices:[{i:0,o:0,speakers:['minji','minji']},{i:1,o:0,speakers:['minji']}]});
  cycle13ReaderRoutes.push({"id":"near_hapcheon_sutra","entry":[{"who":"passer_monk","name":"목판 옮기는 스님"},{"who":"passer_monk","name":"목판 옮기는 스님"}],"choices":[{"i":0,"o":0,"speakers":["me",{"who":"passer_monk","name":"목판 옮기는 스님"},"me",{"who":"passer_monk","name":"목판 옮기는 스님"},{"who":"passer_monk","name":"목판 옮기는 스님"},{"who":"passer_monk","name":"목판 옮기는 스님"},{"who":"passer_monk","name":"목판 옮기는 스님"}]},{"i":1,"o":0,"speakers":[{"who":"passer_monk","name":"목판 옮기는 스님"}]},{"i":2,"o":0,"speakers":[]}]});
  for(const spec of cycle13ReaderRoutes){
    const row=rows.find(r=>r.id===spec.id);
    if(spec.entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.entry,spec.id+' entry route');row.speakers=undefined;}
    for(const c of spec.choices){
      const out=row.choices[c.i].out[c.o];
      assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),c.speakers,spec.id+'.'+c.i+'.'+c.o);
      out.speakers=undefined;
    }
  }
  // Systems-owned routes are compared with the retained cycle13 source first.
  // Existing Minji script entries project back to their exact former routes.
  const cycle13SystemsReaderRoutes=[
    {
      "id": "camp_thief",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "me"
          ]
        },
        {
          "i": 0,
          "o": 1,
          "speakers": [
            "me"
          ]
        },
        {
          "i": 1,
          "o": 0,
          "speakers": [
            "me"
          ]
        }
      ]
    },
    {
      "id": "lc_ulsan_whale",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "me",
            "me",
            {
              "who": "passer_elder",
              "name": "노인"
            },
            {
              "who": "passer_elder",
              "name": "노인"
            }
          ]
        }
      ],
      "entry": [
        {
          "who": "passer_elder",
          "name": "노인"
        },
        {
          "who": "passer_elder",
          "name": "노인"
        }
      ]
    },
    {
      "id": "cell_dome_meet",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            {
              "who": "hayeosa",
              "name": "하 여사"
            },
            {
              "who": "hayeosa",
              "name": "하 여사"
            },
            {
              "who": "hayeosa",
              "name": "하 여사"
            },
            {
              "who": "hayeosa",
              "name": "하 여사"
            }
          ]
        }
      ],
      "entry": [
        {
          "who": "hayeosa",
          "name": "장부를 쓰는 여자"
        }
      ]
    },
    {
      "id": "lc_daegu_makchang",
      "choices": [
        {
          "i": 1,
          "o": 0,
          "speakers": [
            "party_first"
          ]
        }
      ]
    },
    {
      "id": "near_muju_firefly",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "party_first"
          ]
        }
      ]
    },
    {
      "id": "comp_window_draw",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "party_first"
          ]
        },
        {
          "i": 1,
          "o": 0,
          "speakers": [
            "party_first"
          ]
        }
      ]
    },
    {
      "id": "comp_nickname",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": []
        }
      ],
      "entry": [
        "party_first"
      ]
    },
    {
      "id": "comp_wordchain",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            "party_first",
            "me",
            "party_first",
            "me",
            "party_first",
            "me"
          ]
        },
        {
          "i": 0,
          "o": 1,
          "speakers": [
            "party_first",
            "me",
            "party_first",
            "me"
          ]
        },
        {
          "i": 1,
          "o": 0,
          "speakers": [
            "party_first",
            "party_second",
            "party_first",
            "party_second"
          ]
        }
      ],
      "entry": [
        "party_first",
        "party_second",
        "party_first",
        "party_second",
        "party_first",
        "party_second",
        "party_first",
        "party_second",
        "party_first",
        "party_second"
      ]
    },
    {
      "id": "lc_jeonju_bibim",
      "choices": [
        {
          "i": 1,
          "o": 0,
          "speakers": []
        }
      ]
    },
    {
      "id": "rq_minji_task",
      "choices": [
        {
          "i": 0,
          "o": 0,
          "speakers": [
            {
              "who": "mingyu",
              "kind": "radio",
              "name": "민규의 녹음"
            },
            "minji"
          ],
          "oldSpeakers": [
            "mingyu",
            "minji"
          ]
        },
        {
          "i": 1,
          "o": 0,
          "speakers": [
            "minji",
            {
              "who": "mingyu",
              "kind": "radio",
              "name": "민규의 녹음"
            },
            "minji"
          ],
          "oldSpeakers": [
            "minji",
            "mingyu",
            "minji"
          ]
        },
        {
          "i": 2,
          "o": 0,
          "speakers": [
            "minji",
            {
              "who": "mingyu",
              "kind": "radio",
              "name": "민규의 녹음"
            },
            "minji"
          ],
          "oldSpeakers": [
            "minji",
            "mingyu",
            "minji"
          ]
        }
      ]
    },
    {
      "id": "rq_minji_follow",
      "choices": [],
      "entry": [
        {
          "who": "mingyu",
          "kind": "radio",
          "name": "민규의 녹음"
        },
        "minji",
        "minji",
        "minji"
      ],
      "oldEntry": [
        "mingyu",
        "minji",
        "minji",
        "minji"
      ]
    }
  ];
  for(const spec of cycle13SystemsReaderRoutes){
    const row=rows.find(r=>r.id===spec.id);
    if(spec.entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),spec.entry,spec.id+' entry route');row.speakers=spec.oldEntry;}
    for(const c of spec.choices){
      const out=row.choices[c.i].out[c.o];
      assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),c.speakers,spec.id+'.'+c.i+'.'+c.o);
      out.speakers=c.oldSpeakers;
    }
  }
  // Inline word/callsign labels use brackets; actual spoken text is unchanged.
  const wordchainLabel=rows.find(r=>r.id==='comp_wordchain').choices[0].out[0];
  assert.equal(wordchainLabel.q,6);
  assert.match(event('comp_wordchain').choices[0].out[0].text,/^「름」 폭탄이 나오고 「슭」 폭탄이 나오고,/);
  wordchainLabel.q=7; // The old minimum-length regex counted text between one-letter quotes.
  const nicknameLabel=rows.find(r=>r.id==='comp_nickname').choices[0].out[0];
  assert.equal(nicknameLabel.q,0);
  assert.match(event('comp_nickname').choices[0].out[0].text,/콜사인이 「달구지 원」으로 정해진/);
  nicknameLabel.q=1;
  const naming=rows.find(r=>r.id==='comp_naming'),namingSource=event('comp_naming').choices[0].out[0].turns;
  assert.deepEqual(Array.from(naming.speakers),['party_first']);naming.speakers=undefined;
  assert.equal(naming.choices[0].out[0].turns,'dynamic');
  assert.equal(hash(namingSource.toString()),'a6222c260daa7e34ba5cf8354f184ec0720e55c2fe08965952a46eaeace04ee7');
  for(const party of [['minji','eunsu'],['parkss','jaeyi'],['kangwoo','leo','eunsu']]){
    const rendered=Array.from(namingSource({party}));
    assert.deepEqual(rendered.filter(t=>t.kind==='dialogue').map(t=>t.who),
      [party[0],party[1],party[0],party[1],party[0],party[1],'me']);
    assert.deepEqual(rendered.filter(t=>t.kind==='dialogue').map(t=>t.text),
      ['흥부놀부.','왜요?','둘이 붙어 다니잖아.','그건 형제고 와이퍼는 그냥 두 갠데—','그럼 뭐 할 건데.','…흥부놀부요.','할아버지 오늘 컨디션 어때?']);
    assert(rendered.some(t=>t.kind==='narration'&&t.text==='엔진은 만장일치로 "할아버지"가 됐다. 아무도 이유를 설명하지 않았고, 설명할 필요도 없었다.'));
  }
  naming.choices[0].out[0].turns=[];
  for(const[id,oldCount]of [['meet_barber',2],['ev_tunnel_warehouse',2],['circus_broke',3],['kids_meet',2],['lc_damyang_juktong',1],['ev_hunter_meat',3]]){
    const row=rows.find(r=>r.id===id);assert.equal(row.choices.length,oldCount+1);
    const exit=row.choices.pop();assert.equal(exit.q,0);assert.equal(exit.out.length,1);
    assert.equal(exit.out[0].q,0);assert.equal(exit.out[0].speakers,undefined);assert.deepEqual(Array.from(exit.out[0].turns),[]);
  }
  const home=rows.find(row=>row.id==='seoul_session_reset').choices[0].out[0];
  // V11-05: a solo fisher's release comment belongs to the player, not an
  // unintroduced anonymous passer-by. Preserve the older corpus projection.
  const fishRelease=rows.find(row=>row.id==='exp_fishfarm').choices[0].out[1];
  assert.equal(fishRelease.q,1);
  assert.deepEqual(Array.from(fishRelease.speakers),['me']);
  fishRelease.speakers=undefined;
  const parkWater=rows.find(row=>row.id==='talk_pss_19').choices[1].out[0];
  assert.equal(parkWater.q,4);
  assert.deepEqual(Array.from(parkWater.speakers),['parkss','me','parkss','parkss']);
  parkWater.speakers=undefined;
  const recruiterGift=rows.find(row=>row.id==='cult_recruiter').choices[1].out[0];
  const believer={who:'passer_refugee',name:'흰옷의 신도'};
  assert.equal(recruiterGift.q,6);
  assert.deepEqual(JSON.parse(JSON.stringify(recruiterGift.speakers)),[believer,'me',believer,believer,'me',believer]);
  recruiterGift.speakers=undefined;
  const pilgrim={who:'passer_refugee',name:'앞선 신도'};
  const leader={who:'passer_man',name:'검은 완장 대장'};
  for(const [id,entry,routes] of [
    ['ev_pilgrims_white',[pilgrim],[[pilgrim,pilgrim,'me',pilgrim],['parkss','me','parkss','parkss']]],
    ['ev_cult_opposite',[{who:'passer_man',name:'검은 완장의 남자'}],[['me',leader],['jaeyi',leader,'jaeyi']]],
  ]){
    const row=rows.find(r=>r.id===id);
    assert.equal(row.q,entry.length);
    assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),entry);
    row.speakers=undefined;
    routes.forEach((route,i)=>{
      const out=row.choices[i].out[0];
      assert.equal(out.q,route.length);
      assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),route);
      out.speakers=undefined;
    });
  }
  const shop=rows.find(row=>row.id==='mansu_opening');
  const dj={who:'passer_woman',name:'DJ'},djRadio={who:'radio',kind:'radio',name:'새벽 두 시의 DJ'};
  for(const [id,entry,routes] of [
    ['dj_meet',[dj,dj],[Array(5).fill(dj),Array(2).fill(dj)]],
    ['ev_radio_dj_signal',[djRadio],[[djRadio],['minji','me','minji','minji']]],
  ]){
    const row=rows.find(r=>r.id===id);
    assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),entry);
    row.speakers=id==='ev_radio_dj_signal'?[{...djRadio,name:'자정의 라디오 DJ'}]:undefined;
    routes.forEach((route,i)=>{
      assert.deepEqual(JSON.parse(JSON.stringify(row.choices[i].out[0].speakers)),route);
      row.choices[i].out[0].speakers=id==='ev_radio_dj_signal'?
        (i===0?[{...djRadio,name:'자정의 라디오 DJ'}]:route):undefined;
    });
  }
  assert.equal(shop.choices.length,2);
  const greeting=shop.choices.pop().out[0];assert.equal(greeting.q,3);
  assert.deepEqual(JSON.parse(JSON.stringify(greeting.speakers)),[
    {who:'mansu',name:'만수'},{who:'record',kind:'record',name:'홍보 문구'},{who:'mansu',name:'만수'}]);
  const radio={who:'radio',kind:'radio',name:'숫자 방송'};
  for(const [id,entry,routes] of [
    ['freq_triangulate',[radio],[[{who:'record',kind:'record',name:'중계기 옆 글씨'}],['eunsu','eunsu']]],
    ['freq_source',[radio],[Array(3).fill({who:'record',kind:'record',name:'L의 편지'}),[radio]]],
    ['freq_L2',null,[[{who:'radio',kind:'radio',name:'녹음된 목소리'},
      {who:'radio',kind:'radio',name:'녹음된 목소리'},
      {who:'record',kind:'record',name:'릴에 남긴 글씨'}]]],
  ]){
    const row=rows.find(r=>r.id===id);
    if(entry){assert.deepEqual(JSON.parse(JSON.stringify(row.speakers)),entry);row.speakers=undefined;}
    routes.forEach((route,index)=>{
      const out=row.choices[index].out[0];
      assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),route);out.speakers=undefined;
    });
    if(id==='freq_source'){assert.equal(row.choices[0].out[0].q,3);row.choices[0].out[0].q=0;}
  }
  const rounds=rows.find(row=>row.id==='duo_nightround');
  assert.equal(rounds.q,3);assert.deepEqual(Array.from(rounds.speakers),['kangwoo','parkss','kangwoo']);
  assert.equal(rounds.choices[0].out[0].q,8);
  assert.deepEqual(Array.from(rounds.choices[0].out[0].speakers),['parkss','kangwoo','parkss','kangwoo','parkss','kangwoo','parkss','kangwoo']);
  rounds.speakers=undefined;rounds.choices[0].out[0].speakers=undefined;
  const speakerReturn=rows.find(row=>row.id==='mansu_revenge');
  for(const [index,route] of [[1,['me',{who:'passer_man',name:'강도'},'me',{who:'passer_man',name:'강도'}]],[2,['me']]]){
    const out=speakerReturn.choices[index].out[0];
    assert.equal(out.q,route.length);
    assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),route);
    out.speakers=undefined;
  }
  const detour=rows.find(row=>row.id==='conflict_fuel_detour');
  assert.equal(detour.q,7);
  assert.deepEqual(JSON.parse(JSON.stringify(detour.speakers)),[
    {who:'passer_child',name:'소년'},'me',{who:'passer_child',name:'소년'},'kangwoo','parkss','kangwoo','parkss']);
  detour.speakers=undefined;
  for(const [index,route] of [[1,['me','me','parkss']],[2,['me','parkss','kangwoo']],[3,['me','parkss','kangwoo']]]){
    const out=detour.choices[index].out[0];assert.equal(out.q,3);
    assert.deepEqual(Array.from(out.speakers),route);out.speakers=undefined;
  }
  assert.equal(detour.choices.length,4);detour.choices.pop();
  const hose=rows.find(row=>row.id==='crisis_hose');
  assert.equal(hose.choices.length,3);assert.equal(hose.choices[2].out[0].q,0);hose.choices.pop();
  for(const [id,route] of [['conflict_silent_cab',['me','parkss','kangwoo']],['conflict_campfire',['kangwoo','parkss']]]){
    const row=rows.find(row=>row.id===id);assert.equal(row.choices.length,2);
    assert.equal(row.choices[1].out[0].q,route.length);
    assert.deepEqual(Array.from(row.choices[1].out[0].speakers),route);row.choices.pop();
  }
  const photographer=rows.find(row=>row.id==='meet_photographer');
  const photographerRoute=[{who:'passer_elder',name:'사진사'},'me',{who:'passer_elder',name:'사진사'}];
  assert.equal(photographer.q,3);assert.equal(photographer.choices[0].out[0].q,3);
  assert.deepEqual(JSON.parse(JSON.stringify(photographer.speakers)),photographerRoute);
  assert.deepEqual(JSON.parse(JSON.stringify(photographer.choices[0].out[0].speakers)),photographerRoute);
  assert.deepEqual(JSON.parse(JSON.stringify(photographer.choices[1].out[0].speakers)),[{who:'passer_elder',name:'사진사'}]);
  photographer.speakers=undefined;photographer.choices[0].out[0].speakers=undefined;
  photographer.choices[1].out[0].speakers=undefined;
  const deliveredPhoto=rows.find(row=>row.id==='photo_delivered');
  assert.equal(deliveredPhoto.q,2);assert.equal(deliveredPhoto.choices[0].out[0].q,4);
  assert.deepEqual(JSON.parse(JSON.stringify(deliveredPhoto.speakers)),Array(2).fill({who:'passer_man',name:'사진 전달자'}));
  assert.deepEqual(JSON.parse(JSON.stringify(deliveredPhoto.choices[0].out[0].speakers)),[
    {who:'record',kind:'record',name:'사진 속 외침'},'me','me',{who:'record',kind:'record',name:'사진 뒷면 글씨'}]);
  deliveredPhoto.speakers=undefined;deliveredPhoto.choices[0].out[0].speakers=undefined;
  const library=rows.find(row=>row.id==='lc_sejong_library').choices[0].out[0];
  assert.equal(library.q,1);assert.deepEqual(Array.from(library.speakers),['me']);
  library.speakers=undefined;
  const parcel=rows.find(row=>row.id==='parcel_found');
  assert.equal(parcel.q,4);
  assert.deepEqual(JSON.parse(JSON.stringify(parcel.speakers)),['me',{who:'passer_man',name:'아이의 아버지'},'me',{who:'passer_man',name:'아이의 아버지'}]);
  assert.equal(parcel.choices[0].out[0].q,2);
  assert.deepEqual(JSON.parse(JSON.stringify(parcel.choices[0].out[0].speakers)),[{who:'passer_woman',name:'아이의 어머니'},'me']);
  parcel.speakers=undefined;parcel.choices[0].out[0].speakers=undefined;
  const levy=rows.find(row=>row.id==='levy_office').choices[2].out[1];
  assert.equal(levy.q,0); // No imagined speech by a possibly unmet Park.
  levy.q=1; // Project only this reviewed removal onto the original corpus.
  const microphone=rows.find(row=>row.id==='talk_es_20');
  assert.deepEqual(Array.from(microphone.speakers),['eunsu']);microphone.speakers=undefined;
  for(const [i,route] of [['0',['eunsu','me','eunsu','me','eunsu','me']],['1',['me','eunsu','me']]]){
    const out=microphone.choices[i].out[0];
    assert.equal(out.q,route.length);assert.deepEqual(Array.from(out.speakers),route);
    out.speakers=undefined;
  }
  microphone.choices[1].out[0].q=5; // Formerly three absent companions answered.
  assert.equal(home.q,0);assert.equal(home.turns,'dynamic');
  assert.deepEqual(Array.from(D.finaleReturnTurns({flags:{mother_broadcast_ready:true}})
    .filter(t=>t.kind==='dialogue'),t=>t.who),['mother','me','mother','me','mother']);
  home.q=1; // Old inline style="color:..." was counted as a quote, not dialogue.
  // The upper-network reveal uses terminal records, not a sleeping core's
  // speech. Northern replacement prose owns its turns; untouched quotations
  // retain the original parser/role mapping. Check every exception before
  // projecting it onto the legacy hash, keeping all other events protected.
  for(const [id,count,speakers] of [
    ['talk_leo_08',3,['leo','leo','leo']],
    ['pair_leo_es_1',4,['eunsu','eunsu','leo','eunsu']],
    ['talk_es_15',5,['eunsu','me','eunsu','eunsu','eunsu']],
    ['talk_kw_03',5,['me','kangwoo','me','kangwoo','kangwoo']],
    ['talk_es_12',5,['eunsu','eunsu','me','eunsu','eunsu']],
    ['react_mass_mj',8,['minji','minji','minji','minji']],
    ['react_mass_kw',5,['kangwoo','kangwoo','me','kangwoo','kangwoo']],
    ['react_mass_jy',6,['jaeyi','jaeyi','me','jaeyi','jaeyi','jaeyi']],
    ['react_mass_es',5,['eunsu','eunsu','me','eunsu','eunsu']],
    ['react_seoul_mj',7,['minji','minji','minji','minji']],
    ['react_seoul_kw',5,['kangwoo','me','kangwoo','kangwoo','kangwoo']],
    ['react_seoul_pss',8,['parkss','parkss','me','parkss','parkss','me','parkss','parkss']],
    ['react_resist_es',7,['eunsu','eunsu','me','eunsu','eunsu','eunsu','eunsu']]]){
    const out=rows.find(row=>row.id===id).choices[0].out[0];
    assert.equal(out.q,count);
    assert.deepEqual(Array.from(out.speakers),speakers);
    out.speakers=undefined; // Newly explicit routes; real-reader tests cover both Minji branches.
  }
  const sunrise=rows.find(row=>row.id==='talk_es_12');
  assert.equal(sunrise.q,3);
  assert.deepEqual(Array.from(sunrise.speakers),['eunsu','me','eunsu']);
  sunrise.speakers=undefined;
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
  const guardedCopy=rows.find(row=>row.id==='main_recovery_story_parent_route_guarded').choices[1].out[0];
  assert.equal(guardedCopy.q,0);assert.equal(guardedCopy.turns,'dynamic');
  guardedCopy.turns=[];
  const video=rows.find(row=>row.id==='main_recovery_story_family_principle');
  const recoveredKey=rows.find(row=>row.id==='main_recovery_story_family_key');
  assert.equal(recoveredKey.q,6);
  assert.deepEqual(Array.from(recoveredKey.speakers),Array.from(event('story_family_key').turnSpeakers));
  assert.deepEqual(recoveredKey.turns,[]);
  recoveredKey.q=0;recoveredKey.speakers=undefined;
  recoveredKey.turns=Array.from({length:3},()=>({kind:'narration',who:undefined}));
  assert.equal(video.q,12);assert.deepEqual(Array.from(video.speakers),
    ['father','mother','father','mother','father','mother','father','mother','father','mother','father','mother']);
  assert.deepEqual(video.turns,[]);
  video.speakers=undefined;
  video.turns=event(video.id).text.split('\n\n').map(()=>({kind:'narration',who:undefined}));
  const cache=rows.find(row=>row.id==='main_recovery_story_personal_cache');
  assert.equal(cache.turns.length,3);
  assert.deepEqual(JSON.parse(JSON.stringify(cache.turns[2])),{kind:'narration'});
  assert.match(event(cache.id).turns[2].text,/열쇠고리.*손바닥/);
  cache.turns.pop(); // reviewed physical pause, no new quotation
  const father=rows.find(row=>row.id==='parents_father_last_log');
  assert.equal(father.turns.length,9);
  assert(father.turns.slice(-2).every(turn=>turn.kind==='narration'&&turn.who===undefined));
  assert.match(event(father.id).turns[7].text,/다음 장.*다시 돌아왔다/);
  assert.match(event(father.id).turns[8].text,/연필.*쓰지 못했다/);
  father.turns.splice(-2); // two reviewed silent grief beats, not new quote roles
  assert.match(event(father.id).turns[0].text,/엄마.*화물차.*빠져나왔다/);
  father.turns.shift(); // reviewed extra escape beat; all other roles stay fixed
  assert.match(event(father.id).turns[3].text,/잠시 멎었지만.*코어는 남아 있었다/);
  father.turns.splice(2,1); // temporary line interruption is not control of the core
  const fatherCopy=rows.find(row=>row.id==='main_recovery_parents_father_last_log');
  assert.equal(fatherCopy.turns.length,10);
  assert.deepEqual(Array.from(fatherCopy.turns,turn=>turn.kind),
    ['narration','narration','narration','record','narration','narration','record','narration','narration','narration']);
  assert(event(fatherCopy.id).turns.filter(turn=>turn.kind==='record')
    .every(turn=>turn.who==='father'&&turn.name==='남산 유지실 출력 사본'));
  assert.match(event(fatherCopy.id).turns[1].text,/화물차.*빠져나왔다/);
  fatherCopy.turns=[{kind:'narration',who:undefined},{kind:'narration',who:undefined}];
  // Only this reviewed recovery now retains the source's record roles and grief.
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
  // Ten-persona continuity fixes: assert only these reviewed changes before
  // projecting onto the unchanged corpus baseline. Runtime rosters/receipts
  // are exercised separately in test_persona_continuity.cjs.
  const inscription=rows.find(row=>row.id==='loc_mungyeong').choices[0].out[0];
  assert.equal(inscription.q,0);assert.equal(inscription.speakers,undefined);
  inscription.q=5; // four ghost replies + a written quote are now narration
  const agreement=rows.find(row=>row.id==='pair_mj_kw_1').choices[0].out[0];
  assert.equal(agreement.q,7);
  assert.deepEqual(Array.from(agreement.speakers),['me','kangwoo','minji','kangwoo','minji','minji','kangwoo']);
  agreement.q=5;agreement.speakers=undefined;
  const watchProposal=rows.find(row=>row.id==='seoul_costs').choices[2].out[0];
  assert.equal(watchProposal.q,1);assert.equal(watchProposal.turns,'dynamic');
  assert.strictEqual(event('seoul_costs').choices[2].out[0].turns,D.coreWatchProposalTurns);
  watchProposal.q=2;watchProposal.turns=[];
  // A stationary notebook lesson now records an intention, not a completed
  // descent and its one quoted player verdict. All other routes stay guarded.
  const descent=rows.find(row=>row.id==='gp_note2').choices[0].out[0];
  assert.equal(descent.q,0);assert.equal(descent.speakers,undefined);descent.q=1;
  // Continued branch play: solo oil-smelling is narration, and an unpowered
  // jammer has only the player's line, not an AI reaction or stranger speaker.
  const smell=rows.find(row=>row.id==='exp_ricemill').choices[1].out[0];
  assert.equal(smell.q,0);assert.equal(smell.speakers,undefined);smell.q=1;
  const battery=rows.find(row=>row.id==='seoul_base').choices[5].out[0];
  assert.equal(battery.q,1);assert.deepEqual(JSON.parse(JSON.stringify(battery.speakers)),['me']);
  battery.q=3;battery.speakers=undefined;
  // Bori's presence must not make the dog speak Leo's origin/attachment lines.
  const leoOrigin=rows.find(row=>row.id==='ev_leo_solo');
  assert.equal(leoOrigin.q,4);assert.deepEqual(Array.from(leoOrigin.speakers),Array(4).fill('leo'));
  leoOrigin.speakers=undefined;
  for(const [index,route] of [[0,['me','leo','leo','me','leo','leo']],[1,['leo','leo']]]){
    const out=leoOrigin.choices[index].out[0];
    assert.equal(out.q,route.length);assert.deepEqual(Array.from(out.speakers),route);out.speakers=undefined;
  }
  // Actual parser regressions cover these newly explicit consecutive voices.
  for(const [id,entry,result] of [
    ['pair_mj_pss_1',['minji','minji','parkss','minji','parkss','minji'],['minji','parkss','minji','parkss','minji','parkss','minji','minji','parkss']],
    ['pair_pss_leo_2',['leo'],['parkss','leo','parkss','leo','parkss','leo']],
    ['talk_pss_18',['parkss'],['parkss','me','parkss','parkss']]]){
    const row=rows.find(r=>r.id===id);
    assert.equal(row.q,entry.length);assert.deepEqual(Array.from(row.speakers),entry);row.speakers=undefined;
    const out=row.choices[0].out[0];
    assert.equal(out.q,result.length);assert.deepEqual(Array.from(out.speakers),result);out.speakers=undefined;
  }
  const omija=rows.find(r=>r.id==='near_mungyeong_omija').choices[0].out[0];
  assert.equal(omija.q,4);assert.deepEqual(JSON.parse(JSON.stringify(omija.speakers)),
    ['me',{who:'passer_woman',name:'오미자 할머니'},'me',{who:'passer_woman',name:'오미자 할머니'}]);
  omija.q=5;omija.speakers=undefined;
  const grandma={who:'passer_woman',name:'오미자 할머니'},stall=rows.find(r=>r.id==='near_mungyeong_omija');
  assert.deepEqual(JSON.parse(JSON.stringify(stall.speakers)),[grandma,grandma]);stall.speakers=undefined;
  assert.deepEqual(JSON.parse(JSON.stringify(stall.choices[1].out[0].speakers)),[grandma]);stall.choices[1].out[0].speakers=undefined;
  const prescription=rows.find(r=>r.id==='talk_pss_18').choices[1].out[0];
  assert.equal(prescription.q,5);assert.deepEqual(Array.from(prescription.speakers),['me','parkss','me','parkss','parkss']);prescription.speakers=undefined;
  const praise=rows.find(r=>r.id==='talk_mj_15').choices[0].out[0];
  assert.equal(praise.q,4);assert.deepEqual(Array.from(praise.speakers),['minji','minji','me','minji']);praise.speakers=undefined;
  const reeds=rows.find(r=>r.id==='loc_suncheon').choices[0].out[0];
  assert.equal(reeds.q,0);assert.equal(reeds.speakers,undefined);reeds.q=5;
  const dome=rows.find(r=>r.id==='cell_dome_meet').choices[0].out[0];
  assert.equal(dome.q,6);dome.q=5; // One narrow, actually-present guest alternative.
  // R4-10 splits Kangwoo's interpretation and present-safety caveat into two
  // lines by the same speaker. No new actor or whole-corpus baseline change.
  const graffiti=rows.find(r=>r.id==='ev_resistance_graffiti').choices[0].out[0];
  assert.equal(graffiti.q,2);assert.deepEqual(Array.from(graffiti.speakers),['kangwoo','kangwoo']);
  graffiti.q=1;graffiti.speakers=undefined;
  // R5/R6: explicit bakery records/roster turns and zero-resource exits.
  const bakery=rows.find(r=>r.id==='lc_daejeon_bakery');
  assert.deepEqual(JSON.parse(JSON.stringify(bakery.turns)),[{kind:'narration'},{kind:'record',who:'record'}]);
  assert.equal(bakery.choices[0].out[0].turns,'dynamic');assert.equal(bakery.choices[0].out[0].q,1);
  bakery.turns=[];bakery.choices[0].out[0].turns=[];bakery.choices[0].out[0].q=5;
  for(const id of ['comp_water_fight','lc_suwon_galbi','exp_outdoor']){
    const row=rows.find(r=>r.id===id),exit=row.choices.pop();
    assert.deepEqual(JSON.parse(JSON.stringify(exit)),{q:0,out:[{q:0,turns:[]}]});
  }
  const singular=rows.find(r=>r.id==='seoul_core').choices[1].out[0];
  assert.equal(singular.q,7);assert.deepEqual(Array.from(singular.speakers),['me','me']);singular.q=6;
  // Cycle 7: one redundant Jaeyi quote branch disappeared with the invented
  // relic layout. The surviving three human lines follow the current roster.
  const traces=rows.find(r=>r.id==='seoul_core').choices[3].out[0];
  assert.equal(traces.q,10);assert.deepEqual(Array.from(traces.speakers),['jaeyi','me','me']);
  assert.deepEqual(Array.from(traces.turns),[]);
  for(const party of [[],['jaeyi']])assert.deepEqual(Array.from(D.finaleSpeakers('seoul_core',3,{party})),
    [party.length?'jaeyi':'me','me','me']);
  traces.q=11;
  // Regional repair: appended silent exits and the driver's ruins question only.
  for(const id of ['lc_gunsan_bakery','lc_cheonan_walnut','lc_jeonju_bibim','lc_andong_fish','lc_icheon_rice','near_hapcheon_sutra']){
    const exit=rows.find(r=>r.id===id).choices.pop();
    assert.deepEqual(JSON.parse(JSON.stringify(exit)),{q:0,out:[{q:0,turns:[]}]});
  }
  const ruins=rows.find(r=>r.id==='seoul_ruins').choices[0].out[0];
  assert.deepEqual(Array.from(ruins.speakers),['me']);assert.equal(ruins.turns,'dynamic');
  ruins.speakers=undefined;ruins.turns=[];
  // Discovery repair: two new silent no-cost exits, no quote/role baseline reset.
  for(const id of ['exp_underground','loc_danyang']){
    const exit=rows.find(r=>r.id===id).choices.pop();
    assert.deepEqual(JSON.parse(JSON.stringify(exit)),{q:0,out:[{q:0,turns:[]}]});
  }
  const danyang=rows.find(r=>r.id==='loc_danyang');
  assert.equal(danyang.q,3);assert.deepEqual(JSON.parse(JSON.stringify(danyang.speakers)),[
    {who:'passer_elder',name:'강변의 노인'},{who:'passer_elder',name:'강변의 노인'},{who:'passer_elder',name:'다른 노인'}]);
  danyang.speakers=undefined;
  for(const [i,route]of [[0,['me',{who:'passer_elder',name:'나룻배의 노인'}]],
    [1,[{who:'passer_elder',name:'마늘을 파는 노인'},'me',{who:'passer_elder',name:'마늘을 파는 노인'}]]]){
    const out=danyang.choices[i].out[0];assert.equal(out.q,route.length);
    assert.deepEqual(JSON.parse(JSON.stringify(out.speakers)),route);out.speakers=undefined;
  }
  // QA cycle: a no-supply refusal adds one Leo line after the two legacy choices.
  const leoPause=rows.find(r=>r.id==='initiative_leo_pause');
  assert.equal(leoPause.choices.length,3);
  assert.deepEqual(JSON.parse(JSON.stringify(leoPause.choices.pop())),{q:0,out:[{q:1,turns:[]}]});
  for(const [id,route] of [['talk_leo_14',['me','leo','me','leo','leo']],['talk_leo_21',['leo','leo','me','leo']]]){
    const out=rows.find(r=>r.id===id).choices[0].out[0];
    assert.deepEqual(Array.from(out.speakers),route);
    assert.equal(out.q,route.length);out.speakers=undefined;
  }
  const pilotAppeal=rows.find(r=>r.id==='pair_leo_es_2').choices[0].out[0];
  assert.equal(pilotAppeal.q,6);
  assert.deepEqual(JSON.parse(JSON.stringify(pilotAppeal.speakers)),[
    {who:'record',kind:'record',name:'기장님께 보내는 사연'},'eunsu','leo','leo','eunsu','leo']);
  pilotAppeal.speakers=undefined;
  const lampRoom=rows.find(r=>r.id==='ev_lighthouse_visit');
  assert.equal(lampRoom.q,0);
  assert.match(event(lampRoom.id).text,/등대지기가 주등 옆의 작은 비상등/);
  lampRoom.q=1; // The keeper's old spoken request is now narrated without changing its role.
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
  assert.match(event('talk_es_16').choices[1].out[0].text,/요즘은 어느 쪽으로 불러요/);
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
