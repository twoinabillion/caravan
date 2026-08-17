#!/usr/bin/env python3
"""Capture the current route/tool/stay/settlement surfaces for design QA."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
GAME = (ROOT / "서울까지400km.html").as_uri()
AUDIT = Path(__file__).resolve().parent
VIEWPORTS = ((320, 578), (390, 844), (475, 948))


def enter_game(page):
    page.goto(GAME)
    page.evaluate(
        """() => {
          localStorage.clear();
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','다온','full');
          S.party=['minji','parkss','kangwoo','leo','jaeyi','eunsu'];
          S.dog=true;
          document.querySelectorAll('.scr,.screen').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          document.querySelector('#arrival-scene')?.classList.remove('on');
          UI.renderAll();
        }"""
    )
    page.wait_for_timeout(160)


def settle(page):
    page.evaluate(
        """() => document.querySelectorAll('*').forEach(node =>
          node.getAnimations?.().forEach(animation => {
            try { animation.finish(); } catch (_) {}
          }))"""
    )
    page.wait_for_timeout(100)


def geometry(page, root_selector):
    return page.evaluate(
        """rootSelector => {
          const root=document.querySelector(rootSelector);
          const visible=node=>{
            if(!node) return false;
            const style=getComputedStyle(node), rect=node.getBoundingClientRect();
            return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
          };
          const label=node=>String(node.getAttribute('aria-label')||node.textContent||node.className||node.tagName)
            .replace(/\s+/g,' ').trim().slice(0,90);
          const controls=[...root.querySelectorAll('button,[role="button"],a[href]')].filter(visible);
          const escaped=controls.filter(node=>{
            const rect=node.getBoundingClientRect();
            return rect.left<-1||rect.right>innerWidth+1||rect.top<-1||rect.bottom>innerHeight+1;
          });
          const small=controls.filter(node=>{
            if(node.matches('.nav-carousel-dots button')) return false;
            const rect=node.getBoundingClientRect();
            return rect.width<43.5||rect.height<43.5;
          });
          return {
            documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            controls:controls.length,
            escaped:escaped.map(label),
            horizontalEscaped:controls.filter(node=>{
              const rect=node.getBoundingClientRect();
              return rect.left<-1||rect.right>innerWidth+1;
            }).map(label),
            verticalBelowFold:controls.filter(node=>{
              const rect=node.getBoundingClientRect();
              return rect.top<-1||rect.bottom>innerHeight+1;
            }).map(label),
            small:small.map(node=>{
              const rect=node.getBoundingClientRect();
              return label(node)+' ('+Math.round(rect.width)+'x'+Math.round(rect.height)+')';
            }),
            rootRect:(()=>{
              const rect=root.getBoundingClientRect();
              return [Math.round(rect.left),Math.round(rect.top),Math.round(rect.width),Math.round(rect.height)];
            })(),
            debugRects:['#stl-body','.stl-hub-v2','.stl-town-map','.stl-town-grid','.stl-hub-dock'].reduce((out,selector)=>{
              const node=document.querySelector(selector); if(!node) return out;
              const rect=node.getBoundingClientRect();
              out[selector]=[Math.round(rect.left),Math.round(rect.top),Math.round(rect.width),Math.round(rect.height),node.scrollWidth,node.clientWidth];
              return out;
            },{})
          };
        }""",
        root_selector,
    )


def capture(page, out, width, height, name, root, metrics):
    settle(page)
    page.screenshot(path=str(out / f"{width}x{height}-{name}.png"))
    metrics[f"{width}x{height}-{name}"] = geometry(page, root)


def close_overlays(page):
    page.evaluate(
        """() => document.querySelectorAll('.ovl.on,.sheet-wrap.on').forEach(node => {
          node.classList.remove('on');
          node.setAttribute('aria-hidden','true');
        })"""
    )


def run_viewport(browser, out, width, height, metrics, errors):
    page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
    page.on("pageerror", lambda error: errors.append(f"{width}x{height}: {error}"))
    enter_game(page)

    capture(page, out, width, height, "01-route", "#app", metrics)
    page.click('[data-journey-mode="local"]')
    capture(page, out, width, height, "02-stay", "#app", metrics)

    page.click("#dk-objectives")
    capture(page, out, width, height, "03-goal", "#ovl-status", metrics)
    page.click("#dk-map")
    capture(page, out, width, height, "04-map", "#ovl-map", metrics)
    page.click("#dk-status")
    capture(page, out, width, height, "05-bag", "#ovl-status", metrics)
    page.click('[data-bag-item="의약품"]')
    capture(page, out, width, height, "06-bag-medicine", "#ovl-status", metrics)

    if width == 390:
        close_overlays(page)
        page.evaluate(
            """() => {
              S.at='daegu';
              S.known=[...new Set([...S.known,'daegu'])];
              S.visited=[...new Set([...S.visited,'daegu'])];
              UI.renderAll();
              UI.showStl('daegu','hub');
            }"""
        )
        capture(page, out, width, height, "07-city-hub", "#ovl-stl", metrics)
        page.evaluate("UI.showStl('daegu','market')")
        capture(page, out, width, height, "08-city-market", "#ovl-stl", metrics)
        page.evaluate("UI.showStl('daegu','people')")
        capture(page, out, width, height, "09-city-people", "#ovl-stl", metrics)

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
