#!/bin/bash
# 서울까지 400km — 게임 스타일 트레일러 조립
# 재료: 게임 픽셀아트 스틸(켄 번즈) + 게임 팔레트 타이프라이터 카드 + 「부서진 고속도로」
set -euo pipefail
cd "$(dirname "$0")"
S=../assets/scenes
FPS=30
# 스틸 → 켄 번즈 클립 (교차로 줌인/줌아웃, 픽셀아트 보호를 위해 lanczos)
kb(){ # $1=src $2=out $3=dur $4=mode(in|out|panR)
  local frames=$(( $3 * FPS ))
  local zoom pan
  case $4 in
    in)  zoom="zoom='1+0.06*on/${frames}'"; pan="x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'";;
    out) zoom="zoom='1.06-0.06*on/${frames}'"; pan="x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'";;
    panR)zoom="zoom=1.05"; pan="x='(iw-iw/zoom)*on/${frames}':y='(ih-ih/zoom)/2'";;
  esac
  ffmpeg -y -v error -loop 1 -i "$1" -vf \
    "scale=2560:1440:flags=lanczos,zoompan=${zoom}:${pan}:d=${frames}:s=1280x720:fps=${FPS},format=yuv420p" \
    -t "$3" -an "rec/$2"
}

mkdir -p rec out
kb "$S/grandfather-garage.jpg"  s1.mp4 5 in
kb "$S/muju-tunnel.jpg"         s2.mp4 5 panR
kb "$S/leo-rooftop-song.jpg"    s3.mp4 5 out
kb "$S/eunsu-last-shift.jpg"    s4.mp4 5 in
kb "$S/perimeter-walker.jpg"    s5.mp4 5 panR
kb "$S/seoul-han.jpg"           s6.mp4 7 in

# 카드 webm → mp4 (fps/포맷 통일, 각 4.6s로 트림)
for c in 1 2 3; do
  ffmpeg -y -v error -i rec/card-$c.webm -t 4.6 -vf "fps=${FPS},scale=1280:720,format=yuv420p" -an rec/c$c.mp4
done
ffmpeg -y -v error -i rec/card-title.webm -t 5.0 -vf "fps=${FPS},scale=1280:720,format=yuv420p" -an rec/ct.mp4

# 순서: c1 → 정비소 → c2 → 터널 → 옥상 → 관제실 → c3 → 보행기 → 남산 → 타이틀
# xfade 체인 (0.7s 디졸브)
ffmpeg -y -v error \
  -i rec/c1.mp4 -i rec/s1.mp4 -i rec/c2.mp4 -i rec/s2.mp4 -i rec/s3.mp4 \
  -i rec/s4.mp4 -i rec/c3.mp4 -i rec/s5.mp4 -i rec/s6.mp4 -i rec/ct.mp4 \
  -filter_complex "
    [0:v][1:v]xfade=transition=fade:duration=0.7:offset=3.9[v1];
    [v1][2:v]xfade=transition=fade:duration=0.7:offset=8.2[v2];
    [v2][3:v]xfade=transition=fade:duration=0.7:offset=12.1[v3];
    [v3][4:v]xfade=transition=fade:duration=0.7:offset=16.4[v4];
    [v4][5:v]xfade=transition=fade:duration=0.7:offset=20.7[v5];
    [v5][6:v]xfade=transition=fade:duration=0.7:offset=25.0[v6];
    [v6][7:v]xfade=transition=fade:duration=0.7:offset=28.9[v7];
    [v7][8:v]xfade=transition=fade:duration=0.7:offset=33.2[v8];
    [v8][9:v]xfade=transition=fade:duration=1.1:offset=39.5[v9];
    [v9]vignette=PI/4:mode=backward,noise=alls=5:allf=t,fade=t=out:st=43.0:d=1.5[vout]
  " -map "[vout]" -c:v libx264 -preset slow -crf 19 -r ${FPS} rec/video.mp4

# 음악 — 노래 자체의 인트로 기승을 그대로, 끝만 페이드
ffmpeg -y -v error -i "../assets/audio/부서진 고속도로.mp3" -t 44.5 \
  -af "afade=t=in:st=0:d=0.8,afade=t=out:st=41.5:d=3.0,volume=0.95" rec/audio.m4a

ffmpeg -y -v error -i rec/video.mp4 -i rec/audio.m4a -c:v copy -c:a aac -b:a 160k -shortest \
  "out/서울까지400km-트레일러.mp4"
du -h "out/서울까지400km-트레일러.mp4"
ffprobe -v error -show_entries format=duration -of csv=p=0 "out/서울까지400km-트레일러.mp4"
