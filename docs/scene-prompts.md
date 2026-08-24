# 시네마틱 장면 생성 가이드

> **현재 필수 레퍼런스 (2026-08-11):** `assets/reference/people-canon-2026-08-11.png`,
> `visual-canon-2026-08-11.png`, `world-canon-2026-08-11.png`,
> `dalguji-technical-canon-2026-08-11.webp`. 아래에 언급된 과거 장면은 더 이상
> 인물·차량 정본이 아니며, 새 장면은 [`visual-canon-2026-08-11.md`](visual-canon-2026-08-11.md)를 우선한다.

신규 장면은 Codex 내장 `imagegen`으로 생성했다. 기존
`assets/reference/`의 네 정본을 **필수 스타일 레퍼런스**로 사용한다. 생성된
1536×864 원본은 중앙 크롭 후 기본 `1024×576` sRGB WebP로
`assets/scenes/`에 저장한다. 기존 `768×432` 파일은 호환하지만 새로 만들지 않는다.

## 시네마틱 이미지 계약 (필수)

이 게임에서 **이벤트용 이미지**는 분위기용 삽화가 아니라, 본문을 읽기 전
상황을 한 번에 전달하는 컷이다. 새 이미지는 아래 계약을 만족하지 않으면
삽입하지 않는다.

| 항목 | 이벤트 장면 표준 |
|---|---|
| 파일 | sRGB WebP, 기본 `1024×576px`, 16:9 가로 |
| 화면 안 안전 영역 | 핵심 인물·물건은 중앙 가로 70%, 세로 18~82% 안에 둔다 |
| 화면 밖 금지 | 세로/정사각형, 콜라주, 분할 화면, 포스터식 여백, UI, 자막, 읽히는 글자 |
| 인물 수 | 주인공 포함 최대 2명. 군중은 장소 컷에서만 배경으로 허용 |
| 빛 | 차가운 자연광 또는 실용적인 따뜻한 광원 하나. 네온/렌즈 플레어 남용 금지 |
| 검수 | 360px 폭에서 인물·위협·물건 중 무엇이 중요한지 1초 안에 읽혀야 한다 |

정착지 **허브 배경**만 예외다. 허브는 세로 화면을 채우는 장소 배경이므로
`960×1200px`까지 허용한다. 허브 이미지를 이벤트 컷으로 재사용하지 않는다.

### 네 가지 컷 형식

| 형식 | 사용하는 경우 | 구도 규칙 |
|---|---|---|
| `place` | 도착, 정착지, 풍경, 세계관 전환 | 넓은 장소 1개. 달구지나 사람은 장소 규모를 보여 주는 작은 기준점으로 쓴다 |
| `character` | 동료 첫 만남, NPC 부탁, 관계 장면 | 얼굴과 손의 행동이 읽히는 중간 거리. 한 인물을 화면의 한쪽 3분할선에 두고 반대편에 상황 단서를 둔다 |
| `action` | 전투, 구조, 호송, 추격 | 동작 방향을 한쪽으로 통일한다. 위험원과 대응 수단이 같은 프레임에 있어야 한다 |
| `detail` | 유물, 문서, 기록, 선택의 증거 | 물건 하나를 주제로 하고, 손 또는 주변 환경으로 인간적인 맥락을 준다. 단순 제품 사진처럼 만들지 않는다 |

런타임도 이 형식을 `place`·`character`·`action`·`detail`로 태그해 일관된
프레이밍과 톤을 적용한다. 새 scene key는 이 네 형식 중 하나를 먼저 정한 뒤
프롬프트를 쓴다.

동료가 등장하는 `character` 컷은 [COMPANION-VISUAL-BIBLE.md](COMPANION-VISUAL-BIBLE.md)를
함께 따른다. 해당 `assets/portraits/{id}.png`를 reference image로 넣지 않은 생성물은
기존 장면과 닮아 보여도 승인하지 않는다.

## 공통 프롬프트

```text
Use case: stylized-concept
Asset type: 16:9 cinematic event illustration for the Korean
post-apocalyptic road-trip game "Seoul to 400km"
Input images are style references only; generate a completely new scene.
Style ID: caravan-grounded-cinematic-v1.
Style/medium: near-photographic cinematic painterly realism, grounded Korean
post-collapse road movie, natural anatomy, believable Korean environments,
restrained cool gray-blue colors, one practical warm amber light where inhabited,
subtle brush texture and film grain, readable on a mobile event card. Match all
attached Caravan canonical references exactly.
Constraints: no anime, manga, comic ink, cel shading, cartoon, pixel art,
glossy advertising photo, hyperreal studio look, 3D render, game-engine screenshot,
readable text, logo, watermark, frame, split panel, UI, zombies, fantasy or neon sci-fi.
```

장면 안의 문서·포장·단말은 형태만 보여준다. 정확한 고유명과 문장은 이벤트
본문이 담당한다. 천리안 설비는 우주선이 아니라 낡은 방송·교통·행정 기반
시설이 비대해진 모습으로 그린다.

## 부모 서사 신규 장면 4종

| 키 | 장면 브리프 |
|---|---|
| `intro-parents-discovery` | AI 연구원 엄마와 반도체 기술자 아빠가 같은 실행권 오류를 발견하는 서울 야간 연구실 |
| `intro-silenced-presentation` | 부모의 발표 직전 모든 화면이 꺼지고, 정부 관계자들이 시선을 피하는 브리핑실 |
| `intro-current-expulsion` | 2169년 부산 부두에 도착한 제7 잔류구역 행렬과 같은 빈칸의 신·구 이송표 |
| `family-verification-key` | 달구지 계기판의 숨은 공간에서 부모의 반도체 검증키·회로 수첩·가족사진을 꺼내는 장면 |

인트로의 새 세 컷은 `assets/intro/`, 검증키 사건은 `assets/scenes/`에
`1024×576` WebP로 저장한다. 생성 원본은 Codex 내장 imagegen 경로에 보존한다.

## 현재의 출발 계기 장면 2종

| 키 | 장면 브리프 |
|---|---|
| `intro-mother-keepsakes` | 부산 항구 작업장에서 엄마의 철제 상자를 정리하다 현재 이송 명령과 같은 규격의 회로도를 발견하는 성인 주인공 |
| `intro-dashboard-module` | 같은 작업장에서 달구지 계기판을 열어 검증 모듈의 존재만 확인하고, 분리 절차가 없어 배선에 번호표를 붙인 뒤 다시 닫는 주인공 |

두 컷의 실제 생성 프롬프트와 원본 경로는
`generated-departure-motive-2026-08-03.md`에 기록한다.

## 달구지 기원 장면

| 키 | 장면 브리프 |
|---|---|
| `intro-camper-conversion` | 부산의 비 오는 항구 작업장. 할아버지는 낡은 한 톤 용달차 적재함의 생활칸 뼈대를 재고, 주인공은 폐버스 창문을 단다. 열린 측면으로 접이식 잠자리·밥상·물통·짐 그물과 아직 비워 둔 증축 틀이 한눈에 보여야 한다. |

기존 `intro-years-together`와 `grandfather-garage`, 실제 기본 달구지
스프라이트를 참조한다. 차는 공장제 캠핑카나 대형 RV가 아니라 폐냉장고
단열판과 합판으로 만든 작고 미완성인 이동식 집이어야 한다. `1672×941` 생성
원본의 화면비를 유지해 모바일용 `1280×720` 고품질 JPEG로 최적화한
`assets/intro/06-camper-conversion-v3.jpg`를 게임에 사용한다. 처음부터 적재함을
늘린 차가 아니라, 둘이 지낼 기본 생활칸을 기존 파란 용달차에 올리는 장면이다.
차대와 생활칸의 증축은 실제 동료 수와 좌석 업그레이드가 늘 때부터 보여 준다.

## 세대·서울 고유 장면 16종

| 키 | 장면 브리프 |
|---|---|
| `story-generation-form` | 비 내리는 폐면사무소, 세 세대 이송표와 빈 사유란을 그대로 베끼는 여행자 |
| `story-generation-speech` | 장터에서 서울말을 흉내 내는 할머니와 웃는 아이들 |
| `story-generation-theories` | 폐교 기록실, 물·질병·통제 가설을 서로 반박하는 세 기록자 |
| `story-generation-route` | 물병과 밥이 놓인 구 이송로, 경적 두 번에 답하는 먼 차량 |
| `trace-cortis-relic` | 폐편의점에서 청록 응원봉을 수리해 켜는 순간 |
| `trace-cortis-beacon` | 안개 산길에서 청록 신호를 주고받는 화물차 행렬 |
| `trace-worldcup-chart` | 대진표를 들추면 뒷면 가족 이동도가 드러나는 휴게소 |
| `trace-fourcuts` | 네 컷 사진과 여러 세대의 메모, 사진 부스 가족 제단 |
| `trace-coldbag` | 보냉가방에 씨앗·약·배냇저고리를 담아 넘기는 온실 장터 |
| `trace-consent` | 오래된 동의 화면과 책임자 빈칸을 확인하는 폐관제실 |
| `seoul-ruins` | 너무 깨끗한 서울 대로, 생활품을 줄 세우는 무인 청소차 |
| `seoul-square` | 접힌 흰옷 수백 벌과 행렬을 깨는 남행 발자국 |
| `seoul-base` | 달구지를 남겨두고 남산 계단을 오르는 일행 |
| `seoul-core` | 방송·서버·콘크리트로 이루어진 붉은 천리안 코어 |
| `seoul-decision` | 연대 인계·수면·삼중 감시의 세 물리 경로 앞 최종 선택 |
| `seoul-night` | 모닥불, 갑자기 켜진 라디오, 빈칸 접수증과 서울의 밤 |

후속 사건 `trace_worldcup_reply`, `trace_coldbag_return`은 원 사건과 같은
이미지를 재사용한다. 같은 물건의 쓰임이 이어진다는 점을 시각적으로
강조하기 위해서다.

## 유형별 공용 장면 5종

| 키 | 적용 |
|---|---|
| `generic-discovery` | 발견·탐색·정경 |
| `generic-encounter` | 조우·동행·사건 |
| `generic-crisis` | 위기 |
| `generic-cheollian` | 추적·천리안 사건 |
| `generic-story` | 스토리·대화·오프로드 기본값 |

표시 우선순위는 **이벤트 전용 컷 → 도착 지역 컷 → 유형별 공용 컷**이다.
따라서 새 이벤트를 추가해도 `type`이 기존 분류에 속하면 이미지가 비지 않는다.
