#!/bin/zsh
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

PROJECT_DIR="${CARAVAN_PROJECT_DIR:-/Users/sang/caravan}"
LATEST_DIR="${CARAVAN_LATEST_DIR:-/Users/sang/caravan-latest}"
GAME_NAME='서울까지400km.html'
GAME_FILE="$LATEST_DIR/$GAME_NAME"
AIT_FILE="$LATEST_DIR/caravan.ait"

fail() {
  echo
  echo "중단: $1"
  echo '프로젝트 파일은 변경하지 않았습니다.'
  if [[ -t 0 ]]; then
    echo 'Enter를 누르면 이 창을 닫습니다.'
    read -r
  fi
  exit 1
}

[[ -d "$PROJECT_DIR/.git" ]] || fail "프로젝트를 찾을 수 없습니다: $PROJECT_DIR"
command -v git >/dev/null 2>&1 || fail 'git을 찾을 수 없습니다.'
command -v npm >/dev/null 2>&1 || fail 'npm을 찾을 수 없습니다.'

echo '서울까지 400km 최신 게임과 AIT를 준비합니다.'
echo '1/4 GitHub master 확인'

if [[ -n "$(git -C "$PROJECT_DIR" status --porcelain --untracked-files=no)" ]]; then
  fail 'caravan 프로젝트에 커밋하지 않은 변경이 있습니다. 먼저 저장하거나 커밋해 주세요.'
fi

git -C "$PROJECT_DIR" fetch origin master || fail 'GitHub 최신 정보를 가져오지 못했습니다.'

LOCAL_HEAD="$(git -C "$PROJECT_DIR" rev-parse HEAD)"
REMOTE_HEAD="$(git -C "$PROJECT_DIR" rev-parse origin/master)"
BASE_HEAD="$(git -C "$PROJECT_DIR" merge-base HEAD origin/master)"

if [[ "$LOCAL_HEAD" == "$REMOTE_HEAD" ]]; then
  echo '2/4 이미 GitHub 최신 버전입니다.'
elif [[ "$LOCAL_HEAD" == "$BASE_HEAD" ]]; then
  echo '2/4 GitHub 최신 버전으로 빠르게 갱신'
  git -C "$PROJECT_DIR" merge --ff-only origin/master || fail 'master를 안전하게 갱신하지 못했습니다.'
elif [[ "$REMOTE_HEAD" == "$BASE_HEAD" ]]; then
  fail '로컬에 아직 GitHub로 푸시하지 않은 커밋이 있습니다. 먼저 push해 주세요.'
else
  fail '로컬 master와 GitHub master가 갈라졌습니다. 저장소를 먼저 정리해 주세요.'
fi

echo '3/4 최신 HTML로 AIT 재빌드'
(
  cd "$PROJECT_DIR"
  CARAVAN_HTML_READY=1 npm run build:toss
) || fail 'AIT 빌드에 실패했습니다.'

[[ -f "$PROJECT_DIR/$GAME_NAME" ]] || fail '최신 게임 HTML을 찾을 수 없습니다.'
[[ -f "$PROJECT_DIR/caravan.ait" ]] || fail '최신 caravan.ait를 찾을 수 없습니다.'

echo '4/4 안전한 실행 폴더에 게임과 AIT 복사'
mkdir -p "$LATEST_DIR"
cp "$PROJECT_DIR/$GAME_NAME" "$GAME_FILE"
cp "$PROJECT_DIR/caravan.ait" "$AIT_FILE"

SHORT_HEAD="$(git -C "$PROJECT_DIR" rev-parse --short HEAD)"
AIT_HASH="$(shasum -a 256 "$AIT_FILE" | awk '{print substr($1,1,12)}')"

echo
echo "완료: GitHub master $SHORT_HEAD"
echo "게임: $GAME_FILE"
echo "AIT:  $AIT_FILE (sha256 $AIT_HASH)"
if [[ "${CARAVAN_SKIP_OPEN:-0}" == '1' ]]; then
  echo '검사용 실행: 게임 열기를 생략했습니다.'
else
  echo '최신 게임을 엽니다.'
  open "$GAME_FILE"
fi
