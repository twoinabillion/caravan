# 시네마틱 장면 생성 가이드

신규 장면은 Codex 내장 `imagegen`으로 생성했다. 기존
`grandfather-garage.jpg`, `gwangju-market.jpg`, `seoul-han.jpg`,
`perimeter-walker.jpg`를 **스타일 레퍼런스**로만 사용했으며, 생성된 원본은
중앙 크롭 후 `768×432` JPEG로 `assets/scenes/`에 저장한다.

## 공통 프롬프트

```text
Use case: stylized-concept
Asset type: 16:9 cinematic event illustration for the Korean
post-apocalyptic road-trip game "Seoul to 400km"
Input images are style references only; generate a completely new scene.
Style/medium: cinematic painterly realism, grounded Korean post-apocalypse,
detailed Korean environments, restrained colors, practical warm light,
readable on a mobile event card.
Constraints: no readable text, no logos, no watermark, no frame,
no split panels, no UI, no zombies, no fantasy, no glossy sci-fi.
```

장면 안의 문서·포장·단말은 형태만 보여준다. 정확한 고유명과 문장은 이벤트
본문이 담당한다. 천리안 설비는 우주선이 아니라 낡은 방송·교통·행정 기반
시설이 비대해진 모습으로 그린다.

## 신규 고유 장면 16종

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
