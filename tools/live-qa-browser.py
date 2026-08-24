#!/usr/bin/env python3
"""Open and inspect the one live Chrome tab shared by the player and QA."""

import argparse
import hashlib
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.error import URLError
from urllib.parse import quote, urlencode, unquote, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GAME = Path.home() / "caravan-latest" / "서울까지400km.html"
DEFAULT_PROFILE = Path.home() / ".caravan-live-qa-chrome"
DEFAULT_STATE = Path.home() / "caravan-latest" / ".caravan-live-qa.json"
DEFAULT_PORT = 49271
DEFAULT_AUDIT = ROOT / "audits" / "live-user-session"
CHROME_CANDIDATES = (
    Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    Path.home() / "Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    Path("/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"),
)


def chrome_binary() -> Path:
    for candidate in CHROME_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        "Google Chrome을 찾을 수 없습니다. 동일한 실행 탭에 연결하려면 Chrome이 필요합니다."
    )


def endpoint(port: int, path: str, method: str = "GET", timeout: float = 1.0):
    request = Request(f"http://127.0.0.1:{port}{path}", method=method)
    with urlopen(request, timeout=timeout) as response:
        body = response.read().decode("utf-8")
    return json.loads(body) if body else None


def endpoint_ready(port: int) -> bool:
    try:
        result = endpoint(port, "/json/version")
        return bool(result and result.get("webSocketDebuggerUrl"))
    except (URLError, TimeoutError, ValueError, OSError):
        return False


def targets(port: int):
    try:
        return endpoint(port, "/json/list") or []
    except (URLError, TimeoutError, ValueError, OSError):
        return []


def same_game_url(url: str, game: Path) -> bool:
    parsed = urlparse(url)
    return parsed.scheme == "file" and Path(unquote(parsed.path)).resolve() == game.resolve()


def close_old_game_targets(port: int, game: Path):
    for target in targets(port):
        if target.get("type") != "page" or not same_game_url(str(target.get("url") or ""), game):
            continue
        target_id = target.get("id")
        if not target_id:
            continue
        try:
            endpoint(port, f"/json/close/{quote(str(target_id))}")
        except (URLError, TimeoutError, ValueError, OSError):
            pass


def navigate_existing_target(port: int, game: Path, game_url: str) -> bool:
    """Reuse the already visible app page so the player never gets a second game window."""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            browser = playwright.chromium.connect_over_cdp(f"http://127.0.0.1:{port}")
            pages = [page for context in browser.contexts for page in context.pages]
            page = next((candidate for candidate in reversed(pages) if same_game_url(candidate.url, game)), None)
            if page is None:
                return False
            page.goto(game_url, wait_until="load")
            page.bring_to_front()
            return True
    except Exception:
        return False


def wait_for_target(port: int, game: Path, timeout: float = 12.0):
    deadline = time.time() + timeout
    while time.time() < deadline:
        for target in targets(port):
            if target.get("type") == "page" and same_game_url(str(target.get("url") or ""), game):
                return target
        time.sleep(0.2)
    return None


def open_live(args) -> int:
    game = args.game.expanduser().resolve()
    if not game.exists():
        raise FileNotFoundError(f"최종 게임 HTML을 찾을 수 없습니다: {game}")
    chrome = chrome_binary()
    profile = args.profile.expanduser().resolve()
    profile.mkdir(parents=True, exist_ok=True)
    args.state.expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)

    digest = hashlib.sha256(game.read_bytes()).hexdigest()[:16]
    query = urlencode({"liveqa": "1", "build": args.build or "local", "artifact": digest})
    game_url = f"{game.as_uri()}?{query}"

    already_running = endpoint_ready(args.port)
    if already_running and navigate_existing_target(args.port, game, game_url):
        target = wait_for_target(args.port, game, timeout=3.0)
        process_pid = None
    else:
        chrome_args = [
        f"--remote-debugging-address=127.0.0.1",
        f"--remote-debugging-port={args.port}",
        f"--user-data-dir={profile}",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-session-crashed-bubble",
        f"--app={game_url}",
        ]
        app_name = "Google Chrome Canary" if "Canary" in chrome.name else "Google Chrome"
        # LaunchServices owns the GUI process. A child started directly from a terminal
        # command can be reaped when that command exits, which would close the shared tab.
        launched = subprocess.run(
            ["/usr/bin/open", "-na", app_name, "--args", *chrome_args],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            timeout=10,
        )
        if launched.returncode != 0:
            raise RuntimeError(f"Chrome 앱 실행 실패: {launched.stderr.strip()}")
        process_pid = None
        deadline = time.time() + 12.0
        while time.time() < deadline and not endpoint_ready(args.port):
            time.sleep(0.2)
        if not endpoint_ready(args.port):
            raise RuntimeError("LaunchServices로 Chrome을 열었지만 QA 연결 포트가 유지되지 않았습니다.")
        target = wait_for_target(args.port, game)
    if not target:
        # 이미 실행 중인 전용 Chrome이 app 인자를 받지 못한 경우 CDP로 같은 URL을 연다.
        endpoint(args.port, f"/json/new?{quote(game_url, safe='')}", method="PUT", timeout=3.0)
        target = wait_for_target(args.port, game, timeout=5.0)
    if not target:
        raise RuntimeError("게임 탭을 열었지만 QA 대상 페이지를 찾지 못했습니다.")

    state = {
        "kind": "caravan_live_qa",
        "startedAt": datetime.now().isoformat(timespec="seconds"),
        "port": args.port,
        "profile": str(profile),
        "game": str(game),
        "url": target.get("url") or game_url,
        "targetId": target.get("id"),
        "build": args.build or "local",
        "artifactSha256": digest,
        "pid": process_pid,
    }
    args.state.expanduser().resolve().write_text(
        json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"동일 화면 QA 연결: 127.0.0.1:{args.port}")
    print(f"실행 파일: {game}")
    print("이 창에서 보이는 탭이 앞으로 QA가 직접 연결할 같은 탭입니다.")
    return 0


def capture_live(args) -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as error:
        raise RuntimeError("Python Playwright가 필요합니다: python3 -m pip install playwright") from error

    state_path = args.state.expanduser().resolve()
    if not state_path.exists():
        raise FileNotFoundError("동일 화면 QA 세션이 없습니다. 바탕화면 실행 버튼으로 게임을 먼저 여세요.")
    state = json.loads(state_path.read_text(encoding="utf-8"))
    port = int(state.get("port") or args.port)
    game = Path(state.get("game") or DEFAULT_GAME).expanduser().resolve()
    if not endpoint_ready(port):
        raise RuntimeError("사용자가 보고 있는 QA Chrome이 닫혀 있습니다. 실행 버튼으로 다시 여세요.")

    args.output.expanduser().resolve().mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    screenshot = args.output.expanduser().resolve() / f"{stamp}-same-live-tab.png"
    report = args.output.expanduser().resolve() / f"{stamp}-same-live-tab.json"

    with sync_playwright() as playwright:
        browser = playwright.chromium.connect_over_cdp(f"http://127.0.0.1:{port}")
        pages = [page for context in browser.contexts for page in context.pages]
        page = next((candidate for candidate in reversed(pages) if same_game_url(candidate.url, game)), None)
        if page is None:
            raise RuntimeError("연결된 Chrome에서 현재 게임 탭을 찾지 못했습니다.")

        page.screenshot(path=str(screenshot), full_page=False)
        runtime = page.evaluate(
            """() => ({
              href: location.href,
              build: typeof GAME_BUILD !== 'undefined' ? GAME_BUILD : null,
              viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio},
              screen: document.querySelector('#app')?.dataset.screen || null,
              eventId: document.querySelector('#ev-sheet')?.dataset.eventId || null,
              storyPhase: document.querySelector('#ev-sheet')?.dataset.storyPhase || null,
              storyStep: document.querySelector('#ev-sheet')?.dataset.storyStep || null,
              title: document.title,
              userAgent: navigator.userAgent
            })"""
        )
    result = {
        "kind": "caravan_same_live_tab_capture",
        "capturedAt": datetime.now().isoformat(timespec="seconds"),
        "session": state,
        "runtime": runtime,
        "screenshot": str(screenshot),
    }
    report.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"사용자와 같은 탭 캡처: {screenshot}")
    print(f"현재 상태 기록: {report}")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="사용자와 QA가 하나의 caravan Chrome 탭을 공유합니다.")
    sub = root.add_subparsers(dest="command", required=True)

    open_parser = sub.add_parser("open", help="공유 QA Chrome 앱 창 열기")
    open_parser.add_argument("--game", type=Path, default=DEFAULT_GAME)
    open_parser.add_argument("--build", default="local")
    open_parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    open_parser.add_argument("--profile", type=Path, default=DEFAULT_PROFILE)
    open_parser.add_argument("--state", type=Path, default=DEFAULT_STATE)
    open_parser.set_defaults(run=open_live)

    capture_parser = sub.add_parser("capture", help="사용자가 보고 있는 동일 탭 캡처")
    capture_parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    capture_parser.add_argument("--state", type=Path, default=DEFAULT_STATE)
    capture_parser.add_argument("--output", type=Path, default=DEFAULT_AUDIT)
    capture_parser.set_defaults(run=capture_live)
    return root


def main() -> int:
    args = parser().parse_args()
    return args.run(args)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"동일 화면 QA 중단: {error}", file=sys.stderr)
        raise SystemExit(1)
