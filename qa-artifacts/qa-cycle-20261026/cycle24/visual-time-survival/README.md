# 시간대 그림 4장 — QA 중단 시점 인계

사용자의 QA 중단 및 현재까지 기록·commit/push 요청에 따라 새 생성·원정·생산 수정을 멈췄다. 중단 전에 생성·export한 네 그림의 기존 파일 검수와 이 디렉터리의 기록만 마무리했다. **네 그림 모두 staged 상태이며 root 독립 검수, 갤러리, 실제 게임·기기 crop 검수는 아직 하지 않았다.** 생산 소스 연결과 assets 복사도 없다. commit/push는 root 담당이다.

| 사건 / 제안 키 | 최종 WebP | 크기 | SHA-256 |
| --- | --- | --- | --- |
| `seoul_ruins` / `seoul-ruins-green-day-v1` | [낮](delivery/seoul-ruins-green-day-v1.webp) | 1280×720 | `e6a96f440658c24a4ecaae8698de3b7d14aa774eb651a2f77b2c151b92cf63ae` |
| `seoul_ruins` / `seoul-ruins-green-night-v1` | [밤](delivery/seoul-ruins-green-night-v1.webp) | 1280×720 | `016ca691b7eaf8eb9cfff3cc40b242666802d92fe4b2be1431db7d788031ab0e` |
| `seoul_han` / `seoul-han-night-v1` | [한강 밤](delivery/seoul-han-night-v1.webp) | 1280×720 | `dfd1a3765a3b7321aa65a786836406fa571f62393ad98d47e821846096c398c2` |
| `story_bridge_last_quiet` / `event-vista-road-night-v1` | [마지막 고개 밤](delivery/event-vista-road-night-v1.webp) | 1024×576 | `29eda797b0528805d88f2c5a538d4f64072a04ff912dc446396aedcfa89d6d5f` |

[masters](masters/)의 동명 PNG 네 개는 각각 1672×941 생성 원본이다. `image_gen.imagegen`으로만 생성·편집했고 canonical 4개를 모든 요청에 포함했다. 낮 서울·한강은 기존 장소 이미지와 정본 4개, 밤 서울은 새 낮 master와 정본 4개를 참조했으며 고개는 정본 4개로 새로 생성했다. 인물과 달구지는 화면에 없으며 서울의 기존 청소 로봇은 남겼다. 모든 프롬프트에 visual contract의 base/negative를 그대로 넣었다. 네 요청은 각 첫 생성본을 채택했고 실패·재생성은 없었다.

[requests.json](requests.json), [ruins-night-request.json](ruins-night-request.json), [prompts](prompts/), [provenance.json](provenance.json)에 정확한 요청·참조·원본 경로·해시를 보존했다. `sharp` 중앙 cover로 16:9, sRGB, WebP quality86/effort6을 적용했다. [geometry-verification.json](geometry-verification.json)은 네 파일의 크기·색 공간·불투명·원본 동일성을 기록한다. 이미 있는 산출물을 덮어쓰지 않도록 export 스크립트는 재실행 시 거절한다.

사전 문맥 검토는 세 사건 entry와 모든 8개 outcome/노트/actual reader를 읽은 격리 fixture다([event-reader-review.json](event-reader-review.json)). 한강 우편부 미만남·만났으나 편지 없음·편지 보유와 마지막 고개 독행 분기도 구분했다. 새 원정이나 자연 도달 증거로 세지 않는다.

실제 파일 열람 범위는 기존 장소 원본 3개, 생성 원본 4개, 최종 WebP 4개, 360/480px 축소본 8개다. 축소본은 한 번의 큰 응답이 잘려 네 번에 나누어 다시 열었다. 서울 낮·밤은 도로 신호가 모두 초록이고, 밤의 작은 적색 항공 표지등은 도로 신호가 아니다. 같은 큰 구도를 유지하지만 픽셀 단위 동일한 낮·밤 쌍이라고 주장하지 않는다. 한강은 난간 라디오와 기존 표식만 보여 주고 편지·해도·군번줄 전달 결과를 앞서 그리지 않는다. 고개는 야간 도로와 서울만 보이며 인물·차량·선택 결과가 없다. 축소본에서도 이 핵심 내용이 보인다. [review.json](review.json)에 파일별 판정과 한계를 기록했다. **로컬 축소본 검수는 실제 모바일·브라우저 검수가 아니다.**

읽기 중 `seoul_ruins[2]`의 “얘, 사람 속은 자주 틀린대.”가 `passer_man/???`로 나오는 정적 후보를 root에게 전달했다. 현재 발화인지 하 여사 회상 인용인지 확정하지 않았으며 자연 결함으로 세거나 수정하지 않았다. 추가 조사는 중단 상태다.

[stop-checkpoint.json](stop-checkpoint.json)은 생산 소스 40개가 작업 전 [before.json](before.json)과 모두 같고 기존 장소 자산 3개도 불변임을 기록한다. 이 담당자는 생산 소스·자산·갤러리를 수정하지 않았다.

이전 [신규 그림 3장](../visual-survival/README.md)과 합쳐 다음 **7개가 모두 미연결·root/UI 미검증** 상태다. 이것은 앞서 root가 연결한 25개 매핑의 검증과 별개다.

- `../visual-survival/delivery/story-grandfather-envelope-detail-v1.webp`
- `../visual-survival/delivery/explore-ev-charging-parking-v1.webp`
- `../visual-survival/delivery/local-daegu-makchang-alley-v1.webp`
- `delivery/seoul-ruins-green-day-v1.webp`
- `delivery/seoul-ruins-green-night-v1.webp`
- `delivery/seoul-han-night-v1.webp`
- `delivery/event-vista-road-night-v1.webp`

각 폴더의 master·prompt·실패 초안·provenance·review를 그대로 보존했다. 중단 상태는 [stop-checkpoint.json](stop-checkpoint.json), 두 폴더의 파일 목록은 [file-list.json](file-list.json)에 있다. 향후 재개 시 root의 독립 이미지 검수, 실제 갤러리·게임 crop 확인, 시간대 선택 및 매핑 검증이 남아 있다. 지금 새 QA나 생성을 시작할 권한으로 해석하지 않는다.
