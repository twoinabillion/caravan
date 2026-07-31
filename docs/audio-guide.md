# 서울까지 400km — BGM 제작 가이드 (v1)

> Suno/Udio 등 음악 생성 AI에 **프롬프트를 그대로 복붙**하면 되도록 작성.
> 완성 파일을 `~/Downloads/`에 **키이름.mp3**로 저장해두면 (예: `title.mp3`) 내가 base64 인라인 + 배선까지 전부 처리함 (초상화 파이프라인과 동일).

## 공통 사운드 정체성 (모든 트랙 프롬프트 앞에 붙이기)

```
lo-fi Korean indie game soundtrack, warm analog texture with subtle tape hiss,
acoustic instruments blended with soft synth pads and a hint of retro chiptune,
melancholic but warm, understated, cinematic pixel-art road trip mood,
instrumental, no vocals, seamless loop (no intro build-up, no fade-out ending)
```

- 정서 = 게임 팔레트의 음악 번역: **네이비(쓸쓸함) + 앰버(온기)**
- 국악기(대금·해금)는 **양념만** — tension 트랙에서만 살짝
- 보컬 금지 (노래는 별도: song-400km.md)

## 기술 스펙 (전 트랙 공통)

| 항목 | 값 | 비고 |
|---|---|---|
| 길이 | **60~90초 심리스 루프** | 시작·끝이 자연스럽게 이어져야 함. "seamless loop" 명시 |
| 포맷 | mp3, **96~128kbps** | 트랙당 ~0.7–1.2MB. 7트랙이면 HTML +5~8MB (허용 범위, 로딩 약간 느려짐) |
| 파일명 | `키이름.mp3` | 아래 표의 키 그대로 |
| 볼륨 | 마스터 -14 LUFS 근처면 무난 | 게임에서 0.5 볼륨으로 재생 + 크로스페이드 1.1초 |

## 트랙리스트 (핵심 7)

### 1. `title` — 타이틀 화면
달빛 아래 멈춰 선 봉고차. 여행 전의 고요.

> ✅ 적용 완료: **「파란 트럭의 밤」** (`assets/audio/title.mp3`). 3분 22초 완곡형이며 페이드아웃 뒤 한 번만 재생.

```
[공통] + slow tempo 68bpm, solo felt piano with distant synth pad,
sparse and spacious like an empty highway at night under the moon,
a single warm melody that feels like homesickness for a place you haven't reached yet
```

### 2. `drive_day` — 낮 주행 (가장 오래 듣는 트랙!)
국도, 창문 반쯤, 좋은 날씨. 게임의 기본 호흡.
```
[공통] + mid tempo 92bpm, fingerpicked acoustic guitar and soft rhodes,
gentle driving rhythm like wheels on an old highway, light brushed percussion,
hopeful but a little lonely, the feeling of moving forward through empty beautiful country
```

### 3. `drive_night` — 밤 주행
헤드라이트 두 줄기, 별, 낮은 목소리들.
```
[공통] + slow tempo 76bpm, warm sub bass, soft electric piano, airy pads,
tape-saturated, night highway under enormous stars, hushed and intimate,
occasional distant radio static texture
```

### 4. `tension` — 추적/위기 ("전투" 포지션)
천리안의 시선, 초계기, 검문. 싸움이 아니라 **관측당하는 긴장**.
```
[공통] + tense 100bpm, pulsing analog synth bass, sparse metallic percussion,
a cold clean arpeggio like surveillance machinery, subtle Korean haegeum single note bends,
restrained dread — polite menace, never chaotic, like being watched by something calm
```

### 5. `settlement` — 정착지 (시장/마을)
국밥 김, 흥정 소리, 사람의 온기.
```
[공통] + relaxed 84bpm, warm acoustic guitar, soft accordion or melodica,
small marketplace warmth, homely and a little nostalgic like an old Korean neighborhood,
gentle shuffle rhythm, smells like soup and firewood
```

### 6. `camp` — 야영/모닥불 (밤 정차)
모닥불, 담요, 기타 한 줄.
```
[공통] + very slow 62bpm, single nylon guitar by a campfire, faint crackle texture,
crickets-adjacent ambience implied by soft shaker, tender and safe,
the sound of people resting together at the end of a long day
```

### 7. `story` — 감정 스토리 장면 (+엔딩 화면)
동료 서사, 한강 다리, 남산 게이트. 마음이 무거워지는 순간.
```
[공통] + slow 70bpm, felt piano and warm string pad swelling gently,
emotional but restrained (no melodrama), a melody that resolves like a held breath released,
bittersweet — grief and gratitude at the same time
```

## 선택 트랙 (여유 있으면)

- `rain` — 비/폭풍 주행 변주: `[공통] + drive_day 구조에 rain-on-windshield 질감, darker pads, 88bpm`
- `gate` — 남산 코어용 (지금은 story가 대신함): `[공통] + vast, sacred-adjacent synth choir pads, sub bass, 60bpm, awe and dread`

## 게임 연동 (이미 배선 완료 — v1.7)

- `D.bgm` 슬롯 + BGM 매니저 탑재됨. 상황 자동 전환: 타이틀→title / 낮·밤 주행 / 추적·위기·천리안 이벤트→tension / 정착지→settlement / 밤 정차→camp / 스토리·엔딩→story. 크로스페이드 1.1초.
- 🔊 사운드 토글에 종속 (엔진음과 함께 켜지고 꺼짐). 슬롯이 비면 완전 무음 = 지금과 동일.
- **파일 도착 → 내가 하는 일**: base64 변환 → `03d-bgm.js` 파트 생성 → 빌드 → 용량·루프 이음새 확인.

## 전투 효과음 (Web Audio, 구현 완료)

외부 파일 없이 `src/07-ui.js`의 `SND.combat()`가 짧은 음을 합성한다. 단일 HTML·AIT에서도 추가 다운로드 없이 그대로 재생된다.

- 초계 스캔과 2음 경보
- 보행기 발걸음과 저역 충격
- 드론 로터
- 석궁 줄·볼트
- 소총 발사와 잔향
- 금속 레버·차체 충격
- 화염병 점화·연막
- 해킹 응답·도주 엔진

모든 효과음은 🔊 토글을 따르며, 큰 피해와 경보에는 짧은 화면 반응도 함께 붙는다. `prefers-reduced-motion` 환경에서는 화면 흔들림을 끈다.
