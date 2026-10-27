# 동행 내부 발화 파생 감사 — 동결 17

이 검사는 새 여정이 아니다. `cycle17/source/src`의 실제 엔진/reader를 두 진단 roster에 로드한 `cohortExcluded:true` 정적 파생 검사다. 자연 원정의 3건과 story 원정의 `comp_hometown`은 각각 원래 보고에 그대로 남긴다.

- 추출 범위: `minParty > 0 || type === '동행'`, 개인/페어 대화 제외. `comp_cloudgame`은 systems 소유로 제외.
- 실제 parser 실행: 237 사건 × 2 roster = 474 entry, 966 outcome. 이름 있는 passer까지 포함한 105 사건이 1차 필터에 걸렸다.
- `speakerUncertain` 또는 `???` 97 사건의 entry와 모든 choice/outcome 본문을 직접 읽었다. type 동행 20개는 `internal-read-through.txt`, 나머지 77개는 `remaining-read-through.txt`다. 8개의 이름 있는 passer만인 사건, ???가 아닌 나머지 132 사건의 전체 문맥을 수동 전수 검토했다고 주장하지 않는다.
- 두 roster는 minji/leo/parkss, kangwoo/eunsu/jaeyi. 이는 화자 경로 검사이며 pool 가용성이나 정상 자연 진입 증거가 아니다. 예컨대 ev_group_feast는 최소6명이라 최초3인 reader 진단이 가용성을 입증하지 않는다. 담당자에게 실제6인 경계 검사를 요청했다.

동행 20개 중 3개는 이미 자연 발생 근거가 있는 comp_food_debate/wx_bigwash/comp_hometown이다. 나머지 17개는 내부 동료/나/라디오의 발화가 외부 행인으로 표시되는 파생 결함으로 판정했고 root가 7/5/5개로 분담했다. 현재 수선 소유는 root 메시지와 각 담당 보고를 따른다.

잔여 77개는 `additional-candidates.json`에 47 내부 역할 + 4 문서/인용 출처 + 14 명시 외부역할/플레이어 역전을 기록했다. 모든 후보에 원본 actual reader와 권장 경로가 있다. 권장 경로는 임의의 이름을 만들지 않는 제안이며, 각 담당자는 가용 roster, 전체 결과의 entry 상속, 인라인 문구, 명시된 외부 역할을 다시 확인해야 한다. 외부인이 실제 등장하고 역할 역전이 명확하지 않은 12개는 `excluded-candidates.json`에 제외 이유를 남겼다. 이름이 없는 사람이라는 사실만으로 결함으로 세지 않았다.

추가 본문 후보: `ev_temple_bell[0].out[1]`는20분인데 ‘며칠 뒤 …생존자 가족을 만났다’ 및 만남 note를 즉시 지급한다. 본문/FX 원문을 확인해 root에 별도 시간 인과 결함으로 보고했다. 이는 위65개 화자/매체 사건에 포함된 동일 사건이며, 자연 발견수에 추가하지 않는다. `comp_diary_read`의 DAY3 기억 전제는 story 담당이 별도 낮은확신 후보로 검토한다.

초기 `run01.log`는 reader setup의 누락된 speakerInfo 때문에 중단된 진단 harness 시도다. 실제 07 함수 의존성을 넣은 `run02.log`가 위 집계의 완료 실행이다. 게임 실패나 자연 원정 실패로 세지 않는다. 생산 소스에 전역 parser/fallback 변경은 하지 않았다.
