# 새 그림 선택 전 정상 재생 — cohort 제외

12차 이전 시각 검수용 재생 두 건이다. 기존 동결 원본을 덮어쓰지 않았다. fishfarm은 9차 seed269003 정책, coastal은 11차 seed271003 정책을 공개 행동으로 재실행했다. 사건/상태/보급 주입 없음. 모든 선택·주행·자원·본문은 기존 부분 재생과 같고, sceneKeys/sceneDescriptions만 대조에서 분리했다. 새 장면 키와 세이브 경로는 verification.json.

각 run의 전체 40src 시작·종료는 동일하며 engineHash는 1cb272700312c21de8afa5e0daa58dcb5af9e851e04581858eb1fd383fec0e42. 23선택/19선택 뒤 각각 양어장/김치공장 선택 직전 의도적으로 멈춘 것이므로 실패나 새 완주로 세지 않는다. summary와 manifest에 cohortExcluded:true를 명시했다.

새 정상 unpaid save의 pendingPresentation.view는 null이다. 실제 UI의 eventSceneKeys 함수를 불러온 readonly save-load 진단에서 새 키가 선택됨을 확인했다. 그림을 실제로 화면에 렌더링하거나 crop 검수했다는 뜻은 아니다.
