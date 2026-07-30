#!/usr/bin/env python3
"""인트로 전 장을 모바일 화면으로 캡처하고 내부 스크롤을 점검한다."""
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
    page.fill("#inp-name", "다온")
    page.click("#bt-name")

    metrics = []
    count = page.evaluate("D.intro.length")
    for index in range(count):
        beat_count = page.evaluate(f"D.intro[{index}].beats.length")
        for beat_index in range(beat_count):
            if beat_index:
                page.click("#scr-intro")
            page.wait_for_timeout(180)
            page.screenshot(
                path=str(
                    SHOT
                    / f"{index + 1:02d}-{beat_index + 1:02d}-"
                    f"{page.evaluate(f'D.intro[{index}].scene')}.png"
                )
            )

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
                scrollTop:pageEl.scrollTop,
                bookHeight:Math.round(book.getBoundingClientRect().height),
                visualHeight:Math.round(visual.getBoundingClientRect().height),
                needsScroll:pageEl.scrollHeight>pageEl.clientHeight+2,
                newestVisible:(() => {
                  const newest=document.querySelector('#intro-txt [data-story-entry]:last-child');
                  if(!newest) return false;
                  const newestBox=newest.getBoundingClientRect();
                  const pageBox=pageEl.getBoundingClientRect();
                  return newestBox.top>=pageBox.top-1 && newestBox.bottom<=pageBox.bottom+1;
                })()
              };
            }"""
        )
        metrics.append(info)
        if index + 1 < count:
            page.click("#scr-intro")

    browser.close()
    print(SHOT)
    print(json.dumps(metrics, ensure_ascii=False, indent=2))
    overflow = [item["scene"] for item in metrics if item["needsScroll"]]
    hidden = [item["scene"] for item in metrics if not item["newestVisible"]]
    if overflow:
        print("대화 누적으로 자동 스크롤 사용: " + ", ".join(overflow))
    if hidden:
        print("현재 턴이 안전 영역 밖에 있음: " + ", ".join(hidden))
        sys.exit(1)
