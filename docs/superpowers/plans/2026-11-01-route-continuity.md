# Continuous Route Landscapes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Root implements production changes; a fresh reviewer checks the complete result.

**Goal:** 58개 도시와 78개 길을 실제로 이어지는 배경으로 만든다.

**Architecture:** 58개 확장 도시 타일과12종 지역 지형으로78개 논리 파노라마를 공유한다. 출발 전에 조용한512px 외곽만 한 번 합성하고, 주행 중에는 완성된5120×576판 위의 카메라만 이동한다. 도시 중앙1024px는 그대로 공유하며, 기존2개 양호 노선과 옛78길 데이터는 실패 fallback으로 보존한다. 세이브/주행 소유자는 유지한다.

**Tech Stack:** 기존 JavaScript Canvas, Node/sharp 배포 파이프라인, Python Playwright 검증, built-in image_gen 미술 제작.

**Spec:** docs/superpowers/specs/2026-11-01-route-continuity-design.md

## Global Constraints

- 78 undirected roads /156 directions /58 fixed places; preserve D.edges and save state.
- caravan-grounded-cinematic-v1; required canonical references; no raster event paintings in moving-road cue layer.
- 1024 source pixels per viewport minimum;200MB hard /160MB warning single HTML.
- New art is reviewed in active gallery before wiring; no user-save reset or automatic structural apply.
- Native inline execution authorized by the user's “그 다음에 이행해”; no separate push/deploy.

## Review Focus

- A city reached from any edge must show the same scale, baseline and landmark arrangement, including reverse and cold load.
- Endpoint equality cannot conceal a building/waterline cut in the transition interior.
- Decode delay/failure must not pop a different city or expose blank terrain.
- Event discovery freezes paid distance; scenery settles without spending distance and resumes in place.
- Embedded offline mode must use exactly the reviewed delivery art within the budget.

### Task 1: Canonical references and representative draft

**Files:** assets/reference/route-nodes-v3/, assets/masters/route-continuity-v3/, tools/design-drafts/route-continuity-v3.html, tools/design-drafts/manifest.json.
**Consumes:** current runtimeAtlas(root), connected-v1, ROAD_CONTINUITY fixed city crops.
**Produces:** canonical city reference hashes; reviewable 3-route old/new camera study and art-production decision.

- [x] Export unchanged city views through the current renderer; verify58 IDs and source hashes.
- [x] Make complete strip candidates for the3 representative roads, preserving canonical endpoints. Generate only the parts whose image content must change; preserve prompts, refs, masters and rejects.
- [x] Register and show draft through existing Studio/gallery where available; distinguish unavailable Studio from tested headless draft.
- [x] Review at320/360/480px and forward/reverse. Reject cut buildings, mixed waterlines, fog/blur coverups. Settle strip geometry and write a ledger ruling before Task2.

### Task 2: Complete graph art and deterministic delivery

**Files:** tools/build-route-continuity-v3.mjs, assets/ui/road-environment/continuous-v3.json, assets/ui/road-studies/continuous-v3/, tests/test_continuous_route_assets.cjs.
**Interface:** manifest defines node views and per-route {id,from,to,km,file,sha256,width,height,viewport,start,end,review}; builder consumes only approved reviewed masters and validates graph/provenance.

- [x] Write failing contracts for exact graph coverage, protected endpoint identity, geometry, reverse source identity and rejected/unreviewed candidate exclusion; run and observe failure.
- [x] Produce58 expanded city tiles and12 regional middles for all78 logical route plates; preserve the old2 clean routes as legacy fallback. Inspect every connector at viewport scale.
- [x] Implement deterministic export and manifest validation; run contracts to green. Measure delivery and projected HTML budget; do not reduce source resolution below1024px/viewport.
- [x] Review all78 contact sheets and native-resolution interiors; record per-route acceptance rather than assuming a shared algorithm proves visual quality.

### Task 3: Production renderer and build integration

**Files:** src/05f-continuous-terrain.js, src/05a-road-environment.js, src/07-ui.js, tools/continuous-route-join.cjs, tools/runtime-continuous-terrain.mjs, tools/build-html.mjs; new asset/runtime/preflight tests and legacy routes/tests.
**Consumes:** reviewed continuous-v3 manifest. **Produces:** same draw(target,frame), active(), direction(state) interfaces; no new gameplay state.

- [x] Write failing runtime tests for arrival/stop/departure equality, reverse, reload, monotonic camera, delay/failure, tint and no save writes; observe failure.
- [x] Add direct-panorama path with fixed node views and uniform projection. Keep bounded decoding/cache and old fallback. Compose once before departure; never recompute joins while driving. Limit contour interpolation to newly painted landmark-free outskirts; preserve city cores.
- [x] Integrate checked asset bytes into HTML, validate graph/hashes/geometry and fallback. Embed each of70 new images once; intentionally retain the old atlas as a functioning failure fallback.
- [x] Run targeted tests and HTML build; compare actual embedded bytes and check budget.

### Task 4: Exhaustive QA, real handoff and delivery

**Files:** tools/audit-continuous-terrain.mjs, tools/qa-continuous-terrain.py, tools/qa-continuous-gameplay.py, qa-artifacts/route-continuity-v3/, docs/CURRENT.md, this plan/ledger.
**Consumes:** built HTML and exact production renderer. **Produces:** 78-road visual report and verified source/build record.

- [x] Capture all78/156directions, all city-edge boundaries, all city pair handoffs (546 including return), narrow/wide/night/weather and cold load. Inspect every road interior.
- [x] Exercise actual engine pause/approach/arrival/next departure/reload and offline mode; inspect representative real gameplay captures without changing the user's save.
- [x] Run npm run test:source, npm run build:html, scene/portrait built-byte checks and relevant browser regressions. Source/logic/visual limits separately recorded.
- [x] Fresh final code/art review; resolve material findings with failing regression then verification.
- [x] Copy verified result back into user's working checkout without overwriting unrelated changes; preserve current preview state and structural-apply workflow. Record final checkpoint; report what is implemented and what was observed.

## Ledger

- Baseline: master0d05ec34 clean. Isolated implementation at .worktrees/route-continuity-v3. Prior full source8570/8570 and fresh targeted continuity24/24; exhaustive audit evidence in original qa-artifacts/map-continuity-20261101.
- Ruling: retain canonical city views and2clean roads; accept no blur/fog-only “repair”. Art production geometry remains a Task1 prototype decision because exact endpoint constraints must be proven visually.
- Ruling: requested plan+execution provides implementation authorization. Draft remains reviewable and user can steer during execution; no repetitive approval request. Studio not running is reported, not replaced with a claim that a renderer fixture is the user's scene.

- Task1:58 city references exported unchanged through actual current renderer; isolated continuity baseline20/20. Fresh reviewer confirms immutable explicit node ownership and cold decode need coverage.
- Task1 prototype: built-in image_gen produced a visually coherent whole-strip draft, but native2172x724 for3viewports is below1024px/viewport. Retained as rejected-for-delivery study. Ruling: generate a native16:9 middle connector with128px canonical-bank context each side, then derive a protected-endpoint whole strip. Do not upscale the first study into a production delivery.

- User steering: 내장 도구로 계속, 도시 외곽 변경 허용. Separate API expressly declined; do not use API key/credits or ask again. API masks are not exact-pixel guarantees either, as official docs confirmed; prior suggestion overstated this.
- Task1 Ruling: semantic city identity and one shared node remain fixed, but old outskirts need not remain pixel-identical. Prototype a canonical expanded city tile (2048x576 with1024px central city view atx512), extending both sides into quiet continuous outskirts. Use the SAME accepted node tile at every adjoining edge. This avoids forcing an old city rectangle against unrelated art. The first/last1024-node equality means equality against the new accepted canonical node, not the old image. New city art is reviewed once before reuse.
- Storage ruling: a long logical strip may reference shared node tiles plus unique connector tiles; do not re-embed the same city image once per road. Offline renderer only draws known finished tiles at their fixed world offsets; no live ridge/material synthesis. Art is judged as a complete continuous strip.
- Unaffected tooling: new route contract red observed (missing manifest), then4/4 green with58explicit city owners,78roads and release rejection for unreviewed art. This does not accept any new prototype.

- Task1 art:6expanded city candidates (Busan/Gimhae/Gyeongju/Pohang/Daegwallyeong/Gangneung) and3regional corridor candidates (fields/coast/forest) generated through builtin image_gen, masters/prompts/refs saved. Visually coherent city cores and outskirts.6old exact-pin studies retained but rejected.
- Task1 preview registered as route-continuity-v3 in Studio manifest and mirrored to existing user's checkout. Existing4319gallery serves preview WebP200. Studio4327 offline; browser host unavailable, so no claim of actual Studio-window review. Headless independent draft exercised30controlled320/360/480forward/reverseviews,5secplay/pause/night;0pageerrors; video and screenshots in qa-artifacts/route-continuity-v3/browser-pilot.
- Task1 quality: broad512px alpha blend rejected due translucent mountain/haze band. Narrow seam-cut experiment rejected due stepped ridge. Third prototype pilot-solid preserves city cores and photo textures, makes interpolated quiet-outskirts contour solid; no pixel-column repeat or texture stretching. This is an explicitly scoped design ruling under user's outskirts permission, not an assertion that generic old connector synthesis is acceptable. It needs visual acceptance before rollout.
- Architecture efficiency:58shared city tiles plus roughly12geographic middle types can form78distinct logical strips while avoiding duplicate city image embedding. Each road is still individually checked, assigned from its actual terrain brief/flow, and has same city core at all incoming/outgoing paths. Landmark-free quiet overlap regions only. Final type count may adjust for geography, not budget alone.

- Implementation checkpoint: all58 expanded city masters generated with builtin image_gen and provenance saved. They remain candidate-unreviewed. Delivery exporter tools/build-route-continuity-v3.mjs validates native alpha/minimum geometry and exports2048x576 without upscaling; all58 exported successfully. Initial3 corridor types plus river/gorge/orchard are present; remaining basin/wetland/highland/suburban/industrial/southbay still to generate. Export again after all corridor masters exist.
- Runtime: new05f owner and shared join helper are wired behind disabled registry. Images decoded once, worker composition with main-thread fallback, bounded caches, one shared city core, distance camera and reverse direction, predeparture/Continue/import readiness. Manifest remains disabled: production still legacy until art gates pass.
- Implementation review found5 issues, now fixed and re-reviewed: superseded departure, backup import bypass, permanently blocked departure after failed decode, stale road review after endpoint/compositor changes, and stalled worker reuse. New meaningful regressions observed red then green. Departure waits are canceled by subsequent capture-phase click/keydown plus actual selected/control/modal guards. Import failure disable is guarded by current owner/session. Failure falls back before committing travel/load. Route review binds both endpoint hashes and join source hash.
- Verification: full8593/8593 source tests passed after fixes (continuous-source-review-fixed.log,245s); HTML-only build passed with registry disabled. Previous full run8585/8590 exposed3 isolated fixture-state omissions,1 missing helper fixture and1 screen ordering contract; all fixed before rerun. Actual active-art browser behavior, whole graph visual checks and release enabling remain undone.
- Art watchlist for complete-strip review: Gumi smoke plume, Gimcheon bridge reaching right outskirts, Muju right canopy, Danyang large cliff taper in right overlap, Seoul tiny extra far-left antenna, and generated alpha fringes. Do not blanket-approve candidates. Inspect all58 and all78 composite interiors, regenerate offenders rather than hiding landmarks with interpolation.


## Final delivery — 2026-11-01

- All58 city nodes and12 regional middles accepted;136 hash-bound node/road review records. Builtin image_gen only; no separate API/key/credit path. Damyang/Daegwallyeong/Seoul v1 blockers regenerated to v2 and independently rechecked. Seoul main tower intact but right framing remains tight; Gumi smoke is static;12middle types intentionally repeat across routes.
- All20 full-strip overview sheets and58city crops reviewed by root; all20native join sheets reviewed independently. Gwangju–Mokpo middle corrected to fields to delay the estuary until destination. Raw156 endpoint cores equal canonical node bytes.
- Actual05f browser renderer:4680 endpoint comparisons and2106 reverse comparisons at320/360/480 across day/dusk/night/rain/fog/dust, all pixel difference0,0pageerrors.546 incoming/outgoing city-pair equivalences follow from each road endpoint equaling the one city sample; these are not546 separate played journeys.
- Browser rounding: raw world/city pixels matched, but distinct-sized source canvases produced up to7channel levels of scaling difference. Exact endpoints now draw the canonical node canvas. Crop-only and extra premultiplied-copy experiments did not fix it; no extra-copy workaround remains.
- Actual enabled final HTML, private synthetic save, offline Chromium:9 UI/engine checks passed0pageerrors, including superseded departure/menu cancellation, commit once, Continue readiness, failure fallback before commit, import cancel/commit, lifecycle pause/resume, actual engine arrival and adjoining UI departure. Road encounter slots were removed only in the isolated arrival fixture, as in the existing golden test; this is not a new natural playthrough. Screenshots visibly contain terrain/sky/road/vehicle. Initial black screenshot came from QA exact-replay class freezing RAF; fixed by normal Continue entry and explicit nonblank-canvas check.
- Final full source8595/8595; HTML167541745B (160MB warning,200MB cap);723scene keys/716unique source images and7canonical portraits embedded-byte checks; save migration, determinism, golden route and XSS browser gates passed. Main checkout copied after art gallery200check, registry last; mainbuild and20continuity checks passed.
- No changes to road graph, distance, costs, save schema or engine source. No user profile/save reset, forced structural apply, new commit/push/deploy, full native-device performance or audio claim. Existing4319preview retained; current user's already-loaded document is not force-refreshed.
- Fresh final reviewer found no remaining production must-fix and verified corrected rendered gameplay captures. Reproduce with the two QA tools after running the offline strip audit; final source/build logs are archived under qa-artifacts/route-continuity-v3/verification/.


## 후속 Git 저장 지시

Sang이 “커밋 푸시 해줘”라고 명시했다. 현재 master에서 전체 소스 검사와 HTML 빌드를 다시 확인한 뒤, 검증한 코드·배포 이미지·생성 원본·프롬프트·검수 기록을 커밋하고 origin/master에 푸시한다. 기존 GitHub Actions의 gate/Pages 흐름은 유지한다. 앞의 no-push 문장은 이 추가 지시 이전의 검증 시점 기록이다.
