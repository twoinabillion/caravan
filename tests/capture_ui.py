#!/usr/bin/env python3
"""핵심 모바일 UI 상태를 한 번에 캡처한다.

현재 빌드 산출물을 기준으로 지도, 상태, 정비소, 이벤트 시트를 남긴다.
디자인 회귀를 눈으로 비교할 때 쓰는 보조 도구다.
"""
import pathlib
from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "서울까지400km.html").as_uri()
SHOT = ROOT / "tests" / "shots" / "ui"
SHOT.mkdir(parents=True, exist_ok=True)


def enter_game(page):
    page.goto(URL)
    page.wait_for_timeout(500)
    page.click("#bt-new")
    page.click("#mode-on")
    for _ in range(page.evaluate("D.intro.length")):
        page.click("#scr-intro")
        page.wait_for_timeout(80)
    page.fill("#inp-name", "다온")
    page.click("#bt-name")
    page.wait_for_timeout(350)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(
        viewport={"width": 480, "height": 860},
        device_scale_factor=1,
    )
    enter_game(page)
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
          document.querySelector('#bubbles').replaceChildren();
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

    page.evaluate("UI.showStl('daegu')")
    page.wait_for_timeout(200)
    page.locator("#garage").scroll_into_view_if_needed()
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "06-garage-fuel.png"))
    page.click('#garage [data-ug="chassis"]')
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "07-garage-chassis.png"))
    page.evaluate("document.querySelector('#ovl-stl').classList.remove('on')")

    page.evaluate("G.openEventById('roadbeat_200_archive')")
    page.wait_for_timeout(200)
    page.screenshot(path=str(SHOT / "08-event-context.png"))
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
        }"""
    )
    page.wait_for_timeout(200)
    page.screenshot(path=str(SHOT / "09-event-long-top.png"))
    scroll_metrics = page.evaluate(
        """() => {
          const copy=document.querySelector('.event-scroll');
          const choices=document.querySelector('.event-choice-dock>.choices');
          const before={copyTop:copy.scrollTop, choiceTop:choices.scrollTop,
            copyClient:copy.clientHeight, copyScroll:copy.scrollHeight,
            choiceClient:choices.clientHeight, choiceScroll:choices.scrollHeight,
            choiceCount:choices.querySelectorAll('.choice').length};
          copy.scrollTop=copy.scrollHeight;
          choices.scrollTop=choices.scrollHeight;
          return {...before, copyAfter:copy.scrollTop, choiceAfter:choices.scrollTop};
        }"""
    )
    page.wait_for_timeout(120)
    page.screenshot(path=str(SHOT / "10-event-long-scrolled.png"))

    browser.close()
    print(SHOT)
    print(scroll_metrics)
