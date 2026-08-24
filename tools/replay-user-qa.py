#!/usr/bin/env python3
"""Replay the latest player-exported QA snapshot against the exact game artifact."""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote, urlparse

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DOWNLOADS = Path.home() / "Downloads"
DEFAULT_OUTPUT = ROOT / "audits" / "current-user-state"
SNAPSHOT_KIND = "seoul400_exact_state_qa"


def latest_snapshot() -> Path:
    candidates = sorted(
        DEFAULT_DOWNLOADS.glob("서울까지400km-QA-*.json"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        raise FileNotFoundError(
            "다운로드 폴더에 QA 파일이 없습니다. 게임의 메뉴 > 설정 > 같은 화면 QA에서 먼저 파일을 만드세요."
        )
    return candidates[0]


def artifact_url(payload: dict) -> str:
    href = str(payload.get("artifact", {}).get("href") or "")
    if not href:
        raise ValueError("QA 파일에 실행 HTML 주소가 없습니다.")
    parsed = urlparse(href)
    if parsed.scheme == "file":
        path = Path(unquote(parsed.path))
        if not path.exists():
            raise FileNotFoundError(f"사용자가 보던 실행 파일을 찾을 수 없습니다: {path}")
    return href


def browser_engine(payload: dict, requested: str) -> str:
    if requested != "auto":
        return requested
    ua = str(payload.get("environment", {}).get("userAgent") or "").lower()
    if "firefox" in ua:
        return "firefox"
    if "safari" in ua and "chrome" not in ua and "chromium" not in ua:
        return "webkit"
    return "chromium"


def main() -> int:
    parser = argparse.ArgumentParser(description="현재 사용자가 보는 caravan 화면을 같은 상태로 재생합니다.")
    parser.add_argument("snapshot", nargs="?", type=Path, help="QA JSON. 생략하면 Downloads의 최신 파일 사용")
    parser.add_argument("--engine", choices=("auto", "chromium", "webkit", "firefox"), default="auto")
    parser.add_argument("--headed", action="store_true", help="브라우저 창을 실제로 표시")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    snapshot_path = (args.snapshot or latest_snapshot()).expanduser().resolve()
    payload = json.loads(snapshot_path.read_text(encoding="utf-8"))
    if payload.get("kind") != SNAPSHOT_KIND:
        raise ValueError("서울까지 400km의 동일 화면 QA 파일이 아닙니다.")

    href = artifact_url(payload)
    display = payload.get("display") or {}
    environment = payload.get("environment") or {}
    width = max(280, int(round(float(display.get("innerWidth") or 390))))
    height = max(480, int(round(float(display.get("innerHeight") or 844))))
    dpr = min(4.0, max(1.0, float(display.get("devicePixelRatio") or 1)))
    engine = browser_engine(payload, args.engine)
    args.output.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    screenshot_path = args.output / f"{stamp}-{engine}-{width}x{height}.png"
    report_path = args.output / f"{stamp}-report.json"
    init_payload = json.dumps(payload.get("storage") or {}, ensure_ascii=False)
    init_script = f"""
      (() => {{
        const storage = {init_payload};
        try {{
          localStorage.clear();
          Object.entries(storage.local || {{}}).forEach(([key, value]) => localStorage.setItem(key, value));
          sessionStorage.clear();
          Object.entries(storage.session || {{}}).forEach(([key, value]) => sessionStorage.setItem(key, value));
          localStorage.setItem('caravan_story_auto', '0');
        }} catch (error) {{ console.error('qa-state-restore', error); }}
      }})();
    """

    with sync_playwright() as playwright:
        browser_type = getattr(playwright, engine)
        try:
            browser = browser_type.launch(headless=not args.headed)
        except PlaywrightError as error:
            raise RuntimeError(
                f"{engine} 브라우저를 열 수 없습니다. `python3 -m playwright install {engine}` 후 다시 실행하세요."
            ) from error

        context = browser.new_context(
            viewport={"width": width, "height": height},
            screen={
                "width": int(display.get("screenWidth") or width),
                "height": int(display.get("screenHeight") or height),
            },
            device_scale_factor=dpr,
            user_agent=environment.get("userAgent") or None,
            locale=environment.get("language") or "ko-KR",
            color_scheme=display.get("colorScheme") if display.get("colorScheme") in ("light", "dark") else "dark",
            reduced_motion="reduce" if display.get("reducedMotion") else "no-preference",
            has_touch=bool(environment.get("maxTouchPoints")),
        )
        page = context.new_page()
        page.add_init_script(init_script)
        page.goto(href, wait_until="load")
        page.wait_for_timeout(500)

        runtime_build = page.evaluate("() => typeof GAME_BUILD !== 'undefined' ? GAME_BUILD : null")
        expected_build = payload.get("build")
        if runtime_build != expected_build:
            browser.close()
            raise RuntimeError(
                f"빌드가 다릅니다. 사용자 화면={expected_build}, QA 실행 파일={runtime_build}. 같은 HTML이 아니므로 캡처를 중단합니다."
            )

        restored = page.evaluate(
            """async view => {
              if (typeof UI === 'undefined' || !UI.restoreQaView) return {ok:false, why:'이 빌드는 동일 화면 QA를 지원하지 않습니다'};
              return await UI.restoreQaView(view);
            }""",
            payload.get("ui"),
        )
        if not restored or not restored.get("ok"):
            browser.close()
            raise RuntimeError(str((restored or {}).get("why") or "화면 상태를 복원하지 못했습니다."))

        page.wait_for_timeout(250)
        page.screenshot(path=str(screenshot_path), full_page=False)
        runtime = page.evaluate(
            """() => ({
              build: typeof GAME_BUILD !== 'undefined' ? GAME_BUILD : null,
              viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio},
              screen: document.querySelector('#app')?.dataset.screen || null,
              eventId: document.querySelector('#ev-sheet')?.dataset.eventId || null,
              replayFrozen: document.documentElement.classList.contains('qa-exact-replay')
            })"""
        )
        browser.close()

    report = {
        "snapshot": str(snapshot_path),
        "artifact": href,
        "requestedBuild": payload.get("build"),
        "engine": engine,
        "headed": args.headed,
        "restored": restored,
        "runtime": runtime,
        "screenshot": str(screenshot_path),
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"동일 상태 QA 캡처: {screenshot_path}")
    print(f"재현 정보: {report_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"QA 재현 중단: {error}", file=sys.stderr)
        raise SystemExit(1)
