/* Northern recovery is a present visit to the exchange, not a replay of a missed
   southern encounter. Effects/costs stay with the source choice; provenance is new. */
D.mainRecoveryEvents = Object.fromEntries([
  'onboarding_first_road','parents_diversion_manifest','parents_separated_work',
  'story_family_principle','story_family_key','story_personal_cache','story_parent_route_shared',
  'story_parent_route_guarded','history_failed_namsan','parents_father_last_log'
].map(id=>[id,`main_recovery_${id}`]));
D.mainEvidenceCompletion = {
  onboarding_first_road:'first_order_trace',parents_diversion_manifest:'parents_split_known',
  parents_separated_work:'parents_routes_traced',story_family_principle:'parent_principle_found',story_family_key:'parent_key_located',
  story_personal_cache:'parent_key_found',story_parent_route_shared:'parent_key_found',
  story_parent_route_guarded:'parent_key_found',history_failed_namsan:'failed_namsan_known',
  parents_father_last_log:'father_fate_known',history_parents_network:'parents_recent_signal',
  parents_mother_reunion:'mother_reunited',parents_mother_truth:'mother_broadcast_ready'
};
(() => {
  const copies={
    onboarding_first_road:{title:'수원에 도착한 발신 기록',
      text:'수원 북부 교환소의 보관 담당자가 남쪽 검문 단말에서 옮겨 온 종이띠 사본과 저장 모듈을 내놓았다. 나는 그 검문소에서 기록을 확보하지 못했다. 이곳에서 출처와 복사 시각을 먼저 확인한다.\n\n부모님의 이송표와 앞 여덟 자리가 같은 발신 번호가 남아 있었다. 배급망이 바뀔 때마다 이송 대상을 다시 고른다는 규칙도 적혀 있었다. 종이 사본을 대조할지, 맡겨진 모듈을 열지, 북부 단말로 원격 원본을 조회할지 고를 수 있다.',
      labels:['종이띠 사본의 발신 번호를 대조한다','교환소가 보관한 저장 모듈을 연다','차량 번호로 원격 원본을 조회한다'],
      outcomes:[
        '보관 담당자와 부모님의 표를 나란히 놓았다. 발신 번호의 앞 여덟 자리가 같았다. 담당자가 사본 구석에 남쪽 검문소 이름과 전달 날짜를 적어 줬다.',
        '작업대에서 교환소에 맡겨진 저장 모듈을 열었다. 담당자와 전달 날짜를 확인한 뒤 발신 번호와 반복 이송 규칙을 베꼈다. 이 모듈은 남쪽 단말에서 회수돼 여기까지 전달된 것이었다.',
        '수원 단말에 달구지 번호를 넣고 원격 기록을 요청했다. 부모님의 표와 발신 번호가 맞았다. 출력물을 챙기는 동안 화면 한쪽에 「조회 차량 등록」이 떴다. 달구지 번호였다.'
      ],
      notes:['수원 북부 교환소에서 남쪽 검문 단말의 종이띠 사본을 대조했다. 부모님의 표와 앞 여덟 자리가 같은 발신 번호, 배급망 변화에 따른 반복 이송 규칙을 확인했다.',
        '수원 북부 교환소가 보관한 남쪽 단말의 저장 모듈을 열어 발신 번호와 재평가 규칙을 확인했다.',
        '수원 단말에서 달구지 번호로 원격 원본을 조회했다. 관측 흔적을 남기는 대신 부모님의 표와 앞 여덟 자리가 같은 발신 번호를 확인했다.']},
    parents_diversion_manifest:{title:'교환소의 환승 운행표 사본',
      prefix:'수원 북부 교환소에서 남쪽 환승소가 보낸 운행표와 분류 기록의 사본을 받았다.\n\n',
      text:'부모님의 다음 차는 실제로 있었지만 부산으로 출발하지 않았다. 탑승 직전 아빠는 남산 기술 유지선, 엄마는 중부 기록 정리소로 따로 분류됐다. 나는 두 사람이 갈라진 자리를 사본에서 짚었다.'},
    parents_separated_work:{title:'두 곳에서 온 기록의 사본',
      prefix:'수원 북부 교환소에서 남산 정비표와 중부 증언 카드의 전달 사본을 나란히 펼쳤다. 출처는 서로 달랐지만 묶음 번호가 같았다.\n\n'},
    story_family_principle:{title:'보관망이 전달한 부모님의 영상',
      scene:'story-family-principle-review-v1',
      storyOrigin:{kind:'video',label:'전달받은 복원 영상',title:'수원 북부 교환소 · 남쪽 보관망 사본'},
      text:D.events.find(event=>event.id==='story_family_principle').text
        .replace('폐휴게소 보관망에서 오래된 영상 한 조각이 살아났다.',
          '수원 북부 교환소의 단말에서 남쪽 보관망이 전달한 영상을 열었다. 글자 창이 닫히고 첫 화면이 뜰 때까지 기다렸다.')},
    story_family_key:{title:'교환소 앞 달구지의 검증키',
      scene:'family-verification-key',
      text:'수원 북부 교환소의 첨부 목록에 검증키 분리 절차 4·5쪽을 보냈다는 기록이 있었다. 필요한 두 장은 아직 손에 넣지 못했다.\n\n교환소 앞 달구지의 계기판을 열었다. 출발 전에 번호를 붙여 둔 선들 사이에 모듈이 있었다. 빠진 두 장 없이는 어느 커넥터부터 풀어야 할지 알 수 없었다.\n\n'
        +D.events.find(event=>event.id==='story_family_key').text.split('\n\n').slice(2).join('\n\n')},
    story_personal_cache:{title:'북부 교환소에 맡겨진 상자',
      scene:'suwon-exchange-cache-v1',
      text:'수원 북부 교환소의 담당자가 부모님의 묶음 번호가 적힌 철제 상자를 가져왔다. 인계 장부에는 폐버스 배차실에서 회수한 날짜와 이곳까지 운반한 사람의 서명이 있었다.\n\n어린 시절 버스 열쇠고리, 타 버린 발신 릴, 마지막 두 장이 빠진 절차 수첩이 들어 있었다. 그 밑의 증언 카드에는 부모님이 만난 가족들의 이름이 적혀 있었다.\n\n카드는 상자 옆에 내려놓았다. 열쇠고리만 손바닥에 올려 봤다. 담당자는 뚜껑을 닫지 않고 기다렸다.',
      outcomes:['수원 교환소의 전달자에게 상자 묶음 번호와 인계 장부를 함께 대조해 달라고 했다. 전달자는 보관망에 마지막 두 장의 원본을 요청했다. 이 자리에서 서로 출처를 확인하기로 했다.',
        '상자는 달구지에 보관하고 묶음 번호와 찢긴 쪽의 모양만 교환소 장부와 대조했다. 마지막 두 장의 봉투를 받으면 내가 먼저 맞춰 보기로 했다.'],
      notes:['수원 교환소에 옮겨진 부모님의 상자를 인계받고 전달자와 분리 절차 원본을 대조하기로 했다.',
        '수원 교환소에 옮겨진 부모님의 상자를 인계받았다. 원본은 달구지에 보관하고 묶음 번호로 빠진 절차를 찾는다.']},
    story_parent_route_shared:{title:'교환소에서 함께 맞춘 두 장',
      text:'수원 북부 교환소의 전달자가 보관망에서 받은 봉투를 펼쳤다. 부모님 상자와 같은 묶음 번호, 뜯겨 있던 마지막 두 장의 원본이었다. 전달자와 나란히 앉아 종이의 찢긴 결을 맞췄다.\n\n강제 이송선만 분리하는 순서와, 그 뒤 사람에게 확인을 넘기는 조건이 적혀 있었다. 이제 교환소 앞 달구지에서 실제 검증키를 꺼낼 수 있다.'},
    story_parent_route_guarded:{title:'교환소에서 직접 맞춘 두 장',
      text:'수원 북부 교환소가 산지기 보관함에서 전달받은 봉투를 내주었다. 인계표에는 부모님의 묶음 번호가 적혀 있었다. 나는 달구지에 보관한 수첩과 마지막 두 장의 원본을 혼자 맞춰 봤다.\n\n종이의 찢긴 결이 이어졌다. 강제 이송선만 분리하는 순서와 사람에게 확인을 넘기는 조건이 모두 있었다. 담당자는 사본을 맡기면 연대망 전달편에 실어 줄 수 있다고 했다. 원본은 교환소 앞 달구지로 가져가 배선을 풀 때 쓰기로 했다.',
      labels:[null,'사본을 교환소 전달편에 맡긴다'],
      outcomes:[null,'묶음 번호와 출처를 적은 사본을 교환소 담당자에게 맡겼다. 원본은 교환소 앞 달구지 계기판 옆에 펼쳤다. 절차를 한 줄씩 확인한 뒤 검증키를 꺼냈다.'],
      notes:[null,'수원 교환소의 연대망 전달편에 분리 절차 사본을 맡기고, 원본으로 검증키를 회수했다.']},
    history_failed_namsan:{title:'교환소에 남은 남산 실패 기록',
      prefix:'수원 북부 교환소의 담당자가 남산 진입 보고서 사본을 가져왔다. 작업대에 자리를 내고 종이를 펼쳤다. 실패한 그날의 현장을 보고서로 읽는다.\n\n'},
    parents_father_last_log:{title:'수원에서 읽는 아빠의 마지막 출력',
      prefix:'수원 북부 교환소가 보관한 남산 유지실의 마지막 출력 사본을 펼쳤다. 기록의 날짜와 인계 번호를 먼저 확인했다.\n\n',
      labels:['마지막 17분을 사본에서 베낀다','기록의 정비 번호를 새 표찰에 옮긴다'],
      outcomes:[null,'사본에 적힌 아빠의 정비 번호를 빈 금속 표찰에 새겨 달구지 계기판에 달았다. 새로 판 숫자의 가장자리가 거칠었다. 장갑으로 몇 번 문질렀다.\n\n표찰을 매만지다가 계기판에 손을 얹었다. 시동은 걸지 않았다.'],
      notes:[null,'수원에서 아버지의 마지막 유지실 출력 사본을 읽었다. 그 정비 번호를 새 표찰에 옮겨 달구지에 달았다.']}
  };
  for(const [id,copy] of Object.entries(copies)){
    const source=D.events.find(event=>event.id===id);
    const text=(copy.prefix||'')+(copy.text||source.text);
    D.events.push({id:D.mainRecoveryEvents[id],recoveryOf:id,type:'스토리',once:true,noPool:1,
      scene:copy.scene||(id==='parents_diversion_manifest'?'parents-diversion-record-v2':'parents-linked-records-v2'),
      title:copy.title,storyOrigin:copy.storyOrigin||{kind:'record',label:'수원에서 확인',title:'북부 교환소 · 전달 기록과 보관물'},
      ...(id==='story_family_key'?{parseRecords:true}:{}),
      text,
      // Restored video and notebook audio retain the parents' quote routes. Treating
      // every paragraph as narration erases the father/mother exchange.
      turns:['story_family_principle','story_family_key'].includes(id)?undefined
        :id==='parents_father_last_log'?[{kind:'narration',text:copy.prefix.trim()},
          ...source.turns.map(turn=>turn.kind==='record'?{...turn,name:'남산 유지실 출력 사본'}:{...turn})]
        :text.split('\n\n').map(text=>({kind:'narration',text})),
      ...(['story_family_principle','story_family_key'].includes(id)?{turnSpeakers:[...source.turnSpeakers]}:{}),
      choices:source.choices.map((choice,i)=>({...choice,
        label:(copy.labels?.[i]||choice.label)+((choice.out||[]).some(out=>out.fx?.time)?` · ${choice.out[0].fx.time}분`:''),
        out:choice.out.map((out,j)=>{
          const fx={...out.fx};
          if(fx.chain) fx.chain=D.mainRecoveryEvents[fx.chain]||fx.chain;
          if(fx.note){
            const note=typeof fx.note==='string'?{type:'본편',title:copy.title,body:fx.note,links:[]}:fx.note;
            fx.note={...note,title:copy.title,body:copy.notes?.[i]||`수원 북부 교환소에서 전달 기록과 보관물을 확인했다. ${note.body}`};
          }
          const text=copy.outcomes?.[i]||out.text;
          // The original outcome may have its own reading beats. A new northern
          // account must replace those too, or the reader invents a southern visit.
          return {...out,text,...(copy.outcomes?.[i]?{
            readingRecord:text,
            turns:state=>(typeof text==='function'?text(state):text).split('\n\n').map(text=>({kind:'narration',text}))
          }:{}),fx};
        })
      }))});
  }
})();
