# 24차 준비: 즉시 결과 문구 2곳

23차 원정과 전편 검수 종료 뒤 Root 승인을 받아 `src/03-data.js`의 두 절만 수정했다. 생산 소스 편집은 종료했고 소유권을 해제했다.

- **자연 확정 S23-01**: `ev_eunsu_solo[1]`은 DAY11 06:30에서 시간이 흐르지 않는 결과다. 이후 질문이 사라졌다는 단정 대신 현재 질문에 은수가 표의 한 칸을 짚는다. 정상 선택 전 근거는 `../attempt01/entry-483-ev_eunsu_solo-export.json`, trace485다.
- **정적 명료성 S23-D01**: `comp_water_fight[1]`의 ‘결국 반 통이 남았다’를 ‘남은 물은 나눠 마시기로 했다’로 바꿨다. 물통과 수치 단위가 일치한다는 근거는 없으므로 자원 회계 결함이나 자연 발견으로 세지 않는다. 기존 두 짧은 발화와 모든 효과를 유지했다.

정확한 old/new/path는 `copy-delta.json`에 있다. 두 절을 old로 투영하면 03-data.js 전체가 frozen23과 바이트 일치한다. 조건·비용·화자·노트·선택 순서·다른 결과는 모두 그대로다. 계약 통합은 story 담당에게 전달했다.

`tests/test_qa_cycle23_survival_copy.cjs`: 최종 red **3실패/4통과**, green **7/7**. 실제 reader와 실제 `G.load`/`G.resolvePresentedChoice` 경로를 사용했다. 5개 전 결과의 옛 paid와 text-only 각5를 비교했으며 재지급은 없었다. 현재 변경 결과도 entry/paid reload, 시각·자원·기분·기록·화자를 비교했다. 물 0.5 부족 및 1/1.5/2 보유, 2/3인 재정렬 동료 경계를 포함한다.

Eunsu fixture는 보존한 정상 미지급 저장의 분기이고, 물 배급은 명시적으로 만든 정적 fixture다. 모두 `cohortExcluded:true`이며 새 원정·자연 선택수에 추가하지 않는다. 옛 paid 5개는 frozen23 엔진으로 새로 만든 비교 fixture이지 자연 플레이 시점의 raw paid 캡처라고 주장하지 않는다.

첫 준비의 export 반환형 오해, 첫 red의 기존 빈 chip class 정규화 비교 오류를 `fixture-corrections.json`에 구분했다. 최초 red 로그를 지우지 않았고, 수정된 동일 테스트의 최종 red가 문구 차이만 검출함을 보존했다.

마감 시점 LF engine hash는 `a2b3adf4dfc7e3fd2cc6f0e6ab19d7b3bcb9946e70247dbfaf57f2a0ac481820`. 파일별 40개 해시와 exact projection 결과는 `verification.json`에 있다. 이후 다른 담당자가 허용된 소스를 바꿀 수 있으므로 이 값은 해당 소유권 해제 시점 기록이다. 전체 suite/build와 브라우저 화면은 Root 담당이며 이 7개 검사를 그 범위로 주장하지 않는다.
