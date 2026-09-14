"""Route aftermath recalls in the compact default ending.

Breaks caught: an unearned/ambiguous aftermath entering the ending, a selected
action being replaced by another action's prose, a recall creating a new turn,
and a resolved aftermath disappearing after the real save/Continue path.
"""
import os
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get("CARAVAN_TEST_URL", (ROOT / "서울까지400km.html").as_uri())
CAPTURES = ROOT / "artifacts" / "director-payoff-20260914" / "task3-route-recall"

RECALLS = [
    ("ridge", "route_ridge_saved", "supplies", "문경 선반에 놓고 온 약 한 봉지가 떠올랐다. 그 뒤 배달이 어땠는지는 돌아가는 길에 물어봐야겠다."),
    ("ridge", "route_ridge_saved_partial", "work", "문경에서 약 꾸러미를 싸던 손이 떠올랐다. 종이에 적었던 목적지 이름 하나가 아직 기억났다."),
    ("ridge", "route_ridge_failed", "handoff", "문경에서는 북쪽으로 가야 한다고 말하고 떠났다. 남은 꾸러미를 맡던 사람이 차를 빼라며 손을 들어 주었다."),
    ("market", "route_market_escorted", "supplies", "전주 수레 옆에 내려놓은 고철이 떠올랐다. 그 바퀴가 얼마나 갔는지는 아직 모른다."),
    ("market", "route_market_escorted_partial", "work", "전주에서 수레 축을 받치던 자세 때문인지 어깨를 한 번 돌렸다. 그때 바퀴를 끼우던 사람도 이제 쉬고 있을까."),
    ("market", "route_market_failed", "handoff", "전주에서는 수레 수선을 맡지 않고 북행을 이어 갔다. 장터 사람들이 비켜 준 좁은 길로 달구지가 빠져나왔었다."),
]


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        yield browser
        browser.close()


def new_page(browser, width=390, height=844):
    """Each test gets an isolated storage context; reload tests do not install a clearer."""
    page = browser.new_page(viewport={"width": width, "height": height})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL)
    page.evaluate("localStorage.clear(); sessionStorage.clear(); G.newGame('onroad','엔딩 회상 검수','full')")
    return page, errors


def test_route_recall_requires_one_earned_action_and_compacts_every_default_ending(browser):
    page, errors = new_page(browser)
    expected = [row[3] for row in RECALLS]
    result = page.evaluate(
        """rows=>{
          const night=D.events.find(event=>event.id==='seoul_night');
          const campChoice=D.campConversations.minji.choices.find(choice=>choice.id==='listen');
          const extraCamp=D.campConversations.kangwoo.choices[0];
          const base=(route,outcome,choice)=>({
            flags:{[outcome]:true,[`route_${route}_after_${choice}`]:true,
              [`route_${route}_after_done`]:true,core_transfer:true,
              mother_broadcast_ready:true,father_fate_known:true,traces_presented:true,
              full_crew_testimony:true},
            routePlan:{id:route},used:[`route_${route}_aftermath`],
            party:['minji','kangwoo','eunsu','parkss','jaeyi','leo'],
            opening:{decisions:{opening_departure:{choiceId:'leave_key'}}},
            campMemories:{
              minji:{choiceId:campChoice.id,visits:3,home:campChoice.home},
              kangwoo:{choiceId:extraCamp.id,visits:2,home:extraCamp.home}
            }
          });
          const earned=rows.map(([route,outcome,choice,want])=>{
            const S=base(route,outcome,choice),before=JSON.stringify(S);
            const recall=D.routeAftermathRecall?.(S)||'';
            const methods=['transfer','sleep','quarantine'].map(method=>{
              const state=structuredClone(S);
              state.flags.core_transfer=method==='transfer';
              state.flags.core_sleep=method==='sleep';
              state.flags.core_quarantine=method==='quarantine';
              return night.choices.map(choice=>choice.out[0].turns(state).map(turn=>turn.text));
            });
            return {recall,before,after:JSON.stringify(S),methods};
          });
          const solo=rows.map(([route,outcome,choice])=>{
            const S=base(route,outcome,choice);S.party=[];S.campMemories={};
            return ['transfer','sleep','quarantine'].flatMap(method=>{
              S.flags.core_transfer=method==='transfer';S.flags.core_sleep=method==='sleep';S.flags.core_quarantine=method==='quarantine';
              return night.choices.map(choice=>choice.out[0].turns(S).map(turn=>turn.text));
            });
          });
          const invalid=(mutate)=>{
            const S=base('ridge','route_ridge_saved','supplies'); mutate(S);
            return D.routeAftermathRecall?.(S)||'';
          };
          return {earned,solo,invalid:{
            missingRoute:invalid(S=>delete S.routePlan),
            unknownRoute:invalid(S=>S.routePlan.id='other'),
            noCombat:invalid(S=>delete S.flags.route_ridge_saved),
            unused:invalid(S=>S.used=[]),
            undone:invalid(S=>delete S.flags.route_ridge_after_done),
            noAction:invalid(S=>delete S.flags.route_ridge_after_supplies),
            multiple:invalid(S=>S.flags.route_ridge_after_work=true),
            malformed:D.routeAftermathRecall?.({flags:{route_ridge_saved:true},routePlan:{id:'ridge'},used:[]})||'',
            nullState:D.routeAftermathRecall?.(null)||'',
            usedNotArray:invalid(S=>S.used={id:'route_ridge_aftermath'})
          }};
        }""",
        [list(row) for row in RECALLS],
    )
    assert not errors, errors
    assert [row["recall"] for row in result["earned"]] == expected
    for row, selected in zip(result["earned"], expected):
        assert row["before"] == row["after"], "pure recall reader must not alter the save"
        for method in row["methods"]:
            for turns in method:
                text = "\n".join(turns)
                assert len(turns) <= 12
                assert selected in text
                assert "감천 작업장 열쇠를 맡기던 손" in text
                assert "민지와 함께 보낸 시간이" in text
                assert sum(candidate in text for candidate in expected) == 1
    for solo_rows, selected in zip(result["solo"], expected):
        for turns in solo_rows:
            text = "\n".join(turns)
            assert len(turns) <= 12
            assert selected in text
            assert "민지는" not in text and "강우는" not in text
    assert result["invalid"] == {key: "" for key in result["invalid"]}
    page.close()


def test_resolved_aftermath_reloads_before_finale_and_keeps_the_visible_recall(browser):
    page, errors = new_page(browser)
    CAPTURES.mkdir(parents=True, exist_ok=True)
    before = page.evaluate(
        """()=>{
          S.at='mungyeong';S.driving=null;S.ended=false;S.used=[];
          S.routePlan={id:'ridge',status:'active',visited:['gimcheon','sangju','mungyeong']};
          S.flags.route_ridge_saved=true;
          if(!G.openRouteAftermath()) throw Error('earned ridge aftermath did not open');
          UI.finishStory();
          document.querySelector('#ev-sheet .choice[data-i="2"]').click();
          UI.finishStory();
          return {used:S.used.includes('route_ridge_aftermath'),done:S.flags.route_ridge_after_done,
            action:S.flags.route_ridge_after_handoff,recall:D.routeAftermathRecall(S)};
        }"""
    )
    assert before == {
        "used": True,
        "done": True,
        "action": True,
        "recall": RECALLS[2][3],
    }
    page.evaluate("G.save()")
    page.reload()
    if page.locator("#bt-continue").is_visible():
        page.locator("#bt-continue").click()
    page.wait_for_function("()=>S&&S.flags.route_ridge_after_done&&S.used.includes('route_ridge_aftermath')")
    restored = page.evaluate(
        """()=>{
          S.flags.core_transfer=true;
          UI.restoreQaView({screen:'game'});
          document.documentElement.classList.remove('qa-exact-replay');
          UI.showEvent(D.events.find(event=>event.id==='seoul_night'));UI.finishStory();
          return D.routeAftermathRecall(S);
        }"""
    )
    assert restored == RECALLS[2][3]
    page.locator('#ev-sheet .choice[data-i="0"]').click()
    page.evaluate("UI.finishStory();document.documentElement.classList.remove('qa-exact-replay')")
    page.wait_for_function("()=>[...document.querySelectorAll('#ev-sheet [data-story-entry]')].every(node=>Number(getComputedStyle(node).opacity)>.99)")
    visible = page.locator(".story-narration-text").filter(has_text=restored)
    assert visible.count() == 1
    record = page.locator('#ev-sheet .story-reading-record[data-record-history="false"]')
    assert record.count() == 1 and record.get_attribute("open") is None
    for width, height, large, label in [(320, 740, False, "320"), (390, 844, True, "390-large")]:
        page.set_viewport_size({"width": width, "height": height})
        page.evaluate("large=>{localStorage.setItem('caravan_ui_text',large?'large':'normal');document.documentElement.classList.toggle('ui-large-text',large)}", large)
        visible.scroll_into_view_if_needed()
        box = visible.bounding_box()
        assert box and box["x"] >= 0 and box["x"] + box["width"] <= width + 1
        page.screenshot(path=str(CAPTURES / f"default-record-closed-{label}.png"), full_page=True)
    page.evaluate("G.save()")
    page.reload()
    if page.locator("#bt-continue").is_visible():
        page.locator("#bt-continue").click()
    page.wait_for_function("()=>S&&document.querySelector('#ev-sheet')?.dataset.storyPhase==='outcome'")
    assert page.evaluate("document.documentElement.classList.contains('ui-large-text')")
    page.evaluate("UI.finishStory();document.documentElement.classList.remove('qa-exact-replay')")
    page.wait_for_function("()=>[...document.querySelectorAll('#ev-sheet [data-story-entry]')].every(node=>Number(getComputedStyle(node).opacity)>.99)")
    replay = page.locator(".story-narration-text").filter(has_text=restored)
    assert replay.count() == 1
    assert page.locator('#ev-sheet .story-reading-record[data-record-history="false"]').get_attribute("open") is None
    replay.scroll_into_view_if_needed()
    page.screenshot(path=str(CAPTURES / "reloaded-record-closed-390-large.png"), full_page=True)
    assert not errors, errors
    page.close()
