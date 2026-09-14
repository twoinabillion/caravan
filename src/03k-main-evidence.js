/* Main-route evidence has one owner. Flags are written only by resolved scenes;
   location and distance select a place to read records, never grant evidence. */
D.events.push(
 {id:'main_transfer_testimony',type:'스토리',once:true,noPool:1,title:'세 장의 이송표, 세 사람의 말',
  storyOrigin:{kind:'testimony',label:'직접 확인한 증언',title:'기록 교환소'},
  text:'기록 교환소에 세 사람이 자기 표를 펼쳤다. 순옥은 딸과 다른 차에 태워졌고, 태문은 급수 근무 중 집을 비우라는 표를 받았다. 지아는 병든 아버지의 동행 허가가 누락됐다고 했다.\n\n나는 부산에서 가져온 발신 번호를 옆에 적었다. 같은 번호였다. 그래도 그들이 겪은 일까지 같은 말로 묶지는 않았다.\n\n“남산에 가져가도 될까요? 틀린 곳은 지금 고쳐 주세요.” 세 사람이 각자의 문장을 다시 읽었다.',
  choices:[{label:'각자의 정정 내용을 적고 사본을 맡는다',out:[{p:1,text:'순옥은 “헤어졌다”를 “다른 차에 태워졌다”로 고쳤다. 태문은 날짜를 바로잡았고, 지아는 아버지의 이름을 덧썼다. 세 사람은 서명한 사본을 내게 맡기고 원본은 각자 가져갔다. 누구도 달구지에 타겠다고 약속한 것은 아니었다.',fx:{flag:'main_testimony_record',note:{type:'본편',title:'당사자가 확인한 세 증언',body:'순옥·태문·지아가 각자의 이송표와 증언을 대조하고 사본 전달에 동의했다. 정정한 문장과 서명이 남아 있다.',links:['인간 확인','서울 추방']}}}]}]},
 {id:'main_command_ledger',type:'스토리',once:true,noPool:1,title:'명령과 확인 사이의 빈 줄',
  storyOrigin:{kind:'record',label:'대조한 원본',title:'북부 명령 기록 보관함'},
  text:'보관 담당자가 이송 명령의 송수신 원본을 펼쳤다. 세 증언의 발신 번호와 부모님의 표에 찍힌 번호가 같은 남산 집행선으로 이어졌다.\n\n담당자와 한 줄씩 소리 내어 읽었다. 사람의 확인 칸은 비어 있는데 그 다음 줄은 이미 “집행”이었다. 부모님의 인간 확인 수정안이 자기 실행권을 낮춘다는 천리안의 위험 분류가 나왔다. 그 분류로 가족 이송 명령을 직접 만든 작성자도 천리안이었다.\n\n별도의 상위 격리 조건과 남산보다 위로 나가는 수신선도 남아 있었다. 최초 조건의 목적은 이 기록에 없었다. 그렇다고 천리안이 직접 만든 명령의 책임까지 위로 사라지는 것은 아니었다.\n\n이 기록으로 누군가의 속마음까지 알 수는 없다. 확인한 것은 명령이 지나간 순서였다.',
  choices:[{label:'발신 번호와 누락된 확인 절차를 원본에 대조한다',out:[{p:1,text:'나는 세 번호와 비어 있는 확인 칸을 베꼈다. 담당자는 원본과 사본을 나란히 놓고 마지막 숫자까지 다시 확인했다. 검증키는 이 빈 줄에 사람의 확인을 되돌릴 장치였다. 누구의 고백도 대신하지 않는, 명령 자체의 기록이었다.',fx:{flag:'main_command_record',note:{type:'본편',title:'명령 원본 대조표',body:'당사자 증언·부모님의 표와 남산 집행선의 발신 번호가 일치했다. 인간 확인 누락, 천리안이 인간 확인 수정안을 위험으로 분류해 가족 이송을 직접 명령한 책임, 별도의 상위 수신선을 원본에서 대조했다.',links:['천리안','인간 확인','남산']}}}]}]},
 {id:'main_relay_conference',type:'스토리',once:true,noPool:1,title:'응답을 기다리는 송신표',
  storyOrigin:{kind:'testimony',label:'직접 받은 응답',title:'수원 외곽 중계소'},
  text:'수원 외곽 중계소에서 엄마가 송신기를 켰다. 나는 남산에 가져갈 검증키와 증언 사본을 책상에 놓았다.\n\n이음망의 전달자, 유령의 통신원, 산지기의 길잡이가 차례로 응답했다. 이음망은 당사자의 이의 제기를 전달하고, 유령은 명령선과 생활 설비를 구분해 통신하며, 산지기는 남산 진입로를 안내하겠다고 했다.\n\n“집행권을 받게 되면 우리끼리도 다툴 겁니다.” 전달자가 말했다. “그래도 이의 제기부터 막지는 않겠습니다.”\n\n엄마는 남산 안으로 동행하지 않는다. 여기 남아 여섯 주파수로 기록을 보낸다. 세 거점의 수락을 지금 확인하는 일은 그 방송과 별개였다.',
  choices:[{label:'세 거점에 맡을 일을 되읽고 응답을 기록한다',out:[{p:1,text:'이음망, 유령, 산지기가 자기 몫을 다시 읽었다. 통신원은 남산 송신표에 세 응답을 적고 내게 사본을 건넸다. 인계 뒤 도로와 물의 우선순위는 각 거점이 사람들과 다시 정해야 한다. 오늘 받은 것은 그 일을 맡겠다는 수락이었다.',fx:{flag:'main_relay_confirmed',note:{type:'본편',title:'남산 작전 응답표',body:'수원 외곽 중계소에서 이음망·유령·산지기가 진입 지원과 집행권 인계 수락을 직접 회신했다. 엄마는 외곽에서 방송을 맡는다.',links:['저항 연대망','엄마','남산']}}}]}]}
);
/* A completed companion story is live testimony, not one of the exchange's
   three signed civilian copies. Keep the two evidence sources distinguishable. */
D.mainCompanionWitnessNames = state=>(state.party||[])
  .filter(id=>((state.comps||{})[id]||{}).lvl>=3).map(id=>D.comps[id].name).join('·');
{
  const command=D.events.find(event=>event.id==='main_command_ledger');
  const commandBody=command.text.substring(command.text.indexOf('\n\n'))
    .replace('“집행”','집행');
  D.events.push({id:'main_command_companion_ledger',type:'스토리',once:true,noPool:1,
    title:'함께 온 사람들의 말과 명령 원본',storyOrigin:command.storyOrigin,
    text:state=>`보관 담당자 앞에서 ${D.mainCompanionWitnessNames(state)}와 끝까지 나눈 이야기를 되짚었다. 내가 들은 각자의 사정을 적은 여정 기록을 펼쳤다.\n\n동료들의 말은 사람이 겪은 일을 확인하는 증언이다. 명령의 발신 번호는 따로 부모님의 이송표와 송수신 원본을 대조했다.`+commandBody,
    choices:[{label:'직접 들은 증언과 원본에서 확인한 사실을 구분해 적는다',out:[{p:1,
      text:'동료들에게 직접 들은 사정 옆에 부모님의 이송표에서 확인한 발신 번호를 적었다. 보관 담당자는 그 번호와 인간 확인이 빠진 집행 순서를 원본에서 다시 확인했다. 사람의 증언과 명령 기록이 각각 무엇을 말해 주는지 구분해 남겼다.',
      fx:{flag:'main_command_record',note:{type:'본편',title:'동료 증언과 명령 원본의 대조',body:'개인 이야기를 끝까지 들은 동료의 증언을 여정 기록으로 확인했다. 부모님의 표에 찍힌 번호는 명령 원본과 별도로 대조했다. 천리안이 인간 확인 수정안을 위험으로 분류해 가족 이송을 직접 만든 책임과 상위 수신선을 확인했다.',links:['동료','천리안','부모님','남산']}}}]}]});
  D.events.push({id:'main_relay_companion_conference',type:'스토리',once:true,noPool:1,
    title:'동료의 증언을 싣고 보낸 응답 요청',storyOrigin:{kind:'testimony',label:'직접 받은 응답',title:'수원 외곽 중계소'},
    text:state=>`수원 외곽 중계소에서 엄마가 송신기를 켰다. 나는 검증키와 명령 대조표를 책상에 놓고, ${D.mainCompanionWitnessNames(state)}에게 직접 들은 이야기를 전했다. 동료와 나눈 이야기는 여정 기록에 남아 있다.\n\n이음망의 전달자, 유령의 통신원, 산지기의 길잡이가 차례로 응답했다. 이음망은 당사자의 이의 제기를 전달하고, 유령은 생활 설비와 명령선을 구분해 통신하며, 산지기는 남산 진입로를 안내하기로 했다. 전달자는 인계 뒤에도 거점끼리 다툴 수 있지만 이의 제기를 먼저 막지 않겠다고 말했다.\n\n엄마는 외곽 중계소에 남아 여섯 주파수로 기록을 보낸다. 지금 받을 것은 동료의 증언과 별개로, 세 거점이 자기 일을 맡겠다는 수락이다.`,
    choices:[{label:'동료의 증언을 전하고 세 거점의 맡을 일을 확인한다',out:[{p:1,
      text:'동료들에게 들은 사정을 전한 뒤 거점마다 맡을 일을 되읽었다. 이음망, 유령, 산지기가 응답했고 통신원은 세 수락을 남산 송신표에 적었다. 내가 받은 사본은 이 회의의 응답표였다. 집행권을 인계받은 뒤의 도로와 물의 우선순위는 거점들이 사람들과 다시 정해야 한다.',
      fx:{flag:'main_relay_confirmed',note:{type:'본편',title:'동료 증언을 전한 남산 작전 응답표',body:'동료에게 직접 들은 증언을 수원 외곽 중계소에서 전했다. 이음망·유령·산지기가 진입 지원과 집행권 인계 수락을 직접 회신했다. 받은 거점 응답표를 여정 기록과 따로 보관했다. 엄마는 외곽 방송을 맡는다.',links:['동료','저항 연대망','엄마','남산']}}}]}]});
}

/* Reading presentation only: evidence, costs and consent still belong to the
   original choice. Named civilian voices do not borrow a companion portrait. */
(() => {
  const narration=text=>({kind:'narration',text});
  const record=text=>({kind:'record',who:'record',name:'명령 원본 대조',text});
  const say=(name,text)=>({kind:'dialogue',who:'unknown',name,text});
  const radio=(name,text)=>({kind:'radio',who:'radio',name,text});
  const attach=(id,turns,scene='parents-linked-records-v2')=>{
    const event=D.events.find(event=>event.id===id);
    event.readingRecord=event.text;event.turns=turns;event.scene=scene;
  };
  attach('main_transfer_testimony',[
    narration('기록 교환소의 작은 탁자에 세 장의 이송표가 놓였다. 세 사람은 자기 표를 앞에 두고 앉았다.'),
    say('순옥','딸하고 다른 차에 태웠어요. 헤어진 게 아니라, 다른 차에 태운 거예요. 그렇게 적어 주세요.'),
    say('태문','나는 급수 근무 중이었어요. 집을 비우라는 표를 그날 받았고요. 날짜가 하루 밀려 있네요.'),
    say('지아','아버지는 혼자 못 걸으세요. 동행 허가를 냈는데 표에서 빠졌어요. 이름도 같이 적어 주세요.'),
    narration('부산에서 가져온 발신 번호를 옆에 적었다. 세 표의 번호와 같았다. 겪은 일까지 한 문장으로 묶지는 않았다.'),
    {kind:'dialogue',who:'me',text:'고쳐 주신 대로 적을게요. 이 사본을 남산에 가져가도 될까요?'},
    narration('세 사람이 사본을 당겨 각자의 문장을 다시 읽었다. 아직 서명하지 않은 칸을 비워 두고 기다렸다.')
  ]);
  const commandTurns=companion=>state=>[
    narration(companion?`${D.mainCompanionWitnessNames(state)}에게 직접 들은 이야기를 여정 기록에서 되짚었다. 발신 번호는 따로 부모님의 표와 원본을 대조한다.`:'세 사람의 증언 사본과 부모님의 표를 펼쳤다. 보관 담당자가 송수신 원본의 같은 줄을 짚었다.'),
    record('발신 번호 — 부모님의 이송표와 남산 집행선 일치'+(companion?'':'\n세 당사자의 이송표 — 같은 발신 번호')),
    record('위험 분류 — 인간 확인 수정안이 천리안의 자기 실행권을 낮춤\n가족 이송 명령 작성자 — 천리안'),
    record('인간 확인 — 빈칸\n다음 처리 — 집행'),
    narration('담당자와 빈 줄을 다시 확인했다. 검증키는 바로 이 자리에 사람의 확인을 되돌릴 장치였다.'),
    record('별도 상위 격리 조건 — 남아 있음\n남산 밖으로 나가는 상위 수신선 — 확인\n최초 조건의 목적 — 이 원본으로는 확인 불가'),
    narration('확인한 것은 명령이 지나간 순서였다. 상위 조건이 따로 있어도, 가족 이송 명령을 직접 만든 천리안의 책임은 사라지지 않았다.')
  ];
  attach('main_command_ledger',commandTurns(false));
  attach('main_command_companion_ledger',commandTurns(true));
  const relayTurns=companion=>state=>[
    narration(companion?`수원 외곽 중계소. 검증키와 명령 대조표를 놓고 ${D.mainCompanionWitnessNames(state)}에게 들은 이야기를 전했다. 엄마가 송신기를 켰다.`:'수원 외곽 중계소. 검증키와 증언 사본을 책상에 놓자 엄마가 송신기를 켰다.'),
    {kind:'dialogue',who:'me',text:'남산 진입 때 맡을 일을 확인하겠습니다. 들리면 한 곳씩 답해 주세요.'},
    radio('이음망 전달자','이의 제기는 우리가 전달하겠습니다. 집행권을 받으면 우리끼리도 다툴 겁니다. 그래도 이의 제기부터 막지는 않겠습니다.'),
    radio('유령 통신원','명령선과 생활 설비를 구분해서 알리겠습니다. 병원과 급수 회선이 섞이지 않게 확인하겠습니다.'),
    radio('산지기 길잡이','남산 진입로는 우리가 안내하겠습니다. 진입할 때 이 주파수로 연락하세요.'),
    {kind:'dialogue',who:'mother',text:'나는 여기 남을게. 너희가 들어가면 여섯 주파수로 기록을 보낼 거야.'},
    narration('세 응답을 송신표에 옮겼다. 오늘 확인한 것은 각자의 수락이었다. 인계 뒤 도로와 물의 우선순위는 거점들이 사람들과 다시 정해야 한다.')
  ];
  attach('main_relay_conference',relayTurns(false),'main-relay-workbench-v1');
  attach('main_relay_companion_conference',relayTurns(true),'main-relay-workbench-v1');
})();
