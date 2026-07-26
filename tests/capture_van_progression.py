#!/usr/bin/env python3
"""달구지 좌석·거주 확장 단계가 주행 외형과 맞는지 비교 캡처한다."""

import pathlib

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "서울까지400km.html").as_uri()
SHOT = ROOT / "tests" / "shots" / "van-progression"
SHOT.mkdir(parents=True, exist_ok=True)

STAGES = [
    ("01-base", [], ["minji", "parkss"]),
    ("02-bench", ["bench"], ["minji", "parkss", "leo"]),
    ("03-cabin", ["bench", "cabin"], ["minji", "parkss", "leo", "kangwoo"]),
    ("04-bunk", ["bench", "cabin", "bunk"], ["minji", "parkss", "leo", "kangwoo", "eunsu"]),
    (
        "05-jumpseat",
        ["bench", "cabin", "bunk", "jumpseat"],
        ["minji", "parkss", "leo", "kangwoo", "eunsu", "jaeyi"],
    ),
]


def enter_game(page):
    page.goto(URL)
    page.wait_for_timeout(500)
    page.click("#bt-new")
    page.click("#mode-on")
    for _ in range(page.evaluate("D.intro.length")):
        page.click("#scr-intro")
        page.wait_for_timeout(50)
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.wait_for_timeout(300)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(
        viewport={"width": 480, "height": 860},
        device_scale_factor=1,
    )
    enter_game(page)
    for filename, upgrades, party in STAGES:
        page.evaluate(
            """({upgrades, party}) => {
              S.up = Object.fromEntries(upgrades.map(id => [id, true]));
              S.party = party;
              S.min = 19 * 60;
              S.wx = 'clear';
              S.driving = {
                from:'busan', to:'ulsan', dist:55, gone:2,
                road:'high', wx:'clear', slots:[], si:0
              };
              S.driveSpeed = 1;
              UI.renderAll();
            }""",
            {"upgrades": upgrades, "party": party},
        )
        page.wait_for_timeout(180)
        page.screenshot(path=str(SHOT / f"{filename}.png"))

    page.evaluate(
        """() => {
          S.driving = null;
          S.at = 'daegu';
          S.items['부품'] = 12;
          S.scrap = 180;
          S.up = {bench:true};
          UI.showStl('daegu');
        }"""
    )
    page.wait_for_timeout(200)
    page.click('#garage [data-ug="seating"]')
    page.wait_for_timeout(120)
    page.locator("#garage .upgrade-group").scroll_into_view_if_needed()
    page.wait_for_timeout(80)
    page.screenshot(path=str(SHOT / "06-garage-seating.png"))

    browser.close()
    print(SHOT)
