#!/usr/bin/env python3
"""Capture every intro chapter title at mobile widths and report line geometry."""

import json
import pathlib
import re

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(__file__).resolve().parent
URL = (ROOT / "서울까지400km.html").as_uri()


def slug(text):
    value = re.sub(r"[^0-9A-Za-z가-힣]+", "-", text).strip("-")
    return value[:36] or "untitled"


def start_intro(page):
    page.goto(URL)
    page.wait_for_timeout(300)
    page.click("#bt-new")
    page.fill("#inp-name", "나")
    page.click("#bt-name")
    if page.locator("#intro-auto").get_attribute("aria-pressed") == "true":
        page.click("#intro-auto")
    page.wait_for_timeout(120)


def title_geometry(page):
    return page.evaluate(
        """() => {
          const title=document.querySelector('#intro-title');
          const paper=document.querySelector('#intro-page');
          const tr=title.getBoundingClientRect(), pr=paper.getBoundingClientRect();
          const range=document.createRange();
          range.selectNodeContents(title);
          const lines=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
          const cs=getComputedStyle(title);
          return {
            text:title.textContent.trim(),
            lines:lines.length,
            title:{left:tr.left-pr.left,top:tr.top-pr.top,right:tr.right-pr.left,
              bottom:tr.bottom-pr.top,width:tr.width,height:tr.height},
            glyphLines:lines.map(r=>({left:r.left-pr.left,top:r.top-pr.top,
              right:r.right-pr.left,bottom:r.bottom-pr.top,width:r.width,height:r.height})),
            fontSize:cs.fontSize,lineHeight:cs.lineHeight,
            horizontalOverflow:paper.scrollWidth>paper.clientWidth
          };
        }"""
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    report = {}
    for width, height in ((480, 860), (390, 844), (320, 720)):
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        start_intro(page)
        seen = set()
        rows = []
        click_count = 0
        while page.locator("#scr-intro").is_visible() and click_count < 260:
            title = page.locator("#intro-title").inner_text().strip()
            if title and title not in seen:
                seen.add(title)
                page.wait_for_timeout(480)
                page.evaluate("document.querySelector('#intro-book').style.opacity='1'")
                item = title_geometry(page)
                item["index"] = len(rows) + 1
                item["file"] = f"{width}x{height}-{item['index']:02d}-{slug(title)}.png"
                page.locator("#intro-page").screenshot(path=str(OUT / item["file"]))
                rows.append(item)
            page.click("#scr-intro", position={"x": min(200, width - 20), "y": min(700, height - 20)})
            click_count += 1
            page.wait_for_timeout(18)
        report[f"{width}x{height}"] = {
            "count": len(rows),
            "clicks": click_count,
            "titles": rows,
            "errors": errors,
        }
        page.close()
    browser.close()
    (OUT / "metrics.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
