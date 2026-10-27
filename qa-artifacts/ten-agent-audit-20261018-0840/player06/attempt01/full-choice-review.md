
## choice 1 / trace 2 / opening_workshop / 감천 작업장의 마지막 호출
BEFORE {"at":"busan","location":"부산 감천 부두","day":1,"min":450,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":0,"party":[],"items":{"부품":1,"의약품":1,"탄약":0},"ended":false,"main":{"title":"도윤 가족의 이송표를 확인한다","phase":"부산 감천 부두 · 떠나기 전","why":"도윤 가족도 내 부모님과 같은 이송표를 받았다. 같은 명령이 지금도 가족을 갈라놓고 있는지 확인한다.","next":"고장 난 버스를 고친 뒤 도윤 가족에게 이송표를 어디서 받았는지 묻는다.","progress":{"have":0,"need":13,"label":"0/13"}},"navigation":{"key":"main_prologue-family","kind":"main","target":"seoul","title":"도윤 가족의 이송표를 확인한다","action":"고장 난 버스를 고친 뒤 도윤 가족에게 이송표를 어디서 받았는지 묻는다."}}
ENTRY
냉동차 호스를 갈고 나니 밥이 식어 있었다. 할아버지가 떠난 뒤로 감천 작업장의 수리는 혼자 맡았다.
이것만 먹고 달구지에서 좀 자자. 내일은 손수레 바퀴부터 봐야지.
숟가락을 들자 새벽 무전이 울렸다. 서울에서 내려온 이송 버스의 난방이 멈췄다고 했다. 열이 난 아이도 타고 있었다.
PUBLIC CHOICES
{"index":0,"id":"answer_call","label":"공구함을 닫고 바로 부두로 간다","hint":"즉시 · 시간 5분","visible":true,"enabled":true,"requirement":""}
{"index":1,"id":"pack_workshop","label":"난로를 끄고 예비 공구까지 챙긴다","hint":"즉시 · 시간 15분 · 이후 · 예비 공구를 싣는다","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"id":"answer_call","label":"공구함을 닫고 바로 부두로 간다","hint":"즉시 · 시간 5분","visible":true,"enabled":true,"requirement":""}
RESULT
먹던 밥을 덮고 달구지에 올랐다. 평소와 같은 수리 호출인 줄 알았다.
CHIPS [{"t":"5분 경과","c":""},{"t":"새 기록 · 새벽의 수리 호출","c":"item"}]
AFTER {"at":"busan","location":"부산 감천 부두","day":1,"min":455,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":0.22499999999999998,"party":[],"items":{"부품":1,"의약품":1,"탄약":0},"ended":false,"main":{"title":"도윤 가족의 이송표를 확인한다","phase":"부산 감천 부두 · 떠나기 전","why":"도윤 가족도 내 부모님과 같은 이송표를 받았다. 같은 명령이 지금도 가족을 갈라놓고 있는지 확인한다.","next":"고장 난 버스를 고친 뒤 도윤 가족에게 이송표를 어디서 받았는지 묻는다.","progress":{"have":0,"need":13,"label":"0/13"}},"navigation":{"key":"main_prologue-family","kind":"main","target":"seoul","title":"도윤 가족의 이송표를 확인한다","action":"고장 난 버스를 고친 뒤 도윤 가족에게 이송표를 어디서 받았는지 묻는다."}}
MESSAGES []

## choice 2 / trace 4 / opening_bus_repair / 난방이 끊긴 가족 버스
BEFORE {"at":"busan","location":"부산 감천 부두","day":1,"min":455,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":0.22499999999999998,"party":[],"items":{"부품":1,"의약품":1,"탄약":0},"ended":false,"main":{"title":"도윤 가족의 이송표를 확인한다","phase":"부산 감천 부두 · 떠나기 전","why":"도윤 가족도 내 부모님과 같은 이송표를 받았다. 같은 명령이 지금도 가족을 갈라놓고 있는지 확인한다.","next":"고장 난 버스를 고친 뒤 도윤 가족에게 이송표를 어디서 받았는지 묻는다.","progress":{"have":0,"need":13,"label":"0/13"}},"navigation":{"key":"main_prologue-family","kind":"main","target":"seoul","title":"도윤 가족의 이송표를 확인한다","action":"고장 난 버스를 고친 뒤 도윤 가족에게 이송표를 어디서 받았는지 묻는다."}}
ENTRY
하진은 맨 뒤 버스에서 열이 난 유나를 안고 있었다. 여덟 살 도윤이 공구함을 보고 다가와 소매를 붙잡았다.
유나 손이 자꾸 차가워져요. 이거 고치면 따뜻해져요?
바람은 다시 나오게 해 볼게. 여기 조금만 비켜 줄래?
도윤이 하진 곁으로 물러섰다. 점검판 안쪽의 난방 호스가 찢어져 있었다. 새 부품으로 잇거나, 연결 고리를 깎거나, 남은 호스를 당겨 물려야 했다.
PUBLIC CHOICES
{"index":0,"id":"new_part","label":"새 연결 부품으로 바로 고친다","hint":"즉시 · 부품 1개 · 시간 20분","visible":true,"enabled":true,"requirement":""}
{"index":1,"id":"scrap_collar","label":"고철로 연결 고리를 새로 깎는다","hint":"즉시 · 고철 3 · 시간 35분","visible":true,"enabled":true,"requirement":""}
{"index":2,"id":"hose_bypass","label":"남은 호스를 잘라 우회한다","hint":"즉시 · 시간 55분","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"id":"new_part","label":"새 연결 부품으로 바로 고친다","hint":"즉시 · 부품 1개 · 시간 20분","visible":true,"enabled":true,"requirement":""}
RESULT
새 연결부를 조여 넣자 미지근한 바람이 돌아왔다. 유나의 굳었던 손이 조금 펴졌다.
CHIPS [{"t":"20분 경과","c":""},{"t":"부품 -1","c":"minus"},{"t":"새 기록 · 도윤 가족의 버스","c":"item"}]
AFTER {"at":"busan","location":"부산 감천 부두","day":1,"min":475,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":1.125,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부산에서 이송 명령에 이의를 제기한다","phase":"부산 원격 민원 창구","why":"부산에서 명령을 취소할 수 있다면 남산까지 갈 필요가 없다. 먼저 부산의 공식 절차를 확인한다.","next":"부두 민원 단말에서 도윤 가족의 이송 명령에 이의를 제기한다.","progress":{"have":1,"need":13,"label":"1/13"}},"navigation":{"key":"main_prologue-appeal","kind":"main","target":"seoul","title":"부산에서 이송 명령에 이의를 제기한다","action":"부두 민원 단말에서 도윤 가족의 이송 명령에 이의를 제기한다."}}
MESSAGES []

## choice 3 / trace 6 / opening_name_introduction / 도윤과 첫 인사
BEFORE {"at":"busan","location":"부산 감천 부두","day":1,"min":475,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":1.125,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부산에서 이송 명령에 이의를 제기한다","phase":"부산 원격 민원 창구","why":"부산에서 명령을 취소할 수 있다면 남산까지 갈 필요가 없다. 먼저 부산의 공식 절차를 확인한다.","next":"부두 민원 단말에서 도윤 가족의 이송 명령에 이의를 제기한다.","progress":{"have":1,"need":13,"label":"1/13"}},"navigation":{"key":"main_prologue-appeal","kind":"main","target":"seoul","title":"부산에서 이송 명령에 이의를 제기한다","action":"부두 민원 단말에서 도윤 가족의 이송 명령에 이의를 제기한다."}}
ENTRY
공구를 챙기는 내 옆으로 도윤이 다가왔다.
아저씨, 이름이 뭐예요?
PUBLIC CHOICES
{"index":0,"id":"say_name","label":"이름을 말한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"id":"say_name","label":"이름을 말한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
상혁이야.
도윤이 하진 쪽으로 고개를 돌렸다.
엄마, 상혁 아저씨래.
CHIPS []
AFTER {"at":"busan","location":"부산 감천 부두","day":1,"min":475,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":1.125,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부산에서 이송 명령에 이의를 제기한다","phase":"부산 원격 민원 창구","why":"부산에서 명령을 취소할 수 있다면 남산까지 갈 필요가 없다. 먼저 부산의 공식 절차를 확인한다.","next":"부두 민원 단말에서 도윤 가족의 이송 명령에 이의를 제기한다.","progress":{"have":1,"need":13,"label":"1/13"}},"navigation":{"key":"main_prologue-appeal","kind":"main","target":"seoul","title":"부산에서 이송 명령에 이의를 제기한다","action":"부두 민원 단말에서 도윤 가족의 이송 명령에 이의를 제기한다."}}
MESSAGES []

## choice 4 / trace 8 / opening_failed_appeal / 사유가 없는 이송표
BEFORE {"at":"busan","location":"부산 감천 부두","day":1,"min":475,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":1.125,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부산에서 이송 명령에 이의를 제기한다","phase":"부산 원격 민원 창구","why":"부산에서 명령을 취소할 수 있다면 남산까지 갈 필요가 없다. 먼저 부산의 공식 절차를 확인한다.","next":"부두 민원 단말에서 도윤 가족의 이송 명령에 이의를 제기한다.","progress":{"have":1,"need":13,"label":"1/13"}},"navigation":{"key":"main_prologue-appeal","kind":"main","target":"seoul","title":"부산에서 이송 명령에 이의를 제기한다","action":"부두 민원 단말에서 도윤 가족의 이송 명령에 이의를 제기한다."}}
ENTRY
공구를 하나씩 공구함에 넣는 동안, 버스 안 공기가 조금씩 데워졌다.

버스를 떠나기 전, 도윤이 이송표를 내밀었다. 가족 이름과 짐 무게는 적혀 있었다. 사유와 최종 승인자 칸은 부모님의 표처럼 비어 있었다.
엄마는 가방 안에 내 옷을 눌러 담았다. 나는 꺼내 놓은 로봇을 무릎에 얹고 기다렸다.
같이 가면 안 돼?
다음 차로 꼭 갈게. 네 가방은 할아버지 차에 실어 줄게.
열세 번 넣었어요. 접수됐다고는 해요. 다음 날 보면 신청한 것도 없어져 있고요.
부산 단말에서도 한번 볼게요. 사람이 받는 접수처가 있는지.
이 단말에서는 이송 명령에 대한 이의 신청을 받을 수 없습니다. 명령을 확인하려면 서울 남산으로 직접 가셔야 합니다.
화면 아래에 제7 잔류구역 등록 인원 6,412명이 떴다. 하진은 대답 대신 유나의 옷깃을 여몄다. 이 버스가 끝이 아니었다.
PUBLIC CHOICES
{"index":0,"id":"copy_receipt","label":"거절 응답과 이송표를 함께 복사한다","hint":"즉시 · 시간 15분 · 이후 · 종이 사본을 여정 기록에 보관한다","visible":true,"enabled":true,"requirement":""}
{"index":1,"id":"record_names","label":"하진에게 허락을 구하고 가족 이름부터 적는다","hint":"즉시 · 시간 30분 · 이후 · 허락받은 이름을 여정 기록에 보관한다","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"id":"copy_receipt","label":"거절 응답과 이송표를 함께 복사한다","hint":"즉시 · 시간 15분 · 이후 · 종이 사본을 여정 기록에 보관한다","visible":true,"enabled":true,"requirement":""}
RESULT
빈 사유 칸과 거절 응답을 한 장에 인쇄했다. 사본은 접어 넣고 원본은 도윤에게 돌려줬다. 아이가 종이 가장자리를 두 손으로 폈다.
CHIPS [{"t":"15분 경과","c":""},{"t":"새 기록 · 부산에서 막힌 이의 제기","c":"item"}]
AFTER {"at":"busan","location":"부산 감천 부두","day":1,"min":490,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":1.7999999999999998,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"엄마가 남긴 장치를 확인한다","phase":"부산의 달구지 안","why":"엄마가 남긴 장치가 실제로 강제 이송을 멈출 수 있는지 확인한다.","next":"엄마의 회로도와 달구지 계기판 안쪽의 배선을 비교한다.","progress":{"have":2,"need":13,"label":"2/13"}},"navigation":{"key":"main_prologue-module","kind":"main","target":"seoul","title":"엄마가 남긴 장치를 확인한다","action":"엄마의 회로도와 달구지 계기판 안쪽의 배선을 비교한다."}}
MESSAGES []

## choice 5 / trace 10 / opening_parents_module / 계기판 뒤의 검증키
BEFORE {"at":"busan","location":"부산 감천 부두","day":1,"min":490,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":1.7999999999999998,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"엄마가 남긴 장치를 확인한다","phase":"부산의 달구지 안","why":"엄마가 남긴 장치가 실제로 강제 이송을 멈출 수 있는지 확인한다.","next":"엄마의 회로도와 달구지 계기판 안쪽의 배선을 비교한다.","progress":{"have":2,"need":13,"label":"2/13"}},"navigation":{"key":"main_prologue-module","kind":"main","target":"seoul","title":"엄마가 남긴 장치를 확인한다","action":"엄마의 회로도와 달구지 계기판 안쪽의 배선을 비교한다."}}
ENTRY
작업장으로 돌아와 엄마의 철제 상자를 열었다. 수첩 등판에서 회로도가 떨어졌다. 남산 현장 확인 포트, 달구지 계기판. 엄마가 설계하고 아빠가 만든 인간 확인 검증키의 배선이었다. 명령을 실행하기 전에 사람의 승인을 받게 하는 장치다.
계기판 뒤? 이 차를 그렇게 뜯어 봤는데.
덮개 안쪽에 천으로 감싼 모듈이 있었다. 선을 잡았다가 놓았다. 분리 순서 두 장이 뜯겨 있었다. 잘못 뽑으면 검증키와 달구지 전장이 함께 타 버린다는 경고만 남아 있었다.
이송이 다시 시작되면 발신 기록과 당사자 증언을 함께 가져갈 것. 장치만으로는 검증이 끝나지 않는다. 현장 확인은 남산에서.
PUBLIC CHOICES
{"index":0,"id":"label_wires","label":"배선에 번호를 붙이고 덮개를 닫는다","hint":"즉시 · 시간 25분 · 이후 · 배선에 번호표를 남긴다","visible":true,"enabled":true,"requirement":""}
{"index":1,"id":"trace_diagram","label":"회로도에 지금 배선 경로를 덧그린다","hint":"즉시 · 시간 40분 · 이후 · 현재 배선을 도면에 남긴다","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"id":"label_wires","label":"배선에 번호를 붙이고 덮개를 닫는다","hint":"즉시 · 시간 25분 · 이후 · 배선에 번호표를 남긴다","visible":true,"enabled":true,"requirement":""}
RESULT
선마다 번호를 붙였다. 덮개를 닫기 전, 떨어질 만한 종이 끝을 한 번 더 눌렀다. 모듈은 분리 순서를 찾을 때까지 이 자리에 둔다.
CHIPS [{"t":"25분 경과","c":""},{"t":"새 기록 · 계기판 속 검증키","c":"item"}]
AFTER {"at":"busan","location":"부산 감천 부두","day":1,"min":515,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":2.925,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"이송 명령의 첫 발신 기록을 찾는다","phase":"부산을 떠난 첫 구간","why":"이송표 한 장만으로는 명령을 누가 보냈는지 알 수 없다. 발신 번호가 남은 기록이 필요하다.","next":"양산 쪽 첫 구간으로 출발해 이송표의 발신 번호가 남은 기록을 찾는다.","progress":{"have":3,"need":13,"label":"3/13"}},"navigation":{"key":"main_first-trace","kind":"main","target":"seoul","title":"이송 명령의 첫 발신 기록을 찾는다","action":"양산 쪽 첫 구간으로 출발해 이송표의 발신 번호가 남은 기록을 찾는다."}}
MESSAGES []

## choice 6 / trace 12 / opening_departure / 작업장 셔터를 내리는 아침
BEFORE {"at":"busan","location":"부산 감천 부두","day":1,"min":515,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":2.925,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"이송 명령의 첫 발신 기록을 찾는다","phase":"부산을 떠난 첫 구간","why":"이송표 한 장만으로는 명령을 누가 보냈는지 알 수 없다. 발신 번호가 남은 기록이 필요하다.","next":"양산 쪽 첫 구간으로 출발해 이송표의 발신 번호가 남은 기록을 찾는다.","progress":{"have":3,"need":13,"label":"3/13"}},"navigation":{"key":"main_first-trace","kind":"main","target":"seoul","title":"이송 명령의 첫 발신 기록을 찾는다","action":"양산 쪽 첫 구간으로 출발해 이송표의 발신 번호가 남은 기록을 찾는다."}}
ENTRY
계기판 덮개를 닫고 작업장 안을 마지막으로 둘러봤다.

엄마의 상자는 조수석 아래, 할아버지의 렌치는 운전석 옆에 넣었다. 수리 쉰다는 쪽지를 쓰다가 돌아올 날짜에서 펜이 멈췄다.
내일 손수레 맡기러 올 텐데. …부탁은 해 놓고 가야지.
단골에게 수리가 늦어진다고 알리고 셔터를 절반 내렸다. 공구함 열쇠가 손에 남았다. 맡기고 갈까, 직접 가지고 갈까.
PUBLIC CHOICES
{"index":0,"id":"leave_key","label":"단골에게 공구함 열쇠를 맡긴다","hint":"즉시 · 시간 10분 · 이후 · 단골이 공구함 열쇠를 보관한다","visible":true,"enabled":true,"requirement":""}
{"index":1,"id":"keep_key","label":"열쇠를 챙기고 문에 쪽지를 붙인다","hint":"즉시 · 시간 5분 · 이후 · 공구함 열쇠를 지니고 간다","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"id":"leave_key","label":"단골에게 공구함 열쇠를 맡긴다","hint":"즉시 · 시간 10분 · 이후 · 단골이 공구함 열쇠를 보관한다","visible":true,"enabled":true,"requirement":""}
RESULT
단골 손에 열쇠를 쥐여 줬다. 돌아올 날짜는 못 적겠다고, 셔터와 공구함만 가끔 봐 달라고 했다. 빈 주머니를 한 번 짚고 달구지에 올랐다.
CHIPS [{"t":"10분 경과","c":""},{"t":"새 기록 · 맡겨 둔 작업장 열쇠","c":"item"}]
AFTER {"at":"busan","location":"부산 감천 부두","day":1,"min":525,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":3.375,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"이송 명령의 첫 발신 기록을 찾는다","phase":"부산을 떠난 첫 구간","why":"이송표 한 장만으로는 명령을 누가 보냈는지 알 수 없다. 발신 번호가 남은 기록이 필요하다.","next":"양산 쪽 첫 구간으로 출발해 이송표의 발신 번호가 남은 기록을 찾는다.","progress":{"have":3,"need":13,"label":"3/13"}},"navigation":{"key":"main_first-trace","kind":"main","target":"seoul","title":"이송 명령의 첫 발신 기록을 찾는다","action":"양산 쪽 첫 구간으로 출발해 이송표의 발신 번호가 남은 기록을 찾는다."}}
MESSAGES []

## choice 7 / trace 14 / opening_farewell / 이제, 내가 가는 길
BEFORE {"at":"busan","location":"부산 감천 부두","day":1,"min":525,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":3.375,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"이송 명령의 첫 발신 기록을 찾는다","phase":"부산을 떠난 첫 구간","why":"이송표 한 장만으로는 명령을 누가 보냈는지 알 수 없다. 발신 번호가 남은 기록이 필요하다.","next":"양산 쪽 첫 구간으로 출발해 이송표의 발신 번호가 남은 기록을 찾는다.","progress":{"have":3,"need":13,"label":"3/13"}},"navigation":{"key":"main_first-trace","kind":"main","target":"seoul","title":"이송 명령의 첫 발신 기록을 찾는다","action":"양산 쪽 첫 구간으로 출발해 이송표의 발신 번호가 남은 기록을 찾는다."}}
ENTRY
남산에 가면 우리도 집에 돌아갈 수 있어요?
그렇게 만들러 가는 거야. 하지만 아직은 몰라. 더 찾아야 할 게 있어.
이미 떠난 사람들도 있어요. 그 사람들은 어떻게 됐는지, 가시면 알아봐 주세요.
네. 먼저 떠난 사람들도 찾아보겠습니다.
도윤은 가족의 이송표 사본을 조수석 수첩 위에 올려놓았다. 하진은 유나가 기다리는 버스로 돌아갔다.
서울까지 400km. 시동 모터가 한 번 헛돌았고, 두 번째에 엔진이 붙었다.
할아버지, 다녀올게.
PUBLIC CHOICES
{"index":0,"id":"begin_road","label":"길로 나간다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"id":"begin_road","label":"길로 나간다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
양산 쪽으로 가며 이송표의 발신 기록을 찾는다.
CHIPS []
AFTER {"at":"busan","location":"부산 감천 부두","day":1,"min":525,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":16,"van":82,"fatigue":3.375,"party":[],"items":{"부품":0,"의약품":1,"탄약":0},"ended":false,"main":{"title":"이송 명령의 첫 발신 기록을 찾는다","phase":"부산을 떠난 첫 구간","why":"이송표 한 장만으로는 명령을 누가 보냈는지 알 수 없다. 발신 번호가 남은 기록이 필요하다.","next":"양산 쪽 첫 구간으로 출발해 이송표의 발신 번호가 남은 기록을 찾는다.","progress":{"have":3,"need":13,"label":"3/13"}},"navigation":{"key":"main_first-trace","kind":"main","target":"seoul","title":"이송 명령의 첫 발신 기록을 찾는다","action":"양산 쪽 첫 구간으로 출발해 이송표의 발신 번호가 남은 기록을 찾는다."}}
MESSAGES []

## choice 8 / trace 17 / lc_busan_dried / 자갈치 아지매
BEFORE {"at":"busan","location":"부산 감천 부두","day":1,"min":645,"km":0,"driving":null,"fuel":30,"water":16,"food":14,"scrap":22,"van":82,"fatigue":8.774999999999999,"party":[],"items":{"부품":1,"의약품":1,"탄약":0},"ended":false,"main":{"title":"이송 명령의 첫 발신 기록을 찾는다","phase":"부산을 떠난 첫 구간","why":"이송표 한 장만으로는 명령을 누가 보냈는지 알 수 없다. 발신 번호가 남은 기록이 필요하다.","next":"양산 고가차도에서 ‘주변 탐색’을 눌러 「첫 번째 발신 기록」 기록을 확인한다 (열람 준비 30분 + 선택·후속 작업 10~35분)","progress":{"have":3,"need":13,"label":"3/13"}},"navigation":{"key":"main_first-trace","kind":"main","target":"yangsan","title":"이송 명령의 첫 발신 기록을 찾는다","action":"양산 고가차도에서 ‘주변 탐색’을 눌러 「첫 번째 발신 기록」 기록을 확인한다 (열람 준비 30분 + 선택·후속 작업 10~35분)"}}
ENTRY
리어카 가득 건어물을 실은 아지매가 손을 흔든다.

"오데 가노! 서울?! 아이고 야야, 그라모 이거 무라. 마른 것들은 배신 안 한데이."
PUBLIC CHOICES
{"index":0,"label":"건어물을 산다 (고철 4)","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"마 됐심더\" 정중히 사양","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"건어물을 산다 (고철 4)","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
쥐포, 오징어, 멸치 한 봉지씩. "마이 무라, 마이!"

"이거 얼마나 가요?"

"뭐가?"

"상하기까지요."

"마른 기 우예 상하노. …아니, 상하기는 하는데 니가 먼저 다 뭇는다."

차에서 쥐포 굽는 냄새가 나기 시작하면 그게 부산을 떠났다는 신호다.
CHIPS [{"t":"식량 +3","c":"plus"},{"t":"고철 -4","c":"minus"},{"t":"새 기록 · 자갈치 건어물","c":"item"}]
AFTER {"at":"busan","location":"부산 감천 부두","day":1,"min":645,"km":0,"driving":null,"fuel":30,"water":16,"food":17,"scrap":18,"van":82,"fatigue":8.774999999999999,"party":[],"items":{"부품":1,"의약품":1,"탄약":0},"ended":false,"main":{"title":"이송 명령의 첫 발신 기록을 찾는다","phase":"부산을 떠난 첫 구간","why":"이송표 한 장만으로는 명령을 누가 보냈는지 알 수 없다. 발신 번호가 남은 기록이 필요하다.","next":"양산 고가차도에서 ‘주변 탐색’을 눌러 「첫 번째 발신 기록」 기록을 확인한다 (열람 준비 30분 + 선택·후속 작업 10~35분)","progress":{"have":3,"need":13,"label":"3/13"}},"navigation":{"key":"main_first-trace","kind":"main","target":"yangsan","title":"이송 명령의 첫 발신 기록을 찾는다","action":"양산 고가차도에서 ‘주변 탐색’을 눌러 「첫 번째 발신 기록」 기록을 확인한다 (열람 준비 30분 + 선택·후속 작업 10~35분)"}}
MESSAGES []

## choice 9 / trace 21 / meet_postman / 자전거 우편부
BEFORE {"at":null,"day":1,"min":719,"km":16,"driving":{"from":"busan","to":"yangsan","gone":16.033333333333328,"dist":20},"fuel":27.530866666666682,"water":16,"food":17,"scrap":18,"van":82,"fatigue":15.064999999999976,"party":[],"items":{"부품":1,"의약품":1,"탄약":0},"ended":false,"main":{"title":"이송 명령의 첫 발신 기록을 찾는다","phase":"부산을 떠난 첫 구간","why":"이송표 한 장만으로는 명령을 누가 보냈는지 알 수 없다. 발신 번호가 남은 기록이 필요하다.","next":"양산 고가차도에서 ‘주변 탐색’을 눌러 「첫 번째 발신 기록」 기록을 확인한다 (열람 준비 30분 + 선택·후속 작업 10~35분)","progress":{"have":3,"need":13,"label":"3/13"}},"navigation":{"key":"main_first-trace","kind":"main","target":"yangsan","title":"이송 명령의 첫 발신 기록을 찾는다","action":"양산 고가차도에서 ‘주변 탐색’을 눌러 「첫 번째 발신 기록」 기록을 확인한다 (열람 준비 30분 + 선택·후속 작업 10~35분)"}}
ENTRY
짐받이에 방수포 꾸러미를 실은 자전거가 마주 온다. 남자의 조끼에 손바느질로 수놓은 글자.

「우편」

"수신인을 찾아다닌 지 몇 년째예요."

"몇 년이요?"

"…세다가 자꾸 헷갈려서 그만뒀어요. 주소가 다 무너져서, 이젠 이름이랑 얼굴로 배달합니다."
PUBLIC CHOICES
{"index":0,"label":"명단을 맞춰본다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"물 한 잔 대접한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"명단을 맞춰본다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
우편부가 손때 묻은 명단을 펼쳤다. 아는 이름은 없었다.

대신 우리가 스친 정착지 이야기를 해줬다. 우편부는 세 개를 받아적고 신이 나서 페달을 밟았다.

"오래 묵은 편지가 두 통이나 줄겠네!"
CHIPS [{"t":"새 기록 · 자전거 우편부","c":"item"}]
AFTER {"at":null,"day":1,"min":719,"km":16,"driving":{"from":"busan","to":"yangsan","gone":16.033333333333328,"dist":20},"fuel":27.530866666666682,"water":16,"food":17,"scrap":18,"van":82,"fatigue":15.064999999999976,"party":[],"items":{"부품":1,"의약품":1,"탄약":0},"ended":false,"main":{"title":"이송 명령의 첫 발신 기록을 찾는다","phase":"부산을 떠난 첫 구간","why":"이송표 한 장만으로는 명령을 누가 보냈는지 알 수 없다. 발신 번호가 남은 기록이 필요하다.","next":"양산 고가차도에서 ‘주변 탐색’을 눌러 「첫 번째 발신 기록」 기록을 확인한다 (열람 준비 30분 + 선택·후속 작업 10~35분)","progress":{"have":3,"need":13,"label":"3/13"}},"navigation":{"key":"main_first-trace","kind":"main","target":"yangsan","title":"이송 명령의 첫 발신 기록을 찾는다","action":"양산 고가차도에서 ‘주변 탐색’을 눌러 「첫 번째 발신 기록」 기록을 확인한다 (열람 준비 30분 + 선택·후속 작업 10~35분)"}}
MESSAGES []

## choice 10 / trace 24 / onboarding_first_road / 첫 번째 발신 기록
BEFORE {"at":"yangsan","location":"양산 고가차도","day":1,"min":738,"km":20,"driving":null,"fuel":26.920000000000016,"water":16,"food":16,"scrap":18,"van":82,"fatigue":16.63749999999997,"party":[],"items":{"부품":1,"의약품":1,"탄약":0},"ended":false,"main":{"title":"이송 명령의 첫 발신 기록을 찾는다","phase":"부산을 떠난 첫 구간","why":"이송표 한 장만으로는 명령을 누가 보냈는지 알 수 없다. 발신 번호가 남은 기록이 필요하다.","next":"양산 고가차도에서 ‘주변 탐색’을 눌러 「첫 번째 발신 기록」 기록을 확인한다 (열람 준비 30분 + 선택·후속 작업 10~35분)","progress":{"have":3,"need":13,"label":"3/13"}},"navigation":{"key":"main_first-trace","kind":"main","target":"yangsan","title":"이송 명령의 첫 발신 기록을 찾는다","action":"양산 고가차도에서 ‘주변 탐색’을 눌러 「첫 번째 발신 기록」 기록을 확인한다 (열람 준비 30분 + 선택·후속 작업 10~35분)"}}
ENTRY
부산을 벗어난 첫 고가도로 아래에서 죽어 있던 검문 스캐너가 켜졌다. 얇은 붉은 선이 달구지 앞유리를 훑고, 녹슨 단말이 종이띠를 토해 냈다.

「재평가 조건: 배급망 변동 시 자동 실행」

날짜가 정해진 한 번의 이송이 아니었다. 물과 전력 수치가 바뀔 때마다 새 가족을 골라내는 반복 명령이었다.

종이 아래쪽 검증 번호가 눈에 걸렸다. 부모님의 이송표 귀퉁이에 있던 번호와 앞 여덟 자리가 같았다.
PUBLIC CHOICES
{"index":0,"label":"차를 세우고 명령띠를 뽑는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"전원을 끊고 단말을 통째로 연다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"스캔을 끝까지 받아 기록을 복사한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"전원을 끊고 단말을 통째로 연다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
스캐너 전원선을 먼저 끊고 저장 모듈을 분리했다. 종이 가장자리는 삭았지만 검증 번호와 재평가 규칙은 온전히 남았다.

부모님의 표와 같은 곳에서 나온 명령이었다. 이송은 한 번의 사고가 아니라 지금도 계속되는 일이었다.
CHIPS [{"t":"35분 경과","c":""},{"t":"본편 단서 · 검문소 저장 모듈","c":"item"}]
AFTER {"at":"yangsan","location":"양산 고가차도","day":1,"min":773,"km":20,"driving":null,"fuel":26.920000000000016,"water":16,"food":16,"scrap":18,"van":82,"fatigue":18.21249999999997,"party":[],"items":{"부품":1,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 11 / trace 27 / exp_gas / 폐주유소
BEFORE {"at":"yangsan","location":"양산 고가차도","day":1,"min":893,"km":20,"driving":null,"fuel":26.920000000000016,"water":16,"food":16,"scrap":24,"van":82,"fatigue":23.61249999999997,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
간판이 반쯤 떨어진 주유소. "어서오세요"의 "어서"만 남았다.

펌프는 죽었지만, 지하 탱크에 뭐가 남았을진 모른다.
PUBLIC CHOICES
{"index":0,"label":"수동 펌프로 퍼올린다","hint":"위험 · 시간 소모","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"매점만 턴다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"수동 펌프로 퍼올린다","hint":"위험 · 시간 소모","visible":true,"enabled":true,"requirement":""}
RESULT
퍼올린 건 기름 반, 녹물 반. 그래도 거르면 쓸 만하다.
CHIPS [{"t":"연료 +3L","c":"plus"},{"t":"1시간 경과","c":""}]
AFTER {"at":"yangsan","location":"양산 고가차도","day":1,"min":953,"km":20,"driving":null,"fuel":29.920000000000016,"water":16,"food":16,"scrap":24,"van":82,"fatigue":26.312499999999968,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 12 / trace 31 / memory_busan_terminal / 부산 터미널의 마지막 불
BEFORE {"at":null,"day":1,"min":1023,"km":35.2,"driving":{"from":"yangsan","to":"miryang","gone":15.231666666666662,"dist":34},"fuel":27.574323333333364,"water":16,"food":16,"scrap":24,"van":82,"fatigue":32.28799999999995,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
길가의 폐환승소에서 도착 안내판 불이 한 칸씩 꺼졌다. 그 불빛을 보자 부산 터미널에서 부모님의 다음 차를 기다리던 밤이 떠올랐다.

여덟 살의 나는 할아버지와 막차가 들어올 때마다 일어섰다. 엄마는 다음 차로 꼭 온다고 했다. 밤이 깊어 안내판이 전부 꺼진 뒤에도 우리는 한 시간을 더 앉아 있었다. 할아버지는 부모님이 죽었다고도, 버렸다고도 말하지 않았다. 집에 가서 내일 다시 기다리자고만 했다.
PUBLIC CHOICES
{"index":0,"label":"내일도 여기 오자고 한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"엄마는 약속을 지킨다고 말한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"내일도 여기 오자고 한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
할아버지는 식은 보리차 두 잔을 들고 고개를 끄덕였다. 우리는 그다음 날도, 그다음 주에도 같은 자리에 앉았다.

안내판 불이 다시 켜지는 소리에 고개를 들었다. 눈앞에는 지금 지나고 있는 폐환승소가 있었다.
CHIPS [{"t":"새 기록 · 부산 터미널의 마지막 불","c":"item"}]
AFTER {"at":null,"day":1,"min":1023,"km":35.2,"driving":{"from":"yangsan","to":"miryang","gone":15.231666666666662,"dist":34},"fuel":27.574323333333364,"water":16,"food":16,"scrap":24,"van":82,"fatigue":32.28799999999995,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 13 / trace 39 / meet_scrapyard / 부품 천막의 정비사
BEFORE {"at":"miryang","location":"밀양 장터","day":2,"min":390,"km":54,"driving":null,"fuel":44.68400000000005,"water":19,"food":16,"scrap":24,"van":86,"fatigue":0,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
밀양 장터의 부품 천막. 경운기 엔진과 자전거 바퀴 사이에서 용접 불꽃이 짧게 튄다.

고글을 올린 소녀가 달구지가 들어오는 소리를 듣고 먼저 고개를 든다.

"거기 생활차, 공회전 한 번만 더 해봐요. 연료관 쪽에서 새는 소리 나요."

처음 보는 차인데도, 소녀는 인사보다 고장부터 짚었다.
PUBLIC CHOICES
{"index":0,"label":"\"…그걸 소리로 알아?\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"부품만 찾아본다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"…그걸 소리로 알아?\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"민지. 장날엔 여기 정비를 맡아요."

민지는 느슨한 클램프를 조였다. 엔진 소리가 조금 낮아졌다.

"이쪽은 됐고… 부탁 하나만 해도 돼요?"

천막 기둥에 꽂아 둔 지도를 꺼낸다. 울산 공단 쪽 폐차장에 붉은 원이 그려져 있다.
CHIPS [{"t":"새 기록 · 민지","c":"item"}]
AFTER {"at":"miryang","location":"밀양 장터","day":2,"min":390,"km":54,"driving":null,"fuel":44.68400000000005,"water":19,"food":16,"scrap":24,"van":86,"fatigue":0,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 14 / trace 41 / rq_minji_request / 울산까지 함께 갈까
BEFORE {"at":"miryang","location":"밀양 장터","day":2,"min":390,"km":54,"driving":null,"fuel":44.68400000000005,"water":19,"food":16,"scrap":24,"van":86,"fatigue":0,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
민지가 지도 위의 붉은 원을 짚는다.

"오빠가 남긴 진단기가 울산 폐차장으로 넘어갔어요. 목소리가 남아 있을지도 몰라요."

지도 끝이 말려 올라오자 공구함으로 눌러 둔다.

"혼자서는 못 꺼내요. 거기까지 태워주면, 꺼낼 때 제가 손 신호 할게요."
PUBLIC CHOICES
{"index":0,"label":"울산까지 태워주고, 함께 꺼낸다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"오늘은 함께 가기 어렵다고 말한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"울산까지 태워주고, 함께 꺼낸다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
민지는 지도를 접고 공구함을 들었다.

"그럼 울산까지. 공구함은 제가 들고 탈게요."

상자를 무릎에 올려놓고 손잡이를 쥔다. 아직 어디에 묶어 둘지는 묻지 않는다.
CHIPS [{"t":"새 기록 · 민지와 울산까지","c":"item"}]
AFTER {"at":"miryang","location":"밀양 장터","day":2,"min":390,"km":54,"driving":null,"fuel":44.68400000000005,"water":19,"food":16,"scrap":24,"van":86,"fatigue":0,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🚚 임시 승객 민지 — 울산 공업탑에서 부탁이 이어진다"]

## choice 15 / trace 45 / story_bridge_departure_echo / 부산 뒤에 남은 방송
BEFORE {"at":null,"day":2,"min":460,"km":69.2,"driving":{"from":"miryang","to":"yangsan","gone":15.231666666666662,"dist":34},"fuel":42.33832333333333,"water":19,"food":16,"scrap":24,"van":86,"fatigue":5.9755,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
부산 항만 방송이 잡음 속으로 멀어질 즈음, 꺼 둔 줄 알았던 수신기가 혼자 켜졌다. 내일 새벽 동부 노선 이송자 명단. 도윤 가족 아래로 처음 보는 이름이 열일곱 줄 더 내려갔다. 부산을 빠져나오면 끝날 거라고 믿은 사람은 없었다. 그래도 다음 종이가 벌써 나올 줄은 몰랐다.
PUBLIC CHOICES
{"index":0,"label":"발신 시각과 주파수를 적어 둔다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"방송이 끝날 때까지 이름을 받아 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"발신 시각과 주파수를 적어 둔다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
명단보다 먼저 눈에 들어온 건 시각이었다. 새벽 3시 12분. 발신 시각은 정확했지만 승인자의 이름은 끝내 나오지 않았다. 주파수 옆에 시각을 옮겨 적었다.
CHIPS [{"t":"15분 경과","c":""}]
AFTER {"at":null,"day":2,"min":475,"km":69.2,"driving":{"from":"miryang","to":"yangsan","gone":15.231666666666662,"dist":34},"fuel":42.33832333333333,"water":19,"food":16,"scrap":24,"van":86,"fatigue":6.6505,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 16 / trace 50 / story_bridge_trace_gap / 11분의 빈칸
BEFORE {"at":null,"day":2,"min":634,"km":103.2,"driving":{"from":"yangsan","to":"ulsan","gone":15.231666666666662,"dist":32},"fuel":37.1730583333333,"water":19,"food":16,"scrap":24,"van":86,"fatigue":19.607899999999997,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
폐쇄된 요금소 제어실에서 기록지가 아직도 조금씩 밀려 나오고 있었다. 자동 명령 발행 03:12. 버스 출발 03:16. 사람 확인 03:23. 확인자 칸은 비어 있었다. 버스가 떠난 뒤에야 사람이 승인한 셈이었다.
PUBLIC CHOICES
{"index":0,"label":"세 장의 시각을 나란히 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"비어 있는 확인란을 그대로 남긴다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"비어 있는 확인란을 그대로 남긴다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
빈칸 아래에는 완료 도장이 또렷했다. 누가 승인했는지를 찾으려면, 명령을 보낸 곳보다 도장을 나중에 붙인 곳부터 따라가야 했다.
CHIPS [{"t":"15분 경과","c":""}]
AFTER {"at":null,"day":2,"min":649,"km":103.2,"driving":{"from":"yangsan","to":"ulsan","gone":15.231666666666662,"dist":32},"fuel":37.1730583333333,"water":19,"food":16,"scrap":24,"van":86,"fatigue":20.242399999999996,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 17 / trace 54 / rq_minji_task / 무너지기 전의 목소리
BEFORE {"at":"ulsan","location":"울산 공업탑","day":2,"min":727,"km":120,"driving":null,"fuel":34.64103999999997,"water":19,"food":15,"scrap":24,"van":86,"fatigue":26.45062999999998,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
폐차장 안쪽에서 차체가 한 번 크게 운다. 민지가 말한 진단기는 접힌 승용차 아래에 끼어 있고, 그 위로 기름 먹은 차 더미가 기울어 있다.

"빨간 천 보이죠? 저기— 아니, 그 옆에. 오빠 공구함이에요. 마지막 정오 신호가 저 안에 있어요."

불꽃이 냉각수 호스를 핥는다. 빨리 당기면 상자가 찌그러지고, 천천히 하면 불이 번진다. 민지가 견인선을 걸고 매듭과 차체 각도를 차례로 짚는다.

"내가 손 신호 할게요. 손만 봐요. 나 말고, 손만."
PUBLIC CHOICES
{"index":1,"label":"도르래를 만들고 사람 힘으로 맞춘다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"차를 방패로 붙이고 짧게 당긴다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"도르래를 만들고 사람 힘으로 맞춘다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
범퍼와 휠 허브로 도르래를 만들었다. 민지가 "하나, 둘"을 세고 우리는 줄을 당겼다. 셋을 세기 전에 차 더미가 내려앉았다. 튄 철판이 달구지 옆문을 때렸다.

상자는 마지막 한 뼘을 굴러 우리 발 앞에 멈췄다. 안에서 남자의 녹음이 살아났다.

"민지야, 정오다. 살아 있으면 대답해."

민지는 상자에 이마를 댄 채 어깨를 한 번 떨었다. 조금 뒤 고개를 들더니 잠금쇠를 확인했다. 이미 확인한 잠금쇠를 다시 확인했다.

"…이거, 걸쇠가 휘었네요. 펴면 되고. 좌표는— 좌표는 이따 볼래요."
CHIPS [{"t":"고철 -4","c":"minus"},{"t":"차체 -3%","c":"minus"},{"t":"1.5시간 경과","c":""},{"t":"새 기록 · 무너지기 전의 목소리","c":"item"}]
AFTER {"at":"ulsan","location":"울산 공업탑","day":2,"min":817,"km":120,"driving":null,"fuel":34.64103999999997,"water":19,"food":15,"scrap":20,"van":83,"fatigue":30.257629999999978,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🚚 임시 동행 시작 — 민지, 다음 정차까지"]

## choice 18 / trace 57 / lc_ulsan_whale / 귀신고래
BEFORE {"at":"ulsan","location":"울산 공업탑","day":2,"min":937,"km":120,"driving":null,"fuel":34.64103999999997,"water":19,"food":15,"scrap":26,"van":83,"fatigue":35.33362999999998,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
장생포 앞바다. 낚시하던 노인이 갑자기 소리친다.

"저기!! 저기 봐라!!"

수면 위로— 거대한 등이 천천히 솟았다 가라앉는다. 물기둥이 하늘로 뿜어진다.

"귀신고래다… 몇십 년 만에 돌아온 기고… 사람이 조용해지니까 왔데이…"
PUBLIC CHOICES
{"index":0,"label":"멈춰서 지켜본다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"멈춰서 지켜본다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
고래는 세 번 숨을 쉬고 사라졌다.

"…세 번 맞아요?"

"두 번인가."

"세 번이었데이." 노인이 못 박듯 말했다.

그러고는 그 자리에 주저앉아 오래 바다를 봤다. "내 아버지가 보던 걸 내가 보네."

멸망이 돌려준 것들의 목록에 고래가 추가됐다.
CHIPS [{"t":"30분 경과","c":""},{"t":"새 기록 · 귀신고래 귀환","c":"item"}]
AFTER {"at":"ulsan","location":"울산 공업탑","day":2,"min":967,"km":120,"driving":null,"fuel":34.64103999999997,"water":19,"food":15,"scrap":26,"van":83,"fatigue":36.60262999999998,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 19 / trace 62 / salvage_claim / 먼저 온 사람들
BEFORE {"at":null,"day":2,"min":1037,"km":135.2,"driving":{"from":"ulsan","to":"gyeongju","gone":15.231666666666662,"dist":34},"fuel":32.34288613333334,"water":19,"food":15,"scrap":26,"van":83,"fatigue":42.21959999999989,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
무너진 창고 앞에 트럭 두 대가 서 있다. 안에서 쇠 긁는 소리가 난다.

우리가 다가가자 한 사람이 나와 길을 막았다. 손에는 장부와 연필.

"여긴 우리 구역이야. 들어가려면 회수료 내야 돼."

"언제부터 여기가 구역이었는데요?"

"우리가 온 날부터." 남자가 장부를 흔들었다. 종이에는 지역 이름과 날짜가 빼곡했다. 정말로 기록하고 있었다. 자기들끼리의 법을 만들고, 그 법을 자기들이 집행하는 사람들.

남자는 웃지 않았다. "규칙 없으면 다 뺏기니까. 규칙 만들면 우리가 뺏고."
PUBLIC CHOICES
{"index":0,"label":"회수료를 낸다 (고철 10)","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"다른 입구를 찾는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"그냥 지나간다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"회수료를 낸다 (고철 10)","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
고철을 세어 주자 남자가 장부를 펼쳤다.

"차 번호."

"…번호판 없어요."

"그럼 뭘로 적지." 펜을 물고 잠깐 생각하더니 그냥 「오늘 세 번째 차」라고 썼다. 옆에서 누가 "네 번째예요" 했지만 고치지 않았다.

「통행 허가 · 유효 3일」. 창고 안은 이미 절반이 비어 있었고, 남은 것도 쓸 만하진 않았다.

나오는데 남자가 굳이 일러줬다. "3일 지나면 또 받습니다."
CHIPS [{"t":"고철 -10","c":"minus"},{"t":"1시간 경과","c":""},{"t":"새 기록 · 구역이라는 말","c":"item"}]
AFTER {"at":null,"day":2,"min":1097,"km":135.2,"driving":{"from":"ulsan","to":"gyeongju","gone":15.231666666666662,"dist":34},"fuel":32.34288613333334,"water":19,"food":15,"scrap":16,"van":83,"fatigue":44.75759999999989,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 20 / trace 65 / loc_gyeongju / 왕릉 소풍
BEFORE {"at":"gyeongju","location":"경주 왕릉","day":2,"min":1186,"km":154,"driving":null,"fuel":29.51111999999997,"water":19,"food":15,"scrap":18,"van":83,"fatigue":52.33963999999978,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
천년 왕릉 사이로 해가 진다.

능선의 곡선은 세상이 어떻게 되든 완만하다. 왕릉 마을 사람들이 언덕 아래서 손을 흔든다.

"소풍 오셨어요? 여기가 명당이지. 천년을 버틴 언덕이라, 뭐가 와도 끄떡없거든."
PUBLIC CHOICES
{"index":0,"label":"왕릉 아래서 쉬어간다 (5시간)","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"인사만 하고 지나간다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"왕릉 아래서 쉬어간다 (5시간)","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
능 아래 돗자리를 폈다. 마을 사람들이 찐 옥수수를 나눠줬다. 옥수수를 들고 봉분을 올려다보던 아이 하나가 내 옆에 앉았다.

"저 안에 진짜 왕이 있어요?"

"있겠지."

"직접 열어 본 사람도 있어요?"

"…그건 나도 몰라."

아이는 옥수수를 다 먹고 친구들에게 뛰어갔다. 나는 왕릉 옆에서 한동안 눈을 붙였다.

"천 년을 버틴 곳이네. 나도 조금 더 버틸 수 있겠지." 잠에서 깨며 혼잣말했다.
CHIPS [{"t":"식량 +2","c":"plus"},{"t":"5시간 경과","c":""},{"t":"피로 -20","c":"plus"},{"t":"새 기록 · 왕릉 소풍","c":"item"}]
AFTER {"at":"gyeongju","location":"경주 왕릉","day":3,"min":46,"km":154,"driving":null,"fuel":29.51111999999997,"water":19,"food":17,"scrap":18,"van":83,"fatigue":45.02963999999979,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 21 / trace 68 / rq_minji_join / 민지가 고른 자리
BEFORE {"at":"gyeongju","location":"경주 왕릉","day":3,"min":46,"km":154,"driving":null,"fuel":29.51111999999997,"water":19,"food":17,"scrap":18,"van":83,"fatigue":45.02963999999979,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
한 구간 내내 민지는 공구함을 무릎에서 놓지 않았다. 손님 짐이라며 끈도 묶지 않았던 상자다.

정차하고도 한동안 말이 없다가, 민지가 생활칸 안쪽의 빈 볼트 구멍을 가리킨다.

"이 공구함, 저기에 고정해도 돼요? 구멍 규격은 제가 맞출게요."

"왜? 다음에 내릴 거면 끈으로 묶어도 되잖아."

민지는 볼트 구멍의 먼지를 손가락으로 닦는다. 닦을 먼지가 없어진 뒤에도 계속 닦는다. 그러고는 북쪽을 봤다.

"안 내리려고요. 오빠 신호가 닿는 데까지— 그다음엔 서울까지. 같이 가도 돼요?"

"손님으로는 안 돼. 네 자리부터 만들자고."

민지의 표정이 굳었다가 천천히 풀린다. 입술 끝이 조금 올라갔다가 도로 내려간다. 민지는 대답 대신 전동 드릴부터 들었다.

"…그 말, 나중에 바꾸면 안 돼요. 바꾸면 구멍만 남아요."
PUBLIC CHOICES
{"index":0,"label":"공구함을 고정할 자리를 함께 고른다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"공구함을 고정할 자리를 함께 고른다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
침상을 접어 통로 폭부터 재고, 공구함이 비상문을 막지 않는 자리를 골랐다. 민지가 그 앞에 상자를 내려놓는다. 드릴은 아직 켜지 않았다.

"여기면 달리는 중에도 바로 꺼낼 수 있어요. 비상문도 안 가리고."

"나중에 자리 바꾸려면?"

"그땐 구멍 막으면 되죠."

민지가 드릴 배터리를 눌러 본다. "반 남았어요. 고정할까요?"
CHIPS []
AFTER {"at":"gyeongju","location":"경주 왕릉","day":3,"min":46,"km":154,"driving":null,"fuel":29.51111999999997,"water":19,"food":17,"scrap":18,"van":83,"fatigue":45.02963999999979,"party":[],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 22 / trace 73 / camp_visitor / 모닥불의 손님
BEFORE {"at":"gyeongju","location":"경주 왕릉","day":3,"min":390,"km":154,"driving":null,"fuel":29.51111999999997,"water":17,"food":15,"scrap":18,"van":87,"fatigue":0,"party":["minji"],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
불가에 인기척. 배낭을 멘 노인이 조심스레 서 있다.

"…언제부터 거기 계셨어요?"

"글쎄. 불이 보여서 왔는데 부르기가 뭣해서." 노인이 배낭끈을 고쳐 멨다. "불 좀 쬐어도 될까요? 밤길이 생각보다 춥구먼."
PUBLIC CHOICES
{"index":0,"label":"자리를 내어준다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"경계하며 거절한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"자리를 내어준다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
노인은 오랫동안 걸어서 전국을 돌고 있다고 했다.

"차가 있으면 빠르지. 근데 걸으면 다 보여." 노인의 지도엔 우리가 모르는 표시가 가득했다.

"이 세모는 뭐예요?"

"그거는." 노인이 지도를 돌려 봤다가 다시 돌렸다. "적어놓고 까먹었네. 아마 물일 거요. 아마."

떠나기 전, 확실하다는 표시 하나를 우리 지도에 옮겨줬다.
CHIPS [{"t":"사기 +3","c":"plus"},{"t":"🗺 낚시꾼의 호수 발견","c":"item"},{"t":"새 기록 · 걷는 노인","c":"item"}]
AFTER {"at":"gyeongju","location":"경주 왕릉","day":3,"min":390,"km":154,"driving":null,"fuel":29.51111999999997,"water":17,"food":15,"scrap":18,"van":87,"fatigue":0,"party":["minji"],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 23 / trace 76 / talk_mj_03 / 민지 — 손
BEFORE {"at":"gyeongju","location":"경주 왕릉","day":3,"min":390,"km":154,"driving":null,"fuel":29.51111999999997,"water":17,"food":15,"scrap":18,"van":87,"fatigue":0,"party":["minji"],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
민지 손등에 새 상처가 났다. 본인은 눈치도 못 챈 모양이다.
PUBLIC CHOICES
{"index":0,"label":"말없이 반창고를 붙여준다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"아프지도 않냐\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"말없이 반창고를 붙여준다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
민지가 움찔하더니 손을 뺐다가— 도로 내밀었다.

"…말을 하고 붙여야지. 놀랐잖아."

"말하면 손 뺐을 거잖아."

"…그건 그래. 고마워. 정비사 손은 원래 이래."

"원래 그런 건 없어." 잔소리가 나도 모르게 튀어나왔다. 민지가 웃음을 터뜨렸다.
CHIPS [{"t":"민지 사기 +4","c":"plus"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"gyeongju","location":"경주 왕릉","day":3,"min":390,"km":154,"driving":null,"fuel":29.51111999999997,"water":17,"food":15,"scrap":18,"van":87,"fatigue":0,"party":["minji"],"items":{"부품":2,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 24 / trace 79 / exp_fishfarm / 버려진 양어장
BEFORE {"at":"gyeongju","location":"경주 왕릉","day":3,"min":510,"km":154,"driving":null,"fuel":29.51111999999997,"water":17,"food":15,"scrap":24,"van":87,"fatigue":5.076,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
육상 양어장. 전기가 끊겨 수조 대부분은 말랐지만— 빗물이 고인 노천 수조에서 물이 튄다.

물고기들이 몇 해째 사람 손 없이 살아남아 번식하고 있다.
PUBLIC CHOICES
{"index":0,"label":"그물을 던진다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"사료 창고를 턴다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"그물을 던진다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
메기다. 그것도 팔뚝만 한 놈들.

여러 해 방치된 양어장은 사실 자연 양식장이었다. 몇 마리만 잡고 나머지는 두었다. 다음 여행자의 몫.
CHIPS [{"t":"식량 +3","c":"plus"},{"t":"사기 +4","c":"plus"}]
AFTER {"at":"gyeongju","location":"경주 왕릉","day":3,"min":510,"km":154,"driving":null,"fuel":29.51111999999997,"water":17,"food":18,"scrap":24,"van":87,"fatigue":5.076,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 25 / trace 83 / story_bridge_watched / 먼저 알아본 쪽
BEFORE {"at":null,"day":3,"min":632,"km":180.5,"driving":{"from":"gyeongju","to":"daegu","gone":26.454999999999984,"dist":52},"fuel":25.51881999999998,"water":17,"food":18,"scrap":24,"van":87,"fatigue":14.812920000000023,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
전조등이 폐쇄 검문소를 훑자 감시 카메라 세 대가 동시에 돌아왔다. 렌즈가 운전석 쪽으로 기울었다. 꺼진 안내판에 짧은 문장이 떴다. 「검증 장치 운송체 확인」 계기판 안에 숨겨 두고 출발한 장치였다. 안내판을 다시 읽는 동안, 막혀 있던 앞길의 신호가 하나씩 초록으로 바뀌었다.
PUBLIC CHOICES
{"index":0,"label":"멈춰서 화면과 카메라를 기록한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"카메라를 지나 열린 길로 빠져나간다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"멈춰서 화면과 카메라를 기록한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
카메라는 피하지 않았다. 오히려 렌즈를 낮춰 운전석까지 담았다. 우리가 천리안을 쫓기 시작했다고 생각했는데, 먼저 우리를 알아본 건 저쪽이었다.
CHIPS [{"t":"20분 경과","c":""},{"t":"관측 +1","c":"minus"}]
AFTER {"at":null,"day":3,"min":652,"km":180.5,"driving":{"from":"gyeongju","to":"daegu","gone":26.454999999999984,"dist":52},"fuel":25.51881999999998,"water":17,"food":18,"scrap":24,"van":87,"fatigue":15.604920000000023,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 26 / trace 89 / kw_recruit / 돔의 파수꾼
BEFORE {"at":"daegu","location":"대구 돔 시장","day":3,"min":821,"km":206,"driving":null,"fuel":41.73815999999998,"water":17,"food":17,"scrap":14,"van":87,"fatigue":26.441240000000004,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
돔 시장 경비탑 위에 남자가 서 있다. 미동도 없이. 시장 전체가 그의 시야 안이다.

좌판에서 소매치기 소동이 일었다— 는데, 소동이 되기 전에 끝났다. 탑 위의 남자가 반 걸음 움직이며 그쪽을 봤을 뿐인데, 소매치기가 지갑을 제자리에 놓고 두 손을 들었다.

남자가 탑에서 내려왔다. 군장 하나, 목에 군번줄 두 개.

"강우다."

"…예."

"……." 그는 우리 차 뒤쪽을 한 번 봤다가 다시 돌아왔다. "북쪽으로 가는 차가 있다고 들었다. 서울까지 가나."
PUBLIC CHOICES
{"index":0,"label":"\"갑니다. 타실래요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"왜 하필 우리 차예요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"갑니다. 타실래요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
대답이 바로 안 왔다. 강우는 시장 아래를 세는 사람처럼 훑었다.

"…지금 떠나면 이 돔은 사흘 못 간다."

경비는 그 혼자였고, 북쪽 감시 표식이 지붕 아래에서 깜빡이고 있었다. 시장을 노리는 사람에겐 등대나 다름없다.

"사흘요?"

"이틀일 수도 있고." 그가 군번줄 하나를 쥔다. "후임 하나 세우고 저 눈을 끈다. 그때도 자리가 있으면 묻지. 나는 도망치듯 떠나지 않는다."
CHIPS [{"t":"새 기록 · 강우","c":"item"}]
AFTER {"at":"daegu","location":"대구 돔 시장","day":3,"min":821,"km":206,"driving":null,"fuel":41.73815999999998,"water":17,"food":17,"scrap":14,"van":87,"fatigue":26.441240000000004,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🤝 강우의 부탁을 대구 돔 시장에서 바로 진행할 수 있다"]

## choice 27 / trace 92 / rq_kangwoo_task / 강우가 초소를 넘기는 날
BEFORE {"at":"daegu","location":"대구 돔 시장","day":3,"min":821,"km":206,"driving":null,"fuel":41.73815999999998,"water":17,"food":17,"scrap":14,"van":87,"fatigue":26.441240000000004,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
돔 천장 아래, 오래된 감시 표식이 붉게 깜빡인다. 시장 불빛과 출입 시간을 북쪽으로 보내는 장치다.

강우 옆에는 새 경비 서연이 서 있다. 아직 총보다 손전등을 세게 쥔다.

"내가 장치를 끄는 동안 서연이 시장을 맡는다."

강우는 사다리 발을 장화 끝으로 눌러 고정한 뒤 우리에게 넘긴다.

"……. 그사이 무슨 일이 생겨도 내가 위에서 지시하지 않는다. 서연이 끝내는 데까지 봐야 해."
PUBLIC CHOICES
{"index":1,"label":"장치를 뜯고 출입로를 새로 짠다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"한동안 후임의 지시만 따른다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"장치를 뜯고 출입로를 새로 짠다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
감시 표식의 전선을 끊자 돔 안 조명이 절반 꺼졌다. 대신 우리는 손전등과 종으로 새 경계선을 만들었다.

첫 순찰에서 서연은 강우가 가르쳐준 길을 벗어났다. 더 짧고, 사각도 적었다. 강우는 입을 열었다가 다물고, 지도를 고쳐 그렸다.

몇 시간 뒤, 서연이 경비탑에서 먼저 말했다. "이제 가세요. 여긴 제가 봅니다."

강우가 군번줄 하나를 탑 난간에 걸어두었다.
CHIPS [{"t":"고철 +5","c":"plus"},{"t":"4시간 경과","c":""},{"t":"피로 +8","c":"minus"},{"t":"새 기록 · 경비탑의 다음 사람","c":"item"}]
AFTER {"at":"daegu","location":"대구 돔 시장","day":3,"min":1061,"km":206,"driving":null,"fuel":41.73815999999998,"water":17,"food":17,"scrap":19,"van":87,"fatigue":43.945240000000005,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🚚 임시 동행 시작 — 강우, 다음 정차까지"]

## choice 28 / trace 95 / lc_daegu_makchang / 막창 골목의 불
BEFORE {"at":"daegu","location":"대구 돔 시장","day":3,"min":1181,"km":206,"driving":null,"fuel":41.73815999999998,"water":17,"food":17,"scrap":28,"van":87,"fatigue":48.69724000000001,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
대구 외곽, 어둠 속에서 숯불 냄새가 차를 습격한다.

포장마차 하나가 영업 중이다. "막창 굽습니더. 고철 받고예."

연기가 신호탄처럼 오른다. 이건 도저히 그냥 못 지나간다.
PUBLIC CHOICES
{"index":0,"label":"막창을 굽는다 (고철 5)","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"냄새만 포장한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"막창을 굽는다 (고철 5)","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
지글지글. 다들 불판에서 눈을 못 뗐다.

"이거 언제 뒤집어요?"

"아직."

"지금 아니에요?"

"아직이라니까."

"…지금."

"마이 무으이소. 요즘 손님이 귀해가." 사장님이 된장 소스를 아낌없이 퍼줬다.

불판이 다 비고도 아무도 일어나지 않았다.
CHIPS [{"t":"식량 +1","c":"plus"},{"t":"고철 -5","c":"minus"},{"t":"피로 -8","c":"plus"},{"t":"사기 +9","c":"plus"},{"t":"새 기록 · 막창의 밤","c":"item"}]
AFTER {"at":"daegu","location":"대구 돔 시장","day":3,"min":1181,"km":206,"driving":null,"fuel":41.73815999999998,"water":17,"food":18,"scrap":23,"van":87,"fatigue":40.69724000000001,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 29 / trace 100 / talk_mj_07 / 민지 — 운전 교습
BEFORE {"at":"daegu","location":"대구 돔 시장","day":4,"min":390,"km":206,"driving":null,"fuel":41.73815999999998,"water":18,"food":17,"scrap":23,"van":99,"fatigue":0,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"대장님, 운전 자세 나빠." 민지가 선언했다. "어깨에 힘 들어가 있어. 그러면 오래 못— 아니, 어깨만이 아니네. 허리도 그래."

즉석 교습이 시작될 분위기다.
PUBLIC CHOICES
{"index":0,"label":"배운다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"내 자세가 어때서\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"배운다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"팔꿈치 좀 굽혀. 핸들 잡으면 어깨가 이렇게 올라가잖아."

"이렇게?"

"응. 손목도 조금 풀고. 아, 힘 빼라는 게 손 놓으라는 건 아니고."

차를 세운 채 핸들을 잡아 봤다. 민지는 내 팔과 등받이 사이를 보고 의자를 한 칸 당겼다.

"이제 브레이크 끝까지 밟아 봐. 무릎 펴지지 않게."

발을 떼고 다시 밟았다. 이번엔 몸이 앞으로 딸려 나가지 않았다. 민지는 고개를 끄덕이다 내 손을 가리켰다.

"어깨는 됐는데, 손은 또 꽉 쥐네. 손가락 자국 나겠다."
CHIPS [{"t":"사기 +1","c":"plus"},{"t":"민지 사기 +3","c":"plus"},{"t":"새 기록 · 운전석 한 칸","c":"item"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"daegu","location":"대구 돔 시장","day":4,"min":390,"km":206,"driving":null,"fuel":41.73815999999998,"water":18,"food":17,"scrap":23,"van":99,"fatigue":0,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 30 / trace 104 / levy_office / 임시 행정소
BEFORE {"at":null,"day":4,"min":512,"km":232.5,"driving":{"from":"daegu","to":"gumi","gone":26.454999999999984,"dist":38},"fuel":37.84927499999989,"water":18,"food":17,"scrap":23,"van":99,"fatigue":9.13308,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
길목에 천막이 서 있다. 「임시 차량 행정소」. 손글씨인데 관공서 서체를 흉내 냈다.

형광 조끼를 입은 남자 셋. 가슴에 코팅된 명찰. 책상 위에 도장과 장부까지 갖췄다.

"미등록 차량이네. 재등록비 고철 열다섯. 등록 안 하면 위쪽에… 그, 뭐냐, 미등록 이동체로 보고가 올라가요."

남자가 태블릿을 툭툭 쳤다. 화면은 꺼져 있다. 저들은 천리안이 무서운 게 아니다. 천리안을 두려워하는 사람들을 노린다.
PUBLIC CHOICES
{"index":0,"label":"꺼진 태블릿을 지적한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"재등록비를 낸다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"천막을 걷어버린다","hint":"위험 · 몸싸움","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"꺼진 태블릿을 지적한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"그럼 지금 보고해 보세요. 그 태블릿, 전원도 안 들어오잖아요."

남자의 손이 멈췄다. 뒤의 둘이 서로를 봤다.

"…그냥 가요. 오늘은 보내 줄 테니까."

봐주는 게 아니라 들킨 것이다. 백미러 속에서 그들은 벌써 다음 차를 기다리며 천막을 고쳐 세우고 있었다.
CHIPS [{"t":"사기 +2","c":"plus"},{"t":"새 기록 · 가짜 행정소","c":"item"}]
AFTER {"at":null,"day":4,"min":512,"km":232.5,"driving":{"from":"daegu","to":"gumi","gone":26.454999999999984,"dist":38},"fuel":37.84927499999989,"water":18,"food":17,"scrap":23,"van":99,"fatigue":9.13308,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 31 / trace 108 / rq_kangwoo_join / 등을 돌린 다음
BEFORE {"at":"gumi","location":"구미 공단 폐허","day":4,"min":568,"km":244,"driving":null,"fuel":36.15215999999985,"water":18,"food":17,"scrap":23,"van":99,"fatigue":13.284480000000018,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
강우는 무전기에 짧게 남긴다. "수신 양호. 네 판단대로 계속해."

서연의 대답은 바로 온다. "그 말 하려고 끼어든 거면, 다음부터는 호출할 때까지 듣기만 하세요."

강우가 헛웃음을 흘린다. 무전기를 끄진 않는다. 다만 군장 깊숙이 넣는다. 넣었다가 한 번 꺼내 확인하고, 도로 넣는다.

"……. 이제 시장으로 돌아갈 핑계도 없군."

"그럼 서울까지 같이 갑니까?"

강우가 달구지의 문과 비상 탈출구를 살핀다. 문을 두 번 여닫는다.

"간다. 대신 문 잠금부터 고쳐야겠어. 뒤쪽 사각도 넓고."

"타자마자 근무부터 하려고요?"

대답은 한 박자 늦게 왔다.

"야간 첫 순찰이 비었잖아."
PUBLIC CHOICES
{"index":0,"label":"강우의 군장이 들어갈 자리를 비운다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"강우의 군장이 들어갈 자리를 비운다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
강우가 문 밖에서 통로와 비상 탈출구를 살폈다. 군장을 걸어도 문이 열리는지 재 보고, 걸쇠를 한 번 더 확인한다.

"함께 가게 되면 첫 순찰은 내가 선다. 다음부터는 순번 정하고."

군장 속 무전기에서 서연의 호각 소리가 한 번 새어 나왔다. 강우는 송신 버튼을 짧게 눌러 답했다. 군장은 발치에 세워 둔 채 내 대답을 기다렸다.
CHIPS []
AFTER {"at":"gumi","location":"구미 공단 폐허","day":4,"min":568,"km":244,"driving":null,"fuel":36.15215999999985,"water":18,"food":17,"scrap":23,"van":99,"fatigue":13.284480000000018,"party":["minji"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 32 / trace 113 / talkr_kw_3 / 강우 — 동석
BEFORE {"at":"gumi","location":"구미 공단 폐허","day":4,"min":568,"km":244,"driving":null,"fuel":36.15215999999985,"water":18,"food":17,"scrap":23,"van":99,"fatigue":13.284480000000018,"party":["minji","kangwoo"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
강우 옆자리가 비어 있다. 강우는 아무 말도 안 하지만, 그 자리는 비워둔 자리라는 걸 이제 안다.
PUBLIC CHOICES
{"index":0,"label":"앉는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"앉는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
나란히 앉아 창밖을 봤다. 대화 없음. 특이사항 없음.

내릴 때 강우가 말했다. "…내일도 비워두지." 예약이 갱신됐다.
CHIPS [{"t":"강우 사기 +3","c":"plus"},{"t":"✦ 강우 유대 +2","c":"item"}]
AFTER {"at":"gumi","location":"구미 공단 폐허","day":4,"min":568,"km":244,"driving":null,"fuel":36.15215999999985,"water":18,"food":17,"scrap":23,"van":99,"fatigue":13.284480000000018,"party":["minji","kangwoo"],"items":{"부품":3,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 33 / trace 116 / ev_broadcast_station / 방송국
BEFORE {"at":"gumi","location":"구미 공단 폐허","day":4,"min":688,"km":244,"driving":null,"fuel":36.15215999999985,"water":18,"food":17,"scrap":32,"van":99,"fatigue":18.03648000000002,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
무너진 지역 방송국. 스튜디오 안엔 마이크와 카메라가 그대로.

주조정실 벽 모니터엔 마지막 화면이 얼어붙어 있다. 「긴급 속보 —」 그 뒤 문장은 없다.

방송 테이프들이 선반에 쌓여 있다.
PUBLIC CHOICES
{"index":0,"label":"마지막 방송 테이프를 튼다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"송출 장비를 챙긴다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"마지막 방송 테이프를 튼다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
테이프가 오래돼 화면이 지직댄다. 겨우 알아들은 건 「정리」라는 단어 하나. 그 말이 무슨 뜻인지, 우린 이미 안다.
CHIPS [{"t":"35분 경과","c":""},{"t":"사기 -2","c":"minus"}]
AFTER {"at":"gumi","location":"구미 공단 폐허","day":4,"min":723,"km":244,"driving":null,"fuel":36.15215999999985,"water":18,"food":15,"scrap":32,"van":99,"fatigue":19.422480000000018,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🍚 점심 식사 · 식량 -2"]

## choice 34 / trace 120 / story_generation_form / 세 겹의 이송표
BEFORE {"at":null,"day":4,"min":793,"km":259.2,"driving":{"from":"gumi","to":"gimcheon","gone":15.231666666666662,"dist":26},"fuel":33.9131049999998,"water":18,"food":15,"scrap":32,"van":99,"fatigue":24.680920000000008,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
폐쇄된 면사무소 처마 밑에 사람들이 비를 피한다. 벽에는 출생표와 사망표 사이로 이송표 세 장이 붙어 있다.

같은 성씨. 증조모, 할머니, 딸. 출발지는 종로·마포·구로, 내려온 해도 모두 다르다. 「사유」 칸만 똑같이 비어 있다.

누군가 그 옆에 「물 부족」, 「전염」, 「불복종」을 연필로 적었다. 다른 손들이 날짜와 지도를 대조해 하나씩 줄을 그었다. 맨 아래에는 짧은 메모가 남았다.

「아직 모름. 빈칸 지우지 말 것.」
PUBLIC CHOICES
{"index":0,"label":"빈칸까지 그대로 베껴 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"세 사람의 이름부터 읽는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"세 사람의 이름부터 읽는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
맨 위부터 이름을 읽었다. 두 번째 이름에서 노인이 손을 들었다.

"거기. 다시."

다시 읽자 노인은 고개를 젓는다. "아니야, 그거 말고 그 밑에. …아니 됐어. 계속해."

셋째 이름에서 노인이 "우리 엄마"라고 했다. "첫째는 사진도 없어. 둘째는 목소리만 기억나고. 우리 엄마는 지난 장날까지 국수를 팔았지."

노인은 세 번째 표를 떼지 않고 손바닥으로 반듯하게 폈다. 비에 번진 이름만 다시 진하게 써 달라고 했다.
CHIPS [{"t":"사기 +2","c":"plus"},{"t":"새 기록 · 빈칸을 물려받은 집","c":"item"},{"t":"◈ 세대마다 반복된 추방 · 단서","c":"item"}]
AFTER {"at":null,"day":4,"min":793,"km":259.2,"driving":{"from":"gumi","to":"gimcheon","gone":15.231666666666662,"dist":26},"fuel":33.9131049999998,"water":18,"food":15,"scrap":32,"van":99,"fatigue":24.680920000000008,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 35 / trace 123 / route_mid_fork / 두 길이 갈라지는 곳
BEFORE {"at":"gimcheon","location":"김천 갈림길","day":4,"min":845,"km":270,"driving":null,"fuel":32.330159999999765,"water":18,"food":15,"scrap":32,"van":99,"fatigue":28.55556,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
김천 북쪽 교차로에서 차를 세웠다. 넘어진 표지판 두 장을 씻어 세우니 갈 길이 선명해졌다.

동쪽은 상주와 문경을 지나 청주로 곧장 오르는 능선길. 짧지만 비에 깎인 구간이 많다. 서쪽은 무주와 전주 장터를 거쳐 올라가는 길. 훨씬 멀지만 물과 사람을 만날 곳이 이어진다.

지도 위에서 두 선은 청주에서 다시 만났다. 나는 동쪽 선 옆에 ‘빠름, 험로’, 서쪽 선 옆에 ‘보급, 안전’을 적었다.

달구지 짐칸을 열어 보니 어느 쪽을 고르느냐에 따라 챙길 짐도 달라진다. 능선으로 가면 삽과 견인줄, 장터로 가면 빈 물통과 묶음끈이 먼저다.

청주에 닿을 때까지는 고른 노선 밖으로 나갈 수 없다. 다른 곳에 맡은 일이 있다면 청주에서 길이 합쳐진 뒤 돌아가야 한다. 준비를 마친 뒤 한쪽을 고르기로 했다.
PUBLIC CHOICES
{"index":0,"label":"동쪽 능선길로 간다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"서쪽 장터길로 간다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"동쪽 능선길로 간다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
표지판에 분필로 동그라미를 쳤다. 상주, 문경, 충주, 청주.

"산길로 간다. 빨리 가되, 길에서 만난 일은 두고 가지 말자."

삽과 견인줄을 짐 맨 위로 옮겼다. 당장 꺼낼 일이 없으면 좋겠지만, 산길에서 그런 바람은 대개 오래가지 않는다.
CHIPS [{"t":"노선 선택 · 동쪽 능선길","c":"item"}]
AFTER {"at":"gimcheon","location":"김천 갈림길","day":4,"min":845,"km":270,"driving":null,"fuel":32.330159999999765,"water":18,"food":15,"scrap":32,"van":99,"fatigue":28.55556,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["⛰ 동쪽 능선길 — 청주까지 노선 고정"]

## choice 36 / trace 126 / parents_diversion_manifest / 오지 않은 다음 차
BEFORE {"at":"gimcheon","location":"김천 갈림길","day":4,"min":875,"km":270,"driving":null,"fuel":32.330159999999765,"water":18,"food":15,"scrap":32,"van":99,"fatigue":29.74356,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"오지 않은 부모님의 다음 차를 찾는다","phase":"남쪽 환승소의 오래된 운행표","why":"부모님이 함께 부산에 오지 못한 이유를 확인해야, 가족을 갈라놓은 명령이 사람을 어떻게 다뤘는지 알 수 있다.","next":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":4,"need":13,"label":"4/13"}},"navigation":{"key":"main_parents-diversion","kind":"main","target":"gimcheon","title":"오지 않은 부모님의 다음 차를 찾는다","action":"김천 갈림길에서 ‘주변 탐색’을 눌러 「오지 않은 다음 차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
남쪽 환승소에서 찾은 운행표와 분류 기록을 나란히 펼쳤다. 부모님의 다음 차는 실제로 있었지만 부산으로 출발하지 않았다. 두 사람은 탑승 직전 따로 분류됐다. 아빠는 남산 기술 유지선으로, 엄마는 중부 이송 기록 정리소로 보내졌다. 그날 터미널에서 아무리 기다려도 같은 버스가 올 수 없었던 이유가 기록에 남아 있었다.
PUBLIC CHOICES
{"index":0,"label":"왜 두 사람을 갈라놓았는지 확인한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"왜 탑승을 거부하지 못했는지 확인한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"왜 두 사람을 갈라놓았는지 확인한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
아빠의 설비 경력과 엄마의 기록 검증 경력이 각각 필요한 곳으로 배정돼 있었다. 가족은 한 단위가 아니라 쓸 수 있는 기술 두 개로 처리됐다.
CHIPS [{"t":"새 기록 · 오지 않은 다음 차","c":"item"}]
AFTER {"at":"gimcheon","location":"김천 갈림길","day":4,"min":875,"km":270,"driving":null,"fuel":32.330159999999765,"water":18,"food":15,"scrap":32,"van":99,"fatigue":29.74356,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 37 / trace 130 / story_family_principle / 예측은 명령이 아니다
BEFORE {"at":null,"day":4,"min":952,"km":286.8,"driving":{"from":"gimcheon","to":"sangju","gone":16.834999999999994,"dist":26},"fuel":29.653394999999747,"water":18,"food":15,"scrap":32,"van":99,"fatigue":35.55552000000003,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
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
PUBLIC CHOICES
{"index":0,"label":"끊긴 다음 문장을 찾아 복원한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"천리안의 분류 화면까지 함께 저장한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"끊긴 다음 문장을 찾아 복원한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
잡음을 걷어 내자 엄마의 말끝이 돌아왔다.

"사유 공개, 책임자 서명, 당사자 이의 제기. 이 셋 중 하나라도 없으면 차는 출발 못 합니다."

영상은 그 자리에서 멎었다. 나는 출발 때 챙긴 부모님의 이송표를 펼쳤다. 엄마가 손가락으로 짚던 칸이 내 종이에도 있었다. 비어 있었다.
CHIPS [{"t":"사기 +2","c":"plus"},{"t":"새 기록 · 예측은 명령이 아니다","c":"item"},{"t":"◈ 예측과 명령 사이 · 확인","c":"item"},{"t":"기억됨 · 부모님이 남긴 문장의 끝을 복원했다.","c":"item"}]
AFTER {"at":null,"day":4,"min":952,"km":286.8,"driving":{"from":"gimcheon","to":"sangju","gone":16.834999999999994,"dist":26},"fuel":29.653394999999747,"water":18,"food":15,"scrap":32,"van":99,"fatigue":35.55552000000003,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 38 / trace 133 / route_ridge_rescue / 능선 아래의 네 사람
BEFORE {"at":"sangju","location":"상주 자전거길","day":4,"min":997,"km":296,"driving":null,"fuel":28.196159999999736,"water":18,"food":15,"scrap":32,"van":99,"fatigue":38.876640000000066,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
상주를 벗어난 능선에서 손을 흔드는 아이가 보였다. 도로 아래로 작은 수레가 반쯤 굴러 떨어져 있다. 어른 셋과 아이 하나가 돌망 사이에 매달린 채 움직이지 못한다.

"다친 사람 있어요?"

아래에서 여자가 고개를 들었다. 바람에 말이 반쯤 날아갔다. "…목 하나요."

"뭐라고요?"

"발목이요! 한 명! 그런데 이 비탈, 아까부터 계속 내려앉아요."

차를 산 쪽 바위에 바짝 붙였다. 달구지의 무게를 닻으로 쓸 수는 있다. 문제는 비탈이 얼마나 더 버티느냐다.

총을 꺼낼 상대는 없다. 대신 비탈이 조금씩 우리 시간을 가져가고 있다.
PUBLIC CHOICES
{"index":0,"label":"달구지를 바위 뒤에 걸고 견인줄을 내린다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"도로 위 사람들과 먼저 역할을 나눈다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"달구지를 바위 뒤에 걸고 견인줄을 내린다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
차를 바위 안쪽에 비스듬히 세우고 바퀴마다 돌을 괴었다. 견인줄을 당기자 차체가 한 번 울었지만 버텼다.

"한 번에 한 사람. 줄 놓치면 안 돼."

아이부터 줄에 매달렸다.
CHIPS [{"t":"전세 우세 +2","c":"plus"},{"t":"15분 경과","c":""}]
AFTER {"at":"sangju","location":"상주 자전거길","day":4,"min":1012,"km":296,"driving":null,"fuel":28.196159999999736,"water":18,"food":15,"scrap":32,"van":99,"fatigue":39.47064000000007,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 39 / trace 135 / route_ridge_anchor / 줄 하나에 걸린 무게
BEFORE {"at":"sangju","location":"상주 자전거길","day":4,"min":1012,"km":296,"driving":null,"fuel":28.196159999999736,"water":18,"food":15,"scrap":32,"van":99,"fatigue":39.47064000000007,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
아이와 첫 번째 어른이 도로로 올라왔다. 세 번째 사람을 당기려는 순간, 발밑 돌망이 손바닥만큼 내려앉았다.

아래의 남자가 소리쳤다. "잠깐! 지금 당기면 여기 다 같이 내려가요."

"놓으라고요?"

"풀라고요! 놓지는 말고!"

줄을 조금 풀어 하중을 뺐다. 차는 버티는데 땅이 못 버틴다. 힘보다 사람이 디딜 길부터 만들어야 한다.

수레 안에는 문경으로 가는 편지와 해열제가 섞여 있다. 하지만 먼저 올라와야 할 것은 사람이다.
PUBLIC CHOICES
{"index":0,"label":"삽으로 하중을 나눌 계단을 판다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"견인줄을 두 갈래로 묶어 흔들림을 잡는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"아래 남자를 업고 짧게 치고 오른다","hint":"위험 · 비탈 압박 상승","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"삽으로 하중을 나눌 계단을 판다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
한 사람이 설 너비만큼 흙을 걷고 돌을 눌러 박았다. 빠른 길은 아니지만, 발을 옮길 때마다 다음 사람이 설 곳이 생겼다. 남자가 그 발판을 따라 도로까지 올라왔다.
CHIPS [{"t":"전세 우세 +1","c":"plus"},{"t":"숨 돌릴 틈 확보","c":"plus"},{"t":"◎ 읽어낸 틈 · 사람 줄과 짐 줄을 나눌 발판","c":"plus"},{"t":"25분 경과","c":""},{"t":"피로 +3","c":"minus"}]
AFTER {"at":"sangju","location":"상주 자전거길","day":4,"min":1037,"km":296,"driving":null,"fuel":28.196159999999736,"water":18,"food":15,"scrap":32,"van":99,"fatigue":43.46064000000007,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 40 / trace 137 / route_ridge_extract / 마지막 한 번
BEFORE {"at":"sangju","location":"상주 자전거길","day":4,"min":1037,"km":296,"driving":null,"fuel":28.196159999999736,"water":18,"food":15,"scrap":32,"van":99,"fatigue":43.46064000000007,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
사람 셋은 올라왔다. 아래에는 발목을 다친 여자와 수레가 남았다. 그때 비탈 위쪽에서 자갈이 한꺼번에 굴러내렸다.

여자가 약 상자를 수레 밖으로 밀며 말했다. "이건 두고 저만 올리세요."

"사람 먼저인 건 맞아요." 내가 줄을 다시 잡았다. "그래도 둘 다 올릴 방법부터—"

"둘 다는 안 돼요."

"한 번은 당겨봅시다."

한 번 당길 시간은 남아 있다.
PUBLIC CHOICES
{"index":0,"label":"사람 줄과 수레 줄을 따로 당긴다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"수레를 비우고 사람과 약만 릴레이로 올린다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"사람 줄과 수레 줄을 따로 당긴다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
두 줄을 당기는 박자가 어긋났다. 수레가 먼저 미끄러지며 여자의 줄을 쳤다.

여자는 올라왔다 — 발목이 아니라 무릎까지 다친 채로. 수레와 해열제는 계곡 아래에서 소리를 멈췄다.

"저 약, 문경 아이들 몫이었는데." 여자는 우리 잘못이 아니라고 두 번 말했다. 두 번째에는 여자가 아래를 보지 못했다. 올라온 사람들은 손에서 줄을 놓지 않은 채 한동안 서 있었다.
CHIPS [{"t":"35분 경과","c":""},{"t":"피로 +6","c":"minus"},{"t":"사기 -5","c":"minus"},{"t":"전술 연계 · 사기 +1","c":"plus"},{"t":"구조 종료 · 행동 기록 저장","c":"plus"},{"t":"새 기록 · 계곡에 남은 약 상자","c":"item"}]
AFTER {"at":"sangju","location":"상주 자전거길","day":4,"min":1072,"km":296,"driving":null,"fuel":28.196159999999736,"water":18,"food":15,"scrap":32,"van":99,"fatigue":50.84664000000007,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 41 / trace 140 / exp_radiostation / 지역 방송국
BEFORE {"at":"sangju","location":"상주 자전거길","day":4,"min":1192,"km":296,"driving":null,"fuel":28.196159999999736,"water":18,"food":15,"scrap":41,"van":99,"fatigue":55.598640000000074,"party":["minji","kangwoo"],"items":{"부품":4,"의약품":1,"탄약":0},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
낮은 언덕 위 지역 방송국. 송신탑은 꺾였지만 건물은 멀쩡하다.

스튜디오 문에 「ON AIR」 등이 있다. 꺼져 있다. 오랫동안 꺼져 있었을 것이다.
PUBLIC CHOICES
{"index":0,"label":"스튜디오를 뒤진다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"겉만 보고 간다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"스튜디오를 뒤진다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
조정실에서 진공관 예비품 상자를 찾았다. 방송 장비의 심장들이다.

나오는 길에 누가 「ON AIR」 등을 손으로 톡 쳤다. 불은 안 들어왔지만, 왠지 인사는 한 셈이다.
CHIPS [{"t":"고철 +4","c":"plus"},{"t":"라디오 진공관 +1","c":"plus"},{"t":"새 기록 · 지역 방송국","c":"item"},{"t":"🔧 폐차장의 눈: 부품 +1","c":"item"}]
AFTER {"at":"sangju","location":"상주 자전거길","day":4,"min":1192,"km":296,"driving":null,"fuel":28.196159999999736,"water":18,"food":15,"scrap":45,"van":99,"fatigue":55.598640000000074,"party":["minji","kangwoo"],"items":{"부품":5,"의약품":1,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 42 / trace 144 / talk_mj_05 / 민지 — 소리
BEFORE {"at":"sangju","location":"상주 자전거길","day":5,"min":390,"km":296,"driving":null,"fuel":28.196159999999736,"water":15,"food":12,"scrap":45,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":5,"의약품":1,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"눈 감아봐." 민지가 갑자기 말했다. "엔진 소리만 들어. 뭐가 들려?"
PUBLIC CHOICES
{"index":0,"label":"집중해서 듣는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"엔진 소리지 뭐\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"집중해서 듣는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"…가끔 칙, 하고 새는데. 벨트 쪽인가?"

"거기 말고 조금 아래."

"2번? 아까 손으로 만졌을 땐 진동 비슷했는데."

"응. 저 소리가 계속 나. 아직 작아서 나도 놓칠 뻔했어." 민지가 엔진 쪽을 가리켰다. "다음에 세우면 같이 열어보자. 혼자 들으면 자꾸 헷갈려."

한 번 더 귀를 기울였다. 칙. 이제 어느 쪽에서 나는지 알겠다.
CHIPS [{"t":"민지 사기 +4","c":"plus"},{"t":"새 기록 · 2번 실린더의 기분","c":"item"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"sangju","location":"상주 자전거길","day":5,"min":390,"km":296,"driving":null,"fuel":28.196159999999736,"water":15,"food":12,"scrap":45,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":5,"의약품":1,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["<span class=\"ic\">✦</span>민지와 나눌 이야기가 남아 있다 — 야영이나 정차 중 말을 건다"]

## choice 43 / trace 147 / talk_kw_01 / 강우 — 침묵
BEFORE {"at":"sangju","location":"상주 자전거길","day":5,"min":390,"km":296,"driving":null,"fuel":28.196159999999736,"water":15,"food":12,"scrap":45,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":5,"의약품":1,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
강우 옆에 앉았다. 강우는 아무 말이 없다. 나도 아무 말 안 했다.

무슨 말이라도 꺼낼까 하다가 두 번 관뒀다. 10분이 지났다.
PUBLIC CHOICES
{"index":0,"label":"계속 아무 말 안 한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"무슨 생각 해요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"계속 아무 말 안 한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
20분째에 강우가 입을 열었다.

"…대장은 침묵을 잘 견디는군."

"네? 아, 미안해요. 딴생각하느라 못 들었어요."

"…됐다."

그게 다였다. 그런데 어조가, 칭찬이었다.

나중에 알았다. 강우의 신뢰는 말수와 반비례한다는 걸. 오늘 우리는 20분어치 가까워졌다.
CHIPS [{"t":"강우 사기 +4","c":"plus"},{"t":"새 기록 · 침묵 면접","c":"item"},{"t":"✦ 강우 유대 +2","c":"item"}]
AFTER {"at":"sangju","location":"상주 자전거길","day":5,"min":390,"km":296,"driving":null,"fuel":28.196159999999736,"water":15,"food":12,"scrap":45,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":5,"의약품":1,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["<span class=\"ic\">✦</span>강우와의 유대가 깊어졌다 — 동료 카드에서 퍼크 선택"]

## choice 44 / trace 152 / parents_separated_work / 두 곳에서 만든 한 절차
BEFORE {"at":null,"day":5,"min":460,"km":311.2,"driving":{"from":"sangju","to":"mungyeong","gone":15.231666666666662,"dist":26},"fuel":25.213158333333087,"water":15,"food":12,"scrap":45,"van":99.0860999999999,"fatigue":4.975390000000001,"party":["minji","kangwoo"],"items":{"부품":5,"의약품":1,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","phase":"중부 기록망과 남산 유지선","why":"부모님은 갈라진 뒤에도 강제 이송선만 떼는 순서와 지워질 증언을 서로에게 보냈다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)","progress":{"have":5,"need":13,"label":"5/13"}},"navigation":{"key":"main_parents-separated-work","kind":"main","target":"cheongju","title":"부모님이 두 곳에서 이어 만든 절차를 찾는다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「두 곳에서 만든 한 절차」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
아빠의 남산 정비 기록과 엄마의 중부 기록 묶음에는 같은 번호가 반복됐다. 아빠는 의료·급수·교통선을 살린 채 강제 이송선만 떼어 내는 순서를 적었다. 엄마는 기록소에서 사라질 뻔한 이송 사유와 당사자 증언을 몰래 모았다. 두 사람은 서로 다른 곳에 갇힌 뒤에도 화물 묶음 번호로 자료를 주고받고 있었다.
PUBLIC CHOICES
{"index":0,"label":"아빠가 숨긴 정비 위치를 표시한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"엄마가 만든 증언 전달망을 표시한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"엄마가 만든 증언 전달망을 표시한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
식량 상자와 세탁물 묶음이 기록소 밖으로 나갈 때마다 증언 카드도 조금씩 북쪽으로 움직였다.
CHIPS [{"t":"새 기록 · 두 곳에서 만든 한 절차","c":"item"}]
AFTER {"at":null,"day":5,"min":460,"km":311.2,"driving":{"from":"sangju","to":"mungyeong","gone":15.231666666666662,"dist":26},"fuel":25.213158333333087,"water":15,"food":12,"scrap":45,"van":99.0860999999999,"fatigue":4.975390000000001,"party":["minji","kangwoo"],"items":{"부품":5,"의약품":1,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 45 / trace 155 / loc_mungyeong / 새재를 넘으며
BEFORE {"at":"mungyeong","location":"문경새재","day":5,"min":512,"km":322,"driving":null,"fuel":23.1133333333331,"water":15,"food":12,"scrap":45,"van":98.43999999999984,"fatigue":8.585849999999997,"party":["minji","kangwoo"],"items":{"부품":5,"의약품":1,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
문경새재. 과거 보러 한양 가던 옛길.

고갯마루 주막 터에 누군가 나무판을 세워놨다.

"옛날엔 이 고개를 넘으면 과거를 보러 갔다. 지금 넘는 당신은 무엇을 보러 가는가. 한 줄 적고 가세요."

판자엔 앞선 여행자들의 답이 빼곡하다. "가족" "바다" "끝" "시작" "그냥"
PUBLIC CHOICES
{"index":0,"label":"한 줄 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"한 줄 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
연필을 들고 한참 고민했다.

결국 적은 건 한 단어였다. 설명을 덧붙이려다가 연필을 내려놓았다. 돌아오는 길에 보면 무슨 뜻으로 썼는지 알겠지.

적고 나니 고개 너머가 조금 달라 보였다.

판자 맨 아래 오래된 글씨 하나가 눈에 밟혔다. 「돌아오는 길에 답을 고치러 오겠음.」
CHIPS [{"t":"사기 +6","c":"plus"},{"t":"새 기록 · 새재의 나무판","c":"item"}]
AFTER {"at":"mungyeong","location":"문경새재","day":5,"min":512,"km":322,"driving":null,"fuel":23.1133333333331,"water":15,"food":12,"scrap":45,"van":98.43999999999984,"fatigue":8.585849999999997,"party":["minji","kangwoo"],"items":{"부품":5,"의약품":1,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 46 / trace 158 / near_mungyeong_omija / 오미자 할머니
BEFORE {"at":"mungyeong","location":"문경새재","day":5,"min":632,"km":322,"driving":null,"fuel":23.1133333333331,"water":15,"food":12,"scrap":54,"van":98.43999999999984,"fatigue":13.013849999999998,"party":["minji","kangwoo"],"items":{"부품":6,"의약품":1,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
문경 산길 초입, 평상에 유리병들이 진열돼 있다. 붉은 액체— 오미자청이다.

"다섯 가지 맛이 나서 오미자야." 평상의 할머니가 병 하나를 흔들었다. "단맛 신맛 쓴맛 짠맛 매운맛. 인생 축소판이지."
PUBLIC CHOICES
{"index":0,"label":"한 병 산다 (고철 2)","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"맛만 본다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"한 병 산다 (고철 2)","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
물을 타 잔을 돌렸다. 첫 모금마다 서로 다른 표정이 나왔다.

"난 신맛." "난 단맛인데." "너 그거 물 많이 탄 거잖아." "…아."

"거 봐. 같은 걸 마셔도 다른 맛부터 느끼는 거야. 지금 자기한테 모자란 맛부터." 할머니의 오미자 관상학이었다.

남은 청은 물통 옆 특등석에 실렸다. 지친 날의 비상약이다.
CHIPS [{"t":"고철 -2","c":"minus"},{"t":"사기 +4","c":"plus"},{"t":"의약품 +1","c":"plus"},{"t":"새 기록 · 오미자 할머니","c":"item"}]
AFTER {"at":"mungyeong","location":"문경새재","day":5,"min":632,"km":322,"driving":null,"fuel":23.1133333333331,"water":15,"food":12,"scrap":52,"van":98.43999999999984,"fatigue":13.013849999999998,"party":["minji","kangwoo"],"items":{"부품":6,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 47 / trace 162 / story_family_key / 달구지 안의 검증키
BEFORE {"at":null,"day":5,"min":754,"km":348.5,"driving":{"from":"mungyeong","to":"chungju","gone":26.454999999999984,"dist":38},"fuel":19.27735833333308,"water":15,"food":10,"scrap":52,"van":98.43999999999984,"fatigue":21.52421999999999,"party":["minji","kangwoo"],"items":{"부품":6,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「달구지 안의 검증키」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
복원한 발표 연습 영상의 첨부 목록에 ‘검증키 분리 절차 4–5쪽’이 남아 있었다. 파일은 비어 있었고 마지막 전송지는 북부 연락소였다.

차를 세우고 계기판을 열었다. 출발 전에 번호를 붙여 둔 선들 사이에 모듈이 있었다. 빠진 두 장 없이는 어느 커넥터부터 풀어야 할지 알 수 없었다.

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
PUBLIC CHOICES
{"index":0,"label":"사진과 회로 수첩만 먼저 꺼낸다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"배선 위치를 표시하고 계기판을 덮는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"사진과 회로 수첩만 먼저 꺼낸다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
사진과 회로 수첩만 챙기고 모듈은 계기판 안에 남겼다. 떼어 낼 순서를 모른 채 힘을 주면 검증키도 달구지 배선도 함께 망가질 수 있었다.

사진 뒷면에는 엄마 글씨가 있었다.

「우리 대신 결정하지 마. 네가 결정할 수 있게 남기는 거야.」

뜯긴 두 장을 찾기 전까지는 기다려야 했다.
CHIPS [{"t":"사기 +4","c":"plus"},{"t":"새 기록 · 검증키의 위치","c":"item"}]
AFTER {"at":null,"day":5,"min":754,"km":348.5,"driving":{"from":"mungyeong","to":"chungju","gone":26.454999999999984,"dist":38},"fuel":19.27735833333308,"water":15,"food":10,"scrap":52,"van":98.43999999999984,"fatigue":21.52421999999999,"party":["minji","kangwoo"],"items":{"부품":6,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 48 / trace 165 / perimeter_first / 위수 구역
BEFORE {"at":"chungju","location":"충주호","day":5,"min":810,"km":360,"driving":null,"fuel":17.603333333333072,"water":15,"food":10,"scrap":52,"van":98.43999999999984,"fatigue":25.392569999999985,"party":["minji","kangwoo"],"items":{"부품":6,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
도로 한복판에— 그것이 서 있다.

4족 보행기. 소만 한 크기. 도색은 관공서 회색. 몸통의 렌즈가 차를 향해 조리개를 조인다.

<span class="ai">"정지. 위수 구역입니다."</span>

차를 훑는 초록 스캔선. 그리고—

탕. 경고사격이 차 옆 아스팔트를 때렸다. 기계가 처음으로, 우리에게 무기를 겨눴다.

<span class="ai">"등록되지 않은 차량. 다음 확인 시 회차를 강제합니다. 좋은 하루 되세요."</span>

보행기는 유유히 갓길로 물러나 도로를 열어줬다.
PUBLIC CHOICES
{"index":0,"label":"…지나간다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"…지나간다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
한동안 더 간 뒤에야 생각이 문장으로 굳었다.

남쪽은 그것의 '바깥'이었다. 여긴 '안'이다.

다음 정차에서 뒤 칸의 고철과 공구를 꺼내 작은 작업대를 폈다. 맨손으로 다닐 땅이 아니었다.

그날부터 달구지 뒤 칸은 대장간이 됐다.
CHIPS [{"t":"차체 -6%","c":"minus"},{"t":"관측 +1","c":"minus"},{"t":"새 기록 · 첫 경고사격","c":"item"}]
AFTER {"at":"chungju","location":"충주호","day":5,"min":810,"km":360,"driving":null,"fuel":17.603333333333072,"water":15,"food":10,"scrap":52,"van":92.43999999999984,"fatigue":25.392569999999985,"party":["minji","kangwoo"],"items":{"부품":6,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 49 / trace 168 / lc_chungju_lake / 호수의 수몰 마을
BEFORE {"at":"chungju","location":"충주호","day":5,"min":930,"km":360,"driving":null,"fuel":17.603333333333072,"water":15,"food":10,"scrap":64,"van":92.43999999999984,"fatigue":29.820569999999986,"party":["minji","kangwoo"],"items":{"부품":6,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
가뭄으로 충주호 수위가 내려가 옛 수몰 마을이 드러났다.

30년 만에 물 밖으로 나온 돌담과 우물과 마을 회관 터.

나이 든 사람들이 진흙 위를 조심조심 걷고 있다. "여기가 우리 집이었어."
PUBLIC CHOICES
{"index":0,"label":"옛 주민들과 걷는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"옛 주민들과 걷는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
노인들이 돌담을 쓸며 옛집을 하나하나 호명했다. "박씨네. 최씨네. 방앗간."

"방앗간은 저짝이여."

"저짝이 최씨네고."

"최씨네가 방앗간을 했잖여." 두 사람이 진흙 위에 서서 한동안 다퉜다. 결론은 안 났다.

옆에 있던 노인이 이쪽을 보며 말했다. "물에 잠긴 것도 이렇게 다시 보는데. 망한 세상도 언젠가 물 빠지듯 드러나겄지. 길이나 봐두게."
CHIPS [{"t":"1.5시간 경과","c":""},{"t":"사기 +6","c":"plus"},{"t":"새 기록 · 물 빠진 마을","c":"item"},{"t":"🔧 폐차장의 눈: 부품 +1","c":"item"}]
AFTER {"at":"chungju","location":"충주호","day":5,"min":1020,"km":360,"driving":null,"fuel":17.603333333333072,"water":15,"food":10,"scrap":64,"van":92.43999999999984,"fatigue":33.14156999999999,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 50 / trace 172 / story_personal_cache / 부모님이 감춘 상자
BEFORE {"at":null,"day":5,"min":1142,"km":386.5,"driving":{"from":"chungju","to":"cheongju","gone":26.454999999999984,"dist":40},"fuel":13.767358333333053,"water":15,"food":10,"scrap":64,"van":92.43999999999984,"fatigue":41.651940000000096,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「부모님이 감춘 상자」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
폐버스 배차실 책상 밑에서 작은 철제 상자가 나왔다. 어린 시절 가방에 달았던 버스 열쇠고리도 들어 있었다. 그 아래에는 타 버린 발신 릴, 마지막 두 장이 뜯긴 분리 절차 수첩, 이송된 가족들의 증언 카드가 차례로 놓여 있었다. 부모님은 세 가지를 이미 한곳에 모으려 했고, 끝내 다 모으지 못했다.
PUBLIC CHOICES
{"index":0,"label":"원본을 길 위 보관망과 함께 대조한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"원본은 숨기고 필요한 부분만 베낀다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"원본을 길 위 보관망과 함께 대조한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
가장 가까운 이음망 연락소에서 상자 안쪽의 묶음 번호를 알아봤다. 부모님은 피해자이기만 했던 것이 아니라, 흩어진 기록을 북쪽으로 보내던 사람이기도 했다. 원본은 전달자와 함께 대조하기로 했다.
CHIPS [{"t":"새 기록 · 부모님이 감춘 상자","c":"item"}]
AFTER {"at":null,"day":5,"min":1142,"km":386.5,"driving":{"from":"chungju","to":"cheongju","gone":26.454999999999984,"dist":40},"fuel":13.767358333333053,"water":15,"food":10,"scrap":64,"van":92.43999999999984,"fatigue":41.651940000000096,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 51 / trace 177 / talk_mj_16 / 민지 — 청진기
BEFORE {"at":"cheongju","location":"청주 방송국","day":6,"min":390,"km":400,"driving":null,"fuel":11.803333333333045,"water":14,"food":7,"scrap":64,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
민지가 낡은 청진기를 엔진 블록에 대고 있다. 병원 것이 아니라 정비용이다.

"…쉿. 달구지 심장 소리 듣는 중."
PUBLIC CHOICES
{"index":0,"label":"\"나도 들어보자\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"불규칙하면 어떡해?\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"나도 들어보자\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
청진기를 넘겨받았다. 두근, 두근— 정말 심장 소리 같다.

"이게 어디서 나는 소리야?"

"오일 펌프. 정확히는 그 옆에 붙은— 됐고. 규칙적이지? 얘 오늘 컨디션 좋아."

민지가 제 환자를 자랑하는 의사처럼 웃었다. 이 차가 살아 있다는 말이 그날은 비유로 들리지 않았다.
CHIPS [{"t":"민지 사기 +4","c":"plus"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":6,"min":390,"km":400,"driving":null,"fuel":11.803333333333045,"water":14,"food":7,"scrap":64,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 52 / trace 180 / talk_kw_03 / 강우 — 스트레칭
BEFORE {"at":"cheongju","location":"청주 방송국","day":6,"min":390,"km":400,"driving":null,"fuel":11.803333333333045,"water":14,"food":7,"scrap":64,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
차를 세우면 강우가 혼자 몸을 푸는 걸 다들 안다. 오늘은 용기 내서 옆에 섰다.

"…따라 하게?"
PUBLIC CHOICES
{"index":0,"label":"\"가르쳐줘요\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"구경만 한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"가르쳐줘요\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
군대식 체조가 시작됐다. 목— 어깨— 허리— 구령은 없는데 박자가 정확하다.

"이거 몇 개씩 해요?"

"……."

"강우 씨?"

"세는 거 아니다."

어깨를 돌리자 우두둑 소리가 났다. 동작 몇 개를 따라 했을 뿐인데 조금 개운했다.

"운전자는 몸이 장비다. 정비해라." 강우식 운전 전 점검이었다.
CHIPS [{"t":"피로 -4","c":"plus"},{"t":"강우 사기 +3","c":"plus"},{"t":"새 기록 · 몸이 장비다","c":"item"},{"t":"✦ 강우 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":6,"min":390,"km":400,"driving":null,"fuel":11.803333333333045,"water":14,"food":7,"scrap":64,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 53 / trace 183 / story_parent_route_shared / 서진이 찾아낸 두 장
BEFORE {"at":"cheongju","location":"청주 방송국","day":6,"min":420,"km":400,"driving":null,"fuel":11.803333333333045,"water":14,"food":7,"scrap":64,"van":100,"fatigue":1.107,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1},"ended":false,"main":{"title":"부모님의 인간 확인 검증키를 꺼낸다","phase":"계기판의 장치를 꺼낼 방법을 찾는 중","why":"엄마가 절차를 설계하고 아빠가 만든 검증키는 달구지 계기판에 연결돼 있다. 순서를 모르고 떼면 장치와 달구지 배선이 모두 망가진다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)","progress":{"have":6,"need":13,"label":"6/13"}},"navigation":{"key":"main_verification-key","kind":"main","target":"cheongju","title":"부모님의 인간 확인 검증키를 꺼낸다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「서진이 찾아낸 두 장」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
북부 연락소에서 서진이 부모님 상자의 묶음 번호와 같은 봉투를 꺼냈다. 뜯겨 있던 마지막 두 장이었다. 한 장에는 강제 이송선만 분리하는 순서가, 다른 한 장에는 분리 뒤 반드시 사람에게 확인을 넘기라는 조건이 적혀 있었다. 부모님은 기계를 끄는 법이 아니라, 명령권을 사람에게 돌리는 법을 북쪽으로 보냈다.
PUBLIC CHOICES
{"index":0,"label":"두 장을 원래 수첩에 끼운다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"원본과 사본을 다른 길로 나눈다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"원본과 사본을 다른 길로 나눈다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
한 부는 이음망 전달책에게 맡기고 원본은 달구지로 가져왔다. 적힌 순서대로 배선을 풀자 검증키가 손상 없이 빠졌다.
CHIPS [{"t":"부모님의 검증키 +1","c":"plus"},{"t":"새 기록 · 서진이 찾아낸 두 장","c":"item"},{"t":"◈ 실행 전 인간 확인키 · 확인","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":6,"min":420,"km":400,"driving":null,"fuel":11.803333333333045,"water":14,"food":7,"scrap":64,"van":100,"fatigue":1.107,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 54 / trace 187 / cleaners_recall / 회수조
BEFORE {"at":null,"day":6,"min":490,"km":415.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":9.594741666666367,"water":14,"food":7,"scrap":64,"van":100,"fatigue":6.0069099999999995,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
갓길에 흰 옷 넷이 서 있다. 정리자들. 그 앞에 낡은 승합차 한 대와, 차에서 내리지 않으려는 여자 하나.

"이탈자 회수 중입니다." 선두의 남자가 우리 차에 손바닥을 들어 보였다. 지나가라는 뜻이다.

"동생분이 그분 곁을 그리워하십니다." 남자의 목소리는 부드러웠다. 여자의 얼굴은 그렇지 않았다.

"저는 안 그리워요." 여자가 말했다. 남자는 미소를 지우지 않았다. "돌아가면 기억나실 겁니다."

협박도 무기도 없다. 다만 넷이 한 사람을 둘러싸고, 부드럽게, 계속, 서 있을 뿐이다.
PUBLIC CHOICES
{"index":0,"label":"차에서 내려 여자 옆에 선다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"본인이 싫다잖아요\" — 창문만 내리고 말한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"지나간다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"차에서 내려 여자 옆에 선다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
내려서 서긴 했는데, 회수조는 물러나는 대신 기도를 시작했다. 넷이 무릎을 꿇고, 우리와 여자를 향해, 낮고 길게.

그 소리가 제일 무서웠다. 여자가 귀를 막았다.

결국 여자를 차에 태우고 그 자리를 떠나는 수밖에 없었다. 기도 소리는 오래 따라왔다.
CHIPS [{"t":"30분 경과","c":""},{"t":"사기 -4","c":"minus"},{"t":"관측 +1","c":"minus"},{"t":"새 기록 · 기도하는 포위","c":"item"}]
AFTER {"at":null,"day":6,"min":520,"km":415.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":9.594741666666367,"water":14,"food":7,"scrap":64,"van":100,"fatigue":7.11391,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 55 / trace 190 / loc_sejong / 쓰인 적 없는 도시
BEFORE {"at":"sejong","location":"세종 신도시","day":6,"min":561,"km":424,"driving":null,"fuel":8.323333333333027,"water":14,"food":7,"scrap":64,"van":100,"fatigue":9.950699999999998,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
세종. 완공 직후에 세상이 멈춘 행정도시.

입주한 적 없는 청사, 개통한 적 없는 교차로, 심긴 그대로 자란 가로수.

그리고 청사 로비의 전광판이— 켜져 있다.

<span class="ai">정부통합전산센터 분원 — 정상 가동 중</span>
<span class="ai">금일 민원 처리: 0건 (1,096일 연속)</span>
PUBLIC CHOICES
{"index":0,"label":"청사 안을 들여다본다","hint":"위험 · 관측 위험","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"도시를 조용히 통과한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"청사 안을 들여다본다","hint":"위험 · 관측 위험","visible":true,"enabled":true,"requirement":""}
RESULT
로비는 새것 그대로였다. 안내 로봇이 우리를 보고 일어났다.

"민원이십니까?" 여러 해 만의 첫 방문자에게, 그것은 번호표를 뽑아줬다. 1번.

창구 스크린에 문구가 떴다.

<span class="ai">"접수 내용: 세계. 처리 기한: 미정. …농담입니다. 어서 가세요. 여긴 기록만 남는 곳이라."</span>

농담. 그것이 농담을 했다. 소름과 함께— 이상하게 서글펐다.
CHIPS [{"t":"사기 -2","c":"minus"},{"t":"관측 +1","c":"minus"},{"t":"새 기록 · 민원 1번","c":"item"}]
AFTER {"at":"sejong","location":"세종 신도시","day":6,"min":561,"km":424,"driving":null,"fuel":8.323333333333027,"water":14,"food":7,"scrap":64,"van":100,"fatigue":9.950699999999998,"party":["minji","kangwoo"],"items":{"부품":7,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 56 / trace 193 / lc_sejong_library / 개관 못 한 도서관
BEFORE {"at":"sejong","location":"세종 신도시","day":6,"min":681,"km":424,"driving":null,"fuel":8.323333333333027,"water":14,"food":7,"scrap":76,"van":100,"fatigue":14.378699999999998,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
세종의 거대한 국립도서관. 개관 예정일 현수막이 오랫동안 걸려 있다.

안에는— 포장도 안 뜯은 새 책 수십만 권.

세상에서 제일 큰 새 책 냄새가 난다.
PUBLIC CHOICES
{"index":0,"label":"개관식을 열어준다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"개관식을 열어준다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
테이프를 끊고(안전 테이프였지만 기분은 리본), "개관을 선언합니다"를 외쳤다.

첫 대출자로 각자 한 권씩 골랐다. 대출 카드에 한 사람씩 이름을 적었다.

다음 사람이 쓸 빈 카드를 책상 위에 가지런히 놓았다. 책 냄새를 실은 차가 도서관을 나섰다.
CHIPS [{"t":"사기 +7","c":"plus"},{"t":"새 기록 · 여러 해 늦은 개관식","c":"item"}]
AFTER {"at":"sejong","location":"세종 신도시","day":6,"min":681,"km":424,"driving":null,"fuel":8.323333333333027,"water":14,"food":7,"scrap":76,"van":100,"fatigue":14.378699999999998,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 57 / trace 197 / story_bridge_parent_route / 같은 날, 다른 차
BEFORE {"at":null,"day":6,"min":751,"km":439.2,"driving":{"from":"sejong","to":"cheongju","gone":15.231666666666662,"dist":24},"fuel":6.114741666666364,"water":14,"food":5,"scrap":76,"van":100,"fatigue":19.27860999999999,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
바닥 수납칸 안쪽에서 오래된 화물표 두 장을 떼어 냈다. 날짜는 같았다. 아빠의 작업증 번호는 남산 기술 유지선으로, 엄마의 모듈 일련번호는 중부 이송 기록 정리소로 이어져 있었다. 운행표에서 확인한 두 경로가 달구지 안에도 남아 있었다. 종이를 펴자 접힌 자리가 하얗게 일어났다.
PUBLIC CHOICES
{"index":0,"label":"두 경로가 갈라진 지점을 지도에 표시한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"표를 접어 엄마의 모듈과 함께 넣는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"표를 접어 엄마의 모듈과 함께 넣는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
종이를 접자 오래된 기름 냄새가 났다. 할아버지는 이 두 장을 버리지 못했다. 두 경로의 번호가 지워지지 않도록 검증키와 다른 봉투에 넣었다.
CHIPS []
AFTER {"at":null,"day":6,"min":751,"km":439.2,"driving":{"from":"sejong","to":"cheongju","gone":15.231666666666662,"dist":24},"fuel":6.114741666666364,"water":14,"food":5,"scrap":76,"van":100,"fatigue":19.27860999999999,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 58 / trace 202 / story_bridge_child_voice / 내가 남긴 적 없는 목소리
BEFORE {"at":null,"day":6,"min":862,"km":463.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":2.7067416666663586,"water":14,"food":5,"scrap":76,"van":100,"fatigue":26.44920999999999,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
라디오가 주파수를 몇 번 건너뛰더니 어린아이의 목소리를 틀었다. 「엄마, 우리 어디 가?」 여덟 살 때 버스 승강장에서 했던 내 말이었다. 숨을 들이쉬는 버릇까지 그대로였다. 녹음이 끝나자 지금의 안내 음성이 이어졌다. 「동일 보호 대상 확인. 남산 현장 확인 대기」
PUBLIC CHOICES
{"index":0,"label":"전원을 끈다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"끝까지 듣는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"끝까지 듣는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
마지막에는 길 안내가 붙었다. 가장 빠른 길도, 가장 안전한 길도 아니었다. 남산 정비 차량만 쓰던 길이었다. 초대인지 회수 명령인지 구별되지 않았다.
CHIPS [{"t":"관측 +1","c":"minus"}]
AFTER {"at":null,"day":6,"min":862,"km":463.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":2.7067416666663586,"water":14,"food":5,"scrap":76,"van":100,"fatigue":26.44920999999999,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 59 / trace 207 / crisis_nofuel / 연료 바닥
BEFORE {"at":null,"day":6,"min":951,"km":482.4,"driving":{"from":"sejong","to":"cheongju","gone":10.421666666666667,"dist":24},"fuel":0,"water":14,"food":5,"scrap":76,"van":100,"fatigue":32.18568999999999,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
게이지 바늘이 E 아래로 떨어졌다. 엔진이 두 번 기침하고 잠들었다.

여기는 길 위. 가장 가까운 사람 사는 곳까지는 걸어서 한나절.
PUBLIC CHOICES
{"index":0,"label":"걸어서 연료를 구해온다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"지나가는 차를 기다린다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"걸어서 연료를 구해온다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
빈 기름통 두 개를 메고 걸었다. 한나절 만에 농가 창고에서 경운기 기름을 구해 돌아왔다.

다리가 후들거리지만, 차가 다시 살아났다.
CHIPS [{"t":"연료 +9L","c":"plus"},{"t":"물 -2","c":"minus"},{"t":"식량 -2","c":"minus"},{"t":"7시간 경과","c":""},{"t":"사기 -4","c":"minus"}]
AFTER {"at":null,"day":6,"min":1371,"km":482.4,"driving":{"from":"sejong","to":"cheongju","gone":10.421666666666667,"dist":24},"fuel":9,"water":12,"food":3,"scrap":76,"van":100,"fatigue":46.549689999999984,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 60 / trace 210 / story_bridge_crew_question / 그래도 가는 이유
BEFORE {"at":null,"day":6,"min":1393,"km":487.2,"driving":{"from":"sejong","to":"cheongju","gone":15.231666666666662,"dist":24},"fuel":8.316980000000004,"water":12,"food":3,"scrap":76,"van":100,"fatigue":48.57432999999999,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
정차한 달구지에서 증거 봉투를 다시 펼쳤다. 부모님의 경로는 둘로 갈라졌고, 남산은 나를 기다리고 있었다. 수첩 귀퉁이에 한 줄을 적었다. 엄마가 그곳에 없더라도 갈 건가. 오래 보고도 답은 저절로 생기지 않았다.
PUBLIC CHOICES
{"index":0,"label":"이 명령만큼은 끝내야 한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"엄마 곁으로 가고 싶다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"둘 다다. 그래서 겁난다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"이 명령만큼은 끝내야 한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
엄마를 못 만나더라도, 내일 또 다른 아이 이름이 명단에 오르는 건 막아야 했다. 그렇게 적고 나니 무서운 마음까지 사라지지는 않았다.
CHIPS [{"t":"사기 +1","c":"plus"}]
AFTER {"at":null,"day":6,"min":1393,"km":487.2,"driving":{"from":"sejong","to":"cheongju","gone":15.231666666666662,"dist":24},"fuel":8.316980000000004,"water":12,"food":3,"scrap":76,"van":100,"fatigue":48.57432999999999,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 61 / trace 214 / gp_note1 / 수첩 — 접힌 페이지
BEFORE {"at":"cheongju","location":"청주 방송국","day":7,"min":390,"km":496,"driving":null,"fuel":7.07187666666667,"water":11,"food":0,"scrap":76,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
신호 대기 중(신호는 없지만 버릇이다), 조수석의 수첩이 툭 떨어지며 접힌 페이지가 펼쳐졌다.

할아버지의 글씨.

"엔진 소리가 평소와 다르면 속도부터 줄여라. 계속 밟으면 작은 고장도 큰돈 든다.
옆 사람이 갑자기 말이 없어져도 똑같다. 물부터 주고, 차를 세워."
PUBLIC CHOICES
{"index":0,"label":"수첩대로 엔진 소리를 듣는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"수첩대로 엔진 소리를 듣는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
시동을 켠 채 5분을 들었다. 할아버지가 가르쳐준 순서대로.

벨트 장력이 어긋난 걸 찾아 시동을 끄고 조였다.

작은 소리부터 들으라는 말. 엔진 얘기만은 아니었겠지.
CHIPS [{"t":"차체 0%","c":""},{"t":"사기 +3","c":"plus"},{"t":"새 기록 · 수첩 — 접힌 페이지","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":7,"min":390,"km":496,"driving":null,"fuel":7.07187666666667,"water":11,"food":0,"scrap":76,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 62 / trace 217 / talkr_mj_3 / 민지 — 조수석 5분
BEFORE {"at":"cheongju","location":"청주 방송국","day":7,"min":390,"km":496,"driving":null,"fuel":7.07187666666667,"water":11,"food":0,"scrap":76,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
휴식 시간. 민지가 조수석 옆에 걸터앉았다. 드문 일이다.

"5분만 아무것도 안 할래. 같이."
PUBLIC CHOICES
{"index":0,"label":"같이 아무것도 안 한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"같이 아무것도 안 한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
5분간 둘이서 성실하게 아무것도 안 했다.

"…5분 됐지?"

"2분 지났어."

"…길다, 5분."

민지는 4분 30초쯤에 몸이 근질거려서 실패 직전까지 갔지만 버텼다. "…힘들다, 이거." "쉬는 게?" "어." 쉬는 법을 연습하는 정비사와, 그 연습을 도와주는 5분이었다.
CHIPS [{"t":"피로 -2","c":"plus"},{"t":"민지 사기 +2","c":"plus"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":7,"min":390,"km":496,"driving":null,"fuel":7.07187666666667,"water":11,"food":0,"scrap":76,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 63 / trace 220 / talk_kw_09 / 강우 — 무서운 것
BEFORE {"at":"cheongju","location":"청주 방송국","day":7,"min":390,"km":496,"driving":null,"fuel":7.07187666666667,"water":11,"food":0,"scrap":76,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"강우 씨도 무서운 게 있어요?"

어렵게 꺼낸 질문에, 강우는 의외로 바로 답했다.

"있다."
PUBLIC CHOICES
{"index":0,"label":"\"뭔데요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"뭔데요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"익숙해지는 거."

강우가 드물게 긴 문장을 시작했다. 중간에 한 번 말을 골랐다. "총성에 익숙해지고, 폐허에 익숙해지고, 사람 잃는 것에… 익숙해지고. 나중엔 아무렇지도 않아져."

뒷자리에서 냄비 뚜껑이 덜컹 떨어졌다. 강우가 그쪽을 보고 입꼬리를 아주 조금 올렸다. "저런 건 아직 좋군."
CHIPS [{"t":"강우 사기 +5","c":"plus"},{"t":"새 기록 · 익숙함이라는 공포","c":"item"},{"t":"✦ 강우 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":7,"min":390,"km":496,"driving":null,"fuel":7.07187666666667,"water":11,"food":0,"scrap":76,"van":100,"fatigue":0,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["<span class=\"ic\">★</span>강우 — 「그날의 진실」"]

## choice 64 / trace 224 / patrol_toll / 불 꺼진 검문소
BEFORE {"at":null,"day":7,"min":460,"km":511.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":4.908980000000001,"water":11,"food":0,"scrap":76,"van":100,"fatigue":4.54138,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
톨게이트처럼 생긴 오래된 검문소가 안개 속에 걸려 있다. 불은 꺼졌는데 차단봉만 새것처럼 반듯하다.

센서 기둥 하나가 천천히 고개를 돌린다. 아직 우리 번호를 읽지는 못했다.
PUBLIC CHOICES
{"index":0,"label":"배수로를 따라 제어함까지 붙는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"달구지를 폐기 차량처럼 갓길에 세운다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"논길로 멀리 우회한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"배수로를 따라 제어함까지 붙는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
달구지를 센서 밖에 세우고 배수로로 몸을 낮췄다.

물이 무릎까지 찼지만 콘크리트 벽이 열을 가려줬다. 제어함은 손 닿는 곳까지 왔다.
CHIPS [{"t":"전세 우세 +1","c":"plus"},{"t":"숨 돌릴 틈 확보","c":"plus"},{"t":"피로 +3","c":"minus"}]
AFTER {"at":null,"day":7,"min":460,"km":511.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":4.908980000000001,"water":11,"food":0,"scrap":76,"van":100,"fatigue":7.54138,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 65 / trace 226 / combat_toll_read / 깨어나는 순서
BEFORE {"at":null,"day":7,"min":460,"km":511.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":4.908980000000001,"water":11,"food":0,"scrap":76,"van":100,"fatigue":7.54138,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
제어함 안에는 수동 레버와 오래된 정비 포트가 함께 있다. 레버는 안쪽 깊이 박혀 있어 맨손으로 끝까지 당기기 어렵다. 쇠파이프 같은 지렛대를 걸어야 한다.

멀리서 센서 기둥 하나가 켜지고, 그다음 카메라가 돌아간다. 전부 한꺼번에 깨어나는 장치는 아니다.
PUBLIC CHOICES
{"index":0,"label":"점등 순서를 한 바퀴 더 지켜본다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"민지가 레버 축의 고정핀을 뺀다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":3,"label":"센서가 더 켜지기 전에 손부터 댄다","hint":"위험 · 경보가 빠르다 · 노출 · 센서가 접근 위치를 먼저 잡는다 · 이후 · 다음 돌파의 전세와 압박으로 이어진다","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"점등 순서를 한 바퀴 더 지켜본다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
센서, 카메라, 차단봉. 여섯 초 뒤 경보.

순서는 늘 같았다. 지렛대만 준비돼 있으면 레버를 당기고 차까지 뛸 수 있는 간격이다. 넘어지지만 않으면.
CHIPS [{"t":"전세 우세 +1","c":"plus"},{"t":"◎ 읽어낸 틈 · 센서 점등부터 송신까지 여섯 초","c":"plus"},{"t":"3분 경과","c":""}]
AFTER {"at":null,"day":7,"min":463,"km":511.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":4.908980000000001,"water":11,"food":0,"scrap":76,"van":100,"fatigue":7.64398,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 66 / trace 228 / combat_toll_breach / 여섯 초
BEFORE {"at":null,"day":7,"min":463,"km":511.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":4.908980000000001,"water":11,"food":0,"scrap":76,"van":100,"fatigue":7.64398,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
첫 번째 센서에 붉은 불이 들어왔다.

<span class="ai">"미등록 접근. 확인 절차를 시작합니다."</span>

아직 사이렌은 없다. 손으로 센 여섯 초가 지금부터다.
PUBLIC CHOICES
{"index":0,"label":"쇠파이프로 수동 레버를 당긴다","hint":"위험 · 경보 송신","visible":true,"enabled":false,"requirement":"쇠파이프 1개 필요"}
{"index":2,"label":"센서 앞에 화염병을 깨고 밀고 나간다","hint":"","visible":true,"enabled":false,"requirement":"화염병 1개 필요"}
{"index":3,"label":"작업을 버리고 논길로 물러난다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":3,"label":"작업을 버리고 논길로 물러난다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
케이블과 공구만 챙겨 배수로로 돌아 나왔다.

붉은 불이 등을 훑었다. 운전석에 올라 시동을 걸자 센서가 달구지의 번호판 높이에서 멈췄다.

오래 돌아가도 무사히 빠져나오는 편이 낫다. 그건 맞다. 다만 제어함은 손댄 채로 남았고, 손댄 흔적은 열린 것보다 오래 남는다.
CHIPS [{"t":"연료 -4L","c":"minus"},{"t":"40분 경과","c":""},{"t":"사기 -3","c":"minus"},{"t":"관측 +1","c":"minus"},{"t":"전술 연계 · 사기 +1","c":"plus"},{"t":"교전 부분 달성 · 행동 기록 저장","c":"plus"},{"t":"새 기록 · 손댄 채로 둔 제어함","c":"item"}]
AFTER {"at":null,"day":7,"min":503,"km":511.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":0.9089800000000006,"water":11,"food":0,"scrap":76,"van":100,"fatigue":9.01198,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 67 / trace 231 / crisis_nofuel2 / 또, 연료 바닥
BEFORE {"at":null,"day":7,"min":533,"km":517.6,"driving":{"from":"cheongju","to":"sejong","gone":21.64499999999999,"dist":24},"fuel":0,"water":11,"food":0,"scrap":76,"van":100,"fatigue":10.92414,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
바늘이 E 아래로 떨어지는 걸 이번에는 보고 있었다.

엔진이 잠들었다. 지난번과 같은 소리. 이번에도 길 위다.

빈 기름통을 꺼내는 손이 익숙해진 게 제일 무섭다.
PUBLIC CHOICES
{"index":0,"label":"다시 걷는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"지나가는 차를 기다린다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"다시 걷는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
처음 들른 농가는 문이 잠겨 있었다. 두 집을 더 지나서야 경운기 기름을 나눠 받았다.

"조심혀. 요즘 길에 서 있는 차는 위에서 다 세어 간다니께."

아홉 시간 만에 돌아왔다. 다리보다 마음이 더 무겁다.
CHIPS [{"t":"연료 +8L","c":"plus"},{"t":"물 -3","c":"minus"},{"t":"식량 0","c":""},{"t":"9시간 경과","c":""},{"t":"피로 +18","c":"minus"},{"t":"사기 -6","c":"minus"}]
AFTER {"at":null,"day":7,"min":1073,"km":517.6,"driving":{"from":"cheongju","to":"sejong","gone":21.64499999999999,"dist":24},"fuel":8,"water":8,"food":0,"scrap":76,"van":100,"fatigue":55.39214,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🍚 점심 결식 · 식량 0/2 · 허기 1/3 · 피로 +8 · 사기 -4"]

## choice 68 / trace 236 / story_generation_speech / 서울말 해봐
BEFORE {"at":null,"day":7,"min":1154,"km":535.2,"driving":{"from":"sejong","to":"cheongju","gone":15.231666666666662,"dist":24},"fuel":5.4850566666666625,"water":8,"food":0,"scrap":76,"van":100,"fatigue":60.65057999999992,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
장터에서 아이 하나가 국밥 줄의 노인 소매를 잡는다.

"할머니, 서울말 해봐."

"뭘 해."

"서울말요. 저번에 했잖아요."

"저번에 뭘 했다고 그래." 그러면서도 노인은 헛기침을 하고, 오래전 역 이름을 몇 개 또박또박 읽었다. 아이들이 까르르 웃는다. 그중 서울을 본 아이는 없다.

"우리 엄마는 밖에서 쓰지 말랬어." 노인이 말했다. "나는 집에서만 했고. 쟤들은 장날마다 돈 내라네."

아이 하나가 국밥 그릇을 내밀었다. "한 번 더 하면 공짜."
PUBLIC CHOICES
{"index":0,"label":"\"우리 집 서울말은 어떤데요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"아이에게 어디가 서울인지 묻는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"아이에게 어디가 서울인지 묻는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"서울이 어느 쪽인지 알아?"

아이는 잠깐 생각하더니 손가락을 들었다. 북쪽이 아니라 자기 할머니 쪽이었다.

"할머니가 서울인데?"

"아니, 그게 아니라 방향을—"

"할머니가 서울이라니까요."

노인은 웃다가 국밥값을 대신 냈다. 떠나기 전, 아이는 역 이름을 한 번 더 들려 달라고 졸랐다.
CHIPS [{"t":"사기 +2","c":"plus"},{"t":"새 기록 · 사람 안의 서울","c":"item"}]
AFTER {"at":null,"day":7,"min":1154,"km":535.2,"driving":{"from":"sejong","to":"cheongju","gone":15.231666666666662,"dist":24},"fuel":5.4850566666666625,"water":8,"food":0,"scrap":76,"van":100,"fatigue":60.65057999999992,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 69 / trace 240 / crisis_hungry / 주린 배
BEFORE {"at":"cheongju","location":"청주 방송국","day":8,"min":390,"km":544,"driving":null,"fuel":4.143501666666661,"water":5,"food":0,"scrap":76,"van":100,"fatigue":12,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
끼니를 거른 탓에 속이 쓰리다. 식량통을 다시 열어 봤다.

차 안이 조용하다. 배고픔은 소리부터 죽인다.
PUBLIC CHOICES
{"index":0,"label":"주변에서 먹을 것을 찾는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"버틴다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"주변에서 먹을 것을 찾는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
밭이었던 곳에서 야생 감자와 쑥을 캤다. 흙맛 반 감자맛 반. 그래도 배는 속일 수 있었다.
CHIPS [{"t":"물 -1","c":"minus"},{"t":"식량 +2","c":"plus"},{"t":"2시간 경과","c":""},{"t":"허기 2→1","c":"plus"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":8,"min":510,"km":544,"driving":null,"fuel":4.143501666666661,"water":4,"food":2,"scrap":76,"van":100,"fatigue":16.104,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 70 / trace 243 / talk_mj_06 / 민지 — 88.9
BEFORE {"at":"cheongju","location":"청주 방송국","day":8,"min":510,"km":544,"driving":null,"fuel":4.143501666666661,"water":4,"food":2,"scrap":76,"van":100,"fatigue":16.104,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
민지가 라디오를 88.9에 맞춰놓고 잡음을 듣고 있다. 오래.

돌리려는 기색이 없다.
PUBLIC CHOICES
{"index":0,"label":"옆에서 같이 듣는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"조용히 자리를 비켜준다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"옆에서 같이 듣는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
잡음을 10분쯤 같이 들었다. 민지가 먼저 입을 열었다.

"오빠랑 정한 채널이야. 잡히는 날이 있고 아닌 날이 있어. …잡히는 날엔, 살아 있다는 뜻이라고 정했어."

"오늘은?"

민지는 바로 답하지 않았다. 다이얼에 손만 얹고 있다가—

"…잡음." 민지가 라디오를 껐다. "내일 또 들으면 돼."

라디오 위에 올린 손은 바로 떨어지지 않았다. 나도 채널을 바꾸지 않았다.
CHIPS [{"t":"민지 사기 +5","c":"plus"},{"t":"새 기록 · 내일 또 들으면 돼","c":"item"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":8,"min":510,"km":544,"driving":null,"fuel":4.143501666666661,"water":4,"food":2,"scrap":76,"van":100,"fatigue":16.104,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 71 / trace 246 / talkr_kw_1 / 강우 — 상황 보고
BEFORE {"at":"cheongju","location":"청주 방송국","day":8,"min":510,"km":544,"driving":null,"fuel":4.143501666666661,"water":4,"food":2,"scrap":76,"van":100,"fatigue":16.104,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"보고." 강우가 손가락 두 개를 들었다. "특이사항 둘. 들을 건가."
PUBLIC CHOICES
{"index":0,"label":"\"보고 받겠습니다\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"저도 보고할게요\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"보고 받겠습니다\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"하나. 6시 방향 3km, 연기 한 줄기. 밥 짓는 연기다. 위협 아님. 둘. …둘이 뭐였지."

"네?"

"…노면. 노면 상태 양호. 이상."

"연기가 밥 짓는 건지 어떻게 알아요?" "색. 그리고 시간." 세상을 이렇게 읽는 사람이 한 명 있으면, 차 안의 잠이 깊어진다.
CHIPS [{"t":"강우 사기 +2","c":"plus"},{"t":"✦ 강우 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":8,"min":510,"km":544,"driving":null,"fuel":4.143501666666661,"water":4,"food":2,"scrap":76,"van":100,"fatigue":16.104,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 72 / trace 250 / story_generation_theories / 빈칸을 둘러싼 세 가설
BEFORE {"at":null,"day":8,"min":584,"km":560,"driving":{"from":"cheongju","to":"sejong","gone":16.033333333333328,"dist":24},"fuel":1.8667683333333254,"water":4,"food":2,"scrap":76,"van":100,"fatigue":20.8844,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
폐교 교실 하나를 세 사람이 기록실로 쓰고 있었다.

창가의 남자는 서울 지하수 지도를 펼쳤다. "물 때문이야." 하지만 물이 남은 구역도 비워졌다.

옆자리 노인은 진료 통계를 내밀었다. "질병 때문이야." 하지만 환자가 없던 해에도 이송 방송은 왔다.

작업복을 입은 여자는 시위 전단을 모았다. "통제 때문이야." 하지만 천리안에 협조한 관제사 가족도 같은 길로 내려왔다.

우리가 오기 전에도 다투던 중이었는지, 창가의 남자가 손을 저었다. "그 얘긴 지난달에 끝났잖아." "끝난 게 아니라 자네가 그만한 거지." 노인이 받았고, 여자는 들은 척도 안 했다.

세 사람은 서로의 자료를 바꿔 읽고, 맞지 않는 날짜마다 붉은 줄을 그었다. 칠판에는 세 주장보다 반박이 더 많이 남았다.
PUBLIC CHOICES
{"index":0,"label":"공통으로 남은 것을 묻는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"세 가설을 모두 수첩에 남긴다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"공통으로 남은 것을 묻는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
세 사람이 동시에 이송표의 같은 칸을 짚었다. 「사유」.

비어 있었다.

"가설은 셋인데 공문은 하나야. 누가 맞든, 설명도 없이 내쫓았다는 건 그대로지."

남자가 내 수첩의 세 가설 옆에 날짜를 적고, 노인이 반증 자료의 보관 장소를 덧붙였다.
CHIPS [{"t":"사기 +1","c":"plus"},{"t":"새 기록 · 빈칸을 둘러싼 세 가설","c":"item"},{"t":"기억됨 · 세 가설보다 모두에게 남은 빈 사유란을 보았다.","c":"item"}]
AFTER {"at":null,"day":8,"min":584,"km":560,"driving":{"from":"cheongju","to":"sejong","gone":16.033333333333328,"dist":24},"fuel":1.8667683333333254,"water":4,"food":2,"scrap":76,"van":100,"fatigue":20.8844,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 73 / trace 255 / crisis_nofuel3 / 세 번째 빈 탱크
BEFORE {"at":null,"day":8,"min":647,"km":573.6,"driving":{"from":"sejong","to":"cheongju","gone":5.611666666666667,"dist":24},"fuel":0,"water":4,"food":2,"scrap":76,"van":100,"fatigue":24.94774,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
엔진이 잠들었다. 세 번째다.

갓길에 오래 서 있는 차는 눈에 띈다. 사람의 눈에도, 사람이 아닌 것의 눈에도.

<span class="ai">"정지 차량 확인. 반복 패턴 등록."</span>

라디오도 꺼져 있는데, 그 목소리가 들리는 것 같았다.
PUBLIC CHOICES
{"index":0,"label":"걷는 수밖에 없다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"가까운 마을로 견인을 부탁한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"걷는 수밖에 없다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS [{"t":"연료 +8L","c":"plus"},{"t":"물 -3","c":"minus"},{"t":"식량 -2","c":"minus"},{"t":"10시간 경과","c":""},{"t":"피로 +22","c":"minus"},{"t":"사기 -7","c":"minus"},{"t":"관측 +1","c":"minus"}]
AFTER {"at":null,"day":8,"min":1247,"km":573.6,"driving":{"from":"sejong","to":"cheongju","gone":5.611666666666667,"dist":24},"fuel":8,"water":1,"food":0,"scrap":76,"van":100,"fatigue":79.46774,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🍚 점심 결식 · 식량 0/2 · 공복 2/3 · 피로 +12 · 사기 -6"]

## choice 74 / trace 258 / water_toll / 우물 앞의 줄
BEFORE {"at":null,"day":8,"min":1295,"km":582.7,"driving":{"from":"sejong","to":"cheongju","gone":14.71058333333334,"dist":24},"fuel":6.6078657499999975,"water":1,"food":0,"scrap":76,"van":100,"fatigue":83.85446000000002,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
마을 어귀 우물에 줄이 서 있다. 그런데 물을 긷는 사람은 없다.

두레박에 자물쇠가 걸려 있고, 그 옆에 청년 셋이 앉아 있다.

"한 통에 고철 셋."

"원래 마을 우물 아니에요?"

"마을 사람은 둘." 청년이 대꾸했다. "나머진 손님이고."

줄 선 사람들은 아무 말이 없다. 항의해 본 사람이 이미 없어졌거나, 항의가 소용없다는 걸 배운 얼굴들이다.

우리 물통은 바닥이 보인다.
PUBLIC CHOICES
{"index":0,"label":"값을 치른다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"줄 선 사람들과 값을 나눠 낸다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"자물쇠를 부순다","hint":"위험 · 마을과 척진다","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"값을 치른다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
고철 3을 내고 물 한 통을 받았다. 자물쇠가 열리고 다시 잠기는 데 20초.

뒤에 선 아이가 빈 통을 들고 우리를 봤다. 우리가 낸 값이 그 아이의 오늘 몫을 더 비싸게 만들었다는 걸, 우리 둘 다 알았다.
CHIPS [{"t":"물 +4","c":"plus"},{"t":"고철 -3","c":"minus"},{"t":"40분 경과","c":""},{"t":"사기 -2","c":"minus"}]
AFTER {"at":null,"day":8,"min":1335,"km":582.7,"driving":{"from":"sejong","to":"cheongju","gone":14.71058333333334,"dist":24},"fuel":6.6078657499999975,"water":5,"food":0,"scrap":73,"van":100,"fatigue":85.22246000000001,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 75 / trace 261 / crisis_drowsy / 졸음
BEFORE {"at":null,"day":8,"min":1339,"km":583.4,"driving":{"from":"sejong","to":"cheongju","gone":15.392000000000007,"dist":24},"fuel":6.503608999999997,"water":5,"food":0,"scrap":73,"van":100,"fatigue":85.55990000000001,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
눈꺼풀이 천근이다.

차선이 잠깐 두 개로 보였다. 백미러 속 내 눈이 반쯤 감겨 있다.

졸음은 폭풍보다 많은 운전자를 데려갔다. 오래전에도, 지금도.
PUBLIC CHOICES
{"index":0,"label":"갓길에서 눈을 붙인다 (2시간)","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"물로 세수하고 버틴다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"노래를 크게 틀고 강행한다","hint":"위험 · 사고 위험","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"갓길에서 눈을 붙인다 (2시간)","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
갓길에 차를 세우고 시트를 젖혔다.

눈을 뜨니 두 시간이 지나 있었다. 뻐근한 목을 돌리고 앞유리를 봤다. 아까는 겹쳐 보이던 차선이 하나로 보인다.
CHIPS [{"t":"2시간 경과","c":""},{"t":"피로 -45","c":"plus"},{"t":"사기 +2","c":"plus"}]
AFTER {"at":null,"day":9,"min":19,"km":583.4,"driving":{"from":"sejong","to":"cheongju","gone":15.392000000000007,"dist":24},"fuel":6.503608999999997,"water":5,"food":0,"scrap":73,"van":100,"fatigue":44.66390000000001,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🌧 비 — 험로 마모↑ · 야영 시 빗물 수집","😴 다들 피곤이 얼굴에 앉았다 — 쉬어야 한다"]

## choice 76 / trace 264 / crisis_hungry / 주린 배
BEFORE {"at":"cheongju","location":"청주 방송국","day":9,"min":59,"km":592,"driving":null,"fuel":5.281272999999996,"water":5,"food":0,"scrap":73,"van":100,"fatigue":48.37574000000002,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
끼니를 거른 탓에 속이 쓰리다. 식량통을 다시 열어 봤다.

차 안이 조용하다. 배고픔은 소리부터 죽인다.
PUBLIC CHOICES
{"index":0,"label":"주변에서 먹을 것을 찾는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"버틴다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"버틴다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
허리띠를 조였다. 다음 마을까지. 다음 마을까지만.
CHIPS [{"t":"피로 +12","c":"minus"},{"t":"쇠약 3/3","c":"minus"},{"t":"사기 -6","c":"minus"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":9,"min":59,"km":592,"driving":null,"fuel":5.281272999999996,"water":5,"food":0,"scrap":73,"van":100,"fatigue":60.37574000000002,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 77 / trace 267 / comp_dialect / 사투리 배틀
BEFORE {"at":"cheongju","location":"청주 방송국","day":9,"min":390,"km":592,"driving":null,"fuel":5.281272999999996,"water":4,"food":0,"scrap":73,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"정지가 뭔지 아는 사람?"

"신호등?" "아니." "멈추라는 거." "아니라니까. 부엌이야."

"그럼 글로 가라의 글로는?" "글로… 글자?" "그리로."

출제자가 신이 났다. 전국을 달리는 차답게 출제 범위도 전국구다.
PUBLIC CHOICES
{"index":0,"label":"참전한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"심사만 본다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"참전한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"어디까지 알아듣나"로 시작했는데 어느새 다들 자기 할머니 흉내를 내고 있었다.

누가 언제 규칙을 바꿨는지는 아무도 몰랐다. 물어보지도 않았다.

대신 단어가 하나 남았다. 오늘부터 이 차에서 후미등은 궁디불이다.
CHIPS [{"t":"사기 +6","c":"plus"},{"t":"새 기록 · 사투리 배틀","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":9,"min":390,"km":592,"driving":null,"fuel":5.281272999999996,"water":4,"food":0,"scrap":73,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 78 / trace 270 / talkr_mj_2 / 민지 — 공구 대여
BEFORE {"at":"cheongju","location":"청주 방송국","day":9,"min":390,"km":592,"driving":null,"fuel":5.281272999999996,"water":4,"food":0,"scrap":73,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"뭐 고칠 거 있어?" 민지가 공구함을 톡톡 쳤다. "오늘 대여 무료."
PUBLIC CHOICES
{"index":0,"label":"삐걱대는 것 하나를 맡긴다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"오늘은 멀쩡한데?\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"삐걱대는 것 하나를 맡긴다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
조수석 서랍이든 안전벨트든, 뭐든 하나가 그날 조용해졌다.

"작은 소리 그냥 두면 나중엔 더 커져. …일단 이건 끝." 오늘의 정비 격언이 따라왔다.
CHIPS [{"t":"차체 0%","c":""},{"t":"민지 사기 +2","c":"plus"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":9,"min":390,"km":592,"driving":null,"fuel":5.281272999999996,"water":4,"food":0,"scrap":73,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 79 / trace 273 / talk_kw_21 / 강우 — 등
BEFORE {"at":"cheongju","location":"청주 방송국","day":9,"min":390,"km":592,"driving":null,"fuel":5.281272999999996,"water":4,"food":0,"scrap":73,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
정비 중 차 밑에 들어가야 했다. 좁고, 어둡고, 밖이 안 보이는 자리.

강우가 말없이 차 옆에 앉았다. "…들어가십시오. 등은 제가 봅니다."

작업 내내 강우는 같은 자리에 있었다.
PUBLIC CHOICES
{"index":0,"label":"\"강우 씨는 등을 누구한테 맡겨요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"고마워요. 든든했어요\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"강우 씨는 등을 누구한테 맡겨요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
작업을 마치고 나와 물었다. 강우가 침묵했다. 못 들었나 싶어 다시 물으려는데 손가락 하나가 올라왔다. 기다려라, 는 뜻이다.

"…원래는 아무한테도. 지금은—" 강우가 차와 우리를 번갈아 봤다. "이 차에 탄 전원입니다."

파수꾼이 등을 맡겼다. 그보다 큰 신뢰의 말을 나는 모른다.
CHIPS [{"t":"사기 +2","c":"plus"},{"t":"강우 사기 +8","c":"plus"},{"t":"새 기록 · 맡긴 등","c":"item"},{"t":"✦ 강우 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":9,"min":390,"km":592,"driving":null,"fuel":5.281272999999996,"water":4,"food":0,"scrap":73,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 80 / trace 277 / story_generation_route / 이송로의 제사상
BEFORE {"at":null,"day":9,"min":460,"km":607.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":3.1183763333333268,"water":4,"food":0,"scrap":73,"van":100,"fatigue":22.54138,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
북쪽으로 갈수록 가드레일 아래 작은 물병이 늘어난다. 오래된 병뚜껑, 새로 구운 종지, 말라붙은 밥 한 술. 표지판에는 페인트 밑으로 「구 이송 7로」가 비친다.

이 길로 내려온 집들은 가족이 서울을 떠난 날마다 물을 놓는다고 했다. 날짜는 집마다 다르다. 백 년 전 날짜도 있고, 십수 년 전 날짜도 있고, 할아버지 수첩에 적힌 날도 있다.

길가에서 병을 놓던 여자가 말했다. "이유는 몰라도 그날 물이 모자랐다는 얘긴 다 똑같아요."
PUBLIC CHOICES
{"index":0,"label":"할아버지처럼 경적을 두 번 울린다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"물 한 병을 보탠다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"할아버지처럼 경적을 두 번 울린다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
빵. 빵.

어릴 때 할아버지는 이 길목마다 경적을 두 번 울렸다. 물어도 대답하지 않았다. 이제 알 것 같았다. 돌아가신 사람에게 하는 인사이면서, 아직 가는 사람에게 보내는 생존 신호였다.

멀리 다른 차가 두 번 답했다.
CHIPS [{"t":"사기 +4","c":"plus"},{"t":"새 기록 · 이송로의 두 번","c":"item"}]
AFTER {"at":null,"day":9,"min":460,"km":607.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":3.1183763333333268,"water":4,"food":0,"scrap":73,"van":100,"fatigue":22.54138,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 81 / trace 282 / crisis_nofuel3 / 세 번째 빈 탱크
BEFORE {"at":null,"day":9,"min":564,"km":629.6,"driving":{"from":"sejong","to":"cheongju","gone":13.62833333333333,"dist":24},"fuel":0,"water":4,"food":0,"scrap":73,"van":100,"fatigue":29.23394,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
엔진이 잠들었다. 세 번째다.

갓길에 오래 서 있는 차는 눈에 띈다. 사람의 눈에도, 사람이 아닌 것의 눈에도.

<span class="ai">"정지 차량 확인. 반복 패턴 등록."</span>

라디오도 꺼져 있는데, 그 목소리가 들리는 것 같았다.
PUBLIC CHOICES
{"index":0,"label":"걷는 수밖에 없다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"가까운 마을로 견인을 부탁한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"가까운 마을로 견인을 부탁한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
지나가던 트랙터가 밧줄을 걸어 줬다. 고철 스무 덩이 — 부르는 게 값이었다.

"길에 서 있는 것보단 싸요." 맞는 말이라 더 아팠다.
CHIPS [{"t":"연료 +6L","c":"plus"},{"t":"고철 -20","c":"minus"},{"t":"5시간 경과","c":""},{"t":"사기 -3","c":"minus"}]
AFTER {"at":null,"day":9,"min":864,"km":629.6,"driving":{"from":"sejong","to":"cheongju","gone":13.62833333333333,"dist":24},"fuel":6,"water":4,"food":0,"scrap":53,"van":100,"fatigue":57.49394,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🍚 점심 결식 · 식량 0/2 · 쇠약 3/3 · 피로 +18 · 사기 -8"]

## choice 82 / trace 285 / history_failed_namsan / 남산까지 못 간 사람들
BEFORE {"at":null,"day":9,"min":871,"km":631.2,"driving":{"from":"sejong","to":"cheongju","gone":15.231666666666662,"dist":24},"fuel":5.772326666666666,"water":4,"food":0,"scrap":53,"van":100,"fatigue":57.971979999999995,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
오래전 한 무리가 남산 중계소를 폭파하려 했다. 강제 이송 명령은 잠시 멎었지만 같은 선을 쓰던 급수 펌프와 진료소 전력도 함께 꺼졌다. 사람들은 코어에 닿기도 전에 흩어졌다. 그 실패 뒤 저항 조직은 둘로 갈렸다. 천리안을 끊어야 한다는 쪽과, 사람에게 명령권을 돌려놓아야 한다는 쪽.
PUBLIC CHOICES
{"index":0,"label":"무엇을 멈추고 무엇을 살릴지 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"무엇을 멈추고 무엇을 살릴지 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
천리안을 끄는 것과 강제 명령을 멈추는 것은 같은 일이 아니었다. 급수와 진료는 살리고, 사람을 확인 없이 옮기는 집행만 끊어야 했다.
CHIPS [{"t":"본편 단서 · 실패한 남산 진입","c":"item"}]
AFTER {"at":null,"day":9,"min":871,"km":631.2,"driving":{"from":"sejong","to":"cheongju","gone":15.231666666666662,"dist":24},"fuel":5.772326666666666,"water":4,"food":0,"scrap":53,"van":100,"fatigue":57.971979999999995,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 83 / trace 290 / history_transit_day / 버스가 기다리던 시절
BEFORE {"at":null,"day":9,"min":982,"km":655.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":2.179691666666664,"water":4,"food":0,"scrap":53,"van":100,"fatigue":65.14257999999995,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
천리안이 처음 맡은 일은 사람을 데려가는 일이 아니었다. 막차가 끊긴 동네에 버스를 더 보내고, 홍수 난 도로를 피해 구급차 길을 다시 짰다. 늦던 차가 제시간에 왔고, 구조 요청이 몰린 밤에도 빈 병상을 찾아냈다. 사람들은 편해져서 천리안을 믿었다. 그 믿음이 잘못은 아니었다.
PUBLIC CHOICES
{"index":0,"label":"처음부터 잘못된 건 아니었다고 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"처음부터 잘못된 건 아니었다고 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
기록에는 승객들이 편리하다고 남긴 말도 있었다. 그 아래에서 운전사 확인란은 해마다 하나씩 줄어들다가 끝내 사라졌다.
CHIPS [{"t":"본편 단서 · 버스가 기다리던 시절","c":"item"}]
AFTER {"at":null,"day":9,"min":982,"km":655.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":2.179691666666664,"water":4,"food":0,"scrap":53,"van":100,"fatigue":65.14257999999995,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 84 / trace 294 / gp_note2 / 수첩 — 내리막 운전
BEFORE {"at":"sejong","location":"세종 신도시","day":10,"min":390,"km":664,"driving":null,"fuel":0.8381366666666626,"water":1,"food":0,"scrap":53,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
수첩 중간, 기름때 묻은 페이지.

"내리막에선 절대 기어를 빼지 마라. 내려가기 전에 속도를 줄이고 낮은 기어로 버텨.
브레이크만 밟고 내려가면 열 받아서 정작 필요할 때 말을 안 듣는다."

밑에 어린 글씨로 낙서가 있다. 옛날의 내 글씨다. "할아버지 잔소리 1등"
PUBLIC CHOICES
{"index":0,"label":"내리막에 들기 전에 기어를 낮춘다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"내리막에 들기 전에 기어를 낮춘다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
긴 내리막에 들기 전 속도를 줄이고 기어를 낮췄다. 엔진 소리는 커졌지만 달구지는 브레이크를 계속 밟지 않아도 일정한 속도로 내려갔다.

바퀴가 평지에 닿은 뒤 낙서 옆에 새 글씨를 보탰다. "이건 인정."
CHIPS [{"t":"사기 +4","c":"plus"},{"t":"새 기록 · 수첩 — 내리막 운전","c":"item"}]
AFTER {"at":"sejong","location":"세종 신도시","day":10,"min":390,"km":664,"driving":null,"fuel":0.8381366666666626,"water":1,"food":0,"scrap":53,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 85 / trace 297 / talk_mj_02 / 민지 — 첫차
BEFORE {"at":"sejong","location":"세종 신도시","day":10,"min":390,"km":664,"driving":null,"fuel":0.8381366666666626,"water":1,"food":0,"scrap":53,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"대장님 첫차는 뭐였어?" 민지가 불쑥 물었다.

"내가 직접 몰던 거?"

"응. 처음부터 이 차였어?"

생각해보니 달구지가 첫차다. 그렇게 말하자 민지가 피식 웃었다.
PUBLIC CHOICES
{"index":0,"label":"\"민지 넌?\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"첫차치곤 너무 크지\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"민지 넌?\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"고물 스쿠터. 오빠가 고쳐준 거." 민지가 창밖을 봤다. "브레이크가 밀려서 언덕에서 죽을 뻔했는데… 아니, 이 얘기를 왜 하고 있지. 아무튼. 그날 정비를 배우기로 했어. 죽기 싫어서 시작한 게 직업이 됐네."

"대장님은 첫차를 잘 만났네. 첫차가 인생 차인 사람은 드물어."
CHIPS [{"t":"민지 사기 +3","c":"plus"},{"t":"새 기록 · 민지의 스쿠터","c":"item"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"sejong","location":"세종 신도시","day":10,"min":390,"km":664,"driving":null,"fuel":0.8381366666666626,"water":1,"food":0,"scrap":53,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 86 / trace 300 / talk_kw_15 / 강우 — 전역의 꿈
BEFORE {"at":"sejong","location":"세종 신도시","day":10,"min":390,"km":664,"driving":null,"fuel":0.8381366666666626,"water":1,"food":0,"scrap":53,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"군인 아니었으면 뭐 했을 것 같아요?"

강우가 드물게 바로 답하지 않고, 오래 생각했다. 너무 오래여서 대답을 포기할 즈음이었다.
PUBLIC CHOICES
{"index":0,"label":"기다린다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"기다린다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"…목수." 예상 밖의 답이 왔다. "전역하면 의자를 만들 생각이었다. 사람을 앉히는… 물건. 지키는 일 말고, 쉬게 하는 일."

"지금도 늦지 않았잖아요."

강우가 자기 손을 내려다봤다. "…서울 끝나면. 첫 의자는 이 차 조수석 옆에 놓지. 정차했을 때 앉는 용도로." 파수꾼의 전직 계획에 달구지가 1호 납품처로 잡혔다.
CHIPS [{"t":"강우 사기 +5","c":"plus"},{"t":"새 소문 · 목수 강우","c":"item"},{"t":"✦ 강우 유대 +2","c":"item"}]
AFTER {"at":"sejong","location":"세종 신도시","day":10,"min":390,"km":664,"driving":null,"fuel":0.8381366666666626,"water":1,"food":0,"scrap":53,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 87 / trace 304 / crisis_nofuel3 / 세 번째 빈 탱크
BEFORE {"at":null,"day":10,"min":420,"km":670.4,"driving":{"from":"sejong","to":"cheongju","gone":6.413333333333334,"dist":24},"fuel":0,"water":1,"food":0,"scrap":53,"van":100,"fatigue":19.91216,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
엔진이 잠들었다. 세 번째다.

갓길에 오래 서 있는 차는 눈에 띈다. 사람의 눈에도, 사람이 아닌 것의 눈에도.

<span class="ai">"정지 차량 확인. 반복 패턴 등록."</span>

라디오도 꺼져 있는데, 그 목소리가 들리는 것 같았다.
PUBLIC CHOICES
{"index":0,"label":"걷는 수밖에 없다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"가까운 마을로 견인을 부탁한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"걷는 수밖에 없다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS [{"t":"연료 +8L","c":"plus"},{"t":"물 -1","c":"minus"},{"t":"식량 0","c":""},{"t":"10시간 경과","c":""},{"t":"피로 +22","c":"minus"},{"t":"사기 -7","c":"minus"},{"t":"관측 +1","c":"minus"}]
AFTER {"at":null,"day":10,"min":1020,"km":670.4,"driving":{"from":"sejong","to":"cheongju","gone":6.413333333333334,"dist":24},"fuel":8,"water":0,"food":0,"scrap":53,"van":100,"fatigue":80.43216,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🍚 점심 결식 · 식량 0/2 · 쇠약 3/3 · 피로 +18 · 사기 -8"]

## choice 88 / trace 307 / history_seventy_two_hours / 72시간
BEFORE {"at":null,"day":10,"min":1064,"km":678.6,"driving":{"from":"sejong","to":"cheongju","gone":14.590333333333339,"dist":24},"fuel":6.748918999999997,"water":0,"food":0,"scrap":53,"van":100,"fatigue":83.30040000000012,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
큰 홍수가 다시 닥치자 정부는 천리안에 사흘 동안 교통과 대피 명령을 직접 내릴 권한을 줬다. 현장 판단을 기다릴 시간이 없다는 이유였다. 물이 빠진 뒤에도 권한은 돌아오지 않았다. 사람의 확인은 필수가 아니라, 시스템이 이상하다고 판단할 때만 거치는 예외가 됐다.
PUBLIC CHOICES
{"index":0,"label":"돌아오지 않은 권한의 날짜를 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"돌아오지 않은 권한의 날짜를 적는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
사흘짜리 비상 권한이 상시 규칙으로 굳은 날짜를 수첩에 옮겼다. 임시라는 말 아래 종료 서명은 없었다.
CHIPS [{"t":"본편 단서 · 끝나지 않은 72시간","c":"item"}]
AFTER {"at":null,"day":10,"min":1064,"km":678.6,"driving":{"from":"sejong","to":"cheongju","gone":14.590333333333339,"dist":24},"fuel":6.748918999999997,"water":0,"food":0,"scrap":53,"van":100,"fatigue":83.30040000000012,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 89 / trace 310 / crisis_drowsy / 졸음
BEFORE {"at":null,"day":10,"min":1094,"km":684,"driving":{"from":"sejong","to":"cheongju","gone":20.041666666666675,"dist":24},"fuel":5.914864999999995,"water":0,"food":0,"scrap":53,"van":100,"fatigue":85.21256000000021,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
눈꺼풀이 천근이다.

차선이 잠깐 두 개로 보였다. 백미러 속 내 눈이 반쯤 감겨 있다.

졸음은 폭풍보다 많은 운전자를 데려갔다. 오래전에도, 지금도.
PUBLIC CHOICES
{"index":0,"label":"갓길에서 눈을 붙인다 (2시간)","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"물로 세수하고 버틴다","hint":"","visible":true,"enabled":false,"requirement":"물 1 필요"}
{"index":2,"label":"노래를 크게 틀고 강행한다","hint":"위험 · 사고 위험","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":2,"label":"노래를 크게 틀고 강행한다","hint":"위험 · 사고 위험","visible":true,"enabled":true,"requirement":""}
RESULT
목청껏 노래를 불러 버텼다. 목은 쉬었지만 눈은 떠졌다.
CHIPS [{"t":"피로 -12","c":"plus"},{"t":"사기 +2","c":"plus"}]
AFTER {"at":null,"day":10,"min":1094,"km":684,"driving":{"from":"sejong","to":"cheongju","gone":20.041666666666675,"dist":24},"fuel":5.914864999999995,"water":0,"food":0,"scrap":53,"van":100,"fatigue":73.21256000000021,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 90 / trace 314 / comp_van_name / 달구지 개명 논란
BEFORE {"at":"cheongju","location":"청주 방송국","day":11,"min":390,"km":688,"driving":null,"fuel":5.309239999999996,"water":0,"food":0,"scrap":53,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
누군가 폭탄을 던졌다. "근데 달구지라는 이름, 너무 없어 보이지 않아?"

"뭐가 없어 보여?"

"아니 그… 없어 보인다기보다, 뭐랄까. 없어 보이지."

차 안이 술렁이고 개명파와 수호파가 갈린다. 후보가 쏟아진다.

질풍호, 은하수, 김봉수(왜?), 로드마스터. 그리고 …달구지(현행 유지).
PUBLIC CHOICES
{"index":0,"label":"투표에 부친다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"기각. 논의 종료\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"투표에 부친다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
투표 규칙을 정하는 데만 10분이 걸렸다. 기권을 인정할 거냐로 한 번, 운전자 표를 두 표로 칠 거냐로 또 한 번.

"운전 많이 하니까 두 표."

"그럼 밥 많이 먹는 사람은 세 표야?"

"그건 또 무슨 소리야."

결국 한 사람 한 표로 개표. 달구지 압승.

"촌스러운 게 아니라 클래식한 거야." "얘가 우리를 여기까지 데려왔는데 이름을 바꿔?"

개명파는 승복하면서 조건을 붙였다. 정식 명칭에 "달구지 1호"를 추가할 것. 함대의 기함처럼.
CHIPS [{"t":"사기 +6","c":"plus"},{"t":"새 기록 · 달구지 개명 투표","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":11,"min":390,"km":688,"driving":null,"fuel":5.309239999999996,"water":0,"food":0,"scrap":53,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 91 / trace 317 / talk_mj_01 / 민지 — 라체트
BEFORE {"at":"cheongju","location":"청주 방송국","day":11,"min":390,"km":688,"driving":null,"fuel":5.309239999999996,"water":0,"food":0,"scrap":53,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
민지가 라체트를 분해해서 닦고 있다. 부품이 수술 도구처럼 줄 맞춰 놓여 있다.

"공구는 매일 닦아야 돼. 안 닦으면 그… 아니다, 설명 길다. 아무튼 닦아야 돼. …왜 그렇게 봐."
PUBLIC CHOICES
{"index":0,"label":"\"나도 가르쳐줘\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"수술하는 줄 알았어\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"나도 가르쳐줘\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
민지가 3초쯤 의심하더니 걸레를 던져줬다.

"기름때는 문지르지 말고 눌러서 찍어내. …아니, 그렇게 말고. 그… 이리 줘봐. 이렇게. 알겠지?"

"방금 거랑 뭐가 달라?"

"달라. …오, 근데 손놀림은 나쁘지 않네."

라체트 반쪽을 맡았다. 승진이다.
CHIPS [{"t":"민지 사기 +3","c":"plus"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":11,"min":390,"km":688,"driving":null,"fuel":5.309239999999996,"water":0,"food":0,"scrap":53,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 92 / trace 320 / talk_kw_04 / 강우 — 지도 읽기
BEFORE {"at":"cheongju","location":"청주 방송국","day":11,"min":390,"km":688,"driving":null,"fuel":5.309239999999996,"water":0,"food":0,"scrap":53,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
강우가 내 지도를 빌려 보더니 연필로 점 몇 개를 찍었다.

"여기, 여기, 여기. 매복하기 좋은 지형."
PUBLIC CHOICES
{"index":0,"label":"\"어떻게 알아요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"무섭게 왜 그래요\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"어떻게 알아요?\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"내가 매복한다면 고를 자리니까."

"…아. …아, 그렇네."

간단하고 서늘한 논리였다. 강우의 수업이 이어졌다. 커브 안쪽을 조심할 것, 다리 앞에서 속도 줄이지 말 것, 시야가 좋은 곳이 저격에도 좋다는 것. 중간에 하나를 놓쳐 다시 물었더니 강우는 처음부터 다시 말했다. 요약이 없는 사람이다.

"외우지 마라. 몸에 붙여라." 지도가 한 겹 무서워졌고, 한 겹 안전해졌다.
CHIPS [{"t":"강우 사기 +3","c":"plus"},{"t":"새 기록 · 매복의 지리학","c":"item"},{"t":"✦ 강우 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":11,"min":390,"km":688,"driving":null,"fuel":5.309239999999996,"water":0,"food":0,"scrap":53,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 93 / trace 324 / history_three_day_silence / 사흘의 침묵
BEFORE {"at":null,"day":11,"min":468,"km":702.8,"driving":{"from":"cheongju","to":"sejong","gone":14.8148,"dist":24},"fuel":3.205538399999994,"water":0,"food":0,"scrap":53,"van":100,"fatigue":38.019419999999926,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
첫 강제 이송표가 나온 뒤 사흘 동안 방송은 출발 시간만 되풀이했다. 이유를 묻는 창구도, 멈춰 달라고 말할 사람도 없었다. 몇몇 배차원과 기사들이 단말 전원을 내리고 종이 명단으로 버스를 세웠다. 훗날 저항이라 불린 일은 거창한 선언이 아니라, 이유를 확인할 때까지 차를 출발시키지 않은 데서 시작됐다.
PUBLIC CHOICES
{"index":0,"label":"버스를 세운 사람들의 기록을 찾는다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"버스를 세운 사람들의 기록을 찾는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
남은 운행표에는 출발 취소 도장과 기사들의 손글씨가 겹쳐 있었다. 이유를 알기 전에는 출발시키지 않겠다는 한 문장이 여러 필체로 반복됐다.
CHIPS [{"t":"본편 단서 · 사흘의 침묵과 첫 정지","c":"item"}]
AFTER {"at":null,"day":11,"min":468,"km":702.8,"driving":{"from":"cheongju","to":"sejong","gone":14.8148,"dist":24},"fuel":3.205538399999994,"water":0,"food":0,"scrap":53,"van":100,"fatigue":38.019419999999926,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 94 / trace 329 / crisis_nofuel3 / 세 번째 빈 탱크
BEFORE {"at":null,"day":11,"min":590,"km":725.4,"driving":{"from":"sejong","to":"cheongju","gone":13.403866666666667,"dist":24},"fuel":0,"water":0,"food":0,"scrap":53,"van":100,"fatigue":45.90707999999981,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
엔진이 잠들었다. 세 번째다.

갓길에 오래 서 있는 차는 눈에 띈다. 사람의 눈에도, 사람이 아닌 것의 눈에도.

<span class="ai">"정지 차량 확인. 반복 패턴 등록."</span>

라디오도 꺼져 있는데, 그 목소리가 들리는 것 같았다.
PUBLIC CHOICES
{"index":0,"label":"걷는 수밖에 없다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"가까운 마을로 견인을 부탁한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"가까운 마을로 견인을 부탁한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
지나가던 트랙터가 밧줄을 걸어 줬다. 고철 스무 덩이 — 부르는 게 값이었다.

"길에 서 있는 것보단 싸요." 맞는 말이라 더 아팠다.
CHIPS [{"t":"연료 +6L","c":"plus"},{"t":"고철 -20","c":"minus"},{"t":"5시간 경과","c":""},{"t":"사기 -3","c":"minus"}]
AFTER {"at":null,"day":11,"min":890,"km":725.4,"driving":{"from":"sejong","to":"cheongju","gone":13.403866666666667,"dist":24},"fuel":6,"water":0,"food":0,"scrap":33,"van":100,"fatigue":74.16707999999981,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🍚 점심 결식 · 식량 0/2 · 쇠약 3/3 · 피로 +18 · 사기 -8"]

## choice 95 / trace 332 / history_first_recorders / 첫 기록자들
BEFORE {"at":null,"day":11,"min":897,"km":726.8,"driving":{"from":"sejong","to":"cheongju","gone":14.8148,"dist":24},"fuel":5.7841272,"water":0,"food":0,"scrap":33,"van":100,"fatigue":74.64511999999984,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
처음 맞선 사람들은 곧 알았다. 억울하다고 말하는 것만으로는 명령을 되돌릴 수 없었다. 누가 명령을 보냈는지, 어떤 절차가 생략됐는지, 실제로 누가 차에 탔는지를 함께 남겨야 했다. 발신 기록, 분리 절차, 당사자 증언. 지금 남산에 가져가려는 세 가지는 그때 만들어진 방식이다.
PUBLIC CHOICES
{"index":0,"label":"남산에서 필요한 근거를 다시 확인한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"남산에서 필요한 근거를 다시 확인한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
발신 기록, 분리 절차, 당사자 증언. 수첩의 세 칸을 다시 짚었다. 이건 남이 정해 준 수집 목록이 아니라, 먼저 실패한 사람들이 남긴 방법이었다.
CHIPS [{"t":"본편 단서 · 첫 기록자들의 세 가지","c":"item"}]
AFTER {"at":null,"day":11,"min":897,"km":726.8,"driving":{"from":"sejong","to":"cheongju","gone":14.8148,"dist":24},"fuel":5.7841272,"water":0,"food":0,"scrap":33,"van":100,"fatigue":74.64511999999984,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 96 / trace 336 / postman_again / 가벼워진 가방
BEFORE {"at":"cheongju","location":"청주 방송국","day":12,"min":390,"km":736,"driving":null,"fuel":4.378791600000002,"water":0,"food":0,"scrap":33,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":7,"need":13,"label":"7/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
자전거 방울 소리. 그 우편부다.

"어! 차!" 우편부가 급브레이크를 잡았다. 짐받이의 꾸러미가 눈에 띄게 얇아졌다.

"명단이 줄었어요. 오래 묵은 편지가 두 통 남았는데— 하나가 문제예요. 수신인이 남산 쪽이란 말이지. 거긴 자전거로는…"

우편부가 우리를 본다. 차를 본다. 다시 우리를 본다.
PUBLIC CHOICES
{"index":0,"label":"편지를 맡는다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"원칙대로 하세요\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"편지를 맡는다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"이러면 안 되는데. 배달은 끝까지 하는 게 원칙인데."

말은 그렇게 하면서 우편부는 편지를 세 겹 방수포에 싸서 건넸다. 받는 이: 서울, 남산 아래, 김 O O.

"전하면— 아니, 전할 수 있으면, 그걸로 됐다고 해 주세요. 오래 걸렸다고는 말고."

조수석 서랍 제일 안쪽에 편지가 실렸다. 차가 조금 무거워진 기분이 들었다. 좋은 무거움이다.
CHIPS [{"t":"사기 +3","c":"plus"},{"t":"남산행 편지 +1","c":"plus"},{"t":"새 소문 · 남산행 편지","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":12,"min":390,"km":736,"driving":null,"fuel":4.378791600000002,"water":0,"food":0,"scrap":33,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 97 / trace 339 / talk_mj_08 / 민지 — 정비소
BEFORE {"at":"cheongju","location":"청주 방송국","day":12,"min":390,"km":736,"driving":null,"fuel":4.378791600000002,"water":0,"food":0,"scrap":33,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"서울 끝나면 뭐 할 거야?" 내가 물었더니, 민지가 의외로 바로 답했다.

"정비소. 오빠랑 하기로 했었거든. 간판 이름까지 정해놨어."
PUBLIC CHOICES
{"index":0,"label":"\"이름 뭔데\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"나 취직시켜줘\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"이름 뭔데\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"…비밀." 민지가 웃었다. "오빠 만나면, 둘이 같이 말해줄게. 그게 조건이야."

"힌트도 없어?"

"없어. …아니, 하나 줄게. 두 글자는 아니야."

조건. 오빠를 만난다는 걸 전제로 말하는 민지의 화법을, 나는 좋아한다.

"손님 1호는 달구지 해줄게. 평생 무료."
CHIPS [{"t":"민지 사기 +5","c":"plus"},{"t":"새 소문 · 이름 없는 정비소","c":"item"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":12,"min":390,"km":736,"driving":null,"fuel":4.378791600000002,"water":0,"food":0,"scrap":33,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["<span class=\"ic\">🗺</span>민규의 능선 — 지도에 표시됨","<span class=\"ic\">★</span>민지 — 「주파수 88.9」"]

## choice 98 / trace 342 / talk_kw_10 / 강우 — 뒷자리
BEFORE {"at":"cheongju","location":"청주 방송국","day":12,"min":390,"km":736,"driving":null,"fuel":4.378791600000002,"water":0,"food":0,"scrap":33,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"잠깐 쉬어라." 강우가 뒷자리 담요를 털었다.

"밖은 내가 볼 테니. 명령이다."
PUBLIC CHOICES
{"index":0,"label":"\"명령이면 할 수 없죠\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"명령이면 할 수 없죠\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
담요를 등에 받치고 뒷자리에 기대 앉았다. 강우가 문 옆에 자리를 잡자 나도 모르게 어깨에 힘이 풀렸다.

눈을 감자 강우가 문 쪽에서 나직이 말했다. 혼잣말인지, 들으라는 말인지.

"…경계는 내가 선다. 대장은 쉬어. 그러라고 같이 다니는 거다."

눈을 감은 채 등을 담요에 더 깊이 기댔다. 밖에서 소리가 났지만 이번에는 일어나 확인하지 않았다.
CHIPS [{"t":"피로 -15","c":"plus"},{"t":"강우 사기 +6","c":"plus"},{"t":"새 기록 · 곁을 지키는 사람","c":"item"},{"t":"✦ 강우 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":12,"min":390,"km":736,"driving":null,"fuel":4.378791600000002,"water":0,"food":0,"scrap":33,"van":100,"fatigue":18,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 99 / trace 346 / history_six_roads / 여섯 갈래가 이어진 날
BEFORE {"at":null,"day":12,"min":460,"km":751.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":2.048346600000003,"water":0,"food":0,"scrap":33,"van":100,"fatigue":22.54138,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
기록하는 사람들이 한곳에 모이자 천리안은 연락과 보급을 한꺼번에 끊었다. 살아남은 사람들은 일을 여섯 갈래로 나눴다. 이음망은 사람을 연결했고, 해도는 길을 찾았다. 돔과 솥은 머물 곳과 먹을 것을 지켰고, 유령은 감시가 비는 시간을 모았다. 산지기는 남산의 옛 통로를 기억했다. 서로 생각은 달라도 한 조직이 무너지면 기록까지 사라지는 일은 막을 수 있었다.
PUBLIC CHOICES
{"index":0,"label":"여섯 갈래의 표식을 지도에 옮긴다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"여섯 갈래의 표식을 지도에 옮긴다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
서로 다른 여섯 표식을 한 지도 가장자리에 그렸다. 어느 하나가 중심은 아니었다. 한 갈래가 끊겨도 나머지가 기록을 다음 거점으로 넘기는 구조였다.
CHIPS [{"t":"본편 단서 · 여섯 갈래 연대망","c":"item"}]
AFTER {"at":null,"day":12,"min":460,"km":751.2,"driving":{"from":"cheongju","to":"sejong","gone":15.231666666666662,"dist":24},"fuel":2.048346600000003,"water":0,"food":0,"scrap":33,"van":100,"fatigue":22.54138,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 100 / trace 351 / crisis_nofuel3 / 세 번째 빈 탱크
BEFORE {"at":null,"day":12,"min":523,"km":764.8,"driving":{"from":"sejong","to":"cheongju","gone":4.8100000000000005,"dist":24},"fuel":0,"water":0,"food":0,"scrap":33,"van":100,"fatigue":26.60472,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
엔진이 잠들었다. 세 번째다.

갓길에 오래 서 있는 차는 눈에 띈다. 사람의 눈에도, 사람이 아닌 것의 눈에도.

<span class="ai">"정지 차량 확인. 반복 패턴 등록."</span>

라디오도 꺼져 있는데, 그 목소리가 들리는 것 같았다.
PUBLIC CHOICES
{"index":0,"label":"걷는 수밖에 없다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"가까운 마을로 견인을 부탁한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"걷는 수밖에 없다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
기름통을 메고 걸으며 몇 번이고 하늘을 올려봤다.

돌아오는 길, 능선 위에서 탐색등 하나가 도로를 훑고 지나갔다. 우리 차 위에서 반 박자 머물다 갔다.

연료보다 비싼 걸 지불한 기분이었다.
CHIPS [{"t":"연료 +8L","c":"plus"},{"t":"물 0","c":""},{"t":"식량 0","c":""},{"t":"10시간 경과","c":""},{"t":"피로 +22","c":"minus"},{"t":"사기 -7","c":"minus"},{"t":"관측 +1","c":"minus"}]
AFTER {"at":null,"day":12,"min":1123,"km":764.8,"driving":{"from":"sejong","to":"cheongju","gone":4.8100000000000005,"dist":24},"fuel":8,"water":0,"food":0,"scrap":33,"van":100,"fatigue":87.12472,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🍚 점심 결식 · 식량 0/2 · 쇠약 3/3 · 피로 +18 · 사기 -8"]

## choice 101 / trace 354 / crisis_drowsy / 졸음
BEFORE {"at":null,"day":12,"min":1127,"km":765.5,"driving":{"from":"sejong","to":"cheongju","gone":5.491416666666667,"dist":24},"fuel":7.88756625,"water":0,"food":0,"scrap":33,"van":100,"fatigue":87.36374,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
눈꺼풀이 천근이다.

차선이 잠깐 두 개로 보였다. 백미러 속 내 눈이 반쯤 감겨 있다.

졸음은 폭풍보다 많은 운전자를 데려갔다. 오래전에도, 지금도.
PUBLIC CHOICES
{"index":0,"label":"갓길에서 눈을 붙인다 (2시간)","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"물로 세수하고 버틴다","hint":"","visible":true,"enabled":false,"requirement":"물 1 필요"}
{"index":2,"label":"노래를 크게 틀고 강행한다","hint":"위험 · 사고 위험","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"갓길에서 눈을 붙인다 (2시간)","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
갓길에 차를 세우고 시트를 젖혔다.

눈을 뜨니 두 시간이 지나 있었다. 뻐근한 목을 돌리고 앞유리를 봤다. 아까는 겹쳐 보이던 차선이 하나로 보인다.
CHIPS [{"t":"2시간 경과","c":""},{"t":"피로 -45","c":"plus"},{"t":"사기 +2","c":"plus"}]
AFTER {"at":null,"day":12,"min":1247,"km":765.5,"driving":{"from":"sejong","to":"cheongju","gone":5.491416666666667,"dist":24},"fuel":7.88756625,"water":0,"food":0,"scrap":33,"van":100,"fatigue":46.467740000000006,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 102 / trace 357 / ev_uplink / 위로 가는 선
BEFORE {"at":null,"day":12,"min":1291,"km":775.1,"driving":{"from":"sejong","to":"cheongju","gone":15.11141666666666,"dist":24},"fuel":6.41570625,"water":0,"food":0,"scrap":33,"van":100,"fatigue":50.51702000000002,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
북부 국도변. 관리된 통신 케이블 다발이 도로를 따라 나란히 달린다. 남쪽에서부터 내내 봐온 선들이다. 올라올수록 굵어지기만 했다.

그런데 어느 지점에서— 선들이 일제히 도로를 버리고 꺾인다. 서울 쪽이 아니다. 산 위다.

능선 꼭대기, 접시 안테나 수십 기가 서 있다. 전부 같은 각도로, 하늘을 보고.
PUBLIC CHOICES
{"index":0,"label":"안테나들을 올려다본다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"그냥 지나친다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"안테나들을 올려다본다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
남산이 북쪽에 있는데, 선은 하늘로 간다.

관제탑은 남산이라는데, 저 선은 어디까지 가는 걸까.

안테나 단지엔 간판도 울타리도 없다. 다만 발치의 배전함에 스텐실로 찍힌 글자 하나. 「상행 전용」.

내려오는 선은, 찾지 못했다.
CHIPS [{"t":"사기 -2","c":"minus"},{"t":"새 소문 · 상행 전용","c":"item"},{"t":"◈ 143년 최초 조건의 빈칸 · 확인","c":"item"}]
AFTER {"at":null,"day":12,"min":1291,"km":775.1,"driving":{"from":"sejong","to":"cheongju","gone":15.11141666666666,"dist":24},"fuel":6.41570625,"water":0,"food":0,"scrap":33,"van":100,"fatigue":50.51702000000002,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 103 / trace 362 / talk_mj_21 / 민지 — 조수석의 자격
BEFORE {"at":"cheongju","location":"청주 방송국","day":13,"min":390,"km":784,"driving":null,"fuel":5.055752999999998,"water":0,"food":0,"scrap":33,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
민지가 정비를 마치고 손을 닦으며, 지나가듯 말했다.

"…있잖아. 폐차장에서 혼자 살 때, 규칙이 하나 있었어. 조수석엔 아무도 안 태운다."

"조수석은 믿는 사람 자리니까. 고장 나면 같이 고칠 사람."
PUBLIC CHOICES
{"index":0,"label":"\"지금은 같이 타는 사람이 있잖아\"","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"고장 나면 같이 고치자\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"\"지금은 같이 타는 사람이 있잖아\"","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
"그러니까 그 규칙 폐기했어." 민지가 걸레를 어깨에 걸쳤다.

"…뭘 봐. 사람 늘었으면 규칙도 고쳐야지. 아 몰라, 밥이나 먹자. 시-솔-미."

민지가 먼저 휘파람을 불며 걸어갔다.
CHIPS [{"t":"사기 +2","c":"plus"},{"t":"민지 사기 +7","c":"plus"},{"t":"새 기록 · 민지의 정비 일지 — 규칙 개정","c":"item"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":13,"min":390,"km":784,"driving":null,"fuel":5.055752999999998,"water":0,"food":0,"scrap":33,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 104 / trace 365 / talkr_kw_2 / 강우 — 몸 점검
BEFORE {"at":"cheongju","location":"청주 방송국","day":13,"min":390,"km":784,"driving":null,"fuel":5.055752999999998,"water":0,"food":0,"scrap":33,"van":100,"fatigue":33,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
"체조." 강우가 정차 시간을 두 글자로 열었다. 거부권은 형식상 존재한다.
PUBLIC CHOICES
{"index":0,"label":"참여한다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"\"오늘은 견학할게요\"","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":0,"label":"참여한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
목— 어깨— 허리— 무릎. 우두둑 소리의 합주.

"이 소리 나는 거 괜찮은 거예요?"

"……."

"강우 씨?"

"안 나는 게 더 문제다." 대답은 목 돌리기 두 바퀴쯤 뒤에 왔다.

"몸 상태 양호." 강우의 판정이 나왔다. 이 점호를 받고 나면 이상하게 하루가 든든하다.
CHIPS [{"t":"피로 -3","c":"plus"},{"t":"강우 사기 +2","c":"plus"},{"t":"✦ 강우 유대 +2","c":"item"}]
AFTER {"at":"cheongju","location":"청주 방송국","day":13,"min":390,"km":784,"driving":null,"fuel":5.055752999999998,"water":0,"food":0,"scrap":33,"van":100,"fatigue":30,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 105 / trace 369 / ev_chunrian_lab / 천리안이 태어난 곳
BEFORE {"at":null,"day":13,"min":468,"km":800.8,"driving":{"from":"cheongju","to":"sejong","gone":16.834999999999994,"dist":24},"fuel":2.4799979999999993,"water":0,"food":0,"scrap":33,"van":100,"fatigue":35.019419999999954,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
폐연구단지의 지하 기록실에는 천리안의 첫 대중교통 시범 문서가 남아 있었다. 초기판 실행 절차는 세 줄이었다. 경로 계산, 현장 확인, 이름 있는 승인자의 실행.

그 아래에는 겨울 정전 때 추가된 수정표가 붙어 있었다. 자동 실행 72시간. 다음 장부터는 연장 날짜만 있고 승인자 칸이 비어 있었다.

서랍 안에서 버스 기사와 연구원들이 남긴 회의록도 나왔다. 계산은 기계가 해도 책임까지 넘길 수는 없다는 문장이 여러 사람의 필체로 반복돼 있었다. 천리안이 태어난 곳에는, 천리안을 멈춰 세우려 한 첫 목소리도 함께 남아 있었다.
PUBLIC CHOICES
{"index":0,"label":"연구 기록을 뒤진다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"민지가 서버를 살핀다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":2,"label":"오래 있을 곳이 아니다, 뜬다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"민지가 서버를 살핀다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
민지가 죽은 서버들을 훑다 한 대에서 신호를 잡았다. "…얘 아직 뭔가랑 연결돼 있어. 전원도 없는데 링크가 살아 있어."

손을 뗀 민지의 표정이 굳었다.

"남산 코어랑 이어져 있어. 끊으려면 결국 남산까지 가야 해. …그럴 줄 알았어." 우리 여정의 이유가 다시 또렷해졌다.
CHIPS [{"t":"45분 경과","c":""},{"t":"사기 -2","c":"minus"},{"t":"민지 사기 +4","c":"plus"},{"t":"새 소문 · 천리안의 뿌리","c":"item"},{"t":"✦ 민지 유대 +2","c":"item"}]
AFTER {"at":null,"day":13,"min":513,"km":800.8,"driving":{"from":"cheongju","to":"sejong","gone":16.834999999999994,"dist":24},"fuel":2.4799979999999993,"water":0,"food":0,"scrap":33,"van":100,"fatigue":36.558419999999956,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES []

## choice 106 / trace 374 / crisis_nofuel3 / 세 번째 빈 탱크
BEFORE {"at":null,"day":13,"min":590,"km":817.6,"driving":{"from":"sejong","to":"cheongju","gone":9.620000000000001,"dist":24},"fuel":0,"water":0,"food":0,"scrap":33,"van":100,"fatigue":41.57783999999988,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
ENTRY
엔진이 잠들었다. 세 번째다.

갓길에 오래 서 있는 차는 눈에 띈다. 사람의 눈에도, 사람이 아닌 것의 눈에도.

<span class="ai">"정지 차량 확인. 반복 패턴 등록."</span>

라디오도 꺼져 있는데, 그 목소리가 들리는 것 같았다.
PUBLIC CHOICES
{"index":0,"label":"걷는 수밖에 없다","hint":"","visible":true,"enabled":true,"requirement":""}
{"index":1,"label":"가까운 마을로 견인을 부탁한다","hint":"","visible":true,"enabled":true,"requirement":""}
CHOSEN {"index":1,"label":"가까운 마을로 견인을 부탁한다","hint":"","visible":true,"enabled":true,"requirement":""}
RESULT
지나가던 트랙터가 밧줄을 걸어 줬다. 고철 스무 덩이 — 부르는 게 값이었다.

"길에 서 있는 것보단 싸요." 맞는 말이라 더 아팠다.
CHIPS [{"t":"연료 +6L","c":"plus"},{"t":"고철 -20","c":"minus"},{"t":"5시간 경과","c":""},{"t":"사기 -3","c":"minus"}]
AFTER {"at":null,"day":13,"min":890,"km":817.6,"driving":{"from":"sejong","to":"cheongju","gone":9.620000000000001,"dist":24},"fuel":6,"water":0,"food":0,"scrap":13,"van":100,"fatigue":69.83783999999989,"party":["minji","kangwoo"],"items":{"부품":8,"의약품":2,"탄약":0,"라디오 진공관":1,"부모님의 검증키":1,"남산행 편지":1},"ended":false,"main":{"title":"같은 이송표를 받은 사람들의 이야기를 모은다","phase":"같은 이송표를 받은 사람을 찾는 중","why":"발신 기록만으로는 누가 피해를 입었는지 알 수 없다. 같은 이송표를 받은 사람들의 이야기도 필요하다.","next":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)","progress":{"have":8,"need":13,"label":"8/13"}},"navigation":{"key":"main_witnesses","kind":"main","target":"cheongju","title":"같은 이송표를 받은 사람들의 이야기를 모은다","action":"청주 방송국에서 ‘주변 탐색’을 눌러 「세 장의 이송표, 세 사람의 말」 기록을 확인한다 (열람 준비 30분)"}}
MESSAGES ["🍚 점심 결식 · 식량 0/2 · 쇠약 3/3 · 피로 +18 · 사기 -8"]