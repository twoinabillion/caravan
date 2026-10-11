# Studio 소리 듣기

Studio의 `소리 듣기` 버튼 또는 현재 Studio 원점의 `/audio-review.html`에서 듣습니다.
게임 iframe, 저장, 스토리 진행과 별개이며 원본 클립 하나만 재생합니다.

카탈로그 재생성:

```sh
node tools/build-audio-auditions.mjs
```

`manifest.json`은 Studio가 `/game/tools/audio-auditions/manifest.json`으로 읽는
버전1 목록입니다. 생성 배치의 원본 메타데이터와 실제 MP3 길이를 가져옵니다.
117개는 생성50개(비교 후보 포함), 차 안 비 후처리2개, 기존 효과음23개,
음악7개, 목소리15개, 실제 전투/UI 신스 코드의 청취 렌더20개입니다.
117개의 서로 다른 게임 행동을 뜻하지 않습니다.
배포 HTML에 음원이나 청취 UI를 추가하지 않습니다.

- `preview`: 소스에서 로컬 게임 미리보기에 연결된 생성/후처리 음원37개
- `candidate`: 기존 미연결9개와 교체된 비/비교 테이크6개, 총15개
- `registered`: 기존 게임 오디오45개와 실제 신스 청취 렌더20개

새 목록은 `목록 새로고침`으로 읽습니다. `선명한`을 검색하면 게임 연결용
차 안 비v2 두 개를 찾습니다. 소스 연결과 현재 게임의 코드 적용은 다릅니다.
JS 변경은 Studio의 `새 코드 준비됨`을 명시적으로 적용해야 들립니다.
합성음20개의 MP3는 청취용이며 게임은 원래 WebAudio 코드를 계속 사용합니다.
`python3 tools/render-synth-auditions.py`로 실제 코드를 다시 렌더링합니다.
소스 SHA가 다르면 목록 생성기가 오래된 렌더를 거부합니다.

검사: `npm run test:audio`, `python3 tests/test_audio_mix.py`,
`node tools/check-audio-auditions.mjs --studio http://127.0.0.1:4327/ --preview http://127.0.0.1:4319/`.
마지막 명령은 이번 활성 원점 기준이며 다음 작업에서는 실제 포트를 다시 확인합니다.

Free 생성 음원은 로컬 비상업 시청용이고 상업 출시용이 아닙니다.
이 카탈로그는 청취 승인이나 출시 라이선스 승인을 기록하지 않습니다.
단독 청취는 실제 게임 믹스/타이밍 검수를 대체하지 않습니다.
