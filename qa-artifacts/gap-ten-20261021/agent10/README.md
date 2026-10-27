# agent10 — 막힌 다음 행동 경계 감사

새 버그는 확인하지 않았다. 기존 A02/player06-F03(레오 사건 활성 선택 0)을 정상 저장 그대로 재개해 재현했고, 안전 복귀 조건이 비활성 카드를 처리하지 않는 소스 근거를 보강했다. 실제 브라우저 softlock을 확인한 것은 아니다.

검사는 4개 경계로 끝냈다.

- 정상 저장 재개: `initiative_leo_pause`, 식량 0·민지 없음 → disabled 카드 2개, 활성 0. 미지급 reload도 동일. 내부 `closeEvent()`는 무비용으로 빠져나가지만 사용자 제어가 아니다. `선택하기`/`finishStory()`는 사건 내 actions 단계 이동일 뿐이다.
- fixture: 무주 연료 5.6503L, 서쪽 노선에서 현행 `G.canSeekFuel/G.seekFuel` → 구제 +9L → 지급 reload/중복 정산 방지 → 전주 출발 및 주행 재개 통과.
- fixture: 3차 구제에 연료·식량·물·고철 0 → 도보 선택은 남는다. 연료 8L, 피로 57, 허기 1 이후 충분 연료 경로를 확인. 의도된 손해를 버그로 올리지 않았다.
- fixture: 김천 동/서 선택, 미지급·지급 reload, 노선 외 잠금, 노선 안 역방향 허용, 첫 구간 출발 통과. 청주 endpoint는 직접 위치 설정으로 잠금 해제 계약만 검사했으며 실제 완주가 아니다.

`node qa-artifacts/gap-ten-20261021/agent10/audit.cjs`는 exit 0, 4개 경계 모두 assertion 통과다. 알려진 버그 재현 assertion의 통과가 게임 결함 없음이라는 뜻은 아니다. 원시 실행은 [raw-attempt01.json](raw-attempt01.json), 분류·재현·근거·한계는 [report.json](report.json)에 있다. 첫 실행 후 기존 원시 파일 덮어쓰기 방지(`wx`)를 추가했다. 재실행하려면 출력명을 새로운 attempt로 바꿔야 한다.

기존 `player06/attempt03`의 저장/보고, 현행 departure observer, `setup.cjs`, 관련 소스와 테스트를 읽고 재사용했다. `setup`은 opening 완료를 주입한다. 이 감사는 실엔진 VM과 UI 함수 일부를 실행하며 렌더·모달·오디오는 stub이다. 브라우저 클릭·시각·모바일·음성 검수 없음. 사용자 Studio 저장/화면/서버, 생산 코드, 기존 QA, 생성 HTML은 변경하지 않았다.
