# 12차 생존·동료 검수

## 정상 여정

seed **272001**, 새 여정 **1회**, 재시도·원정 재개 **0회**. DAY 13, 1,243km에서 민지·박 선생·레오와 보리가 함께 **core_quarantine / SESSION 1 END**에 도달했다. 선택 **128개**, trace **646개**다. 공개 자원과 정상 영입·이동만 사용했다. 제작 1회, NPC 잡담 7회, 야영 12회, 야영 대화 11회, 식사·정비 준비 각 1회, 좌석 확장 1회, 현지 일 10회를 실제 실행했다. 라디오는 102개 관측에서 보였으나 진공관 판매/보유가 없어 활성 0·실행 0이다.

모든 선택의 진입 전 reload **128회**와 지급 후 reload **128회**가 성공했다. 보상 재적용·before/after 상태 차이는 0이다. 이는 이번 새 여정에서 생성한 저장의 복원이며 실제 오래된 사용자 저장 재개는 아니다.

원정 시작·런타임·종료 engine hash는 `3439973021f1ddd282edf54a7c2505df545d368bd338741d4d913b91674a002a`, 종료 때 40개 src 전부 동결본과 일치했다. 해시는 동결 manifest의 16개 engine 파일을 UTF-8로 읽어 한 LF로 연결하며 파일명은 넣지 않고 원래 끝 개행은 유지한다. `baseline.json`, `end-hashes.json`, 원본 summary가 각각 증거다.

## 읽기 범위

128개 entry·선택지·선택 결과 전편, 토스트 전체, 짧은 `UI.speak` 59개, NPC 인사/잡담 14개를 읽었다. 이전 자연 여정/정상 재개/별도 C2 재검증 45개 trace와 대조하면 기존과 정확히 같은 entry/선택/result 조합 117행, 새 본문 11행이다. 새 날짜 정규화 선택쌍은 5개: `exp_icehouse:1`, `exp_mart:1`, `lc_daegu_makchang:1`, `talk_pss_04:0`, `talk_pss_12:1`.

정책 준비의 노출 횟수에는 이전 보조 재생 6개도 포함됐지만 위 신규 범위 비교와 코호트 집계에서는 제외했다. 출처를 알고 만든 목표형 QA이며 블라인드 플레이로 부르지 않는다. `attempt01/read-through.md`, `new-text-read-through.md`, `short-and-npc-read-through.md`, `messages-read-through.md`에 독서 대상을 보존했다.

장면 후보/컷 키는 102개다. `scene-evidence.json`에 각 entry/result 원문과 상태 및 실제 UI resolver가 반환한 키를, `scene-index.md`에 목록을 저장했다. 이들은 실제 브라우저 crop·그림 내용의 검수 증거가 아니다. 이미지 검수는 root 담당이다.

## 보리 공백

정식 레오·보리 합류는 trace 482, DAY 11 09:54였다. 코·인식표·가족 사건은 **모두 미발생**이다. 기본 eligibility true를 실제 뽑기 기회로 세지 않았다. 원정에서 관측한 `directEventPool` 호출 16회 중 8개 주행 결과가 비었고, 합류 이후의 5개 주행 pool도 모두 비었다. 인식표를 보지 못했으므로 가족 조건은 열리지 않았고, 정책의 태그 후 추가 정착지 탐색도 실행되지 않았다.

후속 진단에서 해당 5회 input에는 코·인식표가 모두 있었지만 `_eventBreather`가 2~3이어서 실제 주행 숨고르기 규칙이 output을 비웠음을 확인했다. 본편 사건이 잦고 영입이 늦은 이 경로의 실제 조건 공백이다. 현재 근거로 설계 오류라고 단정하지 않는다. 고정 난수 밀기, 강제 이벤트, 발견 무한 반복은 하지 않았다.

## 별도 reader 진단과 수선

본문 검토만으로는 화자 표시를 검수할 수 없으므로 root 요청에 따라 `transcript-replay/`에서 실제 `buildStoryTurns`, `speakerInfo`, 명시 화자표를 수집했다. 이는 **코호트 외 동일 seed 진단 재생**이다. 다른 담당자가 이미 수선을 시작한 현재 소스 `faa9a84b0237e954508cad473956bb621738d1e6e9697d6be852da16f7ebd170`에서 실행했으며, 원정 동결본 재생이라고 주장하지 않는다. 원본과 128개 choice의 observation/chosen/result/before/after는 전부 같았다. 짧은 발화 일부는 시간 gate 수선 때문에 달랐다.

이 진단에서 **11개 사건의 화자/기록물 메타 오류**를 확인하고 root 승인 후 수선했다. `findings.json`에 실제 reader turns, 자연 원문, 기대 route, 수정 상태를 담았다. 사건은 `camp_visitor`, `route_mid_fork`, `talk_mj_16`, `talk_mj_21`, `talk_mj_18`, `talk_bori_03`, `talk_pss_12`, `seoul_base[2]`, `lc_daejeon_bakery`, `gp_envelope`, `near_geochang_actor`다. 미영입 상태의 민지 첫 이름 `???`는 의도된 신원 미공개로 제외했다. 이름이 없는 다른 행인의 `???`만으로 오류를 단정하지 않았다.

`src/03-data.js`의 15개 `turnSpeakers` 메타만 바꿨다. 본문·효과·시간·확률·조건·선택 순서는 그대로다. 같은 원인인 반대 노선 결과와 모닥불 손님의 다른 결과도 좁게 보완했다. `talk_mj_18`은 본문에 이미 있던 “아니 그게 아니라” 인용도 실제 발화로 분리해 명시 화자 7개가 된다. 계약 projection은 story 담당이 통합한다.

`reader-fix/`에 수정 전 event/source, 실제 engine의 old paid 저장·읽기 배열, 정확 국소 patch와 테스트 로그를 보존했다. `tests/test_qa_cycle12_survival_readers.cjs`: 최초 **26 실패 / 2 통과 → 최종 29/29 통과**. 실제 reader, unpaid reload, 정식 `capturePresentationView` 후 paid replay, 이전 paid view 보존, text-only legacy의 새 화자표 미채택, 메타 외 완전 동일성을 검사한다. 추가한 legacy 검사 중 한 번은 view 없는 저장에 view의 시간 표식을 기대한 테스트 오류로 실패했고, 그 로그도 `tests-green02.tap`이라는 실행 당시 파일명 그대로 보존했다. 마지막 통과 로그는 `tests-green03.tap`다. 대사 lint도 통과했다.

다른 담당자와 겹친 `seoul_han` 우편부 녹음, `lc_busan_dried`, `exp_arcade`는 중복 보고로 분리했다. 진단 재생에만 새로 나온 민지의 대필 편지/19mm 왈츠 선행 기억 누락 2개는 별도 근거 `transcript-replay/diagnostic-only-callbacks.json`로 root와 systems에게 전달했다. 원래 12차 자연 발화에서 발생한 것으로 세지 않는다.

생산 수선 이후의 전체 통합 검사·최종 동결은 root가 담당한다. 이 원정은 전편 본문은 완주했으나 **reader 진단에서 신규 11건을 확인한 회차**이므로 clean 회차로 보고하지 않는다.
