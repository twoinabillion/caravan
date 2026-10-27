# 15차 관측 뒤 16차용 수선

15차 자연 원정은 이미 core_transfer로 끝났으며 시작·종료·전편 검토 종료의 40개 src가 동결본과 일치했다. 원본 보고는 상위 README.md와 report-final.json, 원정은 attempt01/에 그대로 보존했다. 이 폴더는 그 이후 승인된 정적 파생 재현·수선·회귀이며 새 여정이나 자연 발견 수에 합산하지 않는다.

자연 확정 4건/3사건의 근거는 상위 finding-evidence.json이다. ev_comp_argument[2]는 40분에 며칠의 침묵을 확정하고 대장의 결정을 강우에게 배정했다. comp_dialect의 내부 동료 대화와 ev_cinema_film[2]의 주인공 약속은 외부인 ???로 표시됐다.

추가로 판정한 파생 5묶음은 다음과 같다.

- ev_comp_argument[1]도 시간 소모 0에 며칠의 침묵을 확정했다.
- 같은 사건의 [0]/[1] 결정 발화도 각각 강우/민지에게 잘못 배정됐다. [0]의 기존 민지 응답은 유지했다.
- ev_cinema_film[1]은 실제 G.eventAvailable을 통과한 10:00 선택이 11:10에 끝나면서 밤이었다고 말했다. 밤 조건을 새로 넣지 않고 ‘잊지 못할 시간’으로 바꿨다.
- root가 인접 원문에서 찾은 near_jinju_lantern[0]은 동료 한 명·보리 없음에도 등 다섯과 개 발자국 등을 단정했다. ‘우리가 만든 등들이’로 수선했다. 동료 0명은 기존 신규 진입 조건에서 계속 제외된다.
- 해당 등불 결과의 노인 대화는 외부인 ???, 주인공, 기록 매체로 뒤섞였다. 노인→주인공→노인의 실제 대화 역할을 명시했다.

생산 변경은 src/03-data.js의 네 사건뿐이다. 최종 exact delta는 metadata-delta-v2.json의 8개 turnSpeakers 필드, authored-turns-delta.json의 1개 authored turns 필드, copy-delta.json의 결과 문장 4개다. 기계 효과·시간·비용·조건·선택 순서·확률·노트는 동결15와 완전히 같다. metadata-delta.json은 첫 구현의 보존본이며 최종 계약에는 v2를 쓴다.

comp_dialect[0]의 ‘어디까지 알아듣나’는 새 발화가 아니라 문장 안의 주제 인용이다. 첫 구현의 빈 결과 turnSpeakers는 실제 reader에서 정상으로 읽혔지만 dialogue-lint가 따옴표 1개를 발화로 세어 거부했다. 전역 parser나 lint 예외를 만들지 않고 해당 결과의 원래 세 문단 전체를 authored narration turns에 그대로 넣었다. 이를 통해 새 entry 화자표가 결과에 상속되지 않고 원문 문단도 갈라지지 않는다.

검사: tests/test_qa_cycle15_survival_readers.cjs **34/34 통과**. 모든 entry 및 10개 결과, entry 화자 상속 방지, 사투리 4개 실제 roster, 말다툼 0/40분, 영화 낮/밤, 진주 등불 0/1/3명과 보리 없음/있음을 확인했다. Frozen15로 지급한 10개 결과와 등불 roster/dog 6변형의 총16개 receipt를 저장 독자 화면 및 구형 text-only 방식으로 각각 비교했다. 본문·기존 화자·노트·자원·지급 횟수 모두 유지된다. 동료0의 등불 receipt는 신규 발생 주장 없이, 이미 열린 옛 결과 복원 경계만 검사하는 합성 fixture다.

실패 증거도 남겼다. tests-red01.tap은 23실패/10통과였다. tests-green01.tap의 남은 1실패는 밤 21시 끼니의 식량1 소모를 테스트 기대가 빠뜨린 것으로, 생산 동작을 바꾸지 않고 20:00→21:10의 올바른 기대값으로 수정했다. tests-green02.tap은 33/33, 최종 tests-green03.tap은 34/34다. dialogue-lint01.log는 위 문구 인용 검사 실패, dialogue-lint02.log는 오류0·기존 반복어투 검토 후보2다. git diff --check도 통과했다. 전체 suite/build는 root 통합 검증 범위다.

before-events.json / before-reader.json / legacy/는 동결15 src snapshot으로 만든 진단 자료다. after-reader.json은 수선 후 실제 reader 함수의 출력이다. 이 합성 진단은 자연 원정의 추가 관측으로 세지 않는다. source.patch와 source-second.patch가 좁은 변경을 보존한다.

completion.json은 수선 후 공유 작업 트리의 40src/엔진 해시이며 16차 freeze 자체가 아니다. 기록 시 엔진 hash는 6cfe8ef507b874e18ba6a8ee80471c5e07c28743bb628e5af12816252e4fe8bf다. 파일명 없이 frozen engineFiles 순서의 UTF8 본문을 LF 하나로 연결하며 각 파일의 기존 끝 개행은 유지했다. 생산 편집을 종료했고, root의 새 동결 전에는 새 원정이나 고래·와인 entry 부분 재생을 실행하지 않는다.
