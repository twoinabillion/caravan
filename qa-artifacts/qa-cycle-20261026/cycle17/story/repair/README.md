# 18차 전 출발 방송 명료성 수선

17차 원정과 source snapshot은 그대로 보존했다. 부모 agent 승인 뒤 src/03i-story-expansion.js의 story_bridge_departure_echo 입장/선택0 결과 두 문장만 바꿨다. 차량 라디오와 혼동되는 수신기를 도로변 항만 중계 단말로 명시하고, 방송이 주파수와 발신 시각을 알려 기록하는 행동의 근거를 유지했다. 이름이 종이처럼 ‘내려가는’ 표현도 음성의 나열에 맞췄다. 본편의 내용과 선택 효과·15분/피로1·flag·순서·gate는 동일하다. 장비 명료성 개선이며 자연 발견된 수리 불능 오류로 합산하지 않는다.

root는 별도로 scene을 시간 중립 새 근접 그림 story-roadside-terminal-detail-v2로 연결했다. exact-delta.json은 본인 두 필드, exact-delta-with-root-scene.json은 root 시각 필드를 추가한 명세다. 테스트와 기계 계약은 새 scene 값을 정확히 assert한 뒤 그 필드만 옛 값으로 투영한다.

회귀 tests/test_qa_cycle17_story_departure.cjs: 동결17 red 5실패/4통과 → 현재 9/9통과. 수리 전후, 양선택 실제 지급, entry/paid reload, 옛 paid view/text-only, 효과 및 게이트 보존을 검사한다. fixture는 자연 횟수에 포함하지 않는다. 최초 테스트가 15분 경과의 자동 피로 0.675를 빠뜨린 실패도 post-copy-test-assumption-failure.txt에 보존했다. 해당 기대는 동결17에서 실제 효과를 기록해 비교하도록 보완했다. 의미 없는 생산 변경이나 실패 삭제는 없었다.

전체 담당자의 18차 전 수선을 exact 통합한 중간 검사는 final-all-team-integration.txt의 305/305다. 그 뒤 root의 마지막 한정 지시로 서울 표지판 이탈 단정 문구/거리 조건과 사진 두 사건을 수선했다. 마지막 관련 검사는 final-last-copy-focused.txt 61/61, final-distance-focused.txt 14/14이며 기존 305개를 재실행하지 않았다. 첫 집중 명령의 거리 테스트 파일명은 잘못 기재되어 Node가 포함하지 않았으므로 실제 tests/test_qa_cycle17_survival_distance.cjs와 기존 skyline 테스트를 별도 14개로 실행했다. 두 로그를 구분하며 합쳐 75개다. final-last-lint.txt는 오류 0, 기존 수동 후보 2개다. 전체 corpus 기준값은 유지했다.
