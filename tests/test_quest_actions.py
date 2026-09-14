#!/usr/bin/env python3
"""Goal links preview the next surface without making a gameplay decision."""
import os
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get("CARAVAN_TEST_URL", "http://127.0.0.1:4174/game?caravan-live=1")
ARTIFACTS = ROOT / "artifacts/road-dialogue-20260913"


def screenshot(page, name):
    folder = ARTIFACTS / 'goals'
    folder.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(folder / f'{name}.png'))


@pytest.fixture
def page():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        yield page
        assert not errors, errors
        browser.close()


def setup(page, extra=""):
    page.goto(URL)
    page.evaluate("""async extra => {
      localStorage.setItem('caravan_story_auto','0');
      G.newGame('onroad','목표 점검','full');
      S.at='busan';S.known=Object.keys(D.nodes);S.driving=null;S.min=600;
      S.flags.main_mission_started=true;S.flags.onboarding_event_guide=true;
      eval(extra);
      await UI.restoreQaView({screen:'game'});
      G.save();
    }""", extra)
    page.locator("#dk-objectives").click()
    page.wait_for_function("QuestLedgerUI.isOpen()")


def gameplay(page):
    return page.evaluate("""() => JSON.stringify({
      at:S.at,driving:S.driving,day:S.day,min:S.min,fuel:S.fuel,scrap:S.scrap,
      food:S.food,water:S.water,items:S.items,fatigue:S.fatigue,van:S.van,hp:S.hp,
      flags:S.flags,stats:S.stats,quest:S.quest,followup:S.questFollowup,
      recruit:S.recruitQ,party:S.party,comps:S.comps,used:S.used,notes:S.notes,
      completed:G.ensureQuestLedger().completed,tracked:G.ensureQuestLedger().tracked
    })""")


def open_action(page, quest_id, label):
    button = page.locator(f'[data-quest-action="{quest_id}"]')
    assert button.count() == 1, f"missing next-action link for {quest_id}"
    assert button.inner_text() == label
    before = gameplay(page)
    button.click()
    assert not page.evaluate("QuestLedgerUI.isOpen()")
    assert gameplay(page) == before, "opening a goal action changed gameplay state"
    return before


def test_main_route_preview_and_return(page):
    setup(page)
    before = open_action(page, "main_namsan", "경로 보기")
    assert page.locator('#journey-mode-route').is_visible()
    assert page.locator('.nav-destination-card.is-selected').get_attribute('data-route-select') == 'yangsan'
    assert page.locator('[data-nav-depart]').is_visible()
    page.locator('#dk-objectives').click()
    assert page.evaluate("QuestLedgerUI.isOpen()")
    assert gameplay(page) == before


@pytest.mark.parametrize("width,height", [(320, 568), (390, 844)])
def test_current_main_evidence_opens_explore_without_starting_it(page, width, height):
    page.set_viewport_size({"width": width, "height": height})
    setup(page, "S.at='yangsan';")
    assert page.locator('.quest-main-steps .is-current small').count() == 0
    assert page.locator('.quest-main-steps .is-done small').count() > 0
    assert page.locator('.quest-main-steps .is-upcoming small').count() > 0
    assert page.locator('.quest-ledger-list').evaluate('n=>n.scrollWidth<=n.clientWidth+1')
    button = page.locator('[data-quest-action="main_namsan"]')
    bounds = button.bounding_box()
    assert bounds and bounds['height'] >= 44
    dock = page.locator('#dock').bounding_box()
    assert bounds['y'] + bounds['height'] <= dock['y'], 'next action starts beneath the dock'
    screenshot(page, f'main-{width}')
    before = open_action(page, 'main_namsan', '주변 탐색 보기')
    assert page.locator('#journey-mode-local').is_visible()
    assert page.locator('#journey-mode-local [data-a="explore"]').is_visible()
    assert not page.locator('#ev-wrap.on').count()
    # The preview assigns focus on the next animation frame after layout.
    expect(page.locator('#journey-mode-local [data-a="explore"]')).to_be_focused()
    page.locator('#dk-objectives').click()
    assert gameplay(page) == before
    # The next surface can be reached again after a real load, with the same
    # evidence still pending and no exploration time paid by the preview.
    page.reload()
    page.wait_for_function('!!S')
    page.evaluate("document.documentElement.classList.add('qa-exact-replay')")
    page.locator('#dk-objectives').click()
    open_action(page, 'main_namsan', '주변 탐색 보기')
    assert page.evaluate('!S.flags.first_order_trace')
    assert page.evaluate('S.min') == 600


SIDE_QUEST = """
S.quest={ledgerId:'goal_delivery',kind:'deliver',item:'검사 기록',from:'miryang',
  to:'gwangju',reward:10,due:8};
"""


def test_main_and_side_routes_resolve_the_clicked_card_without_changing_tracking(page):
    setup(page, SIDE_QUEST + "G.ensureQuestLedger().tracked=['goal_delivery'];")
    assert page.evaluate("G.questNavigationPlan().target") == 'gwangju'
    # A fresh side-quest notice now opens its own category. This test exercises
    # each explicitly chosen card, independently of the initial category.
    page.locator('[data-quest-tab="main"]').click()
    before = open_action(page, 'main_namsan', '경로 보기')
    assert page.locator('.nav-destination-card.is-selected').get_attribute('data-route-select') == 'yangsan'
    assert '메인 스토리 경로' in page.locator('.nav-destination-card.is-selected').inner_text()
    page.locator('#dk-objectives').click()
    page.locator('[data-quest-tab="side"]').click()
    open_action(page, 'goal_delivery', '경로 보기')
    assert page.locator('.nav-destination-card.is-selected').get_attribute('data-route-select') == 'gimhae'
    assert '사이드 미션 경로' in page.locator('.nav-destination-card.is-selected').inner_text()
    screenshot(page, 'side-route')
    assert gameplay(page) == before
    page.locator('#dk-objectives').click()
    page.locator('[data-quest-track="goal_delivery"]').click()
    assert page.evaluate('G.ensureQuestLedger().tracked') == []
    open_action(page, 'goal_delivery', '경로 보기')
    assert page.evaluate('G.ensureQuestLedger().tracked') == []


def test_side_arrival_opens_board_without_turnin_and_keeps_completed_records(page):
    setup(page, SIDE_QUEST + """
      S.at='gwangju';G.ensureQuestLedger().tracked=['goal_delivery'];
      G.ensureQuestLedger().completed.push({id:'old_delivery',title:'지난 배달',
        phase:'부산 → 진주',next:'완료한 기록',expected:'고철 10개를 받았다.'});
    """)
    page.locator('[data-quest-tab="side"]').click()
    before = open_action(page, 'goal_delivery', '게시판 보기')
    assert page.locator('#ovl-stl').is_visible()
    assert page.locator('[data-market-select="quest-active"]').count() or '검사 기록' in page.locator('#stl-body').inner_text()
    assert page.evaluate("!!S.quest&&G.questReady()")
    screenshot(page, 'side-market')
    page.locator('#stl-leave').click()
    page.locator('#dk-objectives').click()
    assert gameplay(page) == before
    page.locator('[data-quest-tab="completed"]').click()
    assert '지난 배달' in page.locator('.quest-ledger-list').inner_text()
    assert page.locator('[data-quest-action]').count() == 0
    assert page.locator('[data-quest-track]').count() == 0
    page.locator('[data-quest-tab="side"]').click()
    open_action(page, 'goal_delivery', '게시판 보기')
    turnin = page.locator('#market-action')
    assert turnin.inner_text() == '전달한다'
    reward_before = page.evaluate('S.scrap')
    turnin.click()
    assert page.evaluate('S.quest') is None
    assert page.evaluate('S.scrap') == reward_before + 14  # reward + early bonus
    assert page.evaluate('G.ensureQuestLedger().completed.length') == 2
    page.reload()
    page.wait_for_function('!!S')
    assert page.evaluate('S.scrap') == reward_before + 14
    assert page.evaluate('G.ensureQuestLedger().completed.length') == 2
    assert page.evaluate('S.quest') is None


@pytest.mark.parametrize('quest_id,tab', [('main_namsan', 'main'), ('goal_delivery', 'side')])
def test_driving_route_preview_preserves_the_current_leg_and_back_path(page, quest_id, tab):
    setup(page, SIDE_QUEST + "G.startTravel('yangsan');S.driving.slots=[];")
    page.locator(f'[data-quest-tab="{tab}"]').click()
    before = open_action(page, quest_id, '경로 보기')
    assert page.locator('#ovl-map').is_visible()
    assert page.locator('#nodecard').is_visible()
    page.locator('#map-x').click()
    assert page.locator('#travelbar').is_visible()
    page.locator('#dk-objectives').click()
    assert gameplay(page) == before


@pytest.mark.parametrize('extra,label,focus', [
    ("S.recruitQ={id:'parkss',target:'gumi',stage:'task'};S.at='gumi';", '동료의 부탁 보기', 'recruitstep'),
    ("S.recruitQ={id:'parkss',target:'gumi',stage:'follow',roadDay:S.day};S.at='gumi';", '야영 준비 보기', 'camp'),
    ("S.party=['minji'];S.comps.minji.pending=1;", '동료 보기', 'crew'),
])
def test_companion_links_preview_stage_appropriate_controls(page, extra, label, focus):
    setup(page, extra)
    page.locator('[data-quest-tab="side"]').click()
    quest_id = 'companion_minji' if focus == 'crew' else 'companion_parkss'
    before = open_action(page, quest_id, label)
    if focus == 'crew':
        assert page.locator('#ovl-status').is_visible()
        assert page.locator('#dk-crew').get_attribute('aria-current') == 'page'
        screenshot(page, 'companion-crew')
        page.locator('#st-x').click()
    else:
        assert page.locator(f'#journey-mode-local [data-a="{focus}"]').is_visible()
        assert not page.locator('#ev-wrap.on').count()
    page.locator('#dk-objectives').click()
    assert gameplay(page) == before


def test_procurement_previews_local_supplies_without_buying(page):
    setup(page, """S.at='miryang';S.quest={ledgerId:'goal_procure',kind:'procure',
      need:{name:'부품',qty:4},from:'daegu',to:'daegu',reward:15,due:8};""")
    page.locator('[data-quest-tab="side"]').click()
    before = open_action(page, 'goal_procure', '물품·게시판 보기')
    assert page.locator('#ovl-stl').is_visible()
    page.locator('#stl-leave').click()
    assert gameplay(page) == before


def test_journal_to_goal_to_local_closes_the_underlying_overlay(page):
    setup(page, "S.at='yangsan';")
    page.locator('.quest-ledger-back').click()
    page.evaluate("""() => UI.restoreQaView({screen:'game',surfaces:[{
      selector:'#ovl-journal',className:'ovl on',ariaHidden:'false',
      html:document.querySelector('#ovl-journal').innerHTML
    }]})""")
    assert page.locator('#ovl-journal').is_visible()
    # Recreate the overlapping restored/tool-entry state; the journal normally
    # covers the dock, so entering goals here uses its existing public opener.
    page.evaluate('QuestLedgerUI.open()')
    before = open_action(page, 'main_namsan', '주변 탐색 보기')
    assert not page.locator('#ovl-journal').is_visible()
    assert page.locator('#journey-mode-local [data-a="explore"]').is_visible()
    page.locator('#dk-objectives').click()
    assert gameplay(page) == before


def test_seoul_preview_requires_its_entry_scene_and_does_not_advance_stage(page):
    setup(page, """
      S.at='seoul';S.stats.km=400;
      for(const f of ['first_order_trace','parents_routes_traced','parent_key_found',
        'main_testimony_record','main_command_record','father_fate_known',
        'mother_reunited','mother_broadcast_ready','postman_letter']) S.flags[f]=true;
      for(const cell of D.resistance||[]) S.flags[cell.flag]=true;
    """)
    assert page.evaluate('G.seoulReady()')
    assert not page.locator('[data-quest-action="main_namsan"]').count()
    page.evaluate('S.flags.seoul_open=true;QuestLedgerUI.render()')
    before = open_action(page, 'main_namsan', '서울 진입로 보기')
    assert page.locator('#ovl-seoul').is_visible()
    assert page.locator('#seoul-go').is_visible()
    screenshot(page, 'seoul-preview')
    page.locator('[data-quest-return]').click()
    page.locator('#dk-objectives').click()
    assert gameplay(page) == before


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, '-q']))
