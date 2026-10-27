# Cycle 2 — 레오·은수와 대사/시스템 교차 QA

seed262001의 새 유한 자원 여정은 DAY7, 599km, 378로그·80선택 후 `core_transfer`, SESSION 1 END까지 완료됐다. 레오와 은수를 정상 영입했고 보리 구조, 임시 동행 때 야영 대화, 정식 영입, 서울에서 은수 판단, 레오 마지막 절과 실제 야영 기억을 읽었다. 민지는 이번 서부 경로에서 만나지 않았다.

[첫 여정 원본](attempt01/player31-trace.json)의 80개 진입/결과를 [전편 텍스트](attempt01/read-through.md)로 추출해 읽었다. 다음 발견은 실제 자연 여정, 인공 엔진/reader 증거, UI 한계를 구분한다.

## 발견과 수선

- **S2-01 / P2 / 존재하지 않는 민지 대여**: 자연 n287 `talk_leo_21` 선택0은 ‘민지한테 송곳을 두 번 빌렸다’고 했지만 이 여정은 밀양·민지 조우 없이 party[leo,eunsu]다. 송곳 자체는 같은 사건의 두 번째 분기에 이미 등장한다. 결과를 ‘송곳으로요. 한 번 삐뚤어져서 다시 새겼어요. 자세히 보지는 마세요.’로 고쳐 불필요한 대여자를 없앴다. 효과·선택·따옴표 수는 유지했다. 같은 seed [attempt02](attempt02/player31-trace.json)도 80선택·378로그로 완주하며 새 결과가 나오고 옛 결과는 지워지지 않는다. [대조](revalidation01.json).
- **S2-02 / P2 / 레오 화자 뒤바뀜**: 자연 원문을 읽은 뒤 실제 `buildStoryTurns`로 재현했다. `talk_leo_21` 결과0의 연속 레오 발언과 주인공 질문이 기본 교대 방식 때문에 뒤바뀐다. 명시 경로 `leo,leo,me,leo`를 추가했다. `talk_leo_14` 결과0 역시 첫 질문/대답/질문이 뒤바뀌어 `me,leo,me,leo,leo`로 고쳤다. `talk_leo_21` 결과1은 실제 지급→reader 경로에서 이미 맞았으므로 변경하지 않았다. 브라우저 말풍선/음성 확인은 아니다.
- **S2-03 / P3 / 미발생 대화·미래 습관 단정**: 자연 n291 `talk_es_03`은 선행 대화 gate 없이 ‘종류가 있다고 했잖아요’로 시작했다. 독립적인 현재 설명으로 바꿨다. n241 `talk_leo_14`와 n245 `talk_es_02`는 결과 즉시 ‘이후로 매번/가끔’의 행동을 단정했다. 현재 한 번의 연주/시험 무전으로 바꾸고, 레오 기록의 자동 연주 문구도 현재 관측으로 맞췄다. 콜사인 flag·기존 보상·선택은 유지한다. 과거 지급 원문과 기존 note는 로드 때 바꾸지 않는다.

`tests/test_qa_cycle_survival.cjs` 11개와 `tests/test_qa_cycle_companion_dialogue.cjs` 6개, 총17개 통과: [최신 검사](dialogue-green01.txt). [최초 대여 실패](tests-red01.txt), [대사/reader 실패](dialogue-red01.txt) 보존. 수선 전 테스트에서 Leo21 결과1과 레거시 지급 보존은 이미 통과했음을 기록한다.

동료 담당 교차검수에서 기존 부상 fixture가 배열이라 실제 driver 부상이 아니었다는 지적을 받았다. `G.addInjury('driver',...)`와 실제 `G.isInjured` assertion, 60분 각성40→43.24 대조로 바로잡았다. [교정 검사](tests-green02.txt). 이전 파일을 덮어쓰지 않았다.

## 다른 담당 수선 교차검수

[독립 실행](crosscheck-systems01.json)은 5그룹 중3통과·2실패다. 할인 제작 고철4.999/5/5.125 경계, 치료 도중 치명적 자정의 후속 부상 회복 차단, 라디오119.999/120/179.999/180/1439.999분 및 저장 재개는 통과했다.

새 **S2-04 / P2 / 라디오 수리 terminal 후처리**를 systems/root에 전달했다. 실제 `wireStopActionButtons`를 추출해 실행한 인공 fixture에서 수리40분 중 자정 종료 뒤 `AMBI.action('radio')`와 `renderAll()`이 계속 호출됐다. 이미 끝난 여정에서 캡처된 버튼을 다시 호출하면 진공관1→0, `radio_fixed` true로 live state가 바뀌었다. `G.fixRadio`의 시작 종료 guard와 버튼의 종료 후처리 guard가 빠져 있다. 실제 브라우저의 현재 클릭 가능성을 입증한 것은 아니며, engine 및 실제 callback의 경계 오류다. 이 코드는 systems 담당 소유라 이 보고 작성 시점에는 직접 수정하지 않았다.

## 범위와 빈칸

첫 여정 행동: 출발19, 탐색17, 야영6, 거래14, 좌석개조1, 동료만나기2, 영입2, 캠프대화 시도6(실제 대화4), 일반 대화16, earned perk4, 현장일2. 효과가 없는 시도도 그대로 기록한다. 미지급/기지급 저장재개80회씩을 포함한다.

attempt02는 같은 seed·정책 재검증이며 독립 신규 인원으로 세지 않는다. 대여 문구 수선 뒤 실행됐고, 뒤이어 추가한 화자/현재 시제 수선은 regression에서 확인했으며 source freeze 뒤 다음 원정 대상으로 남긴다. 별도 renderer/page/audio/mobile/브라우저 검수는 없다. 사용자의 Studio 화면/저장/서버는 변경하지 않았다. 기존 정책·보고·소스를 읽은 목표형 QA이며 블라인드 실험이 아니다. 자연 실행에 자원·아이템·위치·스토리 flag를 주입하지 않았다.

## root 실제 오프닝 관찰 후 추가 확인

**S2-05 / P2 / 작별 장면의 사본 소지 인과**: root가 실제 브라우저에서 발견한 후보를 `copy_receipt`와 `record_names` 양쪽의 실제 오프닝 선택→저장재개→계속하기로 재현했다. 복사 분기는 주인공이 사본을 접어 넣고 원본을 도윤에게 반환한다. 이름 기록 분기는 사본을 만들지 않는다. 그런데 새 작별 장면은 두 경우 모두 도윤이 사본을 주인공 조수석에 올렸다고 했다. 이름 분기는 생기지 않은 사본을 만들어 내는 확정 인과 오류이며, 복사 분기는 소지 이동 설명이 빠진 문제다.

현재 `D.openingFarewell`의 한 동작을 도윤이 자기 이름이 적힌 원본 이송표를 접어 품에 넣는 것으로 바꿨다. 분기별 선택·시간·기록·효과는 그대로다. 기존 legacy `D.intro`/`D.openingDeparture`의 정의를 바꾸거나 과거 저장 원문을 치환하지 않았다. 이전 문구를 넣은 인공 읽기 snapshot/cursor fixture의 저장·복원 검사도 통과했다. 이 fixture는 사용자나 root의 브라우저 저장을 가져온 것이 아니다.

**S2-06 / P3 / 고정 새벽 alt**: root 브라우저09:45 관찰과 별도로 긴 오프닝을 실제 진행한 뒤 `sceneFrameHtml`의 alt/aria-label이 여전히 ‘새벽’이라고 하는 것을 재현했다. canonical `intro-departure-conversation-v4.jpg`를 직접 열어 보니 흐린 비 오는 부두이며 일출 태양 등 특정 시간 증거는 없다. 이미지 파일은 그대로 두고 `src/03g-scenes.js` 설명의 ‘새벽’을 ‘장면’으로만 중립화했다. 해당 실제 화면 crop은 root 담당이며 여기서는 이미지와 실제 HTML 생성 함수를 검수했다.

[오프닝 실패](opening-red01.txt) 3실패/1정상, [수선 후](opening-green01.txt) 새4개+기존opening presence10개 총14/14 통과. 동료/survival17개와 별개다.

## S2-04 소유자 수선 독립 재검증

systems 담당이 종료 guard를 추가한 뒤 같은 독립 검사 [crosscheck-systems02.json](crosscheck-systems02.json)을 새 파일로 실행했다. 5그룹 모두 통과했다. 라디오 수리 중 fatal 이후 오디오/화면 완료 처리가 없고, 종료된 live state에서 이전 버튼을 다시 호출해도 진공관·flag·종료 archive가 바뀌지 않는다. 제작 소수 경계·치료 fatal·라디오 시간/save-load도 함께 재확인했다. 01의 두 실패 원본은 보존했으며 report.json의 당시 대기 상태는 이 재검증으로 해소됐다.
