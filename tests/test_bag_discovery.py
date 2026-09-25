#!/usr/bin/env python3
"""Browser regression coverage for first-viewport bag item discovery."""
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()
ARTIFACTS = ROOT / "artifacts/mobile-actions-20260913/bag"
ITEMS = {
    "부품": ("부품", "개", "정비와 수리"),
    "의약품": ("의약품", "개", "응급처치"),
    "탄약": ("소총탄", "발", "총기"),
    "고철": ("고철", "개", "개조"),
}


def visible_in_viewport(page, selector):
    return page.locator(selector).evaluate(
        """node => {
          const r=node.getBoundingClientRect();
          return r.top >= -0.5 && r.bottom <= innerHeight + 0.5 &&
            r.left >= -0.5 && r.right <= innerWidth + 0.5;
        }"""
    )


@pytest.mark.parametrize("width,height", [(320, 578), (320, 640), (390, 844)])
def test_each_bag_item_reveals_complete_detail_in_first_viewport(width, height):
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": width, "height": height})
        page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
        page.goto(URL)
        page.evaluate(
            """() => {
              G.newGame('onroad','가방 점검','full');
              S.flags.main_mission_started=true;
              S.flags.onboarding_event_guide=true;
              S.water=2; S.food=2; S.fuel=8; S.van=28; S.hunger=2;
              S.items['부품']=12; S.items['의약품']=3; S.items['탄약']=18; S.scrap=27;
              UI.restoreQaView({screen:'game'});
              document.documentElement.classList.remove('qa-exact-replay');
            }"""
        )
        page.locator("#dk-status").click()
        page.wait_for_timeout(120)

        # Supply totals and urgent low-supply, hunger, and vehicle state stay exposed.
        for selector in (".bag-critical", ".bag-supply-head", ".bag-vehicle-state"):
            assert visible_in_viewport(page, selector), selector
        overview = page.locator(".bag-journey-overview")
        assert overview.evaluate("node => node.classList.contains('is-supply-low')")
        assert page.locator(".bag-hunger-state").evaluate(
            "node => node.classList.contains('is-warn')"
        )
        assert page.locator(".bag-vehicle-state").evaluate(
            "node => node.classList.contains('is-warn')"
        )
        assert page.locator(".bag-meal-disclosure").get_attribute("open") == (
            None if height <= 650 else ""
        )

        content = page.locator(".bag-live-content")
        bag = page.locator("#status-prop")
        assert content.evaluate("node => node.scrollTop") == 0
        bag_bottom = bag.evaluate("node => node.getBoundingClientRect().bottom")
        for button in page.locator(".bag-pocket").all():
            assert button.evaluate(
                "(node, bottom) => node.getBoundingClientRect().bottom <= bottom + 0.5",
                bag_bottom,
            )
        for item_id, (name, unit, meaning) in ITEMS.items():
            page.locator(f'[data-bag-item="{item_id}"]').click()
            page.wait_for_timeout(40)
            assert content.evaluate("node => node.scrollTop") == 0, item_id
            assert visible_in_viewport(page, ".bag-detail"), item_id
            assert page.locator(".bag-detail").evaluate(
                "(node, bottom) => node.getBoundingClientRect().bottom <= bottom + 0.5",
                bag_bottom,
            ), item_id
            assert visible_in_viewport(page, ".bag-detail-heading"), item_id
            assert visible_in_viewport(page, ".bag-detail p"), item_id
            assert page.locator(".bag-detail-heading span").inner_text() == name
            assert page.locator(".bag-detail-heading b").inner_text().endswith(unit)
            assert meaning in page.locator(".bag-detail p").inner_text()
            assert page.locator(".bag-detail p").evaluate(
                "node => node.scrollHeight <= node.clientHeight + 1"
            ), item_id
            detail_bottom = page.locator(".bag-detail").evaluate(
                "node => node.getBoundingClientRect().bottom"
            )
            current_bag_bottom = bag.evaluate("node => node.getBoundingClientRect().bottom")
            assert current_bag_bottom - detail_bottom <= 32, (
                item_id,
                current_bag_bottom,
                detail_bottom,
            )

        page.screenshot(path=str(ARTIFACTS / f"{width}x{height}-bag-first-viewport.png"))
        if height <= 650:
            page.set_viewport_size({"width": 390, "height": 844})
            assert page.locator(".bag-meal-disclosure summary").is_visible()
            assert page.locator(".bag-meal-disclosure summary").evaluate(
                "node => node.getBoundingClientRect().height >= 44"
            )
            page.locator(".bag-meal-disclosure summary").click()
            assert page.locator(".bag-meal-plan").is_visible()
        browser.close()


@pytest.mark.parametrize("resize_from_tall", [False, True])
def test_narrow_bag_labels_and_counts_fit_inside_their_cards(resize_from_tall):
    """Catch legacy transforms and grid tracks placing quantity text below a tile."""
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390 if resize_from_tall else 320,
                                          "height": 844 if resize_from_tall else 640})
        page.goto(URL)
        page.evaluate("""() => {
          G.newGame('onroad','가방 검수','full');
          S.flags.main_mission_started=true;S.flags.onboarding_event_guide=true;
          S.items['부품']=999;S.items['의약품']=123;S.items['탄약']=999;S.scrap=1234;
          UI.restoreQaView({screen:'game'});
          document.documentElement.classList.remove('qa-exact-replay');
        }""")
        page.locator('#dk-status').click()
        if resize_from_tall:
            page.set_viewport_size({"width": 320, "height": 640})
        page.wait_for_timeout(150)
        violations = page.locator('.bag-pocket').evaluate_all("""cards => cards.flatMap(card => {
          const box=card.getBoundingClientRect();
          const name=card.querySelector('.bag-pocket-name').getBoundingClientRect();
          const amount=card.querySelector('.bag-pocket-count').getBoundingClientRect();
          const icon=card.querySelector('.ico').getBoundingClientRect();
          const issues=[];
          for(const [label,r] of [['name',name],['count',amount]]){
            if(r.left<box.left+3||r.right>box.right-3||r.top<box.top+3||r.bottom>box.bottom-3)
              issues.push({item:card.innerText,label,box:box.toJSON(),text:r.toJSON()});
          }
          if(name.bottom>amount.top+0.5 || name.left<icon.right+2)
            issues.push({item:card.innerText,reason:'name overlaps quantity or icon'});
          return issues;
        })""")
        assert not violations, violations
        assert visible_in_viewport(page, '.bag-detail p')
        assert page.locator('.bag-detail').evaluate("""node =>
          node.getBoundingClientRect().bottom <= node.closest('#status-prop').getBoundingClientRect().bottom + 0.5
        """)
        browser.close()
