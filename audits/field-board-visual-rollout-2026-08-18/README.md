# Field Board visual finish — 2026-08-18

`docs/history/handoffs/CODEX-FIELD-BOARD-VISUAL.md`의 승인된 B안 표면 마감을 7개 도시의 장터·정비소·사람들·현장
통로, 총 28개 화면에 적용한 비교 증거다.

- `before-contact-sheet.png`: 표면 마감 전 28화면
- `after-contact-sheet.png`: 표면 마감 후 28화면
- `before-after-contact-sheet.png`: 같은 배열의 좌우 전후 비교
- 원본 개별 캡처와 재현 스크립트: `../field-board-rollout-2026-08-18/`

## 최종 계약

1. 판 머리는 각 도시의 `roof/light/accent`로 계산한 켜진 간판이다.
2. 몸통은 금속 판 표면이며, 도시마다 별도 신규 이미지를 만들지 않는다.
3. 의뢰만 `.field-board-note` 압정 종이쪽지로 렌더한다.
4. 물자·정비·사람·현장 행동은 기존 `ICO()` 또는 인물 초상 금속 칩을 사용한다.
5. 행 끝 장식용 꺾쇠는 마크업에서 제거한다.
6. 선택 항목은 도시 조명색 워시와 왼쪽 발광 바로 구분한다.

자동 검사는 `tests/test_field_board_market.py`, `tests/test_field_board_rollout.py`,
`tests/test_field_board_visual.py`에 있다. 320/390/475px 가로 넘침과 28화면 동작, 도시별
색·대비·도트·쪽지 재질을 실제 Chrome에서 확인한다.
