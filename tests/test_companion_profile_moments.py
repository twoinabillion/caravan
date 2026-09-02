#!/usr/bin/env python3
"""Companion growth, road conversations, and dynamic event speakers stay legible."""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent.parent
URL = os.environ.get("CARAVAN_TEST_URL", (ROOT / "서울까지400km.html").as_uri())
SHOT_DIR = Path(os.environ.get("CARAVAN_VISUAL_SHOT_DIR", "/private/tmp/caravan-companion-moment-qa"))


def main():
    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(URL, wait_until="load")

        page.evaluate(
            """() => {
              G.newGame('onroad','검수','full');
              S.party=['minji'];
              S.comps.minji={mood:65,bond:5,lvl:0,perks:[],pending:1};
              S.at='miryang'; S.driving=null;
              document.querySelectorAll('.scr').forEach(node=>node.classList.remove('on'));
              document.querySelector('#scr-game')?.classList.add('on');
              UI.renderAll();
              document.querySelector('#dk-status')?.click();
              document.querySelector('#st-tabs [data-st="crew"]')?.click();
              document.querySelector('[data-comp2="minji"]')?.click();
            }"""
        )
        profile = page.evaluate(
            """() => {
              const choices=[...document.querySelectorAll('.comp-perk-choice')];
              const talk=document.querySelector('.comp-talk-action');
              const rects=choices.map(node=>node.getBoundingClientRect());
              const talkRect=talk?.getBoundingClientRect();
              return {
                text:document.querySelector('.companion-profile')?.innerText||'',
                choiceCount:choices.length,
                choiceWidths:rects.map(rect=>rect.width),
                copyWidths:choices.map(node=>node.querySelector('.comp-perk-copy')?.getBoundingClientRect().width||0),
                misclassified:choices.some(node=>node.classList.contains('ui-compact-choice')),
                overlap:rects.some(rect=>talkRect&&rect.bottom>talkRect.top),
                talkText:talk?.innerText||'',
                pending:S.comps.minji.pending
              };
            }"""
        )
        page.screenshot(path=str(SHOT_DIR / "minji-perk-and-talk.png"), full_page=False)

        page.locator('.comp-perk-choice').first.click()
        learned = page.evaluate(
            r"""() => ({
              pending:S.comps.minji.pending,
              level:S.comps.minji.lvl,
              chosen:document.querySelectorAll('.comp-skill-option.is-chosen').length,
              duplicate:[...document.querySelectorAll('.choice')].some(node=>/LV\.1 퍼크/.test(node.textContent||''))
            })"""
        )

        page.evaluate(
            """() => {
              document.querySelector('#ev-wrap')?.classList.remove('on');
              S._talked={minji:S.day};
              document.querySelector('#dk-status')?.click();
              document.querySelector('#st-tabs [data-st="crew"]')?.click();
              document.querySelector('[data-comp2="minji"]')?.click();
            }"""
        )
        talked = page.evaluate(
            """() => ({
              text:document.querySelector('.comp-talk-action')?.innerText||'',
              disabled:!!document.querySelector('.comp-talk-action')?.disabled
            })"""
        )

        page.evaluate(
            """() => {
              document.querySelector('#ev-wrap')?.classList.remove('on');
              document.querySelector('#ovl-status')?.classList.remove('on');
              S.at='miryang';
              const destination=Object.keys(D.nodes).find(id=>G.canTravelTo(id).ok);
              if(!destination||!G.startTravel(destination)) throw new Error('QA 주행 시작 실패');
              UI.renderAll();
            }"""
        )
        road_before = page.evaluate(
            """() => ({
              text:document.querySelector('.road-checkin')?.innerText||'',
              buttons:document.querySelectorAll('[data-road-checkin]').length,
              portrait:document.querySelector('.road-checkin-face img')?.getAttribute('alt')||''
            })"""
        )
        page.screenshot(path=str(SHOT_DIR / "road-conversation-before.png"), full_page=False)
        page.locator('[data-road-checkin="minji"]').click()
        road_after = page.evaluate(
            """() => ({
              text:document.querySelector('.road-checkin')?.innerText||'',
              buttons:document.querySelectorAll('[data-road-checkin]').length,
              selected:document.querySelector('.road-checkin-selected .road-checkin-face img')?.getAttribute('alt')||'',
              checkIn:S.driving?.checkIn||null
            })"""
        )
        page.screenshot(path=str(SHOT_DIR / "road-conversation-complete.png"), full_page=False)

        event_speakers = page.evaluate(
            """() => {
              document.querySelector('#ev-wrap')?.classList.remove('on');
              S.driving=null; S.at='pohang';
              S.party=['minji'];
              S.flags.onboarding_event_guide=true;
              const source=D.events.find(event=>event.id==='lc_pohang_gwamegi');
              const failure=source.choices[0].out[1];
              const event={...source,choices:[{...source.choices[0],out:[failure]},source.choices[1]]};
              UI.showEvent(event); UI.finishStory();
              document.querySelector('.event-choice-dock .choice[data-i="0"]')?.click();
              UI.finishStory();
              const messages=[...document.querySelectorAll('.story-chat .chat-msg')];
              return {
                names:messages.map(node=>node.querySelector('.chat-name')?.textContent||''),
                speakers:messages.map(node=>node.dataset.speaker||''),
                portraits:messages.map(node=>node.querySelector('.chat-avatar')?.getAttribute('src')||''),
                unknown:messages.some(node=>node.querySelector('.chat-name')?.textContent==='???'),
                text:document.querySelector('.story-chat')?.innerText||''
              };
            }"""
        )
        page.screenshot(path=str(SHOT_DIR / "gwamegi-two-speakers.png"), full_page=False)
        browser.close()

    assert not errors, errors
    assert profile["choiceCount"] == 2 and min(profile["choiceWidths"]) >= 250, profile
    assert min(profile["copyWidths"]) >= 180 and not profile["misclassified"], profile
    assert not profile["overlap"] and profile["pending"] == 1, profile
    assert "하나 선택" in profile["text"] and "변경 불가" in profile["text"], profile
    assert "오늘의 대화" in profile["talkText"] and "하루 한 번" in profile["talkText"], profile
    assert learned == {"pending": 0, "level": 1, "chosen": 1, "duplicate": False}, learned
    assert talked["disabled"] and "오늘 대화 완료" in talked["text"], talked
    assert road_before["buttons"] == 1 and "누구와 이야기할까?" in road_before["text"], road_before
    assert "민지" in road_before["portrait"] and "ROAD MOMENT" not in road_before["text"], road_before
    assert road_after["buttons"] == 0 and road_after["checkIn"] == "minji", road_after
    assert "이번 구간 완료" in road_after["text"] and "민지" in road_after["selected"], road_after
    assert event_speakers["speakers"] == ["minji", "passer_merchant"], event_speakers
    assert event_speakers["names"] == ["민지", "덕장 주인"], event_speakers
    assert not event_speakers["unknown"] and len(set(event_speakers["portraits"])) == 2, event_speakers
    print("✅ 동료 퍼크·일일 대화·이동 중 대화·동적 사건 화자 UI 정상")


if __name__ == "__main__":
    main()
