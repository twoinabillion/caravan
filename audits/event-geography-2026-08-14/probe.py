#!/usr/bin/env python3
"""Probe the live eligibility engine for endpoint-anchored spatial events."""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
GAME = (ROOT / "서울까지400km.html").as_uri()
OUT = Path(__file__).parent / "engine-probe.json"
ROUTES = (
    ("busan", "yangsan"),
    ("daegu", "gumi"),
    ("miryang", "yangsan"),
    ("suwon", "pyeongtaek"),
)


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 480, "height": 860})
        page.goto(GAME)
        page.evaluate("G.newGame('onroad','다온','full')")
        result = []
        for from_node, to_node in ROUTES:
            item = page.evaluate("""({fromNode,toNode}) => {
              S.at=null;
              S.driving={from:fromNode,to:toNode,dist:20,gone:10,road:'normal',wx:'clear',slots:[],si:0,eventCount:0};
              const endpoint=[fromNode,toNode];
              const matched=D.events.filter(event=>event.nearNode?.some(node=>endpoint.includes(node)))
                .map(event=>({id:event.id,title:event.title,nearNode:event.nearNode,
                  recruitStart:event.recruitStart||null,priority:event.priority||0}));
              const eligible=new Set(G.eligible().map(event=>event.id));
              return {from:fromNode,to:toNode,
                endpointMatched:matched,
                currentlyEligible:matched.filter(event=>eligible.has(event.id))};
            }""", {"fromNode": from_node, "toNode": to_node})
            result.append(item)
        browser.close()
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
