# Codex 지시서 — 「현장 판」: 정착지·시설 화면 UI 통합

Date: 2026-08-17
증거: `audits/ui-density-2026-08-17/current-screens.jpg` (허브·장터·정비소·통로·이벤트·길 6장 대조)
개별 캡처: 같은 폴더 `01-hub` ~ `12-event-outcome`, 재현 스크립트 `capture.py`

---

## 1. 진단 — 왜 지금이 별로인가

여섯 화면을 나란히 놓고 보면 원인이 세 가지로 갈린다.

### A. 게임 안에 시각 언어가 **셋** 있고, 서로 안 맞는다

| 언어 | 쓰는 화면 | 상태 |
|---|---|---|
| ① 픽셀 월드 | 정착지 허브 | 완성도 높음 (픽셀 프레임·픽셀 버튼) |
| ② 디제틱 실물 셸 | 길(금속 콘솔)·이벤트(종이 야장)·지도·목표·가방 | **이 게임의 정체성.** 자산도 이미 갖춰짐 |
| ③ 일반 다크 UI 카드 | **시설 4종(장터·정비소·휴게소·통로)** | ← 약한 고리. 셸이 없어 웹앱처럼 보인다 |

플레이어가 **가장 자주 들어가는 화면이 하필 ③**이다. 7도시 × 4시설 = 28개 화면 전부.

### B. 히어로 사진이 시설마다 똑같다

대구의 장터·정비소·통로가 **전부 같은 돔 사진**을 쓴다(대조 이미지 2·3·4번). 화면 높이의 약 25%를
먹으면서 "장소가 바뀌었다"는 정보를 0으로 준다. 도시당 사진 1장뿐이라 구조적으로 그렇다.

### C. 혼잡의 실체 = 카드 스택 + 행마다 버튼

- **장터**: 게시판 카드 → 오늘의 거래 카드 → 품목 행들. 행마다 「산다」 버튼.
- **정비소**: 작업대 카드 → 차체 정비 행(「수리」) → 탭 4개(가로 잘림) → 카테고리 카드(사진 또 있음) → 품목 행들(「장착」).
- **통로**: 설명 카드 → 진행 카드 → 작업 카드 2개(각각 인물 사진 + 칩 + 실행문).

한 화면에 **내부 문법이 다른 카드가 3~5개** 쌓이고, **버튼이 행 수만큼** 늘어난다.

### D. 반대 문제 — 이벤트·길은 비어 있다

- 이벤트 종이 패널이 **고정 높이**라 두 줄짜리 대사에서 60% 이상이 빈 종이(대조 이미지 5번).
- 길 화면은 **상단 40%가 검은 여백**(6번).

즉 "정보가 너무 많은 화면"과 "너무 빈 화면"이 공존한다. 원인은 같다 — **컨테이너가 내용에 맞지 않는다.**

---

## 2. 해결 원칙

> **③을 없애고 ②로 흡수한다. 자산은 늘리지 말고 하나로 돌려 쓴다.**

Sang의 아이디어(길에 나오는 **전광판**)를 시스템으로 굳힌 것이 「현장 판」이다.

**세계관 근거** — 붕괴 후 사람들은 옛 전광판·간판 패널을 뜯어다 각 자리의 알림판으로 쓴다.
이미 콘텐츠에 있다: 대구 「전광판 휴게소」·「꺼진 전광판 배선」, 밀양 장터 게시판, 무주 터널 배전반,
대전 연구단지 상황판. 전부 "판"이다. 새 설정을 만드는 게 아니라 **있는 것을 UI로 승격**한다.

**핵심 계약: 이미지는 틀만, 내용은 코드가 그린다.**
이미지 gen이 만드는 것은 **판의 프레임과 질감**뿐이다. 글자·수치·목록·상태등은 전부 코드.
그래야 자산 1개로 28화면을 덮고, 한국어 길이가 변해도 안 깨진다.

---

## 3. 「현장 판」 사양

### 3-1. 화면 3층 고정 구조 (시설 4종 공통)

```
┌───────────────────────────────┐
│  ▓ 판(板) 머리                 │  ← 전광판 스트립. 높이 고정 ~92px
│  돔 중앙 장터        ● 영업 중  │     장소명(앰버 도트) + 상태 1줄
│  남부 물류와 게시판             │     배경 = 도시 팔레트 틴트 + 스캔라인
├───────────────────────────────┤
│  ▸ 의뢰            2건         │  ← 몸: **목록 하나**. 카드 스택 금지
│  ▸ 특송 · 무주 터널   D-2  고철25│     행 = [아이콘][이름+한 줄][비용][>]
│  ▸ 조달 · 부품 2개    D-6  고철18│
│                                │
│  ▸ 보급            6품목        │  ← 구획은 카드가 아니라 **얇은 구분 머리줄**
│  ▸ 길 위 기본 보급   고철5 40분  │
│  ▸ 연료 10L         고철5       │
│  ▸ 물 5통           고철1       │
├───────────────────────────────┤
│  선택: 연료 10L                 │  ← 발: **실행 바 하나**(고정)
│  고철 5 · 보유 60 → 55   [ 산다 ]│     행마다 버튼 두지 않는다
└───────────────────────────────┘
```

**바뀌는 것 세 가지**
1. 히어로 사진(25% 높이) → **판 머리(≈11%)**. 세로 공간을 목록에 돌려준다.
2. 카드 3~5개 → **목록 1개 + 구분 머리줄**. 테두리·배경 상자를 겹치지 않는다.
3. 행마다 버튼(N개) → **하단 실행 바 1개**. 행은 선택만 하고, 실행은 한 자리에서.

### 3-2. 판 머리의 상태 한 줄

시설별로 **한 줄만** 쓴다. 지금처럼 설명 문장을 두 줄 넣지 않는다.

| 시설 | 상태 줄 예 |
|---|---|
| 장터 | `● 영업 중 · 의뢰 2` |
| 정비소 | `● 화덕 가동 · 차체 82%` |
| 휴게소 | `● 사람 4 · 밤 교대` |
| 통로 | `○ 동선 0/2 확인` |

`●`는 코드로 그리는 LED. 도시 팔레트의 `window` 색을 쓴다(이미 `townPixelPalette()`에 7색 있다).

### 3-3. 도시 정체성은 **사진이 아니라 팔레트**로

7도시 사진 7장(≈200KB×7)을 새로 만들지 **않는다**. 판 프레임 1장을 도시 팔레트로 틴트한다.
`townPixelPalette()`의 `wall/trim/window/dark`를 CSS 변수로 내보내 판 머리에 적용하면 끝이다.
무주는 청록, 대전은 청색, 밀양은 갈색으로 자동으로 갈린다. **비용 0.**

기존 도착 사진(`arrivalScenes`)은 **도착 시네마틱에만** 남긴다. 시설 화면에서 반복 사용 금지.

---

## 4. 이미지 gen — 만들 것은 4개뿐

전부 **9-slice 프레임**이나 **작은 아이콘**이다. 늘려 붙이는 큰 패널(현재 이벤트 종이 196KB)을
새로 만들지 않는다. 참고: 기존 9-slice 프레임은 2~5KB, 늘림 패널은 47~196KB다.

### (1) 판 프레임 — `field-board-frame-v1.webp`

> Weathered salvaged electronic signboard frame for a 16-bit-adjacent post-collapse Korean
> survival game UI. Only the FRAME and its inner bezel — the center must be empty and flat so
> text can be drawn over it. Dark oxidized steel edge, visible rivets at the four corners, one
> chipped corner, faint rust bleed, a thin warm amber inner glow line along the top edge as if
> a dead LED strip still leaks light. Neutral desaturated charcoal and oxidized brown so it can
> be tinted per city. Straight edges, no perspective, no text, no logos, no icons, no people.
> Flat front view, transparent background outside the frame.

- 출력 **96×96 이상, 정사각**, 투명 WebP. `border-image ... 24 fill / 12px / 0 stretch`로 쓴다.
- **모서리 24px 안에 장식을 몰아넣을 것.** 가운데는 늘어나므로 무늬가 있으면 번진다.
- 목표 용량 **≤ 8KB**.

### (2) 스캔라인 타일 — `field-board-scan-v1.webp`

> Seamless tileable 8×8 pixel texture: two faint horizontal scanlines on transparency,
> as on a dying LED display panel. Extremely subtle, near-black with 6% opacity amber.
> No color fringing, no glow, no text.

- 8×8 반복 타일, 투명 WebP, **≤ 1KB**. 판 머리 위에 `repeat`로 얹어 전광판 느낌만 준다.

### (3) 시설 아이콘 4종 — `field-icon-{market,garage,people,alley}-v1.webp`

> Single flat pixel-art icon on transparent background, 32×32, for a post-collapse Korean
> settlement UI. Subject: [SUBJECT]. Muted charcoal with one warm amber accent pixel cluster.
> Crisp pixel clusters, no anti-aliasing, no text, no border, no background.

SUBJECT: `a market stall awning with hanging goods` / `a wrench crossed over a tire` /
`a fire bowl with two seated silhouettes` / `a narrow passage between two walls with a cable run`

- 각 **≤ 1.5KB**. 판 머리 왼쪽과 목록 구분 머리줄에 재사용.

### (4) 실행 바 바탕 — `field-action-bar-v1.webp`

> Narrow horizontal metal plate for a game UI action bar, salvaged and bolted, two bolts at
> each end, brushed dark steel with a faint amber top highlight. Frame/plate only, center flat
> and empty for text. No text, no icons, flat front view, transparent outside the plate.

- **≤ 4KB**, 9-slice(`... 16 fill / 8px / 0 stretch`).

> **만들지 말 것**: 도시별 시설 사진 28장, 큰 늘림 패널, 아이콘 세트 확장, 폰트 이미지.

---

## 5. 코드 구조

### 5-1. CSS 토큰 (신규, `src/01-style.html`)

```css
.field-board{
  --fb-frame:url("__UI_FIELD_BOARD_FRAME__");
  --fb-scan:url("__UI_FIELD_BOARD_SCAN__");
  /* 도시 팔레트에서 주입 — 기본값은 대구 */
  --fb-wall:#4d5557; --fb-trim:#a94e41; --fb-win:#e9b24e; --fb-dark:#12161a;
}
.field-board-head{
  position:relative; min-height:92px;
  border:12px solid transparent;
  border-image:var(--fb-frame) 24 fill / 12px / 0 stretch;
  background:linear-gradient(180deg,var(--fb-dark),#0a0d10) padding-box;
  image-rendering:pixelated;
}
.field-board-head::after{content:"";position:absolute;inset:0;
  background:var(--fb-scan) repeat;opacity:.5;pointer-events:none}
.field-board-led{width:6px;height:6px;border-radius:1px;background:var(--fb-win);
  box-shadow:0 0 5px color-mix(in srgb,var(--fb-win) 70%,transparent)}
```

도시 팔레트 주입은 `townPixelPalette()`가 이미 7색 세트를 들고 있으므로, 그 값을
`el.style.setProperty('--fb-wall',q.wall)` 식으로 넘기면 된다. **팔레트를 새로 만들지 말 것.**

### 5-2. DOM (시설 4종 공통 렌더러 하나)

`src/07-ui.js`의 `showStl()` 시설 분기(`market`/`garage`/`people`/`alley`)가 지금은 각자 다른
마크업을 만든다. **공통 렌더러 하나**로 합치고, 시설별로는 **데이터만** 넘긴다.

```js
/* 시설 화면은 전부 같은 판을 쓴다. 시설별 차이는 데이터(구획·행·실행)뿐이다.
   여기서 마크업을 갈라 쓰면 다시 카드 스택으로 되돌아간다. */
renderFieldBoard({
  icon:'market',
  title:'돔 중앙 장터',
  status:{led:'on', text:'영업 중 · 의뢰 2'},
  groups:[
    {label:'의뢰', count:2, rows:[ {id, name, sub, cost, meta:'D-2'} , ... ]},
    {label:'보급', count:6, rows:[ ... ]},
  ],
  onSelect(rowId){...},          // 행 선택 → 실행 바만 갱신
  action:{label:'산다', hint:'고철 5 · 보유 60 → 55', disabled:false, run(){...}},
});
```

**행 구조 계약** (이전에 `.npc-row`에서 터졌던 것과 같은 함정):
`[아이콘 24px] [이름+한 줄 (min-width:0)] [비용 nowrap] [> 8px]`
가운데 칸에 `min-width:0`이 없으면 비용 라벨이 본문 위에 얹힌다. `.npc-row` 주석 참고.

### 5-3. 이벤트·길의 빈 공간 (같은 원리, 별건)

- 이벤트 종이 패널: **고정 높이 → 내용 높이**(`min-height`만 남기고 `height` 제거).
  긴 대사에서 스크롤이 필요하면 종이 안쪽만 스크롤한다.
- 길 화면 상단 여백: 콘솔을 위로 올리거나, 남는 위쪽을 **현재 구간 판**(같은 `field-board-head`)으로
  채운다 — 목적지·남은 거리·시한을 한 줄로.

---

## 6. 예산·성능

- 현재 빌드 **36,869,691 bytes**, 하드 한도 **39,000,000** → 여유 약 2.1MB.
- 신규 자산 합계 **≤ 15KB**를 지킬 것(위 4개 상한의 합). 사진을 추가하는 순간 예산이 무너진다.
- `tools/build-html.mjs`의 `uiAssetPaths`에 4개 키를 추가하고 `__UI_*__` 플레이스홀더로 주입한다.
  기존 방식 그대로. **생성된 `서울까지400km.html`을 직접 고치지 말 것.**

---

## 7. 수용 기준 (측정 가능한 것만)

1. 대구·밀양·무주 3도시 × 시설 4종 = **12화면에서 히어로 사진 반복이 사라졌다**(도착 시네마틱 제외).
2. 시설 화면 한 장에 **테두리 있는 카드 컨테이너가 2개 이하**(현재 3~5개).
3. 시설 화면의 **실행 버튼이 화면당 1개**(현재 행 수만큼). 행은 선택만 한다.
4. 320×578에서 **가로 오버플로 0**, 잘리는 탭 없음(현재 정비소 탭이 잘린다).
5. 이벤트 종이 패널의 **빈 영역이 패널 높이의 35% 이하**(현재 60%+).
6. 7도시에서 판 머리 색이 **도시 팔레트대로 갈린다**(무주=청록, 대전=청색, 밀양=갈색).
7. 신규 자산 총합 **≤ 15KB**, 빌드 **< 39,000,000 bytes**.
8. 회귀 전부 통과:
   ```bash
   npm run build:html && npm run lint:dialogue && node tools/validate-content.cjs
   python3 tests/test_smoke.py
   python3 tests/test_settlement_story_overhaul.py
   python3 tests/test_ui_coherence_overhaul.py
   python3 tests/test_story_event_layout.py
   python3 tests/test_event_typography_layout.py
   python3 tests/test_narrative_coherence.py
   git diff --check
   ```
9. `audits/ui-density-2026-08-17/`에 **개선 후 같은 6장**을 같은 파일명 규칙으로 다시 찍고,
   `current-screens.jpg`와 나란히 붙인 비교 이미지를 남길 것. 스크린샷만으로 완료를 주장하지 말 것.

---

## 8. 하지 말 것

- 정착지 **허브의 픽셀 월드**는 건드리지 않는다. 완성돼 있고 Sang이 수용했다.
- 길 콘솔·지도·목표·가방·이벤트의 **기존 셸을 교체하지 않는다.** 판은 ③(시설 화면)만 대체한다.
- 도시별 시설 사진을 새로 만들지 않는다. 정체성은 팔레트로.
- 아이콘을 늘리지 않는다. 4종을 재사용한다.
- 정보를 **지우지** 말 것. 의뢰·시세·시간·재고는 그대로 두되 **한 목록으로 접는다**.
  (모르는 정보가 생기면 그건 개선이 아니라 후퇴다.)
- 텍스트를 이미지로 굽지 않는다. 전부 코드가 그린다.

---

## 9. 착수 순서 (권장)

1. `field-board-frame` 1장만 만들어 **장터 한 화면**에 적용 → Sang 확인.
2. 통과하면 정비소·휴게소·통로로 확장(같은 렌더러).
3. 7도시 팔레트 주입 → 12화면 대조 캡처.
4. 이벤트 패널 높이·길 상단 여백 정리.

1단계에서 멈추고 확인받는 것이 중요하다. 28화면을 한 번에 바꾸지 말 것.
