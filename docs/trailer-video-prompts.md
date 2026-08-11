# 트레일러 영상 생성 프롬프트 (2026-08-07)

> **2026-08-11 정본 교체:** 이 문서 뒤쪽의 `blue truck` 표현은 모두 폐기됐다.
> 트레일러는 `assets/trailer/`의 교체된 캐논 프레임과
> [`visual-canon-2026-08-11.md`](visual-canon-2026-08-11.md)를 사용한다.

> **전략: img2video.** 게임 스틸을 첫 프레임으로 넣고 모션만 시킨다 —
> 스타일 일치와 달구지 연속성이 공짜로 보장된다. Veo/Kling/Runway/Sora 공통.
> 클립당 5~8초, 16:9, 모션은 한두 가지만.
>
> 받은 클립을 `trailer/gen/s1.mp4`~`s7.mp4`로 저장하면 기존 파이프라인
> (`trailer/build-trailer.sh`)의 켄 번즈 자리에 바꿔 끼워 재조립한다.
> 텍스트 카드·「부서진 고속도로」·비네트는 그대로 재사용.

## 공통 스타일 블록 (모든 프롬프트 앞에)

```
Korean post-apocalyptic road trip, melancholic and warm, detailed pixel-art
animation style (preserve the pixel aesthetic of the input image exactly),
restrained indigo-and-amber palette, practical warm light sources,
slow contemplative pacing, subtle ambient motion only.
No text, no logos, no watermark, no UI, no camera shake, no fast cuts.
16:9, cinematic.
```

모델이 픽셀아트를 뭉갤 경우: `pixel-art animation style` →
`painterly anime film still` 로 교체 (뭉개진 픽셀보다 회화가 낫다).

## 공통 네거티브

```
photorealistic, 3D render, glossy, oversaturated, fast motion, action,
zombies, gore, text overlays, watermark, style drift from input image
```

## 샷 리스트

| # | 입력 스틸 | 모션 요지 |
|---|---|---|
| S1 | `assets/scenes/grandfather-garage.jpg` | 느린 푸시인 · 밖의 비 · 램프 흔들림 · 렌치 한 동작 |
| S2 | `assets/scenes/route-mid-fork.jpg` | 우측 드리프트 · 능선 구름 · 안개 · 물통 묶는 한 사람 |
| S3 | `assets/scenes/muju-tunnel.jpg` | 중앙선 푸시인 · 촛불 수백 개 개별 깜빡임 · 연기 |
| S4 | `assets/scenes/leo-rooftop-song.jpg` | 느린 풀백 · 스트럼 · 랜턴 · 별 · 위성 불빛 |
| S5 | `assets/scenes/eunsu-last-shift.jpg` | 푸시인 · 페이더 한 번 · 초록 LED 점멸 · 문밖 비 |
| S6 | `assets/scenes/perimeter-walker.jpg` | 고정 · 초록 스캔빔 좌→우 한 번 · 먼지 · 머리 3도 틸트 |
| S7 | `assets/scenes/seoul-han.jpg` | 다리 따라 푸시인 · 수면 반짝임 · 붉은 타워 점멸 |
| S8 | (없음 — 먼저 codex로 후면 3/4 주행 스틸 생성 권장) | 북상 트래킹 · 테일라이트 |

**S6·S7이 심장이다** — 초록 스캔빔 한 번, 붉은 타워 점멸.

## 샷별 전체 프롬프트

### S1 정비소
```
Very slow push-in. Rain falls steadily outside the open garage door, harbor
lights shimmer on wet ground. The hanging work lamp sways almost imperceptibly.
The grandfather's arm makes one small wrench motion; the boy leans in slightly.
Pages of the open manual lift once in the breeze. Everything else stays still.
```

### S2 갈림길
```
Slow lateral drift right. Low clouds crawl over the ridgelines, thin mist
slides through the valley. The distant village lights flicker faintly.
One figure kneels and ties down a water jug; tarp edge flutters.
The blue truck itself does not move.
```

### S3 촛불 터널
```
Slow push-in down the tunnel's center line. Hundreds of hanging candle flames
flicker gently, all independently. Distant figures shift their weight, one
stirs a pot by a barrel fire, faint smoke rises. Warm light breathes.
```

### S4 옥상의 노래
```
Very slow pull-back. The guitarist on the caravan roof strums slowly, one
listener nods once. The lantern flame flickers; stars twinkle faintly;
a slow satellite-like light crosses the top of the frame. Night breeze
moves a cable slightly.
```

### S5 관제실
```
Slow push toward the operator. She slides one fader down and holds her
headphone with the other hand. Green indicator LED blinks in rhythm.
Through the doorway rain falls; the truck's headlights breathe slightly;
the child shifts his weight. Oscilloscope traces move on the monitors.
```

### S6 보행기 대치
```
Static camera, tense stillness. The walker machine's green scanning beam
sweeps slowly across the truck, left to right, once. Dust drifts through
the beam. A single spark flickers on the cracked asphalt. The walker's
head unit tilts three degrees. Nothing else moves.
```

### S7 남산의 밤 (피날레)
```
Slow push-in along the bridge toward the mountain. Bridge lamps shimmer
and reflect on the black river water. The red tower beacon on the mountain
blinks in a slow, regular pulse. Clouds drift almost imperceptibly.
The city stays dark and dead. This is the destination shot — hold the dread.
```

### S8 히어로 주행샷 (보너스, text→video)
```
[공통 스타일 블록] + A weathered blue Korean 1-ton cab-over truck with a
wooden living cabin on its bed, one small warm-lit window, drives away from
camera up a cracked empty highway at dusk, heading north through misty
mountains. Slow tracking shot from behind. Tail lights glow. The road is
endless and quiet.
```
