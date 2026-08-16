#!/usr/bin/env python3
"""Current-run mobile capture and geometry inventory for every primary surface."""
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
    page.fill("#inp-name", "전수 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(170)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def geometry(page, root_selector="#app"):
    return page.evaluate(
        """rootSelector => {
          const root=document.querySelector(rootSelector)||document.querySelector('#app');
          const visible=node=>{
            const s=getComputedStyle(node),b=node.getBoundingClientRect();
            return s.display!=='none'&&s.visibility!=='hidden'&&b.width>0&&b.height>0;
          };
          const label=node=>{
            const raw=node.getAttribute('aria-label')||node.textContent||node.id||node.className||node.tagName;
            return String(raw).replace(/\\s+/g,' ').trim().slice(0,72);
          };
          const controls=[...root.querySelectorAll('button,[role="button"],a[href],input')].filter(node=>
            visible(node)&&!node.closest('[aria-hidden="true"],.sr-only,[inert]'));
          const escaped=controls.filter(node=>{const b=node.getBoundingClientRect();return b.left<-1||b.right>innerWidth+1||b.top<-1||b.bottom>innerHeight+1;});
          const small=controls.filter(node=>{
            if(node.matches('.nav-carousel-dots button')) return false;
            const b=node.getBoundingClientRect();return b.width<43.5||b.height<43.5;
          });
          const clipped=[...root.querySelectorAll('h1,h2,h3,h4,p,b,small,span,button')].filter(node=>{
            if(!visible(node)||node.closest('.sr-only,[aria-hidden="true"]')||!String(node.textContent||'').trim()||node.children.length>2) return false;
            const s=getComputedStyle(node);
            return (s.overflow==='hidden'||s.overflow==='clip')&&
              (node.scrollWidth>node.clientWidth+1||node.scrollHeight>node.clientHeight+1);
          });
          const images=[...root.querySelectorAll('img')].filter(visible).map(node=>{
            const b=node.getBoundingClientRect(),s=getComputedStyle(node);
            return {alt:node.alt||'',width:Math.round(b.width),height:Math.round(b.height),natural:[node.naturalWidth,node.naturalHeight],fit:s.objectFit};
          });
          return {
            root:rootSelector,documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            controls:controls.length,escaped:escaped.map(label),small:small.map(node=>{const b=node.getBoundingClientRect();return `${label(node)} (${Math.round(b.width)}x${Math.round(b.height)})`;}).slice(0,30),
            clipped:clipped.map(label).slice(0,30),images,
            activeElement:label(document.activeElement)
          };
        }""",
        root_selector,
    )


def shot(page, width, height, name, records, root="#app"):
    page.wait_for_timeout(100)
    page.screenshot(path=OUT / f"{width}x{height}-{name}.png")
    records[f"{width}x{height}-{name}"] = geometry(page, root)


def close_all(page):
    page.evaluate(
        """() => {
          for(const node of document.querySelectorAll('.ovl.on,.sheet-wrap.on')){
            node.classList.remove('on'); node.setAttribute('aria-hidden','true');
          }
        }"""
    )


def capture_viewport(browser, width, height, records, errors):
    page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
    page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    page.on("pageerror", lambda error: errors.append(f"{width}x{height}: {error}"))
    enter_game(page)

    shot(page, width, height, "01-route", records)
    page.click('[data-journey-mode="local"]')
    shot(page, width, height, "02-stay", records)

    page.click("#dk-objectives")
    shot(page, width, height, "03-goal", records, "#ovl-journal")
    page.click("#dk-map")
    shot(page, width, height, "04-map", records, "#ovl-map")
    page.click("#dk-status")
    shot(page, width, height, "05-bag", records, "#ovl-status")
    if page.locator('[data-bag-item="의약품"]').count():
        page.click('[data-bag-item="의약품"]')
        shot(page, width, height, "06-bag-medicine", records, "#ovl-status")
    page.click("#dk-menu")
    shot(page, width, height, "07-menu", records, "#ovl-menu")

    if width == 390:
        close_all(page)
        page.click('[data-journey-mode="local"]')
        close_all(page)
        page.evaluate("document.querySelector('[data-a=\"camp\"]')?.click()")
        shot(page, width, height, "08-camp", records, "#ovl-camp")
        close_all(page)
        page.evaluate("S.at='daegu'; S.known=[...new Set([...S.known,'daegu'])]; UI.renderAll(); UI.showStl('daegu','hub')")
        shot(page, width, height, "09-settlement", records, "#ovl-stl")
        close_all(page)

        page.evaluate("UI.showEvent(D.events.find(event => event.id === 'story_family_key'))")
        shot(page, width, height, "10-event-opening", records, "#ev-sheet")
        for _ in range(4):
            page.click(".story-next")
            page.wait_for_timeout(45)
        shot(page, width, height, "11-event-record", records, "#ev-sheet")
        page.evaluate("UI.finishStory()")
        shot(page, width, height, "12-event-choice", records, "#ev-sheet")
        page.locator(".event-choice-dock .choice[data-i]:not([disabled])").first.click()
        shot(page, width, height, "13-event-outcome", records, "#ev-sheet")
        close_all(page)

        page.evaluate("UI.showEvent(D.events.find(event => event.id === 'patrol_walker')); UI.finishStory()")
        shot(page, width, height, "14-combat-choice", records, "#ev-sheet")
        close_all(page)

        page.click('[data-journey-mode="route"]')
        depart = page.locator('[data-nav-depart]').first
        if depart.count():
            depart.click()
            shot(page, width, height, "15-travel", records)

    page.close()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    records = {}
    errors = []
    for viewport in ((320, 578), (390, 844), (475, 948)):
        capture_viewport(browser, *viewport, records, errors)
    browser.close()
    (OUT / "metrics.json").write_text(
        json.dumps({"states": records, "errors": errors}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps({"states": len(records), "errors": errors}, ensure_ascii=False))
