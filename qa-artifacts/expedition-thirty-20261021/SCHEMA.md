# 공개 관측 필드 보충 — 미래 효과/기본 계획 없음

아래는 현재 observation 생성/extension에서 확인한 필드 shape다. 정책 정답이나 사건 결과가 아니다.

- `stl.trade[]`: `{index,label,key,qty,price}`. key fuel/water/food 또는 barter_wf/barter_fp/barter_mf/item물품명. qty가 묶음 수량, price는 현재 할인/지역 가격이다. 실제 탱크 용량에 못 들어갈 수 있으므로 같은 실패를 무한 반복하지 않는다.
- `stl.actions[]`: `{id,label,time,description,cost,status:{ok,t,...}}`, 현재 장소별 공개 작업 목록. hiddenLocked 작업은 제거돼 있다.
- `routes[]`: `{id,name,type,km,check:{ok,engineOk,...},forecast:{ok,shortage,fuel,minutes,rationForecast,...},distanceToGoal,distanceToStops:{목표ID:거리},distanceToKnownPlaces:{공개장소ID:거리},distanceToRecruit,distanceToSideQuest}`. Infinity는 JSON 복사에서 null일 수 있으므로 null을 거리0으로 착각하지 않는다.
- `forecast.shortage`는 연료 전용이다. `foodMargin/waterMargin/supplyMargin<0`, `rationForecast`, `survivalWarning`은 별도로 확인한다. `readinessLabel`은 가중 등급이지 모든 자원 충족 보증이 아니며, 현재 UI는 supplyMargin으로 별도 보급 경고를 만든다. 초기 정책이 이 경고를 놓친 실제 출발도 지우지 않고 종합 보고에 집계한다.
- `navigation`: `{kind,target,title,action,waypoint?}`. 현재 메인/추적 목표이며 atTarget 필드는 없다.
- `localControls[]`: `{id:'walkfuel'|'radio'|'craft',label,enabled}`. radio는 실제 진공관 보유 때 enabled, craft는 실제 열린 작업대. 없는 control을 허구로 실행하지 않는다.
- `upgrades[]`: `{id,name,cost:{scrap,...},minutes,owned,status:{ok,t,...}}`. 현재 실제 견적을 쓰며 바깥 차고의 UI 진입/초기화 상태는 이 어댑터의 검증 대상이 아니다.
- `recipes[]`: `{id,label,cost,minutes,status:{ok,t,...}}`.
- `campParticipants[]`는 엔진의 현재 공개 참가자 ID 배열이다. `campConversation`은 현재 진행 표시다. 야영 대화는 `camp-talk(cid)` 후 loop가 scene choice를 처리한다.
- `recruitQuest`: `{id,stage,target}` 또는 null. 실제 합류 제안 수락은 `acceptCompanions({cid,state})`로 제어 가능. 반복 거절 후 다시 만나기보다 다음 합법 행동을 고르는 정책을 스스로 작성한다.

첫 실행 전에도 observation/snap 생성과 action dispatch의 서명만 읽는 것은 허용한다. defaultDecision/옛 정책/사건 future fx는 피하고, 실제로 읽은 범위와 노출을 보고한다. 최종 owner는 현재 폴더 departure-observer → expedition-thirty-20261020/departure-observer → discovery-repairs/departure-observer다. 원시 runner의 fuel<5 등 교체 전 코드는 최종 관측이 아니다.
