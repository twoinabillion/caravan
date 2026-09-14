#!/usr/bin/env python3
"""Regression gate for event typography, containment, and scrollable choices."""
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
            # Match the game's 280ms double-tap guard before advancing again.
            page.wait_for_timeout(320)
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
          const scrollHost=node=>{
            for(let parent=node.parentElement;parent&&parent!==root;parent=parent.parentElement){
              if(['auto','scroll'].includes(getComputedStyle(parent).overflowY)&&parent.scrollHeight>parent.clientHeight+1) return parent;
            }
            return null;
          };
          const textNodes=[...root.querySelectorAll('.event-head h2,.turn-speaker small,.turn-speaker b,.turn-text,.chat-name,.chat-bubble,.story-narration-label,.story-narration-text,.choice-title>span:last-child,.event-result-kicker,.fx')].filter(visible);
          const clipped=textNodes.filter(node=>node.scrollWidth>node.clientWidth+1||node.scrollHeight>node.clientHeight+1).map(label);
          const outsideSurface=textNodes.filter(node=>{
            const surface=node.closest('.event-field-report,.event-result-receipt,.choice');
            if(!surface) return false;
            const box=node.getBoundingClientRect(),limit=surface.getBoundingClientRect();
            return box.left<limit.left-1||box.right>limit.right+1||(!scrollHost(node)&&(box.top<limit.top-1||box.bottom>limit.bottom+1));
          }).map(label);
          const controls=[...root.querySelectorAll('button,[role="button"]')].filter(visible);
          const escaped=controls.filter(node=>{
            const box=node.getBoundingClientRect();return box.left<-1||box.right>innerWidth+1||(!scrollHost(node)&&(box.top<-1||box.bottom>innerHeight+1));
          }).map(label);
          const small=controls.filter(node=>{
            const box=node.getBoundingClientRect();return box.width<44||box.height<44;
          }).map(label);
          // The choice dock follows the entries inside the continuous transcript.
          // :last-child now selects no entry and silently skips portrait checks.
          const lastEntry=[...root.querySelectorAll('.story-entry')].at(-1);
          const avatar=lastEntry?.querySelector('.turn-avatar,.chat-avatar');
          const prose=lastEntry?.querySelector('.turn-text,.chat-bubble');
          const speaker=lastEntry?.querySelector('.turn-speaker>span,.chat-name');
          const overlap=(a,b)=>{
            if(!a||!b||!visible(a)||!visible(b)) return false;
            const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
            return x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;
          };
          const title=root.querySelector('.event-head h2')?.getBoundingClientRect();
          const currentProse=prose?.getBoundingClientRect();
          const report=root.querySelector('.event-field-report')?.getBoundingClientRect();
          const currentAvatar=avatar?.getBoundingClientRect();
          const avatarSide=avatar?.closest('.chat-msg')?.dataset.side||'left';
          const visibleChoices=[...root.querySelectorAll('.event-choice-dock .choice[data-i]')].filter(visible);
          const narrationNode=[...root.querySelectorAll('.story-entry .story-narration-text')].at(-1);
          const rgb=value=>(value.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
          const luminance=value=>{
            const values=rgb(value).map(channel=>{const n=channel/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4;});
            return .2126*(values[0]||0)+.7152*(values[1]||0)+.0722*(values[2]||0);
          };
          const foreground=narrationNode?luminance(getComputedStyle(narrationNode).color):0;
          const background=luminance('rgb(7, 16, 27)');
          return {
            clipped,outsideSurface,escaped,small,
            geometry:{
              viewport:{width:innerWidth,height:innerHeight},
              root:root?Object.fromEntries(['top','bottom','height'].map(key=>[key,root.getBoundingClientRect()[key]])):null,
              dock:(()=>{const node=root.querySelector('.event-choice-dock');return node?Object.fromEntries(['top','bottom','height'].map(key=>[key,node.getBoundingClientRect()[key]])):null})(),
              controls:controls.map(node=>{const box=node.getBoundingClientRect();return {label:label(node),top:box.top,bottom:box.bottom,height:box.height};})
            },
            documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            avatarProseOverlap:overlap(avatar,prose),avatarSpeakerOverlap:overlap(avatar,speaker),
            titleProseDelta:title&&currentProse?Math.abs(title.x-currentProse.x):0,
            titlePaperRatio:title&&report?(title.x-report.x)/report.width:0,
            avatarPaperRatio:currentAvatar&&report?(currentAvatar.x-report.x)/report.width:0,
            avatarSide,
            titleBeforeProse:!!(title&&currentProse&&title.x<currentProse.x),
            hasPortrait:!!currentAvatar,
            visibleChoices:visibleChoices.length,
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
        if result["hasPortrait"]:
            assert 0.09 <= result["titlePaperRatio"] <= 0.15, (width, height, event_id, result)
            if result["avatarSide"] == "right":
                assert 0.6 <= result["avatarPaperRatio"] <= 0.82, (width, height, event_id, result)
            else:
                assert result["avatarPaperRatio"] <= 0.14, (width, height, event_id, result)
                assert result["titleBeforeProse"], (width, height, event_id, result)
        if event_id == "trace_consent_archive":
            assert result["narration"].endswith("낯설지 않았다."), result
        if event_id == "combat_walker_strike" and phase == "decision":
            assert result["visibleChoices"] == page.evaluate("D.events.find(e=>e.id==='combat_walker_strike').choices.length"), result
            for choice in page.locator('.event-choice-dock .choice[data-i]').all():
                choice.scroll_into_view_if_needed()
                assert choice.evaluate("""node=>{
                  const box=node.getBoundingClientRect(),list=node.closest('.choices').getBoundingClientRect();
                  return box.top>=list.top-1&&box.bottom<=list.bottom+1&&box.left>=0&&box.right<=innerWidth&&box.bottom<=innerHeight;
                }"""), (width, height, choice.inner_text(), result)
        if phase == "combat-outcome":
            assert result["narration"], result
            assert result["narrationContrast"] >= 4.5, (width, height, result)
    assert not errors, errors
    browser.close()


with sync_playwright() as playwright:
    for viewport in ((320, 578), (390, 844), (475, 948)):
        check_viewport(playwright, *viewport)
    print("✅ 이벤트 글자 정렬·프레임 containment·대비·선택지 스크롤 도달 · 18 states")
