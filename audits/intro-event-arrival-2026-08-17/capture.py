#!/usr/bin/env python3
"""Capture the intro, event heading, and arrival presentation at phone sizes."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
GAME = (ROOT / "서울까지400km.html").as_uri()
AUDIT = Path(__file__).resolve().parent
VIEWPORTS = ((320, 578), (390, 844), (475, 948))


def settle(page):
    page.evaluate(
        """() => document.querySelectorAll('*').forEach(node =>
          node.getAnimations?.().forEach(animation => {
            try { animation.finish(); } catch (_) {}
          }))"""
    )
    page.wait_for_timeout(80)


def capture(page, out, width, height, name, root, metrics):
    settle(page)
    page.screenshot(path=str(out / f"{width}x{height}-{name}.png"))
    metrics[f"{width}x{height}-{name}"] = page.evaluate(
        r"""selector => {
          const root=document.querySelector(selector);
          const box=node=>{const r=node?.getBoundingClientRect();return r&&{
            x:+r.x.toFixed(1),y:+r.y.toFixed(1),width:+r.width.toFixed(1),height:+r.height.toFixed(1),
            right:+r.right.toFixed(1),bottom:+r.bottom.toFixed(1)
          }};
          const visible=node=>{const s=node&&getComputedStyle(node),r=node?.getBoundingClientRect();return !!(s&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0)};
          const controls=[...root.querySelectorAll('button,[role="button"],a[href]')].filter(visible);
          const escaped=controls.filter(node=>{const r=node.getBoundingClientRect();return r.left<-1||r.right>innerWidth+1||r.top<-1||r.bottom>innerHeight+1});
          const title=root.querySelector('.event-head h2');
          const report=root.querySelector('.event-field-report');
          const art=root.querySelector('.arrival-art,#intro-img,.event-scene');
          return {
            root:box(root),title:box(title),report:box(report),art:box(art),
            titleOffset:title&&report?{
              x:+(title.getBoundingClientRect().x-report.getBoundingClientRect().x).toFixed(1),
              y:+(title.getBoundingClientRect().y-report.getBoundingClientRect().y).toFixed(1)
            }:null,
            overflow:document.documentElement.scrollWidth>innerWidth+1,
            escaped:escaped.map(node=>(node.textContent||node.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,80)),
            image:art?{natural:[art.naturalWidth,art.naturalHeight],fit:getComputedStyle(art).objectFit,position:getComputedStyle(art).objectPosition}:null
          };
        }""",
        root,
    )


def enter_intro(page):
    page.goto(GAME)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.wait_for_timeout(120)


def enter_game(page):
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(120)
    page.evaluate("document.querySelector('#arrival-scene')?.classList.remove('on')")


def show_event(page, event_id, steps=0):
    page.evaluate(
        """id => {
          document.querySelector('#arrival-scene')?.classList.remove('on');
          UI.showEvent(D.events.find(event => event.id === id));
        }""",
        event_id,
    )
    for _ in range(steps):
        page.click(".story-next")
        page.wait_for_timeout(40)


def show_arrival(page, node_id):
    page.evaluate(
        """id => {
          document.querySelector('#ev-wrap')?.classList.remove('on');
          S.at=id;
          S.day=3;
          S.lastJourneyRecap=null;
          UI.onArrive();
        }""",
        node_id,
    )


def show_road_log(page):
    page.evaluate(
        """() => {
          document.querySelector('#arrival-scene')?.classList.remove('on');
          document.querySelector('#ev-wrap')?.classList.remove('on');
          S.at='busan';
          S.driving={from:'busan',to:'yangsan',dist:35,gone:8,road:'normal',slots:[],si:0,eventCount:0};
          UI.renderAll();
          UI.toast('<span class="ic">🧑‍✈️</span>운전 숙련 상승 — 「노련한 운전자」 (연비·피로 개선)', 'discover');
        }"""
    )


def run_viewport(browser, out, width, height, metrics, errors):
    page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
    page.on("pageerror", lambda error: errors.append(f"{width}x{height}: {error}"))
    page.add_init_script("localStorage.clear();localStorage.setItem('caravan_intro_auto','0')")
    enter_intro(page)
    capture(page, out, width, height, "01-intro-opening", "#scr-intro", metrics)
    for _ in range(3):
        page.click("#scr-intro", position={"x": width // 2, "y": height // 2})
        page.wait_for_timeout(40)
    capture(page, out, width, height, "02-intro-dialogue", "#scr-intro", metrics)

    enter_game(page)
    show_event(page, "story_family_key", 3)
    capture(page, out, width, height, "03-event-portrait-title", "#ev-sheet", metrics)
    page.evaluate("document.querySelector('#ev-wrap')?.classList.remove('on')")
    show_event(page, "story_family_principle", 7)
    capture(page, out, width, height, "04-event-narration-title", "#ev-sheet", metrics)

    show_arrival(page, "yangsan")
    capture(page, out, width, height, "05-arrival-landscape", "#arrival-scene", metrics)
    page.evaluate("document.querySelector('#arrival-scene')?.classList.remove('on')")
    show_arrival(page, "daegu")
    capture(page, out, width, height, "06-arrival-portrait", "#arrival-scene", metrics)
    show_road_log(page)
    capture(page, out, width, height, "07-road-log", "#panel", metrics)
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
    (out / "metrics.json").write_text(
        json.dumps({"states": metrics, "errors": errors}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"states": len(metrics), "errors": errors}, ensure_ascii=False))


if __name__ == "__main__":
    main()
