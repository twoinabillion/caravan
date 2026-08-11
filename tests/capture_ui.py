#!/usr/bin/env python3
"""핵심 모바일 UI 상태를 한 번에 캡처한다.

현재 빌드 산출물을 기준으로 지도, 상태, 정비소, 이벤트 시트를 남긴다.
디자인 회귀를 눈으로 비교할 때 쓰는 보조 도구다.
"""
import os
import pathlib
from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "서울까지400km.html").as_uri()
WIDTH = int(os.environ.get("CARAVAN_VIEWPORT_WIDTH", "480"))
HEIGHT = int(os.environ.get("CARAVAN_VIEWPORT_HEIGHT", "860"))
SHOT_NAME = os.environ.get("CARAVAN_SHOT_DIR", "ui")
SHOT = ROOT / "tests" / "shots" / SHOT_NAME
SHOT.mkdir(parents=True, exist_ok=True)


def enter_game(page):
    page.goto(URL)
    page.wait_for_timeout(500)
    page.click("#bt-new")
    page.click("#mode-on")
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    for _ in range(page.evaluate("D.intro.reduce((n,p)=>n+p.beats.length,0)")):
        page.click("#scr-intro")
        page.wait_for_timeout(80)
    page.wait_for_timeout(350)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(
        viewport={"width": WIDTH, "height": HEIGHT},
        device_scale_factor=1,
    )
    enter_game(page)
    page.wait_for_timeout(250)
    page.screenshot(path=str(SHOT / "00d-stop-actions.png"))
    page.click('[data-journey-mode="route"]')
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "00-navigation-busan.png"))
    page.click('[data-journey-mode="local"]')
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "00d-stop-actions.png"))
    page.evaluate(
        """() => {
          S.recruitQ={id:'minji',stage:'task',target:'busan',startedDay:S.day};
          UI.renderAll();
        }"""
    )
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "00da-stop-actions-extra.png"))
    page.evaluate("S.recruitQ=null; UI.renderAll()")
    page.evaluate(
        """() => {
          S.at = 'daegu';
          S.known = [...new Set([...S.known, 'daegu', 'gumi', 'daejeon', 'jeonju'])];
          S.party = ['minji', 'parkss', 'leo'];
          S.items['부품'] = 5;
          S.scrap = 48;
          S.up = {tank1:true, bench:true, susp:true, collector:true, antenna:true};
          S.quest = {
            kind:'procure', need:{name:'부품', qty:8}, from:'daegu',
            to:'daejeon', reward:22, due:S.day + 2
          };
          S.flags.ai_identified = true;
          S.flags.gp_envelope_found = true;
          S.flags.resist_revealed = true;
          S.flags.cell_road = true;
          UI.renderAll();
        }"""
    )
    page.wait_for_timeout(250)
    page.screenshot(path=str(SHOT / "01-main.png"))
    road_box = page.locator("#dk-road").bounding_box()
    if road_box:
        page.mouse.move(road_box["x"] + road_box["width"] / 2, road_box["y"] + road_box["height"] / 2)
        page.mouse.down()
        page.wait_for_timeout(80)
        page.screenshot(path=str(SHOT / "01d-nav-pressed.png"))
        page.mouse.up()
    for index in range(5):
        page.evaluate(
            """index => {
              const buttons=[...document.querySelectorAll('#dock button')];
              buttons.forEach((button, buttonIndex) => {
                button.classList.toggle('here', buttonIndex === index);
                if (buttonIndex === index) button.setAttribute('aria-current', 'page');
                else button.removeAttribute('aria-current');
              });
            }""",
            index,
        )
        page.wait_for_timeout(80)
        page.screenshot(path=str(SHOT / f"01e-nav-selected-{index + 1}.png"))
    page.evaluate(
        """() => {
          const buttons=[...document.querySelectorAll('#dock button')];
          buttons.forEach((button, index) => {
            button.classList.toggle('here', index === 0);
            if (index === 0) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
          });
        }"""
    )
    page.locator("#dk-menu").focus()
    page.keyboard.press("Shift+Tab")
    page.keyboard.press("Shift+Tab")
    page.wait_for_timeout(80)
    page.screenshot(path=str(SHOT / "01f-nav-focus.png"))
    page.evaluate("document.querySelector('#dk-map').blur()")
    page.evaluate(
        """() => {
          UI.toast('🔧 좌석 증축이 끝났다 — 동료 자리 +1');
          UI.toast('📍 다음 목적지까지 31km');
          UI.toast('🎒 길에서 쓸 만한 부품을 찾았다');
          UI.speak({who:'sys', t:'오늘 길은 생각보다 조용하다.'});
          UI.speak({who:'minji', t:'조용할 때 연료부터 확인해.'});
          UI.speak({who:'leo', t:'그럼 확인하는 동안 한 곡만.'});
        }"""
    )
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "01c-compact-notifications.png"))
    page.evaluate(
        """() => {
          document.querySelector('#toasts').replaceChildren();
          UI.clearSpeech();
        }"""
    )

    page.evaluate("""() => {
      S.at='daejeon'; S.driving=null;
      S.recruitQ={id:'eunsu',stage:'task',target:'daejeon',startedDay:S.day};
      UI.renderAll();
    }""")
    page.wait_for_timeout(180)
    page.screenshot(path=str(SHOT / "01a-recruit-quest.png"))
    page.evaluate("G.openRecruitStep()")
    page.wait_for_timeout(180)
    page.screenshot(path=str(SHOT / "01b-recruit-scene.png"))
    page.evaluate("""() => {
      document.querySelector('#ev-wrap').classList.remove('on');
      S.recruitQ=null; S.at='daegu'; UI.renderAll();
    }""")

    page.click("#dk-map")
    page.wait_for_timeout(300)
    page.screenshot(path=str(SHOT / "02-map.png"))
    page.click("#map-x")

    page.click("#dk-status")
    page.wait_for_timeout(200)
    page.screenshot(path=str(SHOT / "03-status-top.png"))
    page.click('#st-tabs [data-st="journey"]')
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "04-status-journey.png"))
    page.click('#st-tabs [data-st="crew"]')
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "05-status-crew.png"))
    page.click("#st-x")

    page.click("#dk-menu")
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "05b-menu.png"))
    page.click("#menu-x")

    page.evaluate("UI.showStl('daegu','hub')")
    page.wait_for_timeout(200)
    page.screenshot(path=str(SHOT / "06-settlement-hub.png"))
    page.evaluate("UI.showStl('daegu','market')")
    page.wait_for_timeout(160)
    page.screenshot(path=str(SHOT / "07-market.png"))
    page.evaluate("UI.showStl('daegu','people')")
    page.wait_for_timeout(160)
    page.screenshot(path=str(SHOT / "08-people.png"))
    page.evaluate("UI.showStl('daegu','garage')")
    page.wait_for_timeout(160)
    page.locator("#garage").scroll_into_view_if_needed()
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "09-garage-fuel.png"))
    page.click('#garage [data-ug="chassis"]')
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "10-garage-chassis.png"))
    page.evaluate("document.querySelector('#ovl-stl').classList.remove('on')")

    page.evaluate("""() => {
      S.at='miryang'; S.driving=null; S.party=['minji'];
      S._stlField={daily:{},once:{},impact:{},log:[]};
      UI.showStl('miryang','hub');
    }""")
    page.wait_for_timeout(180)
    page.screenshot(path=str(SHOT / "10a-miryang-walk-hub.png"))
    page.evaluate("UI.showStl('miryang','alley')")
    page.wait_for_timeout(160)
    page.screenshot(path=str(SHOT / "10b-miryang-alley.png"))
    page.click('[data-stlfield="noodles"]')
    page.click('.stl-field-switcher [data-fieldspot="pump"]')
    page.click('[data-stlfield="pump"]')
    page.wait_for_timeout(160)
    page.screenshot(path=str(SHOT / "10c-miryang-hidden-trace.png"))
    page.evaluate("UI.showStl('miryang','hub')")
    page.wait_for_timeout(180)
    page.screenshot(path=str(SHOT / "10c2-miryang-changed-hub.png"))
    page.evaluate("document.querySelector('#ovl-stl').classList.remove('on')")

    page.evaluate("""() => {
      S.combat=null; S.injuries={}; S.party=['minji'];
      UI.showEvent(D.events.find(e=>e.id==='patrol_walker')); UI.finishStory();
      document.querySelector('#ev-sheet [data-i="1"]')?.focus();
    }""")
    page.wait_for_timeout(120)
    page.mouse.move(1, 1)
    page.screenshot(path=str(SHOT / "10d-combat-plan.png"))
    page.click('#ev-sheet [data-i="1"]')
    page.evaluate("UI.finishStory()")
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "10e-combat-choice-result.png"))
    page.evaluate("""() => {
      document.querySelector('#ev-wrap').classList.remove('on'); S._chain=null;
      UI.showEvent(D.events.find(e=>e.id==='combat_walker_read')); UI.finishStory();
    }""")
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "10f-combat-next-phase.png"))
    page.evaluate("document.querySelector('#ev-wrap').classList.remove('on'); S._chain=null")

    page.evaluate("G.openEventById('roadbeat_200_archive')")
    page.wait_for_timeout(200)
    page.screenshot(path=str(SHOT / "11-event-context.png"))
    page.evaluate(
        """() => {
          document.querySelector('#ev-wrap').classList.remove('on');
          S.party = Object.keys(D.comps);
          Object.keys(D.comps).forEach(id => {
            const c=D.comps[id], st=S.comps[id];
            st.lvl=3; st.perks=[...(st.perks||[]), c.perks[3].id];
          });
          (D.deeds||[]).forEach(d => { if (d.flag) S.flags[d.flag]=true; });
          (D.eraTraces||[]).forEach(t => { S.flags[t.flag]=true; });
          ['ridge_path','sokcho_end','librarian_truth'].forEach(f => { S.flags[f]=true; });
          UI.showEvent(D.seoulStops.find(e => e.id === 'seoul_core'));
          UI.finishStory();
        }"""
    )
    page.wait_for_timeout(200)
    page.screenshot(path=str(SHOT / "12-event-long-top.png"))
    paging_metrics = page.evaluate(
        """() => {
          const choices=document.querySelector('.event-choice-dock>.choices');
          const first=[...choices.querySelectorAll('.choice')].filter(node=>!node.hidden).map(node=>node.dataset.i);
          document.querySelector('[data-choice-next]')?.click();
          const second=[...choices.querySelectorAll('.choice')].filter(node=>!node.hidden).map(node=>node.dataset.i);
          return {choiceCount:choices.querySelectorAll('.choice').length,first,second,
            page:document.querySelector('[data-choice-page]')?.textContent||''};
        }"""
    )
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "13-event-long-page2.png"))

    browser.close()
    print(SHOT)
    print(paging_metrics)
