#!/usr/bin/env python3
"""Live Game Studio에서는 소모 자원만 무한이고 성장 진행은 그대로인가."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()

    live = browser.new_page()
    live.add_init_script("localStorage.clear()")
    live.goto(f"{GAME}?caravan-live=1&rev=test")
    result = live.evaluate(
        """() => {
          G.newGame('onroad','무한 자원 점검','full');
          UI.restoreQaView({screen:'game'});
          document.querySelector('#ev-wrap')?.classList.remove('on');
          S.fuel=0; S.water=0; S.food=0; S.scrap=0;
          S.items['부품']=0; S.items['의약품']=0; S.items['탄약']=0;
          const before={fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,parts:S.items['부품'],km:S.stats.km};
          const requirements={fuel:G.hasResource('fuel',99),water:G.hasResource('water',99),
            food:G.hasResource('food',99),scrap:G.hasResource('scrap',99),parts:G.hasResource('부품',99),
            storyItem:G.hasResource('부모님 운행표',1)};
          G.applyFx({fuel:-4,water:-2,food:-2,scrap:-5,item:{'부품':-2,'탄약':-1}});
          const meal=G.consumeMeal('lunch');
          S.van=50; const repaired=G.fieldRepair();
          const travelAllowed=G.canTravelTo('yangsan').ok;
          G.startTravel('yangsan');
          if(S.driving){ S.driving.slots=[]; G.tick(.5); }
          UI.renderAll();
          document.querySelector('#dk-status')?.click();
          const bagText=document.querySelector('.bag-critical')?.innerText||'';
          return {mode:G.isInfiniteResourceMode(),before,
            after:{fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,parts:S.items['부품']},
            requirements,mealOk:meal.ok,repaired,travelAllowed,kmAdvanced:S.stats.km>before.km,
            display:G.resourceDisplay('fuel',0,'L'),stageFuel:document.querySelector('#stage-fuel')?.textContent,
            testButton:document.querySelector('#intro-test-shortcut')?.textContent,bagText};
        }"""
    )
    assert result["mode"], result
    assert all(result["requirements"][key] for key in ("fuel", "water", "food", "scrap", "parts")), result
    assert not result["requirements"]["storyItem"], result
    assert result["after"] == {"fuel": 0, "water": 0, "food": 0, "scrap": 0, "parts": 0}, result
    assert result["mealOk"] and result["repaired"] and result["travelAllowed"], result
    assert result["kmAdvanced"], result
    assert result["display"] == "∞", result
    assert result["stageFuel"] == "∞", result
    assert "자원 ∞" in result["testButton"], result
    assert all(label in result["bagText"] for label in ("물\n∞", "식량\n∞", "연료\n∞")), result

    normal = browser.new_page()
    normal.add_init_script("localStorage.clear()")
    normal.goto(GAME)
    normal_result = normal.evaluate(
        """() => {
          G.newGame('onroad','일반 자원 점검','full');
          S.food=3; S.scrap=5; S.items['부품']=2;
          G.addSupply('food',-1); G.spendResource('scrap',2); G.spendResource('부품',1);
          return {mode:G.isInfiniteResourceMode(),food:S.food,scrap:S.scrap,parts:S.items['부품']};
        }"""
    )
    assert normal_result == {"mode": False, "food": 2, "scrap": 3, "parts": 1}, normal_result
    browser.close()

print("✅ 스튜디오 자원 ∞ · 일반 플레이 차감 · 성장 진행 분리")
