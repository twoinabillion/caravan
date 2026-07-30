# 정착지 공간형 허브 Design QA

## 비교 조건

- Source visual truth: `audits/settlement-redesign-2026-07-30/reference-option-3.png`
- Browser implementation: `audits/settlement-redesign-2026-07-30/implementation-hub.png`
- Full comparison: `audits/settlement-redesign-2026-07-30/comparison-full.png`
- Focused bottom comparison: `audits/settlement-redesign-2026-07-30/comparison-detail-bottom.png`
- Additional states:
  - `implementation-garage.png`
  - `implementation-upgrade.png`
  - `implementation-market.png`
  - `implementation-hub-360x640.png`
- Source pixels: 853×1844
- Implementation pixels: 390×844
- CSS viewport: 390×844, deviceScaleFactor 1
- Density normalization: source and implementation were rendered together at 390×844. 원본과 목표 화면의 종횡비 차이는 약 0.1%로 시각 판단에 영향을 주지 않는다.
- Responsive check: 360×640, deviceScaleFactor 1
- State: DAY 11, 대구 돔 시장, 낮, 정비소 선택, 후미 2차 증축·태양광 장착 상태

## 브라우저 상호작용·안정성

- 공간 핫스폿 3개 선택
- 정비소 진입
- 좌석·거주 탭 전환
- 상부 2층 침상 장착
- 개조 전/후 비교 및 작업 단계 완료
- 허브 복귀 후 장터 진입
- 390×844 캡처 동안 앱 런타임 오류 0건
- 오프로드 환경감지 요청의 예상된 401 한 건은 게임 로직 오류가 아니며 전체 스모크 테스트의 기존 예외 규칙과 일치한다.
- 전체 Playwright 스모크 테스트 통과, 최종 콘솔 오류 0건

## 필수 충실도 검토

- Fonts and typography: 기존 Apple SD Gothic Neo/Pretendard 계열을 유지했다. 장소명, 핫스폿, 자원 수치, CTA의 크기와 굵기가 서로 분명하며 360px에서도 줄바꿈이나 잘림이 없다.
- Spacing and layout rhythm: 배경 속 세 장소, 중앙 달구지, 하단 자원/행동 영역으로 시선이 자연스럽게 내려간다. CTA는 56px, 핫스폿은 최소 48px 높이로 모바일 터치 범위를 확보했다.
- Colors and visual tokens: 기존 야간 남색과 호박색 강조 토큰을 유지했다. 선택된 정비소와 이동 경로, CTA가 같은 강조색을 사용한다. 새 UI에는 장식용 그라디언트를 추가하지 않았다.
- Image quality and asset fidelity: 정착지 고유 장면과 기존 PNG 아이콘을 그대로 사용했다. 달구지는 게임의 실제 절차형 렌더러를 재사용해 업그레이드 상태와 차체 증축이 일치한다. 임시 이미지, CSS 그림, 인라인 SVG, 이모지 대체 자산을 새로 만들지 않았다.
- Copy and content: 장터·정비소·모닥불의 역할이 한 문장으로 구분된다. 개조 결과는 “후미 증축 +110cm → +145cm”, “탑승 정원 5 → 6명”처럼 실제 변화를 설명하며 어색한 `(으)로` 표현을 제거했다.
- Icons: 연료·물·식량·고철·부품과 세 장소 모두 프로젝트의 기존 실제 PNG 아이콘을 사용하며 크기와 기준선이 통일돼 있다.
- Accessibility and states: 버튼은 semantic `button`, 핫스폿은 `aria-pressed`, 차와 풍경은 설명 레이블을 가진다. 야간에는 닫힌 장소가 비활성화되고 모닥불로 초점이 이동한다. 모션 축소 설정에서는 설치 단계가 즉시 완료된다.

## Full-view 비교

선택 시안의 핵심인 “한 장의 정착지 풍경 안에서 장소를 직접 선택하고, 달구지를 기준점으로 이동하며, 하단의 단일 CTA로 들어가는 구조”가 구현됐다. 구현은 기존 게임의 실제 대구 장면을 사용하므로 시안보다 수평 시점이지만, 정보 구조와 주요 영역 비율은 유지된다. 선택된 장소와 달구지를 잇는 경로, 5개 자원, 큰 CTA가 첫 화면에 모두 보인다.

## Focused-region 비교

하단 비교 이미지에서 달구지, 자원 5종, 선택 설명, 56px CTA를 함께 확인했다. 시안보다 설명과 “달구지로 돌아간다” 보조 행동이 추가됐지만 핵심 CTA의 우선순위는 유지된다. 정비소·업그레이드 별도 캡처에서 차량 확대, 실제 차체 단계, 설치 전후 차이가 읽힌다.

## 비교 이력

### 1차 비교

- [P1] 달구지가 넓은 캔버스 여백 때문에 너무 작아 공간의 기준점과 증축 컨셉이 약했다.
  - Fix: 주행 렌더러의 차체 영역만 크롭해 허브·정비소·개조 전후 캔버스에 동일하게 확대했다.
  - Post-fix evidence: `implementation-hub.png`, `implementation-garage.png`, `implementation-upgrade.png`
- [P2] 하단 자원 바가 시안의 5종보다 적어 정비에 필요한 부품 상태를 바로 알 수 없었다.
  - Fix: 실제 부품 PNG 아이콘과 보유 수량을 다섯 번째 칸으로 추가했다.
  - Post-fix evidence: `comparison-detail-bottom.png`

### 2차 비교

- [P2] 360×640에서 모닥불 핫스폿과 확대된 달구지의 상단이 거의 닿았다.
  - Fix: 700px 이하 높이에서 모닥불 위치와 이동 경로 기준점을 위로 조정했다.
  - Post-fix evidence: `implementation-hub-360x640.png`, `small-viewport-result.json`
- [P2] 시안보다 CTA의 시각적 무게가 약했다.
  - Fix: CTA 높이를 56px로 키우고 차량 위치도 함께 올려 겹침 없이 행동 우선순위를 강화했다.
  - Post-fix evidence: `comparison-full.png`, `comparison-detail-bottom.png`

## 최종 Findings

액션 가능한 P0/P1/P2 차이는 남아 있지 않다.

- [P3] 선택 시안은 완전한 부감 구도이고 실제 게임 장면은 수평에 가까운 구도다. 기존 7개 정착지 고유 삽화를 보존하고 콘텐츠 일관성을 유지하기 위한 허용 가능한 차이다.

## Implementation Checklist

- [x] 정착지 3개 공간 핫스폿
- [x] 장소별 기능 분리
- [x] 실제 업그레이드 상태의 달구지
- [x] 설치 전/후와 물리 수치 변화
- [x] 야간 비활성 상태
- [x] 390×844 및 360×640 반응형 확인
- [x] 키보드 초점·레이블·reduced-motion
- [x] 전체 회귀 테스트

final result: passed
