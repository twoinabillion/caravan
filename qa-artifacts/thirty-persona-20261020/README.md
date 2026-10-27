# Thirty-persona engine playtest — final discovery report

Thirty fresh independent agent tasks completed their handoffs. **30/30 reviewers reached storyDone and the actual SESSION 1 END aftermath** using a current preparation bundle. Failed runs are retained, not counted as story completion. No game repairs were made in this audit.

These are agent-driven, finite-resource, isolated Node runs of the real source engine—not thirty humans or browser/mobile playthroughs. Each reviewer created a new policy from public observations and read every occurrence in its own chronological trace. Runs use the onroad interactive opening with declared name/preparation, not actual title/preparation controls or the optional journey-preview flow. UI, timers and audio were substituted. The actual Studio save, controls, live-apply badge and browser were not operated.

## Completion and coverage

- 42 retained attempts; 2,872 chosen transactions; 249 normalized event IDs and 298 event/choice pairs.
- 10 pairs were absent from the 640-pair retained historical baseline. A pair is coverage, not a unique outcome or a guarantee that all branches were tested.
- Additional exercised controls across retained attempts: board accepts 3, explicit turn-ins 3, local work 29, trades 261, upgrades 0, camp-talk openings 25. These action counts are not distinct quest chains or proof all succeeded; reviewer traces specify actual outcomes.
- Final supported completion per reviewer: core_transfer 25; core_sleep 5. These are policy results, not human ending preferences or a balance target.
- No reviewer completed the preservation ending in this batch. Camp-talk defer/reopen was also not exercised. Neither branch is covered by the completion total.
- All retained attempt terminals: other-terminal 7; main-story-complete 35. Two obsolete-pack diagnostic completions are retained separately and never substitute for supported-bundle completion.
- Paid-result reloads 2869; unpaid-entry reloads 195; ordinary reloads 1. Recorded snapshot differences 0, duplicate applications 0, failed restores 0. This is not browser Continue/manual-refresh, full hidden/RNG-state or visual-persistence proof.
- Source-engine, observer, pre-existing production diff and generated HTML fingerprints stayed unchanged; see the before/after files and validation below. No build or production test suite was rerun in this discovery task. Earlier 893-test repair results are historical evidence, not fresh audit results.

## Director decisions

Prioritize transaction completion and truthful receipts, then remembered choices/companion history, then local scene context and copy. Keep observations, rule decisions and stylistic interpretations separate. Exact row/quote/source evidence and smallest repair boundaries are retained in [director-rulings.json](director-rulings.json); root fixtures are [director-checks.json](director-checks.json), explicitly not additional naturally played routes.

P1: engine transaction continues after a fatal boundary. P2: choice/history/cost or local causal trust. P3: wording, precision or metadata. These priorities do not imply that a hard progression blocker was found.

| ID | Priority | Confirmed issue group | Scope / status |
| --- | --- | --- | --- |
| R5-01 | P2 | 산지기 첫 선택이 실제 파견을 받았다고 강제 | confirmed narrative overcommit |
| R5-02 | P2 | 독행 빵집의 미소개 대화 상대와 글씨 인용의 발화 오인 | confirmed narrative/reader actor mismatch |
| R5-03 | P3 | 나누지 않은 물까지 최종 일지의 경험으로 회고 | confirmed over-specific journey-history claim on the observed path |
| R5-04 | P2 | 양조장5시간·안동4시간 결과가 이후 밤샘을 완료 | confirmed bounded-time results completing a later night/dawn |
| R5-05 | P3 | 맑음·안개·황사에서도 비를 피하는 현재 장면 | confirmed current-weather prose mismatch |
| R5-06 | P2 | 정차 대화가 다음 정차의 수리를 이미 끝냄 | confirmed present/future mismatch on a supported completed route |
| R5-07 | P2 | 사기 상한에 막힌 증가분까지 결과에 더했다고 표시 | confirmed receipt/actual-delta mismatch; actual browser not inspected |
| R5-08 | P1 | 갈증 종결 후 야영 대화 유대와 기억을 뒤늦게 지급 | confirmed engine transaction continues after fatal time boundary |
| R5-09 | P2 | 달구지 번호판이 없다는 대답과 번호판을 읽는 후속 장면 | confirmed canonical-text inconsistency; intended truth of a player's claim needs author decision |
| R5-10 | P2 | 진료 버스의 약 배송 약속을 옛 전복 버스 구조로 기억 | confirmed current-scene/remembered-choice mismatch |
| R5-11 | P2 | 대구 경비탑에 남긴 군번줄이 대화·서울에서 다시 두 개 | confirmed branch-dependent prop continuity mismatch across several callbacks |
| R5-12 | P2 | 에코를 자칭한 뒤 콜사인이 비밀·미사용 상태로 돌아감 | confirmed non-linear disclosure history mismatch |
| R5-13 | P2 | 동료 한 명을 여러 새 동행자로 소개하는 코어 선택 | confirmed party-cardinality mismatch in the full pointing/introduction passage |
| R5-14 | P2 | 등산용품점·고기날 유일 선택의 고철2 지불이 사전 고지·요구 없음 | confirmed undisclosed voluntary payment at two events |
| R5-15 | P3 | 엄마 재회 뒤 중계소 목표의 장 메타데이터가5→4→5 | confirmed engine/ledger chapter metadata regression; actual current-card number not displayed |
| R5-16 | P3 | 연료·피로 결과의 과도한 소수 정밀도 | confirmed generated feedback-format precision; actual visual appearance unverified |
| R5-17 | P2 | 새벽에 시작한 야영에 이미 지난03:00 모닥불 사건을 회고 | confirmed camp-memory incident outside the actual camp interval |

### Separate rule / clarity decisions

- R5-CAMP: 짧은 새벽 야영이 완전 수면·수리·밤 효과를 지급. Observed mechanics reproduced; minimum sleep duration and recovery scaling are design decisions, not a proven hard blocker.
- R5-LEO-CHILD: 자유 대화가 방금 만난 정비소 아이를 전제. Continuity clarity candidate. Everyday offscreen encounters remain possible; introduce the child locally or keep action within the known notebook rather than invent a gated quest.
- R5-FATIGUE-SCOPE: 시간 누적 피로와 직접 효과 피로 영수증의 범위. Receipt-framing/design question, not a newly proved arithmetic error. Current direct-effect owner and elapsed costs need to be distinguished from whole-transaction net change before changing computation or UI. Actual reader layout remains uninspected.
- R5-WATER-UNIT: 물 한 통과 물 자원4의 의미가 장터 통 단위와 모호. Confirmed cross-surface unit ambiguity, not an arithmetic/resource-loss bug. Define standard resource vs physical-container wording before editing one reward or globally changing balance. Preserve +4 unless an explicit economy decision says otherwise.
- R5-SEOJIN-ROLE: 핵심 기록 전달자의 첫 등장 역할을 짧게 연결. Optional first-introduction clarity, not teleport/knowledge-leak proof. A name introduced through an action is legitimate prose. If needed, connect the existing contact/deliverer role locally without inventing a backstory, new journey or quest.
- R5-EXTERNAL-MEAL: 외식을 먹은 결과와 식량 재고+1의 추상화. Optional resource-abstraction clarity, not proved inventory or hunger arithmetic bug. A free meal may spare tomorrow's stored ration. Clarify saved stock/takeaway only if that is intended; do not reverse rewards or invent an extra meal cost.
- R5-COMBAT-FORECAST: 우회 선택의 확정 연료·차체 비용이 선택 전에 예고되지 않음. Confirmed forecast omission, but the guaranteed combat-cost disclosure contract needs a design ruling. Keep separate from undisclosed voluntary merchant payment; do not gate the escape behind fuel4, remove the escape, promise random outcomes or infer that every combat loss must be previewed. No actual browser layout inspected.
- R5-PARTICLES: Observed text and source-confirmed grammar defect; low priority. Use the proper name-particle owner/helper rather than renaming a character or sprinkling per-character exceptions. No actual layout or voice complaint inferred.

### Audit-tool follow-up, not game bugs

- R5-OBSERVER-PROVENANCE: observer limitation, not a product defect. In a separately versioned next audit, include the reader-visible origin/media label and epilogue distinction in eventObservation. Do not change this frozen audit's observer or retroactively regenerate its traces.
- R5-OBSERVER-JOURNAL: engine projection differs from actual notebook presentation. Project only actual currently visible notebook facts for player-like policies, or label source-engine metadata diagnostics separately. Upcoming engine step labels are not proof of player-visible knowledge. This audit is not claimed fully blind.

### Reports not accepted as product bugs

- meet_postman: Known R4-05 interpretation: pre-journey local knowledge is possible. Early three-settlement wording can be clarified but does not prove fabricated visits.
- cell_sea_meet, cell_dome_meet: Other groups may recognize the canonical white-X vehicle through their own communication; this does not force the player to claim a dispatch. Keep distinct from mountain contact's only player choice.
- seoul_night, seoul_session_reset: Authored epilogue provenance intentionally separates night/dawn/return from the terminal numeric clock. Raw frozen engine time alone is not a bug.
- seoul_ruins, salvage_claim: Solo 우리는/우리 차 can include the personified vehicle or rhetorical human community; no extra named actor/action is forced in the cited passage. Clarity may be improved selectively, but do not mechanically replace every plural. Distinct from R5-13 explicitly introducing several other newly boarded people.
- story_family_key: Known prior clarity interpretation: 복원한 can describe the playable/recovered excerpt, not necessarily restoration of its separate missing continuation. Confirmed ending memory honors the classification-screen choice. Neutral 확인한 wording may clarify, but no proved progress/item grant defect.

### Preserve while repairing

- Keep tactical preparation and multi-step rescue causality. Do not erase risk/retreat merely because several policies ignored supply forecasts.
- Keep Jaeyi's principled disagreement and visible bond cost. Opposing a chosen finale is not a bug when the option honestly discloses it and applies it once.
- Keep family evidence as separate corroborated records and the small-performance-to-ON-AIR arc. Do not replace character-specific actions with generic moral lessons.

## All thirty reviewers

The table shows each reviewer’s last supported complete attempt. All earlier attempts and their policy snapshots remain in the reviewer folders and [collected.json](collected.json). A completed route can still contain policy mistakes; full-route review does not mean all possible choices were executed.

| Reviewer | Declared persona | Complete attempt | Final method / crew | All-attempt choices | Report |
| --- | --- | --- | --- | --- | --- |
| player01 | 신중한 문자주의 입문자 | [attempt02](player01/attempt02/player01-trace.json) | core_transfer / solo | 102 | [review](player01/report.md) · [raw findings](player01/findings.json) |
| player02 | 공감하는 구조자 | [attempt02](player02/attempt02/player02-trace.json) | core_transfer / minji, kangwoo | 186 | [review](player02/report.md) · [raw findings](player02/findings.json) |
| player03 | 구두쇠 현실주의자 | [attempt02](player03/attempt02/player03-trace.json) | core_transfer / solo | 117 | [review](player03/report.md) · [raw findings](player03/findings.json) |
| player04 | 성급한 행동파 | [attempt01](player04/attempt01/player04-trace.json) | core_transfer / solo | 57 | [review](player04/report.md) · [raw findings](player04/findings.json) |
| player05 | 의심 많은 증거 조사자 | [attempt01](player05/attempt01/player05-trace.json) | core_sleep / minji | 73 | [review](player05/report.md) · [raw findings](player05/findings.json) |
| player06 | 정비공 동행 기술 애호가 | [attempt02](player06/attempt02/player06-trace.json) | core_transfer / minji | 138 | [review](player06/report.md) · [raw findings](player06/findings.json) |
| player07 | 공연과 사람 이야기를 찾는 여행자 | [attempt02](player07/attempt02/player07-trace.json) | core_transfer / parkss, eunsu | 177 | [review](player07/report.md) · [raw findings](player07/findings.json) |
| player08 | 치료와 휴식을 우선하는 보호자 | [attempt02](player08/attempt02/player08-trace.json) | core_transfer / parkss | 136 | [review](player08/report.md) · [raw findings](player08/findings.json) |
| player09 | 군인과 동행하는 경계형 생존자 | [attempt01](player09/attempt01/player09-trace.json) | core_sleep / kangwoo | 71 | [review](player09/report.md) · [raw findings](player09/findings.json) |
| player10 | 통신과 기록을 파고드는 기술자 | [attempt02](player10/attempt02/player10-trace.json) | core_transfer / eunsu | 164 | [review](player10/report.md) · [raw findings](player10/findings.json) |
| player11 | 권리와 합의를 따지는 법률가 | [attempt01](player11/attempt01/player11-trace.json) | core_transfer / jaeyi | 71 | [review](player11/report.md) · [raw findings](player11/findings.json) |
| player12 | 동물과 가족을 우선하는 보호자 | [attempt01](player12/attempt01/player12-trace.json) | core_transfer / minji | 78 | [review](player12/report.md) · [raw findings](player12/findings.json) |
| player13 | 혼자 가는 비폭력주의자 | [attempt01](player13/attempt01/player13-trace.json) | core_transfer / solo | 60 | [review](player13/report.md) · [raw findings](player13/findings.json) |
| player14 | 밤길을 마다하지 않는 야행성 여행자 | [attempt01](player14/attempt01/player14-trace.json) | core_transfer / solo | 67 | [review](player14/report.md) · [raw findings](player14/findings.json) |
| player15 | 불길한 징조를 피하는 미신적 여행자 | [attempt01](player15/attempt01/player15-trace.json) | core_transfer / solo | 60 | [review](player15/report.md) · [raw findings](player15/findings.json) |
| player16 | 마을 일손을 돕는 공동체주의자 | [attempt01](player16/attempt01/player16-trace.json) | core_transfer / solo | 59 | [review](player16/report.md) · [raw findings](player16/findings.json) |
| player17 | 손익을 따지는 장터 상인 | [attempt02](player17/attempt02/player17-trace.json) | core_transfer / solo | 116 | [review](player17/report.md) · [raw findings](player17/findings.json) |
| player18 | 약속 시간을 지키는 배달꾼 | [attempt02](player18/attempt02/player18-trace.json) | core_transfer / solo | 134 | [review](player18/report.md) · [raw findings](player18/findings.json) |
| player19 | 씨앗과 물을 아끼는 생태 여행자 | [attempt01](player19/attempt01/player19-trace.json) | core_transfer / solo | 57 | [review](player19/report.md) · [raw findings](player19/findings.json) |
| player20 | 동해안 풍경을 찾는 탐험가 | [attempt02](player20/attempt02/player20-trace.json) | core_transfer / solo | 130 | [review](player20/report.md) · [raw findings](player20/findings.json) |
| player21 | 서쪽 생활 문화를 찾는 탐험가 | [attempt02](player21/attempt02/player21-trace.json) | core_transfer / solo | 120 | [review](player21/report.md) · [raw findings](player21/findings.json) |
| player22 | 능선의 짧은 길을 택하는 등산가 | [attempt01](player22/attempt01/player22-trace.json) | core_transfer / solo | 56 | [review](player22/report.md) · [raw findings](player22/findings.json) |
| player23 | 먹거리와 장터를 찾는 생활 여행자 | [attempt01](player23/attempt01/player23-trace.json) | core_transfer / solo | 59 | [review](player23/report.md) · [raw findings](player23/findings.json) |
| player24 | 가족을 찾는 데 집중하는 자녀 | [attempt01](player24/attempt01/player24-trace.json) | core_transfer / solo | 56 | [review](player24/report.md) · [raw findings](player24/findings.json) |
| player25 | 기계 지배에 반발하는 자율주의자 | [attempt01](player25/attempt01/player25-trace.json) | core_transfer / minji | 65 | [review](player25/report.md) · [raw findings](player25/findings.json) |
| player26 | 기술을 남기되 책임지려는 안전 관리자 | [attempt02](player26/attempt02/player26-trace.json) | core_sleep / minji, kangwoo | 217 | [review](player26/report.md) · [raw findings](player26/findings.json) |
| player27 | 판단을 유보하는 신중한 중립자 | [attempt01](player27/attempt01/player27-trace.json) | core_sleep / solo | 57 | [review](player27/report.md) · [raw findings](player27/findings.json) |
| player28 | 작은 약속부터 마무리하는 완성주의자 | [attempt01](player28/attempt01/player28-trace.json) | core_transfer / minji | 68 | [review](player28/report.md) · [raw findings](player28/findings.json) |
| player29 | 저장과 선택의 일관성을 따지는 기록자 | [attempt01](player29/attempt01/player29-trace.json) | core_transfer / solo | 60 | [review](player29/report.md) · [raw findings](player29/findings.json) |
| player30 | 조용히 자연을 살피는 내향적 독행자 | [attempt01](player30/attempt01/player30-trace.json) | core_sleep / solo | 61 | [review](player30/report.md) · [raw findings](player30/findings.json) |

## Methodological disclosures

- Root initially documented incorrect pack IDs tool/food/water. Correct current IDs are fuel/repair/provisions. Player02/03 attempt01 are preserved diagnostics; they were asked to replay changing only pack, keeping choose/decide identical.
- Player02/03 already inspected seen event source/unchosen branches after their initially completed runs before root requested the pack-corrected replay. Preserve that timing and do not call their follow-up fully blind.
- Player01 encountered adjacent unseen source only after all play/review; no subsequent run. Root will distinguish this from pre-run outcome exposure.
- Game source, observer logic, HTML, actual save and Studio controls remain untouched. Brief/QA metadata correction is not a gameplay fix.
- Additional duplicate evidence: player09/P09-02 corroborates R5-07 mood caps; player09/P09-03, player11/P11-F01 and player13/P13-03 corroborate R5-05 clear-weather rain; player08/P08-02 repeats the non-confirmed early-postman interpretation. Player13/P13-01 corroborates R5-09 plate canon, and its final-journal opinion repeats R5-03.
- Player06 and player08 correctly withdrew current-location northern-contact teleport claims after inspecting storyOrigin record provenance. Player10/P10-03 repeats that observer limitation, not a new geographic bug. A fatal result returned by the engine is not necessarily displayed: UI resolveChoice already returns early when S.ended.
- Root initially cautioned player06 that protagonist+one companion can legitimately be plural. Player10 supplied the full explicit other-person introduction, which supports the narrower R5-13 cardinality ruling. Player06's original withdrawal remains preserved, not silently rewritten.
- Player14/P14-03 repeats the sea-contact recognition/first-introduction ambiguity, not mountain's forced dispatch claim. Player15/P15-02 repeats the intentionally separated epilogue-clock limitation. Player14's fractional-fatigue opinion corroborates the formatting concern, not another resource calculation defect.
- The former R5-PRECISION hypothesis was promoted to R5-16 after independent natural evidence and execution of the actual pure formatter. This is generated-text proof, not a browser/screenshot/visual-QA claim. Player19/P19-01 further corroborates the existing weather group; seeds/garden were not acquired and remain untested.
- Player17's two candidates repeat weather and epilogue-clock cases. Player20/P20-01 independently confirms R5-02 in supported completed attempt02 n140 and executed the actual parser; P20-02 and P21-01 corroborate R5-09 plate canon. P21-02 is included in R5-14 after root verified actual entry and UI cost projection. Player23/P23-01 independently corroborates that galbi cost at n165 scrap67→65; P23-O2 repeats the weather group.
- Player24/27/30 independently corroborate the weather group. Player28 supplies a supported-completion reproduction of R5-06 plus a separate combat-forecast opinion. Player29 corroborates R5-17; player30's camp interval legitimately includes03:00 and was retained as a negative control rather than another defect.
- Root corrected the collector, not the game: ordinary save-reload rows record result:true, while entry/paid replay rows record loaded:true. The initial collector wrongly required loaded for the ordinary row; actual before/after snapshots match. Raw traces and the frozen observer were not edited; see collector-correction.json.
- The obsolete initial preparation IDs were a root briefing error. Player02/03 changed only the pack to repair; their choose/decide code stayed identical. Because they had inspected seen event definitions after their original completed run, their corrected reruns are non-blind controlled replays. No claim is made that all thirty were perfectly blind.
- Required project instructions themselves contain some game facts. Post-play exact-event checks sometimes included adjacent unplayed definitions; each reviewer records that timing and any later retry. Root did not use those definitions to write or coach hidden-outcome choices.
- Source/main/navigation projections do not prove the actual notebook UI shows the same text. A headless fatal result paragraph may be suppressed by the real UI. StoryOrigin records and epilogue provenance omitted by the observer are not geographic or time-cost bugs by themselves.
- Browser/mobile rendering, control discovery, focus, clipping, canvas/scene continuity, actual voices/music, real save refresh and human experience remain unverified. No all-bugs-found, release-ready or human preference claim follows from this audit.

## Evidence / integrity

- [Declared roster](roster.json), [actual task confirmations](agents.json), [shared brief](BRIEF.md).
- [All attempts, source hashes and raw reports](collected.json), [completion/integrity validation](validation.json).
- [Collector schema correction](collector-correction.json): an audit-tool false warning, not a game restore failure.
- [Before fingerprint](freeze-before.json), [after fingerprint](freeze-after.json).
- [Successful initial actual-preview state](live-entry-summary.json); the separately retained live-before.json is a failed capture, not a successful scene snapshot. [Final read-only live request](live-after.json) and [comparison/status](live-after-summary.json) record whether the scoped endpoint remained available; state text is never screenshot evidence.

## Next verification gate

Do not launch another identical thirty-policy batch as the only acceptance test. Repair the confirmed owners in bounded groups, preserve paid historical receipts, add exact branch/fatal-boundary regressions, and replay these retained policies. Then verify the affected scenes and first-session navigation in the actual mobile-sized Studio preview, including an independently earned preservation ending. Any UI redesign still needs the separate approved design-draft workflow.
