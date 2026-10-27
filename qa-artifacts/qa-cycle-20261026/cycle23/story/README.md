# Cycle 23 — Story

Seed **283003**, fresh attempt01 하나로 **core_transfer** 본편 엔딩에 도달했다. DAY 9 23:29, 누적 695km. 민지·재이·은수를 공개 영입하고 후미 좌석을 정상 구매했다. 식량 20, 물 26, 연료 48.23L가 남았다. 사망·정책 중단·재시도는 없다.

엔진 `8cb29d99d11f89115ad974f7021b59d8373f85f8a7cf37fdbca18102fb9730f3`의 시작/실행 끝/전편 리뷰 끝 **40개 source 파일 모두 일치**한다. [종료 검증](source-review-close-verification.json). 생산 소스와 실사용자 저장은 수정하지 않았다.

## 실제 검토 범위

- 선택 95개, raw trace 474개 **기록**. 정책 행동 결정 126개와 주행 출발 19개를 별도로 기록했다. 474를 클릭/공개 행동 수로 세지 않는다.
- 실제 reader로 생성된 95 entry/result 전편 34,566자, 노트 100개, UI.speak 83개, 보조행동 35개, NPC 첫인사/소문 8화면을 읽었다. [전편](agent03/attempt01/prose-reader.txt), [짧은 말](agent03/attempt01/speech-reader.txt), [노트](agent03/attempt01/notes-reader.txt), [보조행동](agent03/attempt01/extras-readable.txt).
- 진입 복원 95/95, 지급 결과 복원 95/95. 상태와 실제 reader가 같으며 재지급 0. 정상 pre-reader export 95개 보존. [검사](agent03/attempt01/reload-audit.json).
- 기존 story 원정의 entry/선택/result 전체 tuple과 같은 것은 83개, 다른 것은 12개다. 결과문 자체는 87개 동일/8개 다름. 동일 본문도 이번 전체 상태와 다시 대조했다. 이 수치는 모든 agent의 신규 선택 집계와 다르다.
- 앞선 세 agent 전체 보존 원정의 853개 선택쌍 대비 **새 정적 선택쌍은 `exp_bowling:0` 1개**. runner 내부 `novelPairs:14`는 오래된 참조 범위이므로 신규 범위 주장에 쓰지 않는다. [대조](coverage-comparison.json).
- D.scenes 실제 token과 build override로 찾은 **87개 scene key / 고유 파일 86개**를 6개 contact sheet로 모두 열람했다. 의심 원본 3개를 확대했다. [파일별 판정](visual-audit/review-ledger.json). 이번 담당은 브라우저 crop·터치·오디오 QA를 하지 않았다.

## 발견과 미결

새 대사·인과·화자 확정 오류 **0**. 예측을 명령과 구분한 부모의 원칙, 검증키 회수, 은수 저장 좌표 소각→후속 합류, 재이의 인계 반대/유대 감소, 실제 3곳의 연대망 응답과 최종 인계, 미배달 남산 편지의 엔딩 회수까지 전편을 대조했다. 첫 소개 전 민지 `???`, 익명 경주 주민 표시는 다른 인물 오배정으로 세지 않았다.

그림 문맥 불일치 **2개**는 root가 전용 그림 제작을 승인했다. 둘 다 `event-explore-leisure.webp`의 포스터·창구·벤치 로비를 사용한다. 22차 오락실과 같은 공용컷 원인이지만 아래 두 사건은 이번의 새로운 문맥 관측이다.

| ID | 정상 관측 | 불일치 | pre-reader 원본 |
|---|---|---|---|
| V23-S01 | n102 `exp_bowling`, 2층 볼링장·수동 3게임 | 레인/핀/공이 없는 로비 | [normal-unpaid-100](agent03/attempt01/normal-unpaid-100-exp_bowling.json) |
| V23-S02 | n282 `ev_wedding_hall_storage`, 예식장·방명록 | 조화/연회장/주방 대신 같은 로비 | [normal-unpaid-280](agent03/attempt01/normal-unpaid-280-ev_wedding_hall_storage.json) |

시간별 그림 **후보 2개**는 생성·소스 변경 없이 분리했다. n261 `story_generation_speech`는 D6 22:47 폭풍인데 밝은 주광 시장 컷, n415 `talk_es_07`은 D9 19:50 비인데 창밖이 낮인 은수 대화 컷이다. 게임의 밤 경계는 19:30. 두 사건에 시간 gate가 없고 실제 선택된 키도 기록했다. 본문은 시각 중립적이므로 본문 오류로 세지 않는다. 적절한 기존 밤 컷이나 시간 중립 컷의 재사용 가능성은 root가 판정한다. [원본·시각·source 근거](findings.json).

`lc_busan_dried`, `cleaners_recall`, `seoul_base`, `seoul_square`의 22차 그림 문제/명료성은 여전히 **known pending**이다. 22차의 18개 새 그림과 Leo 재사용 제안은 연결되지 않았다. 제안 VM의 224/224를 23차 production 검증으로 세지 않는다.

## 정책·자원·공백

밀양→양산은 민지의 울산 임무 경유, 무주→김천→무주는 재이의 공개 회수 임무 1회 왕복이었다. 갈증이나 연료 구제, 책 터널 반복, 보급 목적지 교대 반복은 없었다. 이번 정책의 지속 보급 목표 자체는 생성되지 않았으므로 그 방어 분기를 자연 검증했다고 주장하지 않는다. [정책 검토](policy-review.json).

캠프 8회/동료 캠프 대화 7회/일반 대화 12회, 현장 작업 7회(대전 숨은 배포 카드 포함), 퍼크 6개, 거래 48회, 좌석 확장, NPC 소문, 서쪽 호송 3선택과 본편 인계를 사용했다. 짧은 대화 완성 시퀀스 5개에서 동일 날짜 같은 chat의 중복은 0이며, 손씻기 대화의 DAY4→DAY8 재등장은 허용된 다음날 반복이다. [chat 대조](agent03/attempt01/chat-audit.json).

최신 23차 수선의 7개 사건(`loc_tunnelbook`, `ev_parkss_past`, `ev_atm_cash`, `comp_snore`, `talk_es_01`, `npc_deokgu_2`, `exp_oilmill`)은 자연 재노출되지 않았다. 별도 수선 회귀 통과와 자연 검증을 섞지 않는다. 과거 운전 문구 수선은 예비 공구/이름 기록/번호표/맡긴 열쇠 콜백, 손씻기와 검증키 대화, 좌석 정비 회상에서 자연 확인했다. 보리 생활, 사진 촬영, 새 숨은 장소 도달과 다른 두 코어 결말은 이번 범위 밖이다.
