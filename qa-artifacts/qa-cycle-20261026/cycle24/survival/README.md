# Cycle 24 survival — seed 284001

정상 새 여정 1회로 민지·강우·박 선생을 영입하고 `core_transfer` 본편 엔딩까지 도달했다. 재시도·별도 재개·부분 재생은 없다. DAY 12 22:04, 이동 1,127km에서 종료했다. 이전 자료와 공개 조건을 알고 작성한 목표형 QA이며 블라인드 플레이가 아니다.

## 실행과 저장 연속성

| 항목 | 실제 기록 |
| --- | ---: |
| 선택 / 전체 trace | 119 / 619 |
| 공식 미지급 export / 실제 entry reload | 119 / 119 |
| 실제 paid reload | 119 |
| reload 실패 / 효과 재지급 / reader 불일치 | 0 / 0 / 0 |
| 생략한 entry / paid reload | 0 / 0 |
| 실패 API 행동 / 교환 거절 | 0 / 0 |

유한 자원과 공개 행동만 사용했다. 장소·동료·아이템·사건·조건 flag를 주입하지 않았다. 최저 식량 2, 물 16, 연료 약 21.47, 고철 15, 차체 82였다. 종료 시 식량·물 각각 24, 연료 약 46.28, 차체 100이며 동료 부상은 없었다. 원정은 실제 엔진·reader·NPC 함수를 사용하는 격리 VM에서 진행했다. 화면·오디오·타이머의 harness 대체가 있으므로 실제 브라우저 조작이나 모바일 화면 검증으로 세지 않는다. 이번 reload는 같은 버전의 실제 `G.load` 검사이며, 버전 간 legacy 회귀라는 주장은 하지 않는다.

원본은 [player52-trace.json](attempt01/player52-trace.json), [summary](attempt01/player52-summary.json), [final save](attempt01/player52-save.json), 개별 `entry-*-export.json`에 남겼다. [report-final.json](report-final.json)에 전체 집계를 보존했다.

## 전편 검토 범위

119개 사건의 entry·실제 선택 결과·선택지와 실제 reader 951줄, 노트 118개, 짧은 발화 142개, NPC 첫 인사 및 후속 12회, 출력 메시지를 전부 읽었다. [reader-full-review.txt](attempt01/reader-full-review.txt), [짧은 발화·NPC](attempt01/short-npc-compact.txt), [노트](attempt01/notes-compact.txt), [메시지](attempt01/messages-compact.txt)를 보존했다. 출력 한 번에서 잘린 사건 18–25는 별도로 다시 읽었다.

실제 선택된 scene key 97개가 고유 파일 96개로 연결됐다. 12칸짜리 contact sheet 8장을 모두 실제 열람했고, 의심 파일 4개는 전체 원본을 확대 열람했다. 범위와 경로·해시는 [image-review/review.json](image-review/review.json), [index.json](image-review/index.json)에 있다. contact sheet 검토와 원본 확대 검토를 구분하며 실제 게임 내 crop·브라우저 화면은 검증하지 않았다.

이전 82개 primary segment와 비교해 동일 본문 109개, 새롭거나 달라진 본문 10개, 동일 reader 101개였다. 새로 관측한 정규화 사건·선택 쌍은 `exp_greenhouse[1]`, `minji_toolbox[0]`, `ev_parking_evs[1]` 3개다. 실패 원정과 정상 재개는 이전 비교 자료에 포함하지만, 별도 제외 분기와 같은 seed 재검증은 primary에 합산하지 않았다. [text-comparison.json](text-comparison.json)을 참고한다.

## 발견과 후보

아래는 독립 판정이며 최종 수선 여부는 root 검토 대기다. 자연 본문·기계·화자 확정 오류는 이번 경로에서 0건이지만 그림 모순과 후보가 남으므로 무결점 보고가 아니다. 정확한 정상 checkpoint·상태·원본 파일 해시는 [findings-provisional.json](findings-provisional.json)에 있다.

| ID | 분류 | 근거와 판정 |
| --- | --- | --- |
| S24-V01 | 자연 그림 장소 불일치, 독립 확정 | `ev_parking_evs`, trace 506. 본문은 충전기에 연결된 전기차 주차장인데 실제 파일은 철로·열차·승강장이다. |
| S24-V02 | 자연 그림 상태 불일치, 독립 확정 | `seoul_ruins`, trace 591. 접근에 맞춰 초록으로 바뀌는 신호와 무정차 통과 본문에 빨간 신호등 여러 개가 그려져 있다. 주야간 분위기 문제와 구분했다. |
| S24-V03 | 자연 그림 중심 소품 불일치 후보 | `lc_daegu_makchang`, trace 146. 골목 숯불 포장마차 본문에 산길 가드레일 옆 일반 행상 그림이 나온다. 음식 수레·숯불·그릴·연기가 보이지 않는다. |
| S24-C01 | 자연 시각 명료성 후보 | `daily-minji-parkss-meal`, trace 414. DAY 9 08:54에 “점심 안 먹었지”와 현재 식지 않은 국·밥을 두고 말한다. 당일 점심은 이후 trace 416 12:00이다. 같은 짧은 말은 DAY 11 20:45에도 나왔다. 과거 회상 가능성과 구분하며 식량 계산 오류라고 주장하지 않는다. |
| S24-C02 | 익명 인물 명료성 후보, 동료 오류 미확정 | `exp_greenhouse`, trace 38. 동료·임시 승객 없이 진입했으나 작물 곁 익명 인물 둘이 있다. 미영입 정본 인물로 특정할 근거가 없고 현지 작업자 해석도 가능하다. |

기존 미수선 그림이 이번에 다시 나타난 `lc_daejeon_bakery`, `cleaners_recall`, `seoul_square`, `seoul_base`는 새 발견으로 세지 않았다. 22·23차 staged 그림은 아직 연결되지 않았다. 우편부 후속은 이번 원정에서 발생하지 않았고, 23차에 준비한 새 우편부 그림도 아직 staged 상태다.

별도 검토 후 닫은 후보와 이유는 [closed-candidates.json](closed-candidates.json)에 보존했다. 밤 야영 완료 뒤 아침 방문, 일반적인 과거 회상, 미술 프레임 밖 소품 부재, 결말의 밤·새벽 후일담을 새 시간·자원 결함으로 일괄 분류하지 않았다.

## 실제 사용 기능과 남은 범위

탐색 19회, 이동 시작 31회, 주행 단계 60회, 교환 66회, 좌석 업그레이드 1회, 야영 11회, 지역 일 9회, 영입 단계 6회와 실제 합류 3회, 일반 대화 20회, 야영 대화 10회, 획득한 특전 6회, 야영 식사·수리 각각 1회, 제작 1회를 실행했다. 제작 결과는 탄약 2개다. 호송 전술 사건 선택 3개는 있었으나 독립 전투 실행으로 세지 않는다. 동료별 장비 수동 장착이나 수리한 라디오 사용은 없었다.

사이드 미션은 밀양에서 광주로 가는 `세 마을의 무전 1/3 · 끊긴 중계소의 호출 장부` 1개를 수락했지만 완료하지 않았다. 영입과 본편을 우선하며 광주를 방문하지 않았고, 만료 없는 해당 미션은 엔딩에 활성 상태로 남았다. 완료·실패·만료로 잘못 세지 않는다.

박 선생은 정상 영입 뒤 개인 대화 `talk_pss_14`, `talk_pss_03`, `talk_pss_19`와 야영 4회에 등장했다. 야영 선택은 네 번 모두 0번이므로 다른 야영 분기는 이번에 미검증이다. `pss_list`는 DAY 12 06:30에 실제 특전으로 해금됐고, 이후 `pss_met`·`pss_absolved`는 얻지 못했다. `comp_pss_night`는 DAY 11 19:31에 기록된 director 입력 1회에 있었지만 breather 3/fade에서 출력이 비었다. `pss_daejeon`·`pss_forgive`는 늦은 해금 뒤 기록된 입력에 없었다. 이를 불가능 또는 엔진 버그라고 단정하지 않는다. [parkss-coverage.json](parkss-coverage.json)에 실제 노출 기회와 미도달을 구분했다.

보리·레오·은수는 영입하지 않았다. 보리 코·인식표·가족 후속의 이번 관측은 없다. 조건을 강제하거나 희귀 사건을 위해 무한 대기하지 않았다.

## 동결 동일성

시작, 원정 종료, 전편 검토 종료에서 생산 40개 파일 모두 cycle24 freeze와 일치했다. 차이 0개이며 생산 파일은 수정하지 않았다.

- 엔진 SHA-256: `cdfeba9d024198a5d0eba3b0a017a9a8ed5bf41c264c01b52f777497eeee00d6`
- 알고리즘: freeze의 `engineFiles` 순서대로 UTF-8 원문을 단일 LF로 연결한다. 원문 끝 개행을 유지하며 파일명은 넣지 않는다.
- 증거: [runtime-start](runtime-start-attempt01.json), [runtime-end](runtime-end-attempt01.json), [review-end](review-end-hashes.json).

전체 테스트·build와 실제 브라우저 검수는 root 소유의 별도 검증이다. 본 보고서는 해당 작업의 완료 여부를 대리 주장하지 않는다.
