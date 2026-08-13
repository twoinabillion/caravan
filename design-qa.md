# Caravan 모바일 UI 개선 Design QA — 2026-08-13

final result: passed

## 비교 기준

- Source visual truth: `audits/mobile-ui-2026-08-13/390x844-01-route.png`,
  `390x844-03-goal.png`, `390x844-04-map.png`, `390x844-05-bag.png`
- Implementation: `audits/mobile-ui-2026-08-13/after/390x844-01-route.png`,
  `after/390x844-03-goal.png`, `after/390x844-04-map.png`, `after/390x844-05-bag.png`
- Viewport / pixels: 각 390×844 CSS px / 390×844 image px, deviceScaleFactor 1
- 추가 반응형 검증: 360×700, 430×932 캡처; 480×860 자동 레이아웃 검증
- State: Day 1, 대구 정차, 길·목표·지도·가방 동일 게임 상태

## Full-view comparison evidence

- 길: 수정 전 약 85px였던 콘솔–도크 빈 공간이 수정 후 16.8px가 됐다. 정차 콘솔과
  하단 도크의 크기는 유지하면서 늘어난 영역은 도로와 달구지를 보여 주는 데 사용됐다.
- 목표: 가죽 폴더와 종이 비율은 유지됐고, `지도에서 보기`와 `길로 돌아가기`의 실제
  터치 높이가 44px로 커졌다. 글자 크기 증가로 인한 줄 겹침이나 폴더 밖 이탈은 없다.
- 지도: 수도권·영남권의 지명 수가 충돌 기준에 따라 줄어 노드와 선택 경로가 먼저
  읽힌다. 잘리던 한 줄 범례는 두 줄로 바뀌어 CRT 오른쪽 안에서 끝난다.
- 가방: 수납칸, 이미지, 숫자 정렬은 그대로이며 상세 행동 버튼만 44px로 커졌다.

Focused region comparison은 별도 확대본 없이 원본 해상도의 네 상태를 좌우 결합해
터치 버튼, 지도 범례, 도시 라벨, 폴더 본문을 확인했다. 모든 핵심 세부가 390×844
원본 캡처에서 읽혀 별도 크롭은 필요하지 않았다.

## Required fidelity surfaces

- Fonts and typography: 기존 글꼴·굵기·행간을 유지했다. 목표 단계는 10px, 보조문은
  8.5px, 가방 설명은 9.5px의 새 최소값을 적용했고 잘림을 확인하지 못했다.
- Spacing and layout rhythm: 390×844와 430×932의 잉여 공간은 각각 16.8px와 18.9px로
  정리됐다. 360×700은 공간 부족 때문에 기존의 1.5px 밀집 구도를 유지한다.
- Colors and visual tokens: 색상, 금속·가죽·종이 래스터 셸, 테두리와 그림자 토큰은
  변경하지 않았다.
- Image quality and asset fidelity: 이미지 자산과 크롭을 변경하지 않았다. 기존 달구지,
  목표 폴더, 지도 CRT, 가방 이미지가 그대로 사용된다.
- Copy and content: 미래 위험이나 만날 인물을 예고하는 문구를 추가하지 않았다. 지도는
  이미 알려진 장소와 선택 경로만 보여 준다.
- Interaction/accessibility: 목표·지도·가방의 표시 조작은 최소 44px, 캐러셀 점은 24px
  실제 히트 영역이다. 축소 모션, 큰 글자, 200% 확대와 키보드 포커스 스타일을 유지했다.

## Comparison history

1. Initial P1 — 긴 휴대폰에서 콘솔과 도크 사이 85–125px 빈 공간.
   Fix: 실제 콘텐츠 끝과 도크를 측정해 남는 높이를 정차 풍경에 배분하고, 겹칠 때는
   최대 32px까지 풍경을 줄이는 양방향 보정을 적용했다.
   Evidence: `after/390x844-01-route.png`, `after/430x932-01-route.png`.
2. Initial P2 — 지도 지명 충돌과 범례 오른쪽 잘림.
   Fix: 라벨–노드 충돌 검사와 현재/선택 우선순위를 추가하고 범례를 두 줄로 바꿨다.
   Evidence: `after/390x844-04-map.png`, `after/360x700-04-map.png`.
3. Initial P2 — 목표·지도·가방·정착지의 34–42px 보조 버튼과 작은 본문.
   Fix: 주요 보조 조작을 44px로, 캐러셀 점 히트 영역을 24px로 확장하고 최소 글자
   크기를 높였다.
   Evidence: `after/390x844-03-goal.png`, `after/390x844-05-bag.png`,
   `after/390x844-07-settlement.png`.
4. First post-fix test P2 — 480×860에서 콘솔이 도크와 약 7px 겹침.
   Fix: 음수 간격일 때 풍경을 줄이는 보정을 추가했다.
   Evidence: `tests/test_quality_9_accessibility.py` 최종 통과, 최종 dockGap 16.0px.

## Verification

- `python3 tests/test_quality_9_accessibility.py`: passed
- `npm run verify:quick`: passed
- `python3 tests/test_source_health.py`: passed
- Chromium console/page errors: 360×700, 390×844, 430×932 모두 0
- Primary interactions tested: 목적지 캐러셀, 큰 글자, 모션 축소, 목표 열기/복귀,
  지도 열기/지점 선택/복귀, 가방 열기/복귀

## Follow-up polish

- P3: 360×700에서는 콘솔과 도크 사이가 1.5px로 촘촘하다. 핵심 조작은 모두 보이므로
  현재는 짧은 화면의 풍경 높이를 더 줄이지 않는 쪽을 선택했다.
- 실기기 Safari/Chrome의 주소창 축소와 VoiceOver/TalkBack 순서는 별도 실기기 QA가 남는다.
