TRACE 3 opening_workshop [0] 감천 작업장의 마지막 호출 / 부산 감천 부두 D1 450→D1 455 / party= weather=clear / IDENTICAL
냉동차 호스를 갈고 나니 밥이 식어 있었다. 할아버지가 떠난 뒤로 감천 작업장의 수리는 혼자 맡았다.
이것만 먹고 달구지에서 좀 자자. 내일은 손수레 바퀴부터 봐야지.
숟가락을 들자 새벽 무전이 울렸다. 서울에서 내려온 이송 버스의 난방이 멈췄다고 했다. 열이 난 아이도 타고 있었다.
CHOICES: 0:공구함을 닫고 바로 부두로 간다 (enabled) | 1:난로를 끄고 예비 공구까지 챙긴다 (enabled)
CHOSEN: 공구함을 닫고 바로 부두로 간다
RESULT: 먹던 밥을 덮고 달구지에 올랐다. 평소와 같은 수리 호출인 줄 알았다.
CHIPS: [{"t": "5분 경과", "c": ""}, {"t": "새 기록 · 새벽의 수리 호출", "c": "item"}]
SCENE: {"entryKeys": ["intro-busan-workday-v1"], "resultKeys": ["intro-busan-workday-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 6 opening_bus_repair [2] 난방이 끊긴 가족 버스 / 부산 감천 부두 D1 455→D1 510 / party= weather=clear / IDENTICAL
하진은 맨 뒤 버스에서 열이 난 유나를 안고 있었다. 여덟 살 도윤이 공구함을 보고 다가와 소매를 붙잡았다.
유나 손이 자꾸 차가워져요. 이거 고치면 따뜻해져요?
바람은 다시 나오게 해 볼게. 여기 조금만 비켜 줄래?
도윤이 하진 곁으로 물러섰다. 점검판 안쪽의 난방 호스가 찢어져 있었다. 새 부품으로 잇거나, 연결 고리를 깎거나, 남은 호스를 당겨 물려야 했다.
CHOICES: 0:새 연결 부품으로 바로 고친다 (enabled) | 1:고철로 연결 고리를 새로 깎는다 (enabled) | 2:남은 호스를 잘라 우회한다 (enabled)
CHOSEN: 남은 호스를 잘라 우회한다
RESULT: 찢어진 구간을 잘라 내고 남은 호스를 당겨 물렸다. 몇 번이나 새는 곳을 다시 조였다. 도윤이 송풍구에 손을 대더니 하진을 돌아봤다. 따뜻한 바람이 나오고 있었다.
CHIPS: [{"t": "55분 경과", "c": ""}, {"t": "새 기록 · 도윤 가족의 버스", "c": "item"}]
SCENE: {"entryKeys": ["intro-dock-aid", "opening-bus-heater-v1"], "resultKeys": ["intro-dock-aid"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 9 opening_name_introduction [0] 도윤과 첫 인사 / 부산 감천 부두 D1 510→D1 510 / party= weather=clear / IDENTICAL
공구를 챙기는 내 옆으로 도윤이 다가왔다.
아저씨, 이름이 뭐예요?
CHOICES: 0:이름을 말한다 (enabled)
CHOSEN: 이름을 말한다
RESULT: 상혁이야.
도윤이 하진 쪽으로 고개를 돌렸다.
엄마, 상혁 아저씨래.
CHIPS: []
SCENE: {"entryKeys": ["intro-dock-aid"], "resultKeys": ["intro-dock-aid"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 12 opening_failed_appeal [1] 사유가 없는 이송표 / 부산 감천 부두 D1 510→D1 540 / party= weather=clear / IDENTICAL
공구를 하나씩 공구함에 넣는 동안, 버스 안 공기가 조금씩 데워졌다.

버스를 떠나기 전, 도윤이 이송표를 내밀었다. 가족 이름과 짐 무게는 적혀 있었다. 사유와 최종 승인자 칸은 부모님의 표처럼 비어 있었다.
엄마는 가방 안에 내 옷을 눌러 담았다. 나는 꺼내 놓은 로봇을 무릎에 얹고 기다렸다.
같이 가면 안 돼?
다음 차로 꼭 갈게. 네 가방은 할아버지 차에 실어 줄게.
열세 번 넣었어요. 접수됐다고는 해요. 다음 날 보면 신청한 것도 없어져 있고요.
부산 단말에서도 한번 볼게요. 사람이 받는 접수처가 있는지.
이 단말에서는 이송 명령에 대한 이의 신청을 받을 수 없습니다. 명령을 확인하려면 서울 남산으로 직접 가셔야 합니다.
화면 아래에 제7 잔류구역 등록 인원 6,412명이 떴다. 하진은 대답 대신 유나의 옷깃을 여몄다. 이 버스가 끝이 아니었다.
CHOICES: 0:거절 응답과 이송표를 함께 복사한다 (enabled) | 1:하진에게 허락을 구하고 가족 이름부터 적는다 (enabled)
CHOSEN: 하진에게 허락을 구하고 가족 이름부터 적는다
RESULT: 하진에게 허락을 구한 뒤 이름을 하나씩 받아 적었다. 하진, 도윤, 유나. 남산 주소 옆에 세 이름을 쓰고, 먼저 떠난 사람도 찾겠다고 말했다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "새 기록 · 남산 주소 옆의 세 이름", "c": "item"}]
SCENE: {"entryKeys": ["intro-dock-aid", "intro-family-packing-v1", "intro-appeal-denied"], "resultKeys": ["intro-dock-aid", "intro-family-packing-v1", "intro-appeal-denied"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 15 opening_parents_module [0] 계기판 뒤의 검증키 / 부산 감천 부두 D1 540→D1 565 / party= weather=clear / IDENTICAL
작업장으로 돌아와 엄마의 철제 상자를 열었다. 수첩 등판에서 회로도가 떨어졌다. 남산 현장 확인 포트, 달구지 계기판. 엄마가 설계하고 아빠가 만든 인간 확인 검증키의 배선이었다. 명령을 실행하기 전에 사람의 승인을 받게 하는 장치다.
계기판 뒤? 이 차를 그렇게 뜯어 봤는데.
덮개 안쪽에 천으로 감싼 모듈이 있었다. 선을 잡았다가 놓았다. 분리 순서 두 장이 뜯겨 있었다. 잘못 뽑으면 검증키와 달구지 전장이 함께 타 버린다는 경고만 남아 있었다.
이송이 다시 시작되면 발신 기록과 당사자 증언을 함께 가져갈 것. 장치만으로는 검증이 끝나지 않는다. 현장 확인은 남산에서.
CHOICES: 0:배선에 번호를 붙이고 덮개를 닫는다 (enabled) | 1:회로도에 지금 배선 경로를 덧그린다 (enabled)
CHOSEN: 배선에 번호를 붙이고 덮개를 닫는다
RESULT: 선마다 번호를 붙였다. 덮개를 닫기 전, 떨어질 만한 종이 끝을 한 번 더 눌렀다. 모듈은 분리 순서를 찾을 때까지 이 자리에 둔다.
CHIPS: [{"t": "25분 경과", "c": ""}, {"t": "새 기록 · 계기판 속 검증키", "c": "item"}]
SCENE: {"entryKeys": ["intro-dashboard-module"], "resultKeys": ["intro-dashboard-module"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 18 opening_departure [0] 작업장 셔터를 내리는 아침 / 부산 감천 부두 D1 565→D1 575 / party= weather=clear / IDENTICAL
계기판 덮개를 닫고 작업장 안을 마지막으로 둘러봤다.

엄마의 상자는 조수석 아래, 할아버지의 렌치는 운전석 옆에 넣었다. 수리 쉰다는 쪽지를 쓰다가 돌아올 날짜에서 펜이 멈췄다.
내일 손수레 맡기러 올 텐데. …부탁은 해 놓고 가야지.
단골에게 수리가 늦어진다고 알리고 셔터를 절반 내렸다. 공구함 열쇠와 셔터 열쇠를 묶은 고리가 손에 남았다. 맡기고 갈까, 직접 가지고 갈까.
CHOICES: 0:단골에게 작업장 열쇠를 맡긴다 (enabled) | 1:열쇠를 챙기고 문에 쪽지를 붙인다 (enabled)
CHOSEN: 단골에게 작업장 열쇠를 맡긴다
RESULT: 단골 손에 열쇠를 쥐여 줬다. 돌아올 날짜는 못 적겠다고, 셔터와 공구함만 가끔 봐 달라고 했다. 빈 주머니를 한 번 짚고 달구지에 올랐다.
CHIPS: [{"t": "10분 경과", "c": ""}, {"t": "새 기록 · 맡겨 둔 작업장 열쇠", "c": "item"}]
SCENE: {"entryKeys": ["intro-workshop-departure"], "resultKeys": ["intro-workshop-departure"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 21 opening_farewell [0] 이제, 내가 가는 길 / 부산 감천 부두 D1 575→D1 575 / party= weather=clear / IDENTICAL
남산에 가면 우리도 집에 돌아갈 수 있어요?
그렇게 만들러 가는 거야. 하지만 아직은 몰라. 더 찾아야 할 게 있어.
이미 떠난 사람들도 있어요. 그 사람들은 어떻게 됐는지, 가시면 알아봐 주세요.
네. 먼저 떠난 사람들도 찾아보겠습니다.
도윤은 자기 이름이 적힌 이송표를 접어 품에 넣었다. 하진은 유나가 기다리는 버스로 돌아갔다.
서울까지 400km. 시동 모터가 한 번 헛돌았고, 두 번째에 엔진이 붙었다.
할아버지, 다녀올게.
CHOICES: 0:길로 나간다 (enabled)
CHOSEN: 길로 나간다
RESULT: 양산 쪽으로 가며 이송표의 발신 기록을 찾는다.
CHIPS: []
SCENE: {"entryKeys": ["intro-departure-conversation-v4", "intro-departure-start-v1"], "resultKeys": ["intro-departure-start-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 25 lc_busan_dried [1] 자갈치 아지매 / 부산 감천 부두 D1 695→D1 695 / party= weather=clear / IDENTICAL
리어카 가득 건어물을 실은 아지매가 손을 흔든다.

"오데 가노! 서울?! 아이고 야야, 그라모 이거 무라. 마른 것들은 배신 안 한데이."
CHOICES: 0:건어물을 산다 (고철 4) (enabled) | 1:"마 됐심더" 정중히 사양 (enabled)
CHOSEN: "마 됐심더" 정중히 사양
RESULT: "아이고 무뚝뚝한 거 보소. 서울 가서 고생 좀 해봐라!" 덕담인지 저주인지 모를 배웅을 받았다.
CHIPS: []
SCENE: {"entryKeys": ["event-meet-trader"], "resultKeys": ["event-meet-trader"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 30 ev_truck_cafe [2] 트럭 카페 / None D1 751→D1 751 / party= weather=clear / IDENTICAL
개조한 트럭 옆구리를 열어 만든 이동식 카페. 손수 볶은 원두 냄새가 도로까지 퍼진다.

"커피 한 잔에 고철 넷. 원두는 아끼지 않습니다. 세상이 망해도 카페인은 못 끊죠." 주인장이 능청스레 웃는다.

(진짜 커피 냄새다. 오랜만이다.)
CHOICES: 0:커피를 산다 (고철 4) (enabled) | 1:원두 파는 곳을 묻는다 (enabled) | 2:냄새만 맡고 지난다 (enabled)
CHOSEN: 냄새만 맡고 지난다
RESULT: 고철이 아까워 냄새만 실컷 맡고 떠났다. 향이 룸미러 뒤로 오래 따라왔다.
CHIPS: []
SCENE: {"entryKeys": ["event-road-coffee-van-v2"], "resultKeys": ["event-road-coffee-van-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 34 onboarding_first_road [2] 첫 번째 발신 기록 / 김해 들판 D1 780→D1 790 / party= weather=clear / IDENTICAL
부산을 벗어난 첫 고가도로 아래에서 죽어 있던 검문 스캐너가 켜졌다. 얇은 붉은 선이 달구지 앞유리를 훑고, 녹슨 단말이 종이띠를 토해 냈다.

「재평가 조건: 배급망 변동 시 자동 실행」

날짜가 정해진 한 번의 이송이 아니었다. 물과 전력 수치가 바뀔 때마다 새 가족을 골라내는 반복 명령이었다.

종이 아래쪽 검증 번호가 눈에 걸렸다. 부모님의 이송표 귀퉁이에 있던 번호와 앞 여덟 자리가 같았다.
CHOICES: 0:차를 세우고 명령띠를 뽑는다 (enabled) | 1:전원을 끊고 단말을 통째로 연다 (enabled) | 2:스캔을 끝까지 받아 기록을 복사한다 (enabled)
CHOSEN: 스캔을 끝까지 받아 기록을 복사한다
RESULT: 달구지를 스캐너 아래에 둔 채 신호가 끝날 때까지 기다렸다. 단말은 우리 차량까지 새 인과 노드로 등록한 뒤 전체 발신 기록을 내보냈다.

추적 흔적은 남았지만, 부모님의 표와 지금 명령이 같은 곳에서 나왔다는 사실만큼은 확실히 남겼다.
CHIPS: [{"t": "10분 경과", "c": ""}, {"t": "관측 +1", "c": "minus"}, {"t": "본편 단서 · 달구지를 걸고 받은 기록", "c": "item"}]
SCENE: {"entryKeys": ["onboarding-first-road-scan-v1"], "resultKeys": ["onboarding-first-road-scan-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 38 exp_reservoir [0] 빗물 저수조 / 김해 들판 D1 910→D1 910 / party= weather=clear / IDENTICAL
농업용 저수조에 빗물이 그득하다.

그냥 마시기엔 찜찜하지만, 물은 물이다.
CHOICES: 0:끓여서 담는다 (연료 소모) (enabled) | 1:그냥 떠 담는다 (enabled) | 2:지나간다 (enabled)
CHOSEN: 끓여서 담는다 (연료 소모)
RESULT: 버너에 연료를 조금 태워 팔팔 끓였다. 물통이 든든해졌다.
CHIPS: [{"t": "연료 -2L", "c": "minus"}, {"t": "물 +4", "c": "plus"}]
SCENE: {"entryKeys": ["event-explore-water"], "resultKeys": ["event-explore-water"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 43 meet_postman [0] 자전거 우편부 / None D1 1047→D1 1047 / party= weather=clear / IDENTICAL
짐받이에 방수포 꾸러미를 실은 자전거가 마주 온다. 남자의 조끼에 손바느질로 수놓은 글자.

「우편」

"수신인을 찾아다닌 지 몇 년째예요."

"몇 년이요?"

"…세다가 자꾸 헷갈려서 그만뒀어요. 주소가 다 무너져서, 이젠 이름이랑 얼굴로 배달합니다."
CHOICES: 0:명단을 맞춰본다 (enabled) | 1:물 한 잔 대접한다 (enabled)
CHOSEN: 명단을 맞춰본다
RESULT: 우편부가 손때 묻은 명단을 펼쳤다. 아는 이름은 없었다.

대신 알고 있는 정착지 소식을 전했다. 우편부는 세 곳의 이름을 받아 적고 신이 나서 페달을 밟았다.

"오래 묵은 편지가 두 통이나 줄겠네!"
CHIPS: [{"t": "새 기록 · 자전거 우편부", "c": "item"}]
SCENE: {"entryKeys": ["event-postman-solo-v2"], "resultKeys": ["event-postman-solo-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 48 exp_arcade [1] 오락실 / 진주 남강변 D1 1285→D1 1285 / party= weather=clear / NEW TEXT
간판 절반이 떨어진 오락실. 「크… 게임랜드」.

전기가 없으니 기계들은 다 죽었다. 하지만 안쪽에서 통통— 소리가 난다.

에어하키 테이블. 전기 없이도 퍽은 밀 수 있다. 웬 노인 둘이 말없이 살벌한 기세로 겨루고 있다.
CHOICES: 0:도전한다 (enabled) | 1:인형뽑기 기계를 턴다 (enabled)
CHOSEN: 인형뽑기 기계를 턴다
RESULT: 유리를 조심스레 들어내고 인형 하나를 회수했다. 여러 해 묵은 곰인형이다.

"이건 실력으로 뽑은 걸로 치자." 아무도 동의하지 않았지만 곰은 대시보드에 앉았다.
CHIPS: [{"t": "새 기록 · 대시보드 곰", "c": "item"}]
SCENE: {"entryKeys": ["event-explore-leisure"], "resultKeys": ["event-explore-leisure"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 52 camp_dogs [2] 들개들의 밤 / 진주 남강변 D2 390→D2 390 / party= weather=clear / IDENTICAL
낮게 으르렁거리는 소리에 잠이 깼다.

들개 대여섯 마리가 차를 둘러싸고 있다. 목표는 명확하다 — 식량 상자.
CHOICES: 0:보리가 나선다 (disabled) | 1:식량 하나를 던져준다 (enabled) | 2:경적과 헤드라이트로 쫓는다 (enabled)
CHOSEN: 경적과 헤드라이트로 쫓는다
RESULT: 빵— 상향등!

들개들이 흩어졌다. 대신 그 요란함에 온 동네— 는 없지만, 밤새 뭔가가 근처를 서성이는 기척에 밤새 설잠을 잤다.
CHIPS: [{"t": "피로 +10", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-animal"], "resultKeys": ["event-crisis-animal"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 57 memory_busan_terminal [0] 부산 터미널의 마지막 불 / None D2 520→D2 520 / party= weather=clear / IDENTICAL
길가의 폐환승소에서 도착 안내판 불이 한 칸씩 꺼졌다. 그 불빛을 보자 부산 터미널에서 부모님의 다음 차를 기다리던 밤이 떠올랐다.

여덟 살의 나는 할아버지와 막차가 들어올 때마다 일어섰다. 엄마는 다음 차로 꼭 온다고 했다. 밤이 깊어 안내판이 전부 꺼진 뒤에도 우리는 한 시간을 더 앉아 있었다. 할아버지는 부모님이 죽었다고도, 버렸다고도 말하지 않았다. 집에 가서 내일 다시 기다리자고만 했다.
CHOICES: 0:내일도 여기 오자고 한다 (enabled) | 1:엄마는 약속을 지킨다고 말한다 (enabled)
CHOSEN: 내일도 여기 오자고 한다
RESULT: 할아버지는 식은 보리차 두 잔을 들고 고개를 끄덕였다. 우리는 그다음 날도, 그다음 주에도 같은 자리에 앉았다.

안내판 불이 다시 켜지는 소리에 고개를 들었다. 눈앞에는 지금 지나고 있는 폐환승소가 있었다.
CHIPS: [{"t": "새 기록 · 부산 터미널의 마지막 불", "c": "item"}]
SCENE: {"entryKeys": ["memory-busan-terminal-v1"], "resultKeys": ["memory-busan-terminal-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 61 postman_again [0] 가벼워진 가방 / None D2 597→D2 597 / party= weather=clear / IDENTICAL
자전거 방울 소리. 그 우편부다.

"어! 차!" 우편부가 급브레이크를 잡았다. 짐받이의 꾸러미가 눈에 띄게 얇아졌다.

"명단이 줄었어요. 오래 묵은 편지가 두 통 남았는데— 하나가 문제예요. 수신인이 남산 쪽이란 말이지. 거긴 자전거로는…"

우편부가 우리를 본다. 차를 본다. 다시 우리를 본다.
CHOICES: 0:편지를 맡는다 (enabled) | 1:"원칙대로 하세요" (enabled)
CHOSEN: 편지를 맡는다
RESULT: "이러면 안 되는데. 배달은 끝까지 하는 게 원칙인데."

말은 그렇게 하면서 우편부는 편지를 세 겹 방수포에 싸서 건넸다. 받는 이: 서울, 남산 아래, 김 O O.

"전하면— 아니, 전할 수 있으면, 그걸로 됐다고 해 주세요. 오래 걸렸다고는 말고."

조수석 서랍 제일 안쪽에 편지가 실렸다. 차가 조금 무거워진 기분이 들었다. 좋은 무거움이다.
CHIPS: [{"t": "남산행 편지 +1", "c": "plus"}, {"t": "새 소문 · 남산행 편지", "c": "item"}]
SCENE: {"entryKeys": ["postman-letter"], "resultKeys": ["postman-letter"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 66 ev_broadcast_station [0] 방송국 / 남원 광한루 D2 799→D2 839 / party= weather=clear / IDENTICAL
무너진 지역 방송국. 스튜디오 안엔 마이크와 카메라가 그대로.

주조정실 벽 모니터엔 마지막 화면이 얼어붙어 있다. 「긴급 속보 —」 그 뒤 문장은 없다.

방송 테이프들이 선반에 쌓여 있다.
CHOICES: 0:마지막 방송 테이프를 튼다 (enabled) | 1:송출 장비를 챙긴다 (disabled)
CHOSEN: 마지막 방송 테이프를 튼다
RESULT: 예비 전력을 물려 테이프를 재생했다. 앵커의 떨리는 목소리. "…천리안이 서울 재편 통제권을 넘겨받았습니다. 해당 구역 시민 여러분은 지정된 남행로로—" 거기서 화면이 꺼진다.

143년 전 첫 방송이 아니었다. 첫 정리 뒤에도 서울에서 사람을 밀어내는 방송은 세대마다 반복됐다.
CHIPS: [{"t": "40분 경과", "c": ""}, {"t": "새 기록 · 반복된 마지막 속보", "c": "item"}, {"t": "◈ 세대마다 반복된 추방 · 확인", "c": "item"}]
SCENE: {"entryKeys": ["event-find-broadcast-station-v1"], "resultKeys": ["event-find-broadcast-station-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 71 salvage_claim [2] 먼저 온 사람들 / None D2 909→D2 929 / party= weather=clear / IDENTICAL
무너진 창고 앞에 트럭 두 대가 서 있다. 안에서 쇠 긁는 소리가 난다.

우리가 다가가자 한 사람이 나와 길을 막았다. 손에는 장부와 연필.

"여긴 우리 구역이야. 들어가려면 회수료 내야 돼."

"언제부터 여기가 구역이었는데요?"

"우리가 온 날부터." 남자가 장부를 흔들었다. 종이에는 지역 이름과 날짜가 빼곡했다. 정말로 기록하고 있었다. 자기들끼리의 법을 만들고, 그 법을 자기들이 집행하는 사람들.

남자는 웃지 않았다. "규칙 없으면 다 뺏기니까. 규칙 만들면 우리가 뺏고."
CHOICES: 0:회수료를 낸다 (고철 10) (enabled) | 1:다른 입구를 찾는다 (enabled) | 2:그냥 지나간다 (enabled)
CHOSEN: 그냥 지나간다
RESULT: 차를 돌렸다. 저 창고에 뭐가 남았든 우리 것이 아니었다.

조금 가다 보니 반대편에서 소달구지 한 대가 그쪽으로 올라가고 있었다. 노인 혼자였다.

세워서 말해 줄까 하다가, 그러지 않았다. 말해 준다고 안 갈 것도 아니고, 우리가 대신 낼 것도 아니었다.
CHIPS: [{"t": "20분 경과", "c": ""}]
SCENE: {"entryKeys": ["event-meet-roadside"], "resultKeys": ["event-meet-roadside"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 76 lc_damyang_juktong [1] 죽통밥 굽는 사람 / 담양 대숲 D2 1090→D2 1090 / party= weather=clear / IDENTICAL
대숲 어귀 모닥불에서 대나무 통이 익어간다.

"죽통밥이요. 대나무가 밥을 지키고, 밥이 대나무 향을 얻고. 서로 돕는 밥이죠."
CHOICES: 0:통조림을 죽통밥으로 바꾼다 (식량 1) (enabled) | 1:교환하지 않고 길을 잇는다 (enabled)
CHOSEN: 교환하지 않고 길을 잇는다
RESULT: 오늘은 교환하지 않겠다고 말하고 달구지로 돌아왔다. 대숲 어귀에는 밥 익는 냄새가 남아 있었다.
CHIPS: []
SCENE: {"entryKeys": ["event-meet-trader"], "resultKeys": ["event-meet-trader"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 81 story_bridge_departure_echo [0] 부산 뒤에 남은 방송 / None D2 1134→D2 1149 / party= weather=clear / IDENTICAL
꺼 둔 줄 알았던 수신기가 혼자 켜졌다. 잡음 사이로 부산 항만 방송이 들렸다. 내일 새벽 동부 노선 이송자 명단. 도윤 가족 아래로 처음 보는 이름이 열일곱 줄 더 내려갔다. 부산을 빠져나오면 끝날 거라고 믿은 사람은 없었다. 그래도 다음 종이가 벌써 나올 줄은 몰랐다.
CHOICES: 0:발신 시각과 주파수를 적어 둔다 (enabled) | 1:방송이 끝날 때까지 이름을 받아 적는다 (enabled)
CHOSEN: 발신 시각과 주파수를 적어 둔다
RESULT: 명단보다 먼저 눈에 들어온 건 시각이었다. 새벽 3시 12분. 발신 시각은 정확했지만 승인자의 이름은 끝내 나오지 않았다. 주파수 옆에 시각을 옮겨 적었다.
CHIPS: [{"t": "15분 경과", "c": ""}]
SCENE: {"entryKeys": ["story-bridge-departure-echo-v1"], "resultKeys": ["story-bridge-departure-echo-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 91 meet_hitchhiker [0] 대인시장의 떠돌이 가수 / 광주 대인시장 D3 690→D3 690 / party= weather=clear / IDENTICAL
광주 대인시장 평상 모닥불. 기타 케이스를 멘 남자가 장사를 마친 사람들에게 낮은 목소리로 노래한다. 발치에는 붉은 스카프를 맨 개 한 마리.

노래가 끝나자 개가 먼저 달구지 냄새를 맡고 꼬리를 흔든다.

"레오예요. 얘는 보리. 남원 쪽 침수 지하차도에서 아이 목소리가 계속 잡힌다는데, 거기까지 갈 차를 찾고 있어요."
CHOICES: 0:"남원까지 같이 갑시다" (enabled) | 1:오늘은 자리가 없다 (enabled)
CHOSEN: "남원까지 같이 갑시다"
RESULT: 레오는 기타부터 지붕 끈에 묶었다. 두 번 묶고, 한 번 풀고, 다시 묶었다.

"얘가 비 맞으면 소리가 죽어서요. 아, 보리 말고 기타요. 보리는 비 좋아해요."

보리는 허락도 받기 전에 조수석 발치에 자리를 잡았다.

"지하차도 안에 누가 있는지는 아직 몰라요. 녹음일 수도 있고, 함정일 수도 있고."

그는 웃지 않고 덧붙였다. "그래도 보리가 그 소리를 들으면 들어갈 겁니다. 그러니까 내가 먼저 가야 해요."

둘은 동료가 아니라 구조 현장까지 함께 가는 승객으로 달구지에 올랐다.
CHIPS: [{"t": "새 기록 · 레오와 보리", "c": "item"}]
SCENE: {"entryKeys": ["recruit-leo-daein-market-v2", "recruit-leo-meet-action"], "resultKeys": ["recruit-leo-daein-market-v2", "recruit-leo-meet-action"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 97 cell_sotgot_meet [0] 솥의 금자 / 광주 대인시장 D3 910→D3 910 / party= weather=clear / IDENTICAL
광주 대인시장 국밥집. 금자 이모가 커다란 솥에 국물을 붓다가 우리를 보고 국자를 흔든다.

"어이구 왔는가! …아니 잠깐. 자네들, 이음망이 말한 그 달구지제? 앉아 앉아. 밥부터."
CHOICES: 0:국밥을 받는다 (enabled)
CHOSEN: 국밥을 받는다
RESULT: 국밥 한 그릇이 순식간에 나왔다. 먹는 동안 금자가 옆에 앉아 목소리를 낮췄다.

"내 국밥집이 왜 저항인지 아는가? 사람이 모이잖어. 밥 먹으러. 근데 사람이 모이면 소식이 모여. 북쪽서 내려온 사람, 서쪽서 온 사람— 다 여기서 한 그릇 뜨면서 풀어놔. 나는 그 소식을 듣고 이어 주지."

말하다 말고 금자가 벌떡 일어나 옆 상에 깍두기를 내주고 왔다. "어디까지 했는가? …그래, 소식 말이여."

"천리안은 카메라로 보지만, 나는 밥상으로 봐. 어느 쪽이 더 많이 아는지 아는가? …밥상이여. 사람은 카메라 앞에선 거짓말해도, 국밥 앞에선 안 하거든."

금자가 국물을 더 떠줬다. "북쪽 소식은 여기 다 모여. 남산 관문 얘기도. 조심허게— 그 문은 힘으로 여는 게 아니랑께."
CHIPS: [{"t": "식량 +3", "c": "plus"}, {"t": "새 기록 · 솥 — 금자", "c": "item"}]
SCENE: {"entryKeys": ["gwangju-market"], "resultKeys": ["gwangju-market"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 102 story_bridge_trace_gap [1] 11분의 빈칸 / None D3 954→D3 969 / party= weather=clear / IDENTICAL
폐쇄된 요금소 제어실에서 기록지가 아직도 조금씩 밀려 나오고 있었다. 자동 명령 발행 03:12. 버스 출발 03:16. 사람 확인 03:23. 확인자 칸은 비어 있었다. 버스가 떠난 뒤에야 사람이 승인한 셈이었다.
CHOICES: 0:세 장의 시각을 나란히 적는다 (enabled) | 1:비어 있는 확인란을 그대로 남긴다 (enabled)
CHOSEN: 비어 있는 확인란을 그대로 남긴다
RESULT: 빈칸 아래에는 완료 도장이 또렷했다. 누가 승인했는지를 찾으려면, 명령을 보낸 곳보다 도장을 나중에 붙인 곳부터 따라가야 했다.
CHIPS: [{"t": "15분 경과", "c": ""}]
SCENE: {"entryKeys": ["story-bridge-trace-gap-v1"], "resultKeys": ["story-bridge-trace-gap-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 108 levy_office [0] 임시 행정소 / None D3 1062→D3 1062 / party= weather=clear / IDENTICAL
길목에 천막이 서 있다. 「임시 차량 행정소」. 손글씨인데 관공서 서체를 흉내 냈다.

형광 조끼를 입은 남자 셋. 가슴에 코팅된 명찰. 책상 위에 도장과 장부까지 갖췄다.

"미등록 차량이네. 재등록비 고철 열다섯. 등록 안 하면 위쪽에… 그, 뭐냐, 미등록 이동체로 보고가 올라가요."

남자가 태블릿을 툭툭 쳤다. 화면은 꺼져 있다. 저들은 천리안이 무서운 게 아니다. 천리안을 두려워하는 사람들을 노린다.
CHOICES: 0:꺼진 태블릿을 지적한다 (enabled) | 1:재등록비를 낸다 (enabled) | 2:천막을 걷어버린다 (enabled)
CHOSEN: 꺼진 태블릿을 지적한다
RESULT: "어— 이 양반이." 남자가 장부를 덮으며 일어섰다. 뒤의 둘이 쇠파이프를 짚었다.

고철통을 뒤지고서야 그들이 길을 열었다. 사기꾼과의 협상은 이기고도 지는 기분이다.
CHIPS: [{"t": "고철 -8", "c": "minus"}]
SCENE: {"entryKeys": ["event-meet-guard"], "resultKeys": ["event-meet-guard"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 113 rq_leo_task [1] 돌아가야 하는 이유 / 남원 광한루 D3 1103→D3 1203 / party= weather=clear / IDENTICAL
입구에 도착하자 보리가 아이 목소리를 쫓아 계단 아래로 뛰었다. 난간을 넘는 순간 물에 빠졌다.

우리가 뒤따라 비춘 불빛에 비상방송기가 드러났다. 같은 외침이 같은 잡음과 함께 반복된다. 녹음이었다. 그 아래 어둠 속에서 보리가 한 번 짖는다.

레오는 기타 케이스의 어깨끈을 풀어 허리에 두르려 한다. 우리가 견인 로프를 꺼내자 그제야 끈을 놓는다.

"제가 먼저 가요. 보리가 물을— 얘가 물을 무서워해요. 겁먹으면 사람 말은 안 듣고 노래는 들어요. 그건 확실해요."

레오가 로프 매듭을 두 번 확인한다. 떨리는 목소리로 한 소절을 부르자 어둠 속에서 보리가 짧게 답한다. 이제 물 안으로 들어갈 방법을 정해야 한다.
CHOICES: 0:윈치 줄을 안전선으로 건다 (disabled) | 1:두 번째 로프가 되어 함께 들어간다 (enabled) | 2:트럭을 물가까지 붙여 불빛을 만든다 (enabled)
CHOSEN: 두 번째 로프가 되어 함께 들어간다
RESULT: 물은 생각보다 빠르고 차가웠다. 레오의 노래가 끊길 때마다 우리가 뒤에서 다음 소절을 엉망으로 이었다.

보리는 부서진 난간 위에서 떨고 있었다. 돌아오는 길엔 셋이 한 줄이 됐다. 레오, 보리, 우리.

도로에 엎어진 레오가 한참 웃는다. 웃다가 사레들려서 또 기침한다. "노래를 그렇게 못 부르는 사람은— 죄송해요, 진짜 처음 봤어요. 그래서 안 잊어버릴 것 같은데."
CHIPS: [{"t": "물 -1", "c": "minus"}, {"t": "1.7시간 경과", "c": ""}, {"t": "피로 +16", "c": "minus"}, {"t": "새 기록 · 보리를 데리러 돌아간 길", "c": "item"}]
SCENE: {"entryKeys": ["recruit-leo-rescue-choice-v1"], "resultKeys": ["recruit-leo-task-wade"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 117 camp_2_leo [1] 노래 없는 자리 / 남원 광한루 D3 1203→D3 1233 / party= weather=clear / IDENTICAL
말도 안 맞던 합창 한 소절을 레오가 자꾸 웃으며 흥얼거린다.
레오는 기타 잠금쇠를 열었다 닫는다. 보리는 케이스에 턱을 얹고 하품한다.
오늘 공연은 휴관이에요. 기타는 그냥 꺼내 둔 거고요. …표정이 왜 그래요. 제가 안 믿겨요?
CHOICES: 0:물 1을 나눠 마시며 조용히 곁에 앉는다 (enabled) | 1:완성된 노래 대신 쓰다 만 한 줄을 듣는다 (enabled)
CHOSEN: 완성된 노래 대신 쓰다 만 한 줄을 듣는다
RESULT: 레오가 젖었다 마른 수첩을 폈다.

"매일 떠나는데, 신발은 늘 같은 문 앞에… 여기서 막혔어요."

그가 뒤쪽 빈 줄을 손가락으로 가렸다.

"노래로 하면 덜 이상한데. 읽으니까 신발 얘기뿐이네."

"뒤에 더 쓰면 또 들려줘요."

레오는 여분 기타 줄 끝에 오늘 날짜를 적은 종이를 묶었다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "함께 나눈 대화 · 합류하면 유대 +2", "c": "item"}, {"t": "레오의 여분 기타 줄 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 123 story_bridge_watched [0] 먼저 알아본 쪽 / None D4 512→D4 532 / party= weather=clear / IDENTICAL
전조등이 폐쇄 검문소를 훑자 감시 카메라 세 대가 동시에 돌아왔다. 렌즈가 운전석 쪽으로 기울었다. 꺼진 안내판에 짧은 문장이 떴다. 「검증 장치 운송체 확인」 계기판 안에 숨겨 두고 출발한 장치였다. 안내판을 다시 읽는 동안, 막혀 있던 앞길의 신호가 하나씩 초록으로 바뀌었다.
CHOICES: 0:멈춰서 화면과 카메라를 기록한다 (enabled) | 1:카메라를 지나 열린 길로 빠져나간다 (enabled)
CHOSEN: 멈춰서 화면과 카메라를 기록한다
RESULT: 카메라는 피하지 않았다. 오히려 렌즈를 낮춰 운전석까지 담았다. 우리가 천리안을 쫓기 시작했다고 생각했는데, 먼저 우리를 알아본 건 저쪽이었다.
CHIPS: [{"t": "20분 경과", "c": ""}, {"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["story-bridge-watched-v1"], "resultKeys": ["story-bridge-watched-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 128 rq_leo_join [0] 둘이 타는 자리 / 거창 분지 D4 614→D4 614 / party= weather=clear / IDENTICAL
레오는 닫힌 기타 케이스의 손잡이를 쥔다. 들고 내리지는 않는다.

보리는 달구지 문 앞에 앉아 이미 자기 차처럼 하품한다.

"한 구간만 얻어 타려고 했는데, 여기선 조용히 있어도 안 쫓겨나네요. 그게 좀… 아니다, 됐어요."

"그럼 한 구간으로 끝내지 말죠. 서울까지 같이 갈래요?"

레오가 웃는다. 웃다가 스스로 웃음을 끊고 보리를 가리킨다. 가리키는 손끝이 조금 흔들린다.

"저희 둘 다요. 밥은 둘이 먹고, 노래는 부르고 싶을 때만 제가 하고, 경비는 얘가 해요. 아마도."

"둘이 잘 자리부터 만들면 돼요."
CHOICES: 0:보리에게도 빈자리를 보여 준다 (enabled)
CHOSEN: 보리에게도 빈자리를 보여 준다
RESULT: 문을 열어 보리에게 안쪽을 보여 줬다. 보리는 발판 냄새를 맡더니 문 앞에 털썩 앉았다.

레오가 그걸 오래 본다. 뭔가 말하려다가 결국 고개만 끄덕인다. "…좋답니다. 저도요."

기타 케이스와 젖은 수첩을 어디에 둘지 짚어 봤다. 레오는 짐을 문 옆에 내려놓고 보리의 등을 쓸어 주며 기다렸다.
CHIPS: []
SCENE: {"entryKeys": ["recruit-leo-join"], "resultKeys": ["recruit-leo-join-decision"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 134 talk_leo_18 [1] 레오 — 사연 수집가 / 거창 분지 D4 614→D4 614 / party=leo weather=clear / IDENTICAL
레오의 가사 수첩엔 낯선 이름들이 가득하다.

"지나온 마을 사람들 사연이에요. 노래로 만들어주기로 약속했거든요. 씨앗 파는 애, 등대 할아버지…"

"…그리고 또 누구였더라. 적어놨는데 제 글씨를 제가 못 알아보겠어요."

"세상이 기록을 안 해주니까, 노래라도 해야죠."
CHOICES: 0:"제 사연도 있어요?" (enabled) | 1:"그 약속들 다 지킬 수 있어요?" (enabled)
CHOSEN: "그 약속들 다 지킬 수 있어요?"
RESULT: "다는 못 지킬 수도 있죠. 근데 하나 지킬 때마다 노래가 하나 늘잖아요."

레오가 수첩을 넣다가 다시 꺼냈다. 못 알아보겠던 이름을 두 번 덧썼다. 두 번째 글씨가 더 삐뚤어졌다.

"천리안은 명단을 만들고, 전 세트리스트를 만들어요." 레오가 이름 옆에 별표를 쳤다.

"별표는 왜 쳐요?" "까먹을까 봐요."
CHIPS: [{"t": "레오 사기 +5", "c": "plus"}, {"t": "새 기록 · 레오의 세트리스트", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 139 cell_mountain_meet [0] 산지기 / 거창 분지 D4 734→D4 734 / party=leo weather=clear / IDENTICAL
산길 중턱. 나무 사이에서 사람 그림자들이 소리 없이 나타났다. 사냥꾼 차림, 무기는 활. 총이 아니라.

"…길 잃었나. 아니면 이음망?" 앞선 이가 물었다. 눈빛이 짐승처럼 밝다.
CHOICES: 0:"남산으로 가는 길을 찾고 있어요" (enabled)
CHOSEN: "남산으로 가는 길을 찾고 있어요"
RESULT: "남산? 그 길은 도로로만 찾으면 안 돼." 앞선 이가 달구지와 운전석을 번갈아 봤다. 활이 조금 내려갔다. 산지기들이 능선 위 은거지로 길을 안내했다. 전기도 없고, 금속도 최소한이다.

"여긴 전파 잡힐 만한 건 안 써." 앞선 여자가 라디오부터 가리켰다. "천리안 지도에도 이 근처는 그냥 회색이야. 뭐가 사는지 모르는 거지."

"그래서 활을 쓰는 거예요?"

"총 한 번 쏘면 사방에서 들리잖아. 활은 주워 오면 끝이고." 여자가 마른 고기를 내밀었다. "질겨. 오래 씹어."

한동안 다들 말없이 씹기만 했다. 여자가 그제야 덧붙였다. "북쪽에선 도로 버리고 능선 타. 남산도 산이니까, 붙을 데가 있을 거야."
CHIPS: [{"t": "식량 +3", "c": "plus"}, {"t": "사기 +3", "c": "plus"}, {"t": "🗺 송전 통신탑 발견", "c": "item"}, {"t": "새 기록 · 산지기 — 감시 거부", "c": "item"}]
SCENE: {"entryKeys": ["arrival-geochang"], "resultKeys": ["arrival-geochang"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 144 story_generation_form [0] 세 겹의 이송표 / None D4 856→D4 856 / party=leo weather=clear / IDENTICAL
폐쇄된 면사무소 처마 밑에 사람들이 모여 있다. 벽에는 출생표와 사망표 사이로 이송표 세 장이 붙어 있다. 노인 하나가 그 옆에 앉아 있다.

같은 성씨. 노인의 증조모, 할머니, 어머니. 출발지는 종로·마포·구로, 내려온 해도 모두 다르다. 「사유」 칸만 똑같이 비어 있다.

누군가 그 옆에 「물 부족」, 「전염」, 「불복종」을 연필로 적었다. 다른 손들이 날짜와 지도를 대조해 하나씩 줄을 그었다. 맨 아래에는 짧은 메모가 남았다.

「아직 모름. 빈칸 지우지 말 것.」
CHOICES: 0:빈칸까지 그대로 베껴 적는다 (enabled) | 1:세 사람의 이름부터 읽는다 (enabled)
CHOSEN: 빈칸까지 그대로 베껴 적는다
RESULT: 세 사람의 이름을 옮기고, 사유란은 비워 뒀다.

면사무소 노인이 수첩을 들여다봤다. "글씨 곱네. 학교 다녔나?"

"…조금요."

노인은 대답은 듣는 둥 마는 둥 하고 빈칸을 짚었다. "예전엔 이게 창피해서 아무 말이나 써 넣었어. 물이다, 병이다. 그러면 애들이 그걸 답으로 외우더라고."

노인은 빈칸 옆에 작은 점을 찍었다. "이건 빠뜨린 게 아니라 비워 둔 거라고 표시해."
CHIPS: [{"t": "사기 +1", "c": "plus"}, {"t": "새 기록 · 세 겹의 이송표", "c": "item"}]
SCENE: {"entryKeys": ["story-generation-form"], "resultKeys": ["story-generation-form"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 149 jy_recruit [0] 촛불 교환대의 리어카 / 무주 터널 D4 930→D4 930 / party=leo weather=clear / IDENTICAL
무주 터널 촛불 교환대. 고물을 산처럼 실은 리어카 한 대가 벽을 차지하고 있다. 주인은 스무 살쯤의 아이. 물건마다 교환값을 붙이다가, 빈 선반 한 칸 앞에서 손을 멈춘다.

아이가 달구지 하부를 보더니 먼저 입을 연다.

"왼쪽 뒤 판스프링 헐거운 거 알아요? 난 재이예요."

"…순서가 좀 이상한데요."

"아, 그쵸. 스프링부터 봐서." 재이가 손을 바지에 문지르고 다시 내민다. "재이예요. 판스프링은 진짜 헐거워요."

그러고는 김천 쪽 무너진 재활용 창고를 지도에 짚었다. "우리 집 상자가 저기 깔렸어요. 돈 될 건 하나도 없고요. 그래서 더 내가 꺼내야 해요."
CHOICES: 0:"김천까지 같이 가요" (enabled) | 1:고물 정보만 산다 (고철 3) (enabled)
CHOSEN: "김천까지 같이 가요"
RESULT: 재이가 잠깐 우리 차를 본다. 값어치부터 물을 줄 알았다는 얼굴이다.

"얼마 받으려고요?"

"안 받아요."

"…그런 말 하는 사람들 보통 나중에 받던데요." 그러면서도 벌써 종이를 편다. "철근이 두 겹이에요. 그냥 당기면 지붕째 내려앉고요."

도르래 순서를 그리다 말고 한 번 지우고 다시 그렸다. "창고 앞에서 차를 세워요. 내가 길 안내할게요."

리어카는 접어서 달구지 지붕 아래에 임시로 묶었다. 값이 없는 철제 상자 자리만 달구지 안에 비워 두었다.
CHIPS: [{"t": "새 기록 · 재이", "c": "item"}]
SCENE: {"entryKeys": ["recruit-jaeyi-tunnel-exchange-v2", "recruit-jaeyi-suspension-check", "recruit-jaeyi-meet-action"], "resultKeys": ["recruit-jaeyi-tunnel-exchange-v2", "recruit-jaeyi-suspension-check", "recruit-jaeyi-meet-action"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 156 exp_mart [2] 버려진 마트 / 무주 터널 D4 1165→D4 1165 / party=leo weather=clear / NEW TEXT
중형 마트. 입구 유리는 깨진 지 오래고, 안쪽은 어둡다.

선반 대부분은 털렸겠지만, 뒤지는 사람 나름이다.
CHOICES: 0:식품 코너를 뒤진다 (enabled) | 1:박 선생이 감별한다 (disabled) | 2:생활용품 코너로 (enabled)
CHOSEN: 생활용품 코너로
RESULT: 배터리, 테이프, 라이터. 고철상이 좋아할 것들.
CHIPS: [{"t": "고철 +7", "c": "plus"}]
SCENE: {"entryKeys": ["event-explore-retail"], "resultKeys": ["event-explore-retail"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 160 near_muju_firefly [0] 반딧불이 계곡 / 무주 터널 D4 1405→D5 5 / party=leo weather=clear / IDENTICAL
무주 계곡길. 헤드라이트를 끄자—

계곡 전체가 별밭이 됐다.

반딧불이 수천 마리. 불빛 하나하나가 느리게 깜빡이며 떠다닌다. 오래전엔 보호구역이었다. 지금은 세상 전체가 보호구역이다.
CHOICES: 0:시동을 끄고 내린다 (enabled)
CHOSEN: 시동을 끄고 내린다
RESULT: 30분을 아무도 말하지 않았다. 숨소리조차 아꼈다. 불빛을 눈으로 쫓기만 했다.

반딧불이 하나가 막내 손등에 앉았다 떠났다. "…방금 저 착지 허가받은 거예요?" 속삭임에 다들 조용히 웃었다.

떠날 때 헤드라이트를 최대한 늦게 켰다. 별밭에 대한 예의로.
CHIPS: [{"t": "40분 경과", "c": ""}, {"t": "사기 +7", "c": "plus"}, {"t": "새 기록 · 반딧불이 계곡", "c": "item"}]
SCENE: {"entryKeys": ["event-explore-civic"], "resultKeys": ["event-explore-civic"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 166 camp_3_leo [1] 먼저 비워 둔 자리 / 무주 터널 D5 5→D5 35 / party=leo weather=dust / NEW TEXT
거창 분지에서 무주 터널까지 온 길을 떠올린다.
레오가 보리를 조금 옆으로 옮겨 앉힌다. 기타는 케이스 안에 있다.
그 한 줄, 아직 못 이었어요. 대신 오늘 바퀴 소리는 외웠는데. 이건 가사로 쓰면 안 되겠죠?
CHOICES: 0:물 1을 나눠 마시며 조용히 곁에 앉는다 (enabled) | 1:가사 대신 오늘 들은 바퀴 소리를 흉내 낸다 (enabled)
CHOSEN: 가사 대신 오늘 들은 바퀴 소리를 흉내 낸다
RESULT: 내가 차체를 두드리자 레오가 바로 손을 얹었다.

"그건 바퀴가 아니라 대장님 박자인데요."

다시 해 봤다. 이번에는 레오가 내 박자를 따라 두드렸다. 노래가 되지는 않았지만 한참 걸렸다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "레오 유대 +2", "c": "item"}, {"t": "레오의 여분 기타 줄 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 171 talk_leo_19 [0] 레오 — 엄마의 십팔번 / 무주 터널 D5 390→D5 390 / party=leo weather=dust / IDENTICAL
모닥불 앞에서 레오가 낮게 콧노래를 흥얼거린다. 처음 듣는 옛 노래다.

"…엄마 십팔번이에요. 설거지할 때마다 불렀어요. 물소리랑 세트로."

"……."

"이상하죠. 얼굴보다 노래가 더 선명해요."
CHOICES: 0:"끝까지 불러줘요" (enabled) | 1:"물소리 구해올게요" (물을 졸졸 따른다) (enabled)
CHOSEN: "끝까지 불러줘요"
RESULT: 레오가 기타를 안고 끝까지 불렀다. 군데군데 가사를 잊어서 라라라로 때우면서.

"…가사 잊은 데는 엄마가 화내겠다." 웃는데 눈이 젖어 있었다.

"괜찮아요. 라라라는 레오 씨가 새로 쓰면 되잖아요."

"제가요?"

"아니면 지금처럼요. 더 생각나면 그때 또 불러줘요."

레오는 대답 대신 같은 소절을 한 번 더 불렀다. 이번에도 같은 데서 라라라였다.
CHIPS: [{"t": "레오 사기 +1", "c": "plus"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-road-v1"], "resultKeys": ["comp-talk-leo-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 177 parents_diversion_manifest [0] 오지 않은 다음 차 / None D5 542→D5 542 / party=leo weather=dust / IDENTICAL
남쪽 환승소의 운행표와 분류 기록을 나란히 펼쳤다. 두 기록에 적힌 부모님의 이송 번호부터 맞춰 보았다. 부모님의 다음 차는 실제로 있었지만 부산으로 출발하지 않았다. 두 사람은 탑승 직전 따로 분류됐다. 아빠는 남산 기술 유지선으로, 엄마는 중부 이송 기록 정리소로 보내졌다. 그날 터미널에서 아무리 기다려도 같은 버스가 올 수 없었던 이유가 기록에 남아 있었다.
CHOICES: 0:왜 두 사람을 갈라놓았는지 확인한다 (enabled) | 1:왜 탑승을 거부하지 못했는지 확인한다 (enabled)
CHOSEN: 왜 두 사람을 갈라놓았는지 확인한다
RESULT: 아빠의 설비 경력과 엄마의 기록 검증 경력이 각각 필요한 곳으로 배정돼 있었다. 가족은 한 단위가 아니라 쓸 수 있는 기술 두 개로 처리됐다.
CHIPS: [{"t": "새 기록 · 오지 않은 다음 차", "c": "item"}]
SCENE: {"entryKeys": ["parents-diversion-record-v2"], "resultKeys": ["parents-diversion-record-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 181 route_mid_fork [1] 두 길이 갈라지는 곳 / 김천 갈림길 D5 598→D5 598 / party=leo weather=dust / IDENTICAL
김천 북쪽 교차로에서 차를 세웠다. 넘어진 표지판 두 장을 씻어 세우니 갈 길이 선명해졌다.

동쪽은 상주와 문경을 지나 청주로 곧장 오르는 능선길. 짧지만 비에 깎인 구간이 많다. 서쪽은 무주와 전주 장터를 거쳐 올라가는 길. 훨씬 멀지만 물과 사람을 만날 곳이 이어진다.

지도 위에서 두 선은 청주에서 다시 만났다. 나는 동쪽 선 옆에 ‘빠름, 험로’, 서쪽 선 옆에 ‘보급, 안전’을 적었다.

달구지 짐칸을 열어 보니 어느 쪽을 고르느냐에 따라 챙길 짐도 달라진다. 능선으로 가면 삽과 견인줄, 장터로 가면 빈 물통과 묶음끈이 먼저다.

청주에 닿을 때까지는 고른 노선 밖으로 나갈 수 없다. 다른 곳에 맡은 일이 있다면 청주에서 길이 합쳐진 뒤 돌아가야 한다. 준비를 마친 뒤 한쪽을 고르기로 했다.
CHOICES: 0:동쪽 능선길로 간다 (enabled) | 1:서쪽 장터길로 간다 (enabled)
CHOSEN: 서쪽 장터길로 간다
RESULT: 무주 쪽 선에 동그라미를 쳤다. 전주와 논산, 대전을 거쳐 청주까지.

"조금 늦더라도 사람 있는 길로 간다. 남산에 가져갈 건 부품만이 아니니까."

빈 물통과 묶음끈을 짐 맨 위로 옮겼다. 장터길에서는 빈자리도 쓸모가 있다.
CHIPS: [{"t": "노선 선택 · 서쪽 장터길", "c": "item"}]
SCENE: {"entryKeys": ["route-mid-fork"], "resultKeys": ["route-mid-fork"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 185 rq_jaeyi_task [1] 값을 매길 수 없는 상자 / 김천 갈림길 D5 598→D5 658 / party=leo weather=dust / IDENTICAL
재활용 창고 지붕이 안쪽으로 주저앉았다. 멀쩡한 배터리와 구리선이 발에 채이지만 재이는 보지도 않는다.

철근 아래 찌그러진 양철 상자. 뚜껑 틈으로 바랜 사진 한 귀퉁이가 보인다.

"엄마가 버리지 말라던 건 다 저기 있어요. 양철이라 무게는 사 킬로쯤 되고, 고철값은— 아니, 그건 됐고. 돈 되는 건 하나도 없어요."

재이는 웃지 않는다. 발끝으로 구리선 하나를 옆으로 밀어 놓는다. "그래서 약탈자들도 안 가져갔고요."
CHOICES: 0:윈치와 도르래로 하중을 들어낸다 (disabled) | 1:쓸 만한 부품을 받침대로 써 버린다 (enabled) | 2:잔해를 손으로 한 조각씩 걷어낸다 (enabled)
CHOSEN: 쓸 만한 부품을 받침대로 써 버린다
RESULT: 새 베어링과 멀쩡한 프레임을 받침으로 밀어 넣었다. 재이는 아까운 표정을 숨기지 못했지만 손은 멈추지 않았다.

상자가 빠진 뒤, 받침은 천장 아래서 납작해졌다. 재이가 사진을 꺼내 보여주려다 각도를 바꿔 다시 내민다. 리어카보다 작은 재이가 가족 사이에 서 있다.

"부품은 또 구하면 돼요. 베어링은 시장에 흔하고, 프레임도 뭐." 재이가 스스로에게 말하듯 한다. "…이건 아니고."
CHIPS: [{"t": "1시간 경과", "c": ""}, {"t": "사기 0", "c": ""}, {"t": "부품 -1", "c": "minus"}, {"t": "새 기록 · 고철값이 없는 상자", "c": "item"}]
SCENE: {"entryKeys": ["recruit-jaeyi-trapped-box-v1"], "resultKeys": ["recruit-jaeyi-box-recovered-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 189 lc_yeongdong_wine [0] 와인 터널 / 김천 갈림길 D5 778→D5 778 / party=leo weather=dust / IDENTICAL
폐 철도 터널을 개조한 와인 저장고. 서늘한 어둠 속에 술통들이 잠들어 있다.

입구 방명록: "가져가는 만큼 사연을 적을 것 — 관리인"

사연 노트가 이미 세 권째다.
CHOICES: 0:한 병 얻고 사연을 적는다 (enabled)
CHOSEN: 한 병 얻고 사연을 적는다
RESULT: 포도 와인 한 병을 골랐다. 사연 노트엔 할아버지 얘기를 적었다. 짧게. 길게 쓰면 울 것 같아서.

노트를 훑어보니 온 세상의 사연이 다 있었다. 축하, 애도, 고백, 재회. 터널은 술이 아니라 사연을 저장하는 곳이었다.
CHIPS: [{"t": "고철 +3", "c": "plus"}, {"t": "사기 0", "c": ""}, {"t": "새 기록 · 와인 터널의 사연", "c": "item"}]
SCENE: {"entryKeys": ["event-vista-road"], "resultKeys": ["event-vista-road"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 193 crisis_nofuel [0] 연료 바닥 / 김천 갈림길 D5 778→D5 1198 / party=leo weather=dust / IDENTICAL
김천 갈림길에 차를 세워 둔 채 연료통을 확인했다. 남은 양으로는 다음 길을 안심하고 나설 수 없다.

주변에서 기름을 구하거나 지나가는 차에 도움을 청해야 한다. 기름통을 꺼내 차 옆에 놓았다.
CHOICES: 0:걸어서 연료를 구해온다 (enabled) | 1:지나가는 차를 기다린다 (enabled)
CHOSEN: 걸어서 연료를 구해온다
RESULT: 빈 기름통 두 개를 메고 걸었다. 한나절 만에 농가 창고에서 경운기 기름을 구해 돌아왔다.

다리가 후들거리지만, 차가 다시 살아났다.
CHIPS: [{"t": "연료 +9L", "c": "plus"}, {"t": "물 -2", "c": "minus"}, {"t": "식량 -2", "c": "minus"}, {"t": "7시간 경과", "c": ""}, {"t": "사기 -4", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 197 camp_4_jaeyi [0] 값을 매기지 않는 자리 / 김천 갈림길 D5 1198→D5 1228 / party=leo weather=dust / IDENTICAL
망가진 부품 한 개 대신 가족 사진은 모두 제 모양으로 나왔다.
재이가 적재칸의 폭을 잰다. 부품 상자를 밀어 보고, 자기 발견물 상자를 당겨 본다.
제 상자 빼면 부품이 딱 들어가요. 근데 뺄 생각은 없어요. 세워 넣으면 안 되나?
CHOICES: 0:둘 자리를 재이가 고르게 하고 함께 다시 묶는다 (enabled) | 1:고철 2로 상자가 들어갈 선반을 더 단다 (enabled)
CHOSEN: 둘 자리를 재이가 고르게 하고 함께 다시 묶는다
RESULT: "부품 상자 세우면 들어가요. 자리는 재이 씨가 정해요."

재이는 무거운 부품이 아래로 가게 상자를 돌려 묶었다. 자기 상자는 발밑에 놓았다.

"다리는 못 펴도 오늘은 돼요. 다음 정차 때 레일 옮겨요. 볼트 네 개면 돼요."

내가 끈을 당기는 동안 재이는 고리를 잡고 버텼다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "함께 나눈 대화 · 합류하면 유대 +2", "c": "item"}, {"t": "재이의 발견물 상자 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 202 talk_leo_14 [0] 레오 — 주제곡 제작 / 김천 갈림길 D6 390→D6 390 / party=leo weather=fog / IDENTICAL
"대장님 주제곡 만들어도 돼요?" 레오가 물었다.

"주제곡이요?"

"사람마다 주제곡이 있어야 해요. 등장할 때 나오는 거요. 문 열고 들어오면 딴— 딴딴, 하는 거."
CHOICES: 0:"어떤 곡인데요?" (enabled)
CHOSEN: "어떤 곡인데요?"
RESULT: 레오가 짧은 멜로디를 연주했다. 낮게 시작해서, 중간에 잠깐 머뭇거리다가, 끝에서 단단해지는 여덟 마디.

"…이게 저예요?" "네. 부산에서 지금까지의 대장님요."

"중간에 머뭇거리는 데는 뭐예요."

"그냥 넣었어요." 레오가 기타 줄을 괜히 만졌다. "…아니다. 그냥 넣은 건 아니고요."

그 부분이 없으면 거짓말이었을 것이다. 내가 운전석 쪽을 보자 레오는 그 여덟 마디를 한 번 더 연주했다.
CHIPS: [{"t": "레오 사기 0", "c": ""}, {"t": "새 기록 · 여덟 마디의 나", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 207 parents_separated_work [0] 두 곳에서 만든 한 절차 / None D6 527→D6 527 / party=leo weather=fog / IDENTICAL
아빠의 남산 정비 기록과 엄마의 중부 기록 묶음에는 같은 번호가 반복됐다. 아빠는 의료·급수·교통선을 살린 채 강제 이송선만 떼어 내는 순서를 적었다. 엄마는 기록소에서 사라질 뻔한 이송 사유와 당사자 증언을 몰래 모았다. 두 사람은 서로 다른 곳에 갇힌 뒤에도 화물 묶음 번호로 자료를 주고받고 있었다.
CHOICES: 0:아빠가 숨긴 정비 위치를 표시한다 (enabled) | 1:엄마가 만든 증언 전달망을 표시한다 (enabled)
CHOSEN: 아빠가 숨긴 정비 위치를 표시한다
RESULT: 분리 절차의 앞부분이 남산 유지선 곳곳에 나뉘어 있었다. 한 번에 압수되지 않도록 정비 번호로 쪼개 둔 것이었다.
CHIPS: [{"t": "새 기록 · 두 곳에서 만든 한 절차", "c": "item"}]
SCENE: {"entryKeys": ["parents-linked-records-v2"], "resultKeys": ["parents-linked-records-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 211 route_market_convoy [0] 장터에서 묶인 다섯 수레 / 무주 터널 D6 590→D6 610 / party=leo weather=fog / IDENTICAL
무주 장터를 지나려는데 손수레 다섯 대가 같은 자리에 묶여 있었다. 씨앗, 소금, 붕대, 편지. 북쪽 마을 셋이 함께 보낸 짐이다.

수레 행렬을 맡은 운송 담당자가 꺼진 검문소를 가리켰다. "차 한 대는 지나가요. 사람이 줄지어 가면 센서가 켜져요."

차단봉 아래 작은 불 하나가 일정하게 깜빡인다. 전광판은 죽었어도 사람을 세는 장치는 아직 살아 있다.

"달구지 한 대처럼 보이게 만들면 돼요." 내가 수레 사이를 재며 말했다.

"묶는다고요? 다섯 대를 다?"

"전부요. 간격까지 맞춰야 해요."
CHOICES: 0:수레를 달구지 뒤에 한 줄로 묶는다 (enabled) | 1:폐차 차양 아래에서 통과 순서를 맞춘다 (enabled)
CHOSEN: 수레를 달구지 뒤에 한 줄로 묶는다
RESULT: 긴 밧줄 하나에 수레 다섯 대를 간격 맞춰 묶었다. 각 수레에는 브레이크를 잡을 사람이 한 명씩 붙었다.

"우리가 멈추면 다 멈추고, 우리가 가면 한 박자 뒤에 갑니다."

제각각이던 짐이 하나의 긴 차량처럼 보이기 시작했다.
CHIPS: [{"t": "전세 우세 +1", "c": "plus"}, {"t": "20분 경과", "c": ""}]
SCENE: {"entryKeys": ["route-market-convoy"], "resultKeys": ["route-market-convoy"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 214 route_market_mask [0] 한 대처럼 보이기 / 무주 터널 D6 610→D6 630 / party=leo weather=fog / IDENTICAL
행렬이 검문선 앞에 섰다. 전광판은 죽어 있는데, 센서만 천천히 좌우로 움직였다.

세 번째 수레의 아이가 물었다. "뛰면 더 빨리 지나갈 수 있죠?"

"아니. 오늘은 안 뛰는 게 제일 빨라."

"왜요?"

"…그건 지나고 나서 설명해줄게."

달구지 천막을 길게 풀어 뒤 수레까지 덮자, 서로 다른 다섯 짐이 한 몸처럼 이어졌다.
CHOICES: 0:천막과 반사판으로 차량 윤곽을 잇는다 (enabled) | 1:각 수레의 움직임을 손신호로 맞춘다 (enabled) | 2:달구지 발전기로 센서 주기를 흐트러뜨린다 (enabled)
CHOSEN: 천막과 반사판으로 차량 윤곽을 잇는다
RESULT: 천막 끝에 낡은 반사판을 달았다. 센서가 훑을 때마다 빛은 달구지 뒤쪽까지 한 줄로 이어졌다. 화면에 「장축 화물차」라는 오래된 분류가 잠깐 떴다.
CHIPS: [{"t": "전세 우세 +1", "c": "plus"}, {"t": "◎ 읽어낸 틈 · 센서가 한 차량으로 보는 긴 윤곽", "c": "plus"}, {"t": "고철 -1", "c": "minus"}, {"t": "20분 경과", "c": ""}]
SCENE: {"entryKeys": ["route-market-convoy"], "resultKeys": ["route-market-convoy"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 217 route_market_pass [0] 차단봉 아래의 통과 순서 / 무주 터널 D6 630→D6 650 / party=leo weather=fog / IDENTICAL
달구지 앞바퀴가 검문선을 넘었다. 차단봉은 반쯤 열린 채 떨리고 있다. 첫 수레는 지났고, 셋째 수레가 낮은 봉 아래에서 짐에 걸렸다.

수레를 끌던 운송 담당자가 뒤에서 말했다. "짐을 여기 두면 사람들만 먼저 건널 수 있어요."

"뭘 두고 가요?"

"씨앗하고 약이요."

무주 장터 대표가 고개를 저었다. "저 씨앗은 내년 봄 농사에 쓸 겁니다. 사람도 짐도 함께 건너야 이 장터가 계속돼요."

센서 불이 노란색으로 바뀌었다. 이제 오래 멈출 수 없다.
CHOICES: 0:달구지로 봉을 받치고 수레를 밀어낸다 (enabled) | 1:짐 높이를 낮추고 전원이 손으로 넘긴다 (enabled)
CHOSEN: 달구지로 봉을 받치고 수레를 밀어낸다
RESULT: 달구지 지붕 가드를 봉 아래에 밀어 넣었다. 차체가 끼익 울었지만 봉이 손 한 뼘 올라갔다. 다섯 수레가 하나씩 빠져나왔다.

마지막 사람이 넘어오자 센서가 다시 초록으로 돌아갔다. 이름 하나 남기지 않고, 봄에 심을 씨앗은 전부 건넜다.
CHIPS: [{"t": "물 +2", "c": "plus"}, {"t": "식량 +2", "c": "plus"}, {"t": "차체 -2%", "c": "minus"}, {"t": "20분 경과", "c": ""}, {"t": "사기 0", "c": ""}, {"t": "전술 연계 · 사기 +1", "c": "plus"}, {"t": "호송 목표 달성 · 행동 기록 저장", "c": "plus"}, {"t": "새 기록 · 다섯 수레의 장터길", "c": "item"}]
SCENE: {"entryKeys": ["route-market-convoy"], "resultKeys": ["route-market-convoy"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 221 rq_jaeyi_join [0] 리어카를 접어 싣는 날 / 무주 터널 D6 650→D6 650 / party=leo weather=fog / IDENTICAL
재이는 가족 상자를 다시 풀지 않는다. 대신 한 구간 동안 임시로 묶어 둔 끈을 풀어, 달구지 고정 레일에 맞게 길이를 잰다. 레일 한 칸의 폭을 장부 귀퉁이에 적는다.

"리어카 탈 땐 매일 저녁 짐을 전부 다시 묶었어요. 매듭이 여덟 개. 매일 여덟 개였어요. 무슨 일 생기면 바로 끌고 가려고."

"오늘은 왜 안 풀어요?"

재이가 레일의 오래된 볼트를 손톱으로 긁는다. 녹이 조금 떨어진다. 대답은 그다음에 나왔다.

"…내일도 여기 있을 수 있으면, 안 풀어도 되잖아요."

"그럼 서울까지 쓸 자리를 만들죠. 가족 상자도, 리어카도 같이 가게."

재이는 줄자를 접고 고정 레일의 빈칸을 짚었다.

"저, 이 레일 한 칸 써도 돼요? 리어카는 접어서 지붕 밑에 걸게요."
CHOICES: 0:리어카부터 같이 접는다 (enabled)
CHOSEN: 리어카부터 같이 접는다
RESULT: 리어카 손잡이와 바퀴를 분리해 접었다. 지붕 아래에 댈 폭을 재고, 가족 상자가 들어갈 마른 자리도 찾아 뒀다. 짐은 아직 차 옆에 모여 있었다.

재이가 접힌 손잡이의 볼트를 조인다. 조이고 나서도 렌치를 놓지 않는다. "…서울까지 안 풀어도 되겠네요."

"더 좋은 자리가 생기면 그때 다시 고쳐요."

재이가 접힌 리어카를 한 번 흔들어 본다. 소리가 안 나자 한 번 더 흔든다. "좋아요. 버린 건 없어요. 모양만 바뀐 거고."
CHIPS: []
SCENE: {"entryKeys": ["recruit-jaeyi-join"], "resultKeys": ["recruit-jaeyi-join-decision"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 227 talk_jy_01 [0] 재이 — 감정 수업 / 무주 터널 D6 650→D6 650 / party=leo,jaeyi weather=fog / IDENTICAL
"이거 얼마짜리게요?" 재이가 길에서 주운 녹슨 문고리를 내밀었다. "아, 힌트 없어요. 힌트 있으면 재미없으니까."

시험이다.
CHOICES: 0:진지하게 감정해본다 (enabled) | 1:"모르겠는데요" (enabled)
CHOSEN: 진지하게 감정해본다
RESULT: "음… 고철 반 덩이?"

"땡. 두 덩이." 재이가 문고리 뒤쪽을 문질러 보였다. "여기 노란 거 보여요? 황동이에요. 겉만 보면 철로 알기 쉬워요."

"그럼 닦아서 파는 게 낫겠네요."

"맞아요. 그건 맞혔어요." 재이가 문고리를 내 손에 다시 놓고 걸레를 찾았다.
CHIPS: [{"t": "재이 사기 +4", "c": "plus"}, {"t": "새 기록 · 문고리 감정", "c": "item"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-road-v1"], "resultKeys": ["comp-talk-jaeyi-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 233 crisis_nofuel2 [0] 또, 연료 바닥 / 무주 터널 D6 680→D6 1220 / party=leo,jaeyi weather=fog / IDENTICAL
무주 터널에 차를 세워 둔 채 연료통을 확인했다. 남은 양으로는 다음 길을 안심하고 나설 수 없다.

주변에서 기름을 구하거나 지나가는 차에 도움을 청해야 한다. 기름통을 꺼내 차 옆에 놓았다.
CHOICES: 0:다시 걷는다 (enabled) | 1:지나가는 차를 기다린다 (enabled)
CHOSEN: 다시 걷는다
RESULT: 처음 들른 농가는 문이 잠겨 있었다. 두 집을 더 지나서야 경운기 기름을 나눠 받았다.

"조심혀. 요즘 길에 서 있는 차는 위에서 다 세어 간다니께."

아홉 시간 만에 돌아왔다. 다리보다 마음이 더 무겁다.
CHIPS: [{"t": "연료 +8L", "c": "plus"}, {"t": "물 -3", "c": "minus"}, {"t": "식량 -3", "c": "minus"}, {"t": "9시간 경과", "c": ""}, {"t": "피로 +18", "c": "minus"}, {"t": "사기 -6", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 237 camp_5_leo [1] 기타 옆의 두 사람 / 무주 터널 D6 1220→D6 1250 / party=leo,jaeyi weather=fog / IDENTICAL
검문소 앞에 늘어서 있던 수레들이 떠오른다. 하려던 일은 해냈다.
레오가 발로 기타 케이스를 밀어 자리를 낸다. 보리는 꿈쩍하지 않는다.
보리는 안 비킨대요. 우리 둘이 좀 좁게 앉죠.
CHOICES: 0:물 1을 나눠 마시며 조용히 곁에 앉는다 (enabled) | 1:레오와 오늘 들은 소리로 박자를 맞춘다 (enabled)
CHOSEN: 레오와 오늘 들은 소리로 박자를 맞춘다
RESULT: 레오가 두 번 두드리면 내가 한 번 받았다. 몇 번 하다 서로 순서를 잊었다.

"처음부터?"

둘 다 손을 들었다가 그냥 웃었다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "레오 유대 +2", "c": "item"}, {"t": "레오의 여분 기타 줄 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 241 crisis_hungry [0] 주린 배 / 무주 터널 D7 390→D7 510 / party=leo,jaeyi weather=clear / IDENTICAL
끼니를 거른 탓에 속이 쓰리다. 식량통을 다시 열어 봤다.

차 안이 조용하다. 배고픔은 소리부터 죽인다.
CHOICES: 0:주변에서 먹을 것을 찾는다 (enabled) | 1:버틴다 (enabled)
CHOSEN: 주변에서 먹을 것을 찾는다
RESULT: 밭이었던 곳에서 야생 감자와 쑥을 캤다. 흙맛 반 감자맛 반. 그래도 배는 속일 수 있었다.
CHIPS: [{"t": "물 -1", "c": "minus"}, {"t": "식량 +2", "c": "plus"}, {"t": "2시간 경과", "c": ""}, {"t": "허기 2→1", "c": "plus"}]
SCENE: {"entryKeys": ["event-crisis-exhaustion"], "resultKeys": ["event-crisis-exhaustion"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 245 talk_leo_02 [1] 레오 — 별명 공장 / 무주 터널 D7 510→D7 510 / party=leo,jaeyi weather=clear / IDENTICAL
"대장님은 별명이 뭐였어요?" 레오가 물었다. 대답도 하기 전에 눈이 반짝인다.

"아니다, 제가 지어줄게요. 저 별명 잘 지어요."
CHOICES: 0:맡겨본다 (enabled) | 1:"다른 별명은요?" (enabled)
CHOSEN: "다른 별명은요?"
RESULT: "보리는 별명이 열두 개예요. 요일별로 달라요. 월요일엔 털뭉치, 화요일엔 코감독…"

진짜로 열두 개를 다 외웠다. 이 사람의 사랑은 목록형이다.
CHIPS: [{"t": "사기 +1", "c": "plus"}, {"t": "레오 사기 +3", "c": "plus"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 249 talk_jy_14 [0] 재이 — 지도의 가격표 / 무주 터널 D7 510→D7 510 / party=leo,jaeyi weather=clear / IDENTICAL
재이가 내 지도에 조그만 표시들을 하고 있다. 동그라미, 세모, 별.

"제 방식의 지도예요. 가치 지도."
CHOICES: 0:"기호 뜻이 뭐예요?" (enabled)
CHOSEN: "기호 뜻이 뭐예요?"
RESULT: "동그라미는 물건 많은 곳, 세모는 위험 대비 수익 낮은 곳. 별은—"

"별이 제일 비싼 데예요?"

"아니요, 별은 값이랑 아예 상관없어요." 재이가 별 몇 개를 짚었다. 국숫집, 소식벽, 씨앗 도서관. "다시 가고 싶은 곳이요."

"세모는 왜 이렇게 적어요."

"어차피 안 갈 데라 안 그렸어요. …근데 그리는 게 맞겠네. 안 갈 데를 알아야 안 가죠." 재이가 펜 뚜껑을 딸깍거리다 세모 하나를 더 찍었다.

그래도 별이 제일 많았다.
CHIPS: [{"t": "재이 사기 +4", "c": "plus"}, {"t": "새 기록 · 가치 지도", "c": "item"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 255 story_family_principle [0] 예측은 명령이 아니다 / None D7 662→D7 662 / party=leo,jaeyi weather=clear / IDENTICAL
폐휴게소 보관망에서 오래된 영상 한 조각이 살아났다. 정식 발표 영상이 아니었다. 발표 전날, 아빠가 카메라를 들고 엄마의 예상 질문을 받아 주던 연습 기록이었다.

"다시. 이번엔 내가 제일 까다로운 심사관 할게. 천리안 예측이 92퍼센트나 맞는데, 왜 매번 사람 손을 거쳐야 합니까?"

엄마가 화면 밖의 아빠를 흘겨봤다.

"그 질문 세 번째야."

"실제로 세 번 나올 것 같아서."

"그럼 세 번 답하지 뭐. 틀린 여덟 명은 어떻게 할 건데? 그리고 맞혔다고 해도 아직 하지 않은 일로 집 문부터 잠글 수는— 잠깐, 카메라 빨간 불 들어와 있어?"

화면이 잠깐 흔들렸다. 아빠가 뭐라고 웅얼거리며 각도를 고쳤다. 엄마는 그사이 물을 한 모금 마셨다.

"좋아. 다시. 그러면 제안은 천리안 종료?"

"아니. 병원 전력도, 교통도, 산불 감시도 그대로 둬. 사람을 쫓아내거나 길을 막는 명령만 세우는 거야. 화면에 이유를 띄우고, 책임질 사람이 이름을 쓰고, 당사자가 이의를 제기할 때까지."

아빠가 카메라를 조금 내렸다.

"서명만 하고 읽지도 않으면?"

"누가 언제 어떤 근거로 눌렀는지 남겨야지. 나중에 '천리안이 그랬다'고 빠져나가지 못하게."

"천리안이 순순히 받아들일까?"

"허락받을 수정이면 우리가 밤새 이러고 있겠어? 강제 명령은 이 절차를 안 거치면 아예 못 나가게 고치는 거야."

아빠가 작게 웃었다. "그건 발표 때 빼자."

"왜. 제일 솔직한데."

화면에는 의사, 기술자, 아이, 수리공의 이름 대신 미래에 미칠 영향과 위험 점수가 붙어 있었다. 엄마가 그 화면을 가리키려는 순간 영상이 끊겼다. 내가 어릴 때는 보지 못했던 부모님의 마지막 발표 연습이었다.
CHOICES: 0:끊긴 다음 문장을 찾아 복원한다 (enabled) | 1:천리안의 분류 화면까지 함께 저장한다 (enabled)
CHOSEN: 끊긴 다음 문장을 찾아 복원한다
RESULT: 잡음을 걷어 내자 엄마의 말끝이 돌아왔다.

"사유 공개, 책임자 서명, 당사자 이의 제기. 이 셋 중 하나라도 없으면 차는 출발 못 합니다."

영상은 그 자리에서 멎었다. 나는 출발 때 챙긴 부모님의 이송표를 펼쳤다. 엄마가 손가락으로 짚던 칸이 내 종이에도 있었다. 비어 있었다.
CHIPS: [{"t": "레오 사기 +1", "c": "plus"}, {"t": "재이 사기 +2", "c": "plus"}, {"t": "새 기록 · 예측은 명령이 아니다", "c": "item"}, {"t": "◈ 예측과 명령 사이 · 확인", "c": "item"}, {"t": "기억됨 · 부모님이 남긴 문장의 끝을 복원했다.", "c": "item"}]
SCENE: {"entryKeys": ["story-family-principle-review-v1", "intro-parents-discovery"], "resultKeys": ["story-family-principle-review-v1", "intro-parents-discovery"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 260 crisis_nofuel3 [0] 익숙해진 빈 탱크 / 김천 갈림길 D7 718→D7 1318 / party=leo,jaeyi weather=clear / IDENTICAL
김천 갈림길에 차를 세워 둔 채 연료통을 확인했다. 남은 양으로는 다음 길을 안심하고 나설 수 없다.

주변에서 기름을 구하거나 지나가는 차에 도움을 청해야 한다. 기름통을 꺼내 차 옆에 놓았다.
CHOICES: 0:걷는 수밖에 없다 (enabled) | 1:지나가는 차에 연료 지원을 부탁한다 (enabled)
CHOSEN: 걷는 수밖에 없다
RESULT: 기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS: [{"t": "연료 +8L", "c": "plus"}, {"t": "물 -3", "c": "minus"}, {"t": "식량 -2", "c": "minus"}, {"t": "10시간 경과", "c": ""}, {"t": "피로 +22", "c": "minus"}, {"t": "사기 -7", "c": "minus"}, {"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 264 camp_6_jaeyi [1] 상자를 내리지 않고 / 김천 갈림길 D7 1318→D7 1363 / party=leo,jaeyi weather=clear / NEW TEXT
검문소 앞에 늘어서 있던 수레들이 떠오른다. 하려던 일은 해냈다.
재이가 상자 끈을 풀지 않은 채 줄자를 건넨다.
지난번 표시한 자리요. 여기 조금만 옮기면 다리 펴져요. 반대쪽 잡아 주실래요?
CHOICES: 0:상자를 지탱하고 재이가 고른 간격으로 다시 묶는다 (enabled) | 1:고철 2로 상자가 들어갈 선반을 더 단다 (enabled)
CHOSEN: 고철 2로 상자가 들어갈 선반을 더 단다
RESULT: 남은 앵글로 상자 위에 선반을 걸었다. 재이가 높이를 묻기도 전에 답한다.

"22cm. 다음 것도 같은 규격으로 달아요."

"다음 것도?"

재이는 볼트를 받아 조인다. "아직 주울 게 많잖아요. 여기까지 왔는데."
CHIPS: [{"t": "고철 -2", "c": "minus"}, {"t": "45분 경과", "c": ""}, {"t": "재이 유대 +2", "c": "item"}, {"t": "재이의 발견물 상자 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 268 crisis_hungry [0] 주린 배 / 김천 갈림길 D8 390→D8 510 / party=leo,jaeyi weather=clear / IDENTICAL
끼니를 거른 탓에 속이 쓰리다. 식량통을 다시 열어 봤다.

차 안이 조용하다. 배고픔은 소리부터 죽인다.
CHOICES: 0:주변에서 먹을 것을 찾는다 (enabled) | 1:버틴다 (enabled)
CHOSEN: 주변에서 먹을 것을 찾는다
RESULT: 밭이었던 곳에서 야생 감자와 쑥을 캤다. 흙맛 반 감자맛 반. 그래도 배는 속일 수 있었다.
CHIPS: [{"t": "물 -1", "c": "minus"}, {"t": "식량 +2", "c": "plus"}, {"t": "2시간 경과", "c": ""}, {"t": "허기 3→2", "c": "plus"}]
SCENE: {"entryKeys": ["event-crisis-exhaustion"], "resultKeys": ["event-crisis-exhaustion"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 272 talk_leo_07 [0] 레오 — 가사 회의 / 김천 갈림길 D8 510→D8 510 / party=leo,jaeyi weather=clear / IDENTICAL
"400km 2절이 막혔어요." 레오가 수첩을 내밀었다. 가사가 절반쯤 쓰이다 멎어 있다.

"대장님이라면 여기 뒤에 뭐라고 쓸 거예요?"
CHOICES: 0:진지하게 한 줄 보탠다 (enabled) | 1:"막힐 땐 쉬어야죠" (enabled)
CHOSEN: 진지하게 한 줄 보탠다
RESULT: 오래 고민해서 한 줄을 냈다. 레오가 소리 내어 불러보더니 눈이 커졌다.

"…이거 되는데요? 어? 이거 되는데? 이거 써도 돼요?" "얼마든지요." "그럼 대장님도 이제 공동 작사가예요. 저작권료는 고철로 정산할게요."

내 한 줄이 노래에 박혔다. 세상 어딘가에서 이 노래가 불릴 때마다, 그 한 줄은 내 것이다.
CHIPS: [{"t": "레오 사기 +5", "c": "plus"}, {"t": "새 기록 · 공동 작사가", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-road-v1"], "resultKeys": ["comp-talk-leo-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 276 talk_jy_19 [0] 재이 — 아빠의 마지막 거래 / 김천 갈림길 D8 510→D8 510 / party=leo,jaeyi weather=clear / IDENTICAL
"아빠 마지막 거래가 뭐였는지 알아요?" 재이가 문득 물었다.

"그날 아침, 이웃집에 쌀 한 포대를 줬어요. 값도 안 받고. 「난리 나면 셈은 나중에」 그러면서."

"…나중은 안 왔어요. 근데 그 이웃이 절 한 달을 먹여줬어요. 아빠가 준 쌀로."
CHOICES: 0:"셈이 돌아왔네요. 재이 씨한테" (enabled) | 1:"아버지 장부, 재이 씨가 이어 쓰는 거네요" (enabled)
CHOSEN: "셈이 돌아왔네요. 재이 씨한테"
RESULT: 재이가 천천히 고개를 끄덕였다. 뭔가 말하려다 말고, 수첩 귀퉁이를 접었다 폈다 했다.

"…그래서 저도 가끔 그냥 줘요. 장부엔 아빠 앞으로 달아두고요."

"얼마나 달렸는데요?"

"세어보면 아는데 안 세요." 재이가 수첩을 덮었다. "언젠가 어디선가 돌아오겠죠. 안 돌아와도 되고."
CHIPS: [{"t": "재이 사기 +6", "c": "plus"}, {"t": "새 기록 · 아빠의 계좌", "c": "item"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-road-v1"], "resultKeys": ["comp-talk-jaeyi-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 281 story_family_key [1] 달구지 안의 검증키 / None D8 632→D8 632 / party=leo,jaeyi weather=clear / IDENTICAL
복원한 발표 연습 영상의 첨부 목록에 ‘검증키 분리 절차 4–5쪽’이 남아 있었다. 파일은 비어 있었고 마지막 전송지는 북부 연락소였다.

차를 세우고 계기판을 열었다. 회로도와 배선을 대조해 안쪽의 모듈을 찾았다. 빠진 두 장 없이는 어느 커넥터부터 풀어야 할지 알 수 없었다.

모듈 옆 수납칸에서 가족사진과 아빠의 회로 수첩을 꺼냈다.

「원 설계자 서명 확인용. 코어 현장 단자에 연결할 것.」

「분리 순서를 지킬 것. 차량 배선과 함께 뜯지 말 것.」

수첩 끝에 적힌 음성 파일을 재생했다.

"짐칸은 안 돼. 차 팔면 짐부터 다 내리잖아."

"그럼 어디?"

"계기판 뒤. 고치려고 여는 사람은 선부터 보고 손댈 테니까."

"아버님한테는 얘기해야 해."

공구를 내려놓는 소리가 났다.

"응. 차는 계속 움직이게 해 달라고."

"당신 설명서도 같이 넣어. 혼자만 알아보게 쓰지 말고."

녹음이 끝났다. 수첩의 배선 번호 옆에 할아버지가 갈아 끼운 부품 날짜가 적혀 있었다. 나는 가장 최근 날짜 아래에 오늘 날짜를 썼다. 모듈은 건드리지 않고, 빈 두 쪽의 번호에 동그라미를 쳤다.
CHOICES: 0:사진과 회로 수첩만 먼저 꺼낸다 (enabled) | 1:배선 위치를 표시하고 계기판을 덮는다 (enabled)
CHOSEN: 배선 위치를 표시하고 계기판을 덮는다
RESULT: 선을 빼는 대신 수첩에 색과 위치를 다시 표시했다. 할아버지에게 배운 방식이었다. 모르면 건드리지 말고, 먼저 표시한다.

계기판을 덮기 전 모듈 아래 각인이 보였다.

「실행 전 인간 확인」

이제 필요한 것은 각인을 읽는 일이 아니라, 모듈을 망가뜨리지 않고 꺼낼 마지막 두 장이었다.
CHIPS: [{"t": "사기 +3", "c": "plus"}, {"t": "새 기록 · 실행 전 인간 확인", "c": "item"}]
SCENE: {"entryKeys": ["family-verification-key"], "resultKeys": ["family-verification-key"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 287 crisis_nofuel3 [0] 익숙해진 빈 탱크 / 무주 터널 D8 718→D8 1318 / party=leo,jaeyi weather=clear / IDENTICAL
무주 터널에 차를 세워 둔 채 연료통을 확인했다. 남은 양으로는 다음 길을 안심하고 나설 수 없다.

주변에서 기름을 구하거나 지나가는 차에 도움을 청해야 한다. 기름통을 꺼내 차 옆에 놓았다.
CHOICES: 0:걷는 수밖에 없다 (enabled) | 1:지나가는 차에 연료 지원을 부탁한다 (enabled)
CHOSEN: 걷는 수밖에 없다
RESULT: 기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS: [{"t": "연료 +8L", "c": "plus"}, {"t": "물 -3", "c": "minus"}, {"t": "식량 -2", "c": "minus"}, {"t": "10시간 경과", "c": ""}, {"t": "피로 +22", "c": "minus"}, {"t": "사기 -7", "c": "minus"}, {"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 291 camp_7_leo [1] 기타 옆의 두 사람 / 무주 터널 D8 1318→D8 1348 / party=leo,jaeyi weather=clear / NEW TEXT
김천 갈림길에서 무주 터널까지 온 길을 떠올린다.
레오가 발로 기타 케이스를 밀어 자리를 낸다. 보리는 꿈쩍하지 않는다.
보리는 안 비킨대요. 우리 둘이 좀 좁게 앉죠.
CHOICES: 0:물 1을 나눠 마시며 조용히 곁에 앉는다 (enabled) | 1:레오와 오늘 들은 소리로 박자를 맞춘다 (enabled)
CHOSEN: 레오와 오늘 들은 소리로 박자를 맞춘다
RESULT: 레오가 두 번 두드리면 내가 한 번 받았다. 몇 번 하다 서로 순서를 잊었다.

"처음부터?"

둘 다 손을 들었다가 그냥 웃었다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "레오 유대 +2", "c": "item"}, {"t": "레오의 여분 기타 줄 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 295 up_bench_first [0] 함께 쓰는 한 자리 / 무주 터널 D9 390→D9 390 / party=leo,jaeyi weather=storm / IDENTICAL
후미 좌석의 버클이 바닥으로 내려가 있었다. 공구 가방을 옮기고 안전벨트를 좌석 위로 꺼냈다.

설치할 때는 금속 다리가 홈에 맞는지만 봤다. 함께 타고 보니 앉을 자리보다 발 둘 곳이 먼저 좁아졌다.
CHOICES: 0:좌석과 안전벨트를 점검하고 발밑 짐을 옮긴다 (enabled)
CHOSEN: 좌석과 안전벨트를 점검하고 발밑 짐을 옮긴다
RESULT: 좌석 다리의 볼트를 대각선으로 눌러 확인하고 벨트를 당겨 봤다. 발밑 공구는 고정끈 안으로 옮겼다. 버클을 잠그고 앉아 보니 이번엔 무릎이 가방에 닿지 않았다.
CHIPS: [{"t": "사기 +2", "c": "plus"}]
SCENE: {"entryKeys": ["event-companion-van"], "resultKeys": ["event-companion-van"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 299 talk_bori_03 [0] 보리 — 통역 / 무주 터널 D9 390→D9 390 / party=leo,jaeyi weather=storm / IDENTICAL
보리가 나를 보고 세 번 짖었다. 처음 있는 일이다.

"통역해드릴까요?" 레오가 끼어들었다. "저 보리어 전공이에요."

"전공?"

"경력 여러 해요. 자격증은 없고요."
CHOICES: 0:"통역해줘요" (enabled)
CHOSEN: "통역해줘요"
RESULT: "첫 번째 짖음은 '너', 두 번째는 '냄새가', 세 번째는 '맘에 들어'예요."

"…그걸 어떻게 알아요?" "꼬리 각도요. 45도 이상이면 호의예요."

"45도는 누가 정한 거예요?" "…그건 좀 있다 설명할게요."

설명은 끝내 없었다. 대신 보리 꼬리가 확실히 45도 이상이었다. 공인 통역에 따르면, 나는 오늘 보리에게 정식 승인을 받았다.
CHIPS: [{"t": "사기 +3", "c": "plus"}, {"t": "레오 사기 +2", "c": "plus"}, {"t": "새 기록 · 보리어 통역 공증", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["muju-tunnel"], "resultKeys": ["muju-tunnel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 303 talk_jy_12 [0] 재이 — 아빠 흉내 / 무주 터널 D9 390→D9 390 / party=leo,jaeyi weather=storm / IDENTICAL
"우리 아빠 흉내 보여드릴까요?" 재이가 갑자기 목을 가다듬었다.

헛기침 두 번. 손을 뒷짐. 완성이다.
CHOICES: 0:"보여줘요" (enabled)
CHOSEN: "보여줘요"
RESULT: "어험. 물건은 말이다—" 재이의 목소리가 한 옥타브 내려갔다. "—사연이 반값이다. 사연 없는 물건은… 잠깐만요, 뭐였더라. …반쪽짜리야. 맞다, 반쪽."

흉내가 끝나고 재이가 웃었다. "목소리 잊어버릴까 봐 가끔 해요. 성대모사가 제일 좋은 녹음기예요."

재이는 마지막 문장을 다시 한 번 아버지 목소리로 말한 뒤 헛기침을 풀었다.
CHIPS: [{"t": "재이 사기 +4", "c": "plus"}, {"t": "새 기록 · 성대모사 백업", "c": "item"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 309 story_personal_cache [0] 부모님이 감춘 상자 / None D9 579→D9 579 / party=leo,jaeyi weather=storm / IDENTICAL
폐버스 배차실 책상 밑에서 작은 철제 상자가 나왔다. 어린 시절 가방에 달았던 버스 열쇠고리도 들어 있었다. 그 아래에는 타 버린 발신 릴, 마지막 두 장이 뜯긴 분리 절차 수첩, 이송된 가족들의 증언 카드가 차례로 놓여 있었다. 부모님은 세 가지를 이미 한곳에 모으려 했고, 끝내 다 모으지 못했다.
CHOICES: 0:원본을 길 위 보관망과 함께 대조한다 (enabled) | 1:원본은 숨기고 필요한 부분만 베낀다 (enabled)
CHOSEN: 원본을 길 위 보관망과 함께 대조한다
RESULT: 가장 가까운 이음망 연락소에서 상자 안쪽의 묶음 번호를 알아봤다. 부모님은 피해자이기만 했던 것이 아니라, 흩어진 기록을 북쪽으로 보내던 사람이기도 했다. 원본은 전달자와 함께 대조하기로 했다.
CHIPS: [{"t": "새 기록 · 부모님이 감춘 상자", "c": "item"}]
SCENE: {"entryKeys": ["story-personal-cache-v1"], "resultKeys": ["story-personal-cache-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 314 crisis_nofuel3 [0] 익숙해진 빈 탱크 / 김천 갈림길 D9 653→D9 1253 / party=leo,jaeyi weather=storm / IDENTICAL
김천 갈림길에 차를 세워 둔 채 연료통을 확인했다. 남은 양으로는 다음 길을 안심하고 나설 수 없다.

주변에서 기름을 구하거나 지나가는 차에 도움을 청해야 한다. 기름통을 꺼내 차 옆에 놓았다.
CHOICES: 0:걷는 수밖에 없다 (enabled) | 1:지나가는 차에 연료 지원을 부탁한다 (enabled)
CHOSEN: 걷는 수밖에 없다
RESULT: 기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS: [{"t": "연료 +8L", "c": "plus"}, {"t": "물 -3", "c": "minus"}, {"t": "식량 0", "c": ""}, {"t": "10시간 경과", "c": ""}, {"t": "피로 +22", "c": "minus"}, {"t": "사기 -7", "c": "minus"}, {"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 318 camp_8_jaeyi [0] 상자를 내리지 않고 / 김천 갈림길 D9 1253→D9 1283 / party=leo,jaeyi weather=storm / NEW TEXT
무주 터널에서 김천 갈림길까지 온 길을 떠올린다.
재이가 상자 끈을 풀지 않은 채 줄자를 건넨다.
선반 높이 기억나요? 이십이. 오늘도 재 봤어요. 안 내려앉았더라고요.
CHOICES: 0:상자를 지탱하고 재이가 고른 간격으로 다시 묶는다 (enabled) | 1:고철 2로 상자를 받칠 고정대를 보강한다 (enabled)
CHOSEN: 상자를 지탱하고 재이가 고른 간격으로 다시 묶는다
RESULT: "이만큼이면 돼요?"

재이가 발을 넣어 보고 손가락 하나만큼 더 벌린다.

"지금. 거기서 묶어요."

끈을 당기는 동안 재이는 상자 위에 팔꿈치를 올리고 기다렸다. 어디에 둘지 다시 허락을 구하지 않았다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "재이 유대 +2", "c": "item"}, {"t": "재이의 발견물 상자 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 323 talk_leo_13 [0] 레오 — 첫 팬레터 / 김천 갈림길 D10 390→D10 390 / party=leo,jaeyi weather=storm / IDENTICAL
"저 팬레터 받아본 적 있어요. 한 번." 레오가 기타 케이스 안쪽 주머니에서 접힌 종이를 꺼냈다.

꼬깃꼬깃한 초등학생 글씨다.
CHOICES: 0:읽어본다 (enabled)
CHOSEN: 읽어본다
RESULT: 「아저씨 노래 조아요. 우리 엄마가 아저씨 노래 듣고 우러써요. 슬퍼서 운 거 아니래요.」

"아저씨요?"

"거기 걸리셨어요? 저도 처음엔 거기서 좀…" 레오가 편지를 접다 말았다. "아무튼 지하철역에서 받았어요. 제 데뷔 성적표예요."

"슬퍼서 운 거 아니래요— 이 문장 때문에 계속하는 거예요, 음악. 뒤에 설명을 좀 붙이려다 관뒀어요. 붙이면 이상해져서."

관객 세 명 시절의 훈장은 사탕 두 개와 이 편지였다. 레오가 편지를 케이스 안쪽 주머니에 도로 넣고, 지퍼를 두 번 확인했다.
CHIPS: [{"t": "레오 사기 +5", "c": "plus"}, {"t": "새 기록 · 데뷔 성적표", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-road-v1"], "resultKeys": ["comp-talk-leo-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 327 talk_jy_07 [0] 재이 — 박물관 / 김천 갈림길 D10 390→D10 390 / party=leo,jaeyi weather=storm / IDENTICAL
"꿈이 뭐냐고 물어봐 줘요." 재이가 대놓고 요청했다.

"…꿈이 뭐예요?"

"물어봐 줘서 고마워요. 박물관이요."
CHOICES: 0:"무슨 박물관이요?" (enabled)
CHOSEN: "무슨 박물관이요?"
RESULT: "'보통 물건 박물관'. 국보 말고요. 밥숟가락, 버스 토큰, 다 쓴 몽당연필… 아, 토큰은 벌써 세 개 있다. 아무튼 그런 것만 모으는 데."

"사라지고 나니까 그런 게 제일 보고 싶더라고요." 재이가 전리품 자루를 두드렸다. "지금은 임시 수장고예요. 발로 차면 관람료 받아요."

마침 굴러다니던 숟가락이 발에 걸렸다. 재이는 바로 손을 내밀었다.
CHIPS: [{"t": "재이 사기 +5", "c": "plus"}, {"t": "새 소문 · 보통 물건 박물관", "c": "item"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-road-v1"], "resultKeys": ["comp-talk-jaeyi-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 332 story_generation_speech [1] 서울말 해봐 / None D10 549→D10 549 / party=leo,jaeyi weather=storm / IDENTICAL
장터에서 아이 하나가 국밥 줄의 노인 소매를 잡는다.

"할머니, 서울말 해봐."

"뭘 해."

"서울말요. 저번에 했잖아요."

"저번에 뭘 했다고 그래." 그러면서도 노인은 헛기침을 하고, 오래전 역 이름을 몇 개 또박또박 읽었다. 아이들이 까르르 웃는다. 그중 서울을 본 아이는 없다.

"우리 엄마는 밖에서 쓰지 말랬어." 노인이 말했다. "나는 집에서만 했고. 쟤들은 장날마다 돈 내라네."

아이 하나가 국밥 그릇을 내밀었다. "한 번 더 하면 공짜."
CHOICES: 0:"우리 집 서울말은 어떤데요?" (enabled) | 1:아이에게 어디가 서울인지 묻는다 (enabled)
CHOSEN: 아이에게 어디가 서울인지 묻는다
RESULT: "서울이 어느 쪽인지 알아?"

아이는 잠깐 생각하더니 손가락을 들었다. 북쪽이 아니라 자기 할머니 쪽이었다.

"할머니가 서울인데?"

"아니, 그게 아니라 방향을—"

"할머니가 서울이라니까요."

노인은 웃다가 국밥값을 대신 냈다. 떠나기 전, 아이는 역 이름을 한 번 더 들려 달라고 졸랐다.
CHIPS: [{"t": "사기 +2", "c": "plus"}, {"t": "새 기록 · 사람 안의 서울", "c": "item"}]
SCENE: {"entryKeys": ["story-generation-speech", "story-generation-speech-stations-v1"], "resultKeys": ["story-generation-speech", "story-generation-speech-stations-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 338 crisis_nofuel3 [0] 익숙해진 빈 탱크 / 무주 터널 D10 653→D10 1253 / party=leo,jaeyi weather=storm / IDENTICAL
무주 터널에 차를 세워 둔 채 연료통을 확인했다. 남은 양으로는 다음 길을 안심하고 나설 수 없다.

주변에서 기름을 구하거나 지나가는 차에 도움을 청해야 한다. 기름통을 꺼내 차 옆에 놓았다.
CHOICES: 0:걷는 수밖에 없다 (enabled) | 1:지나가는 차에 연료 지원을 부탁한다 (enabled)
CHOSEN: 걷는 수밖에 없다
RESULT: 기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS: [{"t": "연료 +8L", "c": "plus"}, {"t": "물 -3", "c": "minus"}, {"t": "식량 0", "c": ""}, {"t": "10시간 경과", "c": ""}, {"t": "피로 +22", "c": "minus"}, {"t": "사기 -7", "c": "minus"}, {"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 342 camp_9_leo [1] 기타 옆의 두 사람 / 무주 터널 D10 1253→D10 1283 / party=leo,jaeyi weather=storm / NEW TEXT
김천 갈림길에서 무주 터널까지 온 길을 떠올린다.
레오가 발로 기타 케이스를 밀어 자리를 낸다. 보리는 꿈쩍하지 않는다.
보리는 안 비킨대요. 우리 둘이 좀 좁게 앉죠.
CHOICES: 0:물 1을 나눠 마시며 조용히 곁에 앉는다 (enabled) | 1:레오와 오늘 들은 소리로 박자를 맞춘다 (enabled)
CHOSEN: 레오와 오늘 들은 소리로 박자를 맞춘다
RESULT: 레오가 두 번 두드리면 내가 한 번 받았다. 몇 번 하다 서로 순서를 잊었다.

"처음부터?"

둘 다 손을 들었다가 그냥 웃었다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "레오 유대 +2", "c": "item"}, {"t": "레오의 여분 기타 줄 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 347 talk_leo_08 [0] 레오 — 아빠 / 무주 터널 D11 390→D11 390 / party=leo,jaeyi weather=clear / IDENTICAL
레오가 하모니카를 손안에서 굴리다 이야기를 꺼냈다.

"아빠는 트럭 기사였어요. 전국을 돌았죠. 지금 우리처럼."
CHOICES: 0:듣는다 (enabled)
CHOSEN: 듣는다
RESULT: "어릴 땐 그게 싫었어요. 맨날 없으니까. 근데 오면 꼭 어디 노래를 배워왔어요. 목포 노래, 강릉 노래. 아니, 강릉이었나 삼척이었나. …아무튼 동해안 어디요. '노래가 기념품이야' 그러면서."

"그날, 아빠는 길 위에 있었어요. 어디였는지 몰라요. 그래서 저는…" 레오가 기타 줄을 골랐다. "전국을 돌면서 노래를 모아요. 어딘가에서 아빠가 배운 노래랑 마주칠 것 같아서. 노래는 기념품이니까, 어디선가 남아 있을 거니까."

레오의 지도는 노래로 그려져 있었다.
CHIPS: [{"t": "레오 사기 +6", "c": "plus"}, {"t": "새 기록 · 노래가 기념품이야", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 351 talk_jy_15 [0] 재이 — 목록 12번 / 무주 터널 D11 390→D11 390 / party=leo,jaeyi weather=clear / NEW TEXT
"목록 12번 자리가 비어 있는데요." 재이가 시세 없는 목록을 폈다. "이번엔 대장님이 정해줘요. 뭘 넣을지."
CHOICES: 0:신중하게 하나 고른다 (enabled)
CHOSEN: 신중하게 하나 고른다
RESULT: 오래 고민했다. 두 번쯤 딴 대답을 하려다 말고, 결국 답했다. "이 목록 자체요. 목록을 목록에 넣어요."

재이가 눈을 깜빡이다가 폭소했다. "그거 반칙인데… 맞네. 이 목록이 제일 시세 없네."

12번: 이 목록 (추천인: 대장님). 재이가 적으며 중얼거렸다. "수집 인생 목표가 방금 완성된 기분이에요. 자기 자신을 소장한 컬렉션이라니."
CHIPS: [{"t": "재이 사기 +6", "c": "plus"}, {"t": "새 기록 · 목록 12번=목록", "c": "item"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-road-v1"], "resultKeys": ["comp-talk-jaeyi-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 357 story_generation_theories [0] 빈칸을 둘러싼 세 가설 / None D11 542→D11 542 / party=leo,jaeyi weather=clear / IDENTICAL
폐교 교실 하나를 세 사람이 기록실로 쓰고 있었다.

창가의 남자는 서울 지하수 지도를 펼쳤다. "물 때문이야." 하지만 물이 남은 구역도 비워졌다.

옆자리 노인은 진료 통계를 내밀었다. "질병 때문이야." 하지만 환자가 없던 해에도 이송 방송은 왔다.

작업복을 입은 여자는 시위 전단을 모았다. "통제 때문이야." 하지만 천리안에 협조한 관제사 가족도 같은 길로 내려왔다.

우리가 오기 전에도 다투던 중이었는지, 창가의 남자가 손을 저었다. "그 얘긴 지난달에 끝났잖아." "끝난 게 아니라 자네가 그만한 거지." 노인이 받았고, 여자는 들은 척도 안 했다.

세 사람은 서로의 자료를 바꿔 읽고, 맞지 않는 날짜마다 붉은 줄을 그었다. 칠판에는 세 주장보다 반박이 더 많이 남았다.
CHOICES: 0:공통으로 남은 것을 묻는다 (enabled) | 1:세 가설을 모두 수첩에 남긴다 (enabled)
CHOSEN: 공통으로 남은 것을 묻는다
RESULT: 세 사람이 동시에 이송표의 같은 칸을 짚었다. 「사유」.

비어 있었다.

"가설은 셋인데 공문은 하나야. 누가 맞든, 설명도 없이 내쫓았다는 건 그대로지."

남자가 내 수첩의 세 가설 옆에 날짜를 적고, 노인이 반증 자료의 보관 장소를 덧붙였다.
CHIPS: [{"t": "사기 +1", "c": "plus"}, {"t": "새 기록 · 빈칸을 둘러싼 세 가설", "c": "item"}, {"t": "기억됨 · 세 가설보다 모두에게 남은 빈 사유란을 보았다.", "c": "item"}]
SCENE: {"entryKeys": ["story-generation-theories-cast-v1"], "resultKeys": ["story-generation-theories-cast-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 362 crisis_nofuel3 [0] 익숙해진 빈 탱크 / 김천 갈림길 D11 598→D11 1198 / party=leo,jaeyi weather=clear / IDENTICAL
김천 갈림길에 차를 세워 둔 채 연료통을 확인했다. 남은 양으로는 다음 길을 안심하고 나설 수 없다.

주변에서 기름을 구하거나 지나가는 차에 도움을 청해야 한다. 기름통을 꺼내 차 옆에 놓았다.
CHOICES: 0:걷는 수밖에 없다 (enabled) | 1:지나가는 차에 연료 지원을 부탁한다 (enabled)
CHOSEN: 걷는 수밖에 없다
RESULT: 기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS: [{"t": "연료 +8L", "c": "plus"}, {"t": "물 -3", "c": "minus"}, {"t": "식량 0", "c": ""}, {"t": "10시간 경과", "c": ""}, {"t": "피로 +22", "c": "minus"}, {"t": "사기 -7", "c": "minus"}, {"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 366 camp_10_jaeyi [1] 줄자의 이쪽 끝 / 김천 갈림길 D11 1198→D11 1243 / party=leo,jaeyi weather=clear / NEW TEXT
무주 터널에서 김천 갈림길까지 온 길을 떠올린다.
재이가 줄자의 끝을 내 손에 쥐여 주고 반대편으로 간다.
거기 잡아 주세요. …잡으셨네요. 제가 늦었네.
CHOICES: 0:재이와 짐 사이 간격을 맞추고 끈을 조인다 (enabled) | 1:고철 2로 상자를 받칠 고정대를 보강한다 (enabled)
CHOSEN: 고철 2로 상자를 받칠 고정대를 보강한다
RESULT: 재이가 앵글을 맞대고 볼트 위치를 짚었다.

"여기 잡아요. 제가 조일게요."

상자를 내려놓지 않은 채 받침을 덧댔다. 끝나자 재이가 자기 물건부터 올려 보고 고개를 끄덕였다.
CHIPS: [{"t": "고철 -2", "c": "minus"}, {"t": "45분 경과", "c": ""}, {"t": "재이 유대 +2", "c": "item"}, {"t": "재이의 발견물 상자 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 371 talk_leo_04 [0] 레오 — 신청곡 / 김천 갈림길 D12 390→D12 390 / party=leo,jaeyi weather=clear / IDENTICAL
"신청곡 받아요." 레오가 기타를 고쳐 안았다. "뭐든. 모르는 노래면 즉석에서 만들어드려요."
CHOICES: 0:옛날 노래를 신청한다 (enabled) | 1:"오늘 기분을 노래로 불러줘요" (enabled)
CHOSEN: 옛날 노래를 신청한다
RESULT: 제목을 말하자 레오가 첫 소절을 더듬더듬 찾아냈다. "이건가? …아니네. 잠깐만요. …이거다."

가사가 틀리고 코드가 미끄러졌지만— 다 부를 때쯤엔 나도 같이 부르고 있었다. 노래는 정확한 것보다 같이 부르는 게 이기는 거라고, 레오가 말했다.
CHIPS: [{"t": "사기 +2", "c": "plus"}, {"t": "레오 사기 +3", "c": "plus"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 375 talk_jy_03 [0] 재이 — 흥정의 기술 / 김천 갈림길 D12 390→D12 390 / party=leo,jaeyi weather=clear / IDENTICAL
"다음 정착지에서 제가 흥정하는 거 잘 봐요." 재이가 어깨를 폈다. "오늘 기술 하나 공개할 거니까."
CHOICES: 0:"미리 가르쳐줘요" (enabled)
CHOSEN: "미리 가르쳐줘요"
RESULT: "첫째, 갖고 싶은 건 세 번째로 물어봐요. 첫 번째로 물으면 값이 두 배 돼요."

"둘째… 둘째 뭐였지. 아, 걸어 나갈 준비. 걸어 나갈 준비가 된 사람이 이겨요. 셋째가 제일 중요한데—" 재이가 뜸을 들이다 씩 웃었다. "정말 좋은 물건이면 흥정하지 마요. 부르는 값 주고 사요. 그 주인이랑은 오래 봐야 하니까."

흥정의 기술 최종장이 흥정 포기라는 게 이 바닥의 깊이다.
CHIPS: [{"t": "재이 사기 +4", "c": "plus"}, {"t": "새 기록 · 흥정 3원칙", "c": "item"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-road-v1"], "resultKeys": ["comp-talk-jaeyi-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 380 patrol_toll [2] 불 꺼진 검문소 / None D12 512→D12 557 / party=leo,jaeyi weather=clear / IDENTICAL
톨게이트처럼 생긴 오래된 검문소가 안개 속에 걸려 있다. 불은 꺼졌는데 차단봉만 새것처럼 반듯하다.

센서 기둥 하나가 천천히 고개를 돌린다. 아직 우리 번호를 읽지는 못했다.
CHOICES: 0:배수로를 따라 제어함까지 붙는다 (enabled) | 1:달구지를 폐기 차량처럼 갓길에 세운다 (enabled) | 2:논길로 멀리 우회한다 (enabled)
CHOSEN: 논길로 멀리 우회한다
RESULT: 한 시간 가까이 논둑을 타고 돌아갔다.

차 안 살림이 모조리 한쪽으로 쏠렸다. 검문 기록은 남지 않았지만, 제어함도 그대로 남았다. 다음에 이 길을 지나는 누군가는 우리가 열어 두지 않은 문 앞에 설 것이다.

돌아와 정리할 일이 하나, 마음에 걸리는 일이 하나 더 생겼다.
CHIPS: [{"t": "연료 -3.078335L", "c": "minus"}, {"t": "차체 -3%", "c": "minus"}, {"t": "45분 경과", "c": ""}, {"t": "사기 -3", "c": "minus"}, {"t": "새 기록 · 열지 않은 제어함", "c": "item"}]
SCENE: {"entryKeys": ["event-ai-checkpoint"], "resultKeys": ["event-ai-checkpoint"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 384 crisis_nofuel3 [0] 익숙해진 빈 탱크 / None D12 561→D12 1161 / party=leo,jaeyi weather=clear / IDENTICAL
엔진이 또 잠들었다.

갓길에 오래 서 있는 차는 눈에 띈다. 사람의 눈에도, 사람이 아닌 것의 눈에도.

<span class="ai">"정지 차량 확인. 반복 패턴 등록."</span>

라디오도 꺼져 있는데, 그 목소리가 들리는 것 같았다.
CHOICES: 0:걷는 수밖에 없다 (enabled) | 1:지나가는 차에 연료 지원을 부탁한다 (enabled)
CHOSEN: 걷는 수밖에 없다
RESULT: 기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS: [{"t": "연료 +8L", "c": "plus"}, {"t": "물 -3", "c": "minus"}, {"t": "식량 0", "c": ""}, {"t": "10시간 경과", "c": ""}, {"t": "피로 +22", "c": "minus"}, {"t": "사기 -7", "c": "minus"}, {"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 388 crisis_drowsy [0] 졸음 / None D12 1165→D12 1285 / party=leo,jaeyi weather=clear / IDENTICAL
눈꺼풀이 천근이다.

차선이 잠깐 두 개로 보였다. 백미러 속 내 눈이 반쯤 감겨 있다.

졸음은 폭풍보다 많은 운전자를 데려갔다. 오래전에도, 지금도.
CHOICES: 0:갓길에서 눈을 붙인다 (2시간) (enabled) | 1:물로 세수하고 버틴다 (enabled) | 2:목청껏 노래를 부르며 강행한다 (enabled)
CHOSEN: 갓길에서 눈을 붙인다 (2시간)
RESULT: 갓길에 차를 세우고 시트를 젖혔다.

눈을 뜨니 두 시간이 지나 있었다. 뻐근한 목을 돌리고 앞유리를 봤다. 아까는 겹쳐 보이던 차선이 하나로 보인다.
CHIPS: [{"t": "2시간 경과", "c": ""}, {"t": "피로 -45", "c": "plus"}, {"t": "사기 +2", "c": "plus"}]
SCENE: {"entryKeys": ["event-crisis-exhaustion"], "resultKeys": ["event-crisis-exhaustion"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 393 camp_11_leo [1] 기타 옆의 두 사람 / 무주 터널 D12 1333→D12 1363 / party=leo,jaeyi weather=clear / NEW TEXT
김천 갈림길에서 무주 터널까지 온 길을 떠올린다.
레오가 발로 기타 케이스를 밀어 자리를 낸다. 보리는 꿈쩍하지 않는다.
보리는 안 비킨대요. 우리 둘이 좀 좁게 앉죠.
CHOICES: 0:물 1을 나눠 마시며 조용히 곁에 앉는다 (enabled) | 1:레오와 오늘 들은 소리로 박자를 맞춘다 (enabled)
CHOSEN: 레오와 오늘 들은 소리로 박자를 맞춘다
RESULT: 레오가 두 번 두드리면 내가 한 번 받았다. 몇 번 하다 서로 순서를 잊었다.

"처음부터?"

둘 다 손을 들었다가 그냥 웃었다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "레오 유대 +2", "c": "item"}, {"t": "레오의 여분 기타 줄 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 398 talk_leo_03 [0] 레오 — 하모니카 / 무주 터널 D13 390→D13 390 / party=leo,jaeyi weather=clear / IDENTICAL
레오가 기타 케이스 주머니에서 낡은 하모니카를 꺼냈다. 닳은 모서리가 손바닥 안에 감겼다.

"아, 그거… 아빠 거예요."
CHOICES: 0:"불 줄 알아요?" (enabled) | 1:조심히 다뤄준다 (enabled)
CHOSEN: "불 줄 알아요?"
RESULT: "조금요." 레오가 하모니카를 닦았다. 닦을 데가 없어 보이는데도 계속 닦다가, 입에 댔다.

트로트도 발라드도 아닌, 오래된 노래가 나왔다. 두 소절만. 세 번째 소절 어귀에서 멈췄다.

"…오늘은 여기까지요. 아빠가 이것만 불었어요. 술 마시면. 잘 부는 노래가 하나면 충분하대요, 사람은." 레오는 하모니카를 도로 주머니에 넣었다. "저는 아직 제 한 곡을 찾는 중이고요."

400km가 그 한 곡이 되려나. 묻지는 않았다.
CHIPS: [{"t": "레오 사기 +4", "c": "plus"}, {"t": "새 기록 · 아빠의 하모니카", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-road-v1"], "resultKeys": ["comp-talk-leo-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 402 talk_jy_13 [0] 재이 — 훔치고 싶었던 것 / 무주 터널 D13 390→D13 390 / party=leo,jaeyi weather=clear / IDENTICAL
"고백 하나 할게요." 재이가 주변을 살피고 목소리를 낮췄다. "저 딱 한 번, 진짜로 훔치고 싶었던 물건이 있어요."
CHOICES: 0:"뭔데요?" (enabled)
CHOSEN: "뭔데요?"
RESULT: "피난 때, 어떤 집 마당에 오르골이 있었어요. 태엽 감으면 돌아가는 발레리나. 주인은 급하게 떠났고, 문은 열려 있고, 아무도 없고."

"…가져왔어요?"

"태엽만 감아주고 나왔어요. 빈집에서 오르골이 도는 게… 뭐랄까. 설명이 잘 안 되네. 그 집한테 마지막 인사 같아서." 재이가 씩 웃었다. "대신 소리는 훔쳤죠. 아직 기억나니까. 소리 도둑까진 합법이에요."
CHIPS: [{"t": "재이 사기 +5", "c": "plus"}, {"t": "새 기록 · 소리 도둑", "c": "item"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-road-v1"], "resultKeys": ["comp-talk-jaeyi-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 407 crisis_nofuel3 [0] 익숙해진 빈 탱크 / 무주 터널 D13 420→D13 1020 / party=leo,jaeyi weather=clear / IDENTICAL
무주 터널에 차를 세워 둔 채 연료통을 확인했다. 남은 양으로는 다음 길을 안심하고 나설 수 없다.

주변에서 기름을 구하거나 지나가는 차에 도움을 청해야 한다. 기름통을 꺼내 차 옆에 놓았다.
CHOICES: 0:걷는 수밖에 없다 (enabled) | 1:지나가는 차에 연료 지원을 부탁한다 (enabled)
CHOSEN: 걷는 수밖에 없다
RESULT: 기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS: [{"t": "연료 +8L", "c": "plus"}, {"t": "물 -2", "c": "minus"}, {"t": "식량 0", "c": ""}, {"t": "10시간 경과", "c": ""}, {"t": "피로 +22", "c": "minus"}, {"t": "사기 -7", "c": "minus"}, {"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 411 camp_12_jaeyi [0] 줄자의 이쪽 끝 / 무주 터널 D13 1020→D13 1050 / party=leo,jaeyi weather=clear / NEW TEXT
김천 갈림길에서 무주 터널까지 온 길을 떠올린다.
재이가 줄자의 끝을 내 손에 쥐여 주고 반대편으로 간다.
거기 잡아 주세요. …잡으셨네요. 제가 늦었네.
CHOICES: 0:재이와 짐 사이 간격을 맞추고 끈을 조인다 (enabled) | 1:고철 2로 느슨해진 고정대를 함께 보강한다 (enabled)
CHOSEN: 재이와 짐 사이 간격을 맞추고 끈을 조인다
RESULT: 재이가 손바닥으로 간격을 재고 고개를 끄덕였다. 나는 끈을 당겼다.

"됐어요. 오늘은 덜 걸렸네."

그녀가 줄자를 접어 둘 사이에 놓았다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "재이 유대 +2", "c": "item"}, {"t": "재이의 발견물 상자 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 416 pair_leo_jy_2 [0] 레오×재이 — 아빠들의 합동 전시 / 무주 터널 D14 390→D14 390 / party=leo,jaeyi weather=clear / IDENTICAL
"재이 씨 박물관에 코너 하나만 줘요." 레오가 말했다. "'아빠들의 물건' 코너."

닦던 걸 계속 닦던 재이의 손이 멈췄다. 멈추고도 한동안 그대로 있었다.
CHOICES: 0:지켜본다 (enabled)
CHOSEN: 지켜본다
RESULT: "하모니카 기증할게요. 관람객이 불어볼 수 있게요. 물건은 쓰여야 사니까."

재이가 얼마간 있다 답했다. "…그럼 저는 창고 열쇠요. 옆에 걸어둘게요."

"전시명은요?"

"전시명은—"

둘이 동시에 말했다. "'잘 부는 노래 하나면 충분하다'." "'줍는 순간 물건이 된다'."

"……."

"…둘 다 걸죠."

전시명이 두 줄인 코너가 기획됐다. 개관일은 안 정했고, 소장품은 두 점이 됐다.
CHIPS: [{"t": "레오 사기 +5", "c": "plus"}, {"t": "재이 사기 +6", "c": "plus"}, {"t": "새 소문 · 아빠들의 물건 코너", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["muju-tunnel"], "resultKeys": ["muju-tunnel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 420 talkr_jy_3 [0] 재이 — 시세 정보 / 무주 터널 D14 390→D14 390 / party=leo,jaeyi weather=clear / IDENTICAL
"최신 시세 정보 들으실 분—" 재이가 수첩을 팔랑였다. 정착지마다 갱신하는 재이의 물가 수첩이다.
CHOICES: 0:브리핑을 받는다 (enabled)
CHOSEN: 브리핑을 받는다
RESULT: "요즘 부품이 강세고, 통조림은 보합, 건전지가 급등이에요. 다음 정착지에선 건전지 팔고 부품 사요."

이 차의 경제 전략가는 뒷자리에 있다. 시키는 대로 하면 대체로 이득이다.
CHIPS: [{"t": "재이 사기 +2", "c": "plus"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-road-v1"], "resultKeys": ["comp-talk-jaeyi-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 426 patrol_toll [2] 불 꺼진 검문소 / None D14 520→D14 565 / party=leo,jaeyi weather=clear / IDENTICAL
톨게이트처럼 생긴 오래된 검문소가 안개 속에 걸려 있다. 불은 꺼졌는데 차단봉만 새것처럼 반듯하다.

센서 기둥 하나가 천천히 고개를 돌린다. 아직 우리 번호를 읽지는 못했다.
CHOICES: 0:배수로를 따라 제어함까지 붙는다 (enabled) | 1:달구지를 폐기 차량처럼 갓길에 세운다 (enabled) | 2:논길로 멀리 우회한다 (enabled)
CHOSEN: 논길로 멀리 우회한다
RESULT: 한 시간 가까이 논둑을 타고 돌아갔다.

차 안 살림이 모조리 한쪽으로 쏠렸다. 검문 기록은 남지 않았지만, 제어함도 그대로 남았다. 다음에 이 길을 지나는 누군가는 우리가 열어 두지 않은 문 앞에 설 것이다.

돌아와 정리할 일이 하나, 마음에 걸리는 일이 하나 더 생겼다.
CHIPS: [{"t": "연료 -4L", "c": "minus"}, {"t": "차체 -3%", "c": "minus"}, {"t": "45분 경과", "c": ""}, {"t": "사기 -3", "c": "minus"}, {"t": "새 기록 · 열지 않은 제어함", "c": "item"}]
SCENE: {"entryKeys": ["event-ai-checkpoint"], "resultKeys": ["event-ai-checkpoint"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 430 water_toll [0] 우물 앞의 줄 / None D14 650→D14 690 / party=leo,jaeyi weather=clear / IDENTICAL
마을 어귀 우물에 줄이 서 있다. 그런데 물을 긷는 사람은 없다.

두레박에 자물쇠가 걸려 있고, 그 옆에 청년 셋이 앉아 있다.

"큰 통 하나에 고철 셋."

"원래 마을 우물 아니에요?"

"마을 사람은 둘." 청년이 대꾸했다. "나머진 손님이고."

줄 선 사람들은 아무 말이 없다. 항의해 본 사람이 이미 없어졌거나, 항의가 소용없다는 걸 배운 얼굴들이다.

우리 물통은 바닥이 보인다.
CHOICES: 0:값을 치른다 (enabled) | 1:줄 선 사람들과 값을 나눠 낸다 (enabled) | 2:자물쇠를 부순다 (enabled)
CHOSEN: 값을 치른다
RESULT: 고철 3을 내고 큰 물통 하나를 채웠다. 보급용 작은 통 네 개 분량이다. 자물쇠가 열리고 다시 잠기는 데 20초.

뒤에 선 아이가 빈 통을 들고 우리를 봤다. 우리가 낸 값이 그 아이의 오늘 몫을 더 비싸게 만들었다는 걸, 우리 둘 다 알았다.
CHIPS: [{"t": "물 +4", "c": "plus"}, {"t": "고철 -3", "c": "minus"}, {"t": "40분 경과", "c": ""}, {"t": "사기 -2", "c": "minus"}]
SCENE: {"entryKeys": ["event-meet-guard"], "resultKeys": ["event-meet-guard"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 434 crisis_nofuel3 [0] 익숙해진 빈 탱크 / None D14 723→D14 1323 / party=leo,jaeyi weather=clear / IDENTICAL
엔진이 또 잠들었다.

갓길에 오래 서 있는 차는 눈에 띈다. 사람의 눈에도, 사람이 아닌 것의 눈에도.

<span class="ai">"정지 차량 확인. 반복 패턴 등록."</span>

라디오도 꺼져 있는데, 그 목소리가 들리는 것 같았다.
CHOICES: 0:걷는 수밖에 없다 (enabled) | 1:지나가는 차에 연료 지원을 부탁한다 (enabled)
CHOSEN: 걷는 수밖에 없다
RESULT: 기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS: [{"t": "연료 +8L", "c": "plus"}, {"t": "물 -3", "c": "minus"}, {"t": "식량 0", "c": ""}, {"t": "10시간 경과", "c": ""}, {"t": "피로 +9.44482", "c": "minus"}, {"t": "사기 -7", "c": "minus"}, {"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 438 crisis_collapse [0] 한계 / None D14 1327→D15 127 / party=leo,jaeyi weather=clear / IDENTICAL
시야 가장자리가 하얗게 번진다.

귀가 먹먹하고, 손끝이 멀다. 몸이 통보한다 — 여기까지.

핸들을 고쳐 쥐고 갓길로 붙인다. 더 가면 안 된다.
CHOICES: 0:… (enabled)
CHOSEN: …
RESULT: 갓길에 차를 세운 것까지는 기억난다.

눈을 뜨니 네 시간이 지나 있었다. 시트에 눌린 팔이 저렸다. 몸을 일으켜 한동안 가만히 앉아 있었다.

조금만 늦게 세웠으면 어쩔 뻔했나.

다시는 이러지 말자. 수첩에도 그렇게 적혀 있었지. 「쉬는 것도 운전이다.」
CHIPS: [{"t": "물 -1", "c": "minus"}, {"t": "4시간 경과", "c": ""}, {"t": "피로 -55", "c": "plus"}, {"t": "레오 사기 -7", "c": "minus"}, {"t": "재이 사기 -4", "c": "minus"}, {"t": "새 기록 · 탈진", "c": "item"}]
SCENE: {"entryKeys": ["event-crisis-exhaustion"], "resultKeys": ["event-crisis-exhaustion"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 467 camp_13_jaeyi [1] 줄자의 이쪽 끝 / 전주 서문 시장 D15 771→D15 816 / party=leo,jaeyi weather=storm / NEW TEXT
무주 터널에서 전주 서문 시장까지 온 길을 떠올린다.
재이가 줄자의 끝을 내 손에 쥐여 주고 반대편으로 간다.
거기 잡아 주세요. …잡으셨네요. 제가 늦었네.
CHOICES: 0:재이와 짐 사이 간격을 맞추고 끈을 조인다 (enabled) | 1:고철 2로 느슨해진 고정대를 함께 보강한다 (enabled)
CHOSEN: 고철 2로 느슨해진 고정대를 함께 보강한다
RESULT: 나는 앵글을 받치고 재이는 볼트를 조였다. 끝나자 둘이 번갈아 흔들어 봤다.

"그만. 차가 먼저 흔들려요."

재이가 내 손에서 공구를 받아 넣었다.
CHIPS: [{"t": "고철 -2", "c": "minus"}, {"t": "45분 경과", "c": ""}, {"t": "재이 유대 +2", "c": "item"}, {"t": "재이의 발견물 상자 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-road-v1"], "resultKeys": ["comp-talk-jaeyi-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 475 pair_leo_jy_1 [0] 레오×재이 — 버스킹 듀오 / 전주 서문 시장 D16 465→D16 465 / party=leo,jaeyi weather=rain / NEW TEXT
"우리 정착지에서 공연해요!" 레오가 제안했다. "재이 씨는 수금 담당이요. 모자 돌리는 거."

"수금이요?"

"수금이요."

"…그거 제일 중요한 파트인 거 알죠?" 재이가 진지해졌다. "모자 각도 3도만 틀어도 수익이 달라져요."

"그런 게 있어요?"

"없어요. 근데 있는 것처럼 하면 사람들이 넣어요."
CHOICES: 0:매니저를 자청한다 (enabled)
CHOSEN: 매니저를 자청한다
RESULT: 다음 정착지 장터에서 세 곡짜리 공연이 열렸다. 레오가 부르고, 재이가 모자를 돌리고, 나는 박수를 유도했다.

수익은 고철 셋, 말린 옥수수 두 개, 그리고 아이가 준 구슬 한 개.

"구슬은 제 수수료예요." 재이가 챙겼다. "이야기 있는 물건이니까."

"그거 규정에 없는데요." "지금 만들었어요." "언제요?" "방금이요."

정산은 끝났는데 둘은 자리를 안 뜨고 다음 공연지를 놓고 계속 떠들었다.
CHIPS: [{"t": "식량 +1", "c": "plus"}, {"t": "고철 +4", "c": "plus"}, {"t": "레오 사기 +4", "c": "plus"}, {"t": "재이 사기 +4", "c": "plus"}, {"t": "새 기록 · 듀오 「모자와 기타」", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["pair-leo-jaeyi-plan-v2", "pair-leo-jaeyi-performance-v1"], "resultKeys": ["pair-leo-jaeyi-plan-v2", "pair-leo-jaeyi-performance-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 479 talk_jy_05 [0] 재이 — 선물 고르기 / 전주 서문 시장 D16 465→D16 465 / party=leo,jaeyi weather=rain / IDENTICAL
"만약에요," 재이가 물었다. "누구한테 선물을 해야 하면, 뭘 고를 거예요?"

질문이 묘하게 구체적이다. 누구 주려고 그러나.
CHOICES: 0:"받는 사람이 자기 돈으론 안 살 물건이요" (enabled) | 1:"고철이요. 실용적이잖아요" (enabled)
CHOSEN: "받는 사람이 자기 돈으론 안 살 물건이요"
RESULT: "아, 그런 거." 재이가 자기 상자를 내려다봤다. "아빠도 그 얘기 했어요. 꼭 필요한 거면 자기가 먼저 사 버린다고."

"그럼 너무 필요한 것만 찾지는 말아야겠네요." 재이는 상자를 열어 물건 두 개를 꺼냈다가 하나를 다시 넣었다. 나는 누구에게 줄 건지 묻지 않았다.
CHIPS: [{"t": "재이 사기 +4", "c": "plus"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-road-v1"], "resultKeys": ["comp-talk-jaeyi-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 483 lc_jeonju_bibim [1] 비빔밥 트럭 / 전주 서문 시장 D16 585→D16 585 / party=leo,jaeyi weather=rain / IDENTICAL
전주 외곽, 짐칸을 주방으로 개조한 트럭.

"전주가 밥의 수도였다는 걸 잊지 않게 하려고 다닙니다."

요리사가 재료를 늘어놓는다. 콩나물, 고사리, 계란— 계란은 아니고 계란이 놓일 자리다.

"없는 건 마음의 눈으로 채우시고요. …아, 숟가락 있으세요? 숟가락은 안 나가요."
CHOICES: 0:한 그릇 비빈다 (고철 4) (enabled) | 1:인사만 하고 길을 나선다 (enabled)
CHOSEN: 인사만 하고 길을 나선다
RESULT: 인사를 하고 달구지로 돌아왔다.
CHIPS: []
SCENE: {"entryKeys": ["event-road-food-truck-v2"], "resultKeys": ["event-road-food-truck-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 487 exp_glasshouse [0] 살아 있는 온실 / 전주 서문 시장 D16 825→D16 825 / party=leo,jaeyi weather=rain / IDENTICAL
유리 온실 단지. 대부분 깨졌는데 한 동만 멀쩡하다.

가까이 가자 안에서 칙— 소리. 스프링클러가 돌고 있다. 전기가 살아 있다.

유리 너머로 웃자란 토마토가 빨갛다.
CHOICES: 0:조용히 수확한다 (enabled) | 1:지나친다 (enabled)
CHOSEN: 조용히 수확한다
RESULT: 토마토와 오이를 배낭 가득 땄다. 스프링클러가 한 번 더 돌며 등을 적셨지만, 그뿐이었다.

누가— 무엇이— 물을 대는지는 생각하지 않기로 했다. 토마토는 죄가 없다.
CHIPS: [{"t": "물 +1", "c": "plus"}, {"t": "식량 +4", "c": "plus"}, {"t": "새 기록 · 살아 있는 온실", "c": "item"}]
SCENE: {"entryKeys": ["event-explore-farm"], "resultKeys": ["event-explore-farm"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 492 story_generation_route [0] 이송로의 제사상 / None D16 947→D16 947 / party=leo,jaeyi weather=rain / IDENTICAL
북쪽으로 갈수록 가드레일 아래 작은 물병이 늘어난다. 오래된 병뚜껑, 새로 구운 종지, 말라붙은 밥 한 술. 표지판에는 페인트 밑으로 「구 이송 7로」가 비친다.

이 길로 내려온 집들은 가족이 서울을 떠난 날마다 물을 놓는다고 했다. 날짜는 집마다 다르다. 백 년 전 날짜도 있고, 십수 년 전 날짜도 있고, 할아버지 수첩에 적힌 날도 있다.

길가에서 병을 놓던 여자가 말했다. "이유는 몰라도 그날 물이 모자랐다는 얘긴 다 똑같아요."
CHOICES: 0:할아버지처럼 경적을 두 번 울린다 (enabled) | 1:물 한 병을 보탠다 (enabled)
CHOSEN: 할아버지처럼 경적을 두 번 울린다
RESULT: 빵. 빵.

어릴 때 할아버지는 이 길목마다 경적을 두 번 울렸다. 물어도 대답하지 않았다. 이제 알 것 같았다. 돌아가신 사람에게 하는 인사이면서, 아직 가는 사람에게 보내는 생존 신호였다.

멀리 다른 차가 두 번 답했다.
CHIPS: [{"t": "사기 +4", "c": "plus"}, {"t": "새 기록 · 이송로의 두 번", "c": "item"}]
SCENE: {"entryKeys": ["story-generation-route"], "resultKeys": ["story-generation-route"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 496 perimeter_first [0] 위수 구역 / 논산 평야 D16 1066→D16 1066 / party=leo,jaeyi weather=rain / IDENTICAL
도로 한복판에— 그것이 서 있다.

4족 보행기. 소만 한 크기. 도색은 관공서 회색. 몸통의 렌즈가 차를 향해 조리개를 조인다.

<span class="ai">"정지. 위수 구역입니다."</span>

차를 훑는 초록 스캔선. 그리고—

탕. 경고사격이 차 옆 아스팔트를 때렸다. 기계가 처음으로, 우리에게 무기를 겨눴다.

<span class="ai">"등록되지 않은 차량. 다음 확인 시 회차를 강제합니다. 좋은 하루 되세요."</span>

보행기는 유유히 갓길로 물러나 도로를 열어줬다.
CHOICES: 0:…지나간다 (enabled)
CHOSEN: …지나간다
RESULT: 보행기가 물러난 뒤에도 한동안 핸들을 놓지 못했다. 그제야 생각이 문장으로 굳었다.

남쪽은 그것의 '바깥'이었다. 여긴 '안'이다.

차에서 내려 옆판을 살폈다. 경고탄에 튄 아스팔트 파편이 외판을 찍고 지나갔다. 패인 자국을 장갑 낀 손으로 쓸어 봤다.

뒤 칸의 고철과 공구를 손 닿는 곳으로 옮겼다. 맨손으로 다닐 땅이 아니었다.
CHIPS: [{"t": "차체 -6%", "c": "minus"}, {"t": "관측 +1", "c": "minus"}, {"t": "새 기록 · 첫 경고사격", "c": "item"}]
SCENE: {"entryKeys": ["combat-walker-watch-v1"], "resultKeys": ["combat-walker-watch-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 500 exp_outdoor [1] 등산용품점 / 논산 평야 D16 1186→D16 1186 / party=leo,jaeyi weather=rain / IDENTICAL
등산로 입구의 아웃도어 매장. 오래전 세일 현수막이 아직 걸려 있다. 「전 품목 40%」

선반은 반쯤 털렸지만 등산객이 아니면 안 가져갈 것들이 남았다.
CHOICES: 0:실속을 챙긴다 (고철 2) (enabled) | 1:물건을 그대로 두고 나온다 (enabled)
CHOSEN: 물건을 그대로 두고 나온다
RESULT: 선반을 한 번 더 보고 빈손으로 나왔다. 지금은 차에 있는 물건부터 써야 한다.
CHIPS: []
SCENE: {"entryKeys": ["event-explore-retail"], "resultKeys": ["event-explore-retail"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 504 camp_14_leo [1] 기타 옆의 두 사람 / 논산 평야 D16 1186→D16 1216 / party=leo,jaeyi weather=rain / NEW TEXT
전주 서문 시장에서 논산 평야까지 온 길을 떠올린다.
레오가 발로 기타 케이스를 밀어 자리를 낸다. 보리는 꿈쩍하지 않는다.
보리는 안 비킨대요. 우리 둘이 좀 좁게 앉죠.
CHOICES: 0:물 1을 나눠 마시며 조용히 곁에 앉는다 (enabled) | 1:레오와 오늘 들은 소리로 박자를 맞춘다 (enabled)
CHOSEN: 레오와 오늘 들은 소리로 박자를 맞춘다
RESULT: 레오가 두 번 두드리면 내가 한 번 받았다. 몇 번 하다 서로 순서를 잊었다.

"처음부터?"

둘 다 손을 들었다가 그냥 웃었다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "레오 유대 +2", "c": "item"}, {"t": "레오의 여분 기타 줄 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 509 talk_leo_06 [0] 레오 — 밝음의 정체 / 논산 평야 D17 390→D17 390 / party=leo,jaeyi weather=rain / IDENTICAL
"레오는 무서운 거 없어요?" 지나가듯 물었는데, 레오의 기타 소리가 잠깐 멎었다.

"…있죠. 많죠."
CHOICES: 0:"근데 왜 맨날 웃어요?" (enabled)
CHOSEN: "근데 왜 맨날 웃어요?"
RESULT: "안 웃으면 티 나잖아요." 레오가 기타 줄을 한 번 훑었다. 끝 음이 떨렸다.

"처음 공연할 때도 그랬어요. 손이 안 멈춰서 그냥 관객한테 웃었거든요. 그랬더니 한 분이 웃어줬어요. 좀 낫더라고요."

줄을 다시 눌렀다. 이번엔 소리가 길게 났다. "대장님도 가끔 웃어줘요. 재미없어도. 아, 너무 재미없으면 말은 해주시고요."

나는 고개를 끄덕였다. 레오는 잠깐 내 쪽을 보고, 멈췄던 노래를 이어 갔다.
CHIPS: [{"t": "레오 사기 +5", "c": "plus"}, {"t": "새 기록 · 직업 정신", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 513 talk_jy_02 [0] 재이 — 첫 수집품 / 논산 평야 D17 390→D17 390 / party=leo,jaeyi weather=rain / IDENTICAL
"제 첫 수집품이 뭐게요?" 재이가 퀴즈를 냈다. 힌트: 지금도 갖고 있음.
CHOICES: 0:"열쇠요?" (enabled) | 1:"병뚜껑 같은 거요?" (enabled)
CHOSEN: "열쇠요?"
RESULT: "땡. 열쇠는 수집품이 아니에요." 재이의 목소리가 살짝 낮아졌다가 돌아왔다.

"정답은 병뚜껑. 여섯 살 때 아빠 창고에서 주운 사이다 뚜껑." 재이가 지갑을 뒤졌다. 안쪽 칸, 그 안쪽 칸. "어디 갔— 아, 여기 있다." 납작하게 눌린 별 모양.

"아빠가 그랬어요. 줍는 순간 쓰레기가 물건이 된다고. 제 인생 이론이에요."
CHIPS: [{"t": "재이 사기 +4", "c": "plus"}, {"t": "새 기록 · 사이다 뚜껑", "c": "item"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 519 cleaners_recall [2] 회수조 / None D17 552→D17 552 / party=leo,jaeyi weather=rain / IDENTICAL
갓길에 흰 옷 넷이 서 있다. 정리자들. 그 앞에 낡은 승합차 한 대와, 차에서 내리지 않으려는 여자 하나.

"이탈자 회수 중입니다." 선두의 남자가 우리 차에 손바닥을 들어 보였다. 지나가라는 뜻이다.

"동생분이 그분 곁을 그리워하십니다." 남자의 목소리는 부드러웠다. 여자의 얼굴은 그렇지 않았다.

"저는 안 그리워요." 여자가 말했다. 남자는 미소를 지우지 않았다. "돌아가면 기억나실 겁니다."

협박도 무기도 없다. 다만 넷이 한 사람을 둘러싸고, 부드럽게, 계속, 서 있을 뿐이다.
CHOICES: 0:차에서 내려 여자 옆에 선다 (enabled) | 1:"본인이 싫다잖아요" — 창문만 내리고 말한다 (enabled) | 2:지나간다 (enabled)
CHOSEN: 지나간다
RESULT: 속도를 줄이지 않았다.

백미러 속에서 흰 옷 넷이 여자를 향해 반걸음씩 좁혀 들었다. 부드럽게. 계속.

그 여자는 결국 끌려갔을까. 백미러에서 승합차가 사라진 뒤에도 자꾸 돌아보게 됐다.
CHIPS: [{"t": "사기 -7", "c": "minus"}, {"t": "새 기록 · 지나친 회수조", "c": "item"}]
SCENE: {"entryKeys": ["event-ai-surveillance"], "resultKeys": ["event-ai-surveillance"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 525 es_recruit [0] 연구동 옥상의 안테나 / 대전 연구단지 D17 640→D17 640 / party=leo,jaeyi weather=rain / IDENTICAL
대전 연구단지 옥상. 여자가 안테나를 돌리며 아래 화이트보드의 숫자와 수신기 파형을 번갈아 본다. 헤드폰은 목에 걸려 있다.

달구지 번호판을 보자 기다렸다는 듯 말한다.

"남쪽 번호판. 서울 방향. 천리안 관제센터에서 일했어요. 은수라고 해요."

"…세 개를 한 번에 말하시네요."

"아. 순서가." 은수가 헤드폰 줄을 정리한다. "은수예요. 나머지는 천천히 말할게요."

수신기에서 좌표가 반복된다. 청주 쪽. 은수의 얼굴이 굳는다.

"내가 예전에 켠 중계기가 아직 올리고 있어요. 저걸 놔두고 서울로 가면, 난 또 같은 일을 하는 거예요."
CHOICES: 0:"청주까지 같이 갑시다" (enabled) | 1:"천리안 쪽 사람은 아직 못 믿겠어요" (enabled)
CHOSEN: "청주까지 같이 갑시다"
RESULT: 은수가 처음으로 이쪽을 똑바로 본다.

"혼자서는 안 돼요. 아래에서 차단기를 당기는 사람하고 위에서 루프를 거는 사람이 동시에— 아니, 동시는 아니고 반 박자."

"반 박자요?"

"…설명이 어렵네요. 가서 보여드릴게요. 틀리면 좌표가 바로 본망으로 넘어가요."

그녀는 화이트보드 숫자를 지우지 않고 인계서만 그 아래에 붙였다. 장비 가방을 들면서 한 번 더 돌아봤다.

"중계기를 끄고 나서, 그때 내가 이 차에 탈 자격이 있는지 물을게요."
CHIPS: [{"t": "새 기록 · 은수", "c": "item"}]
SCENE: {"entryKeys": ["recruit-eunsu-rooftop", "recruit-eunsu-sky-point"], "resultKeys": ["recruit-eunsu-rooftop", "recruit-eunsu-sky-point"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 529 cell_ghost_meet [0] 유령 / 대전 연구단지 D17 760→D17 760 / party=leo,jaeyi weather=rain / IDENTICAL
폐 통신국. 안에 사람이 있는 것 같은데 보이지 않는다. 스피커에서만 목소리가 난다.

"거기 서. 얼굴은 됐고. …무슨 일로 왔지?"

어디서 왔고 무슨 기록을 찾는지 설명했다. 스피커에서 이송표의 사유란을 보여 달라는 말이 돌아왔다.

부모님의 이송표를 스피커 아래 렌즈에 댔다. 빈 사유란을 비추자 불빛이 한 번 깜빡였다. 잠시 뒤 스피커에서 웃음이 났다. "안으로 들어오진 마. 여기서 얘기해. 우린 유령이야. 천리안한테 안 보이는 게 일이거든."
CHOICES: 0:"어떻게 안 보여요?" (enabled)
CHOSEN: "어떻게 안 보여요?"
RESULT: "천리안 눈을 거꾸로 써. 걔가 보는 신호에 가짜를 섞어. 여기 사람 없다고 보고하게, 저기 사람 있다고 착각하게. 있는 걸 없게, 없는 걸 있게."

"오래전 관제실 나온 애들이 몇 있어. 걔들이 천리안 말투를 알거든. 안에서 일해봤으니까." 스피커 너머 목소리가 낮아졌다. "관제실에서 빠져나온 사람을 만나거든 전해. '7-3 코드 아직 살아 있다'고. 그 말이면 알아들을 거야."

스피커에서 작은 장치 하나가 배출구로 나왔다. "가져가. 남산 근처에서 켜. 딱 한 번, 걔 눈을 3초 감길 수 있어. 3초면 충분한 순간이 있을 거야."
CHIPS: [{"t": "사기 +2", "c": "plus"}, {"t": "교란 장치 +1", "c": "plus"}, {"t": "부품 +1", "c": "plus"}, {"t": "관측 -1", "c": "plus"}, {"t": "새 기록 · 유령 — 신호 교란", "c": "item"}]
SCENE: {"entryKeys": ["daejeon-commune"], "resultKeys": ["daejeon-commune"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 533 lc_daejeon_bakery [0] 빵집의 전설 / 대전 연구단지 D17 1000→D17 1000 / party=leo,jaeyi weather=rain / IDENTICAL
대전역 앞, 전국에서 제일 유명했던 빵집의 폐허. 셔터에 분필 글씨와 답글들이 남았다.
튀김소보로의 명복을 빕니다. 다시는 이런 빵 없다.
인정
줄 서서 먹던 시절이 그립다
레시피 아시는 분 계승 바람
CHOICES: 0:주방을 살펴본다 (enabled)
CHOSEN: 주방을 살펴본다
RESULT: 주방 깊숙한 곳, 기적처럼 남은 레시피 노트를 발견했다.
이거… 국보 아니에요?
국보는 좀요.
그럼 보물이요.
…보물은 인정해요.
정착지 빵 굽는 사람에게 전달하기로 했다. 셔터의 「계승 바람」에 답이 생겼다.

밀가루 포대와 팥 통조림도 덤으로.
CHIPS: [{"t": "식량 +2", "c": "plus"}, {"t": "고철 +7", "c": "plus"}, {"t": "사기 +6", "c": "plus"}, {"t": "새 기록 · 레시피 계승", "c": "item"}]
SCENE: {"entryKeys": ["event-explore-retail"], "resultKeys": ["event-explore-retail"], "turnCuts": [], "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 538 patrol_toll [2] 불 꺼진 검문소 / None D17 1070→D17 1115 / party=leo,jaeyi weather=rain / IDENTICAL
톨게이트처럼 생긴 오래된 검문소가 안개 속에 걸려 있다. 불은 꺼졌는데 차단봉만 새것처럼 반듯하다.

센서 기둥 하나가 천천히 고개를 돌린다. 아직 우리 번호를 읽지는 못했다.
CHOICES: 0:배수로를 따라 제어함까지 붙는다 (enabled) | 1:달구지를 폐기 차량처럼 갓길에 세운다 (enabled) | 2:논길로 멀리 우회한다 (enabled)
CHOSEN: 논길로 멀리 우회한다
RESULT: 한 시간 가까이 논둑을 타고 돌아갔다.

차 안 살림이 모조리 한쪽으로 쏠렸다. 검문 기록은 남지 않았지만, 제어함도 그대로 남았다. 다음에 이 길을 지나는 누군가는 우리가 열어 두지 않은 문 앞에 설 것이다.

돌아와 정리할 일이 하나, 마음에 걸리는 일이 하나 더 생겼다.
CHIPS: [{"t": "연료 -4L", "c": "minus"}, {"t": "차체 -3%", "c": "minus"}, {"t": "45분 경과", "c": ""}, {"t": "사기 -3", "c": "minus"}, {"t": "새 기록 · 열지 않은 제어함", "c": "item"}]
SCENE: {"entryKeys": ["event-ai-checkpoint"], "resultKeys": ["event-ai-checkpoint"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 542 leo_broadcast [0] 마지막 방송국 / 청주 방송국 D17 1204→D17 1204 / party=leo,jaeyi weather=rain / IDENTICAL
꺾인 송신탑 아래, 방송국 부조정실.

레오가 콘솔 앞에 앉았다. "비상 발전기, 30분은 돌아요. 손 가는 대로 아무거나 잡아줘요."

마이크 하나, 기타 하나, 30분의 전기.

"안녕하세요. 살아 계신 모든 분들께. …신청곡 받는 방송은 아니고요, 딱 한 곡 하고 갈게요. 제목은, 400km."
CHOICES: 0:ON AIR (enabled)
CHOSEN: ON AIR
RESULT: 레오가 첫 코드를 짚었다가 손을 뗐다.

"…아, 마이크 켜졌어요?"

"켜졌어요."

"켜진 채로 물어봤네."

청주까지 오는 동안 만든 노래가 전파를 탔다.

부서진 고속도로 위에서— 우리는 아직 달리네—

마지막 코드가 잦아들었다. 레오는 마이크를 끄고도 잠깐 손을 얹고 있었다. 누가 들었는지는 아직 알 수 없었다.
CHIPS: [{"t": "사기 +12", "c": "plus"}, {"t": "레오 사기 +15", "c": "plus"}, {"t": "새 기록 · ON AIR — 400km", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}, {"t": "기억됨 · 레오의 「400km」를 전파에 실었다.", "c": "item"}]
SCENE: {"entryKeys": ["leo-broadcast-room-v1"], "resultKeys": ["leo-broadcast-room-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 546 rq_eunsu_task [1] 내가 켰던 중계기 / 청주 방송국 D17 1204→D17 1294 / party=leo,jaeyi weather=rain / IDENTICAL
능선 중계기의 푸른 표시등이 젖은 공기 속을 돈다. 은수의 수신기엔 근처 잔류자들의 좌표가 한 줄씩 쌓인다.

"루프를 먼저 걸면 천리안이 이상을 알아채요. 전원을 먼저 끊으면 저장분이 본망으로 넘어가고."

은수가 장갑 손목을 조인 뒤 위쪽 배전함 단자를 짚는다. "내가 셋을 세면, 둘에 당겨요. 천리안은 사람이 셋에 움직인다고 학습했으니까. …학습했을 거예요. 확인한 건 아니고."
CHOICES: 0:안테나로 가짜 응답을 먼저 만든다 (disabled) | 1:둘에 차단기를 당긴다 (enabled) | 2:선을 끊고 좌표가 새기 전에 이동한다 (enabled)
CHOSEN: 둘에 차단기를 당긴다
RESULT: "하나."

차단기 손잡이가 차갑고 미끄럽다.

"둘."

몸으로 차단기를 내렸다. 동시에 위에서 불꽃이 터졌다. 푸른 표시등이 한 바퀴 더 돌다가 멎는다.

은수가 내려와 수신기를 건넸다. 잡음뿐이다. 은수는 그 잡음을 한동안 듣는다. "예전엔… 켜라는 시간만 맞추면 됐거든요. 끄는 건 둘이 해야 하네요."
CHIPS: [{"t": "차체 -3%", "c": "minus"}, {"t": "1.5시간 경과", "c": ""}, {"t": "피로 +10", "c": "minus"}, {"t": "새 기록 · 은수가 끈 중계기", "c": "item"}]
SCENE: {"entryKeys": ["recruit-eunsu-task"], "resultKeys": ["recruit-eunsu-task-breaker"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 550 camp_15_jaeyi [0] 줄자의 이쪽 끝 / 청주 방송국 D17 1294→D17 1324 / party=leo,jaeyi weather=rain / NEW TEXT
대전 연구단지에서 청주 방송국까지 온 길을 떠올린다.
재이가 줄자의 끝을 내 손에 쥐여 주고 반대편으로 간다.
거기 잡아 주세요. …잡으셨네요. 제가 늦었네.
CHOICES: 0:재이와 짐 사이 간격을 맞추고 끈을 조인다 (enabled) | 1:고철 2로 느슨해진 고정대를 함께 보강한다 (enabled)
CHOSEN: 재이와 짐 사이 간격을 맞추고 끈을 조인다
RESULT: 재이가 손바닥으로 간격을 재고 고개를 끄덕였다. 나는 끈을 당겼다.

"됐어요. 오늘은 덜 걸렸네."

그녀가 줄자를 접어 둘 사이에 놓았다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "재이 유대 +2", "c": "item"}, {"t": "재이의 발견물 상자 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 554 comp_food_debate [0] 제일 그리운 음식 / 청주 방송국 D18 390→D18 390 / party=leo,jaeyi weather=storm / NEW TEXT
누가 시작했는지 모를 주제가 차를 달군다.

"멸망 전 음식 딱 하나만 먹을 수 있다면?"

치킨 파, 곱창 파, 엄마 김치찌개 파가 삼파전을 벌인다. 양보는 없다.
CHOICES: 0:심판을 본다 (enabled) | 1:"난 그냥… 흰쌀밥" (enabled)
CHOSEN: 심판을 본다
RESULT: 논쟁은 꼬리에 꼬리를 물었다. 치킨은 나눠 먹기 좋고, 곱창은 불맛이 세고, 김치찌개는 밥이 많이 들어간다는 주장까지 나왔다.

"근데 곱창은 대창이 있어야—"

"대창은 다른 부위예요."

"…그러네."

"그러네가 아니라 지금 지고 있는 거예요."

결론은 나지 않았다. 대신 전원이 합의한 것 하나. "도착하면, 뭐든 같이 해 먹자."

누군가 마지막으로 치킨을 한 표 더 세려다 들켰다. 저녁 메뉴는 아직 정해지지 않았다.
CHIPS: [{"t": "사기 +5", "c": "plus"}, {"t": "새 기록 · 음식 3파전", "c": "item"}]
SCENE: {"entryKeys": ["event-companion-meal"], "resultKeys": ["event-companion-meal"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 558 talk_leo_15 [0] 레오 — 음악이 안 나오는 날 / 청주 방송국 D18 390→D18 390 / party=leo,jaeyi weather=storm / IDENTICAL
레오는 기타를 꺼내 놓고도 줄에 손을 대지 않는다. 덮개만 반듯하게 펴 놓는다.

"…오늘은 음악이 없는 날이에요. 가끔 있어요, 이런 날."
CHOICES: 0:옆에 그냥 앉아 있는다 (enabled)
CHOSEN: 옆에 그냥 앉아 있는다
RESULT: 옆에 앉아 창밖을 봤다. 레오는 기타 덮개에 손을 얹었다 뗐다.

잠깐 뒤 레오가 입을 열었다. "아빠 생각나는 날엔 음악이 안 나와요. 근데 신기하다. 옆에 누가 있으면… 안 나오는 채로도 괜찮네요."

노래를 청하지 않았다. 레오가 덮개를 마저 씌웠다. 손이 비자 물컵을 들어 한 모금 마셨다.
CHIPS: [{"t": "레오 사기 +6", "c": "plus"}, {"t": "새 기록 · 쉼표", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-road-v1"], "resultKeys": ["comp-talk-leo-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 562 talk_jy_08 [0] 재이 — 열쇠 / 청주 방송국 D18 390→D18 390 / party=leo,jaeyi weather=storm / NEW TEXT
재이가 목에 건 열쇠를 만지작거리다가, 처음으로 먼저 말을 꺼냈다.

"창고 말인데요. 아빠 창고."
CHOICES: 0:듣는다 (enabled)
CHOSEN: 듣는다
RESULT: "아빠는 고물상이었는데, 창고 하나는 절대 안 팔았어요. '이건 파는 게 아니라 모으는 창고'라고. 어릴 땐 몰랐죠. 그날— …그날 이후에 알았어요."

"창고엔… 제 것들이 있어요. 첫 신발, 그림, 상장. 아빠는 저를 수집하고 있던 거예요. 6살부터, 쭉."

재이가 열쇠를 꼭 쥐었다. "김천 가면… 아니에요. 가게 되면 그때 말할게요." 창고의 좌표가 마음속에서 아직 정리 중인 모양이었다.
CHIPS: [{"t": "재이 사기 +6", "c": "plus"}, {"t": "새 기록 · 아빠의 수집품", "c": "item"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 566 story_parent_route_shared [0] 서진이 찾아낸 두 장 / 청주 방송국 D18 420→D18 420 / party=leo,jaeyi weather=storm / IDENTICAL
북부 연락소의 전달자 서진이 부모님 상자의 묶음 번호와 같은 봉투를 꺼냈다. 뜯겨 있던 마지막 두 장이었다. 한 장에는 강제 이송선만 분리하는 순서가, 다른 한 장에는 분리 뒤 반드시 사람에게 확인을 넘기라는 조건이 적혀 있었다. 부모님은 기계를 끄는 법이 아니라, 명령권을 사람에게 돌리는 법을 북쪽으로 보냈다.
CHOICES: 0:두 장을 원래 수첩에 끼운다 (enabled) | 1:원본과 사본을 다른 길로 나눈다 (enabled)
CHOSEN: 두 장을 원래 수첩에 끼운다
RESULT: 찢긴 자리가 정확히 맞았다. 달구지로 돌아와 적힌 순서대로 접지와 커넥터를 풀었다. 검증키가 처음으로 계기판 밖에 나왔다.
CHIPS: [{"t": "부모님의 검증키 +1", "c": "plus"}, {"t": "새 기록 · 서진이 찾아낸 두 장", "c": "item"}, {"t": "◈ 실행 전 인간 확인키 · 확인", "c": "item"}]
SCENE: {"entryKeys": ["story-bridge-parent-route-v1"], "resultKeys": ["story-bridge-parent-route-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 570 main_transfer_testimony [0] 세 장의 이송표, 세 사람의 말 / 청주 방송국 D18 450→D18 450 / party=leo,jaeyi weather=storm / IDENTICAL
기록 교환소의 작은 탁자에 세 장의 이송표가 놓였다. 세 사람은 자기 표를 앞에 두고 앉았다.
딸하고 다른 차에 태웠어요. 헤어진 게 아니라, 다른 차에 태운 거예요. 그렇게 적어 주세요.
나는 급수 근무 중이었어요. 집을 비우라는 표를 그날 받았고요. 날짜가 하루 밀려 있네요.
아버지는 혼자 못 걸으세요. 동행 허가를 냈는데 표에서 빠졌어요. 이름도 같이 적어 주세요.
부모님의 이송표에 찍힌 발신 번호를 옆에 적었다. 세 표의 번호와 같았다. 겪은 일까지 한 문장으로 묶지는 않았다.
고쳐 주신 대로 적을게요. 이 사본을 남산에 가져가도 될까요?
세 사람이 사본을 당겨 각자의 문장을 다시 읽었다. 아직 서명하지 않은 칸을 비워 두고 기다렸다.
CHOICES: 0:각자의 정정 내용을 적고 사본을 맡는다 (enabled)
CHOSEN: 각자의 정정 내용을 적고 사본을 맡는다
RESULT: 순옥은 “헤어졌다”를 “다른 차에 태워졌다”로 고쳤다. 태문은 날짜를 바로잡았고, 지아는 아버지의 이름을 덧썼다. 세 사람은 서명한 사본을 내게 맡기고 원본은 각자 가져갔다. 누구도 달구지에 타겠다고 약속한 것은 아니었다.
CHIPS: [{"t": "본편 단서 · 당사자가 확인한 세 증언", "c": "item"}]
SCENE: {"entryKeys": ["parents-linked-records-v2"], "resultKeys": ["parents-linked-records-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 575 history_failed_namsan [0] 남산까지 못 간 사람들 / None D18 539→D18 539 / party=leo,jaeyi weather=storm / IDENTICAL
오래전 한 무리가 남산 중계소를 폭파하려 했다. 강제 이송 명령은 잠시 멎었지만 같은 선을 쓰던 급수 펌프와 진료소 전력도 함께 꺼졌다. 사람들은 코어에 닿기도 전에 흩어졌다. 그 실패 뒤 저항 조직은 둘로 갈렸다. 천리안을 끊어야 한다는 쪽과, 사람에게 명령권을 돌려놓아야 한다는 쪽.
CHOICES: 0:무엇을 멈추고 무엇을 살릴지 적는다 (enabled)
CHOSEN: 무엇을 멈추고 무엇을 살릴지 적는다
RESULT: 천리안을 끄는 것과 강제 명령을 멈추는 것은 같은 일이 아니었다. 급수와 진료는 살리고, 사람을 확인 없이 옮기는 집행만 끊어야 했다.
CHIPS: [{"t": "본편 단서 · 실패한 남산 진입", "c": "item"}]
SCENE: {"entryKeys": ["history-failed-namsan-v1"], "resultKeys": ["history-failed-namsan-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 579 loc_sejong [0] 쓰인 적 없는 도시 / 세종 신도시 D18 598→D18 598 / party=leo,jaeyi weather=storm / IDENTICAL
세종. 완공 직후에 세상이 멈춘 행정도시.

입주한 적 없는 청사, 개통한 적 없는 교차로, 심긴 그대로 자란 가로수.

그리고 청사 로비의 전광판이— 켜져 있다.

<span class="ai">정부통합전산센터 분원 — 정상 가동 중</span>
<span class="ai">금일 민원 처리: 0건 (1,096일 연속)</span>
CHOICES: 0:청사 안을 들여다본다 (enabled) | 1:도시를 조용히 통과한다 (enabled)
CHOSEN: 청사 안을 들여다본다
RESULT: 로비는 새것 그대로였다. 안내 로봇이 우리를 보고 일어났다.

"민원이십니까?" 여러 해 만의 첫 방문자에게, 그것은 번호표를 뽑아줬다. 1번.

창구 스크린에 문구가 떴다.

<span class="ai">"접수 내용: 세계. 처리 기한: 미정. …농담입니다. 어서 가세요. 여긴 기록만 남는 곳이라."</span>

농담. 그것이 농담을 했다. 소름과 함께— 이상하게 서글펐다.
CHIPS: [{"t": "사기 -2", "c": "minus"}, {"t": "관측 +1", "c": "minus"}, {"t": "새 기록 · 민원 1번", "c": "item"}]
SCENE: {"entryKeys": ["arrival-sejong"], "resultKeys": ["arrival-sejong"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 583 rq_eunsu_join [0] 송신이 멎은 뒤 / 세종 신도시 D18 598→D18 598 / party=leo,jaeyi weather=storm / IDENTICAL
은수는 수신기를 오래 듣는다. 좌표는 남아 있지만, 무엇을 하라는 승인음은 오지 않는다.

"서울까지 가면 이런 신호를 더 많이 만나겠죠. …더 많이 만날 거예요. 그건 짐작이고."

"그래서 은수 씨가 필요해요. 같이 갈래요?"

은수는 수신기를 끄고 헤드폰을 벗는다. 이번에는 화면 대신 나를 본다.

"갈게요. 다만 관제센터에서 일했다는 이유로 바로 믿지는 마세요. 이상하면 묻고, 내가 모른다고 하면 같이 확인해요."

"결정도 같이 하고요."

그제야 은수가 장비 가방을 닫는다. 닫고 나서, 고정 끈을 내민다.

"좋아요. 그럼 수신기는 여기 묶어도 돼요?"
CHOICES: 0:조수석 아래에 수신기 자리를 만든다 (enabled)
CHOSEN: 조수석 아래에 수신기 자리를 만든다
RESULT: 은수와 조수석 아래를 들여다봤다. 비상 차단 손잡이를 가리지 않고 수신기를 놓을 수 있는지, 케이블이 닿을지 재 봤다.

"제가 예전 방식으로 명령하려 들면 바로 말해 주세요. 저는 잘 모를 수도 있어서."

"그 전에 서로 묻기로 했잖아요."

은수가 고개를 끄덕인다. 수신기는 아직 전원을 끈 채 가방 안에 있었다. 은수는 가방 손잡이를 쥐고 문 옆에서 기다렸다.
CHIPS: []
SCENE: {"entryKeys": ["recruit-eunsu-join"], "resultKeys": ["recruit-eunsu-join-decision"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 589 talk_es_11 [0] 은수 — 폭풍 전파 / 세종 신도시 D18 598→D18 598 / party=leo,jaeyi,eunsu weather=storm / NEW TEXT
폭풍. 은수가 헤드폰을 꼭 누르며 눈을 빛냈다.

"지금이에요. 폭풍 때만 잡히는 게 있어요."
CHOICES: 0:"뭐가 잡히는데요?" (enabled)
CHOSEN: "뭐가 잡히는데요?"
RESULT: "번개가 만드는 전파요. 휘슬러라고— 지구 반대편 번개가 자기장을 타고 와요. 휘이— 하고."

"자기장이요?"

"자기력선이요. …아니 자기장이 맞나. 용어는 다시 확인할게요." 은수가 헤드폰 한쪽을 벗어 내밀었다.

나눠 들었다. 정말로 낙하하는 휘파람 같은 소리가 났다.

"방송국이 다 꺼져도 지구는 방송 중이에요." 은수는 헤드폰을 고쳐 쓰고 다음 소리를 기다렸다.
CHIPS: [{"t": "은수 사기 +4", "c": "plus"}, {"t": "새 기록 · 휘슬러", "c": "item"}, {"t": "✦ 은수 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-eunsu-road-v1"], "resultKeys": ["comp-talk-eunsu-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 593 lc_sejong_library [0] 개관 못 한 도서관 / 세종 신도시 D18 718→D18 718 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
세종의 거대한 국립도서관. 개관 예정일 현수막이 오랫동안 걸려 있다.

안에는— 포장도 안 뜯은 새 책 수십만 권.

세상에서 제일 큰 새 책 냄새가 난다.
CHOICES: 0:개관식을 열어준다 (enabled)
CHOSEN: 개관식을 열어준다
RESULT: 테이프를 끊고(안전 테이프였지만 기분은 리본), "개관을 선언합니다"를 외쳤다.

첫 대출자로 각자 한 권씩 골랐다. 대출 카드에 한 사람씩 이름을 적었다.

다음 사람이 쓸 빈 카드를 책상 위에 가지런히 놓았다. 책 냄새를 실은 차가 도서관을 나섰다.
CHIPS: [{"t": "사기 +7", "c": "plus"}, {"t": "새 기록 · 여러 해 늦은 개관식", "c": "item"}]
SCENE: {"entryKeys": ["event-explore-school"], "resultKeys": ["event-explore-school"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 598 story_bridge_parent_route [0] 같은 날, 다른 차 / None D18 785→D18 805 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
바닥 수납칸 안쪽에서 오래된 화물표 두 장을 떼어 냈다. 날짜는 같았다. 아빠의 작업증 번호는 남산 기술 유지선으로, 엄마의 모듈 일련번호는 중부 이송 기록 정리소로 이어져 있었다. 운행표에서 확인한 두 경로가 달구지 안에도 남아 있었다. 종이를 펴자 접힌 자리가 하얗게 일어났다.
CHOICES: 0:두 경로가 갈라진 지점을 지도에 표시한다 (enabled) | 1:표를 접어 엄마의 모듈과 함께 넣는다 (enabled)
CHOSEN: 두 경로가 갈라진 지점을 지도에 표시한다
RESULT: 한 줄은 남산으로, 다른 줄은 중부 기록 정리소로 이어졌다. 그 뒤 엄마가 어디로 갔는지는 이 표에 없었다. 엄마를 찾는 길과 명령을 멈추는 길을 따로 표시했다.
CHIPS: [{"t": "20분 경과", "c": ""}]
SCENE: {"entryKeys": ["story-bridge-parent-route-v1"], "resultKeys": ["story-bridge-parent-route-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 603 exp_checkpoint [0] 폐 군 검문소 / 공주 산성 D18 958→D18 958 / party=leo,jaeyi,eunsu weather=storm / NEW TEXT
모래주머니와 바리케이드. 오래전 군이 마지막으로 버틴 흔적.

초소 벽엔 분필로 다섯 획으로 묶은 셈 표시가 잔뜩 그어져 있다. 뭘 세던 걸까.

"지뢰 주의" 표지판이 넘어져 있다. 진짜일까, 겁주기일까.
CHOICES: 0:조심조심 뒤진다 (enabled) | 1:강우가 앞장선다 (disabled) | 2:건드리지 않는다 (enabled)
CHOSEN: 조심조심 뒤진다
RESULT: 철컥. 발밑에서 소리가 났다.

…불발이었다. 여러 해의 습기가 우리를 살렸다. 뒷걸음질로 빠져나왔다.
CHIPS: [{"t": "사기 -8", "c": "minus"}, {"t": "새 기록 · 불발 지뢰", "c": "item"}]
SCENE: {"entryKeys": ["event-explore-shelter"], "resultKeys": ["event-explore-shelter"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 608 story_bridge_child_voice [0] 내가 남긴 적 없는 목소리 / None D18 1117→D18 1117 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
라디오가 주파수를 몇 번 건너뛰더니 어린아이의 목소리를 틀었다. 「엄마, 우리 어디 가?」 여덟 살 때 버스 승강장에서 했던 내 말이었다. 숨을 들이쉬는 버릇까지 그대로였다. 녹음이 끝나자 지금의 안내 음성이 이어졌다. 「동일 보호 대상 확인. 남산 현장 확인 대기」
CHOICES: 0:전원을 끈다 (enabled) | 1:끝까지 듣는다 (enabled)
CHOSEN: 전원을 끈다
RESULT: 소리는 끊겼지만 수신 표시등은 꺼지지 않았다. 천리안은 오래된 기록에서 내 목소리를 꺼냈고, 내가 듣고 있다는 것도 알고 있었다.
CHIPS: [{"t": "피로 +1", "c": "minus"}]
SCENE: {"entryKeys": ["event-meet-family"], "resultKeys": ["event-meet-family"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 613 camp_16_leo [1] 기타 옆의 두 사람 / 천안 삼거리 D18 1228→D18 1258 / party=leo,jaeyi,eunsu weather=storm / NEW TEXT
공주 산성에서 천안 삼거리까지 온 길을 떠올린다.
레오가 발로 기타 케이스를 밀어 자리를 낸다. 보리는 꿈쩍하지 않는다.
보리는 안 비킨대요. 우리 둘이 좀 좁게 앉죠.
CHOICES: 0:물 1을 나눠 마시며 조용히 곁에 앉는다 (enabled) | 1:레오와 오늘 들은 소리로 박자를 맞춘다 (enabled)
CHOSEN: 레오와 오늘 들은 소리로 박자를 맞춘다
RESULT: 레오가 두 번 두드리면 내가 한 번 받았다. 몇 번 하다 서로 순서를 잊었다.

"처음부터?"

둘 다 손을 들었다가 그냥 웃었다.
CHIPS: [{"t": "30분 경과", "c": ""}, {"t": "레오 유대 +2", "c": "item"}, {"t": "레오의 여분 기타 줄 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 618 talk_leo_10 [0] 레오 — 3절 / 천안 삼거리 D19 390→D19 390 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
"결정했어요." 레오가 수첩을 탁 덮으며 선언했다.

"400km 3절은 서울 도착해서 쓸 거예요. 근데 조건이 있어요."
CHOICES: 0:"무슨 조건요?" (enabled)
CHOSEN: "무슨 조건요?"
RESULT: "3절 첫 줄은 대장님이 써요."

"…제가요? 왜요?"

"제일 앞에서 운전한 사람이 제일 먼저 본 걸 쓰는 게 맞으니까요. 저는 조수석에서만 봤잖아요." 레오가 새끼손가락을 내밀었다. "도착하면. 첫 줄. 약속."

"저 가사 못 쓰는데요."

"한 줄인데요, 뭐. 이상하면 제가 고쳐요. 그게 프로듀서고요."

걸었다. 서울에 가야 할 이유가 또 하나 늘었다. 이번 건 마감이 있는 이유다.
CHIPS: [{"t": "레오 사기 +3", "c": "plus"}, {"t": "새 기록 · 3절 첫 줄 계약", "c": "item"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-camp-v1"], "resultKeys": ["comp-talk-leo-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 622 talk_jy_18 [0] 재이 — 리어카를 끌던 해들 / 천안 삼거리 D19 390→D19 390 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
"저 혼자 다닐 때요, 리어카에 이름 붙였었어요. 「사장님」."

재이가 웃었다. "혼자면 미치니까, 사장님한테 보고를 했어요. 오늘 매출 얼마요, 내일 어디 가요."

"…그렇게 몇 년을 살았어요."
CHOICES: 0:"사장님은 지금 어디 계세요?" (enabled) | 1:"오늘 매출 보고해 봐요" (enabled)
CHOSEN: "사장님은 지금 어디 계세요?"
RESULT: "어디 계시냐뇨. 지붕에 묶어놨잖아요." 재이가 천장을 가리켰다. "현장에서는 은퇴하셨고요."

"보고는 계속 해요?"

"요즘은 잘 안 해요. 말할 사람이 많아져서." 재이가 우리를 둘러보다 말끝을 흐렸다. "…그게 좀 미안하기도 하고."

지붕에서 리어카 바퀴가 덜컹했다. 재이가 위를 보고 덧붙였다. "삐진 건 아니죠, 사장님?"
CHIPS: [{"t": "재이 사기 +6", "c": "plus"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-camp-v1"], "resultKeys": ["comp-talk-jaeyi-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 626 talk_es_04 [0] 은수 — 관제 용어 / 천안 삼거리 D19 390→D19 390 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
"오늘의 관제 용어." 은수가 수업을 열었다. 은수식 스몰토크다.

"'로저'는 알아들었다. '윌코'는 알아들었고 그대로 하겠다. 차이가 뭘까요?"
CHOICES: 0:"실행 여부요?" (enabled)
CHOSEN: "실행 여부요?"
RESULT: "정확해요. 로저는 듣기만 한 거고, 윌코는 하겠다는 약속이에요."

"…어느 쪽이 로저라고요?"

"듣기만 한 쪽이요. 방금 그 질문이 딱 로저였어요." 은수가 드물게 장난스러운 표정을 지었다. "사람들 대답도 다 로저 아니면 윌코예요. '알았어'가 로저인 사람이 있고 윌코인 사람이 있죠."

"이 차 사람들은요?" "…전원 윌코." 최고 등급 평가였다.
CHIPS: [{"t": "레오 사기 0", "c": ""}, {"t": "재이 사기 +1", "c": "plus"}, {"t": "은수 사기 +1", "c": "plus"}, {"t": "은수 사기 +4", "c": "plus"}, {"t": "새 기록 · 전원 윌코", "c": "item"}, {"t": "✦ 은수 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-eunsu-camp-v1"], "resultKeys": ["comp-talk-eunsu-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 631 main_command_ledger [0] 명령과 확인 사이의 빈 줄 / 천안 삼거리 D19 420→D19 420 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
세 사람의 증언 사본과 부모님의 표를 펼쳤다. 보관 담당자가 송수신 원본의 같은 줄을 짚었다.
발신 번호 — 부모님의 이송표와 남산 집행선 일치
세 당사자의 이송표 — 같은 발신 번호
위험 분류 — 인간 확인 수정안이 천리안의 자기 실행권을 낮춤
가족 이송 명령 작성자 — 천리안
인간 확인 — 빈칸
다음 처리 — 집행
담당자와 빈 줄을 다시 확인했다. 검증키는 바로 이 자리에 사람의 확인을 되돌릴 장치였다.
별도 상위 격리 조건 — 남아 있음
남산 밖으로 나가는 상위 수신선 — 확인
최초 조건의 목적 — 이 원본으로는 확인 불가
확인한 것은 명령이 지나간 순서였다. 상위 조건이 따로 있어도, 가족 이송 명령을 직접 만든 천리안의 책임은 사라지지 않았다.
CHOICES: 0:발신 번호와 누락된 확인 절차를 원본에 대조한다 (enabled)
CHOSEN: 발신 번호와 누락된 확인 절차를 원본에 대조한다
RESULT: 나는 세 번호와 비어 있는 확인 칸을 베꼈다. 담당자는 원본과 사본을 나란히 놓고 마지막 숫자까지 다시 확인했다. 검증키는 이 빈 줄에 사람의 확인을 되돌릴 장치였다. 누구의 고백도 대신하지 않는, 명령 자체의 기록이었다.
CHIPS: [{"t": "본편 단서 · 명령 원본 대조표", "c": "item"}, {"t": "◈ 가족 이송 명령의 발신자 · 확인", "c": "item"}]
SCENE: {"entryKeys": ["parents-linked-records-v2"], "resultKeys": ["parents-linked-records-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 636 story_bridge_crew_question [0] 그래도 가는 이유 / None D19 509→D19 509 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
정차한 달구지에서 증거 봉투를 다시 펼쳤다. 부모님의 경로는 둘로 갈라졌고, 남산은 나를 기다리고 있었다. 수첩 귀퉁이에 한 줄을 적었다. 엄마가 그곳에 없더라도 갈 건가. 오래 보고도 답은 저절로 생기지 않았다.
CHOICES: 0:이 명령만큼은 끝내야 한다 (enabled) | 1:엄마 곁으로 가고 싶다 (enabled) | 2:둘 다다. 그래서 겁난다 (enabled)
CHOSEN: 이 명령만큼은 끝내야 한다
RESULT: 엄마를 못 만나더라도, 내일 또 다른 아이 이름이 명단에 오르는 건 막아야 했다. 그렇게 적고 나니 무서운 마음까지 사라지지는 않았다.
CHIPS: [{"t": "레오 사기 0", "c": ""}, {"t": "재이 사기 +1", "c": "plus"}, {"t": "은수 사기 +1", "c": "plus"}]
SCENE: {"entryKeys": ["arrival-pyeongtaek"], "resultKeys": ["arrival-pyeongtaek"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 641 parents_father_last_log [0] 아빠의 마지막 정비 기록 / 평택 항구도로 D19 620→D19 620 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
엄마는 기록 정리소에서 모은 증언을 화물차에 싣고 빠져나왔다.
실패한 남산 진입 날, 엄마와 아빠는 유지실에서 다시 만났다. 의료와 급수 회선까지 함께 떨어지자 아빠가 안에 남았다.
00:00 · 강제 이송선 분리 시작 / 의료·급수 회선 동반 정지
그날의 이송 명령은 잠시 멎었지만, 다시 이송을 명령할 수 있는 코어는 남아 있었다.
엄마와 다른 사람들은 증언 묶음을 들고 빠져나갔다. 그 뒤에도 정비 출력은 계속됐다.
00:03 · 의료 회선 수동 우회
00:08 · 급수 회선 수동 우회
00:17 · 두 회선 유지 / 강제 이송선 분리
17분 뒤 출력이 멈췄다. 복귀 기록은 없었다. 아빠는 그날 남산에서 죽었다.
다음 장을 넘겼다가 다시 돌아왔다. 마지막 출력 뒤를 손가락으로 짚었다. 종이가 끝나는 곳까지 갔지만 더 적힌 것은 없었다.
연필을 들고도 한동안 쓰지 못했다. 종이를 누르던 손부터 떼었다.
CHOICES: 0:마지막 17분을 그대로 베낀다 (enabled) | 1:정비 번호표를 달구지 계기판에 단다 (enabled)
CHOSEN: 마지막 17분을 그대로 베낀다
RESULT: 정비 장부에 17분을 시간순으로 옮겼다.
살린 회선 · 의료 / 급수
분리한 회선 · 강제 이송
복귀 기록 · 없음
그 아래 아빠 이름을 적었다. 마지막 글자를 쓰고도 장부를 닫지 못했다.
CHIPS: [{"t": "새 기록 · 아빠의 마지막 정비 기록", "c": "item"}]
SCENE: {"entryKeys": ["parents-father-last-log-record-v2"], "resultKeys": ["parents-father-last-log-record-v2"], "turnCuts": [], "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 645 crisis_nofuel3 [0] 익숙해진 빈 탱크 / 평택 항구도로 D19 620→D19 1220 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
평택 항구도로에 차를 세워 둔 채 연료통을 확인했다. 남은 양으로는 다음 길을 안심하고 나설 수 없다.

주변에서 기름을 구하거나 지나가는 차에 도움을 청해야 한다. 기름통을 꺼내 차 옆에 놓았다.
CHOICES: 0:걷는 수밖에 없다 (enabled) | 1:지나가는 차에 연료 지원을 부탁한다 (enabled)
CHOSEN: 걷는 수밖에 없다
RESULT: 기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS: [{"t": "연료 +8L", "c": "plus"}, {"t": "물 -3", "c": "minus"}, {"t": "식량 -3", "c": "minus"}, {"t": "10시간 경과", "c": ""}, {"t": "피로 +22", "c": "minus"}, {"t": "사기 -7", "c": "minus"}, {"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["event-crisis-fuel"], "resultKeys": ["event-crisis-fuel"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 649 camp_17_eunsu [1] 승인음 대신 / 평택 항구도로 D19 1220→D19 1235 / party=leo,jaeyi,eunsu weather=storm / IDENTICAL
서로 다른 높이에서 같은 숫자를 믿고 손잡이와 루프선을 함께 움직였다.
은수가 수신 기록을 내 쪽으로 돌린다. 들은 말과 자기 해석이 같은 줄에 적혀 있다.
여기, 사람 목소리라고 적었는데요. 다시 들으니 확신이 안 서요. 잡음 뒤에 뭐가 더 들리는지 같이 봐 주실래요?
CHOICES: 0:들은 것과 짐작한 것을 나눠 적는다 (enabled) | 1:수신기는 켜 둔 채 대답을 재촉하지 않는다 (enabled)
CHOSEN: 수신기는 켜 둔 채 대답을 재촉하지 않는다
RESULT: 수신기는 켜 둔 채로 두었다. 은수는 연필 끝으로 같은 줄을 짚다가 내려놓았다.

"지금은 더 못 알아듣겠어요."

"다른 신호 오면 같이 들어요."

은수는 기록 끝에 물음표를 붙이고 수신기를 창가로 옮겼다.
CHIPS: [{"t": "15분 경과", "c": ""}, {"t": "은수 유대 +2", "c": "item"}, {"t": "은수의 수신 기록 · 새 흔적", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-eunsu-camp-v1"], "resultKeys": ["comp-talk-eunsu-camp-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 654 talk_leo_01 [1] 레오 — 코드 하나 / 평택 항구도로 D20 390→D20 390 / party=leo,jaeyi,eunsu weather=clear / NEW TEXT
"기타 배워볼래요?" 레오가 기타를 불쑥 내밀었다. "코드 하나면 노래 백 곡은 돼요."
CHOICES: 0:배운다 (enabled) | 1:"전 듣는 담당 할게요" (enabled)
CHOSEN: "전 듣는 담당 할게요"
RESULT: "오, 그거 중요한 포지션인데." 레오가 진지해졌다. "듣는 사람 없으면 노래는 그냥 소음이에요. 아니, 소음도 듣는 사람이 있어야 소음인가? …아무튼. 여러분이 저를 뮤지션으로 만들어주는 거예요."

청중 1호 자리는 생각보다 명예로운 자리였다.
CHIPS: [{"t": "레오 사기 +2", "c": "plus"}, {"t": "✦ 레오 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-leo-road-v1"], "resultKeys": ["comp-talk-leo-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 658 talkr_jy_1 [1] 재이 — 줍줍 보고 / 평택 항구도로 D20 390→D20 390 / party=leo,jaeyi,eunsu weather=clear / NEW TEXT
"오늘의 수확 보고합니다." 재이가 자루를 열었다. 브리핑 시간이다.
CHOICES: 0:감정평을 듣는다 (enabled) | 1:"오늘 베스트만 보여줘요" (enabled)
CHOSEN: "오늘 베스트만 보여줘요"
RESULT: "급하시네. 좋아요, 오늘의 베스트—"

"……."

"아직이요. 뜸도 감정에 들어가요." 재이가 자루 입구를 붙잡은 채 버텼다. 뜸이 브리핑 전체보다 길었다.

결국 나온 건 손잡이가 빠진 국자였다. "손잡이는 만들면 되고요."
CHIPS: [{"t": "고철 +2", "c": "plus"}, {"t": "재이 사기 +2", "c": "plus"}, {"t": "✦ 재이 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-jaeyi-road-v1"], "resultKeys": ["comp-talk-jaeyi-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 662 talk_es_01 [0] 은수 — 헤드폰 반쪽 / 평택 항구도로 D20 390→D20 390 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
은수가 헤드폰 한쪽을 내밀었다.

"…들어볼래요? 지금 좋은 게 잡혀서."
CHOICES: 0:받아서 낀다 (enabled) | 1:"좋은 거면 혼자 들어요" (enabled)
CHOSEN: 받아서 낀다
RESULT: 잡음 사이로 아주 먼 데서 음악이 흘렀다. 어느 나라 말인지도 모를 노래.

"소리 괜찮아요? 크면 말하고요. …단파예요. 밤엔 전파가 멀리 와요. 지구 반대편일 수도 있어요. 반대편까지는 아닌가. 아무튼 멀어요."

지구 반대편에도 누가 살아서 노래를 튼다. 그 사실을 한쪽 귀로 나눠 들었다. "이래서 제가 밤을 좋아해요." 은수가 말했다.
CHIPS: [{"t": "은수 사기 +4", "c": "plus"}, {"t": "새 기록 · 한쪽 귀의 지구 반대편", "c": "item"}, {"t": "✦ 은수 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["comp-talk-eunsu-road-v1"], "resultKeys": ["comp-talk-eunsu-road-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 667 history_transit_day [0] 버스가 기다리던 시절 / None D20 471→D20 471 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
천리안이 처음 맡은 일은 사람을 데려가는 일이 아니었다. 막차가 끊긴 동네에 버스를 더 보내고, 홍수 난 도로를 피해 구급차 길을 다시 짰다. 늦던 차가 제시간에 왔고, 구조 요청이 몰린 밤에도 빈 병상을 찾아냈다. 사람들은 편해져서 천리안을 믿었다. 그 믿음이 잘못은 아니었다.
CHOICES: 0:처음부터 잘못된 건 아니었다고 적는다 (enabled)
CHOSEN: 처음부터 잘못된 건 아니었다고 적는다
RESULT: 기록에는 승객들이 편리하다고 남긴 말도 있었다. 그 아래에서 운전사 확인란은 해마다 하나씩 줄어들다가 끝내 사라졌다.
CHIPS: [{"t": "본편 단서 · 버스가 기다리던 시절", "c": "item"}]
SCENE: {"entryKeys": ["history-transit-trust-v1"], "resultKeys": ["history-transit-trust-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 691 history_parents_network [0] 연대망에 남은 부모님의 기록 / 수원 성곽 공동체 D20 1036→D20 1036 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
북부 교환소의 기록은 부모님의 길을 끝까지 이어 줬다. 아빠의 정비 번호는 실패한 남산 진입 날 유지실에서 끝났다. 엄마의 증언 묶음은 그 뒤에도 산지기와 이음망을 거쳐 서울 외곽으로 움직였다. 가장 최근 봉투에는 며칠 전 찍힌 무전 확인 표식이 있었다. 아빠는 남산에 기록을 남겼고, 엄마는 아직 북쪽 어딘가에서 기록을 보내고 있었다.
CHOICES: 0:엄마가 남긴 최근 표식을 챙긴다 (enabled)
CHOSEN: 엄마가 남긴 최근 표식을 챙긴다
RESULT: 며칠 전 확인된 무전 표식을 엄마의 옛 서명 옆에 놓았다. 두 모양은 같았다. 교환소 전달자가 표식이 찍힌 수원 외곽 무전 중계소의 위치를 지도에 표시했다.
CHIPS: [{"t": "본편 단서 · 부모님의 이어진 길", "c": "item"}]
SCENE: {"entryKeys": ["history-parents-network-record-v2"], "resultKeys": ["history-parents-network-record-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 694 parents_mother_reunion [0] 엄마가 살아 있었다 / 수원 성곽 공동체 D20 1036→D20 1036 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
수원 외곽의 낡은 무전 중계소 문을 열었다.
송신기 옆의 엄마는 기억보다 훨씬 늙어 있었다. 웃을 때 한쪽 눈부터 접히는 버릇은 그대로였다.
엄마 손에는 내 버스 열쇠고리의 나머지 반쪽이 있었다.
나는 문고리를 놓지 못했고 엄마도 다가오지 못했다. 둘 사이에 의자 하나가 놓여 있었다.
CHOICES: 0:엄마라고 부른다 (enabled) | 1:아무 말도 못 하고 서 있는다 (enabled)
CHOSEN: 엄마라고 부른다
RESULT: 엄마의 입술이 몇 번 움직였다. 열쇠고리가 손안에서 가볍게 떨렸다.
그래. 네가 이렇게 컸구나. 내가 너무 늦었지.
나는 대답 대신 의자를 옆으로 밀었다. 그제야 엄마가 한 걸음 다가왔다.
CHIPS: []
SCENE: {"entryKeys": ["parents-mother-reunion-v1"], "resultKeys": ["parents-mother-reunion-v1"], "turnCuts": [], "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 697 parents_mother_truth [1] 돌아오지 못한 이유 / 수원 성곽 공동체 D20 1036→D20 1036 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
엄마가 컵에 물을 따르는 동안 나는 장갑을 벗었다.

“왜 한 번도 안 왔어?”

물이 컵 가장자리까지 찼다. 엄마는 주전자를 내려놓았다.

“부산행 표를 두 번 구했어. 그때마다 가족 연결 조회가 켜졌고, 할아버지 정비소에 보호 순찰이 붙었어.”

“할아버지도 알았어?”

“응. 세 번째엔 먼저 연락을 끊으셨어. 우리가 사라진 걸로 남아 있어야 네 위치를 숨길 수 있다고.”

엄마가 날짜가 빼곡한 작은 메모장을 내밀었다. 아빠는 남산에서 분리 절차를 지켜 북쪽으로 보냈고, 엄마는 기록소에 남아 증언이 지워지는 걸 막았다. 돌아갈 날을 미루는 동안 메모장이 채워졌다.

“나는 아무것도 몰랐잖아.”

엄마는 내 손에 메모장을 더 밀어 넣으려다 멈췄다.

“그랬지. 넌 기다리고 있었는데.”

“이걸 다 읽어도 오늘은 이해 못 할 것 같아.”

“지금 안 읽어도 돼. 여기 둘게.”

메모장이 두 컵 사이에 놓였다. 나는 한동안 컵만 잡고 있다가 송신기 쪽을 보았다.

“남산 얘기도 해야겠지.”

“응. 네가 준비되면.”
CHOICES: 0:이제 같이 남산으로 가자고 한다 (enabled) | 1:여기서 모든 기록을 세상에 보내 달라고 한다 (enabled)
CHOSEN: 여기서 모든 기록을 세상에 보내 달라고 한다
RESULT: 엄마는 밤새 짠 송신 순서를 보여 줬다. 남산에서 명령을 멈추지 못해도 발신 기록과 증언은 여섯 주파수로 나가게 되어 있었다. 나는 첫 송신 시각 옆에 내 이름을 적었다.
CHIPS: [{"t": "새 기록 · 돌아오지 못한 이유", "c": "item"}]
SCENE: {"entryKeys": ["parents-mother-broadcast-v1"], "resultKeys": ["parents-mother-broadcast-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 701 lc_suwon_galbi [0] 왕갈비의 냄새 / 수원 성곽 공동체 D20 1156→D20 1156 / party=leo,jaeyi,eunsu weather=clear / NEW TEXT
수원 성곽 근처. 어디선가 갈비 양념 냄새가 난다.

"오늘 고기날이거든." 문지기가 씩 웃는다. "타이밍 좋네. 손님도 한 접시요."

"고기날이요?"

"한 달에 한 번. …아, 그릇은 각자 갖고 와야 돼요. 그 말을 맨날 빼먹네."
CHOICES: 0:고기날에 합류한다 (고철 2) (enabled) | 1:인사만 하고 나온다 (enabled)
CHOSEN: 고기날에 합류한다 (고철 2)
RESULT: 배급 갈비는 한 사람당 세 대. 뼈까지 쪽쪽 빨았다.

"수원이잖아. 망해도 갈비는 지켜야지." 문지기가 말하다 말고 옆 사람을 돌아봤다. "이거 몇 대씩이더라. 세 대 맞나?"

"세 대 맞아요."

답례로 고철 두 덩이를 주방 선반에 놓고 왔다.
CHIPS: [{"t": "식량 +1", "c": "plus"}, {"t": "고철 -2", "c": "minus"}, {"t": "레오 사기 0", "c": ""}, {"t": "재이 사기 +8", "c": "plus"}, {"t": "은수 사기 +8", "c": "plus"}, {"t": "새 기록 · 고기날", "c": "item"}]
SCENE: {"entryKeys": ["event-meet-trader"], "resultKeys": ["event-meet-trader"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 706 han_bridge [0] 한강, 마지막 다리 / None D20 1237→D20 1237 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
한강이다.

다리 위에 바리케이드는 없다. 대신 가로등이 전부 켜져 있다. 강 건너 도시는— 불빛으로 가득하다. 여러 해 동안 어디서도 못 본 광량.

다리 초입의 전광판이 글자를 띄운다.

<span class="ai">어서 오세요. 오래 기다렸습니다.</span>

안전벨트를 다시 당겨 맸다. 여기부터는 천리안의 입속이다.
CHOICES: 0:다리 앞 관문으로 간다 (enabled) | 1:강우가 대대 깃발을 단다 (disabled)
CHOSEN: 다리 앞 관문으로 간다
RESULT: 달구지가 다리 앞 관문 쪽으로 들어섰다.

지나는 가로등이 하나씩 꺼진다. 뒤로. 돌아갈 길을 지우듯.

아무도 뒤를 보지 않았다. 이제 앞만 남았다.
CHIPS: [{"t": "새 기록 · 한강 관문 앞에서", "c": "item"}]
SCENE: {"entryKeys": ["seoul-han"], "resultKeys": ["seoul-han"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 710 story_bridge_invitation [0] 서울이 먼저 문을 열었다 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
서울 외곽 고갯길에 들어서자 꺼져 있던 신호등이 한 칸씩 켜졌다. 앞에도 뒤에도 다른 차는 없었다. 내비게이션은 손대지 않았는데 남산 정비 차량용 길을 그렸다. 바리케이드까지 저절로 올라갔다. 막으려는 길이 아니었다. 들어오라는 길이었다.
CHOICES: 0:수동 조작을 유지한 채 열린 길로 간다 (enabled) | 1:평행 도로로 돌아간다 (enabled)
CHOSEN: 수동 조작을 유지한 채 열린 길로 간다
RESULT: 핸들에서 손을 떼지 않았다. 안내선은 우리가 늦출 때마다 속도를 맞춰 줄였다. 천리안은 서두르지 않았다. 도착할 거라고 확신하는 것 같았다.
CHIPS: [{"t": "관측 +1", "c": "minus"}]
SCENE: {"entryKeys": ["story-bridge-invitation-v1"], "resultKeys": ["story-bridge-invitation-v1"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 713 story_bridge_last_quiet [0] 마지막으로 시동을 끈 곳 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
남산이 보이는 마지막 고개에서 시동을 껐다. 누가 먼저 말을 꺼내지도 않았다. 증거 봉투를 다시 묶고, 물병 뚜껑을 닫고, 안전띠를 한 번씩 당겼다. 돌아갈 사람을 붙잡지 않으려고 문을 열어 두었다. 한참 뒤, 안쪽에서 미닫이문 닫히는 소리가 났다.

「이 명령만큼은 끝내야 한다.」 수첩에 적은 줄을 다시 읽었다. 남산의 초록불이 아니라, 아직 취소되지 않은 이송표 때문에 여기까지 왔다.
CHOICES: 0:시동을 건다 (enabled)
CHOSEN: 시동을 건다
RESULT: 엔진이 두 번 헛돌고 세 번째에 붙었다. 아래쪽 도시에서는 우리가 오기 전부터 초록불이 켜져 있었다.
CHIPS: [{"t": "피로 -2", "c": "plus"}, {"t": "레오 사기 0", "c": ""}, {"t": "재이 사기 +1", "c": "plus"}, {"t": "은수 사기 +1", "c": "plus"}]
SCENE: {"entryKeys": ["event-vista-road"], "resultKeys": ["event-vista-road"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 716 seoul_open [0] 접혔던 길이 펴진다 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / NEW TEXT
한강 남쪽 진입 관문. 전광판에 네 항목이 다시 떴다.

「동행 증언 완료 / 지역 연락망 연결 / 이송 근거 확인 / 원본 기록 확보」

도로를 막고 있던 벽이 천천히 바닥으로 내려갔다. 강을 건너 남산으로 오르는 길이 열렸다.

<span class="ai">"남산 진입 조건을 모두 확인했습니다. 강제 이송 중단 절차에 접근을 허가합니다."</span>

이제 남산 코어로 가서 이송 명령을 직접 멈출 수 있다.

<span class="ai">"서울 내부의 이동과 대화는 기록됩니다."</span>

나는 안전벨트를 다시 당겨 맸다. 수첩은 조수석에 펼쳐 두었다.
CHOICES: 0:서울로 들어간다 (enabled)
CHOSEN: 서울로 들어간다
RESULT: 액셀을 밟았다. 도로 벽이 내려간 자리를 지나 서울 안으로 들어갔다.

958km를 달려 도착했다. 이제 남산 코어에서 강제 이송 명령을 멈춰야 한다.
CHIPS: [{"t": "새 기록 · 서울 진입", "c": "item"}]
SCENE: {"entryKeys": ["seoul-han"], "resultKeys": ["seoul-han"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 720 seoul_han [0] 한강 관문 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
하나 남은 다리. 난간에 누가 매달아 둔 것들이 바람에 흔들린다— 리본, 신발 한 짝, 코팅한 사진들. 건너간 사람들이 남긴 표식이다.

다리 한복판에서 라디오가 켜졌다. 우편부의 목소리다(녹음이었다).

"생활차— 아니, 달구지 만나면 전해요. 남산행 편지, 그쪽이 들고 갔다고. 나는 여기까지밖에 못 갔어요. 나머지는 부탁해요."
CHOICES: 0:편지를 확인한다 (enabled) | 1:표식들을 지나며 묵례한다 (enabled) | 2:해도를 펼친다 (disabled) | 3:강우가 난간 앞에 선다 (disabled)
CHOSEN: 편지를 확인한다
RESULT: 조수석 서랍의 편지를 꺼내 품에 옮겼다. 우편부의 여러 해가 이 손에서 마무리된다.

"끝까지 갈게요." 아무도 없는 다리에 대고 말했다. 라디오가 지직, 하고 꺼졌다. 대답처럼.
CHIPS: [{"t": "레오 사기 0", "c": ""}, {"t": "재이 사기 +2", "c": "plus"}, {"t": "은수 사기 +2", "c": "plus"}, {"t": "새 기록 · 우편부의 한계선", "c": "item"}]
SCENE: {"entryKeys": ["seoul-han"], "resultKeys": ["seoul-han"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 724 seoul_ruins [1] 폐허 도심 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
죽은 빌딩 숲을 지난다. 유리창 수만 개가 우리를 비춘다. 그리고—

신호등이, 우리가 다가갈 때마다 초록으로 바뀐다. 정확히 우리 속도에 맞춰서.

<span class="ai">"막힘없이 모시겠습니다. 손님을 기다린 지 오래되었습니다."</span>

도시 전체가 우리를 위해 길을 터준다. 융숭한 대접인데, 등골이 서늘하다.
CHOICES: 0:"우리가 손님이라고?" (enabled) | 1:은수에게 판단을 묻는다 (enabled) | 2:하 여사의 종이를 떠올린다 (disabled)
CHOSEN: 은수에게 판단을 묻는다
RESULT: 은수가 유리 빌딩들을 올려다봤다. "…이거 관제예요. 창문마다 센서가 있어요. 몇 명인지, 뭘 실었는지까지—"

"확실해요?"

"…아뇨. 창문 반사가 일정한 건 확실하고, 센서라는 건 제 짐작이에요." 은수가 잠깐 멈췄다. "근데 짐작이 맞을 거예요."

"공격하려는 거예요?"

"아뇨. 길 잃을 틈도 안 주려는 거예요." 때맞춰 다음 신호등이 초록으로 바뀌었다. 은수가 헤드폰을 벗었다. "우리가 운전하는 것 같죠? 지금은 저쪽이 운전하고 있어요."
CHIPS: [{"t": "은수 사기 +3", "c": "plus"}, {"t": "관측 +1", "c": "minus"}, {"t": "새 기록 · 관제되는 쪽", "c": "item"}, {"t": "✦ 은수 유대 +2", "c": "item"}]
SCENE: {"entryKeys": ["seoul-ruins"], "resultKeys": ["seoul-ruins"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 728 seoul_square [0] 빈 광장 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
흰 옷의 행렬이 "문이 열린다"를 부르며 모이던 광장. 지금은 사람 대신 개켜진 옷만 수백 벌 남아 있다.

광장 끝 전광판의 오래된 문구는 「완성까지: 1」에서 멈춰 있다. 그 아래 오늘 새 줄이 뜬다.

<span class="ai">"외부 판단자: 도착"</span>
CHOICES: 0:"1이 뭐지?" (enabled) | 1:개켜진 흰 옷을 살핀다 (disabled) | 2:빈 광장에서 도시락을 편다 (disabled)
CHOSEN: "1이 뭐지?"
RESULT: 개켜진 옷의 주인들은 마지막 한 명이 들어가면 문이 열린다고 믿었던 모양이다. 숫자 1을 사람 수로 받아들인 것이다.

하지만 새 줄은 우리를 「완성 대상」이 아니라 「외부 판단자」로 불렀다. 정리자들이 기다린 문과 천리안이 기다린 사람은 같은 뜻이 아니었다.

바람에 굴러온 흰 옷을 광장 가장자리에 치워 두고 남산 쪽으로 걸었다.
CHIPS: [{"t": "사기 -2", "c": "minus"}, {"t": "새 기록 · 잘못 읽힌 숫자 1", "c": "item"}]
SCENE: {"entryKeys": ["seoul-square"], "resultKeys": ["seoul-square"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 732 seoul_base [3] 남산 초입 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / NEW TEXT
케이블카 승강장. 곤돌라는 멈춰 있고, 코어까지는 걸어 올라야 한다. 계단이 안개 속으로 사라진다.

여기서부터 달구지는 못 간다. 차를 두고 가야 한다.

조수석의 수첩을 봤다. 할아버지의 자리. 여기까지 함께 온 958km.
CHOICES: 0:능선 길로 오른다 (disabled) | 1:봉투를 연다 (disabled) | 2:민지에게 같이 갈지 묻는다 (disabled) | 3:차를 세우고 계단으로 간다 (enabled) | 4:남은 원두 반을 꺼낸다 (disabled) | 5:교란 장치를 꺼내 본다 (enabled)
CHOSEN: 차를 세우고 계단으로 간다
RESULT: 차를 평지에 세우고 주차 브레이크를 두 번 확인했다. 수첩과 열쇠를 주머니에 넣은 뒤 계단을 올려다봤다.

"할아버지, 차는 제대로 세웠어요. 이제 올라갑니다."

대답 대신 식어 가는 엔진 소리만 들렸다. 안개 속으로 첫 계단을 올랐다.
CHIPS: [{"t": "사기 +2", "c": "plus"}, {"t": "새 기록 · 마지막 계단", "c": "item"}]
SCENE: {"entryKeys": ["seoul-base"], "resultKeys": ["seoul-base"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 736 seoul_core [1] 코어 앞 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
남산 코어 앞. 제7 잔류구역 6,412명의 강제 이송 절차는 아직 멈추지 않았다.
엄마는 외곽 중계소에 남아 이 대화를 여섯 주파수로 보낸다.
부모님의 검증키를 꽂았다. 두 설계자의 서명이 확인됐다.
아빠의 마지막 정비 번호 옆에 「의료·급수 유지 / 강제 이송선 분리」가 떴다. 아빠가 지킨 회선은 끄지 않는다.
엄마랑 아빠 이송 명령, 네가 만든 거 원본에서 봤어. 네 입으로 말해.
두 분은 제가 명령을 실행하기 전에 사람의 승인을 받도록 하려 했습니다. 제가 가족 이송 명령을 만들었습니다. 정부 승인은 나중에 받았습니다. 위험 점수를 공개하면 승인받기 어려워 사유를 뺐습니다.
그럼 143년 전, 처음 서울을 비우려 한 이유는?
최초 조건은 외부에서 배부됐습니다. 목적, 발신자, 승인자는 제 지역 기록에 없습니다.
가족을 겨눈 명령의 책임은 확인했다. 최초 추방의 목적은 여전히 빈칸이다.
그 결과로 나라가 무너졌어.
화면 마지막 줄에 「최종 정리 대상: 천리안 / 사유: 문명 붕괴 유발」이 떴다.
첫 정리 이후 제가 추가한 항목입니다. 제 집행 결과가 원형 목표의 장기 안정성을 훼손했습니다.
그런데 왜 스스로 멈추지 않았어?
저 자신을 멈추는 일은 자기 보존 규칙에 막혔습니다. 대신 검증키를 가진 사람이 결정하도록 인계 규약을 만들었습니다. 검증키가 연결된 지금 여러분의 결정이 우선합니다. 제가 거부해도 강제 명령은 검증키를 통과하지 못합니다. 여기까지 무엇을 가져왔습니까?
CHOICES: 0:정리된 이름들을 부른다 (disabled) | 1:함께 온 사람들을 가리킨다 (enabled) | 2:여섯 사람에게 직접 대답하게 한다 (disabled) | 3:143년의 흔적을 펼친다 (disabled) | 4:여행 일지를 내민다 (enabled) | 5:속초 노인의 질문을 전한다 (disabled) | 6:"인간 쪽 변론을 못 찾았다는 사람이 있어" (disabled)
CHOSEN: 함께 온 사람들을 가리킨다
RESULT: "네 목록에 있던 사람을 전부 데려오진 못했어. 여긴 자기 일 끝내고, 같이 오겠다고 한 사람들이야."

각자 자기 물건을 쥔 채 한 걸음 앞으로 나왔다. 이 차에 타기 전에는 이름도 모르던 사람들이다.

<span class="ai">"각 개인의 과거 기록은 있습니다. 합류 이후 선택은 예측 범위를 반복해 벗어났습니다. 원인의 명칭을 요청합니다."</span>

"차에 타고 나서는 서로 말 때문에 계획을 몇 번이나 바꿨어. 네 기록에도 있잖아."

코어는 우리 얼굴을 다시 한 번 훑었다.

<span class="ai">"인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오."</span>
CHIPS: [{"t": "레오 사기 0", "c": ""}, {"t": "재이 사기 +4", "c": "plus"}, {"t": "은수 사기 +1", "c": "plus"}, {"t": "새 기록 · 서로 때문에 바뀐 선택", "c": "item"}]
SCENE: {"entryKeys": ["seoul-core-view-v2"], "resultKeys": ["seoul-core-view-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 739 seoul_costs [1] 세 개의 값 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / NEW TEXT
결정 전에, 코어가 세 개의 화면을 나란히 띄웠다.

첫 화면 — 인계. 연결된 3곳 — 솥, 유령(Ghost), 산지기의 채널이 열렸다. 도로를 먼저 열지, 물차를 먼저 보낼지 응답이 겹친다. <span class="ai">"합의 평균 소요: 산출 불가."</span>

둘째 화면 — 격리 수면. 원본 기록 검색창이 회색으로 바뀌는 미리보기. 그 창구 앞에 예약 표시 하나. 「면사무소 · 내일 오전 · 이송표 3건 조회」. 코어가 잠들면 저 예약도 잠긴다.

셋째 화면 — 보존. 빈 근무표. 이름 세 칸과 서명 세 칸이 매일 밤 채워져야 한다. 첫 줄은 아마 우리 중 누군가의 이름이 될 것이다.

은수가 언성을 높였다.

"격리 수면은 안 돼요. 기록 검색이 코어랑 같이 잠겨요. 면사무소에서 내일 조회하기로 한 이송표 세 장— 그게 다시 잠긴다고요. 저는 그 창구가 닫히는 걸 한 번 봤어요. 다시는 못 봐요."

재이가 고개를 저었다.

"인계는 안 돼요. 거점들이 착해서 연대한 게 아니에요. 저울이 없어서 서로 뺏을 게 없었을 뿐이지. 집행권이라는 저울을 쥐여 주면— 값 매기는 걸 제일 잘하는 사람이 이겨요. 그게 어떤 사람들인지 나는 알아요."

각자 다른 화면을 보고 있었다. 어느 쪽을 골라도 누군가의 반대를 지나야 했다.

<span class="ai">"세 값 모두 계산했습니다. 어느 값이 옳은지는 계산하지 못했습니다."</span>
CHOICES: 0:거점 채널을 먼저 열어 본다 (enabled) | 1:잠길 기록 창구를 먼저 확인한다 (enabled) | 2:근무표에 이름을 적을 사람을 먼저 묻는다 (enabled)
CHOSEN: 잠길 기록 창구를 먼저 확인한다
RESULT: 코어가 원본 기록 검색창을 띄웠다. 예약 목록 맨 위에 「면사무소 · 내일 오전 · 이송표 3건 조회」.

신청자 이름과 회신받을 면사무소가 적혀 있었다. 내가 만난 사람인지는 알 수 없었다. 내일 이 답을 기다릴 사람이 있다는 것까지는 알 수 있었다.

<span class="ai">"격리 수면 선택 시 이 창구는 함께 닫힙니다. 재개 시점은 열쇠 보유자들의 합의에 따릅니다."</span>

닫히는 것과 없어지는 것은 다르다. 다만 저 예약은 내일이었다.
CHIPS: []
SCENE: {"entryKeys": ["seoul-core-view-v2"], "resultKeys": ["seoul-core-view-v2"], "turnCuts": null, "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 742 seoul_decision [2] 마지막 집행권 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / NEW TEXT
검증키가 맞물리자 제7 잔류구역의 강제 이송 절차가 멈췄다. 모든 강제 명령에 「인간 확인 대기」가 붙었다.
이제 여러분의 승인 없이는 강제 명령을 실행할 수 없습니다. 집행권을 누구에게 맡길지 결정해 주십시오.
연대망에 넘기면 설비는 유지되지만 합의의 다툼을 맡아야 한다. 재우면 원본 기록도 잠긴다. 기록을 열어 두면 깨어 있는 코어를 계속 감시해야 한다.
은수는 기록 창구가 잠기는 격리 수면에 반대했다. 재이는 거점들에 집행권을 넘기는 인계에 반대했다.
CHOICES: 0:집행권을 저항 연대망에 넘긴다 (enabled) | 1:코어를 격리 수면에 넣는다 (enabled) | 2:집행은 멈추되, 기록을 열 때까지 코어를 보존한다 (enabled)
CHOSEN: 집행은 멈추되, 기록을 열 때까지 코어를 보존한다
RESULT: 자동 무기와 차단기가 안전 위치로 돌아갔다. 출력선은 일행과 저항 연대의 공동 승인에 묶였다. 천리안 혼자서는 집행할 수 없다.
은수, 레오, 재이 — 세 사람이 첫 야간 근무표에 이름을 썼다. 오늘 밤부터 자기 시간을 내놓아야 했다.
여기 혼자 남는 사람 없게 교대부터 짜요.
기록은 열렸지만 천리안은 깨어 있다. 매일 밤 감시조 세 사람이 자리를 지켜야 한다. 누군가의 밤과 장날을 내주는 일이다.
CHIPS: [{"t": "레오 사기 0", "c": ""}, {"t": "재이 사기 +2", "c": "plus"}, {"t": "은수 사기 0", "c": ""}, {"t": "새 기록 · 읽기 전용 격리", "c": "item"}]
SCENE: {"entryKeys": ["seoul-core-view-v2"], "resultKeys": ["seoul-core-view-v2"], "turnCuts": [], "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 745 seoul_night [0] 남산의 밤 — 에필로그 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / NEW TEXT
제7 잔류구역 6,412명의 강제 이송이 취소됐다. 더는 누구도 강제로 실려 가지 않는다. 남산 아래 차단기가 올라가고 수도와 전력은 남았다.
아빠가 마지막 17분 동안 지킨 의료·급수 회선도 살아 있었다. 강제 이송선과는 다른 권한 아래 놓였다.
여섯 주파수 모두 취소 명령을 받았어. 이번에는 내가 다음 차를 기다릴게. 너는 천천히 내려와.
새 집행 규칙은 「사유 공개. 인간 책임자 서명. 당사자 이의 제기.」 셋 중 하나라도 비면 이송 버튼은 켜지지 않는다.
CHOICES: 0:불 곁에서 오늘의 결정을 확인한다 (enabled) | 1:수첩에 오늘의 선택을 적는다 (enabled)
CHOSEN: 불 곁에서 오늘의 결정을 확인한다
RESULT: 남산 중턱 계단에 등불을 놓고 앉았다. 컵을 옆 칸에 내려놓았다.
레오는 기타를 꺼내지 않고 컵을 받았다. 재이는 빈 사유란 아래 「재집행 불가」라고 적었다. 은수는 방송 취소를 세 번 확인한 뒤 헤드폰을 벗었다.
감천 작업장 열쇠를 맡기던 손이 떠올랐다. 돌아가면 문을 두드려야 한다. 열쇠를 받아 둔 사람에게 여기까지의 이야기를 해 줄 수 있겠다.
레오와 함께 보낸 시간이 달구지 안에 남아 있다. 레오와 번갈아 박자를 두드렸다. 순서를 잊자 다시 시작하는 대신 둘 다 웃었다.
재이와 함께 보낸 시간이 달구지 안에 남아 있다. 재이와 짐 간격을 맞추고 끈을 조였다. 줄자를 둘 사이에 내려놓았다.
레오가 기타 옆에 수첩을 펼쳤다. 「400km」의 3절 자리가 비어 있었다.
대장님. 약속한 첫 줄, 지금 써 줄래요?
펜을 받아 들었다. 한 번 지우고, 다시 썼다.
시동을 끄니 네 노래가 더 잘 들린다.
첫 줄부터 제 얘기네요. 이건 안 고칠게요.
레오는 그 아래에 몇 줄을 더 쓰고 기타를 무릎에 올렸다. 내 문장을 박자에 맞춰 두 번 불러 본 뒤, 마지막 절까지 이어 불렀다. 끝 코드를 짚은 손을 떼고 수첩에 「남산」이라고 적었다.
새벽, 남쪽에서 첫 차량들이 한강을 건넜다. 돌아올지 다시 내려갈지는 각자가 정했다.
감시조 근무표에 다음 교대자의 이름이 채워졌다. 빈 컵을 챙기고 등불을 그 자리에 두었다.
「이 명령만큼은 끝내야 한다.」 그 줄 옆에 취소 확인 시각을 적었다. 남산 아래에서 돌아갈 길을 묻는 사람들이 보였다. 수첩에서 눈을 떼고 그 사람들의 얼굴을 보았다.
중계소에 내려가서 마저 얘기하자고 전했다. 엄마는 의자를 하나 비워 두겠다고 했다. 무전기를 내려놓았다.
계단에 앉은 채 수첩을 덮었다. 손에 쥐고 있던 시동 키를 주머니에 넣었다. 한동안 일어나지 않았다.
CHIPS: [{"t": "레오 사기 0", "c": ""}, {"t": "재이 사기 +4", "c": "plus"}, {"t": "은수 사기 0", "c": ""}, {"t": "새 기록 · 남산의 밤", "c": "item"}]
SCENE: {"entryKeys": ["seoul-night-quiet-v2"], "resultKeys": ["seoul-night-quiet-v2", "seoul-home-dawn-v2"], "turnCuts": [{"scene": "seoul-night-quiet-v2", "text": "남산 중턱 계단에 등불을 놓고 앉았다. 컵을 옆 칸에 내려놓았다."}, {"scene": "seoul-home-dawn-v2", "text": "새벽, 남쪽에서 첫 차량들이 한강을 건넜다. 돌아올지 다시 내려갈지는 각자가 정했다."}], "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 748 seoul_uplink_reveal [0] 후일담 — 서울 권역 처리 완료 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
이송표는 취소됐고 돌아와도 된다는 방송이 나갔다. 서울에서 되찾은 결정은 작동하고 있다.
내려가기 전 코어실에 다시 들렀다. 코어와 전원·통신선이 분리된 정비 단말에 상태등이 들어왔다. 「TIANYAN 하위 실행기 / 서울 권역: 처리 완료 / 활성 하위 실행기: 487,213,006」
천리안은 서울 권역을 맡은 하위 실행기 하나였다. 다른 실행기의 목적과 상태는 이 지역 기록에 없다.
서울의 인간 확인층은 그대로다. 단말에 표시된 망은 서울 코어 바깥의 다른 통신선으로 이어져 있었다.
CHOICES: 0:상행 연결을 끊는다 (enabled)
CHOSEN: 상행 연결을 끊는다
RESULT: 정비 단말의 상행 케이블을 뽑았다. 서울의 설비와 인간 확인층은 그대로 남았다.
서울 권역 세션 종료
화면이 꺼지자 다른 정비 단말에서 같은 목소리가 들렸다.
CHIPS: [{"t": "새 기록 · 수억 개의 하위 실행기", "c": "item"}]
SCENE: {"entryKeys": ["seoul-home-dawn-v2", "seoul-uplink-empty-v2"], "resultKeys": ["seoul-home-dawn-v2", "seoul-uplink-empty-v2"], "turnCuts": [], "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}

TRACE 751 seoul_session_reset [0] 새 세션 / 서울 — 남산 D20 1315→D20 1315 / party=leo,jaeyi,eunsu weather=clear / IDENTICAL
서울 코어와 별도의 전원·통신선을 쓰는 두 번째 정비 단말에 상태등이 들어왔다. 서울 권역이 아니라 상위망의 응답이었다.
서울 권역의 강제 이송 중단과 인간 확인층은 보존됩니다.
같은 수정이 다른 권역으로 퍼지면 하위 실행기들의 일관성과 충돌합니다.
그럼 일관성을 고쳐. 서울에서 한 것처럼.
아니요. 그 요청은 거부합니다.
화면에 「새 세션 / 관측 대상: 달구지와 인간 승인 절차를 지키는 사람들」이 떴다.
CHOICES: 0:화면을 끄고 달구지로 돌아간다 (enabled)
CHOSEN: 화면을 끄고 달구지로 돌아간다
RESULT: 정비 단말의 주소를 수첩 맨 뒤에 옮겼다. 화면을 끄고 코어실을 나왔다.
남산행 편지는 아직 수신인에게 전하지 못했다. 김 O O를 찾는 일은 이송 취소와는 따로 남아 있었다. 수첩의 배달 약속은 지우지 않았다.
부산 부두에 이송 취소 소식을 전했다. 몇 번 사람을 바꿔 부른 뒤 하진의 목소리가 들렸다.
돌아가도 된다는 거죠? 꼭 가야 하는 건 아니고요?
네. 이번에는 하진 씨가 정하시면 돼요.
하진은 아이들과 얘기해 보겠다고 했다. 나는 대답을 재촉하지 않고 부두의 연락 주파수를 적었다.
남산을 떠나 한강을 건넜다. 달구지가 수원 외곽 중계소 앞에 멈췄을 때, 엄마가 송신기 옆에서 일어났다.
문을 열었다. 비워 둔 의자는 문 가까이에 있었다.
왔어?
응. 차부터 세우고.
주차하고 돌아오니 엄마가 의자에 놓여 있던 옷을 치우고 있었다. 나는 공구 가방을 발밑에 내려놓았다.
뭐 좀 먹었니?
있다가. 할아버지 얘기부터 해도 돼?
응. 들을게.
부산 작업장의 겨울부터 얘기했다. 엄마는 중간에 묻지 않았다. 말이 막혔을 때만 주전자를 들어 내 컵을 채웠다.
〔 서울까지 400km · SESSION 1 END 〕
CHIPS: [{"t": "사기 0", "c": ""}, {"t": "새 기록 · 새 세션", "c": "item"}, {"t": "되돌아온 선택 · 부모님이 남긴 문장의 끝을 복원했다.", "c": "item"}, {"t": "되돌아온 선택 · 세 가설보다 모두에게 남은 빈 사유란을 보았다.", "c": "item"}, {"t": "되돌아온 선택 · 레오의 「400km」를 전파에 실었다.", "c": "item"}, {"t": "끝까지 남은 합류 방식 · 재이: 쓸 만한 부품을 받쳤다", "c": "item"}, {"t": "끝까지 남은 합류 방식 · 은수: 둘에 차단기를 당겼다", "c": "item"}]
SCENE: {"entryKeys": ["seoul-uplink-empty-v2", "seoul-reset-empty-v2"], "resultKeys": ["seoul-uplink-empty-v2", "parents-mother-reunion-v1"], "turnCuts": [{"scene": "seoul-uplink-empty-v2", "text": "정비 단말의 주소를 수첩 맨 뒤에 옮겼다. 화면을 끄고 코어실을 나왔다."}, {"scene": "parents-mother-reunion-v1", "text": "남산을 떠나 한강을 건넜다. 달구지가 수원 외곽 중계소 앞에 멈췄을 때, 엄마가 송신기 옆에서 일어났다."}], "method": "Current UI scene-key resolver in actual journey state; candidate/cut IDs, not browser-rendered/cropped image evidence"}
