# 대표 증거 색인

이 색인은 검토자가 빠르게 볼 화면 8장을 감사 폴더에 보존한다. 전체 15개 시나리오와 226개 색인 파일의 경로·SHA-256은 이 감사에 복사한 [`task8-final-evidence-index.json`](task8-final-evidence-index.json)에 있다. 대량 원본 410개 파일은 작업트리의 절대 경로 `/Users/sang/_workspace/caravan-director-20260911/artifacts/director-pass-2026-09-11/task8-final/`에만 두며 원본 프로젝트 전달 대상에는 넣지 않는다. 복사 전 출처·바이트·SHA-256은 [`captures/index.json`](captures/index.json)에 기록했다.

| 경험 | 대표 화면 | 무엇을 확인하는가 | 증거 성격 |
|---|---|---|---|
| 부산 첫 행동 | [첫 선택과 비용](captures/01-opening-choice.png) | 정상 속도 흐름의 첫 선택과 비용 | 실제 UI, 새 게임 |
| 출발 | [출발 결과](captures/02-opening-departure-result.png) | 다섯 번째 출발 장면의 선택 결과 | 실제 UI, 새 게임 |
| 임시 동행 야영 | [민지 야영 선택](captures/03-minji-camp-choice.png) | 민지의 요청된 첫 야영 선택 | 실제 UI, 새 게임 |
| 획득 체크포인트 | [서울 선택 대기 상태](captures/04-earned-checkpoint-decision.png) | 민지·강우·재이와 세 방식이 준비된 735km/12일 상태 | 실제 UI, 획득 체크포인트 |
| 시장 노선의 가족 기록 | [아버지 마지막 기록](captures/05-market-father-record.png) | 메인 증거와 가족 서사의 회수 | 실제 UI, 무지급 완주 |
| 서울 운영 방식 선택 | [세 방식 선택](captures/06-seoul-method-selection.png) | 준비 조건을 충족한 세 선택 | 실제 UI, 획득 체크포인트 |
| 선택 뒤 운영 결과 | [집행권 인계 밤 결과](captures/07-transfer-night-result.png) | 김해권·거점 도로·물의 우선순위 갈등과 느린 사람 간 합의의 비용 | 실제 UI, 체크포인트 분기 |
| 현재 사건의 종결 | [집행권 인계 종결](captures/08-transfer-ending.png) | 강제 이송 중단과 후속 질문의 경계 | 실제 UI, 체크포인트 분기 |

정본 장면과 좁은 화면의 더 넓은 비교는 [`audits/director-art-2026-09-11/`](../director-art-2026-09-11/README.md)에 있다. Task 5의 일곱 정착지 배치 전체는 `qa-artifacts/director-cities-2026-09-11/`, 선택·전투 화면은 `qa-artifacts/director-choice-consequences-2026-09-11/`, 출발 전후는 `qa-artifacts/director-opening-2026-09-11/`에 보존한다.

## 전체 증거 묶음

| 종류 | 범위 | 사용 방식 |
|---|---:|---|
| 최종 캠페인 | 15개 성공 시나리오, 입력 11,232행 | 해시 체인·소스·HTML·캡처 해시를 compact index에서 재검증 |
| 최종 이미지/일지 | PNG 223장 + 일지 3개 = 226개 | manifest에 적힌 모든 파일의 SHA-256 확인 |
| 정상 속도 영상 | 부산 출발 1개, 실제 획득 결말 1개 | 4초 대기를 포함한 스크립트 화면 기록; 사람의 플레이 시간 자료는 아님 |
| 실제 획득 저장본 | 101,104 bytes, SHA-256 `0d89072b6a2063c3aac4e2fe05cd294b63ad750ad8e24cc62ff516d300a5fdc4` | 동일한 준비 상태에서 세 결말 재현 |
| 진단 fixture | 역사 저장본 3개와 전용 상태 fixture | 마이그레이션·중간 상태·저장 회귀 확인; 최종 완주 수에 포함하지 않음 |
| 정적/회귀 검사 | 콘텐츠, 장면, 저장, pending, 오디오, 화면 | 데이터·참조·상태 복원·배치 계약 확인 |

브라우저에서 기록한 코어 공개는 37턴, 에필로그 도입은 10턴, 여섯 동료와 저장된 기억이 있는 방식별 밤 후속은 최대 29턴이었다. 이는 실제 UI의 턴 개수이며 사람의 읽기 시간이나 결말 만족도 측정값이 아니다.

## 저장·오디오 검증 범위 정정 — 2026-09-12

`reload-matrix`가 직접 실행한 새로고침은 출발 사건·출발 결과·이동의 3종이다. 나머지 19개 표기는 별도 검사 근거를 가리키며 캠페인 실행 수에 더하지 않는다. 일반 사건·저장된 영입 제안·서울 단계는 Task 7의 과거 pytest 결과, 야영의 대기·결과 복구는 `test_director_camp.py`와 `test_director_camp_ui.py`의 과거 직접 실행 결과다. 이 과거 검사를 최종 빌드에서 새로 실행했다고 주장하지 않는다.

최종 리뷰에서 `python3 tests/test_director_pending.py`는 테스트를 0개 실행한다는 기록 오류를 확인했다. 2026-09-12에 실제 pytest로 전투 오디오·결과 복구 테스트 2개를 실행해 **2 passed, 39 deselected**를 확인했다. 동결 HTML의 바이트와 SHA-256은 전후 동일했다. [명령·결과·해시](whole-review-fix/verification.json), [클래스별 소유자와 범위 정정](whole-review-fix/pending-owner-correction.json)을 보존한다. compact index는 이 정정을 적용하며, 원래 manifest·trace·reload 기록과 그 해시는 보존했다.

## 원본 최종 전달 — 2026-09-12

Task8 기능 캠페인의 HTML은 `1c560199…9d07`이다. 원본 전달 중 발견한 정차 콘솔 UI 수정 뒤 최종 HTML은 `b6e92207…fdb56`이며, 앞선 캠페인을 새 해시로 재분류하지 않았다. 새 원본4175에서 320×578·390×844·1440×900 각각의 실제 새 출발과 획득 저장본 집행권 인계 결말을 검증했다. 세 결과 새로고침은 실제 게임이 쓴 저장을 복구하고 다음 장면·완료·archive1로 이어졌다. [6개 시나리오·27장 캡처·해시](phase-b/ui-summary.json), [전체 원본 전달 영수증](phase-b/README.md).
