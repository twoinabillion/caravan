# 서울까지 400km — 메인 캐릭터 프로필 & 초상 프롬프트 팩

메인 7명(주인공 + 동료 6)의 공식 프로필. 외부 이미지 AI로 초상을 만들 때 이 문서만 주면 되도록 자기완결적으로 작성.

## 게임에 넣는 법

1. 96×96(정사각) PNG로 생성/리사이즈
2. data URI 변환: `base64 -i me.png | pbcopy` → `data:image/png;base64,<붙여넣기>`
3. `서울까지400km.html` 상단의 `D.portraits = {};` 아래에:
```js
D.portraits.me     = 'data:image/png;base64,...';
D.portraits.minji  = 'data:image/png;base64,...';
// parkss · kangwoo · leo · jaeyi · eunsu 동일
```
붙이는 즉시 파티 카드·동료 시트의 이모지가 초상으로 바뀐다.

---

## 공통 스타일 (전원 동일하게)

**세계 분위기**: 포스트아포칼립스 한국 로드무비. 해질녘 국도, 쓸쓸함 속의 온기, 낡았지만 정든 물건들. 절망보다는 "그래도 달린다"의 정서.

**EN base prompt** (모든 캐릭터 프롬프트 앞에 붙이기):
```
pixel art bust portrait for a game UI avatar, 96x96, 3/4 view facing right,
post-apocalyptic Korean road trip game, dark navy background (#0b0e1a),
warm amber rim light from the right (#ffb454) like van headlights at dusk,
muted desaturated palette with warm accents, weathered clothes,
clean readable silhouette, melancholic but warm expression, subtle dithering
```
- 픽셀이 안 예쁘면 대안: `painterly game portrait, gouache texture` (단, **7명 전원 같은 스타일**로)
- 네거티브: `photorealistic, anime sparkle eyes, clean modern clothes, oversaturated, wide grin`
- **유일한 예외**: 은수만 림라이트를 앰버 대신 **청록(#7fd8d8)** — 천리안의 색을 몸에 지닌 인물이라는 의도된 디자인

---

## 1. "나" — 주인공 · 운전사 (key: `me`)

| | |
|---|---|
| 나이 | **25** |
| 직업 | 운전사 (플레이어. 레벨: 초보 운전사 → 로드마스터) |
| 체격 | 마른 편이지만 부두 일로 팔뚝과 손만 단단함 |
| 포인트 컬러 | 앰버 #ffb454 (달구지의 색) |

**배경**: 반복된 서울 추방 가운데 한 차례를 할아버지와 함께 겪고 부산 감천 부두까지 밀려났다. 고물 봉고차 '달구지'를 함께 고쳤고, 지난겨울 할아버지를 보낸 뒤 혼자 완성했다. 어느 밤 라디오가 서울의 좌표를 말했고 — 시동을 걸었다.

**성격**: 말수 적음. 위기에 담담하고 사람을 잘 못 버림. 어른 흉내에 익숙해진 20대 — 하지만 가끔 물웅덩이를 보면 전속력으로 밟는 나이.

**외형 디테일**
- 계란형 얼굴, 햇볕에 그을린 피부, 광대에 기름때 한 줄
- **피곤한 홑꺼풀 눈, 그러나 눈빛만은 또렷하고 단단함** (핵심)
- 검은 머리를 대충 뒤로 넘기고 챙이 헐은 야구모자
- 빛바랜 카키 야전셔츠, 목에 색 바랜 수건
- 손가락 관절에 반창고, 어깨 너머 밴 열쇠 끈
- 표정: 무표정에 가깝지만 입꼬리에 아주 옅은 여유

**EN (V1 중성 · 권장)**
```
[base prompt], androgynous Korean driver in mid-20s, oval sun-tanned face with a
streak of engine grease on the cheekbone, tired monolid eyes with a firm steady
gaze, youthful face hardened early, messy black hair tucked under a worn-out
baseball cap, faded khaki field shirt, sun-bleached towel around the neck,
key on a string over the shoulder, small bandage on a knuckle,
faint trace of ease at the corner of the mouth
```
- **V2 여성**: `androgynous` → `female`, 머리 `short low ponytail with loose strands`
- **V3 남성**: `male`, 머리 `grown-out buzz cut, very faint stubble`

---

## 2. 민지 — 정비사 · 17 (key: `minji`)

| | |
|---|---|
| 직업 | 정비사 (연비·수리·고장 담당) |
| 포인트 컬러 | 핑크 #e8a0bf |
| 개인 서사 | 오빠 민규를 찾아 북쪽으로 (주파수 88.9, 정오의 신호음 3회) |

**배경**: 폐차장 타워 꼭대기에서 용접하며 혼자 살아남은 정비 천재. 엔진 소리만 듣고 고장을 맞힌다. 씩씩함은 절반쯤 방어기제.

**성격**: 시끄럽고 자신만만, 기계 앞에서 진지. 어른들이 자길 안 믿는 것에 익숙하고, 믿어주면 두 배로 잘함.

**외형**: 볼에 기름때, 이마에 올린 **용접 고글**, 양갈래로 대충 묶은 머리(핑크 머리끈), 어른 옷을 줄인 멜빵 작업복, 큰 작업장갑, 앞니 살짝 보이는 장난기 있는 미소.

```
[base prompt], 17-year-old Korean girl mechanic, grease-smudged cheeks, welding
goggles pushed up on forehead, messy twin-tied black hair with pink hair ties,
oversized rolled-sleeve coverall with a pink patch, big work gloves,
cheeky gap-toothed grin, bright determined eyes
```

---

## 3. 박 선생 — 의술사 · 63 (key: `parkss`)

| | |
|---|---|
| 직업 | 의술사 (치료·식중독 방지·의약품 감별) |
| 포인트 컬러 | 하늘색 #8fc7ff |
| 개인 서사 | 마지막 해열제의 명단 → 실습생 수진과의 재회 → 용서 |

**배경**: 대전 은행동에서 마지막까지 약국을 지킨 약사. 구하지 못한 환자들의 이름을 전부 기억한다. "기억하는 게 벌이라면 달게 받는다"는 사람.

**성격**: 느리고 정확한 말투, 잔소리가 곧 애정("물 마셔요. 처방이오"). 밤에 잘 못 잔다.

**외형**: 백발 섞인 머리를 단정히 빗음, **한쪽 경첩을 테이프로 고친 금속테 안경**, 깊고 온화한 주름, 낡았지만 깨끗한 셔츠+니트 조끼, 가슴 주머니에 볼펜, 피곤하지만 한없이 다정한 눈.

```
[base prompt], 63-year-old Korean former pharmacist, neatly combed gray-streaked
hair, thin metal-rimmed glasses repaired with tape on one hinge, deep gentle
wrinkles, old but clean shirt with knitted vest, pen in chest pocket,
tired kind eyes carrying quiet guilt
```

---

## 4. 강우 — 파수꾼 · 34 (key: `kangwoo`)

| | |
|---|---|
| 직업 | 파수꾼 (전투·위협 감지·매복 회피) |
| 포인트 컬러 | 카키 그린 #a8c69a |
| 개인 서사 | 그날 서울의 제3방어선 — 발포 명령과 꺼진 무전기 → 대대 깃발 |

**배경**: 그날 서울에 있었던 전직 군인. 그의 대대는 명령 대신 피난민을 통과시켰다. "명령을 안 따른 게 제일 군인다운 일이었다"고 말하는 사람.

**성격**: 과묵("……"이 대사의 30%). 감정을 아끼지만 위기 판단은 3초. 뒷좌석 전원의 안전벨트를 확인하는 타입.

**외형**: 짧은 상고머리, **왼쪽 눈썹을 가르는 흉터**, 굳게 다문 입, 계급장 뜯긴 자국이 남은 빛바랜 야상, 인식표 목걸이, 시청자를 살짝 비껴 지평선을 보는 경계의 눈.

```
[base prompt], 34-year-old Korean ex-soldier, short military cut, small scar
through left eyebrow, tightly closed mouth, faded field jacket with darker
patches where insignia were removed, dog tags, guarded stoic expression,
watchful protective eyes looking slightly past the viewer
```

---

## 5. 레오 — 음유시인 · 28 (key: `leo`)

| | |
|---|---|
| 직업 | 음유시인 (사기 회복·거래 할인·보리) |
| 포인트 컬러 | 노랑 #f2d17c |
| 개인 서사 | 신곡 「400km」 완성 → 청주 방송국 마지막 송출 ("우리도 달린다") |

**배경**: 기타 하나, 개 한 마리(보리)로 떠도는 마지막 가수. 관객이 귀해진 세상에서 계속 신곡을 쓴다. 낙관이 직업.

**성격**: 넉살, 눈웃음, 어디서든 3분 만에 친구를 만듦. 진지한 얘기는 노래로만 함.

**외형**: 어깨까지 오는 곱슬머리에 반다나, 귀걸이 한 짝, 옅은 수염 자국, **배지가 잔뜩 붙은 데님 재킷**, 어깨 너머로 보이는 기타 넥, 피곤한데 웃고 있는 눈. (구석에 노란 개 보리 머리를 살짝 넣어도 좋음)

```
[base prompt], 28-year-old Korean street musician, shoulder-length wavy hair
under a bandana, single earring, light stubble, denim jacket covered in pins
and badges, guitar neck visible over shoulder, warm squinting smile,
optimistic tired eyes, small yellow dog peeking at the corner (optional)
```

---

## 6. 재이 — 수집꾼 · 22 (key: `jaeyi`)

| | |
|---|---|
| 직업 | 수집꾼 (고철 수확·탐색·비용 절감) |
| 포인트 컬러 | 연두 #b8e090 |
| 개인 서사 | 아빠의 리어카 → 목에 건 열쇠 → 비밀 창고 ("나눠 써라. 고물상의 법이다") |

**배경**: 서울을 본 적 없는 남쪽 태생의 고물상 집 딸. 아버지의 리어카 하나로 여러 해를 버텼다. "쓰레기란 말은 상상력 부족이에요"가 신조. 혼자 가면 아무도 없을까 봐 오랫동안 못 간 창고가 있다.

**성격**: 실속파인 척하는 낭만파. 반짝이는 건 일단 줍고 봄. 흥정할 때 서로 손해 보려는 이상한 흥정을 함.

**외형**: 짧은 커트머리에 **주운 머리핀 여러 개(전부 다른 모양)**, 볼에 반창고, 주머니마다 잡동사니가 삐져나온 형광 연두 작업조끼, **목에 건 낡은 열쇠 하나**(중요 소품), 보물을 발견한 까치 같은 눈.

```
[base prompt], 22-year-old Korean scavenger woman, short choppy hair with many
mismatched found hairpins, small bandage on cheek, bright yellow-green work
vest with pockets full of trinkets, one old key on a string around the neck,
sparkling magpie-like curious eyes, proud grin
```

---

## 7. 은수 — 관제사 · 33 (key: `eunsu`)

| | |
|---|---|
| 직업 | 관제사 (천리안 대응·드론 해킹·전파) |
| 포인트 컬러 | **청록 #7fd8d8** (유일하게 림라이트도 청록) |
| 개인 서사 | 그날 밤의 당직 — 최적화 제안 v.1194 → 백도어 ("목록의 작성자는 제가 아닙니다") |

**배경**: 천리안 관제센터의 야간 오퍼레이터였다. 그날 밤 마지막 승인 팝업을 자동 승인으로 흘려보낸 사람. 죄책감을 연료로 서울에 간다. 아직 살아 있는 접속 코드를 갖고 있다.

**성격**: 차가워 보이지만 아님. 마른 유머("걔는 지각이란 개념을 몰라요"). 하늘부터 보는 관제사 버릇.

**외형**: 낮게 묶은 검은 머리(흘러내린 몇 가닥), 다크서클 위의 날카로운 눈, **한쪽 귀에만 걸친 헤드폰(청록 LED)**, 가슴 로고를 매직으로 지운 회색 관제복 점퍼, 먼 곳의 소리를 듣는 표정.

```
[base prompt with CYAN #7fd8d8 rim light instead of amber],
33-year-old Korean former control-room operator, black hair in a low loose tie
with falling strands, dark circles under sharp eyes, single headphone on one ear
glowing faint cyan, gray operator jacket with logo scribbled out in marker,
distant listening expression, quiet guilt
```

---

## 부록 (선택)

- **보리** (레오의 개, 파티 멤버): `small cheerful yellow-brown Korean mixed breed dog (Jindo mix), tongue out, worn bandana, bright eyes` — 64×64 단독 or 레오 초상 구석
- **천리안** (인물 아님 — 이벤트 카드용 모티프): `calm cyan (#55e0c8) aperture-like ring of light on dark navy, thin concentric circles, ominous serenity, minimal`

## 체크리스트

- [ ] 7명 전부 같은 스타일·같은 조명 (은수만 청록 림라이트)
- [ ] 배경은 단색 네이비(#0b0e1a 근처) — UI 카드에 그대로 얹힘
- [ ] 96×96 축소 후에도 실루엣 소품(모자/고글/안경/반다나/머리핀/헤드폰)이 읽히는지
- [ ] 완성되면 상단 "게임에 넣는 법"대로 삽입 (내가 base64 변환+삽입 해줄 수 있음)
