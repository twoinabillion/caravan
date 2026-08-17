#!/usr/bin/env python3
"""UI 밀도 감사 — 도시 시설·이벤트·주행 등 주요 시퀀스를 한 세트로 캡처한다."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
URL = (ROOT / "서울까지400km.html").as_uri()
BOOT = """() => {
  localStorage.clear(); G.newGame('onroad','다온','full');
  document.querySelectorAll('.scr,.screen').forEach(n=>n.classList.remove('on'));
  document.querySelector('#scr-game').classList.add('on');
  document.querySelector('#arrival-scene')?.classList.remove('on');
  S.at='daegu'; S.known=[...new Set([...S.known,'daegu'])];
  S.visited=[...new Set([...S.visited,'daegu'])];
  S.scrap=60; S.fuel=40; S.water=20; S.food=20;
  UI.renderAll();
}"""

shots = []
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome")
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.evaluate(BOOT); pg.wait_for_timeout(300)

    def shot(name, js=None, wait=280):
        if js:
            try: pg.evaluate(js)
            except Exception as e: print("  skip", name, e); return
        pg.wait_for_timeout(wait)
        pg.screenshot(path=OUT / f"{name}.png"); shots.append(name)

    shot("01-hub",      "()=>UI.showStl('daegu','hub')")
    shot("02-market",   "()=>UI.showStl('daegu','market')")
    shot("03-garage",   "()=>UI.showStl('daegu','garage')")
    shot("04-people",   "()=>UI.showStl('daegu','people')")
    shot("05-alley",    "()=>UI.showStl('daegu','alley')")
    shot("06-map",      "()=>{UI.closeStl&&UI.closeStl();UI.showMap&&UI.showMap();}")
    shot("07-bag",      "()=>{document.querySelector('#ovl-map')?.classList.remove('on');UI.showBag&&UI.showBag();}")
    shot("08-goal",     "()=>{document.querySelector('#ovl-bag')?.classList.remove('on');UI.showGoal&&UI.showGoal();}")
    shot("09-route",    "()=>{document.querySelectorAll('.ovl').forEach(n=>n.classList.remove('on'));UI.renderAll();}")
    print("errors:", errs[:3])
    b.close()
print("captured:", len(shots))
