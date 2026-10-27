# 새 이미지와 검수 상태

배포 규격으로 만든 파일은 **50개**다. 최초2개와 계속 요청 이후48개이며,24차 전편 마감 시점에는26개 연결/24개 대기였다. 이후25차 준비에서24개를 연결하여 **현재50개가 소스에 연결**돼 있다. 기존 레오 그림 재사용1곳은 신규 파일에 더하지 않는다. 생성 원본·기각된 초안·교체 전 자산은 보존했다.

파일 생성, 원본 이미지 검수, 실제 갤러리, production 매핑, 게임 사건 화면은 서로 다른 단계다. **50개 전체의 실제 게임 화면 검수가 끝났다는 뜻은 아니다.** 사용자 재연결 뒤 Chrome이 복구되어 [남은19개 갤러리](cycle24/live-gallery/review.json)를 root가 직접 확인했다. 기존5개 포함 준비24개 갤러리는24/24 완료했으며,25차에 연결한24개 사건의 실제 게임 crop·선택·복원 검수는 별도로 진행한다.

| 구분 | 신규 파일 | 현재 소스 연결 | 실제 검수 범위 |
| --- | ---: | --- | --- |
| 기존 목록, 최초2개 포함 | 21 | 연결됨 | 아래 개별 provenance 범위. 모든 파일에 동일한 갤러리·reload 검증을 했다고 합산하지 않음 |
| 21차 발견→22차 연결 | 5 | 연결됨 | 실제 갤러리5개, 사건 진입·결과·길 복귀5개. 극장만 실제 reload 추가 |
| 22차 발견→25차 연결 | 18 | 연결됨 | 원본·갤러리18개 확인, 실제 사건 화면 검수 별도 진행 |
| 23차 발견→25차 연결 | 6 | 연결됨 | 원본·갤러리6개 확인, 실제 사건 화면 검수 별도 진행 |
| 합계 | 50 | 연결50 | 최초2 + 계속 요청48; 실제 화면 완료 총수로 해석하지 않음 |

기존21개:

| 장면 | 새 자산 | 목적 | 제작·화면 근거 |
| --- | --- | --- | --- |
| 진료대 | [recruit-parkss-clinic-table-v3](../../assets/scenes/recruit-parkss-clinic-table-v3.webp) | 버스/발전기 대신 진료 물품과 작업대 | [근거](cycle1/story/image-provenance.json) |
| 등대 내부 | [lighthouse-lamp-room-v1](../../assets/scenes/lighthouse-lamp-room-v1.webp) | 비상등과 일지 점검 장소 | [근거](cycle2/story/image-provenance.json) |
| 양어장 | [explore-fishfarm-tanks-v1](../../assets/scenes/explore-fishfarm-tanks-v1.webp) | 저수지 대신 양식 수조 | [근거](cycle11/visual/provenance.json) |
| 유리온실 | [explore-glasshouse-tomatoes-v1](../../assets/scenes/explore-glasshouse-tomatoes-v1.webp) | 본문의 토마토 온실 | [근거](cycle11/visual/provenance.json) |
| 김치 저장고 | [explore-kimchi-coldstore-v1](../../assets/scenes/explore-kimchi-coldstore-v1.webp) | 공장 저온창고와 봉인 항아리 | [근거](cycle11/visual/provenance.json) |
| 지붕 위 밤손님 | [camp-roof-thief-v1](../../assets/scenes/camp-roof-thief-v1.webp) | 밤손님 사건을 보여 주는 전용 장면 | [근거](cycle11/visual/provenance.json) |
| 스님 초상 | [passer_monk](../../assets/portraits/passer_monk.webp) | 작업복 초상 대신 스님의 정체성 | [근거](cycle13/monk-portrait/provenance.json) |
| 울산 고래 | [local-ulsan-gray-whale-v1](../../assets/scenes/local-ulsan-gray-whale-v1.webp) | 해안의 고래 장면 | [근거](cycle15/visual/provenance.json) |
| 영동 와인 | [local-yeongdong-wine-cellar-v1](../../assets/scenes/local-yeongdong-wine-cellar-v1.webp) | 철도터널 와인 저장고 | [근거](cycle15/visual/provenance.json) |
| 밀양 얼음골 | [local-miryang-ice-crevice-v1](../../assets/scenes/local-miryang-ice-crevice-v1.webp) | 냉기 나오는 바위 틈 | [근거](cycle15/visual/provenance.json) |
| 빗물 저수조 | [explore-rainwater-cistern-v1](../../assets/scenes/explore-rainwater-cistern-v1.webp) | 사람 없는 저장조 탐색 | [근거](cycle15/visual/provenance.json) |
| 종자 창고 | [explore-seed-warehouse-v1](../../assets/scenes/explore-seed-warehouse-v1.webp) | 종자 보관 공간 | [근거](cycle16/visual/provenance.json) |
| 염전 | [local-salt-farmer-v1](../../assets/scenes/local-salt-farmer-v1.webp) | 염전의 현장 작업자 | [근거](cycle16/visual/provenance.json) |
| 외부 안내 단말 | [story-child-voice-terminal-v1](../../assets/scenes/story-child-voice-terminal-v1.webp) | 차량의 미수리 라디오와 외부 음성을 구분 | [근거](cycle16/visual/provenance.json) |
| 도로 지도 | [companion-road-atlas-v1](../../assets/scenes/companion-road-atlas-v1.webp) | 없는 동료나 켜진 라디오를 넣지 않은 지도 | [근거](cycle17/visual/provenance.json) |
| 창밖 구름 | [companion-window-clouds-v1](../../assets/scenes/companion-window-clouds-v1.webp) | 동행 인원과 무관한 구름 관찰 | [근거](cycle17/visual/provenance.json) |
| 차량 실내 | [companion-cabin-detail-v1](../../assets/scenes/companion-cabin-detail-v1.webp) | 부재 동료가 등장하지 않는 공통 장면 | [근거](cycle17/visual/provenance.json) |
| 단말 근접 장면 | [story-roadside-terminal-detail-v2](../../assets/scenes/story-roadside-terminal-detail-v2.webp) | 밤 장면에 낮 하늘이 보이지 않는 근접 컷 | [근거](cycle17/visual/provenance.json) |
| 인쇄소 | [explore-letterpress-detail-v1](../../assets/scenes/explore-letterpress-detail-v1.webp) | 무인 수동 활판 작업장 | [근거](cycle19/visual/provenance.json) |
| 들개의 밤 | [camp-stray-dogs-night-v1](../../assets/scenes/camp-stray-dogs-night-v1.webp) | 멧돼지 대신 야간의 들개 무리 | [근거](cycle19/visual/provenance.json) |
| 폐우체국 | [explore-postoffice-parcels-v1](../../assets/scenes/explore-postoffice-parcels-v1.webp) | 저수지 대신 미발송 소포와 편지 보관대 | [근거](cycle20/visual/provenance.json) |

개별 근거는 프롬프트·canonical 참조·원본·규격과 실제 화면 관측을 구분한다. 과거480px 화면 근거는 각 자산의 기록 범위에 한정한다. 360px 진단용 이미지 미리보기는 실제 게임360px·실물 기기 성능 검증이 아니다. 스님 초상은 별도1:1 규격이다.

21차에서 발견하여22차에 연결한 신규5개:

| 장면 | 새 자산 | 실제 갤러리 | 실제 게임 검수 |
| --- | --- | --- | --- |
| 전파상 선반 | [explore-radioshop-shelves-v1](../../assets/scenes/explore-radioshop-shelves-v1.webp) | [연결 전 확인](cycle21/visual-root/radioshop-gallery-before-wiring.png) | [진입](cycle21/visual-root/radioshop-entry-ui.png) · [결과](cycle21/visual-root/radioshop-result-ui.png) · 길 복귀 |
| 거창 야외극장 배우 | [local-geochang-theatre-actor-v1](../../assets/scenes/local-geochang-theatre-actor-v1.webp) | [연결 전 확인](cycle21/visual-root/theatre-gallery-before-wiring.png) | [진입](cycle21/visual-root/theatre-entry-ui.png) · [결과](cycle21/visual-root/theatre-result-ui.png) · 길 복귀 · [실제 reload](cycle21/visual-root/theatre-restored-ui.png) |
| 전복 화물차 | [explore-overturned-cargo-v1](../../assets/scenes/explore-overturned-cargo-v1.webp) | [연결 전 확인](cycle21/visual-root/overturned-gallery-before-wiring.png) | [진입](cycle21/visual-root/overturned-entry-ui.png) · [결과](cycle21/visual-root/overturned-result-ui.png) · 길 복귀 |
| 폐주유소 지하탱크 | [explore-gasstation-tank-v1](../../assets/scenes/explore-gasstation-tank-v1.webp) | [연결 전 확인](cycle21/visual-root/gasstation-gallery-before-wiring.png) | [진입](cycle21/visual-root/gasstation-entry-ui.png) · [결과](cycle21/visual-root/gasstation-result-ui.png) · 길 복귀 |
| 논산 훈련소 입구 | [local-nonsan-training-gate-v1](../../assets/scenes/local-nonsan-training-gate-v1.webp) | [연결 전 확인](cycle21/visual-root/nonsan-gallery-before-wiring.png) | [진입](cycle21/visual-root/nonsan-entry-ui.png) · [결과](cycle21/visual-root/nonsan-result-ui.png) · 길 복귀 |

위5개와 기존 cabin 재사용1곳의 실제480px 사건 검수 범위는 [21차 시각 검수 기록](cycle21/visual-review.json)에 있다. 극장을 제외한 사건의 reload 근거는 독립 엔진 회귀이며, 실제 브라우저 reload를 추가로 했다고 주장하지 않는다. `story_bridge_crew_question`의 기존 `companion-cabin-detail-v1` 재사용은 신규5개에 포함하지 않는다.

22차에 준비하고25차에 연결한 신규18개:

| 장면 | 준비된 새 자산 | 분류 | 실제 갤러리 | 게임 연결·사건 화면 |
| --- | --- | --- | --- | --- |
| 지하 연구소 기록실 | [story-chunrian-lab-archive-v1](../../assets/scenes/story-chunrian-lab-archive-v1.webp) | 장소·행동 불일치 수선 | [확인](cycle22/visual-root/lab-gallery-before-wiring.png) | 25차 연결 · 사건 화면 대기 |
| 견인차 차고지 | [explore-towtruck-depot-v1](../../assets/scenes/explore-towtruck-depot-v1.webp) | 장소·행동 불일치 수선 | [확인](cycle22/visual-root/towyard-gallery-before-wiring.png) | 25차 연결 · 사건 화면 대기 |
| 부산 건어물 리어카 | [local-busan-dried-fish-cart-v1](../../assets/scenes/local-busan-dried-fish-cart-v1.webp) | 장소·행동 불일치 수선 | [확인](cycle22/visual-root/dried-fish-gallery-before-wiring.png) | 25차 연결 · 사건 화면 대기 |
| 만화방 | [explore-comicbook-room-v1](../../assets/scenes/explore-comicbook-room-v1.webp) | 장소·행동 불일치 수선 | [확인](cycle22/visual-root/comicroom-gallery-before-wiring.png) | 25차 연결 · 사건 화면 대기 |
| 대전 빵집 셔터 | [local-daejeon-bakery-shutter-v1](../../assets/scenes/local-daejeon-bakery-shutter-v1.webp) | 명료성 개선 | [확인](cycle22/visual-root/bakery-gallery-before-wiring.png) | 25차 연결 · 사건 화면 대기 |
| 능선 위 접시 안테나 | [story-ridge-uplink-dishes-v1](../../assets/scenes/story-ridge-uplink-dishes-v1.webp) | 장소·행동 불일치 수선 | [복구 뒤 확인](cycle24/live-gallery/story-ridge-uplink-dishes-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 들판의 공중 탐조등 | [camp-field-searchlight-v1](../../assets/scenes/camp-field-searchlight-v1.webp) | 장소·행동 불일치 수선 | [복구 뒤 확인](cycle24/live-gallery/camp-field-searchlight-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 남산 케이블카와 계단 | [seoul-cablecar-stairs-v1](../../assets/scenes/seoul-cablecar-stairs-v1.webp) | 장소·행동 불일치 수선 | [복구 뒤 확인](cycle24/live-gallery/seoul-cablecar-stairs-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 폐 군 검문소 | [explore-abandoned-military-checkpoint-v1](../../assets/scenes/explore-abandoned-military-checkpoint-v1.webp) | 명료성 개선 | [복구 뒤 확인](cycle24/live-gallery/explore-abandoned-military-checkpoint-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 인간 회수조 | [event-human-retrieval-team-v1](../../assets/scenes/event-human-retrieval-team-v1.webp) | 장소·행동 불일치 수선 | [복구 뒤 확인](cycle24/live-gallery/event-human-retrieval-team-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 개관 못 한 도서관 | [local-sejong-unopened-library-v1](../../assets/scenes/local-sejong-unopened-library-v1.webp) | 장소·행동 불일치 수선 | [복구 뒤 확인](cycle24/live-gallery/local-sejong-unopened-library-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 절벽 폭포 | [vista-cliff-waterfall-v1](../../assets/scenes/vista-cliff-waterfall-v1.webp) | 장소·행동 불일치 수선 | [복구 뒤 확인](cycle24/live-gallery/vista-cliff-waterfall-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 폐 ATM의 지폐 | [event-abandoned-atm-cash-v1](../../assets/scenes/event-abandoned-atm-cash-v1.webp) | 장소·행동 불일치 수선 | [복구 뒤 확인](cycle24/live-gallery/event-abandoned-atm-cash-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 노인들의 에어하키 | [explore-arcade-airhockey-v1](../../assets/scenes/explore-arcade-airhockey-v1.webp) | 장소·행동 불일치 수선 | [복구 뒤 확인](cycle24/live-gallery/explore-arcade-airhockey-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 대나무 통밥 | [local-bamboo-rice-fire-v1](../../assets/scenes/local-bamboo-rice-fire-v1.webp) | 명료성 개선 | [복구 뒤 확인](cycle24/live-gallery/local-bamboo-rice-fire-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 폐교 급식실 | [explore-school-cafeteria-v1](../../assets/scenes/explore-school-cafeteria-v1.webp) | 명료성 개선 | [복구 뒤 확인](cycle24/live-gallery/explore-school-cafeteria-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 충주호 수몰 마을 | [local-chungju-receded-village-v1](../../assets/scenes/local-chungju-receded-village-v1.webp) | 명료성 개선 | [복구 뒤 확인](cycle24/live-gallery/local-chungju-receded-village-v1.jpg) | 25차 연결 · 사건 화면 대기 |
| 흰 옷이 놓인 빈 광장 | [seoul-empty-clothes-square-v1](../../assets/scenes/seoul-empty-clothes-square-v1.webp) | 명료성 개선 | [복구 뒤 확인](cycle24/live-gallery/seoul-empty-clothes-square-v1.jpg) | 25차 연결 · 사건 화면 대기 |

이18개의 생성·연결 전 검수는 [계획](cycle22/visual-plan.json)과 [원본·갤러리 상태 기록](cycle22/visual-review.json)에 근거한다. 기존 레오 시장 그림 재사용1곳까지 **19개 매핑 제안**을 QA VM에만 넣은 [독립 검사](cycle22/story/visual-sixteen-review/README.md)는 **224/224 통과**했다. 이는 당시의 **제안본 검사**이며 production 연결·실제 갤러리·게임 화면의 통과가 아니다. 뒤의25차 production284검사와 실제갤러리 완료는 별도 증거다. 옛 entry/paid 그림과 본문·FX 보존도 해당 격리 회귀 범위이며 정상 원정 수에 합산하지 않는다.


23차에 추가로 준비하고25차에 연결한 신규6개:

| 장면 | 새 자산 | 분류 | 실제 갤러리 | 게임 사건 화면 |
| --- | --- | --- | --- | --- |
| 참기름 방앗간 | [explore-sesame-mill-interior-v1](../../assets/scenes/explore-sesame-mill-interior-v1.webp) | 장소·인물 정합성 | [확인](cycle24/live-gallery/explore-sesame-mill-interior-v1.jpg) | 대기/진행 단계 |
| 자전거 우편부 재회 | [postman-again-bicycle-v1](../../assets/scenes/postman-again-bicycle-v1.webp) | 장소·인물 정합성 | [확인](cycle24/live-gallery/postman-again-bicycle-v1.jpg) | 대기/진행 단계 |
| 볼링장 | [explore-bowling-lanes-v1](../../assets/scenes/explore-bowling-lanes-v1.webp) | 장소·인물 정합성 | [확인](cycle24/live-gallery/explore-bowling-lanes-v1.jpg) | 대기/진행 단계 |
| 예식장 창고 | [explore-wedding-hall-storage-v1](../../assets/scenes/explore-wedding-hall-storage-v1.webp) | 장소·인물 정합성 | [확인](cycle24/live-gallery/explore-wedding-hall-storage-v1.jpg) | 대기/진행 단계 |
| 지붕 덮인 세대 연설 시장 | [story-generation-covered-market-v1](../../assets/scenes/story-generation-covered-market-v1.webp) | 시간감 중립 명료성 | [확인](cycle24/live-gallery/story-generation-covered-market-v1.jpg) | 대기/진행 단계 |
| 은수 소음 기록기 근접 장면 | [companion-noise-recorder-detail-v1](../../assets/scenes/companion-noise-recorder-detail-v1.webp) | 시간감 중립 명료성 | [확인](cycle24/live-gallery/companion-noise-recorder-detail-v1.jpg) | 대기/진행 단계 |

[6개 계획·원본·해시](cycle23/visual-plan.json)와 각 제작자의 독립 검수 근거를 유지한다. 앞선18개 대상224검사에 이6개까지 통과했다고 소급하지 않는다. 이후24새그림+기존레오1재사용을 합친25사건·61결과 [제안본284검사](cycle23/root/visual-twentyfive-review/README.md), [생산 연결 뒤284검사](cycle23/root/visual-twentyfive-review/PRODUCTION-RECHECK.md)가 각각 통과했다. production 검사 당시03g는 승인초안과 동일했고 본문/화자/효과·옛 entry/paid/text-only와 옛 단계컷이 보존됐다. 모든 fixture는 cohortExcluded이며 새 원정이 아니다. 실제 갤러리24/24와 실제 게임 사건 crop 검수는 구별한다.

변경 목록은 [선별 백업 기준 manifest](changes-current.json)로 확인한다. `update-change-manifest.py`는 작업 시작 시 선별 보관한 파일과 명시된 QA 테스트·fixture·50개 자산만 비교하며, 무관한 기존 수정이 섞이는 Git HEAD 비교를 쓰지 않는다. manifest의 `assetReview`는 연결/대기 및 갤러리·runtime 증거를 따로 기록한다.

![21차 실제 우체국 식품 소포 결과](cycle20/visual/postoffice-natural21-food-result-ui.png)
