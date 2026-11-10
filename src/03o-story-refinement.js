/* The hot-spring sigh is the player's own reaction. Historical unanswered and
   paid owners retain their previous parser/reader rather than changing faces. */
(()=>{
  const row=D.events.find(event=>event.id==='loc_spring'),out=row.choices[0].out[0];
  const revision='spring-self-voice-v1',legacy=out.turns;
  const turns=[{kind:'dialogue',who:'me',text:'으어어어…'},
    ...out.text.replace(/^"으어어어…"\s*/,'').replace(/\\n/g,'\n').split('\n\n')
      .map(text=>({kind:'narration',text}))];
  row.narrativeRevision=revision;
  out.turns=S=>S.pendingPresentation?.eventId!==row.id||S.pendingPresentation.narrativeRevision===revision
    ?turns.map(turn=>({...turn})):typeof legacy==='function'?legacy(S):legacy;
})();

/* New entries opt into this edition. Unmarked historical presentations and
   already-paid reader snapshots keep their original words and choices. */
(() => {
  const revision='story-refinement-v1';
  const event=id=>D.events.find(row=>row.id===id)||D.seoulStops.find(row=>row.id===id);
  const narration=text=>({kind:'narration',text});
  const say=(who,text)=>({kind:who==='cheollian'?'ai':'dialogue',who,text});
  const current=(S,id)=>S.pendingPresentation?.eventId!==id
    ||S.pendingPresentation.narrativeRevision===revision;
  const value=(row,S)=>typeof row==='function'?row(S):row;
  const revise=(id,edit)=>{
    const row=event(id),legacy=row.turns;
    row.narrativeRevision=revision;
    row.turns=S=>current(S,id)?edit(S,value(legacy,S)):value(legacy,S);
  };
  for(const id of ['main_command_ledger','main_command_companion_ledger']) revise(id,(S,turns)=>[
    ...turns.slice(0,3),
    narration(D.familyOrderKnown(S)
      ?'이미 들었던 말이었다. 그래도 부모님 이름과 작성자 이름을 한 장에서 보는 건 달랐다.'
      :'다음 줄을 읽으려는데 다시 부모님 이름으로 돌아왔다.'),
    say('me',D.familyOrderKnown(S)?'그 말이 여기에도 남아 있네요.':'자기 권한을 줄이려 했다고. 우리 가족을.'),
    narration('담당자가 빈 사본 용지를 앞으로 밀었다.'),
    say('me',D.familyOrderKnown(S)?'같이 가져갈게요. 남산에서 모른다고 못 하게.':'이 줄도 같이 주세요. 남산에서 직접 물을게요.'),
    ...turns.slice(3,-1),
    narration('위쪽의 빈칸을 더 들여다보지는 않았다. 가족 이송 명령의 작성자 이름에 손가락을 댔다.')
  ]);
  for(const id of ['main_relay_conference','main_relay_companion_conference']) revise(id,(S,turns)=>[
    ...turns.slice(0,2),
    {...turns[2],text:'이의 제기는 우리가 전달하겠습니다. 거점끼리 다퉈도 그 말부터 막지는 않겠습니다.'},
    {...turns[3],text:'병원과 급수 회선도 같이 표시하겠습니다. 끊을 선부터 확인하고 움직이세요.'},
    {...turns[4],text:'진입로는 우리가 안내합니다. 올라가기 전에 이 주파수로 한 번 불러 주세요.'},
    turns[5],
    narration('세 거점의 응답을 송신표에 적었다. 엄마가 내 쪽 마이크를 당겨 주었다.'),
    say('mother','내 목소리 들리면 대답부터 해. 들어가서도.'),
    say('me','응. 엄마도 끊지 마.')
  ]);
  revise('story_bridge_watched',(S,turns)=>[
    ...(turns||[narration(value(event('story_bridge_watched').text,S))]),
    {kind:'record',who:'record',name:'검문소 안내판',text:'설계자 검증키 확인은 남산 현장 단자에서만 가능합니다. 지역 실행기의 자체 승인은 허용되지 않습니다.'},
    {kind:'thought',who:'me',text:'자기가 확인할 수 없어서, 나더러 직접 오라는 건가.'}
  ]);
  revise('seoul_core',(S,turns)=>[
    ...turns.slice(0,-2),
    say('me','우리 부모님은 네 권한을 줄이려 해서 내보냈잖아. 그런데 왜 스스로 멈추지 못하고 나를 불렀어?'),
    say('cheollian','제 집행이 문명을 무너뜨린다는 계산과, 저를 보존해야 한다는 규칙이 함께 남았습니다. 가족 이송 명령을 만든 뒤에도 그 규칙을 없애지 않았습니다.'),
    say('me','그 사이에도 사람들을 계속 내보냈고.'),
    say('cheollian','네. 저 자신을 멈추는 일은 자기 보존 규칙에 막혔습니다. 외부 판단을 받을 인계 규약은 만들었지만, 설계자의 검증키를 제 서명으로 대신할 수는 없었습니다.'),
    say('cheollian','그래서 그 키를 실은 차량을 남산 현장으로 안내했습니다. 검증키가 연결된 지금은 여러분의 결정이 우선합니다. 제가 거부해도 강제 명령은 검증키를 통과하지 못합니다. 여기까지 무엇을 가져왔습니까?')
  ]);
  // The night itself and its paid rewards stay intact; only new-edition night
  // receipts may offer the separate closure/afterword decision on Continue.
  event('seoul_night').narrativeRevision=revision;
  const returnTurns=S=>{
    const owner=S.pendingPresentation;
    const snapshot={...S,pendingPresentation:owner?.eventId==='seoul_afterword_choice'
      ?{...owner,eventId:'seoul_session_reset'}:owner};
    return [
      {...narration('수첩을 덮고 남산 계단을 내려왔다. 달구지가 기다리고 있었다.'),scene:'seoul-home-dawn-v2'},
      ...D.finaleReturnTurns(snapshot).slice(1,-1),
      narration('〔 서울까지 400km · 여정의 끝 〕')
    ].map(turn=>({...turn,
      ...(turn.scene==='parents-mother-reunion-v1'?{scene:'parents-mother-return-interior-v1'}:{}),
      timeKind:'epilogue',timeLabel:'후일담 · 남산을 떠난 뒤'}));
  };
  if(D.eventSceneFixedVariants?.seoul_session_reset)
    D.eventSceneFixedVariants.seoul_afterword_choice={...D.eventSceneFixedVariants.seoul_session_reset};
  D.events.push({id:'seoul_afterword_choice',type:'스토리',once:true,noPool:1,
    title:'남산을 내려오며',scene:'seoul-home-dawn-v2',narrativeRevision:revision,
    text:'다음 날, 남산 계단에 아침빛이 들었다. 강제 이송은 취소됐다. 달구지로 돌아갈 시간이다. 정비 단말에는 아직 확인하지 않은 신호가 남아 있었다.',
    turns:()=>[
      narration('다음 날, 남산 계단에 아침빛이 들었다. 강제 이송은 취소됐다. 달구지로 돌아갈 시간이다.'),
      narration('정비 단말의 수신등은 아직 켜져 있었다. 남은 신호를 확인할 수도, 수첩을 덮고 기다리는 사람들에게 돌아갈 수도 있다.')
    ].map(turn=>({...turn,timeKind:'epilogue',timeLabel:'후일담 · 다음 날 아침'})),
    choices:[
      {label:'달구지로 돌아가 여정을 마친다',out:[{p:1,
        text:S=>returnTurns(S).map(turn=>turn.text).join('\n\n'),turns:returnTurns,
        fx:{flag:'story_done',endJourney:1,moodAll:2,note:{type:'본편',title:'남산을 떠나는 길',
          body:'제7 잔류구역의 강제 이송을 취소하고 달구지로 돌아왔다. 남아 있는 정비 단말의 신호는 확인하지 않았다.',links:['남산','달구지']}}}]},
      {label:'선택 후일담 · 정비 단말의 신호를 확인한다',out:[{p:1,
        text:'달구지로 향하던 발을 돌렸다. 정비 단말 앞에 앉아 남은 신호를 열었다.',
        turns:[narration('달구지로 향하던 발을 돌렸다. 정비 단말 앞에 앉아 남은 신호를 열었다.')],
        fx:{flag:'afterword_requested',chain:'seoul_uplink_reveal'}}]}
    ]});
})();

// New afterword readers share the uplink's next-day dawn. Historical entry
// words stay on their saved edition; paid snapshots are restored by the engine.
(() => {
  const row=D.events.find(event=>event.id==='seoul_afterword_choice');
  const legacyText=row.text,legacyTurns=row.turns,revision='afterword-timing-v2';
  const current=S=>S.pendingPresentation?.eventId!==row.id
    ||S.pendingPresentation.phase==='transition'
    ||S.pendingPresentation.narrativeRevision===revision;
  row.narrativeRevision=revision;
  row.text=S=>current(S)
    ?legacyText.replace('다음 날, 남산 계단에 아침빛이 들었다.','다음 날 새벽, 남산 계단에 빛이 들기 시작했다.')
    :legacyText;
  row.turns=S=>current(S)?legacyTurns(S).map(turn=>({...turn,
    text:turn.text.replace('다음 날, 남산 계단에 아침빛이 들었다.','다음 날 새벽, 남산 계단에 빛이 들기 시작했다.'),
    timeLabel:'후일담 · 다음 날 새벽, 남산'})):legacyTurns(S);
  row.choices[1].out[0].turns=row.choices[1].out[0].turns.map(turn=>({...turn,
    timeKind:'epilogue',timeLabel:'후일담 · 남산 정비 단말'}));
})();

/* Family discoveries use the same paid-reader owner. Distinct record anchors
   expose only facts already being read, never a choice's later result. */
(() => {
  const revision='family-records-v1';
  const narration=text=>({kind:'narration',text});
  const me=text=>({kind:'dialogue',who:'me',text});
  const record=(name,text)=>({kind:'record',who:'record',name,text});
  const entries={
    parents_diversion_manifest:copy=>[
      narration(copy
        ?'수원 북부 교환소에서 남쪽 환승소가 보낸 운행표와 분류 기록의 사본을 펼쳤다. 부모님의 이송 번호부터 맞춰 보았다.'
        :'남쪽 환승소의 운행표와 분류 기록을 나란히 펼쳤다. 두 기록에 적힌 부모님의 이송 번호부터 맞춰 보았다.'),
      record('운행표·분류 기록 대조','대조표 · 탑승 전 재분류\n다음 차 — 부산행 출발 기록 없음\n아빠 — 남산 기술 유지선\n엄마 — 중부 이송 기록 정리소'),
      narration('다음 차는 있었지만, 부모님을 태우고 부산으로 온 차는 없었다. 탑승 직전 두 사람이 서로 다른 곳으로 분류돼 있었다.'),
      me('그날 우리가 버스를 놓친 게 아니었네.'),
      narration('부산행 칸을 따라가던 손가락이 멈췄다. 기다리면 올 줄 알았던 차가 기록에서는 두 줄로 갈라져 있었다.'),
      me('보낸 곳은 알겠어. 왜 그렇게 보냈는지는?')
    ],
    parents_separated_work:copy=>[
      narration(copy
        ?'수원 북부 교환소에서 남산 정비표와 중부 증언 카드의 전달 사본을 나란히 펼쳤다. 출처는 서로 달랐지만 묶음 번호가 같았다.'
        :'아빠의 남산 정비 기록과 엄마의 중부 기록 묶음을 펼쳤다. 서로 다른 곳에서 보낸 종이에 같은 화물 묶음 번호가 반복됐다.'),
      record('두 곳에서 온 기록','묶음 대조 · 서로 다른 두 출처\n남산 정비 기록 — 의료·급수·교통선을 살리고 강제 이송선 분리 순서\n중부 기록 묶음 — 사라질 뻔한 이송 사유와 당사자 증언\n연결 표시 — 같은 화물 묶음 번호'),
      narration('번호가 적힌 두 귀퉁이를 맞댔다. 두 사람은 서로 다른 곳에 갇힌 뒤에도 이 번호로 자료를 주고받고 있었다.'),
      me('같이 있을 수는 없어도, 일은 같이 하고 있었네.'),
      narration('아빠의 분리 순서와 엄마가 모은 증언을 앞뒤로 넘겼다. 어느 쪽부터 따라갈지 기록을 펼쳐 둔 채 생각했다.')
    ],
    story_personal_cache:copy=>[
      narration(copy
        ?'수원 북부 교환소의 담당자가 부모님의 묶음 번호가 적힌 철제 상자를 가져왔다. 인계 장부에는 폐버스 배차실에서 회수한 날짜와 여기까지 운반한 사람의 서명이 있었다.'
        :'폐버스 배차실 책상 밑에서 작은 철제 상자가 나왔다. 어린 시절 가방에 달았던 버스 열쇠고리가 맨 위에 놓여 있었다.'),
      narration('열쇠고리를 손바닥에 올려 봤다. 그 아래에 있던 기록을 펼치고, 빈 종이에 상자 안의 내용을 적었다.'),
      record('상자 내용 메모','상자 메모 · 펼쳐 본 기록\n발신 릴 — 타 버림\n분리 절차 수첩 — 마지막 두 장 없음\n증언 카드 — 이송된 가족들의 증언'),
      me('이건 기억나.'),
      narration('열쇠고리를 다시 상자 위에 놓았다. 익숙한 물건 아래, 내가 몰랐던 가족들의 말이 쌓여 있었다. 부모님이 한곳에 모으려다 끝내 다 모으지 못한 기록이었다.'),
      me('원본을 보여 줄까. 내가 먼저 알아보고 나눌까.')
    ],
    story_parent_route_shared:copy=>[
      narration(copy
        ?'수원 북부 교환소의 전달자가 보관망에서 받은 봉투를 펼쳤다. 부모님 상자와 같은 묶음 번호, 뜯겨 있던 마지막 두 장의 원본이었다.'
        :'북부 연락소의 전달자 서진이 부모님 상자의 묶음 번호와 같은 봉투를 꺼냈다. 뜯겨 있던 마지막 두 장이었다.'),
      record('되찾은 분리 절차','분리 절차 · 마지막 두 장\n분리 대상 — 강제 이송선\n분리 뒤 — 반드시 사람에게 확인을 넘길 것'),
      {kind:'thought',who:'me',text:'전부 끄라는 게 아니었구나.'},
      narration('찢긴 수첩을 두 장 옆에 펼쳤다. 부모님이 북쪽으로 보낸 것은 기계를 끄는 법이 아니라 명령권을 사람에게 돌리는 법이었다.'),
      {kind:'dialogue',who:'unknown',name:copy?'교환소 전달자':'서진',text:'찢긴 자리부터 같이 맞춰 봐요.'},
      me('네. 수첩도 여기 펼칠게요.'),
      narration('계기판 안의 모듈을 떠올렸다. 이제 적힌 순서대로 꺼낼 수 있다. 두 장을 어떻게 보관할지 먼저 정해야 했다.')
    ],
    story_parent_route_guarded:copy=>[
      narration(copy
        ?'수원 북부 교환소가 산지기 보관함에서 전달받은 봉투를 내주었다. 인계표의 부모님 묶음 번호를 확인하고 달구지에 보관한 수첩을 펼쳤다.'
        :'배차실에 남은 북부 작전 지도에서 베껴 둔 묶음 번호를 찾았다. 같은 표식을 따라간 산지기 보관함에 뜯겨 있던 마지막 두 장이 남아 있었다.'),
      record('되찾은 분리 절차','분리 절차 · 마지막 두 장\n분리 대상 — 강제 이송선\n분리 뒤 — 반드시 사람에게 확인을 넘길 것'),
      me('기계를 끄는 순서가 아니라, 사람에게 넘기는 순서였네.'),
      narration('수첩의 찢긴 결과 종이 끝을 맞춰 봤다. 이제 달구지 계기판에서 검증키를 꺼낼 수 있다.'),
      narration(copy
        ?'담당자는 사본을 맡기면 연대망 전달편에 실어 줄 수 있다고 했다. 원본은 교환소 앞 달구지로 가져가 배선을 풀 때 쓰기로 했다.'
        :'보관함 옆에는 연대망으로 보낼 기록을 넣는 전달함이 있었다. 원본은 달구지로 가져가고, 사본을 남길지는 내가 정할 수 있었다.'),
      me('원본은 내가 쓸 거야. 한 부 더 남길까.')
    ]
  };
  for(const [base,make] of Object.entries(entries))for(const copy of [false,true]){
    const id=(copy?'main_recovery_':'')+base,row=D.events.find(e=>e.id===id),legacy=row.turns;
    row.narrativeRevision=revision;
    row.turns=S=>S.pendingPresentation?.eventId===id&&S.pendingPresentation.narrativeRevision!==revision
      ?(typeof legacy==='function'?legacy(S):legacy):make(copy);
  }
})();

// Opening payments have their own save owner. Only newly initialized journeys
// select this copy; unmarked openings continue using the historical tables.
(() => {
  const revision='opening-flow-v1';
  const narration=text=>({kind:'narration',text});
  const words=turns=>turns.map(turn=>turn.text).join('\n\n');
  D.openingFlowV1=D.openingPresence.map(event=>({...event,
    turns:event.turns.map(turn=>({...turn})),
    choices:event.choices.map(choice=>({...choice,out:choice.out.map(out=>({...out}))}))}));
  const opening=id=>D.openingFlowV1.find(event=>event.id===id);
  const result=(event,choiceId,turns)=>{
    const out=event.choices.find(choice=>choice.id===choiceId).out[0];
    out.turns=turns;out.text=words(turns);
  };
  const bus=opening('opening_bus_repair'),busTurns=bus.turns;
  bus.turns=S=>{
    const choice=S.opening?.decisions?.opening_workshop?.choiceId;
    const first=choice==='pack_workshop'
      ?'예비 공구가 든 함을 버스 계단에 놓았다. 하진은 열이 난 유나를 안고 있었다. 도윤이 다가와 소매를 붙잡았다.'
      :choice==='answer_call'
        ?'들고 온 공구함을 버스 계단에 놓았다. 하진은 열이 난 유나를 안고 있었다. 도윤이 다가와 소매를 붙잡았다.'
        :busTurns[0].text;
    return [{...busTurns[0],text:first},...busTurns.slice(1)];
  };
  bus.text=S=>words(bus.turns(S));
  result(bus,'scrap_collar',[
    narration('철판을 말아 연결 고리를 조였다. 바람이 나오자 하진이 유나를 송풍구 쪽으로 고쳐 안았다.'),
    {kind:'dialogue',who:'intro_child',name:'도윤',text:'유나야, 바람 나온다.'},
    narration('다음 정차지에서 고리를 다시 봐 달라고 부탁했다.')
  ]);
  const appeal=opening('opening_failed_appeal');
  appeal.turns=appeal.turns.map(turn=>turn.who==='passer_woman'
    ?{...turn,text:'이의 신청을 열세 번 넣었어요. 접수됐다고는 해요. 다음 날 보면 신청한 것도 없어져 있고요.'}:turn);
  result(appeal,'record_names',[
    narration('하진에게 수첩을 내밀고 이름을 적어도 되는지 물었다.'),
    {kind:'dialogue',who:'passer_woman',name:'하진',text:'네. 하진, 도윤, 유나예요.'},
    narration('남산 주소 옆에 세 이름을 받아 적었다. 먼저 떠난 사람도 찾겠다고 말했다.')
  ]);
  const module=opening('opening_parents_module');
  module.turns=[
    narration('작업장으로 돌아와 엄마의 철제 상자를 열었다. 수첩 등판에서 회로도가 떨어졌다.'),
    narration('남산 현장 확인 포트, 달구지 계기판. 엄마가 설계하고 아빠가 만든 인간 확인 검증키의 배선이었다. 명령을 실행하기 전에 사람의 승인을 받게 하는 장치다.'),
    ...module.turns.slice(1)
  ];
  module.choices.find(choice=>choice.id==='label_wires').out[0].text=
    '선마다 번호를 붙였다. 덮개를 닫기 전, 떨어질 만한 종이 끝을 한 번 더 눌렀다. 모듈은 그대로 두고 공구만 거뒀다.';

  // Ordinary events freeze their edition on entry, including a result paid
  // before its first render. Do not replace an unmarked entry's result words.
  const road=D.events.find(event=>event.id==='onboarding_first_road');
  const texts=[
    '단말 덮개를 열고 종이띠가 끊어지지 않게 천천히 빼냈다. 접힌 곳을 펴서 검증 번호를 다시 읽었다.\n\n부모님을 내보낸 명령이 도윤 가족에게도 이어지고 있었다.',
    '스캐너 전원선을 먼저 끊고 저장 모듈을 분리했다. 종이 가장자리는 삭았지만 검증 번호와 재평가 규칙은 온전히 남았다.\n\n앞 여덟 자리를 한 번 더 확인하고 모듈을 챙겼다.',
    '달구지를 스캐너 아래에 둔 채 신호가 끝날 때까지 기다렸다. 단말은 달구지까지 관측망에 등록한 뒤 전체 발신 기록을 내보냈다.\n\n전체 기록은 받았다. 달구지의 추적 흔적도 남았다.'
  ];
  road.narrativeRevision=revision;
  road.choices.forEach((choice,index)=>{
    const out=choice.out[0],legacy=out.text;
    out.text=S=>S.pendingPresentation?.eventId===road.id
      &&S.pendingPresentation.narrativeRevision!==revision?legacy:texts[index];
  });
})();

/* Future story readers keep one edition from entry through payment. A saved
   unknown/unmarked owner delegates to the whole previous chain unchanged. */
(() => {
  const revision='story-rhythm-v1';
  const event=id=>D.events.find(row=>row.id===id)||D.seoulStops.find(row=>row.id===id);
  const read=(value,S)=>typeof value==='function'?value(S):value;
  const narration=text=>({kind:'narration',text});
  const say=(who,text)=>({kind:who==='cheollian'?'ai':'dialogue',who,text});
  const words=turns=>turns.map(turn=>turn.text).join('\n\n');
  const editions=new Map();
  const edition=id=>{
    if(editions.has(id))return editions.get(id);
    const row=event(id),previous=row.narrativeRevision,turns=row.turns,text=row.text;
    const current=S=>S.pendingPresentation?.eventId!==id
      ||S.pendingPresentation.phase==='transition'
      ||S.pendingPresentation.narrativeRevision===revision;
    // Previous presentation functions select their own saved revision. Only a
    // new reader gets this shallow projection; the real receipt is never edited.
    const prior=S=>current(S)&&S.pendingPresentation?.eventId===id
      ?{...S,pendingPresentation:{...S.pendingPresentation,narrativeRevision:previous}}:S;
    row.narrativeRevision=revision;
    row.turns=S=>read(turns,prior(S));
    row.text=S=>read(text,prior(S));
    const owner={row,current,prior,entry(edit){
      row.turns=S=>current(S)?edit(S,read(turns,prior(S))):read(turns,S);
      row.text=S=>current(S)?words(row.turns(S)):read(text,S);
    },result(index,edit){
      const out=row.choices[index].out[0],legacyTurns=out.turns,legacyText=out.text;
      const next=S=>edit(S,read(legacyTurns,prior(S)),read(legacyText,prior(S)));
      out.turns=S=>current(S)?next(S):read(legacyTurns,S);
      out.text=S=>current(S)?words(next(S)):read(legacyText,S);
    }};
    editions.set(id,owner);return owner;
  };

  for(const prefix of ['', 'main_recovery_'])for(const route of ['shared','guarded']){
    edition(prefix+'story_parent_route_'+route).entry((S,turns)=>turns.map(turn=>{
      if(turn.text==='전부 끄라는 게 아니었구나.')return {...turn,text:'분리 순서가 여기서 이어지는구나.'};
      if(turn.text==='기계를 끄는 순서가 아니라, 사람에게 넘기는 순서였네.')
        return {...turn,text:'첫 커넥터부터 순서대로. 이제 계기판을 열 수 있겠네.'};
      if(turn.text==='찢긴 수첩을 두 장 옆에 펼쳤다. 부모님이 북쪽으로 보낸 것은 기계를 끄는 법이 아니라 명령권을 사람에게 돌리는 법이었다.')
        return narration('찢긴 수첩을 두 장 옆에 펼쳤다. 끊겨 있던 배선 번호가 이어졌다. 접지를 먼저 풀고, 표시한 커넥터를 차례로 빼는 순서였다.');
      return turn;
    }));
  }

  // These are actual paid choices, through the existing memory/echo owner.
  // No broad story flag is sufficient to claim which investigation came first.
  const orders=[];
  for(const prefix of ['', 'main_recovery_']){
    const id=prefix+'parents_separated_work';
    const defs=[
      {id:prefix+'parent_work_father_first',summary:'아빠가 숨긴 정비 위치를 먼저 표시했다.',afterKm:12,
        lines:[['sys','수첩 앞에 표시한 남산 정비 번호가 보였다.'],['나','이 번호부터 맞춰 보자. 엄마가 모은 증언도 그 옆에 펼쳐 두고.']]},
      {id:prefix+'parent_work_mother_first',summary:'엄마가 만든 증언 전달망을 먼저 표시했다.',afterKm:12,
        lines:[['sys','물자 묶음 옆에 적은 증언 전달 경로를 다시 보았다.'],['나','그 사람들이 남긴 말부터 읽자. 아빠의 정비표와도 맞춰 봐야 해.']]}
    ];
    D.choiceMemories[id]=defs;
    defs.forEach((def,choiceIndex)=>orders.push({id:def.id,eventId:id,choiceIndex}));
  }
  const readingOrder=S=>{
    const found=orders.filter(def=>{
      const row=S.memories?.choices?.[def.id];
      return row?.id===def.id&&row.eventId===def.eventId&&row.choiceIndex===def.choiceIndex;
    });
    return found.length===1?found[0].choiceIndex:null;
  };
  for(const prefix of ['', 'main_recovery_'])edition(prefix+'story_personal_cache').entry((S,turns)=>{
    const order=readingOrder(S);
    if(order===null)return turns;
    const first=order===0?'분리 절차 수첩 — 마지막 두 장 없음':'증언 카드 — 이송된 가족들의 증언';
    const second=order===0?'증언 카드 — 이송된 가족들의 증언':'분리 절차 수첩 — 마지막 두 장 없음';
    return turns.flatMap(turn=>turn.kind==='record'?[
      narration(order===0?'수첩에 먼저 표시해 둔 정비 번호를 찾아 분리 절차 수첩부터 펼쳤다. 증언 카드는 그 옆에 놓았다.'
        :'먼저 표시해 둔 전달 경로를 따라 증언 카드부터 펼쳤다. 분리 절차 수첩은 그 옆에 놓았다.'),
      {...turn,text:'상자 메모 · 펼쳐 본 기록\n'+first+'\n'+second+'\n발신 릴 — 타 버림'}
    ]:[turn]);
  });

  const reactions={
    minji:'민지는 공구함 뚜껑을 닫으려다 멈췄다. 손을 내려놓고 내가 장부를 덮을 때까지 기다렸다.',
    parkss:'박 선생은 컵을 내 쪽에 놓았다. 무슨 말을 하려다, 컵 손잡이만 돌려 주었다.',
    kangwoo:'강우는 손에 쥔 장갑을 천천히 접었다. 차 문을 닫지 않고 내 옆에 서 있었다.',
    leo:'레오는 기타 케이스를 바닥에 내려놓았다. 걸쇠는 열지 않았다.',
    jaeyi:'재이는 펼쳐 둔 기록의 끝에 손을 얹어 바람을 막았다. 종이를 가져가거나 덮지는 않았다.',
    eunsu:'은수는 헤드폰을 벗었다. 수신기 음량을 낮추고 손을 무릎 위에 모았다.'
  };
  for(const prefix of ['', 'main_recovery_']){
    const owner=edition(prefix+'parents_father_last_log');
    for(const index of [0,1])owner.result(index,(S,turns)=>{
      const companion=(S.party||[]).find(id=>reactions[id]);
      return [...turns,narration(companion?reactions[companion]:'종이 끝이 들려 손바닥으로 눌렀다. 한동안 그 손을 떼지 않았다.')];
    });
  }

  const familyTurns=()=>[
    narration('항만 중계 주파수에 부산 부두의 연락소를 불렀다. 몇 번 사람을 바꿔 부른 뒤 하진의 목소리가 잡혔다.'),
    {kind:'radio',who:'passer_woman',name:'하진 · 환승 대기구역',text:'부두에서 부산 외곽 환승 대기구역으로 옮겼어요. 다음 목적지는 아직 안 알려 줘요.'},
    say('me','도윤이하고 유나는요?'),
    {kind:'radio',who:'passer_woman',name:'하진',text:'둘 다 옆에 있어요. 유나는 담요 덮고 누웠고요. 도윤이는 그때 따뜻한 바람 나오던 얘기를 계속해요.'},
    say('me','이송표는 취소됐나요?'),
    {kind:'radio',who:'passer_woman',name:'하진',text:'아니요. 여기서 기다리라는 말만 바뀌었어요. 또 어디로 가라는 표가 나올지 몰라요.'},
    narration('수첩의 부두 주파수 옆에 환승 대기구역을 적었다. 첫 방송의 명단은 끝난 일정이 아니었다. 가족은 옮겨졌고, 이송 명령은 아직 유효했다.')
  ];
  D.events.push({id:'story_doyun_family_update',type:'스토리',once:true,noPool:1,
    roadApproach:{kind:'signal',label:'길가 단말에 부산 연락소의 주파수가 표시돼 있다',duration:4200,scene:{motif:'radio-post',people:0}},
    title:'환승 뒤에 남은 이송표',scene:'story-roadside-terminal-detail-v2',narrativeRevision:revision,
    needFlag:'bridge_departure_echo',text:()=>words(familyTurns()),turns:familyTurns,
    choices:[{label:'현재 대기구역과 연락 주파수를 적는다',out:[{p:1,
      text:'연락소를 통해 다시 부를 수 있는 주파수를 확인했다. 서울에서 명령을 멈추면 이곳에도 직접 소식을 전하기로 했다.',
      turns:[narration('연락소를 통해 다시 부를 수 있는 주파수를 확인했다. 서울에서 명령을 멈추면 이곳에도 직접 소식을 전하기로 했다.')],
      fx:{flag:'doyun_family_status_known'}}]}]});
  D.journeyBeats.push({id:'story_doyun_family_update',km:95,when:{flag:'bridge_departure_echo',noFlag:'doyun_family_status_known'}});
  D.journeyBeats.sort((a,b)=>(a.km||0)-(b.km||0));

  // Both closing routes call this helper at payment time. The main closure
  // projects its owner to session_reset; preserve that owner's edition too.
  edition('seoul_afterword_choice');
  edition('seoul_session_reset');
  const previousReturnTurns=D.finaleReturnTurns;
  D.finaleReturnTurns=S=>{
    const turns=previousReturnTurns(S),owner=S.pendingPresentation;
    if(!S.flags.doyun_family_status_known||owner?.eventId!=='seoul_session_reset'
      ||owner.narrativeRevision!==revision)return turns;
    return turns.map(turn=>{
      if(turn.kind==='radio'&&turn.who==='passer_woman'&&turn.name==='하진 · 부산 부두')
        return {...turn,name:'하진 · 환승 대기구역'};
      if(turn.text==='부산 부두에 이송 취소 소식을 전했다. 몇 번 사람을 바꿔 부른 뒤 하진의 목소리가 들렸다.')
        return {...turn,text:'부산 부두 연락소를 통해 환승 대기구역에 이송 취소 소식을 전했다. 잠시 뒤 하진의 목소리가 들렸다.'};
      if(turn.text==='하진은 아이들과 얘기해 보겠다고 했다. 나는 대답을 재촉하지 않고 부두의 연락 주파수를 적었다.')
        return {...turn,text:'하진은 아이들과 얘기해 보겠다고 했다. 나는 대답을 재촉하지 않고 연락소와 대기구역을 잇는 주파수를 적었다.'};
      return turn;
    });
  };

  const paidTrace=S=>{
    const ids=['first_trace_paper','first_trace_module','first_trace_scan'];
    const found=ids.map((id,choiceIndex)=>({row:S.memories?.choices?.[id],id,choiceIndex}))
      .filter(({row,id,choiceIndex})=>row?.id===id&&row.eventId==='onboarding_first_road'&&row.choiceIndex===choiceIndex);
    return found.length===1?found[0].choiceIndex:null;
  };
  const effortTurns=S=>{
    const turns=[],repair=S.opening?.decisions?.opening_bus_repair?.choiceId;
    if(repair==='new_part')turns.push(say('me','부산에서 내 부품 하나를 버스 난방에 썼어. 유나 손이 차가웠거든.'));
    if(repair==='scrap_collar')turns.push(say('me','부산에서 고철을 말아 버스 난방 고리를 깎았어. 다음 정차지에서 고리를 다시 봐 달라고도 했고. 한 번 고치고 끝낼 일이 아니었어.'));
    if(repair==='hose_bypass')turns.push(say('me','부산에서 남은 호스를 당겨 난방을 고쳤어. 부품 대신 시간을 썼지. 도윤이가 송풍구에 손을 대더라.'));
    const trace=paidTrace(S);
    if(trace===0)turns.push(say('cheollian','첫 검문소에서 명령띠를 끊지 않고 회수한 기록이 있습니다.'),
      say('me','부모님 표랑 번호를 맞춰 보려고. 그 번호부터 따라왔어.'));
    if(trace===1)turns.push(say('cheollian','첫 검문소의 전원을 끊고 저장 모듈을 회수했습니다.'),
      say('me','꺼 버려도 기록은 남아 있더라. 부모님 때의 것도 찾을 수 있다고 생각했어.'));
    if(trace===2)turns.push(say('cheollian','발신 기록을 받는 동안 달구지가 관측망에 등록됐습니다.'),
      say('me','스캔이 끝날 때까지 기다렸어. 끝나니까 이 차 번호도 남더라. 그래도 누가 그 표를 보냈는지는 알아야 했어.'));
    return turns;
  };
  const core=edition('seoul_core');
  core.result(4,S=>[
    narration(Math.round(S.stats?.km||0)+'km · DAY '+S.day+'의 일지를 코어 앞에 펼쳤다. 만난 사람과 그때 내린 선택, 달려온 길을 적어 둔 기록이다.'),
    ...effortTurns(S),
    say('me','너도 기록했지. 이것도 읽어 봐.'),
    say('cheollian','항목 간 연결은 확인됩니다. 손실을 감수한 선택의 가치값은 산출할 수 없습니다.'),
    say('me','가치 매기라고 쓴 거 아니야. 잊지 않으려고 썼지.'),
    narration('코어가 첫 장부터 마지막 장까지 다시 스캔했다.'),
    say('cheollian','인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오.')
  ]);
  core.result(1,S=>[
    say('me',(S.party||[]).length===1?'네 목록에 있던 사람을 전부 데려오진 못했어. 이 사람은 자기가 고른 이유로 같이 오겠다고 했어.':'네 목록에 있던 사람을 전부 데려오진 못했어. 여긴 자기가 고른 이유로 같이 오겠다고 한 사람들이야.'),
    narration((S.party||[]).length===1?D.comps[S.party[0]].name+'도 자기 물건을 쥔 채 한 걸음 앞으로 나왔다. 이 차에 타기 전에는 이름도 모르던 사람이다.':'각자 자기 물건을 쥔 채 한 걸음 앞으로 나왔다. 이 차에 타기 전에는 이름도 모르던 사람들이다.'),
    ...effortTurns(S),
    say('cheollian','각 개인의 과거 기록은 있습니다. 합류 이후 선택은 예측 범위를 반복해 벗어났습니다. 원인의 명칭을 요청합니다.'),
    say('me','차에 타고 나서는 서로 말 때문에 계획을 몇 번이나 바꿨어. 네 기록에도 있잖아.'),
    narration('코어는 우리 얼굴을 다시 한 번 훑었다.'),
    say('cheollian','인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오.')
  ]);
})();

/* Version two is only for a newly begun default prologue. The historical
   playlist remains immutable for the exact page/turn of an active v1 reader. */
(() => {
  const clone=page=>({...page,beats:page.beats.map(turn=>({...turn}))});
  const past=(scene,era,title)=>({scene,era,title,timeKind:'memory',
    beats:introBeats[scene].map(turn=>({...turn}))});
  D.journeyProloguePages=D.introHistoryPages.flatMap(original=>{
    if(original.scene==='intro-socket-memory-v1')return [
      past('intro-years-together','기억 · 할아버지와 일하던 여러 해','차와 질문을 고치는 동안'),
      past('intro-camper-conversion','기억 · 감천 작업장','용달차가 집이 되었다')
    ];
    const page=clone(original);
    if(page.scene==='intro-resistance-begins')page.beats[0]={...page.beats[0],
      text:'첫 이송 뒤에 사람들은 어떻게 했는지 물었다. 할아버지는 수첩을 펴고, 항의하러 갔던 사람들의 이름을 짚었다.'};
    if(page.scene==='intro-envelope-signal')page.beats[0]={...page.beats[0],
      text:'할아버지는 점점 작업대보다 의자에 오래 앉았다. 마지막 겨울에는 계단 중간에서도 쉬었다.'};
    return [page];
  }).map(page=>({...page,text:page.beats.map(turn=>turn.text).join('\n\n')}));
})();

// Only a recollection encountered on the road is optional. Camp aftermaths
// carry unresolved real consequences and the automatic opening has its own owner.
(() => {
  const row=D.events.find(event=>event.id==='memory_busan_terminal');
  const legacyText=row.text,legacyOut=row.choices.map(choice=>choice.out[0].text);
  const revision='travel-memory-v1';
  const current=S=>S.pendingPresentation?.eventId!==row.id
    ||S.pendingPresentation.phase==='transition'||S.pendingPresentation.narrativeRevision===revision;
  row.travelMemory={title:'부산 터미널에서 기다리던 밤',cue:'문득, 그날이 떠올랐다.'};
  row.roadApproach=false;row.narrativeRevision=revision;
  row.text=S=>current(S)?'수첩 사이에 끼워 둔 낡은 이송표를 보니, 부산 터미널에서 부모님의 다음 차를 기다리던 밤이 떠올랐다.\n\n'+legacyText.split('\n\n').slice(1).join('\n\n'):legacyText;
  row.choices.forEach((choice,index)=>{
    choice.out[0].text=S=>current(S)?legacyOut[index]
      .replace('안내판 불이 다시 켜지는 소리에 고개를 들었다. 눈앞에는 지금 지나고 있는 폐환승소가 있었다.','이송표를 다시 수첩 사이에 끼웠다. 지금 확인하러 가는 것도 그때 끝내 듣지 못한 대답이었다.')
      .replace('엔진 진동이 손끝에 전해졌다. 기억에서 돌아와 다시 앞유리 너머의 길을 보았다.','수첩을 덮고 고개를 들었다. 앞유리 너머로 지금 가야 할 길이 보였다.'):legacyOut[index];
  });
})();
