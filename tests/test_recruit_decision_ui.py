#!/usr/bin/env python3
"""Companion join outcomes use a clear primary/secondary decision layout."""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent.parent
URL = os.environ.get("CARAVAN_TEST_URL", (ROOT / "서울까지400km.html").as_uri())
SHOT_DIR = Path(os.environ.get("CARAVAN_VISUAL_SHOT_DIR", "/private/tmp/caravan-recruit-decision-qa"))


def main():
    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 390, "height": 844})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(URL)

        def open_decision(full=False):
            return page.evaluate(
                r"""full => {
                  document.querySelector('#ev-wrap')?.classList.remove('on');
                  G.newGame('onroad','검수','full');
                  if(full){
                    S.party=['parkss','leo'];
                    for(const id of S.party) S.comps[id]={lvl:1,bond:0,perks:[],pending:false};
                  }
                  S.at='ulsan';
                  S.recruitQ={id:'minji',stage:'ready',target:'ulsan',escort:true};
                  const event=D.events.find(item=>item.id==='rq_minji_join');
                  UI.showEvent(event);
                  UI.finishStory();
                  document.querySelector('.event-choice-dock .choice[data-i="0"]')?.click();
                  UI.finishStory();
                  const accept=document.querySelector('.event-choice-dock .recruit-accept');
                  const decline=document.querySelector('.event-choice-dock .recruit-decline');
                  const acceptRect=accept?.getBoundingClientRect();
                  const declineRect=decline?.getBoundingClientRect();
                  return {
                    acceptText:accept?.textContent.replace(/\s+/g,' ').trim()||'',
                    declineText:decline?.textContent.replace(/\s+/g,' ').trim()||'',
                    disabled:!!accept?.disabled,
                    classes:accept?.className||'',
                    widths:[acceptRect?.width||0,declineRect?.width||0],
                    overlap:!!(acceptRect&&declineRect&&acceptRect.bottom>declineRect.top),
                    bottoms:[acceptRect?.bottom||0,declineRect?.bottom||0],viewport:innerHeight
                  };
                }""",
                full,
            )

        available = open_decision(False)
        page.screenshot(path=str(SHOT_DIR / "minji-join-available.png"), full_page=True)
        joined = page.evaluate(
            """() => {
              document.querySelector('.event-choice-dock .recruit-accept')?.click();
              return {joined:S.party.includes('minji'),closed:!document.querySelector('#ev-wrap')?.classList.contains('on')};
            }"""
        )
        full = open_decision(True)
        page.screenshot(path=str(SHOT_DIR / "minji-join-full.png"), full_page=True)
        declined = page.evaluate(
            """() => {
              document.querySelector('.event-choice-dock .recruit-decline')?.click();
              return {joined:S.party.includes('minji'),closed:!document.querySelector('#ev-wrap')?.classList.contains('on')};
            }"""
        )
        browser.close()

    assert not errors, errors
    assert "정식 동료 합류" in available["acceptText"], available
    assert "민지와 함께 간다" in available["acceptText"], available
    assert "합류 후 동료석 1/2" in available["acceptText"], available
    assert available["declineText"] == "여기서 작별한다", available
    assert not available["disabled"] and "recruit-accept" in available["classes"], available
    assert min(available["widths"]) >= 280 and not available["overlap"], available
    assert joined == {"joined": True, "closed": True}, joined
    assert full["disabled"] and "동료석 2/2" in full["acceptText"], full
    assert "개조 후 합류 가능" in full["acceptText"], full
    assert not full["overlap"] and full["bottoms"][1] <= full["viewport"], full
    assert declined == {"joined": False, "closed": True}, declined
    print("✅ 동료 합류 주 행동 · 좌석 상태 · 작별 보조 버튼 UI 정상")


if __name__ == "__main__":
    main()
