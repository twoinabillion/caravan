# 14차 종료 후 reader 수선과 파생 감사

기준은 `cycle14/source/src`의 실제 동결본이다. `setup.cjs`는 원래 격리 VM helper에 sourceRoot 인자만 추가한 QA 복사본이다. `audit.cjs`는 이 동결본의 민지·은수 개인대화48개 entry/74개 outcome을 모두 파싱했다. 테스트용 상태·강제 확률분기이므로 자연 원정으로 세지 않는다. 원문과 모든 배열은 `full-reader-audit-before.json`, 읽은 원고는 `audit-block-*.txt`에 있다.

자연 확정8개 reader 사건과 별도로 파생5개 개인대화 사건을 확인했다: `talk_mj_02`의 양쪽 결과는 민지 자신의 스쿠터 경험과 대장님 차를 말하면서 me로 바뀌었다. `talk_mj_18[1]`는 오빠를 혼낸 뒤 밥 먹겠다는 민지의 말과 주인공 질문이 교대로 뒤집혔다. `talk_es_10[0]`는 은수의 계획을 record로 바꾸고 뒤의 혼자냐는 질문도 역전했다. `talk_es_16[1]`의 관제사 설명, `talk_es_17[0]`의 관제실 경험이 me에게 배정됐다. 해당 원본은 `derived-findings.json`이다.

원인은 이어지는 같은 사람의 말을 교대 추론한 경우, 결과에 entry 화자표가 상속된 경우, 수첩/계획 주변의 문장을 기록으로 추론한 경우다. 공통 parser의 기존 계약을 바꾸지 않고 정확한 사건 메타데이터를 추가했다. 새 entry를 지정한 사건은 전체 선택·확률 결과에도 독립 경로를 주고 검사했다. 문경새재는 한 글자 답을 포함해 여섯 기록 조각을 authored turns로 구조화했다. 88.9 작업 중 오간 세 단어의 목록은 서술로 두고, 그 뒤 실제 대화는 은수·민지에게 정확히 배정했다.

비행장 전원 차단은 유도등이 꺼지는 동작만 서술하도록 바꿔 09:26/15:00/22:00/01:30 모두에서 성립한다. 생일 새 기록은 본문처럼 국을 끓이고 사탕을 초 대신 세운 내용이다. 원본문·시간·비용·확률·선택 순서·효과는 이 두 정확한 문구 예외 외에 모두 같다. 옛 paid view, text-only 결과와 성냥불/초콜릿으로 남은 옛 기록은 바꾸지 않았다.

`tests/test_qa_cycle14_story_readers.cjs`: 최초 red13/56통과,43실패 → 최종58/58통과. 48개 전체 개인대화의 비수선 출력과 원본문/효과도 비교했고, 민규 재회 전후에 바뀌는3개 결과도 현재/동결본 실제 parser를 대조했다. 최초 중간 수선의3실패는 `first-fix-failures.txt`에 보존했다. pair에 명시 경로를 주면 인라인 세 번째 인용도 파싱돼 슬롯이 추가로 필요했고, 비행장 fixture의 첫 load가 마이그레이션 flag를 만들었으므로 지급 전 load를 먼저 수행하도록 fixture를 수정했다. 전역엔진 결함이나 새 자연 실패로 세지 않는다.

정확 메타데이터 delta는 `exact-metadata-delta.json`. `tools/test-dialogue-register.cjs`는 새 모양을 개별 assert한 뒤 직전 값으로 투영한다. 문경 authored turns도 전체 해시를 개별 assert하고 기존 빈 형태로 투영했다. 생일 note 변경도 `tools/story-review-contract.cjs`에 개별 검증/투영했으며, 전체 corpus 기준 해시는 교체하지 않았다.

막창의 조리 역할, 민지 흉터 비유의 두 번째 말, 은수의 반말 약속은 처음에 명료성 후보로 분리했다. 최종 판정에서는 민지의 자기 손 설명 두 문장을 민지의 연속 발화로 명시했다. 이 한 사건은 명료성 개선이며 자연 확정 오류에 합산하지 않는다. 막창은 동료끼리 굽다가 사장이 마지막 말하는 흐름도 성립하고, 은수의 마지막 말은 나의 농담 뒤 둘이 웃는 흐름으로 성립하므로 두 건은 수정 불필요로 종결했다.

추가로 parent가 요청한 `pair_mj_*`/`pair_es_*` 전수 범위는10개 사건·10개 결과이며 모두 `pair_mj_*`다. 원문·실제 배열·기록은 `pair-reader-audit-before.json`에 보존했다. 자연 여정의 `pair_mj_es_1`과 중복되지 않는 파생 reader3사건(`pair_mj_kw_2`, `pair_mj_jy_1`, `pair_mj_jy_2`)의 명시된 역할을 고쳤다. `pair_mj_jy_1`의 첫 지분 질문은 누가 해도 성립하므로 기존 재이 배정을 유지했다. `pair_mj_es_2`에서 은수가 ‘최상’을 쓰고 지운 행동과 달리 새 기록에는 그 말이 남았으므로, 새 note만 몸과 연장을 챙기는 실제 내용으로 바꿨다. 기존 note와 paid 결과는 그대로 보존했다.

페어 확장 red57/67통과·10실패 → 최종68/68통과(`pair-red.txt`, `pair-green.txt`). 신규 자연 발견은 여전히 reader8+prose2이며, 추가 파생 감사는 개인reader5+페어reader3+페어note1로 별도 집계한다. 48개 개인대화74결과와10개 페어대화10결과 전체의 원본문·효과 및 비수선 actualreader도 동일성을 검사했다. 세 가지 명시 문구 예외는 비행장 결과, 생일 note, 기다림 페어 note다.

전체 팀의 마지막 페어5개까지 개별 새 값 assert와 이전 값 투영을 통합한 뒤, reader/pair·lint source·speaker validation·narrative context·기존 corpus 집중회귀327/327이 통과했다(`integration-final.txt`). 새 계약을 검증하기 위해 전체 기준 해시를 교체하지 않았다. `dialogue-lint-final.txt`는 기존 대사 샘플5803줄을 유지하고 오류0·수동 문장 시작 반복 후보2개를 기록한다. 이는 격리 회귀 검증이며 추가 자연 원정이나 실제 화면 검수로 집계하지 않는다.

마지막 명료성 판정 후 `talk_mj_19` entry의 두 발화를 민지로 명시하고, 양쪽 결과에는 기존 출력 그대로의 독립 화자표를 붙였다. 원본문·FX·확률·순서는 바꾸지 않았다. 동결14 소스에서 양쪽 옛 paid 결과와 text-only 읽기를 별도로 보존했다(`capture-clarity-before.cjs`, `before-clarity-events.json`). 명료성 회귀는 수정 전72/73통과·1실패(`clarity-red.txt`)에서 수정 후73/73통과했다. 강우05 반대 선택의 명료성 메타 한 곳도 exact projection에 추가한 최종 팀 집중회귀는 **332/332통과**(`integration-clarity-final.txt`), 최종 lint는 오류0·샘플5803줄 유지다(`dialogue-lint-clarity-final.txt`).
