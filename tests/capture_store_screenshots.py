#!/usr/bin/env python3
"""앱인토스 등록용 636×1048 세로 스크린샷을 실제 게임 화면에서 만든다."""
import pathlib
from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "서울까지400km.html").as_uri()
OUT = ROOT / "assets" / "store"
OUT.mkdir(parents=True, exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(
        # 480×791 CSS 화면을 1.325배로 캡처하면 앱이 가로를 꽉 채운
        # 636×1048 등록 이미지가 된다.
        viewport={"width": 480, "height": 791},
        device_scale_factor=1.325,
    )
    page.goto(URL)
    page.wait_for_timeout(650)
    page.click("#bt-preview")
    page.wait_for_timeout(500)

    scroll = page.locator("#preview-scroll")
    scroll.evaluate("(el) => { el.scrollTop = 0; }")
    page.wait_for_timeout(180)
    page.screenshot(path=str(OUT / "01-road-album.png"))

    page.evaluate(
        """(index) => {
          const el=document.querySelector('#preview-scroll');
          const card=document.querySelectorAll('#preview-grid .preview-card')[index];
          el.scrollTop += card.getBoundingClientRect().top - el.getBoundingClientRect().top - 10;
        }""",
        2,
    )
    page.wait_for_timeout(260)
    page.screenshot(path=str(OUT / "02-people-and-traces.png"))

    page.evaluate(
        """(index) => {
          const el=document.querySelector('#preview-scroll');
          const card=document.querySelectorAll('#preview-grid .preview-card')[index];
          el.scrollTop += card.getBoundingClientRect().top - el.getBoundingClientRect().top - 10;
        }""",
        4,
    )
    page.wait_for_timeout(260)
    page.screenshot(path=str(OUT / "03-combat-and-van-life.png"))

    scroll.evaluate("(el) => { el.scrollTop = el.scrollHeight; }")
    page.wait_for_timeout(260)
    page.screenshot(path=str(OUT / "04-van-life.png"))

    browser.close()
    print(OUT)
