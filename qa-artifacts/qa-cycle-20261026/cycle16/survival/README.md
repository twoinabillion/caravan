# Cycle16 survival — seed276001

유한 자원 새 원정 1회를 강우·박 선생·은수와 core_quarantine(보존·공동 감시) 결말까지 완료했다. DAY13, 1191km. 재시도·중간 재개·자원 지급·사건 강제 호출·숨은 이동·RNG 밀기는 없었다. 기존 정책과 원문을 알고 덜 본 선택을 우선한 목표형 QA이며 블라인드 플레이라고 부르지 않는다.

- 110선택 / 601trace. 모든 사건의 진입 export 110개를 보존했다.
- 미지급 진입 110회 + 지급 결과 110회 reload. 실패·재지급·상태 변화·실제 reader 불일치 모두 0.
- 정상 영입 3명, 탐색 19회, 이동 33회, 거래 71회, 일거리 13회(고유 본문 11개), 좌석 증축 1회, 일반 대화 17회, 야영 대화 11회, 야영 식사·수리 각1회, 쇠파이프 제작 1회, NPC 대화 6회(인사/답변12개).
- trace289 영입 후속은 하룻밤 조건 미충족으로 false였다. 원본에 남겨 성공 행동에서 제외했다. trace415의 좌석 만석 알림은 직전 은수 합류의 지연 알림이며 거래 실패로 세지 않는다.
- 최저 식량3, 물10, 연료24.70. 고철0 이후 정상 일거리로 벌었다. 호송의 세 공개 선택은 진행했지만 독립 전술전투는 발생하지 않았다. 보리와 후속 사건은 미발생, 라디오 제어는 97회 관측 모두 비활성이어서 수리하지 못했다.

전편 읽기를 마쳤다. 110개 진입·선택·결과의 실제 reader, 109개 최종 노트, 짧은 발화 큐142개, NPC 인사/답변12개, 일거리와 알림을 전부 읽었다. 이전 정상 원정·정상 재개·과거 정상 저장 분기 trace61개와 비교해 91개 본문이 동일하고 19개가 달랐다. 처음 선택한 정규화 선택쌍은 talk_kw_19:1, talk_es_14:0, talk_es_19:1이다. 비교용61개를 독립 참가자 수로 세지 않는다.

새 확정은 1건이다. meet_bus[0]에서 받은 박 선생 노트가 냉장약을 ‘식기 전’에 옮기라고 써서, 장면의 ‘따뜻해지기 전에’와 반대가 된다. trace164와 최종 노트 원본, 최소 수선 제안은 findings.json/finding-evidence.json에 있다. 고쳐졌다고 주장하지 않으며 생산 소스는 이 검토 내내 읽기 전용이었다.

후보 thread-massacre-kangwoo는 주행 중 주인공이 잠자리를 펴는 마지막 줄을 큐에 넣었다. 실제 화면에 마지막 줄까지 표시됐다는 증거는 없으므로 후보로 남겼다. ‘수처럼 외웠던’은 15차 명료성 후보의 재관측이다. camp_scan의 새벽 표현은 실제 reader의 ‘지난밤 · 야영지’ 표식으로 과거를 가리켜 비결함으로 닫았다. talk_pss_04의 저녁 당번 설명도 현재 시각 단정이 아니므로 기존 판정을 유지했다.

읽기 자료는 attempt01/reader-full-review.txt, choices-compact.txt, notes-compact.txt, speech-compact.txt, supplemental.json이다. 실제 장면 키·기대 본문은 scene-index.md/scene-evidence.json, UI용 진입 저장은 entry-*-export.json이다. 이 에이전트는 그림의 게임 화면 crop을 직접 검수했다고 주장하지 않는다. 실제 이미지·브라우저 검수는 root 담당이다. 이번 원정 trace471의 사투리는 현재 강우·박 선생 역할과 서술 문단을 정상 표시했다.

runtime-start-attempt01.json, runtime-end-attempt01.json, review-end-hashes.json의 40src가 모두 cycle16 동결본과 같다. 엔진 LF hash는 1911ad89b75afe51e44e8c8856bd7d6b7a16f070c0d717214e5230be996df9ab. frozen engineFiles 순서의 UTF8 본문을 LF 하나로 연결하고 기존 끝 개행을 유지하며, 파일명은 넣지 않는다.

고래·와인 UI용 부분 재생은 별도 ../survival-entry-replay/에 있다. 그 raw summary와 trace.summary 모두 cohortExcluded:true여서 위 새 원정 수·선택·trace·reload 수에 포함하지 않았다.
