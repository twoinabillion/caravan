/* Additional lived-in story scenes and human-scale crew conversations.
   Kept separate from the main data file so this layer can be tuned without
   disturbing event requirements, rewards, flags, or quest progression. */
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
    'story-bridge-parent-route-v1': 'assets/scenes/story-bridge-parent-route-v1.webp',
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
      era: '요즘 아침 · 부산 감천 공동 급수대',
      title: '물이 나오는 마흔 분',
      text: [
        '감천의 수도는 아침저녁으로 마흔 분씩만 열렸다. 사람들은 해 뜨기 전부터 통을 줄 세워 두었다. 몸이 아픈 집의 통은 이웃이 대신 가져왔고, 빈 통이 넘어지면 뒤에 선 사람이 말없이 세웠다.',
        '그날은 급수대 밸브가 새고 있었다. 내 물통을 채우러 갔다가 공구를 꺼냈다. 고친 값은 받지 않았다. 대신 정희네 몫 한 통을 언덕 위까지 들고 올라갔다.'
      ].join('\n\n')
    },
    coldStorage: {
      scene: 'intro-busan-cold-storage-v1',
      era: '요즘 낮 · 감천 공동 냉동창고',
      title: '녹으면 같이 곤란해진다',
      text: [
        '장터 뒤 냉동창고 하나에 생선과 진료소 약품이 함께 들어 있었다. 냉기가 빠지기 시작하면 상인도, 환자도 자기 것부터 꺼내 달라고 할 수밖에 없었다.',
        '나는 문을 닫게 하고 압축기 호스를 갈았다. 수리가 끝날 때까지 사람들은 젖은 바닥에 서서 기다렸다. 누가 먼저랄 것도 없이 손전등을 비추고, 물을 퍼내고, 내 공구를 건넸다.',
        '돈 대신 받은 것은 고철 두 조각과 식은 주먹밥 하나였다. 주먹밥은 그 자리에서 반만 먹고 나머지는 작업복 주머니에 넣었다.'
      ].join('\n\n')
    },
    generator: {
      scene: 'intro-busan-generator-night-v1',
      era: '요즘 밤 · 감천 언덕 공동 마당',
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
  addIntroAfter('intro-busan-workday-v1', introPages.coldStorage);
  addIntroAfter('intro-busan-cold-storage-v1', introPages.generator);

  if (typeof introBeats !== 'undefined') {
    Object.assign(introBeats, {
      'intro-busan-water-line-v1': [
        {kind: 'narration', text: '급수대가 열리기 전인데도 계단 아래까지 빈 통이 늘어서 있었다. 내 통 옆에는 처음 보는 통이 하나 더 놓여 있었다.'},
        {kind: 'dialogue', who: 'passer_elder', name: '순자 아줌마', text: '그건 정희네 거야. 애가 밤새 열이 나서 못 내려왔어.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '제 것 하나 들기도 빠듯한데요.'},
        {kind: 'dialogue', who: 'passer_elder', name: '순자 아줌마', text: '그러니까 네 옆에 놨지. 빈손 좋은 사람이 너밖에 없어서.'},
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
        {kind: 'narration', text: '상인은 문을 닫고 내 어깨 너머로 불을 비췄다. 진료소 직원은 바닥의 물을 퍼냈다. 서로 급한 것은 달랐지만 손은 같은 곳으로 모였다.'},
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
        {kind: 'dialogue', who: 'passer_woman', name: '골목 주민', text: '어제 말린 양말 오늘 다시 젖었어. 됐어.'},
        {kind: 'narration', text: '웃음이 한 번 돌고, 마당 끝 전구 하나가 꺼졌다. 나는 달구지 옆에서 장부를 정리했다.'},
        {kind: 'dialogue', who: 'passer_elder', name: '순자 아줌마', text: '수리집. 밥 먹고 가.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '먹었어요.'},
        {kind: 'dialogue', who: 'passer_child', name: '줄을 지키던 아이', text: '거짓말. 아까 냄비 비어 있었는데.'},
        {kind: 'dialogue', who: 'me', name: '나', text: '너는 그런 걸 왜 보고 다녀.'},
        {kind: 'narration', text: '순자 아줌마가 빈 의자에 국그릇을 놓았다. 나는 장부를 덮고 앉았다. 누가 고맙냐고 묻지 않아 다행이었다.'},
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
        ['parkss', '민지 씨, 점심 안 먹었죠.'],
        ['minji', '먹었어요. 국물.'],
        ['parkss', '국물은 밥을 찾고 있던데요.'],
        ['minji', '선생님은 왜 남의 그릇까지 봐요?'],
        ['parkss', '손 떠는 사람이 렌치를 잡고 있어서요.'],
        ['minji', '반만 먹을게요. 다 먹으라고 하면 안 먹습니다.'],
        ['parkss', '좋아요. 반 먹고 나면 제가 나머지는 못 본 걸로 하죠.'],
        ['sys', '민지는 투덜거리면서도 숟가락을 들었다. 박 선생은 더 말하지 않았다.']
      ]
    },
    {
      id: 'daily-minji-jaeyi-tools',
      need: {comp: 'minji', comp2: 'jaeyi'},
      lines: [
        ['minji', '내 줄칼 누가 썼어요? 끝에 철가루가 그대로인데.'],
        ['jaeyi', '나. 손잡이 깨진 칼 다듬었어.'],
        ['minji', '쓰는 건 괜찮은데 말은 하고 가져가요.'],
        ['jaeyi', '네가 자고 있었잖아.'],
        ['minji', '깨우라는 말은 아니고… 쪽지라도요. 없어진 줄 알았어요.'],
        ['jaeyi', '알겠어. 그리고 철가루는 내가 털게.'],
        ['minji', '기름도 한 번 발라 주세요.'],
        ['jaeyi', '요구가 하나씩 늘어나네.'],
        ['sys', '재이는 웃지 않았지만 줄칼을 받아 들었다. 그날 밤 공구함에는 짧은 쪽지가 하나 붙었다.']
      ]
    },
    {
      id: 'daily-minji-eunsu-sleep',
      need: {comp: 'minji', comp2: 'eunsu'},
      lines: [
        ['minji', '은수 씨, 새벽 세 시에 녹음기 딸깍거리는 소리 들려요.'],
        ['eunsu', '버튼 소리가 그렇게 컸습니까?'],
        ['minji', '차가 조용하면 작은 소리도 커져요.'],
        ['eunsu', '미안합니다. 낮에 놓친 주파수를 다시 들었습니다.'],
        ['minji', '하지 말라는 건 아니에요. 담요라도 덮고 눌러요.'],
        ['eunsu', '녹음기에 담요를요?'],
        ['minji', '은수 씨 머리에요. 기침까지 들리니까.'],
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
        ['minji', '강우 씨가 한 번만 확인해도 괜찮다는 말을 믿는 것보다는 낫죠.'],
        ['kangwoo', '그건 맞아. 그래도 오늘은 내가 한 번 더 볼게. 넌 손 씻어.'],
        ['minji', '…표시선 어긋나면 불러요.'],
        ['sys', '민지는 세 걸음 갔다가 돌아보지 않았다. 강우는 그제야 바퀴 옆에 쪼그려 앉았다.']
      ]
    },
    {
      id: 'daily-parkss-leo-sleep',
      need: {comp: 'parkss', comp2: 'leo'},
      lines: [
        ['parkss', '레오 씨, 어젯밤에도 못 잤죠?'],
        ['leo', '잤습니다. 눈 감고 네 시간이나 누워 있었어요.'],
        ['parkss', '그건 누워 있었던 거고요.'],
        ['leo', '선생님 기준은 늘 엄격하네요.'],
        ['parkss', '오늘은 농담이 늦게 나오길래요.'],
        ['leo', '몇 초 늦었습니까? 기록 경신할 정도예요?'],
        ['parkss', '말하기 싫으면 안 해도 돼요. 대신 운전석 옆에서는 자지 마요. 목 꺾여요.'],
        ['leo', '그럼 뒷자리에서 조용히 기록을 노리겠습니다.'],
        ['sys', '박 선생은 담요를 건넸다. 레오는 이번에는 농담을 덧붙이지 않았다.']
      ]
    },
    {
      id: 'daily-parkss-eunsu-names',
      need: {comp: 'parkss', comp2: 'eunsu'},
      lines: [
        ['eunsu', '이 명단, 같은 성이 네 번 반복됩니다. 한 가족일 가능성이 높습니다.'],
        ['parkss', '가능성 말고 이름부터 읽어 봐요.'],
        ['eunsu', '김분희, 김정호, 김도현, 김유나.'],
        ['parkss', '분희 할머니는 매운 걸 못 먹었어요. 정호 씨는 주사만 보면 딴청을 피웠고.'],
        ['eunsu', '선생님이 아는 분들이군요.'],
        ['parkss', '알았던 사람들이죠. 명단에는 그런 게 안 남아서요.'],
        ['eunsu', '옆에 적어도 됩니까? 확인된 것만.'],
        ['parkss', '매운 거 못 먹는 건 확인된 사실이에요. 아주 여러 번.'],
        ['sys', '은수는 이름 옆에 작은 글씨를 보탰다. 박 선생은 그가 다 쓸 때까지 기다렸다.']
      ]
    },
    {
      id: 'daily-kangwoo-jaeyi-gear',
      need: {comp: 'kangwoo', comp2: 'jaeyi'},
      lines: [
        ['jaeyi', '이 방탄 조끼, 안 쓸 거면 장터에서 바꿔도 돼?'],
        ['kangwoo', '안 돼.'],
        ['jaeyi', '왜? 무겁기만 하잖아.'],
        ['kangwoo', '주인이 있어.'],
        ['jaeyi', '죽은 사람 물건이야?'],
        ['kangwoo', '모르니까 안 파는 거야.'],
        ['jaeyi', '…알겠어. 그럼 곰팡이부터 닦자. 이대로 두면 주인이 와도 못 입어.'],
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
        ['leo', '기타는 멀쩡해요. 발이 궁금한 겁니다.'],
        ['kangwoo', '멀쩡해.'],
        ['leo', '그럼 됐습니다. 오늘은 가방을 반대편에 둘게요.'],
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
        ['eunsu', '그 정도면 이해했습니다. 십 분만 정리하고 끄겠습니다.'],
        ['sys', '강우는 고개를 끄덕였다. 십 분 뒤 라디오는 정말 꺼졌다.']
      ]
    },
    {
      id: 'daily-leo-jaeyi-pick',
      need: {comp: 'leo', comp2: 'jaeyi'},
      lines: [
        ['jaeyi', '이 플라스틱 조각, 버려도 돼?'],
        ['leo', '안 됩니다. 제일 비싼 물건이에요.'],
        ['jaeyi', '금도 아니고, 톱니도 없고, 끝은 닳았는데.'],
        ['leo', '기타 피크예요. 형이 처음 만들어 준 겁니다.'],
        ['jaeyi', '그럼 비싼 게 아니라 못 파는 거네.'],
        ['leo', '그 차이가 큽니까?'],
        ['jaeyi', '엄청. 비싼 건 값이 오르면 팔 수 있잖아.'],
        ['leo', '그럼 장부에 못 파는 물건이라고 적어 주세요. 자꾸 고철 칸에 들어갑니다.'],
        ['sys', '재이는 작은 천 주머니를 만들어 피크를 넣었다. 값은 끝내 적지 않았다.']
      ]
    },
    {
      id: 'daily-leo-eunsu-unfinished',
      need: {comp: 'leo', comp2: 'eunsu'},
      lines: [
        ['eunsu', '아까 연주한 곡은 끝이 없습니까?'],
        ['leo', '있었는데 잊었습니다.'],
        ['eunsu', '녹음된 옛 버전을 찾으면 복원할 수 있습니다.'],
        ['leo', '그 버전이 싫어서 바꾸던 중이었어요.'],
        ['eunsu', '그럼 지금 버전은 미완성입니다.'],
        ['leo', '은수 씨는 미완성인 걸 싫어하죠?'],
        ['eunsu', '아니요. 끝난 척하는 것을 싫어합니다.'],
        ['leo', '그 말은 마음에 드네요. 다음 소절 대신 써도 됩니까?'],
        ['eunsu', '제가 부르지만 않으면요.'],
        ['sys', '레오는 두 음을 더 쳤다가 멈췄다. 이번에는 멈춘 자리도 곡처럼 들렸다.']
      ]
    },
    {
      id: 'daily-jaeyi-eunsu-unknown',
      need: {comp: 'jaeyi', comp2: 'eunsu'},
      lines: [
        ['jaeyi', '상자에는 의료용이라고 쓰여 있는데 안에는 재봉 바늘뿐이야.'],
        ['eunsu', '누군가 라벨을 바꿨을 수 있습니다.'],
        ['jaeyi', '아니면 원래부터 아무렇게나 넣었거나.'],
        ['eunsu', '그 가능성도 있습니다.'],
        ['jaeyi', '은수도 모른다고 말할 줄 아네.'],
        ['eunsu', '모르는데 안다고 하면 다음 기록도 틀립니다.'],
        ['jaeyi', '좋아. 그럼 이건 재봉 칸. 나중에 주인이 나타나면 다시 물어보고.'],
        ['eunsu', '라벨에는 물음표를 붙이겠습니다.'],
        ['sys', '두 사람은 낡은 글씨를 지우지 않고 그 옆에 작은 물음표만 보탰다.']
      ]
    },
    {
      id: 'daily-me-minji-hands',
      need: {comp: 'minji'},
      lines: [
        ['me', '손에 기름이 안 빠지네.'],
        ['minji', '모래로 문지르면 빨리 빠져요. 피부도 같이 빠져서 그렇지.'],
        ['me', '좋은 방법은 아니네.'],
        ['minji', '대장님은 좋은 방법 찾을 때까지 안 씻잖아요. 이리 줘 봐요.'],
        ['me', '혼자 할 수 있어.'],
        ['minji', '알아요. 근데 세면대 막히면 결국 제가 뜯어야 하니까요.'],
        ['sys', '민지는 말없이 비누 조각을 반으로 잘라 건넸다. 나는 더 거절하지 않았다.']
      ]
    },
    {
      id: 'daily-me-parkss-patch',
      need: {comp: 'parkss'},
      lines: [
        ['me', '선생님, 그 파스 어제도 같은 데 붙였죠.'],
        ['parkss', '남의 어깨는 잘 보이면서 자기 허리는 안 보이나 봐요.'],
        ['me', '제 허리는 아직 움직여요.'],
        ['parkss', '제 어깨도 움직여요. 아픈 채로.'],
        ['me', '운전은 내가 할 테니까 오늘 짐은 들지 마요.'],
        ['parkss', '그럼 자네도 저녁에는 허리 보여 줘. 서로 한 번씩만 잔소리하자고.'],
        ['me', '한 번으로 끝낼 자신 있어요?'],
        ['parkss', '없어요. 그래도 약속은 그렇게 하죠.']
      ]
    },
    {
      id: 'daily-me-kangwoo-seat',
      need: {comp: 'kangwoo'},
      lines: [
        ['me', '뒷자리가 더 넓은데 왜 늘 조수석에 앉아요?'],
        ['kangwoo', '문이 가까워서.'],
        ['me', '멀미하는 줄 알았는데.'],
        ['kangwoo', '그것도 조금.'],
        ['me', '내릴 일 생기면 먼저 말해요. 달리는 차에서 문부터 잡지 말고.'],
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
        ['me', '그건 대답이 아닌데.'],
        ['leo', '보리 배 밑에 있다는 뜻입니다. 꺼내려면 협상이 필요해요.'],
        ['me', '협상 조건은?'],
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
        ['jaeyi', '이 렌치, 이빨이 닳았어. 고철값은 꽤 나와.'],
        ['me', '그건 안 팔아요.'],
        ['jaeyi', '대장님 할아버지 거죠?'],
        ['me', '네. 쓸 때마다 손이 미끄러지는데도 못 버리겠어요.'],
        ['jaeyi', '못 버리는 물건은 고철이 아니에요. 자리를 너무 많이 차지하면 문제지만.'],
        ['me', '렌치 하나가 그렇게 커 보여요?'],
        ['jaeyi', '아니요. 대장님이 미안해하는 게 커 보여요. 렌치는 공구함에 넣어요.'],
        ['sys', '재이는 값을 매기지 않고 렌치 손잡이에 새 천을 감아 주었다.']
      ]
    },
    {
      id: 'daily-me-eunsu-offrecord',
      need: {comp: 'eunsu'},
      lines: [
        ['me', '오늘 얘기는 녹음하지 말아 줄래요?'],
        ['eunsu', '이유를 물어도 됩니까?'],
        ['me', '기록으로 남으면 내가 제대로 말해야 할 것 같아서요. 지금은 그냥 말하고 싶어요.'],
        ['eunsu', '알겠습니다.'],
        ['me', '정말 껐어요?'],
        ['eunsu', '배터리도 뺐습니다. 의심되면 가지고 계세요.'],
        ['me', '그 정도까지는 안 해도 되는데.'],
        ['eunsu', '저는 그 정도를 해야 편합니다. 대장님은 그냥 말씀하세요.'],
        ['sys', '나는 배터리를 손에 쥔 채 한참 있다가, 부산 작업장 이야기를 처음부터 꺼냈다.']
      ]
    },
    {
      id: 'thread-parent-key-minji', arc: true, once: true,
      need: {comp: 'minji', flag: 'parent_key_found', minBond: {minji: 8}},
      lines: [
        ['me', '엄마 장치, 자꾸 열어 보고 싶어요.'],
        ['minji', '열면 안 되는 거 알면서요?'],
        ['me', '그래서 안 열고 있죠.'],
        ['minji', '보고 싶은 거랑 건드리는 건 다르니까요. 오늘은 제가 들고 있을까요?'],
        ['me', '그 정도로 못 믿을 사람은 아니에요.'],
        ['minji', '대장님을 못 믿는 게 아니라, 밤을 못 믿는 거예요. 밤에는 다들 참을성이 줄잖아요.'],
        ['sys', '나는 장치를 민지에게 건넸다. 민지는 공구함이 아니라 자기 침낭 옆에 놓았다.']
      ]
    },
    {
      id: 'thread-massacre-kangwoo', arc: true, once: true,
      need: {comp: 'kangwoo', flag: 'massacre_known', minBond: {kangwoo: 6}},
      lines: [
        ['kangwoo', '오늘은 문 쪽에서 잘게.'],
        ['me', '어제도 그랬잖아요.'],
        ['kangwoo', '오늘은 이유를 말한 거야.'],
        ['me', '그 기록 때문이에요?'],
        ['kangwoo', '기록은 종이였고, 내가 본 건 사람이었어. 둘이 자꾸 같은 데 놓여.'],
        ['me', '안 자도 없어지진 않아요.'],
        ['kangwoo', '알아. 그래도 누가 문을 열면 이번에는 깨어 있고 싶다.'],
        ['sys', '나는 더 묻지 않고 문 반대편에 자리를 폈다. 가운데 통로는 비워 두었다.']
      ]
    },
    {
      id: 'thread-low-fuel-minji-jaeyi', arc: true, once: true,
      need: {comps: ['minji', 'jaeyi'], lowFuel: 1, afterKm: 45},
      lines: [
        ['jaeyi', '다음 주유소까지 숫자가 모자라는데.'],
        ['minji', '세 번 계산했어요. 내리막에서 공회전 줄이면 닿아요.'],
        ['jaeyi', '안 닿으면?'],
        ['minji', '그때는 내가 걸어서 기름 구해 올게요.'],
        ['jaeyi', '왜 늘 혼자 가는 쪽으로 계산해? 두 명이 가면 절반만 무섭잖아.'],
        ['minji', '무서운 게 나눠져요?'],
        ['jaeyi', '짐은 나눠지더라. 기름통도 그렇고.'],
        ['sys', '민지는 연료계를 한 번 더 보더니 조수석 아래에 빈 기름통 두 개를 꺼내 놓았다.']
      ]
    },
    {
      id: 'thread-tired-parkss-kangwoo', arc: true, once: true,
      need: {comps: ['parkss', 'kangwoo'], tired: 1, afterKm: 70},
      lines: [
        ['parkss', '오늘 하품 일곱 번째예요.'],
        ['kangwoo', '세고 있었어요?'],
        ['parkss', '네 번째부터요. 그전에는 우연인 줄 알았죠.'],
        ['kangwoo', '다음 정차 때 잘게요.'],
        ['parkss', '그 말도 세 번째예요.'],
        ['kangwoo', '그것도 셌어요?'],
        ['parkss', '사람이 안 쉬면 의사는 할 일이 늘어요. 저는 오늘 일을 줄이고 싶습니다.'],
        ['sys', '강우는 대꾸 대신 다음 정차 지점에 동그라미를 쳤다. 박 선생은 그제야 장부를 덮었다.']
      ]
    },
    {
      id: 'thread-resistance-leo-eunsu', arc: true, once: true,
      need: {comps: ['leo', 'eunsu'], flag: 'resist_revealed', minBond: {leo: 5, eunsu: 5}},
      lines: [
        ['leo', '저 사람들 암호는 왜 전부 날씨 얘기예요? 맑음, 소나기, 북서풍.'],
        ['eunsu', '평범한 말이어야 오래 살아남습니다.'],
        ['leo', '평범해서 헷갈리지는 않습니까? 오늘 진짜 비 오면요?'],
        ['eunsu', '그래서 시간을 같이 말합니다. 날씨는 약속 시간까지 맞히지 못하니까요.'],
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
        ['parkss', '달라졌을 수도 있죠. 아닐 수도 있고.'],
        ['eunsu', '위로는 별로 안 됩니다.'],
        ['parkss', '위로하려고 한 말이 아니에요. 그날 자료를 내가 본 것도 아닌데 함부로 답을 정할 수는 없잖아요.'],
        ['eunsu', '그럼 저는 뭘 해야 합니까?'],
        ['parkss', '이번 명단은 끝까지 확인해요. 그리고 밥도 먹고요. 죄책감은 끼니를 대신 못 합니다.'],
        ['sys', '은수는 한참 뒤에 숟가락을 들었다. 박 선생은 명단을 치우지 않고 그 옆에 그대로 두었다.']
      ]
    },
    {
      id: 'thread-side-relay', arc: true, once: true,
      need: {comps: ['leo', 'eunsu'], flag: 'story_chain_relay_1'},
      lines: [
        ['eunsu', '첫 마을에서 정말 답이 올 줄은 몰랐습니다.'],
        ['leo', '자기 이름을 부르는데 대답 안 하는 사람이 더 드물죠.'],
        ['eunsu', '관제실에서는 대답이 없는 쪽을 먼저 지웠습니다.'],
        ['leo', '길에서는 한 번 더 부르죠. 못 들었을 수도 있으니까.'],
        ['eunsu', '그 차이가 생각보다 큽니다.'],
        ['leo', '그러니까 다음 마을 이름도 틀리지 말고 불러 줍시다.']
      ]
    },
    {
      id: 'thread-side-clinic', arc: true, once: true,
      need: {comps: ['parkss', 'jaeyi'], flag: 'story_chain_clinic_2'},
      lines: [
        ['jaeyi', '약을 나눌 순서까지 우리가 정해야 해?'],
        ['parkss', '우리가 정하는 건 아니에요. 세 진료소가 서로 가진 걸 보게 해 주는 거죠.'],
        ['jaeyi', '보고도 자기 것부터 챙기면?'],
        ['parkss', '그럴 수도 있어요. 그래도 모른 척 가져가는 것과 보고 가져가는 건 달라요.'],
        ['jaeyi', '선생님은 사람을 믿는 편이네.'],
        ['parkss', '사람을 믿는다기보다, 누가 먼저 가져갔는지 다 보이게 해 두자는 쪽이죠.']
      ]
    },
    {
      id: 'thread-side-letters', arc: true, once: true,
      need: {comps: ['minji', 'kangwoo'], flag: 'story_chain_letters_2'},
      lines: [
        ['minji', '답장 세 통이 원래 편지보다 더 무겁네요.'],
        ['kangwoo', '종이가 늘었으니까.'],
        ['minji', '그 얘기가 아닌데.'],
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
        ['leo', '오늘 국은 누가 끓였습니까? 정답을 알아야 칭찬의 방향을 정하죠.'],
        ['minji', '선생님이 끓였고 제가 소금 넣었어요.'],
        ['parkss', '두 번 넣었죠.'],
        ['minji', '레오 씨가 말 걸어서 몇 번 넣었는지 잊었어요.'],
        ['leo', '그럼 저는 물을 더 붓는 쪽으로 책임지겠습니다.'],
        ['parkss', '물을 붓기 전에 한 그릇씩 먹어요. 내일도 짜면 민지 씨 탓, 안 짜면 레오 씨 덕으로 합시다.'],
        ['minji', '왜 성공만 레오 씨 몫이에요?'],
        ['leo', '제가 원래 결과가 좋을 때만 나타나는 역할입니다.'],
        ['sys', '결국 물을 조금 더 붓고 감자 하나를 잘라 넣었다. 국은 먹을 만했고 누구도 자기 덕이라고 하지 않았다.']
      ]
    },
    {
      id: 'thread-three-night-watch', arc: true, once: true,
      need: {comps: ['kangwoo', 'eunsu', 'jaeyi'], party: 3, night: 1, afterKm: 120},
      lines: [
        ['jaeyi', '보초 둘이면 충분한데 왜 셋이 깨어 있어?'],
        ['eunsu', '저는 보초가 아니라 녹음 정리 중입니다.'],
        ['kangwoo', '나는 둘 다 자라고 기다리는 중이고.'],
        ['jaeyi', '그럼 아무도 보초를 안 서는 거네.'],
        ['eunsu', '제가 첫 시간 서겠습니다.'],
        ['kangwoo', '너는 새벽 교대야. 재이가 먼저 자고, 나는 한 시간 뒤 은수를 깨울게.'],
        ['jaeyi', '강우는 언제 자는데?'],
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
      text: '전조등이 폐쇄 검문소를 훑자 감시 카메라 세 대가 동시에 돌아왔다. 번호판을 읽는 각도가 아니었다. 지붕의 검증 모듈을 보고 있었다. 꺼진 안내판에 짧은 문장이 떴다. 「검증 장치 운송체 확인」 그리고 막혀 있던 앞길의 신호가 하나씩 초록으로 바뀌었다.',
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
          label: '모듈을 덮고 열린 길로 빠져나간다',
          out: [{
            p: 1,
            text: '방수포를 덮었는데도 신호는 계속 초록이었다. 들키지 않은 게 아니었다. 지나가도록 내버려 둔 것이었다.',
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
      text: '노면 충격에 바닥 수납칸이 반쯤 열렸다. 안쪽에는 할아버지도 모른 척했던 화물표 두 장이 붙어 있었다. 날짜는 같았다. 아버지의 작업증 번호는 남산 설비조로, 엄마의 모듈 일련번호는 수도권 외곽 검증 중계소로 갈라져 있었다. 두 사람은 처음부터 같은 차에 타지 않았다.',
      choices: [
        {
          label: '두 경로가 갈라진 지점을 지도에 표시한다',
          out: [{
            p: 1,
            text: '한 줄은 남산으로 곧장 올라갔고, 다른 줄은 서울 바깥을 오래 돌았다. 엄마를 찾는 길과 명령을 멈추는 길이 같은 곳에서 끝난다는 보장은 없었다.',
            fx: { time: 20, flag: 'bridge_parent_route' }
          }]
        },
        {
          label: '표를 접어 엄마의 모듈과 함께 넣는다',
          out: [{
            p: 1,
            text: '종이를 접자 오래된 기름 냄새가 났다. 할아버지는 이 두 장을 버리지도, 보여 주지도 못했다. 이제 어느 쪽부터 확인할지는 내가 정해야 했다.',
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
      text: '고가도로 밑에 차를 세우고 증거 봉투를 다시 펼쳤다. 부모님의 경로는 둘로 갈라졌고, 남산은 우리를 기다리고 있었다. 수첩 귀퉁이에 한 줄을 적었다. 엄마가 그곳에 없더라도 갈 건가. 오래 보고도 답은 저절로 생기지 않았다.',
      choices: [
        {
          label: '이 명령만큼은 끝내야 한다',
          out: [{
            p: 1,
            text: '엄마를 못 만나더라도, 내일 또 다른 아이 이름이 명단에 오르는 건 막아야 했다. 그렇게 적고 나니 무서운 마음까지 사라지지는 않았다.',
            fx: { moodAll: 1, flag: 'bridge_crew_answer' }
          }]
        },
        {
          label: '엄마가 살아 있다면 만나야 한다',
          out: [{
            p: 1,
            text: '거창한 이유보다 그 말이 먼저였다. 살아 있다면 왜 돌아오지 못했는지, 내 얼굴을 기억하는지 직접 묻고 싶었다.',
            fx: { flag: 'bridge_crew_answer' }
          }]
        },
        {
          label: '둘 다다. 그래서 겁난다',
          out: [{
            p: 1,
            text: '한쪽을 고르면 쉬울 줄 알았다. 아니었다. 가족을 찾는 일과 사람들을 멈춰 세우는 일이 같은 문 앞에 놓여 있었다.',
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
            fx: { pursuit: 1, flag: 'bridge_invitation' }
          }]
        },
        {
          label: '평행 도로로 돌아간다',
          out: [{
            p: 1,
            text: '두 번 길을 바꿨다. 신호는 두 번 다 먼저 켜져 있었다. 어느 길을 고르든 같은 입구로 모였다.',
            fx: { time: 35, fatigue: 2, flag: 'bridge_invitation' }
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
      text: '남산이 보이는 마지막 고개에서 시동을 껐다. 누가 먼저 말을 꺼내지도 않았다. 증거 봉투를 다시 묶고, 물병 뚜껑을 닫고, 안전띠를 한 번씩 당겼다. 돌아갈 사람을 붙잡지 않으려고 문을 열어 두었다. 한참 뒤, 안쪽에서 미닫이문 닫히는 소리가 났다.',
      choices: [
        {
          label: '시동을 건다',
          out: [{
            p: 1,
            text: '엔진이 두 번 헛돌고 세 번째에 붙었다. 아래쪽 도시에서는 우리가 오기 전부터 초록불이 켜져 있었다.',
            fx: { fatigue: -2, moodAll: 1, flag: 'bridge_last_quiet' }
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
    {who: 'minji', t: '컵 받침에 볼트 넣은 사람 누구예요? 물 마시려다 이빨 나갈 뻔했네.', need: {comp: 'minji', comp2: 'leo'}},
    {who: 'leo', t: '제 기타 줄은 건드리지 마세요. 빨랫줄로 쓰면 소리가 정말 우울해집니다.', need: {comp: 'leo', comp2: 'jaeyi'}},
    {who: 'parkss', t: '양말은 불 가까이에 한 켤레씩만. 어제 탄 냄새가 아직도 나요.', need: {comp: 'parkss', comp2: 'jaeyi'}},
    {who: 'kangwoo', t: '오늘 문 잠그는 순서는 내가 할게. 어제 두 번 돌아본 사람은 그냥 자.', need: {comp: 'kangwoo', comp2: 'minji'}},
    {who: 'eunsu', t: '누가 제 연필을 칼로 깎았습니까? 너무 잘 깎여서 다음에도 부탁하고 싶습니다.', need: {comp: 'eunsu', comp2: 'jaeyi'}},
    {who: 'jaeyi', t: '보리 밥그릇이 내 것보다 멀쩡하네. 이건 좀 억울한데.', need: {comp: 'jaeyi', comp2: 'leo'}},
    {who: 'minji', t: '엔진 소리는 괜찮은데 레오 씨 코 고는 소리는 점검이 필요해요.', need: {comp: 'minji', comp2: 'leo'}},
    {who: 'parkss', t: '차가 흔들릴 때 책 읽으면 멀미해요. 네, 은수 씨한테 하는 말이에요.', need: {comp: 'parkss', comp2: 'eunsu'}},
    {who: 'kangwoo', t: '내 장갑 한 짝 못 봤나. 찾으면 세탁하지 말고 그냥 줘.', need: {comp: 'kangwoo', comp2: 'parkss'}},
    {who: 'eunsu', t: '오늘은 아무것도 기록하지 않겠습니다. 방금 한 말도 기록하지 않았습니다.', need: {comp: 'eunsu', comp2: 'leo'}},
    {who: 'leo', t: '저녁 메뉴를 맞히면 한 곡 치겠습니다. 틀려도 칠 거라서 상품은 없습니다.', need: {comp: 'leo', comp2: 'parkss'}},
    {who: 'jaeyi', t: '고장 난 의자라도 앉을 사람 있으면 버리지 마. 먼저 고칠지 물어봐.', need: {comp: 'jaeyi', comp2: 'minji'}}
  ];

  if (Array.isArray(D.banter)) {
    for (const line of banter) {
      if (!D.banter.some((entry) => entry.t === line.t)) D.banter.push(line);
    }
  }
})();
