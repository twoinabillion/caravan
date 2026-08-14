#!/usr/bin/env python3
"""Browser-level contract for the installable phone shell.

Run a local server first and optionally pass its origin as argv[1].
"""
import json
import sys
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright


BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:4179").rstrip("/")
GAME = f"{BASE}/{quote('서울까지400km.html')}?pwa=1"
OUT = Path("/private/tmp/caravan-pwa-runtime")
OUT.mkdir(parents=True, exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)

    android = browser.new_context(
        viewport={"width": 360, "height": 700},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
        user_agent=(
            "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36"
        ),
    )
    page = android.new_page()
    page.goto(GAME, wait_until="domcontentloaded", timeout=60_000)
    page.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.ready", timeout=60_000)
    page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=60_000)

    contract = page.evaluate(
        """async () => {
          const manifestResponse=await fetch('./manifest.webmanifest',{cache:'no-store'});
          const manifest=await manifestResponse.json();
          const iconStatuses=await Promise.all(manifest.icons.map(async icon=>({
            src:icon.src,status:(await fetch(icon.src,{cache:'no-store'})).status
          })));
          return {
            manifestStatus:manifestResponse.status,
            display:manifest.display,
            displayOverride:manifest.display_override,
            orientation:manifest.orientation,
            controlled:Boolean(navigator.serviceWorker.controller),
            iconStatuses
          };
        }"""
    )
    assert contract["manifestStatus"] == 200, contract
    assert contract["display"] == "standalone", contract
    assert "fullscreen" in contract["displayOverride"], contract
    assert contract["orientation"] == "portrait-primary", contract
    assert contract["controlled"], contract
    assert all(icon["status"] == 200 for icon in contract["iconStatuses"]), contract

    cdp = android.new_cdp_session(page)
    app_manifest = cdp.send("Page.getAppManifest")
    assert not app_manifest.get("errors"), app_manifest.get("errors")
    manifest_data = json.loads(app_manifest["data"])
    assert manifest_data["name"] == "서울까지 400km", manifest_data
    installability = cdp.send("Page.getInstallabilityErrors")
    assert not installability.get("installabilityErrors"), installability
    page.screenshot(path=str(OUT / "android-title.png"), full_page=True)
    install_box = page.locator("#bt-install").bounding_box()
    song_box = page.locator("#bt-song").bounding_box()
    assert install_box and song_box and install_box["x"] + install_box["width"] <= song_box["x"], (
        install_box,
        song_box,
    )

    android.set_offline(True)
    page.reload(wait_until="domcontentloaded", timeout=60_000)
    assert page.title() == "서울까지 400km"
    android.set_offline(False)
    android.close()

    iphone = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=3,
        is_mobile=True,
        has_touch=True,
        user_agent=(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 "
            "Mobile/15E148 Safari/604.1"
        ),
    )
    page = iphone.new_page()
    page.goto(GAME, wait_until="domcontentloaded", timeout=60_000)
    page.locator("#bt-install").wait_for(state="visible")
    page.locator("#bt-install").click()
    page.locator("#install-guide.on").wait_for(state="visible")
    assert "홈 화면에 추가" in page.locator("#install-steps").inner_text()
    page.screenshot(path=str(OUT / "iphone-install-guide.png"), full_page=True)
    iphone.close()

    browser.close()

print(f"✅ PWA runtime · service worker control · offline launch · iPhone install guide ({OUT})")
