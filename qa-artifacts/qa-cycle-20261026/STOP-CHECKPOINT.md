# QA 중단·커밋 체크포인트 · 2026-10-27

사용자 요청으로 QA를 중단하고 현재 게임 수선·검사·다음 재개 지점을 보존한다. 마지막 완료 원정은 24차이며 25차의 새 원정은 시작하지 않았다. 무결함 완료 또는 배포 완료라는 뜻은 아니다.

- 누적 81회 새 시작 + 정상 저장 재개 4구간, 본편 엔딩 73회·갈증 엔딩 7회·고유 미완료 1회. 8,387선택·43,973기록. 진입 복원 8,386회·지급 결과 복원 8,382회, 관측된 복원 실패·재지급 0. 같은 seed 재시도/부분 검수/화면 fixture는 독립 참가자나 새 원정으로 부풀리지 않았다.
- 24차 마지막 세 원정은 서로 다른 동료·경로로 인계/공동감시/수면 엔딩에 도달했다. 전편 대사·노트·그림·결말 검토 완료. 360선택·1,949기록.
- 생존 시간·보급·제작·동료·저장 복원·임무 전달·대사 화자·시점/지리/소유물/스토리 연속성을 수선했다. 작업 전부터 있던 게임 수정도 보존한다.
- 이번 작업에서 새 이미지 50개를 게임에 연결했다. 25차의 새 연결은 새 그림 24개 + 기존 레오 컷 재사용 1개다. 연결 전 실제 갤러리24/24 및 25사건·61결과·284개 엔진 검사는 완료했다.
- 25차 실제 Chrome 480px 게임 검수는 **16/25**: 진입·선택0·결과·새로고침·길 복귀. presentation fixture이며 자연 원정/유한 자원 검증과 별개다. 남은9: ev_atm_cash, exp_arcade, lc_damyang_juktong, lc_chungju_lake, seoul_square, postman_again, story_generation_speech, talk_es_07, meet_hitchhiker.
- 최종 생산 검사 **2,242/2,242**, HTML·Toss AIT 로컬 빌드·quick 검증 통과. 새 장면을 연결한 뒤 전체 빌드도 다시 만들었다. 빌드는 설치/배포가 아니다. 기존 권장 패키지 용량 경고는 유지된다.
- 실제 360px/실물 휴대폰/청음/성능 전수 검증은 미완료다. 브라우저는 원래 QA 저장 가온·부산·DAY1 09:45·차체82%로 복원하고 새로고침 후 확인했다.

## 다음 재개 순서

1. 위 9개 실제 화면 검수를 마친다. `cycle23/root/visual-twentyfive-review/preview-manifest.json`, `cycle25/live/stop-review.json` 참고.
2. 마지막 좁은 후보3건을 재현·수선: 세종 도서관의 독립 ‘를 외쳤다.’ 문장조각, seoul_ruins[2] ‘얘, 사람 속은 자주 틀린대.’ 화자, seoul_base[0] ‘산 사람들이 안부 전하래.’ 화자. 모두 **미수선**이다. 자세한 근거는 `cycle25/story-stop-checkpoint.md`.
3. 미연결 그림 **17개**(일반8+시간별9)를 독립 검토하고 실제 갤러리→게임 crop 순으로 검수한다. 일반5만 assets에 복사됐으며 전체17의 소스 연결/root UI 검수는 아직이다. `cycle24/visual-{systems,survival,time-systems,time-survival}/`의 README와 provenance 참고.
4. 시간별 그림 기능은 `cycle24/story/time-scene-draft26/draft.patch`에 격리 보존했다. 8사건·9개 테스트표식, 05:30/19:30 경계·옛 저장 보호33/33. 실제 이미지 연결은 아니므로 전체 source 복사본을 생산에 덮어쓰지 않는다.
5. 위 수선 후 소스를 동결하고 가용 최대 subagent3명을 다시 서로 다른 동료·경로·선택으로 엔딩까지 실행한다.

## 보관 범위

저장소에는 생산 코드·WebP·영구 회귀와 그 실행에 필요한 QA fixture, 요약 기록, 미연결 배포 후보·초안 patch를 보관한다. 수 GB의 전체 원정 로그·중간 PNG 원본·실패 기록·빌드 산출물은 기존 로컬 `qa-artifacts/qa-cycle-20261026/` 및 작업 전 `_workspace` 백업에 그대로 남긴다. 따라서 과거 보고서의 일부 상대 링크는 로컬 보관 자료를 가리킨다. 필수 테스트 fixture 목록은 `cycle25/test-fixture-files.json`이다. HTML/AIT는 재생성 산출물로 Git에 넣지 않는다.

검증 상세: `cycle25/verification-at-stop.json`. 대표 실제 화면: `cycle25/live/lc_sejong_library-result.jpg`, `cycle25/live/seoul_base-result.jpg`, `cycle25/live/original-qa-restored-at-stop.jpg`.

## Git 전달 검증

선별한 Git index만 다른 경로에 꺼내 HTML 빌드와 전체 테스트를 실행했다. QA fixture 누락은 없었다. 초기2,210통과/15실패는 모두 기존 상위폴더에서만 찾던 미선언 `sharp` 의존성 때문이었다. `sharp@0.34.5`를 devDependency로 명시하고 해당12파일79검사를 재실행해79/79 통과했다. QA helper4곳의 사용자 절대경로도 checkout 상대경로로 수정했다. 이 검증은 설치된 의존성을 공유했으며 새 네트워크 설치 검증은 아니다. 과거 원문/스냅샷의 공백은 해시 보존을 위해 바꾸지 않았고 생산 코드·문서·도구·검사의 staged diff check는 통과했다.
