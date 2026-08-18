#!/usr/bin/env python3
"""Capture the selected intro portrait layout at its exact dialogue state."""

import json
import pathlib

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(__file__).resolve().parent
URL = (ROOT / "서울까지400km.html").as_uri()


def reach_target(page):
    page.goto(URL)
    page.wait_for_timeout(350)
    page.click("#bt-new")
    page.fill("#inp-name", "나")
    page.click("#bt-name")
    if page.locator("#intro-auto").get_attribute("aria-pressed") == "true":
        page.click("#intro-auto")
    for _ in range(15):
        page.click("#scr-intro", position={"x": 200, "y": 700})
    page.wait_for_timeout(180)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    report = {}
    for width, height in ((480, 860), (390, 844), (320, 720)):
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        reach_target(page)
        key = f"{width}x{height}"
        page.screenshot(path=str(OUT / f"implementation-{key}.png"))
        page.locator("#intro-page").screenshot(path=str(OUT / f"paper-{key}.png"))
        report[key] = page.evaluate(
            """() => {
              const pageBox=document.querySelector('#intro-page').getBoundingClientRect();
              const visible=node=>{const box=node.getBoundingClientRect();return box.width>0&&box.height>0};
              const avatars=[...document.querySelectorAll('#intro-txt .chat-avatar')].filter(visible)
                .map(node=>{const box=node.getBoundingClientRect();return {alt:node.alt,left:box.left,right:box.right,top:box.top,bottom:box.bottom};});
              const bubbles=[...document.querySelectorAll('#intro-txt .chat-bubble')].filter(visible)
                .map(node=>{const box=node.getBoundingClientRect();return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,text:node.textContent.trim()};});
              return {
                title:document.querySelector('#intro-title').textContent,
                names:[...document.querySelectorAll('#intro-txt .chat-name')].map(node=>node.textContent),
                pins:[...document.querySelectorAll('#intro-txt .intro-portrait-pin')].filter(visible).length,
                page:{left:pageBox.left,right:pageBox.right,top:pageBox.top,bottom:pageBox.bottom},
                avatars,bubbles,
                hookSafe:avatars.every(box=>{
                  const leftRail=Math.max(30,pageBox.width*.08), rightRail=Math.max(54,pageBox.width*.125);
                  return box.left>=pageBox.left+leftRail&&box.right<=pageBox.right-rightRail;
                }),
                horizontalOverflow:document.querySelector('#intro-page').scrollWidth>document.querySelector('#intro-page').clientWidth,
              };
            }"""
        )
        report[key]["errors"] = errors
        page.close()
    browser.close()
    (OUT / "metrics.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
