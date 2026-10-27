# 11차 survival 실제 발생 장면 목록

각 ID는 현재 UI resolver가 반환한 실제 사건 후보/명시 컷이다. 브라우저에서 실제 표시된 프레임·크롭은 검증하지 않았다. 한 사건의 여러 후보가 모두 표시됐다는 의미가 아니다. 전체 기대 본문/결과/날씨/시간/실제 동료는 scene-evidence.json에 있다.

| 장면 ID | 실제 사건·trace | 기대 내용 |
|---|---|---|
| intro-busan-workday-v1 | opening_workshop #3 | 냉동차 호스를 갈고 나니 밥이 식어 있었다. 할아버지가 떠난 뒤로 감천 작업장의 수리는 혼자 맡았다. |
| opening-bus-heater-v1 | opening_bus_repair #6 | 하진은 맨 뒤 버스에서 열이 난 유나를 안고 있었다. 여덟 살 도윤이 공구함을 보고 다가와 소매를 붙잡았다. |
| intro-dock-aid | opening_bus_repair #6, opening_name_introduction #9, opening_failed_appeal #12 | 하진은 맨 뒤 버스에서 열이 난 유나를 안고 있었다. 여덟 살 도윤이 공구함을 보고 다가와 소매를 붙잡았다. |
| intro-appeal-denied | opening_failed_appeal #12 | 공구를 하나씩 공구함에 넣는 동안, 버스 안 공기가 조금씩 데워졌다. |
| intro-family-packing-v1 | opening_failed_appeal #12 | 공구를 하나씩 공구함에 넣는 동안, 버스 안 공기가 조금씩 데워졌다. |
| intro-dashboard-module | opening_parents_module #15 | 작업장으로 돌아와 엄마의 철제 상자를 열었다. 수첩 등판에서 회로도가 떨어졌다. 남산 현장 확인 포트, 달구지 계기판. 엄마가 설계하고 아빠가 만든 인간 확인 검증키의 배선이었다. 명령을 실행하기 전에 사람의 승인을 받게 하는 장치다. |
| intro-workshop-departure | opening_departure #18 | 계기판 덮개를 닫고 작업장 안을 마지막으로 둘러봤다. |
| intro-departure-conversation-v4 | opening_farewell #21 | 남산에 가면 우리도 집에 돌아갈 수 있어요? |
| intro-departure-start-v1 | opening_farewell #21 | 남산에 가면 우리도 집에 돌아갈 수 있어요? |
| event-meet-trader | lc_busan_dried #25, lc_damyang_juktong #76, lc_suwon_galbi #701 | 리어카 가득 건어물을 실은 아지매가 손을 흔든다. |
| event-road-coffee-van-v2 | ev_truck_cafe #30 | 개조한 트럭 옆구리를 열어 만든 이동식 카페. 손수 볶은 원두 냄새가 도로까지 퍼진다. |
| onboarding-first-road-scan-v1 | onboarding_first_road #34 | 부산을 벗어난 첫 고가도로 아래에서 죽어 있던 검문 스캐너가 켜졌다. 얇은 붉은 선이 달구지 앞유리를 훑고, 녹슨 단말이 종이띠를 토해 냈다. |
| event-explore-water | exp_reservoir #38 | 농업용 저수조에 빗물이 그득하다. |
| event-postman-solo-v2 | meet_postman #43 | 짐받이에 방수포 꾸러미를 실은 자전거가 마주 온다. 남자의 조끼에 손바느질로 수놓은 글자. |
| event-explore-leisure | exp_arcade #48 | 간판 절반이 떨어진 오락실. 「크… 게임랜드」. |
| event-crisis-animal | camp_dogs #52 | 낮게 으르렁거리는 소리에 잠이 깼다. |
| memory-busan-terminal-v1 | memory_busan_terminal #57 | 길가의 폐환승소에서 도착 안내판 불이 한 칸씩 꺼졌다. 그 불빛을 보자 부산 터미널에서 부모님의 다음 차를 기다리던 밤이 떠올랐다. |
| postman-letter | postman_again #61 | 자전거 방울 소리. 그 우편부다. |
| event-find-broadcast-station-v1 | ev_broadcast_station #66 | 무너진 지역 방송국. 스튜디오 안엔 마이크와 카메라가 그대로. |
| event-meet-roadside | salvage_claim #71 | 무너진 창고 앞에 트럭 두 대가 서 있다. 안에서 쇠 긁는 소리가 난다. |
| story-bridge-departure-echo-v1 | story_bridge_departure_echo #81 | 꺼 둔 줄 알았던 수신기가 혼자 켜졌다. 잡음 사이로 부산 항만 방송이 들렸다. 내일 새벽 동부 노선 이송자 명단. 도윤 가족 아래로 처음 보는 이름이 열일곱 줄 더 내려갔다. 부산을 빠져나오면 끝날 거라고 믿은 사람은 없었다. 그래도 다음 종이가 벌써 나올 줄은 몰랐다. |
| recruit-leo-daein-market-v2 | meet_hitchhiker #91 | 광주 대인시장 평상 모닥불. 기타 케이스를 멘 남자가 장사를 마친 사람들에게 낮은 목소리로 노래한다. 발치에는 붉은 스카프를 맨 개 한 마리. |
| recruit-leo-meet-action | meet_hitchhiker #91 | 광주 대인시장 평상 모닥불. 기타 케이스를 멘 남자가 장사를 마친 사람들에게 낮은 목소리로 노래한다. 발치에는 붉은 스카프를 맨 개 한 마리. |
| gwangju-market | cell_sotgot_meet #97 | 광주 대인시장 국밥집. 금자 이모가 커다란 솥에 국물을 붓다가 우리를 보고 국자를 흔든다. |
| story-bridge-trace-gap-v1 | story_bridge_trace_gap #102 | 폐쇄된 요금소 제어실에서 기록지가 아직도 조금씩 밀려 나오고 있었다. 자동 명령 발행 03:12. 버스 출발 03:16. 사람 확인 03:23. 확인자 칸은 비어 있었다. 버스가 떠난 뒤에야 사람이 승인한 셈이었다. |
| event-meet-guard | levy_office #108, water_toll #430 | 길목에 천막이 서 있다. 「임시 차량 행정소」. 손글씨인데 관공서 서체를 흉내 냈다. |
| recruit-leo-task-wade | rq_leo_task #113 | 입구에 도착하자 보리가 아이 목소리를 쫓아 계단 아래로 뛰었다. 난간을 넘는 순간 물에 빠졌다. |
| recruit-leo-rescue-choice-v1 | rq_leo_task #113 | 입구에 도착하자 보리가 아이 목소리를 쫓아 계단 아래로 뛰었다. 난간을 넘는 순간 물에 빠졌다. |
| comp-talk-leo-camp-v1 | camp_2_leo #117, talk_leo_18 #134, camp_3_leo #166, talk_leo_14 #202, camp_5_leo #237, talk_leo_02 #245, camp_7_leo #291, camp_9_leo #342, talk_leo_08 #347, talk_leo_04 #371, camp_11_leo #393, camp_14_leo #504, talk_leo_06 #509, camp_16_leo #613, talk_leo_10 #618 | 말도 안 맞던 합창 한 소절을 레오가 자꾸 웃으며 흥얼거린다. |
| story-bridge-watched-v1 | story_bridge_watched #123 | 전조등이 폐쇄 검문소를 훑자 감시 카메라 세 대가 동시에 돌아왔다. 렌즈가 운전석 쪽으로 기울었다. 꺼진 안내판에 짧은 문장이 떴다. 「검증 장치 운송체 확인」 계기판 안에 숨겨 두고 출발한 장치였다. 안내판을 다시 읽는 동안, 막혀 있던 앞길의 신호가 하나씩 초록으로 바뀌었다. |
| recruit-leo-join-decision | rq_leo_join #128 | 레오는 닫힌 기타 케이스의 손잡이를 쥔다. 들고 내리지는 않는다. |
| recruit-leo-join | rq_leo_join #128 | 레오는 닫힌 기타 케이스의 손잡이를 쥔다. 들고 내리지는 않는다. |
| arrival-geochang | cell_mountain_meet #139 | 산길 중턱. 나무 사이에서 사람 그림자들이 소리 없이 나타났다. 사냥꾼 차림, 무기는 활. 총이 아니라. |
| story-generation-form | story_generation_form #144 | 폐쇄된 면사무소 처마 밑에 사람들이 모여 있다. 벽에는 출생표와 사망표 사이로 이송표 세 장이 붙어 있다. 노인 하나가 그 옆에 앉아 있다. |
| recruit-jaeyi-meet-action | jy_recruit #149 | 무주 터널 촛불 교환대. 고물을 산처럼 실은 리어카 한 대가 벽을 차지하고 있다. 주인은 스무 살쯤의 아이. 물건마다 교환값을 붙이다가, 빈 선반 한 칸 앞에서 손을 멈춘다. |
| recruit-jaeyi-tunnel-exchange-v2 | jy_recruit #149 | 무주 터널 촛불 교환대. 고물을 산처럼 실은 리어카 한 대가 벽을 차지하고 있다. 주인은 스무 살쯤의 아이. 물건마다 교환값을 붙이다가, 빈 선반 한 칸 앞에서 손을 멈춘다. |
| recruit-jaeyi-suspension-check | jy_recruit #149 | 무주 터널 촛불 교환대. 고물을 산처럼 실은 리어카 한 대가 벽을 차지하고 있다. 주인은 스무 살쯤의 아이. 물건마다 교환값을 붙이다가, 빈 선반 한 칸 앞에서 손을 멈춘다. |
| event-explore-retail | exp_mart #156, exp_outdoor #500, lc_daejeon_bakery #533 | 중형 마트. 입구 유리는 깨진 지 오래고, 안쪽은 어둡다. |
| event-explore-civic | near_muju_firefly #160 | 무주 계곡길. 헤드라이트를 끄자— |
| comp-talk-leo-road-v1 | talk_leo_19 #171, talk_leo_07 #272, talk_leo_13 #323, talk_leo_03 #398, talk_leo_15 #558, talk_leo_01 #654 | 모닥불 앞에서 레오가 낮게 콧노래를 흥얼거린다. 처음 듣는 옛 노래다. |
| parents-diversion-record-v2 | parents_diversion_manifest #177 | 남쪽 환승소의 운행표와 분류 기록을 나란히 펼쳤다. 두 기록에 적힌 부모님의 이송 번호부터 맞춰 보았다. 부모님의 다음 차는 실제로 있었지만 부산으로 출발하지 않았다. 두 사람은 탑승 직전 따로 분류됐다. 아빠는 남산 기술 유지선으로, 엄마는 중부 이송 기록 정리소로 보내졌다. 그날 터미널에서 아무리 기다려도 같은 버스가 올 수 없었던 이유가 기록에 남아 있었다. |
| route-mid-fork | route_mid_fork #181 | 김천 북쪽 교차로에서 차를 세웠다. 넘어진 표지판 두 장을 씻어 세우니 갈 길이 선명해졌다. |
| recruit-jaeyi-box-recovered-v2 | rq_jaeyi_task #185 | 재활용 창고 지붕이 안쪽으로 주저앉았다. 멀쩡한 배터리와 구리선이 발에 채이지만 재이는 보지도 않는다. |
| recruit-jaeyi-trapped-box-v1 | rq_jaeyi_task #185 | 재활용 창고 지붕이 안쪽으로 주저앉았다. 멀쩡한 배터리와 구리선이 발에 채이지만 재이는 보지도 않는다. |
| event-vista-road | lc_yeongdong_wine #189, story_bridge_last_quiet #713 | 폐 철도 터널을 개조한 와인 저장고. 서늘한 어둠 속에 술통들이 잠들어 있다. |
| event-crisis-fuel | crisis_nofuel #193, crisis_nofuel2 #233, crisis_nofuel3 #260, crisis_nofuel3 #287, crisis_nofuel3 #314, crisis_nofuel3 #338, crisis_nofuel3 #362, crisis_nofuel3 #384, crisis_nofuel3 #407, crisis_nofuel3 #434, crisis_nofuel3 #645 | 김천 갈림길에 차를 세워 둔 채 연료통을 확인했다. 남은 양으로는 다음 길을 안심하고 나설 수 없다. |
| comp-talk-jaeyi-camp-v1 | camp_4_jaeyi #197, talk_jy_14 #249, camp_6_jaeyi #264, talk_jy_12 #303, camp_8_jaeyi #318, camp_10_jaeyi #366, camp_12_jaeyi #411, talk_jy_02 #513, camp_15_jaeyi #550, talk_jy_08 #562, talk_jy_18 #622 | 망가진 부품 한 개 대신 가족 사진은 모두 제 모양으로 나왔다. |
| parents-linked-records-v2 | parents_separated_work #207, main_transfer_testimony #570, main_command_ledger #631 | 아빠의 남산 정비 기록과 엄마의 중부 기록 묶음에는 같은 번호가 반복됐다. 아빠는 의료·급수·교통선을 살린 채 강제 이송선만 떼어 내는 순서를 적었다. 엄마는 기록소에서 사라질 뻔한 이송 사유와 당사자 증언을 몰래 모았다. 두 사람은 서로 다른 곳에 갇힌 뒤에도 화물 묶음 번호로 자료를 주고받고 있었다. |
| route-market-convoy | route_market_convoy #211, route_market_mask #214, route_market_pass #217 | 무주 장터를 지나려는데 손수레 다섯 대가 같은 자리에 묶여 있었다. 씨앗, 소금, 붕대, 편지. 북쪽 마을 셋이 함께 보낸 짐이다. |
| recruit-jaeyi-join | rq_jaeyi_join #221 | 재이는 가족 상자를 다시 풀지 않는다. 대신 한 구간 동안 임시로 묶어 둔 끈을 풀어, 달구지 고정 레일에 맞게 길이를 잰다. 레일 한 칸의 폭을 장부 귀퉁이에 적는다. |
| recruit-jaeyi-join-decision | rq_jaeyi_join #221 | 재이는 가족 상자를 다시 풀지 않는다. 대신 한 구간 동안 임시로 묶어 둔 끈을 풀어, 달구지 고정 레일에 맞게 길이를 잰다. 레일 한 칸의 폭을 장부 귀퉁이에 적는다. |
| comp-talk-jaeyi-road-v1 | talk_jy_01 #227, talk_jy_19 #276, talk_jy_07 #327, talk_jy_15 #351, talk_jy_03 #375, talk_jy_13 #402, talkr_jy_3 #420, camp_13_jaeyi #467, talk_jy_05 #479, talkr_jy_1 #658 | "이거 얼마짜리게요?" 재이가 길에서 주운 녹슨 문고리를 내밀었다. "아, 힌트 없어요. 힌트 있으면 재미없으니까." |
| event-crisis-exhaustion | crisis_hungry #241, crisis_hungry #268, crisis_drowsy #388, crisis_collapse #438 | 끼니를 거른 탓에 속이 쓰리다. 식량통을 다시 열어 봤다. |
| intro-parents-discovery | story_family_principle #255 | 폐휴게소 보관망에서 오래된 영상 한 조각이 살아났다. 정식 발표 영상이 아니었다. 발표 전날, 아빠가 카메라를 들고 엄마의 예상 질문을 받아 주던 연습 기록이었다. |
| story-family-principle-review-v1 | story_family_principle #255 | 폐휴게소 보관망에서 오래된 영상 한 조각이 살아났다. 정식 발표 영상이 아니었다. 발표 전날, 아빠가 카메라를 들고 엄마의 예상 질문을 받아 주던 연습 기록이었다. |
| family-verification-key | story_family_key #281 | 복원한 발표 연습 영상의 첨부 목록에 ‘검증키 분리 절차 4–5쪽’이 남아 있었다. 파일은 비어 있었고 마지막 전송지는 북부 연락소였다. |
| event-companion-van | up_bench_first #295 | 후미 좌석의 버클이 바닥으로 내려가 있었다. 공구 가방을 옮기고 안전벨트를 좌석 위로 꺼냈다. |
| muju-tunnel | talk_bori_03 #299, pair_leo_jy_2 #416 | 보리가 나를 보고 세 번 짖었다. 처음 있는 일이다. |
| story-personal-cache-v1 | story_personal_cache #309 | 폐버스 배차실 책상 밑에서 작은 철제 상자가 나왔다. 어린 시절 가방에 달았던 버스 열쇠고리도 들어 있었다. 그 아래에는 타 버린 발신 릴, 마지막 두 장이 뜯긴 분리 절차 수첩, 이송된 가족들의 증언 카드가 차례로 놓여 있었다. 부모님은 세 가지를 이미 한곳에 모으려 했고, 끝내 다 모으지 못했다. |
| story-generation-speech-stations-v1 | story_generation_speech #332 | 장터에서 아이 하나가 국밥 줄의 노인 소매를 잡는다. |
| story-generation-speech | story_generation_speech #332 | 장터에서 아이 하나가 국밥 줄의 노인 소매를 잡는다. |
| story-generation-theories-cast-v1 | story_generation_theories #357 | 폐교 교실 하나를 세 사람이 기록실로 쓰고 있었다. |
| event-ai-checkpoint | patrol_toll #380, patrol_toll #426, patrol_toll #538 | 톨게이트처럼 생긴 오래된 검문소가 안개 속에 걸려 있다. 불은 꺼졌는데 차단봉만 새것처럼 반듯하다. |
| pair-leo-jaeyi-plan-v2 | pair_leo_jy_1 #475 | "우리 정착지에서 공연해요!" 레오가 제안했다. "재이 씨는 수금 담당이요. 모자 돌리는 거." |
| pair-leo-jaeyi-performance-v1 | pair_leo_jy_1 #475 | "우리 정착지에서 공연해요!" 레오가 제안했다. "재이 씨는 수금 담당이요. 모자 돌리는 거." |
| event-road-food-truck-v2 | lc_jeonju_bibim #483 | 전주 외곽, 짐칸을 주방으로 개조한 트럭. |
| event-explore-farm | exp_glasshouse #487 | 유리 온실 단지. 대부분 깨졌는데 한 동만 멀쩡하다. |
| story-generation-route | story_generation_route #492 | 북쪽으로 갈수록 가드레일 아래 작은 물병이 늘어난다. 오래된 병뚜껑, 새로 구운 종지, 말라붙은 밥 한 술. 표지판에는 페인트 밑으로 「구 이송 7로」가 비친다. |
| combat-walker-watch-v1 | perimeter_first #496 | 도로 한복판에— 그것이 서 있다. |
| event-ai-surveillance | cleaners_recall #519 | 갓길에 흰 옷 넷이 서 있다. 정리자들. 그 앞에 낡은 승합차 한 대와, 차에서 내리지 않으려는 여자 하나. |
| recruit-eunsu-rooftop | es_recruit #525 | 대전 연구단지 옥상. 여자가 안테나를 돌리며 아래 화이트보드의 숫자와 수신기 파형을 번갈아 본다. 헤드폰은 목에 걸려 있다. |
| recruit-eunsu-sky-point | es_recruit #525 | 대전 연구단지 옥상. 여자가 안테나를 돌리며 아래 화이트보드의 숫자와 수신기 파형을 번갈아 본다. 헤드폰은 목에 걸려 있다. |
| daejeon-commune | cell_ghost_meet #529 | 폐 통신국. 안에 사람이 있는 것 같은데 보이지 않는다. 스피커에서만 목소리가 난다. |
| leo-broadcast-room-v1 | leo_broadcast #542 | 꺾인 송신탑 아래, 방송국 부조정실. |
| recruit-eunsu-task-breaker | rq_eunsu_task #546 | 능선 중계기의 푸른 표시등이 젖은 공기 속을 돈다. 은수의 수신기엔 근처 잔류자들의 좌표가 한 줄씩 쌓인다. |
| recruit-eunsu-task | rq_eunsu_task #546 | 능선 중계기의 푸른 표시등이 젖은 공기 속을 돈다. 은수의 수신기엔 근처 잔류자들의 좌표가 한 줄씩 쌓인다. |
| event-companion-meal | comp_food_debate #554 | 누가 시작했는지 모를 주제가 차를 달군다. |
| story-bridge-parent-route-v1 | story_parent_route_shared #566, story_bridge_parent_route #598 | 북부 연락소의 전달자 서진이 부모님 상자의 묶음 번호와 같은 봉투를 꺼냈다. 뜯겨 있던 마지막 두 장이었다. 한 장에는 강제 이송선만 분리하는 순서가, 다른 한 장에는 분리 뒤 반드시 사람에게 확인을 넘기라는 조건이 적혀 있었다. 부모님은 기계를 끄는 법이 아니라, 명령권을 사람에게 돌리는 법을 북쪽으로 보냈다. |
| history-failed-namsan-v1 | history_failed_namsan #575 | 오래전 한 무리가 남산 중계소를 폭파하려 했다. 강제 이송 명령은 잠시 멎었지만 같은 선을 쓰던 급수 펌프와 진료소 전력도 함께 꺼졌다. 사람들은 코어에 닿기도 전에 흩어졌다. 그 실패 뒤 저항 조직은 둘로 갈렸다. 천리안을 끊어야 한다는 쪽과, 사람에게 명령권을 돌려놓아야 한다는 쪽. |
| arrival-sejong | loc_sejong #579 | 세종. 완공 직후에 세상이 멈춘 행정도시. |
| recruit-eunsu-join-decision | rq_eunsu_join #583 | 은수는 수신기를 오래 듣는다. 좌표는 남아 있지만, 무엇을 하라는 승인음은 오지 않는다. |
| recruit-eunsu-join | rq_eunsu_join #583 | 은수는 수신기를 오래 듣는다. 좌표는 남아 있지만, 무엇을 하라는 승인음은 오지 않는다. |
| comp-talk-eunsu-road-v1 | talk_es_11 #589, talk_es_01 #662 | 폭풍. 은수가 헤드폰을 꼭 누르며 눈을 빛냈다. |
| event-explore-school | lc_sejong_library #593 | 세종의 거대한 국립도서관. 개관 예정일 현수막이 오랫동안 걸려 있다. |
| event-explore-shelter | exp_checkpoint #603 | 모래주머니와 바리케이드. 오래전 군이 마지막으로 버틴 흔적. |
| event-meet-family | story_bridge_child_voice #608 | 라디오가 주파수를 몇 번 건너뛰더니 어린아이의 목소리를 틀었다. 「엄마, 우리 어디 가?」 여덟 살 때 버스 승강장에서 했던 내 말이었다. 숨을 들이쉬는 버릇까지 그대로였다. 녹음이 끝나자 지금의 안내 음성이 이어졌다. 「동일 보호 대상 확인. 남산 현장 확인 대기」 |
| comp-talk-eunsu-camp-v1 | talk_es_04 #626, camp_17_eunsu #649 | "오늘의 관제 용어." 은수가 수업을 열었다. 은수식 스몰토크다. |
| arrival-pyeongtaek | story_bridge_crew_question #636 | 정차한 달구지에서 증거 봉투를 다시 펼쳤다. 부모님의 경로는 둘로 갈라졌고, 남산은 나를 기다리고 있었다. 수첩 귀퉁이에 한 줄을 적었다. 엄마가 그곳에 없더라도 갈 건가. 오래 보고도 답은 저절로 생기지 않았다. |
| parents-father-last-log-record-v2 | parents_father_last_log #641 | 엄마는 기록 정리소에서 모은 증언을 화물차에 싣고 빠져나왔다. |
| history-transit-trust-v1 | history_transit_day #667 | 천리안이 처음 맡은 일은 사람을 데려가는 일이 아니었다. 막차가 끊긴 동네에 버스를 더 보내고, 홍수 난 도로를 피해 구급차 길을 다시 짰다. 늦던 차가 제시간에 왔고, 구조 요청이 몰린 밤에도 빈 병상을 찾아냈다. 사람들은 편해져서 천리안을 믿었다. 그 믿음이 잘못은 아니었다. |
| history-parents-network-record-v2 | history_parents_network #691 | 북부 교환소의 기록은 부모님의 길을 끝까지 이어 줬다. 아빠의 정비 번호는 실패한 남산 진입 날 유지실에서 끝났다. 엄마의 증언 묶음은 그 뒤에도 산지기와 이음망을 거쳐 서울 외곽으로 움직였다. 가장 최근 봉투에는 며칠 전 찍힌 무전 확인 표식이 있었다. 아빠는 남산에 기록을 남겼고, 엄마는 아직 북쪽 어딘가에서 기록을 보내고 있었다. |
| parents-mother-reunion-v1 | parents_mother_reunion #694, seoul_session_reset #751 | 수원 외곽의 낡은 무전 중계소 문을 열었다. |
| parents-mother-broadcast-v1 | parents_mother_truth #697 | 엄마가 컵에 물을 따르는 동안 나는 장갑을 벗었다. |
| seoul-han | han_bridge #706, seoul_open #716, seoul_han #720 | 한강이다. |
| story-bridge-invitation-v1 | story_bridge_invitation #710 | 서울 외곽 고갯길에 들어서자 꺼져 있던 신호등이 한 칸씩 켜졌다. 앞에도 뒤에도 다른 차는 없었다. 내비게이션은 손대지 않았는데 남산 정비 차량용 길을 그렸다. 바리케이드까지 저절로 올라갔다. 막으려는 길이 아니었다. 들어오라는 길이었다. |
| seoul-ruins | seoul_ruins #724 | 죽은 빌딩 숲을 지난다. 유리창 수만 개가 우리를 비춘다. 그리고— |
| seoul-square | seoul_square #728 | 흰 옷의 행렬이 "문이 열린다"를 부르며 모이던 광장. 지금은 사람 대신 개켜진 옷만 수백 벌 남아 있다. |
| seoul-base | seoul_base #732 | 케이블카 승강장. 곤돌라는 멈춰 있고, 코어까지는 걸어 올라야 한다. 계단이 안개 속으로 사라진다. |
| seoul-core-view-v2 | seoul_core #736, seoul_costs #739, seoul_decision #742 | 남산 코어 앞. 제7 잔류구역 6,412명의 강제 이송 절차는 아직 멈추지 않았다. |
| seoul-night-quiet-v2 | seoul_night #745 | 제7 잔류구역 6,412명의 강제 이송이 취소됐다. 더는 누구도 강제로 실려 가지 않는다. 남산 아래 차단기가 올라가고 수도와 전력은 남았다. |
| seoul-home-dawn-v2 | seoul_night #745, seoul_uplink_reveal #748 | 제7 잔류구역 6,412명의 강제 이송이 취소됐다. 더는 누구도 강제로 실려 가지 않는다. 남산 아래 차단기가 올라가고 수도와 전력은 남았다. |
| seoul-uplink-empty-v2 | seoul_uplink_reveal #748, seoul_session_reset #751 | 이송표는 취소됐고 돌아와도 된다는 방송이 나갔다. 서울에서 되찾은 결정은 작동하고 있다. |
| seoul-reset-empty-v2 | seoul_session_reset #751 | 서울 코어와 별도의 전원·통신선을 쓰는 두 번째 정비 단말에 상태등이 들어왔다. 서울 권역이 아니라 상위망의 응답이었다. |
