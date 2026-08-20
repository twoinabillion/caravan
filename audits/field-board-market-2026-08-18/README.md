# 현장 판 1단계 — 대구 돔 중앙 장터

`docs/history/handoffs/CODEX-UI-FIELD-BOARD.md`의 착수 순서 1만 구현한 증거다. 대구 장터 한 화면만 새 판을 쓰며,
다른 도시 장터와 정비소·휴게소·통로는 확인 전 상태를 유지한다.

- 히어로 사진 반복: 1개 → 0개
- 카드 스택: 게시판/거래/묶음 카드 → 연속 목록 1개
- 실행 버튼: 품목 수만큼 → 하단 고정 1개
- 정보 유지: 의뢰, 기한, 사례, 시세, 시간, 재고, 매입, 이웃 시세 소문
- 자산: `assets/ui/field-board-frame-v1.webp`, 96×96, 투명 WebP, 672 bytes
- 캡처: `market-320.png`, `market-390.png`, `market-475.png`
- 재현: `python3 audits/field-board-market-2026-08-18/capture.py`
- 계약: `python3 tests/test_field_board_market.py`

검증 결과: 세 폭 가로 오버플로 0, 행 높이 44px 이상, 실행 버튼 1개, 기본 보급 구매 후
고철·물·식량 상태 변경. 전체 smoke, settlement story, UI coherence, market economy 회귀도 통과.
