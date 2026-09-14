"""Route aftermath contracts against the built game.

Breaks caught: resolving the wrong legacy outcome, opening at the wrong route or
place, replaying a used scene, bypassing the shared resolver on arrival/local
entry, locking the no-resource departure, changing authored costs, and charging
again when a saved result receipt is restored.
"""
import os
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get("CARAVAN_TEST_URL", (ROOT / "서울까지400km.html").as_uri())
CAPTURES = ROOT / "artifacts" / "director-payoff-20260914" / "task2-route-aftermath"

ROUTES = {
    "ridge": {
        "node": "mungyeong",
        "from": "sangju",
        "flag": "route_ridge_saved",
        "event": "route_ridge_aftermath",
        "scene": "road-supply-shelter",
    },
    "market": {
        "node": "jeonju",
        "from": "muju",
        "flag": "route_market_escorted",
        "event": "route_market_aftermath",
        "scene": "jeonju-market",
    },
}


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        yield browser
        browser.close()


@pytest.fixture
def page(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.add_init_script("localStorage.clear(); sessionStorage.clear()")
    page.goto(URL)
    page.evaluate("G.newGame('onroad','노선 후속 검수','full')")
    yield page
    assert not errors, errors
    page.close()


@pytest.mark.parametrize(
    "route,flag,want",
    [
        ("ridge", "route_ridge_saved", "success"),
        ("ridge", "route_ridge_saved_partial", "partial"),
        ("ridge", "route_ridge_failed", "failure"),
        ("market", "route_market_escorted", "success"),
        ("market", "route_market_escorted_partial", "partial"),
        ("market", "route_market_failed", "failure"),
    ],
)
def test_earned_outcome(page, route, flag, want):
    assert (
        page.evaluate(
            """({route,flag})=>D.routeAftermathState?.({flags:{[flag]:true}},route)??null""",
            {"route": route, "flag": flag},
        )
        == want
    )


@pytest.mark.parametrize("route", ["ridge", "market"])
def test_conflicting_legacy_flags_resolve_conservatively(page, route):
    flags = (
        ["route_ridge_saved", "route_ridge_saved_partial", "route_ridge_failed"]
        if route == "ridge"
        else [
            "route_market_escorted",
            "route_market_escorted_partial",
            "route_market_failed",
        ]
    )
    result = page.evaluate(
        """({route,flags})=>{
          const state={flags:Object.fromEntries(flags.map(flag=>[flag,true]))};
          const all=D.routeAftermathState?.(state,route)??null;
          delete state.flags[flags[2]];
          const withoutFailure=D.routeAftermathState?.(state,route)??null;
          return {all,withoutFailure};
        }""",
        {"route": route, "flags": flags},
    )
    assert result == {"all": "failure", "withoutFailure": "partial"}


def test_no_outcome_wrong_route_wrong_place_used_and_driving_are_ineligible(page):
    result = page.evaluate(
        """()=>{
          const reset=()=>{
            G.newGame('onroad','후속 가드 검수','full');
            S.at='mungyeong';S.driving=null;S.ended=false;S.used=[];
            S.routePlan={id:'ridge',status:'active',visited:['gimcheon','sangju','mungyeong']};
            S.flags.route_ridge_saved=true;
          };
          const id=event=>event?.id??null,out={};
          reset();delete S.flags.route_ridge_saved;
          out.noOutcome=id(G.routeAftermathEvent?.());
          reset();S.routePlan.id='market';out.wrongRoute=id(G.routeAftermathEvent?.());
          reset();S.at='jeonju';out.wrongPlace=id(G.routeAftermathEvent?.());
          reset();S.used.push('route_ridge_aftermath');out.used=id(G.routeAftermathEvent?.());
          reset();S.driving={from:'sangju',to:'mungyeong',dist:26,gone:12};
          out.driving=id(G.routeAftermathEvent?.());
          reset();S.ended=true;out.ended=id(G.routeAftermathEvent?.());
          return out;
        }"""
    )
    assert result == {
        "noOutcome": None,
        "wrongRoute": None,
        "wrongPlace": None,
        "used": None,
        "driving": None,
        "ended": None,
    }


@pytest.mark.parametrize("route", ["ridge", "market"])
def test_actual_arrival_opens_the_matching_aftermath_before_location_event(page, route):
    config = ROUTES[route]
    event_id = page.evaluate(
        """({route,node,from,flag})=>{
          G.newGame('onroad','도착 후속 검수','full');
          S.at=from;S.ended=false;S.used=[];S.flags[flag]=true;
          S.routePlan={id:route,status:'active',chosenDay:S.day,startedKm:0,
            visited:D.routePlans[route].corridor.slice(0,D.routePlans[route].corridor.indexOf(node))};
          const gameMinute=S.day*1440+S.min;
          S.driving={from,to:node,road:'normal',dist:20,gone:20,eventCount:0,
            snapshot:{gameMinute,fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,
              van:S.van,fatigue:S.fatigue,pursuit:S.pursuit,build:'기본 생존형'}};
          const original=UI.onArrive;UI.onArrive=()=>0;
          try{G.arrive();}finally{UI.onArrive=original;}
          return document.querySelector('#ev-sheet')?.dataset.eventId||null;
        }""",
        {"route": route, **config},
    )
    assert event_id == config["event"]


@pytest.mark.parametrize(
    "route,width,height,large,label",
    [
        ("ridge", 320, 740, False, "ridge-320"),
        ("market", 390, 844, True, "market-390-large"),
    ],
)
def test_local_action_uses_the_resolver_and_keeps_ordinary_stop_actions(
    page, route, width, height, large, label
):
    config = ROUTES[route]
    CAPTURES.mkdir(parents=True, exist_ok=True)
    page.set_viewport_size({"width": width, "height": height})
    result = page.evaluate(
        """({route,node,flag,large})=>{
          G.newGame('onroad','현지 후속 검수','full');
          S.at=node;S.driving=null;S.ended=false;S.used=[];S.flags[flag]=true;
          S.routePlan={id:route,status:'active',visited:[node]};
          document.documentElement.classList.toggle('ui-large-text',large);
          UI.restoreQaView({screen:'game'});UI.renderAll();
          return {
            eligible:G.routeAftermathEvent?.()?.id||null,
            aftermath:Boolean(document.querySelector('[data-a="route-aftermath"]')),
            explore:Boolean(document.querySelector('[data-a="explore"]')),
            camp:Boolean(document.querySelector('[data-a="camp"]')),
          };
        }""",
        {"route": route, "large": large, **config},
    )
    assert result == {
        "eligible": config["event"],
        "aftermath": True,
        "explore": True,
        "camp": True,
    }
    page.evaluate("document.documentElement.classList.remove('qa-exact-replay')")
    page.locator('[data-journey-mode="local"]').click()
    action = page.locator('[data-a="route-aftermath"]')
    action.click()
    page.wait_for_function(
        "expected=>document.querySelector('#ev-sheet')?.dataset.eventId===expected",
        arg=config["event"],
    )
    page.locator('#ev-sheet .event-scroll').evaluate('(node)=>node.scrollTop=0')
    page.wait_for_function(
        """expected=>{
          const frame=document.querySelector('#ev-sheet .event-scene-frame');
          return frame?.dataset.sceneKey===expected&&frame.getBoundingClientRect().height>0;
        }""",
        arg=config["scene"],
    )
    intro_capture = CAPTURES / f"{label}-intro.png"
    page.screenshot(path=str(intro_capture), full_page=True)
    assert intro_capture.stat().st_size > 0
    page.evaluate("UI.finishStory()")
    page.wait_for_function(
        """()=>[...document.querySelectorAll('#ev-sheet [data-story-entry]')]
          .every(node=>Number(getComputedStyle(node).opacity)>.99)"""
    )
    assert page.locator('#ev-sheet .choice[data-i="2"]').is_enabled()
    assert page.evaluate(
        "eventId=>Boolean(D.scenes[D.events.find(event=>event.id===eventId).scene])",
        config["event"],
    )
    choice_capture = CAPTURES / f"{label}-choice.png"
    page.screenshot(path=str(choice_capture), full_page=True)
    assert choice_capture.stat().st_size > 0

    page.locator('#ev-sheet .choice[data-i="2"]').click()
    page.evaluate("UI.finishStory()")
    page.wait_for_function(
        """()=>[...document.querySelectorAll('#ev-sheet [data-story-entry]')]
          .every(node=>Number(getComputedStyle(node).opacity)>.99)
          &&[...document.querySelectorAll('#ev-sheet .reward-pill')]
            .every(node=>node.textContent.trim()&&Number(getComputedStyle(node).opacity)>.99)"""
    )
    result_capture = CAPTURES / f"{label}-result.png"
    page.screenshot(path=str(result_capture), full_page=True)
    assert result_capture.stat().st_size > 0


@pytest.mark.parametrize("route", ["ridge", "market"])
def test_zero_resource_handoff_stays_enabled(page, route):
    config = ROUTES[route]
    result = page.evaluate(
        """({route,node,flag})=>{
          G.newGame('onroad','무자원 출발 검수','full');
          S.at=node;S.driving=null;S.ended=false;S.used=[];S.flags[flag]=true;
          S.routePlan={id:route,status:'active',visited:[node]};
          S.items['의약품']=0;S.scrap=0;
          G.openRouteAftermath();UI.finishStory();
          return [...document.querySelectorAll('#ev-sheet .choice[data-i]')].map(button=>({
            id:D.events.find(event=>event.id===document.querySelector('#ev-sheet').dataset.eventId)
              .choices[Number(button.dataset.i)].id,
            enabled:!button.disabled,
          }));
        }""",
        {"route": route, **config},
    )
    assert result == [
        {"id": "supplies", "enabled": False},
        {"id": "work", "enabled": True},
        {"id": "handoff", "enabled": True},
    ]


@pytest.mark.parametrize(
    "route,expenses",
    [
        (
            "ridge",
            {
                "supplies": "소모 의약품 1개 · 시간 15분",
                "work": "소모 시간 90분 · 추가 피로 +4 · 시간 경과 피로 별도",
                "handoff": "소모 시간 10분",
            },
        ),
        (
            "market",
            {
                "supplies": "소모 고철 2 · 시간 20분",
                "work": "소모 시간 90분 · 추가 피로 +4 · 시간 경과 피로 별도",
                "handoff": "소모 시간 10분",
            },
        ),
    ],
)
def test_all_choices_show_exact_authored_expenses_before_selection(page, route, expenses):
    config = ROUTES[route]
    rows = page.evaluate(
        r"""({route,node,flag,event})=>{
          G.newGame('onroad','선택 비용 검수','full');
          S.at=node;S.driving=null;S.ended=false;S.used=[];S.flags[flag]=true;
          S.routePlan={id:route,status:'active',visited:[node]};
          S.items['의약품']=2;S.scrap=5;
          if(!G.openRouteAftermath()) throw Error('aftermath did not open');
          UI.finishStory();
          const definition=D.events.find(row=>row.id===event);
          return [...document.querySelectorAll('#ev-sheet .choice[data-i]')].map(button=>({
            id:definition.choices[Number(button.dataset.i)].id,
            text:button.innerText.replace(/\s+/g,' ').trim(),
          }));
        }""",
        {"route": route, **config},
    )
    assert [row["id"] for row in rows] == ["supplies", "work", "handoff"]
    for row in rows:
        assert expenses[row["id"]] in row["text"], row


@pytest.mark.parametrize(
    "route,choice_id,time_cost,fatigue_cost,medicine_cost,scrap_cost",
    [
        ("ridge", "supplies", 15, 0, 1, 0),
        ("ridge", "work", 90, 4, 0, 0),
        ("ridge", "handoff", 10, 0, 0, 0),
        ("market", "supplies", 20, 0, 0, 2),
        ("market", "work", 90, 4, 0, 0),
        ("market", "handoff", 10, 0, 0, 0),
    ],
)
def test_choice_cost_and_result_receipt_survive_reload_without_double_payment(
    page, route, choice_id, time_cost, fatigue_cost, medicine_cost, scrap_cost
):
    config = ROUTES[route]
    before = page.evaluate(
        """({route,node,flag,event,choiceId})=>{
          G.newGame('onroad','영수증 검수','full');
          S.at=node;S.driving=null;S.ended=false;S.used=[];S.flags[flag]=true;
          S.routePlan={id:route,status:'active',visited:[node]};
          S.items['의약품']=2;S.scrap=5;S.fatigue=11;
          if(!G.openRouteAftermath()) throw Error('aftermath did not open');
          UI.finishStory();
          const definition=D.events.find(row=>row.id===event);
          const index=definition.choices.findIndex(choice=>choice.id===choiceId);
          document.querySelector(`#ev-sheet .choice[data-i="${index}"]`).click();
          UI.finishStory();
          return {index,total:S.day*1440+S.min,fatigue:S.fatigue,
            medicine:S.items['의약품'],scrap:S.scrap,
            action:!!S.flags[`route_${route}_after_${choiceId}`],
            done:!!S.flags[`route_${route}_after_done`],
            receipt:{...S.pendingPresentation},notes:S.notes.length};
        }""",
        {"route": route, "choiceId": choice_id, **config},
    )
    assert before["action"] and before["done"]
    assert before["receipt"]["phase"] == "result"

    restored = page.evaluate(
        """({route,event,index})=>{
          G.save();S=null;if(!G.load()) throw Error('load failed');
          UI.restoreQaView({screen:'game'});
          if(!G.resumePresentation()) throw Error('result receipt did not resume');
          UI.finishStory();
          const definition=D.events.find(row=>row.id===event),choice=definition.choices[index];
          const replay=G.resolvePresentedChoice(definition,choice);
          return {total:S.day*1440+S.min,fatigue:S.fatigue,
            medicine:S.items['의약품'],scrap:S.scrap,notes:S.notes.length,
            phase:S.pendingPresentation?.phase,applied:replay.applied,
            eventId:document.querySelector('#ev-sheet')?.dataset.eventId||null,
            eligible:G.routeAftermathEvent?.()?.id||null};
        }""",
        {"route": route, "event": config["event"], "index": before["index"]},
    )
    expected = {
        "total": 1440 + 450 + time_cost,
        "medicine": 2 - medicine_cost,
        "scrap": 5 - scrap_cost,
    }
    for key, value in expected.items():
        assert before[key] == value, (key, before)
        assert restored[key] == value, (key, restored)
    expected_fatigue = 11 + time_cost * 0.045 + fatigue_cost
    assert before["fatigue"] == pytest.approx(expected_fatigue)
    assert restored["fatigue"] == pytest.approx(expected_fatigue)
    assert restored["notes"] == before["notes"]
    assert restored["phase"] == "result" and restored["applied"] is False
    assert restored["eventId"] == config["event"]
    assert restored["eligible"] is None


def test_authored_events_match_permanent_mechanics_and_outcome_truth(page):
    events = page.evaluate(
        """()=>['ridge','market'].map(route=>{
          const event=D.events.find(row=>row.id===`route_${route}_aftermath`);
          const flags=route==='ridge'
            ?['route_ridge_saved','route_ridge_saved_partial','route_ridge_failed']
            :['route_market_escorted','route_market_escorted_partial','route_market_failed'];
          return {
            route,id:event?.id,type:event?.type,once:event?.once,noPool:event?.noPool,
            w:event?.w,scene:event?.scene,choices:event?.choices.map(choice=>({
              id:choice.id,label:choice.label,req:choice.req||null,p:choice.out[0].p,
              fx:choice.out[0].fx,text:choice.out[0].text,turns:choice.out[0].turns,
            })),
            intros:flags.map(flag=>({
              count:event.turns({flags:{[flag]:true}}).length,
              text:event.turns({flags:{[flag]:true}}).map(turn=>turn.text).join(' '),
            })),
          };
        })"""
    )
    for row in events:
        config = ROUTES[row["route"]]
        assert row["id"] == config["event"]
        assert row["type"] == "스토리" and row["once"] is True
        assert row["noPool"] == 1 and row["w"] == 0 and row["scene"] == config["scene"]
        assert [choice["id"] for choice in row["choices"]] == ["supplies", "work", "handoff"]
        assert all(choice["p"] == 1 for choice in row["choices"])
        assert all(len(choice["turns"]) in (2, 3) for choice in row["choices"])
        for choice in row["choices"]:
            note = choice["fx"]["note"]
            assert note["type"] == "사건" and note["links"] == ["달구지"]
            assert not any(key in choice["fx"] for key in ("moodAll", "bond", "pillar", "food", "water"))
        assert all(3 <= intro["count"] <= 5 for intro in row["intros"])

    ridge_intros = [intro["text"] for intro in events[0]["intros"]]
    assert all("네 사람" in intro for intro in ridge_intros)
    assert "해열제" in ridge_intros[0] and "전부" in ridge_intros[0]
    assert "일부를 잃" in ridge_intros[1]
    assert "전부 잃" in ridge_intros[2]
    assert "무릎" not in ridge_intros[2] and "손바닥" not in ridge_intros[2]
    assert all("문경 성문 아래 보급 선반" in intro for intro in ridge_intros)

    market_intros = [intro["text"] for intro in events[1]["intros"]]
    assert "기록" in market_intros[0] and "남지" in market_intros[0]
    assert "수레" in market_intros[1] and "손상" in market_intros[1]
    assert "씨앗" in market_intros[2] and "기록" in market_intros[2]
    assert all("전주 장터 수레 수선터" in intro for intro in market_intros)
