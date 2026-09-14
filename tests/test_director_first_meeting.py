"""First-companion discovery contracts against the built game.

Breaks caught: hiding a local first companion, exposing one from the wrong stop,
mutating the save while inspecting the invitation, bypassing the established
meeting flow, and losing the ordinary settlement concern after a decline or reload.
"""
import os
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get("CARAVAN_TEST_URL", (ROOT / "서울까지400km.html").as_uri())
CAPTURES = ROOT / "artifacts" / "director-payoff-20260914" / "task1-first-meeting"

INVITATIONS = {
    "miryang": ("minji", ("부품 천막", "용접", "시동")),
    "jeonju": ("parkss", ("진료 버스", "냉장 상자")),
    "gwangju": ("leo", ("모닥불", "기타", "개 짖는 소리")),
    "muju": ("jaeyi", ("리어카", "달구지 아래")),
    "daejeon": ("eunsu", ("옥상", "안테나", "남쪽 번호판")),
    "daegu": ("kangwoo", ("돔 입구", "경비", "지도")),
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
    page.goto(URL)
    page.evaluate("G.newGame('onroad','첫 만남 검수','full')")
    yield page
    assert not errors, errors
    page.close()


@pytest.mark.parametrize("settlement_id", list(INVITATIONS))
def test_each_recruitment_settlement_exposes_its_local_candidate_without_mutating_state(
    page, settlement_id
):
    companion_id, physical_cues = INVITATIONS[settlement_id]
    result = page.evaluate(
        """settlementId=>{
          S.at=settlementId;S.driving=null;S.ended=false;S.party=[];
          S.recruitQ=null;S.used=[];
          const before=JSON.stringify(S);
          const invitation=G.firstCompanionInvitation?.(settlementId);
          const event=D.events.find(item=>item.id===D.recruitQuests[invitation?.id]?.meet);
          return {invitation,same:before===JSON.stringify(S),party:S.party,
            reusesEventTitle:invitation?.title===event?.title};
        }""",
        settlement_id,
    )
    assert result["invitation"]["id"] == companion_id
    assert result["reusesEventTitle"]
    assert result["same"] and result["party"] == []
    assert all(cue in result["invitation"]["line"] for cue in physical_cues)
    assert result["invitation"]["line"].endswith("말을 걸어 볼까?")
    assert not any(
        reward_pitch in result["invitation"]["line"]
        for reward_pitch in ("보상", "합류한다", "효과", "소모", "획득")
    )


def test_invitation_requires_the_actual_unoccupied_unencountered_stopped_settlement(page):
    result = page.evaluate(
        """()=>{
          const reset=()=>{
            G.newGame('onroad','초대 가드 검수','full');
            S.at='miryang';S.driving=null;S.ended=false;S.party=[];
            S.recruitQ=null;S.used=[];
          };
          const out={};
          reset();out.wrongSettlement=G.firstCompanionInvitation?.('jeonju')??null;
          reset();S.driving={from:'miryang',to:'ulsan',dist:10,gone:1};
          out.driving=G.firstCompanionInvitation?.('miryang')??null;
          reset();S.party=['leo'];out.party=G.firstCompanionInvitation?.('miryang')??null;
          reset();S.recruitQ={id:'leo',stage:'task'};
          out.recruitQ=G.firstCompanionInvitation?.('miryang')??null;
          reset();S.used.push(D.recruitQuests.minji.meet);
          out.used=G.firstCompanionInvitation?.('miryang')??null;
          return out;
        }"""
    )
    assert result == {
        "wrongSettlement": None,
        "driving": None,
        "party": None,
        "recruitQ": None,
        "used": None,
    }


@pytest.mark.parametrize(
    "width,height,large,label",
    [(320, 740, False, "320"), (390, 844, True, "390-large"), (1440, 1000, False, "desktop")],
)
def test_hub_invitation_is_visible_and_opens_the_existing_meeting_without_payment(
    page, width, height, large, label
):
    CAPTURES.mkdir(parents=True, exist_ok=True)
    page.set_viewport_size({"width": width, "height": height})
    before = page.evaluate(
        """({large})=>{
          S.at='miryang';S.min=720;S.driving=null;S.ended=false;
          S.party=[];S.recruitQ=null;S.used=[];
          document.documentElement.classList.toggle('ui-large-text',large);
          UI.restoreQaView({screen:'game'});
          document.documentElement.classList.remove('qa-exact-replay');
          UI.showStl('miryang','hub');
          return JSON.stringify({party:S.party,recruitQ:S.recruitQ,scrap:S.scrap,
            fuel:S.fuel,water:S.water,food:S.food,items:S.items});
        }""",
        {"large": large},
    )
    invitation = page.locator('[data-first-companion="minji"]')
    assert invitation.count() == 1
    invitation.wait_for(state="visible")
    assert "말 걸기 →" in invitation.inner_text()
    assert "부품 천막의 정비사" in invitation.inner_text()
    assert all(cue in invitation.inner_text() for cue in INVITATIONS["miryang"][1])
    box = invitation.bounding_box()
    assert box and box["x"] >= 0 and box["x"] + box["width"] <= width + 1
    assert not page.evaluate(
        """()=>{const node=document.querySelector('[data-first-companion]');
          return node.scrollWidth>node.clientWidth+1||node.scrollHeight>node.clientHeight+1;}"""
    )
    capture = CAPTURES / f"miryang-first-companion-{label}.png"
    page.wait_for_timeout(250)
    page.screenshot(path=str(capture))
    assert capture.stat().st_size > 0

    invitation.click()
    page.wait_for_function(
        "document.querySelector('#ev-sheet')?.dataset.eventId==='meet_scrapyard'"
    )
    after = page.evaluate(
        """()=>JSON.stringify({party:S.party,recruitQ:S.recruitQ,scrap:S.scrap,
          fuel:S.fuel,water:S.water,food:S.food,items:S.items})"""
    )
    assert after == before
    assert page.locator("#ev-wrap").get_attribute("aria-hidden") == "false"


def test_declining_the_meeting_restores_the_ordinary_concern_and_exit(page):
    page.evaluate(
        """()=>{
          S.at='jeonju';S.min=720;S.driving=null;S.ended=false;
          S.party=[];S.recruitQ=null;S.used=[];
          UI.restoreQaView({screen:'game'});UI.showStl('jeonju','hub');
        }"""
    )
    page.locator('[data-first-companion="parkss"]').click()
    page.evaluate("UI.finishStory()")
    page.locator('#ev-sheet .choice[data-i="1"]').click()
    page.evaluate("UI.finishStory()")
    page.locator('#ev-sheet [data-r="ok"]').click()

    page.evaluate("UI.showStl('jeonju','hub')")
    concern = page.locator("[data-stl-concern]")
    assert concern.count() == 1
    assert page.locator("[data-first-companion]").count() == 0
    assert "말 걸기" not in concern.inner_text()
    assert page.evaluate(
        """()=>S.used.includes(D.recruitQuests.parkss.meet)
          &&S.party.length===0&&S.recruitQ===null"""
    )

    concern.click()
    assert page.locator('[data-field-board="alley"]').count() == 1
    page.locator("#stl-hub-back").click()
    page.locator("#stl-out").click()
    assert page.locator("#ovl-stl").get_attribute("aria-hidden") == "true"


def test_real_decline_survives_the_first_browser_reload_and_keeps_people_reentry(page):
    page.evaluate(
        """()=>{
          S.at='jeonju';S.min=720;S.driving=null;S.ended=false;
          S.party=[];S.recruitQ=null;S.used=[];
          UI.restoreQaView({screen:'game'});UI.showStl('jeonju','hub');
        }"""
    )
    page.locator('[data-first-companion="parkss"]').click()
    page.evaluate("UI.finishStory()")
    page.locator('#ev-sheet .choice[data-i="1"]').click()
    page.evaluate("UI.finishStory()")
    page.locator('#ev-sheet [data-r="ok"]').click()
    assert page.evaluate("S.used.includes(D.recruitQuests.parkss.meet)")
    page.evaluate("G.save()")

    page.reload()
    continue_button = page.locator("#bt-continue")
    continue_button.wait_for(state="visible")
    continue_button.click()
    page.wait_for_function("S!==null&&S.name==='첫 만남 검수'")
    page.evaluate("UI.showStl('jeonju','hub')")

    assert page.evaluate(
        """()=>S.flags.recruit_migration_v2===true
          &&S.used.includes(D.recruitQuests.parkss.meet)
          &&S.party.length===0&&S.recruitQ===null"""
    )
    assert page.locator('[data-first-companion="parkss"]').count() == 0
    concern = page.locator("[data-stl-concern]")
    assert concern.count() == 1 and "말 걸기" not in concern.inner_text()
    page.evaluate("UI.showStl('jeonju','people')")
    assert page.locator('[data-person-key="recruit-parkss"]').count() == 1


def test_markerless_legacy_save_migrates_once_then_preserves_a_new_encounter(page):
    result = page.evaluate(
        """()=>{
          G.newGame('onroad','옛 영입 저장','full');
          const meet=D.recruitQuests.parkss.meet;
          const legacy=JSON.parse(JSON.stringify(S));
          legacy.at='jeonju';legacy.used=[meet];legacy.party=[];legacy.recruitQ=null;
          delete legacy.flags.recruit_migration_v2;
          localStorage.setItem(SAVE_KEY,JSON.stringify(legacy));S=null;
          const firstLoaded=G.load();
          const first={loaded:firstLoaded,marker:S.flags.recruit_migration_v2===true,
            cleared:!S.used.includes(meet),invitation:G.firstCompanionInvitation('jeonju')?.id};
          const opened=G.openRecruitMeet('parkss');
          G.save();S=null;
          const secondLoaded=G.load();
          return {first,opened,second:{loaded:secondLoaded,
            marker:S.flags.recruit_migration_v2===true,used:S.used.includes(meet),
            invitation:G.firstCompanionInvitation('jeonju')}};
        }"""
    )
    assert result == {
        "first": {
            "loaded": True,
            "marker": True,
            "cleared": True,
            "invitation": "parkss",
        },
        "opened": True,
        "second": {"loaded": True, "marker": True, "used": True, "invitation": None},
    }
