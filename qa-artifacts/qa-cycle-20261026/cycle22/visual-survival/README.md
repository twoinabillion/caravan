# 23차용 신규 그림 · survival 소유 2개

`image_gen.imagegen` built-in 도구로 별도 1회씩 생성했다. `docs/IMAGE-BIBLE.md`, `assets/visual-contract.json`의 canonical4 레퍼런스와 base/negative 원문을 그대로 사용했다. 전체 프롬프트는 `prompts.json`, 최종 제작·변환 근거는 `provenance-v2.json`이다.

- `story-chunrian-lab-archive-v1.webp`: 무인 지하 기록실, 종이 파일/서랍과 먼지 쌓인 서버랙. 전원·신호·인물·선택 결과 없음. 1024×576 sRGB WebP 93,658 bytes.
- `explore-towtruck-depot-v1.webp`: 무인 차고지 안 견인차 6대, 벽지도·근무표·무전기 충전대. 인물·달구지·부품 수확·읽히는 글자 없음. 1024×576 sRGB WebP 149,874 bytes.

각 1672×941 생성 PNG 원본을 `masters/`에 바이트 그대로 복사하고, 도구가 저장한 `$CODEX_HOME/generated_images/...` 원본도 보존했다. sharp 중앙 cover 축소→sRGB→WebP quality86/effort6. 두 배포본을 실제 열어 주제/매체/금지요소를 확인했다. 360/480 실제 UI crop, 갤러리 검수와 source 연결·배포는 root 담당이다. 이 담당자는 src, 기존 assets, 갤러리를 수정하지 않았다.

`provenance.json`의 master 객체는 크기 정보이며 최종 v2에 `masterFile` 절대적이지 않은 저장소 경로를 보완했다. 원본 artifact는 덮지 않았다.
