# Cycle19 준비: 편지 조사와 정차 안내

18차 시스템 원정과 전편 검토를 모두 마친 뒤 root의 허가로 수행한 별도 수선이다. 원정 통계와 발견 수에 합산하지 않는다.

- 편지: survival 정상 trace286의 note n60에 `노아이(가) 편지를 두 번 읽었다`가 남았다. 원인은 `G.checkQuest`가 조사 선택 없이 `이(가)`를 출력한 것이다. 기존 `D.withParticle(name,'이','가')`만 사용한다. 노아→노아가, 김정훈→김정훈이, 비한글 Leo→Leo가는 기존 공통 함수 정책이며 발음 추론을 새로 추가하지 않았다.
- 정차 안내: root 실제 UI에서 천안의 구름 놀이/수원의 고향 퀴즈를 끝낸 뒤, 이미 정차했는데 `정차한 뒤 …에게 말을 걸어`가 표시됐다. `G.companionQuestEntries`의 준비된 개인 이야기 분기에서만 `S.driving`이 있을 때 앞 구절을 붙인다. 합류·유대·퍼크·완료 분기는 유지한다.

생산 변경은 `src/04e-engine-world.js:934`와 `src/04f-engine-quests.js:184` 각각 한 줄뿐이다. 18동결 원본과 두 파일을 직접 비교했다. 원문 사건, 선택, 조건, 확률, 효과, 보상, 시간, 자원, 노트 이행, 저장 구조, UI 레이아웃은 변경하지 않았다. 사건 quote/copy corpus projection delta는 없다.

## 검증

`tests/test_qa_cycle18_systems_copy.cjs`는 실제 엔진 함수와 실제 18차 정상 저장을 사용한다. 새 게임 상태를 조정한 이름/6동료 경계는 별도 fixture이며 자연 원정으로 세지 않는다.

- 최종 테스트를 동결18 전체 소스로 실행: **6 실패 / 4 통과** (`tests-final-frozen18-red.txt`). 생산 파일을 되돌리지 않고 test-only loader로 원본을 읽었다.
- 수선 후: **10/10 통과** (`tests-green.txt`). 세 이름의 새 완료 일지, 지급·호감도·시간·자원과 동결18의 동일성, 재개/중복 인계 무효를 확인했다.
- 정상18 편지 기록 `survival/attempt01/entry-331-exp_glasshouse-export.json`의 옛 문구는 그대로 보존된다.
- 6동료의 주행/정차 안내와 조회 시 상태 불변, 합류/퍼크/유대/완료 안내 불변을 검사했다.
- 실제 정상18 구름/고향 unpaid 저장에서 선택0을 실행해 새 안내를 확인했다. 두 사건의 본문·효과·칩은 동결18과 같고 재개 후 재적용하지 않는다.
- `prepare.cjs`가 동결18 전체 소스에서 같은 정상 unpaid 저장에 공개 선택0을 실행해 옛 paid fixture 2개를 만들었다. 옛 안내, 읽던 turns/view, 텍스트 전용 저장, 지급 내역을 현재 소스로 읽어도 보존된다. lineage는 `legacy-manifest.json`에 있다. 이 두 분기는 cohortExcluded이며 새 원정이 아니다.
- 의뢰 게시판/일지/이전 회귀 포함 **43/43 통과** (`tests-focused.txt`). `git diff --check` 통과.

처음 fixture 비교에서는 저장 전의 칩 class와 저장 후 정규화된 class를 비교했고, 첫 load가 붙이는 기존 `recruit_migration_v2`를 새 문구 변경으로 잘못 잡았다. fixture를 실제 저장 칩 기준/인계 전 정상 load로 바로잡았고 초기 로그도 남겼다. 최종 동결18 red 재검증이 동일한 6개 증상을 다시 잡는다.

전체 suite/build와 실제 UI의 최종 문구 확인은 root 담당이다. 이 산출물은 엔진·reader·저장 증거이며 실제 브라우저 조작이나 시각 검수를 대신하지 않는다. 생산 추가 편집은 종료했다.
