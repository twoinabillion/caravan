#!/usr/bin/env python3
"""대구 도착→도시→주민 대화 흐름의 모바일 시각 QA 캡처."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
GAME = (ROOT / "서울까지400km.html").as_uri()
AUDIT = Path(__file__).resolve().parent
VIEWPORTS = ((320, 578), (390, 844), (475, 948))


def enter_daegu(page):
    page.goto(GAME)
    page.evaluate(
        """() => {
          localStorage.clear();
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','다온','full');
          S.at='daegu';
          S.known=[...new Set([...S.known,'daegu'])];
          S.visited=[...new Set([...S.visited,'daegu'])];
          S.party=['minji','parkss','kangwoo'];
          S.lastJourneyRecap=null;
          document.querySelectorAll('.scr,.screen').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          document.querySelector('#arrival-scene')?.classList.remove('on');
          UI.renderAll();
        }"""
    )
    page.wait_for_timeout(140)


def settle(page):
    page.evaluate(
        """() => document.querySelectorAll('*').forEach(node =>
          node.getAnimations?.().forEach(animation => {
            try { animation.finish(); } catch (_) {}
          }))"""
    )
    page.wait_for_timeout(80)


def measure(page, root_selector):
    return page.evaluate(
        r"""rootSelector => {
          const root=document.querySelector(rootSelector);
          const visible=node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
          const label=node=>String(node.getAttribute('aria-label')||node.textContent||node.className||node.tagName).replace(/\s+/g,' ').trim().slice(0,100);
          const controls=[...root.querySelectorAll('button,[role="button"],a[href]')].filter(visible);
          const escaped=controls.filter(node=>{const r=node.getBoundingClientRect();return r.left<-1||r.right>innerWidth+1||r.top<-1||r.bottom>innerHeight+1});
          const small=controls.filter(node=>{const r=node.getBoundingClientRect();return r.width<43.5||r.height<43.5});
          const images=[...root.querySelectorAll('img')].filter(visible).map(node=>{const r=node.getBoundingClientRect();return {alt:node.alt,natural:[node.naturalWidth,node.naturalHeight],rendered:[Math.round(r.width),Math.round(r.height)],fit:getComputedStyle(node).objectFit}});
          return {overflow:document.documentElement.scrollWidth>innerWidth+1,escaped:escaped.map(label),small:small.map(label),images};
        }""",
        root_selector,
    )


def capture(page, out, width, height, name, root, metrics):
    settle(page)
    page.screenshot(path=str(out / f"{width}x{height}-{name}.png"))
    metrics[f"{width}x{height}-{name}"] = measure(page, root)


def show_people(page):
    page.evaluate("UI.showStl('daegu','people')")
    page.wait_for_timeout(80)


def run_viewport(browser, out, width, height, metrics, errors):
    page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
    page.on("pageerror", lambda error: errors.append(f"{width}x{height}: {error}"))
    enter_daegu(page)

    page.evaluate("UI.onArrive()")
    capture(page, out, width, height, "01-arrival", "#arrival-scene", metrics)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")

    page.evaluate("S.at='yangsan'; UI.onArrive()")
    capture(page, out, width, height, "01b-arrival-landscape", "#arrival-scene", metrics)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on'); S.at='daegu'")

    page.evaluate("UI.showStl('daegu','hub')")
    capture(page, out, width, height, "02-hub", "#ovl-stl", metrics)
    show_people(page)
    capture(page, out, width, height, "03-people", "#ovl-stl", metrics)

    for index, npc in enumerate(("taeho", "sera", "mansu"), start=4):
        show_people(page)
        page.click(f'[data-npc="{npc}"]')
        capture(page, out, width, height, f"{index:02d}-talk-{npc}", "#ovl-stl", metrics)

    page.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("label", choices=("before", "after"))
    args = parser.parse_args()
    out = AUDIT / args.label
    out.mkdir(parents=True, exist_ok=True)
    metrics, errors = {}, []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        for width, height in VIEWPORTS:
            run_viewport(browser, out, width, height, metrics, errors)
        browser.close()
    (out / "metrics.json").write_text(json.dumps({"states": metrics, "errors": errors}, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"states": len(metrics), "errors": errors}, ensure_ascii=False))


if __name__ == "__main__":
    main()
