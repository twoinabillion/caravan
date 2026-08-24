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
        ['leo', '강우 씨, 새벽에 제 기타 가방을 발로 찼습니다.'],
        ['kangwoo', '미안하다.'],
        ['leo', '기타는 멀쩡해요. 발이 궁금한 겁니다.'],
        ['kangwoo', '멀쩡해.'],
        ['leo', '그럼 됐습니다. 오늘은 가방을 반대편에 둘게요.'],
        ['kangwoo', '왜 그랬는지 안 물어보나.'],
        ['leo', '말하고 싶으면 강우 씨가 먼저 말하겠죠. 대신 다음에는 제 발을 차세요. 기타보다 싸게 고칩니다.'],
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
        ['minji', '아저씨는 좋은 방법 찾을 때까지 안 씻잖아요. 이리 줘 봐요.'],
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
        ['parkss', '그럼 당신도 저녁에는 허리 보여 줘요. 서로 한 번씩만 잔소리합시다.'],
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
        ['jaeyi', '할아버지 거지?'],
        ['me', '네. 쓸 때마다 손이 미끄러지는데도 못 버리겠어요.'],
        ['jaeyi', '못 버리는 물건은 고철이 아니야. 자리를 너무 많이 차지하면 문제지만.'],
        ['me', '렌치 하나가 그렇게 커 보여요?'],
        ['jaeyi', '아니. 네가 미안해하는 게 커 보여. 렌치는 공구함에 넣어.'],
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
        ['eunsu', '저는 그 정도를 해야 편합니다. 당신은 그냥 말하세요.'],
        ['sys', '나는 배터리를 손에 쥔 채 한참 있다가, 부산 작업장 이야기를 처음부터 꺼냈다.']
      ]
    }
  ];

  if (Array.isArray(D.chats)) {
    for (const chat of chats) {
      if (!D.chats.some((entry) => entry.id === chat.id)) D.chats.push(chat);
    }
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
