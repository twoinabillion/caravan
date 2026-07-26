#!/usr/bin/env python3
"""12장 인트로를 모바일 화면으로 캡처하고 내부 스크롤을 점검한다."""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "서울까지400km.html").as_uri()
SHOT = ROOT / "tests" / "shots" / "intro"
SHOT.mkdir(parents=True, exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={"width": 480, "height": 860})
    page.goto(URL)
    page.wait_for_timeout(450)
    page.click("#bt-new")
    page.click("#mode-on")

    metrics = []
    count = page.evaluate("D.intro.length")
    for index in range(count):
        page.wait_for_timeout(120)
        info = page.evaluate(
            """() => {
              const pageEl=document.querySelector('#intro-page');
              const book=document.querySelector('#intro-book');
              const visual=document.querySelector('#intro-visual');
              const data=D.intro[Number(document.querySelector('#intro-count').textContent.split('/')[0])-1];
              return {
                scene:data.scene,
                title:data.title,
                pageClient:pageEl.clientHeight,
                pageScroll:pageEl.scrollHeight,
                bookHeight:Math.round(book.getBoundingClientRect().height),
                visualHeight:Math.round(visual.getBoundingClientRect().height),
                needsScroll:pageEl.scrollHeight>pageEl.clientHeight+2
              };
            }"""
        )
        metrics.append(info)
        page.screenshot(path=str(SHOT / f"{index + 1:02d}-{info['scene']}.png"))
        if index + 1 < count:
            page.click("#scr-intro")

    browser.close()
    print(SHOT)
    print(json.dumps(metrics, ensure_ascii=False, indent=2))
    overflow = [item["scene"] for item in metrics if item["needsScroll"]]
    if overflow:
        print("인트로 내부 스크롤 발생: " + ", ".join(overflow))
        sys.exit(1)
