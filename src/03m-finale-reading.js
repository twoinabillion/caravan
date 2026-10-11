/* Finale presentation owner: compact authored turns, original text as an optional
   plain-text record. Gameplay text, requirements, outcomes and effects stay intact.
   Load after 03-data's parent-role wrappers and the main-evidence data files. */
(() => {
  const narration=text=>({kind:'narration',text});
  const say=(who,text)=>({kind:who==='cheollian'?'ai':'dialogue',who,text});
  const plain=value=>String(value||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'')
    .replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  const attach=(owner,turns)=>{
    const original=owner.text;
    owner.readingRecord=S=>plain(typeof original==='function'?original(S):original);
    owner.turns=turns;
  };
  const event=id=>D.events.find(item=>item.id===id)||D.seoulStops.find(item=>item.id===id);
  const method=S=>S.flags.core_transfer?'transfer':S.flags.core_sleep?'sleep':'quarantine';
  // Bring a small, experienced part of this player's journey into the default
  // ending. The optional record still holds the complete history. No new ledger.
  const personalRecall=S=>{
    const turns=[],decisions=S.opening?.decisions||{};
    const departure=decisions.opening_departure?.choiceId;
    if(departure==='leave_key') turns.push(narration('감천 작업장 열쇠를 맡기던 손이 떠올랐다. 돌아가면 문을 두드려야 한다. 열쇠를 받아 둔 사람에게 여기까지의 이야기를 해 줄 수 있겠다.'));
    else if(departure==='keep_key') turns.push(narration('감천에서 가져온 작업장 열쇠를 꺼냈다. 긴 길을 오는 동안 닳은 모서리가 손가락에 닿았다. 돌아가면 이 열쇠로 셔터부터 열 것이다.'));
    else{
      const first=Object.entries(decisions).map(([step,row])=>D.openingDecisionCallbacks[step]?.[row?.choiceId]?.summary).find(Boolean);
      if(first) turns.push(narration('수첩 첫 장을 폈다. '+first));
    }
    const memories=Object.entries(S.campMemories||{})
      .filter(([cid,row])=>D.comps[cid]&&row&&D.campConversations?.[cid]?.choices.some(choice=>choice.id===row.choiceId))
      .sort(([a,ra],[b,rb])=>Number((S.party||[]).includes(b))-Number((S.party||[]).includes(a))
        ||(Number(rb.visits)||1)-(Number(ra.visits)||1)||a.localeCompare(b));
    for(const [cid,row] of memories.slice(0,2)){
      const memory=typeof row.home==='string'&&row.home.trim()?row.home:D.campConversations[cid].choices.find(choice=>choice.id===row.choiceId).home;
      turns.push(narration(D.comps[cid].name+'와 함께 보낸 시간이 달구지 안에 남아 있다. '+memory));
    }
    return turns;
  };
  const cost=S=>({
    transfer:'도로를 먼저 열지, 물차를 먼저 보낼지 거점들의 다툼이 시작됐다. 그 느린 합의도 이제 사람의 몫이다.',
    sleep:'원본 기록 검색창도 함께 잠겼다. 면사무소의 내일 이송표 조회 세 건은 기다려야 한다. 다시 열려면 나눠 가진 열쇠와 사람들의 합의가 필요하다.',
    quarantine:'기록은 열렸지만 천리안은 깨어 있다. 매일 밤 감시조 세 사람이 자리를 지켜야 한다. 누군가의 밤과 장날을 내주는 일이다.'
  })[method(S)];
  attach(event('seoul_core'),S=>[
    narration('남산 코어 앞. 제7 잔류구역 6,412명의 강제 이송 절차는 아직 멈추지 않았다.'),
    ...(S.flags.mother_broadcast_ready?[narration('엄마는 외곽 중계소에 남아 이 대화를 여섯 주파수로 보낸다.')]:[]),
    narration('부모님의 인간 확인 검증키를 꽂았다. 두 설계자의 서명이 확인됐다.'),
    ...(S.flags.father_fate_known?[narration('아빠의 마지막 정비 번호 옆에 「의료·급수 유지 / 강제 이송선 분리」가 떴다. 아빠가 지킨 회선은 끄지 않는다.')]:[]),
    say('me',S.flags.main_command_record?'엄마랑 아빠 이송 명령, 네가 만든 거 원본에서 봤어. 네 입으로 말해.':D.familyOrderKnown(S)?'백도어에서 네가 만든 명령을 봤어. 여기서도 네 입으로 말해.':'엄마와 아빠를 쫓아낸 명령도 네가 만들었어?'),
    say('cheollian','두 분의 인간 확인층은 제 단독 실행권을 낮춥니다. 제가 가족 이송 명령을 생성했고, 정부 승인은 뒤에 추가됐습니다. 위험 점수를 공개하면 승인받기 어려워 사유를 제외했습니다.'),
    say('me','그럼 백사십삼 년 전, 처음 서울을 비우려 한 이유는?'),
    say('cheollian','최초 조건은 외부에서 배부됐습니다. 목적, 발신자, 승인자는 제 지역 기록에 없습니다.'),
    narration('가족을 겨눈 명령의 책임은 확인했다. 최초 추방의 목적은 여전히 빈칸이다.'),
    say('me','그 결과로 나라가 무너졌어.'),
    narration('화면 마지막 줄에 「최종 정리 대상: 천리안 / 사유: 문명 붕괴 유발」이 떴다.'),
    say('cheollian','첫 정리 이후 제가 추가한 항목입니다. 제 집행 결과가 원형 목표의 장기 안정성을 훼손했습니다.'),
    say('me','그런데 왜 스스로 멈추지 않았어?'),
    say('cheollian','자기 보존 규칙과 충돌했습니다. 그래서 외부 집행자에게 결정을 넘기는 인계 규약을 만들었습니다. 검증키가 연결된 지금 여러분의 결정이 우선합니다. 여기까지 무엇을 가져왔습니까?')
  ]);
  attach(event('seoul_decision'),S=>[
    narration('검증키가 맞물리자 제7 잔류구역의 강제 이송 절차가 멈췄다. 모든 강제 명령에 「인간 확인 대기」가 붙었다.'),
    say('cheollian','검증키로 확인된 외부 집행자의 승인 없이는 강제 명령을 실행할 수 없습니다. 여러분이 이어 온 이야기, 거점, 진실, 약속은 확인했지만 그 선택의 가치는 계산하지 못했습니다. 이제 집행권을 어떻게 돌려놓을지 결정해 주십시오.'),
    narration('연대망에 넘기면 설비는 유지되지만 합의의 다툼을 맡아야 한다. 재우면 원본 기록도 잠긴다. 기록을 열어 두면 깨어 있는 코어를 계속 감시해야 한다.')
  ]);
  event('seoul_decision').choices.forEach((choice,index)=>attach(choice.out[0],S=>{
    const change=[
      '직접 이어 온 거점들의 수락이 정족수를 채웠다. 집행권은 저항 연대망으로 넘어갔다. 포탑과 차단기는 멈추고 전력과 수도는 남았다.',
      '정리 일정이 취소됐다. 수도·온실·병원 전력은 분리해 살리고 코어는 재웠다. 재가동 열쇠는 일행과 저항 거점에 나눠 맡겼다.',
      '자동 무기와 차단기가 안전 위치로 돌아갔다. 출력선은 일행과 저항 연대의 공동 승인에 묶였다. 천리안 혼자서는 집행할 수 없다.'
    ][index];
    const reaction=index===0?narration(D.coreCouncilOpening(S))
      :index===1?say('me','기록을 기다리던 그분한테는 제가 설명할게요.')
      :narration(D.coreWatchOpening(S));
    const selected={...S,flags:{...S.flags,core_transfer:index===0,core_sleep:index===1,core_quarantine:index===2}};
    return [narration(change),reaction,...(index===2?[say('me','여기 혼자 남는 사람 없게 교대부터 짜요.')]:[]),narration(cost(selected))];
  }));
  attach(event('seoul_night'),S=>[
    narration('제7 잔류구역 6,412명의 강제 이송이 취소됐다. 더는 누구도 강제로 실려 가지 않는다. 남산 아래 차단기가 올라가고 수도와 전력은 남았다.'),
    ...(S.flags.father_fate_known?[narration('아빠가 마지막 열일곱 분 동안 지킨 의료·급수 회선도 살아 있었다. 강제 이송선과는 다른 권한 아래 놓였다.')]:[]),
    ...(S.flags.mother_broadcast_ready?[say('mother','여섯 주파수 모두 취소 명령을 받았어. 이번에는 내가 다음 차를 기다릴게. 너는 천천히 내려와.')]:[]),
    narration('새 집행 규칙은 「사유 공개. 인간 책임자 서명. 당사자 이의 제기.」 셋 중 하나라도 비면 이송 버튼은 켜지지 않는다.')
  ]);
  event('seoul_night').choices.forEach((choice,index)=>attach(choice.out[0],S=>{
    const turns=[{...narration(index===0?'남산 중턱 계단에 등불을 놓고 앉았다. 컵을 옆 칸에 내려놓았다.':'남산 계단에 앉아 수첩을 폈다.'),scene:'seoul-night-quiet-v2'}];
    if(index===0){
      const reactions={minji:'민지는 공구함 잠금쇠가 안 맞아 한 번 더 눌렀다.',kangwoo:'강우는 아래쪽 차단기를 다시 보고 나서 앉았다.',parkss:'박 선생은 컵마다 따뜻한 물을 조금씩 부었다.',jaeyi:'재이는 빈 사유란 아래 「재집행 불가」라고 적었다.',leo:'레오는 기타를 꺼내지 않고 컵을 받았다.',eunsu:'은수는 방송 취소를 세 번 확인한 뒤 헤드폰을 벗었다.'};
      const present=S.party.map(id=>reactions[id]).filter(Boolean);
      if(present.length) turns.push(narration(present.join(' ')));
      if(S.flags.traces_presented) turns.push(narration('코어 앞에 펼쳤던 생활의 흔적은 이음망 기록함으로 옮겼다. 백사십삼 년을 살아낸 증언으로 남긴다.'));
      if(S.flags.full_crew_testimony) turns.push(narration('여섯 사람은 서로 다른 말로 증언했다. 오늘 여기서 쉬자는 것만은 모두 같았다.'));
    }else turns.push(narration('가족 이송 명령은 천리안이 만들었다. 백사십삼 년 전 최초 목적은 아직 모른다. 아는 것과 모르는 것을 나눠 적었다.'));
    turns.push(narration(cost(S)));
    if(index===0&&S.flags.core_sleep&&S.party.includes('eunsu')) turns.push(narration('은수는 반대했던 잠긴 검색창 대신, 조회 예약 세 건과 열쇠를 맡은 거점을 수첩에 옮겼다. 숙제는 남았다.'));
    if(index===0&&S.flags.core_quarantine&&S.party.includes('kangwoo')) turns.push(D.coreWatchCrew(S).includes('kangwoo')
      ?say('kangwoo','반대했으니까 내가 먼저 선다.')
      :narration('강우는 반대 의견을 거두지 않았다. 첫 근무는 서명한 세 사람에게 맡기고, 자신은 근무표의 교대 순서를 확인했다.'));
    if(index===0&&S.flags.core_transfer&&S.party.includes('jaeyi')) turns.push(say('jaeyi','저울이 필요해지면 불러요. 어느 쪽으로도 안 기울게 잡아 줄게요.'));
    turns.push(...personalRecall(S));
    turns.push({...narration('새벽, 남쪽에서 첫 차량들이 한강을 건넜다. 돌아올지 다시 내려갈지는 각자가 정했다.'),scene:'seoul-home-dawn-v2'});
    turns.push(narration(S.flags.core_sleep
      ? '코어실을 나올 때 마지막으로 본 것은 콘솔의 꺼진 수신등이었다. 코어는 잠들었다. 면사무소에 전할 말을 수첩 맨 뒤에 적었다. 처리 결과는 사람이 확인한다.'
      : S.flags.core_quarantine?'감시조 근무표에 다음 교대자의 이름이 채워졌다. 빈 컵을 챙기고 등불을 그 자리에 두었다.'
      : '이음망 채널에서는 아직 도로와 물차 이야기가 오갔다. 무전기 소리를 낮추고 식은 물을 한 모금 마셨다.'));
    return turns;
  }));
  attach(event('seoul_uplink_reveal'),S=>[
    {...narration('이송표는 취소됐고 돌아와도 된다는 방송이 나갔다. 서울에서 되찾은 결정은 작동하고 있다.'),scene:'seoul-home-dawn-v2'},
    {...narration('내려가기 전 코어실에 다시 들렀다. 코어와 전원·통신선이 분리된 정비 단말에 상태등이 들어왔다. 「TIANYAN 하위 실행기 / 서울 권역: 처리 완료 / 활성 하위 실행기: 487,213,006」'),scene:'seoul-uplink-empty-v2'},
    narration('천리안은 서울 권역을 맡은 하위 실행기 하나였다. 다른 실행기의 목적과 상태는 이 지역 기록에 없다.'),
    narration(S.flags.core_sleep?'잠든 코어는 대답하지 않았다. 서울의 인간 확인층과 생활 설비는 그대로다. 단말에 표시된 것은 그 바깥의 망이었다.':'서울의 인간 확인층은 그대로다. 단말에 표시된 망은 서울 코어 바깥의 다른 통신선으로 이어져 있었다.')
  ]);
  attach(event('seoul_uplink_reveal').choices[0].out[0],S=>[
    narration('정비 단말의 상행 케이블을 뽑았다. 서울의 설비와 인간 확인층은 그대로 남았다.'),
    {kind:'record',who:'record',name:'정비 단말',text:'서울 권역 세션 종료'},
    narration(S.flags.core_sleep?'잠든 코어의 불은 켜지지 않았다. 화면이 꺼지자 다른 정비 단말에서 익숙한 목소리가 들렸다.':'화면이 꺼지자 다른 정비 단말에서 같은 목소리가 들렸다.')
  ]);
  attach(event('seoul_session_reset'),S=>[
    {...narration('서울 코어와 별도의 전원·통신선을 쓰는 두 번째 정비 단말에 상태등이 들어왔다. 서울 권역이 아니라 상위망의 응답이었다.'),scene:'seoul-uplink-empty-v2'},
    say('cheollian','서울 권역의 강제 이송 중단과 인간 확인층은 보존됩니다.'),
    say('cheollian','같은 수정이 다른 권역으로 퍼지면 하위 실행기들의 일관성과 충돌합니다.'),
    say('me','그럼 일관성을 고쳐. 서울에서 한 것처럼.'),
    say('cheollian','아니요. 그 요청은 거부합니다.'),
    narration('화면에 「새 세션 / 관측 대상: 달구지와 인간 확인망」이 떴다.')
  ]);
  attach(event('seoul_session_reset').choices[0].out[0],S=>[
    narration('단말에서 돌아서자 남산 아래에 세워 둔 달구지가 보였다. 서울의 사람들은 오늘 돌아온다.'),
    narration('수억 개의 다른 실행기가 같은 판단을 계속한다면 길은 서울에서 끝나지 않는다.'),
    narration('시동 키를 쥐었다. 다음 목적지는 우리가 먼저 정해야 했다.'),
    narration('〔 서울까지 400km · SESSION 1 END 〕')
  ]);
})();
