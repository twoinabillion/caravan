#!/bin/bash
# 서울까지 400km — 단일 HTML 빌드
# src/ 파트를 순서대로 cat 해서 서울까지400km.html 을 만든다.
# 파트 순서가 곧 스크립트 로드 순서 (data → engine → scene → map → ui → offroad → boot)
set -euo pipefail
cd "$(dirname "$0")"

PARTS_BEFORE_EMBEDS=(
  src/01-style.html
  src/02-dom.html
  src/03-data.js
  src/03b-portraits.js
  src/03c-icons.js
  src/03d-bgm.js
)

PARTS_AFTER_EMBEDS=(
  src/04-engine.js
  src/05-scene.js
  src/06-mapgraph.js
  src/07-ui.js
  src/08-offroad.js
  src/09-close.html
)

NPC_KEYS=(geumja sundeok taeho jaepil miyoung drhan deokgu kimcaptain hayeosa sanjigi hanbyeol seoyeon mansu postman mapmaker mingyu grandfather bori)
NPC_JS="$(< src/03f-npc-portraits.js)"
for KEY in "${NPC_KEYS[@]}"; do
  NPC_BASE64="$(base64 < "assets/portraits/$KEY.png" | tr -d '\n')"
  NPC_JS="${NPC_JS//__NPC_${KEY}__/data:image/png;base64,$NPC_BASE64}"
done
SCENE_KEYS=(
  GWANGJU_MARKET MIRYANG_MARKET DAEGU_DOME MUJU_TUNNEL JEONJU_MARKET DAEJEON_COMMUNE
  SUWON_FORTRESS SEOUL_HAN KW_DEFENSE_LINE PERIMETER_WALKER GRANDFATHER_GARAGE BUSAN_DEPARTURE
  STORY_GENERATION_FORM STORY_GENERATION_SPEECH STORY_GENERATION_THEORIES STORY_GENERATION_ROUTE
  TRACE_CORTIS_RELIC TRACE_CORTIS_BEACON TRACE_WORLDCUP_CHART TRACE_FOURCUTS TRACE_COLDBAG TRACE_CONSENT
  SEOUL_RUINS SEOUL_SQUARE SEOUL_BASE SEOUL_CORE SEOUL_DECISION SEOUL_NIGHT
  GENERIC_DISCOVERY GENERIC_ENCOUNTER GENERIC_CRISIS GENERIC_CHEOLLIAN GENERIC_STORY
  LIBRARY_BUS MINJI_TOOLBOX PARKSS_CLINIC LEO_ROOFTOP_SONG JAEYI_LEDGER EUNSU_LAST_SHIFT
  POSTMAN_LETTER FREQUENCY_TAPE GRANDFATHER_ENVELOPE RIDGE_MEMORIAL FULL_HOUSE_MEAL
  INTRO_PASSENGER_SEAT INTRO_CHEOLLIAN_2026 INTRO_FIRST_THREE_DAYS INTRO_143_YEARS
  INTRO_BLANK_REASON INTRO_YEARS_TOGETHER INTRO_CAMPER_CONVERSION INTRO_ENVELOPE_SIGNAL INTRO_DEPARTURE_CHOICE
  INTRO_PARENTS_DISCOVERY INTRO_SILENCED_PRESENTATION INTRO_CURRENT_EXPULSION
  FAMILY_VERIFICATION_KEY
  RECRUIT_MINJI RECRUIT_PARKSS
  RECRUIT_MINJI_TASK RECRUIT_PARKSS_TASK RECRUIT_LEO_TASK
  RECRUIT_JAEYI_TASK RECRUIT_EUNSU_TASK RECRUIT_KANGWOO_TASK
)
SCENE_FILES=(
  assets/scenes/gwangju-market.jpg
  assets/scenes/miryang-market.jpg
  assets/scenes/daegu-dome.jpg
  assets/scenes/muju-tunnel.jpg
  assets/scenes/jeonju-market.jpg
  assets/scenes/daejeon-commune.jpg
  assets/scenes/suwon-fortress.jpg
  assets/scenes/seoul-han.jpg
  assets/scenes/kw-defense-line.jpg
  assets/scenes/perimeter-walker.jpg
  assets/scenes/grandfather-garage.jpg
  assets/scenes/busan-departure.jpg
  assets/scenes/story-generation-form.jpg
  assets/scenes/story-generation-speech.jpg
  assets/scenes/story-generation-theories.jpg
  assets/scenes/story-generation-route.jpg
  assets/scenes/trace-cortis-relic.jpg
  assets/scenes/trace-cortis-beacon.jpg
  assets/scenes/trace-worldcup-chart.jpg
  assets/scenes/trace-fourcuts.jpg
  assets/scenes/trace-coldbag.jpg
  assets/scenes/trace-consent.jpg
  assets/scenes/seoul-ruins.jpg
  assets/scenes/seoul-square.jpg
  assets/scenes/seoul-base.jpg
  assets/scenes/seoul-core.jpg
  assets/scenes/seoul-decision.jpg
  assets/scenes/seoul-night.jpg
  assets/scenes/generic-discovery.jpg
  assets/scenes/generic-encounter.jpg
  assets/scenes/generic-crisis.jpg
  assets/scenes/generic-cheollian.jpg
  assets/scenes/generic-story.jpg
  assets/scenes/library-bus.jpg
  assets/scenes/minji-toolbox.jpg
  assets/scenes/parkss-clinic.jpg
  assets/scenes/leo-rooftop-song.jpg
  assets/scenes/jaeyi-ledger.jpg
  assets/scenes/eunsu-last-shift.jpg
  assets/scenes/postman-letter.jpg
  assets/scenes/frequency-tape.jpg
  assets/scenes/grandfather-envelope.jpg
  assets/scenes/ridge-memorial.jpg
  assets/scenes/full-house-meal.jpg
  assets/intro/01-passenger-seat.jpg
  assets/intro/02-cheollian-2026.jpg
  assets/intro/03-first-three-days.jpg
  assets/intro/04-143-years.jpg
  assets/intro/05-blank-reason.jpg
  assets/intro/06-years-together.jpg
  assets/intro/06-camper-conversion-v2.jpg
  assets/intro/07-envelope-signal.jpg
  assets/intro/08-departure-choice.jpg
  assets/intro/09-parents-discovery.jpg
  assets/intro/10-silenced-presentation.jpg
  assets/intro/11-current-expulsion.jpg
  assets/scenes/family-verification-key.jpg
  assets/scenes/recruit-minji.jpg
  assets/scenes/recruit-parkss.jpg
  assets/scenes/recruit-minji-task.jpg
  assets/scenes/recruit-parkss-task.jpg
  assets/scenes/recruit-leo-task.jpg
  assets/scenes/recruit-jaeyi-task.jpg
  assets/scenes/recruit-eunsu-task.jpg
  assets/scenes/recruit-kangwoo-task.jpg
)
SCENE_JS="$(< src/03g-scenes.js)"
for I in "${!SCENE_KEYS[@]}"; do
  SCENE_BASE64="$(base64 < "${SCENE_FILES[$I]}" | tr -d '\n')"
  SCENE_JS="${SCENE_JS//__SCENE_${SCENE_KEYS[$I]}__/data:image/jpeg;base64,$SCENE_BASE64}"
done
UPGRADE_KEYS=(FUEL SEATING CHASSIS UTILITY POWER CAMP LIVING)
UPGRADE_FILES=(
  assets/upgrades/fuel.jpg
  assets/upgrades/seating-v2.jpg
  assets/upgrades/chassis.jpg
  assets/upgrades/utility.jpg
  assets/upgrades/power.jpg
  assets/upgrades/camp.jpg
  assets/upgrades/living.jpg
)
for I in "${!UPGRADE_KEYS[@]}"; do
  UPGRADE_BASE64="$(base64 < "${UPGRADE_FILES[$I]}" | tr -d '\n')"
  SCENE_JS="${SCENE_JS//__UPGRADE_${UPGRADE_KEYS[$I]}__/data:image/jpeg;base64,$UPGRADE_BASE64}"
done
{
  cat "${PARTS_BEFORE_EMBEDS[@]}"
  printf '%s\n' "$NPC_JS"
  printf '%s\n' "$SCENE_JS"
  cat "${PARTS_AFTER_EMBEDS[@]}"
} > 서울까지400km.html
echo "✅ 서울까지400km.html $(wc -c < 서울까지400km.html | tr -d ' ') bytes"
