# 20명 가중 무작위 엔딩 감사 — 최종 발견 보고

새 독립 에이전트20명이 각자 정책을 작성·실행하고 자기 전편을 검토했다. **20/20이 현행 준비 묶음으로 storyDone와 실제 SESSION1END 후일담에 도달했다. 이번 작업에서 게임은 수정하지 않았다.**

실제 소스 엔진을 격리 Node VM/유한 자원으로 실행한 감사다. 사람20명 또는 브라우저·모바일 플레이가 아니다. 성향 가중치와 별도 seeded PRNG의 균등 탐색을 섞었으며, 무조건 무작위로 자살하는 정책이 아니라 공개 보급/이동 정보를 우선하는 정책이었다. 타이머·표시·오디오 및 일부 진입 제어는 어댑터가 대행했다.

## 완료·범위

- 보존한 시도25회, 실제 선택2,082회, 정규화 사건269개/사건·선택쌍384개.
- 이전 고정 기준650선택쌍 대비 신규35쌍. 이는 결과별 분기·확률·모든 숨은 상태의 완전 커버리지가 아니다.
- 최종 완주 방법: core_transfer 11, core_sleep 8, core_quarantine 1. 에이전트 정책의 결과이며 사람 선호/승률 통계가 아니다.
- 모든 시도의 종결: main-story-complete 20, thirst 5. 실패도 원본을 보존하고 완주로 세지 않았다.
- 추가 제어 실행: 거래601, 현장 일38, 개조12, 의뢰 수락55, 인계52, 캠프 대화 열기26, 미루기7, 종장 준비 복귀1. 횟수는 고유 체인/성공 보증이 아니며 각 보고서가 실제 결과와 정책 실패를 기록한다.
- paid 결과 재로드2079, 미지급 진입0, 일반0. 기록된 공개 snapshot 차이0, 재지급0, 복원 실패0. 숨은 RNG/실제 앱 Continue·커서·입력 검증은 아니다.
- 보존공동감시 경로도 관측됐다. 해당 보고서의 실제 자격/선택/결과만 증거이며 다른 숨은 조합 전체의 증거는 아니다.
- 생산 엔진·관측기·기존 src/assets/tools diff·생성HTML 전후 fingerprint는 동일하다. 빌드/생산 테스트를 이번에 다시 돌리지 않았으며 과거893회귀 결과를 새 검사로 주장하지 않는다.

## 디렉터 판정

개별 리뷰어가 제출한 후보38건을 곧바로 버그 수로 세지 않았다. 기존17묶음은 이전 감사에서 확인했고 아직 수선하지 않은 상태다. 이번 재현은 아래에 따로 표시하며, 관측하지 않은 기존 문제까지 이번에 전부 재현했다고 주장하지 않는다.

### 이번 추가 확인 — 결함과 설명 공백 구분

우선 볼 것은 **자정을 넘기면 탈수로 끝날 상태를 이동 예보가 놓치는 문제**다. 실제 이동 화면이 ‘준비됨’을 출력한다는 뜻은 아니다. 엔진 계산은 그렇게 반환하고, 현재 UI의 보급 경고 조건도 그 경계를 놓친다. 앞선 식사 부족 알림은 있었다. 다음은 물0에서 나눠 마시는 장면, 실제 노동과 다른 회상, 정차 뒤 주행 묘사다. 견인은 이동 불능으로 확정한 버그가 아니라 설명 공백으로 분리했다.

| ID | 우선순위 | 확인 문제 | 확인 범위 | 수선 경계 |
| --- | --- | --- | --- | --- |
| R6-05 | P2 | 자정을 넘기면 탈수로 종결될 상태가 다음 구간 생존 예보에서 빠짐 | Confirmed forecast/warning boundary omission, not a claim that current UI visibly prints 준비됨. Actual routeConsoleHtml does NOT render readinessLabel, but its supplyMargin<0 resource-warning predicate also misses this state. Previous hunger/water notifications existed; no total-warning-absence claim. | Project known ongoing dehydration and an intersecting midnight boundary into route safety/resource warnings, while keeping explicit player autonomy, supply costs, scarcity/death thresholds and paid receipts. Do not grant resources, make survival easier, block travel globally or pretend this is screenshot/UI QA. |
| R6-03 | P2 | 물0인데 마지막 물통을 나눠 마시는 현재 사건 | 자연 기록과 exact-seen source/fixture 확인; 브라우저 검수 아님 | For newly generated entry/outcome, require an actually carried bottle or provide a truthful empty-stock alternative, including resolution/unpaid resume; preserve existing paid receipts, scarcity consequences and next reachable action. Do not grant water, reset thirst or change survival difficulty to fix prose. |
| R6-04 | P2 | 부품 분류를 도왔는데 배급표를 정리한 일로 회상 | 자연 기록과 exact-seen source/fixture 확인; 브라우저 검수 아님 | Use the actually completed action/provenance for new echo text, with neutral fallback if legacy evidence is insufficient; a visual rendering category must not invent a different favour. Preserve work cost/pay, echo outcomes, saved historical prose and known movement. |
| R6-01 | P2 | 정차 야영 뒤 주행 소리의 동행 장면이 새 현재 사건으로 열림 | 자연 기록과 exact-seen source/fixture 확인; 브라우저 검수 아님 | Review this scene's current road/local entry contract or a stationary variant. Preserve mood effects/paid historic prose. Natural trigger plus source eligibility confirmed; browser approach/audio not inspected. |
| R6-02 | P3 | 마을로 견인한다는 선택이 도로 연료 보충으로만 끝남 | Confirmed explanation/choice-contract gap, not a proven impossible trip, forced softlock or village-service engine failure. An unshown tow-and-return is possible but not explained. | Smallest review is truthful roadside-assistance/fuel explanation. Preserve existing costs and escape/recovery capability; do not create a village, transport a real save, change economics or retrospectively rewrite paid receipts to defend a label. |

### 기존 문제의 재확인 / 범위 확대

- R5-05: Same previously confirmed weather-text group, not another new bug. 근거: player33/P33-C01, player34/P34-C02, player36/P36-C02, player37/P37-C01, player39/P39-C02, player40/P40-04 primary n123, player41/P41-C02, player42/P42-C01, player45/P45-C01, player48/P48-01
- R5-01: Same earlier dispatch-overclaim group. Organization knowing the vehicle is distinct from player having been sent. 근거: player35/P35-C02
- R5-13: Same explicit other-person cardinality contradiction confirmed earlier, not mere protagonist+companion plural 우리. No extra new bug count. 근거: player35/seoul_core opinion n221
- R5-16: Same generated-feedback precision issue independently formatter-verified in previous audit. No fresh browser appearance proof, no extra resource-arithmetic bug. 근거: player36/P36-C03, player38/P38-C01, player40/P40-02, player46/P46-C02, player49/P49-C01
- R5-14 (route_market_mask choice0): Extend the existing undisclosed voluntary-cost group to a third event, not a new bug type. Preserve odds/−1/−2 results/chain and usable zero-resource alternatives; full fallback supply gate/disclosure needs actual max2 contract. No natural zero-scrap route or browser visibility claim. 근거: player39/P39-C01, player44/P44-C03
- R5-09: Same canonical vehicle-text inconsistency, not a new duplicated identity defect. 근거: player40/P40-01
- R5-11: Same branch-dependent prop-count group across recruitment and Seoul callbacks. 근거: player43/P43-C01, player46/P46-C01
- R5-04 (comp_food_debate choice2, loc_yeosu daytime night-fishing entry, comp_rps morning current lunch): Extend the already confirmed future-night completion group to a free morning dialogue. Keep promise/recipe talk itself and existing costs; do not add an evening charge, give food or erase the character's argument. 근거: player43/P43-C02, player44/P44-C04, player50/P50-01

[기존17묶음 전체와 원 근거](../thirty-persona-20261020/director-rulings.json). 첫 수선은 사망 경계 뒤 지급/정확한 영수증/미고지 지불, 다음은 실제 선택·물건·사람 이력, 그 뒤 시간·날씨·문구다. 모든 후보를 반영해 난도·인물 반대·전술 위험을 깎지 않는다.

### 이전 감사에서 확인됐지만 아직 고치지 않은17묶음

아래는 누적 잔여 목록이다. ‘이번 재확인 없음’은 해결됐다는 뜻도, 이번20명이 다시 증명했다는 뜻도 아니다.

| ID | 기존 확인 문제 | 이번20명 근거 |
| --- | --- | --- |
| R5-01 | 산지기 첫 선택이 실제 파견을 받았다고 강제 | 재확인 또는 범위 확대 |
| R5-02 | 독행 빵집의 미소개 대화 상대와 글씨 인용의 발화 오인 | 이번 재확인 없음; 이전 근거 유지 |
| R5-03 | 나누지 않은 물까지 최종 일지의 경험으로 회고 | 이번 재확인 없음; 이전 근거 유지 |
| R5-04 | 양조장5시간·안동4시간 결과가 이후 밤샘을 완료 | 재확인 또는 범위 확대 |
| R5-05 | 맑음·안개·황사에서도 비를 피하는 현재 장면 | 재확인 또는 범위 확대 |
| R5-06 | 정차 대화가 다음 정차의 수리를 이미 끝냄 | 이번 재확인 없음; 이전 근거 유지 |
| R5-07 | 사기 상한에 막힌 증가분까지 결과에 더했다고 표시 | 이번 재확인 없음; 이전 근거 유지 |
| R5-08 | 갈증 종결 후 야영 대화 유대와 기억을 뒤늦게 지급 | 이번 재확인 없음; 이전 근거 유지 |
| R5-09 | 달구지 번호판이 없다는 대답과 번호판을 읽는 후속 장면 | 재확인 또는 범위 확대 |
| R5-10 | 진료 버스의 약 배송 약속을 옛 전복 버스 구조로 기억 | 이번 재확인 없음; 이전 근거 유지 |
| R5-11 | 대구 경비탑에 남긴 군번줄이 대화·서울에서 다시 두 개 | 재확인 또는 범위 확대 |
| R5-12 | 에코를 자칭한 뒤 콜사인이 비밀·미사용 상태로 돌아감 | 이번 재확인 없음; 이전 근거 유지 |
| R5-13 | 동료 한 명을 여러 새 동행자로 소개하는 코어 선택 | 재확인 또는 범위 확대 |
| R5-14 | 등산용품점·고기날 유일 선택의 고철2 지불이 사전 고지·요구 없음 | 재확인 또는 범위 확대 |
| R5-15 | 엄마 재회 뒤 중계소 목표의 장 메타데이터가5→4→5 | 이번 재확인 없음; 이전 근거 유지 |
| R5-16 | 연료·피로 결과의 과도한 소수 정밀도 | 재확인 또는 범위 확대 |
| R5-17 | 새벽에 시작한 야영에 이미 지난03:00 모닥불 사건을 회고 | 이번 재확인 없음; 이전 근거 유지 |

### 확정과 분리한 문구·규칙 후보

- R6-MILEAGE-JOKE: Precise-number clarity candidate, not resource/distance calculation failure. It is a character's future résumé joke, so do not treat it as measured telemetry or change actual mileage. If editing, keep the hiring joke/voice and remove unsupported numerical specificity.
- R6-LOCAL-WEATHER: Clarify whether terrain-local fog is intentionally distinct from broad weather. Plausible local mountain haze is not the same proof as actively sheltering from rain; do not mechanically count every atmosphere word as a new weather bug. No visual weather inspection.
- R5-PARTICLES scope extension: Confirmed grammar polish in addition to prior name-particle cases, not a separate high-priority logic bug. Use the correct shared particle boundary; do not alter the actual subject identity to hide it.
- R6-ORCHARD-TRANSIT: Reviewer itself flags possible narrative compression/next-trip anticipation. Do not declare actual teleportation, missing drive charge or changed resource timing without an authored context contract. Optional wording clarity, not a newly confirmed bug.

### 버그로 채택하지 않은 해석

- meet_postman: Previously retained clarification interpretation: pre-journey local knowledge is possible. First-trip distance does not disprove prior familiarity with settlements. Optional previous-life cue, not a new false-visit bug.
- seoul_base: Local mountain fog/haze can coexist with broad clear weather. Reviewer withdrew it after exact context; do not inflate the active rain-shelter issue into a blanket ban on all atmospheric wording.
- cell_sea_meet: Same previous first-contact interpretation: an organization may already know a marked vehicle, and the captain can introduce its name in this very line. Player not observing their communication does not prove impossible knowledge. Keep mysterious recognition distinct from forcing the player to falsely claim dispatch at the mountain meeting.
- crisis_collapse2 fatal result: Headless adapter recorded the authored six-hour result after fatal advance stopped at289minutes. Actual UI returns onS.ended before showing that paragraph; worker verified the actual consumer after all play. Do not count an invisible returned string as a displayed clock contradiction.
- crisis_nofuel3 fatal returned payload: Root owner check: applyFx commits numerical fuel before G.advance, then stops all remaining effects onS.ended. resolvePresentedChoice returns authored prose to adapter, but actual07UI line4579 returns onS.ended before showing result. Fuel8 is not evidence of a post-death award and returned success prose is not proof of displayed success. Keep this distinct from the earlier real post-fatal camp bond/memory defect R5-08.

### 정책/도구 한계

- Their zero reported defects are route-local findings, not proof that previous17 groups disappeared. Public fuel warning ignored, escort omitted, supply ordering and rationForecast key errors remain policy issues.
- Camp-later7 and reopen0: the policy treated successful zero-time dialogue opening as a no-op, so it blocked reopen. Do not report engine cancel/back failure or claim browser coverage. Scarcity from ignoring public fuel forecasts is not itself a forced engine deadlock.
- Work-regex omissions, accepting forecast shortage, recruitment-priority southern detours and a same-day exploration cap can lengthen a policy route. They are not forced navigation/balance defects. p37 post-play exact-event search exposed adjacent definitions; no later natural replay followed.
- Preparation return1 was exercised but no third-recruit plan was earned; eventual sleep is a policy choice/eligibility limitation, not proof preservation is impossible. Missing labels in work regex and forecast-shortage travel are separate policy defects.
- Their original thirst deaths are retained, not counted as story completion. Only public-policy changes preceded successful retry; exact source checks occurred after ALL natural attempts. Long delivery acceptance, missed public work, malformed procure.need filtering and full-seat recruitment retracing are policy limitations, not game softlocks.
- 53days/6525km came from repeated public side-quest priority, not forced main navigation. Source25% PRNG rule/positive weights and policy/seed are retained, but realized uniform/weighted counters were not serialized; do not fabricate empirical percentage.
- Initial futureDinner fixture guessed nonexistent choiceindex2, then selected observed 심판 label; final check succeeds withmoodAll+5. QA selector error is separate from natural engine exceptions.
- p46 low-fuel departures/repeated rescue andp47 missed night provisioning explain their policy hardship; the separate forecast midnight omission remains independently actionable. p48's declared25% Bernoulli sampler realized7/40; no extra retry or policy mutation ever ran after root clarified probability vs quota. One successful original run is retained, not a manufactured empirical>=20% rate.
- Two actual fuel crises followed public shortage forecasts that the policy did not prioritize. Finite recovery led to a first-attempt ending; not an engine fuel-forecast mismatch. Post-play exact seen definitions exposed adjacent unchosen prose, with no later natural rerun/fixture.
- Two preserved thirst failures came from procure/procurement key mismatch and a policy banning all shortage routes then camping repeatedly, not forced game softlocks. Third public-policy-only attempt naturally earned Minji/Kangwoo/Eunsu and core_quarantine. Root first stated preservation unobserved before collecting that last save, then immediately corrected it. Full1013-row review and raw policies/attempts retained; initial review projection dropped opening result strings and worker explicitly reread them after correcting its viewer.

### 유지할 것

- Keep the multi-step ridge rescue's anchor/rope/load-separation causality.
- Keep all actual companions' finale objections and visible consequences; technology-preserving persona need not be forced into that ending.
- Keep earned seeds/garden/collector and actual community help/medicine procurement, explicit finale costs and companion objections. The preserved choice was earned on one actual three-person route, not forced via grants. No need to erase awkward emotional beats or turn mystery into advance exposition.

## 20명 개별 보고

| 에이전트 | 선언 성향 | 최종 완주 | 동료 | 전 시도 선택수 | 보고 |
| --- | --- | --- | --- | --- | --- |
| player31 | 낙관적인 즉흥 구조자 | [core_transfer](player31/attempt01/player31-trace.json) | 독행 | 58 | [보고](player31/report.md) · [원 제보](player31/findings.json) · [정책](player31/policy.cjs) |
| player32 | 불신하는 협상가 | [core_sleep](player32/attempt01/player32-trace.json) | minji | 71 | [보고](player32/report.md) · [원 제보](player32/findings.json) · [정책](player32/policy.cjs) |
| player33 | 기술 보존을 중시하는 팀장 | [core_transfer](player33/attempt01/player33-trace.json) | minji, kangwoo, eunsu | 100 | [보고](player33/report.md) · [원 제보](player33/findings.json) · [정책](player33/policy.cjs) |
| player34 | 방랑하는 장터 요리사 | [core_sleep](player34/attempt01/player34-trace.json) | 독행 | 63 | [보고](player34/report.md) · [원 제보](player34/findings.json) · [정책](player34/policy.cjs) |
| player35 | 겁이 많지만 호기심 많은 탐험가 | [core_sleep](player35/attempt01/player35-trace.json) | jaeyi | 69 | [보고](player35/report.md) · [원 제보](player35/findings.json) · [정책](player35/policy.cjs) |
| player36 | 야영과 대화를 즐기는 기록자 | [core_transfer](player36/attempt01/player36-trace.json) | minji, kangwoo | 83 | [보고](player36/report.md) · [원 제보](player36/findings.json) · [정책](player36/policy.cjs) |
| player37 | 손재주 좋은 개조 애호가 | [core_sleep](player37/attempt01/player37-trace.json) | minji, kangwoo | 82 | [보고](player37/report.md) · [원 제보](player37/findings.json) · [정책](player37/policy.cjs) |
| player38 | 원칙 있는 비폭력 변호인 | [core_transfer](player38/attempt01/player38-trace.json) | minji | 84 | [보고](player38/report.md) · [원 제보](player38/findings.json) · [정책](player38/policy.cjs) |
| player39 | 경계심 강한 야간 운전자 | [core_transfer](player39/attempt01/player39-trace.json) | 독행 | 71 | [보고](player39/report.md) · [원 제보](player39/findings.json) · [정책](player39/policy.cjs) |
| player40 | 사람을 믿는 공동체 관리자 | [core_sleep](player40/attempt01/player40-trace.json) | kangwoo, eunsu | 100 | [보고](player40/report.md) · [원 제보](player40/findings.json) · [정책](player40/policy.cjs) |
| player41 | 시간에 쫓기는 배달꾼 | [core_transfer](player41/attempt02/player41-trace.json) | 독행 | 187 | [보고](player41/report.md) · [원 제보](player41/findings.json) · [정책](player41/policy.cjs) |
| player42 | 혼자 다니는 증거 수집가 | [core_transfer](player42/attempt01/player42-trace.json) | 독행 | 60 | [보고](player42/report.md) · [원 제보](player42/findings.json) · [정책](player42/policy.cjs) |
| player43 | 추억에 약한 공연 애호가 | [core_transfer](player43/attempt02/player43-trace.json) | minji, kangwoo | 195 | [보고](player43/report.md) · [원 제보](player43/findings.json) · [정책](player43/policy.cjs) |
| player44 | 실리를 따지는 서해안 상인 | [core_transfer](player44/attempt01/player44-trace.json) | leo, minji | 162 | [보고](player44/report.md) · [원 제보](player44/findings.json) · [정책](player44/policy.cjs) |
| player45 | 산길을 좋아하는 수리공 | [core_transfer](player45/attempt01/player45-trace.json) | kangwoo | 74 | [보고](player45/report.md) · [원 제보](player45/findings.json) · [정책](player45/policy.cjs) |
| player46 | 의료와 충분한 휴식의 보호자 | [core_sleep](player46/attempt01/player46-trace.json) | kangwoo | 89 | [보고](player46/report.md) · [원 제보](player46/findings.json) · [정책](player46/policy.cjs) |
| player47 | 기술을 의심하지만 사람은 믿는 자율주의자 | [core_sleep](player47/attempt02/player47-trace.json) | kangwoo | 144 | [보고](player47/report.md) · [원 제보](player47/findings.json) · [정책](player47/policy.cjs) |
| player48 | 망설이며 결정을 바꾸는 중립자 | [core_sleep](player48/attempt01/player48-trace.json) | 독행 | 60 | [보고](player48/report.md) · [원 제보](player48/findings.json) · [정책](player48/policy.cjs) |
| player49 | 농사와 생활공간에 관심 많은 이주자 | [core_quarantine](player49/attempt03/player49-trace.json) | minji, kangwoo, eunsu | 245 | [보고](player49/report.md) · [원 제보](player49/findings.json) · [정책](player49/policy.cjs) |
| player50 | 낯선 길을 즐기는 과감한 여행자 | [core_transfer](player50/attempt01/player50-trace.json) | kangwoo, jaeyi | 85 | [보고](player50/report.md) · [원 제보](player50/findings.json) · [정책](player50/policy.cjs) |

## 증거·검증·한계

- [실제 생성/최종 응답 확인](agents.json), [성향·seed](roster.json), [작업 지침](BRIEF.md), [방법·변경점](METHOD.md).
- [전 시도/집계/원 제보](collected.json), [완료·원본·seed·hash·리뷰 수 검증](validation.json), [판정의 정확한 행/인용/경계](director-rulings.json).
- [root 별도 source/fixture 진단](director-checks.json)은 자연 플레이 횟수에 더하지 않는다. 원시 로그와 앞선 감사를 수정하지 않았다.
- [생산 전 fingerprint](freeze-before.json), [생산 후 fingerprint](freeze-after.json). 각 정책의 난수 집계/재현 근거는 해당 플레이어 폴더에 보존했다. source hash와 source/UI 관측은 서로 다른 증거다.
- [초기 실제 Studio GET](live-before.json), [최종 실제 GET](live-after.json), [전후 상태/접속 한계](live-comparison.json). text/game-state는 스크린샷이 아니며 root는 사용자 저장·배지·새로고침·서버·탭을 조작하지 않았다.
- 모든 루트 읽기는 각 에이전트의 확인과 읽기 범위/원본 기록에 근거한다. 사람의 주의/눈 움직임을 측정한 검사는 아니다. 필수 guardrails의 사전 지식과 raw main/navigation 투영 때문에 완전 블라인드 인간 플레이라고 부르지 않는다.
- 일부 사후 exact-event source 검사가 인접 미관측 정의를 노출했으나, 각 보고서에 시점과 후속 재실행 여부를 기록했다. source를 읽은 뒤 미래 결과를 이용해 성공을 만든 경로로 세지 않는다.
- 미리보기의 실제 글자·그림·초점·터치·음성·브라우저 새로고침/계속하기·공연 동기화·성능은 이번 검증 범위 밖이다. 모든 버그 발견/출시 준비/재미를 보증하지 않는다.

## 다음 작업

미확인 항목을 임의로 고치거나 같은 랜덤20명만 반복하기보다, 확인된 소유자들을 묶어 수선한 뒤 이 원본 정책들로 회귀한다. 0/소량 자원, 0/1/다수 동행·임시손님, 야영 사망 경계·미루기/재열기, 실제로 자격을 얻은 보존 결말을 집중 검증하고 실제 모바일 크기 Studio 화면에서 진입→결과→다음 행동→새로고침을 확인한다. UI 재설계는 별도 승인된 디자인 초안 절차를 따른다.
