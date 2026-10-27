# 23차 19개 그림 연결 독립 경계 검증

`cycle22/visual-plan.json`의 새 그림18개와 레오 시장 그림 재사용1개를 대상으로 한다. 폴더명은 최초16개 계획의 이름을 유지한다. 생산 source/자산을 편집하지 않는다.

- 원본: frozen22/source 40파일. `baseline.json`은 19 entry와 모든49 choice/outcome을 보존한다. `D.events`와 `D.seoulStops` 모두 포함한다.
- 상태: 명시적 finite 경계 fixture다. 동료·자원·필요 아이템/완료 flag를 준비하고 각 outcome을 선택한다. 정상 새 여정도, 자연 발견도 아니며 모든 JSON 결과에 `cohortExcluded:true`를 둔다.
- 실제 엔진의 `G.beginPresentation/resolvePresentedChoice/save/load/restorePresentationView`, 실제 parser와 `renderStoryScene`의 장면 선택 head를 사용한다. DOM·브라우저·crop·새 그림 스타일 검증을 주장하지 않는다.
- ATM outcome0의 승인 `turnSpeakers:['me']` 한 필드와 그 reader만 exact 예외로 다룬다. 다른 사건의 전체 event 데이터·본문·reader·수치·효과·조건은 동결22와 같아야 한다.
- 새 entry/paid는 계획의 키 하나를 모든 turn에서 고르고 reload 후에도 같아야 한다. 명시 leading scene 우선순위도 유지한다.
- 옛 unpaid19개와 paid49개는 과거 키·reader·시점·효과가 그대로이며, paid text-only49개도 새 화자/문구를 빌리지 않아야 한다.

연결 전 `before.json`: **155통과/69실패**. 실패69개는 새 entry19개·새 paid49개·레오 새 sceneKeys1개로, 아직 매핑되지 않은 새 그림에 대한 기대실패다. 이전 기록 보존·본문/효과 동일성·명시 leading 우선순위는 모두 통과한다.

레오의 새 `eventTurnScenes`는 시장 한 키만 사용한다. 기존 `at:2` 남원 stage는 유지해야 옛 저장의 `[시장,남원]` 키와 turn별 선택이 보존된다. 새 entry의 키 목록에는 남원이 없어 stage2가 선택되지 않고 시장으로 fallback한다. renderer 구조를 수정하지 않는다.

준비 시행1은 QA fixture 결과가 없는 상태를 즉시 확인하지 않아 parser 오류로 끝났다. 시행2는 원인을 `seoul_square` 선택1의 누락된 `straggler_south` gate로 드러냈다. 두 부분 원본과 로그를 `prepare-attempt01-partial/`, `prepare-attempt02-partial/`, `prepare-attempt02.log`에 보존했다. 광장 분기의 실제 필요 flag/편지 전제를 넣은 시행3에서 19/49 baseline이 완성됐다. 이 QA 설정 오류를 게임 결함이나 새 여정으로 세지 않는다.

root 연결 완료 후 `node .../check.cjs check after.json`을 실행한다. 추가 plan 항목은 `prepare`가 기존 baseline을 덮지 않고 아직 없는 사건만 append한다.

제안본만 QA VM의 03g 입력으로 사용하는 `proposed.json`은 **224/224** 통과했다. 제안03g SHA는 `7fc67ec597be853ed6ab1aa2e125baa76ab40da0ba4eb1f48befc788cd330c51`, 당시 production03g는 동결22의 `190686a7b1fa942a28d8e5b90076311b92e5e152e88dbb4fb568b694787af5ff`다. `proposal-owner-audit.json`은 정확18asset/18설명/18메타/18event map/Leo turnScenes1 이외 D 전체와 함수가 같고, 옛 stage가 유지됨을 확인한다. 실제18WebP 규격과 메타/16:9도 일치했다. 이는 **production 적용·갤러리·UI 검증 통과가 아니다**. root 연결 후 after를 따로 기록한다.
