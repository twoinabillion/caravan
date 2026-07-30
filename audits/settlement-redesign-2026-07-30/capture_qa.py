#!/usr/bin/env python3
"""정착지 공간형 허브 — 390x844 브라우저 증거 캡처."""
import base64
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
GAME = (ROOT / "서울까지400km.html").as_uri()

def data_uri(path):
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode("ascii")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto(GAME)
    page.wait_for_timeout(600)
    page.click("#bt-new")
    page.click("#mode-on")
    page.fill("#inp-name", "하람")
    page.evaluate("UI.skipIntro()")
    page.evaluate("""() => {
      S.at='daegu'; S.driving=null; S.min=12*60; S.day=11;
      S.fuel=83; S.water=16; S.food=9; S.scrap=78;
      S.items['부품']=8;
      S.up={bench:true,cabin:true,solar:true};
      UI.renderAll();
      UI.showStl('daegu');
    }""")
    page.click('[data-stlfocus="garage"]')
    page.wait_for_timeout(350)
    page.screenshot(path=str(OUT / "implementation-hub.png"))

    page.click("#stl-enter")
    page.wait_for_timeout(350)
    page.screenshot(path=str(OUT / "implementation-garage.png"))

    page.click('[data-ug="seating"]')
    page.click('[data-up="bunk"]')
    page.wait_for_timeout(1400)
    page.screenshot(path=str(OUT / "implementation-upgrade.png"))
    page.click("#upgrade-install-done")

    page.evaluate("UI.showStl('daegu','hub')")
    page.click('[data-stlfocus="market"]')
    page.click("#stl-enter")
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / "implementation-market.png"))

    interactions = {
        "hub_hotspots": 3,
        "garage_entered": True,
        "upgrade_before_after": True,
        "market_entered": True,
        "console_errors": errors,
    }
    (OUT / "browser-result.json").write_text(
        json.dumps(interactions, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    compare = browser.new_page(viewport={"width": 820, "height": 930}, device_scale_factor=1)
    reference = data_uri(OUT / "reference-option-3.png")
    impl = data_uri(OUT / "implementation-hub.png")
    compare.set_content(f"""<!doctype html><meta charset="utf-8"><style>
      *{{box-sizing:border-box}} body{{margin:0;background:#080b12;color:#e8e3d5;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif}}
      main{{display:grid;grid-template-columns:390px 390px;gap:16px;padding:12px}}
      figure{{margin:0}} figcaption{{height:38px;padding:8px 4px;font-size:13px}}
      img{{display:block;width:390px;height:844px;object-fit:fill;border:1px solid #30384d}}
    </style><main>
      <figure><figcaption>선택 시안 · 정규화 390×844</figcaption><img src="{reference}"></figure>
      <figure><figcaption>브라우저 구현 · 390×844</figcaption><img src="{impl}"></figure>
    </main>""", wait_until="load")
    compare.screenshot(path=str(OUT / "comparison-full.png"), full_page=True)

    detail = browser.new_page(viewport={"width": 820, "height": 390}, device_scale_factor=1)
    detail.set_content(f"""<!doctype html><meta charset="utf-8"><style>
      *{{box-sizing:border-box}} body{{margin:0;background:#080b12;color:#e8e3d5;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif}}
      main{{display:grid;grid-template-columns:390px 390px;gap:16px;padding:12px}}
      figure{{margin:0}} figcaption{{height:38px;padding:8px 4px;font-size:13px}}
      .crop{{width:390px;height:320px;overflow:hidden;border:1px solid #30384d}}
      img{{display:block;width:390px;height:844px;transform:translateY(-524px)}}
    </style><main>
      <figure><figcaption>선택 시안 · 하단 행동 영역</figcaption><div class="crop"><img src="{reference}"></div></figure>
      <figure><figcaption>브라우저 구현 · 하단 행동 영역</figcaption><div class="crop"><img src="{impl}"></div></figure>
    </main>""", wait_until="load")
    detail.screenshot(path=str(OUT / "comparison-detail-bottom.png"), full_page=True)

    small = browser.new_page(viewport={"width": 360, "height": 640}, device_scale_factor=1)
    small_errors = []
    small.on("console", lambda msg: small_errors.append(msg.text) if msg.type == "error" else None)
    small.on("pageerror", lambda exc: small_errors.append(str(exc)))
    small.goto(GAME)
    small.wait_for_timeout(500)
    small.click("#bt-new")
    small.click("#mode-on")
    small.fill("#inp-name", "하람")
    small.evaluate("UI.skipIntro()")
    small.evaluate("""() => {
      S.at='daegu'; S.driving=null; S.min=12*60;
      S.up={bench:true,cabin:true,solar:true};
      UI.renderAll(); UI.showStl('daegu');
    }""")
    small.click('[data-stlfocus="garage"]')
    small.wait_for_timeout(250)
    small.screenshot(path=str(OUT / "implementation-hub-360x640.png"))
    small_layout = small.evaluate("""() => {
      const view={w:innerWidth,h:innerHeight};
      const c=document.querySelector('#stl-enter').getBoundingClientRect();
      const spots=[...document.querySelectorAll('[data-stlfocus]')].map(x=>{
        const r=x.getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,w:r.width,h:r.height};
      });
      return {view,cta:{top:c.top,bottom:c.bottom,w:c.width,h:c.height},
        spots,resources:document.querySelectorAll('.stl-resource-strip>span').length};
    }""")
    (OUT / "small-viewport-result.json").write_text(
        json.dumps({"layout": small_layout, "console_errors": small_errors},
                   ensure_ascii=False, indent=2), encoding="utf-8"
    )
    browser.close()

print(OUT)
