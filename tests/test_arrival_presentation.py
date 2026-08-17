#!/usr/bin/env python3
"""Arrival images and queued notices stay complete and non-overlapping on mobile."""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()
FAILURES = []


def check(label, ok, detail=""):
    print(("  ✅ " if ok else "  ❌ ") + label + (f" — {detail}" if detail and not ok else ""))
    if not ok:
        FAILURES.append(label)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        channel=os.environ.get("CARAVAN_BROWSER_CHANNEL") or None
    )
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(GAME)
    page.evaluate(
        """() => {
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','도착 점검','full');
          document.querySelectorAll('.screen').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          UI.renderAll();
        }"""
    )

    coverage = page.evaluate(
        """() => Object.keys(D.nodes).map(id => ({
          id,
          scene:D.nodeScenes?.[id] || '',
          loaded:Boolean(D.scenes?.[D.nodeScenes?.[id]])
        }))"""
    )
    missing = [row["id"] for row in coverage if not row["scene"] or not row["loaded"]]
    check("모든 도착 지점에 실제 장면이 연결됨", not missing, str(missing))

    presentation = page.evaluate(
        """() => {
          S.at='yangsan'; S.day=2;
          S.lastJourneyRecap={
            from:'busan',to:'yangsan',km:20,minutes:96,events:1,build:'기본 생존형',
            routeCompleted:false,routeName:'',routeProgress:'1/4',
            changes:[
              {label:'연료',value:-3.4,unit:'L',good:false},
              {label:'피로',value:7,unit:'',good:false},
              {label:'고철',value:2,unit:'',good:true}
            ],
            routeContract:{mark:'▰',name:'경부 생존선',promise:'남은 길을 확인한다',complete:false}
          };
          UI.clearToasts(); UI.renderAll(); UI.onArrive();
          UI.toast('🤝 민지의 부탁을 진행할 수 있다');
          UI.toast('피로도 +7 · 고철 +2');
          const image=document.querySelector('#arrival-scene img');
          const imageBox=image?.getBoundingClientRect();
          const copy=document.querySelector('.arrival-copy').getBoundingClientRect();
          const toast=document.querySelector('#toasts .toast').getBoundingClientRect();
          return {
            image:Boolean(image),src:image?.src||'',alt:image?.alt||'',fallback:Boolean(document.querySelector('.arrival-fallback')),
            imageHeight:imageBox?.height||0,
            toastCount:document.querySelectorAll('#toasts .toast').length,
            toastText:document.querySelector('#toasts .toast')?.textContent||'',
            separated:toast.bottom < copy.top
          };
        }"""
    )
    check("양산 도착은 전용 WebP 풍경을 표시", presentation["image"] and
          presentation["src"].startswith("data:image/webp") and not presentation["fallback"],
          str(presentation))
    check("도착 풍경 대체 텍스트가 장소명을 포함", "양산 고가차도" in presentation["alt"],
          presentation["alt"])
    check("가로 도착 풍경도 화면 높이 62% 이상 크게 표시", presentation["imageHeight"] >= 844 * .62,
          str(presentation))
    check("알림은 한 번에 하나만 같은 위치에 표시", presentation["toastCount"] == 1 and
          "민지의 부탁" in presentation["toastText"], str(presentation))
    check("상단 알림과 하단 도착 정보가 겹치지 않음", presentation["separated"], str(presentation))

    page.wait_for_timeout(3400)
    queued = page.evaluate(
        """() => ({
          count:document.querySelectorAll('#toasts .toast').length,
          text:document.querySelector('#toasts .toast')?.textContent||''
        })"""
    )
    check("뒤 알림이 앞 알림 뒤에 이어서 표시", queued["count"] == 1 and "피로도 +7" in queued["text"],
          str(queued))
    browser.close()

if FAILURES:
    raise SystemExit(f"arrival presentation failures: {FAILURES}")
print("✅ 도착 화면·알림 큐 검증 통과")
