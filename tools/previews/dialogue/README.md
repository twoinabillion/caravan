# 사건 대화 시안 — 2026-09-21

Sang의 ‘한번 보여줘봐’ 요청에 따라 트럭 카페 한 사건을 별도로 구현한 인터랙티브 시안이다. 게임 본편에 통합하지 않았다.

```sh
node tools/previews/dialogue/serve.mjs
```

주소: http://localhost:4177/ . 서버는 127.0.0.1에서 시안 HTML과 지정된 기존 이미지 세 개만 제공한다. 기존 게임 서버 localhost:4176과 저장소에 접근하지 않는다. 새로 열거나 새로고침하면 도입부터 시작한다. 자원 변화는 시안의 표시이며 실제 여정에 반영되지 않는다.

- 상황 소개 → 대화와 선택 → 선택한 반응과 결과 → 미리보기 종료.
- 원문의 세 선택과 결과를 사용하되 의미 단위로 묶었다. 종료 화면의 연결 문구만 시안용이다.
- 그림·화면 높이를 유지하고 현재 본문을 교체한다. 선택지는 아래에 남는다.
- 기록에는 본 대화·선택·반응만 남고, 닫으면 같은 페이지와 스크롤로 돌아간다.
- 큰 글씨와 작은 높이에서는 현재 페이지 안에서만 스크롤하며 이어 읽기 표시가 나온다.

실제 Chrome에서 데스크톱, 390×844, 320×568 큰 글씨를 확인했다. 세 선택지의 전체 반응, 기록 열기/닫기/복귀, 다시 선택하기, 처음부터 보기, 큰 글씨와 현재 본문 스크롤을 조작했다. 320×568 큰 글씨에서 바깥 문서 높이는568px, 선택지 하단은439/488/537px, 현재 본문은191px 뷰포트에231px 내용이었다. 임시 viewport 원복. 콘솔에 타사 Chrome 확장의 content.js 오류 두 개가 있었으며 시안 출처 오류는 관찰하지 않았다. 일부 로케이터 기반 측정이 도구 시간 초과를 내어 페이지 DOM 읽기로 측정했다.

기존 자산: `event-road-coffee-van-v2.webp`, `passer_merchant.png`, `event-manuscript-panel-tall-v1.png`. 신규 이미지 생성·편집, 게임 빌드·커밋·배포는 하지 않았다. 실제 사용자 읽기 속도·선호도, 전체 사건 호환성은 이 시안의 검증 범위가 아니다.

## 1번 선택 후 구현 — 2026-09-21

Sang이 첫 이미지 방향을 선호해 기존 시안을 `조수석의 생활 도구`로 고도화했다. 같은 http://localhost:4177/ 에서 시작하면 이미지와 같은 대화/선택 상태가 나온다. 기록 안의 `처음부터 보기`로 상황 소개부터 읽을 수 있다. 옛 종이 시안은 `legacy-parchment.html`과 `/legacy`로 보존했다.

- 별도 생성 자산4개: `assets/passenger-scene.png`, `passenger-panel.png`, `passenger-choice.png`, `passenger-wordmark.png`.
- 레이아웃과 동작: `passenger.css`, `dialogue.js`, `index.html`.
- 전체 대화는 누적 기록으로 남고 현재 화면의 본문만 교체한다. 실제 게임 저장과 자원은 바꾸지 않는다.
- 실제 Chrome390×844/320×568 큰 글씨/데스크톱 및3분기·기록·재시작 검증: [design-qa.md](design-qa.md).
- 제목 [Black Han Sans](https://github.com/google/fonts/tree/main/ofl/blackhansans), 본문 [Noto Sans KR](https://github.com/google/fonts/tree/main/ofl/notosanskr)는 Google Fonts 공식 저장소에서 내려받았다. 각OFL 라이선스를 assets에 함께 보관한다.
- 배경은 세로 시안용이며 본편 canonical narrative asset으로 승인·통합한 것이 아니다. 생성HTML·본편소스·개인저장·배포는 이번 단계에서 바꾸지 않았다.
