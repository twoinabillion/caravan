#!/bin/bash
# 서울까지 400km — 최신 게임 통합 빌드
# 기본: src/ → 서울까지400km.html → caravan.ait + 호환 파일명 동기화
# --html-only: AIT 빌드 내부에서 재귀 없이 HTML만 갱신
# 파트 순서가 곧 스크립트 로드 순서 (data → engine → scene → map → ui → offroad → boot)
set -euo pipefail
cd "$(dirname "$0")"

HTML_ONLY=false
if [[ "${1:-}" == "--html-only" ]]; then
  HTML_ONLY=true
  shift
fi
if [[ $# -gt 0 ]]; then
  echo "사용법: ./build.sh [--html-only]" >&2
  exit 2
fi

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

NPC_KEYS=(geumja sundeok taeho jaepil miyoung drhan deokgu kimcaptain hayeosa sanjigi hanbyeol seoyeon mansu postman mapmaker mingyu grandfather bori mother father intro_child player_child passer_man passer_woman passer_elder passer_child passer_merchant passer_guard passer_refugee passer_worker passer_medic)
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
  SEOUL_RUINS SEOUL_SQUARE SEOUL_BASE SEOUL_CORE SEOUL_TESTIMONY SEOUL_DECISION SEOUL_LIBERATION SEOUL_NIGHT
  GENERIC_DISCOVERY GENERIC_ENCOUNTER GENERIC_CRISIS GENERIC_CHEOLLIAN GENERIC_STORY
  LIBRARY_BUS MINJI_TOOLBOX PARKSS_CLINIC LEO_ROOFTOP_SONG JAEYI_LEDGER EUNSU_LAST_SHIFT
  POSTMAN_LETTER FREQUENCY_TAPE GRANDFATHER_ENVELOPE RIDGE_MEMORIAL FULL_HOUSE_MEAL
  INTRO_PASSENGER_SEAT INTRO_CHEOLLIAN_2026 INTRO_FIRST_EXPULSION INTRO_143_YEARS
  INTRO_BLANK_REASON INTRO_YEARS_TOGETHER INTRO_CAMPER_CONVERSION INTRO_ENVELOPE_SIGNAL INTRO_DEPARTURE_CHOICE
  INTRO_PARENTS_DISCOVERY INTRO_SILENCED_PRESENTATION INTRO_CURRENT_EXPULSION
  FAMILY_VERIFICATION_KEY
  RECRUIT_MINJI RECRUIT_PARKSS
  RECRUIT_MINJI_TASK RECRUIT_PARKSS_TASK RECRUIT_LEO_TASK
  RECRUIT_JAEYI_TASK RECRUIT_EUNSU_TASK RECRUIT_KANGWOO_TASK
  RECRUIT_MINJI_FOLLOW RECRUIT_MINJI_JOIN RECRUIT_PARKSS_FOLLOW RECRUIT_PARKSS_JOIN
  RECRUIT_LEO_FOLLOW RECRUIT_LEO_JOIN RECRUIT_JAEYI_FOLLOW RECRUIT_JAEYI_JOIN
  RECRUIT_EUNSU_FOLLOW RECRUIT_EUNSU_JOIN RECRUIT_KANGWOO_FOLLOW RECRUIT_KANGWOO_JOIN
  COMBAT_PERIMETER_WARNING COMBAT_WALKER_DISABLE COMBAT_DRONE_SWARM COMBAT_CHECKPOINT_BREACH
  ROADCREW_LINE ROADCREW_BRIDGE ROADCREW_WASHOUT ROADCREW_SIGN ROAD_NIGHT_CIRCLE ROAD_SUPPLY_SHELTER
  RECRUIT_MINJI_TASK_SIGNAL RECRUIT_MINJI_TASK_COLLAPSE
  RECRUIT_MINJI_FOLLOW_LISTEN RECRUIT_MINJI_FOLLOW_RECORD
  RECRUIT_PARKSS_TASK_POWER RECRUIT_LEO_TASK_WADE RECRUIT_JAEYI_TASK_LIFT RECRUIT_EUNSU_TASK_BREAKER
  RECRUIT_KANGWOO_TASK_SEOYEON COMBAT_WALKER_JOINT SEOUL_CORE_KEY ROADCREW_BRIDGE_WEDGE
  RECRUIT_PARKSS_FOLLOW_SHARED RECRUIT_LEO_FOLLOW_PUDDLE
  RECRUIT_JAEYI_FOLLOW_SHELF RECRUIT_EUNSU_FOLLOW_LIGHTS
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
  assets/scenes/seoul-testimony.jpg
  assets/scenes/seoul-decision.jpg
  assets/scenes/seoul-liberation.jpg
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
  assets/intro/03-first-expulsion-v2.jpg
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
  assets/scenes/recruit-minji-follow.jpg
  assets/scenes/recruit-minji-join.jpg
  assets/scenes/recruit-parkss-follow.jpg
  assets/scenes/recruit-parkss-join.jpg
  assets/scenes/recruit-leo-follow.jpg
  assets/scenes/recruit-leo-join.jpg
  assets/scenes/recruit-jaeyi-follow.jpg
  assets/scenes/recruit-jaeyi-join.jpg
  assets/scenes/recruit-eunsu-follow.jpg
  assets/scenes/recruit-eunsu-join.jpg
  assets/scenes/recruit-kangwoo-follow.jpg
  assets/scenes/recruit-kangwoo-join.jpg
  assets/scenes/combat-perimeter-warning.jpg
  assets/scenes/combat-walker-disable.jpg
  assets/scenes/combat-drone-swarm.jpg
  assets/scenes/combat-checkpoint-breach.jpg
  assets/scenes/roadcrew-line.jpg
  assets/scenes/roadcrew-bridge.jpg
  assets/scenes/roadcrew-washout.jpg
  assets/scenes/roadcrew-sign.jpg
  assets/scenes/road-night-circle.jpg
  assets/scenes/road-supply-shelter.jpg
  assets/scenes/recruit-minji-task-signal.jpg
  assets/scenes/recruit-minji-task-collapse.jpg
  assets/scenes/recruit-minji-follow-listen.jpg
  assets/scenes/recruit-minji-follow-record.jpg
  assets/scenes/recruit-parkss-task-power.jpg
  assets/scenes/recruit-leo-task-wade.jpg
  assets/scenes/recruit-jaeyi-task-lift.jpg
  assets/scenes/recruit-eunsu-task-breaker.jpg
  assets/scenes/recruit-kangwoo-task-seoyeon.jpg
  assets/scenes/combat-walker-joint.jpg
  assets/scenes/seoul-core-key.jpg
  assets/scenes/roadcrew-bridge-wedge.jpg
  assets/scenes/recruit-parkss-follow-shared.jpg
  assets/scenes/recruit-leo-follow-puddle.jpg
  assets/scenes/recruit-jaeyi-follow-shelf.jpg
  assets/scenes/recruit-eunsu-follow-lights.jpg
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
TITLE_BGM_JS="$(< src/03e-bgm-title.js)"
TITLE_BGM_BASE64="$(base64 < assets/audio/title.mp3 | tr -d '\n')"
TITLE_BGM_JS="${TITLE_BGM_JS//__BGM_TITLE__/data:audio/mpeg;base64,$TITLE_BGM_BASE64}"
{
  cat "${PARTS_BEFORE_EMBEDS[@]}"
  printf '%s\n' "$TITLE_BGM_JS"
  printf '%s\n' "$NPC_JS"
  printf '%s\n' "$SCENE_JS"
  cat "${PARTS_AFTER_EMBEDS[@]}"
} > 서울까지400km.html
echo "✅ 서울까지400km.html $(wc -c < 서울까지400km.html | tr -d ' ') bytes"

if [[ "$HTML_ONLY" == false ]]; then
  echo "📦 최신 HTML로 AIT 번들을 갱신합니다."
  CARAVAN_HTML_READY=1 npm run build:toss
fi
