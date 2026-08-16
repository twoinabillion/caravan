#!/usr/bin/env python3
"""Capture the dialogue, decision, and outcome states of one story instance."""
from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
URL = (ROOT / "서울까지400km.html").as_uri()


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "이벤트 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def metrics(page):
    return page.evaluate(
        """() => {
          const root=document.querySelector('#ev-sheet');
          const visible=node=>{
            const s=getComputedStyle(node),b=node.getBoundingClientRect();
            return s.display!=='none'&&s.visibility!=='hidden'&&b.width>0&&b.height>0;
          };
          const controls=[...root.querySelectorAll('button,[role="button"]')].filter(visible);
          const escaped=controls.filter(node=>{const b=node.getBoundingClientRect();return b.left<-1||b.right>innerWidth+1||b.top<-1||b.bottom>innerHeight+1;});
          const small=controls.filter(node=>{const b=node.getBoundingClientRect();return b.width<44||b.height<44;});
          const report=root.querySelector('.event-field-report')?.getBoundingClientRect();
          const scene=root.querySelector('.event-scene-frame')?.getBoundingClientRect();
          const dock=root.querySelector('.event-choice-dock')?.getBoundingClientRect();
          return {
            phase:root.dataset.storyPhase||'',step:root.dataset.storyStep||'',
            viewport:[innerWidth,innerHeight],scrollHeight:root.scrollHeight,clientHeight:root.clientHeight,
            escaped:escaped.map(node=>node.textContent.trim().slice(0,60)),
            small:small.map(node=>{const b=node.getBoundingClientRect();return [node.textContent.trim().slice(0,30),Math.round(b.width),Math.round(b.height)];}),
            scene:scene&&[Math.round(scene.x),Math.round(scene.y),Math.round(scene.width),Math.round(scene.height)],
            report:report&&[Math.round(report.x),Math.round(report.y),Math.round(report.width),Math.round(report.height)],
            dock:dock&&[Math.round(dock.x),Math.round(dock.y),Math.round(dock.width),Math.round(dock.height)]
          };
        }"""
    )


def shot(page, width, height, name, records):
    page.wait_for_timeout(120)
    page.screenshot(path=OUT / f"{width}x{height}-{name}.png")
    records[f"{width}x{height}-{name}"] = metrics(page)


def capture(browser, width, height, records, errors):
    page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
    page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    page.on("pageerror", lambda error: errors.append(f"{width}x{height}: {error}"))
    page.on("console", lambda message: errors.append(f"{width}x{height} console: {message.text}") if message.type == "error" else None)
    page.on("response", lambda response: errors.append(f"{width}x{height} response {response.status}: {response.url}") if response.status >= 400 else None)
    enter_game(page)
    page.evaluate("UI.showEvent(D.events.find(event => event.id === 'story_family_key'))")
    for _ in range(4):
        page.click(".story-next")
        page.wait_for_timeout(60)
    shot(page, width, height, "01-dialogue", records)
    page.evaluate("UI.finishStory()")
    shot(page, width, height, "02-decision", records)
    page.locator(".event-choice-dock .choice[data-i]:not([disabled])").first.click()
    shot(page, width, height, "03-outcome", records)
    page.close()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    records = {}
    errors = []
    for viewport in ((320, 578), (390, 844), (475, 948)):
        capture(browser, *viewport, records, errors)
    browser.close()
    (OUT / "metrics.json").write_text(
        json.dumps({"states": records, "errors": errors}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps({"states": len(records), "errors": errors}, ensure_ascii=False))
