# 17차 후 추가 정적 화자 감사 — story 23사건

parent가 명시 배정한 후보 23사건의 전체 entry와 41개 outcome을 읽었다. 모두 외부인이 없는 내부 대화/운전자 행동에서 일반 외부 초상을 쓰는 문제로 확인했다. 자연 원정 발견 수와 합산하지 않는다. 26개 turnSpeakers 필드만 추가했으며, 특정 성격을 지어내지 않고 현재 party_first/me와 상대방으로 배정했다. 별도로 승인된 crisis_battery[0]는 클러치 조작 전에 운전자가 올라타고 동료들이 마지막으로 밀어 주는 순서로 바꿨다. 마지막 다시 탑승하는 주체도 동료라고 명시했다. minParty1이므로 독행 경로를 새로 만들지 않았다. 비용/조건/확률/선택 순서/기록은 동일하다.

정확 명세는 cases.json(26메타)과 copy-delta.json(1결과)이다. legacy41개는 동결17에서 만든 fixture이며 정상 완주로 세지 않는다. 원본 actualreader 후보는 candidates.json, 사람이 읽은 원문과 전 결과는 read-block-1~3.txt, source정의는 before.json에 보존했다.

새 회귀 tests/test_qa_cycle17_story_additional_readers.cjs는 113/113 통과했다. 1/2/3인 69조합에서 전체 entry/모든 결과를 검사하고, 41개 실제 지급/reload 및 옛41paid view·text-only 보존을 검증한다. 자연 가용성/entry 도달을 강제 주장하지 않는다. 민지 전용 선택의 pure parser 검사는 비민지 로스터에서도 기존 reader와 비교하지만 그 선택이 열렸다는 뜻은 아니다. 실제 지급 fixture에는 필요한 6인과 자원을 갖췄다.

실패도 보존했다. 최초 red의 text-only 기대는 frozen out.speakers를 누락한 직접 parser 비교였다. 이를 동결17에서 실제 old paid를 text-only로 load→resolve→reader 한 결과로 보완했다. 최종 red71실패/42통과 → green113/113이다. 첫 metadata 적용 때 기존 crisis_hose 명시 민지 script와 새 script가 별도 키로 생겨 덮이는 4실패는 table-merge-failure.txt에 남겼고 기존 단일 owner에 새0.0을 합쳐 고쳤다. 1.0의 민지 두 발화는 그대로 보존했다.

비결함/범위 판정: exp_comicroom은 실제300분이라 반나절과 모순 아님. wx_worms/exp_chalkwall/exp_selfwash는 needsDog가 있어 보리 등장 근거가 있다. exp_selfwash는 van_named 조건도 있다. crisis_battery[1]의 태양광 ‘있다면’은 폐차 배터리 대안이 명시되어 장비 없는 실행 모순으로 세지 않는다. 현재 parser가 정상 서술로 처리한 닦자·소식벽 글씨 등 인라인 문구는 새 발화로 바꾸지 않았다.
