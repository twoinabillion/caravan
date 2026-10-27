# agent09 — 야영 취소·재개와 Live 지도 복원

확정한 구현 오류는 1건이다. 정차 중 `지도 보기 → 전체 여정`으로 전체 지도를 연 뒤 Live가 화면을 복원하면, `전체 지도` 대신 지역 지도의 `지도 접기` 버튼을 누른다. 결과적으로 전체 지도는 복원되지 않고 지역 지도도 닫힌다. **실제 shell·소스 마크업 순서·UI handler를 실행한 격리 재현이며 브라우저 새로고침/시각 확인은 아니다.** 생산 코드는 수정하지 않았다.

최종 증거는 [audit05.json](audit05.json)의 log n13이다. `src/02-dom.html`의 실제 `#panel`에 현재 `routeConsoleHtml` 반환 마크업을 삽입해서 버튼 순서를 얻었다. 수작업으로 지도 버튼 순서를 정하지 않았다. `syncRouteMap`이 지역 지도를 표시한 뒤 실제 `journey-map-world.onclick`으로 전체 지도에 들어갔다. 현재 `gameShell` 생성 코드의 `captureView/restoreView`와 현재 `wireRouteConsole` 등을 실행하자 첫 텍스트 매칭은 `data-route-map-toggle`이었다. 실제 G.save/load는 같은 게임 상태를 보존했다.

주행 대조군 n14는 정상이다. 정상 저장에서 실제 `G.startTravel`을 실행한 뒤 현재 주행 마크업을 넣으면 첫 지도 버튼이 `road-map-open`이어서 전체 지도를 다시 연다. n12의 지역 지도가 닫힌 경우는 명시한 UI fixture이며, 이때는 지역 지도만 새로 열었다. 제안은 텍스트 포함 검색 대신 저장한 도구 식별자에 맞는 명시적인 복원 경로를 쓰는 것이다.

야영 검사는 [agent01 정상 저장](../agent01/attempt01/agent01-save.json)을 그대로 읽었다. agent01이 공개 행동으로 도달한 DAY7 13:21 무주, 민지·강우 동행 저장이다. 본 검사는 자원·동료·플래그·위치·opening 완료를 주입하지 않았다. `ten-persona-repairs/setup.cjs`를 실행하지 않았으며 실엔진 로딩과 parser 추출 방식만 참고했다.

- 민지 미정산 대화는 저장 재개 후 같은 대화로 돌아왔다.
- 실제 `closeEvent`로 대답을 미루면 야영 허브로 돌아가며, inactive 상태를 저장한 후에는 자동으로 대화를 다시 열지 않았다. 취소 비용은 0분이다.
- 강우로 전환한 뒤 오래된 민지 선택을 직접 호출한 명시적 경계 검사에서는 `ok:false/applied:false`였다.
- 민지 `listen` 선택은 15분을 한 번 썼다. 결과 재개와 실제 camp-talk handler의 다시 읽기는 `applied:false`이며 자원·동료·기억·야영 계획이 같았다.
- 닫기 후 거창 출발까지 성공했다. 거창 도착/방문으로 세지 않는다.

최종 한 번의 야영 시나리오에 G.save/load 재개 4회, paid 재선택 2회가 있다. 여러 audit 출력은 같은 시나리오의 harness 보강 재실행이며 서로 다른 자연 완주로 합산하지 않는다. [audit01.json](audit01.json)의 지도 실패는 harness가 `esc` 의존성을 빠뜨린 탓이다. 원본을 남겼고, 이후 실제 정의를 추출했다. audit02는 기본 재현, audit03은 실제 지도 진입 handler 추가, audit04는 실제 save/load 추가, audit05는 paid ledger 동일성 검사를 보강한 기록이다.

현재 사용자 Studio는 직접 조작하거나 재시작하지 않았다. 브라우저 클릭/Back/Escape, 모바일·초점·시각·음성, pending 일반 사건 결과와 메뉴 전환은 미검증이다. 소스상 후보를 추가 확정하거나 범위를 늘리지 않고 두 흐름으로 마감했다. 기존 제작 fatal handoff 문제는 중복 집계하지 않았다.

전체 범위와 근거는 [report.json](report.json)에 있다. `node qa-artifacts/gap-ten-20261021/agent09/verify.cjs`는 보존한 원시 결과와 원본 저장 해시를 확인한다. `audit.cjs` 재실행은 새 출력명을 지정해야 한다. 기존 결과 파일 덮어쓰기는 거부한다.
