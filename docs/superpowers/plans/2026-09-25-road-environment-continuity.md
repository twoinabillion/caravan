# 주행 풍경 연속성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax. Subagent-driven execution is an alternative only after the user selects it; this document does not authorize delegation, commits, push or deployment.

**Goal:** Sang이 좋아한 청회색 주행 풍경을 유지하면서 지역별 화풍 격차, 해의 잘못된 가림, 중간에 튀는 풍경 전환을 해결한다.

**Architecture:** 기존 Canvas 2D 렌더러 안에서 공통 하늘·천체와 지역 지형·시설을 분리한다. 현재 게임 상태에서 지역 표현을 읽고, 불투명한 지형과 시설을 거리 순서대로 그린다. 차량·사건 접근·브레이크·날씨·게임 저장 구조는 유지한다.

**Tech Stack:** 기존 JavaScript IIFE, Canvas 2D, Node VM 기반 렌더러 검사, WebP/alpha 자산, 단일 HTML 빌더, Caravan live preview.

**Spec:** 이 문서의 [설계 기준](#설계-기준). 앞선 상담을 실행 가능한 초안으로 정리했으며, 구현 승인은 아직 받지 않았다.

**Status:** 계획만 작성. 게임 코드·이미지·사용자 저장·열린 화면은 변경하지 않았다. 현재 사용자 화면의 새로운 STOP 캡처가 없으므로 시각적 원인 확인은 소스와 배경 원본에 한정된다.

## 설계 기준

### 사용자가 원하는 결과와 제안의 구분

- 확인된 취향: 현재 좋은 배경과 달구지의 분위기를 좋아한다. 좋은/나쁜 배경이 번갈아 보이는 것과 해가 지형 앞에 떠 보이는 것이 불만이다.
- 디렉터 제안: 먼저 양산→밀양 34km를 대표 구간으로 완성하고, 동일한 제작 기준으로 나머지 지역을 확장한다.
- 성공 경험: 화면이 다른 그림으로 바뀌었다기보다 도시 외곽을 지나 들판으로 들어왔다는 느낌을 준다. 배경을 개선해도 앞에서 벌어지는 사건은 즉시 구분된다.
- 범위: 주행/정차의 도로 Canvas 표현. 사건 삽화, 정착지 내부, 지도 레이아웃, 동료, 대사, 경제와 이동 시간은 재설계하지 않는다.

### 확인된 원인

| 소유 코드 | 확인 내용 | 해결 계약 |
| --- | --- | --- |
| `src/05-scene.js`의 `drawBackdrop` | `overpass`에만 전용 그림을 적용하고 다른 지역은 기존 절차적 배경을 사용 | 대표 구간 양 끝의 묘사 수준을 함께 맞춘다 |
| `drawSky` / `drawCelestial` / `drawBackdrop` | 천체를 하늘에 그린 후 overpass 그림 위에 또 그리며, `painted` 여부로 위치도 바뀜 | 한 프레임에 하나의 천체 상태, 지형보다 뒤에서 한 번만 그린다 |
| `drawRoadBackdrop` | 하늘까지 포함한 두 배경 전체를 alpha로 섞음 | 하늘은 공유하고, 지형은 형태/배치로 전이한다 |
| `poles` | `mix < .5`에서 가로등/난간을 일괄 전환하고 도착지 overpass를 고려하지 않음 | 각 시설이 이동해 화면을 벗어나며 양방향 전환을 지원한다 |
| `assets/ui/journey-road-backdrop-v1.webp` | 하늘·구름·산·도시가 한 장에 담겨 있음 | 승인 그림은 정본으로 보존하고 주행 전용 투명 층을 별도 제작한다 |

현재 양산과 밀양의 `nodeBio`는 모두 `rural`이다. 다른 것은 `nodeScenery`의 `overpass`와 `orchard`이므로, 도시/농촌 biome만 비교하는 테스트는 이 문제를 놓친다.

### 선택한 방향과 대안

1. **추천 — 층별 주행 풍경:** 기존 Canvas와 전용 자산을 결합한다. 그림 제작이 필요하지만 지역 변화·해 가림·움직임을 같은 구조에서 해결한다.
2. **코드만 수정:** 해의 중복과 시설 전환은 고칠 수 있으나 기존 배경 사이의 묘사 수준 격차는 남는다. 비상 교정 범위로만 취급한다.
3. **지역별 완성 그림 교체:** 정지 화면은 좋아질 수 있지만 전체 그림의 크로스페이드와 고정 하늘 문제가 반복된다. 주행의 최종 구조로 선택하지 않는다.

### 화면 구성과 빛

그리는 순서는 `하늘 → 해/달 → 구름 → 먼 산 → 지역 중경 → 길가 시설/도로 → 사건 단서/달구지 → 날씨`로 고정한다. 실제 도로와 시설 사이의 순서는 기존 접지 관계를 보존한다.

- 해의 중심과 밝기는 시간·날씨만으로 계산한다. 지역 종류가 해의 위치를 바꾸지 않는다.
- 06:00 일출, 18:00 일몰을 초기 연출 기준으로 삼는다. 정확한 계절/방위 천문 시뮬레이션을 주장하지 않는다.
- 해는 지평선에서 올라왔다가 내려간다. 원반뿐 아니라 광륜도 불투명한 산·건물 뒤에 가려진다. 달에도 같은 계약을 적용한다.
- 구름은 자체 느린 이동, 먼 산은 가장 느린 시차, 중경과 도로변은 차례대로 빠른 시차를 갖는다.
- 낮/저녁/밤은 동일 지형을 유지한다. 하늘과 환경의 색조, 실제 창문/실내 조명을 바꾸며 시간대별 완성 그림을 갈아 끼우지 않는다.
- 날씨는 가독성을 해치지 않는 범위에서 유지한다. 안개 속 해는 약해지고, 맑은 날과 동일한 선명도의 원반이 튀어나오지 않는다.

### 지역 변화

- 1차: 양산 고가도로/도시 외곽 → 건물이 드문 완충지 → 밀양 들판/과수원. 반대 방향도 검수한다.
- 먼 산의 윤곽/높이와 땅 색은 연속적으로 변화한다. 건물·나무·가로등은 세계 좌표의 개체로 배치하고, 보이는 동안 종류를 바꾸지 않는다.
- 같은 프레임에서 두 불투명한 마을 전체가 반투명하게 겹쳐 보이면 실패다.
- 하늘이 깜빡이거나 가로등/난간이 화면 안에서 한꺼번에 사라져도 실패다.
- 2차 배경군: 도시 외곽, 농촌, 산악, 공업, 해안, 강/호수. 대나무·갈대 등은 지역별 식생으로 유지한다. 이는 시각적 분류이며 `D.nodeBio`의 게임 의미를 바꾸지 않는다.
- 랜드마크는 해당 지역에만 나온다. 남산 같은 고유 지형은 새 공용 자산에 그려 넣지 않는다. 지형은 게임 지리의 설명용이며 실제 도로를 측량한 풍경이라고 표현하지 않는다.

## Global Constraints

- `서울까지400km.html`은 생성물이다. 직접 편집하지 않는다.
- `236` 논리 폭, `2×` 렌더 버퍼, 현재 달구지 배율과 개조/승객/날씨/제동을 유지한다.
- 사건 접근은 발견 → 감속 → 정차 → 사건 화면 순서를 유지한다. 접근 차량 너비는 달구지의 약45–55%, 성인은 접근 차량 차체 높이의 약절반, 성장폭은18–20% 이내다.
- 이동 중 사건 그림을 도로 위에 얹지 않는다. 새 그림은 승인된 live renderer의 지형 부품으로만 등록한다.
- raster 제작 전 `docs/IMAGE-BIBLE.md`, `assets/visual-contract.json`, `imagegen` 스킬을 읽는다. 계약의 공통/네거티브 프롬프트와 필수 참조4개, 기존 승인 배경을 함께 사용한다.
- 기존 스타일 `caravan-grounded-cinematic-v1`의 색·질감과 승인된 주행 renderer를 따른다. 주행용 자산을 사건/초상 용도에 재사용하지 않는다.
- 새 자산은 gallery에서 먼저 검수한 뒤 연결한다. `docs/IMAGE-BIBLE.md`와 JSON에 live layer 용도/규격을 명시하고 기존 사건/초상 예외를 넓히지 않는다.
- 소스는 `src/`, 자산은 `assets/`, 도구는 `tools/`의 기존 소유 경로를 따른다. 테스트는 기존 `tests/`에 둔다. 이번 작업에서 CSS/DOM/UI 레이아웃은 변경하지 않는다.
- 구조/JS/자산 적용은 `새 코드 준비됨`을 통해 의도적으로 수행한다. 현재 저장을 초기화하거나 테스트용으로 게임 위치/시간을 덮어쓰지 않는다.
- `MAX_BYTES=80_000_000`, `WARN_BYTES=32_000_000`을 올리지 않는다. 보고서 기준 현재79,905,231bytes로 상한까지94,769bytes만 남았다. 실행 때 실제 빌드 크기를 다시 확인한다.

## Review Focus

1. 전환 중간에 새로고침/이어하기: 같은 경로·진행률·시간으로 복구되고 보상/자원이 바뀌지 않아야 한다. Task4/5.
2. 일부 이미지의 늦은 로딩 또는 실패: 레이어가 중간에 튀어나오거나 하늘이 사라지지 않아야 한다. Task2/4.
3. 짧은 경로·반대 방향·같은 biome의 다른 motif: 양쪽 지역을 올바르게 읽고 시설이 화면 안에서 변하지 않아야 한다. Task1/4/6.
4. 작은/긴 화면과 저녁의 낮은 해: 해/광륜/달이 지형 앞에 덧그려지거나 둘로 보이지 않아야 한다. Task3/5.
5. 비/안개, 실제 개조와 사건 접근이 동시 발생: 좋은 배경 때문에 사건이나 차가 묻히지 않고 제동도 연속적이어야 한다. Task5/6.

## 파일과 인터페이스

| 파일 | 책임 |
| --- | --- |
| `src/05-scene.js` | 공통 천체, 층별 합성, 캐시, 시설의 연속 배치. 기존 SCENE 공개 API 유지 |
| `src/03-data.js` | 필요한 경우 지역 시각 프로필만 추가. 노드/연결/비용/biome의 게임 값은 보존 |
| `assets/ui/road-environment/manifest.json` (신규) | 각 층의 파일·크기·anchor·목적·원본·검수 상태 |
| `assets/ui/road-environment/*-v1.webp` (신규) | 투명 지형/중경 부품. 사람/차량/해/달/문자 제외 |
| `assets/visual-contract.json`, `docs/IMAGE-BIBLE.md` | live terrain layer의 제한된 자산 계약 |
| `tools/build-html.mjs` | renderer placeholder 내장, 필요한 자산 교체/중복 제거 |
| `tools/check-road-environment.mjs` (신규) | manifest/치수/alpha/연결/용량 검증 |
| `tests/test_journey_renderer.cjs` | 기존 기능 회귀와 renderer 합성 순서 검사 |
| `tests/test_road_environment.cjs` (신규) | 천체/전환/지역 매핑/상태 보존 계약 |
| `audits/road-environment-2026-09-25/README.md` (신규) | 실행 시 원본 상태·실제 비교 영상/캡처·검증 결과와 한계 |

새 내부 함수의 계획상 계약:

```js
// 순수 계산. 아래 이름은 계획된 내부 함수이며 현재 구현되어 있지 않다.
roadLightAt(hour, wx) // -> {sun:{x,y,alpha}, moon:{x,y,alpha}, darkness}
roadVisualProfile(nodeId) // -> {family, motif}; D.nodeBio / D.nodeScenery 사용
roadTransitionAt(distanceKm, goneKm) // -> 0..1, 유한하고 단조 증가
roadCellKind(cellIndex, boundaryCell, fromKind, toKind) // -> 고정 개체 종류
```

좌표 `x/y`는 Canvas 폭/높이에 대한0..1 정규화 값이다. 테스트는 SCENE IIFE의 마지막 return 앞에 테스트 전용 export를 주입해 순수 함수를 읽는다. 제품에 QA용 global이나 게임 상태 변경 버튼을 추가하지 않는다.

## Task 1: 대표 구간 재현과 변경 범위 고정

**Files:** Read `src/05-scene.js`, `src/03-data.js`, `tests/test_journey_renderer.cjs`; Create `tests/test_road_environment.cjs` and audit evidence at implementation time.

- [ ] 사용자 현재 화면을 `qa:current` 또는 명시적으로 받은 STOP/QA JSON으로 기록한다. 연결되지 않으면 현재 화면 검수는 대기로 표시하고 다른 저장을 동일 상태라고 부르지 않는다.
- [ ] 원본 파일의 diff/hash와 실제 HTML 크기를 기록한다. 기존 수정된 `AGENTS.md`를 보존한다. 새 게임/처음부터 테스트를 누르지 않는다.
- [ ] 현재 renderer VM 테스트를 실행하고 기존 로딩/날씨/개조/주행 검사의 결과를 보존한다: `node tests/test_journey_renderer.cjs`.
- [ ] 별도 테스트 상태에서 실제 `D.edges`의 양산↔밀양34km, 진행률0/25/49/50/51/75/100%를 사용한다. 기존 자료의 임의 biome 값을 복사하지 않는다.
- [ ] 렌더 호출 순서를 수집하는 테스트를 작성한다. `drawCelestial`을 test-only wrapper로 세어 맑은 낮의 overpass에서도1회여야 한다는 assertion이 현재2회로 실패하는 것을 기록한다.

```js
// 기존 테스트의 source를 VM에 넣기 직전 삽입하는 instrumentation.
const marker = '  return {init,initTitle,draw,drawTitle,';
assert.equal(source.split(marker).length, 2);
const instrumented = source.replace(marker, `
  const actualCelestial=drawCelestial;
  drawCelestial=(...args)=>{ globalThis.celestialCalls++; return actualCelestial(...args); };
${marker}`);
context.celestialCalls=0;
vm.runInContext(instrumented+';globalThis.scene=SCENE;', context);
context.scene.init(canvas());
context.scene.draw(.016);
assert.equal(context.celestialCalls, 1);
```

**完了条件:** 실제 사용자 기준과 분리된 테스트 기준이 구분되고, 잘못된 합성의 실패 검사가 존재한다. 아직 그림을 교체하지 않는다.

## Task 2: 대표 구간용 자산·용량 확보

**Files:** Create manifest/checker and5delivery layers; Modify contract/bible/build asset mapping only as required.

- [ ] 최초 자산은5개로 제한한다: `south-ridge-v1.webp`, `yangsan-skyline-v1.webp`, `yangsan-verge-v1.webp`, `miryang-orchard-v1.webp`, `miryang-verge-v1.webp`. 하늘/천체는 넣지 않고 먼 산은 양쪽에서 공유한다.
- [ ] 계약 제안값: master1536×864 이상, delivery1024×576 sRGB alpha WebP, 파일당150KB 이하 목표. 공통 horizon/ground anchor를 manifest에 수치로 저장한다. 달구지와 사건은 자산에 포함하지 않는다.
- [ ] 승인 원본을 imagegen의 편집/참조로 사용해 층을 제작한다. 앞 물체에 가려져 원본에 없는 부분은 복원한다. 단순한 사각형 잘라내기만으로 독립 층이 만들어졌다고 간주하지 않는다.
- [ ] gallery에서 투명 경계, 하얀 테두리, 산 너머 빈 구멍, 색감과 좌우 반복 경계를 먼저 검수한다. 방향이 있는 간판/고유 랜드마크는 반전 반복 tile에 넣지 않는다.
- [ ] 새 자산의 base64 증가량을 계산한다. 사용하지 않게 되는 기존 backdrop 내장을 제거하되 정본 파일은 보존한다. 추가 여유가 필요하면 기존 PNG의 무손실 WebP 변환을 별도로 비교하여 decoded RGBA가 동일할 때만 빌드 참조를 교체한다. 무손실로 부족하면 신규 층의 공유/압축안을 재검수하고, 다른 그림의 손실 재압축은 따로 승인받는다.

```js
const encodedBytes = bytes => 4 * Math.ceil(bytes / 3);
const projected = currentHtmlBytes - removedEmbeddedBytes + addedEmbeddedBytes + codeGrowthBytes;
assert(projected <= 80_000_000, `HTML budget exceeded: ${projected}`);
assert(layer.width === 1024 && layer.height === 576);
assert(layer.hasAlpha && layer.transparentPixelCount > 0);
```

- [ ] `node tools/check-road-environment.mjs`가 opaque 입력, 잘못된 치수, 누락 파일을 각각 거부하는 fixture를 먼저 작성하고 통과/실패를 확인한다. 기존 scene checker도 유지한다.
- [ ] 한 구간에서 사용할 모든 레이어가 준비되었을 때만 새 세트를 활성화한다. 부분 로딩 중에는 직전의 완전한 세트를 유지한다. cold start는 같은 palette의 공통 fallback을 사용하고 성공/실패 여부를 프레임마다 토글하지 않는다.

**완료 조건:**5개 층을 gallery에서 승인했고 실제 빌드 상한을 지킬 경로가 확인됐다. `naturalWidth>0`만으로 화풍 검수를 대체하지 않는다.

## Task 3: 공통 하늘·천체·가림

**Files:** Modify `src/05-scene.js`; Test `tests/test_road_environment.cjs`, `tests/test_journey_renderer.cjs`.

- [ ] Task1의 중복 천체 검사, 지역을 바꿔도 동일 시각 좌표가 같은 검사, 05:59→06:00/17:59→18:00의 연속성 검사를 먼저 작성한다. 아침/저녁의 원반이 지형 뒤에 가려지는 실제 Canvas 픽셀 검사도 별도 fixture에 둔다.
- [ ] 다음 계산을 초기 기준으로 구현하고 색/원반 크기는 실제 화면에서 조정한다. `painted` 위치 분기를 제거한다. 달도 지역 독립 시간 함수로 계산하고 달 모양은 하늘색 원을 덧칠하지 말고 별도 작은 투명 버퍼에서 잘라낸다.

```js
const clamp01 = value => Math.max(0, Math.min(1, value));
const hour24 = hour => ((hour % 24) + 24) % 24;
function sunAt(hour, weatherVisibility) {
  const h=hour24(hour), p=clamp01((h-6)/12);
  return {
    x:.15+.7*p,
    y:.67-.49*Math.sin(Math.PI*p),
    alpha:h>=6&&h<=18 ? Math.min(1,Math.min(p,1-p)*12)*weatherVisibility : 0
  };
}
```

- [ ] `drawSky`는 frame당1회 호출한다. 해와 광륜을 그린 뒤 투명 산/도시 층을 얹는다. 어둡게 하는 색조 처리는 환경 buffer의 alpha를 보존하고 공통 하늘을 직사각형으로 덮지 않는다.
- [ ] 낮의 회청색, 해질녘의 제한된 온기, 밤의 낮은 명도와 실제 생활 불빛을 한 상태에서 이어지게 만든다.
- [ ] `node tests/test_road_environment.cjs` / `node tests/test_journey_renderer.cjs` 실행 후 작은 실제 화면에서 해/달/광륜 가림을 눈으로 확인한다. VM의 draw 호출 검사만으로 occlusion이 완성됐다고 보고하지 않는다.

**완료 조건:** 전환 중에도 해/달이 중복되지 않고 위치가 흔들리지 않으며 지형이 빛을 가린다.

## Task 4: 지역·시설의 연속 이동

**Files:** Modify `src/05-scene.js`, visual-only data in `src/03-data.js`; Test `tests/test_road_environment.cjs`.

**Interfaces:** Task3의 공통 sky/lighting 소비. 기존 `SCENE.roadBackdropState()`의 `{from,to,mix}` 반환값은 호환 유지한다.

- [ ] 거리0/NaN/음수, 진행률 범위 밖, 동일 지역, 같은 biome의 다른 motif, 양방향 이동을 검증한다. 유효 게임 상태에서 그리기 전후 `JSON.stringify(S)`가 동일해야 한다.
- [ ] 기존 transition window의4–14km 의도를 유지하며 유한한 단조 보간을 분리한다. 이 값은 sky alpha가 아니라 산 높이/지형 색/시설 배치 경계에 사용한다.

```js
function roadTransitionAt(distanceKm, goneKm) {
  const dist=Number.isFinite(distanceKm)&&distanceKm>0?distanceKm:1;
  const progress=clamp01(Number.isFinite(goneKm)?goneKm/dist:0);
  const span=Math.min(.4,Math.max(.08,Math.min(14,Math.max(4,dist*.24))/dist));
  const x=clamp01((progress-(.5-span/2))/span);
  return x*x*x*(x*(x*6-15)+10);
}
function roadCellKind(cellIndex, boundaryCell, fromKind, toKind) {
  return cellIndex<boundaryCell?fromKind:toKind;
}
```

- [ ] 시설의 boundaryCell은 경로 진입 시 세계 이동 좌표와 실제 gone/dist에 맞춰 고정한다. 화면에 들어온 cell의 종류는 캐시에 고정하고 중앙 progress 변화로 바꾸지 않는다. 먼 층/가까운 층의 이동비만 다르게 적용하며 캐시는 가시 범위와 양쪽 여유 범위만 유지한다.
- [ ] 고가도로의 가로등이 지나간 뒤 농촌의 전신주가 들어오게 한다. `profile.from.scenery==='overpass' && mix<.5` 일괄 교체 분기를 제거한다. 도착지 overpass와 역주행에도 동일 규칙을 쓴다.
- [ ] 새 경로/새로고침/크기 변경 시 가시 cell을 현재 경로 진행률에 맞게 재구성한다. 장식의 정확한 픽셀 위상까지 저장하는 새 gameplay schema는 만들지 않는다. 지역·시간·전이 단계는 저장과 일치해야 한다.
- [ ] 공통 하늘은 유지하고 terrain silhouette는 연속적으로 보간한다. 불투명한 foreground를 포함한 완성 그림 전체를 alpha로 겹치는 기존 경로를 대표 구간에서 제거한다.
- [ ] 같은 cell을0.49/0.50/0.51 전후에 관측하여 종류가 유지되는지, offscreen에서 새 시설이 유입되는지 검사한다. 25→50→75% 재개와 역방향을 테스트한다.

**완료 조건:** 양산↔밀양에서 하늘/산/시설이 갑자기 교체되거나 이중 노출되지 않는다. 공간 이동은 기존 감속 속도와 연속적으로 멈춘다.

## Task 5: 대표 구간 승인과 현재 화면 적용

**Files:** Update audit evidence and relevant guardrail explanation only after measured results.

- [ ] `npm run build:html`, `node tests/test_journey_renderer.cjs`, `node tests/test_road_environment.cjs`, `node tools/check-road-environment.mjs`, `npm run audit:scene-assets:strict`를 실행한다. 실패/기존 경고를 이름과 함께 기록한다.
- [ ] 테스트 port와 명시적 fixture에서320×568,360×728,390×844,480px폭을 확인한다. 실제 사용자 상태를 만들어내거나 해당 캡처로 대체하지 않는다.
- [ ] 대표 구간0/25/49/50/51/75/100%, 낮09:00·정오12:00·해질녘17:30·밤21:00, clear/rain/fog/storm/dust를 조합해 자동 검사를 수행한다. 실제 눈 검수는 각 시간대와 최소 맑음/비/안개를 포함한다.
- [ ] 같은 경로에서 출발→발견→감속→정차→사건→도로 복귀를 실제 조작으로 검수한다. 날씨 속 사람/차량 cue, 기본/확장 달구지, 실제 동료 탑승 표시를 비교한다.
- [ ] 동영상으로 최소한 배경 경계와 타일 seam, 일몰 가림, 제동 구간을 확인한다. 스틸 이미지만으로 움직임 통과를 선언하지 않는다.
- [ ] 기준 빌드 대비 frame-time p50/p95와 활성 버퍼 수를 같은 테스트 장비에서 기록한다. 배경 처리 p95가20% 이상 증가하면 프로파일링 후 재검수한다. 실제 Android 성능으로 부르지 않는다.
- [ ] 사용자 현재 화면 연결을 확인한 뒤 live badge로 적용한다. 읽던 사건과 저장 위치·진행률·자원을 보존하고 다음 조작이 가능한지 확인한다. 연결이 없다면 코드 준비와 실화면 검수 대기를 분리해서 보고한다.

**1차 승인 기준:** Sang이 좋아한 원본 옆에서 양산과 밀양의 품질이 이어지고, 해 가림과 시설 전환이 움직임 속에서도 자연스럽다. 이 확인 전에는 전체 자산을 대량 제작하지 않는다.

## Task 6: 전체 지역으로 확장

**Entry:** Task5의 대표 구간 시각 승인. 이 단계까지 완료하기 전에는 '전체 지역 해결'이라고 보고하지 않는다.

**Files:** Existing profile data/renderer + accepted family assets/manifest; same contract/test/checker owners.

- [ ] 58개 `D.nodes`를 실제 `D.nodeBio`/`D.nodeScenery`와 대조해6개 시각 배경군으로 분류한다. `refinery/steelworks/factory`는 공업으로, bamboo/reeds는 해당 지형 위의 식생으로 구분한다. 지역별 고유 motif는 보존한다.
- [ ] 신규 가족은 한 가족씩 제작→gallery 비교→연결→검수한다. 공통 ridge/식생 층을 재사용하며 파일 수와 내장 증가량을 가족마다 측정한다. 80MB 상한을 넘는 세트는 연결하지 않는다.
- [ ] 모든 노드가 유효한 family와 asset set으로 해석되는 테스트를 추가한다. 대체 배경은 동일 품질의 가족 내 fallback으로 제한하고 모든 지역에 양산 skyline을 덮지 않는다.

```js
for (const id of Object.keys(D.nodes)) {
  const profile=roadVisualProfile(id);
  assert(['urban','rural','mountain','industrial','coast','waterside'].includes(profile.family), id);
  assert(profile.motif === (D.nodeScenery[id] || ''), id);
}
for (const [from,to] of D.edges) {
  assert(roadVisualProfile(from) && roadVisualProfile(to), `${from}->${to}`);
}
```

- [ ] 각 배경군의 정차/주행/전이와 실제 양방향 연결을 검사한다. 그래프에 없는 임의 경로를 플레이 가능 경로처럼 테스트하지 않는다.
- [ ] 먼 지역에서 남산이나 잘못된 지역 랜드마크가 나오는 경우를 확인한다. `namsan()`의 기존 거리 조건도 범위 안에서 검토하되 실제 지리 검증 없는 새 시야거리 수치를 넣지 않는다.
- [ ] Task5의 전체 검증 명령을 재실행하고 원본/대표 구간/전국 노드 contact sheet와 움직임 결과를 함께 인계한다. 공유 garage/title/town consumers가 바뀌지 않았는지도 확인한다.

## 실행과 인계

- 권장: 동일 renderer와 자산 계약이 연쇄적으로 연결되므로 주 담당자가 순차 구현한다. 병렬 구현 방식을 원하면 자산 준비/독립 검수 범위를 별도로 나눈다.
- 이번 문서는 계획 승인 요청이다. 이미지 생성, 게임 코드 변경, 현재 화면 적용, 커밋/푸시는 수행하지 않는다.
- 구현의 첫 반환점은 **양산↔밀양의 움직이는 비교 결과**다. 전체 완료는 Task6 이후다.
- 복구는 작업 시작에 기록한 정확한 파일 diff를 대상으로 한다. 전체 worktree reset이나 사용자 저장 초기화를 하지 않는다. 신규 자산 원본과 기존 승인 자산은 보존한다.
- 최종 보고에는 실제 변경, 실행한 검사와 수치, 시각 검수한 상태, 미확인 상태, 배지 적용 여부를 구분한다.
