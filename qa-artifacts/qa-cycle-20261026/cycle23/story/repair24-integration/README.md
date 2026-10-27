# 24차 exact copy 계약 통합

생존 담당 2개 결과문과 시스템 담당 한강 entry 두 분기/편지 결과 한 문장, 합계 **5문구/4필드**를 `tools/test-dialogue-register.cjs`에서 정확히 assert한다. 한강 동적 함수는 frozen23의 원래 함수에 승인된 두 문자열 치환만 적용한 전체 함수와 같은지 확인한 뒤 그 정확한 함수를 계약에 넣었다.

인용 수/화자 metadata/기계 효과는 전혀 바뀌지 않아 기존 corpus hash와 `story-review-contract.cjs`를 변경할 필요가 없었다. 불필요한 역투영이나 해시 갱신은 추가하지 않았다.

- 기존 관련 검사 36/36 통과를 `before-contract.tap`에 기록.
- 새 계약을 frozen23 데이터에만 연결한 별도 읽기 fixture는 16통과/1실패(`ev_eunsu_solo exact cycle23 copy`). 파일이나 게임 상태를 바꾸지 않았다. `guard-frozen23.tap`.
- 현재 생산 소스의 기존 화자 계약 + 두 담당 회귀는 36/36 통과. `green36.tap`.
- dialogue lint 통과. 생산 40개 파일은 frozen24와 그대로 같음. `verification.json`.

원정 23 원본은 수정하지 않았다. 전체 테스트/빌드/실 UI 검증은 root 소유다.
