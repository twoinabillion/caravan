# 23차 볼링장·예식장 전용 그림

Root 승인 범위의 `exp_bowling`과 `ev_wedding_hall_storage`용 **선택 전 place 장면**이다. 게임 소스/registry/배포 자산/갤러리는 변경하지 않았다.

| 사건 | 최종 WebP | 크기 | 용량 |
|---|---|---|---|
| exp_bowling | [explore-bowling-lanes-v1.webp](explore-bowling-lanes-v1.webp) | 1024×576 | 103,728 bytes |
| ev_wedding_hall_storage | [explore-wedding-hall-storage-v1.webp](explore-wedding-hall-storage-v1.webp) | 1024×576 | 105,676 bytes |

`imagegen` SKILL, IMAGE-BIBLE, visual-contract를 읽고 필수 canonical 4개를 직접 열람·첨부했다. 공통 base/negative 문구는 그대로 사용했다. 두 사건의 entry, 모든 선택/결과(2+3개), 노트를 frozen23 source에서 읽고 `scene-specs.json`에 보존했다. 두 장 모두 사람과 차량 없이, 실제 선택 결과를 미리 보여 주지 않는 실내 구도다.

Builtin image_gen으로 생성했고 CLI/API 우회는 없다. 1536×864를 요청했으나 실제 PNG 반환은 **1672×941**이다. `masters/`에 원본 바이트 그대로 복사하고, sharp centre-cover resize → sRGB → WebP quality86/effort6으로 내보냈다. 정확한 프롬프트/request, 출력 경로·hash, 참조 hash, 실패 보정본까지 [provenance.json](provenance.json)에 남겼다.

볼링장 첫 생성에는 반환대의 작은 흰 로고형 표식이 있었다. 첫 국소 편집에서도 남아 있었으므로 그 출력도 보존했다. 두 번째 국소 편집으로 반환대 덮개를 낮은 무표시 공 거치대로 바꿨다. 최종본에는 꺼진 점수판, 레인, 핀, 공만 남고 읽을 수 있는 글자나 로고는 보이지 않는다. 사람의 수동 대회나 공만 챙기는 선택 모두에 맞는다.

예식장은 바랜 조화 아치와 빈 연회홀, 넘어진 의자, 닫힌 방명록과 서비스 문을 보여 준다. 먹을거리나 냉동고 내용물은 보이지 않아 창고 성공/실패 어느 결과도 앞서 확정하지 않는다. 혼인 당사자나 하객을 발명하지 않았다.

생성본과 최종 WebP 두 장을 실제 열람했다. 구도·시간 중립·스타일·문구·로고·인물 부재를 [visual-review.json](visual-review.json)에 기록했다. 이는 **원본/내보낸 파일 검수**이며 실제 게임 480/360 crop이나 갤러리 통과 주장이 아니다. Root의 갤러리 확인 후 복사·연결·실 UI 검수가 남는다.

정상 pre-reader 백업은 `../story/agent03/attempt01/normal-unpaid-100-exp_bowling.json` 및 `normal-unpaid-280-ev_wedding_hall_storage.json`이다. view/reading 삭제나 event 주입을 하지 않은 원본이다. 23차 텍스트/이미지 전편 원정 보고와 이 생성 작업은 구분한다.
