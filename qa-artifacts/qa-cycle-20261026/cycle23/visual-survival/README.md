# 우편부 후속 · 선택 전 장면

Root가 23차 자연 후속 장면의 동일 인물 불일치와 조기 편지 전달을 확인하여 `postman-again-bicycle-v1`을 새로 제작했다. 아직 production assets와 소스에 복사하거나 연결하지 않았다.

- 원본: `masters/postman-again-bicycle-v1.png` — 1672×941, 생성 master 그대로 보존.
- 배포 후보: `delivery/postman-again-bicycle-v1.webp` — 1024×576, sRGB, 99,282 bytes. sharp WebP quality86/effort6.
- 생성: built-in `image_gen.imagegen`. `prompt.txt`에 base/negative 원문을 그대로 포함하고 canonical4 + postman portrait 5개 참조를 첨부했다. 정확한 경로·해시는 `provenance.json`.

원본, 최종 WebP, 360/480px 축소본과 정본 초상을 직접 대조했다. 검은 머리·이마 고글·중년 얼굴·수염·검은 작업복/목도리·가방을 유지한다. 우편부 혼자 자전거 손잡이를 잡고 멈춰 돌아보며, 편지는 아직 닫힌 꾸러미와 가방에 있다. 플레이어·동료·개·달구지·남산·수신인·편지 전달은 그리지 않았다.

진입과 두 선택 결과 및 노트까지 대조했다. 수락해야 건네는 편지, 거절 후 북쪽으로 떠나는 행동을 미리 확정하지 않는다. 작은 후면 짐받이 꾸러미 외에 전면 바구니에도 닫힌 짐이 있으나 내용은 드러나지 않는다. 발은 프레임 밖이므로 발을 땅에 딛는 동작을 실제로 보았다고 주장하지 않는다. 핵심 얼굴과 양손은 360/480px에서도 읽힌다.

정량 검증은 `geometry-verification.json`, 자체 내용 검수는 `review.json`. 원래 `assets/scenes/postman-letter.webp`는 해시까지 그대로 보존했다. Root의 독립 원본 확인, 실제 갤러리와 게임 crop/zoom, 신규 진입/옛 저장 매핑은 아직 남아 있다. 현재 산출물은 그 검토에 사용할 준비본이다.
