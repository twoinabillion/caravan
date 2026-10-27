# Story 담당 중단 체크포인트 — 2026-10-26

사용자가 현재까지 기록하고 commit/push를 요청하여 신규 원정·수선·검사를 멈췄다. commit/push는 root가 소유한다. 이 담당은 Git 기록이나 원격을 변경하지 않았다.

## 완료·적용

- 24차 seed284003 단일 정상 원정: 강우/박 선생/레오/보리, core_sleep, 129선택. 실제 전편/노트/짧은말/NPC/103고유 이미지 파일 검토 및 entry/paid reload 각각129회. 시작/종료/리뷰 종료40소스 일치. `cycle24/story/README.md`, `report.json`, `findings.json`.
- 과거 보존 회귀 두 개 정밀 투영 완료: `tests/test_qa_cycle12_story_speakers.cjs` seoul_han 승인된 난간 문구, `tests/test_qa_cycle17_survival_readers.cjs` comp_water_fight 승인된 결과 문구. 관련57/57. `cycle24/story/test-contract-verification.json`.
- 25용 문구 최소 수선 완료: `src/03i-story-expansion.js` meal 첫 줄 ‘민지 양, 밥 제대로 안 먹었지.’, `src/03-data.js` roadEchoCopy의 날씨 지역변수/‘맑음 뒤’ 등 접두부 제거. 정확 전체 diff 및 원본은 `cycle24/story/repair25/`. 신규 `tests/test_qa_cycle24_story_copy.cjs` 11/11, 역사 대사 계약17/17, 기존 road echo 계약1/1, lint0. 인용수/기계 변화가 없어 corpus 해시·projection 추가 없음.

## 완료된 격리 초안 — 생산 미적용

`cycle24/story/time-scene-draft26/`의 `README.md`, `draft.patch`, `verification.json`, `source/src`, `test.cjs`.

- 생산40의 읽기 복사본에서 03g/04h/07 세 파일만 수정했다. opt-in8사건, 05:30/19:30 경계, 새 receipt의 optional sceneTime, 새 결과의 실제 시간 재선택, 옛 saved keys/clock 부재 보존.
- 최종33/33, baseline2pass/31fail. 80경계 entry/20전체결과, 실제 수면120분·echo35/15분, first-UI 전 새paid, 옛 entry8/paid20 saved/text-only, 재지급0, source marker/옛 stage 보호.
- Root가 정한 아트9개 키 이름은 맞췄지만 `__QA_TIME_SCENE_STUB_…__`와 `status:'qa-stub'`다. 실제 자산·gallery·crop 검증 또는 production 연결이 아니다.
- 마감 verification 시 production40은 최초 read-copy SHA와 동일했다. 이후 root의 다른 작업 상태를 이 문서가 다시 검증했다는 뜻은 아니다.
- 실제 아트 도착 후 token/meta를 실제 레지스트리로 바꾸고, root의 UI 검수를 거쳐야 한다. 전체 source 파일을 생산에 덮어쓰지 말고 국소 patch만 검토한다.

## 마지막 좁은 후보 — 미수선·새 회귀 미작성

아래 세 건은 시간별 그림 draft와 별개다. 중단 지시 전에 원문과 기존 증거만 읽었다. 추가 source copy/draft patch/test는 아직 만들지 않았다. 자연25 원정 발견으로 합산하지 않는다.

1. **seoul_ruins choice2 out0 화자**
   - 증거: `cycle24/visual-time-survival/event-reader-review.json`의 실제 reader가 ‘얘, 사람 속은 자주 틀린대.’를 passer_man/???/speakerUncertain으로 기록한다.
   - `src/03-data.js:15484`: 내가 하 여사의 종이 뭉치를 서랍에서 꺼내 사례들을 읽고, 같은 논평 뒤 종이를 다시 넣는다. 새 외부인은 등장하지 않는다. solo도 가용하다.
   - 선행 `cell_dome_2`의 하 여사 메모는 ‘걘 카메라에 찍힌 건 잘 봐. 사람 속을 자꾸 틀려서 그렇지.’라는 별도 문장이다. 따라서 이 결과는 현재 주인공의 요약·논평으로 읽는 것이 자연스럽고, 하 여사의 현장 발화나 원문 그대로의 기록 인용으로 새로 지정할 근거는 없다.
   - 최소 제안: 해당 outcome에 `turnSpeakers:['me']` 한 필드. 본문/효과/조건 불변. 이 담당의 별도 실제 parser 재실행·newpaid/oldpaid 회귀는 미완료다.

2. **lc_sejong_library choice0 out0 문장 조각**
   - Root 실제 UI: `cycle25/live/lc_sejong_library-result.jpg` 및 `.txt`. 서술 ‘테이프를 끊고(안전 테이프였지만 기분은 리본),’ → 상혁 대사 ‘개관을 선언합니다’ → 독립 서술 ‘를 외쳤다.’로 표시된다.
   - `src/03-data.js:5859`의 한 문장 내 직접인용 구조가 원인이다. 기존 `D.eventTurnScripts`에 me route는 이미 있다(14081 부근). 새 전역 parser 수선은 필요 없어 보인다.
   - 최소 제안: 대사 전 행동을 완결해 ‘테이프를 끊었다(안전 테이프였지만 기분은 리본). 그리고 목청을 높였다.\n\n"개관을 선언합니다"’로 만든다. 뒤 책 대출 본문/대사 내용/효과/노트는 그대로 둔다.
   - 검색한 과거 README/findings에는 이 문장 조각을 별도 확정한 기록을 찾지 못했다. 과거 me 메타 수선과 이번 UI 문장 분리는 다른 항목이다. 적용·회귀 미완료.

3. **seoul_base choice0 out0 화자**
   - Root 실제 UI: `cycle25/live/seoul_base-result.jpg` 및 `.txt`에서 ‘산 사람들이 안부 전하래.’가 ???/외부인 초상으로 나온다고 보고했다.
   - `src/03-data.js:15501`은 산지기의 능선을 따라 내가 코어 뒤편에 붙은 뒤, 천리안의 AI 음성 ‘…경로를 확인할 수 없습니다.’에 이어 위 말을 하고 코어를 내려다보는 문맥이다. 산지기나 새 외부인이 현장에 들어오는 서술은 없다.
   - 최소 제안: 해당 outcome의 유일한 인간 직접대사를 `turnSpeakers:['me']`로 명시. AI span은 기존 AI 매체로 남긴다. 원문/효과/조건 보존.
   - 이 담당은 원문 근거까지만 확인했다. 별도 actual reader 재실행·모든 인접 결과/legacy 회귀·patch는 미완료. 해당 fixture의 0km는 원정 버그가 아니다.

25차 새 fresh 여정은 시작하지 않았다. 추가 도구 작업과 생산 수정을 멈춘 상태로 root에 인계한다.
