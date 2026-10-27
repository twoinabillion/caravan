# 26차 시간별 그림 격리 draft

**생산 미적용, 실제 그림·브라우저 검수 아님.** 현재 25차 후보 생산 40개 파일을 `baseline/src`와 `source/src`에 복사했다. 구현은 `source/src/03g-scenes.js`, `04h-engine-presentation.js`, `07-ui.js` 세 파일뿐이다. 마감 때 생산 40개 SHA가 최초 read-copy와 모두 일치했다. `draft.patch`와 `verification.json`에 범위와 해시를 남겼다.

## 구현

- 8개의 event ID + 기준 scene key에만 낮밤 variant를 적용한다. 같은 공용 키를 쓰는 다른 사건에는 자동 확장하지 않는다.
- 새 opt-in entry receipt에는 `{day,min}`, 새 결과 receipt에는 실제 효과 적용 후의 `{day,min}`을 저장한다. 기존 04h validator/reading view가 선택적으로 보존하며 옛 receipt에 소급 생성하지 않는다.
- 새 reader는 기존 장면 우선순위를 유지한 뒤 해당 시점의 변형을 고른다. 경계는 기존 `G.isNight`와 같은 **05:30/19:30**, 소수 분도 동일하다. 과거/후일담 마커나 명시 회상 장면은 자동 변형하지 않는다.
- 저장된 reading/view의 sceneKeys는 최우선이며 다시 시간 판정을 거치지 않는다. 옛 key→파일 및 기존 stage 정의를 유지한다.
- 신규 결과에서 수면·작업으로 경계를 넘으면 같은 장소의 결과 그림을 새 시각으로 고른다. entry/history의 그림과 시각은 보존한다. 결과 키가 같을 때만 기존 shot carry를 유지한다.
- 새 시각 표시는 저장된 phase clock을 쓰고, 명시된 timeKind/timeLabel은 기존처럼 우선한다. opt-in 옛 receipt에 시각이 없으면 새 시각을 추정해 넣지 않고 `저장된 장면`으로 표시한다. 키·시각이 모두 없는 옛 text-only/pre-reader는 원래 정적 키 fallback을 유지한다.

## 아트 표식

Root가 정한 9개 최종 키 이름에 맞췄으나 값은 `__QA_TIME_SCENE_STUB_…__`라는 **비렌더링 토큰**이다. meta.status는 `qa-stub`, 설명은 `QA 테스트 표식 — 실제 그림 미연결`이다. 크기는 계획값일 뿐 실제 래스터 검사 결과가 아니다. 실제 에셋 경로, 승인 상태, production mapping으로 사용하면 안 된다.

키 목록: `specs.json`. 최종 그림/gallery 검증 뒤 해당 토큰과 테스트 메타를 실제 레지스트리 항목으로 교체해야 한다. 25차 이후 생산에 다른 수정이 있다면 전체 파일을 덮지 말고 세 owner의 국소 patch만 검토·적용한다.

## 회귀

`node --test …/time-scene-draft26/test.cjs` 최종 **33/33 pass**. 같은 최종 검사를 원본 baseline으로 실행하면 **2 pass / 31 fail** (`before-final33.tap`). 주요 실패는 시간별 키/시각 필드/보수적인 옛 시각 표시/QA 표식이 원본에 없어서 발생한다. 초기 문법 오류와 QA 준비 문제 로그도 보존했으며 생산 결함으로 세지 않았다.

- 8사건 × 10시각 = 80개 경계 entry, 시각을 바꾼 뒤 reload해도 원래 키/시각 유지.
- 8개 사건 정의 및 20개 모든 outcome의 원문·actual buildStoryTurns·비용·자원·노트·플래그·확률/조건 불변. 모든 새 paid reload는 재지급 0.
- 졸음 120분과 road echo 35/15분의 실제 시간 효과가 경계를 넘는 경우 새 결과만 변형하고 entry/history 보존.
- 새 결과 결제 직후 첫 UI capture 이전 저장/재개도 receipt clock 유지.
- 옛 unpaid 8개 + 옛 paid 20개, 각각 saved-view/text-only 모드에서 원래 키/본문과 시각 부재 보존. 옛 unpaid에서 새로 고른 결과만 새 clock을 갖는 경계도 확인.
- 미등록 사건, 명시 foreign 컷, memory/epilogue source marker, 옛 Leo Namwon stage 선택 보호.
- 잘못된 sceneTime은 버리고 미등록 사건은 새 clock을 저장하지 않는다.
- 37개 나머지 draft 파일은 baseline과 바이트 동일. 최종 생산 40개 파일도 최초 hash와 동일.

실제 UI의 DOM 배치·사진 crop·gallery는 이 검사의 범위가 아니다. 테스트는 복사본의 actual reader/장면 선택 함수와 render source-marker/stage 선택 부분을 추출해 검사한다. 아트 연결 후 root의 실제 UI entry/choice/result/reload 확인이 필요하다. 자연 원정이나 추가 cohort로 합산하지 않는다.
