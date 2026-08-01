#!/bin/bash
# Downloads에서 생성한 대표 테이크만 골라 모바일용 MP3로 정리한다.
# 원본 파일은 건드리지 않는다.
set -euo pipefail

cd "$(dirname "$0")/.."

DOWNLOAD_DIR="${1:-/Users/sang/Downloads}"
if [[ ! -d "$DOWNLOAD_DIR" ]]; then
  echo "Downloads 폴더를 찾을 수 없습니다: $DOWNLOAD_DIR" >&2
  exit 1
fi
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg가 필요합니다." >&2
  exit 1
fi

mkdir -p assets/audio/bgm assets/audio/sfx assets/audio/voice

resolve_one(){
  local pattern="$1"
  local found
  found="$(rg --files "$DOWNLOAD_DIR" | rg "$pattern" | head -1 || true)"
  if [[ -z "$found" ]]; then
    echo "원본을 찾지 못했습니다: $pattern" >&2
    exit 1
  fi
  printf '%s' "$found"
}

encode_stereo(){
  local source="$1" target="$2" loudness="${3:--20}"
  ffmpeg -hide_banner -loglevel error -y -i "$source" -map_metadata -1 -vn \
    -af "loudnorm=I=${loudness}:TP=-2:LRA=11" -ar 48000 -ac 2 -b:a 64k "$target"
}

encode_voice(){
  local source="$1" target="$2"
  ffmpeg -hide_banner -loglevel error -y -i "$source" -map_metadata -1 -vn \
    -af "loudnorm=I=-18:TP=-2:LRA=7" -ar 48000 -ac 1 -b:a 64k "$target"
}

import_sfx(){
  local key="$1" pattern="$2" loudness="${3:--20}"
  encode_stereo "$(resolve_one "$pattern")" "assets/audio/sfx/${key}.mp3" "$loudness"
}

# 차량과 이동
import_sfx sfx_van_start 'Interior_of_an_old_s_#1-1785408084656\.mp3$' -18
import_sfx sfx_van_idle_loop 'Seamless_int_#1-1785408333140\.mp3$' -22
import_sfx sfx_drive_asphalt_loop 'Seamless_int_#1-1785408411375\.mp3$' -22
import_sfx sfx_drive_gravel_loop 'Seamless_int_#1-1785408464770\.mp3$' -22
import_sfx sfx_stop_brake 'An_old_diese_#1-1785408510797\.mp3$' -18
import_sfx sfx_cargo_depart 'Supplies_loaded__#1-1785408555577\.mp3$' -19

# 인트로와 핵심 컷신
import_sfx sfx_rain_wiper_loop 'Seamless_int_#1-1785408611044\.mp3$' -23
import_sfx sfx_door_printer 'Inside_a_quiet_a_#1-1785408653646\.mp3$' -19
import_sfx sfx_lab_room_loop 'Seamless_quiet_resea_#1-1785408703187\.mp3$' -24
import_sfx sfx_presentation_cut 'A_presentation_room__#2-1785408796292\.mp3$' -18
import_sfx sfx_core_loop 'Seamless_ambience_in_#1-1785480926335\.mp3$' -24
import_sfx sfx_core_key_insert 'A_small_old_semicond_#1-1785480969201\.mp3$' -18

# 정착지와 생활
import_sfx sfx_market_loop 'Seamless_ambience_of_#1-1785481008297\.mp3$' -25
import_sfx sfx_garage_loop 'Seamless_quiet_auto__#1-1785481072355\.mp3$' -24
import_sfx sfx_van_extension 'Realistic_constructi_#1-1785481117649\.mp3$' -18
import_sfx sfx_camp_loop 'Seamless_quiet_night_#1-1785481160988\.mp3$' -25
import_sfx sfx_port_arrival_loop 'Seamless_cold_dawn_a_#1-1785481204784\.mp3$' -25

# 선택 효과음
import_sfx sfx_radio_static 'Old_shortwave_radio__#1-1785481277570\.mp3$' -21
import_sfx sfx_checkpoint 'Wind_across_an_aband_#1-1785481349860\.mp3$' -21
import_sfx sfx_fuel_pump 'Old_automated_fuel_p_#1-1785481382587\.mp3$' -18
import_sfx sfx_drone_real 'Small_surveillance_q_#1-1785481437566\.mp3$' -22
import_sfx sfx_walker_real 'Heavy_improvised_pat_#1-1785481478036\.mp3$' -18
import_sfx sfx_radio_400_after 'A_single_low_human_h_#4-1785481489428\.mp3$' -22

# 긴 곡은 완곡을 유지하되 낮은 비트레이트로 줄인다. 반복은 런타임이 담당한다.
encode_stereo "$(resolve_one '/비어가는 국도\.mp3$')" assets/audio/bgm/drive_day.mp3 -20
encode_stereo "$(resolve_one '/Headlight Camper\.mp3$')" assets/audio/bgm/drive_night.mp3 -20

# 천리안 코어 15문장. 사람 목소리는 의도적으로 가져오지 않는다.
VOICE_PATTERNS=(
  '07_49_47_천리안_.*\.mp3$'
  '07_50_03_천리안_.*\.mp3$'
  '07_50_20_천리안_.*\.mp3$'
  '07_50_40_천리안_.*\.mp3$'
  '07_51_00_천리안_.*\.mp3$'
  '07_51_13_천리안_.*\.mp3$'
  '07_51_36_천리안_.*\.mp3$'
  '07_51_54_천리안_.*\.mp3$'
  '07_52_03_천리안_.*\.mp3$'
  '07_52_14_천리안_.*m2\.mp3$'
  '07_52_30_천리안_.*\.mp3$'
  '07_52_39_천리안_.*\.mp3$'
  '07_52_52_천리안_.*\.mp3$'
  '07_53_37_천리안_.*\.mp3$'
  '07_53_53_천리안_.*\.mp3$'
)
for index in "${!VOICE_PATTERNS[@]}"; do
  printf -v key 'cheollian_core_%02d' "$((index+1))"
  encode_voice "$(resolve_one "${VOICE_PATTERNS[$index]}")" "assets/audio/voice/${key}.mp3"
done

echo "✅ 대표 효과음 23개 · 주행 BGM 2개 · 천리안 15개 정리 완료"
