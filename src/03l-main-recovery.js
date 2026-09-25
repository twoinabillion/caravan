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
      text:'수원 북부 교환소의 보관 담당자가 남쪽 검문 단말에서 옮겨 온 종이띠 사본과 저장 모듈을 내놓았다. 나는 그 검문소에서 기록을 확보하지 못했다. 이곳에서 출처와 복사 시각을 먼저 확인한다.\n\n배급망이 바뀔 때마다 대상을 다시 고르는 규칙, 그리고 부모님의 이송표와 앞 여덟 자리가 같은 검증 번호가 남아 있었다. 종이 사본을 대조할지, 맡겨진 모듈을 열지, 북부 단말로 원격 원본을 조회할지 고를 수 있다.',
      labels:['종이띠 사본의 발신 번호를 대조한다','교환소가 보관한 저장 모듈을 연다','차량 번호로 원격 원본을 조회한다'],
      outcomes:[
        '보관 담당자와 사본의 전송 인장을 확인하고 부모님의 표를 옆에 놓았다. 발신 번호가 같았다. 수원에서 받은 사본에 출처를 적었다. 남쪽 단말을 내가 직접 열었다고 기록하지 않았다.',
        '작업대에서 교환소에 맡겨진 저장 모듈의 봉인을 풀었다. 보관 담당자가 인계 날짜를 읽었고, 나는 저장된 검증 번호와 재평가 규칙을 베꼈다. 이 모듈은 남쪽 단말에서 회수돼 여기까지 전달된 것이었다.',
        '수원 단말에 달구지 번호를 넣고 원격 기록을 요청했다. 조회 흔적이 관측망에 남았지만, 검증 번호와 재평가 규칙을 원본과 대조할 수 있었다. 내가 남긴 흔적은 남쪽에서 받은 스캔이 아니라 이곳의 조회였다.'
      ],
      notes:['수원 북부 교환소에서 남쪽 검문 단말의 종이띠 사본을 대조했다. 부모님의 표와 같은 발신 번호, 배급망 변화에 따른 반복 재평가 규칙을 확인했다.',
        '수원 북부 교환소가 보관한 남쪽 단말의 저장 모듈을 열어 발신 번호와 재평가 규칙을 확인했다.',
        '수원 단말에서 달구지 번호로 원격 원본을 조회했다. 관측 흔적을 남기는 대신 부모님의 표와 같은 발신 기록을 확인했다.']},
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
          '수원 북부 교환소의 단말에서 남쪽 보관망이 전달한 영상을 열었다.')},
    story_family_key:{title:'교환소 앞 달구지의 검증키',
      text:'수원 북부 교환소에 보관된 첨부 목록에서 검증키 분리 절차 4·5쪽의 전송 번호를 찾았다. 아직 필요한 두 장을 손에 넣은 것은 아니다.\n\n교환소 앞에 세운 달구지로 돌아와 엄마의 회로도를 계기판 배선과 비교했다. 모듈 옆에는 정전기 방지 천과 가족사진, 아빠의 회로 수첩이 남아 있었다.\n\n수첩에는 강제 명령이 실행되기 전에 반드시 사람의 확인을 거치게 하는 검증키라고 적혀 있었다. 모듈을 억지로 떼지 않고, 사진과 수첩만 먼저 살펴볼 수 있다.'},
    story_personal_cache:{title:'북부 교환소에 맡겨진 상자',
      text:'수원 북부 교환소의 담당자가 부모님의 묶음 번호로 보관 중인 철제 상자를 가져왔다. 폐버스 배차실에서 회수돼 인편으로 옮겨진 물건이었다. 인계 장부와 봉인 번호가 일치했다.\n\n어린 시절 버스 열쇠고리, 타 버린 발신 릴, 마지막 두 장이 빠진 절차 수첩, 이송된 가족들의 증언 카드가 들어 있었다. 이 카드들은 부모님이 모은 기록이다. 내가 아직 만나지 않은 사람에게 직접 확인받은 증언은 아니다.',
      outcomes:['수원 교환소의 전달자에게 상자 묶음 번호와 인계 장부를 함께 대조해 달라고 했다. 전달자는 보관망에 마지막 두 장의 원본을 요청했다. 이 자리에서 서로 출처를 확인하기로 했다.',
        '상자는 달구지에 보관하고 묶음 번호와 찢긴 쪽의 모양만 교환소 장부와 대조했다. 마지막 두 장의 봉투를 받으면 내가 먼저 맞춰 보기로 했다.'],
      notes:['수원 교환소에 옮겨진 부모님의 상자를 인계받고 전달자와 분리 절차 원본을 대조하기로 했다.',
        '수원 교환소에 옮겨진 부모님의 상자를 인계받았다. 원본은 달구지에 보관하고 묶음 번호로 빠진 절차를 찾는다.']},
    story_parent_route_shared:{title:'교환소에서 함께 맞춘 두 장',
      text:'수원 북부 교환소의 전달자가 보관망에서 받은 봉투를 펼쳤다. 부모님 상자와 같은 묶음 번호, 뜯겨 있던 마지막 두 장의 원본이었다. 전달자와 나란히 앉아 종이의 찢긴 결을 맞췄다.\n\n강제 이송선만 분리하는 순서와, 그 뒤 사람에게 확인을 넘기는 조건이 적혀 있었다. 이제 교환소 앞 달구지에서 실제 검증키를 꺼낼 수 있다.'},
    story_parent_route_guarded:{title:'교환소에서 직접 맞춘 두 장',
      text:'수원 북부 교환소가 산지기 보관함에서 전달받은 봉투를 내주었다. 인계표에는 부모님의 묶음 번호가 적혀 있었다. 나는 달구지에 보관한 수첩과 마지막 두 장의 원본을 혼자 맞춰 봤다.\n\n종이의 찢긴 결이 이어졌다. 강제 이송선만 분리하는 순서와 사람에게 확인을 넘기는 조건이 모두 있었다. 이곳에 세운 달구지에서 배선을 풀 차례였다.'},
    history_failed_namsan:{title:'교환소에 남은 남산 실패 기록',
      prefix:'수원 북부 교환소에서 실패한 남산 진입의 보고서 사본을 읽었다. 내가 그날 현장에 있었던 것은 아니다.\n\n'},
    parents_father_last_log:{title:'수원에서 읽는 아빠의 마지막 출력',
      prefix:'수원 북부 교환소가 보관한 남산 유지실의 마지막 출력 사본을 펼쳤다. 기록의 날짜와 인계 번호를 먼저 확인했다.\n\n',
      labels:['마지막 열일곱 분을 사본에서 베낀다','기록의 정비 번호를 새 표찰에 옮긴다'],
      outcomes:[null,'사본에 적힌 아빠의 정비 번호를 빈 금속 표찰에 새겨 달구지 계기판에 달았다. 아빠가 남긴 실물 번호표를 찾은 것은 아니다. 내가 읽은 마지막 작업을 잊지 않으려고 만든 표찰이었다.'],
      notes:[null,'수원에서 아버지의 마지막 유지실 출력 사본을 읽었다. 그 정비 번호를 새 표찰에 옮겨 달구지에 달았다.']}
  };
  for(const [id,copy] of Object.entries(copies)){
    const source=D.events.find(event=>event.id===id);
    const text=(copy.prefix||'')+(copy.text||source.text);
    D.events.push({id:D.mainRecoveryEvents[id],recoveryOf:id,type:'스토리',once:true,noPool:1,
      scene:copy.scene||(id==='parents_diversion_manifest'?'parents-diversion-record-v2':'parents-linked-records-v2'),
      title:copy.title,storyOrigin:copy.storyOrigin||{kind:'record',label:'수원에서 확인',title:'북부 교환소 · 전달 기록과 보관물'},
      text,turns:text.split('\n\n').map(text=>({kind:'narration',text})),
      choices:source.choices.map((choice,i)=>({...choice,
        label:(copy.labels?.[i]||choice.label)+((choice.out||[]).some(out=>out.fx?.time)?` · ${choice.out[0].fx.time}분`:''),
        out:choice.out.map((out,j)=>{
          const fx={...out.fx};
          if(fx.chain) fx.chain=D.mainRecoveryEvents[fx.chain]||fx.chain;
          if(fx.note){
            const note=typeof fx.note==='string'?{type:'본편',title:copy.title,body:fx.note,links:[]}:fx.note;
            fx.note={...note,title:copy.title,body:copy.notes?.[i]||`수원 북부 교환소에서 전달 기록과 보관물을 확인했다. ${note.body}`};
          }
          return {...out,text:copy.outcomes?.[i]||out.text,fx};
        })
      }))});
  }
})();
