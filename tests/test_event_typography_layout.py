#!/usr/bin/env python3
"""Regression gate for event typography, containment, and small-screen paging."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()


CASES = (
    ("story_family_key", "turn", 3),
    ("story_family_principle", "turn", 7),
    ("trace_consent_archive", "turn", 2),
    ("combat_walker_strike", "decision", 0),
    ("story_family_key", "outcome", 0),
    ("combat_walker_strike", "combat-outcome", 0),
)


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "글자 회귀")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def open_case(page, event_id, phase, index):
    page.evaluate("id => UI.showEvent(D.events.find(event => event.id === id))", event_id)
    if phase in ("decision", "outcome", "combat-outcome"):
        page.evaluate("UI.finishStory()")
    else:
        for _ in range(index):
            page.click(".story-next")
            page.wait_for_timeout(30)
    if phase in ("outcome", "combat-outcome"):
        page.evaluate("document.querySelector('.event-choice-dock .choice[data-i]:not([disabled])').click()")
    page.wait_for_timeout(70)


def layout(page):
    return page.evaluate(
        r"""() => {
          const root=document.querySelector('#ev-sheet');
          const visible=node=>{
            const style=getComputedStyle(node),box=node.getBoundingClientRect();
            return style.display!=='none'&&style.visibility!=='hidden'&&box.width>0&&box.height>0;
          };
          const label=node=>String(node.textContent||node.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,100);
          const textNodes=[...root.querySelectorAll('.event-head h2,.turn-speaker small,.turn-speaker b,.turn-text,.chat-name,.chat-bubble,.story-narration-label,.story-narration-text,.choice-title>span:last-child,.event-result-kicker,.fx')].filter(visible);
          const clipped=textNodes.filter(node=>node.scrollWidth>node.clientWidth+1||node.scrollHeight>node.clientHeight+1).map(label);
          const outsideSurface=textNodes.filter(node=>{
            const surface=node.closest('.event-field-report,.event-result-receipt,.choice');
            if(!surface) return false;
            const box=node.getBoundingClientRect(),limit=surface.getBoundingClientRect();
            return box.left<limit.left-1||box.right>limit.right+1||box.top<limit.top-1||box.bottom>limit.bottom+1;
          }).map(label);
          const controls=[...root.querySelectorAll('button,[role="button"]')].filter(visible);
          const escaped=controls.filter(node=>{
            const box=node.getBoundingClientRect();return box.left<-1||box.right>innerWidth+1||box.top<-1||box.bottom>innerHeight+1;
          }).map(label);
          const small=controls.filter(node=>{
            const box=node.getBoundingClientRect();return box.width<44||box.height<44;
          }).map(label);
          const avatar=root.querySelector('.story-entry:last-child .turn-avatar,.story-entry:last-child .chat-avatar');
          const prose=root.querySelector('.story-entry:last-child .turn-text,.story-entry:last-child .chat-bubble');
          const speaker=root.querySelector('.story-entry:last-child .turn-speaker>span,.story-entry:last-child .chat-name');
          const overlap=(a,b)=>{
            if(!a||!b||!visible(a)||!visible(b)) return false;
            const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
            return x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;
          };
          const title=root.querySelector('.event-head h2')?.getBoundingClientRect();
          const currentProse=prose?.getBoundingClientRect();
          const pager=root.querySelector('[data-choice-pages]:not([hidden])');
          const visibleChoices=[...root.querySelectorAll('.event-choice-dock .choice[data-i]')].filter(visible);
          const narrationNode=root.querySelector('.story-entry:last-child .story-narration-text');
          const rgb=value=>(value.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
          const luminance=value=>{
            const values=rgb(value).map(channel=>{const n=channel/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4;});
            return .2126*(values[0]||0)+.7152*(values[1]||0)+.0722*(values[2]||0);
          };
          const foreground=narrationNode?luminance(getComputedStyle(narrationNode).color):0;
          const background=luminance('rgb(7, 16, 27)');
          return {
            clipped,outsideSurface,escaped,small,
            documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            avatarProseOverlap:overlap(avatar,prose),avatarSpeakerOverlap:overlap(avatar,speaker),
            titleProseDelta:title&&currentProse?Math.abs(title.x-currentProse.x):0,
            visibleChoices:visibleChoices.length,
            page:Number(pager?.querySelector('[data-choice-page]')?.textContent||0),
            pages:Number(pager?.querySelector('[data-choice-total]')?.textContent||0),
            narration:narrationNode?.textContent.trim()||'',
            narrationColor:narrationNode?getComputedStyle(narrationNode).color:'',
            narrationContrast:(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)
          };
        }"""
    )


def check_viewport(playwright, width, height):
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": width, "height": height})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.add_init_script("localStorage.clear();localStorage.setItem('caravan_story_auto','0')")
    enter_game(page)
    for event_id, phase, index in CASES:
        open_case(page, event_id, phase, index)
        result = layout(page)
        assert not result["clipped"], (width, height, event_id, result)
        assert not result["outsideSurface"], (width, height, event_id, result)
        assert not result["escaped"], (width, height, event_id, result)
        assert not result["small"], (width, height, event_id, result)
        assert not result["documentOverflow"], (width, height, event_id, result)
        assert not result["avatarProseOverlap"], (width, height, event_id, result)
        assert not result["avatarSpeakerOverlap"], (width, height, event_id, result)
        if event_id in ("story_family_key", "story_family_principle") and phase == "turn":
            assert result["titleProseDelta"] <= 18, (width, height, event_id, result)
        if event_id == "trace_consent_archive":
            assert result["narration"].endswith("낯설지 않았다."), result
        if event_id == "combat_walker_strike" and phase == "decision":
            assert 1 <= result["visibleChoices"] <= (2 if width < 350 or height < 650 else 3), result
            assert result["page"] == 1 and result["pages"] >= 2, result
        if phase == "combat-outcome":
            assert result["narration"], result
            assert result["narrationContrast"] >= 4.5, (width, height, result)
    assert not errors, errors
    browser.close()


with sync_playwright() as playwright:
    for viewport in ((320, 578), (390, 844), (475, 948)):
        check_viewport(playwright, *viewport)
    print("✅ 이벤트 글자 정렬·프레임 containment·대비·선택지 paging · 18 states")
