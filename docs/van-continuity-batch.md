# 달구지 연속성 배치 — 재생성 대기 목록 (2026-08-07)

> **폐기된 색상 사양 (2026-08-11):** 아래의 파란 트럭 기준은 더 이상 사용하지 않는다.
> 현재 정본은 [`visual-canon-2026-08-11.md`](visual-canon-2026-08-11.md)와
> `assets/reference/dalguji-technical-canon-2026-08-11.webp`의 회베이지색 캡오버 박스 캠퍼다.

## 왜

게임에서 가장 자주 보이는 이미지 5장이 **정본과 다른 차**(베이지 승합차)를 그리고 있다.
정본은 `route-mid-fork.jpg`의 차: **낡은 파란 한국형 1톤 캡오버 트럭 + 적재함 위
목재·골강판 생활칸 + 따뜻한 창 + 지붕 짐·외부 물통**.

실측(2026-08-07, 전 컷 육안 대조):

| 파일 | 문제 | 노출 빈도 |
|---|---|---|
| `busan-departure.jpg` | 베이지 승합차 + **픽셀아트풍**(회화 정본과 스타일도 다름) | 오프닝 — 모든 런의 첫 화면 |
| `generic-story.jpg` | 베이지 승합차 | 스토리형 이벤트 기본 컷 |
| `generic-crisis.jpg` | 베이지 승합차 | 위기형 기본 컷 |
| `generic-discovery.jpg` | 베이지 승합차 | 발견형 기본 컷 |
| `generic-encounter.jpg` | 베이지 승합차 | 조우형 기본 컷 |

## 왜 자동으로 못 했나 (2026-08-07 시도 전부)

- `codex exec`(비대화형)에는 내장 `image_gen`이 노출되지 않음 — 확인함
- CLI 폴백(`scripts/image_gen.py`)은 `.env`의 `OPENAI_API_KEY`가 401 만료 — 확인함
- Apixel MCP는 메타데이터만 반환, 이미지는 앱 UI 전용 — 회수 불가 확인함
- Magnific MCP는 유료 플랜 요구

**→ 남은 길: 대화형 `codex` TUI에서 아래 프롬프트를 한 장씩 실행** (내장 image_gen은
대화형에서만 뜬다. 이전 배치들(8/3~8/5)도 전부 이 경로였다.)

## 실행 방법

```bash
cd /Users/sang/caravan && codex
# 아래 프롬프트를 한 장씩 붙여넣기. 저장 경로까지 지시에 포함돼 있음.
# 전부 끝나면: bash tools/apply-van-batch.sh   (크롭·JPEG 변환·빌드)
```

## 0. 레퍼런스 시트 (먼저 — 이후 컷들의 스타일 레퍼런스로 첨부)

> imagegen으로 생성해서 `assets/scenes/van-reference-sheet.png`로 저장:
> A single technical reference sheet of the SAME vehicle from three side-by-side
> angles (left profile, front three-quarter, rear three-quarter): a weathered blue
> Korean 1-ton cab-over utility truck, wooden and corrugated-steel living cabin
> built on the bed, one small warm-lit window, roof cargo with two external water
> jugs, tow rope on the front bumper. Painterly Korean post-apocalyptic realism,
> restrained indigo and earth palette, plain neutral gray studio background,
> no text, no logos. 16:9.

## 공통 프롬프트 머리 (1~5 전부 앞에 붙이기)

> Use `assets/scenes/van-reference-sheet.png` and `assets/scenes/route-mid-fork.jpg`
> as style/vehicle references only; generate a completely new scene featuring the
> SAME truck. 16:9 cinematic event illustration, painterly Korean post-apocalyptic
> realism, restrained indigo-and-earth palette, practical warm light, readable on
> a mobile card. No readable text, no logos, no watermark, no split panels, no UI.

## 1. `busan-departure.png` → 오프닝

> The blue truck leaving Busan's ruined Gamcheon container port at dawn, wet
> coastal road curving past collapsed cranes and stacked rusted containers, first
> sunlight on the sea, the truck's cabin window glowing warm, headed north.
> Save to assets/scenes/van-continuity/busan-departure.png

## 2. `generic-story.png` → 스토리 기본 컷

> Night roadside camp: the blue truck parked with a tarp awning, four travelers
> around a lantern listening to one person reading from a worn notebook, mudflat
> and distant ruined city lights behind.
> Save to assets/scenes/van-continuity/generic-story.png

## 3. `generic-crisis.png` → 위기 기본 컷

> Storm on a broken mountain road: the blue truck tilted at the edge of a washed-out
> lane, two travelers digging the wheel free and one bracing a tow line, rain,
> headlights cutting the dark.
> Save to assets/scenes/van-continuity/generic-crisis.png

## 4. `generic-discovery.png` → 발견 기본 컷

> The blue truck parked under a collapsed expressway rest-stop canopy; two
> travelers crouched by an opened supply locker with a lantern, overgrown ruins
> and low sun behind.
> Save to assets/scenes/van-continuity/generic-discovery.png

## 5. `generic-encounter.png` → 조우 기본 컷

> Dusk mountain highway: the blue truck stopped near strangers' small campfire,
> one traveler offering a water bottle, cautious body language on both sides,
> ruined overpass in the distance.
> Save to assets/scenes/van-continuity/generic-encounter.png
