# Caravan 목적지 콘솔 Option 3 Design QA — 2026-08-13

final result: passed

## 비교 기준

- Source visual truth: `Desktop/Caravan 목적지 UI 3가지 시안/3-세로-로커와-캐러셀.png`
- Implementation: `audits/destination-console-v3-fidelity-2026-08-13/01-route-primary.png`
- Side-by-side evidence: `audits/destination-console-v3-fidelity-2026-08-13/04-source-vs-implementation.png`
- Viewport / pixels: source 480×860 normalized, implementation 480×860 CSS px / image px, deviceScaleFactor 1
- Additional responsive evidence: `audits/destination-console-v3-fidelity-2026-08-13/04-route-360x700.png`
- State: Day 1, 부산 감천 부두 정차, 목적지 양산 고가차도 선택

## 최종 대조

- P0/P1: 없음.
- 프레임은 승인한 Option 3 이미지에서 내부 화면만 투명하게 분리해 사용했다. 그래서
  상단 사선, 좌측 세로 로커, 우측 표시등, 하단 도크 결합부가 원본과 동일하다.
- 내부는 원본의 세로 순서를 그대로 따른다: 대형 지형 지도, 2줄 장소 설명, 연료·시간·거리
  3열, 가운데 큰 목적지와 양쪽 미리보기, 페이지 점.
- 원본의 정적인 목적지명·거리·사진은 게임 데이터로 교체했다. 현재 상태에서는 양산
  고가차도 20km, 김해 들판 18km가 보이며 선택에 따라 지도 배지·경로·소모량·시간이
  함께 갱신된다.
- 게임 시작 시 선택 가능한 길이 두 개인 경우에도 중앙 큰 카드와 좌우 미리보기의
  3장 구도를 유지한다.
- 기존의 `ROUTE 01`, `01/02`, 작은 선형 그래프, 상자 3개, 별도 대형 출발 버튼은
  Option 3 원본에 없으므로 제거했다. 선택된 중앙 카드 자체가 출발 동작이다.

## Fidelity surfaces

- Typography: 원본처럼 지도 배지는 청록, 거리·주요 선택선은 호박색, 본문과 계기값은
  회백색 계열을 사용했다. 모바일 한글은 잘리지 않는다.
- Spacing: 480px 화면에서 콘솔 폭 472px, 내부 화면 389×407px. 원본의 거의 꽉 찬
  폭과 정사각형에 가까운 콘솔 비율을 유지한다.
- Images: 금속 프레임은 승인 원본에서 직접 분리한 래스터, 지도는 텍스트 없는 어두운
  대한민국 지형 래스터, 목적지 카드는 기존 게임 장소 이미지를 사용한다.
- Copy: 발견 전 위험·사람·사건을 예고하지 않는다. 이미 지도에 기록된 장소 설명과
  현재 계산 가능한 연료·시간·거리만 표시한다.
- Interaction: 좌우 화살표·스와이프·방향키로 목적지가 바뀌며, 선택 카드 클릭은 실제
  `S.driving` 상태를 만들고 주행을 시작한다. 세로 로커의 목적지·머물기 터치 영역은
  각각 최소 44px다.
- Responsive: 360×700에서 가로 넘침이 없고 중앙 카드가 130px 이상 유지된다. 콘솔과
  도크도 화면 안에 들어온다.

## 검증

- `npm run build:html --silent`: passed
- `python3 tests/capture_destination_console_v3.py`: passed
  - 양산 → 김해 캐러셀 상태 변화 확인
  - 목적지/머물기 로커 전환 확인
  - 선택 중앙 카드 클릭 후 `S.driving === true`, `S.at === null` 확인
  - 480×860, 360×700 가로 넘침 없음
  - Chromium console/page error 0
- `npm run test:accessibility9`: passed
  - 360×700, 390×844, 480×860 일반/큰 글자 모드 통과
  - 목표·지도·가방 44px 조작 영역 및 200% 확대 통과
- `git diff --check`: passed

## Remaining P3

- 승인 시안은 예시 목적지가 3개 이상이지만 현재 부산 첫 정차 데이터에는 실제 길이
  두 개뿐이다. UI는 같은 3장 구도를 위해 반대 목적지 이미지를 양쪽 미리보기로
  반복한다. 새로운 실제 노드를 예고하거나 가짜 목적지를 추가하지는 않았다.
