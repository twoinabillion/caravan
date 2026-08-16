#!/usr/bin/env python3
"""Geometric QA for the option 2 stay ledger and field report."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
URL = (ROOT / "서울까지400km.html").as_uri()
VIEWPORTS = ((320, 578), (360, 700), (390, 844), (475, 948))


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "정렬 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(160)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    for width, height in VIEWPORTS:
        page = browser.new_page(viewport={"width": width, "height": height})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.add_init_script(
            "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
        )
        enter_game(page)
        page.click('[data-journey-mode="local"]')
        page.wait_for_timeout(100)
        stay = page.evaluate(
            """() => {
              const panel=document.querySelector('.journey-local-screen');
              const rows=[...document.querySelectorAll('.journey-local-screen .stop-action-trigger')];
              const pb=panel.getBoundingClientRect();
              return {
                count:rows.length,
                panel:{x:pb.x,y:pb.y,w:pb.width,h:pb.height},
                rows:rows.slice(0,4).map(row=>{
                  const b=row.getBoundingClientRect();
                  const c=row.querySelector('.stop-action-cta').getBoundingClientRect();
                  return {x:b.x,y:b.y,w:b.width,h:b.height,ctaRight:c.right};
                }),
                overflow:panel.scrollWidth>panel.clientWidth+1
              };
            }"""
        )
        assert stay["count"] >= 4, stay
        assert not stay["overflow"], stay
        assert all(row["h"] >= 44 for row in stay["rows"]), stay
        assert all(
            stay["panel"]["x"] - 1 <= row["x"]
            and row["x"] + row["w"] <= stay["panel"]["x"] + stay["panel"]["w"] + 1
            and row["ctaRight"] <= stay["panel"]["x"] + stay["panel"]["w"] + 1
            for row in stay["rows"]
        ), stay

        page.evaluate("UI.showEvent(D.events.find(event => event.id === 'lib_meet'))")
        page.wait_for_timeout(120)
        event = page.evaluate(
            """() => {
              const report=document.querySelector('.event-field-report').getBoundingClientRect();
              const button=document.querySelector('.story-next').getBoundingClientRect();
              const sheet=document.querySelector('#ev-sheet').getBoundingClientRect();
              return {
                report:{x:report.x,y:report.y,w:report.width,h:report.height},
                button:{x:button.x,y:button.y,w:button.width,h:button.height},
                sheet:{x:sheet.x,y:sheet.y,w:sheet.width,h:sheet.height},
                overflow:document.documentElement.scrollWidth>innerWidth+1
              };
            }"""
        )
        assert event["button"]["h"] >= 44, event
        assert event["report"]["x"] >= event["sheet"]["x"] - 1, event
        assert event["report"]["x"] + event["report"]["w"] <= event["sheet"]["x"] + event["sheet"]["w"] + 1, event
        assert not event["overflow"], event
        assert not errors, errors
        print(f"✅ {width}×{height}: 머물기 4행·기록지·계속 버튼 정렬")
        page.close()
    browser.close()

print("✅ option 2 alignment QA passed")
