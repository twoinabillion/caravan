# Phase B 원본 통합 절차

이 절차는 Task 9A와 전체 브랜치가 독립 승인되고 컨트롤러가 Phase B를 시작한 뒤에만 실행한다. 2026-09-12 두 차례 통합·백업·빌드·UI 확인을 완료했다. 실제 승인 커밋과 결과는 `integration-manifest.json` 및 [Phase B 영수증](phase-b/README.md)에 있다. 아래는 재현 가능한 절차다.

## 1. 승인본과 원본 보존 상태 고정

```sh
WORKTREE=/Users/sang/_workspace/caravan-director-20260911
ORIGINAL=/Users/sang/caravan
BASELINE=73bef1d73df79fe4d7342182488c64a0f37dc600
APPROVED=<독립적으로 승인된 전달 대상 커밋>

git -C "$WORKTREE" rev-parse HEAD
git -C "$WORKTREE" status --short
git -C "$ORIGINAL" rev-parse HEAD
git -C "$ORIGINAL" status --short
shasum -a 256 "$WORKTREE/artifacts/director-pass-2026-09-11/task8-final/crew-checkpoint/save.json"
wc -c "$WORKTREE/artifacts/director-pass-2026-09-11/task8-final/crew-checkpoint/save.json"
```

`APPROVED`는 컨트롤러가 승인한 정확한 커밋과 같아야 한다. 원본 26개 기존 변경을 초기화하거나 checkout하지 않는다. 다음 검사는 `source-baseline-hashes.json`의 967개 경로를 원본에서 다시 해시해 `changed=[]`, `missing=[]`인지 확인한다. 이어 `git -C "$WORKTREE" diff --diff-filter=A --name-only "$BASELINE..$APPROVED"`의 새 경로가 원본에 이미 존재하는지 검사한다. 기준 ledger에 없는데 존재하는 경로는 새 충돌로 중단한다.

```sh
python3 - <<'PY'
import hashlib, json
from pathlib import Path
worktree = Path('/Users/sang/_workspace/caravan-director-20260911')
original = Path('/Users/sang/caravan')
ledger = json.loads((worktree / 'artifacts/director-pass-2026-09-11/source-baseline-hashes.json').read_text())
changed, missing = [], []
for relative, expected in ledger.items():
    path = original / relative
    if not path.is_file(): missing.append(relative); continue
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if actual != expected: changed.append({'path': relative, 'expected': expected, 'actual': actual})
print(json.dumps({'checked': len(ledger), 'changed': changed, 'missing': missing}, ensure_ascii=False, indent=2))
raise SystemExit(1 if changed or missing else 0)
PY
```

새 경로 후보와 충돌은 다음처럼 작업트리를 명시해 계산한다. Python checker도 승인 SHA를 명시적 인자로 받고 `cwd=worktree`로 Git 범위를 고정하므로 어느 디렉터리에서 실행해도 같은 저장소를 검사한다.

```sh
git -C "$WORKTREE" diff --diff-filter=A --name-only "$BASELINE..$APPROVED"
python3 - "$WORKTREE" "$ORIGINAL" "$BASELINE" "$APPROVED" <<'PY'
import json, subprocess, sys
from pathlib import Path

worktree, original = map(Path, sys.argv[1:3])
baseline, approved = sys.argv[3:5]
result = subprocess.run(
    ["git", "diff", "--diff-filter=A", "--name-only", "-z", f"{baseline}..{approved}"],
    cwd=worktree,
    check=True,
    capture_output=True,
)
added = [Path(raw.decode()) for raw in result.stdout.split(b"\0") if raw]
collisions = [str(relative) for relative in added if (original / relative).exists()]
receipt = {
    "worktree": str(worktree),
    "baseline": baseline,
    "approved": approved,
    "addedPathCount": len(added),
    "collisions": collisions,
}
print(json.dumps(receipt, ensure_ascii=False, indent=2))
raise SystemExit(1 if collisions else 0)
PY
```

결과 JSON을 감사 디렉터리에 보존한다. 승인본의 `BASELINE..APPROVED` name-status diff에 실제로 나온 경로만 대상으로 삼고, 그 결과를 `integration-manifest.json`의 허용 루트·정확한 파일과 교집합한다. 디렉터리 전체를 별도로 복사하지 않는다. `.superpowers`, 생성 HTML/AIT, `qa-artifacts`, 대량 `artifacts`는 선택하지 않는다. `artifacts`에서는 manifest의 다섯 파일만 허용하며 대표 화면 8장과 compact index는 이미 최종 감사 폴더에 복사돼 있다.

## 2. 백업 후 승인 파일만 복사

**어떤 `src/`·`assets/` 파일도 복사하기 전에** 기존 생성물 `서울까지400km.html`, `caravan.ait`, `caravanproject.ait`, `seoul400km.ait`, `reports/asset-budget.json`을 통합 백업 아래 `pre-build-generated/`에 복사하고 SHA-256·바이트를 기록한다. 4175 `dev:live`가 켜져 있으면 watched 파일 복사보다 먼저 이 백업을 끝내거나, 그 Caravan 서버만 멈추고 백업한 뒤 복사한다. watched rebuild가 먼저 실행돼 이전 실행본을 덮는 순서를 허용하지 않는다.

허용된 변경 경로와 상태(A/M/D)를 NUL 구분 목록으로 만들고, 원본에 이미 있는 대상은 타임스탬프가 붙은 백업 디렉터리에 같은 상대 경로로 복사한다. 목록과 각 파일의 복사 전 SHA-256을 함께 저장한다. 삭제 경로는 기준 해시와 일치할 때만 백업 후 삭제한다. 추가·수정 파일은 승인 커밋의 blob과 같은 바이트인지 작업트리에서 확인한 뒤 `copy2`로 반영하고, 반영 후 원본 SHA-256을 다시 대조한다.

복사 결과 영수증에는 최소한 승인 SHA, 상태, 상대 경로, 기준 SHA, 복사 전 SHA, 승인 blob SHA, 복사 후 SHA, 백업 경로를 기록한다. 충돌 하나라도 발견되면 복사 전에 중단한다. 개별 경로에 원본의 새로운 편집이 있다면 세 방향 병합 후 별도 검토를 받는다.

## 3. 원본에서 안정된 HTML과 AIT 생성

4175의 Caravan `dev:live`가 실행 중이면 `/__live/status`에서 `building=false`, `queued=false`를 확인하고 마지막 debounce가 끝난 뒤 빌드한다. 필요하면 그 서버만 멈추고 다시 시작한다. 4173/4174의 다른 게임 프로세스는 건드리지 않는다.

```sh
cd /Users/sang/caravan
npm run validate:content
npm run build
node tools/check-release.mjs
shasum -a 256 서울까지400km.html caravan.ait caravanproject.ait seoul400km.ait
wc -c 서울까지400km.html
node tools/verify-ait-web.mjs /Users/sang/caravan caravan.ait
```

`npm run build`가 만드는 연결은 `src/assets → 서울까지400km.html → dist/web/index.html + dist/web/assets/* → caravan.ait`이다. `check-release`는 source HTML의 빌드 문자열, 용량 상한, 세 AIT alias의 동일 SHA를 검사한다. `verify-ait-web.mjs`는 AIT를 한 번만 압축 해제해 새 번들의 모든 index entry SHA를 검사하고, 모든 `web/*`를 새 `dist/web/*`와 바이트 단위로 대조하며, **AIT의 `web/index.html` 안에서** `GAME_BUILD=2026-09-11-director-journey`를 확인한다. 파일 이름만으로 런타임 본문의 소유자를 추정하지 않는다.

이어 콘텐츠 1,019개·장면393개, 최종 HTML77,667,306 bytes/SHA-256 `b6e92207…fdb56`, 시각 경고 정확히58개와 추가/삭제0개를 확인한다. 최초 전달과 Task8 캠페인은77,666,839 bytes/`1c560199…9d07`이며, 정차 콘솔 보완 전 중간 영수증으로 보존한다. HTML 또는 경고 집합이 다르면 원인을 검토하기 전 전달 증거를 갱신하지 않는다.

## 4. 원본 4175 실제 화면 확인

개인 브라우저 상태를 쓰지 않는 격리 컨텍스트에서 원본 `http://127.0.0.1:4175/game?caravan-live=1`을 연다. 새 게임 부산 선택/결과/출발과 정확한 획득 저장본의 서울 선택/결과/종결을 대표 320px·390px·데스크톱 화면으로 확인한다. 브라우저 main response SHA와 로컬 HTML SHA가 같고, `GAME_BUILD`가 동결 값이며, 페이지 오류가 0인지 기록한다. 개발 서버의 선택적 `/assets/app-icon.png` 404는 별도 HTTP caveat로 남긴다.

마지막으로 `integration-manifest.json`의 Phase B receipts와 이 감사의 전달 행을 실제 SHA·바이트·백업·충돌 검사·AIT payload·4175 캡처 경로로 채운다. 원본 Git 상태와 사용자의 기존 26개 변경이 보존됐는지 다시 기록한 뒤에만 Task 9 전달 완료를 판정한다.

두 번째 보완 통합은 첫 통합 뒤의 승인 파일 해시와 나머지 기준 파일을 합친1,098개 경로를 비교했다. 새 경로 충돌0개를 확인하고 중간 HTML·AIT·자산 보고서와 수정 소스를 먼저 별도 백업한 뒤 UI 보완22개 경로를 반영했다. [두 번째 복사 영수증](phase-b/fitter-copy-receipt.json).
