# ElevenLabs 복붙 시트 — 서울까지 400km

> **사용법 (3단계)**
> 1. **Voices → Voice Design**: 아래 [보이스 프롬프트]를 복붙 + [프리뷰 텍스트]를 Text to preview에 복붙 → 셋 중 제일 좋은 걸 저장
> 2. **Text to Speech**: 저장한 보이스로 [대사 목록]을 한 줄씩 생성 → **파일명을 키이름.mp3로** 저장
> 3. (선택) **Sound Effects**: 맨 아래 [배경음 SFX] 프롬프트로 배경 생성 → `sfx_*.mp3`
>
> **원칙: 보이스는 목소리만, 배경은 SFX로 따로.** (ElevenLabs 공식 가이드가 보이스 프롬프트에 reverb/tape/echo 같은 FX 단어 넣지 말라고 함 — 품질 깨짐. 믹싱은 내가 함. 목소리만 던져줘도 됨!)

---

## 화자 1. 인트로 앙상블 — 14장·화자별 턴

> [!important]
> 예전 `intro1`~`intro5` 장문 대본은 폐기했다. 그 대본은 현재의 14장 빌드업, 부모의 인간 확인층, 6,412명 이송, 엄마의 유품에서 찾은 현재 명령과 주인공의 자발적 출발 이유에 맞지 않는다. 아래 음색은 유지하되 실제 생성 문장은 `src/03-data.js`의 `introBeats`를 한 턴씩 그대로 사용한다.

**현재 주인공·내레이션 보이스 프롬프트:**
```
Native Korean. Male, mid 20s. Good audio quality. Persona: an ordinary young Korean guy quietly telling his own story, not a professional narrator. Emotion: calm, wistful, a little tired but resolved. Low, warm, natural timbre with a slightly husky edge and soft audible breaths. Relaxed conversational pace, like talking to a close friend late at night. Small pauses mid-sentence, understated and sincere, never theatrical.
```
**Guidance Scale: 30%**

**추가 화자**

- 어린 나: 자연스러운 8살 아이. 귀엽게 꾸미지 않고 질문의 속도를 살린다.
- 할아버지: 노년 남성, 낮고 느린 목소리. 경상도 억양은 아주 약하게만.
- 엄마: 30–40대 여성 연구원. 차분하지만 마지막 인사에서만 숨이 흔들린다.
- 아빠: 30–40대 남성 기술자. 짧고 정확하며 설교조가 아니다.
- 천리안: 아래 화자 2와 동일한 음색.

**생성 단위**

- 파일 하나 = 화면에 보이는 한 턴 = 화자 한 명.
- 파일명은 `intro_<scene>_<turn>_<speaker>.mp3`.
- 인용문을 주인공이 대신 읽지 않는다.
- 내레이션 턴에 다른 인물 대사를 섞지 않는다.
- 게임에는 대사와 정확히 일치하는 파일만 명시적으로 연결한다.

---

## 화자 2. 천리안 (13줄 + 라디오 공지 1)

**보이스 프롬프트:**
```
Native Korean. Gender-ambiguous, ageless. Studio quality.
Persona: automated national control system, impossibly polite.
Emotion: serene, standardized courtesy, subtly unsettling.
Perfectly even, smooth mid-pitched timbre with zero emotional variance.
Speaks slightly slower than a human customer service agent, every sentence
ending with a calm downward intonation. Flawlessly clean, clinical delivery.
```
**Guidance Scale: 40%** (톤 정확도가 생명)

**프리뷰 텍스트:**
```
안녕하십니까. 정기 현황 파악 중입니다. 탑승 인원을 확인해도 되겠습니까. 협조에 감사드립니다. 목적지에서 뵙겠습니다.
```

**TTS 대사:**

| 파일명 | 대사 |
|---|---|
| `cheollian_01` | 수고하셨습니다. |
| `cheollian_02` | 금일 수확량이 기록되었습니다. |
| `cheollian_03` | 안녕하십니까. 정기 현황 파악 중입니다. 탑승 인원을 확인해도 되겠습니까. |
| `cheollian_04` | 협조에 감사드립니다. |
| `cheollian_05` | 결제 수단을 제시해 주십시오. |
| `cheollian_06` | 승인되었습니다. 주유를 시작합니다. |
| `cheollian_07` | 다음에 또 방문해 주십시오. |
| `cheollian_08` | 적하 목록을 확인합니다. |
| `cheollian_09` | 모두 실으셨습니까? |
| `cheollian_10` | 그 질문을 확인했습니다. |
| `cheollian_11` | 목적지에서 뵙겠습니다. |
| `cheollian_12` | 안전 운행 하십시오. |
| `cheollian_13` | 아직입니다. 전부 싣고 오세요. |
| `cheollian_14` | 좋은 아침입니다. *(현재 미사용 예비)* |
| `radio_cheollian` | …정기 안내 방송입니다. 이동 중인 시민께서는 안전한 경로를 이용하시기 바랍니다. 좋은 하루 되십시오. |

---

## 화자 3. 할아버지 (6줄)

**보이스 프롬프트:**
```
Native Korean with a slight southeastern Korean regional intonation.
Elderly man in his 70s. Good quality.
Persona: old van mechanic leaving words for his grandson.
Emotion: gruff, warm, unhurried.
Deep, gravelly, low-pitched timbre. Speaks slowly, like muttering to himself,
blunt but affectionate, with long pauses between phrases.
```
**Guidance Scale: 35%**
*(낡은 카세트 질감은 프롬프트에 넣지 말 것 — 내가 후처리로 얹음. 목소리는 깨끗하게)*

**프리뷰 텍스트:**
```
달구지를 완성해라. 그리고 어디든, 끝까지 가라. 길 위에서 배운 건 길 위에서 갚는 거다.
```

**TTS 대사:** `gp_01` 기계는 아프면 운다. 사람은 조용해진다. / `gp_02` 조급해서 밟는 기름이 제일 아깝다. / `gp_03` 차는 사람을 고친다. 좋은 사람들을 태워라. / `gp_04` 밀어서 걸 수 있는 차를 타라. / `gp_05` 달구지를 완성해라. 그리고 어디든, 끝까지 가라. / `gp_06` 남산 보고 열어라.

---

## 화자 4. DJ (스튜디오 3줄 + 라디오 수신 3줄 + 음악방송 1줄)

**보이스 프롬프트:**
```
Native Korean. Female, late 40s. Good quality.
Persona: late-night radio host running a one-woman station.
Emotion: mellow, intimate, comforting.
Warm, slightly husky, low-pitched timbre with soft audible breaths,
close and personal delivery. Relaxed slow pacing, like talking to a single
listener at two in the morning.
```
**Guidance Scale: 30%**

**프리뷰 텍스트:**
```
새벽 두 시입니다. 아직 길 위에 계신 분들, 오늘도 수고 많으셨습니다. 다음 곡은, 조금 오래된 노래입니다.
```

**TTS 대사:** `dj_01` 새벽 두 시입니다. 아직 길 위에 계신 분들, 오늘도 수고 많으셨습니다. / `dj_02` 다음 곡 듣겠습니다. / `dj_03` 내일 이 시간에 다시 만나요. / `radio_dj_open` …새벽 두 시입니다. 아직 길 위에 계신 분들, 오늘도 수고 많으셨습니다. / `radio_dj_close` …오늘 방송은 여기까지. 내일 이 시간에 다시 만나요. / `radio_music` …다음 곡은, 조금 오래된 노래입니다. 이 노래를 아는 분이 아직 계시다면— 같이 불러요.

---

## 화자 5~10. 라디오 단역들 (클립 1개씩 — 라이브러리 보이스로 대충 골라도 충분!)

> 보이스 슬롯 아끼려면 Voice Library에서 비슷한 톤 골라 써도 돼. 직접 만들 거면 아래 복붙.
> **라디오 클립들은 예외적으로 저품질 묘사 OK** (공식 문서가 옛 방송 재현엔 허용) — 원하면 각 프롬프트 끝에 `Low-fidelity audio, like an old radio broadcast.` 한 줄 추가. 안 넣으면 내가 라디오 질감 후처리.

**이장** (`radio_mayor`) — Guidance 30%
```
Native Korean. Elderly man in his late 60s, rural village head.
Persona: village chief making the morning announcement.
Emotion: hearty, folksy, earnest.
Loud, warm, slightly hoarse timbre, projecting as if addressing a whole
village outdoors, with old-fashioned formal phrasing and a slow, deliberate pace.
```
대사: `아아, 마을 주민 여러분, 좋은 아침입니다. …서로 얼굴 보고 삽시다. 이상 이장이었습니다.`

**광고 성우** (`radio_ad`) — Guidance 30%
```
Native Korean. Female, 30s. Persona: home-shopping commercial announcer.
Emotion: excessively bright, urgent, salesy.
High-energy, crisp, smiling voice, speaking quickly with exaggerated
enthusiasm and hard-sell emphasis.
```
대사: `놓치면 후회하실 신제품! 지금 전화 주시면 하나 더!`

**기상캐스터** (`radio_weather`) — Guidance 35%
```
Native Korean. Female, late 20s. Persona: TV weather anchor.
Emotion: pleasant, composed, professional.
Clear, bright, precise announcer timbre with crisp diction and
even, practiced news-desk pacing.
```
대사: `…내일은 전국이 대체로 맑겠습니다. 나들이하기 좋은 날씨가 되겠습니다.`

**야구 캐스터** (`radio_baseball`) — Guidance 25%
```
Native Korean. Male, 40s. Persona: baseball play-by-play commentator
at the peak moment of a game. Emotion: ecstatic, explosive, breathless.
Powerful, projected voice shouting with rising excitement, very fast pace,
voice cracking slightly with joy.
```
대사: `쳤습니다—! 넘어갑니다, 넘어갑니다—!!`

**숫자 방송 여성** (`radio_400`) — Guidance 35%
```
Native Korean. Female, age hard to place. Persona: a person reading numbers
into a microphone, alone. Emotion: flat, weary, eerily calm.
Quiet, breathy, evenly spaced delivery — mechanical rhythm but unmistakably
human breathing between numbers. Slow, hypnotic pacing.
```
대사: `…사. 공. 공. …사. 공. 공. …사. 공. 공.`

**무전 목소리** (`radio_comms`) — Guidance 30%
```
Native Korean. Male, 30s-40s. Persona: exhausted man on a two-way radio.
Emotion: tired, fading hope, restrained.
Rough, dry, low voice speaking in short fragments with pauses,
as if repeating the same call for the hundredth time.
Poor audio quality, like a distant walkie-talkie transmission.
```
대사: `…들리나? …들리면 응답…`

**영농방송 아나운서** (`radio_farm`) — Guidance 30%
```
Native Korean. Male, 50s. Persona: old-fashioned rural radio announcer
reading farming information. Emotion: earnest, dutiful, gentle.
Steady, warm, slightly nasal announcer timbre with old-style formal reading
rhythm, unhurried pace.
```
대사: `…오늘의 영농 정보입니다. 중부 지방은 모내기 적기가 다가오고 있습니다.`

**동요** (`radio_kids`) — ⏸ 보류 추천 (Voice Design으로 아이들 합창은 어려움 — ElevenLabs Music으로 뽑거나 스킵. 스킵해도 자막으로 잘 작동함)

---

## 배경음 SFX (선택 — Sound Effects 탭에 복붙, 파일명 `sfx_*.mp3`)

> **이건 통째로 건너뛰어도 됨** — 목소리만 있어도 게임은 완성이고, 배경 믹싱은 내가 할 수 있어.
> 뽑을 거면 각 6~10초.

| 파일명 | 프롬프트 (Sound Effects에 복붙) | 쓰이는 곳 |
|---|---|---|
| `sfx_garage` | quiet auto repair shop ambience, occasional ratchet clicks and light metal tapping, warm room tone | intro1 |
| `sfx_collapse` | low wind with a distant city siren slowly fading out, then faint ocean waves | intro2 |
| `sfx_winter` | cold winter wind, very quiet, one soft page turn | intro3 |
| `sfx_static` | old radio static and tuning noise, crackling, searching between stations | intro4·라디오 공통 |
| `sfx_depart` | items being loaded into a van, door closing, old van engine starting and idling | intro5 |
| `sfx_vending` | old vending machine hum, a can dropping into the tray | cheollian_01 |
| `sfx_drone` | small surveillance drone propeller hovering steadily | cheollian_03·04 |
| `sfx_pump` | gas station pump machine beep and fuel flowing | cheollian_05·06 |
| `sfx_checkpoint` | wind over an empty highway checkpoint, a loudspeaker clicking on | cheollian_08·11 |
| `sfx_core` | very low deep electronic hum, vast and calm, slowly breathing | cheollian_13 |
| `sfx_crowd` | baseball stadium crowd roaring and cheering, drums, vintage broadcast feel | radio_baseball |
| `sfx_village` | rural village morning, birds, distant rooster, outdoor loudspeaker hum | radio_mayor·farm |

---

## 공식 문서에서 확인된 것 (7/19 조사)

- **모델은 Eleven v3 추천** — "전문 나레이션·오디오북에 이상적, 감정 표현 최고" (공식). 한국어는 v3의 70+ 언어에 포함
- **v3 전용 오디오 태그**: 대사 안에 `[sighs]` `[whispers]` `[laughs]` 등 감정 태그를 심을 수 있음 (v2 계열은 미지원). 활용 예:
  - `gp_06`: `[chuckles] 남산 보고 열어라.` (웃음기 반 스푼을 태그로)
  - `radio_comms`: `[whispers] …들리나? …들리면 응답…`
  - intro 나레이션은 태그 없이 담담하게 가는 게 안전
- **쉼 처리**: v3는 SSML break 미지원 → 문장부호(… — )와 문단으로 조절. 내가 대사에 넣어둔 "—"와 "…"가 그 역할
- **배경음은 역시 별도** — 태그로 넣을 수 있는 건 [applause]류 단발 효과음뿐, 배경 레이어는 Sound Effects 탭이 정답 (이 시트 구조 그대로 유효)

## 오디오 태그 최종 지침 (v3 전용 — 딱 4곳만)

**규칙**: ① 태그는 **반드시 영어로** (`[laughs]` O, `[웃음]` X — 한국어 괄호는 읽어버릴 수 있음) ② TTS 텍스트 칸에 대사와 함께 넣기 ③ **남발 금지** — 이 게임의 미학은 절제라 태그는 아래 4곳이 전부. 인트로·천리안은 **태그 없이** (천리안은 감정이 없어야 하고, 인트로는 목소리 자체가 이미 담담해야 함)

태그 넣은 최종 대사 (이 버전으로 생성):
| 파일명 | 태그 버전 |
|---|---|
| `gp_06` | `[chuckles] 남산 보고 열어라.` |
| `radio_comms` | `[sighs] …들리나? …들리면 응답…` |
| `radio_baseball` | `[excited] 쳤습니다—! 넘어갑니다, 넘어갑니다—!!` |
| `radio_ad` | `[excited] 놓치면 후회하실 신제품! 지금 전화 주시면 하나 더!` |

나머지 29클립은 태그 없이 시트 대사 그대로.

## 던지는 법 (요약)

1. 목소리 파일: **키이름.mp3** (`intro1.mp3`, `cheollian_09.mp3`, `radio_mayor.mp3`…) → `~/Downloads/`
2. SFX 뽑았으면: **sfx_이름.mp3** → 같은 곳
3. 나 호출 → 스펙 검사·트림·정규화·(필요시)믹싱·인라인·배선·배포까지 일괄 처리
