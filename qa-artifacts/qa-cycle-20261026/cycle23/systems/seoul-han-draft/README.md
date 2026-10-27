# 한강 녹음의 외부 장치 출처 — QA 초안

초안 검증 후 root 소유권 양도와 적용 승인에 따라 생산에 세 문구만 반영했다. 먼저 동결23 소스를 읽어 메모리 안에서 실제 reader/정산/저장 경로를 검사했다. 자연 원정이나 새 정상 플레이 횟수에 넣지 않는다.

## 독립 원인 판정

자연 trace547은 `postman_met=true`, 차량 `radio_fixed=false`이며 우편부 녹음 전체를 낸다. meet_postman의 모든 결과는 이름/정착지 정보 또는 물과 지름길을 교환한다. postman_again은 편지를 맡기거나 원칙대로 직접 배달하겠다고 떠난다. 둘 다 녹음기·테이프를 넘기거나 차량 재생장치를 설치하지 않는다. seoul_han의 text 함수는 postman_met/postman_letter만 검사하고, 녹음 재생 장치의 위치는 쓰지 않는다. G.fixRadio의 설명은 진공관을 교체해야 길 위 방송이 들린다는 계약이다.

이는 수리 flag를 더 주거나 본편 진입을 막아 해결할 문제가 아니다. 본래 난간에 매달린 표식/물건을 묘사하는 장소 안에서 라디오도 난간의 별도 장치임을 명시하면 차량의 미수리 상태와 충돌하지 않는다. 음성 내용이나 우편부를 알아듣는 조건은 바꿀 이유가 없다. 미만남 잡음 분기는 cycle20에서 비결함이었으며 그 판단은 유지한다. 동일 장치의 위치 문구만 두 entry분기와 편지 결과 마지막에 일치시킨다.

`copy-delta.json`와 `production-proposal.patch`는 정확한 세 문자열 초안이다. 인용문 수·화자/매체·선택 label/index·flags/gates/notes/time/FX는 불변이다. historical projection은 story 담당에게 exact delta로 넘겨야 하며 이 폴더에서 계약 파일은 수정하지 않았다.

## 검증

- frozen23 실제 코드: `red-frozen23-02.tap` **5pass / 7fail**. 새 외부 위치 표현과 그것을 포함한 exact-event 비교만 실패한다.
- QA 메모리 초안: `green-draft02.tap` **12/12**.
- 우편부 만남 유무 × 차량 수리 유무4경계, 편지 수락 두 차량 상태, 네 선택의 실제 parser·독립 화자·효과/칩/노트 동일성을 확인했다.
- 정상 기존 unpaid export의 저장된 entry는 그대로 보존된다. 새 진입 fixture에서만 새 문구가 나온다.
- 네 결과의 새 지급 후 reload와 네 기존 paid/text-only receipt를 모두 보호한다. 재지급0.
- `legacy-0.json`~`legacy-3.json`은 정상 entry에서 파생한 격리 경계 fixture이며 새 원정 성과가 아니다.

초기 `red-frozen23.tap`/`green-draft01.tap`은 fixture 파일의 괄호 오타로 runner가 로드되지 않은 QA 도구 실패다. 게임 red/green 증거는 그 뒤의02 로그이며 처음 로그도 삭제하지 않았다.

실행: `node fixture.cjs`로 동결 baseline을 준비하고, `node --test test.cjs`로 red를, `QA_HAN_DRAFT=1 node --test test.cjs`로 메모리 초안 green을 재현한다. 어떤 명령도 src를 쓰지 않는다.

## 승인 후 실제 생산 검증

`tests/test_qa_cycle23_seoul_han.cjs`와 `green-production01.tap`: **12/12**. 현재 생산 소스를 읽되 비교 기준/옛 receipt는 동결23을 그대로 사용한다. root가 수정한 다른 사건은 덮지 않았으며 src03-data의 한강 블록3문구만 apply_patch했다. 실제23 원정의 report/hash/oldentry는 다시 쓰지 않았다. exact copy delta는 story 계약 담당에게 전달했다.
