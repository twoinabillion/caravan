# Cycle 23 추가 두 장과 능선 울타리 정정

제작 및 자체 실파일 검수 완료. 최종 근거는 `provenance-arcade-bamboo-fence-final.json`이다. 소스·생산 assets·갤러리는 변경하지 않았다.

| 이벤트 | WebP | 크기 | 판정 |
| --- | --- | ---: | --- |
| exp_arcade | explore-arcade-airhockey-v1.webp | 109,096 B | 꺼진 오락기, 수동 에어하키를 겨루는 노인 두 명, 닫힌 인형뽑기. 첫 노인은 실제 passer_elder 초상에 맞춘 여성이고, 맞은편 남성은 별개의 익명 노인이다. 플레이어·동료·패배·사탕·인형 회수는 없다. |
| lc_damyang_juktong | local-bamboo-rice-fire-v1.webp | 139,060 B | 대숲 어귀의 작은 불과 익는 대나무 통. 인물·거래·받은 밥그릇·쪼갠 젓가락과 컵은 없다. |
| ev_uplink | story-ridge-uplink-dishes-v1.webp | 151,752 B | 기존 구도·수십 기 접시·관리 케이블은 유지하고 단지 울타리를 제거했다. 도로 가드레일만 남았다. |

세 원본 PNG와 변환된 최종 WebP를 각각 실제로 열어 확인했다. 정본 네 장과 계약 base/negative 전문을 유지했다. 오락실은 추가로 실제 `assets/portraits/passer_elder.png`를 참조했다. 원본은 1672×941이며 생성 원본과 바이트 동일하게 `masters/`에 보존했다. 배포본은 sharp 1024×576, sRGB, WebP quality 86, effort 6이다.

오락실 첫 생성은 인형뽑기 상단이 켜진 전등처럼 보였다. 수정 대상·정본 네 장·노인 초상은 여섯 장이라 도구의 다섯 경로 한도로 편집 호출이 거절됐다. 필수 참조를 생략하지 않고 정본 네 장+초상의 새 생성으로 전기 없는 조건을 명확히 했다. 첫 원본은 `masters/explore-arcade-airhockey-v1-attempt01.png`로 보존했고 실패한 호출과 재생성 이유는 프롬프트 기록에 남겼다.

능선의 앞선 자체 검수는 결과의 “울타리도 없다”를 놓쳤다. Root가 원문과 픽셀을 대조해 지적했으며 image_gen으로 철망·펜스를 제거했다. 이전 master/WebP는 `*-before-fence-removal.*`로 보존했다. `provenance-extra-three-final.json`의 능선 해시와 그 시점의 통과 판정은 이번 기록으로 대체한다. 캠프·케이블카의 파일과 해시는 그대로다.

`entry-outcome-art-review.json`에는 담당 일곱 장의 진입문·모든 선택 결과·노트와 그림의 대조 판단을 남겼다. 정적 본문-그림 검수이며 새 자연 원정으로 세지 않는다. 새 이미지에 플레이어 선택의 결과를 미리 넣지 않았는지도 포함한다. Root의 실제 갤러리·모바일 UI 자르기·사건 연결 검수는 별도다.

프롬프트: `prompts-arcade-bamboo.json`, `prompts-fence-and-arcade-corrections.json`, `prompt-arcade-attempt02.json`. 최종 파일 제작: `prepare-arcade-bamboo-fence.cjs`.
