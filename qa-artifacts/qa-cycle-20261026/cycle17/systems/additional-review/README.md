# 17차 동결 이후 18차용 추가 화자·매체 감사

이 폴더는 자연 원정과 분리한 정적 파생 검사다. 원정 횟수·선택·기록 집계에 합산하지 않는다. immutable `cycle17/source/src`를 기준으로 후보18사건의 본문·모든38결과를 다시 읽고 수선했다. 조건·확률·FX·노트·선택 인덱스는 유지했다.

- 안내문/돌글/과거 회유 인용4사건, 명시 역할 역전14사건의 metadata51곳을 정리했다. 원문에 있는 역할·이름과 실제 party/me만 사용했다.
- `lc_daegu_makchang` 구매결과의 질문/답 역전은13차 거절결과 회상 수선과 다른 경로다. 기존 거절route는 유지했다.
- `roadbeat_100_divide` 결과의 회유 인용은 `record / medium:memory`와 ‘조금 전 들은 회유 · 함께 되짚는 말’ 표시를 사용한다. 현재 AI/라디오 방송, 종이 문서로 만들지 않았다. entry의 원래 동적 AI발화는 유지했다.
- 홍어 최소1동료+운전자 경계에서3번째 참가자를 만들던 표현은 별도 승인받아 ‘한 입에 눈물, 또 한 입에 기침. 그런데…’, ‘결국 한 사람이 접시를 비웠다’ 두 조각만 변경했다. 감탄과 아짐의 박수·답, 보상·시간·조건은 같다.
- `kids_escort` 새 화자표는 기존 서술 속 국밥집 주인의 인용도 실제 reader에서 분리한다. 원문은 그대로이며 막내/나/큰애/나/국밥집 주인/큰애6발화를 보호한다.
- 발화자가 특정되지 않은 러너 응원·홍어 감탄에는 고정 인물을 발명하지 않았다. 옥상 팻말의 기존 inline서술, 도윤 손자국 선택의 기존 정상route도 유지했다.

`review-judgments.json`에18건의 판정 근거, `reader-after.json`에 실제 현재 reader18entry/38결과, `exact-delta.json`에51metadata·copy1결과(2조각)의 정확 변화가 있다. 전역 parser/fallback/validator는 변경하지 않았다. 그림 키/asset은root 소유로 건드리지 않았다.

회귀는 `tests/test_qa_cycle17_systems_additional_readers.cjs`: 처음23실패/39통과 → 최종62/62. 홍어 위치 경계의 초기 테스트가 local을 사용한 오류를 발견해 실제 node/mokpo 호출로 고쳤고, 수정된 검사도 동결17에서23실패/39통과를 재현했다(`tests-frozen17-red02.txt`). 현재 새entry/paid38분기와 이전17 paid38/text-only38개를 확인했다. 모든 결과를 고르게 보는 fixture의 자원·party·선택결과 고정은 이 폴더의 진단에만 있으며 자연 플레이로 취급하지 않는다.

이전6사건과 합한 집중검사83/83, dialogue lint0오류, diff check통과. 계약 projection은story담당에게 전달했다. 본인 생산 수정 완료.
