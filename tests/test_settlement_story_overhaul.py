#!/usr/bin/env python3
"""Regression contract for spatial cities and settlement-led companion stories."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()
SETTLEMENTS = ("gwangju", "miryang", "daegu", "muju", "jeonju", "daejeon", "suwon")
RECRUITS = {
    "gwangju": "leo",
    "miryang": "minji",
    "daegu": "kangwoo",
    "muju": "jaeyi",
    "jeonju": "parkss",
    "daejeon": "eunsu",
}


def reset_at(page, settlement):
    page.evaluate(
        """settlement => {
          document.querySelectorAll('.ovl.on,.sheet-wrap.on').forEach(node=>node.classList.remove('on'));
          S.at=settlement; S.party=[]; S.recruitQ=null; S.used=[];
          S.known=[...new Set([...S.known,settlement])];
          S.visited=[...new Set([...S.visited,settlement])];
          UI.showStl(settlement,'hub');
        }""",
        settlement,
    )
    page.wait_for_timeout(80)


def click_world(page, point):
    canvas = page.locator("#stl-town-canvas")
    box = canvas.bounding_box()
    assert box
    canvas.click(position={"x": point["x"] / 236 * box["width"], "y": point["y"] / 306 * box["height"]})


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL)
    page.evaluate(
        """() => {
          localStorage.clear(); G.newGame('onroad','다온','full');
          document.querySelectorAll('.scr,.screen').forEach(node=>node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          document.querySelector('#arrival-scene')?.classList.remove('on');
          UI.renderAll();
          clearInterval(window.__settlementTestLoop);
          window.__settlementTestLoop=setInterval(()=>SCENE.drawSettlement(.05),50);
        }"""
    )

    data_contract = page.evaluate(
        """() => Object.entries(D.recruitQuests).map(([id,def])=>{
          const event=D.events.find(row=>row.id===def.meet), location=D.eventLocations[def.meet];
          return {id,meet:def.meet,meetNode:def.meetNode,target:def.targets.find(node=>node!==def.meetNode),
            event:Boolean(event),w:event&&event.w,noPool:Boolean(event&&event.noPool),location};
        })"""
    )
    portrait_contract = page.evaluate(
        r"""() => Object.keys(D.npcs).map(id=>({
          id, name:D.npcs[id].name, src:D.portraits[id]||'',
          raster:/^data:image\/(?:png|webp);base64,/.test(D.portraits[id]||'')
        }))"""
    )
    assert len(portrait_contract) == 17
    assert all(row["raster"] for row in portrait_contract), portrait_contract
    assert len(data_contract) == 6
    for row in data_contract:
        assert row["event"] and row["w"] == 0 and row["noPool"], row
        assert row["location"]["kind"] == "node", row
        assert row["location"]["nodes"] == [row["meetNode"]], row
        assert row["target"] or row["id"] == "kangwoo", row
        if row["id"] != "kangwoo":
            assert row["target"] != row["meetNode"], row

    for settlement in SETTLEMENTS:
        reset_at(page, settlement)
        assert page.locator(".stl-town-stage").count() == 1
        assert page.locator("#stl-town-canvas").count() == 1
        assert page.locator(".stl-hotspot").count() == 4
        assert page.locator(".stl-hub-v2").evaluate("node=>node.scrollWidth===node.clientWidth")
        state = page.evaluate("SCENE.settlementState()")
        assert state["id"] == settlement and len(state["facilities"]) == 4
        assert len(state["residents"]) == len(page.evaluate("settlement=>D.stls[settlement].npcs", settlement))
        if settlement in RECRUITS:
            assert state["recruit"]["id"] == RECRUITS[settlement]

        page.click('[data-stlfocus="market"]')
        before = page.evaluate("SCENE.settlementState().target")
        page.click('[data-stlfocus="garage"]')
        after = page.evaluate("SCENE.settlementState().target")
        assert abs(before["x"] - after["x"]) > 50, (settlement, before, after)
        assert page.locator('[data-stlfocus="garage"]').get_attribute("aria-pressed") == "true"

    reset_at(page, "miryang")
    page.evaluate("UI.showStl('miryang','people')")
    for npc_id in ("byungchul", "yeongok"):
        page.click(f'[data-npc="{npc_id}"]')
        face = page.locator(".dlg.talk .npc-pimg")
        assert face.count() == 1
        assert face.evaluate(
            "img=>img.complete&&img.naturalWidth>=256&&img.naturalHeight>=256&&"
            "getComputedStyle(img).imageRendering==='auto'"
        )

    reset_at(page, "miryang")
    state = page.evaluate("SCENE.settlementState()")
    sundeok = next(person for person in state["residents"] if person["id"] == "sundeok")
    click_world(page, sundeok["p"])
    page.wait_for_timeout(2200)
    page.click('[data-npc="sundeok"]')
    assert page.locator(".dlg.talk").count() == 1
    assert "순덕" in page.locator(".dlg.talk").inner_text()

    reset_at(page, "miryang")
    state = page.evaluate("SCENE.settlementState()")
    click_world(page, state["recruit"]["p"])
    page.wait_for_timeout(2200)
    assert page.locator("#ev-wrap").get_attribute("aria-hidden") == "false"
    assert "부품 천막의 정비사" in page.locator("#ev-wrap").inner_text()

    for settlement, recruit in RECRUITS.items():
        flow = page.evaluate(
            """({settlement,recruit})=>{
              S.at=settlement; S.party=[]; S.recruitQ=null; S.driving=null;
              const started=G.startRecruitQuest(recruit), q={...S.recruitQ};
              const neighbor=D.edges.find(edge=>edge[0]===settlement||edge[1]===settlement);
              const to=neighbor[0]===settlement?neighbor[1]:neighbor[0];
              if(!S.known.includes(to)) S.known.push(to);
              const travel=G.startTravel(to);
              return {started,target:q.target,metAt:q.metAt,escort:q.escort,
                travel,drivingEscort:S.driving&&S.driving.recruitEscort};
            }""",
            {"settlement": settlement, "recruit": recruit},
        )
        assert flow["started"] and flow["escort"] and flow["metAt"] == settlement, flow
        if recruit != "kangwoo":
            assert flow["target"] != settlement, flow
        assert flow["travel"] and flow["drivingEscort"] == recruit, flow

    browser.close()

assert not errors, errors
print("✅ 7개 정착지 공간 이동 · 주민 대화 · 6명 정착지 첫 만남 · 타 도시 임시 동행")
