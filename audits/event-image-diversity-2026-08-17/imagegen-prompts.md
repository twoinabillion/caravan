# 사건 장면군 ImageGen 프롬프트 기록

생성 방식: Codex 내장 ImageGen. 각 장면은 별도 생성 호출로 만들었고, 정본 이미지 3장을 참조했다. 최종 게임 자산은 중앙 안전 크롭으로 768×432에 맞춘 뒤 WebP 품질 67로 저장했다.

## 공통 제약

- 한국의 붕괴 이후 현실적 로드 무비, 청회색·먹색과 제한된 황색 실용 조명, 젖은 공기와 미세한 그레인.
- 16:9 가로 장면, 핵심 대상은 중앙 70% 안전 영역, 화면에 글자·UI·로고·워터마크 없음.
- 달구지: 한국형 1톤 캡오버, 회색·베이지 직사각 생활 박스, 황색 창, 지붕 방수포 짐과 빨간 통 두 개, 안테나, 바랜 흰 X.
- 버스, RV, 패널밴, 픽업, 미국식 캠퍼, 애니풍, 회화풍, 홀로그램, 미래 위험 예고 표시는 금지.

## 장면별 주 요청

### 사람 조우 10

- `event-meet-roadside`: 비 갠 시골 길에서 빈손을 든 낯선 여행자와 멈춰 선 달구지.
- `event-meet-family`: 고장 난 소형 화물차와 아이를 돌보는 피난 가족.
- `event-meet-trader`: 방수포 위 통조림·볼트·씨앗·천을 펼친 길가 물물교환상.
- `event-meet-craft`: 숯 화덕과 손 공구 작업대를 쓰는 이동 기술자.
- `event-meet-performer`: 폐주유소 차양 아래 조용한 소규모 공연.
- `event-meet-pilgrim`: 안개 낀 산길을 걷는 우비 차림 순례 행렬.
- `event-meet-guard`: 드럼통·밧줄 차단기로 만든 산업도로 임시 검문.
- `event-meet-courier`: 시골 삼거리에서 방수 우편 가방을 연 자전거 우편부.
- `event-meet-animal`: 논길의 소·농장개·노인과 달구지.
- `event-meet-community`: 방수포와 공동 화덕을 중심으로 한 작은 길가 공동체.

### 발견·탐색 11

- `event-find-document`: 폐사무실 책상의 지도·수첩·사진을 손전등으로 확인.
- `event-find-signal`: 산등성이 중계소에서 아날로그 라디오와 안테나를 조정.
- `event-explore-retail`: 텅 빈 한국 동네 편의점 선반과 창고 탐색.
- `event-explore-civic`: 파손된 작은 진료소의 약장과 대기실 탐색.
- `event-explore-school`: 젖은 교실과 무너진 책장에서 물자를 찾는 장면.
- `event-explore-workshop`: 공구·벨트·기계 부품이 남은 정비 작업장.
- `event-explore-farm`: 비닐하우스와 과수원에서 묘목·관개관을 확인.
- `event-explore-water`: 저수지 펌프실의 수동 밸브와 물통.
- `event-explore-transit`: 안개 낀 간이역의 수하물 수레·정비함·정지 열차.
- `event-explore-leisure`: 차량 없이 폐영화관 매점과 영사기 상자를 탐색.
- `event-explore-shelter`: 고가 아래 침구·빗물통·식은 난로가 남은 빈 쉼터.

### 천리안·자동화 6

- `event-ai-drone`: 고가도로 아래를 훑는 낡은 실용 드론 여러 대.
- `event-ai-automation`: 달구지 주변에서 갑자기 켜진 노후 세차·교통 설비.
- `event-ai-broadcast`: 빈 읍내 가로 스피커가 켜지고 사람들이 올려다보는 밤.
- `event-ai-checkpoint`: 폐톨게이트 자동 차단기와 회전 카메라.
- `event-ai-convoy`: 무인 배달 차량과 정확한 간격으로 이동하는 달구지.
- `event-ai-surveillance`: 시골 교차로의 여러 CCTV가 달구지를 향해 회전.

### 위기 8

- `event-crisis-engine`: 캡을 젖히고 갈라진 라디에이터 호스를 진단.
- `event-crisis-fuel`: 빈 연료통과 열린 연료구 앞에서 멈춘 달구지.
- `event-crisis-tire`: 젖은 산길 갓길에서 잭으로 뒷바퀴를 정비.
- `event-crisis-flood`: 유실된 저지대 도로 앞에서 막대로 수심 확인.
- `event-crisis-weather`: 강풍과 차가운 비 속 능선 도로를 저속 주행.
- `event-crisis-collapse`: 새 낙석으로 막힌 산길을 안전거리에서 확인.
- `event-crisis-animal`: 새벽 도로를 차지한 멧돼지 무리를 차 안에서 기다림.
- `event-crisis-exhaustion`: 밤의 달구지 내부에서 지친 운전자에게 물을 건넴.

### 동료 생활 5

- `event-companion-repair`: 고글 쓴 민지 계열 정비사가 발전기 수리를 가르침.
- `event-companion-radio`: 밤의 달구지에서 둘이 아날로그 라디오를 함께 들음.
- `event-companion-meal`: 좁은 식탁에서 세 사람이 밥과 통조림 찌개를 나눔.
- `event-companion-camp`: 차양 아래 네 사람이 작은 모닥불 주위에서 양말을 말림.
- `event-companion-van`: 주행 중 짐 고정·지도 확인·침상 휴식이 동시에 보이는 일상.

### 길 위 정경 8

- `event-vista-field`: 늦가을 논과 감나무 과수원 사이 농로.
- `event-vista-water`: 물안개 낀 강·저수지와 갈대·왜가리.
- `event-vista-mountain`: 소나무·대나무·젖은 바위가 겹친 산골짜기.
- `event-vista-road`: 산업 외곽으로 휘는 한국형 고가도로와 녹색 가드레일.
- `event-vista-town`: 셔터 내린 저층 상가·빨래·정류장이 있는 지방 읍내.
- `event-vista-night`: 안전한 산길 전망대와 은하수, 작은 달구지 실루엣.
- `event-vista-weather`: 소나기 뒤 희미한 무지개와 수증기 오르는 아스팔트.
- `event-vista-remnant`: 덩굴이 덮은 옛 휴게소·빈 탁자·조용한 놀이터.
