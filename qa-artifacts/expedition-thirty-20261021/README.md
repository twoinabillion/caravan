# 신규 30명 다경로 엔진 플레이 감사 · 2026-10-21

이번 요청은 수집과 리포트다. 생산 코드·생성 HTML·실제 사용자 저장은 수정하지 않았다. 사람 30명이나 브라우저 30회의 플레이가 아니라, 새 subagent 30명의 독립 정책과 격리된 실제 엔진 실행이다.

이전 감사의21묶음 수선은 별도 완료 기록이다. 당시966/966 검사를 통과했고 이번 시작 화면에서 수정 버전1792559069066을 확인했다. 이번에 새로 수집한 아래 항목에는 수선을 적용하지 않았다. [이전 수정 범위](../expedition-repairs-20261021/README.md).

## 결과와 범위

- 실제 생성 30명 / 보고 30명 / 메인 SESSION1END 도달 28명. 실패·중단을 포함해 45시도, 3822선택 occurrence, 19548행을 보존했다.
- 실제 관측 292사건·427사건/선택 쌍. 고정 과거 802쌍 대비 새 47쌍이다. 선택 가능 목록만 본 것은 선택 완료 coverage에 더하지 않았다.
- 실제 방문 일반 42/42, 숨은 곳 3/16. 발견과 방문은 구분한다.
- 참가자별 마지막 완주 결말: core_transfer 21명, core_sleep 7명. 이 분포는 정책의 결과이지 사람 선호나 엔딩 밸런스 지표가 아니다.
- 미완주 시도 15개와 예외 기록 시도 5개도 그대로 보존했다. 계획 실패·어댑터 한계·게임 결함은 개인 보고와 디렉터 판정에서 구분한다.
- 미지급 진입 reload 3824회 / 기지급 결과 reload 3818회 / 일반 reload 14회. snapshot 불일치 0, 중복 지급 0, 복원 실패 0.

미완주 시도15개는 갈증 사망8, 정책 정체/제한6, 활성 선택0 사건1이다. 메인에 끝내 도달하지 못한 참가자는 player06·player11이다. 오류 문자열이 남은5시도 중4개는 정책 중단이며, 게임 후보1개는 레오 사건 A02로 따로 판정했다.

음수 식량/물 예보가 있었는데 출발한 정책 경고는 42회·5명이다. 정상 엔진이 허용한 선택과 실제 완주 사실은 보존하지만, 이 정책들이 모든 보급 경고를 지켰다고 주장하지 않는다. 원기록은 collected.json의 rationWarnings에 있다.

## 디렉터 판정

원시 후보 22건을 13그룹으로 분류했다. 취향 75건, 정책·검증 한계 192건, 기각 의심 125건은 별도로 보존했다. 후보를 전부 버그로 부르거나 모든 문제를 찾았다고 주장하지 않는다.

### A02 · P1 · 레오의 식사 제안에서 활성 선택이 하나도 없는 상태

엔진 진행 차단 확인 · 실제 화면 차단은 미검증. 식량0·민지 부재에서도 가능한 응답이나 일관된 안전 복귀를 보장한다. 모든 잠긴 선택지를 무조건 숨기는 변경은 별도 검토한다.

- [player06/player06-F03](player06/findings.json): Natural attempt03 n629–630 leaves unpaid initiative_leo_pause at Daejeon food0, party[leo], low mood and sufficient Leo bond. Both authored replies unavailable (food1 / Minji). eventAvailable tests visibility, not any executable reply. UI eventChoiceData preserves a disabled food button, while safe-exit tests any .choice[data-i], not an enabled one; general Escape excludes ev-wrap. Engine continuation is blocked, and browser blocking risk is supported by source, not visually certified. Provide a valid existing-state response or consistent all-disabled safe return; keep the failed policy/trace, do not blame all low supplies on the game.

### A01 · P2 · 잠·장시간 휴식에도 깨어 있는 피로가 더해짐

정산 경로 확인 · 휴식별 의도 구분 필요. 짧은 잠의 기존 회복량과 완전 수면을 구분한다. sleep:true를 일괄 추가해 모든 낮잠을 피로0으로 만들지 않는다.

- [player01/P01-01](player01/findings.json): Natural n125 explicitly sleeps120minutes while ordinary advance adds5.7024 awake fatigue before the authored45 recovery. Guardrail and current sleep owner distinguish sleeping time. Chip itself truthfully describes its separate45 effect, not a false payment. A partial nap must not receive the new full-rest reset by blindly adding sleep:true.
- [player07/P07-01](player07/findings.json): Independent natural attempt02 n63 at Namwon explicitly sleeps on a sofa for60minutes; fatigue33.6861to30.2241 equals +2.538 awake fatigue then the authored6 recovery. Same owner as P01-01; merge, not a separate bug count. Partial rest should preserve authored recovery rather than blindly use full-reset sleep:true. Paid reload n64 unchanged and n65 departure is reachable.
- [player06/player06-F01](player06/findings.json): Natural attempt01 n206 at Nonsan rests480minutes21:16to05:16 but fatigue48.22129to65.93329 increases17.712. No fatigue recovery/sleeping marker; time goes through ordinary awake advance. Same rest-semantics family as naps, but whether the sauna is full sleep or awake relaxation is a design choice. Preserve time/meal boundaries; do not silently grant a full reset to every rest.
- [player12/P12-02](player12/findings.json): Independent natural crisis_drowsy n346 sleeps120minutes06:32to08:32 without meal boundary; fatigue92.76788to51.87188 includes +4.104 awake accumulation before45 recovery. Same owner as P01-01/P07-01, not a new bug count. Paid reload n347 unchanged; next drive n348 reaches Daejeon. Preserve partial rather than full-reset recovery.
- [player22/P22-F02](player22/findings.json): Independent natural n275 sleeps120minutes00:26to02:26 with no meal boundary; fatigue85.45294to44.55694 includes4.104 awake accrual before45 recovery. Same partial-nap owner and risk as earlier reports. Paid reload n276 unchanged and next drive n277 reaches Pyeongtaek; preserve authored partial recovery instead of full reset.
- [player30/P30-01](player30/findings.json): Independent natural attempt02 n127–131: the explicit60-minute sofa nap changes fatigue35.38252to31.59652, i.e.2.214 awake accumulation then6 recovery, with unchanged food/water and no reload delta. The -6 chip correctly describes its own committed effect; it is not a false payment or certified UI defect. Source03-data:9446 omits sleeping semantics and04d:452–460 calls ordinary advance before the partial fatigue effect;04b:729 adds awake fatigue. Merge into A01, preserving partial recovery and meal boundaries rather than giving a full-reset sleep:true.

### A03 · P2 · 식량0의 안개 대기에도 먹을 것을 꺼냈다고 서술

자원 상태와 결과 문장의 불일치 확인. 실제 보유량에 맞게 식사 문장을 구분한다. 식량이 없어도 안개를 기다릴 수 있는 출구와 기존120분은 유지한다.

- [player12/P12-01](player12/findings.json): Natural attempt01 n509 fog wait starts and ends food0 but explicitly takes out food and folds the last packet. Attempt02 n258 with food5to4 uses the same fixed text. Clamped shortage loss is not an unpaid voluntary purchase; keep the legal resource-free fog wait and120minutes rather than gate it behind food1. Branch narration on actual prechoice stock/settlement and preserve already-paid receipts.

### C01 · P3 · 소방복을 챙기는 결과와 부품 보상의 연결

낮은 우선순위 명료성. 기존 보상의 출처를 설명하거나 물건 용어를 맞춘다. 새 방어구 체계를 만들 근거는 아니다.

- [player03/P03-01](player03/findings.json): n161 says only one fire suit remains while actual item parts10to11 is paid and retained. May be useful-equipment abstraction rather than arithmetic/item grant bug. Explain the intended existing parts provenance; do not infer a missing armour mechanic or change rewards automatically.

### C02 · P3 · 공구함 열쇠가 작업장 셔터 열쇠로 읽히는 연결

낮은 우선순위 명료성. 같은 열쇠/열쇠고리인지 연결을 분명히 한다. 새 아이템이나 귀환 사건을 더하지 않는다.

- [player03/P03-02](player03/findings.json): Actual keep_key entry and foreseeable specify tool-chest key; note/echo and finale call it workshop key and explicitly promise opening the shutter. Shared key/keyring is possible but unintroduced. Align the object referent or introduce that link, not a new journey/item/reward.

### C03 · P3 · 지역 거점으로 완료했는데 남아 있는 수원 중계소 안내

완료 목표의 출처 명료성. 완료 조건은 유지하고 실제 지역 접촉 또는 원격 회의에 맞춰 완료 설명을 구분한다.

- [player05/P05-F01](player05/findings.json): Natural n207–212 at Sejong changes relay from upcoming to done after the third local cell contact, before first Suwon arrival n321. D.coreLinkedCells intentionally accepts local contacts; no quorum/ending defect. G.departureSteps retains fixed prospective Suwon instructions. Quest completed-step template src/07d-ui-quests.js:365 does render step.detail, though actual notebook input/crop was not tested. Use earned local/remote provenance for the completed description without changing flags or rules.

### C04 · P3 · 못판 결과의 ‘한나절’과 실제70분 차이

정산 오류 아님 · 시간 표현 검토. 기존70분을 유지한다면 문구만 맞춘다. 벌칙 시간을 크게 늘릴 이유는 아니다.

- [player06/player06-F02](player06/findings.json): Natural attempt02 n1896 nail-trap outcome says half a day but16:13to17:23 is70minutes, matching authored fx.time70 and reload n1897. Colloquial exaggeration is possible; change copy rather than increase penalty unless separately intended. Next drive reaches Gumi at n1898.

### C05 · P3 · 검증키 회수 분기에서 갑자기 쓰이는 작전 지도

확정 모순 아님 · 단서 출처 명료성. 앞서 베낀 묶음 번호와 지도의 관계 또는 현장 발견을 짧게 연결한다. 지급·분기 조건은 유지한다.

- [player10/P10-01](player10/findings.json): Natural Cheongju n134 copies the cache bundle marks, then direct follow-up n137 uses a northern operations map to locate the archive without introducing how that map was obtained. The follow-up opening itself could be a compressed first introduction; no impossible location or illicit grant is established. Make that source link readable if revised, keeping existing flag, chain and earned verification key.
- [player24/P24-F01](player24/findings.json): Independent natural attempt01 n153–161 at Cheongju confirms the guarded-cache choice n155 copies bundle marks, followed immediately by n158 referring to the northern operations map. Same clue-source gap as P10-01; merge instead of counting another defect. The map may be a compressed introduction, not an impossible location or unauthorized item grant. Paid reload n159 is stable, next exploration n160 is reachable, and the key award matches the chosen branch.
- [player26/P26-01](player26/findings.json): Natural attempt01 n159–164 independently repeats the guarded-cache map introduction gap, this time leaving a copy in the relay box at n162. Same source and clarity issue as P10-01/P24-F01. Key payment, paid reload and next Cheongju exploration are valid. Merge rather than count another logic bug; keep existing costs and earned branch.

### C06 · P3 · 서울 진입의 일반 편지·봉투와 선택 물품의 혼동

배낭 오류로 확정하지 않음 · 낮은 우선순위 명료성. 일반 기록 포장일 수 있다. 필요하면 챙겨 온 기록으로 지칭을 명확히 하되, 특정 편지·봉투의 보유 조건은 유지한다.

- [player13/P13-F01](player13/findings.json): Natural attempt02 seoul_open n227 always puts letters/envelopes/notebook on the passenger seat, while specific southern-letter n231 and grandfather-envelope n243 options are unavailable and items absent. Generic personal papers or testimony packaging remain a valid interpretation: no named-item grant/loss or inventory defect is established. Optional low-priority terminology clarification; retain specific-item gates and refer to earned records without inventing new possessions.
- [player21/P21-C01](player21/findings.json): Independent natural seoul_open n234 names generic letters after declining the specific delivery n78; that optional item remains correctly unavailable at n238 and the journey completes. Same referent-clarity issue as P13-F01, not a new item or save defect. General testimony papers remain a valid interpretation; preserve optional-item gates.

### C07 · P3 · 비상 도보 급유의 고정 소모 안내와 보유분 차감

비용·결식 안내 명료성 · 지불 게이트 오류로 확정하지 않음. 보유분 중 최대 소모라는 구제 계약을 명확히 한다. 식량3이 있어야만 탈출하게 막거나, 없는 식량을 지급하는 수선은 하지 않는다. 기지급 영수증은 실제 차감과 일치한다.

- [player22/P22-F01](player22/findings.json): Natural crisis_nofuel3 n247 walking at food0 charges food0 and misses lunch while granting earned fuel8 after600minutes; n213 and271 cap to carried1. Paid receipts/reload are correct. This is a forced emergency loss with an intentional reachable rescue exit, not an unpaid voluntary purchase. Optional wording such as maximum/remaining supplies clarifies fixed3 forecast. Do not add a food3 gate or rewrite old receipts; no arithmetic/softlock defect established.

### D02 · review · 홍수와 겨울 정전의72시간 기록 관계

확정 오류로 세지 않음 · 설정 순서 검토. 서로 다른 사건일 수 있다. 같은 최초 권한 부여인지 먼저 확인하며, 현재 근거만으로 설정을 통합하거나 바꾸지 않는다.

- [player11/P11-F01](player11/findings.json): Natural attempt03 n309 describes government-wide flood emergency powers; n493 lab document describes a winter-outage72hour automatic-execution amendment on an early transport pilot. Both can exist at different times/scales; neither explicitly says it is the same unique first grant. Do not count as a confirmed contradiction or rewrite canon without establishing chronology. A short ordering/source distinction is a possible clarity improvement, not a mandated bug fix.

### D03 · review · 인간 승인·아빠의 죽음을 확신하는 근거 제시 밀도

논리 버그로 확정하지 않음 · 독해/서사 의견. 기록상 처리와 독립 확인을 구분할 여지는 있다. 다만 인물의 추론과 확정된 사망 설정을 바꾸거나, 없는 증언·증명서를 더할 근거는 아니다.

- [player15/F15-01](player15/findings.json): Natural n66 labels the printed field human confirmation03:23, then the narrator calls it an after-departure approval; entry already marks the inference with 셈이었다. Missing approver name does not prove nobody approved, and later canonical admission is compatible. Optional distinction between recorded processing and independently verified human action; do not erase the story inference or invent an approver.
- [player15/F15-02](player15/findings.json): Natural n177 gives the last-maintenance record, lack of return, and explicit authoritative narration that father died. A reader may want more evidentiary closure, but this is not a survival-state error or proof father is only missing. Preserve established death/canon and emotional restraint; adding an invented witness/certificate would exceed the evidence. Treat as narrative-density feedback, not a mandatory bug fix.

### T01 · review · 경로 API의 준비됨 등급과 보급 경고 해석

현재 UI 버그로 확정하지 않음 · 감사 정책/관측 계약 주의. 현재 UI는 별도 보급 경고를 만든다. shortage는 연료 전용, 식량/물은 margin으로 확인한다. 경고를 놓친 정책도 공개하며 게임 UI·밸런스 수선을 필수로 올리지 않는다.

- [director/DIR-01](root-findings.json): Natural player19 attempt02 n329 has food0/lunch need1 and foodMargin-1, yet weighted API grade72 is 준비됨. This grade is not a resource gate. Current UI07:2396 independently builds a supply warning from negative supplyMargin and does not directly render readinessLabel; no actual screen defect is established. Clarify fuel-only shortage versus ration margins in audit schema/policies, disclose missed warnings, and do not require changing game UI or meal balance on this evidence.

## 행동 coverage와 빈칸

의뢰 수락 12회, 인계 6회, 실제 개조 7회, 준비 복귀 1회가 true로 반환됐다. 같은 시도의 반복 성공은 사람 수로 바꾸지 않는다. 마지막 전투 보고가 남은 시도는 33개이며, 이것은 전체 전투 횟수가 아닌 하한이다.

미실행 행동: radio, craft. 보존 근무 결말(core_quarantine)은 이번 메인 완주 분포에서 관측되지 않았다. 다른 두 결말을 본 것으로 이를 검증했다고 하지 않는다. [행동별 원기록](flow-coverage.json)을 함께 본다.

## 기존 미결과 이번 관측 구분

기존 D01(우물 줄에서 비폭력 선택이 모두 잠기는 조건)은 이전 수선에서 설계 판단으로 남았다. 이번 참가자의 자연 재관측이 별도로 입증되지 않으면 신규 발견 수에 더하지 않는다. 무료 철수나 사건 등장 제한을 자동으로 추가하기로 결정한 것은 아니다. [이전 수선 범위](../expedition-repairs-20261021/README.md)를 참고한다.

## 참가자별 결과

| 참가자 / 성향 | 보존 시도 | 메인 완주 | 선택 / 행 | 보고 |
|---|---:|---|---:|---|
| player01 · 조심스러운 첫 여행자 | 1 | core_transfer | 62 / 268 | [상세](player01/report.md) |
| player02 · 타인을 돕는 공감형 | 1 | core_transfer | 98 / 477 | [상세](player02/report.md) |
| player03 · 독행 생존가 | 1 | core_transfer | 62 / 284 | [상세](player03/report.md) |
| player04 · 개조를 좋아하는 정비공 | 1 | core_sleep | 83 / 402 | [상세](player04/report.md) |
| player05 · 과거 기록을 따지는 역사광 | 1 | core_transfer | 89 / 391 | [상세](player05/report.md) |
| player06 · 동료 건강을 챙기는 보호자 | 3 | 미도달 | 529 / 4307 | [상세](player06/report.md) |
| player07 · 공연과 동물을 좋아하는 여행자 | 2 | core_sleep | 159 / 702 | [상세](player07/report.md) |
| player08 · 무전 소리에 끌리는 기술 애호가 | 1 | core_sleep | 76 / 322 | [상세](player08/report.md) |
| player09 · 절약하는 장사꾼 | 1 | core_transfer | 61 / 280 | [상세](player09/report.md) |
| player10 · 살아서 빨리 가려는 직진파 | 1 | core_transfer | 53 / 231 | [상세](player10/report.md) |
| player11 · 발견한 샛길을 찾는 탐험가 | 3 | 미도달 | 353 / 1656 | [상세](player11/report.md) |
| player12 · 밤길을 즐기는 운전자 | 2 | core_transfer | 232 / 1067 | [상세](player12/report.md) |
| player13 · 낮에만 움직이려는 신중파 | 2 | core_transfer | 100 / 476 | [상세](player13/report.md) |
| player14 · 거래보다 자율을 중시하는 반항아 | 1 | core_sleep | 66 / 290 | [상세](player14/report.md) |
| player15 · 모든 설명을 의심하는 회의론자 | 1 | core_transfer | 58 / 247 | [상세](player15/report.md) |
| player16 · 가능하면 동료를 모으는 공동체형 | 2 | core_transfer | 137 / 633 | [상세](player16/report.md) |
| player17 · 작은 발견과 동물에 끌리는 호기심형 | 1 | core_transfer | 79 / 365 | [상세](player17/report.md) |
| player18 · 쉬며 대화하는 야영 애호가 | 2 | core_transfer | 146 / 648 | [상세](player18/report.md) |
| player19 · 물자 수익을 좇는 교역상 | 2 | core_transfer | 212 / 1033 | [상세](player19/report.md) |
| player20 · 준비되면 위험을 택하는 전투파 | 1 | core_transfer | 89 / 412 | [상세](player20/report.md) |
| player21 · 협상과 철수를 택하는 평화주의자 | 1 | core_sleep | 60 / 270 | [상세](player21/report.md) |
| player22 · 자주 저장하고 돌아오는 신중파 | 1 | core_transfer | 83 / 379 | [상세](player22/report.md) |
| player23 · 배달 약속을 지키는 운송가 | 3 | core_sleep | 161 / 776 | [상세](player23/report.md) |
| player24 · 필요하면 약속도 거절하는 현실주의자 | 1 | core_transfer | 75 / 322 | [상세](player24/report.md) |
| player25 · 해안과 산길을 오가는 우회 여행자 | 2 | core_transfer | 171 / 838 | [상세](player25/report.md) |
| player26 · 눈앞의 선택을 섞는 변덕쟁이 | 1 | core_sleep | 77 / 343 | [상세](player26/report.md) |
| player27 · 임무를 끝까지 챙기는 완수형 | 1 | core_transfer | 62 / 297 | [상세](player27/report.md) |
| player28 · 지도에 새 표식이 뜨면 찾아가는 수집가 | 1 | core_transfer | 154 / 744 | [상세](player28/report.md) |
| player29 · 물과 끼니를 우선하는 살림꾼 | 2 | core_transfer | 122 / 572 | [상세](player29/report.md) |
| player30 · 인물의 말투와 감정을 읽는 독자 | 2 | core_transfer | 113 / 516 | [상세](player30/report.md) |

## 남은 검증 범위

UI·음성·입력·실기 검수는 하지 않았다. 타이머·UI·오디오는 대역이며, 비용 정산·자원·선택 결과·게임 저장을 실제 엔진에서 관측했다. 독립 정책이지만 완전 맹검 실험은 아니다. 일부 초기 참가자가 관측 스키마를 읽다가 기본 계획 코드 일부를 봤다는 노출도 각 보고에 남겼다. 이후 참가자는 SCHEMA만 쓰도록 지침을 좁혔다.

미방문: 낚시꾼의 호수(lake), 달빛 온천(spring), 폐 군 비행장(airfield), 태양광 농장(solar), 잠든 휴게소(reststop), 책의 터널(tunnelbook), 서해 등대(lighthouse), 달빛 자동차극장(drivein), 해바라기 밭(sunflower), 섬진강 매화마을(maehwa), 민규의 능선(mingyu_ridge), 재이의 창고(jaeyi_cache), 시대극 세트장(filmset).

실제 사용자 화면의 읽기 전용 시작 상태: HTTP200, title / 360×728 / loaded 1792559069066. 종료 재조회: HTTP400. Studio 창에서 현재 장면을 받지 못했습니다. 창이 열려 있는지 확인해 주세요. 종료 화면·viewport·적용/배지 상태는 확인하지 못했다. 마지막 상태 질문에서 새로 제공된 읽기 전용 runId를 사용한 경우 capture-after.json에 URL을 남겼다. 시작/종료 GET은 시각 검수 증거가 아니다.

[검증 결과](verification-final.json) 실행 자료 검증 통과 / 실제 종료 장면 조회 미확인 · [전수 수집 원자료](collected.json) · [원시 후보별 판정](adjudications.json) · [실제 생성 task](tasks.json) · [고정 과거 coverage](baseline.json).
