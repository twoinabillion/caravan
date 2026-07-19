# 서울까지 400km — 아이콘 프롬프트 팩 (20종)

HUD 게이지·상태 화면·거래·날씨 표시에 쓰는 아이콘. 초상화와 달리 **13~16px로 축소 표시**되므로 규칙이 다르다: 단순한 실루엣, 두꺼운 외곽, 색 3~4개.

## 게임에 넣는 법

1. **32×32, 투명 배경 PNG**로 생성 (한 장에 여러 개 나오면 잘라서 개별 저장)
2. data URI 변환: `base64 -i fuel.png | pbcopy`
3. `서울까지400km.html`의 `D.icons = {};` 아래에:
```js
D.icons.fuel  = 'data:image/png;base64,...';
D.icons.water = 'data:image/png;base64,...';
// 아래 키 전부 동일. 넣은 것만 교체되고 나머지는 기존 텍스트/이모지 유지.
```
반영 위치: HUD 자원 게이지 라벨 · 상태 화면 · 정착지 거래 목록 · 날씨 표시(오늘/내일 예보).

---

## 공통 스타일

**EN base prompt** (모든 아이콘 앞에 붙이기):
```
32x32 pixel art game icon, transparent background, thick dark outline,
chunky readable silhouette, 3-4 colors max, muted post-apocalyptic palette
with one warm accent (#ffb454 amber), slight top-left highlight,
no text, single object centered
```
- 네거티브: `photorealistic, gradient shading, thin lines, glossy modern UI, drop shadow`
- **세트 일관성 팁**: 한 번의 세션/시드에서 "icon set, same style" 로 묶어 뽑고, 전부 같은 외곽선 두께인지 확인

---

## 자원 (HUD 게이지) — 5종

| 키 | 대상 | 콘셉트 |
|---|---|---|
| `fuel` | 연료 | 빨간 제리캔(기름통), X자 보강 무늬 |
| `water` | 물 | 파란 물통(말통) 또는 물방울 든 수통 |
| `food` | 식량 | 라벨 벗겨진 통조림, 뚜껑 살짝 열림 |
| `van` | 밴 내구 | 렌치 하나 (또는 렌치+작은 밴 실루엣) |
| `scrap` | 고철 | 녹슨 기어/너트 두 개 겹침 |

```
[base], red metal jerry can with X ribs, fuel icon
[base], blue plastic water jug with handle, small water drop
[base], dented tin can with peeled label, slightly open lid
[base], single sturdy wrench, worn metal, repair icon
[base], two rusty gears and a bolt stacked, scrap metal icon
```

## 아이템 — 3종

| 키 | 대상 | 콘셉트 |
|---|---|---|
| `parts` | 부품 | 나무상자에 담긴 기계 부속(스프링·기어 삐져나옴) |
| `meds` | 의약품 | 낡은 구급상자, 십자 마크 색 바램 |
| `ammo` | 탄약 | 탄환 두 발 나란히 |

```
[base], small wooden crate with machine parts sticking out, spring and gear
[base], worn first aid kit box with faded cross mark
[base], two rifle bullets side by side, brass color
```

## 상태 — 7종

피로는 **컨디션 얼굴 3단계**. HUD에 항상 떠 있고 수치가 오르면 얼굴이 바뀐다
(0~59% `fatigue_ok` → 60~79% `fatigue_mid` → 80%+ `fatigue_bad` — 게임 디버프 문턱과 동일).
**같은 얼굴의 표정 변화**여야 한다 — 세 개를 한 세션에서 "same face, three states"로 묶어 뽑을 것.

| 키 | 대상 | 콘셉트 |
|---|---|---|
| `fatigue_ok` | 쌩쌩 (0~59%) | 둥근 얼굴, 밝은 눈 + 옅은 미소 |
| `fatigue_mid` | 뻐근 (60~79%) | 같은 얼굴, 일자 눈 -ㅡ- + 무표정, 살짝 처진 |
| `fatigue_bad` | 탈진 직전 (80%+) | 같은 얼굴, 감긴 눈 + 다크서클 + 땀방울/zZ |
| `pursuit` | 천리안 관측 | **청록(#55e0c8)** 카메라 조리개 눈 (유일하게 청록 액센트) |
| `bond` | 유대 | 작은 모닥불 (혹은 맞잡은 두 손) |
| `perk` | 퍼크 | 네 갈래 반짝이 별 ✦ |
| `quest` | 배달 의뢰 | 노끈으로 묶은 소포 상자 |

```
[base], round face with bright open eyes and slight smile, healthy condition icon, same face series 1 of 3
[base], same round face with flat closed-line eyes and neutral tired expression, same face series 2 of 3
[base], same round face exhausted, shut eyes with dark circles and one sweat drop and small z, same face series 3 of 3
[base with CYAN #55e0c8 accent instead of amber], mechanical camera aperture shaped like an eye, surveillance icon
[base], small campfire with two logs, warm flame
[base], four-pointed sparkle star, amber glow
[base], brown parcel box tied with string, delivery icon
```

## 날씨 — 5종

| 키 | 대상 | 콘셉트 |
|---|---|---|
| `wx_clear` | 맑음 | 해 (광선 8개, 뭉툭하게) |
| `wx_rain` | 비 | 구름 + 빗줄 3개 |
| `wx_storm` | 폭풍 | 어두운 구름 + 노란 번개 |
| `wx_fog` | 안개 | 가로 안개띠 3줄 |
| `wx_dust` | 황사 | 주황 소용돌이 모래바람 |

```
[base], blunt sun with 8 short rays, warm amber
[base], small cloud with three rain streaks
[base], dark storm cloud with one bold yellow lightning bolt
[base], three horizontal fog bands, pale gray-blue
[base], orange swirling dust wind, sand particles
```

---

## 체크리스트

- [ ] 20종 전부 같은 외곽선 두께·같은 팔레트 (pursuit만 청록 액센트)
- [ ] fatigue 3종이 **같은 얼굴**로 읽히는지 (표정만 다르게)
- [ ] 32×32 → 13px 축소해서 실루엣이 구분되는지 (특히 fuel vs scrap, water vs food)
- [ ] 배경 투명 (흰 배경으로 나오면 제거)
- [ ] 완성되면 위 키 이름 그대로 D.icons에 — base64 변환+삽입은 요청 시 대행 가능
