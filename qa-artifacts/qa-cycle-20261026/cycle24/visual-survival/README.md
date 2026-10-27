# 26차용 생존 담당 신규 그림 3장 — staged

root가 승인한 `gp_envelope`, `ev_parking_evs`, `lc_daegu_makchang`의 새 그림을 만들었다. 모두 **root 독립 검수·실제 갤러리·게임 crop 확인 대기** 상태다. 생산 이미지 복사·소스 매핑·갤러리 조작은 하지 않았다. 새 원정도 없다.

| 사건 / 제안 키 | 배포본 | SHA-256 |
| --- | --- | --- |
| `gp_envelope` / `story-grandfather-envelope-detail-v1` | [WebP](delivery/story-grandfather-envelope-detail-v1.webp), 122,330 bytes | `3d8dc1fe332540cf6036f791ec5d4e721f553dc4f3365173d20c40c46ce278d0` |
| `ev_parking_evs` / `explore-ev-charging-parking-v1` | [WebP](delivery/explore-ev-charging-parking-v1.webp), 145,466 bytes | `6d437b63b66ecfb879fa863ae8f39d07474e6176c8828577cb6353f5e27a85ed` |
| `lc_daegu_makchang` / `local-daegu-makchang-alley-v1` | [WebP](delivery/local-daegu-makchang-alley-v1.webp), 129,670 bytes | `e5a069a991df48abfeae37b9d7847cfa16220cca5265cc0ae6a4a006b6ba1ef8` |

세 최종 master는 [masters](masters/)의 동명 PNG이며 각각 1672×941이다. `sharp`로 중앙 16:9 크롭·1024×576 축소·sRGB·WebP quality86/effort6 배포본을 만들었다. 크기·format·색 공간·불투명·참조 해시는 [geometry-verification.json](geometry-verification.json)에 있다.

내장 **`image_gen.imagegen`**만 사용했다. canonical 4개를 매번 참조했고 사장님은 실제 화자 `passer_woman`의 초상을 다섯 번째 참조로 붙였다. `assets/visual-contract.json`의 base/negative는 모든 프롬프트에 그대로 포함했다. [requests.json](requests.json), [prompts](prompts/), [provenance.json](provenance.json)에 정확한 프롬프트·원본 경로·해시·수정 이력을 남겼다.

생성 전에 세 사건의 entry·모든 7개 결과·노트·실제 reader 화자를 읽었다([event-reader-review.json](event-reader-review.json)). 봉투는 닫힌 수첩 뒤의 미개봉 물건으로, EV 장면은 연결된 충전선과 주차된 차의 배열로, 막창은 골목 숯불과 사장님 한 사람으로 표현했다. 결과를 미리 보여 주는 편지 내용·배터리 회수·식사 완료·대금 수수는 없다.

실제로 열람한 범위는 canonical4+사장님 초상, 생성 원본 7개, 최종 배포본 3개, 360px·480px 축소본 6개다. 봉투의 핵심 물건, EV의 충전기/연결선, 사장님 얼굴·손·그릴이 작은 폭에서도 보인다. [review.json](review.json)에 세 그림의 내용·인물·장소·선택 전 시점·한계를 별도로 기록했다. 이 파일 검토는 실제 브라우저나 모바일 crop 검수가 아니다.

EV 초안의 남산타워·상표 흔적은 자체 검수에서 찾아 imagegen edit로 제거했다. 막창 초안 뒤편의 익명 인물은 정본 5참조를 유지한 새 생성으로 없앴다. 폐기 초안 4개와 선택 원본 3개를 모두 보존했다. 편집 입력 참조 6개 제한과 잘못 전달한 내부 `key` 필드는 생성 전 도구 검증에서 거절됐고 이미지가 생성되지 않았다. 두 실패와 재요청은 [tool-validation-failures.json](tool-validation-failures.json)에 정직하게 남겼다.

[source-context-verification.json](source-context-verification.json)은 작업 전후 세 사건·7결과의 본문/효과/actual reader 불변과 새 키 3개가 아직 미연결임을 확인한다. 해당 검증 시 생산 파일 변화도 0개였다. 기존 원본 자산은 그대로 두었으며 이 담당자의 모든 산출물은 이 QA 디렉터리에만 있다.
