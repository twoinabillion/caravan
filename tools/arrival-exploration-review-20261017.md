# 첫 도착·탐색 후속 검수 · 2026-10-17

## 범위와 수정

Sang의 `계속 이어서 해봐` 요청. 승인된 준비 UI·그림·스토리·물자/확률/출현 제한은 유지하고, 첫 도착에서 탐색·다음 출발·저장 복귀까지 확인했다. 게임 UI 재설계/용량 최적화/플랫폼 전환은 하지 않았다.

1. **숨김 중 도착 기록 자동 소모** — 주행 loop 중단과 별개로 minor arrival의4.3초(모션 감소3.2초) timeout이 계속되어, 숨김 중 `pendingArrival`을 소비하고 다음 사건을 열던 경로를 실제 `onArrive`/엔진과 제어된 타이머에서 재현했다. 기존 UI 소유자에서 남은 표시 시간을 보관하고 lifecycle 중단·재개에 연결했다. 이미 큐에 들어온 숨김 callback도 기록을 넘기지 않는다. major-city의 명시적 Continue와 원래 hold 시간은 유지한다. 세대 번호/현재 화면·장소 검사로 이전 도착의 늦은 클릭이 새 도착이나 타이틀에 작용하지 못하게 했다. 저장 형식에 timer나 closure를 넣지 않는다.
2. **사건이 막힌 탐색의 완료 안내 누락** — 실제 후보 pool이 존재해도 출현 횟수/거리 제한 때문에 scheduler가 장면을 열지 않으면, 시간120분·고철6·부품1이 처리된 뒤 toast와 행동 카드 갱신 없이 반환하던 경로를 재현했다. scheduler는 실제 장면 진입 여부를 반환하고 탐색의 무장면 결과에서만 `주변 수색을 마쳤다`와 이번 실제 발견량을 표시한다. 이미 적용한 자원을 다시 지급하지 않으며 RNG·pool·출현 상한·비용을 바꾸지 않았다.

소유자: `src/07-ui.js`의 기존 loop/lifecycle/arrival, `src/04e-engine-world.js`의 기존 explore/scheduler. CSS·그림·대사·사용자 저장은 변경하지 않았다. 원인/회귀 계약은 DEVELOPMENT_GUARDRAILS에 남겼다.

## 검사

- `tests/test_arrival_lifecycle.cjs` **8/8**. 숨김 전1.7초 사용→60초 숨김→남은2.6초 후 넘김, 늦은 숨김 callback, 처음부터 숨김, 주요 도시 대기, Escape/수동 중복·오래된 handler, 도착 저장 재개→첫 기록 지급 결과 중복 방지→다음 행동, 탐색 완료·재수색·한도/재로드, scheduler의 실제 진입 여부.
- 실제 새 게임에서 짐3종×발신 기록 선택3종=9경로로5장면 오프닝→부산–양산 정상 tick→도착 UI handler→첫 발신 기록→일반 탐색→밀양 출발·구간 저장 재개를 연결했다. 첫 위치/거리/완료 flag를 미리 주입하지 않았다. **UI DOM·타이머는 대역이며 road approach는 완료 callback을 즉시 실행한다. 시각·제동·읽기·실제 터치/자연 플레이 검수가 아니다.**
- 전체 `npm run test:source` **684/684**, 실패0. 관련 도착/앱 lifecycle/사건 handoff **24/24**(추가 scheduler 검사 이전 실행), 최종 새 도착 검사8/8. `git diff --check`와 release gate 통과.

## 앱

- `npm run build` 성공. HTML106,259,738bytes/SHA256앞12자리 `246cf7da19a4`.
- 기존 Toss `caravan.ait`88,121,796bytes/SHA256앞12자리 `07e3dbea0997`, 호환2개 해시 일치. RN0.84.0/0.72.6 빌드이며 APK/IPA·기기 실행·외부 배포가 아니다.
- 실제 `dist/web/index.html`의 arrival countdown/generation/완료 문구 포함을 대조했다. UI 입력이나 native WebView 동작의 증명으로 대체하지 않는다. 빌드 경고 상한은 유지하고 용량 작업은 미뤘다.

## 실제 화면 보존 / 남음

- 시작10:22:03.532Z actual4327/4319: name·game:null·360×728, loaded/style1792232188520·pending:null. **이전 앱 loop 수정까지 이미 적용됨**이다.
- 후속10:28:35.454Z: 같은name·빈 이름·연료통·360×728·game:null 유지. loaded/style1792232188520 유지, 이번 pending1792232850262/applying:false. JS 구조는 의도적 적용 대기이며 CSS live 수정은 없다.
- 실제 Safari Studio 이미지 접근 미확보 상태에서 브라우저 새 저장으로 대체하지 않았다. 새 게임·사용자 저장/진행 변경·강제 refresh/적용·STOP/서버 재시작·설치·배포 없음.
- 실제 현재 저장의 도착/탐색 화면 crop·toast·버튼 조작과 실물 휴대폰의 백그라운드/복귀 검수는 미완료다. 이번8검사는 이를 대신하지 않는다. 다음은 이 코드가 적용된 실제 플레이에서 첫 도착 기록과 다음 행동을 확인하는 것.
