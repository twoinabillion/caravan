# comp_naming 판정과 수선

자연 근거: C6 정상 저장의 별도분기 trace25. 처음에는 개별 화자가 원문에 없어서 명료성 후보로 뒀다. root 요청으로 실제 reader를 레오/박선생, 역순, 민지/은수, 민지/레오/재이의4가지 roster에서 읽었다. 네 구성 모두 사건 후보화자가 빈 배열이고, 동료 명명식의 entry 및 결과5줄을 **passer_man / ??? / __NPC_passer_man__**로 표시했다. 외부인은 도입되지 않는다. 제안과 반박도 같은 초상 참조여서 한 사람이 자기 말을 반박하는 표시였다.

이는 특정 개인이 원래 누구였는지 확정한 것이 아니라, 내부 동료의 역할을 외부인으로 분류한 결함이다. 자연 로그와 현재 소스의4 fixture는 별개이며, 후자는 cohortExcluded다. comp_naming 데이터 블록은 진단 당시13freeze와 동일했다. 실제 픽셀/크롭을 확인했다는 주장은 없다. `reader-rosters.json`, `adjudication.json` 참조.

root 승인 뒤 metadata만 수선했다. entry는 party_first. 결과 authored turns 함수는 S.party[0]/[1]의 실제 cid를 직접 반환한다. 첫 동료가 제안·설명·대안 질문을, 둘째 동료가 질문·반박·동의를, 주인공이 마지막 시동 질문을 한다. 비어 있는 old roster fallback은 이름 없는 동료이며 외부 남자나 플레이어라고 새로 단정하지 않는다. entry party_first의 기존 엔진 fallback은 그대로다.

명시 turnSpeakers는 인라인 "할아버지"까지 발화로 승격시킬 수 있어, 결과 turns에서 기존 문단 전체를 narration으로 남겼다. 원래 text 문자열·선택·확률·30분·사기5·flag·note는 그대로다. 표시된 단어 전체도 원문과 일치한다. authored turn 경로에 party_first/party_second 미해결 토큰은 남지 않는다.

회귀4roster, actual qaEntry/qaResult 우선순위, 실제 엔진 지급/authored view, unpaid/paid reload, 이전 paid view와 text-only 복원, source text/FX 불변: 수정 전2pass/4fail →6/6pass. entry route를 ['me']로 바꿔도 결과 화자는 독립적으로 유지한다. 기존 survival 확대검사와 합34/34, dialogue lint0오류, diffcheck 통과. `metadata.patch`, 수정 전 fixture와source, tests-red01/green01/combined01 로그를 보존했다. 새 자연원정/새 참가자는0이다.

exact projection은 story 담당에게 entry turnSpeakers와 result turns 두 필드만 전달했다. 결과 함수가 추가한 표시 정보 외 코드를 바꾸지 않았다. 14차는 root의 새 동결 뒤 별도 원정으로 시작한다.
