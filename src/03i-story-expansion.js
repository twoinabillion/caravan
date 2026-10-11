/* Extra scenes/chats; keep edits separate from gates, effects and progression. */
(() => {
  if (typeof D === 'undefined') return;

  const sceneAssets = {
    'intro-busan-water-line-v1': 'assets/scenes/intro-busan-water-line-v1.jpg',
    'intro-busan-cold-storage-v1': 'assets/scenes/intro-busan-cold-storage-v1.jpg',
    'intro-busan-generator-night-v1': 'assets/scenes/intro-busan-generator-night-v1.jpg'
  };

  D.scenes = D.scenes || {};
  Object.assign(D.scenes, sceneAssets);

  Object.assign(D.scenes, {
    'story-bridge-trace-gap-v1': 'assets/scenes/story-bridge-trace-gap-v1.webp',
    'story-bridge-watched-v1': 'assets/scenes/story-bridge-watched-v1.webp',
    'story-bridge-parent-route-v1': D.scenes['story-bridge-parent-route-v1'],
    'story-bridge-invitation-v1': 'assets/scenes/story-bridge-invitation-v1.webp',
    'event-road-coffee-van-v2': 'assets/scenes/event-road-coffee-van-v2.webp',
    'event-road-food-truck-v2': 'assets/scenes/event-road-food-truck-v2.webp',
    'event-road-clinic-bus-v2': 'assets/scenes/event-road-clinic-bus-v2.webp',
    'event-road-broken-vehicle-v2': 'assets/scenes/event-road-broken-vehicle-v2.webp',
    'event-road-film-vehicle-v2': 'assets/scenes/event-road-film-vehicle-v2.webp'
  });

  Object.assign(D.sceneDescriptions, {
    'story-bridge-trace-gap-v1': '비 내리는 폐쇄 요금소 앞에 달구지가 서 있다. 안쪽 제어실에서는 오래된 이송 기록지가 끝없이 밀려 나오고 있다.',
    'story-bridge-watched-v1': '빈 도로의 감시 카메라와 점검 기계가 지나가는 달구지를 한꺼번에 따라 돈다.',
    'story-bridge-parent-route-v1': '달구지 바닥 수납칸 안에서 서로 다른 목적지가 찍힌 낡은 화물표 두 장과 검증 모듈이 발견된다.',
    'story-bridge-invitation-v1': '서울 외곽의 젖은 고갯길. 아무 차도 없는데 남산 쪽 신호등만 차례로 초록불을 켠다.',
    'event-road-coffee-van-v2': '비 내리는 국도 갓길. 달구지가 불을 밝힌 이동식 커피차 앞에 멈추고, 주인과 손님들이 열린 판매대에 모여 있다.',
    'event-road-food-truck-v2': '젖은 산길 갓길. 달구지 건너편 음식 트럭에서 솥 김이 오르고, 여행자들이 따뜻한 한 그릇을 기다린다.',
    'event-road-clinic-bus-v2': '낡은 이동 진료 버스 옆에서 의료진이 다친 사람을 돌본다. 달구지는 충분한 거리를 두고 길가에 멈췄다.',
    'event-road-broken-vehicle-v2': '고장 난 소형 화물차가 갓길에 서 있다. 한 사람은 열린 보닛을 살피고 다른 사람은 달구지를 향해 손을 든다.',
    'event-road-film-vehicle-v2': '이동 영화관 버스 옆에 천막 스크린과 영사기가 펼쳐지고 있다. 달구지가 빗길 건너편에 멈춰 섰다.'
  });

  const roadEventSceneOverrides = {
    ev_truck_cafe: 'event-road-coffee-van-v2',
    lc_jeonju_bibim: 'event-road-food-truck-v2',
    meet_bus: 'event-road-clinic-bus-v2',
    ev_mobile_clinic: 'event-road-clinic-bus-v2',
    meet_family: 'event-road-broken-vehicle-v2',
    prev_trace_stranded: 'event-road-broken-vehicle-v2',
    lib_meet: 'event-road-broken-vehicle-v2',
    circus_broke: 'event-road-broken-vehicle-v2',
    rumor_minji: 'event-road-broken-vehicle-v2',
    meet_cinema: 'event-road-film-vehicle-v2',
    loc_drivein: 'event-road-film-vehicle-v2',
    meet_theater: 'event-road-film-vehicle-v2'
  };
  for (const [eventId, scene] of Object.entries(roadEventSceneOverrides)) {
    const event = Array.isArray(D.events) && D.events.find((entry) => entry.id === eventId);
    if (event) event.scene = scene;
  }

  D.sceneAssetMeta = D.sceneAssetMeta || {};
  Object.assign(D.sceneAssetMeta, {
    'intro-busan-water-line-v1': {
      place: '부산 감천 공동 급수대',
      time: '이른 아침',
      cast: ['나', '감천 주민들']
    },
    'intro-busan-cold-storage-v1': {
      place: '감천 공동 냉동창고',
      time: '비 오는 낮',
      cast: ['나', '장터 상인들', '진료소 직원']
    },
    'intro-busan-generator-night-v1': {
      place: '감천 언덕 공동 마당',
      time: '발전기 소등 전',
      cast: ['나', '감천 이웃들']
    }
  });

  D.sceneDescriptions = D.sceneDescriptions || {};
  Object.assign(D.sceneDescriptions, {
    'intro-busan-water-line-v1': '비 오는 감천 부두의 공동 급수대. 주민들이 통을 세워 차례를 기다리고, 나는 새는 밸브를 조인다.',
    'intro-busan-cold-storage-v1': '생선 상자와 약품 보관함을 지키려고 사람들이 기다리는 동안, 나는 공동 냉동기의 호스를 고친다.',
    'intro-busan-generator-night-v1': '발전기를 끄기 전 이웃들이 늦은 밥을 나눈다. 나는 달구지 옆에 조금 떨어져 앉아 그 소리를 듣는다.'
  });

  const introPages = {
    water: {
      scene: 'intro-busan-water-line-v1',
      era: '어제 아침 · 부산 감천 공동 급수대',
      title: '물이 나오는 마흔 분',
      text: [
        '감천의 수도는 아침저녁으로 마흔 분씩만 열렸다. 사람들은 해 뜨기 전부터 통을 줄 세워 두었다. 몸이 아픈 집의 통은 이웃이 대신 가져왔고, 빈 통이 넘어지면 뒤에 선 사람이 말없이 세웠다.',
        '그날은 급수대 밸브가 새고 있었다. 내 물통을 채우러 갔다가 공구를 꺼냈다. 고친 값은 받지 않았다. 대신 정희네 몫 한 통을 언덕 위까지 들고 올라갔다.'
      ].join('\n\n')
    },
    coldStorage: {
      scene: 'intro-busan-cold-storage-v1',
      era: '어제 낮 · 감천 공동 냉동창고',
      title: '녹으면 같이 곤란해진다',
      text: [
        '장터 뒤 냉동창고 하나에 생선과 진료소 약품이 함께 들어 있었다. 냉기가 빠지기 시작하면 상인도, 환자도 자기 것부터 꺼내 달라고 할 수밖에 없었다.',
        '나는 문을 닫게 하고 압축기 호스를 갈았다. 수리가 끝날 때까지 사람들은 젖은 바닥에 서서 기다렸다. 누가 먼저랄 것도 없이 손전등을 비추고, 물을 퍼내고, 내 공구를 건넸다.',
        '돈 대신 받은 것은 고철 두 조각과 식은 주먹밥 하나였다. 주먹밥은 그 자리에서 반만 먹고 나머지는 작업복 주머니에 넣었다.'
      ].join('\n\n')
    },
    generator: {
      scene: 'intro-busan-generator-night-v1',
      era: '어젯밤 · 감천 언덕 공동 마당',
      title: '불을 끄기 전에',
      text: [
        '밤 열한 시가 되면 동네 발전기를 껐다. 그전까지 사람들은 라디오를 충전하고, 젖은 옷을 말리고, 다음 날 쓸 물을 끓였다. 전기가 모자라는 날에는 어느 집 냉장고를 더 돌릴지 한참 말다툼도 했다.',
        '말다툼이 끝나면 밥은 같이 먹었다. 내 자리는 늘 달구지 가까이에 있었다. 누군가 국을 밀어 주면 한 그릇만 먹고 작업장으로 돌아갔다.',
        '혼자 살았지만 혼자서만 살아남은 것은 아니었다. 다만 그 말을 입 밖으로 낸 적은 없었다.'
      ].join('\n\n')
    }
  };

  const addIntroAfter = (anchorScene, page) => {
    if (!Array.isArray(D.intro) || D.intro.some((entry) => entry.scene === page.scene)) return;
    const anchor = D.intro.findIndex((entry) => entry.scene === anchorScene);
    D.intro.splice(anchor < 0 ? D.intro.length : anchor + 1, 0, page);
  };

  addIntroAfter('intro-busan-room-morning-v1', introPages.water);
  addIntroAfter('intro-workday-return-v1', introPages.coldStorage);
  addIntroAfter('intro-busan-cold-storage-v1', introPages.generator);

  if (typeof introBeats !== 'undefined') {
    Object.assign(introBeats, {
      'intro-busan-water-line-v1': [
        {kind: 'narration', text: '급수대가 열리기 전인데도 계단 아래까지 빈 통이 늘어서 있었다. 내 통 옆에는 처음 보는 통이 하나 더 놓여 있었다.'},
        {kind: 'dialogue', who: 'passer_elder', name: '순자 아줌마', text: '그건 정희네 거야. 애가 밤새 열이 나서 못 내려왔어.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '제 것 하나 들기도 빠듯한데요.'},
        {kind: 'dialogue', who: 'passer_elder', name: '순자 아줌마', text: '알아. 말은 그래도 들어다 줄 거잖아.'},
        {kind: 'narration', text: '물이 나오자 밸브 아래로 가느다란 줄기가 새었다. 맨 앞의 아이가 신발을 적시며 손가락으로 가리켰다.'},
        {kind: 'dialogue', who: 'passer_child', name: '줄을 지키던 아이', text: '아저씨, 여기서도 물 나와요.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '그건 나오면 안 되는 물인데.'},
        {kind: 'narration', text: '나는 통을 내려놓고 몽키스패너를 꺼냈다. 뒤에서 한숨이 들렸지만 누구도 먼저 통을 들이밀지는 않았다.'},
        {kind: 'dialogue', who: 'passer_elder', name: '순자 아줌마', text: '천천히 해. 지난번처럼 나사 머리 뭉개지 말고.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '지난번은 제가 한 게 아니에요.'},
        {kind: 'dialogue', who: 'passer_elder', name: '순자 아줌마', text: '그래. 나사 혼자 그랬겠지.'},
        {kind: 'narration', text: '물이 멎자 누군가 내 통부터 채워 주었다. 나는 두 통을 들고 정희네 집이 있는 언덕으로 올라갔다.'}
      ],
      'intro-busan-cold-storage-v1': [
        {kind: 'narration', text: '공동 냉동창고 안은 바닥만 차갑고 공기는 미지근했다. 녹은 물이 생선 상자 아래로 번지고 있었다.'},
        {kind: 'dialogue', who: 'passer_merchant', name: '장터 상인', text: '한 시간만 더 이러면 오늘 장사는 접어야 해.'},
        {kind: 'dialogue', who: 'passer_medic', name: '진료소 직원', text: '약 상자부터 다른 데로 옮기면 안 될까요?'},
        {kind: 'dialogue', who: 'me', name: '나', text: '문부터 닫아 주세요. 계속 열어 두면 고쳐도 온도가 안 내려갑니다.'},
        {kind: 'dialogue', who: 'passer_merchant', name: '장터 상인', text: '안이 안 보이잖아.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '저도 안 보이니까 손전등 좀 비춰 주세요.'},
        {kind: 'narration', text: '상인은 문을 닫고 내 어깨 너머로 불을 비췄다. 진료소 직원은 바닥의 물을 퍼냈다.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '전원 올립니다. 뒤로 한 걸음만요.'},
        {kind: 'narration', text: '압축기가 떨리다 낮은 소리를 냈다. 온도계 바늘이 아주 조금 내려갔다.'},
        {kind: 'dialogue', who: 'passer_merchant', name: '장터 상인', text: '앉아서 이거라도 먹고 가.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '다음 수리가 남았어요.'},
        {kind: 'dialogue', who: 'passer_merchant', name: '장터 상인', text: '씹는 동안 냉동기 안 도망가.'},
        {kind: 'narration', text: '나는 주먹밥을 반쯤 먹었다. 나머지는 종이에 다시 싸서 주머니에 넣었다.'}
      ],
      'intro-busan-generator-night-v1': [
        {kind: 'narration', text: '발전기를 끄기 삼십 분 전이면 공동 마당이 제일 밝았다. 사람들은 그 짧은 시간에 충전과 빨래와 저녁을 한꺼번에 끝냈다.'},
        {kind: 'dialogue', who: 'passer_worker', name: '발전기 당번', text: 'B골목 십 분 남았습니다. 더 쓸 집 있어요?'},
        {kind: 'dialogue', who: 'passer_woman', name: '골목 주민', text: '우리 집은 됐어요. 그 십 분 약방 냉장고에 붙여 줘요.'},
        {kind: 'dialogue', who: 'passer_worker', name: '발전기 당번', text: '어제도 양보했잖아요.'},
        {kind: 'dialogue', who: 'passer_woman', name: '골목 주민', text: '양말이야 내일 말리죠. 냉장고 꺼지면 약 또 버려야 하잖아요.'},
        {kind: 'narration', text: '마당 끝 전구 하나가 꺼졌다. 나는 달구지 옆에서 장부를 정리했다.'},
        {kind: 'dialogue', who: 'passer_elder', name: '순자 아줌마', text: '수리집. 밥 먹고 가.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '먹었어요.'},
        {kind: 'dialogue', who: 'passer_child', name: '줄을 지키던 아이', text: '거짓말. 아까 냄비 비어 있었는데.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '너는 그런 걸 왜 보고 다녀.'},
        {kind: 'narration', text: '순자 아줌마가 빈 의자에 국그릇을 놓았다. 나는 장부를 덮고 앉았다.'},
        {kind: 'thought', who: 'me', name: '나', text: '한 그릇만 먹고 올라가자.'}
      ]
    });
    introPages.water.beats = introBeats[introPages.water.scene];
    introPages.coldStorage.beats = introBeats[introPages.coldStorage.scene];
    introPages.generator.beats = introBeats[introPages.generator.scene];
  }

  /* 한 번의 심부름으로 끝나지 않는 지역 이야기. 엔진이 현재 정착지를 기준으로
     목적지를 골라 주므로 어느 경로를 택해도 세 단계가 이어진다. */
  const storyQuestChains = [
    {
      id: 'relay', title: '세 마을의 무전',
      steps: [
        {kind: 'deliver', item: '끊긴 중계소의 호출 장부', prompt: '옆 마을 중계소가 사흘째 대답이 없어요. 이 장부를 건네고, 어느 시간대에 무전을 듣는지만 확인해 주세요.'},
        {kind: 'express', item: '확인된 주파수표', prompt: '첫 마을에서 답이 왔어요. 아직 듣고 있는 곳이 하나 더 있다네요. 신호가 바뀌기 전에 이 주파수표를 전해 주세요.'},
        {kind: 'deliver', item: '세 마을의 교대 장부', prompt: '이제 세 곳이 같은 시간에 무전을 들을 수 있어요. 처음 부탁한 사람에게 교대 장부를 돌려주면 됩니다.'}
      ],
      completion: '떨어져 있던 세 마을이 아침과 저녁에 같은 주파수를 듣기 시작했다.'
    },
    {
      id: 'clinic', title: '비지 않는 약장',
      steps: [
        {kind: 'express', item: '냉장 약품 상자', prompt: '냉장고가 버티는 동안 옆 진료소까지 가져가 주세요. 늦으면 약보다 얼음만 남습니다.'},
        {kind: 'deliver', item: '빈 병상과 약품 명단', prompt: '약은 도착했는데 어디에 얼마나 남았는지 서로 몰라요. 다음 진료소에 이 명단을 보여 주고 빠진 것을 적어 와 주세요.'},
        {kind: 'deliver', item: '세 진료소의 약품 배분표', prompt: '급한 집부터 나눌 순서를 정했어요. 처음 약을 내준 진료소에도 이 표를 돌려줘야 합니다.'}
      ],
      completion: '세 진료소가 남은 약과 빈 병상을 함께 기록하기 시작했다.'
    },
    {
      id: 'letters', title: '주소가 번진 편지',
      steps: [
        {kind: 'deliver', item: '주소가 번진 편지 묶음', prompt: '비에 젖어서 동네 이름이 반쯤 지워졌어요. 받는 사람을 아는지 옆 마을에 한 번만 물어봐 주세요.'},
        {kind: 'deliver', item: '이름을 확인한 수신인 명단', prompt: '두 사람은 찾았고, 한 사람은 더 북쪽으로 갔대요. 이름과 필체를 대조한 명단을 그쪽에 전해 주세요.'},
        {kind: 'deliver', item: '늦게 도착한 세 통의 답장', prompt: '답장이 생겼어요. 처음 편지를 맡긴 사람도 기다리고 있을 겁니다. 돌아가는 길에 전해 주세요.'}
      ],
      completion: '오래 길을 잃었던 편지 세 통이 답장을 달고 처음 마을로 돌아왔다.'
    }
  ];
  D.storyQuestChains = D.storyQuestChains || [];
  for (const chain of storyQuestChains) {
    if (!D.storyQuestChains.some((entry) => entry.id === chain.id)) D.storyQuestChains.push(chain);
  }

  D.companionMilestones = Object.assign({
    minji: ['같이 일하는 방식을 맞춘다', '민규의 신호를 함께 따라간다', '혼자 남은 이유를 끝까지 듣는다'],
    parkss: ['서로의 몸 상태를 살핀다', '명단 속 사람들의 삶을 되짚는다', '남겨진 이름을 증언으로 바꾼다'],
    kangwoo: ['차 안에서 지킬 선을 정한다', '후임이 고친 경계선을 따라가 본다', '수비대에서 있었던 일을 끝까지 듣는다'],
    leo: ['농담 뒤의 침묵을 알아챈다', '끝내지 못한 노래를 함께 붙든다', '길 위 사람들의 목소리로 노래를 완성한다'],
    jaeyi: ['아버지의 상자에 남길 것을 고른다', '열쇠가 가리키는 곳까지 동행한다', '떠나온 자리와 다시 마주한다'],
    eunsu: ['녹음기를 끄고 차 안의 말을 듣는다', '관제실에서 놓친 신호를 다시 연다', '자신이 남긴 접속 코드의 책임을 진다']
  }, D.companionMilestones || {});

  const chats = [
    {
      id: 'daily-minji-parkss-meal',
      need: {comp: 'minji', comp2: 'parkss'},
      lines: [
        ['parkss', '민지 양, 점심 안 먹었지.'],
        ['minji', '먹었어요. 국물.'],
        ['parkss', '밥은 그대로던데.'],
        ['minji', '선생님은 왜 남의 그릇까지 봐요?'],
        ['parkss', '렌치 든 손이 떨리니 그렇지.'],
        ['minji', '반만 먹을게요. 다 먹으라고 하면 안 먹습니다.'],
        ['parkss', '그래. 국 식기 전에 먹게.'],
        ['sys', '민지는 투덜거리면서도 숟가락을 들었다. 박 선생은 더 말하지 않았다.']
      ]
    },
    {
      id: 'daily-minji-jaeyi-tools',
      need: {comp: 'minji', comp2: 'jaeyi'},
      lines: [
        ['minji', '내 줄칼 누가 썼어요? 끝에 철가루가 그대로인데.'],
        ['jaeyi', '저요. 손잡이 깨진 칼 다듬었어요.'],
        ['minji', '쓰는 건 괜찮은데 말은 하고 가져가요.'],
        ['jaeyi', '민지 씨 자고 있었잖아요.'],
        ['minji', '깨우라는 말은 아니고… 쪽지라도요. 없어진 줄 알았어요.'],
        ['jaeyi', '알았어요. 철가루도 제가 털게요.'],
        ['minji', '기름도 한 번 발라 주세요.'],
        ['jaeyi', '빌린 값이 자꾸 오르네요.'],
        ['sys', '재이는 웃지 않았지만 줄칼을 받아 들었다. 그날 밤 공구함에는 짧은 쪽지가 하나 붙었다.']
      ]
    },
    {
      id: 'daily-minji-eunsu-sleep',
      need: {comp: 'minji', comp2: 'eunsu'},
      lines: [
        ['minji', '은수 언니, 새벽 세 시에 녹음기 딸깍거리는 소리 들려요.'],
        ['eunsu', '버튼 소리가 그렇게 컸어요?'],
        ['minji', '차가 조용하면 작은 소리도 커져요.'],
        ['eunsu', '미안해요. 낮에 놓친 주파수를 다시 들었어요.'],
        ['minji', '하지 말라는 건 아니에요. 밑에 천 좀 깔아요. 담요도 덮고요.'],
        ['eunsu', '담요도 녹음기에요?'],
        ['minji', '담요는 언니요. 기침도 들려요.'],
        ['sys', '은수는 잠시 대답하지 못했다. 다음 날 녹음기 아래에는 접은 천 조각이 깔려 있었다.']
      ]
    },
    {
      id: 'daily-minji-kangwoo-check',
      need: {comp: 'minji', comp2: 'kangwoo'},
      lines: [
        ['kangwoo', '왼쪽 뒤 바퀴, 방금 봤지.'],
        ['minji', '봤어요.'],
        ['kangwoo', '그런데 또 보네.'],
        ['minji', '두 번 보면 안 빠지니까요.'],
        ['kangwoo', '네가 두 번 본다고 볼트가 겁먹진 않아.'],
        ['minji', '아저씨가 한 번만 확인해도 괜찮다는 말을 믿는 것보다는 낫죠.'],
        ['kangwoo', '그건 맞아. 그래도 오늘은 내가 한 번 더 볼게. 넌 손 씻어.'],
        ['minji', '…표시선 어긋나면 불러요.'],
        ['sys', '민지는 세 걸음 갔다가 돌아보지 않았다. 강우는 그제야 바퀴 옆에 쪼그려 앉았다.']
      ]
    },
    {
      id: 'daily-parkss-leo-sleep',
      need: {comp: 'parkss', comp2: 'leo'},
      lines: [
        ['parkss', '레오, 어젯밤에도 못 잤나?'],
        ['leo', '잤습니다. 눈 감고 네 시간이나 누워 있었어요.'],
        ['parkss', '그건 누워 있었던 거고.'],
        ['leo', '선생님 기준은 늘 엄격하네요.'],
        ['parkss', '오늘은 농담이 늦게 나오더군.'],
        ['leo', '몇 초 늦었습니까? 기록 경신할 정도예요?'],
        ['parkss', '묻진 않겠네. 대신 운전석 옆에 기대 자지는 말게. 목 꺾여.'],
        ['leo', '그럼 뒷자리에서 조용히 기록을 노리겠습니다.'],
        ['sys', '박 선생은 담요를 건넸다. 레오는 이번에는 농담을 덧붙이지 않았다.']
      ]
    },
    {
      id: 'daily-parkss-eunsu-names',
      need: {comp: 'parkss', comp2: 'eunsu'},
      lines: [
        ['eunsu', '이 명단, 같은 성이 네 번 나와요. 한 가족일 수도 있겠네요.'],
        ['parkss', '이름부터 좀 읽어 주겠나.'],
        ['eunsu', '김분희, 김정호, 김도현, 김유나.'],
        ['parkss', '분희 할머니는 매운 걸 못 먹었지. 정호 씨는 주사만 보면 딴청을 피웠고.'],
        ['eunsu', '선생님이 아는 분들이군요.'],
        ['parkss', '알았던 사람들이네. 명단에는 그런 게 안 남으니.'],
        ['eunsu', '옆에 적어도 돼요? 확인된 것만.'],
        ['parkss', '매운 거 못 먹는 건 확실하네. 밥상에서 여러 번 들었거든.'],
        ['sys', '은수는 이름 옆에 작은 글씨를 보탰다. 박 선생은 그가 다 쓸 때까지 기다렸다.']
      ]
    },
    {
      id: 'daily-kangwoo-jaeyi-gear',
      need: {comp: 'kangwoo', comp2: 'jaeyi'},
      lines: [
        ['jaeyi', '아저씨, 이 조끼도 계속 실을 거예요? 곰팡이 피는데.'],
        ['kangwoo', '실어.'],
        ['jaeyi', '그럼 옮겨요. 젖은 짐 옆에 두면 안 돼요.'],
        ['kangwoo', '주인이 있어.'],
        ['jaeyi', '돌려줄 사람이 있어요?'],
        ['kangwoo', '돌아올지 몰라. 일단 갖고 있을 거다.'],
        ['jaeyi', '알겠어요. 그럼 곰팡이부터 닦아요. 이대로는 돌려줘도 못 입어요.'],
        ['kangwoo', '솔은 내가 잡을게.'],
        ['sys', '둘은 조끼를 펴 놓고 한동안 말없이 닦았다. 누구 것인지 묻는 말은 다시 나오지 않았다.']
      ]
    },
    {
      id: 'daily-kangwoo-leo-nightmare',
      need: {comp: 'kangwoo', comp2: 'leo'},
      lines: [
        ['leo', '형, 새벽에 제 기타 가방을 발로 찼어요.'],
        ['kangwoo', '미안하다.'],
        ['leo', '기타는 멀쩡해요. 형 발은요?'],
        ['kangwoo', '멀쩡해.'],
        ['leo', '그럼 됐어요. 오늘은 가방을 반대편에 둘게요.'],
        ['kangwoo', '왜 그랬는지 안 물어보나.'],
        ['leo', '말하고 싶으면 형이 먼저 말하겠죠. 대신 다음에는 제 발을 차요. 기타보다 싸게 고쳐요.'],
        ['kangwoo', '그건 못 믿겠는데.'],
        ['sys', '레오가 웃자 강우도 입꼬리를 아주 조금 움직였다. 그날 밤 기타 가방은 두 사람 사이가 아닌 문 쪽에 놓였다.']
      ]
    },
    {
      id: 'daily-kangwoo-eunsu-orders',
      need: {comp: 'kangwoo', comp2: 'eunsu'},
      lines: [
        ['kangwoo', '은수, 라디오 끄고 자.'],
        ['eunsu', '명령입니까?'],
        ['kangwoo', '…아니. 부탁이다. 내일 네가 첫 교대라서.'],
        ['eunsu', '명령처럼 들렸습니다.'],
        ['kangwoo', '예전 버릇이야. 고치고 있다.'],
        ['eunsu', '그럼 다시 말해 보세요.'],
        ['kangwoo', '내일 첫 교대 대신 설 수는 없어. 두 시간이라도 자 줘.'],
        ['eunsu', '무슨 말인지 알겠어요. 십 분만 정리하고 끌게요.'],
        ['sys', '강우는 고개를 끄덕였다. 십 분 뒤 라디오는 정말 꺼졌다.']
      ]
    },
    {
      id: 'daily-leo-jaeyi-pick',
      need: {comp: 'leo', comp2: 'jaeyi'},
      lines: [
        ['jaeyi', '오빠, 이 피크도 주머니에 넣어요? 끝이 많이 닳았는데.'],
        ['leo', '그건 따로요. 아직 쓰는 거예요.'],
        ['jaeyi', '새것도 있잖아요. 늘 이걸 찾길래.'],
        ['leo', '우리 형이 처음 만들어 준 거예요.'],
        ['jaeyi', '그럼 안쪽 주머니요. 고철이랑 섞이지 않게.'],
        ['leo', '아, 거기도 주머니가 있었어요?'],
        ['jaeyi', '지금 달아 드릴게요. 안쪽은 비었으니까.'],
        ['leo', '그럼 거기 둘게요. 재이 씨, 한 번만 벌려 줘요.'],
        ['sys', '재이가 안쪽에 작은 천 주머니를 달아 벌려 보였다. 레오는 피크를 넣고 바깥에서 한 번 눌러 봤다.']
      ]
    },
    {
      id: 'daily-leo-eunsu-unfinished',
      need: {comp: 'leo', comp2: 'eunsu'},
      lines: [
        ['eunsu', '아까 그 곡, 끝부분은요?'],
        ['leo', '있었는데 잊었어요.'],
        ['eunsu', '녹음된 옛 버전을 찾으면 되살릴 수 있어요.'],
        ['leo', '그 버전이 싫어서 바꾸던 중이었어요.'],
        ['eunsu', '그럼 지금 곡은 아직 덜 만든 거네요.'],
        ['leo', '누나는 미완성인 거 싫어하죠?'],
        ['eunsu', '아니요. 덜 만들었는데 다 끝났다고 하는 게 싫어요.'],
        ['leo', '그 말, 가사로 써도 돼요? 지금은 끝났다고 쓰지 말라고.'],
        ['eunsu', '제가 부르지만 않으면요.'],
        ['sys', '레오는 두 음을 더 쳤다가 멈췄다. 이번에는 멈춘 자리도 곡처럼 들렸다.']
      ]
    },
    {
      id: 'daily-jaeyi-eunsu-unknown',
      need: {comp: 'jaeyi', comp2: 'eunsu'},
      lines: [
        ['jaeyi', '언니, 상자에는 의료용이라고 쓰였는데 재봉 바늘만 있네요.'],
        ['eunsu', '누가 라벨을 바꿨을 수도 있어요.'],
        ['jaeyi', '처음부터 아무렇게나 넣었을 수도 있고요.'],
        ['eunsu', '그럴 수도 있어요.'],
        ['jaeyi', '그럼 언니도 아직 모르는 거네요.'],
        ['eunsu', '네. 라벨만 보고 적었어요. 이 줄은 고칠게요.'],
        ['jaeyi', '그럼 재봉 칸에 둘게요. 주인 만나면 물어보고요.'],
        ['eunsu', '라벨에는 물음표를 붙일게요.'],
        ['sys', '두 사람은 낡은 글씨를 지우지 않고 그 옆에 작은 물음표만 보탰다.']
      ]
    },
    {
      id: 'daily-me-minji-hands',
      need: {comp: 'minji'},
      lines: [
        ['me', '손에 기름이 안 빠지네.'],
        ['minji', '모래로 문지르면 빨리 빠져. 피부도 같이 빠져서 그렇지.'],
        ['me', '좋은 방법은 아니네.'],
        ['minji', '대장님, 기름 묻은 손으로 비누부터 잡지 마. 걸레 여기.'],
        ['me', '혼자 할 수 있어.'],
        ['minji', '알아. 그러니까 번갈아 씻자고. 비누 둘 다 까매지기 전에.'],
        ['sys', '민지는 말없이 비누 조각을 반으로 잘라 건넸다. 나는 더 거절하지 않았다.']
      ]
    },
    {
      id: 'daily-me-parkss-patch',
      need: {comp: 'parkss'},
      lines: [
        ['me', '선생님, 그 파스 어제도 같은 데 붙였죠.'],
        ['parkss', '남의 어깨는 잘 보면서 자기 허리는 안 보이나.'],
        ['me', '제 허리는 아직 움직여요.'],
        ['parkss', '내 어깨도 움직이네. 아픈 채로.'],
        ['me', '운전은 제가 할 테니까 오늘 짐은 들지 마세요.'],
        ['parkss', '그럼 자네도 저녁에는 허리 보여 줘. 서로 한 번씩만 잔소리하자고.'],
        ['me', '한 번으로 끝낼 자신 있어요?'],
        ['parkss', '없네. 그래도 한 번으로 해 보세.']
      ]
    },
    {
      id: 'daily-me-kangwoo-seat',
      need: {comp: 'kangwoo'},
      lines: [
        ['me', '뒷자리가 더 넓은데 왜 늘 조수석에 앉아요?'],
        ['kangwoo', '문이 가까워서.'],
        ['me', '멀미하는 줄 알았는데요.'],
        ['kangwoo', '그것도 조금.'],
        ['me', '내릴 일 생기면 먼저 말해요. 달리는 차에서 문부터 잡지 말고요.'],
        ['kangwoo', '그런 적 없어.'],
        ['me', '어제 손잡이 잡은 건 봤어요.'],
        ['kangwoo', '…알았어. 다음엔 말할게. 조수석은 그대로 두고.'],
        ['sys', '그 뒤로 강우는 문을 확인한 다음 안전띠부터 맸다. 자리를 바꾸지는 않았다.']
      ]
    },
    {
      id: 'daily-me-leo-blanket',
      need: {comp: 'leo'},
      lines: [
        ['me', '내 담요 못 봤어요?'],
        ['leo', '보리는 봤습니다. 아주 마음에 들어 하던데요.'],
        ['me', '그건 대답이 아닌데요.'],
        ['leo', '보리 배 밑에 있다는 뜻입니다. 꺼내려면 협상이 필요해요.'],
        ['me', '협상 조건은요?'],
        ['leo', '말린 고기 한 조각. 제가 통역비로 반 조각.'],
        ['me', '그냥 오늘은 작업복 입고 잘게요.'],
        ['leo', '잠깐만요. 통역비는 포기할 테니까 사람답게 주무세요.'],
        ['sys', '레오는 보리에게 한참 사정한 끝에 털투성이 담요를 돌려주었다.']
      ]
    },
    {
      id: 'daily-me-jaeyi-wrench',
      need: {comp: 'jaeyi'},
      lines: [
        ['jaeyi', '이 렌치, 턱이 벌어졌네요. 이대로 쓰면 볼트도 뭉개지겠어요.'],
        ['me', '그래도 그건 못 버려요.'],
        ['jaeyi', '대장님 할아버지 거죠?'],
        ['me', '네. 쓸 때마다 손이 미끄러지는데도 못 버리겠어요.'],
        ['jaeyi', '그럼 공구 칸에서는 빼요. 급할 때 또 집어 들겠어요.'],
        ['me', '어디다 두게요?'],
        ['jaeyi', '안쪽 칸에요. 손잡이에 표시할게요. 쓸 공구랑 안 섞이게.'],
        ['sys', '재이는 렌치 손잡이에 천을 감아 표시했다. 자주 쓰는 공구와 섞이지 않게 안쪽 칸에 넣었다.']
      ]
    },
    {
      id: 'daily-me-eunsu-offrecord',
      need: {comp: 'eunsu'},
      lines: [
        ['me', '오늘 얘기는 녹음하지 말아 줄래요?'],
        ['eunsu', '왜요? 물어봐도 돼요?'],
        ['me', '기록으로 남으면 내가 제대로 말해야 할 것 같아서요. 지금은 그냥 말하고 싶어요.'],
        ['eunsu', '알겠어요.'],
        ['me', '정말 껐어요?'],
        ['eunsu', '배터리도 뺐어요. 그래도 신경 쓰이면 가지고 계세요.'],
        ['me', '그 정도까지는 안 해도 되는데요.'],
        ['eunsu', '저는 이래야 마음이 놓여요. 대장님은 그냥 말씀하세요.'],
        ['sys', '나는 배터리를 손에 쥔 채 한참 있다가, 부산 작업장 이야기를 처음부터 꺼냈다.']
      ]
    },
    {
      id: 'thread-parent-key-minji', arc: true, once: true,
      need: {comp: 'minji', flag: 'parent_key_found', minBond: {minji: 8}},
      lines: [
        ['me', '엄마 장치, 자꾸 열어 보고 싶어.'],
        ['minji', '뜯기 전에 수첩부터 보기로 했잖아.'],
        ['me', '그래서 안 열고 있잖아.'],
        ['minji', '오늘은 내가 들고 있을까? 계속 만지작거리길래.'],
        ['me', '그 정도로 못 믿을 사람은 아니야.'],
        ['minji', '알아. 그럼 나사 쪽은 그만 만져. 열고 싶으면 수첩 같이 보자.'],
        ['sys', '나는 장치를 내려놓고 수첩을 폈다. 민지가 옆으로 와 계기판 분해도가 있는 장을 짚었다.']
      ]
    },
    {
      id: 'thread-massacre-kangwoo', arc: true, once: true,
      need: {comp: 'kangwoo', flag: 'massacre_known', minBond: {kangwoo: 6}},
      lines: [
        ['kangwoo', '오늘은 문 쪽에서 잘게.'],
        ['me', '어제도 그랬잖아요.'],
        ['kangwoo', '오늘은 잠이 안 올 것 같아서.'],
        ['me', '그 기록 때문이에요?'],
        ['kangwoo', '눈 감으면 그때 문 열리던 소리가 나. 오늘은 좀 앉아 있을게.'],
        ['me', '불은 놔둘까요?'],
        ['kangwoo', '그래. 누가 문을 열면 이번에는 깨어 있고 싶다.'],
        ['sys', '나는 더 묻지 않고 문 반대편에 자리를 폈다. 가운데 통로는 비워 두었다.']
      ]
    },
    {
      id: 'thread-low-fuel-minji-jaeyi', arc: true, once: true,
      need: {comps: ['minji', 'jaeyi'], lowFuel: 1, afterKm: 45},
      lines: [
        ['jaeyi', '다음 주유소까지 가기엔 모자라는데요.'],
        ['minji', '세 번 계산했어요. 내리막에서 공회전 줄이면 닿아요.'],
        ['jaeyi', '안 닿으면요?'],
        ['minji', '그때는 제가 걸어서 기름 구해 올게요.'],
        ['jaeyi', '그때 저도 가요. 빈 통 들고 갈 사람 하나 더 있으면 낫죠.'],
        ['minji', '언니도 걸어가게요?'],
        ['jaeyi', '가득 찬 기름통 혼자 들게요?'],
        ['sys', '민지는 연료계를 한 번 더 보더니 조수석 아래에 빈 기름통 두 개를 꺼내 놓았다.']
      ]
    },
    {
      id: 'thread-tired-parkss-kangwoo', arc: true, once: true,
      need: {comps: ['parkss', 'kangwoo'], tired: 1, afterKm: 70},
      lines: [
        ['parkss', '강우 씨, 오늘 하품 일곱 번째네.'],
        ['kangwoo', '세고 있었어요?'],
        ['parkss', '네 번째부터 셌네. 처음엔 그냥 넘겼지.'],
        ['kangwoo', '다음 정차 때 잘게요.'],
        ['parkss', '그 말도 세 번째야.'],
        ['kangwoo', '그것도 셌어요?'],
        ['parkss', '그러다 다치면 내 일도 늘어. 오늘은 약사 좀 놀게 해 주게.'],
        ['sys', '강우는 대꾸 대신 다음 정차 지점에 동그라미를 쳤다. 박 선생은 그제야 장부를 덮었다.']
      ]
    },
    {
      id: 'thread-resistance-leo-eunsu', arc: true, once: true,
      need: {comps: ['leo', 'eunsu'], flag: 'resist_revealed', minBond: {leo: 5, eunsu: 5}},
      lines: [
        ['leo', '저 사람들 암호는 왜 전부 날씨 얘기예요? 맑음, 소나기, 북서풍.'],
        ['eunsu', '평범한 말이어야 오래 쓸 수 있어요.'],
        ['leo', '그럼 헷갈리지 않아요? 오늘 진짜 비 오면요?'],
        ['eunsu', '그래서 시간을 같이 말해요. 날씨는 약속 시간까지 맞히지 못하니까요.'],
        ['leo', '노래로 만들면 더 잘 외울 텐데.'],
        ['eunsu', '흥얼거리다 잡히면요?'],
        ['leo', '좋은 노래는 작게 불러도 기억합니다. 잡히지 않는 크기로 해 보죠.'],
        ['sys', '은수는 반대하지 않았다. 대신 레오가 붙인 첫 소절의 시간을 장부에 정확히 적었다.']
      ]
    },
    {
      id: 'thread-truth-parkss-eunsu', arc: true, once: true,
      need: {comps: ['parkss', 'eunsu'], flag: 'es_truth', minBond: {eunsu: 8}},
      lines: [
        ['eunsu', '제가 그날 한 번만 더 확인했으면 명단이 달라졌을까요?'],
        ['parkss', '달라졌을 수도 있지. 아닐 수도 있고.'],
        ['eunsu', '위로는 별로 안 되네요.'],
        ['parkss', '그날 자료도 안 본 내가 답을 정할 수는 없지.'],
        ['eunsu', '그럼 저는 뭘 해야 해요?'],
        ['parkss', '이번 명단부터 끝까지 보세. 자네가 본 것, 못 본 것 나눠 적고. 밥은 옆에 둘 테니.'],
        ['sys', '은수는 한참 뒤에 숟가락을 들었다. 박 선생은 명단을 치우지 않고 그 옆에 그대로 두었다.']
      ]
    },
    {
      id: 'thread-side-relay', arc: true, once: true,
      need: {comps: ['leo', 'eunsu'], flag: 'story_chain_relay_1'},
      lines: [
        ['eunsu', '첫 마을에서 정말 답이 올 줄은 몰랐어요.'],
        ['leo', '저도요. 처음엔 잡음인 줄 알았어요.'],
        ['eunsu', '관제실에선 대답이 없는 쪽부터 지웠어요.'],
        ['leo', '그럼 오늘은 한 번 더 불러 봐요. 못 들었을 수도 있으니까.'],
        ['eunsu', '네. 다음 마을 이름부터 확인할게요.'],
        ['leo', '받는 분 이름도요. 이번엔 제가 안 끼어들게요.']
      ]
    },
    {
      id: 'thread-side-clinic', arc: true, once: true,
      need: {comps: ['parkss', 'jaeyi'], flag: 'story_chain_clinic_2'},
      lines: [
        ['jaeyi', '약 나눌 순서까지 우리가 정해야 해요?'],
        ['parkss', '우리가 정할 일은 아니지. 세 진료소가 서로 뭘 가졌는지 알게는 해 줘야 해.'],
        ['jaeyi', '보고도 자기 것부터 챙기면요?'],
        ['parkss', '그럴 수도 있네. 그래서 가져간 수량도 적으라는 거고.'],
        ['jaeyi', '가져간 거 빼먹으면 어떻게 알아요?'],
        ['parkss', '다음 진료소에서 받은 수량이랑 맞춰 봐야지. 자네 장부 좀 빌려주게.']
      ]
    },
    {
      id: 'thread-side-letters', arc: true, once: true,
      need: {comps: ['minji', 'kangwoo'], flag: 'story_chain_letters_2'},
      lines: [
        ['minji', '답장 세 통이 원래 편지보다 더 무겁네요.'],
        ['kangwoo', '종이가 늘었으니까.'],
        ['minji', '그 얘기가 아닌데요.'],
        ['kangwoo', '알아. 무거운 건 내가 들겠다는 얘기야.'],
        ['minji', '그럼 그렇게 말하면 되잖아요.'],
        ['kangwoo', '지금 했어.'],
        ['sys', '민지는 편지 묶음을 강우에게 넘겼다. 끈이 풀리지 않도록 매듭만 다시 묶어 주었다.']
      ]
    },
    {
      id: 'thread-three-dinner', arc: true, once: true,
      need: {comps: ['minji', 'leo', 'parkss'], party: 3, afterKm: 95},
      lines: [
        ['leo', '오늘 국 누가 끓였어요? 맛있다고 하기 전에 누구한테 해야 할지 알아야죠.'],
        ['minji', '선생님이 끓였고 제가 소금 넣었어요.'],
        ['parkss', '두 번 넣었지.'],
        ['minji', '레오가 말 걸어서 몇 번 넣었는지 잊었어요.'],
        ['leo', '그럼 저는 물을 더 붓는 쪽으로 책임지겠습니다.'],
        ['parkss', '먹어 보고 붓게. 레오, 물통 이리 주고. 민지 양은 소금 내려놓고.'],
        ['minji', '더 넣을 생각 없었어요.'],
        ['leo', '저는 물도 한 번만 부을게요.'],
        ['sys', '결국 물을 조금 더 붓고 감자 하나를 잘라 넣었다. 국은 먹을 만했고 누구도 자기 덕이라고 하지 않았다.']
      ]
    },
    {
      id: 'thread-three-night-watch', arc: true, once: true,
      need: {comps: ['kangwoo', 'eunsu', 'jaeyi'], party: 3, night: 1, afterKm: 120},
      lines: [
        ['jaeyi', '보초 둘이면 충분한데 왜 셋 다 깨어 있어요?'],
        ['eunsu', '저는 보초 아니라 녹음 정리하고 있어요.'],
        ['kangwoo', '나는 둘 다 자라고 기다리는 중이고.'],
        ['jaeyi', '그럼 서로 자라고 하느라 못 자는 거네요.'],
        ['eunsu', '그럼 제가 먼저 서면 되잖아요. 두 분 먼저 자요.'],
        ['kangwoo', '은수는 새벽 교대. 재이도 먼저 자. 한 시간 뒤에 은수를 깨울게.'],
        ['jaeyi', '아저씨는 언제 자는데요?'],
        ['kangwoo', '둘이 더 물으면 지금.'],
        ['sys', '재이가 먼저 담요를 뒤집어썼고 은수는 녹음기를 껐다. 강우는 정말 한 시간 뒤에 자리를 넘겼다.']
      ]
    }
  ];

  if (Array.isArray(D.chats)) {
    for (const chat of chats) {
      if (!D.chats.some((entry) => entry.id === chat.id)) D.chats.push(chat);
    }
  }

  const bridgeEvents = [
    {
      id: 'story_bridge_departure_echo',
      scene: 'story-bridge-departure-echo-v1',
      type: '사건',
      w: 1,
      once: true,
      noPool: true,
      title: '부산 뒤에 남은 방송',
      text: '부산 항만 방송이 잡음 속으로 멀어질 즈음, 꺼 둔 줄 알았던 수신기가 혼자 켜졌다. 내일 새벽 동부 노선 이송자 명단. 도윤 가족 아래로 처음 보는 이름이 열일곱 줄 더 내려갔다. 부산을 빠져나오면 끝날 거라고 믿은 사람은 없었다. 그래도 다음 종이가 벌써 나올 줄은 몰랐다.',
      choices: [
        {
          label: '발신 시각과 주파수를 적어 둔다',
          out: [{
            p: 1,
            text: '명단보다 먼저 눈에 들어온 건 시각이었다. 새벽 세 시 십이 분. 사람이 확인했다면 깨어 있기 어려운 시간이었다. 승인자의 이름은 끝내 나오지 않았다.',
            fx: { time: 15, flag: 'bridge_departure_echo' }
          }]
        },
        {
          label: '방송이 끝날 때까지 이름을 받아 적는다',
          out: [{
            p: 1,
            text: '마지막 이름 뒤에 승인 안내가 붙었다. 누구의 승인인지는 말하지 않았다. 연필 끝이 몇 번이나 종이를 뚫었다.',
            fx: { fatigue: 1, flag: 'bridge_departure_echo' }
          }]
        }
      ]
    },
    {
      id: 'story_bridge_trace_gap',
      type: '추적',
      w: 1,
      once: true,
      noPool: true,
      needFlag: 'bridge_departure_echo',
      scene: 'story-bridge-trace-gap-v1',
      title: '열한 분의 빈칸',
      text: '폐쇄된 요금소 제어실에서 기록지가 아직도 조금씩 밀려 나오고 있었다. 자동 명령 발행 03:12. 버스 출발 03:16. 사람 확인 03:23. 확인자 칸은 비어 있었다. 버스가 떠난 뒤에야 사람이 승인한 셈이었다.',
      choices: [
        {
          label: '세 장의 시각을 나란히 적는다',
          out: [{
            p: 1,
            text: '먼저 움직인 건 버스였다. 사람은, 적어도 장부 안에서는, 열한 분 뒤에 나타났다. 엄마가 만들었다던 확인 절차는 사라진 게 아니었다. 순서가 뒤집혀 있었다.',
            fx: { time: 25, flag: 'bridge_trace_gap' }
          }]
        },
        {
          label: '비어 있는 확인란을 그대로 남긴다',
          out: [{
            p: 1,
            text: '빈칸 아래에는 완료 도장이 또렷했다. 누가 승인했는지를 찾으려면, 명령을 보낸 곳보다 도장을 나중에 붙인 곳부터 따라가야 했다.',
            fx: { time: 15, flag: 'bridge_trace_gap' }
          }]
        }
      ]
    },
    {
      id: 'story_bridge_watched',
      type: '위기',
      w: 1,
      once: true,
      noPool: true,
      needFlag: 'bridge_trace_gap',
      scene: 'story-bridge-watched-v1',
      title: '먼저 알아본 쪽',
      text: '전조등이 폐쇄 검문소를 훑자 감시 카메라 세 대가 동시에 돌아왔다. 렌즈가 운전석 쪽으로 기울었다. 꺼진 안내판에 짧은 문장이 떴다. 「검증 장치 운송체 확인」 계기판 안에 숨겨 두고 출발한 장치였다. 안내판을 다시 읽는 동안, 막혀 있던 앞길의 신호가 하나씩 초록으로 바뀌었다.',
      choices: [
        {
          label: '멈춰서 화면과 카메라를 기록한다',
          out: [{
            p: 1,
            text: '카메라는 피하지 않았다. 오히려 렌즈를 낮춰 운전석까지 담았다. 우리가 천리안을 쫓기 시작했다고 생각했는데, 먼저 우리를 알아본 건 저쪽이었다.',
            fx: { time: 20, pursuit: 1, flag: 'bridge_watched' }
          }]
        },
        {
          label: '카메라를 지나 열린 길로 빠져나간다',
          out: [{
            p: 1,
            text: '장치에는 손대지 않고 차를 움직였다. 카메라가 따라 돌았다. 다음 신호도 초록이었다. 백미러에서 검문소가 사라질 때까지, 안내판의 문장은 바뀌지 않았다.',
            fx: { fatigue: 2, flag: 'bridge_watched' }
          }]
        }
      ]
    },
    {
      id: 'story_bridge_parent_route',
      type: '발견',
      w: 1,
      once: true,
      noPool: true,
      needFlag: 'parent_key_found',
      scene: 'story-bridge-parent-route-v1',
      title: '같은 날, 다른 차',
      text: (S) => '바닥 수납칸 안쪽에서 오래된 화물표 두 장을 떼어 냈다. 날짜는 같았다. 아빠의 작업증 번호는 남산 기술 유지선으로, 엄마의 모듈 일련번호는 중부 이송 기록 정리소로 이어져 있었다. '+(S.flags.parents_split_known||S.flags.parents_routes_traced
        ? '운행표에서 확인한 두 경로가 달구지 안에도 남아 있었다. 종이를 펴자 접힌 자리가 하얗게 일어났다.'
        : '부산으로 올 줄 알았던 두 사람은 서로 다른 차에 배정돼 있었다. 화물표를 접지 않고 지도 옆에 놓았다.'),
      choices: [
        {
          label: '두 경로가 갈라진 지점을 지도에 표시한다',
          out: [{
            p: 1,
            text: (S) => S.flags.mother_reunited
              ? '남산 유지선과 중부 기록 정리소를 각각 표시했다. 그 뒤 엄마가 살아서 외곽 중계소까지 온 길도 이었다. 지금 엄마가 있는 곳과 내가 들어갈 곳은 다르다.'
              : '한 줄은 남산으로, 다른 줄은 중부 기록 정리소로 이어졌다. 그 뒤 엄마가 어디로 갔는지는 이 표에 없었다. 엄마를 찾는 길과 명령을 멈추는 길을 따로 표시했다.',
            fx: { time: 20, flag: 'bridge_parent_route' }
          }]
        },
        {
          label: '표를 접어 엄마의 모듈과 함께 넣는다',
          out: [{
            p: 1,
            text: (S) => '종이를 접자 오래된 기름 냄새가 났다. 할아버지는 이 두 장을 버리지 못했다. '+(S.flags.mother_reunited?'엄마에게 보여 줄 수 있도록 검증키와 다른 봉투에 넣었다.':'두 경로의 번호가 지워지지 않도록 검증키와 다른 봉투에 넣었다.'),
            fx: { flag: 'bridge_parent_route' }
          }]
        }
      ]
    },
    {
      id: 'story_bridge_child_voice',
      type: '사건',
      w: 1,
      once: true,
      noPool: true,
      needFlag: 'bridge_parent_route',
      title: '내가 남긴 적 없는 목소리',
      text: '라디오가 주파수를 몇 번 건너뛰더니 어린아이의 목소리를 틀었다. 「엄마, 우리 어디 가?」 여덟 살 때 버스 승강장에서 했던 내 말이었다. 숨을 들이쉬는 버릇까지 그대로였다. 녹음이 끝나자 지금의 안내 음성이 이어졌다. 「동일 보호 대상 확인. 남산 현장 확인 대기」',
      choices: [
        {
          label: '전원을 끈다',
          out: [{
            p: 1,
            text: '소리는 끊겼지만 수신 표시등은 꺼지지 않았다. 천리안은 오래된 기록에서 내 목소리를 꺼냈고, 내가 듣고 있다는 것도 알고 있었다.',
            fx: { fatigue: 1, flag: 'bridge_child_voice' }
          }]
        },
        {
          label: '끝까지 듣는다',
          out: [{
            p: 1,
            text: '마지막에는 길 안내가 붙었다. 가장 빠른 길도, 가장 안전한 길도 아니었다. 남산 정비 차량만 쓰던 길이었다. 초대인지 회수 명령인지 구별되지 않았다.',
            fx: { pursuit: 1, flag: 'bridge_child_voice' }
          }]
        }
      ]
    },
    {
      id: 'story_bridge_crew_question',
      type: '대화',
      w: 1,
      once: true,
      noPool: true,
      needFlag: 'bridge_child_voice',
      title: '그래도 가는 이유',
      text: (S) => '정차한 달구지에서 증거 봉투를 다시 펼쳤다. '+(S.flags.mother_reunited
        ? '엄마는 외곽 중계소에 남았고, 남산에는 내가 들어가야 한다. 수첩 귀퉁이에 적었던 질문을 다시 읽었다. 엄마를 만나면 돌아갈 줄 알았는데, 아직 출발할 일이 남아 있었다.'
        : '부모님의 경로는 둘로 갈라졌고, 남산은 나를 기다리고 있었다. 수첩 귀퉁이에 한 줄을 적었다. 엄마가 그곳에 없더라도 갈 건가. 오래 보고도 답은 저절로 생기지 않았다.'),
      choices: [
        {
          label: '이 명령만큼은 끝내야 한다',
          out: [{
            p: 1,
            text: (S) => (S.flags.mother_reunited?'엄마를 만났지만, 다른 가족들의 이송표는 아직 취소되지 않았다.':'엄마를 못 만나더라도, 내일 또 다른 아이 이름이 명단에 오르는 건 막아야 했다.')+' 그렇게 적고 나니 무서운 마음까지 사라지지는 않았다.',
            fx: { moodAll: 1, flag: 'bridge_crew_answer' }
          }]
        },
        {
          label: '엄마 곁으로 가고 싶다',
          out: [{
            p: 1,
            text: (S) => S.flags.mother_reunited
              ? '이번에는 엄마가 기다리는 쪽이고, 내가 다녀와야 하는 쪽이었다. 중계소에서 끝내지 못한 이야기가 있었다. 남산에서 돌아와 다시 마주 앉고 싶었다.'
              : '거창한 이유보다 그 말이 먼저였다. 살아 있다면 왜 돌아오지 못했는지, 내 얼굴을 기억하는지 직접 묻고 싶었다.',
            fx: { flag: 'bridge_crew_answer' }
          }]
        },
        {
          label: '둘 다다. 그래서 겁난다',
          out: [{
            p: 1,
            text: (S) => S.flags.mother_reunited
              ? '엄마 곁에 더 앉아 있고 싶었다. 이송표를 그대로 둔 채 돌아갈 수도 없었다. 증거 봉투를 닫고 남산 진입로를 다시 확인했다.'
              : '한쪽을 고르면 쉬울 줄 알았다. 아니었다. 가족을 찾는 일과 다른 가족의 이송을 막는 일을 둘 다 놓을 수 없었다.',
            fx: { moodAll: 1, fatigue: -1, flag: 'bridge_crew_answer' }
          }]
        }
      ]
    },
    {
      id: 'story_bridge_invitation',
      type: '위기',
      w: 1,
      once: true,
      noPool: true,
      needFlag: 'bridge_crew_answer',
      region: ['north'],
      scene: 'story-bridge-invitation-v1',
      title: '서울이 먼저 문을 열었다',
      text: '서울 외곽 고갯길에 들어서자 꺼져 있던 신호등이 한 칸씩 켜졌다. 앞에도 뒤에도 다른 차는 없었다. 내비게이션은 손대지 않았는데 남산 정비 차량용 길을 그렸다. 바리케이드까지 저절로 올라갔다. 막으려는 길이 아니었다. 들어오라는 길이었다.',
      choices: [
        {
          label: '수동 조작을 유지한 채 열린 길로 간다',
          out: [{
            p: 1,
            text: '핸들에서 손을 떼지 않았다. 안내선은 우리가 늦출 때마다 속도를 맞춰 줄였다. 천리안은 서두르지 않았다. 도착할 거라고 확신하는 것 같았다.',
            fx: { pursuit: 1, flag: 'bridge_invitation', chain:'story_bridge_last_quiet' }
          }]
        },
        {
          label: '평행 도로로 돌아간다',
          out: [{
            p: 1,
            text: '두 번 길을 바꿨다. 신호는 두 번 다 먼저 켜져 있었다. 어느 길을 고르든 같은 입구로 모였다.',
            fx: { time: 35, fatigue: 2, flag: 'bridge_invitation', chain:'story_bridge_last_quiet' }
          }]
        }
      ]
    },
    {
      id: 'story_bridge_last_quiet',
      type: '정경',
      w: 1,
      once: true,
      noPool: true,
      needFlag: 'bridge_invitation',
      region: ['north'],
      title: '마지막으로 시동을 끈 곳',
      text: (S) => S.party.length
        ? '남산이 보이는 마지막 고개에서 시동을 껐다. 누가 먼저 말을 꺼내지도 않았다. 증거 봉투를 다시 묶고, 물병 뚜껑을 닫고, 안전띠를 한 번씩 당겼다. 돌아갈 사람을 붙잡지 않으려고 문을 열어 두었다. 한참 뒤, 안쪽에서 미닫이문 닫히는 소리가 났다.'
        : '남산이 보이는 마지막 고개에서 시동을 껐다. 증거 봉투를 다시 묶고 물병 뚜껑도 잠갔다. 문을 열고 잠깐 서 있었지만, 도시 쪽에서는 아무 소리도 안 들렸다. 차에 올라 문을 닫고 안전띠를 당겼다.',
      choices: [
        {
          label: '시동을 건다',
          out: [{
            p: 1,
            text: '엔진이 두 번 헛돌고 세 번째에 붙었다. 아래쪽 도시에서는 우리가 오기 전부터 초록불이 켜져 있었다.',
            fx: { fatigue: -2, moodAll: 1, flag: 'bridge_last_quiet', chain:'seoul_open' }
          }]
        }
      ]
    }
  ];

  if (Array.isArray(D.events)) {
    for (const event of bridgeEvents) {
      if (!D.events.some((entry) => entry.id === event.id)) D.events.push(event);
    }
  }

  const bridgeJourneyBeats = [
    { id: 'story_bridge_departure_echo', km: 32 },
    { id: 'story_bridge_trace_gap', km: 76, when: { flag: 'bridge_departure_echo' } },
    { id: 'story_bridge_watched', km: 118, when: { flag: 'bridge_trace_gap' } },
    { id: 'story_bridge_parent_route', km: 168, when: { flag: 'parent_key_found' } },
    { id: 'story_bridge_child_voice', km: 230, when: { flag: 'bridge_parent_route' } },
    { id: 'story_bridge_crew_question', km: 305, when: { flag: 'bridge_child_voice' } },
    { id: 'story_bridge_invitation', km: 352, when: { flag: 'bridge_crew_answer', region: 'north' } },
    { id: 'story_bridge_last_quiet', km: 382, when: { flag: 'bridge_invitation', region: 'north' } }
  ];

  if (Array.isArray(D.journeyBeats)) {
    for (const beat of bridgeJourneyBeats) {
      if (!D.journeyBeats.some((entry) => entry.id === beat.id)) D.journeyBeats.push(beat);
    }
    D.journeyBeats.sort((a, b) => (a.km || 0) - (b.km || 0));
  }

  const banter = [
    {who: 'minji', t: '레오, 컵 받침에 볼트 넣었어? 물 마시려다 이빨 나갈 뻔했네.', need: {comp: 'minji', comp2: 'leo'}},
    {who: 'leo', t: '제 기타 줄은 건드리지 마세요. 빨랫줄로 쓰면 소리가 정말 우울해집니다.', need: {comp: 'leo', comp2: 'jaeyi'}},
    {who: 'parkss', t: '양말은 불 가까이에 한 켤레씩만. 어제 탄 냄새가 아직도 나네.', need: {comp: 'parkss', comp2: 'jaeyi'}},
    {who: 'kangwoo', t: '오늘 문 잠그는 순서는 내가 할게. 어제 두 번 돌아본 사람은 그냥 자.', need: {comp: 'kangwoo', comp2: 'minji'}},
    {who: 'eunsu', t: '재이 씨, 제 연필 깎았어요? 너무 잘 깎여서 다음에도 부탁하고 싶어요.', need: {comp: 'eunsu', comp2: 'jaeyi'}},
    {who: 'jaeyi', t: '보리 밥그릇이 내 것보다 멀쩡하네. 이건 좀 억울한데.', need: {comp: 'jaeyi', comp2: 'leo'}},
    {who: 'minji', t: '엔진 소리는 괜찮은데 레오 코 고는 소리는 점검해야겠어.', need: {comp: 'minji', comp2: 'leo'}},
    {who: 'parkss', t: '차가 흔들릴 때 책 읽으면 멀미해. 그래, 은수 씨한테 하는 말이야.', need: {comp: 'parkss', comp2: 'eunsu'}},
    {who: 'kangwoo', t: '선생님, 제 장갑 한 짝 못 보셨습니까. 찾으시면 세탁하지 말고 그냥 주세요.', need: {comp: 'kangwoo', comp2: 'parkss'}},
    {who: 'eunsu', t: '오늘은 아무것도 기록 안 할 거예요. 방금 한 말도 안 적었어요.', need: {comp: 'eunsu', comp2: 'leo'}},
    {who: 'leo', t: '저녁 메뉴 맞히면 한 곡 칠게요. 틀려도 칠 거라서 상품은 없어요.', need: {comp: 'leo', comp2: 'parkss'}},
    {who: 'jaeyi', t: '고장 난 의자라도 앉을 사람 있으면 버리지 마요. 먼저 고칠지 물어봐요.', need: {comp: 'jaeyi', comp2: 'minji'}}
  ];

  if (Array.isArray(D.banter)) {
    for (const line of banter) {
      if (!D.banter.some((entry) => entry.t === line.t)) D.banter.push(line);
    }
  }
})();
