#!/usr/bin/env python3
"""Visual evidence for the settlement walk and destination-led recruit flow."""
from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
GAME = (ROOT / "서울까지400km.html").as_uri()
OUT = Path(__file__).resolve().parent / "after"
SETTLEMENTS = ("gwangju", "miryang", "daegu", "muju", "jeonju", "daejeon", "suwon")


def clean_state(page, settlement: str):
    page.goto(GAME)
    page.evaluate(
        """settlement => {
          localStorage.clear();
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','다온','full');
          S.at=settlement;
          S.party=[];
          S.recruitQ=null;
          S.used=[];
          S.known=[...new Set([...S.known,settlement])];
          S.visited=[...new Set([...S.visited,settlement])];
          document.querySelectorAll('.scr,.screen').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          document.querySelector('#arrival-scene')?.classList.remove('on');
          UI.renderAll();
          UI.showStl(settlement,'hub');
        }""",
        settlement,
    )
    page.wait_for_timeout(220)


def geometry(page):
    return page.evaluate(
        r"""() => {
          const visible=node=>{
            const style=getComputedStyle(node), rect=node.getBoundingClientRect();
            return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
          };
          const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
          const stage=document.querySelector('.stl-town-stage'), stageRect=rect(stage);
          const markers=[...stage.querySelectorAll('.stl-hotspot,.stl-resident-pin,.stl-recruit-pin,.stl-town-player')].filter(visible);
          const controls=[...document.querySelectorAll('#ovl-stl button')].filter(visible);
          const escaped=controls.filter(node=>{const r=node.getBoundingClientRect();return r.left<-1||r.right>innerWidth+1||r.top<-1||r.bottom>innerHeight+1});
          const small=controls.filter(node=>{const r=node.getBoundingClientRect();return r.width<43.5||r.height<43.5});
          return {
            viewport:[innerWidth,innerHeight],
            stage:stageRect,
            facilities:stage.querySelectorAll('.stl-hotspot').length,
            residents:stage.querySelectorAll('.stl-resident-pin').length,
            recruit:stage.querySelectorAll('.stl-recruit-pin').length,
            markerRects:markers.map(node=>({label:(node.getAttribute('aria-label')||node.textContent).replace(/\s+/g,' ').trim(),...rect(node)})),
            escaped:escaped.map(node=>(node.getAttribute('aria-label')||node.textContent).replace(/\s+/g,' ').trim()),
            small:small.map(node=>({label:(node.getAttribute('aria-label')||node.textContent).replace(/\s+/g,' ').trim(),...rect(node)})),
            horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1
          };
        }"""
    )


def shot(page, name: str, metrics: dict):
    page.evaluate("""() => document.querySelectorAll('*').forEach(node => node.getAnimations?.().forEach(animation => {try{animation.finish()}catch(_){}}))""")
    page.wait_for_timeout(100)
    page.screenshot(path=str(OUT / f"{name}.png"))
    metrics[name] = geometry(page)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    metrics, errors = {}, []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
        page.on("pageerror", lambda error: errors.append(str(error)))
        for settlement in SETTLEMENTS:
            clean_state(page, settlement)
            shot(page, f"390x844-{settlement}-walk", metrics)

        clean_state(page, "miryang")
        page.click('[data-town-recruit="minji"]')
        page.wait_for_timeout(220)
        page.screenshot(path=str(OUT / "390x844-miryang-minji-first-meet.png"))

        clean_state(page, "miryang")
        page.click('[data-town-npc="sundeok"]')
        page.wait_for_timeout(80)
        page.click('[data-npc="sundeok"]')
        page.wait_for_timeout(180)
        page.screenshot(path=str(OUT / "390x844-miryang-soonduk-talk.png"))
        page.close()

        for width, height, settlement in ((320, 578, "miryang"), (475, 948, "daejeon")):
            page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
            page.on("pageerror", lambda error, size=f"{width}x{height}": errors.append(f"{size}: {error}"))
            clean_state(page, settlement)
            shot(page, f"{width}x{height}-{settlement}-walk", metrics)
            page.close()
        browser.close()

    (OUT / "metrics.json").write_text(
        json.dumps({"states": metrics, "errors": errors}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"states": len(metrics), "errors": errors}, ensure_ascii=False))


if __name__ == "__main__":
    main()
