# Cycle 23 추가 장면 3장 — 제작·자체 검수 완료

Root가 승인한 세 장면만 제작했다. 소스, 생산 assets, 갤러리는 편집하거나 복사하지 않았다. 최종 기록은 `provenance-extra-three-final.json`이며, 변환 직후의 `provenance-extra-three.json`도 그대로 보존했다.

| 이벤트 | 준비된 WebP | 크기 | 실제 그림 판정 |
| --- | --- | ---: | --- |
| ev_uplink | story-ridge-uplink-dishes-v1.webp | 147,950 B | 능선의 여러 줄에 접시 수십 기가 하늘 쪽으로 향하고, 아래 도로에서 케이블 묶음이 올라간다. 사람·남산·접속 성과 없음. |
| camp_scan | camp-field-searchlight-v1.webp | 74,180 B | 빈 밤 들판의 드론 한 기가 달구지 앞쪽 땅에 빛을 비춘다. 실내의 약한 불빛은 남아 있으며, 발각·불 끄기·동료 행동·개는 그리지 않았다. |
| seoul_base | seoul-cablecar-stairs-v1.webp | 149,072 B | 도시가 보이는 완만한 언덕 아래 승강장, 정지한 빈 곤돌라, 안개 속으로 오르는 돌계단. 인물·편지·커피·등반 결과 없음. |

세 최종 WebP를 변환 후 각각 `view_image`로 직접 열어 확인했다. 생성된 큰 PNG도 별도로 열람했다. 모바일 360/480 화면의 실제 CSS 자르기, 갤러리, 사건 연결 검수는 root 담당이며 이 기록에서는 완료했다고 주장하지 않는다.

`prompts-extra-three.json`과 `prompts-extra-corrections.json`에 입력 전문과 참조를 보존했다. 모든 생성·수정은 내장 image_gen을 사용했다. 정본 네 장을 참조했으며 계약의 base/negative 전문 일치를 검사했다. 선택된 1672×941 PNG는 생성 원본과 SHA-256이 같고 `masters/`에 보존했다. 변환은 sharp의 1024×576 cover/centre, sRGB, WebP quality 86, effort 6이다.

첫 능선 그림은 접시가 약 11개여서 수십 기 조건을 충족하지 못했다. image_gen으로 추가 열을 만들었다. 첫 케이블카 그림은 별도 먼 언덕에 남산타워가 보여 지리 해석이 어긋날 여지가 있어 해당 타워만 제거했다. 두 첫 시도는 `masters/*-attempt01.png`로 보존했다. 캠프 그림은 첫 생성본을 채택했다.

앞서 완료한 지하 문서실과 견인차 차고지는 `README.md` 및 `provenance-v2.json`을 참고한다. 이 추가 세 장까지 승인된 다섯 장이 준비됐다.
