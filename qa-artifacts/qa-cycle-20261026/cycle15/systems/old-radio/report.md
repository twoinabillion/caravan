# 과거 정상 진공관 저장 continuation — cohortExcluded

원본 seed202009의 정상 DAY181 저장을 현재 동결 소스로 G.load→G.exportSave 했다. 원본에 trace2682 `exp_radiostation[0]`으로 얻은 진공관1이 있었다. 새 seed275002 획득·참가자·선택 수에 합산하지 않는다.

진공관1을 소모해 라디오를 고쳤고 40분이 경과했다. 첫 자연 방송은 DAY181 13:26, 청주→천안 14.43/38km에서 실제 tick→UI.playRadio→G.pickRadio로 나왔다. ‘다음 곡은, 조금 오래된 노래입니다…’ 방송으로 시간/동료 인과 충돌은 없었다. 첫 방송 전 entry1+paid1 reload를 보류한 뒤 재개했다. G.pickRadio를 추가 호출하거나 RNG를 조작하지 않았다.

23선택 / 124기록 / 공개행동55회, entry22+paid22 reload, 실패·중복정산0. 기존 민지·강우·재이와 DAY183 `core_quarantine → SESSION1END`까지 완료했다. 기존 ready 은수 영입은 최종 제안을 거절했으며 실제 동료로 세지 않았다.

UI 검수용 공식 세이브:

- [수리 직전](player02/attempt01/radio-before-repair-export.json)
- [수리 직후](player02/attempt01/radio-after-repair-export.json)
- [수리 후 첫 출발](player02/attempt01/radio-first-departure-export.json)
- [첫 자연 방송 진입 직전](player02/attempt01/first-natural-broadcast-entry-export.json)

새 reader52턴, 새 문단20개와 전체 선택·NPC·도로·잡담·방송·결말 검토 완료. 확정1건은 trace21 주행 중 바퀴 밖 점검을 하는 `daily-minji-kangwoo-check`의 상황 불일치다. 이미 열린 `comp_rps`의 점심 원문은 옛 pending entry를 보존한 것이며 새 발생으로 세지 않았다. 조끼 닦기는 차 안에서도 가능하고, 폭풍만으로 낮달 가시성의 절대 불가능을 추정하지 않았다.

원본 SHA와 migration 항목은 [lineage.json](lineage.json), 종료40source 일치는 [source-end-full.json](source-end-full.json)에 있다. 실제 음성 재생·브라우저 그림 검수는 root가 맡는다.
