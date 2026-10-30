/* Explicitly reviewed mechanics deltas, projected onto older corpus baselines.
   Assert each new contract before removing it; never accept a new blanket hash. */
const assert=require('node:assert/strict');
function projectReviewedVoluntaryCosts(rows){
  // 2026-10-26: individually reproduced voluntary payments, never all negative FX.
  const costs={
    seoul_square:[[2,{food:1}]],ev_parkss_past:[[2,{water:1}]],ev_heatwave:[[1,{water:2}]],
    loc_tower:[[1,{scrap:3}]],exp_temple:[[1,{scrap:1}]],meet_barber:[[1,{scrap:1}]],
    meet_paper_grandma:[[1,{scrap:3}]],lc_pohang_gwamegi:[[0,{scrap:2}]],lc_mokpo_hongeo:[[1,{scrap:2}]],
    ev_fake_checkpoint:[[2,{scrap:5}]],ev_water_seller:[[1,{scrap:4}]],ev_tunnel_warehouse:[[0,{scrap:5}],[1,{scrap:3}]],
    ev_caravan_traders:[[2,{scrap:5}]],ev_beekeeper:[[1,{scrap:4}]],ev_optician:[[1,{scrap:3}]],
    react_resist_jaeyi:[[1,{scrap:2}]],road_mid_rest_kitchen:[[1,{scrap:2}]],
    road_north_roadside_greenhouse:[[0,{water:2}]],road_north_fortress_fires:[[1,{fuel:2}]],
    meet_wedding:[[0,{food:1}]],meet_monk:[[0,{water:1}]],meet_bike_pilgrims:[[1,{water:2}]],
    meet_doljanchi:[[1,{food:1}]],meet_ring:[[1,{water:1}]],wx_underpass:[[0,{food:1}]],
    meet_southbound:[[1,{water:1}]],circus_broke:[[2,{food:1,water:1}]],meet_runner:[[1,{water:1}]],
    comp_cookoff:[[0,{food:1}]],talkr_bori_2:[[0,{food:1}]],world_resistance_supply_resentment:[[1,{food:3,fuel:3}]],
    // Independently reproduced story-owner additions retain the emergency free option.
    kids_meet:[[0,{food:2}],[1,{food:2}]],comp_sick:[[1,{water:3}]],
    // Net-positive barter still requires the can handed over before two are received.
    lc_damyang_juktong:[[0,{food:1}]],ev_hunter_meat:[[2,{food:1}]],meet_popper:[[0,{food:1}]]
  };
  const prior={seoul_square:{flag:'sotgot_word'},ev_heatwave:{comp:'parkss'},meet_barber:{dog:1},ev_water_seller:{comp:'parkss'},ev_caravan_traders:{comp:'kangwoo'},
    ev_beekeeper:{comp:'parkss'},ev_optician:{comp:'parkss'},comp_sick:{comp:'parkss'}};
  const exits={meet_barber:2,ev_tunnel_warehouse:2,circus_broke:3,kids_meet:2,lc_damyang_juktong:1,ev_hunter_meat:3};
  for(const row of rows){
    for(const[index,cost]of costs[row.id]||[]){
      assert.deepEqual(JSON.parse(JSON.stringify(row.choices[index].req)),{...prior[row.id],...cost});
      if(prior[row.id])row.choices[index].req={...prior[row.id]};else delete row.choices[index].req;
    }
    if(row.id==='lc_pohang_gwamegi'){
      assert.deepEqual(JSON.parse(JSON.stringify(row.choices[0].foreseeable)),{expense:'고철 1~2 · 맛보기 전에 2 필요'});
      delete row.choices[0].foreseeable;
    }
    if(Object.hasOwn(exits,row.id)){
      assert.equal(row.choices.length,exits[row.id]+1);
      const exit=row.choices.pop();
      const mechanics=JSON.parse(JSON.stringify(exit,(key,value)=>
        ['text','label','turnSpeakers','turns','readingRecord','note'].includes(key)?undefined:value));
      assert.deepEqual(mechanics,{out:[{p:1,fx:{}}]});
    }
  }
  return rows;
}
function projectExpeditionStoryChanges(rows){
  const oilmill=rows.find(r=>r.id==='exp_oilmill')?.choices[0]?.out[0];
  if(oilmill&&Object.hasOwn(oilmill,'text')){
    assert.equal(oilmill.text,'참기름 두 병. 액체 황금이다.\n\n다음 식사 때 통조림 비빔밥에 참기름 한 바퀴를 두를 생각에, 전원이 국적을 되찾은 표정을 지었다.');
    oilmill.text='참기름 두 병. 액체 황금이다.\n\n그날 저녁 통조림 비빔밥에 참기름 한 바퀴가 둘렸다. 전원이 국적을 되찾은 표정을 지었다.';
  }
  const cycle17PhotoCopy=[{"id":"comp_polaroid","path":["text"],"old":"사진관에서 챙긴 즉석카메라. 필름이 아직 남아 있다.\n\n창밖 풍경이 유난히 좋은 오후다. 한 장 쓸까?","new":"사진관에서 챙긴 즉석카메라. 필름이 아직 남아 있다.\n\n창밖 풍경이 눈에 들어온다. 한 장 쓸까?"},{"id":"comp_polaroid","path":["choices",0,"out",0,"text"],"old":"노을과 폐허와 도로가 한 장에 담겼다. 세상이 망가진 방식조차 가끔은 아름답다는 게 억울했다.\n\n사진 뒷면에 날짜와 위치를 적어 상자에 넣었다. 여행의 물성이 하나 늘었다.","new":"하늘과 폐허와 도로가 한 장에 담겼다. 세상이 망가진 방식조차 가끔은 아름답다는 게 억울했다.\n\n사진 뒷면에 날짜와 위치를 적어 상자에 넣었다. 여행의 물성이 하나 늘었다."},{"id":"comp_polaroid","path":["choices",0,"out",0,"fx","note","body"],"old":"노을과 폐허와 도로. 망가진 방식조차 가끔 아름다워서 억울했다.","new":"하늘과 폐허와 도로. 망가진 방식조차 가끔 아름다워서 억울했다."},{"id":"comp_polaroid","path":["choices",1,"out",0,"text"],"old":"찰칵 소리에 깬 피사체가 격노했다. 사진 속 얼굴은 처참했고, 그래서 전원이 손을 들어 명작 판정을 내렸았다.\n\n선바이저의 가족사진 옆에 나란히 꽂혔다.","new":"찰칵 소리에 깬 피사체가 격노했다. 사진 속 얼굴은 처참했고, 그래서 전원이 손을 들어 명작 판정을 내렸다.\n\n선바이저의 가족사진 옆에 나란히 꽂혔다."},{"id":"exp_photostudio","path":["choices",0,"out",0,"text"],"old":"배경지 앞에 다 같이 섰다. 어색하게. 누가 시키지도 않았는데 제일 좋은 옷매무새로.\n\n찰칵. 위이잉—\n\n사진이 흔들리며 나왔다. 못 나온 사람이 반, 눈 감은 사람이 반. 다시 찍자는 사람은 없었다. 이게 우리니까.\n\n사진은 조수석 선바이저에 꽂았다. 달구지의 가족사진이다.","new":"배경지 앞에 다 같이 섰다. 어색하게. 누가 시키지도 않았는데 제일 좋은 옷매무새로.\n\n찰칵. 위이잉—\n\n사진이 흔들리며 나왔다. 못 나온 사람이 반, 눈 감은 사람이 반. 다시 찍자는 사람은 없었다. 이게 우리니까.\n\n사진은 조수석 선바이저에 꽂았다. 달구지의 가족사진이다. 카메라와 남은 필름도 함께 챙겼다."}];
  for(const change of cycle17PhotoCopy){
    let owner=rows.find(r=>r.id===change.id);for(const key of change.path.slice(0,-1))owner=owner?.[key];
    const key=change.path.at(-1);if(owner&&Object.hasOwn(owner,key)){assert.equal(owner[key],change.new,change.id+' exact photo copy');owner[key]=change.old;}
  }
  const nearSeoulSign=rows.find(r=>r.id==='ev_near_seoul_sign')?.choices[0]?.out[0];
  if(nearSeoulSign&&Object.hasOwn(nearSeoulSign,'text')){
    assert.equal(nearSeoulSign.text,'차를 세우고 부산에서 여기까지 함께 넘어온 얼굴들을 봤다.\n\n"…여기까지 왔네." 누군가 말했다.\n\n"뭐라고?"\n\n"여기까지 왔다고."\n\n"…어."\n\n길에서 만난 손들이 내 손 위로 포개졌다. 두려움은 그대로 둔 채 다시 시동을 걸었다.');
    nearSeoulSign.text='차를 세우고 부산에서 여기까지 함께 넘어온 얼굴들을 봤다.\n\n"…여기까지 왔네." 누군가 말했다.\n\n"뭐라고?"\n\n"여기까지 왔다고."\n\n"…어."\n\n손이 하나씩 포개졌다. 출발 때 있던 손이 몇 개 빠졌고, 그때 없던 손이 몇 개 얹혔다. 두려움은 그대로 둔 채 다시 시동을 걸었다.';
  }
  const hongeo=rows.find(r=>r.id==='lc_mokpo_hongeo')?.choices[0]?.out[0];
  if(hongeo&&Object.hasOwn(hongeo,'text')){
    assert.equal(hongeo.text,"한 입에 눈물, 또 한 입에 기침. 그런데…\"어? 이거 은근…?\"\n\n결국 한 사람이 접시를 비웠다. 아짐이 박수를 쳤다. \"인자 목포 사람 다 됐네!\"\n\n합격자에겐 막걸리 반 잔, 불합격자에겐 김치가 위로로 지급됐다.");
    hongeo.text="첫 번째: 눈물. 두 번째: 기침. 세 번째: …\"어? 이거 은근…?\"\n\n세 번째 사람이 접시를 비웠다. 아짐이 박수를 쳤다. \"인자 목포 사람 다 됐네!\"\n\n합격자에겐 막걸리 반 잔, 불합격자에겐 김치가 위로로 지급됐다.";
  }
  const templeBell=rows.find(r=>r.id==='ev_temple_bell')?.choices[0]?.out[1];
  if(templeBell&&Object.hasOwn(templeBell,'text')){
    assert.equal(templeBell.text,"종소리가 너무 멀리 퍼졌다. 절에서 내려오는 길에, 그 소리를 듣고 찾아온 생존자 가족을 만났다. \"종소리 나는 쪽에 사람 있을 줄 알았어요.\" 뜻밖의 인연이 됐다.");
    templeBell.text="종소리가 너무 멀리 퍼졌다. 며칠 뒤, 그 소리를 듣고 찾아온 생존자 가족을 만났다. \"종소리 나는 쪽에 사람 있을 줄 알았어요.\" 뜻밖의 인연이 됐다.";
  }
  const cycle17Copy=[{"id":"crisis_battery","path":["choices",0,"out",0,"text"],"old":"전원 하차. \"하나, 둘, 셋!\"\n\n내리막까지 30m를 밀었다. 클러치를 붙이자 엔진이 부르릉 살아났다. 운전석에 올라탄 뒤에야 할아버지 수첩의 문장이 떠올랐다. 「밀어서도 걸리는 차를 타라.」\n\n대답할 숨은 없었다. 범퍼에 기대 한동안 웃기만 했다.","new":"전원 하차. \"하나, 둘, 셋!\"\n\n내리막까지 30m를 밀고 나는 운전석에 올라탔다. 동료들이 뒤에서 한 번 더 밀자 클러치를 붙였고, 엔진이 부르릉 살아났다. 할아버지 수첩의 문장이 떠올랐다. 「밀어서도 걸리는 차를 타라.」\n\n동료들은 대답할 숨도 없었다. 범퍼에 기대 한동안 웃다가 다시 올라탔다."},{"id":"comp_cloudgame","path":["choices",0,"out",0,"text"],"old":"다음 구름, 그다음 구름으로 연장전이 이어졌다. 드래곤은 이견이 없었고, 세탁기는 삼 대 일이었다.\n\n그다음 것에서 누가 \"할아버지 옆모습\"이라고 했다. 반박이 안 나왔다.\n\n그 뒤로 꽤 오래 아무도 다음 구름을 고르지 않았다.","new":"다음 구름, 그다음 구름으로 연장전이 이어졌다. 드래곤은 이견이 없었고, 세탁기는 표가 갈렸다.\n\n그다음 것에서 누가 \"할아버지 옆모습\"이라고 했다. 반박이 안 나왔다.\n\n그 뒤로 꽤 오래 아무도 다음 구름을 고르지 않았다."}];
  for(const change of cycle17Copy){
    let owner=rows.find(r=>r.id===change.id);for(const key of change.path.slice(0,-1))owner=owner?.[key];
    const key=change.path.at(-1);if(owner&&Object.hasOwn(owner,key)){assert.equal(owner[key],change.new,change.id+' exact cycle17 copy');owner[key]=change.old;}
  }
  const departureEcho=rows.find(r=>r.id==='story_bridge_departure_echo');
  if(departureEcho&&Object.hasOwn(departureEcho,'scene')){
    assert.equal(departureEcho.scene,'story-roadside-terminal-detail-v2');
    departureEcho.scene='story-bridge-departure-echo-v1';
  }
  projectReviewedVoluntaryCosts(rows);
  const squareNote=rows.find(r=>r.id==='seoul_square')?.choices[2]?.out[0]?.fx?.note;
  if(squareNote && Object.hasOwn(squareNote,'links')){assert.deepEqual(Array.from(squareNote.links),['솥','정리자들']);squareNote.links=['솥','정리자들','남산행 편지'];}
  const envelope=rows.find(r=>r.id==='gp_envelope')?.choices[1]?.out[0];
  if(envelope&&Object.hasOwn(envelope,'text')){
    assert.equal(envelope.text,'봉투를 수첩 뒤에 도로 꽂았다. 남산 보고 열라면, 남산 보고 연다.\n\n수첩을 덮고도 시선이 다시 뒷표지로 갔다. 봉투를 꽂은 자리가 살짝 불룩했다.');
    envelope.text='봉투를 수첩 뒤에 도로 꽂았다. 남산 보고 열라면, 남산 보고 연다.\n\n그날 이후 수첩이 전보다 자주 눈에 들어왔다. 뒷표지가 살짝 불룩한 것도.';
  }
  const busNote=rows.find(r=>r.id==='meet_bus')?.choices[0]?.out[0]?.fx?.note;
  if(busNote&&Object.hasOwn(busNote,'body')){
    assert.equal(busNote.body,'전주 서문의 진료 버스를 지키던 전직 약사. 구미 쪽 진료소로 따뜻해지기 전에 약을 옮겨야 한다.');
    busNote.body='전주 서문의 진료 버스를 지키던 전직 약사. 구미 쪽 진료소로 식기 전 약을 옮겨야 한다.';
  }
  const cycle15Copy=[{"id":"ev_comp_argument","path":["choices",1,"out",0,"text"],"old":"\"이번엔 속도가 중요해. 강우 방식으로 가자.\" 민지가 입을 다물었다. 검문소는 무사히 뚫었지만, 민지의 침묵이 며칠 갔다.","new":"\"이번엔 속도가 중요해. 강우 방식으로 가자.\" 민지가 입을 다물었다. 검문소는 무사히 뚫었지만, 민지는 창밖만 바라봤다."},{"id":"ev_comp_argument","path":["choices",2,"out",0,"text"],"old":"\"안전이 먼저야. 돌아가자.\" 강우가 헛웃음을 지었다. \"…뭐, 대장이 그렇다면.\" 돌아가는 길은 멀었지만 아무도 다치지 않았다. 강우가 며칠 말이 없었다.","new":"\"안전이 먼저야. 돌아가자.\" 강우가 헛웃음을 지었다. \"…뭐, 대장이 그렇다면.\" 돌아가는 길은 멀었지만 아무도 다치지 않았다. 강우는 더 말하지 않고 창밖을 봤다."},{"id":"ev_cinema_film","path":["choices",1,"out",0,"text"],"old":"민지가 예비 전력으로 영사기를 살렸다. 캄캄한 상영관에 빛이 쏘아지고— 오래된 영화가 스크린에 흘렀다.\n\n팝콘까지 튀겨 진짜 극장처럼 봤다. 대사 반쯤 끊기고 화면이 튀어도, 다들 넋을 잃고 봤다. 여러 해 만의 영화관. 잊지 못할 밤이었다.","new":"민지가 예비 전력으로 영사기를 살렸다. 캄캄한 상영관에 빛이 쏘아지고— 오래된 영화가 스크린에 흘렀다.\n\n팝콘까지 튀겨 진짜 극장처럼 봤다. 대사 반쯤 끊기고 화면이 튀어도, 다들 넋을 잃고 봤다. 여러 해 만의 영화관. 잊지 못할 시간이었다."},{"id":"near_jinju_lantern","path":["choices",0,"out",0,"text"],"old":"\"축제 때 등 만들던 사람이에요.\" 노인이 한지와 대살을 내밀었다. \"혼자 띄우면 등이고, 여럿이 띄우면 축제지.\"\n\n\"이거 어느 쪽이 앞이에요?\"\n\n\"앞뒤는 없어요. 불만 안 닿으면 돼요.\"\n\n서툰 손으로 하나씩 만들어 강에 놓았다. 우리 등 다섯(플러스 개 발자국 찍힌 것 하나)이 노인의 등들과 합류해 하류로 흘렀다.\n\n\"소원은 적었어요?\" \"네.\" \"그럼 됐네요. 강이 배달해 주니까.\"","new":"\"축제 때 등 만들던 사람이에요.\" 노인이 한지와 대살을 내밀었다. \"혼자 띄우면 등이고, 여럿이 띄우면 축제지.\"\n\n\"이거 어느 쪽이 앞이에요?\"\n\n\"앞뒤는 없어요. 불만 안 닿으면 돼요.\"\n\n서툰 손으로 하나씩 만들어 강에 놓았다. 우리가 만든 등들이 노인의 등들과 합류해 하류로 흘렀다.\n\n\"소원은 적었어요?\" \"네.\" \"그럼 됐네요. 강이 배달해 주니까.\""},{"id":"talk_jy_04","path":["text"],"old":"재이의 전리품 자루가 터지기 직전이다. 짐칸 정리 얘기가 나온 지 사흘째다.\n\n\"버리는 게 제일 어려워요, 이 직업은.\"","new":"재이의 전리품 자루가 터지기 직전이다. 짐칸을 정리하자는 얘기가 나왔다.\n\n\"버리는 게 제일 어려워요, 이 직업은.\""},{"id":"rq_eunsu_join","path":["text"],"old":"은수는 수신기를 오래 듣는다. 좌표는 남아 있지만, 무엇을 하라는 승인음은 오지 않는다.\n\n\"서울까지 가면 이런 신호를 더 많이 만나겠죠. …더 많이 만날 거예요. 그건 짐작이고.\"\n\n\"그래서 은수 씨가 필요해요. 같이 갈래요?\"\n\n은수는 수신기를 끄고 헤드폰을 벗는다. 이번에는 화면 대신 나를 본다.\n\n\"갈게요. 다만 관제센터에서 일했다는 이유로 바로 믿지는 마세요. 이상하면 묻고, 내가 모른다고 하면 같이 확인해요.\"\n\n\"결정도 같이 하고요.\"\n\n그제야 은수가 장비 가방을 닫는다. 닫고 나서, 고정 끈을 내민다.\n\n\"좋아요. 그럼 수신기는 여기 묶어도 돼요?\"","new":"은수는 수신기를 오래 듣는다. 잡음이 오가지만, 무엇을 하라는 승인음은 오지 않는다.\n\n\"서울까지 가면 이런 신호를 더 많이 만나겠죠. …더 많이 만날 거예요. 그건 짐작이고.\"\n\n\"그래서 은수 씨가 필요해요. 같이 갈래요?\"\n\n은수는 수신기를 끄고 헤드폰을 벗는다. 이번에는 화면 대신 나를 본다.\n\n\"갈게요. 다만 관제센터에서 일했다는 이유로 바로 믿지는 마세요. 이상하면 묻고, 내가 모른다고 하면 같이 확인해요.\"\n\n\"결정도 같이 하고요.\"\n\n그제야 은수가 장비 가방을 닫는다. 닫고 나서, 고정 끈을 내민다.\n\n\"좋아요. 그럼 수신기는 여기 묶어도 돼요?\""},{"id":"exp_radioshop","path":["choices",0,"out",0,"text"],"old":"진공관, 배선, 콘덴서. 오래된 장비를 살릴 수 있는 귀한 부품들이다.\n\n계산대 아래에 굴러다니던 고철도 챙겼다. \"수리비는 형편껏\" 팻말은 그 자리에 뒀다.","new":"배선, 콘덴서. 오래된 장비를 살릴 수 있는 귀한 부품들이다.\n\n계산대 아래에 굴러다니던 고철도 챙겼다. \"수리비는 형편껏\" 팻말은 그 자리에 뒀다."}];
  for(const change of cycle15Copy){
    const row=rows.find(r=>r.id===change.id);if(!row)continue;
    let owner=row;for(const key of change.path.slice(0,-1))owner=owner?.[key];
    const key=change.path.at(-1);if(owner&&Object.hasOwn(owner,key)){assert.equal(owner[key],change.new,change.id+' exact cycle15 copy');owner[key]=change.old;}
  }
  const cycle14Copy=[{"id":"talk_kw_18","path":["choices",1,"out",0,"text"],"old":"\"…날짜는 모르겠습니다.\" 강우가 물병 쪽을 봤다. \"내 몫의 물이 같은 자리에 놓여 있더군요. 그걸 보고부터는.\"\n\n\"물이요? 물이 왜…\"\n\n대답은 없었다. 그다음부터는 물병을 아무 데나 놓지 않았다. 늘 강우 손이 닿는 같은 자리에 뒀다.","new":"\"…날짜는 모르겠습니다.\" 강우가 물병 쪽을 봤다. \"내 몫의 물이 같은 자리에 놓여 있더군요. 그걸 보고부터는.\"\n\n\"물이요? 물이 왜…\"\n\n대답은 없었다. 물병을 강우 손이 닿는 자리로 옮겨 놓았다. 앞으로도 이 자리에 두겠다고 마음먹었다."},{"id":"talk_pss_17","path":["choices",1,"out",0,"text"],"old":"\"기억나지. 감기약 사러 온 신혼부부. 마지막 손님도 기억나.\" 박 선생이 잠깐 말을 멈췄다.\n\n\"…마지막 손님 얘긴 다음에 하지.\"\n\n\"네.\"\n\n\"오늘은 첫 손님 날씨였어. 맑았거든.\" 그러고는 창문을 조금 내렸다. 그 얘기는 거기서 더 안 나갔다.","new":"\"기억나지. 감기약 사러 온 신혼부부. 마지막 손님도 기억나.\" 박 선생이 잠깐 말을 멈췄다.\n\n\"…마지막 손님 얘긴 다음에 하지.\"\n\n\"네.\"\n\n\"첫 손님이 온 날은 맑았어.\" 그러고는 창문을 조금 내렸다. 그 얘기는 거기서 더 안 나갔다."},{"id":"talk_pss_17","path":["choices",0,"out",0,"fx","note","body"],"old":"조수석 문에 놋쇠 종을 달았다. 박 선생 30년 약국의 차임벨이 이사 왔다.","new":"조수석 문에 작은 종을 달았다. 박 선생 30년 약국의 차임벨이 이사 왔다."},{"id":"pair_pss_jy_2","path":["choices",0,"out",0,"text"],"old":"박 선생이 잠깐 멈췄다가, 파스를 붙여주며 말했다.\n\n\"아빠 같은 소리, 해줄 사람이 있어야 하는 나이야, 너는.\"\n\n재이가 대꾸를 못 했다. 대꾸 대신 눈이 빨개져서, 박 선생은 못 본 척 파스를 한 장 더 붙였다. \"한 장은 서비스.\"\n\n그날 이후 재이는 박 선생을 가끔 \"쌤\"이라고 부른다. 아빠라고는 안 부르지만, 그 언저리 어딘가의 호칭이다.","new":"박 선생이 잠깐 멈췄다가, 파스를 붙여주며 말했다.\n\n\"아빠 같은 소리, 해줄 사람이 있어야 하는 나이야, 너는.\"\n\n재이가 대꾸를 못 했다. 대꾸 대신 눈이 빨개져서, 박 선생은 못 본 척 파스를 한 장 더 붙였다. \"한 장은 서비스.\"\n\n재이가 손목을 감싸 쥐고 작게 말했다. \"쌤, 고마워요.\" 아빠라고는 안 불렀지만, 그 언저리 어딘가의 호칭이었다."},{"id":"pair_pss_es_1","path":["title"],"old":"박선생×은수 — 새벽 두 시 클럽","new":"박선생×은수 — 잠 못 드는 밤 클럽"},{"id":"pair_pss_es_1","path":["text"],"old":"새벽. 불면의 밤. 깨어 있는 사람이 둘이었다.\n\n\"자네도 못 자나.\" \"…선생님도요.\"\n\n보리차 두 잔이 나왔다. 클럽 창립이다.","new":"잠이 오지 않는 밤. 깨어 있는 사람이 둘이었다.\n\n\"자네도 못 자나.\" \"…선생님도요.\"\n\n보리차 두 잔이 나왔다. 클럽 창립이다."},{"id":"pair_pss_es_1","path":["choices",0,"out",0,"fx","note","title"],"old":"새벽 두 시 클럽","new":"잠 못 드는 밤 클럽"}];
  const cycle14SystemsPairCopy=[{"id":"pair_leo_jy_2","path":["choices",0,"out",0,"text"],"old":"\"하모니카 기증할게요. 관람객이 불어볼 수 있게요. 물건은 쓰여야 사니까.\"\n\n재이가 얼마간 있다 답했다. \"…그럼 저는 창고 열쇠요. 옆에 걸어둘게요.\"\n\n\"전시명은요?\"\n\n\"전시명은—\"\n\n둘이 동시에 말했다. \"'잘 부는 노래 하나면 충분하다'.\" \"'줍는 순간 물건이 된다'.\"\n\n\"…….\"\n\n\"…둘 다 걸죠.\"\n\n전시명이 두 줄인 코너가 기획됐다. 개관일은 안 정했고, 소장품은 두 점이 됐다.","new":"\"하모니카 기증할게요. 관람객이 불어볼 수 있게요. 물건은 쓰여야 사니까.\"\n\n재이가 얼마간 있다 답했다. \"…그럼 저는 창고 열쇠요. 옆에 걸어둘게요.\"\n\n\"전시명은요?\"\n\n\"전시명은—\"\n\n둘이 동시에 말했다. \"'잘 부는 노래 하나면 충분하다'.\" \"'줍는 순간 물건이 된다'.\"\n\n\"…….\"\n\n\"…둘 다 걸죠.\"\n\n전시명이 두 줄인 코너가 기획됐다. 개관일은 안 정했고, 전시할 물건 두 점을 정했다."},{"id":"pair_leo_jy_2","path":["choices",0,"out",0,"fx","note","body"],"old":"소장 확정: 하모니카(체험형)+창고 열쇠. 전시명 두 줄(아빠가 둘이라서).","new":"기증 예정: 하모니카(체험형)+창고 열쇠. 전시명 두 줄(아빠가 둘이라서)."},{"id":"pair_jy_es_1","path":["choices",0,"out",0,"text"],"old":"즉석 협약이 체결됐다. 보통 물건 박물관 별관, 「보통 소리 전시관」. 초대 관장은 은수.\n\n소장 목록 1호부터 정했다. 빗소리 잡음, 새벽 주파수, 그리고 \"달구지 엔진 소리(2번 실린더 포함)\".\n\n\"입장료는요?\"\n\n\"소리 하나 기부요. 자기가 좋아하는 소리.\"\n\n\"그건 어떻게 받아요? 담아 올 통이 있어야 하잖아요.\"\n\n\"…받는 방법은 개관 전까지 생각할게요.\"\n\n개관 전까지 생각할 게 아직 많았다.","new":"즉석 협약이 체결됐다. 보통 물건 박물관 별관, 「보통 소리 전시관」. 초대 관장은 은수.\n\n소장 목록 1호부터 정했다. 빗소리 잡음, 새벽 주파수, 그리고 「달구지 엔진 소리(2번 실린더 포함)」.\n\n\"입장료는요?\"\n\n\"소리 하나 기부요. 자기가 좋아하는 소리.\"\n\n\"그건 어떻게 받아요? 담아 올 통이 있어야 하잖아요.\"\n\n\"…받는 방법은 개관 전까지 생각할게요.\"\n\n개관 전까지 생각할 게 아직 많았다."},{"id":"pair_jy_es_2","path":["choices",0,"out",0,"fx","note","body"],"old":"못 찾는 동안은 잃어버린 게 아니라 보관 중. 창고 이론의 위로. 교본 외 문장 2호.","new":"못 찾는 동안은 잃어버린 게 아니라 보관 중. 창고 이론의 위로. 교본 밖의 문장."}];
  for(const change of [...cycle14Copy,...cycle14SystemsPairCopy]){
    const row=rows.find(r=>r.id===change.id);if(!row)continue;
    let owner=row;for(const key of change.path.slice(0,-1))owner=owner?.[key];
    const key=change.path.at(-1);if(owner&&Object.hasOwn(owner,key)){assert.equal(owner[key],change.new,change.id+' exact reviewed copy');owner[key]=change.old;}
  }
  for(const row of rows){
    // Optional Jaeyi talks may run in either order; only entries3–9 originate here.
    if(row.id==='pair_mj_es_2'&&row.choices[0].out[0].fx.note){
      const note=row.choices[0].out[0].fx.note;
      assert.equal(note.body,'교본에 없는 문장 — 몸과 연장을 챙기고, 신호 오는 날을 준비한다. 은수가 수첩에 남겼다.');
      note.body='교본에 없는 문장 — 신호 오는 날 최상 컨디션이도록. 수첩에 공식 등재.';
    }
    if(row.id==='ev_comp_birthday'&&row.choices[0].out[0].fx.note){
      const note=row.choices[0].out[0].fx.note;
      assert.equal(note.body,'국을 끓이고 사탕을 초 대신 세워 민지 생일을 챙겼다. 시크한 척하던 눈가가 붉었다.');
      note.body='성냥불 꽂은 초콜릿으로 민지 생일을 챙겼다. 시크한 척하던 눈가가 붉었다.';
    }
    if(row.id==='talk_jy_09'){
      const note=row.choices[0].out[0].fx.note;
      if(note){
        assert.equal(note.body,'달구지에서 생긴 일들이 값 없는 물건 목록의 3~9번 칸에 적혀 있다.');
        note.body='달구지에서 생긴 아홉 가지가 값 없는 물건 목록에 올랐다.';
      }
    }
    if(row.id==='loc_filmset'&&row.title!==undefined){
      assert.equal(row.title,'가짜 마을의 진짜 온기');
      row.title='가짜 마을의 진짜 저녁';
    }
    // The mall can also be discovered through a rumour, without the child's map.
    if(row.id==='loc_mall'){
      for(const index of [0,1]){
        const note=row.choices[index].out[0].fx.note;
        if(!note)continue; // Several corpus consumers deliberately omit notes.
        assert.equal(note.title,'지하 창고의 보물');
        note.title='별표의 보물';
        if(index===0){
          assert.equal(note.body,'닫힌 지하 창고에서 물자를 챙겼다.');
          note.body='크레용 지도는 진짜였다. 아이야, 고마워.';
        }
      }
    }
    if(row.id==='opening_departure'){
      assert.equal(row.choices[0].foreseeable.lasting,'단골이 작업장 열쇠를 보관한다');
      assert.equal(row.choices[1].foreseeable.lasting,'작업장 열쇠를 지니고 간다');
      row.choices[0].foreseeable.lasting='단골이 공구함 열쇠를 보관한다';
      row.choices[1].foreseeable.lasting='공구함 열쇠를 지니고 간다';
    }
    if(row.id==='ev_lighthouse_visit'){
      assert.equal(row.scene,'lighthouse-lamp-room-v1');delete row.scene;
    }
    // Cycle 2026-10-26: voluntary hidden-location exchanges keep their paid effects.
    const hiddenCost={loc_maehwa:[1,{scrap:3}],loc_tunnelbook:[1,{food:1}],loc_filmset:[0,{food:1}],exp_comicroom:[1,{scrap:2}],comp_bori_bath:[0,{water:2}]}[row.id];
    if(hiddenCost){
      assert.deepEqual(JSON.parse(JSON.stringify(row.choices[hiddenCost[0]].req)),hiddenCost[1]);
      delete row.choices[hiddenCost[0]].req;
    }
    const partialSleep={crisis_drowsy:[0,0],ev_golf_clubhouse:[1,0],loc_filmset:[0,0],
      loc_gyeongju:[0,0],crisis_collapse:[0,0],crisis_collapse2:[0,0],exp_station:[0,0],
      comp_rps:[0,1],exp_icehouse:[0,1],ev_tent_village:[0,0],ev_quarry_hideout:[0,0],
      ev_limestone_cave:[1,0],ev_train_depot:[1,0],road_night_circle:[0,0]}[row.id];
    if(partialSleep){
      assert.equal(row.choices[partialSleep[0]].out[partialSleep[1]].fx.sleeping,true);
      delete row.choices[partialSleep[0]].out[partialSleep[1]].fx.sleeping;
    }
    if(row.id==='loc_drivein'){
      assert.equal(row.choices[1].out[0].fx.sleep,true);
      delete row.choices[1].out[0].fx.sleep;
    }
    if(row.id==='initiative_parkss_check'){
      assert.equal(row.choices[0].out[0].fx.healInjury,'driver');
      row.choices[0].out[0].fx.healInjury='latest';
    }
    if(row.id==='initiative_leo_pause'){
      assert.equal(row.choices.length,3);
      const exit=row.choices.pop();
      assert.equal(exit.req,undefined);
      assert.equal(exit.out.length,1);assert.equal(exit.out[0].p,1);
      assert.deepEqual(JSON.parse(JSON.stringify(exit.out[0].fx)),{});
    }
    if(row.id==='exp_temple'){assert.equal(row.choices[0].out[0].fx.sleep,true);delete row.choices[0].out[0].fx.sleep;}
    if(row.id==='ev_highway_sign'){assert.equal(row.maxRemain,99);delete row.maxRemain;}
    if(row.id==='vg_seoulline'){assert.equal(row.maxRemain,30);delete row.maxRemain;}
    if(row.id==='ev_near_seoul_sign'){assert.equal(row.maxRemain,9);delete row.maxRemain;}
    if(row.id==='combat_toll_breach'){
      assert.deepEqual(JSON.parse(JSON.stringify(row.choices[3].foreseeable)),{expense:'연료 최대 4L · 40분',lasting:'관측 +1'});
      delete row.choices[3].foreseeable;
    }
  }
  return rows;
}
function projectRegionalStoryChanges(rows){
  const mechanics=choice=>JSON.parse(JSON.stringify(choice,(key,value)=>
    ['text','label','turnSpeakers','turns','readingRecord','note'].includes(key)?undefined:value));
  for(const row of rows){
    // Regional audit: retain paid indices/effects; add only explicit exits/cost gates.
    if(['lc_gunsan_bakery','lc_cheonan_walnut','lc_jeonju_bibim','lc_andong_fish','lc_icheon_rice','near_hapcheon_sutra'].includes(row.id)){
      assert.equal(row.choices.length,row.id==='near_hapcheon_sutra'?3:2);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{}}]});
      if(row.id==='near_hapcheon_sutra'){
        assert.deepEqual(row.choices[1].req,{water:1});delete row.choices[1].req;
      }
    }
    if(row.id==='route_ridge_anchor'){
      assert.deepEqual(row.choices[1].req,{scrap:2});delete row.choices[1].req;
      assert.deepEqual(row.choices[1].foreseeable,{expense:'고철 1~2 · 실패에 대비해 2 필요'});
      delete row.choices[1].foreseeable;
    }
    const emergencyHints={"crisis_nofuel":[{"expense":"보유한 물·식량에서 각각 최대 2 소모 · 도보 중 끼니 소모 별도","lasting":"연료를 구하러 장시간 자리를 비운다"},{"expense":"유료 지원 시 고철 10 · 대기 중 물·식량 소모 가능","lasting":"지원이 없으면 직접 걸어야 한다"}],"crisis_nofuel2":[{"expense":"보유한 물·식량에서 각각 최대 3 소모 · 도보 중 끼니 소모 별도","lasting":"더 먼 곳까지 걸어야 할 수 있다"},{"expense":"유료 지원 시 고철 16 · 대기 중 물·식량 소모 가능","lasting":"지원이 없으면 직접 걸어야 한다"}],"crisis_nofuel3":[{"expense":"보유한 물·식량에서 각각 최대 3 소모 · 도보 중 끼니 소모 별도","lasting":"장시간 길을 비우며 관측 위험도 남는다"},{"lasting":"견인과 급유에도 몇 시간이 걸린다"}]};
    if(emergencyHints[row.id]){
      assert.deepEqual(JSON.parse(JSON.stringify(row.choices.map(c=>c.foreseeable))),emergencyHints[row.id]);
      row.choices.forEach(c=>delete c.foreseeable);
    }
    if(row.id==='combat_toll_breach'&&row.choices[3].out[0].fx.note){
      assert.equal(row.choices[3].out[0].fx.note.title,'돌아서 나온 검문소');
      row.choices[3].out[0].fx.note.title='손댄 채로 둔 제어함';
    }
  }
  return rows;
}
function projectDiscoveryStoryChanges(rows){
  for(const row of rows){
    if(!['exp_underground','loc_danyang'].includes(row.id)) continue;
    // Discovery audit: explicit voluntary cost and a free exit, no old index/effect changes.
    assert.equal(row.choices.length,3);
    const exit=row.choices.pop();
    assert.equal(exit.out.length,1);assert.equal(exit.out[0].p,1);assert.deepEqual(JSON.parse(JSON.stringify(exit.out[0].fx)),{});
    assert.deepEqual(JSON.parse(JSON.stringify(row.choices[1].req)),row.id==='exp_underground'?{water:1}:{scrap:3});
    delete row.choices[1].req;
  }
  return rows;
}
module.exports=function projectReviewedStoryChanges(rows){
  projectExpeditionStoryChanges(rows);
  projectDiscoveryStoryChanges(rows);
  projectRegionalStoryChanges(rows);
  const mechanics=choice=>JSON.parse(JSON.stringify(choice,(key,value)=>
    ['text','label','turnSpeakers','turns','readingRecord','note'].includes(key)?undefined:value));
  for(const row of rows){
    // R5/R6: actual-time entrances and voluntary spending, not outcome nerfs.
    if(row.id==='comp_rps'){assert.deepEqual(row.minuteWindow,[720,1020]);delete row.minuteWindow;}
    if(row.id==='loc_yeosu'){assert.equal(row.night,true);delete row.night;}
    if(['exp_outdoor','lc_suwon_galbi'].includes(row.id)){
      assert.deepEqual(row.choices[0].req,{scrap:2});delete row.choices[0].req;
      assert.equal(row.choices.length,2);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{}}]});
    }
    if(row.id==='route_market_mask'){
      assert.deepEqual(row.choices[0].req,{scrap:2});delete row.choices[0].req;
      assert.deepEqual(row.choices[0].foreseeable,{expense:'고철 1~2 · 실패에 대비해 2 필요'});
      delete row.choices[0].foreseeable;
    }
    if(row.id==='patrol_toll'){
      assert.deepEqual(row.choices[2].foreseeable,{expense:'연료 최대 4L · 차체 최대 3% · 45분'});
      delete row.choices[2].foreseeable;
    }
    if(row.id==='comp_water_fight'){
      assert.equal(row.waterMin,1);delete row.waterMin;
      for(const choice of row.choices.slice(0,2)){assert.deepEqual(choice.req,{water:1});delete choice.req;}
      assert.equal(row.choices.length,3);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{}}]});
    }
    if(['camp_thief','camp_dogs','camp_scan','camp_visitor'].includes(row.id)){
      assert.equal(row.storyOrigin.kind,'memory');assert.equal(row.storyOrigin.timeLabel,'지난밤 · 야영지');
      if(row.storyOrigin.label!==undefined)assert.equal(row.storyOrigin.label,'지난밤');
      if(row.storyOrigin.title!==undefined)assert.equal(row.storyOrigin.title,'야영지');
      delete row.storyOrigin; // Approved provenance, no gameplay delta.
    }
    if(row.id==='cult_recruiter'){
      assert.deepEqual(row.choices[1].req,{water:1});delete row.choices[1].req;
    }
    if(row.id==='whites_straggler'){
      assert.deepEqual(row.choices[0].req,{water:1});delete row.choices[0].req;
    }
    if(row.id==='bori_family'){
      assert.deepEqual(row.nearNode,['busan','miryang','daegu','muju','jeonju','daejeon','suwon','gwangju']);
      delete row.nearNode;
    }
    if(row.id==='dj_meet'||row.id==='dj_onair'){
      assert.equal(row.minParty,0);row.minParty=1;
      if(row.id==='dj_onair'){
        assert.deepEqual(row.minuteWindow,[120,180]);delete row.minuteWindow;
      }
    }
    if(row.id==='meet_trader_truck'){
      assert.equal(row.retryUntilFlag,'mansu_shop');delete row.retryUntilFlag;
      assert.deepEqual(row.noFlags,['mansu_shop','mansu_hurt']);delete row.noFlags;
    }
    if(row.id==='mansu_robbed'){
      assert.equal(row.noFlag,'mansu_shop');delete row.noFlag;
    }
    if(row.id==='mansu_opening'){
      assert.equal(row.noFlag,'mansu_hurt');delete row.noFlag;
      assert.deepEqual(row.nearNode,['busan','miryang','daegu','muju','jeonju','daejeon','suwon','gwangju']);
      delete row.nearNode;
      assert.deepEqual(row.choices[0].req,{scrap:2});delete row.choices[0].req;
      assert.equal(row.choices.length,2);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{moodAll:3,flag:'mansu_shop'}}]});
    }
    if(row.id==='freq_catch'||row.id==='freq_source'){
      assert.equal(row.minParty,0);row.minParty=1;
    }
    if(row.id==='deserter_farewell'){
      assert.deepEqual(row.nearNode,['busan','miryang','daegu','muju','jeonju','daejeon','suwon','gwangju']);
      delete row.nearNode;
    }
    if(row.id==='ai_broadcast'){
      assert.deepEqual(row.minuteWindow,[240,330]);delete row.minuteWindow;
    }
    if(row.id==='crisis_hose'){
      assert.deepEqual(row.choices[0].req,{item:'부품'});delete row.choices[0].req;
      assert.equal(row.choices.length,3);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{time:120,fuel:-3,fatigue:8}}]});
    }
    if(row.id==='conflict_fuel_detour'){
      for(const [index,req] of [[0,{fuel:8}],[1,{item:'의약품'}],[2,{fuel:4,item:'의약품'}]]){
        assert.deepEqual(row.choices[index].req,req);delete row.choices[index].req;
      }
      assert.equal(row.choices.length,4);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{time:20,mood:{parkss:-6,kangwoo:2},moodAll:-2,
        flag:'conflict_sided_kangwoo',flag2:'conflict_open',chain:'conflict_silent_cab'}}]});
    }
    if(row.id==='conflict_silent_cab'){
      assert.deepEqual(row.choices[0].req,{food:1});delete row.choices[0].req;
      assert.equal(row.choices.length,2);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{time:30,mood:{kangwoo:1,parkss:1},chain:'conflict_campfire'}}]});
    }
    if(row.id==='conflict_campfire'){
      assert.deepEqual(row.choices[0].req,{water:1});delete row.choices[0].req;
      assert.equal(row.choices.length,2);
      const alternative=row.choices.pop();
      const original=JSON.parse(JSON.stringify(row.choices[0]));delete original.out[0].fx.water;
      original.out[0].fx.mood={kangwoo:3,parkss:3};original.out[0].fx.moodAll=1;
      assert.deepEqual(mechanics(alternative),mechanics(original));
    }
    if(row.id==='photo_delivered'){
      assert.equal(row.needsDog,false);row.needsDog=true;
    }
    if(row.id==='meet_postman'){
      assert.deepEqual(row.choices[1].req,{water:1});delete row.choices[1].req;
    }
    if(row.id==='meet_seedlady'){
      assert.deepEqual(row.choices[0].req,{water:2});delete row.choices[0].req;
    }
    if(row.id==='lc_sejong_library'){
      assert.deepEqual(row.nearNode,['sejong']);row.nearNode=['sejong','gongju'];
    }
    if(row.id==='parcel_found'){
      assert.equal(row.minParty,0);row.minParty=1;
      assert.deepEqual(row.nearNode,['suwon']);row.nearNode=['suwon','pyeongtaek','seoul'];
    }
    if(row.id==='meet_waver'){
      assert.deepEqual(row.choices[0].req,{fuel:5});delete row.choices[0].req;
    }
    if(row.id==='meet_toll'){
      assert.deepEqual(row.choices[1].req,{comp:'kangwoo',scrap:8});delete row.choices[1].req.scrap;
    }
    if(row.id==='mansu_robbed'){
      assert.deepEqual(row.choices[0].req,{item:'의약품'});delete row.choices[0].req;
    }
    if(row.id==='lib_books'||row.id==='lib_return'){
      const completed=row.id==='lib_books'?'library_books':'library_done';
      assert.equal(row.retryUntilFlag,completed);assert.equal(row.noFlag,completed);
      delete row.retryUntilFlag;delete row.noFlag;
      if(row.id==='lib_return'){assert.equal(row.needItem,'책 꾸러미');delete row.needItem;}
    }
    if(row.id==='parents_mother_reunion')for(const choice of row.choices)for(const out of choice.out){
      assert.equal(out.fx.flag,'mother_reunited');
      assert.equal(out.fx.chain,'parents_mother_truth');
      delete out.fx.flag;
    }
    if(row.id==='seoul_session_reset'){
      assert.deepEqual(row.choices[0].out[0].scenes,['seoul-uplink-empty-v2','parents-mother-reunion-v1']);
      delete row.choices[0].out[0].scenes;
    }
    if(row.id==='talk_leo_10'){
      assert.equal(row.noFlag,'seoul_open');delete row.noFlag;
    }
    if(row.id==='talk_jy_21'){
      assert.equal(row.noFlag,'seoul_open');delete row.noFlag;
      for(const choice of row.choices){
        assert.equal(choice.out[0].fx.flag,'jaeyi_scale_entrusted');
        delete choice.out[0].fx.flag;
      }
    }
    if(row.id==='react_resist_es'){
      assert.equal(row.needFlag2,'cell_ghost');delete row.needFlag2;
    }
    if(row.id==='story_bridge_crew_question'){
      const reasons=['bridge_reason_stop','bridge_reason_family','bridge_reason_both'];
      assert.equal(row.choices.length,3);
      row.choices.forEach((choice,index)=>{
        assert.equal(choice.out.length,1);
        assert.equal(choice.out[0].fx.flag,'bridge_crew_answer');
        assert.equal(choice.out[0].fx.flag2,reasons[index]);
        delete choice.out[0].fx.flag2;
      });
    }
    // Art contracts are intentionally changed; gates, payment and chains are not.
    if(row.id==='story_family_key'){
      assert.deepEqual(row.scenes,['family-verification-key']);
      row.scenes.push('story-family-key-audio-v1');
    }
    if(row.id==='main_recovery_story_family_key'){
      assert.equal(row.parseRecords,true);delete row.parseRecords;
      assert.equal(row.scene,'family-verification-key');row.scene='parents-linked-records-v2';
    }
    if(row.id==='main_recovery_story_personal_cache'){
      assert.equal(row.scene,'suwon-exchange-cache-v1');row.scene='parents-linked-records-v2';
    }
    if(row.id==='pair_kw_leo_1'){
      assert.deepEqual(row.scenes,['pair-kangwoo-leo-watch-v1']);
      row.scenes.push('pair-kangwoo-leo-quiet-song-v2');
      assert.deepEqual(row.choices[0].out[0].scenes,['pair-kangwoo-leo-replay-v1']);
      delete row.choices[0].out[0].scenes;
    }
    if(row.id==='comp_minji_radio'){
      assert.deepEqual(row.minuteWindow,[714,720]);delete row.minuteWindow;
    }
    if(row.id==='ev_seed_warehouse')for(const out of row.choices[0].out){
      assert.equal(out.fx.flag,'seed_found');out.fx.flag='seed_borrowed';
    }
    if(row.id==='seed_harvest'){
      assert.deepEqual(row.choices[1].req,{flag:'seed_borrowed',up:'garden'});
      delete row.choices[1].req.up;
    }
    if(row.id==='seed_return'){
      assert.deepEqual(row.choices[0].req,{food:1});delete row.choices[0].req;
      assert.deepEqual(row.choices[0].out[0].fx.item,{'해바라기 씨앗':1});delete row.choices[0].out[0].fx.item;
    }
    if(row.id==='ev_seed_girl'){
      assert.deepEqual(row.choices[1].req,{item:'해바라기 씨앗'});row.choices[1].req={flag:'seed_borrowed'};
      assert.deepEqual(row.choices[1].out[0].fx.item,{'해바라기 씨앗':-1});delete row.choices[1].out[0].fx.item;
    }
    if(row.id==='vanowner_coffee'){
      assert.equal(row.needFlag2,'van_owner_done');delete row.needFlag2;
      assert.equal(row.needItem,'커피 원두');delete row.needItem;
      assert.deepEqual(row.choices[0].req,{item:'커피 원두'});delete row.choices[0].req;
    }
    if(row.id==='trace_coldbag_return'){
      assert.equal(row.needItem,'씨앗 꾸러미');delete row.needItem;
      assert.deepEqual(row.choices[0].req,{item:'씨앗 꾸러미'});delete row.choices[0].req;
      assert.deepEqual(row.choices[0].out[0].fx.item,{'씨앗 꾸러미':-1});
      delete row.choices[0].out[0].fx.item;
    }
    if(row.id==='es_backdoor'&&Object.hasOwn(row,'w')){
      assert.equal(row.noPool,1);assert.equal(row.needFlag2,'es_v1194');
      delete row.noPool;delete row.needFlag2;
    }
    // R4-11: an explicit one-item gift now consumes that item. Preserve the
    // original corpus hash and assert this reviewed delta, not a new baseline.
    if(row.id==='ev_mobile_clinic'){
      assert.deepEqual(row.choices[0].out[0].fx.item,{'의약품':-1});
      delete row.choices[0].out[0].fx.item;
    }
    if(row.id==='loc_jaeyi_cache'){
      assert.equal(row.choices[0].out[0].fx.flag2,'jaeyi_cache_opened');
      delete row.choices[0].out[0].fx.flag2;
    }
    if(row.id==='es_backdoor')for(const choice of row.choices)for(const out of choice.out){
      assert.deepEqual(out.fx.knowledge,['family_order_source',2]);
      delete out.fx.knowledge;
    }
    const next={story_bridge_invitation:'story_bridge_last_quiet',story_bridge_last_quiet:'seoul_open'}[row.id];
    if(next)for(const choice of row.choices)for(const out of choice.out){
      assert.equal(out.fx.chain,next);delete out.fx.chain;
    }
  }
  return rows;
};
module.exports.expedition=projectExpeditionStoryChanges;
module.exports.regional=rows=>{projectExpeditionStoryChanges(rows);projectDiscoveryStoryChanges(rows);return projectRegionalStoryChanges(rows);};
