# 13차 발견의 reader 수선 — 원정 이후

root 승인 범위5사건만 `src/03-data.js`에 정밀 패치했다. 본문·효과·비용·확률·게이트·choice 순서는 불변이다. 소유 및 자연 근거는 상위 findings.json. 다른 담당자의 화자·short·scene 수선과 별도다.

- talk_jy_18 entry: jaeyi×3. entry 경로가 result에도 fallback되는 실제 parser 동작 때문에 양쪽 결과의 기존 역할을 명시했다(0: jaeyi,jaeyi,me,jaeyi,jaeyi,jaeyi / 1: jaeyi,me,jaeyi).
- talk_jy_03[0]: jaeyi×3.
- talkr_es_1[0]: eunsu,me,eunsu,eunsu.
- seoul_ruins[1]: eunsu,me,eunsu,eunsu,me,eunsu,eunsu.
- talkr_leo_3[0]: leo.

`cases.json` 정확7위치 metadata이며 계약 projection은 story가 전담한다. 신규 test는 실제 buildStoryTurns + 실제 choice payment/G.load/G.capturePresentationView를 사용한다. 서로 다른 party 순서, unpaid 재개, new paid 동등, 이전 paid frozen view, view 없는 text-only legacy, metadata를 제외한 전체 authored object 불변을 검사한다.

실패 증거 `tests-red01.tap`(5pass/9fail) → 최초 수정 후 `tests-green01.tap`(12pass/2fail, entry route가 결과의 주인공을 덮음) → `tests-result-leak-red01.tap`(결과 둘 다 검사 추가) → `tests-green02.tap` **16/16**. 기존 cycle12 survival reader29/29, dialogue lint 몰입 파괴0건(일반 수동 후보2), git diff --check 통과.

원본 `source-before.js`·`before-events.json`·최초5개 paid fixture/reader는 패치 전에 실제 엔진으로 저장했다. 추가 talk_jy_18[0] fixture는 보존한 pre-fix authored object를 isolated VM에 복원해 만든 것으로, 과거 자연 저장이나 패치 전 runtime snapshot이라고 주장하지 않는다(`extra-fixture-provenance.json`). 실제 자연 원정/분기 로그는 수정하지 않았다.

첫 apply_patch는 line 순서가 뒤바뀌어 검증 실패했으며 생산 변경 없이 종료됐다. `metadata-ordered.patch`와 `result-route-preservation.patch`가 실제 적용된 정밀 패치다. source-after.json은 동시 작업 중 수선 확인 시점의 hash이며 새 cohort freeze가 아니다.

## Entry 상속 전수 보강

root의 후속 요청으로 survival이12차 이후 entry 메타를 변경한 camp_visitor, near_geochang_actor, talk_bori_03, talk_mj_21, talk_jy_18의 **모든10결과**를 문맥과 실제 reader로 점검했다. jy18의 이미 잡은 문제 외 추가 오표시는 없었다. 아래5개 기존 미지정 결과를 현재와 같은 메타로 고정했다.

- camp_visitor[0].out[1]: [] (대사 없음)
- near_geochang_actor[0].out[0]: 연습 중인 배우 / passer_man, [1].out[0]: [] (대사 없음)
- talk_mj_21[0].out[0]: minji,minji, [1].out[0]: minji

이5개는 새로운 자연발견 건수가 아니라 기존 결과의 역할을 보호하는 변경이다. 전체 수선 범위는8사건·12메타 위치다. `entry-inheritance-cases.json`, `entry-sweep/`의 실제 수정 전 paid fixture 및 소스, `entry-sweep-metadata.patch`에 남겼다. entry route만 ['me']로 바꾼 독립성 검사가 수정 전25pass/3fail → 수정 후 **28/28**로 통과했다. 모든10분기의 결과·지급 복원과 metadata 외 본문/FX 불변을 검사했다. 기존12차 reader29/29, diffcheck도 다시 통과했다.

최종 병렬수선 중 `dialogue-lint02.log`는 타 담당 comp_nickname/comp_wordchain9건으로 실패했다. 이5개 추가메타는 해당 오류에 없지만 전체 lint 통과로 기재하지 않는다. root와 systems에 전달했으며 전체 통합 검증은 root가 담당한다. 최초 범위의 lint01 통과와 후속 통합시점의 lint02 실패를 모두 보존했다.
