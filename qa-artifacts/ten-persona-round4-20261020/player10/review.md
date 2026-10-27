# 실제 선택 전수 독해 기록

원본 `attempt01/player10-trace.json`의 choice68개를 순서대로 읽었다. `read-choices.cjs 1 8`부터9–16,17–24,25–32,33–40,41–48,49–56,57–62,63–68 순서로 출력했다. 각 출력은 진입·전체 옵션·선택·전체 결과·칩·전후 시간/자원/명단을 포함한다. 생략이나 텍스트 중복 제거는 없었다. 아래 기록은 독해 판정이며 원문 대체가 아니다.

| 순번 / trace | 사건 | 실제 선택 | 연결 검토 |
|---|---|---|---|
| 1 / 3 | opening_workshop | 바로 부두로 | 수리 호출→5분 이동 준비 |
| 2 / 6 | opening_bus_repair | 남은 호스 우회 | 여러 차례 조임과55분 일치 |
| 3 / 9 | opening_name_introduction | 이름을 말함 | 상혁 확인, 비용 없음 |
| 4 / 12 | opening_failed_appeal | 거절·표 복사 | 원본 돌려주고 사본만 보관 |
| 5 / 15 | opening_parents_module | 배선 번호 | 모듈은 계기판에 남음 |
| 6 / 18 | opening_departure | 열쇠 챙김 | 귀환 날짜 미정, 목에 건 열쇠 |
| 7 / 21 | opening_farewell | 길로 | 먼저 떠난 사람을 찾는 약속 |
| 8 / 25 | cell_sea_meet | 추적 회피 질문 | 표식·연락 순서; 기존X의 소개로 해석 |
| 9 / 30 | meet_postman | 명단 맞춤 | 정착지3개 표현의 중복 의견 후보 |
| 10 / 34 | onboarding_first_road | 단말 통째로 | 저장 모듈과 반복 규칙 확보 |
| 11 / 38 | exp_radioshop | 부품 수확 | 부품/고철 증분 일치, 은수 비활성 |
| 12 / 43 | memory_busan_terminal | 약속 지킨다고 | 과거 터미널→현재 북행 복귀 |
| 13 / 48 | meet_scrapyard | 소리로 아느냐 | 민지 소개·울산 부탁으로 연결 |
| 14 / 51 | rq_minji_request | 동행 어렵다 | 거절 후 민지 잔류, 모집 약속 없음 |
| 15 / 55 | exp_kimchi | 창고 열기 | 실패 냄새20분, 보상 없음 |
| 16 / 61 | story_bridge_departure_echo | 이름 받아 적음 | 다음 날 명단, 피로1 |
| 17 / 66 | kw_recruit | 같이 가자 | 후임·감시 장치 정리 조건 제시 |
| 18 / 70 | rq_kangwoo_task | 후임 지시 |6시간 교대·후임 능력·장치 하차 |
| 19 / 74 | cell_dome_meet | 용건 | 강우 정식합류 전 동행 상태 분기 |
| 20 / 79 | story_bridge_trace_gap | 빈 확인란 | 승인 시각의 어긋남,15분 |
| 21 / 86 | rq_kangwoo_join | 군장 자리 | 순찰 약속 후 실제 accept88에서 합류 |
| 22 / 92 | ev_broadcast_station | 테이프 재생 | 세대별 반복 방송,40분 |
| 23 / 96 | talk_kw_06 | 진지하게 질문 | 표정 연습, 강우만 반응 |
| 24 / 101 | levy_office |15고철 지불 | 가짜 등록의 비용·사기 하락 |
| 25 / 105 | route_mid_fork | 동쪽 | 청주까지 노선 고정 안내 확인 |
| 26 / 110 | parents_diversion_manifest | 거부 불가 이유 | 보호 경로 회수 협박의 인과 |
| 27 / 115 | salvage_claim |10고철 지불 | 허가3일, 실제 시간1시간 |
| 28 / 119 | route_ridge_rescue | 역할 분담 |4명 구조 시작,10분 |
| 29 / 122 | route_ridge_anchor | 발판 계단 |3명 올라옴,25분·피로 |
| 30 / 125 | route_ridge_extract | 릴레이 | 마지막 사람·내용물 보존, 수레 포기 |
| 31 / 129 | exp_brewery | 항아리 | 식초, 식량1/고철4 |
| 32 / 135 | story_bridge_watched | 화면 기록 | 계기판 속 장치 인식,20분 |
| 33 / 139 | loc_mungyeong | 한 줄 | 귀환 때 답을 볼 계획, 현재 완수 아님 |
| 34 / 145 | parents_separated_work | 아빠 정비 표시 | 두 곳의 자료 교환, 다음 분리 절차 |
| 35 / 149 | crisis_nofuel | 걸어서 |7시간 연료9, 실제 식사 변화 포함 |
| 36 / 153 | perimeter_first | 지나감 | 경고탄 외판 손상6 |
| 37 / 158 | story_generation_form | 이름 읽기 | 노인 가족의 역사, 현재 미션 아님 |
| 38 / 165 | story_family_principle | 분류 화면 저장 | 사유·서명·이의제기 기록 |
| 39 / 169 | story_family_key | 사진·수첩만 | 검증키 미분리 유지 |
| 40 / 173 | story_personal_cache | 보관망 대조 | 묶음 번호→전달자 연결 |
| 41 / 176 | story_parent_route_shared | 원본·사본 분산 | 두 장 수령 뒤 실제 검증키1 |
| 42 / 181 | main_transfer_testimony | 정정·사본 | 세 사람 서명, 동승 약속으로 오인 안 함 |
| 43 / 186 | crisis_nofuel2 | 다시 걸음 |9시간·배급 부족 영향, 생존 복구 |
| 44 / 190 | story_generation_speech | 아이에게 방향 | 할머니=서울이라는 인물 해석 |
| 45 / 194 | crisis_hungry | 먹을 것 찾음 |2시간, 식량2, 허기2→1 |
| 46 / 199 | main_command_ledger | 원본 대조 | 천리안 명령 책임과 상위 목적 미상 분리 |
| 47 / 204 | story_bridge_parent_route | 표·모듈 보관 | 이미 안 두 경로를 인정, 다른 봉투 |
| 48 / 208 | crisis_nofuel3 | 견인20 |5시간·연료6, 공개 비용 확인 |
| 49 / 213 | history_failed_namsan | 살릴 것 기록 | 급수·진료와 강제 이송선 분리 |
| 50 / 216 | parents_father_last_log | 번호표 |17분 정비·죽음 확인, 이후 재회와 순서 유지 |
| 51 / 221 | story_bridge_child_voice | 끝까지 듣기 | 옛 녹음→현장 확인 안내 |
| 52 / 238 | history_parents_network | 최근 표식 | 엄마 현재 수원 위치 안내 |
| 53 / 241 | parents_mother_reunion | 엄마 부름 | 실제 재회 뒤 설명 장면 |
| 54 / 244 | parents_mother_truth | 외곽 송신 부탁 | 엄마는 차 밖 중계소에 남음 |
| 55 / 248 | talk_kw_17 | 수신호 암기 | 강우의 실제 대화·유대 반영 |
| 56 / 252 | main_relay_conference | 응답 기록 | 수락과 이후 갈등을 구분 |
| 57 / 257 | han_bridge | 관문으로 | 도로 위 발견, 서울 유료 진입과 분리 |
| 58 / 261 | seoul_open | 서울 진입 | 실제430km 도착 뒤 안내 |
| 59 / 265 | seoul_han | 묵례 | 편지 미보유 선택 비활성, 전달 완료 발명 없음 |
| 60 / 269 | seoul_ruins | 손님? | 은수 없음, 코어 앞 답변 예고 |
| 61 / 273 | seoul_square | 숫자1 질문 | 신도 해석과 외부 판단자 구분 |
| 62 / 277 | seoul_base | 차 세우기 | 미보유 봉투·교란장치 비활성 |
| 63 / 281 | seoul_core | 함께 온 사람 | 강우1명, 여섯명 선택 비활성 |
| 64 / 284 | seoul_costs | 기록 창구 확인 | 보존 반대 강우, 다른 처분의 값 명시 |
| 65 / 287 | seoul_decision | 집행권 인계 | 감시1/3 보존 비활성·준비 복귀 제어 확인 |
| 66 / 290 | seoul_night | 결정 확인 | 열쇠·강우·중계소 엄마의 후일담 |
| 67 / 293 | seoul_uplink_reveal | 상행선 끊음 | 생활 설비 유지·별도 단말 응답 |
| 68 / 296 | seoul_session_reset | 달구지 귀환 | 하진에게 선택권, 엄마와 재회, SESSION1END |

모든 choice는 선택 당시 visible/enabled였다. unpaid68·paid68·일반reload1의 관측 스냅샷 비교는 모두 같았다. paid replay68건 전부 applied=false다. 이는 미래 RNG나 실제 화면 검수가 아니다.
