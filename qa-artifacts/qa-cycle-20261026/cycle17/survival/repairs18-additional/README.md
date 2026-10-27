# 18차 전 추가 수선 — survival 정적 파생 24사건

`../derived-reader-audit/repair-ownership.json`에 분담된24사건의 entry와 모든 결과를 동결17 actual reader와 본문으로 다시 판정했다. 외부 인물이 등장하지 않는 현재 동료/운전자의 발화가 무작위 외부 행인으로 표시되는 결함은24개 모두 확인했다. 자연 원정에서 새로 발견한 사건수에는 더하지 않는다. 전체97 후보의 제외/분담은 감사 보고를 따른다.

생산 변경은 `src/03-data.js` 해당24사건의 metadata40필드와 `ev_temple_bell[0].out[1]` 본문 한 구절이다. 범종은20분의 결과가 ‘며칠 뒤’를 완료된 만남으로 표시하므로 ‘절에서 내려오는 길에’로 고쳤다.20분/확률/가족 만남/기존 note/보상은 그대로다. 내부 발화는 실제 roster의 첫 동료 또는 운전자이며, 새 고정 인물이나 보상을 만들지 않았다. 명시 민지/레오/은수 분기는 기존 화자를 유지한다. 소식지 결과의 ‘재편성’과 ‘더 안전한 내일’은 실제 발화가 아니므로 authored narration으로 유지했다.

정확 변경: `field-delta.json`40 metadata + `copy-delta.json`1 text. 모든 정의의 다른 필드가 `before-events.json`과 같다는 검사를 통과했다. `routes.json`은 기대 경로 표이며 production exact manifest 대신 쓰지 않는다.

검사 `tests/test_qa_cycle17_survival_additional.cjs`:

- `tests-before01.tap`:29개 중26실패3통과. 실제 unknown-role와 원문 시간 인과를 재현.
- `tests-after02.tap`:29/29. solo/1/2/3/reordered roster의 actual reader, 선택 조건을 충족한 모든 결과, entry/paid reload를 검증했다. 조건이 안 되는 선택은 실제 지급으로 세지 않고 동결17과 불가 조건이 같은지만 확인했다.
- 최종 old paid fixture는 `legacy-index-final.json`/`legacy03/`의53개다. reader가 있는 save와 text-only save를 현재/동결17 각각에 정상 G.load하고 원문/화자/notes/수치 및 재지급 없음 확인. 전부 진단 fixture이며 정상 새 원정이나 추가 참가자가 아니다.
- 기존11사건의44개 과거 paid와 합쳐97개가 검증 대상이다. 동결17 source와 실제 엔진/reader 함수 사용이며 브라우저 클릭을 뜻하지 않는다.
- 범종은10:00/20:00 시작 모두20분 후 현재 만남 문구와 동일 note/효과. 옛 ‘며칠 뒤’ paid 원문은 고쳐 쓰지 않고 보존한다.
- 뉴스스탠드 authored turns에서 인라인 제목과 모든 원문 단어가 보존된다. 새 entry 화자표를 넣은 모든 결과는 독립 경로를 가진다.
- `dialogue-lint01.log`0오류, source syntax와 `git diff --check`통과. 팀 공통 계약 projection은 story 담당에 exact delta를 전달했다.

QA 오류와 보존된 실패 자료:

1. `prepare01`은 은수 선택 조건이 필요한데 roster에 은수를 넣지 않은 fixture 정책 오류로 중단됐다. 부분 `legacy/`와 로그는 남겼다. 새 여정 실패가 아니다. prepare02는 필요한 세 동료 roster로53개를 만들었다.
2. `tests-after01`의 관측회 민지 결과는 repair helper가 실제 UI의 `speakers:out.speakers` 인자를 빠뜨린 탓이었다. 정적 감사와 정상 원정 observer는 해당 인자를 처음부터 전달했으므로 원정/추가 후보 분류에는 영향 없다. 생산에는 불필요한 수선을 하지 않았다. helper만 UI와 맞추고 prepare03/legacy03에53개를 다시 저장했다. 이전 `legacy02/`와 index는 폐기·덮어쓰기 없이 남겼으며 최종 근거로 사용하지 않는다.
3. 같은 실행의 범종 FX 비교는 VM 객체 prototype의 cross-realm assert 차이였다. JSON plain으로 비교해 값이 정확히 같음을 확인했다.
4. 최초 source.patch는 문서 내 hunk 순서가 뒤섞여 적용 검증에서 거절됐고 생산 변경은 없었다. source-ordered.patch로 소유 블록만 정밀 적용했다.

생산 수정은 완료했으며 다음 동결/새 여정은 root 지시를 기다린다. 그림/crop/실제 브라우저 검수는 root 소유다.


최종 승인 추가 copy: `copy-delta-departure.json`의 ev_near_seoul_sign[0].out[0] 한 구절도 수선했다. 기존 두 문장 ‘손이 하나씩 포개졌다. 출발 때 있던 손이 몇 개 빠졌고, 그때 없던 손이 몇 개 얹혔다.’를 ‘길에서 만난 손들이 내 손 위로 포개졌다.’로 바꿨다. 과거 이탈은 새로 단정하지 않으며 현재 동행만 묘사한다. 다른 문장/효과/notes는 그대로다. 미이탈 및 과거보다 축소된 roster fixture를 검사했다. 엔진에 없는 공개 이탈 행동을 실행했다고 주장하지 않는다. 마지막 copy 전 red는 departure-before01.tap, 최종 전체는 tests-final03.tap(30개)이다. 기존53개 과거 paid/text-only 안에 이 사건의 옛 결과가 포함되어 있고 보존된다. initial17개와 합계47검사/97과거paid이며, 생산 exactdelta는 metadata68+copy2다. 최종 집계는 report-final.json을 따른다.

거리 조건은 요청대로 존재 여부만 확인했다. 동결17 ev_near_seoul_sign 정의에는 minRemain/maxRemain가 없고, 기존에 고쳤다고 주장할 수 없다. existing-distance-gate-check.json은 기존 조건의 read-only 진단이다. 이번 수선은 거리 조건을 새로 바꾸지 않았다. 자연 원정이나 새로운 거리 수선으로 계수하지 않는다.
