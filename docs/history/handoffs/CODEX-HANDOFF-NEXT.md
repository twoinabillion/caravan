# Codex handoff — 정착지 아트 후속 (Task 1–3 완료)

Date: 2026-08-17
전제: 스프라이트 아틀라스 v2(실제 크기 1:1 수작화)가 이미 라이브다.
- 현재 상태·경위: `CLAUDE-FABLE-HANDOFF.md` + `design-qa.md` 마지막 섹션 + `audits/settlement-story-overhaul-2026-08-17/audit.md` 마지막 섹션
- 생성기: `tools/settlement-atlas-v2.py` (이 파일을 실행하면 아틀라스 3종이 재생성됨)
- 런타임 계약: `src/05-scene.js` `townPixelAtlas()` 참고

절대 규칙 (원 핸드오프 §2·§4 그대로):
- `git reset` / `git clean` / `git checkout --` 금지. 작업 트리에는 커밋 전 작업이 많다.
- 236×306 논리 캔버스, 시설·인물 좌표, 히트 영역, 외곽 UI, 이동 로직 변경 금지.
- 생성된 `서울까지400km.html` 직접 수정 금지 — 소스 수정 후 `npm run build:html`.
- HTML 하드 한도 39,000,000 bytes (현재 38,989,808 — 여유 ~10KB).

---

## Task 1 — ✅ Codex 완료: ImageGen 기반 아트 패스 (선별 채택)

Claude는 이 환경에서 이미지 생성 모델을 쓸 수 없어 v2를 코드로 수작화했다.
ImageGen으로 더 풍부한 텍스처를 원하면 이 태스크를 실행하되, **채택 기준은
"현재 v2와 동일 크롭 비교에서 실제 게임 크기 기준 눈에 띄게 더 좋다"** 하나다.
아니면 버린다 (현재 v2는 이미 크리스프하고 계약을 전부 만족한다).

### 핵심 함정 — v1이 실패한 이유

v1은 큰 원화(건물 56×48, 사람 16×24)를 50×43 / 11×17 / 7×12로 **비정수
축소**해서 뭉개졌다. 반드시 지켜라:

1. 셀별로 **최종 크기의 정수배**로 생성한다 (건물 4×=200×172 또는 8×=400×344,
   사람 8×=88×136, 군중 8×=56×96).
2. 축소는 **nearest-neighbor로 정수배 축소만** 한다 (4×→1×, 8×→1×).
   비정수 리샘플·bicubic·안티앨리어싱 절대 금지.
3. 축소 후 1× 실크기에서 검수하고, 뭉개진 클러스터는 픽셀 단위로 손질한다.
   원화가 예뻐도 1×에서 안 읽히면 실패다.

### 생성 프롬프트 (셀당 1장씩, 총 12+8 서브젝트)

> Production-ready 16-bit top-down sprite for a grounded Korean post-collapse
> road-survival game. [SUBJECT]. Muted charcoal, weathered canvas, oxidized
> brown, olive and restrained amber light. Clear 3/4 top-down silhouette,
> crisp pixel clusters, no anti-aliasing, no text, no logos, no copyrighted
> characters, no Pokémon copies. Readable front entrance facing the viewer
> (buildings) / distinct hat, coat, carried prop or walking pose (people).
> Subject isolated on a flat #00FF00 chroma background with generous margin.

SUBJECT 12종: (건물) supply market stall with patched canvas awning / repair
garage with dark service opening and tire stack / communal campfire shelter
with benches and fire bowl / utility archive workshop with radio mast and
record shelves. (사람 8) 원 핸드오프 §6B의 조합 표를 따르되 셀 매핑 유지:
0=주인공 다온(amber 띠는 **11×17 기준 위에서 8번째 행**에 둘 것 — 런타임
오버레이가 같은 행에 겹침), 1–2=동료, 7=합류 인물(rust 코트), 나머지=주민.

### 아틀라스 계약 (v2 레이아웃 — 변경 금지)

```
캔버스 224×70 투명 WebP (lossless, cwebp -z 9 -exact)
건물 4셀 50×43 @ (i*55+2, 2)
사람 8셀 11×17 @ (i*13+2, 50)
군중 8셀  7×12 @ (i*9+110, 52)   ← 사람 셀 재축소 금지, 전용으로 그릴 것
색 ≤48, 파일 ≤4.5KB
```

파일명은 `town-world-sprite-{sheet-source,sheet-alpha,atlas}-v3.*`로 만들고,
`tools/build-html.mjs`의 아틀라스 경로 한 줄만 v2→v3로 바꾼다.
`townPixelAtlas()`는 건드리지 않는다 (레이아웃 동일하므로).

### 채택 판정 + QA (원 핸드오프 §9–§11 전체 적용)

```bash
npm run build:html && node --check src/05-scene.js
python3 audits/settlement-story-overhaul-2026-08-17/capture.py
# metrics.json: errors [] · overflow/escaped/small 전부 0
# v2와 동일 크롭 side-by-side 생성 후 육안 판정 — 더 좋을 때만 채택
python3 tests/test_settlement_story_overhaul.py
python3 tests/test_ui_coherence_overhaul.py
python3 tests/test_smoke.py   # 현재 전체 ✅ (실패 0건 기준선 유지할 것)
python3 tests/test_story_event_layout.py
python3 tests/test_event_typography_layout.py
```

비교 기준 이미지: `audits/settlement-story-overhaul-2026-08-17/after/daegu-sprite-focus-v1-vs-v2.png`

### 완료 결과 (2026-08-17)

- ImageGen 시설 4종은 v2보다 명백히 좋아 채택.
- ImageGen 사람·군중은 1×에서 v2보다 덜 읽혀 미채택; 후보 원본은 증거로 보존.
- 최종은 v3 시설 + v2 인물/군중 하이브리드, 224×70 · 47 opaque colors · 2,594B.
- 생성기 `tools/settlement-atlas-v3.py`, 런타임 `town-world-sprite-atlas-v3.webp`.
- 동일 크롭 비교와 7도시 콘택트 시트 생성, 캡처 10상태 클린, 회귀 5종 모두 통과.
- smoke를 현재 실제 이동 규칙(도착 뒤 입장)과 민지 지리(밀양→울산)에 맞춰 보정했고,
  도움 단계의 시각 변화도 코드 월드 소품으로 연결했다.

---

## Task 2 — ✅ Claude가 완료 (2026-08-17 오후)

`townPixelProps()`가 `src/05-scene.js`에 라이브. 도시당 저대비 소품 2개,
대로 가장자리 앵커. 재작업 불필요 — 소품을 만지려면 이 함수만 수정.

## Task 3 — ✅ Claude가 완료 (2026-08-17 오후)

`src/07-ui.js` `shotLock`으로 선택→결과 크롭 고정. `test_smoke.py` 전체 실패
0건. 재작업 불필요.
