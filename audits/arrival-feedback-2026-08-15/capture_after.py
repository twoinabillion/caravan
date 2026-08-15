#!/usr/bin/env python3
"""Capture the verified arrival presentation after the arrival-feedback pass."""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
GAME = (ROOT / "서울까지400km.html").as_uri()
OUT = Path(__file__).resolve().parent


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        channel=os.environ.get("CARAVAN_BROWSER_CHANNEL") or None
    )
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(GAME)
    page.evaluate(
        """() => {
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','다온','full');
          document.querySelectorAll('.screen').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          S.at='yangsan'; S.day=2;
          S.lastJourneyRecap={
            from:'busan',to:'yangsan',km:20,minutes:96,events:1,build:'기본 생존형',
            routeCompleted:false,routeName:'',routeProgress:'1/4',
            changes:[
              {label:'연료',value:-3.4,unit:'L',good:false},
              {label:'피로',value:7,unit:'',good:false},
              {label:'고철',value:2,unit:'',good:true}
            ],
            routeContract:{mark:'▰',name:'경부 생존선',promise:'남은 길을 확인한다',complete:false},
            checkIn:{name:'민지',moment:{title:'기둥 아래의 약속',text:'무너진 상판을 보며 다음 수리 순서를 정했다.'}}
          };
          UI.renderAll(); UI.onArrive();
          UI.toast('🤝 민지의 부탁을 진행할 수 있다');
          UI.toast('피로도 +7 · 고철 +2');
        }"""
    )
    page.wait_for_timeout(300)
    page.screenshot(path=str(OUT / "03-after-yangsan-arrival.png"))
    page.wait_for_timeout(3200)
    page.screenshot(path=str(OUT / "04-after-notice-queue.png"))

    page.evaluate(
        """() => {
          UI.clearToasts();
          document.querySelector('#arrival-scene').classList.remove('on');
          S.at='lake'; S.day=4; S.lastJourneyRecap=null;
          UI.renderAll(); UI.onArrive();
        }"""
    )
    page.wait_for_timeout(300)
    page.screenshot(path=str(OUT / "05-after-hidden-lake-arrival.png"))
    browser.close()
