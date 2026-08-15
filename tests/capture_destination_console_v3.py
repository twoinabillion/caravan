#!/usr/bin/env python3
"""Capture and interaction-check the selected destination console v3."""
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()
OUT = Path(os.environ.get(
    "CARAVAN_DESTINATION_AUDIT_DIR",
    ROOT / "audits" / "destination-console-v3-2026-08-12",
))
OUT.mkdir(parents=True, exist_ok=True)


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(250)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel=os.environ.get("CARAVAN_BROWSER_CHANNEL") or None)
    page = browser.new_page(viewport={"width": 480, "height": 860}, device_scale_factor=1)
    errors = []
    page.on("console", lambda message: errors.append(message.text)
            if message.type == "error" and "Failed to load resource" not in message.text else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    enter_game(page)

    page.wait_for_timeout(220)
    page.locator("#app").screenshot(path=str(OUT / "01-route-primary.png"))
    active_departure = page.locator(".nav-destination-card.is-selected[data-nav-depart]")
    if active_departure.count() != 1:
        raise SystemExit("selected destination card is not the single departure action")
    primary = page.locator(".route-console-v3").get_attribute("data-route-console")
    next_button = page.locator("[data-nav-next]")
    had_next = next_button.is_enabled()
    if had_next:
        next_button.click(force=True)
        page.wait_for_timeout(160)
    secondary = page.locator(".route-console-v3").get_attribute("data-route-console")
    debug_routes = page.evaluate("""() => ({
      selected:document.querySelector('.route-console-v3')?.dataset.routeConsole,
      cards:[...document.querySelectorAll('.nav-destination-card')].map(card=>({id:card.dataset.routeSelect,pressed:card.getAttribute('aria-pressed')})),
      nextDisabled:document.querySelector('[data-nav-next]')?.disabled
    })""")
    page.locator("#app").screenshot(path=str(OUT / "02-route-secondary.png"))

    page.click('[data-journey-mode="local"]')
    page.wait_for_timeout(160)
    page.locator("#app").screenshot(path=str(OUT / "03-stay-mode.png"))
    page.click('[data-journey-mode="route"]')
    page.wait_for_timeout(160)

    metrics = page.evaluate("""() => {
      const app=document.querySelector('#app').getBoundingClientRect();
      const consoleBox=document.querySelector('.route-console-v3').getBoundingClientRect();
      const screen=document.querySelector('.route-console-screen').getBoundingClientRect();
      const map=document.querySelector('.nav-route-map').getBoundingClientRect();
      const summary=document.querySelector('.nav-route-summary').getBoundingClientRect();
      const carousel=document.querySelector('.nav-destination-carousel').getBoundingClientRect();
      const description=document.querySelector('.nav-place-description');
      const selectedCard=document.querySelector('.nav-destination-card.is-selected').getBoundingClientRect();
      const dock=document.querySelector('#dock').getBoundingClientRect();
      const rocker=[...document.querySelectorAll('.journey-rocker button')].map(button=>({
        label:button.textContent.trim(),selected:button.getAttribute('aria-selected'),
        box:button.getBoundingClientRect().toJSON()
      }));
      return {app:app.toJSON(),consoleBox:consoleBox.toJSON(),screen:screen.toJSON(),map:map.toJSON(),summary:summary.toJSON(),
        carousel:carousel.toJSON(),selectedCard:selectedCard.toJSON(),description:description.textContent.trim(),
        descriptionLines:Math.round(description.getBoundingClientRect().height/parseFloat(getComputedStyle(description).lineHeight)),dock:dock.toJSON(),rocker,
        bodyOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth};
    }""")
    if errors:
        raise SystemExit(f"browser errors: {errors}")
    if had_next and primary == secondary:
        raise SystemExit(f"destination carousel did not change selection: {debug_routes}")
    if metrics["bodyOverflow"] or metrics["dock"]["bottom"] > 861:
        raise SystemExit(f"viewport overflow: {metrics}")
    if metrics["consoleBox"]["width"] < 430 or metrics["screen"]["width"] < 300:
        raise SystemExit(f"console geometry too small: {metrics}")
    ratios = [metrics[name]["height"] / metrics["screen"]["height"] for name in ("map", "summary", "carousel")]
    if not (0.41 <= ratios[0] <= 0.45 and 0.24 <= ratios[1] <= 0.28 and 0.29 <= ratios[2] <= 0.33):
        raise SystemExit(f"option 3 vertical proportions drifted: {ratios}")
    if metrics["selectedCard"]["width"] < 180 or metrics["selectedCard"]["height"] < 105:
        raise SystemExit(f"selected destination image too small: {metrics['selectedCard']}")
    if len(metrics["description"]) < 45 or metrics["descriptionLines"] < 2:
        raise SystemExit(f"destination description collapsed: {metrics['description']!r}")
    if any(item["box"]["height"] < 44 for item in metrics["rocker"]):
        raise SystemExit(f"rocker touch target too small: {metrics['rocker']}")

    page.set_viewport_size({"width": 360, "height": 700})
    page.wait_for_timeout(180)
    page.locator("#app").screenshot(path=str(OUT / "04-route-360x700.png"))
    narrow = page.evaluate("""() => {
      const consoleBox=document.querySelector('.route-console-v3').getBoundingClientRect();
      const card=document.querySelector('.nav-destination-card.is-selected').getBoundingClientRect();
      return {consoleBox:consoleBox.toJSON(),card:card.toJSON(),
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth};
    }""")
    if narrow["overflow"] or narrow["consoleBox"]["right"] > 361 or narrow["card"]["width"] < 130:
        raise SystemExit(f"narrow viewport compression: {narrow}")

    departure_probe = browser.new_page(viewport={"width": 480, "height": 860}, device_scale_factor=1)
    departure_probe.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    enter_game(departure_probe)
    departure_probe.locator(".nav-destination-card.is-selected[data-nav-depart]").click()
    departure_probe.wait_for_timeout(120)
    departed = departure_probe.evaluate("() => Boolean(S.driving) && S.at === null")
    departure_probe.close()
    if not departed:
        raise SystemExit("selected destination card did not begin travel")
    print({"primary": primary, "secondary": secondary, "metrics": metrics, "errors": errors})
    browser.close()
