# 22차용 전파상·거창 폐극장 그림

21차 정상 원정에서 확정한 `S21-V01`, `S21-V02`용 전용 장면이다. root의 승인 후 built-in `image_gen.imagegen`으로 각각 한 번 생성했다. CLI/API 우회는 하지 않았다.

| 대상 | 배포 후보 | 크기 | 파일 크기 |
|---|---|---|---|
| exp_radioshop | `explore-radioshop-shelves-v1.webp` | 1024×576 sRGB WebP | 114,880 bytes |
| near_geochang_actor | `local-geochang-theatre-actor-v1.webp` | 1024×576 sRGB WebP | 53,796 bytes |

생성 마스터는 `masters/`에 원본 PNG 그대로 보존했다. 요청은 1536×864였지만 도구가 실제 반환한 크기는 둘 다 **1672×941**이다. 이를 변조 없이 보관하고 sharp의 centre cover resize로 1024×576, sRGB, WebP quality 86/effort 6으로 내보냈다. 정확한 해시·원본 경로·참조 해시는 `provenance.json`에 있다.

생성 전에 imagegen SKILL, IMAGE-BIBLE, visual-contract를 읽었고 canonical 4개를 실제 열어 봤다. 배우 장면은 `assets/portraits/passer_man.png`도 열고 다섯 번째 참조로 첨부했다. 공통 base와 negative 문구는 계약 그대로 사용했다. 정확한 프롬프트와 요청 내용은 각 `*-prompt.txt`, `*-request.json`에 보존했다.

생성 원본과 내보낸 두 WebP를 실제로 확인했다.

- 전파상: 낡은 라디오·개인용 카세트 플레이어·헤드폰·CRT TV가 먼지 낀 선반에 남아 있다. 사람·차량·외부 하늘·도시 랜드마크가 없고, 분해하거나 물건을 가져가는 동작도 없다. 선택 전 양쪽 분기에서 쓸 수 있다.
- 극장: 빈 객석, 마모된 낮은 무대와 커튼, 정장 차림의 중년 남자 한 명이 말하며 손짓하는 구도다. 다른 인물이나 관객, 박수·커튼콜·노래 동작이 없다. 배우 얼굴은 passer_man 참조와 맞는 짧은 머리와 나이대다. 무대 뒤의 산 그림은 실내 배경막이며 외부 풍경 창이 아니다.
- 두 그림 모두 과도한 만화/광택 스타일, 생성 자막·로고·프레임·UI, 명백한 손이나 인체 오류를 발견하지 못했다. 핵심 선반과 배우는 중앙 안전 영역에 있다.

이는 **원본·배포 파일 검수**다. `assets/scenes/` 복사, scene registry 연결, `/__live/assets` 갤러리, 480/360 실제 UI crop·선택·리로드 검수는 root 소유로 남긴다. 이 폴더 밖 생산 파일은 변경하지 않았다.

기존 정상 pre-reader 백업:

- `../story/agent03/attempt01/normal-unpaid-36-exp_radioshop.json`
- `../story/agent03/attempt01/normal-unpaid-152-near_geochang_actor.json`

둘 다 기존 view/reading을 지우거나 scene을 주입하지 않은 정상 export다.
