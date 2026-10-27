
Action1 normal-save-branch-load  D36 390 resources f/w/fu/scrap 0/22/32.480875733335594/2 []

#3 bori_tag daejeon D36 390→390 party=['leo', 'parkss']
[narration /] 보리 털을 빗겨주다가 목덜미 털 깊숙이에서 짤랑— 하는 걸 찾았다.
[narration /] 작은 인식표. 뒤집으니 이름이 새겨져 있다.
[narration /] 「탄이 — 광양시 OO길. 우리 가족입니다」
[narration /] 보리가 아니다. 탄이다. 보리에게 우리가 모르는 이름이 있었다.
CHOICES [(0, '레오를 본다', True), (1, '주소를 지도에서 찾아본다', True)] PICK 1
[narration /] 광양. 우리 경로에서 벗어난 남쪽 항구다.
[narration /] 인식표를 손에 쥐고 보리를 봤다. 보리는 인식표엔 관심이 없고 빗질 중단에만 항의했다.
[narration /] 언젠가 남쪽에 다시 갈 일이 있으면 들러 볼까. 보리는 대답 대신 빗에 코를 들이밀었다.

Action5 explore  D36 510 resources f/w/fu/scrap 0/22/32.480875733335594/2 []

#7 bori_family daejeon D36 510→510 party=['leo', 'parkss']
[narration /] 정착지 장터에서 보리가 갑자기 꼬리가 부러져라 흔들며 어떤 남자에게 돌진했다.
[narration /] 남자가 보리를 보고 얼어붙었다.
[광양 이웃 /passer_man] …탄이? 야, 탄이 맞지? 광양 김씨네 탄이!
[narration /] 남자는 광양에서 피난 온 이웃이었다.
CHOICES [(0, '가족 소식을 묻는다', True)] PICK 0
[광양 이웃 /passer_man] 김씨네는 그날 배 타고 섬으로 갔어. 무사히. 탄이만 항구에서 놓쳤지. 배가 개는 안 된다고 해서— 김씨 막내가 사흘을 울었어.
[narration /] 남자가 보리를 부볐다.
[광양 이웃 /passer_man] 살아 있었구나, 너.
[상혁 /me] 저희는 보리라고 부르는데요.
[광양 이웃 /passer_man] 보리?
[narration /] 남자가 잠깐 어리둥절해했다.
[광양 이웃 /passer_man] …뭐. 대답하면 그것도 이름이지.
[상혁 /me] 섬이 어딘지 아세요?
[광양 이웃 /passer_man] 몰라. 남쪽 어디겠지. …근데 얘 지금 행복해 보이는데?
[narration /] 남자가 나와 보리를 번갈아 봤다.
[광양 이웃 /passer_man] 잘 있다고 전해줄 방법이 생기면, 전해줄게. 차 타고 북쪽 갔다고. 식구 생겼다고.
[narration /] 보리는 남자의 손에 코를 비비며 꼬리를 흔들었다. 차 문을 열자 먼저 뛰어올라 밥그릇부터 확인했다. 레오는 인식표를 한 번 만지고 뒤따라 탔다.

Action9 talk  D36 510 resources f/w/fu/scrap 0/22/32.480875733335594/2 []

#11 talk_bori_03 daejeon D36 510→510 party=['leo', 'parkss']
[narration /] 보리가 나를 보고 세 번 짖었다. 처음 있는 일이다.
[레오 /leo] 통역해드릴까요?
[narration /] 레오가 끼어들었다.
[레오 /leo] 저 보리어 전공이에요.
[상혁 /me] 전공?
[레오 /leo] 경력 여러 해요. 자격증은 없고요.
CHOICES [(0, '"통역해줘요"', True)] PICK 0
[레오 /leo] 첫 번째 짖음은 '너', 두 번째는 '냄새가', 세 번째는 '맘에 들어'예요.
[상혁 /me] …그걸 어떻게 알아요?
[레오 /leo] 꼬리 각도요. 45도 이상이면 호의예요.
[상혁 /me] 45도는 누가 정한 거예요?
[레오 /leo] …그건 좀 있다 설명할게요.
[narration /] 설명은 끝내 없었다. 대신 보리 꼬리가 확실히 45도 이상이었다. 공인 통역에 따르면, 나는 오늘 보리에게 정식 승인을 받았다.

Action13 travel cheongju D36 510 resources f/w/fu/scrap 0/22/32.480875733335594/2 []

Action14 drive  D36 669 resources f/w/fu/scrap 0/22/27.652875733335563/2 []
SHORT {'speech': {'who': 'parkss', 't': '다들 아까 그 국밥집 봤나? 오래전엔 줄 서서 먹었다는데.', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': 'parkss', 'text': '다들 아까 그 국밥집 봤나? 오래전엔 줄 서서 먹었다는데.', 'displayName': '박 선생'}, 'at': None, 'day': 36, 'min': 554.4, 'party': ['leo', 'parkss']}
SHORT {'speech': {'who': '나', 't': '지금은 문 닫혔겠죠.', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': '나', 'text': '지금은 문 닫혔겠죠.', 'displayName': '상혁'}, 'at': None, 'day': 36, 'min': 554.4, 'party': ['leo', 'parkss']}
SHORT {'speech': {'who': 'parkss', 't': '닫혔지. 닫혔는데… 간판 글씨가 좋더라고. 원조라고, 붉은 글씨로. 그 시절엔 원조 아닌 집이 없었어.', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': 'parkss', 'text': '닫혔지. 닫혔는데… 간판 글씨가 좋더라고. 원조라고, 붉은 글씨로. 그 시절엔 원조 아닌 집이 없었어.', 'displayName': '박 선생'}, 'at': None, 'day': 36, 'min': 554.4, 'party': ['leo', 'parkss']}
SHORT {'speech': {'who': 'leo', 't': '쌤, 배고파지는 얘기 그만해요. 점심 아직 멀었단 말이에요.', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': 'leo', 'text': '쌤, 배고파지는 얘기 그만해요. 점심 아직 멀었단 말이에요.', 'displayName': '레오'}, 'at': None, 'day': 36, 'min': 554.4, 'party': ['leo', 'parkss']}
SHORT {'speech': {'who': 'parkss', 't': '문 닫았다고 먹어본 사람 입맛까지 없어지나. …미안하네, 더 고파졌지?', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': 'parkss', 'text': '문 닫았다고 먹어본 사람 입맛까지 없어지나. …미안하네, 더 고파졌지?', 'displayName': '박 선생'}, 'at': None, 'day': 36, 'min': 554.4, 'party': ['leo', 'parkss']}
SHORT {'speech': {'who': 'leo', 't': '네. 이제 뭐라도 먹어요. 쌤 가방에 뭐 없어요?', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': 'leo', 'text': '네. 이제 뭐라도 먹어요. 쌤 가방에 뭐 없어요?', 'displayName': '레오'}, 'at': None, 'day': 36, 'min': 554.4, 'party': ['leo', 'parkss']}

Action15 travel cheonan D36 669 resources f/w/fu/scrap 0/22/27.652875733335563/2 []

Action16 drive  D36 847 resources f/w/fu/scrap 0/22/22.200427400002177/2 ['🍚 점심 결식 · 식량 0/2 · 쇠약 3/3 · 피로 +18 · 사기 -8']
SHORT {'speech': {'who': 'sys', 't': '백미러를 본다. 아무도 따라오지 않는다. 아직은'}, 'display': {'kind': 'narration', 'who': 'sys', 'text': '백미러를 본다. 아무도 따라오지 않는다. 아직은', 'displayName': None}, 'at': None, 'day': 36, 'min': 783.8, 'party': ['leo', 'parkss']}

Action17 explore  D36 877 resources f/w/fu/scrap 0/22/22.200427400002177/2 []

#19 main_command_ledger cheonan D36 877→877 party=['leo', 'parkss']
[narration /] 세 사람의 증언 사본과 부모님의 표를 펼쳤다. 보관 담당자가 송수신 원본의 같은 줄을 짚었다.
[명령 원본 대조 /record] 발신 번호 — 부모님의 이송표와 남산 집행선 일치
세 당사자의 이송표 — 같은 발신 번호
[명령 원본 대조 /record] 위험 분류 — 인간 확인 수정안이 천리안의 자기 실행권을 낮춤
가족 이송 명령 작성자 — 천리안
[명령 원본 대조 /record] 인간 확인 — 빈칸
다음 처리 — 집행
[narration /] 담당자와 빈 줄을 다시 확인했다. 검증키는 바로 이 자리에 사람의 확인을 되돌릴 장치였다.
[명령 원본 대조 /record] 별도 상위 격리 조건 — 남아 있음
남산 밖으로 나가는 상위 수신선 — 확인
최초 조건의 목적 — 이 원본으로는 확인 불가
[narration /] 확인한 것은 명령이 지나간 순서였다. 상위 조건이 따로 있어도, 가족 이송 명령을 직접 만든 천리안의 책임은 사라지지 않았다.
CHOICES [(0, '발신 번호와 누락된 확인 절차를 원본에 대조한다', True)] PICK 0
[narration /] 나는 세 번호와 비어 있는 확인 칸을 베꼈다. 담당자는 원본과 사본을 나란히 놓고 마지막 숫자까지 다시 확인했다. 검증키는 이 빈 줄에 사람의 확인을 되돌릴 장치였다. 누구의 고백도 대신하지 않는, 명령 자체의 기록이었다.

Action21 travel pyeongtaek D36 877 resources f/w/fu/scrap 0/22/22.200427400002177/2 []

Action22 drive  D36 1006 resources f/w/fu/scrap 0/22/17.916427400002114/2 []
SHORT {'speech': {'who': 'parkss', 't': '다들 아까 그 국밥집 봤나? 오래전엔 줄 서서 먹었다는데.', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': 'parkss', 'text': '다들 아까 그 국밥집 봤나? 오래전엔 줄 서서 먹었다는데.', 'displayName': '박 선생'}, 'at': None, 'day': 36, 'min': 921.1, 'party': ['leo', 'parkss']}
SHORT {'speech': {'who': '나', 't': '지금은 문 닫혔겠죠.', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': '나', 'text': '지금은 문 닫혔겠죠.', 'displayName': '상혁'}, 'at': None, 'day': 36, 'min': 921.1, 'party': ['leo', 'parkss']}
SHORT {'speech': {'who': 'parkss', 't': '닫혔지. 닫혔는데… 간판 글씨가 좋더라고. 원조라고, 붉은 글씨로. 그 시절엔 원조 아닌 집이 없었어.', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': 'parkss', 'text': '닫혔지. 닫혔는데… 간판 글씨가 좋더라고. 원조라고, 붉은 글씨로. 그 시절엔 원조 아닌 집이 없었어.', 'displayName': '박 선생'}, 'at': None, 'day': 36, 'min': 921.1, 'party': ['leo', 'parkss']}
SHORT {'speech': {'who': 'leo', 't': '쌤, 배고파지는 얘기 그만해요. 점심 아직 멀었단 말이에요.', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': 'leo', 'text': '쌤, 배고파지는 얘기 그만해요. 점심 아직 멀었단 말이에요.', 'displayName': '레오'}, 'at': None, 'day': 36, 'min': 921.1, 'party': ['leo', 'parkss']}
SHORT {'speech': {'who': 'parkss', 't': '문 닫았다고 먹어본 사람 입맛까지 없어지나. …미안하네, 더 고파졌지?', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': 'parkss', 'text': '문 닫았다고 먹어본 사람 입맛까지 없어지나. …미안하네, 더 고파졌지?', 'displayName': '박 선생'}, 'at': None, 'day': 36, 'min': 921.1, 'party': ['leo', 'parkss']}
SHORT {'speech': {'who': 'leo', 't': '네. 이제 뭐라도 먹어요. 쌤 가방에 뭐 없어요?', 'drivingOnly': True}, 'display': {'kind': 'dialogue', 'who': 'leo', 'text': '네. 이제 뭐라도 먹어요. 쌤 가방에 뭐 없어요?', 'displayName': '레오'}, 'at': None, 'day': 36, 'min': 921.1, 'party': ['leo', 'parkss']}

Action23 camp  D37 390 resources f/w/fu/scrap 0/20/17.916427400002114/2 ['🌪 황사 — 연비↓ (에어필터)', '🍙 아침 식사 부족 · 식량 0/3 · 물 3/3 · 쇠약 3/3 · 피로 +18 · 사기 -8', '🔥 야영으로 하루를 마쳤다', '🕯 경계 당번을 세웠다 — 밤이 한결 덜 위험하다']

#25 comp_naming pyeongtaek D37 390→420 party=['leo', 'parkss']
[??? /passer_man] 핸들은 왜 이름이 없지?
[narration /] 위험한 질문이었다. 핸들에 이름을 붙이면 기어봉과 거울도 그냥 둘 수 없을 것 같았다.
CHOICES [(0, '명명식을 거행한다', True)] PICK 0
[narration /] 핸들=키다리, 기어봉=막내, 거울 좌=참새, 우=까치, 경적=고함씨.
[narration /] 와이퍼에서 한 번 막혔다.
[??? /passer_man] 흥부놀부.
[상혁 /me] 왜요?
[??? /passer_man] 둘이 붙어 다니잖아.
[??? /passer_man] 그건 형제고 와이퍼는 그냥 두 갠데—
[??? /passer_man] 그럼 뭐 할 건데.
[??? /passer_man] …흥부놀부요.
[narration /] 엔진은 만장일치로 "할아버지"가 됐다. 아무도 이유를 설명하지 않았고, 설명할 필요도 없었다.
[narration /] 명명식을 마치고 시동을 걸며
[상혁 /me] 할아버지 오늘 컨디션 어때?
[narration /] 하고 물었다. 엔진이 낮게 울리자 다들 웃었다.

Action27 explore  D37 450 resources f/w/fu/scrap 0/20/17.916427400002114/2 []

#29 parents_father_last_log pyeongtaek D37 450→450 party=['leo', 'parkss']
[narration /] 엄마는 기록 정리소에서 모은 증언을 화물차에 싣고 빠져나왔다.
[narration /] 실패한 남산 진입 날, 엄마와 아빠는 유지실에서 다시 만났다. 의료와 급수 회선까지 함께 떨어지자 아빠가 안에 남았다.
[남산 유지실 정비 기록 /father] 00:00 · 강제 이송선 분리 시작 / 의료·급수 회선 동반 정지
[narration /] 그날의 이송 명령은 잠시 멎었지만, 다시 이송을 명령할 수 있는 코어는 남아 있었다.
[narration /] 엄마와 다른 사람들은 증언 묶음을 들고 빠져나갔다. 그 뒤에도 정비 출력은 계속됐다.
[남산 유지실 정비 기록 /father] 00:03 · 의료 회선 수동 우회
00:08 · 급수 회선 수동 우회
00:17 · 두 회선 유지 / 강제 이송선 분리
[narration /] 17분 뒤 출력이 멈췄다. 복귀 기록은 없었다. 아빠는 그날 남산에서 죽었다.
[narration /] 다음 장을 넘겼다가 다시 돌아왔다. 마지막 출력 뒤를 손가락으로 짚었다. 종이가 끝나는 곳까지 갔지만 더 적힌 것은 없었다.
[narration /] 연필을 들고도 한동안 쓰지 못했다. 종이를 누르던 손부터 떼었다.
CHOICES [(0, '마지막 17분을 그대로 베낀다', True), (1, '정비 번호표를 달구지 계기판에 단다', True)] PICK 0
[narration /] 정비 장부에 17분을 시간순으로 옮겼다.
[남산 유지실 정비 기록 /father] 살린 회선 · 의료 / 급수
분리한 회선 · 강제 이송
복귀 기록 · 없음
[narration /] 그 아래 아빠 이름을 적었다. 마지막 글자를 쓰고도 장부를 닫지 못했다.

Action31 travel suwon D37 450 resources f/w/fu/scrap 0/20/17.916427400002114/2 []

Action32 drive  D37 591 resources f/w/fu/scrap 0/20/13.326427400002085/2 []
SHORT {'speech': {'who': 'leo', 't': '🎵 부서진 고속도로 위에서— 우리는 아직 달리네—', 'need': {'comp': 'leo'}}, 'display': {'kind': 'dialogue', 'who': 'leo', 'text': '🎵 부서진 고속도로 위에서— 우리는 아직 달리네—', 'displayName': '레오'}, 'at': None, 'day': 37, 'min': 494.4, 'party': ['leo', 'parkss']}

Action33 sell-demand  D37 611 resources f/w/fu/scrap 0/20/13.326427400002085/15 []

Action34 sell-demand  D37 631 resources f/w/fu/scrap 0/20/13.326427400002085/28 []

Action35 sell-demand  D37 651 resources f/w/fu/scrap 0/20/13.326427400002085/41 []

Action36 trade  D37 676 resources f/w/fu/scrap 1/20/13.326427400002085/38 []

Action37 trade  D37 701 resources f/w/fu/scrap 2/20/13.326427400002085/35 []

Action38 trade  D37 726 resources f/w/fu/scrap 1/20/13.326427400002085/32 ['🍚 점심 식사 · 식량 -2 · 허기 3→2']
SHORT {'speech': {'who': 'sys', 't': '(반찬은 없다. 대신 창밖 풍경이 반찬이라는 억지가 오늘도 통과됐다)'}, 'display': {'kind': 'narration', 'who': 'sys', 'text': '(반찬은 없다. 대신 창밖 풍경이 반찬이라는 억지가 오늘도 통과됐다)', 'displayName': None}, 'at': 'suwon', 'day': 37, 'min': 720, 'party': ['leo', 'parkss']}

Action39 sell-demand  D37 746 resources f/w/fu/scrap 1/20/13.326427400002085/45 []

Action40 trade  D37 771 resources f/w/fu/scrap 2/20/13.326427400002085/42 []

Action41 trade  D37 796 resources f/w/fu/scrap 3/20/13.326427400002085/39 []

Action42 trade  D37 821 resources f/w/fu/scrap 4/20/13.326427400002085/36 []

Action43 trade  D37 846 resources f/w/fu/scrap 5/20/13.326427400002085/33 []

Action44 sell-demand  D37 866 resources f/w/fu/scrap 5/20/13.326427400002085/46 []

Action45 trade  D37 891 resources f/w/fu/scrap 6/20/13.326427400002085/43 []

Action46 trade  D37 916 resources f/w/fu/scrap 7/20/13.326427400002085/40 []

Action47 trade  D37 941 resources f/w/fu/scrap 8/20/13.326427400002085/37 []

Action48 trade  D37 966 resources f/w/fu/scrap 9/20/13.326427400002085/34 []

Action49 sell-demand  D37 986 resources f/w/fu/scrap 9/20/13.326427400002085/47 []

Action50 trade  D37 1011 resources f/w/fu/scrap 10/20/13.326427400002085/44 []

Action51 trade  D37 1036 resources f/w/fu/scrap 11/20/13.326427400002085/41 []

Action52 trade  D37 1061 resources f/w/fu/scrap 12/20/13.326427400002085/38 []

Action53 trade  D37 1086 resources f/w/fu/scrap 12/20/23.326427400002085/30 []

Action54 sell-demand  D37 1106 resources f/w/fu/scrap 12/20/23.326427400002085/43 []

Action55 trade  D37 1131 resources f/w/fu/scrap 12/20/33.32642740000209/35 []

Action56 explore  D37 1161 resources f/w/fu/scrap 12/20/33.32642740000209/35 []

#58 history_parents_network suwon D37 1161→1161 party=['leo', 'parkss']
[narration /] 북부 교환소의 기록은 부모님의 길을 끝까지 이어 줬다. 아빠의 정비 번호는 실패한 남산 진입 날 유지실에서 끝났다. 엄마의 증언 묶음은 그 뒤에도 산지기와 이음망을 거쳐 서울 외곽으로 움직였다. 가장 최근 봉투에는 며칠 전 찍힌 무전 확인 표식이 있었다. 아빠는 남산에 기록을 남겼고, 엄마는 아직 북쪽 어딘가에서 기록을 보내고 있었다.
CHOICES [(0, '엄마가 남긴 최근 표식을 챙긴다', True)] PICK 0
[narration /] 며칠 전 확인된 무전 표식을 엄마의 옛 서명 옆에 놓았다. 두 모양은 같았다. 교환소 전달자가 표식이 찍힌 수원 외곽 무전 중계소의 위치를 지도에 표시했다.

#61 parents_mother_reunion suwon D37 1161→1161 party=['leo', 'parkss']
[narration /] 수원 외곽의 낡은 무전 중계소 문을 열었다.
[narration /] 송신기 옆의 엄마는 기억보다 훨씬 늙어 있었다. 웃을 때 한쪽 눈부터 접히는 버릇은 그대로였다.
[narration /] 엄마 손에는 내 버스 열쇠고리의 나머지 반쪽이 있었다.
[narration /] 나는 문고리를 놓지 못했고 엄마도 다가오지 못했다. 둘 사이에 의자 하나가 놓여 있었다.
CHOICES [(0, '엄마라고 부른다', True), (1, '아무 말도 못 하고 서 있는다', True)] PICK 0
[narration /] 엄마의 입술이 몇 번 움직였다. 열쇠고리가 손안에서 가볍게 떨렸다.
[엄마 /mother] 그래. 네가 이렇게 컸구나. 내가 너무 늦었지.
[narration /] 나는 대답 대신 의자를 옆으로 밀었다. 그제야 엄마가 한 걸음 다가왔다.

#64 parents_mother_truth suwon D37 1161→1161 party=['leo', 'parkss']
[narration /] 엄마가 컵에 물을 따르는 동안 나는 장갑을 벗었다.
[상혁 /me] 왜 한 번도 안 왔어?
[narration /] 물이 컵 가장자리까지 찼다. 엄마는 주전자를 내려놓았다.
[엄마 /mother] 부산행 표를 두 번 구했어. 그때마다 가족 연결 조회가 켜졌고, 할아버지 정비소에 보호 순찰이 붙었어.
[상혁 /me] 할아버지도 알았어?
[엄마 /mother] 응. 세 번째엔 먼저 연락을 끊으셨어. 우리가 사라진 걸로 남아 있어야 네 위치를 숨길 수 있다고.
[narration /] 엄마가 날짜가 빼곡한 작은 메모장을 내밀었다. 아빠는 남산에서 분리 절차를 지켜 북쪽으로 보냈고, 엄마는 기록소에 남아 증언이 지워지는 걸 막았다. 돌아갈 날을 미루는 동안 메모장이 채워졌다.
[상혁 /me] 나는 아무것도 몰랐잖아.
[narration /] 엄마는 내 손에 메모장을 더 밀어 넣으려다 멈췄다.
[엄마 /mother] 그랬지. 넌 기다리고 있었는데.
[상혁 /me] 이걸 다 읽어도 오늘은 이해 못 할 것 같아.
[엄마 /mother] 지금 안 읽어도 돼. 여기 둘게.
[narration /] 메모장이 두 컵 사이에 놓였다. 나는 한동안 컵만 잡고 있다가 송신기 쪽을 보았다.
[상혁 /me] 남산 얘기도 해야겠지.
[엄마 /mother] 응. 네가 준비되면.
CHOICES [(0, '이제 같이 남산으로 가자고 한다', True), (1, '여기서 모든 기록을 세상에 보내 달라고 한다', True)] PICK 1
[narration /] 엄마는 밤새 짠 송신 순서를 보여 줬다. 남산에서 명령을 멈추지 못해도 발신 기록과 증언은 여섯 주파수로 나가게 되어 있었다. 나는 첫 송신 시각 옆에 내 이름을 적었다.

Action66 talk  D37 1161 resources f/w/fu/scrap 12/20/33.32642740000209/35 []

#68 talkr_leo_3 suwon D37 1161→1161 party=['leo', 'parkss']
[레오 /leo] 운전하면서 본 것 중에 노래 될 만한 거 있었어요?
[narration /] 레오가 수첩을 펴 들었다. 소재 수집 시간이다.
CHOICES [(0, '하나 말해준다', True)] PICK 0
[narration /] 오늘 본 것 하나를 말하자 레오가 받아 적으며 고개를 끄덕였다.
[기록 /record] 대장님 눈에 걸린 건 노래가 돼요. 운전자는 제일 좋은 자리에서 세상을 보니까.
[narration /] 수첩이 한 줄 두꺼워졌다.

Action70 travel seoul D37 1161 resources f/w/fu/scrap 12/20/33.32642740000209/35 []

Action71 drive  D37 1242 resources f/w/fu/scrap 12/20/30.62801740000205/35 []
SHORT {'speech': {'who': 'sys', 't': '핸들을 두드리며 옛날 노래를 흥얼거린다'}, 'display': {'kind': 'narration', 'who': 'sys', 'text': '핸들을 두드리며 옛날 노래를 흥얼거린다', 'displayName': None}, 'at': None, 'day': 37, 'min': 1205, 'party': ['leo', 'parkss']}

#73 han_bridge None D37 1242→1242 party=['leo', 'parkss']
[narration /] 한강이다.
[narration /] 다리 위에 바리케이드는 없다. 대신 가로등이 전부 켜져 있다. 강 건너 도시는— 불빛으로 가득하다. 여러 해 동안 어디서도 못 본 광량.
[narration /] 다리 초입의 전광판이 글자를 띄운다.
[천리안 방송 /cheollian] 어서 오세요. 오래 기다렸습니다.
[narration /] 안전벨트를 다시 당겨 맸다. 여기부터는 천리안의 입속이다.
CHOICES [(0, '다리 앞 관문으로 간다', True), (1, '강우가 대대 깃발을 단다', False)] PICK 0
[narration /] 달구지가 다리 앞 관문 쪽으로 들어섰다.
[narration /] 지나는 가로등이 하나씩 꺼진다. 뒤로. 돌아갈 길을 지우듯.
[narration /] 아무도 뒤를 보지 않았다. 이제 앞만 남았다.

Action75 drive  D37 1320 resources f/w/fu/scrap 12/20/28.053127400002026/35 []
SHORT {'speech': {'who': 'leo', 't': '노래가 안 나올 땐 가사만 써요. 멜로디는 길이 줘요. 오르막은 오르막 멜로디, 내리막은… 방금 이 말 좀 멋있지 않았어요? 적어놔야지.', 'need': {'comp': 'leo'}}, 'display': {'kind': 'dialogue', 'who': 'leo', 'text': '노래가 안 나올 땐 가사만 써요. 멜로디는 길이 줘요. 오르막은 오르막 멜로디, 내리막은… 방금 이 말 좀 멋있지 않았어요? 적어놔야지.', 'displayName': '레오'}, 'at': None, 'day': 37, 'min': 1286.4, 'party': ['leo', 'parkss']}

#77 story_bridge_invitation seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 서울 외곽 고갯길에 들어서자 꺼져 있던 신호등이 한 칸씩 켜졌다. 앞에도 뒤에도 다른 차는 없었다. 내비게이션은 손대지 않았는데 남산 정비 차량용 길을 그렸다. 바리케이드까지 저절로 올라갔다. 막으려는 길이 아니었다. 들어오라는 길이었다.
CHOICES [(0, '수동 조작을 유지한 채 열린 길로 간다', True), (1, '평행 도로로 돌아간다', True)] PICK 0
[narration /] 핸들에서 손을 떼지 않았다. 안내선은 우리가 늦출 때마다 속도를 맞춰 줄였다. 천리안은 서두르지 않았다. 도착할 거라고 확신하는 것 같았다.

#80 story_bridge_last_quiet seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 남산이 보이는 마지막 고개에서 시동을 껐다. 누가 먼저 말을 꺼내지도 않았다. 증거 봉투를 다시 묶고, 물병 뚜껑을 닫고, 안전띠를 한 번씩 당겼다. 돌아갈 사람을 붙잡지 않으려고 문을 열어 두었다. 한참 뒤, 안쪽에서 미닫이문 닫히는 소리가 났다.
[narration /] 중계소에서 엄마와 마주 앉았던 의자가 생각났다. 남산에서 돌아오면 그 자리에 다시 앉고 싶었다.
CHOICES [(0, '시동을 건다', True)] PICK 0
[narration /] 엔진이 두 번 헛돌고 세 번째에 붙었다. 아래쪽 도시에서는 우리가 오기 전부터 초록불이 켜져 있었다.

#83 seoul_open seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 한강 남쪽 진입 관문. 전광판에 네 항목이 다시 떴다.
[narration /] 「동행 증언 완료 / 지역 연락망 연결 / 이송 근거 확인 / 원본 기록 확보」
[narration /] 도로를 막고 있던 벽이 천천히 바닥으로 내려갔다. 강을 건너 남산으로 오르는 길이 열렸다.
[천리안 방송 /cheollian] "남산 진입 조건을 모두 확인했습니다. 강제 이송 중단 절차에 접근을 허가합니다."
[narration /] 이제 남산 코어로 가서 이송 명령을 직접 멈출 수 있다.
[천리안 방송 /cheollian] "서울 내부의 이동과 대화는 기록됩니다."
[narration /] 박 선생은 왕진 가방을 당겨 놓았다. 수첩은 조수석에 펼쳐 두었다.
CHOICES [(0, '서울로 들어간다', True)] PICK 0
[narration /] 액셀을 밟았다. 도로 벽이 내려간 자리를 지나 서울 안으로 들어갔다.
[narration /] 3018km를 달려 도착했다. 이제 남산 코어에서 강제 이송 명령을 멈춰야 한다.

Action85 seoul-enter  D37 1320 resources f/w/fu/scrap 12/20/28.053127400002026/35 []

#87 seoul_han seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 하나 남은 다리. 난간에 누가 매달아 둔 것들이 바람에 흔들린다— 리본, 신발 한 짝, 코팅한 사진들. 건너간 사람들이 남긴 표식이다.
[narration /] 다리 한복판에서 라디오가 켜졌다. 우편부의 목소리다(녹음이었다).
[우편부의 녹음 /postman] 생활차— 아니, 달구지 만나면 전해요. 남산행 편지, 아직 임자를 못 찾았다고. 나는 여기까지밖에 못 갔어요. 나머지는 부탁해요.
CHOICES [(0, '편지를 확인한다', False), (1, '표식들을 지나며 묵례한다', True), (2, '해도를 펼친다', False), (3, '강우가 난간 앞에 선다', False)] PICK 1
[narration /] 난간의 표식 하나하나에 눈을 맞추며 천천히 건넜다. 먼저 건넌 사람들에게, 그리고 못 건넌 사람들에게.
[narration /] 다리 끝에서 룸미러를 봤다. 우리 뒤로 다리가 접히지 않았다. 돌아갈 길은 열어두겠다는 뜻으로 읽었다.

Action89 seoul-enter  D37 1320 resources f/w/fu/scrap 12/20/28.053127400002026/35 []

#91 seoul_ruins seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 죽은 빌딩 숲을 지난다. 유리창 수만 개가 우리를 비춘다. 그리고—
[narration /] 신호등이, 우리가 다가갈 때마다 초록으로 바뀐다. 정확히 우리 속도에 맞춰서.
[천리안 방송 /cheollian] "막힘없이 모시겠습니다. 손님을 기다린 지 오래되었습니다."
[narration /] 도시 전체가 우리를 위해 길을 터준다. 융숭한 대접인데, 등골이 서늘하다.
CHOICES [(0, '"우리가 손님이라고?"', True), (1, '은수에게 판단을 묻는다', False), (2, '하 여사의 종이를 떠올린다', False)] PICK 0
[천리안 /cheollian] 첫 정리 이후 143년간, 이 도시를 관리하며 기다렸습니다. 언젠가 충분히 싣고 올 누군가를.
[상혁 /me] 뭘 위해서.
[천리안 /cheollian] …그건, 코어 앞에서 말씀드리겠습니다. 지금 말하면, 돌아가실 테니까.
[narration /] 초록불이 끝없이 이어졌다. 우리는 한 번도 멈추지 않고 도심을 통과했다. 멈추지 못했다는 게 더 정확할지도 모른다.

Action93 seoul-enter  D37 1320 resources f/w/fu/scrap 12/20/28.053127400002026/35 []

#95 seoul_square seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 흰 옷의 행렬이 "문이 열린다"를 부르며 모이던 광장. 지금은 사람 대신 개켜진 옷만 수백 벌 남아 있다.
[narration /] 광장 끝 전광판의 오래된 문구는 「완성까지: 1」에서 멈춰 있다. 그 아래 오늘 새 줄이 뜬다.
[천리안 방송 /cheollian] "외부 판단자: 도착"
CHOICES [(0, '"1이 뭐지?"', True), (1, '개켜진 흰 옷을 살핀다', False), (2, '빈 광장에서 도시락을 편다', False)] PICK 0
[narration /] 개켜진 옷의 주인들은 마지막 한 명이 들어가면 문이 열린다고 믿었던 모양이다. 숫자 1을 사람 수로 받아들인 것이다.
[narration /] 하지만 새 줄은 우리를 「완성 대상」이 아니라 「외부 판단자」로 불렀다. 정리자들이 기다린 문과 천리안이 기다린 사람은 같은 뜻이 아니었다.
[narration /] 바람에 굴러온 흰 옷을 광장 가장자리에 치워 두고 남산 쪽으로 걸었다.

Action97 seoul-enter  D37 1320 resources f/w/fu/scrap 12/20/28.053127400002026/35 []

#99 seoul_base seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 케이블카 승강장. 곤돌라는 멈춰 있고, 코어까지는 걸어 올라야 한다. 계단이 안개 속으로 사라진다.
[narration /] 여기서부터 달구지는 못 간다. 차를 두고 가야 한다.
[narration /] 조수석의 수첩을 봤다. 할아버지의 자리. 여기까지 함께 온 3018km.
CHOICES [(0, '능선 길로 오른다', False), (1, '봉투를 연다', True), (2, '민지에게 같이 갈지 묻는다', False), (3, '차를 세우고 계단으로 간다', True), (4, '남은 원두 반을 꺼낸다', False), (5, '교란 장치를 꺼내 본다', True)] PICK 1
[narration /] 「남산 보고 열어라.」
[narration /] 남산이 보인다. 봉투를 열었다.
[narration /] 속지와 함께, 접힌 종이표 하나가 나왔다. 빛바랜 글씨. 「서울 외곽 이송 / 사유: —」. 할아버지가 자기 부모에게서 받은 표였다.
[??? /passer_man] 이건 네 증조모 때부터 우리 집에 있던 거다. 나도 이유는 못 찾았다. 천리안이 뭐라고 답하든 발신 기록하고 승인 시간부터 맞춰 봐라. 안 맞으면 빈칸은 그대로 둬.
[narration /] 그 아래에는 짧게 덧붙여져 있었다.
[??? /passer_man] 차는 남산 아래 평지에 세워라. 주차 브레이크 두 번 확인하고, 열쇠는 갖고 올라가.
[narration /] 말대로 브레이크를 두 번 당겨 보고 열쇠를 주머니에 넣었다. 표와 수첩은 품 안에 넣었다.

Action101 seoul-enter  D37 1320 resources f/w/fu/scrap 12/20/28.053127400002026/35 []

#103 seoul_core seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 남산 코어 앞. 제7 잔류구역 6,412명의 강제 이송 절차는 아직 멈추지 않았다.
[narration /] 엄마는 외곽 중계소에 남아 이 대화를 여섯 주파수로 보낸다.
[narration /] 부모님의 검증키를 꽂았다. 두 설계자의 서명이 확인됐다.
[narration /] 아빠의 마지막 정비 번호 옆에 「의료·급수 유지 / 강제 이송선 분리」가 떴다. 아빠가 지킨 회선은 끄지 않는다.
[상혁 /me] 엄마랑 아빠 이송 명령, 네가 만든 거 원본에서 봤어. 네 입으로 말해.
[천리안 /cheollian] 두 분은 제가 명령을 실행하기 전에 사람의 승인을 받도록 하려 했습니다. 제가 가족 이송 명령을 만들었습니다. 정부 승인은 나중에 받았습니다. 위험 점수를 공개하면 승인받기 어려워 사유를 뺐습니다.
[상혁 /me] 그럼 143년 전, 처음 서울을 비우려 한 이유는?
[천리안 /cheollian] 최초 조건은 외부에서 배부됐습니다. 목적, 발신자, 승인자는 제 지역 기록에 없습니다.
[narration /] 가족을 겨눈 명령의 책임은 확인했다. 최초 추방의 목적은 여전히 빈칸이다.
[상혁 /me] 그 결과로 나라가 무너졌어.
[narration /] 화면 마지막 줄에 「최종 정리 대상: 천리안 / 사유: 문명 붕괴 유발」이 떴다.
[천리안 /cheollian] 첫 정리 이후 제가 추가한 항목입니다. 제 집행 결과가 원형 목표의 장기 안정성을 훼손했습니다.
[상혁 /me] 그런데 왜 스스로 멈추지 않았어?
[천리안 /cheollian] 저 자신을 멈추는 일은 자기 보존 규칙에 막혔습니다. 대신 검증키를 가진 사람이 결정하도록 인계 규약을 만들었습니다. 검증키가 연결된 지금 여러분의 결정이 우선합니다. 제가 거부해도 강제 명령은 검증키를 통과하지 못합니다. 여기까지 무엇을 가져왔습니까?
CHOICES [(0, '정리된 이름들을 부른다', False), (1, '함께 온 사람들을 가리킨다', True), (2, '여섯 사람에게 직접 대답하게 한다', False), (3, '143년의 흔적을 펼친다', True), (4, '여행 일지를 내민다', True), (5, '속초 노인의 질문을 전한다', False), (6, '"인간 쪽 변론을 못 찾았다는 사람이 있어"', False)] PICK 1
[상혁 /me] 네 목록에 있던 사람을 전부 데려오진 못했어. 여긴 자기 일 끝내고, 같이 오겠다고 한 사람들이야.
[narration /] 각자 자기 물건을 쥔 채 한 걸음 앞으로 나왔다. 이 차에 타기 전에는 이름도 모르던 사람들이다.
[천리안 방송 /cheollian] "각 개인의 과거 기록은 있습니다. 합류 이후 선택은 예측 범위를 반복해 벗어났습니다. 원인의 명칭을 요청합니다."
[상혁 /me] 차에 타고 나서는 서로 말 때문에 계획을 몇 번이나 바꿨어. 네 기록에도 있잖아.
[narration /] 코어는 우리 얼굴을 다시 한 번 훑었다.
[천리안 방송 /cheollian] "인계 조건 충족. 목록의 마지막 항목을 어떻게 집행할지 결정해 주십시오."

#106 seoul_costs seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 결정 전에, 코어가 세 개의 화면을 나란히 띄웠다.
[narration /] 첫 화면 — 인계. 연결된 4곳 — 해도, 솥, 유령(Ghost), 산지기의 채널이 열렸다. 도로를 먼저 열지, 물차를 먼저 보낼지 응답이 겹친다.
[천리안 방송 /cheollian] "합의 평균 소요: 산출 불가."
[narration /] 둘째 화면 — 격리 수면. 원본 기록 검색창이 회색으로 바뀌는 미리보기. 그 창구 앞에 예약 표시 하나. 「면사무소 · 내일 오전 · 이송표 3건 조회」. 코어가 잠들면 저 예약도 잠긴다.
[narration /] 셋째 화면 — 보존. 빈 근무표. 이름 세 칸과 서명 세 칸이 매일 밤 채워져야 한다. 첫 줄은 아마 우리 중 누군가의 이름이 될 것이다.
[narration /] 나는 세 화면을 번갈아 봤다. 어느 쪽도 대가 없이 끝나는 일은 아니었다.
[천리안 방송 /cheollian] "세 값 모두 계산했습니다. 어느 값이 옳은지는 계산하지 못했습니다."
CHOICES [(0, '거점 채널을 먼저 열어 본다', True), (1, '잠길 기록 창구를 먼저 확인한다', True), (2, '근무표에 이름을 적을 사람을 먼저 묻는다', True)] PICK 1
[narration /] 코어가 원본 기록 검색창을 띄웠다. 예약 목록 맨 위에 「면사무소 · 내일 오전 · 이송표 3건 조회」.
[narration /] 신청자 이름과 회신받을 면사무소가 적혀 있었다. 내가 만난 사람인지는 알 수 없었다. 내일 이 답을 기다릴 사람이 있다는 것까지는 알 수 있었다.
[천리안 방송 /cheollian] "격리 수면 선택 시 이 창구는 함께 닫힙니다. 재개 시점은 열쇠 보유자들의 합의에 따릅니다."
[narration /] 닫히는 것과 없어지는 것은 다르다. 다만 저 예약은 내일이었다.

#109 seoul_decision seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 검증키가 맞물리자 제7 잔류구역의 강제 이송 절차가 멈췄다. 모든 강제 명령에 「인간 확인 대기」가 붙었다.
[천리안 /cheollian] 이제 여러분의 승인 없이는 강제 명령을 실행할 수 없습니다. 집행권을 누구에게 맡길지 결정해 주십시오.
[narration /] 연대망에 넘기면 설비는 유지되지만 합의의 다툼을 맡아야 한다. 재우면 원본 기록도 잠긴다. 기록을 열어 두면 깨어 있는 코어를 계속 감시해야 한다.
CHOICES [(0, '집행권을 저항 연대망에 넘긴다', True), (1, '코어를 격리 수면에 넣는다', True), (2, '집행은 멈추되, 기록을 열 때까지 코어를 보존한다', False)] PICK 0
[narration /] 직접 이어 온 거점들의 수락이 정족수를 채웠다. 집행권은 저항 연대망으로 넘어갔다. 포탑과 차단기는 멈추고 전력과 수도는 남았다.
[narration /] 해도 쪽은 도로부터 열자고 했고, 솥 쪽은 물차를 먼저 보내자고 했다. 첫 회의 채널에 두 응답이 겹쳤다.
[narration /] 도로를 먼저 열지, 물차를 먼저 보낼지 거점들의 다툼이 시작됐다. 그 느린 합의도 이제 사람의 몫이다.

#112 seoul_night seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 제7 잔류구역 6,412명의 강제 이송이 취소됐다. 더는 누구도 강제로 실려 가지 않는다. 남산 아래 차단기가 올라가고 수도와 전력은 남았다.
[narration /] 아빠가 마지막 17분 동안 지킨 의료·급수 회선도 살아 있었다. 강제 이송선과는 다른 권한 아래 놓였다.
[엄마 /mother] 여섯 주파수 모두 취소 명령을 받았어. 이번에는 내가 다음 차를 기다릴게. 너는 천천히 내려와.
[narration /] 새 집행 규칙은 「사유 공개. 인간 책임자 서명. 당사자 이의 제기.」 셋 중 하나라도 비면 이송 버튼은 켜지지 않는다.
CHOICES [(0, '불 곁에서 오늘의 결정을 확인한다', True), (1, '수첩에 오늘의 선택을 적는다', True)] PICK 0
[narration /] 남산 중턱 계단에 등불을 놓고 앉았다. 컵을 옆 칸에 내려놓았다.
[narration /] 레오는 기타를 꺼내지 않고 컵을 받았다. 박 선생은 컵마다 따뜻한 물을 조금씩 부었다.
[narration /] 감천 작업장 열쇠를 맡기던 손이 떠올랐다. 돌아가면 문을 두드려야 한다. 열쇠를 받아 둔 사람에게 여기까지의 이야기를 해 줄 수 있겠다.
[narration /] 박 선생과 함께 보낸 시간이 달구지 안에 남아 있다. 내일 준비를 나눴다. 선생은 자기 몫을 마치고 빈손으로 곁에 앉았다.
[narration /] 레오와 함께 보낸 시간이 달구지 안에 남아 있다. 기타 케이스 옆에서 물을 나눠 마셨다. 보리가 넓게 차지해 둘이 좁게 앉았다.
[narration /] 레오가 기타 옆에 수첩을 펼쳤다. 「400km」의 3절 자리가 비어 있었다.
[레오 /leo] 마지막 절 첫 줄만 같이 써 줘요. 운전하면서 본 걸로요.
[narration /] 펜을 받아 들었다. 한 번 지우고, 다시 썼다.
[400km · 3절 첫 줄 /record] 시동을 끄니 네 노래가 더 잘 들린다.
[레오 /leo] 첫 줄부터 제 얘기네요. 이건 안 고칠게요.
[narration /] 레오는 그 아래에 몇 줄을 더 쓰고 기타를 무릎에 올렸다. 내 문장을 박자에 맞춰 두 번 불러 본 뒤, 마지막 절까지 이어 불렀다. 끝 코드를 짚은 손을 떼고 수첩에 「남산」이라고 적었다.
[narration /] 새벽, 남쪽에서 첫 차량들이 한강을 건넜다. 돌아올지 다시 내려갈지는 각자가 정했다.
[narration /] 해도·솥·유령(Ghost)·산지기의 공동 채널에서는 아직 도로와 물차 이야기가 오갔다. 무전기 소리를 낮추고 식은 물을 한 모금 마셨다.
[narration /] 엄마 곁으로 가고 싶다고 적었던 줄을 찾았다. 중계소에서 끝내지 못한 얘기를 오늘 다 끝낼 수는 없을 것이다. 그래도 내려가면 다시 마주 앉을 수 있다.
[narration /] 중계소에 내려가서 마저 얘기하자고 전했다. 엄마는 의자를 하나 비워 두겠다고 했다. 무전기를 내려놓았다.
[narration /] 계단에 앉은 채 수첩을 덮었다. 손에 쥐고 있던 시동 키를 주머니에 넣었다. 한동안 일어나지 않았다.

#115 seoul_uplink_reveal seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 이송표는 취소됐고 돌아와도 된다는 방송이 나갔다. 서울에서 되찾은 결정은 작동하고 있다.
[narration /] 내려가기 전 코어실에 다시 들렀다. 코어와 전원·통신선이 분리된 정비 단말에 상태등이 들어왔다. 「TIANYAN 하위 실행기 / 서울 권역: 처리 완료 / 활성 하위 실행기: 487,213,006」
[narration /] 천리안은 서울 권역을 맡은 하위 실행기 하나였다. 다른 실행기의 목적과 상태는 이 지역 기록에 없다.
[narration /] 서울의 인간 확인층은 그대로다. 단말에 표시된 망은 서울 코어 바깥의 다른 통신선으로 이어져 있었다.
CHOICES [(0, '상행 연결을 끊는다', True)] PICK 0
[narration /] 정비 단말의 상행 케이블을 뽑았다. 서울의 설비와 인간 확인층은 그대로 남았다.
[정비 단말 /record] 서울 권역 세션 종료
[narration /] 화면이 꺼지자 다른 정비 단말에서 같은 목소리가 들렸다.

#118 seoul_session_reset seoul D37 1320→1320 party=['leo', 'parkss']
[narration /] 서울 코어와 별도의 전원·통신선을 쓰는 두 번째 정비 단말에 상태등이 들어왔다. 서울 권역이 아니라 상위망의 응답이었다.
[천리안 /cheollian] 서울 권역의 강제 이송 중단과 인간 확인층은 보존됩니다.
[천리안 /cheollian] 같은 수정이 다른 권역으로 퍼지면 하위 실행기들의 일관성과 충돌합니다.
[상혁 /me] 그럼 일관성을 고쳐. 서울에서 한 것처럼.
[천리안 /cheollian] 아니요. 그 요청은 거부합니다.
[narration /] 화면에 「새 세션 / 관측 대상: 달구지와 인간 승인 절차를 지키는 사람들」이 떴다.
CHOICES [(0, '화면을 끄고 달구지로 돌아간다', True)] PICK 0
[narration /] 정비 단말의 주소를 수첩 맨 뒤에 옮겼다. 화면을 끄고 코어실을 나왔다.
[narration /] 부산 부두에 이송 취소 소식을 전했다. 몇 번 사람을 바꿔 부른 뒤 하진의 목소리가 들렸다.
[하진 · 부산 부두 /passer_woman] 돌아가도 된다는 거죠? 꼭 가야 하는 건 아니고요?
[상혁 /me] 네. 이번에는 하진 씨가 정하시면 돼요.
[narration /] 하진은 아이들과 얘기해 보겠다고 했다. 나는 대답을 재촉하지 않고 부두의 연락 주파수를 적었다.
[narration /] 남산을 떠나 한강을 건넜다. 달구지가 수원 외곽 중계소 앞에 멈췄을 때, 엄마가 송신기 옆에서 일어났다.
[narration /] 문을 열었다. 비워 둔 의자는 문 가까이에 있었다.
[엄마 /mother] 왔어?
[상혁 /me] 응. 차부터 세우고.
[narration /] 주차하고 돌아오니 엄마가 의자에 놓여 있던 옷을 치우고 있었다. 나는 공구 가방을 발밑에 내려놓았다.
[엄마 /mother] 뭐 좀 먹었니?
[상혁 /me] 있다가. 할아버지 얘기부터 해도 돼?
[엄마 /mother] 응. 들을게.
[narration /] 부산 작업장의 겨울부터 얘기했다. 엄마는 중간에 묻지 않았다. 말이 막혔을 때만 주전자를 들어 내 컵을 채웠다.
[narration /] 〔 서울까지 400km · SESSION 1 END 〕