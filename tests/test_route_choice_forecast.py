#!/usr/bin/env python3
"""Focused UI fixture for the Kimcheon route forecast cards.

This is a labelled diagnostic fixture, not earned campaign evidence: it places
the game at Gimcheon before opening the real route event. Forecast values and
route selection still come from the production engine and controls.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = "http://127.0.0.1:4176/game?caravan-live=1"
OUT = ROOT / "artifacts/director-pass-2026-09-11/task8-route-forecast-final"


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    local = (ROOT / "서울까지400km.html").read_bytes()
    rows = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for width, height in ((320, 578), (390, 844)):
            page = browser.new_page(viewport={"width": width, "height": height})
            errors: list[str] = []
            receipt: dict[str, object] = {}
            page.on("pageerror", lambda error: errors.append(str(error)))

            def deliver_original(route) -> None:
                original = route.fetch(timeout=60_000)
                raw = original.body()
                receipt.update(
                    status=original.status,
                    url=original.url,
                    bytes=len(raw),
                    sha256=digest(raw),
                )
                assert raw == local, "direct server response differs from local build"
                route.fulfill(response=original, body=raw)

            page.route(URL, deliver_original)
            response = page.goto(URL, wait_until="domcontentloaded", timeout=60_000)
            assert response and response.ok
            page.wait_for_function("typeof G==='object'&&typeof UI==='object'")
            setup = page.evaluate("""() => {
              localStorage.clear(); localStorage.setItem('caravan_story_auto','0');
              G.newGame('onroad','노선 검수','full','keeper');
              S.at='gimcheon'; S.driving=null; S.routePlan=null;
              S.pendingPresentation=null; S._chain=null; S._storyQueue=[];
              S.flags.onboarding_event_guide=true;
              const ridge=G.routeForecast('ridge'), market=G.routeForecast('market');
              S.fuel=(ridge.fuel+market.fuel)/2;
              UI.showEvent(D.events.find(event=>event.id==='route_mid_fork'));
              UI.finishStory();
              return {build:GAME_BUILD,fuel:S.fuel,
                ridge:G.routeForecast('ridge'),market:G.routeForecast('market')};
            }""")
            page.wait_for_timeout(500)
            identity = page.locator("#ev-sheet").evaluate(
                "node=>({eventId:node.dataset.eventId,phase:node.dataset.storyPhase,"
                "step:node.dataset.storyStep})"
            )
            assert identity == {
                "eventId": "route_mid_fork",
                "phase": "event",
                "step": "decision",
            }
            page.locator("#ev-sheet .event-choice-dock>.choices").evaluate("node=>node.scrollTop=0")
            page.mouse.move(0, 0)
            first_layout = page.evaluate("""()=>{
              const list=document.querySelector('#ev-sheet .event-choice-dock>.choices');
              const node=list.querySelector('.choice[data-i="0"]');
              const lr=list.getBoundingClientRect(),box=node.getBoundingClientRect();
              const descendants=[...node.querySelectorAll('.choice-head,.choice-title,.req')]
                .filter(child=>child.getClientRects().length).map(child=>{
                  const r=child.getBoundingClientRect();return {className:child.className,top:r.top,bottom:r.bottom};
                });
              return {list:{top:lr.top,bottom:lr.bottom},card:{top:box.top,bottom:box.bottom},descendants};
            }""")
            assert first_layout["card"]["top"] >= first_layout["list"]["top"] - 1
            assert first_layout["card"]["bottom"] <= first_layout["list"]["bottom"] + 1
            assert all(
                child["top"] >= first_layout["card"]["top"] - 1
                and child["bottom"] <= first_layout["card"]["bottom"] + 1
                for child in first_layout["descendants"]
            ), first_layout
            first_path = OUT / f"route-first-action-{width}x{height}.png"
            page.screenshot(path=str(first_path))

            controls = []
            for index, kind in enumerate(("ridge", "market")):
                button = page.locator(f'#ev-sheet .choice[data-i="{index}"]')
                expected = setup[kind]
                copy = button.inner_text()
                assert f"{expected['km']}km" in copy
                assert f"연료 약 {expected['fuel']}L" in copy
                assert page.evaluate("minutes=>G.durationLabel(minutes)", expected["minutes"]) in copy
                button.click(trial=True)
                geometry = button.evaluate("""node=>{
                  const box=node.getBoundingClientRect();
                  const descendants=[...node.querySelectorAll('.choice-head,.choice-title,.req')]
                    .filter(child=>child.getClientRects().length).map(child=>{
                      const r=child.getBoundingClientRect();
                      return {className:child.className,top:r.top,bottom:r.bottom};
                    });
                  const hit=document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
                  return {x:box.x,y:box.y,width:box.width,height:box.height,
                    top:box.top,bottom:box.bottom,hit:!!hit&&(hit===node||node.contains(hit)),
                    disabled:node.disabled,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,
                    descendants};
                }""")
                assert geometry["hit"] and not geometry["disabled"]
                assert geometry["scrollWidth"] <= geometry["clientWidth"] + 1
                controls.append({"kind": kind, "text": copy, "geometry": geometry})
            page.mouse.move(0, 0)
            settled = page.evaluate("""()=>[...document.querySelectorAll('#ev-sheet .choice[data-i]')].map(node=>{
              const box=node.getBoundingClientRect();
              const descendants=[...node.querySelectorAll('.choice-head,.choice-title,.req')]
                .filter(child=>child.getClientRects().length).map(child=>{
                  const r=child.getBoundingClientRect();return {className:child.className,top:r.top,bottom:r.bottom};
                });
              return {top:box.top,bottom:box.bottom,height:box.height,descendants};
            })""")
            assert settled[1]["top"] >= settled[0]["bottom"] - 0.5, settled
            assert all(
                child["top"] >= card["top"] - 1 and child["bottom"] <= card["bottom"] + 1
                for card in settled for child in card["descendants"]
            ), settled
            assert not page.evaluate("document.documentElement.scrollWidth>innerWidth")
            choices_path = OUT / f"route-last-action-{width}x{height}.png"
            page.screenshot(path=str(choices_path))
            page.locator('#ev-sheet .choice[data-i="1"]').click()
            page.evaluate("UI.finishStory()")
            page.wait_for_timeout(250)
            after = page.evaluate("""()=>({route:S.routePlan,chosen:G.routeStatus()?.def?.id,
              phase:document.querySelector('#ev-sheet').dataset.storyPhase,
              next:[...document.querySelectorAll('#ev-sheet button')]
                .find(button=>button.offsetParent&&!button.disabled)?.textContent.trim()})""")
            assert after["chosen"] == "market" and after["next"]
            result_path = OUT / f"market-selected-{width}x{height}.png"
            page.screenshot(path=str(result_path))
            assert not errors, errors
            rows.append(
                {
                    "viewport": {"width": width, "height": height},
                    "evidence": "isolated UI fixture; pre-display location/fuel setup; not campaign proof",
                    "setup": setup,
                    "identity": identity,
                    "firstActionLayout": first_layout,
                    "controls": controls,
                    "settledLayout": settled,
                    "after": after,
                    "mainDocumentReceipt": receipt,
                    "mainDocumentProtocol": "route.fetch original response; hash exact bytes; fulfill unchanged",
                    "captures": [first_path.name, choices_path.name, result_path.name],
                    "errors": errors,
                }
            )
            page.close()
        browser.close()
    trace = OUT / "trace.json"
    trace.write_text(json.dumps({"rows": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"PASS route forecast UI: {trace}")


if __name__ == "__main__":
    main()
