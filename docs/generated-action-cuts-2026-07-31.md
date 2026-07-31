# 행동 단위 시네마틱 컷 — 2026-07-31

Built-in ImageGen 편집 모드로 기존 사건 이미지를 연속성 기준 이미지로 사용했다.

## 공통 프롬프트

- 용도: `illustration-story`, 16:9 게임 시네마틱
- 화풍: 기존 장면과 같은 반사실적 손그림 영화풍, 자연스러운 필름 그레인
- 고정 요소: 인물 얼굴·복장, 베이지색 소형 용달 캠퍼의 크기와 구조, 지역·시간대
- 금지 요소: 이미지 안의 글자·자막·UI·워터마크, 애니풍, 광택 3D, 과장된 미래 장비, 인물·팔다리 증식
- 출력: 프로젝트용 768×432 JPEG, 원본은 덮어쓰지 않고 새 파일로 보존

## 장면별 프롬프트 핵심

| 파일 | 연결 장면 | 행동 |
|---|---|---|
| `recruit-minji-task-signal.jpg` | 민지 첫 부탁 | 기울어진 차 더미 앞에서 운전자에게 정지·당김 손 신호 |
| `recruit-minji-task-collapse.jpg` | 민지 첫 부탁 결과 | 공구함이 빠져나오고 차 더미가 무너지는 순간 |
| `recruit-minji-follow-listen.jpg` | 민지 두 번째 사건 | 진단기 정지 버튼 위에서 멈춘 엄지와 저장된 정오 신호 |
| `recruit-minji-follow-record.jpg` | 민지 두 번째 사건 결과 | 달구지 생활 소리와 새 대답을 직접 녹음 |
| `recruit-parkss-task-power.jpg` | 박 선생 첫 부탁 결과 | 달구지 배터리로 냉장기를 살리고 세 아이 약을 나눔 |
| `recruit-parkss-follow-shared.jpg` | 박 선생 두 번째 사건 결과 | 물·기록·이송 준비를 여러 사람에게 나눠 맡김 |
| `recruit-leo-task-wade.jpg` | 레오 첫 부탁 결과 | 안전줄을 맨 채 침수 차도로 들어가 보리에게 접근 |
| `recruit-leo-follow-puddle.jpg` | 레오 두 번째 사건 결과 | 노래 없이 걷던 중 보리의 흙물 세례에 함께 웃음 |
| `recruit-jaeyi-task-lift.jpg` | 재이 첫 부탁 결과 | 윈치와 도르래로 철근을 들고 가족 상자를 꺼냄 |
| `recruit-jaeyi-follow-shelf.jpg` | 재이 두 번째 사건 결과 | 비 새는 달구지 안에 가족 상자용 마른 선반을 증설 |
| `recruit-eunsu-task-breaker.jpg` | 은수 첫 부탁 결과 | 정확히 둘에 차단기를 내리고 루프선을 꽂음 |
| `recruit-eunsu-follow-lights.jpg` | 은수 두 번째 사건 결과 | 기계 승인 대신 능선 아래 사람의 두 번 깜빡임에 응답 |
| `recruit-kangwoo-task-seoyeon.jpg` | 강우 첫 부탁 결과 | 서연이 시장 싸움을 스스로 끝내고 강우가 개입을 멈춤 |
| `combat-walker-joint.jpg` | 보행기 교전 | 케이블 볼트와 갈고리줄로 노출된 무릎 관절을 꺾음 |
| `seoul-core-key.jpg` | 남산 코어 | 가족 검증 모듈을 정비 포트에 삽입하고 동료들이 보조 |
| `roadcrew-bridge-wedge.jpg` | 도로수선단 다리 | 도윤이 쐐기를 박고 순임이 교각 진동을 읽음 |

선택 결과 전용 이미지는 `D.eventChoiceScenes`에 연결해 선택 전에 노출되지 않도록 했다.
