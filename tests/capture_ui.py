#!/usr/bin/env python3
"""핵심 모바일 UI 상태를 한 번에 캡처한다.

현재 빌드 산출물을 기준으로 지도, 상태, 정비소, 이벤트 시트를 남긴다.
디자인 회귀를 눈으로 비교할 때 쓰는 보조 도구다.
"""
import pathlib
from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "서울까지400km.html").as_uri()
SHOT = ROOT / "tests" / "shots" / "ui"
SHOT.mkdir(parents=True, exist_ok=True)


def enter_game(page):
    page.goto(URL)
    page.wait_for_timeout(500)
    page.click("#bt-new")
    page.click("#mode-on")
    for _ in range(page.evaluate("D.intro.length")):
        page.click("#scr-intro")
        page.wait_for_timeout(80)
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.wait_for_timeout(350)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(
        viewport={"width": 480, "height": 860},
        device_scale_factor=1,
    )
    enter_game(page)
    page.evaluate(
        """() => {
          S.at = 'daegu';
          S.known = [...new Set([...S.known, 'daegu', 'gumi', 'daejeon', 'jeonju'])];
          S.party = ['minji', 'parkss', 'leo'];
          S.items['부품'] = 5;
          S.scrap = 48;
          S.up = {tank1:true, bench:true, susp:true, collector:true, antenna:true};
          S.quest = {
            kind:'procure', need:{name:'부품', qty:8}, from:'daegu',
            to:'daejeon', reward:22, due:S.day + 2
          };
          S.flags.ai_identified = true;
          S.flags.gp_envelope_found = true;
          S.flags.resist_revealed = true;
          S.flags.cell_road = true;
          UI.renderAll();
        }"""
    )
    page.wait_for_timeout(250)
    page.screenshot(path=str(SHOT / "01-main.png"))

    page.click("#dk-map")
    page.wait_for_timeout(300)
    page.screenshot(path=str(SHOT / "02-map.png"))
    page.click("#map-mode-vworld")
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "02b-map-vworld-setup.png"))
    page.click("#vworld-cancel")
    page.click("#map-x")

    page.click("#dk-status")
    page.wait_for_timeout(200)
    page.screenshot(path=str(SHOT / "03-status-top.png"))
    page.click('#st-tabs [data-st="journey"]')
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "04-status-journey.png"))
    page.click('#st-tabs [data-st="crew"]')
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "05-status-crew.png"))
    page.click("#st-x")

    page.evaluate("UI.showStl('daegu')")
    page.wait_for_timeout(200)
    page.locator("#garage").scroll_into_view_if_needed()
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "06-garage-fuel.png"))
    page.click('#garage [data-ug="chassis"]')
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "07-garage-chassis.png"))
    page.evaluate("document.querySelector('#ovl-stl').classList.remove('on')")

    page.evaluate("G.openEventById('roadbeat_200_archive')")
    page.wait_for_timeout(200)
    page.screenshot(path=str(SHOT / "08-event-context.png"))

    browser.close()
    print(SHOT)
