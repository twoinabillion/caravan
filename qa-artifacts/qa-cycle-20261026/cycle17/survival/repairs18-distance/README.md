# 18차 전 거리 조건 수선 — 정적 파생, 새 원정 아님

동결17 실제 엔진에서 영동(region north)에 서울까지208km가 남았는데도 ev_near_seoul_sign이 허용됐다. 이 사건은 ‘두 자리도 못 채운다’고 말하며, minParty1/region north 외 거리 제한이 없었다. G.eventLocation도 null인 일반 local/road 사건이다. 같은 계열인 vg_seoulline(maxRemain30), ev_highway_sign(maxRemain99)과 다른 누락으로 별도 판정했다.

root 승인으로 ev_near_seoul_sign에 maxRemain9만 추가했다. 기존 G.remainKm는 표시와 같은 반올림 km이므로9.01km는9로 보고 허용하고9.5km는10으로 보고 제외한다. 이 기존 거리 산식은 바꾸지 않았다. 새 진입은 영동208/도로34/10에서 막히고, 표기9/8/1km에서 허용된다. 조건 외 본문/효과/비용/확률/노트/index는 변경하지 않았다.

`src/04h-engine-presentation.js`의 기존 G.deferSkylineOpening만 이 사건에도 적용했다. 먼 옛 미지급 event/transition은 pending/chain을 해제해 도로로 복귀하고, 나중에9km 안쪽에서 다시 뽑힐 수 있다. 이 사건에는 완료 flag가 없으므로 **해당 사건의 미지급 receipt가 있을 때만** used 표식을 되돌린다. 이미 닫힌 paid 결과의 used 이력만 있으면 재추첨을 열지 않는다. seoul_seen은 기존 skyline에만 적용하며 sign에서는 읽어 완료를 추정하거나 값을 바꾸지 않는다. 다른 사건의 used/flags/notes/자원을 보존한다.

증거와 검사:

- `event-before.json`, `04h-before.js`: 거리 수선 직전 상태. 앞선 approved metadata/copy 수선이 포함된 별도 baseline이다.
- old-event/transition/paid0/paid1.json: 동결17의 실제 엔진으로 만든 진단 fixture. 정상 원정이나 추가 참가자 수가 아니다.
- `tests-before01.tap`:9개 중5실패4통과.
- `tests-after02.tap`:새9+기존 skyline5=14/14 통과. 먼 새진입/표시9경계, 가까운 새선택과 next road, 미지급 Continue/transition/explicit stale opening, old paid 두 choice의 reader/text-only와 중복지급 방지를 확인했다.
- `prior-contract-projection.tap`:기존24사건 전체정의 비교에 maxRemain9만 명시 투영한1검사 통과. 넓은 필드 무시는 없다.
- 첫 after 실행의9.01기대는 기존 G.remainKm 반올림을 반영하지 않은 테스트 오류였다. 도로에서 openEventById 후 바로 shown을 기대한 두 실패도 approach callback을 아직 실행하지 않은 fixture 오류였다. 새 코드를 추가하지 않고 기존 skyline 회귀와 같은 continuation presentation 경로로 다시 확인했다. 실패 로그는 그대로 보존했다.

정확 mechanics delta는 `mechanics-delta.json`; 기존 사용된 field/copy manifests와 별개다. 원정17의 source불변/자연3건 보고는 유지한다. 본 거리 결함은 정적 파생 추가1건이며, 생산소스 수정은 완료했다. 실제 브라우저/이미지 검수는 root 범위다.
