# 지역별 주행 환경 — 2026-09-26

양산 고가차도의 묘사 수준을 기준으로 `D.nodes`의 58곳 모두에 개별 환경을 배정했다. 게임 디렉터·이미지 제작 지침에 따라 동일 화풍과 구도를 유지하면서 항구, 들판, 공단, 분지, 산지, 해안 등 장소 특성을 구분했다. 실제 지형에서 착안한 게임용 원경이지 실측 도로·건물 배치의 재현은 아니다.

## 파일과 제작 이력

- 게임용 이미지: 이 폴더의 `<node-id>-v1.webp`, 1024×576 RGBA. 58개 합계 4,217,340 bytes.
- 지역별 설명·연결·검수 상태: `manifest.json`.
- 내장 `image_gen`으로 생성한 원본 경로, 첨부 참조, 실제 프롬프트: `prompts.json`. 양산은 기존 승인 배경의 하늘을 투명화한 기준 원본이며 그 편집 요청 원문은 색인에 보존되지 않았다.
- 큰 원본 사본: `audits/road-environment-2026-09-26/masters/<node-id>.png` (로컬 검수 자료; Git 제외).
- WebP 변환: `cwebp -q 78 -m 6 -resize 1024 576` (양산 q82). 생성된 알파를 유지한다.

## 렌더링 계약

`src/05a-road-environment.js`가 환경 이미지만 담당한다. 하늘·해·달, 도로, 달구지, 업그레이드, 탑승자, 날씨, 접근 단서는 기존 실시간 캔버스 레이어로 유지한다. 배경에는 인물·차량·태양·달·문자·UI를 넣지 않는다.

하늘을 한 번 그린 뒤 투명 원경을 합성해 해와 달이 산·건물 뒤로 가려진다. 지역 전환은 전체 화면 중첩 대신 좁고 부드러운 경계가 이동한다. 이미지 준비가 늦으면 마지막으로 준비된 상세 배경을 유지하며 구형 도형 배경으로 돌아가지 않는다. 처음 실행해 준비된 이미지가 없을 때만 공통 하늘을 잠시 표시한다. 동시에 디코딩해 보관하는 이미지는 최대 8개다.

58개 자산을 넣으면서 HTML 용량 제한을 유지하기 위해 반복 CSS 이미지 URL을 빌드 시 한 번만 내장한다. 기존 원고 패널은 픽셀 차이 0인 무손실 WebP로 내장한다. 원본 PNG와 CSS selector는 그대로 남아 있다.

## 확인 결과와 남은 검수

- `node tools/check-road-environments.mjs`: 58개 고유 파일·치수·투명 하늘·지면 알파·용량 통과.
- `node tests/test_road_environment.cjs`: 전체 지역 연결과 구형 렌더러 제거 계약 통과.
- `node tests/test_road_environment_runtime.cjs`: 위치/시각/날씨/전환 3,480회 mock canvas 검사, 캐시 제한·실패 대체·상태 보존 통과.
- `node tests/test_journey_renderer.cjs`: 차량/날씨 조합, 전체 지역·노선의 천체 중복 방지, 상태 보존 통과.
- `node --test tests/test_inline_style_assets.mjs`, `node tests/test_cohesion_places.cjs`, `python3 tests/test_source_health.py`: 통과.
- `npm run build:html`: 약 79.66 MB로 80 MB 제한 통과. 기존 32 MB 권장 용량 경고는 남아 있다.
- 생성 결과와 실제 `http://127.0.0.1:4318/__live/assets`의 58개 이미지를 시각 확인했다.
- 기존 `tests/test_interface_cleanup.py`는 수정하지 않은 `src/07-ui.js`의 `choice-dock-head` 계약에서 실패한다. HEAD에도 동일 항목이 있어 이번 작업과 별개다.

**실제 게임 화면의 최종 crop·전환 시각 검수는 미완료다.** Studio 앱 관찰 권한이 없어 현재 게임 화면을 캡처하지 못했고 다른 저장 상태로 대체하지 않았다. 읽기 전용 현재 장면 재조회(2026-09-26 03:14 UTC)에서 대구 돔 시장, DAY 1 16:02, 360×728, 도착 창 열림 상태가 유지된다. 로드된 revision은 `1790388571476`, 새 revision은 적용 대기다. 새 코드 적용 후 같은 저장 상태에서 출발·정차·날씨·지형 경계를 눈으로 확인해야 한다. 테스트의 mock canvas 검사는 이 시각 검수를 대신하지 않는다.
