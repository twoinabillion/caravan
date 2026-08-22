# 인수인계: 대사 자연스러움 패스 (2026-08-22)

Claude 세션이 `src/03-data.js`의 대사를 대대적으로 손봤다. 같은 저장소에서 작업 중이라면
아래 네 가지를 알아야 한다.

---

## 1. 🔴 브랜치가 바뀌었다

`master` → **`dialogue-naturalness-pass`**

```
1a13eb5  Make dialogue sound like people talking, not exposition
433ce54  Polish bag layout and add transition QA   ← master가 가리키던 곳
```

작업 트리의 파일 내용은 **하나도 건드리지 않았다.** 네 미커밋 변경분은 전부 그대로 있다.
다만 지금 커밋하면 이 브랜치 위에 쌓인다. master로 돌아가려면 `git checkout master`
(미커밋 변경분은 따라온다).

---

## 2. 무엇이 바뀌었나

**한 파일만 커밋했다: `src/03-data.js`** (+1,083 / −868)

문제의식: 대사가 "너무 효율적"이었다. 모든 줄이 정보를 전달하고 마지막 줄이 격언으로
딱 떨어졌다. 사람은 그렇게 말하지 않는다.

- **이벤트 481개 + 티키타카 45개** 손질 (대사 샘플 4,042 → 5,384줄)
- `event.text`와 `choices[].out[].text` 안의 서사·인용만 수정.
  **`fx`/`req`/`flag`/`id`/`choices[].label`은 일절 건드리지 않았다.**
- 긴장·비극·클라이맥스 20건은 밀도가 의도된 곳이라 일부러 남겼다
  (`cleaners_recall`, `signal_bait`, `seoul_han/square/core`, `loc_mingyu`,
  `ev_parkss_past`, `es_backdoor` 등)

부수적으로 고친 기존 버그:

- **호칭 정본 위반 13건** — 레오가 주인공을 "형", 민지·강우가 "너"라고 부르던 곳.
  린트의 당신·너 검사가 `D.banter`/`D.chats`만 훑어서 이벤트 대사는 사각지대였다.
- **화자 매칭 2건** — `rq_minji_join`에서 주인공 대사 "내릴 때마다?"가 민지 이름으로
  표시되던 것 포함. `D.eventTurnScripts` 불일치 7건 → 4건.

---

## 3. ✅ 도로 전조 UI 초기화 문제 해결됨

통합 전에는 시작 화면에서 아래 오류로 멈췄다:

```
Uncaught ReferenceError: Cannot access 'UI' before initialization
    at src/04d-engine-director.js:229
```

원인은 `04d-engine-director.js`가 `const UI` 선언보다 먼저 실행되면서 최상위에서
`UI.roadApproach`를 대입한 것이었다. 통합 과정에서 구현을
`src/07f-ui-road-thoughts.js`로 옮겼다. `04d`에는 이벤트 발생 뒤 호출되는 참조만 남아
초기화 순서상 TDZ가 발생하지 않는다.

대사 변경분이 결백한 건 따로 확인했다. HEAD 엔진 + 이 `03-data.js`로 워크트리를 만들어
돌렸더니 **골든 루트 포함 전부 통과**했다(companions·beats·seoul·choices·npcs·finale).

---

## 4. 새 대사를 쓸 때

`docs/DIALOGUE.md`에 **§덜 효율적으로 말하기** 절을 추가했다. 새 이벤트를 쓰기 전에 읽어라.
안 읽으면 새 대사만 옛 문체로 튄다.

다른 모델에게 대사 손질을 맡길 때 쓰는 프롬프트: **`docs/dialogue-rewrite-prompt.md`**
(호칭표·인물별 금지 구절·따옴표 개수 규칙 포함)

### 검증 게이트

```
node --check src/03-data.js       # 문법
node tools/dialogue-lint.cjs      # 몰입 파괴 0건 · 경구 종결 ≤16%
node tools/validate-content.cjs   # 참조 정합성
```

현재 상태: 문법 OK / 몰입 파괴 0건 / 경구 종결 11% / 참조 정상.

### ⚠️ 따옴표 개수를 바꾸지 마라

`D.eventTurnScripts`에 걸린 이벤트는 **인용 순서대로** 화자를 배정한다.
따옴표를 하나 더 넣거나 빼면 그 뒤 대사가 전부 다른 사람 이름으로 표시된다.
마찰을 더 넣고 싶으면 따옴표 없는 내레이션으로 넣어라.

`resist_reveal`·`cell_sea_meet`·`gw_gangneung`은 `strictSpeakerEvents`라 개수가 어긋나면
린트가 하드 에러를 낸다.
