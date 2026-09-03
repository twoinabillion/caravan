#!/usr/bin/env python3
"""Capture one current mobile example for every non-road UI surface."""

from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()
OUT = ROOT / "audits" / "design-consultation-2026-08-22" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)


def settle(page, delay=180):
    page.evaluate(
        """() => document.querySelectorAll('*').forEach(node =>
          node.getAnimations?.().forEach(animation => {
            try { animation.finish(); } catch (_) {}
          }))"""
    )
    page.wait_for_timeout(delay)


def capture(page, filename):
    settle(page)
    page.screenshot(path=str(OUT / filename), type="jpeg", quality=88)


def close_layers(page):
    page.evaluate(
        """() => {
          document.querySelectorAll('.ovl,.sheet-wrap').forEach(node => node.classList.remove('on'));
          const ledger=document.querySelector('#quest-ledger');
          if(ledger){ ledger.classList.remove('on'); ledger.setAttribute('aria-hidden','true'); }
          document.querySelectorAll('.scr').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game')?.classList.add('on');
          document.querySelector('#cheollian-tint')?.classList.remove('on');
        }"""
    )


def force_game(page):
    page.goto(GAME, wait_until="load")
    page.evaluate(
        """() => {
          localStorage.clear();
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','다온','full');
          document.querySelectorAll('.scr').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          document.querySelectorAll('.ovl,.sheet-wrap').forEach(node => node.classList.remove('on'));
          document.querySelector('#arrival-scene')?.classList.remove('on');
          S.party=[];
          S.at='busan';
          S.driving=null;
          UI.renderAll();
        }"""
    )
    settle(page)


def show_event(page, event_id, finish=False):
    close_layers(page)
    opened = page.evaluate(
        """eventId => {
          const event=D.events.find(item => item.id===eventId)
            || (D.seoulStops||[]).find(item => item.id===eventId);
          if(!event) return false;
          UI.showEvent(event);
          return true;
        }""",
        event_id,
    )
    if not opened:
        raise RuntimeError(f"event not found: {event_id}")
    if finish:
        page.evaluate("UI.finishStory()")
    settle(page)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={"width": 480, "height": 860}, device_scale_factor=1)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))

    page.goto(GAME, wait_until="load")
    capture(page, "01-title.jpg")
    page.click("#bt-new")
    capture(page, "02-departure-setup.jpg")
    page.get_by_text("첫 장을 연다", exact=True).click()
    page.wait_for_timeout(220)
    page.click("#scr-intro")
    page.click("#scr-intro")
    capture(page, "03-intro-dialogue.jpg")

    force_game(page)
    show_event(page, "onboarding_first_road")
    capture(page, "04-main-mission-brief.jpg")

    close_layers(page)
    page.click("#dk-objectives")
    capture(page, "05-objective-ledger.jpg")

    close_layers(page)
    page.click(".nav-route-map[data-open-map]")
    capture(page, "06-journey-map.jpg")

    close_layers(page)
    page.click("#dk-status")
    capture(page, "07-bag-supplies.jpg")

    close_layers(page)
    page.click("#dk-menu")
    capture(page, "08-main-menu.jpg")

    page.click("#menu-crew")
    capture(page, "09-crew-roster.jpg")

    close_layers(page)
    page.click("#dk-menu")
    page.click("#dk-journal")
    capture(page, "10-journey-journal.jpg")

    close_layers(page)
    page.click("#dk-menu")
    page.click("#dk-camp")
    capture(page, "11-camp.jpg")

    close_layers(page)
    page.click("#dk-menu")
    page.click("#menu-settings")
    capture(page, "12-settings.jpg")

    close_layers(page)
    page.evaluate("""() => { S.at='daegu'; S.driving=null; UI.renderAll(); UI.showStl('daegu'); }""")
    capture(page, "13-settlement-hub.jpg")

    page.evaluate("UI.showStl('daegu','people')")
    capture(page, "14-settlement-people.jpg")

    close_layers(page)
    page.evaluate("""() => { S.at='daegu'; S.driving=null; UI.renderAll(); UI.showStl('daegu'); }""")
    page.evaluate("UI.showStl('daegu','garage')")
    capture(page, "15-garage-upgrades.jpg")

    show_event(page, "roadcrew_bridge")
    capture(page, "16-event-narration.jpg")

    show_event(page, "meet_scrapyard")
    for _ in range(18):
        if page.locator('#ev-sheet[data-story-turn="dialogue"]').count():
            break
        reader = page.locator("#ev-sheet .story-reader")
        if not reader.count():
            break
        reader.click(position={"x": 200, "y": 100})
        settle(page, 90)
    capture(page, "17-event-dialogue.jpg")

    page.evaluate("UI.finishStory()")
    capture(page, "18-event-choices.jpg")
    page.locator("#ev-wrap .choice:not([disabled])").first.click()
    page.evaluate("UI.finishStory()")
    capture(page, "19-event-result.jpg")

    show_event(page, "patrol_walker", finish=True)
    capture(page, "20-combat-decision.jpg")

    show_event(page, "rq_minji_join", finish=True)
    capture(page, "21-companion-recruitment.jpg")

    close_layers(page)
    page.evaluate("""() => { S.at='seoul'; S.driving=null; UI.renderAll(); UI.showSeoul(); }""")
    capture(page, "22-seoul-core.jpg")

    close_layers(page)
    page.evaluate("UI.showEnding('story_done')")
    capture(page, "23-ending.jpg")
    page.evaluate("UI.showEnding('thirst')")
    capture(page, "24-game-over.jpg")

    browser.close()
    if errors:
        raise RuntimeError(" | ".join(errors))
    print(OUT)
