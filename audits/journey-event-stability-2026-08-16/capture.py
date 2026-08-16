#!/usr/bin/env python3
"""Capture journey mode motion and the family-key story sequence in Chrome."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
URL = (ROOT / "서울까지400km.html").as_uri()


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "화면 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def switch_trace(page, mode):
    return page.evaluate(
        """async mode => {
          const selectors={
            stage:'#stage', panel:'#panel', console:'.journey-mode-console',
            dock:'#dock', scene:'#scene'
          };
          const rows=[];
          const snap=label=>{
            const row={label,time:performance.now()};
            for(const [key,selector] of Object.entries(selectors)){
              const node=document.querySelector(selector);
              if(!node){ row[key]=null; continue; }
              const b=node.getBoundingClientRect();
              row[key]={x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom};
            }
            rows.push(row);
          };
          snap('before');
          document.querySelector(`[data-journey-mode="${mode}"]`).click();
          snap('sync');
          for(let i=1;i<=12;i++){
            await new Promise(requestAnimationFrame);
            snap(`raf-${i}`);
          }
          await new Promise(resolve=>setTimeout(resolve,180));
          snap('settled');
          return rows;
        }""",
        mode,
    )


def capture(label):
    out = Path(__file__).resolve().parent / label
    out.mkdir(parents=True, exist_ok=True)
    metrics = {"viewports": {}}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        for width, height in ((320, 578), (390, 844), (475, 948)):
            page = browser.new_page(
                viewport={"width": width, "height": height}, device_scale_factor=1
            )
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.add_init_script(
                "localStorage.clear(); localStorage.setItem('caravan_story_auto','0')"
            )
            enter_game(page)
            page.screenshot(path=out / f"route-{width}x{height}.png")
            to_local = switch_trace(page, "local")
            page.screenshot(path=out / f"stay-{width}x{height}.png")
            to_route = switch_trace(page, "route")
            page.screenshot(path=out / f"route-return-{width}x{height}.png")

            page.evaluate(
                "UI.showEvent(D.events.find(event => event.id === 'story_family_key'))"
            )
            page.wait_for_timeout(120)
            page.screenshot(path=out / f"family-key-opening-{width}x{height}.png")
            turns = int(
                page.locator("[data-event-progress]").inner_text().split("/")[-1].strip()
            )
            story_rows = []
            for index in range(turns):
                page.screenshot(path=out / f"family-key-{index + 1:02d}-{width}x{height}.png")
                story_rows.append(
                    page.evaluate(
                        """() => {
                          const q=s=>{const n=document.querySelector(s);if(!n)return null;
                            const b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,scrollHeight:n.scrollHeight,clientHeight:n.clientHeight};};
                          return {
                            step:document.querySelector('#ev-sheet').dataset.storyStep,
                            progress:document.querySelector('[data-event-progress]')?.textContent,
                            title:document.querySelector('.event-head h2')?.textContent,
                            latest:document.querySelector('.story-reader [data-story-entry]:last-child')?.innerText,
                            scene:q('.event-scene-frame'), report:q('.event-field-report'), reader:q('.story-reader'),
                            latestBox:q('.story-reader [data-story-entry]:last-child'), dock:q('.event-choice-dock')
                          };
                        }"""
                    )
                )
                if index < turns - 1:
                    page.click(".story-next")
                    page.wait_for_timeout(70)
            page.locator(".event-choice-dock .choice[data-i]:not([disabled])").first.click()
            page.wait_for_timeout(100)
            page.screenshot(path=out / f"family-key-outcome-{width}x{height}.png")
            outcome = page.evaluate(
                """() => ({
                  text:document.querySelector('.story-reader')?.innerText,
                  reportScroll:document.querySelector('.event-field-report')?.scrollHeight,
                  reportClient:document.querySelector('.event-field-report')?.clientHeight,
                  readerScroll:document.querySelector('.story-reader')?.scrollHeight,
                  readerClient:document.querySelector('.story-reader')?.clientHeight,
                  overflow:document.documentElement.scrollWidth-innerWidth,
                  step:document.querySelector('#ev-sheet')?.dataset.storyStep,
                  phase:document.querySelector('#ev-sheet')?.dataset.storyPhase
                })"""
            )
            metrics["viewports"][f"{width}x{height}"] = {
                "switchToLocal": to_local,
                "switchToRoute": to_route,
                "story": story_rows,
                "outcome": outcome,
                "errors": errors,
            }
            page.close()
        browser.close()
    (out / "metrics.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("label", choices=("before", "after"))
    capture(parser.parse_args().label)
