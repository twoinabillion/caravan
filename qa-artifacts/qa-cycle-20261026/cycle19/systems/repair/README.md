# Cycle20 준비: 잡음의 출처와 만물상 상인

19차 모든 원정·전편 검토·40소스 보존이 끝난 뒤 root의 명시 허가로 수행했다. 새 원정을 실행하지 않았으며 이 파일들의 경계 fixture는 자연 원정 통계에 합산하지 않는다.

## 범위와 원인

- **자연 확정 C19-SYS-01 — signal_bait**: trace240의 실제 reader는 반복 구조 요청을 `radio / 녹음된 구조 요청`으로 보여주다가 중간 잡음만 `ai / cheollian / 천리안 방송`으로 표시했다. 모든 결과를 읽어도 천리안 송신이라는 근거는 없다. 원인은 해당 문단의 `<span class="ai">`다.
- **자연 명료성 C19-SYS-C01 — crisis_nofuel**: trace70 결과에서 `만수네 만물상`이 소개된 직후 상인의 말이 `passer_worker / ???`로 나왔다. 본문은 NPC 만수 본인임을 증명하지 않으므로, 기존 `passer_merchant` 초상과 `만물상 상인` 역할명을 사용한다.
- **별도 파생 — crisis_nofuel2**: 인접 유료지원 결과가 같은 만물상 소개·대사 구조이고 actual reader도 같은 역할을 잃었다. root의 추가 허가로 같은 결과 필드만 고쳤다. 19차 자연 발견 수에는 넣지 않는다.

## 생산 델타

`src/03-data.js` 세 군데만 작은 patch로 변경했다.

1. `signal_bait.text`: `<span class="ai">(잡음)</span>` → `잡음이 섞였다.`
2. `crisis_nofuel.choices[1].out[0].turnSpeakers` = `[{who:'passer_merchant',name:'만물상 상인'}]`
3. `crisis_nofuel2.choices[1].out[0].turnSpeakers` = 동일 배열.

span만 제거하고 `(잡음)`을 남기는 첫 최소안은 실제 parser에서 주인공 thought/상혁으로 바뀌었다. 이 중간 실패를 `tests-span-only-red.txt`에 남기고, root 동의 후 해당 문단만 일반 문장으로 바꿨다. 전체 parser나 다른 AI span, unknown fallback, 초상 registry는 바꾸지 않았다. 기존 두 구조 요청 인용과 radio route, 모든 선택·결과의 글자·효과·확률·조건·비용·플래그·노트는 유지한다. exact delta는 `exact-delta.json`으로 story 계약 담당에게 전달했다.

## 검증과 보존

- `tests/test_qa_cycle19_systems_media.cjs`: **18/18 통과**. 최종 동일 테스트를 동결19 전체 소스로 실행하면 **6 실패 / 12 통과**한다. 생산 소스를 되돌리지 않고 test-only loader가 보존본을 읽었다.
- 세 사건의 entry와 **모든 10개 outcome**을 actual reader로 읽었다. 구조 요청의 양쪽 radio, 은수의 역추적 질문/답, 무시하고 가기, 무료 도보/지원불발 결과를 함께 보호한다. 만물상 역할은 독행/동료2명/역순에서도 동료나 NPC 만수로 바뀌지 않는다.
- 모든10분기의 현재 entry·paid reload, 지급1회, 시간·자원·노트·플래그·결과 chip이 동결19와 같음을 확인했다.
- 동결19에서 만든 **기지급10개 + text-only10개**는 현재 코드에서도 과거 본문과 화자를 보존한다. 실제 old text-only reader는 `out.speakers`까지 받으므로 직접 parser만 부른 초기 예상 비교를 바로잡았다. 초기 실패 로그는 `tests-red-initial.txt`에 보존했고 최종 동결19 red로 다시 확인했다.
- 라디오/긴급구제/사건전환 관련 기존검사 포함 **47/47 통과** (`tests-focused.txt`). 대사 lint 몰입 파괴0, 기존 반복 시작 수동 후보2. diff-check 통과.

`baseline.json`, `reader-after.json`, `legacy.json`과 각 legacy 파일이 전후 증거다. legacy 생성은 명확히 표시된 경계 fixture다: 정상19 entry를 기반으로 필요한 동료·물자를 별도로 설정하고 한 weighted outcome을 고정했다. 정상 원정·자연 획득·실제 UI 행동이라고 보고하지 않는다. 원19 자연 기록과 저장은 변경하지 않았다.

생산 추가 편집은 종료했다. 전체 suite/build·실제 브라우저 화자/그림은 root 담당이며, 이 검사는 그 시각 증거를 대신하지 않는다.
