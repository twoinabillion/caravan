# Agent05 — 라디오 집중 QA

수리는 정상 저장 재개에서 성공했고, 부족자원·중복 호출·저장 재개·실제 주행 타이머 해금을 확인했다. 새 오류 후보는 밤7시30분에도 “새벽 두 시입니다” 방송을 선택하는 시간 조건1건이다. 영화관 라디오 설정은 agent03의 G03-03과 중복되는 P3 명료성 검토다. 생산 소스와 기존 QA, Studio는 변경하지 않았다.

## 근거

- 정식 원시 결과: `audit03.json` — 검사12개 모두 통과. 실제 `G.tick`에서 `radio_music` 출력1회.
- 이전 저장 출처: `../../ten-persona-round4-20261020/player09/attempt02/player09-save.json`. `player09-trace.json` n2682의 `exp_radiostation`에서 진공관0→1. `policy-snapshot.cjs`와 원 harness/runner는 정상 `newGame`·공개 API·유한자원 실행이다. 최종 day181은 기존 실행의 day-limit이고 ended=false, 무한자원모드=false다.
- 현재 재개: 미결 `comp_rps` → 실제 선택·Continue → 수리(진공관1→0,40분) → 재호출false → save/load → 대전→논산 도착 → 논산→비행장 주행 중 방송. 비행장에는 아직 도착하지 않았으므로 방문으로 세지 않는다.
- 별도 fixture5건: 진공관 없음, 낮의 미획득 방송 풀,19:30방송 풀, 지식 플래그가 있는 북부 방송 풀, `freq_source` 보상·paid reload. `setup.cjs`는 opening.completed를 설정하는 fixture임을 명시한다.

## 실패·한계 보존

`audit01.json`은 미결 사건을 먼저 재개하지 않은 초기 API 검사여서 정상 UI 순서 증거로 사용하지 않는다. 첫 구간이 방송 타이머30초보다 짧아 방송이 없었던 것은 실패가 아니다. `attempt02-failure.txt`는 테스트 DOM stub 누락이며 다음 검사에서 고쳤다. 기존 시도를 덮어쓰지 않았다.

실제 `playRadio` 함수를 실행했지만 speech/audio는 관측 sink이고 접근/도착 연출은 stub이다. 브라우저 버튼, 취소/뒤로 포커스, 실제 버블 가독성·음성·모바일은 확인하지 않았다. 선택/닫기와 수리 카드 조건은 소스로만 확인했다. 은수 부재 방송은 fixture에서 보이지만 정상 도달성을 입증하지 못해 확정 버그에서 제외했다.

재실행은 새 파일명을 사용한다: `node qa-artifacts/gap-ten-20261021/agent05/audit.cjs audit04.json`. 출력이 이미 있으면 보존을 위해 거절한다.
