#!/usr/bin/env python3
"""자연스러움·지도 정리 전후의 현재 모바일 화면을 캡처한다."""
import argparse
import pathlib

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[2]
URL = (ROOT / "서울까지400km.html").as_uri()


def advance_intro(page, turn_count):
    for _ in range(turn_count):
        page.click("#scr-intro")
        page.wait_for_timeout(35)


def finish_intro(page, already_advanced):
    remaining = page.evaluate("D.intro.reduce((n,p)=>n+p.beats.length,0)") - already_advanced
    for _ in range(remaining):
        page.click("#scr-intro")
        page.wait_for_timeout(25)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("label", choices=("before", "after"))
    args = parser.parse_args()
    out = pathlib.Path(__file__).parent / args.label
    out.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 480, "height": 860})
        page.goto(URL)
        page.wait_for_timeout(450)
        page.click("#bt-new")
        page.click("#mode-on")
        page.fill("#inp-name", "다온")
        page.click("#bt-name")
        advance_intro(page, 6)
        page.wait_for_timeout(120)
        page.screenshot(path=str(out / "01-intro-conversation.png"))

        finish_intro(page, 6)
        page.wait_for_timeout(250)
        page.evaluate(
            """() => {
              S.at='daejeon';
              S.known=Object.keys(D.nodes).filter(id=>D.nodes[id].type!=='hidden');
              S.visited=['busan','miryang','daegu','gumi','daejeon'];
              S.party=['minji','parkss','leo'];
              UI.renderAll();
              document.querySelector('#dk-map').click();
            }"""
        )
        page.wait_for_timeout(280)
        page.screenshot(path=str(out / "02-map.png"))
        page.click("#map-x")

        page.evaluate("UI.showEvent(D.events.find(item=>item.id==='rq_kangwoo_join'))")
        for _ in range(4):
            page.locator("#ev-sheet .story-next").click()
            page.wait_for_timeout(70)
        page.wait_for_timeout(120)
        page.screenshot(path=str(out / "03-recruit-conversation.png"))
        browser.close()

    print(out)


if __name__ == "__main__":
    main()
