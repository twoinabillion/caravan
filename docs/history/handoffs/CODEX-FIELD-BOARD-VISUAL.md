# Codex 지시서 — 현장 판 **시각 마감**: 정리된 화면을 예쁘게

Date: 2026-08-18
전제: 구조 작업(`CODEX-UI-FIELD-BOARD.md`)은 끝났다. 28화면이 이미 「판 머리 + 목록 하나 +
실행 바 하나」로 통일돼 있다. **이 문서는 구조를 바꾸지 않는다. 표면·재질·위계만 올린다.**

현재 상태 캡처: `audits/field-board-rollout-2026-08-18/` (28장 + `capture.py`)

> **2026-08-18 최종 구현 완료.** Phase 1 대구 장터 검증 뒤 Sang 승인에 따라 §5-1까지
> 적용했다. 의뢰는 `.field-board-note` 압정 쪽지, 물자·정비·주민·현장 동선은 기존 `ICO()`와
> 초상 기반 금속 행으로 분리했고 장식용 꺾쇠를 제거했다. `field-board-visual-finish`를
> **7도시 × 4시설 = 28화면**에 공통 적용했다. 전후 28화면 비교는
> `audits/field-board-visual-rollout-2026-08-18/`, 색·대비·320px 정렬 자동 검사는
> `tests/test_field_board_visual.py`에 있다.

---

## 0. 한 줄 요약

> 지금은 **은유를 절반만 구현**했다. 프레임(테두리)은 있는데 **판의 표면이 없다.**
> 길 화면은 금속, 이벤트는 종이인데 현장 판만 테두리 안쪽이 평평한 웹앱 리스트다.

---

## 1. 진단 — 왜 "정리는 됐는데 안 예쁜가"

`daegu-market.png`를 220%로 확대해 확인한 것들이다.

| # | 문제 | 근거 |
|---|---|---|
| 1 | **전광판이 전광판으로 안 보인다** | 스캔라인이 `opacity:.3` + `inset:11px` + `z-index:-1`이라 사실상 비가시. 판 머리가 그냥 어두운 사각형 + 흰 글씨다 |
| 2 | **몸통에 재질이 0** | 프레임만 디제틱하고 안쪽은 플랫 다크 UI. 이 게임의 다른 화면(금속 콘솔·종이 야장)과 격이 안 맞는다 |
| 3 | **모든 행이 같은 무게** | 아이콘+제목+설명+비용+`›`가 28행 내내 동일. 리듬이 없어 스프레드시트처럼 읽힌다 |
| 4 | **의뢰와 물자가 같은 생김새** | 성격이 다른 정보(부탁 vs 시세)인데 재질이 같다. "게시판"이라는 말이 그림으로 성립하지 않는다 |
| 5 | **색이 주황 하나** | 도시 팔레트가 판 머리에만 있고 몸통은 무채색. 7도시가 다 비슷해 보인다 |
| 6 | **선이 화면을 잘게 썬다** | 그룹 헤더 밑줄 + 행 사이 줄 + 소그룹 헤더가 겹쳐 조각난다 |
| 7 | **아이콘이 왜소** | 22px에 어두운 배경이라 거의 안 보인다. 의뢰의 주황 `▶`도 마찬가지 |

---

## 2. 방향 결정 — 왜 이 안인가

세 안을 만들어 비교했고 **B안(표면 + 위계, 도시색은 은은하게)** 로 확정한다.

- **A(현재)**: 평평함. 위 7개 문제 전부 해당.
- **B(채택)**: 판 머리 = 켜진 간판, 몸통 = 판 표면, 의뢰 = 압정 쪽지, 추천 = 불 들어온 행.
- **C(기각)**: B + 도시 **강조색(accent)** 을 크게 사용. 대구에 `#b94c3e`(녹슨 빨강)를 넓게 쓰니
  화면이 갈색으로 물들어 **대구의 회색 돔 정체성과 싸웠다.**

> **결정 규칙**: 판의 바탕은 `roof`(구조색)와 `light`(조명색)로만 만든다.
> `accent`는 **작은 포인트에만** 쓴다(쪽지 왼쪽 선, 배지). 넓은 면에 쓰지 않는다.

---

## 3. 색 — 계산까지 끝냈다. 그대로 쓰면 된다

출처는 기존 `D.settlementWorlds[*].palette`다. **새 팔레트를 만들지 말 것.**

### 3-1. 파생 규칙 (CSS `color-mix`로 런타임 계산)

| 토큰 | 계산식 | 쓰이는 곳 |
|---|---|---|
| `--fb-head-bg` | `color-mix(in srgb, var(--roof) 82%, #0e1113)` | 판 머리 바탕 |
| `--fb-body-bg` | `color-mix(in srgb, var(--roof) 34%, #131618)` | 몸통 표면 바탕 |
| `--fb-title` | `color-mix(in srgb, var(--light) 62%, #fff2d8)` | 판 제목 글자 |
| `--fb-glow` | `color-mix(in srgb, var(--light) 55%, transparent)` | 제목 글로우·LED |
| `--fb-group` | `var(--light)` | 그룹 머리글(의뢰/물자) |
| `--fb-pin` | `var(--accent)` | 쪽지 왼쪽 선·압정 (좁게만) |

### 3-2. 7도시 결과값 (검증 완료 — 구현 후 이 값과 대조할 것)

| 도시 | roof | light | accent | 판머리 바탕 | 몸통 바탕 | 제목색 | 제목 대비 |
|---|---|---|---|---|---|---|---|
| 광주 대인시장 | `#653d2d` | `#f1ad55` | `#d87542` | `#553528` | `#2f231f` | `#f6c787` | 6.98:1 |
| 밀양 장터 | `#776342` | `#f0c679` | `#b85b35` | `#64543a` | `#353026` | `#f6d79d` | 5.27:1 |
| 대구 돔 시장 | `#34383a` | `#e5a54c` | `#b94c3e` | `#2d3133` | `#1e2224` | `#efc281` | 7.95:1 |
| 무주 터널 | `#292a2a` | `#e6bd73` | `#6c8d86` | `#242626` | `#1a1d1e` | `#f0d199` | 10.35:1 |
| 전주 서문 시장 | `#413b34` | `#edba72` | `#9d5941` | `#38332e` | `#232322` | `#f4cf99` | 8.47:1 |
| 대전 연구단지 코뮌 | `#33414a` | `#77c5bd` | `#d69d4e` | `#2c3840` | `#1e2529` | `#abd6c7` | 7.54:1 |
| 수원 성곽 공동체 | `#3f433b` | `#e5b568` | `#8a6250` | `#363a34` | `#222524` | `#efcc93` | 7.58:1 |

**전 도시 제목 대비 5.2:1 이상** (최저 밀양 5.27). 밝은 도시(밀양)에서도 안전하다.
값을 임의로 바꿨다면 이 표를 다시 계산해 **4.5:1 아래로 떨어지지 않는지 확인**할 것.

---

## 4. 재질 규칙 — 무엇이 무엇처럼 보여야 하는가

| 요소 | 물건 | 시각 신호 |
|---|---|---|
| 판 머리 | **켜진 간판** | 도트 매트릭스 격자 + 스캔라인 + 제목 글로우 + 아래쪽 안쪽그림자 |
| 몸통 | **판의 금속 표면** | 상단 하이라이트 + 미세 브러시 결 + 전체 안쪽그림자 |
| 의뢰 행 | **압정으로 붙인 쪽지** | 밝은 종이 바탕 + 드롭섀도 + 위쪽 압정 점 + 왼쪽 accent 선 |
| 물자 행 | **판에 직접 적은 목록** | 배경 없음. 점선 구분선만 |
| 선택/추천 행 | **불이 들어온 칸** | light 워시 그라데이션 + 왼쪽 발광 바 |
| 아이콘 | **판에 박힌 금속 칩** | 26px, 입체 배경(상단 하이라이트), 라운드 3px |

---

## 5. CSS — 검증된 실물. 이 값을 그대로 이식하라

시안에서 실제로 렌더링해 확인한 코드다. `src/01-style.html`의 기존 `.field-board*` 규칙을
아래로 **교체**한다. 도시 변수(`--roof/--light/--accent`)는 이미 `fieldBoardShell()`이
인라인 스타일로 주입하고 있으므로 **주입부는 건드리지 말 것**(키 이름만 맞출 것).

```css
.field-board{
  /* 도시 팔레트 주입 지점 — 기본값은 대구 */
  --roof:#34383a; --light:#e5a54c; --accent:#b94c3e;
  --fb-head-bg:color-mix(in srgb,var(--roof) 82%,#0e1113);
  --fb-body-bg:color-mix(in srgb,var(--roof) 34%,#131618);
  --fb-title:color-mix(in srgb,var(--light) 62%,#fff2d8);
  display:flex;min-height:0;max-height:100%;flex:0 1 auto;flex-direction:column;
  color:#e6e1d7;background:transparent;overflow:hidden
}

/* ── 판 머리 = 켜진 간판 ── */
.field-board-head{
  position:relative;min-height:96px;padding:16px 18px 13px;overflow:hidden;
  /* ★정정(8/18): 기존 금속 프레임을 반드시 유지한다. 1px 테두리로 바꾸면
     판이 페이지에 녹아 '물건'이 아니게 된다 — 초판 사양의 오류였다. fill은 넣지 말 것. */
  border:12px solid transparent;border-image:var(--fb-frame) 24 / 12px / 0 stretch;
  image-rendering:pixelated;
  background:
    repeating-linear-gradient(180deg,rgba(0,0,0,.30) 0 1px,transparent 1px 3px),
    radial-gradient(120% 150% at 12% -10%,color-mix(in srgb,var(--light) 18%,transparent),transparent 55%),
    /* ★정정(8/18): 끝값을 페이지 배경(#0b0d10)까지 떨어뜨리면 판 아래쪽 모서리가 사라진다.
       도시 roof를 섞어 바닥을 띄운다. */
    linear-gradient(168deg,var(--fb-head-bg),color-mix(in srgb,var(--roof) 46%,#101315) 70%,color-mix(in srgb,var(--roof) 30%,#0d1012));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.14),
             inset 0 -14px 22px rgba(0,0,0,.42),
             0 5px 16px rgba(0,0,0,.6)
}
/* LED 도트 격자 — 이것이 "전광판"을 만든다. opacity를 .5 아래로 내리지 말 것 */
.field-board-head::after{
  content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:radial-gradient(circle at 50% 50%,rgba(0,0,0,.55) 32%,transparent 34%);
  background-size:3px 3px
}
.field-board-mark{position:relative;z-index:2;display:block;margin-bottom:7px;
  color:#7e8a86;font:800 7px/1 var(--mono);letter-spacing:.2em}
.field-board-head>div{position:relative;z-index:2;display:flex;align-items:baseline;
  justify-content:space-between;gap:10px}
.field-board-head h3{margin:0;color:var(--fb-title);font:900 20px/1.05 var(--sans);
  letter-spacing:-.01em;
  text-shadow:0 0 12px color-mix(in srgb,var(--light) 55%,transparent),
              0 0 3px color-mix(in srgb,var(--light) 80%,transparent)}
.field-board-head em{flex:none;color:#93a09b;font:700 8px/1 var(--mono);font-style:normal;
  white-space:nowrap}
.field-board-head i{display:inline-block;width:5px;height:5px;margin-right:7px;border-radius:1px;
  background:var(--light);box-shadow:0 0 7px var(--light)}
.field-board-head p{position:relative;z-index:2;margin:6px 0 0;color:#9aa3a0;font:600 9px/1.2 var(--sans)}

/* ── 몸통 = 판 표면 ── */
.field-board-body{
  min-height:0;flex:0 1 auto;margin-top:7px;padding:9px 11px 14px;overflow-y:auto;
  overscroll-behavior:contain;border-radius:3px;border:0;
  background:
    linear-gradient(180deg,rgba(255,255,255,.035),transparent 90px),
    repeating-linear-gradient(93deg,rgba(255,255,255,.012) 0 2px,transparent 2px 5px),
    linear-gradient(172deg,var(--fb-body-bg),#111416);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05),inset 0 0 40px rgba(0,0,0,.45);
  /* 잘린 마지막 행을 "스크롤 신호"로 읽히게 */
  mask-image:linear-gradient(180deg,#000 calc(100% - 22px),transparent);
  -webkit-mask-image:linear-gradient(180deg,#000 calc(100% - 22px),transparent)
}

/* ── 그룹 머리글: 밑줄 대신 여백으로 묶는다 ── */
.field-board-group>header{
  display:flex;align-items:baseline;justify-content:space-between;gap:10px;
  min-height:0;padding:13px 3px 6px;border:0
}
.field-board-group>header span{color:var(--light);font:800 9px/1 var(--mono);letter-spacing:.15em}
.field-board-group>header b{color:#7f8a87;font:700 8px/1 var(--mono)}

/* ── 물자 행 = 판에 직접 적은 목록 ── */
.field-board-row{display:flex;align-items:center;gap:10px;padding:9px 4px;
  width:100%;border:0;background:none;text-align:left}
.field-board-row+.field-board-row{border-top:1px dashed rgba(255,255,255,.055)}
.field-board-row .field-board-ic{width:26px;height:26px;flex:none;border-radius:3px;
  display:grid;place-content:center;
  background:linear-gradient(160deg,
    color-mix(in srgb,var(--roof) 60%,#3a3f36),color-mix(in srgb,var(--roof) 40%,#22262a));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
.field-board-row .field-board-tx{flex:1;min-width:0}   /* ← 필수. 없으면 비용 라벨이 본문에 겹친다 */
.field-board-row .field-board-tx b{display:block;color:#e9e3d6;font:700 13px/1.25 var(--sans);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.field-board-row .field-board-tx small{display:block;color:#7f8a87;font:400 10px/1.3 var(--sans)}
.field-board-row .field-board-row-meta{flex:none;color:#cbb188;font:700 9px/1 var(--mono);white-space:nowrap}
.field-board-chevron{display:none}   /* 행 전체가 버튼이므로 꺾쇠는 제거 */

/* ── 선택/추천 행 = 불이 들어온 칸 ── */
.field-board-row.selected,.field-board-row[aria-pressed="true"]{
  margin:2px -6px;padding:11px 10px;border-radius:3px;border-top:0;
  background:linear-gradient(100deg,
    color-mix(in srgb,var(--light) 22%,transparent),
    color-mix(in srgb,var(--light) 6%,transparent) 62%,transparent);
  box-shadow:inset 2px 0 0 var(--light),0 2px 8px rgba(0,0,0,.4)}
.field-board-row.selected .field-board-tx b{color:color-mix(in srgb,var(--light) 45%,#fff0d9)}

/* ── 의뢰 = 압정으로 붙인 쪽지 ── */
.field-board-note{position:relative;display:block;width:100%;margin:0 0 7px;
  padding:10px 12px 10px 13px;border:0;border-left:2px solid var(--accent);border-radius:2px;
  text-align:left;
  background:linear-gradient(168deg,#3a332a,#2a251e);
  box-shadow:0 2px 6px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06)}
.field-board-note::before{content:"";position:absolute;top:-3px;left:12px;width:7px;height:7px;
  border-radius:50%;background:radial-gradient(circle at 35% 30%,#d9b071,#7d5a2c);
  box-shadow:0 1px 2px rgba(0,0,0,.6)}
.field-board-note>div{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.field-board-note b{color:#f3e6cd;font:700 13px/1.25 var(--sans)}
.field-board-note .field-board-row-meta{flex:none;color:#e0b573;font:700 9px/1 var(--mono)}
.field-board-note small{display:block;margin-top:3px;color:#a2988a;font:400 10px/1.4 var(--sans)}
```

### 5-1. 마크업에서 바꿀 것 (`src/07-ui.js`)

1. **의뢰 행만 `.field-board-note`로** 렌더한다(현재는 물자와 같은 `.field-board-row`).
   구조는 `<button class="field-board-note"><div><b>제목</b><span class="field-board-row-meta">비용</span></div><small>설명</small></button>`.
2. **아이콘은 게임 기존 `ICO()`를 쓴다.** 시안의 이모지는 임시다. 이모지를 넣지 말 것.
3. `.field-board-chevron`(`›`)은 CSS에서 숨기므로 마크업에서 지워도 된다.

---

## 6. 이미지 생성 — **선택 사항 1장뿐**

위 CSS만으로 시안 수준이 나온다. 자산 없이 먼저 구현하고, 한 단계 더 올리고 싶을 때만 추가하라.

### (선택) 판 표면 질감 타일 — `field-board-grain-v1.webp`

> Seamless tileable 64×64 texture for a game UI panel surface: brushed dark steel with very
> fine horizontal grain, a few faint scratches, subtle uneven dust mottling. Near-black,
> extremely low contrast — it must read as texture, not pattern. Neutral grey with no color
> cast so it can be tinted. No text, no logos, no rivets, no edges, no vignette.

- 64×64 **seamless**, WebP, **≤ 4KB**.
- 적용: `.field-board-body`의 `background` 맨 앞에 `url(...) repeat` 추가, `opacity`는
  `background-blend-mode:overlay` 또는 별도 `::before`로 **0.10~0.15**만.
- **주의**: 무늬가 보이면 실패다. "질감이 있는 것 같은데 뭔지 모르겠다"가 성공 기준.

> **만들지 말 것**: 도시별 판 이미지 7장, 시설별 사진 28장, 아이콘 세트 신규,
> 큰 늘림 패널, 글자가 구워진 이미지.

---

## 7. 타이포 위계 (현재 → 목표)

| 요소 | 현재 | 목표 | 이유 |
|---|---|---|---|
| 판 제목 | 17px / 900 | **20px / 900 + 글로우** | 화면의 유일한 주인공 |
| 앞머리표 | 7px | 7px (유지) | 위치 확인용, 조용해야 함 |
| 부제 | 9px | 9px (유지) | |
| 그룹 머리글 | 9px mono | 9px mono (유지, 색만 `--light`) | |
| 행 제목 | 13px / 700 | 13px / 700 (유지) | |
| 행 설명 | 10px | 10px (유지) | |
| 비용 | 9px mono | 9px mono (유지) | |

**바꾸는 건 제목 하나뿐**이다. 나머지를 키우면 다시 혼잡해진다.

---

## 8. 수용 기준

1. 7도시 판 머리 바탕색이 **§3-2 표의 값과 일치**(±2 이내). 스포이드로 확인할 것.
2. 7도시 제목 대비 **전부 4.5:1 이상**.
3. 판 머리에 **도트 격자가 육안으로 보인다**(220% 확대 시 명확).
4. 의뢰와 물자가 **다른 재질로 보인다**(쪽지 vs 목록).
5. 선택 행에 **불이 들어온 것처럼** 보인다.
6. 320×578에서 **가로 오버플로 0**, 비용 라벨이 본문과 겹치지 않음
   (`.field-board-tx{min-width:0}` 누락이 유일한 원인이다 — 과거 `.npc-row`에서 동일 사고).
7. 신규 자산 **0장**(선택 질감 타일을 넣었다면 ≤ 4KB), 빌드 **< 39,000,000 bytes**.
8. 회귀 전부 통과:
   ```bash
   npm run build:html && npm run lint:dialogue && node tools/validate-content.cjs
   python3 tests/test_smoke.py
   python3 tests/test_field_board_rollout.py
   python3 tests/test_settlement_story_overhaul.py
   python3 tests/test_ui_coherence_overhaul.py
   python3 tests/test_narrative_coherence.py
   python3 tests/test_story_event_layout.py
   python3 tests/test_event_typography_layout.py
   git diff --check
   ```
9. `python3 audits/field-board-rollout-2026-08-18/capture.py`로 28장을 다시 찍고,
   **개선 전후를 나란히 붙인 비교 이미지**를 남길 것. 스크린샷만으로 완료를 주장하지 말 것.

---

## 9. 하지 말 것

- **구조를 바꾸지 마라.** 판 머리 + 목록 하나 + 실행 바 하나는 확정이다.
- **`accent`를 넓은 면에 쓰지 마라.** 대구가 갈색으로 물들어 회색 돔 정체성과 싸운다(C안 기각 사유).
- **`border-image`에 `fill`을 다시 넣지 마라.** 프레임 중앙이 불투명(alpha 1)이라 도시색을
  통째로 덮는다 — 7도시가 똑같아졌던 실제 원인이다(2026-08-18).
- **정보를 지우지 마라.** 의뢰·시세·시간·재고는 그대로 두고 재질로만 구분한다.
- **행 높이를 키우지 마라.** 지금 목록 밀도는 적절하다.
- **이모지를 쓰지 마라.** 아이콘은 `ICO()`.
- **다크 UI 상투구를 넣지 마라** — 보라/파랑 그라데이션, 네온 테두리, 유리 블러, 큰 라운드.
  이 게임은 2169년 붕괴 후 한국이다.

---

## 10. 착수 순서

1. §5 CSS를 통째로 이식 → **대구 장터 한 화면**만 확인.
2. §5-1 마크업 3가지 변경(의뢰 쪽지화 / `ICO()` / 꺾쇠 제거).
3. 7도시 색을 §3-2 표와 대조.
4. 28장 재캡처 + 전후 비교 이미지.
5. (선택) 질감 타일 1장 추가.

1단계에서 멈추고 Sang에게 확인받을 것. 28화면을 한 번에 바꾸지 말 것.
