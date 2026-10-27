# 15차 종료 후 16차 준비 수선

원정은 `cycle15/source/src`의 동결 소스로 종료한 상태이며 이 폴더의 테스트는 별도 fixture다. 자연 원정100선택이나 원본 trace/save를 다시 쓰지 않았다. 현재 문구 세 범위를 parent 승인 후 최소 수정했다. 재이04는 사흘이라는 미경과 시간을 현재 짐 정리 제안으로 바꿨다. 은수 영입은 잔류 좌표 대신 잡음을 묘사해 소각/수동/가짜응답 어느 분기에도 모순이 없도록 했다. 정품 주행 대화는 과거 확인을 요구하는 대신 지금 확인을 부탁하고 답을 듣는다. 새 plot·선택·FX·gate·확률·대사 화자 순서는 추가하지 않았다. 정확한 값은 `copy-delta.json`이다.

동결15 소스의 재이 양쪽 결과와 은수 결과를 실제 선택으로 지급한 receipt와 reader를 보존했다. 현재 reader와 옛 paid view/text-only를 모두 검사했으며 재지급하지 않았다. entry 문구만 바뀌어 결과 parser의 의미나 화자가 바뀌지 않았음을 대조했다.

짧은 채팅 반복에는 정상 entry/paid reload가 끼어 있었다. 기존 전역 lastChat이 로드에서 지워져 70.3게임분 만에 같은7줄이 나왔다. 로드 없는 연속 주행의 반복 빈도라고 일반화하지 않는다. 승인된 최소 엔진 수선은 기존 `S._crewChatSeen`의 `daily:` namespace에 채팅별 마지막 day/km를 남기는 것이다. once ID 키와 arc 우선, 기존 관계 첫 보상은 유지한다. 채팅을 선택한 즉시 저장하며, 같은 날 load/import/출발 뒤에도 제외하고 다음날 다시 허용한다. 새 게임은 새 S를 써 이력이 새지 않는다. 기록은 채팅 수만큼만 유지하며 날짜별 로그를 계속 쌓지 않는다. 풀이 소진되면 null을 반환하는 기존 조용한 동작 그대로이며 별도 banter fallback이나 확률/주행 타이머 변경은 없다.

첫 회귀12개 중 red7fail/5pass를 보존했다. 초기 patch의 괄호 오류는 `first-patch-syntax-failure.txt`에 따로 남기고 바로 수정했다. 수정 후12/12통과, 공개 출발 보존 회귀를 더한 자체13개와 기존 once·banter·callback·메인 흐름을 합쳐 **183/183통과**했다(`focused.txt`). 최종 전체팀 계약 통합 결과는 별도 integration 로그에 기록한다. 전체 corpus 기준 해시를 새 값으로 교체하지 않는다.

최종 팀 통합은 **80/80통과**(`integration-final.txt`). survival v2의8개 화자 위치와 방언 결과의3개 authored narration, systems의 컨테이너4개 화자 위치를 각각 새 값 그대로 assert한 후 과거 형태로 투영했다. authored narration 전문도 별도 해시로 고정했으며 전체 corpus hash는 그대로다. 승인된 본문7개는 exact old/new를 보존한다(`all-team-projection.json`). 최초 survival 빈 결과 경로의 lint 불일치는 `dialogue-lint.txt`에 보존했고, v2 authored narration 후 최종 lint는 오류0·샘플5803줄이다(`dialogue-lint-final.txt`). 183개 기존 집중과80개 통합에는 중복 테스트가 있으므로 더해 총263개라고 세지 않는다. 이후 새 자연 원정은 아직 수행하지 않았다.
